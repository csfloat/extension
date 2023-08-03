import {css, html, HTMLTemplateResult, nothing} from 'lit';
import {styleMap} from 'lit-html/directives/style-map.js';

import {state, query} from 'lit/decorators.js';
import {CustomElement} from '../injectors';
import {FloatElement} from '../custom';
import {Filter} from '../../filter/filter';

import '../common/ui/steam-button';
import './filter_help';
import {debounce} from 'lodash-decorators';

/** UI for creating a filter */
@CustomElement()
export class FilterCreator extends FloatElement {
    @state()
    private error: string = '';

    @state()
    private showHelp = false;

    @query('.expression-input')
    private expressionInput!: HTMLInputElement;

    @state()
    get expression(): string {
        return this.expressionInput?.value;
    }

    @query('#colour-input')
    private colourInput!: HTMLInputElement;

    get colour(): string {
        return this.colourInput?.value;
    }

    static styles = [
        ...FloatElement.styles,
        css`
            .expression-input {
                width: 350px;
                margin-left: 5px;
                padding: 4px 4px;
                color: #828282;
                font-size: 12px;
                outline: none;
                border: 1px solid #292929;
                background-color: #101010;
                font-family: 'Motiva Sans', Sans-serif, serif;
                font-weight: 300;
                border-radius: 0;
            }

            .help-btn {
                font-size: 18px;
                margin-left: 5px;
            }

            .compile-status {
                display: inline;
                text-align: left;
                margin-left: 5px;
            }

            .add-btn {
                margin-left: 10px;
            }

            .compile-error {
                font-family: Consolas, serif;
                margin-top: 5px;
            }
        `,
    ];

    async connectedCallback() {
        super.connectedCallback();
    }

    render() {
        return html`
            <input id="colour-input" type="color" value="#354908" />
            <input @input="${this.onExpressionInput}" class="expression-input" placeholder="Add Highlight Filter" />
            <a class="help-btn" title="Filter Help" @click="${() => (this.showHelp = !this.showHelp)}">ⓘ</a>
            <div
                class="compile-status"
                style="${styleMap({
                    color: this.error ? 'red' : 'green',
                })}"
            >
                ${this.error ? 'X' : '✓'}
            </div>
            <csfloat-steam-button
                ?hidden="${this.error || !this.expression}"
                class="add-btn"
                .text="${'Add Filter'}"
                @click="${this.onAddFilter}"
            ></csfloat-steam-button>
            <div class="compile-error">${(this.expression && this.error) || nothing}</div>
            <csfloat-filter-help ?hidden="${!this.showHelp}"></csfloat-filter-help>
        `;
    }

    // Don't show errors right away as the user is typing
    @debounce(500)
    onExpressionInput() {
        this.requestUpdate();
        if (this.expression === '') return;

        try {
            const f = new Filter(this.expression, this.colour, false);
            f.validate();
            this.error = '';
        } catch (e: any) {
            this.error = e.toString();
        }
    }

    reset() {
        this.expressionInput!.value = '';
        this.error = '';
        this.requestUpdate();
    }

    onAddFilter() {
        this.dispatchEvent(
            new CustomEvent('newFilter', {
                detail: {
                    filter: new Filter(this.expression, this.colour, false),
                },
            })
        );

        this.reset();
    }
}
