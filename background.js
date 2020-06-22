chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    let url;
    const options = {};

    if (request.model) {
        url = `https://money.csgofloat.com/model?url=${request.inspectLink}`;
    } else if (request.price) {
        url = `https://money.csgofloat.com/price?name=${request.name}`;
    } else if (request.inventory) {
        url = `https://steamcommunity.com/profiles/${request.steamId}/inventory/json/730/2?l=english`;
    } else if (request.floatMarket) {
        options.credentials = 'include';
        url = `https://csgofloat.com/api/v1/me/pending-trades`;
    } else if (request.stall) {
        url = `https://csgofloat.com/api/v1/users/${request.steamId}/stall`;
    } else {
        url = `https://api.csgofloat.com/?url=${request.inspectLink}&minimal=true${request.listPrice ? '&listPrice=' + request.listPrice : ''}`;
    }

    fetch(url, options)
        .then(response => {
            response.json().then(data => sendResponse(data));
        })
        .catch(err => sendResponse(err));

    return true;
});
