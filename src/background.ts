import {Handle} from './lib/bridge/server';
import {InternalResponseBundle} from './lib/bridge/types';
import MessageSender = chrome.runtime.MessageSender;
import {alarmListener, registerTradeAlarmIfPossible} from './lib/alarms/setup';

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
