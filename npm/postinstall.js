var child_process = require('child_process');
var https = require('https');
var path = require('path');
var zlib = require('zlib');
var fs = require('fs');
var version = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8')).version;

function downloadRelease(name, callback) {
  var url = 'https://github.com/evanw/skew/releases/download/' + version + '/' + name + '.gz';
  https.get(url, function(res) {
    if (res.statusCode === 302 && res.headers.location) {
      https.get(res.headers.location, function(res2) {
        var absolute = path.join(__dirname, name);
        var file = fs.createWriteStream(absolute, {mode: 0755});
        var gunzip = zlib.createGunzip();
        res2.pipe(gunzip).pipe(file).on('finish', function() {
          callback(absolute);
        });
      });
    }
  });
}

function verifyRelease(absolute, callback) {
  var compiler = child_process.spawn(absolute, ['--version']);
  var chunks = [];
  compiler.stdout.on('data', function(chunk) {
    chunks.push(chunk);
  });
  compiler.on('close', function(code) {
    if (code === 0 && chunks.join('').trim() === version) {
      callback();
    }
  });
}

function installRelease(absolute) {
  fs.renameSync(absolute, path.join(__dirname, 'skewc'));
}

function main() {
  if (process.platform === 'darwin' && process.arch === 'x64') {
    downloadRelease('skewc.osx.64', function(absolute) {
      verifyRelease(absolute, function() {
        installRelease(absolute);
      });
    });
  }
}

main();
