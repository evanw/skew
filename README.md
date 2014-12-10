# Skew Programming Language

This is a programming language with the goal of supporting better cross-platform software development. It tries to make the right compromises and leave open the possibility of targeting almost any platform. There are other options available (JavaScript, Java, C++, C#, etc.) but none take the same approach.

It currently contains a production-quality JavaScript target and a partially-complete C++11 target, but can easily be extended to support languages like C#, Java, Swift, C++/CX, Python, Ruby, PHP, and so on.

*Warning: This is a hobby project and is still evolving rapidly. It can be used for real things (the compiler is written in itself) but the language is nowhere near stability yet.*

## Building

If you just want to install the compiler, you can run `npm install -g skew` which installs the `skewc` compiler command globally. It will attempt to compile an optimized C++11 build of the compiler but will fall back to a JavaScript build of the compiler if no C++11 compiler is detected. The `npm` command is a package manager bundled with [node](http://nodejs.org/download/).

Development on the compiler itself is straightforward since the compiler compiles itself. The current build of the compiler in JavaScript is included in the repo as `skewc.js` and is used by `Makefile`. Here are some useful commands:

* `make`: Build the compiler into `build/debug/skewc.js` which can be tested using `tests/live/index.html`
* `make check`: Run the compiler through itself a few times for a sanity check
* `make install` Replace the top-level `skewc.js` file with a newer version of itself
* `make test`: Run all tests under `tests/system` using [mocha](http://mochajs.org/)
