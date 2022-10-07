function historyRowHashcode(row: HTMLElement): string {
    const text = row.innerText.replace(/\W/g, '');

    /* Based on https://stackoverflow.com/a/8831937 (Java's hashCode() method) */
    if (text.length === 0) {
        return '';
    }

    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }

    return hash.toString();
}

function getTimestampFromTrade(row: HTMLElement): number | null {
    const dateDiv = row.querySelector('.tradehistory_date');
    if (!dateDiv) {
        return null;
    }

    const date = dateDiv.firstChild!.nodeValue!.trim();
    const time = (dateDiv.querySelector('.tradehistory_timestamp')! as HTMLElement).innerText;

    const d = new Date(date);
    const pure = time.replace('am', '').replace('pm', '');
    let hours = parseInt(pure.split(':')[0]);
    const minutes = parseInt(pure.split(':')[1]);
    if (time.includes('pm') && hours !== 12) {
        /* Prevent 12:XXpm from getting 12 hours added */
        hours += 12;
    } else if (time.includes('am') && hours === 12) {
        /* Prevent 12:XXam from getting 12 hours instead of being 0 */
        hours -= 12;
    }

    d.setHours(hours);
    d.setMinutes(minutes);
    return d.getTime() / 1000;
}

async function hasTradeBeforeTime(hashCode: string, timestamp: number): Promise<boolean> {
    const resp = await fetch(
        `${location.protocol}//${location.host}${location.pathname}?after_time=${timestamp}&l=english`,
        {
            credentials: 'same-origin',
        }
    );

    const body = await resp.text();

    if (body.includes('too many requests')) {
        alert('You need to wait a couple seconds before generating the proof due to Valve rate-limits');
        throw 'Too many requests';
    }

    const doc = new DOMParser().parseFromString(body, 'text/html');
    const rows = doc.querySelectorAll('.tradehistoryrow') as NodeListOf<HTMLElement>;

    for (const row of rows) {
        const thisCode = historyRowHashcode(row);
        if (thisCode === hashCode) {
            return true;
        }
    }

    return false;
}

async function fetchEnglishRow(index: number): Promise<HTMLElement> {
    let queryParams = location.search;
    if (queryParams === '') {
        queryParams = '?l=english';
    } else {
        queryParams += '&l=english';
    }

    /* Forces us to fetch the english version of the row at a given index no matter what */
    const resp = await fetch(`${location.protocol}//${location.host}${location.pathname}${queryParams}`, {
        credentials: 'same-origin',
    });

    const body = await resp.text();

    const doc = new DOMParser().parseFromString(body, 'text/html');
    const rows = doc.querySelectorAll('.tradehistoryrow');
    return rows[index] as HTMLElement;
}

/**
 * Returns the listing time of the row at {@param index}
 * @param index Index of the trade history row on the page
 */
export async function fetchListingTime(index: number): Promise<number | undefined> {
    const node = await fetchEnglishRow(index);
    const hashCode = historyRowHashcode(node);

    const timestamp = getTimestampFromTrade(node);
    if (!timestamp) {
        throw 'failed timestamp creation';
    }

    let left = 0,
        right = 60;
    let amt = 0;
    while (left < right && amt < 5) {
        const middle = left + Math.floor((right - left) / 2);
        const hasTrade = await hasTradeBeforeTime(hashCode, timestamp + middle);
        if (hasTrade) {
            right = middle;
        } else {
            left = middle;
        }
        amt++;
    }

    /* Hello to all the reversers */
    return timestamp + Math.floor((right + left) / 2);
}
