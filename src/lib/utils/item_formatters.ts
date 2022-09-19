import {ItemInfo} from "../bridge/handlers/fetch_inspect_info";
import {getDopplerPhase, hasDopplerPhase} from "./dopplers";

export function formatFloat(info: ItemInfo, precisionDigits = 14): string {
    let r = info.floatvalue.toFixed(precisionDigits);

    const rank = (info.low_rank || 1001) < (info.high_rank || 1001) ?
        info.low_rank : info.high_rank;
    if (rank && rank <= 1000) {
        r += ` (#${rank})`
    }

    return r;
}

export function formatSeed(info: ItemInfo): string {
    let r = info.paintseed.toString();

    if (hasDopplerPhase(info.paintindex)) {
        r += ` (${getDopplerPhase(info.paintindex)})`;
    }

    return r;
}
