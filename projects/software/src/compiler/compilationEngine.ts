import { JackTokenizer } from './jackTokenizer';
import {
    isSymbol,
    TokenType,
    Token,
    isTokenType,
    isKeyWord,
} from './type/terminalSymbol';
import * as fs from 'fs';

export class CompilationEngine {
    private jackTokenizer: JackTokenizer;
    private ws: fs.WriteStream;

    constructor(path: string) {
        this.jackTokenizer = new JackTokenizer(path);
        this.ws = fs.createWriteStream(path.replace(/\.jack$/, 'Test.xml'));
        //console.log(path.replace(/\.jack$/, 'Test.xml'));
    }

    public start = async (): Promise<void> => {
        await this.jackTokenizer.fetch();

        // this.execute(this.compileClass, (token) => {
        //     return token.type === 'keyword' && token.keyword === 'class';
        // });
        this.compileClass();
        this.ws.on('finish', () => {
            console.log('finish!!');
        });
    };

    private execute = (
        tag: string,
        isValid: (token: Token) => boolean
    ): void => {
        if (!this.jackTokenizer.hasMoreTokens()) {
            return;
        }
        const token = this.jackTokenizer.advance();
        if (isValid(token)) {
            this.compileClass();
            return;
        }
        throw new Error(`invalid token: ${token}`);
    };

    private compileClass = (): void => {
        let token;
        if (!this.jackTokenizer.hasMoreTokens()) {
            throw new Error('');
        }
        token = this.jackTokenizer.advance();
        if (token.type !== 'keyword' || token.keyword !== 'class') {
            throw new Error('');
        }
        this.ws.write(`<${token}>\n`);

        this.ws.write(`</${token}>\n`);

        if (this.jackTokenizer.hasMoreTokens()) {
            this.jackTokenizer.advance();
            if (this.jackTokenizer.hasMoreTokens()) {
                const token = this.jackTokenizer.advance();
                if (token.type !== 'identifier') {
                    throw new Error();
                }
                this.ws.write(`  <keyword> ${token.identifier} </keyword>\n`);
            }
            this.ws.write('</class>\n');
        }
    };
}
