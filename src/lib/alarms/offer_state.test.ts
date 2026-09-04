import {describe, expect, it} from 'vitest';
import {OfferStatus} from '../bridge/handlers/trade_offer_status';
import {ProofType} from '../notary/types';
import {SlimTrade, TradeState} from '../types/float_market';
import {TradeOfferState} from '../types/steam_constants';
import {BUYER_MIN_OFFER_AGE_MS, buildOfferStateProveRequest, findBuyerOfferStateCandidates} from './offer_state';

const sellerID = '76561198000000000';
const buyerID = '76561198111111111';
const offerID = '9340135296';
const now = 1_800_000_000_000;
// Old enough that the minimum offer age never applies unless a test sets a fresh time_updated
const sentAt = new Date(now - 2 * BUYER_MIN_OFFER_AGE_MS).toISOString();

function trade(state: TradeOfferState, waitForCancelPing = false, id = 'csfloat-trade-id'): SlimTrade {
    return {
        id,
        state: TradeState.PENDING,
        seller_id: sellerID,
        buyer_id: buyerID,
        contract: {item: {asset_id: '3899876543210123456', market_hash_name: 'AK-47 | Redline'}},
        steam_offer: {id: offerID, state, sent_at: sentAt},
        wait_for_cancel_ping: waitForCancelPing,
    } as SlimTrade;
}

function offer(state: TradeOfferState, ageMs = 2 * BUYER_MIN_OFFER_AGE_MS): OfferStatus {
    return {offer_id: offerID, state, time_updated: Math.floor((now - ageMs) / 1000)};
}

describe('buyer offer state notary candidates', () => {
    it('proves when the visible offer state differs from CSFloat', () => {
        const t = trade(TradeOfferState.CreatedNeedsConfirmation);
        expect(findBuyerOfferStateCandidates([t], [offer(TradeOfferState.Active)], now)).toEqual([
            {csfloatTrade: t, localState: TradeOfferState.Active},
        ]);
    });

    it('proves when CSFloat thinks the offer is active but it is not visible', () => {
        const t = trade(TradeOfferState.Active);
        expect(findBuyerOfferStateCandidates([t], [], now)).toEqual([{csfloatTrade: t, localState: undefined}]);
    });

    it('gives seller telemetry first crack: skips offers that changed under 5 minutes ago', () => {
        const t = trade(TradeOfferState.CreatedNeedsConfirmation);
        const fresh = offer(TradeOfferState.Active, BUYER_MIN_OFFER_AGE_MS - 1000);
        expect(findBuyerOfferStateCandidates([t], [fresh], now)).toEqual([]);
    });

    it('does not treat an unconfirmed offer that the buyer cannot see as a divergence', () => {
        expect(findBuyerOfferStateCandidates([trade(TradeOfferState.CreatedNeedsConfirmation)], [], now)).toEqual([]);
    });

    it('proves when waiting on a cancel ping and the offer is gone', () => {
        const t = trade(TradeOfferState.CreatedNeedsConfirmation, true);
        expect(findBuyerOfferStateCandidates([t], [], now)).toEqual([{csfloatTrade: t, localState: undefined}]);
    });

    it('does not prove when waiting on a cancel ping but the offer is still active', () => {
        const t = trade(TradeOfferState.Active, true);
        expect(findBuyerOfferStateCandidates([t], [offer(TradeOfferState.Active)], now)).toEqual([]);
    });

    it('skips accepted offers since trade history owns that transition', () => {
        const t = trade(TradeOfferState.Active, true);
        expect(findBuyerOfferStateCandidates([t], [offer(TradeOfferState.Accepted)], now)).toEqual([]);
    });

    it('ignores trades without an annotated offer', () => {
        const t = {...trade(TradeOfferState.Active), steam_offer: {}} as SlimTrade;
        expect(findBuyerOfferStateCandidates([t], [], now)).toEqual([]);
    });
});

describe('offer state prove request', () => {
    it('proves a single offer directly', () => {
        expect(buildOfferStateProveRequest([{csfloatTrade: trade(TradeOfferState.Active)}])).toEqual({
            type: ProofType.TRADE_OFFER,
            tradeofferid: offerID,
        });
    });

    it('batches multiple offers into one unfiltered GetTradeOffers proof of received offers', () => {
        expect(
            buildOfferStateProveRequest([
                {csfloatTrade: trade(TradeOfferState.Active, false, 'a')},
                {csfloatTrade: trade(TradeOfferState.Active, true, 'b')},
            ])
        ).toEqual({type: ProofType.TRADE_OFFERS, get_sent_offers: false, get_received_offers: true});
    });
});
