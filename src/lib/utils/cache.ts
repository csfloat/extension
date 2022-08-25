/**
 * Simple Generic Cache with stringified keys
 */
export class Cache<T> {
    private cache_: {[key: string]: T} = {};

    set(key: string, value: T) {
        this.cache_[key] = value;
    }

    get(key: string): T|undefined {
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
