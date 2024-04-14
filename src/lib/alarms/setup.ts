import {PING_CSFLOAT_TRADE_STATUS_ALARM_NAME, pingTradeStatus} from './csfloat_trade_pings';
import {HasPermissions} from '../bridge/handlers/has_permissions';

async function alarmListener(alarm: chrome.alarms.Alarm) {
    if (alarm.name === PING_CSFLOAT_TRADE_STATUS_ALARM_NAME) {
        await pingTradeStatus();
    }
}

async function registerAlarmListenerIfPossible() {
    const hasPermissions = await HasPermissions.handleRequest({permissions: ['alarms'], origins: []}, {});
    if (!hasPermissions.granted) {
        return;
    }
    // Prevent duplicate listeners
    chrome.alarms.onAlarm.removeListener(alarmListener);
    chrome.alarms.onAlarm.addListener(alarmListener);
}

export async function registerTradeAlarmIfPossible() {
    const hasPermissions = await HasPermissions.handleRequest({permissions: ['alarms'], origins: []}, {});
    if (!hasPermissions.granted) {
        return;
    }
    const alarm = await chrome.alarms.get(PING_CSFLOAT_TRADE_STATUS_ALARM_NAME);

    if (!alarm) {
        await chrome.alarms.create(PING_CSFLOAT_TRADE_STATUS_ALARM_NAME, {
            periodInMinutes: 5,
            delayInMinutes: 1,
        });
    }

    await registerAlarmListenerIfPossible();
}
