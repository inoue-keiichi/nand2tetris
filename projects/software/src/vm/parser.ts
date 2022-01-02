import * as fs from 'fs';
import * as readline from 'readline';
import {
    isCommand,
    isArgCommand as isArgCommand,
    isSegmentArgCommand,
    isSegment,
    CommandType,
    segmentArgCommand,
    command,
    argCommand,
    isFunctionCommand,
    functionCommand,
} from './types/commandType';

export class Parser {
    private lines: string[];
    private next: number;
    private command: string | null;
    private reader: readline.Interface;

    private static COMMAND = new RegExp(`^(${command.join('|')})$`);
    private static ARG_COMMAND = new RegExp(
        `^(${argCommand.join('|')})\\s(\\w+)$`
    );
    private static SEGMENT_ARG_COMMAND = new RegExp(
        `^(${segmentArgCommand.join('|')})\\s(\\w+)\\s(\\d+)$`
    );
    private static FUNCTION_COMMAND = new RegExp(
        `^(${functionCommand.join('|')})\\s(\\w+\\.\\w+)\\s(\\d+)$`
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

    getCommand = (): CommandType => {
        if (this.command === null) {
            throw new Error("you don't have more commands.");
        }
        switch (true) {
            case Parser.COMMAND.test(this.command):
                return this.createCommand(this.command);
            case Parser.ARG_COMMAND.test(this.command):
                return this.createArgCommand(this.command);
            case Parser.SEGMENT_ARG_COMMAND.test(this.command):
                return this.createSegmentArgCommand(this.command);
            case Parser.FUNCTION_COMMAND.test(this.command):
                return this.createFunction(this.command);
            default:
                throw new Error('invalid command: ' + this.command);
        }
    };

    private createFunction(command: string): CommandType {
        const match = Parser.FUNCTION_COMMAND.exec(command);
        if (match !== null && isFunctionCommand(match[1])) {
            return {
                command: match[1],
                funcName: match[2],
                arg: match[3],
            };
        }
        throw new Error('invalid vm line: ' + this.command);
    }

    private createArgCommand(command: string): CommandType {
        const match = Parser.ARG_COMMAND.exec(command);
        if (match !== null && isArgCommand(match[1])) {
            return {
                command: match[1],
                arg: match[2],
            };
        }
        throw new Error('invalid vm line: ' + this.command);
    }

    private createSegmentArgCommand(command: string): CommandType {
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

    private createCommand(command: string): CommandType {
        const match = Parser.COMMAND.exec(command);
        if (match !== null && isCommand(match[1])) {
            return {
                command: match[1],
            };
        }
        throw new Error('invalid vm line: ' + this.command);
    }
}
