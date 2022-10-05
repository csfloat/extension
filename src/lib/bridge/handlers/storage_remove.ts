import {RequestType} from "./main";
import {RequestHandler} from "../types";
import {gStore} from "../../storage/store";
import {ClientSend} from "../client";
import {DynamicStorageKey, StorageKey, StorageRow} from "../../storage/keys";

interface StorageRemoveRequest<T> {
    key: StorageKey|DynamicStorageKey;
}

interface StorageRemoveResponse {}

class StorageRemoveHandler<T> implements RequestHandler<StorageRemoveRequest<T>, StorageRemoveResponse> {
    getType(): RequestType {
        return RequestType.STORAGE_REMOVE;
    }

    async handleRequest(request: StorageRemoveRequest<T>, sender: chrome.runtime.MessageSender): Promise<StorageRemoveResponse> {
        await gStore.remove<T>(request.key);
        return {} as StorageRemoveResponse;
    }
}

export const StorageRemove = new StorageRemoveHandler();

export function Remove<T>(row: StorageRow<any>): Promise<StorageRemoveResponse> {
    return ClientSend(StorageRemove, {key: row.key});
}
