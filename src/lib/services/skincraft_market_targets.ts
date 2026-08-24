import type {
    MarketAssetProperty,
    MarketListing,
    MarketListingAccessory,
    MarketListingProps,
} from '../components/market/react/types';
import {getFiberProps} from '../utils/fiber';
import {toBoundedIconUrl, toSkinCraftItem} from './skincraft_inventory_targets';
import type {CachedItemInfoLookup, SkinCraftSourceAsset} from './skincraft_inventory_targets';
import {
    ASSET_ID_PATTERN,
    HEX_COLOR_PATTERN,
    isRestrictionDays,
    MAX_SKINCRAFT_ACCESSORIES,
    MAX_SKINCRAFT_ACCESSORY_DETAIL,
    MAX_SKINCRAFT_ACCESSORY_NAME,
    MAX_SKINCRAFT_DETAIL_FIELD,
    MAX_SKINCRAFT_DETAIL_LINES,
    MAX_SKINCRAFT_DETAIL_TEXT,
    MAX_SKINCRAFT_INVENTORY_TARGETS,
    MAX_SKINCRAFT_PATTERN_TEMPLATE,
    MAX_SKINCRAFT_PRICE,
    MAX_SKINCRAFT_WEAR_RATING,
} from './skincraft_viewer_protocol';
import type {
    SkinCraftAccessory,
    SkinCraftDetailLine,
    SkinCraftItem,
    SkinCraftListingDetails,
} from './skincraft_viewer_protocol';

/** Every listing card in the Market beta results grid, with or without a rendered screenshot. */
export const MARKET_LISTING_CARD_SELECTOR = 'div[style*="--grid-rows"]';

/** The action row at the bottom of a listing card, holding Steam's own Buy button. */
export const MARKET_PRICE_ROW_SELECTOR = 'div[style*="--justify:end"][style*="--align:center"]:has(button)';

const LOAD_MORE_TIMEOUT_MS = 5_000;
const LOAD_MORE_POLL_MS = 250;

/** Steam's asset property ids, as they appear in both the rg-asset and React-market payloads. */
const AssetPropertyId = {
    PatternTemplate: 1,
    Wear: 2,
    CharmTemplate: 3,
    ScrapeLevel: 4,
    NameTag: 5,
} as const;

/** A market listing reshaped as the inventory-style source {@link toSkinCraftItem} consumes. */
function toListingAsset(listing: MarketListing): SkinCraftSourceAsset {
    // Beta market descriptions ship empty `tags`; dropping them lets the type/name fallbacks
    // decide renderability instead.
    const {tags, ...description} = listing.description;
    return {
        assetid: listing.asset.assetid,
        asset_properties: listing.asset.asset_properties,
        description: tags?.length ? listing.description : description,
    };
}

/** The description entries that duplicate applied sticker/charm data as markup rather than prose. */
const ACCESSORY_INFO_ENTRIES = new Set(['sticker_info', 'keychain_info']);

/** Matches how Steam prints scrape levels: the float32 value at 9 significant digits. */
function formatScrapeLevel(value: number): string {
    return String(Number(value.toPrecision(9)));
}

/** The per-accessory attribute line; property 4 is the sticker scrape level, 3 the charm template. */
function toAccessoryDetail(accessory: MarketListingAccessory): string | undefined {
    const properties = [
        ...(accessory.parent_relationship_properties ?? []),
        ...(accessory.standalone_properties ?? []),
    ];
    const property = (id: number): MarketAssetProperty | undefined => properties.find((p) => p.propertyid === id);

    const scrape = Number(property(AssetPropertyId.ScrapeLevel)?.float_value);
    if (Number.isFinite(scrape)) return `Sticker Scrape Level: ${formatScrapeLevel(scrape)}`;

    const template = property(AssetPropertyId.CharmTemplate)?.int_value;
    if (template) return `Charm Template: ${template}`.slice(0, MAX_SKINCRAFT_ACCESSORY_DETAIL);

    // Steam spells out the zero on unscraped stickers rather than dropping the line.
    return accessory.description?.type?.endsWith('Sticker') ? 'Sticker Scrape Level: 0' : undefined;
}

function toAccessories(listing: MarketListing): SkinCraftAccessory[] | undefined {
    const accessories: SkinCraftAccessory[] = [];
    for (const accessory of listing.asset.asset_accessories ?? []) {
        const description = accessory.description;
        if (typeof description?.market_hash_name !== 'string') continue;

        accessories.push({
            name: description.market_hash_name.slice(0, MAX_SKINCRAFT_ACCESSORY_NAME),
            iconUrl: toBoundedIconUrl(description.icon_url_large || description.icon_url),
            detail: toAccessoryDetail(accessory),
        });
        if (accessories.length === MAX_SKINCRAFT_ACCESSORIES) break;
    }
    return accessories.length ? accessories : undefined;
}

/** Flattens Steam's HTML description entries into sanitized plain-text lines. */
function toDetailLines(listing: MarketListing): SkinCraftDetailLine[] | undefined {
    const lines: SkinCraftDetailLine[] = [];
    for (const entry of listing.description.descriptions ?? []) {
        if ((entry.type && entry.type !== 'html') || typeof entry.value !== 'string') continue;
        if (ACCESSORY_INFO_ENTRIES.has(entry.name)) continue;

        for (const raw of entry.value.split(/\n+/)) {
            const italic = /^\s*<i>/i.test(raw);
            const text = raw.replace(/<[^>]*>/g, '').trim();
            if (!text) continue;

            const color = entry.color && HEX_COLOR_PATTERN.test(entry.color) ? entry.color : undefined;
            lines.push({text: text.slice(0, MAX_SKINCRAFT_DETAIL_TEXT), italic: italic || undefined, color});
            if (lines.length === MAX_SKINCRAFT_DETAIL_LINES) return lines;
        }
    }
    return lines.length ? lines : undefined;
}

/**
 * The buyer-facing price (subtotal + fee, what Steam's cards show), formatted by rewriting the
 * numeric part of the localized `strSubtotal`; falls back to it whenever it doesn't parse as `unPrice`.
 */
export function formatBuyerPrice(listing: MarketListing): string | undefined {
    const subtotal = listing.strSubtotal;
    if (!subtotal) return undefined;

    const {unPrice, unFee} = listing;
    if (!Number.isInteger(unPrice) || !Number.isInteger(unFee) || unFee <= 0) return subtotal;

    const centsDigits = (cents: number): string => (cents / 100).toFixed(2).replace('.', '');
    const numeric = /\d[\d.,'\s]*\d|\d/.exec(subtotal)?.[0];
    // Two-decimal formats only: without that separator this could be a zero-decimal currency.
    const decimalSeparator = numeric && numeric.length >= 4 ? numeric.charAt(numeric.length - 3) : '';
    if (!numeric || !decimalSeparator || /\d/.test(decimalSeparator)) return subtotal;
    if (numeric.replace(/\D/g, '') !== centsDigits(unPrice)) return subtotal;

    const totalDigits = centsDigits(unPrice + unFee);
    const groupSeparator = /\D/.exec(numeric.slice(0, -3))?.[0];
    const integer = totalDigits.slice(0, -2);
    const grouped = groupSeparator ? integer.replace(/\B(?=(\d{3})+$)/g, groupSeparator) : integer;
    return subtotal.replace(numeric, `${grouped}${decimalSeparator}${totalDigits.slice(-2)}`);
}

function toRestrictionDays(value: number | undefined): number | undefined {
    return value && isRestrictionDays(value) ? value : undefined;
}

function toListingDetails(listing: MarketListing): SkinCraftListingDetails {
    const description = listing.description;
    const property = (id: number): MarketAssetProperty | undefined =>
        listing.asset.asset_properties?.find((p) => p.propertyid === id);
    const wear = Number(property(AssetPropertyId.Wear)?.float_value);
    const nameTag = property(AssetPropertyId.NameTag)?.string_value;
    const template = property(AssetPropertyId.PatternTemplate)?.int_value;

    // Clamped to the validator's bounds — one over-limit value would drop the whole message.
    return {
        listingId: ASSET_ID_PATTERN.test(listing.listingid) ? listing.listingid : undefined,
        game: description.appid === 730 ? 'Counter-Strike 2' : undefined,
        type: description.type ? description.type.slice(0, MAX_SKINCRAFT_DETAIL_FIELD) : undefined,
        nameTag: typeof nameTag === 'string' ? nameTag.slice(0, MAX_SKINCRAFT_DETAIL_FIELD) : undefined,
        patternTemplate: template ? String(template).slice(0, MAX_SKINCRAFT_PATTERN_TEMPLATE) : undefined,
        wearRating: Number.isFinite(wear) ? wear.toFixed(8).slice(0, MAX_SKINCRAFT_WEAR_RATING) : undefined,
        price: formatBuyerPrice(listing)?.slice(0, MAX_SKINCRAFT_PRICE),
        tradeRestrictionDays: toRestrictionDays(description.market_tradable_restriction),
        marketRestrictionDays: toRestrictionDays(description.market_marketable_restriction),
        accessories: toAccessories(listing),
        lines: toDetailLines(listing),
    };
}

export function toSkinCraftListingItem(
    listing: MarketListing,
    getCachedItemInfo?: CachedItemInfoLookup
): SkinCraftItem | undefined {
    const target = toSkinCraftItem(toListingAsset(listing), [], getCachedItemInfo);
    if (!target) return;

    // Without tags, rarity falls back to the colour Steam itself renders the name in.
    const nameColor = listing.description.name_color;
    const rarityColor = target.rarityColor ?? (nameColor && HEX_COLOR_PATTERN.test(nameColor) ? nameColor : undefined);
    return {...target, rarityColor, details: toListingDetails(listing)};
}

/** The listing owning `element`, from whichever ancestor fiber carries it in its props. */
export function getFiberListing(element: HTMLElement): MarketListing | undefined {
    return getFiberProps<MarketListingProps>(element, (fiber) => {
        const props = fiber.memoizedProps;
        return !!props && typeof props === 'object' && !!(props as Partial<MarketListingProps>).listing;
    })?.listing;
}

/** SkinCraft targets for the market listings currently mounted on the page, in page order. */
export function getLoadedListingTargets(getCachedItemInfo?: CachedItemInfoLookup): SkinCraftItem[] {
    const targets: SkinCraftItem[] = [];
    const seenAssets = new Set<string>();

    for (const scope of document.querySelectorAll<HTMLElement>(MARKET_LISTING_CARD_SELECTOR)) {
        const listing = getFiberListing(scope);
        const target = listing && toSkinCraftListingItem(listing, getCachedItemInfo);
        if (!target?.assetId || seenAssets.has(target.assetId)) continue;

        seenAssets.add(target.assetId);
        targets.push(target);
        if (targets.length === MAX_SKINCRAFT_INVENTORY_TARGETS) break;
    }

    return targets;
}

/**
 * Loads the grid's next page by revealing its infinite-scroll sentinel — Steam's own loader keeps
 * pagination consistent with whatever filters the user has applied — then re-harvests every mounted
 * card. The page's scroll position is restored either way (the results sit behind the viewer modal
 * while this runs). No growth — end of results, or a timeout — reads as "nothing more right now".
 */
export async function loadMoreListingTargets(): Promise<SkinCraftItem[]> {
    const cards = document.querySelectorAll<HTMLElement>(MARKET_LISTING_CARD_SELECTOR);
    const lastCard = cards[cards.length - 1];
    if (!lastCard) return getLoadedListingTargets();

    const {scrollX, scrollY} = window;
    lastCard.scrollIntoView({block: 'end'});
    try {
        await waitForCardGrowth(cards.length);
    } finally {
        window.scrollTo(scrollX, scrollY);
    }

    return getLoadedListingTargets();
}

async function waitForCardGrowth(previousCount: number): Promise<void> {
    const deadline = Date.now() + LOAD_MORE_TIMEOUT_MS;
    while (Date.now() < deadline) {
        await new Promise((resolve) => window.setTimeout(resolve, LOAD_MORE_POLL_MS));
        if (document.querySelectorAll(MARKET_LISTING_CARD_SELECTOR).length > previousCount) return;
    }
    console.debug('CSFloat: the market grid did not grow before the timeout; treating as end of results.');
}

/** Steam's purchase button in a card's price row: by English label, else the row's only button. */
function findBuyButton(scope: HTMLElement): HTMLButtonElement | undefined {
    const row = scope.querySelector<HTMLElement>(MARKET_PRICE_ROW_SELECTOR);
    const buttons = [...(row ?? scope).querySelectorAll('button')];
    return (
        buttons.find((button) => button.textContent?.trim() === 'Buy') ??
        (row && buttons.length === 1 ? buttons[0] : undefined)
    );
}

/** Hands off to Steam's own purchase flow by clicking the listing card's native Buy button. */
export function buyListing(listingId: string): boolean {
    for (const scope of document.querySelectorAll<HTMLElement>(MARKET_LISTING_CARD_SELECTOR)) {
        if (getFiberListing(scope)?.listingid !== listingId) continue;

        const buyButton = findBuyButton(scope);
        buyButton?.click();
        return !!buyButton;
    }
    return false;
}
