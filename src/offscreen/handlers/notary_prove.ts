import {
    OffscreenRequestType,
    SimpleOffscreenHandler,
    TLSNProveOffscreenRequest,
    TLSNProveOffscreenResponse,
} from './types';
import {getSteamRequestURL} from '../../lib/notary/utils';
import * as Comlink from 'comlink';
import {environment} from '../../environment';
import {
    Prover as TProver,
    Presentation as TPresentation,
    Commit,
    NotaryServer,
    Transcript,
    mapStringToRange,
    subtractRanges,
} from 'tlsn-js';
import {HTTPParser} from 'http-parser-js';
const { init, Prover, Presentation }: any = Comlink.wrap(
    new Worker(new URL('../worker.ts', import.meta.url)),
);

export async function initThreads() {
    await init({
        loggingLevel: environment.notary.loggingLevel,
        hardwareConcurrency: navigator.hardwareConcurrency,
    });
};

export const TLSNProveOffscreenHandler = new SimpleOffscreenHandler<TLSNProveOffscreenRequest, TLSNProveOffscreenResponse>(
    OffscreenRequestType.TLSN_PROVE,
    async (request) => {
        const serverURL = getSteamRequestURL(request.notary_request, request.access_token);

        // Getting max sent bytes as close as possible to the real req size is crucial for performance
        const maxSentData = calculateRequestSize(serverURL,'GET', {
            'Connection': 'close',
            'Host': 'api.steampowered.com',
            'Accept-Encoding': 'gzip',
        });

        const notary = NotaryServer.from(environment.notary.tlsn);

        const prover = (await new Prover({
            serverDns: 'api.steampowered.com',
            maxRecvData: 12000,
            maxSentData,
        })) as TProver;

        await prover.setup(await notary.sessionUrl());

        const resp = await prover.sendRequest(environment.notary.ws, {
            url: serverURL,
            method: 'GET',
            headers: {
                'Accept-Encoding': 'gzip',
            }
        });

        const transcript = await prover.transcript();
        const { sent, recv } = transcript;

        const {
            info: recvInfo,
            headers: recvHeaders,
            body: recvBody,
        } = parseHttpMessage(Buffer.from(recv), 'response');

        const commit: Commit = {
            sent: subtractRanges(
                { start: 0, end: sent.length },
                mapStringToRange(
                    [request.access_token.token],
                    Buffer.from(sent).toString('utf-8'),
                ),
            ),
            recv: [
                // No secrets in response body
                {start: 0, end: recv.length },
            ],
        };
        const notarizationOutputs = await prover.notarize(commit);

        const presentation = (await new Presentation({
            attestationHex: notarizationOutputs.attestation,
            secretsHex: notarizationOutputs.secrets,
            notaryUrl: notarizationOutputs.notaryUrl,
            websocketProxyUrl: notarizationOutputs.websocketProxyUrl,
            reveal: { ...commit, server_identity: false },
        })) as TPresentation;

        const presentationJSON = await presentation.json();

        return {
            presentation: presentationJSON,
        };
    }
);

function parseHttpMessage(buffer: Buffer, type: 'request' | 'response') {
    const parser = new HTTPParser(
        type === 'request' ? HTTPParser.REQUEST : HTTPParser.RESPONSE,
    );
    const body: Buffer[] = [];
    let complete = false;
    let headers: string[] = [];

    parser.onBody = (t) => {
        body.push(t);
    };

    parser.onHeadersComplete = (res) => {
        headers = res.headers;
    };

    parser.onMessageComplete = () => {
        complete = true;
    };

    parser.execute(buffer);
    parser.finish();

    if (!complete) throw new Error(`Could not parse ${type.toUpperCase()}`);

    return {
        info: buffer.toString('utf-8').split('\r\n')[0] + '\r\n',
        headers,
        body,
    };
}

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
export function calculateRequestSize(url: string, method: 'GET'|'POST', headers: Record<string, string>, body?: string): number {
    const requestLineSize = new TextEncoder().encode(
        `${method} ${url} HTTP/1.1\r\n`,
    ).length;

    const headersSize = new TextEncoder().encode(
        Object.entries(headers)
            .map(([key, value]) => `${key}: ${value}\r\n`) // CRLF after each header
            .join(""),
    ).length;

    const bodySize = body
        ? new TextEncoder().encode(JSON.stringify(body)).length
        : 0;

    return requestLineSize + headersSize + 2 + bodySize; // +2 for CRLF after headers
}