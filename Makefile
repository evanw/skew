SKEWC = node skewc.js

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

default: build/skewc.js build/skew-api.js

.PHONY: default clean flex watch check check-js check-cs check-determinism test test-js test-cs replace release publish

build/skewc.js: $(SOURCES_SKEWC) | build
	$(SKEWC) $(SOURCES_SKEWC) $(JS_FLAGS) --output-file=build/skewc.js
build/skewc.min.js: $(SOURCES_SKEWC) | build
	$(SKEWC) $(SOURCES_SKEWC) $(JS_FLAGS) --output-file=build/skewc.min.js --release

build/skew-api.js: $(SOURCES_API) | build
	$(SKEWC) $(SOURCES_API) $(JS_FLAGS) --output-file=build/skew-api.js
build/skew-api.min.js: $(SOURCES_API) | build
	$(SKEWC) $(SOURCES_API) $(JS_FLAGS) --output-file=build/skew-api.min.js --release
build/skew-api.min.js.gz: build/skew-api.min.js
	type zopfli > /dev/null 2>&1 && (zopfli -c build/skew-api.min.js > build/skew-api.min.js.gz) || (gzip -c build/skew-api.min.js > build/skew-api.min.js.gz)

replace: build/skewc.js
	node build/skewc.js $(SOURCES_SKEWC) $(JS_FLAGS) --output-file=build/skewc2.js
	node build/skewc2.js $(SOURCES_SKEWC) $(JS_FLAGS) --output-file=build/skewc3.js
	diff build/skewc2.js build/skewc3.js
	mv build/skewc3.js skewc.js
	rm build/skewc2.js

check: check-js check-cs check-determinism

check-js: build/skewc.min.js
	node build/skewc.min.js $(SOURCES_SKEWC) $(JS_FLAGS) --output-file=build/skewc2.min.js --release
	node build/skewc2.min.js $(SOURCES_SKEWC) $(JS_FLAGS) --output-file=build/skewc3.min.js --release
	diff build/skewc2.min.js build/skewc3.min.js

build/skewc.cs: $(SOURCES_SKEWC) | build
	$(SKEWC) $(SOURCES_SKEWC) $(CS_FLAGS) --output-file=build/skewc.cs

check-cs: build/skewc.cs
	mcs -debug build/skewc.cs
	mono --debug build/skewc.exe $(SOURCES_SKEWC) $(CS_FLAGS) --output-file=build/skewc2.cs
	mcs -debug build/skewc2.cs
	mono --debug build/skewc2.exe $(SOURCES_SKEWC) $(CS_FLAGS) --output-file=build/skewc3.cs
	diff build/skewc2.cs build/skewc3.cs

check-determinism: build/skewc.js build/skewc.cs build/skewc.min.js
	# Debug
	mcs -debug build/skewc.cs
	mono --debug build/skewc.exe $(SOURCES_SKEWC) $(JS_FLAGS) --output-file=build/skewc.cs.js
	diff build/skewc.js build/skewc.cs.js

	# Release
	mcs -debug build/skewc.cs
	mono --debug build/skewc.exe $(SOURCES_SKEWC) $(JS_FLAGS) --release --output-file=build/skewc.cs.min.js
	diff build/skewc.min.js build/skewc.cs.min.js

release: build/skewc.min.js build/skew-api.js build/skew-api.min.js build/skew-api.min.js.gz
	ls -l build/skew-api.js build/skew-api.min.js build/skew-api.min.js.gz

watch:
	node_modules/.bin/watch src 'clear && make build/skew-api.js'

build:
	mkdir -p build

flex: src/frontend/lexer.sk
src/frontend/lexer.sk: src/frontend/flex.l
	sh -c 'cd src/frontend && python build.py'

test: test-js test-cs

test-js: build/test.js build/test.min.js
	node build/test.js
	node build/test.min.js
build/test.js: $(SOURCES_TEST) | build
	$(SKEWC) $(SOURCES_TEST) $(JS_FLAGS) --output-file=build/test.js
build/test.min.js: $(SOURCES_TEST) | build
	$(SKEWC) $(SOURCES_TEST) $(JS_FLAGS) --output-file=build/test.min.js --release

test-cs: build/test.cs
	mcs -debug build/test.cs
	mono --debug build/test.exe
	rm -fr build/cs
	mkdir -p build/cs
	$(SKEWC) $(SOURCES_TEST) $(CS_FLAGS) --output-dir=build/cs
	mcs -debug build/cs/*.cs -out:build/test.exe
	mono --debug build/test.exe
build/test.cs: $(SOURCES_TEST) | build
	$(SKEWC) $(SOURCES_TEST) $(CS_FLAGS) --output-file=build/test.cs

clean:
	rm -fr build
	rm -f npm/*.js

publish: test check build/skewc.min.js build/skew-api.min.js
	cp build/skew-api.min.js npm/skew.js
	echo '#!/usr/bin/env node' > npm/skewc
	cat build/skewc.min.js >> npm/skewc
	chmod +x npm/skewc
	sh -c 'cd npm && npm version patch && npm publish'
