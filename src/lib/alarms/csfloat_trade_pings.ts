import {Trade} from '../types/float_market';
import {FetchPendingTrades} from '../bridge/handlers/fetch_pending_trades';
import {pingTradeHistory} from './trade_history';
import {cancelUnconfirmedTradeOffers, pingCancelTrades, pingSentTradeOffers} from './trade_offer';
import {HasPermissions} from '../bridge/handlers/has_permissions';
import {PingExtensionStatus} from '../bridge/handlers/ping_extension_status';
import {AccessToken, getAccessToken} from './access_token';
import {gStore} from '../storage/store';
import {StorageKey} from '../storage/keys';

export const PING_CSFLOAT_TRADE_STATUS_ALARM_NAME = 'ping_csfloat_trade_status_alarm';

export async function pingTradeStatus(expectedSteamID?: string) {
    await gStore.setWithStorage(chrome.storage.local, StorageKey.LAST_TRADE_PING_ATTEMPT, Date.now());

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

    let pendingTrades: Trade[];
    try {
        const resp = await FetchPendingTrades.handleRequest({limit: 1000}, {});
        pendingTrades = resp.trades;
    } catch (e) {
        console.error(e);
        console.log('cannot fetch pending trades for CSFloat, may not be logged in or CSFloat down');
        return;
    }

    let access: AccessToken | null = null;

    try {
        access = await getAccessToken(expectedSteamID);
    } catch (e) {
        console.error('failed to fetch access token', e);
    }

    let errors;

    if (pendingTrades.length > 0) {
        errors = await pingUpdates(pendingTrades);
    }

    // Ping status of ext + permissions
    try {
        await PingExtensionStatus.handleRequest(
            {
                access_token_steam_id: access?.steam_id,
                history_error: errors?.history_error,
                trade_offer_error: errors?.trade_offer_error,
            },
            {}
        );
    } catch (e) {
        console.error('failed to ping extension status to csfloat', e);
    }
}

interface UpdateErrors {
    history_error?: string;
    trade_offer_error?: string;
}

async function pingUpdates(pendingTrades: Trade[]): Promise<UpdateErrors> {
    const errors: UpdateErrors = {};

    try {
        await cancelUnconfirmedTradeOffers(pendingTrades);
    } catch (e) {
        console.error(`failed to cancel unconfirmed trade offers`, e);
    }

    try {
        await pingTradeHistory(pendingTrades);
    } catch (e) {
        console.error('failed to ping trade history', e);
        errors.history_error = (e as any).toString();
    }

    try {
        await pingSentTradeOffers(pendingTrades);
    } catch (e) {
        console.error('failed to ping sent trade offer state', e);
        errors.trade_offer_error = (e as any).toString();
    }

    try {
        await pingCancelTrades(pendingTrades);
    } catch (e) {
        console.error('failed to ping cancel ping trade offers', e);
    }

    return errors;
}
