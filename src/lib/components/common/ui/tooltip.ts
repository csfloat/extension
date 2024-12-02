import {css, html} from 'lit';
import {FloatElement} from '../../custom';
import {CustomElement} from '../../injectors';
import {property} from 'lit/decorators.js';

import {hintcss} from './hintcss';

@CustomElement()
export class Tooltip extends FloatElement {
    @property({type: String}) class = '';
    @property({type: String}) text!: string;

    static get styles() {
        return [
            ...FloatElement.styles,
            hintcss,
            css`
                [class*='hint--'][aria-label]:after {
                    text-shadow: none;
                    font-family: 'Motiva Sans', Arial, Helvetica, sans-serif;
                    font-weight: normal;
                    line-height: normal;
                    text-align: center;
                    background: #c2c2c2;
                    color: #3d3d3f;
                    font-size: 11px;
                    border-radius: 3px;
                    padding: 5px;
                }
                .hint--whitespace-pre-wrap:after,
                .hint--whitespace-pre-wrap:before {
                    white-space: pre-wrap;
                }
            `,
        ];
    }

    render() {
        const tooltipClass = `hint--top hint--rounded hint--no-arrow ${this.class}`;

        return html`
            <div class="${tooltipClass}" aria-label="${this.text}" style="display: block;">
                <slot></slot>
            </div>
        `;
    }
}
