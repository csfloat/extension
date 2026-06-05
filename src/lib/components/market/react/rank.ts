import {css, html, nothing} from 'lit';
import {property} from 'lit/decorators.js';

import {CustomElement} from '../../injectors';
import {FloatElement} from '../../custom';
import {ItemInfo} from '../../../bridge/handlers/fetch_inspect_info';
import {parseRank, renderClickableRank} from '../../../utils/skin';

@CustomElement()
export class BetaListingRank extends FloatElement {
    @property({type: Object}) itemInfo!: ItemInfo;
    @property({attribute: false}) card!: HTMLElement;
    @property({attribute: false}) targetFloat!: number | null;

    static styles = [
        css`
            :host:has(a[href]) {
                margin-left: 4px;
            }
        `,
    ];

    private injected = false;

    connectedCallback(): void {
        super.connectedCallback();
        this.placeNextToWear();
    }

    /** Moves this element next to the wear span in the card. */
    private placeNextToWear(): void {
        if (this.injected || !this.itemInfo || !this.card) return;
        if (!parseRank(this.itemInfo)) return;

        const wearSpan = this.findWearSpan();
        if (!wearSpan) return;

        this.injected = true;
        wearSpan.insertAdjacentElement('afterend', this);
    }

    private findWearSpan(): HTMLSpanElement | null {
        if (this.targetFloat === null) return null;

        const spans = this.card.querySelectorAll<HTMLSpanElement>('span[style*="pre-wrap"]');
        for (const span of spans) {
            const text = span.textContent?.trim();
            if (!text) continue;
            const value = parseFloat(text);
            if (!Number.isNaN(value) && Math.abs(value - this.targetFloat) < 1e-6) return span;
        }
        return null;
    }

    protected render() {
        if (!this.itemInfo) return nothing;

        return html`<span @click=${(e: Event) => e.stopPropagation()}>${renderClickableRank(this.itemInfo)}</span>`;
    }
}
