import {css, nothing} from 'lit';

import {ItemInfo} from '../../../bridge/handlers/fetch_inspect_info';
import {FloatElement} from '../../custom';
import {CustomElement, InjectAppend, InjectionMode} from '../../injectors';
import {isReactSteamMarket} from '../mode';
import {gFloatFetcher} from '../../../services/float_fetcher';
import {BetaListingRank} from './rank';

import {getFiberProps} from '../../../utils/fiber';
import type {MarketListing, MarketListingProps} from './types';

/**
 * Simple version of {@link ItemRowWrapper} with reduced functionality, adapted for the Steam Market beta.
 */
@CustomElement()
@InjectAppend(
    'div[style*="--grid-rows"]:has([style*="market_listings/"])',
    InjectionMode.CONTINUOUS,
    isReactSteamMarket
)
export class BetaListingEnhancer extends FloatElement {
    private rankInjected = false;

    static styles = [
        css`
            :host {
                display: none;
            }
        `,
    ];

    private get card(): HTMLElement {
        const parent = this.parentElement;
        if (!parent) throw new Error('Card element not found');
        return parent;
    }

    /** Steam implementation detail: the "key" property on the Fiber node is the listing ID. */
    get fiberProps(): MarketListingProps | null {
        return getFiberProps<MarketListingProps>(this.card, (fiber) => typeof fiber.key === 'string') ?? null;
    }

    get listing(): MarketListing | null {
        return this.fiberProps?.listing ?? null;
    }

    get listingId(): string | null {
        return this.fiberProps?.listing?.listingid ?? null;
    }

    get inspectLink(): string | null {
        const listing = this.listing;
        if (!listing) return null;

        const link = listing.description.actions?.[0]?.link;
        if (!link) return null;

        if (link.includes('%propid:6%')) {
            const propId = listing.asset.asset_properties?.find((p) => p.propertyid === 6)?.string_value;
            if (!propId || !link) return null;
            return link.replace('%propid:6%', propId);
        }
        return link;
    }

    get assetId(): string | null {
        const listing = this.listing;
        if (!listing) return null;
        return listing.asset.assetid;
    }

    get targetFloat(): number | null {
        const wearProp = this.listing?.asset.asset_properties?.find((p) => p.propertyid === 2);
        // this is a number in the React properties, but a string in the rgAsset properties
        const rawFloat = wearProp?.float_value;
        if (rawFloat === undefined || rawFloat === null) return null;
        return Number(rawFloat);
    }

    connectedCallback(): void {
        super.connectedCallback();

        if (this.inspectLink && this.assetId) {
            void this.processListing(this.inspectLink, this.assetId);
        }
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
    }

    protected render(): typeof nothing {
        return nothing;
    }

    private async processListing(inspectLink: string, assetId: string): Promise<void> {
        if (!inspectLink || !assetId || !this.isConnected || !this.card) return;

        let info: ItemInfo;
        try {
            info = await gFloatFetcher.fetch({link: inspectLink, asset_id: assetId});
        } catch (e) {
            return;
        }

        this.injectRank(info);
    }

    private injectRank(info: ItemInfo): void {
        if (this.rankInjected) return;
        this.rankInjected = true;

        const rank = BetaListingRank.elem() as BetaListingRank;
        rank.itemInfo = info;
        rank.card = this.card;
        rank.targetFloat = this.targetFloat;
        // Append into the card; the element repositions itself correctly.
        this.card.appendChild(rank);
    }
}
