export type CommandType =
    | 'C_ARITHMETIC'
    | 'C_PUSH'
    | 'C_POP'
    | 'C_LABEL'
    | 'C_GOTO'
    | 'C_IF'
    | 'C_FUNCTION'
    | 'C_RETURN'
    | 'C_CALL';

export interface VMLine {
    command: string;
    segment?: string;
    arg?: string;
}

export type Segment =
    | 'local'
    | 'argument'
    | 'this'
    | 'that'
    | 'pointer'
    | 'temp'
    | 'constant'
    | 'static';

export type Command =
    | 'add'
    | 'sub'
    | 'neg'
    | 'eq'
    | 'gt'
    | 'lt'
    | 'and'
    | 'or'
    | 'not'
    | 'push'
    | 'pop'
    | 'label'
    | 'goto'
    | 'if'
    | 'function'
    | 'return'
    | 'call';
