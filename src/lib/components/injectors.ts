import {customElement} from 'lit/decorators.js';
import {FloatElement} from "./custom";
import {inPageContext} from "../utils/snips";

export enum InjectionMode {
    // Injects once at page load for elements matching the selector
    ONCE,
    // Continually injects whenever new elements that match the
    // selector exist that haven't been injected into yet
    //
    // Should be use for "dynamic" elements
    CONTINUOUS
}

export function CustomElement(): any {
    return function (target: typeof FloatElement, propertyKey: string, descriptor: PropertyDescriptor) {
        if (!inPageContext()) {
            return;
        }
        customElement(target.tag())(target);
    };
}

function Inject(selector: string, mode: InjectionMode, op: (ctx: JQuery<HTMLElement>, target: typeof FloatElement) => void): any {
    return function (target: typeof FloatElement, propertyKey: string, descriptor: PropertyDescriptor) {
        if (!inPageContext()) {
            return;
        }
        switch (mode) {
            case InjectionMode.ONCE:
                $J(selector).each(function () { op($J(this), target); });
                break;
            case InjectionMode.CONTINUOUS:
                setInterval(() => {
                    $J(selector).each(function () {
                        // Don't add the item again if we already have
                        // Get the parent in case the op is after(), before(), etc...
                        if ($J(this).parent().find(target.tag()).length) return;

                        op($J(this), target);
                    });
                }, 250);
                break;
        }
    };
}

export function InjectAppend(selector: string, mode: InjectionMode = InjectionMode.ONCE): any {
    return Inject(selector, mode, ((ctx, target) => ctx.append(target.elem())));
}

export function InjectBefore(selector: string, mode: InjectionMode = InjectionMode.ONCE): any {
    return Inject(selector, mode, ((ctx, target) => ctx.before(target.elem())));
}

export function InjectAfter(selector: string, mode: InjectionMode = InjectionMode.ONCE): any {
    return Inject(selector, mode, ((ctx, target) => ctx.after(target.elem())));
}
