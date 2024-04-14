import {css, html} from 'lit';

import {CustomElement, InjectAfter, InjectionMode} from '../injectors';
import {FloatElement} from '../custom';
import '../common/ui/steam-button';
import {ClientSend} from '../../bridge/client';
import {state} from 'lit/decorators.js';
import {FetchPendingTrades} from '../../bridge/handlers/fetch_pending_trades';
import {HasPermissions} from '../../bridge/handlers/has_permissions';
import {PingSetupExtension} from '../../bridge/handlers/ping_setup_extension';

@CustomElement()
@InjectAfter(
    '.maincontent .profile_leftcol .nonresponsive_hidden:not(.responsive_createtradeoffer)',
    InjectionMode.ONCE
)
export class BetterTrackingWidget extends FloatElement {
    @state()
    show = false;

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
            // Used for api.steampowered.com requests, all tokens stay on the users' device
            const hasPermissions = await ClientSend(HasPermissions, {
                permissions: ['alarms'],
                origins: ['*://*.steampowered.com/*'],
            });

            if (hasPermissions.granted) {
                // In case they switched accounts on CSFloat or Steam or initial ping was lost, send redundant pings
                ClientSend(PingSetupExtension, {});
                return;
            }

            const trades = await ClientSend(FetchPendingTrades, {state: 'queued,pending,verified', limit: 1});
            if (trades.count === 0) {
                // They aren't actively using CSFloat Market, no need to show this
                return;
            }

            this.show = true;
        } catch (e) {
            console.info('user is not logged into CSFloat');
        }
    }

    render() {
        return this.show
            ? html`
                  <div class="container" style="margin: 20px 0 20px 0;">
                      <div>
                          <div class="float-icon">
                              <img
                                  src="https://avatars.cloudflare.steamstatic.com/6ab5219d0bbcce1300a2c6d7cbc638da52edda48_full.jpg"
                                  style="height: 32px;"
                              />
                          </div>
                          <span class="item-name">Setup Offer Tracking on CSFloat</span>
                          <div class="sale-info">Verify trades while preserving your privacy.</div>
                      </div>
                      <csfloat-steam-button id="csfloat-enable-enhanced" .text="${'Enable'}"></csfloat-steam-button>
                  </div>
              `
            : html``;
    }
}
