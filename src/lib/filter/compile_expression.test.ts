import {describe, expect, it} from 'vitest';
import {compileExpression, type FilterValue} from './compile_expression';
import type {InternalInputVars} from './types';

const VARS: InternalInputVars = {
    float: 0.2,
    seed: 555,
    minfloat: 0,
    maxfloat: 1,
    minwearfloat: 0,
    maxwearfloat: 1,
    phase: 'Ruby',
    low_rank: 10,
    high_rank: 90,
    price: 100,
    pattern: 387,
};

/** Compile and run in one step against {@link VARS} (or an override). */
function run(expression: string, vars: Partial<InternalInputVars> = {}): FilterValue {
    return compileExpression(expression)({...VARS, ...vars});
}

describe('literals and variables', () => {
    it('reads numbers, strings, and booleans', () => {
        expect(run('42')).toBe(42);
        expect(run('.5')).toBe(0.5);
        expect(run('1e3')).toBe(1000);
        expect(run("'hello'")).toBe('hello');
        expect(run('true')).toBe(true);
        expect(run('false')).toBe(false);
    });

    it('resolves variables', () => {
        expect(run('float')).toBe(0.2);
        expect(run('phase')).toBe('Ruby');
    });

    it('returns an error for unknown/undefined variables', () => {
        expect(run('nope')).toBeInstanceOf(Error);
        expect(run('price', {price: undefined})).toBeInstanceOf(Error);
    });
});

describe('arithmetic', () => {
    it('respects precedence and associativity', () => {
        expect(run('1 + 2 * 3')).toBe(7);
        expect(run('(1 + 2) * 3')).toBe(9);
        expect(run('2 ^ 3 ^ 2')).toBe(512); // right-associative
        expect(run('-2 ^ 2')).toBe(4); // unary binds tighter than ^
        expect(run('7 % 3')).toBe(1);
    });

    it('overloads + for string concatenation', () => {
        expect(run("'a' + 'b'")).toBe('ab');
        expect(run("'x' + 1")).toBe('x1');
    });

    it('rejects arithmetic on non-numbers', () => {
        expect(run("'a' - 1")).toBeInstanceOf(Error);
    });
});

describe('comparisons and equality', () => {
    it('compares numbers and strings', () => {
        expect(run('float < 0.5')).toBe(true);
        expect(run('float >= 0.2')).toBe(true);
        expect(run("'a' < 'b'")).toBe(true);
    });

    it('uses strict equality with no coercion', () => {
        expect(run('5 == 5')).toBe(true);
        expect(run("5 == '5'")).toBe(false);
        expect(run('5 != 6')).toBe(true);
        expect(run('5 = 5')).toBe(true); // = is an alias for ==
    });

    it('errors when comparing across types', () => {
        expect(run("1 < 'a'")).toBeInstanceOf(Error);
    });
});

describe('logical operators', () => {
    it('evaluates and/or/not', () => {
        expect(run('true and false')).toBe(false);
        expect(run('true or false')).toBe(true);
        expect(run('not false')).toBe(true);
    });

    it('short-circuits so the right side is not required to be valid', () => {
        expect(run('false and nope')).toBe(false);
        expect(run('true or nope')).toBe(true);
    });
});

describe('membership', () => {
    it('handles in and not in', () => {
        expect(run('seed in (1, 555, 999)')).toBe(true);
        expect(run('seed not in (1, 2, 3)')).toBe(true);
        expect(run("phase in ('Emerald', 'Ruby')")).toBe(true);
    });
});

describe('functions', () => {
    it('supports built-in math functions', () => {
        expect(run('abs(-3)')).toBe(3);
        expect(run('max(1, 5, 2)')).toBe(5);
        expect(run('round(1.6)')).toBe(2);
    });

    it('supports injected extra functions', () => {
        const runner = compileExpression('double(seed)', {
            extraFunctions: {double: (n: number) => n * 2},
        });
        expect(runner(VARS)).toBe(1110);
    });

    it('errors on unknown functions', () => {
        expect(run('bogus(1)')).toBeInstanceOf(Error);
    });
});

describe('error handling', () => {
    it('never throws, returning an Error for malformed input', () => {
        expect(() => compileExpression('1 +')).not.toThrow();
        expect(run('1 +')).toBeInstanceOf(Error);
        expect(run('(1 + 2')).toBeInstanceOf(Error);
        expect(run("'unterminated")).toBeInstanceOf(Error);
        expect(run('1 @ 2')).toBeInstanceOf(Error);
    });
});
