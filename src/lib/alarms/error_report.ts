import {environment} from '../../environment';

export async function reportTradeError(tradeId: string, error: string): Promise<void> {
    try {
        await fetch(`${environment.csfloat_base_api_url}/v1/trades/${tradeId}/report-error`, {
            credentials: 'include',
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({error}),
        });
    } catch (e) {
        console.error(`failed to report trade error for ${tradeId}`, e);
    }
}
