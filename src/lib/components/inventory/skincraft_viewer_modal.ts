import type {SkinCraftViewerTarget} from '../../services/skincraft_viewer_protocol';
import {MODAL_TRANSITION_MS, skinCraftViewerModalStyles} from './skincraft_viewer_modal_styles';

function createElement<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string): HTMLElementTagNameMap[K] {
    const element = document.createElement(tag);
    if (className) element.className = className;
    return element;
}

function mixHexColors(base: string, tint: string, tintAmount: number): string {
    const mixChannel = (offset: number): number => {
        const baseChannel = Number.parseInt(base.slice(offset, offset + 2), 16);
        const tintChannel = Number.parseInt(tint.slice(offset, offset + 2), 16);
        return Math.round(baseChannel + (tintChannel - baseChannel) * tintAmount);
    };

    return `rgb(${mixChannel(0)} ${mixChannel(2)} ${mixChannel(4)})`;
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
        style.textContent = skinCraftViewerModalStyles;
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
            this.setInventoryCardColors(button, target);

            if (target.iconUrl) {
                const icon = createElement('img');
                icon.src = target.iconUrl;
                icon.alt = '';
                icon.loading = 'lazy';
                icon.decoding = 'async';
                icon.draggable = false;
                button.appendChild(icon);
            }

            if (target.seed) {
                const seed = createElement('span', 'inventory-card-seed');
                seed.textContent = target.seed;
                button.appendChild(seed);
            }

            if (target.float) {
                const float = createElement('span', 'inventory-card-float');
                float.textContent = target.float;
                button.appendChild(float);
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
            // Two frames: `entering` has to be painted before it is removed, or the transition never runs.
            this.entryFrame = requestAnimationFrame(() => {
                this.entryFrame = requestAnimationFrame(() => {
                    this.entryFrame = undefined;
                    this.dialog.classList.remove('entering');
                    this.focusViewer();
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

    /** Reveals the embed and fades the loading cover out, whether the load just finished or is still running. */
    showFrame(): void {
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
        if (!inventoryTarget) return;

        this.onSelect(inventoryTarget);
        this.focusViewer();
    }

    private focusViewer(): void {
        this.iframe.focus({preventScroll: true});
    }

    private setInventoryCardColors(button: HTMLButtonElement, target: SkinCraftViewerTarget): void {
        const base = target.backgroundColor || '2a2f3a';
        const rarity = target.rarityColor || 'c1ceff';
        const background = target.backgroundColor ? `#${base}` : mixHexColors(base, rarity, 0.1);
        button.style.setProperty('--inventory-card-background', background);
        button.style.setProperty('--inventory-card-rarity', `#${rarity}`);
        button.style.setProperty('--inventory-card-hover', mixHexColors(base, rarity, 0.16));
        button.style.setProperty('--inventory-card-selected', mixHexColors(base, rarity, 0.26));
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
