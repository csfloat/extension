/** The grid layout's header bar, plus the attribution link and close button both layouts share. */
export const headerStyles = `
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

    @media (max-width: 640px) {
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
    }
`;
