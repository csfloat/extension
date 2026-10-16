import {TradeHistoryStatus} from '../bridge/handlers/trade_history_status';
import {NotaryProve} from '../bridge/handlers/notary_prove';
import {FetchNotaryToken} from '../bridge/handlers/fetch_notary_token';
import {FetchNotaryMeta, NotaryMeta} from '../bridge/handlers/fetch_notary_meta';
import {ProofType, NotaryProveRequest} from '../notary/types';
import {MAX_TRADE_HISTORY_FETCH} from './constants';
import {isFirefox} from '../utils/detect';
import {environment} from '../../environment';

const NOTARY_META_CACHE_MS = 30 * 60 * 1000;

// In-memory, so a service worker restart refetches
let cachedNotaryMeta: {meta: NotaryMeta; fetchedAt: number} | null = null;

export function isBackgroundNotaryRollbackEnabled(): Promise<boolean> {
    return isBackgroundNotaryEnabled('rollback');
}

export function isBackgroundNotaryAcceptedEnabled(): Promise<boolean> {
    return isBackgroundNotaryEnabled('accepted');
}

export function isBackgroundNotaryOfferStateEnabled(): Promise<boolean> {
    return isBackgroundNotaryEnabled('offer_state');
}

async function isBackgroundNotaryEnabled(setting: keyof NotaryMeta): Promise<boolean> {
    // Some older Chrome versions don't define the offscreen WORKERS reason, so the offscreen document can't be created
    if (isFirefox() || !chrome.offscreen?.Reason?.WORKERS) {
        return false;
    }

    if (!cachedNotaryMeta || cachedNotaryMeta.fetchedAt <= Date.now() - NOTARY_META_CACHE_MS) {
        // Failed fetches are not cached so a transient error doesn't disable notary proving for the whole window
        try {
            cachedNotaryMeta = {meta: await FetchNotaryMeta.handleRequest({}, {}), fetchedAt: Date.now()};
        } catch (e) {
            console.error('failed to fetch notary meta', e);
            return false;
        }
    }

    return cachedNotaryMeta.meta[setting]?.background === true;
}

export function buildProveRequest(trades: TradeHistoryStatus[]): NotaryProveRequest {
    if (trades.length === 1) {
        return {
            type: ProofType.TRADE_HISTORY,
            max_trades: 5,
            start_after_time: trades[0].time_init,
            navigating_back: true,
            include_failed: true,
        };
    }

    // Multiple trades: start from the oldest and fetch enough to guarantee coverage
    const oldestTimeInit = Math.min(...trades.map((t) => t.time_init));

    return {
        type: ProofType.TRADE_HISTORY,
        max_trades: MAX_TRADE_HISTORY_FETCH,
        start_after_time: oldestTimeInit,
        navigating_back: true,
        include_failed: true,
    };
}

export function proveTradesInBackground(trades: TradeHistoryStatus[]): Promise<void> {
    if (trades.length === 0) {
        return Promise.resolve();
    }

    return submitNotaryProof(buildProveRequest(trades));
}

/**
 * Generates a notary proof for the given Steam request and submits it to CSFloat's trade notary endpoint.
 */
export async function submitNotaryProof(proveRequest: NotaryProveRequest): Promise<void> {
    const notaryToken = await FetchNotaryToken.handleRequest({}, {});
    proveRequest.meta = {...proveRequest.meta, notary_token: notaryToken.token};

    const result = await NotaryProve.handleRequest(proveRequest, {});

    const resp = await fetch(`${environment.csfloat_base_api_url}/v1/trades/notary`, {
        credentials: 'include',
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({payload: result.payload}),
    });

    if (resp.status !== 200) {
        throw new Error(`failed to submit notary proof: ${resp.status}`);
    }
}
