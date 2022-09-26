import {RequestType, SimpleHandler} from "./main";
import {Cache} from "../../utils/cache";
import {CachedQueue, GenericJob} from "../../utils/queue";

export interface FetchStallRequest {
    steam_id64: string;
}

export interface FetchStallResponse {
    listings?: FloatMarketListing[];
    user?: FloatMarketSeller;
}

export interface FetchStallResponseError {
    code?: string;
    message?: string;
}

export interface FloatMarketItem {
    asset_id: string;
    d_param: string;
    def_index: number;
    description: string;
    float_value: number;
    has_screenshot: boolean;
    high_rank: number;
    icon_url: string;
    inspect_link: string;
    is_souvenir: false;
    is_stattrak: false;
    item_name: string;
    low_rank: number;
    market_hash_name: string;
    paint_index: number;
    paint_seed: number;
    phase?: string;
    quality: number;
    rarity: number;
    wear_name: string;
    scm?: {
        price?: number;
        volume?: number;
    };
}

export interface FloatMarketSeller {
    avatar: string;
    flags: number;
    online: boolean;
    stall_public: boolean;
    statistics: {
        median_trade_time: number;
        total_avoided_trades: number;
        total_failed_trades: number;
        total_trades: number;
        total_verified_trades: number;
    }
    steam_id: string;
    username: string;
}

export enum ContractState {
    SOLD = 'sold',
    LISTED = 'listed',
    DELISTED = 'delisted',
    REFUNDED = 'refunded'
}

export enum ContractType {
    BUY_NOW = 'buy_now',
    AUCTION = 'auction'
}

export interface FloatMarketListing {
    created_at: string;
    id: string;
    is_seller: boolean;
    is_watchlisted: boolean;
    item: FloatMarketItem;
    max_offer_discount?: number;
    min_offer_price?: number;
    price: number;
    seller: FloatMarketSeller;
    state: ContractState;
    type: ContractType;
    watchers: number;
}

export const FetchStall = new SimpleHandler<FetchStallRequest, FetchStallResponse>(
    RequestType.FETCH_STALL,
    async (req) => {
        return fetch(`https://csgofloat.com/api/v1/users/${req.steam_id64}/stall`).then(resp => {
            return resp.json().then((json: FetchStallResponse|FetchStallResponseError) => {
                if (resp.ok) {
                    return json;
                } else {
                    throw Error((json as FetchStallResponseError).message);
                }
            }) as Promise<FetchStallResponse>;
        });
    });
