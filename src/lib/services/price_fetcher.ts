import {environment} from '../../environment';
import {gStore} from '../storage/store';
import {PRICE_CACHE} from '../storage/keys';
import {CSFError, CSFErrorCode} from '../utils/errors';

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
    lastUpdated: number;
    prices: Record<string, number>;
    dopplerPrices: Record<string, Record<number, number>>;
}

class PriceFetcher {
    async fetch(marketHashName: string, paintIndex?: number): Promise<number> {
        const {prices, dopplerPrices} = await this.getValidPrices();

        // If it's a Doppler and we have a paint index, use the Doppler price
        if (paintIndex !== undefined) {
            const dopplerPrice = dopplerPrices[marketHashName]?.[paintIndex];
            if (dopplerPrice) {
                return dopplerPrice;
            }
        }

        return prices[marketHashName] || 0;
    }

    private async getValidPrices(): Promise<{
        prices: Record<string, number>;
        dopplerPrices: Record<string, Record<number, number>>;
    }> {
        const now = Date.now();

        // Try loading from storage first
        const storedCache = await gStore.getWithStorage<PriceCache>(chrome.storage.local, PRICE_CACHE.key);
        if (storedCache && now - storedCache.lastUpdated < DEFAULT_CACHE_DURATION) {
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
                console.error(`Failed to fetch prices: ${regularResponse.status}, ${dopplerResponse.status}`);
                throw new CSFError(
                    regularResponse.status === 401 ? CSFErrorCode.NOT_AUTHENTICATED : CSFErrorCode.FAILED_TO_FETCH
                );
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
                lastUpdated: now,
                prices,
                dopplerPrices,
            });

            return {prices, dopplerPrices};
        } catch (error) {
            // Log the specific error for debugging
            console.error('Error in price fetcher:', error);

            // If we have no stored cache, bubble up the error
            if (!storedCache) {
                if (error instanceof CSFError) {
                    // Pass through existing CSFError with the same code
                    throw error;
                } else if (error instanceof Error) {
                    // Convert regular Error to CSFError with original message
                    throw new CSFError(CSFErrorCode.FAILED_TO_FETCH, `Failed to fetch prices: ${error.message}`);
                } else {
                    // Handle unknown error types
                    throw new CSFError(CSFErrorCode.FAILED_TO_FETCH);
                }
            }

            // With existing cache, return cache despite fetch error
            console.log('Using cached prices despite fetch error');
            return {
                prices: storedCache.prices || {},
                dopplerPrices: storedCache.dopplerPrices || {},
            };
        }
    }
}

export const gPriceFetcher = new PriceFetcher();
