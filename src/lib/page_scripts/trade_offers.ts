import {init} from './utils';
import '../components/trade_offers/better_tracking';
import '../components/trade_offers/trade_offer_holder_metadata';
import {inPageContext} from '../utils/snips';
import {ClientSend} from '../bridge/client';
import {PingSetupExtension} from '../bridge/handlers/ping_setup_extension';
import {PingExtensionStatus} from '../bridge/handlers/ping_extension_status';
import {FetchSteamTrades} from '../bridge/handlers/fetch_steam_trades';
import {convertToSteamID64, getUserSteamID} from '../utils/userinfo';

init('src/lib/page_scripts/trade_offers.js', main);

function main() {}

/**
 * Gets the trade offers from the local storage or fetches them from the API.
 * Local storage serves as a cache here.
 * @param steam_id the steam id of logged in user
 * @returns the trade offers
 */
async function fetchTradeOffers(steam_id: string) {
    const latestTradeIDFromPage = document.querySelector('.tradeoffer')?.id.split('_')[1];
    const trade_offer_id = latestTradeIDFromPage ? Number.parseInt(latestTradeIDFromPage) : undefined;

    if (!trade_offer_id) {
        return;
    }

    console.log('Fetching trade offers', steam_id, trade_offer_id);
    return await ClientSend(FetchSteamTrades, {steam_id, trade_offer_id});
}

/**
 * Fetches the api data for trade offers and stores relevant data in the DOM to be used by Lit components.
 */
async function annotateTradeOfferItemElements() {
    const steam_id = getUserSteamID();

    if (!steam_id) {
        console.error('Failed to get steam_id', steam_id);
        return;
    }

    const steamTrades = await fetchTradeOffers(steam_id);

    if (!steamTrades) {
        return;
    }

    const tradeOffers = document.querySelectorAll('.tradeoffer');

    for (const tradeOffer of tradeOffers) {
        const tradeOfferID = tradeOffer.id.split('_')[1];
        const tradeItemElements = tradeOffer.querySelectorAll('.trade_item');
        const tradeOfferAPI =
            steamTrades.sent.find((t) => t.tradeofferid === tradeOfferID) ??
            steamTrades.received.find((t) => t.tradeofferid === tradeOfferID);
        if (!tradeOfferAPI) {
            continue;
        }

        for (const tradeItemElement of tradeItemElements) {
            // Format: classinfo/{appid}/{classid}/{instanceid}
            // Example: data-economy-item="classinfo/730/310777185/302028390"
            const economyItemParts = tradeItemElement.getAttribute('data-economy-item')?.split('/');
            const classId = economyItemParts?.[2];
            const instanceId = economyItemParts?.[3];

            if (!classId || !instanceId) {
                continue;
            }

            const description = steamTrades.descriptions.find(
                (d) => d.classid === classId && d.instanceid === instanceId
            );
            if (description) {
                tradeItemElement.setAttribute('data-csfloat-description', JSON.stringify(description));
            }

            let isOwnItem = true;
            let apiItem = tradeOfferAPI?.items_to_give?.find(
                (a) => a.classid === classId && a.instanceid === instanceId
            );
            if (!apiItem) {
                isOwnItem = false;
                apiItem = tradeOfferAPI?.items_to_receive?.find(
                    (a) => a.classid === classId && a.instanceid === instanceId
                );
            }

            const ownerId = isOwnItem ? steam_id : convertToSteamID64(tradeOfferAPI.accountid_other);

            if (ownerId) {
                tradeItemElement.setAttribute('data-csfloat-owner-steamid', ownerId);
            }
            if (apiItem?.assetid) {
                tradeItemElement.setAttribute('data-csfloat-assetid', apiItem.assetid);
            }
        }
    }
}

if (!inPageContext()) {
    annotateTradeOfferItemElements();

    const refresh = setInterval(() => {
        const widget = document.getElementsByTagName('csfloat-better-tracking-widget');
        if (!widget || widget.length === 0) {
            return;
        }

        const btn = widget[0]?.shadowRoot?.getElementById('csfloat-enable-enhanced');
        if (!btn) {
            return;
        }

        btn.addEventListener('click', async () => {
            chrome.runtime.sendMessage(
                {
                    message: 'requestPermissions',
                    permissions: ['alarms'],
                    origins: ['*://*.steampowered.com/*'],
                },
                (granted) => {
                    if (granted) {
                        widget[0].parentElement?.removeChild(widget[0]);
                        ClientSend(PingSetupExtension, {});
                        ClientSend(PingExtensionStatus, {});
                    } else {
                        alert('Failed to obtain permissions');
                    }
                }
            );
        });

        clearInterval(refresh);
    }, 500);
}
