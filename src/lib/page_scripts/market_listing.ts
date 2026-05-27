import {init} from './utils';
import {getSteamMarketMode, SteamMarketMode} from '../components/market/mode';
import '../components/market/item_row_wrapper';
import '../components/market/utility_belt';

init('src/lib/page_scripts/market_listing.js', main);

async function main() {
    if (getSteamMarketMode() === SteamMarketMode.BETA) {
        console.info('CSFloat: Skipping market listing enhancements on the Steam Market beta page.');
    }
}
