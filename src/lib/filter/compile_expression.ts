import type {InternalInputVars} from './types';

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

export function compileExpression(expression: string, options: CompileOptions = {}): Runner {
    const tokens = tokenize(expression);
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const functions = {
        ...DEFAULT_FUNCTIONS,
        ...(options.extraFunctions || {}),
    };

    return (vars: InternalInputVars) => {
        try {
            return evaluate(ast, vars, functions);
        } catch (e: any) {
            return e instanceof Error ? e : new Error(String(e));
        }
    };
}

function tokenize(expression: string): Token[] {
    const tokens: Token[] = [];
    let pos = 0;

    while (pos < expression.length) {
        const char = expression[pos];

        if (/\s/.test(char)) {
            pos++;
            continue;
        }

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

function isNumberStart(expression: string, pos: number): boolean {
    const char = expression[pos];
    const next = expression[pos + 1];
    return /[0-9]/.test(char) || (char === '.' && /[0-9]/.test(next));
}

function readNumber(expression: string, pos: number): number {
    const start = pos;

    while (pos < expression.length && /[0-9]/.test(expression[pos])) pos++;

    if (expression[pos] === '.') {
        pos++;
        while (pos < expression.length && /[0-9]/.test(expression[pos])) pos++;
    }

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

class Parser {
    private position = 0;

    constructor(private tokens: Token[]) {}

    parse(): AstNode {
        const expression = this.parseOr();
        this.expect('eof');
        return expression;
    }

    private parseOr(): AstNode {
        let node = this.parseAnd();

        while (this.matchOperator('or')) {
            node = {type: 'binary', operator: 'or', left: node, right: this.parseAnd()};
        }

        return node;
    }

    private parseAnd(): AstNode {
        let node = this.parseNot();

        while (this.matchOperator('and')) {
            node = {type: 'binary', operator: 'and', left: node, right: this.parseNot()};
        }

        return node;
    }

    private parseNot(): AstNode {
        if (this.matchOperator('not')) {
            return {type: 'unary', operator: 'not', argument: this.parseNot()};
        }

        return this.parseComparison();
    }

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

            if (this.matchOperator('not')) {
                this.expect('operator', 'in');
                node = {type: 'binary', operator: 'not in', left: node, right: this.parseList()};
                continue;
            }

            return node;
        }
    }

    private parseAdditive(): AstNode {
        let node = this.parseMultiplicative();

        while (this.peek().type === 'operator' && ['+', '-'].includes(this.peek().value)) {
            const operator = this.advance().value;
            node = {type: 'binary', operator, left: node, right: this.parseMultiplicative()};
        }

        return node;
    }

    private parseMultiplicative(): AstNode {
        let node = this.parsePower();

        while (this.peek().type === 'operator' && ['*', '/', '%'].includes(this.peek().value)) {
            const operator = this.advance().value;
            node = {type: 'binary', operator, left: node, right: this.parsePower()};
        }

        return node;
    }

    private parsePower(): AstNode {
        const node = this.parseUnary();

        if (this.matchOperator('^')) {
            return {type: 'binary', operator: '^', left: node, right: this.parsePower()};
        }

        return node;
    }

    private parseUnary(): AstNode {
        if (this.peek().type === 'operator' && ['+', '-'].includes(this.peek().value)) {
            const operator = this.advance().value;
            return {type: 'unary', operator, argument: this.parseUnary()};
        }

        return this.parsePrimary();
    }

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

            const lowerName = token.value.toLowerCase();
            if (lowerName === 'true' || lowerName === 'false') {
                return {type: 'literal', value: lowerName === 'true'};
            }

            return {type: 'identifier', name: token.value};
        }

        if (this.match('paren', '(')) {
            const node = this.parseOr();
            this.expect('paren', ')');
            return node;
        }

        throw new Error(`unexpected token "${token.value}" at ${token.position}`);
    }

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

    private match(type: TokenType, value?: string): boolean {
        const token = this.peek();
        if (token.type !== type || (value !== undefined && token.value !== value)) return false;
        this.advance();
        return true;
    }

    private matchOperator(value: string): boolean {
        return this.match('operator', value);
    }

    private expect(type: TokenType, value?: string): Token {
        const token = this.peek();
        if (token.type !== type || (value !== undefined && token.value !== value)) {
            const expected = value === undefined ? type : `${type} "${value}"`;
            throw new Error(`expected ${expected} at ${token.position}`);
        }

        return this.advance();
    }

    private peek(): Token {
        return this.tokens[this.position];
    }

    private advance(): Token {
        return this.tokens[this.position++];
    }
}

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

function readVariable(vars: InternalInputVars, name: string): FilterValue {
    if (!(name in vars) || (vars as any)[name] === undefined) {
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

    const args = node.args.map((arg) => {
        const value = evaluate(arg, vars, functions);
        assertValue(value);
        return value;
    });

    return func(...args);
}

function valuesEqual(left: FilterValue, right: FilterValue): boolean {
    assertValue(left);
    assertValue(right);

    return left === right;
}

function compare(left: FilterValue, right: FilterValue): number {
    assertValue(left);
    assertValue(right);

    if (typeof left === 'number' && typeof right === 'number') return left - right;
    if (typeof left === 'string' && typeof right === 'string') return left.localeCompare(right);

    throw new Error(`cannot compare ${typeof left} with ${typeof right}`);
}

function toNumber(value: FilterValue): number {
    assertValue(value);

    if (typeof value !== 'number') {
        throw new Error(`expected number, got ${typeof value}`);
    }

    return value;
}

function isTruthy(value: FilterValue): boolean {
    assertValue(value);

    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0 && !Number.isNaN(value);
    return value.length > 0;
}

function assertValue(value: FilterValue): asserts value is number | string | boolean {
    if (value instanceof Error) throw value;
}
