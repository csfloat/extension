import {OfferStatus} from '../bridge/handlers/trade_offer_status';
import {NotaryProveRequest, ProofType} from '../notary/types';
import {StorageKey} from '../storage/keys';
import {gStore} from '../storage/store';
import {SlimTrade, TradeState} from '../types/float_market';
import {TradeOfferState} from '../types/steam_constants';
import {reportTradeError} from './error_report';
import {isBackgroundNotaryOfferStateEnabled, submitNotaryProof} from './notary';
import {allOffers, SentAndReceivedOffers} from './trade_offer';

// Re-prove the same (trade, locally observed offer state) at most this often
const PROOF_INTERVAL_MS = 6 * 60 * 60 * 1000;
// Buyers only prove offers that changed at least this long ago, giving the seller's telemetry first crack
export const BUYER_MIN_OFFER_AGE_MS = 5 * 60 * 1000;

export interface OfferStateCandidate {
    csfloatTrade: SlimTrade;
    isBuyer: boolean;
    // State of the offer as seen by this user on Steam, undefined if not visible to them
    localState?: TradeOfferState;
}

/**
 * Picks pending trades worth proving:
 * - Buyer: the offer state Steam shows them differs from what CSFloat has (seller telemetry offline).
 *   An offer that is not visible to the buyer is only a divergence if CSFloat thinks it is in progress.
 * - Either party: the trade is waiting on a cancel ping and the offer is no longer active.
 * Buyers skip offers that changed less than BUYER_MIN_OFFER_AGE_MS ago so the seller's own ping can resolve it.
 * Accepted offers are skipped since the trade history proof owns that transition.
 */
export function findOfferStateCandidates(
    pendingTrades: SlimTrade[],
    offers: OfferStatus[],
    steamID: string,
    now = Date.now()
): OfferStateCandidate[] {
    const candidates: OfferStateCandidate[] = [];

    for (const trade of pendingTrades) {
        if (trade.state !== TradeState.PENDING || !trade.steam_offer?.id) {
            continue;
        }

        const serverState = trade.steam_offer.state;
        const localOffer = offers.find((e) => e.offer_id === trade.steam_offer.id);
        const localState = localOffer?.state;
        if (serverState === TradeOfferState.Accepted || localState === TradeOfferState.Accepted) {
            continue;
        }

        const isBuyer = trade.buyer_id === steamID;
        const serverThinksVisible = serverState === TradeOfferState.Active || serverState === TradeOfferState.InEscrow;
        const buyerDiverged = isBuyer && (localState !== undefined ? localState !== serverState : serverThinksVisible);
        const waitingOnCancel = !!trade.wait_for_cancel_ping && localState !== TradeOfferState.Active;
        if (!buyerDiverged && !waitingOnCancel) {
            continue;
        }

        if (isBuyer && now - offerLastChangedMs(trade, localOffer) < BUYER_MIN_OFFER_AGE_MS) {
            continue;
        }

        candidates.push({csfloatTrade: trade, isBuyer, localState});
    }

    return candidates;
}

// Steam's time_updated if the offer is visible, otherwise the last change CSFloat knows about
function offerLastChangedMs(trade: SlimTrade, localOffer?: OfferStatus): number {
    if (localOffer?.time_updated) {
        return localOffer.time_updated * 1000;
    }

    return new Date(trade.steam_offer.updated_at || trade.steam_offer.sent_at || trade.created_at).getTime();
}

/**
 * One GetTradeOffer proof for a single candidate, otherwise a single GetTradeOffers proof covering every
 * candidate. Same unfiltered dump the untrusted ping reads, so the server sees the offers we evaluated.
 */
export function buildOfferStateProveRequest(candidates: OfferStateCandidate[]): NotaryProveRequest {
    if (candidates.length === 1) {
        return {type: ProofType.TRADE_OFFER, tradeofferid: candidates[0].csfloatTrade.steam_offer.id};
    }

    return {
        type: ProofType.TRADE_OFFERS,
        get_sent_offers: candidates.some((c) => !c.isBuyer),
        get_received_offers: candidates.some((c) => c.isBuyer),
    };
}

/**
 * Submits notarized trade offer proofs so CSFloat can update the Steam offer state from trusted data.
 * Lets a buyer supply offer state when the seller's telemetry is offline, and gives both parties a way
 * to settle a trade that is waiting on a cancel ping without relying on untrusted pings.
 *
 * @param tradeOffers Sent + received offers already fetched for this alarm run
 */
export async function proveOfferStates(pendingTrades: SlimTrade[], tradeOffers: SentAndReceivedOffers | null) {
    const steamID = tradeOffers?.steam_id;
    if (!steamID || !pendingTrades.some((e) => e.state === TradeState.PENDING && e.steam_offer?.id)) {
        return;
    }

    if (!(await isBackgroundNotaryOfferStateEnabled())) {
        return;
    }

    const lastFailure = await gStore.getWithStorage<number>(
        chrome.storage.local,
        StorageKey.LAST_NOTARY_BG_PROOF_FAILURE
    );
    if (lastFailure && lastFailure > Date.now() - 60 * 60 * 1000) {
        console.log('skipping offer state notary proof, last failure was less than 60 minutes ago');
        return;
    }

    const now = Date.now();
    const attempts: Record<string, number> = Object.fromEntries(
        Object.entries(
            (await gStore.getWithStorage<Record<string, number>>(
                chrome.storage.local,
                StorageKey.NOTARY_OFFER_STATE_PROOF_ATTEMPTS
            )) || {}
        ).filter(([, ts]) => ts > now - PROOF_INTERVAL_MS)
    );

    const candidates = findOfferStateCandidates(pendingTrades, allOffers(tradeOffers), steamID, now).filter(
        (c) => !attempts[`${c.csfloatTrade.id}:${c.localState ?? 'none'}`]
    );
    if (candidates.length === 0) {
        return;
    }

    for (const c of candidates) {
        attempts[`${c.csfloatTrade.id}:${c.localState ?? 'none'}`] = now;
    }
    await gStore.setWithStorage(chrome.storage.local, StorageKey.NOTARY_OFFER_STATE_PROOF_ATTEMPTS, attempts);

    try {
        await submitNotaryProof(buildOfferStateProveRequest(candidates));
        console.log(`proved offer state for ${candidates.length} trade(s) via notary`);
    } catch (e) {
        console.error('offer state notary proving failed', e);
        await gStore.setWithStorage(chrome.storage.local, StorageKey.LAST_NOTARY_BG_PROOF_FAILURE, Date.now());
        reportTradeError(candidates[0].csfloatTrade.id, `background extension offer state notary failed: ${e}`);
    }
}
