class StallFetcher {
    constructor() {
        // Maps string -> stall items
        this.stalls = {};
    }

    async getStallItem(steamId, itemId) {
        if (this.stalls[steamId]) {
            return this.stalls[steamId].listings.find(e => e.offering.asset_id === itemId);
        }

        let stall;

        try {
            stall = await sendMessage({ stall: true, steamId});
            if (!stall.listings) {
                // Stub out to prevent further calls
                stall = {listings: []};
            }
        } catch (e) {
            return;
        }

        this.stalls[steamId] = stall;
        return stall.listings.find(e => e.offering.asset_id === itemId);
    }
}

const stallFetcher = new StallFetcher();
