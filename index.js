// const Tokenizer = require('./tokenizer');

// console.log(Tokenizer.tokenizeLine('100 PRINT "hello" + " world";'));
// console.log(Tokenizer.tokenizeLine('100 PRINT ABS(1) AND 1'));

// const { spawnSync } = require('child_process');

// spawnSync('jest',  ['parser'], {
//   stdio: 'inherit',
// });
const Basic = require('./basic');

const interp = new Basic({
  output: (s) => process.stdout.write(s),
  debug: 1,
});

interp.run(`
100 PRINT "hello world"
200 PRINT "hello" + "world"
300 PRINT 2 + 2
400 LET X = 11
450 REM this shit is good
500 PRINT X * 2
600 PAUSE 1
700 GOTO 1
`)