import * as fs from 'fs';
import { CompilationEngine } from './compilationEngine';
import { JackTokenizer } from './jackTokenizer';

const ce = new CompilationEngine(process.argv[2]);
ce.start();
// (async () => {
//     await jt.fetch();
//     while (jt.hasMoreTokens()) {
//         jt.advance();
//     }
// })();
