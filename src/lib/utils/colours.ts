/**
 * Given the colour of a background, picks the light or dark colour depending
 * on whichever has greater contrast
 *
 * Based on https://stackoverflow.com/a/41491220
 *
 * @param bgColor Colour in the format "#AAAAA"
 * @param lightColour Colour in the format "#AAAAA"
 * @param darkColour Colour in the format "#AAAAA"
 */
export function pickTextColour(bgColor: string, lightColour: string, darkColour: string): string {
    const color = bgColor.charAt(0) === '#' ? bgColor.substring(1, 7) : bgColor;
    const r = parseInt(color.substring(0, 2), 16); // hexToR
    const g = parseInt(color.substring(2, 4), 16); // hexToG
    const b = parseInt(color.substring(4, 6), 16); // hexToB
    const uicolors = [r / 255, g / 255, b / 255];
    const c = uicolors.map((col) => {
        if (col <= 0.03928) {
            return col / 12.92;
        }
        return Math.pow((col + 0.055) / 1.055, 2.4);
    });
    const L = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    return L > 0.179 ? darkColour : lightColour;
}
