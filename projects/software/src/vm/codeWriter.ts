import * as fs from 'fs';
import { VMLine } from './types/commandType';

export class CodeWriter {
    private fileName: string;
    private ws: fs.WriteStream;

    private jump: number;

    constructor(fileName: string) {
        this.fileName = fileName;
        this.ws = fs.createWriteStream(fileName.replace(/\.vm/, '.asm'));
        this.writeLF('@256');
        this.writeLF('D=A');
        this.writeLF('@SP');
        this.writeLF('M=D');
        this.writeLF('@300');
        this.writeLF('D=A');
        this.writeLF('@LCL');
        this.writeLF('M=D');
        this.writeLF('@400');
        this.writeLF('D=A');
        this.writeLF('@ARG');
        this.writeLF('M=D');
        this.writeLF('@3000');
        this.writeLF('D=A');
        this.writeLF('@THIS');
        this.writeLF('M=D');
        this.writeLF('@3010');
        this.writeLF('D=A');
        this.writeLF('@THAT');
        this.writeLF('M=D');

        this.jump = 0;
    }

    setFileName = (fileName: string) => {
        this.fileName = fileName;
    };

    write = (vm: VMLine) => {
        switch (vm.command) {
            case 'push':
                this.writePush(vm);
                break;
            case 'pop':
                this.writePop(vm);
                break;
            case 'add':
                this.writeAdd();
                break;
            case 'sub':
                this.writeSub();
                break;
            case 'neg':
                this.writeNeg();
                break;
            case 'eq':
                this.writeEq();
                break;
            case 'gt':
                this.writeGt();
                break;
            case 'lt':
                this.writeLt();
                break;
            case 'and':
                this.writeAnd();
                break;
            case 'or':
                this.writeOr();
                break;
            case 'not':
                this.writeNot();
                break;
            case 'label':
                this.writeLabel(vm);
                break;
            case 'if-goto':
                this.writeIfGoto(vm);
                break;
            case 'goto':
                this.writeGoto(vm);
                break;
            case 'return':
                this.writeReturn();
                break;
            default:
                throw new Error('invalid command: ' + vm.command);
        }
    };

    private writeLF(line: string) {
        this.ws.write(`${line}\r\n`);
    }

    private writePush(vm: VMLine) {
        switch (vm.segment) {
            case 'constant':
                this.writeLF(`@${vm.arg}`);
                this.writeLF('D=A');
                this.writeLF('@SP');
                this.writeLF('A=M');
                this.writeLF('M=D');
                this.writeLF('@SP');
                this.writeLF('M=M+1');
                break;
            case 'local':
                this.writeLF(`@${vm.arg}`);
                this.writeLF('D=A');
                this.writeLF('@LCL');
                this.writeLF('AM=D+M'); // アドレス更新

                this.writeLF('D=M');
                this.writeLF('@SP');
                this.writeLF('A=M');
                this.writeLF('M=D'); // スタックに乗せる

                this.writeLF(`@${vm.arg}`);
                this.writeLF('D=A');
                this.writeLF('@LCL');
                this.writeLF('M=M-D'); // アドレス戻す

                this.writeLF('@SP');
                this.writeLF('M=M+1');
                break;
            case 'argument':
                this.writeLF(`@${vm.arg}`);
                this.writeLF('D=A');
                this.writeLF('@ARG');
                this.writeLF('AM=D+M'); // アドレス更新

                this.writeLF('D=M');
                this.writeLF('@SP');
                this.writeLF('A=M');
                this.writeLF('M=D'); // スタックに乗せる

                this.writeLF(`@${vm.arg}`);
                this.writeLF('D=A');
                this.writeLF('@ARG');
                this.writeLF('M=M-D'); // アドレス戻す

                this.writeLF('@SP');
                this.writeLF('M=M+1');
                break;
            case 'this':
                this.writeLF(`@${vm.arg}`);
                this.writeLF('D=A');
                this.writeLF('@THIS');
                this.writeLF('AM=D+M'); // アドレス更新

                this.writeLF('D=M');
                this.writeLF('@SP');
                this.writeLF('A=M');
                this.writeLF('M=D'); // スタックに乗せる

                this.writeLF(`@${vm.arg}`);
                this.writeLF('D=A');
                this.writeLF('@THIS');
                this.writeLF('M=M-D'); // アドレス戻す

                this.writeLF('@SP');
                this.writeLF('M=M+1');
                break;
            case 'that':
                this.writeLF(`@${vm.arg}`);
                this.writeLF('D=A');
                this.writeLF('@THAT');
                this.writeLF('AM=D+M'); // アドレス更新

                this.writeLF('D=M');
                this.writeLF('@SP');
                this.writeLF('A=M');
                this.writeLF('M=D'); // スタックに乗せる

                this.writeLF(`@${vm.arg}`);
                this.writeLF('D=A');
                this.writeLF('@THAT');
                this.writeLF('M=M-D'); // アドレス戻す

                this.writeLF('@SP');
                this.writeLF('M=M+1');
                break;
            case 'temp':
                this.writeLF(`@${5 + parseInt(vm.arg as string, 10)}`);
                this.writeLF('D=M');
                this.writeLF('@SP');
                this.writeLF('A=M');
                this.writeLF('M=D'); // スタックに乗せる

                this.writeLF('@SP');
                this.writeLF('M=M+1');
                break;
            case 'pointer':
                this.writeLF(`@${3 + parseInt(vm.arg as string, 10)}`);
                this.writeLF('D=M');
                this.writeLF('@SP');
                this.writeLF('A=M');
                this.writeLF('M=D'); // スタックに乗せる

                this.writeLF('@SP');
                this.writeLF('M=M+1');
                break;
            case 'static':
                this.writeLF(
                    `@${this.fileName
                        .replace(/[\w\/\.]+\//, '')
                        .replace(/\.vm/, '')}.${parseInt(vm.arg as string, 10)}`
                );
                this.writeLF('D=M');
                this.writeLF('@SP');
                this.writeLF('A=M');
                this.writeLF('M=D'); // スタックに乗せる

                this.writeLF('@SP');
                this.writeLF('M=M+1');
                break;
            default:
                throw new Error('invalid segment: ' + vm.segment);
        }
    }

    private writePop(vm: VMLine) {
        switch (vm.segment) {
            case 'local':
                this.writeLF(`@${vm.arg}`);
                this.writeLF('D=A');
                this.writeLF('@LCL');
                this.writeLF('M=D+M'); // アドレス更新

                this.writeLF('@SP');
                this.writeLF('AM=M-1');
                this.writeLF('D=M');
                this.writeLF('@LCL');
                this.writeLF('A=M');
                this.writeLF('M=D'); // LOCAL変数に入れる

                this.writeLF(`@${vm.arg}`);
                this.writeLF('D=A');
                this.writeLF('@LCL');
                this.writeLF('M=M-D'); // アドレス戻す
                break;
            case 'argument':
                this.writeLF(`@${vm.arg}`);
                this.writeLF('D=A');
                this.writeLF('@ARG');
                this.writeLF('M=D+M'); // アドレス更新

                this.writeLF('@SP');
                this.writeLF('AM=M-1');
                this.writeLF('D=M');
                this.writeLF('@ARG');
                this.writeLF('A=M');
                this.writeLF('M=D'); // ARG変数に入れる

                this.writeLF(`@${vm.arg}`);
                this.writeLF('D=A');
                this.writeLF('@ARG');
                this.writeLF('M=M-D'); // アドレス戻す
                break;
            case 'this':
                this.writeLF(`@${vm.arg}`);
                this.writeLF('D=A');
                this.writeLF('@THIS');
                this.writeLF('M=D+M'); // アドレス更新

                this.writeLF('@SP');
                this.writeLF('AM=M-1');
                this.writeLF('D=M');
                this.writeLF('@THIS');
                this.writeLF('A=M');
                this.writeLF('M=D'); // ARG変数に入れる

                this.writeLF(`@${vm.arg}`);
                this.writeLF('D=A');
                this.writeLF('@THIS');
                this.writeLF('M=M-D'); // アドレス戻す
                break;
            case 'that':
                this.writeLF(`@${vm.arg}`);
                this.writeLF('D=A');
                this.writeLF('@THAT');
                this.writeLF('M=D+M'); // アドレス更新

                this.writeLF('@SP');
                this.writeLF('AM=M-1');
                this.writeLF('D=M');
                this.writeLF('@THAT');
                this.writeLF('A=M');
                this.writeLF('M=D'); // THAT変数に入れる

                this.writeLF(`@${vm.arg}`);
                this.writeLF('D=A');
                this.writeLF('@THAT');
                this.writeLF('M=M-D'); // アドレス戻す
                break;
            case 'temp':
                this.writeLF('@SP');
                this.writeLF('AM=M-1');
                this.writeLF('D=M');
                this.writeLF(`@${5 + parseInt(vm.arg as string, 10)}`);
                this.writeLF('M=D'); // THAT変数に入れる
                break;
            case 'pointer':
                this.writeLF('@SP');
                this.writeLF('AM=M-1');
                this.writeLF('D=M');
                this.writeLF(`@${3 + parseInt(vm.arg as string, 10)}`);
                this.writeLF('M=D'); // THAT変数に入れる
                break;
            case 'static':
                this.writeLF('@SP');
                this.writeLF('AM=M-1');
                this.writeLF('D=M');
                this.writeLF(
                    `@${this.fileName
                        .replace(/[\w\/\.]+\//, '')
                        .replace(/\.vm/, '')}.${parseInt(vm.arg as string, 10)}`
                );
                this.writeLF('M=D'); // static変数に入れる
                break;
            default:
                throw new Error('invalid segment: ' + vm.segment);
        }
    }

    private writeAdd() {
        this.writeLF('@SP');
        this.writeLF('M=M-1');
        this.writeLF('A=M');
        this.writeLF('D=M');
        this.writeLF('@SP');
        this.writeLF('AM=M-1');
        this.writeLF('M=D+M');

        this.writeLF('@SP');
        this.writeLF('M=M+1');
    }

    private writeSub() {
        this.writeLF('@SP');
        this.writeLF('M=M-1');
        this.writeLF('A=M');
        this.writeLF('D=M');
        this.writeLF('@SP');
        this.writeLF('AM=M-1');
        this.writeLF('M=M-D');

        this.writeLF('@SP');
        this.writeLF('M=M+1');
    }

    private writeNeg() {
        this.writeLF('@SP');
        this.writeLF('M=M-1');
        this.writeLF('A=M');
        this.writeLF('D=M');
        this.writeLF('M=-D');

        this.writeLF('@SP');
        this.writeLF('M=M+1');
    }

    private writeEq() {
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

        this.writeLF('@SP');
        this.writeLF('M=M+1');

        this.jump++;
    }

    private writeLabel(vm: VMLine) {
        this.writeLF(`(${vm.arg})`);
    }

    private writeIfGoto(vm: VMLine) {
        this.writeLF('@SP');
        this.writeLF('M=M-1');
        this.writeLF('A=M');
        this.writeLF('D=M');
        this.writeLF(`@${vm.arg}`);
        this.writeLF('D;JNE');
    }

    private writeGoto(vm: VMLine) {
        this.writeLF(`@${vm.arg}`);
        this.writeLF('0;JMP');
    }

    private writeReturn() {}

    private writeGt() {
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

        this.writeLF('@SP');
        this.writeLF('M=M+1');

        this.jump++;
    }

    private writeLt() {
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

        this.writeLF('@SP');
        this.writeLF('M=M+1');

        this.jump++;
    }

    private writeAnd() {
        this.writeLF('@SP');
        this.writeLF('M=M-1');
        this.writeLF('A=M');
        this.writeLF('D=M');
        this.writeLF('M=0');
        this.writeLF('@SP');
        this.writeLF('AM=M-1');
        this.writeLF('M=D&M');

        this.writeLF('@SP');
        this.writeLF('M=M+1');
    }

    private writeOr() {
        this.writeLF('@SP');
        this.writeLF('M=M-1');
        this.writeLF('A=M');
        this.writeLF('D=M');
        this.writeLF('M=0');
        this.writeLF('@SP');
        this.writeLF('AM=M-1');
        this.writeLF('M=D|M');

        this.writeLF('@SP');
        this.writeLF('M=M+1');
    }

    private writeNot() {
        this.writeLF('@SP');
        this.writeLF('M=M-1');
        this.writeLF('A=M');
        this.writeLF('D=M');
        this.writeLF('M=!D');

        this.writeLF('@SP');
        this.writeLF('M=M+1');
    }

    close = () => {
        this.ws.end();
    };
}
