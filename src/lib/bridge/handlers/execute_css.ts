import {EmptyResponseHandler, PrivilegedHandler} from './main';
import {RequestType} from './handlers';

interface ExecuteCssRequest {
    path: string;
}

export const ExecuteCssOnPage = new PrivilegedHandler(
    new EmptyResponseHandler<ExecuteCssRequest>(RequestType.EXECUTE_CSS_ON_PAGE, async (req, sender) => {
        await chrome.scripting.insertCSS({
            target: {tabId: sender.tab?.id as number},
            files: [req.path],
        });
    })
);
