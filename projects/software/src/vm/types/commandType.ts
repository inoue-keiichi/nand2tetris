export type CommandType = NoneArg | OneArg | TwoArg | FunctionArg;

export interface NoneArg {
    command: Command;
}

export interface OneArg {
    command: ArgCommand;
    arg: string;
}

export interface TwoArg {
    command: SegmentArgCommand;
    segment: Segment;
    arg: string;
}

export interface FunctionArg {
    command: FunctionCommand;
    funcName: string;
    arg: string;
}

export type Command = typeof command[number];

export type ArgCommand = typeof argCommand[number];

export type SegmentArgCommand = typeof segmentArgCommand[number];

export type FunctionCommand = typeof functionCommand[number];

export type Segment = typeof segment[number];

export function isCommand(arg: any): arg is Command {
    return command.some((e) => e === arg);
}

export function isArgCommand(arg: any): arg is ArgCommand {
    return argCommand.some((e) => e === arg);
}

export function isSegmentArgCommand(arg: any): arg is SegmentArgCommand {
    return segmentArgCommand.some((e) => e === arg);
}

export function isFunctionCommand(arg: any): arg is FunctionCommand {
    return functionCommand.some((e) => e === arg);
}

export function isSegment(arg: any): arg is Segment {
    return segment.some((e) => e === arg);
}

export const command = [
    'add',
    'sub',
    'neg',
    'eq',
    'gt',
    'lt',
    'and',
    'or',
    'not',
    'return',
] as const;

export const argCommand = ['label', 'goto', 'if-goto'] as const;

export const segmentArgCommand = ['pop', 'push'] as const;

export const functionCommand = ['function', 'call'] as const;

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
