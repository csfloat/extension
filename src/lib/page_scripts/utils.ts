import {ExecuteScriptOnPage} from '../bridge/handlers/execute_script';
import {ClientSend} from '../bridge/client';
import {inPageContext} from '../utils/snips';
import {ExecuteCssOnPage} from '../bridge/handlers/execute_css';

/**
 * Initializes a page script, executing it in the page context if necessary
 *
 * @param scriptPath Relative path of the script (always in .js)
 * @param ifPage Fn to run if we are in the page's execution context
 */
export function init(scriptPath: string, ifPage: () => any) {
    // Don't allow the page script to run this.
    if (inPageContext()) {
        // @ts-ignore Set global identifier for other extensions to use
        window.csgofloat = true;

        ifPage();
        return;
    }

    // Global styles
    ClientSend(ExecuteCssOnPage, {
        path: 'src/global.css',
    });

    ClientSend(ExecuteScriptOnPage, {
        path: scriptPath,
    });

    console.log(
        `%c CSGOFloat Market Checker (v${chrome.runtime.getManifest().version}) by Step7750 `,
        'background: #004594; color: #fff;'
    );
    console.log(
        '%c Changelog can be found here: https://github.com/csgofloat/extension ',
        'background: #004594; color: #fff;'
    );
}
