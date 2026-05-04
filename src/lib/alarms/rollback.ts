import {SlimTrade, TradeState} from '../types/float_market';
import {TradeHistoryStatus} from '../bridge/handlers/trade_history_status';
import {PingRollbackTrade} from '../bridge/handlers/ping_rollback_trade';
import {TradeStatus} from '../types/steam_constants';
import {isBackgroundNotaryRollbackEnabled, proveTradesInBackground} from './notary';
import {reportTradeError} from './error_report';
import {gStore} from '../storage/store';
import {StorageKey} from '../storage/keys';

interface RollbackTradeInfo {
    steamTrade: TradeHistoryStatus;
    csfloatTrade: SlimTrade;
    rollbackTrade?: TradeHistoryStatus;
}

function findRollbackTrades(pendingTrades: SlimTrade[], tradeHistory: TradeHistoryStatus[]): RollbackTradeInfo[] {
    const results: RollbackTradeInfo[] = [];

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
            (e) =>
                e.state === TradeState.PENDING &&
                all_ids.includes(e.contract.item.asset_id) &&
                (trade.other_party_id === e.seller_id || trade.other_party_id === e.buyer_id)
        );
        if (!csfloatTrade) {
            continue;
        }

        const rollbackTrade = tradeHistory.find((e) => e.rollback_trade === trade.trade_id);
        results.push({steamTrade: trade, csfloatTrade, rollbackTrade});
    }

    return results;
}

export async function pingRollbackTrades(pendingTrades: SlimTrade[], tradeHistory: TradeHistoryStatus[]) {
    if (!pendingTrades?.length || !tradeHistory?.length) {
        return;
    }

    const rollbackTrades = findRollbackTrades(pendingTrades, tradeHistory);
    if (rollbackTrades.length === 0) {
        return;
    }

    if (await isBackgroundNotaryRollbackEnabled()) {
        const lastFailure = await gStore.getWithStorage<number>(
            chrome.storage.local,
            StorageKey.LAST_NOTARY_BG_PROOF_FAILURE
        );
        if (lastFailure && lastFailure > Date.now() - 60 * 60 * 1000) {
            console.log('skipping notary proof, last failure was less than 60 minutes ago');
        } else {
            try {
                await proveTradesInBackground(rollbackTrades.map((r) => r.steamTrade));
                console.log(`proved ${rollbackTrades.length} rollback trade(s) via notary`);
                return;
            } catch (e) {
                console.error('notary proving failed, falling back to legacy ping', e);
                await gStore.setWithStorage(chrome.storage.local, StorageKey.LAST_NOTARY_BG_PROOF_FAILURE, Date.now());
                reportTradeError(rollbackTrades[0].csfloatTrade.id, `background extension notary failed: ${e}`);
            }
        }
    }

    await pingRollbackTradesLegacy(rollbackTrades);
}

async function pingRollbackTradesLegacy(rollbackTrades: RollbackTradeInfo[]) {
    for (const {csfloatTrade, rollbackTrade} of rollbackTrades) {
        try {
            await PingRollbackTrade.handleRequest(
                {trade_id: csfloatTrade.id, rollback_trade_id: rollbackTrade?.trade_id},
                {}
            );
        } catch (e) {
            console.error(`failed to send rollback ping for csfloat trade ${csfloatTrade.id}`, e);
        }
    }
}
