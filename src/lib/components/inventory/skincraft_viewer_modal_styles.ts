/** Mirrors the longest `dialog` transition below; keep the two in sync. */
export const MODAL_TRANSITION_MS = 200;

export const skinCraftViewerModalStyles = `
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
        background-color: var(--inventory-card-background, #2a2f3a);
        border: 1px solid var(--inventory-card-rarity, rgba(193, 206, 255, 0.18));
        border-radius: 7px;
        cursor: pointer;
        transition:
            background-color 140ms ease,
            border-color 140ms ease,
            box-shadow 140ms ease,
            transform 100ms ease;
    }

    .inventory-card:hover {
        background-color: var(--inventory-card-hover, #363d4c);
    }

    .inventory-card:focus-visible {
        outline: 2px solid rgba(132, 136, 255, 0.95);
        outline-offset: 1px;
    }

    .inventory-card:active {
        transform: scale(0.97);
    }

    .inventory-card.selected {
        background-color: var(--inventory-card-selected, #3e4186);
        box-shadow:
            0 0 0 2px rgba(132, 136, 255, 0.92),
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

    .inventory-card-seed,
    .inventory-card-float {
        position: absolute;
        right: 5px;
        z-index: 1;
        max-width: calc(100% - 10px);
        overflow: hidden;
        color: rgba(225, 230, 239, 0.66);
        font-family: Arial, Helvetica, sans-serif;
        font-size: 11px;
        font-variant-numeric: tabular-nums;
        line-height: 1;
        text-overflow: ellipsis;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.9);
        white-space: nowrap;
        pointer-events: none;
    }

    .inventory-card-seed {
        top: 5px;
    }

    .inventory-card-float {
        bottom: 5px;
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
