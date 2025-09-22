export enum ProofType {
    TRADE_OFFERS = 'trade_offers',
    TRADE_OFFER = 'trade_offer',
    TRADE_HISTORY = 'trade_history',
    TRADE_STATUS = 'trade_status',
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
}

export type NotaryProveRequest = {
    [T in ProofType]: {
        type: T;
        expected_steam_id?: string;
    } & ProveRequestPayloads[T];
}[ProofType];
