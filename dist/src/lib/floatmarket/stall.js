/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
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
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "stallFetcher": () => (/* binding */ stallFetcher)
/* harmony export */ });
class StallFetcher {
    constructor() {
        // Maps string -> stall items
        this.stalls = {};
    }

    async getStallItem(steamId, itemId) {
        if (this.stalls[steamId]) {
            return this.stalls[steamId].listings.find(e => (e.offering || e.item).asset_id === itemId);
        }

        let stall;

        try {
            stall = await sendMessage({ stall: true, steamId});
            if (!stall.listings) {
                // Stub out to prevent further calls
                stall = {listings: []};
            }
        } catch (e) {
            return;
        }

        this.stalls[steamId] = stall;
        return stall.listings.find(e => (e.offering || e.item).asset_id === itemId);
    }
}

const stallFetcher = new StallFetcher();

/******/ })()
;