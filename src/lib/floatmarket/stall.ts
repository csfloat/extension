import {ClientSend} from "../bridge/client";
import {FetchStall} from "../bridge/handlers/fetch_stall";

class StallFetcher {
    private stalls: {[steamId: string]: {listings: any[]}} = {};

    constructor() {}

    async getStallItem(steamId64: string, itemId: string) {
        if (this.stalls[steamId64]) {
            return this.stalls[steamId64].listings.find(e => e.item.asset_id === itemId);
        }

        let stall;

        try {
            stall = await ClientSend(FetchStall, {steam_id64: steamId64});
            if (!stall.listings) {
                // Stub out to prevent further calls
                stall = {listings: []};
            }
        } catch (e) {
            return;
        }

        this.stalls[steamId64] = stall;
        return stall.listings.find((e: any) => e.item.asset_id === itemId);
    }
}

export const stallFetcher = new StallFetcher();
