const createButton = function(text, colour) {
    let btn = document.createElement('a');
    btn.classList.add(`btn_${colour}_white_innerfade`);
    btn.classList.add('btn_small');
    btn.classList.add('float-btn');

    let span = document.createElement('span');
    span.innerText = text;
    btn.appendChild(span);

    return btn;
};

const removeButtons = function() {
    // Iterate through each item on the page
    let listingRows = document.querySelectorAll('.market_listing_row.market_recent_listing_row');

    for (let row of listingRows) {
        let id = row.id.replace('listing_', '');

        let floatdiv = row.querySelector(`#item_${id}_floatdiv`);

        if (floatdiv) {
            row.style.backgroundColor = '';
            floatdiv.parentNode.removeChild(floatdiv);
        }
    }
};

const hexToRgb = function(hex) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null;
}

const rgbToHex = function(rgb) {
    return "#" + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);
}
