const Context = require('context-eval');
const Parser = require('./parser');

class Basic {
  constructor({ output, debug }) {
    this.debug = debug;
    this.print = (s) => output(s.toString())
    this.context = new Context({
      __pgb: this,
    });
    this.variables = {};
    this.lineno = -1;
    this.program = [];
    this.loops = {};
    this.jumped = false;
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

      if (!this.jumped) {
        const next = this.getNextLine();

        if (!next) {
          if (this.debug) {
            console.log('debug: program ended');
          }
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
    if (this.debug) {
      console.log(`debug: executing line ${this.lineno}`);
      if (this.debug > 1) console.log(node.toJSON());
    }

    node.run(this);
  }

  end() {

  }

  evaluate(code) {
    return this.context.evaluate(code);
  }

  set(vari, value) {
    this.variables[vari] = value;
  }

  get(vari) {
    return this.variables[vari];
  }

  pause(seconds) {
    this.delay = seconds;
  }

  goto(lineno) {
    this.lineno = lineno;
    this.jumped = true;
  }

  loopStart({ variable, value, increment, max }) {
    if (this.debug) {
      console.log(`marking loop ${variable}`);
    }

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
    if (this.debug) {
      console.log(`jumping to loop ${name}`);
    }

    const loop = this.loops[name];
    loop.value += loop.increment;
    this.set(loop.variable, loop.value);

    if (loop.value >= loop.max) return;

    this.goto(loop.lineno);
  }
}

module.exports = Basic;
