export function inPageContext() {
    return typeof chrome === 'undefined' || !chrome.extension;
}
