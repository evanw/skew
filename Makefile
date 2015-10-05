BUILD_DIR = build
NPM_DIR = npm

# C-Sharp compiler
CSC = mcs
CSC_FLAGS = -debug

DIFF = diff

MONO = mono
MONO_FLAGS = --debug

NODE = node
NPM = npm

SKEWC = $(NODE) skewc.js

# --------------------------------------------------

SOURCES += src/backend/*.sk
SOURCES += src/core/*.sk
SOURCES += src/frontend/*.sk
SOURCES += src/lib/timestamp.sk
SOURCES += src/middle/*.sk

SOURCES_SKEWC += $(SOURCES)
SOURCES_SKEWC += src/driver/nodejs.sk
SOURCES_SKEWC += src/driver/options.sk
SOURCES_SKEWC += src/lib/io.sk
SOURCES_SKEWC += src/lib/terminal.sk

SOURCES_API += $(SOURCES)
SOURCES_API += src/driver/jsapi.sk

SOURCES_TEST += $(SOURCES)
SOURCES_TEST += src/driver/tests.sk
SOURCES_TEST += src/lib/terminal.sk
SOURCES_TEST += src/lib/unit.sk
SOURCES_TEST += tests/*.sk

JS_FLAGS += --target=js
JS_FLAGS += --inline-functions
JS_FLAGS += --verbose
JS_FLAGS += --message-limit=0

CS_FLAGS += --target=cs
CS_FLAGS += --inline-functions
CS_FLAGS += --verbose
CS_FLAGS += --message-limit=0

# ==================================================

.DEFAULT: default

RULES_CHECK = check check-js check-cs check-determinism check-determinism-debug check-determinism-release
RULES_COMPILE = compile-api compile-skewc
RULES_TEST = test test-js test-js-debug test-js-release test-cs test-cs-basic test-cs-advanced
RULES_BUILD = flex replace release npm-package install uninstall publish
RULES_UTILS = list clean watch

.PHONY: default $(RULES_COMPILE) $(RULES_CHECK) $(RULES_TEST) $(RULES_UTILS) $(RULES_BUILD)

# ==================================================

default: compile-api compile-skewc

clean:
	rm -fr $(BUILD_DIR)
	rm -f $(NPM_DIR)/*.js

list:
	@grep -o '^[^#[:space:].][^[:space:]]\+:' makefile | grep -o '^[^:]\+'

flex: src/frontend/lexer.sk

watch:
	node_modules/.bin/watch src 'clear && make compile-api'

# --------------------------------------------------

compile-api: $(BUILD_DIR)/skew-api.js

compile-skewc: $(BUILD_DIR)/skewc.js

# --------------------------------------------------

test: test-js test-cs

test-js: test-js-debug test-js-release

test-js-debug: $(BUILD_DIR)/test.js
	$(NODE) $^

test-js-release: $(BUILD_DIR)/test.min.js
	$(NODE) $^

test-cs: test-cs-basic test-cs-advanced

test-cs-basic: $(BUILD_DIR)/test.exe
	$(MONO) $(MONO_FLAGS) $^

test-cs-advanced: $(BUILD_DIR)/cs/test.exe
	$(MONO) $(MONO_FLAGS) $^

# --------------------------------------------------

check: check-js check-cs check-determinism

check-js: $(BUILD_DIR)/skewc2.min.js $(BUILD_DIR)/skewc3.min.js
	$(DIFF) $^

check-cs: $(BUILD_DIR)/skewc2.cs $(BUILD_DIR)/skewc3.cs
	$(DIFF) $^

check-determinism: check-determinism-debug check-determinism-release

check-determinism-debug: $(BUILD_DIR)/skewc.js $(BUILD_DIR)/skewc.cs.js
	# Debug
	$(DIFF) $^

check-determinism-release: $(BUILD_DIR)/skewc.min.js $(BUILD_DIR)/skewc.cs.min.js
	# Release
	$(DIFF) $^

# --------------------------------------------------

release: $(BUILD_DIR)/skew-api.js $(BUILD_DIR)/skew-api.min.js $(BUILD_DIR)/skew-api.min.js.gz
	ls -l $^

replace: $(BUILD_DIR)/skewc2.js $(BUILD_DIR)/skewc3.js
	# Replace
	$(DIFF) $^
	mv $(BUILD_DIR)/skewc3.js skewc.js
	rm $(BUILD_DIR)/skewc2.js

npm-package: $(NPM_DIR)/skew.js $(NPM_DIR)/skewc.js

install: test-js check-js npm-package
	# local install
	$(NPM) install -g ./$(NPM_DIR)/

uninstall:
	# local uninstall
	$(eval $@_NPM_PREFIX := $(shell npm config get prefix))
	rm $($@_NPM_PREFIX)/bin/skewc
	hash -d skewc

publish: test check npm-package
	@echo sh -c 'cd $(NPM_DIR) && $(NPM) version patch && $(NPM) publish'

# ==================================================

src/frontend/lexer.sk: src/frontend/flex.l
	sh -c 'cd src/frontend && python build.py'

# --------------------------------------------------

$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

$(BUILD_DIR)/cs: | $(BUILD_DIR)
	mkdir -p $(BUILD_DIR)/cs

$(NPM_DIR):
	mkdir -p $(NPM_DIR)

# --------------------------------------------------

$(BUILD_DIR)/skew-api.js: $(SOURCES_API) | $(BUILD_DIR)
	$(SKEWC) $^ $(JS_FLAGS) --output-file=$@

$(BUILD_DIR)/skew-api.min.js: $(SOURCES_API) | $(BUILD_DIR)
	$(SKEWC) $^ $(JS_FLAGS) --output-file=$@ --release

# --------------------------------------------------

$(BUILD_DIR)/skewc.js: $(SOURCES_SKEWC) | $(BUILD_DIR)
	$(SKEWC) $^ $(JS_FLAGS) --output-file=$@

$(BUILD_DIR)/skewc.min.js: $(SOURCES_SKEWC) | $(BUILD_DIR)
	$(SKEWC) $^ $(JS_FLAGS) --output-file=$@ --release

$(BUILD_DIR)/skewc2.js: $(BUILD_DIR)/skewc.js $(SOURCES_SKEWC)
	$(NODE) $^ $(JS_FLAGS) --output-file=$@

$(BUILD_DIR)/skewc2.min.js: $(BUILD_DIR)/skewc.min.js $(SOURCES_SKEWC)
	$(NODE) $^ $(JS_FLAGS) --output-file=$@ --release

$(BUILD_DIR)/skewc3.js: $(BUILD_DIR)/skewc2.js $(SOURCES_SKEWC)
	$(NODE) $^ $(JS_FLAGS) --output-file=$@

$(BUILD_DIR)/skewc3.min.js: $(BUILD_DIR)/skewc2.min.js $(SOURCES_SKEWC)
	$(NODE) $^ $(JS_FLAGS) --output-file=$@ --release

# --------------------------------------------------

$(BUILD_DIR)/skewc.cs: $(SOURCES_SKEWC) | $(BUILD_DIR)
	$(SKEWC) $^ $(CS_FLAGS) --output-file=$@

$(BUILD_DIR)/skewc.exe: $(BUILD_DIR)/skewc.cs
	$(CSC) $(CSC_FLAGS) $^

$(BUILD_DIR)/skewc.cs.js: $(BUILD_DIR)/skewc.exe $(SOURCES_SKEWC)
	$(MONO) $(MONO_FLAGS) $^ $(JS_FLAGS) --output-file=$@

$(BUILD_DIR)/skewc.cs.min.js: $(BUILD_DIR)/skewc.exe $(SOURCES_SKEWC)
	$(MONO) $(MONO_FLAGS) $^ $(JS_FLAGS) --output-file=$@ --release

$(BUILD_DIR)/skewc2.exe: $(BUILD_DIR)/skewc2.cs
	$(CSC) $(CSC_FLAGS) $^

$(BUILD_DIR)/skewc2.cs: $(BUILD_DIR)/skewc.exe $(SOURCES_SKEWC)
	$(MONO) $(MONO_FLAGS) $^ $(CS_FLAGS) --output-file=$@

$(BUILD_DIR)/skewc3.cs: $(BUILD_DIR)/skewc2.exe $(SOURCES_SKEWC)
	$(MONO) $(MONO_FLAGS) $^ $(CS_FLAGS) --output-file=$@

# --------------------------------------------------

$(BUILD_DIR)/test.cs: $(SOURCES_TEST) | $(BUILD_DIR)
	$(SKEWC) $^ $(CS_FLAGS) --output-file=$@

$(BUILD_DIR)/test.exe: $(BUILD_DIR)/test.cs
	$(CSC) $(CSC_FLAGS) $^

$(BUILD_DIR)/cs/test.exe: $(SOURCES_TEST) | $(BUILD_DIR)/cs
	$(SKEWC) $^ $(CS_FLAGS) --output-dir=$(BUILD_DIR)/cs
	$(CSC) $(CSC_FLAGS) $(BUILD_DIR)/cs/*.cs -out:$@

$(BUILD_DIR)/test.js: $(SOURCES_TEST) | $(BUILD_DIR)
	$(SKEWC) $^ $(JS_FLAGS) --output-file=$@

$(BUILD_DIR)/test.min.js: $(SOURCES_TEST) | $(BUILD_DIR)
	$(SKEWC) $^ $(JS_FLAGS) --output-file=$@ --release

# --------------------------------------------------

$(BUILD_DIR)/skew-api.min.js.gz: $(BUILD_DIR)/skew-api.min.js
	type zopfli > /dev/null 2>&1 && (zopfli -c $^ > $@) || (gzip -c $^ > $@)

$(NPM_DIR)/skew.js: $(BUILD_DIR)/skew-api.min.js | $(NPM_DIR)
	cp $^ $@

$(NPM_DIR)/skewc.js: $(BUILD_DIR)/skewc.min.js | $(NPM_DIR)
	echo '#!/usr/bin/env node' > npm/skewc
	cat $^ >> $(NPM_DIR)/skewc
	chmod +x $(NPM_DIR)/skewc
