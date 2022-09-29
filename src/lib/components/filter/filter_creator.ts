import {html, HTMLTemplateResult, nothing} from 'lit';
import { styleMap } from 'lit-html/directives/style-map.js';

import {state, query} from 'lit/decorators.js';
import {CustomElement} from "../injectors";
import {FloatElement, ViewEncapsulation} from "../custom";
import {Filter} from "../../filter/filter";

import '../common/ui/steam-button';
import './filter_help';

/** UI for creating a filter */
@CustomElement()
export class FilterCreator extends FloatElement {
    encapsulation = ViewEncapsulation.NONE;

    @state()
    private error: string = '';

    @state()
    private showHelp = false;

    @query('.csgofloat-filter-expression-input')
    private expressionInput!: HTMLInputElement;

    get expression(): string {
        return this.expressionInput?.value;
    }

    @query('.csgofloat-filter-colour-input')
    private colourInput!: HTMLInputElement;

    get colour(): string {
        return this.colourInput?.value;
    }

    private renderStyles(): HTMLTemplateResult {
        return html`
            <style>
                .csgofloat-filter-colour-input {
                    float: left;
                    margin-top: 2px;
                    -webkit-appearance: none;
                    border: none;
                    width: 20px;
                    height: 20px;
                    padding: 0;
                }

                .csgofloat-filter-colour-input::-webkit-color-swatch-wrapper {
                    padding: 0;
                }

                .csgofloat-filter-colour-input::-webkit-color-swatch {
                    border: none;
                }

                .csgofloat-filter-expression-input {
                    width: 350px;
                    margin-left: 5px;
                    padding: 4px 4px;
                    color: #828282;
                    font-size: 12px;
                    outline: none;
                    border: 1px solid #292929;
                    background-color: #101010;
                    font-family: "Motiva Sans", Sans-serif, serif;
                    font-weight: 300;
                    border-radius: 0;
                }

                .csgofloat-filter-help-btn {
                    font-size: 18px;
                    margin-left: 5px;
                }

                .csgofloat-filter-compile-status {
                    display: inline;
                    text-align: left;
                    margin-left: 5px;
                }

                .csgofloat-filter-add-btn {
                    margin-left: 10px;
                }

                .csgofloat-filter-compile-error {
                    font-family: Consolas, serif;
                    margin-top: 5px;
                }
            </style>
        `;
    }

    async connectedCallback() {
        super.connectedCallback();
    }

    render() {
        return html`
            ${this.renderStyles()}
            <input class="csgofloat-filter-colour-input" type="color" value="#0A9913">
            <input @input="${this.onExpressionInput}"
                   class="csgofloat-filter-expression-input"
                   placeholder="Add Highlight Filter">
            <a class="csgofloat-filter-help-btn" title="Filter Help"
               @click="${() => this.showHelp = !this.showHelp}">ⓘ</a>
            <div class="csgofloat-filter-compile-status" style="${styleMap({
                color: this.error ? 'red' : 'green'
            })}">${this.error ? 'X' : '✓'}</div>
            <csgofloat-steam-button
                    ?hidden="${this.error || !this.expression}"
                    class="csgofloat-filter-add-btn"
                    .text="${"Add Filter"}"
                    @click="${this.onAddFilter}"></csgofloat-steam-button>
            <div class="csgofloat-filter-compile-error">${this.error || nothing}</div>
            <csgofloat-filter-help ?hidden="${!this.showHelp}"></csgofloat-filter-help>
        `;
    }

    onExpressionInput() {
        if (this.expression === '') return;

        try {
            const f = new Filter(this.expression, this.colour, false);
            f.validate();
            this.error = '';
        } catch (e: any) {
            console.error(e);
            this.error = e.toString();
        }
    }

    onAddFilter() {

    }
}
