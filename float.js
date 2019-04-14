let floatData = {};
let floatTimer;
let steamListingInfo = {};
let listingInfoPromises = [];
let steamListingAssets = {};
let listingAssetPromises = [];
let inventoryItemRequests = [];
let sortTypeAsc = true;
let filters = new Filters();

const version = chrome.runtime.getManifest().version;

class Queue {
    constructor() {
        this.queue = [];
        this.running = false;
        this.concurrency = 10;
        this.processing = 0;
    }

    addJob(link, listingId) {
        if (listingId in floatData) {
            showFloat(listingId);
            return;
        }

        const job = {
            link,
            listingId
        };

        const promise = new Promise((resolve, reject) => {
            job.resolve = resolve;
            job.reject = reject;
        });

        this.queue.push(job);
        this.checkQueue();

        return promise;
    }

    checkQueue() {
        if (!this.running) return;

        if (this.queue.length > 0 && this.processing < this.concurrency) {
            // there is a free bot, process the job
            let job = this.queue.shift();

            this.processing += 1;

            const floatDiv = document.querySelector(`#item_${job.listingId}_floatdiv`);

            // Changed pages, cancel request
            if (!floatDiv) {
                this.processing -= 1;
                this.checkQueue();
                return;
            }

            const buttonText = floatDiv.querySelector('#getFloatBtn span');
            if (buttonText) buttonText.innerText = 'Fetching';

            chrome.runtime.sendMessage({ inspectLink: job.link }, data => {
                if (data && data.iteminfo) {
                    floatData[job.listingId] = data.iteminfo;
                    showFloat(job.listingId);
                } else {
                    // Reset the button text for this itemid
                    if (buttonText) buttonText.innerText = 'Get Float';

                    // Change the message div for this item to the error
                    if (floatDiv) {
                        floatDiv.querySelector('.floatmessage').innerText = data.error || 'Unknown Error';
                    }
                }

                this.processing -= 1;
                this.checkQueue();
            });
        }
    }

    start() {
        if (!this.running) {
            this.running = true;
            this.checkQueue();
        }
    }
}

// retrieve g_rgListingInfo from page script
window.addEventListener('message', e => {
    if (e.data.type === 'listingInfo') {
        steamListingInfo = e.data.listingInfo;

        // resolve listingInfoPromises
        for (let promise of listingInfoPromises) promise(steamListingInfo);

        listingInfoPromises = [];
    } else if (e.data.type === 'inventoryItemDescription') {
        const unfulfilledRequests = [];

        for (const request of inventoryItemRequests) {
            if (request.assetId === e.data.assetId) {
                request.promise(e.data.description);
            } else {
                unfulfilledRequests.push(request);
            }
        }

        inventoryItemRequests = unfulfilledRequests;
    } else if (e.data.type === 'listingAssets') {
        steamListingAssets = e.data.assets[730][2];
        for (let promise of listingAssetPromises) promise(steamListingAssets);
    }
});

const retrieveListingInfoFromPage = function(listingId) {
    if (listingId != null && listingId in steamListingInfo) {
        return Promise.resolve(steamListingInfo);
    }

    window.postMessage(
        {
            type: 'requestListingInfo'
        },
        '*'
    );

    return new Promise(resolve => {
        listingInfoPromises.push(resolve);
    });
};

const retrieveListingAssets = function(assetId) {
    if (assetId != null && assetId in steamListingAssets) {
        return Promise.resolve(steamListingAssets);
    }

    window.postMessage(
        {
            type: 'requestAssets'
        },
        '*'
    );

    return new Promise(resolve => {
        listingAssetPromises.push(resolve);
    });
};

const retrieveInventoryItemDescription = function(assetId) {
    window.postMessage(
        {
            type: 'requestInventoryItemDescription',
            assetId
        },
        '*'
    );

    return new Promise(resolve => {
        inventoryItemRequests.push({ promise: resolve, assetId });
    });
};

const showFloat = function(listingId) {
    let itemInfo = floatData[listingId];

    let floatDivs = document.querySelectorAll(`#item_${listingId}_floatdiv`);

    for (const floatDiv of floatDivs) {
        // Remove the "get float" button
        let floatButton = floatDiv.querySelector('#getFloatBtn');
        if (floatButton) floatDiv.removeChild(floatButton);

        // Remove message div
        let msgdiv = floatDiv.querySelector('.floatmessage');
        if (msgdiv) floatDiv.removeChild(msgdiv);

        // Add the float value
        let itemFloatDiv = floatDiv.querySelector('.itemfloat');
        if (itemFloatDiv) itemFloatDiv.innerText = `Float: ${itemInfo.floatvalue}`;

        // Add the paint seed
        let seedDiv = floatDiv.querySelector('.itemseed');
        if (seedDiv) {
            seedDiv.innerText = `Paint Seed: ${itemInfo.paintseed}`;
            seedDiv.style.marginBottom = '10px';
        }

        // Set the wear value for each sticker
        for (let stickerIndex = 0; stickerIndex < itemInfo.stickers.length; stickerIndex++) {
            const sticker = itemInfo.stickers[stickerIndex];

            // Check if the sticker div exists
            const stickerWearDiv = floatDiv.parentNode.querySelector(`#sticker_${stickerIndex}_wear`);
            if (stickerWearDiv) {
                stickerWearDiv.innerText = Math.round(100 * (sticker.wear || 0)) + '%';
            }
        }

        const wearRange = rangeFromWear(itemInfo.wear_name) || [0, 1];

        let vars = {
            float: itemInfo.floatvalue,
            seed: itemInfo.paintseed,
            minfloat: itemInfo.min,
            maxfloat: itemInfo.max,
            minwearfloat: wearRange[0],
            maxwearfloat: wearRange[1]
        };

        // Check to see if there is a filter match
        let filterColour = filters.getMatchColour(vars);

        if (filterColour) {
            const textColour = pickTextColour(filterColour, '#8F98A0', '#484848');
            floatDiv.parentNode.parentNode.style.backgroundColor = filterColour;
            floatDiv.style.color = textColour;
        }
    }
};

// Puts all of the available items on the page into the queue for float retrieval
const getAllFloats = function() {
    retrieveListingInfoFromPage().then(steamListingData => {
        // Get all current items on the page (in proper order)
        let listingRows = document.querySelectorAll('#searchResultsRows .market_listing_row.market_recent_listing_row');

        for (let row of listingRows) {
            // Check if we already fetched the float
            if (row.querySelector('.itemfloat').innerText.length > 0) {
                continue;
            }

            let id = row.id.replace('listing_', '');

            let listingData = steamListingData[id];

            let inspectLink = listingData.asset.market_actions[0].link
                .replace('%listingid%', id)
                .replace('%assetid%', listingData.asset.id);

            queue.addJob(inspectLink, id);
        }
    });
};

const sortByFloat = function() {
    const listingRows = document.querySelectorAll('#searchResultsRows .market_listing_row.market_recent_listing_row');

    document.querySelector('#csgofloat_sort_by_float span').textContent = `Sort by Float ${sortTypeAsc ? '▲' : '▼'}`;

    const items = {};

    for (const row of listingRows) {
        const id = row.id.replace('listing_', '');

        if (floatData[id] && floatData[id].floatvalue) {
            items[id] = floatData[id];
        }
    }

    const sortAsc = (a, b) => items[a].floatvalue - items[b].floatvalue;
    const sortDesc = (a, b) => items[b].floatvalue - items[a].floatvalue;

    // Only items that have floats fetched
    const sortedItems = Object.keys(items).sort(sortTypeAsc ? sortAsc : sortDesc);

    let lastItem = document.querySelector('#searchResultsRows .market_listing_table_header');

    for (const itemId of sortedItems) {
        const itemElement = document.querySelector(`#listing_${itemId}`);
        const newElem = itemElement.parentNode.insertBefore(itemElement, lastItem.nextSibling);
        lastItem = newElem;
    }

    sortTypeAsc = !sortTypeAsc;
};

const getSavedPageSize = function() {
    return new Promise((resolve, reject) => {
        const storageType = chrome.storage.sync ? chrome.storage.sync : chrome.storage.local;

        storageType.get(['pageSize'], size => {
            resolve(size && size.pageSize);
        });
    });
};

const savePageSize = function(size) {
    const storageType = chrome.storage.sync ? chrome.storage.sync : chrome.storage.local;
    storageType.set({ pageSize: size });
};

const getPageMarketHashName = async function () {
    const assets = await retrieveListingAssets();
    const defaultName = document.querySelector('.market_listing_item_name').innerText;

    try {
        // Attempts to retrieve the english market hash name regardless of the page language
        const assetId = Object.keys(assets)[0];
        return assets[assetId]['market_hash_name'];
    } catch (e) {
        return defaultName;
    }
};

// Adds float utilities
const addFloatUtilities = async function() {
    let parentDiv = document.createElement('div');
    parentDiv.id = 'floatUtilities';

    let sortByFloatsButton = createButton('Sort by Float', 'green');
    sortByFloatsButton.id = 'csgofloat_sort_by_float';
    sortByFloatsButton.addEventListener('click', sortByFloat);
    parentDiv.appendChild(sortByFloatsButton);

    let savedPageSize = await getSavedPageSize();
    if (!savedPageSize) savedPageSize = 10;

    // Create page size dropdown
    const pageSize = document.createElement('select');
    pageSize.id = 'pageSize';

    const option = document.createElement('option');
    option.innerText = 'Per Page';
    option.setAttribute('disabled', '');
    pageSize.appendChild(option);

    for (const i of [10, 25, 50, 100]) {
        const option = document.createElement('option');
        option.innerText = i;
        option.value = i;

        if (i === savedPageSize) {
            option.setAttribute('selected', '');
        }

        pageSize.appendChild(option);
    }

    pageSize.addEventListener('change', e => {
        const newSize = parseInt(e.srcElement.value);
        window.postMessage(
            {
                type: 'changePageSize',
                pageSize: newSize
            },
            '*'
        );
        savePageSize(newSize);
    });

    parentDiv.appendChild(pageSize);

    // Change the page size on first load
    if (savedPageSize && savedPageSize !== 10) {
        window.postMessage(
            {
                type: 'changePageSize',
                pageSize: savedPageSize
            },
            '*'
        );
    }

    // Add github link
    let githubLink = document.createElement('a');
    githubLink.classList.add('float-github');
    githubLink.href = 'https://github.com/Step7750/CSGOFloat';
    githubLink.innerText = 'Powered by CSGOFloat';
    parentDiv.appendChild(githubLink);

    // Add filter div
    filters.addFilterUI(parentDiv);

    document.querySelector('#searchResultsTable').insertBefore(parentDiv, document.querySelector('#searchResultsRows'));

    // Add CS.Money prices
    const csmoneyDiv = document.createElement('div');
    csmoneyDiv.id = 'floatMoney';

    const moneyButton = document.createElement('a');
    const moneyLogo = document.createElement('img');
    moneyLogo.src = 'https://cs.money/images/logo_icons/logo.svg';
    moneyLogo.height = 30;

    let text = document.createElement('span');
    text.innerText = ' Buy for $X.XX, Trade for $X.XX';
    text.style.verticalAlign = 'bottom';
    moneyButton.appendChild(moneyLogo);
    moneyButton.appendChild(text);
    moneyButton.classList.add('float-money-button');
    csmoneyDiv.appendChild(moneyButton);


    const itemName = await getPageMarketHashName();
    moneyButton.href = `https://cs.money?s=float#skin_name_buy=${itemName}`;
    moneyButton.target = '_blank';

    // Fetch the current price on CS.Money
    chrome.runtime.sendMessage({ name: itemName, price: true }, data => {
        if (data.trade && data.buy) {
            text.innerText = ` Buy for $${data.buy.toFixed(2)}, Trade for $${data.trade.toFixed(2)}`;
        } else {
            text.innerText = ` Buy and Trade`;
        }
    });

    document
        .querySelector('#searchResultsTable')
        .insertBefore(csmoneyDiv, document.querySelector('#searchResultsRows'));
};

const removeInventoryButtons = function(parent) {
    const floatDivs = parent.querySelectorAll('div[id*="floatdiv"]');

    for (const div of floatDivs) {
        div.parentElement.removeChild(div);
    }
};

const addInventoryFloat = async function(boxContent) {
    removeInventoryButtons(boxContent);

    // Get the inspect link
    const inspectButton = boxContent.querySelector('div.item_actions a.btn_small');

    if (!inspectButton || !extractInspectAssetId(inspectButton.href)) {
        return;
    }

    const inspectLink = inspectButton.href;
    const id = extractInspectAssetId(inspectLink);

    // Check if we already placed the button
    if (boxContent.querySelector(`#item_${id}_floatdiv`)) {
        return;
    }

    // Check if this is a weapon
    const description = await retrieveInventoryItemDescription(id);
    if (
        !description ||
        !description.tags.find(
            a => a.category === 'Weapon' || (a.category === 'Type' && a.internal_name === 'Type_Hands')
        )
    ) {
        return;
    }

    const floatDiv = document.createElement('div');
    floatDiv.style.marginBottom = '10px';
    floatDiv.id = `item_${id}_floatdiv`;

    const gameInfo = boxContent.querySelector('.item_desc_game_info');
    gameInfo.parentElement.insertBefore(floatDiv, gameInfo.nextSibling);

    const getFloatButton = createButton('Fetching...', 'green', 'getFloatBtn');
    getFloatButton.inspectLink = inspectLink;
    floatDiv.appendChild(getFloatButton);

    // Create divs the following class names and append them to the button div
    for (let className of ['floatmessage', 'itemfloat', 'itemseed']) {
        let div = document.createElement('div');
        div.classList.add(className);
        floatDiv.appendChild(div);
    }

    // check if we already have the float for this item
    if (id in floatData) {
        showFloat(id);
    } else {
        queue.addJob(inspectLink, id);
    }
};

// If an item on the current page doesn't have the float div/buttons, this function adds it
const addMarketButtons = async function() {
    // Iterate through each item on the page
    let listingRows = document.querySelectorAll('#searchResultsRows .market_listing_row.market_recent_listing_row');

    for (let row of listingRows) {
        let id = row.id.replace('listing_', '');

        if (row.querySelector(`#item_${id}_floatdiv`)) {
            continue;
        }

        let listingNameElement = row.querySelector(`#listing_${id}_name`);

        let floatDiv = document.createElement('div');
        floatDiv.classList.add('float-div');
        floatDiv.id = `item_${id}_floatdiv`;
        listingNameElement.parentElement.appendChild(floatDiv);

        // Create divs the following class names and append them to the button div
        let divClassNames = ['floatmessage', 'itemfloat', 'itemseed'];

        for (let className of divClassNames) {
            let div = document.createElement('div');
            div.classList.add(className);
            floatDiv.appendChild(div);
        }

        let getFloatButton = createButton('Get Float', 'green', 'getFloatBtn');
        getFloatButton.addEventListener('click', () => {
            retrieveListingInfoFromPage(id).then(steamListingData => {
                let listingData = steamListingData[id];

                if (!listingData) return;

                let inspectLink = listingData.asset.market_actions[0].link
                    .replace('%listingid%', id)
                    .replace('%assetid%', listingData.asset.id);

                queue.addJob(inspectLink, id);
            });
        });
        getFloatButton.style.marginRight = '10px';
        floatDiv.appendChild(getFloatButton);

        let fetchingModel = false;
        const modelButton = createButton('CS.Money 3D', 'green');
        modelButton.addEventListener('click', async () => {
            if (fetchingModel) return;

            fetchingModel = true; // prevent from repeatedly clicking the button
            modelButton.querySelector('span').innerText = 'Fetching 3D Model...';

            const steamListingData = await retrieveListingInfoFromPage(id);
            let listingData = steamListingData[id];

            if (!listingData) return;

            let inspectLink = listingData.asset.market_actions[0].link
                .replace('%listingid%', id)
                .replace('%assetid%', listingData.asset.id);

            chrome.runtime.sendMessage({ inspectLink, model: true }, data => {
                if (data.modelLink) {
                    const iframe = document.createElement('iframe');
                    iframe.src =
                        chrome.runtime.getURL('model_frame.html') + '?url=' + encodeURIComponent(data.modelLink);
                    iframe.classList.add('float-model-frame');
                    floatDiv.parentNode.parentNode.appendChild(iframe);
                    floatDiv.removeChild(modelButton);
                } else if (data.error) {
                    alert(data.error);
                    modelButton.querySelector('span').innerText = 'CS.Money 3D';
                    fetchingModel = false;
                }
            });
        });
        floatDiv.appendChild(modelButton);

        const steamListingData = await retrieveListingInfoFromPage(id);
        const listingData = steamListingData[id];
        if (!listingData) return;

        const assetID = listingData.asset.id;
        const steamListingAssets = await retrieveListingAssets(assetID);

        const asset = steamListingAssets[assetID];
        const lastDescription = asset.descriptions[asset.descriptions.length - 1];
        if (lastDescription.type === 'html' && lastDescription.value.includes('sticker')) {
            const imagesHtml = lastDescription.value.match(/(<img .*?>)/g);
            const stickerNames = lastDescription.value.match(/Sticker: (.*?)</)[1].split(', ');

            // Adds href link to sticker
            let resHtml = '';
            for (let i = 0; i < stickerNames.length; i++) {
                resHtml += `<span style="display: inline-block; text-align: center;">
                    <a target="_blank" href="https://steamcommunity.com/market/listings/730/Sticker | ${
                        stickerNames[i]
                    }">${imagesHtml[i]}</a>
                    <span style="display: block;" id="sticker_${i}_wear"></span>
                    </span>`;
            }

            const imgContainer = document.createElement('div');
            imgContainer.classList.add('float-stickers-container');
            imgContainer.innerHTML = resHtml;
            const itemNameBlock = row.querySelector('.market_listing_item_name_block');
            itemNameBlock.insertBefore(imgContainer, itemNameBlock.firstChild);
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

    // Automatically retrieve all floats
    getAllFloats();
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
        } else if (e.data.type == 'requestAssets') {
            window.postMessage({
                type: 'listingAssets',
                assets: g_rgAssets
            }, '*');
        } else if (e.data.type == 'requestInventoryItemDescription') {
            const asset = g_ActiveInventory.m_rgAssets[e.data.assetId];
            const key = asset.instanceid == "0" ? asset.classid : asset.classid + '_' + asset.instanceid;
            const description = g_ActiveInventory.m_rgDescriptions[key];

            window.postMessage({
                type: 'inventoryItemDescription',
                assetId: e.data.assetId,
                description: g_ActiveInventory.m_rgDescriptions[key]
            }, '*');
        } else if (e.data.type == 'changePageSize') {
            g_oSearchResults.m_cPageSize = e.data.pageSize;
            g_oSearchResults.GoToPage(0, true);
        }
    });
`;

const getStorageVersion = async function(storageType) {
    return new Promise((resolve, reject) => {
        storageType.get(['version'], items => {
            resolve(items['version'] || '0.0.0');
        });
    });
};

const migrateStorage = async function() {
    let storageType = chrome.storage.sync;
    if (!storageType) storageType = chrome.storage.local;

    const storageVersion = await getStorageVersion(storageType);

    if (versionCompare(storageVersion, '1.2.2') === -1) {
        // storageVersion < 1.2.2
        console.log('Migrating storage to 1.2.2');
        storageType.get(null, items => {
            // Want to remove all keys that are empty arrays
            // #20
            const keys = Object.keys(items);
            const emptyKeys = [];

            for (const key of keys) {
                if (Array.isArray(items[key]) && items[key].length === 0) {
                    emptyKeys.push(key);
                }
            }

            storageType.remove(emptyKeys);
        });
    }

    storageType.set({ version });
};

const TargetMutationObserver = function(target, cb) {
    return new MutationObserver(() => {
        cb(target);
    }).observe(target, { childList: true, subtree: true });
};

migrateStorage();

document.head.appendChild(script);

const queue = new Queue();
queue.start();

if (isInventoryPage()) {
    const action0 = document.querySelector('#iteminfo0_item_actions');
    const action1 = document.querySelector('#iteminfo1_item_actions');

    TargetMutationObserver(action0, t => addInventoryFloat(t.parentElement.parentElement));
    TargetMutationObserver(action1, t => addInventoryFloat(t.parentElement.parentElement));
} else {
    floatTimer = setInterval(() => {
        addMarketButtons();
    }, 250);
}

const logStyle = 'background: #222; color: #fff;';

console.log(`%c CSGOFloat Market Checker (v${version}) by Step7750 `, logStyle);
console.log('%c Changelog can be found here: https://github.com/Step7750/CSGOFloat-Extension ', logStyle);
