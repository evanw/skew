var assert = require('assert');

function test(input, expected) {
  it(input.trim().replace(/\s+/g, ' '), function() {
    run(input, expected);
  });
}

function expect(output, expected) {
  assert.strictEqual(output.trim(), expected.trim());
}
