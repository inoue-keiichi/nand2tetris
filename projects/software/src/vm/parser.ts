import * as fs from 'fs';
import * as readline from 'readline';
import {
    isCommand,
    isSegmentCommand,
    isSegmentArgCommand,
    isSegment,
    VMLine,
    segmentArgCommand,
    command,
    segmentCommand,
} from './types/commandType';

export class Parser {
    private lines: string[];
    private next: number;
    private command: string | null;
    private reader: readline.Interface;

    private static COMMAND = new RegExp(`^(${command.join('|')})$`);
    private static SEGMENT_COMMAND = new RegExp(
        `^(${segmentCommand.join('|')})\\s(\\w+)$`
    );
    private static SEGMENT_ARG_COMMAND = new RegExp(
        `^(${segmentArgCommand.join('|')})\\s(\\w+)\\s(\\d+)$`
    );

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
            this.lines.push(this.eliminateComment(line));
        }
    };

    advance = () => {
        this.command = this.lines[this.next++];
    };

    private eliminateComment(line: string) {
        return line.replace(/\/\/.*$/, '').replace(/\s+$/, '');
    }

    getCommand = (): VMLine => {
        if (this.command === null) {
            throw new Error("you don't have more commands.");
        }
        switch (true) {
            case Parser.SEGMENT_ARG_COMMAND.test(this.command):
                return this.createMemoryAccess(this.command);
            case Parser.COMMAND.test(this.command):
                return this.createArithmetic(this.command);
            case Parser.SEGMENT_COMMAND.test(this.command):
                return this.createControl(this.command);
            default:
                throw new Error('invalid command: ' + this.command);
        }
    };

    private createControl(command: string): VMLine {
        const match = Parser.SEGMENT_COMMAND.exec(command);
        if (match !== null && isSegmentCommand(match[1])) {
            return {
                command: match[1],
                arg: match[2],
            };
        }
        throw new Error('invalid vm line: ' + this.command);
    }

    private createMemoryAccess(command: string): VMLine {
        const match = Parser.SEGMENT_ARG_COMMAND.exec(command);
        if (
            match !== null &&
            isSegmentArgCommand(match[1]) &&
            isSegment(match[2])
        ) {
            return {
                command: match[1],
                segment: match[2],
                arg: match[3],
            };
        }
        throw new Error('invalid vm line: ' + this.command);
    }

    private createArithmetic(command: string): VMLine {
        const match = Parser.COMMAND.exec(command);
        if (match !== null && isCommand(match[1])) {
            return {
                command: match[1],
            };
        }
        throw new Error('invalid vm line: ' + this.command);
    }
}
