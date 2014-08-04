SOURCES += src/ast/create.sk
SOURCES += src/ast/get.sk
SOURCES += src/ast/logic.sk
SOURCES += src/ast/node.sk
SOURCES += src/ast/operators.sk

SOURCES += src/compiler/collector.sk
SOURCES += src/compiler/compiler.sk
SOURCES += src/compiler/json.sk
SOURCES += src/compiler/library.sk
SOURCES += src/compiler/lisp.sk
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

SOURCES += src/resolver/callgraph.sk
SOURCES += src/resolver/constantfolding.sk
SOURCES += src/resolver/diagnostics.sk
SOURCES += src/resolver/instancetostatic.sk
SOURCES += src/resolver/functioninlining.sk
SOURCES += src/resolver/member.sk
SOURCES += src/resolver/resolver.sk
SOURCES += src/resolver/scope.sk
SOURCES += src/resolver/symbol.sk
SOURCES += src/resolver/type.sk
SOURCES += src/resolver/typecache.sk

SOURCES += src/service/service.sk

TEST_SOURCES += tests/system/common.sk

TEST_SOURCES += tests/system/core/calls.sk
TEST_SOURCES += tests/system/core/constructors.sk
TEST_SOURCES += tests/system/core/conversions.sk
TEST_SOURCES += tests/system/core/cyclic.sk
TEST_SOURCES += tests/system/core/enums.sk
TEST_SOURCES += tests/system/core/generics.sk
TEST_SOURCES += tests/system/core/lambdas.sk
TEST_SOURCES += tests/system/core/let.sk
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

TEST_SOURCES += tests/system/js/expressions.sk
TEST_SOURCES += tests/system/js/functions.sk
TEST_SOURCES += tests/system/js/inlining.sk
TEST_SOURCES += tests/system/js/objects.sk

DEBUG_DIR = build/debug
RELEASE_DIR = build/release
TESTS_DIR = build/tests

JS_SOURCES += bootstrap.js
JS_SOURCES += src/core/support.js
JS_SOURCES += src/frontend/frontend.js

compile = \
	node $(1) $(SOURCES) --verbose --target=js --output-file=$(2)/skewc.compiled.js $(4) && \
	cat bootstrap.js $(3) $(2)/skewc.compiled.js src/core/support.js src/frontend/frontend.js > $(2)/skewc.js && \
	rm $(2)/skewc.compiled.js

compile-frontend = \
	$(call compile,$(1),$(2),,$(3))

default: debug

clean:
	rm -fr build

################################################################################
# INSTALL
################################################################################

install: check-release
	cp $(RELEASE_DIR)/skewc.js .

check: | $(DEBUG_DIR)
	$(call compile-frontend,skewc.js,$(DEBUG_DIR),)
	$(call compile-frontend,$(DEBUG_DIR)/skewc.js,$(DEBUG_DIR),)
	$(call compile-frontend,$(DEBUG_DIR)/skewc.js,$(DEBUG_DIR),)

check-release: | $(RELEASE_DIR)
	$(call compile-frontend,skewc.js,$(RELEASE_DIR),--optimize)
	$(call compile-frontend,$(RELEASE_DIR)/skewc.js,$(RELEASE_DIR),--optimize)
	$(call compile-frontend,$(RELEASE_DIR)/skewc.js,$(RELEASE_DIR),--optimize)

################################################################################
# DEBUG
################################################################################

debug: $(DEBUG_DIR)/skewc.js

$(DEBUG_DIR):
	mkdir -p $(DEBUG_DIR)

$(DEBUG_DIR)/skewc.js: Makefile $(SOURCES) $(JS_SOURCES) | $(DEBUG_DIR)
	$(call compile-frontend,skewc.js,$(DEBUG_DIR),)

################################################################################
# RELEASE
################################################################################

release: $(RELEASE_DIR)/skewc.js

$(RELEASE_DIR):
	mkdir -p $(RELEASE_DIR)

$(RELEASE_DIR)/skewc.js: Makefile $(SOURCES) $(JS_SOURCES) | $(RELEASE_DIR)
	$(call compile-frontend,skewc.js,$(RELEASE_DIR),--optimize)

################################################################################
# TEST
################################################################################

test: $(TESTS_DIR)/skewc.js | $(TESTS_DIR)/node_modules/mocha
	$(TESTS_DIR)/node_modules/mocha/bin/mocha $(TESTS_DIR)/skewc.js

$(TESTS_DIR):
	mkdir -p $(TESTS_DIR)

$(TESTS_DIR)/skewc.js: Makefile $(SOURCES) $(JS_SOURCES) $(TEST_SOURCES) tests/system/common.js | $(TESTS_DIR)
	$(call compile,skewc.js $(TEST_SOURCES),$(TESTS_DIR),tests/system/common.js,)

$(TESTS_DIR)/package.json: tests/system/package.json | $(TESTS_DIR)
	cp tests/system/package.json $(TESTS_DIR)/package.json

$(TESTS_DIR)/node_modules/mocha: | $(TESTS_DIR)/package.json
	cd $(TESTS_DIR) && npm install
