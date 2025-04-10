import {Cache, ICache, TTLCache} from './cache';
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

/**
 * Like a queue, but has an internal cache for elements already requested
 */
export abstract class CachedQueue<Req, Resp> extends Queue<Req, Resp> {
    /** Underlying implementation of a cache */
    protected abstract cache(): ICache<Resp>;

    /** Amount of previously requested jobs stored in the cache */
    cacheSize(): number {
        return this.cache().size();
    }

    getCached(job: Job<Req>): Resp | null {
        if (this.cache().has(job.hashCode())) {
            return this.cache().getOrThrow(job.hashCode());
        } else {
            return null;
        }
    }

    setCached(job: Job<Req>, resp: Resp): void {
        this.cache().set(job.hashCode(), resp);
    }

    add(job: Job<Req>): Promise<Resp> {
        if (this.getCached(job)) {
            return Promise.resolve(this.getCached(job)!);
        }

        return super.add(job).then((resp) => {
            this.setCached(job, resp);
            return resp;
        });
    }

    protected abstract process(req: Req): Promise<Resp>;
}

export abstract class SimpleCachedQueue<Req, Resp> extends CachedQueue<Req, Resp> {
    private readonly cache_ = new Cache<Resp>();

    protected cache(): ICache<Resp> {
        return this.cache_;
    }
}

export abstract class TTLCachedQueue<Req, Resp> extends CachedQueue<Req, Resp> {
    private readonly cache_: TTLCache<Resp>;

    protected constructor(
        maxConcurrency: number,
        private ttlMs: number
    ) {
        super(maxConcurrency);
        this.cache_ = new TTLCache<Resp>(ttlMs);
    }

    protected cache(): ICache<Resp> {
        return this.cache_;
    }
}
