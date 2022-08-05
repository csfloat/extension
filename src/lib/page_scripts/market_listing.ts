import {init} from "./utils";
import {Filters} from "../filter/filters";

init('src/lib/page_scripts/market_listing.js', main);

async function main() {
    console.log('hello world');
    new Filters();
}

