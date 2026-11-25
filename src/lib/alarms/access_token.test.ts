import {beforeEach, describe, expect, it, vi} from 'vitest';
import {extractSteamID, getAccessToken} from './access_token';

const storage = vi.hoisted(() => {
    vi.stubGlobal('chrome', {storage: {local: {}}});
    return new Map<string, unknown>();
});
vi.mock('../storage/store', () => ({
    gStore: {
        getWithStorage: async (_: unknown, key: string) => storage.get(key),
        setWithStorage: async (_: unknown, key: string, value: unknown) => void storage.set(key, value),
    },
}));

const payload = btoa(JSON.stringify({sub: '76561198000000001', aud: ['web:store']})).replace(/=+$/, '');
const token = `eyJhbGciOiJFZERTQSJ9.${payload}.c2ln`;

const REFRESH = {
    success: true,
    login_url: 'https://store.steampowered.com/login/settoken',
    steamID: '76561198000000001',
    nonce: 'nonce',
    redir: '/',
    auth: 'auth',
};

/** Routes Steam requests to canned JSON bodies, the store config is logged in once settoken has been called */
function stubSteam(opts: {loggedIn?: boolean; refresh?: unknown} = {}) {
    let loggedIn = !!opts.loggedIn;
    const fetchMock = vi.fn(async (url: string) => {
        let body: unknown = {};
        if (url.endsWith('/ajaxgetasyncconfig')) {
            body = {success: 1, data: loggedIn ? {webapi_token: token} : []};
        } else if (url.endsWith('/jwt/ajaxrefresh')) {
            body = opts.refresh ?? REFRESH;
        } else if (url.endsWith('/login/settoken')) {
            loggedIn = true;
        }
        return {ok: true, json: () => Promise.resolve(body)};
    });
    vi.stubGlobal('fetch', fetchMock);
    return (path: string) => fetchMock.mock.calls.filter(([url]) => url.endsWith(path));
}

describe('getAccessToken', () => {
    beforeEach(() => storage.clear());

    it('reads the web API token and Steam ID from the store config', async () => {
        const calls = stubSteam({loggedIn: true});
        await expect(getAccessToken('76561198000000001')).resolves.toMatchObject({
            token,
            steam_id: '76561198000000001',
        });
        expect(calls('/jwt/ajaxrefresh')).toHaveLength(0);
    });

    it('rejects a token for a different Steam account', async () => {
        stubSteam({loggedIn: true});
        await expect(getAccessToken('76561198000000002')).rejects.toThrow('expected steam account');
    });

    it('renews an expired store session, at most once an hour', async () => {
        const calls = stubSteam();
        await expect(getAccessToken()).resolves.toMatchObject({token});
        const settoken = calls('/login/settoken')[0] as unknown as [string, RequestInit];
        expect((settoken[1].body as FormData).get('auth')).toBe('auth');

        storage.clear();
        stubSteam({refresh: {success: false}});
        await expect(getAccessToken()).rejects.toThrow('failed to parse web api token');

        storage.delete('access_token');
        const throttled = stubSteam();
        await expect(getAccessToken()).rejects.toThrow('failed to parse web api token');
        expect(throttled('/jwt/ajaxrefresh')).toHaveLength(0);
    });

    it('never sends the refresh auth outside the store', async () => {
        const calls = stubSteam({refresh: {...REFRESH, login_url: 'https://example.com/login/settoken'}});
        await expect(getAccessToken()).rejects.toThrow('failed to parse web api token');
        expect(calls('/login/settoken')).toHaveLength(0);
    });

    it('explains non-JSON store responses', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ok: true, json: () => Promise.reject(new SyntaxError())}));
        await expect(getAccessToken()).rejects.toThrow('failed to parse steam store config');
    });

    it('returns null for malformed tokens', () => {
        expect(extractSteamID('not-a-jwt')).toBeNull();
    });
});
