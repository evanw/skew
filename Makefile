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

JS_FLAGS += --verbose
JS_FLAGS += --target=js

CPP_FLAGS += --verbose
CPP_FLAGS += --target=cpp

FRONTEND_DEPS += Makefile
FRONTEND_DEPS += $(FRONTEND_SOURCES)
FRONTEND_DEPS += lib/*.sk

FRONTEND_FLAGS += $(FRONTEND_SOURCES)
FRONTEND_FLAGS += $(JS_FLAGS)
FRONTEND_FLAGS += --config=node

TEST_DEPS += Makefile
TEST_DEPS += $(TEST_SOURCES)
TEST_DEPS += lib/*.sk

CXX_FLAGS += -std=c++11
CXX_FLAGS += -ferror-limit=0
CXX_FLAGS += -fno-exceptions
CXX_FLAGS += -fno-rtti
CXX_FLAGS += -Wall
CXX_FLAGS += -Wextra
CXX_FLAGS += -Wno-switch
CXX_FLAGS += -Wno-unused-parameter
CXX_FLAGS += -Wno-reorder
CXX_FLAGS += -ferror-limit=0

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
	node skewc.js $(FRONTEND_SOURCES) $(CPP_FLAGS) --output-file=$(DEBUG_DIR)/skewc.cpp

$(DEBUG_DIR)/skewc: src/frontend/frontend.cpp $(DEBUG_DIR)/skewc.cpp
	c++ src/frontend/frontend.cpp $(DEBUG_DIR)/skewc.cpp $(CXX_FLAGS) -o $(DEBUG_DIR)/skewc

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
	node skewc.js $(FRONTEND_SOURCES) $(CPP_FLAGS) --output-file=$(RELEASE_DIR)/skewc.cpp

$(RELEASE_DIR)/skewc: src/frontend/frontend.cpp $(RELEASE_DIR)/skewc.cpp
	c++ src/frontend/frontend.cpp $(RELEASE_DIR)/skewc.cpp $(CXX_FLAGS) -O3 -DNDEBUG -fomit-frame-pointer -fvisibility=hidden -o $(RELEASE_DIR)/skewc

################################################################################
# LIVE
################################################################################

live: $(TESTS_DIR)/live.js

$(TESTS_DIR)/live.js: $(FRONTEND_DEPS) | $(TESTS_DIR)
	node skewc.js $(SOURCES) $(JS_FLAGS) --output-file=$(TESTS_DIR)/live.js --source-map

################################################################################
# TEST
################################################################################

test: $(TESTS_DIR)/skewc.js
	node $(TESTS_DIR)/skewc.js

test-binary: $(TESTS_DIR)/skewc
	$(TESTS_DIR)/skewc

$(TESTS_DIR):
	mkdir -p $(TESTS_DIR)

$(TESTS_DIR)/skewc.js: $(TEST_DEPS) | $(TESTS_DIR)
	node skewc.js $(TEST_SOURCES) $(JS_FLAGS) --config=node --output-file=$(TESTS_DIR)/skewc.js

$(TESTS_DIR)/skewc.cpp: $(TEST_DEPS) | $(TESTS_DIR)
	node skewc.js $(TEST_SOURCES) $(CPP_FLAGS) --output-file=$(TESTS_DIR)/skewc.cpp

$(TESTS_DIR)/skewc: $(TESTS_DIR)/skewc.cpp
	c++ $(TESTS_DIR)/skewc.cpp $(CXX_FLAGS) -o $(TESTS_DIR)/skewc

################################################################################
# PUBLISH
################################################################################

publish:
	(cd $(NPM_DIR) && npm version patch)
	cp src/frontend/frontend.cpp $(NPM_DIR)
	node skewc.js $(FRONTEND_FLAGS) --output-file=$(NPM_DIR)/compiled.js
	node skewc.js $(FRONTEND_SOURCES) $(CPP_FLAGS) --config=osx --output-file=$(NPM_DIR)/skewc.unix.cpp
	node skewc.js $(FRONTEND_SOURCES) $(CPP_FLAGS) --config=windows --output-file=$(NPM_DIR)/skewc.windows.cpp
	(cd $(NPM_DIR) && npm publish)
