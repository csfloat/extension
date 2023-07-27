import {RequestHandler} from '../types';
import {RequestType} from './types';
import {isFirefox} from '../../utils/detect';
import {EmptyRequestHandler} from './main';

export const OpenOptionsPage = new EmptyRequestHandler<void>(RequestType.OPEN_OPTIONS_PAGE, async () => {
    if (isFirefox()) {
        return await browser.runtime.openOptionsPage();
    }

    return chrome.runtime.openOptionsPage();
});
