import * as fs from 'fs';
import { createFileInfo } from '../util/fileInfoCreater';
import { CompilationEngine } from './compilationEngine';

createFileInfo(process.argv[2], 'jack').forEach((fileInfo) => {
    const ce = new CompilationEngine(fileInfo.path);
    ce.start();
});
