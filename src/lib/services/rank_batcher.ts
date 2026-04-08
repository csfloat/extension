import {environment} from '../../environment';
import {DeferredPromise} from '../utils/deferred_promise';

const RANKS_CHECK_URL = `${environment.floatdb_gateway_url}/v1/ranks/check`;
const DEBOUNCE_MS = 50;

export interface RankResult {
    low_rank?: number;
    high_rank?: number;
}

interface PendingItem {
    link: string;
    deferred: DeferredPromise<RankResult | null>;
}

/**
 * Batches concurrent rank check requests into a single POST to /v1/ranks/check.
 * Callers receive individual promises; a short debounce window (50ms) collects
 * qualifying items so that bulk page loads produce one network request instead of many.
 */
class RankBatcher {
    private pending = new Map<string, PendingItem>();
    private timer: ReturnType<typeof setTimeout> | null = null;

    check(link: string, assetId: string): Promise<RankResult | null> {
        const existing = this.pending.get(assetId);
        if (existing) {
            return existing.deferred.promise();
        }

        const deferred = new DeferredPromise<RankResult | null>();
        this.pending.set(assetId, {link, deferred});

        if (this.timer !== null) {
            clearTimeout(this.timer);
        }
        this.timer = setTimeout(() => this.flush(), DEBOUNCE_MS);

        return deferred.promise();
    }

    private async flush(): Promise<void> {
        this.timer = null;

        const batch = new Map(this.pending);
        this.pending.clear();

        if (batch.size === 0) return;

        const links = Array.from(batch.values()).map((item) => item.link);

        try {
            const resp = await fetch(RANKS_CHECK_URL, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({links}),
            });

            if (!resp.ok) {
                throw new Error(`Ranks check failed with status ${resp.status}`);
            }

            const data: {ranks: Record<string, RankResult>} = await resp.json();

            for (const [assetId, item] of batch) {
                const rank = data.ranks[assetId] ?? null;
                item.deferred.resolve(rank);
            }
        } catch (error) {
            console.error('Failed to batch check ranks:', error);
            for (const [, item] of batch) {
                item.deferred.resolve(null);
            }
        }
    }
}

export const gRankBatcher = new RankBatcher();
