import {html} from 'lit';

import {state} from 'lit/decorators.js';
import {CustomElement, InjectAppend, InjectionMode} from '../injectors';
import {FloatElement} from '../custom';
import {fetchListingTime} from './helpers';
import '../common/ui/steam-button';
import {ProveTradesToken} from '../../bridge/handlers/prove_trades_token';
import {ClientSend} from '../../bridge/client';

@CustomElement()
@InjectAppend('.tradehistoryrow .tradehistory_content', InjectionMode.CONTINUOUS)
export class TradeProof extends FloatElement {
    @state()
    private message: string | undefined;

    @state()
    private isProcessing = false;

    async connectedCallback() {
        super.connectedCallback();
    }

    render() {
        return this.message
            ? html` <span>${this.message}</span> `
            : html`
                  <csfloat-steam-button
                      @click="${this.onClick}"
                      .text="${this.isProcessing ? 'Proving...' : 'Prove Trade on CSFloat'}"
                  >
                  </csfloat-steam-button>
              `;
    }

    private async onClick() {
        this.isProcessing = true;

        const token = document
            .getElementById('application_config')
            ?.getAttribute('data-loyalty_webapi_token')
            ?.replace('"', '')
            .replace('"', '');

        try {
            const resp = await ClientSend(ProveTradesToken, {token});
            this.message = resp.message;
        } catch (e: any) {
            alert(e.toString());
        }
    }
}
