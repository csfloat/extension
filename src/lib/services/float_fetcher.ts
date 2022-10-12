import {Job, SimpleCachedQueue} from '../utils/queue';
import {ClientSend} from '../bridge/client';
import {FetchInspectInfo, FetchInspectInfoRequest, ItemInfo} from '../bridge/handlers/fetch_inspect_info';

class InspectJob extends Job<FetchInspectInfoRequest> {
    hashCode(): string {
        return this.data.link;
    }
}

class FloatFetcher extends SimpleCachedQueue<FetchInspectInfoRequest, ItemInfo> {
    constructor() {
        /** allow up to 10 simultaneous float fetch reqs */
        super(10);
    }

    fetch(req: FetchInspectInfoRequest): Promise<ItemInfo> {
        return this.add(new InspectJob(req));
    }

    protected async process(req: FetchInspectInfoRequest): Promise<ItemInfo> {
        const resp = await ClientSend(FetchInspectInfo, req);
        return resp.iteminfo;
    }
}

export const gFloatFetcher = new FloatFetcher();
