import {init} from './utils';
import '../components/market/item_row_wrapper';
import '../components/market/utility_belt';
import '../components/market/react/filter_panel';
import '../components/market/react/rank';
import '../components/market/react/seed_info';
import '../components/market/react/highlight';
import '../components/market/react/listing_view_3d';
import '../components/market/react/dialog_view_3d';
import {gSkinCraftEmbed} from '../services/skincraft_embed';
import {loadMoreListingTargets, openNativeBuyDialog} from '../services/skincraft_market_targets';

init('src/lib/page_scripts/market_listing.js', main);

async function main() {
    gSkinCraftEmbed.registerItemsProvider(loadMoreListingTargets);
    gSkinCraftEmbed.registerViewListingHandler(openNativeBuyDialog);
}
