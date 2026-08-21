import {css, html, nothing} from 'lit';
import {property, state} from 'lit/decorators.js';

import {environment} from '../../../../environment';
import {gSkinCraftEmbed} from '../../../services/skincraft_embed';
import {getLoadedListingTargets, toSkinCraftListingItem} from '../../../services/skincraft_market_targets';
import type {SkinCraftItem} from '../../../services/skincraft_viewer_protocol';
import {gWebGpuAvailability, type WebGpuAvailability} from '../../../services/webgpu_availability';
import {webGpuGuidance} from '../../../utils/webgpu_guidance';
import {FloatElement} from '../../custom';
import {CustomElement, InjectIntoScope, InjectionPosition} from '../../injectors';
import {ReactMarketListingCardScope, type ReactListingCardContext} from './listing';
import {findListingImageFrame} from './placement';

/**
 * Overlays a SkinCraft launcher on each Steam Market beta listing card, mirroring the inventory
 * "View in 3D" button: it renders for anything SkinCraft can show, and WebGPU capability only
 * decides enabled vs disabled-with-guidance. It stays hidden while the probe settles so it
 * never appears and then changes.
 */
@CustomElement()
@InjectIntoScope(ReactMarketListingCardScope, {
    anchor: findListingImageFrame,
    position: InjectionPosition.Append,
})
export class ReactListingView3D extends FloatElement {
    @property({attribute: false}) injectionContext?: ReactListingCardContext;

    @state() private webGpuStatus: WebGpuAvailability = 'checking';

    static styles = [
        ...FloatElement.styles,
        css`
            :host {
                position: absolute;
                top: 8px;
                right: 8px;
                z-index: 1;
            }

            .view-3d-btn {
                display: flex;
                padding: 5px;
                border: none;
                border-radius: 6px;
                background: rgba(0, 0, 0, 0.4);
                cursor: pointer;
            }

            .view-3d-btn img {
                display: block;
            }

            .view-3d-btn:hover {
                background: rgba(0, 0, 0, 0.65);
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
                    ${this.tooltip(webGpuGuidance(reason), 'hint--bottom-left hint--large')}
                    <button
                        class="view-3d-btn unavailable"
                        type="button"
                        aria-disabled="true"
                        @click=${this.handleClick}
                    >
                        <img src="${environment.skincraft_embed_origin}/icon.svg" height="22" alt="View in 3D" />
                    </button>
                </span>
            `;
        }

        return html`
            <span>
                ${this.tooltip('View in 3D', 'hint--bottom-left')}
                <button class="view-3d-btn" type="button" @click=${this.handleClick}>
                    <img src="${environment.skincraft_embed_origin}/icon.svg" height="22" alt="View in 3D" />
                </button>
            </span>
        `;
    }
}
