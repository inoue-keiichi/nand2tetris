import * as fs from 'fs'
import { Command } from '../types/command';
import { Code } from './code';
import { Parser } from './parser';
import { SymbolTable } from './symbolTable';

const symbolTable = createSymbolTable();
const rs = fs.createReadStream(process.argv[2]);
setPseudoCommand(rs, symbolTable).then(() => {
  const rs2 = fs.createReadStream(process.argv[2]);
  convertBinary(rs2, symbolTable);
});

async function setPseudoCommand(stream: fs.ReadStream, table: SymbolTable) {
  const parser = new Parser(stream);
  let i: number = 0;
  let commandType: Command | null = null;
  await readCommands();

  async function readCommands() {
    let next = true;
    while (next) {
      next = await readNextCommand();
    }
  }

  async function readNextCommand() {
    return parser.hasMoreCommands().then((next) => {
      if (!next) {
        return next;
      }
      parser.advance();
      commandType = parser.commandType();
      switch (commandType.type) {
        case "L":
          table.addEntry(commandType.symbol, i);
          break;
        case "A":
        case "C":
          i++;
          break;
        default:
          throw new Error();
      }
      return next;
    }).catch((e) => { throw new Error(e) });
  }
}

async function convertBinary(stream: fs.ReadStream, table: SymbolTable): Promise<void> {
  const parser = new Parser(stream);
  let commandType: Command | null = null;
  let adressNum = 16;
  const ws = fs.createWriteStream(process.argv[2].replace(/\.asm/, ".hack"));
  await readCommands();
  console.log("finish!");

  async function readCommands() {
    let next = true;
    while (next) {
      next = await readNextCommand();
    }
  }

  async function readNextCommand() {
    return parser.hasMoreCommands().then((next) => {
      if (!next) {
        return next;
      }
      parser.advance();
      commandType = parser.commandType();
      switch (commandType.type) {
        case "L":
          break;
        case "C":
          ws.write(convertC(commandType));
          ws.write("\r\n");
          break;
        case "A":
          if (!/^[0-9]+$/.test(commandType.symbol) && !table.contains(commandType.symbol)) {
            table.addEntry(commandType.symbol, adressNum++);
          }
          ws.write(convertA(commandType.symbol));
          ws.write("\r\n");
          break;
        default:
          throw new Error();
      }
      return next;
    }).catch((e) => { throw new Error(e) });
  }

  function convertC(commandType: Command): string {
    if (commandType.type !== "C") {
      throw new Error();
    }
    return "111" + Code.comp(commandType.comp) + Code.dest(commandType.dest) + Code.jump(commandType.jump);
  }

  function convertA(symbol: string): string {
    if (/^[0-9]+$/.test(symbol)) {
      return convert16Bit(parseInt(symbol, 10).toString(2));
    } else if (table.contains(symbol)) {
      return convert16Bit(table.getAddress(symbol).toString(2));
    } else {
      throw Error();
    }
  }

  function convert16Bit(binary: string) {
    return ('0000000000000000' + binary).slice(-16);
  }
}

function createSymbolTable(): SymbolTable {
  const symbolTable = new SymbolTable();
  symbolTable.addEntry("SP", 0x0000);
  symbolTable.addEntry("LCL", 0x0001);
  symbolTable.addEntry("ARG", 0x0002);
  symbolTable.addEntry("THIS", 0x0003);
  symbolTable.addEntry("THAT", 0x0004);
  symbolTable.addEntry("SCREEN", 0x4000);
  symbolTable.addEntry("KBD", 0x6000);
  for (let i = 0; i < 16; i++) {
    symbolTable.addEntry("R" + i, i);
  }
  return symbolTable;
}
