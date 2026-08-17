export const SKINCRAFT_EMBED_MESSAGE_SOURCE = 'skincraft-embed' as const;
export const SKINCRAFT_EMBED_PROTOCOL_VERSION = 1 as const;

type EmbedEnvelope = {
    source: typeof SKINCRAFT_EMBED_MESSAGE_SOURCE;
    v: typeof SKINCRAFT_EMBED_PROTOCOL_VERSION;
};

export type SkinCraftEmbedCommand =
    | {type: 'load'; id: string; inspect: string}
    | {type: 'pause'}
    | {type: 'resume'}
    | {type: 'clear'};

export type SkinCraftEmbedEvent = EmbedEnvelope &
    (
        | {type: 'ready'}
        | {type: 'progress'; id?: string; percent: number | null; label?: string}
        | {type: 'loaded'; id?: string}
        | {type: 'error'; id?: string; code: string; message: string}
        // Inspect click forwarded out of the sandboxed iframe (it can't launch
        // steam:// itself); we launch the shown item's own inspect link.
        | {type: 'inspect-requested'}
    );

export function isSkinCraftEmbedEvent(data: unknown): data is SkinCraftEmbedEvent {
    if (!data || typeof data !== 'object') return false;

    const message = data as Partial<EmbedEnvelope> & Record<string, unknown>;
    if (
        message.source !== SKINCRAFT_EMBED_MESSAGE_SOURCE ||
        message.v !== SKINCRAFT_EMBED_PROTOCOL_VERSION ||
        typeof message.type !== 'string'
    ) {
        return false;
    }

    const hasValidId = message.id === undefined || typeof message.id === 'string';
    switch (message.type) {
        case 'ready':
        case 'inspect-requested':
            return true;
        case 'progress':
            return hasValidId && (message.label === undefined || typeof message.label === 'string');
        case 'loaded':
            return hasValidId;
        case 'error':
            return hasValidId && typeof message.code === 'string' && typeof message.message === 'string';
        default:
            return false;
    }
}

export function normalizeSkinCraftProgress(value: unknown): number | null {
    if (typeof value !== 'number' || !Number.isFinite(value)) return null;
    return Math.max(0, Math.min(100, Math.round(value)));
}

export function mergeSkinCraftProgress(current: number | null, incoming: unknown): number | null {
    const normalized = normalizeSkinCraftProgress(incoming);
    if (normalized === null) return current;
    return current === null ? normalized : Math.max(current, normalized);
}
