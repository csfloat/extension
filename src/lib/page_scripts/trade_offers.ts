import {init} from './utils';
import {inPageContext} from '../utils/snips';
import {pingTradeHistory} from '../alarms/trade_history';

init('src/lib/page_scripts/trade_offers.js', main);

function main() {}

if (!inPageContext()) {
    pingTradeHistory([])
        .then((r) => console.log(r))
        .catch((e) => console.log(e));
}
