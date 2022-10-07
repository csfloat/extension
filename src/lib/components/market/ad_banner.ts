import {CustomElement} from '../injectors';
import {FloatElement} from '../custom';
import {css, html, HTMLTemplateResult} from 'lit';
import {ClientSend} from '../../bridge/client';
import {CSMoneyPrice, CSMoneyPriceResponse} from '../../bridge/handlers/csmoney_price';
import {state} from 'lit/decorators.js';
import {AppId, ContextId} from '../../types/steam_constants';

@CustomElement()
export class AdBanner extends FloatElement {
    static styles = [
        ...FloatElement.styles,
        css`
            .container {
                padding: 5px;
                margin-top: 10px;
                background-color: rgba(0, 0, 0, 0.2);
                text-align: center;
                border: 1px solid black;
                position: relative;
            }

            .ad-notice {
                position: absolute;
                top: 3px;
                right: 3px;
            }

            .link {
                padding: 10px 10px 10px 10px;
                background-color: transparent;
                color: white;
                font-family: 'Motiva Sans', Sans-serif, serif;
                font-size: 18px;
                text-decoration: none;
            }

            .link img {
                vertical-align: middle;
            }

            .link .text {
                vertical-align: middle;
            }

            .text .price {
                font-weight: bold;
            }
        `,
    ];

    @state()
    private response: CSMoneyPriceResponse | undefined;

    getMarketHashName(): string | null {
        if (Object.keys(g_rgAssets[AppId.CSGO][ContextId.PRIMARY]).length > 0) {
            // Resistant to the user switching page languages
            const firstAssetId = Object.keys(g_rgAssets[AppId.CSGO][ContextId.PRIMARY])[0];
            return g_rgAssets[AppId.CSGO][ContextId.PRIMARY][firstAssetId].market_hash_name;
        } else if ((document.querySelector('.market_listing_item_name') as HTMLElement)?.innerText) {
            // Fallback
            return (document.querySelector('.market_listing_item_name') as HTMLElement)?.innerText;
        }

        return null;
    }

    protected render(): HTMLTemplateResult {
        if (!this.response) return html``;

        if (!this.response.banner?.enable) {
            return html``;
        }

        if (this.response.banner.dynamic) {
            return html`
                <div class="container">
                    <div class="ad-notice">Ad</div>
                    <a class="link" href="${this.response.banner.link}" target="_blank">
                        <span class="text">Get this skin on</span>
                        <img src="https://cs.money/svg/new_logo.svg" height="42" />
                        <span class="text">
                            for
                            <span class="price">$${this.response.price.toFixed(2)}</span>
                            USD
                        </span>
                    </a>
                </div>
            `;
        } else {
            return html`
                <div class="container">
                    <div class="ad-notice">Ad</div>
                    <a class="link" href="${this.response.banner.link}" target="_blank">
                        <img src="${this.response.banner.src}" height="${this.response.banner.height}" />
                    </a>
                </div>
            `;
        }
    }

    async connectedCallback() {
        super.connectedCallback();

        const marketHashName = this.getMarketHashName();
        if (!marketHashName) {
            return;
        }

        this.response = await ClientSend(CSMoneyPrice, {marketHashName});
    }
}
