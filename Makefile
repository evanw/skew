SOURCES += src/backend/*.sk
SOURCES += src/core/*.sk
SOURCES += src/frontend/*.sk
SOURCES += src/middle/*.sk

SOURCES_NODE += $(SOURCES)
SOURCES_NODE += src/driver/node.sk
SOURCES_NODE += src/driver/options.sk
SOURCES_NODE += src/lib/io.sk
SOURCES_NODE += src/lib/terminal.sk

SOURCES_BROWSER += $(SOURCES)
SOURCES_BROWSER += src/driver/browser.sk

SOURCES_TEST += $(SOURCES)
SOURCES_TEST += src/driver/tests.sk
SOURCES_TEST += src/lib/terminal.sk
SOURCES_TEST += src/lib/timestamp.sk
SOURCES_TEST += src/lib/unit.sk
SOURCES_TEST += tests/simple.sk

default: compile

compile: | build
	node skewc.js $(SOURCES_NODE) --output-file=build/node.js
	node skewc.js $(SOURCES_BROWSER) --output-file=build/browser.js

replace: | build
	node skewc.js $(SOURCES_NODE) --output-file=build/node.js
	node build/node.js $(SOURCES_NODE) --output-file=build/node2.js
	node build/node2.js $(SOURCES_NODE) --output-file=build/node3.js
	cmp -s build/node2.js build/node3.js
	mv build/node3.js skewc.js
	rm build/node2.js

watch:
	node_modules/.bin/watch src 'clear && make compile'

build:
	mkdir -p build

flex:
	cd src/frontend && python build.py && cd -

test:
	node skewc.js $(SOURCES_TEST) --output-file=build/test.js
	mocha build/test.js
