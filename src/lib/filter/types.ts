export interface InternalInputVars {
    float: number;
    seed: number;
    minfloat: number;
    maxfloat: number;
    minwearfloat: number;
    maxwearfloat: number;
    phase: string;
    low_rank: number;
    high_rank: number;
    price?: number;
    pattern?: number;
}

export interface SerializedFilter {
    expression: string;
    colour: string;
    isGlobal: boolean;
}
