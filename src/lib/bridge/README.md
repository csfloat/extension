# Bridge

The bridge provides a type-safe abstraction layer for communication between
the page/content script and background script.

## Why?

* The page/content script cannot access certain Chrome extension APIs
* The page/content script cannot execute AJAX requests to domains outside of Steam's CSP policy

## How?

The bridge operates similar to a client/server request/response model. You can think of it
as sending requests to an HTTP server with type-safe handling.

The [`background.ts`](../background.ts) script runs a "server" handler that attempts to find
the appropriate handler for a given message, executes it, then returns the result.

If the handler fails to execute for any reason, the promise in the client will throw with the reason.

## Restricting Access

By default, bridge methods can be called by any Steam page's JavaScript and the extension content script.

Some methods may be considered too _sensitive_ to expose to the page and can be wrapped as a
`Privileged` handler. This restricts it to only be called from the extension's content script -- ensuring that
only audited CSGOFloat code can access.

Notably, executing scripts and CSS on the relevant Steam page is protected by this.

Example:

```javascript
export const MyPrivilegedHandler = new PrivilegedHandler(
    new EmptyResponseHandler<MyHandlerRequest>(RequestType.MY_PRIVILEGED_HANDLER, async (req, sender) => {
        return {};
    })
);
```

## Using a Handler

### Send a Message

```javascript
import {ClientSend} from '../client';

const result = await ClientSend(FetchInspectInfo, {inspectLink: "steam://rungame/...D11702291663056892105"});
```

This is all type-safe, so any IDE will help you fill in the arguments needed for that handler type.

## Creating a Handler

> **Note**
> You should only create a handler if it needs to access an HTTP resource outside of Steam CSP or Chrome extension API

1) Add your new request type to the `RequestType` enum in [`handlers.ts`](handlers/handlers.ts)
2) Create a `.ts` file in [`handlers/`](handlers/) for your new handler
    * The file name should generally match the enum (ex. `FETCH_INSPECT_INFO` -> `fetch_inspect_info.ts`)
3) Create a default implementation for your handler
    * See [`example.ts`](handlers/example.ts) for inspiration
    * Decide whether to use `SimpleHandler`, `EmptyRequestHandler`, `EmptyResponseHandler` depending on your use-case
4) Does your handler access potentially sensitive resources? Wrap it in `PrivilegedHandler`
    * See [`execute_script.ts`](handlers/execute_script.ts) for an example
5) Add mapping from the `RequestType` enum to your handler in [`handlers.ts`](handlers/handlers.ts)
6) You should be good to go to start using your handler!
    * Note that if you're running `npm start` with the development extension open in Chrome, you'll need to **reload**
      the extension in `chrome://extensions/` to update the service worker.
