import {css, html, nothing} from 'lit';

import {FloatElement} from '../../custom';
import {CustomElement, InjectIntoScope, InjectionPosition} from '../../injectors';
import {ReactMarketListingCardScope} from './listing';
import {findPriceRow} from './placement';
import {MarketView3DButton, VIEW_3D_BUTTON_BASE_STYLES} from './view_3d_button';

/** Adds a 3D launcher to each listing card's price row, sized to Steam's own Buy button there. */
@CustomElement()
@InjectIntoScope(ReactMarketListingCardScope, {
    anchor: findPriceRow,
    position: InjectionPosition.Prepend,
})
export class ReactListingView3D extends MarketView3DButton {
    static styles = [
        ...FloatElement.styles,
        VIEW_3D_BUTTON_BASE_STYLES,
        css`
            :host {
                margin-right: auto;
            }

            .view-3d-btn {
                padding: 0 10px;
                background: rgba(255, 255, 255, 0.12);
            }

            .view-3d-btn:hover:not(.unavailable) {
                background: rgba(255, 255, 255, 0.2);
            }
        `,
    ];

    protected render() {
        if (this.webGpuStatus === 'checking' || !this.skinCraftItem) return nothing;

        if (this.webGpuStatus !== 'available') return this.renderUnavailableButton('3D');

        return html`
            <span>
                ${this.tooltip('View in 3D')}
                <button class="view-3d-btn" type="button" aria-label="View in 3D" @click=${this.handleClick}>3D</button>
            </span>
        `;
    }
}
