import {FloatElement} from '../custom';
import {CustomElement} from '../injectors';
import {html, HTMLTemplateResult} from 'lit';
import '../common/ui/steam-button';
import {state} from 'lit/decorators.js';
import {gFloatFetcher} from '../../float_fetcher/float_fetcher';
import {getMarketInspectLink} from './helpers';
import {ItemInfo} from '../../bridge/handlers/fetch_inspect_info';

enum SortDirection {
    NONE,
    ASC,
    DESC,
}

@CustomElement()
export class SortFloats extends FloatElement {
    @state()
    private direction: SortDirection = SortDirection.NONE;

    @state()
    get buttonText(): string {
        let txt = 'Sort by Float';

        if (this.direction === SortDirection.ASC) {
            txt += ' ▲';
        } else if (this.direction === SortDirection.DESC) {
            txt += ' ▼';
        }

        return txt;
    }

    protected render(): HTMLTemplateResult {
        return html`
            <csgofloat-steam-button .text="${this.buttonText}" @click="${this.onClick}"></csgofloat-steam-button>
        `;
    }

    getNextSortDirection(): SortDirection {
        switch (this.direction) {
            case SortDirection.NONE:
                return SortDirection.ASC;
            case SortDirection.ASC:
                return SortDirection.DESC;
            case SortDirection.DESC:
                return SortDirection.ASC;
        }
    }

    static sort(
        infos: {listingId: string; info: ItemInfo}[],
        direction: SortDirection
    ): {listingId: string; info: ItemInfo}[] {
        switch (direction) {
            case SortDirection.NONE:
                return infos;
            case SortDirection.ASC:
                return infos.sort((a, b) => a.info.floatvalue - b.info.floatvalue);
            case SortDirection.DESC:
                return infos.sort((a, b) => b.info.floatvalue - a.info.floatvalue);
        }
    }

    async onClick() {
        const newDirection = this.getNextSortDirection();

        const rows = document.querySelectorAll('#searchResultsRows .market_listing_row.market_recent_listing_row');

        const infoPromises: Promise<{listingId: string; info: ItemInfo}>[] = [...rows]
            .map((e) => e.id.replace('listing_', ''))
            .map(async (listingId) => {
                const link = getMarketInspectLink(listingId);

                const info = await gFloatFetcher.fetch({link: link!});
                return {
                    info,
                    listingId: listingId!,
                };
            });

        const infos: {listingId: string; info: ItemInfo}[] = await Promise.all(infoPromises);
        const sortedInfos = SortFloats.sort(infos, newDirection);

        let lastItem = document.querySelector('#searchResultsRows .market_listing_table_header');

        for (const info of sortedInfos) {
            const itemElement = document.querySelector(`#listing_${info.listingId}`);
            lastItem = itemElement!.parentNode!.insertBefore(itemElement!, lastItem!.nextSibling);
        }

        this.direction = newDirection;
    }
}
