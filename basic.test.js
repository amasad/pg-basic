const Basic = require('./basic');

const createBasic = () => {
  const colors = {};
  const keyQueue = ['a', 'b', 'c'];
  const clickQueue = [[2, 3], [25, 24], [23, 22]];
  const display = {
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
  };

  const cnsle = {
    write: s => process.stdout.write(s),
    clear: () => console.log('console cleared'),
    input: callback => {
      setTimeout(() => callback('foo'));
    },
  };
  const interp = new Basic({
    console: cnsle,
    display,
  });

  return {
    interp,
    output: cnsle,
    display,
  }
};

test('if', async () => {
  const { interp, output } = createBasic();
  output.write = (str) => {
    if (!str.trim()) return;
    expect(str).toBe("1");
  };

  await interp.run(`
  10 if 1 then 30
  15 print "never"
  30 print "1"  
  `);
});

test('if else', async () => {
  const { interp, output } = createBasic();
  output.write = (str) => {
    if (!str.trim()) return;
    expect(str).toBe("1");
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
  `)
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
  `)
  } catch (e) {
    error = e;
  }
  expect(error.message).toMatch(/did you forget to write a for/i);
});

test('multi dimensional array', async () => {
  const { interp, output } = createBasic();
  output.write = (str) => {
    if (str.trim()) expect(str).toBe("red");
  };

  await interp.run(`
  10 array arr, 2
  20 arr[0][0] = "red"
  30 print arr[0][0]
  `);
});

test('multi dimensional array without setting', async () => {
  const { interp, output } = createBasic();
  output.write = (str) => {
    if (str.trim()) expect(str).toBe("0");
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
  output.write = (str) => {
    if (str.trim()) expect(str).toBe("red");
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
  output.write = (str) => {
    if (str.trim()) out.push(str);
  };

  await interp.run(`
  10 array a, 2
  20 a[0][0] = "red"
  30 a[10][12] = "green"
  40 a[13][1] = "yellow"
  50 draw a
  60 print color(0, 0)
  70 print color(10, 12)
  80 print color(13, 1)
  `);

  expect(out).toEqual([
    'red',
    'green',
    'yellow'
  ])
});

test('pause/print', async () => {
  const { interp, output } = createBasic();

  let t;
  output.write = (str) => {
    if (str.trim() === "start") {
      t = Date.now();
      return;
    }

    if (str.trim() === "done") {
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
  output.write = (str) => {
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
  expect(out).toEqual([
    '0: 2, 1: 3',
    '0: 25, 1: 24',
    '0: 23, 1: 22',
    '',
  ])  
});