import {render} from 'lit';
import {Subscription} from 'rxjs';

import {ItemInfo} from '../../../bridge/handlers/fetch_inspect_info';
import {gFilterService} from '../../../services/filter';
import {gFloatFetcher} from '../../../services/float_fetcher';
import {renderClickableRank} from '../../../utils/skin';

import {BetaListing, gBetaListingStore} from './data_store';

const ENHANCED_ATTR = 'data-csfloat-enhanced';
const RANK_ATTR = 'data-csfloat-rank';
const HIGHLIGHT_VAR = '--csfloat-highlight';

/**
 * Per-card enhancer for the Steam Market beta listing UI.
 *
 * Drives the work to fetch the {@link ItemInfo} for a card, inject a clickable rank link beside
 * Steam's own "Wear Rating" value, and apply filter highlighting using {@link gFilterService}.
 */
export class BetaListingEnhancer {
    private filterSub: Subscription | undefined;
    private storeSub: Subscription | undefined;
    private removalObserver: MutationObserver | undefined;

    static enhance(card: HTMLElement, listingId: string): void {
        if (card.getAttribute(ENHANCED_ATTR) === listingId) {
            return;
        }
        card.setAttribute(ENHANCED_ATTR, listingId);
        new BetaListingEnhancer(card, listingId).start();
    }

    private constructor(private readonly card: HTMLElement, private readonly listingId: string) {}

    private start(): void {
        this.observeRemoval();

        const listing = gBetaListingStore.get(this.listingId);
        if (listing) {
            void this.processListing(listing);
            return;
        }

        // We don't yet have metadata for this listing (e.g. arrived from a paginated fetch we
        // haven't ingested). Subscribe to the store and retry once it shows up.
        this.storeSub = gBetaListingStore.onUpdate$.subscribe((ids) => {
            if (!ids.includes(this.listingId)) return;
            const updated = gBetaListingStore.get(this.listingId);
            if (!updated) return;
            this.storeSub?.unsubscribe();
            this.storeSub = undefined;
            void this.processListing(updated);
        });
    }

    private async processListing(listing: BetaListing): Promise<void> {
        const inspectLink = gBetaListingStore.getInspectLink(this.listingId);
        const assetId = gBetaListingStore.getAssetId(this.listingId);
        if (!inspectLink || !assetId) return;

        let info: ItemInfo;
        try {
            info = await gFloatFetcher.fetch({link: inspectLink, asset_id: assetId});
        } catch (e) {
            return;
        }

        if (!document.body.contains(this.card)) return;

        this.injectRank(listing, info);
        this.subscribeToFilters(listing, info);
    }

    private injectRank(listing: BetaListing, info: ItemInfo): void {
        if (this.card.querySelector(`[${RANK_ATTR}]`)) return;

        const wearProp = listing.asset.asset_properties?.find((p) => p.propertyid === 2);
        const rawFloat = wearProp?.float_value;
        if (rawFloat === undefined || rawFloat === null) return;
        const targetFloat = parseFloat(String(rawFloat));
        if (Number.isNaN(targetFloat)) return;

        const wearSpan = this.findWearSpan(targetFloat);
        if (!wearSpan) return;

        const rankSpan = document.createElement('span');
        rankSpan.setAttribute(RANK_ATTR, '');
        rankSpan.style.marginLeft = '4px';
        render(renderClickableRank(info), rankSpan);

        // Empty template (item didn't qualify for a rank) results in a span with no anchor.
        if (!rankSpan.querySelector('a')) return;

        wearSpan.insertAdjacentElement('afterend', rankSpan);
    }

    /**
     * Locates the span that displays the wear rating value for this card by matching its text
     * to the asset's `propertyid=2` float value. Steam renders the value with high precision so a
     * small tolerance is enough to be unambiguous within a single card.
     */
    private findWearSpan(targetFloat: number): HTMLElement | undefined {
        const spans = this.card.querySelectorAll<HTMLElement>('span');
        for (const span of spans) {
            const text = span.textContent?.trim();
            if (!text) continue;
            const value = parseFloat(text);
            if (Number.isNaN(value)) continue;
            if (Math.abs(value - targetFloat) < 1e-6) {
                return span;
            }
        }
        return undefined;
    }

    private subscribeToFilters(listing: BetaListing, info: ItemInfo): void {
        const price = convertedPrice(listing);
        this.filterSub = gFilterService.onUpdate$.subscribe(() => {
            const colour = gFilterService.matchColour(info, price);
            this.applyHighlight(colour);
        });
    }

    /**
     * Applies a filter match colour to the card. We use an inset box shadow so the highlight is
     * highly visible without overwriting the card's own background, which keeps the new Steam UI
     * looking close to default.
     */
    private applyHighlight(colour: string | null): void {
        const card = this.card;
        if (colour) {
            card.style.setProperty(HIGHLIGHT_VAR, colour);
            card.style.setProperty('box-shadow', `inset 0 0 0 2px ${colour}`);
        } else {
            card.style.removeProperty(HIGHLIGHT_VAR);
            card.style.removeProperty('box-shadow');
        }
    }

    private observeRemoval(): void {
        if (!this.card.parentElement) return;
        this.removalObserver = new MutationObserver(() => {
            if (!document.body.contains(this.card)) {
                this.dispose();
            }
        });
        this.removalObserver.observe(this.card.parentElement, {childList: true});
    }

    private dispose(): void {
        this.filterSub?.unsubscribe();
        this.filterSub = undefined;
        this.storeSub?.unsubscribe();
        this.storeSub = undefined;
        this.removalObserver?.disconnect();
        this.removalObserver = undefined;
    }
}

/**
 * Returns the listing's price in the user's wallet currency, in major units (e.g. dollars), or
 * undefined if Steam didn't include a converted price for this listing.
 */
function convertedPrice(listing: BetaListing): number | undefined {
    if (listing.converted_price === undefined || listing.converted_fee === undefined) {
        return undefined;
    }
    return (listing.converted_price + listing.converted_fee) / 100;
}
