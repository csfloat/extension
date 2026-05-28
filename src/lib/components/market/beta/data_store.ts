import {ReplaySubject} from 'rxjs';

import {rgAssetProperty} from '../../../types/steam';

export type BetaListingAssetProperty = rgAssetProperty;

export interface BetaListing {
    listingid: string;
    unPrice?: number;
    unFee?: number;
    eCurrency?: number;
    converted_price?: number;
    converted_fee?: number;
    converted_currency?: number;
    description: {
        appid: number;
        market_hash_name?: string;
        market_actions?: {link: string; name: string}[];
        actions?: {link: string; name: string}[];
        tags?: {category: string; internal_name: string; name?: string}[];
        type?: string;
    };
    asset: {
        id?: string;
        assetid?: string;
        asset_properties?: BetaListingAssetProperty[];
        appid?: number;
        contextid?: string;
        instanceid?: string;
        classid?: string;
        amount?: number;
    };
}

/**
 * Stores Steam Market beta listing metadata indexed by listing ID.
 *
 * Steam beta exposes the initial listing metadata via React Query's dehydrated cache at
 * {@link window.SSR.renderContext.queryData}. The actual rows live under a query keyed by
 * `["market_item_search", ...]` -> `state.data.pages[].listings[]`.
 *
 * On its own this gives us only the initial set; we additionally tee {@link window.fetch} so any
 * later requests that surface listings (filtering, pagination) get folded into the same store.
 */
class BetaListingStore {
    private listings = new Map<string, BetaListing>();
    private updates = new ReplaySubject<string[]>(1);

    onUpdate$ = this.updates.asObservable();

    private initialized = false;

    init(): void {
        if (this.initialized) return;
        this.initialized = true;

        try {
            this.ingestSSRRenderContext();
        } catch (e) {
            console.warn('CSFloat: failed to read initial Steam Market beta listing data', e);
        }

        this.installFetchInterceptor();
    }

    get(listingId: string): BetaListing | undefined {
        return this.listings.get(listingId);
    }

    has(listingId: string): boolean {
        return this.listings.has(listingId);
    }

    /**
     * Returns the constructed inspect link for a listing, replacing any `%propid:6%` placeholder
     * with the actual inspect token from the asset properties.
     */
    getInspectLink(listingId: string): string | undefined {
        const listing = this.listings.get(listingId);
        if (!listing) return;

        const link = listing.description.market_actions?.[0]?.link;
        if (!link) return;

        if (link.includes('%propid:6%')) {
            const token = listing.asset.asset_properties?.find((p) => p.propertyid === 6)?.string_value;
            if (!token) return;
            return link.replace('%propid:6%', token);
        }

        return link;
    }

    /**
     * Returns the asset ID for the listing. Steam beta exposes this as either `id` or `assetid`.
     */
    getAssetId(listingId: string): string | undefined {
        const listing = this.listings.get(listingId);
        return listing?.asset.id ?? listing?.asset.assetid;
    }

    private ingestSSRRenderContext(): void {
        const ssr = (window as any).SSR;
        const raw = ssr?.renderContext?.queryData;
        if (typeof raw !== 'string') return;

        const parsed = JSON.parse(raw);
        const queries: any[] = parsed?.queries ?? [];
        for (const query of queries) {
            this.ingestUnknown(query?.state?.data);
        }
    }

    private installFetchInterceptor(): void {
        const original = window.fetch;
        if (!original || (original as any).__csfloatPatched) return;

        const patched: typeof window.fetch = async (...args) => {
            const response = await original(...args);

            try {
                const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request)?.url ?? '';
                if (url.includes('/market/')) {
                    // Tee the response so we can read it without disturbing the caller.
                    response
                        .clone()
                        .text()
                        .then((text) => this.ingestStreamedText(text))
                        .catch(() => {
                            /* not all bodies are readable; ignore */
                        });
                }
            } catch {
                /* ignore */
            }

            return response;
        };

        (patched as any).__csfloatPatched = true;
        window.fetch = patched;
    }

    /**
     * Steam SSR streams responses as one JSON value per line. We try each line independently and
     * recursively look for arrays of listing rows to ingest.
     */
    private ingestStreamedText(text: string): void {
        if (!text) return;

        // Single JSON body fast-path.
        const trimmed = text.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            try {
                this.ingestUnknown(JSON.parse(trimmed));
                return;
            } catch {
                /* fall through to line-based parsing */
            }
        }

        for (const line of text.split('\n')) {
            const candidate = line.trim();
            if (!candidate) continue;
            try {
                this.ingestUnknown(JSON.parse(candidate));
            } catch {
                /* not every line is JSON; ignore */
            }
        }
    }

    /**
     * Walks an arbitrary JSON value looking for arrays of listing-shaped objects.
     */
    private ingestUnknown(value: unknown, depth = 0): void {
        if (!value || depth > 8) return;

        if (Array.isArray(value)) {
            for (const item of value) {
                this.ingestUnknown(item, depth + 1);
            }
            return;
        }

        if (typeof value !== 'object') return;
        const obj = value as Record<string, unknown>;

        if (this.isListing(obj)) {
            this.upsert(obj as unknown as BetaListing);
            return;
        }

        // Walk known container shapes first to keep traversal cheap.
        const containers = ['pages', 'listings', 'data', 'state'];
        for (const key of containers) {
            if (key in obj) this.ingestUnknown(obj[key], depth + 1);
        }

        // Fallback general walk, capped by depth.
        for (const key in obj) {
            if (containers.includes(key)) continue;
            const child = obj[key];
            if (child && typeof child === 'object') {
                this.ingestUnknown(child, depth + 1);
            }
        }
    }

    private isListing(obj: Record<string, unknown>): boolean {
        return (
            typeof obj.listingid === 'string' &&
            typeof obj.description === 'object' &&
            obj.description !== null &&
            typeof obj.asset === 'object' &&
            obj.asset !== null
        );
    }

    private upsert(listing: BetaListing): void {
        if (!listing.listingid) return;
        this.listings.set(listing.listingid, listing);
        this.updates.next([listing.listingid]);
    }
}

export const gBetaListingStore = new BetaListingStore();
