import {css, html} from 'lit';

import {property} from 'lit/decorators.js';
import {CustomElement, InjectAppend, InjectionMode} from "../injectors";
import {FloatElement} from "../custom";
import {cache} from "decorator-cache-getter";
import {Asset, ListingData} from "../../types/steam";
import {gFloatFetcher} from "../../float_fetcher/float_fetcher";
import {ItemInfo} from "../../bridge/handlers/fetch_inspect_info";
import {getMarketInspectLink, inlineEasyInspect, inlineStickers} from "./helpers";
import {formatSeed, renderClickableRank} from "../../utils/skin";
import {gFilterService} from "../../filter/service";
import {Currency} from "../../types/steam_constants";

@CustomElement()
@InjectAppend("#searchResultsRows .market_listing_row .market_listing_item_name_block", InjectionMode.CONTINUOUS)
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

    get listingInfo(): ListingData|null {
        return g_rgListingInfo[this.listingId!];
    }

    get asset(): Asset|undefined {
        if (!this.listingInfo) return;

        return g_rgAssets[730][2][this.listingInfo.asset.id!];
    }

    get inspectLink(): string|undefined {
        return getMarketInspectLink(this.listingId!);
    }

    async fetchFloat(): Promise<ItemInfo> {
        return gFloatFetcher.fetch({
            link: this.inspectLink!,
            listPrice: this.usdPrice
        });
    }

    /**
     * Returns the price of the item in the user's wallet currency
     *
     * If the user is not logged in, this will return undefined
     */
    get convertedPrice(): number|undefined {
        if (!g_rgWalletInfo || !g_rgWalletInfo.wallet_currency) {
            return;
        }

        if (!this.listingInfo || !this.listingInfo.converted_price || !this.listingInfo.converted_fee) {
            return;
        }

        // Item currency is formatted as 20XX for most currencies where XX is the account currency
        if (this.listingInfo.converted_currencyid !== (g_rgWalletInfo.wallet_currency + 2000)) {
            return;
        }

        return (this.listingInfo.converted_price + this.listingInfo.converted_fee) / 100;
    }

    get usdPrice(): number|undefined {
        if (this.listingInfo?.currencyid === Currency.USD) {
            return this.listingInfo.price + this.listingInfo.fee;
        } else if (this.listingInfo?.converted_currencyid === Currency.USD) {
            return this.listingInfo.converted_price! + this.listingInfo.converted_fee!;
        }
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

        if (this.itemInfo) {
            gFilterService.onUpdate$.subscribe(() => {
                const colour = gFilterService.matchColour(this.itemInfo!, this.convertedPrice) || '';
                $J(this).parent().parent().css('background-color', colour);
            });
        }

        if (BuyItemDialog?.m_bInitialized && MarketCheckHash) {
            // Does the hash now match an item on the page?
            // Allows dynamic page scrubs to auto-show the dialog
            MarketCheckHash();
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
