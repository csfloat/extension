function hexToRgb(hex: string): number[] | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null;
}

function rgbToHex(rgb: number[]): string {
    return '#' + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);
}

/**
 * Given an array of colours in the hex format, averages them
 * to produce a hex output
 *
 * @param hexColours Colours in the format "#AAAAA"
 */
export function averageColour(hexColours: string[]): string {
    // Get the average colour between each matching filter
    const average: number[] = [0, 0, 0];

    for (const colour of hexColours) {
        const rgb = hexToRgb(colour);
        if (!rgb) {
            continue;
        }

        for (let i = 0; i < 3; i++) {
            average[i] += rgb[i];
        }
    }

    return rgbToHex(average.map((e) => e / hexColours.length));
}
