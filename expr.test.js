const exprToJs = require('./expr');
const Tokenizer = require('./tokenizer');

function toJs(str) {
  const t = Tokenizer.tokenizeLine('100 PRINT ' + str);  
  const ret = exprToJs(t.slice(2));
  console.log(t);
  console.log(ret);
  return ret;
}

test('comparison', () => {
  expect(eval(toJs('1 <> 2'))).toBe(true);
  expect(eval(toJs('2 <> 2'))).toBe(false);
  expect(eval(toJs('1 = 2'))).toBe(false);
  expect(eval(toJs('1 = 1'))).toBe(true);
});

test('arithmetic', () => {
  expect(eval(toJs('1 + 2'))).toBe(3);
  expect(eval(toJs('(10 + 1) * 2'))).toBe(22);
});

test('var', () => {
  expect(toJs('A')).toBe(`__pgb.get("A")`);
  expect(toJs('A$')).toBe(`__pgb.get("A")`);  
});
