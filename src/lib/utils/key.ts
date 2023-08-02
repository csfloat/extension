/**
 * Returns the registered Steam Web API key for the user, if it exists.
 *
 * If the key cannot be found, throws an error.
 */
export async function fetchRegisteredSteamAPIKey(): Promise<string> {
    const pageResponse = await fetch('https://steamcommunity.com/dev/apikey');
    const pageText = await pageResponse.text();

    const match = pageText.match(/: ([0-9A-Z]{32})[^0-9A-Z]/);
    if (match) {
        return match[1];
    }

    throw new Error('failed to find registered API key');
}
