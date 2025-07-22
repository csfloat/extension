import {FloatElement} from '../custom';
import {CustomElement, InjectAfter, InjectionMode} from '../injectors';
import {html, css, TemplateResult, HTMLTemplateResult} from 'lit';
import {state} from 'lit/decorators.js';
import {InventoryAsset} from '../../types/steam';
import {gFloatFetcher} from '../../services/float_fetcher';
import {ItemInfo} from '../../bridge/handlers/fetch_inspect_info';
import {
    formatSeed,
    getFadePercentage,
    isSkin,
    renderClickableRank,
    floor,
    isCharm,
    isSellableOnCSFloat,
    isBlueSkin,
    isHighlightCharm,
} from '../../utils/skin';
import {Observe} from '../../utils/observers';
import {FetchStallResponse} from '../../bridge/handlers/fetch_stall';
import {gStallFetcher} from '../../services/stall_fetcher';
import {Contract} from '../../types/float_market';
import '../common/ui/floatbar';
import {ClientSend} from '../../bridge/client';
import {FetchBluegem, FetchBluegemResponse} from '../../bridge/handlers/fetch_bluegem';
import './list_item_modal';

/**
 * Why do we bind to iteminfo0 AND iteminfo1?
 *
 * Steam uses two divs that are interchanged (presumably to make a "fade" animation between them) for each selected
 * item click.
 */
@CustomElement()
@InjectAfter('div.app730#iteminfo0_content .item_desc_description div.item_desc_game_info', InjectionMode.CONTINUOUS)
@InjectAfter('div.app730#iteminfo1_content .item_desc_description div.item_desc_game_info', InjectionMode.CONTINUOUS)
export class SelectedItemInfo extends FloatElement {
    static styles = [
        ...FloatElement.styles,
        css`
            .container {
                margin-bottom: 10px;
            }

            .market-btn-container {
                margin: 10px 0 10px 0;
                padding: 5px;
                width: fit-content;
                border: solid 1px rgb(56 64 77);
                background-color: rgb(43 48 57);
                border-radius: 3px;
            }

            .market-btn {
                font-size: 15px;
                display: flex;
                align-items: center;
                color: #ebebeb;
                text-decoration: none;
            }
        `,
    ];

    @state()
    private itemInfo: ItemInfo | undefined;

    @state()
    private loading: boolean = false;

    @state()
    private stall: FetchStallResponse | undefined;

    @state()
    private showListModal: boolean = false;

    private bluegemData: FetchBluegemResponse | undefined;

    get asset(): InventoryAsset | undefined {
        return g_ActiveInventory?.selectedItem;
    }

    get inspectLink(): string | undefined {
        if (!this.asset) return;

        if (!this.asset.description?.actions || this.asset.description?.actions?.length === 0) return;

        if (!g_ActiveInventory?.m_owner) {
            return;
        }

        return this.asset.description
            ?.actions![0].link.replace('%owner_steamid%', g_ActiveInventory.m_owner.strSteamId!)
            .replace('%assetid%', this.asset.assetid!);
    }

    get stallListing(): Contract | undefined {
        if (!this.stall) {
            return;
        }

        return (this.stall.data || []).find((e) => e.item.asset_id === this.asset?.assetid);
    }

    protected render(): HTMLTemplateResult {
        if (this.loading) {
            return html`<div>Loading...</div>`;
        }

        if (!this.asset?.description) {
            return html``;
        }

        const containerChildren: TemplateResult[] = [];

        if (isSkin(this.asset.description) && this.itemInfo) {
            containerChildren.push(this.renderFloatBar());
            containerChildren.push(
                html`<div>Float: ${this.itemInfo.floatvalue.toFixed(14)} ${renderClickableRank(this.itemInfo)}</div>`
            );

            containerChildren.push(html`<div>Paint Seed: ${formatSeed(this.itemInfo)}</div>`);

            // Fade skins
            const fadePercentage = getFadePercentage(this.asset.description, this.itemInfo)?.percentage;
            if (fadePercentage !== undefined) {
                containerChildren.push(html`<div>Fade: ${floor(fadePercentage, 5)}%</div>`);
            }

            // All case hardened and heat treated skins except gloves
            if (isBlueSkin(this.itemInfo)) {
                containerChildren.push(this.renderBluegem());
            }
        } else if (isCharm(this.asset.description) && this.itemInfo && !isHighlightCharm(this.asset.description)) {
            containerChildren.push(
                html`<div>
                    Pattern: #${this.itemInfo.keychains?.length > 0 ? this.itemInfo.keychains[0].pattern : 'Unknown'}
                </div>`
            );
        }

        if (isSellableOnCSFloat(this.asset.description)) {
            containerChildren.push(html`${this.renderListOnCSFloat()} ${this.renderFloatMarketListing()}`);
        }

        if (containerChildren.length === 0) {
            return html``;
        }

        return html` <div class="container">${containerChildren}</div> `;
    }

    renderFloatBar(): TemplateResult<1> {
        if (!this.itemInfo || !this.itemInfo.floatvalue) {
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

    renderFloatMarketListing(): TemplateResult<1> {
        if (!this.stallListing) {
            return html``;
        }

        return html`
            <div class="market-btn-container">
                <a class="market-btn" href="https://csfloat.com/item/${this.stallListing.id}" target="_blank">
                    <img src="https://csfloat.com/assets/logo/full_white.png" height="21" style="margin-right: 5px;" />
                    <span>
                        Listed for
                        <b>$${(this.stallListing.price / 100).toFixed(2)}</b>
                    </span>
                </a>
            </div>
        `;
    }

    renderListOnCSFloat(): TemplateResult<1> {
        if (this.stallListing) {
            // Don't tell them to list it if it's already listed...
            return html``;
        }

        if (g_ActiveInventory?.m_owner?.strSteamId !== g_steamID) {
            // Not the signed-in user, don't show
            return html``;
        }

        if (!this.asset?.description?.tradable) {
            // Don't show if item isn't tradable
            return html``;
        }

        return html`
            <div class="market-btn-container">
                <a class="market-btn" @click="${() => (this.showListModal = true)}">
                    <span>List on </span>
                    <img src="https://csfloat.com/assets/logo/full_white.png" height="21" style="margin-left: 5px;" />
                </a>
            </div>
            ${this.showListModal && this.asset && (this.itemInfo || !isSkin(this.asset.description))
                ? html`<csfloat-list-item-modal
                      .asset="${this.asset}"
                      .itemInfo="${this.itemInfo}"
                      @close="${this.handleModalClose}"
                  ></csfloat-list-item-modal>`
                : ''}
        `;
    }

    async processSelectChange() {
        // Reset state in-case they swap between skin and non-skin
        this.itemInfo = undefined;

        if (!this.asset) return;

        // Guarantees a re-render for items without inspect links
        this.loading = true;

        if (
            this.inspectLink &&
            (isSkin(this.asset.description) ||
                (isCharm(this.asset.description) && !isHighlightCharm(this.asset.description)))
        ) {
            try {
                this.itemInfo = await gFloatFetcher.fetch({
                    link: this.inspectLink,
                });
            } catch (e: any) {
                console.error(`Failed to fetch float for ${this.asset.assetid}: ${e.toString()}`);
            }

            // Fetch bluegem data if needed
            if (this.itemInfo && isBlueSkin(this.itemInfo)) {
                try {
                    this.bluegemData = await ClientSend(FetchBluegem, {
                        iteminfo: this.itemInfo,
                    });
                } catch (e: any) {
                    console.error(`Failed to fetch bluegem for ${this.asset.assetid}: ${e.toString()}`);
                    this.bluegemData = undefined;
                }
            } else {
                this.bluegemData = undefined;
            }
        }
        this.loading = false;
    }

    connectedCallback() {
        super.connectedCallback();

        // For the initial load, in case an item is pre-selected
        this.processSelectChange();

        Observe(
            () => this.asset,
            () => {
                this.processSelectChange();
            }
        );

        this.refreshStallData();

        // Make sure the parent container can overflow
        const parentContainer = this.closest<HTMLElement>('.item_desc_content');
        if (parentContainer) {
            parentContainer.style.overflow = 'visible';
        }
    }

    private handleModalClose(e: CustomEvent) {
        this.showListModal = false;

        // If an item was listed, refresh the stall data
        if (e.detail?.listingId) {
            this.refreshStallData();
        }
    }

    private refreshStallData() {
        if (g_ActiveInventory?.m_owner?.strSteamId) {
            gStallFetcher
                .fetch({steam_id64: g_ActiveInventory.m_owner.strSteamId}, true)
                .then((stall) => (this.stall = stall))
                .catch((error) => {
                    console.error('Failed to refresh stall data:', error);
                });
        } else {
            console.error('Failed to refresh stall data: No steam ID found');
        }
    }
}
