import {SimpleHandler} from './main';
import {RequestType} from './types';

export interface CSMoneyPriceRequest {
    marketHashName: string;
}

interface DynamicBanner {
    dynamic: boolean;
    link: string;
    src: string;
    height: string;
}

interface ImageBanner {
    link: string;
    src: string;
    height: string;
}

interface Banner extends DynamicBanner, ImageBanner {}

export interface CSMoneyPriceResponse {
    price: number;
    banner?: {enable?: boolean} & Banner;
}

export const CSMoneyPrice = new SimpleHandler<CSMoneyPriceRequest, CSMoneyPriceResponse>(
    RequestType.CSMONEY_PRICE,
    async (req, sender) => {
        return fetch(`https://money.csgofloat.com/price?name=${req.marketHashName}`).then((resp) => {
            return resp.json() as Promise<CSMoneyPriceResponse>;
        });
    }
);
