import {EmptyRequestHandler, SimpleHandler} from './main';
import {RequestType} from './types';

export interface ProveTradesTokenRequest {
    token: string;
}

export interface ProveTradesTokenResponse {
    message: string;
}

export const ProveTradesToken = new SimpleHandler<ProveTradesTokenRequest, ProveTradesTokenResponse>(
    RequestType.PROVE_TRADES_TOKEN,
    async (req) => {
        const resp = await fetch(`https://csfloat.com/api/v1/trades/prove-token?token=${req.token}`, {
            credentials: 'include',
        });

        if (resp.status !== 200) {
            throw new Error('failed to prove, are you logged into CSFloat?');
        }

        return resp.json() as Promise<ProveTradesTokenResponse>;
    }
);
