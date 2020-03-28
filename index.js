// To build hit up https://bundle-repl.amasad.repl.co/bundle/@amasad/pg-basic

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
  write: s => process.stdout.write(s),
  clear: () => console.log('console cleared'),
  input: callback => {
    setTimeout(() => callback('foo'));
  },
};
const interp = new Basic({
  console: cnsle,
  display,
  debugLevel: 99,
});

interp
  .run(
    `
100 for i = 1 to 1 step -1
200 print i
300 next i
`,
  )
  .then(
    () => {
      console.log('done');
    },
    err => {
      console.error('error:');
      console.error(err);
    },
  );

// interp.run(`
// 1000 REM Snake and Dots
// 1010 REM Quite BASIC Game Project
// 1020 REM ------------------------
// 1030 CLS
// 1040 PRINT  "=== Snake and Dots ==="
// 1050 PRINT "UP: W"
// 1060 PRINT "DOWN: Z"
// 1070 PRINT "LEFT: A"
// 1080 PRINT "RIGHT: S"
// 2000 REM The array G holds one entry for each pixel
// 2010 REM (X, Y) maps to G[X + Y*25]
// 2020 REM A non-zero value in G means either the snake occupies the pixel or there is a dot on the pixel
// 2030 REM A dot is encoded by the value 5
// 2040 REM If the snake occupies the pixel, the value in G indicates the directionof the snakes motion
// 2050 REM 1=up, 2=down, 3=left, 4=right
// 2060 REM The Subroutines 9100, 9200, 9300, 9400 can be selected by adding 100 * D + 9000, where D is one of the directions 1, 2, 3, or 4
// 2070 ARRAY G
// 2080 REM === Initialize ===
// 2090 LET P = 12
// 2100 LET Q = 12
// 2110 LET G[P + Q *25] = 1
// 2120 PLOT P, Q, "green"
// 2130 LET R = 12
// 2140 LET S = 11
// 2150 LET G[R + S *25] = 1
// 2160 PLOT R, S, "green"
// 2170 LET G[20 + 20*25] = 5
// 2180 PLOT 20,20, "orange"
// 2300 REM === Keyboard input ===
// 2310 LET C = UPPERCASE(GETCHAR())
// 2320 IF C = "W" THEN LET G[P + Q *25] = 1
// 2330 IF C = "Z" THEN LET G[P + Q *25] = 2
// 2340 IF C = "A" THEN LET G[P + Q *25] = 3
// 2350 IF C = "S" THEN LET G[P + Q *25] = 4
// 2500 REM === Move the snake ===
// 2510 LET D = G[P + Q *25]
// 2520 GOSUB 9000 + 100*G[P + Q *25]
// 2530 LET P = P + U
// 2540 LET Q = Q + V
// 2550 IF P > 24 OR P < 0 OR Q > 24 OR Q < 0 THEN GOTO 7000
// 2560 IF G[P + Q *25] THEN GOTO 3000
// 2570 LET G[P + Q *25] = D
// 2580 PLOT P, Q, "green"
// 2590 LET D = G[R + S *25]
// 2600 GOSUB 9000 + 100*G[R + S *25]
// 2610 LET G[R + S *25] = 0
// 2620 PLOT R, S, "gray"
// 2630 LET R = R + U
// 2640 LET S = S + V
// 2650 PAUSE (5 - LEVEL) * 75 + 50
// 2660 GOTO 2300
// 3000 REM Collision detection
// 3010 IF G[P + Q *25] <= 4 THEN GOTO 7000
// 3020 LET F = F + 1
// 3030 CLT
// 3040 PRINT "=== Snake and Dots ==="
// 3050 PRINT "Score: " + F
// 3060 LET G[P + Q *25] = D
// 3070 PLOT P, Q, "green"
// 3080 REM Add a new dot
// 3090 LET A = FLOOR(RAND(24))
// 3100 LET B = FLOOR(RAND(24))
// 3110 IF G[A + B *25] THEN GOTO 3060
// 3120 PLOT A, B, "orange"
// 3130 LET G[A + B *25] = 5
// 3140 GOTO 2320
// 7000 REM === Game Over ===
// 7010 CLT
// 7012 PRINT  "=== Snake and Dots ==="
// 7020 PRINT  "      Game Over"
// 7030 PRINT "Total score: " + F
// 7040 IF F < 5 THEN PRINT "- Ouch!"
// 7050 IF F >= 5 AND F < 15 THEN PRINT "- Nice Try!"
// 7060 IF F >= 15 AND F < 50 THEN PRINT "- Way to go!"
// 7070 IF F >= 50 AND F < 250 THEN PRINT "- Great score!"
// 7080 IF F >= 250 THEN PRINT "-- Amazing score!"
// 7090 PRINT  "====================="
// 7100 END
// 9000 REM Subroutines mapping the direction number in D (1, 2, 3, or 4) to a vector (U, V)
// 9100 LET U = 0
// 9110 LET V = 1
// 9120 RETURN
// 9200 LET U = 0
// 9210 LET V = -1
// 9220 RETURN
// 9300 LET U = -1
// 9310 LET V = 0
// 9320 RETURN
// 9400 LET U = 1
// 9410 LET V = 0
// 9420 RETURN
// `).then(() => {
//   console.log('done')
// }, error => {
//   console.error(error.stack);
// });

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
