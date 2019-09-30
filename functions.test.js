const Functions = require('./functions');


test('math', () => {
  expect(Functions.ABS(-10)).toBe(10);
  expect(Functions.COS(30)).toBe(Math.cos(30));
  expect(Functions.SIN(30)).toBe(Math.sin(30));
  expect(Functions.TAN(30)).toBe(Math.tan(30));
  expect(Functions.ATAN(30)).toBe(Math.atan(30));
  expect(Functions.ATN(30)).toBe(Math.atan(30));
  expect(Functions.LOG(30)).toBe(Math.log(30));
  expect(Functions.SQR(30)).toBe(Math.sqrt(30));
  expect(Functions.EXP(30)).toBe(Math.exp(30));
  expect(Functions.SGN(10)).toBe(1);
  expect(Functions.SGN(-13)).toBe(-1);
  expect(Functions.SGN(0)).toBe(0);

  expect(Functions.VAL('13.1')).toBe(13.1);

  expect(Functions.INT(10.2)).toBe(10);
});

test('string', () => {
  expect(Functions.ASC('a')).toBe(97);

  expect(Functions.LEFT('abcdef', 3)).toBe('abc');
  expect(Functions.LEFT$('abcdef', 3)).toBe('abc');

  expect(Functions.MID('abcdef', 1, 2)).toBe('bc');
  expect(Functions.MID('abcdef', 3)).toBe('def');
  expect(Functions.MID$('abcdef', 1, 2)).toBe('bc');
  expect(Functions.MID$('abcdef', 3)).toBe('def');

  expect(Functions.RIGHT('abcdef', 3)).toBe('def');
  expect(Functions.RIGHT$('abcdef', 3)).toBe('def');

  expect(Functions.CHR(97)).toBe('a');
  expect(Functions.CHR$(97)).toBe('a');
  
  expect(Functions.LEN('foo')).toBe(3);
  expect(Functions.SPC(3)).toBe('   ');
  expect(Functions.TAB(3)).toBe('   ');
});