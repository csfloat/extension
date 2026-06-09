import {customElement} from 'lit/decorators.js';
import {FloatElement} from './custom';
import {inPageContext} from '../utils/snips';

export enum InjectionMode {
    // Injects once at page load for elements matching the selector
    ONCE,
    // Continually injects whenever new elements that match the
    // selector exist that haven't been injected into yet
    //
    // Should be use for "dynamic" elements
    CONTINUOUS,
}

enum InjectionType {
    Append,
    Before,
    After,
}

interface InjectionConfig {
    exists: (ctx: HTMLElement, selector: string) => boolean;
    op: (ctx: HTMLElement, target: typeof FloatElement) => void;
}

type InjectionGuard = () => boolean;

const InjectionConfigs: {[key in InjectionType]: InjectionConfig} = {
    [InjectionType.Append]: {
        exists: (anchor, selector) => Array.from(anchor.children).some((child) => child.matches(selector)),
        op: (anchor, target) => anchor.appendChild(target.elem()),
    },
    [InjectionType.Before]: {
        exists: (anchor, selector) => hasSiblingMatching(anchor, 'previousElementSibling', selector),
        op: (anchor, target) => anchor.before(target.elem()),
    },
    [InjectionType.After]: {
        exists: (anchor, selector) => hasSiblingMatching(anchor, 'nextElementSibling', selector),
        op: (anchor, target) => anchor.after(target.elem()),
    },
};

/** Checks if any sibling of `anchor` in the given direction matches the selector. */
function hasSiblingMatching(
    anchor: HTMLElement,
    direction: keyof Pick<HTMLElement, 'previousElementSibling' | 'nextElementSibling'>,
    selector: string
): boolean {
    for (let el = anchor[direction]; el; el = el[direction]) {
        if (el.matches(selector)) return true;
    }
    return false;
}

export function CustomElement(): any {
    return function (target: typeof FloatElement, propertyKey: string, descriptor: PropertyDescriptor) {
        if (!inPageContext()) {
            return;
        }

        if (customElements.get(target.tag())) {
            // Already defined
            return;
        }

        customElement(target.tag())(target);
    };
}

const canInject = (guard?: InjectionGuard) => (guard ? guard() : true);

function Inject(selector: string, mode: InjectionMode, type: InjectionType, guard?: InjectionGuard): any {
    return function (target: typeof FloatElement, propertyKey: string, descriptor: PropertyDescriptor) {
        if (!inPageContext()) {
            return;
        }
        if (!canInject(guard)) {
            return;
        }

        switch (mode) {
            case InjectionMode.ONCE:
                document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
                    InjectionConfigs[type].op(el, target);
                });
                break;
            case InjectionMode.CONTINUOUS:
                setInterval(() => {
                    if (!canInject(guard)) {
                        return;
                    }

                    document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
                        // Don't add the item again if we already have
                        if (InjectionConfigs[type].exists(el, target.tag())) return;

                        InjectionConfigs[type].op(el, target);
                    });
                }, 250);
                break;
        }
    };
}

export function InjectAppend(selector: string, mode: InjectionMode = InjectionMode.ONCE, guard?: InjectionGuard): any {
    return Inject(selector, mode, InjectionType.Append, guard);
}

export function InjectBefore(selector: string, mode: InjectionMode = InjectionMode.ONCE, guard?: InjectionGuard): any {
    return Inject(selector, mode, InjectionType.Before, guard);
}

export function InjectAfter(selector: string, mode: InjectionMode = InjectionMode.ONCE, guard?: InjectionGuard): any {
    return Inject(selector, mode, InjectionType.After, guard);
}
