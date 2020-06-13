class ParseError extends Error {
  constructor(lineno, message) {
    super();
    this.message = `Parse error on line ${lineno}: ${message}`;
    this.name = 'ParseError';    
  }
}

class RuntimeError extends Error {
  constructor(pc, message) {
    super();
    const lineno = pc + 1;
    this.message = `Error on line ${lineno}: ${message}`;
    this.name = 'RuntimeError';    
  }
}

module.exports = {
  ParseError,
  RuntimeError,
};