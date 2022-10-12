import {RequestHandler} from '../types';
import {gStore} from '../../storage/store';
import {ClientSend} from '../client';
import {DynamicStorageKey, StorageKey, StorageRow} from '../../storage/keys';
import {RequestType} from './types';

interface StorageGetRequest {
    key: StorageKey | DynamicStorageKey;
}

interface StorageGetResponse<T> {
    value: T | null;
}

class StorageGetHandler<T> implements RequestHandler<StorageGetRequest, StorageGetResponse<T>> {
    getType(): RequestType {
        return RequestType.STORAGE_GET;
    }

    async handleRequest(
        request: StorageGetRequest,
        sender: chrome.runtime.MessageSender
    ): Promise<StorageGetResponse<T>> {
        const value = await gStore.get<T>(request.key);
        return {value};
    }
}

export async function Get<T>(row: StorageRow<T>): Promise<T | null> {
    const resp = await ClientSend(new StorageGetHandler<T>(), {key: row.key});
    return resp.value;
}

export const StorageGet = new StorageGetHandler();
