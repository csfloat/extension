import {environment} from '../../environment';

const THRESHOLDS_URL = `${environment.floatdb_gateway_url}/v1/ranks/thresholds/bin`;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

interface ThresholdEntry {
    low: number;
    high: number;
}

function makeKey(defindex: number, paintindex: number, stattrak: boolean, souvenir: boolean): string {
    return `${defindex}:${paintindex}:${stattrak ? 1 : 0}:${souvenir ? 1 : 0}`;
}

/**
 * Binary wire format (little-endian):
 *   Header (4 bytes): version(u8), entry_size(u8), count(u16)
 *   Per entry (13 bytes): defindex(u16), paintindex(u16), flags(u8), low(f32), high(f32)
 */
function parseThresholdsBinary(buffer: ArrayBuffer): Map<string, ThresholdEntry> {
    const view = new DataView(buffer);
    const entrySize = view.getUint8(1);
    const count = view.getUint16(2, true);
    const headerSize = 4;

    const map = new Map<string, ThresholdEntry>();

    for (let i = 0; i < count; i++) {
        const off = headerSize + i * entrySize;
        const defindex = view.getUint16(off, true);
        const paintindex = view.getUint16(off + 2, true);
        const flags = view.getUint8(off + 4);
        const stattrak = (flags & 1) !== 0;
        const souvenir = (flags & 2) !== 0;
        const low = view.getFloat32(off + 5, true);
        const high = view.getFloat32(off + 9, true);

        map.set(makeKey(defindex, paintindex, stattrak, souvenir), {low, high});
    }

    return map;
}

class ThresholdFetcher {
    private thresholds: Map<string, ThresholdEntry> | null = null;
    private lastFetched = 0;
    private pendingFetch?: Promise<Map<string, ThresholdEntry>>;

    async qualifiesForRankCheck(
        defindex: number,
        paintindex: number,
        stattrak: boolean,
        souvenir: boolean,
        floatvalue: number
    ): Promise<boolean> {
        const thresholds = await this.getThresholds();
        const entry = thresholds.get(makeKey(defindex, paintindex, stattrak, souvenir));
        if (!entry) return false;
        return floatvalue <= entry.low || floatvalue >= entry.high;
    }

    private async getThresholds(): Promise<Map<string, ThresholdEntry>> {
        if (this.thresholds && Date.now() - this.lastFetched < CACHE_DURATION_MS) {
            return this.thresholds;
        }

        if (this.pendingFetch) {
            return this.pendingFetch;
        }

        const fetchPromise = this.fetchThresholds();
        this.pendingFetch = fetchPromise;

        try {
            return await fetchPromise;
        } finally {
            if (this.pendingFetch === fetchPromise) {
                this.pendingFetch = undefined;
            }
        }
    }

    private async fetchThresholds(): Promise<Map<string, ThresholdEntry>> {
        try {
            const resp = await fetch(THRESHOLDS_URL);
            if (!resp.ok) {
                throw new Error(`Thresholds request failed with status ${resp.status}`);
            }

            const buffer = await resp.arrayBuffer();
            const parsed = parseThresholdsBinary(buffer);

            this.thresholds = parsed;
            this.lastFetched = Date.now();

            return parsed;
        } catch (error) {
            if (this.thresholds) {
                console.error('Error fetching thresholds, using cached:', error);
                return this.thresholds;
            }
            throw error;
        }
    }
}

export const gThresholdFetcher = new ThresholdFetcher();
