var assert = require('assert');

function test(input, expected) {
  input = input.trim();
  it(input.replace(/\s+/g, ' '), function() {
    run(input, expected);
  });
}

function expect(output, expected) {
  assert.strictEqual(output.trim(), expected.trim());
}
