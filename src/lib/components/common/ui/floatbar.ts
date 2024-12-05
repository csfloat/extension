import {html, css} from 'lit';
import {property} from 'lit/decorators.js';
import {FloatElement} from '../../custom';
import {CustomElement} from '../../injectors';

@CustomElement()
export class FloatBar extends FloatElement {
    @property({type: Number}) float!: number;
    @property({type: Number}) minFloat = 0;
    @property({type: Number}) maxFloat = 1;

    static styles = [
        ...FloatElement.styles,
        css`
            .market-float-bar-container {
                position: relative;
                width: 100%;
                height: 8px;
                margin: 5px 0;
            }

            .market-float-bar-marker {
                position: absolute;
                background-color: #d9d9d9;
                width: 3px;
                top: -3px;
                height: 14px;
                border-radius: 4px;
            }

            .market-float-bar {
                display: inline-block;
                vertical-align: top;
                height: 100%;
                opacity: 0.8;
            }

            .market-float-bar:first-of-type {
                border-radius: 4px 0 0 4px;
            }
            .market-float-bar:last-of-type {
                border-radius: 0 4px 4px 0;
            }
        `,
    ];

    private readonly floatConditions = [
        {min: 0, max: 7, color: 'green'},
        {min: 7, max: 15, color: '#18a518'},
        {min: 15, max: 38, color: '#9acd32'},
        {min: 38, max: 45, color: '#cd5c5c'},
        {min: 45, max: 100, color: '#f92424'},
    ];

    get minFloatPercentage(): number {
        return this.minFloat * 100;
    }

    get maxFloatPercentage(): number {
        return this.maxFloat * 100;
    }

    render() {
        const left = this.minFloatPercentage.toFixed(0);
        const markerLeft = (((this.float - this.minFloat) * 100) / (this.maxFloat - this.minFloat)).toFixed(3);
        const dynamicWidth = this.maxFloatPercentage - this.minFloatPercentage;

        const getConditionWidth = (condMin: number, condMax: number) => {
            return (
                Math.max(
                    0,
                    (Math.min(condMax, this.maxFloatPercentage) - Math.max(condMin, this.minFloatPercentage)) * 100
                ) / dynamicWidth
            );
        };
        const formatFloat = (value: number) => Number(value.toFixed(4));
        const tooltipText = `Represents the float range of this skin (${formatFloat(this.minFloat)}-${formatFloat(
            this.maxFloat
        )})`;

        return html`
            <div class="market-float-bar-container" style="left: ${left}%; width: ${dynamicWidth.toFixed(2)}%;">
                ${this.tooltip(tooltipText)}
                <div style="height: 8px; border-radius: 4px; overflow: hidden; font-size: 0;">
                    ${this.floatConditions.map(
                        (cond) => html`
                            <div
                                class="market-float-bar"
                                style="width: ${getConditionWidth(
                                    cond.min,
                                    cond.max
                                )}%; background-color: ${cond.color};"
                            ></div>
                        `
                    )}
                </div>
                <div class="market-float-bar-marker" style="left: calc(${markerLeft}% - 2px);"></div>
            </div>
        `;
    }
}
