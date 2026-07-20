export type SkinCraftViewerTarget = {
    inspect: string;
    name: string;
    iconUrl?: string;
    itemUrl: string;
    assetId?: string;
};

const MODAL_TRANSITION_MS = 200;

const MODAL_STYLES = `
    :host {
        color: #f5f8ff;
        font-family: Arial, Helvetica, sans-serif;
    }

    dialog {
        width: min(1120px, calc(100vw - 48px));
        max-width: none;
        padding: 0;
        border: 1px solid rgba(193, 206, 255, 0.12);
        border-radius: 12px;
        overflow: hidden;
        color: inherit;
        background: #15171c;
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.68);
        opacity: 1;
        transform: translateY(0) scale(1);
        transform-origin: center;
        transition:
            opacity 180ms ease,
            transform 200ms cubic-bezier(0.22, 1, 0.36, 1);
    }

    dialog::backdrop {
        background: rgba(5, 7, 12, 0.78);
        backdrop-filter: blur(6px);
        opacity: 1;
        transition:
            opacity 180ms ease,
            backdrop-filter 200ms ease;
    }

    dialog.entering,
    dialog.closing {
        opacity: 0;
        transform: translateY(10px) scale(0.97);
    }

    dialog.entering::backdrop,
    dialog.closing::backdrop {
        backdrop-filter: blur(0);
        opacity: 0;
    }

    dialog.closing {
        pointer-events: none;
    }

    .modal-body {
        min-width: 0;
    }

    .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        height: 52px;
        padding: 0 12px 0 18px;
        border-bottom: 1px solid rgba(193, 206, 255, 0.1);
        background: #1b1e25;
    }

    .modal-title {
        min-width: 0;
        overflow: hidden;
        font-size: 15px;
        font-weight: 600;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .modal-brand {
        color: rgba(245, 248, 255, 0.58);
        font-weight: 400;
    }

    .close-button {
        display: grid;
        flex: 0 0 auto;
        width: 34px;
        height: 34px;
        padding: 0;
        place-items: center;
        color: rgba(245, 248, 255, 0.72);
        font: inherit;
        font-size: 22px;
        line-height: 1;
        background: transparent;
        border: 0;
        border-radius: 8px;
        cursor: pointer;
        transition: color 150ms ease, background-color 150ms ease;
    }

    .close-button:hover {
        color: #fff;
        background: rgba(255, 255, 255, 0.09);
    }

    .inventory-panel {
        display: none;
        min-width: 0;
        min-height: 0;
        background: #181b21;
    }

    .inventory-panel-header {
        display: flex;
        flex: 0 0 auto;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 0 14px;
        color: rgba(245, 248, 255, 0.82);
        font-size: 13px;
        font-weight: 600;
    }

    .inventory-count {
        color: rgba(245, 248, 255, 0.42);
        font-size: 11px;
        font-variant-numeric: tabular-nums;
        font-weight: 500;
    }

    .inventory-grid {
        min-width: 0;
        min-height: 0;
        scrollbar-color: rgba(193, 206, 255, 0.2) transparent;
        scrollbar-width: thin;
    }

    .inventory-grid::-webkit-scrollbar {
        width: 8px;
        height: 8px;
    }

    .inventory-grid::-webkit-scrollbar-thumb {
        background: rgba(193, 206, 255, 0.2);
        border: 2px solid transparent;
        border-radius: 999px;
        background-clip: padding-box;
    }

    .inventory-card {
        position: relative;
        box-sizing: border-box;
        min-width: 0;
        padding: 5px;
        overflow: hidden;
        color: inherit;
        background-color: rgba(42, 47, 58, 0.82);
        border: 1px solid rgba(193, 206, 255, 0.08);
        border-radius: 7px;
        cursor: pointer;
        transition:
            background-color 140ms ease,
            border-color 140ms ease,
            box-shadow 140ms ease,
            transform 100ms ease;
    }

    .inventory-card:hover {
        background-color: rgba(54, 61, 76, 0.92);
        border-color: rgba(193, 206, 255, 0.22);
    }

    .inventory-card:focus-visible {
        outline: 2px solid rgba(132, 136, 255, 0.95);
        outline-offset: 1px;
    }

    .inventory-card:active {
        transform: scale(0.97);
    }

    .inventory-card.selected {
        background-color: rgba(62, 65, 134, 0.72);
        border-color: rgba(132, 136, 255, 0.9);
        box-shadow:
            0 0 0 1px rgba(81, 85, 235, 0.38),
            0 6px 18px rgba(0, 0, 0, 0.28);
    }

    .inventory-card img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
        opacity: 0.78;
        pointer-events: none;
        transition: opacity 140ms ease;
    }

    .inventory-card:hover img,
    .inventory-card.selected img {
        opacity: 1;
    }

    .viewer-stage {
        position: relative;
        aspect-ratio: 16 / 9;
        max-height: calc(100vh - 104px);
        background: #111318;
    }

    iframe {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        border: 0;
        opacity: 0;
        transition: opacity 280ms ease;
    }

    iframe.loaded {
        opacity: 1;
    }

    .loading-cover {
        position: absolute;
        inset: 0;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 16px;
        padding: 28px;
        background: radial-gradient(circle at 50% 38%, rgba(81, 85, 235, 0.16), transparent 38%), #111318;
        opacity: 1;
        transition: opacity 280ms ease;
    }

    .loading-cover.loaded {
        opacity: 0;
        pointer-events: none;
    }

    .loading-status,
    .error-status {
        display: flex;
        width: 100%;
        height: 100%;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 16px;
    }

    .item-icon {
        width: 330px;
        max-width: 58%;
        max-height: 42%;
        aspect-ratio: 330 / 192;
        object-fit: contain;
        filter: drop-shadow(0 16px 32px rgba(0, 0, 0, 0.5));
        opacity: 1;
        transition: opacity 160ms ease-out;
        user-select: none;
    }

    .item-icon.pending {
        opacity: 0;
        transition: none;
    }

    .item-name {
        max-width: 720px;
        overflow: hidden;
        color: rgba(245, 248, 255, 0.72);
        font-size: 15px;
        font-weight: 600;
        text-align: center;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .progress {
        display: flex;
        align-items: center;
        gap: 10px;
        width: min(320px, 64%);
        min-height: 18px;
    }

    .progress-track {
        position: relative;
        flex: 1;
        height: 4px;
        overflow: hidden;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.13);
    }

    .progress-fill {
        position: absolute;
        inset-block: 0;
        left: 0;
        border-radius: inherit;
        background: #5155eb;
        box-shadow: 0 0 10px rgba(81, 85, 235, 0.58);
    }

    .progress-fill.determinate {
        width: 0;
    }

    .progress-fill.indeterminate {
        width: 38%;
        animation: progress-sweep 1.15s ease-in-out infinite;
    }

    .progress-value {
        width: 4ch;
        color: rgba(245, 248, 255, 0.56);
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 12px;
        font-variant-numeric: tabular-nums;
        text-align: right;
    }

    .error-message {
        max-width: 560px;
        color: #ff8585;
        font-size: 14px;
        line-height: 1.45;
        text-align: center;
    }

    .error-actions {
        display: flex;
        gap: 10px;
    }

    .error-actions button,
    .error-actions a {
        padding: 9px 13px;
        color: #f5f8ff;
        font: inherit;
        font-size: 13px;
        text-decoration: none;
        background: #5155eb;
        border: 0;
        border-radius: 7px;
        cursor: pointer;
    }

    .error-actions a {
        background: rgba(255, 255, 255, 0.1);
    }

    .hidden {
        display: none !important;
    }

    @keyframes progress-sweep {
        from { transform: translateX(-120%); }
        to { transform: translateX(320%); }
    }

    @media (min-width: 1168px) and (max-width: 1519px) and (min-height: 840px) {
        dialog.has-inventory {
            width: 1120px;
        }

        dialog.has-inventory .modal-body {
            display: grid;
            grid-template-rows: 122px auto;
        }

        dialog.has-inventory .inventory-panel {
            display: grid;
            grid-template-columns: 122px minmax(0, 1fr);
            border-bottom: 1px solid rgba(193, 206, 255, 0.1);
        }

        dialog.has-inventory .inventory-panel-header {
            border-right: 1px solid rgba(193, 206, 255, 0.08);
        }

        dialog.has-inventory .inventory-grid {
            display: flex;
            gap: 8px;
            padding: 11px;
            overflow-x: auto;
            overflow-y: hidden;
        }

        dialog.has-inventory .inventory-card {
            flex: 0 0 98px;
            height: 98px;
        }
    }

    @media (min-width: 1520px) {
        dialog.has-inventory {
            width: min(1440px, calc(100vw - 48px));
        }

        dialog.has-inventory .modal-body {
            display: grid;
            grid-template-columns: minmax(280px, 320px) 1120px;
        }

        dialog.has-inventory .inventory-panel {
            display: flex;
            flex-direction: column;
            height: min(630px, calc(100vh - 104px));
            border-right: 1px solid rgba(193, 206, 255, 0.1);
        }

        dialog.has-inventory .inventory-panel-header {
            height: 48px;
            border-bottom: 1px solid rgba(193, 206, 255, 0.08);
        }

        dialog.has-inventory .inventory-grid {
            display: grid;
            flex: 1;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            grid-auto-rows: 92px;
            align-content: start;
            gap: 8px;
            padding: 10px;
            overflow-x: hidden;
            overflow-y: auto;
        }

        dialog.has-inventory .inventory-card {
            height: 92px;
        }

        dialog.has-inventory .viewer-stage {
            width: 1120px;
        }
    }

    @media (max-width: 640px) {
        dialog {
            width: calc(100vw - 20px);
        }

        .modal-header {
            height: 46px;
            padding-left: 12px;
        }

        .modal-brand {
            display: none;
        }

        .viewer-stage {
            max-height: calc(100vh - 70px);
        }
    }
`;

function createElement<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string): HTMLElementTagNameMap[K] {
    const element = document.createElement(tag);
    if (className) element.className = className;
    return element;
}

export class SkinCraftViewerModal {
    readonly element = document.createElement('div');

    private readonly dialog = document.createElement('dialog');
    private readonly title = createElement('span');
    private readonly iframe = document.createElement('iframe');
    private readonly loadingCover = createElement('div', 'loading-cover');
    private readonly loadingStatus = createElement('div', 'loading-status');
    private readonly itemIcon = createElement('img', 'item-icon');
    private readonly itemName = createElement('div', 'item-name');
    private readonly indeterminateProgress = createElement('div', 'progress-fill indeterminate');
    private readonly determinateProgress = createElement('div', 'progress-fill determinate hidden');
    private readonly progressValue = createElement('span', 'progress-value hidden');
    private readonly progress = createElement('div', 'progress');
    private readonly errorStatus = createElement('div', 'error-status hidden');
    private readonly errorMessage = createElement('div', 'error-message');
    private readonly itemLink = createElement('a');
    private readonly inventoryCount = createElement('span', 'inventory-count');
    private readonly inventoryGrid = createElement('div', 'inventory-grid');
    private readonly inventoryButtons = new Map<string, HTMLButtonElement>();
    private inventoryTargets: SkinCraftViewerTarget[] = [];
    private activeInventoryButton?: HTMLButtonElement;
    private entryFrame?: number;
    private closeTimer?: number;
    private iconRequest = 0;

    constructor(
        embedSrc: string,
        private readonly onClose: () => void,
        private readonly onRetry: () => void,
        private readonly onSelect: (target: SkinCraftViewerTarget) => void
    ) {
        const shadow = this.element.attachShadow({mode: 'closed'});
        const style = document.createElement('style');
        style.textContent = MODAL_STYLES;
        shadow.appendChild(style);

        this.dialog.setAttribute('aria-labelledby', 'skincraft-viewer-title');
        this.dialog.addEventListener('cancel', (event) => {
            event.preventDefault();
            this.onClose();
        });
        this.dialog.addEventListener('click', (event) => this.handleDialogClick(event));
        this.dialog.addEventListener('transitionend', (event) => {
            if (event.target === this.dialog && event.propertyName === 'transform') this.finishClose();
        });

        const header = createElement('header', 'modal-header');
        const titleContainer = createElement('div', 'modal-title');
        titleContainer.id = 'skincraft-viewer-title';
        const brand = createElement('span', 'modal-brand');
        brand.textContent = ' — SkinCraft 3D Viewer';
        titleContainer.append(this.title, brand);

        const closeButton = createElement('button', 'close-button');
        closeButton.type = 'button';
        closeButton.setAttribute('aria-label', 'Close 3D viewer');
        closeButton.textContent = '×';
        closeButton.addEventListener('click', this.onClose);
        header.append(titleContainer, closeButton);

        const inventoryPanel = createElement('aside', 'inventory-panel');
        inventoryPanel.setAttribute('aria-label', 'Loaded inventory items');
        const inventoryHeader = createElement('div', 'inventory-panel-header');
        const inventoryLabel = createElement('span');
        inventoryLabel.textContent = 'Inventory';
        inventoryHeader.append(inventoryLabel, this.inventoryCount);
        inventoryPanel.append(inventoryHeader, this.inventoryGrid);
        this.inventoryGrid.addEventListener('click', (event) => this.handleInventoryClick(event));

        const stage = createElement('div', 'viewer-stage');
        this.iframe.src = embedSrc;
        this.iframe.title = 'SkinCraft 3D viewer';
        this.iframe.referrerPolicy = 'no-referrer';
        this.iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-downloads');
        this.iframe.setAttribute('allow', 'fullscreen');

        this.itemIcon.alt = '';
        this.itemIcon.draggable = false;
        this.loadingStatus.append(this.itemIcon, this.itemName, this.progress);

        this.progress.setAttribute('role', 'progressbar');
        this.progress.setAttribute('aria-label', 'Loading 3D viewer');
        this.progress.setAttribute('aria-valuemin', '0');
        this.progress.setAttribute('aria-valuemax', '100');
        const progressTrack = createElement('div', 'progress-track');
        progressTrack.append(this.indeterminateProgress, this.determinateProgress);
        this.progress.append(progressTrack, this.progressValue);

        const errorActions = createElement('div', 'error-actions');
        const retryButton = createElement('button');
        retryButton.type = 'button';
        retryButton.textContent = 'Retry';
        retryButton.addEventListener('click', this.onRetry);
        this.itemLink.target = '_blank';
        this.itemLink.rel = 'noopener noreferrer';
        this.itemLink.textContent = 'Open on SkinCraft';
        errorActions.append(retryButton, this.itemLink);
        this.errorStatus.append(this.errorMessage, errorActions);

        this.loadingCover.append(this.loadingStatus, this.errorStatus);
        stage.append(this.iframe, this.loadingCover);
        const modalBody = createElement('div', 'modal-body');
        modalBody.append(inventoryPanel, stage);
        this.dialog.append(header, modalBody);
        shadow.appendChild(this.dialog);
    }

    get frameWindow(): Window | null {
        return this.iframe.contentWindow;
    }

    get isOpen(): boolean {
        return this.dialog.open;
    }

    setInventory(targets: SkinCraftViewerTarget[]): void {
        this.inventoryTargets = targets;
        this.inventoryButtons.clear();
        this.activeInventoryButton = undefined;
        const fragment = document.createDocumentFragment();

        for (const [index, target] of targets.entries()) {
            const button = createElement('button', 'inventory-card');
            button.type = 'button';
            button.title = target.name;
            button.dataset.index = String(index);
            button.setAttribute('aria-label', `View ${target.name} in 3D`);
            button.setAttribute('aria-pressed', 'false');

            if (target.iconUrl) {
                const icon = createElement('img');
                icon.src = target.iconUrl;
                icon.alt = '';
                icon.loading = 'lazy';
                icon.decoding = 'async';
                icon.draggable = false;
                button.appendChild(icon);
            }

            this.inventoryButtons.set(this.getTargetKey(target), button);
            fragment.appendChild(button);
        }

        this.inventoryGrid.replaceChildren(fragment);
        this.inventoryCount.textContent = String(targets.length);
        this.dialog.classList.toggle('has-inventory', targets.length > 1);
    }

    show(target: SkinCraftViewerTarget): void {
        this.title.textContent = target.name;
        this.itemName.textContent = target.name;
        this.itemLink.href = target.itemUrl;
        this.setItemIcon(target.iconUrl);
        this.setActiveInventoryItem(target);

        this.cancelClose();

        if (!this.dialog.open) {
            this.dialog.classList.add('entering');
            this.dialog.showModal();
            this.entryFrame = requestAnimationFrame(() => {
                this.entryFrame = requestAnimationFrame(() => {
                    this.entryFrame = undefined;
                    this.dialog.classList.remove('entering');
                    this.iframe.focus({preventScroll: true});
                });
            });
        }
    }

    hide(): void {
        if (!this.dialog.open || this.dialog.classList.contains('closing')) return;

        this.cancelEntry();
        this.dialog.classList.remove('entering');
        this.dialog.classList.add('closing');
        this.closeTimer = window.setTimeout(() => this.finishClose(), MODAL_TRANSITION_MS);
    }

    setLoading(value: number | null): void {
        this.iframe.classList.remove('loaded');
        this.loadingCover.classList.remove('loaded');
        this.loadingStatus.classList.remove('hidden');
        this.errorStatus.classList.add('hidden');

        if (value === null) {
            this.progress.removeAttribute('aria-valuenow');
            this.indeterminateProgress.classList.remove('hidden');
            this.determinateProgress.classList.add('hidden');
            this.progressValue.classList.add('hidden');
            return;
        }

        const displayValue = Math.round(value);
        this.progress.setAttribute('aria-valuenow', String(displayValue));
        this.indeterminateProgress.classList.add('hidden');
        this.determinateProgress.classList.remove('hidden');
        this.determinateProgress.style.width = `${value}%`;
        this.progressValue.textContent = `${displayValue}%`;
        this.progressValue.classList.remove('hidden');
    }

    setLoaded(): void {
        this.iframe.classList.add('loaded');
        this.loadingCover.classList.add('loaded');
    }

    continueLoadingInFrame(): void {
        this.iframe.classList.add('loaded');
        this.loadingCover.classList.add('loaded');
    }

    setError(message: string): void {
        this.iframe.classList.remove('loaded');
        this.loadingCover.classList.remove('loaded');
        this.loadingStatus.classList.add('hidden');
        this.errorStatus.classList.remove('hidden');
        this.errorMessage.textContent = message;
    }

    private handleDialogClick(event: MouseEvent): void {
        if (event.target !== this.dialog) return;

        const rect = this.dialog.getBoundingClientRect();
        const inside =
            event.clientX >= rect.left &&
            event.clientX <= rect.right &&
            event.clientY >= rect.top &&
            event.clientY <= rect.bottom;
        if (!inside) this.onClose();
    }

    private handleInventoryClick(event: MouseEvent): void {
        const target = event.target;
        if (!(target instanceof Element)) return;

        const button = target.closest<HTMLButtonElement>('.inventory-card');
        const index = Number(button?.dataset.index);
        if (!button || !Number.isInteger(index)) return;

        const inventoryTarget = this.inventoryTargets[index];
        if (inventoryTarget) this.onSelect(inventoryTarget);
    }

    private setItemIcon(iconUrl?: string): void {
        const request = ++this.iconRequest;
        this.itemIcon.classList.add('pending');

        if (!iconUrl) {
            this.itemIcon.removeAttribute('src');
            this.itemIcon.classList.add('hidden');
            return;
        }

        this.itemIcon.classList.remove('hidden');
        this.itemIcon.src = iconUrl;
        void this.itemIcon
            .decode()
            .then(() => {
                if (request !== this.iconRequest || this.itemIcon.src !== iconUrl) return;
                requestAnimationFrame(() => {
                    if (request === this.iconRequest) this.itemIcon.classList.remove('pending');
                });
            })
            .catch(() => undefined);
    }

    private getTargetKey(target: SkinCraftViewerTarget): string {
        return target.assetId || target.inspect;
    }

    private setActiveInventoryItem(target: SkinCraftViewerTarget): void {
        this.activeInventoryButton?.classList.remove('selected');
        this.activeInventoryButton?.setAttribute('aria-pressed', 'false');

        const button = this.inventoryButtons.get(this.getTargetKey(target));
        if (!button) {
            this.activeInventoryButton = undefined;
            return;
        }

        button.classList.add('selected');
        button.setAttribute('aria-pressed', 'true');
        this.activeInventoryButton = button;
        requestAnimationFrame(() => button.scrollIntoView({block: 'nearest', inline: 'nearest'}));
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
        this.dialog.classList.remove('closing');
    }

    private finishClose(): void {
        if (!this.dialog.classList.contains('closing')) return;

        this.cancelClose();
        this.dialog.classList.remove('entering');
        if (this.dialog.open) this.dialog.close();
    }
}
