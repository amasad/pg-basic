const Parser = require('./parser');

const t = (line, ast) => {
  test(line, () => {
    const root = Parser.parseLine(line);
    expect(root.toJSON()).toEqual(ast);
  });
};

t('100 PRINT "hello"', {
  type: 'PRINT',
  lineno: 100,
  newline: true,
  expr: '"hello"'
});

t('100 PRINT "hello" + " " + "world"', {
  type: 'PRINT',
  lineno: 100,
  newline: true,
  expr: '"hello"+" "+"world"',
});

t('100 PRINT "hello";', {
  type: 'PRINT',
  lineno: 100,
  newline: false,
  expr: '"hello"'
});

t('100 LET x = 1', {
  type: 'LET',
  lineno: 100,
  variable: {
    lineno: 100,
    type: 'variable',
    name: 'X',
    array: false,
  },
  expr: '1',
});

// infer let
t('100 x = 1', {
  type: 'LET',
  lineno: 100,
  variable: {
    lineno: 100,
    type: 'variable',
    name: 'X',
    array: false,
  },
  expr: '1',
});

t('100 LET x[10] = 1', {
  type: 'LET',
  lineno: 100,
  variable: {
    lineno: 100,
    type: 'variable',
    name: 'X',
    array: true,
    subscripts: ["10"],
  },
  expr: "1",
});

// infer let
t('100 x[10] = 1', {
  type: 'LET',
  lineno: 100,
  variable: {
    lineno: 100,
    type: 'variable',
    name: 'X',
    array: true,
    subscripts: ["10"],
  },
  expr: "1",
});

t('100 LET x[1][1] = 1', {
  type: 'LET',
  lineno: 100,
  variable: {
    lineno: 100,
    type: 'variable',
    name: 'X',
    array: true,
    subscripts: ["1", "1"],
  },
  expr: "1",
});

t('100 REM lol lawl', {
  type: 'REM',
  lineno: 100,
  comment: 'lol lawl',
});

t('100 REM', {
  type: 'REM',
  lineno: 100,
  comment: '',
});

t('100 PAUSE 100', {
  lineno: 100,
  type: 'PAUSE',
  expr: '100'
});

t('100 PAUSE 100 * 10', {
  lineno: 100,
  type: 'PAUSE',
  expr: '100*10'
});

t('100 INPUT "what up"; X', {
  type: 'INPUT',
  lineno: 100,
  expr: '"what up"',
  variable: {
    type: 'variable',
    name: 'X',
    array: false,
    lineno: 100,
  }
});


t('100 IF X = Y THEN GOTO 100', {
  type: 'IF',
  condition: '__pgb.get("X")==__pgb.get("Y")',
  lineno: 100,
  elze: null,
  then: {
    type: 'GOTO',
    expr: '100',
    lineno: 100,
  }
});

t('100 IF X = Y THEN GOTO 100 ELSE GOTO 200', {
  type: 'IF',
  condition: '__pgb.get("X")==__pgb.get("Y")',
  lineno: 100,
  elze: null,
  then: {
    type: 'GOTO',
    expr: '100',
    lineno: 100,
  },
  elze: {
    type: 'GOTO',
    expr: '200',
    lineno: 100,
  }
});

// Shortcut goto
t('100 IF X = Y THEN 100', {
  type: 'IF',
  condition: '__pgb.get("X")==__pgb.get("Y")',
  elze: null,
  lineno: 100,
  then: {
    type: 'GOTO',
    expr: '100',
    lineno: 100,
  },
});

t('100 IF X = Y THEN 100 ELSE 200', {
  type: 'IF',
  condition: '__pgb.get("X")==__pgb.get("Y")',
  lineno: 100,
  then: {
    type: 'GOTO',
    expr: '100',
    lineno: 100,
  },
  elze: {
    type: 'GOTO',
    expr: '200',
    lineno: 100,
  },
});

t('100 IF P > 24 OR P < 0 AND Q < 0 THEN GOTO 7000', {
  type: 'IF',
  condition: '__pgb.get("P")>24||__pgb.get("P")<0&&__pgb.get("Q")<0',
  elze: null,
  lineno: 100,
  then: {
    type: 'GOTO',
    expr: '7000',
    lineno: 100,
  },
});

t('100 IF (P > 24 OR P < 0) AND Q < 0 THEN GOTO 7000', {
  type: 'IF',
  condition: '(__pgb.get("P")>24||__pgb.get("P")<0)&&__pgb.get("Q")<0',
  elze: null,
  lineno: 100,
  then: {
    type: 'GOTO',
    expr: '7000',
    lineno: 100,
  },
});


t('100 IF X = PI THEN GOTO 7000', {
  type: 'IF',
  condition: '__pgb.get("X")==__pgb.getConst("PI")',
  elze: null,
  lineno: 100,
  then: {
    type: 'GOTO',
    expr: '7000',
    lineno: 100,
  },
});

t('100 FOR I = 0 to 10', {
  type: 'FOR',
  lineno: 100,
  variable: {
    type: 'variable',
    lineno: 100,
    array: false,
    name: 'I',
  },
  left: '0',
  right: '10',
  step: null,
});

t('99 FOR J = 0 to 10 STEP 2', {
  type: 'FOR',
  lineno: 99,
  variable: {
    array: false,
    type: 'variable',
    lineno: 99,
    name: 'J',
  },
  left: '0',
  right: '10',
  step: '2',
});

t('99 FOR J = X to 10 * 10 STEP 20 * X', {
  type: 'FOR',
  lineno: 99,
  variable: {
    type: 'variable',
    lineno: 99,
    name: 'J',
    array: false,
  },
  left: '__pgb.get("X")',
  right: '10*10',
  step: '20*__pgb.get("X")',
});

t('100 NEXT I', {
  type: 'NEXT',
  lineno: 100,
  variable: {
    type: 'variable',
    lineno: 100,
    array: false,
    name: 'I',
  },
});

t('100 PRINT COS(10)', {
  type: 'PRINT',
  lineno: 100,
  expr: '__pgb.fun("COS")(10)',
  newline: true,
});

t('100 PRINT COLOR(1, 1)', {
  type: 'PRINT',
  lineno: 100,
  expr: '__pgb.fun("COLOR")(1,1)',
  newline: true,
});

t('100 PLOT 1, 2, "RED"', {
  type: 'PLOT',
  lineno: 100,
  x: '1',
  y: '2',
  color: '"RED"'
});

t('100 TEXT 1, 2, "hello", 15, "RED"', {
  type: 'TEXT',
  lineno: 100,
  x: '1',
  y: '2',
  size: '15',
  text: '"hello"',
  color: '"RED"'
});

t('100 TEXT 1, 2, "hello"', {
  type: 'TEXT',
  lineno: 100,
  x: '1',
  y: '2',
  size: '12',
  text: '"hello"',
  color: '"BLACK"'
});

t('100 TEXT 1, 2, "hello", 13', {
  type: 'TEXT',
  lineno: 100,
  x: '1',
  y: '2',
  size: '13',
  text: '"hello"',
  color: '"BLACK"'
});

t('100 UNTEXT 1, 2', {
  type: 'UNTEXT',
  lineno: 100,
  x: '1',
  y: '2',
});

t('100 ARRAY X', {
  type: 'ARRAY',
  variable: {
    // This is silly but what it's saying is that there is no
    // subscript.
    array: false,
    lineno: 100,
    name: 'X',
    type: 'variable',
  },
  dim: "1",
  lineno: 100,
});

t('100 ARRAY X, 2', {
  type: 'ARRAY',
  variable: {
    // This is silly but what it's saying is that there is no
    // subscript.
    array: false,
    lineno: 100,
    name: 'X',
    type: 'variable',
  },
  dim: "2",
  lineno: 100,
});

const tErr = (line, errorString) => {
  test('err: ' + line, () => {
    try {
      Parser.parseLine(line);
    } catch (e) {
      expect(e.message).toBe(errorString)
      expect(e.name).toBe('ParseError');
      return;
    }

    expect('').toBe('should not get here');
  });
};
const lerr = (errorString) => `Parse error on line 1: ${errorString}`

describe('Parse errors', () => {
  describe('Bracket matching', () => {
    // extra closing
    tErr('1 PRINT (1+1', lerr('You have unmatched brackets. Make sure your brackets are balanced'));
    // umatched
    tErr('1 PRINT 1+1)', lerr('Found extra closing bracket )'));
    // out of order
    tErr('1 PRINT A[(1+1])', lerr('Unexpected bracket ]. There is an unmatched ( so it is expected to see ) before ]'));
    test('1 Ignores brackets in strings', () => {
      expect(() => Parser.parseLine('1 PRINT ("a" + ")")')).not.toThrow()
    });
  });

  describe('lineno', () => {
    tErr('PRINT "HI"', 'Parse error on line -1: Every line must start with a line number');
  });

  describe('PRINT', () => {
    tErr('1 PRINT', lerr('Expected value after PRINT'));
  });

  describe('LET', () => {
    tErr('1 LET', lerr('Expected a variable after LET but got a end of line instead 😕'));
    tErr('1 LET ""', lerr('Expected a variable after LET but got a string instead 😕'));
    tErr('1 LET X', lerr('Expected a = after X but got a end of line'));
    tErr('1 LET X =', lerr('Expected value after LET statement'));
  });

  describe('PAUSE', () => {
    tErr('1 PAUSE ', lerr('Expected value after PAUSE'));
  });

  describe('INPUT', () => {
    tErr('1 INPUT', lerr('Expected prompt text after INPUT'));
    tErr('1 INPUT "prompt text"', lerr('Expected a ";" after "prompt text" but got a end of line'));
    tErr('1 INPUT "got mod";', lerr('Expected a variable after ";" but got a end of line instead 😕'));
  });

  describe('FOR', () => {
    tErr('1 FOR "NOPE" X', lerr('Expected a variable after FOR but got a string instead 😕'));
    tErr('1 FOR I', lerr('Expected a = after I but got a end of line'));
    tErr('1 FOR I =', lerr('Expected value assigned to FOR variable'));
    tErr('1 FOR I = 1', lerr('Expected TO but got end of line'));
    tErr('1 FOR I = 1 TO ', lerr('Expected value after TO'));
    tErr('1 FOR I = 1 TO 10 STEP', lerr('Expected value after STEP'));
  });

  describe('NEXT', () => {
    tErr('1 NEXT', lerr('Expected a variable after NEXT but got a end of line instead 😕'));
  });

  describe('GOTO', () => {
    tErr('1 GOTO', lerr('Expected a value after GOTO'))
  });

  describe('END', () => {});

  describe('IF..ELSE', () => {
    tErr('1 IF', lerr('Expected a condition after IF'));
    tErr('1 IF 1<>2', lerr('Expected THEN but got end of line'));
    tErr('1 IF 1<>2 THEN', lerr('Expected a keyword after THEN but got a end of line instead 😕'));
    tErr('1 IF 1<>2 THEN PRINT 100 PRINT', lerr('Expected ELSE got PRINT'));
    tErr('1 IF 1<>2 THEN PRINT 100 ELSE', lerr('Expected a keyword after ELSE but got a end of line instead 😕'));
  });

  describe('ARRAY', () => {
    tErr('1 ARRAY 1', lerr('Expected a variable after ARRAY but got a number instead 😕'));
  });

  describe('PLOT', () => {
    tErr('1 PLOT', lerr('Expected a value for the X axis after PLOT'));
    tErr('1 PLOT 1', lerr('Expected a , after 1 but got a end of line'));
    tErr('1 PLOT 1, 2', lerr('Expected a , after 2 but got a end of line'));
    tErr('1 PLOT 1, 2,', lerr('Expected a value for color after PLOT X, Y,'));
  })
});
