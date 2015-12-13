(function() {

  var compileTime = document.getElementById('compileTime');
  var input = document.getElementById('input');
  var optionArea = document.getElementById('optionArea');
  var outputCode = document.getElementById('outputCode');
  var outputLog = document.getElementById('outputLog');
  var targetArea = document.getElementById('targetArea');

  var targets = [
    {name: 'JavaScript', option: 'js', extension: 'js'},
    {name: 'C#', option: 'c#', extension: 'cs'},
    {name: 'C++', option: 'c++', extension: 'cpp'},
    {name: 'Lisp Tree', option: 'lisp-tree', extension: 'lisp'},
  ];
  var targetNames = targets.map(function(target) {
    return target.name;
  });

  var TARGET_INDEX = 'TARGET_INDEX';
  var CONSTANT_FOLDING = 'CONSTANT_FOLDING';
  var FUNCTION_INLINING = 'FUNCTION_INLINING';
  var GLOBALIZE = 'GLOBALIZE';
  var MANGLE = 'MANGLE';
  var MINIFY = 'MINIFY';
  var MULTIPLE_OUTPUTS = 'MULTIPLE_OUTPUTS';
  var SHOW_SYNTAX_TREE = 'SHOW_SYNTAX_TREE';
  var SOURCE_MAP = 'SOURCE_MAP';
  var STOP_AFTER_RESOLVE = 'STOP_AFTER_RESOLVE';
  var USE_WEB_WORKER = 'USE_WEB_WORKER';

  var compiler = null;
  var start = null;
  var worker = null;
  var isBusy = false;
  var pendingMessage = null;

  function configGetBool(name) {
    return configGet(name) === 'true';
  }

  function configGet(name) {
    return localStorage.getItem(name);
  }

  function configSet(name, index) {
    localStorage.setItem(name, index);
  }

  function now() {
    return window.performance && performance.now ? performance.now() : +new Date;
  }

  function handleResult(result) {
    outputLog.value = result.log.text;
    outputCode.value = result.outputs.length === 1 ? result.outputs[0].contents :
      result.outputs.map(function(source) { return '[' + source.name + ']\n' + source.contents; }).join('\n');
    compileTime.textContent = +(now() - start).toFixed(1) + 'ms';
  }

  function update() {
    var index = targetNames.indexOf(configGet(TARGET_INDEX));
    var target = targets[index === -1 ? 0 : index];
    var options = {};
    options.outputFile = 'compiled.' + target.extension;
    options.inputs = [{name: '<stdin>', contents: input.value}];
    if (configGetBool(CONSTANT_FOLDING)) options.foldAllConstants = true;
    if (configGetBool(FUNCTION_INLINING)) options.inlineAllFunctions = true;
    if (configGetBool(GLOBALIZE)) options.globalizeAllFunctions = true;
    if (configGetBool(MANGLE)) options.jsMangle = true;
    if (configGetBool(MINIFY)) options.jsMinify = true;
    if (configGetBool(SOURCE_MAP)) options.jsSourceMap = true;
    if (configGetBool(STOP_AFTER_RESOLVE)) options.stopAfterResolve = true;
    if (configGetBool(MULTIPLE_OUTPUTS)) options.outputDirectory = 'output';
    if (configGetBool(USE_WEB_WORKER)) {
      if (!worker) {
        worker = new Worker(document.getElementById('skew-api').src);
        worker.onmessage = function(e) {
          if (pendingMessage) {
            start = now();
            worker.postMessage(pendingMessage);
            pendingMessage = null;
          } else {
            isBusy = false;
            handleResult(e.data);
          }
        };
      }
      options.type = 'compile';
      if (isBusy) {
        pendingMessage = options;
      } else {
        start = now();
        worker.postMessage(options);
        isBusy = true;
      }
    } else {
      start = now();
      if (compiler === null) {
        compiler = Skew.create();
      }
      handleResult(compiler.compile(options));
    }
  }

  function createSelect(values, name) {
    var element = document.createElement('select');
    for (var i = 0; i < values.length; i++) {
      var option = document.createElement('option');
      option.textContent = values[i];
      element.appendChild(option);
    }
    element.selectedIndex = values.indexOf(configGet(name));
    element.onchange = function() {
      configSet(name, values[element.selectedIndex]);
      update();
    };
    return element;
  }

  function createCheckbox(label, name) {
    var element = document.createElement('label');
    var checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = configGetBool(name);
    checkbox.onchange = function() {
      configSet(name, checkbox.checked);
      update();
    };
    element.appendChild(checkbox);
    element.appendChild(document.createTextNode(' ' + label));
    return element;
  }

  function main() {
    targetArea.appendChild(createSelect(targetNames, TARGET_INDEX));
    optionArea.appendChild(createCheckbox('Constant folding', CONSTANT_FOLDING));
    optionArea.appendChild(createCheckbox('Inlining', FUNCTION_INLINING));
    optionArea.appendChild(createCheckbox('Mangle', MANGLE));
    optionArea.appendChild(createCheckbox('Minify', MINIFY));
    optionArea.appendChild(createCheckbox('Globalize', GLOBALIZE));
    optionArea.appendChild(createCheckbox('Syntax tree', SHOW_SYNTAX_TREE));
    optionArea.appendChild(createCheckbox('Source map', SOURCE_MAP));
    optionArea.appendChild(createCheckbox('IDE mode (no output)', STOP_AFTER_RESOLVE));
    optionArea.appendChild(createCheckbox('Multiple outputs', MULTIPLE_OUTPUTS));
    optionArea.appendChild(createCheckbox('Use a web worker', USE_WEB_WORKER));
    input.oninput = update;
    update();
  }

  main();

})();
