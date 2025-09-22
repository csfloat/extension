import {OffscreenRequestBundle, OffscreenResponseBundle} from './types';
import {OffscreenRequestType} from './handlers/types';
import {closeOffscreenDocument, openOffscreenDocument} from '../offscreen/utils';

export async function SendToOffscreen<Req, Resp>(requestType: OffscreenRequestType, args: Req): Promise<Resp> {
    await openOffscreenDocument();

    const bundle: OffscreenRequestBundle = {
        type: requestType,
        target: 'offscreen',
        data: args,
    };

    const response: OffscreenResponseBundle = await chrome.runtime.sendMessage(bundle);

    if (response.shouldClose) {
        await closeOffscreenDocument();
    }

    if (response.error) {
        throw new Error(response.error);
    }

    return response.data;
}
