let floatData = {}, inventory = {};
let walletInfo = {};
let sortTypeAsc = true;
let floatUtilitiesAdded = false;
const filters = new Filters();
const queue = new Queue();

const version = chrome.runtime.getManifest().version;

const getRankColour = function (rank) {
    switch (rank) {
        case 1:
            return '#c3a508';
        case 2:
        case 3:
            return '#9a9999';
        case 4:
        case 5:
            return '#8a5929';
        default:
            return '';
    }
};

const showFloat = async function(listingId) {
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
        let itemFloatDiv = floatDiv.querySelector('.csgofloat-itemfloat');

        if (itemFloatDiv) {
            itemFloatDiv.innerHTML = '';

            const floatText = floatDiv.minimal
                ? itemInfo.floatvalue.toFixed(6)
                : `Float: ${itemInfo.floatvalue.toFixed(14)}`;

            itemFloatDiv.appendChild(document.createTextNode(floatText));

            // Get whichever is the lower rank
            const rank = (itemInfo.low_rank || 1001) < (itemInfo.high_rank || 1001) ?
                itemInfo.low_rank : itemInfo.high_rank;

            if (rank && rank <= 1000) {
                if (floatDiv.minimal) {
                    itemFloatDiv.appendChild(document.createTextNode(` (#${rank})`));
                } else {
                    itemFloatDiv.appendChild(getRankLink(itemInfo, rank));
                }
            }

            if (rank <= 5 && floatDiv.minimal) {
                // Make the inventory box coloured ;)
                floatDiv.parentNode.style.color = 'black';
                floatDiv.parentNode.querySelector('img').style.backgroundColor = getRankColour(rank);
                floatDiv.parentNode.classList.add('float-shine');
            }
        }

        // Add the paint seed
        let seedDiv = floatDiv.querySelector('.csgofloat-itemseed');
        if (seedDiv) {
            let seedText = floatDiv.minimal ? itemInfo.paintseed : `Paint Seed: ${itemInfo.paintseed}`;
            if (hasDopplerPhase(itemInfo.paintindex)) {
                seedText += ` (${getDopplerPhase(itemInfo.paintindex)})`;
            }
            seedDiv.innerText = seedText;
            if (!floatDiv.minimal) {
                seedDiv.style.marginBottom = '10px';
            }
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

        const wearRange = rangeFromWear(itemInfo.floatvalue) || [0, 1];

        const vars = {
            float: itemInfo.floatvalue,
            seed: itemInfo.paintseed,
            minfloat: itemInfo.min,
            maxfloat: itemInfo.max,
            minwearfloat: wearRange[0],
            maxwearfloat: wearRange[1],
            phase: (getDopplerPhase(itemInfo.paintindex) || '').replace('Phase', '').trim(),
            low_rank: parseInt(itemInfo.low_rank),
            high_rank: parseInt(itemInfo.high_rank)
        };

        const listingInfo = steamListingInfo[listingId];

        let walletCurrency = walletInfo && walletInfo.wallet_currency;

        // Item currency is formatted as 20XX for most currencies where XX is the account currency
        if (walletCurrency && walletCurrency < 2000) {
            walletCurrency += 2000;
        }

        if (listingInfo && listingInfo.converted_price && listingInfo.converted_currencyid === walletCurrency) {
            vars.price = (listingInfo.converted_price + listingInfo.converted_fee) / 100;
        }

        if (!isInventoryPage()) {
            // Check to see if there is a filter match
            let filterColour = await filters.getMatchColour(vars);

            if (filterColour) {
                const textColour = pickTextColour(filterColour, '#8F98A0', '#484848');
                floatDiv.parentNode.parentNode.style.backgroundColor = filterColour;
                floatDiv.style.color = textColour;
            }
        }
    }
};

// Puts all of the available items on the page into the queue for float retrieval
const getAllFloats = function() {
    retrieveListingInfoFromPage().then(steamListingData => {
        // Get all current items on the page (in proper order)
        let listingRows = document.querySelectorAll('#searchResultsRows .market_listing_row.market_recent_listing_row');

        for (let row of listingRows) {
            // Check if we already fetched the float or if it is currently being fetched
            const itemFloat = row.querySelector('.csgofloat-itemfloat');
            if (itemFloat && (itemFloat.innerText.length > 0 || row.querySelector('#getFloatBtn span').fetching)) {
                continue;
            }

            let id = row.id.replace('listing_', '');

            let listingData = steamListingData[id];

            if (listingData.asset.market_actions.length === 0) {
                continue;
            }

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

const getPageMarketHashName = async function() {
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
    moneyLogo.height = 32;

    const staticText = document.createElement('span');
    staticText.innerText = 'Get this skin on ';
    staticText.style.verticalAlign = 'bottom';

    const priceText = document.createElement('span');
    const price = document.createElement('span');
    price.innerText = '$X.XX';
    price.style.fontWeight = 'bold';
    price.style.verticalAlign = 'bottom';

    priceText.appendChild(price);
    priceText.insertAdjacentText('afterbegin', ' for ');
    priceText.insertAdjacentText('beforeend', ' USD');

    priceText.style.verticalAlign = 'bottom';

    moneyButton.appendChild(staticText);
    moneyButton.appendChild(moneyLogo);
    moneyButton.appendChild(priceText);
    moneyButton.classList.add('float-money-button');
    csmoneyDiv.appendChild(moneyButton);

    const itemName = await getPageMarketHashName();
    moneyButton.href = `https://cs.money?s=float#skin_name_buy=${itemName}`;
    moneyButton.target = '_blank';

    // Fetch the current price on CS.Money
    const data = await sendMessage({ name: itemName, price: true });
    if (data.trade && data.buy) {
        price.innerText = `$${data.buy.toFixed(2)}`;
    } else {
        priceText.innerText = '';
    }

    if (data.link) {
        moneyButton.href = data.link;
    }

    document
        .querySelector('#searchResultsTable')
        .insertBefore(csmoneyDiv, document.querySelector('#searchResultsRows'));
};

const removeInventoryMods = function(parent) {
    const floatDivs = parent.querySelectorAll('div[id*="floatdiv"]');

    for (const div of floatDivs) {
        div.parentElement.removeChild(div);
    }

    const expiry = parent.querySelector('#csgofloat-owner-description');
    if (expiry) {
        expiry.parentElement.removeChild(expiry);
    }
};

const getAssetUntradableExpiry = function(assetId) {
    if (!inventory.success) return;

    const assetDetails = inventory.rgInventory && inventory.rgInventory[assetId];
    if (!assetDetails) return;

    const description =
        inventory.rgDescriptions && inventory.rgDescriptions[`${assetDetails.classid}_${assetDetails.instanceid}`];
    if (!description) return;

    if (!description.tradable) {
        return description.cache_expiration;
    }
};

const addInventoryMods = async function(boxContent) {
    removeInventoryMods(boxContent);

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
    for (let className of ['floatmessage', 'csgofloat-itemfloat', 'csgofloat-itemseed']) {
        let div = document.createElement('div');
        div.classList.add(className);
        floatDiv.appendChild(div);
    }

    // Check if this item is not tradable and if we can figure out when it expires
    // This currently only works for weapons
    const expires = getAssetUntradableExpiry(id);
    const isOwner =
        boxContent.querySelector('#iteminfo0_item_owner_descriptors') ||
        boxContent.querySelector('#iteminfo1_item_owner_descriptors');

    if (expires && isOwner.style.display === 'none') {
        const tagDiv =
            boxContent.querySelector('#iteminfo0_item_tags') || boxContent.querySelector('#iteminfo1_item_tags');

        const descriptionParent = document.createElement('div');
        descriptionParent.classList.add('item_desc_descriptors');
        descriptionParent.id = 'csgofloat-owner-description';

        const descriptor = document.createElement('div');
        descriptor.classList.add('descriptor');
        descriptor.style.color = 'rgb(255, 64, 64)';
        descriptor.innerText = 'Tradable After ' + new Date(expires).toGMTString();

        const descriptorBreak = document.createElement('div');
        descriptorBreak.classList.add('descriptor');
        descriptorBreak.innerHTML = '&nbsp;';

        descriptionParent.appendChild(descriptorBreak);
        descriptionParent.appendChild(descriptor);

        tagDiv.parentElement.insertBefore(descriptionParent, tagDiv);
    }

    // Check if we already have the float for this item
    if (id in floatData) {
        showFloat(id);
    } else {
        queue.addJob(inspectLink, id);
    }
};

// Adds float boxes to inventory pages
const addInventoryBoxes = async function() {
    const owner = await retrieveInventoryOwner();

    for (const page of document.querySelectorAll('.inventory_page')) {
        // Don't include non-visible pages
        if (page.style.display === 'none') {
            continue;
        }

        for (const itemHolder of page.querySelectorAll('.itemHolder')) {
            const item = itemHolder.querySelector('div.item.app730');
            if (!item) continue;
            const assetId = item.id.split('_')[2]; // TODO: Error check?

            const description = await retrieveInventoryItemDescription(assetId);
            if (
                !description ||
                !description.tags.find(
                    a => a.category === 'Weapon' || (a.category === 'Type' && a.internal_name === 'Type_Hands')
                )
            ) {
                continue;
            }

            if (!item.querySelector(`#item_${assetId}_floatdiv`)) {
                const s = document.createElement('span');
                s.id = `item_${assetId}_floatdiv`;
                s.minimal = true;

                const floatSpan = document.createElement('span');
                floatSpan.style.position = 'absolute';
                floatSpan.style.bottom = '3px';
                floatSpan.style.right = '3px';
                floatSpan.style.fontSize = '12px';
                floatSpan.classList.add('csgofloat-itemfloat');

                const seedSpan = document.createElement('span');
                seedSpan.style.position = 'absolute';
                seedSpan.style.top = '3px';
                seedSpan.style.right = '3px';
                seedSpan.style.fontSize = '12px';
                seedSpan.classList.add('csgofloat-itemseed');

                // Adjust styling for users who also use steam inventory helper
                if (item.querySelector('.p-price')) {
                    floatSpan.style.top = '3px';
                    floatSpan.style.bottom = '';
                    seedSpan.style.top = '17px';
                }

                s.appendChild(floatSpan);
                s.appendChild(seedSpan);

                item.appendChild(s);
            }

            const inspectLink = description.actions[0].link
                .replace('%owner_steamid%', owner)
                .replace('%assetid%', assetId);

            // If we don't already have data fetched
            if (!item.querySelector('.csgofloat-itemfloat').innerText) {
                if (assetId in floatData) {
                    showFloat(assetId);
                } else {
                    queue.addJob(inspectLink, assetId);
                }
            }
        }
    }
};

// If an item on the current page doesn't have the float div/buttons, this function adds it
const addMarketButtons = async function() {
    // Iterate through each item on the page
    let listingRows = document.querySelectorAll('#searchResultsRows .market_listing_row.market_recent_listing_row');

    for (let row of listingRows) {
        let id = row.id.replace('listing_', '');

        const steamListingData = await retrieveListingInfoFromPage(id);
        const listingData = steamListingData[id];

        if (!listingData || !listingData.asset.market_actions) return;

        if (row.querySelector(`#item_${id}_floatdiv`)) {
            continue;
        }

        const inspectLink = listingData.asset.market_actions[0].link
            .replace('%listingid%', id)
            .replace('%assetid%', listingData.asset.id);

        let listingNameElement = row.querySelector(`#listing_${id}_name`);

        let floatDiv = document.createElement('div');
        floatDiv.classList.add('float-div');
        floatDiv.id = `item_${id}_floatdiv`;
        listingNameElement.parentElement.appendChild(floatDiv);

        // Create divs the following class names and append them to the button div
        let divClassNames = ['floatmessage', 'csgofloat-itemfloat', 'csgofloat-itemseed'];

        for (let className of divClassNames) {
            let div = document.createElement('div');
            div.classList.add(className);
            floatDiv.appendChild(div);
        }

        let getFloatButton = createButton('Get Float', 'green', 'getFloatBtn');
        getFloatButton.addEventListener('click', () => {
            queue.addJob(inspectLink, id);
        });
        getFloatButton.style.marginRight = '10px';
        floatDiv.appendChild(getFloatButton);

        let fetchingModel = false;
        const modelButton = createButton('CS.Money 3D', 'green');
        modelButton.style.marginRight = '10px';
        modelButton.addEventListener('click', async () => {
            if (fetchingModel) return;

            // Makes iframe togglable
            const existingFrame = floatDiv.parentNode.parentNode.querySelector('.float-model-frame');
            if (existingFrame) {
                existingFrame.parentNode.removeChild(existingFrame);
                return;
            }

            // If screenshot open, remove it
            const existingScreenshot = floatDiv.parentNode.parentNode.querySelector('.float-screenshot-frame');
            if (existingScreenshot) {
                existingScreenshot.parentNode.removeChild(existingScreenshot);
            }

            fetchingModel = true; // prevent from repeatedly clicking the button
            modelButton.querySelector('span').innerText = 'Fetching 3D Model...';

            const hangOn = setTimeout(() => {
                modelButton.querySelector('span').innerText = 'Fetching 3D Model...hang on...';
            }, 5000);

            const data = await sendMessage({ inspectLink, model: true });
            clearTimeout(hangOn);
            fetchingModel = false;
            modelButton.querySelector('span').innerText = 'CS.Money 3D';

            if (data.modelLink) {
                const iframe = document.createElement('iframe');
                iframe.src = chrome.runtime.getURL('model_frame.html') + '?url=' + encodeURIComponent(data.modelLink);
                iframe.classList.add('float-model-frame');
                floatDiv.parentNode.parentNode.appendChild(iframe);
            } else if (data.error) {
                alert(data.error);
            }
        });
        floatDiv.appendChild(modelButton);

        let fetchingScreenshot = false;
        const screenshotButton = createButton('Screenshot', 'green');
        screenshotButton.addEventListener('click', async () => {
            if (fetchingScreenshot) return;

            // Makes screenshot togglable
            const existingScreenshot = floatDiv.parentNode.parentNode.querySelector('.float-screenshot-frame');
            if (existingScreenshot) {
                existingScreenshot.parentNode.removeChild(existingScreenshot);
                return;
            }

            // If 3D view is open, remove it
            const existingFrame = floatDiv.parentNode.parentNode.querySelector('.float-model-frame');
            if (existingFrame) {
                existingFrame.parentNode.removeChild(existingFrame);
            }

            fetchingScreenshot = true; // prevent from repeatedly clicking the button
            screenshotButton.querySelector('span').innerText = 'Fetching Screenshot...';

            const hangOn = setTimeout(() => {
                screenshotButton.querySelector('span').innerText = 'Fetching Screenshot...hang on...';
            }, 5000);

            const data = await sendMessage({ inspectLink, model: true });
            clearTimeout(hangOn);
            fetchingScreenshot = false;
            screenshotButton.querySelector('span').innerText = 'Screenshot';

            if (data.screenshotLink) {
                const img = document.createElement('img');
                img.src = data.screenshotLink;
                img.classList.add('float-screenshot-frame');
                floatDiv.parentNode.parentNode.appendChild(img);
            } else if (data.error) {
                alert(data.error);
            }
        });
        floatDiv.appendChild(screenshotButton);

        const assetID = listingData.asset.id;
        const steamListingAssets = await retrieveListingAssets(assetID);

        // Show inline stickers
        const asset = steamListingAssets[assetID];
        const lastDescription = asset.descriptions[asset.descriptions.length - 1];
        if (lastDescription.type === 'html' && lastDescription.value.includes('sticker')) {
            const imagesHtml = lastDescription.value.match(/(<img .*?>)/g);
            const nameMatch = lastDescription.value.match(/<br>([^<].*?): (.*)<\/center>/);

            if (nameMatch) {
                const stickerLang = nameMatch[1];
                const stickerNames = nameMatch[2].split(', ');

                // Adds href link to sticker
                let resHtml = '';
                for (let i = 0; i < imagesHtml.length; i++) {
                    const url =
                        stickerLang === 'Sticker'
                            ? `https://steamcommunity.com/market/listings/730/${stickerLang} | ${stickerNames[i]}`
                            : `https://steamcommunity.com/market/search?q=${stickerLang} | ${stickerNames[i]}`;

                    resHtml += `<span style="display: inline-block; text-align: center;">
                    <a target="_blank" href="${url}">${imagesHtml[i]}</a>
                    <span style="display: block;" id="sticker_${i}_wear"></span>
                    </span>`;
                }

                const imgContainer = document.createElement('div');
                imgContainer.classList.add('float-stickers-container');
                imgContainer.innerHTML = resHtml;
                const itemNameBlock = row.querySelector('.market_listing_item_name_block');
                itemNameBlock.insertBefore(imgContainer, itemNameBlock.firstChild);
            }
        }

        // Easy inspect link (only if they don't have SIH)
        if (!row.querySelector('.sih-inspect-magnifier')) {
            const imageContainer = row.querySelector('.market_listing_item_img_container');
            const easyLink = document.createElement('a');
            easyLink.href = inspectLink;
            easyLink.innerText = '🔍';
            easyLink.classList.add('easy-inspect');

            imageContainer.appendChild(easyLink);
        }

        // Remove Steam Inventory Helper Stickers (conflicts with ours)
        const sihStickers = row.querySelector('.sih-images');
        if (sihStickers) {
            sihStickers.parentElement.removeChild(sihStickers);
        }

        // check if we already have the float for this item
        if (id in floatData) {
            showFloat(id);
        }
    }

    // Add float utilities if it doesn't exist and we have valid items
    if (!floatUtilitiesAdded && listingRows.length > 0) {
        floatUtilitiesAdded = true;
        addFloatUtilities();
    }

    // Automatically retrieve all floats
    getAllFloats();
};

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


async function main() {
    migrateStorage();
    queue.start();

    walletInfo = await retrieveWalletInfo();

    if (isInventoryPage()) {
        retrieveInventoryOwner().then(async ownerId => {
            // We have to request the inventory from a separate endpoint that includes untradable expiration
            inventory = await sendMessage({ steamId: ownerId, inventory: true });

            const action0 = document.querySelector('#iteminfo0_item_actions');
            const action1 = document.querySelector('#iteminfo1_item_actions');

            // Page uses two divs that interchange with another on item change
            TargetMutationObserver(action0, t => addInventoryMods(t.parentElement.parentElement));
            TargetMutationObserver(action1, t => addInventoryMods(t.parentElement.parentElement));

            // Ensure we catch the first item div on page load
            addInventoryMods(action1.parentElement.parentElement);

            setInterval(() => {
                addInventoryBoxes();
            }, 250);
        });
    } else {
        setInterval(() => {
            addMarketButtons();
        }, 250);
    }
}

main();

const logStyle = 'background: #222; color: #fff;';
console.log(`%c CSGOFloat Market Checker (v${version}) by Step7750 `, logStyle);
console.log('%c Changelog can be found here: https://github.com/Step7750/CSGOFloat-Extension ', logStyle);
