import {css} from 'lit';
import {FloatElement} from '../custom';

export const listItemModalStyles = [
    ...FloatElement.styles,
    css`
        /* Custom scrollbar styling */
        ::-webkit-scrollbar {
            width: 14px;
        }

        ::-webkit-scrollbar-track {
            background: rgba(21, 23, 28, 0.8);
        }

        ::-webkit-scrollbar-thumb {
            background: rgba(193, 206, 255, 0.2);
            border-radius: 7px;
            border: 3px solid rgba(21, 23, 28, 0.8);
        }

        ::-webkit-scrollbar-thumb:hover {
            background: rgba(193, 206, 255, 0.3);
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
                backdrop-filter: blur(0px);
                -webkit-backdrop-filter: blur(0px);
            }
            to {
                opacity: 1;
                backdrop-filter: blur(4px);
                -webkit-backdrop-filter: blur(4px);
            }
        }

        @keyframes fadeOut {
            from {
                opacity: 1;
                backdrop-filter: blur(4px);
                -webkit-backdrop-filter: blur(4px);
            }
            to {
                opacity: 0;
                backdrop-filter: blur(0px);
                -webkit-backdrop-filter: blur(0px);
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

        /* Override Steam's default font-family for inputs and buttons */
        .modal-content input,
        .modal-content button {
            font-family: inherit;
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
            gap: 16px;
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
            color: #FFFFFF;
            width: 100%;
            padding-left: 10px;
            padding-top: 10px;
            padding-bottom: 10px;
            background: #FF4444;
            margin-top: 16px;
            border-radius: 6px;
            box-sizing: border-box;
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
            justify-content: space-between;
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
            padding: 0;
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

        .success-links a {
            text-decoration: none;
        }

        .success-button {
            width: 100%;
        }

        .divider {
            border-top: 1px solid #4b5f73;
            margin: 20px 0;
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

        @keyframes shimmer {
            0% {
                background-position: -1000px 0;
            }
            100% {
                background-position: 1000px 0;
            }
        }

        .skeleton {
            background: linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%);
            background-size: 1000px 100%;
            animation: shimmer 2s infinite linear;
            border-radius: 4px;
        }

        .skeleton-text {
            height: 20px;
            margin: 10px 0;
        }

        .skeleton-price {
            height: 40px;
            margin: 15px 0;
        }

        .skeleton-button {
            height: 36px;
            width: 120px;
            margin: 10px 0;
        }

        .error-container {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .error-cta {
            text-decoration: none;
            width: 100%;
            text-align: center;
            box-sizing: border-box;
        }
    `,
];
