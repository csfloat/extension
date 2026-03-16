export namespace ItemSchema {
    export type Response = {
        weapons: Record<string, RawWeapon>;
        stickers: Record<string, {market_hash_name: string; is_patch?: boolean}>;
        containers: Record<string, {market_hash_name: string; highlight_market_hash_name?: string}>;
        agents: Record<
            string,
            {image: string; market_hash_name: string; price: number; rarity: number; faction?: Faction}
        >;
        keychains: Record<string, {market_hash_name: string}>;
        highlight_reels: Record<string, {keychain_index: number; market_hash_name: string; name: string}>;
        collectibles: Record<string, {image: string; market_hash_name: string; price: number; rarity: number}>;
        music_kits: Record<
            string,
            {image: string; market_hash_name: string; rarity: number; normal_price?: number; stattrak_price?: number}
        >;
        rarities: Array<{key: string; name: string; value: number}>;
    };

    export type RawWeapon = {
        name: string;
        paints: Record<string, RawPaint>;
        sticker_amount: number;
        type: string;
    };

    export type RawPaint = {
        name: string;
        max: number;
        min: number;
        paintIndex?: number;
        rarity?: number;
        image?: string;
        collections?: string[];
        stattrak?: boolean;
        souvenir?: boolean;
        normal_prices?: number[];
        stattrak_prices?: number[];
    };

    export type Faction = 'ct' | 't';
}
