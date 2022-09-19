import {FloatElement} from "../custom";
import {CustomElement, InjectAppend, InjectionMode} from "../injectors";
import {html, css} from "lit";
import {state} from "lit/decorators.js";
import {cache} from "decorator-cache-getter";
import {InventoryAsset} from "../../types/steam";
import {gFloatFetcher} from "../../float_fetcher/float_fetcher";
import {ItemInfo} from "../../bridge/handlers/fetch_inspect_info";
import {formatFloat, formatSeed} from "../../utils/item_formatters";

@CustomElement()
@InjectAppend('div.inventory_page:not([style*="display: none"]) .itemHolder div.app730', InjectionMode.CONTINUOUS)
export class BoxMetadata extends FloatElement {
    static styles = css`
      .float {
        position: absolute;
        bottom: 3px;
        right: 3px;
        font-size: 12px;
      }

      .seed {
        position: absolute;
        top: 3px;
        right: 3px;
        font-size: 12px;
      }
    `;

    @state()
    private itemInfo: ItemInfo|undefined;

    @cache
    get assetId(): string|undefined {
        return $J(this).parent().attr('id')?.split('_')[2];
    }

    get asset(): InventoryAsset|undefined {
        if (!this.assetId) return;

        return g_ActiveInventory?.m_rgAssets[this.assetId];
    }

    get inspectLink(): string|undefined {
        if (!this.asset) return;

        if (!this.asset.description?.actions || this.asset.description?.actions?.length === 0) return;

        return this.asset.description?.actions![0].link
            .replace('%owner_steamid%', g_ActiveInventory?.m_owner.strSteamId!)
            .replace('%assetid%', this.assetId!);
    }

    protected render(): unknown {
        if (!this.itemInfo) return html``;

        return html`
            <span>
                <span class="float">${formatFloat(this.itemInfo, 6)}</span>
                <span class="seed">${formatSeed(this.itemInfo)}</span>
            </span>
        `;
    }

    async connectedCallback() {
        super.connectedCallback();

        if (!this.asset) return;

        if (!BoxMetadata.isSkin(this.asset)) return;

        // Commodities won't have inspect links
        if (!this.inspectLink) return;

        try {
            this.itemInfo = await gFloatFetcher.fetch({
                link: this.inspectLink
            });
        } catch (e: any) {
            console.error(`Failed to fetch float for ${this.assetId}: ${e.toString()}`);
        }
    }

    static isSkin(asset: InventoryAsset): boolean {
        return !!asset.description.tags?.find(
            a => a.category === 'Weapon'
                || (a.category === 'Type' && a.internal_name === 'Type_Hands'));
    }
}
