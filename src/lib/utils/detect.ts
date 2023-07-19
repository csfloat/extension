export function isFirefox() {
    return navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
}

/**
 * Thanks to our browser overlords, we have two namespaces for `x.runtime.fn()`
 */
export function runtimeNamespace() {
    if (isFirefox()) {
        return browser;
    } else {
        return chrome;
    }
}
