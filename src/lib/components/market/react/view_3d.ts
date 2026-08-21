import {css, html, nothing} from 'lit';
import {property, state} from 'lit/decorators.js';

import {gSkinCraftEmbed} from '../../../services/skincraft_embed';
import {getLoadedListingTargets, toSkinCraftListingItem} from '../../../services/skincraft_market_targets';
import type {SkinCraftItem} from '../../../services/skincraft_viewer_protocol';
import {gWebGpuAvailability, type WebGpuAvailability} from '../../../services/webgpu_availability';
import {webGpuGuidance} from '../../../utils/webgpu_guidance';
import {FloatElement} from '../../custom';
import {CustomElement, InjectIntoScope, InjectionPosition} from '../../injectors';
import {ReactMarketListingCardScope, type ReactListingCardContext} from './listing';
import {findPriceRow} from './placement';

/**
 * Adds a 3D launcher to each Steam Market beta listing card's price row, mirroring the inventory
 * "View in 3D" button's behaviour: it renders for anything SkinCraft can show, and WebGPU
 * capability only decides enabled vs disabled-with-guidance. It stays hidden while the probe
 * settles so it never appears and then changes.
 */
@CustomElement()
@InjectIntoScope(ReactMarketListingCardScope, {
    anchor: findPriceRow,
    position: InjectionPosition.Prepend,
})
export class ReactListingView3D extends FloatElement {
    @property({attribute: false}) injectionContext?: ReactListingCardContext;

    @state() private webGpuStatus: WebGpuAvailability = 'checking';

    // Sits left-aligned in the card's price/Buy row, sized to match Steam's own Buy button there.
    static styles = [
        ...FloatElement.styles,
        css`
            :host {
                margin-right: auto;
            }

            .view-3d-btn {
                display: inline-flex;
                align-items: center;
                height: 24px;
                padding: 0 10px;
                color: #fff;
                font-family: inherit;
                font-size: 12px;
                background: rgba(255, 255, 255, 0.12);
                border: 0;
                border-radius: 2px;
                cursor: pointer;
                transition: background-color 150ms ease;
            }

            .view-3d-btn:hover:not(.unavailable) {
                background: rgba(255, 255, 255, 0.2);
            }

            .view-3d-btn.unavailable {
                cursor: default;
                opacity: 0.5;
            }
        `,
    ];

    private get skinCraftItem(): SkinCraftItem | undefined {
        const listing = this.injectionContext?.listing;
        return listing && toSkinCraftListingItem(listing);
    }

    connectedCallback(): void {
        super.connectedCallback();
        void gWebGpuAvailability.settled().then((status) => {
            this.webGpuStatus = status;
        });
    }

    // The listing card behind the button is itself clickable, so always swallow the click.
    private handleClick(event: Event): void {
        event.preventDefault();
        event.stopPropagation();

        const item = this.skinCraftItem;
        if (this.webGpuStatus !== 'available' || !item) return;

        gSkinCraftEmbed.open(item, getLoadedListingTargets());
    }

    protected render() {
        if (this.webGpuStatus === 'checking' || !this.skinCraftItem) return nothing;

        if (this.webGpuStatus !== 'available') {
            const reason = gWebGpuAvailability.unavailableReason ?? 'no-webgpu';
            return html`
                <span>
                    ${this.tooltip(webGpuGuidance(reason), 'hint--large')}
                    <button
                        class="view-3d-btn unavailable"
                        type="button"
                        aria-disabled="true"
                        aria-label="View in 3D"
                        @click=${this.handleClick}
                    >
                        3D
                    </button>
                </span>
            `;
        }

        return html`
            <span>
                ${this.tooltip('View in 3D')}
                <button class="view-3d-btn" type="button" aria-label="View in 3D" @click=${this.handleClick}>3D</button>
            </span>
        `;
    }
}
