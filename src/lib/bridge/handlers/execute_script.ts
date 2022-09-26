import {EmptyResponseHandler, RequestType, PrivilegedHandler} from "./main";

interface ExecuteScriptRequest {
    path: string;
}

export const ExecuteScriptOnPage = new PrivilegedHandler(new EmptyResponseHandler<ExecuteScriptRequest>(
    RequestType.EXECUTE_SCRIPT_ON_PAGE,
    async (req, sender) => {
        await chrome.scripting.executeScript(
            {
                target: {tabId: sender.tab?.id as number},
                files: [req.path],
                world: 'MAIN'
            });
    }));
