import * as fs from 'fs';
import * as readline from 'readline';
import {
    Arithmetic,
    ArithmeticCommand,
    isMemoryAccess,
    MemoryAccess,
    Segment,
    VMLine,
} from './types/commandType';

export class Parser {
    private lines: string[];
    private next: number;
    private command: string | null;
    private reader: readline.Interface;

    constructor(readStream: fs.ReadStream) {
        this.lines = [];
        this.next = 0;
        this.command = null;
        this.reader = readline.createInterface({
            input: readStream,
        });
    }

    hasMoreCommands = async (): Promise<boolean> => {
        if (this.lines.length === 0) {
            await this.input();
        }
        return this.next < this.lines.length;
    };

    private input = async () => {
        for await (const line of this.reader) {
            if (line === '' || /(^\s+$)|(^\s*\/\/.*$)/.test(line)) {
                continue;
            }
            this.lines.push(line);
        }
    };

    advance = () => {
        this.command = this.lines[this.next++];
    };

    getCommand = (): VMLine => {
        if (this.command === null) {
            throw new Error("you don't have more commands.");
        }
        switch (true) {
            case /^(push|pop)[\s\w]+$/.test(this.command):
                return this.createMemoryAccess(this.command);
            case /^add|sub|neg|eq|gt|lt|and|or|not$/.test(this.command):
                return this.createArithmetic(this.command);
            default:
                throw new Error('invalid command: ' + this.command);
        }
    };

    private createMemoryAccess(command: string): MemoryAccess {
        const match = /^(push|pop)\s(\w+)\s(\d+)$/.exec(command);
        if (match !== null && isMemoryAccess(match[1])) {
            return {
                command: match[1],
                segment: match[2] as Segment,
                arg: match[3],
            };
        }
        throw new Error('invalid vm line: ' + this.command);
    }

    private createArithmetic(command: string): Arithmetic {
        const match = /^(add|sub|neg|eq|gt|lt|and|or|not)$/.exec(command);
        if (match !== null) {
            return {
                command: match[1] as ArithmeticCommand,
            };
        }
        throw new Error('invalid vm line: ' + this.command);
    }
}
