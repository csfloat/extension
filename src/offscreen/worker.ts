import * as Comlink from 'comlink';
import initWasm, {LoggingLevel, initialize, Prover, CrateLogFilter, LoggingConfig} from '@csfloat/tlsn-wasm';
import {environment} from '../environment';

async function init(config?: {
    loggingLevel?: LoggingLevel;
    hardwareConcurrency?: number;
    crateFilters?: CrateLogFilter[];
}): Promise<void> {
    const {
        loggingLevel = environment.notary.loggingLevel as LoggingLevel,
        hardwareConcurrency = navigator.hardwareConcurrency || 4,
        crateFilters,
    } = config || {};

    await initWasm();

    const loggingConfig: LoggingConfig = {
        level: loggingLevel,
        crate_filters: crateFilters || [],
        span_events: undefined,
    };

    await initialize(loggingConfig, hardwareConcurrency);
}

Comlink.expose({
    init,
    Prover,
});
