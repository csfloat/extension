
export interface InternalInputVars {
    float: number;
    seed: number;
    minfloat: number;
    maxfloat: number;
    minwearfloat: number;
    maxwearfloat: number;
    phase: string;
}

export interface SerializedFilter {
    expression: string;
    colour: string;
    isGlobal: boolean;
}
