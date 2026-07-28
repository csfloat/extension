export type WebGpuAvailability = 'checking' | 'available' | 'unavailable';

interface WebGpuApi {
    requestAdapter(): Promise<unknown | null>;
}

interface WebGpuNavigator extends Navigator {
    gpu?: WebGpuApi;
}

/**
 * Requesting an adapter verifies WebGPU actually works for this browser/GPU configuration —
 * including hardware acceleration and driver support — without allocating a GPUDevice. A present
 * `navigator.gpu` is not enough on its own.
 */
async function detectWebGpuAvailability(browserNavigator?: Pick<WebGpuNavigator, 'gpu'>): Promise<boolean> {
    const gpu = browserNavigator?.gpu;
    if (!gpu) return false;

    try {
        return (await gpu.requestAdapter()) != null;
    } catch {
        return false;
    }
}

/**
 * Browser-level WebGPU capability check, gating every 3D affordance.
 *
 * `navigator.gpu` is not Baseline — absent in Firefox before 141 and platform-dependent after
 * (https://developer.mozilla.org/en-US/docs/Web/API/Navigator/gpu#browser_compatibility), and the
 * manifest supports Firefox 127+. Those clients see no 3D button at all, which is useful context
 * for support tickets asking where it went.
 */
class WebGpuAvailabilityService {
    private readonly browserNavigator = typeof navigator === 'undefined' ? undefined : (navigator as WebGpuNavigator);

    private state: WebGpuAvailability = this.browserNavigator?.gpu ? 'checking' : 'unavailable';
    private probe?: Promise<void>;

    /** Pessimistic until the probe settles: 'checking' is not treated as available. */
    get status(): WebGpuAvailability {
        return this.state;
    }

    get available(): boolean {
        return this.state === 'available';
    }

    /** Resolves once the probe settles, starting it on first call. */
    async settled(): Promise<WebGpuAvailability> {
        if (this.state === 'checking') {
            this.probe ??= detectWebGpuAvailability(this.browserNavigator).then((available) => {
                this.state = available ? 'available' : 'unavailable';
            });
            await this.probe;
        }

        return this.state;
    }
}

export const gWebGpuAvailability = new WebGpuAvailabilityService();
