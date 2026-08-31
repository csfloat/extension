import {dialogStyles, MODAL_TRANSITION_MS} from './dialog';
import {detailsPanelStyles} from './details_panel';
import {headerStyles} from './header';
import {itemStripStyles} from './item_strip';
import {stageStyles} from './stage';

export {MODAL_TRANSITION_MS};

export const skinCraftViewerModalStyles = [
    dialogStyles,
    headerStyles,
    itemStripStyles,
    stageStyles,
    detailsPanelStyles,
].join('\n');
