interface UserInfo {
    account_name: string;
    accountid: number;
    country_code: string;
    is_limited: boolean;
    is_partner_member: boolean;
    is_support: boolean;
    logged_in: boolean;
    steamid: string;
}

export function getUserInfo() {
    const configUserInfo = document.getElementById('application_config')?.dataset?.userinfo;
    if (!configUserInfo) {
        return null;
    }
    return JSON.parse(configUserInfo) as UserInfo;
}

export function getUserSteamID() {
    const userInfo = getUserInfo();
    if (!userInfo?.logged_in) {
        return null;
    }
    return userInfo.steamid;
}

/**
 * Converts a SteamID32 to a SteamID64
 * @param steamID32 number
 * @returns SteamID64
 */
export function convertSteamID32To64(steamID32: number) {
    return (BigInt('76561197960265728') + BigInt(steamID32)).toString();
}
