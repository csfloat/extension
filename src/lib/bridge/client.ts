import {InternalRequestBundle, InternalResponseBundle, RequestHandler, Version} from "./types";
import {EXTENSION_ID} from "../constants";

export async function ClientSend<Req, Resp>(handler: RequestHandler<Req, Resp>, args: Req): Promise<Resp> {
    const bundle: InternalRequestBundle = {
        version: Version.V1,
        request_type: handler.getType(),
        request: args,
        id: Math.ceil(Math.random() * 100000000000)
    };

    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(window.CSGOFLOAT_EXTENSION_ID, bundle, (resp: InternalResponseBundle) => {
            if (resp?.response) {
                resolve(resp.response);
            } else {
                reject(resp?.error);
            }
        });
    });
}
