import {FloatElement} from '../custom';
import {CustomElement} from '../injectors';
import {html, HTMLTemplateResult} from 'lit';
import '../common/ui/steam-button';
import {query, state} from 'lit/decorators.js';
import {Get} from '../../bridge/handlers/storage_get';
import {Set} from '../../bridge/handlers/storage_set';
import {PAGE_SIZE} from '../../storage/keys';

@CustomElement()
export class PageSize extends FloatElement {
    @state()
    private selectedSize = 10;

    @state()
    private sizes = [10, 25, 50, 100];

    @query('select')
    private select!: HTMLSelectElement;

    protected render(): HTMLTemplateResult {
        return html`
            <select @change="${this.onSelect}">
                <option disabled>Per Page</option>
                ${this.sizes.map((size) => {
                    return html` <option value="${size}" ?selected="${size === this.selectedSize}">${size}</option> `;
                })}
            </select>
        `;
    }

    async connectedCallback() {
        super.connectedCallback();

        const size = await Get(PAGE_SIZE);
        if (size) {
            this.changePageSize(size);
        }
    }

    onSelect() {
        this.changePageSize(parseInt(this.select.value));
    }

    changePageSize(newSize: number) {
        this.selectedSize = newSize;
        g_oSearchResults.m_cPageSize = newSize;
        g_oSearchResults.GoToPage(0, true);

        Set<number>(PAGE_SIZE, newSize);
    }
}
