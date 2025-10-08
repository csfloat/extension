const OFFSCREEN_DOCUMENT_PATH = '/src/offscreen.html';

let creating: Promise<void> | null;

export async function openOffscreenDocument(): Promise<void> {
    const offscreenUrl = chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH);
    const hasExistingContext = await chrome.offscreen.hasDocument();

    if (hasExistingContext) {
        return;
    }

    if (creating) {
        await creating;
    } else {
        creating = (async () => {
            const ready = new Promise<void>((resolve) => {
                const listener = (request: any, sender: chrome.runtime.MessageSender) => {
                    if (request?.type === 'offscreen_ready' && sender.url === offscreenUrl) {
                        chrome.runtime.onMessage.removeListener(listener);
                        resolve();
                    }
                };
                chrome.runtime.onMessage.addListener(listener);
            });

            await chrome.offscreen.createDocument({
                url: OFFSCREEN_DOCUMENT_PATH,
                reasons: [chrome.offscreen.Reason.WORKERS],
                justification: 'Workers for multi-threading',
            });

            await ready;
        })();
        await creating;
        creating = null;
    }
}

export async function closeOffscreenDocument(): Promise<void> {
    const hasExistingContext = await chrome.offscreen.hasDocument();

    if (!hasExistingContext) {
        return;
    }

    await chrome.offscreen.closeDocument();
}
