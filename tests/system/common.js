var assert = require('assert');

function test(input, expected) {
  input = input.trim();
  it(input.replace(/\s+/g, ' '), function() {
    run(input, expected);
  });
}

function testJS(input, expected) {
  input = input.trim();
  it(input.replace(/\s+/g, ' '), function() {
    runJS(input, expected);
  });
}

function testMinify(input, expected) {
  input = input.trim();
  it(input.replace(/\s+/g, ' '), function() {
    runMinify(input, expected);
  });
}

function expect(output, expected) {
  assert.strictEqual(output.trim(), expected.trim());
}

start();
