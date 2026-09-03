/** Mirrors the longest `dialog` transition below; keep the two in sync. */
export const MODAL_TRANSITION_MS = 200;

/** The dialog shell: sizing, backdrop, and the enter/close transitions. */
export const dialogStyles = `
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
        outline: none;
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

    .hidden {
        display: none !important;
    }

    @media (max-width: 640px) {
        dialog {
            width: calc(100vw - 20px);
        }
    }
`;
