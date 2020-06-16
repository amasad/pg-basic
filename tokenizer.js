const Functions = require('./functions');
const { ParseError } = require('./errors');

class Token {
  constructor(type, lexeme) {
    this.type = type;
    this.lexeme = lexeme;
  }

  toJSON() {
    return {
      type: this.type,
      lexeme: this.lexeme
    };
  }
}

const eof = new Token('eof', '');

const KEYWORDS = [
  'IF',
  'THEN',
  'ELSE',
  'FOR',
  'ON',
  'TO',
  'STEP',
  'GOTO',
  'GOSUB',
  'RETURN',
  'NEXT',
  'INPUT',
  'LET',
  'CLC',
  'CLT',
  'CLS',
  'END',
  'PRINT',
  'PLOT',
  'TEXT',  
  'DRAW',
  'UNDRAW',
  'ARRAY',
  'DIM',
  'DATA',
  'READ',
  'REM',
  'PAUSE',
  'STOP',
  'DISPLAY',
  'PLAY',
  'SOUND',
];

const CONSTANTS = ['LEVEL', 'PI', 'COLUMNS', 'ROWS'];

const LINE = /^\s*(\d+)\s*/;
const LABEL = /^\s*([a-z][\w]*)\s*:\s*/i;
const QUOTE = /^"((\\.|[^"\\])*)"\s*/;
const KEY = new RegExp('^(' + KEYWORDS.join('|') + ')\\b', 'i');
const FUN = new RegExp('^(' + Object.keys(Functions).join('|') + ')\\b', 'i');
const CONST = new RegExp('^(' + CONSTANTS.join('|') + ')\\b', 'i');
const VAR = /^([a-z][\w$]*)\s*/i;
const NUM = /^(\d+(\.\d+)?)\s*/i;
const OP = /^(<>|>=|<=|[,\+\-\*\/%=<>\(\)\]\[])\s*/i;
const LOGIC = /^(AND|OR|NOT)\b/i;
const BOOL = /^(true|false)\b/i;
const LINEMOD = /^(;)\s*/i;

class Tokenizer {
  static get expressionTypes() {
    return [
      'string',
      'function',
      'operation',
      'number',
      'variable',
      'logic',
      'constant',
      'boolean'
    ];
  }

  static get eof() {
    return eof;
  }

  static tokenizeLine(line) {
    const t = new Tokenizer(line);
    t.tokenize();
    return t.tokens;
  }

  constructor(stmnt, options = {}) {
    this.stmnt = stmnt.trim();
    this.tokens = [];
    this.index = 0;
    this.tokenized = false;
    this.lineno = options.lineno || -1;
  }

  assertTokenized() {
    if (!this.tokenized) {
      throw new ParseError(this.lineno, 'Call tokenize() first');
    }
  }

  peek(n = 0) {
    this.assertTokenized();

    if (this.index + n >= this.tokens.length) return eof;

    return this.tokens[this.index + n];
  }

  next() {
    this.assertTokenized();

    if (this.index >= this.tokens.length) return eof;

    return this.tokens[this.index++];
  }

  reverse() {
    if (this.index === 0) return 0;
    return --this.index;
  }

  tokenize() {
    const linem = this.stmnt.match(LINE);
    const labelm = this.stmnt.match(LABEL);

    if (linem) {
      const label = parseInt(linem[1]);
      this.tokens.push(new Token('label', label));
      this.stmnt = this.stmnt.slice(linem[0].length);
    } else if (labelm) {
      this.tokens.push(new Token('label', labelm[1]));
      this.stmnt = this.stmnt.slice(labelm[0].length);
    }

    while (this.stmnt.length) {
      const eaten =
        this.eatKeyword() ||
        this.eatQuote() ||
        this.eatLogic() ||
        this.eatFunction() ||
        this.eatConstant() ||
        this.eatBoolean() ||
        this.eatVariable() ||
        this.eatNumber() ||
        this.eatOperation() ||
        this.eatLineMod();

      if (!eaten) {
        throw new ParseError(
          this.lineno,
          `Invalid syntax near: '${this.stmnt}'`
        );
      }

      this.stmnt = this.stmnt.slice(eaten.length).trim();
    }

    this.tokenized = true;
  }

  eatLogic() {
    const m = this.stmnt.match(LOGIC);
    if (m && m[0]) {
      const keyword = m[1].toUpperCase();
      this.tokens.push(new Token('logic', keyword));
      return m[0];
    }
    return null;
  }

  eatKeyword() {
    const m = this.stmnt.match(KEY);
    if (m && m[0]) {
      const keyword = m[1].toUpperCase();
      this.tokens.push(new Token('keyword', keyword));

      // If the keyword is a comment then eat it up.
      if (keyword === 'REM') {
        this.tokens.push(new Token('comment', this.stmnt.slice(m[0].length).trim()));
        return this.stmnt;
      }

      return m[0];
    }
    return null;
  }

  eatFunction() {
    const m = this.stmnt.match(FUN);
    if (m && m[0]) {
      const fun = m[1].toUpperCase();
      this.tokens.push(new Token('function', fun));
      return m[0];
    }
    return null;
  }

  eatConstant() {
    const m = this.stmnt.match(CONST);
    if (m && m[0]) {
      const fun = m[1].toUpperCase();
      this.tokens.push(new Token('constant', fun));
      return m[0];
    }
    return null;
  }

  eatBoolean() {
    const m = this.stmnt.match(BOOL);
    if (m && m[0]) {
      const bool = m[1].toUpperCase();
      this.tokens.push(new Token('boolean', bool));
      return m[0];
    }
    return null;
  }

  eatVariable() {
    const m = this.stmnt.match(VAR);
    if (m && m[0]) {
      const variable = m[1].toUpperCase();
      this.tokens.push(new Token('variable', variable));
      return m[0];
    }
    return null;
  }

  eatNumber() {
    const m = this.stmnt.match(NUM);
    if (m && m[0]) {
      const num = parseFloat(m[1], 10);
      if (isNaN(num)) {
        throw new ParseError(this.lineno, `Error parsing number: ${m[1]}`);
      }
      this.tokens.push(new Token('number', num));
      return m[0];
    }
    return null;
  }

  eatOperation() {
    const m = this.stmnt.match(OP);
    if (m && m[0]) {
      this.tokens.push(new Token('operation', m[1]));
      return m[0];
    }
    return null;
  }

  eatQuote() {
    const m = this.stmnt.match(QUOTE);
    if (m && m[0]) {
      this.tokens.push(new Token('string', `"${m[1]}"`));
      return m[0];
    }
    return null;
  }

  eatLineMod() {
    const m = this.stmnt.match(LINEMOD);
    if (m && m[0]) {
      this.tokens.push(new Token('linemod', `"${m[1]}"`));
      return m[0];
    }
    return null;
  }
}

Tokenizer.Token = Token;
module.exports = Tokenizer;
