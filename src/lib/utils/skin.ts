import {rgAsset} from '../types/steam';
import {ItemInfo} from '../bridge/handlers/fetch_inspect_info';
import {getDopplerPhase, hasDopplerPhase} from './dopplers';
import {html, TemplateResult} from 'lit';
import {AcidFadeCalculator, AmberFadeCalculator, FadeCalculator} from 'csgo-fade-percentage-calculator';

export function rangeFromWear(wear: number): [number, number] | null {
    const wearRanges: [number, number][] = [
        [0.0, 0.07],
        [0.07, 0.15],
        [0.15, 0.38],
        [0.38, 0.45],
        [0.45, 1.0],
    ];

    for (const range of wearRanges) {
        if (wear > range[0] && wear <= range[1]) {
            return range;
        }
    }

    return null;
}

export function getLowestRank(info: ItemInfo): number | undefined {
    if (!info.low_rank && !info.high_rank) {
        // Item has no rank to return
        return;
    }

    return (info.low_rank || 1001) < (info.high_rank || 1001) ? info.low_rank : info.high_rank;
}

export function parseRank(info: ItemInfo): {order: OrderType; rank: number} | undefined {
    const rank = getLowestRank(info);
    if (rank && rank <= 1000) {
        return {
            order: rank === info.low_rank ? OrderType.LOW_RANK : OrderType.HIGH_RANK,
            rank,
        };
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
    HIGH_RANK = -1,
}

/**
 * Gets formatted link for floatdb for the specified item type and order
 * @param info item properties dict
 * @param order 1 for low float, -1 for high float ordering
 */
function getFloatDbLink(info: ItemInfo, order: OrderType): string {
    function getFloatDbCategory(item: ItemInfo): number {
        if (item.full_item_name?.includes('StatTrak')) {
            return 2;
        } else if (item.full_item_name?.includes('Souvenir')) {
            return 3;
        } else {
            // "Normal"
            return 1;
        }
    }

    return `https://csfloat.com/db?defIndex=${info.defindex}&paintIndex=${
        info.paintindex
    }&order=${order}&category=${getFloatDbCategory(info)}`;
}

export function renderClickableRank(info: ItemInfo): TemplateResult<1> {
    const parsedRank = parseRank(info);
    if (!parsedRank) {
        return html``;
    }

    return html` <a
        style="color: #ebebeb; text-decoration: none; cursor: pointer;"
        href="${getFloatDbLink(info, parsedRank.order)}"
        target="_blank"
    >
        (Rank #${parsedRank.rank})
    </a>`;
}

export function isSellableOnCSFloat(asset: rgAsset): boolean {
    return isSkin(asset) || isCharm(asset) || isAgent(asset) || isSticker(asset) || isPatch(asset) || isCase(asset);
}

export function isSkin(asset: rgAsset): boolean {
    return asset.tags
        ? asset.tags.some((a) => a.category === 'Weapon' || (a.category === 'Type' && a.internal_name === 'Type_Hands'))
        : ['★', 'Factory New', 'Minimal Wear', 'Field-Tested', 'Well-Worn', 'Battle-Scarred'].some((keyword) =>
              asset.market_hash_name.includes(keyword)
          );
}

export function isCharm(asset: rgAsset): boolean {
    return isAbstractType(asset, 'Charm', 'CSGO_Type_Charm');
}

export function isAgent(asset: rgAsset): boolean {
    return isAbstractType(asset, 'Agent', 'Type_CustomPlayer');
}

export function isSticker(asset: rgAsset): boolean {
    return isAbstractType(asset, 'Sticker', 'CSGO_Tool_Sticker');
}

export function isPatch(asset: rgAsset): boolean {
    return isAbstractType(asset, 'Patch', 'CSGO_Type_Patch');
}

export function isCase(asset: rgAsset): boolean {
    return isAbstractType(asset, 'Container', 'CSGO_Type_WeaponCase');
}

function isAbstractType(asset: rgAsset, type: string, internalName: string): boolean {
    if (asset.type.endsWith(type)) {
        return true;
    }

    if (!asset.tags) {
        return false;
    }

    return asset.tags.some((e) => e.category === 'Type' && e.internal_name === internalName);
}

/**
 * Checks if the item is a skins that supports bluegem data
 * I.e. Case Hardened or Heat Treated, not gloves
 * @param itemInfo item info
 * @returns true if the item is a blue skin, false otherwise
 */
export function isBlueSkin(itemInfo: ItemInfo): boolean {
    return (
        itemInfo.item_name !== undefined &&
        itemInfo.weapon_type !== undefined &&
        ['Case Hardened', 'Heat Treated'].includes(itemInfo.item_name) &&
        !itemInfo.weapon_type.includes('Gloves')
    );
}

export function getFadeParams(
    asset: rgAsset
):
    | {
          calculator: typeof FadeCalculator | typeof AcidFadeCalculator | typeof AmberFadeCalculator;
          weaponName: string;
          className: string;
      }
    | undefined {
    const FADE_TYPE_TO_CALCULATOR = {
        Fade: FadeCalculator,
        'Acid Fade': AcidFadeCalculator,
        'Amber Fade': AmberFadeCalculator,
    };

    for (const [fadeType, calculator] of Object.entries(FADE_TYPE_TO_CALCULATOR)) {
        for (const supportedWeapon of calculator.getSupportedWeapons()) {
            if (asset.market_hash_name.includes(`${supportedWeapon} | ${fadeType}`)) {
                return {
                    calculator,
                    weaponName: supportedWeapon.toString(),
                    className: fadeType.replace(' ', '-').toLowerCase(),
                };
            }
        }
    }
}

export function getFadePercentage(
    asset: rgAsset,
    itemInfo: ItemInfo
): {percentage: number; fadeType: string} | undefined {
    const fadeInfo = getFadeParams(asset);

    if (fadeInfo !== undefined) {
        const {calculator, weaponName, className} = fadeInfo;

        return {
            percentage: calculator.getFadePercentage(weaponName, itemInfo.paintseed).percentage,
            fadeType: className,
        };
    }
}

export function floor(n: number, precision?: number) {
    const p = 10 ** (precision || 0);

    return Math.floor(n * p) / p;
}
