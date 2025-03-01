import {GenericJob, SimpleCachedQueue} from '../utils/queue';
import {FetchStall, FetchStallRequest, FetchStallResponse} from '../bridge/handlers/fetch_stall';
import {ClientSend} from '../bridge/client';

class StallFetcher extends SimpleCachedQueue<FetchStallRequest, FetchStallResponse> {
    fetch(req: FetchStallRequest, force_refresh: boolean = false): Promise<FetchStallResponse> {
        // If force_refresh is true, clear the cache for this request before adding a new job
        if (force_refresh) {
            this.clearAllCache();
        }

        return this.add(new GenericJob(req));
    }

    protected async process(req: FetchStallRequest): Promise<FetchStallResponse> {
        try {
            return await ClientSend(FetchStall, req);
        } catch (e) {
            // Stub out to prevent future calls
            return {data: []};
        }
    }

    // Add a method to clear the entire cache
    clearAllCache(): void {
        try {
            // Use the clear method from the ICache interface
            this.cache().clear();
        } catch (e) {
            console.error('Failed to clear all cache:', e);
        }
    }
}

export const gStallFetcher = new StallFetcher(1);
