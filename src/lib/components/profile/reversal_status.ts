import {CustomElement, InjectAfter, InjectionMode} from '../injectors';
import {FloatElement} from '../custom';
import {css, html} from 'lit';
import {state} from 'lit/decorators.js';
import {FetchReversalStatusResponse} from '../../bridge/handlers/fetch_reversal_status';
import {gReversalFetcher} from '../../services/reversal_fetcher';

@CustomElement()
@InjectAfter(
    '.profile_in_game.persona + .profile_ban_status, .profile_in_game.persona:not(:has(+ .profile_ban_status))',
    InjectionMode.ONCE
)
export class ReversalStatus extends FloatElement {
    @state()
    show: boolean = false;

    reversalStatus: FetchReversalStatusResponse | undefined = undefined;

    static styles = [
        ...FloatElement.styles,
        css`
            .container {
                color: #de6667;
                margin-bottom: 10px;
            }
        `,
    ];

    get daysSinceLastReversal(): number | null {
        if (!this.reversalStatus?.last_reversal_timestamp) {
            return null;
        }

        const now = Date.now();
        const timeSince = now - this.reversalStatus.last_reversal_timestamp;
        return Math.floor(timeSince / (24 * 60 * 60 * 1000));
    }

    getSteamId(): string {
        const match = window.location.pathname.match(/^\/profiles\/(\d+)/);
        if (match) {
            return match[1];
        }

        // Extract from embedded javascript
        const scripts = document.querySelectorAll('script[type="text/javascript"]');
        for (const script of scripts) {
            const content = script.textContent;

            const match = content?.match(/g_rgProfileData\s*=\s*({.*?});/);
            if (match) {
                return JSON.parse(match[1]).steamid;
            }
        }
        return '';
    }

    async connectedCallback() {
        super.connectedCallback();

        try {
            const steamId = this.getSteamId();
            if (!steamId) {
                console.error('failed to get steam id');
                return;
            }

            this.reversalStatus = await gReversalFetcher.fetch({steam_id64: steamId});
            this.show = this.reversalStatus?.has_reversed;
        } catch (e) {
            console.error('failed to fetch reversal status', e);
        }
    }

    protected render() {
        if (!this.show) {
            return html``;
        }

        const daysSince = this.daysSinceLastReversal ?? 0;
        let message = 'User reversed a trade';
        if (daysSince === 0) {
            message += ' today';
        } else if (daysSince === 1) {
            message += ' yesterday';
        } else {
            message += ` ${daysSince} days ago`;
        }

        return html` <div class="container"><b>WARNING:</b> ${message}</div>`;
    }
}
