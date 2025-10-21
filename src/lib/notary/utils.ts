import {NotaryProveRequest, ProofType} from './types';
import {AccessToken} from '../alarms/access_token';

const PROOF_BASE_URLS: Record<ProofType, string> = {
    [ProofType.TRADE_OFFERS]: 'https://api.steampowered.com/IEconService/GetTradeOffers/v1/',
    [ProofType.TRADE_OFFER]: 'https://api.steampowered.com/IEconService/GetTradeOffer/v1/',
    [ProofType.TRADE_HISTORY]: 'https://api.steampowered.com/IEconService/GetTradeHistory/v1/',
    [ProofType.TRADE_STATUS]: 'https://api.steampowered.com/IEconService/GetTradeStatus/v1/',
};

function buildQueryString(params: Record<string, any>): string {
    const query = Object.entries(params)
        .filter(([, value]) => value !== undefined)
        .sort(([keyA], [keyB]) => {
            // Always sort the access_token to be the last parameter for cleanliness
            if (keyA === 'access_token') return 1;
            if (keyB === 'access_token') return -1;
            return 0;
        })
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join('&');

    return query ? `?${query}` : '';
}

/**
 * Get Full Steam URL to request for the given notary request
 *
 * @param request Notary request you want the corresponding request URL for
 * @param access_token Corresponding user "access token" to use in the request
 */
export function getSteamRequestURL(request: NotaryProveRequest, access_token: AccessToken): string {
    // Separate the 'type' property from the actual URL parameters
    const {type, ...params} = request;
    const baseUrl = PROOF_BASE_URLS[type];
    const queryString = buildQueryString(Object.assign(params, {access_token: access_token.token}));
    return `${baseUrl}${queryString}`;
}
