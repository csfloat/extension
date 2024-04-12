import {Handle} from './lib/bridge/server';
import {InternalResponseBundle} from './lib/bridge/types';
import MessageSender = chrome.runtime.MessageSender;
import {PING_CSFLOAT_TRADE_STATUS_ALARM_NAME, pingTradeStatus} from './lib/alarms/csfloat_trade_pings';

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

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === PING_CSFLOAT_TRADE_STATUS_ALARM_NAME) {
        await pingTradeStatus();
    }
});

async function checkAlarmState() {
    const alarm = await chrome.alarms.get(PING_CSFLOAT_TRADE_STATUS_ALARM_NAME);

    if (!alarm) {
        await chrome.alarms.create(PING_CSFLOAT_TRADE_STATUS_ALARM_NAME, {
            periodInMinutes: 5,
            delayInMinutes: 1,
        });
    }
}

checkAlarmState();
