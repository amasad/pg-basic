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


t('100 LET x[10] = 1', {
  type: 'LET',
  lineno: 100,
  variable: {
    lineno: 100,
    type: 'variable',
    name: 'X',
    array: true,
    subscript: "10",
  },
  expr: "1",
});

// t('100 GOTO 200', {
//   type: 'GOTO',
//   expr: {
//     type: 'literal',
//     value: 200,
//   }
// });

// t('100 GOSUB 200', {
//   type: 'GOSUB',
//   expr: {
//     type: 'literal',
//     value: 200,
//   }
// });


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


t('100 IF X = PI GOTO 7000', {
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

test('errors', () => {
  try {
    Parser.parseLine(`1000 PRINT XXX`);
    expect('').toBe('should not get here');
  } catch (e) {
    expect(e.name).toBe('ParseError');
  }
})