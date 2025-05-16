import {ClientSend} from '../bridge/client';
import {FetchCSFloatMe} from '../bridge/handlers/fetch_csfloat_me';

/**
 * Checks if the user is currently logged into CSFloat by making a test API call
 * @returns Promise<boolean> - True if logged in, false otherwise
 */
export async function isLoggedIntoCSFloat(): Promise<boolean> {
    try {
        await ClientSend(FetchCSFloatMe, {});
        return true;
    } catch (e) {
        return false;
    }
}
