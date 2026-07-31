import {TradeHistoryStatus} from '../bridge/handlers/trade_history_status';
import {StorageKey} from '../storage/keys';
import {gStore} from '../storage/store';
import {SlimTrade, TradeState} from '../types/float_market';
import {TradeOfferState, TradeStatus} from '../types/steam_constants';
import {reportTradeError} from './error_report';
import {isBackgroundNotaryRollbackEnabled, proveTradesInBackground} from './notary';

interface FailedTradeInfo {
    steamTrade: TradeHistoryStatus;
    csfloatTrade: SlimTrade;
}

export function findFailedTrades(
    pendingTrades: SlimTrade[],
    tradeHistory: TradeHistoryStatus[]
): FailedTradeInfo[] {
    const results: FailedTradeInfo[] = [];

    for (const trade of tradeHistory) {
        if (trade.status !== TradeStatus.Failed) {
            continue;
        }

        const receivedIDs = trade.received_assets.map((asset) => asset.asset_id);
        const givenIDs = trade.given_assets.map((asset) => asset.asset_id);
        const assetIDs = [...receivedIDs, ...givenIDs];

        const csfloatTrade = pendingTrades.find(
            (pendingTrade) =>
                pendingTrade.state === TradeState.PENDING &&
                pendingTrade.steam_offer?.state === TradeOfferState.Active &&
                pendingTrade.steam_trade_failed_id !== trade.trade_id &&
                assetIDs.includes(pendingTrade.contract.item.asset_id) &&
                (trade.other_party_id === pendingTrade.seller_id ||
                    trade.other_party_id === pendingTrade.buyer_id)
        );
        if (!csfloatTrade) {
            continue;
        }

        results.push({steamTrade: trade, csfloatTrade});
    }

    return results;
}

export async function pingFailedTrades(pendingTrades: SlimTrade[], tradeHistory: TradeHistoryStatus[]) {
    if (!pendingTrades?.length || !tradeHistory?.length) {
        return;
    }

    const failedTrades = findFailedTrades(pendingTrades, tradeHistory);
    if (failedTrades.length === 0 || !(await isBackgroundNotaryRollbackEnabled())) {
        return;
    }

    const lastFailure = await gStore.getWithStorage<number>(
        chrome.storage.local,
        StorageKey.LAST_NOTARY_BG_PROOF_FAILURE
    );
    if (lastFailure && lastFailure > Date.now() - 60 * 60 * 1000) {
        console.log('skipping failed-trade notary proof, last failure was less than 60 minutes ago');
        return;
    }

    try {
        await proveTradesInBackground(failedTrades.map((failedTrade) => failedTrade.steamTrade));
        console.log(`proved ${failedTrades.length} failed trade(s) via notary`);
    } catch (e) {
        console.error('failed-trade notary proving failed', e);
        await gStore.setWithStorage(chrome.storage.local, StorageKey.LAST_NOTARY_BG_PROOF_FAILURE, Date.now());
        reportTradeError(failedTrades[0].csfloatTrade.id, `background extension failed-trade notary failed: ${e}`);
    }
}
