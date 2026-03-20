import {NetworkSetting} from '@csfloat/tlsn-wasm';

export enum ProofType {
    TRADE_OFFERS = 'trade_offers',
    TRADE_OFFER = 'trade_offer',
    TRADE_HISTORY = 'trade_history',
    TRADE_STATUS = 'trade_status',
    INVENTORY = 'inventory',
}

interface ProveRequestPayloads {
    // IEconService/GetTradeOffers/v1/
    [ProofType.TRADE_OFFERS]: {
        get_sent_offers?: boolean;
        get_received_offers?: boolean;
        get_descriptions?: boolean;
        language?: string;
        active_only?: boolean;
        historical_only?: boolean;
        time_historical_cutoff?: number;
        cursor?: number;
    };
    // IEconService/GetTradeOffer/v1/
    [ProofType.TRADE_OFFER]: {
        tradeofferid: string;
    };
    // IEconService/GetTradeHistory/v1/
    [ProofType.TRADE_HISTORY]: {
        max_trades: number;
        start_after_time?: number;
        start_after_tradeid?: string;
        navigating_back?: boolean;
        get_descriptions?: boolean;
        language?: string;
        include_failed?: boolean;
        include_total?: boolean;
    };
    // IEconService/GetTradeStatus/v1/
    [ProofType.TRADE_STATUS]: {
        tradeid: string;
        get_descriptions?: boolean;
        language?: string;
    };
    // IEconService/GetInventoryItemsWithDescriptions/v1/
    [ProofType.INVENTORY]: {
        steamid: string;
        appid: number;
        contextid: number;
        get_descriptions?: boolean;
        for_trade_offer_verification?: boolean;
        language?: string;
        start_assetid?: string;
        count?: number;
        get_asset_properties?: boolean;
    };
}

export type NotaryProveRequest = {
    [T in ProofType]: {
        type: T;
        meta?: {
            expected_steam_id?: string;
            notary_token?: string;
            // Number of milliseconds to wait after calculating the size of the response, useful
            // to prevent rate limiting.
            after_response_calc_delay_ms?: number;

            // Optionally set the max sent/recv data instead of having the extension calculate it (with an extra request)
            max_sent_data?: number;
            max_recv_data?: number;

            // Optionally override the network setting for proving
            network_setting?: NetworkSetting;
        };
    } & ProveRequestPayloads[T];
}[ProofType];
