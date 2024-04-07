import {html} from 'lit';

import {state} from 'lit/decorators.js';
import {CustomElement, InjectAppend, InjectionMode} from '../injectors';
import {FloatElement} from '../custom';
import {fetchListingTime} from './helpers';
import '../common/ui/steam-button';

@CustomElement()
@InjectAppend('.tradehistoryrow .tradehistory_content', InjectionMode.CONTINUOUS)
export class TradeProof extends FloatElement {
    @state()
    private proofNumber: number | undefined;

    @state()
    private isProcessing = false;

    async connectedCallback() {
        super.connectedCallback();
    }

    render() {
        return this.proofNumber
            ? html` <span>Proof: ${this.proofNumber}</span> `
            : html`
                  <csfloat-steam-button
                      @click="${this.onClick}"
                      .text="${this.isProcessing ? 'Computing Proof...' : 'CSFloat Proof'}"
                  >
                  </csfloat-steam-button>
              `;
    }

    private async onClick() {
        this.isProcessing = true;

        const index = $J('.tradehistoryrow').index($J(this).parent().parent());
        try {
            this.proofNumber = await fetchListingTime(index);
        } catch (e) {
            alert(
                "Failed to parse time, make sure you're on an english version of the page by appending ?l=english to the url"
            );
        }
        this.isProcessing = false;
    }
}
