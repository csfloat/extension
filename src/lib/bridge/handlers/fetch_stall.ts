import {RequestType, SimpleHandler} from "./main";
import {Contract, User} from "../../types/float_market";

export interface FetchStallRequest {
    steam_id64: string;
}

export interface FetchStallResponse {
    listings?: Contract[];
    user?: User;
}

export interface FetchStallResponseError {
    code?: string;
    message?: string;
}

export const FetchStall = new SimpleHandler<FetchStallRequest, FetchStallResponse>(
    RequestType.FETCH_STALL,
    async (req) => {
        return fetch(`https://csgofloat.com/api/v1/users/${req.steam_id64}/stall`).then(resp => {
            return resp.json().then((json: FetchStallResponse|FetchStallResponseError) => {
                if (resp.ok) {
                    return json;
                } else {
                    throw Error((json as FetchStallResponseError).message);
                }
            }) as Promise<FetchStallResponse>;
        });
    });
