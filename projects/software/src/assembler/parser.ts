import { Command } from './types/command';
import * as fs from 'fs';
import * as readline from 'readline';

export class Parser {
    private lines: string[];
    private next: number;
    private command: string | null;
    private reader: readline.Interface;

    constructor(readStream: fs.ReadStream, writeStream?: fs.WriteStream) {
        this.lines = [];
        this.next = 0;
        this.command = null;
        this.reader = readline.createInterface({
            input: readStream,
            output: writeStream,
        });
    }

    async hasMoreCommands() {
        if (this.lines.length === 0) {
            await this.input();
        }
        return this.next < this.lines.length;
    }

    private input = async () => {
        for await (const line of this.reader) {
            if (line === '' || /(^\s+$)|(^\s*\/\/.*$)/.test(line)) {
                continue;
            }
            const elimatedLine = line.replace(/\s/g, '').replace(/\/\/.*/, '');
            this.lines.push(elimatedLine);
        }
    };

    advance() {
        this.command = this.lines[this.next++];
    }

    commandType(): Command {
        if (this.command === null) {
            throw new Error();
        }
        switch (true) {
            case /^@[A-Za-z0-9_:\.\$]+$/.test(this.command):
                return createA(this.command);
            case /^\([A-Za-z0-9_:\.\$]+\)$/.test(this.command):
                return createL(this.command);
            case /^[A-Za-z0-9]+[;=][A-Za-z0-9\+\-\!\|\&]+$/.test(this.command):
                return createC(this.command);
            default:
                throw new Error(`Cannot create mnimonics of "${this.command}"`);
        }

        function createA(command: string): Command {
            return {
                type: 'A',
                symbol: command.slice(1),
            };
        }

        function createL(command: string): Command {
            return {
                type: 'L',
                symbol: command.slice(1, command.length - 1),
            };
        }

        function createC(command: string): Command {
            const result: Command = { type: 'C' };
            if (command.indexOf('=') !== -1) {
                result.dest = command.replace(/=.*/, '');
                result.comp = command.replace(/.*=/, '').replace(/;.*/, '');
            }
            if (command.indexOf(';') !== -1) {
                result.jump = command.replace(/.*;/, '');
                result.comp = command.replace(/;.*/, '');
            }
            return result;
        }
    }
}
