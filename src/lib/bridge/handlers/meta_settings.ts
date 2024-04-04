import {EmptyRequestHandler} from './main';
import {RequestType} from './types';

export interface MetaSettingsResponse {
    enable_auto_trade: boolean;
}

export const MetaSettings = new EmptyRequestHandler<MetaSettingsResponse>(RequestType.META_SETTINGS, async (req) => {
    const resp = await fetch(`https://csfloat.com/api/v1/meta/extension`, {
        credentials: 'include',
    });

    if (resp.status !== 200) {
        throw new Error('invalid status');
    }

    return resp.json() as Promise<MetaSettingsResponse>;
});
