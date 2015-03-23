BUILD += node_modules/.bin/skewc
BUILD += src/**/*.sk
BUILD += --lib:terminal
BUILD += --lib:unicode
BUILD += --target=js
BUILD += --error-limit=18

build:
	$(BUILD) --output-file=browser.js
	$(BUILD) --output-file=browser.min.js --release

watch:
	node_modules/.bin/watch 'clear && make build' src

run: build
	node out.js
