import {EmptyResponseHandler, RequestType, RestrictedHandler} from "./main";

interface ExecuteCssRequest {
    path: string;
}

export const ExecuteCssOnPage = new RestrictedHandler(new EmptyResponseHandler<ExecuteCssRequest>(
    RequestType.EXECUTE_CSS_ON_PAGE,
    async (req, sender) => {
        await chrome.scripting.insertCSS(
            {
                target: {tabId: sender.tab?.id as number},
                files: [req.path],
            });
    }));
