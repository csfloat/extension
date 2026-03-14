import {gStore} from '../storage/store';
import {SCHEMA_CACHE} from '../storage/keys';
import type {ItemSchema} from '../types/schema';
import {environment} from '../../environment';

const SCHEMA_URL = `${environment.csfloat_base_api_url}/v1/schema`;
const DEFAULT_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export interface SchemaFloatRange {
    min: number;
    max: number;
}

interface SchemaCache {
    lastUpdated: number;
    schema: ItemSchema.Response;
}

class SchemaFetcher {
    private pendingSchemaFetch?: Promise<ItemSchema.Response>;

    async getSchema(): Promise<ItemSchema.Response> {
        return this.getValidSchema();
    }

    private async getValidSchema(): Promise<ItemSchema.Response> {
        const now = Date.now();
        const storedCache = await gStore.getWithStorage<SchemaCache>(chrome.storage.local, SCHEMA_CACHE.key);

        if (storedCache?.schema && now - storedCache.lastUpdated < DEFAULT_CACHE_DURATION) {
            return storedCache.schema;
        }

        if (this.pendingSchemaFetch) {
            return this.pendingSchemaFetch;
        }

        const schemaFetch = this.fetchAndCacheSchema(now, storedCache);
        this.pendingSchemaFetch = schemaFetch;

        try {
            return await schemaFetch;
        } finally {
            if (this.pendingSchemaFetch === schemaFetch) {
                this.pendingSchemaFetch = undefined;
            }
        }
    }

    private async fetchAndCacheSchema(now: number, storedCache: SchemaCache | null): Promise<ItemSchema.Response> {
        try {
            const response = await fetch(SCHEMA_URL);
            if (!response.ok) {
                throw new Error(`Schema request failed with status ${response.status}`);
            }

            const schema = (await response.json()) as ItemSchema.Response;

            await gStore.setWithStorage(chrome.storage.local, SCHEMA_CACHE.key, {
                lastUpdated: now,
                schema,
            });

            return schema;
        } catch (error) {
            console.error('Error in schema fetcher:', error);

            if (storedCache?.schema) {
                console.log('Using cached schema despite fetch error');
                return storedCache.schema;
            }

            throw error;
        }
    }
}

export const gSchemaFetcher = new SchemaFetcher();
