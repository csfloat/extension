import {RequestType, SimpleHandler} from "./main";

interface FetchGlobalFiltersResponse {
    filters: string[];
}

export const FetchGlobalFilters = new SimpleHandler<FetchGlobalFiltersResponse, FetchGlobalFiltersResponse>(
    RequestType.FETCH_GLOBAL_FILTERS,
    async () => {

        return {filters: ['1']};
    });
