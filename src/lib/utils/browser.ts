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

export function deserializeForm(serialized: string): any {
    if (serialized.slice(0, 1) === '?') {
        serialized = serialized.slice(1);
    }

    if (!serialized) {
        return {};
    }

    return serialized.split('&').reduce((acc: any, e) => {
        const pair = e.split('=');
        if (pair.length < 2) {
            return acc;
        }

        acc[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
        return acc;
    }, {});
}
