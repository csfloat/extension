import {rgAsset, rgInternalDescription} from '../../types/steam';
import {ItemInfo} from '../../bridge/handlers/fetch_inspect_info';
import {AppId, ContextId} from '../../types/steam_constants';

/**
 * If possible, constructs the inspect link from the given listing ID using page variables
 *
 * @param listingId ID for the listing, may also be referred to as "M"
 */
export function getMarketInspectLink(listingId: string): string | undefined {
    const listingInfo = g_rgListingInfo[listingId];
    if (!listingInfo) return;

    const asset = g_rgAssets[AppId.CSGO][ContextId.PRIMARY][listingInfo.asset.id!];
    if (!asset || !asset.market_actions?.length) return;

    return asset.market_actions[0].link.replace('%listingid%', listingId).replace('%assetid%', asset.id);
}

function getStickerDescription(itemInfo: ItemInfo, asset: rgAsset): rgInternalDescription | undefined {
    if (!itemInfo.stickers?.length) {
        return;
    }

    if (itemInfo.keychains?.length > 0) {
        // if they have a keychain, it is the second last description
        return asset.descriptions[asset.descriptions.length - 2];
    } else {
        return asset.descriptions[asset.descriptions.length - 1];
    }
}

function getKeychainDescription(itemInfo: ItemInfo, asset: rgAsset): rgInternalDescription | undefined {
    if (!itemInfo.keychains?.length) {
        return;
    }

    return asset.descriptions[asset.descriptions.length - 1];
}

enum AppliedType {
    Charm = 'Charm',
    Sticker = 'Sticker',
}

function generateAppliedInlineHTML(
    description: rgInternalDescription,
    type: AppliedType,
    textFormatFn: (index: number) => string
) {
    const nameMatch = description.value.match(/<br>([^<].*?): (.*)<\/center>/);
    const imagesHtml = description.value.match(/(<img .*?>)/g);

    if (!nameMatch || !imagesHtml) {
        return [];
    }

    const parsedType = nameMatch[1];
    const names = nameMatch[2].split(', ');

    return imagesHtml.map((imageHtml, i) => {
        const url =
            parsedType === type
                ? `https://steamcommunity.com/market/listings/730/${parsedType} | ${names[i]}`
                : `https://steamcommunity.com/market/search?q=${parsedType} | ${names[i]}`;

        return `<span style="display: inline-block; text-align: center;">
                    <a target="_blank" href="${url}">${imagesHtml[i]}</a>
                    <span style="display: block;">
                        ${textFormatFn(i)}
                    </span>
                </span>`;
    });
}

function generateStickerInlineHTML(itemInfo: ItemInfo, asset: rgAsset): string[] {
    const description = getStickerDescription(itemInfo, asset);

    if (!description || description.type !== 'html' || !description.value.includes('sticker')) {
        return [];
    }

    return generateAppliedInlineHTML(description, AppliedType.Sticker, (index) => {
        return `${Math.round(100 * (itemInfo.stickers[index]?.wear || 0)) + '%'}`;
    });
}

function generateKeychainInlineHTML(itemInfo: ItemInfo, asset: rgAsset): string[] {
    const description = getKeychainDescription(itemInfo, asset);

    if (!description || description.type !== 'html' || description.value.includes('sticker')) {
        return [];
    }

    return generateAppliedInlineHTML(description, AppliedType.Charm, (index) => {
        return `#${itemInfo.keychains[index]?.pattern}`;
    });
}

/**
 * Inlines stickers into a market item row HTML showing the image and wear
 *
 * @param itemNameBlock Element with `.market_listing_item_name_block`
 * @param itemInfo Item Info for the item from csfloat API
 * @param asset Steam Asset for the item
 */
export function inlineStickersAndKeychains(itemNameBlock: JQuery<Element>, itemInfo: ItemInfo, asset: rgAsset) {
    if (!itemNameBlock) return;

    // Remove Steam's inspect button
    itemNameBlock.parent().find('.market_listing_row_action')?.parent().remove();
    // Remove Steam's stickers and keychains
    itemNameBlock.parent().find('.market_listing_row_details')?.remove();

    if (itemNameBlock.find('.csfloat-stickers-container').length) {
        // Don't inline stickers if they're already inlined
        return;
    }

    const blobs = [...generateStickerInlineHTML(itemInfo, asset), ...generateKeychainInlineHTML(itemInfo, asset)];
    if (blobs.length === 0) {
        return;
    }

    const elementId = `listing_${itemInfo.m}_csfloat`;

    itemNameBlock.prepend(`
        <div class="csfloat-stickers-container" id="${elementId}">
            ${blobs.reduce((acc, v) => acc + v, '')}
        </div>
    `);

    // Add Steam's item popover on-hover
    CreateItemHoverFromContainer(g_rgAssets, elementId, asset.appid, asset.contextid, asset.id, asset.amount);
}

/**
 * Adds easy inspect link by hovering over a market listing row image
 * @param itemImgContainer Element with ".market_listing_item_img_container"
 * @param inspectLink Item Inspect Link
 */
export function inlineEasyInspect(itemImgContainer: JQuery<Element>, inspectLink: string | undefined) {
    if (!itemImgContainer || !inspectLink) return;

    itemImgContainer.append(`
        <a class="csfloat-easy-inspect" href="${inspectLink}">🔍</a>
    `);
}
