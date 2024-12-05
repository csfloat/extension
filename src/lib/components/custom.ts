import {css, LitElement} from 'lit';
import {tooltip, tooltipStyles} from './common/ui/tooltip';

function camelToDashCase(str: string) {
    return str
        .split(/(?=[A-Z])/)
        .join('-')
        .toLowerCase();
}

// LitElement wrapper with a pre-determined tag
export class FloatElement extends LitElement {
    static styles = [
        ...tooltipStyles,
        css`
            hr {
                background-color: #1b2939;
                border-style: solid none none;
                border-color: black;
                border-width: 1px 0 0;
                height: 2px;
            }

            a {
                color: #ebebeb;
                cursor: pointer;
            }

            input[type='text'],
            input[type='password'],
            input[type='number'],
            select {
                color: #909090;
                background-color: rgba(0, 0, 0, 0.2);
                border: 1px solid #000;
                border-radius: 3px;
            }

            input[type='color'] {
                float: left;
                margin-top: 2px;
                -webkit-appearance: none;
                border: none;
                width: 20px;
                height: 20px;
                padding: 0;
            }

            input[type='color']::-webkit-color-swatch-wrapper {
                padding: 0;
            }

            input[type='color']::-webkit-color-swatch {
                border: none;
            }
        `,
    ];

    static tag(): string {
        return `csfloat-${camelToDashCase(this.name)}`;
    }

    static elem(): any {
        return document.createElement(this.tag());
    }

    tooltip(label: string, extraClasses?: string) {
        return tooltip(label, extraClasses);
    }
}
