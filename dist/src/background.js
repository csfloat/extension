/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */,
/* 2 */,
/* 3 */,
/* 4 */,
/* 5 */,
/* 6 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Handle": () => (/* binding */ Handle)
/* harmony export */ });
/* harmony import */ var _types__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7);
/* harmony import */ var _handlers_handlers__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(8);
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};


function findHandler(type) {
    return _handlers_handlers__WEBPACK_IMPORTED_MODULE_1__.HANDLERS.find(e => e.getType() === type);
}
function Handle(blob, sender) {
    return __awaiter(this, void 0, void 0, function* () {
        if (blob.version !== _types__WEBPACK_IMPORTED_MODULE_0__.Version.V1) {
            // Ignore messages that aren't for this bridge
            return;
        }
        const req = blob;
        const handler = findHandler(req.request_type);
        if (!handler) {
            throw new Error(`couldn't find handler for request type ${req.request_type}`);
        }
        return handler.handleRequest(req.request, sender);
    });
}


/***/ }),
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
/* 8 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "HANDLERS": () => (/* binding */ HANDLERS)
/* harmony export */ });
/* harmony import */ var _execute_script__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(9);
/* harmony import */ var _fetch_global_filters__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(11);
/* harmony import */ var _fetch_stall__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(12);



const HANDLERS = [
    _execute_script__WEBPACK_IMPORTED_MODULE_0__.ExecuteScriptOnPage,
    _fetch_global_filters__WEBPACK_IMPORTED_MODULE_1__.FetchGlobalFilters,
    _fetch_stall__WEBPACK_IMPORTED_MODULE_2__.FetchStall,
];


/***/ }),
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
/* 11 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "FetchGlobalFilters": () => (/* binding */ FetchGlobalFilters)
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

const FetchGlobalFilters = new _main__WEBPACK_IMPORTED_MODULE_0__.SimpleHandler(_main__WEBPACK_IMPORTED_MODULE_0__.RequestType.FETCH_GLOBAL_FILTERS, () => __awaiter(void 0, void 0, void 0, function* () {
    return { filters: ['1'] };
}));


/***/ }),
/* 12 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "FetchStall": () => (/* binding */ FetchStall)
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

const FetchStall = new _main__WEBPACK_IMPORTED_MODULE_0__.SimpleHandler(_main__WEBPACK_IMPORTED_MODULE_0__.RequestType.FETCH_STALL, () => __awaiter(void 0, void 0, void 0, function* () {
    return { filters: ['1'] };
}));


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
/* harmony import */ var _lib_bridge_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(6);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    (0,_lib_bridge_server__WEBPACK_IMPORTED_MODULE_0__.Handle)(request, sender).then(response => {
        sendResponse(response);
    });
    return true;
    /*

    let url;
    const options: RequestInit = {};

    console.log(request);
    if (request.executeScript) {
        console.log(sender);
        await chrome.scripting.executeScript(
            {
                target: {tabId: sender.tab?.id as number},
                files: [request.executeScript],
                world: 'MAIN'
            });
        return true;
    } else if (request.model) {
        url = `https://money.csgofloat.com/model?url=${request.inspectLink}`;
    } else if (request.price) {
        url = `https://money.csgofloat.com/price?name=${request.name}`;
    } else if (request.inventory) {
        url = `https://steamcommunity.com/profiles/${request.steamId}/inventory/json/730/2?l=english`;
    } else if (request.floatMarket) {
        options.credentials = 'include';
        url = `https://csgofloat.com/api/v1/me/pending-trades`;
    } else if (request.stall) {
        url = `https://csgofloat.com/api/v1/users/${request.steamId}/stall`;
    } else {
        url = `https://api.csgofloat.com/?url=${request.inspectLink}&minimal=true${request.listPrice ? '&listPrice=' + request.listPrice : ''}`;
    }

    fetch(url, options)
        .then(response => {
            response.json().then(data => sendResponse(data));
        })
        .catch(err => sendResponse(err));

    return true; */
});

})();

/******/ })()
;