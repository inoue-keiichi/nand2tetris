//import * as fs from 'fs';
import { promises as fs } from 'fs';
import { isSymbol, Token, isKeyWord } from './type/terminalSymbol';

export class JackTokenizer {
    private path: string;
    private file?: string;
    private index: number;
    private token?: string;

    constructor(path: string) {
        this.file = '';
        this.path = path;
        this.index = 0;
    }

    public async fetch() {
        this.file = await fs.readFile(this.path, 'utf-8');
        this.file = this.file.replace(/\r\n/g, '\n');
        this.file = this.file.replace(/(\/\/.*|\/\*\*.*\*\/)\n/g, '\n');
        this.file = this.file.replace(/(\/\*\*(.|\n)*?\*\/\n)/g, '\n');
        this.file = this.file.replace(/(\t|\v)/g, '');
    }

    public hasMoreTokens(): boolean {
        if (typeof this.file === 'undefined') {
            return false;
        }

        this.index = this.skipBlank(this.file, this.index);
        let char: string = this.file.charAt(this.index);

        if (isSymbol(char)) {
            this.token = char;
            this.index++;
            return true;
        }

        let token = '';
        while (char !== '') {
            char = this.file.charAt(this.index);
            if (mayBeStringConstant(token) && char === '"') {
                token += char;
                this.index++;
                break;
            } else if (mayBeStringConstant(token) && char !== '"') {
                token += char;
                this.index++;
                continue;
            } else if (char === ' ' || char === '\n') {
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

        function mayBeStringConstant(token: string): boolean {
            return token.match(/^".*/) !== null;
        }
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
        if (this.token === undefined) {
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
                getValue: function () {
                    return this.keyword;
                },
            };
        } else if (isSymbol(this.token)) {
            return {
                type: 'symbol',
                symbol: this.token,
                toString: function () {
                    return `type: ${this.type}, token: ${this.symbol}`;
                },
                getValue: function () {
                    switch (this.symbol) {
                        case '<':
                            return '&lt;';
                        case '>':
                            return '&gt;';
                        case '&':
                            return '&amp;';
                        default:
                            return this.symbol;
                    }
                },
            };
        } else if (this.token.match(/^"[^\n"]+"$/)) {
            return {
                type: 'stringConstant',
                stringVal: this.token.slice(1, -1),
                toString: function () {
                    return `type: ${this.type}, token: ${this.stringVal}`;
                },
                getValue: function () {
                    return this.stringVal;
                },
            };
        } else if (this.token.includes('\n') || this.token.includes('"')) {
            throw new Error(`invalid token: ${this.token}`);
        } else if (this.token.match(/^[0-9]+$/)) {
            return {
                type: 'integerConstant',
                intVal: this.token,
                toString: function () {
                    return `type: ${this.type}, token: ${this.intVal}`;
                },
                getValue: function () {
                    return this.intVal;
                },
            };
        } else if (this.token.match(/^[A-Za-z0-9_]+$/)) {
            return {
                type: 'identifier',
                identifier: this.token,
                toString: function () {
                    return `type: ${this.type}, token: ${this.identifier}`;
                },
                getValue: function () {
                    return this.identifier;
                },
            };
        }
        throw new Error(`unknown type token: ${this.token}`);
    }
}
