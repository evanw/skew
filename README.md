# Skew Programming Language

Skew is a programming language for building cross-platform software. It compiles to straightforward, readable source code in other languages and is designed to be easy to integrate into a mixed-language code base.

The compiler currently contains a production-quality JavaScript target, a working C# target, and a partially-complete target for C++11. It can easily be extended to support languages like Java, Swift, C++/CX, Python, PHP, and so on.

*Warning: This is a hobby project and is still evolving rapidly. It can be used for real things (the compiler is written in itself) but the language not completely stable yet.*

## Why use it?

The intent is to use this language for the platform-independent stuff in an application and to use the language native to the target platform for the platform-specific stuff. When done properly, the vast majority of the code is completely platform-independent and new platforms can be targeted easily with a small platform-specific shim.

**Pros:**

* **Advanced optimizations:** The optimizations in the compiler combined with certain language features (integers, explicit exports, wrapped types) makes writing compact, efficient JavaScript code easy and pleasant. Supported optimizations: inlining, dead code elimination, constant folding, devirtualization, interface removal, symbol renaming, and JavaScript syntax tree compaction.
* **Fast compile times:** Code compiles at the speed of a browser refresh. Web development still feels like web development despite using an optimizing compiler with static typing. This is in contrast to many other comparable compile-to-JavaScript solutions.
* **Natural debugging experience:** Debugging is done in a single language using the platform-native debugger. No need to try to debug a multi-language app with a debugger that only understands one language.
* **Easy integration:** Generated code is very readable and closely corresponds with the original. Language features allow for the easy import and export of code to and from the target language.
* **Fast iteration time:** In addition to a fast compiler and a good debugging experience, garbage collection is used instead of manual memory management. This eliminates a whole class of time-consuming bugs that get in the way of the important stuff.
* **Native code emission:** For native targets, application logic is compiled directly to native code and is not interpreted in a virtual machine. Native apps don't have to pay for JIT warmup time and native app performance is not at the whim of heuristics. The generated code can be compiled using industry-standard compilers that leverage decades of optimization work.

**Cons:**

* **Lack of IDE support:** IDE support is planned but is a significant undertaking and will not materialize for a while. Developers who normally lean heavily on IDEs will be less efficient than usual.
* **Immaturity:** This is a new programming language and hasn't stood the test of time. There will likely be many rough edges both in the language design and in the tools. Many planned features are not yet implemented.
* **Lack of community:** New programming languages don't have the wealth of searchable Q&A data that established programming languages have. Solutions to random issues are likely not available online.
* **No cross-platform multithreading:** Multithreading is not a language feature and needs to be done in the target language. This limits multithreading opportunities to cleanly separable tasks like image decoding.
* **Lack of low-level features:** Features such as memory layout, move semantics, destructors, and vector instructions are intentionally omitted. These features don't map well to all language targets and their emulation is expensive. Use of these features is limited to imported library routines implemented in the target language.

## Example Code

This language has curly-brace syntax, classes, interfaces, namespaces, enums, type inference, garbage collection, preprocessing, order independent declarations, and more. It looks like this:

    @import
    namespace console {
      def log(text string)
    }

    @entry
    def fizzBuzz {
      for i in 1..101 {
        var text = (i % 3 == 0 ? "Fizz" : "") + (i % 5 == 0 ? "Buzz" : "")
        console.log(text == "" ? i.toString : text)
      }
    }

Generated JavaScript code:

    (function() {
      function fizzBuzz() {
        for (var i = 1; i < 101; ++i) {
          var text = (i % 3 === 0 ? 'Fizz' : '') + (i % 5 === 0 ? 'Buzz' : '');
          console.log(text === '' ? i.toString() : text);
        }
      }

      fizzBuzz();
    })();

Generated JavaScript code with the `--release` flag:

    (function(){function c(){for(var a=1;a<101;++a){var b=(a%3?'':'Fizz')+(a%5?'':'Buzz');console.log(b||a.toString())}}c()})();

Generated C# code:

    public class Globals
    {
        public static void Main()
        {
            for (int i = 1; i < 101; ++i)
            {
                string text = (i % 3 == 0 ? "Fizz" : "") + (i % 5 == 0 ? "Buzz" : "");
                console.log(text == "" ? i.ToString() : text);
            }
        }
    }


## Getting Started

Run `npm install -g skew` to install the `skewc` compiler command globally. Alternatively, clone this repo and run `node skewc.js` instead. You must have [node](http://nodejs.org/download/) installed.

Example usage:

    $ skewc input.sk --target=js --output-file=output.js --release

Compiler flags:

    $ skewc

    usage: skewc [flags] [inputs]

      --help                 Prints this message.

      --target=___           Sets the target format. Valid targets are "cpp", "cs",
                             "js", "lisp-tree", and "typecheck".

      --output-file=___      Combines all output into a single file. Mutually
                             exclusive with --output-dir.

      --output-dir=___       Places all output files in the specified directory.
                             Mutually exclusive with --output-file.

      --release              Implies --js-mangle, --js-minify, --fold-constants,
                             --inline-functions, --globalize-functions, and
                             --define:RELEASE=true.

      --verbose              Prints out information about the compilation.

      --message-limit=___    Sets the maximum number of messages to report. Pass 0
                             to disable the message limit. The default is 10.

      --define:___           Override variable values at compile time.

      --js-mangle            Transforms emitted JavaScript to be as small as
                             possible. The "@export" annotation prevents renaming a
                             symbol.

      --js-minify            Remove whitespace when compiling to JavaScript.

      --js-source-map        Generates a source map when targeting JavaScript. The
                             source map is saved with the ".map" extension in the
                             same directory as the main output file.

      --fold-constants       Evaluates constants at compile time and removes dead
                             code inside functions.

      --inline-functions     Uses heuristics to automatically inline simple global
                             functions.

      --globalize-functions  Convert instance functions to global functions for
                             better inlining.

## Documentation

* [Language](docs/language.md)
* [Compiler](docs/compiler.md)
