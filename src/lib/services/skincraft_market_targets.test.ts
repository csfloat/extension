// @vitest-environment happy-dom
import {describe, expect, it} from 'vitest';
import type {ItemInfo} from '../bridge/handlers/fetch_inspect_info';
import type {MarketListing} from '../components/market/react/types';
import {formatFloatWithRank, formatSeed} from '../utils/skin';
import {STEAM_ECONOMY_IMAGE_PREFIX} from '../utils/steam_images';
import {toSkinCraftListingItem} from './skincraft_market_targets';
import {isOpenSkinCraftViewerMessage, SKINCRAFT_VIEWER_MESSAGE_SOURCE} from './skincraft_viewer_protocol';

const MASKED_LINK = 'steam://run/730//+csgo_econ_action_preview%20%propid:6%';

function createListing(overrides: {description?: object; asset?: object} = {}): MarketListing {
    return {
        listingid: '556910233323745386',
        asset: {
            assetid: '53323033442',
            asset_properties: [
                {propertyid: 2, float_value: 0.529},
                {propertyid: 6, string_value: 'a'.repeat(80)},
            ],
            ...overrides.asset,
        },
        description: {
            appid: 730,
            market_hash_name: 'AK-47 | Redline (Battle-Scarred)',
            type: 'Classified Rifle',
            name_color: 'd32ce6',
            background_color: '3d293f',
            icon_url: 'icon-path',
            tags: [],
            actions: [{name: 'Inspect in Game...', link: MASKED_LINK}],
            ...overrides.description,
        },
    } as unknown as MarketListing;
}

describe('SkinCraft market targets', () => {
    it('maps a beta listing, treating its empty tags as absent when deciding renderability', () => {
        expect(toSkinCraftListingItem(createListing())).toEqual({
            inspect: 'a'.repeat(80),
            inspectUrl: `steam://run/730//+csgo_econ_action_preview%20${'a'.repeat(80)}`,
            name: 'AK-47 | Redline (Battle-Scarred)',
            iconUrl: `${STEAM_ECONOMY_IMAGE_PREFIX}icon-path/330x192`,
            assetId: '53323033442',
            seed: undefined,
            float: undefined,
            rarityColor: 'd32ce6',
            backgroundColor: '3d293f',
            details: {
                listingId: '556910233323745386',
                game: 'Counter-Strike 2',
                type: 'Classified Rifle',
                wearRating: '0.52900000',
            },
        });
    });

    it("mirrors Steam's item dialog details for the panel", () => {
        const listing = {
            ...createListing({
                asset: {
                    assetid: '53323033442',
                    asset_properties: [
                        {propertyid: 1, int_value: '515'},
                        {propertyid: 2, float_value: 0.5291814804077148},
                        {propertyid: 5, string_value: 'AK-47| Nerfed'},
                        {propertyid: 6, string_value: 'a'.repeat(80)},
                    ],
                },
                description: {
                    market_tradable_restriction: 7,
                    market_marketable_restriction: 7,
                    descriptions: [
                        {type: 'html', value: 'Exterior: Battle-Scarred', name: 'exterior_wear'},
                        {type: 'html', value: ' ', name: 'blank'},
                        {
                            type: 'html',
                            value: 'Powerful and reliable.\n\n<i>Never be afraid</i><br>High risk &amp; high reward',
                            name: 'description',
                        },
                        {type: 'html', value: 'The Phoenix Collection', color: '9da1a9', name: 'itemset_name'},
                    ],
                },
            }),
            strSubtotal: '$35.20',
        } as MarketListing;

        expect(toSkinCraftListingItem(listing)?.details).toEqual({
            listingId: '556910233323745386',
            game: 'Counter-Strike 2',
            type: 'Classified Rifle',
            nameTag: 'AK-47| Nerfed',
            patternTemplate: '515',
            wearRating: '0.52918148',
            price: '$35.20',
            tradeRestrictionDays: 7,
            marketRestrictionDays: 7,
            lines: [
                {text: 'Exterior: Battle-Scarred', italic: undefined, color: undefined},
                {text: 'Powerful and reliable.', italic: undefined, color: undefined},
                {text: 'Never be afraid', italic: true, color: undefined},
                {text: 'High risk & high reward', italic: undefined, color: undefined},
                {text: 'The Phoenix Collection', italic: undefined, color: '9da1a9'},
            ],
        });
    });

    it("maps applied accessories with Steam's own attribute lines, keeping their markup out of the text lines", () => {
        const accessory = (description: object, parentProperties: object[] = []) => ({
            classid: '7104637288',
            standalone_properties: [],
            parent_relationship_properties: parentProperties,
            nested_accessories: [],
            description,
        });
        const listing = createListing({
            asset: {
                assetid: '53323033442',
                asset_properties: [{propertyid: 6, string_value: 'a'.repeat(80)}],
                asset_accessories: [
                    accessory(
                        {market_hash_name: 'Sticker | NRG | Austin 2025', type: 'High Grade Sticker', icon_url: 'nrg'},
                        [{propertyid: 4, float_value: 0.6800000071525574}]
                    ),
                    accessory({
                        market_hash_name: 'Sticker | OG | Austin 2025',
                        type: 'High Grade Sticker',
                        icon_url: 'og',
                    }),
                    accessory(
                        {market_hash_name: 'Charm | Baby Karat T', type: 'Extraordinary Charm', icon_url: 'charm'},
                        [{propertyid: 3, int_value: '88143'}]
                    ),
                ],
            },
            description: {
                descriptions: [
                    {type: 'html', value: '<div class="sticker_info"><img src="x"></div>', name: 'sticker_info'},
                    {type: 'html', value: 'The Phoenix Collection', name: 'itemset_name'},
                ],
            },
        });
        const details = toSkinCraftListingItem(listing)?.details;

        expect(details?.accessories).toEqual([
            {
                name: 'Sticker | NRG | Austin 2025',
                iconUrl: `${STEAM_ECONOMY_IMAGE_PREFIX}nrg/330x192`,
                detail: 'Sticker Scrape Level: 0.680000007',
            },
            {
                name: 'Sticker | OG | Austin 2025',
                iconUrl: `${STEAM_ECONOMY_IMAGE_PREFIX}og/330x192`,
                detail: 'Sticker Scrape Level: 0',
            },
            {
                name: 'Charm | Baby Karat T',
                iconUrl: `${STEAM_ECONOMY_IMAGE_PREFIX}charm/330x192`,
                detail: 'Charm Template: 88143',
            },
        ]);
        expect(details?.lines).toEqual([{text: 'The Phoenix Collection', italic: undefined, color: undefined}]);
    });

    it('accepts non-skin renderable types by their type string', () => {
        const listing = createListing({
            description: {market_hash_name: 'Sticker | Crown (Foil)', type: 'High Grade Sticker'},
        });

        expect(toSkinCraftListingItem(listing)?.inspect).toBe('a'.repeat(80));
    });

    it('rejects item types SkinCraft cannot render', () => {
        const listing = createListing({
            description: {market_hash_name: 'Dreams & Nightmares Case', type: 'Base Grade Container'},
        });

        expect(toSkinCraftListingItem(listing)).toBeUndefined();
    });

    it('requires the masked inspect hex', () => {
        const listing = createListing({asset: {asset_properties: [{propertyid: 2, float_value: 0.529}]}});

        expect(toSkinCraftListingItem(listing)).toBeUndefined();
    });

    it('prefers a rarity colour resolved from tags over the name colour', () => {
        const listing = createListing({
            description: {
                tags: [
                    {category: 'Weapon', internal_name: 'weapon_ak47'},
                    {category: 'Rarity', internal_name: 'Rarity_Ancient_Weapon', color: 'eb4b4b'},
                ],
            },
        });

        expect(toSkinCraftListingItem(listing)?.rarityColor).toBe('eb4b4b');
    });

    it('formats float and seed from cached item info', () => {
        const itemInfo = {floatvalue: 0.5291814804077148, paintseed: 515, paintindex: 316} as unknown as ItemInfo;
        const target = toSkinCraftListingItem(createListing(), () => itemInfo);

        expect(target?.float).toBe(formatFloatWithRank(itemInfo, 6));
        expect(target?.seed).toBe(formatSeed(itemInfo));
    });

    it('drops non-hex text colours instead of forwarding them', () => {
        const listing = createListing({
            description: {
                name_color: 'red',
                descriptions: [{type: 'html', value: 'The Phoenix Collection', color: '#9da1a9', name: 'itemset_name'}],
            },
        });
        const target = toSkinCraftListingItem(listing);

        expect(target?.rarityColor).toBeUndefined();
        expect(target?.details?.lines).toEqual([{text: 'The Phoenix Collection', italic: undefined, color: undefined}]);
    });

    it('produces targets the viewer protocol accepts', () => {
        const target = toSkinCraftListingItem(createListing());

        expect(
            isOpenSkinCraftViewerMessage({
                source: SKINCRAFT_VIEWER_MESSAGE_SOURCE,
                type: 'open',
                target,
                inventory: [target],
            })
        ).toBe(true);
    });
});
