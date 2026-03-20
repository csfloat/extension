import {ClientSend} from '../bridge/client';
import {
    FetchReversalStatus,
    FetchReversalStatusRequest,
    FetchReversalStatusResponse,
} from '../bridge/handlers/fetch_reversal_status';
import {GenericJob, TTLCachedQueue} from '../utils/queue';

class ReversalFetcher extends TTLCachedQueue<FetchReversalStatusRequest, FetchReversalStatusResponse> {
    constructor(maxConcurrency: number, ttlMs: number) {
        super(maxConcurrency, ttlMs);
    }

    fetch(req: FetchReversalStatusRequest): Promise<FetchReversalStatusResponse> {
        return this.add(new GenericJob(req));
    }

    protected async process(req: FetchReversalStatusRequest): Promise<FetchReversalStatusResponse> {
        try {
            return await ClientSend(FetchReversalStatus, req);
        } catch (e) {
            console.error('failed to fetch reversal status', e);
            // Stub out to prevent future calls
            return {
                steam_id: '',
                has_reversed: false,
                last_reversal_timestamp: undefined,
            } as FetchReversalStatusResponse;
        }
    }
}

export const gReversalFetcher = new ReversalFetcher(1, 30 * 60 * 1000 /* 30 minutes */);
