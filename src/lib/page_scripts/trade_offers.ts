import {init} from './utils';
import '../components/trade_offers/offer_id';
import '../components/trade_offers/auto_track';
import {inPageContext} from '../utils/snips';
import {ClientSend} from '../bridge/client';
import {SendCookies} from '../bridge/handlers/send_cookies';

init('src/lib/page_scripts/trade_offers.js', main);

function main() {}

if (!inPageContext()) {
    const refresh = setInterval(() => {
        const widget = document.getElementsByTagName('csfloat-auto-track-widget');
        if (!widget || widget.length === 0) {
            return;
        }

        const btn = widget[0]?.shadowRoot?.getElementById('csfloat-enable-tracking');
        if (!btn) {
            return;
        }

        btn.addEventListener('click', async () => {
            chrome.runtime.sendMessage(
                {
                    message: 'requestPermissions',
                    permissions: ['cookies', 'alarms'],
                },
                (granted) => {
                    if (granted) {
                        ClientSend(SendCookies, {});
                        widget[0].parentElement?.removeChild(widget[0]);
                    } else {
                        alert('Failed to obtain permissions');
                    }
                }
            );
        });

        clearInterval(refresh);
    }, 500);
}
