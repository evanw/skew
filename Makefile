################################################################################
# SOURCES
################################################################################

SOURCES += src/ast/content.sk
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
SOURCES += src/resolver/deadcoderemoval.sk
SOURCES += src/resolver/diagnostics.sk
SOURCES += src/resolver/functioninlining.sk
SOURCES += src/resolver/instancetostatic.sk
SOURCES += src/resolver/member.sk
SOURCES += src/resolver/resolver.sk
SOURCES += src/resolver/scope.sk
SOURCES += src/resolver/symbol.sk
SOURCES += src/resolver/symbolmotion.sk
SOURCES += src/resolver/type.sk
SOURCES += src/resolver/typecache.sk

SOURCES += src/service/service.sk

################################################################################
# TEST SOURCES
################################################################################

TEST_SOURCES += tests/system/common.sk

TEST_SOURCES += tests/system/core/calls.sk
TEST_SOURCES += tests/system/core/const.sk
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
TEST_SOURCES += tests/system/js/statements.sk

################################################################################
# OTHER VARIABLES
################################################################################

DEBUG_DIR = build/debug
RELEASE_DIR = build/release
TESTS_DIR = build/tests

JS_SOURCES += bootstrap.js
JS_SOURCES += src/core/support.js

FLAGS += --verbose
FLAGS += --target=js
FLAGS += --prepend-file=bootstrap.js
FLAGS += --append-file=src/core/support.js

FRONTEND_DEPS += Makefile
FRONTEND_DEPS += $(SOURCES)
FRONTEND_DEPS += $(JS_SOURCES)
FRONTEND_DEPS += src/frontend/frontend.js

FRONTEND_FLAGS += $(SOURCES)
FRONTEND_FLAGS += $(FLAGS)
FRONTEND_FLAGS += --append-file=src/frontend/frontend.js

TEST_DEPS += Makefile
TEST_DEPS += $(SOURCES)
TEST_DEPS += $(JS_SOURCES)
TEST_DEPS += $(TEST_SOURCES)
TEST_DEPS += tests/system/common.js

TEST_FLAGS += $(SOURCES)
TEST_FLAGS += $(TEST_SOURCES)
TEST_FLAGS += $(FLAGS)
TEST_FLAGS += --append-file=tests/system/common.js

################################################################################
# DEFAULT
################################################################################

default: debug

clean:
	rm -fr build

################################################################################
# INSTALL
################################################################################

install: check-release
	cp $(RELEASE_DIR)/skewc.js .

check: | $(DEBUG_DIR)
	node skewc.js $(FRONTEND_FLAGS) --output-file=$(DEBUG_DIR)/skewc.js --js-source-map
	node $(DEBUG_DIR)/skewc.js $(FRONTEND_FLAGS) --output-file=$(DEBUG_DIR)/skewc.js
	node $(DEBUG_DIR)/skewc.js $(FRONTEND_FLAGS) --output-file=$(DEBUG_DIR)/skewc.js

check-release: | $(DEBUG_DIR) $(RELEASE_DIR)
	node skewc.js $(FRONTEND_FLAGS) --output-file=$(DEBUG_DIR)/skewc.js --js-source-map
	node $(DEBUG_DIR)/skewc.js $(FRONTEND_FLAGS) --output-file=$(RELEASE_DIR)/skewc.js --optimize
	node $(RELEASE_DIR)/skewc.js $(FRONTEND_FLAGS) --output-file=$(RELEASE_DIR)/skewc.js --optimize
	node $(RELEASE_DIR)/skewc.js $(FRONTEND_FLAGS) --output-file=$(RELEASE_DIR)/skewc.js --optimize

################################################################################
# DEBUG
################################################################################

debug: $(DEBUG_DIR)/skewc.js

$(DEBUG_DIR):
	mkdir -p $(DEBUG_DIR)

$(DEBUG_DIR)/skewc.js: $(FRONTEND_DEPS) | $(DEBUG_DIR)
	node skewc.js $(FRONTEND_FLAGS) --output-file=$(DEBUG_DIR)/skewc.js --js-source-map

################################################################################
# RELEASE
################################################################################

release: $(RELEASE_DIR)/skewc.js

$(RELEASE_DIR):
	mkdir -p $(RELEASE_DIR)

$(RELEASE_DIR)/skewc.js: $(FRONTEND_DEPS) | $(RELEASE_DIR)
	node skewc.js $(FRONTEND_FLAGS) --output-file=$(RELEASE_DIR)/skewc.js --optimize

################################################################################
# TEST
################################################################################

test: $(TESTS_DIR)/skewc.js | $(TESTS_DIR)/node_modules/mocha
	$(TESTS_DIR)/node_modules/mocha/bin/mocha $(TESTS_DIR)/skewc.js

$(TESTS_DIR):
	mkdir -p $(TESTS_DIR)

$(TESTS_DIR)/skewc.js: $(TEST_DEPS) | $(TESTS_DIR)
	node skewc.js $(TEST_FLAGS) --output-file=$(TESTS_DIR)/skewc.js

$(TESTS_DIR)/package.json: tests/system/package.json | $(TESTS_DIR)
	cp tests/system/package.json $(TESTS_DIR)/package.json

$(TESTS_DIR)/node_modules/mocha: | $(TESTS_DIR)/package.json
	cd $(TESTS_DIR) && npm install
