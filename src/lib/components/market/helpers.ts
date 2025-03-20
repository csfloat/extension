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
