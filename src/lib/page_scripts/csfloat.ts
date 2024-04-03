import {init} from './utils';
import {ClientSend} from '../bridge/client';
import {ExtensionVersion} from '../bridge/handlers/extension_version';

init('src/lib/page_scripts/csfloat.js', main);

async function main() {
    // @ts-ignore
    window.CSFLOAT_EXTENSION_ENABLED = true;
    const resp = await ClientSend(ExtensionVersion, {});
    // @ts-ignore
    window.CSFLOAT_EXTENSION_VERSION = resp.version;
}
