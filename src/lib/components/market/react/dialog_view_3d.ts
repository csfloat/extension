import {css, html, nothing} from 'lit';

import {FloatElement} from '../../custom';
import {CustomElement, InjectIntoScope, InjectionPosition} from '../../injectors';
import {ReactMarketDialogInspectScope} from './listing';
import {findDialogInspectLink} from './placement';
import {MarketView3DButton, VIEW_3D_BUTTON_BASE_STYLES} from './view_3d_button';

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
        VIEW_3D_BUTTON_BASE_STYLES,
        css`
            .view-3d-btn {
                padding: 0 12px;
                font-weight: 300;
                background: #3d4450;
            }

            .view-3d-btn:hover:not(.unavailable) {
                background: #464d5c;
            }
        `,
    ];

    protected beforeOpen(): void {
        // The dialog owns the ?detail=… routing, and Escape is Steam's own dismissal path.
        const dialog = this.closest('dialog');
        document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', code: 'Escape', bubbles: true}));
        // A dialog still open after Steam's async handling ignored the synthetic key.
        window.setTimeout(() => {
            if (dialog?.open) console.warn("CSFloat: Steam's item dialog ignored the dismissal before the 3D viewer.");
        }, 500);
    }

    protected render() {
        if (this.webGpuStatus === 'checking' || !this.skinCraftItem) return nothing;

        if (this.webGpuStatus !== 'available') return this.renderUnavailableButton('View in 3D');

        return html`<button class="view-3d-btn" type="button" @click=${this.handleClick}>View in 3D</button>`;
    }
}
