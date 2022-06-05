import { JackTokenizer } from './jackTokenizer';
import { Token } from './type/terminalSymbol';
import * as fs from 'fs';
import { createFileInfo } from '../util/fileInfoCreater';
import { SymbolTable } from './symbolTable';
import { Command, VMWriter } from './vmWriter';

type OuterTag =
    | 'class'
    | 'classVarDec'
    | 'subroutineDec'
    | 'parameterList'
    | 'subroutineBody'
    | 'varDec'
    | 'statements'
    | 'letStatement'
    | 'ifStatement'
    | 'whileStatement'
    | 'doStatement'
    | 'returnStatement'
    | 'expression'
    | 'term'
    | 'subroutineCall'
    | 'expressionList';

export class CompilationEngine {
    private static readonly INDENT_SPACES = 2;

    private jackTokenizer: JackTokenizer;
    private vmWriter: VMWriter;
    private ws: fs.WriteStream;

    private tmpTokens: Token[] = [];
    private symbolTable: SymbolTable;

    constructor(path: string) {
        this.jackTokenizer = new JackTokenizer(path);
        this.vmWriter = new VMWriter(path);
        this.ws = fs.createWriteStream(path.replace(/\.jack$/, '.vm'));
        this.symbolTable = new SymbolTable();
    }

    public start = async (): Promise<void> => {
        await this.jackTokenizer.fetch();
        this.compileClass();
        this.ws.on('finish', () => {
            console.log('finish!!');
        });
    };

    private isType = (token: Token): boolean => {
        return (
            token.type === 'identifier' ||
            (token.type === 'keyword' &&
                (token.keyword === 'int' ||
                    token.keyword === 'char' ||
                    token.keyword === 'boolean'))
        );
    };

    private isTerm = (token: Token): boolean => {
        return (
            token.type === 'integerConstant' ||
            token.type === 'stringConstant' ||
            this.isKeywordConstant(token) ||
            token.type === 'identifier' ||
            (token.type === 'symbol' && token.symbol === '(') ||
            this.isUnaryOp(token)
        );
    };

    private isKeywordConstant = (token: Token): boolean => {
        if (token.type !== 'keyword') {
            return false;
        }
        return (
            token.keyword === 'true' ||
            token.keyword === 'false' ||
            token.keyword === 'null' ||
            token.keyword === 'this'
        );
    };

    private isSubroutineCall = (tokens: Token[]): boolean => {
        if (tokens.length != 2) {
            return false;
        }
        return (
            tokens[0].type === 'identifier' &&
            tokens[1].type === 'symbol' &&
            (tokens[1].symbol === '(' || tokens[1].symbol === '.')
        );
    };

    private isUnaryOp = (token: Token): boolean => {
        if (token.type !== 'symbol') {
            return false;
        }
        return token.symbol === '-' || token.symbol === '~';
    };

    private isOp = (token: Token): boolean => {
        if (token.type !== 'symbol') {
            return false;
        }
        return (
            token.symbol === '+' ||
            token.symbol === '-' ||
            token.symbol === '*' ||
            token.symbol === '/' ||
            token.symbol === '&' ||
            token.symbol === '|' ||
            token.symbol === '<' ||
            token.symbol === '>' ||
            token.symbol === '='
        );
    };

    private fetchToken = (): Token => {
        if (this.tmpTokens.length > 0) {
            return this.tmpTokens[0];
        } else if (this.jackTokenizer.hasMoreTokens()) {
            const token = this.jackTokenizer.advance();
            this.tmpTokens.push(token);
            return token;
        }
        throw new Error('no_token');
    };

    private fetchTokens = (num: number): Token[] => {
        while (this.tmpTokens.length < num) {
            if (!this.jackTokenizer.hasMoreTokens()) {
                throw new Error('no more token');
            }
            this.tmpTokens.push(this.jackTokenizer.advance());
        }
        return this.tmpTokens.slice(0, num);
    };

    private compileToken = (
        isValid: (token: Token) => boolean = () => true,
        throwError: boolean = true
    ): string | undefined => {
        const token = this.fetchToken();
        if (token.type === 'no_token') {
            throw Error('no token');
        }
        if (throwError && !isValid) {
            console.log('error');
            throw Error(`invalid position: ${token}`);
        } else if (!isValid) {
            return undefined;
        }
        this.tmpTokens.shift();
        return token.getValue();
    };

    private compileClass = (): void => {
        this.compileToken(
            (token) => token.type === 'keyword' && token.keyword === 'class'
        );
        const clazz = this.compileToken((token) => token.type === 'identifier');
        this.compileToken(
            (token) => token.type === 'symbol' && token.symbol === '{'
        );
        let token = this.fetchToken();
        while (
            token.type === 'keyword' &&
            (token.keyword === 'static' || token.keyword === 'field')
        ) {
            this.compileClassVarDec();
            token = this.fetchToken();
        }
        token = this.fetchToken();
        while (
            token.type === 'keyword' &&
            (token.keyword === 'constructor' ||
                token.keyword === 'function' ||
                token.keyword === 'method')
        ) {
            this.compileSubroutine(clazz!);
            token = this.fetchToken();
        }
        this.compileToken(
            (token) => token.type === 'symbol' && token.symbol === '}'
        );
    };

    private compileClassVarDec = (): void => {};

    private compileSubroutine = (clazz: string) => {
        this.compileToken((token) => {
            return (
                token.type === 'keyword' &&
                (token.keyword === 'constructor' ||
                    token.keyword === 'function' ||
                    token.keyword === 'method')
            );
        });
        this.compileToken(
            (token) =>
                this.isType(token) ||
                (token.type === 'keyword' && token.keyword === 'void')
        );
        const name = this.compileToken((token) => token.type === 'identifier');
        this.compileToken(
            (token) => token.type === 'symbol' && token.symbol === '('
        );
        const argNum = this.compileParameterList();
        this.compileToken(
            (token) => token.type === 'symbol' && token.symbol === ')'
        );
        this.vmWriter.writeFunction(`${clazz}.${name!}`, argNum);
        this.compileSubroutineBody();
    };

    private compileParameterList = (): number => {
        return 0;
    };

    private compileSubroutineBody = () => {
        this.compileToken(
            (token) => token.type === 'symbol' && token.symbol === '{'
        );
        let token = this.fetchToken();
        while (token.type === 'keyword' && token.keyword === 'var') {
            this.compileVarDec();
            token = this.fetchToken();
        }
        this.compileStatements();
        this.compileToken(
            (token) => token.type === 'symbol' && token.symbol === '}'
        );
    };

    private compileVarDec = () => {};

    private compileStatements = () => {
        const compileInner = (): void => {
            const token = this.fetchToken();
            if (token.type !== 'keyword') {
                throw Error(`invalid position: ${token}`);
            }
            console.log(token.keyword);
            switch (token.keyword) {
                case 'let':
                    return this.compileLetStatement();
                case 'if':
                    return this.compileIfStatement();
                case 'while':
                    return this.compileWhileStatement();
                case 'do':
                    return this.compileDoStatement();
                case 'return':
                    return this.compileReturnStatement();
                default:
                    throw new Error(`invalid position: ${token}`);
            }
        };

        let token = this.fetchToken();
        while (
            token.type === 'keyword' &&
            (token.keyword === 'let' ||
                token.keyword === 'if' ||
                token.keyword === 'while' ||
                token.keyword === 'do' ||
                token.keyword === 'return')
        ) {
            compileInner();
            token = this.fetchToken();
        }
    };

    private compileLetStatement = () => {};

    private compileIfStatement = () => {};

    private compileWhileStatement = () => {};

    private compileDoStatement = () => {
        this.compileToken(
            (token) => token.type === 'keyword' && token.keyword === 'do'
        );
        this.compileSubroutineCall();
        this.compileToken(
            (token) => token.type === 'symbol' && token.symbol === ';'
        );
    };

    private compileReturnStatement = () => {
        this.compileToken(
            (token) => token.type === 'keyword' && token.keyword === 'return'
        );
        const token = this.fetchToken();
        if (this.isTerm(token)) {
            this.compileExpression();
        }
        this.compileToken(
            (token) => token.type === 'symbol' && token.symbol === ';'
        );
        this.vmWriter.writeReturn();
    };

    private compileSubroutineCall = () => {
        // compile the following expression.
        //
        // subroutineName '(' expressionList ')' |
        // (className | varName) '.' subroutineName '(' expressionList ')'

        // compile subroutineName | (className | varName)
        const name = this.compileToken((token) => token.type === 'identifier');
        let token = this.fetchToken();
        let subName;
        if (token.type === 'symbol' && token.symbol === '.') {
            // compile '.' subroutineName
            this.compileToken();
            subName = this.compileToken((token) => token.type === 'identifier');
        }
        // compile '(' expressionList ')'
        this.compileToken(
            (token) => token.type === 'symbol' && token.symbol === '('
        );
        token = this.fetchToken();
        const argNum = this.compileExpressionList();
        this.compileToken(
            (token) => token.type === 'symbol' && token.symbol === ')'
        );
        this.vmWriter.writeCall(
            subName ? `${name}.${subName}` : `${name}`,
            argNum
        );
    };

    private compileExpressionList = (): number => {
        let token = this.fetchToken();
        if (token.type === 'symbol' && token.symbol === ')') {
            return 0;
        }
        this.compileExpression();
        let argNum = 1;
        token = this.fetchToken();
        while (token.type === 'symbol' && token.symbol === ',') {
            this.compileToken(
                (token) => token.type === 'symbol' && token.symbol === ','
            );
            this.compileExpression();
            token = this.fetchToken();
            argNum++;
        }
        return argNum;
    };

    private compileExpression = () => {
        this.compileTerm();
        let token = this.fetchToken();
        while (this.isOp(token)) {
            this.compileToken(this.isOp);
            this.compileTerm();
            if (token.type === 'symbol' && token.symbol === '*') {
                this.vmWriter.writeCall('Math.multiply', 2);
            } else {
                this.vmWriter.writeArithmetic(this.convert(token));
            }
            token = this.fetchToken();
        }
    };

    private convert = (token: Token): Command => {
        if (token.type !== 'symbol') {
            throw new Error(`invalid operation: ${token}`);
        }
        switch (token.symbol) {
            case '+':
                return 'add';
            case '-':
                return 'neg';
            case '=':
                return 'eq';
            case '<':
                return 'gt';
            case '>':
                return 'lt';
            case '&':
                return 'and';
            case '|':
                return 'or';
            case '~':
                return 'not';
            default:
                throw new Error(`invalid operation: ${token}`);
        }
    };

    private compileTerm = () => {
        const tokens = this.fetchTokens(2);
        const token = tokens[0];

        if (this.isSubroutineCall(tokens)) {
            this.compileSubroutineCall();
            return;
        } else if (token.type === 'integerConstant') {
            this.compileToken();
            this.vmWriter.writePush('constant', parseInt(token.intVal));
            return;
        } else if (token.type === 'stringConstant') {
            this.compileToken();
            return;
        } else if (this.isKeywordConstant(token)) {
            this.compileToken();
            return;
        } else if (token.type === 'identifier') {
            this.compileToken();
            const forwardToken = this.fetchToken();
            if (forwardToken.type === 'symbol' && forwardToken.symbol === '[') {
                this.compileToken();
                this.compileExpression();
                this.compileToken(
                    (token) => token.type === 'symbol' && token.symbol === ']'
                );
            }
            return;
        } else if (token.type === 'symbol' && token.symbol === '(') {
            this.compileToken();
            const result = this.compileExpression();
            this.compileToken(
                (token) => token.type === 'symbol' && token.symbol === ')'
            );
            return;
        } else if (this.isUnaryOp(token)) {
            this.compileToken();
            this.compileTerm();
            return;
        }
    };
}
