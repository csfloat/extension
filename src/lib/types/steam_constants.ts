// See g_rgCurrencyData
export enum Currency {
    USD = 2001,
}

export enum AppId {
    CSGO = 730,
}

export enum ContextId {
    PRIMARY = 2,
}

// https://developer.valvesoftware.com/wiki/Steam_Web_API/IEconService
export enum TradeOfferState {
    Invalid = 1,
    Active = 2,
    Accepted = 3,
    Countered = 4,
    Expired = 5,
    Canceled = 6,
    Declined = 7,
    InvalidItems = 8,
    CreatedNeedsConfirmation = 9,
    CancelledBySecondFactor = 10,
    InEscrow = 11,
}
