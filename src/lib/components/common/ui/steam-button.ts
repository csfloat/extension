import {css, html} from 'lit';

import {property} from 'lit/decorators.js';
import {CustomElement} from "../../injectors";
import {FloatElement, ViewEncapsulation} from "../../custom";

// NOTE: The parent MUST NOT have SHADOW DOM enabled
@CustomElement()
export class SteamButton extends FloatElement {
    encapsulation = ViewEncapsulation.NONE;

    @property({type: String})
    private text: string = '';

    async connectedCallback() {
        super.connectedCallback();
    }

    render() {
        return html`
            <a class="btn_green_white_innerfade btn_small float-btn">
                <span>${this.text}</span>
            </a>
        `;
    }
}
