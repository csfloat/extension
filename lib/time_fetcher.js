function historyRowHashcode_CSGOFloat(row) {
    const text = row.innerText.replace(/\W/g, '');

    /* Based on https://stackoverflow.com/a/8831937 (Java's hashCode() method) */
    let hash = 0;
    if (text.length === 0) {
        return hash;
    }
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash;
    }

    return hash;
}

function getTimestampFromTrade_CSGOFloat(row) {
    const dateDiv = row.querySelector('.tradehistory_date');
    const date = dateDiv.innerText.split('\n')[0];
    const time = dateDiv.innerText.split('\n')[1];

    const d = new Date(date);
    const pure = time.replace('am', '').replace('pm', '');
    let hours = parseInt(pure.split(':')[0]);
    const minutes = parseInt(pure.split(':')[1]);
    if (time.includes('pm') && hours !== 12) {
        /* Prevent 12:XXpm from getting 12 hours added */
        hours += 12
    } else if (time.includes('am') && hours === 12) {
        /* Prevent 12:XXam from getting 12 hours instead of being 0 */
        hours -= 12
    }

    d.setHours(hours);
    d.setMinutes(minutes);
    return d.getTime() / 1000;
}

async function addVerifyButtons() {
    let rows = document.querySelectorAll('.tradehistoryrow');

    for (const row of rows) {
        const hashCode = historyRowHashcode_CSGOFloat(row);

        const btnId = `verify_${hashCode}_csgofloat`;

        if (row.querySelector(`#${btnId}`)) {
            // Already placed the button
            continue;
        }

        let proveBtn = createButton('CSGOFloat Proof', 'green', btnId);
        proveBtn.addEventListener('click', () => {
            window.postMessage(
                {
                    type: 'fetchTime',
                    hashCode
                },
                '*'
            );
        });

        row.querySelector('.tradehistory_content').append(proveBtn);
    }
}

async function hasTradeBeforeTime_CSGOFloat(hashCode, timestamp) {
    const resp = await fetch(`${location.protocol}//${location.host}${location.pathname}?after_time=${timestamp}&l=english`, {
        credentials: 'same-origin'
    });

    const body = await resp.text();

    if (body.includes('too many requests')) {
        alert('You need to wait a couple seconds before generating the proof due to Valve rate-limits');
        throw 'Too many requests';
    }

    const doc = new DOMParser().parseFromString(body, 'text/html');
    const rows = doc.querySelectorAll('.tradehistoryrow');

    for (const row of rows) {

        const thisCode = historyRowHashcode_CSGOFloat(row);
        if (thisCode === hashCode) {
            return true;
        }
    }

    return false;
}

async function fetchListingTime_CSGOFloat(hashCode) {
    const btn = document.querySelector(`#verify_${hashCode}_csgofloat`);
    btn.querySelector('span').innerText = 'Computing Proof...';
    let timestamp;

    try {
        timestamp = getTimestampFromTrade_CSGOFloat(btn.parentNode.parentNode);
        if (!timestamp) {
            throw 'failed timestamp creation';
        }
    } catch(e) {
        console.error(e);
        alert("Failed to parse time, make sure you're on an english version of the page by appending ?l=english to the url");
        return;
    }

    let left = 0, right = 60;
    let amt = 0;
    while (left < right && amt < 5) {
        const middle = left + Math.floor((right - left) / 2);
        const hasTrade = await hasTradeBeforeTime_CSGOFloat(hashCode, timestamp + middle);
        if (hasTrade) {
            right = middle;
        } else {
            left = middle;
        }
        amt++;
    }

    /* Hello to all the reversers */
    const proof = timestamp + Math.floor((right + left) / 2);

    const span = document.createElement('span');
    span.innerText = `Proof: ${proof}`;
    btn.parentNode.append(span);
    btn.parentNode.removeChild(btn);
}

// register the message listener in the page scope
let script = document.createElement('script');
script.innerText = `
    ${hasTradeBeforeTime_CSGOFloat.toString()}
    ${fetchListingTime_CSGOFloat.toString()}
    ${historyRowHashcode_CSGOFloat.toString()}
    ${getTimestampFromTrade_CSGOFloat.toString()}
    window.addEventListener('message', (e) => {
        if (e.data.type == 'fetchTime') {
            fetchListingTime_CSGOFloat(e.data.hashCode);
        }
    });
`;

document.head.appendChild(script);

addVerifyButtons();
