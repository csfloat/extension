import {FloatElement} from "../custom";
import {CustomElement, InjectAppend, InjectionMode} from "../injectors";
import {css, html, HTMLTemplateResult} from "lit";
import {FetchSkinModel, FetchSkinModelResponse} from "../../bridge/handlers/fetch_skin_model";
import {state} from "lit/decorators.js";
import {ClientSend} from "../../bridge/client";

import '../common/ui/steam-button';
import {cache} from "decorator-cache-getter";
import {getMarketInspectLink} from "./helpers";

@CustomElement()
@InjectAppend('#searchResultsRows .market_listing_row', InjectionMode.CONTINUOUS)
export class SkinViewer extends FloatElement {
    private response: FetchSkinModelResponse | undefined;

    static styles = [...FloatElement.styles, css`
        .btn-container {
          margin: 5px 0 5px 80px;
        }
      
        .iframe-3d {
          margin-top: 10px;
          width: 100%;
          height: 500px;
          border-width: 0;
        }
    `];

    @cache
    get listingId(): string|undefined {
        const id = $J(this).parent().attr("id");
        const matches = id?.match(/listing_(\d+)/);
        if (!matches || matches.length < 2) {
            return;
        }

        return matches[1];
    }

    get inspectLink(): string|undefined {
        return getMarketInspectLink(this.listingId!);
    }

    @state()
    private loading = false;

    @state()
    private show3D = false;

    async connectedCallback() {
        super.connectedCallback();
    }

    loadingIfApplicable(text: string) {
        if (this.loading) {
            return 'Loading...';
        } else {
            return text;
        }
    }

    private render3D(): HTMLTemplateResult {
        if (!this.show3D || !this.response?.modelLink) return html``;

        return html`
            <div>
                <iframe class="iframe-3d" src="${window.CSGOFLOAT_MODEL_FRAME_URL}?url=${this.response?.modelLink}"></iframe>
            </div>
        `;
    }

    protected render(): HTMLTemplateResult {
        return html`
            <div class="btn-container">
                <csgofloat-steam-button .text="${this.loadingIfApplicable("3D")}"
                                        @click="${this.toggle3D}"></csgofloat-steam-button>
            </div>
            
            ${this.render3D()}
        `;
    }

    async fetchModel() {
        this.loading = true;
        try {
            this.response = await ClientSend(FetchSkinModel, {inspectLink: this.inspectLink});
        } catch (e: any) {
            console.log(e);
            alert(`Failed to fetch skin model: ${e.toString()}`);
        }
        this.loading = false;
    }

    async toggle3D() {
        console.log(this.inspectLink);

        if (!this.response) {
            await this.fetchModel();
        }

        console.log(this.response);

        this.show3D = !this.show3D;
    }
}
