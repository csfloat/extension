import {SimpleHandler} from './main';
import {RequestType} from './types';
import {SendToOffscreen} from '../../../offscreen/client';
import {TLSNProveOffscreenHandler} from '../../../offscreen/handlers/notary_prove';
import {HasPermissions} from './has_permissions';
import {NotaryProveRequest} from '../../notary/types';
import {getAccessToken} from '../../alarms/access_token';


export interface NotaryProveResponse {
    data: any;
}

export const NotaryProve = new SimpleHandler<NotaryProveRequest, NotaryProveResponse>(
    RequestType.NOTARY_PROVE,
    async (request: NotaryProveRequest): Promise<NotaryProveResponse> => {
        const steamPoweredPermissions = await HasPermissions.handleRequest(
            {
                permissions: [],
                origins: ['https://api.steampowered.com/*'],
            },
            {}
        );
        if (!steamPoweredPermissions.granted) {
            throw new Error('must have api.steampowered.com permissions in order to prove API requests');
        }

        const access_token = await getAccessToken(request.expected_steam_id);

        const response = await SendToOffscreen(TLSNProveOffscreenHandler, {
            notary_request: request,
            access_token
        });

        return {
            data: response.data,
        };
    }
);
