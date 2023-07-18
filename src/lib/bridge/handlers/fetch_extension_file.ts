import {SimpleHandler} from './main';
import {RequestType} from './types';
import {PrivilegedHandler} from '../wrappers/privileged';

export interface FetchExtensionFileRequest {
    path: string;
}

export interface FetchExtensionFileResponse {
    text: string;
}

export const FetchExtensionFile = new PrivilegedHandler(
    new SimpleHandler<FetchExtensionFileRequest, FetchExtensionFileResponse>(
        RequestType.FETCH_EXTENSION_FILE,
        async (req) => {
            const url = chrome.runtime.getURL(req.path);
            const r = await fetch(url);
            const text = await r.text();
            return {
                text,
            };
        }
    )
);
