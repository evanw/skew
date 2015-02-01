# Skew Programming Language

This is a programming language with the goal of supporting better cross-platform software development. It tries to make the right compromises and leave open the possibility of targeting almost any platform. There are other cross-platform languages out there (JavaScript, Java, C++, C#, etc.) but none take the same approach.

The compiler currently contains a production-quality JavaScript target and a partially-complete C++11 target. It can easily be extended to support languages like C#, Java, Swift, C++/CX, Python, Ruby, PHP, and so on.

*Warning: This is a hobby project and is still evolving rapidly. It can be used for real things (the compiler is written in itself) but the language is nowhere near stability yet.*

## What is it?

This language uses curly-brace syntax and has classes, interfaces, namespaces, enums, type inference, garbage collection, preprocessing, order independent declarations, and more. It looks like this:

    using terminal;

    @EntryPoint
    void fizzBuzz() {
      for (var i = 1; i <= 100; i++) {
        var text = (i % 3 > 0 ? "" : "Fizz") + (i % 5 > 0 ? "" : "Buzz");
        print(text == "" ? i.toString() : text);
      }
    }

## Why use it?

The intent is to use this language for the platform-independent stuff in an application and to use the language native to the target platform for the platform-specific stuff. When done properly, the vast majority of the code is completely platform-independent and new platforms can be targeted easily with a small platform-specific shim.

### Pros:

* **Native code emission:** For native targets, application logic is compiled directly to native code and is not interpreted in a virtual machine. Native apps don't have to pay for JIT warmup time and native app performance is not at the whim of heuristics. The generated code can be compiled using industry-standard compilers that leverage decades of optimization work.
* **Fast compile times:** Code compiles at the speed of a browser refresh. Web development still feels like web development despite using an optimizing compiler with static typing. This is in contrast to many other comparable compile-to-JavaScript solutions.
* **Natural debugging experience:** Debugging is done in a single language using the platform-native debugger. No need to try to debug a multi-language app with a debugger that only understands one language.
* **Easy integration:** Generated code is very readable and closely corresponds with the original. Language features allow for the easy import and export of code to and from the target language.
* **Fast iteration time:** In addition to a fast compiler and a good debugging experience, garbage collection is used instead of manual memory management. This eliminates a whole class of time-consuming bugs that get in the way of the important stuff.

### Cons:

* **Lack of IDE support:** IDE support is planned but is a significant undertaking and will not materialize for a while. Developers who normally lean heavily on IDEs will be less efficient than usual.
* **Immaturity:** This is a new programming language and hasn't stood the test of time. There will likely be many rough edges both in the language design and in the tools. Many planned features are not yet implemented.
* **Lack of community:** New programming languages don't have the wealth of searchable Q&A data that established programming languages have. Solutions to random issues are likely not available online.
* **No cross-platform multithreading:** Multithreading is not a language feature and needs to be done in the target language. This limits multithreading opportunities to cleanly separable tasks like image decoding.
* **Lack of low-level features:** Features such as memory layout, move semantics, destructors, and vector instructions are intentionally omitted. These features don't map well to all language targets and their emulation is expensive. Use of these features is limited to imported library routines implemented in the target language.

## Getting Started

Run `npm install -g skew` to install the `skewc` compiler command globally (the `npm` command is a package manager bundled with [node](http://nodejs.org/download/)). The installation will attempt to compile an optimized C++11 build of the compiler but will fall back to a JavaScript build of the compiler if no C++11 compiler is detected. Descriptions of all compiler flags can be accessed with `skewc --help`.

Example usage:

    skewc input.sk --target=js --output-file=output.js --release

## Documentation

* [Language](docs/language.md)
    * [Primitives](docs/language.md#primitives)
    * [Objects](docs/language.md#objects)
    * [Constructors](docs/language.md#constructors)
    * [Methods](docs/language.md#methods)
    * [Enums](docs/language.md#enums)
    * [Namespaces](docs/language.md#namespaces)
    * [Extension Blocks](docs/language.md#extension-blocks)
    * [Import and Export](docs/language.md#import-and-export)
    * [Generics](docs/language.md#generics)
    * [Asserts](docs/language.md#asserts)
    * [Operator Overloading](docs/language.md#operator-overloading)
    * [Casting](docs/language.md#casting)
    * [Function Inlining and Quoting](docs/language.md#function-inlining-and-quoting)

* [Compiler](docs/compiler.md)
    * [Development](docs/compiler.md#development)
    * [Lexing](docs/compiler.md#lexing)
    * [Parsing](docs/compiler.md#parsing)
