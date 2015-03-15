build:
	skewc src/**/*.sk --output-file=out.js --lib:terminal --lib:unicode --target=js --config=node
	skewc src/**/*.sk --output-file=browser.js --lib:terminal --lib:unicode --target=js --config=browser

watch:
	watch src make build

run: build
	node out.js
