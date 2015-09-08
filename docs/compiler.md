# Compiler

This documents the internals of the compiler.

## Development

Development on the compiler itself is straightforward since the compiler compiles itself. The current build of the compiler in JavaScript is included in the repo as `skewc.js` and is used by `make`. Here are some useful commands (see `Makefile` for a complete list):

* `make`: Build the compiler into `build/browser.js` which can be tested using `www/index.html`
* `make check`: Run various sanity checks including compiling the compiler with itself a few times
* `make test`: Run all tests using all supported language targets
* `make replace`: Replace the top-level `skewc.js` file with a newer version of itself

The core of the compiler is the `compile` method in `src/middle/compiler.sk` and is a good place to start reading for an overview of the compilation process.

## Lexing

The lexer is split into two files, `src/frontend/token.sk` and `src/frontend/lexer.sk`. It started off as a hand-written lexer but now uses [flex](http://flex.sourceforge.net/) for speed. The `src/frontend/build.py` script takes `src/frontend/flex.l` and generates `lexer.sk` by running flex and extracting the embedded magic constants and lookup tables from its output. Use `make flex` to do this from the root directory. The generated lexer source code is checked in because it changes infrequently and because it avoids requiring flex as a dependency. The output of flex is awful for a number of reasons but it's really fast.

Lexing technically requires infinite lookahead due to the generic type syntax. Like C#, angle brackets are matched using syntactic structure alone without a symbol table. When a `<` token is encountered, it's only considered the start of a parameterization expression if there's a matching `>` ahead in the token stream and the tokens in between meet certain conditions. This lookahead may sound expensive, but it's done in a single O(n) token pre-pass in `token.sk` using a stack. This means the lexer is still O(n).

Using angle brackets for generics adds the additional complexity of needing to split tokens that start with a `>`. For example, the type `Foo<Bar<T>>` should end with two `>` tokens, not one `>>` token. To maintain an O(n) bound, the lexer inserts a `null` space after every token starting with a `>` in case it needs to be split. If it didn't do that, inserting new tokens into the token stream during a split would require shifting all remaining tokens over for each split and would make the bound O(n^2). All unused null spaces are removed in the token pre-pass, so tokens coming out of the lexer are still tightly packed.

## Parsing

The hand-written parser uses recursive descent for statements and a Pratt parser for expressions. Pratt parsing support is in `src/frontend/pratt.sk` and the grammar implementation is in `src/frontend/parser.sk`. For a grammar overview, look at `createExpressionParser` for expressions and `parseStatement` for statements.

## Syntax Tree

Unlike many object-oriented syntax trees, this syntax tree just uses a single `Node` object, defined in `src/core/node.sk`. This makes syntax trees much easier to traverse and optimize. Tree traversal involves a single recursive function instead of a massive visitor object. Structure invariants are maintained by convention and runtime asserts instead of the type system. Primitive literal nodes use `Content` objects to store their constant values, defined in `src/core/content.sk`.

## Preprocessing

Before type checking begins, all parsed syntax trees are merged and preprocessed. Preprocessing is done using an order-independent, outside-in algorithm. A worklist is seeded with top-level preprocessor directives and preprocessing iterates until a fixed point is reached. Each iteration attempts to process top-level `if` directives and the constant variables they reference. Error reporting is delayed until the end since only then can unbound variables be classified as errors. Preprocessing should be pretty fast since it doesn't need to traverse into function definitions.

## Type Checking

Type checking starts by creating a symbol for each declaration, creating a scope for each block that needs one, and inserting each symbol into its enclosing scope. Each scope can both reference symbols on a type and store local symbols. For example, two adjacent namespace declarations with the same name have two separate scopes that both reference the same type.

Once all symbols and scopes are prepared, type checking is done using a single tree traversal. Type checking is made order-independent by applying it recursively. For example, resolving the body of a function may require resolving the type of a variable, which may require resolving its initializer, which may require resolving a constructor, which would then require resolving the enclosing type, which may require resolving base types, and so on:

    def foo { bar.baz }
    var bar = Bar.new
    class Bar : Baz {}
    class Baz { def baz {} }

To prevent cycles, symbol resolution is separated into an initialization phase and a resolution phase. The initialization phase resolves just enough to know the type of the symbol while the resolution phase fully resolves the symbol's contents. Using a symbol requires initializing it but not resolving it. Cycles are detected by giving each symbol three states: uninitialized, initializing, and initialized. Encountering an initializing symbol is an error. These rules ensure that `class Foo { var foo Foo }` is valid but `class Foo : Foo {}` is an error.

Limited type inference is performed using type context propagation. A type hint can optionally be provided during expression resolution and will be used to provide missing information if available. For example, type context from the variable type in `var foo List<double> = [0]` ensures that the list literal contains doubles instead of ints.
