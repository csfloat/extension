import {ExecuteScriptOnPage} from './execute_script';
import {FetchStall} from './fetch_stall';
import {FetchInspectInfo} from './fetch_inspect_info';
import {ExecuteCssOnPage} from './execute_css';
import {StorageGet} from './storage_get';
import {StorageSet} from './storage_set';
import {RequestHandler} from '../types';
import {FetchPendingTrades} from './fetch_pending_trades';
import {StorageRemove} from './storage_remove';
import {RequestType} from './types';
import {FetchExtensionFile} from './fetch_extension_file';
import {AnnotateOffer} from './annotate_offer';
import {ExtensionVersion} from './extension_version';
import {TradeHistoryStatus} from './trade_history_status';
import {TradeOfferStatus} from './trade_offer_status';
import {HasPermissions} from './has_permissions';
import {PingSetupExtension} from './ping_setup_extension';
import {PingExtensionStatus} from './ping_extension_status';
import {PingCancelTrade} from './ping_cancel_trade';

export const HANDLERS_MAP: {[key in RequestType]: RequestHandler<any, any>} = {
    [RequestType.EXECUTE_SCRIPT_ON_PAGE]: ExecuteScriptOnPage,
    [RequestType.EXECUTE_CSS_ON_PAGE]: ExecuteCssOnPage,
    [RequestType.FETCH_INSPECT_INFO]: FetchInspectInfo,
    [RequestType.FETCH_STALL]: FetchStall,
    [RequestType.STORAGE_GET]: StorageGet,
    [RequestType.STORAGE_SET]: StorageSet,
    [RequestType.STORAGE_REMOVE]: StorageRemove,
    [RequestType.FETCH_PENDING_TRADES]: FetchPendingTrades,
    [RequestType.FETCH_EXTENSION_FILE]: FetchExtensionFile,
    [RequestType.ANNOTATE_OFFER]: AnnotateOffer,
    [RequestType.EXTENSION_VERSION]: ExtensionVersion,
    [RequestType.TRADE_HISTORY_STATUS]: TradeHistoryStatus,
    [RequestType.TRADE_OFFER_STATUS]: TradeOfferStatus,
    [RequestType.HAS_PERMISSIONS]: HasPermissions,
    [RequestType.PING_SETUP_EXTENSION]: PingSetupExtension,
    [RequestType.PING_EXTENSION_STATUS]: PingExtensionStatus,
    [RequestType.PING_CANCEL_TRADE]: PingCancelTrade,
};
