export type VMLine = Arithmetic | MemoryAccess;

export interface Arithmetic {
    command: ArithmeticCommand;
}

export interface MemoryAccess {
    command: MemoryAccessCommand;
    segment: Segment;
    arg: string;
}

export type ArithmeticCommand = typeof arithmetic[number];

export type MemoryAccessCommand = typeof memoryAccess[number];

export type Segment = typeof segment[number];

export function isArithmetic(arg: any): arg is ArithmeticCommand {
    return arithmetic.some((e) => e === arg);
}

export function isMemoryAccess(arg: any): arg is MemoryAccessCommand {
    return memoryAccess.some((e) => e === arg);
}

export function isSegment(arg: any): arg is Segment {
    return segment.some((e) => e === arg);
}

const arithmetic = [
    'add',
    'sub',
    'neg',
    'eq',
    'gt',
    'lt',
    'and',
    'or',
    'not',
] as const;

const memoryAccess = ['pop', 'push'] as const;

const segment = [
    'local',
    'argument',
    'this',
    'that',
    'pointer',
    'temp',
    'constant',
    'static',
] as const;
