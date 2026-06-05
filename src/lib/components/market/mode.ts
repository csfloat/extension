export enum SteamMarketMode {
    REACT = 'react',
    LEGACY = 'legacy',
}

/** Determine if the Steam Market Beta or the legacy version is being used */
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

    return SteamMarketMode.REACT;
}

export function isSteamMarketMode(mode: SteamMarketMode): boolean {
    return getSteamMarketMode() === mode;
}

export function isLegacySteamMarket(): boolean {
    return isSteamMarketMode(SteamMarketMode.LEGACY);
}

export function isReactSteamMarket(): boolean {
    return isSteamMarketMode(SteamMarketMode.REACT);
}
