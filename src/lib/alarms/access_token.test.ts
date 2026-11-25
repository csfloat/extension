import {describe, expect, it, vi} from 'vitest';
import {extractSteamID, getAccessToken} from './access_token';

vi.hoisted(() => vi.stubGlobal('chrome', {storage: {local: {}}}));
vi.mock('../storage/store', () => ({gStore: {getWithStorage: vi.fn(), setWithStorage: vi.fn()}}));

const payload = btoa(JSON.stringify({sub: '76561198000000001', aud: ['web:store']})).replace(/=+$/, '');
const token = `eyJhbGciOiJFZERTQSJ9.${payload}.c2ln`;

function stubStore(data: unknown) {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ok: true, json: () => Promise.resolve({success: 1, data})}));
}

describe('getAccessToken', () => {
    it('reads the web API token and Steam ID from the store config', async () => {
        stubStore({webapi_token: token});
        await expect(getAccessToken('76561198000000001')).resolves.toMatchObject({
            token,
            steam_id: '76561198000000001',
        });
    });

    it('rejects a token for a different Steam account', async () => {
        stubStore({webapi_token: token});
        await expect(getAccessToken('76561198000000002')).rejects.toThrow('expected steam account');
    });

    it('fails when the store session is logged out', async () => {
        stubStore([]);
        await expect(getAccessToken()).rejects.toThrow('failed to parse web api token');
    });

    it('explains non-JSON store responses', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ok: true, json: () => Promise.reject(new SyntaxError())}));
        await expect(getAccessToken()).rejects.toThrow('failed to parse steam store config');
    });

    it('returns null for malformed tokens', () => {
        expect(extractSteamID('not-a-jwt')).toBeNull();
    });
});
