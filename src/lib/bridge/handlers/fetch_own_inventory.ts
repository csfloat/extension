import {SimpleHandler} from './main';
import {RequestType} from './types';
import {rgDescription, rgInventoryAsset} from '../../types/steam';

export interface FetchOwnInventoryRequest {
    expected_steam_id: string;
    app_id: number;
    context_id: number;
}

export interface InventoryResponse {
    more?: boolean;
    more_start?: boolean;
    Error?: string;
    success: boolean;
    rgDescriptions: Map<string, rgDescription>;
    rgInventory: Map<string, rgInventoryAsset>;
}

interface FetchOwnInventoryResponse {
    inventory: InventoryResponse;
}

export const FetchOwnInventory = new SimpleHandler<FetchOwnInventoryRequest, FetchOwnInventoryResponse>(
    RequestType.FETCH_OWN_INVENTORY,
    async (req) => {
        // Will error out if expected_steam_id != logged in user
        const resp = await fetch(
            `https://steamcommunity.com/profiles/${req.expected_steam_id}/inventory/json/${req.app_id}/${req.context_id}/?trading=1`,
            {
                credentials: 'include',
            }
        );
        if (!resp.ok) {
            throw new Error(`Invalid response code: ${resp.status}`);
        }

        const inventory = (await resp.json()) as InventoryResponse;

        return {
            inventory,
        };
    }
);
