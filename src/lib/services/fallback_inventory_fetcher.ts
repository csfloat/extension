import {GenericJob, SimpleCachedQueue} from '../utils/queue';

interface FetchFallbackInventoryRequest {
    steamid_64: string;
}

interface FallbackAsset {
    id: number;
    contextid: number;
    assetid: number;
    classid: number;
    instanceid: number;
    amount: number;
    pos: number;
}

interface FetchFallbackInventoryResponse {
    success: boolean;
    rgInventory: {[assetId: string]: FallbackAsset};
    rgDescriptions: {
        [classid_instanceid: string]: {
            tradable: boolean;
            cache_expiration: string;
        };
    };
}

/**
 * Fetches using a deprecated Steam inventory endpoint that has some fields
 * the newer ones don't (ie. trade hold expiry)
 */
class FallbackInventoryFetcher extends SimpleCachedQueue<
    FetchFallbackInventoryRequest,
    FetchFallbackInventoryResponse
> {
    constructor() {
        /** allow up to 5 simultaneous req */
        super(5);
    }

    fetch(req: FetchFallbackInventoryRequest): Promise<FetchFallbackInventoryResponse> {
        return this.add(new GenericJob(req));
    }

    protected async process(req: FetchFallbackInventoryRequest): Promise<FetchFallbackInventoryResponse> {
        return fetch(`https://steamcommunity.com/profiles/${req.steamid_64}/inventory/json/730/2?l=english`).then(
            async (resp) => {
                if (resp.ok) {
                    return resp.json();
                } else {
                    throw Error(`failed to fetch inventory: ${resp.text().toString()}`);
                }
            }
        );
    }
}

export const gFallbackInventoryFetcher = new FallbackInventoryFetcher();
