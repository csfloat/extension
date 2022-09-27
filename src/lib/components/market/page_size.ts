import {FloatElement, ViewEncapsulation} from "../custom";
import {CustomElement} from "../injectors";
import {html} from "lit";
import '../common/ui/steam-button';
import {state} from "lit/decorators.js";

@CustomElement()
export class PageSize extends FloatElement {
    encapsulation = ViewEncapsulation.NONE;

    @state()
    private selectedSize = 10;

    @state()
    private sizes = [10, 25, 50, 100];

    protected render(): unknown {
        return html`
            <select @change="${this.onSelect}">
                ${this.sizes.map(size => {
                    return html`
                        <option value="${size}" ?selected="${size === this.selectedSize}">${size}</option>
                    `;
                })}
            </select>
        `;
    }

    async connectedCallback() {
        super.connectedCallback();
    }

    onSelect(e: Event) {
        this.changePageSize(this.sizes[(e.target as HTMLSelectElement).selectedIndex]);
    }

    changePageSize(newSize: number) {
        this.selectedSize = newSize;
        g_oSearchResults.m_cPageSize = newSize;
        g_oSearchResults.GoToPage(0, true);
    }
}
