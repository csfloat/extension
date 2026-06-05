export enum SteamMarketMode {
    REACT = 'react',
    LEGACY = 'legacy',
}

export function isLegacySteamMarket(): boolean {
    return (
        typeof $J === 'function' &&
        typeof g_rgListingInfo === 'object' &&
        g_rgListingInfo !== null &&
        typeof g_rgAssets === 'object' &&
        g_rgAssets !== null
    );
}

/** True only if current page is part of the Steam Market AND the beta is being used */
export function isReactSteamMarket(): boolean {
    return (window as any).SSR?.reactRoot !== undefined;
}