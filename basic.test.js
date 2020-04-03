const Basic = require('./basic');

const createBasic = () => {
  const colors = {};
  const keyQueue = ['a', 'b', 'c'];
  const display = {
    plot(x, y, color) {
      console.log('plotting', x, y, color);
      colors[`${x}${y}`] = color;
    },
    color(x, y) {
      return colors[`${x}${y}`];
    },

    clear() {
      console.log('display cleared');
    },

    getChar() {
      return keyQueue.pop();
    },
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

test('if', (done) => {
  const { interp, output } = createBasic();
  let i = 0;
  output.write = (str) => {
    expect(str).toBe("1");
    done();
  };

  interp.run(`
  10 if 1 then 30
  15 print "never"
  30 print "1"  
  `);
});

test('if else', (done) => {
  const { interp, output } = createBasic();
  let i = 0;
  output.write = (str) => {
    expect(str).toBe("1");
    done();
  };

  interp.run(`
  10 if 0 then 20 else 30
  20 print "never"
  30 print "1"  
  `);
});

test('js runtime errors w/ line numbers', async () => {
  const { interp, output } = createBasic();
  let i = 0;

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
