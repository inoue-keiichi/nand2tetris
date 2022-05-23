export type Symbol = typeof symbols[number];

export type TokenType = typeof tokenTypes[number];

export type KeyWord = typeof keyWords[number];

export type Token =
    | {
          type: 'no_token';
          toString: () => string;
      }
    | {
          type: 'keyword';
          keyword: KeyWord;
          toString: () => string;
      }
    | {
          type: 'symbol';
          symbol: Symbol;
          toString: () => string;
      }
    | {
          type: 'identifier';
          identifier: string;
          toString: () => string;
      }
    | {
          type: 'int_const';
          intVal: string;
          toString: () => string;
      }
    | {
          type: 'string_const';
          stringVal: string;
          toString: () => string;
      };

export function isSymbol(str: string): str is Symbol {
    return symbols.some((value) => value === str);
}

export function isTokenType(str: string): str is TokenType {
    return tokenTypes.some((value) => value === str);
}

export function isKeyWord(str: string): str is KeyWord {
    return keyWords.some((value) => value === str);
}

const symbols = [
    '{',
    '}',
    '(',
    ')',
    '[',
    ']',
    '.',
    ',',
    ';',
    '+',
    '-',
    '*',
    '/',
    '&',
    '|',
    '<',
    '>',
    '=',
    '~',
] as const;

const tokenTypes = [
    'keyword',
    'symbol',
    'identifier',
    'int_const',
    'string_const',
] as const;

const keyWords = [
    'class',
    'method',
    'function',
    'constructor',
    'int',
    'boolean',
    'char',
    'void',
    'var',
    'static',
    'field',
    'let',
    'do',
    'if',
    'else',
    'while',
    'return',
    'true',
    'false',
    'null',
    'this',
] as const;
