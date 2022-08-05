import {InternalRequestBundle, InternalResponseBundle, RequestHandler, Version} from "./types";
import {EXTENSION_ID} from "../constants";

export async function ClientSend<Req, Resp>(handler: RequestHandler<Req, Resp>, args: Req): Promise<Resp> {
    const bundle: InternalRequestBundle = {
        version: Version.V1,
        request_type: handler.getType(),
        request: args,
        id: Math.ceil(Math.random() * 100000000000)
    };

    const resp = await chrome.runtime.sendMessage(EXTENSION_ID, bundle) as InternalResponseBundle;
    return resp?.response;
}
