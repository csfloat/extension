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
                display: flex;
                align-items: center;
                gap: 6px;
                color: #de6667;
                margin-bottom: 10px;

                .warning {
                    display: inline;
                    align-items: top;
                    justify-content: start;

                    .info-link-container {
                        color: #828282;

                        .info-link {
                            color: #ebebeb;
                            text-decoration: none;
                            
                            &:hover {
                                color: #66C0F4;
                            }
                        }
                    }
                }
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

        if (!g_rgProfileData) {
            throw new Error('g_rgProfileData is undefined');
        }

        return g_rgProfileData.steamid;
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
        const message = `${daysSince} day(s) since last trade reversal`;
        return html`
    <div class="container">
        <div class="warning">
            ${message}
            <span class="info-link-container"> | 
                <a class="info-link" href="https://help.steampowered.com/en/faqs/view/365F-4BEE-2AE2-7BDD" target="_blank" rel="noreferrer">
                    Info
                </a>
            </span>
        </div>
    </div>
`;
    }
}
