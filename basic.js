const Context = require('context-eval');
const Parser = require('./parser');
const Functions = require('./functions');

class Basic {
  constructor({ output, debugLevel }) {
    this.debugLevel = debugLevel;
    this.print = (s) => output(s.toString());
    this.context = new Context({
      __pgb: this,
    });
    this.variables = {};
    this.lineno = -1;
    this.program = [];
    this.loops = {};
    this.stack = [];
    this.jumped = false;
  }

  debug(str, level = 1) {
    if (this.debugLevel >= level) {
      console.log(`Debug ${this.lineno}: ${str}`);
    }
  }

  run(program) {
    this.program = program.split('\n')
      .filter(l => l.trim() !== '')
      .map((l) => Parser.parseLine(l))
      .sort((a, b) => a.lineno - b.lineno);

    if (!this.program.length) return this.end();

    this.lineno = this.program[0].lineno;

    this.execute();
  }

  execute() {
    while (true) {
      this.step();

      if (this.ended) return;

      if (!this.jumped) {
        const next = this.getNextLine();

        if (!next) {
          this.end();
          return;
        }

        this.lineno = next.lineno;
      } else {
        this.jumped = false;
      }

      if (this.delay) {
        const delay = this.delay;
        this.delay = null;
        return setTimeout(() => {
          this.execute();
        }, delay * 1000)
      }
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
      throw new Error(`Cannot find line with number ${this.lineno}`);
    }

    this.debug('step', 1);
    this.debug(node.toJSON, 2);

    node.run(this);
  }

  end() {
    this.ended = true;
    this.debug('program ended');
  }

  evaluate(code) {
    return this.context.evaluate(code);
  }

  set(vari, value) {
    this.variables[vari] = value;
  }

  setArray(vari, sub, value) {
    this.variables[vari][sub] = value;
  }

  array(name) {
    this.variables[name] = {};
  }

  fun(name) {
    if (!Functions[name]) {
      throw new Error(`Function ${name} does not exist`);
    }

    return Functions[name];
  }

  get(vari) {
    return this.variables[vari];
  }

  pause(seconds) {
    this.debug(`pause ${seconds}`)
    this.delay = seconds;
  }

  goto(lineno) {
    this.debug(`goto ${lineno}`)
    this.lineno = lineno;
    this.jumped = true;
  }

  loopStart({ variable, value, increment, max }) {
    this.debug(`marking loop ${variable}`)

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
    loop.value += loop.increment;
    this.set(loop.variable, loop.value);

    if (loop.value >= loop.max) return;

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
      throw new Error('No function calls to return from');
    }
    const lineno = this.stack.pop();
    this.goto(lineno);
  }
}
module.exports = Basic;
