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
    type: 'label',
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
    type: 'label',
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

t('100 PRINT ABS (-3)', [
  {
    type: 'label',
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
    type: 'label',
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
    type: 'label',
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
    type: 'label',
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
    type: 'label',
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
    type: 'label',
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
    type: 'label',
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
    type: 'label',
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
    type: 'label',
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

t('10 midx = 12', [
 {
    type: 'label',
    lexeme: 10,
  },

  {
    type: 'variable',
    lexeme: 'MIDX',
  },

  {
    type: 'operation',
    lexeme: '=',
  },

  {
    type: 'number',
    lexeme: 12,
  },
])

t('10 printx = 12', [
 {
    type: 'label',
    lexeme: 10,
  },

  {
    type: 'variable',
    lexeme: 'PRINTX',
  },

  {
    type: 'operation',
    lexeme: '=',
  },

  {
    type: 'number',
    lexeme: 12,
  },
])

t('10 printx = 12', [
 {
    type: 'label',
    lexeme: 10,
  },

  {
    type: 'variable',
    lexeme: 'PRINTX',
  },

  {
    type: 'operation',
    lexeme: '=',
  },

  {
    type: 'number',
    lexeme: 12,
  },
])

t('10 levelx = 12', [
 {
    type: 'label',
    lexeme: 10,
  },

  {
    type: 'variable',
    lexeme: 'LEVELX',
  },

  {
    type: 'operation',
    lexeme: '=',
  },

  {
    type: 'number',
    lexeme: 12,
  },
])

t('10 levelx = 12', [
 {
    type: 'label',
    lexeme: 10,
  },

  {
    type: 'variable',
    lexeme: 'LEVELX',
  },

  {
    type: 'operation',
    lexeme: '=',
  },

  {
    type: 'number',
    lexeme: 12,
  },
])

t('10 NOTX = 12', [
 {
    type: 'label',
    lexeme: 10,
  },

  {
    type: 'variable',
    lexeme: 'NOTX',
  },

  {
    type: 'operation',
    lexeme: '=',
  },

  {
    type: 'number',
    lexeme: 12,
  },
])

t('10 truex = 12', [
 {
    type: 'label',
    lexeme: 10,
  },

  {
    type: 'variable',
    lexeme: 'TRUEX',
  },

  {
    type: 'operation',
    lexeme: '=',
  },

  {
    type: 'number',
    lexeme: 12,
  },
])

t('10 display 10, 10', [
  {
    type: 'label',
    lexeme: 10,
  },

  {
    type: 'keyword',
    lexeme: 'DISPLAY',
  },

  {
    type: 'number',
    lexeme: 10,
  },

  {
    type: 'operation',
    lexeme: ',',
  },

  {
    type: 'number',
    lexeme: 10,
  },  
]);

t('10 print COLUMNS', [
  {
    type: 'label',
    lexeme: 10,
  },

  {
    type: 'keyword',
    lexeme: 'PRINT',
  },

  {
    type: 'constant',
    lexeme: 'COLUMNS'
  },
]);

t('10 print ROWS', [
  {
    type: 'label',
    lexeme: 10,
  },

  {
    type: 'keyword',
    lexeme: 'PRINT',
  },

  {
    type: 'constant',
    lexeme: 'ROWS'
  },
]);

t('10 play "s"', [
  {
    type: 'label',
    lexeme: 10,
  },

  {
    type: 'keyword',
    lexeme: 'PLAY',
  },

  {
    type: 'string',
    lexeme: '"s"',
  }
]);

t('10 sound "s"', [
  {
    type: 'label',
    lexeme: 10,
  },

  {
    type: 'keyword',
    lexeme: 'SOUND',
  },

  {
    type: 'string',
    lexeme: '"s"',
  }
]);

t('test: play "s"', [
  {
    type: 'label',
    lexeme: 'test',
  },
  {
    type: 'keyword',
    lexeme: 'PLAY',
  },
  {
    type: 'string',
    lexeme: '"s"',
  }
]);

t(' test : play "s"', [
  {
    type: 'label',
    lexeme: 'test',
  },
  {
    type: 'keyword',
    lexeme: 'PLAY',
  },
  {
    type: 'string',
    lexeme: '"s"',
  }
])