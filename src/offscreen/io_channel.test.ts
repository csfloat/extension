import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {WebSocketIoChannel} from './io_channel';

class FakeWebSocket extends EventTarget {
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSING = 2;
    static readonly CLOSED = 3;
    static latest?: FakeWebSocket;

    readonly sent: Uint8Array[] = [];
    binaryType: BinaryType = 'blob';
    readyState = FakeWebSocket.CONNECTING;

    constructor(readonly url: string) {
        super();
        FakeWebSocket.latest = this;
    }

    open(): void {
        this.readyState = FakeWebSocket.OPEN;
        this.dispatchEvent(new Event('open'));
    }

    message(data: ArrayBuffer): void {
        const event = new Event('message');
        Object.defineProperty(event, 'data', {value: data});
        this.dispatchEvent(event);
    }

    send(data: ArrayBufferView | ArrayBuffer): void {
        const bytes =
            data instanceof ArrayBuffer
                ? new Uint8Array(data)
                : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
        this.sent.push(new Uint8Array(bytes));
    }

    close(): void {
        if (this.readyState === FakeWebSocket.CLOSED) {
            return;
        }
        this.readyState = FakeWebSocket.CLOSED;
        this.dispatchEvent(new Event('close'));
    }
}

const originalWebSocket = globalThis.WebSocket;

describe('WebSocketIoChannel', () => {
    beforeEach(() => {
        FakeWebSocket.latest = undefined;
        globalThis.WebSocket = FakeWebSocket as unknown as typeof WebSocket;
    });

    afterEach(() => {
        globalThis.WebSocket = originalWebSocket;
    });

    it('queues binary messages and returns EOF on close', async () => {
        const channelPromise = WebSocketIoChannel.connect('wss://notary.test/verifier');
        const socket = FakeWebSocket.latest!;
        socket.open();
        const channel = await channelPromise;

        socket.message(new Uint8Array([1, 2, 3]).buffer);
        await expect(channel.read()).resolves.toEqual(new Uint8Array([1, 2, 3]));

        const pendingRead = channel.read();
        socket.close();
        await expect(pendingRead).resolves.toBeNull();
        await expect(channel.read()).resolves.toBeNull();
    });

    it('preserves write order and rejects writes after close', async () => {
        const channelPromise = WebSocketIoChannel.connect('wss://notary.test/verifier');
        const socket = FakeWebSocket.latest!;
        socket.open();
        const channel = await channelPromise;

        await channel.write(new Uint8Array([1]));
        await channel.write(new Uint8Array([2]));
        expect(socket.sent).toEqual([new Uint8Array([1]), new Uint8Array([2])]);

        await channel.close();
        await expect(channel.write(new Uint8Array([3]))).rejects.toThrow('closed');
    });
});
