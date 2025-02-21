import {SimpleHandler} from './main';
import {RequestType} from './types';

interface FetchBlockedUsersRequest {
    // Steam ID to use to fetch who they've blocked. If this doesn't match the logged
    // in user, then an error will be thrown.
    steam_id: string;
}

interface FetchBlockedUsersResponse {
    blocked_steam_ids: string[];
}

export const FetchBlockedUsers = new SimpleHandler<FetchBlockedUsersRequest, FetchBlockedUsersResponse>(
    RequestType.FETCH_BLOCKED_USERS,
    async (req) => {
        const resp = await fetch(
            `https://steamcommunity.com/profiles/${req.steam_id}/friends/blocked?ajax=1&l=english`
        );
        if (!resp.ok) {
            throw new Error('non-ok response for blocked users');
        }

        const text = await resp.text();

        if (!text.toLowerCase().includes('blocked')) {
            throw new Error('failed to parse blocked users, requested steam id might not be logged in');
        }

        const matches = text.matchAll(/class=".+?ignored.+?".*?id=".+?".*?data-steamid="(7656\d+)"/gs);

        const blocked_steam_ids = [...matches].map((match) => {
            return match[1];
        });

        return {blocked_steam_ids};
    }
);
