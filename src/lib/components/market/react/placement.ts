import type {ScopedInjectionArgs} from '../../injectors';
import {parseRank} from '../../../utils/skin';
import type {ReactListingContext} from './listing';

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
