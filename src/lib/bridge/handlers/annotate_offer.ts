import {SimpleHandler} from './main';
import {RequestType} from './types';
import {environment} from '../../../environment';

export interface AnnotateOfferRequest {
    given_asset_ids: string[];
    received_asset_ids: string[];
    offer_id: string;
    other_steam_id64?: string;
}

export interface AnnotateOfferResponse {}

export const AnnotateOffer = new SimpleHandler<AnnotateOfferRequest, AnnotateOfferResponse>(
    RequestType.ANNOTATE_OFFER,
    async (req) => {
        const resp = await fetch(`${environment.csfloat_base_api_url}/v1/trades/steam-status/new-offer`, {
            credentials: 'include',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req),
        });

        if (resp.status !== 200) {
            throw new Error('invalid status');
        }

        return resp.json() as Promise<AnnotateOfferResponse>;
    }
);
