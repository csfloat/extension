import {SimpleHandler} from './main';
import {Contract} from '../../types/float_market';
import {RequestType} from './types';
import {environment} from '../../../environment';

export interface FetchStallRequest {
    steam_id64: string;
}

export interface FetchStallResponse {
    data?: Contract[];
}

export interface FetchStallResponseError {
    code?: string;
    message?: string;
}

export const FetchStall = new SimpleHandler<FetchStallRequest, FetchStallResponse>(
    RequestType.FETCH_STALL,
    async (req) => {
        return fetch(`${environment.csfloat_base_api_url}/v1/users/${req.steam_id64}/stall`).then((resp) => {
            return resp.json().then((json: FetchStallResponse | FetchStallResponseError) => {
                if (resp.ok) {
                    return json;
                } else {
                    throw Error((json as FetchStallResponseError).message);
                }
            }) as Promise<FetchStallResponse>;
        });
    }
);
