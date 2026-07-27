export const STEAM_ECONOMY_IMAGE_PREFIX = 'https://community.akamai.steamstatic.com/economy/image/';

export function steamEconomyImageUrl(icon: string, size = '330x192'): string {
    return `${STEAM_ECONOMY_IMAGE_PREFIX}${icon}/${size}`;
}
