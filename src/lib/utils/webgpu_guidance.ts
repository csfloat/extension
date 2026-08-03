import type {WebGpuUnavailableReason} from '../services/webgpu_availability';

type BrowserFamily = 'chromium' | 'firefox' | 'other';

type DetectedBrowser = {
    family: BrowserFamily;
    browser: string;
    /**
     * Firefox on Linux is the one modern build that still ships WebGPU behind a flag; elsewhere a
     * missing API means an outdated/modified build.
     */
    isLinux: boolean;
};

/**
 * Best-effort UA sniff used ONLY to tailor the recovery copy — availability itself is
 * feature-detected, so a wrong guess shows slightly-off instructions, never a broken viewer.
 * Order matters: Edge/Opera UAs also contain "Chrome", and Android's contains "Linux".
 */
export function detectBrowser(): DetectedBrowser {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isLinux = !/android/i.test(ua) && /linux|x11|cros/i.test(ua);
    if (/edg\//i.test(ua)) return {family: 'chromium', browser: 'Microsoft Edge', isLinux};
    if (/firefox|fxios/i.test(ua)) return {family: 'firefox', browser: 'Firefox', isLinux};
    if (/opr\/|opera/i.test(ua)) return {family: 'chromium', browser: 'Opera', isLinux};
    if (/chrome|chromium/i.test(ua)) return {family: 'chromium', browser: 'Chrome', isLinux};
    return {family: 'other', browser: '', isLinux};
}

/**
 * Reason + browser family → one-paragraph recovery copy, distilled from the csfloat.com cover so
 * both surfaces tell one story. Internal pages (`chrome://…`, `about:…`) are spelled out inline —
 * this renders in a CSS tooltip, which can hold neither links nor copyable text.
 */
export function webGpuGuidance(reason: WebGpuUnavailableReason, b: DetectedBrowser = detectBrowser()): string {
    // Chromium forks keep serving the chrome:// scheme alongside their own, so one path covers all.
    const settingsPath = 'chrome://settings/system';
    const flagsPath = 'chrome://flags/#enable-unsafe-webgpu';

    if (reason === 'no-webgpu') {
        switch (b.family) {
            case 'firefox':
                // Current Firefox ships WebGPU on by default except on Linux, where it still sits
                // behind the flag — the two need different framing.
                return b.isLinux
                    ? 'Firefox on Linux ships with WebGPU turned off. In about:config, accept the warning and set dom.webgpu.enabled to true, then reload this page.'
                    : 'WebGPU is turned off in this Firefox build — current Firefox ships it on by default. Update Firefox, or set dom.webgpu.enabled to true in about:config and reload.';
            case 'chromium':
                return `${b.browser} isn't exposing WebGPU — usually an out-of-date version. Update it, or force-enable WebGPU at ${flagsPath} and relaunch.`;
            default:
                return "This browser doesn't support WebGPU, which the 3D viewer needs. Try the latest Chrome or Firefox.";
        }
    }

    switch (b.family) {
        case 'firefox':
            return "Firefox supports WebGPU but couldn't reach your GPU. Re-enable hardware acceleration under Performance in about:preferences, then restart Firefox.";
        case 'chromium':
            return `${b.browser} supports WebGPU but couldn't reach your GPU — graphics acceleration is usually switched off. Turn on "Use graphics acceleration when available" in ${settingsPath}, then relaunch.`;
        default:
            return "This browser supports WebGPU but couldn't reach your GPU. Update your system and graphics drivers, then restart the browser.";
    }
}
