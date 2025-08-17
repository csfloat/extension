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

export function seedInList(seed: string | number, seedList: (string | number)[]) {
    if (!Array.isArray(seedList)) {
        throw new TypeError(`seedList must be an array, got ${typeof seedList}`);
    }

    const numericSeed = Number(seed);
    if (Number.isNaN(numericSeed)) return false;

    const numericList = seedList
        .map(Number)
        .filter(n => !Number.isNaN(n));
    
    return numericList.includes(numericSeed);
}
