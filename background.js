chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    let url;

    if (request.model) {
        url = `https://money.csgofloat.com/model?url=${request.inspectLink}`;
    } else if (request.price) {
        url = `https://money.csgofloat.com/price?name=${request.name}`;
    } else if (request.inventory) {
        url = `https://steamcommunity.com/profiles/${request.steamId}/inventory/json/730/2?l=english`;
    } else if (request.floatMarket) {
        url = `https://beta.csgofloat.com/api/v1/me/pending-trades`;
    } else if (request.stall) {
        url = `https://beta.csgofloat.com/api/v1/users/${request.steamId}/stall`;
    } else {
        url = `https://api.csgofloat.com/?url=${request.inspectLink}&minimal=true`;
    }

    fetch(url, {credentials: 'include'})
        .then(response => {
            response.json().then(data => sendResponse(data));
        })
        .catch(err => sendResponse(err));

    return true;
});
