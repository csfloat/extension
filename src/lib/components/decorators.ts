import {inPageContext} from '../utils/snips';
import {isSteamMarketMode, SteamMarketMode} from './market/mode';

export enum ConflictingExtension {
    CS2_TRADER,
    SIH,
}

export enum ConflictingMode {
    ONCE, // Hide conflicting elements only once when found
    CONTINUOUS, // Continuously check and hide conflicting elements
}

type CSSProperties = JQuery.PlainObject<
    string | number | ((this: HTMLElement, index: number, value: string) => string | number | void | undefined)
>;

type DecoratorGuard = (() => boolean) | SteamMarketMode;

function matchesGuard(guard?: DecoratorGuard): boolean {
    if (!guard) {
        return true;
    }
    if (typeof guard === 'function') {
        return guard();
    }

    return isSteamMarketMode(guard);
}

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
    cssProps: CSSProperties,
    guard?: DecoratorGuard
): any {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        if (!inPageContext()) {
            return;
        }
        if (typeof $J !== 'function' || !matchesGuard(guard)) {
            return;
        }

        const styleElements = () => {
            $J(selector).each(function () {
                $J(this).css(cssProps);
            });
        };

        const checkAndStyle = async () => {
            const found = $J(selector).length > 0;
            if (found) {
                styleElements();
            }
            return found;
        };

        const interval = setInterval(async () => {
            if (typeof $J !== 'function' || !matchesGuard(guard)) {
                clearInterval(interval);
                return;
            }

            const result = await checkAndStyle();
            if (result && mode === ConflictingMode.ONCE) {
                clearInterval(interval);
            }
        }, 250);
    };
}

export function HideConflictingElement(
    extension: ConflictingExtension,
    selector: string,
    mode: ConflictingMode = ConflictingMode.ONCE,
    guard?: DecoratorGuard
) {
    return StyleConflictingElement(extension, selector, mode, {display: 'none'}, guard);
}
