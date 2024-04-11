import {SimpleHandler} from './main';
import {RequestType} from './types';
import {TradeOfferState} from '../../types/steam_constants';
import {environment} from '../../../environment';

export interface TradeOfferStatus {
    offer_id: string;
    state: TradeOfferState;
}

export interface TradeOfferStatusRequest {
    sent_offers: TradeOfferStatus[];
}

export interface TradeOfferStatusResponse {}

export const TradeOfferStatus = new SimpleHandler<TradeOfferStatusRequest, TradeOfferStatusResponse>(
    RequestType.TRADE_OFFER_STATUS,
    async (req) => {
        const resp = await fetch(`${environment.csfloat_base_api_url}/v1/trades/steam-status/offer`, {
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

        return resp.json() as Promise<TradeOfferStatusResponse>;
    }
);
