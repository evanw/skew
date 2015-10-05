NODE = node
SKEWC = $(NODE) skewc.js

BUILD = build

SOURCES += src/backend/*.sk
SOURCES += src/core/*.sk
SOURCES += src/frontend/*.sk
SOURCES += src/lib/timestamp.sk
SOURCES += src/middle/*.sk

SOURCES_API += $(SOURCES)
SOURCES_API += src/driver/jsapi.sk

SOURCES_SKEWC += $(SOURCES)
SOURCES_SKEWC += src/driver/nodejs.sk
SOURCES_SKEWC += src/driver/options.sk
SOURCES_SKEWC += src/lib/io.sk
SOURCES_SKEWC += src/lib/terminal.sk

SOURCES_TEST += $(SOURCES)
SOURCES_TEST += src/driver/tests.sk
SOURCES_TEST += src/lib/terminal.sk
SOURCES_TEST += src/lib/unit.sk
SOURCES_TEST += tests/*.sk

CS_FLAGS += --target=cs
CS_FLAGS += --inline-functions
CS_FLAGS += --verbose
CS_FLAGS += --message-limit=0

JS_FLAGS += --target=js
JS_FLAGS += --inline-functions
JS_FLAGS += --verbose
JS_FLAGS += --message-limit=0

# --------------------------------------------------

.DEFAULT: default

.PHONY: default clean list compile-api compile-api-release compile-skewc compile-skewc-release compile-skewc-cs test test-js test-cs publish flex

# --------------------------------------------------

default: compile-api compile-skewc

list:
	@grep -o '^[^#[:space:].][^[:space:]]\+:' makefile | grep -o '^[^:]\+'

clean:
	rm -fr build

compile-api: $(BUILD)/skew-api.js
compile-api-release: $(BUILD)/skew-api.min.js
compile-skewc: $(BUILD)/skewc.js
compile-skewc-release: $(BUILD)/skewc.min.js
compile-skewc-cs: $(BUILD)/skewc.cs

replace: $(BUILD)/skewc.js | build
	$(NODE) $(BUILD)/skewc.js $(SOURCES_SKEWC) $(JS_FLAGS) --output-file=$(BUILD)/skewc2.js
	$(NODE) $(BUILD)/skewc2.js $(SOURCES_SKEWC) $(JS_FLAGS) --output-file=$(BUILD)/skewc3.js
	diff $(BUILD)/skewc2.js $(BUILD)/skewc3.js
	mv $(BUILD)/skewc3.js skewc.js
	rm $(BUILD)/skewc2.js

check: check-js check-cs check-determinism

check-js: compile-skewc-release | build
	$(NODE) $(BUILD)/skewc.min.js $(SOURCES_SKEWC) $(JS_FLAGS) --output-file=$(BUILD)/skewc2.min.js --release
	$(NODE) $(BUILD)/skewc2.min.js $(SOURCES_SKEWC) $(JS_FLAGS) --output-file=$(BUILD)/skewc3.min.js --release
	diff $(BUILD)/skewc2.min.js $(BUILD)/skewc3.min.js

check-cs: compile-skewc-cs | build
	mcs -debug $(BUILD)/skewc.cs
	mono --debug $(BUILD)/skewc.exe $(SOURCES_SKEWC) $(CS_FLAGS) --output-file=$(BUILD)/skewc2.cs
	mcs -debug $(BUILD)/skewc2.cs
	mono --debug $(BUILD)/skewc2.exe $(SOURCES_SKEWC) $(CS_FLAGS) --output-file=$(BUILD)/skewc3.cs
	diff $(BUILD)/skewc2.cs $(BUILD)/skewc3.cs

check-determinism: compile-skewc compile-skewc-cs compile-skewc-release | build
	# Debug
	mcs -debug $(BUILD)/skewc.cs
	mono --debug $(BUILD)/skewc.exe $(SOURCES_SKEWC) $(JS_FLAGS) --output-file=$(BUILD)/skewc.cs.js
	diff $(BUILD)/skewc.js $(BUILD)/skewc.cs.js

	# Release
	mcs -debug $(BUILD)/skewc.cs
	mono --debug $(BUILD)/skewc.exe $(SOURCES_SKEWC) $(JS_FLAGS) --output-file=$(BUILD)/skewc.cs.min.js --release
	diff $(BUILD)/skewc.min.js $(BUILD)/skewc.cs.min.js

release: compile-api compile-api-release compile-skewc-release | build
	type zopfli > /dev/null 2>&1 && (zopfli -c $(BUILD)/skew-api.min.js > $(BUILD)/skew-api.min.js.gz) || (gzip -c $(BUILD)/skew-api.min.js > $(BUILD)/skew-api.min.js.gz)
	ls -l $(BUILD)/skew-api.js $(BUILD)/skew-api.min.js $(BUILD)/skew-api.min.js.gz

watch:
	node_modules/.bin/watch src 'clear && make compile-api'

flex: src/frontend/lexer.sk

test: test-js test-cs

test-js: $(BUILD)/test.js $(BUILD)/test.min.js
	$(NODE) $(BUILD)/test.js
	$(NODE) $(BUILD)/test.min.js

test-cs: $(BUILD)/test.cs
	mcs -debug $(BUILD)/test.cs
	mono --debug $(BUILD)/test.exe
	rm -fr $(BUILD)/cs
	mkdir -p $(BUILD)/cs
	$(SKEWC) $(SOURCES_TEST) $(CS_FLAGS) --output-dir=$(BUILD)/cs
	mcs -debug $(BUILD)/cs/*.cs -out:$(BUILD)/test.exe
	mono --debug $(BUILD)/test.exe

publish: test check $(BUILD)/skew-api.min.js $(BUILD)/skewc.min.js
	cp $(BUILD)/skew-api.min.js npm/skew.js
	echo '#!/usr/bin/env node' > npm/skewc
	cat $(BUILD)/skewc.min.js >> npm/skewc
	chmod +x npm/skewc
	sh -c 'cd npm && npm version patch && npm publish'

# --------------------------------------------------

$(BUILD):
	mkdir -p build

$(BUILD)/skew-api.js: $(SOURCES_API) | $(BUILD)
	$(SKEWC) $^ $(JS_FLAGS) --output-file=$@

$(BUILD)/skew-api.min.js: $(SOURCES_API) | $(BUILD)
	$(SKEWC) $^ $(JS_FLAGS) --output-file=$@ --release

$(BUILD)/skewc.cs: $(SOURCES_SKEWC) | $(BUILD)
	$(SKEWC) $^ $(CS_FLAGS) --output-file=$@

$(BUILD)/skewc.js: $(SOURCES_SKEWC) | $(BUILD)
	$(SKEWC) $^ $(JS_FLAGS) --output-file=$@

$(BUILD)/skewc.min.js: $(SOURCES_SKEWC) | $(BUILD)
	$(SKEWC) $^ $(JS_FLAGS) --output-file=$@ --release

$(BUILD)/test.cs: $(SOURCES_TEST) | $(BUILD)
	$(SKEWC) $^ $(CS_FLAGS) --output-file=$@

$(BUILD)/test.js: $(SOURCES_TEST) | $(BUILD)
	$(SKEWC) $^ $(JS_FLAGS) --output-file=$@

$(BUILD)/test.min.js: $(SOURCES_TEST) | $(BUILD)
	$(SKEWC) $^ $(JS_FLAGS) --output-file=$@ --release

src/frontend/lexer.sk: src/frontend/flex.l
	sh -c 'cd src/frontend && python build.py'
