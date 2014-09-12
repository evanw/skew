################################################################################
# VARIABLES
################################################################################

SOURCES += src/*/*.sk
TEST_SOURCES += tests/system/*.sk tests/system/*/*.sk
DEBUG_DIR = build/debug
RELEASE_DIR = build/release
TESTS_DIR = build/tests

JS_SOURCES += src/core/support.js

FLAGS += --verbose
FLAGS += --target=js
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
	node $(DEBUG_DIR)/skewc.js $(FRONTEND_FLAGS) --output-file=$(RELEASE_DIR)/skewc.js --optimize --js-minify
	node $(RELEASE_DIR)/skewc.js $(FRONTEND_FLAGS) --output-file=$(RELEASE_DIR)/skewc.js --optimize --js-minify
	cp $(RELEASE_DIR)/skewc.js $(RELEASE_DIR)/skewc.min.js
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
