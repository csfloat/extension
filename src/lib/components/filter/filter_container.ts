import {html} from 'lit';

import {property, state} from 'lit/decorators.js';
import {CustomElement} from "../injectors";
import {FloatElement, ViewEncapsulation} from "../custom";
import {Filter} from "../../filter/filter";
import {Get} from "../../bridge/handlers/storage_get";
import {DYNAMIC_ITEM_FILTERS, GLOBAL_FILTERS} from "../../storage/keys";

import './filter_creator';

@CustomElement()
export class FilterContainer extends FloatElement {
    encapsulation = ViewEncapsulation.NONE;

    @property({type: String})
    private key: string = '';

    @state()
    private filters: Filter[] = [];

    async connectedCallback() {
        super.connectedCallback();

        if (!this.key) {
            throw new Error('filter key MUST be defined');
        }

        const globalFilters = (await Get(GLOBAL_FILTERS)) || [];
        const itemFilters = (await Get(DYNAMIC_ITEM_FILTERS(this.key))) || [];
        this.filters = globalFilters.concat(itemFilters).map(e => Filter.from(e));
    }

    render() {
        return html`
            <csgofloat-filter-creator></csgofloat-filter-creator>
        `;
    }
}
