import {CustomElement} from '../injectors';
import {FloatElement} from '../custom';
import {html, HTMLTemplateResult} from 'lit';

@CustomElement()
export class FilterHelp extends FloatElement {
    protected render(): HTMLTemplateResult {
        return html`
            <hr></hr>
            Filters will highlight matching items with the specified colour<br><br>

            <b>Note: </b> If multiple filters match an item, it will be highlighted with the average colour<br><br>

            <b>New: </b> You can now filter based on charm patterns!<br><br>

            <b>Examples: </b>
            <ul>
                <li>float < 0.3</li>
                <ul>
                    <li>Matches items with floats less than 0.3</li>
                </ul>
                <li>float >= 0.112 and float < 0.2</li>
                <ul>
                    <li>Matches items with floats greater than or equal to 0.112 and less than 0.2</li>
                </ul>
                <li>float < 0.02 and price < 12.30</li>
                <ul>
                    <li>Matches items with floats less than 0.02 and a price of 12.30 or less in your logged-in account currency</li>
                    <li>Note: Price only works when you're logged in to ensure the proper currency</li>
                </ul>
                <li>phase == "Ruby" or phase == "1"</li>
                <ul>
                    <li>Matches items with a doppler phase 1 or Ruby</li>
                    <li>Equivalent to phase in ("Ruby", "1")</li>
                </ul>
                <li>float == 0.2 or (seed > 500 and float < 0.15)</li>
                <ul>
                    <li>Matches items with floats of 0.2 or paint seeds greater than 500 and floats less than 0.15</li>
                </ul>
                <li>low_rank <= 500 </li>
                <ul>
                    <li>Matches items with floats ranked in the top 500 lowest for this skin on FloatDB</li>
                </ul>
                <li>pattern > 22000 and pattern < 25000 </li>
                <ul>
                    <li>Matches items with charms that have patterns between 22,000 and 25,000</li>
                </ul>
                <li>match(float, "7355608") >= 1</li>
                <ul>
                    <li>Matches items with floats that contain at least one match of the CS bomb code</li>
                    <li>Example Match: 0.234327355608454</li>
                </ul>
                <li>percentile(90)</li>
                <ul>
                    <li>Matches items with a float better than 90% of items of this type</li>
                </ul>
                <li>percentileRange(0, 10)</li>
                <ul>
                    <li>Matches items with a float within the percentile range 0-10%</li>
                    <li>This matches the worst 10% of floats of items of this type</li>
                </ul>
            </ul>

            <b>Variables</b>
            <ul>
                <li>float</li>
                <ul>
                    <li>The float value of the item</li>
                </ul>
                <li>seed</li>
                <ul>
                    <li>The paint seed of the item</li>
                </ul>
                <li>low_rank</li>
                <ul>
                    <li>If the item is in the top 1000 lowest float for this skin and category (normal, stattrak, souvenir), this is the FloatDB rank</li>
                </ul>
                <li>high_rank</li>
                <ul>
                    <li>If the item is in the top 1000 highest float for this skin and category (normal, stattrak, souvenir), this is the FloatDB rank</li>
                </ul>
                <li>price</li>
                <ul>
                    <li>Price of the item in your currency in decimal format (ex. 18.43), includes fees</li>
                    <li>Note: Price only works when you're logged in to ensure the proper currency</li>
                </ul>
                <li>phase</li>
                <ul>
                    <li>Phase of the item if it's a doppler, empty otherwise</li>
                    <li>Possible values are "1", "2", "3", "4", "Ruby", "Sapphire", "Black Pearl", "Emerald"</li>
                </ul>
                <li>pattern</li>
                <ul>
                    <li>Pattern of an un-applied charm, or the first applied keychain on a charm.</li>
                    <li>Possible values range from 0 to 100,000</li>
                </ul>
                <li>minfloat</li>
                <ul>
                    <li>The minimum float the skin can have (regardless of wear)</li>
                </ul>
                <li>maxfloat</li>
                <ul>
                    <li>The maximum float the skin can have (regardless of wear)</li>
                </ul>
            </ul>

            <b>Functions:</b>
            <ul>
                <li>match(x, regex)</li>
                <ul>
                    <li>Performs a regex match on 'x' and returns the amount of matches</li>
                </ul>
                <li>percentile(rank)</li>
                <ul>
                    <li>Returns true if the skin's float is in the given percentile, lower floats are considered "better"</li>
                    <li>This takes into account the range of the wear and specific per-skin range</li>
                    <li>Note: This assumes that floats are distributed evenly</li>
                </ul>
                <li>percentileRange(minRank, maxRank)</li>
                <ul>
                    <li>Returns true if the skin's float is in the given percentile range</li>
                    <li>This takes into account the range of the wear and specific per-skin range</li>
                    <li>Note: This assumes that floats are distributed evenly</li>
                </ul>
                <li>abs(x)</li>
                <ul>
                    <li>Absolute value</li>
                </ul>
                <li>ceil(x)</li>
                <ul>
                    <li>Round floating point up</li>
                </ul>
                <li>floor(x)</li>
                <ul>
                    <li>Round floating point down</li>
                </ul>
                <li>log(x)</li>
                <ul>
                    <li>Natural logarithm</li>
                </ul>
                <li>max(a, b, c...)</li>
                <ul>
                    <li>Max value (variable length of args)</li>
                </ul>
                <li>min(a, b, c...)</li>
                <ul>
                    <li>Min value (variable length of args)</li>
                </ul>
                <li>random()</li>
                <ul>
                    <li>Random floating point from 0.0 to 1.0</li>
                </ul>
                <li>round(x)</li>
                <ul>
                    <li>Round floating point</li>
                </ul>
                <li>sqrt(x)</li>
                <ul>
                    <li>Square root</li>
                </ul>
            </ul>
        `;
    }
}
