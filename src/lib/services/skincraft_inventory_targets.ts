import type {CAppwideInventory, CInventory, InventoryAsset, rgAsset, rgAssetProperty} from '../types/steam';
import type {ItemInfo} from '../bridge/handlers/fetch_inspect_info';
import {ContextId} from '../types/steam_constants';
import {isCAppwideInventory} from '../utils/checkers';
import {formatFloatWithRank, formatSeed, isAgent, isCharm, isPatch, isSkin, isSticker} from '../utils/skin';
import {steamEconomyImageUrl} from '../utils/steam_images';
import {gFloatFetcher} from './float_fetcher';
import {
    HEX_COLOR_PATTERN,
    MAX_SKINCRAFT_INVENTORY_TARGETS,
    SKINCRAFT_INSPECT_PATTERN,
    STEAM_INSPECT_URL_PATTERN,
} from './skincraft_viewer_protocol';
import type {SkinCraftItem} from './skincraft_viewer_protocol';

type CachedItemInfoLookup = (assetId: string) => ItemInfo | undefined;

const cachedItemInfo: CachedItemInfoLookup = (assetId) => gFloatFetcher.getCached(assetId);

function getAssetProperties(asset: InventoryAsset, fallbackProperties: rgAssetProperty[]): rgAssetProperty[] {
    if (asset.asset_properties?.length) return asset.asset_properties;
    if (asset.description.asset_properties?.length) return asset.description.asset_properties;
    return fallbackProperties;
}

/** Item types SkinCraft renders (gloves fall under `isSkin`). */
function isSkinCraftRenderable(description: rgAsset): boolean {
    return (
        isSkin(description) ||
        isSticker(description) ||
        isCharm(description) ||
        isPatch(description) ||
        isAgent(description)
    );
}

const PROPERTY_SLOT = '%propid:6%';
const MASKED_ACTION_PATTERN =
    /^steam:\/\/(?:run|rungame)\/730\/\d{0,20}\/\+csgo_econ_action_preview%20(%propid:6%|[0-9a-f]{40,8192})$/i;

/** Split at the hex slot, which Steam either fills from asset property 6 or embeds inline. */
function getMaskedInspectAction(description: rgAsset): {prefix: string; embeddedHex?: string} | undefined {
    for (const action of description.actions ?? []) {
        const slot = MASKED_ACTION_PATTERN.exec(action.link)?.[1];
        if (slot) {
            return {
                prefix: action.link.slice(0, action.link.length - slot.length),
                embeddedHex: slot.toLowerCase() === PROPERTY_SLOT ? undefined : slot,
            };
        }
    }
    return undefined;
}

function getSkinCraftInspect(
    asset: InventoryAsset,
    fallbackProperties: rgAssetProperty[]
): Pick<SkinCraftItem, 'inspect' | 'inspectUrl'> | undefined {
    if (!isSkinCraftRenderable(asset.description)) return;

    const action = getMaskedInspectAction(asset.description);
    const inspect =
        getAssetProperties(asset, fallbackProperties)
            .find((property) => property.propertyid === 6)
            ?.string_value?.trim() || action?.embeddedHex;
    if (!inspect || !SKINCRAFT_INSPECT_PATTERN.test(inspect)) return;

    const inspectUrl = action && `${action.prefix}${inspect}`;
    return {inspect, inspectUrl: inspectUrl && STEAM_INSPECT_URL_PATTERN.test(inspectUrl) ? inspectUrl : undefined};
}

export function toSkinCraftItem(
    asset: InventoryAsset | undefined,
    fallbackProperties: rgAssetProperty[] = [],
    getCachedItemInfo: CachedItemInfoLookup = cachedItemInfo
): SkinCraftItem | undefined {
    if (!asset?.description || typeof asset.description.market_hash_name !== 'string') return;

    const inspectFields = getSkinCraftInspect(asset, fallbackProperties);
    if (!inspectFields) return;

    const icon = asset.description.icon_url_large || asset.description.icon_url;
    const itemInfo = getCachedItemInfo(asset.assetid);
    const rarityColor = asset.description.tags?.find((tag) => tag.category === 'Rarity')?.color;
    const backgroundColor = asset.description.background_color;
    return {
        ...inspectFields,
        name: asset.description.market_hash_name,
        iconUrl: icon ? steamEconomyImageUrl(icon) : undefined,
        assetId: asset.assetid,
        seed: itemInfo ? formatSeed(itemInfo) : undefined,
        float: itemInfo ? formatFloatWithRank(itemInfo, 6) : undefined,
        rarityColor: rarityColor && HEX_COLOR_PATTERN.test(rarityColor) ? rarityColor : undefined,
        backgroundColor: backgroundColor && HEX_COLOR_PATTERN.test(backgroundColor) ? backgroundColor : undefined,
    };
}

/** Property lookup for a single active-inventory asset, covering appwide child inventories. */
export function getActiveInventoryAssetProperties(
    activeInventory: CInventory | CAppwideInventory | undefined,
    assetId: string | undefined
): rgAssetProperty[] | undefined {
    if (!activeInventory || !assetId) return;

    const inventories = isCAppwideInventory(activeInventory)
        ? [
              activeInventory.m_rgChildInventories[ContextId.PRIMARY],
              activeInventory.m_rgChildInventories[ContextId.PROTECTED],
              activeInventory,
          ]
        : [activeInventory];

    for (const inventory of inventories) {
        const properties = inventory?.m_rgAssetProperties?.[assetId];
        if (properties?.length) return properties;
    }
    return undefined;
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

            // Same lookup as the clicked item so the strip also sees the appwide parent's map.
            const target = toSkinCraftItem(
                asset,
                getActiveInventoryAssetProperties(activeInventory, asset.assetid),
                getCachedItemInfo
            );
            if (!target) continue;

            seenAssets.add(asset.assetid);
            targets.push(target);
            if (targets.length === MAX_SKINCRAFT_INVENTORY_TARGETS) return targets;
        }
    }

    return targets;
}
