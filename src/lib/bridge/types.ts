import MessageSender = chrome.runtime.MessageSender;
import {RequestType} from './handlers/types';

export interface RequestHandler<Req, Resp> {
    handleRequest(request: Req, sender: MessageSender): Promise<Resp>;
    getType(): RequestType;
}

export enum Version {
    V1 = 'CSFLOAT_V1',
}

export interface InternalRequestBundle {
    version: string;

    request_type: RequestType;

    // Input request
    request: any;

    // Random ID to identify the request
    id: number;
}

export interface InternalResponseBundle {
    request_type: RequestType;

    // Response
    response: any;

    error: string;

    // Random ID to identify the request
    id: number;
}
