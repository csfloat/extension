import {FloatElement} from '../custom';
import {CustomElement, InjectBefore} from '../injectors';
import {css, html, HTMLTemplateResult} from 'lit';
import {ClientSend} from '../../bridge/client';
import {FetchPendingTrades, FetchPendingTradesResponse} from '../../bridge/handlers/fetch_pending_trades';
import {Trade, TradeState} from '../../types/float_market';
import {state} from 'lit/decorators.js';
import {Observe} from '../../utils/observers';

import '../common/ui/steam-button';
import {AppId, ContextId} from '../../types/steam_constants';

@CustomElement()
@InjectBefore('div.trade_area')
export class AutoFill extends FloatElement {
    @state()
    private pendingTradesResponse: FetchPendingTradesResponse | undefined;

    static styles = [
        ...FloatElement.styles,
        css`
            .container {
                margin-top: 10px;
                margin-bottom: 10px;
                padding: 15px;
                background-color: rgb(48, 48, 48);
                color: white;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .container.warning {
                background-color: rgb(179, 0, 0);
            }

            .float-icon {
                float: left;
            }

            .item-name {
                font-size: 18px;
                margin-left: 15px;
                line-height: 32px;
            }

            .sale-info {
                padding-left: 45px;
                color: darkgrey;
            }
        `,
    ];

    async connectedCallback() {
        super.connectedCallback();

        try {
            this.pendingTradesResponse = await ClientSend(FetchPendingTrades, {});
        } catch (e: any) {
            console.error(
                'failed to fetch pending trades on CSGOFloat Market, they are likely not logged in.',
                e.toString()
            );
        }

        Observe(
            () => g_rgCurrentTradeStatus.me.assets.length,
            () => {
                // Items they are giving changed, we can potentially hide/show an auto-fill dialog
                this.requestUpdate();
            }
        );
    }

    renderAutoFillDialog(trade: Trade): HTMLTemplateResult {
        if (trade.state !== TradeState.PENDING) {
            // Make sure they accepted the sale on CSGOFloat first
            return html``;
        }

        const item = trade.contract.item;

        if (g_rgCurrentTradeStatus.me.assets.find((a) => a.assetid === item.asset_id)) {
            // Item is already included in the trade offer
            return html``;
        }

        return html`
            <div class="container">
                <div>
                    <div class="float-icon">
                        <img
                            src="https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/79/798a12316637ad8fbb91ddb7dc63f770b680bd19_full.jpg"
                            style="height: 32px;"
                        />
                    </div>
                    <span class="item-name"> ${item.market_hash_name} </span>
                    <div class="sale-info">
                        Detected Sale (Float: ${item.float_value.toFixed(12)}, Seed: ${item.paint_seed})
                    </div>
                </div>
                <csgofloat-steam-button
                    .text="${'Auto-Fill'}"
                    @click="${() => this.autoFill(trade)}"
                ></csgofloat-steam-button>
            </div>
        `;
    }

    /**
     * Show a warning to users if trade includes item with csgofloat note that doesn't match an existing sale
     *
     * Tries to prevent scenarios where malicious actors send offer with CSGOFloat text requesting an item
     */
    showWarningDialog(): HTMLTemplateResult {
        if (!this.hasAutoFillText()) {
            return html``;
        }

        const hasItemWithNoSale = g_rgCurrentTradeStatus.me.assets.find(
            (a) => !this.pendingTradesResponse?.trades_to_send.find((b) => b.contract.item.asset_id === a.assetid)
        );

        if (!hasItemWithNoSale) {
            return html``;
        }

        return html`
            <div class="container warning">
                <div>
                    <div class="float-icon">
                        <img
                            src="https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/79/798a12316637ad8fbb91ddb7dc63f770b680bd19_full.jpg"
                            style="height: 32px;"
                        />
                    </div>
                    <span class="item-name"> Warning! </span>
                    <div class="sale-info">
                        Some of the items in the offer were not purchased from you on CSGOFloat Market (or you're logged
                        into the wrong account)
                    </div>
                </div>
            </div>
        `;
    }

    protected render(): HTMLTemplateResult {
        if (!this.pendingTradesResponse) return html``;

        return html`
            ${this.pendingTradesResponse.trades_to_send.map((e) => this.renderAutoFillDialog(e))}
            ${this.showWarningDialog()}
        `;
    }

    autoFill(trade: Trade) {
        $J('#inventory_select_your_inventory').click();
        const el = UserYou?.findAsset(AppId.CSGO, ContextId.PRIMARY, trade.contract.item.asset_id)?.element;
        if (!el) {
            console.error('failed to find asset element for id ' + trade.contract.item.asset_id);
            return;
        }

        MoveItemToTrade(el);

        const note = document.getElementById('trade_offer_note');
        if (note) {
            (
                note as HTMLTextAreaElement
            ).value = `CSGOFloat Market Trade Offer #${trade.id} \n\nThanks for using CSGOFloat!`;
        }
    }

    hasAutoFillText(): boolean {
        const tradeMessages = document.getElementsByClassName('included_trade_offer_note_ctn');
        if (tradeMessages.length > 0) {
            const sanitized = (tradeMessages[0] as HTMLElement).innerText.trim().replace(/ /g, '').toLowerCase();

            return sanitized.includes('csgofloat') || sanitized.includes('floatmarket');
        }

        return false;
    }
}
