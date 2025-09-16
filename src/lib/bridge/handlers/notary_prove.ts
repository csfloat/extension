import {SimpleHandler} from './main';
import {RequestType} from './types';
import {SendToOffscreen} from '../../offscreen/client';
import {TLSNProveOffscreenHandler} from '../../offscreen/handlers/notary_prove';

export interface NotaryProveRequest {
    data: any;
}

export interface NotaryProveResponse {
    data: any;
}

export const NotaryProve = new SimpleHandler<NotaryProveRequest, NotaryProveResponse>(
    RequestType.NOTARY_PROVE,
    async (request: NotaryProveRequest): Promise<NotaryProveResponse> => {
        const response = await SendToOffscreen(TLSNProveOffscreenHandler, {data: request.data});
        return {
            data: response.data,
        };
    }
);
