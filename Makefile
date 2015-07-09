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

CS_FLAGS += --target=cs
CS_FLAGS += --inline-functions

default: compile-skewc compile-browser

compile-skewc: | build
	node skewc.js $(SOURCES_SKEWC) $(JS_FLAGS) --output-file=build/skewc.js

compile-browser: | build
	node skewc.js $(SOURCES_BROWSER) $(JS_FLAGS) --output-file=build/browser.js

replace: | build
	node skewc.js $(SOURCES_SKEWC) $(JS_FLAGS) --output-file=build/skewc.js
	node build/skewc.js $(SOURCES_SKEWC) $(JS_FLAGS) --output-file=build/skewc2.js
	node build/skewc2.js $(SOURCES_SKEWC) $(JS_FLAGS) --output-file=build/skewc3.js
	cmp -s build/skewc2.js build/skewc3.js
	mv build/skewc3.js skewc.js
	rm build/skewc2.js

check-cs: | build
	node skewc.js $(SOURCES_SKEWC) $(CS_FLAGS) --output-file=build/skewc.cs
	mcs build/skewc.cs
	mono build/skewc.exe $(SOURCES_SKEWC) $(CS_FLAGS) --output-file=build/skewc2.cs
	mcs build/skewc2.cs
	mono build/skewc2.exe $(SOURCES_SKEWC) $(CS_FLAGS) --output-file=build/skewc3.cs
	cmp -s build/skewc2.cs build/skewc3.cs
	rm build/skewc2.cs build/skewc3.cs build/skewc2.exe

release: | build
	node skewc.js $(SOURCES_SKEWC) $(JS_FLAGS) --release --output-file=build/skewc.min.js
	gzip -c build/skewc.min.js > build/skewc.min.js.gz
	du -h skewc.js build/skewc.min.js build/skewc.min.js.gz

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

test-cs:
	node skewc.js $(SOURCES_TEST) $(CS_FLAGS) --output-file=build/test.cs
	mcs -debug build/test.cs
	mono --debug build/test.exe
