import {CustomElement} from "../injectors";
import {FloatElement} from "../custom";
import {property} from "lit/decorators.js";
import {Filter} from "../../filter/filter";
import {html, HTMLTemplateResult} from "lit";

@CustomElement()
export class FilterView extends FloatElement {
    @property()
    private filter: Filter | undefined;

    protected render(): HTMLTemplateResult {
        return html`
            <input class="csgofloat-filter-colour-input" type="color" value="${this.filter?.getColour()}">
            <span>${this.filter?.getExpression()}</span>
            <div style="clear: both;"></div>
        `;
    }
}
