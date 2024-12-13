import {init} from './utils';
import '../components/trade_offers/better_tracking';
import '../components/trade_offers/trade_offer_holder_metadata';
import {inPageContext} from '../utils/snips';
import {ClientSend} from '../bridge/client';
import {PingSetupExtension} from '../bridge/handlers/ping_setup_extension';
import {PingExtensionStatus} from '../bridge/handlers/ping_extension_status';
import {FetchSteamTrades, FetchSteamTradesResponse} from '../bridge/handlers/fetch_steam_trades';

init('src/lib/page_scripts/trade_offers.js', main);

function main() {}

/**
 * Gets the trade offers from the local storage or fetches them from the API.
 * Local storage serves as a cache here.
 * @param isSentPage if the current page is the sent trade offers page
 * @returns the trade offers
 */
async function fetchTradeOffers(isSentPage: boolean) {
    const g_steamTrades = JSON.parse(localStorage.getItem('g_steamTrades') || '{}') as FetchSteamTradesResponse;
    let refetchRequired = true;
    if (g_steamTrades.sent || g_steamTrades.received) {
        const latestTradeId = Number.parseInt(g_steamTrades[isSentPage ? 'sent' : 'received']?.[0].offer_id);
        const latestTradeElement = Number.parseInt(document.querySelector('.tradeoffer')?.id.split('_')[1] ?? '0');

        refetchRequired = Number.isNaN(latestTradeId) || latestTradeId !== latestTradeElement;
    }

    if (!refetchRequired) {
        return g_steamTrades;
    }

    const steamTrades = await ClientSend(FetchSteamTrades, {});

    localStorage.setItem('g_steamTrades', JSON.stringify(steamTrades));
    return steamTrades;
}

/**
 * Fetches the api data for trade offers and stores relevant data in the DOM to be used by Lit components.
 */
async function getAndStoreTradeOffers() {
    const isSentPage = location.pathname.includes('sent');

    const steamTrades = await fetchTradeOffers(isSentPage);

    const tradeOffers = document.querySelectorAll('.tradeoffer');

    for (const tradeOffer of tradeOffers) {
        const tradeId = tradeOffer.id.split('_')[1];
        const tradeItems = tradeOffer.querySelectorAll('.trade_item');
        const trade = isSentPage
            ? steamTrades.sent.find((t) => t.offer_id === tradeId)
            : steamTrades.received.find((t) => t.offer_id === tradeId);

        for (const tradeItem of tradeItems) {
            const economyItemParts = tradeItem.getAttribute('data-economy-item')?.split('/');
            const classId = economyItemParts?.[2];
            const instanceId = economyItemParts?.[3];

            if (!instanceId) {
                continue;
            }

            const description = steamTrades.descriptions.find(
                (d) => d.classid === classId && d.instanceid === instanceId
            );
            if (description) {
                tradeItem.setAttribute('data-description', JSON.stringify(description));
            }

            let isOwnItem = true;
            let apiItem = trade?.given_asset_ids?.find((a) => a.classid === classId && a.instanceid === instanceId);
            if (!apiItem) {
                isOwnItem = false;
                apiItem = trade?.received_asset_ids?.find((a) => a.classid === classId && a.instanceid === instanceId);
            }
            const ownerId = isOwnItem
                ? JSON.parse(document.getElementById('application_config')?.dataset?.userinfo || '{}').steamid
                : trade?.other_steam_id64;

            tradeItem.setAttribute('data-owner-steamid', ownerId);
            if (apiItem?.assetid) {
                tradeItem.setAttribute('data-assetid', apiItem.assetid);
            }
        }
    }
}

if (!inPageContext()) {
    getAndStoreTradeOffers();

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
