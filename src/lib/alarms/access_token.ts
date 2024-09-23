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

    const body = await resp.text();

    const webAPITokenMatch = /data-loyalty_webapi_token="&quot;([a-zA-Z0-9_.-]+)&quot;"/.exec(body);
    if (!webAPITokenMatch || webAPITokenMatch.length === 0) {
        throw new Error('failed to parse web api token');
    }

    const token = webAPITokenMatch[1];
    const steamID = extractSteamID(body);

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

function extractSteamID(body: string): string | null {
    const steamIDMatch = /g_steamID = "(\d+?)"/.exec(body);
    if (!steamIDMatch || steamIDMatch.length === 0) {
        return null;
    }

    return steamIDMatch[1];
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
