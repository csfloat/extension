import {html} from 'lit';

import {property, state} from 'lit/decorators.js';
import {CustomElement} from '../injectors';
import {FloatElement} from '../custom';
import {Filter} from '../../filter/filter';
import {DYNAMIC_ITEM_FILTERS} from '../../storage/keys';
import {gFilterService} from '../../services/filter';

import './filter_creator';
import './filter_view';

@CustomElement()
export class FilterContainer extends FloatElement {
    @property({type: String})
    private key: string = '';

    @state()
    private filters: Filter[] = [];

    async connectedCallback() {
        super.connectedCallback();

        if (!this.key) {
            throw new Error('filter key MUST be defined');
        }

        gFilterService.onUpdate$.subscribe((filters) => {
            this.filters = [...filters];
        });

        await gFilterService.initialize(DYNAMIC_ITEM_FILTERS(this.key));
    }

    render() {
        return html`
            ${this.filters.map((filter) => {
                return html`<div>
                    <csfloat-filter-view .filter="${filter}"></csfloat-filter-view>
                    <hr />
                </div>`;
            })}
            <csfloat-filter-creator @newFilter="${this.onNewFilter}"></csfloat-filter-creator>
        `;
    }

    onNewFilter(e: CustomEvent) {
        gFilterService.upsert(e.detail.filter);
    }
}
