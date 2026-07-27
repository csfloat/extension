import type {CAppwideInventory, CInventory, InventoryAsset, rgAssetProperty} from '../types/steam';
import type {ItemInfo} from '../bridge/handlers/fetch_inspect_info';
import {ContextId} from '../types/steam_constants';
import {isCAppwideInventory} from '../utils/checkers';
import {formatFloatWithRank, formatSeed, isSkin} from '../utils/skin';
import {steamEconomyImageUrl} from '../utils/steam_images';
import {gFloatFetcher} from './float_fetcher';
import {
    HEX_COLOR_PATTERN,
    MAX_SKINCRAFT_INVENTORY_TARGETS,
    SKINCRAFT_INSPECT_PATTERN,
} from './skincraft_viewer_protocol';
import type {SkinCraftItem} from './skincraft_viewer_protocol';

type CachedItemInfoLookup = (assetId: string) => ItemInfo | undefined;

const cachedItemInfo: CachedItemInfoLookup = (assetId) => gFloatFetcher.getCached(assetId);

function getAssetProperties(asset: InventoryAsset, fallbackProperties: rgAssetProperty[]): rgAssetProperty[] {
    if (asset.asset_properties?.length) return asset.asset_properties;
    if (asset.description.asset_properties?.length) return asset.description.asset_properties;
    return fallbackProperties;
}

function getSkinCraftInspect(
    asset: InventoryAsset | undefined,
    fallbackProperties: rgAssetProperty[]
): string | undefined {
    if (!asset?.description || !isSkin(asset.description)) return;

    return (
        getAssetProperties(asset, fallbackProperties)
            .find((property) => property.propertyid === 6)
            ?.string_value?.trim() || undefined
    );
}

export function toSkinCraftItem(
    asset: InventoryAsset | undefined,
    fallbackProperties: rgAssetProperty[] = [],
    getCachedItemInfo: CachedItemInfoLookup = cachedItemInfo
): SkinCraftItem | undefined {
    if (!asset?.description || typeof asset.description.market_hash_name !== 'string') return;

    const inspect = getSkinCraftInspect(asset, fallbackProperties);
    if (!inspect || !SKINCRAFT_INSPECT_PATTERN.test(inspect)) return;

    const icon = asset.description.icon_url_large || asset.description.icon_url;
    const itemInfo = getCachedItemInfo(asset.assetid);
    const rarityColor = asset.description.tags?.find((tag) => tag.category === 'Rarity')?.color;
    const backgroundColor = asset.description.background_color;
    return {
        inspect,
        name: asset.description.market_hash_name,
        iconUrl: icon ? steamEconomyImageUrl(icon) : undefined,
        assetId: asset.assetid,
        seed: itemInfo ? formatSeed(itemInfo) : undefined,
        float: itemInfo ? formatFloatWithRank(itemInfo, 6) : undefined,
        rarityColor: rarityColor && HEX_COLOR_PATTERN.test(rarityColor) ? rarityColor : undefined,
        backgroundColor: backgroundColor && HEX_COLOR_PATTERN.test(backgroundColor) ? backgroundColor : undefined,
    };
}

export function getLoadedInventoryTargets(
    activeInventory: CInventory | CAppwideInventory,
    getCachedItemInfo: CachedItemInfoLookup = cachedItemInfo
): SkinCraftItem[] {
    const inventories = isCAppwideInventory(activeInventory)
        ? [
              activeInventory.m_rgChildInventories[ContextId.PRIMARY],
              activeInventory.m_rgChildInventories[ContextId.PROTECTED],
          ]
        : [activeInventory];
    const targets: SkinCraftItem[] = [];
    const seenAssets = new Set<string>();

    for (const inventory of inventories) {
        if (!inventory) continue;

        for (const asset of Object.values(inventory.m_rgAssets)) {
            if (seenAssets.has(asset.assetid)) continue;

            const target = toSkinCraftItem(asset, inventory.m_rgAssetProperties[asset.assetid], getCachedItemInfo);
            if (!target) continue;

            seenAssets.add(asset.assetid);
            targets.push(target);
            if (targets.length === MAX_SKINCRAFT_INVENTORY_TARGETS) return targets;
        }
    }

    return targets;
}
