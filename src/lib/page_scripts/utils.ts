import {ExecuteScriptOnPage} from '../bridge/handlers/execute_script';
import {ClientSend} from '../bridge/client';
import {inPageContext} from '../utils/snips';
import {ExecuteCssOnPage} from '../bridge/handlers/execute_css';
import {FetchExtensionFile} from '../bridge/handlers/fetch_extension_file';
import {isFirefox} from '../utils/detect';
import {g_PostMessageBus} from '../bus/post_message_bus';

async function initiateChromium(scriptPath: string) {
    ClientSend(ExecuteCssOnPage, {
        path: 'src/global.css',
    });

    ClientSend(ExecuteScriptOnPage, {
        path: scriptPath,
    });
}

async function initiateFirefox(scriptPath: string) {
    g_PostMessageBus.handleRequests();

    // Why do we need to use manual DOM script injection and
    // fetch the text of the script?
    // See https://github.com/csfloat/extension/issues/155#issuecomment-1639781914

    // We want to inject the ID of the extension
    const id = browser.runtime.id;
    const entryScript = document.createElement('script');
    entryScript.appendChild(
        document.createTextNode(`
        window.CSFLOAT_EXTENSION_ID = '${id}';
    `)
    );
    document.head.appendChild(entryScript);

    const scriptResp = await ClientSend(FetchExtensionFile, {
        path: scriptPath,
    });

    const script = document.createElement('script');
    script.appendChild(document.createTextNode(scriptResp.text));
    document.head.appendChild(script);

    const styleResp = await ClientSend(FetchExtensionFile, {
        path: 'src/global.css',
    });

    const style = document.createElement('style');
    style.appendChild(document.createTextNode(styleResp.text));
    document.head.appendChild(style);
}
/**
 * Initializes a page script, executing it in the page context if necessary
 *
 * @param scriptPath Relative path of the script (always in .js)
 * @param ifPage Fn to run if we are in the page's execution context
 */
export async function init(scriptPath: string, ifPage: () => any) {
    // Don't allow the page script to run this.
    if (inPageContext()) {
        // @ts-ignore Set global identifier for other extensions to use
        window.csfloat = true;
        // @ts-ignore Deprecated name
        window.csgofloat = true;

        ifPage();
        return;
    }

    if (isFirefox()) {
        await initiateFirefox(scriptPath);
    } else {
        await initiateChromium(scriptPath);
    }

    console.log(
        `%c CSFloat Market Checker (v${chrome.runtime.getManifest().version}) by Step7750 `,
        'background: #004594; color: #fff;'
    );
    console.log(
        '%c Changelog can be found here: https://github.com/csfloat/extension ',
        'background: #004594; color: #fff;'
    );
}
