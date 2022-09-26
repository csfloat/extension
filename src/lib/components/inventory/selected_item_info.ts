import {FloatElement} from "../custom";
import {CustomElement, InjectAfter, InjectionMode} from "../injectors";
import {html, css} from "lit";
import {state} from "lit/decorators.js";
import {InventoryAsset} from "../../types/steam";
import {gFloatFetcher} from "../../float_fetcher/float_fetcher";
import {ItemInfo} from "../../bridge/handlers/fetch_inspect_info";
import {formatSeed, isSkin, renderClickableRank} from "../../utils/skin";
import {Observe} from "../../utils/observers";

/**
 * Why do we bind to iteminfo0 AND iteminfo1?
 *
 * Steam uses two divs that are interchanged (presumably to make a "fade" animation between them) for each selected
 * item click.
 */
@CustomElement()
@InjectAfter('div#iteminfo0_content .item_desc_description div.item_desc_game_info', InjectionMode.CONTINUOUS)
@InjectAfter('div#iteminfo1_content .item_desc_description div.item_desc_game_info', InjectionMode.CONTINUOUS)
export class SelectedItemInfo extends FloatElement {
    static styles = css`
      .container {
        margin-bottom: 10px;
      }
    `;

    @state()
    private itemInfo: ItemInfo|undefined;

    @state()
    private loading: boolean = false;

    get asset(): InventoryAsset|undefined {
        return g_ActiveInventory?.selectedItem;
    }

    get inspectLink(): string|undefined {
        if (!this.asset) return;

        if (!this.asset.description?.actions || this.asset.description?.actions?.length === 0) return;

        return this.asset.description?.actions![0].link
            .replace('%owner_steamid%', g_ActiveInventory?.m_owner.strSteamId!)
            .replace('%assetid%', this.asset.assetid!);
    }

    protected render(): unknown {
        if (this.loading) {
            return html`<div>Loading...</div>`;
        }

        if (!this.itemInfo) {
            return html``;
        }

        return html`
            <div class="container">
                <div>Float: ${this.itemInfo.floatvalue.toFixed(14)} ${renderClickableRank(this.itemInfo)}</div>
                <div>Paint Seed: ${formatSeed(this.itemInfo)}</div>
            </div>
        `;
    }

    async processSelectChange() {
        if (!this.asset) return;

        if (!isSkin(this.asset)) return;

        // Commodities won't have inspect links
        if (!this.inspectLink) return;

        try {
            this.loading = true;
            this.itemInfo = await gFloatFetcher.fetch({
                link: this.inspectLink
            });
        } catch (e: any) {
            console.error(`Failed to fetch float for ${this.asset.assetid}: ${e.toString()}`);
        } finally {
            this.loading = false;
        }
    }

    connectedCallback() {
        super.connectedCallback();

        // For the initial load, in case an item is pre-selected
        this.processSelectChange();

        Observe(() => this.asset, () => {
            this.processSelectChange();
        });

    }
}
