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
import {isLoggedIntoCSFloat} from '../../utils/auth';

@CustomElement()
export class ListItemModal extends FloatElement {
    @property()
    itemInfo!: ItemInfo;

    @property()
    asset!: InventoryAsset;

    @state()
    private recommendedPrice: number | undefined;

    @state()
    private listingType: 'buy_now' | 'auction' = 'buy_now';

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

    private readonly MAX_PRICE_CENTS = 100000 * 100; // $100,000

    private readonly SALES_FEE_PERCENTAGE = 0.02;

    private readonly DURATION_OPTIONS = [
        {value: 1, label: '1 Day'},
        {value: 3, label: '3 Days'},
        {value: 7, label: '7 Days'},
        {value: 14, label: '14 Days'},
    ] as const;

    static styles = [...listItemModalStyles];

    async connectedCallback() {
        super.connectedCallback();

        // Prevent background scrolling
        document.body.style.overflow = 'hidden';
        document.body.style.paddingRight = 'var(--scrollbar-width)';

        try {
            this.isInitialLoading = true;
            const isLoggedIn = await isLoggedIntoCSFloat();
            // Throw error if not logged in
            if (!isLoggedIn) {
                throw new Error('Not logged in');
            }
        } catch (error) {
            this.error = {
                message: 'Please log into CSFloat before listing items',
                cta: 'Log into CSFloat',
                ctaHref: 'https://csfloat.com/',
            };
        }

        try {
            await this.fetchRecommendedPrice();
            if (!this.recommendedPrice) {
                throw new Error('Could not fetch recommended price');
            }
        } catch (error) {
            console.error('Failed to fetch recommended price:', error);
        } finally {
            this.isInitialLoading = false;

            // Set initial slider progress after initial loading is done
            requestAnimationFrame(() => {
                const slider = this.shadowRoot?.querySelector('.percentage-slider') as HTMLInputElement;
                if (slider) {
                    slider.style.setProperty('--slider-percentage', '50');
                }
            });
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();

        // Restore background scrolling
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';

        // Reload window if listed
        if (this.listingId) {
            window.location.reload();
        }
    }

    async fetchRecommendedPrice() {
        // Skip if we already have a price
        if (this.recommendedPrice !== undefined) {
            return;
        }

        try {
            const response = await ClientSend(FetchRecommendedPrice, {
                market_hash_name: this.asset.description.market_hash_name,
            });

            this.recommendedPrice = response.price;
            this.customPrice = this.recommendedPrice;
        } catch (error: unknown) {
            this.error = {
                message: error instanceof Error ? error.message : 'Failed to fetch price. Please try again later.',
                cta: 'Done',
            };
            throw error; // Re-throw to handle in connectedCallback
        }
    }

    private validatePrice(price: number | undefined): {isValid: boolean; error?: {message: string}} {
        if (!price || isNaN(price) || price <= 0) {
            return {isValid: false, error: {message: 'Please enter a valid price greater than $0.00'}};
        }

        if (price > this.MAX_PRICE_CENTS) {
            return {isValid: false, error: {message: 'Price cannot exceed $100,000 USD'}};
        }

        return {isValid: true};
    }

    private updatePrice(price: number) {
        const validation = this.validatePrice(price);
        if (!validation.isValid) {
            this.error = validation.error;
            this.customPrice = undefined;
            return;
        }

        this.error = undefined;
        this.customPrice = price;
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
        if (dollars * 100 > this.MAX_PRICE_CENTS) {
            input.value = (this.MAX_PRICE_CENTS / 100).toString();
            this.updatePrice(this.MAX_PRICE_CENTS);
        } else {
            const cents = Math.ceil(dollars * 100);
            this.updatePrice(Math.max(1, cents));
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
            this.updatePrice(newPrice);
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
                      }
                    : {
                          type: 'auction' as const,
                          asset_id: this.asset.assetid,
                          reserve_price: this.customPrice,
                          duration_days: this.auctionDuration,
                      };

            const response = await ClientSend(ListItem, request);

            if (!response.success) {
                throw new Error(response.error || 'Failed to list item');
            }

            this.listingId = response.id;
        } catch (error) {
            this.error = {
                message:
                    error instanceof Error
                        ? error.message
                        : 'Failed to list item. Make sure you are logged into CSFloat.',
            };
            console.error(error);
        } finally {
            this.isLoading = false;
        }
    }

    private async handleClose() {
        this.isClosing = true;
        await new Promise((resolve) => setTimeout(resolve, 200)); // Wait for animation
        this.dispatchEvent(new CustomEvent('close'));
    }

    private async handleConfirmationClose() {
        this.isConfirmationClosing = true;
        await new Promise((resolve) => setTimeout(resolve, 200)); // Wait for animation
        this.showConfirmationModal = false;
        this.isConfirmationClosing = false;
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
                                    class="base-button secondary-button success-link"
                                >
                                    View ${this.listingType === 'buy_now' ? 'Listing' : 'Auction'}
                                </a>
                                <a
                                    href="https://csfloat.com/stall/me"
                                    target="_blank"
                                    class="base-button secondary-button success-link"
                                >
                                    View Your Stall on CSFloat
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
                            <h2 class="modal-title">List Item on CSFloat</h2>
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

                              <div class="price-section">
                                  <label>
                                      Recommended Price:
                                      ${this.recommendedPrice ? `$${(this.recommendedPrice / 100).toFixed(2)}` : 'N/A'}
                                  </label>
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
                                      .value="${this.pricePercentage}"
                                      @input="${this.handlePercentageChange}"
                                      class="percentage-slider"
                                  />
                                  <div>
                                      Percentage of recommended price:
                                      ${this.recommendedPrice && this.customPrice
                                          ? Math.round((this.customPrice / this.recommendedPrice) * 100)
                                          : 100}%
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
