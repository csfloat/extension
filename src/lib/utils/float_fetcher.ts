
interface Sticker {
    slot: number;
    stickerId: number;
    codename?: string;
    material?: string;
    name?: string;
}

interface ItemInfo {
    stickers: Sticker[];
    itemid: string;
    defindex: number;
    paintindex: number;
    rarity: number;
    quality: number;
    painseed: number;
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
}

class FloatFetcher {

}
