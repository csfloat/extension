/** The details layout: the listing panel beside the stage, with prev/next in its footer. */
export const detailsPanelStyles = `
    .details-panel {
        position: relative;
        display: flex;
        flex-direction: column;
        min-width: 0;
        min-height: 0;
        /* Clips the prev/next slide — without it the moving panes paint over the stage. */
        overflow: hidden;
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
        user-select: none;
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

    /* The outgoing clone of the prev/next slide, pinned over the live scroll area
       (top/height are set inline from the live element's offset box, hence border-box). */
    .details-scroll.details-ghost {
        position: absolute;
        right: 0;
        left: 0;
        box-sizing: border-box;
        overflow: hidden;
        background: #181b21;
        pointer-events: none;
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

    /* Reads as navigation on purpose: it only takes the user to Steam's own purchase dialog,
       so it must not look or read like a Buy button. */
    .details-view {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 8px 10px 8px 14px;
        color: #fff;
        font: inherit;
        font-size: 13px;
        font-weight: 600;
        white-space: nowrap;
        background: #5155eb;
        border: 0;
        border-radius: 6px;
        cursor: pointer;
        user-select: none;
        transition: background-color 150ms ease;
    }

    .details-view:hover {
        background: #6468f0;
    }

    .details-view-notice {
        margin: -8px 0 16px;
        color: #ff8585;
        font-size: 12.5px;
        line-height: 1.4;
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
`;
