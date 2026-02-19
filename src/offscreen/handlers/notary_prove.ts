import {
    ClosableOffscreenHandler,
    OffscreenRequestType,
    TLSNProveOffscreenRequest,
    TLSNProveOffscreenResponse,
    VerificationResults,
} from './types';
import {getSteamRequestURL} from '../../lib/notary/utils';
import * as Comlink from 'comlink';
import {environment} from '../../environment';
import type {LoggingLevel, Method, Prover as TProver, Reveal} from '@csfloat/tlsn-wasm';

const {init, Prover}: any = Comlink.wrap(new Worker(new URL('../worker.ts', import.meta.url)));

export async function initThreads() {
    await init({
        loggingLevel: environment.notary.loggingLevel as LoggingLevel,
        hardwareConcurrency: navigator.hardwareConcurrency,
        crateFilters: [
            {name: 'yamux', level: 'Info'},
            {name: 'uid_mux', level: 'Info'},
        ],
    });
}

let totalProveRequests = 0;

type ClientMessage = {type: 'register'; maxRecvData: number; maxSentData: number; sessionData?: Record<string, string>}

type ServerMessage =
    | {type: 'session_registered'; sessionId: string}
    | {type: 'session_completed'; payload: string}
    | {type: 'error'; message: string};

/**
 * Registers a session with the verifier and returns the verifier URL and proxy URL
 */
async function registerSession(
    maxRecvData: number,
    maxSentData: number,
    token?: string,
): Promise<{sessionID: string; sessionWs: WebSocket}> {
    return new Promise((resolve, reject) => {
        let url = `${environment.notary.tlsn}/session`;
        if (token) {
            url += `?token=${token}`;
        }

        const ws = new WebSocket(url);

        ws.onopen = () => {
            ws.send(JSON.stringify({type: 'register', maxRecvData, maxSentData} as ClientMessage));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data) as ServerMessage;
            if (data.type === 'session_registered') {
                resolve({sessionID: data.sessionId, sessionWs: ws});
            } else if (data.type === 'error') {
                reject(new Error(data.message));
            }
        };

        ws.onerror = () => reject(new Error('WebSocket connection failed'));
    });
}

function waitForSessionCompleted(ws: WebSocket, timeoutMs = 30_000): Promise<VerificationResults> {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timeout waiting for session_completed')), timeoutMs);

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data) as ServerMessage;
            if (data.type === 'session_completed') {
                clearTimeout(timeout);
                resolve({payload: data.payload});
            } else if (data.type === 'error') {
                clearTimeout(timeout);
                reject(new Error(data.message));
            }
        };
    });
}

export const TLSNProveOffscreenHandler = new ClosableOffscreenHandler<
    TLSNProveOffscreenRequest,
    TLSNProveOffscreenResponse
>(
    OffscreenRequestType.TLSN_PROVE,
    async (request) => {
        totalProveRequests++;

        const serverURL = getSteamRequestURL(request.notary_request, request.access_token);

        // Headers that will be sent with the original request to Steam
        // This MUST accurately depict the headers that the browser will send,
        // otherwise the max sent bytes will be off
        const headers = {
            Connection: 'close',
            Host: 'api.steampowered.com',
            'Accept-Encoding': 'gzip',
        };

        const maxSentData = calculateRequestSize(serverURL, 'GET', headers);

        const maxRecvData = await calculateResponseSize(serverURL, 'GET', headers);

        const maybeNotaryToken = request.notary_request.meta?.notary_token;

        const {sessionID, sessionWs} = await registerSession(
            maxRecvData,
            maxSentData,
            maybeNotaryToken,
        );

        try {
            // Create and setup prover
            const prover = (await new Prover({
                server_name: 'api.steampowered.com',
                max_recv_data: maxRecvData,
                max_sent_data: maxSentData,
                network: 'Latency',
                defer_decryption_from_start: true,
            })) as TProver;

            let verifierUrl = `${environment.notary.tlsn}/verifier?sessionId=${sessionID}`;
            if (maybeNotaryToken) {
                verifierUrl += `&token=${maybeNotaryToken}`;
            }

            await prover.setup(verifierUrl);

            // Convert headers to Map<string, number[]> for WASM
            const headerMap = new Map<string, number[]>();
            for (const [key, value] of Object.entries(headers)) {
                headerMap.set(key, Buffer.from(value).toJSON().data);
            }

            let wsUrl = `${environment.notary.ws}`;
            if (maybeNotaryToken) {
                wsUrl += `?token=${maybeNotaryToken}`;
            }

            // Send HTTP request via proxy
            await prover.send_request(wsUrl, {
                uri: serverURL,
                method: 'GET' as Method,
                headers: headerMap,
                body: undefined,
            });

            const transcript = await prover.transcript();
            const {sent, recv} = transcript;
            const sentStr = Buffer.from(sent).toString('utf-8');

            // Compute reveal ranges (hide the access token)
            const secretRanges = mapStringToRange([request.access_token.token], sentStr);
            const sentRanges = subtractRanges({start: 0, end: sent.length}, secretRanges);
            const recvRanges = [{start: 0, end: recv.length}];

            // Set up listener before calling reveal
            const completedPromise = waitForSessionCompleted(sessionWs);

            // Reveal to verifier
            const reveal: Reveal = {sent: sentRanges, recv: recvRanges, server_identity: true};
            await prover.reveal(reveal);

            return await completedPromise;
        } finally {
            if (sessionWs.readyState === WebSocket.OPEN) {
                sessionWs.close();
            }
        }
    },
    () => {
        // Require the offscreen to be re-initialized after every 5 prove requests
        // Why? A hacky workaround a potential panic of thread counts overflowing as described in
        // https://github.com/tlsnotary/tlsn/issues/959
        return totalProveRequests >= 5;
    }
);

/**
 * Estimates the total request byte size over the wire if sent over HTTP 1.1
 *
 * Of note, it accounts for a quirk in tlsn-js where the GET path includes the domain as well (which isn't needed)
 *
 * Adapted from https://github.com/tlsnotary/tlsn-js/issues/101
 *
 * @param url Full request uRL including protocol, domain, path
 * @param method HTTP method (ie. "GET")
 * @param headers HTTP request headers
 * @param body Optional request body
 */
function calculateRequestSize(
    url: string,
    method: 'GET' | 'POST',
    headers: Record<string, string>,
    body?: string
): number {
    const requestLineSize = new TextEncoder().encode(`${method} ${url} HTTP/1.1\r\n`).length;

    const headersSize = new TextEncoder().encode(
        Object.entries(headers)
            .map(([key, value]) => `${key}: ${value}\r\n`) // CRLF after each header
            .join('')
    ).length;

    const bodySize = body ? new TextEncoder().encode(JSON.stringify(body)).length : 0;

    return requestLineSize + headersSize + 2 + bodySize; // +2 for CRLF after headers
}

/**
 * Calculates the exact response byte size for the HTTP request by making the request itself and counting the response
 *
 * @param url Full request uRL including protocol, domain, path
 * @param method HTTP method (ie. "GET")
 * @param headers HTTP request headers
 * @param body Optional request body
 */
async function calculateResponseSize(
    url: string,
    method: 'GET' | 'POST',
    headers: Record<string, string>,
    body?: string
): Promise<number> {
    const opts: RequestInit = {method, headers};
    if (body) {
        opts.body = body;
    }
    const response = await fetch(url, opts);

    const statusLine = `HTTP/1.1 ${response.status} ${response.statusText}`;
    let headersSize = statusLine.length + 2; // +2 for CRLF (\r\n)

    response.headers.forEach((value, name) => {
        headersSize += name.length + value.length + 4; // for ": " and "\r\n"
    });

    // Not included in fetch headers, but is in the network response
    headersSize += 'Connection: close'.length + 2;
    headersSize += 'X-N: S'.length + 2;

    // Add the final CRLF that separates the headers from the body.
    headersSize += 2;

    const contentLength = response.headers.get('content-length');

    if (!contentLength) {
        throw new Error('no content length in response headers');
    }

    const bodySize = parseInt(contentLength, 10);

    return headersSize + bodySize;
}

/**
 * Computes ranges that hide specified strings from the transcript
 */
function subtractRanges(
    fullRange: {start: number; end: number},
    secretRanges: {start: number; end: number}[]
): {start: number; end: number}[] {
    const sorted = [...secretRanges].sort((a, b) => a.start - b.start);
    const result: {start: number; end: number}[] = [];
    let currentPos = fullRange.start;

    for (const secret of sorted) {
        if (secret.start > currentPos) {
            result.push({start: currentPos, end: secret.start});
        }
        currentPos = Math.max(currentPos, secret.end);
    }

    if (currentPos < fullRange.end) {
        result.push({start: currentPos, end: fullRange.end});
    }

    return result;
}

/**
 * Maps strings to their byte ranges in the transcript
 */
function mapStringToRange(secrets: string[], transcript: string): {start: number; end: number}[] {
    const ranges: {start: number; end: number}[] = [];
    for (const secret of secrets) {
        if (!secret) {
            continue;
        }

        let pos = 0;
        while ((pos = transcript.indexOf(secret, pos)) !== -1) {
            ranges.push({start: pos, end: pos + secret.length});
            pos += secret.length;
        }
    }
    return ranges;
}
