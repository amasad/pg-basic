## Architecture

CODE => LEX => [] Tokens => AST => Run the AST

Abstract Syntax Tree
           +
          /  \
          1  2

Basic is line-based.

AST is actually an array.

A line is an AST but a program is an array of line ASTs

1000 PRINT 100
1100 RETURN

2000 GOSUB 1000

100 PRINT "hello " + " world"

Parser will go through the tokens linearily big switch statement to consume the tokens

10  FOR I = 0 to 10
100 PRINT I
200 FOR J = 0 to 10
300 PRINT J
400 NEXT I
500 NEXT J


