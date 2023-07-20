import {Handle} from './lib/bridge/server';
import {InternalResponseBundle} from './lib/bridge/types';
import MessageSender = chrome.runtime.MessageSender;
import {DEFAULT_SETTINGS, SettingsType} from './settings';
import {StorageKey} from './lib/storage/keys';
import {gStore} from './lib/storage/store';

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

gStore.get<SettingsType>(StorageKey.SETTINGS).then((settings) => {
    gStore.set<SettingsType>(StorageKey.SETTINGS, {
        ...DEFAULT_SETTINGS,
        ...(settings || {}),
    });
});
