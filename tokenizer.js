const Functions = require('./functions');

class Token {
  constructor(type, lexeme) {
    this.type = type;
    this.lexeme = lexeme;
  }

  toJSON() {
    return {
      type: this.type,
      lexeme: this.lexeme,
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
  'DRAW',
  'UNDRAW',
  'ARRAY',
  'DIM',
  'DATA',
  'READ',
  'REM',
  'PAUSE',
  'STOP',
];

const LINE = /^\s*(\d+)\s*/;
const QUOTE = /^"((\\.|[^"\\])*)"\s*/;
const KEY = new RegExp('^(' + KEYWORDS.join('|') + ')\\s*', 'i');
const FUN = new RegExp('^(' + Object.keys(Functions).join('|') + ')\\s*', 'i');
const VAR = /^([a-z][0-9]*)\$?\s*/i;
const NUM = /^([\+\-]?(\d+\.?|\.)\d*(E[\+\-]\d+)?)\s*/i;
const OP = /^(<>|>=|<=|[,\+\-\*\/%=<>\(\)\]\[])\s*/i;
const LOGIC = /^(AND|OR)\s*/i;
const LINEMOD = /^(;)\s*/i;

class Tokenizer {
  static get expressionTypes() {
    return [
      'string',
      'function',
      'operation',
      'number',
      'variable'
    ];
  }

  static get eof() {
    return eof;
  }

  static tokenizeLine(line, debug) {
    const t = new Tokenizer(line, { debug: debug });
    t.tokenize();
    return t.tokens;
  }

  constructor(stmnt, options = {}) {
    this.stmnt = stmnt;
    this.tokens = [];
    this.index = 0;
    this.tokenized = false;
    this.debug = options.debug || false;
  }

  assertTokenized() {
    if (!this.tokenized) {
      throw new Error('call tokenize first');
    }
  }

  peek(n = 0) {
    this.assertTokenized();

    if (this.index >= this.tokens.length) return eof;

    return this.tokens[this.index + n];
  }

  next() {
    this.assertTokenized();

    if (this.index >= this.tokens.length) return eof;

    return this.tokens[this.index++];
  }

  nextExpr() {
    this.assertTokenized();

    const expr = [];
    while (this.index !== this.tokens.length) {
      if (!Tokenizer.expressionTypes.includes(this.peek().type)) {
        break;
      }

      expr.push(this.next());
    }

    return expr;
  }

  tokenize() {
    const linem = this.stmnt.match(LINE);

    if (!linem) {
      throw new Error("Expected line number");
    }

    // First token is always line number.
    this.tokens.push(new Token('lineno', parseInt(linem[1])));

    this.stmnt = this.stmnt.slice(linem[0].length);

    while (this.stmnt.length) {
      const eaten = this.eatKeyword() ||
        this.eatQuote() ||
        this.eatLogic() ||
        this.eatFunction() ||
        this.eatVariable() ||
        this.eatNumber() ||
        this.eatOperation() ||
        this.eatLineMod();


      if (!eaten) {
        if (this.debug) {
          console.log("tokens", this.tokense);
        }

        throw new Error('Invalid syntax near: `' + this.stmnt + `'`);
      }

      this.stmnt = this.stmnt.slice(eaten.length);
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
        this.tokens.push(new Token('comment', this.stmnt.slice(m[0].length)));
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

module.exports = Tokenizer;