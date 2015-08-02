SOURCES += src/backend/*.sk
SOURCES += src/core/*.sk
SOURCES += src/frontend/*.sk
SOURCES += src/lib/timestamp.sk
SOURCES += src/lib/unicode.sk
SOURCES += src/middle/*.sk

SOURCES_SKEWC += $(SOURCES)
SOURCES_SKEWC += src/driver/node.sk
SOURCES_SKEWC += src/driver/options.sk
SOURCES_SKEWC += src/lib/io.sk
SOURCES_SKEWC += src/lib/terminal.sk

SOURCES_BROWSER += $(SOURCES)
SOURCES_BROWSER += src/driver/browser.sk

SOURCES_TEST += $(SOURCES)
SOURCES_TEST += src/driver/tests.sk
SOURCES_TEST += src/lib/terminal.sk
SOURCES_TEST += src/lib/unit.sk
SOURCES_TEST += tests/simple.sk

JS_FLAGS += --target=js
JS_FLAGS += --inline-functions
JS_FLAGS += --verbose
JS_FLAGS += --message-limit=0

CS_FLAGS += --target=cs
CS_FLAGS += --inline-functions
CS_FLAGS += --verbose
CS_FLAGS += --message-limit=0

default: compile-skewc compile-browser

compile-skewc: | build
	node skewc.js $(SOURCES_SKEWC) $(JS_FLAGS) --output-file=build/skewc.js

compile-browser: | build
	node skewc.js $(SOURCES_BROWSER) $(JS_FLAGS) --output-file=build/browser.js --js-source-map

replace: | build
	node skewc.js $(SOURCES_SKEWC) $(JS_FLAGS) --output-file=build/skewc.js
	node build/skewc.js $(SOURCES_SKEWC) $(JS_FLAGS) --output-file=build/skewc2.js
	node build/skewc2.js $(SOURCES_SKEWC) $(JS_FLAGS) --output-file=build/skewc3.js
	cmp -s build/skewc2.js build/skewc3.js
	mv build/skewc3.js skewc.js
	rm build/skewc2.js

check-js: | build
	node skewc.js $(SOURCES_SKEWC) $(JS_FLAGS) --output-file=build/skewc.min.js --release
	node build/skewc.min.js $(SOURCES_SKEWC) $(JS_FLAGS) --output-file=build/skewc2.min.js --release
	node build/skewc2.min.js $(SOURCES_SKEWC) $(JS_FLAGS) --output-file=build/skewc3.min.js --release
	cmp -s build/skewc2.min.js build/skewc3.min.js

check-cs: | build
	node skewc.js $(SOURCES_SKEWC) $(CS_FLAGS) --output-file=build/skewc.cs
	mcs build/skewc.cs
	mono build/skewc.exe $(SOURCES_SKEWC) $(CS_FLAGS) --output-file=build/skewc2.cs
	mcs build/skewc2.cs
	mono build/skewc2.exe $(SOURCES_SKEWC) $(CS_FLAGS) --output-file=build/skewc3.cs
	cmp -s build/skewc2.cs build/skewc3.cs

release: compile-browser | build
	node skewc.js $(SOURCES_SKEWC) $(JS_FLAGS) --release --output-file=build/skewc.min.js
	node skewc.js $(SOURCES_BROWSER) $(JS_FLAGS) --release --output-file=build/browser.min.js
	gzip -c build/browser.min.js > build/browser.min.js.gz
	du -h build/browser.js build/browser.min.js build/browser.min.js.gz

watch:
	node_modules/.bin/watch src 'clear && make compile-browser'

build:
	mkdir -p build

flex:
	cd src/frontend && python build.py && cd -

test: test-js test-cs

test-js:
	node skewc.js $(SOURCES_TEST) $(JS_FLAGS) --output-file=build/test.js
	node build/test.js
	node skewc.js $(SOURCES_TEST) $(JS_FLAGS) --output-file=build/test.min.js --release
	node build/test.min.js

test-cs:
	node skewc.js $(SOURCES_TEST) $(CS_FLAGS) --output-file=build/test.cs
	mcs -debug build/test.cs
	mono --debug build/test.exe

clean:
	rm -fr build
