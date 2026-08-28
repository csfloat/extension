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
import {environment} from '../../../environment';
import {gSkinCraftEmbed} from '../../services/skincraft_embed';
import {getActiveInventoryAssetProperties, toSkinCraftItem} from '../../services/skincraft_inventory_targets';
import type {SkinCraftItem} from '../../services/skincraft_viewer_protocol';
import {gWebGpuAvailability} from '../../services/webgpu_availability';
import type {WebGpuAvailability} from '../../services/webgpu_availability';
import {webGpuGuidance} from '../../utils/webgpu_guidance';
import './list_item_modal';

/**
 * Why do we bind to iteminfo0 AND iteminfo1?
 *
 * Steam uses two divs that are interchanged (presumably to make a "fade" animation between them) for each selected
 * item click.
 */
@CustomElement()
@InjectAfter(
    'div#iteminfo0 div:has(> a[href^="https://store.steampowered.com/app/730/CounterStrike_2"] > img)',
    InjectionMode.CONTINUOUS
)
@InjectAfter(
    'div#iteminfo1 div:has(> a[href^="https://store.steampowered.com/app/730/CounterStrike_2"] > img)',
    InjectionMode.CONTINUOUS
)
export class SelectedItemInfo extends FloatElement {
    static styles = [
        ...FloatElement.styles,
        css`
            .container {
                margin-bottom: 10px;
            }

            .market-btn-row {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 10px;
                margin: 14px 0 10px;
            }

            .market-btn-container {
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

            .view-3d-btn {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                height: 32px;
                padding: 0 12px;
                font-size: 13px;
                font-weight: 600;
                color: #f5f8ff;
                background-color: #5155eb;
                border: 0;
                border-radius: 8px;
                cursor: pointer;
                font-family: inherit;
                text-decoration: none;
                transition:
                    filter 180ms ease,
                    transform 180ms ease;
                box-shadow:
                    0 4px 12px hsl(0 0% 0% / 0.22),
                    0 1px 2px hsl(0 0% 0% / 0.16),
                    inset 0 1px 0 rgba(255, 255, 255, 0.22);

                img {
                    filter: brightness(0) invert(1);
                }

                &:hover {
                    filter: brightness(1.1);
                }

                &:active {
                    transform: scale(0.98);
                    filter: brightness(0.95);
                }

                &.unavailable {
                    cursor: not-allowed;
                    opacity: 0.55;

                    &:hover {
                        filter: none;
                    }

                    &:active {
                        transform: none;
                        filter: none;
                    }
                }
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

    @state()
    private webGpuStatus: WebGpuAvailability = gWebGpuAvailability.status;

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

        const link = this.asset.description?.actions![0].link;
        if (link.includes('%propid:6%')) {
            const propId = this.asset.asset_properties?.find((p) => p.propertyid === 6)?.string_value;
            if (!propId || !link) return;
            return link.replace('%propid:6%', propId);
        }
        return link;
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
            const fadePercentage = getFadePercentage(
                this.asset.description.market_hash_name,
                this.itemInfo
            )?.percentage;
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

        if (this.canListOnCSFloat || this.show3dButton || this.stallListing) {
            // One flex row for every action: the market action (list button or active listing —
            // mutually exclusive) keeps the left slot in both states, and nothing wraps while
            // there's room. The modal lives outside the row: as a flex item its host would add a
            // gap and nudge the 3D button whenever it mounts.
            containerChildren.push(
                html`<div class="market-btn-row">
                        ${this.renderListOnCSFloat()} ${this.renderFloatMarketListing()} ${this.renderViewIn3D()}
                    </div>
                    ${this.renderListModal()}`
            );
        }

        if (containerChildren.length === 0) {
            return html``;
        }

        return html` <div class="container">${containerChildren}</div> `;
    }

    renderFloatBar(): TemplateResult<1> {
        if (
            !this.itemInfo ||
            !this.itemInfo.floatvalue ||
            this.itemInfo.min === undefined ||
            this.itemInfo.max === undefined
        ) {
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

    private get canListOnCSFloat(): boolean {
        return (
            !!this.asset?.description &&
            isSellableOnCSFloat(this.asset.description) &&
            !this.stallListing &&
            g_ActiveInventory?.m_owner?.strSteamId === g_steamID &&
            !!this.asset.description.tradable
        );
    }

    private get skinCraftItem(): SkinCraftItem | undefined {
        return toSkinCraftItem(this.asset, getActiveInventoryAssetProperties(g_ActiveInventory, this.asset?.assetid));
    }

    /**
     * The button renders for any item SkinCraft can show; WebGPU capability only decides enabled
     * vs disabled-with-guidance (hiding it entirely drew user feedback on the csfloat.com
     * integration). It stays hidden while the probe settles so it never appears and then changes.
     */
    private get show3dButton(): boolean {
        return this.webGpuStatus !== 'checking' && !!this.skinCraftItem;
    }

    private get canRender3d(): boolean {
        return this.webGpuStatus === 'available';
    }

    renderViewIn3D(): TemplateResult<1> {
        if (!this.show3dButton) {
            return html``;
        }

        if (!this.canRender3d) {
            const reason = gWebGpuAvailability.unavailableReason ?? 'no-webgpu';
            // The tooltip lives on a wrapper, not the button: hint.css renders it as the host's
            // ::after, so on the button it would inherit the muted opacity, and the directive's
            // aria-label would replace the button's "View in 3D" accessible name.
            return html`
                <span>
                    ${this.tooltip(webGpuGuidance(reason), 'hint--large')}
                    <button class="view-3d-btn unavailable" type="button" aria-disabled="true">
                        <img src="${environment.skincraft_embed_origin}/icon.svg" height="22" alt="" />
                        <span>View in 3D</span>
                    </button>
                </span>
            `;
        }

        return html`
            <button class="view-3d-btn" type="button" @click="${this.handleViewIn3D}">
                <img src="${environment.skincraft_embed_origin}/icon.svg" height="22" alt="" />
                <span>View in 3D</span>
            </button>
        `;
    }

    renderListOnCSFloat(): TemplateResult<1> {
        if (!this.canListOnCSFloat) {
            return html``;
        }

        return html`
            <div class="market-btn-container">
                <a class="market-btn" @click="${() => (this.showListModal = true)}">
                    <span>List on </span>
                    <img src="https://csfloat.com/assets/logo/full_white.png" height="21" style="margin-left: 5px;" />
                </a>
            </div>
        `;
    }

    renderListModal(): TemplateResult<1> {
        if (!this.showListModal || !this.asset || (!this.itemInfo && isSkin(this.asset.description))) {
            return html``;
        }

        return html`<csfloat-list-item-modal
            .asset="${this.asset}"
            .itemInfo="${this.itemInfo}"
            @close="${this.handleModalClose}"
        ></csfloat-list-item-modal>`;
    }

    private handleViewIn3D(): void {
        const item = this.skinCraftItem;
        if (item) gSkinCraftEmbed.open(item);
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
                    asset_id: this.asset.assetid,
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

    private async resolveWebGpuStatus(): Promise<void> {
        if (this.webGpuStatus === 'checking') this.webGpuStatus = await gWebGpuAvailability.settled();
    }

    connectedCallback() {
        super.connectedCallback();

        // Settles once per session; the 3D button stays hidden until it does
        void this.resolveWebGpuStatus();

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
            this.refreshStallData(true);
        }
    }

    private refreshStallData(forceRefresh = false) {
        if (g_ActiveInventory?.m_owner?.strSteamId) {
            gStallFetcher
                .fetch({steam_id64: g_ActiveInventory.m_owner.strSteamId}, forceRefresh)
                .then((stall) => (this.stall = stall))
                .catch((error) => {
                    console.error('Failed to refresh stall data:', error);
                });
        } else {
            console.error('Failed to refresh stall data: No steam ID found');
        }
    }
}
