import {SimpleHandler} from './main';
import {RequestType} from './types';
import {TradeOfferState} from '../../types/steam_constants';
import {environment} from '../../../environment';

export interface OfferStatus {
    offer_id: string;
    state: TradeOfferState;
    given_asset_ids?: string[];
    received_asset_ids?: string[];
    time_created?: number;
    time_updated?: number;
    other_steam_id64?: string;
}

export enum TradeOffersType {
    API = 1,
    HTML = 2,
}

export interface TradeOfferStatusRequest {
    sent_offers: OfferStatus[];
    type?: TradeOffersType;
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
