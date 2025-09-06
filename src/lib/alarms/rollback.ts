import {SlimTrade, TradeState} from '../types/float_market';
import {TradeHistoryStatus} from '../bridge/handlers/trade_history_status';
import {PingRollbackTrade} from '../bridge/handlers/ping_rollback_trade';
import {TradeStatus} from '../types/steam_constants';

export async function pingRollbackTrades(pendingTrades: SlimTrade[], tradeHistory: TradeHistoryStatus[]) {
    if (!pendingTrades || pendingTrades.length === 0) {
        return;
    }

    if (!tradeHistory || tradeHistory.length === 0) {
        return;
    }

    for (const trade of tradeHistory) {
        // Status 12 corresponds to a rollback via trade protection (undocumented)
        // The original trade gets updated to this status once a rollback occurs
        // (and creates a new complete trade for sending the items back)
        if (trade.status !== TradeStatus.TradeProtectionRollback) {
            continue;
        }

        const received_ids = trade.received_assets.map((e) => e.asset_id);
        const given_ids = trade.given_assets.map((e) => e.asset_id);
        const all_ids = [...received_ids, ...given_ids];

        // Does it correspond to an active CSFloat sale?
        const csfloatTrade = pendingTrades.find(
            (e) => e.state === TradeState.PENDING && all_ids.includes(e.contract.item.asset_id)
        );
        if (!csfloatTrade) {
            continue;
        }

        // try to find the rollback trade id
        const rollbackTrade = tradeHistory.find((e) => e.rollback_trade === trade.trade_id);

        // Pinging the first asset in a trade will cancel all the items in the trade server-side
        try {
            await PingRollbackTrade.handleRequest(
                {trade_id: csfloatTrade?.id, rollback_trade_id: rollbackTrade?.trade_id},
                {}
            );
        } catch (e) {
            console.error(`failed to send rollback ping for csfloat trade ${csfloatTrade.id}`, e);
        }
    }
}
