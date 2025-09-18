import {OffscreenRequestBundle, OffscreenResponseBundle} from './types';
import {OffscreenRequestHandler, OffscreenRequestType} from './handlers/types';
import {closeOffscreenDocument, openOffscreenDocument} from '../offscreen/utils';
import {wait} from '../lib/utils/snips';

export async function SendToOffscreen<Req, Resp>(
    requestType: OffscreenRequestType,
    args: Req
): Promise<Resp> {
    await openOffscreenDocument();

    const bundle: OffscreenRequestBundle = {
        type: requestType,
        target: 'offscreen',
        data: args,
    };

    try {
        const response: OffscreenResponseBundle = await chrome.runtime.sendMessage(bundle);

        if (response.error) {
            throw new Error(response.error);
        }

        return response.data;
    } finally {
        //await closeOffscreenDocument();
    }
}
