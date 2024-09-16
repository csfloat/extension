import {init} from './utils';
import '../components/market/item_row_wrapper';
import '../components/market/utility_belt';
import '../components/market/response_render_results_status';
import {initResponseRenderResultsStatus} from '../components/market/response_render_results_status';

init('src/lib/page_scripts/market_listing.js', main);

async function main() {
    initResponseRenderResultsStatus()
}