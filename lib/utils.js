const createButton = function(text, colour, id) {
    let btn = document.createElement('a');
    btn.classList.add(`btn_${colour}_white_innerfade`);
    btn.classList.add('btn_small');
    btn.classList.add('float-btn');

    if (id) btn.id = id;

    let span = document.createElement('span');
    span.innerText = text;
    btn.appendChild(span);

    return btn;
};

const removeAllItemsHtml = function() {
    // Iterate through each item on the page
    let listingRows = document.querySelectorAll('.market_listing_row.market_recent_listing_row');

    for (let row of listingRows) {
        let id = row.id.replace('listing_', '');

        let floatDiv = row.querySelector(`#item_${id}_floatdiv`);

        if (floatDiv) {
            row.style.backgroundColor = '';
            floatDiv.parentNode.removeChild(floatDiv);
        }

        let stickerDiv = row.querySelector('.float-stickers-container');
        if (stickerDiv) {
            stickerDiv.parentNode.removeChild(stickerDiv);
        }
    }
};

const hexToRgb = function(hex) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null;
};

const rgbToHex = function(rgb) {
    return '#' + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);
};

// Based on https://stackoverflow.com/a/41491220
const pickTextColour = function(bgColor, lightColour, darkColour) {
    const color = bgColor.charAt(0) === '#' ? bgColor.substring(1, 7) : bgColor;
    const r = parseInt(color.substring(0, 2), 16); // hexToR
    const g = parseInt(color.substring(2, 4), 16); // hexToG
    const b = parseInt(color.substring(4, 6), 16); // hexToB
    const uicolors = [r / 255, g / 255, b / 255];
    const c = uicolors.map(col => {
        if (col <= 0.03928) {
            return col / 12.92;
        }
        return Math.pow((col + 0.055) / 1.055, 2.4);
    });
    const L = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    return L > 0.179 ? darkColour : lightColour;
};

const isInventoryPage = function() {
    return /^\/(profiles|id)\/\S*\/inventory/.test(window.location.pathname);
};

const extractInspectAssetId = function(link) {
    const m = decodeURIComponent(link).match(
        /^steam:\/\/rungame\/730\/\d+\/[+ ]csgo_econ_action_preview [SM]\d+A(\d+)D\d+$/
    );
    return m && m[1];
};

const wearRanges = [
    [0.0, 0.07],
    [0.07, 0.15],
    [0.15, 0.38],
    [0.38, 0.45],
    [0.45, 1.0]
];

const rangeFromWear = function(wear) {
    for (const range of wearRanges) {
        if (wear > range[0] && wear <= range[1]) {
            return range;
        }
    }
};

const dopplerPhases = {
    418: 'Phase 1',
    419: 'Phase 2',
    420: 'Phase 3',
    421: 'Phase 4',
    415: 'Ruby',
    416: 'Sapphire',
    417: 'Black Pearl',
    569: 'Phase 1',
    570: 'Phase 2',
    571: 'Phase 3',
    572: 'Phase 4',
    568: 'Emerald',
    618: 'Phase 2',
    619: 'Sapphire',
    617: 'Black Pearl',
    852: 'Phase 1',
    853: 'Phase 2',
    854: 'Phase 3',
    855: 'Phase 4'
};

const hasDopplerPhase = function(paintIndex) {
    return paintIndex in dopplerPhases;
};

const getDopplerPhase = function (paintIndex) {
    return dopplerPhases[paintIndex];
};

/**
 * Compares two software version numbers (e.g. "1.7.1" or "1.2b").
 *
 * This function was born in http://stackoverflow.com/a/6832721.
 *
 * @param {string} v1 The first version to be compared.
 * @param {string} v2 The second version to be compared.
 * @param {object} [options] Optional flags that affect comparison behavior:
 * <ul>
 *     <li>
 *         <tt>lexicographical: true</tt> compares each part of the version strings lexicographically instead of
 *         naturally; this allows suffixes such as "b" or "dev" but will cause "1.10" to be considered smaller than
 *         "1.2".
 *     </li>
 *     <li>
 *         <tt>zeroExtend: true</tt> changes the result if one version string has less parts than the other. In
 *         this case the shorter string will be padded with "zero" parts instead of being considered smaller.
 *     </li>
 * </ul>
 * @returns {number|NaN}
 * <ul>
 *    <li>0 if the versions are equal</li>
 *    <li>a negative integer iff v1 < v2</li>
 *    <li>a positive integer iff v1 > v2</li>
 *    <li>NaN if either version string is in the wrong format</li>
 * </ul>
 *
 * @copyright by Jon Papaioannou (["john", "papaioannou"].join(".") + "@gmail.com")
 * @license This function is in the public domain. Do what you want with it, no strings attached.
 */
function versionCompare(v1, v2, options) {
    var lexicographical = options && options.lexicographical,
        zeroExtend = options && options.zeroExtend,
        v1parts = v1.split('.'),
        v2parts = v2.split('.');

    function isValidPart(x) {
        return (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x);
    }

    if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
        return NaN;
    }

    if (zeroExtend) {
        while (v1parts.length < v2parts.length) v1parts.push('0');
        while (v2parts.length < v1parts.length) v2parts.push('0');
    }

    if (!lexicographical) {
        v1parts = v1parts.map(Number);
        v2parts = v2parts.map(Number);
    }

    for (var i = 0; i < v1parts.length; ++i) {
        if (v2parts.length == i) {
            return 1;
        }

        if (v1parts[i] == v2parts[i]) {
            continue;
        } else if (v1parts[i] > v2parts[i]) {
            return 1;
        } else {
            return -1;
        }
    }

    if (v1parts.length != v2parts.length) {
        return -1;
    }

    return 0;
}

const sendMessage = function(params) {
    return new Promise(resolve => {
        chrome.runtime.sendMessage(params, data => {
            resolve(data);
        });
    });
};

const STATTRAK_QUALITY = 9;
const SOUVENIR_QUALITY = 12;

/**
 * Gets formatted link for floatdb for the specified item type and order
 * @param item item properties dict
 * @param order 1 for low float, -1 for high float ordering
 */
function getFloatDbLink(item, order) {
    return `https://db.csgofloat.com/?defIndex=${item.defindex}&paintIndex=${item.paintindex}&order=${order}` +
           `&souvenir=${item.quality === SOUVENIR_QUALITY}&stattrak=${item.quality === STATTRAK_QUALITY}`;
}

const getRankLink = function (itemInfo, rank) {
    const link = document.createElement('a');
    link.href = getFloatDbLink(itemInfo, rank === itemInfo.low_rank ? 1 : -1);
    link.innerText = ` (Rank #${rank})`;
    link.target = '_blank';
    return link;
};
