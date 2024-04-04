import {SendCookies} from '../bridge/handlers/send_cookies';

const COOKIE_ALARM_NAME = 'send-cookie-alarm';

// MUST be called from the background script
export async function setupCookieAlarm(initial = false) {
    // @ts-ignore
    const granted = (await chrome.permissions.contains({
        permissions: ['alarms', 'cookies'],
    })) as boolean;

    if (!granted || !chrome.alarms) {
        return;
    }

    const existingAlarm = await chrome.alarms.get(COOKIE_ALARM_NAME);
    if (existingAlarm) {
        if (initial) {
            createAlarmListener();
        }

        // Already exists, return
        return;
    }

    await chrome.alarms.create(COOKIE_ALARM_NAME, {
        delayInMinutes: 1,
        periodInMinutes: 60 * 6, // 6 hours
    });

    createAlarmListener();
}

function createAlarmListener() {
    chrome.alarms?.onAlarm?.addListener(async (alarm) => {
        if (alarm.name !== COOKIE_ALARM_NAME) {
            return;
        }

        await SendCookies.handleRequest({}, {});
    });
}
