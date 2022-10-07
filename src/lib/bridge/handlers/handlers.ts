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
import {Example} from './example';

export enum RequestType {
    EXAMPLE,
    EXECUTE_SCRIPT_ON_PAGE,
    EXECUTE_CSS_ON_PAGE,
    FETCH_INSPECT_INFO,
    FETCH_STALL,
    STORAGE_GET,
    STORAGE_SET,
    STORAGE_REMOVE,
    CSMONEY_PRICE,
    FETCH_PENDING_TRADES,
    FETCH_SKIN_MODEL,
}

export const HANDLERS_MAP: {[key in RequestType]: RequestHandler<any, any>} = {
    [RequestType.EXAMPLE]: Example,
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
};
