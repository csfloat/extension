import {RequestType} from "./main";
import {RequestHandler} from "../types";
import {gStore, StorageKey} from "../../storage/store";
import {ClientSend} from "../client";

interface StorageSetRequest<T> {
    key: StorageKey;
    value: T;
}

interface StorageSetResponse {}

class StorageSetHandler<T> implements RequestHandler<StorageSetRequest<T>, StorageSetResponse> {
    getType(): RequestType {
        return RequestType.STORAGE_SET;
    }

    async handleRequest(request: StorageSetRequest<T>, sender: chrome.runtime.MessageSender): Promise<StorageSetResponse> {
        await gStore.set<T>(request.key, request.value);
        return {} as StorageSetResponse;
    }
}

export const StorageSet = new StorageSetHandler();

export function Set<T>(key: StorageKey, value: T): Promise<StorageSetResponse> {
    return ClientSend(StorageSet, {key, value});
}
