import {init} from './utils';
import '../components/inventory/inventory_item_holder_metadata';
import '../components/inventory/selected_item_info';
import {Observe} from '../utils/observers';
import {gFloatFetcher} from '../services/float_fetcher';
import {rgAssetProperty} from '../types/steam';
import {isCAppwideInventory} from '../utils/checkers';
import {ContextId} from '../types/steam_constants';

init('src/lib/page_scripts/inventory.js', main);

async function main() {
    let initialRun = false;

    /**
     * We want to limit the number of rank checks we make to the FloatDB gateway. If we wait until each item is
     * rendered in an inventory (requires them to click on each page), then it causes a separate server-side fetch
     * for each page.
     *
     * Instead, we eagerly fetch the ranks for all items that have been loaded.
     */
    Observe(() => {
        const allProps = getAllCS2AssetProperties();
        const propsLength  = Object.keys(allProps).length;
        if (propsLength > 0 && !initialRun) {
            // Ensure that we run the function at least once if we happened to load
            // and all the properties were already there.
            initialRun = true;
            return true;
        }
        return Object.keys(allProps).length;
    }, () => {
        if (typeof g_ActiveInventory === 'undefined') return;

        const assetProperties = getAllCS2AssetProperties();

        for (const [asset_id, props] of Object.entries(assetProperties)) {
            if (!props.find(e => e.propertyid === 2)) {
                // doesn't have a float, skip
                continue;
            }

            const serializedLink = props.find(e => e.propertyid === 6);
            if (!serializedLink?.string_value) {
                continue;
            }

            gFloatFetcher.fetch({
                asset_id: asset_id,
                link: `steam://run/730//+csgo_econ_action_preview%20${serializedLink.string_value}`
            });
        }
    })
}

function getAllCS2AssetProperties(): {[assetId: string]: rgAssetProperty[]} {
    if (typeof g_ActiveInventory === 'undefined') return {};

    const allProperties = g_ActiveInventory.m_rgAssetProperties || {};

    if (isCAppwideInventory(g_ActiveInventory)) {
        const primaryProps = g_ActiveInventory.m_rgChildInventories[ContextId.PRIMARY]?.m_rgAssetProperties;
        if (Object.keys(primaryProps).length > 0) {
            Object.assign(allProperties, primaryProps);
        }

        const protectedProps = g_ActiveInventory.m_rgChildInventories[ContextId.PROTECTED]?.m_rgAssetProperties;
        if (Object.keys(protectedProps).length > 0) {
            Object.assign(allProperties, protectedProps);
        }
    }

    return allProperties;
}
