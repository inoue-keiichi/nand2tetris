import { CodeWriter } from './codeWriter';
import { createFileInfo, FileInfo } from './fileInfoCreater';
import { Parser } from './parser';
import * as fs from 'fs';

const fileInfos = createFileInfo(process.argv[2]);
if (
    fileInfos.length > 1 &&
    !fileInfos.some((fileInfo) => /Sys\.vm/.test(fileInfo.basename))
) {
    throw new Error('Not Found Sys.vm');
}
const codeWriter =
    fileInfos.length > 1
        ? new CodeWriter(process.argv[2])
        : new CodeWriter(process.argv[2], false);
write(fileInfos);

async function write(fileInfos: FileInfo[]) {
    for (let fileInfo of fileInfos) {
        const parser = await new Parser(fs.createReadStream(fileInfo.path));

        codeWriter.filename = fileInfo.basename;
        while (await parser.hasMoreCommands()) {
            parser.advance();
            codeWriter.writeLine(parser.getCommand());
        }
    }
}
