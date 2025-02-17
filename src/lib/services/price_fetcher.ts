import {environment} from '../../environment';
import {gStore} from '../storage/store';
import {PRICE_CACHE} from '../storage/keys';

const DEFAULT_CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours

interface PriceListResponse {
    market_hash_name: string;
    min_price: number;
}

interface DopplerPriceListResponse {
    market_hash_name: string;
    paint_index: number;
    min_price: number;
}

interface PriceCache {
    timestamp: number;
    prices: Record<string, number>;
    dopplerPrices: Record<string, Record<number, number>>;
}

class PriceFetcher {
    async fetch(market_hash_name: string, paintIndex?: number): Promise<number> {
        const {prices, dopplerPrices} = await this.getValidPrices();

        // If it's a Doppler and we have a paint index, use the Doppler price
        if (paintIndex !== undefined) {
            const dopplerPrice = dopplerPrices[market_hash_name]?.[paintIndex];
            if (dopplerPrice) {
                return dopplerPrice;
            }
        }

        return prices[market_hash_name] || 0;
    }

    private async getValidPrices(): Promise<{
        prices: Record<string, number>;
        dopplerPrices: Record<string, Record<number, number>>;
    }> {
        const now = Date.now();

        // Try loading from storage first
        const storedCache = await gStore.getWithStorage<PriceCache>(chrome.storage.local, PRICE_CACHE.key);
        if (storedCache && now - storedCache.timestamp < DEFAULT_CACHE_DURATION) {
            return {
                prices: storedCache.prices,
                dopplerPrices: storedCache.dopplerPrices || {},
            };
        }

        try {
            // Fetch both regular and Doppler prices
            const [regularResponse, dopplerResponse] = await Promise.all([
                fetch(`${environment.csfloat_base_api_url}/v1/listings/price-list`, {
                    credentials: 'include',
                }),
                fetch(`${environment.csfloat_base_api_url}/v1/listings/price-list/doppler`, {
                    credentials: 'include',
                }),
            ]);

            if (!regularResponse.ok || !dopplerResponse.ok) {
                throw new Error(`Failed to fetch prices: ${regularResponse.status}, ${dopplerResponse.status}`);
            }

            const regularData = (await regularResponse.json()) as PriceListResponse[];
            const dopplerData = (await dopplerResponse.json()).data as DopplerPriceListResponse[];

            // Build new cache
            const prices: Record<string, number> = {};
            const dopplerPrices: Record<string, Record<number, number>> = {};

            for (const item of regularData) {
                prices[item.market_hash_name] = item.min_price;
            }

            for (const item of dopplerData) {
                if (!dopplerPrices[item.market_hash_name]) {
                    dopplerPrices[item.market_hash_name] = {};
                }
                dopplerPrices[item.market_hash_name][item.paint_index] = item.min_price;
            }

            await gStore.setWithStorage(chrome.storage.local, PRICE_CACHE.key, {
                timestamp: now,
                prices,
                dopplerPrices,
            });

            return {prices, dopplerPrices};
        } catch (error) {
            // On error, return existing cache regardless of age, or empty objects if no cache exists
            return {
                prices: storedCache?.prices || {},
                dopplerPrices: storedCache?.dopplerPrices || {},
            };
        }
    }
}

export const gPriceFetcher = new PriceFetcher();
