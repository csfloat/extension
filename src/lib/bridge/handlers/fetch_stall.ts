import {RequestType, SimpleHandler} from "./main";

interface FetchStallRequest {
    steam_id64: string;
}


export const FetchStall = new SimpleHandler<FetchStallRequest, any>(
    RequestType.FETCH_STALL,
    async () => {
        return {filters: ['1']};
    });
