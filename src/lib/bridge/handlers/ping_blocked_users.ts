import {SimpleHandler} from './main';
import {RequestType} from './types';
import {environment} from '../../../environment';

export interface PingBlockedUsersRequest {
    blocked_steam_ids: string[];
}

export interface PingBlockedUsersResponse {}

export const PingBlockedUsers = new SimpleHandler<PingBlockedUsersRequest, PingBlockedUsersResponse>(
    RequestType.PING_BLOCKED_USERS,
    async (req) => {
        const resp = await fetch(`${environment.csfloat_base_api_url}/v1/trades/steam-status/blocked-users`, {
            credentials: 'include',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req),
        });

        if (resp.status !== 200) {
            throw new Error('invalid status');
        }

        return {};
    }
);
