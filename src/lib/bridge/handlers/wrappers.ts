import { Job, TTLCachedQueue } from "../../utils/queue";
import stringify from "fast-json-stable-stringify";
import { RequestHandler } from "../types";
import { RequestType } from "./handlers";
import MessageSender = chrome.runtime.MessageSender;

interface WrappedRequest<Req> {
  data: Req;
  sender: MessageSender;
}

class HandlerJob<Req> extends Job<WrappedRequest<Req>> {
  constructor(protected req: Req, private sender: MessageSender) {
    super({data: req, sender});
  }

  hashCode(): string {
    // Ensure deterministic stringification between two requests for the same
    // properties
    return stringify(this.data);
  }
}

/**
 * Extension of a TTL cached queue that supports wrapped requests that include
 * extra properties (ie. sender) in addition to the data.
 */
class HandlerQueue<Req, Resp> extends TTLCachedQueue<WrappedRequest<Req>, Resp> {
  constructor(maxConcurrency: number, ttlMs: number, private handler: RequestHandler<Req, Resp>) {
    super(maxConcurrency, ttlMs);
  }

  fetch(req: Req, sender: MessageSender): Promise<Resp> {
    return this.add(new HandlerJob<Req>(req, sender);
  }

  protected process(req: WrappedRequest<Req>): Promise<Resp> {
    return this.handler.handleRequest(req.data, req.sender);
  }
}

/**
 * Wraps a handler such that incoming requests, if they have been previously
 * fetched, will return the previous "cached" result.
 *
 * If there are multiple in-flight requests for the same
 */
export class CachedHandler<Req, Resp> implements RequestHandler<Req, Resp> {
  private queue: HandlerQueue<Req, Resp>;

  constructor(private handler: RequestHandler<Req, Resp>, maxConcurrency: number, ttlMs: number) {
    this.queue = new HandlerQueue<Req, Resp>(Number.MAX_VALUE, ttlMs, handler);
  }

  getType(): RequestType {
    return this.handler.getType();
  }

  handleRequest(request: Req, sender: MessageSender): Promise<Resp> {
    return this.queue.fetch(request, sender);
  }
}

/**
 * Restricts a given handler such that it can only run if the sender is
 * verified to be from the extension's origin (ie. content script)
 */
export class PrivilegedHandler<Req, Resp> implements RequestHandler<Req, Resp> {
  constructor(private handler: RequestHandler<Req, Resp>) {
  }

  getType(): RequestType {
    return this.handler.getType();
  }

  handleRequest(request: Req, sender: MessageSender): Promise<Resp> {
    if (sender.id !== chrome.runtime.id) {
      throw new Error("Attempt to access restricted method outside of secure context (ie. content script)");
    }

    return this.handler.handleRequest(request, sender);
  }
}
