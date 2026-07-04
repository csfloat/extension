import {css, html, nothing} from 'lit';
import {property} from 'lit/decorators.js';

import {CustomElement, InjectIntoScope, InjectionPosition} from '../../injectors';
import {FloatElement} from '../../custom';
import {renderClickableRank} from '../../../utils/skin';
import {ReactMarketListingScope, ReactListingContext} from './listing';
import {findWearSpan} from './placement';

@CustomElement()
@InjectIntoScope(ReactMarketListingScope, {
    anchor: findWearSpan,
    position: InjectionPosition.After,
})
export class ReactListingRank extends FloatElement {
    @property({attribute: false}) injectionContext?: ReactListingContext;

    static styles = [
        css`
            :host:has(a[href]) {
                margin-left: 4px;
            }
        `,
    ];

    protected render() {
        if (!this.injectionContext) return nothing;

        return html`<span @click=${(e: Event) => e.stopPropagation()}>
            ${renderClickableRank(this.injectionContext.itemInfo)}
        </span>`;
    }
}
