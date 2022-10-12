import {SimpleHandler} from './main';
import {RequestType} from './types';

export interface FetchSkinModelRequest {
    inspectLink: string;
}

export interface FetchSkinModelResponse {
    modelLink: string;
    screenshotLink: string;

    error?: string;
}

export const FetchSkinModel = new SimpleHandler<FetchSkinModelRequest, FetchSkinModelResponse>(
    RequestType.FETCH_SKIN_MODEL,
    async (req) => {
        return fetch(`https://money.csgofloat.com/model?url=${req.inspectLink}`).then((resp) => {
            return resp.json().then((data) => {
                if (resp.ok) {
                    return data;
                } else {
                    throw new Error(data.error);
                }
            }) as Promise<FetchSkinModelResponse>;
        });
    }
);
