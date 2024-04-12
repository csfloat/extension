import {TradeOfferState} from '../types/steam_constants';
import {Trade} from '../types/float_market';
import {TradeOfferStatus, TradeOffersType} from '../bridge/handlers/trade_offer_status';
import {HasPermissions} from '../bridge/handlers/has_permissions';

interface OfferStatus {
    offer_id: string;
    state: TradeOfferState;
}

export async function pingSentTradeOffers(pendingTrades: Trade[]) {
    const {offers, type} = await getSentTradeOffers();

    const offersToFind = pendingTrades.reduce((acc, e) => {
        acc[e.steam_offer.id] = true;
        return acc;
    }, {} as {[key: string]: boolean});

    // We only want to send offers that are relevant to verifying trades on CSFloat
    const offersForCSFloat = offers.filter((e) => {
        return !!offersToFind[e.offer_id];
    });

    if (offersForCSFloat.length === 0) {
        return;
    }

    await TradeOfferStatus.handleRequest({sent_offers: offersForCSFloat, type}, {});
}

async function getEnglishSentTradeOffersHTML(): Promise<string> {
    const resp = await fetch(`https://steamcommunity.com/id/me/tradeoffers/sent`, {
        credentials: 'include',
        // Expect redirect since we're using `me` above
        redirect: 'follow',
    });

    const body = await resp.text();

    if (body.match(/<html .+? lang="en">/)) {
        // Already english, return
        return body;
    }

    // Explicitly fetch in english instead (we need to use the redirect URL)
    const englishResp = await fetch(`${resp.url}?l=english`, {
        credentials: 'include',
        // Expect redirect since we're using `me` above
        redirect: 'follow',
    });

    return englishResp.text();
}

async function getSentTradeOffers(): Promise<{offers: OfferStatus[]; type: TradeOffersType}> {
    const body = await getEnglishSentTradeOffersHTML();

    const hasPermissions = await HasPermissions.handleRequest(
        {
            permissions: [],
            origins: ['*://*.steampowered.com/*'],
        },
        {}
    );

    // We generally prefer to use the API when available, but who knows when things get shut down
    if (hasPermissions.granted) {
        const webAPIToken = /data-loyalty_webapi_token="&quot;([a-zA-Z0-9_.-]+)&quot;"/.exec(body);
        if (webAPIToken && webAPIToken.length > 1) {
            try {
                const offers = await getTradeOffersFromAPI(webAPIToken[1]);
                if (offers.length > 0) {
                    // Hedge in case this endpoint gets killed, only return if there are results, fallback to HTML parser
                    return {offers, type: TradeOffersType.API};
                }
            } catch (e) {
                console.error(e);
            }
        }

        // Fallback to HTML parsing
    }

    return {offers: parseTradeOffersHTML(body), type: TradeOffersType.HTML};
}

interface TradeOffersAPIResponse {
    response: {
        trade_offers_sent: {
            tradeofferid: string;
            accountid_other: string;
            trade_offer_state: TradeOfferState;
        }[];
    };
}

async function getTradeOffersFromAPI(accessToken: string): Promise<OfferStatus[]> {
    const resp = await fetch(
        `https://api.steampowered.com/IEconService/GetTradeOffers/v1/?access_token=${accessToken}&get_sent_offers=true`,
        {
            credentials: 'include',
        }
    );

    if (resp.status !== 200) {
        throw new Error('invalid status');
    }

    const data = (await resp.json()) as TradeOffersAPIResponse;
    return data.response.trade_offers_sent.map((e) => {
        return {
            offer_id: e.tradeofferid,
            state: e.trade_offer_state,
        } as OfferStatus;
    });
}

const BANNER_TO_STATE: {[banner: string]: TradeOfferState} = {
    accepted: TradeOfferState.Accepted,
    counter: TradeOfferState.Countered,
    expired: TradeOfferState.Expired,
    cancel: TradeOfferState.Canceled,
    declined: TradeOfferState.Declined,
    invalid: TradeOfferState.InvalidItems,
    'mobile confirmation': TradeOfferState.CreatedNeedsConfirmation,
    escrow: TradeOfferState.InEscrow,
};

function parseTradeOffersHTML(body: string): OfferStatus[] {
    const matches = body.matchAll(
        /<div class="tradeoffer" id="tradeofferid_(\d+?)">.+?tradeoffer_items_ctn(.+?inactive.+?tradeoffer_items_banner\s*">([^<]+))?/gms
    );
    return [...matches]
        .map((e) => {
            const offerID = e[1];

            if (!e[2]) {
                // It is active since it didn't match on inactive groups
                return {
                    offer_id: offerID,
                    state: TradeOfferState.Active,
                };
            }

            const bannerText = e[3].toLowerCase();
            const stateEntry = Object.entries(BANNER_TO_STATE).find((e) => bannerText.includes(e[0]));
            if (!stateEntry) {
                return {
                    offer_id: offerID,
                    state: TradeOfferState.Invalid,
                };
            }

            return {
                offer_id: offerID,
                state: stateEntry[1],
            };
        })
        .filter((e) => !!e.offer_id);
}
