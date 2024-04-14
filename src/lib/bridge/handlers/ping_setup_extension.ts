import {SimpleHandler} from './main';
import {RequestType} from './types';
import {environment} from '../../../environment';
import {registerTradeAlarmIfPossible} from '../../alarms/setup';

export interface PingSetupExtensionRequest {}

export interface PingSetupExtensionResponse {}

export const PingSetupExtension = new SimpleHandler<PingSetupExtensionRequest, PingSetupExtensionResponse>(
    RequestType.PING_SETUP_EXTENSION,
    async (req) => {
        await registerTradeAlarmIfPossible();

        const resp = await fetch(`${environment.csfloat_base_api_url}/v1/me/extension/setup`, {
            credentials: 'include',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req),
        });

        if (resp.status !== 200) {
            throw new Error('invalid status');
        }

        return resp.json() as Promise<PingSetupExtensionResponse>;
    }
);
