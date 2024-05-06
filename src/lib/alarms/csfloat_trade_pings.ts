import {Trade} from '../types/float_market';
import {FetchPendingTrades} from '../bridge/handlers/fetch_pending_trades';
import {pingTradeHistory} from './trade_history';
import {pingSentTradeOffers} from './trade_offer';
import {HasPermissions} from '../bridge/handlers/has_permissions';
import {PingExtensionStatus} from '../bridge/handlers/ping_extension_status';

export const PING_CSFLOAT_TRADE_STATUS_ALARM_NAME = 'ping_csfloat_trade_status_alarm';

export async function pingTradeStatus() {
    const hasPermissions = await HasPermissions.handleRequest(
        {
            permissions: [],
            origins: ['*://*.steampowered.com/*'],
        },
        {}
    );
    if (!hasPermissions.granted) {
        // They didn't enable offer tracking, skip for now
        return;
    }

    // Ping status of ext + permissions
    try {
        await PingExtensionStatus.handleRequest({}, {});
    } catch (e) {
        console.error('failed to ping extension status to csfloat', e);
    }

    let pendingTrades: Trade[];
    try {
        const resp = await FetchPendingTrades.handleRequest({limit: 500}, {});
        pendingTrades = resp.trades;
    } catch (e) {
        console.error(e);
        console.log('cannot fetch pending trades for CSFloat, may not be logged in or CSFloat down');
        return;
    }

    if (pendingTrades.length === 0) {
        // No active trades, return early
        return;
    }

    try {
        await pingTradeHistory(pendingTrades);
    } catch (e) {
        console.error('failed to ping trade history', e);
    }

    try {
        await pingSentTradeOffers(pendingTrades);
    } catch (e) {
        console.error('failed to ping sent trade offer state', e);
    }
}
