import {SimpleHandler} from './main';
import {RequestType} from './types';
import {SendToOffscreen} from '../../../offscreen/client';
import {HasPermissions} from './has_permissions';
import {NotaryProveRequest} from '../../notary/types';
import {getAccessToken} from '../../alarms/access_token';
import {PresentationJSON} from 'tlsn-js/build/types';
import {
    OffscreenRequestType,
    TLSNProveOffscreenRequest,
    TLSNProveOffscreenResponse,
} from '../../../offscreen/handlers/types';
import {MaxConcurrency} from '../wrappers/cached';


export interface NotaryProveResponse {
    presentation: PresentationJSON;
}

export const NotaryProve = MaxConcurrency(new SimpleHandler<NotaryProveRequest, NotaryProveResponse>(
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

        const response = await SendToOffscreen<TLSNProveOffscreenRequest, TLSNProveOffscreenResponse>(OffscreenRequestType.TLSN_PROVE, {
            notary_request: request,
            access_token
        });

        return {
            presentation: response.presentation,
        };
    }
), 2);
