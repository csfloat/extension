import type {InternalInputVars} from './types';

/*
 * A tiny AST-based expression engine for user-authored filters.
 *
 * Produces either a number, string, boolean, or an error, but never throws.
 * The result is a Runner function that can be called with a set of variables to produce a single result.
 */

export type FilterValue = number | string | boolean | Error;
type Callable = (...args: any[]) => FilterValue;
type Runner = (vars: InternalInputVars) => FilterValue;

interface CompileOptions {
    extraFunctions?: Record<string, Callable>;
}

type TokenType = 'number' | 'string' | 'identifier' | 'operator' | 'paren' | 'comma' | 'eof';

interface Token {
    type: TokenType;
    value: string;
    /** Index of the token's first character in the source string, used for error messages. */
    position: number;
}

type AstNode =
    | {type: 'literal'; value: number | string | boolean}
    | {type: 'identifier'; name: string}
    | {type: 'unary'; operator: string; argument: AstNode}
    | {type: 'binary'; operator: string; left: AstNode; right: AstNode}
    | {type: 'call'; name: string; args: AstNode[]}
    | {type: 'list'; values: AstNode[]};

const DEFAULT_FUNCTIONS: Record<string, Callable> = {
    abs: Math.abs,
    ceil: Math.ceil,
    floor: Math.floor,
    log: Math.log,
    max: Math.max,
    min: Math.min,
    random: Math.random,
    round: Math.round,
    sqrt: Math.sqrt,
};

/**
 * Compiles an expression once into a reusable {@link Runner}.
 * This is the expensive part, so it can be cached and reused.
 */
export function compileExpression(expression: string, options: CompileOptions = {}): Runner {
    // Null prototype prevents user identifiers from being callable.
    const functions: Record<string, Callable> = Object.assign(
        Object.create(null),
        DEFAULT_FUNCTIONS,
        options.extraFunctions
    );

    let ast: AstNode;
    try {
        const tokens = tokenize(expression);
        ast = new Parser(tokens).parse();
    } catch (e) {
        return errorRunner(e);
    }

    return (vars: InternalInputVars) => {
        try {
            return evaluate(ast, vars, functions);
        } catch (e: any) {
            return e instanceof Error ? e : new Error(String(e));
        }
    };
}

/** Builds a runner that ignores its input and always returns the given error. */
function errorRunner(e: unknown): Runner {
    const error = e instanceof Error ? e : new Error(String(e));
    return () => error;
}

/**
 * Stage 1: turns the raw source into a flat token list. A single forward scan with no backtracking;
 * each branch consumes one token's worth of characters and advances `pos`. Throws on malformed input
 * (unterminated string, stray character, ...). A trailing `eof` token lets the parser peek safely.
 */
function tokenize(expression: string): Token[] {
    const tokens: Token[] = [];
    let pos = 0;

    while (pos < expression.length) {
        const char = expression[pos];

        if (/\s/.test(char)) {
            pos++;
            continue;
        }

        // String literal: supports both quote styles and backslash escapes (see readEscapedCharacter).
        if (char === '"' || char === "'") {
            const start = pos;
            const quote = char;
            let value = '';
            pos++;

            while (pos < expression.length) {
                const current = expression[pos++];

                if (current === quote) {
                    tokens.push({type: 'string', value, position: start});
                    break;
                }

                if (current === '\\') {
                    if (pos >= expression.length) {
                        throw new Error(`unterminated escape sequence at ${start}`);
                    }

                    value += readEscapedCharacter(expression[pos++]);
                } else {
                    value += current;
                }
            }

            // We only pushed a token above if the closing quote was found. Since each token's position
            // is unique, a missing token at `start` means we ran off the end without closing the string.
            if (tokens[tokens.length - 1]?.position !== start) {
                throw new Error(`unterminated string at ${start}`);
            }

            continue;
        }

        if (isNumberStart(expression, pos)) {
            const start = pos;
            pos = readNumber(expression, pos);
            tokens.push({type: 'number', value: expression.slice(start, pos), position: start});
            continue;
        }

        // A word: either a reserved word operator or an identifier. `true`/`false` stay identifiers here and become literals later.
        if (/[A-Za-z_]/.test(char)) {
            const start = pos;
            pos++;

            while (pos < expression.length && /[A-Za-z0-9_]/.test(expression[pos])) {
                pos++;
            }

            const value = expression.slice(start, pos);
            const normalized = value.toLowerCase();
            if (['and', 'or', 'not', 'in'].includes(normalized)) {
                tokens.push({type: 'operator', value: normalized, position: start});
            } else {
                tokens.push({type: 'identifier', value, position: start});
            }

            continue;
        }

        const twoCharOperator = expression.slice(pos, pos + 2);
        if (['>=', '<=', '==', '!='].includes(twoCharOperator)) {
            tokens.push({type: 'operator', value: twoCharOperator, position: pos});
            pos += 2;
            continue;
        }

        if (['>', '<', '+', '-', '*', '/', '%', '^', '='].includes(char)) {
            tokens.push({type: 'operator', value: char, position: pos});
            pos++;
            continue;
        }

        if (char === '(' || char === ')') {
            tokens.push({type: 'paren', value: char, position: pos});
            pos++;
            continue;
        }

        if (char === ',') {
            tokens.push({type: 'comma', value: char, position: pos});
            pos++;
            continue;
        }

        throw new Error(`unexpected character "${char}" at ${pos}`);
    }

    tokens.push({type: 'eof', value: '', position: expression.length});
    return tokens;
}

/** Maps the character after a backslash to its value. Unknown escapes are kept literal (e.g. `\"` -> `"`). */
function readEscapedCharacter(char: string): string {
    switch (char) {
        case 'n':
            return '\n';
        case 'r':
            return '\r';
        case 't':
            return '\t';
        default:
            return char;
    }
}

/** True if a number token starts here: a digit, or a leading dot immediately followed by a digit (`.5`). */
function isNumberStart(expression: string, pos: number): boolean {
    const char = expression[pos];
    const next = expression[pos + 1];
    return /[0-9]/.test(char) || (char === '.' && /[0-9]/.test(next));
}

/**
 * Scans a numeric literal (integer, decimal, or scientific notation) and returns the index just past it.
 * The actual numeric conversion is deferred to the parser; here we only delimit the token. Throws if an
 * `e` exponent has no digits (e.g. `1e`).
 */
function readNumber(expression: string, pos: number): number {
    const start = pos;

    // Integer part.
    while (pos < expression.length && /[0-9]/.test(expression[pos])) pos++;

    // Optional fractional part.
    if (expression[pos] === '.') {
        pos++;
        while (pos < expression.length && /[0-9]/.test(expression[pos])) pos++;
    }

    // Optional exponent, e.g. `e-10`.
    if (expression[pos]?.toLowerCase() === 'e') {
        const exponentStart = pos;
        pos++;
        if (expression[pos] === '+' || expression[pos] === '-') pos++;

        const digitsStart = pos;
        while (pos < expression.length && /[0-9]/.test(expression[pos])) pos++;

        if (digitsStart === pos) {
            throw new Error(`invalid number at ${start}: ${expression.slice(start, exponentStart + 1)}`);
        }
    }

    return pos;
}

/**
 * Stage 2: recursive-descent parser. Each `parseX` method handles one precedence level and delegates
 * to the next-tighter-binding level, so the call chain itself encodes precedence from loosest to
 * tightest:
 *
 *   or -> and -> not -> comparison/in -> additive -> multiplicative -> power -> unary -> primary
 *
 * Most binary operators are left-associative (loop and fold left). `^` is right-associative and `not`
 * is a prefix unary, so those recurse into themselves instead of looping.
 */
class Parser {
    private position = 0;

    constructor(private tokens: Token[]) {}

    /** Parses the whole token stream and asserts nothing is left over after the expression. */
    parse(): AstNode {
        const expression = this.parseOr();
        this.expect('eof');
        return expression;
    }

    /** Lowest precedence: `a or b or c`, left-associative. */
    private parseOr(): AstNode {
        let node = this.parseAnd();

        while (this.matchOperator('or')) {
            node = {type: 'binary', operator: 'or', left: node, right: this.parseAnd()};
        }

        return node;
    }

    /** `a and b`, binds tighter than `or`, left-associative. */
    private parseAnd(): AstNode {
        let node = this.parseNot();

        while (this.matchOperator('and')) {
            node = {type: 'binary', operator: 'and', left: node, right: this.parseNot()};
        }

        return node;
    }

    /** Prefix `not`. Recurses so `not not x` chains; binds looser than comparisons (`not a == b`). */
    private parseNot(): AstNode {
        if (this.matchOperator('not')) {
            return {type: 'unary', operator: 'not', argument: this.parseNot()};
        }

        return this.parseComparison();
    }

    /**
     * Comparisons and membership tests. The loop allows folding (`a < b < c` parses as `(a < b) < c`)
     * rather than rejecting it. `in` / `not in` take a parenthesized list on the right; everything else
     * takes an arithmetic operand.
     */
    private parseComparison(): AstNode {
        let node = this.parseAdditive();

        while (true) {
            const operator = this.peek();

            if (
                operator.type === 'operator' &&
                ['==', '=', '!=', '<', '<=', '>', '>=', 'in'].includes(operator.value)
            ) {
                this.advance();
                node = {
                    type: 'binary',
                    operator: operator.value,
                    left: node,
                    right: operator.value === 'in' ? this.parseList() : this.parseAdditive(),
                };
                continue;
            }

            // `not` appearing here can only be the start of the two-word `not in` operator.
            if (this.matchOperator('not')) {
                this.expect('operator', 'in');
                node = {type: 'binary', operator: 'not in', left: node, right: this.parseList()};
                continue;
            }

            return node;
        }
    }

    /** `+` and `-`, left-associative. */
    private parseAdditive(): AstNode {
        let node = this.parseMultiplicative();

        while (this.peek().type === 'operator' && ['+', '-'].includes(this.peek().value)) {
            const operator = this.advance().value;
            node = {type: 'binary', operator, left: node, right: this.parseMultiplicative()};
        }

        return node;
    }

    /** `*`, `/`, `%`, left-associative; binds tighter than `+`/`-`. */
    private parseMultiplicative(): AstNode {
        let node = this.parsePower();

        while (this.peek().type === 'operator' && ['*', '/', '%'].includes(this.peek().value)) {
            const operator = this.advance().value;
            node = {type: 'binary', operator, left: node, right: this.parsePower()};
        }

        return node;
    }

    /** Exponentiation `^`, right-associative: `2 ^ 3 ^ 2` parses as `2 ^ (3 ^ 2)`. */
    private parsePower(): AstNode {
        const node = this.parseUnary();

        if (this.matchOperator('^')) {
            return {type: 'binary', operator: '^', left: node, right: this.parsePower()};
        }

        return node;
    }

    /** Prefix sign `+x` / `-x`. Binds tighter than `^`, so `-2 ^ 2` is `(-2) ^ 2`. */
    private parseUnary(): AstNode {
        if (this.peek().type === 'operator' && ['+', '-'].includes(this.peek().value)) {
            const operator = this.advance().value;
            return {type: 'unary', operator, argument: this.parseUnary()};
        }

        return this.parsePrimary();
    }

    /**
     * Tightest level: literals, `true`/`false`, parenthesized sub-expressions, variable references, and
     * function calls (an identifier immediately followed by `(`).
     */
    private parsePrimary(): AstNode {
        const token = this.peek();

        if (token.type === 'number') {
            this.advance();
            return {type: 'literal', value: Number(token.value)};
        }

        if (token.type === 'string') {
            this.advance();
            return {type: 'literal', value: token.value};
        }

        if (token.type === 'identifier') {
            this.advance();

            // `name(...)` -> function call. Arguments are full expressions, comma-separated.
            if (this.match('paren', '(')) {
                const args: AstNode[] = [];

                if (!this.match('paren', ')')) {
                    do {
                        args.push(this.parseOr());
                    } while (this.match('comma'));

                    this.expect('paren', ')');
                }

                return {type: 'call', name: token.value, args};
            }

            // Bare `true`/`false` are boolean literals; anything else is a variable reference.
            const lowerName = token.value.toLowerCase();
            if (lowerName === 'true' || lowerName === 'false') {
                return {type: 'literal', value: lowerName === 'true'};
            }

            return {type: 'identifier', name: token.value};
        }

        // Parenthesized grouping, e.g. `(a + b) * c`.
        if (this.match('paren', '(')) {
            const node = this.parseOr();
            this.expect('paren', ')');
            return node;
        }

        throw new Error(`unexpected token "${token.value}" at ${token.position}`);
    }

    /** Parses the `(...)` operand of `in` / `not in` into a list node. Allows an empty list `()`. */
    private parseList(): AstNode {
        this.expect('paren', '(');
        const values: AstNode[] = [];

        if (!this.match('paren', ')')) {
            do {
                values.push(this.parseOr());
            } while (this.match('comma'));

            this.expect('paren', ')');
        }

        return {type: 'list', values};
    }

    /** Consumes the next token and returns true if it matches the given type (and value, if provided). */
    private match(type: TokenType, value?: string): boolean {
        const token = this.peek();
        if (token.type !== type || (value !== undefined && token.value !== value)) return false;
        this.advance();
        return true;
    }

    private matchOperator(value: string): boolean {
        return this.match('operator', value);
    }

    /** Similar to {@link match} but throws a positioned error when the expected token isn't present. */
    private expect(type: TokenType, value?: string): Token {
        const token = this.peek();
        if (token.type !== type || (value !== undefined && token.value !== value)) {
            const expected = value === undefined ? type : `${type} "${value}"`;
            throw new Error(`expected ${expected} at ${token.position}`);
        }

        return this.advance();
    }

    /** Get the current token without consuming it */
    private peek(): Token {
        return this.tokens[this.position];
    }

    /** Like {@link peek} but consumes the token. */
    private advance(): Token {
        return this.tokens[this.position++];
    }
}

/**
 * Stage 3: recursively evaluates an AST node to a value. Mirrors the node shapes produced by the parser.
 * Errors thrown here (and by the helpers below) are caught by the runner in {@link compileExpression}.
 */
function evaluate(node: AstNode, vars: InternalInputVars, functions: Record<string, Callable>): FilterValue {
    switch (node.type) {
        case 'literal':
            return node.value;
        case 'identifier':
            return readVariable(vars, node.name);
        case 'unary':
            return evaluateUnary(node.operator, evaluate(node.argument, vars, functions));
        case 'binary':
            return evaluateBinary(node, vars, functions);
        case 'call':
            return evaluateCall(node, vars, functions);
        case 'list':
            throw new Error('list is only valid with the in operator');
    }
}

/**
 * Resolves a variable reference. Missing or `undefined` variables throw
 */
function readVariable(vars: InternalInputVars, name: string): FilterValue {
    if (!Object.prototype.hasOwnProperty.call(vars, name) || (vars as any)[name] === undefined) {
        throw new Error(`unknown variable "${name}"`);
    }

    const value = (vars as any)[name];
    if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') return value;

    throw new Error(`unsupported variable "${name}"`);
}

function evaluateUnary(operator: string, value: FilterValue): FilterValue {
    assertValue(value);

    switch (operator) {
        case '+':
            return toNumber(value);
        case '-':
            return -toNumber(value);
        case 'not':
            return !isTruthy(value);
        default:
            throw new Error(`unknown unary operator "${operator}"`);
    }
}

function evaluateBinary(
    node: Extract<AstNode, {type: 'binary'}>,
    vars: InternalInputVars,
    functions: Record<string, Callable>
): FilterValue {
    // `and` / `or` short-circuit: the right side is only evaluated when the left doesn't already decide the result.
    if (node.operator === 'and') {
        const left = evaluate(node.left, vars, functions);
        assertValue(left);
        return isTruthy(left) && isTruthy(evaluate(node.right, vars, functions));
    }

    if (node.operator === 'or') {
        const left = evaluate(node.left, vars, functions);
        assertValue(left);
        return isTruthy(left) || isTruthy(evaluate(node.right, vars, functions));
    }

    const left = evaluate(node.left, vars, functions);
    assertValue(left);

    // Membership: the right side is a list node, so check the left against each element by equality.
    if (node.operator === 'in' || node.operator === 'not in') {
        if (node.right.type !== 'list') throw new Error(`${node.operator} requires a list`);
        const found = node.right.values.some((item) => valuesEqual(left, evaluate(item, vars, functions)));
        return node.operator === 'in' ? found : !found;
    }

    const right = evaluate(node.right, vars, functions);
    assertValue(right);

    switch (node.operator) {
        case '==':
        case '=':
            return valuesEqual(left, right);
        case '!=':
            return !valuesEqual(left, right);
        case '<':
            return compare(left, right) < 0;
        case '<=':
            return compare(left, right) <= 0;
        case '>':
            return compare(left, right) > 0;
        case '>=':
            return compare(left, right) >= 0;
        case '+':
            // `+` is overloaded: string concatenation if either side is a string, numeric addition otherwise.
            if (typeof left === 'string' || typeof right === 'string') return String(left) + String(right);
            return toNumber(left) + toNumber(right);
        case '-':
            return toNumber(left) - toNumber(right);
        case '*':
            return toNumber(left) * toNumber(right);
        case '/':
            return toNumber(left) / toNumber(right);
        case '%':
            return toNumber(left) % toNumber(right);
        case '^':
            return Math.pow(toNumber(left), toNumber(right));
        default:
            throw new Error(`unknown operator "${node.operator}"`);
    }
}

function evaluateCall(
    node: Extract<AstNode, {type: 'call'}>,
    vars: InternalInputVars,
    functions: Record<string, Callable>
): FilterValue {
    const func = functions[node.name];
    if (!func) throw new Error(`unknown function "${node.name}"`);

    // Evaluate every argument eagerly (no per-function short-circuiting) before invoking.
    const args = node.args.map((arg) => {
        const value = evaluate(arg, vars, functions);
        assertValue(value);
        return value;
    });

    return func(...args);
}

/** Equality for `==` / `!=`: strict, so `5 == "5"` is false. No cross-type coercion. */
function valuesEqual(left: FilterValue, right: FilterValue): boolean {
    assertValue(left);
    assertValue(right);

    return left === right;
}

/**
 * Three-way comparison for `<`, `<=`, `>`, `>=`. Numbers compare numerically and strings
 * lexicographically; cross-type comparison throws an error.
 */
function compare(left: FilterValue, right: FilterValue): number {
    assertValue(left);
    assertValue(right);

    if (typeof left === 'number' && typeof right === 'number') return left - right;
    if (typeof left === 'string' && typeof right === 'string') return left.localeCompare(right);

    throw new Error(`cannot compare ${typeof left} with ${typeof right}`);
}

/** Coerces to a number for arithmetic, or throws. Deliberately strict: strings are not auto-parsed. */
function toNumber(value: FilterValue): number {
    assertValue(value);

    if (typeof value !== 'number') {
        throw new Error(`expected number, got ${typeof value}`);
    }

    return value;
}

/** Truthiness for boolean contexts: false-y are `false`, `0`, `NaN`, and `""`. */
function isTruthy(value: FilterValue): boolean {
    assertValue(value);

    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0 && !Number.isNaN(value);
    return value.length > 0;
}

/**
 * Narrows away the `Error` arm of {@link FilterValue}: if an `Error` reached here it means a sub-result failed, so re-throw it to abort evaluation.
 */
function assertValue(value: FilterValue): asserts value is number | string | boolean {
    if (value instanceof Error) throw value;
}
