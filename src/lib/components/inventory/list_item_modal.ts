import {FloatElement} from '../custom';
import {CustomElement} from '../injectors';
import {html, HTMLTemplateResult} from 'lit';
import {property, state} from 'lit/decorators.js';
import {ItemInfo} from '../../bridge/handlers/fetch_inspect_info';
import {InventoryAsset} from '../../types/steam';
import {ClientSend} from '../../bridge/client';
import {ListItem} from '../../bridge/handlers/list_item';
import {FetchRecommendedPrice} from '../../bridge/handlers/fetch_recommended_price';
import {listItemModalStyles} from './list_item_modal_styles';
import {CSFError, CSFErrorCode} from '../../utils/errors';
import {FetchCSFloatMe} from '../../bridge/handlers/fetch_csfloat_me';
import {STEAL_ICON, CHEAP_ICON, RECOMMENDED_ICON, EXPENSIVE_ICON} from '../../utils/icons';
import {getDopplerPhase, hasDopplerPhase} from '../../utils/dopplers';

@CustomElement()
export class ListItemModal extends FloatElement {
    @property()
    itemInfo: ItemInfo | undefined;

    @property()
    asset!: InventoryAsset;

    @state()
    private recommendedPrice: number | undefined;

    @state()
    private listingType: 'buy_now' | 'auction' = 'buy_now';

    @state()
    private isPrivate: boolean = false;

    @state()
    private showDescriptionInput: boolean = false;

    @state()
    private description: string = '';

    @state()
    private customPrice: number | undefined;

    @state()
    private pricePercentage: number = 100;

    @state()
    private auctionDuration: 1 | 3 | 7 | 14 = 7;

    @state()
    private isLoading: boolean = false;

    @state()
    private isInitialLoading: boolean = false;

    @state()
    private error?: {message: string; cta?: string; ctaHref?: string; hideContent?: boolean};

    @state()
    private listingId: string | undefined;

    @state()
    private showConfirmationModal: boolean = false;

    @state()
    private isClosing: boolean = false;

    @state()
    private isConfirmationClosing: boolean = false;

    private scrollPosition: number = 0;

    private readonly MAX_PRICE_CENTS = 100000 * 100; // $100,000

    private readonly MIN_PRICE_CENTS = 3; // $0.03

    // Default to 100% until we fetch it from their CSFloat profile in initializer
    private SALES_FEE_PERCENTAGE: number = 1;

    private readonly DURATION_OPTIONS = [
        {value: 1, label: '1 Day'},
        {value: 3, label: '3 Days'},
        {value: 7, label: '7 Days'},
        {value: 14, label: '14 Days'},
    ] as const;

    private readonly MAX_DESCRIPTION_LENGTH = 32;

    get searchUrl(): string {
        let extendedMHN = this.asset.description.market_hash_name;

        const paintindex = this.itemInfo?.paintindex;
        if (paintindex && hasDopplerPhase(paintindex)) {
            extendedMHN += ` [${getDopplerPhase(paintindex)}]`;
        }

        return `https://csfloat.com/search?market_hash_name=${encodeURIComponent(extendedMHN)}`;
    }

    static styles = [...listItemModalStyles];

    async connectedCallback() {
        super.connectedCallback();

        // Store the current scroll position
        this.scrollPosition = window.scrollY;

        // Force scrollbar to always be visible but prevent scrolling
        document.documentElement.style.overflowY = 'scroll';
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${this.scrollPosition}px`;
        document.body.style.width = '100%';

        try {
            this.isInitialLoading = true;

            try {
                const floatUser = await ClientSend(FetchCSFloatMe, {});
                this.SALES_FEE_PERCENTAGE = floatUser.user.fee;
            } catch (e) {
                throw new CSFError(CSFErrorCode.NOT_AUTHENTICATED);
            }

            // Will also throw if not logged in
            await this.fetchRecommendedPrice();
        } catch (error) {
            console.error('Failed to initialize listing modal:', error);

            if (error instanceof CSFError && error.code === CSFErrorCode.NOT_AUTHENTICATED) {
                this.error = {
                    message: 'You must be logged into CSFloat to list items.',
                    cta: 'Log into CSFloat',
                    ctaHref: 'https://csfloat.com/',
                };
            } else {
                this.error = {
                    message: error instanceof Error ? error.message : 'Something went wrong. Please try again later.',
                    cta: 'Done',
                };
            }
        } finally {
            this.isInitialLoading = false;

            // Set initial slider progress after initial loading is done
            requestAnimationFrame(() => {
                const slider = this.shadowRoot?.querySelector<HTMLInputElement>('.percentage-slider');
                if (slider) {
                    slider.style.setProperty('--slider-percentage', '50');
                }
            });
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();

        // Restore normal scrolling and scroll position
        document.documentElement.style.overflowY = '';
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';

        // Restore scroll position
        window.scrollTo(0, this.scrollPosition);
    }

    async fetchRecommendedPrice() {
        // Skip if we already have a price
        if (this.recommendedPrice !== undefined) {
            return;
        }

        const response = await ClientSend(FetchRecommendedPrice, {
            market_hash_name: this.asset.description.market_hash_name,
            paint_index: this.itemInfo?.paintindex,
        });

        this.recommendedPrice = response.price;
        this.customPrice ??= this.recommendedPrice;
    }

    private validatePrice(price: number | undefined): {isValid: boolean; error?: {message: string}} {
        if (!price || isNaN(price) || price < this.MIN_PRICE_CENTS) {
            return {
                isValid: false,
                error: {message: `Please enter a valid price of at least $${(this.MIN_PRICE_CENTS / 100).toFixed(2)}`},
            };
        }

        if (price > this.MAX_PRICE_CENTS) {
            return {isValid: false, error: {message: 'Price cannot exceed $100,000 USD'}};
        }

        return {isValid: true};
    }

    private getSaleFee(cents: number): number {
        return Math.max(1, cents * this.SALES_FEE_PERCENTAGE);
    }

    private formatPrice(cents: number): string {
        return (cents / 100).toFixed(2);
    }

    private formatInputPrice(cents: number): string {
        // For input, show the exact value without forcing decimals
        return (cents / 100).toString();
    }

    private handlePriceChange(e: Event) {
        const input = e.target as HTMLInputElement;
        let value = input.value;

        // Remove any non-numeric or non-decimal characters
        value = value.replace(/[^\d.]/g, '');

        // Ensure only one decimal point
        const parts = value.split('.');
        if (parts.length > 2) {
            value = parts[0] + '.' + parts.slice(1).join('');
        }

        // Limit decimal places to 2
        if (parts.length === 2) {
            value = parts[0] + '.' + parts[1].slice(0, 2);
        }

        // Update the input value
        input.value = value;

        // Convert to cents for storage
        const dollars = parseFloat(value || '0');
        const cents = Math.ceil(dollars * 100);

        // Validate the price
        if (cents < this.MIN_PRICE_CENTS) {
            this.error = {
                message: `Please enter a valid price of at least $${(this.MIN_PRICE_CENTS / 100).toFixed(2)}`,
            };
            this.customPrice = undefined;
        } else if (cents > this.MAX_PRICE_CENTS) {
            this.error = {
                message: 'Price cannot exceed $100,000 USD',
            };
            input.value = (this.MAX_PRICE_CENTS / 100).toString();
            this.customPrice = this.MAX_PRICE_CENTS;
        } else {
            this.error = undefined;
            this.customPrice = cents;

            // Update the price percentage
            if (this.recommendedPrice) {
                this.pricePercentage = Math.round((cents / this.recommendedPrice) * 100);

                const rangePercentage = Math.max(80, Math.min(120, (cents / this.recommendedPrice) * 100));
                // Update the slider progress - normalize to 0-100 based on min-max range
                requestAnimationFrame(() => {
                    const normalizedValue = ((rangePercentage - 80) / (120 - 80)) * 100;
                    const slider = this.shadowRoot?.querySelector<HTMLInputElement>('.percentage-slider');
                    if (slider) {
                        slider.style.setProperty('--slider-percentage', normalizedValue.toString());
                    }
                });
            }
        }
    }

    private handlePercentageChange(e: Event) {
        const input = e.target as HTMLInputElement;
        const value = parseFloat(input.value);
        this.pricePercentage = value;

        // Update the slider progress - normalize to 0-100 based on min-max range
        requestAnimationFrame(() => {
            const normalizedValue = ((value - 80) / (120 - 80)) * 100;
            input.style.setProperty('--slider-percentage', normalizedValue.toString());
        });

        if (this.recommendedPrice) {
            const exactPrice = (value / 100) * this.recommendedPrice;
            const newPrice = Math.ceil(exactPrice);

            // Validate the price
            if (newPrice < this.MIN_PRICE_CENTS) {
                this.error = {
                    message: `Please enter a valid price of at least $${(this.MIN_PRICE_CENTS / 100).toFixed(2)}`,
                };
                this.customPrice = undefined;
            } else if (newPrice > this.MAX_PRICE_CENTS) {
                this.error = {
                    message: 'Price cannot exceed $100,000 USD',
                };
                this.customPrice = this.MAX_PRICE_CENTS;
            } else {
                this.error = undefined;
                this.customPrice = newPrice;
            }
        }
    }

    private async handleSubmit() {
        const validation = this.validatePrice(this.customPrice);
        if (!validation.isValid || !this.customPrice) {
            this.error = validation.error ? {message: validation.error.message} : undefined;
            return;
        }

        this.showConfirmationModal = true;
    }

    private async confirmListing() {
        if (!this.customPrice) {
            this.error = {message: 'Price is required'};
            return;
        }

        this.handleConfirmationClose();

        try {
            this.isLoading = true;
            this.error = undefined;

            const request =
                this.listingType === 'buy_now'
                    ? {
                          type: 'buy_now' as const,
                          asset_id: this.asset.assetid,
                          price: this.customPrice,
                          private: this.isPrivate,
                          description: this.description || undefined,
                      }
                    : {
                          type: 'auction' as const,
                          asset_id: this.asset.assetid,
                          reserve_price: this.customPrice,
                          duration_days: this.auctionDuration,
                          private: this.isPrivate,
                          description: this.description || undefined,
                      };

            const response = await ClientSend(ListItem, request);

            if (!response.success) {
                throw new Error(response.error || 'Failed to list item');
            }

            this.listingId = response.id;
        } catch (error) {
            this.error = {
                message:
                    typeof error === 'string' ? error : 'Failed to list item. Make sure you are logged into CSFloat.',
            };
            console.error(error);
        } finally {
            this.isLoading = false;
        }
    }

    private async handleClose() {
        this.isClosing = true;
        await new Promise((resolve) => setTimeout(resolve, 200)); // Wait for animation
        this.dispatchEvent(
            new CustomEvent('close', {detail: this.listingId ? {listingId: this.listingId} : undefined})
        );
    }

    private async handleConfirmationClose() {
        this.isConfirmationClosing = true;
        await new Promise((resolve) => setTimeout(resolve, 200)); // Wait for animation
        this.showConfirmationModal = false;
        this.isConfirmationClosing = false;
    }

    private getPercentageAssessment(percentage: number): {label: string; color: string; icon: string} {
        if (percentage < 60) {
            return {
                label: 'Steal',
                color: '#27ff00',
                icon: STEAL_ICON,
            };
        } else if (percentage < 95) {
            return {
                label: 'Cheap',
                color: '#e9e20f',
                icon: CHEAP_ICON,
            };
        } else if (percentage < 104) {
            return {
                label: 'Recommended',
                color: '#64EC42',
                icon: RECOMMENDED_ICON,
            };
        } else {
            return {
                label: 'Expensive',
                color: '#f74712',
                icon: EXPENSIVE_ICON,
            };
        }
    }

    render(): HTMLTemplateResult {
        if (this.listingId) {
            return html`
                <div class="modal-backdrop ${this.isClosing ? 'closing' : ''}">
                    <div class="modal-content ${this.isClosing ? 'closing' : ''}">
                        <div class="success-content">
                            <div class="success-emoji">🎉</div>
                            <div class="success-title">Congrats on listing your item on CSFloat!</div>
                            <div class="success-links">
                                <a
                                    href="https://csfloat.com/item/${this.listingId}"
                                    target="_blank"
                                    class="base-button secondary-button"
                                >
                                    View ${this.listingType === 'buy_now' ? 'Listing' : 'Auction'}
                                </a>
                                <a
                                    href="https://csfloat.com/stall/me"
                                    target="_blank"
                                    class="base-button secondary-button"
                                >
                                    View Your Stall on CSFloat
                                </a>
                                <a href="${this.searchUrl}" target="_blank" class="base-button secondary-button">
                                    Search Similar Items
                                </a>
                            </div>
                            <button class="base-button primary-button success-button" @click="${this.handleClose}">
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        const pricePercentage =
            this.recommendedPrice && this.customPrice
                ? Math.round((this.customPrice / this.recommendedPrice) * 100)
                : 100;
        const percentageAssessment = this.getPercentageAssessment(pricePercentage);

        return html`
            <div
                class="modal-backdrop ${this.isClosing ? 'closing' : ''}"
                @click="${(e: Event) => {
                    if (e.target === e.currentTarget) this.handleClose();
                }}"
            >
                <div class="modal-content ${this.isClosing ? 'closing' : ''}">
                    <div class="modal-header">
                        <div class="modal-header-left">
                            <img class="modal-icon" src="https://csfloat.com/assets/karambit-icon.png" />
                            <div class="modal-header-text">
                                <h2 class="modal-title">List Item on CSFloat</h2>
                                <span class="modal-subtitle">
                                    Prefer the website? Visit it
                                    <a
                                        class="text-link"
                                        href="https://csfloat.com/sell"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        here</a
                                    >
                                </span>
                            </div>
                        </div>
                        <button class="close-button" @click="${this.handleClose}">×</button>
                    </div>

                    ${this.isInitialLoading
                        ? html` <div class="loading-skeleton">
                              <div class="skeleton skeleton-text" style="width: 100%"></div>
                              <div class="listing-type-selector">
                                  <div class="skeleton skeleton-button" style="width: 100%"></div>
                                  <div class="skeleton skeleton-button" style="width: 100%"></div>
                              </div>
                              <div class="price-section">
                                  <div class="skeleton skeleton-text" style="width: 100%"></div>
                                  <div class="skeleton skeleton-price" style="width: 100%"></div>
                                  <div class="skeleton skeleton-text" style="width: 100%"></div>
                              </div>
                              <div class="skeleton skeleton-button" style="width: 100%"></div>
                          </div>`
                        : html``}
                    ${this.error
                        ? html`<div class="error-container">
                              <div class="error-message">${this.error.message}</div>
                              ${this.error.cta
                                  ? html`<button
                                        @click="${() => {
                                            if (this.error?.ctaHref) {
                                                window.open(this.error?.ctaHref, '_blank');
                                            }
                                            this.handleClose();
                                        }}"
                                        class="base-button primary-button error-cta"
                                    >
                                        ${this.error.cta}
                                    </button>`
                                  : html``}
                          </div>`
                        : html``}
                    ${this.error?.cta || this.isInitialLoading
                        ? html``
                        : html`<div class="listing-type-selector">
                                  <button
                                      class="base-button secondary-button type-button ${this.listingType === 'buy_now'
                                          ? 'active'
                                          : ''}"
                                      @click="${() => (this.listingType = 'buy_now')}"
                                  >
                                      Buy Now
                                  </button>
                                  <button
                                      class="base-button secondary-button type-button ${this.listingType === 'auction'
                                          ? 'active'
                                          : ''}"
                                      @click="${() => (this.listingType = 'auction')}"
                                  >
                                      Auction
                                  </button>
                              </div>

                              ${this.listingType === 'auction'
                                  ? html`
                                        <div class="auction-info-banner">
                                            <span class="auction-info-icon" aria-hidden="true">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="18"
                                                    height="18"
                                                    viewBox="0 0 24 24"
                                                    style="vertical-align:middle;"
                                                >
                                                    <path
                                                        fill="#237bff"
                                                        d="M11 17h2v-6h-2zm1-8q.425 0 .713-.288T13 8t-.288-.712T12 7t-.712.288T11 8t.288.713T12 9m0 13q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22"
                                                    />
                                                </svg>
                                            </span>
                                            <span>
                                                See details about auctions
                                                <a
                                                    class="auction-info-link"
                                                    href="https://blog.csfloat.com/introducing-auctions-and-watchlists/"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    here
                                                </a>
                                            </span>
                                        </div>
                                    `
                                  : ''}
                              <div class="price-section">
                                  <div class="price-section-row">
                                      <label>
                                          Recommended Price in USD:
                                          ${this.recommendedPrice
                                              ? `$${(this.recommendedPrice / 100).toFixed(2)}`
                                              : 'N/A'}
                                      </label>
                                      <a href="${this.searchUrl}" target="_blank" class="text-link">
                                          Search Similar Items
                                      </a>
                                  </div>
                                  <div class="price-input-container">
                                      <span class="price-input-prefix">$</span>
                                      <input
                                          type="text"
                                          inputmode="decimal"
                                          class="price-input"
                                          .value="${this.customPrice ? this.formatInputPrice(this.customPrice) : ''}"
                                          @input="${this.handlePriceChange}"
                                          placeholder="${this.listingType === 'buy_now'
                                              ? 'Enter listing price in USD (max $100,000)'
                                              : 'Enter starting price in USD (max $100,000)'}"
                                      />
                                  </div>
                                  <input
                                      type="range"
                                      min="80"
                                      max="120"
                                      step="0.1"
                                      .value="${this.pricePercentage.toString()}"
                                      @input="${this.handlePercentageChange}"
                                      class="percentage-slider"
                                  />
                                  <div class="percentage-assessment-row">
                                      <div
                                          class="percentage-assessment-label"
                                          style="color: ${percentageAssessment.color};"
                                      >
                                          <div
                                              class="percentage-assessment-icon"
                                              .innerHTML="${percentageAssessment.icon}"
                                          ></div>
                                          ${percentageAssessment.label}
                                      </div>
                                      <span class="percentage-assessment-value"> ${pricePercentage}% </span>
                                  </div>

                                  <div class="visibility-row">
                                      <label>Visibility</label>
                                      <div class="visibility-selector">
                                          <button
                                              class="base-button secondary-button visibility-button ${!this.isPrivate
                                                  ? 'active'
                                                  : ''}"
                                              @click="${() => (this.isPrivate = false)}"
                                          >
                                              Public
                                          </button>
                                          <button
                                              class="base-button secondary-button visibility-button ${this.isPrivate
                                                  ? 'active'
                                                  : ''}"
                                              @click="${() => (this.isPrivate = true)}"
                                          >
                                              Private
                                          </button>
                                      </div>
                                  </div>

                                  <div class="description-row">
                                      <label>Description</label>
                                      ${this.showDescriptionInput
                                          ? html`
                                                <div class="description-input-container">
                                                    <input
                                                        type="text"
                                                        class="description-input"
                                                        .value="${this.description}"
                                                        @input="${(e: Event) => {
                                                            const input = e.target as HTMLInputElement;
                                                            if (input.value.length <= this.MAX_DESCRIPTION_LENGTH) {
                                                                this.description = input.value;
                                                            } else {
                                                                input.value = this.description;
                                                            }
                                                        }}"
                                                        placeholder="Item Description"
                                                        maxlength="${this.MAX_DESCRIPTION_LENGTH}"
                                                    />
                                                    <div
                                                        class="character-counter ${this.description.length ===
                                                        this.MAX_DESCRIPTION_LENGTH
                                                            ? 'limit-reached'
                                                            : ''}"
                                                    >
                                                        ${this.description.length}/${this.MAX_DESCRIPTION_LENGTH}
                                                    </div>
                                                </div>
                                            `
                                          : html`
                                                <button
                                                    class="base-button secondary-button add-description-button"
                                                    @click="${() => (this.showDescriptionInput = true)}"
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width="16"
                                                        height="16"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        stroke-width="2"
                                                        stroke-linecap="round"
                                                        stroke-linejoin="round"
                                                    >
                                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                                    </svg>
                                                </button>
                                            `}
                                  </div>

                                  ${this.listingType === 'auction'
                                      ? html`
                                            <div class="auction-settings">
                                                <label>Auction Duration</label>
                                                <div class="duration-selector">
                                                    ${this.DURATION_OPTIONS.map(
                                                        (option) => html`
                                                            <input
                                                                type="radio"
                                                                id="duration-${option.value}"
                                                                name="duration"
                                                                class="duration-radio"
                                                                value="${option.value}"
                                                                ?checked="${this.auctionDuration === option.value}"
                                                                @change="${(e: Event) =>
                                                                    (this.auctionDuration = Number(
                                                                        (e.target as HTMLInputElement).value
                                                                    ) as 1 | 3 | 7 | 14)}"
                                                            />
                                                            <label
                                                                for="duration-${option.value}"
                                                                class="duration-button"
                                                            >
                                                                ${option.label}
                                                            </label>
                                                        `
                                                    )}
                                                </div>
                                            </div>
                                        `
                                      : ''}
                              </div>

                              ${this.customPrice
                                  ? html`
                                        <div class="price-breakdown">
                                            <div class="price-breakdown-row">
                                                <span>Subtotal</span>
                                                <span>$${this.formatPrice(this.customPrice)}</span>
                                            </div>
                                            <div class="price-breakdown-row">
                                                <span>Sale Fee (${this.SALES_FEE_PERCENTAGE * 100}%)</span>
                                                <span>-$${this.formatPrice(this.getSaleFee(this.customPrice))}</span>
                                            </div>
                                            <div class="price-breakdown-row">
                                                <span>Total Earnings</span>
                                                <span
                                                    >$${this.formatPrice(
                                                        this.customPrice - this.getSaleFee(this.customPrice)
                                                    )}</span
                                                >
                                            </div>
                                        </div>
                                    `
                                  : ''}

                              <button
                                  class="base-button primary-button submit-button"
                                  ?disabled="${this.isLoading || !this.customPrice}"
                                  @click="${this.handleSubmit}"
                              >
                                  ${this.isLoading
                                      ? 'Listing...'
                                      : this.listingType === 'buy_now'
                                        ? 'List for Sale'
                                        : 'Start Auction'}
                              </button> `}
                </div>
                ${this.showConfirmationModal
                    ? html`
                          <div
                              class="modal-backdrop ${this.isConfirmationClosing ? 'closing' : ''}"
                              @click="${(e: Event) => {
                                  if (e.target === e.currentTarget) this.handleConfirmationClose();
                              }}"
                          >
                              <div
                                  class="confirmation-modal-content modal-content ${this.isConfirmationClosing
                                      ? 'closing'
                                      : ''}"
                              >
                                  <div class="confirmation-title">Are You Sure?</div>
                                  <div class="confirmation-buttons">
                                      <button
                                          class="base-button confirmation-button primary-button"
                                          ?disabled="${this.isLoading}"
                                          @click="${this.confirmListing}"
                                      >
                                          ${'Yes'}
                                      </button>
                                      <button
                                          class="base-button confirmation-button danger-button"
                                          ?disabled="${this.isLoading}"
                                          @click="${this.handleConfirmationClose}"
                                      >
                                          Cancel
                                      </button>
                                  </div>
                              </div>
                          </div>
                      `
                    : html``}
            </div>
        `;
    }
}
