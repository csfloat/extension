import $ from "jquery";

export interface ListingData {
    listingid: string;
    fee: number;
    price: number;
    steam_fee: number;
    asset: {
        amount: string;
        appid: number;
        currency: number;
        id: string;
        market_actions: {
            link: string;
            name: string;
        }[];
    };
}

export interface WalletInfo {
    success: number;
    wallet_country: string;
    wallet_currency: number;
}

// Declares globals available in the Steam Page Context
declare global {
    const $J: typeof $;
    const g_rgListingInfo: {[listingId: string]: ListingData};
    const g_rgWalletInfo: WalletInfo|undefined; // Not populated when user is signed-out
}

export {};
