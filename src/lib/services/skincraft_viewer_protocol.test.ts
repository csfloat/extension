import {describe, expect, it} from 'vitest';
import {
    isBuySkinCraftListingMessage,
    isOpenSkinCraftViewerMessage,
    isRequestSkinCraftViewerItemsMessage,
    isSkinCraftBuyListingResultMessage,
    isSkinCraftViewerItemsMessage,
    MAX_SKINCRAFT_INVENTORY_TARGETS,
    SKINCRAFT_VIEWER_MESSAGE_SOURCE,
} from './skincraft_viewer_protocol';
import type {SkinCraftItem} from './skincraft_viewer_protocol';

const target: SkinCraftItem = {
    inspect: 'a'.repeat(80),
    inspectUrl: `steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20${'a'.repeat(80)}`,
    name: 'AK-47 | Redline',
    iconUrl: 'https://community.akamai.steamstatic.com/economy/image/example/330x192',
    assetId: '12345678901234567890',
    seed: '977',
    float: '0.295375',
    rarityColor: '8847ff',
    backgroundColor: '20242d',
};

describe('SkinCraft viewer open messages', () => {
    it('accepts a bounded inventory snapshot of valid targets', () => {
        expect(
            isOpenSkinCraftViewerMessage({
                source: SKINCRAFT_VIEWER_MESSAGE_SOURCE,
                type: 'open',
                target,
                inventory: [target],
            })
        ).toBe(true);
        expect(
            isOpenSkinCraftViewerMessage({
                source: SKINCRAFT_VIEWER_MESSAGE_SOURCE,
                type: 'open',
                target: {...target, inspectUrl: undefined},
                inventory: [],
            })
        ).toBe(true);
    });

    it('rejects malformed targets and unexpected image origins', () => {
        expect(
            isOpenSkinCraftViewerMessage({
                source: SKINCRAFT_VIEWER_MESSAGE_SOURCE,
                type: 'open',
                target: {...target, inspect: 'not-an-inspect'},
                inventory: [],
            })
        ).toBe(false);
        expect(
            isOpenSkinCraftViewerMessage({
                source: SKINCRAFT_VIEWER_MESSAGE_SOURCE,
                type: 'open',
                target,
                inventory: [{...target, iconUrl: 'https://example.com/item.png'}],
            })
        ).toBe(false);
        expect(
            isOpenSkinCraftViewerMessage({
                source: SKINCRAFT_VIEWER_MESSAGE_SOURCE,
                type: 'open',
                target,
                inventory: [{...target, rarityColor: 'not-a-color'}],
            })
        ).toBe(false);
        expect(
            isOpenSkinCraftViewerMessage({
                source: SKINCRAFT_VIEWER_MESSAGE_SOURCE,
                type: 'open',
                target: {...target, inspectUrl: 'https://example.com/inspect'},
                inventory: [],
            })
        ).toBe(false);
        expect(
            isOpenSkinCraftViewerMessage({
                source: SKINCRAFT_VIEWER_MESSAGE_SOURCE,
                type: 'open',
                target: {...target, inspectUrl: 'steam://uninstall/730'},
                inventory: [],
            })
        ).toBe(false);
    });

    it('rejects oversized inventory snapshots', () => {
        expect(
            isOpenSkinCraftViewerMessage({
                source: SKINCRAFT_VIEWER_MESSAGE_SOURCE,
                type: 'open',
                target,
                inventory: Array.from({length: MAX_SKINCRAFT_INVENTORY_TARGETS + 1}, () => target),
            })
        ).toBe(false);
    });
});

describe('SkinCraft viewer listing details', () => {
    const details = {
        listingId: '556910233323745386',
        game: 'Counter-Strike 2',
        type: 'Classified Rifle',
        nameTag: 'AK-47| Nerfed',
        patternTemplate: '515',
        wearRating: '0.52918148',
        price: '$35.20',
        tradeRestrictionDays: 7,
        marketRestrictionDays: 7,
        accessories: [
            {
                name: 'Sticker | dupreeh | Katowice 2019',
                iconUrl: 'https://community.akamai.steamstatic.com/economy/image/dupreeh/330x192',
                detail: 'Sticker Scrape Level: 0.680000007',
            },
        ],
        lines: [{text: 'Exterior: Battle-Scarred'}, {text: 'Never be afraid', italic: true, color: '9da1a9'}],
    };

    it('accepts a target carrying well-formed details', () => {
        expect(
            isOpenSkinCraftViewerMessage({
                source: SKINCRAFT_VIEWER_MESSAGE_SOURCE,
                type: 'open',
                target: {...target, details},
                inventory: [],
            })
        ).toBe(true);
    });

    it.each([
        ['a malformed line colour', {...details, lines: [{text: 'x', color: 'red'}]}],
        [
            'an accessory icon from an untrusted origin',
            {...details, accessories: [{name: 'Sticker | X', iconUrl: 'https://evil.example/x.png'}]},
        ],
    ])('rejects details with %s', (_label, malformed) => {
        expect(
            isOpenSkinCraftViewerMessage({
                source: SKINCRAFT_VIEWER_MESSAGE_SOURCE,
                type: 'open',
                target: {...target, details: malformed},
                inventory: [],
            })
        ).toBe(false);
    });
});

describe('SkinCraft viewer buy messages', () => {
    it('accepts only well-formed listing ids from this protocol', () => {
        expect(
            isBuySkinCraftListingMessage({
                source: SKINCRAFT_VIEWER_MESSAGE_SOURCE,
                type: 'buy-listing',
                listingId: '556910233323745386',
            })
        ).toBe(true);
        expect(
            isBuySkinCraftListingMessage({
                source: SKINCRAFT_VIEWER_MESSAGE_SOURCE,
                type: 'buy-listing',
                listingId: 'javascript:alert(1)',
            })
        ).toBe(false);
        expect(isBuySkinCraftListingMessage({source: 'other', type: 'buy-listing', listingId: '1'})).toBe(false);
    });

    it('holds buy results to the same listing id and source rules', () => {
        expect(
            isSkinCraftBuyListingResultMessage({
                source: SKINCRAFT_VIEWER_MESSAGE_SOURCE,
                type: 'buy-result',
                listingId: '556910233323745386',
                success: false,
            })
        ).toBe(true);
        expect(
            isSkinCraftBuyListingResultMessage({
                source: SKINCRAFT_VIEWER_MESSAGE_SOURCE,
                type: 'buy-result',
                listingId: 'javascript:alert(1)',
                success: true,
            })
        ).toBe(false);
        expect(
            isSkinCraftBuyListingResultMessage({
                source: SKINCRAFT_VIEWER_MESSAGE_SOURCE,
                type: 'buy-result',
                listingId: '1',
                success: 'yes',
            })
        ).toBe(false);
    });
});

describe('SkinCraft viewer items messages', () => {
    it('accepts a request for more items only from this protocol, carrying a request id', () => {
        const request = {source: SKINCRAFT_VIEWER_MESSAGE_SOURCE, type: 'request-items', requestId: 1};
        expect(isRequestSkinCraftViewerItemsMessage(request)).toBe(true);
        expect(isRequestSkinCraftViewerItemsMessage({...request, source: 'other'})).toBe(false);
        expect(isRequestSkinCraftViewerItemsMessage({...request, type: 'items'})).toBe(false);
        expect(isRequestSkinCraftViewerItemsMessage({...request, requestId: undefined})).toBe(false);
        expect(isRequestSkinCraftViewerItemsMessage({...request, requestId: '1'})).toBe(false);
        expect(isRequestSkinCraftViewerItemsMessage({...request, requestId: -1})).toBe(false);
        expect(isRequestSkinCraftViewerItemsMessage({...request, requestId: 1.5})).toBe(false);
    });

    it('holds item updates to the same target validation as open messages', () => {
        const update = {source: SKINCRAFT_VIEWER_MESSAGE_SOURCE, type: 'items', requestId: 1, inventory: [target]};
        expect(isSkinCraftViewerItemsMessage(update)).toBe(true);
        expect(isSkinCraftViewerItemsMessage({...update, requestId: undefined})).toBe(false);
        expect(isSkinCraftViewerItemsMessage({...update, inventory: [{...target, inspect: 'not-an-inspect'}]})).toBe(
            false
        );
        expect(
            isSkinCraftViewerItemsMessage({
                ...update,
                inventory: Array.from({length: MAX_SKINCRAFT_INVENTORY_TARGETS + 1}, () => target),
            })
        ).toBe(false);
    });
});
