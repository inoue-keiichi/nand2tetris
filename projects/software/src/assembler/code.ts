export class Code {
  static dest(mnemonic: string | undefined): string {
    if (mnemonic === undefined) {
      return "000"
    }
    switch (mnemonic) {
      case "null":
        return this.covert3Bit(0b000);
      case "M":
        return this.covert3Bit(0b001);
      case "D":
        return this.covert3Bit(0b010);
      case "MD":
        return this.covert3Bit(0b011);
      case "A":
        return this.covert3Bit(0b100);
      case "AM":
        return this.covert3Bit(0b101);
      case "AD":
        return this.covert3Bit(0b110);
      case "AMD":
        return this.covert3Bit(0b111);
      default:
        throw new Error();
    }
  }

  static comp(mnemonic: string | undefined): string {
    if (mnemonic === undefined) {
      return "0000000"
    }
    switch (mnemonic) {
      case "0":
        return this.covert7Bit(0b0101010);
      case "1":
        return this.covert7Bit(0b0111111);
      case "-1":
        return this.covert7Bit(0b0111010);
      case "D":
        return this.covert7Bit(0b0001100);
      case "A":
        return this.covert7Bit(0b0110000);
      case "!D":
        return this.covert7Bit(0b0001101);
      case "!A":
        return this.covert7Bit(0b0110001);
      case "-D":
        return this.covert7Bit(0b0001111);
      case "-A":
        return this.covert7Bit(0b0110011);
      case "D+1":
        return this.covert7Bit(0b0011111);
      case "A+1":
        return this.covert7Bit(0b0110111);
      case "D-1":
        return this.covert7Bit(0b0001110);
      case "A-1":
        return this.covert7Bit(0b0110010);
      case "D+A":
        return this.covert7Bit(0b0000010);
      case "D-A":
        return this.covert7Bit(0b0010011);
      case "D+A":
        return this.covert7Bit(0b0000010);
      case "D-A":
        return this.covert7Bit(0b0010011);
      case "A-D":
        return this.covert7Bit(0b0000111);
      case "D&A":
        return this.covert7Bit(0b0000000);
      case "D|A":
        return this.covert7Bit(0b0010101);
      case "M":
        return this.covert7Bit(0b1110000);
      case "!M":
        return this.covert7Bit(0b1110001);
      case "-M":
        return this.covert7Bit(0b1110011);
      case "M+1":
        return this.covert7Bit(0b1110111);
      case "M-1":
        return this.covert7Bit(0b1110010);
      case "D+M":
        return this.covert7Bit(0b1000010);
      case "D-M":
        return this.covert7Bit(0b1010011);
      case "M-D":
        return this.covert7Bit(0b1000111);
      case "D&M":
        return this.covert7Bit(0b1000000);
      case "D|M":
        return this.covert7Bit(0b1010101);
      default:
        throw new Error();
    }
  }

  static jump(mnemonic: string | undefined): string {
    if (mnemonic === undefined) {
      return "000"
    }
    switch (mnemonic) {
      case "null":
        return this.covert3Bit(0b000);
      case "JGT":
        return this.covert3Bit(0b001);
      case "JEQ":
        return this.covert3Bit(0b010);
      case "JGE":
        return this.covert3Bit(0b011);
      case "JLT":
        return this.covert3Bit(0b100);
      case "JNE":
        return this.covert3Bit(0b101);
      case "JLE":
        return this.covert3Bit(0b110);
      case "JMP":
        return this.covert3Bit(0b111);
      default:
        throw new Error();
    }
  }

  private static covert3Bit(num: number) {
    return ("000" + num.toString(2)).slice(-3);
  }

  private static covert7Bit(num: number) {
    return ("0000000" + num.toString(2)).slice(-7);
  }
}
