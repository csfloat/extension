import { SimpleHandler } from './main';
import { RequestType } from './types';
import { TradeHistoryStatus } from './trade_history_status';
import { getTradeHistoryFromAPI } from '../../alarms/trade_history';

export interface FetchTradeHistoryRequest {
    max_trades: number;
    start_after_time?: number;
    start_after_tradeid?: string;
    navigating_back?: boolean;
    get_descriptions?: boolean;
    include_failed?: boolean;
    include_total?: boolean;
    language?: string;
}

export interface FetchTradeHistoryResponse {
    trades: TradeHistoryStatus[];
}

export const FetchTradeHistory = new SimpleHandler<FetchTradeHistoryRequest, FetchTradeHistoryResponse>(
    RequestType.FETCH_TRADE_HISTORY,
    async (req) => {
        const trades = await getTradeHistoryFromAPI(req.max_trades, {
            startAfterTime: req.start_after_time,
            startAfterTradeID: req.start_after_tradeid,
            navigatingBack: req.navigating_back,
            getDescriptions: req.get_descriptions,
            includeFailed: req.include_failed,
            includeTotal: req.include_total,
            language: req.language,
        });
        return {
            trades,
        };
    }
);
