import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
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

/** Routes Steam requests to canned JSON bodies, the store config is logged in once settoken succeeds */
function stubSteam(
    opts: {loggedIn?: boolean; refresh?: unknown; refreshFails?: boolean; settokenResult?: number} = {}
) {
    let loggedIn = !!opts.loggedIn;
    const fetchMock = vi.fn(async (url: string, _?: RequestInit) => {
        let body: unknown = {};
        if (url.endsWith('/ajaxgetasyncconfig')) {
            body = {success: 1, data: loggedIn ? {webapi_token: token} : []};
        } else if (url.endsWith('/jwt/ajaxrefresh')) {
            if (opts.refreshFails) {
                throw new TypeError('Failed to fetch');
            }
            body = opts.refresh ?? REFRESH;
        } else if (url.endsWith('/login/settoken')) {
            body = {result: opts.settokenResult ?? 1};
            loggedIn = opts.settokenResult === undefined;
        }
        return {ok: true, status: 200, json: () => Promise.resolve(body)};
    });
    vi.stubGlobal('fetch', fetchMock);
    return (path: string) => fetchMock.mock.calls.filter(([url]) => url.endsWith(path));
}

describe('getAccessToken', () => {
    beforeEach(() => storage.clear());
    afterEach(() => vi.useRealTimers());

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

    it('renews an expired store session without following redirects', async () => {
        const calls = stubSteam();
        await expect(getAccessToken()).resolves.toMatchObject({token});
        const [, init] = calls('/login/settoken')[0];
        expect((init!.body as FormData).get('auth')).toBe('auth');
        expect(init!.redirect).toBe('error');
    });

    it('shares one renewal between overlapping callers', async () => {
        const calls = stubSteam();
        const results = await Promise.all([getAccessToken(), getAccessToken('76561198000000001')]);
        expect(results.map((r) => r.token)).toEqual([token, token]);
        expect(calls('/jwt/ajaxrefresh')).toHaveLength(1);
    });

    it('waits an hour after Steam rejects a renewal', async () => {
        vi.useFakeTimers({toFake: ['Date']});
        const rejected = stubSteam({settokenResult: 8});
        await expect(getAccessToken()).rejects.toThrow('failed to parse web api token');
        // A rejected settoken doesn't refetch the config
        expect(rejected('/ajaxgetasyncconfig')).toHaveLength(1);

        const throttled = stubSteam();
        await expect(getAccessToken()).rejects.toThrow('failed to parse web api token');
        expect(throttled('/jwt/ajaxrefresh')).toHaveLength(0);

        vi.setSystemTime(Date.now() + 61 * 60 * 1000);
        await expect(getAccessToken()).resolves.toMatchObject({token});
    });

    it('retries right away after a network error', async () => {
        stubSteam({refreshFails: true});
        await expect(getAccessToken()).rejects.toThrow('failed to parse web api token');

        stubSteam();
        await expect(getAccessToken()).resolves.toMatchObject({token});
    });

    it('never posts incomplete or misdirected auth to settoken', async () => {
        for (const refresh of [
            {...REFRESH, login_url: 'https://example.com/login/settoken'},
            {...REFRESH, auth: undefined},
        ]) {
            storage.clear();
            const calls = stubSteam({refresh});
            await expect(getAccessToken()).rejects.toThrow('failed to parse web api token');
            expect(calls('/login/settoken')).toHaveLength(0);
        }
    });

    it('explains non-JSON store responses', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ok: true, json: () => Promise.reject(new SyntaxError())}));
        await expect(getAccessToken()).rejects.toThrow('failed to parse steam store config');
    });

    it('returns null for malformed tokens', () => {
        expect(extractSteamID('not-a-jwt')).toBeNull();
    });
});
