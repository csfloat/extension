import {OffscreenRequestBundle, OffscreenResponseBundle} from './types';
import {OFFSCREEN_HANDLERS_MAP} from './handlers/handlers';
import {initThreads} from './handlers/notary_prove';

async function initialize() {
    await initThreads();

    async function handle(
        request: OffscreenRequestBundle,
        sender: chrome.runtime.MessageSender
    ): Promise<OffscreenResponseBundle> {
        const handler = OFFSCREEN_HANDLERS_MAP[request.type];

        if (!handler) {
            throw new Error(`couldn't find handler for request type ${request.type}`);
        }

        try {
            const response = await handler.handleRequest(request.data, sender);

            return {
                data: response,
                shouldClose: handler.shouldClose(),
            };
        } catch (e: any) {
            console.error('Offscreen document error', e);
            return {
                error: e.message,
                shouldClose: handler.shouldClose(),
            };
        }
    }

    chrome.runtime.onMessage.addListener((request: OffscreenRequestBundle, sender, sendResponse) => {
        if (request.target !== 'offscreen') {
            return;
        }

        handle(request, sender)
            .then((bundle) => {
                sendResponse(bundle);
            })
            .catch((e) => {
                console.error('IRRECOVERABLE ERROR IN OFFSCREEN DURING REQUEST', e);
            });

        // Keep message channel open for async response
        return true;
    });

    // Signal to service worker that offscreen is ready
    chrome.runtime.sendMessage({type: 'offscreen_ready'});
}

initialize();
