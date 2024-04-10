import {SimpleHandler} from './main';
import {RequestType} from './types';

export interface AnnotateOfferRequest {
    given_asset_ids: string[];
    received_asset_ids: string[];
    offer_id: string;
}

export interface AnnotateOfferResponse {}

export const AnnotateOffer = new SimpleHandler<AnnotateOfferRequest, AnnotateOfferResponse>(
    RequestType.ANNOTATE_OFFER,
    async (req) => {
        const resp = await fetch(`https://csfloat.com/api/v1/trades/steam-status/new-offer`, {
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
