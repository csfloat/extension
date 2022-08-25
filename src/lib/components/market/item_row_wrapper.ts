import {css, html} from 'lit';

import {property} from 'lit/decorators.js';
import {CustomElement, InjectAppend, InjectionMode} from "../injectors";
import {FloatElement} from "../custom";
import {cache} from "decorator-cache-getter";
import {ListingData} from "../../types/steam";
import {gFloatFetcher} from "../../float_fetcher/float_fetcher";
import {ItemInfo} from "../../bridge/handlers/fetch_inspect_info";
import {getDopplerPhase, hasDopplerPhase} from "../../utils/dopplers";

@CustomElement()
@InjectAppend(".market_listing_row .market_listing_item_name_block", InjectionMode.CONTINUOUS)
export class ItemRowWrapper extends FloatElement {
    @cache
    get listingId(): string|undefined {
        const id = $J(this).parent().find(".market_listing_item_name").attr("id");
        const matches = id?.match(/listing_(\d+)_name/);
        if (!matches || matches.length < 2) {
            return;
        }

        return matches[1];
    }

    get data(): ListingData|undefined {
        if (!this.listingId) return;

        return g_rgListingInfo[this.listingId];
    }

    get inspectLink(): string|undefined {
        if (!this.data || !this.data.asset?.market_actions?.length) return;

        return this.data.asset.market_actions[0].link
            .replace('%listingid%', this.listingId!)
            .replace('%assetid%', this.data.asset.id);
    }

    async fetchFloat(): Promise<ItemInfo> {
        return gFloatFetcher.fetch({
            link: this.inspectLink!,
        });
    }

    @property()
    private itemInfo: ItemInfo | undefined;
    @property()
    private error: string | undefined;

    async connectedCallback() {
        super.connectedCallback();
        try {
            this.itemInfo = await this.fetchFloat();
        } catch (e: any) {
            this.error = e.toString();
        }
    }

    render() {
        if (!this.itemInfo && !this.error) {
            return html`<div>Loading...</div>`;
        } else if (this.itemInfo) {
            return html`
                <div>
                    Float: ${this.itemInfo.floatvalue.toFixed(14)}<br>
                    Paint Seed: ${this.itemInfo.paintseed} ${
                        hasDopplerPhase(this.itemInfo.paintindex) ?
                                `(${getDopplerPhase(this.itemInfo.paintindex)})`
                                : ''}
                </div>
            `;
        } else if (this.error) {
            return html`<div style="color: orangered">CSGOFloat ${this.error}</div>`;
        }
    }
}
