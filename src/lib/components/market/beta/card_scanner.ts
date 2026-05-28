import {AppId} from '../../../types/steam_constants';

export const CSFLOAT_LISTING_ID_ATTR = 'data-csfloat-listing-id';

export type CardCallback = (card: HTMLElement, listingId: string) => void;

const LISTING_IMAGE_REGEX = new RegExp(`market_listings/[^/]+/${AppId.CSGO}/(\\d+)/`);

/**
 * Watches the Steam Market beta listing grid and tags listing cards with their listing ID.
 *
 * The new market UI uses generated class names (e.g. `JAg6-ldsh48-`) that we do not want to depend
 * on. Instead, every listing card embeds a background image whose URL contains the listing ID
 * (`market_listings/.../730/<listingid>/...`). We use that as our anchor: locate any element
 * whose inline style references this URL, walk up to the closest grid card root, and tag it.
 *
 * Each newly-discovered card invokes {@link onCard} so the caller can hydrate it. Callers should
 * be idempotent because re-scans are possible after Steam re-renders the grid (filtering,
 * pagination).
 */
export class BetaCardScanner {
    private observer: MutationObserver | undefined;
    private interval: number | undefined;

    private constructor(private readonly onCard: CardCallback) {}

    static start(onCard: CardCallback): BetaCardScanner {
        const scanner = new BetaCardScanner(onCard);
        scanner.scan();

        scanner.observer = new MutationObserver(() => scanner.scan());
        scanner.observer.observe(document.body, {childList: true, subtree: true});

        // The observer covers DOM mutations, but the React Router sometimes hydrates async without
        // mutating between scans we can hook into. A low-frequency interval acts as a safety net.
        scanner.interval = window.setInterval(() => scanner.scan(), 1000);

        return scanner;
    }

    stop(): void {
        this.observer?.disconnect();
        this.observer = undefined;
        if (this.interval) {
            window.clearInterval(this.interval);
            this.interval = undefined;
        }
    }

    private scan(): void {
        const candidates = document.querySelectorAll<HTMLElement>('[style*="market_listings/"]');
        for (const candidate of candidates) {
            const listingId = extractListingIdFromStyle(candidate.getAttribute('style'));
            if (!listingId) continue;

            const card = findCardRoot(candidate);
            if (!card) continue;

            if (card.getAttribute(CSFLOAT_LISTING_ID_ATTR) === listingId) {
                continue;
            }

            card.setAttribute(CSFLOAT_LISTING_ID_ATTR, listingId);
            try {
                this.onCard(card, listingId);
            } catch (e) {
                console.error('CSFloat: failed to enhance Steam Market beta card', e);
            }
        }
    }
}

function extractListingIdFromStyle(style: string | null): string | undefined {
    if (!style) return;
    const match = style.match(LISTING_IMAGE_REGEX);
    return match?.[1];
}

/**
 * Walks up to the closest ancestor that looks like a market listing card. Steam beta cards
 * declare `--grid-row:span 3` on their root; we use that style hint to find the boundary
 * without depending on minified class names.
 */
function findCardRoot(element: HTMLElement): HTMLElement | undefined {
    let cursor: HTMLElement | null = element;
    while (cursor && cursor !== document.body) {
        const style = cursor.getAttribute('style') ?? '';
        if (style.includes('grid-row:span') || style.includes('grid-row: span')) {
            return cursor;
        }
        cursor = cursor.parentElement;
    }
    return undefined;
}
