import * as fs from 'fs';
import * as pathModule from 'path';
import { CodeWriter } from './codeWriter';
import { Parser } from './parser';

const paths = buildPaths(process.argv[2]);
const codeWriter = new CodeWriter(findOutputFilePath(paths.others));
convertFiles(paths);

function buildPaths(str: string): { sys?: string; others: string[] } {
    const files = fs.statSync(str).isFile()
        ? [str]
        : fs.readdirSync(str).filter((file) => /\w+\.vm/.test(file));
    const directory = `${pathModule.dirname(str)}/${pathModule.basename(
        process.argv[2]
    )}`;
    const sys = files.find((file) => /Sys\.vm/.test(file));
    if (!sys) {
        return {
            others: files.map((file) => convertPath(file, directory)),
        };
    }
    return {
        sys: convertPath(sys, directory),
        others: files
            .filter((file) => !/Sys\.vm/.test(file))
            .map((file) => convertPath(file, directory)),
    };
}

function convertPath(file: string, directory: string): string {
    if (/\w+\/\w+\.vm/.test(file)) {
        return file;
    }
    return `${directory}/${file}`;
}

function findOutputFilePath(paths: string[]): string {
    if (paths.length === 1) {
        return paths[0];
    } else if (
        paths.length > 1 &&
        paths.some((path) => /[\/\w]+Main\.vm/.test(path))
    ) {
        return paths.find((path) => /[\/\w]+Main\.vm/.test(path))!;
    }
    throw new Error('Not Found Main.vm');
}

async function convertFiles(paths: { sys?: string; others: string[] }) {
    if (paths.sys) {
        await convert(paths.sys);
    }
    for (let path of paths.others) {
        await convert(path);
    }
}

async function convert(path: string) {
    const rs = fs.createReadStream(path);
    const parser = new Parser(rs);
    while (await parser.hasMoreCommands()) {
        parser.advance();
        codeWriter.write(parser.getCommand());
    }
}
