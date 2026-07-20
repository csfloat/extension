import {describe, expect, it} from 'vitest';
import type {ItemInfo} from '../bridge/handlers/fetch_inspect_info';
import type {CInventory, InventoryAsset} from '../types/steam';
import {getLoadedInventoryTargets, getSkinCraftInspect} from './skincraft_inventory_targets';

function createInventory(assets: InventoryAsset[]): CInventory {
    return {
        initialized: true,
        m_rgAssetProperties: {},
        m_rgAssets: Object.fromEntries(assets.map((asset) => [asset.assetid, asset])),
        m_parentInventory: null,
        rgInventory: {},
    };
}

describe('SkinCraft inventory targets', () => {
    it('allows skins with inspect data to be viewed independently of listing eligibility', () => {
        const asset = {
            assetid: '123',
            asset_properties: [{propertyid: 6, string_value: 'a'.repeat(80)}],
            description: {
                market_hash_name: 'AK-47 | Redline (Field-Tested)',
                tags: [{category: 'Weapon', internal_name: 'weapon_ak47'}],
                tradable: 0,
            },
        } as unknown as InventoryAsset;

        expect(getSkinCraftInspect(asset)).toBe('a'.repeat(80));
    });

    it('skips Steam assets whose descriptions are not initialized yet', () => {
        const pendingAsset = {
            assetid: '123',
            description: undefined,
        } as unknown as InventoryAsset;

        expect(getLoadedInventoryTargets(createInventory([pendingAsset]))).toEqual([]);
    });

    it('includes cached float metadata and Steam rarity colors', () => {
        const asset = {
            assetid: '123',
            asset_properties: [{propertyid: 6, string_value: 'a'.repeat(80)}],
            description: {
                background_color: '20242d',
                icon_url: 'icon',
                icon_url_large: 'large-icon',
                market_hash_name: 'USP-S | Sleeping Potion (Factory New)',
                tags: [
                    {category: 'Weapon', internal_name: 'weapon_usp_silencer'},
                    {category: 'Rarity', internal_name: 'Rarity_Mythical', color: '8847ff'},
                ],
            },
        } as unknown as InventoryAsset;
        const itemInfo = {
            paintindex: 0,
            paintseed: 977,
            floatvalue: 0.2953754,
        } as ItemInfo;

        expect(getLoadedInventoryTargets(createInventory([asset]), () => itemInfo)).toEqual([
            expect.objectContaining({
                assetId: '123',
                seed: '977',
                float: '0.295375',
                rarityColor: '8847ff',
                backgroundColor: '20242d',
            }),
        ]);
    });
});
