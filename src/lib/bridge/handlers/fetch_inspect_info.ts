import {decodeLink, CEconItemPreviewDataBlock} from '@csfloat/cs2-inspect-serializer';
import {SimpleHandler} from './main';
import {RequestType} from './types';
import {gSchemaFetcher} from '../../services/schema_fetcher';
import type {ItemSchema} from '../../types/schema';

interface Sticker {
    slot: number;
    stickerId: number;
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
    floatvalue: number;
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
}

export interface FetchInspectInfoResponse {
    iteminfo: ItemInfo;
    error?: string;
}

export const FetchInspectInfo = new SimpleHandler<FetchInspectInfoRequest, FetchInspectInfoResponse>(
    RequestType.FETCH_INSPECT_INFO,
    async (req) => {
        let decoded: CEconItemPreviewDataBlock;
        try {
            decoded = decodeLink(req.link);
        } catch (error) {
            throw new Error('Failed to decode inspect link');
        }

        const defindex = decoded.defindex ?? 0;
        const paintindex = decoded.paintindex ?? 0;
        const floatvalue = decoded.paintwear ?? 0;

        let min = 0;
        let max = 1;
        let weaponType: string | undefined;
        let itemName: string | undefined;
        let rarityName: string | undefined;
        let stickers: Sticker[] = [];
        let keychains: Keychain[] = [];

        try {
            const schema = await gSchemaFetcher.getSchema();
            const weapon = schema.weapons[defindex];
            const paint = getSchemaPaint(weapon, paintindex);

            weaponType = weapon?.name;
            rarityName = schema.rarities.find((rarity) => rarity.value === (paint?.rarity ?? decoded.rarity))?.name;

            if (paint) {
                itemName = paint.name;
                min = paint.min;
                max = paint.max;
            }

            stickers = decoded.stickers.map((sticker) => {
                const schemaSticker = schema.stickers[sticker.stickerId?.toString() ?? ''];
                return {
                    slot: sticker.slot ?? 0,
                    stickerId: sticker.stickerId ?? 0,
                    wear: sticker.wear,
                    name: schemaSticker?.market_hash_name,
                };
            });

            keychains = decoded.keychains.map((keychain) => {
                const schemaKeychain = schema.keychains[keychain.stickerId?.toString() ?? ''];
                return {
                    slot: keychain.slot ?? 0,
                    stickerId: keychain.stickerId ?? 0,
                    wear: keychain.wear,
                    pattern: keychain.pattern ?? 0,
                    name: schemaKeychain?.market_hash_name,
                };
            });
        } catch (error) {
            console.error('Failed to fetch schema item metadata:', error);
        }

        return {
            iteminfo: {
                stickers,
                keychains,
                itemid: decoded.itemid?.toString() ?? '',
                defindex,
                paintindex,
                rarity: decoded.rarity ?? 0,
                quality: decoded.quality ?? 0,
                paintseed: decoded.paintseed ?? 0,
                inventory: decoded.inventory ?? 0,
                origin: decoded.origin ?? 0,
                floatvalue,
                min,
                max,
                weapon_type: weaponType,
                item_name: itemName,
                rarity_name: rarityName,
                wear_name: getWearName(floatvalue),
            },
        };
    }
);

function getSchemaPaint(weapon: ItemSchema.RawWeapon | undefined, paintIndex: number): ItemSchema.RawPaint | undefined {
    if (!weapon) {
        return undefined;
    }

    if (weapon.paints[paintIndex] !== undefined) {
        return weapon.paints[paintIndex];
    }

    if (weapon.paints?.['0'] !== undefined) {
        return weapon.paints['0'];
    }

    const availablePaintIndexes = Object.keys(weapon.paints || {});
    if (availablePaintIndexes.length === 1) {
        return weapon.paints[availablePaintIndexes[0]];
    }
}

function getWearName(floatvalue: number): string | undefined {
    if (floatvalue <= 0.07) {
        return 'Factory New';
    }

    if (floatvalue <= 0.15) {
        return 'Minimal Wear';
    }

    if (floatvalue <= 0.38) {
        return 'Field-Tested';
    }

    if (floatvalue <= 0.45) {
        return 'Well-Worn';
    }

    if (floatvalue <= 1) {
        return 'Battle-Scarred';
    }
}
