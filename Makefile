build:
	skewc src/**/*.sk --output-file=browser.js --lib:terminal --lib:unicode --target=js --error-limit=18
	skewc src/**/*.sk --output-file=browser.min.js --lib:terminal --lib:unicode --target=js --error-limit=18 --release

watch:
	watch 'clear && make build' src

run: build
	node out.js
