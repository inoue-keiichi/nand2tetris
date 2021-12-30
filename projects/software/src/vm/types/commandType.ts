export interface VMLine {
    command: Command | SegmentCommand | SegmentArgCommand;
    segment?: Segment;
    arg?: string;
}

export type Command = typeof command[number];

export type SegmentCommand = typeof segmentCommand[number];

export type SegmentArgCommand = typeof segmentArgCommand[number];

export type Segment = typeof segment[number];

export function isCommand(arg: any): arg is Command {
    return command.some((e) => e === arg);
}

export function isSegmentCommand(arg: any): arg is SegmentCommand {
    return segmentCommand.some((e) => e === arg);
}

export function isSegmentArgCommand(arg: any): arg is SegmentArgCommand {
    return segmentArgCommand.some((e) => e === arg);
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

export const segmentCommand = ['label', 'goto', 'if-goto'] as const;

export const segmentArgCommand = ['pop', 'push'] as const;

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
