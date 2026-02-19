import type {VerificationResults} from './types';
import {environment} from '../../environment';

type ClientMessage = {
    type: 'register';
    maxRecvData: number;
    maxSentData: number;
    sessionData?: Record<string, string>;
};

type ServerMessage =
    | {type: 'session_registered'; sessionId: string}
    | {type: 'session_completed'; payload: string}
    | {type: 'error'; message: string};

type NonErrorServerMessage = Exclude<ServerMessage, {type: 'error'}>;
type NonErrorServerMessageType = NonErrorServerMessage['type'];

export class NotarySessionClient {
    private constructor(
        private readonly ws: WebSocket,
        private readonly sessionID: string
    ) {}


    getID(): string {
        return this.sessionID;
    }

    static async create(maxRecvData: number, maxSentData: number, token?: string): Promise<NotarySessionClient> {
        const ws = await this.openSocket(this.buildSessionUrl(token));

        ws.send(JSON.stringify({type: 'register', maxRecvData, maxSentData} as ClientMessage));

        const registered = await this.waitForServerMessage(
            ws,
            'session_registered',
            5_000,
            'Timeout waiting for session_registered'
        );

        return new NotarySessionClient(ws, registered.sessionId);
    }

    async finalizeResults(): Promise<VerificationResults> {
        return NotarySessionClient.waitForServerMessage(
            this.ws,
            'session_completed',
            30_000,
            'Timeout waiting for session_completed',
        );
    }

    close(): void {
        if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
            this.ws.close();
        }
    }

    private static buildSessionUrl(token?: string): string {
        let url = `${environment.notary.tlsn}/session`;
        if (token) {
            url += `?token=${token}`;
        }
        return url;
    }

    private static waitForServerMessage<TType extends NonErrorServerMessageType>(
        ws: WebSocket,
        expectedType: TType,
        timeoutMs: number,
        timeoutMessage: string
    ): Promise<Extract<NonErrorServerMessage, {type: TType}>> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                cleanup();
                reject(new Error(timeoutMessage));
            }, timeoutMs);

            const cleanup = () => {
                clearTimeout(timeout);
                ws.removeEventListener('message', onMessage);
                ws.removeEventListener('error', onError);
                ws.removeEventListener('close', onClose);
            };

            const onMessage = (event: MessageEvent) => {
                let message: ServerMessage;
                try {
                    if (typeof event.data !== 'string') {
                        throw new Error('Received non-string WebSocket message');
                    }
                    message = JSON.parse(event.data) as ServerMessage;
                } catch {
                    cleanup();
                    reject(new Error('Failed to parse WebSocket server message'));
                    return;
                }

                if (message.type === 'error') {
                    cleanup();
                    reject(new Error(message.message));
                    return;
                }

                if (message.type !== expectedType) {
                    return;
                }

                cleanup();
                resolve(message as Extract<NonErrorServerMessage, {type: TType}>);
            };

            const onError = () => {
                cleanup();
                reject(new Error('WebSocket connection failed'));
            };

            const onClose = () => {
                cleanup();
                reject(new Error('WebSocket connection closed before expected message'));
            };

            ws.addEventListener('message', onMessage);
            ws.addEventListener('error', onError);
            ws.addEventListener('close', onClose);
        });
    }

    private static openSocket(url: string): Promise<WebSocket> {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(url);

            const cleanup = () => {
                ws.removeEventListener('open', onOpen);
                ws.removeEventListener('error', onError);
            };

            const onOpen = () => {
                cleanup();
                resolve(ws);
            };

            const onError = () => {
                cleanup();
                reject(new Error('WebSocket connection failed'));
            };

            ws.addEventListener('open', onOpen);
            ws.addEventListener('error', onError);
        });
    }
}
