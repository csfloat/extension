import {Asset} from "../../types/steam";
import {ItemInfo} from "../../bridge/handlers/fetch_inspect_info";

/**
 * Inlines stickers into a market item row HTML showing the image and wear
 *
 * @param itemNameBlock Element with `.market_listing_item_name_block`
 * @param itemInfo Item Info for the item from csgofloat API
 * @param asset Steam Asset for the item
 */
export function inlineStickers(itemNameBlock: JQuery<Element>, itemInfo: ItemInfo, asset: Asset) {
    if (!itemNameBlock) return;

    const lastDescription = asset.descriptions[asset.descriptions.length - 1];

    if (lastDescription.type !== 'html' || !lastDescription.value.includes('sticker')) {
        return;
    }

    const nameMatch = lastDescription.value.match(/<br>([^<].*?): (.*)<\/center>/);
    const imagesHtml = lastDescription.value.match(/(<img .*?>)/g);

    if (!nameMatch || !imagesHtml) {
        return;
    }

    const stickerLang = nameMatch[1];
    const stickerNames = nameMatch[2].split(', ');

    const result = imagesHtml.map((imageHtml, i) => {
        const url =
            stickerLang === 'Sticker'
                ? `https://steamcommunity.com/market/listings/730/${stickerLang} | ${stickerNames[i]}`
                : `https://steamcommunity.com/market/search?q=${stickerLang} | ${stickerNames[i]}`;

        const sticker = itemInfo.stickers[i];

        return `<span style="display: inline-block; text-align: center;">
                    <a target="_blank" href="${url}">${imagesHtml[i]}</a>
                    <span style="display: block;">
                        ${Math.round(100 * (sticker?.wear || 0)) + '%'}
                    </span>
                </span>`;
    }).reduce((acc, v) => acc + v, '');


    itemNameBlock.prepend(`
        <div class="csgofloat-stickers-container">
            ${result}
        </div>
    `);
}

/**
 * Adds easy inspect link by hovering over a market listing row image
 * @param itemImgContainer Element with ".market_listing_item_img_container"
 * @param inspectLink Item Inspect Link
 */
export function inlineEasyInspect(itemImgContainer: JQuery<Element>, inspectLink: string|undefined) {
    if (!itemImgContainer || !inspectLink) return;

    itemImgContainer.append(`
        <a class="csgofloat-easy-inspect" href="${inspectLink}">🔍</a>
    `);
}
