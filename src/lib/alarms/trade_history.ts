import {Trade} from '../types/float_market';
import {TradeHistoryStatus} from '../bridge/handlers/trade_history_status';
import cheerio from 'cheerio';
import {AppId} from '../types/steam_constants';
import {HasPermissions} from '../bridge/handlers/has_permissions';

export async function pingTradeHistory(pendingTrades: Trade[]) {
    const history = await getTradeHistory();

    // premature optimization in case it's 100 trades
    const assetsToFind = pendingTrades.reduce((acc, e) => {
        acc[e.contract.item.asset_id] = true;
        return acc;
    }, {} as {[key: string]: boolean});

    // We only want to send history that is relevant to verifying trades on CSFloat
    const historyForCSFloat = history.filter((e) => {
        const received_ids = e.received_assets.map((e) => e.asset_id);
        const given_ids = e.given_assets.map((e) => e.asset_id);
        return !![...received_ids, ...given_ids].find((e) => {
            return assetsToFind[e];
        });
    });

    if (historyForCSFloat.length === 0) {
        return;
    }

    await TradeHistoryStatus.handleRequest({history: historyForCSFloat}, {});
}

async function getTradeHistory(): Promise<TradeHistoryStatus[]> {
    const resp = await fetch(`https://steamcommunity.com/id/me/tradehistory`, {
        credentials: 'include',
        // Expect redirect since we're using `me` above
        redirect: 'follow',
    });

    const body = await resp.text();

    const hasPermissions = await HasPermissions.handleRequest(
        {
            permissions: [],
            origins: ['*://*.steampowered.com/*'],
        },
        {}
    );

    if (hasPermissions.granted) {
        const webAPIToken = /data-loyalty_webapi_token=\"&quot;([a-zA-Z0-9\_\.-]+)&quot;\"/.exec(body);
        if (webAPIToken && webAPIToken.length > 1) {
            try {
                const history = await getTradeHistoryFromAPI(webAPIToken[1]);
                if (history.length > 0) {
                    // Hedge in case this endpoint gets killed, only return if there are results, fallback to HTML parser
                    return history;
                }
            } catch (e) {
                console.error(e);
            }
        }

        // Fallback to HTML parsing
    }

    if (body.includes('too many requests')) {
        throw 'Too many requests';
    }

    return parseTradeHistoryHTML(body);
}

interface HistoryAsset {
    assetid: string;
    appid: AppId;
    new_assetid: string;
}

interface TradeHistoryAPIResponse {
    response: {
        trades: {
            tradeid: string;
            steamid_other: string;
            status: number;
            assets_given?: HistoryAsset[];
            assets_received?: HistoryAsset[];
        }[];
    };
}

async function getTradeHistoryFromAPI(accessToken: string): Promise<TradeHistoryStatus[]> {
    // This only works if they have granted permission for https://api.steampowered.com
    const resp = await fetch(
        `https://api.steampowered.com/IEconService/GetTradeHistory/v1/?access_token=${accessToken}&max_trades=50`,
        {
            credentials: 'include',
        }
    );

    if (resp.status !== 200) {
        throw new Error('invalid status');
    }

    const data = (await resp.json()) as TradeHistoryAPIResponse;
    return data.response.trades
        .map((e) => {
            return {
                other_party_url: `https://steamcommunity.com/profiles/${e.steamid_other}`,
                received_assets: (e.assets_received || [])
                    .filter((e) => e.appid === AppId.CSGO)
                    .map((e) => {
                        return {asset_id: e.assetid, new_asset_id: e.new_assetid};
                    }),
                given_assets: (e.assets_given || [])
                    .filter((e) => e.appid === AppId.CSGO)
                    .map((e) => {
                        return {asset_id: e.assetid, new_asset_id: e.new_assetid};
                    }),
            } as TradeHistoryStatus;
        })
        .filter((e) => {
            // Remove non-CS related assets
            return e.received_assets.length > 0 || e.given_assets.length > 0;
        });
}

function parseTradeHistoryHTML(body: string): TradeHistoryStatus[] {
    const doc = cheerio.load(body);

    const statuses = doc('.tradehistoryrow .tradehistory_event_description a')
        .toArray()
        .map((row) => {
            return {
                other_party_url: doc(row).attr('href'),
                received_assets: [],
                given_assets: [],
            } as TradeHistoryStatus;
        });

    const matches = body.matchAll(
        /HistoryPageCreateItemHover\( \'trade(\d+)_(received|given)item\d+\', 730, \'2\', \'(\d+)\', \'1\' \);/g
    );
    for (const match of matches) {
        const [text, index, type, assetId] = match;
        const tradeIndex = parseInt(index);
        if (type === 'received') {
            statuses[tradeIndex].received_assets.push({asset_id: assetId});
        } else if (type === 'given') {
            statuses[tradeIndex].given_assets.push({asset_id: assetId});
        }
    }

    return statuses;
}
