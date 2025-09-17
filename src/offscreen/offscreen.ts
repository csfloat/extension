import {OffscreenRequestBundle, OffscreenResponseBundle} from './types';
import {OFFSCREEN_HANDLERS_MAP} from './handlers/handlers';

async function handle(request: OffscreenRequestBundle, sender: chrome.runtime.MessageSender): Promise<any> {
    const handler = OFFSCREEN_HANDLERS_MAP[request.type];

    if (!handler) {
        throw new Error(`couldn't find handler for request type ${request.type}`);
    }

    return handler.handleRequest(request.data, sender);
}

chrome.runtime.onMessage.addListener((request: OffscreenRequestBundle, sender, sendResponse) => {
    if (request.target !== 'offscreen') {
        return;
    }

    handle(request, sender)
        .then(response => {
            const bundle: OffscreenResponseBundle = {
                data: response
            };
            sendResponse(bundle);
        })
        .catch(e => {
            console.error('Offscreen document error', e);
            const bundle: OffscreenResponseBundle = {
                error: e.message
            };
            sendResponse(bundle);
        });


    // Keep message channel open for async response
    return true;
});
