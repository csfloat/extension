import {SimpleHandler} from './main';
import {RequestType} from './types';
import {environment} from '../../../environment';
import {HasPermissions} from './has_permissions';
import {ExtensionVersion} from './extension_version';

export interface PingExtensionStatusRequest {}

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
            }),
        });

        if (resp.status !== 200) {
            throw new Error('invalid status');
        }

        return resp.json() as Promise<PingExtensionStatusResponse>;
    }
);
