export class SymbolTable {
    private symbolTable: {
        class: Map<
            string,
            { type: string; kind: 'static' | 'field'; index: number }
        >;
        subroutine: Map<
            string,
            { type: string; kind: 'arg' | 'var'; index: number }
        >;
    };

    constructor() {
        this.symbolTable = { class: new Map(), subroutine: new Map() };
    }

    startSubroutine = (): void => {
        this.symbolTable.subroutine = new Map();
    };

    define = (
        name: string,
        type: string,
        kind: 'static' | 'field' | 'arg' | 'var'
    ): void => {
        const index = this.varCount(kind);
        if (kind === 'static' || kind === 'field') {
            this.symbolTable.class.set(name, { type, kind, index });
            return;
        }
        this.symbolTable.subroutine.set(name, { type, kind, index });
    };

    private varCount = (kind: 'static' | 'field' | 'arg' | 'var') => {
        if (kind === 'static' || kind === 'field') {
            return this.varCountOf(this.symbolTable.class, kind);
        }
        return this.varCountOf(this.symbolTable.subroutine, kind);
    };

    private varCountOf = (
        table: Map<
            string,
            | { type: string; kind: 'static' | 'field'; index: number }
            | { type: string; kind: 'arg' | 'var'; index: number }
        >,
        kind: string
    ): number => {
        let max = -1;
        for (let value of table.values()) {
            if (value.kind === kind && value.index > max) {
                max = value.index;
            }
        }
        return max + 1;
    };

    indentifierOf = (
        name: string
    ):
        | {
              type: string;
              kind: 'static' | 'field' | 'arg' | 'var';
              index: number;
          }
        | undefined => {
        return (
            this.symbolTable.subroutine.get(name) ||
            this.symbolTable.class.get(name)
        );
    };
}
