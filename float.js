let floatQueue = [];
let floatData = {};
let floatTimer;
let steamListingInfo = {};
let listingInfoPromises = [];

// retrieve g_rgListingInfo from page script
window.addEventListener('message', (e) => {
    if (e.data.type == 'listingInfo') {
        steamListingInfo = e.data.listingInfo;

        // resolve listingInfoPromises
        for (let promise of listingInfoPromises) promise(steamListingInfo);

        listingInfoPromises = [];
    }
});

const retrieveListingInfoFromPage = function(listingId) {
    if (listingId != null && (listingId in steamListingInfo)) {
        return Promise.resolve(steamListingInfo);
    }

    window.postMessage({
        type: 'requestListingInfo'
    }, '*');

    return new Promise((resolve, reject) => {
        listingInfoPromises.push(resolve);
    });
};

const getFloatData = function(listingId, inspectLink) {
    if (listingId in floatData) {
        return Promise.resolve({ iteminfo: floatData[listingId] });
    }

    return fetch(`https://api.csgofloat.com:1738/?url=${inspectLink}`)
    .then((response) => {
        if (response.ok) return response.json();
        return response.json().then((err) => { throw err; });
    });
};

const showFloat = function(listingId) {
    let itemInfo = floatData[listingId];

    if (itemInfo) setFloatText(listingId, `Float: ${itemInfo.floatvalue}<br>Paint Seed: ${itemInfo.paintseed}`, true);
};

const setFloatText = function(listingId, text, removeButton) {
    let floatDiv = document.querySelector(`#item_${listingId}_floatdiv`);

    if (floatDiv) {
        if (removeButton) {
            // Remove the "get float" button
            let floatButton = floatDiv.querySelector('.floatbutton');
            if (floatButton) { floatDiv.removeChild(floatButton); }
        }

        // Show the text to the user
        let msgdiv = floatDiv.querySelector('.floatmessage');
        msgdiv.innerHTML = text;
    }
};

const processFloatQueue = function() {
    if (floatQueue.length === 0) { return setTimeout(processFloatQueue, 100); }

    let lastItem = floatQueue.shift();

    let floatDiv = document.querySelector(`#item_${lastItem.listingId}_floatdiv`);

    if (!floatDiv) {
        // they have switched pages since initiating the request, so continue
        processFloatQueue();
        return;
    }

    let buttonText = floatDiv.querySelector('span');

    if (buttonText) { buttonText.innerText = 'Fetching'; }

    getFloatData(lastItem.listingId, lastItem.inspectLink)
    .then((data) => {
        floatData[lastItem.listingId] = data.iteminfo;

        showFloat(lastItem.listingId);

        processFloatQueue();
    })
    .catch((err) => {
        // Reset the button text for this itemid
        if (buttonText) { buttonText.innerText = 'Get Float'; }

        // Change the message div for this item to the error
        if (floatDiv) {
            floatDiv.querySelector('.floatmessage').innerHTML = err.error || 'Unknown Error';
        }

        processFloatQueue();
    });
};

// Puts all of the available items on the page into the queue for float retrieval
const getAllFloats = function() {
    retrieveListingInfoFromPage()
    .then((steamListingData) => {
        // Get all current items on the page (in proper order)
        let listingRows = document.querySelectorAll('.market_listing_row.market_recent_listing_row');

        for (let row of listingRows) {
            let id = row.id.replace('listing_', '');

            let listingData = steamListingData[id];

            let inspectLink = listingData.asset.market_actions[0].link
            .replace('%listingid%', id)
            .replace('%assetid%', listingData.asset.id);

            floatQueue.push({ listingId: id, inspectLink: inspectLink });
        }
    });
};

// Adds the "Get all floats" button
const addAllFloatButton = function() {
    let parentDiv = document.createElement('div');
    parentDiv.style.padding = '10px';
    parentDiv.style.marginTop = '10px';
    parentDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';

    let allFloatButton = document.createElement('a');
    allFloatButton.id = 'allfloatbutton';
    allFloatButton.classList.add('btn_green_white_innerfade');
    allFloatButton.classList.add('btn_small');
    allFloatButton.addEventListener('click', getAllFloats);
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
};

const getFloatButtonClicked = function(e) {
    let row = e.currentTarget.parentElement.parentElement.parentElement;
    let id = row.id.replace('listing_', '');

    retrieveListingInfoFromPage(id)
    .then((steamListingData) => {
        let listingData = steamListingData[id];

        if (!listingData) return;

        let inspectLink = listingData.asset.market_actions[0].link
        .replace('%listingid%', id)
        .replace('%assetid%', listingData.asset.id);

        floatQueue.push({ listingId: id, inspectLink: inspectLink });
    });
};

// If an item on the current page doesn't have the float div/buttons, this function adds it
const addButtons = function() {
    // Iterate through each item on the page
    let listingRows = document.querySelectorAll('.market_listing_row.market_recent_listing_row');

    for (let row of listingRows) {
        let id = row.id.replace('listing_', '');

        if (row.querySelector(`#item_${id}_floatdiv`)) { continue; }

        let listingNameElement = row.querySelector(`#listing_${id}_name`);

        let buttonDiv = document.createElement('div');
        buttonDiv.style.display = 'inline';
        buttonDiv.style.textAlign = 'left';
        buttonDiv.id = `item_${id}_floatdiv`;
        listingNameElement.parentElement.appendChild(buttonDiv);

        let getFloatButton = document.createElement('a');
        getFloatButton.classList.add('btn_green_white_innerfade');
        getFloatButton.classList.add('btn_small');
        getFloatButton.classList.add('floatbutton');
        getFloatButton.addEventListener('click', getFloatButtonClicked);
        buttonDiv.appendChild(getFloatButton);

        let buttonText = document.createElement('span');
        buttonText.innerText = 'Get Float';
        getFloatButton.appendChild(buttonText);

        let messageDiv = document.createElement('div');
        messageDiv.classList.add('floatmessage');
        buttonDiv.appendChild(messageDiv);

        // check if we already have the float for this item
        if (id in floatData) {
            showFloat(id);
        }
    }

    // Add show all button if it doesn't exist and we have valid items
    if (!document.querySelector('#allfloatbutton') && listingRows.length > 0) {
        addAllFloatButton();
    }
};

// register the message listener in the page scope
let script = document.createElement('script');
script.innerText = `
    window.addEventListener('message', (e) => {
        if (e.data.type == 'requestListingInfo') {
            window.postMessage({
                type: 'listingInfo',
                listingInfo: g_rgListingInfo
            }, '*');
        }
    });
`;
document.head.appendChild(script);

floatTimer = setInterval(() => { addButtons(); }, 500);

// start the queue processing loop
processFloatQueue();

const logStyle = 'background: #222; color: #fff;';
console.log('%c CSGOFloat Market Checker (v1.1.1) by Step7750 ', logStyle);
console.log('%c Changelog can be found here: https://github.com/Step7750/CSGOFloat-Extension ', logStyle);
