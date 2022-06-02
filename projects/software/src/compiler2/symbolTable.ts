export class SymbolTable {
    private classHashTable: Map<
        string,
        { type: string; kind: 'static' | 'field'; index: number }
    >;
    private subroutineHashTableList: Map<
        string,
        { type: string; kind: 'arg' | 'var'; index: number }
    >[];

    constructor() {
        this.classHashTable = new Map();
        this.subroutineHashTableList = [new Map()];
    }

    startSubroutine = (): void => {
        this.subroutineHashTableList = [new Map()];
    };

    define = (
        name: string,
        type: string,
        kind: 'static' | 'field' | 'arg' | 'var'
    ): void => {
        const index = this.varCount(kind);
        if (kind === 'static' || kind === 'field') {
            this.classHashTable.set(name, { type, kind, index });
            return;
        }
        this.subroutineHashTableList[
            this.subroutineHashTableList.length - 1
        ].set(name, { type, kind, index });
    };

    private varCount = (kind: 'static' | 'field' | 'arg' | 'var') => {
        if (kind === 'static' || kind === 'field') {
            return this.varCountOf(this.classHashTable, kind);
        }
        return this.varCountOf(
            this.subroutineHashTableList[
                this.subroutineHashTableList.length - 1
            ],
            kind
        );
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
              kind: 'arg' | 'var';
              index: number;
          }
        | undefined => {
        return this.subroutineHashTableList[
            this.subroutineHashTableList.length - 1
        ].get(name);
    };
}
