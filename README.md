<p align="center">
  <a href="https://csgofloat.com/">
    <img src="http://i.imgur.com/dzGQk7W.png"/>
  </a>
</p>

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/Step7750/CSGOFloat/LICENSE)
[![Website](https://img.shields.io/website-up-down-green-red/https/csgofloat.com.svg)](https://csgofloat.com)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/d/jjicbefpemnphinccgikpdaagjebbnhg.svg)](https://chrome.google.com/webstore/detail/csgofloat-market-checker/jjicbefpemnphinccgikpdaagjebbnhg)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/stars/jjicbefpemnphinccgikpdaagjebbnhg.svg)](https://chrome.google.com/webstore/detail/csgofloat-market-checker/jjicbefpemnphinccgikpdaagjebbnhg)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/rating-count/jjicbefpemnphinccgikpdaagjebbnhg.svg)](https://chrome.google.com/webstore/detail/csgofloat-market-checker/jjicbefpemnphinccgikpdaagjebbnhg)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/price/jjicbefpemnphinccgikpdaagjebbnhg.svg)](https://chrome.google.com/webstore/detail/csgofloat-market-checker/jjicbefpemnphinccgikpdaagjebbnhg)

CSGOFloat is a free and open source API service that allows you to obtain the float and paint seed of any CSGO item using its inspect link.

CSGOFloat has an extension for Firefox/Chrome that lets you fetch floats directly from the market page! You can view the source code for the extensions here!

### Repo Links

[CSGOFloat (API/Backend)](https://github.com/Step7750/CSGOFloat)

[CSGOFloat-Website](https://github.com/Step7750/CSGOFloat-Website)

## Store Links
[Chrome Store Link] (https://chrome.google.com/webstore/detail/csgofloat-market-checker/jjicbefpemnphinccgikpdaagjebbnhg)

[Firefox Add-ons Link] (https://addons.mozilla.org/en-US/firefox/addon/csgofloat/)

## Features

* Allows you to retrieve the "float" and paint seed of any market item in one click
* You can fetch all floats on the current page
* When using pagination, the float data is saved

## Compatibility:
* This extension has been tested to work with Steam Inventory Helper and Enhanced Steam
* Since this extension doesn't hook and modify HTTP headers to bypass steamcommunity.com CSP, it should have greater compatibility.

In order to bypass CSP, the extension uses page event listeners to communicate with the content script and injected DOM content.

## Changelog

v1.0.0
* Initial release

v1.0.1
* Implemented support for requesting all floats on the given page

v1.0.2
* Added "Fetching" status to the "Get Float" button when that item is being processed
* Cleaned up the code w/ better commenting

v1.1
* Rewrite of the extension to allow greater flexibility in the future

v1.1.1
* Fixes Slow Item Info Retrieval Handling

v1.1.2
* Implements proper sanitization of injected HTML during float retrieval
