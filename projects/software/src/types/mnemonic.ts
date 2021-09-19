//export type Dest = "null" | "M" | "D" | "MD" | "A" | "AM" | "AD" | "AMD"

export type Comp = "0" | "1" | "-1" | "D" | "A" | "!D" | "!A" | "-D" | "-A" | "D+1"
  | "A+1" | "D-1" | "A-1" | "D+A" | "D-A" | "A-D" | "D&A" | "D|A" | "M" | "!M" | "-M"
  | "M+1" | "M-1" | "D+M" | "D-M" | "M-D" | "D&M" | "D|M"

export type Jump = "null" | "JGT" | "JEQ" | "JGE" | "JLT" | "JNE" | "JLE" | "JMP"

const DEST_LIST = ["null", "M", "D", "MD", "A", "AM", "AD", "AMD"] as const;
const COMP_LIST = ["0", "1", "-1", "D", "A", "!D", "!A", "-D", "-A", "D+1",
  "A+1", "D-1", "A-1", "D+A", "D-A", "A-D", "D&A", "D|A", "M", "!M", "-M",
  "M+1", "M-1", "D+M", "D-M", "M-D", "D&M", "D|M"] as const;
const JUMP_LIST = ["null", "JGT", "JEQ", "JGE", "JLT", "JNE", "JLE", "JMP"]
export type Dest = typeof DEST_LIST[number];

export class Mnemonic {
  static isDest(arg: any) {
    return DEST_LIST.findIndex(e => e === arg) !== -1
  }

  static isComp(arg: any) {
    return COMP_LIST.findIndex(e => e === arg) !== -1
  }

  static isJump(arg: any) {
    return JUMP_LIST.findIndex(e => e === arg) !== -1
  }
}
