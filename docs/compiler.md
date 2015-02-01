# Compiler

## Development

Development on the compiler itself is straightforward since the compiler compiles itself. The current build of the compiler in JavaScript is included in the repo as `skewc.js` and is used by `Makefile`. Here are some useful commands:

* `make live`: Build the compiler into `build/tests/live.js` which can be tested using `tests/live/index.html`
* `make check`: Run the compiler through itself a few times for a sanity check
* `make replace`: Replace the top-level `skewc.js` file with a newer version of itself
* `make test`: Run all tests under `tests/system`

## Lexing

The lexer is split into two files, `src/lexer/token.sk` and `src/lexer/lexer.sk`. It started off as a hand-written lexer but now uses [flex](http://flex.sourceforge.net/) for speed. The `src/lexer/build.py` script takes `src/lexer/flex.l` and generates `lexer.sk` by running `flex` and extracting the embedded magic constants and lookup tables from its output. The generated lexer source code is checked in because it changes infrequently and because it avoids requiring `flex` as a dependency. The output of `flex` is awful for a number of reasons but it's really fast.

Lexing technically requires infinite lookahead due to the generic type syntax. Like C#, angle brackets are matched using syntactic structure alone without a symbol table. When a `<` token is encountered, it's only considered the start of a parameterization expression if there's a matching `>` ahead in the token stream and the tokens in between meet certain conditions. This lookahead may sound expensive, but it's done in a single O(n) token pre-pass in `token.sk` using a stack. This means the lexer is still O(n).

Using angle brackets for generics adds the additional complexity of needing to split tokens that start with a `>`. For example, the type `Foo<Bar<T>>` should end with two `>` tokens, not one `>>` token. To maintain an O(n) bound, the lexer inserts a `null` space after every token starting with a `>` in case it needs to be split. If it didn't do that, inserting new tokens into the token stream during a split would require shifting all remaining tokens over for each split and would make the bound O(n^2). All unused null spaces are removed in the token pre-pass, so tokens coming out of the lexer are still tightly packed.

## Parsing

The hand-written parser uses recursive descent for statements and a Pratt parser for expressions. Pratt parsing support is in `src/parser/pratt.sk` and the grammar implementation is in `src/parser/parser.sk`. For a grammar overview, look at `createParser()` for expressions and `parseStatement()` for statements.

The parser only needs a single token of look-ahead due to the token pre-pass. The two tricky parts are parsing C-style typed declarations and cast expressions, where the type comes in front. Typed declarations are parsed using `parsePossibleTypedDeclaration()`, which parses an expression with a high precedence and then looks for an identifier immediately following it. If the identifier isn't present, it resumes expression parsing with a lower precedence instead of parsing a complete declarations. A parenthesized expression is parsed as a C-style cast if the parenthesized contents pass `looksLikeType()` and the next token could be the start of an expression.

Error recovery is accomplished by scanning forward after an error using `scanForToken()` until the next statement or the next closing token. Errors encountered while parsing an expression insert a special error node so the expression is still a valid syntax tree and the successfully parsed parts can still be type checked. Errors encountered while parsing a statement mean the statement is dropped completely.

One decision that may seem strange is that the C-style "preprocessor" is actually integrated into the grammar. This both ensures that syntax errors can't hide lurk undetected inside a dead preprocessor branch and that the syntax trees for unmodified files can be trivially cached by an interactive compiler.
