import {environment} from '../../environment';
import {SkinCraftViewerModal} from '../components/common/skincraft_viewer_modal';
import {inPageContext} from '../utils/snips';
import {
    isSkinCraftEmbedEvent,
    mergeSkinCraftProgress,
    SKINCRAFT_EMBED_MESSAGE_SOURCE,
    SKINCRAFT_EMBED_PROTOCOL_VERSION,
} from './skincraft_embed_protocol';
import type {SkinCraftEmbedCommand} from './skincraft_embed_protocol';
import {getLoadedInventoryTargets} from './skincraft_inventory_targets';
import {
    isBuySkinCraftListingMessage,
    isMalformedSkinCraftViewerMessage,
    isOpenSkinCraftViewerMessage,
    isRequestSkinCraftViewerItemsMessage,
    isSkinCraftBuyListingResultMessage,
    isSkinCraftViewerItemsMessage,
    SKINCRAFT_VIEWER_MESSAGE_SOURCE,
    STEAM_INSPECT_URL_PATTERN,
} from './skincraft_viewer_protocol';
import type {
    BuySkinCraftListingMessage,
    OpenSkinCraftViewerMessage,
    RequestSkinCraftViewerItemsMessage,
    SkinCraftBuyListingResultMessage,
    SkinCraftItem,
    SkinCraftViewerItemsMessage,
    SkinCraftViewerTarget,
} from './skincraft_viewer_protocol';

const LOAD_TIMEOUT_MS = 20_000;
/** The page answers synchronously; a miss means the page script died or was never injected. */
const BUY_RESULT_TIMEOUT_MS = 2_000;
type LoadPhase = 'idle' | 'loading' | 'loaded' | 'error';

class SkinCraftEmbedService {
    private readonly runsInPage = inPageContext();
    private readonly embedOrigin = new URL(environment.skincraft_embed_origin).origin;
    private readonly embedSrc = `${this.embedOrigin}/embed?parentOrigin=${encodeURIComponent(window.location.origin)}`;

    private modal?: SkinCraftViewerModal;
    private activeTarget?: SkinCraftViewerTarget;
    private ready = false;
    private active = false;
    private pendingInspect?: string;
    private loadSequence = 0;
    private latestLoadId?: string;
    private loadTimer?: number;
    private loadProgress: number | null = null;
    private loadPhase: LoadPhase = 'idle';
    private showLoadingCover = false;
    private frameHasContent = false;
    private needsFrameReload = false;
    private itemsProvider?: () => Promise<SkinCraftItem[]>;
    private buyHandler?: (listingId: string) => boolean;
    private providingItems = false;
    private latestItemsRequestId = 0;
    private itemsRequestPending = false;
    private itemsRequestId = 0;
    private itemCount = 0;
    private pendingBuyListingId?: string;
    private buyResultTimer?: number;

    constructor() {
        if (this.runsInPage) {
            window.addEventListener('message', this.handlePageRequest);
        } else {
            window.addEventListener('message', this.handleViewerMessage);
        }
    }

    /** Page-context surfaces with paginated items (the Market beta) register how to load more. */
    registerItemsProvider(provider: () => Promise<SkinCraftItem[]>): void {
        this.itemsProvider = provider;
    }

    /** Page-context surfaces with purchasable items register how to hand off to their buy flow. */
    registerBuyListingHandler(handler: (listingId: string) => boolean): void {
        this.buyHandler = handler;
    }

    open(target: SkinCraftItem, items?: SkinCraftItem[]): void {
        if (!target.inspect) return;

        if (this.runsInPage) {
            window.postMessage(
                {
                    source: SKINCRAFT_VIEWER_MESSAGE_SOURCE,
                    type: 'open',
                    target,
                    inventory: items ?? this.loadedInventoryTargets(),
                } satisfies OpenSkinCraftViewerMessage,
                window.location.origin
            );
            return;
        }

        this.openEmbeddedViewer(target, items ?? []);
    }

    private loadedInventoryTargets(): SkinCraftItem[] {
        return typeof g_ActiveInventory === 'undefined' || !g_ActiveInventory
            ? []
            : getLoadedInventoryTargets(g_ActiveInventory);
    }

    private handlePageRequest = (event: MessageEvent): void => {
        if (event.source !== window || event.origin !== window.location.origin) return;
        if (isRequestSkinCraftViewerItemsMessage(event.data)) {
            void this.provideItems(event.data.requestId);
        } else if (isBuySkinCraftListingMessage(event.data)) {
            this.answerBuyRequest(event.data.listingId);
        } else if (isMalformedSkinCraftViewerMessage(event.data, ['buy-listing'])) {
            console.error('CSFloat: dropped a malformed SkinCraft viewer message in the page context.', event.data);
        }
    };

    /**
     * Requests that arrive mid-load coalesce into it: the harvest reads the grid once the load
     * settles, so it answers the newest request, and every request gets an answer.
     */
    private async provideItems(requestId: number): Promise<void> {
        this.latestItemsRequestId = requestId;
        if (this.providingItems) return;

        this.providingItems = true;
        let inventory: SkinCraftItem[] = [];
        try {
            if (this.itemsProvider) {
                inventory = await this.itemsProvider();
            } else {
                console.error('CSFloat: SkinCraft viewer items were requested before a provider was registered.');
            }
        } catch (e) {
            // An empty answer reads as "nothing more" — the content script keeps its current strip.
            console.error('CSFloat: failed to load more items for the SkinCraft viewer.', e);
        } finally {
            this.providingItems = false;
        }

        // Always answered, even empty: the content script's pending flag latches until a response.
        window.postMessage(
            {
                source: SKINCRAFT_VIEWER_MESSAGE_SOURCE,
                type: 'items',
                requestId: this.latestItemsRequestId,
                inventory,
            } satisfies SkinCraftViewerItemsMessage,
            window.location.origin
        );
    }

    private answerBuyRequest(listingId: string): void {
        let success = false;
        try {
            success = this.buyHandler?.(listingId) ?? false;
        } catch (e) {
            console.error('CSFloat: the buy hand-off threw.', e);
        }
        if (!success) console.error(`CSFloat: found no native Buy button for listing ${listingId}.`);

        window.postMessage(
            {
                source: SKINCRAFT_VIEWER_MESSAGE_SOURCE,
                type: 'buy-result',
                listingId,
                success,
            } satisfies SkinCraftBuyListingResultMessage,
            window.location.origin
        );
    }

    close(): void {
        if (!this.active) return;

        this.active = false;
        this.pendingInspect = undefined;
        this.latestLoadId = undefined;
        this.itemsRequestPending = false;
        this.clearBuyRequest();
        this.itemCount = 0;
        this.loadProgress = null;
        this.loadPhase = 'idle';
        this.showLoadingCover = false;
        this.frameHasContent = false;
        this.clearLoadTimeout();
        this.post({type: 'clear'});
        this.modal?.hide();
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }

    private handleViewerMessage = (event: MessageEvent): void => {
        if (event.source !== window || event.origin !== window.location.origin) return;
        if (isOpenSkinCraftViewerMessage(event.data)) {
            this.openEmbeddedViewer(event.data.target, event.data.inventory);
        } else if (isSkinCraftViewerItemsMessage(event.data)) {
            this.applyItemsUpdate(event.data);
        } else if (isSkinCraftBuyListingResultMessage(event.data)) {
            this.handleBuyResult(event.data);
        } else if (isMalformedSkinCraftViewerMessage(event.data, ['open', 'items', 'buy-result'])) {
            console.error('CSFloat: dropped a malformed SkinCraft viewer message.', event.data);
        }
    };

    private openEmbeddedViewer(target: SkinCraftItem, inventory: SkinCraftItem[]): void {
        const modal = this.ensureModal();
        this.itemCount = inventory.length;
        this.itemsRequestPending = false;
        modal.setItems(inventory.map((item) => this.toViewerTarget(item)));
        this.selectEmbeddedTarget(this.toViewerTarget(target));
    }

    private get isMarketPage(): boolean {
        return window.location.pathname.startsWith('/market/');
    }

    private requestMoreItems(): void {
        if (this.itemsRequestPending || !this.active || !this.isMarketPage) return;
        this.itemsRequestPending = true;
        // Steam's own loader paginates by scrolling the grid, so the modal's scroll lock yields.
        this.modal?.suspendPageScrollLock();
        window.postMessage(
            {
                source: SKINCRAFT_VIEWER_MESSAGE_SOURCE,
                type: 'request-items',
                requestId: ++this.itemsRequestId,
            } satisfies RequestSkinCraftViewerItemsMessage,
            window.location.origin
        );
    }

    /**
     * Hands the purchase to Steam's own flow. The viewer only closes once the page confirms the
     * hand-off — a fire-and-forget close would leave a failure with no dialog and no explanation.
     */
    private handleBuyRequest(listingId: string): void {
        if (this.pendingBuyListingId) return;

        this.pendingBuyListingId = listingId;
        this.buyResultTimer = window.setTimeout(() => this.finishBuyRequest(false), BUY_RESULT_TIMEOUT_MS);
        window.postMessage(
            {
                source: SKINCRAFT_VIEWER_MESSAGE_SOURCE,
                type: 'buy-listing',
                listingId,
            } satisfies BuySkinCraftListingMessage,
            window.location.origin
        );
    }

    private handleBuyResult(message: SkinCraftBuyListingResultMessage): void {
        if (message.listingId !== this.pendingBuyListingId) return;
        this.finishBuyRequest(message.success);
    }

    private finishBuyRequest(success: boolean): void {
        if (!this.pendingBuyListingId) return;

        const listingId = this.pendingBuyListingId;
        this.clearBuyRequest();
        if (success) {
            this.close();
            return;
        }

        console.error(`CSFloat: the buy hand-off for listing ${listingId} failed.`);
        this.modal?.setBuyNotice("Steam's purchase flow couldn't be opened — the listing may no longer be available.");
    }

    private clearBuyRequest(): void {
        this.pendingBuyListingId = undefined;
        if (this.buyResultTimer === undefined) return;
        window.clearTimeout(this.buyResultTimer);
        this.buyResultTimer = undefined;
    }

    private applyItemsUpdate({requestId, inventory}: SkinCraftViewerItemsMessage): void {
        // Only the outstanding request counts: `close()` can't cancel the page's in-flight load, so
        // its answer may land in a later session, after that session's own request or none at all.
        if (!this.itemsRequestPending || requestId !== this.itemsRequestId) return;

        this.itemsRequestPending = false;
        this.modal?.resumePageScrollLock();
        if (!this.active || !this.modal) return;

        const items = inventory.map((item) => this.toViewerTarget(item));
        // A harvest only covers mounted cards; the current item may have none (a dialog deep-link)
        // and must stay in the strip or Previous/Next both disable under it.
        const current = this.activeTarget;
        if (current && !items.some((item) => this.isSameTarget(item, current))) items.unshift(current);
        // A shrunk harvest (a failed load, or the grid re-filtered underneath) never truncates the
        // items the user is navigating — the snapshot only ever grows within a session.
        if (items.length <= this.itemCount) return;

        this.itemCount = items.length;
        this.modal.setItems(items);
        // Keep filling while the user is still near the end of the loaded items.
        if (this.modal.itemsNearEnd()) this.requestMoreItems();
    }

    private isSameTarget(a: SkinCraftViewerTarget, b: SkinCraftViewerTarget): boolean {
        return (a.assetId || a.inspect) === (b.assetId || b.inspect);
    }

    private selectEmbeddedTarget(target: SkinCraftViewerTarget): void {
        const modal = this.ensureModal();
        // Switch in place only when the frame is showing a model; otherwise dropping the cover
        // would leave an empty or errored iframe on screen until the next terminal event.
        const showLoadingCover = !modal.isOpen || !this.frameHasContent;
        this.active = true;
        this.activeTarget = target;
        modal.show(this.activeTarget);
        this.requestLoad(target.inspect, showLoadingCover);
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }

    private toViewerTarget(target: SkinCraftItem): SkinCraftViewerTarget {
        return {
            ...target,
            name: target.name.trim() || 'SkinCraft 3D Viewer',
            itemUrl: `${this.embedOrigin}/i/${encodeURIComponent(target.inspect)}`,
        };
    }

    private ensureModal(): SkinCraftViewerModal {
        if (this.modal?.element.isConnected) return this.modal;

        this.ready = false;
        this.frameHasContent = false;
        const modal = new SkinCraftViewerModal({
            embedSrc: this.embedSrc,
            itemsTitle: this.isMarketPage ? 'Listings' : 'Inventory',
            layout: this.isMarketPage ? 'details' : 'grid',
            onClose: () => this.close(),
            onRetry: () => {
                if (this.activeTarget) this.requestLoad(this.activeTarget.inspect, true);
            },
            onSelect: (target) => this.selectEmbeddedTarget(target),
            onItemsNearEnd: () => this.requestMoreItems(),
            onBuy: this.isMarketPage ? (listingId) => this.handleBuyRequest(listingId) : undefined,
            onViewerKey: this.isMarketPage
                ? (action, key, code) => this.post({type: 'key', action, key, code})
                : undefined,
        });
        document.body.appendChild(modal.element);
        window.addEventListener('message', this.handleEmbedMessage);
        this.modal = modal;
        return modal;
    }

    private requestLoad(inspect: string, showLoadingCover: boolean): void {
        // A frame that let a load time out won't recover on its own — whether it never booted or
        // booted and then stopped answering. Retry and reopening would otherwise wait forever on a
        // dead iframe. Re-`src`ing boots a fresh document, so the old handshake is void: keeping
        // `ready` would send the load into an iframe that hasn't come up yet.
        if (this.needsFrameReload) {
            this.needsFrameReload = false;
            this.ready = false;
            this.frameHasContent = false;
            this.modal?.reloadFrame();
        }
        this.pendingInspect = inspect;
        this.loadProgress = null;
        this.loadPhase = 'loading';
        this.showLoadingCover = showLoadingCover;
        if (showLoadingCover) {
            this.modal?.setLoading(null);
        } else {
            this.modal?.showFrame();
        }
        this.startLoadTimeout();

        if (this.ready) {
            this.pendingInspect = undefined;
            this.sendLoad(inspect);
        }
    }

    private sendLoad(inspect: string): void {
        const id = String(++this.loadSequence);
        this.latestLoadId = id;
        this.loadProgress = null;
        this.loadPhase = 'loading';
        this.startLoadTimeout();
        this.post({type: 'load', id, inspect});
    }

    private handleEmbedMessage = (event: MessageEvent): void => {
        if (event.origin !== this.embedOrigin || event.source !== this.modal?.frameWindow) return;
        if (!isSkinCraftEmbedEvent(event.data)) return;

        const message = event.data;
        switch (message.type) {
            case 'ready': {
                // A repeat `ready` means the embed rebooted (crash or self-navigation) and lost
                // its model — reload the current item behind the cover.
                const rebooted = this.ready;
                this.ready = true;
                this.needsFrameReload = false;
                if (rebooted) this.frameHasContent = false;
                if (this.active && this.pendingInspect) {
                    const inspect = this.pendingInspect;
                    this.pendingInspect = undefined;
                    this.sendLoad(inspect);
                } else if (rebooted && this.active && this.activeTarget) {
                    this.showLoadingCover = true;
                    this.modal?.setLoading(null);
                    this.sendLoad(this.activeTarget.inspect);
                }
                break;
            }
            case 'progress': {
                if (this.loadPhase !== 'loading' || !this.acceptsLoadEvent(message.id)) return;
                this.loadProgress = mergeSkinCraftProgress(this.loadProgress, message.percent);
                if (this.showLoadingCover) this.modal?.setLoading(this.loadProgress);
                this.startLoadTimeout();
                break;
            }
            case 'loaded':
                if (!this.acceptsTerminalEvent(message.id)) return;
                this.clearLoadTimeout();
                this.loadPhase = 'loaded';
                this.showLoadingCover = false;
                this.frameHasContent = true;
                this.modal?.showFrame();
                break;
            case 'error':
                if (!this.acceptsErrorEvent(message.id)) return;
                this.clearLoadTimeout();
                this.loadPhase = 'error';
                this.showLoadingCover = false;
                this.frameHasContent = false;
                this.modal?.setError(message.message || 'SkinCraft could not load this item.');
                break;
            case 'key':
                // The embed forwards navigation keys pressed while its iframe holds focus.
                if (this.active) this.modal?.navigateByKey(message.key);
                break;
            case 'inspect-requested': {
                // A switch-in-place keeps the old model on screen while the next loads; only `loaded`
                // means the frame shows `activeTarget`.
                if (!this.active) break;

                const url = this.activeTarget?.inspectUrl;
                if (this.loadPhase === 'loaded' && url && STEAM_INSPECT_URL_PATTERN.test(url)) {
                    window.location.href = url;
                } else {
                    console.warn('CSFloat: no launchable inspect link for the item on screen.');
                }
                break;
            }
        }
    };

    // Id-less events stay accepted here because the embed's boot-time progress predates our first
    // `load` command and so carries no id.
    private acceptsLoadEvent(id?: string): boolean {
        return this.active && (!id || id === this.latestLoadId);
    }

    // Terminal events echo our load id, so they must correlate — a stale or timed-out load can't
    // dismiss newer UI.
    private isLatestLoad(id?: string): boolean {
        return this.active && id !== undefined && id === this.latestLoadId;
    }

    private acceptsTerminalEvent(id?: string): boolean {
        return (this.loadPhase === 'loading' || this.loadPhase === 'error') && this.isLatestLoad(id);
    }

    /** Unlike `loaded`, an error can also invalidate a model that already loaded (e.g. a lost GPU device). */
    private acceptsErrorEvent(id?: string): boolean {
        return this.loadPhase !== 'idle' && this.isLatestLoad(id);
    }

    private handleVisibilityChange = (): void => {
        if (!this.active) return;
        // A paused embed emits no progress, so hold the load watchdog while the tab is hidden.
        if (document.hidden) {
            this.clearLoadTimeout();
            this.post({type: 'pause'});
        } else {
            if (this.loadPhase === 'loading') this.startLoadTimeout();
            this.post({type: 'resume'});
        }
    };

    private post(command: SkinCraftEmbedCommand): void {
        this.modal?.frameWindow?.postMessage(
            {
                source: SKINCRAFT_EMBED_MESSAGE_SOURCE,
                v: SKINCRAFT_EMBED_PROTOCOL_VERSION,
                ...command,
            },
            this.embedOrigin
        );
    }

    private startLoadTimeout(): void {
        this.clearLoadTimeout();
        this.loadTimer = window.setTimeout(() => {
            if (!this.active) return;
            this.loadPhase = 'error';
            this.showLoadingCover = false;
            this.frameHasContent = false;
            // Drop the queued load and forget the in-flight id so neither a late `ready` nor a
            // late `loaded` can act under the error UI — recovery goes through the Retry button.
            this.pendingInspect = undefined;
            this.latestLoadId = undefined;
            this.needsFrameReload = true;
            this.modal?.setError('The 3D viewer took too long to load.');
        }, LOAD_TIMEOUT_MS);
    }

    private clearLoadTimeout(): void {
        if (this.loadTimer === undefined) return;
        window.clearTimeout(this.loadTimer);
        this.loadTimer = undefined;
    }
}

export const gSkinCraftEmbed = new SkinCraftEmbedService();
