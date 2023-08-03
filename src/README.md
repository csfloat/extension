# Developer Overview

## Execution

### Background

Typical Chrome extensions deal with 3 different JavaScript execution environments:

1. Content Scripts
   * Access to the page DOM, has its own isolated JavaScript runtime
   * AJAX requests may be _limited_ by the security policy of the Steam page
   * Can access [some](https://developer.chrome.com/docs/extensions/mv3/content_scripts/#capabilities) Chrome APIs
2. Background Scripts ([Service Workers in MV3](https://developer.chrome.com/docs/extensions/mv3/service_workers/))
   * Background-running JavaScript runtime that is an event handler running _most of the time_ with consistent state
   * Notably, AJAX requests are _free_ of page restrictions and CSP
3. Page
   * JavaScript runtime of the page itself (in our case, the Steam page)
   * Has definitions for all the functions/properties/etc... that Valve defined

Both 1) and 2) **DON'T** have access to the JS runtime of the page itself (ie. the Steam page).

Coincidentally, having access to the page's runtime environment is _very useful_, allowing us to easily change state,
hook functions, and access global variables that contain assets.

Of note, any logic for the extension is typically done within a content script, since the notion of a "page script"
is not _as_ natively supported (ie. Chrome injects a script into the page for you from the manifest).

### Typical Solutions

#### Accessing the Page JS Runtime from Content Scripts

Typically, only being able to access the DOM (ie. HTML env) of the page is not enough or more cumbersome to make
changes to the page for your extension.

Historically, many extensions would use on-demand script injection into the page in order to retrieve a variable,
call a function, or mutate page-JS state. This is what our extension [used to do](https://github.com/csfloat/extension/blob/ca85d56e3b268330537daf6bc6be7837213cc7a4/lib/bridge.js)
and what others like CSGO-Trader [currently do](https://github.com/gergelyszabo94/csgo-trader-extension/blob/216df0e4eb6c481c893426d2324b93da026e92d3/extension/src/utils/injection.js#L4) (as of 2022/10/01).

Pros
  * Straightforward to implement

Cons
  * Difficult to implement type checking
  * Difficult to decipher which runtime a piece of code is suitable to run in
  * Complicated runtimes and state juggling around where to get variables
  * Performance bottlenecks (creates a new script node in the DOM _every time you want a variable_)

#### Making AJAX requests in the Background Script

Since Steam's Content Security Policy restrictions are applied to the content script's AJAX requests, typically event messaging to the background
script is done. The background script is not restricted and will perform the request for us and send back the result.

This is the mechanism you'd need to use whenever you fetch an HTTPS resource (like `https://api.csfloat.com`).

A naiive example would be:

`content_script.js`
```javascript
chrome.runtime.sendMessage({type1: 'https://api.csfloat.com/?url=steam://....'}, (response) => {
    // do something
});
```

`background_script.js`
```javascript
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type1) {
        fetch(request.type1).then(resp => sendResponse(resp));
    } else if (request.type2) {
       fetch(request.type2).then(resp => sendResponse(resp));
    }
    ...
}
```

Pros
* One of the few ways to bypass CSP for requests (without making more destructive changes)

Cons
* Your background script typically gets _very messy_ with handling logic for every type of request your extension makes
* Type-checking is _hard_, easy to lose context of what you expect a request to return


### How CSFloat's Extension Works

#### Accessing the Page's JS runtime

Almost the entirety of CSFloat's Extension runs within the page context and **not** the content script.

This allows us to easily access page globals, call Steam's functions, override their functions. Additionally, this gives a clear
consistent environment to think about as a developer.

Since there isn't a native way to tell Chrome via. the manifest to inject a script into the page, content scripts are instead used to **bootstrap** the page
script. This effectively tells Chrome to re-run the script, but in the page instead. Page scripts can be found in `/page_scripts`.


#### Making AJAX requests in the Page Context

Now that our scripts run within the page, we still want to be able to make AJAX requests to other domains outside of
Steam's Content Security Policy.

CSFloat's Extension similarly uses the mechanism of making the actual request in a background script, but
creates an abstraction layer on top.

Dubbed the "bridge", it allows for **type safe** request and response handling between the page and background script.
You can think of the background script operating as a server that receives incoming HTTP requests and handles
them, sending the response back to the client.

Typically, any form of foreign HTTP requests or accessing the extension's APIs is done through this bridge.

You can find more details in `/bridge`. 

## DOM Manipulation

### Component Creation

When try to mutate a page, you also want the ability to create new UI components, potentially _reusing_ the styling
on the page. For example, you'd create a component that shows the float for a given item.

CSFloat's Extension uses Web Components via the library [Lit](https://lit.dev/). Each UI mutation is a separate
component that has its own state management and rendering logic.

You can find our components in `/components`.


### Component Injection

While in the typical world, component creation allows you to composite the page without any more hassle, in an extension
it is _very_ common that you'd want to _augment_ an existing HTML element.

Our system provides a declarative syntax that tells the library where you want your UI component to be injected into.

For instance, you may want to augment a market listing row and add the float/seed to it.

You could do:

```javascript
@CustomElement()
@InjectAppend("#searchResultsRows .market_listing_row", InjectionMode.CONTINUOUS)
export class HelloWorld extends FloatElement {
    ...
    render() {
        return html`Hello World`;
    }
}
```

This would then add your `Hello World` component to the page automatically for each listing row. If new listings are
added (ie. they go to the next page), `InjectionMode.CONTINUOUS` will inject into the new rows as well.


### Component Scope

Components are created in the [shadow dom](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM)
and _do not_ have access to the styles that already exist on the page.

There are global styles inherited by `FloatElement`, but generally styling is done on a per-component basis.
