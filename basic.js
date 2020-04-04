const Context = require('context-eval');
const Parser = require('./parser');
const Functions = require('./functions');
const { ParseError, RuntimeError } = require('./errors');

class Basic {
  constructor({ console, debugLevel, display }) {
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
    this.display = display;
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
      this.onEnd = { resolve, reject };
      this.ended = false;
      this.program = [];

      const seen = {};
      const lines = program.split('\n').filter(l => l.trim() !== '');
      if (lines.length === 0) {
        return this.end();
      }

      for (let l of lines) {
        let line;
        try {
          line = Parser.parseLine(l);
        } catch (e) {
          return this.end(e);
        }

        if (seen[line.lineno]) {
          return this.end(new ParseError(line.lineno, `Line with number ${line.lineno} repeated`));
        }

        seen[line.lineno] = true;
        this.program.push(line);
      }

      this.program.sort((a, b) => a.lineno - b.lineno);

      this.lineno = this.program[0].lineno;

      this.execute();
    });
  }

  execute() {
    if (this.ended) return;
    
    this.halted = false;
    for (let i = 0; i < 20; i++) {
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

  setArray(vari, sub, value) {
    if (!(this.variables[vari] instanceof BasicArray)) {
      return this.end(
        new RuntimeError(this.lineno, `${vari} is not an array, did you call ARRAY?`),
      );
    }
    this.variables[vari][sub] = value;
  }

  array(name) {
    this.variables[name] = new BasicArray();
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
    }

    // Internal utils
    return Functions[name];
  }

  get(vari) {
    return this.variables[vari] || 0;
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

  plot(x, y, color) {
    this.assertDisplay();
    this.display.plot(x, y, color);

    if (typeof window !== 'undefined') {
      this.halt();
      requestAnimationFrame(() => this.execute());
    }
  }

  text(x, y, text, size, color) {    
    this.assertDisplay();
    this.display.text(x, y, text, size, color);

    if (typeof window !== 'undefined') {
      this.halt();
      requestAnimationFrame(() => this.execute());
    }
  }

  color(x, y) {
    this.assertDisplay();
    return this.display.color(x, y);
  }

  clearAll() {
    this.clearConsole();
    this.clearGraphics();
  }

  print(s) {
    this.console.write(s.toString());
  }

  clearConsole() {
    this.console.clear();
  }

  clearGraphics() {
    this.assertDisplay();
    this.display.clear();
  }

  getChar() {
    this.assertDisplay();
    return this.display.getChar() || '';
  }

  input(callback) {
    this.console.input(callback);
  }

  halt() {
    this.debug('halted');
    this.halted = true;
  }
}

class BasicArray {
  toString() {
    let s = '';
    for (let prop in this) {
      if (this.hasOwnProperty(prop)) {
        s += `${prop}, `;
      }
    }
    return s.replace(/,\s$/, '');
  }
}

module.exports = Basic;
