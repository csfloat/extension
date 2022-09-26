import {InventoryAsset} from "../types/steam";
import {ItemInfo} from "../bridge/handlers/fetch_inspect_info";
import {getDopplerPhase, hasDopplerPhase} from "./dopplers";
import {html, TemplateResult} from "lit";

export function parseRank(info: ItemInfo): {order: OrderType, rank: number}|undefined {
    const rank = (info.low_rank || 1001) < (info.high_rank || 1001) ?
        info.low_rank : info.high_rank;
    if (rank && rank <= 1000) {
        return {
            order: rank === info.low_rank ? OrderType.LOW_RANK : OrderType.HIGH_RANK,
            rank
        }
    }
}

export function formatFloatWithRank(info: ItemInfo, precisionDigits = 14): string {
    let r = info.floatvalue.toFixed(precisionDigits);

    const ranked = parseRank(info);
    if (ranked) {
        r += ` (#${ranked.rank})`;
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

enum OrderType {
    LOW_RANK = 1,
    HIGH_RANK = -1
}

/**
 * Gets formatted link for floatdb for the specified item type and order
 * @param info item properties dict
 * @param order 1 for low float, -1 for high float ordering
 */
function getFloatDbLink(info: ItemInfo, order: OrderType): string {
    function getFloatDbCategory(item: ItemInfo): number {
        if (item.full_item_name!.includes('StatTrak')) {
            return 2;
        } else if (item.full_item_name!.includes('Souvenir')) {
            return 3;
        } else {
            // "Normal"
            return 1;
        }
    }

    return `https://csgofloat.com/db?defIndex=${info.defindex}&paintIndex=${info.paintindex}&order=${order}&category=${getFloatDbCategory(info)}`;
}

export function renderClickableRank(info: ItemInfo): TemplateResult<1> {
    const parsedRank = parseRank(info);
    if (!parsedRank) {
        return html``;
    }

    return html`
        <a style="color: #ebebeb; text-decoration: none; cursor: pointer;"
           href="${getFloatDbLink(info, parsedRank.order)}" target="_blank">
            (Rank #${parsedRank.rank})
        </a>`;
}

export function isSkin(asset: InventoryAsset): boolean {
    return !!asset.description.tags?.find(
        a => a.category === 'Weapon'
            || (a.category === 'Type' && a.internal_name === 'Type_Hands'));
}