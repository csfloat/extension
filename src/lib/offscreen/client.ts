import {OffscreenRequestBundle, OffscreenResponseBundle} from './types';
import {OffscreenRequestHandler} from './handlers/types';
import {closeOffscreenDocument, openOffscreenDocument} from '../utils/offscreen';

export async function SendToOffscreen<Req, Resp>(
    handler: OffscreenRequestHandler<Req, Resp>,
    args: Req
): Promise<Resp> {
    await openOffscreenDocument();

    const bundle: OffscreenRequestBundle = {
        type: handler.getType(),
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
        await closeOffscreenDocument();
    }
}
