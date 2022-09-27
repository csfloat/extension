import {ExecuteScriptOnPage} from "./execute_script";
import {FetchGlobalFilters} from "./fetch_global_filters";
import {FetchStall} from "./fetch_stall";
import {FetchInspectInfo} from "./fetch_inspect_info";
import {ExecuteCssOnPage} from "./execute_css";
import {StorageGet} from "./storage_get";
import {StorageSet} from "./storage_set";

export const HANDLERS = [
    ExecuteScriptOnPage,
    ExecuteCssOnPage,
    FetchInspectInfo,
    FetchGlobalFilters,
    FetchStall,
    StorageGet,
    StorageSet,
];
