const Tokenizer = require('./tokenizer');

test('keyword string', () => {

  const t = new Tokenizer('100 PRINT "hello"', { debug: true });
  t.tokenize();

  expect(t.next().toJSON()).toEqual({
    type: 'lineno',
    lexeme: 100,
  });

  expect(t.next().toJSON()).toEqual({
    type: 'keyword',
    lexeme: 'PRINT'
  });

  expect(t.next().toJSON()).toEqual({
    type: 'string',
    lexeme: '"hello"'
  });
});

test('function', () => {
  const t = new Tokenizer('100 PRINT ABS(-3)', { debug: true });
  t.tokenize();

  expect(t.next().toJSON()).toEqual({
    type: 'lineno',
    lexeme: 100,
  });

  expect(t.next().toJSON()).toEqual({
    type: 'keyword',
    lexeme: 'PRINT'
  });

  expect(t.next().toJSON()).toEqual({
    type: 'function',
    lexeme: 'ABS'
  });

  expect(t.next().toJSON()).toEqual({
    type: 'operation',
    lexeme: '('
  });

  expect(t.next().toJSON()).toEqual({
    type: 'number',
    lexeme: -3,
  });  

  expect(t.next().toJSON()).toEqual({
    type: 'operation',
    lexeme: ')'
  });
});

test('var', () => {
  const t = new Tokenizer('100 LET x = 1', {
    debug: true,
  })

  t.tokenize();

  expect(t.next().toJSON()).toEqual({
    type: 'lineno',
    lexeme: 100,
  });

  expect(t.next().toJSON()).toEqual({
    type: 'keyword',
    lexeme: 'LET',
  });

  expect(t.next().toJSON()).toEqual({
    type: 'variable',
    lexeme: 'X',
  });

  expect(t.next().toJSON()).toEqual({
    type: 'operation',
    lexeme: '=',
  });

  expect(t.next().toJSON()).toEqual({
    type: 'number',
    lexeme: 1,
  });
})