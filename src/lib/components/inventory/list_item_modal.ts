import {FloatElement} from '../custom';
import {CustomElement} from '../injectors';
import {html, css, HTMLTemplateResult} from 'lit';
import {property, state} from 'lit/decorators.js';
import {ItemInfo} from '../../bridge/handlers/fetch_inspect_info';
import {InventoryAsset} from '../../types/steam';
import {ClientSend} from '../../bridge/client';
import {ListItem} from '../../bridge/handlers/list_item';
import {FetchRecommendedPrice} from '../../bridge/handlers/fetch_recommended_price';

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
    private error: string | undefined;

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

    static styles = [
        ...FloatElement.styles,
        css`
            :host {
                --scrollbar-width: ${window.innerWidth - document.documentElement.clientWidth}px;
            }

            .modal-backdrop {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6);
                z-index: 1000;
                display: flex;
                justify-content: center;
                align-items: center;
                opacity: 0;
                animation: fadeIn 0.2s ease forwards;
            }

            @keyframes fadeIn {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }

            @keyframes fadeOut {
                from {
                    opacity: 1;
                }
                to {
                    opacity: 0;
                }
            }

            @keyframes modalIn {
                from {
                    opacity: 0;
                    transform: scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: scale(1);
                }
            }

            @keyframes modalOut {
                from {
                    opacity: 1;
                    transform: scale(1);
                }
                to {
                    opacity: 0;
                    transform: scale(0.95);
                }
            }

            .modal-backdrop.closing {
                animation: fadeOut 0.2s ease forwards;
            }

            .modal-content {
                background: rgba(21, 23, 28, 0.8);
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                padding: 20px;
                width: 500px;
                max-width: 90%;
                font-family: Roboto, "Helvetica Neue", sans-serif;
                border-width: 2px;
                border-style: solid;
                border-color: rgba(193, 206, 255, 0.07);
                border-radius: 12px;
                box-shadow: rgba(15, 15, 15, 0.6) 0px 0px 12px 8px;
                opacity: 0;
                transform: scale(0.95);
                animation: modalIn 0.2s ease forwards;
            }

            .modal-content.closing {
                animation: modalOut 0.2s ease forwards;
            }

            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: start;
                margin-bottom: 20px;
            }

            .modal-header-left {
                display: flex;
                align-items: center;
            }

            .modal-icon {
                display: block;
                width: 40px;
                height: 40px;
                padding: 10px;
                background-color: rgba(35, 123, 255, 0.15);
                border-radius: 10px;
                object-fit: contain;
            }

            .modal-title {
                margin: 0;
                font-size: 28px;
                color: #ffffff;
            }

            .close-button {
                background: none;
                border: none;
                color: #ffffff;
                font-size: 28px;
                cursor: pointer;
            }

            .price-section {
                margin-bottom: 20px;
                color: rgba(255, 255, 255, 0.8);
                font-size: 14px;
            }

            .price-input-container {
                position: relative;
                margin-top: 8px;
            }

            .price-input-prefix {
                position: absolute;
                left: 18px;
                top: 50%;
                transform: translateY(-50%);
                color: rgba(255, 255, 255, 0.8);
                font-size: 20px;
                pointer-events: none;
            }

            .price-input {
                width: 100%;
                box-sizing: border-box;
                padding: 12px;
                padding-left: 40px;
                background: rgba(193, 206, 255, .04);
                border: none;
                border-radius: 10px;
                color: #FFFFFF;
                font-size: 20px;
                font-weight: 500;
                transition: background 0.2s ease;
            }

            .price-input::placeholder {
                color: rgba(255, 255, 255, 0.4);
            }

            .price-input::-webkit-outer-spin-button,
            .price-input::-webkit-inner-spin-button {
                -webkit-appearance: none;
                margin: 0;
            }

            .price-input[type='number'] {
                -moz-appearance: textfield;
            }

            .price-input[type='text'] {
                color: #FFFFFF;
                border: none;
                border-radius: 10px;
                background: rgba(193, 206, 255, .04);
            }

            .price-input[type='text']:focus {
                outline: none;
                background: rgba(193, 206, 255, .07);
            }

            .percentage-slider {
                width: 100%;
                margin: 16px 0;
                height: 8px;
                background: rgba(35, 123, 255, 0.15);
                border-radius: 4px;
                -webkit-appearance: none;
                appearance: none;
                cursor: pointer;
                outline: none;
                position: relative;
            }

            .percentage-slider::before {
                content: '';
                position: absolute;
                height: 100%;
                width: calc(var(--slider-percentage, 100) * 1%);
                background-color: rgb(35, 123, 255);
                border-radius: 4px;
                pointer-events: none;
            }

            .percentage-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: rgb(35, 123, 255);
                cursor: pointer;
                box-shadow: 0 2px 6px rgba(35, 123, 255, 0.3);
                margin-top: -6px;
                position: relative;
                z-index: 1;
            }

            .percentage-slider::-webkit-slider-runnable-track {
                width: 100%;
                height: 8px;
                border-radius: 4px;
                background: transparent;
            }

            .percentage-slider::-moz-range-thumb {
                width: 20px;
                height: 20px;
                border: none;
                border-radius: 50%;
                background: rgb(35, 123, 255);
                cursor: pointer;
                box-shadow: 0 2px 6px rgba(35, 123, 255, 0.3);
                position: relative;
                z-index: 1;
            }

            .percentage-slider::-moz-range-track {
                width: 100%;
                height: 8px;
                border-radius: 4px;
                background: transparent;
            }

            .percentage-slider::-webkit-slider-thumb:hover,
            .percentage-slider::-moz-range-thumb:hover {
                transform: scale(1.2);
            }

            .error-message {
                color: #ff4444;
                margin-top: 10px;
            }

            .price-breakdown {
                margin: 24px 0;
            }

            .price-breakdown-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
                color: rgb(158, 167, 177)
                font-size: 16px;
            }

            .price-breakdown-row:last-child {
                margin-bottom: 0;
                padding-top: 8px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                color: #FFFFFF;
                font-size: 20px
            }

            .price-breakdown-row.fee {
                color: rgba(255, 0, 0, 0.8);
            }

            .submit-button {
                width: 100%;
                padding: 12px;
            }

            .listing-type-selector {
                margin-bottom: 24px;
                display: flex;
                gap: 12px;
            }

            .type-button {
                flex: 1;
            }

            .type-button.active {
                background: rgb(35, 123, 255);
                color: white;
                box-shadow: 0 4px 12px rgba(35, 123, 255, 0.3);
            }

            .auction-settings {
                margin-top: 24px;
            }

            .duration-selector {
                display: flex;
                gap: 12px;
                margin-top: 12px;
            }

            .duration-radio {
                display: none;
            }

            .duration-button {
                flex: 1;
                padding: 10px;
                text-align: center;
                background: rgba(35, 123, 255, 0.1);
                border: none;
                border-radius: 8px;
                color: rgba(255, 255, 255, 0.8);
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .duration-button:hover {
                background: rgba(35, 123, 255, 0.15);
                transform: translateY(-1px);
            }

            .duration-radio:checked + .duration-button {
                background: rgb(35, 123, 255);
                color: white;
                box-shadow: 0 4px 12px rgba(35, 123, 255, 0.3);
            }

            .description-input {
                width: 100%;
                padding: 8px;
                margin-top: 5px;
                background: #2a475e;
                border: 1px solid #000000;
                color: #ffffff;
                resize: vertical;
                min-height: 60px;
            }

            .checkbox-container {
                margin-top: 10px;
                display: flex;
                align-items: center;
                gap: 5px;
            }

            .success-content {
                text-align: center;
                padding: 20px 0;
            }

            .success-emoji {
                font-size: 48px;
                margin-bottom: 10px;
            }

            .success-title {
                font-size: 18px;
                color: #ffffff;
                margin-bottom: 20px;
            }

            .success-links {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-bottom: 20px;
            }

            .success-link {
                padding: 10px;
                background: #2a475e;
                border: 1px solid #000000;
                border-radius: 4px;
                color: #ffffff;
                text-decoration: none;
                transition: background-color 0.2s;
            }

            .success-link:hover {
                background: #3d6c8d;
            }

            .divider {
                border-top: 1px solid #4b5f73;
                margin: 20px 0;
            }

            .close-modal-button {
                width: 100%;
                padding: 10px;
                background: #2a475e;
                border: none;
                border-radius: 4px;
                color: #ffffff;
                font-size: 16px;
                cursor: pointer;
                transition: background-color 0.2s;
            }

            .close-modal-button:hover {
                background: #3d6c8d;
            }

            .tradable-warning {
                background: rgba(255, 0, 0, 0.1);
                border: 1px solid #ff4444;
                border-radius: 4px;
                padding: 15px;
                margin-bottom: 20px;
                color: #ff4444;
                text-align: center;
            }

            .confirmation-modal-content {
                display: flex;
                flex-direction: column;
                gap: 20px;
                width: 200px;
                opacity: 0;
                transform: scale(0.95);
                animation: modalIn 0.2s ease forwards;
            }

            .confirmation-title {
                font-size: 20px;
                color: #ffffff;
                text-align: center;
                font-weight: 700;
            }

            .confirmation-buttons {
                display: flex;
                gap: 8px;
            }

            .confirmation-button {
                flex: 1;
            }

            .confirmation-button.confirm {
                background: rgb(35, 123, 255);
                color: white;
            }

            .confirmation-button.confirm:hover {
                background: rgb(29, 100, 209);
            }

            .confirmation-button.cancel {
                background: rgba(255, 255, 255, 0.1);
                color: white;
            }

            .confirmation-button.cancel:hover {
                background: rgba(255, 255, 255, 0.15);
            }

            .base-button {
                padding: 10px;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .base-button:disabled {
                background: rgba(35, 123, 255, 0.1);
                color: rgba(255, 255, 255, 0.5);
                box-shadow: none;
                cursor: not-allowed;
                transform: none;
            }

            .primary-button {
                background: rgb(35, 123, 255);
                color: white;
                box-shadow: 0 4px 12px rgba(35, 123, 255, 0.3);
            }

            .primary-button:hover:not(:disabled) {
                background: rgb(29, 100, 209);
                transform: translateY(-1px);
            }

            .secondary-button {
                background: rgba(35, 123, 255, 0.1);
                color: rgba(255, 255, 255, 0.8);
            }

            .secondary-button:hover:not(:disabled) {
                background: rgba(35, 123, 255, 0.15);
                transform: translateY(-1px);
            }

            .danger-button {
                background: #ff4444;
                color: white;
            }

            .danger-button:hover:not(:disabled) {
                background: #cc3333;
                transform: translateY(-1px);
            }
        `,
    ];

    async connectedCallback() {
        super.connectedCallback();
        // Set initial slider progress
        requestAnimationFrame(() => {
            const slider = this.shadowRoot?.querySelector('.percentage-slider') as HTMLInputElement;
            if (slider) {
                slider.style.setProperty('--slider-percentage', '50');
            }
        });

        // Prevent background scrolling
        document.body.style.overflow = 'hidden';
        document.body.style.paddingRight = 'var(--scrollbar-width)';

        try {
            await this.fetchRecommendedPrice();
            if (!this.recommendedPrice) {
                throw new Error('Could not fetch recommended price');
            }
        } catch (error) {
            console.error('Failed to fetch recommended price:', error);
            this.handleClose();
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
            this.isLoading = true;

            const response = await ClientSend(FetchRecommendedPrice, {
                market_hash_name: this.asset.description.market_hash_name,
            });

            this.recommendedPrice = response.price;
            this.customPrice = this.recommendedPrice;
        } catch (error: unknown) {
            this.error = error instanceof Error ? error.message : 'Failed to fetch recommended price';
            throw error; // Re-throw to handle in connectedCallback
        } finally {
            this.isLoading = false;
        }
    }

    private validatePrice(price: number | undefined): {isValid: boolean; error?: string} {
        if (!price || isNaN(price) || price <= 0) {
            return {isValid: false, error: 'Please enter a valid price greater than $0.00'};
        }

        if (price > this.MAX_PRICE_CENTS) {
            return {isValid: false, error: 'Price cannot exceed $100,000 USD'};
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
            this.error = validation.error;
            return;
        }

        this.showConfirmationModal = true;
    }

    private async confirmListing() {
        if (!this.customPrice) {
            this.error = 'Price is required';
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
            this.error =
                error instanceof Error ? error.message : 'Failed to list item. Make sure you are logged into CSFloat.';
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
                                    class="success-link"
                                >
                                    View ${this.listingType === 'buy_now' ? 'Listing' : 'Auction'}
                                </a>
                                <a href="https://csfloat.com/stall/me" target="_blank" class="success-link">
                                    View Your Stall on CSFloat
                                </a>
                            </div>
                            <button class="close-modal-button" @click="${this.handleClose}">Done</button>
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

                    <div class="listing-type-selector">
                        <button
                            class="base-button secondary-button type-button ${this.listingType === 'buy_now'
                                ? 'active'
                                : ''}"
                            @click="${() => (this.listingType = 'buy_now')}"
                        >
                            Buy Now
                        </button>
                        <button
                            class="type-button ${this.listingType === 'auction' ? 'active' : ''}"
                            @click="${() => (this.listingType = 'auction')}"
                        >
                            Auction
                        </button>
                    </div>

                    <div class="price-section">
                        <label>
                            Recommended Price:
                            ${this.isLoading
                                ? 'Loading...'
                                : this.recommendedPrice
                                ? `$${(this.recommendedPrice / 100).toFixed(2)}`
                                : 'N/A'}
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
                                                  <label for="duration-${option.value}" class="duration-button">
                                                      ${option.label}
                                                  </label>
                                              `
                                          )}
                                      </div>
                                  </div>
                              `
                            : ''}
                    </div>

                    ${this.error ? html`<div class="error-message">${this.error}</div>` : ''}
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
                    </button>
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
