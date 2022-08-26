import {ExecuteScriptOnPage} from "../bridge/handlers/execute_script";
import {ClientSend} from "../bridge/client";
import {inPageContext} from "../utils/snips";
import {ExecuteCssOnPage} from "../bridge/handlers/execute_css";

/**
 * Initializes a page script, executing it in the page context if necessary
 *
 * @param scriptPath Relative path of the script (always in .js)
 * @param ifPage Fn to run if we are in the page's execution context
 */
export function init(scriptPath: string, ifPage: ()=>any) {
    // Don't allow the page script to run this.
    if (inPageContext()) {
        ifPage();
        return;
    }

    // Global styles
    ClientSend(ExecuteCssOnPage, {
        path: 'src/float.css'
    });

    ClientSend(ExecuteScriptOnPage, {
        path: scriptPath
    });
}
