import {SimpleHandler} from './main';
import {RequestType} from './types';

export interface AnnotateOfferRequest {
    assets_to_send: string[];
    assets_to_receive: string[];
    offer_id: string;
}

export interface AnnotateOfferResponse {}

export const AnnotateOffer = new SimpleHandler<AnnotateOfferRequest, AnnotateOfferResponse>(
    RequestType.ANNOTATE_OFFER,
    async (req) => {
        const resp = await fetch(`https://csfloat.com/api/v1/trades/annotate-offer`, {
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
