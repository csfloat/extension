import {SimpleHandler} from './main';
import {RequestType} from './types';
import {getAccessToken} from '../../alarms/access_token';

export interface FetchSteamPoweredInventoryRequest {
    // steam_id needs to correspond to the logged in user
    steam_id: string;
    app_id: number;
    context_id: number;
    start_assetid?: string;
    count?: number;
    get_descriptions?: boolean;
    for_trade_offer_verification?: boolean;
    language?: string;
    get_asset_properties?: boolean;
}

export interface InventoryAsset {
    assetid: string;
    classid: string;
    instanceid: string;
}

export interface InventoryDescriptionItem {
    value: string;
    name: string;
}

export interface InventoryTag {
    category: string;
    internal_name: string;
    localized_category_name: string;
    localized_tag_name: string;
}

export interface AssetProperty {
    propertyid: number;
    int_value?: string;
    float_value?: string;
    string_value?: string;
}

export interface AssetPropertyWrapper {
    appid: number;
    asset_properties: AssetProperty[];
    assetid: string;
    contextid: string;
}

export interface InventoryDescription {
    name: string;
    market_hash_name: string;
    icon_url: string;
    icon_url_large: string;
    tradable: boolean;
    type: string;
    name_color: string;
    commodity: boolean;
    inspect_link?: string;
    classid: string;
    instanceid: string;
    marketable: boolean;
    descriptions: InventoryDescriptionItem[];
    tags: InventoryTag[];
}

export interface FetchSteamPoweredInventoryResponse {
    assets: InventoryAsset[];
    descriptions: InventoryDescription[];
    asset_properties?: AssetPropertyWrapper[];
    last_assetid?: string;
    total_inventory_count: number;
}

export const FetchSteamPoweredInventory = new SimpleHandler<FetchSteamPoweredInventoryRequest, FetchSteamPoweredInventoryResponse>(
    RequestType.FETCH_STEAM_POWERED_INVENTORY,
    async (req) => {
        const accessToken = await getAccessToken(req.steam_id);

        const params = new URLSearchParams({
            access_token: accessToken.token,
            steamid: req.steam_id,
            appid: req.app_id.toString(),
            contextid: req.context_id.toString(),
        });

        if (req.start_assetid) {
            params.set('start_assetid', req.start_assetid);
        }

        if (req.count) {
            params.set('count', req.count.toString());
        }

        if (req.get_descriptions !== undefined) {
            params.set('get_descriptions', req.get_descriptions.toString());
        }

        if (req.for_trade_offer_verification !== undefined) {
            params.set('for_trade_offer_verification', req.for_trade_offer_verification.toString());
        }

        if (req.language) {
            params.set('language', req.language);
        }

        if (req.get_asset_properties !== undefined) {
            params.set('get_asset_properties', req.get_asset_properties.toString());
        }

        const resp = await fetch(
            `https://api.steampowered.com/IEconService/GetInventoryItemsWithDescriptions/v1/?${params.toString()}`
        );

        if (!resp.ok) {
            throw new Error(`Invalid response code: ${resp.status}`);
        }

        const data = await resp.json();

        if (!data.response) {
            throw new Error('Invalid response from Steam API');
        }

        return data.response as FetchSteamPoweredInventoryResponse;
    }
);
