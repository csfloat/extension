import {FloatElement} from '../custom';
import {CustomElement, InjectBefore, InjectionMode} from '../injectors';
import {css, html, HTMLTemplateResult} from 'lit';
import '../common/ui/steam-button';
import './page_size';
import './sort_floats';
import './ad_banner';
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
                <csgofloat-sort-floats></csgofloat-sort-floats>
                <csgofloat-page-size class="page-selector"></csgofloat-page-size>
                <a class="github" href="https://csgofloat.com" target="_blank">Powered by CSGOFloat</a>
                <hr />
                <csgofloat-filter-container
                    ?hidden="${!this.marketHashName}"
                    .key="${this.marketHashName}"
                ></csgofloat-filter-container>
            </div>
            <csgofloat-ad-banner></csgofloat-ad-banner>
        `;
    }

    async connectedCallback() {
        super.connectedCallback();
    }
}
