/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */,
/* 2 */,
/* 3 */,
/* 4 */,
/* 5 */,
/* 6 */,
/* 7 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Version": () => (/* binding */ Version)
/* harmony export */ });
var Version;
(function (Version) {
    Version["V1"] = "CSGOFLOAT_V1";
})(Version || (Version = {}));


/***/ }),
/* 8 */,
/* 9 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ExecuteScriptOnPage": () => (/* binding */ ExecuteScriptOnPage)
/* harmony export */ });
/* harmony import */ var _main__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(10);
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};

const ExecuteScriptOnPage = new _main__WEBPACK_IMPORTED_MODULE_0__.EmptyResponseHandler(_main__WEBPACK_IMPORTED_MODULE_0__.RequestType.EXECUTE_SCRIPT_ON_PAGE, (req, sender) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // VALIDATE THE PATH!!!
    yield chrome.scripting.executeScript({
        target: { tabId: (_a = sender.tab) === null || _a === void 0 ? void 0 : _a.id },
        files: [req.path],
        world: 'MAIN'
    });
}));


/***/ }),
/* 10 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "EmptyRequestHandler": () => (/* binding */ EmptyRequestHandler),
/* harmony export */   "EmptyResponseHandler": () => (/* binding */ EmptyResponseHandler),
/* harmony export */   "RequestType": () => (/* binding */ RequestType),
/* harmony export */   "SimpleHandler": () => (/* binding */ SimpleHandler)
/* harmony export */ });
var RequestType;
(function (RequestType) {
    RequestType[RequestType["EXECUTE_SCRIPT_ON_PAGE"] = 0] = "EXECUTE_SCRIPT_ON_PAGE";
    RequestType[RequestType["FETCH_GLOBAL_FILTERS"] = 1] = "FETCH_GLOBAL_FILTERS";
    RequestType[RequestType["FETCH_STALL"] = 2] = "FETCH_STALL";
})(RequestType || (RequestType = {}));
class SimpleHandler {
    constructor(type, handler) {
        this.type = type;
        this.handler = handler;
    }
    getType() {
        return this.type;
    }
    handleRequest(request, sender) {
        return this.handler(request, sender);
    }
}
class EmptyRequestHandler {
    constructor(type, handler) {
        this.type = type;
        this.handler = handler;
    }
    getType() {
        return this.type;
    }
    handleRequest(request, sender) {
        return this.handler(sender);
    }
}
class EmptyResponseHandler {
    constructor(type, handler) {
        this.type = type;
        this.handler = handler;
    }
    getType() {
        return this.type;
    }
    handleRequest(request, sender) {
        return this.handler(request, sender);
    }
}


/***/ }),
/* 11 */,
/* 12 */,
/* 13 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ClientSend": () => (/* binding */ ClientSend)
/* harmony export */ });
/* harmony import */ var _types__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7);
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(14);
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};


function ClientSend(handler, args) {
    return __awaiter(this, void 0, void 0, function* () {
        const bundle = {
            version: _types__WEBPACK_IMPORTED_MODULE_0__.Version.V1,
            request_type: handler.getType(),
            request: args,
            id: Math.ceil(Math.random() * 100000000000)
        };
        const resp = yield chrome.runtime.sendMessage(_constants__WEBPACK_IMPORTED_MODULE_1__.EXTENSION_ID, bundle);
        return resp === null || resp === void 0 ? void 0 : resp.response;
    });
}


/***/ }),
/* 14 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "EXTENSION_ID": () => (/* binding */ EXTENSION_ID)
/* harmony export */ });
const EXTENSION_ID = 'jjicbefpemnphinccgikpdaagjebbnhg';


/***/ }),
/* 15 */,
/* 16 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "init": () => (/* binding */ init)
/* harmony export */ });
/* harmony import */ var _bridge_handlers_execute_script__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(9);
/* harmony import */ var _bridge_client__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(13);


/**
 * Initializes a page script, executing it in the page context if necessary
 *
 * @param scriptPath Relative path of the script (always in .js)
 * @param ifPage Fn to run if we are in the page's execution context
 */
function init(scriptPath, ifPage) {
    // Don't allow the page script to run this.
    if (!chrome.extension) {
        ifPage();
        return;
    }
    (0,_bridge_client__WEBPACK_IMPORTED_MODULE_1__.ClientSend)(_bridge_handlers_execute_script__WEBPACK_IMPORTED_MODULE_0__.ExecuteScriptOnPage, {
        path: scriptPath
    });
}


/***/ }),
/* 17 */,
/* 18 */,
/* 19 */,
/* 20 */,
/* 21 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "createButton": () => (/* binding */ createButton),
/* harmony export */   "getCurrentTab": () => (/* binding */ getCurrentTab)
/* harmony export */ });
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

const isTradePage = function () {
    return /^\/tradeoffer\/\S*/.test(window.location.pathname);
};

const extractInspectAssetId = function(link) {
    const m = decodeURIComponent(link).match(
        /^steam:\/\/rungame\/730\/\d+\/[+ ]csgo_econ_action_preview [SM]\d+A(\d+)D\d+$/
    );
    return m && m[1];
};

const extractInspectSteamId = function(link) {
    const m = decodeURIComponent(link).match(
        /^steam:\/\/rungame\/730\/\d+\/[+ ]csgo_econ_action_preview [SM](\d+)A\d+D\d+$/
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
    855: 'Phase 4',
    1119: "Emerald",
    1120: "Phase 1",
    1121: "Phase 2",
    1122: "Phase 3",
    1123: "Phase 4"
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

function getFloatDbCategory(item) {
    if (item.full_item_name.includes('StatTrak')) {
        return 2;
    } else if (item.full_item_name.includes('Souvenir')) {
        return 3;
    } else {
        // "Normal"
        return 1;
    }
}

/**
 * Gets formatted link for floatdb for the specified item type and order
 * @param item item properties dict
 * @param order 1 for low float, -1 for high float ordering
 */
function getFloatDbLink(item, order) {
    return `https://csgofloat.com/db?defIndex=${item.defindex}&paintIndex=${item.paintindex}&order=${order}&category=${getFloatDbCategory(item)}`;

}

const getRankLink = function (itemInfo, rank) {
    const link = document.createElement('a');
    link.href = getFloatDbLink(itemInfo, rank === itemInfo.low_rank ? 1 : -1);
    link.innerText = ` (Rank #${rank})`;
    link.target = '_blank';
    return link;
};

const isMarketListing = function (id) {
    // Dumb heuristic, has to be larger than asset id
    return id >= 10000000000000;
};

async function getCurrentTab() {
    console.log(chrome);
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    return tab;
}


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _utils_ts__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(16);
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(21);



(0,_utils_ts__WEBPACK_IMPORTED_MODULE_0__.init)('src/lib/page_scripts/time_fetcher.js', main);

function historyRowHashcode(row) {
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

function getTimestampFromTrade(row) {
    const dateDiv = row.querySelector('.tradehistory_date');
    const date = dateDiv.firstChild.nodeValue.trim();
    const time = dateDiv.querySelector('.tradehistory_timestamp').innerText;

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

async function main() {
    let rows = document.querySelectorAll('.tradehistoryrow');

    for (const [i, row] of rows.entries()) {
        const btnId = `verify_${i}_csgofloat`;

        if (row.querySelector(`#${btnId}`)) {
            // Already placed the button
            continue;
        }

        let proveBtn = (0,_utils__WEBPACK_IMPORTED_MODULE_1__.createButton)('CSGOFloat Proof', 'green', btnId);
        proveBtn.addEventListener('click', () => {
            fetchListingTime(i);
        });

        row.querySelector('.tradehistory_content').append(proveBtn);
    }
}

async function hasTradeBeforeTime(hashCode, timestamp) {
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

        const thisCode = historyRowHashcode(row);
        if (thisCode === hashCode) {
            return true;
        }
    }

    return false;
}

async function fetchEnglishRow(index) {
    let queryParams = location.search;
    if (queryParams === '') {
        queryParams = '?l=english';
    } else {
        queryParams += '&l=english';
    }

    /* Forces us to fetch the english version of the row at a given index no matter what */
    const resp = await fetch(`${location.protocol}//${location.host}${location.pathname}${queryParams}`, {
        credentials: 'same-origin'
    });

    const body = await resp.text();

    const doc = new DOMParser().parseFromString(body, 'text/html');
    const rows = doc.querySelectorAll('.tradehistoryrow');
    return rows[index];
}

async function fetchListingTime(index) {
    const btn = document.querySelector(`#verify_${index}_csgofloat`);
    btn.querySelector('span').innerText = 'Computing Proof...';

    const node = await fetchEnglishRow(index);
    const hashCode = historyRowHashcode(node);

    let timestamp;

    try {
        timestamp = getTimestampFromTrade(node);
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
        const hasTrade = await hasTradeBeforeTime(hashCode, timestamp + middle);
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

})();

/******/ })()
;