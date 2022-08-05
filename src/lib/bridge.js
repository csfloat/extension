let steamListingInfo = {};
let steamListingAssets = {};
let listingInfoPromises = [];
let listingAssetPromises = [];
let inventoryItemRequests = [];
let inventoryOwnerRequests = [];
let isInventoryOwnerRequests = [];
let walletInfoRequests = [];
let partnerInfoRequests = [];
let tradeStatusRequests = [];

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
        for (const promise of listingAssetPromises) promise(steamListingAssets);
    } else if (e.data.type === 'inventoryOwner') {
        for (const promise of inventoryOwnerRequests) promise(e.data.owner);
    } else if (e.data.type === 'walletInfo') {
        for (const promise of walletInfoRequests) promise(e.data.wallet);
    } else if (e.data.type === 'partnerInfo') {
        for (const promise of partnerInfoRequests) promise(e.data.partner);
    } else if (e.data.type === 'isInventoryOwner') {
        for (const promise of isInventoryOwnerRequests) promise(e.data.isOwner);
    } else if (e.data.type === 'tradeStatus') {
        for (const promise of tradeStatusRequests) promise(e.data.tradeStatus);
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

const retrieveInventoryOwner = function() {
    window.postMessage(
        {
            type: 'requestInventoryOwner'
        },
        '*'
    );

    return new Promise(resolve => {
        inventoryOwnerRequests.push(resolve);
    });
};

const isInventoryOwner = function() {
    window.postMessage(
        {
            type: 'requestIsInventoryOwner'
        },
        '*'
    );

    return new Promise(resolve => {
        isInventoryOwnerRequests.push(resolve);
    });
};

const retrieveWalletInfo = function() {
    window.postMessage(
        {
            type: 'requestWalletInfo'
        },
        '*'
    );

    return new Promise(resolve => {
        walletInfoRequests.push(resolve);
    });
};

const retrievePartnerInfo = function() {
    window.postMessage(
        {
            type: 'requestPartnerInfo'
        },
        '*'
    );

    return new Promise(resolve => {
        partnerInfoRequests.push(resolve);
    });
};

const retrieveTradeStatus = function() {
    window.postMessage(
        {
            type: 'requestTradeStatus'
        },
        '*'
    );

    return new Promise(resolve => {
        tradeStatusRequests.push(resolve);
    });
};

const checkMarketHash = function() {
    window.postMessage(
        {
            type: 'checkMarketHash'
        },
        '*'
    );
};
