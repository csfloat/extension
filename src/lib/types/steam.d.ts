import $ from "jquery";

type AppId = 730;
type ContextId = 2;

export interface Action {
    link: string;
    name: string;
}

// g_rgListingInfo
export interface ListingData {
    listingid: string;
    fee: number;
    price: number;
    converted_price?: number;
    converted_fee?: number;
    converted_currencyid?: number;
    steam_fee: number;
    asset: {
        amount: string;
        appid: AppId;
        currency: number;
        id: string;
        market_actions: Action[];
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
    market_actions?: Action[];
    actions?: Action[];
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
    tags?: {
        category: string;
        internal_name: string;
        localized_category_name?: string;
        localized_tag_name?: string;
    }[];
}

export interface InventoryAsset {
    amount: string;
    appid: AppId;
    assetid: string;
    classid: string;
    contextid: string;
    description: Asset;
    element: HTMLElement;
    homeElement: HTMLElement;
    instanceid: string;
    is_currency: boolean;
}

// g_ActiveInventory.m_owner
export interface mOwner {
    strSteamId: string;
}

// g_ActiveInventory
export interface CInventory {
    m_rgAssets: {[assetId: string]: InventoryAsset};
    m_owner: mOwner;
    selectedItem?: InventoryAsset;
}

export interface CAjaxPagingControls {
    m_bLoading: boolean;
    m_cMaxPages: number;
    m_cPageSize: number;
    m_cTotalCount: number;
    m_iCurrentPage: number;
    m_strClassPrefix: string;
    m_strDefaultAction: string;
    m_strElementPrefix: string;
    GoToPage: (iPage: number, bForce: boolean) => any;
    NextPage: () => any;
    PrevPage: () => any;
}

// Declares globals available in the Steam Page Context
declare global {
    const $J: typeof $;
    const g_rgListingInfo: {[listingId: string]: ListingData};
    const g_rgWalletInfo: WalletInfo|undefined; // Not populated when user is signed-out
    const g_rgAssets: {[appId in AppId]: {[contextId in ContextId]: {[assetId: string]: Asset}}};
    const g_ActiveInventory: CInventory|undefined; // Only populated on Steam inventory pages
    const g_steamID: string;
    const g_oSearchResults: CAjaxPagingControls;
}

export {};
