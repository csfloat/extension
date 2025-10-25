import {CustomElement, InjectAppend, InjectionMode} from '../injectors';
import {rgAsset} from '../../types/steam';
import {ItemHolderMetadata} from '../common/item_holder_metadata';
import { ContextId } from '../../types/steam_constants';

@CustomElement()
@InjectAppend(
    '#active_inventory_page div.inventory_page:not([style*="display: none"]) .itemHolder div.app730',
    InjectionMode.CONTINUOUS
)
export class InventoryItemHolderMetadata extends ItemHolderMetadata {
    get asset(): rgAsset | undefined {
        if (!this.assetId) return;

        const contextId = this.isTradeProtected ? ContextId.PROTECTED : ContextId.PRIMARY;

        return g_ActiveInventory?.m_rgChildInventories[contextId]?.m_rgAssets[this.assetId]?.description;
    }

    get ownerSteamId(): string | undefined {
        if (g_ActiveInventory?.m_owner) {
            return g_ActiveInventory?.m_owner?.strSteamId;
        } else if (g_ActiveInventory?.owner) {
            return g_ActiveInventory?.owner?.strSteamId;
        }
    }
}
