/**
 * Types related to CSFloat Market
 */
import {TradeOfferState} from './steam_constants';

export interface Item {
    asset_id: string;
    d_param: string;
    def_index: number;
    description: string;
    float_value: number;
    has_screenshot: boolean;
    high_rank: number;
    icon_url: string;
    inspect_link: string;
    is_souvenir: false;
    is_stattrak: false;
    item_name: string;
    low_rank: number;
    market_hash_name: string;
    paint_index: number;
    paint_seed: number;
    phase?: string;
    quality: number;
    rarity: number;
    wear_name: string;
    scm?: {
        price?: number;
        volume?: number;
    };
}

export interface User {
    avatar: string;
    flags: number;
    online: boolean;
    stall_public: boolean;
    statistics: {
        median_trade_time: number;
        total_avoided_trades: number;
        total_failed_trades: number;
        total_trades: number;
        total_verified_trades: number;
    };
    steam_id: string;
    username: string;
}

export enum ContractState {
    SOLD = 'sold',
    LISTED = 'listed',
    DELISTED = 'delisted',
    REFUNDED = 'refunded',
}

export enum ContractType {
    BUY_NOW = 'buy_now',
    AUCTION = 'auction',
}

export interface Contract {
    created_at: string;
    id: string;
    is_seller: boolean;
    is_watchlisted: boolean;
    item: Item;
    max_offer_discount?: number;
    min_offer_price?: number;
    price: number;
    seller: User;
    state: ContractState;
    type: ContractType;
    watchers: number;
}

export enum TradeState {
    QUEUED = 'queued',
    PENDING = 'pending',
    VERIFIED = 'verified',
    FAILED = 'failed',
    CANCELLED = 'cancelled',
}

export interface SteamOffer {
    id: string;
    state: TradeOfferState;
    sent_at: string;
}

export interface Trade {
    id: string;
    accepted_at?: string;
    buyer: User;
    buyer_id: string;
    contract: Contract;
    contract_id: string;
    created_at: string;
    expires_at?: string;
    grace_period_start: string;
    manual_verification: boolean;
    manual_verification_at?: string;
    seller_id: string;
    state: TradeState;
    trade_url: string;
    steam_offer: SteamOffer;
    wait_for_cancel_ping?: boolean;
}
