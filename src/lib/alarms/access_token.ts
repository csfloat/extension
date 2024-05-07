import {gStore} from '../storage/store';
import {StorageKey} from '../storage/keys';

interface AccessToken {
    token: string;
    updated_at: number;
}

export async function getAccessToken(): Promise<string | null> {
    // Do we have a fresh local copy?
    const tokenData = await gStore.getWithStorage<AccessToken>(chrome.storage.local, StorageKey.ACCESS_TOKEN);
    if (tokenData?.token && tokenData.updated_at > Date.now() - 30 * 60 * 1000) {
        // Token refreshed within the last 30 min, we can re-use
        return tokenData.token;
    }

    // Need to fetch a new one
    const resp = await fetch(`https://steamcommunity.com`, {
        credentials: 'include',
    });

    const body = await resp.text();

    const webAPITokenMatch = /data-loyalty_webapi_token="&quot;([a-zA-Z0-9_.-]+)&quot;"/.exec(body);
    if (!webAPITokenMatch || webAPITokenMatch.length === 0) {
        console.error('failed to parse web api token');
        return null;
    }

    const token = webAPITokenMatch[1];

    try {
        await saveAccessToken(token);
    } catch (e) {
        console.error('failed ot save access token to storage', e);
    }

    return token;
}

export function saveAccessToken(token: string): Promise<void> {
    // Explicitly use local storage to prevent issues with sync storage quota or connectivity issues
    return gStore.setWithStorage(chrome.storage.local, StorageKey.ACCESS_TOKEN, {
        token,
        updated_at: Date.now(),
    } as AccessToken);
}

export function clearAccessTokenFromStorage(): Promise<void> {
    return gStore.removeWithStorage(chrome.storage.local, StorageKey.ACCESS_TOKEN);
}
