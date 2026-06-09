import {css, nothing} from 'lit';
import {property, state} from 'lit/decorators.js';

import {CustomElement} from '../../injectors';
import {FloatElement} from '../../custom';
import {ItemInfo} from '../../../bridge/handlers/fetch_inspect_info';
import {getFadePercentage, isBlueSkin} from '../../../utils/skin';
import {ClientSend} from '../../../bridge/client';
import {FetchBluegem, FetchBluegemResponse} from '../../../bridge/handlers/fetch_bluegem';
import {renderBluegemPercentage, renderFadePercentage, patternDetailStyles} from '../../common/pattern_details';

/**
 * Renders the fade percentage and blue-gem percentage next to the paint seed in the Steam Market beta,
 * mirroring {@link BetaListingRank}. Self-contained: fetches its own blue-gem data.
 */
@CustomElement()
export class BetaListingSeedInfo extends FloatElement {
    @property({type: Object}) itemInfo!: ItemInfo;
    @property({attribute: false}) card!: HTMLElement;
    @property({attribute: false}) targetPaintSeed!: number | null;
    @property({attribute: false}) marketHashName!: string;

    @state() private bluegemData: FetchBluegemResponse | undefined;

    static styles = [
        patternDetailStyles,
        css`
            :host {
                margin-left: 4px;
            }
        `,
    ];

    private injected = false;

    connectedCallback(): void {
        super.connectedCallback();
        void this.init();
    }

    private async init(): Promise<void> {
        if (isBlueSkin(this.itemInfo)) {
            try {
                this.bluegemData = await ClientSend(FetchBluegem, {iteminfo: this.itemInfo});
            } catch (e) {
                this.bluegemData = undefined;
            }
        }

        this.placeNextToSeed();
    }

    private get fadeDetails(): {percentage: number; className: string} | undefined {
        return this.marketHashName ? getFadePercentage(this.marketHashName, this.itemInfo) : undefined;
    }

    private placeNextToSeed(): void {
        if (this.injected || !this.itemInfo || !this.card) return;
        if (this.fadeDetails === undefined && !this.bluegemData) return;

        const seedSpan = this.findSeedSpan();
        if (!seedSpan) return;

        this.injected = true;
        seedSpan.insertAdjacentElement('afterend', this);
    }

    private findSeedSpan(): HTMLSpanElement | null {
        if (this.targetPaintSeed === null) return null;

        const spans = this.card.querySelectorAll<HTMLSpanElement>('span[style*="pre-wrap"]');
        for (const span of spans) {
            const text = span.textContent?.trim();
            if (!text) continue;
            const value = parseInt(text, 10);
            // String(value) === text avoids matching the decimal float span.
            if (!Number.isNaN(value) && String(value) === text && value === this.targetPaintSeed) return span;
        }
        return null;
    }

    protected render() {
        if (!this.itemInfo || !this.card) return nothing;

        const fade = this.fadeDetails;
        if (fade) {
            return renderFadePercentage(fade, 2);
        }

        if (this.bluegemData) {
            return renderBluegemPercentage(this.bluegemData, true);
        }

        return nothing;
    }
}
