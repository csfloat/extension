import {TradeHistoryStatus} from '../bridge/handlers/trade_history_status';
import {NotaryProve} from '../bridge/handlers/notary_prove';
import {FetchNotaryToken} from '../bridge/handlers/fetch_notary_token';
import {FetchNotaryMeta} from '../bridge/handlers/fetch_notary_meta';
import {ProofType, NotaryProveRequest} from '../notary/types';
import {MAX_TRADE_HISTORY_FETCH} from './constants';
import {environment} from '../../environment';

export async function isBackgroundNotaryRollbackEnabled(): Promise<boolean> {
    try {
        const meta = await FetchNotaryMeta.handleRequest({}, {});
        return meta.rollback?.background === true;
    } catch (e) {
        console.error('failed to fetch notary meta', e);
        return false;
    }
}

function buildProveRequest(trades: TradeHistoryStatus[]): NotaryProveRequest {
    if (trades.length === 1) {
        return {
            type: ProofType.TRADE_HISTORY,
            max_trades: 5,
            start_after_time: trades[0].time_init,
            navigating_back: true,
        };
    }

    // Multiple trades: start from the oldest and fetch enough to guarantee coverage
    const oldestTimeInit = Math.min(...trades.map((t) => t.time_init));

    return {
        type: ProofType.TRADE_HISTORY,
        max_trades: MAX_TRADE_HISTORY_FETCH,
        start_after_time: oldestTimeInit,
        navigating_back: true,
    };
}

export async function proveTradesInBackground(trades: TradeHistoryStatus[]): Promise<void> {
    if (trades.length === 0) {
        return;
    }

    const notaryToken = await FetchNotaryToken.handleRequest({}, {});
    const proveRequest = buildProveRequest(trades);
    proveRequest.meta = {notary_token: notaryToken.token};

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
