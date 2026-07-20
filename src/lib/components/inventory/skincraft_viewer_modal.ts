export type SkinCraftViewerTarget = {
    inspect: string;
    name: string;
    iconUrl?: string;
    itemUrl: string;
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
    private entryFrame?: number;
    private closeTimer?: number;
    private iconRequest = 0;

    constructor(
        embedSrc: string,
        private readonly onClose: () => void,
        private readonly onRetry: () => void
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
        this.dialog.append(header, stage);
        shadow.appendChild(this.dialog);
    }

    get frameWindow(): Window | null {
        return this.iframe.contentWindow;
    }

    show(target: SkinCraftViewerTarget): void {
        this.title.textContent = target.name;
        this.itemName.textContent = target.name;
        this.itemLink.href = target.itemUrl;
        this.setItemIcon(target.iconUrl);

        this.setLoading(null);
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
            return;
        }

        requestAnimationFrame(() => this.iframe.focus({preventScroll: true}));
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
        requestAnimationFrame(() => this.iframe.focus({preventScroll: true}));
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
