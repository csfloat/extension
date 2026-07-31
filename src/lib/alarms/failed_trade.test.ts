import {describe, expect, it} from 'vitest';
import {TradeHistoryStatus} from '../bridge/handlers/trade_history_status';
import {SlimTrade, TradeState} from '../types/float_market';
import {TradeOfferState, TradeStatus} from '../types/steam_constants';
import {findFailedTrades} from './failed_trade';

const steamAssetID = '3899876543210123456';
const otherPartyID = '76561198000000000';

describe('failed Steam trades', () => {
    it('matches failed history to a relevant pending trade', () => {
        const matches = findFailedTrades([pendingTrade()], [tradeHistory()]);

        expect(matches).toHaveLength(1);
        expect(matches[0].csfloatTrade.id).toBe('csfloat-trade-id');
        expect(matches[0].steamTrade.status).toBe(TradeStatus.Failed);
    });

    it('does not match an already recorded failed Steam trade', () => {
        const trade = pendingTrade();
        trade.steam_trade_failed_id = 'steam-trade-id';

        expect(findFailedTrades([trade], [tradeHistory()])).toEqual([]);
    });

    it('does not match a trade whose CSFloat offer is accepted', () => {
        const trade = pendingTrade();
        trade.steam_offer.state = TradeOfferState.Accepted;

        expect(findFailedTrades([trade], [tradeHistory()])).toEqual([]);
    });
});

function pendingTrade(): SlimTrade {
    return {
        id: 'csfloat-trade-id',
        state: TradeState.PENDING,
        seller_id: otherPartyID,
        buyer_id: '76561198111111111',
        contract: {
            item: {
                asset_id: steamAssetID,
                market_hash_name: 'AK-47 | Redline',
            },
        },
        steam_offer: {state: TradeOfferState.Active},
    } as SlimTrade;
}

function tradeHistory(): TradeHistoryStatus {
    return {
        trade_id: 'steam-trade-id',
        status: TradeStatus.Failed,
        other_party_url: `https://steamcommunity.com/profiles/${otherPartyID}`,
        other_party_id: otherPartyID,
        received_assets: [{asset_id: steamAssetID}],
        given_assets: [],
        time_init: 123,
    };
}
