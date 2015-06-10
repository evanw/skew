SOURCES += src/backend/*.sk
SOURCES += src/core/*.sk
SOURCES += src/frontend/*.sk
SOURCES += src/middle/*.sk

default: compile

compile: | build
	node skewc.js $(SOURCES) src/driver/node.sk > build/node.js
	node skewc.js $(SOURCES) src/driver/browser.sk > build/browser.js

replace: | build
	node skewc.js $(SOURCES) src/driver/node.sk > build/node.js
	node build/node.js $(SOURCES) src/driver/node.sk > build/node2.js
	node build/node2.js $(SOURCES) src/driver/node.sk > build/node3.js
	cmp -s build/node2.js build/node3.js
	mv build/node3.js skewc.js
	rm build/node2.js

watch:
	node_modules/.bin/watch src 'clear && make build'

build:
	mkdir -p build

flex:
	cd src/frontend && python build.py && cd -
