import {CustomElement, InjectAfter, InjectionMode} from "../injectors";
import {FloatElement} from "../custom";
import {css, html, HTMLTemplateResult} from "lit";
import {ClientSend} from "../../bridge/client";
import {CSMoneyPrice, CSMoneyPriceResponse} from "../../bridge/handlers/csmoney_price";
import {state} from "lit/decorators.js";

@CustomElement()
export class AdBanner extends FloatElement {
    static styles = [...FloatElement.styles, css` 
      .container {
        padding: 10px;
        margin-top: 10px;
        background-color: rgba(0, 0, 0, 0.2);
        text-align: center;
        border: 1px solid black;
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
        vertical-align: bottom;
      }
      
      .text .price {
        font-weight: bold;
      }
    `];

    @state()
    private response: CSMoneyPriceResponse | undefined;

    getMarketHashName(): string|null {
        if (Object.keys(g_rgAssets["730"]["2"]).length > 0) {
            // Resistant to the user switching page languages
            return g_rgAssets["730"]["2"][Object.keys(g_rgAssets["730"]["2"])[0]].market_hash_name;
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
                    <a class="link" href="${this.response.banner.link}" target="_blank">
                        <span class="text">Get this skin on</span>
                        <img src="https://cs.money/svg/logo.svg" height="32">
                        <span class="text">
                            for <span class="price">$${this.response.price.toFixed(2)}</span> USD
                        </span>
                    </a>
                </div>
            `;
        } else {
            return html`
                <div class="container">
                    <a class="link" href="${this.response.banner.link}" target="_blank">
                        <img src="${this.response.banner.src}" height="${this.response.banner.height}">
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
