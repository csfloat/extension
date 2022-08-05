import {Handle} from "./lib/bridge/server";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // TODO: ENSURE THE SENDER IS FROM WHERE WE EXPECT
    Handle(request, sender).then(response => {
        sendResponse(response);
    });
    return true;
});
