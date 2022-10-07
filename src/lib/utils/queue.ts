import {Cache} from './cache';
import {DeferredPromise} from './deferred_promise';

export abstract class Job<T> {
    constructor(protected data: T) {}

    getData() {
        return this.data;
    }

    /**
     * Hash that uniquely identifies this job.
     *
     * If two jobs have the same hashcode, they are considered identical.
     * */
    hashCode(): string {
        return JSON.stringify(this.data);
    }
}

export class GenericJob<T> extends Job<T> {}

interface QueuedJob<Req, Resp> {
    job: Job<Req>;
    deferredPromise: DeferredPromise<Resp>;
}

/**
 * Queue to handle processing of "Jobs" with a request that
 * return a response. Ensures a max concurrency of processing
 * simultaneous jobs.
 */
export abstract class Queue<Req, Resp> {
    private internalQueue: QueuedJob<Req, Resp>[] = [];
    private jobsProcessing: number = 0;

    constructor(private maxConcurrency: number) {}

    /** Amount of jobs currently in the queue */
    size(): number {
        return this.internalQueue.length;
    }

    has(job: Job<Req>): boolean {
        return !!this.internalQueue.find((e) => e.job.hashCode() === job.hashCode());
    }

    getOrThrow(job: Job<Req>): QueuedJob<Req, Resp> {
        if (!this.has(job)) {
            throw new Error(`Job[${job.hashCode()}] is not queued`);
        }

        // Guaranteed
        return this.internalQueue.find((e) => e.job.hashCode() === job.hashCode())!;
    }

    async checkQueue() {
        if (this.internalQueue.length === 0 || this.jobsProcessing >= this.maxConcurrency) {
            // Don't want to launch more instances
            return;
        }

        this.jobsProcessing += 1;

        const queuedJob = this.internalQueue.shift()!;
        const req: Req = queuedJob.job.getData();

        try {
            const resp = await this.process(req);
            queuedJob.deferredPromise.resolve(resp);
        } catch (e) {
            queuedJob.deferredPromise.reject((e as any).toString());
        }

        this.jobsProcessing -= 1;
        this.checkQueue();
    }

    add(job: Job<Req>): Promise<Resp> {
        if (this.has(job)) {
            return this.getOrThrow(job)?.deferredPromise.promise();
        }

        const promise = new DeferredPromise<Resp>();
        this.internalQueue.push({job, deferredPromise: promise});

        setTimeout(() => this.checkQueue(), 0);

        return promise.promise();
    }

    protected abstract process(req: Req): Promise<Resp>;
}

// Like a queue, but has an internal cache for elements already requested
export abstract class CachedQueue<Req, Resp> extends Queue<Req, Resp> {
    private cache = new Cache<Resp>();

    /** Amount of previously requested jobs stored in the cache */
    cacheSize(): number {
        return this.cache.size();
    }

    add(job: Job<Req>): Promise<Resp> {
        if (this.cache.has(job.hashCode())) {
            return Promise.resolve(this.cache.getOrThrow(job.hashCode()));
        }

        return super.add(job).then((resp) => {
            this.cache.set(job.hashCode(), resp);
            return resp;
        });
    }

    protected abstract process(req: Req): Promise<Resp>;
}
