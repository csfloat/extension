import $ from "jquery";

type AppId = 730;
type ContextId = 2;

export interface MarketAction {
    link: string;
    name: string;
}

// g_rgListingInfo
export interface ListingData {
    listingid: string;
    fee: number;
    price: number;
    steam_fee: number;
    asset: {
        amount: string;
        appid: AppId;
        currency: number;
        id: string;
        market_actions: MarketAction[];
    };
}

// g_rgWalletInfo
export interface WalletInfo {
    success: number;
    wallet_country: string;
    wallet_currency: number;
}

// g_rgAssets
export interface Asset {
    amount: number;
    app_icon: string;
    appid: AppId;
    background_color: string;
    classid: string;
    commodity: number;
    contextid: string;
    currency: number;
    descriptions: {
        type: string;
        value: string;
    }[];
    icon_url: string;
    icon_url_large: string;
    id: string;
    instanceid: string;
    is_stackable: boolean;
    market_actions: MarketAction[];
    market_hash_name: string;
    market_name: string;
    market_tradable_restriction: number;
    marketable: number;
    name: string;
    name_color: string;
    original_amount: string;
    owner: number;
    status: number;
    tradable: number;
    type: string;
    unowned_contextid: string;
    unowned_id: string;
}

// Declares globals available in the Steam Page Context
declare global {
    const $J: typeof $;
    const g_rgListingInfo: {[listingId: string]: ListingData};
    const g_rgWalletInfo: WalletInfo|undefined; // Not populated when user is signed-out
    const g_rgAssets: {[appId in AppId]: {[contextId in ContextId]: {[assetId: string]: Asset}}};
}

export {};
