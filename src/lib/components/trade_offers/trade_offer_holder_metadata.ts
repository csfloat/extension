import {CustomElement, InjectAppend, InjectionMode} from '../injectors';
import {ItemHolderMetadata} from '../common/item_holder_metadata';
import {rgAsset} from '../../types/steam';

// Annotates item info (float, seed, etc...) in boxes on the Trade Offers Page
@CustomElement()
// Items in received/sent trade offers
@InjectAppend('.tradeoffer .trade_item', InjectionMode.CONTINUOUS)
export class TradeOfferHolderMetadata extends ItemHolderMetadata {
    get assetId(): string | undefined {
        return $J(this).parent().attr('data-assetid');
    }

    get asset(): rgAsset | undefined {
        return JSON.parse($J(this).parent().attr('data-description') ?? '{}') as rgAsset;
    }

    get ownerSteamId(): string | undefined {
        return $J(this).parent().attr('data-owner-steamid');
    }
}
