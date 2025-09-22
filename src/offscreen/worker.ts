import * as Comlink from 'comlink';
import init, {Prover, Attestation, Presentation} from 'tlsn-js';

Comlink.expose({
    init,
    Prover,
    Presentation,
    Attestation,
});
