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
      const next = this.program[this.program.indexOf(this.getCurLine()) + 1];

      if (!next) {
        if (this.debug) {
          console.log('debug: program ended');
        }
        this.end();
        return;
      }

      this.lineno = next.lineno;

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
  }
}

module.exports = Basic;