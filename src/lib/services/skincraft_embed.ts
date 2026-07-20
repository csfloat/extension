import {environment} from '../../environment';
import {SkinCraftViewerModal} from '../components/inventory/skincraft_viewer_modal';
import type {SkinCraftViewerTarget} from '../components/inventory/skincraft_viewer_modal';
import {inPageContext} from '../utils/snips';
import {
    isSkinCraftEmbedEvent,
    mergeSkinCraftProgress,
    SKINCRAFT_EMBED_MESSAGE_SOURCE,
    SKINCRAFT_EMBED_PROTOCOL_VERSION,
} from './skincraft_embed_protocol';
import type {SkinCraftEmbedCommand} from './skincraft_embed_protocol';
import {getLoadedInventoryTargets} from './skincraft_inventory_targets';
import {isOpenSkinCraftViewerMessage, SKINCRAFT_VIEWER_MESSAGE_SOURCE} from './skincraft_viewer_protocol';
import type {OpenSkinCraftViewerMessage, OpenSkinCraftViewerTarget} from './skincraft_viewer_protocol';

const LOAD_TIMEOUT_MS = 20_000;
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

    constructor() {
        if (!this.runsInPage) window.addEventListener('message', this.handleOpenRequest);
    }

    open(target: OpenSkinCraftViewerTarget): void {
        if (!target.inspect) return;

        if (this.runsInPage) {
            window.postMessage(
                {
                    source: SKINCRAFT_VIEWER_MESSAGE_SOURCE,
                    type: 'open',
                    target,
                    inventory:
                        typeof g_ActiveInventory === 'undefined' || !g_ActiveInventory
                            ? []
                            : getLoadedInventoryTargets(g_ActiveInventory),
                } satisfies OpenSkinCraftViewerMessage,
                window.location.origin
            );
            return;
        }

        this.openEmbeddedViewer(target, []);
    }

    close(): void {
        if (!this.active) return;

        this.active = false;
        this.pendingInspect = undefined;
        this.latestLoadId = undefined;
        this.loadProgress = null;
        this.loadPhase = 'idle';
        this.showLoadingCover = false;
        this.clearLoadTimeout();
        this.post({type: 'clear'});
        this.modal?.hide();
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }

    private handleOpenRequest = (event: MessageEvent): void => {
        if (event.origin !== window.location.origin) return;
        if (!isOpenSkinCraftViewerMessage(event.data)) return;
        this.openEmbeddedViewer(event.data.target, event.data.inventory);
    };

    private openEmbeddedViewer(target: OpenSkinCraftViewerTarget, inventory: OpenSkinCraftViewerTarget[]): void {
        const modal = this.ensureModal();
        modal.setInventory(inventory.map((item) => this.toModalTarget(item)));
        this.selectEmbeddedTarget(this.toModalTarget(target));
    }

    private selectEmbeddedTarget(target: SkinCraftViewerTarget): void {
        const modal = this.ensureModal();
        const showLoadingCover = !modal.isOpen;
        this.active = true;
        this.activeTarget = target;
        modal.show(this.activeTarget);
        this.requestLoad(target.inspect, showLoadingCover);
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }

    private toModalTarget(target: OpenSkinCraftViewerTarget): SkinCraftViewerTarget {
        return {
            inspect: target.inspect,
            name: target.name.trim() || 'SkinCraft 3D Viewer',
            iconUrl: target.iconUrl,
            itemUrl: `${this.embedOrigin}/i/${encodeURIComponent(target.inspect)}`,
            assetId: target.assetId,
        };
    }

    private ensureModal(): SkinCraftViewerModal {
        if (this.modal?.element.isConnected) return this.modal;

        this.ready = false;
        const modal = new SkinCraftViewerModal(
            this.embedSrc,
            () => this.close(),
            () => {
                if (this.activeTarget) this.requestLoad(this.activeTarget.inspect, true);
            },
            (target) => this.selectEmbeddedTarget(target)
        );
        document.body.appendChild(modal.element);
        window.addEventListener('message', this.handleEmbedMessage);
        this.modal = modal;
        return modal;
    }

    private requestLoad(inspect: string, showLoadingCover: boolean): void {
        this.pendingInspect = inspect;
        this.loadProgress = null;
        this.loadPhase = 'loading';
        this.showLoadingCover = showLoadingCover;
        if (showLoadingCover) {
            this.modal?.setLoading(null);
        } else {
            this.modal?.continueLoadingInFrame();
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
                this.ready = true;
                if (this.active && this.pendingInspect) {
                    const inspect = this.pendingInspect;
                    this.pendingInspect = undefined;
                    this.sendLoad(inspect);
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
                this.modal?.setLoaded();
                break;
            case 'error':
                if (!this.acceptsTerminalEvent(message.id)) return;
                this.clearLoadTimeout();
                this.loadPhase = 'error';
                this.showLoadingCover = false;
                this.modal?.setError(message.message || 'SkinCraft could not load this item.');
                break;
        }
    };

    private acceptsLoadEvent(id?: string): boolean {
        return this.active && (!id || id === this.latestLoadId);
    }

    private acceptsTerminalEvent(id?: string): boolean {
        return (this.loadPhase === 'loading' || this.loadPhase === 'error') && this.acceptsLoadEvent(id);
    }

    private handleVisibilityChange = (): void => {
        if (!this.active) return;
        this.post({type: document.hidden ? 'pause' : 'resume'});
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
