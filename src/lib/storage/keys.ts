/**
 * Keys for use as the raw "key" in local/sync storage for a row
 */
export enum StorageKey {
    // Backwards compatible with <3.0.0
    PAGE_SIZE = 'pageSize'
}

/**
 * Encapsulates a key/value pair, each key has a value associated
 */
export interface StorageRow<T> {
    key: StorageKey
}

function newRow<T>(name: StorageKey): StorageRow<T> {
    return {key: name} as StorageRow<T>;
}

// Explicitly create each row here that is used in the application
// This is designed to have type safety for all operations on the same key
export const PAGE_SIZE = newRow<number>(StorageKey.PAGE_SIZE);
