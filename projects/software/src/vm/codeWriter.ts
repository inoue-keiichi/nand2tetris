import * as fs from 'fs';
import * as readline from 'readline';
import { versionMajorMinor } from 'typescript';
import { VMLine } from './types/commandType';

export class CodeWriter {
    private lines: string[];
    private next: number;
    private command: string | null;
    private fileName: string;
    private ws: fs.WriteStream;

    private jump: number;
    private gt: number;
    private lt: number;

    constructor(fileName: string) {
        this.lines = [];
        this.next = 0;
        this.command = null;
        this.fileName = fileName;
        this.ws = fs.createWriteStream(fileName.replace(/\.vm/, '.asm'));
        this.ws.write('@256\r\n');
        this.ws.write('D=A\r\n');
        this.ws.write('@SP\r\n');
        this.ws.write('M=D\r\n');

        this.jump = 0;
        this.gt = 0;
        this.lt = 0;
    }

    setFileName = (fileName: string) => {
        this.fileName = fileName;
    };

    write = (vm: VMLine) => {
        switch (vm.command) {
            case 'push':
                this.writePush(vm);
                break;
            case 'add':
                this.writeAdd(vm);
                break;
            case 'sub':
                this.writeSub(vm);
                break;
            case 'neg':
                this.writeNeg(vm);
                break;
            case 'eq':
                this.writeEq(vm);
                break;
            case 'gt':
                this.writeGt(vm);
                break;
            case 'lt':
                this.writeLt(vm);
                break;
            case 'and':
                this.writeAnd(vm);
                break;
            case 'or':
                this.writeOr(vm);
                break;
            case 'not':
                this.writeNot(vm);
                break;
            default:
                throw new Error('invalid command: ' + this.command);
        }
        this.ws.write('@SP\r\n');
        this.ws.write('M=M+1\r\n');
    };

    private writeLF(line: string) {
        this.ws.write(`${line}\r\n`);
    }

    private writePush(vm: VMLine) {
        switch (vm.segment) {
            case 'constant':
                this.writeLF(`@${vm.arg}`);
                this.writeLF('D=A');
                this.writeLF('D=A');
                this.writeLF('@SP');
                this.writeLF('A=M');
                this.writeLF('M=D');
                break;
        }
    }

    private writeAdd(vm: VMLine) {
        this.writeLF('@SP');
        this.writeLF('M=M-1');
        this.writeLF('A=M');
        this.writeLF('D=M');
        this.writeLF('M=0');
        this.writeLF('@SP');
        this.writeLF('AM=M-1');
        this.writeLF('M=D+M');
    }

    private writeSub(vm: VMLine) {
        this.writeLF('@SP');
        this.writeLF('M=M-1');
        this.writeLF('A=M');
        this.writeLF('D=M');
        this.writeLF('M=0');
        this.writeLF('@SP');
        this.writeLF('AM=M-1');
        this.writeLF('M=M-D');
    }

    private writeNeg(vm: VMLine) {
        this.writeLF('@SP');
        this.writeLF('M=M-1');
        this.writeLF('A=M');
        this.writeLF('D=M');
        this.writeLF('M=-D');
    }

    private writeEq(vm: VMLine) {
        this.writeLF('@SP');
        this.writeLF('M=M-1');
        this.writeLF('A=M');
        this.writeLF('D=M');
        this.writeLF('@SP');
        this.writeLF('AM=M-1');
        this.writeLF('D=M-D');
        this.writeLF(`@JUMP_${this.jump}`);
        this.writeLF('D;JEQ');
        this.writeLF('@SP');
        this.writeLF('A=M');
        this.writeLF('M=0');
        this.writeLF(`@JUMP_END_${this.jump}`);
        this.writeLF('0;JEQ');
        this.writeLF(`(JUMP_${this.jump})`);
        this.writeLF('@SP');
        this.writeLF('A=M');
        this.writeLF('M=-1');
        this.writeLF(`(JUMP_END_${this.jump})`);
        this.jump++;
    }

    private writeGt(vm: VMLine) {
        this.writeLF('@SP');
        this.writeLF('M=M-1');
        this.writeLF('A=M');
        this.writeLF('D=M');
        this.writeLF('@SP');
        this.writeLF('AM=M-1');
        this.writeLF('D=M-D');
        this.writeLF(`@JUMP_${this.jump}`);
        this.writeLF('D;JGT');
        this.writeLF('@SP');
        this.writeLF('A=M');
        this.writeLF('M=0');
        this.writeLF(`@JUMP_END_${this.jump}`);
        this.writeLF('0;JEQ\r\n');
        this.writeLF(`(JUMP_${this.jump})`);
        this.writeLF('@SP');
        this.writeLF('A=M');
        this.writeLF('M=-1');
        this.writeLF(`(JUMP_END_${this.jump})`);
        this.jump++;
    }

    private writeLt(vm: VMLine) {
        this.writeLF('@SP');
        this.writeLF('M=M-1');
        this.writeLF('A=M');
        this.writeLF('D=M');
        this.writeLF('@SP');
        this.writeLF('AM=M-1');
        this.writeLF('D=M-D');
        this.writeLF(`@JUMP_${this.jump}`);
        this.writeLF('D;JLT');
        this.writeLF('@SP');
        this.writeLF('A=M');
        this.writeLF('M=0');
        this.writeLF(`@JUMP_END_${this.jump}`);
        this.writeLF('0;JEQ');
        this.writeLF(`(JUMP_${this.jump})`);
        this.writeLF('@SP');
        this.writeLF('A=M');
        this.writeLF('M=-1');
        this.writeLF(`(JUMP_END_${this.jump})`);
        this.jump++;
    }

    private writeAnd(vm: VMLine) {
        this.writeLF('@SP');
        this.writeLF('M=M-1');
        this.writeLF('A=M');
        this.writeLF('D=M');
        this.writeLF('M=0');
        this.writeLF('@SP');
        this.writeLF('AM=M-1');
        this.writeLF('M=D&M');
    }

    private writeOr(vm: VMLine) {
        this.writeLF('@SP');
        this.writeLF('M=M-1');
        this.writeLF('A=M');
        this.writeLF('D=M');
        this.writeLF('M=0');
        this.writeLF('@SP');
        this.writeLF('AM=M-1');
        this.writeLF('M=D|M');
    }

    private writeNot(vm: VMLine) {
        this.writeLF('@SP');
        this.writeLF('M=M-1');
        this.writeLF('A=M');
        this.writeLF('D=M');
        this.writeLF('M=!D');
    }

    close = () => {
        this.ws.end();
    };
}
