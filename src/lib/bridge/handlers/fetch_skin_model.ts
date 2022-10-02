import {RequestType, SimpleHandler} from "./main";

export interface FetchSkinModelRequest {
    inspectLink: string;
}

export interface FetchSkinModelResponse {
    modelLink: string;
    screenshotLink: string;
}

export const FetchSkinModel = new SimpleHandler<FetchSkinModelRequest, FetchSkinModelResponse>(
    RequestType.FETCH_SKIN_MODEL,
    async (req) => {
        return fetch(`https://money.csgofloat.com/model?url=${req.inspectLink}`).then(resp => {
            return resp.json() as Promise<FetchSkinModelResponse>;
        });
    });
