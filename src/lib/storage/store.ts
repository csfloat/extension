import {DynamicStorageKey, StorageKey} from './keys';

class Store {
    // Prefer to use sync storage if possible
    get defaultStorageLayer(): chrome.storage.SyncStorageArea | chrome.storage.LocalStorageArea {
        return chrome.storage.sync ? chrome.storage.sync : chrome.storage.local;
    }

    // getWithStorage using a specified storage layer
    async getWithStorage<T>(
        storage: chrome.storage.SyncStorageArea | chrome.storage.LocalStorageArea,
        key: StorageKey | DynamicStorageKey
    ): Promise<T | null> {
        const a = await storage.get(key);
        if (!a || !(key in a)) {
            return null;
        }

        try {
            return JSON.parse(a[key]) as T;
        } catch (e) {
            // Fallback if this is an old key not stored as JSON
            return a[key] as T;
        }
    }

    // get using the default storage layer
    async get<T>(key: StorageKey | DynamicStorageKey): Promise<T | null> {
        return this.getWithStorage(this.defaultStorageLayer, key);
    }

    // setWithStorage using a specified storage layer
    async setWithStorage<T>(
        storage: chrome.storage.SyncStorageArea | chrome.storage.LocalStorageArea,
        key: StorageKey | DynamicStorageKey,
        value: T
    ): Promise<void> {
        return storage.set({[key]: JSON.stringify(value)});
    }

    // set using the default storage layer
    async set<T>(key: StorageKey | DynamicStorageKey, value: T): Promise<void> {
        return this.setWithStorage(this.defaultStorageLayer, key, value);
    }

    // removeWithStorage using a specified storage layer
    async removeWithStorage(
        storage: chrome.storage.SyncStorageArea | chrome.storage.LocalStorageArea,
        key: StorageKey | DynamicStorageKey
    ): Promise<void> {
        return storage.remove([key]);
    }

    // remove using the default storage layer
    async remove(key: StorageKey | DynamicStorageKey): Promise<void> {
        return this.removeWithStorage(this.defaultStorageLayer, key);
    }
}

export const gStore = new Store();
