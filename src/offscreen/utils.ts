const OFFSCREEN_DOCUMENT_PATH = '/src/offscreen.html';

let creating: Promise<void> | null;

export async function openOffscreenDocument(): Promise<void> {
    // Shared so a concurrent caller can't see the document before it has registered its message listener
    creating ??= createOffscreenDocument().finally(() => {
        creating = null;
    });
    await creating;
}

async function createOffscreenDocument(): Promise<void> {
    if (await chrome.offscreen.hasDocument()) {
        return;
    }

    const offscreenUrl = chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH);
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
}

export async function closeOffscreenDocument(): Promise<void> {
    const hasExistingContext = await chrome.offscreen.hasDocument();

    if (!hasExistingContext) {
        return;
    }

    await chrome.offscreen.closeDocument();
}
