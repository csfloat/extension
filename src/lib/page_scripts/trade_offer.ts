import {init} from './utils';
import '../components/trade_offer/trade_item_holder_metadata';
import '../components/trade_offer/auto_fill';

init('src/lib/page_scripts/trade_offer.js', main);

async function main() {
    injectInventoryFallback();
}

function injectInventoryFallback() {
    /**
     * Valve had the great idea to rate limit user's requests to their own
     * inventory. As a result, some people can't send a trade offer since
     * they can't load their inventory.
     *
     * This mitigation uses the API Key fallback method instead, which only
     * works if they have an Steam Web API key on their account.
     */
    CUserYou.prototype.g_OnLoadInventoryComplete = CUserYou.prototype.OnLoadInventoryComplete;

    CUserYou.prototype.OnLoadInventoryComplete = function OnLoadInventoryComplete(transport, appId, contextId) {
        if (transport.responseJSON?.success) {
            // Original call was successful, nothing more to do
            this.g_OnLoadInventoryComplete(transport, appId, contextId);
            return;
        }

        // Call failed... try to fallback to the API Key method.
        // TODO: Fallback
    };
}
