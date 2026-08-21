import {css, html, nothing} from 'lit';
import {property, state} from 'lit/decorators.js';

import {gSkinCraftEmbed} from '../../../services/skincraft_embed';
import {getLoadedListingTargets, toSkinCraftListingItem} from '../../../services/skincraft_market_targets';
import type {SkinCraftItem} from '../../../services/skincraft_viewer_protocol';
import {gWebGpuAvailability, type WebGpuAvailability} from '../../../services/webgpu_availability';
import {webGpuGuidance} from '../../../utils/webgpu_guidance';
import {FloatElement} from '../../custom';
import {CustomElement, InjectIntoScope, InjectionPosition} from '../../injectors';
import {ReactMarketDialogInspectScope, ReactMarketListingCardScope, type ReactListingCardContext} from './listing';
import {findDialogInspectLink, findPriceRow} from './placement';

/**
 * Shared behaviour for the market 3D launchers, mirroring the inventory "View in 3D" button: they
 * render for anything SkinCraft can show, and WebGPU capability only decides enabled vs
 * disabled-with-guidance. They stay hidden while the probe settles so they never appear and then
 * change. Subclasses own placement and presentation.
 */
abstract class MarketView3DButton extends FloatElement {
    @property({attribute: false}) injectionContext?: ReactListingCardContext;

    @state() protected webGpuStatus: WebGpuAvailability = 'checking';

    protected get skinCraftItem(): SkinCraftItem | undefined {
        const listing = this.injectionContext?.listing;
        return listing && toSkinCraftListingItem(listing);
    }

    connectedCallback(): void {
        super.connectedCallback();
        void gWebGpuAvailability.settled().then((status) => {
            this.webGpuStatus = status;
        });
    }

    /** Runs just before the viewer opens, e.g. to dismiss the surface the button sits on. */
    protected beforeOpen(): void {}

    // The elements behind these buttons are themselves clickable, so always swallow the click.
    protected handleClick(event: Event): void {
        event.preventDefault();
        event.stopPropagation();

        const item = this.skinCraftItem;
        if (this.webGpuStatus !== 'available' || !item) return;

        // A dialog deep-link can show a listing whose card isn't mounted; keep it navigable.
        const targets = getLoadedListingTargets();
        if (!targets.some((target) => target.assetId === item.assetId)) targets.unshift(item);
        this.beforeOpen();
        gSkinCraftEmbed.open(item, targets);
    }
}

/** Adds a 3D launcher to each listing card's price row, sized to Steam's own Buy button there. */
@CustomElement()
@InjectIntoScope(ReactMarketListingCardScope, {
    anchor: findPriceRow,
    position: InjectionPosition.Prepend,
})
export class ReactListingView3D extends MarketView3DButton {
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

/**
 * Adds a viewer launcher beside the item dialog's "Inspect in Game..." action, matching its native
 * styling. Opening the viewer first dismisses Steam's dialog the way pressing Escape would.
 */
@CustomElement()
@InjectIntoScope(ReactMarketDialogInspectScope, {
    anchor: findDialogInspectLink,
    position: InjectionPosition.After,
})
export class ReactDialogView3D extends MarketView3DButton {
    static styles = [
        ...FloatElement.styles,
        css`
            .view-3d-btn {
                display: inline-flex;
                align-items: center;
                height: 24px;
                padding: 0 12px;
                color: #fff;
                font-family: inherit;
                font-size: 12px;
                font-weight: 300;
                background: #3d4450;
                border: 0;
                border-radius: 2px;
                cursor: pointer;
                transition: background-color 150ms ease;
            }

            .view-3d-btn:hover:not(.unavailable) {
                background: #464d5c;
            }

            .view-3d-btn.unavailable {
                cursor: default;
                opacity: 0.5;
            }
        `,
    ];

    protected beforeOpen(): void {
        // The dialog owns the ?detail=… routing, and Escape is Steam's own dismissal path.
        document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', code: 'Escape', bubbles: true}));
    }

    protected render() {
        if (this.webGpuStatus === 'checking' || !this.skinCraftItem) return nothing;

        if (this.webGpuStatus !== 'available') {
            const reason = gWebGpuAvailability.unavailableReason ?? 'no-webgpu';
            return html`
                <span>
                    ${this.tooltip(webGpuGuidance(reason), 'hint--large')}
                    <button class="view-3d-btn unavailable" type="button" aria-disabled="true">View in 3D</button>
                </span>
            `;
        }

        return html`<button class="view-3d-btn" type="button" @click=${this.handleClick}>View in 3D</button>`;
    }
}
