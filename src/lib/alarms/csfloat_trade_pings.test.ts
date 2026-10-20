import {describe, expect, it, vi} from 'vitest';
import {HasPermissions} from '../bridge/handlers/has_permissions';
import {pingTradeStatus} from './csfloat_trade_pings';

vi.hoisted(() => vi.stubGlobal('chrome', {storage: {local: {}}}));
vi.mock('../storage/store', () => ({gStore: {setWithStorage: vi.fn()}}));
vi.mock('../bridge/handlers/has_permissions', () => ({
    HasPermissions: {handleRequest: vi.fn().mockResolvedValue({granted: false})},
}));

describe('pingTradeStatus', () => {
    it('shares one run between overlapping background triggers, but not page bridge calls', async () => {
        await Promise.all([pingTradeStatus(), pingTradeStatus()]);
        expect(HasPermissions.handleRequest).toHaveBeenCalledTimes(1);

        await Promise.all([pingTradeStatus(), pingTradeStatus('76561198000000000')]);
        expect(HasPermissions.handleRequest).toHaveBeenCalledTimes(3);
    });
});
