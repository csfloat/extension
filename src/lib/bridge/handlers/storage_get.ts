import {RequestType} from "./main";
import {RequestHandler} from "../types";
import {gStore, StorageKey} from "../../storage/store";
import {ClientSend} from "../client";

interface StorageGetRequest {
    key: StorageKey;
}

interface StorageGetResponse<T> {
    value: T|null;
}

class StorageGetHandler<T> implements RequestHandler<StorageGetRequest, StorageGetResponse<T>> {
    getType(): RequestType {
        return RequestType.STORAGE_GET;
    }

    async handleRequest(request: StorageGetRequest, sender: chrome.runtime.MessageSender): Promise<StorageGetResponse<T>> {
        const value = await gStore.get<T>(request.key);
        return {value};
    }
}

export async function Get<T>(key: StorageKey): Promise<T|null> {
    const resp = await ClientSend(new StorageGetHandler<T>(), {key});
    return resp.value;
}

export const StorageGet = new StorageGetHandler();
