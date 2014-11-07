var assert = require('assert');

function registerTest(test) {
  it(test.input.replace(/\s+/g, ' '), function() {
    test.run();
  });
}

function expect(output, expected) {
  assert.strictEqual(output.trim(), expected.trim());
}

start();
