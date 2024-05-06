import {init} from './utils';
import '../components/trade_offers/better_tracking';
import {inPageContext} from '../utils/snips';
import {ClientSend} from '../bridge/client';
import {PingSetupExtension} from '../bridge/handlers/ping_setup_extension';
import {PingExtensionStatus} from '../bridge/handlers/ping_extension_status';

init('src/lib/page_scripts/trade_offers.js', main);

function main() {}

if (!inPageContext()) {
    const refresh = setInterval(() => {
        const widget = document.getElementsByTagName('csfloat-better-tracking-widget');
        if (!widget || widget.length === 0) {
            return;
        }

        const btn = widget[0]?.shadowRoot?.getElementById('csfloat-enable-enhanced');
        if (!btn) {
            return;
        }

        btn.addEventListener('click', async () => {
            chrome.runtime.sendMessage(
                {
                    message: 'requestPermissions',
                    permissions: ['alarms'],
                    origins: ['*://*.steampowered.com/*'],
                },
                (granted) => {
                    if (granted) {
                        widget[0].parentElement?.removeChild(widget[0]);
                        ClientSend(PingSetupExtension, {});
                        ClientSend(PingExtensionStatus, {});
                    } else {
                        alert('Failed to obtain permissions');
                    }
                }
            );
        });

        clearInterval(refresh);
    }, 500);
}
