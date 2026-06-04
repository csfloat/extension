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
    exists: (ctx: JQuery<HTMLElement>, selector: string) => boolean;
    op: (ctx: JQuery<HTMLElement>, target: typeof FloatElement) => void;
}

type InjectionGuard = () => boolean;

const InjectionConfigs: {[key in InjectionType]: InjectionConfig} = {
    [InjectionType.Append]: {
        exists: (ctx, selector) => !!ctx.children(selector).length,
        op: (ctx, target) => ctx.append(target.elem()),
    },
    [InjectionType.Before]: {
        exists: (ctx, selector) => !!ctx.parent().children(selector).length,
        op: (ctx, target) => ctx.before(target.elem()),
    },
    [InjectionType.After]: {
        exists: (ctx, selector) => !!ctx.parent().children(selector).length,
        op: (ctx, target) => ctx.after(target.elem()),
    },
};

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
                $J(selector).each(function () {
                    InjectionConfigs[type].op($J(this), target);
                });
                break;
            case InjectionMode.CONTINUOUS:
                setInterval(() => {
                    if (!canInject(guard)) {
                        return;
                    }

                    $J(selector).each(function () {
                        // Don't add the item again if we already have
                        if (InjectionConfigs[type].exists($J(this), target.tag())) return;

                        InjectionConfigs[type].op($J(this), target);
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
