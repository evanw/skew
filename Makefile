SOURCES += src/ast/create.sk
SOURCES += src/ast/get.sk
SOURCES += src/ast/node.sk
SOURCES += src/ast/operators.sk

SOURCES += src/compiler/compiler.sk
SOURCES += src/compiler/emitter.sk
SOURCES += src/compiler/library.sk
SOURCES += src/compiler/lisp.sk
SOURCES += src/compiler/json.sk
SOURCES += src/compiler/xml.sk

SOURCES += src/core/log.sk
SOURCES += src/core/range.sk
SOURCES += src/core/source.sk
SOURCES += src/core/support.sk

SOURCES += src/frontend/frontend.sk

SOURCES += src/js/emitter.sk
SOURCES += src/js/sourcemap.sk

SOURCES += src/lexer/lexer.sk
SOURCES += src/lexer/token.sk

SOURCES += src/parser/diagnostics.sk
SOURCES += src/parser/parser.sk
SOURCES += src/parser/pratt.sk

SOURCES += src/resolver/constantfolding.sk
SOURCES += src/resolver/diagnostics.sk
SOURCES += src/resolver/member.sk
SOURCES += src/resolver/resolver.sk
SOURCES += src/resolver/scope.sk
SOURCES += src/resolver/symbol.sk
SOURCES += src/resolver/type.sk
SOURCES += src/resolver/typecache.sk

TEST_SOURCES += tests/system/common.sk
TEST_SOURCES += tests/system/core/calls.sk
TEST_SOURCES += tests/system/core/constructors.sk
TEST_SOURCES += tests/system/core/conversions.sk
TEST_SOURCES += tests/system/core/cyclic.sk
TEST_SOURCES += tests/system/core/enums.sk
TEST_SOURCES += tests/system/core/generics.sk
TEST_SOURCES += tests/system/core/lambdas.sk
TEST_SOURCES += tests/system/core/merging.sk
TEST_SOURCES += tests/system/core/modifiers.sk
TEST_SOURCES += tests/system/core/objects.sk
TEST_SOURCES += tests/system/core/parsing.sk
TEST_SOURCES += tests/system/core/statements.sk
TEST_SOURCES += tests/system/core/static.sk
TEST_SOURCES += tests/system/core/switch.sk
TEST_SOURCES += tests/system/core/types.sk
TEST_SOURCES += tests/system/core/using.sk
TEST_SOURCES += tests/system/core/var.sk
TEST_SOURCES += tests/system/js/objects.sk
TEST_SOURCES += tests/system/js/operators.sk

DEBUG_DIR = build/debug
RELEASE_DIR = build/release
TESTS_DIR = build/tests

JS_FLAGS += --target js
JS_FLAGS += --append src/core/support.js

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
	skewc --verbose $(SOURCES) $(JS_FLAGS) --append src/frontend/frontend.js --output-file $(DEBUG_DIR)/skewc.js

################################################################################
# RELEASE
################################################################################

release: $(RELEASE_DIR)/skewc.js

$(RELEASE_DIR):
	mkdir -p $(RELEASE_DIR)

$(RELEASE_DIR)/skewc.js: Makefile $(SOURCES) src/core/support.js | $(RELEASE_DIR)
	skewc --verbose --optimize $(SOURCES) $(JS_FLAGS) --append src/frontend/frontend.js --output-file $(RELEASE_DIR)/skewc.js

################################################################################
# TEST
################################################################################

test: $(TESTS_DIR)/mocha.js | $(TESTS_DIR)/node_modules/mocha
	$(TESTS_DIR)/node_modules/mocha/bin/mocha $(TESTS_DIR)/mocha.js

$(TESTS_DIR):
	mkdir -p $(TESTS_DIR)

$(TESTS_DIR)/mocha.js: Makefile $(SOURCES) $(TEST_SOURCES) tests/system/common.js src/core/support.js | $(TESTS_DIR)
	skewc --verbose $(SOURCES) $(TEST_SOURCES) $(JS_FLAGS) --prepend tests/system/common.js --output-file $(TESTS_DIR)/mocha.js

$(TESTS_DIR)/package.json: tests/system/package.json | $(TESTS_DIR)
	cp tests/system/package.json $(TESTS_DIR)/package.json

$(TESTS_DIR)/node_modules/mocha: | $(TESTS_DIR)/package.json
	cd $(TESTS_DIR) && npm install
