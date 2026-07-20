import type {CAppwideInventory, CInventory, InventoryAsset, rgAssetProperty} from '../types/steam';
import type {ItemInfo} from '../bridge/handlers/fetch_inspect_info';
import {ContextId} from '../types/steam_constants';
import {isCAppwideInventory} from '../utils/checkers';
import {formatFloatWithRank, formatSeed, isSkin} from '../utils/skin';
import {gFloatFetcher} from './float_fetcher';
import {MAX_SKINCRAFT_INVENTORY_TARGETS} from './skincraft_viewer_protocol';
import type {OpenSkinCraftViewerTarget} from './skincraft_viewer_protocol';

function getAssetProperties(asset: InventoryAsset, fallbackProperties: rgAssetProperty[]): rgAssetProperty[] {
    if (asset.asset_properties?.length) return asset.asset_properties;
    if (asset.description.asset_properties?.length) return asset.description.asset_properties;
    return fallbackProperties;
}

export function getSkinCraftInspect(
    asset: InventoryAsset | undefined,
    fallbackProperties: rgAssetProperty[] = []
): string | undefined {
    if (!asset?.description || !isSkin(asset.description)) return;

    return (
        getAssetProperties(asset, fallbackProperties)
            .find((property) => property.propertyid === 6)
            ?.string_value?.trim() || undefined
    );
}

function toViewerTarget(
    inventory: CInventory,
    asset: InventoryAsset,
    getCachedItemInfo: (assetId: string) => ItemInfo | undefined
): OpenSkinCraftViewerTarget | undefined {
    if (!asset.description || typeof asset.description.market_hash_name !== 'string') return;

    const inspect = getSkinCraftInspect(asset, inventory.m_rgAssetProperties[asset.assetid]);
    if (!inspect || !/^[0-9a-f]{40,8192}$/i.test(inspect)) return;

    const icon = asset.description.icon_url_large || asset.description.icon_url;
    const itemInfo = getCachedItemInfo(asset.assetid);
    const rarityColor = asset.description.tags?.find((tag) => tag.category === 'Rarity')?.color;
    const backgroundColor = asset.description.background_color;
    return {
        inspect,
        name: asset.description.market_hash_name,
        iconUrl: icon ? `https://community.akamai.steamstatic.com/economy/image/${icon}/330x192` : undefined,
        assetId: asset.assetid,
        seed: itemInfo ? formatSeed(itemInfo) : undefined,
        float: itemInfo ? formatFloatWithRank(itemInfo, 6) : undefined,
        rarityColor: rarityColor && /^[0-9a-f]{6}$/i.test(rarityColor) ? rarityColor : undefined,
        backgroundColor: backgroundColor && /^[0-9a-f]{6}$/i.test(backgroundColor) ? backgroundColor : undefined,
    };
}

export function getLoadedInventoryTargets(
    activeInventory: CInventory | CAppwideInventory,
    getCachedItemInfo: (assetId: string) => ItemInfo | undefined = (assetId) => gFloatFetcher.getCached(assetId)
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

            const target = toViewerTarget(inventory, asset, getCachedItemInfo);
            if (!target) continue;

            seenAssets.add(asset.assetid);
            targets.push(target);
            if (targets.length === MAX_SKINCRAFT_INVENTORY_TARGETS) return targets;
        }
    }

    return targets;
}
