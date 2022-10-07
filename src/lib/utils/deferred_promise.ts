/**
 * Similar to a promise, but allows the ability to resolve/reject in a different context
 * */
export class DeferredPromise<T> {
    private resolve_: ((value: T) => void) | undefined;
    private reject_: ((reason: string) => void) | undefined;
    private readonly promise_: Promise<T>;

    constructor() {
        this.promise_ = new Promise((resolve, reject) => {
            this.resolve_ = resolve;
            this.reject_ = reject;
        });
    }

    resolve(value: T) {
        this.resolve_!(value);
    }

    reject(reason: string) {
        this.reject_!(reason);
    }

    promise(): Promise<T> {
        return this.promise_;
    }
}
