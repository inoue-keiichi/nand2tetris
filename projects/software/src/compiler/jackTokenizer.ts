//import * as fs from 'fs';
import { promises as fs } from 'fs';
import {
    isSymbol,
    TokenType,
    Token,
    isTokenType,
    isKeyWord,
} from './type/terminalSymbol';

export class JackTokenizer {
    private path: string;
    private file: string | undefined;
    private index: number;
    private token: string | null;
    private symbol: string | null;

    constructor(path: string) {
        this.file = '';
        this.path = path;
        this.index = 0;
        this.token = null;
        this.symbol = null;
    }

    public async fetch() {
        this.file = await fs.readFile(this.path, 'utf-8');
        this.file = this.file.replace(/(\/\/.*|\/\*\*.*\*\/)\n/g, '\n');
    }

    public hasMoreTokens(): boolean {
        if (typeof this.file === 'undefined') {
            return false;
        }

        this.index = this.skipBlank(this.file, this.index);
        // let char: string = this.file.charAt(this.index);
        // while (char === ' ' || char === '\n') {
        //     this.index++;
        //     char = this.file.charAt(this.index);
        // }
        let char: string = this.file.charAt(this.index);

        if (isSymbol(char)) {
            this.token = char;
            this.index++;
            return true;
        }

        let token = '';
        while (char !== '') {
            char = this.file.charAt(this.index);
            if (char === ' ' || char === '\n') {
                this.index++;
                break;
            } else if (isSymbol(char)) {
                break;
            }
            token += char;
            this.index++;
        }
        this.token = token;
        return token.length > 0;
    }

    private skipBlank(fileContent: string, index: number): number {
        let char: string = fileContent.charAt(index);
        while (char === ' ' || char === '\n') {
            index++;
            char = fileContent.charAt(index);
        }
        return index;
    }

    public advance(): Token {
        if (this.token === null) {
            return {
                type: 'no_token',
                toString: function () {
                    return `type: ${this.type}`;
                },
            };
        } else if (isKeyWord(this.token)) {
            return {
                type: 'keyword',
                keyword: this.token,
                toString: function () {
                    return `type: ${this.type}, token: ${this.keyword}`;
                },
            };
        } else if (isSymbol(this.token)) {
            return {
                type: 'symbol',
                symbol: this.token,
                toString: function () {
                    return `type: ${this.type}, token: ${this.symbol}`;
                },
            };
        } else if (this.token.match(/^[A-Za-z0-9_]+$/)) {
            return {
                type: 'identifier',
                identifier: this.token,
                toString: function () {
                    return `type: ${this.type}, token: ${this.identifier}`;
                },
            };
        } else if (this.token.match(/^"[^\n"]+"$/)) {
            return {
                type: 'string_const',
                stringVal: this.token,
                toString: function () {
                    return `type: ${this.type}, token: ${this.stringVal}`;
                },
            };
        } else if (this.token.includes('\n') || this.token.includes('"')) {
            throw new Error(`invalid token: ${this.token}`);
        } else if (this.token.match(/^[0-9]+$/)) {
            return {
                type: 'int_const',
                intVal: this.token,
                toString: function () {
                    return `type: ${this.type}, token: ${this.intVal}`;
                },
            };
        }
        throw new Error(`unknown type token: ${this.token}`);
    }
}
