import {SimpleHandler} from './main';
import {Trade} from '../../types/float_market';
import {RequestType} from './types';

export interface FetchPendingTradesRequest {}

export interface FetchPendingTradesResponse {
    count: number;
    trades: Trade[];
}

export const FetchPendingTrades = new SimpleHandler<FetchPendingTradesRequest, FetchPendingTradesResponse>(
    RequestType.FETCH_PENDING_TRADES,
    async (req) => {
        const resp = await fetch(`https://csfloat.com/api/v1/me/trades?state=pending&limit=100&page=0`, {
            credentials: 'include',
        });

        if (resp.status !== 200) {
            throw new Error('invalid status');
        }

        return resp.json() as Promise<FetchPendingTradesResponse>;
    }
);
