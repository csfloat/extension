import ContextType = chrome.runtime.ContextType;

const OFFSCREEN_DOCUMENT_PATH = '/src/offscreen/offscreen.html';

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
        creating = chrome.offscreen.createDocument({
            url: OFFSCREEN_DOCUMENT_PATH,
            reasons: [chrome.offscreen.Reason.USER_MEDIA],
            justification: 'To perform notary actions',
        });
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
