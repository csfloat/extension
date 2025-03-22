import {css, html, nothing, TemplateResult} from 'lit';

import {state} from 'lit/decorators.js';
import {CustomElement, InjectAppend, InjectionMode} from '../injectors';
import {FloatElement} from '../custom';
import {cache} from 'decorator-cache-getter';
import {rgAsset, ListingData} from '../../types/steam';
import {gFloatFetcher} from '../../services/float_fetcher';
import {ItemInfo} from '../../bridge/handlers/fetch_inspect_info';
import {getMarketInspectLink, inlineEasyInspect} from './helpers';
import {formatSeed, getFadePercentage, isSkin, renderClickableRank, floor, isCharm, isBlueSkin} from '../../utils/skin';
import {gFilterService} from '../../services/filter';
import {AppId, ContextId, Currency} from '../../types/steam_constants';
import {defined} from '../../utils/checkers';
import {pickTextColour} from '../../utils/colours';
import '../common/ui/floatbar';
import './sticker_display';
import {FetchBluegem, FetchBluegemResponse} from '../../bridge/handlers/fetch_bluegem';
import {ClientSend} from '../../bridge/client';
import {ConflictingExtension, ConflictingMode, HideConflictingElement, StyleConflictingElement} from '../decorators';

@CustomElement()
@InjectAppend('#searchResultsRows .market_listing_row .market_listing_item_name_block', InjectionMode.CONTINUOUS)
@HideConflictingElement(
    ConflictingExtension.CS2_TRADER,
    '#searchResultsRows .market_listing_row .stickerHolderMarket, #searchResultsRows .market_listing_row .stickersTotal, #searchResultsRows .market_listing_row .floatBarMarket'
)
@HideConflictingElement(
    ConflictingExtension.SIH,
    '#searchResultsRows .market_listing_row .sih-images, #searchResultsRows .market_listing_row .sih-keychains'
)
@StyleConflictingElement(
    ConflictingExtension.SIH,
    '#searchResultsRows .market_listing_row .market_listing_item_name_block',
    ConflictingMode.ONCE,
    {'max-width': '100%', 'margin-top': '8px'}
)
export class ItemRowWrapper extends FloatElement {
    static styles = [
        ...FloatElement.styles,
        css`
            .float-row-wrapper {
                display: inline-block;
                margin-bottom: 5px;
            }
        `,
    ];

    @cache
    get listingId(): string | undefined {
        const id = $J(this).parent().find('.market_listing_item_name').attr('id');
        const matches = id?.match(/listing_(\d+)_name/);
        if (!matches || matches.length < 2) {
            return;
        }

        return matches[1];
    }

    get listingInfo(): ListingData | null {
        return g_rgListingInfo[this.listingId!];
    }

    get asset(): rgAsset | undefined {
        if (!this.listingInfo) return;

        return g_rgAssets[AppId.CSGO][ContextId.PRIMARY][this.listingInfo.asset.id!];
    }

    get inspectLink(): string | undefined {
        return getMarketInspectLink(this.listingId!);
    }

    async fetchFloat(): Promise<ItemInfo> {
        return gFloatFetcher.fetch({
            link: this.inspectLink!,
            listPrice: this.usdPrice,
        });
    }

    /**
     * Returns the price of the item in the user's wallet currency
     *
     * If the user is not logged in, this will return undefined
     */
    get convertedPrice(): number | undefined {
        if (!defined(typeof g_rgWalletInfo) || !g_rgWalletInfo || !g_rgWalletInfo.wallet_currency) {
            return;
        }

        if (!this.listingInfo || !this.listingInfo.converted_price || !this.listingInfo.converted_fee) {
            return;
        }

        // Item currency is formatted as 20XX for most currencies where XX is the account currency
        if (this.listingInfo.converted_currencyid !== g_rgWalletInfo.wallet_currency + 2000) {
            return;
        }

        return (this.listingInfo.converted_price + this.listingInfo.converted_fee) / 100;
    }

    get usdPrice(): number | undefined {
        if (this.listingInfo?.currencyid === Currency.USD) {
            return this.listingInfo.price + this.listingInfo.fee;
        } else if (this.listingInfo?.converted_currencyid === Currency.USD) {
            return this.listingInfo.converted_price! + this.listingInfo.converted_fee!;
        }
    }

    @state()
    private itemInfo: ItemInfo | undefined;
    @state()
    private error: string | undefined;

    @state()
    private bluegemData: FetchBluegemResponse | undefined;

    async connectedCallback() {
        super.connectedCallback();

        if (!this.inspectLink) {
            return;
        }

        // Only add if they don't have Steam Inventory Helper
        if (!$J(this).parent().parent().find('.sih-inspect-magnifier').length) {
            inlineEasyInspect($J(this).parent().parent().find('.market_listing_item_img_container'), this.inspectLink);
        }

        try {
            this.itemInfo = await this.fetchFloat();
        } catch (e: any) {
            this.error = e.toString();
        }

        if (this.itemInfo && this.asset) {
            // Create a sticker display element
            const stickerDisplay = document.createElement('csfloat-sticker-display');
            stickerDisplay.classList.add('economy_item_hoverable');
            const elementId = `listing_${this.listingId}_csfloat`;
            stickerDisplay.id = elementId;
            // @ts-ignore - We know these properties exist on our Lit element
            stickerDisplay.itemInfo = this.itemInfo;
            // @ts-ignore
            stickerDisplay.asset = this.asset;

            // Remove Steam's inspect button
            const itemNameBlock = $J(this).parent().parent().find('.market_listing_item_name_block');
            itemNameBlock.parent().find('.market_listing_row_action')?.parent().remove();
            // Remove Steam's stickers and keychains
            itemNameBlock.parent().find('.market_listing_row_details')?.remove();

            // Only add if not already present
            if (!itemNameBlock.find('csfloat-sticker-display').length) {
                itemNameBlock.prepend(stickerDisplay);
            }

            CreateItemHoverFromContainer(
                g_rgAssets,
                elementId,
                this.asset.appid,
                this.asset.contextid,
                this.asset.id,
                this.asset.amount
            );
        }

        if (this.itemInfo) {
            gFilterService.onUpdate$.subscribe(() => {
                const colour = gFilterService.matchColour(this.itemInfo!, this.convertedPrice) || '';
                $J(this).parent().parent().css('background-color', colour);
                const textColour = colour ? pickTextColour(colour, '#8F98A0', '#484848') : '';
                $J(this).css('color', textColour);
            });
        }

        // Fetch bluegem data if needed
        if (this.itemInfo && this.asset && isBlueSkin(this.itemInfo)) {
            try {
                this.bluegemData = await ClientSend(FetchBluegem, {
                    iteminfo: this.itemInfo,
                });
            } catch (e: any) {
                console.error(`Failed to fetch bluegem for ${this.asset.id}: ${e.toString()}`);
                this.bluegemData = undefined;
            }
        } else {
            this.bluegemData = undefined;
        }

        if (
            MarketCheckHash &&
            defined(typeof BuyItemDialog) &&
            (!BuyItemDialog?.m_modal || !BuyItemDialog.m_modal.m_bVisible)
        ) {
            // Only check the hash if the item dialog has not been initialized OR
            // it is no longer visible. Prevents "freezing" the page with multiple
            // dialogs opening.
            MarketCheckHash();
        }

        // Make sure the parent containers can overflow for tooltips
        const parentContainer = $J(this).parent();
        if (parentContainer) {
            parentContainer.css('overflow', 'visible');
            parentContainer.parent().css('overflow', 'visible');
        }
    }

    render() {
        if (!this.inspectLink) {
            return html``;
        }

        if (!this.asset) {
            return nothing;
        }

        if (this.asset && !isSkin(this.asset) && !isCharm(this.asset)) {
            return nothing;
        }

        if (this.itemInfo && isSkin(this.asset)) {
            const fadePercentage = this.asset && getFadePercentage(this.asset, this.itemInfo);

            return html`
                <div class="float-row-wrapper">
                    ${this.renderFloatBar()}
                    <span style="display: block;">
                        Float: ${this.itemInfo.floatvalue.toFixed(14)} ${renderClickableRank(this.itemInfo)}
                    </span>
                    Paint Seed:
                    ${formatSeed(this.itemInfo)}${fadePercentage !== undefined
                        ? html`<br />
                              Fade: ${floor(fadePercentage, 5)}%`
                        : nothing}
                    ${this.renderBluegem()}
                </div>
            `;
        } else if (this.itemInfo && isCharm(this.asset)) {
            return html`
                <div class="float-row-wrapper">
                    Pattern: #${this.itemInfo.keychains?.length > 0 ? this.itemInfo.keychains[0].pattern : 'Unknown'}
                </div>
            `;
        } else if (this.error) {
            return html`<div style="color: orangered">CSFloat ${this.error}</div>`;
        } else {
            return html`<div>Loading...</div>`;
        }
    }

    renderBluegem(): TemplateResult<1> {
        if (!this.itemInfo || !this.bluegemData) {
            return html``;
        }

        // Some skins got only one blue value
        if (this.bluegemData.backside_blue === undefined) {
            return html`<div>Blue: ${this.bluegemData.playside_blue}%</div>`;
        }

        return html`<div>
            Blue (${this.bluegemData.placement}): ${this.bluegemData.playside_blue}% /
            ${this.bluegemData.backside_blue}%
        </div>`;
    }

    renderFloatBar(): TemplateResult<1> {
        if (!this.itemInfo) {
            return html``;
        }

        return html`
            <csfloat-float-bar
                float=${this.itemInfo.floatvalue}
                minFloat=${this.itemInfo.min}
                maxFloat=${this.itemInfo.max}
            >
            </csfloat-float-bar>
        `;
    }
}
