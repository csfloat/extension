import {EmptyRequestHandler, SimpleHandler} from './main';
import {RequestType} from './types';
import {AnnotateOfferRequest, AnnotateOfferResponse} from './annotate_offer';
import {runtimeNamespace} from '../../utils/detect';

export interface ExtensionVersionResponse {
    version: string;
}

export const ExtensionVersion = new EmptyRequestHandler<ExtensionVersionResponse>(
    RequestType.EXTENSION_VERSION,
    async (req) => {
        const manifest = runtimeNamespace().runtime.getManifest();
        return {
            version: manifest.version,
        };
    }
);
