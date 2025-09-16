import {OffscreenRequestType, SimpleOffscreenHandler} from './types';

export interface TLSNProveOffscreenRequest {
    data: any;
}

export interface TLSNProveOffscreenResponse {
    data: string;
}

export const TLSNProveOffscreenHandler = new SimpleOffscreenHandler<TLSNProveOffscreenRequest, TLSNProveOffscreenResponse>(
    OffscreenRequestType.TLSN_PROVE,
    (request) => {
        console.log('Received notary-prove request in offscreen document', request);
        const result = `proven(${request.data})`;
        return {
            data: result,
        };
    }
);
