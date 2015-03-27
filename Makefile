BUILD += node_modules/.bin/skewc
BUILD += src/**/*.sk
BUILD += --lib:terminal
BUILD += --lib:unicode
BUILD += --target=js
BUILD += --error-limit=15

build:
	$(BUILD) --output-file=browser.js
	$(BUILD) --output-file=browser.min.js --release

watch:
	node_modules/.bin/watch src 'clear && make build'

run: build
	node out.js
