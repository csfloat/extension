import {STEAM_ECONOMY_IMAGE_PREFIX} from '../utils/steam_images';

export const SKINCRAFT_VIEWER_MESSAGE_SOURCE = 'csfloat-skincraft-viewer' as const;
export const MAX_SKINCRAFT_INVENTORY_TARGETS = 2_000;

export const SKINCRAFT_INSPECT_PATTERN = /^[0-9a-f]{40,8192}$/i;
export const HEX_COLOR_PATTERN = /^[0-9a-f]{6}$/i;
export const STEAM_INSPECT_URL_PATTERN =
    /^steam:\/\/(?:run|rungame)\/730\/\d{0,20}\/\+csgo_econ_action_preview%20[0-9a-f]{40,8192}$/i;
/** Also fits listing ids, which share the numeric-id format. */
export const ASSET_ID_PATTERN = /^\d{1,32}$/;
export const MAX_SKINCRAFT_DETAIL_LINES = 24;
export const MAX_SKINCRAFT_DETAIL_TEXT = 2048;
export const MAX_SKINCRAFT_ACCESSORIES = 8;

// Producers must clamp to these same bounds: one over-limit field drops its whole message.
export const MAX_SKINCRAFT_ITEM_NAME = 512;
export const MAX_SKINCRAFT_ICON_URL = 4096;
export const MAX_SKINCRAFT_ACCESSORY_NAME = 256;
export const MAX_SKINCRAFT_ACCESSORY_DETAIL = 128;
export const MAX_SKINCRAFT_DETAIL_FIELD = 256;
export const MAX_SKINCRAFT_PATTERN_TEMPLATE = 16;
export const MAX_SKINCRAFT_WEAR_RATING = 32;
export const MAX_SKINCRAFT_PRICE = 64;

/** One sanitized line of Steam's item description block (exterior, flavour text, collection, …). */
export type SkinCraftDetailLine = {
    text: string;
    italic?: boolean;
    color?: string;
};

/** A sticker or charm applied to the listed item. */
export type SkinCraftAccessory = {
    name: string;
    iconUrl?: string;
    /** Steam's per-accessory attribute line, e.g. "Sticker Scrape Level: 0.680000007". */
    detail?: string;
};

/** The listing facts the viewer's details panel mirrors from Steam's own item dialog. */
export type SkinCraftListingDetails = {
    listingId?: string;
    game?: string;
    type?: string;
    nameTag?: string;
    patternTemplate?: string;
    wearRating?: string;
    price?: string;
    tradeRestrictionDays?: number;
    marketRestrictionDays?: number;
    accessories?: SkinCraftAccessory[];
    lines?: SkinCraftDetailLine[];
};

/** An item as it crosses the page → content-script boundary. */
export type SkinCraftItem = {
    inspect: string;
    /** The `steam://` launch link; `inspect` is the masked hex on its own. */
    inspectUrl?: string;
    name: string;
    iconUrl?: string;
    assetId?: string;
    seed?: string;
    float?: string;
    rarityColor?: string;
    backgroundColor?: string;
    details?: SkinCraftListingDetails;
};

/** A {@link SkinCraftItem} the modal can render, with its SkinCraft permalink resolved. */
export type SkinCraftViewerTarget = SkinCraftItem & {itemUrl: string};

export type OpenSkinCraftViewerMessage = {
    source: typeof SKINCRAFT_VIEWER_MESSAGE_SOURCE;
    type: 'open';
    target: SkinCraftItem;
    inventory: SkinCraftItem[];
};

/**
 * Content script → page: load more items for the viewer's strip (paginated surfaces only). The
 * page echoes `requestId` so an answer to a request from an earlier viewer session is recognizable.
 */
export type RequestSkinCraftViewerItemsMessage = {
    source: typeof SKINCRAFT_VIEWER_MESSAGE_SOURCE;
    type: 'request-items';
    requestId: number;
};

/** Content script → page: hand the user off to Steam's own purchase flow for a listing. */
export type BuySkinCraftListingMessage = {
    source: typeof SKINCRAFT_VIEWER_MESSAGE_SOURCE;
    type: 'buy-listing';
    listingId: string;
};

/** Page → content script: the refreshed item strip, answering the `request-items` with `requestId`. */
export type SkinCraftViewerItemsMessage = {
    source: typeof SKINCRAFT_VIEWER_MESSAGE_SOURCE;
    type: 'items';
    requestId: number;
    inventory: SkinCraftItem[];
};

/** Page → content script: whether the `buy-listing` hand-off reached Steam's purchase flow. */
export type SkinCraftBuyListingResultMessage = {
    source: typeof SKINCRAFT_VIEWER_MESSAGE_SOURCE;
    type: 'buy-result';
    listingId: string;
    success: boolean;
};

function isBoundedString(value: unknown, maxLength: number): value is string {
    return typeof value === 'string' && value.length <= maxLength;
}

function isOptional<T>(value: unknown, check: (value: unknown) => value is T): boolean {
    return value === undefined || check(value);
}

export function isRestrictionDays(value: unknown): value is number {
    return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 365;
}

function isRequestId(value: unknown): value is number {
    return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

/**
 * A message claiming our source and an expected type, yet failing its guard — producer/validator
 * drift that receivers log rather than drop silently.
 */
export function isMalformedSkinCraftViewerMessage(data: unknown, expectedTypes: readonly string[]): boolean {
    if (!data || typeof data !== 'object') return false;

    const message = data as {source?: unknown; type?: unknown};
    return (
        message.source === SKINCRAFT_VIEWER_MESSAGE_SOURCE &&
        typeof message.type === 'string' &&
        expectedTypes.includes(message.type)
    );
}

function isSkinCraftDetailLine(data: unknown): data is SkinCraftDetailLine {
    if (!data || typeof data !== 'object') return false;

    const line = data as Partial<SkinCraftDetailLine>;
    return (
        isBoundedString(line.text, MAX_SKINCRAFT_DETAIL_TEXT) &&
        (line.italic === undefined || typeof line.italic === 'boolean') &&
        (line.color === undefined || (typeof line.color === 'string' && HEX_COLOR_PATTERN.test(line.color)))
    );
}

function isSkinCraftAccessory(data: unknown): data is SkinCraftAccessory {
    if (!data || typeof data !== 'object') return false;

    const accessory = data as Partial<SkinCraftAccessory>;
    return (
        isBoundedString(accessory.name, MAX_SKINCRAFT_ACCESSORY_NAME) &&
        isOptional(accessory.detail, (v): v is string => isBoundedString(v, MAX_SKINCRAFT_ACCESSORY_DETAIL)) &&
        (accessory.iconUrl === undefined ||
            (isBoundedString(accessory.iconUrl, MAX_SKINCRAFT_ICON_URL) &&
                accessory.iconUrl.startsWith(STEAM_ECONOMY_IMAGE_PREFIX)))
    );
}

function isSkinCraftListingDetails(data: unknown): data is SkinCraftListingDetails {
    if (!data || typeof data !== 'object') return false;

    const details = data as Partial<SkinCraftListingDetails>;
    return (
        (details.listingId === undefined ||
            (typeof details.listingId === 'string' && ASSET_ID_PATTERN.test(details.listingId))) &&
        (details.accessories === undefined ||
            (Array.isArray(details.accessories) &&
                details.accessories.length <= MAX_SKINCRAFT_ACCESSORIES &&
                details.accessories.every(isSkinCraftAccessory))) &&
        isOptional(details.game, (v): v is string => isBoundedString(v, 128)) &&
        isOptional(details.type, (v): v is string => isBoundedString(v, MAX_SKINCRAFT_DETAIL_FIELD)) &&
        isOptional(details.nameTag, (v): v is string => isBoundedString(v, MAX_SKINCRAFT_DETAIL_FIELD)) &&
        isOptional(details.patternTemplate, (v): v is string => isBoundedString(v, MAX_SKINCRAFT_PATTERN_TEMPLATE)) &&
        isOptional(details.wearRating, (v): v is string => isBoundedString(v, MAX_SKINCRAFT_WEAR_RATING)) &&
        isOptional(details.price, (v): v is string => isBoundedString(v, MAX_SKINCRAFT_PRICE)) &&
        isOptional(details.tradeRestrictionDays, isRestrictionDays) &&
        isOptional(details.marketRestrictionDays, isRestrictionDays) &&
        (details.lines === undefined ||
            (Array.isArray(details.lines) &&
                details.lines.length <= MAX_SKINCRAFT_DETAIL_LINES &&
                details.lines.every(isSkinCraftDetailLine)))
    );
}

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
        (item.iconUrl === undefined || typeof item.iconUrl === 'string') &&
        (item.details === undefined || isSkinCraftListingDetails(item.details))
    );
}

/** Content rules for a well-typed item: field bounds, patterns, and the trusted image origin. */
function isValidSkinCraftItem(item: SkinCraftItem): boolean {
    return (
        SKINCRAFT_INSPECT_PATTERN.test(item.inspect) &&
        (item.inspectUrl === undefined || STEAM_INSPECT_URL_PATTERN.test(item.inspectUrl)) &&
        item.name.length <= MAX_SKINCRAFT_ITEM_NAME &&
        (item.assetId === undefined || ASSET_ID_PATTERN.test(item.assetId)) &&
        (item.seed === undefined || item.seed.length <= 64) &&
        (item.float === undefined || item.float.length <= 64) &&
        (item.rarityColor === undefined || HEX_COLOR_PATTERN.test(item.rarityColor)) &&
        (item.backgroundColor === undefined || HEX_COLOR_PATTERN.test(item.backgroundColor)) &&
        (item.iconUrl === undefined ||
            (item.iconUrl.length <= MAX_SKINCRAFT_ICON_URL && item.iconUrl.startsWith(STEAM_ECONOMY_IMAGE_PREFIX)))
    );
}

function isSkinCraftItem(data: unknown): data is SkinCraftItem {
    return isSkinCraftItemShape(data) && isValidSkinCraftItem(data);
}

function isSkinCraftItemList(data: unknown): data is SkinCraftItem[] {
    return Array.isArray(data) && data.length <= MAX_SKINCRAFT_INVENTORY_TARGETS && data.every(isSkinCraftItem);
}

export function isOpenSkinCraftViewerMessage(data: unknown): data is OpenSkinCraftViewerMessage {
    if (!data || typeof data !== 'object') return false;

    const message = data as Partial<OpenSkinCraftViewerMessage>;
    return (
        message.source === SKINCRAFT_VIEWER_MESSAGE_SOURCE &&
        message.type === 'open' &&
        isSkinCraftItem(message.target) &&
        isSkinCraftItemList(message.inventory)
    );
}

export function isRequestSkinCraftViewerItemsMessage(data: unknown): data is RequestSkinCraftViewerItemsMessage {
    if (!data || typeof data !== 'object') return false;

    const message = data as Partial<RequestSkinCraftViewerItemsMessage>;
    return (
        message.source === SKINCRAFT_VIEWER_MESSAGE_SOURCE &&
        message.type === 'request-items' &&
        isRequestId(message.requestId)
    );
}

export function isBuySkinCraftListingMessage(data: unknown): data is BuySkinCraftListingMessage {
    if (!data || typeof data !== 'object') return false;

    const message = data as Partial<BuySkinCraftListingMessage>;
    return (
        message.source === SKINCRAFT_VIEWER_MESSAGE_SOURCE &&
        message.type === 'buy-listing' &&
        typeof message.listingId === 'string' &&
        ASSET_ID_PATTERN.test(message.listingId)
    );
}

export function isSkinCraftViewerItemsMessage(data: unknown): data is SkinCraftViewerItemsMessage {
    if (!data || typeof data !== 'object') return false;

    const message = data as Partial<SkinCraftViewerItemsMessage>;
    return (
        message.source === SKINCRAFT_VIEWER_MESSAGE_SOURCE &&
        message.type === 'items' &&
        isRequestId(message.requestId) &&
        isSkinCraftItemList(message.inventory)
    );
}

export function isSkinCraftBuyListingResultMessage(data: unknown): data is SkinCraftBuyListingResultMessage {
    if (!data || typeof data !== 'object') return false;

    const message = data as Partial<SkinCraftBuyListingResultMessage>;
    return (
        message.source === SKINCRAFT_VIEWER_MESSAGE_SOURCE &&
        message.type === 'buy-result' &&
        typeof message.listingId === 'string' &&
        ASSET_ID_PATTERN.test(message.listingId) &&
        typeof message.success === 'boolean'
    );
}
