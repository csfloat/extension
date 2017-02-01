let floatQueue = [];
let floatData = {};
let floatTimer;
let expressionTimer;
let steamListingInfo = {};
let listingInfoPromises = [];
let validExpressionVars = ['float', 'seed', 'minfloat', 'maxfloat'];
let filterStrings = [];
let filters = [];

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

    return new Promise((resolve) => {
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

    let floatDiv = document.querySelector(`#item_${listingId}_floatdiv`);

    if (floatDiv) {
        // Remove the "get float" button
        let floatButton = floatDiv.querySelector('.float-btn');
        if (floatButton) floatDiv.removeChild(floatButton);

        // Remove message div
        let msgdiv = floatDiv.querySelector('.floatmessage');
        if (msgdiv) floatDiv.removeChild(msgdiv);

        // Add the float value
        let itemFloatDiv = floatDiv.querySelector('.itemfloat');
        if (itemFloatDiv) itemFloatDiv.innerText = `Float: ${itemInfo.floatvalue}`;

        // Add the paint seed
        let seedDiv = floatDiv.querySelector('.itemseed');
        if (seedDiv) seedDiv.innerText = `Paint Seed: ${itemInfo.paintseed}`;
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

    if (buttonText) buttonText.innerText = 'Fetching';

    getFloatData(lastItem.listingId, lastItem.inspectLink)
    .then((data) => {
        floatData[lastItem.listingId] = data.iteminfo;

        showFloat(lastItem.listingId);

        processFloatQueue();
    })
    .catch((err) => {
        // Reset the button text for this itemid
        if (buttonText) buttonText.innerText = 'Get Float';

        // Change the message div for this item to the error
        if (floatDiv) {
            floatDiv.querySelector('.floatmessage').innerText = err.error || 'Unknown Error';
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

const addFilter = function () {
    let filter = document.querySelector('#float_expression_filter').value;

    try {
        let compiled = compileExpression(filter, {}, validExpressionVars);

        // We know it is a valid expression
        filterStrings.push(filter);
        filters.push(compiled);

        addFilterUI(filter);
        saveFilters();
    }
    catch (e) {
        return;
    }
};

const removeFilter = function(e) {
    let removeBtn = e.srcElement;

    // get the parent
    let thisFilterDiv = removeBtn.parentNode.parentNode;

    // Remove the button
    thisFilterDiv.removeChild(removeBtn.parentNode);

    // get the expression string
    let expression = thisFilterDiv.innerText;

    // remove the div
    document.querySelector('#floatFilters').removeChild(thisFilterDiv);

    // Remove it from the arrays
    let filterID = filterStrings.indexOf(expression.trim());

    if (filterID === -1) return;
    
    filterStrings.splice(filterID, 1);
    filters.splice(filterID, 1);
    
    saveFilters();
};

const filterKeyPress = function() {
    if (expressionTimer) clearTimeout(expressionTimer);

    expressionTimer = setTimeout(() => {
        let input = document.querySelector('#float_expression_filter');
        let compileError = document.querySelector('#compileError');
        let status = document.querySelector('#compileStatus');
        let addFilterBtn = document.querySelector('#addFloatFilter');

        let expression = input.value;

        // try to compile the expression
        try {
            compileExpression(expression, {}, validExpressionVars);
            status.setAttribute('error', 'false');
            status.innerText = '✓';
            compileError.innerText = '';
            addFilterBtn.style.display = '';
        }
        catch (e) {
            status.setAttribute('error', 'true');
            status.innerText = '✗';
            compileError.innerText = e.message;
            addFilterBtn.style.display = 'none';
        }
    }, 250);
};

const getSaveKey = function() {
    let itemname = document.querySelector('.market_listing_nav a:nth-child(2)');

    if (!itemname) return;
    else return itemname.innerText + '_expressions';
};

const getSavedFilters = function(cb) {
    let key = getSaveKey();

    if (!key) cb([]);

    let syncFilters = {};
    syncFilters[key] = [];

    chrome.storage.sync.get(syncFilters, (items) => {
        cb(items[key]);
    });
};

const saveFilters = function() {
    let key = getSaveKey();

    if (!key) return;

    let syncFilters = {};
    syncFilters[key] = filterStrings;

    chrome.storage.sync.set(syncFilters);
};

const addFilterUI = function(expression) {
    let parentDiv = document.querySelector('#floatFilters');

    let thisDiv = document.createElement('div');
    thisDiv.innerText = expression;

    // Add remove filter btn
    let removeFilterBtn = createButton('Remove Filter', removeFilter, 'grey');
    removeFilterBtn.style.marginLeft = '0px';
    removeFilterBtn.style.marginTop = '-3px';
    removeFilterBtn.style.float = 'right';
    thisDiv.appendChild(removeFilterBtn);

    // Add line break
    let hr = document.createElement('hr');
    thisDiv.appendChild(hr);

    parentDiv.appendChild(thisDiv);
};

const createButton = function(text, eventListener, colour) {
    let btn = document.createElement('a');
    btn.classList.add(`btn_${colour}_white_innerfade`);
    btn.classList.add('btn_small');
    btn.style.marginLeft = '10px';
    btn.classList.add('float-btn');
    btn.addEventListener('click', eventListener);

    let span = document.createElement('span');
    span.innerText = text;
    btn.appendChild(span);

    return btn;
};

const addFiltersDiv = function(parent) {
    let filterdiv = document.createElement('div');
    filterdiv.id = 'floatFilter';
    parent.appendChild(filterdiv);

    // Add separator
    let hr = document.createElement('hr');
    filterdiv.appendChild(hr);

    // Adds filters div
    let filtersdiv = document.createElement('div');
    filtersdiv.id = 'floatFilters';
    filterdiv.appendChild(filtersdiv);

    // Add new filter input box
    let input = document.createElement('input');
    input.id = 'float_expression_filter';
    input.classList.add('filter_search_box');
    input.placeholder = 'Add Float Highlight Filter';
    input.style.width = '350px';
    input.addEventListener('keyup', filterKeyPress);
    filterdiv.appendChild(input);

    // Add compile status indicator
    let status = document.createElement('div');
    status.id = 'compileStatus';
    filterdiv.appendChild(status);

    // Add new filter btn
    let addFilterBtn = createButton('Add Filter', addFilter, 'green');
    addFilterBtn.id = 'addFloatFilter';
    addFilterBtn.style.display = 'none';
    addFilterBtn.style.marginLeft = '10px';

    filterdiv.appendChild(addFilterBtn);

    // Compile error div
    let compileError = document.createElement('div');
    compileError.id = 'compileError';
    filterdiv.appendChild(compileError);

    // Add any saved filters
    getSavedFilters((expressions) => {
        for (let expression of expressions) {
            filterStrings.push(expression);
            filters.push(compileExpression(expression, {}, validExpressionVars));
            addFilterUI(expression);
        }
    });
};

// Adds float utilities
const addFloatUtilities = function() {
    let parentDiv = document.createElement('div');
    parentDiv.id = 'floatUtilities';

    // Add get all floats button
    let allFloatButton = createButton('Get All Floats', getAllFloats, 'green');
    allFloatButton.style.marginLeft = '0px';
    parentDiv.appendChild(allFloatButton);

    // Add github link
    let githubLink = document.createElement('a');
    githubLink.classList.add('float-github');
    githubLink.href = 'https://github.com/Step7750/CSGOFloat';
    githubLink.innerText = 'Powered by CSGOFloat';
    parentDiv.appendChild(githubLink);

    // Add filter div
    addFiltersDiv(parentDiv);

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
        buttonDiv.classList.add('float-btn');
        buttonDiv.id = `item_${id}_floatdiv`;
        listingNameElement.parentElement.appendChild(buttonDiv);

        let getFloatButton = createButton('Get Float', getFloatButtonClicked, 'green');
        buttonDiv.appendChild(getFloatButton);

        // Create divs the following class names and append them to the button div
        let divClassNames = ['floatmessage', 'itemfloat', 'itemseed'];

        for (let className of divClassNames) {
            let div = document.createElement('div');
            div.classList.add(className);
            buttonDiv.appendChild(div);
        }

        // check if we already have the float for this item
        if (id in floatData) {
            showFloat(id);
        }
    }

    // Add float utilities if it doesn't exist and we have valid items
    if (!document.querySelector('#floatUtilities') && listingRows.length > 0) {
        addFloatUtilities();
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
console.log('%c CSGOFloat Market Checker (v1.2.0) by Step7750 ', logStyle);
console.log('%c Changelog can be found here: https://github.com/Step7750/CSGOFloat-Extension ', logStyle);
