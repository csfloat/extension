import {SimpleHandler} from './main';
import {RequestType} from './types';
import {environment} from '../../../environment';

export interface NotaryToken {
    steam_id: string;
    token: string;
    expires_at: string;
}

export interface FetchNotaryTokenRequest {}

export interface FetchNotaryTokenResponse extends NotaryToken {}

export const FetchNotaryToken = new SimpleHandler<FetchNotaryTokenRequest, FetchNotaryTokenResponse>(
    RequestType.FETCH_NOTARY_TOKEN,
    async () => {
        const resp = await fetch(`${environment.csfloat_base_api_url}/v1/me/notary-token`, {
            credentials: 'include',
            method: 'POST',
        });

        if (resp.status !== 200) {
            throw new Error('failed to fetch notary token');
        }

        return (await resp.json()) as NotaryToken;
    }
);
