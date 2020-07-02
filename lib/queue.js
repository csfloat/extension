
class Queue {
    constructor() {
        this.queue = [];
        this.failedRequests = [];
        this.running = false;
    }

    addJob(link, listingId, force) {
        if (listingId in floatData) {
            showFloat(listingId);
            return;
        }

        const job = {
            link,
            listingId
        };

        // Stop if this item is already in the queue
        if (this.queue.find(j => j.listingId === listingId)) {
            return;
        }

        if (!force) {
            // Prevent us from auto-fetching a previously failed request unless it's a user action
            if (this.failedRequests.find(v => v === listingId)) {
                return;
            }
        }

        const promise = new Promise((resolve, reject) => {
            job.resolve = resolve;
            job.reject = reject;
        });

        this.queue.push(job);

        return promise;
    }

    async _checkQueue() {
        if (!this.running) return;

        if (this.queue.length === 0) {
            return setTimeout(() => {
                this._checkQueue();
            }, 200);
        }

        // Process 20 at a time
        const items = this.queue.splice(0, 20);

        const links = [];
        for (const item of items) {
            if (floatData[item.listingId]) {
                showFloat(item.listingId);
                continue;
            }

            const data = {link: item.link};
            if (isMarketListing(item.listingId)) {
                const listingData = (await retrieveListingInfoFromPage(item.listingId))[item.listingId];
                if (listingData.currencyid === 2001) {
                    data.list_price = listingData.price + listingData.fee;
                } else if (listingData.converted_currencyid === 2001) {
                    data.list_price = listingData.converted_price + listingData.converted_fee;
                }
            }

            const floatDiv = document.querySelector(`#item_${item.listingId}_floatdiv`);

            if (floatDiv) {
                const buttonText = floatDiv.querySelector('#getFloatBtn span');
                if (buttonText) {
                    buttonText.fetching = true;
                    buttonText.innerText = 'Fetching';
                }
            }

            links.push(data);
        }

        if (links.length === 0) {
            return this._checkQueue();
        }

        const data = await sendMessage({
            requestFloats: true,
            links
        });

        for (const item of items) {
            const assetId = /^steam:\/\/rungame\/730\/\d+\/[+ ]csgo_econ_action_preview [SM]\d+A(\d+)D\d+$/.exec(decodeURI(item.link))[1];
            const response = data[assetId];
            if (!response || response.error) {
                this.failedRequests.push(item.listingId);
                showError(item.listingId, data.error || (response || {}).error);
            } else if (response) {
                floatData[item.listingId] = response;
                showFloat(item.listingId);
            }
        }

        this._checkQueue();
    }

    start() {
        if (!this.running) {
            this.running = true;
            setTimeout(() => {
                this._checkQueue();
            }, 200);
        }
    }
}
