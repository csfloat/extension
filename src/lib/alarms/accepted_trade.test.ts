import {describe, expect, it} from 'vitest';
import {TradeHistoryStatus} from '../bridge/handlers/trade_history_status';
import {SlimTrade, TradeState} from '../types/float_market';
import {TradeStatus} from '../types/steam_constants';
import {ACCEPTED_PROOF_RETRY_MS, filterDueForProof, findAcceptedTrades} from './accepted_trade';

const assetID = '3899876543210123456';
const sellerID = '76561198000000000';
const buyerID = '76561198111111111';
// accepted_at 100s, so Steam trades initiated at >= 100 are bound to this sale
const acceptedAt = new Date(100 * 1000).toISOString();

const pendingTrade = {
    id: 'csfloat-trade-id',
    state: TradeState.PENDING,
    seller_id: sellerID,
    buyer_id: buyerID,
    accepted_at: acceptedAt,
    contract: {item: {asset_id: assetID, market_hash_name: 'AK-47 | Redline'}},
} as SlimTrade;

function steamTrade(overrides: Partial<TradeHistoryStatus> = {}): TradeHistoryStatus {
    return {
        trade_id: 'steam-trade-id',
        status: TradeStatus.Complete,
        other_party_url: `https://steamcommunity.com/profiles/${buyerID}`,
        other_party_id: buyerID,
        received_assets: [],
        given_assets: [{asset_id: assetID}],
        time_init: 120,
        time_settlement: 1000,
        ...overrides,
    };
}

describe('findAcceptedTrades', () => {
    it('matches a complete in-protection sale sent to the buyer', () => {
        const matches = findAcceptedTrades([pendingTrade], [steamTrade()], sellerID);

        expect(matches).toHaveLength(1);
        expect(matches[0].csfloatTrade.id).toBe('csfloat-trade-id');
        expect(matches[0].steamTrade.trade_id).toBe('steam-trade-id');
    });

    it('accepts committed status', () => {
        expect(
            findAcceptedTrades([pendingTrade], [steamTrade({status: TradeStatus.Committed})], sellerID)
        ).toHaveLength(1);
    });

    it('skips sales that are not pending, not accepted, already proven, or not sold by this user', () => {
        const history = [steamTrade()];

        expect(findAcceptedTrades([{...pendingTrade, state: TradeState.VERIFIED}], history, sellerID)).toEqual([]);
        expect(findAcceptedTrades([{...pendingTrade, accepted_at: undefined}], history, sellerID)).toEqual([]);
        expect(
            findAcceptedTrades([{...pendingTrade, notary_accepted_at: acceptedAt}], history, sellerID)
        ).toEqual([]);
        expect(findAcceptedTrades([pendingTrade], history, buyerID)).toEqual([]);
    });

    it('skips Steam entries that are rolled back, outside protection, to another party, or pre-acceptance', () => {
        expect(findAcceptedTrades([pendingTrade], [steamTrade({rollback_trade: 'orig'})], sellerID)).toEqual([]);
        expect(findAcceptedTrades([pendingTrade], [steamTrade({time_settlement: undefined})], sellerID)).toEqual([]);
        expect(findAcceptedTrades([pendingTrade], [steamTrade({other_party_id: sellerID})], sellerID)).toEqual([]);
        expect(findAcceptedTrades([pendingTrade], [steamTrade({time_init: 99})], sellerID)).toEqual([]);
        expect(
            findAcceptedTrades(
                [pendingTrade],
                [steamTrade({given_assets: [], received_assets: [{asset_id: assetID}]})],
                sellerID
            )
        ).toEqual([]);
    });

    it('uses the most recent attempt so a later rollback blocks an older acceptance', () => {
        const accepted = steamTrade({trade_id: 'accepted', time_init: 120});
        const rollback = steamTrade({
            trade_id: 'rollback',
            status: TradeStatus.TradeProtectionRollback,
            time_init: 130,
        });
        const failedFirst = steamTrade({trade_id: 'failed', status: TradeStatus.Failed, time_init: 110});

        expect(findAcceptedTrades([pendingTrade], [accepted, rollback], sellerID)).toEqual([]);
        expect(findAcceptedTrades([pendingTrade], [rollback, accepted], sellerID)).toEqual([]);
        expect(findAcceptedTrades([pendingTrade], [failedFirst, accepted], sellerID)[0]?.steamTrade.trade_id).toBe(
            'accepted'
        );
    });
});

describe('filterDueForProof', () => {
    const now = 10_000_000_000;
    const match = {csfloatTrade: pendingTrade, steamTrade: steamTrade()};
    const other = {csfloatTrade: {...pendingTrade, id: 'other'}, steamTrade: steamTrade()};

    it('is due when never attempted or attempted before the retry window', () => {
        expect(filterDueForProof([match], {}, now).due).toEqual([match]);
        expect(filterDueForProof([match], {[pendingTrade.id]: now - ACCEPTED_PROOF_RETRY_MS}, now).due).toEqual([
            match,
        ]);
    });

    it('is not due when attempted inside the retry window', () => {
        expect(filterDueForProof([match], {[pendingTrade.id]: now - 1}, now).due).toEqual([]);
    });

    it('prunes attempts for sales that are no longer candidates', () => {
        const {attempts} = filterDueForProof(
            [match],
            {[pendingTrade.id]: now - 1, [other.csfloatTrade.id]: now - 1},
            now
        );

        expect(attempts).toEqual({[pendingTrade.id]: now - 1});
    });
});
