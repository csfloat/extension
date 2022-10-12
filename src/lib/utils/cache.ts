export interface ICache<T> {
    set(key: string, value: T): void;
    get(key: string): T | undefined;
    getOrThrow(key: string): T;
    has(key: string): boolean;
    size(): number;
}

/**
 * Simple Generic Cache with stringified keys
 */
export class Cache<T> implements ICache<T> {
    private cache_: {[key: string]: T} = {};

    set(key: string, value: T) {
        this.cache_[key] = value;
    }

    get(key: string): T | undefined {
        return this.cache_[key];
    }

    getOrThrow(key: string): T {
        if (!this.has(key)) {
            throw new Error(`key ${key} does not exist in map [getOrThrow]`);
        }

        return this.cache_[key];
    }

    has(key: string): boolean {
        return key in this.cache_;
    }

    size(): number {
        return Object.keys(this.cache_).length;
    }
}

interface TTLWrapper<T> {
    data: T;
    expiresEpoch: number;
}

/**
 * Extension of {@link Cache} that allows setting a TTL (time-to-live) on a key
 * such that automatically expires after a specified time.
 *
 * By default, keys will expire with {@link defaultTTLMs}.
 */
export class TTLCache<T> implements ICache<T> {
    private cache_: {[key: string]: TTLWrapper<T>} = {};

    constructor(private defaultTTLMs: number) {}

    get(key: string): T | undefined {
        const value = this.cache_[key];
        if (!value) {
            return;
        }

        // Check if it also respects TTL
        if (value.expiresEpoch < Date.now()) {
            return;
        }

        return value.data;
    }

    has(key: string): boolean {
        return !!this.get(key);
    }

    getOrThrow(key: string): T {
        if (!this.has(key)) {
            throw new Error(`key ${key} does not exist in map [getOrThrow]`);
        }

        return this.get(key)!;
    }

    setWithTTL(key: string, value: T, ttlMs: number) {
        this.cache_[key] = {
            data: value,
            expiresEpoch: Date.now() + ttlMs,
        };
    }

    set(key: string, value: T) {
        this.setWithTTL(key, value, this.defaultTTLMs);
    }

    size(): number {
        return Object.keys(this.cache_).length;
    }
}
