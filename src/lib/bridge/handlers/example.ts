import {SimpleHandler} from './main';
import {RequestType} from './handlers';

export interface ExampleRequest {
    ping: string;
}

export interface ExampleResponse {
    pong: string;
}

export const Example = new SimpleHandler<ExampleRequest, ExampleResponse>(RequestType.EXAMPLE, async (req, sender) => {
    return {pong: `${req.ping} reply!`};
});
