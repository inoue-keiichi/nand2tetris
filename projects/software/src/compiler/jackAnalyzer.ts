import * as fs from 'fs';
import { createFileInfo } from '../util/fileInfoCreater';
import { CompilationEngine } from './compilationEngine';
import { JackTokenizer } from './jackTokenizer';

createFileInfo(process.argv[2], 'jack').forEach((fileInfo) => {
    const ce = new CompilationEngine(fileInfo.path);
    ce.start();
});

// (async () => {
//     await jt.fetch();
//     while (jt.hasMoreTokens()) {
//         jt.advance();
//     }
// })();
