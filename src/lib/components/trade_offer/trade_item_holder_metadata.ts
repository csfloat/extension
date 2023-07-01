import {CustomElement, InjectAppend, InjectionMode} from '../injectors';
import {rgAsset, UserSomeone} from '../../types/steam';
import {ItemHolderMetadata} from '../common/item_holder_metadata';
import {AppId, ContextId} from '../../types/steam_constants';

// Annotates item info (float, seed, etc...) in boxes on the Trade Offer Page
@CustomElement()
// Items when browsing their/your inventory
@InjectAppend('div.inventory_page:not([style*="display: none"]) .itemHolder div.app730', InjectionMode.CONTINUOUS)
// Items selected within the trade offer
@InjectAppend('.trade_offer .itemHolder div.app730', InjectionMode.CONTINUOUS)
export class TradeItemHolderMetadata extends ItemHolderMetadata {
    get owningUser(): UserSomeone | undefined {
        if (!this.assetId) return;

        if (UserThem && TradeItemHolderMetadata.getAssetFromUser(UserThem, this.assetId)) {
            return UserThem;
        } else if (UserYou && TradeItemHolderMetadata.getAssetFromUser(UserYou, this.assetId)) {
            return UserYou;
        }
    }

    get ownerSteamId(): string | undefined {
        if (!this.assetId) return;

        return this.owningUser?.strSteamId;
    }

    get asset(): rgAsset | undefined {
        if (!this.assetId) return;

        if (!this.owningUser) return;

        return TradeItemHolderMetadata.getAssetFromUser(this.owningUser, this.assetId);
    }

    private static getAssetFromUser(user: UserSomeone, assetId: string): rgAsset | undefined {
        if (user.rgContexts[AppId.CSGO][ContextId.PRIMARY].inventory?.rgInventory[assetId]) {
            const inventory = user.rgContexts[AppId.CSGO][ContextId.PRIMARY].inventory;
            return inventory?.rgInventory[assetId];
        }
    }
}
