import {Trade} from '../types/float_market';
import {gStore} from '../storage/store';
import {StorageKey} from '../storage/keys';
import {FetchSteamUser} from '../bridge/handlers/fetch_steam_user';
import {FetchBlockedUsers} from '../bridge/handlers/fetch_blocked_users';
import {PingBlockedUsers} from '../bridge/handlers/ping_blocked_users';

export async function reportBlockedBuyers(pendingTrades: Trade[]) {
    const lastPing = await gStore.getWithStorage<number>(
        chrome.storage.local,
        StorageKey.LAST_TRADE_BLOCKED_PING_ATTEMPT
    );
    if (lastPing && lastPing > Date.now() - 10 * 60 * 1000) {
        // Report blocked users at most once every 10 minutes
        return;
    }

    await gStore.setWithStorage<number>(chrome.storage.local, StorageKey.LAST_TRADE_BLOCKED_PING_ATTEMPT, Date.now());

    const steamUser = await FetchSteamUser.handleRequest({}, {});
    if (!steamUser.sessionID || !steamUser.steamID) {
        return;
    }

    const hasTrade = pendingTrades.some((e) => e.seller_id === steamUser.steamID || e.buyer_id === steamUser.steamID);
    if (!hasTrade) {
        // Logged-in user on Steam doesn't have any CSFloat trades, not relevant
        return;
    }

    const {blocked_steam_ids} = await FetchBlockedUsers.handleRequest(
        {
            steam_id: steamUser.steamID,
        },
        {}
    );

    const filteredIDs = blocked_steam_ids.filter((steamID) => {
        // Is it a buyer or seller in one of the trades?
        return pendingTrades.some((e) => e.seller_id == steamID || e.buyer_id == steamID);
    });

    if (filteredIDs.length === 0) {
        // Nothing to report
        return;
    }

    await PingBlockedUsers.handleRequest({blocked_steam_ids: filteredIDs}, {});
}
