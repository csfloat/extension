/*
 * Functions related to the browser page (ie. parsing the URL)
 */

export function getQueryParameter(param: string): string | null {
    const url = new URL(window.location.href);
    return url.searchParams.get(param);
}

export function hasQueryParameter(param: string): boolean {
    return !!getQueryParameter(param);
}
