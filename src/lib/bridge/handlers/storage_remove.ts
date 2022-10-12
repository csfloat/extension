import {RequestHandler} from '../types';
import {gStore} from '../../storage/store';
import {ClientSend} from '../client';
import {DynamicStorageKey, StorageKey, StorageRow} from '../../storage/keys';
import {RequestType} from './types';

interface StorageRemoveRequest {
    key: StorageKey | DynamicStorageKey;
}

interface StorageRemoveResponse {}

class StorageRemoveHandler<T> implements RequestHandler<StorageRemoveRequest, StorageRemoveResponse> {
    getType(): RequestType {
        return RequestType.STORAGE_REMOVE;
    }

    async handleRequest(
        request: StorageRemoveRequest,
        sender: chrome.runtime.MessageSender
    ): Promise<StorageRemoveResponse> {
        await gStore.remove(request.key);
        return {} as StorageRemoveResponse;
    }
}

export const StorageRemove = new StorageRemoveHandler();

export function Remove(row: StorageRow<any>): Promise<StorageRemoveResponse> {
    return ClientSend(StorageRemove, {key: row.key});
}
