[![Run on Repl.it](https://repl.it/badge/github/amasad/pg-basic)](https://repl.it/github/amasad/pg-basic)

## Goals

* Based on Vintage/Classic Basic
* Creative programming primitives: Drawing & Sound
* Inspiration: [Vintage Basic](http://www.vintage-basic.net/downloads/Vintage_BASIC_Users_Guide.html), [Atari Microsoft Basic](http://www.atarimania.com/utility-atari-400-800-xl-xe-microsoft-basic_28097.html), and [Quite Basic](http://www.quitebasic.com/)
* Line-based interpreter: i.e. every line is a syntactally complete statement

## Architecture

- Line (string) => Lexer => [] Tokens => Parser => AST
- Expressions are precompiled to JavaScript expressions
- Runtime library `basic.js` handles execution, debugging, and context
- AST nodes run themsleves

## TODO

- Strinct expression parsing (e.g. `3 XX` should not be acceptable)
- Nonsense errors: `SQRT`, `a[0]` 
- pass rgb array to plot
- implement mouse getpos
- test/fix repl
- should round plot calls
- don't queue keys while paused

## Docs

Moved [here](https://docs.repl.it/misc/basic).