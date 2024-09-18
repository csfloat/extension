import {SimpleHandler} from './main';
import {RequestType} from './types';
import {gStore} from '../../storage/store';
import {StorageKey} from '../../storage/keys';
import {PING_CSFLOAT_TRADE_STATUS_ALARM_NAME} from '../../alarms/csfloat_trade_pings';

export interface PingStatusRequest {}

export interface PingStatusResponse {
    last_ping_ms?: number;
    next_ping_ms?: number;
}

export const PingStatus = new SimpleHandler<PingStatusRequest, PingStatusResponse>(
    RequestType.PING_STATUS,
    async (req) => {
        const resp: PingStatusResponse = {};

        const lastPing = await gStore.getWithStorage<number>(chrome.storage.local, StorageKey.LAST_TRADE_PING_ATTEMPT);
        if (lastPing) {
            resp.last_ping_ms = lastPing;
        }

        if (chrome.alarms) {
            const alarm = await chrome.alarms.get(PING_CSFLOAT_TRADE_STATUS_ALARM_NAME);
            if (alarm) {
                resp.next_ping_ms = alarm.scheduledTime;
            }
        }

        return resp;
    }
);
