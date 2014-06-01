SOURCES += src/ast/create.sk
SOURCES += src/ast/node.sk

SOURCES += src/core/log.sk
SOURCES += src/core/range.sk
SOURCES += src/core/source.sk
SOURCES += src/core/support.sk

SOURCES += src/debug/dump.sk

SOURCES += src/lexer/lexer.sk
SOURCES += src/lexer/token.sk

SOURCES += src/parser/diagnostics.sk
SOURCES += src/parser/parser.sk
SOURCES += src/parser/pratt.sk

SOURCES += src/resolve/symbol.sk
SOURCES += src/resolve/type.sk
SOURCES += src/resolve/typecache.sk

default: debug

debug: build/debug/skewc.js

build:
	mkdir build

build/debug: build
	mkdir build/debug

build/debug/skewc.js: build/debug $(SOURCES) Makefile src/core/support.js
	skewc $(SOURCES) --verbose --target js --output-file build/debug/skewc.js --append src/core/support.js
