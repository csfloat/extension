import {ItemInfo} from '../../../bridge/handlers/fetch_inspect_info';
import {gFloatFetcher} from '../../../services/float_fetcher';
import {getFiberProps} from '../../../utils/fiber';
import {defineInjectionScope, InjectionMode} from '../../injectors';
import {isReactSteamMarket} from '../mode';
import type {MarketListing, MarketListingProps} from './types';

export interface ReactListingContext {
    listing: MarketListing;
    inspectLink: string;
    assetId: string;
    targetFloat: number | null;
    itemInfo: ItemInfo;
}

export const ReactMarketListingScope = defineInjectionScope<ReactListingContext>({
    selector: 'div[style*="--grid-rows"]:has([style*="market_listings/"], [style*="economy/image/"])',
    mode: InjectionMode.CONTINUOUS,
    guard: isReactSteamMarket,
    context: buildReactListingContext,
});

function getInspectLink(listing: MarketListing): string | null {
    const link = listing.description.actions?.[0]?.link;
    if (!link) return null;

    if (link.includes('%propid:6%')) {
        const propId = listing.asset.asset_properties?.find((p) => p.propertyid === 6)?.string_value;
        if (!propId) return null;
        return link.replace('%propid:6%', propId);
    }

    return link;
}

function getTargetFloat(listing: MarketListing): number | null {
    const wearProp = listing.asset.asset_properties?.find((p) => p.propertyid === 2);
    // This is a number in the React properties, but a string in the rgAsset properties.
    const rawFloat = wearProp?.float_value;
    if (rawFloat === undefined || rawFloat === null) return null;

    const targetFloat = Number(rawFloat);
    return Number.isNaN(targetFloat) ? null : targetFloat;
}

async function buildReactListingContext(scope: HTMLElement): Promise<ReactListingContext | null | undefined> {
    const listing = getFiberProps<MarketListingProps>(scope, (fiber) => typeof fiber.key === 'string')?.listing;
    if (!listing) return undefined;

    const inspectLink = getInspectLink(listing);
    const assetId = listing.asset.assetid;
    if (!inspectLink || !assetId) return null;

    try {
        const itemInfo = await gFloatFetcher.fetch({link: inspectLink, asset_id: assetId});
        return {
            listing,
            inspectLink,
            assetId,
            targetFloat: getTargetFloat(listing),
            itemInfo,
        };
    } catch (e) {
        return null;
    }
}
