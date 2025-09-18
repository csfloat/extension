import ContextType = chrome.runtime.ContextType;
import {wait} from '../lib/utils/snips';

const OFFSCREEN_DOCUMENT_PATH = '/src/offscreen.html';

let creating: Promise<void> | null;

export async function openOffscreenDocument(): Promise<void> {
    const offscreenUrl = chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH);
    const existingContexts = await chrome.runtime.getContexts({
        contextTypes: [ContextType.OFFSCREEN_DOCUMENT],
        documentUrls: [offscreenUrl],
    });

    if (existingContexts.length > 0) {
        return;
    }

    if (creating) {
        await creating;
    } else {
        creating = (async () => {
            await chrome.offscreen.createDocument({
                url: OFFSCREEN_DOCUMENT_PATH,
                reasons: [chrome.offscreen.Reason.WORKERS],
                justification: 'Workers for multi-threading',
            });
            // We need to wait for the threads to initialize
            // TODO: Perhaps we can have a better signaling system?
            await wait(1000);
        })();
        await creating;
        creating = null;
    }
}

export async function closeOffscreenDocument(): Promise<void> {
    const offscreenUrl = chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH);
    const existingContexts = await chrome.runtime.getContexts({
        contextTypes: [ContextType.OFFSCREEN_DOCUMENT],
        documentUrls: [offscreenUrl],
    });

    if (existingContexts.length === 0) {
        return;
    }

    await chrome.offscreen.closeDocument();
}
