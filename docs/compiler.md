# Compiler

## Building

Development on the compiler itself is straightforward since the compiler compiles itself. The current build of the compiler in JavaScript is included in the repo as `skewc.js` and is used by `Makefile`. Here are some useful commands:

* `make`: Build the compiler into `build/debug/skewc.js` which can be tested using `tests/live/index.html`
* `make check`: Run the compiler through itself a few times for a sanity check
* `make install` Replace the top-level `skewc.js` file with a newer version of itself
* `make test`: Run all tests under `tests/system`
