import {FloatElement} from '../custom';
import {CustomElement, InjectBefore, InjectionMode} from '../injectors';
import {css, html, HTMLTemplateResult} from 'lit';
import '../common/ui/steam-button';
import './page_size';
import './sort_listings';
import '../filter/filter_container';
import {ClientSend} from '../../bridge/client';
import {OpenOptionsPage} from '../../bridge/handlers/open_options_page';

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

            .buttons-container {
                display: flex;
                align-items: center;
            }

            .settings-icon-wrapper {
                padding: 4px;
                margin-left: auto;
                margin-right: 0;
                border-radius: 4px;
                display: inherit;
            }

            .settings-icon-wrapper:hover {
                background-color: rgba(0, 0, 0, 0.3);
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
                <div class="buttons-container">
                    <csfloat-sort-listings></csfloat-sort-listings>
                    <csfloat-page-size class="page-selector"></csfloat-page-size>
                    <a class="github" href="https://csfloat.com" target="_blank">Powered by CSFloat</a>
                    <a class="settings-icon-wrapper" @click="${() => ClientSend(OpenOptionsPage, undefined)}">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="icon icon-tabler icon-tabler-settings"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            stroke-width="2"
                            stroke="currentColor"
                            fill="none"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                            <path
                                d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z"
                            />
                            <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
                        </svg>
                    </a>
                </div>
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
