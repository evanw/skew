# Compiler

## Usage

The top-level command is `skewc`, which can be installed using `npm install -g skew`. Example usage:

    skewc input.sk --target=js --output-file=output.js --release

Descriptions of all compiler flags can be accessed with `--help` and looks like this:

Flag&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | Description
---|---
  --target=___       | Sets the target format. Valid targets are "cpp", "joined", "js", "json-ast", "lisp-ast", and "xml-ast".
  --output-file=___  | Combines all output into a single file. Mutually exclusive with --output-dir.
  --output-dir=___   | Places all output files in the specified directory. Mutually exclusive with --output-file.
  --define:___       | Overrides the value of a #define statement. Example: --define:UNIT_TESTS=true.
  --release          | Implies --inline, --globalize, --remove-asserts, --fold-constants, --minify, --mangle, and --define:BUILD_RELEASE.
  --config=___       | Provides the configuration for the target format. Valid configurations are "browser" and "node" for JavaScript and "android", "ios", "linux", "osx", and "windows" for C++. Defaults to "browser" for JavaScript and the current operating system for C++.
  --verbose          | Prints out information about the compilation.
  --gc=___           | Setsthe garbage collection strategy when targeting C++. Valid strategies are "mark-sweep", "none", and "none-fast". Defaults to "none".
  --source-map       | Generates a source map when targeting JavaScript. The source map is saved with the ".map" extension in the same directory as the main output file.
  --inline           | Uses heuristics to automatically inline simple functions.
  --globalize        | Changes all internal non-virtual instance methods to static methods. This provides more inlining opportunities at compile time and avoids property access overhead at runtime.
  --remove-asserts   | Removes all assert statements prior to compilation.
  --fold-constants   | Evaluates constants at compile time and removes dead code inside functions.
  --minify           | Omits whitespace so the emitted JavaScript takes up less space.
  --mangle           | Transforms your JavaScript code to be as small as possible. The "export" modifier prevents renaming a symbol.
  --error-limit=___  | Sets the maximum number of errors to report. Pass 0 to disable the error limit. The default is 20.

## Compiler Development

Development on the compiler itself is straightforward since the compiler compiles itself. The current build of the compiler in JavaScript is included in the repo as `skewc.js` and is used by `Makefile`. Here are some useful commands:

* `make live`: Build the compiler into `build/tests/live.js` which can be tested using `tests/live/index.html`
* `make check`: Run the compiler through itself a few times for a sanity check
* `make replace`: Replace the top-level `skewc.js` file with a newer version of itself
* `make test`: Run all tests under `tests/system`
