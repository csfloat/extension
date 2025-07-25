import {SimpleHandler} from './main';
import {RequestType} from './types';
import {environment} from '../../../environment';
import {Trade} from '../../types/float_market';

export enum RollbackOrigin {
    MANUAL_USER = 0,
    EXTENSION = 1,
}

export interface PingRollbackTradeRequest {
    trade_id: string;
    rollback_trade_id?: string;
}

export interface PingRollbackTradeResponse {
    trade: Trade;
}

export const PingRollbackTrade = new SimpleHandler<PingRollbackTradeRequest, PingRollbackTradeResponse>(
    RequestType.PING_ROLLBACK_TRADE,
    async (req) => {
        const resp = await fetch(`${environment.csfloat_base_api_url}/v1/trades/${req.trade_id}/rollback`, {
            credentials: 'include',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                rollback_trade_id: req.rollback_trade_id,
                origin: RollbackOrigin.EXTENSION,
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
