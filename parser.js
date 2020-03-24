const Tokenizer = require('./tokenizer');
const {
  PRINT,
  LET,
  REM,
  PAUSE,
  INPUT,
  FOR,
  NEXT,
  GOTO,
  END,
  IF,
  GOSUB,
  RETURN,
  ARRAY,
  PLOT,
  CLS,
  CLC,
  CLT,
  Variable
} = require('./nodes');
const exprToJS = require('./expr');
const { ParseError } = require('./errors');

class Parser {
  static parseLine(line) {
    const t = new Tokenizer(line, { debug: true });
    t.tokenize();

    const p = new Parser(t);

    return p.parse();
  }

  constructor(tokenizer) {
    this.tokenizer = tokenizer;
  }

  parse() {
    this.lineno = this.getLineNo(this.tokenizer.next());
    const top = this.tokenizer.next();    
    this.assertType(top, 'keyword');

    switch (top.lexeme) {
      case 'PRINT':
        return new PRINT(this.lineno, this.expectExpr(), this.acceptLineMod());

      case 'LET': {
        const variable = this.expectVariable();
        this.expectOperation('=');
        return new LET(this.lineno, variable, this.expectExpr());
      }

      case 'REM':
        return new REM(this.lineno, this.expectComment());

      case 'PAUSE':
        return new PAUSE(this.lineno, this.expectExpr());

      case 'INPUT': {
        const expr = this.expectExpr();
        this.expectLineMod();
        return new INPUT(this.lineno, expr, this.expectVariable());
      }

      case 'FOR': {
        const variable = this.expectVariable();
        this.expectOperation('=');
        const frm = this.expectExpr();
        this.expectKeyword('TO');
        const to = this.expectExpr();
        const step = this.acceptKeyword('STEP') ? this.expectExpr() : null;

        return new FOR(this.lineno, variable, frm, to, step);
      }

      case 'NEXT':
        return new NEXT(this.lineno, this.expectVariable());

      case 'GOTO':
        return new GOTO(this.lineno, this.expectExpr());

      case 'END':
        return new END(this.lineno);

      case 'IF':
        const cond = this.expectExpr();
        this.expectKeyword('THEN');

        let then;
        // Shortcut: number is interpreted as goto statement.
        if (this.tokenizer.peek().type === 'number') {
          then = new GOTO(this.lineno, this.expectExpr());
        } else {
          then = this.parse();
        }

        let elze = null;
        if (this.acceptKeyword('else')) {
          if (this.tokenizer.peek().type === 'number') {
            elze = new GOTO(this.lineno, this.expectExpr());
          } else {
            elze = this.parse();
          }
        }

        return new IF(this.lineno, cond, then, elze);

      case 'GOSUB':
        return new GOSUB(this.lineno, this.expectExpr());

      case 'RETURN':
        return new RETURN(this.lineno);

      case 'ARRAY':
        return new ARRAY(this.lineno, this.expectVariable());

      case 'PLOT':
        const x = this.expectExpr(true);
        this.expectOperation(',');
        const y = this.expectExpr(true);
        this.expectOperation(',');
        const color = this.expectExpr(true);

        return new PLOT(this.lineno, x, y, color);

      case 'CLS':
        return new CLS(this.lineno);
      case 'CLC':
        return new CLC(this.lineno);
      case 'CLT':
        return new CLT(this.lineno);
    }

    throw new ParseError(this.lineno, `Unexpected token ${top.lexeme}`);
  }

  acceptKeyword(keyword) {
    if (this.tokenizer.peek().type === 'keyword') {
      return this.tokenizer.next();
    }

    return null;
  }

  expectKeyword(keyword) {
    const t = this.acceptKeyword(keyword);
    if (t == null) {
      throw new ParseError(this.lineno, `Expected ${keyword} but got ${this.tokenizer.peek().lexeme}`);
    }

    return t.lexeme;
  }

  expectComment() {
    const t = this.tokenizer.next();

    if (t.type === 'comment') {
      this.assertType(this.tokenizer.next(), 'eof');
      return t.lexeme;
    }

    this.assertType(t, 'eof');
    return '';
  }

  expectOperation(op) {
    const t = this.tokenizer.next();
    this.assertType(t, 'operation');
    if (t.lexeme !== op) {
      throw new ParseError(this.lineno, 'Expected operation ' + op)
    }
    return t.lexeme;
  }

  expectVariable() {
    const t = this.tokenizer.next();
    this.assertType(t, 'variable');
    return new Variable(this.lineno, t.lexeme, this.acceptSubscript());
  }

  expectExpr(stopOnComma = false) {
    const expr = [];
    let brackets = 0;
    while (this.tokenizer.peek() != Tokenizer.eof) {
      if (stopOnComma && this.tokenizer.peek().lexeme === ',') {
        break;
      }

      if (!Tokenizer.expressionTypes.includes(this.tokenizer.peek().type)) {
        break;
      }

      const t = this.tokenizer.peek();

      // We might be in a subscript or function call and if we see an
      // extra paren it's not ours to eat.
      if (brackets === 0 && (t.lexeme === ']' || t.lexeme === ')')) {
        break;
      }

      this.tokenizer.next();

      if (t.lexeme === '[' || t.lexeme === '(') {
        brackets++;
      }

      if (t.lexeme === ']' || t.lexeme === ']') {
        brackets--;
      }

      expr.push(t);
    }

    if (expr.length === 0) {
      throw new ParseError(this.lineno, 'Expected expression');
    }

    return exprToJS(expr);
  }

  expectLineMod() {
    if (!this.acceptLineMod()) {
      throw new ParseError(this.lineno, 'Expected ;');
    }

    return true;
  }

  acceptLineMod() {
    if (this.tokenizer.peek().type === 'linemod') {
      this.tokenizer.next();
      return true;
    }

    return false;
  }

  acceptSubscript() {
    if (this.tokenizer.peek().lexeme !== '[') return null;

    this.assertType(this.tokenizer.next(), 'operation', '[');

    const expr = this.expectExpr();

    this.assertType(this.tokenizer.next(), 'operation', ']');

    return expr;
  }

  assertType(token, expected, value = null) {
    if (token.type !== expected) {
      throw new ParseError(this.lineno, `Expect token of type ${expected} but got ${token.type}`);
    }

    if (value != null && token.lexeme !== value) {
      throw new ParseError(this.lineno, `Expected token value to be ${value} but got ${token.lexeme}`);
    }
  }

  getLineNo(token) {
    this.assertType(token, 'lineno');

    if (typeof token.lexeme !== 'number') {
      throw new ParseError(this.lineno, 'lineno should be a number');
    }

    return token.lexeme;
  }
}


module.exports = Parser;