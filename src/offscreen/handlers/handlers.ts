import {OffscreenRequestHandler, OffscreenRequestType} from './types';
import {TLSNProveOffscreenHandler} from './notary_prove';

export const OFFSCREEN_HANDLERS_MAP: {[key in OffscreenRequestType]?: OffscreenRequestHandler<any, any>} = {
    [OffscreenRequestType.TLSN_PROVE]: TLSNProveOffscreenHandler,
};
