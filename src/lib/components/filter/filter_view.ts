import {CustomElement} from '../injectors';
import {FloatElement} from '../custom';
import {property} from 'lit/decorators.js';
import {Filter} from '../../filter/filter';
import {css, html, HTMLTemplateResult} from 'lit';
import {gFilterService} from '../../services/filter';

@CustomElement()
export class FilterView extends FloatElement {
    @property()
    private filter!: Filter;

    static styles = [
        ...FloatElement.styles,
        css`
            .container {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 10px;
            }

            .color-input {
            }

            .expression {
                font-family: Consolas, sans-serif;
            }

            .global-btn {
                margin-left: auto;
            }

            .remove-btn {
            }
        `,
    ];

    protected render(): HTMLTemplateResult {
        return html`
            <div class="container">
                <input
                    @input="${this.onColourChange}"
                    class="colour-input"
                    type="color"
                    value="${this.filter.getColour()}"
                />
                <div class="expression">${this.filter.getExpression()}</div>
                <csfloat-steam-button
                    .text="${'Global'}"
                    .type="${this.filter.getIsGlobal() ? 'green_white' : 'grey_white'}"
                    @click="${this.onToggleGlobal}"
                    class="global-btn"
                ></csfloat-steam-button>
                <csfloat-steam-button
                    .text="${'Remove'}"
                    .type="${'grey_white'}"
                    @click="${this.onRemove}"
                    class="remove-btn"
                ></csfloat-steam-button>
            </div>
        `;
    }

    onColourChange(e: Event) {
        this.filter = this.filter.setColour((e.target as HTMLInputElement).value);
        gFilterService.upsert(this.filter);
        this.requestUpdate();
    }

    onToggleGlobal(e: Event) {
        this.filter.setIsGlobal(!this.filter.getIsGlobal());
        gFilterService.upsert(this.filter);
        this.requestUpdate();
    }

    onRemove(e: Event) {
        gFilterService.remove(this.filter);
    }
}
