export function inPageContext() {
    return typeof chrome === 'undefined' || !chrome.extension;
}

export function wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
