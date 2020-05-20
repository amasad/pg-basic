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
  constructor(lineno, name, subscripts) {
    super(lineno, 'variable');
    this.name = name;
    if (!subscripts.length) {
      this.array = false;
    } else {
      this.array = true;
      this.subscripts = subscripts;
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
      context.setArray(this.variable.name, this.variable.subscripts, value);
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

    context.write(prompt);
    context.input((value) => {      
      if (this.variable.array) {
        const sub = context.evaluate(this.variable.subscript);
        context.setArray(this.variable.name, sub, value);
      } else {
        context.set(this.variable.name, value);
      }

      // Resume.
      context.execute();
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

class TEXT extends Node {
  constructor(lineno, x, y, text, size = '12', color = '"BLACK"') {
    super(lineno, 'TEXT');
    this.x = x;
    this.y = y;
    this.text = text;
    this.size = size;
    this.color = color;
  }

  run(context) {
    context.text(
      context.evaluate(this.x),
      context.evaluate(this.y),
      context.evaluate(this.text),
      context.evaluate(this.size),
      context.evaluate(this.color),
    );
  }
}

class DRAW extends Node {
  constructor(lineno, array) {
    super(lineno, 'DRAW');
    this.array = array;
  }

  run(context) {
    context.draw(context.evaluate(this.array));
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
    } else if (this.elze) {
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
  constructor(lineno, variable, dim) {
    super(lineno, 'ARRAY');
    this.variable = variable;
    this.dim = dim;
  }

  run(context) {
    context.array(this.variable.name, context.evaluate(this.dim));
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

class DISPLAY extends Node {
  constructor(lineno, rows, cols, hasBorder = 'true') {
    super(lineno, 'DISPLAY');
    this.rows = rows;
    this.cols = cols;
    this.hasBorder = hasBorder;
  }

  run(context) {
    context.recreateDisplay({
      rows: context.evaluate(this.rows),
      columns: context.evaluate(this.cols),
      hasBorder: context.evaluate(this.hasBorder),
    })
  }
};

class SOUND extends Node {
  constructor(lineno, freq, duration = '1') {
    super(lineno, 'SOUND');
    this.lineno = lineno;
    this.frequency = freq;
    this.duration = duration;
  }

  run(context) {
    const d = context.evaluate(this.duration);
    context.sound(
      context.evaluate(this.frequency),
      d
    );

    if (typeof d === 'number' && d > 0) {
      // pause until we play sound
      context.pause(d * 1000);
    }
  }
}

class PLAY extends Node {
  constructor(lineno, note, octave = '4', duration = '1') {
    super(lineno, 'SOUND');
    this.lineno = lineno;
    this.note = note;
    this.octave = octave;
    this.duration = duration;
  }

  run(context) {
    const d = context.evaluate(this.duration);
    context.play(
      context.evaluate(this.note),
      context.evaluate(this.octave),
      d
    );

    if (typeof d === 'number' && d > 0) {
      // pause until we play sound
      context.pause(d * 1000);
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
  GOSUB,
  RETURN,
  ARRAY,
  CLS,
  CLT,
  CLC,
  TEXT,
  DRAW,
  DISPLAY,
  SOUND,
  PLAY,
  Variable,
};
