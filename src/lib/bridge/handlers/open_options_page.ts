import {RequestType} from './types';
import {runtimeNamespace} from '../../utils/detect';
import {EmptyRequestHandler} from './main';

export const OpenOptionsPage = new EmptyRequestHandler<void>(RequestType.OPEN_OPTIONS_PAGE, async () => {
    return await runtimeNamespace().runtime.openOptionsPage();
});
