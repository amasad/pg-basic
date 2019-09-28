function exprToJS(expr) {
  let jsExpr = '';

  while (expr.length) {
    const t = expr.shift();

    if (t.type === 'variable') {
      jsExpr += '__pgb.get("' + t.lexeme + '")';
      continue;
    }

    if (t.type === 'logic') {
      if (t.lexeme === 'AND') {
        jsExpr += '&&';
      } else if (t.lexeme === 'OR') {
        jsExpr += '||';
      }

      continue;
    }

    if (t.type === 'operation') {
      if (t.lexeme === '<>') {
        jsExpr += '!=';
        continue
      }

      if (t.lexeme === '=') {
        jsExpr += '==';
        continue;
      }
    }

    jsExpr += t.lexeme;
  }

  return jsExpr;
}

module.exports = exprToJS;