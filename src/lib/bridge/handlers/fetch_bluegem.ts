import {ItemInfo} from './fetch_inspect_info';
import {SimpleHandler} from './main';
import {RequestType} from './types';
import { ungzip } from 'pako';

interface BluegemPatternData {
    playside_blue: number;
    playside_purple?: number;
    playside_gold?: number;
    backside_blue?: number;
    backside_purple?: number;
    backside_gold?: number;
    playside_contour_blue?: number;
    playside_contour_purple?: number;
    backside_contour_blue?: number;
    backside_contour_purple?: number;
}

interface FetchBluegemRequest {
    iteminfo: ItemInfo;
}

interface BluegemDataCache {
    [defindex: number]: {
        [paintindex: number]: {
            [paintseed: number]: BluegemPatternData | undefined;
        };
    };
}
export type FetchBluegemResponse = BluegemPatternData & {placement: string};

const bluegemCache: BluegemDataCache = {};

export const FetchBluegem = new SimpleHandler<FetchBluegemRequest, FetchBluegemResponse | undefined>(
    RequestType.FETCH_BLUEGEM,
    async (req) => {
        const itemInfo = req.iteminfo;
        if (!itemInfo.weapon_type) {
            return undefined;
        }

        if (Object.keys(bluegemCache).length === 0) {
            // Fetch the compressed data
            const url = chrome.runtime.getURL('data/bluegem.json.gz');
            try {
                const resp = await fetch(url);
                if (!resp.ok) {
                    throw new Error(`Failed to fetch bluegem data: ${resp.statusText}`);
                }
                
                // Get the response as ArrayBuffer
                const compressedData = await resp.arrayBuffer();
                // Decompress the data using pako
                const decompressedData = ungzip(new Uint8Array(compressedData));
                // Parse the JSON from the decompressed buffer using TextDecoder
                const jsonString = new TextDecoder('utf-8').decode(decompressedData);
                const json = JSON.parse(jsonString);
                if (!json) {
                    throw Error('Failed to parse bluegem data');
                }
                Object.assign(bluegemCache, json);
            } catch (e) {
                console.error('Failed to fetch and process bluegem data', e);
                return undefined;
            }
        }

        const defIndex = itemInfo.defindex;
        const paintIndex = itemInfo.paintindex;
        const paintSeed = itemInfo.paintseed;

        // Be careful to check if the type exists
        const patternData = bluegemCache[defIndex]?.[paintIndex]?.[paintSeed];
        if (!patternData) {
            return undefined;
        }

        // AK-47 skins are mirrored, hence we use different positions
        const placement = defIndex === 7 ? 'Top / Magazine' : 'Front / Back';

        return {
            placement,
            ...patternData,
        };
    }
);
