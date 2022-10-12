import {FloatElement} from '../custom';
import {CustomElement, InjectAfter, InjectionMode} from '../injectors';
import {css, html, HTMLTemplateResult, nothing} from 'lit';
import {state} from 'lit/decorators.js';
import {InventoryAsset} from '../../types/steam';
import {Observe} from '../../utils/observers';
import {gFallbackInventoryFetcher} from '../../services/fallback_inventory_fetcher';

/**
 * Annotates the expiration time of an untradable item if relevant
 */
@CustomElement()
@InjectAfter('div#iteminfo0_content .item_desc_description', InjectionMode.CONTINUOUS)
@InjectAfter('div#iteminfo1_content .item_desc_description', InjectionMode.CONTINUOUS)
export class SelectedItemInfoExpiry extends FloatElement {
    static styles = [
        ...FloatElement.styles,
        css`
            .container {
                margin-top: 16px;
                margin-bottom: 16px;
            }

            .descriptor {
                color: rgb(255, 64, 64);
            }
        `,
    ];

    @state()
    private expiresAt: string | undefined;

    get asset(): InventoryAsset | undefined {
        return g_ActiveInventory?.selectedItem;
    }

    get ownerId(): string | undefined {
        return g_ActiveInventory?.m_owner?.strSteamId;
    }

    protected render(): HTMLTemplateResult {
        if (!this.expiresAt) {
            return html``;
        }

        // @ts-ignore Date.toGMTString() does exist on modern browsers
        const formatted = new Date(this.expiresAt).toGMTString();

        return html`<div class="container">
            <div class="descriptor">Tradable After ${formatted}</div>
        </div> `;
    }

    async processSelectChange() {
        // Reset...
        this.expiresAt = undefined;

        if (!this.ownerId || !this.asset) {
            return;
        }

        const resp = await gFallbackInventoryFetcher.fetch({steamid_64: this.ownerId});

        const assetDetails = resp.rgInventory && resp.rgInventory[this.asset.assetid];
        if (!assetDetails) return;

        const description =
            resp.rgDescriptions && resp.rgDescriptions[`${assetDetails.classid}_${assetDetails.instanceid}`];
        if (!description) return;

        if (!description.tradable) {
            this.expiresAt = description.cache_expiration;
        }
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
    }
}
