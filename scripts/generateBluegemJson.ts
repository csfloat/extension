/// <reference lib="deno.ns" />
// This file is meant to be run with Deno, not Node.js
// To use in VS Code without errors, install the Deno extension and reload the window

/**
 * This script generates a JSON file containing the bluegem pattern data for each item.
 * It fetches the data from the bluegem.app API and writes it to a file in the dist/data directory.
 * To run this script, install deno and run:
 * `deno run --allow-net --allow-write --allow-read scripts/generateBluegemJson.ts`
 * or
 * `npm run generate_bluegem`
 */

const itemTypes = [
    'AK-47',
    'Bayonet',
    'Bowie_Knife',
    'Butterfly_Knife',
    'Classic_Knife',
    'Falchion_Knife',
    'Five-SeveN',
    'Flip_Knife',
    'Gut_Knife',
    'Huntsman_Knife',
    'Karambit',
    'Kukri_Knife',
    'M9_Bayonet',
    'MAC-10',
    'Navaja_Knife',
    'Nomad_Knife',
    'Paracord_Knife',
    'Shadow_Daggers',
    'Skeleton_Knife',
    'Stiletto_Knife',
    'Survival_Knife',
    'Talon_Knife',
    'Ursus_Knife',
    'Desert_Eagle',
    'Five-SeveN_Heat_Treated',
];

interface PatternData {
    [key: string]: unknown;
}

/**
 * Fetches pattern data for a specific knife type
 */
async function fetchPatternData(type: string): Promise<PatternData | null> {
    try {
        const url = `https://cdn.bluegem.app/patterns/${type}.json`;
        console.log(`Fetching data from ${url}...`);

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.json();
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error fetching data for ${type}:`, errorMessage);
        return null;
    }
}

/**
 * Main function to fetch and combine pattern data
 */
async function main() {
    const outputDir = './data';

    // Create output directory if it doesn't exist
    try {
        await Deno.mkdir(outputDir, {recursive: true});
    } catch (error) {
        if (!(error instanceof Deno.errors.AlreadyExists)) {
            throw error;
        }
    }

    const combinedData: Record<string, PatternData | null> = {};

    // Fetch data for each knife type
    for (const type of itemTypes) {
        const data = await fetchPatternData(type);
        combinedData[type] = data;
        await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Write combined data to file
    const outputPath = `${outputDir}/bluegem.json`;
    await Deno.writeTextFile(outputPath, JSON.stringify(combinedData, null, 2));

    console.log(`Combined data written to ${outputPath}`);
}

// Run the main function
if (import.meta.main) {
    main().catch((error) => {
        console.error('An error occurred:', error instanceof Error ? error.message : String(error));
        Deno.exit(1);
    });
}
