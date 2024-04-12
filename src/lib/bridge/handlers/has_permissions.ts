import {SimpleHandler} from './main';
import {RequestType} from './types';

export interface HasPermissionsRequest {
    permissions: string[];
    origins: string[];
}

export interface HasPermissionsResponse {
    granted: boolean;
}

export const HasPermissions = new SimpleHandler<HasPermissionsRequest, HasPermissionsResponse>(
    RequestType.HAS_PERMISSIONS,
    async (req) => {
        // @ts-ignore
        const granted = (await chrome.permissions.contains({
            permissions: req.permissions,
            origins: req.origins,
        })) as boolean;

        return {
            granted,
        };
    }
);
