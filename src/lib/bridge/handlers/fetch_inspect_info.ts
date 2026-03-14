import {decodeLink, CEconItemPreviewDataBlock} from '@csfloat/cs2-inspect-serializer';
import {SimpleHandler} from './main';
import {RequestType} from './types';

interface Sticker {
    slot: number;
    stickerId: number;
    codename?: string;
    material?: string;
    name?: string;
    wear?: number;
}

interface Keychain extends Sticker {
    pattern: number;
}

export interface ItemInfo {
    stickers: Sticker[];
    keychains: Keychain[];
    itemid: string;
    defindex: number;
    paintindex: number;
    rarity: number;
    quality: number;
    paintseed: number;
    inventory: number;
    origin: number;
    s: string;
    a: string;
    d: string;
    m: string;
    floatvalue: number;
    imageurl: string;
    min: number;
    max: number;
    weapon_type?: string;
    item_name?: string;
    rarity_name?: string;
    quality_name?: string;
    origin_name?: string;
    wear_name?: string;
    full_item_name?: string;
    low_rank?: number;
    high_rank?: number;
}

export interface FetchInspectInfoRequest {
    link: string;
    listPrice?: number;
    marketHashName?: string;
}

export interface FetchInspectInfoResponse {
    iteminfo: ItemInfo;
    error?: string;
}

export const FetchInspectInfo = new SimpleHandler<FetchInspectInfoRequest, FetchInspectInfoResponse>(
    RequestType.FETCH_INSPECT_INFO,
    async (req) => {
        const itemMetadata = parseMarketHashName(req.marketHashName);
        let decoded: CEconItemPreviewDataBlock;
        try {
            decoded = decodeLink(req.link);
        } catch (error) {
            throw new Error('Failed to decode inspect link');
        }

        return {
            iteminfo: {
                stickers: decoded.stickers.map((sticker) => ({
                    slot: sticker.slot ?? 0,
                    stickerId: sticker.stickerId ?? 0,
                    wear: sticker.wear,
                })),
                keychains: decoded.keychains.map((keychain) => ({
                    slot: keychain.slot ?? 0,
                    stickerId: keychain.stickerId ?? 0,
                    wear: keychain.wear,
                    pattern: keychain.pattern ?? 0,
                })),
                itemid: decoded.itemid?.toString() ?? '',
                defindex: decoded.defindex ?? 0,
                paintindex: decoded.paintindex ?? 0,
                rarity: decoded.rarity ?? 0,
                quality: decoded.quality ?? 0,
                paintseed: decoded.paintseed ?? 0,
                inventory: decoded.inventory ?? 0,
                origin: decoded.origin ?? 0,
                s: '',
                a: '',
                d: '',
                m: '',
                floatvalue: decoded.paintwear ?? 0,
                imageurl: '',
                min: 0,
                max: 1,
                weapon_type: itemMetadata?.weaponType,
                item_name: itemMetadata?.itemName,
                wear_name: itemMetadata?.wearName,
                full_item_name: req.marketHashName,
            },
        };
    }
);

interface ParsedMarketHashName {
    weaponType?: string;
    itemName?: string;
    wearName?: string;
}

function parseMarketHashName(marketHashName?: string): ParsedMarketHashName | undefined {
    if (!marketHashName) {
        return;
    }

    const match = /^(.*?) \| (.*?)(?: \(([^)]+)\))?$/.exec(marketHashName);
    if (!match) {
        return;
    }

    const [, weaponType, itemName, wearName] = match;
    return {
        weaponType,
        itemName,
        wearName,
    };
}
