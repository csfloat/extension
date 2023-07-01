import {init} from './utils';
import '../components/trade_offer/trade_item_holder_metadata';
import '../components/trade_offer/auto_fill';
import {ClassIdAndInstanceId, rgDescription, rgInventoryAsset, TradeInventory} from '../types/steam';
import {fetchRegisteredSteamAPIKey} from '../utils/key';

init('src/lib/page_scripts/trade_offer.js', main);

async function main() {
    injectInventoryFallback();
}

interface KeyInventoryResponse {
    response: {
        assets?: rgInventoryAsset[];
        descriptions: rgDescription[];
        total_inventory_count: number;
    };
}

/**
 * Converts the API Key inventory response to match the "Trade" inventory
 * response for Steam's client code.
 */
function convertKeyInventoryIntoTradeInventory(raw: KeyInventoryResponse): TradeInventory {
    // Populate missing fields
    raw.response.assets?.forEach((asset, index) => {
        asset.id = asset.assetid!;
        asset.pos = index + 1;
        asset.hide_in_china = 0;
    });

    const rgInventory = raw.response.assets!.reduce((acc, v) => {
        acc[v.id] = v;
        return acc;
    }, {} as {[k: string]: rgInventoryAsset});

    const rgDescriptions = raw.response.descriptions?.reduce((acc, v) => {
        (v.tags || []).forEach((tag) => {
            // # Valve consistency, this field was renamed
            tag.name = tag.localized_tag_name;
        });

        acc[`${v.classid}_${v.instanceid}` as ClassIdAndInstanceId] = v;

        return acc;
    }, {} as {[k: ClassIdAndInstanceId]: rgDescription});

    return {
        more: false,
        more_start: false,
        rgCurrency: [],
        rgDescriptions,
        rgInventory,
        success: true,
    };
}

async function fetchInventoryWithAPIKey(): Promise<TradeInventory> {
    const key = await fetchRegisteredSteamAPIKey();

    const resp = await fetch(
        `https://api.steampowered.com/IEconService/GetInventoryItemsWithDescriptions/v1/?appid=730&contextid=2&count=5000&get_descriptions=true&key=${key}&steamid=${UserYou?.strSteamId}`
    );
    if (!resp.ok) {
        throw new Error('key inventory fetch response was not OK');
    }

    const data = (await resp.json()) as KeyInventoryResponse;

    // Sometimes Steam likes to return an empty response...
    if (!data.response.assets?.length) {
        throw new Error('key inventory response had no assets');
    }

    return convertKeyInventoryIntoTradeInventory(data);
}

function injectInventoryFallback() {
    /**
     * Valve can rate limit user's requests to their own inventory. As a result,
     * some people can't send a trade offer since they can't load their inventory.
     *
     * This mitigation uses the API Key fallback method instead, which only
     * works if they have a Steam Web API key on their account.
     */
    const g_ContinueFullInventoryRequestIfNecessary = ContinueFullInventoryRequestIfNecessary;

    ContinueFullInventoryRequestIfNecessary = async function (
        transport: JQuery.jqXHR,
        mergedResponse: any,
        strUrl: string,
        oParams: any,
        fOnSuccess: () => any,
        fOnFailure: () => any,
        fOnComplete: () => any
    ) {
        if (strUrl.startsWith(g_strInventoryLoadURL!) && transport.status === 429) {
            // User was rate limited... try the fallback.
            try {
                const newInventory = await fetchInventoryWithAPIKey();
                transport.responseJSON = newInventory;
            } catch (e) {
                console.debug('failed to fetch fallback inventory via key', e);
            }
        }

        // Call upstream
        return g_ContinueFullInventoryRequestIfNecessary(
            transport,
            mergedResponse,
            strUrl,
            oParams,
            fOnSuccess,
            fOnFailure,
            fOnComplete
        );
    };
}
