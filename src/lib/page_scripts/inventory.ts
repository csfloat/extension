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
    Observe(
        () => {
            const count = Object.keys(getAllCS2AssetProperties()).length;
            if (count > 0 && !initialRun) {
                initialRun = true;
                return true;
            }
            return count;
        },
        () => {
            if (typeof g_ActiveInventory === 'undefined') return;

            for (const [asset_id, props] of Object.entries(getAllCS2AssetProperties())) {
                // No float value, skip
                if (!props.some((e) => e.propertyid === 2)) continue;

                const inspectLink = props.find((e) => e.propertyid === 6)?.string_value;
                if (!inspectLink) continue;

                gFloatFetcher.fetch({
                    asset_id,
                    link: `steam://run/730//+csgo_econ_action_preview%20${inspectLink}`,
                });
            }
        }
    );
}

function getAllCS2AssetProperties(): {[assetId: string]: rgAssetProperty[]} {
    if (typeof g_ActiveInventory === 'undefined') return {};

    const allProperties = Object.assign({}, g_ActiveInventory.m_rgAssetProperties || {});

    if (isCAppwideInventory(g_ActiveInventory)) {
        for (const contextId of [ContextId.PRIMARY, ContextId.PROTECTED]) {
            const props = g_ActiveInventory.m_rgChildInventories[contextId]?.m_rgAssetProperties;
            if (props && Object.keys(props).length > 0) {
                Object.assign(allProperties, props);
            }
        }
    }

    return allProperties;
}
