import {ExecuteScriptOnPage} from "./execute_script";
import {FetchStall} from "./fetch_stall";
import {FetchInspectInfo} from "./fetch_inspect_info";
import {ExecuteCssOnPage} from "./execute_css";
import {StorageGet} from "./storage_get";
import {StorageSet} from "./storage_set";
import {CSMoneyPrice} from "./csmoney_price";

export const HANDLERS = [
    ExecuteScriptOnPage,
    ExecuteCssOnPage,
    FetchInspectInfo,
    FetchStall,
    StorageGet,
    StorageSet,
    CSMoneyPrice,
];
