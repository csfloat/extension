import cheerio from 'cheerio';
import {TradeOfferState} from '../types/steam_constants';
import {Trade} from '../types/float_market';
import {TradeOfferStatus} from '../bridge/handlers/trade_offer_status';

interface OfferStatus {
    offer_id: string;
    state: TradeOfferState;
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

export async function pingSentTradeOffers(pendingTrades: Trade[]) {
    const offers = await getSentTradeOffers();

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

    await TradeOfferStatus.handleRequest({sent_offers: offersForCSFloat}, {});
}

async function getEnglishSentTradeOffersHTML(): Promise<cheerio.Root> {
    const resp = await fetch(`https://steamcommunity.com/id/me/tradeoffers/sent`, {
        credentials: 'include',
        // Expect redirect since we're using `me` above
        redirect: 'follow',
    });

    const body = await resp.text();

    const doc = cheerio.load(body);
    if (doc('html').attr('lang') === 'en') {
        // Already english, return
        return doc;
    }

    // Explicitly fetch in english instead (we need to use the redirect URL)
    const englishResp = await fetch(`${resp.url}?l=english`, {
        credentials: 'include',
        // Expect redirect since we're using `me` above
        redirect: 'follow',
    });

    return cheerio.load(await englishResp.text());
}

async function getSentTradeOffers(): Promise<OfferStatus[]> {
    const doc = await getEnglishSentTradeOffersHTML();

    const offerStatuses = doc('.tradeoffer')
        .toArray()
        .map((e) => {
            const elem = doc(e);
            const offerID = doc(e).attr('id')?.replace('tradeofferid_', '');
            if (!offerID || !/^\d+$/.test(offerID)) {
                // Invalid element
                return {offer_id: '', state: TradeOfferState.Invalid};
            }

            const isActive = !elem.find('.tradeoffer_items_ctn')?.hasClass('inactive');
            if (isActive) {
                return {
                    offer_id: offerID,
                    state: TradeOfferState.Active,
                };
            }

            // Try to deduce the state from banner text...
            const bannerText = elem.find('.tradeoffer_items_banner')?.text().toLowerCase();
            if (!bannerText) {
                return {
                    offer_id: offerID,
                    state: TradeOfferState.Invalid,
                };
            }

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

    return offerStatuses;
}
