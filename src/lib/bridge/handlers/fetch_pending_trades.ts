import {SimpleHandler} from './main';
import {Trade} from '../../types/float_market';
import {RequestType} from './types';

export interface FetchPendingTradesRequest {}

export interface FetchPendingTradesResponse {
    trades_to_send: Trade[];
    trades_to_receive: Trade[];
}

export const FetchPendingTrades = new SimpleHandler<FetchPendingTradesRequest, FetchPendingTradesResponse>(
    RequestType.FETCH_PENDING_TRADES,
    async (req) => {
        return fetch(`https://csgofloat.com/api/v1/me/pending-trades`, {
            credentials: 'include',
        }).then((resp) => {
            return resp.json() as Promise<FetchPendingTradesResponse>;
        });
    }
);
