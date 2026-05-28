import {gBetaListingStore} from './data_store';
import {BetaCardScanner} from './card_scanner';
import {BetaListingEnhancer} from './listing';
import './filter_panel';

const FILTER_PANEL_TAG = 'csfloat-beta-filter-panel';
const LISTINGS_GRID_SELECTOR = '[style*="grid-columns:repeat(auto-fill, minmax(260px"]';
/** Wait for the listings grid to stop churning before mounting (React hydration). */
const MOUNT_SETTLE_MS = 300;

/**
 * Boots the Steam Market beta enhancements. Must only be called when {@link SteamMarketMode.BETA}
 * is active. Idempotent: repeated calls have no effect.
 */
export function initBetaMarket(): void {
    if ((window as any).__csfloatBetaMarketInitialized) return;
    (window as any).__csfloatBetaMarketInitialized = true;

    gBetaListingStore.init();

    BetaCardScanner.start((card, listingId) => {
        BetaListingEnhancer.enhance(card, listingId);
    });

    mountFilterPanelWhenReady();
}

/**
 * Watches for the Steam beta listings grid to appear and inserts the filter panel above the
 * listings section. The grid only exists once Steam has hydrated, and may be re-rendered on
 * filter/pagination, so we keep watching and re-mount if our panel disappears.
 */
function mountFilterPanelWhenReady(): void {
    let mountTimer: number | undefined;

    const scheduleTryMount = () => {
        if (mountTimer !== undefined) {
            window.clearTimeout(mountTimer);
        }
        mountTimer = window.setTimeout(() => {
            mountTimer = undefined;
            tryMount();
        }, MOUNT_SETTLE_MS);
    };

    scheduleTryMount();

    const observer = new MutationObserver(() => scheduleTryMount());
    observer.observe(document.body, {childList: true, subtree: true});
}

function tryMount(): void {
    const grid = document.querySelector<HTMLElement>(LISTINGS_GRID_SELECTOR);
    if (!grid) return;

    const mountPoint = findMountPoint(grid);
    if (!mountPoint) return;

    const {parent, before} = mountPoint;
    const existing = parent.querySelector<HTMLElement>(`:scope > ${FILTER_PANEL_TAG}`);
    if (existing) {
        if (existing.nextElementSibling !== before) {
            parent.insertBefore(existing, before);
        }
        return;
    }

    const key = decodedMarketHashName();
    if (!key) return;

    const panel = document.createElement(FILTER_PANEL_TAG);
    panel.setAttribute('key', key);
    parent.insertBefore(panel, before);
}

/**
 * Returns a mount point outside the React-managed listings subtree.
 *
 * The grid's parent is owned by React; inserting a sibling there causes hydration error #418 and
 * React tears down the whole section. Mount before that container instead so React reconciliation
 * does not touch our panel.
 */
function findMountPoint(grid: HTMLElement): {parent: HTMLElement; before: HTMLElement} | undefined {
    const listingsSection = grid.parentElement;
    if (!listingsSection) return;

    const parent = listingsSection.parentElement;
    if (!parent) return;

    return {parent, before: listingsSection};
}

/**
 * Returns the market hash name from the current page URL, e.g.
 * `/market/listings/730/AK-47%20%7C%20Redline%20%28Field-Tested%29` -> `AK-47 | Redline (Field-Tested)`.
 */
function decodedMarketHashName(): string | undefined {
    const match = window.location.pathname.match(/^\/market\/listings\/\d+\/(.+?)\/?$/);
    if (!match) return;
    try {
        return decodeURIComponent(match[1]);
    } catch {
        return match[1];
    }
}
