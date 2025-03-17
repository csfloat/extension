import {SimpleHandler} from './main';
import {RequestType} from './types';

export interface BluegemPatternData {
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

export interface FetchBluegemRequest {
    type: string;
    paintseed: number;
}

const bluegemCache: Record<string, Record<number, BluegemPatternData | undefined>> = {};

export const FetchBluegem = new SimpleHandler<FetchBluegemRequest, BluegemPatternData | undefined>(
    RequestType.FETCH_BLUEGEM,
    async (req) => {
        if (Object.keys(bluegemCache).length === 0) {
            const url = chrome.runtime.getURL(`data/bluegem.json`);
            try {
                const resp = await fetch(url);
                const json = await resp.json();
                if (!json) {
                    throw Error('Failed to fetch bluegem data');
                }
                Object.assign(bluegemCache, json);
            } catch (e) {
                console.error('Failed to fetch bluegem data', e);
                return undefined;
            }
        }

        return bluegemCache[req.type]?.[req.paintseed];
    }
);
