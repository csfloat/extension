/** The 16:9 viewer stage: the embed iframe and its loading/error cover. */
export const stageStyles = `
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

    @keyframes progress-sweep {
        from { transform: translateX(-120%); }
        to { transform: translateX(320%); }
    }

    @media (max-width: 640px) {
        .viewer-stage {
            max-height: calc(100vh - 70px);
        }
    }
`;
