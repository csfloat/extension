import {SimpleHandler} from './main';
import {RequestType} from './types';

interface FetchSteamUserRequest {}

interface FetchSteamUserResponse {
    isLoggedIn: boolean;
    steamID?: string;
    sessionID?: string;
}

export const FetchSteamUser = new SimpleHandler<FetchSteamUserRequest, FetchSteamUserResponse>(
    RequestType.FETCH_STEAM_USER,
    async (req) => {
        const resp = await fetch('https://steamcommunity.com');
        if (!resp.ok) {
            throw new Error('non-ok response for steamcommunity.com');
        }

        const res: FetchSteamUserResponse = {
            isLoggedIn: false,
        };

        const text = await resp.text();
        const steamIDMatch = text.match(/g_steamID = "(\d+)"/);
        if (steamIDMatch) {
            res.isLoggedIn = true;
            res.steamID = steamIDMatch[1];
        }

        const sessionIDMatch = text.match(/g_sessionID = "([0-9a-fA-F]+)"/);
        if (sessionIDMatch) {
            res.sessionID = sessionIDMatch[1];
        }

        return res;
    }
);
