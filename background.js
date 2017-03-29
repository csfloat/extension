chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    fetch(`https://api.csgofloat.com:1738/?url=${request.inspectLink}`)
    .then((response) => {
        response.json().then((data) => sendResponse(data));
    })
    .catch((err) => sendResponse(err));

    return true;
});
