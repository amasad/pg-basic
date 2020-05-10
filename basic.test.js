const Basic = require('./basic');

const createBasic = () => {
  const colors = {};
  const keyQueue = ['a', 'b', 'c'];
  const clickQueue = [[2, 3], [25, 24], [23, 22]];
  const createDisplay = () => ({
    plot(x, y, color) {
      console.log('plotting', x, y, color);
      colors[`${x}${y}`] = color;
    },

    draw(table) {
      for (let i in table) {
        for (let j in table[i]) {
          colors[`${i}${j}`] = table[i][j];
        }
      }
    },

    color(x, y) {
      return colors[`${x}${y}`];
    },

    clear() {
      console.log('display cleared');
    },

    getChar() {
      return keyQueue.shift();
    },

    getClick() {
      return clickQueue.shift();
    }
  });

  const cnsle = {
    write: s => process.stdout.write(s),
    clear: () => console.log('console cleared'),
    input: callback => {
      setTimeout(() => callback('foo'), 100);
    }
  };

  const interp = new Basic({
    console: cnsle,
    createDisplay,
  });

  return {
    interp,
    output: cnsle,
  };
};

test('no line numbers', async () => {
  const { interp, output } = createBasic();
  output.write = str => {
    if (!str.trim()) return;
    expect(str).toBe('1');
  };

  await interp.run(`
print 1
end
`);
});

test('optional line numbers', async () => {
  const { interp, output } = createBasic();
  let i = 0;
  output.write = str => {
    if (!str.trim()) return;
    if (!i) {
      expect(str).toBe('1');
    } else {
      expect(str).toBe('2')
    }
    i++;
  };

  await interp.run(`
goto 1000
print "never"
2000 print 2
end
1000 print 1
goto 2000
end
`);
});

test('line numbers on their own', async () => {
  const { interp, output } = createBasic();
  let i = 0;
  output.write = str => {
    if (!str.trim()) return;
    if (!i) {
      expect(str).toBe('1');
    } else {
      expect(str).toBe('2')
    }
    i++;
  };

  await interp.run(`
goto 1000
print "never"
2000 
print 2
end
1000
print 1
goto 2000
end
`);
});

test('if', async () => {
  const { interp, output } = createBasic();
  output.write = str => {
    if (!str.trim()) return;
    expect(str).toBe('1');
  };

  await interp.run(`
  if 1 then 30
  15 print "never"
  30 print "1"  
  `);
});

test('if else', async () => {
  const { interp, output } = createBasic();
  output.write = str => {
    if (!str.trim()) return;
    expect(str).toBe('1');
  };

  await interp.run(`
  10 if 0 then 20 else 30
  20 print "never"
  30 print "1"  
  `);
});

test('js runtime errors w/ line numbers', async () => {
  const { interp } = createBasic();

  let error;
  try {
    await interp.run(`
  10 let a = a()
  `);
  } catch (e) {
    error = e;
  }
  expect(error.message).toMatch(/Error on line/);
});

test('next without for should give a good error', async () => {
  const { interp } = createBasic();

  let error;
  try {
    await interp.run(`
      10 next i
  `);
  } catch (e) {
    error = e;
  }
  expect(error.message).toMatch(/did you forget to write a for/i);
});

test('multi dimensional array', async () => {
  const { interp, output } = createBasic();
  output.write = str => {
    if (str.trim()) expect(str).toBe('red');
  };

  await interp.run(`
  10 array arr, 2
  20 arr[0][0] = "red"
  30 print arr[0][0]
  `);
});

test('multi dimensional array without setting', async () => {
  const { interp, output } = createBasic();
  output.write = str => {
    if (str.trim()) expect(str).toBe('0');
  };

  await interp.run(`
  10 array arr, 2  
  30 print arr[0][0]
  `);
});

test('error on mismatching dimensionality', async () => {
  const { interp } = createBasic();

  let error;

  try {
    await interp.run(`
  10 array arr, 4
  20 arr[0][0] = "red"  
  `);
  } catch (e) {
    error = e;
  }

  expect(error.message).toMatch(/array of 4 dimensions/i);
});

test('multi multi dimensional array', async () => {
  const { interp, output } = createBasic();
  output.write = str => {
    if (str.trim()) expect(str).toBe('red');
  };

  await interp.run(`
  10 array arr, 4
  20 arr[0][0][0][0] = "red"
  30 print arr[0][0][0][0]
  `);
});

test('draw', async () => {
  const { interp, output } = createBasic();

  let out = [];
  output.write = str => {
    if (str.trim()) out.push(str);
  };

  await interp.run(`
   array a, 2
   a[0][0] = "red"
   a[10][12] = "green"
   a[13][1] = "yellow"
  50 draw a
   print color(0, 0)
   print color(10, 12)
  30 print color(13, 1)
  `);

  expect(out).toEqual(['red', 'green', 'yellow']);
});

test('pause/print', async () => {
  const { interp, output } = createBasic();

  let t;
  output.write = str => {
    if (str.trim() === 'start') {
      t = Date.now();
      return;
    }

    if (str.trim() === 'done') {
      expect(Date.now() - t).toBeGreaterThanOrEqual(100);
    }
  };

  await interp.run(`
  10 print "start"
  20 pause 100
  30 print "done"
  `);

  expect(t).toBeTruthy();
});

test('getclick', async () => {
  const { interp, output } = createBasic();

  let out = [];
  output.write = str => {
    if (str !== '\n') {
      out.push(str);
    }
  };

  await interp.run(`
  10 print GETCLICK()
  20 print GETCLICK()
  30 print GETCLICK()
  40 print GETCLICK()
  `);
  expect(out).toEqual(['0: 2, 1: 3', '0: 25, 1: 24', '0: 23, 1: 22', '']);
});

test('input', async () => {
  const { interp, output } = createBasic();

  let out = [];
  output.write = str => {
    if (str !== '\n') {
      out.push(str);
    }
  };

  await interp.run(`
  10 INPUT "name?"; N
  20 PRINT "hello, " + N
  `);
  expect(out).toEqual(['name?', 'hello, foo']);
});

test('bools', async () => {
  const { interp, output } = createBasic();
  let out = [];
  output.write = str => {
    if (str !== '\n') {
      out.push(str);
    }
  };

  await interp.run(`
x = true
if x then print "ok"
if x = true then print "ok2"
if x = false then print "no" else print "ok3"
y = false
if y = false then print "ok4"`);

  expect(out).toEqual(['ok', 'ok2', 'ok3', 'ok4']);
});

test('not', async () => {
  const { interp, output } = createBasic();
  let out = [];
  output.write = str => {
    if (str !== '\n') {
      out.push(str);
    }
  };

  await interp.run(`
x = false
if not x then print "ok"
if x = not true then print "ok2"
if not x = true then print "ok3"`);

  expect(out).toEqual(['ok', 'ok2', 'ok3']);
});

test('display', async () => {
  const { interp, output } = createBasic();
  let out = [];
  output.write = str => {
    if (str !== '\n') {
      out.push(str);
    }
  };

  await interp.run(`
print ROWS
print COLUMNS
DISPLAY 10, 10
print ROWS
print COLUMNS
`);

  expect(out).toEqual(['50', '50', '10', '10']);
});

