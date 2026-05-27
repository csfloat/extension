export enum SteamMarketMode {
    BETA = 'beta',
    LEGACY = 'legacy',
}

export function getSteamMarketMode(): SteamMarketMode {
    if (
        typeof $J === 'function' &&
        typeof g_rgListingInfo === 'object' &&
        g_rgListingInfo !== null &&
        typeof g_rgAssets === 'object' &&
        g_rgAssets !== null
    ) {
        return SteamMarketMode.LEGACY;
    }

    return SteamMarketMode.BETA;
}

export function isSteamMarketMode(mode: SteamMarketMode): boolean {
    return getSteamMarketMode() === mode;
}
