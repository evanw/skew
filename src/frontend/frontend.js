if (typeof process !== 'undefined') {
  var fs = require('fs');
  var io = io || {};

  io.terminalWidth = process.stdout.columns;

  io.setColor = function(color) {
    if (process.stdout.isTTY) {
      process.stdout.write('\x1B[' + color + 'm');
    }
  };

  io.print = function(text) {
    process.stdout.write(text);
  };

  io.readFile = function(path) {
    try {
      return new Source(path, fs['readFileSync'](path, 'utf8'));
    } catch (e) {
      return null;
    }
  };

  io.writeFile = function(path, contents) {
    try {
      fs['writeFileSync'](path, contents);
      return true;
    } catch (e) {
      return false;
    }
  };

  process.exit(frontend.main(process.argv.slice(2)));
}
