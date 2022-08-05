import {Cache} from "./cache";

abstract class Job<T> {
    protected constructor(protected data: T) {}

    getData() {
        return this.data;
    }

    hashCode(): string {
        return JSON.stringify(this.data);
    }
}

interface InspectRequest {
    link: string;
}

class InspectJob extends Job<InspectRequest> {
    hashCode(): string {
        return this.data.link;
    }
}

interface QueuedJob<Req, Resp> {
    job: Job<Req>;
    promise: Promise<Resp>
}


export abstract class QueueQ<Req, Resp> {
    private internalQueue: QueuedJob<Req, Resp>[] = [];
    private jobsProcessing: number = 0;

    constructor(private maxConcurrency: number) {}

    has(job: Job<Req>): boolean {
        return !!this.internalQueue.find(e => e.job.hashCode() === job.hashCode());
    }

    getOrThrow(job: Job<Req>): QueuedJob<Req, Resp> {
        if (!this.has(job)) {
            throw new Error(`Job[${job.hashCode()}] is not queued`);
        }

        // Guaranteed
        return this.internalQueue.find(e => e.job.hashCode() === job.hashCode())!;
    }

    async checkQueue() {
        if (this.internalQueue.length === 0 || this.jobsProcessing >= this.maxConcurrency) {
            // Don't want to launch more instances
            return;
        }

        this.jobsProcessing += 1;

        const queuedJob = this.internalQueue.shift()!;
        const req: Req = queuedJob.job.getData();

        
    }

    add(job: Job<Req>): Promise<Resp> {
        if (this.has(job)) {
            return this.getOrThrow(job)?.promise;
        }


    }

    abstract process(req: Req): Promise<Resp>;
}

// Like a queue, but has an internal cache for elements already requested
export abstract class CachedQueue<Req, Resp> extends QueueQ<Req, Resp>{
    private cache = new Cache<Resp>()

    add(job: Job<Req>): Promise<Resp> {
        if (this.cache.has(job.hashCode())) {
            return Promise.resolve(this.cache.getOrThrow(job.hashCode()));
        }

        return super.add(job).then((resp) => {
            this.cache.set(job.hashCode(), resp);
            return resp;
        });
    }

    abstract process(req: Req): Promise<Resp>;
}

export class Queue {
    private queue: Job[] = []:
    private failedRequests: string[] = [];
    private concurrency = 10;
    private processing = 0;
    private floatMapping: {[listingId: string]: any} = {};

    addJob(link, listingId, force) {
        if (listingId in this.floatMapping) {
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
        this.checkQueue();

        return promise;
    }

    async checkQueue() {
        if (this.queue.length === 0 || this.processing >= this.concurrency) {
            return;
        }

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

        const params = { inspectLink: job.link };

        if (isMarketListing(job.listingId)) {
            const listingData = (await retrieveListingInfoFromPage(job.listingId))[job.listingId];
            if (listingData.currencyid === 2001) {
                params.listPrice = listingData.price + listingData.fee;
            } else if (listingData.converted_currencyid === 2001) {
                params.listPrice = listingData.converted_price + listingData.converted_fee;
            }
        }

        const data = await sendMessage(params);

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

            this.failedRequests.push(job.listingId);
        }

        this.processing -= 1;
        this.checkQueue();
    }
}
