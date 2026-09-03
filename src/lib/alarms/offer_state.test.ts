import {describe, expect, it} from 'vitest';
import {OfferStatus} from '../bridge/handlers/trade_offer_status';
import {ProofType} from '../notary/types';
import {SlimTrade, TradeState} from '../types/float_market';
import {TradeOfferState} from '../types/steam_constants';
import {BUYER_MIN_OFFER_AGE_MS, buildOfferStateProveRequest, findOfferStateCandidates} from './offer_state';

const sellerID = '76561198000000000';
const buyerID = '76561198111111111';
const offerID = '9340135296';
const now = 1_800_000_000_000;
// Old enough that the buyer-side minimum age never applies unless a test sets a fresh time_updated
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

describe('offer state notary candidates', () => {
    it('proves as buyer when the visible offer state differs from CSFloat', () => {
        const t = trade(TradeOfferState.CreatedNeedsConfirmation);
        expect(findOfferStateCandidates([t], [offer(TradeOfferState.Active)], buyerID, now)).toEqual([
            {csfloatTrade: t, isBuyer: true, localState: TradeOfferState.Active},
        ]);
    });

    it('proves as buyer when CSFloat thinks the offer is active but it is not visible', () => {
        const t = trade(TradeOfferState.Active);
        expect(findOfferStateCandidates([t], [], buyerID, now)).toEqual([
            {csfloatTrade: t, isBuyer: true, localState: undefined},
        ]);
    });

    it('gives seller telemetry first crack: buyer skips offers that changed under 5 minutes ago', () => {
        const t = trade(TradeOfferState.CreatedNeedsConfirmation);
        const fresh = offer(TradeOfferState.Active, BUYER_MIN_OFFER_AGE_MS - 1000);
        expect(findOfferStateCandidates([t], [fresh], buyerID, now)).toEqual([]);
    });

    it('does not apply the minimum age to the seller', () => {
        const t = trade(TradeOfferState.Active, true);
        const fresh = offer(TradeOfferState.Canceled, 1000);
        expect(findOfferStateCandidates([t], [fresh], sellerID, now)).toHaveLength(1);
    });

    it('does not treat an unconfirmed offer that the buyer cannot see as a divergence', () => {
        expect(findOfferStateCandidates([trade(TradeOfferState.CreatedNeedsConfirmation)], [], buyerID, now)).toEqual(
            []
        );
    });

    it('does not prove as seller on divergence alone since seller telemetry already reports it', () => {
        const t = trade(TradeOfferState.CreatedNeedsConfirmation);
        expect(findOfferStateCandidates([t], [offer(TradeOfferState.Active)], sellerID, now)).toEqual([]);
    });

    it('proves for either party when waiting on a cancel ping and the offer is gone', () => {
        const t = trade(TradeOfferState.CreatedNeedsConfirmation, true);
        expect(findOfferStateCandidates([t], [], sellerID, now)).toEqual([
            {csfloatTrade: t, isBuyer: false, localState: undefined},
        ]);
    });

    it('does not prove when waiting on a cancel ping but the offer is still active', () => {
        const t = trade(TradeOfferState.Active, true);
        expect(findOfferStateCandidates([t], [offer(TradeOfferState.Active)], sellerID, now)).toEqual([]);
    });

    it('skips accepted offers since trade history owns that transition', () => {
        const t = trade(TradeOfferState.Active, true);
        expect(findOfferStateCandidates([t], [offer(TradeOfferState.Accepted)], buyerID, now)).toEqual([]);
    });

    it('ignores trades without an annotated offer', () => {
        const t = {...trade(TradeOfferState.Active), steam_offer: {}} as SlimTrade;
        expect(findOfferStateCandidates([t], [], buyerID, now)).toEqual([]);
    });
});

describe('offer state prove request', () => {
    it('proves a single offer directly', () => {
        expect(buildOfferStateProveRequest([{csfloatTrade: trade(TradeOfferState.Active), isBuyer: true}])).toEqual({
            type: ProofType.TRADE_OFFER,
            tradeofferid: offerID,
        });
    });

    it('batches multiple offers into one unfiltered GetTradeOffers proof for the roles involved', () => {
        expect(
            buildOfferStateProveRequest([
                {csfloatTrade: trade(TradeOfferState.Active, false, 'a'), isBuyer: true},
                {csfloatTrade: trade(TradeOfferState.Active, true, 'b'), isBuyer: false},
            ])
        ).toEqual({type: ProofType.TRADE_OFFERS, get_sent_offers: true, get_received_offers: true});

        expect(
            buildOfferStateProveRequest([
                {csfloatTrade: trade(TradeOfferState.Active, false, 'a'), isBuyer: true},
                {csfloatTrade: trade(TradeOfferState.Active, false, 'b'), isBuyer: true},
            ])
        ).toEqual({type: ProofType.TRADE_OFFERS, get_sent_offers: false, get_received_offers: true});
    });
});
