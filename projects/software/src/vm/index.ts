import * as fs from 'fs';
import * as pathModule from 'path';
import { CodeWriter } from './codeWriter';
import { Parser } from './parser';

const paths = buildPaths(process.argv[2]);
const codeWriter = new CodeWriter(process.argv[2]);
for (let path of paths) {
    convert(path);
}

function buildPaths(str: string): string[] {
    const files = fs.statSync(str).isFile()
        ? [str]
        : fs.readdirSync(str).filter((file) => /\w+\.vm/.test(file));
    const directory = `${pathModule.dirname(str)}/${pathModule.basename(
        process.argv[2]
    )}`;
    return files.map((file) => convertPath(file, directory));
}

function convertPath(file: string, directory: string): string {
    if (/\w+\/\w+\.vm/.test(file)) {
        return file;
    }
    return `${directory}/${file}`;
}

async function convert(path: string) {
    const rs = fs.createReadStream(path);
    const parser = new Parser(rs);
    while (await parser.hasMoreCommands()) {
        parser.advance();
        codeWriter.write(parser.getCommand());
    }
}
