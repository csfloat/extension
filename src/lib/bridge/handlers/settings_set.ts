import {RequestHandler} from '../types';
import {gStore} from '../../storage/store';
import {ClientSend} from '../client';
import {DynamicStorageKey, StorageKey, StorageRow} from '../../storage/keys';
import {RequestType} from './types';
import {SetSetting, Settings} from '../../../settings';

interface SettingsSetRequest<T extends keyof Settings> {
    name: T;
    value: Settings[T];
}

class SettingsSetHandler<T extends keyof Settings> implements RequestHandler<SettingsSetRequest<T>, void> {
    getType(): RequestType {
        return RequestType.SETTINGS_SET;
    }

    async handleRequest(request: SettingsSetRequest<T>, sender: chrome.runtime.MessageSender): Promise<void> {
        await SetSetting(request.name, request.value);
    }
}

export async function Set<T extends keyof Settings>(name: T, value: Settings[T]): Promise<void> {
    await ClientSend(new SettingsSetHandler<T>(), {name, value});
}

export const SettingsSet = new SettingsSetHandler();
