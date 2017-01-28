let floatQueue = [];
let floatData = {};
let floatTimer;
let currentlyProcessingFloat = false;
let steamListingInfo;

// retrieve g_rgListingInfo from page script
window.addEventListener('message', (e) => {
    steamListingInfo = e.data.listingInfo;
});

let retrieveListingInfoFromPage = function() {
    let script = document.createElement('script');
    script.innerText = `
        window.postMessage({
            listingInfo: g_rgListingInfo
        }, '*');
    `;
    document.head.appendChild(script);

    return new Promise((resolve, reject) => {
        setTimeout(resolve, 0);
    });
};

function getCSGOFloat(url, id) {
    if (currentlyProcessingFloat) {
        processError(id, {'error': 'Already processing a float request'}, false);
        return;
    }

    currentlyProcessingFloat = true;
    document.querySelector(`#item_${id}_floatdiv span`).innerText = 'Fetching';

    // Request the float info from the API
    fetch(`https://api.csgofloat.com:1738/?url=${url}`)
    .then((response) => {
        if (response.ok) { return response.json(); }

        let e = new Error(); // todo: this better
        e.response = response;
        throw e;
    })
    .then((json) => {
        if ('iteminfo' in json) {
            // We're no longer processing a float
            currentlyProcessingFloat = false;

            // Add it to a dict holding the requested floats
            floatData[id] = json.iteminfo;

            // Display it to the user
            processSuccess(id);

            // If this is part of a queue, pop the last element (this request)
            if (floatQueue.length > 0) {
                floatQueue.pop();
            }

            // If there are still items in the queue, request the next one
            if (floatQueue.length > 0) {
                let lastItem = floatQueue[floatQueue.length - 1];
                getCSGOFloat(lastItem[1], lastItem[0]);
            }
            else {
                // There is no longer a queue, show the "Get all floats" button again
                document.querySelector('#allfloatbutton').classList.remove('btn_disabled');
            }
        }
    })
    .catch((err) => {
        err.response.json().then((json) => {
            // Display the error to the user
            processError(id, json, true);

            // If this is part of a queue, pop the last element (this request)
            if (floatQueue.length > 0) {
                floatQueue.pop();
            }

            // If there are still items in the queue, request the next one
            if (floatQueue.length > 0) {
                let lastItem = floatQueue[floatQueue.length - 1];
                getCSGOFloat(lastItem[1], lastItem[0]);
            }
            else {
                // There is no longer a queue, show the "Get all floats" button again
                document.querySelector('#allfloatbutton').classList.remove('btn_disabled');
            }
        });
    });
}

// Processes a successful float retrieval for the given itemid
function processSuccess(itemid) {
    // find the corresponding div
    let floatdiv = document.querySelector(`#item_${itemid}_floatdiv`);

    if (floatdiv) {
        // Remove the "get float" button
        floatdiv.removeChild(floatdiv.querySelector('.floatbutton'));

        let msgdiv = floatdiv.querySelector('.floatmessage');

        // Get the iteminfo for this itemid
        let iteminfo = floatData[itemid];

        let data = 'Float: ' + iteminfo['floatvalue'] + '<br>Paint Seed: ' + iteminfo['paintseed'];

        // Show the float and paint seed to the user
        msgdiv.innerHTML = data;
    }
}

// Processes the error for a given itemid, allows you to specify whether the error caused no floats
// to be processing currently
function processError(itemid, error, resetProcessing) {
    // If this caused us to no longer process a float, reset the boolean
    if (resetProcessing) { currentlyProcessingFloat = false; }

    // Change the button test for this itemid
    document.querySelector(`#item_${itemid}_floatdiv span`).innerText = 'Get Float';

    // Change the message div for this item to the error
    let floatdiv = document.querySelector(`#item_${itemid}_floatdiv`);
    if (floatdiv) {
        floatdiv.querySelector('.floatmessage').innerHTML = error['error'];
    }
}

// Adds the "Get all floats" button
function addAllFloatButton() {
    let parentDiv = document.createElement('div');
    parentDiv.style.padding = '10px';
    parentDiv.style.marginTop = '10px';
    parentDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';

    let allFloatButton = document.createElement('a');
    allFloatButton.id = 'allfloatbutton';
    allFloatButton.classList.add('btn_green_white_innerfade');
    allFloatButton.classList.add('btn_small');
    allFloatButton.addEventListener('click', GetAllFloats);
    parentDiv.appendChild(allFloatButton);

    let allFloatSpan = document.createElement('span');
    allFloatSpan.innerText = 'Get All Floats';
    allFloatButton.appendChild(allFloatSpan);

    let githubLink = document.createElement('a');
    githubLink.style.marginLeft = '10px';
    githubLink.style.textDecoration = 'underline';
    githubLink.style.fontFamily = `'Motiva Sans', sans-serif`;
    githubLink.href = 'https://github.com/Step7750/CSGOFloat';
    githubLink.innerText = 'Powered by CSGOFloat';
    parentDiv.appendChild(githubLink);

    document.querySelector('#searchResultsTable').insertBefore(parentDiv, document.querySelector('#searchResultsRows'));
}

// Puts all of the available items on the page into a queue for float retrieval
function GetAllFloats() {
    // Get all current items on the page (in proper order)
    let listingRows = document.querySelectorAll('.market_listing_row.market_recent_listing_row');

    for (let row of Array.from(listingRows).reverse()) {
        let id = row.id.replace('listing_', '');
        let listingData = steamListingInfo[id];

        // Make sure we don't already have the float for this item
        // Make sure it is a CSGO item (appid == 730)
        if (listingData.asset.appid == 730 && !(id in floatData)) {
            let nameDiv = row.querySelector(`#listing_${id}_name`);

            // Make sure we found the div and that there is an item in market_actions
            if (nameDiv != null && (listingData.asset.market_actions || []).length > 0) {
                // Obtain and format the inspect link
                let inspectLink = listingData.asset.market_actions[0].link
                .replace('%listingid%', id)
                .replace('%assetid%', listingData.asset.id);

                floatQueue.push([id, inspectLink]);
            }
        }
    }

    // If we put any items in the queue, remove the "Get all floats" button and start the queue
    if (floatQueue.length > 0) {
        document.querySelector('#allfloatbutton').classList.add('btn_disabled');
        let lastItem = floatQueue[floatQueue.length - 1];
        getCSGOFloat(lastItem[1], lastItem[0]);
    }
}

// If an item on the current page doesn't have the float div/buttons, this function adds it
function addButtons() {
    // Iterate through each item on the page
    let listingRows = document.querySelectorAll('.market_listing_row.market_recent_listing_row');

    retrieveListingInfoFromPage()
    .then(() => {
        for (let row of listingRows) {
            // Get the id and listing data for it
            let id = row.id.replace('listing_', '');

            let listingData = steamListingInfo[id];

            // Make sure it is a CSGO item
            if (listingData.asset.appid == 730) {

                // Find the div for this item
                let listingname = row.querySelector(`#listing_${id}_name`);

                // Make sure it has an inspect link
                if ('market_actions' in listingData.asset) {
                    if (listingname != null && listingData.asset.market_actions.length > 0) {
                        // Obtain and format the inspect link
                        let inspectlink = listingData.asset.market_actions[0].link
                        .replace('%listingid%', id)
                        .replace('%assetid%', listingData.asset['id']);

                        // Make sure we didn't already add the button
                        if (!row.querySelector(`#item_${id}_floatdiv`)) {
                            let buttonDiv = document.createElement('div');
                            buttonDiv.style.display = 'inline';
                            buttonDiv.style.textAlign = 'left';
                            buttonDiv.id = `item_${id}_floatdiv`;

                            let getFloatButton = document.createElement('a');
                            getFloatButton.classList.add('btn_green_white_innerfade');
                            getFloatButton.classList.add('btn_small');
                            getFloatButton.classList.add('floatbutton');
                            getFloatButton.addEventListener('click', () => getCSGOFloat(inspectlink, id));
                            buttonDiv.appendChild(getFloatButton);

                            let buttonText = document.createElement('span');
                            buttonText.innerText = 'Get Float';
                            getFloatButton.appendChild(buttonText);

                            let messageDiv = document.createElement('div');
                            messageDiv.classList.add('floatmessage');
                            buttonDiv.appendChild(messageDiv);

                            listingname.parentElement.appendChild(buttonDiv);

                            // check if we already have the float for this item
                            if (id in floatData) {
                                processSuccess(id);
                            }
                        }
                    }
                }
                else {
                    // This page doesn't have weapons with inspect urls, clear the interval adding these buttons
                    clearInterval(floatTimer);
                }

            }
        }

        // Add show all button if it doesn't exist and we have valid items
        if (!document.querySelector('#allfloatbutton') && listingRows.length > 0) {
            addAllFloatButton();
        }
    }, 0);
}

floatTimer = setInterval(() => { addButtons(); }, 500);

console.log('%c CSGOFloat Market Checker (v1.0.2) by Step7750 ', 'background: #222; color: #fff;');
console.log('%c Changelog can be found here: https://github.com/Step7750/CSGOFloat ', 'background: #222; color: #fff;');
