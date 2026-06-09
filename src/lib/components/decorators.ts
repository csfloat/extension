import {inPageContext} from '../utils/snips';

export enum ConflictingExtension {
    CS2_TRADER,
    SIH,
}

export enum ConflictingMode {
    ONCE, // Hide conflicting elements only once when found
    CONTINUOUS, // Continuously check and hide conflicting elements
}

type CSSProperties = Record<string, string | number>;

/**
 * Decorator that applies CSS to DOM elements from conflicting extensions
 * @param selector CSS selector for elements to style
 * @param mode Whether to apply once or continuously
 * @param cssProps CSS properties to apply
 */
export function StyleConflictingElement(
    extension: ConflictingExtension,
    selector: string,
    mode: ConflictingMode,
    cssProps: CSSProperties
): any {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        if (!inPageContext()) {
            return;
        }

        const checkAndStyle = () => {
            const elements = document.querySelectorAll<HTMLElement>(selector);
            for (const el of elements) {
                for (const [prop, value] of Object.entries(cssProps)) {
                    el.style.setProperty(prop, String(value));
                }
            }
            return elements.length > 0;
        };

        const interval = setInterval(() => {
            if (checkAndStyle() && mode === ConflictingMode.ONCE) {
                clearInterval(interval);
            }
        }, 250);
    };
}

export function HideConflictingElement(
    extension: ConflictingExtension,
    selector: string,
    mode: ConflictingMode = ConflictingMode.ONCE
) {
    return StyleConflictingElement(extension, selector, mode, {display: 'none'});
}
