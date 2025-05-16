import {SimpleHandler} from './main';
import {RequestType} from './types';
import {environment} from '../../../environment';

export interface FetchCSFloatMeRequest {}

export interface FetchCSFloatMeResponse {
    actionable_trades: number;
    has_unread_notifications: boolean;
    pending_offers: number;
    user: {
        steam_id: string;
        username: string;
        avatar: string;
        stall_public: boolean;
        online?: boolean;
        flags: number;
        away?: boolean;
        fee: number;
    };
}

export interface FetchCSFloatMeError {
    code?: string;
    message?: string;
}

export const FetchCSFloatMe = new SimpleHandler<FetchCSFloatMeRequest, FetchCSFloatMeResponse>(
    RequestType.FETCH_CSFLOAT_ME,
    async (req) => {
        return fetch(`${environment.csfloat_base_api_url}/v1/me`, {
            credentials: 'include',
        }).then((resp) => {
            return resp.json().then((json: FetchCSFloatMeResponse | FetchCSFloatMeError) => {
                if (resp.ok) {
                    return json;
                } else {
                    throw Error((json as FetchCSFloatMeError).message);
                }
            }) as Promise<FetchCSFloatMeResponse>;
        });
    }
);
