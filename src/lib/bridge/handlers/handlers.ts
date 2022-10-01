import {ExecuteScriptOnPage} from "./execute_script";
import {FetchStall} from "./fetch_stall";
import {FetchInspectInfo} from "./fetch_inspect_info";
import {ExecuteCssOnPage} from "./execute_css";
import {StorageGet} from "./storage_get";
import {StorageSet} from "./storage_set";
import {CSMoneyPrice} from "./csmoney_price";
import {RequestType} from "./main";
import {RequestHandler} from "../types";

export const HANDLERS_MAP: {[key in RequestType]: RequestHandler<any, any>} = {
    [RequestType.EXECUTE_SCRIPT_ON_PAGE]: ExecuteScriptOnPage,
    [RequestType.EXECUTE_CSS_ON_PAGE]: ExecuteCssOnPage,
    [RequestType.FETCH_INSPECT_INFO]: FetchInspectInfo,
    [RequestType.FETCH_STALL]: FetchStall,
    [RequestType.STORAGE_GET]: StorageGet,
    [RequestType.STORAGE_SET]: StorageSet,
    [RequestType.CSMONEY_PRICE]: CSMoneyPrice,
}
