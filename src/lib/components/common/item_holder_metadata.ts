import {FloatElement} from "../custom";
import {html, css} from "lit";
import {state} from "lit/decorators.js";
import {Asset} from "../../types/steam";
import {gFloatFetcher} from "../../float_fetcher/float_fetcher";
import {ItemInfo} from "../../bridge/handlers/fetch_inspect_info";
import {formatFloatWithRank, formatSeed, getLowestRank} from "../../utils/skin";
import {isSkin} from "../../utils/skin";
import {getRankColour} from "../../utils/ranks";
import {Observe} from "../../utils/observers";

// Generic annotator of item holder metadata (float, seed, etc...)
// Must be extended to use as a component
export abstract class ItemHolderMetadata extends FloatElement {
    static styles = [...FloatElement.styles, css`
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
    `];

    @state()
    private itemInfo: ItemInfo|undefined;

    get assetId(): string|undefined {
        return $J(this).parent().attr('id')?.split('_')[2];
    }

    abstract get asset(): Asset|undefined;
    abstract get ownerSteamId(): string|undefined;

    get inspectLink(): string|undefined {
        if (!this.asset) return;

        if (!this.asset?.actions || this.asset?.actions?.length === 0) return;

        if (!this.ownerSteamId) {
            return;
        }

        return this.asset?.actions![0].link
            .replace('%owner_steamid%', this.ownerSteamId)
            .replace('%assetid%', this.assetId!);
    }

    protected render(): unknown {
        if (!this.itemInfo) return html``;

        return html`
            <span>
                <span class="float">${formatFloatWithRank(this.itemInfo, 6)}</span>
                <span class="seed">${formatSeed(this.itemInfo)}</span>
            </span>
        `;
    }

    async connectedCallback() {
        super.connectedCallback();

        if (this.inspectLink) {
            this.onInit();
        } else {
            // Wait until the asset exists
            Observe(() => this.inspectLink, () => {
                if (this.inspectLink) {
                    this.onInit();
                }
            }, 200);
        }
    }

    async onInit() {
        if (!this.asset) return;

        if (!isSkin(this.asset)) return;

        // Commodities won't have inspect links
        if (!this.inspectLink) return;

        try {
            this.itemInfo = await gFloatFetcher.fetch({
                link: this.inspectLink
            });
        } catch (e: any) {
            console.error(`Failed to fetch float for ${this.assetId}: ${e.toString()}`);
        }

        if (this.itemInfo) {
            this.annotateRankShine(this.itemInfo);
        }
    }

    annotateRankShine(info: ItemInfo) {
        const rank = getLowestRank(info);
        if (!rank || rank > 5) {
            return;
        }

        // Make the inventory box coloured ;)
        $J(this).parent().css('color', 'black');
        $J(this).parent().find('img').css('background-color', getRankColour(rank));
        $J(this).parent().addClass('csgofloat-shine');
    }
}
