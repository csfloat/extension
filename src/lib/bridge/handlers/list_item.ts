import {SimpleHandler} from './main';
import {RequestType} from './types';
import {environment} from '../../../environment';
import {CSFError, CSFErrorCode} from '../../utils/errors';

type ListingType = 'buy_now' | 'auction';

interface BaseListItemRequest {
    asset_id: string;
    type: ListingType;
    description?: string;
    private?: boolean;
}

interface BuyNowListItemRequest extends BaseListItemRequest {
    type: 'buy_now';
    price: number;
    max_offer_discount?: number;
}

interface AuctionListItemRequest extends BaseListItemRequest {
    type: 'auction';
    reserve_price: number;
    duration_days: 1 | 3 | 5 | 7 | 14;
}

type ListItemRequest = BuyNowListItemRequest | AuctionListItemRequest;

interface ListItemResponse {
    success: boolean;
    error?: string;
    id?: string;
}

export const ListItem = new SimpleHandler<ListItemRequest, ListItemResponse>(RequestType.LIST_ITEM, async (req) => {
    const response = await fetch(`${environment.csfloat_base_api_url}/v1/listings`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(req),
        credentials: 'include',
    });

    if (!response.ok) {
        // Error comes with this body format: { message: string, code: number }
        const error = await response.json();
        if (response.status === 401) {
            // This is here for normalized auth errors across all handlers
            throw new CSFError(CSFErrorCode.NOT_AUTHENTICATED);
        }

        throw new Error(`Failed to List Item: ${error.message} - ${error.code}`);
    }

    const data = await response.json();
    return {
        success: true,
        id: data.id,
    };
});
