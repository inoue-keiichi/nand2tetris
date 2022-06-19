import { JackTokenizer } from './jackTokenizer';
import { Token } from './type/terminalSymbol';
import * as fs from 'fs';
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
    private lableNum: number;
    private clazz?: string;

    constructor(path: string) {
        this.jackTokenizer = new JackTokenizer(path);
        this.vmWriter = new VMWriter(path);
        this.ws = fs.createWriteStream(path.replace(/\.jack$/, '.vm'));
        this.symbolTable = new SymbolTable();
        this.lableNum = 0;
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

    private compileKind = (): 'static' | 'field' | 'var' => {
        const token = this.fetchToken();
        if (token.type === 'no_token') {
            throw Error('no token');
        } else if (
            token.type === 'keyword' &&
            (token.keyword === 'static' ||
                token.keyword === 'field' ||
                token.keyword === 'var')
        ) {
            this.tmpTokens.shift();
            return token.keyword;
        }
        throw Error(`invalid position: ${token}`);
    };

    private compileSubroutineType = ():
        | 'constructor'
        | 'method'
        | 'function' => {
        const token = this.fetchToken();
        if (token.type === 'no_token') {
            throw Error('no token');
        } else if (
            token.type === 'keyword' &&
            (token.keyword === 'constructor' ||
                token.keyword === 'method' ||
                token.keyword === 'function')
        ) {
            this.tmpTokens.shift();
            return token.keyword;
        }
        throw Error(`invalid position: ${token}`);
    };

    private compileClass = (): void => {
        this.compileToken(
            (token) => token.type === 'keyword' && token.keyword === 'class'
        );
        this.clazz = this.compileToken((token) => token.type === 'identifier');
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
            this.compileSubroutine();
            token = this.fetchToken();
        }
        this.compileToken(
            (token) => token.type === 'symbol' && token.symbol === '}'
        );
    };

    private compileClassVarDec = (): void => {
        const kind = this.compileKind();
        const type = this.compileToken(this.isType);
        const name = this.compileToken((token) => token.type === 'identifier');
        this.symbolTable.define(name!, type!, kind as 'static' | 'field');

        //compile (',' varName)* ';'
        let token = this.fetchToken();
        while (token.type === 'symbol' && token.symbol === ',') {
            this.compileToken(
                (token) => token.type === 'symbol' && token.symbol === ','
            );
            const name = this.compileToken(
                (token) => token.type === 'identifier'
            );
            this.symbolTable.define(name!, type!, kind as 'static' | 'field');
            token = this.fetchToken();
        }
        this.compileToken(
            (token) => token.type === 'symbol' && token.symbol === ';',
            false
        );
    };

    private compileSubroutine = () => {
        const keyword = this.compileSubroutineType();
        const type = this.compileToken(
            (token) =>
                this.isType(token) ||
                (token.type === 'keyword' && token.keyword === 'void')
        );
        if (keyword === 'method') {
            this.symbolTable.define('this', keyword, 'arg');
        }
        const name = this.compileToken((token) => token.type === 'identifier');
        this.compileToken(
            (token) => token.type === 'symbol' && token.symbol === '('
        );
        this.compileParameterList();
        this.compileToken(
            (token) => token.type === 'symbol' && token.symbol === ')'
        );
        this.compileSubroutineBody(this.clazz!, keyword, name!, type!);
        this.symbolTable.startSubroutine();
    };

    private compileParameterList = (): void => {
        const compileInner = () => {
            const type = this.compileToken(this.isType);
            const name = this.compileToken(
                (token) => token.type === 'identifier'
            );
            this.symbolTable.define(name!, type!, 'arg');
            //compile (',' type varName)*
            let token = this.fetchToken();
            while (token.type === 'symbol' && token.symbol === ',') {
                this.compileToken(
                    (token) => token.type === 'symbol' && token.symbol === ','
                );
                const type = this.compileToken(this.isType);
                const name = this.compileToken(
                    (token) => token.type === 'identifier'
                );
                this.symbolTable.define(name!, type!, 'arg');
                token = this.fetchToken();
            }
        };

        const token = this.fetchToken();
        if (this.isType(token)) {
            compileInner();
        }
    };

    private compileSubroutineBody = (
        clazz: string,
        subroutineType: 'constructor' | 'function' | 'method',
        func: string,
        returnType: string
    ) => {
        this.compileToken(
            (token) => token.type === 'symbol' && token.symbol === '{'
        );
        let token = this.fetchToken();
        while (token.type === 'keyword' && token.keyword === 'var') {
            this.compileVarDec();
            token = this.fetchToken();
        }
        this.vmWriter.writeFunction(
            `${clazz}.${func!}`,
            this.symbolTable.varCount('var')
        );
        if (subroutineType === 'constructor') {
            this.vmWriter.writePush(
                'constant',
                this.symbolTable.varCount('field')
            );
            this.vmWriter.writeCall('Memory.alloc', 1);
            this.vmWriter.writePop('pointer', 0);
        } else if (subroutineType === 'method') {
            this.vmWriter.writePush('argument', 0);
            this.vmWriter.writePop('pointer', 0);
        }
        this.compileStatements(returnType);
        this.compileToken(
            (token) => token.type === 'symbol' && token.symbol === '}'
        );
    };

    private compileVarDec = () => {
        const kind = this.compileKind();
        const type = this.compileToken(this.isType);
        const name = this.compileToken((token) => token.type === 'identifier');
        this.symbolTable.define(name!, type!, kind);

        //compile (',' varName)* ';'
        let token = this.fetchToken();
        while (token.type === 'symbol' && token.symbol === ',') {
            this.compileToken(
                (token) => token.type === 'symbol' && token.symbol === ','
            );
            const name = this.compileToken(
                (token) => token.type === 'identifier'
            );
            this.symbolTable.define(name!, type!, kind);
            token = this.fetchToken();
        }
        this.compileToken(
            (token) => token.type === 'symbol' && token.symbol === ';',
            false
        );
    };

    private compileStatements = (returnType: string) => {
        const compileInner = (returnType: string): void => {
            const token = this.fetchToken();
            if (token.type !== 'keyword') {
                throw Error(`invalid position: ${token}`);
            }
            switch (token.keyword) {
                case 'let':
                    return this.compileLetStatement();
                case 'if':
                    return this.compileIfStatement(returnType);
                case 'while':
                    return this.compileWhileStatement(returnType);
                case 'do':
                    return this.compileDoStatement(returnType);
                case 'return':
                    if (!returnType) {
                        throw new Error('absent returnType');
                    }
                    return this.compileReturnStatement(returnType);
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
            compileInner(returnType);
            token = this.fetchToken();
        }
    };

    private compileLetStatement = () => {
        this.compileToken(
            (token) => token.type === 'keyword' && token.keyword === 'let'
        );
        const name = this.compileToken((token) => token.type === 'identifier');
        const identifier = this.symbolTable.indentifierOf(name!);
        if (!identifier) {
            throw new Error(
                `there is no indentifier in symbol table!: ${name}`
            );
        }
        const token = this.fetchToken();
        let isArray = false;
        if (token.type === 'symbol' && token.symbol === '[') {
            this.compileToken(
                (token) => token.type === 'symbol' && token.symbol === '['
            );
            this.vmWriter.writePush(
                this.convertSegment(identifier.kind),
                identifier.index
            );
            this.compileExpression();
            this.compileToken(
                (token) => token.type === 'symbol' && token.symbol === ']'
            );
            this.vmWriter.writeArithmetic('add');
            this.vmWriter.writePop('pointer', 1);
            isArray = true;
        }
        this.compileToken(
            (token) => token.type === 'symbol' && token.symbol === '='
        );
        this.compileExpression();
        this.compileToken(
            (token) => token.type === 'symbol' && token.symbol === ';'
        );
        if (isArray) {
            this.vmWriter.writePop('that', 0);
        } else {
            this.vmWriter.writePop(
                this.convertSegment(identifier.kind),
                identifier.index
            );
        }
    };

    private convertSegment = (kind: 'static' | 'field' | 'arg' | 'var') => {
        switch (kind) {
            case 'static':
                return 'static';
            case 'field':
                return 'this';
            case 'arg':
                return 'argument';
            case 'var':
                return 'local';
            default:
                throw new Error();
        }
    };

    private compileIfStatement = (returnType: string) => {
        this.compileToken(
            (token) => token.type === 'keyword' && token.keyword === 'if'
        );
        this.compileToken(
            (token) => token.type === 'symbol' && token.symbol === '('
        );
        this.compileExpression();
        this.compileToken(
            (token) => token.type === 'symbol' && token.symbol === ')'
        );
        const L1Num = this.lableNum++;
        this.vmWriter.writeArithmetic('not');
        this.vmWriter.writeIf(`L${L1Num}`);
        this.compileToken(
            (token) => token.type === 'symbol' && token.symbol === '{'
        );
        this.compileStatements(returnType);
        this.compileToken(
            (token) => token.type === 'symbol' && token.symbol === '}'
        );
        const L2Num = this.lableNum++;
        this.vmWriter.writeGoto(`L${L2Num}`);
        this.vmWriter.writeLabel(`L${L1Num}`);
        const token = this.fetchToken();
        if (token.type === 'keyword' && token.keyword === 'else') {
            this.compileToken(
                (token) => token.type === 'keyword' && token.keyword === 'else'
            );
            this.compileToken(
                (token) => token.type === 'symbol' && token.symbol === '{'
            );
            this.compileStatements(returnType);
            this.compileToken(
                (token) => token.type === 'symbol' && token.symbol === '}'
            );
        }
        this.vmWriter.writeLabel(`L${L2Num}`);
    };

    private compileWhileStatement = (returnType: string) => {
        this.compileToken(
            (token) => token.type === 'keyword' && token.keyword === 'while'
        );
        const startLabel = `L${this.lableNum++}`;
        this.vmWriter.writeLabel(startLabel);
        this.compileToken(
            (token) => token.type === 'symbol' && token.symbol === '('
        );
        this.compileExpression();
        this.compileToken(
            (token) => token.type === 'symbol' && token.symbol === ')'
        );
        this.vmWriter.writeArithmetic('not');
        const endLabel = `L${this.lableNum++}`;
        this.vmWriter.writeIf(endLabel);
        this.compileToken(
            (token) => token.type === 'symbol' && token.symbol === '{'
        );
        this.compileStatements(returnType);
        this.compileToken(
            (token) => token.type === 'symbol' && token.symbol === '}'
        );
        this.vmWriter.writeGoto(startLabel);
        this.vmWriter.writeLabel(endLabel);
    };

    private compileDoStatement = (returnType: string) => {
        this.compileToken(
            (token) => token.type === 'keyword' && token.keyword === 'do'
        );
        this.compileSubroutineCall();
        this.compileToken(
            (token) => token.type === 'symbol' && token.symbol === ';'
        );
        if (returnType === 'void') {
            this.vmWriter.writePop('temp', 0); // TODO: void の値はどのセグメントに入れるべき？
        }
    };

    private compileReturnStatement = (returnType: string) => {
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
        if (returnType === 'void') {
            this.vmWriter.writePush('constant', 0);
        }
        this.vmWriter.writeReturn();
    };

    private compileSubroutineCall = () => {
        // compile the following expression.
        //
        // subroutineName '(' expressionList ')' |
        // (className | varName) '.' subroutineName '(' expressionList ')'

        // compile subroutineName | (className | varName)
        const name = this.compileToken((token) => token.type === 'identifier');
        const identifier = this.symbolTable.indentifierOf(name!);
        if (identifier) {
            this.vmWriter.writePush(
                this.convertSegment(identifier.kind),
                identifier.index
            );
        }
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
        //token = this.fetchToken(); いらない気がする
        const argNum = this.compileExpressionList(identifier, subName);
        this.compileToken(
            (token) => token.type === 'symbol' && token.symbol === ')'
        );
        if (identifier) {
            // call method
            this.vmWriter.writeCall(`${identifier.type}.${subName}`, argNum);
        } else if (subName) {
            // call function or constructor
            this.vmWriter.writeCall(`${name}.${subName}`, argNum);
        } else {
            // call method itself
            this.vmWriter.writeCall(`${this.clazz!}.${name}`, argNum);
        }
    };

    private compileExpressionList = (
        identifier:
            | {
                  type: string;
                  kind: 'var' | 'static' | 'field' | 'arg';
                  index: number;
              }
            | undefined,
        subName: string | undefined
    ): number => {
        let argNum = 0;
        if (identifier) {
            // call method
            this.vmWriter.writePush(
                this.convertSegment(identifier.kind),
                identifier.index
            );
            argNum++;
        } else if (!subName) {
            // call method itself
            this.vmWriter.writePush('pointer', 0);
            argNum++;
        }
        let token = this.fetchToken();
        if (token.type === 'symbol' && token.symbol === ')') {
            return argNum;
        }
        this.compileExpression();
        argNum++;
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
            } else if (token.type === 'symbol' && token.symbol === '/') {
                this.vmWriter.writeCall('Math.divide', 2);
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
                return 'sub';
            case '=':
                return 'eq';
            case '>':
                return 'gt';
            case '<':
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
            this.vmWriter.writePush('constant', token.stringVal.length);
            this.vmWriter.writeCall('String.new', 1);
            for (let c of token.stringVal) {
                this.vmWriter.writePush('constant', c.charCodeAt(0));
                this.vmWriter.writeCall('String.appendChar', 2);
            }
            return;
        } else if (token.type === 'keyword' && token.keyword === 'true') {
            this.compileToken();
            this.vmWriter.writePush('constant', 1);
            this.vmWriter.writeArithmetic('neg');
            return;
        } else if (
            token.type === 'keyword' &&
            (token.keyword === 'false' || token.keyword === 'null')
        ) {
            this.compileToken();
            this.vmWriter.writePush('constant', 0);
            return;
        } else if (token.type === 'keyword' && token.keyword === 'this') {
            this.compileToken();
            this.vmWriter.writePush('pointer', 0);
            return;
        } else if (token.type === 'identifier') {
            const name = this.compileToken();
            const identifier = this.symbolTable.indentifierOf(name!);
            if (!identifier) {
                throw new Error('no symboltable');
            }
            this.vmWriter.writePush(
                this.convertSegment(identifier.kind),
                identifier.index
            );
            const forwardToken = this.fetchToken();
            if (forwardToken.type === 'symbol' && forwardToken.symbol === '[') {
                this.compileToken();
                this.compileExpression();
                this.compileToken(
                    (token) => token.type === 'symbol' && token.symbol === ']'
                );
                this.vmWriter.writeArithmetic('add');
                this.vmWriter.writePop('pointer', 1);
                this.vmWriter.writePush('that', 0);
            }
            return;
        } else if (token.type === 'symbol' && token.symbol === '(') {
            this.compileToken();
            const result = this.compileExpression();
            this.compileToken(
                (token) => token.type === 'symbol' && token.symbol === ')'
            );
            return;
        } else if (
            token.type === 'symbol' &&
            (token.symbol === '-' || token.symbol === '~')
        ) {
            this.compileToken();
            this.compileTerm();
            this.vmWriter.writeArithmetic(token.symbol === '-' ? 'neg' : 'not');
            return;
        }
    };
}
