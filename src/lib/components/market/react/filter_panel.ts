import {css, html, nothing, HTMLTemplateResult} from 'lit';
import {CustomElement, InjectBefore, InjectionMode} from '../../injectors';
import {FloatElement} from '../../custom';
import {isReactSteamMarket} from '../mode';

import '../../filter/filter_container';

/**
 * Steam Market Beta equivalent of {@link UtilityBelt}.
 */
@CustomElement()
@InjectBefore(
    'div:has(> [style*="grid-columns:repeat(auto-fill, minmax(260px"])',
    InjectionMode.CONTINUOUS,
    isReactSteamMarket
)
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
                font-family: 'Motiva Sans', sans-serif;
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
        return marketHashName() ?? '';
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

/** Use the title of the page to get the market hash name */
function marketHashName(): string | undefined {
    return document.title.match(/^(.+?) - Steam Community Market$/)?.[1] ?? undefined;
}
