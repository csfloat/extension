import {FloatElement} from '../custom';
import {CustomElement, InjectBefore} from '../injectors';
import {css, html, HTMLTemplateResult} from 'lit';
import {ClientSend} from '../../bridge/client';
import {FetchPendingTrades, FetchPendingTradesResponse} from '../../bridge/handlers/fetch_pending_trades';
import {Item, Trade, TradeState} from '../../types/float_market';
import {state} from 'lit/decorators.js';
import {Observe} from '../../utils/observers';

import '../common/ui/steam-button';
import {AppId, ContextId, TradeOfferState} from '../../types/steam_constants';
import {HasPermissions} from '../../bridge/handlers/has_permissions';
import {hasQueryParameter} from '../../utils/browser';

@CustomElement()
@InjectBefore('div.trade_area')
export class AutoFill extends FloatElement {
    @state()
    private pendingTradesResponse: FetchPendingTradesResponse | undefined;

    @state()
    private pendingTradesFailureReason: string | undefined;

    @state()
    private hasPermissions = false;

    static styles = [
        ...FloatElement.styles,
        css`
            .container {
                margin-top: 10px;
                margin-bottom: 10px;
                padding: 15px;
                background-color: #15171c;
                color: white;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-radius: 6px;
            }

            .container.warning {
                background-color: rgb(179, 0, 0);
            }

            .notice {
                background-color: #6775e1;
                padding: 6px;
                border-radius: 6px;
                display: flex;
                gap: 10px;
                align-items: center;
                margin-top: 10px;
                margin-bottom: 10px;
                font-size: 15px;
                color: white;
            }

            .float-icon {
                float: left;
            }

            .float-icon > img {
                border-radius: 5px;
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
            const hasPermissions = await ClientSend(HasPermissions, {
                permissions: ['alarms'],
                origins: ['*://*.steampowered.com/*'],
            });
            this.hasPermissions = hasPermissions.granted;
        } catch (e) {
            console.error('failed to check permissions', e);
        }

        try {
            this.pendingTradesResponse = await ClientSend(FetchPendingTrades, {limit: 1000});
        } catch (e: any) {
            console.error(
                'failed to fetch pending trades on CSFloat Market, they are likely not logged in.',
                e.toString()
            );
            this.pendingTradesFailureReason = e.toString();
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
            // Make sure they accepted the sale on CSFloat first
            return html``;
        }

        if (
            [TradeOfferState.Active, TradeOfferState.Accepted, TradeOfferState.CreatedNeedsConfirmation].includes(
                trade.steam_offer?.state
            )
        ) {
            // Already had a trade offer created
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
                            src="https://avatars.cloudflare.steamstatic.com/6ab5219d0bbcce1300a2c6d7cbc638da52edda48_full.jpg"
                            style="height: 32px;"
                        />
                    </div>
                    <span class="item-name"> ${item.market_hash_name} </span>
                    ${this.getSaleInfo(item)}
                </div>
                <csfloat-steam-button
                    .text="${'Auto-Fill'}"
                    @click="${() => this.autoFill(trade)}"
                ></csfloat-steam-button>
            </div>
        `;
    }

    renderBulkAutoFillDialog(rawTrades: Trade[]): HTMLTemplateResult {
        // Remove items already included and non-pending
        const fTrades = rawTrades
            .filter(
                (trade) => !g_rgCurrentTradeStatus.me.assets.find((a) => a.assetid === trade.contract.item.asset_id)
            )
            .filter((trade) => trade.state === TradeState.PENDING)
            .filter((trade) => {
                if (!trade.steam_offer?.id) {
                    // Trade offer hasn't been created yet
                    return true;
                }

                // Only include trades with previous "non-active" trade offers
                return ![
                    TradeOfferState.Active,
                    TradeOfferState.Accepted,
                    TradeOfferState.CreatedNeedsConfirmation,
                ].includes(trade.steam_offer?.state);
            });

        // Bulk implies > 1
        if (fTrades.length <= 1) {
            return html``;
        }

        const totalValue = fTrades.map((e) => e.contract.price).reduce((acc, e) => acc + e, 0);

        return html`
            <div class="container" style="margin: 20px 0 20px 0;">
                <div>
                    <div class="float-icon">
                        <img
                            src="https://avatars.cloudflare.steamstatic.com/6ab5219d0bbcce1300a2c6d7cbc638da52edda48_full.jpg"
                            style="height: 32px;"
                        />
                    </div>
                    <span class="item-name"> Detected ${fTrades.length} Sales </span>
                    <div class="sale-info">Total Value: $${(totalValue / 100).toFixed(2)}</div>
                </div>
                <csfloat-steam-button
                    .text="${'Auto-Fill All Items'}"
                    @click="${() => this.autoFillAll(fTrades)}"
                ></csfloat-steam-button>
            </div>
        `;
    }

    getSaleInfo(item: Item): HTMLTemplateResult {
        if (item.float_value) {
            return html`
                <div class="sale-info">
                    Detected Sale (Float: ${item.float_value.toFixed(12)}, Seed: ${item.paint_seed})
                </div>
            `;
        } else {
            return html` <div class="sale-info">Detected Sale (Asset ID: ${item.asset_id})</div> `;
        }
    }

    /**
     * Show a warning to users if trade includes item with csfloat note that doesn't match an existing sale
     *
     * Tries to prevent scenarios where malicious actors send offer with CSFloat text requesting an item
     */
    showWarningDialog(): HTMLTemplateResult {
        if (!this.hasAutoFillText()) {
            return html``;
        }

        const hasItemWithNoSale = g_rgCurrentTradeStatus.me.assets.find(
            (a) => !this.pendingTradesResponse?.trades.find((b) => b.contract.item.asset_id === a.assetid)
        );

        if (!hasItemWithNoSale) {
            return html``;
        }

        return html`
            <div class="container warning">
                <div>
                    <div class="float-icon">
                        <img
                            src="https://avatars.cloudflare.steamstatic.com/6ab5219d0bbcce1300a2c6d7cbc638da52edda48_full.jpg"
                            style="height: 32px;"
                        />
                    </div>
                    <span class="item-name"> Warning! </span>
                    <div class="sale-info">
                        Some of the items in the offer were not purchased from you on CSFloat Market (or you're logged
                        into the wrong account)
                    </div>
                </div>
            </div>
        `;
    }

    showPermissionWarningDialog(tradesToBuyer: Trade[]): HTMLTemplateResult {
        if (this.hasPermissions || tradesToBuyer.length === 0) {
            return html``;
        }

        return html`
            <div class="container warning">
                <div>
                    <div class="float-icon">
                        <img
                            src="https://avatars.cloudflare.steamstatic.com/6ab5219d0bbcce1300a2c6d7cbc638da52edda48_full.jpg"
                            style="height: 32px;"
                        />
                    </div>
                    <span class="item-name"> Warning! </span>
                    <div class="sale-info">
                        You have not setup trade verification for CSFloat, you must enable it on your
                        <a href="https://steamcommunity.com/id/me/tradeoffers/" target="_blank">Trade Offers page</a>!
                    </div>
                </div>
            </div>
        `;
    }

    showExpectedAutoFillFailWarning(): HTMLTemplateResult {
        if (!this.pendingTradesFailureReason || !hasQueryParameter('autofill')) {
            // Loaded correctly or not applicable (no custom auto fill query param)
            return html``;
        }

        return html`
            <div class="container warning">
                <div>
                    <div class="float-icon">
                        <img
                            src="https://avatars.cloudflare.steamstatic.com/6ab5219d0bbcce1300a2c6d7cbc638da52edda48_full.jpg"
                            style="height: 32px;"
                        />
                    </div>
                    <span class="item-name"> Warning! </span>
                    <div class="sale-info">
                        Your CSFloat extension isn't properly able to fetch pending sales, DO NOT send items manually.
                        Make sure you're logged into CSFloat!
                    </div>
                </div>
            </div>
        `;
    }

    showAutoFillInfoDialog(tradesToBuyer: Trade[]): HTMLTemplateResult {
        if (tradesToBuyer.length === 0) {
            return html``;
        }

        return html`
            <div class="notice">
                <img
                    src="https://avatars.cloudflare.steamstatic.com/6ab5219d0bbcce1300a2c6d7cbc638da52edda48_full.jpg"
                    style="height: 32px; border-radius: 5px;"
                />
                <div>You must use auto-fill in order to send trades on CSFloat Market.</div>
            </div>
        `;
    }

    protected render(): HTMLTemplateResult {
        if (!this.pendingTradesResponse) {
            // Check if we expected to be able to auto-fill, if so -- show a warning
            if (hasQueryParameter('autofill')) {
                this.disableInventoryPicker();
                return this.showExpectedAutoFillFailWarning();
            }

            return html``;
        }

        const tradesToBuyer = this.pendingTradesResponse.trades.filter((e) => e.buyer_id === UserThem?.strSteamId);

        const tradesWithoutOffersToBuyer = tradesToBuyer.filter(
            (e) => !e.steam_offer?.state || !e.steam_offer?.id || ![2, 3].includes(e.steam_offer?.state) // 2, 3 correspond to "active" and "accepted" trade offers
        );
        if (tradesWithoutOffersToBuyer.length > 0 || hasQueryParameter('autofill')) {
            // Disable them being able to select random items from their inventory (ensure asset IDs match up)
            this.disableInventoryPicker();
        }

        if (tradesToBuyer.length > 0 && g_ActiveInventory?.appid !== AppId.CSGO) {
            // Default to CS inventory
            try {
                ShowItemInventory(AppId.CSGO, ContextId.PRIMARY);
            } catch (e) {
                console.error(e);
            }
        }

        return html`
            ${this.showAutoFillInfoDialog(tradesToBuyer)} ${this.showPermissionWarningDialog(tradesToBuyer)}
            ${this.renderBulkAutoFillDialog(tradesToBuyer)} ${tradesToBuyer.map((e) => this.renderAutoFillDialog(e))}
            ${this.showWarningDialog()}
        `;
    }

    disableInventoryPicker() {
        if (!g_steamID) {
            return;
        }

        const elem = document.getElementById('inventories');
        if (!elem) {
            return;
        }

        // @ts-ignore
        elem.style.opacity = '0.5';

        // @ts-ignore
        elem.style.pointerEvents = 'none';
    }

    autoFillAll(trades: Trade[]) {
        for (const trade of trades) {
            this.autoFill(trade);
        }
    }

    autoFill(trade: Trade) {
        $J('#inventory_select_your_inventory').click();
        const el = UserYou?.findAsset(AppId.CSGO, ContextId.PRIMARY, trade.contract.item.asset_id)?.element;
        if (!el) {
            alert(
                `Failed to auto-fill asset ${trade.contract.item.asset_id}, you may have traded it away -- DO NOT SEND IT MANUALLY!`
            );
            return;
        }

        MoveItemToTrade(el);

        const note = document.getElementById('trade_offer_note');
        if (note) {
            (
                note as HTMLTextAreaElement
            ).value = `CSFloat Market Trade Offer #${trade.id} \n\nThanks for using CSFloat!`;
        }
    }

    hasAutoFillText(): boolean {
        const tradeMessages = document.getElementsByClassName('included_trade_offer_note_ctn');
        if (tradeMessages.length > 0) {
            const sanitized = (tradeMessages[0] as HTMLElement).innerText.trim().replace(/ /g, '').toLowerCase();

            return (
                sanitized.includes('csgofloat') || sanitized.includes('floatmarket') || sanitized.includes('csfloat')
            );
        }

        return false;
    }
}
