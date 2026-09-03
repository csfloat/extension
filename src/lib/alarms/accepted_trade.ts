import {TradeHistoryStatus} from '../bridge/handlers/trade_history_status';
import {StorageKey} from '../storage/keys';
import {gStore} from '../storage/store';
import {SlimTrade, TradeState} from '../types/float_market';
import {TradeStatus} from '../types/steam_constants';
import {reportTradeError} from './error_report';
import {isBackgroundNotaryAcceptedEnabled, proveTradesInBackground} from './notary';

interface AcceptedTradeInfo {
    steamTrade: TradeHistoryStatus;
    csfloatTrade: SlimTrade;
}

// The ping alarm runs every 3 minutes; if the server declines a sale, accepted_proof_verified_at stays null,
// so without this we would re-prove the same sale every tick.
export const ACCEPTED_PROOF_RETRY_MS = 6 * 60 * 60 * 1000;

/**
 * Pending sales whose most recent Steam trade is committed/complete inside trade protection and not yet proven.
 * Keep in sync with phoenix: src/app/trades/accepted-proof.ts (selectAcceptedTradesToProve)
 */
export function findAcceptedTrades(
    pendingTrades: SlimTrade[],
    tradeHistory: TradeHistoryStatus[],
    sellerSteamID: string
): AcceptedTradeInfo[] {
    const results: AcceptedTradeInfo[] = [];

    for (const csfloatTrade of pendingTrades) {
        if (
            csfloatTrade.state !== TradeState.PENDING ||
            csfloatTrade.seller_id !== sellerSteamID ||
            !csfloatTrade.accepted_at ||
            csfloatTrade.accepted_proof_verified_at
        ) {
            continue;
        }

        const assetID = csfloatTrade.contract.item.asset_id;
        const candidates = tradeHistory.filter(
            (steamTrade) =>
                !!steamTrade.time_init &&
                steamTrade.other_party_id === csfloatTrade.buyer_id &&
                steamTrade.given_assets.some((asset) => asset.asset_id === assetID)
        );
        if (candidates.length === 0) {
            continue;
        }

        // Most recent attempt wins, same as the server, so a later rollback/failure blocks an older acceptance
        const latest = candidates.reduce((a, b) => (b.time_init > a.time_init ? b : a));
        const acceptedAtSec = Math.floor(new Date(csfloatTrade.accepted_at).getTime() / 1000);

        if (
            (latest.status !== TradeStatus.Committed && latest.status !== TradeStatus.Complete) ||
            latest.rollback_trade ||
            !latest.time_settlement ||
            latest.time_init < acceptedAtSec
        ) {
            continue;
        }

        results.push({steamTrade: latest, csfloatTrade});
    }

    return results;
}

type AttemptMap = Record<string, number>;

/**
 * Drops sales attempted within the retry window and forgets sales that are no longer candidates.
 */
export function filterDueForProof(
    acceptedTrades: AcceptedTradeInfo[],
    attempts: AttemptMap,
    now: number
): {due: AcceptedTradeInfo[]; attempts: AttemptMap} {
    const due = acceptedTrades.filter(
        (t) => !attempts[t.csfloatTrade.id] || attempts[t.csfloatTrade.id] <= now - ACCEPTED_PROOF_RETRY_MS
    );
    const pruned: AttemptMap = {};
    for (const t of acceptedTrades) {
        if (attempts[t.csfloatTrade.id]) {
            pruned[t.csfloatTrade.id] = attempts[t.csfloatTrade.id];
        }
    }
    return {due, attempts: pruned};
}

export async function pingAcceptedTrades(
    pendingTrades: SlimTrade[],
    tradeHistory: TradeHistoryStatus[],
    sellerSteamID?: string | null
) {
    if (!pendingTrades?.length || !tradeHistory?.length || !sellerSteamID) {
        return;
    }

    const acceptedTrades = findAcceptedTrades(pendingTrades, tradeHistory, sellerSteamID);
    if (acceptedTrades.length === 0 || !(await isBackgroundNotaryAcceptedEnabled())) {
        return;
    }

    const now = Date.now();
    const storedAttempts =
        (await gStore.getWithStorage<AttemptMap>(chrome.storage.local, StorageKey.NOTARY_ACCEPTED_PROOF_ATTEMPTS)) ||
        {};
    const {due, attempts} = filterDueForProof(acceptedTrades, storedAttempts, now);
    if (due.length === 0) {
        return;
    }

    const lastFailure = await gStore.getWithStorage<number>(
        chrome.storage.local,
        StorageKey.LAST_NOTARY_BG_PROOF_FAILURE
    );
    if (lastFailure && lastFailure > now - 60 * 60 * 1000) {
        console.log('skipping accepted-trade notary proof, last failure was less than 60 minutes ago');
        return;
    }

    try {
        // One proof spans the whole set, so include every candidate even if only some are due
        await proveTradesInBackground(acceptedTrades.map((acceptedTrade) => acceptedTrade.steamTrade));
        for (const t of acceptedTrades) {
            attempts[t.csfloatTrade.id] = now;
        }
        await gStore.setWithStorage(chrome.storage.local, StorageKey.NOTARY_ACCEPTED_PROOF_ATTEMPTS, attempts);
        console.log(`proved ${acceptedTrades.length} accepted trade(s) via notary`);
    } catch (e) {
        console.error('accepted-trade notary proving failed', e);
        await gStore.setWithStorage(chrome.storage.local, StorageKey.LAST_NOTARY_BG_PROOF_FAILURE, now);
        reportTradeError(due[0].csfloatTrade.id, `background extension accepted-trade notary failed: ${e}`);
    }
}
