import {css, html} from 'lit';

import {property} from 'lit/decorators.js';
import {CustomElement, InjectAppend, InjectionMode} from "../injectors";
import {FloatElement} from "../custom";
import {cache} from "decorator-cache-getter";
import {Asset} from "../../types/steam";
import {gFloatFetcher} from "../../float_fetcher/float_fetcher";
import {ItemInfo} from "../../bridge/handlers/fetch_inspect_info";
import {getMarketInspectLink, inlineEasyInspect, inlineStickers} from "./helpers";
import {formatSeed, renderClickableRank} from "../../utils/skin";

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

    get asset(): Asset|undefined {
        const listingInfo = g_rgListingInfo[this.listingId!];
        if (!listingInfo) return;

        return g_rgAssets[730][2][listingInfo.asset.id!];
    }

    get inspectLink(): string|undefined {
        return getMarketInspectLink(this.listingId!);
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

        // Only add if they don't have Steam Inventory Helper
        if (!$J(this).parent().parent().find('.sih-inspect-magnifier').length) {
            inlineEasyInspect(
                $J(this).parent().parent().find('.market_listing_item_img_container'),
                this.inspectLink);
        }

        try {
            this.itemInfo = await this.fetchFloat();
        } catch (e: any) {
            this.error = e.toString();
        }

        if (this.itemInfo && this.asset) {
            inlineStickers($J(this).parent().find('.market_listing_item_name'), this.itemInfo, this.asset);
        }
    }

    render() {
        if (this.itemInfo) {
            return html`
                <div>
                    Float: ${this.itemInfo.floatvalue.toFixed(14)} ${renderClickableRank(this.itemInfo)}<br>
                    Paint Seed: ${formatSeed(this.itemInfo)}
                </div>
            `;
        } else if (this.error) {
            return html`<div style="color: orangered">CSGOFloat ${this.error}</div>`;
        } else {
            return html`<div>Loading...</div>`;
        }
    }
}
