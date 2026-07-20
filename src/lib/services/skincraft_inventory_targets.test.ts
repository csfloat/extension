import {describe, expect, it} from 'vitest';
import type {CInventory, InventoryAsset} from '../types/steam';
import {getLoadedInventoryTargets} from './skincraft_inventory_targets';

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
    it('skips Steam assets whose descriptions are not initialized yet', () => {
        const pendingAsset = {
            assetid: '123',
            description: undefined,
        } as unknown as InventoryAsset;

        expect(getLoadedInventoryTargets(createInventory([pendingAsset]))).toEqual([]);
    });
});
