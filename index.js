// const Tokenizer = require('./tokenizer');

// console.log(Tokenizer.tokenizeLine('100 PRINT "hello" + " world";'));
// console.log(Tokenizer.tokenizeLine('100 PRINT ABS(1) AND 1'));

const { spawnSync } = require('child_process');

spawnSync('jest',  ['tokenizer'], {
  stdio: 'inherit',
});

const Basic = require('./basic');

const interp = new Basic({
  output: (s) => process.stdout.write(s),
  //debugLevel: 1,
});

// interp.run(`
// 100 PRINT "hello world"
// 200 PRINT "hello" + "world"
// 300 PRINT 2 + 2
// 400 LET X = 11
// 450 REM this shit is good
// 500 PRINT X * 2
// 600 PAUSE 1
// 700 GOTO 1
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

interp.run(`
100 LET A = "ABC123"
200 PRINT LEFT(A, 3)
300 PRINT RIGHT(A, 3)
`);