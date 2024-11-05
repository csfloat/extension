import {FloatElement} from '../custom';
import {html, css, HTMLTemplateResult, nothing} from 'lit';
import {state} from 'lit/decorators.js';
import {rgAsset} from '../../types/steam';
import {gFloatFetcher} from '../../services/float_fetcher';
import {ItemInfo} from '../../bridge/handlers/fetch_inspect_info';
import {formatFloatWithRank, formatSeed, getFadePercentage, getLowestRank, isCharm} from '../../utils/skin';
import {isSkin, floor} from '../../utils/skin';
import {getRankColour} from '../../utils/ranks';
import {Observe} from '../../utils/observers';

// Generic annotator of item holder metadata (float, seed, etc...)
// Must be extended to use as a component
export abstract class ItemHolderMetadata extends FloatElement {
    static styles = [
        ...FloatElement.styles,
        css`
            .float {
                position: absolute;
                bottom: 3px;
                right: 3px;
                font-size: 12px;
            }

            .seed {
                position: absolute;
                top: 3px;
                right: 3px;
                font-size: 12px;
            }

            .fade {
                background: -webkit-linear-gradient(0deg, #d9bba5 0%, #e5903b 33%, #db5977 66%, #6775e1 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }

            .csfloat-shine-fade-text {
                font-weight: 1000;
                -webkit-text-stroke: 1px black;
            }
        `,
    ];

    @state()
    private itemInfo: ItemInfo | undefined;

    get assetId(): string | undefined {
        return $J(this).parent().attr('id')?.split('_')[2];
    }

    abstract get asset(): rgAsset | undefined;
    abstract get ownerSteamId(): string | undefined;

    get inspectLink(): string | undefined {
        if (!this.asset) return;

        if (!this.asset?.actions || this.asset?.actions?.length === 0) return;

        if (!this.ownerSteamId) {
            return;
        }

        return this.asset
            ?.actions![0].link.replace('%owner_steamid%', this.ownerSteamId)
            .replace('%assetid%', this.assetId!);
    }

    protected render(): HTMLTemplateResult {
        if (!this.itemInfo || !this.asset) return html``;

        if (isSkin(this.asset)) {
            const fadePercentage = this.asset && getFadePercentage(this.asset, this.itemInfo);

            if (fadePercentage === 100) {
                $J(this).parent().addClass('full-fade-border');
            }

            const rank = getLowestRank(this.itemInfo);

            return html`
                <span>
                    <span class="float">${formatFloatWithRank(this.itemInfo, 6)}</span>
                    <span class="seed"
                        >${formatSeed(this.itemInfo)}
                        ${fadePercentage !== undefined
                            ? html`<span class="fade ${rank && rank <= 5 ? 'csfloat-shine-fade-text' : ''}"
                                  >(${floor(fadePercentage, 1)}%)</span
                              >`
                            : nothing}</span
                    >
                </span>
            `;
        } else if (isCharm(this.asset)) {
            return html`
                <span>
                    <span class="seed"
                        >#${this.itemInfo.keychains?.length > 0 ? this.itemInfo.keychains[0].pattern : 'NA'}</span
                    >
                </span>
            `;
        } else {
            return html``;
        }
    }

    async connectedCallback() {
        super.connectedCallback();

        if (this.inspectLink) {
            this.onInit();
        } else {
            // Wait until the asset exists
            Observe(
                () => this.inspectLink,
                () => {
                    if (this.inspectLink) {
                        this.onInit();
                    }
                },
                200
            );
        }
    }

    async onInit() {
        if (!this.asset) return;

        if (!isSkin(this.asset) && !isCharm(this.asset)) return;

        // Commodities won't have inspect links
        if (!this.inspectLink) return;

        try {
            this.itemInfo = await gFloatFetcher.fetch({
                link: this.inspectLink,
            });
        } catch (e: any) {
            console.error(`Failed to fetch float for ${this.assetId}: ${e.toString()}`);
        }

        if (this.itemInfo) {
            this.annotateRankShine(this.itemInfo);
        }
    }

    annotateRankShine(info: ItemInfo) {
        const rank = getLowestRank(info);
        if (!rank || rank > 5) {
            return;
        }

        // Make the inventory box coloured ;)
        $J(this).parent().css('color', 'black');
        $J(this).parent().find('img').css('background-color', getRankColour(rank));
        $J(this).parent().addClass('csfloat-shine');
    }
}
