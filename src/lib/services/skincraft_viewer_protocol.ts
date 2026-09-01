import {STEAM_ECONOMY_IMAGE_PREFIX} from '../utils/steam_images';

export const SKINCRAFT_VIEWER_MESSAGE_SOURCE = 'csfloat-skincraft-viewer' as const;
export const MAX_SKINCRAFT_INVENTORY_TARGETS = 2_000;

export const SKINCRAFT_INSPECT_PATTERN = /^[0-9a-f]{40,8192}$/i;
export const HEX_COLOR_PATTERN = /^[0-9a-f]{6}$/i;
export const STEAM_INSPECT_URL_PATTERN =
    /^steam:\/\/(?:run|rungame)\/730\/\d{0,20}\/\+csgo_econ_action_preview%20[0-9a-f]{40,8192}$/i;
/** Also fits listing ids, which share the numeric-id format. */
export const ASSET_ID_PATTERN = /^\d{1,32}$/;

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
export type ViewSkinCraftListingMessage = {
    source: typeof SKINCRAFT_VIEWER_MESSAGE_SOURCE;
    type: 'view-listing';
    listingId: string;
};

/** Page → content script: the refreshed item strip, answering the `request-items` with `requestId`. */
export type SkinCraftViewerItemsMessage = {
    source: typeof SKINCRAFT_VIEWER_MESSAGE_SOURCE;
    type: 'items';
    requestId: number;
    inventory: SkinCraftItem[];
};

/** Page → content script: whether the `view-listing` hand-off reached Steam's purchase flow. */
export type SkinCraftViewListingResultMessage = {
    source: typeof SKINCRAFT_VIEWER_MESSAGE_SOURCE;
    type: 'view-result';
    listingId: string;
    success: boolean;
};

function isOptionalString(value: unknown): value is string | undefined {
    return value === undefined || typeof value === 'string';
}

function isOptionalMatch(value: unknown, pattern: RegExp): value is string | undefined {
    return value === undefined || (typeof value === 'string' && pattern.test(value));
}

/** Icons render straight into the modal, so only Steam's own image CDN is accepted. */
function isTrustedIconUrl(value: unknown): value is string {
    return typeof value === 'string' && value.startsWith(STEAM_ECONOMY_IMAGE_PREFIX);
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
        typeof line.text === 'string' &&
        (line.italic === undefined || typeof line.italic === 'boolean') &&
        isOptionalMatch(line.color, HEX_COLOR_PATTERN)
    );
}

function isSkinCraftAccessory(data: unknown): data is SkinCraftAccessory {
    if (!data || typeof data !== 'object') return false;

    const accessory = data as Partial<SkinCraftAccessory>;
    return (
        typeof accessory.name === 'string' &&
        isOptionalString(accessory.detail) &&
        (accessory.iconUrl === undefined || isTrustedIconUrl(accessory.iconUrl))
    );
}

function isSkinCraftListingDetails(data: unknown): data is SkinCraftListingDetails {
    if (!data || typeof data !== 'object') return false;

    const details = data as Partial<SkinCraftListingDetails>;
    return (
        isOptionalString(details.listingId) &&
        isOptionalString(details.game) &&
        isOptionalString(details.type) &&
        isOptionalString(details.nameTag) &&
        isOptionalString(details.patternTemplate) &&
        isOptionalString(details.wearRating) &&
        isOptionalString(details.price) &&
        (details.tradeRestrictionDays === undefined || typeof details.tradeRestrictionDays === 'number') &&
        (details.marketRestrictionDays === undefined || typeof details.marketRestrictionDays === 'number') &&
        (details.accessories === undefined ||
            (Array.isArray(details.accessories) && details.accessories.every(isSkinCraftAccessory))) &&
        (details.lines === undefined || (Array.isArray(details.lines) && details.lines.every(isSkinCraftDetailLine)))
    );
}

/**
 * Display fields only need to be strings — they render as text. The patterns guard the fields we
 * *act* on: the inspect hex (sent to the embed and its URLs), the `steam://` launch link (assigned
 * to `location.href`), colours (injected into styles), and icon URLs (loaded as images).
 */
function isSkinCraftItem(data: unknown): data is SkinCraftItem {
    if (!data || typeof data !== 'object') return false;

    const item = data as Partial<SkinCraftItem>;
    return (
        typeof item.inspect === 'string' &&
        SKINCRAFT_INSPECT_PATTERN.test(item.inspect) &&
        isOptionalMatch(item.inspectUrl, STEAM_INSPECT_URL_PATTERN) &&
        typeof item.name === 'string' &&
        isOptionalString(item.assetId) &&
        isOptionalString(item.seed) &&
        isOptionalString(item.float) &&
        isOptionalMatch(item.rarityColor, HEX_COLOR_PATTERN) &&
        isOptionalMatch(item.backgroundColor, HEX_COLOR_PATTERN) &&
        (item.iconUrl === undefined || isTrustedIconUrl(item.iconUrl)) &&
        (item.details === undefined || isSkinCraftListingDetails(item.details))
    );
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

export function isViewSkinCraftListingMessage(data: unknown): data is ViewSkinCraftListingMessage {
    if (!data || typeof data !== 'object') return false;

    const message = data as Partial<ViewSkinCraftListingMessage>;
    return (
        message.source === SKINCRAFT_VIEWER_MESSAGE_SOURCE &&
        message.type === 'view-listing' &&
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

export function isSkinCraftViewListingResultMessage(data: unknown): data is SkinCraftViewListingResultMessage {
    if (!data || typeof data !== 'object') return false;

    const message = data as Partial<SkinCraftViewListingResultMessage>;
    return (
        message.source === SKINCRAFT_VIEWER_MESSAGE_SOURCE &&
        message.type === 'view-result' &&
        typeof message.listingId === 'string' &&
        ASSET_ID_PATTERN.test(message.listingId) &&
        typeof message.success === 'boolean'
    );
}
