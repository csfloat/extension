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

        const notary = NotaryServer.from(environment.notary.tlsn);

        const prover = (await new Prover({
            serverDns: 'api.steampowered.com',
            maxRecvData: 2048,
            maxSentData: 800,
        })) as TProver;

        await prover.setup(await notary.sessionUrl());

        const resp = await prover.sendRequest(environment.notary.ws, {
            url: serverURL,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                secret: 'test_secret',
            },
            body: {
                hello: 'world',
                one: 1,
            },
        });

        const transcript = await prover.transcript();
        const { sent, recv } = transcript;

        const {
            info: recvInfo,
            headers: recvHeaders,
            body: recvBody,
        } = parseHttpMessage(Buffer.from(recv), 'response');

        const body = JSON.parse(recvBody[0].toString());

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