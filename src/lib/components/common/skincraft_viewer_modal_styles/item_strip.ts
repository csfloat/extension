/** The grid layout's item strip: a card row above the stage, or a card panel beside it when wide. */
export const itemStripStyles = `
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
`;
