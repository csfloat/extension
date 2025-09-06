import {SlimTrade} from '../../types/float_market';
import {SimpleHandler} from './main';
import {RequestType} from './types';
import {environment} from '../../../environment';

export interface FetchSlimTradesRequest {
    state?: string;
    limit?: number;
    page?: number;
}

export interface FetchSlimTradesResponse {
    count: number;
    trades: SlimTrade[];
}

export const FetchSlimTrades = new SimpleHandler<FetchSlimTradesRequest, FetchSlimTradesResponse>(
    RequestType.FETCH_SLIM_TRADES,
    async (req) => {
        const state = req.state ? req.state : 'pending';
        const limit = req.limit ? req.limit : 100;
        const resp = await fetch(
            `${environment.csfloat_base_api_url}/v1/me/trades/slim?state=${state}&limit=${limit}&page=${req.page || 0}`,
            {
                credentials: 'include',
            }
        );

        if (resp.status !== 200) {
            throw new Error('invalid status');
        }

        return resp.json() as Promise<FetchSlimTradesResponse>;
    }
);
