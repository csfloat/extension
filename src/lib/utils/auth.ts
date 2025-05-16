import {ClientSend} from '../bridge/client';
import {FetchPendingTrades} from '../bridge/handlers/fetch_pending_trades';

/**
 * Checks if the user is currently logged into CSFloat by making a test API call
 * @returns Promise<boolean> - True if logged in, false otherwise
 */
export async function isLoggedIntoCSFloat(): Promise<boolean> {
    try {
        await ClientSend(FetchPendingTrades, {limit: 1});
        return true;
    } catch (e) {
        return false;
    }
}
