import type {IoChannel} from '@csfloat/tlsn-wasm';

type PendingRead = {
    resolve: (value: Uint8Array | null) => void;
    reject: (reason: Error) => void;
};

/**
 * Adapts a browser WebSocket to the duplex channel expected by TLSNotary.
 */
export class WebSocketIoChannel implements IoChannel {
    private readonly reads: Uint8Array[] = [];
    private readonly pendingReads: PendingRead[] = [];
    private failure?: Error;
    private closed = false;
    private messageChain = Promise.resolve();

    private constructor(private readonly socket: WebSocket) {
        socket.binaryType = 'arraybuffer';
        socket.addEventListener('message', (event) => {
            this.messageChain = this.messageChain
                .then(async () => this.enqueue(await normalizeMessage(event.data)))
                .catch((error: unknown) => this.fail(asError(error)));
        });
        socket.addEventListener('error', () => this.fail(new Error('WebSocket I/O channel failed')));
        socket.addEventListener('close', () => this.finish());
    }

    static connect(url: string): Promise<WebSocketIoChannel> {
        return new Promise((resolve, reject) => {
            const socket = new WebSocket(url);

            const onOpen = () => {
                cleanup();
                resolve(new WebSocketIoChannel(socket));
            };
            const onError = () => {
                cleanup();
                socket.close();
                reject(new Error(`Failed to open WebSocket I/O channel: ${url}`));
            };
            const onClose = () => {
                cleanup();
                reject(new Error(`WebSocket I/O channel closed before opening: ${url}`));
            };
            const cleanup = () => {
                socket.removeEventListener('open', onOpen);
                socket.removeEventListener('error', onError);
                socket.removeEventListener('close', onClose);
            };

            socket.addEventListener('open', onOpen);
            socket.addEventListener('error', onError);
            socket.addEventListener('close', onClose);
        });
    }

    read(): Promise<Uint8Array | null> {
        const queued = this.reads.shift();
        if (queued) {
            return Promise.resolve(queued);
        }
        if (this.failure) {
            return Promise.reject(this.failure);
        }
        if (this.closed) {
            return Promise.resolve(null);
        }

        return new Promise((resolve, reject) => {
            this.pendingReads.push({resolve, reject});
        });
    }

    async write(data: Uint8Array): Promise<void> {
        if (this.failure) {
            throw this.failure;
        }
        if (this.closed || this.socket.readyState !== WebSocket.OPEN) {
            throw new Error('Cannot write to a closed WebSocket I/O channel');
        }

        this.socket.send(data);
    }

    close(): Promise<void> {
        if (this.closed || this.socket.readyState === WebSocket.CLOSED) {
            this.finish();
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            this.socket.addEventListener('close', () => resolve(), {once: true});
            this.socket.close();
        });
    }

    private enqueue(data: Uint8Array): void {
        if (this.closed || this.failure) {
            return;
        }

        const pending = this.pendingReads.shift();
        if (pending) {
            pending.resolve(data);
        } else {
            this.reads.push(data);
        }
    }

    private fail(error: Error): void {
        if (this.failure || this.closed) {
            return;
        }

        this.failure = error;
        for (const pending of this.pendingReads.splice(0)) {
            pending.reject(error);
        }
        if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
            this.socket.close();
        }
    }

    private finish(): void {
        if (this.closed) {
            return;
        }

        this.closed = true;
        for (const pending of this.pendingReads.splice(0)) {
            pending.resolve(null);
        }
    }
}

async function normalizeMessage(data: unknown): Promise<Uint8Array> {
    if (data instanceof ArrayBuffer) {
        return new Uint8Array(data);
    }
    if (ArrayBuffer.isView(data)) {
        return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    }
    if (typeof Blob !== 'undefined' && data instanceof Blob) {
        return new Uint8Array(await data.arrayBuffer());
    }
    throw new Error('TLSNotary WebSocket received a non-binary message');
}

function asError(error: unknown): Error {
    return error instanceof Error ? error : new Error(String(error));
}
