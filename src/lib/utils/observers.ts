export function Observe<T>(computeObject: () => T, cb: () => any, pollRateMs = 50) {
    let prev = computeObject();

    setInterval(() => {
        const now = computeObject();
        if (prev !== now) {
            cb();
        }
        prev = now;
    }, pollRateMs);
}

type WaitForElementOptions = {
    interval?: number;
    maxTries?: number;
};
/**
 * Wait for a function to be true
 * @param compute function that returns a boolean
 * @param options options
 * @param options.interval interval in ms, default 200
 * @param options.maxTries maximum tries, default 10
 * @returns true if function returns true, false if not
 */
export async function waitForTrue(compute: () => boolean, options?: WaitForElementOptions) {
    const {interval = 200, maxTries = 10} = options || {};
    let tries = 0;
    while (!compute() && tries < maxTries) {
        tries++;
        await new Promise((r) => setTimeout(r, interval));
    }
    return tries < maxTries;
}
