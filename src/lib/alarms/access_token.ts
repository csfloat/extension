import {gStore} from '../storage/store';
import {StorageKey} from '../storage/keys';

interface AccessToken {
    token: string;
    updated_at: number;
}

export async function getAccessToken(): Promise<string | null> {
    // Do we have a fresh local copy?
    const tokenData = await gStore.get<AccessToken>(StorageKey.ACCESS_TOKEN);
    if (tokenData?.token && tokenData.updated_at > Date.now() - 60 * 60 * 1000) {
        // Token refreshed within the last hour, we can re-use
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

    await saveAccessToken(token);

    return token;
}

export function saveAccessToken(token: string): Promise<void> {
    return gStore.set(StorageKey.ACCESS_TOKEN, {
        token,
        updated_at: Date.now(),
    } as AccessToken);
}

export function clearAccessTokenFromStorage(): Promise<void> {
    return gStore.remove(StorageKey.ACCESS_TOKEN);
}
