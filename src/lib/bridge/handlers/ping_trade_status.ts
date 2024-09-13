import {SimpleHandler} from './main';
import {RequestType} from './types';
import {pingTradeStatus} from '../../alarms/csfloat_trade_pings';

export interface PingTradeStatusRequest {
    // Steam ID we're expecting to fulfill the ping for.
    steam_id: string;
}

export interface PingTradeStatusResponse {}

export const PingTradeStatus = new SimpleHandler<PingTradeStatusRequest, PingTradeStatusResponse>(
    RequestType.PING_TRADE_STATUS,
    async (req) => {
        await pingTradeStatus(req.steam_id);

        return {};
    }
);
