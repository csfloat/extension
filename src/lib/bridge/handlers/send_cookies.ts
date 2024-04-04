import {SimpleHandler} from './main';
import {RequestType} from './types';

export interface SendCookiesRequest {
    verify_only?: boolean;
}

export interface SendCookiesResponse {}

export const SendCookies = new SimpleHandler<SendCookiesRequest, SendCookiesResponse>(
    RequestType.SEND_COOKIES,
    async (req) => {
        console.log('cookies 123');
        // @ts-ignore MV3 returns a promise
        const hasPermission = (await chrome.permissions.contains({
            permissions: ['cookies'],
            origins: ['https://steamcommunity.com/'],
        })) as boolean;

        console.log(hasPermission);

        if (!hasPermission) {
            // @ts-ignore MV3 returns a promise
            const granted = (await chrome.permissions.request({
                permissions: ['cookies'],
                origins: ['https://steamcommunity.com/'],
            })) as boolean;
            if (!granted) {
                throw new Error('failed to grant permission, cannot proceed');
            }
        }

        if (req.verify_only) {
            return {} as SendCookiesResponse;
        }

        const cookies = await chrome.cookies.getAll({
            domain: 'steamcommunity.com',
        });

        console.log(cookies);

        return {} as SendCookiesResponse;
        // const resp = await fetch(`https://csfloat.com/api/v1/me/steam-cookies`, {
        //     credentials: 'include',
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify(req),
        // });
    }
);
