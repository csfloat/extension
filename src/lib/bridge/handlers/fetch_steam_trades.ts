import { getTradeOffersWithDescriptionFromAPI } from '../../alarms/trade_offer';
import { rgDescription } from '../../types/steam';
import { TradeOfferState } from '../../types/steam_constants';
import {SimpleHandler} from './main';
import {RequestType} from './types';

interface FetchSteamTradesRequest {}

export interface FetchSteamTradesResponse {
    received: ExtendedOfferStatus[];
    sent: ExtendedOfferStatus[];
    descriptions: rgDescription[];
    steam_id?: string | null;
}

export interface ExtendedOfferStatus {
    offer_id: string;
    state: TradeOfferState;
    given_asset_ids?: ExtendedSingleOffer[];
    received_asset_ids?: ExtendedSingleOffer[];
    time_created?: number;
    time_updated?: number;
    other_steam_id64?: string;
}

export interface ExtendedSingleOffer {
    assetid: string;
    classid: string;
    instanceid: string;
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
