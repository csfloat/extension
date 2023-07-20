import {Handle} from './lib/bridge/server';
import {InternalResponseBundle} from './lib/bridge/types';
import MessageSender = chrome.runtime.MessageSender;
import {DEFAULT_SETTINGS} from './pages/options/utils';

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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    unifiedHandler(request, sender, sendResponse);
    return true;
});

chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
    unifiedHandler(request, sender, sendResponse);
    return true;
});

chrome.storage.local.get('csgofloat-settings', (data) => {
    const settings = data['csgofloat-settings'] || {};

    chrome.storage.local.set({
        'csgofloat-settings': {
            ...DEFAULT_SETTINGS,
            ...settings,
        },
    });
});
