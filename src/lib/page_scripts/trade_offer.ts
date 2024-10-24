import {init} from './utils';
import '../components/trade_offer/trade_item_holder_metadata';
import '../components/trade_offer/auto_fill';
import {ClassIdAndInstanceId, rgDescription, rgInventoryAsset, TradeInventory} from '../types/steam';
import {fetchRegisteredSteamAPIKey} from '../utils/key';
import {deserializeForm} from '../utils/browser';
import {AppId} from '../types/steam_constants';
import {ClientSend} from '../bridge/client';
import {AnnotateOffer} from '../bridge/handlers/annotate_offer';

init('src/lib/page_scripts/trade_offer.js', main);

async function main() {
    injectAnnotateOffer();
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
        if (strUrl.startsWith(g_strInventoryLoadURL!) && transport.status >= 400) {
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

interface JsonTradeofferAsset {
    appid: number;
    contextid: string;
    amount: number;
    assetid: string;
}

interface JsonTradeoffer {
    me: {
        assets: JsonTradeofferAsset[];
    };
    them: {
        assets: JsonTradeofferAsset[];
    };
    version: number;
}

function injectAnnotateOffer() {
    // Annotate offers for use in CSFloat Market, if the user isn't logged into CSFloat this does nothing
    // Similarly if they don't have an active sale, it does nothing
    $J(document).on('ajaxComplete', async (event, request, settings) => {
        if (!settings.url.includes('tradeoffer/new/send')) {
            // Ignore requests that aren't a new trade offer
            return;
        }

        const offer_id = request?.responseJSON?.tradeofferid;

        if (!offer_id) {
            // Something wrong with the format
            return;
        }

        let given_asset_ids: string[] = [];
        let received_asset_ids: string[] = [];
        const deserialized = deserializeForm(settings.data) as {json_tradeoffer?: string};

        if (deserialized && deserialized.json_tradeoffer) {
            try {
                const parsed = JSON.parse(deserialized.json_tradeoffer) as JsonTradeoffer;
                given_asset_ids = parsed.me.assets.filter((e) => e.appid === AppId.CSGO).map((e) => e.assetid);
                received_asset_ids = parsed.them.assets.filter((e) => e.appid === AppId.CSGO).map((e) => e.assetid);
            } catch (e) {
                console.error('failed to parse json tradeoffer', e, deserialized.json_tradeoffer);
                // Still proceed with annotating the offer id on a best-effort
            }
        }

        await ClientSend(AnnotateOffer, {
            given_asset_ids,
            received_asset_ids,
            offer_id: offer_id,
            other_steam_id64: UserThem?.strSteamId,
        });
    });
}
