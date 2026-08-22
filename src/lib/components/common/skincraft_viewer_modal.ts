import {html, nothing, render} from 'lit';
import type {TemplateResult} from 'lit';
import {classMap} from 'lit/directives/class-map.js';
import {guard} from 'lit/directives/guard.js';
import {createRef, ref} from 'lit/directives/ref.js';
import {styleMap} from 'lit/directives/style-map.js';
import type {SkinCraftListingDetails, SkinCraftViewerTarget} from '../../services/skincraft_viewer_protocol';
import {MODAL_TRANSITION_MS, skinCraftViewerModalStyles} from './skincraft_viewer_modal_styles';

type LoadPhase = 'loading' | 'revealed' | 'error';

export type SkinCraftViewerModalOptions = {
    /** URL loaded once into the persistent embed iframe. */
    embedSrc: string;
    /** Heading for the item strip, e.g. "Inventory" — the modal itself is surface-agnostic. */
    itemsTitle: string;
    /** `grid` shows the item strip; `details` swaps it for a listing-details panel with prev/next. */
    layout?: 'grid' | 'details';
    onClose: () => void;
    onRetry: () => void;
    onSelect: (target: SkinCraftViewerTarget) => void;
    /** Fired when the item strip scrolls near its end, for surfaces with paginated items. */
    onItemsNearEnd?: () => void;
    /** Enables the details panel's Buy button; the host hands off to the surface's purchase flow. */
    onBuy?: (target: SkinCraftViewerTarget) => void;
};

/** About two card rows — asking for more this early keeps strip scrolling seamless. */
const ITEMS_NEAR_END_PX = 240;

/** In details mode, prefetch the next page once selection comes within this many items of the end. */
const ITEMS_NEAR_END_COUNT = 5;

/** Full 0–1 wear range in the same bands the float bar uses. */
const WEAR_SEGMENTS = [
    {width: 7, color: 'green'},
    {width: 8, color: '#18a518'},
    {width: 23, color: '#9acd32'},
    {width: 7, color: '#cd5c5c'},
    {width: 55, color: '#f92424'},
];

function renderChevron(direction: 'left' | 'right'): TemplateResult {
    return html`
        <svg
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
        >
            <path d="${direction === 'left' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'}" />
        </svg>
    `;
}

function formatRestrictionDays(days: number): string {
    if (days === 7) return 'one week';
    if (days === 1) return 'one day';
    return `${days} days`;
}

function mixHexColors(base: string, tint: string, tintAmount: number): string {
    const mixChannel = (offset: number): number => {
        const baseChannel = Number.parseInt(base.slice(offset, offset + 2), 16);
        const tintChannel = Number.parseInt(tint.slice(offset, offset + 2), 16);
        return Math.round(baseChannel + (tintChannel - baseChannel) * tintAmount);
    };

    return `rgb(${mixChannel(0)} ${mixChannel(2)} ${mixChannel(4)})`;
}

function itemCardColors(target: SkinCraftViewerTarget): Record<string, string> {
    const base = target.backgroundColor || '2a2f3a';
    const rarity = target.rarityColor || 'c1ceff';

    return {
        '--item-card-background': target.backgroundColor ? `#${base}` : mixHexColors(base, rarity, 0.1),
        '--item-card-rarity': `#${rarity}`,
        '--item-card-hover': mixHexColors(base, rarity, 0.16),
        '--item-card-selected': mixHexColors(base, rarity, 0.26),
    };
}

function targetKey(target: SkinCraftViewerTarget): string {
    return target.assetId || target.inspect;
}

/**
 * Renders with lit-html instead of extending `FloatElement`: the content script builds this modal,
 * and Chrome leaves `customElements` null in isolated worlds, so no custom element can be defined
 * here. `render()` needs nothing but the DOM, and the embed iframe is created once and then only
 * ever diffed, so it is never re-`src`'d.
 */
export class SkinCraftViewerModal {
    readonly element = document.createElement('div');

    private readonly root: ShadowRoot;
    private readonly dialogRef = createRef<HTMLDialogElement>();
    private readonly frameRef = createRef<HTMLIFrameElement>();
    private readonly itemGridRef = createRef<HTMLDivElement>();

    private target?: SkinCraftViewerTarget;
    private items: SkinCraftViewerTarget[] = [];
    private phase: LoadPhase = 'loading';
    private progress: number | null = null;
    private errorMessage = '';
    private entering = false;
    private closing = false;
    private iconReady = false;
    private backdropPressed = false;
    private closeTimer?: number;
    private entryFrame?: number;
    private iconRequest = 0;

    constructor(private readonly options: SkinCraftViewerModalOptions) {
        // Closed so page scripts can't reach into the viewer we host on their document.
        this.root = this.element.attachShadow({mode: 'closed'});
        const style = document.createElement('style');
        style.textContent = skinCraftViewerModalStyles;
        this.root.appendChild(style);
        this.update();
    }

    get frameWindow(): Window | null {
        return this.frameRef.value?.contentWindow ?? null;
    }

    /** Re-navigates the embed after a failed boot; a cross-origin frame can't be reloaded from inside. */
    reloadFrame(): void {
        const frame = this.frameRef.value;
        if (frame) frame.src = this.options.embedSrc;
    }

    get isOpen(): boolean {
        return this.dialogRef.value?.open ?? false;
    }

    setItems(items: SkinCraftViewerTarget[]): void {
        this.items = items;
        this.update();
    }

    show(target: SkinCraftViewerTarget): void {
        this.target = target;
        this.iconReady = false;
        const request = ++this.iconRequest;

        this.cancelClose();
        const opening = !this.isOpen;
        if (opening) this.entering = true;
        this.update();

        void this.revealIconWhenDecoded(target.iconUrl, request);
        this.scrollSelectedIntoView();
        this.maybeRequestMore(this.selectedIndex);
        if (opening) this.openDialog();
    }

    hide(): void {
        if (!this.isOpen || this.closing) return;

        this.cancelEntry();
        this.entering = false;
        this.closing = true;
        this.update();
        this.closeTimer = window.setTimeout(() => this.finishClose(), MODAL_TRANSITION_MS);
    }

    setLoading(value: number | null): void {
        this.phase = 'loading';
        this.progress = value;
        this.update();
    }

    /** Reveals the embed and fades the loading cover out, whether the load just finished or is still running. */
    showFrame(): void {
        this.phase = 'revealed';
        this.update();
    }

    setError(message: string): void {
        this.phase = 'error';
        this.errorMessage = message;
        this.update();
    }

    // `host` binds `this` inside the template's @event handlers, the way LitElement does it.
    private update(): void {
        render(this.template(), this.root, {host: this});
    }

    private get layout(): 'grid' | 'details' {
        return this.options.layout ?? 'grid';
    }

    private template(): TemplateResult {
        const revealed = this.phase === 'revealed';
        const details = this.layout === 'details';

        return html`
            <dialog
                ${ref(this.dialogRef)}
                class="${classMap({
                    'has-items': !details && this.items.length > 1,
                    'has-details': details,
                    entering: this.entering,
                    closing: this.closing,
                })}"
                aria-labelledby="skincraft-viewer-title"
                @cancel="${this.handleCancel}"
                @pointerdown="${this.handleDialogPointerDown}"
                @click="${this.handleDialogClick}"
                @transitionend="${this.handleTransitionEnd}"
                @keydown="${this.handleKeydown}"
            >
                ${details ? nothing : this.renderHeader()}
                <div class="modal-body">
                    ${details ? nothing : this.renderItemPanel()}
                    <div class="viewer-stage">
                        <iframe
                            ${ref(this.frameRef)}
                            class="${revealed ? 'loaded' : ''}"
                            src="${this.options.embedSrc}"
                            title="SkinCraft 3D viewer"
                            referrerpolicy="no-referrer"
                            sandbox="allow-scripts allow-same-origin allow-downloads"
                            allow="fullscreen"
                        ></iframe>
                        <div class="loading-cover ${revealed ? 'loaded' : ''}">
                            ${this.renderLoading()}${this.renderError()}
                        </div>
                    </div>
                    ${details ? this.renderDetailsPanel() : nothing}
                </div>
            </dialog>
        `;
    }

    private renderHeader(): TemplateResult {
        return html`
            <header class="modal-header">
                <div class="modal-title" id="skincraft-viewer-title">${this.target?.name ?? ''}</div>
                <div class="modal-header-actions">
                    ${this.renderAttribution()}
                    <button
                        class="close-button"
                        type="button"
                        aria-label="Close 3D viewer"
                        @click="${this.options.onClose}"
                    >
                        ×
                    </button>
                </div>
            </header>
        `;
    }

    private renderAttribution(): TemplateResult {
        return html`
            <a
                class="skincraft-attribution"
                href="${this.target?.itemUrl ?? ''}"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open on SkinCraft"
            >
                <img
                    class="skincraft-logo-mark"
                    src="https://csfloat.com/assets/skincraft-logo-mark.svg"
                    alt=""
                    aria-hidden="true"
                />
                <span class="skincraft-wordmark">skincraft<span>.gg</span></span>
            </a>
        `;
    }

    private renderItemPanel(): TemplateResult {
        return html`
            <aside class="item-panel" aria-label="${this.options.itemsTitle}">
                <div class="item-panel-header">
                    <span>${this.options.itemsTitle}</span>
                    <span class="item-count">${this.items.length}</span>
                </div>
                <div
                    ${ref(this.itemGridRef)}
                    class="item-grid"
                    @click="${this.handleItemsClick}"
                    @scroll="${this.handleItemsScroll}"
                >
                    ${guard([this.items, this.selectedKey], () => this.renderItemCards())}
                </div>
            </aside>
        `;
    }

    private renderDetailsPanel(): TemplateResult {
        const target = this.target;
        const details = target?.details;
        const index = this.selectedIndex;

        return html`
            <aside class="details-panel" aria-label="${this.options.itemsTitle}">
                <div class="details-header">
                    ${this.renderAttribution()}
                    <button
                        class="close-button"
                        type="button"
                        aria-label="Close 3D viewer"
                        @click="${this.options.onClose}"
                    >
                        ×
                    </button>
                </div>
                <div class="details-scroll">
                    <div
                        class="details-name"
                        id="skincraft-viewer-title"
                        style="${styleMap({color: target?.rarityColor ? `#${target.rarityColor}` : undefined})}"
                    >
                        ${target?.name ?? ''}
                    </div>
                    ${details?.game || details?.type
                        ? html`<div class="details-type">
                              ${[details.game, details.type].filter(Boolean).join(' · ')}
                          </div>`
                        : nothing}
                    ${this.renderWearBar(details)} ${this.renderDetailProps(details)}
                    ${this.renderDetailActions(target, details)} ${this.renderAccessories(details)}
                    ${this.renderRestrictions(details)} ${this.renderDetailLines(details)}
                </div>
                <div class="details-footer">
                    <button
                        class="details-nav-btn"
                        type="button"
                        ?disabled="${index <= 0}"
                        @click="${this.handlePrevious}"
                    >
                        ${renderChevron('left')}
                        <span>Previous</span>
                    </button>
                    <button
                        class="details-nav-btn"
                        type="button"
                        ?disabled="${index < 0 || index >= this.items.length - 1}"
                        @click="${this.handleNext}"
                    >
                        <span>Next</span>
                        ${renderChevron('right')}
                    </button>
                </div>
            </aside>
        `;
    }

    private renderWearBar(details?: SkinCraftListingDetails): TemplateResult | typeof nothing {
        const wear = Number(details?.wearRating);
        if (!Number.isFinite(wear)) return nothing;

        const percent = (Math.min(Math.max(wear, 0), 1) * 100).toFixed(3);
        return html`
            <div class="details-wear-bar">
                <div class="details-wear-track">
                    ${WEAR_SEGMENTS.map(
                        (segment) =>
                            html`<div
                                style="${styleMap({width: `${segment.width}%`, backgroundColor: segment.color})}"
                            ></div>`
                    )}
                </div>
                <div class="details-wear-marker" style="${styleMap({left: `${percent}%`})}"></div>
            </div>
        `;
    }

    private renderDetailProps(details?: SkinCraftListingDetails): TemplateResult | typeof nothing {
        if (!details?.nameTag && !details?.patternTemplate && !details?.wearRating) return nothing;

        return html`
            <div class="details-props">
                ${details.nameTag ? html`<div>Name Tag: ${details.nameTag}</div>` : nothing}
                ${details.patternTemplate ? html`<div>Pattern Template: ${details.patternTemplate}</div>` : nothing}
                ${details.wearRating ? html`<div>Wear Rating: ${details.wearRating}</div>` : nothing}
            </div>
        `;
    }

    private renderDetailActions(
        target?: SkinCraftViewerTarget,
        details?: SkinCraftListingDetails
    ): TemplateResult | typeof nothing {
        const inspectUrl = target?.inspectUrl;
        const showBuy = !!details?.price && !!details.listingId && !!this.options.onBuy;
        if (!inspectUrl && !showBuy) return nothing;

        return html`
            <div class="details-actions">
                ${inspectUrl ? html`<a class="details-inspect" href="${inspectUrl}">Inspect in Game...</a>` : nothing}
                ${showBuy
                    ? html`
                          <span class="details-price">${details.price}</span>
                          <button class="details-buy" type="button" @click="${this.handleBuy}">Buy</button>
                      `
                    : nothing}
            </div>
        `;
    }

    private renderAccessories(details?: SkinCraftListingDetails): TemplateResult | typeof nothing {
        if (!details?.accessories?.length) return nothing;

        return html`
            <div class="details-accessories">
                <div class="details-section-title">Accessories</div>
                ${details.accessories.map(
                    (accessory) => html`
                        <div class="details-accessory">
                            ${accessory.iconUrl
                                ? html`<img src="${accessory.iconUrl}" alt="" loading="lazy" draggable="false" />`
                                : nothing}
                            <span class="details-accessory-text">
                                <span>${accessory.name}</span>
                                ${accessory.detail
                                    ? html`<span class="details-accessory-detail">${accessory.detail}</span>`
                                    : nothing}
                            </span>
                        </div>
                    `
                )}
            </div>
        `;
    }

    private renderRestrictions(details?: SkinCraftListingDetails): TemplateResult | typeof nothing {
        const restrictions: string[] = [];
        if (details?.tradeRestrictionDays) {
            restrictions.push(`will not be tradable for ${formatRestrictionDays(details.tradeRestrictionDays)}`);
        }
        if (details?.marketRestrictionDays) {
            restrictions.push(
                `cannot be listed on the Steam Community Market for ${formatRestrictionDays(
                    details.marketRestrictionDays
                )}`
            );
        }
        if (!restrictions.length) return nothing;

        return html`
            <div class="details-restrictions">
                <div>After purchase, this item:</div>
                <ul>
                    ${restrictions.map((line) => html`<li>${line}</li>`)}
                </ul>
            </div>
        `;
    }

    private renderDetailLines(details?: SkinCraftListingDetails): TemplateResult | typeof nothing {
        if (!details?.lines?.length) return nothing;

        return html`
            <div class="details-lines">
                ${details.lines.map(
                    (line) =>
                        html`<p
                            class="${line.italic ? 'italic' : ''}"
                            style="${styleMap({color: line.color ? `#${line.color}` : undefined})}"
                        >
                            ${line.text}
                        </p>`
                )}
            </div>
        `;
    }

    private get selectedKey(): string | undefined {
        return this.target ? targetKey(this.target) : undefined;
    }

    private get selectedIndex(): number {
        const key = this.selectedKey;
        if (!key) return -1;
        return this.items.findIndex((item) => targetKey(item) === key);
    }

    // Nav clicks hand focus back to the viewer: a button that kept it would re-trigger on keypress.
    private handlePrevious(): void {
        this.selectNeighbor(-1);
        this.focusViewer();
    }

    private handleNext(): void {
        this.selectNeighbor(1);
        this.focusViewer();
    }

    /** Steps the selection for a navigation hotkey; the embed forwards its keydowns through here. */
    navigateByKey(key: string): boolean {
        if (this.layout !== 'details') return false;
        if (key !== 'ArrowLeft' && key !== 'ArrowRight') return false;

        this.selectNeighbor(key === 'ArrowLeft' ? -1 : 1);
        return true;
    }

    private selectNeighbor(step: number): void {
        const index = this.selectedIndex;
        const neighbor = index >= 0 ? this.items[index + step] : undefined;
        if (!neighbor) return;

        this.maybeRequestMore(index + step);
        this.options.onSelect(neighbor);
    }

    private maybeRequestMore(index: number): void {
        if (this.layout !== 'details' || index < 0) return;
        if (this.items.length - index <= ITEMS_NEAR_END_COUNT) this.options.onItemsNearEnd?.();
    }

    private handleKeydown(event: KeyboardEvent): void {
        if (this.navigateByKey(event.key)) event.preventDefault();
    }

    private handleBuy(): void {
        if (this.target) this.options.onBuy?.(this.target);
    }

    // Both status blocks stay mounted and toggle `hidden` so the item icon survives an error →
    // retry cycle; its fade-in is driven by a decode() that needs the <img> to already exist.
    private renderLoading(): TemplateResult {
        const determinate = this.progress !== null;
        const percent = Math.round(this.progress ?? 0);

        return html`
            <div class="loading-status ${this.phase === 'error' ? 'hidden' : ''}">
                ${this.target?.iconUrl
                    ? html`<img
                          class="item-icon ${this.iconReady ? '' : 'pending'}"
                          src="${this.target.iconUrl}"
                          alt=""
                          draggable="false"
                      />`
                    : nothing}
                <div class="item-name">${this.target?.name ?? ''}</div>
                <div
                    class="progress"
                    role="progressbar"
                    aria-label="Loading 3D viewer"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-valuenow="${determinate ? percent : nothing}"
                >
                    <div class="progress-track">
                        <div class="progress-fill indeterminate ${determinate ? 'hidden' : ''}"></div>
                        <div
                            class="progress-fill determinate ${determinate ? '' : 'hidden'}"
                            style="${styleMap({width: determinate ? `${this.progress}%` : undefined})}"
                        ></div>
                    </div>
                    <span class="progress-value ${determinate ? '' : 'hidden'}"
                        >${determinate ? `${percent}%` : ''}</span
                    >
                </div>
            </div>
        `;
    }

    private renderError(): TemplateResult {
        return html`
            <div class="error-status ${this.phase === 'error' ? '' : 'hidden'}">
                <div class="error-message">${this.errorMessage}</div>
                <div class="error-actions">
                    <button type="button" @click="${this.options.onRetry}">Retry</button>
                    <a href="${this.target?.itemUrl ?? ''}" target="_blank" rel="noopener noreferrer">
                        Open on SkinCraft
                    </a>
                </div>
            </div>
        `;
    }

    private renderItemCards(): TemplateResult[] {
        const selectedKey = this.selectedKey;

        return this.items.map((target, index) => {
            const selected = targetKey(target) === selectedKey;

            return html`
                <button
                    class="item-card ${selected ? 'selected' : ''}"
                    type="button"
                    title="${target.name}"
                    data-index="${index}"
                    aria-label="View ${target.name} in 3D"
                    aria-pressed="${selected}"
                    style="${styleMap(itemCardColors(target))}"
                >
                    ${target.iconUrl
                        ? html`<img src="${target.iconUrl}" alt="" loading="lazy" decoding="async" draggable="false" />`
                        : nothing}
                    ${target.seed ? html`<span class="item-card-seed">${target.seed}</span>` : nothing}
                    ${target.float ? html`<span class="item-card-float">${target.float}</span>` : nothing}
                </button>
            `;
        });
    }

    private openDialog(): void {
        const dialog = this.dialogRef.value;
        if (!dialog || dialog.open) return;

        dialog.showModal();
        // Two frames: `entering` has to be painted before it is removed, or the transition never runs.
        this.entryFrame = requestAnimationFrame(() => {
            this.entryFrame = requestAnimationFrame(() => {
                this.entryFrame = undefined;
                this.entering = false;
                this.update();
                this.focusViewer();
            });
        });
    }

    private async revealIconWhenDecoded(iconUrl: string | undefined, request: number): Promise<void> {
        if (!iconUrl) return;

        const icon = this.root.querySelector<HTMLImageElement>('.item-icon');
        if (!icon || icon.src !== iconUrl) return;

        const decoded = await icon.decode().then(
            () => true,
            () => false
        );
        if (!decoded || request !== this.iconRequest) return;

        requestAnimationFrame(() => {
            if (request !== this.iconRequest) return;
            this.iconReady = true;
            this.update();
        });
    }

    private scrollSelectedIntoView(): void {
        const card = this.root.querySelector('.item-card.selected');
        if (card) requestAnimationFrame(() => card.scrollIntoView({block: 'nearest', inline: 'nearest'}));
    }

    private focusViewer(): void {
        this.frameRef.value?.focus({preventScroll: true});
    }

    private handleCancel(event: Event): void {
        event.preventDefault();
        this.options.onClose();
    }

    // A backdrop hit lands on the <dialog> itself with coordinates outside its rect.
    private isBackdropEvent(event: MouseEvent): boolean {
        const dialog = this.dialogRef.value;
        if (!dialog || event.target !== dialog) return false;

        const rect = dialog.getBoundingClientRect();
        return (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
        );
    }

    private handleDialogPointerDown(event: PointerEvent): void {
        this.backdropPressed = this.isBackdropEvent(event);
    }

    private handleDialogClick(event: MouseEvent): void {
        const pressed = this.backdropPressed;
        this.backdropPressed = false;
        // The press must start on the backdrop too, so a drag that merely ends there doesn't dismiss.
        if (pressed && this.isBackdropEvent(event)) this.options.onClose();
    }

    private handleTransitionEnd(event: TransitionEvent): void {
        if (event.target === this.dialogRef.value && event.propertyName === 'transform') this.finishClose();
    }

    /** Whether the item strip sits near its end — also true when it has too few items to scroll. */
    itemsNearEnd(): boolean {
        const grid = this.itemGridRef.value;
        if (!grid) return false;
        return grid.scrollTop + grid.clientHeight >= grid.scrollHeight - ITEMS_NEAR_END_PX;
    }

    private handleItemsScroll(): void {
        if (this.itemsNearEnd()) this.options.onItemsNearEnd?.();
    }

    private handleItemsClick(event: MouseEvent): void {
        const node = event.target;
        if (!(node instanceof Element)) return;

        const button = node.closest<HTMLButtonElement>('.item-card');
        const index = Number(button?.dataset.index);
        if (!button || !Number.isInteger(index)) return;

        const target = this.items[index];
        if (!target) return;

        this.options.onSelect(target);
        this.focusViewer();
    }

    private cancelEntry(): void {
        if (this.entryFrame === undefined) return;
        cancelAnimationFrame(this.entryFrame);
        this.entryFrame = undefined;
    }

    private cancelClose(): void {
        if (this.closeTimer !== undefined) {
            window.clearTimeout(this.closeTimer);
            this.closeTimer = undefined;
        }
        this.closing = false;
    }

    private finishClose(): void {
        if (!this.closing) return;

        this.cancelClose();
        this.entering = false;
        this.update();

        const dialog = this.dialogRef.value;
        if (dialog?.open) dialog.close();
    }
}
