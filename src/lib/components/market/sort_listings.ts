import {FloatElement} from '../custom';
import {CustomElement} from '../injectors';
import {html, HTMLTemplateResult, nothing} from 'lit';
import '../common/ui/steam-button';
import {state} from 'lit/decorators.js';
import {gFloatFetcher} from '../../services/float_fetcher';
import {getMarketInspectLink} from './helpers';
import {ItemInfo} from '../../bridge/handlers/fetch_inspect_info';
import {getFadeParams, getFadePercentage} from '../../utils/skin';
import {AppId, ContextId} from '../../types/steam_constants';
import {debounce} from 'lodash-decorators';
import {DebouncedFunc} from 'lodash';

enum SortType {
    FLOAT = 'Float',
    FADE = 'Fade',
}

enum SortDirection {
    NONE,
    ASC,
    DESC,
}

// Union type for fetched item info: successful and failed.
type SortableItem =
    | {
          failed: false;
          listingId: string;
          info: ItemInfo;
          converted_price: number;
          fadePercentage: number;
      }
    | {
          failed: true;
          listingId: string;
      };

type SuccessfulSortableItem = Extract<SortableItem, {failed: false}>;

@CustomElement()
export class SortListings extends FloatElement {
    @state()
    private type: SortType = SortType.FLOAT;
    @state()
    private direction: SortDirection = SortDirection.NONE;

    private observer: MutationObserver | null = null;

    @state()
    get isFadeSkin() {
        const firstRow = document.querySelector('#searchResultsRows .market_listing_row.market_recent_listing_row');

        if (firstRow === null) {
            return false;
        }

        const listingInfo = g_rgListingInfo[firstRow.id.replace('listing_', '')];

        const asset = g_rgAssets[AppId.CSGO][ContextId.PRIMARY][listingInfo.asset.id];

        return getFadeParams(asset) !== undefined;
    }

    connectedCallback() {
        super.connectedCallback();

        // Find the container of listings that we need to watch.
        const targetNode = document.getElementById('searchResultsRows');
        if (!targetNode) return;

        // Create a MutationObserver to detect when the page's items are dynamically replaced.
        this.observer = new MutationObserver(() => this.onMutation());

        // Start observing the target node for additions or removals of child elements.
        this.observer.observe(targetNode, {childList: true});
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.observer) {
            this.observer.disconnect();
        }

        // Workaround to avoid using @ts-ignore:
        // type assertion to inform ts about the .cancel() added from the lodash debounce
        (this.onMutation as DebouncedFunc<() => void>).cancel();
    }

    /**
     * This decorated method is called when the item list changes.
     * The @debounce decorator ensures it only runs once after a series of rapid changes.
     */
    @debounce(500)
    private onMutation() {
        // Only re-sort if a sort is currently active.
        if (this.direction === SortDirection.NONE) return;

        const targetNode = document.getElementById('searchResultsRows');

        // Disconnect the observer temporarily to prevent sortListings() from causing this mutation
        // handler to re-trigger, causing a loop.
        this.observer?.disconnect();

        this.sortListings(this.type, this.direction)
            .catch((err) => console.error('CSFloat: Failed to re-sort list', err))
            .finally(() => {
                // Reconnect the observer to watch for the next page change.
                if (targetNode) {
                    this.observer?.observe(targetNode, {childList: true});
                }
            });
    }

    private async sortListings(sortType: SortType, direction: SortDirection) {
        const rows = document.querySelectorAll('#searchResultsRows .market_listing_row.market_recent_listing_row');
        if (rows.length === 0) return;

        const infoPromises = [...rows]
            .map((e) => e.id.replace('listing_', ''))
            .map(async (listingId): Promise<SortableItem> => {
                // Catch error to prevent one failure from stopping the Promise.all() later
                try {
                    const link = getMarketInspectLink(listingId);
                    const info = await gFloatFetcher.fetch({link: link!});
                    const listingInfo = g_rgListingInfo[listingId];
                    const asset = g_rgAssets[AppId.CSGO][ContextId.PRIMARY][listingInfo.asset.id];
                    return {
                        failed: false,
                        info,
                        listingId: listingId!,
                        converted_price: listingInfo?.converted_price || 0,
                        fadePercentage: (asset && getFadePercentage(asset, info)?.percentage) || 0,
                    };
                } catch (error) {
                    console.error(`CSFloat: Failed to fetch float for listing ${listingId}:`, error);
                    return {failed: true, listingId: listingId!};
                }
            });

        const infos = await Promise.all(infoPromises);

        // Type Guard that checks if an item was successfully fetched.
        function isSuccessfulItem(item: SortableItem): item is SuccessfulSortableItem {
            return !item.failed;
        }

        const successfulItems = infos.filter(isSuccessfulItem);
        const failedItems = infos.filter((r) => r.failed);
        const sortedInfos = [...SortListings.sort(successfulItems, sortType, direction), ...failedItems];

        let lastItem = document.querySelector('#searchResultsRows .market_listing_table_header');

        for (const info of sortedInfos) {
            const itemElement = document.querySelector(`#listing_${info.listingId}`);
            if (itemElement && itemElement.parentNode && lastItem) {
                lastItem = itemElement.parentNode.insertBefore(itemElement, lastItem.nextSibling);
            }
        }
    }

    async onClick(sortType: SortType) {
        const newDirection =
            sortType === this.type ? SortListings.getNextSortDirection(this.direction) : SortDirection.ASC;

        await this.sortListings(sortType, newDirection);

        this.type = sortType;
        this.direction = newDirection;
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
}
