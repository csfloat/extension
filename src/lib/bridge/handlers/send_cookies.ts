import {SimpleHandler} from './main';
import {RequestType} from './types';
import {setupCookieAlarm} from '../../utils/alarm';

export interface SendCookiesRequest {}

export interface SendCookiesResponse {}

export const SendCookies = new SimpleHandler<SendCookiesRequest, SendCookiesResponse>(
    RequestType.SEND_COOKIES,
    async (req) => {
        const cookies = await chrome.cookies.getAll({
            domain: 'steamcommunity.com',
        });

        // For use in verifying trades on CSFloat, opt-in
        const formatted = cookies
            .filter((e) => {
                return [
                    'timezoneOffset',
                    'Steam_Language',
                    'browserid',
                    'sessionid',
                    'steamCountry',
                    'steamLoginSecure',
                ].includes(e.name);
            })
            .map((e) => {
                return {
                    name: e.name,
                    value: e.value,
                    expiration: e.expirationDate,
                };
            });

        const resp = await fetch(`https://csfloat.com/api/v1/me/steam-cookies`, {
            credentials: 'include',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                cookies: formatted,
            }),
        });

        // Check if an alarm is setup
        await setupCookieAlarm();

        return {} as SendCookiesResponse;
    }
);
