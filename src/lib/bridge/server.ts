import {InternalRequestBundle, RequestHandler, Version} from './types';
import MessageSender = chrome.runtime.MessageSender;
import {HANDLERS_MAP} from './handlers/handlers';
import {RequestType} from './handlers/types';

function findHandler(type: RequestType): RequestHandler<any, any> | undefined {
    return HANDLERS_MAP[type];
}

export async function Handle(blob: any, sender: MessageSender): Promise<any> {
    if (blob.version !== Version.V1) {
        // Ignore messages that aren't for this bridge
        return;
    }

    const req: InternalRequestBundle = blob as InternalRequestBundle;

    const handler = findHandler(req.request_type);
    if (!handler) {
        throw new Error(`couldn't find handler for request type ${req.request_type}`);
    }

    return handler.handleRequest(req.request, sender);
}
