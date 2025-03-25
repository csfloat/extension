import {ItemInfo} from './fetch_inspect_info';
import {SimpleHandler} from './main';
import {RequestType} from './types';

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
        }
    }
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
            const url = chrome.runtime.getURL('data/bluegem.json');
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

        const defIndex = itemInfo.defindex;
        const paintIndex = itemInfo.paintindex;
        const paintSeed = itemInfo.paintseed;

        // Be careful to check if the type exists
        const patternData = bluegemCache[paintIndex]?.[defIndex]?.[paintSeed];
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
