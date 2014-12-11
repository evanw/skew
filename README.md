# Skew Programming Language

This is a programming language with the goal of supporting better cross-platform software development. It tries to make the right compromises and leave open the possibility of targeting almost any platform. There are other options available (JavaScript, Java, C++, C#, etc.) but none take the same approach.

It currently contains a production-quality JavaScript target and a partially-complete C++11 target, but can easily be extended to support languages like C#, Java, Swift, C++/CX, Python, Ruby, PHP, and so on.

*Warning: This is a hobby project and is still evolving rapidly. It can be used for real things (the compiler is written in itself) but the language is nowhere near stability yet.*

## Installing

Run `npm install -g skew` to install the `skewc` compiler command globally. It will attempt to compile an optimized C++11 build of the compiler but will fall back to a JavaScript build of the compiler if no C++11 compiler is detected. The `npm` command is a package manager bundled with [node](http://nodejs.org/download/).

## Documentation

- [Language](docs/language.md)
- [Compiler](docs/compiler.md)
