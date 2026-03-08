import {FloatElement} from '../custom';
import {CustomElement, InjectBefore, InjectionMode} from '../injectors';
import {css, html, HTMLTemplateResult, nothing} from 'lit';
import {state} from 'lit/decorators.js';
import '../common/ui/steam-button';
import './page_size';
import './sort_listings';
import '../filter/filter_container';
import {Observe} from '../../utils/observers';
import {isBuggedSkin} from '../../utils/skin';
import {AppId, ContextId} from '../../types/steam_constants';

@CustomElement()
@InjectBefore('#searchResultsRows', InjectionMode.ONCE)
export class UtilityBelt extends FloatElement {
    @state()
    private buggedSkinCount = 0;

    get marketHashName(): string {
        return (document.querySelector('.market_listing_nav a:nth-child(2)') as HTMLElement).innerText;
    }

    static styles = [
        ...FloatElement.styles,
        css`
            .utility-container {
                padding: 10px;
                margin-top: 10px;
                background-color: rgba(0, 0, 0, 0.2);
            }

            .page-selector {
                margin-left: 10px;
            }

            .github {
                margin-left: 10px;
                text-decoration: underline;
                font-family: 'Motiva Sans', sans-serif;
            }

            .bugged-skin-warning {
                padding: 8px 12px;
                margin-top: 10px;
                background-color: rgba(255, 152, 0, 0.15);
                border: 1px solid rgba(255, 152, 0, 0.4);
                border-radius: 4px;
                color: #ffb74d;
                font-size: 13px;
            }
        `,
    ];

    protected render(): HTMLTemplateResult {
        return html`
            <div class="utility-container">
                <csfloat-sort-listings></csfloat-sort-listings>
                <csfloat-page-size class="page-selector"></csfloat-page-size>
                <a class="github" href="https://csfloat.com" target="_blank">Powered by CSFloat</a>
                <hr />
                <csfloat-filter-container
                    ?hidden="${!this.marketHashName}"
                    .key="${this.marketHashName}"
                ></csfloat-filter-container>
                ${this.renderBuggedSkinWarning()}
            </div>
            <csfloat-ad-banner></csfloat-ad-banner>
        `;
    }

    private countBuggedSkins(): number {
        try {
            const assets = g_rgAssets?.[AppId.CSGO]?.[ContextId.PRIMARY];
            if (!assets) return 0;

            return Object.values(assets).filter((asset) => isBuggedSkin(asset)).length;
        } catch {
            return 0;
        }
    }

    private renderBuggedSkinWarning(): HTMLTemplateResult | typeof nothing {
        if (this.buggedSkinCount === 0) {
            return nothing;
        }

        return html`
            <div class="bugged-skin-warning">
                <b>${this.buggedSkinCount} skin${this.buggedSkinCount > 1 ? 's' : ''}</b> on this page
                cannot display float data since they're not inspectable in-game (March 4, 2026 update). Valve pls fix.
            </div>
        `;
    }

    async connectedCallback() {
        super.connectedCallback();

        this.buggedSkinCount = this.countBuggedSkins();

        Observe(
            () => {
                try {
                    return Object.keys(g_rgAssets?.[AppId.CSGO]?.[ContextId.PRIMARY] || {}).join(',');
                } catch {
                    return '';
                }
            },
            () => {
                this.buggedSkinCount = this.countBuggedSkins();
            },
            100
        );
    }
}
