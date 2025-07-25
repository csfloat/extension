import {SimpleHandler} from './main';
import {RequestType} from './types';
import {TradeHistoryStatus} from './trade_history_status';
import {getTradeHistoryFromAPI} from '../../alarms/trade_history';

export interface FetchTradeHistoryRequest {
    max_trades: number;
}

export interface FetchTradeHistoryResponse {
    trades: TradeHistoryStatus[];
}

export const FetchTradeHistory = new SimpleHandler<FetchTradeHistoryRequest, FetchTradeHistoryResponse>(
    RequestType.FETCH_TRADE_HISTORY,
    async (req) => {
        const trades = await getTradeHistoryFromAPI(req.max_trades);
        return {
            trades,
        };
    }
);
