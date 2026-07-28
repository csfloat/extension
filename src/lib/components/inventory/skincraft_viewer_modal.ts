import {html, nothing, render} from 'lit';
import type {TemplateResult} from 'lit';
import {classMap} from 'lit/directives/class-map.js';
import {guard} from 'lit/directives/guard.js';
import {createRef, ref} from 'lit/directives/ref.js';
import {styleMap} from 'lit/directives/style-map.js';
import type {SkinCraftViewerTarget} from '../../services/skincraft_viewer_protocol';
import {MODAL_TRANSITION_MS, skinCraftViewerModalStyles} from './skincraft_viewer_modal_styles';

type LoadPhase = 'loading' | 'revealed' | 'error';

function mixHexColors(base: string, tint: string, tintAmount: number): string {
    const mixChannel = (offset: number): number => {
        const baseChannel = Number.parseInt(base.slice(offset, offset + 2), 16);
        const tintChannel = Number.parseInt(tint.slice(offset, offset + 2), 16);
        return Math.round(baseChannel + (tintChannel - baseChannel) * tintAmount);
    };

    return `rgb(${mixChannel(0)} ${mixChannel(2)} ${mixChannel(4)})`;
}

function inventoryCardColors(target: SkinCraftViewerTarget): Record<string, string> {
    const base = target.backgroundColor || '2a2f3a';
    const rarity = target.rarityColor || 'c1ceff';

    return {
        '--inventory-card-background': target.backgroundColor ? `#${base}` : mixHexColors(base, rarity, 0.1),
        '--inventory-card-rarity': `#${rarity}`,
        '--inventory-card-hover': mixHexColors(base, rarity, 0.16),
        '--inventory-card-selected': mixHexColors(base, rarity, 0.26),
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

    private target?: SkinCraftViewerTarget;
    private inventoryTargets: SkinCraftViewerTarget[] = [];
    private phase: LoadPhase = 'loading';
    private progress: number | null = null;
    private errorMessage = '';
    private entering = false;
    private closing = false;
    private iconReady = false;
    private closeTimer?: number;
    private entryFrame?: number;
    private iconRequest = 0;

    constructor(
        private readonly embedSrc: string,
        private readonly onClose: () => void,
        private readonly onRetry: () => void,
        private readonly onSelect: (target: SkinCraftViewerTarget) => void
    ) {
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

    get isOpen(): boolean {
        return this.dialogRef.value?.open ?? false;
    }

    setInventory(targets: SkinCraftViewerTarget[]): void {
        this.inventoryTargets = targets;
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

    private template(): TemplateResult {
        const revealed = this.phase !== 'loading';

        return html`
            <dialog
                ${ref(this.dialogRef)}
                class="${classMap({
                    'has-inventory': this.inventoryTargets.length > 1,
                    entering: this.entering,
                    closing: this.closing,
                })}"
                aria-labelledby="skincraft-viewer-title"
                @cancel="${this.handleCancel}"
                @click="${this.handleDialogClick}"
                @transitionend="${this.handleTransitionEnd}"
            >
                <header class="modal-header">
                    <div class="modal-title" id="skincraft-viewer-title">
                        <span>${this.target?.name ?? ''}</span>
                        <span class="modal-brand"> — SkinCraft 3D Viewer</span>
                    </div>
                    <button class="close-button" type="button" aria-label="Close 3D viewer" @click="${this.onClose}">
                        ×
                    </button>
                </header>
                <div class="modal-body">
                    <aside class="inventory-panel" aria-label="Loaded inventory items">
                        <div class="inventory-panel-header">
                            <span>Inventory</span>
                            <span class="inventory-count">${this.inventoryTargets.length}</span>
                        </div>
                        <div class="inventory-grid" @click="${this.handleInventoryClick}">
                            ${guard([this.inventoryTargets, this.selectedKey], () => this.renderInventoryCards())}
                        </div>
                    </aside>
                    <div class="viewer-stage">
                        <iframe
                            ${ref(this.frameRef)}
                            class="${revealed ? 'loaded' : ''}"
                            src="${this.embedSrc}"
                            title="SkinCraft 3D viewer"
                            referrerpolicy="no-referrer"
                            sandbox="allow-scripts allow-same-origin allow-downloads"
                            allow="fullscreen"
                        ></iframe>
                        <div class="loading-cover ${revealed ? 'loaded' : ''}">
                            ${this.renderLoading()}${this.renderError()}
                        </div>
                    </div>
                </div>
            </dialog>
        `;
    }

    private get selectedKey(): string | undefined {
        return this.target ? targetKey(this.target) : undefined;
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
                    <button type="button" @click="${this.onRetry}">Retry</button>
                    <a href="${this.target?.itemUrl ?? ''}" target="_blank" rel="noopener noreferrer">
                        Open on SkinCraft
                    </a>
                </div>
            </div>
        `;
    }

    private renderInventoryCards(): TemplateResult[] {
        const selectedKey = this.selectedKey;

        return this.inventoryTargets.map((target, index) => {
            const selected = targetKey(target) === selectedKey;

            return html`
                <button
                    class="inventory-card ${selected ? 'selected' : ''}"
                    type="button"
                    title="${target.name}"
                    data-index="${index}"
                    aria-label="View ${target.name} in 3D"
                    aria-pressed="${selected}"
                    style="${styleMap(inventoryCardColors(target))}"
                >
                    ${target.iconUrl
                        ? html`<img src="${target.iconUrl}" alt="" loading="lazy" decoding="async" draggable="false" />`
                        : nothing}
                    ${target.seed ? html`<span class="inventory-card-seed">${target.seed}</span>` : nothing}
                    ${target.float ? html`<span class="inventory-card-float">${target.float}</span>` : nothing}
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
        const card = this.root.querySelector('.inventory-card.selected');
        if (card) requestAnimationFrame(() => card.scrollIntoView({block: 'nearest', inline: 'nearest'}));
    }

    private focusViewer(): void {
        this.frameRef.value?.focus({preventScroll: true});
    }

    private handleCancel(event: Event): void {
        event.preventDefault();
        this.onClose();
    }

    private handleDialogClick(event: MouseEvent): void {
        const dialog = this.dialogRef.value;
        if (!dialog || event.target !== dialog) return;

        const rect = dialog.getBoundingClientRect();
        const inside =
            event.clientX >= rect.left &&
            event.clientX <= rect.right &&
            event.clientY >= rect.top &&
            event.clientY <= rect.bottom;
        if (!inside) this.onClose();
    }

    private handleTransitionEnd(event: TransitionEvent): void {
        if (event.target === this.dialogRef.value && event.propertyName === 'transform') this.finishClose();
    }

    private handleInventoryClick(event: MouseEvent): void {
        const node = event.target;
        if (!(node instanceof Element)) return;

        const button = node.closest<HTMLButtonElement>('.inventory-card');
        const index = Number(button?.dataset.index);
        if (!button || !Number.isInteger(index)) return;

        const target = this.inventoryTargets[index];
        if (!target) return;

        this.onSelect(target);
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
