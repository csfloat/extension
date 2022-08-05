import {init} from "./utils";
import {Filters} from "../filter/filters";
import {gFloatFetcher} from "../float_fetcher/float_fetcher";

init('src/lib/page_scripts/market_listing.js', main);

async function main() {
    console.log('hello world');
    new Filters();

    const a = await gFloatFetcher.fetch({
        link: 'steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20S76561198273131081A22472990917D11702291663056892105'
    });
    console.log(a);
}

