import {css, html} from 'lit';

import {CustomElement, InjectAfter, InjectionMode} from '../injectors';
import {FloatElement} from '../custom';
import '../common/ui/steam-button';
import {ClientSend} from '../../bridge/client';
import {state} from 'lit/decorators.js';
import {FetchPendingTrades} from '../../bridge/handlers/fetch_pending_trades';
import {HasPermissions} from '../../bridge/handlers/has_permissions';
import {MetaSettings} from '../../bridge/handlers/meta_settings';

@CustomElement()
@InjectAfter(
    '.maincontent .profile_leftcol .nonresponsive_hidden:not(.responsive_createtradeoffer)',
    InjectionMode.ONCE
)
export class AutoTrackWidget extends FloatElement {
    @state()
    show = false;

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
            const meta = await ClientSend(MetaSettings, {});
            if (!meta.enable_auto_trade) {
                return;
            }

            await ClientSend(FetchPendingTrades, {});

            const hasPermissions = await ClientSend(HasPermissions, {permissions: ['cookies', 'alarms']});
            if (!hasPermissions) {
                this.show = true;
            }
        } catch (e) {
            console.info('user is not logged into CSFloat or something went wrong');
        }
    }

    render() {
        return this.show
            ? html`
                  <div class="container" style="margin: 20px 0 20px 0;">
                      <div>
                          <div class="float-icon">
                              <img
                                  src="https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/79/798a12316637ad8fbb91ddb7dc63f770b680bd19_full.jpg"
                                  style="height: 32px;"
                              />
                          </div>
                          <span class="item-name"> Automatically Track Offers </span>
                          <div class="sale-info">Allow CSFloat Market to automatically track and create offers.</div>
                      </div>
                      <csfloat-steam-button
                          id="csfloat-enable-tracking"
                          .text="${'Enable Tracking'}"
                      ></csfloat-steam-button>
                  </div>
              `
            : html``;
    }
}
