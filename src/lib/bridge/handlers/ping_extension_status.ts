import {SimpleHandler} from './main';
import {RequestType} from './types';
import {environment} from '../../../environment';
import {HasPermissions} from './has_permissions';
import {ExtensionVersion} from './extension_version';

export interface PingExtensionStatusRequest {
    access_token_steam_id?: string | null;
    history_error?: string | null;
    trade_offer_error?: string | null;
}

export interface PingExtensionStatusResponse {}

export const PingExtensionStatus = new SimpleHandler<PingExtensionStatusRequest, PingExtensionStatusResponse>(
    RequestType.PING_EXTENSION_STATUS,
    async (req) => {
        const steamPoweredPermissions = await HasPermissions.handleRequest(
            {
                permissions: [],
                origins: ['*://*.steampowered.com/*'],
            },
            {}
        );

        const steamCommunityPermissions = await HasPermissions.handleRequest(
            {
                permissions: [],
                origins: ['*://*.steamcommunity.com/*'],
            },
            {}
        );

        const versionResp = await ExtensionVersion.handleRequest({}, {});

        const resp = await fetch(`${environment.csfloat_base_api_url}/v1/me/extension/status`, {
            credentials: 'include',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                steam_community_permission: steamCommunityPermissions.granted,
                steam_powered_permission: steamPoweredPermissions.granted,
                version: versionResp.version,
                access_token_steam_id: req.access_token_steam_id || '',
                history_error: req.history_error || '',
                trade_offer_error: req.trade_offer_error || '',
            }),
        });

        if (resp.status !== 200) {
            throw new Error('invalid status');
        }

        return resp.json() as Promise<PingExtensionStatusResponse>;
    }
);
