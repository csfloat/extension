import {SimpleHandler} from './main';
import {Trade} from '../../types/float_market';
import {RequestType} from './types';
import {environment} from '../../../environment';

export interface FetchPendingTradesRequest {
    state?: string;
    limit?: number;
}

export interface FetchPendingTradesResponse {
    count: number;
    trades: Trade[];
}

export const FetchPendingTrades = new SimpleHandler<FetchPendingTradesRequest, FetchPendingTradesResponse>(
    RequestType.FETCH_PENDING_TRADES,
    async (req) => {
        const state = req.state ? req.state : 'pending';
        const limit = req.limit ? req.limit : 100;
        const resp = await fetch(
            `${environment.csfloat_base_api_url}/v1/me/trades?state=${state}&limit=${limit}&page=0`,
            {
                credentials: 'include',
            }
        );

        if (resp.status !== 200) {
            throw new Error('invalid status');
        }

        return resp.json() as Promise<FetchPendingTradesResponse>;
    }
);
