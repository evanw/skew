################################################################################
# VARIABLES
################################################################################

SOURCES += src/ast/*.sk
SOURCES += src/compiler/*.sk
SOURCES += src/core/*.sk
SOURCES += src/cpp/*.sk
SOURCES += src/emitters/*.sk
SOURCES += src/js/*.sk
SOURCES += src/lexer/*.sk
SOURCES += src/parser/*.sk
SOURCES += src/resolver/*.sk
TEST_SOURCES += $(SOURCES)
TEST_SOURCES += tests/system/*.sk tests/system/*/*.sk
FRONTEND_SOURCES += $(SOURCES)
FRONTEND_SOURCES += src/frontend/*.sk

DEBUG_DIR = build/debug
RELEASE_DIR = build/release
TESTS_DIR = build/tests
NPM_DIR = skew-npm

FLAGS += --verbose
FLAGS += --target=js

FRONTEND_DEPS += Makefile
FRONTEND_DEPS += $(FRONTEND_SOURCES)

FRONTEND_FLAGS += $(FRONTEND_SOURCES)
FRONTEND_FLAGS += $(FLAGS)
FRONTEND_FLAGS += --config=node

TEST_DEPS += Makefile
TEST_DEPS += $(TEST_SOURCES)
TEST_DEPS += tests/system/common.js

TEST_FLAGS += $(TEST_SOURCES)
TEST_FLAGS += $(FLAGS)
TEST_FLAGS += --config=node
TEST_FLAGS += --append-file:tests/system/common.js

CPP_FLAGS += -std=c++11
CPP_FLAGS += -ferror-limit=0
CPP_FLAGS += -fno-exceptions
CPP_FLAGS += -fno-rtti
CPP_FLAGS += -Wall
CPP_FLAGS += -Wextra
CPP_FLAGS += -Wno-switch
CPP_FLAGS += -Wno-unused-parameter
CPP_FLAGS += -Wno-reorder
CPP_FLAGS += -ferror-limit=0

################################################################################
# DEFAULT
################################################################################

default: debug

clean:
	rm -fr build

################################################################################
# INSTALL
################################################################################

install: check
	cp $(DEBUG_DIR)/skewc.js .

check: | $(DEBUG_DIR)
	node skewc.js $(FRONTEND_FLAGS) --output-file=$(DEBUG_DIR)/skewc.js --source-map
	node $(DEBUG_DIR)/skewc.js $(FRONTEND_FLAGS) --output-file=$(DEBUG_DIR)/skewc.js
	node $(DEBUG_DIR)/skewc.js $(FRONTEND_FLAGS) --output-file=$(DEBUG_DIR)/skewc.js

check-release: | $(DEBUG_DIR) $(RELEASE_DIR)
	node skewc.js $(FRONTEND_FLAGS) --output-file=$(DEBUG_DIR)/skewc.js --source-map
	node $(DEBUG_DIR)/skewc.js $(FRONTEND_FLAGS) --output-file=$(RELEASE_DIR)/skewc.min.js --release
	node $(RELEASE_DIR)/skewc.min.js $(FRONTEND_FLAGS) --output-file=$(RELEASE_DIR)/skewc.min.js --release
	node $(RELEASE_DIR)/skewc.min.js $(FRONTEND_FLAGS) --output-file=$(RELEASE_DIR)/skewc.js --release --minify=false --mangle=false

################################################################################
# DEBUG
################################################################################

debug: $(DEBUG_DIR)/skewc.js

$(DEBUG_DIR):
	mkdir -p $(DEBUG_DIR)

$(DEBUG_DIR)/skewc.js: $(FRONTEND_DEPS) | $(DEBUG_DIR)
	node skewc.js $(FRONTEND_FLAGS) --output-file=$(DEBUG_DIR)/skewc.js --source-map

debug-binary: $(DEBUG_DIR)/skewc

$(DEBUG_DIR)/skewc.cpp: $(FRONTEND_DEPS) | $(DEBUG_DIR)
	node skewc.js $(FRONTEND_SOURCES) --verbose --target=cpp --output-file=$(DEBUG_DIR)/skewc.cpp

$(DEBUG_DIR)/skewc: src/frontend/frontend.cpp $(DEBUG_DIR)/skewc.cpp
	clang++ src/frontend/frontend.cpp $(DEBUG_DIR)/skewc.cpp $(CPP_FLAGS) -I$(DEBUG_DIR) -std=c++11 -ferror-limit=0 -o $(DEBUG_DIR)/skewc

################################################################################
# RELEASE
################################################################################

release: $(RELEASE_DIR)/skewc.js $(RELEASE_DIR)/skewc.min.js.gz
	ls -l $(RELEASE_DIR)/skewc.js $(RELEASE_DIR)/skewc.min.js $(RELEASE_DIR)/skewc.min.js.gz

$(RELEASE_DIR):
	mkdir -p $(RELEASE_DIR)

$(RELEASE_DIR)/skewc.js: $(FRONTEND_DEPS) | $(RELEASE_DIR)
	node skewc.js $(FRONTEND_FLAGS) --output-file=$(RELEASE_DIR)/skewc.js --release --minify=false --mangle=false

$(RELEASE_DIR)/skewc.min.js: $(FRONTEND_DEPS) | $(RELEASE_DIR)
	node skewc.js $(FRONTEND_FLAGS) --output-file=$(RELEASE_DIR)/skewc.min.js --release

$(RELEASE_DIR)/skewc.min.js.gz: $(RELEASE_DIR)/skewc.min.js
	zopfli -c $(RELEASE_DIR)/skewc.min.js > $(RELEASE_DIR)/skewc.min.js.gz || gzip --stdout --best $(RELEASE_DIR)/skewc.min.js > $(RELEASE_DIR)/skewc.min.js.gz

release-binary: $(RELEASE_DIR)/skewc

$(RELEASE_DIR)/skewc.cpp: $(FRONTEND_DEPS) | $(RELEASE_DIR)
	node skewc.js $(FRONTEND_SOURCES) --verbose --target=cpp --output-file=$(RELEASE_DIR)/skewc.cpp

$(RELEASE_DIR)/skewc: src/frontend/frontend.cpp $(RELEASE_DIR)/skewc.cpp
	clang++ src/frontend/frontend.cpp $(RELEASE_DIR)/skewc.cpp $(CPP_FLAGS) -O3 -DNDEBUG -fomit-frame-pointer -fvisibility=hidden -I$(RELEASE_DIR) -o $(RELEASE_DIR)/skewc

################################################################################
# LIVE
################################################################################

live: $(TESTS_DIR)/live.js

$(TESTS_DIR)/live.js: $(FRONTEND_DEPS) | $(TESTS_DIR)
	node skewc.js $(SOURCES) $(FLAGS) --output-file=$(TESTS_DIR)/live.js --source-map

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

################################################################################
# PUBLISH
################################################################################

publish:
	(cd $(NPM_DIR) && npm version patch)
	cp src/frontend/frontend.cpp $(NPM_DIR)
	node skewc.js $(FRONTEND_FLAGS) --output-file=$(NPM_DIR)/compiled.js
	node skewc.js $(FRONTEND_SOURCES) --verbose --target=cpp --config=osx --output-file=$(NPM_DIR)/skewc.unix.cpp
	node skewc.js $(FRONTEND_SOURCES) --verbose --target=cpp --config=windows --output-file=$(NPM_DIR)/skewc.windows.cpp
	(cd $(NPM_DIR) && npm publish)
