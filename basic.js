const Context = require('context-eval');
const Parser = require('./parser');
const Functions = require('./functions');
const { ParseError, RuntimeError } = require('./errors');

const MAX_STEPS = 2500;

const raf = typeof window !== 'undefined' ? requestAnimationFrame : setImmediate;

class Basic {
  constructor({ console, debugLevel, createDisplay, sound }) {
    this._debugLevel = debugLevel;
    this._console = console;
    this._context = new Context({
      __pgb: this,
    });
    this._variables = {};
    this._pc = 0;
    this._program = [];
    this._loops = {};
    this._stack = [];
    this._jumped = false;
    this._display = null;
    this._createDisplay = createDisplay;
    this._sound = sound;
    this._constants = {
      PI: Math.PI,
      LEVEL: 1,
      ROWS: 50,
      COLUMNS: 50,
    };
  }

  _debug(str, level = 1) {
    if (this._debugLevel >= level) {
      console.log(`Debug ${this._pc}:`, str);
    }
  }

  recreateDisplay({
    rows,
    columns,
    hasBorder,
  }) {
    if (!this._createDisplay) {
      throw new RuntimeError(this._pc, 'No display attached');
    }

    this._constants.ROWS = rows;
    this._constants.COLUMNS = columns;
    this._display = this._createDisplay({
      rows,
      columns,
      borderWidth: hasBorder ? 1 : 0,
    });
  }

  run(program) {
    return new Promise((resolve, reject) => {
      if (this._createDisplay) {
        this._display = this._createDisplay();
      }

      this.onEnd = { resolve, reject };
      this.ended = false;

      const seen = {};
      const lines = program.split('\n').map(l => l.trim() === '' ? 'REM' : l);
      
      if (lines.length === 0) {
        return this.end();
      }

      let lineno = this._pc;
      for (let l of lines) {
        // User-facing line numbers are 1-indexed
        lineno++;
        let line;
        try {
          line = Parser.parseLine(l, { lineno });
        } catch (e) {
          return this.end(e);
        }
       
        if (seen[line.lineno]) {
          console.log(`Warning: replacing line ${line.lineno}\n`);
        }

        seen[line.lineno] = true;
        this._program.push(line);
      }

      this.execute();
    });
  }

  execute() {
    if (this.ended) return;

    this.halted = false;
    for (let i = 0; i < MAX_STEPS; i++) {
      this._step();

      if (this.ended) return;

      if (!this._jumped) {
        this._pc++;
        const next = this._getCurLine();

        if (!next) {
          return this.end();
        }
      } else {
        this._jumped = false;
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

  _getCurLine() {
    return this._program[this._pc];
  }

  _step() {
    const node = this._getCurLine();

    if (!node) {
      return this.end(
        new RuntimeError(this._pc, `Cannot find line ${this._pc} 🤦‍♂️`),
      );
    }

    this._debug('step', 1);
    this._debug(node.toJSON(), 2);

    try {
      node.run(this);
    } catch (e) {
      this.end(e);
    }
  }

  end(error) {
    this.ended = true;

    if (error) {
      this._debug(`program ended with error: ${error.message}`);
      this.onEnd.reject(error);
    } else {
      this._debug('program ended');
      this.onEnd.resolve();
    }
  }

  evaluate(code) {
    this._debug(`evaluating ${code}`);

    try {
      return this._context.evaluate(code);
    } catch (e) {
      // This is a terrible experience and should basically never
      // happen.
      this.end(new RuntimeError(this._pc, `Error evaluating ${code}`))
      throw e;
    }
  }

  set(vari, value) {
    this._variables[vari] = value;
  }

  setArray(vari, subscripts, value) {
    if (!(this._variables[vari] instanceof BasicArray)) {
      return this.end(
        new RuntimeError(this._pc, `${vari} is not an array, did you call ARRAY?`),
      );
    }

    let v = this._variables[vari];
    let dim = v.dim;

    if (subscripts.length !== dim) {
      return this.end(
        new RuntimeError(this._pc, `${vari} is a an array of ${dim} dimensions and expects ${dim} subscripts "[x]"`)
      );
    }

    for (let i = 0; i < dim - 1; i++) {
      v = v.get(this.evaluate(subscripts[i]))
    }

    const s = this.evaluate(subscripts[subscripts.length - 1]);
    v.set(s, value);
  }

  array(name, dim) {
    this._variables[name] = new BasicArray(dim);
  }

  fun(name) {
    if (!Functions[name]) {
      return this.end(
        new RuntimeError(this._pc, `Function ${name} does not exist ☹️`),
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
    return typeof this._variables[vari] === 'undefined'
      ? 0 : this._variables[vari];
  }

  getConst(constant) {
    if (this._constants.hasOwnProperty(constant)) {
      return this._constants[constant];
    }
    this.end(new RuntimeError(this._pc, `Constant ${constant} is undefined`));
  }

  pause(millis) {
    this._debug(`pause ${millis}`);
    this.halt();
    setTimeout(() => this.execute(), millis);
  }

  goto(lineno) {
    this._debug(`goto ${lineno}`);
    const line = this._program.find(({ lineno: l }) => l === lineno);
    const pc = this._program.indexOf(line);
    if (pc === -1) {
      this.end(new RuntimeError(this._pc, `Cannot find line with number ${lineno}`));
      return;
    }
    this._pc = pc;
    this._jumped = true;
  }

  loopStart({ variable, value, increment, max }) {
    this._debug(`marking loop ${variable}`);

    this.set(variable, value);
    const next = this._program[this._pc + 1];
    if (!next) return this.end();

    this._loops[variable] = {
      variable,
      value,
      increment,
      max,
      lineno: next.lineno,
    };
  }

  loopJump(name) {
    this._debug(`jumping to loop ${name}`);

    const loop = this._loops[name];
    if (!loop) {
      return this.end(new RuntimeError(
        this._pc,
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
    this._stack.push(this._pc + 1);
    this.goto(lineno);
  }

  return() {
    if (this._stack.length === 0) {
      return this.end(
        new RuntimeError(this._pc, `There are no function calls to return from 🤷`),
      );
    }
    const lineno = this._stack.pop();
    this.goto(lineno);
  }

  _assertDisplay() {
    if (!this._display) {
      return this.end(new RuntimeError(this._pc, 'No display found'));
    }
  }

  _assertSound() {
    if (!this._sound) {
      return this.end(new RuntimeError(this._pc, 'No sound found'));
    }
  }

  _yield() {
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
    this._assertDisplay();
    this._display.plot(x, y, color);
  }

  // This yields (flush) since it's meant to update an entire "scene"
  draw(array) {
    this._assertDisplay();

    if (!(array instanceof BasicArray) || array.dim !== 2) {
      return this.end(
        new RuntimeError(
          this._pc,
          'DRAW requires a two dimensional array of colors'
        )
      );
    }

    this._display.draw(array.toJSON());
    this._yield();
  }

  text(x, y, text, size, color) {
    this._assertDisplay();
    this._display.text(x, y, text, size, color);
    this._yield();
  }

  sound(freq, duration) {
    this._assertSound();
    this._sound.sound(freq, duration);
  }

  play(note, octave, duration) {
    this._sound.play(note, octave, duration);
  }

  color(x, y) {
    this._assertDisplay();
    return this._display.color(x, y);
  }

  clearAll() {
    this.clearConsole();
    this.clearGraphics();
    this._yield();
  }

  write(s) {
    this._console.write(s.toString());
  }

  print(s) {
    this.write(s);
    this._yield();
  }

  clearConsole() {
    this._console.clear();
    this._yield();
  }

  clearGraphics() {
    this._assertDisplay();
    this._display.clear();
    this._yield();
  }

  getChar() {
    this._assertDisplay();
    return this._display.getChar() || '';
  }

  getClick() {
    this._assertDisplay();
    const click = this._display.getClick();

    if (!click) return '';
    const arr = new BasicArray(1);
    arr.set(0, click[0]);
    arr.set(1, click[1]);
    return arr;
  }

  input(callback) {
    this.halt();
    this._console.input(callback);
  }

  halt() {
    if (this.halted) {
      // Should never happen.
      throw new Error('Basic already in halted state');
    }

    this._debug('halted');
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
