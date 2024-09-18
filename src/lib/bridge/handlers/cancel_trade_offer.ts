import {SimpleHandler} from './main';
import {RequestType} from './types';

export interface CancelTradeOfferRequest {
    trade_offer_id: string;
    session_id: string;
}

export interface CancelTradeOfferResponse {}

export const CancelTradeOffer = new SimpleHandler<CancelTradeOfferRequest, CancelTradeOfferResponse>(
    RequestType.CANCEL_TRADE_OFFER,
    async (req) => {
        const formData = {
            sessionid: req.session_id,
        };

        const resp = await fetch(`https://steamcommunity.com/tradeoffer/${req.trade_offer_id}/cancel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            },
            body: new URLSearchParams(formData as any).toString(),
        });

        if (!resp.ok) {
            throw new Error(`failed to cancel offer: ${resp.status}`);
        }

        return {} as CancelTradeOfferResponse;
    }
);
