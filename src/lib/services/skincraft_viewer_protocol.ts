import {STEAM_ECONOMY_IMAGE_PREFIX} from '../utils/steam_images';

export const SKINCRAFT_VIEWER_MESSAGE_SOURCE = 'csfloat-skincraft-viewer' as const;
export const MAX_SKINCRAFT_INVENTORY_TARGETS = 2_000;

export const SKINCRAFT_INSPECT_PATTERN = /^[0-9a-f]{40,8192}$/i;
export const HEX_COLOR_PATTERN = /^[0-9a-f]{6}$/i;

/** An item as it crosses the page → content-script boundary. */
export type SkinCraftItem = {
    inspect: string;
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

function isSkinCraftItem(data: unknown): data is SkinCraftItem {
    if (!data || typeof data !== 'object') return false;

    const target = data as Partial<SkinCraftItem>;
    return (
        typeof target.inspect === 'string' &&
        SKINCRAFT_INSPECT_PATTERN.test(target.inspect) &&
        typeof target.name === 'string' &&
        target.name.length <= 512 &&
        (target.assetId === undefined || (typeof target.assetId === 'string' && /^\d{1,32}$/.test(target.assetId))) &&
        (target.seed === undefined || (typeof target.seed === 'string' && target.seed.length <= 64)) &&
        (target.float === undefined || (typeof target.float === 'string' && target.float.length <= 64)) &&
        (target.rarityColor === undefined ||
            (typeof target.rarityColor === 'string' && HEX_COLOR_PATTERN.test(target.rarityColor))) &&
        (target.backgroundColor === undefined ||
            (typeof target.backgroundColor === 'string' && HEX_COLOR_PATTERN.test(target.backgroundColor))) &&
        (target.iconUrl === undefined ||
            (typeof target.iconUrl === 'string' &&
                target.iconUrl.length <= 4096 &&
                target.iconUrl.startsWith(STEAM_ECONOMY_IMAGE_PREFIX)))
    );
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
