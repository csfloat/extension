import {ExtendedOfferStatus, getTradeOffersWithDescriptionFromAPI} from '../../alarms/trade_offer';
import {rgDescription} from '../../types/steam';
import {SimpleHandler} from './main';
import {RequestType} from './types';

interface FetchSteamTradesRequest {}

export interface FetchSteamTradesResponse {
    received: ExtendedOfferStatus[];
    sent: ExtendedOfferStatus[];
    descriptions: rgDescription[];
    steam_id?: string | null;
}

export const FetchSteamTrades = new SimpleHandler<FetchSteamTradesRequest, FetchSteamTradesResponse>(
    RequestType.FETCH_STEAM_TRADES,
    async (req) => {
        const resp = await getTradeOffersWithDescriptionFromAPI();
        if (!resp) {
            throw new Error('Error fetching Steam trade offers from API');
        }

        return resp;
    }
);
