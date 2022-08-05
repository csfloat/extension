import {EmptyResponseHandler, RequestType} from "./main";

interface ExecuteScriptRequest {
    path: string;
}

export const ExecuteScriptOnPage = new EmptyResponseHandler<ExecuteScriptRequest>(
    RequestType.EXECUTE_SCRIPT_ON_PAGE,
    async (req, sender) => {
        // VALIDATE THE PATH!!!
        await chrome.scripting.executeScript(
            {
                target: {tabId: sender.tab?.id as number},
                files: [req.path],
                world: 'MAIN'
            });
    });
