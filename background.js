chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    let url;

    if (request.model) {
        url = `https://money.csgofloat.com/model?url=${request.inspectLink}`;
    } else if (request.price) {
        url = `https://money.csgofloat.com/price?name=${request.name}`;
    } else {
        url = `https://api.csgofloat.com/?url=${request.inspectLink}`;
    }

    fetch(url)
        .then(response => {
            response.json().then(data => sendResponse(data));
        })
        .catch(err => sendResponse(err));

    return true;
});
