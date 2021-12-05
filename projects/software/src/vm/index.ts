import * as fs from 'fs';
import { CodeWriter } from './codeWriter';
import { Parser } from './parser';

const rs = fs.createReadStream(process.argv[2]);
const parser = new Parser(rs);
const codeWriter = new CodeWriter(process.argv[2]);
convert();

async function convert() {
    while (await parser.hasMoreCommands()) {
        parser.advance();
        codeWriter.write(parser.getCommand());
    }
}
