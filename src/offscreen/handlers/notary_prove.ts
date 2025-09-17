import {OffscreenRequestType, SimpleOffscreenHandler} from './types';
import {NotaryProveRequest} from '../../lib/notary/types';
import {getSteamRequestURL} from '../../lib/notary/utils';
import {AccessToken} from '../../lib/alarms/access_token';

export interface TLSNProveOffscreenRequest {
    notary_request: NotaryProveRequest;
    access_token: AccessToken;
}

export interface TLSNProveOffscreenResponse {
    data: string;
}

export const TLSNProveOffscreenHandler = new SimpleOffscreenHandler<TLSNProveOffscreenRequest, TLSNProveOffscreenResponse>(
    OffscreenRequestType.TLSN_PROVE,
    (request) => {
        const url = getSteamRequestURL(request.notary_request, request.access_token);

        console.log('Received notary-prove request in offscreen document', request);

        return {
            data: url,
        };
    }
);
