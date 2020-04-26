const Tokenizer = require('./tokenizer');

const t = (line, arr) => {
  test(line, () => {
    const t = new Tokenizer(line, { debug: true });
    t.tokenize();
    const tokens = [];
    while (t.peek() !== Tokenizer.eof) {
      tokens.push(t.next().toJSON());
    }
    expect(tokens).toEqual(arr);
  });
};

t('100 PRINT "hello"', [
  {
    type: 'lineno',
    lexeme: 100,
  },
  {
    type: 'keyword',
    lexeme: 'PRINT'
  },
  {
    type: 'string',
    lexeme: '"hello"'
  }
]);

t('100 PRINT ABS(-3)', [
  {
    type: 'lineno',
    lexeme: 100,
  },

  {
    type: 'keyword',
    lexeme: 'PRINT'
  },

  {
    type: 'function',
    lexeme: 'ABS'
  },

  {
    type: 'operation',
    lexeme: '('
  },

  {
    type: 'operation',
    lexeme: '-'
  },

  {
    type: 'number',
    lexeme: 3,
  },

  {
    type: 'operation',
    lexeme: ')'
  },
]);


t('100 LET x = 1', [
  {
    type: 'lineno',
    lexeme: 100,
  },

  {
    type: 'keyword',
    lexeme: 'LET',
  },

  {
    type: 'variable',
    lexeme: 'X',
  },

  {
    type: 'operation',
    lexeme: '=',
  },

  {
    type: 'number',
    lexeme: 1,
  },
]);

t('100 LET X$ = 1', [
  {
    type: 'lineno',
    lexeme: 100,
  },

  {
    type: 'keyword',
    lexeme: 'LET',
  },

  {
    type: 'variable',
    lexeme: 'X$',
  },

  {
    type: 'operation',
    lexeme: '=',
  },

  {
    type: 'number',
    lexeme: 1,
  },
]);

t('100 LET XX_ = 1', [
  {
    type: 'lineno',
    lexeme: 100,
  },

  {
    type: 'keyword',
    lexeme: 'LET',
  },

  {
    type: 'variable',
    lexeme: 'XX_',
  },

  {
    type: 'operation',
    lexeme: '=',
  },

  {
    type: 'number',
    lexeme: 1,
  },
]);

t('100 LET X[N+1] = 1', [
  {
    type: 'lineno',
    lexeme: 100,
  },

  {
    type: 'keyword',
    lexeme: 'LET',
  },

  {
    type: 'variable',
    lexeme: 'X',
  },

  {
    type: 'operation',
    lexeme: '[',
  },

  {
    type: 'variable',
    lexeme: 'N',
  },

  {
    type: 'operation',
    lexeme: '+',
  },

  {
    type: 'number',
    lexeme: 1,
  },

  {
    type: 'operation',
    lexeme: ']',
  },

  {
    type: 'operation',
    lexeme: '=',
  },

  {
    type: 'number',
    lexeme: 1,
  },
]);

t('100 PRINT PI', [
  {
    type: 'lineno',
    lexeme: 100,
  },

  {
    type: 'keyword',
    lexeme: 'PRINT',
  },

  {
    type: 'constant',
    lexeme: 'PI',
  },
]);

t('10 x = true', [
  {
    type: 'lineno',
    lexeme: 10,
  },

  {
    type: 'variable',
    lexeme: 'X',
  },

  {
    type: 'operation',
    lexeme: '=',
  },

  {
    type: 'boolean',
    lexeme: 'TRUE',
  },
]);

t('10 x = false', [
  {
    type: 'lineno',
    lexeme: 10,
  },

  {
    type: 'variable',
    lexeme: 'X',
  },

  {
    type: 'operation',
    lexeme: '=',
  },

  {
    type: 'boolean',
    lexeme: 'FALSE',
  },
]);

t('10 x = not true', [
 {
    type: 'lineno',
    lexeme: 10,
  },

  {
    type: 'variable',
    lexeme: 'X',
  },

  {
    type: 'operation',
    lexeme: '=',
  },

  {
    type: 'logic',
    lexeme: 'NOT',
  },

  {
    type: 'boolean',
    lexeme: 'TRUE',
  },
])