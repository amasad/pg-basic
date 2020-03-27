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

## Syntax
