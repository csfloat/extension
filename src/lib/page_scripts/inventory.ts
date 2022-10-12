import {init} from './utils';
import '../components/inventory/inventory_item_holder_metadata';
import '../components/inventory/selected_item_info';
import '../components/inventory/selected_item_info_expiry';

init('src/lib/page_scripts/inventory.js', main);

async function main() {
    injectInventoryFallback();
}

function injectInventoryFallback() {
    /*
        Steam inventories are a mess, adds a fallback onto a deprecated inventory endpoint
        We effectively just override some of the inventory URL functions
     */

    let g_InventoryFallbackCSGOFloat = false;

    CInventory.prototype.g_GetInventoryLoadURL = CInventory.prototype.GetInventoryLoadURL;
    CInventory.prototype.g_AddInventoryData = CInventory.prototype.AddInventoryData;
    CInventory.prototype.g_ShowInventoryLoadError = CInventory.prototype.ShowInventoryLoadError;

    CInventory.prototype.GetInventoryLoadURL = function CInventory_GetInventoryLoadURL_CSGOFloat() {
        if (g_InventoryFallbackCSGOFloat) {
            return `https://steamcommunity.com/profiles/${this.m_steamid}/inventory/json/${this.m_appid}/${this.m_contextid}`;
        } else {
            /* Fallback to the upstream method */
            return this.g_GetInventoryLoadURL();
        }
    };

    interface FallbackAsset {
        id: number;
        contextid: number;
        assetid: number;
        classid: number;
        instanceid: number;
        amount: number;
        pos: number;
    }
    interface FallbackResponse {
        success: boolean;
        rgInventory: {[assetId: string]: FallbackAsset};
        rgDescriptions: any;
    }

    CInventory.prototype.AddInventoryData = function CInventory_AddInventoryData_CSGOFloat(data: FallbackResponse) {
        if (!g_InventoryFallbackCSGOFloat) {
            /* upstream can handle */
            return this.g_AddInventoryData(data);
        }

        /* Preprocess the data to match the other inventory format */
        if (!data || !data.success) {
            alert('failed to fetch inventory');
            return;
        }

        const assets = Object.values(data.rgInventory)
            .map((asset) => {
                return {
                    appid: this.m_appid,
                    contextid: this.m_contextid,
                    assetid: asset.id,
                    classid: asset.classid,
                    instanceid: asset.instanceid,
                    amount: asset.amount,
                    m_pos: asset.pos,
                };
            })
            .sort((a, b) => a.m_pos - b.m_pos);

        const transformedData = {
            assets,
            descriptions: Object.values(data.rgDescriptions),
            total_inventory_count: Math.max(...assets.map((e) => e.m_pos)),
            success: true,
            more_items: 0,
            rwgrsn: -2,
        };

        /* Required to force the page to lazy load images correctly */
        this.m_bNeedsRepagination = true;

        return this.g_AddInventoryData(transformedData);
    };

    CInventory.prototype.ShowInventoryLoadError = function CInventory_ShowInventoryLoadError_CSGOFloat() {
        const prev_$ErrorDisplay = this.m_$ErrorDisplay;

        /* Handle upstream like before */
        this.g_ShowInventoryLoadError();

        if (prev_$ErrorDisplay) {
            /* Element already created, nothing special to do */
            return;
        }

        this.m_$ErrorDisplay.find('.retry_load_btn').after(`
        <div class="btnv6_blue_hoverfade btn_small retry_load_btn_csgofloat" style="margin-left: 10px;">
            <span>Try Again using CSGOFloat</span>
        </div>
    `);
        this.m_$ErrorDisplay.find('.retry_load_btn_csgofloat').click(() => {
            g_InventoryFallbackCSGOFloat = true;
            this.RetryLoad();
        });
    };
}
