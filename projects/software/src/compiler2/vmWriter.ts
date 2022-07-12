import * as fs from 'fs';

type Segment =
    | 'constant'
    | 'argument'
    | 'local'
    | 'static'
    | 'this'
    | 'that'
    | 'pointer'
    | 'temp';

export type Command =
    | 'add'
    | 'sub'
    | 'neg'
    | 'eq'
    | 'gt'
    | 'lt'
    | 'and'
    | 'or'
    | 'not';

export class VMWriter {
    private ws: fs.WriteStream;

    constructor(path: string) {
        this.ws = fs.createWriteStream(path.replace(/\.jack$/, '.vm'));
    }

    writePush = (segment: Segment, index: number) => {
        this.ws.write(`push ${segment} ${index}\n`);
    };

    writePop = (segment: Segment, index: number) => {
        this.ws.write(`pop ${segment} ${index}\n`);
    };

    writeArithmetic = (coomand: Command) => {
        this.ws.write(`${coomand}\n`);
    };

    writeLabel = (label: string) => {
        this.ws.write(`label ${label}\n`);
    };

    writeGoto = (label: string) => {
        this.ws.write(`goto ${label}\n`);
    };

    writeIf = (label: string) => {
        this.ws.write(`if-goto ${label}\n`);
    };

    writeCall = (name: string, nArg: number) => {
        this.ws.write(`call ${name} ${nArg}\n`);
    };

    writeFunction = (name: string, nLocals: number) => {
        this.ws.write(`function ${name} ${nLocals}\n`);
    };

    writeReturn = () => {
        this.ws.write(`return\n`);
    };
}
