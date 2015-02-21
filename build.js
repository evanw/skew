#!/usr/bin/env node

var child_process = require('child_process');
var path = require('path');
var fs = require('fs');
var tasks = {};

////////////////////////////////////////////////////////////////////////////////

var BUILD_DIR = 'out';
var NPM_DIR = 'npm';

var DEBUG_DIR = BUILD_DIR + '/debug';
var RELEASE_DIR = BUILD_DIR + '/release';

////////////////////////////////////////////////////////////////////////////////

var SOURCES = [
  'src/ast/content.sk',
  'src/ast/create.sk',
  'src/ast/get.sk',
  'src/ast/logic.sk',
  'src/ast/node.sk',
  'src/ast/operators.sk',

  'src/compiler/collector.sk',
  'src/compiler/compiler.sk',
  'src/compiler/now.sk',

  'src/core/log.sk',
  'src/core/range.sk',
  'src/core/source.sk',
  'src/core/support.sk',

  'src/emitters/base.sk',
  'src/emitters/cpp.sk',
  'src/emitters/joined.sk',
  'src/emitters/json.sk',
  'src/emitters/lisp.sk',
  'src/emitters/ruby.sk',
  'src/emitters/xml.sk',

  'src/js/emitter.sk',
  'src/js/patcher.sk',
  'src/js/sourcemap.sk',

  'src/lexer/lexer.sk',
  'src/lexer/token.sk',

  'src/parser/diagnostics.sk',
  'src/parser/literals.sk',
  'src/parser/parser.sk',
  'src/parser/pratt.sk',

  'src/resolver/callgraph.sk',
  'src/resolver/constantfolding.sk',
  'src/resolver/diagnostics.sk',
  'src/resolver/functioninlining.sk',
  'src/resolver/globalize.sk',
  'src/resolver/member.sk',
  'src/resolver/resolver.sk',
  'src/resolver/scope.sk',
  'src/resolver/symbol.sk',
  'src/resolver/symbolmotion.sk',
  'src/resolver/treeshaking.sk',
  'src/resolver/type.sk',
  'src/resolver/typecache.sk',
];

var FRONTEND_SOURCES = SOURCES.concat([
  'frontend/diagnostics.sk',
  'frontend/frontend.sk',
  'frontend/io.sk',
  'frontend/options.sk',
]);

var LIVE_SOURCES = SOURCES.concat([
  'tests/live/worker.sk',
]);

var TEST_SOURCES = SOURCES.concat([
  'tests/system/common.sk',
  'tests/system/core/access.sk',
  'tests/system/core/annotations.sk',
  'tests/system/core/calls.sk',
  'tests/system/core/const.sk',
  'tests/system/core/constructors.sk',
  'tests/system/core/conversions.sk',
  'tests/system/core/cyclic.sk',
  'tests/system/core/enums.sk',
  'tests/system/core/expressions.sk',
  'tests/system/core/formatting.sk',
  'tests/system/core/functions.sk',
  'tests/system/core/generics.sk',
  'tests/system/core/lists.sk',
  'tests/system/core/merging.sk',
  'tests/system/core/modifiers.sk',
  'tests/system/core/objects.sk',
  'tests/system/core/parsing.sk',
  'tests/system/core/preprocessor.sk',
  'tests/system/core/purity.sk',
  'tests/system/core/statements.sk',
  'tests/system/core/static.sk',
  'tests/system/core/switch.sk',
  'tests/system/core/trycatch.sk',
  'tests/system/core/types.sk',
  'tests/system/core/using.sk',
  'tests/system/core/var.sk',

  'tests/system/cpp/annotations.sk',
  'tests/system/cpp/expressions.sk',
  'tests/system/cpp/functions.sk',
  'tests/system/cpp/needsinclude.sk',
  'tests/system/cpp/objects.sk',
  'tests/system/cpp/release.sk',
  'tests/system/cpp/statements.sk',

  'tests/system/js/annotations.sk',
  'tests/system/js/expressions.sk',
  'tests/system/js/functions.sk',
  'tests/system/js/inlining.sk',
  'tests/system/js/minify.sk',
  'tests/system/js/objects.sk',
  'tests/system/js/statements.sk',

  'tests/system/ruby/expressions.sk',
  'tests/system/ruby/statements.sk',
]);

////////////////////////////////////////////////////////////////////////////////

['js', 'cpp', 'ruby'].forEach(function(target) {
  var language = { 'js': 'JavaScript', 'cpp': 'C++', 'ruby': 'Ruby' }[target];
  var extension = { 'js': 'js', 'cpp': 'cpp', 'ruby': 'rb' }[target];

  ['debug', 'release'].forEach(function(build) {
    var directory = { 'debug': DEBUG_DIR, 'release': RELEASE_DIR }[build];
    var release = build === 'release';
    var suffix = release ? '-release' : '';
    var options = {
      target: target,
      sources: FRONTEND_SOURCES,
      release: release,
      binary: directory + '/skewc',
      output: directory + '/skewc.' + extension,
    };

    task(target + suffix, function(done) {
      compile(options, done);
    }).describe('Build the frontend using ' + language + ' in ' + build + ' mode');

    task(target + suffix + '-test', function(done) {
      compile(Object.create(options, {
        sources: { value: TEST_SOURCES },
        binary: { value: directory + '/tests' },
        output: { value: directory + '/tests.' + extension },
      }), function(result) {
        result.run([], done);
      });
    }).describe('Run the frontend tests using ' + language + ' in ' + build + ' mode');

    task(target + suffix + '-check', function(done) {
      iterativeCompile(Object.create(options, {
        iterations: { value: 3 },
      }), done);
    }).describe('Run the frontend through itself a few times using ' + language + ' in ' + build + ' mode');

    task(target + suffix + '-stress', function(done) {
      stressCompile(options, done);
    }).describe('Time the frontend compiling increasing copies of itself using ' + language + ' in ' + build + ' mode');
  });
});

task('live', function(done) {
  compile({
    target: 'js',
    config: 'browser',
    sources: LIVE_SOURCES,
    output: DEBUG_DIR + '/live.js',
  }, done);
}).describe('Build the frontend for tests/live/index.html');

task('clean', function(done) {
  run(['rm', '-fr', BUILD_DIR], done);
}).describe('Remove the build directory');

task('replace', function(done) {
  run(['cp', DEBUG_DIR + '/skewc.js', 'skewc.js'], done);
}).requires(['js-check']).describe('Replace the current frontend with a newer version of itself');

task('publish', function(done) {
  run(['npm', 'version', 'patch'], { cwd: NPM_DIR }, function() {
    compile({ target: 'js', sources: FRONTEND_SOURCES, output: NPM_DIR + '/compiled.js', sourceMap: false }, function() {
      compile({ target: 'cpp', sources: FRONTEND_SOURCES, config: 'osx', output: NPM_DIR + '/skewc.unix.cpp' }, function() {
        compile({ target: 'cpp', sources: FRONTEND_SOURCES, config: 'windows', output: NPM_DIR + '/skewc.windows.cpp' }, function() {
          run(['npm', 'publish'], { cwd: NPM_DIR }, function() {
            done();
          });
        });
      });
    });
  });
}).describe('Bump the npm patch number and publish the build to npm');

////////////////////////////////////////////////////////////////////////////////

function stressCompile(options, done) {
  function duplicateCode(code, times) {
    var source = '';
    for (var i = 0; i < times; i++) {
      source += 'namespace ns' + i + ' {\n' + code + '}\n';
    }
    source += '@EntryPoint void main(List<string> args) {\n';
    for (var i = 0; i < times; i++) {
      source += '  ns' + i + '.frontend.main(args);\n';
    }
    source += '}\n';
    return source;
  }

  function measureCompileTime(result, code, iterations, done) {
    function next() {
      if (iterations--) {
        result.run([file, '--target=js', '--output-file=' + DEBUG_DIR + '/joined.js', '--release'], function() {
          next();
        });
      } else {
        done({
          size: code.length,
          lines: lineCount,
          ms: (Date.now() - start) / 3,
        });
      }
    }
    var lineCount = code.split('\n').length;
    fs.writeFileSync(file, code);
    var start = Date.now();
    next();
  }

  function produceReport(result, code, done) {
    function next() {
      if (counter++ < iterations) {
        log('info', 'duplication: ' + counter + 'x');
        measureCompileTime(result, duplicateCode(code, counter), 3, function(data) {
          report.push([counter, data.size, data.lines, data.ms].join('\t'));
          next();
        });
      } else {
        done(report);
      }
    }
    var report = ['Count\tCode (bytes)\tLOC (lines)\tTime (ms)'];
    var iterations = 10;
    var counter = 0;
    next();
  }

  var file = DEBUG_DIR + '/joined.sk';
  compile(options, function(result) {
    compile({ target: 'joined', sources: FRONTEND_SOURCES, output: file }, function() {
      var code = fs.readFileSync(file, 'utf8').replace(/\n *@EntryPoint\n/, '\n');
      produceReport(result, code, function(report) {
        console.log(report.join('\n'));
        done();
      });
    });
  });
}

function iterativeCompile(options, done) {
  function next() {
    if (remaining--) {
      compile(options, function(result) {
        options.skewc = result.run;
        next();
      });
    } else {
      done();
    }
  }
  var remaining = options.iterations;
  next();
}

function compile(options, done) {
  prepareForFile(options.output, function() {
    var skewc = options.skewc || function(args, done) {
      run(['node', 'skewc'].concat(args), function() {
        done();
      });
    };
    var flags = options.sources.slice();

    if (!options.quiet) {
      flags.push('--verbose');
    }
    if (options.config) {
      flags.push('--config=' + options.config);
    } else if (options.target === 'js') {
      flags.push('--config=node');
    }
    flags.push('--target=' + options.target);
    flags.push('--output-file=' + options.output);

    switch (options.target) {
      case 'js': {
        if (options.release) {
          flags.push('--release');
        }
        if (options.sourceMap !== false) {
          flags.push('--source-map');
        }
        skewc(flags, function() {
          done({
            run: function(args, done) {
              run(['node', options.output].concat(args), done);
            },
          });
        });
        break;
      }

      case 'cpp': {
        skewc(flags, function() {
          if (options.binary) {
            var clang = ['clang++', options.output, '-std=c++11', '-ferror-limit=0', '-o', options.binary];
            if (options.release) {
              clang.push('-O3', '-DNDEBUG', '-fno-exceptions', '-fno-rtti', '-fomit-frame-pointer', '-fvisibility=hidden');
            }
            prepareForFile(options.binary, function() {
              run(clang, function() {
                done({
                  run: function(args, done) {
                    run([options.binary].concat(args), done);
                  },
                });
              });
            });
          } else {
            done();
          }
        });
        break;
      }

      case 'ruby': {
        skewc(flags, function() {
          done({
            run: function(args, done) {
              run(['ruby', options.output].concat(args), done);
            },
          });
        });
        break;
      }

      case 'joined': {
        skewc(flags, function() {
          done();
        });
        break;
      }

      default: {
        die('bad target: ' + JSON.stringify(options.target));
        break;
      }
    }
  });
}

function log(kind, text) {
  console.log((process.stdout.isTTY ? '\x1B[0;' + { info: 90, error: 91 }[kind] + 'm[' + kind + ']\x1B[0m ' : '[' + kind + '] ') + text);
}

function task(name, callback) {
  var task = {
    dependencies: [],
    description: '',
    requires: function(dependencies) {
      [].push.apply(this.dependencies, dependencies);
      return this;
    },
    describe: function(value) {
      this.description = value;
      return this;
    },
    run: function(done) {
      log('info', 'task: ' + name);
      serialize(task.dependencies, function(name, next) {
        if (name in tasks) {
          tasks[name].run(next);
        } else {
          die('unknown task: ' + JSON.stringify(name));
        }
      }, function() {
        if (callback) {
          callback(done);
        } else {
          done();
        }
      });
    },
  };
  tasks[name] = task;
  return task;
}

function prepareForFile(file, done) {
  var directory = path.dirname(file);
  if (!fs.existsSync(directory)) {
    run(['mkdir', '-p', directory], function() {
      done();
    });
  } else {
    done();
  }
}

function run(command, options, done) {
  if (!done) {
    done = options;
    options = null;
  }
  options = options || {};
  log('info', command.map(function(arg) {
    return /[^\.\w\/\-\+=]/.test(arg) ? "'" + arg.replace(/'/g, "'\\''") + "'" : arg;
  }).join(' '));
  child_process.spawn(command[0], command.slice(1), { stdio: 'inherit', cwd: options.cwd }).on('exit', function(code) {
    if (code !== 0) {
      die('child process ' + JSON.stringify(command[0]) + ' exited with code ' + code);
    }
    done();
  });
}

function serialize(values, callback, done) {
  function next() {
    var value = slice.shift();
    if (value) {
      callback(value, next);
    } else if (done) {
      done();
    }
  }
  var slice = values.slice();
  next();
}

function die(text) {
  log('error', text);
  process.exit(1);
}

function printHelp() {
  var names = Object.keys(tasks);
  var spaces = new Array(5 + names.reduce(function(a, b) { return Math.max(a, b.length); }, 0)).join(' ');
  log('info', 'available tasks:\n' + names.map(function(name) {
    return name + spaces.slice(name.length) + tasks[name].description;
  }).join('\n'));
}

function main() {
  var start = Date.now();
  var args = process.argv.slice(2).map(function(name) {
    if (name in tasks) {
      return tasks[name];
    }
    die('unknown task: ' + JSON.stringify(name));
  });
  if (!args.length) {
    printHelp();
    return;
  }
  serialize(args, function(task, next) {
    task.run(next);
  }, function() {
    log('info', 'finished in ' + ((Date.now() - start) / 1000).toFixed(1) + 's');
  });
}

main();
