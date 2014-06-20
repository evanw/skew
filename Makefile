SOURCES += src/ast/create.sk
SOURCES += src/ast/get.sk
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

SOURCES += src/resolver/diagnostics.sk
SOURCES += src/resolver/resolver.sk
SOURCES += src/resolver/scope.sk
SOURCES += src/resolver/symbol.sk
SOURCES += src/resolver/type.sk
SOURCES += src/resolver/typecache.sk

TEST_SOURCES += tests/system/common.sk
TEST_SOURCES += tests/system/conversions.sk
TEST_SOURCES += tests/system/cyclic.sk
TEST_SOURCES += tests/system/generics.sk
TEST_SOURCES += tests/system/merging.sk
TEST_SOURCES += tests/system/modifiers.sk
TEST_SOURCES += tests/system/parsing.sk
TEST_SOURCES += tests/system/statements.sk
TEST_SOURCES += tests/system/static.sk
TEST_SOURCES += tests/system/types.sk
TEST_SOURCES += tests/system/using.sk
TEST_SOURCES += tests/system/var.sk

DEBUG_DIR = build/debug
RELEASE_DIR = build/release
TESTS_DIR = build/tests

default: debug

clean:
	rm -fr build

################################################################################
# DEBUG
################################################################################

debug: $(DEBUG_DIR)/skewc.js

$(DEBUG_DIR):
	mkdir -p $(DEBUG_DIR)

$(DEBUG_DIR)/skewc.js: Makefile $(SOURCES) src/core/support.js | $(DEBUG_DIR)
	skewc --verbose $(SOURCES) --append src/core/support.js --target js --output-file $(DEBUG_DIR)/skewc.js

################################################################################
# RELEASE
################################################################################

release: $(RELEASE_DIR)/skewc.js

$(RELEASE_DIR):
	mkdir -p $(RELEASE_DIR)

$(RELEASE_DIR)/skewc.js: Makefile $(SOURCES) src/core/support.js | $(RELEASE_DIR)
	skewc --verbose --optimize $(SOURCES) --append src/core/support.js --target js --output-file $(RELEASE_DIR)/skewc.js

################################################################################
# TEST
################################################################################

test: $(TESTS_DIR)/mocha.js | $(TESTS_DIR)/node_modules/mocha
	$(TESTS_DIR)/node_modules/mocha/bin/mocha $(TESTS_DIR)/mocha.js

$(TESTS_DIR):
	mkdir -p $(TESTS_DIR)

$(TESTS_DIR)/mocha.js: Makefile $(SOURCES) $(TEST_SOURCES) tests/system/common.js src/core/support.js | $(TESTS_DIR)
	skewc --verbose $(SOURCES) $(TEST_SOURCES) --prepend tests/system/common.js --append src/core/support.js --target js --output-file $(TESTS_DIR)/mocha.js

$(TESTS_DIR)/package.json: tests/system/package.json | $(TESTS_DIR)
	cp tests/system/package.json $(TESTS_DIR)/package.json

$(TESTS_DIR)/node_modules/mocha: | $(TESTS_DIR)/package.json
	cd $(TESTS_DIR) && npm install
