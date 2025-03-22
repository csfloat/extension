import {css, html, nothing, TemplateResult} from 'lit';
import {property, state} from 'lit/decorators.js';
import {CustomElement} from '../injectors';
import {FloatElement} from '../custom';
import {ItemInfo} from '../../bridge/handlers/fetch_inspect_info';
import {rgAsset, rgInternalDescription} from '../../types/steam';

enum AppliedType {
    Charm = 'Charm',
    Sticker = 'Sticker',
}

interface AppliedItem {
    imageUrl: string;
    type: string;
    name: string;
    url: string;
    value: string;
}

@CustomElement()
export class StickerDisplay extends FloatElement {
    @property({type: Object}) itemInfo!: ItemInfo;
    @property({type: Object}) asset!: rgAsset;

    @state() private stickers: AppliedItem[] = [];
    @state() private keychains: AppliedItem[] = [];

    static styles = [
        ...FloatElement.styles,
        css`
            :host {
                float: right;
                display: flex;
                flex-wrap: wrap;
                justify-content: flex-end;
                gap: 4px;
                margin-bottom: 4px;
            }

            .csfloat-stickers-container {
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
                justify-content: flex-end;
            }

            .item-container {
                display: inline-block;
                text-align: center;
            }

            a {
                display: flex;
                justify-content: center;
                align-items: center;
            }

            a img {
                transition: transform 0.15s ease, filter 0.15s ease;
                width: 64px;
                height: 48px;
                filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.5));
            }

            a:hover img {
                transform: scale(1.25);
                z-index: 1000;
                position: relative;
                filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.8));
            }

            .item-value {
                display: block;
                font-size: 10px;
                margin-top: 2px;
                text-align: center;
                white-space: nowrap;
            }
        `,
    ];

    render() {
        if (!this.itemInfo || !this.asset) {
            return nothing;
        }

        if (this.stickers.length === 0 && this.keychains.length === 0) {
            return nothing;
        }

        return html`
            <div class="csfloat-stickers-container">
                ${this.stickers.map((sticker) => this.renderAppliedItem(sticker, true))}
                ${this.keychains.map((keychain) => this.renderAppliedItem(keychain, false))}
            </div>
        `;
    }

    private renderAppliedItem(item: AppliedItem, isSticker: boolean): TemplateResult {
        const stickerName = `${item.type} | ${item.name}`;
        const containerClass = `item-container ${isSticker ? 'sticker-container' : 'keychain-container'}`;

        return html`
            <div class="${containerClass}">
                ${this.tooltip(stickerName)}
                <a target="_blank" href="${item.url}">
                    <img src="${item.imageUrl}" alt="${stickerName}" />
                </a>
                <span class="item-value">${item.value}</span>
            </div>
        `;
    }

    // Helper to extract image url from Steam's HTML img tag
    private parseImageTag(imgHtml: string): string {
        const srcMatch = imgHtml.match(/src="([^"]+)"/);
        if (srcMatch && srcMatch[1]) {
            return srcMatch[1];
        }
        return '';
    }

    get stickerDescription(): rgInternalDescription | undefined {
        if (!this.itemInfo.stickers?.length) {
            return;
        }

        if (this.itemInfo.keychains?.length > 0) {
            // if they have a keychain, it is the second last description
            return this.asset.descriptions[this.asset.descriptions.length - 2];
        } else {
            return this.asset.descriptions[this.asset.descriptions.length - 1];
        }
    }

    get keychainDescription(): rgInternalDescription | undefined {
        if (!this.itemInfo.keychains?.length) {
            return;
        }

        return this.asset.descriptions[this.asset.descriptions.length - 1];
    }

    private parseAppliedItems(
        description: rgInternalDescription,
        type: AppliedType,
        valueFormatter: (index: number) => string
    ): AppliedItem[] {
        try {
            const nameMatch = description.value.match(/<br>([^<].*?): (.*)<\/center>/);
            const imagesHtml = description.value.match(/(<img .*?>)/g);

            if (!nameMatch || !imagesHtml) {
                return [];
            }

            const parsedType = nameMatch[1];
            const names = nameMatch[2].split(', ');

            return imagesHtml.map((imageHtml, i) => {
                const url =
                    parsedType === type
                        ? `https://steamcommunity.com/market/listings/730/${parsedType} | ${names[i]}`
                        : `https://steamcommunity.com/market/search?q=${parsedType} | ${names[i]}`;

                return {
                    imageUrl: this.parseImageTag(imageHtml),
                    type: parsedType,
                    name: names[i],
                    url,
                    value: valueFormatter(i),
                };
            });
        } catch (e) {
            console.error('Failed to parse applied items:', e);
            return [];
        }
    }

    private loadStickers(): void {
        const description = this.stickerDescription;

        if (description?.type !== 'html' || !description.value.includes('sticker')) {
            this.stickers = [];
            return;
        }

        this.stickers = this.parseAppliedItems(description, AppliedType.Sticker, (index) => {
            return `${Math.round(100 * (this.itemInfo.stickers[index]?.wear || 0)) + '%'}`;
        });
    }

    private loadKeychains(): void {
        const description = this.keychainDescription;

        if (description?.type !== 'html' || description.value.includes('sticker')) {
            this.keychains = [];
            return;
        }

        this.keychains = this.parseAppliedItems(description, AppliedType.Charm, (index) => {
            return `#${this.itemInfo.keychains[index]?.pattern}`;
        });
    }

    connectedCallback() {
        super.connectedCallback();

        if (this.itemInfo && this.asset) {
            try {
                this.loadStickers();
                this.loadKeychains();
            } catch (e) {
                console.error('Error in StickerDisplay component:', e);
            }
        }
    }
}
