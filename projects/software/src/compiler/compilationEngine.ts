import { JackTokenizer } from './jackTokenizer';
import {
    isSymbol,
    TokenType,
    Token,
    isTokenType,
    isKeyWord,
} from './type/terminalSymbol';
import * as fs from 'fs';

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
    private ws: fs.WriteStream;

    private tmpTokens: Token[] = [];

    constructor(path: string) {
        this.jackTokenizer = new JackTokenizer(path);
        this.ws = fs.createWriteStream(path.replace(/\.jack$/, 'Test.xml'));
        //console.log(path.replace(/\.jack$/, 'Test.xml'));
    }

    public start = async (): Promise<void> => {
        await this.jackTokenizer.fetch();
        this.compileClass();
        this.ws.on('finish', () => {
            console.log('finish!!');
        });
    };

    // private execute = (
    //     tag: string,
    //     isValid: (token: Token) => boolean
    // ): void => {
    //     if (!this.jackTokenizer.hasMoreTokens()) {
    //         return;
    //     }
    //     const token = this.jackTokenizer.advance();
    //     if (isValid(token)) {
    //         this.compileClass();
    //         return;
    //     }
    //     throw new Error(`invalid token: ${token}`);
    // };

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
            this.isSubroutineCall(token) ||
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

    private isSubroutineCall = (token: Token): boolean => {
        return token.type === 'identifier';
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

    private createTag = (
        token: Token,
        indent?: number
    ): { token: Token; toString: () => string } => {
        if (token.type === 'no_token') {
            throw new Error('no_token');
        }
        const spaces = !indent ? '' : ' '.repeat(indent * 2);
        return {
            token: token,
            toString: () =>
                `${spaces}<${token.type}> ${token.getValue()} </${
                    token.type
                }>\n`,
        };
    };

    private createOuterTag = (
        outerTag: OuterTag,
        indent?: number
    ): { start: string; end: string } => {
        const indentSpace = !indent
            ? ''
            : ' '.repeat(indent * CompilationEngine.INDENT_SPACES);
        return {
            start: `${indentSpace}<${outerTag}>\n`,
            end: `${indentSpace}</${outerTag}>\n`,
        };
    };

    private compileToken = (
        token: Token,
        indent: number,
        isValid: (token: Token) => boolean = (token) => true,
        throwError: boolean = true
    ): boolean => {
        if (throwError && !isValid) {
            console.log('error');
            throw Error(`invalid position: ${token}`);
        } else if (!isValid) {
            return false;
        }
        this.ws.write(this.createTag(token, indent).toString());
        this.tmpTokens.shift();
        return true;
    };

    private compileClass = (): void => {
        const compileInner = (): void => {
            const indent = 1;
            this.compileToken(
                this.fetchToken(),
                indent,
                (token) => token.type === 'keyword' && token.keyword === 'class'
            );
            this.compileToken(
                this.fetchToken(),
                indent,
                (token) => token.type === 'identifier'
            );
            this.compileToken(
                this.fetchToken(),
                indent,
                (token) => token.type === 'symbol' && token.symbol === '{'
            );
            let token = this.fetchToken();
            while (
                token.type === 'keyword' &&
                (token.keyword === 'static' || token.keyword === 'field')
            ) {
                this.compileClassVarDec(indent);
                token = this.fetchToken();
            }
            token = this.fetchToken();
            while (
                token.type === 'keyword' &&
                (token.keyword === 'constructor' ||
                    token.keyword === 'function' ||
                    token.keyword === 'method')
            ) {
                this.compileSubroutine(indent);
                token = this.fetchToken();
            }
            this.compileToken(
                this.fetchToken(),
                indent,
                (token) => token.type === 'symbol' && token.symbol === '}'
            );
        };

        const outerTag = this.createOuterTag('class');
        this.ws.write(outerTag.start);
        compileInner();
        this.ws.write(outerTag.end);
    };

    private compileClassVarDec = (indent: number): void => {
        const compileInner = (indent: number): void => {
            this.compileToken(
                this.fetchToken(),
                indent,
                (token) =>
                    token.type === 'keyword' &&
                    (token.keyword === 'static' || token.keyword === 'field'),
                false
            );
            this.compileToken(this.fetchToken(), indent, this.isType);
            this.compileToken(
                this.fetchToken(),
                indent,
                (token) => token.type === 'identifier'
            );

            //compile (',' varName)* ';'
            let token = this.fetchToken();
            while (token.type === 'symbol' && token.symbol === ',') {
                this.compileToken(
                    token,
                    indent,
                    (token) => token.type === 'symbol' && token.symbol === ','
                );
                this.compileToken(
                    this.fetchToken(),
                    indent,
                    (token) => token.type === 'identifier'
                );
                token = this.fetchToken();
            }
            this.compileToken(
                token,
                indent,
                (token) => token.type === 'symbol' && token.symbol === ';',
                false
            );
        };

        const classVarDecTag = this.createOuterTag('classVarDec', indent);
        this.ws.write(classVarDecTag.start);
        compileInner(indent + 1);
        this.ws.write(classVarDecTag.end);
    };
    private compileSubroutine = (indent: number) => {
        const compileInner = (indent: number) => {
            this.compileToken(this.fetchToken(), indent, (token) => {
                return (
                    token.type === 'keyword' &&
                    (token.keyword === 'constructor' ||
                        token.keyword === 'function' ||
                        token.keyword === 'method')
                );
            });
            this.compileToken(
                this.fetchToken(),
                indent,
                (token) =>
                    this.isType(token) ||
                    (token.type === 'keyword' && token.keyword === 'void')
            );
            this.compileToken(
                this.fetchToken(),
                indent,
                (token) => token.type === 'identifier'
            );
            this.compileToken(
                this.fetchToken(),
                indent,
                (token) => token.type === 'symbol' && token.symbol === '('
            );
            const token = this.fetchToken();
            this.compileParameterList(indent);
            // if (this.isType(token)) {
            //     this.compileParameterList(indent);
            // }
            this.compileToken(
                this.fetchToken(),
                indent,
                (token) => token.type === 'symbol' && token.symbol === ')'
            );
            this.compileSubroutineBody(indent);
        };

        const outerTag = this.createOuterTag('subroutineDec', indent);
        this.ws.write(outerTag.start);
        compileInner(indent + 1);
        this.ws.write(outerTag.end);
    };

    private compileParameterList = (indent: number): void => {
        const compileInner = (indent: number): void => {
            this.compileToken(this.fetchToken(), indent, this.isType);
            this.compileToken(
                this.fetchToken(),
                indent,
                (token) => token.type === 'identifier'
            );
            //compile (',' type varName)*
            let token = this.fetchToken();
            while (token.type === 'symbol' && token.symbol === ',') {
                this.compileToken(
                    token,
                    indent,
                    (token) => token.type === 'symbol' && token.symbol === ','
                );
                this.compileToken(this.fetchToken(), indent, this.isType);
                this.compileToken(
                    this.fetchToken(),
                    indent,
                    (token) => token.type === 'identifier'
                );
                token = this.fetchToken();
            }
        };

        const outerTag = this.createOuterTag('parameterList', indent);
        this.ws.write(outerTag.start);
        const token = this.fetchToken();
        if (this.isType(token)) {
            compileInner(indent + 1);
        }
        this.ws.write(outerTag.end);
    };

    private compileSubroutineBody = (indent: number) => {
        const compileInner = (indent: number): void => {
            this.compileToken(
                this.fetchToken(),
                indent,
                (token) => token.type === 'symbol' && token.symbol === '{'
            );
            const token = this.fetchToken();
            while (token.type === 'keyword' && token.keyword === 'var') {
                this.compileVarDec(indent);
            }
            this.compileStatements(indent);
            this.compileToken(
                this.fetchToken(),
                indent,
                (token) => token.type === 'symbol' && token.symbol === '}'
            );
        };

        const outerTag = this.createOuterTag('subroutineBody', indent);
        this.ws.write(outerTag.start);
        compileInner(indent + 1);
        this.ws.write(outerTag.end);
    };

    private compileVarDec(indent: number) {
        const compileInner = (indent: number): void => {
            this.compileToken(
                this.fetchToken(),
                indent,
                (token) => token.type === 'keyword' && token.keyword === 'var',
                false
            );
            this.compileToken(this.fetchToken(), indent, this.isType);
            this.compileToken(
                this.fetchToken(),
                indent,
                (token) => token.type === 'identifier'
            );

            //compile (',' varName)* ';'
            let token = this.fetchToken();
            while (token.type === 'symbol' && token.symbol === ',') {
                this.compileToken(
                    token,
                    indent,
                    (token) => token.type === 'symbol' && token.symbol === ','
                );
                this.compileToken(
                    this.fetchToken(),
                    indent,
                    (token) => token.type === 'identifier'
                );
                token = this.fetchToken();
            }
            this.compileToken(
                token,
                indent,
                (token) => token.type === 'symbol' && token.symbol === ';',
                false
            );
        };

        const outerTag = this.createOuterTag('classVarDec', indent);
        this.ws.write(outerTag.start);
        compileInner(indent + 1);
        this.ws.write(outerTag.end);
    }

    private compileStatements = (indent: number): void => {
        const compileInner = (indent: number): void => {
            const token = this.fetchToken();
            if (token.type !== 'keyword') {
                throw Error(`invalid position: ${token}`);
            }
            switch (token.keyword) {
                case 'let':
                    return this.compileLetStatement(indent);
                case 'if':
                    return this.compileIfStatement(indent);
                case 'while':
                    return this.compileWhileStatement(indent);
                case 'do':
                    return this.compileDoStatement(indent);
                case 'return':
                    return this.compileReturnStatement(indent);
                default:
                    throw new Error(`invalid position: ${token}`);
            }
        };

        const outerTag = this.createOuterTag('statements', indent);
        this.ws.write(outerTag.start);
        let token = this.fetchToken();
        while (
            token.type === 'keyword' &&
            (token.keyword === 'let' ||
                token.keyword === 'if' ||
                token.keyword === 'while' ||
                token.keyword === 'do' ||
                token.keyword === 'return')
        ) {
            compileInner(indent + 1);
            token = this.fetchToken();
        }
        this.ws.write(outerTag.end);
    };

    private compileLetStatement = (indent: number): void => {
        const compileInner = (indent: number) => {
            this.compileToken(
                this.fetchToken(),
                indent,
                (token) => token.type === 'keyword' && token.keyword === 'let'
            );
            this.compileToken(
                this.fetchToken(),
                indent,
                (token) => token.type === 'identifier'
            );
            const token = this.fetchToken();
            if (token.type === 'symbol' && token.symbol === '[') {
                this.compileToken(
                    this.fetchToken(),
                    indent,
                    (token) => token.type === 'symbol' && token.symbol === '['
                );
                this.compileExpression(indent);
                this.compileToken(
                    this.fetchToken(),
                    indent,
                    (token) => token.type === 'symbol' && token.symbol === ']'
                );
            }
            this.compileToken(
                this.fetchToken(),
                indent,
                (token) => token.type === 'symbol' && token.symbol === '='
            );
            this.compileExpression(indent);
            this.compileToken(
                this.fetchToken(),
                indent,
                (token) => token.type === 'symbol' && token.symbol === ';'
            );
        };

        const outerTag = this.createOuterTag('letStatement', indent);
        this.ws.write(outerTag.start);
        compileInner(indent + 1);
        this.ws.write(outerTag.end);
    };

    private compileIfStatement = (indent: number): void => {
        const compileInner = (indent: number) => {
            this.compileToken(
                this.fetchToken(),
                indent,
                (token) => token.type === 'keyword' && token.keyword === 'if'
            );
            this.compileToken(
                this.fetchToken(),
                indent,
                (token) => token.type === 'symbol' && token.symbol === '('
            );
            this.compileExpression(indent);
            this.compileToken(
                this.fetchToken(),
                indent,
                (token) => token.type === 'symbol' && token.symbol === ')'
            );
            this.compileToken(
                this.fetchToken(),
                indent,
                (token) => token.type === 'symbol' && token.symbol === '{'
            );
            this.compileStatements(indent);
            this.compileToken(
                this.fetchToken(),
                indent,
                (token) => token.type === 'symbol' && token.symbol === '}'
            );
            const token = this.fetchToken();
            if (token.type === 'keyword' && token.keyword === 'else') {
                this.compileToken(
                    this.fetchToken(),
                    indent,
                    (token) =>
                        token.type === 'keyword' && token.keyword === 'else'
                );
                this.compileToken(
                    this.fetchToken(),
                    indent,
                    (token) => token.type === 'symbol' && token.symbol === '{'
                );
                this.compileStatements(indent);
                this.compileToken(
                    this.fetchToken(),
                    indent,
                    (token) => token.type === 'symbol' && token.symbol === '}'
                );
            }
        };

        const outerTag = this.createOuterTag('ifStatement', indent);
        this.ws.write(outerTag.start);
        compileInner(indent + 1);
        this.ws.write(outerTag.end);
    };

    private compileWhileStatement = (indent: number): void => {
        const compileInner = (indent: number) => {
            this.compileToken(
                this.fetchToken(),
                indent,
                (token) => token.type === 'keyword' && token.keyword === 'while'
            );
            this.compileToken(
                this.fetchToken(),
                indent,
                (token) => token.type === 'symbol' && token.symbol === '('
            );
            this.compileExpression(indent);
            this.compileToken(
                this.fetchToken(),
                indent,
                (token) => token.type === 'symbol' && token.symbol === ')'
            );
            this.compileToken(
                this.fetchToken(),
                indent,
                (token) => token.type === 'symbol' && token.symbol === '{'
            );
            this.compileStatements(indent);
            this.compileToken(
                this.fetchToken(),
                indent,
                (token) => token.type === 'symbol' && token.symbol === '}'
            );
        };

        const outerTag = this.createOuterTag('whileStatement', indent);
        this.ws.write(outerTag.start);
        compileInner(indent + 1);
        this.ws.write(outerTag.end);
    };

    private compileDoStatement = (indent: number): void => {
        const compileInner = (indent: number) => {
            this.compileToken(
                this.fetchToken(),
                indent,
                (token) => token.type === 'keyword' && token.keyword === 'do'
            );
            this.compileSubroutineCall(indent);
            this.compileToken(
                this.fetchToken(),
                indent,
                (token) => token.type === 'symbol' && token.symbol === ';'
            );
        };

        const outerTag = this.createOuterTag('doStatement', indent);
        this.ws.write(outerTag.start);
        compileInner(indent + 1);
        this.ws.write(outerTag.end);
    };

    private compileReturnStatement = (indent: number): void => {
        const compileInner = (indent: number) => {
            this.compileToken(
                this.fetchToken(),
                indent,
                (token) =>
                    token.type === 'keyword' && token.keyword === 'return'
            );
            const token = this.fetchToken();
            if (this.isTerm(token)) {
                this.compileExpression(indent);
            }
            this.compileToken(
                this.fetchToken(),
                indent,
                (token) => token.type === 'symbol' && token.symbol === ';'
            );
        };

        const outerTag = this.createOuterTag('returnStatement', indent);
        this.ws.write(outerTag.start);
        compileInner(indent + 1);
        this.ws.write(outerTag.end);
    };

    private compileExpression = (indent: number) => {
        const compileInner = (indent: number) => {
            this.compileTerm(indent);
            let token = this.fetchToken();
            while (this.isOp(token)) {
                this.compileToken(this.fetchToken(), indent, this.isOp);
                this.compileTerm(indent);
                token = this.fetchToken();
            }
        };

        const outerTag = this.createOuterTag('expression', indent);
        this.ws.write(outerTag.start);
        compileInner(indent + 1);
        this.ws.write(outerTag.end);
    };

    private compileSubroutineCall = (indent: number) => {
        // compile the following expression.
        //
        // subroutineName '(' expressionList ')' |
        // (className | varName) '.' subroutineName '(' expressionList ')'

        // compile subroutineName | (className | varName)
        this.compileToken(
            this.fetchToken(),
            indent,
            (token) => token.type === 'identifier'
        );
        const token = this.fetchToken();
        if (token.type === 'symbol' && token.symbol === '.') {
            // compile '.' subroutineName
            this.compileToken(this.fetchToken(), indent);
            this.compileToken(
                this.fetchToken(),
                indent,
                (token) => token.type === 'identifier'
            );
        }
        // compile '(' expressionList ')'
        this.compileToken(
            this.fetchToken(),
            indent,
            (token) => token.type === 'symbol' && token.symbol === '('
        );
        this.compileExpressionList(indent);
        this.compileToken(
            this.fetchToken(),
            indent,
            (token) => token.type === 'symbol' && token.symbol === ')'
        );
    };

    private compileTerm = (indent: number) => {
        const compileInner = (indent: number) => {
            const token = this.fetchToken();
            switch (true) {
                case token.type === 'integerConstant' ||
                    token.type === 'stringConstant' ||
                    this.isKeywordConstant(token):
                    this.compileToken(this.fetchToken(), indent);
                    return;
                case token.type === 'identifier':
                    this.compileToken(this.fetchToken(), indent);
                    const forwardToken = this.fetchToken();
                    if (
                        forwardToken.type === 'symbol' &&
                        forwardToken.symbol === '['
                    ) {
                        this.compileToken(this.fetchToken(), indent);
                        this.compileExpression(indent);
                        this.compileToken(
                            this.fetchToken(),
                            indent,
                            (token) =>
                                token.type === 'symbol' && token.symbol === ']'
                        );
                    }
                    return;
                case this.isSubroutineCall(token):
                    this.compileSubroutineCall(indent);
                    return;
                case token.type === 'symbol' && token.symbol === '(':
                    this.compileToken(this.fetchToken(), indent);
                    this.compileExpression(indent);
                    this.compileToken(
                        this.fetchToken(),
                        indent,
                        (token) =>
                            token.type === 'symbol' && token.symbol === ')'
                    );
                    return;
                case this.isUnaryOp(token):
                    this.compileToken(this.fetchToken(), indent);
                    this.compileTerm(indent);
                    return;
                default:
                    throw new Error(`invalid position: ${token}`);
            }
        };

        const outerTag = this.createOuterTag('term', indent);
        this.ws.write(outerTag.start);
        compileInner(indent + 1);
        this.ws.write(outerTag.end);
    };

    private compileExpressionList = (indent: number) => {
        const compileInner = (indent: number) => {
            this.compileExpression(indent);
            let token = this.fetchToken();
            while (token.type === 'symbol' && token.symbol === ',') {
                this.compileToken(
                    this.fetchToken(),
                    indent,
                    (token) => token.type === 'symbol' && token.symbol === ','
                );
                this.compileExpression(indent);
                token = this.fetchToken();
            }
        };

        const outerTag = this.createOuterTag('expressionList', indent);
        this.ws.write(outerTag.start);
        const token = this.fetchToken();
        if (this.isTerm(token)) {
            compileInner(indent + 1);
        }
        this.ws.write(outerTag.end);
    };
}
