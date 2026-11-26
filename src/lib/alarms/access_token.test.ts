import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {extractSteamID, getAccessToken} from './access_token';

const {storage, getCookie} = vi.hoisted(() => {
    const getCookie = vi.fn();
    vi.stubGlobal('chrome', {storage: {local: {}}, cookies: {get: getCookie}});
    return {storage: new Map<string, unknown>(), getCookie};
});
vi.mock('../storage/store', () => ({
    gStore: {
        getWithStorage: async (_: unknown, key: string) => storage.get(key),
        setWithStorage: async (_: unknown, key: string, value: unknown) => void storage.set(key, value),
    },
}));

const EXP = Date.UTC(2026, 10, 27) / 1000;

function makeToken(claims: object) {
    const payload = btoa(JSON.stringify({sub: '76561198000000001', aud: ['web:community'], ...claims}));
    return `eyJhbGciOiJFZERTQSJ9.${payload.replace(/=+$/, '')}.c2ln`;
}
const token = makeToken({exp: EXP});
const cookieFor = (t: string) => `76561198000000001%7C%7C${t}`;

/** Records the page load and cookie read in order, the cookie is only refreshed by the page load */
function stubSteam(cookieValue?: string, steamDate = new Date((EXP - 3600) * 1000)) {
    const calls: string[] = [];
    vi.stubGlobal(
        'fetch',
        vi.fn(async (url: string) => {
            calls.push(url);
            return {headers: new Headers({date: steamDate.toUTCString()})};
        })
    );
    getCookie.mockImplementation(async ({name}: {name: string}) => {
        calls.push(`cookie:${name}`);
        return cookieValue === undefined ? null : {name, value: cookieValue};
    });
    return calls;
}

describe('getAccessToken', () => {
    beforeEach(() => storage.clear());
    afterEach(() => vi.useRealTimers());

    it('reads the token from the steamLoginSecure cookie after loading steamcommunity.com', async () => {
        const calls = stubSteam(cookieFor(token));
        await expect(getAccessToken('76561198000000001')).resolves.toMatchObject({
            token,
            steam_id: '76561198000000001',
        });
        expect(calls).toEqual(['https://steamcommunity.com', 'cookie:steamLoginSecure']);
    });

    it('rejects a token for a different Steam account', async () => {
        stubSteam(cookieFor(token));
        await expect(getAccessToken('76561198000000002')).rejects.toThrow('expected steam account');
    });

    it('fails without a usable cookie', async () => {
        for (const value of [undefined, '', '76561198000000001']) {
            stubSteam(value);
            await expect(getAccessToken()).rejects.toThrow('failed to parse web api token');
        }
    });

    it("rejects tokens that are expired by Steam's clock, or have no expiry", async () => {
        for (const t of [makeToken({exp: EXP}), makeToken({}), 'not-a-jwt']) {
            stubSteam(cookieFor(t), new Date((EXP + 1) * 1000));
            await expect(getAccessToken()).rejects.toThrow('steam web api token is expired');
        }
    });

    it("trusts Steam's clock over a drifted local one", async () => {
        vi.useFakeTimers({toFake: ['Date']});
        vi.setSystemTime((EXP + 24 * 3600) * 1000);
        stubSteam(cookieFor(token));
        await expect(getAccessToken()).resolves.toMatchObject({token});
    });

    it('returns null for malformed tokens', () => {
        expect(extractSteamID('not-a-jwt')).toBeNull();
    });
});
