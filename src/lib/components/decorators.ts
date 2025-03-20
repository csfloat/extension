import {inPageContext} from '../utils/snips';

export enum ConflictingMode {
    ONCE, // Hide conflicting elements only once when found
    CONTINUOUS, // Continuously check and hide conflicting elements
}

type CSSProperties = JQuery.PlainObject<
    string | number | ((this: HTMLElement, index: number, value: string) => string | number | void | undefined)
>;

/**
 * Decorator that applies CSS to DOM elements from conflicting extensions
 * @param selector CSS selector for elements to style
 * @param mode Whether to apply once or continuously
 * @param cssProps CSS properties to apply
 */
export function StyleConflictingElement(selector: string, mode: ConflictingMode, cssProps: CSSProperties): any {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        if (!inPageContext()) {
            return;
        }

        const hideElements = () => {
            $J(selector).each(function () {
                $J(this).css(cssProps);
            });
        };

        const checkAndHide = async () => {
            const found = $J(selector).length > 0;
            if (found) {
                hideElements();
            }
            return found;
        };

        const interval = setInterval(async () => {
            const result = await checkAndHide();
            if (result && mode === ConflictingMode.ONCE) {
                clearInterval(interval);
            }
        }, 250);
    };
}

export function HideConflictingElement(selector: string, mode: ConflictingMode = ConflictingMode.ONCE) {
    return StyleConflictingElement(selector, mode, {display: 'none'});
}
