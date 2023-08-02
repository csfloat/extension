import {FloatElement} from '../custom';
import {CustomElement} from '../injectors';
import {html, HTMLTemplateResult, nothing} from 'lit';
import '../common/ui/steam-button';
import {state} from 'lit/decorators.js';
import {gFloatFetcher} from '../../services/float_fetcher';
import {getMarketInspectLink} from './helpers';
import {ItemInfo} from '../../bridge/handlers/fetch_inspect_info';
import {getFadeCalculatorAndSupportedWeapon, getFadePercentage} from '../../utils/skin';
import {AppId, ContextId} from '../../types/steam_constants';

enum SortType {
    FLOAT = 'Float',
    FADE = 'Fade',
}

enum SortDirection {
    NONE,
    ASC,
    DESC,
}

@CustomElement()
export class SortListings extends FloatElement {
    @state()
    private type: SortType = SortType.FLOAT;
    @state()
    private direction: SortDirection = SortDirection.NONE;

    @state()
    get isFadeSkin() {
        const firstRow = document.querySelector('#searchResultsRows .market_listing_row.market_recent_listing_row');

        if (firstRow === null) {
            return false;
        }

        const listingInfo = g_rgListingInfo[firstRow.id.replace('listing_', '')];

        const asset = g_rgAssets[AppId.CSGO][ContextId.PRIMARY][listingInfo.asset.id];

        return getFadeCalculatorAndSupportedWeapon(asset) !== undefined;
    }

    computeButtonText(sortType: SortType): string {
        let txt = `Sort by ${sortType}`;

        const sortDirection = sortType === this.type ? this.direction : SortDirection.NONE;

        if (sortDirection === SortDirection.ASC) {
            txt += ' ▲';
        } else if (sortDirection === SortDirection.DESC) {
            txt += ' ▼';
        }

        return txt;
    }

    protected render(): HTMLTemplateResult {
        return html`
            <csfloat-steam-button
                .text="${this.computeButtonText(SortType.FLOAT)}"
                @click="${() => this.onClick(SortType.FLOAT)}"
            ></csfloat-steam-button>

            ${this.isFadeSkin
                ? html`<csfloat-steam-button
                      .text="${this.computeButtonText(SortType.FADE)}"
                      @click="${() => this.onClick(SortType.FADE)}"
                  ></csfloat-steam-button>`
                : nothing}
        `;
    }

    static getNextSortDirection(sortDirection: SortDirection): SortDirection {
        switch (sortDirection) {
            case SortDirection.NONE:
                return SortDirection.ASC;
            case SortDirection.ASC:
                return SortDirection.DESC;
            case SortDirection.DESC:
                return SortDirection.NONE;
        }
    }

    static sort(
        infos: {listingId: string; info: ItemInfo; converted_price: number; fadePercentage: number}[],
        sortType: SortType,
        direction: SortDirection
    ): {listingId: string; info: ItemInfo}[] {
        const floatOrFade = (float: number, fade: number) => (sortType === SortType.FLOAT ? float : fade);

        switch (direction) {
            case SortDirection.NONE:
                return infos.sort((a, b) => a.converted_price - b.converted_price);
            case SortDirection.ASC:
                return infos.sort(
                    (a, b) =>
                        floatOrFade(a.info.floatvalue, a.fadePercentage) -
                        floatOrFade(b.info.floatvalue, b.fadePercentage)
                );
            case SortDirection.DESC:
                return infos.sort(
                    (a, b) =>
                        floatOrFade(b.info.floatvalue, b.fadePercentage) -
                        floatOrFade(a.info.floatvalue, a.fadePercentage)
                );
        }
    }

    async onClick(sortType: SortType) {
        const newDirection =
            sortType == this.type ? SortListings.getNextSortDirection(this.direction) : SortDirection.ASC;

        const rows = document.querySelectorAll('#searchResultsRows .market_listing_row.market_recent_listing_row');

        const infoPromises = [...rows]
            .map((e) => e.id.replace('listing_', ''))
            .map(async (listingId) => {
                const link = getMarketInspectLink(listingId);

                const info = await gFloatFetcher.fetch({link: link!});

                const listingInfo = g_rgListingInfo[listingId];

                const asset = g_rgAssets[AppId.CSGO][ContextId.PRIMARY][listingInfo.asset.id];

                return {
                    info,
                    listingId: listingId!,
                    converted_price: listingInfo?.converted_price || 0,
                    fadePercentage: (asset && getFadePercentage(asset, info)) || 0,
                };
            });

        const infos = await Promise.all(infoPromises);
        const sortedInfos = SortListings.sort(infos, sortType, newDirection);

        let lastItem = document.querySelector('#searchResultsRows .market_listing_table_header');

        for (const info of sortedInfos) {
            const itemElement = document.querySelector(`#listing_${info.listingId}`);
            lastItem = itemElement!.parentNode!.insertBefore(itemElement!, lastItem!.nextSibling);
        }

        this.type = sortType;
        this.direction = newDirection;
    }
}
