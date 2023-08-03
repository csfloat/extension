import {RequestHandler} from '../types';
import {gStore} from '../../storage/store';
import {ClientSend} from '../client';
import {DynamicStorageKey, StorageKey, StorageRow} from '../../storage/keys';
import {RequestType} from './types';
import {GetSetting, Settings} from '../../../settings';

interface SettingsGetRequest<T extends keyof Settings> {
    name: T;
}

interface SettingsGetResponse<T extends keyof Settings> {
    value: Settings[T];
}

class SettingsGetHandler<T extends keyof Settings>
    implements RequestHandler<SettingsGetRequest<T>, SettingsGetResponse<T>>
{
    getType(): RequestType {
        return RequestType.SETTINGS_GET;
    }

    async handleRequest(
        request: SettingsGetRequest<T>,
        sender: chrome.runtime.MessageSender
    ): Promise<SettingsGetResponse<T>> {
        const value = await GetSetting(request.name);

        return {value};
    }
}

export async function Get<T extends keyof Settings>(name: T): Promise<Settings[T]> {
    const resp = await ClientSend(new SettingsGetHandler<T>(), {name});
    return resp.value;
}

export const SettingsGet = new SettingsGetHandler();
