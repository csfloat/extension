<p align="center">
  <a href="https://csfloat.com/">
    <img width="600" src="https://csfloat.com/assets/n_full_logo.png"/>
  </a>
</p>

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/csfloat/extension/LICENSE)
[![Website](https://img.shields.io/website-up-down-green-red/https/csfloat.com.svg)](https://csfloat.com)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/d/jjicbefpemnphinccgikpdaagjebbnhg.svg)](https://chrome.google.com/webstore/detail/csfloat-market-checker/jjicbefpemnphinccgikpdaagjebbnhg)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/stars/jjicbefpemnphinccgikpdaagjebbnhg.svg)](https://chrome.google.com/webstore/detail/csfloat-market-checker/jjicbefpemnphinccgikpdaagjebbnhg)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/rating-count/jjicbefpemnphinccgikpdaagjebbnhg.svg)](https://chrome.google.com/webstore/detail/csfloat-market-checker/jjicbefpemnphinccgikpdaagjebbnhg)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/price/jjicbefpemnphinccgikpdaagjebbnhg.svg)](https://chrome.google.com/webstore/detail/csfloat-market-checker/jjicbefpemnphinccgikpdaagjebbnhg)

CSFloat has an extension for Firefox/Chrome that lets you fetch floats directly from the market page! You can view the source code for the extensions here!

## Store Links
[Chrome Store Link](https://chrome.google.com/webstore/detail/csfloat-market-checker/jjicbefpemnphinccgikpdaagjebbnhg) [v3+]

[Firefox Add-ons Link](https://addons.mozilla.org/en-US/firefox/addon/csgofloat/) [v3+]

## Features

* Assists in verifying trades for CSFloat Market
* Allows you to retrieve the float, paint seed, and float rank of any market or inventory item
* Fetches all floats on the page quickly and automatically on page load
* User-definable filters to highlight items with low floats or certain paint seeds
* Shows market item stickers at a glance and their wear
* Change the amount of items on the page up to 100
* Shows when trade holds expire for items in any Steam inventory

## Developer Guide

Please see [`src/`](/src/README.md) for an overview of how the extension works and underlying tech. Contributions are welcome!

### How to Build (Release)

> `npm install`
> 
> `npm run build`

The resultant build will be in the `dist/` directory.

Note: You can also use `npm run build_ff` for Firefox

### How to Build (Development)

> `npm install`
> 
> `npm run start`

Load the `dist/` directory as a temporary extension in Chrome. Code changes will automatically trigger a re-build.

Note: You can also use `npm run start_ff` for Firefox

## Releases

If you're ready to release a new version of the extension, the process of automatically packaging for each browser
is handled for you!

Steps
* Go to the [`upgrade.yml`](https://github.com/csfloat/extension/actions/workflows/upgrade.yml) Workflow
* Click "Run Workflow"
* Set the version to the next version (X.X.X)
  * NOTE: Do not prepend "v" in front of the version
* Click "Run Workflow" (Green) 

## Changelog

See [Releases](https://github.com/csfloat/extension/releases) for release notes.
