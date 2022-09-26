import {CachedQueue, GenericJob} from "../utils/queue";
import {
    FetchStall,
    FetchStallRequest,
    FetchStallResponse,
} from "../bridge/handlers/fetch_stall";
import {ClientSend} from "../bridge/client";


class StallFetcher extends CachedQueue<FetchStallRequest, FetchStallResponse> {
    fetch(req: FetchStallRequest): Promise<FetchStallResponse> {
        return this.add(new GenericJob(req));
    }

    protected async process(req: FetchStallRequest): Promise<FetchStallResponse> {
        try {
            return await ClientSend(FetchStall, req);
        } catch (e) {
            // Stub out to prevent future calls
            return {listings: []};
        }
    }
}

export const gStallFetcher = new StallFetcher(1);
