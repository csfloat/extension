import {Trade} from '../types/float_market';
import {FetchPendingTrades} from '../bridge/handlers/fetch_pending_trades';
import {TradeHistoryStatus} from '../bridge/handlers/trade_history_status';
import * as cheerio from 'cheerio';

export const PING_CSFLOAT_TRADE_STATUS_ALARM_NAME = 'ping_csfloat_trade_status_alarm';

export async function pingTradeStatus() {
    await pingTradeHistory();
}

export async function pingTradeHistory() {
    let pendingTrades: Trade[];
    try {
        const resp = await FetchPendingTrades.handleRequest({}, {});
        pendingTrades = resp.trades;
    } catch (e) {
        console.error(e);
        console.log('cannot fetch pending trades for CSFloat, may not be logged in or CSFloat down');
        return;
    }

    if (pendingTrades.length === 0) {
        // No active trades, return early
        return;
    }

    const history = await getTradeHistory();

    // premature optimization in case it's 100 trades
    const assetsToFind = pendingTrades.reduce((acc, e) => {
        acc[e.contract.item.asset_id] = true;
        return acc;
    }, {} as {[key: string]: boolean});

    // We only want to send history that is relevant to verifying trades on CSFloat
    const historyForCSFloat = history.filter((e) => {
        return !![...e.received_asset_ids, ...e.given_asset_ids].find((e) => {
            return assetsToFind[e];
        });
    });

    if (historyForCSFloat.length === 0) {
        return;
    }

    await TradeHistoryStatus.handleRequest({history: historyForCSFloat}, {});
}

async function getTradeHistory(): Promise<TradeHistoryStatus[]> {
    const resp = await fetch(`https://steamcommunity.com/id/me/tradehistory`, {
        credentials: 'include',
        // Expect redirect since we're using `me` above
        redirect: 'follow',
    });

    const body = await resp.text();
    if (body.includes('too many requests')) {
        throw 'Too many requests';
    }

    const doc = cheerio.load(body);

    const statuses = doc('.tradehistoryrow .tradehistory_event_description a')
        .toArray()
        .map((row) => {
            return {
                other_party_url: doc(row).attr('href'),
                received_asset_ids: [],
                given_asset_ids: [],
            } as TradeHistoryStatus;
        });

    const matches = body.matchAll(
        /HistoryPageCreateItemHover\( \'trade(\d+)_(received|given)item\d+\', 730, \'2\', \'(\d+)\', \'1\' \);/g
    );
    for (const match of matches) {
        const [text, index, type, assetId] = match;
        const tradeIndex = parseInt(index);
        if (type === 'received') {
            statuses[tradeIndex].received_asset_ids.push(assetId);
        } else if (type === 'given') {
            statuses[tradeIndex].given_asset_ids.push(assetId);
        }
    }

    return statuses;
}
