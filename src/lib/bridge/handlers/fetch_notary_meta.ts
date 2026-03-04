import {SimpleHandler} from './main';
import {RequestType} from './types';
import {environment} from '../../../environment';

interface NotarySetting {
    enabled: boolean;
    background: boolean;
}

export interface NotaryMeta {
    rollback: NotarySetting;
    accepted: NotarySetting;
}

export interface FetchNotaryMetaRequest {}

export interface FetchNotaryMetaResponse extends NotaryMeta {}

export const FetchNotaryMeta = new SimpleHandler<FetchNotaryMetaRequest, FetchNotaryMetaResponse>(
    RequestType.FETCH_NOTARY_META,
    async () => {
        const resp = await fetch(`${environment.csfloat_base_api_url}/v1/meta/notary`, {
            credentials: 'include',
        });

        if (resp.status !== 200) {
            throw new Error('failed to fetch notary meta');
        }

        return (await resp.json()) as NotaryMeta;
    }
);
