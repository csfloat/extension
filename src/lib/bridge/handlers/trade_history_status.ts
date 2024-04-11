import {SimpleHandler} from './main';
import {RequestType} from './types';

export interface TradeHistoryAsset {
    asset_id: string;
    new_asset_id?: string;
}

export interface TradeHistoryStatus {
    other_party_url: string;
    received_assets: TradeHistoryAsset[];
    given_assets: TradeHistoryAsset[];
}

export interface TradeHistoryStatusRequest {
    history: TradeHistoryStatus[];
}

export interface TradeHistoryStatusResponse {}

export const TradeHistoryStatus = new SimpleHandler<TradeHistoryStatusRequest, TradeHistoryStatusResponse>(
    RequestType.TRADE_HISTORY_STATUS,
    async (req) => {
        const resp = await fetch(`https://csfloat.com/api/v1/trades/steam-status/trade-history`, {
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

        return resp.json() as Promise<TradeHistoryStatusResponse>;
    }
);
