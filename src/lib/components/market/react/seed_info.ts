import {css, html, nothing} from 'lit';
import {property, state} from 'lit/decorators.js';

import {CustomElement, InjectIntoScope, InjectionPosition} from '../../injectors';
import {FloatElement} from '../../custom';
import {getFadePercentage, isBlueSkin} from '../../../utils/skin';
import {getDopplerPhase, hasDopplerPhase} from '../../../utils/dopplers';
import {ClientSend} from '../../../bridge/client';
import {FetchBluegem, FetchBluegemResponse} from '../../../bridge/handlers/fetch_bluegem';
import {renderBluegemPercentage, renderFadePercentage, patternDetailStyles} from '../../common/pattern_details';
import {ReactMarketListingScope, type ReactListingContext} from './listing';
import {findSeedSpan} from './placement';

/**
 * Renders the fade percentage and blue-gem percentage next to the paint seed in the Steam Market beta,
 * mirroring {@link ReactListingRank}. Self-contained: fetches its own blue-gem data.
 */
@CustomElement()
@InjectIntoScope(ReactMarketListingScope, {
    anchor: findSeedSpan,
    position: InjectionPosition.After,
})
export class ReactListingSeedInfo extends FloatElement {
    @property({attribute: false}) injectionContext?: ReactListingContext;

    @state() private bluegemData: FetchBluegemResponse | undefined;

    static styles = [
        patternDetailStyles,
        css`
            :host {
                margin-left: 4px;
            }
        `,
    ];

    connectedCallback(): void {
        super.connectedCallback();
        void this.fetchBluegem();
    }

    private async fetchBluegem(): Promise<void> {
        const itemInfo = this.injectionContext?.itemInfo;
        if (!itemInfo || !isBlueSkin(itemInfo)) return;

        try {
            this.bluegemData = await ClientSend(FetchBluegem, {iteminfo: itemInfo});
        } catch (e) {
            this.bluegemData = undefined;
        }
    }

    private get fadeDetails(): {percentage: number; className: string} | undefined {
        const context = this.injectionContext;
        if (!context) return undefined;

        return getFadePercentage(context.listing.description.market_hash_name, context.itemInfo);
    }

    private get dopplerPhase(): string | undefined {
        const itemInfo = this.injectionContext?.itemInfo;
        if (!itemInfo || !hasDopplerPhase(itemInfo.paintindex)) return undefined;

        return getDopplerPhase(itemInfo.paintindex);
    }

    protected render() {
        if (!this.injectionContext) return nothing;

        if (this.fadeDetails) {
            return renderFadePercentage(this.fadeDetails, 2);
        }

        if (this.bluegemData) {
            return renderBluegemPercentage(this.bluegemData, true);
        }

        const phase = this.dopplerPhase;
        if (phase) {
            return html`<span>(${phase})</span>`;
        }

        return nothing;
    }
}
