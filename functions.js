const Functions = {
  // Math:
  ABS(n) {
    return Math.abs(n);
  },

  COS(n) {
    return Math.cos(n);
  },

  SIN(n) {
    return Math.sin(n);
  },

  TAN(n) {
    return Math.tan(n);
  },

  EXP(n) {
    return Math.exp(n);
  },

  INT(n) {
    return Math.floor(n);
  },

  ATN(n) {
    return Math.atan(n);
  },

  LOG(n) {
    return Math.log(n);
  },

  SGN(n) {
    if (n === 0) return 0;
    if (n < 0) return -1;
    return 1;
  },

  SQR(n) {
    return Math.sqrt(n);
  },

  VAL(str) {
    const n = parseFloat(str);
    if (isNaN(n)) return 0;
    return n;
  },
  
  // Strings:
  ASC(str) {
    return str.charCodeAt(0);
  },

  LEFT(str, n) {
    return str.slice(0, n);
  },

  MID(str, start, len) {
    // len is optional
    return str.substr(start, len);
  },

  RIGHT(str, n) {
    return str.slice(n * -1);
  },

  CHR(n) {
    return String.fromCharCode(n);
  },

  STR(n) {
    return String.fromCharCode(n);
  },

  LEN(str) {
    return str.length;
  },

  SPC(n) {
    return ' '.repeat(n);
  },
};

const aliases = {
  LEFT$: 'LEFT',
  ATAN: 'ATN',
  CHR$: 'CHR',
  MID$: 'MID',
  RIGHT$: 'RIGHT',

  // Technically TAB should be relative to the current cursor position
  // but that's too hard to implement now.
  TAB: 'SPC',
};

for (const a in aliases) {
  Functions[a] = Functions[aliases[a]];
}

module.exports = Functions;