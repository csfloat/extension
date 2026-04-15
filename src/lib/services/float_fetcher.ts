import {ClientSend} from '../bridge/client';
import {FetchInspectInfoBatch, FetchInspectInfoRequest, ItemInfo} from '../bridge/handlers/fetch_inspect_info';
import {Cache} from '../utils/cache';
import {DeferredPromise} from '../utils/deferred_promise';

/**
 * All fetch() calls within a single microtask are collected and sent to the service worker as one bridge message.
 *
 * Cached requests and in-flight requests are de-duped.
 *
 * Why? Because sending hundreds of messages has transport overhead of hundreds of milliseconds and causes sub-optimal
 * rank check batching.
 */
class FloatFetcher {
    private cache = new Cache<ItemInfo>();
    private pending = new Map<string, {req: FetchInspectInfoRequest; deferred: DeferredPromise<ItemInfo>}>();
    private inFlight = new Map<string, DeferredPromise<ItemInfo>>();
    private flushScheduled = false;

    fetch(req: FetchInspectInfoRequest): Promise<ItemInfo> {
        const key = req.asset_id;

        if (this.cache.has(key)) {
            return Promise.resolve(this.cache.getOrThrow(key));
        }

        const inflight = this.inFlight.get(key);
        if (inflight) {
            return inflight.promise();
        }

        const existing = this.pending.get(key);
        if (existing) {
            return existing.deferred.promise();
        }

        const deferred = new DeferredPromise<ItemInfo>();
        this.pending.set(key, {req, deferred});

        if (!this.flushScheduled) {
            this.flushScheduled = true;
            queueMicrotask(() => this.flush());
        }

        return deferred.promise();
    }

    private async flush() {
        this.flushScheduled = false;

        const batch = new Map(this.pending);
        this.pending.clear();

        if (batch.size === 0) return;

        for (const [assetId, {deferred}] of batch) {
            this.inFlight.set(assetId, deferred);
        }

        try {
            const requests = Array.from(batch.values()).map((e) => e.req);
            const resp = await ClientSend(FetchInspectInfoBatch, {requests});

            for (const [assetId, {deferred}] of batch) {
                const result = resp.results[assetId];
                if (result?.error) {
                    deferred.reject(result.error);
                } else if (result?.iteminfo) {
                    this.cache.set(assetId, result.iteminfo);
                    deferred.resolve(result.iteminfo);
                } else {
                    deferred.reject('No result for ' + assetId);
                }
            }
        } catch (e) {
            for (const [, {deferred}] of batch) {
                deferred.reject((e as any).toString());
            }
        } finally {
            for (const [assetId] of batch) {
                this.inFlight.delete(assetId);
            }
        }
    }
}

export const gFloatFetcher = new FloatFetcher();
