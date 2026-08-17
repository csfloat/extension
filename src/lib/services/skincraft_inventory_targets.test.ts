import {describe, expect, it} from 'vitest';
import type {ItemInfo} from '../bridge/handlers/fetch_inspect_info';
import type {CAppwideInventory, CInventory, InventoryAsset} from '../types/steam';
import {ContextId} from '../types/steam_constants';
import {getLoadedInventoryTargets, toSkinCraftItem} from './skincraft_inventory_targets';
import {isOpenSkinCraftViewerMessage, SKINCRAFT_VIEWER_MESSAGE_SOURCE} from './skincraft_viewer_protocol';

function createInventory(assets: InventoryAsset[]): CInventory {
    return {
        initialized: true,
        m_rgAssetProperties: {},
        m_rgAssets: Object.fromEntries(assets.map((asset) => [asset.assetid, asset])),
        m_parentInventory: null,
        rgInventory: {},
    } as unknown as CInventory;
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

        expect(toSkinCraftItem(asset)?.inspect).toBe('a'.repeat(80));
    });

    it.each([
        ['sticker', 'High Grade Sticker', 'CSGO_Tool_Sticker'],
        ['patch', 'High Grade Patch', 'CSGO_Type_Patch'],
        ['charm', 'Extraordinary Charm', 'CSGO_Tool_Keychain'],
        ['agent', 'Master Agent', 'Type_CustomPlayer'],
    ])('accepts %s items with inspect data', (_kind, type, internalName) => {
        const asset = {
            assetid: '123',
            asset_properties: [{propertyid: 6, string_value: 'a'.repeat(80)}],
            description: {
                market_hash_name: 'name',
                type,
                tags: [{category: 'Type', internal_name: internalName}],
            },
        } as unknown as InventoryAsset;

        expect(toSkinCraftItem(asset)?.inspect).toBe('a'.repeat(80));
    });

    it('rejects item types SkinCraft cannot render', () => {
        const asset = {
            assetid: '123',
            asset_properties: [{propertyid: 6, string_value: 'a'.repeat(80)}],
            description: {
                market_hash_name: 'Dreams & Nightmares Case',
                type: 'Base Grade Container',
                tags: [{category: 'Type', internal_name: 'CSGO_Type_WeaponCase'}],
            },
        } as unknown as InventoryAsset;

        expect(toSkinCraftItem(asset)).toBeUndefined();
    });

    it('derives the steam launch link from the masked inspect action, wherever it sits', () => {
        const asset = {
            assetid: '123',
            asset_properties: [{propertyid: 6, string_value: 'a'.repeat(80)}],
            description: {
                market_hash_name: 'AK-47 | Redline (Field-Tested)',
                tags: [{category: 'Weapon', internal_name: 'weapon_ak47'}],
                actions: [
                    {name: 'View Wiki', link: 'https://example.com/wiki'},
                    {
                        name: 'Inspect in Game...',
                        link: 'steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20%propid:6%',
                    },
                ],
            },
        } as unknown as InventoryAsset;

        expect(toSkinCraftItem(asset)?.inspectUrl).toBe(
            `steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20${'a'.repeat(80)}`
        );
    });

    it('omits the launch link when no action carries the masked placeholder', () => {
        const asset = {
            assetid: '123',
            asset_properties: [{propertyid: 6, string_value: 'a'.repeat(80)}],
            description: {
                market_hash_name: 'AK-47 | Redline (Field-Tested)',
                tags: [{category: 'Weapon', internal_name: 'weapon_ak47'}],
                actions: [
                    {name: 'View Wiki', link: 'https://example.com/wiki'},
                    {name: 'Inspect in Game...', link: 'steam://rungame/730/123/+csgo_econ_action_preview%20S1A2D3'},
                ],
            },
        } as unknown as InventoryAsset;

        expect(toSkinCraftItem(asset)?.inspectUrl).toBeUndefined();
    });

    it('produces items the viewer protocol accepts, even for oversized inspects', () => {
        const asset = {
            assetid: '123',
            asset_properties: [{propertyid: 6, string_value: 'a'.repeat(5000)}],
            description: {
                market_hash_name: 'AK-47 | Redline (Field-Tested)',
                tags: [{category: 'Weapon', internal_name: 'weapon_ak47'}],
                actions: [
                    {
                        name: 'Inspect in Game...',
                        link: 'steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20%propid:6%',
                    },
                ],
            },
        } as unknown as InventoryAsset;
        const target = toSkinCraftItem(asset);

        expect(target?.inspectUrl).toBeDefined();
        expect(
            isOpenSkinCraftViewerMessage({
                source: SKINCRAFT_VIEWER_MESSAGE_SOURCE,
                type: 'open',
                target,
                inventory: [target],
            })
        ).toBe(true);
    });

    it('rejects half-hydrated non-skin descriptions without throwing', () => {
        const asset = {
            assetid: '123',
            asset_properties: [{propertyid: 6, string_value: 'a'.repeat(80)}],
            description: {
                market_hash_name: 'name',
                tags: [{category: 'Type', internal_name: 'CSGO_Tool_Sticker'}],
            },
        } as unknown as InventoryAsset;

        expect(toSkinCraftItem(asset)).toBeUndefined();
    });

    it('skips Steam assets whose descriptions are not initialized yet', () => {
        const pendingAsset = {
            assetid: '123',
            description: undefined,
        } as unknown as InventoryAsset;

        expect(getLoadedInventoryTargets(createInventory([pendingAsset]))).toEqual([]);
    });

    it('falls back to the appwide parent property map when children carry none', () => {
        const asset = {
            assetid: '123',
            description: {
                market_hash_name: 'AK-47 | Redline (Field-Tested)',
                tags: [{category: 'Weapon', internal_name: 'weapon_ak47'}],
            },
        } as unknown as InventoryAsset;
        const appwide = {
            m_rgChildInventories: {[ContextId.PRIMARY]: createInventory([asset])},
            m_rgAssetProperties: {'123': [{propertyid: 6, string_value: 'a'.repeat(80)}]},
        } as unknown as CAppwideInventory;

        expect(getLoadedInventoryTargets(appwide)).toEqual([expect.objectContaining({inspect: 'a'.repeat(80)})]);
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
