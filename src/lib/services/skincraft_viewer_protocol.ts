export const SKINCRAFT_VIEWER_MESSAGE_SOURCE = 'csfloat-skincraft-viewer' as const;
export const MAX_SKINCRAFT_INVENTORY_TARGETS = 2_000;

export type OpenSkinCraftViewerTarget = {
    inspect: string;
    name: string;
    iconUrl?: string;
    assetId?: string;
    seed?: string;
    float?: string;
    rarityColor?: string;
    backgroundColor?: string;
};

export type OpenSkinCraftViewerMessage = {
    source: typeof SKINCRAFT_VIEWER_MESSAGE_SOURCE;
    type: 'open';
    target: OpenSkinCraftViewerTarget;
    inventory: OpenSkinCraftViewerTarget[];
};

function isViewerTarget(data: unknown): data is OpenSkinCraftViewerTarget {
    if (!data || typeof data !== 'object') return false;

    const target = data as Partial<OpenSkinCraftViewerTarget>;
    return (
        typeof target.inspect === 'string' &&
        /^[0-9a-f]{40,8192}$/i.test(target.inspect) &&
        typeof target.name === 'string' &&
        target.name.length <= 512 &&
        (target.assetId === undefined || (typeof target.assetId === 'string' && /^\d{1,32}$/.test(target.assetId))) &&
        (target.seed === undefined || (typeof target.seed === 'string' && target.seed.length <= 64)) &&
        (target.float === undefined || (typeof target.float === 'string' && target.float.length <= 64)) &&
        (target.rarityColor === undefined ||
            (typeof target.rarityColor === 'string' && /^[0-9a-f]{6}$/i.test(target.rarityColor))) &&
        (target.backgroundColor === undefined ||
            (typeof target.backgroundColor === 'string' && /^[0-9a-f]{6}$/i.test(target.backgroundColor))) &&
        (target.iconUrl === undefined ||
            (typeof target.iconUrl === 'string' &&
                target.iconUrl.length <= 4096 &&
                target.iconUrl.startsWith('https://community.akamai.steamstatic.com/economy/image/')))
    );
}

export function isOpenSkinCraftViewerMessage(data: unknown): data is OpenSkinCraftViewerMessage {
    if (!data || typeof data !== 'object') return false;

    const message = data as Partial<OpenSkinCraftViewerMessage>;
    return (
        message.source === SKINCRAFT_VIEWER_MESSAGE_SOURCE &&
        message.type === 'open' &&
        isViewerTarget(message.target) &&
        Array.isArray(message.inventory) &&
        message.inventory.length <= MAX_SKINCRAFT_INVENTORY_TARGETS &&
        message.inventory.every(isViewerTarget)
    );
}
