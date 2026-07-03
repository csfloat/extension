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

export enum InjectionPosition {
    Before = 'beforebegin',
    Prepend = 'afterbegin',
    Append = 'beforeend',
    After = 'afterend',
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
type MaybePromise<T> = T | Promise<T>;
type InjectionContextResult<TContext> = TContext | null | undefined;
type InjectionContextBuilder<TContext> = (scope: HTMLElement) => MaybePromise<InjectionContextResult<TContext>>;

export interface ScopedInjectionArgs<TContext> {
    scope: HTMLElement;
    context: TContext;
}

export interface InjectionScope<TContext> {
    selector: string;
    mode: InjectionMode;
    guard?: InjectionGuard;
    context: InjectionContextBuilder<TContext>;
    state: InjectionScopeState<TContext>;
}

interface InjectionScopeState<TContext> {
    contextCache: WeakMap<HTMLElement, Promise<InjectionContextResult<TContext>>>;
    completed: WeakMap<HTMLElement, Map<string, Element | null>>;
    inFlight: WeakMap<HTMLElement, Set<string>>;
}

export interface InjectionScopeConfig<TContext> {
    selector: string;
    mode?: InjectionMode;
    guard?: InjectionGuard;
    context: InjectionContextBuilder<TContext>;
}

export interface ScopedInjectionConfig<TContext> {
    anchor: (args: ScopedInjectionArgs<TContext>) => HTMLElement | null | undefined;
    position?: InjectionPosition;
}

type ScopedElement<TContext> = FloatElement & {
    injectionContext?: TContext;
};

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

function assertNever(value: never): never {
    throw new Error(`Unhandled injection mode: ${value}`);
}

export function defineInjectionScope<TContext>(config: InjectionScopeConfig<TContext>): InjectionScope<TContext> {
    return {
        ...config,
        mode: config.mode ?? InjectionMode.ONCE,
        state: {
            contextCache: new WeakMap(),
            completed: new WeakMap(),
            inFlight: new WeakMap(),
        },
    };
}

function getTagSet(map: WeakMap<HTMLElement, Set<string>>, scope: HTMLElement): Set<string> {
    let tags = map.get(scope);
    if (!tags) {
        tags = new Set();
        map.set(scope, tags);
    }
    return tags;
}

function hasTag(map: WeakMap<HTMLElement, Set<string>>, scope: HTMLElement, tag: string): boolean {
    return map.get(scope)?.has(tag) ?? false;
}

function addTag(map: WeakMap<HTMLElement, Set<string>>, scope: HTMLElement, tag: string): void {
    getTagSet(map, scope).add(tag);
}

function deleteTag(map: WeakMap<HTMLElement, Set<string>>, scope: HTMLElement, tag: string): void {
    map.get(scope)?.delete(tag);
}

function getCompletedMap(
    map: WeakMap<HTMLElement, Map<string, Element | null>>,
    scope: HTMLElement
): Map<string, Element | null> {
    let tags = map.get(scope);
    if (!tags) {
        tags = new Map();
        map.set(scope, tags);
    }
    return tags;
}

function hasCompletedInjection<TContext>(
    injectionScope: InjectionScope<TContext>,
    scope: HTMLElement,
    tag: string
): boolean {
    const element = injectionScope.state.completed.get(scope)?.get(tag);
    if (element === undefined) return false;
    if (element === null) return true;
    if (element.isConnected) return true;

    injectionScope.state.completed.get(scope)?.delete(tag);
    return false;
}

function addCompletedInjection<TContext>(
    injectionScope: InjectionScope<TContext>,
    scope: HTMLElement,
    tag: string,
    element: Element | null
): void {
    getCompletedMap(injectionScope.state.completed, scope).set(tag, element);
}

async function getScopeContext<TContext>(
    injectionScope: InjectionScope<TContext>,
    scope: HTMLElement
): Promise<InjectionContextResult<TContext>> {
    const cached = injectionScope.state.contextCache.get(scope);
    if (cached) return cached;

    const context = Promise.resolve()
        .then(() => injectionScope.context(scope))
        .then((result) => {
            if (result === undefined) {
                injectionScope.state.contextCache.delete(scope);
                return result;
            }

            injectionScope.state.contextCache.set(scope, Promise.resolve(result));
            return result;
        })
        .catch((e) => {
            injectionScope.state.contextCache.delete(scope);
            throw e;
        });

    injectionScope.state.contextCache.set(scope, context);
    return context;
}

async function injectIntoScope<TContext>(
    scope: HTMLElement,
    target: typeof FloatElement,
    injectionScope: InjectionScope<TContext>,
    config: ScopedInjectionConfig<TContext>
): Promise<void> {
    const tag = target.tag();
    if (hasCompletedInjection(injectionScope, scope, tag) || hasTag(injectionScope.state.inFlight, scope, tag)) {
        return;
    }

    addTag(injectionScope.state.inFlight, scope, tag);

    try {
        const context = await getScopeContext(injectionScope, scope);
        if (context === undefined) return;
        if (context === null) {
            addCompletedInjection(injectionScope, scope, tag, null);
            return;
        }

        const anchor = config.anchor({scope, context});
        if (anchor === undefined) return;
        if (anchor === null) {
            addCompletedInjection(injectionScope, scope, tag, null);
            return;
        }

        const element = target.elem() as ScopedElement<TContext>;
        element.injectionContext = context;
        anchor.insertAdjacentElement(config.position ?? InjectionPosition.Append, element);
        addCompletedInjection(injectionScope, scope, tag, element);
    } catch (e) {
        // Failed context builders are retried on the next scan.
    } finally {
        deleteTag(injectionScope.state.inFlight, scope, tag);
    }
}

function Inject(selector: string, mode: InjectionMode, type: InjectionType, guard?: InjectionGuard): any {
    return function (target: typeof FloatElement, propertyKey: string, descriptor: PropertyDescriptor) {
        if (!inPageContext()) {
            return;
        }

        switch (mode) {
            case InjectionMode.ONCE:
                if (!canInject(guard)) {
                    return;
                }
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
            default:
                assertNever(mode);
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

export function InjectIntoScope<TContext>(
    injectionScope: InjectionScope<TContext>,
    config: ScopedInjectionConfig<TContext>
): any {
    return function (target: typeof FloatElement, propertyKey: string, descriptor: PropertyDescriptor) {
        if (!inPageContext()) {
            return;
        }

        const inject = () => {
            if (!canInject(injectionScope.guard)) {
                return;
            }

            document.querySelectorAll<HTMLElement>(injectionScope.selector).forEach((scope) => {
                void injectIntoScope(scope, target, injectionScope, config);
            });
        };

        switch (injectionScope.mode) {
            case InjectionMode.ONCE:
                inject();
                break;
            case InjectionMode.CONTINUOUS:
                setInterval(inject, 250);
                break;
            default:
                assertNever(injectionScope.mode);
        }
    };
}
