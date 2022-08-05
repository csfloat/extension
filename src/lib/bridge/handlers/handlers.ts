import {ExecuteScriptOnPage} from "./execute_script";
import {FetchGlobalFilters} from "./fetch_global_filters";
import {FetchStall} from "./fetch_stall";
import {FetchInspectInfo} from "./fetch_inspect_info";

export const HANDLERS = [
    ExecuteScriptOnPage,
    FetchInspectInfo,
    FetchGlobalFilters,
    FetchStall,
];
