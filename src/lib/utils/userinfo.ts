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
