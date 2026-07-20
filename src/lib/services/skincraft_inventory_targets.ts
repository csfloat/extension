import type {CAppwideInventory, CInventory, InventoryAsset, rgAssetProperty} from '../types/steam';
import {ContextId} from '../types/steam_constants';
import {isCAppwideInventory} from '../utils/checkers';
import {isSkin} from '../utils/skin';
import {MAX_SKINCRAFT_INVENTORY_TARGETS} from './skincraft_viewer_protocol';
import type {OpenSkinCraftViewerTarget} from './skincraft_viewer_protocol';

function getAssetProperties(inventory: CInventory, asset: InventoryAsset): rgAssetProperty[] {
    if (asset.asset_properties?.length) return asset.asset_properties;
    if (asset.description.asset_properties?.length) return asset.description.asset_properties;
    return inventory.m_rgAssetProperties[asset.assetid] || [];
}

function toViewerTarget(inventory: CInventory, asset: InventoryAsset): OpenSkinCraftViewerTarget | undefined {
    if (!asset.description || typeof asset.description.market_hash_name !== 'string') return;
    if (!isSkin(asset.description)) return;

    const inspect = getAssetProperties(inventory, asset)
        .find((property) => property.propertyid === 6)
        ?.string_value?.trim();
    if (!inspect || !/^[0-9a-f]{40,8192}$/i.test(inspect)) return;

    const icon = asset.description.icon_url_large || asset.description.icon_url;
    return {
        inspect,
        name: asset.description.market_hash_name,
        iconUrl: icon ? `https://community.akamai.steamstatic.com/economy/image/${icon}/330x192` : undefined,
        assetId: asset.assetid,
    };
}

export function getLoadedInventoryTargets(
    activeInventory: CInventory | CAppwideInventory
): OpenSkinCraftViewerTarget[] {
    const inventories = isCAppwideInventory(activeInventory)
        ? [
              activeInventory.m_rgChildInventories[ContextId.PRIMARY],
              activeInventory.m_rgChildInventories[ContextId.PROTECTED],
          ]
        : [activeInventory];
    const targets: OpenSkinCraftViewerTarget[] = [];
    const seenAssets = new Set<string>();

    for (const inventory of inventories) {
        if (!inventory) continue;

        for (const asset of Object.values(inventory.m_rgAssets)) {
            if (seenAssets.has(asset.assetid)) continue;

            const target = toViewerTarget(inventory, asset);
            if (!target) continue;

            seenAssets.add(asset.assetid);
            targets.push(target);
            if (targets.length === MAX_SKINCRAFT_INVENTORY_TARGETS) return targets;
        }
    }

    return targets;
}
