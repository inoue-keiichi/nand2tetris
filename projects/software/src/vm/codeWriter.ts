import * as fs from 'fs';
import * as pathModule from 'path';
import { FunctionArg, TwoArg, OneArg, CommandType } from './types/commandType';

export class CodeWriter {
    private _filename: string;
    private ws: fs.WriteStream;
    private funcName: string | null;

    private jump: number;
    private returnAddress: number;

    constructor(outputFile: string, init = true) {
        this._filename = outputFile;
        this.funcName = null;
        this.jump = 0;
        this.returnAddress = 0;
        this.ws = fs.createWriteStream(this.createFileName(outputFile));
        if (init) {
            this.writeInit();
        }
    }

    set filename(filename: string) {
        this._filename = filename;
    }

    get filename() {
        return this._filename;
    }

    private createFileName = (path: string): string => {
        if (/[\/\w]+\.vm/.test(path)) {
            return path.replace(/\.vm/, '.asm');
        }
        return `${path}/${pathModule.basename(path)}.asm`;
    };

    private writeInit() {
        this.writeLF('@SP');
        this.writeLF('@256');
        this.writeLF('D=A');
        this.writeLF('@SP');
        this.writeLF('M=D');
        this.writeCall({ command: 'call', funcName: 'Sys.init', arg: '0' });
    }

    writeLine = (vm: CommandType) => {
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
                this.writeLabel(vm.arg);
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
            case 'function':
                this.writeFunction(vm);
                break;
            case 'call':
                this.writeCall(vm);
                break;
        }
    };

    private writeLF(line: string) {
        this.ws.write(`${line}\r\n`);
    }

    private writePush(vm: TwoArg) {
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
                this.writeLF(`@${3 + parseInt(vm.arg, 10)}`);
                this.writeLF('D=M');
                this.writeLF('@SP');
                this.writeLF('A=M');
                this.writeLF('M=D'); // スタックに乗せる

                this.writeLF('@SP');
                this.writeLF('M=M+1');
                break;
            case 'static':
                this.writeLF(
                    `@${this._filename
                        .replace(/[\w\/\.]+\//, '')
                        .replace(/\.vm/, '')}.${parseInt(vm.arg, 10)}`
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

    private writePop(vm: TwoArg) {
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
                    `@${this._filename
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

    private writeLabel(label: string) {
        if (this.funcName === null) {
            this.writeLF(`(${label})`);
        } else {
            // グローバルでユニークなラベルを作成する
            this.writeLF(`(${this.funcName}$${label})`);
        }
    }

    private writeAdress(label: string) {
        if (this.funcName === null) {
            this.writeLF(`@${label}`);
        } else {
            // グローバルでユニークなシンボルを作成する
            this.writeLF(`@${this.funcName}$${label}`);
        }
    }

    private writeIfGoto(vm: OneArg) {
        this.writeLF('@SP');
        this.writeLF('M=M-1');
        this.writeLF('A=M');
        this.writeLF('D=M');
        this.writeAdress(vm.arg);
        this.writeLF('D;JNE');
    }

    private writeGoto(vm: OneArg) {
        this.writeAdress(vm.arg);
        this.writeLF('0;JMP');
    }

    private writeFunction(vm: FunctionArg) {
        this.funcName = vm.funcName;
        this.writeLF(`(${vm.funcName})`);
        for (let i = 0; i < parseInt(vm.arg); i++) {
            this.writeLF('@SP');
            this.writeLF('A=M');
            this.writeLF('M=0');
            this.writeLF('@SP');
            this.writeLF('M=M+1');
        }
    }

    private writeReturn() {
        this.writeLF('@LCL');
        this.writeLF('D=M');
        this.writeLF('@R13');
        this.writeLF('M=D');

        this.writeLF('@R13');
        this.writeLF('A=M-1');
        this.writeLF('A=A-1');
        this.writeLF('A=A-1');
        this.writeLF('A=A-1');
        this.writeLF('A=A-1');
        this.writeLF('D=M');
        this.writeLF('@R14');
        this.writeLF('M=D');

        this.writePop({ command: 'pop', segment: 'argument', arg: '0' });

        this.writeLF('@ARG');
        this.writeLF('D=M+1');
        this.writeLF('@SP');
        this.writeLF('M=D');

        this.writeLF('@R13');
        this.writeLF('A=M-1');
        this.writeLF('D=M');
        this.writeLF('@THAT');
        this.writeLF('M=D');

        this.writeLF('@R13');
        this.writeLF('A=M-1');
        this.writeLF('A=A-1');
        this.writeLF('D=M');
        this.writeLF('@THIS');
        this.writeLF('M=D');

        this.writeLF('@R13');
        this.writeLF('A=M-1');
        this.writeLF('A=A-1');
        this.writeLF('A=A-1');
        this.writeLF('D=M');
        this.writeLF('@ARG');
        this.writeLF('M=D');

        this.writeLF('@R13');
        this.writeLF('A=M-1');
        this.writeLF('A=A-1');
        this.writeLF('A=A-1');
        this.writeLF('A=A-1');
        this.writeLF('D=M');
        this.writeLF('@LCL');
        this.writeLF('M=D');

        this.writeLF('@R14');
        this.writeLF('A=M');
        this.writeLF('0;JMP');
    }

    private writeCall(vm: FunctionArg) {
        this.writePush({
            command: 'push',
            segment: 'constant',
            arg: `return-address_${this.returnAddress}`,
        });
        // push LCL
        this.writeLF('@LCL');
        this.writeLF('D=M');
        this.writeLF('@SP');
        this.writeLF('A=M');
        this.writeLF('M=D');
        this.writeLF('@SP');
        this.writeLF('M=M+1');
        // push ARG
        this.writeLF('@ARG');
        this.writeLF('D=M');
        this.writeLF('@SP');
        this.writeLF('A=M');
        this.writeLF('M=D');
        this.writeLF('@SP');
        this.writeLF('M=M+1');
        // push THIS
        this.writeLF('@THIS');
        this.writeLF('D=M');
        this.writeLF('@SP');
        this.writeLF('A=M');
        this.writeLF('M=D');
        this.writeLF('@SP');
        this.writeLF('M=M+1');
        // push THAT
        this.writeLF('@THAT');
        this.writeLF('D=M');
        this.writeLF('@SP');
        this.writeLF('A=M');
        this.writeLF('M=D');
        this.writeLF('@SP');
        this.writeLF('M=M+1');
        // ARG = SP - n - 5
        this.writeLF('@SP');
        this.writeLF('D=M');
        for (let i = 0; i < parseInt(vm.arg) + 5; i++) {
            this.writeLF('D=D-1');
        }
        this.writeLF('@ARG');
        this.writeLF('M=D');
        // LCL = SP
        this.writeLF('@SP');
        this.writeLF('D=M');
        this.writeLF('@LCL');
        this.writeLF('M=D');

        this.writeLF(`@${vm.funcName}`);
        this.writeLF('0;JMP');

        this.writeLF(`(return-address_${this.returnAddress})`);
        this.returnAddress++;
    }

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
