/**
 * Subset of React's internal Fiber instance shape. These are internal implementation details of React, 
 * so they may change between React versions.
 *
 * See React's source for the authoritative definition for Steam's React version (v19.1.1):
 * https://github.com/facebook/react/blob/v19.1.1/packages/react-reconciler/src/ReactInternalTypes.js
 */
export interface Fiber {
    alternate: Fiber | null;
    child: Fiber | null;
    deletions: Fiber[] | null;
    elementType: unknown;
    flags: number;
    key: string | null;
    memoizedProps: unknown;
    pendingProps: unknown;
    return: Fiber | null;
    sibling: Fiber | null;
    stateNode: HTMLElement | null;
}

/**
 * Returns the Fiber instance React attached to `element`, or null if the element was not rendered
 * by React (no `__reactFiber` property present).
 */
function getCurrentFiber(element: HTMLElement): Fiber | null {
    const key = Object.keys(element).find((k) => k.startsWith('__reactFiber$'));
    if (!key) return null;
    return (element[key as keyof HTMLElement] as Fiber | undefined) ?? null;
}

/**
 * Walks up the Fiber tree from `element` until `predicate` returns true for an ancestor Fiber, then
 * returns that Fiber's `memoizedProps`.
 *
 * Returns undefined if the element wasn't rendered by React or no ancestor satisfies `predicate`.
 */
export function getFiberProps<T>(element: HTMLElement, predicate: (fiber: Fiber) => boolean): T | undefined {
    let fiber = getCurrentFiber(element);
    while (fiber) {
        if (predicate(fiber)) {
            return fiber.memoizedProps as T;
        }
        fiber = fiber.return;
    }
    return undefined;
}
