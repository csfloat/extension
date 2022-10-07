import {FloatElement} from '../custom';
import {CustomElement, InjectAppend, InjectionMode} from '../injectors';
import {css, html, HTMLTemplateResult, nothing} from 'lit';
import {FetchSkinModel, FetchSkinModelResponse} from '../../bridge/handlers/fetch_skin_model';
import {state} from 'lit/decorators.js';
import {ClientSend} from '../../bridge/client';

import '../common/ui/steam-button';
import {cache} from 'decorator-cache-getter';
import {getMarketInspectLink} from './helpers';

enum Showing {
    NONE,
    MODEL,
    SCREENSHOT,
}

@CustomElement()
@InjectAppend('#searchResultsRows .market_listing_row', InjectionMode.CONTINUOUS)
export class SkinViewer extends FloatElement {
    private response: FetchSkinModelResponse | undefined;

    static styles = [
        ...FloatElement.styles,
        css`
            .btn-container {
                margin: 7px 0 5px 80px;
            }

            .iframe-3d {
                margin-top: 10px;
                width: 100%;
                height: 500px;
                border-width: 0;
            }

            img.screenshot {
                width: 100%;
            }
        `,
    ];

    @cache
    get listingId(): string | undefined {
        const id = $J(this).parent().attr('id');
        const matches = id?.match(/listing_(\d+)/);
        if (!matches || matches.length < 2) {
            return;
        }

        return matches[1];
    }

    get inspectLink(): string | undefined {
        return getMarketInspectLink(this.listingId!);
    }

    @state()
    private loading = false;

    @state()
    private showing: Showing = Showing.NONE;

    async connectedCallback() {
        super.connectedCallback();
    }

    loadingIfApplicable(text: string, type: Showing) {
        if (this.showing == type && this.loading) {
            return 'Loading...';
        } else {
            return text;
        }
    }

    protected render(): HTMLTemplateResult {
        if (!this.inspectLink) {
            return html``;
        }

        return html`
            <div class="btn-container">
                <csgofloat-steam-button
                    .text="${this.loadingIfApplicable('3D', Showing.MODEL)}"
                    @click="${this.toggle3D}"
                ></csgofloat-steam-button>

                <csgofloat-steam-button
                    .text="${this.loadingIfApplicable('Screenshot', Showing.SCREENSHOT)}"
                    @click="${this.toggleScreenshot}"
                ></csgofloat-steam-button>
            </div>
            ${this.showing === Showing.MODEL && this.response?.modelLink
                ? html`
                      <div>
                          <iframe
                              class="iframe-3d"
                              src="${window.CSGOFLOAT_MODEL_FRAME_URL}?url=${this.response?.modelLink}"
                          ></iframe>
                      </div>
                  `
                : nothing}
            <img
                class="screenshot"
                ?hidden="${this.showing !== Showing.SCREENSHOT || !this.response?.screenshotLink}"
                src="${this.response?.screenshotLink}"
            />
        `;
    }

    async fetchModel() {
        this.loading = true;
        try {
            this.response = await ClientSend(FetchSkinModel, {
                inspectLink: this.inspectLink,
            });
        } catch (e: any) {
            alert(`Failed to fetch skin model: ${e.toString()}`);
        }
        this.loading = false;
    }

    private toggle(type: Showing) {
        if (this.showing === type) {
            this.showing = Showing.NONE;
        } else {
            this.showing = type;
        }
    }

    async toggle3D() {
        if (this.loading) return;

        this.toggle(Showing.MODEL);

        if (!this.response) {
            await this.fetchModel();
        }
    }

    async toggleScreenshot() {
        if (this.loading) return;

        this.toggle(Showing.SCREENSHOT);

        if (!this.response) {
            await this.fetchModel();
        }
    }
}
