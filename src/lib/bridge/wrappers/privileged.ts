import {RequestHandler} from '../types';
import {RequestType} from '../handlers/types';
import MessageSender = chrome.runtime.MessageSender;

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
