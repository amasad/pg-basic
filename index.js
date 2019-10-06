// Run tests:
const { spawnSync } = require('child_process');

const res = spawnSync('jest',  ['tokenizer'], {
  stdio: 'inherit',
});
process.exit(res.status);

const Basic = require('./basic');
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
  write: (s) => process.stdout.write(s),
  clear: () => console.log('console cleared'),
  input: (callback) => {
    setTimeout(() => callback('foo'));
  }
}
const interp = new Basic({
  console: cnsle,
  display,
  //debugLevel: 4,
});

interp.run(`
2550 IF P > 24 OR P < 0 OR Q > 24 OR Q < 0 THEN GOTO 7000
`);

// interp.run(`
// 1000 REM Fibonacci Sequence Project
// 1010 REM BASIC Math Project
// 1020 REM ------------------------ 
// 2020 REM The array F holds the Fibonacci numbers
// 2030 ARRAY F
// 2040 LET F[0] = 0
// 2050 LET F[1] = 1
// 2060 LET N = 1
// 2070 REM Compute the next Fibbonacci number
// 2080 LET F[N+1] = F[N] + F[N-1]
// 2090 LET N = N + 1
// 2100 PRINT F[N];
// 2105 PRINT ", ";
// 2110 REM Stop after printing  50 numbers
// 2120 IF N < 50 THEN GOTO 2080
// `);

// interp.run(`
// 100 PRINT "hello world"
// 200 PRINT "hello" + "world"
// 300 PRINT 2 + 2
// 400 LET X = 11
// 450 REM this shit is good
// 500 PRINT X * 2
// 600 PAUSE 1
// 700 GOTO 100
// `)

// interp.run(`
// 100 FOR I = 1 TO 10 STEP 2
// 110 PRINT I
// 115 PRINT "LOL"
// 120 NEXT I
// `)

// interp.run(`
// 100 LET X = 1
// 110 IF X = 1 THEN PRINT "LOL"
// 120 IF X = 2 THEN PRINT "WOW" ELSE PRINT "HAHA"
// 130 IF 7 * 8 = 56 THEN PRINT "Yes"
// `)

// interp.run(`
// 100 LET A = 17
// 110 GOSUB 1000
// 120 LET A = 50
// 130 GOSUB 1000
// 140 END
// 1000 PRINT A;
// 1010 PRINT " is an ";
// 1020 IF A % 2 = 0 THEN PRINT "even"; ELSE PRINT "odd";
// 1030 PRINT " number."
// 1040 RETURN
// `)

// interp.run(`
// 100 ARRAY A
// 110 LET A[4711] = "Hi!"
// 120 PRINT A[4711]
// `)

// interp.run(`
// 100 LET A = "ABC123"
// 200 PRINT LEFT(A, 3)
// 300 PRINT RIGHT(A, 3)
// `);