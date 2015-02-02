# Compiler

This documents the internals of the compiler.

## Development

Development on the compiler itself is straightforward since the compiler compiles itself. The current build of the compiler in JavaScript is included in the repo as `skewc.js` and is used by `Makefile`. Here are some useful commands:

* `make live`: Build the compiler into `build/tests/live.js` which can be tested using `tests/live/index.html`
* `make check`: Run the compiler through itself a few times for a sanity check
* `make replace`: Replace the top-level `skewc.js` file with a newer version of itself
* `make test`: Run all tests under `tests/system`

The core of the compiler is the `compile()` method in `src/compiler/compiler.sk` and is a good place to start reading for an overview of the compilation process.

## Lexing

The lexer is split into two files, `src/lexer/token.sk` and `src/lexer/lexer.sk`. It started off as a hand-written lexer but now uses [flex](http://flex.sourceforge.net/) for speed. The `src/lexer/build.py` script takes `src/lexer/flex.l` and generates `lexer.sk` by running flex and extracting the embedded magic constants and lookup tables from its output. The generated lexer source code is checked in because it changes infrequently and because it avoids requiring flex as a dependency. The output of flex is awful for a number of reasons but it's really fast.

Lexing technically requires infinite lookahead due to the generic type syntax. Like C#, angle brackets are matched using syntactic structure alone without a symbol table. When a `<` token is encountered, it's only considered the start of a parameterization expression if there's a matching `>` ahead in the token stream and the tokens in between meet certain conditions. This lookahead may sound expensive, but it's done in a single O(n) token pre-pass in `token.sk` using a stack. This means the lexer is still O(n).

Using angle brackets for generics adds the additional complexity of needing to split tokens that start with a `>`. For example, the type `Foo<Bar<T>>` should end with two `>` tokens, not one `>>` token. To maintain an O(n) bound, the lexer inserts a `null` space after every token starting with a `>` in case it needs to be split. If it didn't do that, inserting new tokens into the token stream during a split would require shifting all remaining tokens over for each split and would make the bound O(n^2). All unused null spaces are removed in the token pre-pass, so tokens coming out of the lexer are still tightly packed.

## Parsing

The hand-written parser uses recursive descent for statements and a Pratt parser for expressions. Pratt parsing support is in `src/parser/pratt.sk` and the grammar implementation is in `src/parser/parser.sk`. For a grammar overview, look at `createParser()` for expressions and `parseStatement()` for statements.

The parser only needs single token lookahead due to the token pre-pass. The two tricky parts are parsing C-style typed declarations and cast expressions, where the type comes in front. Typed declarations are parsed using `parsePossibleTypedDeclaration()`, which parses an expression with a high precedence and then looks for an identifier immediately following it. If the identifier isn't present, it resumes expression parsing with a lower precedence instead of parsing a complete declaration. A parenthesized expression is parsed as a C-style cast if the parenthesized contents pass the `looksLikeType()` check and the next token could be the start of an expression.

Error recovery is accomplished by scanning forward after an error using `scanForToken()` until a closing token or statement starting token is encountered. Errors encountered while parsing an expression insert a special error node so the expression is still a valid syntax tree and the successfully parsed parts can still be type checked. Errors encountered while parsing a statement mean the statement is dropped completely.

One decision that may seem strange is that the C-style "preprocessor" is actually integrated into the grammar. This both ensures that syntax errors can't lurk undetected inside a dead preprocessor branch and that the syntax trees for unmodified files can be trivially cached by an interactive compiler.

## Syntax Tree

Unlike many object-oriented syntax trees, this syntax tree just uses a single `Node` object. This makes syntax trees much easier to traverse and optimize. Tree traversal involves a single recursive function instead of a massive visitor object. Structure invariants are maintained by convention instead of the type system.

The definition of `Node` is split across several files with the core in `src/ast/node.sk`, getters in `src/ast/get.sk`, and factory methods in `src/ast/create.sk`. Getters and factory methods contain asserts that check invariants in debug builds. Primitive literal nodes use `Content` objects (defined in `src/ast/content.sk`) to store their constant values.

## Preprocessing

Before type checking begins, all parsed syntax trees are merged and preprocessed. Preprocessing is done using an order-independent, outside-in algorithm. A worklist is seeded with top-level preprocessor directives and preprocessing iterates until a fixed point is reached. Each iteration attempts to process `#define` and `#if` directives. Error reporting is delayed until the end since only then can unbound `#define` variables be classified as errors.

Preprocessing needs to traverse the syntax tree along all active code paths, which is the entire tree in the worst case. To avoid this overhead, files with preprocessor directives are flagged during parsing and only flagged files are preprocessed. Code inside dead preprocessor branches is also not traversed.

## Type Checking

Type checking starts by creating a symbol for each declaration, creating a scope for each block that needs one, and inserting each symbol into its enclosing scope. Each scope can both reference symbols on a type and store local symbols. For example, two adjacent namespace declarations with the same name have two separate scopes that both reference the same type. Symbols imported with a `using` statement inside a namespace block are local only to that namespace scope and are not visible from the other namespace scope. However, the symbols from declarations inside either namespace block are stored on the type itself and are accessible from both scopes.

Once all symbols and scopes are prepared, type checking is done using a single tree traversal. Type checking is made order-independent by applying it recursively. For example, resolving the body of a function may require resolving the type of a variable, which may require resolving its initializer, which may require resolving a constructor, which would then require resolving the enclosing type, which may require resolving base types, and so on:

    void foo() { bar.baz(); }
    var bar = Bar();
    class Bar : Baz {}
    class Baz { void baz() {} }

To prevent cycles, symbol resolution is separated into an initialization phase and a resolution phase. The initialization phase resolves just enough to know the type of the symbol while the resolution phase fully resolves the symbol's contents. Using a symbol requires initializing it but not resolving it. Cycles are detected by giving each symbol three states: uninitialized, initializing, and initialized. Encountering an initializing symbol is an error. These rules ensure that `class Foo { Foo foo; }` is valid but `class Foo : Foo {}` is an error.

Limited type inference is performed using type context propagation. A type hint can optionally be provided during expression resolution and will be used to provide missing information if available. For example, type context from the variable type in `List<double> foo = [0];` ensures that the list literal contains doubles instead of ints.
