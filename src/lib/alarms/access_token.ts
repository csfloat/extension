import {gStore} from '../storage/store';
import {StorageKey} from '../storage/keys';

export interface AccessToken {
    token: string;
    steam_id?: string | null;
    updated_at: number;
}

export async function getAccessToken(expectedSteamID?: string): Promise<AccessToken> {
    // Do we have a fresh local copy?
    const tokenData = await gStore.getWithStorage<AccessToken>(chrome.storage.local, StorageKey.ACCESS_TOKEN);
    if (tokenData?.token && tokenData.updated_at > Date.now() - 30 * 60 * 1000) {
        // Token refreshed within the last 30 min, we can re-use
        if (!expectedSteamID || expectedSteamID === tokenData?.steam_id) {
            return tokenData;
        }
    }

    // Need to fetch a new one
    const resp = await fetch(`https://steamcommunity.com`, {
        credentials: 'include',
        headers: {
            // Required for Steam to refresh the JWT when it expires
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9;q=0.8,application/signed-exchange;v=b3;q=0.7',
        },
    });

    const cookie = await chrome.cookies.get({url: 'https://steamcommunity.com', name: 'steamLoginSecure'});
    // Structured as `<steamid64>||<jwt>`
    const token = decodeURIComponent(cookie?.value ?? '').split('||')[1];
    if (!token) {
        throw new Error('failed to parse web api token');
    }

    // Steam leaves the expired JWT in the cookie when it can't refresh the session.
    // Compared against Steam's clock since the user's can drift.
    const steamNow = Date.parse(resp.headers.get('date') ?? '') || Date.now();
    const {exp} = decodeJWTPayload(token) ?? {};
    if (typeof exp !== 'number' || exp * 1000 <= steamNow) {
        throw new Error('steam web api token is expired');
    }

    const steamID = extractSteamID(token);

    if (steamID && expectedSteamID && steamID !== expectedSteamID) {
        throw new Error('user is not logged into the expected steam account');
    }

    try {
        await saveAccessToken(token, steamID);
    } catch (e) {
        console.error('failed ot save access token to storage', e);
    }

    return {token, steam_id: steamID, updated_at: Date.now()};
}

function decodeJWTPayload(token: string): {sub?: unknown; exp?: unknown} | null {
    try {
        const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(payload));
    } catch {
        return null;
    }
}

export function extractSteamID(token: string): string | null {
    const sub = decodeJWTPayload(token)?.sub;
    return typeof sub === 'string' && /^\d+$/.test(sub) ? sub : null;
}

export function saveAccessToken(token: string, steamID: string | null): Promise<void> {
    // Explicitly use local storage to prevent issues with sync storage quota or connectivity issues
    return gStore.setWithStorage(chrome.storage.local, StorageKey.ACCESS_TOKEN, {
        token,
        steam_id: steamID,
        updated_at: Date.now(),
    } as AccessToken);
}

export function clearAccessTokenFromStorage(): Promise<void> {
    return gStore.removeWithStorage(chrome.storage.local, StorageKey.ACCESS_TOKEN);
}
