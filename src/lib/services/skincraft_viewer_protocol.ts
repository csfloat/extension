import {STEAM_ECONOMY_IMAGE_PREFIX} from '../utils/steam_images';

export const SKINCRAFT_VIEWER_MESSAGE_SOURCE = 'csfloat-skincraft-viewer' as const;
export const MAX_SKINCRAFT_INVENTORY_TARGETS = 2_000;

export const SKINCRAFT_INSPECT_PATTERN = /^[0-9a-f]{40,8192}$/i;
export const HEX_COLOR_PATTERN = /^[0-9a-f]{6}$/i;
export const STEAM_INSPECT_URL_PATTERN =
    /^steam:\/\/rungame\/730\/\d{1,20}\/\+csgo_econ_action_preview%20[0-9a-f]{40,8192}$/i;
const ASSET_ID_PATTERN = /^\d{1,32}$/;

/** An item as it crosses the page → content-script boundary. */
export type SkinCraftItem = {
    inspect: string;
    /** The item's own `steam://` launch link, for Inspect clicks forwarded out of the embed. */
    inspectUrl?: string;
    name: string;
    iconUrl?: string;
    assetId?: string;
    seed?: string;
    float?: string;
    rarityColor?: string;
    backgroundColor?: string;
};

/** A {@link SkinCraftItem} the modal can render, with its SkinCraft permalink resolved. */
export type SkinCraftViewerTarget = SkinCraftItem & {itemUrl: string};

export type OpenSkinCraftViewerMessage = {
    source: typeof SKINCRAFT_VIEWER_MESSAGE_SOURCE;
    type: 'open';
    target: SkinCraftItem;
    inventory: SkinCraftItem[];
};

/** Structural check only: does the untyped message data have the shape of a {@link SkinCraftItem}? */
function isSkinCraftItemShape(data: unknown): data is SkinCraftItem {
    if (!data || typeof data !== 'object') return false;

    const item = data as Partial<SkinCraftItem>;
    return (
        typeof item.inspect === 'string' &&
        (item.inspectUrl === undefined || typeof item.inspectUrl === 'string') &&
        typeof item.name === 'string' &&
        (item.assetId === undefined || typeof item.assetId === 'string') &&
        (item.seed === undefined || typeof item.seed === 'string') &&
        (item.float === undefined || typeof item.float === 'string') &&
        (item.rarityColor === undefined || typeof item.rarityColor === 'string') &&
        (item.backgroundColor === undefined || typeof item.backgroundColor === 'string') &&
        (item.iconUrl === undefined || typeof item.iconUrl === 'string')
    );
}

/** Content rules for a well-typed item: field bounds, patterns, and the trusted image origin. */
function isValidSkinCraftItem(item: SkinCraftItem): boolean {
    return (
        SKINCRAFT_INSPECT_PATTERN.test(item.inspect) &&
        (item.inspectUrl === undefined || STEAM_INSPECT_URL_PATTERN.test(item.inspectUrl)) &&
        item.name.length <= 512 &&
        (item.assetId === undefined || ASSET_ID_PATTERN.test(item.assetId)) &&
        (item.seed === undefined || item.seed.length <= 64) &&
        (item.float === undefined || item.float.length <= 64) &&
        (item.rarityColor === undefined || HEX_COLOR_PATTERN.test(item.rarityColor)) &&
        (item.backgroundColor === undefined || HEX_COLOR_PATTERN.test(item.backgroundColor)) &&
        (item.iconUrl === undefined ||
            (item.iconUrl.length <= 4096 && item.iconUrl.startsWith(STEAM_ECONOMY_IMAGE_PREFIX)))
    );
}

function isSkinCraftItem(data: unknown): data is SkinCraftItem {
    return isSkinCraftItemShape(data) && isValidSkinCraftItem(data);
}

export function isOpenSkinCraftViewerMessage(data: unknown): data is OpenSkinCraftViewerMessage {
    if (!data || typeof data !== 'object') return false;

    const message = data as Partial<OpenSkinCraftViewerMessage>;
    return (
        message.source === SKINCRAFT_VIEWER_MESSAGE_SOURCE &&
        message.type === 'open' &&
        isSkinCraftItem(message.target) &&
        Array.isArray(message.inventory) &&
        message.inventory.length <= MAX_SKINCRAFT_INVENTORY_TARGETS &&
        message.inventory.every(isSkinCraftItem)
    );
}
