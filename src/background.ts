import {Handle} from './lib/bridge/server';
import {InternalResponseBundle} from './lib/bridge/types';
import MessageSender = chrome.runtime.MessageSender;
import {ClientSend} from './lib/bridge/client';
import {SendCookies} from './lib/bridge/handlers/send_cookies';
import {setupCookieAlarm} from './lib/utils/alarm';

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

function requestPermissions(permissions: string[], sendResponse: any) {
    chrome.permissions.request({permissions}, (granted) => sendResponse(granted));

    return true;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === 'requestPermissions') {
        return requestPermissions(request.permissions, sendResponse);
    }

    unifiedHandler(request, sender, sendResponse);
    return true;
});

chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
    unifiedHandler(request, sender, sendResponse);
    return true;
});

chrome.runtime.onInstalled.addListener(async ({reason}) => {
    await setupCookieAlarm(true);
});
