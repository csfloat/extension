import {describe, expect, it} from 'vitest';
import {isSkinCraftEmbedEvent, mergeSkinCraftProgress, normalizeSkinCraftProgress} from './skincraft_embed_protocol';

const envelope = {source: 'skincraft-embed', v: 1} as const;

describe('SkinCraft embed messages', () => {
    it('accepts supported messages with the expected envelope', () => {
        expect(isSkinCraftEmbedEvent({...envelope, type: 'ready'})).toBe(true);
        expect(isSkinCraftEmbedEvent({...envelope, type: 'progress', id: '1', percent: 25})).toBe(true);
        expect(isSkinCraftEmbedEvent({...envelope, type: 'loaded', id: '1'})).toBe(true);
        expect(
            isSkinCraftEmbedEvent({...envelope, type: 'error', id: '1', code: 'load-failed', message: 'Failed'})
        ).toBe(true);
        expect(isSkinCraftEmbedEvent({...envelope, type: 'inspect-requested'})).toBe(true);
        expect(isSkinCraftEmbedEvent({...envelope, type: 'key', key: 'ArrowRight'})).toBe(true);
    });

    it('rejects spoofed, malformed, and unknown messages', () => {
        expect(isSkinCraftEmbedEvent({source: 'other', v: 1, type: 'ready'})).toBe(false);
        expect(isSkinCraftEmbedEvent({source: 'skincraft-embed', v: 2, type: 'ready'})).toBe(false);
        expect(isSkinCraftEmbedEvent({...envelope, type: 'error', code: 'failed', message: 5})).toBe(false);
        expect(isSkinCraftEmbedEvent({...envelope, type: 'key'})).toBe(false);
        expect(isSkinCraftEmbedEvent({...envelope, type: 'future-event'})).toBe(false);
    });
});

describe('SkinCraft embed progress', () => {
    it('normalizes untrusted progress values', () => {
        expect(normalizeSkinCraftProgress(-4)).toBe(0);
        expect(normalizeSkinCraftProgress(40.6)).toBe(41);
        expect(normalizeSkinCraftProgress(140)).toBe(100);
        expect(normalizeSkinCraftProgress(Number.NaN)).toBeNull();
        expect(normalizeSkinCraftProgress('40')).toBeNull();
    });

    it('keeps progress monotonic within a load', () => {
        expect(mergeSkinCraftProgress(null, 12)).toBe(12);
        expect(mergeSkinCraftProgress(60, 32)).toBe(60);
        expect(mergeSkinCraftProgress(60, 80)).toBe(80);
        expect(mergeSkinCraftProgress(60, null)).toBe(60);
    });
});
