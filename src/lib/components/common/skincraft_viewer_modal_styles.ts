/** Mirrors the longest `dialog` transition below; keep the two in sync. */
export const MODAL_TRANSITION_MS = 200;

export const skinCraftViewerModalStyles = `
    :host {
        color: #f5f8ff;
        font-family: Arial, Helvetica, sans-serif;
    }

    /* Width follows the viewport; the height-derived term caps the 16:9 stage at 80vh so the
       composition scales with the screen. The 1920px ceiling is the stage's native resolution —
       past it 4K+ displays only upscale. */
    dialog {
        width: min(90vw, calc(80vh * 16 / 9), 1920px);
        width: min(90vw, calc(80dvh * 16 / 9), 1920px);
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

    .modal-header-actions {
        display: flex;
        flex: 0 0 auto;
        align-items: center;
        gap: 12px;
    }

    .skincraft-attribution {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        color: inherit;
        text-decoration: none;
        opacity: 0.88;
        transition: opacity 150ms ease;
    }

    .skincraft-attribution:hover {
        opacity: 1;
    }

    .skincraft-attribution:focus-visible {
        border-radius: 4px;
        outline: 2px solid rgba(132, 136, 255, 0.95);
        outline-offset: 2px;
    }

    .skincraft-logo-mark {
        display: block;
        width: 19px;
        height: 19px;
    }

    .skincraft-wordmark {
        font-size: 13px;
        font-weight: 700;
        line-height: 1;
        white-space: nowrap;
    }

    .skincraft-wordmark span {
        color: #7769f2;
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

    .item-panel {
        display: none;
        min-width: 0;
        min-height: 0;
        background: #181b21;
    }

    .item-panel-header {
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

    .item-count {
        color: rgba(245, 248, 255, 0.42);
        font-size: 11px;
        font-variant-numeric: tabular-nums;
        font-weight: 500;
    }

    .item-grid {
        min-width: 0;
        min-height: 0;
        scrollbar-color: rgba(193, 206, 255, 0.2) transparent;
        scrollbar-width: thin;
    }

    .item-grid::-webkit-scrollbar {
        width: 8px;
        height: 8px;
    }

    .item-grid::-webkit-scrollbar-thumb {
        background: rgba(193, 206, 255, 0.2);
        border: 2px solid transparent;
        border-radius: 999px;
        background-clip: padding-box;
    }

    .item-card {
        position: relative;
        box-sizing: border-box;
        min-width: 0;
        padding: 5px;
        overflow: hidden;
        color: inherit;
        background-color: var(--item-card-background, #2a2f3a);
        border: 1px solid var(--item-card-rarity, rgba(193, 206, 255, 0.18));
        border-radius: 7px;
        cursor: pointer;
        transition:
            background-color 140ms ease,
            border-color 140ms ease,
            box-shadow 140ms ease,
            transform 100ms ease;
    }

    .item-card:hover {
        background-color: var(--item-card-hover, #363d4c);
    }

    .item-card:focus-visible {
        outline: 2px solid rgba(132, 136, 255, 0.95);
        outline-offset: 1px;
    }

    .item-card:active {
        transform: scale(0.97);
    }

    .item-card.selected {
        background-color: var(--item-card-selected, #3e4186);
        box-shadow:
            0 0 0 2px rgba(132, 136, 255, 0.92),
            0 6px 18px rgba(0, 0, 0, 0.28);
    }

    .item-card img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
        opacity: 0.78;
        pointer-events: none;
        transition: opacity 140ms ease;
    }

    .item-card:hover img,
    .item-card.selected img {
        opacity: 1;
    }

    .item-card-seed,
    .item-card-float {
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

    .item-card-seed {
        top: 5px;
    }

    .item-card-float {
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

    .details-panel {
        display: flex;
        flex-direction: column;
        min-width: 0;
        min-height: 0;
        background: #181b21;
    }

    .details-header {
        display: flex;
        flex: 0 0 auto;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        height: 48px;
        padding: 0 10px 0 16px;
        border-bottom: 1px solid rgba(193, 206, 255, 0.08);
    }

    .details-nav-btn {
        display: inline-flex;
        flex: 1;
        align-items: center;
        justify-content: center;
        gap: 6px;
        height: 36px;
        padding: 0 12px;
        color: rgba(245, 248, 255, 0.85);
        font: inherit;
        font-size: 13px;
        font-weight: 600;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(193, 206, 255, 0.12);
        border-radius: 8px;
        cursor: pointer;
        transition: color 150ms ease, background-color 150ms ease, border-color 150ms ease;
    }

    .details-nav-btn svg {
        flex: 0 0 auto;
        opacity: 0.65;
        transition: opacity 150ms ease;
    }

    .details-nav-btn:hover:not(:disabled) {
        color: #fff;
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(193, 206, 255, 0.24);
    }

    .details-nav-btn:hover:not(:disabled) svg {
        opacity: 1;
    }

    .details-nav-btn:active:not(:disabled) {
        transform: translateY(1px);
    }

    .details-nav-btn:disabled {
        opacity: 0.35;
        cursor: default;
    }

    .details-footer {
        display: flex;
        flex: 0 0 auto;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 8px 10px;
        border-top: 1px solid rgba(193, 206, 255, 0.08);
    }

    .details-scroll {
        flex: 1;
        min-height: 0;
        padding: 16px;
        overflow-y: auto;
        scrollbar-color: rgba(193, 206, 255, 0.2) transparent;
        scrollbar-width: thin;
    }

    .details-scroll::-webkit-scrollbar {
        width: 8px;
    }

    .details-scroll::-webkit-scrollbar-thumb {
        background: rgba(193, 206, 255, 0.2);
        border: 2px solid transparent;
        border-radius: 999px;
        background-clip: padding-box;
    }

    .details-name {
        font-size: 18px;
        font-weight: 700;
        line-height: 1.25;
        overflow-wrap: break-word;
    }

    .details-type {
        margin-top: 4px;
        color: rgba(245, 248, 255, 0.55);
        font-size: 13px;
    }

    .details-wear-bar {
        position: relative;
        margin: 16px 0 6px;
    }

    .details-wear-track {
        display: flex;
        height: 8px;
        overflow: hidden;
        border-radius: 4px;
        opacity: 0.85;
    }

    .details-wear-track div {
        height: 100%;
    }

    .details-wear-marker {
        position: absolute;
        top: -3px;
        width: 3px;
        height: 14px;
        background: #d9d9d9;
        border-radius: 4px;
        transform: translateX(-50%);
    }

    .details-props {
        margin-top: 14px;
        font-size: 13.5px;
        line-height: 1.65;
    }

    .details-actions {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 16px 0;
        padding: 14px 0;
        border-top: 1px solid rgba(193, 206, 255, 0.1);
        border-bottom: 1px solid rgba(193, 206, 255, 0.1);
    }

    .details-inspect {
        flex: 0 0 auto;
        padding: 8px 12px;
        color: inherit;
        font-size: 13px;
        text-decoration: none;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        transition: background-color 150ms ease;
    }

    .details-inspect:hover {
        background: rgba(255, 255, 255, 0.16);
    }

    .details-price {
        margin-left: auto;
        font-size: 15px;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
    }

    .details-buy {
        padding: 8px 18px;
        color: #fff;
        font: inherit;
        font-size: 13px;
        font-weight: 600;
        background: #6fa720;
        border: 0;
        border-radius: 6px;
        cursor: pointer;
        transition: background-color 150ms ease;
    }

    .details-buy:hover {
        background: #83bd2c;
    }

    .details-accessories {
        margin-bottom: 16px;
    }

    .details-section-title {
        margin-bottom: 8px;
        color: rgba(245, 248, 255, 0.82);
        font-size: 13px;
        font-weight: 600;
    }

    .details-accessory {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 6px;
        padding: 9px 10px;
        font-size: 13px;
        background: rgba(255, 255, 255, 0.04);
        border-radius: 6px;
    }

    .details-accessory img {
        width: 48px;
        height: 36px;
        object-fit: contain;
        flex: 0 0 auto;
    }

    .details-accessory-text {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
        line-height: 1.35;
    }

    .details-accessory-detail {
        color: rgba(245, 248, 255, 0.45);
        font-size: 12px;
    }

    .details-restrictions {
        color: rgba(245, 248, 255, 0.6);
        font-size: 13px;
        line-height: 1.5;
    }

    .details-restrictions ul {
        margin: 6px 0 0;
        padding-left: 22px;
    }

    .details-lines {
        margin-top: 14px;
        padding-top: 14px;
        border-top: 1px solid rgba(193, 206, 255, 0.1);
    }

    .details-lines p {
        margin: 10px 0;
        color: rgba(245, 248, 255, 0.72);
        font-size: 13px;
        line-height: 1.5;
    }

    .details-lines p.italic {
        font-style: italic;
    }

    dialog.has-details {
        width: min(94vw, calc(80vh * 16 / 9 + 340px), 2260px);
        width: min(94vw, calc(80dvh * 16 / 9 + 340px), 2260px);
    }

    dialog.has-details .modal-body {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 340px;
    }

    dialog.has-details .details-panel {
        /* The stage's height (its column width at 16:9), restated because the panel's own content
           must not be what sizes the shared grid row. Tracks the same 2260px ceiling as the dialog. */
        height: min(calc((min(94vw, 2260px) - 340px) * 9 / 16), 80vh);
        height: min(calc((min(94vw, 2260px) - 340px) * 9 / 16), 80dvh);
        border-left: 1px solid rgba(193, 206, 255, 0.1);
    }

    @media (max-width: 1167px) {
        dialog.has-details .modal-body {
            display: block;
            max-height: calc(100vh - 80px);
            max-height: calc(100dvh - 80px);
            overflow-y: auto;
        }

        dialog.has-details .details-panel {
            height: auto;
            max-height: 38vh;
            border-top: 1px solid rgba(193, 206, 255, 0.1);
            border-left: 0;
        }
    }

    .hidden {
        display: none !important;
    }

    @keyframes progress-sweep {
        from { transform: translateX(-120%); }
        to { transform: translateX(320%); }
    }

    @media (min-width: 1168px) and (max-width: 1519px) and (min-height: 840px) {
        /* The 122px item strip sits above the stage, so it joins the height budget. */
        dialog.has-items {
            width: max(1120px, min(90vw, calc((80vh - 122px) * 16 / 9)));
            width: max(1120px, min(90vw, calc((80dvh - 122px) * 16 / 9)));
        }

        dialog.has-items .modal-body {
            display: grid;
            grid-template-rows: 122px auto;
        }

        dialog.has-items .item-panel {
            display: grid;
            grid-template-columns: 122px minmax(0, 1fr);
            border-bottom: 1px solid rgba(193, 206, 255, 0.1);
        }

        dialog.has-items .item-panel-header {
            border-right: 1px solid rgba(193, 206, 255, 0.08);
        }

        dialog.has-items .item-grid {
            display: flex;
            gap: 8px;
            padding: 11px;
            overflow-x: auto;
            overflow-y: hidden;
        }

        dialog.has-items .item-card {
            flex: 0 0 98px;
            height: 98px;
        }
    }

    @media (min-width: 1520px) {
        /* The 320px item panel sits beside the stage, so it joins the width budget instead. */
        dialog.has-items {
            width: min(90vw, calc(80vh * 16 / 9 + 320px), 2240px);
            width: min(90vw, calc(80dvh * 16 / 9 + 320px), 2240px);
        }

        dialog.has-items .modal-body {
            display: grid;
            grid-template-columns: 320px minmax(0, 1fr);
        }

        dialog.has-items .item-panel {
            display: flex;
            flex-direction: column;
            /* The stage's height (its column width at 16:9), restated because the panel's own
               content must not be what sizes the shared grid row. Tracks the same 2240px ceiling
               as the dialog, or it would outgrow the stage it sits beside. */
            height: min(calc((min(90vw, 2240px) - 320px) * 9 / 16), 80vh);
            height: min(calc((min(90vw, 2240px) - 320px) * 9 / 16), 80dvh);
            border-right: 1px solid rgba(193, 206, 255, 0.1);
        }

        dialog.has-items .item-panel-header {
            height: 48px;
            border-bottom: 1px solid rgba(193, 206, 255, 0.08);
        }

        dialog.has-items .item-grid {
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

        dialog.has-items .item-card {
            height: 92px;
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

        .skincraft-logo-mark {
            width: 17px;
            height: 17px;
        }

        .skincraft-wordmark {
            font-size: 11px;
        }

        .viewer-stage {
            max-height: calc(100vh - 70px);
        }
    }
`;
