import {ExecuteScriptOnPage} from './execute_script';
import {FetchStall} from './fetch_stall';
import {FetchInspectInfo} from './fetch_inspect_info';
import {ExecuteCssOnPage} from './execute_css';
import {StorageGet} from './storage_get';
import {StorageSet} from './storage_set';
import {CSMoneyPrice} from './csmoney_price';
import {RequestHandler} from '../types';
import {FetchPendingTrades} from './fetch_pending_trades';
import {FetchSkinModel} from './fetch_skin_model';
import {StorageRemove} from './storage_remove';
import {RequestType} from './types';
import {FetchExtensionFile} from './fetch_extension_file';
import {OpenOptionsPage} from './open_options_page';
import {SettingsGet} from './settings_get';
import {SettingsSet} from './settings_set';

export const HANDLERS_MAP: {[key in RequestType]: RequestHandler<any, any>} = {
    [RequestType.EXECUTE_SCRIPT_ON_PAGE]: ExecuteScriptOnPage,
    [RequestType.EXECUTE_CSS_ON_PAGE]: ExecuteCssOnPage,
    [RequestType.FETCH_INSPECT_INFO]: FetchInspectInfo,
    [RequestType.FETCH_STALL]: FetchStall,
    [RequestType.STORAGE_GET]: StorageGet,
    [RequestType.STORAGE_SET]: StorageSet,
    [RequestType.STORAGE_REMOVE]: StorageRemove,
    [RequestType.CSMONEY_PRICE]: CSMoneyPrice,
    [RequestType.FETCH_PENDING_TRADES]: FetchPendingTrades,
    [RequestType.FETCH_SKIN_MODEL]: FetchSkinModel,
    [RequestType.FETCH_EXTENSION_FILE]: FetchExtensionFile,
    [RequestType.OPEN_OPTIONS_PAGE]: OpenOptionsPage,
    [RequestType.SETTINGS_GET]: SettingsGet,
    [RequestType.SETTINGS_SET]: SettingsSet,
};
