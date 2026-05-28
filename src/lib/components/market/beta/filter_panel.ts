import {css, html, nothing, HTMLTemplateResult} from 'lit';

import {CustomElement} from '../../injectors';
import {FloatElement} from '../../custom';

import '../../filter/filter_container';

/**
 * Beta-styled wrapper around the existing {@link csfloat-filter-container}.
 *
 * The filter UI itself is unchanged. We only provide a visual frame that fits the new Steam UI
 * (tinted background, rounded corners, system spacing). The element reads its filter key from
 * the `key` attribute and forwards it to the inner filter container, which is what the existing
 * filter service uses to scope item-specific filters.
 */
@CustomElement()
export class BetaFilterPanel extends FloatElement {
    static styles = [
        ...FloatElement.styles,
        css`
            .panel {
                margin-bottom: 16px;
                padding: 16px;
                background-color: rgba(0, 0, 0, 0.25);
                border: 1px solid rgba(255, 255, 255, 0.06);
                border-radius: 8px;
                color: #c7d5e0;
            }

            .panel-title {
                font-family: 'Motiva Sans', sans-serif;
                font-size: 14px;
                font-weight: 600;
                letter-spacing: 0.04em;
                text-transform: uppercase;
                color: #ebebeb;
                margin: 0 0 12px;
            }
        `,
    ];

    private get key(): string {
        return this.getAttribute('key') ?? '';
    }

    protected render(): HTMLTemplateResult | typeof nothing {
        if (!this.key) return nothing;
        return html`
            <div class="panel">
                <h3 class="panel-title">CSFloat Filters</h3>
                <csfloat-filter-container .key="${this.key}"></csfloat-filter-container>
            </div>
        `;
    }
}
