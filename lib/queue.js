
class Queue {
    constructor() {
        this.queue = [];
        this.running = false;
        this.concurrency = 10;
        this.processing = 0;
    }

    addJob(link, listingId) {
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

        const promise = new Promise((resolve, reject) => {
            job.resolve = resolve;
            job.reject = reject;
        });

        this.queue.push(job);
        this.checkQueue();

        return promise;
    }

    async checkQueue() {
        if (!this.running) return;

        if (this.queue.length > 0 && this.processing < this.concurrency) {
            // there is a free bot, process the job
            let job = this.queue.shift();

            this.processing += 1;

            const floatDiv = document.querySelector(`#item_${job.listingId}_floatdiv`);

            // Changed pages or div not visible, cancel request
            if (!floatDiv || floatDiv.offsetParent === null) {
                this.processing -= 1;
                this.checkQueue();
                return;
            }

            const buttonText = floatDiv.querySelector('#getFloatBtn span');
            if (buttonText) {
                buttonText.fetching = true;
                buttonText.innerText = 'Fetching';
            }

            const data = await sendMessage({ inspectLink: job.link });

            if (buttonText) {
                buttonText.fetching = false;
            }

            if (data && data.iteminfo) {
                floatData[job.listingId] = data.iteminfo;
                showFloat(job.listingId);
            } else {
                // Reset the button text for this itemid
                if (buttonText) buttonText.innerText = 'Get Float';

                // Change the message div for this item to the error
                if (floatDiv && floatDiv.querySelector('.floatmessage')) {
                    floatDiv.querySelector('.floatmessage').innerText = data.error || 'Unknown Error';
                }
            }

            this.processing -= 1;
            this.checkQueue();
        }
    }

    start() {
        if (!this.running) {
            this.running = true;
            this.checkQueue();
        }
    }
}
