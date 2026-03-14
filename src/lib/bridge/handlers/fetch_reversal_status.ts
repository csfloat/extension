import {RequestType} from './types';
import {SimpleHandler} from './main';
import {environment} from '../../../environment';

export interface FetchReversalStatusRequest {
    steam_id64: string;
}

export interface FetchReversalStatusResponse {
    steam_id: string;
    has_reversed: boolean;
    last_reversal_timestamp?: number;
}

export interface FetchReversalStatusError {
    code: string;
    message: string;
    details?: string;
}

export const FetchReversalStatus = new SimpleHandler<FetchReversalStatusRequest, FetchReversalStatusResponse>(
    RequestType.FETCH_REVERSAL_STATUS,
    async (req) => {
        const resp = await fetch(`${environment.reverse_watch_base_api_url}/v1/users/${req.steam_id64}`);
        const data = (await resp.json()) as FetchReversalStatusResponse | FetchReversalStatusError;
        if (!resp.ok) {
            throw Error((data as FetchReversalStatusError).message ?? 'unknown error');
        }
        return data as FetchReversalStatusResponse;
    }
);
