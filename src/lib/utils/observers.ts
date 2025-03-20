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
