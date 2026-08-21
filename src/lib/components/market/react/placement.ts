import type {ScopedInjectionArgs} from '../../injectors';
import {getFadePercentage, isBlueSkin, parseRank} from '../../../utils/skin';
import {hasDopplerPhase} from '../../../utils/dopplers';
import type {ReactListingCardContext, ReactListingContext} from './listing';

function hasSeedDetail(context: ReactListingContext): boolean {
    return (
        getFadePercentage(context.listing.description.market_hash_name, context.itemInfo) !== undefined ||
        isBlueSkin(context.itemInfo) ||
        hasDopplerPhase(context.itemInfo.paintindex)
    );
}

export function findWearSpan({
    scope,
    context,
}: ScopedInjectionArgs<ReactListingContext>): HTMLSpanElement | null | undefined {
    if (!parseRank(context.itemInfo) || context.targetFloat === null) return null;

    const spans = scope.querySelectorAll<HTMLSpanElement>('span[style*="pre-wrap"]');
    for (const span of spans) {
        const text = span.textContent?.trim();
        if (!text) continue;

        const value = parseFloat(text);
        if (!Number.isNaN(value) && Math.abs(value - context.targetFloat) < 1e-6) return span;
    }

    return undefined;
}

export function findPriceRow({scope}: ScopedInjectionArgs<ReactListingCardContext>): HTMLElement | null | undefined {
    return (
        scope.querySelector<HTMLElement>('div[style*="--justify:end"][style*="--align:center"]:has(button)') ??
        undefined
    );
}

export function findSeedSpan({
    scope,
    context,
}: ScopedInjectionArgs<ReactListingContext>): HTMLSpanElement | null | undefined {
    if (!hasSeedDetail(context)) return null;

    const spans = scope.querySelectorAll<HTMLSpanElement>('span[style*="pre-wrap"]');
    for (const span of spans) {
        const text = span.textContent?.trim();
        if (!text) continue;

        const value = parseInt(text, 10);
        if (!Number.isNaN(value) && String(value) === text && value === context.itemInfo.paintseed) return span;
    }

    return undefined;
}
