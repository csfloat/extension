import {waitForTrue} from '../utils/observers';
import {inPageContext} from '../utils/snips';

export enum ConflictingMode {
    ONCE, // Hide conflicting elements only once at page load
    CONTINUOUS, // Continuously check and hide conflicting elements
}

/**
 * Decorator that applies CSS to DOM elements from conflicting extensions
 * @param selector CSS selector for elements to style
 * @param mode Whether to apply once or continuously
 * @param cssProps CSS properties to apply (defaults to display:none)
 */
export function StyleConflictingElement(
    selector: string,
    mode: ConflictingMode,
    cssProps: Record<string, string> = {display: 'none'}
): any {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        if (!inPageContext()) {
            return;
        }

        const hideElements = () => {
            $J(selector).each(function () {
                $J(this).css(cssProps);
            });
        };

        const checkAndHide = () => {
            return waitForTrue(() => $J(selector).length > 0).then((found) => {
                if (found) {
                    hideElements();
                }
                return found;
            });
        };

        switch (mode) {
            case ConflictingMode.ONCE:
                checkAndHide();
                break;
            case ConflictingMode.CONTINUOUS:
                // Initially check
                checkAndHide();
                // Then poll regularly
                setInterval(() => {
                    checkAndHide();
                }, 250);
                break;
        }
    };
}
