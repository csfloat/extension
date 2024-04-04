import {html} from 'lit';

import {CustomElement, InjectBefore, InjectionMode} from '../injectors';
import {FloatElement} from '../custom';
import '../common/ui/steam-button';
import {cache} from 'decorator-cache-getter';

@CustomElement()
@InjectBefore('.tradeoffer .tradeoffer_items_ctn', InjectionMode.CONTINUOUS)
export class ShowTradeOfferId extends FloatElement {
    @cache
    get tradeOfferID(): string {
        const rawId = $J(this).parent().attr('id');
        if (!rawId) {
            return '';
        }

        return rawId.replace('tradeofferid_', '');
    }

    async connectedCallback() {
        super.connectedCallback();
    }

    render() {
        return html` <span>Trade Offer ID: ${this.tradeOfferID}</span>`;
    }
}
