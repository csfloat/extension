import type {Action, rgAssetProperty, rgDescription, rgInternalDescription} from '../../../types/steam';

/**
 * Shapes of the props Steam's React version of the Steam Market renders into its listing components. We read these
 * off the React Fiber node's `memoizedProps` (see {@link getFiberProps}), but the types describe the
 * market listing domain data, not React internals.
 */

export interface EnhancedAppearance {
    mime_type: string;
    url: string;
}

export interface MarketDescriptionLine extends rgInternalDescription {
    color?: string;
    name: string;
}

export interface MarketListingDescription
    extends Omit<rgDescription, 'commodity' | 'tradable' | 'marketable' | 'tags'> {
    commodity: boolean;
    currency: boolean;
    descriptions: MarketDescriptionLine[];
    fraudwarnings: string[];
    tradable: boolean;
    market_marketable_restriction: number;
    market_bucket_group_name: string;
    market_bucket_group_id: string;
    market_name_inside_group: string;
    marketable: boolean;
    owner_actions: Action[];
    owner_descriptions: rgInternalDescription[];
    sealed: boolean;
    sealed_type: number;
    tags: unknown[];
}

export interface MarketListingAsset {
    asset_properties: rgAssetProperty[];
    amount: number;
    appid: number;
    accessory_properties: rgAssetProperty[];
    assetid: string;
    classid: string;
    contextid: string;
    id: string;
    instanceid: string;
}

export interface MarketListing {
    asset: MarketListingAsset;
    description: MarketListingDescription;
    eCurrency: number;
    enhanced_appearances: EnhancedAppearance[];
    listingid: string;
    publisherFeeApp: number;
    publisherFeePct: number;
    strSubtotal: string;
    unFee: number;
    unFeePerUnit: number;
    unPrice: number;
    unPricePerUnit: number;
    unPublisherFee: number;
    unPublisherFeePerUnit: number;
    unSteamFee: number;
    unSteamFeePerUnit: number;
}

export interface MarketListingProps {
    expectEnhancedAppearance: boolean;
    listing: MarketListing;
}
