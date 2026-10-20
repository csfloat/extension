import {describe, expect, it, vi} from 'vitest';
import {FetchNotaryMeta} from '../bridge/handlers/fetch_notary_meta';
import {isBackgroundNotaryOfferStateEnabled, isBackgroundNotaryRollbackEnabled} from './notary';

vi.mock('../bridge/handlers/fetch_notary_meta', () => ({FetchNotaryMeta: {handleRequest: vi.fn()}}));
vi.mock('../utils/detect', () => ({isFirefox: () => false}));
vi.stubGlobal('chrome', {offscreen: {Reason: {WORKERS: 'WORKERS'}}});

describe('background notary meta', () => {
    it('caches the meta for 30 minutes, but not failed fetches', async () => {
        const fetchMeta = vi
            .mocked(FetchNotaryMeta.handleRequest)
            .mockRejectedValueOnce(new Error('network down'))
            .mockResolvedValue({
                rollback: {enabled: true, background: true},
                accepted: {enabled: true, background: true},
                offer_state: {enabled: true, background: false},
            });

        expect(await isBackgroundNotaryRollbackEnabled()).toBe(false);
        expect(await isBackgroundNotaryRollbackEnabled()).toBe(true);
        expect(await isBackgroundNotaryOfferStateEnabled()).toBe(false);
        expect(fetchMeta).toHaveBeenCalledTimes(2);

        const now = vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 31 * 60 * 1000);
        await isBackgroundNotaryRollbackEnabled();
        expect(fetchMeta).toHaveBeenCalledTimes(3);
        now.mockRestore();
    });
});
