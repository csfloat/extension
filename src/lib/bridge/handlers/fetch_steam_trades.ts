import {getTradeOffersWithDescriptionFromAPI, TradeOffersAPIOffer} from '../../alarms/trade_offer';
import {rgDescription} from '../../types/steam';
import {CachedHandler} from '../wrappers/cached';
import {SimpleHandler} from './main';
import {RequestType} from './types';

interface FetchSteamTradesRequest {
    steam_id?: string;
    trade_offer_id?: number;
}

export interface FetchSteamTradesResponse {
    received: TradeOffersAPIOffer[];
    sent: TradeOffersAPIOffer[];
    descriptions: rgDescription[];
    steam_id?: string | null;
}

export const FetchSteamTrades = new CachedHandler(
    new SimpleHandler<FetchSteamTradesRequest, FetchSteamTradesResponse>(
        RequestType.FETCH_STEAM_TRADES,
        async (req) => {
            const resp = await getTradeOffersWithDescriptionFromAPI(req.steam_id);
            if (!resp) {
                throw new Error('Error fetching Steam trade offers from API');
            }

            return resp;
        }
    ),
    1,
    10 * 60 * 1000
);
