BUILD += node_modules/.bin/skewc
BUILD += src/backend/*.sk
BUILD += src/core/*.sk
BUILD += src/frontend/*.sk
BUILD += src/middle/*.sk
BUILD += --lib:terminal
BUILD += --lib:unicode
BUILD += --target=js
BUILD += --error-limit=15

build:
	$(BUILD) src/tests/*.sk --lib:unit --output-file=tests.js --config=node
	$(BUILD) src/driver/browser.sk --output-file=browser.js
	$(BUILD) src/driver/browser.sk --output-file=browser.min.js --release

watch:
	node_modules/.bin/watch src 'clear && make build'

test:
	$(BUILD) src/tests/*.sk --lib:unit --output-file=tests.js --config=node
	node tests.js

run: build
	node out.js
