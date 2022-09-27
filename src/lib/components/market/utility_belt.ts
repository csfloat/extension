import {FloatElement, ViewEncapsulation} from "../custom";
import {CustomElement, InjectBefore, InjectionMode} from "../injectors";
import {html, css, TemplateResult} from "lit";
import '../common/ui/steam-button';
import './page_size';
import './sort_floats';

@CustomElement()
@InjectBefore('#searchResultsRows', InjectionMode.ONCE)
export class UtilityBelt extends FloatElement {
    encapsulation = ViewEncapsulation.NONE;

    // Need to manually inject styles since view encapsulation is off
    private static renderStyles(): TemplateResult<1> {
        return html`
            <style>
                .float-utility-container {
                    padding: 10px;
                    margin-top: 10px;
                    background-color: rgba(0, 0, 0, 0.2);
                }

                .float-page-selector {
                    margin-left: 10px;
                }

                .float-github {
                    margin-left: 10px;
                    text-decoration: underline;
                    font-family: 'Motiva Sans', sans-serif;
                }
                
                hr {
                    background-color: #1b2939;
                    border-style: solid none none;
                    border-color: black;
                    border-width: 1px 0 0;
                    height: 2px;
                }
            </style>`;
    }

    protected render(): unknown {
        return html`
            ${UtilityBelt.renderStyles()}
            <div class="float-utility-container">
                <csgofloat-sort-floats></csgofloat-sort-floats>
                <csgofloat-page-size class="float-page-selector"></csgofloat-page-size>
                <a class="float-github" href="https://csgofloat.com" target="_blank">Powered by CSGOFloat</a>
                <hr>
            </div>
        `;
    }

    async connectedCallback() {
        super.connectedCallback();

    }
}
