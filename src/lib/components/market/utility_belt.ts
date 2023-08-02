import {FloatElement} from '../custom';
import {CustomElement, InjectBefore, InjectionMode} from '../injectors';
import {css, html, HTMLTemplateResult} from 'lit';
import '../common/ui/steam-button';
import './page_size';
import './sort_listings';
import '../filter/filter_container';

@CustomElement()
@InjectBefore('#searchResultsRows', InjectionMode.ONCE)
export class UtilityBelt extends FloatElement {
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
            </div>
            <csfloat-ad-banner></csfloat-ad-banner>
        `;
    }

    async connectedCallback() {
        super.connectedCallback();
    }
}
