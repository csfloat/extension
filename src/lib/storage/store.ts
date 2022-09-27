import {StorageKey} from "./keys";

class Store {
    // Prefer to use sync storage if possible
    get storage(): chrome.storage.SyncStorageArea|chrome.storage.LocalStorageArea {
        return chrome.storage.sync ? chrome.storage.sync : chrome.storage.local;
    }

    async get<T>(key: StorageKey): Promise<T|null> {
        const a = await this.storage.get(key);
        if (!a || !(key in a)) {
            return null;
        }

        return JSON.parse(a[key]) as T;
    }

    async set<T>(key: StorageKey, value: T): Promise<void> {
        return this.storage.set({[key]: JSON.stringify(value)});
    }
}

export const gStore = new Store();
