import {RequestHandler} from '../types';
import {RequestType} from './handlers';
import MessageSender = chrome.runtime.MessageSender;

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

/**
 * Restricts a given handler such that it can only run if the sender is
 * verified to be from the extension's origin (ie. content script)
 */
export class PrivilegedHandler<Req, Resp> implements RequestHandler<Req, Resp> {
    constructor(private handler: RequestHandler<Req, Resp>) {}

    getType(): RequestType {
        return this.handler.getType();
    }

    handleRequest(request: Req, sender: MessageSender): Promise<Resp> {
        if (sender.id !== chrome.runtime.id) {
            throw new Error('Attempt to access restricted method outside of secure context (ie. content script)');
        }

        return this.handler.handleRequest(request, sender);
    }
}
