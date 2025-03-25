/// <reference lib="deno.ns" />
// This file is meant to be run with Deno, not Node.js
// To use in VS Code without errors, install the Deno extension and reload the window

/**
 * This script generates a JSON file containing the bluegem pattern data for each item.
 * It fetches the data from the bluegem.app API and writes it to a file in the /data directory.
 * To run this script, install deno and run:
 * `npm run generate_bluegem`
 */

interface ItemType {
    def_index: number;
    paint_index: number;
}

const itemTypes: Record<string, ItemType> = {
    'AK-47': {
        def_index: 7,
        paint_index: 44,
    },
    Bayonet: {
        def_index: 500,
        paint_index: 44,
    },
    Bowie_Knife: {
        def_index: 514,
        paint_index: 44,
    },
    Butterfly_Knife: {
        def_index: 515,
        paint_index: 44,
    },
    Classic_Knife: {
        def_index: 503,
        paint_index: 44,
    },
    Falchion_Knife: {
        def_index: 512,
        paint_index: 44,
    },
    'Five-SeveN': {
        def_index: 3,
        paint_index: 44,
    },
    Flip_Knife: {
        def_index: 505,
        paint_index: 44,
    },
    Gut_Knife: {
        def_index: 506,
        paint_index: 44,
    },
    Huntsman_Knife: {
        def_index: 509,
        paint_index: 44,
    },
    Karambit: {
        def_index: 507,
        paint_index: 44,
    },
    Kukri_Knife: {
        def_index: 526,
        paint_index: 44,
    },
    M9_Bayonet: {
        def_index: 508,
        paint_index: 44,
    },
    'MAC-10': {
        def_index: 17,
        paint_index: 44,
    },
    Navaja_Knife: {
        def_index: 520,
        paint_index: 44,
    },
    Nomad_Knife: {
        def_index: 521,
        paint_index: 44,
    },
    Paracord_Knife: {
        def_index: 517,
        paint_index: 44,
    },
    Shadow_Daggers: {
        def_index: 516,
        paint_index: 44,
    },
    Skeleton_Knife: {
        def_index: 525,
        paint_index: 44,
    },
    Stiletto_Knife: {
        def_index: 522,
        paint_index: 44,
    },
    Survival_Knife: {
        def_index: 518,
        paint_index: 44,
    },
    Talon_Knife: {
        def_index: 523,
        paint_index: 44,
    },
    Ursus_Knife: {
        def_index: 519,
        paint_index: 44,
    },
    Desert_Eagle: {
        def_index: 1,
        paint_index: 1054,
    },
    'Five-SeveN_Heat_Treated': {
        def_index: 3,
        paint_index: 831,
    },
};

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

    const combinedData: Record<number, Record<number, PatternData>> = {};

    // Fetch data for each knife type
    for (const [type, typeInfo] of Object.entries(itemTypes)) {
        const data = await fetchPatternData(type);
        if (data) {
            if (!combinedData[typeInfo.def_index]) {
                combinedData[typeInfo.def_index] = {};
            }
            combinedData[typeInfo.def_index][typeInfo.paint_index] = data;
        }
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
