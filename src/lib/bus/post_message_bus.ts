import {InternalRequestBundle, InternalResponseBundle, Version} from '../bridge/types';
import {runtimeNamespace} from '../utils/detect';

/**
 * Message bus that uses `postMessage` in order to communicate with the background
 * service worker/script.
 *
 * Why? Because the client page (ie. Steam page) on Firefox is not capable of
 * sending a message directly to the extension background.
 *
 * So it requires us to do the following dance:
 * page <--(postmessage)--> content script <--(sendmessage)--> background script
 *
 * This dance is abstracted in `ClientSend`, and only uses this bus if
 * `sendmessage` is not supported in the page.
 */
class PostMessageBus {
    /**
     * For the requester (ie. page), to wait until it gets a response
     * from the content script via. postMessage for the given request ID
     *
     * @param id Request ID
     */
    waitUntilResponseFor(id: number): Promise<any> {
        return new Promise((resolve, reject) => {
            const handler = (e: MessageEvent) => {
                const resp = e.data as InternalResponseBundle;
                if (resp.id !== id || !resp.response) {
                    return;
                }

                // Prevent leaks
                window.removeEventListener('message', handler, false);

                if (resp?.response) {
                    resolve(resp.response);
                } else {
                    reject(resp?.error);
                }
            };

            window.addEventListener('message', handler);
        });
    }

    /**
     * Sends a request to be done through the bus, returns the appropriate
     * response for the input bundle handler
     *
     * @param bundle Request Bundle
     */
    sendRequest(bundle: InternalRequestBundle): Promise<any> {
        window.postMessage(bundle);

        return this.waitUntilResponseFor(bundle.id);
    }

    /**
     * Request handler (content script) for new requests from the page.
     *
     * Each request is effectively "proxied" to the background script/worker
     * to actually execute it's handler.
     */
    handleRequests() {
        const h = (e: MessageEvent) => {
            if (e.data.version !== Version.V1 || !e.data.request) {
                // Ignore messages that aren't for this bridge
                return;
            }

            // Send to the background script
            // @ts-ignore Bad types
            runtimeNamespace().runtime.sendMessage(
                chrome.runtime.id,
                e.data,
                // @ts-ignore Bad types
                (resp: InternalResponseBundle) => {
                    window.postMessage(resp);
                }
            );
        };

        window.addEventListener('message', h);
    }
}

export const g_PostMessageBus = new PostMessageBus();
