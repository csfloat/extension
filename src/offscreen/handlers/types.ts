import MessageSender = chrome.runtime.MessageSender;
import {NotaryProveRequest} from '../../lib/notary/types';
import {AccessToken} from '../../lib/alarms/access_token';
import {PresentationJSON} from 'tlsn-js/build/types';

export enum OffscreenRequestType {
    UNKNOWN = 0,
    TLSN_PROVE = 1
}

export interface OffscreenRequestHandler<Req, Resp> {
    handleRequest(request: Req, sender: MessageSender): Promise<Resp> | Resp;

    getType(): OffscreenRequestType;
}

export class SimpleOffscreenHandler<Req, Resp> implements OffscreenRequestHandler<Req, Resp> {
    constructor(
        private type: OffscreenRequestType,
        private handler: (request: Req, sender: MessageSender) => Promise<Resp> | Resp
    ) {
    }

    getType(): OffscreenRequestType {
        return this.type;
    }

    handleRequest(request: Req, sender: MessageSender): Promise<Resp> | Resp {
        return this.handler(request, sender);
    }
}

export interface TLSNProveOffscreenRequest {
    notary_request: NotaryProveRequest;
    access_token: AccessToken;
}

export interface TLSNProveOffscreenResponse {
    presentation: PresentationJSON;
}