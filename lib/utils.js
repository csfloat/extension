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
