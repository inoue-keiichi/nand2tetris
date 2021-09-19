export class SymbolTable {
  private table: Map<string, number>;

  constructor() {
    this.table = new Map<string, number>();
  }

  addEntry(symbol: string, address: number) {
    this.table.set(symbol, address);
  }

  contains(symbol: string) {
    return this.table.has(symbol);
  }

  getAddress(symbol: string): number {
    const result = this.table.get(symbol);
    if (result == null) {
      throw new Error();
    }
    return result;
  }
}
