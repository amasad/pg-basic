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
  TEXT,
  UNTEXT,
  DRAW,
  Variable,
} = require('./nodes');
const exprToJS = require('./expr');
const { ParseError } = require('./errors');


const bracketMatchers = {
  closers: {
    ')': '(',
    ']': '['
  },
  openers: {
    '(': ')',
    '[': ']'
  }
}

class Parser {
  static checkBrackets(tokenizer, lineno) {
    // Checks if brackets are matching properly
    // this is used as a pre-parse step to keep 
    // the parser simple and stateless.
    const bracketStack = [];
    let token;
    let index = tokenizer.index;
    while ((token = tokenizer.peek(index)) !== Tokenizer.eof) {
      index++;

      if (token.type !== 'operation') {
        continue;
      }

      const bracket = token.lexeme;

      if (bracketMatchers.openers[bracket]) {
        // we found an opener, push it on top of the stack
        bracketStack.push(bracket);
        continue;
      }

      const expectedOpener = bracketMatchers.closers[bracket];
      if (!expectedOpener) {
        // not a bracket
        continue;
      }

      const opener = bracketStack.pop();
      if (expectedOpener === opener) {
        // we got a legit match!
        continue;
      }


      if (!opener) {
        throw new ParseError(lineno, `Found extra closing bracket ${bracket}`);
      }

      throw new ParseError(lineno, `Unexpected bracket ${bracket}. There is an unmatched ${opener} so it is expected to see ${bracketMatchers.openers[opener]} before ${bracket}`);
    }

    if (bracketStack.length > 0) {
      throw new ParseError(lineno, `You have unmatched brackets. Make sure your brackets are balanced`);
    }
  }

  static parseLine(line) {
    const t = new Tokenizer(line);
    t.tokenize();

    const p = new Parser(t);

    return p.parse();
  }

  constructor(tokenizer) {
    this.tokenizer = tokenizer;
    this.lineno = this.getLineNo(this.tokenizer.next());
    Parser.checkBrackets(tokenizer, this.lineno);
  }

  parse() {
    let top = this.tokenizer.next();

    // If top is a variable we assume it's an assignment shorthand `x = 1`
    if (top.type !== 'keyword' && top.type === 'variable') {
      this.tokenizer.reverse();
      top = new Tokenizer.Token('keyword', 'LET');
    }

    this.assertType(top, 'keyword');

    switch (top.lexeme) {
      case 'PRINT':
        return new PRINT(
          this.lineno,
          this.expectExpr({ errStr: 'Expected value after PRINT' }),
          !!this.acceptLineMod()
        );

      case 'LET': {
        const variable = this.expectVariable();
        this.expectOperation('=');
        return new LET(
          this.lineno,
          variable,
          this.expectExpr({ errStr: 'Expected value after LET statement' })
        );
      }

      case 'REM':
        return new REM(this.lineno, this.expectComment());

      case 'PAUSE':
        return new PAUSE(
          this.lineno,
          this.expectExpr({ errStr: 'Expected value after PAUSE' })
        );

      case 'INPUT': {
        const expr = this.expectExpr({
          errStr: 'Expected prompt text after INPUT',
        });
        this.expectLineMod();
        return new INPUT(this.lineno, expr, this.expectVariable());
      }

      case 'FOR': {
        const variable = this.expectVariable();
        this.expectOperation('=');
        const frm = this.expectExpr({
          errStr: 'Expected value assigned to FOR variable',
        });
        this.expectKeyword('TO');
        const to = this.expectExpr({ errStr: 'Expected value after TO' });
        const step = this.acceptKeyword('STEP')
          ? this.expectExpr({ errStr: 'Expected value after STEP' })
          : null;

        return new FOR(this.lineno, variable, frm, to, step);
      }

      case 'NEXT':
        return new NEXT(this.lineno, this.expectVariable());

      case 'GOTO':
        return new GOTO(
          this.lineno,
          this.expectExpr({ errStr: 'Expected a value after GOTO' })
        );

      case 'END':
        return new END(this.lineno);

      case 'IF':
        const cond = this.expectExpr({
          errStr: 'Expected a condition after IF',
        });
        this.expectKeyword('THEN');

        let then;
        // Shortcut: number is interpreted as goto statement.
        if (this.tokenizer.peek().type === 'number') {
          then = new GOTO(this.lineno, this.expectExpr());
        } else {
          then = this.parse();
        }

        let elze = null;
        if (this.acceptKeyword('ELSE')) {
          if (this.tokenizer.peek().type === 'number') {
            elze = new GOTO(this.lineno, this.expectExpr());
          } else {
            elze = this.parse();
          }
        }

        return new IF(this.lineno, cond, then, elze);

      case 'GOSUB':
        return new GOSUB(
          this.lineno,
          this.expectExpr({ errStr: 'Expected an expression after GOSUB' })
        );

      case 'RETURN':
        return new RETURN(this.lineno);

      case 'ARRAY': {
        const vari = this.expectVariable();

        let dim = "1";
        if (this.tokenizer.peek() !== Tokenizer.eof) {
          this.expectOperation(',');
          dim = this.expectExpr({
            stopOnComma: true,
            errStr: 'Expected a value for size for TEXT'
          });
        }

        return new ARRAY(this.lineno, vari, dim);
      }

      case 'PLOT':
        const x = this.expectExpr({
          stopOnComma: true,
          errStr: 'Expected a value for the X axis after PLOT',
        });
        this.expectOperation(',');
        const y = this.expectExpr({ stopOnComma: true });
        this.expectOperation(',');
        const color = this.expectExpr({
          stopOnComma: true,
          errStr: 'Expected a value for color after PLOT X, Y,',
        });

        return new PLOT(this.lineno, x, y, color);

      case 'TEXT': {
        const x = this.expectExpr({
          stopOnComma: true,
          errStr: 'Expected a value for the X axis for TEXT',
        });
        this.expectOperation(',');

        const y = this.expectExpr({
          stopOnComma: true,
          errStr: 'Expected a value for Y axis for TEXT'
        });
        this.expectOperation(',');

        const text = this.expectExpr({
          stopOnComma: true,
          errStr: 'Expected a text value for TEXT'
        });

        let size, color;
        if (this.tokenizer.peek() !== Tokenizer.eof) {
          this.expectOperation(',');
          size = this.expectExpr({
            stopOnComma: true,
            errStr: 'Expected a value for size for TEXT'
          });
          if (this.tokenizer.peek() !== Tokenizer.eof) {
            this.expectOperation(',');
            color = this.expectExpr({
              stopOnComma: true,
              errStr: 'Expected a value for color for TEXT',
            });
          }
        }

        return new TEXT(this.lineno, x, y, text, size, color);
      }

      case 'UNTEXT': {
        const x = this.expectExpr({
          stopOnComma: true,
          errStr: 'Expected a value for the X axis for TEXT',
        });
        this.expectOperation(',');

        const y = this.expectExpr({
          stopOnComma: true,
          errStr: 'Expected a value for Y axis for TEXT'
        });

        return new UNTEXT(this.lineno, x, y);
      }

      case 'DRAW': {
        const array = this.expectExpr({          
          errStr: 'Draw requires an array',
        });       

        return new DRAW(this.lineno, array);
      }

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
    const t = this.tokenizer.peek();
    if (t.type === 'keyword') {
      if (t.lexeme !== keyword) {
        throw new ParseError(this.lineno, `Expected ${keyword} got ${t.lexeme}`);
      }

      return this.tokenizer.next();
    }

    return null;
  }

  expectKeyword(keyword) {
    const t = this.acceptKeyword(keyword);
    if (t == null) {
      const token = this.tokenizer.peek();
      const butGot = token.type === 'eof' ? 'end of line' : token.lexeme || token.type;
      throw new ParseError(this.lineno, `Expected ${keyword} but got ${butGot}`);
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
    this.assertType(t, 'operation', op);
    if (t.lexeme !== op) {
      throw new ParseError(this.lineno, 'Expected operation ' + op);
    }
    return t.lexeme;
  }

  expectVariable() {
    const t = this.tokenizer.next();
    this.assertType(t, 'variable');
    return new Variable(this.lineno, t.lexeme, this.acceptSubscript());
  }

  expectExpr({ stopOnComma = false, errStr = 'Expected expression' } = {}) {
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

      if (t.lexeme === ']' || t.lexeme === ')') {
        brackets--;
      }

      // Multiple variables in a row usually means users are trying
      // to use multi-letter variables
      if (
        expr[expr.length - 1] &&
        t.type === 'variable' &&
        expr[expr.length - 1].type === 'variable'
      ) {
        throw new ParseError(this.lineno, 'Variables should be single letter');
      }

      expr.push(t);
    }

    if (expr.length === 0) {
      throw new ParseError(this.lineno, errStr);
    }

    return exprToJS(expr);
  }

  expectLineMod() {
    const linemod = this.acceptLineMod();
    this.assertType(linemod || this.tokenizer.peek(), 'linemod', '";"');

    return true;
  }

  acceptLineMod() {
    if (this.tokenizer.peek().type === 'linemod') {
      return this.tokenizer.next();
    }

    return null;
  }

  acceptSubscript() {
    const exprs = [];

    while (this.tokenizer.peek().lexeme === '[') {
      this.assertType(this.tokenizer.next(), 'operation', '[');
      exprs.push(
        this.expectExpr({ errStr: 'Expected expression after [' })
      );
      this.assertType(this.tokenizer.next(), 'operation', ']');
    }

    return exprs;
  }

  assertType(token, expected, value = null) {
    const getAfter = () => {
      const tokenIndex =
        token.type === 'eof'
          ? this.tokenizer.tokens.length
          : this.tokenizer.tokens.findIndex((t) => t === token);
      const prevIndex = tokenIndex - 1;
      if (prevIndex < 0) {
        return '';
      }

      const prevToken = this.tokenizer.tokens[prevIndex];
      if (!prevToken.lexeme) {
        return '';
      }

      return ` after ${prevToken.lexeme}`;
    };

    if (value != null && token.lexeme !== value) {
      // make eof errors nicer
      const butGot = token.type === 'eof' ? 'end of line' : token.lexeme || token.type;
      throw new ParseError(
        this.lineno,
        `Expected a ${value}${getAfter()} but got a ${butGot}`
      );
    }

    if (token.type !== expected) {
      // make eof errors nicer
      const butGot = token.type === 'eof' ? 'end of line' : token.type;
      throw new ParseError(
        this.lineno,
        `Expected a ${expected}${getAfter()} but got a ${butGot} instead 😕`
      );
    }
  }

  getLineNo(token) {
    this.assertType(token, 'lineno');

    if (typeof token.lexeme !== 'number') {
      throw new ParseError(this.lineno, 'Lines should start with line numbers');
    }

    return token.lexeme;
  }
}

module.exports = Parser;
