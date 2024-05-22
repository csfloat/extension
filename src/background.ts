import {Handle} from './lib/bridge/server';
import {InternalResponseBundle} from './lib/bridge/types';
import MessageSender = chrome.runtime.MessageSender;
import {alarmListener, registerTradeAlarmIfPossible} from './lib/alarms/setup';
import {pingTradeStatus} from './lib/alarms/csfloat_trade_pings';
import {gStore} from './lib/storage/store';
import {StorageKey} from './lib/storage/keys';

function unifiedHandler(request: any, sender: MessageSender, sendResponse: (response?: any) => void) {
    Handle(request, sender)
        .then((response) => {
            sendResponse({
                request_type: request.request_type,
                id: request.id,
                response,
            } as InternalResponseBundle);
        })
        .catch((error) => {
            sendResponse({
                request_type: request.request_type,
                id: request.id,
                error: error.toString(),
            } as InternalResponseBundle);
        });
}

function requestPermissions(permissions: string[], origins: string[], sendResponse: any) {
    chrome.permissions.request({permissions, origins}, (granted) => sendResponse(granted));

    return true;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === 'requestPermissions') {
        return requestPermissions(request.permissions, request.origins, sendResponse);
    }

    unifiedHandler(request, sender, sendResponse);
    return true;
});

chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
    unifiedHandler(request, sender, sendResponse);
    return true;
});

if (chrome.alarms) {
    // Install at the root level to make sure events wake up the service worker
    chrome.alarms.onAlarm.addListener(alarmListener);
}

async function checkAlarmState() {
    await registerTradeAlarmIfPossible();
}

checkAlarmState();

// Ping trade status upon service worker wake-up
// Why do this even though there's an alarm? Well, some people turn on their device briefly to send a trade offer
// then close it quickly, it's hard to rely on Chrome's scheduling in that case
async function checkTradeStatus() {
    const lastPing = await gStore.getWithStorage<number>(chrome.storage.local, StorageKey.LAST_TRADE_PING_ATTEMPT);
    if (!lastPing || lastPing < Date.now() - 3 * 60 * 1000) {
        // Last ping was over 3 minutes ago
        pingTradeStatus();
    }
}
checkTradeStatus();
