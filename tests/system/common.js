var assert = require('assert');

function registerTest(input, callback) {
  it(input.replace(/\s+/g, ' '), callback);
}

function expect(output, expected) {
  assert.strictEqual(output.trim(), expected.trim());
}

start();
