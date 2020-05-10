const Context = require('context-eval');
const Parser = require('./parser');
const Functions = require('./functions');
const { ParseError, RuntimeError } = require('./errors');

const MAX_STEPS = 2500;

const raf = typeof window !== 'undefined' ? requestAnimationFrame : setImmediate;

class Basic {
  constructor({ console, debugLevel, createDisplay }) {
    this.debugLevel = debugLevel;
    this.console = console;
    this.context = new Context({
      __pgb: this,
    });
    this.variables = {};
    this.lineno = -1;
    this.program = [];
    this.loops = {};
    this.stack = [];
    this.jumped = false;
    this.display = null;
    this.createDisplay = createDisplay;
    this.constants = {
      PI: Math.PI,
      LEVEL: 1,
    };
  }

  debug(str, level = 1) {
    if (this.debugLevel >= level) {
      console.log(`Debug ${this.lineno}:`, str);
    }
  }

  run(program) {    
    return new Promise((resolve, reject) => {
      if (this.createDisplay) {
        this.display = this.createDisplay();
      }
      
      this.onEnd = { resolve, reject };
      this.ended = false;
      this.program = [];

      const seen = {};
      const lines = program.split('\n').filter(l => l.trim() !== '');
      if (lines.length === 0) {
        return this.end();
      }

      let lineno = 0;
      for (let l of lines) {
        lineno++;
        let line;
        try {
          line = Parser.parseLine(l, { lineno });
        } catch (e) {
          return this.end(e);
        }

        if (seen[line.lineno]) {
          return this.end(new ParseError(line.lineno, `Line with number ${line.lineno} repeated`));
        }

        seen[line.lineno] = true;
        this.program.push(line);
      }

      this.lineno = this.program[0].lineno;

      this.execute();
    });
  }

  execute() {
    if (this.ended) return;

    this.halted = false;
    for (let i = 0; i < MAX_STEPS; i++) {
      this.step();

      if (this.ended) return;

      if (!this.jumped) {
        const next = this.getNextLine();

        if (!next) {
          return this.end();
        }

        this.lineno = next.lineno;
      } else {
        this.jumped = false;
      }

      if (this.halted) {
        return;
      }
    }

    if (!this.ended) {
      this.halt();
      setTimeout(() => this.execute());
    }
  }

  getCurLine() {
    return this.program.find(({ lineno }) => lineno === this.lineno);
  }

  getNextLine() {
    return this.program[this.program.indexOf(this.getCurLine()) + 1];
  }

  step() {
    const node = this.getCurLine();

    if (!node) {
      return this.end(
        new RuntimeError(this.lineno, `Cannot find line ${this.lineno} 🤦‍♂️`),
      );
    }

    this.debug('step', 1);
    this.debug(node.toJSON(), 2);

    try {
      node.run(this);
    } catch (e) {
      this.end(e);
    }
  }

  end(error) {
    this.ended = true;

    if (error) {
      this.debug(`program ended with error: ${error.message}`);
      this.onEnd.reject(error);
    } else {
      this.debug('program ended');
      this.onEnd.resolve();
    }
  }

  evaluate(code) {
    this.debug(`evaluating ${code}`);

    try {
      return this.context.evaluate(code);
    } catch (e) {
      // This is a terrible experience and should basically never
      // happen.
      this.end(new RuntimeError(this.lineno, `Error evaluating ${code}`))
      throw e;
    }
  }

  set(vari, value) {
    this.variables[vari] = value;
  }

  setArray(vari, subscripts, value) {
    if (!(this.variables[vari] instanceof BasicArray)) {
      return this.end(
        new RuntimeError(this.lineno, `${vari} is not an array, did you call ARRAY?`),
      );
    }

    let v = this.variables[vari];
    let dim = v.dim;

    if (subscripts.length !== dim) {
      return this.end(
        new RuntimeError(this.lineno, `${vari} is a an array of ${dim} dimensions and expects ${dim} subscripts "[x]"`)
      );
    }

    for (let i = 0; i < dim - 1; i++) {
      v = v.get(this.evaluate(subscripts[i]))
    }

    const s = this.evaluate(subscripts[subscripts.length - 1]);
    v.set(s, value);
  }

  array(name, dim) {
    this.variables[name] = new BasicArray(dim);
  }

  fun(name) {
    if (!Functions[name]) {
      return this.end(
        new RuntimeError(this.lineno, `Function ${name} does not exist ☹️`),
      );
    }

    // External functions
    switch (name.toLowerCase()) {
      case 'color':
        return this.color.bind(this);
      case 'getchar':
        return this.getChar.bind(this);
      case 'getclick':
        return this.getClick.bind(this);
    }

    // Internal utils
    return Functions[name];
  }

  get(vari) {
    return typeof this.variables[vari] === 'undefined'
      ? 0 : this.variables[vari];
  }

  getConst(constant) {
    if (this.constants.hasOwnProperty(constant)) {
      return this.constants[constant];
    }
    this.end(new RuntimeError(this.lineno, `Constant ${constant} is undefined`));
  }

  pause(millis) {
    this.debug(`pause ${millis}`);
    this.halt();
    setTimeout(() => this.execute(), millis);
  }

  goto(lineno) {
    this.debug(`goto ${lineno}`);
    this.lineno = lineno;
    this.jumped = true;
  }

  loopStart({ variable, value, increment, max }) {
    this.debug(`marking loop ${variable}`);

    this.set(variable, value);
    const next = this.getNextLine();
    if (!next) return this.end();

    this.loops[variable] = {
      variable,
      value,
      increment,
      max,
      lineno: next.lineno,
    };
  }

  loopJump(name) {
    this.debug(`jumping to loop ${name}`);

    const loop = this.loops[name];
    if (!loop) {
      return this.end(new RuntimeError(
        this.lineno,
        'No loop to return from. Did you forget to write a for?'
      ));
    }

    loop.value += loop.increment;
    this.set(loop.variable, loop.value);

    if (loop.increment > 0) {
      if (loop.value >= loop.max) return;
    } else if (loop.increment < 0) {
      if (loop.value <= loop.max) return;
    }

    this.goto(loop.lineno);
  }

  gosub(lineno) {
    const next = this.getNextLine();
    if (next) {
      this.stack.push(next.lineno);
    } else {
      this.stack.push(this.lineno + 1);
    }
    this.goto(lineno);
  }

  return() {
    if (this.stack.length === 0) {
      return this.end(
        new RuntimeError(this.lineno, `There are no function calls to return from 🤷`),
      );
    }
    const lineno = this.stack.pop();
    this.goto(lineno);
  }

  assertDisplay() {
    if (!this.display) {
      return this.end(new RuntimeError(this.lineno, 'No display found'));
    }
  }

  yield() {
    if (this.halted) {
      // We already halted (probably two consequetive prints).
      return;
    }

    this.halt();
    raf(() => this.execute());
  }

  // This doesn't yield (flush) to keep graphics fast, users need to
  // use pause to create an animation effect.
  plot(x, y, color) {
    this.assertDisplay();
    this.display.plot(x, y, color);
  }

  // This yields (flush) since it's meant to update an entire "scene"
  draw(array) {
    this.assertDisplay();

    if (!(array instanceof BasicArray) || array.dim !== 2) {
      return this.end(
        new RuntimeError(
          this.lineno,
          'DRAW requires a two dimensional array of colors'
        )
      );
    }

    this.display.draw(array.toJSON());
    this.yield();
  }

  text(x, y, text, size, color) {
    this.assertDisplay();
    this.display.text(x, y, text, size, color);
    this.yield();
  }

  color(x, y) {
    this.assertDisplay();
    return this.display.color(x, y);
  }

  clearAll() {
    this.clearConsole();
    this.clearGraphics();
    this.yield();
  }

  write(s) {
    this.console.write(s.toString());
  }

  print(s) {
    this.write(s);
    this.yield();
  }

  clearConsole() {
    this.console.clear();
    this.yield();
  }

  clearGraphics() {
    this.assertDisplay();
    this.display.clear();
    this.yield();
  }

  getChar() {
    this.assertDisplay();
    return this.display.getChar() || '';
  }

  getClick() {
    this.assertDisplay();
    const click = this.display.getClick();

    if (!click) return '';
    const arr = new BasicArray(1);
    arr.set(0, click[0]);
    arr.set(1, click[1]);
    return arr;
  }

  input(callback) {
    this.halt();
    this.console.input(callback);
  }

  halt() {
    if (this.halted) {
      // Should never happen.
      throw new Error('Basic already in halted state');
    }

    this.debug('halted');
    this.halted = true;
  }
}

class BasicArray {
  constructor(dim) {
    this.dim = dim;
    this.data = {};
  }

  set(prop, value) {
    this.data[prop] = value;
  }

  get(prop) {
    const isUndefined = typeof this.data[prop] === 'undefined';

    if (isUndefined && this.dim > 1) {
      return this.data[prop] = new BasicArray(this.dim - 1);
    }

    return isUndefined ? 0 : this.data[prop];
  }

  toString() {
    let s = '';
    for (let prop in this.data) {
      if (this.data.hasOwnProperty(prop)) {
        s += `${prop}: `;
        if (this.data[prop] instanceof BasicArray) {
          s += `[${this.data[prop]}], `;
        } else {
          s += `${this.data[prop]}, `
        }
      }
    }
    return s.replace(/,\s$/, '');
  }

  toJSON() {
    const ret = {};
    for (let prop in this.data) {
      ret[prop] = this.dim > 1
        ? this.data[prop].toJSON() : this.data[prop];
    }

    return ret;
  }
}

module.exports = Basic;
