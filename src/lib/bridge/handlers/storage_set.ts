import {RequestHandler} from '../types';
import {gStore} from '../../storage/store';
import {ClientSend} from '../client';
import {DynamicStorageKey, StorageKey, StorageRow} from '../../storage/keys';
import {RequestType} from './types';

interface StorageSetRequest<T> {
    key: StorageKey | DynamicStorageKey;
    value: T;
}

interface StorageSetResponse {}

class StorageSetHandler<T> implements RequestHandler<StorageSetRequest<T>, StorageSetResponse> {
    getType(): RequestType {
        return RequestType.STORAGE_SET;
    }

    async handleRequest(
        request: StorageSetRequest<T>,
        sender: chrome.runtime.MessageSender
    ): Promise<StorageSetResponse> {
        await gStore.set<T>(request.key, request.value);
        return {} as StorageSetResponse;
    }
}

export const StorageSet = new StorageSetHandler();

export function Set<T>(row: StorageRow<any>, value: T): Promise<StorageSetResponse> {
    return ClientSend(StorageSet, {key: row.key, value});
}
