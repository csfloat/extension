import {css, html, TemplateResult} from 'lit';

import {floor} from '../../utils/skin';
import {FetchBluegemResponse} from '../../bridge/handlers/fetch_bluegem';

export const patternDetailStyles = css`
    .fade-base {
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    .fade {
        background-image: -webkit-linear-gradient(0deg, #d9bba5 0%, #e5903b 33%, #db5977 66%, #6775e1 100%);
    }

    .amber-fade {
        background-image: -webkit-linear-gradient(0deg, #627d66 0%, #896944 50%, #7e4201 100%);
    }

    .acid-fade {
        background-image: -webkit-linear-gradient(0deg, #2b441b 0%, #3e6b2f 11%, #82a64a 66%, #c1a16c 100%);
    }

    .bluegem {
        color: deepskyblue;
    }
`;

/**
 * Renders HTML for the fade percentage.
 * Requires the component to include {@link patternDetailStyles} in its static styles.
 */
export function renderFadePercentage(
    fade: {percentage: number; className: string},
    precision = 1,
    extraClasses = ''
): TemplateResult<1> {
    return html`<span class="fade-base ${fade.className} ${extraClasses}"
        >(${floor(fade.percentage, precision)}%)</span
    >`;
}

/**
 * Renders HTML for the blue gem percentage.
 * Requires the component to include {@link patternDetailStyles} in its static styles.
 */
export function renderBluegemPercentage(bluegemData: FetchBluegemResponse, showBackside = false): TemplateResult<1> {
    // Some skins got only one blue value
    if (showBackside && bluegemData.backside_blue !== undefined) {
        return html`<span class="bluegem"
            >(${floor(bluegemData.playside_blue, 1)}% / ${floor(bluegemData.backside_blue, 1)}%)</span
        >`;
    }

    return html`<span class="bluegem">(${floor(bluegemData.playside_blue, 1)}%)</span>`;
}
