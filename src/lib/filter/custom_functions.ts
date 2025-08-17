import {InternalInputVars} from './types';

export function percentile(vars: InternalInputVars, rank: number) {
    const minFloat = vars.minfloat > vars.minwearfloat ? vars.minfloat : vars.minwearfloat;
    const maxFloat = vars.maxfloat < vars.maxwearfloat ? vars.maxfloat : vars.maxwearfloat;
    const itemPercentile = 100 - (100 * (vars.float - minFloat)) / (maxFloat - minFloat);

    return itemPercentile > rank;
}

export function percentileRange(vars: InternalInputVars, minRank: number, maxRank: number) {
    const minFloat = vars.minfloat > vars.minwearfloat ? vars.minfloat : vars.minwearfloat;
    const maxFloat = vars.maxfloat < vars.maxwearfloat ? vars.maxfloat : vars.maxwearfloat;
    const itemPercentile = 100 - (100 * (vars.float - minFloat)) / (maxFloat - minFloat);

    return itemPercentile > minRank && itemPercentile < maxRank;
}

export function match(str: string, regex: string) {
    const thisMatch = str.toString().match(regex);

    if (thisMatch !== null) return thisMatch.length;
    else return 0;
}

export function seedInList(seed: string, seeds: string) {
    if (typeof seeds !== "string") {
        throw new TypeError(`seeds must be a string, got ${typeof seeds}`);
    }
    
    if (typeof seed !== "string" && typeof seed !== "number") {
        throw new TypeError(`seed must be a string or number, got ${typeof seed}`);
    }

    const seedStr = seed.toString();

    const seedList = seeds
        .replace(/,/g, ' ')
        .split(/\s+/)
        .map(s => s.trim())
        .filter(s => s.length);
    
    return seedList.includes(seedStr);
}
