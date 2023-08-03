import {EmptyResponseHandler} from './main';
import {RequestType} from './types';
import {PrivilegedHandler} from '../wrappers/privileged';

interface ExecuteScriptRequest {
    path: string;
}

export const ExecuteScriptOnPage = new PrivilegedHandler(
    new EmptyResponseHandler<ExecuteScriptRequest>(RequestType.EXECUTE_SCRIPT_ON_PAGE, async (req, sender) => {
        // We need to inject the extension ID dynamically so the client knows who to
        // communicate with.
        //
        // On Firefox, extension IDs are random, so this is necessary.
        await chrome.scripting.executeScript({
            target: {tabId: sender.tab?.id as number},
            world: 'MAIN',
            args: [chrome.runtime.id, chrome.runtime.getURL('src/model_frame.html')],
            func: function ExtensionId(extensionId, modelFrameUrl) {
                window.CSFLOAT_EXTENSION_ID = extensionId;
                window.CSFLOAT_MODEL_FRAME_URL = modelFrameUrl;
            },
        });

        await chrome.scripting.executeScript({
            target: {tabId: sender.tab?.id as number},
            files: [req.path],
            world: 'MAIN',
        });
    })
);
