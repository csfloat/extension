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
        try {
            const resp = await fetch(`https://csfloat.com/api/v1/me/pending-trades`, {
                credentials: 'include',
            });

            if (resp.status !== 200) {
                throw new Error('invalid status');
            }

            return resp.json() as Promise<FetchPendingTradesResponse>;
        } catch (e) {
            // Try the old CSGOFloat URL (in case they have an old session from there)
            // Of note, this can be removed ~1 week after the migration.
            const resp = await fetch(`https://csgofloat.com/api/v1/me/pending-trades`, {
                credentials: 'include',
            });

            if (resp.status !== 200) {
                throw new Error('invalid status');
            }

            return resp.json();
        }
    }
);
