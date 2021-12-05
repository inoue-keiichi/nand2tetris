import * as fs from 'fs';
import * as readline from 'readline';
import { Command } from '../types/command';
import { VMLine, CommandType } from './types/commandType';

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
            //const elimatedLine = line.replace(/\s/g, '').replace(/\/\/.*/, '');
            this.lines.push(line);
        }
    };

    advance = () => {
        this.command = this.lines[this.next++];
        //console.log(this.command);
    };

    getCommand = (): VMLine => {
        if (this.command === null) {
            throw new Error("you don't have more commands.");
        }
        switch (true) {
            case /^push[\s\w]+$/.test(this.command):
                const match = /^push\s(\w+)\s(\d+)$/.exec(this.command);
                if (match !== null) {
                    console.log('command: ' + match[0]);
                    return {
                        command: 'push',
                        segment: match[1],
                        arg: match[2],
                    };
                }
                throw new Error('invalid command: ' + this.command);
            // case /^pop[\s\w]+$/.test(this.command):
            //     return 'C_POP';
            // case /^label[\s\w]+$/.test(this.command):
            //     return 'C_LABEL';
            // case /^goto[\s\w]+$/.test(this.command):
            //     return 'C_GOTO';
            // case /^if[\s\w]+$/.test(this.command):
            //     return 'C_IF';
            // case /^function[\s\w]+$/.test(this.command):
            //     return 'C_FUNCTION';
            // case /^return[\s\w]+$/.test(this.command):
            //     return 'C_RETURN';
            // case /^return[\s\w]+$/.test(this.command):
            //     return 'C_CALL';
            case /^add|sub|neg|eq|gt|lt|and|or|not$/.test(this.command):
                const match1 = /^(add|sub|neg|eq|gt|lt|and|or|not)$/.exec(
                    this.command
                );
                if (match1 !== null) {
                    return {
                        command: match1[0],
                    };
                }
                throw new Error('invalid command: ' + this.command);
            default:
                throw new Error('invalid command: ' + this.command);
        }
    };

    private hoge() {}
}
