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
    await fetch(`https://store.steampowered.com`, {
        credentials: 'include',
        headers: {
            // Required for Steam to refresh the JWT when it expires
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9;q=0.8,application/signed-exchange;v=b3;q=0.7',
        },
    });

    const token = (await fetchStoreWebAPIToken()) || (await renewStoreWebAPIToken());
    if (!token) {
        throw new Error('failed to parse web api token');
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

async function fetchStoreWebAPIToken(): Promise<string | undefined> {
    const resp = await fetch(`https://store.steampowered.com/pointssummary/ajaxgetasyncconfig`, {
        credentials: 'include',
    });
    if (!resp.ok) {
        throw new Error(`failed to fetch steam store config (status ${resp.status})`);
    }

    const body = await resp.json().catch(() => {
        throw new Error('failed to parse steam store config');
    });

    return body?.data?.webapi_token;
}

let storeTokenRenewal: Promise<string | undefined> | null = null;

/**
 * Overlapping callers share one renewal, so they don't race the hourly throttle or send Steam competing nonces
 */
function renewStoreWebAPIToken(): Promise<string | undefined> {
    storeTokenRenewal ??= (async () => {
        try {
            return (await renewStoreSession()) ? await fetchStoreWebAPIToken() : undefined;
        } finally {
            storeTokenRenewal = null;
        }
    })();
    return storeTokenRenewal;
}

const STORE_SETTOKEN_URL = 'https://store.steampowered.com/login/settoken';
const SETTOKEN_FIELDS = ['steamID', 'nonce', 'redir', 'auth'];

/**
 * The store login cookie can expire while the Steam login session is still valid (ie. steamcommunity.com still
 * works), so renew it the same way the store page does. Returns whether it renewed.
 */
async function renewStoreSession(): Promise<boolean> {
    const lastAttempt = await gStore.getWithStorage<number>(
        chrome.storage.local,
        StorageKey.LAST_STORE_SESSION_RENEWAL_ATTEMPT
    );
    if (lastAttempt && lastAttempt > Date.now() - 60 * 60 * 1000) {
        // Steam already said no within the last hour, they're likely logged out of Steam entirely
        return false;
    }

    // Only Steam answering counts towards the hourly throttle, network errors are retried on the next call
    const steamAnswered = () =>
        gStore.setWithStorage(chrome.storage.local, StorageKey.LAST_STORE_SESSION_RENEWAL_ATTEMPT, Date.now());

    try {
        const refreshForm = new FormData();
        refreshForm.append('redir', 'https://store.steampowered.com/');
        const refreshResp = await fetch(`https://login.steampowered.com/jwt/ajaxrefresh`, {
            method: 'POST',
            credentials: 'include',
            body: refreshForm,
        });

        const refresh = refreshResp.ok ? await refreshResp.json().catch(() => null) : null;
        if (
            !refresh?.success ||
            // Only ever send the auth to the store
            refresh.login_url !== STORE_SETTOKEN_URL ||
            !SETTOKEN_FIELDS.every((key) => typeof refresh[key] === 'string' && refresh[key])
        ) {
            await steamAnswered();
            return false;
        }

        const tokenForm = new FormData();
        for (const key of SETTOKEN_FIELDS) {
            tokenForm.append(key, refresh[key]);
        }
        const tokenResp = await fetch(STORE_SETTOKEN_URL, {
            method: 'POST',
            credentials: 'include',
            body: tokenForm,
            // A redirect would resend the auth wherever it points
            redirect: 'error',
        });

        await steamAnswered();
        // Rejections are still HTTP 200, ie. `{"result": 8}`
        const result = tokenResp.ok ? await tokenResp.json().catch(() => null) : null;
        return result?.result === 1;
    } catch (e) {
        console.error('failed to renew steam store session', e);
        return false;
    }
}

export function extractSteamID(token: string): string | null {
    try {
        const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const {sub} = JSON.parse(atob(payload));
        return /^\d+$/.test(sub) ? sub : null;
    } catch {
        return null;
    }
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
