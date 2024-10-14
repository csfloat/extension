import {SimpleHandler} from './main';
import {RequestType} from './types';
import {environment} from '../../../environment';
import {Trade} from '../../types/float_market';

export interface PingCancelTradeRequest {
    trade_id: string;
    steam_id?: string | null;
}

export interface PingCancelTradeResponse {
    trade: Trade;
}

export const PingCancelTrade = new SimpleHandler<PingCancelTradeRequest, PingCancelTradeResponse>(
    RequestType.PING_CANCEL_TRADE,
    async (req) => {
        const resp = await fetch(`${environment.csfloat_base_api_url}/v1/trades/${req.trade_id}/cancel-ping`, {
            credentials: 'include',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                steam_id: req.steam_id,
            }),
        });

        if (resp.status !== 200) {
            throw new Error('invalid status');
        }

        const trade = (await resp.json()) as Trade;
        return {
            trade,
        };
    }
);
