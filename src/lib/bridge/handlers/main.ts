import {RequestHandler} from '../types';
import MessageSender = chrome.runtime.MessageSender;
import {RequestType} from './types';

export class SimpleHandler<Req, Resp> implements RequestHandler<Req, Resp> {
    constructor(private type: RequestType, private handler: (request: Req, sender: MessageSender) => Promise<Resp>) {}

    getType(): RequestType {
        return this.type;
    }

    handleRequest(request: Req, sender: MessageSender): Promise<Resp> {
        return this.handler(request, sender);
    }
}

export interface Empty {}

export class EmptyRequestHandler<Resp> implements RequestHandler<Empty, Resp> {
    constructor(private type: RequestType, private handler: (sender: MessageSender) => Promise<Resp>) {}

    getType(): RequestType {
        return this.type;
    }

    handleRequest(request: Empty, sender: MessageSender): Promise<Resp> {
        return this.handler(sender);
    }
}

export class EmptyResponseHandler<Req> implements RequestHandler<Req, void> {
    constructor(private type: RequestType, private handler: (request: Req, sender: MessageSender) => Promise<void>) {}

    getType(): RequestType {
        return this.type;
    }

    handleRequest(request: Req, sender: MessageSender): Promise<void> {
        return this.handler(request, sender);
    }
}
