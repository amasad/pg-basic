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
      // Todo custom error type
      throw new Error(`Line ${this.lineno}: ${message}`);
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

    if (typeof value !== 'number') {
      throw new Error('Expected pause value to be a number');
    }

    context.pause(value);
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

    context.input((value) => {
      if (this.variable.array) {
        const sub = context.evaluate(this.variable.subscript);
        context.setArray(this.variable.name, sub, value);
      } else {
        context.set(this.variable.name, value);
      }
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

    if (this.variable.array) {
      throw new Error('Cannot use variables in for');
    }

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
    context.plot(this.x, this.y, this.color);
  }
}

class END extends Node {
  run(context) {
    context.end();
  }
}

class IF extends Node {
  constructor(lineno, condition, then, other) {
    super(lineno);
    this.condition = condition;
    this.then = then;
    this.other = other;
  }

  run(context) {        
    if (context.evaluate(this.condition)) {
      this.then.run(context);      
    } else if (this.other) {
      this.other.run(context);
    }
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
  Variable,
};
