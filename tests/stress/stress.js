var child_process = require('child_process');
var fs = require('fs');

var code = fs.readFileSync(process.argv[2], 'utf8').replace(/\n[ \t]*@EntryPoint\n/, '\n');
var binary = process.argv[3];
var dir = process.argv[4];

function time(count, callback) {
  var sourcePath = dir + '/source.sk';
  var source = '';
  for (var i = 0; i < count; i++) {
    source += 'namespace ns' + i + ' {\n' + code + '}\n';
  }
  source += '@EntryPoint void main(List<string> args) {\n';
  for (var i = 0; i < count; i++) {
    source += '  ns' + i + '.frontend.main(args);\n';
  }
  source += '}\n';
  fs.writeFileSync(sourcePath, source);
  var args = [sourcePath, '--target=js', '--output-file=' + dir + '/target.js', '--release'];
  var start = Date.now();
  var process = child_process.spawn(binary, args, { stdio: 'inherit' });
  process.on('close', function() {
    var process = child_process.spawn(binary, args, { stdio: 'inherit' });
    process.on('close', function() {
      var process = child_process.spawn(binary, args, { stdio: 'inherit' });
      process.on('close', function() {
        var end = Date.now();
        callback({
          size: source.length,
          lines: lineCount * count,
          ms: (end - start) / 3,
        });
      });
    });
  });
}

function next() {
  counter++;
  if (counter <= 10) {
    time(counter, function(data) {
      console.log([counter, data.size, data.lines, data.ms].join('\t'));
      next();
    });
  }
}

// The expected time complexity of the compiler should be linear
var lineCount = code.split('\n').length;
var counter = 0;
console.log('Count\tCode (bytes)\tLOC (lines)\tTime (ms)');
next();
