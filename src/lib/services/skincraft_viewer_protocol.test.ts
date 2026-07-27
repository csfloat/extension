import {describe, expect, it} from 'vitest';
import {
    isOpenSkinCraftViewerMessage,
    MAX_SKINCRAFT_INVENTORY_TARGETS,
    SKINCRAFT_VIEWER_MESSAGE_SOURCE,
} from './skincraft_viewer_protocol';
import type {SkinCraftItem} from './skincraft_viewer_protocol';

const target: SkinCraftItem = {
    inspect: 'a'.repeat(80),
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
