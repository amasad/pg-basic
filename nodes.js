const { RuntimeError } = require('./errors');

class Node {
  constructor(lineno, type) {
    this.lineno = lineno;
    this.type = type;
  }

  toJSON() {
    const ret = {};
    Object.keys(this).forEach(k => {
      ret[k] = this[k];
    });
    return ret;
  }

  assert(truth, message) {
    if (!truth) {
      throw new RuntimeError(this.lineno, message);
    }
  }
}

class Variable extends Node {
  constructor(lineno, name, subscript) {
    super(lineno, 'variable');
    this.name = name;
    if (subscript == null) {
      this.array = false;
    } else {
      this.array = true;
      this.subscript = subscript;
    }
  }
}

class REM extends Node {
  constructor(lineno, comment) {
    super(lineno, 'REM');
    this.comment = comment;
  }

  run() {
    // noop
  }
}

class PRINT extends Node {
  constructor(lineno, expr, linemod) {
    super(lineno, 'PRINT');
    this.expr = expr;
    this.newline = !linemod;
  }

  run(context) {
    const value = context.evaluate(this.expr);
    context.print(value);

    if (this.newline) {
      context.print("\n");
    }
  }
}

class GOTO extends Node {
  constructor(lineno, expr) {
    super(lineno, 'GOTO');
    this.expr = expr;
  }

  run(context) {
    const targetno = context.evaluate(this.expr);
    this.assert(typeof targetno === 'number', 'Expected GOTO `expr` to evaluate to a number');

    context.goto(targetno);
  }
}

class LET extends Node {
  constructor(lineno, variable, expr) {
    super(lineno, 'LET');
    this.variable = variable;
    this.expr = expr;
  }

  run(context) {
    const value = context.evaluate(this.expr);

    if (this.variable.array) {
      const sub = context.evaluate(this.variable.subscript)
      context.setArray(this.variable.name, sub, value);
    } else {
      context.set(this.variable.name, value);
    }
  }
}

class PAUSE extends Node {
  constructor(lineno, expr) {
    super(lineno, 'PAUSE');
    this.expr = expr;
  }

  run(context) {
    const value = context.evaluate(this.expr);

    this.assert(typeof value === 'number', 'PAUSE value should be a number or should evaluate to one');

    context.debug(`pause ${value}`);

    const resume = context.halt();
    setTimeout(() => {
      resume();
    }, value);
  }
}

class INPUT extends Node {
  constructor(lineno, expr, variable) {
    super(lineno, 'INPUT');
    this.expr = expr;
    this.variable = variable;
  }

  run(context) {
    const prompt = context.evaluate(this.expr);

    context.print(prompt);

    // Yield.
    const resume = context.halt();
    context.input((value) => {
      if (this.variable.array) {
        const sub = context.evaluate(this.variable.subscript);
        context.setArray(this.variable.name, sub, value);
      } else {
        context.set(this.variable.name, value);
      }

      // Resume.
      resume();
    });
  }
}

class FOR extends Node {
  constructor(lineno, variable, left, right, step) {
    super(lineno, 'FOR');
    this.lineno = lineno;
    this.variable = variable;
    this.left = left;
    this.right = right;
    this.step = step;
  }

  run(context) {
    const value = context.evaluate(this.left);
    const max = context.evaluate(this.right);
    const increment = this.step ? context.evaluate(this.step) : 1;

    this.assert(!this.variable.array, 'FOR loops variables cannot be arrays');

    context.loopStart({
      variable: this.variable.name,
      value,
      max,
      increment,
    });
  }
}

class NEXT extends Node {
  constructor(lineno, variable) {
    super(lineno, 'NEXT');
    this.variable = variable;
  }

  run(context) {
    context.loopJump(this.variable.name);
  }
}

class PLOT extends Node {
  constructor(lineno, x, y, color = "black") {
    super(lineno, 'PLOT');
    this.x = x;
    this.y = y;
    this.color = color;
  }

  run(context) {
    context.plot(context.evaluate(this.x), context.evaluate(this.y), context.evaluate(this.color));
  }
}

class END extends Node {
  run(context) {
    context.end();
  }
}

class IF extends Node {
  constructor(lineno, condition, then, elze) {
    super(lineno, 'IF');
    this.condition = condition;
    this.then = then;
    this.elze = elze;
  }

  run(context) {
    if (context.evaluate(this.condition)) {
      this.then.run(context);
    } else if (this.other) {
      this.elze.run(context);
    }
  }
}

class GOSUB extends Node {
  constructor(lineno, expr) {
    super(lineno, 'GOSUB');
    this.expr = expr;
  }

  run(context) {
    const lineno = context.evaluate(this.expr);

    this.assert(typeof lineno === 'number', 'GOSUB argument should be a number');          

    context.gosub(lineno);
  }
}

class RETURN extends Node {
  run(context) {
    context.return();
  }
}

class ARRAY extends Node {
  constructor(lineno, variable) {
    super(lineno, 'ARRAY');
    this.variable = variable;
  }

  run(context) {
    context.array(this.variable.name);
  }
}

class CLS extends Node {
  run(context) {
    context.clearAll();
  }
}

class CLT extends Node {
  run(context) {
    context.clearConsole();
  }
}

class CLC extends Node {
  run(context) {
    context.clearGraphics();
  }
}

module.exports = {
  Node,
  PRINT,
  GOTO,
  LET,
  REM,
  PAUSE,
  INPUT,
  FOR,
  NEXT,
  PLOT,
  END,
  IF,
  GOSUB,
  RETURN,
  ARRAY,
  CLS,
  CLT,
  CLC,
  Variable,
};
