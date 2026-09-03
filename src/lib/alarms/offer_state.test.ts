import {describe, expect, it} from 'vitest';
import {OfferStatus} from '../bridge/handlers/trade_offer_status';
import {SlimTrade, TradeState} from '../types/float_market';
import {TradeOfferState} from '../types/steam_constants';
import {findOfferStateCandidates} from './offer_state';

const sellerID = '76561198000000000';
const buyerID = '76561198111111111';
const offerID = '9340135296';

function trade(state: TradeOfferState, waitForCancelPing = false): SlimTrade {
    return {
        id: 'csfloat-trade-id',
        state: TradeState.PENDING,
        seller_id: sellerID,
        buyer_id: buyerID,
        contract: {item: {asset_id: '3899876543210123456', market_hash_name: 'AK-47 | Redline'}},
        steam_offer: {id: offerID, state},
        wait_for_cancel_ping: waitForCancelPing,
    } as SlimTrade;
}

function offer(state: TradeOfferState): OfferStatus {
    return {offer_id: offerID, state};
}

describe('offer state notary candidates', () => {
    it('proves as buyer when the visible offer state differs from CSFloat', () => {
        const t = trade(TradeOfferState.CreatedNeedsConfirmation);
        expect(findOfferStateCandidates([t], [offer(TradeOfferState.Active)], buyerID)).toEqual([
            {csfloatTrade: t, localState: TradeOfferState.Active},
        ]);
    });

    it('proves as buyer when CSFloat thinks the offer is active but it is not visible', () => {
        const t = trade(TradeOfferState.Active);
        expect(findOfferStateCandidates([t], [], buyerID)).toEqual([{csfloatTrade: t, localState: undefined}]);
    });

    it('does not treat an unconfirmed offer that the buyer cannot see as a divergence', () => {
        expect(findOfferStateCandidates([trade(TradeOfferState.CreatedNeedsConfirmation)], [], buyerID)).toEqual([]);
    });

    it('does not prove as seller on divergence alone since seller telemetry already reports it', () => {
        const t = trade(TradeOfferState.CreatedNeedsConfirmation);
        expect(findOfferStateCandidates([t], [offer(TradeOfferState.Active)], sellerID)).toEqual([]);
    });

    it('proves for either party when waiting on a cancel ping and the offer is gone', () => {
        const t = trade(TradeOfferState.CreatedNeedsConfirmation, true);
        expect(findOfferStateCandidates([t], [], sellerID)).toEqual([{csfloatTrade: t, localState: undefined}]);
    });

    it('does not prove when waiting on a cancel ping but the offer is still active', () => {
        const t = trade(TradeOfferState.Active, true);
        expect(findOfferStateCandidates([t], [offer(TradeOfferState.Active)], sellerID)).toEqual([]);
    });

    it('skips accepted offers since trade history owns that transition', () => {
        const t = trade(TradeOfferState.Active, true);
        expect(findOfferStateCandidates([t], [offer(TradeOfferState.Accepted)], buyerID)).toEqual([]);
    });

    it('ignores trades without an annotated offer', () => {
        const t = {...trade(TradeOfferState.Active), steam_offer: {}} as SlimTrade;
        expect(findOfferStateCandidates([t], [], buyerID)).toEqual([]);
    });
});
