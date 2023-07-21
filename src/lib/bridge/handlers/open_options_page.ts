import {RequestHandler} from '../types';
import {RequestType} from './types';
import {isFirefox} from '../../utils/detect';

class OpenOptionsPageHandler implements RequestHandler<undefined, void> {
    getType(): RequestType {
        return RequestType.OPEN_OPTIONS_PAGE;
    }

    async handleRequest(request: undefined, sender: chrome.runtime.MessageSender): Promise<void> {
        if (isFirefox()) {
            return await browser.runtime.openOptionsPage();
        }

        return chrome.runtime.openOptionsPage();
    }
}

export const OpenOptionsPage = new OpenOptionsPageHandler();
