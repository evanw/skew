// This file is just to bootstrap the compiler so it compiles itself. The need
// for this file will disappear entirely when the compiler is finished.

function IntMap() {
  this._table = Object.create(null);
}

IntMap.prototype.get = function(key) {
  return this._table[key];
};

IntMap.prototype.getOrDefault = function(key, defaultValue) {
  return this._table[key] || defaultValue;
};

IntMap.prototype.set = function(key, value) {
  this._table[key] = value;
};

IntMap.prototype.has = function(key) {
  return key in this._table;
};

IntMap.prototype.remove = function(key) {
  delete this._table[key];
};

IntMap.prototype.keys = function() {
  var keys = [];
  for (var key in this._table) {
    if (this._table[key] !== void 0) {
      keys.push(0 | key);
    }
  }
  return keys;
};

IntMap.prototype.values = function() {
  var values = [];
  for (var key in this._table) {
    var value = this._table[key];
    if (value !== void 0) {
      values.push(value);
    }
  }
  return values;
};

IntMap.prototype.clone = function() {
  var clone = new IntMap();
  for (var key in this._table) {
    clone._table[key] = this._table[key];
  }
  return clone;
};

function StringMap() {
  this._table = Object.create(null);
  this._proto = void 0;
}

StringMap.prototype.get = function(key) {
  return key === '__proto__' ? this._proto : this._table[key];
};

StringMap.prototype.getOrDefault = function(key, defaultValue) {
  return (key === '__proto__' ? this._proto : this._table[key]) || defaultValue;
};

StringMap.prototype.set = function(key, value) {
  if (key === '__proto__') this._proto = value;
  else this._table[key] = value;
};

StringMap.prototype.has = function(key) {
  return key === '__proto__' ? this._proto !== void 0 : this._table[key] !== void 0;
};

StringMap.prototype.remove = function(key) {
  if (key === '__proto__') {
    this._proto = void 0;
  } else {
    delete this._table[key];
  }
};

StringMap.prototype.keys = function() {
  var keys = [];
  for (var key in this._table) {
    if (this._table[key] !== void 0) {
      keys.push(key);
    }
  }
  if (this._proto !== void 0) {
    keys.push('__proto__');
  }
  return keys;
};

StringMap.prototype.values = function() {
  var values = [];
  for (var key in this._table) {
    var value = this._table[key];
    if (value !== void 0) {
      values.push(value);
    }
  }
  if (this._proto !== void 0) {
    values.push(this._proto);
  }
  return values;
};

StringMap.prototype.clone = function() {
  var clone = new StringMap();
  for (var key in this._table) {
    clone._table[key] = this._table[key];
  }
  clone._proto = this._proto;
  return clone;
};
var $imul = Math.imul || function(a, b) {
  var ah = a >>> 16, al = a & 0xFFFF;
  var bh = b >>> 16, bl = b & 0xFFFF;
  return al * bl + (ah * bl + al * bh << 16) | 0;
};
function $extends(derived, base) {
  derived.prototype = Object.create(base.prototype);
  derived.prototype.constructor = derived;
}
var $in = {};
$in.string = {};
$in.NodeKind = {};
$in.TargetFormat = {};
$in.io = {};
$in.SymbolKind = {};
$in.TokenKind = {};
function Content() {
}
Content.equal = function(left, right) {
  if (left === right) {
    return true;
  }
  if (left !== null && right !== null) {
    var type = left.type();
    if (type === right.type()) {
      switch (type) {
      case 0:
        return left.value === right.value;
      case 1:
        return left.value === right.value;
      case 2:
        return left.value === right.value;
      case 3:
        return left.value === right.value;
      }
    }
  }
  return false;
};
function BoolContent(_0) {
  Content.call(this);
  this.value = _0;
}
$extends(BoolContent, Content);
BoolContent.prototype.type = function() {
  return 0;
};
function IntContent(_0) {
  Content.call(this);
  this.value = _0;
}
$extends(IntContent, Content);
IntContent.prototype.type = function() {
  return 1;
};
function DoubleContent(_0) {
  Content.call(this);
  this.value = _0;
}
$extends(DoubleContent, Content);
DoubleContent.prototype.type = function() {
  return 2;
};
function StringContent(_0) {
  Content.call(this);
  this.value = _0;
}
$extends(StringContent, Content);
StringContent.prototype.type = function() {
  return 3;
};
function Node(_0) {
  this.range = Range.EMPTY;
  this.parent = null;
  this.sibling = null;
  this.children = null;
  this.type = null;
  this.scope = null;
  this.symbol = null;
  this.content = null;
  this.kind = _0;
}
Node.isTrue = function($this) {
  return $this.kind === 39 && $this.content.value;
};
Node.isFalse = function($this) {
  return $this.kind === 39 && !$this.content.value;
};
Node.createCase = function(values, block) {
  values.push(block);
  return Node.withChildren(new Node(4), values);
};
Node.createVariableCluster = function(type, variables) {
  variables.unshift(type);
  return Node.withChildren(new Node(6), variables);
};
Node.createModifier = function(name, statements) {
  statements.unshift(name);
  return Node.withChildren(new Node(32), statements);
};
Node.createSwitch = function(value, cases) {
  cases.unshift(value);
  return Node.withChildren(new Node(31), cases);
};
Node.createCall = function(value, $arguments) {
  $arguments.unshift(value);
  return Node.withChildren(new Node(47), $arguments);
};
Node.createParameterize = function(type, types) {
  types.unshift(type);
  return Node.withChildren(new Node(51), types);
};
Node.createLambda = function($arguments, block) {
  $arguments.push(block);
  return Node.withChildren(new Node(54), $arguments);
};
Node.createFunctionType = function(result, $arguments) {
  $arguments.unshift(result);
  return Node.withChildren(new Node(57), $arguments);
};
Node.createBinary = function(kind, left, right) {
  if (kind === 86 && left.kind === 75) {
    var target = left.children[0];
    var index = left.children[1];
    return Node.withChildren(new Node(97), [Node.remove(target), Node.remove(index), right]);
  }
  return Node.withChildren(new Node(kind), [left, right]);
};
Node.clusterVariables = function($this) {
  return $this.children.slice(1, $this.children.length);
};
Node.modifierStatements = function($this) {
  return $this.children.slice(1, $this.children.length);
};
Node.lambdaArguments = function($this) {
  return $this.children.slice(0, $this.children.length - 1 | 0);
};
Node.lambdaBlock = function($this) {
  return $this.children[$this.children.length - 1 | 0];
};
Node.parameterizeTypes = function($this) {
  return $this.children.slice(1, $this.children.length);
};
Node.functionTypeArguments = function($this) {
  return $this.children.slice(1, $this.children.length);
};
Node.callArguments = function($this) {
  return $this.children.slice(1, $this.children.length);
};
Node.switchCases = function($this) {
  return $this.children.slice(1, $this.children.length);
};
Node.caseValues = function($this) {
  return $this.children.slice(0, $this.children.length - 1 | 0);
};
Node.caseBlock = function($this) {
  return $this.children[$this.children.length - 1 | 0];
};
Node.invertBooleanCondition = function($this, cache) {
  switch ($this.kind) {
  case 39:
    $this.content = new BoolContent(!$this.content.value);
    return;
  case 58:
    Node.become($this, Node.remove($this.children[0]));
    return;
  case 71:
    $this.kind = 81;
    return;
  case 81:
    $this.kind = 71;
    return;
  case 79:
    $this.kind = 78;
    Node.invertBooleanCondition($this.children[0], cache);
    Node.invertBooleanCondition($this.children[1], cache);
    return;
  case 78:
    $this.kind = 79;
    Node.invertBooleanCondition($this.children[0], cache);
    Node.invertBooleanCondition($this.children[1], cache);
    return;
  case 76:
  case 72:
  case 77:
  case 73:
    if (!Type.isReal(TypeCache.commonImplicitType(cache, $this.children[0].type, $this.children[1].type), cache)) {
      switch ($this.kind) {
      case 76:
        $this.kind = 73;
        break;
      case 72:
        $this.kind = 77;
        break;
      case 77:
        $this.kind = 72;
        break;
      case 73:
        $this.kind = 76;
        break;
      }
      return;
    }
    break;
  }
  var children = Node.removeChildren($this);
  Node.become($this, Node.withType(Node.withChildren(new Node(58), [Node.withChildren(Node.clone($this), children)]), cache.boolType));
};
Node.blockAlwaysEndsWithReturn = function($this) {
  if (!Node.hasChildren($this)) {
    return false;
  }
  for (var i = $this.children.length - 1 | 0; i >= 0; i = i - 1 | 0) {
    var child = $this.children[i];
    switch (child.kind) {
    case 24:
    case 25:
      return true;
    case 19:
      var trueBlock = child.children[1];
      var falseBlock = child.children[2];
      if (falseBlock !== null && Node.blockAlwaysEndsWithReturn(trueBlock) && Node.blockAlwaysEndsWithReturn(falseBlock)) {
        return true;
      }
      break;
    case 31:
      var value = child.children[0];
      var cases = Node.switchCases(child);
      var foundDefault = false;
      for (var j = 0; j < cases.length; j = j + 1 | 0) {
        var node = cases[j];
        if (!Node.blockAlwaysEndsWithReturn(Node.caseBlock(node))) {
          return false;
        }
        if (Node.caseValues(node).length === 0) {
          foundDefault = true;
        }
      }
      return foundDefault;
    }
  }
  return false;
};
Node.isNameExpression = function($this) {
  return $this.kind === 34 && ($this.parent.kind !== 45 || $this !== $this.parent.children[1]) && (!$in.NodeKind.isNamedDeclaration($this.parent.kind) || $this !== $this.parent.children[0]);
};
Node.isStorage = function($this) {
  return $in.NodeKind.isUnaryStorageOperator($this.parent.kind) || $in.NodeKind.isBinaryStorageOperator($this.parent.kind) && $this === $this.parent.children[0];
};
Node.hasNoSideEffects = function($this) {
  switch ($this.kind) {
  case 34:
  case 36:
  case 39:
  case 40:
  case 41:
  case 42:
  case 43:
  case 38:
    return true;
  case 45:
    return Node.hasNoSideEffects($this.children[0]);
  default:
    return false;
  }
};
Node.hasChildren = function($this) {
  return $this.children !== null && $this.children.length > 0;
};
Node.indexInParent = function($this) {
  return $this.parent.children.indexOf($this);
};
Node.appendChild = function($this, node) {
  Node.insertChild($this, $this.children === null ? 0 : $this.children.length, node);
};
Node.insertSiblingAfter = function($this, node) {
  Node.insertChild($this.parent, Node.indexInParent($this) + 1 | 0, node);
};
Node.removeChildAtIndex = function($this, index) {
  var child = $this.children[index];
  if (child !== null) {
    child.parent = null;
  }
  $this.children.splice(index, 1)[0];
  return child;
};
Node.remove = function($this) {
  if ($this.parent !== null) {
    Node.removeChildAtIndex($this.parent, Node.indexInParent($this));
  }
  return $this;
};
Node.removeChildren = function($this) {
  if ($this.children === null) {
    return [];
  }
  var result = $this.children;
  for (var i = 0; i < $this.children.length; i = i + 1 | 0) {
    var child = $this.children[i];
    if (child !== null) {
      child.parent = null;
    }
  }
  $this.children = null;
  return result;
};
Node.become = function($this, node) {
  $this.kind = node.kind;
  $this.range = node.range;
  $this.sibling = node.sibling;
  Node.removeChildren($this);
  Node.withChildren($this, Node.removeChildren(node));
  $this.type = node.type;
  $this.scope = node.scope;
  $this.symbol = node.symbol;
  $this.content = node.content;
};
Node.replaceWith = function($this, node) {
  Node.replaceChild($this.parent, Node.indexInParent($this), node);
  return $this;
};
Node.swapWith = function($this, node) {
  var parentA = $this.parent;
  var parentB = node.parent;
  var indexA = Node.indexInParent($this);
  var indexB = Node.indexInParent(node);
  parentA.children[indexA] = node;
  parentB.children[indexB] = $this;
  $this.parent = parentB;
  node.parent = parentA;
};
Node.replaceWithNodes = function($this, nodes) {
  var index = Node.indexInParent($this);
  for (var i = 0; i < nodes.length; i = i + 1 | 0) {
    Node.insertChild($this.parent, (index + i | 0) + 1 | 0, nodes[i]);
  }
  Node.removeChildAtIndex($this.parent, index);
  return $this;
};
Node.replaceChild = function($this, index, node) {
  Node.updateParent(node, $this);
  var old = $this.children[index];
  if (old !== null) {
    old.parent = null;
  }
  $this.children[index] = node;
};
Node.insertChild = function($this, index, node) {
  if ($this.children === null) {
    $this.children = [];
  }
  Node.updateParent(node, $this);
  $this.children.splice(index, 0, node);
};
Node.clone = function($this) {
  var node = new Node($this.kind);
  node.range = $this.range;
  node.type = $this.type;
  node.symbol = $this.symbol;
  node.content = $this.content;
  if ($this.children !== null) {
    node.children = [];
    for (var i = 0; i < $this.children.length; i = i + 1 | 0) {
      var child = $this.children[i];
      Node.appendChild(node, child !== null ? Node.clone(child) : null);
    }
  }
  return node;
};
Node.withRange = function($this, value) {
  $this.range = value;
  return $this;
};
Node.withType = function($this, value) {
  $this.type = value;
  return $this;
};
Node.withSymbol = function($this, value) {
  $this.symbol = value;
  return $this;
};
Node.withContent = function($this, value) {
  $this.content = value;
  return $this;
};
Node.withChildren = function($this, nodes) {
  for (var i = 0; i < nodes.length; i = i + 1 | 0) {
    Node.updateParent(nodes[i], $this);
  }
  $this.children = nodes;
  return $this;
};
Node.firstNonExtensionSibling = function($this) {
  var node = $this;
  while (node !== null && node.kind === 13) {
    node = node.sibling;
  }
  return node;
};
Node.appendToSiblingChain = function($this, node) {
  var last = $this;
  while (last.sibling !== null) {
    last = last.sibling;
  }
  last.sibling = node;
};
Node.updateParent = function(node, parent) {
  if (node !== null) {
    node.parent = parent;
  }
};
function OperatorInfo(_0, _1, _2) {
  this.text = _0;
  this.precedence = _1;
  this.associativity = _2;
}
function Collector(program, sort) {
  this.typeSymbols = [];
  this.freeFunctionSymbols = [];
  this.topLevelStatements = [];
  this.sort = sort;
  Collector.collectStatements(this, program);
  Collector.sortTypeSymbols(this);
}
Collector.collectStatements = function($this, node) {
  switch (node.kind) {
  case 0:
  case 1:
  case 32:
  case 2:
    Collector.collectChildStatements($this, node);
    break;
  case 7:
  case 10:
  case 11:
  case 12:
  case 13:
  case 8:
  case 9:
    if (node === node.symbol.node) {
      $this.typeSymbols.push(node.symbol);
    }
    Collector.collectChildStatements($this, node);
    break;
  case 14:
  case 15:
    if (!$in.SymbolKind.isTypeWithInstances(node.symbol.enclosingSymbol.kind)) {
      $this.freeFunctionSymbols.push(node.symbol);
    }
    break;
  case 6:
  case 19:
  case 20:
  case 21:
  case 22:
  case 23:
  case 24:
  case 26:
  case 27:
  case 28:
  case 30:
  case 31:
    $this.topLevelStatements.push(node);
    break;
  }
};
Collector.sortTypeSymbols = function($this) {
  if ($this.sort === 0) {
    return;
  }
  for (var i = 1; i < $this.typeSymbols.length; i = i + 1 | 0) {
    var symbol = $this.typeSymbols[i];
    for (var j = 0; j < i; j = j + 1 | 0) {
      if (Collector.typeComesBefore($this, symbol.type, $this.typeSymbols[j].type)) {
        var k = i;
        for (; k > j; k = k - 1 | 0) {
          $this.typeSymbols[k] = $this.typeSymbols[k - 1 | 0];
        }
        $this.typeSymbols[j] = symbol;
        break;
      }
    }
  }
};
Collector.typeComesBefore = function($this, left, right) {
  if (Type.hasBaseType(right, left)) {
    return true;
  }
  if ($this.sort === 2 && Type.isStruct(left)) {
    var members = right.members.values();
    if (members !== null) {
      for (var i = 0; i < members.length; i = i + 1 | 0) {
        if (members[i].type === left) {
          return true;
        }
      }
    }
  }
  if ($this.sort === 3 && Symbol.isContainedBy(right.symbol, left.symbol)) {
    return true;
  }
  return false;
};
Collector.collectChildStatements = function($this, node) {
  if (Node.hasChildren(node)) {
    for (var i = 0; i < node.children.length; i = i + 1 | 0) {
      var child = node.children[i];
      if (child !== null) {
        Collector.collectStatements($this, child);
      }
    }
  }
};
var TargetFormat = {
  NONE: 0,
  JS: 1,
  LISP_AST: 2,
  JSON_AST: 3,
  XML_AST: 4
};
function CompilerOptions() {
  this.targetFormat = 0;
  this.inputs = [];
  this.prepend = [];
  this.append = [];
  this.outputDirectory = "";
  this.outputFile = "";
  this.jsSourceMap = false;
  this.optimize = false;
  this.removeAsserts = false;
  this.foldAllConstants = false;
  this.inlineAllFunctions = false;
  this.convertAllInstanceToStatic = false;
}
function CompilerResult(_0, _1, _2, _3) {
  this.options = _0;
  this.outputs = _1;
  this.program = _2;
  this.resolver = _3;
}
function Compiler() {
  this.tokenizingTime = 0;
  this.parsingTime = 0;
  this.resolvingTime = 0;
  this.callGraphTime = 0;
  this.instanceToStaticTime = 0;
  this.symbolMotionTime = 0;
  this.functionInliningTime = 0;
  this.constantFoldingTime = 0;
  this.deadCodeRemovalTime = 0;
  this.patchTime = 0;
  this.emitTime = 0;
  this.lineCountingTime = 0;
  this.totalTime = 0;
  this.log = new Log();
}
Compiler.statistics = function($this, result) {
  var lineCountingStart = now();
  var lineCount = 0;
  lineCount = lineCount + Compiler.totalLineCount(result.options.prepend) | 0;
  lineCount = lineCount + Compiler.totalLineCount(result.options.inputs) | 0;
  lineCount = lineCount + Compiler.totalLineCount(result.options.append) | 0;
  var text = "Input line count: " + lineCount + "\nOutput line count: " + Compiler.totalLineCount(result.outputs);
  $this.lineCountingTime += now() - lineCountingStart;
  var optimizingTime = $this.callGraphTime + $this.instanceToStaticTime + $this.symbolMotionTime + $this.functionInliningTime + $this.constantFoldingTime + $this.deadCodeRemovalTime;
  text += "\nTotal compile time: " + Math.round(($this.totalTime + $this.lineCountingTime) * 10) / 10 + "ms";
  if ($this.tokenizingTime > 0) {
    text += "\n  Tokenizing: " + Math.round($this.tokenizingTime * 10) / 10 + "ms";
  }
  if ($this.parsingTime > 0) {
    text += "\n  Parsing: " + Math.round($this.parsingTime * 10) / 10 + "ms";
  }
  if ($this.resolvingTime > 0) {
    text += "\n  Resolving: " + Math.round($this.resolvingTime * 10) / 10 + "ms";
  }
  if (optimizingTime > 0) {
    text += "\n  Optimizing: " + Math.round(optimizingTime * 10) / 10 + "ms";
    text += "\n    Building call graph: " + Math.round($this.callGraphTime * 10) / 10 + "ms";
    text += "\n    Instance to static: " + Math.round($this.instanceToStaticTime * 10) / 10 + "ms";
    text += "\n    Symbol motion: " + Math.round($this.symbolMotionTime * 10) / 10 + "ms";
    text += "\n    Function inlining: " + Math.round($this.functionInliningTime * 10) / 10 + "ms";
    text += "\n    Constant folding: " + Math.round($this.constantFoldingTime * 10) / 10 + "ms";
    text += "\n    Dead code removal: " + Math.round($this.deadCodeRemovalTime * 10) / 10 + "ms";
  }
  if ($this.patchTime > 0) {
    text += "\n  Patch: " + Math.round($this.patchTime * 10) / 10 + "ms";
  }
  if ($this.emitTime > 0) {
    text += "\n  Emit: " + Math.round($this.emitTime * 10) / 10 + "ms";
  }
  if ($this.lineCountingTime > 0) {
    text += "\n  Counting lines: " + Math.round($this.lineCountingTime * 10) / 10 + "ms";
  }
  text += Compiler.sourceStatistics("Prepend", result.options.prepend);
  text += Compiler.sourceStatistics("Inputs", result.options.inputs);
  text += Compiler.sourceStatistics("Append", result.options.append);
  text += Compiler.sourceStatistics("Outputs", result.outputs);
  return text;
};
Compiler.totalLineCount = function(sources) {
  var lineCount = 0;
  for (var i = 0; i < sources.length; i = i + 1 | 0) {
    lineCount = lineCount + Source.lineCount(sources[i]) | 0;
  }
  return lineCount;
};
Compiler.sourceStatistics = function(name, sources) {
  var text = "\n" + name + ": " + sources.length;
  for (var i = 0; i < sources.length; i = i + 1 | 0) {
    var source = sources[i];
    text += "\n  " + source.name + ": " + bytesToString(source.contents.length);
  }
  return text;
};
Compiler.prototype.compile = function(options) {
  var totalStart = now();
  var program = Node.withChildren(new Node(0), []);
  var outputs = [];
  createOperatorMap();
  createParser();
  createNameToSymbolFlag();
  createSymbolFlagToName();
  if (Compiler.nativeLibrarySource !== null) {
    Node.appendChild(program, Node.clone(Compiler.nativeLibraryFile));
  } else {
    Compiler.nativeLibrarySource = new Source("<native>", NATIVE_LIBRARY);
    Compiler.processInput(this, program, Compiler.nativeLibrarySource);
    Compiler.nativeLibraryFile = Node.clone(program.children[0]);
  }
  options.inputs.unshift(Compiler.nativeLibrarySource);
  for (var i = 1; i < options.inputs.length; i = i + 1 | 0) {
    Compiler.processInput(this, program, options.inputs[i]);
  }
  var resolver = null;
  if ($in.TargetFormat.shouldRunResolver(options.targetFormat)) {
    var resolveStart = now();
    resolver = new Resolver(this.log, options);
    Resolver.run(resolver, program);
    this.resolvingTime += now() - resolveStart;
  }
  if (this.log.errorCount === 0) {
    if ($in.TargetFormat.shouldRunResolver(options.targetFormat)) {
      var callGraphStart = now();
      var graph = new CallGraph(program);
      this.callGraphTime += now() - callGraphStart;
      var instanceToStaticStart = now();
      InstanceToStaticPass.run(graph, resolver.cache, options);
      this.instanceToStaticTime += now() - instanceToStaticStart;
      var symbolMotionStart = now();
      SymbolMotionPass.run(resolver);
      this.symbolMotionTime += now() - symbolMotionStart;
      var functionInliningStart = now();
      FunctionInliningPass.run(graph, options);
      this.functionInliningTime += now() - functionInliningStart;
      if (options.foldAllConstants) {
        var constantFoldingStart = now();
        ConstantFolder.foldConstants(resolver.constantFolder, program);
        this.constantFoldingTime += now() - constantFoldingStart;
      }
      var deadCodeRemovalStart = now();
      DeadCodeRemovalPass.run(program, options, resolver);
      this.deadCodeRemovalTime += now() - deadCodeRemovalStart;
    }
    var emitter = null;
    switch (options.targetFormat) {
    case 0:
      break;
    case 1:
      emitter = new js.Emitter(options, resolver.cache);
      break;
    case 2:
      emitter = new lisp.Emitter(options);
      break;
    case 3:
      emitter = new json.Emitter(options);
      break;
    case 4:
      emitter = new xml.Emitter(options);
      break;
    default:
      break;
    }
    if (emitter !== null) {
      var patchStart = now();
      emitter.patchProgram(program);
      this.patchTime += now() - patchStart;
      var emitStart = now();
      outputs = emitter.emitProgram(program);
      this.emitTime += now() - emitStart;
    }
  }
  this.totalTime += now() - totalStart;
  return new CompilerResult(options, outputs, program, resolver);
};
Compiler.processInput = function($this, program, source) {
  var errorCount = $this.log.errorCount;
  var tokenizeStart = now();
  var sourceTokens = tokenize($this.log, source);
  $this.tokenizingTime += now() - tokenizeStart;
  if ($this.log.errorCount === errorCount) {
    var parseStart = now();
    var file = parseFile($this.log, sourceTokens);
    $this.parsingTime += now() - parseStart;
    if (file !== null) {
      Node.appendChild(program, file);
    }
  }
};
var json = {};
json.Emitter = function(_0) {
  this.options = _0;
};
json.Emitter.prototype.patchProgram = function(program) {
};
json.Emitter.prototype.emitProgram = function(program) {
  var outputs = [];
  if (this.options.outputDirectory === "") {
    outputs.push(new Source(this.options.outputFile, json.dump(program) + "\n"));
  } else {
    for (var i = 0; i < program.children.length; i = i + 1 | 0) {
      var file = program.children[i];
      outputs.push(new Source(this.options.outputDirectory + "/" + file.range.source.name + ".json", json.dump(file) + "\n"));
    }
  }
  return outputs;
};
json.DumpVisitor = function() {
  this.result = "";
  this.indent = "";
};
json.DumpVisitor.visit = function($this, node) {
  if (node === null) {
    $this.result += "null";
    return;
  }
  var outer = $this.indent;
  $this.indent += "  ";
  $this.result += "{\n" + $this.indent + "\"kind\": \"" + replace($in.NodeKind.toString(node.kind).toLowerCase(), "_", "-") + "\"";
  if (node.content !== null) {
    $this.result += ",\n" + $this.indent + "\"content\": ";
    switch (node.content.type()) {
    case 1:
      $this.result += node.content.value.toString();
      break;
    case 2:
      $this.result += node.content.value.toString();
      break;
    case 3:
      $this.result += quoteString(node.content.value, 34);
      break;
    }
  }
  if (Node.hasChildren(node)) {
    $this.result += ",\n" + $this.indent + "\"children\": [";
    var inner = $this.indent;
    $this.indent += "  ";
    for (var i = 0; i < node.children.length; i = i + 1 | 0) {
      if (i > 0) {
        $this.result += ",";
      }
      $this.result += "\n" + $this.indent;
      json.DumpVisitor.visit($this, node.children[i]);
    }
    $this.indent = inner;
    $this.result += "\n" + $this.indent + "]";
  }
  $this.indent = outer;
  $this.result += "\n" + $this.indent + "}";
};
var lisp = {};
lisp.Emitter = function(_0) {
  this.options = _0;
};
lisp.Emitter.prototype.patchProgram = function(program) {
};
lisp.Emitter.prototype.emitProgram = function(program) {
  var outputs = [];
  if (this.options.outputDirectory === "") {
    outputs.push(new Source(this.options.outputFile, lisp.dump(program) + "\n"));
  } else {
    for (var i = 0; i < program.children.length; i = i + 1 | 0) {
      var file = program.children[i];
      outputs.push(new Source(this.options.outputDirectory + "/" + file.range.source.name + ".lisp", lisp.dump(file) + "\n"));
    }
  }
  return outputs;
};
lisp.DumpVisitor = function() {
  this.result = "";
  this.indent = "";
};
lisp.DumpVisitor.visit = function($this, node) {
  if (node === null) {
    $this.result += "nil";
    return;
  }
  $this.result += "(" + replace($in.NodeKind.toString(node.kind).toLowerCase(), "_", "-");
  if (node.content !== null) {
    switch (node.content.type()) {
    case 1:
      $this.result += " " + node.content.value;
      break;
    case 2:
      $this.result += " " + node.content.value;
      break;
    case 3:
      $this.result += " " + quoteString(node.content.value, 34);
      break;
    }
  }
  if (Node.hasChildren(node)) {
    var old = $this.indent;
    $this.indent += "  ";
    for (var i = 0; i < node.children.length; i = i + 1 | 0) {
      $this.result += "\n" + $this.indent;
      lisp.DumpVisitor.visit($this, node.children[i]);
    }
    $this.indent = old;
  }
  $this.result += ")";
};
var xml = {};
xml.Emitter = function(_0) {
  this.options = _0;
};
xml.Emitter.prototype.patchProgram = function(program) {
};
xml.Emitter.prototype.emitProgram = function(program) {
  var outputs = [];
  if (this.options.outputDirectory === "") {
    outputs.push(new Source(this.options.outputFile, xml.dump(program) + "\n"));
  } else {
    for (var i = 0; i < program.children.length; i = i + 1 | 0) {
      var file = program.children[i];
      outputs.push(new Source(this.options.outputDirectory + "/" + file.range.source.name + ".xml", xml.dump(file) + "\n"));
    }
  }
  return outputs;
};
xml.DumpVisitor = function() {
  this.result = "";
  this.indent = "";
};
xml.DumpVisitor.visit = function($this, node) {
  if (node === null) {
    $this.result += "<null/>";
    return;
  }
  $this.result += "<" + replace($in.NodeKind.toString(node.kind).toLowerCase(), "_", "-");
  if (node.content !== null) {
    $this.result += " content=";
    switch (node.content.type()) {
    case 1:
      $this.result += "\"" + node.content.value + "\"";
      break;
    case 2:
      $this.result += "\"" + node.content.value + "\"";
      break;
    case 3:
      $this.result += quoteString(node.content.value, 34);
      break;
    }
  }
  if (Node.hasChildren(node)) {
    $this.result += ">";
    var inner = $this.indent;
    $this.indent += "  ";
    for (var i = 0; i < node.children.length; i = i + 1 | 0) {
      $this.result += "\n" + $this.indent;
      xml.DumpVisitor.visit($this, node.children[i]);
    }
    $this.indent = inner;
    $this.result += "\n" + $this.indent + "</" + replace($in.NodeKind.toString(node.kind).toLowerCase(), "_", "-") + ">";
  } else {
    $this.result += "/>";
  }
};
function Diagnostic(_0, _1, _2) {
  this.noteRange = Range.EMPTY;
  this.noteText = "";
  this.kind = _0;
  this.range = _1;
  this.text = _2;
}
function Log() {
  this.diagnostics = [];
  this.warningCount = 0;
  this.errorCount = 0;
}
Log.error = function($this, range, text) {
  $this.diagnostics.push(new Diagnostic(0, range, text));
  $this.errorCount = $this.errorCount + 1 | 0;
};
Log.warning = function($this, range, text) {
  $this.diagnostics.push(new Diagnostic(1, range, text));
  $this.warningCount = $this.warningCount + 1 | 0;
};
Log.note = function($this, range, text) {
  var last = $this.diagnostics[$this.diagnostics.length - 1 | 0];
  last.noteRange = range;
  last.noteText = text;
};
Log.prototype.toString = function() {
  var result = "";
  for (var i = 0; i < this.diagnostics.length; i = i + 1 | 0) {
    var diagnostic = this.diagnostics[i];
    var formatted = Range.format(diagnostic.range, 0);
    result = result + Range.locationString(diagnostic.range) + (diagnostic.kind === 0 ? ": error: " : ": warning: ") + diagnostic.text + "\n" + formatted.line + "\n" + formatted.range + "\n";
    if (diagnostic.noteRange.source !== null) {
      formatted = Range.format(diagnostic.noteRange, 0);
      result = result + Range.locationString(diagnostic.noteRange) + ": note: " + diagnostic.noteText + "\n" + formatted.line + "\n" + formatted.range + "\n";
    }
  }
  return result;
};
function FormattedRange(_0, _1) {
  this.line = _0;
  this.range = _1;
}
function Range(_0, _1, _2) {
  this.source = _0;
  this.start = _1;
  this.end = _2;
}
Range.toString = function($this) {
  return $this.source === null ? "" : $this.source.contents.slice($this.start, $this.end);
};
Range.locationString = function($this) {
  if ($this.source === null) {
    return "";
  }
  var location = Source.indexToLineColumn($this.source, $this.start);
  return $this.source.name + ":" + (location.line + 1 | 0) + ":" + (location.column + 1 | 0);
};
Range.touches = function($this, index) {
  return $this.start <= index && index <= $this.end;
};
Range.singleLineLength = function($this) {
  var start = Source.indexToLineColumn($this.source, $this.start);
  var end = Source.indexToLineColumn($this.source, $this.end);
  return (start.line === end.line ? end.column : Source.contentsOfLine($this.source, start.line).length) - start.column | 0;
};
Range.format = function($this, maxLength) {
  var start = Source.indexToLineColumn($this.source, $this.start);
  var end = Source.indexToLineColumn($this.source, $this.end);
  var line = Source.contentsOfLine($this.source, start.line);
  var length = line.length;
  var a = start.column;
  var b = end.line === start.line ? end.column : length;
  if (maxLength > 0 && length > maxLength) {
    var centeredWidth = (b - a | 0) < (maxLength / 2 | 0) ? b - a | 0 : maxLength / 2 | 0;
    var centeredStart = (maxLength - centeredWidth | 0) / 2 | 0;
    if (a < centeredStart) {
      line = line.slice(0, maxLength - 3 | 0) + "...";
      if (b > (maxLength - 3 | 0)) {
        b = maxLength - 3 | 0;
      }
    } else if ((length - a | 0) < (maxLength - centeredStart | 0)) {
      var offset = length - maxLength | 0;
      line = "..." + line.slice(offset + 3 | 0, length);
      a = a - offset | 0;
      b = b - offset | 0;
    } else {
      var offset = a - centeredStart | 0;
      line = "..." + line.slice(offset + 3 | 0, (offset + maxLength | 0) - 3 | 0) + "...";
      a = a - offset | 0;
      b = b - offset | 0;
      if (b > (maxLength - 3 | 0)) {
        b = maxLength - 3 | 0;
      }
    }
  }
  return new FormattedRange(line, $in.string.repeat(" ", a) + ((b - a | 0) < 2 ? "^" : $in.string.repeat("~", b - a | 0)));
};
Range.span = function(start, end) {
  return new Range(start.source, start.start, end.end);
};
Range.after = function(outer, inner) {
  return new Range(outer.source, inner.end, outer.end);
};
Range.equal = function(left, right) {
  return left.source === right.source && left.start === right.start && left.end === right.end;
};
function LineColumn(_0, _1) {
  this.line = _0;
  this.column = _1;
}
function Source(_0, _1) {
  this.lineOffsets = null;
  this.name = _0;
  this.contents = _1;
}
Source.computeLineOffsets = function($this) {
  if ($this.lineOffsets !== null) {
    return;
  }
  $this.lineOffsets = [0];
  for (var i = 0; i < $this.contents.length; i = i + 1 | 0) {
    if ($this.contents.charCodeAt(i) === 10) {
      $this.lineOffsets.push(i + 1 | 0);
    }
  }
};
Source.lineCount = function($this) {
  Source.computeLineOffsets($this);
  return $this.lineOffsets.length - 1 | 0;
};
Source.contentsOfLine = function($this, line) {
  Source.computeLineOffsets($this);
  if (line < 0 || line >= $this.lineOffsets.length) {
    return "";
  }
  var start = $this.lineOffsets[line];
  var end = (line + 1 | 0) < $this.lineOffsets.length ? $this.lineOffsets[line + 1 | 0] - 1 | 0 : $this.contents.length;
  return $this.contents.slice(start, end);
};
Source.indexToLineColumn = function($this, index) {
  Source.computeLineOffsets($this);
  var count = $this.lineOffsets.length;
  var line = 0;
  while (count > 0) {
    var step = count / 2 | 0;
    var i = line + step | 0;
    if ($this.lineOffsets[i] <= index) {
      line = i + 1 | 0;
      count = (count - step | 0) - 1 | 0;
    } else {
      count = step;
    }
  }
  var column = line > 0 ? index - $this.lineOffsets[line - 1 | 0] | 0 : index;
  return new LineColumn(line - 1 | 0, column);
};
function SplitPath(_0, _1) {
  this.directory = _0;
  this.entry = _1;
}
var frontend = {};
frontend.Flags = function() {
  this.help = false;
  this.verbose = false;
  this.target = "";
  this.outputFile = "";
  this.jsSourceMap = false;
  this.optimize = false;
};
var js = {};
js.PatchContext = function() {
  this.lambdaCount = 0;
  this.createdThisAlias = false;
  this.$function = null;
};
js.PatchContext.setFunction = function($this, node) {
  $this.$function = node;
  $this.createdThisAlias = false;
};
js.PatchContext.thisAlias = function($this) {
  if (!$this.createdThisAlias) {
    $this.createdThisAlias = true;
    Node.insertChild($this.$function.children[2], 0, Node.createVariableCluster(new Node(49), [Node.withChildren(new Node(16), [Node.withContent(new Node(34), new StringContent("$this")), null, new Node(36)])]));
  }
  return Node.withContent(new Node(34), new StringContent("$this"));
};
js.Emitter = function(_0, _1) {
  this.indent = "";
  this.currentLine = 0;
  this.currentColumn = 0;
  this.needExtends = false;
  this.needMathImul = false;
  this.isStartOfExpression = false;
  this.generator = new SourceMapGenerator();
  this.currentSource = null;
  this.toStringTarget = null;
  this.options = _0;
  this.cache = _1;
};
js.Emitter.prototype.patchProgram = function(program) {
  js.Emitter.patchNode(this, program, new js.PatchContext());
};
js.Emitter.prototype.emitProgram = function(program) {
  if (js.Emitter.isKeyword === null) {
    js.Emitter.isKeyword = js.Emitter.createIsKeyword();
  }
  this.currentSource = new Source(this.options.outputFile, "");
  var collector = new Collector(program, 3);
  for (var i = 0; i < this.options.prepend.length; i = i + 1 | 0) {
    js.Emitter.appendSource(this, this.options.prepend[i]);
  }
  if (this.needMathImul) {
    js.Emitter.emit(this, "var $imul = Math.imul || function(a, b) {\n  var ah = a >>> 16, al = a & 0xFFFF;\n  var bh = b >>> 16, bl = b & 0xFFFF;\n  return al * bl + (ah * bl + al * bh << 16) | 0;\n};\n");
  }
  if (this.needExtends) {
    js.Emitter.emit(this, "function $extends(derived, base) {\n  derived.prototype = Object.create(base.prototype);\n  derived.prototype.constructor = derived;\n}\n");
  }
  for (var i = 0; i < collector.typeSymbols.length; i = i + 1 | 0) {
    var type = collector.typeSymbols[i].type;
    if (Type.isNamespace(type)) {
      if ((type.symbol.flags & 8192) === 0) {
        js.Emitter.emitNode(this, Node.firstNonExtensionSibling(type.symbol.node));
      }
      continue;
    }
    if ((type.symbol.flags & 8192) === 0) {
      if (Type.isEnum(type)) {
        js.Emitter.emitNode(this, Node.firstNonExtensionSibling(type.symbol.node));
      } else {
        var $constructor = Type.$constructor(type);
        if ($constructor !== null) {
          js.Emitter.emitNode(this, $constructor.symbol.node);
        }
      }
    }
    var members = type.members.values();
    for (var j = 0; j < members.length; j = j + 1 | 0) {
      var symbol = members[j].symbol;
      if (symbol.enclosingSymbol === type.symbol && symbol.node !== null && $in.SymbolKind.isFunction(symbol.kind) && symbol.kind !== 16) {
        js.Emitter.emitNode(this, symbol.node);
      }
    }
  }
  for (var i = 0; i < collector.freeFunctionSymbols.length; i = i + 1 | 0) {
    js.Emitter.emitNode(this, collector.freeFunctionSymbols[i].node);
  }
  for (var i = 0; i < collector.topLevelStatements.length; i = i + 1 | 0) {
    js.Emitter.emitNode(this, collector.topLevelStatements[i]);
  }
  for (var i = 0; i < this.options.append.length; i = i + 1 | 0) {
    js.Emitter.appendSource(this, this.options.append[i]);
  }
  if (this.options.jsSourceMap) {
    this.currentSource.contents = this.currentSource.contents + "/";
    if (this.options.outputFile === "") {
      this.currentSource.contents = this.currentSource.contents + "/# sourceMappingURL=data:application/json;base64," + encodeBase64(SourceMapGenerator.toString(this.generator)) + "\n";
    } else {
      var name = this.options.outputFile + ".map";
      this.currentSource.contents = this.currentSource.contents + "/# sourceMappingURL=" + splitPath(name).entry + "\n";
      return [this.currentSource, new Source(name, SourceMapGenerator.toString(this.generator))];
    }
  }
  return [this.currentSource];
};
js.Emitter.appendSource = function($this, source) {
  $this.currentSource.contents += source.contents;
  if ($this.options.jsSourceMap) {
    for (var i = 0, n = Source.lineCount(source); i < n; i = i + 1 | 0) {
      SourceMapGenerator.addMapping($this.generator, source, i, 0, ($this.currentLine = $this.currentLine + 1 | 0) - 1 | 0, 0);
    }
  }
  if (source.contents.charCodeAt(source.contents.length - 1 | 0) !== 10) {
    js.Emitter.emit($this, "\n");
  }
};
js.Emitter.addMapping = function($this, node) {
  if ($this.options.jsSourceMap) {
    var range = node.range;
    if (range.source !== null) {
      var location = Source.indexToLineColumn(range.source, range.start);
      SourceMapGenerator.addMapping($this.generator, range.source, location.line, location.column, $this.currentLine, $this.currentColumn);
    }
  }
};
js.Emitter.decreaseIndent = function($this) {
  $this.indent = $this.indent.slice(2, $this.indent.length);
};
js.Emitter.emit = function($this, text) {
  if ($this.options.jsSourceMap) {
    for (var i = 0; i < text.length; i = i + 1 | 0) {
      var c = text.charCodeAt(i);
      if (c === 10) {
        $this.currentColumn = 0;
        $this.currentLine = $this.currentLine + 1 | 0;
      } else {
        $this.currentColumn = $this.currentColumn + 1 | 0;
      }
    }
  }
  $this.currentSource.contents += text;
};
js.Emitter.emitNodes = function($this, nodes) {
  for (var i = 0; i < nodes.length; i = i + 1 | 0) {
    js.Emitter.emitNode($this, nodes[i]);
  }
};
js.Emitter.emitCommaSeparatedNodes = function($this, nodes) {
  for (var i = 0; i < nodes.length; i = i + 1 | 0) {
    if (i > 0) {
      js.Emitter.emit($this, ", ");
    }
    js.Emitter.emitNode($this, nodes[i]);
  }
};
js.Emitter.emitCommaSeparatedExpressions = function($this, nodes) {
  for (var i = 0; i < nodes.length; i = i + 1 | 0) {
    if (i > 0) {
      js.Emitter.emit($this, ", ");
    }
    js.Emitter.emitExpression($this, nodes[i], 1);
  }
};
js.Emitter.emitArgumentVariables = function($this, nodes) {
  js.Emitter.emit($this, "(");
  js.Emitter.emitCommaSeparatedNodes($this, nodes);
  js.Emitter.emit($this, ")");
};
js.Emitter.emitChildren = function($this, node) {
  if (Node.hasChildren(node)) {
    js.Emitter.emitNodes($this, node.children);
  }
};
js.Emitter.recursiveEmitIfStatement = function($this, node) {
  js.Emitter.emit($this, "if (");
  js.Emitter.emitExpression($this, node.children[0], 0);
  js.Emitter.emit($this, ") ");
  js.Emitter.emitNode($this, node.children[1]);
  var block = node.children[2];
  if (block !== null) {
    js.Emitter.emit($this, " else ");
    var statement = Node.hasChildren(block) && block.children.length === 1 ? block.children[0] : null;
    if (statement !== null && statement.kind === 19) {
      js.Emitter.addMapping($this, statement);
      js.Emitter.recursiveEmitIfStatement($this, statement);
    } else {
      js.Emitter.emitNode($this, block);
    }
  }
};
js.Emitter.emitNode = function($this, node) {
  $this.isStartOfExpression = false;
  js.Emitter.addMapping($this, node);
  switch (node.kind) {
  case 2:
    js.Emitter.emitBlock($this, node);
    break;
  case 4:
    js.Emitter.emitCase($this, node);
    break;
  case 6:
    js.Emitter.emitVariableCluster($this, node);
    break;
  case 7:
    js.Emitter.emitNamespace($this, node);
    break;
  case 8:
  case 9:
    js.Emitter.emitEnum($this, node);
    break;
  case 14:
  case 15:
    js.Emitter.emitFunction($this, node);
    break;
  case 16:
    js.Emitter.emitVariable($this, node);
    break;
  case 19:
    js.Emitter.emitIf($this, node);
    break;
  case 20:
    js.Emitter.emitFor($this, node);
    break;
  case 22:
    js.Emitter.emitWhile($this, node);
    break;
  case 23:
    js.Emitter.emitDoWhile($this, node);
    break;
  case 24:
  case 25:
    js.Emitter.emitReturn($this, node);
    break;
  case 26:
    js.Emitter.emitBreak($this, node);
    break;
  case 27:
    js.Emitter.emitContinue($this, node);
    break;
  case 28:
    js.Emitter.emitAssert($this, node);
    break;
  case 30:
    js.Emitter.emitExpressionStatement($this, node);
    break;
  case 31:
    js.Emitter.emitSwitch($this, node);
    break;
  case 32:
    js.Emitter.emitNodes($this, Node.modifierStatements(node));
    break;
  case 17:
  case 18:
  case 33:
    break;
  default:
    break;
  }
};
js.Emitter.emitBlock = function($this, node) {
  js.Emitter.emit($this, "{\n");
  $this.indent += "  ";
  js.Emitter.emitChildren($this, node);
  js.Emitter.decreaseIndent($this);
  js.Emitter.emit($this, $this.indent + "}");
};
js.Emitter.emitCase = function($this, node) {
  var values = Node.caseValues(node);
  var block = Node.caseBlock(node);
  for (var i = 0; i < values.length; i = i + 1 | 0) {
    js.Emitter.emit($this, $this.indent + "case ");
    js.Emitter.emitExpression($this, values[i], 0);
    js.Emitter.emit($this, ":\n");
  }
  if (values.length === 0) {
    js.Emitter.emit($this, $this.indent + "default:\n");
  }
  $this.indent += "  ";
  js.Emitter.emitChildren($this, block);
  if (!Node.blockAlwaysEndsWithReturn(block)) {
    js.Emitter.emit($this, $this.indent + "break;\n");
  }
  js.Emitter.decreaseIndent($this);
};
js.Emitter.emitVariableCluster = function($this, node) {
  var variables = Node.clusterVariables(node);
  for (var i = 0; i < variables.length; i = i + 1 | 0) {
    var variable = variables[i];
    var symbol = variable.symbol;
    var isCompoundName = symbol !== null && js.Emitter.hasCompoundName(symbol);
    if ((symbol === null || !$in.SymbolKind.isInstance(symbol.kind) && (symbol.flags & 8192) === 0) && (!isCompoundName || variable.children[2] !== null)) {
      js.Emitter.emit($this, $this.indent);
      if (!isCompoundName) {
        js.Emitter.emit($this, "var ");
      }
      js.Emitter.emitNode($this, variable);
      js.Emitter.emit($this, ";\n");
    }
  }
};
js.Emitter.emitNamespace = function($this, node) {
  if (!js.Emitter.hasCompoundName(node.symbol)) {
    js.Emitter.emit($this, "var ");
  }
  js.Emitter.emit($this, $this.indent + js.Emitter.fullName(node.symbol) + " = {};\n");
};
js.Emitter.emitEnum = function($this, node) {
  var block = node.children[1];
  if (!$this.options.foldAllConstants || (node.symbol.flags & 12288) !== 0) {
    if (!js.Emitter.hasCompoundName(node.symbol)) {
      js.Emitter.emit($this, "var ");
    }
    js.Emitter.emit($this, $this.indent + js.Emitter.fullName(node.symbol) + " = {\n");
    $this.indent += "  ";
    for (var i = 0; i < block.children.length; i = i + 1 | 0) {
      var symbol = block.children[i].symbol;
      js.Emitter.emit($this, $this.indent + js.Emitter.mangleName(symbol) + ": " + symbol.constant.value + (i === (block.children.length - 1 | 0) ? "\n" : ",\n"));
    }
    js.Emitter.decreaseIndent($this);
    js.Emitter.emit($this, $this.indent + "};\n");
  }
};
js.Emitter.emitFunction = function($this, node) {
  var block = node.children[2];
  var symbol = node.symbol;
  if (block === null) {
    return;
  }
  var isCompoundName = js.Emitter.hasCompoundName(symbol);
  if (!isCompoundName) {
    js.Emitter.emit($this, $this.indent + "function " + js.Emitter.fullName(symbol));
  } else {
    js.Emitter.emit($this, $this.indent + js.Emitter.fullName(symbol) + " = function");
  }
  js.Emitter.emitArgumentVariables($this, node.children[1].children);
  js.Emitter.emit($this, " ");
  js.Emitter.emit($this, "{\n");
  $this.indent += "  ";
  js.Emitter.emitChildren($this, block);
  js.Emitter.decreaseIndent($this);
  js.Emitter.emit($this, $this.indent + (isCompoundName ? "};\n" : "}\n"));
  if (node.kind === 14) {
    var type = symbol.enclosingSymbol.type;
    if (Type.isClass(type) && Type.baseClass(type) !== null) {
      js.Emitter.emit($this, $this.indent + "$extends(" + js.Emitter.fullName(type.symbol) + ", " + js.Emitter.fullName(Type.baseClass(type).symbol) + ");\n");
    }
  }
};
js.Emitter.emitVariable = function($this, node) {
  var value = node.children[2];
  js.Emitter.emit($this, node.symbol === null ? node.children[0].content.value : js.Emitter.fullName(node.symbol));
  if (value !== null) {
    js.Emitter.emit($this, " = ");
    js.Emitter.emitExpression($this, value, 1);
  }
};
js.Emitter.emitIf = function($this, node) {
  js.Emitter.emit($this, $this.indent);
  js.Emitter.recursiveEmitIfStatement($this, node);
  js.Emitter.emit($this, "\n");
};
js.Emitter.emitFor = function($this, node) {
  var setup = node.children[0];
  var test = node.children[1];
  var update = node.children[2];
  js.Emitter.emit($this, $this.indent + "for (");
  if (setup !== null) {
    if (setup.kind === 6) {
      js.Emitter.emit($this, "var ");
      js.Emitter.emitCommaSeparatedNodes($this, Node.clusterVariables(setup));
    } else {
      js.Emitter.emitExpression($this, setup, 0);
    }
  }
  if (test !== null) {
    js.Emitter.emit($this, "; ");
    js.Emitter.emitExpression($this, test, 0);
  } else {
    js.Emitter.emit($this, ";");
  }
  if (update !== null) {
    js.Emitter.emit($this, "; ");
    js.Emitter.emitExpression($this, update, 0);
  } else {
    js.Emitter.emit($this, ";");
  }
  js.Emitter.emit($this, ") ");
  js.Emitter.emitNode($this, node.children[3]);
  js.Emitter.emit($this, "\n");
};
js.Emitter.emitWhile = function($this, node) {
  js.Emitter.emit($this, $this.indent + "while (");
  js.Emitter.emitExpression($this, node.children[0], 0);
  js.Emitter.emit($this, ") ");
  js.Emitter.emitNode($this, node.children[1]);
  js.Emitter.emit($this, "\n");
};
js.Emitter.emitDoWhile = function($this, node) {
  js.Emitter.emit($this, $this.indent + "do ");
  js.Emitter.emitNode($this, node.children[1]);
  js.Emitter.emit($this, " while (");
  js.Emitter.emitExpression($this, node.children[0], 0);
  js.Emitter.emit($this, ");\n");
};
js.Emitter.emitReturn = function($this, node) {
  var value = node.children[0];
  js.Emitter.emit($this, $this.indent);
  if (value !== null) {
    js.Emitter.emit($this, "return ");
    js.Emitter.emitExpression($this, value, 0);
    js.Emitter.emit($this, ";\n");
  } else {
    js.Emitter.emit($this, "return;\n");
  }
};
js.Emitter.emitBreak = function($this, node) {
  js.Emitter.emit($this, $this.indent + "break;\n");
};
js.Emitter.emitContinue = function($this, node) {
  js.Emitter.emit($this, $this.indent + "continue;\n");
};
js.Emitter.emitAssert = function($this, node) {
  var value = node.children[0];
  Node.invertBooleanCondition(value, $this.cache);
  if (!Node.isFalse(value)) {
    var couldBeFalse = !Node.isTrue(value);
    if (couldBeFalse) {
      js.Emitter.emit($this, $this.indent + "if (");
      js.Emitter.emitExpression($this, value, 0);
      js.Emitter.emit($this, ") {\n");
      $this.indent += "  ";
    }
    var text = Range.toString(node.range) + " (" + Range.locationString(node.range) + ")";
    js.Emitter.emit($this, $this.indent + "throw new Error(" + quoteString(text, 34) + ");\n");
    if (couldBeFalse) {
      js.Emitter.decreaseIndent($this);
      js.Emitter.emit($this, $this.indent + "}\n");
    }
  }
};
js.Emitter.emitExpressionStatement = function($this, node) {
  js.Emitter.emit($this, $this.indent);
  $this.isStartOfExpression = true;
  js.Emitter.emitExpression($this, node.children[0], 0);
  js.Emitter.emit($this, ";\n");
};
js.Emitter.emitSwitch = function($this, node) {
  js.Emitter.emit($this, $this.indent + "switch (");
  js.Emitter.emitExpression($this, node.children[0], 0);
  js.Emitter.emit($this, ") {\n");
  js.Emitter.emitNodes($this, Node.switchCases(node));
  js.Emitter.emit($this, $this.indent + "}\n");
};
js.Emitter.emitExpression = function($this, node, precedence) {
  var wasStartOfExpression = $this.isStartOfExpression;
  $this.isStartOfExpression = false;
  js.Emitter.addMapping($this, node);
  switch (node.kind) {
  case 34:
    js.Emitter.emit($this, node.symbol === null ? node.content.value : js.Emitter.fullName(node.symbol));
    break;
  case 35:
    js.Emitter.emit($this, js.Emitter.fullName(node.type.symbol));
    break;
  case 36:
    js.Emitter.emit($this, "this");
    break;
  case 37:
    js.Emitter.emitHook($this, node, precedence);
    break;
  case 38:
    js.Emitter.emit($this, "null");
    break;
  case 39:
    js.Emitter.emit($this, node.content.value ? "true" : "false");
    break;
  case 40:
    js.Emitter.emitInt($this, node);
    break;
  case 41:
  case 42:
    js.Emitter.emitDouble($this, node);
    break;
  case 43:
    js.Emitter.emit($this, quoteString(node.content.value, 34));
    break;
  case 44:
    js.Emitter.emitList($this, node);
    break;
  case 45:
    js.Emitter.emitDot($this, node);
    break;
  case 47:
    $this.isStartOfExpression = wasStartOfExpression;
    js.Emitter.emitCall($this, node);
    break;
  case 48:
    js.Emitter.emitSuperCall($this, node);
    break;
  case 50:
    $this.isStartOfExpression = wasStartOfExpression;
    js.Emitter.emitSequence($this, node, precedence);
    break;
  case 54:
    js.Emitter.emitLambda($this, node, wasStartOfExpression);
    break;
  case 55:
    js.Emitter.emitExpression($this, node.children[0], precedence);
    break;
  case 75:
    js.Emitter.emitIndex($this, node, precedence);
    break;
  case 97:
    js.Emitter.emitTertiary($this, node, precedence);
    break;
  case 52:
  case 53:
    $this.isStartOfExpression = wasStartOfExpression;
    js.Emitter.emitExpression($this, node.children[1], precedence);
    break;
  case 58:
  case 59:
  case 60:
  case 61:
  case 62:
  case 63:
  case 64:
  case 65:
    js.Emitter.emitUnary($this, node, precedence);
    break;
  case 66:
  case 86:
  case 87:
  case 88:
  case 89:
  case 90:
  case 91:
  case 92:
  case 93:
  case 94:
  case 95:
  case 96:
  case 67:
  case 68:
  case 69:
  case 70:
  case 71:
  case 72:
  case 73:
  case 74:
  case 76:
  case 77:
  case 78:
  case 79:
  case 80:
  case 81:
  case 82:
  case 83:
  case 84:
  case 85:
    js.Emitter.emitBinary($this, node, precedence);
    break;
  default:
    break;
  }
};
js.Emitter.emitHook = function($this, node, precedence) {
  if (2 < precedence) {
    js.Emitter.emit($this, "(");
  }
  js.Emitter.emitExpression($this, node.children[0], 3);
  js.Emitter.emit($this, " ? ");
  js.Emitter.emitExpression($this, node.children[1], 2);
  js.Emitter.emit($this, " : ");
  js.Emitter.emitExpression($this, node.children[2], 2);
  if (2 < precedence) {
    js.Emitter.emit($this, ")");
  }
};
js.Emitter.emitInt = function($this, node) {
  var wrap = node.parent.kind === 45 && node !== $this.toStringTarget;
  if (wrap) {
    js.Emitter.emit($this, "(");
  }
  js.Emitter.emit($this, node.content.value.toString());
  if (wrap) {
    js.Emitter.emit($this, ")");
  }
};
js.Emitter.emitDouble = function($this, node) {
  var wrap = node.parent.kind === 45 && node !== $this.toStringTarget;
  if (wrap) {
    js.Emitter.emit($this, "(");
  }
  js.Emitter.emit($this, node.content.value.toString());
  if (wrap) {
    js.Emitter.emit($this, ")");
  }
};
js.Emitter.emitList = function($this, node) {
  js.Emitter.emit($this, "[");
  js.Emitter.emitCommaSeparatedExpressions($this, node.children);
  js.Emitter.emit($this, "]");
};
js.Emitter.emitDot = function($this, node) {
  js.Emitter.emitExpression($this, node.children[0], 15);
  js.Emitter.emit($this, ".");
  var name = node.children[1];
  js.Emitter.emit($this, name.symbol === null ? name.content.value : $in.SymbolKind.isInstance(name.symbol.kind) ? js.Emitter.mangleName(name.symbol) : js.Emitter.fullName(name.symbol));
};
js.Emitter.emitCall = function($this, node) {
  var value = node.children[0];
  if (value.kind === 35) {
    js.Emitter.emit($this, "new ");
  }
  js.Emitter.emitExpression($this, value, 14);
  js.Emitter.emit($this, "(");
  js.Emitter.emitCommaSeparatedExpressions($this, Node.callArguments(node));
  js.Emitter.emit($this, ")");
};
js.Emitter.emitSuperCall = function($this, node) {
  var $arguments = node.children;
  js.Emitter.emit($this, js.Emitter.fullName(node.symbol));
  js.Emitter.emit($this, ".call(this");
  for (var i = 0; i < $arguments.length; i = i + 1 | 0) {
    js.Emitter.emit($this, ", ");
    js.Emitter.emitExpression($this, $arguments[i], 1);
  }
  js.Emitter.emit($this, ")");
};
js.Emitter.emitSequence = function($this, node, precedence) {
  if (1 <= precedence) {
    js.Emitter.emit($this, "(");
  }
  js.Emitter.emitCommaSeparatedExpressions($this, node.children);
  if (1 <= precedence) {
    js.Emitter.emit($this, ")");
  }
};
js.Emitter.emitLambda = function($this, node, wasStartOfExpression) {
  if (wasStartOfExpression) {
    js.Emitter.emit($this, "(");
  }
  js.Emitter.emit($this, "function");
  js.Emitter.emitArgumentVariables($this, Node.lambdaArguments(node));
  js.Emitter.emit($this, " ");
  js.Emitter.emitNode($this, Node.lambdaBlock(node));
  if (wasStartOfExpression) {
    js.Emitter.emit($this, ")");
  }
};
js.Emitter.emitUnary = function($this, node, precedence) {
  var value = node.children[0];
  var info = operatorInfo.get(node.kind);
  if (info.precedence < precedence) {
    js.Emitter.emit($this, "(");
  }
  var isPostfix = info.precedence === 14;
  if (!isPostfix) {
    js.Emitter.emit($this, info.text);
    if (node.kind === 59 && (value.kind === 59 || value.kind === 62) || node.kind === 60 && (value.kind === 60 || value.kind === 63 || value.kind === 40 && value.content.value < 0)) {
      js.Emitter.emit($this, " ");
    }
  }
  js.Emitter.emitExpression($this, value, info.precedence);
  if (isPostfix) {
    js.Emitter.emit($this, info.text);
  }
  if (info.precedence < precedence) {
    js.Emitter.emit($this, ")");
  }
};
js.Emitter.isToStringCall = function(node) {
  if (node.kind === 47) {
    var value = node.children[0];
    return value.kind === 45 && value.symbol !== null && value.symbol.name === "toString" && Node.callArguments(node).length === 0;
  }
  return false;
};
js.Emitter.emitBinary = function($this, node, precedence) {
  var info = operatorInfo.get(node.kind);
  if (info.precedence < precedence) {
    js.Emitter.emit($this, "(");
  }
  var left = node.children[0];
  var right = node.children[1];
  if (node.kind === 66) {
    if (left.type !== null && left.type === $this.cache.stringType && js.Emitter.isToStringCall(right)) {
      right = right.children[0].children[0];
    } else if (right.type !== null && right.type === $this.cache.stringType && js.Emitter.isToStringCall(left)) {
      left = left.children[0].children[0];
    }
  }
  $this.toStringTarget = left;
  js.Emitter.emitExpression($this, left, info.precedence + (info.associativity === 2 | 0) | 0);
  js.Emitter.emit($this, node.kind === 71 ? " === " : node.kind === 81 ? " !== " : " " + info.text + " ");
  $this.toStringTarget = right;
  js.Emitter.emitExpression($this, right, info.precedence + (info.associativity === 1 | 0) | 0);
  if (info.precedence < precedence) {
    js.Emitter.emit($this, ")");
  }
};
js.Emitter.emitIndex = function($this, node, precedence) {
  js.Emitter.emitExpression($this, node.children[0], 15);
  js.Emitter.emit($this, "[");
  js.Emitter.emitExpression($this, node.children[1], 0);
  js.Emitter.emit($this, "]");
};
js.Emitter.emitTertiary = function($this, node, precedence) {
  if (2 < precedence) {
    js.Emitter.emit($this, "(");
  }
  js.Emitter.emitExpression($this, node.children[0], 15);
  js.Emitter.emit($this, "[");
  js.Emitter.emitExpression($this, node.children[1], 0);
  js.Emitter.emit($this, "] = ");
  js.Emitter.emitExpression($this, node.children[2], 2);
  if (2 < precedence) {
    js.Emitter.emit($this, ")");
  }
};
js.Emitter.alwaysConvertsOperandsToInt = function(kind) {
  switch (kind) {
  case 68:
  case 67:
  case 69:
  case 83:
  case 84:
  case 89:
  case 88:
  case 90:
  case 94:
  case 95:
    return true;
  default:
    return false;
  }
};
js.Emitter.isExpressionUsed = function(node) {
  var parent = node.parent;
  if (!$in.NodeKind.isExpression(parent.kind)) {
    return false;
  }
  if (parent.kind === 50 && (!js.Emitter.isExpressionUsed(parent) || parent.children.indexOf(node) < (parent.children.length - 1 | 0))) {
    return false;
  }
  return true;
};
js.Emitter.patchNode = function($this, node, context) {
  switch (node.kind) {
  case 54:
    context.lambdaCount = context.lambdaCount + 1 | 0;
    break;
  case 14:
    js.Emitter.patchConstructor(node, context);
    js.PatchContext.setFunction(context, node);
    break;
  case 15:
    js.PatchContext.setFunction(context, node);
    break;
  case 52:
    js.Emitter.patchCast($this, node, context);
    break;
  case 10:
    js.Emitter.patchClass($this, node);
    break;
  case 36:
    js.Emitter.patchThis(node, context);
    break;
  case 34:
    js.Emitter.patchName(node);
    break;
  case 66:
  case 85:
  case 80:
  case 70:
  case 82:
    js.Emitter.patchBinary($this, node);
    break;
  case 62:
  case 63:
  case 65:
  case 64:
    js.Emitter.patchUnary($this, node, context);
    break;
  case 87:
  case 96:
  case 92:
  case 91:
  case 93:
    js.Emitter.patchAssign($this, node, context);
    break;
  }
  if (node.kind === 46) {
    js.Emitter.patchLet(node);
  }
  if (Node.hasChildren(node)) {
    for (var i = 0; i < node.children.length; i = i + 1 | 0) {
      var child = node.children[i];
      if (child !== null) {
        js.Emitter.patchNode($this, child, context);
      }
    }
  }
  switch (node.kind) {
  case 54:
    context.lambdaCount = context.lambdaCount - 1 | 0;
    break;
  case 14:
  case 15:
    js.PatchContext.setFunction(context, null);
    break;
  }
};
js.Emitter.patchThis = function(node, context) {
  if (context.lambdaCount > 0) {
    Node.become(node, js.PatchContext.thisAlias(context));
  }
};
js.Emitter.patchClass = function($this, node) {
  if ((node.symbol.flags & 8192) === 0 && Type.baseClass(node.symbol.type) !== null) {
    $this.needExtends = true;
  }
};
js.Emitter.patchName = function(node) {
  if (node.symbol !== null && $in.SymbolKind.isInstance(node.symbol.kind) && Node.isNameExpression(node)) {
    Node.become(node, Node.withChildren(new Node(45), [new Node(36), Node.clone(node)]));
  }
};
js.Emitter.patchBinary = function($this, node) {
  if (node.type === $this.cache.intType && (node.kind === 80 || !js.Emitter.alwaysConvertsOperandsToInt(node.parent.kind))) {
    Node.become(node, Node.withRange(js.Emitter.createBinaryInt($this, node.kind, Node.replaceWith(node.children[0], null), Node.replaceWith(node.children[1], null)), node.range));
  }
};
js.Emitter.patchLet = function(node) {
  var value = Node.replaceWith(node.children[1], null);
  var variable = Node.replaceWith(node.children[0], null);
  Node.become(node, Node.createCall(Node.createLambda([variable], Node.withChildren(new Node(2), [Node.withChildren(new Node(24), [value])])), [Node.replaceWith(variable.children[2], null)]));
};
js.Emitter.patchAssign = function($this, node, context) {
  if (node.type === $this.cache.intType) {
    var isPostfix = node.kind === 64 || node.kind === 65;
    var isIncrement = node.kind === 62 || node.kind === 64;
    var left = node.children[0];
    var right = node.children[1];
    var kind = node.kind === 87 ? 66 : node.kind === 96 ? 85 : node.kind === 92 ? 80 : node.kind === 91 ? 70 : 82;
    Node.become(node, Node.withRange(js.Emitter.createBinaryIntAssignment($this, context, kind, Node.remove(left), Node.remove(right)), node.range));
  }
};
js.Emitter.patchUnary = function($this, node, context) {
  if (node.type === $this.cache.intType) {
    var isPostfix = node.kind === 64 || node.kind === 65;
    var isIncrement = node.kind === 62 || node.kind === 64;
    var result = js.Emitter.createBinaryIntAssignment($this, context, isIncrement ? 66 : 85, Node.remove(node.children[0]), Node.withContent(new Node(40), new IntContent(1)));
    if (isPostfix && js.Emitter.isExpressionUsed(node)) {
      result = js.Emitter.createBinaryInt($this, isIncrement ? 85 : 66, result, Node.withContent(new Node(40), new IntContent(1)));
    }
    Node.become(node, Node.withType(Node.withRange(result, node.range), node.type));
  }
};
js.Emitter.patchCast = function($this, node, context) {
  var value = node.children[1];
  if (node.type === $this.cache.boolType && value.type !== $this.cache.boolType) {
    value = Node.withType(Node.withRange(Node.withChildren(new Node(58), [Node.remove(value)]), node.range), node.type);
    Node.become(node, Node.withType(Node.withRange(Node.withChildren(new Node(58), [value]), node.range), node.type));
  } else if (node.type === $this.cache.intType && !Type.isInteger(value.type, $this.cache) && !js.Emitter.alwaysConvertsOperandsToInt(node.parent.kind)) {
    Node.become(node, Node.withType(Node.withRange(Node.createBinary(68, Node.remove(value), Node.withContent(new Node(40), new IntContent(0))), node.range), node.type));
  } else if (Type.isReal(node.type, $this.cache) && !Type.isNumeric(value.type, $this.cache)) {
    Node.become(node, Node.withType(Node.withRange(Node.withChildren(new Node(59), [Node.remove(value)]), node.range), node.type));
  }
};
js.Emitter.patchConstructor = function(node, context) {
  var block = node.children[2];
  if (block === null) {
    return;
  }
  var superInitializer = node.children[3];
  var memberInitializers = node.children[4];
  var index = 0;
  if (superInitializer !== null) {
    Node.insertChild(block, (index = index + 1 | 0) - 1 | 0, Node.withChildren(new Node(30), [Node.replaceWith(superInitializer, null)]));
  }
  if (memberInitializers !== null) {
    for (var i = 0; i < memberInitializers.children.length; i = i + 1 | 0) {
      var child = memberInitializers.children[i];
      var name = child.children[0];
      var value = child.children[1];
      Node.insertChild(block, (index = index + 1 | 0) - 1 | 0, Node.withChildren(new Node(30), [Node.createBinary(86, Node.remove(name), Node.remove(value))]));
    }
  }
};
js.Emitter.createBinaryInt = function($this, kind, left, right) {
  if (kind === 80) {
    $this.needMathImul = true;
    return Node.withType(Node.createCall(Node.withContent(new Node(34), new StringContent("$imul")), [left, right]), $this.cache.intType);
  }
  return Node.withType(Node.createBinary(68, Node.withType(Node.createBinary(kind, left, right), $this.cache.intType), Node.withType(Node.withContent(new Node(40), new IntContent(0)), $this.cache.intType)), $this.cache.intType);
};
js.Emitter.isSimpleNameAccess = function(node) {
  return node.kind === 34 || node.kind === 36 || node.kind === 45 && js.Emitter.isSimpleNameAccess(node.children[0]);
};
js.Emitter.createBinaryIntAssignment = function($this, context, kind, left, right) {
  if (js.Emitter.isSimpleNameAccess(left)) {
    return Node.createBinary(86, Node.clone(left), js.Emitter.createBinaryInt($this, kind, left, right));
  }
  var target = left.children[0];
  var name = left.children[1];
  var temporaryName = Node.withContent(new Node(34), new StringContent("$temp"));
  var dot = Node.withChildren(new Node(45), [temporaryName, Node.remove(name)]);
  return Node.withType(Node.withChildren(new Node(46), [Node.withChildren(new Node(16), [Node.clone(temporaryName), null, Node.remove(target)]), Node.withType(Node.createBinary(86, dot, js.Emitter.createBinaryInt($this, kind, Node.clone(dot), right)), $this.cache.intType)]), $this.cache.intType);
};
js.Emitter.hasCompoundName = function(symbol) {
  var enclosingSymbol = symbol.enclosingSymbol;
  return enclosingSymbol !== null && enclosingSymbol.kind !== 7 && (symbol.kind !== 16 || js.Emitter.hasCompoundName(enclosingSymbol));
};
js.Emitter.createIsKeyword = function() {
  var result = new StringMap();
  result.set("apply", true);
  result.set("arguments", true);
  result.set("call", true);
  result.set("constructor", true);
  result.set("double", true);
  result.set("float", true);
  result.set("function", true);
  result.set("in", true);
  result.set("int", true);
  result.set("this", true);
  result.set("throw", true);
  return result;
};
js.Emitter.mangleName = function(symbol) {
  if ((symbol.flags & 12288) !== 0) {
    return symbol.name;
  }
  if (symbol.kind === 16) {
    return js.Emitter.mangleName(symbol.enclosingSymbol);
  }
  if (js.Emitter.isKeyword.has(symbol.name)) {
    return "$" + symbol.name;
  }
  return symbol.name;
};
js.Emitter.fullName = function(symbol) {
  var enclosingSymbol = symbol.enclosingSymbol;
  if (enclosingSymbol !== null && enclosingSymbol.kind !== 7) {
    var enclosingName = js.Emitter.fullName(enclosingSymbol);
    if (symbol.kind === 16) {
      return enclosingName;
    }
    if ($in.SymbolKind.isInstance(symbol.kind)) {
      enclosingName += ".prototype";
    }
    return enclosingName + "." + js.Emitter.mangleName(symbol);
  }
  return js.Emitter.mangleName(symbol);
};
function SourceMapping(_0, _1, _2, _3, _4) {
  this.sourceIndex = _0;
  this.originalLine = _1;
  this.originalColumn = _2;
  this.generatedLine = _3;
  this.generatedColumn = _4;
}
function SourceMapGenerator() {
  this.mappings = [];
  this.sources = [];
}
SourceMapGenerator.addMapping = function($this, source, originalLine, originalColumn, generatedLine, generatedColumn) {
  var sourceIndex = $this.sources.indexOf(source);
  if (sourceIndex === -1) {
    sourceIndex = $this.sources.length;
    $this.sources.push(source);
  }
  $this.mappings.push(new SourceMapping(sourceIndex, originalLine, originalColumn, generatedLine, generatedColumn));
};
SourceMapGenerator.toString = function($this) {
  var sourceNames = [];
  var sourceContents = [];
  for (var i = 0; i < $this.sources.length; i = i + 1 | 0) {
    var source = $this.sources[i];
    sourceNames.push(quoteString(source.name, 34));
    sourceContents.push(quoteString(source.contents, 34));
  }
  var result = "{\"version\":3,\"sources\":[" + sourceNames.join(",") + "],\"sourcesContent\":[" + sourceContents.join(",") + "],\"names\":[],\"mappings\":\"";
  $this.mappings.sort(function(left, right) {
    var delta = left.generatedLine - right.generatedLine | 0;
    return delta !== 0 ? delta : left.generatedColumn - right.generatedColumn | 0;
  });
  var previousGeneratedColumn = 0;
  var previousGeneratedLine = 0;
  var previousOriginalColumn = 0;
  var previousOriginalLine = 0;
  var previousSourceIndex = 0;
  for (var i = 0; i < $this.mappings.length; i = i + 1 | 0) {
    var mapping = $this.mappings[i];
    var generatedLine = mapping.generatedLine;
    if (previousGeneratedLine === generatedLine) {
      if (previousGeneratedColumn === mapping.generatedColumn && (previousGeneratedLine > 0 || previousGeneratedColumn > 0)) {
        continue;
      }
      result += ",";
    } else {
      previousGeneratedColumn = 0;
      while (previousGeneratedLine < generatedLine) {
        result += ";";
        previousGeneratedLine = previousGeneratedLine + 1 | 0;
      }
    }
    result += SourceMapGenerator.encodeVLQ(mapping.generatedColumn - previousGeneratedColumn | 0);
    previousGeneratedColumn = mapping.generatedColumn;
    result += SourceMapGenerator.encodeVLQ(mapping.sourceIndex - previousSourceIndex | 0);
    previousSourceIndex = mapping.sourceIndex;
    result += SourceMapGenerator.encodeVLQ(mapping.originalLine - previousOriginalLine | 0);
    previousOriginalLine = mapping.originalLine;
    result += SourceMapGenerator.encodeVLQ(mapping.originalColumn - previousOriginalColumn | 0);
    previousOriginalColumn = mapping.originalColumn;
  }
  return result + "\"}\n";
};
SourceMapGenerator.encodeVLQ = function(value) {
  var vlq = value < 0 ? -value << 1 | 1 : value << 1;
  var encoded = "";
  do {
    var digit = vlq & 31;
    vlq >>= 5;
    if (vlq > 0) {
      digit |= 32;
    }
    encoded += BASE64[digit];
  } while (vlq > 0);
  return encoded;
};
function Token(_0, _1, _2) {
  this.range = _0;
  this.kind = _1;
  this.text = _2;
}
function ParserContext(_0, _1) {
  this.index = 0;
  this.previousSyntaxError = null;
  this.log = _0;
  this.tokens = _1;
}
ParserContext.current = function($this) {
  return $this.tokens[$this.index];
};
ParserContext.next = function($this) {
  var token = ParserContext.current($this);
  if (($this.index + 1 | 0) < $this.tokens.length) {
    $this.index = $this.index + 1 | 0;
  }
  return token;
};
ParserContext.spanSince = function($this, range) {
  var previous = $this.tokens[$this.index > 0 ? $this.index - 1 | 0 : 0];
  return previous.range.end < range.start ? range : Range.span(range, previous.range);
};
ParserContext.eat = function($this, kind) {
  if (ParserContext.current($this).kind === kind) {
    ParserContext.next($this);
    return true;
  }
  return false;
};
ParserContext.expect = function($this, kind) {
  if (!ParserContext.eat($this, kind)) {
    var token = ParserContext.current($this);
    if ($this.previousSyntaxError !== token) {
      syntaxErrorExpectedToken($this.log, token, kind);
      $this.previousSyntaxError = token;
    }
    return false;
  }
  return true;
};
ParserContext.unexpectedToken = function($this) {
  var token = ParserContext.current($this);
  if ($this.previousSyntaxError !== token) {
    syntaxErrorUnexpectedToken($this.log, token);
    $this.previousSyntaxError = token;
  }
};
function Parselet(_0) {
  this.prefix = null;
  this.infix = null;
  this.precedence = _0;
}
function Pratt() {
  this.table = new IntMap();
}
Pratt.parselet = function($this, kind, precedence) {
  var parselet = $this.table.getOrDefault(kind, null);
  if (parselet === null) {
    var created = new Parselet(precedence);
    parselet = created;
    $this.table.set(kind, created);
  } else if (precedence > parselet.precedence) {
    parselet.precedence = precedence;
  }
  return parselet;
};
Pratt.parseIgnoringParselet = function($this, context, precedence, parseletToIgnore) {
  var token = ParserContext.current(context);
  var parselet = $this.table.getOrDefault(token.kind, null);
  if (parselet === null || parselet === parseletToIgnore || parselet.prefix === null) {
    ParserContext.unexpectedToken(context);
    return Node.withRange(new Node(49), ParserContext.spanSince(context, token.range));
  }
  var node = Pratt.resumeIgnoringParselet($this, context, precedence, parselet.prefix(context), parseletToIgnore);
  return node;
};
Pratt.resumeIgnoringParselet = function($this, context, precedence, left, parseletToIgnore) {
  while (left.kind !== 49) {
    var kind = ParserContext.current(context).kind;
    var parselet = $this.table.getOrDefault(kind, null);
    if (parselet === null || parselet === parseletToIgnore || parselet.infix === null || parselet.precedence <= precedence) {
      break;
    }
    left = parselet.infix(context, left);
  }
  return left;
};
Pratt.literal = function($this, kind, callback) {
  Pratt.parselet($this, kind, 0).prefix = function(context) {
    return callback(context, ParserContext.next(context));
  };
};
Pratt.prefix = function($this, kind, precedence, callback) {
  Pratt.parselet($this, kind, 0).prefix = function(context) {
    var token = ParserContext.next(context);
    var value = Pratt.parseIgnoringParselet(pratt, context, precedence, null);
    return value !== null ? callback(context, token, value) : null;
  };
};
Pratt.postfix = function($this, kind, precedence, callback) {
  Pratt.parselet($this, kind, precedence).infix = function(context, left) {
    return callback(context, left, ParserContext.next(context));
  };
};
Pratt.infix = function($this, kind, precedence, callback) {
  Pratt.parselet($this, kind, precedence).infix = function(context, left) {
    var token = ParserContext.next(context);
    var right = Pratt.parseIgnoringParselet(pratt, context, precedence, null);
    return right !== null ? callback(context, left, token, right) : null;
  };
};
Pratt.infixRight = function($this, kind, precedence, callback) {
  Pratt.parselet($this, kind, precedence).infix = function(context, left) {
    var token = ParserContext.next(context);
    var right = Pratt.parseIgnoringParselet(pratt, context, precedence - 1 | 0, null);
    return right !== null ? callback(context, left, token, right) : null;
  };
};
function CallInfo(_0) {
  this.callSites = [];
  this.symbol = _0;
}
function CallGraph(program) {
  this.callInfo = [];
  this.symbolToInfoIndex = new IntMap();
  CallGraph.visit(this, program);
}
CallGraph.visit = function($this, node) {
  if (Node.hasChildren(node)) {
    for (var i = 0; i < node.children.length; i = i + 1 | 0) {
      var child = node.children[i];
      if (child !== null) {
        CallGraph.visit($this, child);
      }
    }
  }
  if (node.kind === 47) {
    var value = node.children[0];
    if (value.symbol !== null && $in.SymbolKind.isFunction(value.symbol.kind)) {
      CallGraph.recordCallSite($this, value.symbol, node);
    }
  } else if (node.kind === 15) {
    CallGraph.recordCallSite($this, node.symbol, null);
  }
};
CallGraph.recordCallSite = function($this, symbol, node) {
  var index = $this.symbolToInfoIndex.getOrDefault(symbol.uniqueID, -1);
  var info = index < 0 ? new CallInfo(symbol) : $this.callInfo[index];
  if (index < 0) {
    $this.symbolToInfoIndex.set(symbol.uniqueID, $this.callInfo.length);
    $this.callInfo.push(info);
  }
  if (node !== null) {
    info.callSites.push(node);
  }
};
function ConstantFolder(_0) {
  this.cache = _0;
}
ConstantFolder.flatten = function($this, node, content) {
  Node.removeChildren(node);
  switch (content.type()) {
  case 0:
    node.kind = 39;
    break;
  case 1:
    node.kind = 40;
    break;
  case 2:
    node.kind = node.type === $this.cache.floatType ? 41 : 42;
    break;
  case 3:
    node.kind = 43;
    break;
  }
  node.content = content;
};
ConstantFolder.blockContainsVariableCluster = function(node) {
  if (Node.hasChildren(node)) {
    for (var i = 0; i < node.children.length; i = i + 1 | 0) {
      if (node.children[i].kind === 6) {
        return true;
      }
    }
  }
  return false;
};
ConstantFolder.foldConstants = function($this, node) {
  var kind = node.kind;
  if (kind === 66 && node.type === $this.cache.stringType) {
    ConstantFolder.rotateStringConcatenation(node);
  }
  if (Node.hasChildren(node)) {
    for (var i = 0; i < node.children.length; i = i + 1 | 0) {
      var child = node.children[i];
      if (child !== null) {
        ConstantFolder.foldConstants($this, child);
      }
    }
    if (kind === 2) {
      ConstantFolder.foldBlock(node);
      return;
    } else if (kind === 50) {
      ConstantFolder.foldSequence(node);
      return;
    }
  }
  if (kind === 34) {
    ConstantFolder.foldName($this, node);
  } else if ($in.NodeKind.isCast(kind)) {
    ConstantFolder.foldCast($this, node);
  } else if ($in.NodeKind.isUnaryOperator(kind)) {
    ConstantFolder.foldUnaryOperator($this, node, kind);
  } else if ($in.NodeKind.isBinaryOperator(kind)) {
    ConstantFolder.foldBinaryOperator($this, node, kind);
  } else if (kind === 37) {
    ConstantFolder.foldHook(node);
  }
};
ConstantFolder.rotateStringConcatenation = function(node) {
  var left = node.children[0];
  var right = node.children[1];
  if (right.kind === 66) {
    var rightLeft = right.children[0];
    var rightRight = right.children[1];
    Node.swapWith(left, right);
    Node.swapWith(left, rightRight);
    Node.swapWith(left, rightLeft);
  }
};
ConstantFolder.foldStringConcatenation = function($this, node) {
  var left = node.children[0];
  var right = node.children[1];
  if (right.kind === 43) {
    if (left.kind === 43) {
      ConstantFolder.flatten($this, node, new StringContent(left.content.value + right.content.value));
    } else if (left.kind === 66) {
      var leftLeft = left.children[0];
      var leftRight = left.children[1];
      if (leftRight.kind === 43) {
        ConstantFolder.flatten($this, leftRight, new StringContent(leftRight.content.value + right.content.value));
        Node.become(node, Node.remove(left));
      }
    }
  }
};
ConstantFolder.foldBlock = function(node) {
  for (var i = 0; i < node.children.length; i = i + 1 | 0) {
    var child = node.children[i];
    if (child.kind === 30 && Node.hasNoSideEffects(child.children[0]) || child.kind === 22 && Node.isFalse(child.children[0])) {
      Node.removeChildAtIndex(node, i);
      i = i - 1 | 0;
    } else if (child.kind === 20) {
      var test = child.children[1];
      if (test !== null && Node.isFalse(test)) {
        var setup = child.children[0];
        if (setup === null || Node.hasNoSideEffects(setup)) {
          Node.removeChildAtIndex(node, i);
          i = i - 1 | 0;
        } else if (setup.kind !== 6) {
          Node.replaceWith(child, Node.withChildren(new Node(30), [Node.remove(setup)]));
        } else {
          var update = child.children[2];
          if (update !== null) {
            Node.replaceWith(update, null);
          }
          Node.removeChildren(child.children[3]);
        }
      }
    } else if (child.kind === 19) {
      var test = child.children[0];
      var trueBlock = child.children[1];
      var falseBlock = child.children[2];
      if (Node.isTrue(test)) {
        if (falseBlock !== null) {
          Node.replaceWith(falseBlock, null);
        }
        if (!ConstantFolder.blockContainsVariableCluster(trueBlock)) {
          var replacements = Node.removeChildren(trueBlock);
          Node.replaceWithNodes(child, replacements);
          i = i + (replacements.length - 1 | 0) | 0;
        }
      } else if (Node.isFalse(test)) {
        if (falseBlock === null) {
          Node.removeChildAtIndex(node, i);
          i = i - 1 | 0;
        } else if (!ConstantFolder.blockContainsVariableCluster(falseBlock)) {
          var replacements = Node.removeChildren(falseBlock);
          Node.replaceWithNodes(child, replacements);
          i = i + (replacements.length - 1 | 0) | 0;
        } else {
          Node.replaceWith(test, Node.withType(Node.withContent(new Node(39), new BoolContent(true)), test.type));
          Node.replaceWith(trueBlock, Node.replaceWith(falseBlock, null));
        }
      }
    }
  }
};
ConstantFolder.foldName = function($this, node) {
  if (node.symbol !== null && node.symbol.constant !== null) {
    ConstantFolder.flatten($this, node, node.symbol.constant);
  }
};
ConstantFolder.foldCast = function($this, node) {
  var type = node.children[0].type;
  var value = node.children[1];
  var valueKind = value.kind;
  if (valueKind === 39) {
    if (type === $this.cache.boolType) {
      ConstantFolder.flatten($this, node, new BoolContent(value.content.value));
    } else if (Type.isInteger(type, $this.cache)) {
      ConstantFolder.flatten($this, node, new IntContent(value.content.value | 0));
    } else if (Type.isReal(type, $this.cache)) {
      ConstantFolder.flatten($this, node, new DoubleContent(+value.content.value));
    }
  } else if (valueKind === 40) {
    if (type === $this.cache.boolType) {
      ConstantFolder.flatten($this, node, new BoolContent(!!value.content.value));
    } else if (Type.isInteger(type, $this.cache)) {
      ConstantFolder.flatten($this, node, new IntContent(value.content.value));
    } else if (Type.isReal(type, $this.cache)) {
      ConstantFolder.flatten($this, node, new DoubleContent(value.content.value));
    }
  } else if ($in.NodeKind.isReal(valueKind)) {
    if (type === $this.cache.boolType) {
      ConstantFolder.flatten($this, node, new BoolContent(!!value.content.value));
    } else if (Type.isInteger(type, $this.cache)) {
      ConstantFolder.flatten($this, node, new IntContent(value.content.value | 0));
    } else if (Type.isReal(type, $this.cache)) {
      ConstantFolder.flatten($this, node, new DoubleContent(value.content.value));
    }
  }
};
ConstantFolder.foldUnaryOperator = function($this, node, kind) {
  var value = node.children[0];
  var valueKind = value.kind;
  if (valueKind === 39) {
    if (kind === 58) {
      ConstantFolder.flatten($this, node, new BoolContent(!value.content.value));
    }
  } else if (valueKind === 40) {
    if (kind === 59) {
      ConstantFolder.flatten($this, node, new IntContent(+value.content.value));
    } else if (kind === 60) {
      ConstantFolder.flatten($this, node, new IntContent(-value.content.value));
    } else if (kind === 61) {
      ConstantFolder.flatten($this, node, new IntContent(~value.content.value));
    }
  } else if ($in.NodeKind.isReal(valueKind)) {
    if (kind === 59) {
      ConstantFolder.flatten($this, node, new DoubleContent(+value.content.value));
    } else if (kind === 60) {
      ConstantFolder.flatten($this, node, new DoubleContent(-value.content.value));
    }
  } else if (kind === 58) {
    switch (valueKind) {
    case 58:
    case 71:
    case 81:
    case 79:
    case 78:
    case 76:
    case 72:
    case 77:
    case 73:
      Node.invertBooleanCondition(value, $this.cache);
      Node.become(node, value);
      break;
    }
  }
};
ConstantFolder.foldMultiply = function(node, variable, constant) {
  if (node.children[0] === constant) {
    Node.swapWith(variable, constant);
  }
  var value = constant.content.value;
  if (value === 0) {
    if (Node.hasNoSideEffects(variable)) {
      Node.become(node, Node.remove(constant));
    }
    return;
  }
  if (value === 1) {
    Node.become(node, Node.remove(variable));
    return;
  }
  var shift = logBase2(value);
  if (shift !== -1) {
    constant.content = new IntContent(shift);
    node.kind = 83;
  }
};
ConstantFolder.foldBinaryOperatorWithConstant = function(node, left, right) {
  switch (node.kind) {
  case 78:
    if (Node.isFalse(left) || Node.isTrue(right)) {
      Node.become(node, Node.remove(left));
    } else if (Node.isTrue(left)) {
      Node.become(node, Node.remove(right));
    }
    break;
  case 79:
    if (Node.isTrue(left) || Node.isFalse(right)) {
      Node.become(node, Node.remove(left));
    } else if (Node.isFalse(left)) {
      Node.become(node, Node.remove(right));
    }
    break;
  case 80:
    if (left.kind === 40) {
      ConstantFolder.foldMultiply(node, right, left);
    } else if (right.kind === 40) {
      ConstantFolder.foldMultiply(node, left, right);
    }
    break;
  }
};
ConstantFolder.foldBinaryOperator = function($this, node, kind) {
  if (kind === 66 && node.type === $this.cache.stringType) {
    ConstantFolder.foldStringConcatenation($this, node);
    return;
  }
  var left = node.children[0];
  var right = node.children[1];
  if (left.kind !== right.kind) {
    ConstantFolder.foldBinaryOperatorWithConstant(node, left, right);
    return;
  }
  if (left.kind === 39) {
    switch (kind) {
    case 78:
      ConstantFolder.flatten($this, node, new BoolContent(left.content.value && right.content.value));
      break;
    case 79:
      ConstantFolder.flatten($this, node, new BoolContent(left.content.value || right.content.value));
      break;
    case 71:
      ConstantFolder.flatten($this, node, new BoolContent(left.content.value === right.content.value));
      break;
    case 81:
      ConstantFolder.flatten($this, node, new BoolContent(left.content.value !== right.content.value));
      break;
    }
  } else if (left.kind === 40) {
    switch (kind) {
    case 66:
      ConstantFolder.flatten($this, node, new IntContent(left.content.value + right.content.value | 0));
      break;
    case 85:
      ConstantFolder.flatten($this, node, new IntContent(left.content.value - right.content.value | 0));
      break;
    case 80:
      ConstantFolder.flatten($this, node, new IntContent($imul(left.content.value, right.content.value)));
      break;
    case 70:
      ConstantFolder.flatten($this, node, new IntContent(left.content.value / right.content.value | 0));
      break;
    case 82:
      ConstantFolder.flatten($this, node, new IntContent(left.content.value % right.content.value | 0));
      break;
    case 83:
      ConstantFolder.flatten($this, node, new IntContent(left.content.value << right.content.value));
      break;
    case 84:
      ConstantFolder.flatten($this, node, new IntContent(left.content.value >> right.content.value));
      break;
    case 67:
      ConstantFolder.flatten($this, node, new IntContent(left.content.value & right.content.value));
      break;
    case 68:
      ConstantFolder.flatten($this, node, new IntContent(left.content.value | right.content.value));
      break;
    case 69:
      ConstantFolder.flatten($this, node, new IntContent(left.content.value ^ right.content.value));
      break;
    case 71:
      ConstantFolder.flatten($this, node, new BoolContent(left.content.value === right.content.value));
      break;
    case 81:
      ConstantFolder.flatten($this, node, new BoolContent(left.content.value !== right.content.value));
      break;
    case 76:
      ConstantFolder.flatten($this, node, new BoolContent(left.content.value < right.content.value));
      break;
    case 72:
      ConstantFolder.flatten($this, node, new BoolContent(left.content.value > right.content.value));
      break;
    case 77:
      ConstantFolder.flatten($this, node, new BoolContent(left.content.value <= right.content.value));
      break;
    case 73:
      ConstantFolder.flatten($this, node, new BoolContent(left.content.value >= right.content.value));
      break;
    }
  } else if ($in.NodeKind.isReal(left.kind)) {
    switch (kind) {
    case 66:
      ConstantFolder.flatten($this, node, new DoubleContent(left.content.value + right.content.value));
      break;
    case 85:
      ConstantFolder.flatten($this, node, new DoubleContent(left.content.value - right.content.value));
      break;
    case 80:
      ConstantFolder.flatten($this, node, new DoubleContent(left.content.value * right.content.value));
      break;
    case 70:
      ConstantFolder.flatten($this, node, new DoubleContent(left.content.value / right.content.value));
      break;
    case 71:
      ConstantFolder.flatten($this, node, new BoolContent(left.content.value === right.content.value));
      break;
    case 81:
      ConstantFolder.flatten($this, node, new BoolContent(left.content.value !== right.content.value));
      break;
    case 76:
      ConstantFolder.flatten($this, node, new BoolContent(left.content.value < right.content.value));
      break;
    case 72:
      ConstantFolder.flatten($this, node, new BoolContent(left.content.value > right.content.value));
      break;
    case 77:
      ConstantFolder.flatten($this, node, new BoolContent(left.content.value <= right.content.value));
      break;
    case 73:
      ConstantFolder.flatten($this, node, new BoolContent(left.content.value >= right.content.value));
      break;
    }
  }
};
ConstantFolder.foldHook = function(node) {
  var test = node.children[0];
  if (Node.isTrue(test)) {
    Node.become(node, Node.remove(node.children[1]));
  } else if (Node.isFalse(test)) {
    Node.become(node, Node.remove(node.children[2]));
  }
};
ConstantFolder.foldSequence = function(node) {
  var i = 0;
  while ((i + 1 | 0) < node.children.length) {
    if (Node.hasNoSideEffects(node.children[i])) {
      Node.removeChildAtIndex(node, i);
    } else {
      i = i + 1 | 0;
    }
  }
  if (node.children.length === 1) {
    Node.become(node, Node.remove(node.children[0]));
  } else {
    var last = node.children[i];
    if (Node.hasNoSideEffects(last) && node.parent.kind === 30) {
      Node.remove(last);
    }
  }
};
function DeadCodeRemovalPass(_0) {
  this.includedSymbols = new IntMap();
  this.options = _0;
}
DeadCodeRemovalPass.run = function(program, options, resolver) {
  var pass = new DeadCodeRemovalPass(options);
  var symbols = resolver.allSymbols;
  for (var i = 0; i < symbols.length; i = i + 1 | 0) {
    var symbol = symbols[i];
    if ((symbol.flags & 4096) !== 0 || (symbol.flags & 128) !== 0) {
      DeadCodeRemovalPass.includeSymbol(pass, symbol);
    }
  }
  for (var i = 0; i < symbols.length; i = i + 1 | 0) {
    var symbol = symbols[i];
    var node = symbol.node;
    if (node !== null && !pass.includedSymbols.has(symbol.uniqueID)) {
      if (symbol.enclosingSymbol !== null) {
        symbol.enclosingSymbol.type.members.remove(symbol.name);
      }
      symbols.splice(i, 1)[0];
      Node.remove(node);
      i = i - 1 | 0;
    }
  }
};
DeadCodeRemovalPass.includeSymbol = function($this, symbol) {
  if (symbol.kind === 18 && (symbol.flags & 1024) !== 0 && $this.options.foldAllConstants) {
    return;
  }
  if (!$this.includedSymbols.has(symbol.uniqueID)) {
    $this.includedSymbols.set(symbol.uniqueID, true);
    if (symbol.enclosingSymbol !== null && symbol.kind !== 19) {
      DeadCodeRemovalPass.includeSymbol($this, symbol.enclosingSymbol);
    }
    if ($in.SymbolKind.isObject(symbol.kind)) {
      var $constructor = Type.$constructor(symbol.type);
      if ($constructor !== null) {
        DeadCodeRemovalPass.includeSymbol($this, $constructor.symbol);
      }
    }
    if (Type.hasRelevantTypes(symbol.type)) {
      var types = symbol.type.relevantTypes;
      for (var i = 0; i < types.length; i = i + 1 | 0) {
        var relevantSymbol = types[i].symbol;
        if (relevantSymbol !== null) {
          DeadCodeRemovalPass.includeSymbol($this, relevantSymbol);
        }
      }
    }
    var node = symbol.node;
    if (node !== null && !$in.NodeKind.isNamedBlockDeclaration(node.kind)) {
      DeadCodeRemovalPass.visit($this, node);
    }
  }
};
DeadCodeRemovalPass.visit = function($this, node) {
  if (node.symbol !== null) {
    DeadCodeRemovalPass.includeSymbol($this, node.symbol);
  }
  if (Node.hasChildren(node)) {
    for (var i = 0; i < node.children.length; i = i + 1 | 0) {
      var child = node.children[i];
      if (child !== null) {
        DeadCodeRemovalPass.visit($this, child);
      }
    }
  }
};
function FunctionInliningPass() {
}
FunctionInliningPass.run = function(callGraph, options) {
  var graph = new InliningGraph(callGraph, options);
  for (var i = 0; i < graph.inliningInfo.length; i = i + 1 | 0) {
    FunctionInliningPass.inlineSymbol(graph, graph.inliningInfo[i]);
  }
};
FunctionInliningPass.inlineSymbol = function(graph, info) {
  if (!info.shouldInline) {
    return;
  }
  for (var i = 0; i < info.bodyCalls.length; i = i + 1 | 0) {
    FunctionInliningPass.inlineSymbol(graph, info.bodyCalls[i]);
  }
  for (var i = 0; i < info.callSites.length; i = i + 1 | 0) {
    var callSite = info.callSites[i];
    if (callSite !== null && callSite.kind === 47) {
      info.callSites[i] = null;
      var clone = Node.clone(info.inlineValue);
      var values = Node.removeChildren(callSite);
      var value = values.shift();
      if (info.unusedArguments.length > 0) {
        var sequence = null;
        for (var j = 0; j < info.unusedArguments.length; j = j + 1 | 0) {
          var index = info.$arguments.indexOf(info.unusedArguments[j]);
          var replacement = values[index];
          if (!Node.hasNoSideEffects(replacement)) {
            if (sequence === null) {
              sequence = [];
            }
            sequence.push(replacement);
          }
        }
        if (sequence !== null) {
          sequence.push(clone);
          Node.become(callSite, Node.withChildren(new Node(50), sequence));
          FunctionInliningPass.recursivelySubstituteArguments(callSite, info.$arguments, values);
          continue;
        }
      }
      Node.become(callSite, clone);
      FunctionInliningPass.recursivelySubstituteArguments(callSite, info.$arguments, values);
    }
  }
};
FunctionInliningPass.recursivelySubstituteArguments = function(node, $arguments, values) {
  if (node.symbol !== null) {
    var index = $arguments.indexOf(node.symbol);
    if (index >= 0) {
      Node.replaceWith(node, values[index]);
      return;
    }
  }
  if (Node.hasChildren(node)) {
    for (var i = 0; i < node.children.length; i = i + 1 | 0) {
      var child = node.children[i];
      if (child !== null) {
        FunctionInliningPass.recursivelySubstituteArguments(child, $arguments, values);
      }
    }
  }
};
function InliningInfo(_0, _1, _2, _3, _4) {
  this.shouldInline = true;
  this.bodyCalls = [];
  this.symbol = _0;
  this.inlineValue = _1;
  this.callSites = _2;
  this.$arguments = _3;
  this.unusedArguments = _4;
}
function InliningGraph(graph, options) {
  this.inliningInfo = [];
  this.symbolToInfoIndex = new IntMap();
  for (var i = 0; i < graph.callInfo.length; i = i + 1 | 0) {
    var info = InliningGraph.createInliningInfo(graph.callInfo[i], options);
    if (info !== null) {
      this.symbolToInfoIndex.set(info.symbol.uniqueID, this.inliningInfo.length);
      this.inliningInfo.push(info);
    }
  }
  for (var i = 0; i < this.inliningInfo.length; i = i + 1 | 0) {
    var info = this.inliningInfo[i];
    var callSites = graph.callInfo[graph.symbolToInfoIndex.get(info.symbol.uniqueID)].callSites;
    for (var j = 0; j < callSites.length; j = j + 1 | 0) {
      var callSite = callSites[j];
      for (var node = callSite.parent; node !== null; node = node.parent) {
        if (node.kind === 15 && node.symbol.kind === 14) {
          var index = this.symbolToInfoIndex.getOrDefault(node.symbol.uniqueID, -1);
          if (index >= 0) {
            var other = this.inliningInfo[index];
            other.bodyCalls.push(info);
          }
        }
      }
    }
  }
  for (var i = 0; i < this.inliningInfo.length; i = i + 1 | 0) {
    var info = this.inliningInfo[i];
    info.shouldInline = !InliningGraph.containsInfiniteExpansion(info, []);
  }
}
InliningGraph.containsInfiniteExpansion = function(info, symbols) {
  if (symbols.indexOf(info.symbol) >= 0) {
    return true;
  }
  symbols.push(info.symbol);
  for (var i = 0; i < info.bodyCalls.length; i = i + 1 | 0) {
    if (InliningGraph.containsInfiniteExpansion(info.bodyCalls[i], symbols)) {
      return true;
    }
  }
  symbols.pop();
  return false;
};
InliningGraph.createInliningInfo = function(info, options) {
  var symbol = info.symbol;
  if (symbol.kind === 14 && ((symbol.flags & 512) !== 0 || options.inlineAllFunctions)) {
    var block = symbol.node.children[2];
    if (block === null) {
      return null;
    }
    if (!Node.hasChildren(block)) {
      if (options.foldAllConstants) {
        var $arguments = [];
        var argumentVariables = symbol.node.children[1].children;
        for (var i = 0; i < argumentVariables.length; i = i + 1 | 0) {
          $arguments.push(argumentVariables[i].symbol);
        }
        return new InliningInfo(symbol, Node.withType(new Node(38), symbol.type.relevantTypes[0]), info.callSites, $arguments, $arguments);
      }
      return null;
    }
    var first = block.children[0];
    var inlineValue = null;
    if (first.kind === 24) {
      inlineValue = first.children[0];
    } else if (first.kind === 30 && block.children.length === 1) {
      inlineValue = first.children[0];
    }
    if (inlineValue !== null) {
      var symbolCounts = new IntMap();
      if (InliningGraph.recursivelyCountArgumentUses(inlineValue, symbolCounts)) {
        var unusedArguments = [];
        var $arguments = [];
        var argumentVariables = symbol.node.children[1].children;
        var isSimpleSubstitution = true;
        for (var i = 0; i < argumentVariables.length; i = i + 1 | 0) {
          var argument = argumentVariables[i].symbol;
          var count = symbolCounts.getOrDefault(argument.uniqueID, 0);
          if (count === 0) {
            unusedArguments.push(argument);
          } else if (count !== 1) {
            isSimpleSubstitution = false;
            break;
          }
          $arguments.push(argument);
        }
        if (isSimpleSubstitution) {
          return new InliningInfo(symbol, inlineValue, info.callSites, $arguments, unusedArguments);
        }
      }
    }
  }
  return null;
};
InliningGraph.recursivelyCountArgumentUses = function(node, symbolCounts) {
  if (Node.hasChildren(node)) {
    for (var i = 0; i < node.children.length; i = i + 1 | 0) {
      var child = node.children[i];
      if (child !== null && !InliningGraph.recursivelyCountArgumentUses(child, symbolCounts)) {
        return false;
      }
    }
  }
  if (node.kind === 54) {
    return false;
  }
  var symbol = node.symbol;
  if (symbol !== null) {
    symbolCounts.set(symbol.uniqueID, symbolCounts.getOrDefault(symbol.uniqueID, 0) + 1 | 0);
    if (Node.isStorage(node)) {
      return false;
    }
  }
  return true;
};
function InstanceToStaticPass() {
}
InstanceToStaticPass.run = function(graph, cache, options) {
  for (var i = 0; i < graph.callInfo.length; i = i + 1 | 0) {
    var info = graph.callInfo[i];
    var symbol = info.symbol;
    var enclosingSymbol = symbol.enclosingSymbol;
    if (symbol.kind === 15 && (symbol.flags & 8192) === 0 && symbol.node.children[2] !== null && ((enclosingSymbol.flags & 8192) !== 0 || $in.SymbolKind.isEnum(enclosingSymbol.kind) || options.convertAllInstanceToStatic && (symbol.flags & 4096) === 0 && (symbol.flags & 128) === 0)) {
      var thisSymbol = new Symbol("this", 17);
      thisSymbol.type = enclosingSymbol.type;
      var replacedThis = InstanceToStaticPass.recursivelyReplaceThis(symbol.node.children[2], thisSymbol);
      symbol.kind = 14;
      symbol.flags |= 64;
      if (replacedThis) {
        var $arguments = Type.argumentTypes(symbol.type);
        $arguments.unshift(enclosingSymbol.type);
        symbol.type = TypeCache.functionType(cache, symbol.type.relevantTypes[0], $arguments);
        Node.insertChild(symbol.node.children[1], 0, Node.withSymbol(Node.withChildren(new Node(16), [Node.withSymbol(Node.withContent(new Node(34), new StringContent("this")), thisSymbol), Node.withType(new Node(35), thisSymbol.type), null]), thisSymbol));
      }
      for (var j = 0; j < info.callSites.length; j = j + 1 | 0) {
        var callSite = info.callSites[j];
        var value = callSite.children[0];
        var target = null;
        var name = null;
        if (value.kind === 45) {
          target = Node.replaceWith(value.children[0], null);
          name = Node.replaceWith(value.children[1], null);
        } else {
          target = new Node(36);
          name = Node.replaceWith(value, null);
        }
        Node.replaceChild(callSite, 0, name);
        if (replacedThis) {
          Node.insertChild(callSite, 1, target);
        } else if (!Node.hasNoSideEffects(target)) {
          var children = Node.removeChildren(callSite);
          var clone = Node.withChildren(Node.clone(callSite), children);
          Node.become(callSite, Node.withChildren(new Node(50), [target, clone]));
        }
      }
    }
  }
};
InstanceToStaticPass.createThis = function(symbol) {
  return Node.withType(Node.withSymbol(Node.withContent(new Node(34), new StringContent(symbol.name)), symbol), symbol.type);
};
InstanceToStaticPass.recursivelyReplaceThis = function(node, symbol) {
  if (node.kind === 36) {
    Node.become(node, Node.withRange(InstanceToStaticPass.createThis(symbol), node.range));
    return true;
  }
  if (Node.isNameExpression(node) && (node.symbol.kind === 15 || node.symbol.kind === 19)) {
    Node.become(node, Node.withRange(Node.withType(Node.withChildren(new Node(45), [InstanceToStaticPass.createThis(symbol), Node.clone(node)]), node.type), node.range));
    return true;
  }
  var replacedThis = false;
  if (Node.hasChildren(node)) {
    for (var i = 0; i < node.children.length; i = i + 1 | 0) {
      var child = node.children[i];
      if (child !== null && InstanceToStaticPass.recursivelyReplaceThis(child, symbol)) {
        replacedThis = true;
      }
    }
  }
  return replacedThis;
};
function Member(_0) {
  this.type = null;
  this.dependency = null;
  this.parameterizedType = null;
  this.symbol = _0;
}
function ResolveContext() {
  this.scope = null;
  this.loop = null;
  this.switchValue = null;
  this.symbolForThis = null;
  this.functionSymbol = null;
}
ResolveContext.fromNode = function(node) {
  var context = new ResolveContext();
  if (node.parent === null && node.symbol.enclosingSymbol !== null) {
    context.symbolForThis = node.symbol.enclosingSymbol;
    context.scope = context.symbolForThis.node.scope;
  }
  while (node !== null) {
    if (context.scope === null) {
      context.scope = node.scope;
    }
    if (context.loop === null && $in.NodeKind.isLoop(node.kind)) {
      context.loop = node;
    }
    if (context.switchValue === null && node.kind === 31) {
      context.switchValue = node.children[0];
    }
    if (context.symbolForThis === null && node.symbol !== null && $in.SymbolKind.isTypeWithInstances(node.symbol.kind)) {
      context.symbolForThis = node.symbol;
    }
    if (context.functionSymbol === null && $in.NodeKind.isFunction(node.kind)) {
      context.functionSymbol = node.symbol;
    }
    node = node.parent;
  }
  return context;
};
function Resolver(_0, _1) {
  this.cache = new TypeCache();
  this.context = new ResolveContext();
  this.constantFolder = null;
  this.allSymbols = [];
  this.parsedDeclarations = null;
  this.parsedBlocks = null;
  this.typeContext = null;
  this.resultType = null;
  this.log = _0;
  this.options = _1;
}
Resolver.run = function($this, program) {
  var globalScope = new Scope(null);
  Scope.insertGlobals(globalScope, $this.cache);
  $this.constantFolder = new ConstantFolder($this.cache);
  Resolver.prepareNode($this, program, globalScope);
  Scope.linkGlobals(globalScope, $this.cache);
  Resolver.resolve($this, program, null);
};
Resolver.prepareNode = function($this, node, scope) {
  $this.parsedDeclarations = [];
  $this.parsedBlocks = [];
  Resolver.setupScopesAndSymbols($this, node, scope);
  Resolver.accumulateSymbolFlags($this);
  Resolver.setSymbolKindsAndMergeSiblings($this);
  Resolver.processUsingStatements($this);
};
Resolver.setupBlock = function($this, node, scope) {
  if (!$in.NodeKind.isNamedBlockDeclaration(node.parent.kind) && !$in.NodeKind.isLoop(node.parent.kind)) {
    scope = new Scope(scope);
  }
  node.scope = scope;
  $this.parsedBlocks.push(node);
  if (node.parent.kind === 1) {
    scope.type = $this.cache.globalType;
  } else {
    var parentSymbol = node.parent.symbol;
    if (parentSymbol !== null && parentSymbol.type !== null) {
      scope.type = parentSymbol.type;
    }
  }
  return scope;
};
Resolver.setupNamedDeclaration = function($this, node, scope) {
  var declarationName = node.children[0];
  if (declarationName !== null && node.symbol === null) {
    var name = declarationName.content.value;
    var member = Scope.findLocal(scope, name);
    var symbol = null;
    if (member !== null) {
      symbol = member.symbol;
      if (symbol.node !== null) {
        Node.appendToSiblingChain(symbol.node, node);
      }
    } else {
      symbol = Resolver.createSymbol($this, name, 0);
      symbol.node = node;
      if (scope.type !== null) {
        symbol.enclosingSymbol = scope.type.symbol;
      }
      if (node.kind === 17) {
        Scope.insertLocal(scope, symbol);
      } else {
        Scope.insert(scope, symbol);
      }
    }
    $this.parsedDeclarations.push(node);
    declarationName.symbol = symbol;
    node.symbol = symbol;
    if (symbol.type === null && $in.NodeKind.isNamedBlockDeclaration(node.kind)) {
      symbol.type = new Type(symbol);
    }
  }
};
Resolver.setupScopesAndSymbols = function($this, node, scope) {
  if (node.kind === 0) {
    node.scope = scope;
  } else if (node.kind === 2) {
    scope = Resolver.setupBlock($this, node, scope);
  }
  if ($in.NodeKind.isNamedDeclaration(node.kind)) {
    Resolver.setupNamedDeclaration($this, node, scope);
  }
  if ($in.NodeKind.isNamedBlockDeclaration(node.kind) || $in.NodeKind.isFunction(node.kind) || node.kind === 54 || $in.NodeKind.isLoop(node.kind) || node.kind === 46) {
    node.scope = scope = new Scope(scope);
  }
  if (Node.hasChildren(node)) {
    for (var i = 0; i < node.children.length; i = i + 1 | 0) {
      var child = node.children[i];
      if (child !== null) {
        Resolver.setupScopesAndSymbols($this, child, scope);
      }
    }
  }
};
Resolver.symbolFlagsForNode = function($this, node) {
  var flags = 0;
  var parent = node.parent;
  if (parent.kind === 6) {
    parent = parent.parent;
  }
  while (parent !== null && parent.kind === 32) {
    var modifierName = parent.children[0];
    var name = modifierName.content.value;
    var flag = nameToSymbolFlag.get(name);
    if ((flags & flag) !== 0) {
      Log.warning($this.log, modifierName.range, "Duplicate modifier \"" + name + "\"");
    }
    flags |= flag;
    parent = parent.parent;
  }
  if (parent !== null && parent.kind === 2 && parent.parent.kind === 13) {
    flags |= 16;
  }
  return flags;
};
Resolver.accumulateSymbolFlags = function($this) {
  for (var i = 0; i < $this.parsedDeclarations.length; i = i + 1 | 0) {
    var node = $this.parsedDeclarations[i];
    if (node.symbol.node !== node) {
      continue;
    }
    var declarationName = node.children[0];
    var flags = Resolver.symbolFlagsForNode($this, node);
    for (var sibling = node.sibling; sibling !== null; sibling = sibling.sibling) {
      var siblingFlags = Resolver.symbolFlagsForNode($this, sibling);
      if ((flags & 14311) !== (siblingFlags & 14311)) {
        semanticErrorDifferentModifiers($this.log, sibling.children[0].range, declarationName.content.value, declarationName.range);
        siblingFlags |= 131072;
      }
      flags |= siblingFlags;
    }
    node.symbol.flags |= flags;
  }
};
Resolver.checkParentsForLocalVariable = function(node) {
  for (node = node.parent; node !== null; node = node.parent) {
    if ($in.NodeKind.isFunction(node.kind)) {
      return true;
    }
  }
  return false;
};
Resolver.setSymbolKindsAndMergeSiblings = function($this) {
  for (var i = 0; i < $this.parsedDeclarations.length; i = i + 1 | 0) {
    var node = $this.parsedDeclarations[i];
    var symbol = node.symbol;
    if (symbol.node !== node) {
      continue;
    }
    var declarationName = node.children[0];
    var kind = node.kind;
    for (var sibling = node.sibling; sibling !== null; sibling = sibling.sibling) {
      if (sibling.kind === 13 && $in.NodeKind.isNamedBlockDeclaration(kind)) {
        continue;
      }
      if (sibling.kind !== 13 && $in.NodeKind.isNamedBlockDeclaration(sibling.kind)) {
        if (kind === 13 || kind === 7 && sibling.kind === 7) {
          kind = sibling.kind;
          continue;
        }
      }
      var siblingName = sibling.children[0];
      semanticErrorDuplicateSymbol($this.log, siblingName.range, siblingName.content.value, declarationName.range);
    }
    var previous = node;
    for (var sibling = node.sibling; sibling !== null; sibling = sibling.sibling) {
      if (sibling.kind === 16 || $in.NodeKind.isFunction(sibling.kind)) {
        var disconnected = sibling.symbol = Resolver.createSymbol($this, symbol.name, 0);
        disconnected.enclosingSymbol = symbol.enclosingSymbol;
        disconnected.node = sibling;
        previous.sibling = sibling.sibling;
      } else {
        previous = sibling;
      }
    }
    switch (kind) {
    case 7:
      symbol.kind = 8;
      break;
    case 8:
      symbol.kind = 9;
      break;
    case 9:
      symbol.kind = 10;
      break;
    case 10:
      symbol.kind = 11;
      break;
    case 11:
      symbol.kind = 12;
      break;
    case 12:
      symbol.kind = 13;
      break;
    case 15:
      symbol.kind = 14;
      break;
    case 14:
      symbol.kind = 16;
      break;
    case 16:
      symbol.kind = 18;
      break;
    case 17:
      symbol.kind = 4;
      break;
    case 18:
      symbol.kind = 6;
      break;
    case 13:
      Log.error($this.log, declarationName.range, "No type named \"" + declarationName.content.value + "\" to extend");
      break;
    default:
      break;
    }
  }
  for (var i = 0; i < $this.parsedDeclarations.length; i = i + 1 | 0) {
    var node = $this.parsedDeclarations[i];
    var symbol = node.symbol;
    if ((symbol.flags & 64) === 0 && (Symbol.isObjectMember(symbol) || Symbol.isEnumMember(symbol) && (symbol.flags & 16) !== 0)) {
      if (symbol.kind === 14) {
        symbol.kind = 15;
      } else if (symbol.kind === 18) {
        symbol.kind = 19;
      }
    } else if (symbol.kind === 18 && Resolver.checkParentsForLocalVariable(node)) {
      symbol.kind = 17;
    }
  }
};
Resolver.processUsingStatements = function($this) {
  for (var i = 0; i < $this.parsedBlocks.length; i = i + 1 | 0) {
    var block = $this.parsedBlocks[i];
    if (!Node.hasChildren(block)) {
      continue;
    }
    var insertedSymbols = null;
    for (var j = 0; j < block.children.length; j = j + 1 | 0) {
      var statement = block.children[j];
      if (statement.kind !== 33) {
        continue;
      }
      var value = statement.children[0];
      Resolver.resolveGlobalUsingValue($this, value);
      if (value.type === $this.cache.errorType) {
        continue;
      }
      var symbol = value.type.symbol;
      if (symbol === null) {
        continue;
      }
      if (!$in.SymbolKind.isNamespace(symbol.kind)) {
        Log.error($this.log, value.range, "Expected a namespace here");
        continue;
      }
      if (insertedSymbols === null) {
        insertedSymbols = [];
      }
      var members = symbol.type.members.values();
      for (var k = 0; k < members.length; k = k + 1 | 0) {
        var member = members[k];
        var memberSymbol = member.symbol;
        if (memberSymbol.kind === 8) {
          continue;
        }
        var current = Scope.findLocal(block.scope, memberSymbol.name);
        if (current === null) {
          insertedSymbols.push(memberSymbol);
          Scope.insertLocal(block.scope, memberSymbol);
        } else {
          var currentSymbol = current.symbol;
          if (insertedSymbols.indexOf(currentSymbol) >= 0) {
            if (currentSymbol.kind !== 2) {
              var collision = Resolver.createSymbol($this, memberSymbol.name, 2);
              collision.identicalMembers = [current, member];
              block.scope.locals.set(memberSymbol.name, new Member(collision));
              insertedSymbols.push(collision);
            } else {
              currentSymbol.identicalMembers.push(member);
            }
          }
        }
      }
    }
  }
};
Resolver.resolveGlobalUsingValue = function($this, node) {
  node.type = $this.cache.errorType;
  var member = null;
  if (node.kind === 34) {
    var name = node.content.value;
    member = $this.cache.globalType.members.getOrDefault(name, null);
    if (member === null) {
      Log.error($this.log, node.range, "\"" + name + "\" is not declared");
      return;
    }
  } else if (node.kind === 45) {
    var target = node.children[0];
    Resolver.resolveGlobalUsingValue($this, target);
    var targetType = target.type;
    var dotName = node.children[1];
    if (targetType === null || dotName === null) {
      return;
    }
    var name = dotName.content.value;
    member = targetType.members.getOrDefault(name, null);
    if (member === null) {
      Log.error($this.log, dotName.range, "\"" + name + "\" is not declared on type \"" + Type.toString(targetType) + "\"");
      return;
    }
  } else {
    Log.error($this.log, node.range, "Unexpected " + $in.NodeKind.toString(node.kind));
    return;
  }
  if (!$in.SymbolKind.isType(member.symbol.kind)) {
    Log.error($this.log, node.range, "Expected a type here");
    return;
  }
  Node.become(node, Node.withSymbol(Node.withRange(Node.withType(new Node(35), member.symbol.type), node.range), member.symbol));
};
Resolver.resolve = function($this, node, expectedType) {
  if (node.type !== null) {
    return;
  }
  node.type = $this.cache.errorType;
  var oldScope = $this.context.scope;
  if (node.scope !== null) {
    $this.context.scope = node.scope;
  }
  var oldType = $this.typeContext;
  $this.typeContext = expectedType;
  switch (node.kind) {
  case 0:
    Resolver.resolveChildren($this, node);
    break;
  case 1:
    Resolver.resolve($this, node.children[0], null);
    break;
  case 2:
    Resolver.resolveBlock($this, node);
    break;
  case 3:
    Resolver.resolveChildren($this, node);
    break;
  case 4:
    Resolver.resolveCase($this, node);
    break;
  case 33:
    Resolver.checkInsideBlock($this, node);
    break;
  case 7:
    Resolver.resolveNamespace($this, node);
    break;
  case 8:
  case 9:
    Resolver.resolveEnum($this, node);
    break;
  case 10:
  case 11:
  case 12:
    Resolver.resolveObject($this, node);
    break;
  case 13:
    Resolver.resolveExtension($this, node);
    break;
  case 14:
  case 15:
    Resolver.resolveFunction($this, node);
    break;
  case 16:
    Resolver.resolveVariable($this, node);
    break;
  case 6:
    Resolver.resolveNodes($this, Node.clusterVariables(node));
    break;
  case 17:
    Resolver.initializeSymbol($this, node.symbol);
    break;
  case 18:
    Resolver.resolveAlias($this, node);
    break;
  case 19:
    Resolver.resolveIf($this, node);
    break;
  case 20:
    Resolver.resolveFor($this, node);
    break;
  case 21:
    Resolver.resolveForEach($this, node);
    break;
  case 22:
    Resolver.resolveWhile($this, node);
    break;
  case 23:
    Resolver.resolveWhile($this, node);
    break;
  case 24:
  case 25:
    Resolver.resolveReturn($this, node);
    break;
  case 26:
    Resolver.resolveBreak($this, node);
    break;
  case 27:
    Resolver.resolveContinue($this, node);
    break;
  case 28:
  case 29:
    Resolver.resolveAssert($this, node);
    break;
  case 30:
    Resolver.resolveExpression($this, node);
    break;
  case 31:
    Resolver.resolveSwitch($this, node);
    break;
  case 32:
    Resolver.resolveNodes($this, Node.modifierStatements(node));
    break;
  case 34:
    Resolver.resolveName($this, node);
    break;
  case 38:
    node.type = $this.cache.nullType;
    break;
  case 36:
    Resolver.resolveThis($this, node);
    break;
  case 39:
    node.type = $this.cache.boolType;
    break;
  case 37:
    Resolver.resolveHook($this, node);
    break;
  case 40:
    Resolver.resolveInt($this, node);
    break;
  case 41:
    node.type = $this.cache.floatType;
    break;
  case 42:
    node.type = $this.cache.doubleType;
    break;
  case 43:
    node.type = $this.cache.stringType;
    break;
  case 44:
    Resolver.resolveList($this, node);
    break;
  case 45:
    Resolver.resolveDot($this, node);
    break;
  case 46:
    Resolver.resolveLet($this, node);
    break;
  case 47:
    Resolver.resolveCall($this, node);
    break;
  case 48:
    break;
  case 49:
    break;
  case 50:
    Resolver.resolveSequence($this, node);
    break;
  case 51:
    Resolver.resolveParameterize($this, node);
    break;
  case 52:
    Resolver.resolveCast($this, node);
    break;
  case 54:
    Resolver.resolveLambda($this, node);
    break;
  case 55:
    Resolver.resolveAsExpression($this, node.children[0]);
    break;
  case 56:
    Resolver.resolveVar($this, node);
    break;
  case 57:
    Resolver.resolveFunctionType($this, node);
    break;
  case 58:
  case 59:
  case 60:
  case 61:
  case 62:
  case 63:
  case 64:
  case 65:
    Resolver.resolveUnaryOperator($this, node);
    break;
  case 66:
  case 67:
  case 68:
  case 69:
  case 70:
  case 71:
  case 72:
  case 73:
  case 74:
  case 75:
  case 76:
  case 77:
  case 78:
  case 79:
  case 80:
  case 81:
  case 82:
  case 83:
  case 84:
  case 85:
  case 86:
  case 87:
  case 88:
  case 89:
  case 90:
  case 91:
  case 92:
  case 93:
  case 94:
  case 95:
  case 96:
    Resolver.resolveBinaryOperator($this, node);
    break;
  case 97:
    Resolver.resolveTertiaryOperator($this, node);
    break;
  default:
    break;
  }
  $this.context.scope = oldScope;
  $this.typeContext = oldType;
};
Resolver.checkIsParameterized = function($this, node) {
  if (node.type !== $this.cache.errorType && Type.hasParameters(node.type) && node.type.substitutions === null) {
    Log.error($this.log, node.range, "Cannot use unparameterized type \"" + Type.toString(node.type) + "\"");
    node.type = $this.cache.errorType;
  }
};
Resolver.checkIsType = function($this, node) {
  if (node.type !== $this.cache.errorType && node.kind !== 35) {
    Log.error($this.log, node.range, "Unexpected expression of type \"" + Type.toString(node.type) + "\"");
    node.type = $this.cache.errorType;
  }
};
Resolver.checkIsInstance = function($this, node) {
  if (node.type !== $this.cache.errorType && node.kind === 35) {
    Log.error($this.log, node.range, "Unexpected type \"" + Type.toString(node.type) + "\"");
    node.type = $this.cache.errorType;
  }
};
Resolver.checkIsValidFunctionReturnType = function($this, node) {
  if (node.type !== $this.cache.voidType) {
    Resolver.checkIsValidVariableType($this, node);
  }
};
Resolver.checkIsValidVariableType = function($this, node) {
  if (node.type === $this.cache.voidType || Type.isNamespace(node.type)) {
    Log.error($this.log, node.range, "Cannot use type \"" + Type.toString(node.type) + "\" here");
    node.type = $this.cache.errorType;
  }
};
Resolver.checkUnusedExpression = function($this, node) {
  var kind = node.kind;
  if (kind === 37) {
    Resolver.checkUnusedExpression($this, node.children[1]);
    Resolver.checkUnusedExpression($this, node.children[2]);
  } else if (kind === 50) {
    if (Node.hasChildren(node)) {
      Resolver.checkUnusedExpression($this, node.children[node.children.length - 1 | 0]);
    }
  } else if (kind === 46) {
    Resolver.checkUnusedExpression($this, node.children[1]);
  } else if (node.type !== $this.cache.errorType && !$in.NodeKind.isCall(kind) && !$in.NodeKind.isUnaryStorageOperator(kind) && !$in.NodeKind.isBinaryStorageOperator(kind)) {
    Log.warning($this.log, node.range, "Unused expression");
  }
};
Resolver.checkStorage = function($this, node) {
  if (node.type === $this.cache.errorType) {
    return;
  }
  if (!$in.NodeKind.isStorage(node.kind)) {
    Log.error($this.log, node.range, "Cannot store to this location");
    return;
  }
  if ((node.symbol.flags & 1024) !== 0) {
    Log.error($this.log, node.range, "Cannot store to a symbol marked as \"const\"");
  } else if ((node.symbol.flags & 256) !== 0) {
    Log.error($this.log, node.range, "Cannot store to a symbol marked as \"final\"");
  }
};
Resolver.checkConversion = function($this, to, node, kind) {
  var from = node.type;
  if (from === $this.cache.errorType || to === $this.cache.errorType) {
    return;
  }
  if (from === $this.cache.voidType && to === $this.cache.voidType) {
    Log.error($this.log, node.range, "Unexpected expression of type \"" + Type.toString(to) + "\"");
    node.type = $this.cache.errorType;
    return;
  }
  if (from === to) {
    if (node.symbol !== null && $in.SymbolKind.isFunction(node.symbol.kind) && node.kind !== 47 && node.parent.kind !== 47) {
      Log.error($this.log, node.range, "Raw function references are not allowed (call the function instead)");
      node.type = $this.cache.errorType;
    }
    return;
  }
  if (Type.isEnumFlags(to) && node.kind === 40 && node.content.value === 0) {
    from = to;
  }
  if (kind === 0 && !TypeCache.canImplicitlyConvert($this.cache, from, to) || kind === 1 && !TypeCache.canExplicitlyConvert($this.cache, from, to)) {
    Log.error($this.log, node.range, "Cannot convert from type \"" + Type.toString(from) + "\" to type \"" + Type.toString(to) + "\"" + (TypeCache.canExplicitlyConvert($this.cache, from, to) ? " without a cast" : ""));
    node.type = $this.cache.errorType;
    return;
  }
  if (kind === 0) {
    if (node.kind === 35) {
      return;
    }
    var value = new Node(38);
    Node.become(value, node);
    Node.become(node, Node.withRange(Node.withType(Node.withChildren(new Node(53), [Node.withType(new Node(35), to), value]), to), node.range));
  }
};
Resolver.unexpectedStatement = function($this, node) {
  if (node.range.source !== null) {
    Log.error($this.log, node.range, "Cannot use this statement here");
  }
};
Resolver.checkInsideBlock = function($this, node) {
  if (node.parent.kind !== 2) {
    Resolver.unexpectedStatement($this, node);
  }
};
Resolver.checkDeclarationLocation = function($this, node, allowDeclaration) {
  var parent = null;
  for (parent = node.parent; parent !== null; parent = parent.parent) {
    if (parent.symbol !== null && (parent.symbol.flags & 65536) !== 0) {
      break;
    }
    var kind = parent.kind;
    if (kind !== 0 && kind !== 1 && kind !== 32 && kind !== 2 && kind !== 7 && kind !== 13 && (allowDeclaration !== 1 || !$in.NodeKind.isObject(kind))) {
      Resolver.unexpectedStatement($this, node);
      break;
    }
  }
  if (parent !== null) {
    node.symbol.flags |= 65536;
  }
};
Resolver.checkStatementLocation = function($this, node) {
  for (var parent = node.parent; parent !== null; parent = parent.parent) {
    var kind = parent.kind;
    if (kind === 1) {
      Resolver.unexpectedStatement($this, node);
      break;
    }
    if (kind === 2) {
      var parentKind = parent.parent.kind;
      if (!$in.NodeKind.isNamedBlockDeclaration(parentKind) && parentKind !== 1) {
        break;
      }
    }
  }
};
Resolver.checkAccessToThis = function($this, range) {
  if ($this.context.functionSymbol !== null && $in.SymbolKind.isInstance($this.context.functionSymbol.kind)) {
    return true;
  }
  if ($this.context.symbolForThis !== null) {
    Log.error($this.log, range, "Cannot access \"this\" from a static context");
  } else {
    Log.error($this.log, range, "Cannot use \"this\" outside a class or struct");
  }
  return false;
};
Resolver.checkAccessToInstanceSymbol = function($this, node) {
  var symbol = node.symbol;
  if (!$in.SymbolKind.isInstance(symbol.kind) && symbol.kind !== 4) {
    return true;
  }
  if ($this.context.functionSymbol !== null && $in.SymbolKind.isInstance($this.context.functionSymbol.kind) && $this.context.functionSymbol.enclosingSymbol === symbol.enclosingSymbol) {
    return true;
  }
  if ($this.context.symbolForThis === null) {
    Log.error($this.log, node.range, "Cannot use \"" + symbol.name + "\" outside a class or struct");
    return false;
  }
  if (symbol.kind === 4 && $this.context.symbolForThis === symbol.enclosingSymbol) {
    var enclosingNode = symbol.enclosingSymbol.node;
    for (var parent = node.parent; parent !== enclosingNode; parent = parent.parent) {
      if (parent.kind === 3 && parent.parent === enclosingNode && (parent === parent.parent.children[3] || parent === parent.parent.children[2])) {
        return true;
      }
      if ((parent.kind === 16 || $in.NodeKind.isFunction(parent.kind)) && $in.SymbolKind.isInstance(parent.symbol.kind)) {
        return true;
      }
    }
  }
  Log.error($this.log, node.range, "Cannot access \"" + symbol.name + "\" from a static context");
  return false;
};
Resolver.collectAndResolveBaseTypes = function($this, symbol) {
  var baseTypes = [];
  for (var node = symbol.node; node !== null; node = node.sibling) {
    var isObject = $in.NodeKind.isObject(node.kind);
    if (isObject || node.kind === 13) {
      var types = node.children[2];
      if (types !== null && Node.hasChildren(types)) {
        var index = 0;
        for (var i = 0; i < types.children.length; i = i + 1 | 0) {
          var baseType = types.children[i];
          Resolver.resolveAsParameterizedType($this, baseType);
          if (isObject) {
            baseTypes.splice((index = index + 1 | 0) - 1 | 0, 0, baseType);
          } else if (Type.isClass(baseType.type)) {
            Log.error($this.log, baseType.range, "The base class must be set from the class declaration, not from an extension block");
          } else {
            baseTypes.push(baseType);
          }
        }
      }
    }
  }
  return baseTypes;
};
Resolver.checkNoBaseTypes = function($this, symbol, what) {
  var baseTypes = Resolver.collectAndResolveBaseTypes($this, symbol);
  for (var i = 0; i < baseTypes.length; i = i + 1 | 0) {
    Log.error($this.log, baseTypes[i].range, what + " cannot inherit from another type");
  }
};
Resolver.createDefaultValue = function($this, type, range) {
  if (Type.isReference(type)) {
    return Node.withType(new Node(38), type);
  }
  if (type === $this.cache.boolType) {
    return Node.withType(Node.withContent(new Node(39), new BoolContent(false)), type);
  }
  if (type === $this.cache.intType) {
    return Node.withType(Node.withContent(new Node(40), new IntContent(0)), type);
  }
  if (type === $this.cache.floatType) {
    return Node.withType(Node.withContent(new Node(41), new DoubleContent(0)), type);
  }
  if (type === $this.cache.doubleType) {
    return Node.withType(Node.withContent(new Node(42), new DoubleContent(0)), type);
  }
  if (type === $this.cache.stringType) {
    return Node.withType(Node.withContent(new Node(43), new StringContent("")), type);
  }
  if (Type.isEnum(type)) {
    return Node.withType(Node.withContent(new Node(40), new IntContent(0)), type);
  }
  if (type !== $this.cache.errorType) {
    Log.error($this.log, range, "Cannot create a default value for type \"" + Type.toString(type) + "\"");
  }
  return Node.withType(new Node(49), $this.cache.errorType);
};
Resolver.needsTypeContext = function($this, node) {
  return node.kind === 44 || node.kind === 45 && node.children[0] === null || node.kind === 61 && Resolver.needsTypeContext($this, node.children[0]) || node.kind === 37 && Resolver.needsTypeContext($this, node.children[1]) && Resolver.needsTypeContext($this, node.children[2]);
};
Resolver.addAutoGeneratedMember = function($this, type, name) {
  var symbol = Resolver.createSymbol($this, name, 1);
  symbol.enclosingSymbol = type.symbol;
  Type.addMember(type, new Member(symbol));
};
Resolver.forbidBlockDeclarationModifiers = function($this, symbol, where) {
  Resolver.unexpectedModifierIfPresent($this, symbol, 1024, where);
  Resolver.unexpectedModifierIfPresent($this, symbol, 256, where);
  Resolver.unexpectedModifierIfPresent($this, symbol, 512, where);
  Resolver.unexpectedModifierIfPresent($this, symbol, 64, where);
  Resolver.unexpectedModifierIfPresent($this, symbol, 128, where);
  Resolver.unexpectedModifierIfPresent($this, symbol, 32, where);
  if ((symbol.flags & 8192) !== 0) {
    Resolver.unexpectedModifierIfPresent($this, symbol, 4096, "on an imported declaration");
  }
};
Resolver.initializeNamespace = function($this, symbol) {
  Resolver.forbidBlockDeclarationModifiers($this, symbol, "on a namespace declaration");
  Resolver.checkNoBaseTypes($this, symbol, "A namespace");
};
Resolver.initializeEnum = function($this, symbol) {
  Resolver.forbidBlockDeclarationModifiers($this, symbol, "on an enum declaration");
  Resolver.checkNoBaseTypes($this, symbol, "An enum");
  if (symbol.type.members.getOrDefault("toString", null) === null && (symbol.flags & 8192) === 0) {
    Resolver.addAutoGeneratedMember($this, symbol.type, "toString");
  }
};
Resolver.resolveBaseTypes = function($this, symbol) {
  var node = symbol.node;
  var type = symbol.type;
  var baseTypes = Resolver.collectAndResolveBaseTypes($this, symbol);
  var unmergedMembers = new StringMap();
  type.relevantTypes = [];
  if (symbol.kind === 12) {
    Resolver.checkNoBaseTypes($this, symbol, "A struct");
    return;
  }
  for (var i = 0; i < baseTypes.length; i = i + 1 | 0) {
    var base = baseTypes[i];
    var baseType = base.type;
    if (baseType === $this.cache.errorType) {
      continue;
    }
    if (symbol.kind === 11 && Type.isClass(baseType)) {
      if (baseTypes.indexOf(base) !== 0) {
        Log.error($this.log, base.range, "Base type \"" + Type.toString(baseType) + "\" must come first in a class declaration");
        continue;
      }
    } else if (!Type.isInterface(baseType)) {
      Log.error($this.log, base.range, "Base type \"" + Type.toString(baseType) + "\" must be an interface");
      continue;
    }
    if (type.relevantTypes.indexOf(baseType) >= 0) {
      Log.error($this.log, base.range, "Duplicate base type \"" + Type.toString(baseType) + "\"");
      continue;
    }
    type.relevantTypes.push(baseType);
    var members = baseType.members.values();
    for (var j = 0; j < members.length; j = j + 1 | 0) {
      var member = members[j];
      var memberSymbol = member.symbol;
      var unmerged = unmergedMembers.getOrDefault(memberSymbol.name, null);
      if (unmerged === null) {
        unmergedMembers.set(memberSymbol.name, member);
      } else if (unmerged.symbol.enclosingSymbol !== memberSymbol) {
        var combined = Resolver.createSymbol($this, memberSymbol.name, 3);
        combined.enclosingSymbol = symbol;
        combined.identicalMembers = [unmerged, member];
        unmergedMembers.set(memberSymbol.name, new Member(combined));
      } else {
        unmerged.symbol.identicalMembers.push(member);
      }
    }
  }
  var baseMembers = unmergedMembers.values();
  for (var i = 0; i < baseMembers.length; i = i + 1 | 0) {
    var member = baseMembers[i];
    var existing = type.members.getOrDefault(member.symbol.name, null);
    if (existing !== null) {
      existing.symbol.overriddenMember = member;
    } else if (member.symbol.name !== "new") {
      Type.addMember(type, member);
    }
  }
};
Resolver.initializeObject = function($this, symbol) {
  Resolver.forbidBlockDeclarationModifiers($this, symbol, "on an object declaration");
  var node = Node.firstNonExtensionSibling(symbol.node);
  var parameters = node.children[3];
  var type = symbol.type;
  if (parameters !== null && Node.hasChildren(parameters)) {
    symbol.parameters = [];
    Resolver.resolveNodes($this, parameters.children);
    for (var i = 0; i < parameters.children.length; i = i + 1 | 0) {
      symbol.parameters.push(parameters.children[i].symbol);
    }
    Symbol.sortParametersByDependencies(symbol);
  }
  if (!Type.isInterface(type) && Type.$constructor(type) === null && (symbol.flags & 8192) === 0) {
    Resolver.addAutoGeneratedMember($this, type, "new");
  }
  Resolver.resolveBaseTypes($this, symbol);
};
Resolver.initializeFunction = function($this, symbol) {
  var enclosingSymbol = symbol.enclosingSymbol;
  Resolver.unexpectedModifierIfPresent($this, symbol, 1024, "on a function declaration");
  Resolver.unexpectedModifierIfPresent($this, symbol, 256, "on a function declaration");
  if (enclosingSymbol === null || !$in.SymbolKind.isTypeWithInstances(enclosingSymbol.kind)) {
    Resolver.unexpectedModifierIfPresent($this, symbol, 64, "outside an object declaration");
  }
  if ((symbol.flags & 8192) !== 0) {
    Resolver.unexpectedModifierIfPresent($this, symbol, 4096, "on an imported declaration");
  }
  var node = symbol.node;
  var resultType = null;
  if (node.kind === 15) {
    var result = node.children[3];
    Resolver.resolveAsParameterizedType($this, result);
    Resolver.checkIsValidFunctionReturnType($this, result);
    resultType = result.type;
  } else {
    resultType = enclosingSymbol.type;
    if (Type.hasParameters(resultType)) {
      var substitutions = [];
      for (var i = 0; i < enclosingSymbol.parameters.length; i = i + 1 | 0) {
        substitutions.push(enclosingSymbol.parameters[i].type);
      }
      resultType = TypeCache.parameterize($this.cache, resultType, substitutions);
    }
  }
  var $arguments = node.children[1];
  Resolver.resolve($this, $arguments, null);
  symbol.type = $this.cache.errorType;
  if (resultType !== $this.cache.errorType) {
    var argumentTypes = [];
    for (var i = 0; i < $arguments.children.length; i = i + 1 | 0) {
      var type = $arguments.children[i].symbol.type;
      if (type === $this.cache.errorType) {
        return;
      }
      argumentTypes.push(type);
    }
    symbol.type = TypeCache.functionType($this.cache, resultType, argumentTypes);
  }
  var overriddenMember = symbol.overriddenMember;
  if (overriddenMember !== null && symbol.kind !== 16) {
    Resolver.initializeMember($this, overriddenMember);
    var base = overriddenMember.type;
    var derived = symbol.type;
    if (base !== $this.cache.errorType && derived !== $this.cache.errorType) {
      var overriddenSymbol = overriddenMember.symbol;
      if (base.symbol !== null || !$in.SymbolKind.isInstance(overriddenSymbol.kind) || !$in.SymbolKind.isInstance(symbol.kind)) {
        semanticErrorBadOverride($this.log, node.children[0].range, symbol.name, overriddenSymbol.enclosingSymbol.type, overriddenSymbol.node.children[0].range);
      } else if (base !== derived) {
        semanticErrorOverrideDifferentTypes($this.log, node.children[0].range, symbol.name, base, derived, overriddenSymbol.node.children[0].range);
      } else if ((symbol.flags & 32) === 0) {
        semanticErrorModifierMissingOverride($this.log, node.children[0].range, symbol.name, overriddenSymbol.node.children[0].range);
      } else if ((overriddenSymbol.flags & 128) === 0) {
        semanticErrorCannotOverrideNonVirtual($this.log, node.children[0].range, symbol.name, overriddenSymbol.node.children[0].range);
      } else {
        Resolver.redundantModifierIfPresent($this, symbol, 128, "on an overriding function");
      }
    }
    symbol.flags |= 128;
  } else if (!Symbol.isObjectMember(symbol)) {
    Resolver.unexpectedModifierIfPresent($this, symbol, 128, "outside an object declaration");
    Resolver.unexpectedModifierIfPresent($this, symbol, 32, "outside an object declaration");
  } else {
    if (!$in.SymbolKind.isInstance(symbol.kind)) {
      Resolver.unexpectedModifierIfPresent($this, symbol, 128, "on a non-instance function");
    }
    Resolver.unexpectedModifierIfPresent($this, symbol, 32, "on a function that doesn't override anything");
    if ((symbol.flags & 32) !== 0) {
      symbol.flags |= 128;
    }
  }
};
Resolver.initializeVariable = function($this, symbol) {
  Resolver.unexpectedModifierIfPresent($this, symbol, 512, "on a variable declaration");
  Resolver.unexpectedModifierIfPresent($this, symbol, 128, "on a variable declaration");
  Resolver.unexpectedModifierIfPresent($this, symbol, 32, "on a variable declaration");
  if (symbol.enclosingSymbol === null || !$in.SymbolKind.isTypeWithInstances(symbol.enclosingSymbol.kind)) {
    Resolver.unexpectedModifierIfPresent($this, symbol, 64, "outside an object declaration");
  }
  if ((symbol.flags & 1024) !== 0) {
    Resolver.redundantModifierIfPresent($this, symbol, 256, "on a const variable declaration");
  } else if (symbol.enclosingSymbol !== null && symbol.enclosingSymbol.kind === 12 && (symbol.flags & 64) === 0) {
    Resolver.expectedModifierIfAbsent($this, symbol, 256, "on a variable declaration inside a struct");
  }
  if ((symbol.flags & 8192) !== 0) {
    Resolver.unexpectedModifierIfPresent($this, symbol, 4096, "on an imported declaration");
  }
  var node = symbol.node;
  var variableType = node.children[1];
  if (variableType === null) {
    if (node.parent.kind === 6) {
      variableType = Node.clone(node.parent.children[0]);
    } else if (symbol.enclosingSymbol !== null) {
      var type = symbol.enclosingSymbol.type;
      variableType = Node.withSymbol(Node.withType(new Node(35), type), symbol.enclosingSymbol);
      symbol.flags |= 256 | symbol.enclosingSymbol.flags & 12288;
      var variableValue = node.children[2];
      if (variableValue !== null) {
        Resolver.resolveAsExpressionWithConversion($this, variableValue, $this.cache.intType, 0);
        ConstantFolder.foldConstants($this.constantFolder, variableValue);
        if (variableValue.kind === 40) {
          symbol.constant = variableValue.content;
        } else {
          variableType = Node.withType(new Node(35), $this.cache.errorType);
          if (variableValue.type !== $this.cache.errorType) {
            Log.error($this.log, variableValue.range, "Expected integer constant but found expression of type \"" + Type.toString(variableValue.type) + "\"");
          }
        }
      } else {
        var index = node.parent.children.indexOf(node);
        if (index > 0) {
          var previous = node.parent.children[index - 1 | 0].symbol;
          Resolver.initializeSymbol($this, previous);
          if (previous.type !== $this.cache.errorType) {
            var constant = previous.constant.value;
            symbol.constant = new IntContent(Type.isEnumFlags(type) ? constant << 1 : constant + 1 | 0);
          } else {
            variableType = Node.withType(new Node(35), $this.cache.errorType);
          }
        } else {
          symbol.constant = new IntContent(Type.isEnumFlags(type) ? 1 : 0);
        }
      }
    } else {
      variableType = Node.withType(new Node(35), $this.cache.errorType);
    }
    Node.replaceChild(node, 1, variableType);
  }
  if (variableType.kind === 56) {
    var value = node.children[2];
    if (value === null) {
      Log.error($this.log, node.children[0].range, "Implicitly typed variables must be initialized");
      symbol.type = $this.cache.errorType;
    } else {
      if (node.parent.kind === 46) {
        var oldScope = $this.context.scope;
        $this.context.scope = oldScope.lexicalParent;
        Resolver.resolveAsExpression($this, value);
        $this.context.scope = oldScope;
      } else {
        Resolver.resolveAsExpression($this, value);
      }
      var type = value.type;
      if (type === $this.cache.nullType || type === $this.cache.voidType) {
        Log.error($this.log, node.children[0].range, "Implicitly typed variables cannot be of type \"" + Type.toString(type) + "\"");
        symbol.type = $this.cache.errorType;
      } else {
        symbol.type = type;
      }
    }
  } else {
    Resolver.resolveAsParameterizedType($this, variableType);
    Resolver.checkIsValidVariableType($this, variableType);
    symbol.type = variableType.type;
    if (node.parent.kind === 6 && node.parent.children[0].type === null) {
      Node.replaceChild(node.parent, 0, Node.clone(variableType));
    }
  }
  var overriddenMember = symbol.overriddenMember;
  if (overriddenMember !== null) {
    Resolver.initializeMember($this, overriddenMember);
    var base = overriddenMember.type;
    var derived = symbol.type;
    if (base !== $this.cache.errorType && derived !== $this.cache.errorType) {
      semanticErrorBadOverride($this.log, node.children[0].range, symbol.name, overriddenMember.symbol.enclosingSymbol.type, overriddenMember.symbol.node.children[0].range);
    }
  }
  if ((symbol.flags & 1024) !== 0) {
    var value = node.children[2];
    if (value === null) {
      Log.error($this.log, node.children[0].range, "Variables with the \"const\" modifier must be initialized");
    } else {
      Resolver.resolveAsExpressionWithConversion($this, value, symbol.type, 0);
      ConstantFolder.foldConstants($this.constantFolder, value);
      if ($in.NodeKind.isConstant(value.kind)) {
        symbol.constant = value.content;
      } else if (value.type !== $this.cache.errorType && symbol.type !== $this.cache.errorType) {
        Log.error($this.log, value.range, "Variables with the \"const\" modifier must be initialized to a compile-time constant");
        value.type = $this.cache.errorType;
      }
    }
  }
};
Resolver.initializeParameter = function($this, symbol) {
  var type = symbol.type = new Type(symbol);
  var bound = symbol.node.children[1];
  if (bound !== null) {
    Resolver.resolveAsParameterizedType($this, bound);
    var boundType = bound.type;
    if (boundType === $this.cache.errorType) {
      symbol.type = $this.cache.errorType;
    } else if (!Type.isInterface(boundType)) {
      Log.error($this.log, bound.range, "Cannot use type \"" + Type.toString(boundType) + "\" as a type parameter bound");
    } else {
      type.relevantTypes = [boundType];
      Type.copyMembersFrom(type, boundType);
    }
  }
};
Resolver.initializeAlias = function($this, symbol) {
  var value = symbol.node.children[1];
  Resolver.resolveAsParameterizedType($this, value);
  symbol.type = value.type;
};
Resolver.initializeDeclaration = function($this, node) {
  var symbol = node.symbol;
  if ((symbol.flags & 49152) === 0) {
    symbol.flags |= 16384;
    var oldContext = $this.context;
    var oldTypeContext = $this.typeContext;
    var oldResultType = $this.resultType;
    $this.context = ResolveContext.fromNode(node);
    $this.typeContext = null;
    $this.resultType = null;
    switch (symbol.kind) {
    case 8:
      Resolver.initializeNamespace($this, symbol);
      break;
    case 9:
    case 10:
      Resolver.initializeEnum($this, symbol);
      break;
    case 11:
    case 12:
    case 13:
      Resolver.initializeObject($this, symbol);
      break;
    case 14:
    case 15:
    case 16:
      Resolver.initializeFunction($this, symbol);
      break;
    case 17:
    case 18:
    case 19:
      Resolver.initializeVariable($this, symbol);
      break;
    case 4:
      Resolver.initializeParameter($this, symbol);
      break;
    case 6:
      Resolver.initializeAlias($this, symbol);
      break;
    case 0:
      break;
    default:
      break;
    }
    $this.context = oldContext;
    $this.typeContext = oldTypeContext;
    $this.resultType = oldResultType;
    symbol.flags = symbol.flags & -16385 | 32768;
    while (node !== null) {
      var name = node.children[0];
      name.symbol = symbol;
      name.type = symbol.type;
      node = node.sibling;
    }
  }
};
Resolver.initializePotentiallyDuplicatedMember = function($this, member, range) {
  var symbol = member.symbol;
  if (symbol.kind === 2) {
    var names = [];
    for (var i = 0; i < symbol.identicalMembers.length; i = i + 1 | 0) {
      names.push(Symbol.fullName(symbol.identicalMembers[i].symbol));
    }
    semanticErrorAmbiguousSymbol($this.log, range, symbol.name, names);
    member.type = symbol.type = $this.cache.errorType;
    return;
  }
  Resolver.initializeMember($this, member);
};
Resolver.initializeMember = function($this, member) {
  if (member.type !== null) {
    return;
  }
  if (member.dependency !== null) {
    Resolver.initializeMember($this, member.dependency);
    member.type = member.dependency.type;
  } else {
    Resolver.initializeSymbol($this, member.symbol);
    member.type = member.symbol.type;
  }
  var parameterizedType = member.parameterizedType;
  if (parameterizedType !== null && parameterizedType.substitutions !== null) {
    member.type = TypeCache.substitute($this.cache, member.type, parameterizedType.symbol.parameters, parameterizedType.substitutions);
  }
};
Resolver.createSymbol = function($this, name, kind) {
  var symbol = new Symbol(name, kind);
  $this.allSymbols.push(symbol);
  return symbol;
};
Resolver.findModifierName = function(symbol, flag) {
  var node = symbol.node.parent;
  if (node.kind === 6) {
    node = node.parent;
  }
  while (node !== null && node.kind === 32) {
    var modifierName = node.children[0];
    if (nameToSymbolFlag.get(modifierName.content.value) === flag) {
      return modifierName;
    }
    node = node.parent;
  }
  return null;
};
Resolver.redundantModifierIfPresent = function($this, symbol, flag, where) {
  if ((symbol.flags & flag) !== 0 && (symbol.flags & 131072) === 0) {
    var modifierName = Resolver.findModifierName(symbol, flag);
    if (modifierName !== null) {
      Log.error($this.log, modifierName.range, "Redundant modifier \"" + modifierName.content.value + "\" " + where);
    }
  }
};
Resolver.unexpectedModifierIfPresent = function($this, symbol, flag, where) {
  if ((symbol.flags & flag) !== 0 && (symbol.flags & 131072) === 0) {
    var modifierName = Resolver.findModifierName(symbol, flag);
    if (modifierName !== null) {
      Log.error($this.log, modifierName.range, "Cannot use the \"" + modifierName.content.value + "\" modifier " + where);
    }
  }
};
Resolver.expectedModifierIfAbsent = function($this, symbol, flag, where) {
  if ((symbol.flags & flag) === 0 && (symbol.flags & 131072) === 0 && Resolver.findModifierName(symbol, flag) === null) {
    Log.error($this.log, symbol.node.children[0].range, "Expected the \"" + symbolFlagToName.get(flag) + "\" modifier " + where);
  }
};
Resolver.generateDefaultConstructor = function($this, symbol) {
  var enclosingSymbol = symbol.enclosingSymbol;
  var members = enclosingSymbol.type.members.values();
  var $arguments = [];
  var superArguments = null;
  var memberInitializers = [];
  var isPure = true;
  var baseClass = Type.isClass(enclosingSymbol.type) ? Type.baseClass(enclosingSymbol.type) : null;
  if (baseClass !== null) {
    isPure = false;
    var $constructor = Type.$constructor(baseClass);
    if ($constructor !== null) {
      Resolver.initializeMember($this, $constructor);
      if ($constructor.type.symbol === null) {
        var argumentTypes = Type.argumentTypes($constructor.type);
        superArguments = [];
        for (var j = 0; j < argumentTypes.length; j = j + 1 | 0) {
          var name = "_" + $arguments.length;
          var argument = Node.withChildren(new Node(16), [Node.withContent(new Node(34), new StringContent(name)), Node.withType(new Node(35), argumentTypes[j]), null]);
          argument.symbol = Resolver.createSymbol($this, name, 17);
          argument.symbol.node = argument;
          $arguments.push(argument);
          superArguments.push(Node.withContent(new Node(34), new StringContent(name)));
        }
      } else {
        symbol.flags |= 32768;
        symbol.type = $this.cache.errorType;
        return;
      }
    }
  }
  var uninitializedMembers = [];
  for (var i = 0; i < members.length; i = i + 1 | 0) {
    var member = members[i];
    var memberSymbol = member.symbol;
    if (memberSymbol.kind === 19 && memberSymbol.enclosingSymbol === enclosingSymbol) {
      if (memberSymbol.node.children[2] === null) {
        Resolver.initializeMember($this, member);
        if (member.type === $this.cache.errorType) {
          symbol.flags |= 32768;
          symbol.type = $this.cache.errorType;
          return;
        }
        uninitializedMembers.push(member);
      } else {
        isPure = false;
      }
    }
  }
  uninitializedMembers.sort(function(a, b) {
    return a.symbol.node.range.start - b.symbol.node.range.start | 0;
  });
  for (var i = 0; i < uninitializedMembers.length; i = i + 1 | 0) {
    var member = uninitializedMembers[i];
    var name = "_" + $arguments.length;
    var argument = Node.withChildren(new Node(16), [Node.withContent(new Node(34), new StringContent(name)), Node.withType(new Node(35), member.type), null]);
    argument.symbol = Resolver.createSymbol($this, name, 17);
    argument.symbol.node = argument;
    $arguments.push(argument);
    memberInitializers.push(Node.withChildren(new Node(5), [Node.withContent(new Node(34), new StringContent(member.symbol.name)), Node.withContent(new Node(34), new StringContent(name))]));
  }
  symbol.kind = 16;
  symbol.node = Node.withChildren(new Node(14), [Node.withContent(new Node(34), new StringContent(symbol.name)), Node.withChildren(new Node(3), $arguments), Node.withChildren(new Node(2), []), superArguments !== null ? Node.withChildren(new Node(48), superArguments) : null, memberInitializers !== null ? Node.withChildren(new Node(3), memberInitializers) : null]);
  Node.appendChild(enclosingSymbol.node.children[1], symbol.node);
  var scope = new Scope(enclosingSymbol.node.scope);
  symbol.node.symbol = symbol;
  symbol.node.scope = scope;
  for (var i = 0; i < $arguments.length; i = i + 1 | 0) {
    Scope.insert(scope, $arguments[i].symbol);
  }
  if (isPure) {
    symbol.flags |= 2048;
  }
};
Resolver.generateDefaultToString = function($this, symbol) {
  var enclosingSymbol = symbol.enclosingSymbol;
  var enclosingNode = enclosingSymbol.node;
  var members = enclosingSymbol.type.members.values();
  var fields = [];
  var i = 0;
  for (i = 0; i < members.length; i = i + 1 | 0) {
    var field = members[i].symbol;
    if (field.kind === 18 && (field.flags & 16) === 0) {
      fields.push(field);
    }
  }
  for (i = 0; i < fields.length; i = i + 1 | 0) {
    var field = fields[i];
    Resolver.initializeSymbol($this, field);
    if (field.type === $this.cache.errorType) {
      break;
    }
    var value = field.constant.value;
    var j = 0;
    for (j = 0; j < i; j = j + 1 | 0) {
      var other = fields[j];
      if (value === other.constant.value) {
        Log.error($this.log, enclosingNode.children[0].range, "Cannot automatically generate \"toString\" for \"" + enclosingSymbol.name + "\" because \"" + field.name + "\" and \"" + other.name + "\" both have the same value " + value);
        break;
      }
    }
    if (j < i) {
      break;
    }
  }
  var block = Node.withChildren(new Node(2), []);
  var extension = Node.withSymbol(Node.withChildren(new Node(13), [Node.withContent(new Node(34), new StringContent(enclosingSymbol.name)), block, null]), enclosingSymbol);
  Node.insertSiblingAfter(enclosingNode, extension);
  Node.appendToSiblingChain(enclosingNode, extension);
  var statement = null;
  if (fields.length === 0 || i < fields.length) {
    statement = Node.withChildren(new Node(24), [Node.withContent(new Node(43), new StringContent(""))]);
  } else {
    var cases = [];
    for (i = 0; i < fields.length; i = i + 1 | 0) {
      var field = fields[i];
      cases.push(Node.createCase([Node.withChildren(new Node(45), [null, Node.withContent(new Node(34), new StringContent(field.name))])], Node.withChildren(new Node(2), [Node.withChildren(new Node(24), [Node.withContent(new Node(43), new StringContent(field.name))])])));
    }
    cases.push(Node.createCase([], Node.withChildren(new Node(2), [Node.withChildren(new Node(24), [Node.withContent(new Node(43), new StringContent(""))])])));
    statement = Node.createSwitch(new Node(36), cases);
  }
  symbol.kind = 15;
  symbol.flags = 16;
  symbol.node = Node.withSymbol(Node.withChildren(new Node(15), [Node.withContent(new Node(34), new StringContent(symbol.name)), Node.withChildren(new Node(3), []), Node.withChildren(new Node(2), [statement]), Node.withType(new Node(35), $this.cache.stringType)]), symbol);
  Node.appendChild(block, symbol.node);
  Resolver.prepareNode($this, extension, enclosingNode.parent.scope);
  Resolver.resolve($this, extension, null);
};
Resolver.initializeSymbol = function($this, symbol) {
  if (symbol.kind === 1) {
    switch (symbol.name) {
    case "new":
      Resolver.generateDefaultConstructor($this, symbol);
      break;
    case "toString":
      Resolver.generateDefaultToString($this, symbol);
      break;
    default:
      break;
    }
    if (symbol.node !== null) {
      var oldContext = $this.context;
      $this.context = ResolveContext.fromNode(symbol.node);
      Resolver.resolve($this, symbol.node, null);
      $this.context = oldContext;
    }
  }
  if (symbol.kind === 3) {
    if (symbol.type !== null) {
      return;
    }
    var types = [];
    for (var i = 0; i < symbol.identicalMembers.length; i = i + 1 | 0) {
      var identical = symbol.identicalMembers[i];
      Resolver.initializeMember($this, identical);
      var type = identical.type;
      var index = types.indexOf(type);
      if (index < 0) {
        types.push(type);
      }
    }
    if (types.length !== 1) {
      semanticErrorUnmergedSymbol($this.log, symbol.enclosingSymbol.node.children[0].range, Symbol.fullName(symbol), types);
      symbol.type = $this.cache.errorType;
    } else {
      symbol.type = types[0];
    }
    return;
  }
  if ((symbol.flags & 49152) === 0) {
    Resolver.initializeDeclaration($this, symbol.node);
  } else if ((symbol.flags & 16384) !== 0) {
    Log.error($this.log, Node.firstNonExtensionSibling(symbol.node).children[0].range, "Cyclic declaration of \"" + symbol.name + "\"");
    symbol.type = $this.cache.errorType;
  }
};
Resolver.resolveArguments = function($this, $arguments, argumentTypes, outer, inner) {
  if (argumentTypes.length !== $arguments.length) {
    var range = Range.equal(outer, inner) ? outer : Range.after(outer, inner);
    semanticErrorArgumentCount($this.log, range, argumentTypes.length, $arguments.length);
    Resolver.resolveNodesAsExpressions($this, $arguments);
    return;
  }
  for (var i = 0; i < $arguments.length; i = i + 1 | 0) {
    Resolver.resolveAsExpressionWithConversion($this, $arguments[i], argumentTypes[i], 0);
  }
};
Resolver.resolveAsType = function($this, node) {
  Resolver.resolve($this, node, null);
  Resolver.checkIsType($this, node);
};
Resolver.resolveAsParameterizedType = function($this, node) {
  Resolver.resolveAsType($this, node);
  Resolver.checkIsParameterized($this, node);
};
Resolver.resolveAsExpression = function($this, node) {
  Resolver.resolve($this, node, null);
  Resolver.checkIsInstance($this, node);
};
Resolver.resolveAsExpressionWithTypeContext = function($this, node, type) {
  Resolver.resolve($this, node, type);
  Resolver.checkIsInstance($this, node);
};
Resolver.resolveAsExpressionWithConversion = function($this, node, type, kind) {
  Resolver.resolve($this, node, type);
  Resolver.checkIsInstance($this, node);
  if (type !== null) {
    Resolver.checkConversion($this, type, node, kind);
  }
};
Resolver.resolveNodes = function($this, nodes) {
  for (var i = 0; i < nodes.length; i = i + 1 | 0) {
    Resolver.resolve($this, nodes[i], null);
  }
};
Resolver.resolveNodesAsExpressions = function($this, nodes) {
  for (var i = 0; i < nodes.length; i = i + 1 | 0) {
    Resolver.resolveAsExpression($this, nodes[i]);
  }
};
Resolver.resolveNodesAsVariableTypes = function($this, nodes) {
  for (var i = 0; i < nodes.length; i = i + 1 | 0) {
    var node = nodes[i];
    Resolver.resolveAsParameterizedType($this, node);
    Resolver.checkIsValidVariableType($this, node);
  }
};
Resolver.resolveChildren = function($this, node) {
  if (Node.hasChildren(node)) {
    Resolver.resolveNodes($this, node.children);
  }
};
Resolver.resolveBlock = function($this, node) {
  Resolver.resolveChildren($this, node);
  if (Node.hasChildren(node)) {
    for (var i = 0; i < node.children.length; i = i + 1 | 0) {
      var child = node.children[i];
      var kind = child.kind;
      if (kind === 29 || kind === 28 && $this.options.removeAsserts) {
        Node.removeChildAtIndex(node, i);
        i = i - 1 | 0;
      }
    }
  }
};
Resolver.resolveCase = function($this, node) {
  var values = Node.caseValues(node);
  var block = Node.caseBlock(node);
  for (var i = 0; i < values.length; i = i + 1 | 0) {
    var value = values[i];
    Resolver.resolveAsExpressionWithConversion($this, value, $this.context.switchValue.type, 0);
    ConstantFolder.foldConstants($this.constantFolder, value);
    if (value.type !== $this.cache.errorType && !$in.NodeKind.isConstant(value.kind)) {
      Log.error($this.log, value.range, "Non-constant case value");
      value.type = $this.cache.errorType;
    }
  }
  Resolver.resolve($this, block, null);
};
Resolver.resolveNamespace = function($this, node) {
  Resolver.checkDeclarationLocation($this, node, 0);
  if (node.symbol !== null) {
    Resolver.initializeSymbol($this, node.symbol);
  }
  Resolver.resolve($this, node.children[1], null);
};
Resolver.resolveEnum = function($this, node) {
  Resolver.checkDeclarationLocation($this, node, 0);
  Resolver.initializeSymbol($this, node.symbol);
  Resolver.resolve($this, node.children[1], null);
};
Resolver.resolveObject = function($this, node) {
  Resolver.checkDeclarationLocation($this, node, 0);
  Resolver.initializeSymbol($this, node.symbol);
  var members = node.symbol.type.members.values();
  for (var i = 0; i < members.length; i = i + 1 | 0) {
    var member = members[i];
    if (member.symbol.kind === 3) {
      Resolver.initializeMember($this, member);
    }
  }
  var oldSymbolForThis = $this.context.symbolForThis;
  $this.context.symbolForThis = node.symbol;
  var $constructor = Type.$constructor(node.symbol.type);
  if ($constructor !== null) {
    Resolver.initializeMember($this, $constructor);
  }
  Resolver.resolve($this, node.children[1], null);
  $this.context.symbolForThis = oldSymbolForThis;
};
Resolver.resolveExtension = function($this, node) {
  Resolver.checkDeclarationLocation($this, node, 0);
  Resolver.initializeSymbol($this, node.symbol);
  var oldSymbolForThis = $this.context.symbolForThis;
  if ($in.SymbolKind.isTypeWithInstances(node.symbol.kind)) {
    $this.context.symbolForThis = node.symbol;
  }
  Resolver.resolve($this, node.children[1], null);
  $this.context.symbolForThis = oldSymbolForThis;
};
Resolver.resolveFunction = function($this, node) {
  Resolver.checkDeclarationLocation($this, node, 1);
  Resolver.initializeSymbol($this, node.symbol);
  var oldFunctionSymbol = $this.context.functionSymbol;
  $this.context.functionSymbol = node.symbol;
  var block = node.children[2];
  if (block !== null) {
    var oldResultType = $this.resultType;
    if ((node.symbol.flags & 8192) !== 0) {
      Log.error($this.log, block.range, "Imported functions cannot have an implementation");
    }
    var symbol = node.symbol;
    if (symbol.type === $this.cache.errorType) {
      $this.resultType = $this.cache.errorType;
    } else if (symbol.kind === 16) {
      $this.resultType = $this.cache.voidType;
    } else {
      $this.resultType = symbol.type.relevantTypes[0];
    }
    Resolver.resolve($this, block, null);
    if ($this.resultType !== $this.cache.errorType && $this.resultType !== $this.cache.voidType && !Node.blockAlwaysEndsWithReturn(block)) {
      Log.error($this.log, node.children[0].range, "All control paths for \"" + node.symbol.name + "\" must return a value of type \"" + Type.toString($this.resultType) + "\"");
    }
    $this.resultType = oldResultType;
  }
  if (node.kind === 14) {
    var overriddenMember = node.symbol.overriddenMember;
    var overriddenType = $this.cache.errorType;
    if (overriddenMember !== null) {
      Resolver.initializeMember($this, overriddenMember);
      overriddenType = overriddenMember.type;
    }
    var superInitializer = node.children[3];
    if (superInitializer !== null) {
      if (overriddenMember !== null) {
        superInitializer.symbol = overriddenMember.symbol;
      } else {
        Log.error($this.log, superInitializer.range, "No base constructor to call");
      }
      var $arguments = superInitializer.children;
      if (overriddenType === $this.cache.errorType) {
        Resolver.resolveNodesAsExpressions($this, $arguments);
      } else {
        Resolver.resolveArguments($this, $arguments, Type.argumentTypes(overriddenType), superInitializer.range, superInitializer.range);
      }
    } else if (overriddenType.symbol === null) {
      if (Type.argumentTypes(overriddenType).length > 0) {
        Log.error($this.log, node.children[0].range, "Missing call to \"super\" in initializer list");
      } else {
        Node.replaceChild(node, 3, Node.withSymbol(Node.withChildren(new Node(48), []), overriddenMember.symbol));
      }
    }
    var memberInitializers = node.children[4];
    if (memberInitializers === null) {
      memberInitializers = Node.withChildren(new Node(3), []);
      Node.replaceChild(node, 4, memberInitializers);
    }
    if ((superInitializer !== null || memberInitializers.children.length > 0) && block === null) {
      Log.error($this.log, Range.span((superInitializer !== null ? superInitializer : memberInitializers.children[0]).range, (memberInitializers.children.length < 1 ? superInitializer : memberInitializers.children[memberInitializers.children.length - 1 | 0]).range), "An abstract constructor must not have initializer list");
    }
    var enclosingSymbol = node.symbol.enclosingSymbol;
    if ((enclosingSymbol.flags & 8192) === 0) {
      var members = enclosingSymbol.type.members.values();
      var index = 0;
      for (var i = 0; i < members.length; i = i + 1 | 0) {
        var member = members[i];
        var memberSymbol = member.symbol;
        if (memberSymbol.kind === 19 && memberSymbol.enclosingSymbol === enclosingSymbol) {
          var value = memberSymbol.node.children[2];
          if (value !== null) {
            Resolver.initializeMember($this, member);
            var oldScope = $this.context.scope;
            $this.context.scope = node.scope.lexicalParent;
            $this.context.functionSymbol = null;
            Resolver.resolve($this, memberSymbol.node, null);
            $this.context.functionSymbol = node.symbol;
            $this.context.scope = oldScope;
            Node.replaceWith(value, new Node(49));
            Node.insertChild(memberInitializers, (index = index + 1 | 0) - 1 | 0, Node.withChildren(new Node(5), [Node.withType(Node.withSymbol(Node.withContent(new Node(34), new StringContent(memberSymbol.name)), memberSymbol), member.type), value]));
          } else {
            var j = 0;
            for (j = 0; j < memberInitializers.children.length; j = j + 1 | 0) {
              if (memberInitializers.children[j].children[0].content.value === memberSymbol.name) {
                break;
              }
            }
            if (j === memberInitializers.children.length) {
              Resolver.initializeMember($this, member);
              Node.insertChild(memberInitializers, (index = index + 1 | 0) - 1 | 0, Node.withChildren(new Node(5), [Node.withType(Node.withSymbol(Node.withContent(new Node(34), new StringContent(memberSymbol.name)), memberSymbol), member.type), Resolver.createDefaultValue($this, member.type, memberSymbol.node.children[0].range)]));
            }
          }
        }
      }
    }
    for (var i = 0; i < memberInitializers.children.length; i = i + 1 | 0) {
      var memberInitializer = memberInitializers.children[i];
      var name = memberInitializer.children[0];
      var value = memberInitializer.children[1];
      var oldScope = $this.context.scope;
      $this.context.scope = node.scope.lexicalParent;
      Resolver.resolve($this, name, null);
      $this.context.scope = oldScope;
      if (name.symbol !== null) {
        Resolver.resolveAsExpressionWithConversion($this, value, name.symbol.type, 0);
        for (var j = 0; j < i; j = j + 1 | 0) {
          var other = memberInitializers.children[j];
          if (other.children[0].symbol === name.symbol) {
            semanticErrorAlreadyInitialized($this.log, value.range, name.symbol.name, other.children[1].range);
            break;
          }
        }
      } else {
        Resolver.resolveAsExpression($this, value);
      }
    }
  }
  $this.context.functionSymbol = oldFunctionSymbol;
};
Resolver.isPureValue = function($this, node) {
  var kind = node.kind;
  if (node.type === $this.cache.errorType) {
    return true;
  }
  if (kind === 44) {
    if (Node.hasChildren(node)) {
      for (var i = 0; i < node.children.length; i = i + 1 | 0) {
        if (!Resolver.isPureValue($this, node.children[i])) {
          return false;
        }
      }
    }
    return true;
  }
  if (kind === 47) {
    var value = node.children[0];
    var $arguments = Node.callArguments(node);
    if (value.kind !== 35 || (node.symbol.flags & 2048) === 0) {
      return false;
    }
    for (var i = 0; i < $arguments.length; i = i + 1 | 0) {
      if (!Resolver.isPureValue($this, $arguments[i])) {
        return false;
      }
    }
    return true;
  }
  if ($in.NodeKind.isCast(kind)) {
    return Resolver.isPureValue($this, node.children[1]);
  }
  return $in.NodeKind.isConstant(kind) || kind === 54;
};
Resolver.resolveVariable = function($this, node) {
  var symbol = node.symbol;
  Resolver.initializeSymbol($this, symbol);
  var value = node.children[2];
  var enclosingSymbol = symbol.enclosingSymbol;
  if ((symbol.flags & 64) === 0 && enclosingSymbol !== null) {
    var enclosingSymbolType = enclosingSymbol.type;
    if (Type.isInterface(enclosingSymbolType) || (symbol.flags & 16) !== 0 && Type.isEnum(enclosingSymbolType)) {
      Resolver.unexpectedStatement($this, node);
    } else if ((symbol.flags & 16) !== 0 && $in.SymbolKind.isTypeWithInstances(enclosingSymbol.kind) && value === null) {
      Log.error($this.log, node.children[0].range, "Instance variables in extension blocks must be initialized");
    }
  }
  if (value !== null) {
    Resolver.resolveAsExpressionWithConversion($this, value, Symbol.isEnumValue(symbol) ? $this.cache.intType : symbol.type, 0);
    if (symbol.kind === 18) {
      ConstantFolder.foldConstants($this.constantFolder, value);
      if (!Resolver.isPureValue($this, value) && symbol.type !== $this.cache.errorType) {
        Log.error($this.log, value.range, "Global variables must be initialized to a pure expression (one without side effects)");
        value.type = $this.cache.errorType;
      }
    }
  } else if (symbol.type !== $this.cache.errorType && node.parent.kind === 6 && symbol.kind !== 19) {
    Node.replaceChild(node, 2, Node.withType(Resolver.createDefaultValue($this, symbol.type, node.children[0].range), symbol.type));
  }
};
Resolver.resolveAlias = function($this, node) {
  Resolver.checkInsideBlock($this, node);
  if (node.symbol !== null) {
    Resolver.initializeSymbol($this, node.symbol);
  }
};
Resolver.resolveIf = function($this, node) {
  Resolver.checkStatementLocation($this, node);
  Resolver.resolveAsExpressionWithConversion($this, node.children[0], $this.cache.boolType, 0);
  Resolver.resolve($this, node.children[1], null);
  if (node.children[2] !== null) {
    Resolver.resolve($this, node.children[2], null);
  }
};
Resolver.resolveFor = function($this, node) {
  Resolver.checkStatementLocation($this, node);
  var setup = node.children[0];
  var test = node.children[1];
  var update = node.children[2];
  if (setup !== null) {
    if (setup.kind === 6) {
      Resolver.resolve($this, setup, null);
    } else {
      Resolver.resolveAsExpression($this, setup);
    }
  }
  if (test !== null) {
    Resolver.resolveAsExpressionWithConversion($this, test, $this.cache.boolType, 0);
  }
  if (update !== null) {
    Resolver.resolveAsExpression($this, update);
  }
  var oldLoop = $this.context.loop;
  $this.context.loop = node;
  Resolver.resolve($this, node.children[3], null);
  $this.context.loop = oldLoop;
};
Resolver.resolveForEach = function($this, node) {
  Resolver.checkStatementLocation($this, node);
  Resolver.resolve($this, node.children[0], null);
  Resolver.resolve($this, node.children[1], null);
  var oldLoop = $this.context.loop;
  $this.context.loop = node;
  Resolver.resolve($this, node.children[2], null);
  $this.context.loop = oldLoop;
};
Resolver.resolveWhile = function($this, node) {
  Resolver.checkStatementLocation($this, node);
  var test = node.children[0];
  if (test !== null) {
    Resolver.resolveAsExpressionWithConversion($this, test, $this.cache.boolType, 0);
  }
  var oldLoop = $this.context.loop;
  $this.context.loop = node;
  Resolver.resolve($this, node.children[1], null);
  $this.context.loop = oldLoop;
};
Resolver.resolveReturn = function($this, node) {
  var value = node.children[0];
  if ($this.resultType === null) {
    Resolver.unexpectedStatement($this, node);
    if (value !== null) {
      Resolver.resolveAsExpression($this, value);
    }
    return;
  }
  if (value !== null) {
    if (node.kind === 25 && $this.resultType === $this.cache.voidType) {
      Node.become(node, Node.withChildren(new Node(30), [Node.remove(value)]));
      Resolver.resolve($this, node, null);
    } else {
      Resolver.resolveAsExpressionWithConversion($this, value, $this.resultType, 0);
    }
  } else if ($this.resultType !== $this.cache.errorType && $this.resultType !== $this.cache.voidType) {
    Log.error($this.log, node.range, "Return statement must return type \"" + Type.toString($this.resultType) + "\"");
  }
};
Resolver.resolveBreak = function($this, node) {
  if ($this.context.loop === null) {
    Resolver.unexpectedStatement($this, node);
  }
};
Resolver.resolveContinue = function($this, node) {
  if ($this.context.loop === null) {
    Resolver.unexpectedStatement($this, node);
  }
};
Resolver.resolveAssert = function($this, node) {
  if (node.kind === 28) {
    Resolver.checkStatementLocation($this, node);
  }
  var value = node.children[0];
  Resolver.resolveAsExpressionWithConversion($this, value, $this.cache.boolType, 0);
  if (node.kind === 29) {
    ConstantFolder.foldConstants($this.constantFolder, value);
    if (!$in.NodeKind.isConstant(value.kind)) {
      Log.error($this.log, value.range, "The argument to a compile-time assert must be a constant");
    } else if (!Node.isTrue(value)) {
      Log.error($this.log, node.range, "Assertion failed");
    }
  }
};
Resolver.resolveExpression = function($this, node) {
  var value = node.children[0];
  if (value.kind !== 49) {
    Resolver.checkStatementLocation($this, node);
  }
  Resolver.resolveAsExpression($this, value);
  Resolver.checkUnusedExpression($this, value);
};
Resolver.resolveSwitch = function($this, node) {
  Resolver.checkStatementLocation($this, node);
  var value = node.children[0];
  var cases = Node.switchCases(node);
  Resolver.resolveAsExpression($this, value);
  var oldSwitchValue = $this.context.switchValue;
  $this.context.switchValue = value;
  Resolver.resolveNodes($this, cases);
  $this.context.switchValue = oldSwitchValue;
  var uniqueValues = [];
  for (var i = 0; i < cases.length; i = i + 1 | 0) {
    var child = cases[i];
    if (child.children.length === 1 && i < (cases.length - 1 | 0)) {
      Log.error($this.log, child.range, "Only the last case can be a default case");
    }
    var caseValues = Node.caseValues(child);
    for (var j = 0; j < caseValues.length; j = j + 1 | 0) {
      var caseValue = caseValues[j];
      if (caseValue.type === $this.cache.errorType) {
        continue;
      }
      var k = 0;
      for (k = 0; k < uniqueValues.length; k = k + 1 | 0) {
        var original = uniqueValues[k];
        if (original.kind === caseValue.kind && Content.equal(original.content, caseValue.content)) {
          semanticErrorDuplicateCase($this.log, caseValue.range, original.range);
          break;
        }
      }
      if (k === uniqueValues.length) {
        uniqueValues.push(caseValue);
      }
    }
  }
};
Resolver.resolveName = function($this, node) {
  var name = node.content.value;
  var member = Scope.find($this.context.scope, name);
  if (member === null) {
    Log.error($this.log, node.range, "\"" + name + "\" is not declared");
    return;
  }
  Resolver.initializePotentiallyDuplicatedMember($this, member, node.range);
  node.symbol = member.symbol;
  if (!Resolver.checkAccessToInstanceSymbol($this, node)) {
    node.type = $this.cache.errorType;
    return;
  }
  if ($in.SymbolKind.isType(member.symbol.kind)) {
    Node.become(node, Node.withSymbol(Node.withRange(Node.withType(new Node(35), member.type), node.range), member.symbol));
    return;
  }
  node.type = member.type;
};
Resolver.resolveThis = function($this, node) {
  if (Resolver.checkAccessToThis($this, node.range)) {
    var symbol = $this.context.symbolForThis;
    Resolver.initializeSymbol($this, symbol);
    node.type = symbol.type;
    node.symbol = symbol;
  }
};
Resolver.resolveHook = function($this, node) {
  var trueNode = node.children[1];
  var falseNode = node.children[2];
  Resolver.resolveAsExpressionWithConversion($this, node.children[0], $this.cache.boolType, 0);
  Resolver.resolveAsExpressionWithTypeContext($this, trueNode, $this.typeContext);
  Resolver.resolveAsExpressionWithTypeContext($this, falseNode, $this.typeContext);
  var trueType = trueNode.type;
  var falseType = falseNode.type;
  if (trueType === $this.cache.errorType || falseType === $this.cache.errorType) {
    return;
  }
  var commonType = TypeCache.commonImplicitType($this.cache, trueType, falseType);
  if (commonType === null) {
    commonType = $this.typeContext;
    if (commonType === null || !TypeCache.canImplicitlyConvert($this.cache, trueType, commonType) || !TypeCache.canImplicitlyConvert($this.cache, falseType, commonType)) {
      Log.error($this.log, Range.span(trueNode.range, falseNode.range), "No common type for type \"" + Type.toString(trueType) + "\" and type \"" + Type.toString(falseType) + "\"");
      return;
    }
  }
  Resolver.checkConversion($this, commonType, trueNode, 0);
  Resolver.checkConversion($this, commonType, falseNode, 0);
  node.type = commonType;
};
Resolver.resolveInt = function($this, node) {
  if (node.content.value === -2147483648) {
    Log.error($this.log, node.range, "Invalid integer literal " + Range.toString(node.range));
  }
  node.type = $this.cache.intType;
};
Resolver.resolveList = function($this, node) {
  var values = node.children;
  if ($this.typeContext !== null && $this.typeContext === $this.cache.errorType) {
    Resolver.resolveNodesAsExpressions($this, values);
    return;
  }
  if ($this.typeContext !== null && $this.typeContext.symbol === $this.cache.listType.symbol) {
    var itemType = $this.typeContext.substitutions[0];
    for (var i = 0; i < values.length; i = i + 1 | 0) {
      Resolver.resolveAsExpressionWithConversion($this, values[i], itemType, 0);
    }
    node.type = $this.typeContext;
    return;
  }
  var commonType = null;
  for (var i = 0; i < values.length; i = i + 1 | 0) {
    var value = values[i];
    Resolver.resolveAsExpression($this, value);
    if (commonType === null || value.type === $this.cache.errorType) {
      commonType = value.type;
    } else if (commonType !== $this.cache.errorType) {
      commonType = TypeCache.commonImplicitType($this.cache, commonType, value.type);
      if (commonType === null) {
        Log.error($this.log, node.range, "Cannot infer a common element type for this list literal");
        commonType = $this.cache.errorType;
      }
    }
  }
  if (commonType !== null && commonType === $this.cache.errorType) {
    return;
  }
  if (commonType === null) {
    Log.error($this.log, node.range, "Cannot infer a common element type for this list literal");
    return;
  }
  node.type = TypeCache.parameterize($this.cache, $this.cache.listType, [commonType]);
};
Resolver.resolveDot = function($this, node) {
  var target = node.children[0];
  if (target !== null) {
    Resolver.resolve($this, target, null);
  }
  var type = target !== null ? target.type : $this.typeContext;
  if (type === null) {
    Log.error($this.log, node.range, "Expression has no type context here");
    return;
  }
  if (type === $this.cache.errorType) {
    return;
  }
  var dotName = node.children[1];
  if (dotName === null) {
    return;
  }
  var name = dotName.content.value;
  var member = type.members.getOrDefault(name, null);
  if (member === null) {
    Log.error($this.log, dotName.range, "\"" + name + "\" is not declared on type \"" + Type.toString(type) + "\"");
    return;
  }
  node.symbol = dotName.symbol = member.symbol;
  Resolver.initializePotentiallyDuplicatedMember($this, member, dotName.range);
  var symbolIsType = $in.SymbolKind.isType(member.symbol.kind);
  var targetIsType = target === null || target.kind === 35;
  if (!Type.isNamespace(type) && (!Type.isEnum(type) || (member.symbol.flags & 16) !== 0)) {
    var isStatic = symbolIsType || (member.symbol.flags & 64) !== 0;
    if (isStatic && !targetIsType) {
      Log.error($this.log, dotName.range, "Cannot access static member \"" + name + "\" from an instance context");
    } else if (!isStatic && targetIsType) {
      Log.error($this.log, dotName.range, "Cannot access instance member \"" + name + "\" from a static context");
    }
  }
  if (symbolIsType) {
    Node.become(node, Node.withSymbol(Node.withRange(Node.withType(new Node(35), member.type), node.range), member.symbol));
  } else if (targetIsType) {
    Node.become(node, Node.withType(Node.withSymbol(Node.withRange(Node.withContent(new Node(34), new StringContent(member.symbol.name)), node.range), member.symbol), member.type));
  } else {
    node.type = dotName.type = member.type;
  }
};
Resolver.resolveLet = function($this, node) {
  var value = node.children[1];
  Resolver.resolve($this, node.children[0], null);
  Resolver.resolveAsExpressionWithTypeContext($this, value, $this.typeContext);
  node.type = value.type;
};
Resolver.resolveCall = function($this, node) {
  var value = node.children[0];
  var $arguments = Node.callArguments(node);
  if (value.kind === 54 && $this.typeContext !== null) {
    Resolver.resolveNodesAsExpressions($this, $arguments);
    if ($this.typeContext === $this.cache.errorType) {
      Resolver.resolveAsExpression($this, value);
      return;
    }
    var argumentTypes = [];
    for (var i = 0; i < $arguments.length; i = i + 1 | 0) {
      var type = $arguments[i].type;
      if (type === $this.cache.errorType) {
        Resolver.resolveAsExpression($this, value);
        return;
      }
      argumentTypes.push(type);
    }
    Resolver.resolveAsExpressionWithConversion($this, value, TypeCache.functionType($this.cache, $this.typeContext, argumentTypes), 0);
  } else {
    Resolver.resolve($this, value, null);
    if (value.kind === 35) {
      Resolver.checkIsParameterized($this, value);
    }
    var valueType = value.type;
    if (valueType === $this.cache.errorType) {
      Resolver.resolveNodesAsExpressions($this, $arguments);
      return;
    }
    if (value.kind === 35) {
      var member = Type.$constructor(valueType);
      if (member === null) {
        Log.error($this.log, value.range, "Cannot construct type \"" + Type.toString(valueType) + "\"");
        Resolver.resolveNodesAsExpressions($this, $arguments);
        return;
      }
      Resolver.initializeMember($this, member);
      node.symbol = member.symbol;
      valueType = member.type;
      if (valueType === $this.cache.errorType) {
        Resolver.resolveNodesAsExpressions($this, $arguments);
        return;
      }
    }
    if (valueType.symbol !== null) {
      Log.error($this.log, value.range, "Cannot call type \"" + Type.toString(valueType) + "\"");
      Resolver.resolveNodesAsExpressions($this, $arguments);
      return;
    }
    node.type = valueType.relevantTypes[0];
    Resolver.resolveArguments($this, $arguments, Type.argumentTypes(valueType), node.range, value.range);
  }
};
Resolver.resolveSequence = function($this, node) {
  for (var i = 0, n = node.children.length; i < n; i = i + 1 | 0) {
    var child = node.children[i];
    if (i < (n - 1 | 0)) {
      Resolver.resolveAsExpression($this, child);
      Resolver.checkUnusedExpression($this, child);
    } else {
      Resolver.resolveAsExpressionWithConversion($this, child, $this.typeContext, node.parent.kind === 52 ? 1 : 0);
    }
  }
};
Resolver.resolveParameterize = function($this, node) {
  var parameterizeType = node.children[0];
  var substitutions = Node.parameterizeTypes(node);
  Resolver.resolveAsType($this, parameterizeType);
  Resolver.resolveNodesAsVariableTypes($this, substitutions);
  var unparameterized = parameterizeType.type;
  if (unparameterized === $this.cache.errorType) {
    return;
  }
  if (!Type.hasParameters(unparameterized) || unparameterized.substitutions !== null) {
    semanticErrorCannotParameterize($this.log, parameterizeType.range, unparameterized);
    return;
  }
  var parameters = unparameterized.symbol.parameters;
  var sortedParameters = unparameterized.symbol.sortedParameters;
  if (parameters.length !== substitutions.length) {
    semanticErrorParameterCount($this.log, Range.after(node.range, parameterizeType.range), parameters.length, substitutions.length);
    return;
  }
  var sortedTypes = [];
  for (var i = 0; i < sortedParameters.length; i = i + 1 | 0) {
    var parameter = sortedParameters[i];
    var index = parameters.indexOf(parameter);
    var substitution = substitutions[index];
    if (parameter.type === $this.cache.errorType) {
      return;
    }
    var bound = Type.bound(parameter.type);
    if (bound !== null) {
      if (i > 0) {
        bound = TypeCache.substitute($this.cache, bound, sortedParameters.slice(0, i), sortedTypes.slice(0, i));
      }
      Resolver.checkConversion($this, bound, substitution, 0);
    }
    if (substitution.type === $this.cache.errorType) {
      return;
    }
    sortedTypes.push(substitution.type);
  }
  var types = [];
  for (var i = 0; i < substitutions.length; i = i + 1 | 0) {
    types.push(substitutions[i].type);
  }
  Node.become(node, Node.withSymbol(Node.withRange(Node.withType(new Node(35), TypeCache.parameterize($this.cache, unparameterized, types)), node.range), parameterizeType.symbol));
};
Resolver.resolveCast = function($this, node) {
  var type = node.children[0];
  Resolver.resolveAsParameterizedType($this, type);
  Resolver.checkIsValidVariableType($this, type);
  Resolver.resolveAsExpressionWithConversion($this, node.children[1], type.type, 1);
  node.type = type.type;
};
Resolver.resolveLambda = function($this, node) {
  var oldResultType = $this.resultType;
  var oldLoop = $this.context.loop;
  $this.resultType = $this.cache.errorType;
  $this.context.loop = null;
  var $arguments = Node.lambdaArguments(node);
  var block = Node.lambdaBlock(node);
  if ($this.typeContext === null) {
    Log.error($this.log, node.range, "Expression has no type context here");
  } else if ($this.typeContext !== $this.cache.errorType) {
    if ($this.typeContext.symbol !== null) {
      Log.error($this.log, node.range, "Cannot use a lambda expression with type \"" + Type.toString($this.typeContext) + "\"");
    } else if ($this.typeContext !== $this.cache.errorType) {
      var argumentTypes = Type.argumentTypes($this.typeContext);
      $this.resultType = $this.typeContext.relevantTypes[0];
      node.type = $this.typeContext;
      if (argumentTypes.length !== $arguments.length) {
        semanticErrorArgumentCount($this.log, node.range, argumentTypes.length, $arguments.length);
      } else {
        for (var i = 0; i < $arguments.length; i = i + 1 | 0) {
          Node.replaceChild($arguments[i], 1, Node.withType(new Node(35), argumentTypes[i]));
        }
      }
      if ($this.resultType !== $this.cache.errorType && $this.resultType !== $this.cache.voidType && !Node.blockAlwaysEndsWithReturn(block)) {
        Log.error($this.log, node.range, "All control paths for lambda expression must return a value of type \"" + Type.toString($this.resultType) + "\"");
      }
    }
  }
  Resolver.resolveNodes($this, $arguments);
  Resolver.resolve($this, block, null);
  $this.resultType = oldResultType;
  $this.context.loop = oldLoop;
};
Resolver.resolveVar = function($this, node) {
  Log.error($this.log, node.range, "Unexpected " + $in.NodeKind.toString(node.kind));
};
Resolver.resolveFunctionType = function($this, node) {
  var result = node.children[0];
  var $arguments = Node.functionTypeArguments(node);
  Resolver.resolveAsParameterizedType($this, result);
  Resolver.resolveNodesAsVariableTypes($this, $arguments);
  if (result.type !== $this.cache.errorType) {
    var argumentTypes = [];
    for (var i = 0; i < $arguments.length; i = i + 1 | 0) {
      var argumentType = $arguments[i].type;
      if (argumentType === $this.cache.errorType) {
        return;
      }
      argumentTypes.push(argumentType);
    }
    Node.become(node, Node.withRange(Node.withType(new Node(35), TypeCache.functionType($this.cache, result.type, argumentTypes)), node.range));
  }
};
Resolver.resolveUnaryOperator = function($this, node) {
  var kind = node.kind;
  var value = node.children[0];
  if (kind === 60 && value.kind === 40 && value.content.value === -2147483648) {
    Node.become(node, Node.withType(Node.withRange(value, node.range), $this.cache.intType));
    return;
  }
  if (kind === 61 && $this.typeContext !== null && Type.isEnumFlags($this.typeContext)) {
    Resolver.resolveAsExpressionWithTypeContext($this, value, $this.typeContext);
  } else {
    Resolver.resolveAsExpression($this, value);
  }
  var type = value.type;
  if (type === $this.cache.errorType) {
    return;
  }
  if (kind === 59 || kind === 60) {
    if (Type.isEnum(type)) {
      node.type = $this.cache.intType;
    } else if (Type.isNumeric(type, $this.cache)) {
      node.type = type;
    }
  } else if ($in.NodeKind.isUnaryStorageOperator(kind)) {
    if (!Type.isEnum(type) && Type.isNumeric(type, $this.cache)) {
      Resolver.checkStorage($this, value);
      node.type = type;
    }
  } else if (kind === 58) {
    if (type === $this.cache.boolType) {
      node.type = type;
    }
  } else if (kind === 61) {
    if (Type.isEnumFlags(type)) {
      node.type = type;
    } else if (Type.isInteger(type, $this.cache)) {
      node.type = $this.cache.intType;
    }
  }
  if (node.type === $this.cache.errorType) {
    Log.error($this.log, node.range, "No unary operator " + operatorInfo.get(kind).text + " for type \"" + Type.toString(type) + "\"");
    return;
  }
  Resolver.checkConversion($this, node.type, value, 0);
};
Resolver.wrapWithToStringCall = function($this, node) {
  if (node.type === $this.cache.errorType) {
    return false;
  }
  var toString = node.type.members.getOrDefault("toString", null);
  if (toString === null) {
    Log.error($this.log, node.range, "Expression of type \"" + Type.toString(node.type) + "\" has no toString() member to call");
    return false;
  }
  Resolver.initializeMember($this, toString);
  if (toString.type === $this.cache.errorType) {
    return false;
  }
  if (toString.type !== $this.cache.toStringType) {
    Log.error($this.log, node.range, "Expected toString() member to have type \"" + Type.toString($this.cache.toStringType) + "\" but found type \"" + Type.toString(toString.type) + "\"");
    return false;
  }
  var children = Node.removeChildren(node);
  var name = Node.withContent(new Node(34), new StringContent("toString"));
  var target = Node.withChildren(new Node(45), [Node.withChildren(Node.clone(node), children), name]);
  var $call = Node.createCall(target, []);
  target.symbol = name.symbol = toString.symbol;
  target.type = $this.cache.toStringType;
  $call.type = $this.cache.stringType;
  Node.become(node, $call);
  return true;
};
Resolver.resolveWithTypeContextTransfer = function($this, left, right) {
  if (!Resolver.needsTypeContext($this, left)) {
    Resolver.resolveAsExpression($this, left);
    Resolver.resolveAsExpressionWithTypeContext($this, right, left.type);
  } else if (!Resolver.needsTypeContext($this, right)) {
    Resolver.resolveAsExpression($this, right);
    Resolver.resolveAsExpressionWithTypeContext($this, left, right.type);
  }
};
Resolver.resolveBinaryOperator = function($this, node) {
  var kind = node.kind;
  var left = node.children[0];
  var right = node.children[1];
  if ($in.NodeKind.isBinaryStorageOperator(kind)) {
    Resolver.resolveAsExpression($this, left);
    if (kind === 86 || Type.isNumeric(left.type, $this.cache)) {
      Resolver.resolveAsExpressionWithConversion($this, right, left.type, 0);
      Resolver.checkStorage($this, left);
      node.type = left.type;
      return;
    } else if (kind === 87 && left.type === $this.cache.stringType) {
      Resolver.resolveAsExpression($this, right);
      if (right.type !== $this.cache.stringType) {
        Resolver.wrapWithToStringCall($this, right);
      }
      Resolver.checkStorage($this, left);
      node.type = left.type;
      return;
    }
  } else if (kind === 71 || kind === 81 || kind === 76 || kind === 72 || kind === 77 || kind === 73) {
    Resolver.resolveWithTypeContextTransfer($this, left, right);
  } else if (kind === 67 || kind === 68 || kind === 69) {
    if ($this.typeContext !== null && Type.isEnumFlags($this.typeContext)) {
      Resolver.resolveAsExpressionWithTypeContext($this, left, $this.typeContext);
      Resolver.resolveAsExpressionWithTypeContext($this, right, $this.typeContext);
    } else {
      Resolver.resolveWithTypeContextTransfer($this, left, right);
    }
  }
  Resolver.resolveAsExpression($this, left);
  Resolver.resolveAsExpression($this, right);
  var leftType = left.type;
  var rightType = right.type;
  var commonType = null;
  if (leftType === $this.cache.errorType || rightType === $this.cache.errorType) {
    return;
  }
  if (kind === 71 || kind === 81) {
    commonType = TypeCache.commonImplicitType($this.cache, leftType, rightType);
    if (commonType !== null) {
      node.type = $this.cache.boolType;
    }
  } else if (kind === 66 || kind === 85 || kind === 80 || kind === 70) {
    if (Type.isNumeric(leftType, $this.cache) && Type.isNumeric(rightType, $this.cache)) {
      node.type = commonType = TypeCache.commonImplicitType($this.cache, leftType, rightType);
    } else if (kind === 66) {
      if (leftType === $this.cache.stringType && rightType === $this.cache.stringType) {
        node.type = commonType = $this.cache.stringType;
      } else if (leftType === $this.cache.stringType) {
        if (Resolver.wrapWithToStringCall($this, right)) {
          node.type = commonType = $this.cache.stringType;
        } else {
          return;
        }
      } else if (rightType === $this.cache.stringType) {
        if (Resolver.wrapWithToStringCall($this, left)) {
          node.type = commonType = $this.cache.stringType;
        } else {
          return;
        }
      }
    }
  } else if (kind === 82 || kind === 83 || kind === 84) {
    if (Type.isInteger(leftType, $this.cache) && Type.isInteger(rightType, $this.cache)) {
      node.type = commonType = $this.cache.intType;
    }
  } else if (kind === 67 || kind === 68 || kind === 69) {
    if (leftType === rightType && Type.isEnumFlags(leftType)) {
      node.type = commonType = leftType;
    } else if (Type.isInteger(leftType, $this.cache) && Type.isInteger(rightType, $this.cache)) {
      node.type = commonType = $this.cache.intType;
    }
  } else if (kind === 78 || kind === 79) {
    if (leftType === $this.cache.boolType && rightType === $this.cache.boolType) {
      node.type = commonType = $this.cache.boolType;
    }
  } else if (kind === 76 || kind === 72 || kind === 77 || kind === 73) {
    if (Type.isNumeric(leftType, $this.cache) && Type.isNumeric(rightType, $this.cache) || leftType === $this.cache.stringType && rightType === $this.cache.stringType) {
      commonType = TypeCache.commonImplicitType($this.cache, leftType, rightType);
      node.type = $this.cache.boolType;
    }
  }
  if (node.type === $this.cache.errorType) {
    Log.error($this.log, node.range, "No binary operator " + operatorInfo.get(kind).text + " for type \"" + Type.toString(leftType) + "\" and type \"" + Type.toString(rightType) + "\"");
    return;
  }
  if (commonType !== null) {
    Resolver.checkConversion($this, commonType, left, 0);
    Resolver.checkConversion($this, commonType, right, 0);
  }
};
Resolver.resolveTertiaryOperator = function($this, node) {
  var left = node.children[0];
  var middle = node.children[1];
  var right = node.children[2];
  Resolver.resolveAsExpression($this, left);
  Resolver.resolveAsExpression($this, middle);
  Resolver.resolveAsExpression($this, right);
};
function Scope(_0) {
  this.type = null;
  this.locals = null;
  this.lexicalParent = _0;
}
Scope.insertGlobals = function($this, cache) {
  $this.type = cache.globalType;
  Scope.insert($this, cache.voidType.symbol);
};
Scope.linkGlobals = function($this, cache) {
  cache.intType = Scope.findLocal($this, "int").symbol.type;
  cache.boolType = Scope.findLocal($this, "bool").symbol.type;
  cache.floatType = Scope.findLocal($this, "float").symbol.type;
  cache.doubleType = Scope.findLocal($this, "double").symbol.type;
  cache.stringType = Scope.findLocal($this, "string").symbol.type;
  cache.listType = Scope.findLocal($this, "List").symbol.type;
  cache.toStringType = TypeCache.functionType(cache, cache.stringType, []);
};
Scope.insert = function($this, symbol) {
  if ($this.type !== null) {
    Type.addMember($this.type, new Member(symbol));
    return;
  }
  Scope.insertLocal($this, symbol);
};
Scope.insertLocal = function($this, symbol) {
  if ($this.locals === null) {
    $this.locals = new StringMap();
  }
  $this.locals.set(symbol.name, new Member(symbol));
};
Scope.find = function($this, name) {
  var member = Scope.findLocal($this, name);
  return member !== null ? member : $this.lexicalParent !== null ? Scope.find($this.lexicalParent, name) : null;
};
Scope.findLocal = function($this, name) {
  if ($this.locals !== null) {
    var member = $this.locals.getOrDefault(name, null);
    if (member !== null) {
      return member;
    }
  }
  if ($this.type !== null) {
    var member = $this.type.members.getOrDefault(name, null);
    if (member !== null) {
      return member;
    }
  }
  return null;
};
function Symbol(_0, _1) {
  this.flags = 0;
  this.type = null;
  this.node = null;
  this.enclosingSymbol = null;
  this.overriddenMember = null;
  this.constant = null;
  this.identicalMembers = null;
  this.parameters = null;
  this.sortedParameters = null;
  this.uniqueID = (Symbol.nextUniqueID = Symbol.nextUniqueID + 1 | 0) - 1 | 0;
  this.name = _0;
  this.kind = _1;
}
Symbol.sortParametersByDependencies = function($this) {
  $this.sortedParameters = $this.parameters.slice();
  for (var i = 0; i < $this.sortedParameters.length; i = i + 1 | 0) {
    var j = i;
    for (; j < $this.sortedParameters.length; j = j + 1 | 0) {
      var k = i;
      var parameter = $this.sortedParameters[j];
      if (!Type.isParameter(parameter.type)) {
        continue;
      }
      var parameterBound = Type.bound(parameter.type);
      if (parameterBound === null) {
        break;
      }
      for (; k < $this.sortedParameters.length; k = k + 1 | 0) {
        var other = $this.sortedParameters[k];
        if (parameter === other || !Type.isParameter(other.type)) {
          continue;
        }
        if (parameterBound !== null && Type.dependsOnParameter(parameterBound, other)) {
          break;
        }
      }
      if (k === $this.sortedParameters.length) {
        break;
      }
    }
    if (j < $this.sortedParameters.length) {
      var temp = $this.sortedParameters[i];
      $this.sortedParameters[i] = $this.sortedParameters[j];
      $this.sortedParameters[j] = temp;
    }
  }
};
Symbol.isContainedBy = function($this, symbol) {
  return $this.enclosingSymbol === null ? false : $this.enclosingSymbol === symbol || Symbol.isContainedBy($this.enclosingSymbol, symbol);
};
Symbol.fullName = function($this) {
  return $this.enclosingSymbol !== null && $this.kind !== 4 && $this.enclosingSymbol.kind !== 7 ? Symbol.fullName($this.enclosingSymbol) + "." + $this.name : $this.name;
};
Symbol.hasParameters = function($this) {
  return $this.parameters !== null && $this.parameters.length > 0;
};
Symbol.isEnumValue = function($this) {
  return $in.SymbolKind.isVariable($this.kind) && $this.enclosingSymbol !== null && $in.SymbolKind.isEnum($this.enclosingSymbol.kind) && ($this.flags & 16) === 0;
};
Symbol.isObjectMember = function($this) {
  return $this.enclosingSymbol !== null && $in.SymbolKind.isObject($this.enclosingSymbol.kind);
};
Symbol.isEnumMember = function($this) {
  return $this.enclosingSymbol !== null && $in.SymbolKind.isEnum($this.enclosingSymbol.kind);
};
function SymbolMotionPass(_0) {
  this.shadowForSymbol = new IntMap();
  this.resolver = _0;
}
SymbolMotionPass.run = function(resolver) {
  var pass = new SymbolMotionPass(resolver);
  for (var i = 0; i < resolver.allSymbols.length; i = i + 1 | 0) {
    SymbolMotionPass.moveSymbol(pass, resolver.allSymbols[i]);
  }
};
SymbolMotionPass.moveSymbol = function($this, symbol) {
  var enclosingSymbol = symbol.enclosingSymbol;
  if ((symbol.flags & 8192) === 0 && enclosingSymbol !== null && symbol.kind !== 4 && ((enclosingSymbol.flags & 8192) !== 0 || $in.SymbolKind.isFunction(symbol.kind) && $in.SymbolKind.isEnum(enclosingSymbol.kind))) {
    var enclosingType = symbol.enclosingSymbol.type;
    var shadow = SymbolMotionPass.createShadowForSymbol($this, enclosingSymbol);
    var member = enclosingType.members.get(symbol.name);
    enclosingType.members.remove(symbol.name);
    Type.addMember(shadow, member);
    symbol.enclosingSymbol = shadow.symbol;
    var block = shadow.symbol.node.children[1];
    var parent = symbol.node.parent;
    var node = Node.remove(symbol.node);
    if (parent.kind === 6) {
      node = Node.createVariableCluster(Node.withType(new Node(35), symbol.type), [node]);
      if (parent.children.length === 1) {
        Node.remove(parent);
      }
    }
    Node.appendChild(block, node);
  }
};
SymbolMotionPass.createShadowForSymbol = function($this, symbol) {
  var existing = $this.shadowForSymbol.getOrDefault(symbol.uniqueID, null);
  if (existing !== null) {
    return existing;
  }
  var enclosingSymbol = symbol.enclosingSymbol;
  var enclosingType = enclosingSymbol.type;
  var inMember = enclosingType.members.getOrDefault("in", null);
  var inType = null;
  if (inMember !== null) {
    inType = inMember.type;
  } else {
    var inSymbol = Resolver.createSymbol($this.resolver, "in", 8);
    inSymbol.enclosingSymbol = enclosingSymbol;
    inType = inSymbol.type = new Type(inSymbol);
    inMember = new Member(inSymbol);
    inMember.type = inType;
    Type.addMember(enclosingType, inMember);
    inSymbol.node = Node.withSymbol(Node.withChildren(new Node(7), [Node.withSymbol(Node.withContent(new Node(34), new StringContent("in")), inSymbol), Node.withChildren(new Node(2), [])]), inSymbol);
    Node.insertSiblingAfter(symbol.node, inSymbol.node);
  }
  var shadowSymbol = Resolver.createSymbol($this.resolver, symbol.name, 8);
  var shadowType = shadowSymbol.type = new Type(shadowSymbol);
  var shadowMember = new Member(shadowSymbol);
  shadowSymbol.enclosingSymbol = inType.symbol;
  shadowMember.type = shadowType;
  Type.addMember(inType, shadowMember);
  $this.shadowForSymbol.set(symbol.uniqueID, shadowType);
  shadowSymbol.node = Node.withSymbol(Node.withChildren(new Node(7), [Node.withSymbol(Node.withContent(new Node(34), new StringContent(symbol.name)), shadowSymbol), Node.withChildren(new Node(2), [])]), shadowSymbol);
  Node.appendChild(inType.symbol.node.children[1], shadowSymbol.node);
  return shadowType;
};
function Type(_0) {
  this.members = new StringMap();
  this.relevantTypes = null;
  this.substitutions = null;
  this.uniqueID = (Type.nextUniqueID = Type.nextUniqueID + 1 | 0) - 1 | 0;
  this.symbol = _0;
}
Type.$constructor = function($this) {
  if ($this.symbol === null) {
    return null;
  }
  return $this.members.getOrDefault("new", null);
};
Type.hasBaseType = function($this, type) {
  if (Type.isParameter($this)) {
    var upper = Type.bound($this);
    return upper !== null && Type.hasBaseType(upper, type);
  }
  if (!Type.isClass($this) && !Type.isInterface($this)) {
    return false;
  }
  if ($this === type) {
    return true;
  }
  if ($this.relevantTypes !== null) {
    for (var i = 0; i < $this.relevantTypes.length; i = i + 1 | 0) {
      if (Type.hasBaseType($this.relevantTypes[i], type)) {
        return true;
      }
    }
  }
  return false;
};
Type.addMember = function($this, member) {
  $this.members.set(member.symbol.name, member);
};
Type.copyMembersFrom = function($this, other) {
  var otherMembers = other.members.values();
  for (var i = 0; i < otherMembers.length; i = i + 1 | 0) {
    var member = otherMembers[i];
    if (!$this.members.has(member.symbol.name)) {
      $this.members.set(member.symbol.name, member);
    }
  }
};
Type.toString = function($this) {
  if ($this.symbol === null) {
    var text = Type.toString($this.relevantTypes[0]) + " fn(";
    var $arguments = Type.argumentTypes($this);
    for (var i = 0; i < $arguments.length; i = i + 1 | 0) {
      if (i > 0) {
        text += ", ";
      }
      text += Type.toString($arguments[i]);
    }
    return text + ")";
  }
  if (Type.hasParameters($this)) {
    var text = "";
    for (var i = 0; i < $this.symbol.parameters.length; i = i + 1 | 0) {
      if (i > 0) {
        text += ", ";
      }
      text += $this.substitutions !== null ? Type.toString($this.substitutions[i]) : $this.symbol.parameters[i].name;
    }
    return Symbol.fullName($this.symbol) + "<" + text + ">";
  }
  return Symbol.fullName($this.symbol);
};
Type.hasParameters = function($this) {
  return $this.symbol !== null && Symbol.hasParameters($this.symbol);
};
Type.hasRelevantTypes = function($this) {
  return $this.relevantTypes !== null && $this.relevantTypes.length > 0;
};
Type.baseClass = function($this) {
  if (!Type.hasRelevantTypes($this)) {
    return null;
  }
  var first = $this.relevantTypes[0];
  return Type.isClass(first) ? first : null;
};
Type.bound = function($this) {
  return Type.hasRelevantTypes($this) ? $this.relevantTypes[0] : null;
};
Type.dependsOnParameter = function($this, parameter) {
  if ($this.symbol === parameter || Type.hasParameters($this) && $this.symbol.parameters.indexOf(parameter) >= 0 || $this.substitutions !== null && $this.substitutions.indexOf(parameter.type) >= 0) {
    return true;
  }
  if (Type.hasRelevantTypes($this)) {
    for (var i = 0; i < $this.relevantTypes.length; i = i + 1 | 0) {
      var type = $this.relevantTypes[i];
      if (Type.dependsOnParameter(type, parameter)) {
        return true;
      }
    }
  }
  return false;
};
Type.argumentTypes = function($this) {
  return $this.relevantTypes.slice(1, $this.relevantTypes.length);
};
Type.isNamespace = function($this) {
  return $this.symbol !== null && $in.SymbolKind.isNamespace($this.symbol.kind);
};
Type.isEnum = function($this) {
  return $this.symbol !== null && $in.SymbolKind.isEnum($this.symbol.kind);
};
Type.isEnumFlags = function($this) {
  return $this.symbol !== null && $this.symbol.kind === 10;
};
Type.isParameter = function($this) {
  return $this.symbol !== null && $this.symbol.kind === 4;
};
Type.isClass = function($this) {
  return $this.symbol !== null && $this.symbol.kind === 11;
};
Type.isStruct = function($this) {
  return $this.symbol !== null && $this.symbol.kind === 12;
};
Type.isInterface = function($this) {
  return $this.symbol !== null && $this.symbol.kind === 13;
};
Type.isReference = function($this) {
  return Type.isClass($this) || Type.isInterface($this) || $this.symbol === null;
};
Type.isInteger = function($this, cache) {
  return $this === cache.intType || Type.isEnum($this);
};
Type.isReal = function($this, cache) {
  return $this === cache.floatType || $this === cache.doubleType;
};
Type.isNumeric = function($this, cache) {
  return Type.isInteger($this, cache) || Type.isReal($this, cache);
};
function TypeCache() {
  this.globalType = TypeCache.createType(new Symbol("<global>", 7));
  this.nullType = TypeCache.createType(new Symbol("null", 0));
  this.voidType = TypeCache.createType(new Symbol("void", 5));
  this.errorType = TypeCache.createType(new Symbol("<error>", 0));
  this.intType = null;
  this.boolType = null;
  this.floatType = null;
  this.doubleType = null;
  this.stringType = null;
  this.listType = null;
  this.toStringType = null;
  this.hashTable = new IntMap();
}
TypeCache.createType = function(symbol) {
  var type = new Type(symbol);
  symbol.type = type;
  symbol.flags |= 32768;
  return type;
};
TypeCache.commonBaseClass = function(left, right) {
  for (var a = left; a !== null; a = Type.baseClass(a)) {
    for (var b = right; b !== null; b = Type.baseClass(b)) {
      if (a === b) {
        return a;
      }
    }
  }
  return null;
};
TypeCache.computeHashCode = function(symbol, relevantTypes) {
  var seed = symbol === null ? -1 : symbol.type.uniqueID;
  for (var i = 0; i < relevantTypes.length; i = i + 1 | 0) {
    seed = hashCombine(seed, relevantTypes[i].uniqueID);
  }
  return seed;
};
TypeCache.areTypeListsEqual = function(left, right) {
  var n = left.length;
  if (n !== right.length) {
    return false;
  }
  for (var i = 0; i < n; i = i + 1 | 0) {
    if (left[i] !== right[i]) {
      return false;
    }
  }
  return true;
};
TypeCache.substitute = function($this, type, parameters, substitutions) {
  var result = null;
  if (type.symbol === null) {
    result = TypeCache.parameterize($this, null, TypeCache.substituteAll($this, type.relevantTypes, parameters, substitutions));
  } else if (!Type.hasParameters(type)) {
    var index = parameters.indexOf(type.symbol);
    result = index >= 0 ? substitutions[index] : type;
  } else {
    result = TypeCache.parameterize($this, type, TypeCache.substituteAll($this, type.substitutions, parameters, substitutions));
  }
  return result;
};
TypeCache.substituteAll = function($this, types, parameters, substitutions) {
  var results = [];
  for (var i = 0; i < types.length; i = i + 1 | 0) {
    results.push(TypeCache.substitute($this, types[i], parameters, substitutions));
  }
  return results;
};
TypeCache.parameterize = function($this, unparameterized, substitutions) {
  var symbol = unparameterized !== null ? unparameterized.symbol : null;
  if (symbol !== null) {
  }
  var hash = TypeCache.computeHashCode(symbol, substitutions);
  var existingTypes = $this.hashTable.getOrDefault(hash, null);
  if (existingTypes !== null) {
    for (var i = 0; i < existingTypes.length; i = i + 1 | 0) {
      var existing = existingTypes[i];
      if (symbol === existing.symbol && (symbol === null && TypeCache.areTypeListsEqual(substitutions, existing.relevantTypes) || symbol !== null && TypeCache.areTypeListsEqual(substitutions, existing.substitutions))) {
        return existing;
      }
    }
  } else {
    existingTypes = [];
    $this.hashTable.set(hash, existingTypes);
  }
  var type = new Type(symbol);
  if (symbol !== null) {
    type.substitutions = substitutions;
    type.relevantTypes = TypeCache.substituteAll($this, unparameterized.relevantTypes, symbol.parameters, substitutions);
    var members = unparameterized.members.values();
    for (var i = 0; i < members.length; i = i + 1 | 0) {
      var member = members[i];
      var clone = new Member(member.symbol);
      clone.dependency = member.dependency !== null ? member.dependency : member;
      clone.parameterizedType = type;
      var parameterizedType = member.parameterizedType;
      if (parameterizedType !== null) {
        var merged = [];
        for (var j = 0; j < parameterizedType.substitutions.length; j = j + 1 | 0) {
          var parameter = parameterizedType.symbol.parameters[j];
          var index = symbol.parameters.indexOf(parameter);
          merged.push(index >= 0 ? substitutions[index] : TypeCache.substitute($this, parameterizedType.substitutions[j], symbol.parameters, substitutions));
        }
        clone.parameterizedType = TypeCache.parameterize($this, parameterizedType.symbol.type, merged);
      }
      Type.addMember(type, clone);
    }
  } else {
    type.relevantTypes = substitutions;
  }
  existingTypes.push(type);
  return type;
};
TypeCache.functionType = function($this, result, $arguments) {
  $arguments.unshift(result);
  return TypeCache.parameterize($this, null, $arguments);
};
TypeCache.canCastToNumeric = function($this, type) {
  return Type.isNumeric(type, $this) || type === $this.boolType;
};
TypeCache.commonImplicitType = function($this, left, right) {
  if (left === right) {
    return left;
  }
  if (TypeCache.canImplicitlyConvert($this, left, right)) {
    return right;
  }
  if (TypeCache.canImplicitlyConvert($this, right, left)) {
    return left;
  }
  if (Type.isNumeric(left, $this) && Type.isNumeric(right, $this)) {
    return Type.isInteger(left, $this) && Type.isInteger(right, $this) ? $this.intType : left === $this.floatType && right === $this.floatType ? $this.floatType : $this.doubleType;
  }
  if (Type.isClass(left) && Type.isClass(right)) {
    return TypeCache.commonBaseClass(left, right);
  }
  return null;
};
TypeCache.canImplicitlyConvert = function($this, from, to) {
  if (from === to) {
    return true;
  }
  if (from === $this.nullType && Type.isReference(to)) {
    return true;
  }
  if ((Type.isInteger(from, $this) || from === $this.floatType) && to === $this.doubleType) {
    return true;
  }
  if (Type.isEnum(from) && (to === $this.intType || to === $this.doubleType)) {
    return true;
  }
  if (Type.hasBaseType(from, to)) {
    return true;
  }
  return false;
};
TypeCache.canExplicitlyConvert = function($this, from, to) {
  if (TypeCache.canImplicitlyConvert($this, from, to)) {
    return true;
  }
  if (TypeCache.canCastToNumeric($this, from) && TypeCache.canCastToNumeric($this, to)) {
    return true;
  }
  if (Type.hasBaseType(to, from)) {
    return true;
  }
  return false;
};
function LanguageServiceTypeResult(_0, _1, _2, _3, _4) {
  this.declaration = "";
  this.line = _0;
  this.column = _1;
  this.index = _2;
  this.length = _3;
  this.type = _4;
}
function LanguageServiceDiagnostic(_0, _1, _2, _3, _4, _5) {
  this.kind = _0;
  this.text = _1;
  this.line = _2;
  this.column = _3;
  this.index = _4;
  this.length = _5;
}
function LanguageServiceCompletion(_0, _1, _2) {
  this.name = _0;
  this.type = _1;
  this.completion = _2;
}
function LanguageService() {
  this.previousResult = null;
  this.previousSource = null;
}
LanguageService.prototype.typeFromPosition = function(line, column) {
  if (this.previousResult !== null && this.previousResult.program !== null && this.previousSource !== null && column >= 0 && column < Source.contentsOfLine(this.previousSource, line).length && this.previousResult.program.children.length === 2) {
    var index = this.previousSource.lineOffsets[line] + column | 0;
    var previousFile = this.previousResult.program.children[1];
    return service.typeFromPosition(previousFile, this.previousSource, index);
  }
  return null;
};
LanguageService.prototype.checkForDiagnostics = function(input) {
  var options = new CompilerOptions();
  var compiler = new Compiler();
  this.previousSource = new Source("<input>", input);
  options.inputs = [this.previousSource];
  this.previousResult = compiler.compile(options);
  var diagnostics = [];
  for (var i = 0; i < compiler.log.diagnostics.length; i = i + 1 | 0) {
    var diagnostic = compiler.log.diagnostics[i];
    var range = diagnostic.range;
    if (range.source === this.previousSource) {
      var start = Source.indexToLineColumn(range.source, range.start);
      var type = "";
      switch (diagnostic.kind) {
      case 0:
        type = "error";
        break;
      case 1:
        type = "warning";
        break;
      }
      diagnostics.push(new LanguageServiceDiagnostic(type, diagnostic.text, start.line, start.column, range.start, Range.singleLineLength(range)));
    }
  }
  return diagnostics;
};
LanguageService.prototype.checkForCompletions = function(input, line, column) {
  var options = new CompilerOptions();
  var compiler = new Compiler();
  this.previousSource = new Source("<input>", input);
  options.inputs = [this.previousSource];
  this.previousResult = compiler.compile(options);
  if (this.previousResult.program !== null && column >= 0 && column <= Source.contentsOfLine(this.previousSource, line).length && this.previousResult.program.children.length === 2) {
    var index = this.previousSource.lineOffsets[line] + column | 0;
    var previousFile = this.previousResult.program.children[1];
    return service.completionsFromPosition(previousFile, this.previousResult.resolver, this.previousSource, index);
  }
  return null;
};
var service = {};
$in.string.startsWith = function($this, prefix) {
  return $this.length >= prefix.length && $this.slice(0, prefix.length) === prefix;
};
$in.string.repeat = function($this, count) {
  var result = "";
  for (var i = 0; i < count; i = i + 1 | 0) {
    result += $this;
  }
  return result;
};
$in.NodeKind.isNamedBlockDeclaration = function($this) {
  return $this >= 7 && $this <= 13;
};
$in.NodeKind.isNamedDeclaration = function($this) {
  return $this >= 7 && $this <= 18;
};
$in.NodeKind.isObject = function($this) {
  return $this >= 10 && $this <= 12;
};
$in.NodeKind.isFunction = function($this) {
  return $this >= 14 && $this <= 15;
};
$in.NodeKind.isExpression = function($this) {
  return $this >= 34 && $this <= 97;
};
$in.NodeKind.isConstant = function($this) {
  return $this >= 38 && $this <= 43;
};
$in.NodeKind.isCall = function($this) {
  return $this >= 47 && $this <= 48;
};
$in.NodeKind.isUnaryOperator = function($this) {
  return $this >= 58 && $this <= 65;
};
$in.NodeKind.isUnaryStorageOperator = function($this) {
  return $this >= 62 && $this <= 65;
};
$in.NodeKind.isBinaryOperator = function($this) {
  return $this >= 66 && $this <= 96;
};
$in.NodeKind.isBinaryStorageOperator = function($this) {
  return $this >= 86 && $this <= 96;
};
$in.NodeKind.isCast = function($this) {
  return $this >= 52 && $this <= 53;
};
$in.NodeKind.isReal = function($this) {
  return $this >= 41 && $this <= 42;
};
$in.NodeKind.isLoop = function($this) {
  return $this >= 20 && $this <= 23;
};
$in.NodeKind.isStorage = function($this) {
  return $this === 34 || $this === 45;
};
$in.NodeKind.toString = function($this) {
  switch ($this) {
  case 0:
    return "PROGRAM";
  case 1:
    return "FILE";
  case 2:
    return "BLOCK";
  case 3:
    return "NODE_LIST";
  case 4:
    return "CASE";
  case 5:
    return "MEMBER_INITIALIZER";
  case 6:
    return "VARIABLE_CLUSTER";
  case 7:
    return "NAMESPACE";
  case 8:
    return "ENUM";
  case 9:
    return "ENUM_FLAGS";
  case 10:
    return "CLASS";
  case 11:
    return "STRUCT";
  case 12:
    return "INTERFACE";
  case 13:
    return "EXTENSION";
  case 14:
    return "CONSTRUCTOR";
  case 15:
    return "FUNCTION";
  case 16:
    return "VARIABLE";
  case 17:
    return "PARAMETER";
  case 18:
    return "ALIAS";
  case 19:
    return "IF";
  case 20:
    return "FOR";
  case 21:
    return "FOR_EACH";
  case 22:
    return "WHILE";
  case 23:
    return "DO_WHILE";
  case 24:
    return "RETURN";
  case 25:
    return "IMPLICIT_RETURN";
  case 26:
    return "BREAK";
  case 27:
    return "CONTINUE";
  case 28:
    return "ASSERT";
  case 29:
    return "ASSERT_CONST";
  case 30:
    return "EXPRESSION";
  case 31:
    return "SWITCH";
  case 32:
    return "MODIFIER";
  case 33:
    return "USING";
  case 34:
    return "NAME";
  case 35:
    return "TYPE";
  case 36:
    return "THIS";
  case 37:
    return "HOOK";
  case 38:
    return "NULL";
  case 39:
    return "BOOL";
  case 40:
    return "INT";
  case 41:
    return "FLOAT";
  case 42:
    return "DOUBLE";
  case 43:
    return "STRING";
  case 44:
    return "LIST";
  case 45:
    return "DOT";
  case 46:
    return "LET";
  case 47:
    return "CALL";
  case 48:
    return "SUPER_CALL";
  case 49:
    return "ERROR";
  case 50:
    return "SEQUENCE";
  case 51:
    return "PARAMETERIZE";
  case 52:
    return "CAST";
  case 53:
    return "IMPLICIT_CAST";
  case 54:
    return "LAMBDA";
  case 55:
    return "UNTYPED";
  case 56:
    return "VAR";
  case 57:
    return "FUNCTION_TYPE";
  case 58:
    return "NOT";
  case 59:
    return "POSITIVE";
  case 60:
    return "NEGATIVE";
  case 61:
    return "COMPLEMENT";
  case 62:
    return "PREFIX_INCREMENT";
  case 63:
    return "PREFIX_DECREMENT";
  case 64:
    return "POSTFIX_INCREMENT";
  case 65:
    return "POSTFIX_DECREMENT";
  case 66:
    return "ADD";
  case 67:
    return "BITWISE_AND";
  case 68:
    return "BITWISE_OR";
  case 69:
    return "BITWISE_XOR";
  case 70:
    return "DIVIDE";
  case 71:
    return "EQUAL";
  case 72:
    return "GREATER_THAN";
  case 73:
    return "GREATER_THAN_OR_EQUAL";
  case 74:
    return "IN";
  case 75:
    return "INDEX";
  case 76:
    return "LESS_THAN";
  case 77:
    return "LESS_THAN_OR_EQUAL";
  case 78:
    return "LOGICAL_AND";
  case 79:
    return "LOGICAL_OR";
  case 80:
    return "MULTIPLY";
  case 81:
    return "NOT_EQUAL";
  case 82:
    return "REMAINDER";
  case 83:
    return "SHIFT_LEFT";
  case 84:
    return "SHIFT_RIGHT";
  case 85:
    return "SUBTRACT";
  case 86:
    return "ASSIGN";
  case 87:
    return "ASSIGN_ADD";
  case 88:
    return "ASSIGN_BITWISE_AND";
  case 89:
    return "ASSIGN_BITWISE_OR";
  case 90:
    return "ASSIGN_BITWISE_XOR";
  case 91:
    return "ASSIGN_DIVIDE";
  case 92:
    return "ASSIGN_MULTIPLY";
  case 93:
    return "ASSIGN_REMAINDER";
  case 94:
    return "ASSIGN_SHIFT_LEFT";
  case 95:
    return "ASSIGN_SHIFT_RIGHT";
  case 96:
    return "ASSIGN_SUBTRACT";
  case 97:
    return "ASSIGN_INDEX";
  default:
    return "";
  }
};
$in.TargetFormat.shouldRunResolver = function($this) {
  return $this >= 0 && $this <= 1;
};
$in.io.printWithColor = function(color, text) {
  io.setColor(color);
  io.print(text);
  io.setColor(0);
};
$in.SymbolKind.isNamespace = function($this) {
  return $this >= 7 && $this <= 8;
};
$in.SymbolKind.isTypeWithInstances = function($this) {
  return $this >= 9 && $this <= 13;
};
$in.SymbolKind.isEnum = function($this) {
  return $this >= 9 && $this <= 10;
};
$in.SymbolKind.isObject = function($this) {
  return $this >= 11 && $this <= 13;
};
$in.SymbolKind.isType = function($this) {
  return $this >= 4 && $this <= 13;
};
$in.SymbolKind.isFunction = function($this) {
  return $this >= 14 && $this <= 16;
};
$in.SymbolKind.isVariable = function($this) {
  return $this >= 17 && $this <= 19;
};
$in.SymbolKind.isInstance = function($this) {
  return $this === 15 || $this === 19 || $this === 16;
};
$in.SymbolKind.toString = function($this) {
  switch ($this) {
  case 0:
    return "OTHER";
  case 1:
    return "AUTOMATIC";
  case 2:
    return "AMBIGUOUS";
  case 3:
    return "UNMERGED";
  case 4:
    return "PARAMETER";
  case 5:
    return "OTHER_TYPE";
  case 6:
    return "ALIAS";
  case 7:
    return "GLOBAL_NAMESPACE";
  case 8:
    return "NAMESPACE";
  case 9:
    return "ENUM";
  case 10:
    return "ENUM_FLAGS";
  case 11:
    return "CLASS";
  case 12:
    return "STRUCT";
  case 13:
    return "INTERFACE";
  case 14:
    return "GLOBAL_FUNCTION";
  case 15:
    return "INSTANCE_FUNCTION";
  case 16:
    return "CONSTRUCTOR_FUNCTION";
  case 17:
    return "LOCAL_VARIABLE";
  case 18:
    return "GLOBAL_VARIABLE";
  case 19:
    return "INSTANCE_VARIABLE";
  default:
    return "";
  }
};
$in.TokenKind.toString = function($this) {
  switch ($this) {
  case 0:
    return "ALIAS";
  case 1:
    return "ASSERT";
  case 2:
    return "ASSIGN";
  case 3:
    return "ASSIGN_BITWISE_AND";
  case 4:
    return "ASSIGN_BITWISE_OR";
  case 5:
    return "ASSIGN_BITWISE_XOR";
  case 6:
    return "ASSIGN_DIVIDE";
  case 7:
    return "ASSIGN_MINUS";
  case 8:
    return "ASSIGN_MULTIPLY";
  case 9:
    return "ASSIGN_PLUS";
  case 10:
    return "ASSIGN_REMAINDER";
  case 11:
    return "ASSIGN_SHIFT_LEFT";
  case 12:
    return "ASSIGN_SHIFT_RIGHT";
  case 13:
    return "BITWISE_AND";
  case 14:
    return "BITWISE_OR";
  case 15:
    return "BITWISE_XOR";
  case 16:
    return "BREAK";
  case 17:
    return "CASE";
  case 18:
    return "CHARACTER";
  case 19:
    return "CLASS";
  case 20:
    return "COLON";
  case 21:
    return "COMMA";
  case 22:
    return "CONST";
  case 23:
    return "CONTINUE";
  case 24:
    return "DECREMENT";
  case 25:
    return "DEFAULT";
  case 26:
    return "DIVIDE";
  case 27:
    return "DO";
  case 28:
    return "DOT";
  case 29:
    return "DOUBLE";
  case 30:
    return "ELSE";
  case 31:
    return "END_OF_FILE";
  case 32:
    return "ENUM";
  case 33:
    return "EQUAL";
  case 34:
    return "ERROR";
  case 35:
    return "EXPORT";
  case 36:
    return "FALSE";
  case 37:
    return "FINAL";
  case 38:
    return "FLOAT";
  case 39:
    return "FN";
  case 40:
    return "FOR";
  case 41:
    return "GREATER_THAN";
  case 42:
    return "GREATER_THAN_OR_EQUAL";
  case 43:
    return "IDENTIFIER";
  case 44:
    return "IF";
  case 45:
    return "IMPORT";
  case 46:
    return "IN";
  case 47:
    return "INCREMENT";
  case 48:
    return "INLINE";
  case 49:
    return "INTERFACE";
  case 50:
    return "INT_BINARY";
  case 51:
    return "INT_DECIMAL";
  case 52:
    return "INT_HEX";
  case 53:
    return "INT_OCTAL";
  case 54:
    return "IS";
  case 55:
    return "LAMBDA";
  case 56:
    return "LEFT_BRACE";
  case 57:
    return "LEFT_BRACKET";
  case 58:
    return "LEFT_PARENTHESIS";
  case 59:
    return "LESS_THAN";
  case 60:
    return "LESS_THAN_OR_EQUAL";
  case 61:
    return "LET";
  case 62:
    return "LOGICAL_AND";
  case 63:
    return "LOGICAL_OR";
  case 64:
    return "MINUS";
  case 65:
    return "MULTIPLY";
  case 66:
    return "NAMESPACE";
  case 67:
    return "NEW";
  case 68:
    return "NOT";
  case 69:
    return "NOT_EQUAL";
  case 70:
    return "NULL";
  case 71:
    return "OVERRIDE";
  case 72:
    return "PLUS";
  case 73:
    return "PRIVATE";
  case 74:
    return "PROTECTED";
  case 75:
    return "PUBLIC";
  case 76:
    return "QUESTION_MARK";
  case 77:
    return "REMAINDER";
  case 78:
    return "RETURN";
  case 79:
    return "RIGHT_BRACE";
  case 80:
    return "RIGHT_BRACKET";
  case 81:
    return "RIGHT_PARENTHESIS";
  case 82:
    return "SEMICOLON";
  case 83:
    return "SHIFT_LEFT";
  case 84:
    return "SHIFT_RIGHT";
  case 85:
    return "STATIC";
  case 86:
    return "STRING";
  case 87:
    return "STRUCT";
  case 88:
    return "SUPER";
  case 89:
    return "SWITCH";
  case 90:
    return "THIS";
  case 91:
    return "TILDE";
  case 92:
    return "TRUE";
  case 93:
    return "UNTYPED";
  case 94:
    return "USING";
  case 95:
    return "VAR";
  case 96:
    return "VIRTUAL";
  case 97:
    return "WHILE";
  case 98:
    return "WHITESPACE";
  case 99:
    return "YY_INVALID_ACTION";
  case 100:
    return "START_PARAMETER_LIST";
  case 101:
    return "END_PARAMETER_LIST";
  default:
    return "";
  }
};
function createOperatorMap() {
  if (operatorInfo !== null) {
    return;
  }
  operatorInfo = new IntMap();
  operatorInfo.set(58, new OperatorInfo("!", 13, 0));
  operatorInfo.set(59, new OperatorInfo("+", 13, 0));
  operatorInfo.set(60, new OperatorInfo("-", 13, 0));
  operatorInfo.set(61, new OperatorInfo("~", 13, 0));
  operatorInfo.set(62, new OperatorInfo("++", 13, 0));
  operatorInfo.set(63, new OperatorInfo("--", 13, 0));
  operatorInfo.set(64, new OperatorInfo("++", 14, 0));
  operatorInfo.set(65, new OperatorInfo("--", 14, 0));
  operatorInfo.set(66, new OperatorInfo("+", 11, 1));
  operatorInfo.set(67, new OperatorInfo("&", 7, 1));
  operatorInfo.set(68, new OperatorInfo("|", 5, 1));
  operatorInfo.set(69, new OperatorInfo("^", 6, 1));
  operatorInfo.set(70, new OperatorInfo("/", 12, 1));
  operatorInfo.set(71, new OperatorInfo("==", 8, 1));
  operatorInfo.set(72, new OperatorInfo(">", 9, 1));
  operatorInfo.set(73, new OperatorInfo(">=", 9, 1));
  operatorInfo.set(74, new OperatorInfo("in", 9, 1));
  operatorInfo.set(75, new OperatorInfo("[]", 15, 1));
  operatorInfo.set(76, new OperatorInfo("<", 9, 1));
  operatorInfo.set(77, new OperatorInfo("<=", 9, 1));
  operatorInfo.set(78, new OperatorInfo("&&", 4, 1));
  operatorInfo.set(79, new OperatorInfo("||", 3, 1));
  operatorInfo.set(80, new OperatorInfo("*", 12, 1));
  operatorInfo.set(81, new OperatorInfo("!=", 8, 1));
  operatorInfo.set(82, new OperatorInfo("%", 12, 1));
  operatorInfo.set(83, new OperatorInfo("<<", 10, 1));
  operatorInfo.set(84, new OperatorInfo(">>", 10, 1));
  operatorInfo.set(85, new OperatorInfo("-", 11, 1));
  operatorInfo.set(86, new OperatorInfo("=", 2, 2));
  operatorInfo.set(87, new OperatorInfo("+=", 2, 2));
  operatorInfo.set(88, new OperatorInfo("&=", 2, 2));
  operatorInfo.set(89, new OperatorInfo("|=", 2, 2));
  operatorInfo.set(90, new OperatorInfo("^=", 2, 2));
  operatorInfo.set(91, new OperatorInfo("/=", 2, 2));
  operatorInfo.set(92, new OperatorInfo("*=", 2, 2));
  operatorInfo.set(93, new OperatorInfo("%=", 2, 2));
  operatorInfo.set(94, new OperatorInfo("<<=", 2, 2));
  operatorInfo.set(95, new OperatorInfo(">>=", 2, 2));
  operatorInfo.set(96, new OperatorInfo("-=", 2, 2));
}
json.dump = function(node) {
  var visitor = new json.DumpVisitor();
  json.DumpVisitor.visit(visitor, node);
  return visitor.result;
};
lisp.dump = function(node) {
  var visitor = new lisp.DumpVisitor();
  lisp.DumpVisitor.visit(visitor, node);
  return visitor.result;
};
xml.dump = function(node) {
  var visitor = new xml.DumpVisitor();
  xml.DumpVisitor.visit(visitor, node);
  return visitor.result;
};
function hashCombine(left, right) {
  return left ^ ((right - 1640531527 | 0) + (left << 6) | 0) + (left >> 2);
}
function logBase2(value) {
  if (value > 0 && (value & value - 1) === 0) {
    var result = 0;
    while ((value >>= 1) > 0) {
      result = result + 1 | 0;
    }
    return result;
  }
  return -1;
}
function parseHexCharacter(c) {
  if (c >= 48 && c <= 57) {
    return c - 48 | 0;
  }
  if (c >= 65 && c <= 70) {
    return (c - 65 | 0) + 10 | 0;
  }
  if (c >= 97 && c <= 102) {
    return (c - 97 | 0) + 10 | 0;
  }
  return -1;
}
function parseStringLiteral(log, range, text) {
  var isValidString = true;
  var result = "";
  var start = 1;
  var i = 1;
  while ((i + 1 | 0) < text.length) {
    var c = text.charCodeAt(i);
    if (c === 92) {
      result += text.slice(start, i);
      var escape = i = i + 1 | 0;
      if ((i + 1 | 0) < text.length) {
        c = text.charCodeAt((i = i + 1 | 0) - 1 | 0);
        if (c === 110) {
          result += "\n";
          start = i;
          continue;
        } else if (c === 114) {
          result += "\r";
          start = i;
          continue;
        } else if (c === 116) {
          result += "\t";
          start = i;
          continue;
        } else if (c === 101) {
          result += "\x1B";
          start = i;
          continue;
        } else if (c === 48) {
          result += "\0";
          start = i;
          continue;
        } else if (c === 92 || c === 34 || c === 39) {
          result += String.fromCharCode(c);
          start = i;
          continue;
        } else if (c === 120) {
          var c0 = (i + 1 | 0) < text.length ? parseHexCharacter(text.charCodeAt((i = i + 1 | 0) - 1 | 0)) : -1;
          var c1 = (i + 1 | 0) < text.length ? parseHexCharacter(text.charCodeAt((i = i + 1 | 0) - 1 | 0)) : -1;
          if (c0 !== -1 && c1 !== -1) {
            result += String.fromCharCode(c0 << 4 | c1);
            start = i;
            continue;
          }
        }
      }
      Log.error(log, new Range(range.source, range.start + escape | 0, range.start + i | 0), "Invalid escape sequence " + firstLineOf("\"" + text.slice(escape, i) + "\""));
      isValidString = false;
    } else {
      i = i + 1 | 0;
    }
  }
  result += text.slice(start, i);
  return isValidString ? new StringContent(result) : null;
}
function quoteString(text, quote) {
  var result = "";
  var quoteString = String.fromCharCode(quote);
  result += quoteString;
  var start = 0;
  var i = 0;
  for (i = 0; i < text.length; i = i + 1 | 0) {
    var c = text.charCodeAt(i);
    if (c === quote) {
      result += text.slice(start, i) + "\\" + quoteString;
    } else if (c === 10) {
      result += text.slice(start, i) + "\\n";
    } else if (c === 13) {
      result += text.slice(start, i) + "\\r";
    } else if (c === 9) {
      result += text.slice(start, i) + "\\t";
    } else if (c === 0) {
      result += text.slice(start, i) + "\\0";
    } else if (c === 92) {
      result += text.slice(start, i) + "\\\\";
    } else if (c < 32 || c >= 127 && c <= 255) {
      result += text.slice(start, i) + "\\x" + HEX[c >> 4] + HEX[c & 15];
    } else {
      continue;
    }
    start = i + 1 | 0;
  }
  result += text.slice(start, i) + quoteString;
  return result;
}
function replace(text, before, after) {
  var result = "";
  var index = 0;
  while ((index = text.indexOf(before)) !== -1) {
    result += text.slice(0, index) + after;
    text = text.slice(index + before.length | 0, text.length);
  }
  return result + text;
}
function splitPath(path) {
  var slashIndex = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
  return slashIndex === -1 ? new SplitPath(".", path) : new SplitPath(path.slice(0, slashIndex), path.slice(slashIndex + 1 | 0, path.length));
}
function bytesToString(bytes) {
  if (bytes === 1) {
    return "1 byte";
  }
  if (bytes < 1024) {
    return bytes + " bytes";
  }
  if (bytes < 1048576) {
    return Math.round(bytes / 1024 * 10) / 10 + "kb";
  }
  if (bytes < 1073741824) {
    return Math.round(bytes / 1048576 * 10) / 10 + "mb";
  }
  return Math.round(bytes / 1073741824 * 10) / 10 + "gb";
}
frontend.printError = function(text) {
  $in.io.printWithColor(91, "error: ");
  $in.io.printWithColor(1, text + "\n");
};
frontend.printNote = function(text) {
  $in.io.printWithColor(90, "note: ");
  $in.io.printWithColor(1, text + "\n");
};
frontend.printWarning = function(text) {
  $in.io.printWithColor(95, "warning: ");
  $in.io.printWithColor(1, text + "\n");
};
frontend.printUsage = function() {
  $in.io.printWithColor(92, "\nusage: ");
  $in.io.printWithColor(1, "skewc [flags] [inputs]\n");
  io.print("\n  --help (-h)        Print this message.\n\n  --verbose          Print out useful information about the compilation.\n\n  --target=___       Set the target language. Valid target languages: none, js,\n                     lisp-ast, json-ast, and xml-ast.\n\n  --output-file=___  Combines all output into a single file.\n\n  --prepend-file=___ Prepend the contents of this file to the output. Provide\n                     this flag multiple times to prepend multiple files.\n\n  --append-file=___  Append the contents of this file to the output. Provide\n                     this flag multiple times to append multiple files.\n\n  --js-source-map    Generate a source map when targeting JavaScript. The source\n                     map will be saved with the \".map\" extension in the same\n                     directory as the main output file.\n\n");
};
frontend.afterEquals = function(text) {
  var equals = text.indexOf("=");
  return text.slice(equals + 1 | 0, text.length);
};
frontend.readSources = function(files) {
  var result = [];
  for (var i = 0; i < files.length; i = i + 1 | 0) {
    var file = files[i];
    var source = io.readFile(file);
    if (source === null) {
      frontend.printError("Could not read from " + quoteString(file, 34));
      return null;
    }
    result.push(source);
  }
  return result;
};
frontend.main = function(args) {
  var inputs = [];
  var prepend = [];
  var append = [];
  var flags = new frontend.Flags();
  for (var i = 0; i < args.length; i = i + 1 | 0) {
    var arg = args[i];
    if (arg.length === 0) {
      continue;
    }
    if (arg.charCodeAt(0) !== 45) {
      inputs.push(arg);
    } else if (arg === "-help" || arg === "--help" || arg === "-h") {
      frontend.printUsage();
      return 0;
    } else if (arg === "-verbose" || arg === "--verbose") {
      flags.verbose = true;
    } else if (arg === "-optimize" || arg === "--optimize") {
      flags.optimize = true;
    } else if (arg === "-js-source-map" || arg === "--js-source-map") {
      flags.jsSourceMap = true;
    } else if ($in.string.startsWith(arg, "-target=") || $in.string.startsWith(arg, "--target=")) {
      flags.target = frontend.afterEquals(arg);
    } else if ($in.string.startsWith(arg, "-output-file=") || $in.string.startsWith(arg, "--output-file=")) {
      flags.outputFile = frontend.afterEquals(arg);
    } else if ($in.string.startsWith(arg, "-prepend-file=") || $in.string.startsWith(arg, "--prepend-file=")) {
      prepend.push(frontend.afterEquals(arg));
    } else if ($in.string.startsWith(arg, "-append-file=") || $in.string.startsWith(arg, "--append-file=")) {
      append.push(frontend.afterEquals(arg));
    } else {
      frontend.printError("Unknown flag " + quoteString(arg, 34));
      return 1;
    }
    continue;
  }
  if (inputs.length === 0) {
    frontend.printError("Missing input files");
    return 1;
  }
  var target = 0;
  if (flags.target === "") {
    frontend.printError("Set the target language with \"--target=___\"");
    return 1;
  }
  switch (flags.target) {
  case "none":
    target = 0;
    break;
  case "js":
    target = 1;
    break;
  case "lisp-ast":
    target = 2;
    break;
  case "json-ast":
    target = 3;
    break;
  case "xml-ast":
    target = 4;
    break;
  default:
    frontend.printError("Unknown target language " + quoteString(flags.target, 34));
    return 1;
  }
  var options = new CompilerOptions();
  var optimizeJS = flags.optimize && target === 1;
  options.targetFormat = target;
  options.removeAsserts = flags.optimize;
  options.foldAllConstants = optimizeJS;
  options.inlineAllFunctions = optimizeJS;
  options.convertAllInstanceToStatic = optimizeJS;
  options.outputFile = flags.outputFile;
  options.jsSourceMap = flags.jsSourceMap && target === 1;
  options.inputs = frontend.readSources(inputs);
  if (options.inputs === null) {
    return 1;
  }
  options.prepend = frontend.readSources(prepend);
  if (options.prepend === null) {
    return 1;
  }
  options.append = frontend.readSources(append);
  if (options.append === null) {
    return 1;
  }
  var compiler = new Compiler();
  var result = compiler.compile(options);
  var log = compiler.log;
  for (var i = 0; i < log.diagnostics.length; i = i + 1 | 0) {
    var diagnostic = log.diagnostics[i];
    if (diagnostic.range.source !== null) {
      $in.io.printWithColor(1, Range.locationString(diagnostic.range) + ": ");
    }
    switch (diagnostic.kind) {
    case 1:
      frontend.printWarning(diagnostic.text);
      break;
    case 0:
      frontend.printError(diagnostic.text);
      break;
    }
    if (diagnostic.range.source !== null) {
      var formatted = Range.format(diagnostic.range, io.terminalWidth);
      io.print(formatted.line + "\n");
      $in.io.printWithColor(92, formatted.range + "\n");
    }
    if (diagnostic.noteRange.source !== null) {
      $in.io.printWithColor(1, Range.locationString(diagnostic.noteRange) + ": ");
      frontend.printNote(diagnostic.noteText);
      var formatted = Range.format(diagnostic.noteRange, io.terminalWidth);
      io.print(formatted.line + "\n");
      $in.io.printWithColor(92, formatted.range + "\n");
    }
  }
  var hasErrors = log.errorCount > 0;
  var hasWarnings = log.warningCount > 0;
  var summary = "";
  if (hasWarnings) {
    summary += log.warningCount + (log.warningCount === 1 ? " warning" : " warnings");
    if (hasErrors) {
      summary += " and ";
    }
  }
  if (hasErrors) {
    summary += log.errorCount + (log.errorCount === 1 ? " error" : " errors");
  }
  if (hasWarnings || hasErrors) {
    io.print(summary + " generated\n");
  }
  if (flags.verbose) {
    io.print(Compiler.statistics(compiler, result) + "\n");
  }
  if (hasErrors) {
    return 1;
  }
  for (var i = 0; i < result.outputs.length; i = i + 1 | 0) {
    var output = result.outputs[i];
    if (output.name === "") {
      io.print(output.contents);
      continue;
    }
    if (!io.writeFile(output.name, output.contents)) {
      frontend.printError("Could not write to " + quoteString(output.name, 34));
      return 1;
    }
  }
  return 0;
};
function tokenize(log, source) {
  var tokens = [];
  var text = source.contents;
  var text_length = text.length;
  var yy_last_accepting_state = 0;
  var yy_last_accepting_cpos = 0;
  var yy_cp = 0;
  while (yy_cp < text_length) {
    var yy_current_state = 1;
    var yy_bp = yy_cp;
    while (yy_current_state !== 262) {
      if (yy_cp >= text_length) {
        break;
      }
      var c = text.charCodeAt(yy_cp);
      var index = c < 127 ? c : 127;
      var yy_c = yy_ec[index];
      if (yy_accept[yy_current_state] !== 99) {
        yy_last_accepting_state = yy_current_state;
        yy_last_accepting_cpos = yy_cp;
      }
      while (yy_chk[yy_base[yy_current_state] + yy_c | 0] !== yy_current_state) {
        yy_current_state = yy_def[yy_current_state];
        if (yy_current_state >= 263) {
          yy_c = yy_meta[yy_c];
        }
      }
      yy_current_state = yy_nxt[yy_base[yy_current_state] + yy_c | 0];
      yy_cp = yy_cp + 1 | 0;
    }
    var yy_act = yy_accept[yy_current_state];
    while (yy_act === 99) {
      yy_cp = yy_last_accepting_cpos;
      yy_current_state = yy_last_accepting_state;
      yy_act = yy_accept[yy_current_state];
    }
    if (yy_act === 98) {
      continue;
    } else if (yy_act === 34) {
      Log.error(log, new Range(source, yy_bp, yy_cp), "Syntax error " + quoteString(text.slice(yy_bp, yy_cp), 34));
      break;
    } else if (yy_act !== 31) {
      tokens.push(new Token(new Range(source, yy_bp, yy_cp), yy_act, text.slice(yy_bp, yy_cp)));
    }
  }
  tokens.push(new Token(new Range(source, text_length, text_length), 31, ""));
  prepareTokens(tokens);
  return tokens;
}
function prepareTokens(tokens) {
  var stack = [];
  for (var i = 0; i < tokens.length; i = i + 1 | 0) {
    var token = tokens[i];
    var tokenKind = token.kind;
    var tokenStartsWithGreaterThan = token.text.length > 0 && token.text.charCodeAt(0) === 62;
    while (stack.length > 0) {
      var top = tokens[stack[stack.length - 1 | 0]];
      var topKind = top.kind;
      if (topKind === 59 && tokenKind !== 59 && tokenKind !== 43 && tokenKind !== 54 && tokenKind !== 21 && tokenKind !== 28 && tokenKind !== 39 && tokenKind !== 58 && tokenKind !== 81 && !tokenStartsWithGreaterThan) {
        stack.pop();
      } else {
        break;
      }
    }
    if (tokenKind === 58 || tokenKind === 56 || tokenKind === 57 || tokenKind === 59) {
      stack.push(i);
      continue;
    }
    if (tokenKind === 81 || tokenKind === 79 || tokenKind === 80 || tokenStartsWithGreaterThan) {
      while (stack.length > 0) {
        var top = tokens[stack[stack.length - 1 | 0]];
        var topKind = top.kind;
        if (tokenStartsWithGreaterThan && topKind !== 59) {
          break;
        }
        stack.pop();
        if (topKind === 59) {
          if (!tokenStartsWithGreaterThan) {
            continue;
          }
          if (tokenKind !== 41) {
            var range = token.range;
            var start = range.start;
            var text = token.text.slice(1, token.text.length);
            var kind = tokenKind === 84 ? 41 : tokenKind === 42 ? 2 : tokenKind === 12 ? 42 : 34;
            tokens.splice(i + 1 | 0, 0, new Token(new Range(range.source, start + 1 | 0, range.end), kind, text));
            token.range = new Range(range.source, start, start + 1 | 0);
            token.text = ">";
          }
          top.kind = 100;
          token.kind = 101;
        }
        break;
      }
    }
  }
}
function firstLineOf(text) {
  var index = text.indexOf("\n");
  return index < 0 ? text : text.slice(0, index);
}
function syntaxErrorUnexpectedToken(log, token) {
  Log.error(log, token.range, "Unexpected " + $in.TokenKind.toString(token.kind));
}
function syntaxErrorExpectedToken(log, found, expected) {
  Log.error(log, found.range, "Expected " + $in.TokenKind.toString(expected) + " but found " + $in.TokenKind.toString(found.kind));
}
function scanForToken(context, kind, tokenScan) {
  if (ParserContext.expect(context, kind)) {
    return true;
  }
  while (ParserContext.current(context).kind !== 31) {
    switch (ParserContext.current(context).kind) {
    case 81:
    case 80:
    case 79:
      return ParserContext.eat(context, kind);
    case 82:
      if (tokenScan === 1) {
        return ParserContext.eat(context, kind);
      }
      break;
    case 0:
    case 1:
    case 16:
    case 19:
    case 23:
    case 27:
    case 32:
    case 35:
    case 37:
    case 40:
    case 44:
    case 45:
    case 48:
    case 49:
    case 66:
    case 71:
    case 73:
    case 74:
    case 75:
    case 78:
    case 85:
    case 87:
    case 89:
    case 94:
    case 96:
    case 97:
      if (tokenScan === 1) {
        return true;
      }
      break;
    }
    ParserContext.next(context);
  }
  return false;
}
function parseGroup(context, allowLambda) {
  var token = ParserContext.current(context);
  if (!ParserContext.expect(context, 58)) {
    return null;
  }
  if (allowLambda === 0 || !ParserContext.eat(context, 81)) {
    var value = Pratt.parseIgnoringParselet(pratt, context, 0, null);
    scanForToken(context, 81, 1);
    return value;
  }
  if (ParserContext.current(context).kind !== 55) {
    ParserContext.expect(context, 55);
    return Node.withRange(new Node(49), ParserContext.spanSince(context, token.range));
  }
  return Node.withRange(Node.withChildren(new Node(50), []), ParserContext.spanSince(context, token.range));
}
function parseName(context) {
  var token = ParserContext.current(context);
  if (!ParserContext.expect(context, 43)) {
    return null;
  }
  return Node.withRange(Node.withContent(new Node(34), new StringContent(token.text)), token.range);
}
function parseBlock(context, hint) {
  var token = ParserContext.current(context);
  if (!ParserContext.expect(context, 56)) {
    return null;
  }
  var statements = parseStatements(context, hint);
  scanForToken(context, 79, 0);
  return Node.withRange(Node.withChildren(new Node(2), statements), ParserContext.spanSince(context, token.range));
}
function parseBlockOrStatement(context, hint) {
  if (ParserContext.current(context).kind === 56) {
    return parseBlock(context, hint);
  }
  var statement = parseStatement(context, hint);
  if (statement === null) {
    return null;
  }
  return Node.withRange(Node.withChildren(new Node(2), [statement]), statement.range);
}
function parseLambdaBlock(context) {
  if (ParserContext.current(context).kind === 56) {
    return parseBlock(context, 0);
  }
  if (ParserContext.current(context).kind === 81 || ParserContext.current(context).kind === 21 || ParserContext.current(context).kind === 82) {
    return Node.withChildren(new Node(2), []);
  }
  var value = Pratt.parseIgnoringParselet(pratt, context, 1, null);
  return Node.withRange(Node.withChildren(new Node(2), [Node.withRange(Node.withChildren(new Node(25), [value]), value.range)]), value.range);
}
function parseCaseStatement(context) {
  var token = ParserContext.current(context);
  var values = [];
  if (!ParserContext.eat(context, 25)) {
    if (!ParserContext.expect(context, 17)) {
      return null;
    }
    do {
      if (ParserContext.current(context).kind === 56) {
        ParserContext.unexpectedToken(context);
        values.push(new Node(49));
        break;
      }
      values.push(Pratt.parseIgnoringParselet(pratt, context, 1, null));
    } while (ParserContext.eat(context, 21));
  }
  var block = parseBlock(context, 0);
  if (block === null) {
    return null;
  }
  return Node.withRange(Node.createCase(values, block), ParserContext.spanSince(context, token.range));
}
function parseStatements(context, hint) {
  var statements = [];
  while (ParserContext.current(context).kind !== 79 && ParserContext.current(context).kind !== 31) {
    if (hint === 1) {
      var declaration = parseEnumValueDeclaration(context);
      if (declaration === null) {
        break;
      }
      statements.push(declaration);
      if (!ParserContext.eat(context, 21)) {
        break;
      }
    } else {
      var statement = hint === 3 ? parseCaseStatement(context) : parseStatement(context, hint);
      if (statement === null) {
        break;
      }
      statements.push(statement);
    }
  }
  return statements;
}
function parseArgumentVariables(context) {
  var token = ParserContext.current(context);
  var $arguments = [];
  if (!ParserContext.expect(context, 58)) {
    return null;
  }
  while (ParserContext.current(context).kind !== 81) {
    if ($arguments.length > 0 && !ParserContext.expect(context, 21)) {
      break;
    }
    var type = Pratt.parseIgnoringParselet(pratt, context, 14, null);
    var name = parseName(context);
    if (name === null) {
      break;
    }
    $arguments.push(Node.withRange(Node.withChildren(new Node(16), [name, type, null]), Range.span(type.range, name.range)));
  }
  scanForToken(context, 81, 0);
  return Node.withRange(Node.withChildren(new Node(3), $arguments), ParserContext.spanSince(context, token.range));
}
function parseEnumValueDeclaration(context) {
  var name = parseName(context);
  if (name === null) {
    return null;
  }
  var value = ParserContext.eat(context, 2) ? Pratt.parseIgnoringParselet(pratt, context, 1, null) : null;
  return Node.withRange(Node.withChildren(new Node(16), [name, null, value]), ParserContext.spanSince(context, name.range));
}
function parseParameter(context) {
  var token = ParserContext.current(context);
  var name = parseName(context);
  if (name === null) {
    return null;
  }
  var bound = ParserContext.eat(context, 54) ? Pratt.parseIgnoringParselet(pratt, context, 1, null) : null;
  return Node.withRange(Node.withChildren(new Node(17), [name, bound]), ParserContext.spanSince(context, token.range));
}
function parseParameters(context) {
  var token = ParserContext.current(context);
  var parameters = [];
  if (!ParserContext.eat(context, 100)) {
    return null;
  }
  while (parameters.length === 0 || ParserContext.current(context).kind !== 101) {
    if (parameters.length > 0 && !ParserContext.expect(context, 21)) {
      break;
    }
    var parameter = parseParameter(context);
    if (parameter === null) {
      break;
    }
    parameters.push(parameter);
  }
  scanForToken(context, 101, 1);
  return Node.withRange(Node.withChildren(new Node(3), parameters), ParserContext.spanSince(context, token.range));
}
function parseArgumentList(context, left, right, comma) {
  var values = [];
  if (!ParserContext.expect(context, left)) {
    return values;
  }
  while (ParserContext.current(context).kind !== right) {
    if (comma === 0 && values.length > 0 && !ParserContext.expect(context, 21)) {
      break;
    }
    var value = Pratt.parseIgnoringParselet(pratt, context, 1, null);
    values.push(value);
    if (value.kind === 49 || comma === 1 && ParserContext.current(context).kind !== right && !ParserContext.expect(context, 21)) {
      break;
    }
  }
  scanForToken(context, right, 1);
  return values;
}
function parseTypeList(context, end) {
  var token = ParserContext.current(context);
  var types = [];
  while (types.length === 0 || ParserContext.current(context).kind !== end) {
    if (ParserContext.current(context).kind === 56) {
      ParserContext.unexpectedToken(context);
      break;
    }
    if (types.length > 0 && !ParserContext.eat(context, 21)) {
      ParserContext.expect(context, end);
      break;
    }
    if (ParserContext.current(context).kind === 56) {
      ParserContext.unexpectedToken(context);
      break;
    }
    types.push(Pratt.parseIgnoringParselet(pratt, context, 14, null));
  }
  return types;
}
function parseObject(context, kind) {
  var token = ParserContext.next(context);
  var name = parseName(context);
  if (name === null) {
    return null;
  }
  var parameters = parseParameters(context);
  var bases = ParserContext.eat(context, 20) ? Node.withChildren(new Node(3), parseTypeList(context, 56)) : null;
  var block = parseBlock(context, 2);
  if (block === null) {
    return null;
  }
  return Node.withRange(Node.withChildren(new Node(kind), [name, block, bases, parameters]), ParserContext.spanSince(context, token.range));
}
function parseNestedNamespaceBlock(context) {
  if (!ParserContext.eat(context, 28)) {
    return parseBlock(context, 0);
  }
  var name = parseName(context);
  var block = parseNestedNamespaceBlock(context);
  if (block === null) {
    return null;
  }
  var range = ParserContext.spanSince(context, (name !== null ? name : block).range);
  return Node.withRange(Node.withChildren(new Node(2), [Node.withRange(Node.withChildren(new Node(7), [name, block]), range)]), range);
}
function parseNamespace(context) {
  var token = ParserContext.next(context);
  var name = parseName(context);
  if (name === null) {
    return null;
  }
  var block = parseNestedNamespaceBlock(context);
  if (block === null) {
    return null;
  }
  return Node.withRange(Node.withChildren(new Node(7), [name, block]), ParserContext.spanSince(context, token.range));
}
function parseConstructor(context, hint) {
  if (hint !== 2) {
    ParserContext.unexpectedToken(context);
    return null;
  }
  var token = ParserContext.next(context);
  var name = Node.withRange(Node.withContent(new Node(34), new StringContent(token.text)), token.range);
  var $arguments = parseArgumentVariables(context);
  if ($arguments === null) {
    return null;
  }
  var superInitializer = null;
  var memberInitializers = null;
  if (ParserContext.eat(context, 20)) {
    if (ParserContext.current(context).kind === 88) {
      superInitializer = parseSuperCall(context);
    }
    if (superInitializer === null || ParserContext.eat(context, 21)) {
      var values = [];
      var first = ParserContext.current(context);
      do {
        var member = parseName(context);
        if (member === null) {
          break;
        }
        if (!ParserContext.expect(context, 2)) {
          break;
        }
        var value = Pratt.parseIgnoringParselet(pratt, context, 1, null);
        values.push(Node.withRange(Node.withChildren(new Node(5), [member, value]), ParserContext.spanSince(context, member.range)));
      } while (ParserContext.eat(context, 21));
      memberInitializers = Node.withRange(Node.withChildren(new Node(3), values), ParserContext.spanSince(context, first.range));
    }
  }
  var block = null;
  if (!ParserContext.eat(context, 82)) {
    block = parseBlock(context, 0);
    if (block === null) {
      return null;
    }
  }
  return Node.withRange(Node.withChildren(new Node(14), [name, $arguments, block, superInitializer, memberInitializers]), ParserContext.spanSince(context, token.range));
}
function parseExpression(context) {
  if (ParserContext.current(context).kind === 56) {
    ParserContext.unexpectedToken(context);
    return null;
  }
  var token = ParserContext.current(context);
  var value = Pratt.parseIgnoringParselet(pratt, context, 0, null);
  if (!scanForToken(context, 82, 1) && ParserContext.current(context).range.start === token.range.start) {
    ParserContext.next(context);
  }
  return Node.withRange(Node.withChildren(new Node(30), [value]), ParserContext.spanSince(context, token.range));
}
function parseModifier(context, hint, flag) {
  var token = ParserContext.next(context);
  var name = Node.withRange(Node.withContent(new Node(34), new StringContent(token.text)), token.range);
  var block = parseBlockOrStatement(context, hint);
  if (block === null) {
    return null;
  }
  return Node.withRange(Node.createModifier(name, Node.removeChildren(block)), ParserContext.spanSince(context, token.range));
}
function parseReturn(context) {
  var token = ParserContext.next(context);
  var value = null;
  if (!ParserContext.eat(context, 82)) {
    value = Pratt.parseIgnoringParselet(pratt, context, 0, null);
    scanForToken(context, 82, 1);
  }
  return Node.withRange(Node.withChildren(new Node(24), [value]), ParserContext.spanSince(context, token.range));
}
function parseBreak(context) {
  var token = ParserContext.next(context);
  ParserContext.expect(context, 82);
  return Node.withRange(new Node(26), ParserContext.spanSince(context, token.range));
}
function parseContinue(context) {
  var token = ParserContext.next(context);
  ParserContext.expect(context, 82);
  return Node.withRange(new Node(27), ParserContext.spanSince(context, token.range));
}
function parseAssert(context) {
  var token = ParserContext.next(context);
  var isConst = ParserContext.eat(context, 22);
  var value = Pratt.parseIgnoringParselet(pratt, context, 0, null);
  scanForToken(context, 82, 1);
  return Node.withRange(Node.withChildren(new Node(isConst ? 29 : 28), [value]), ParserContext.spanSince(context, token.range));
}
function parseSwitch(context) {
  var token = ParserContext.next(context);
  var value = parseGroup(context, 0);
  if (value === null) {
    return null;
  }
  var block = parseBlock(context, 3);
  if (block === null) {
    return null;
  }
  return Node.withRange(Node.createSwitch(value, Node.removeChildren(block)), ParserContext.spanSince(context, token.range));
}
function parseWhile(context) {
  var token = ParserContext.next(context);
  var value = parseGroup(context, 0);
  if (value === null) {
    return null;
  }
  var block = parseBlockOrStatement(context, 0);
  if (block === null) {
    return null;
  }
  return Node.withRange(Node.withChildren(new Node(22), [value, block]), ParserContext.spanSince(context, token.range));
}
function parseDoWhile(context) {
  var token = ParserContext.next(context);
  var block = parseBlockOrStatement(context, 0);
  if (block === null) {
    return null;
  }
  if (!ParserContext.expect(context, 97)) {
    return null;
  }
  var value = parseGroup(context, 0);
  scanForToken(context, 82, 1);
  return Node.withRange(Node.withChildren(new Node(23), [value, block]), ParserContext.spanSince(context, token.range));
}
function parseIf(context) {
  var token = ParserContext.next(context);
  var value = parseGroup(context, 0);
  if (value === null) {
    return null;
  }
  var trueBlock = parseBlockOrStatement(context, 0);
  if (trueBlock === null) {
    return null;
  }
  var falseBlock = null;
  if (ParserContext.eat(context, 30)) {
    falseBlock = parseBlockOrStatement(context, 0);
    if (falseBlock === null) {
      return null;
    }
  }
  return Node.withRange(Node.withChildren(new Node(19), [value, trueBlock, falseBlock]), ParserContext.spanSince(context, token.range));
}
function parseExtension(context) {
  var token = ParserContext.next(context);
  var name = parseName(context);
  if (name === null) {
    return null;
  }
  var bases = ParserContext.eat(context, 20) ? Node.withChildren(new Node(3), parseTypeList(context, 56)) : null;
  var block = parseBlock(context, 2);
  if (block === null) {
    return null;
  }
  return Node.withRange(Node.withChildren(new Node(13), [name, block, bases]), ParserContext.spanSince(context, token.range));
}
function parseEnum(context) {
  var token = ParserContext.next(context);
  var isFlags = false;
  if (ParserContext.current(context).kind === 43 && ParserContext.current(context).text === "flags") {
    isFlags = true;
    ParserContext.next(context);
  }
  var name = parseName(context);
  if (name === null) {
    return null;
  }
  var block = parseBlock(context, 1);
  if (block === null) {
    return null;
  }
  return Node.withRange(isFlags ? Node.withChildren(new Node(9), [name, block]) : Node.withChildren(new Node(8), [name, block]), ParserContext.spanSince(context, token.range));
}
function parseVariableCluster(context, type, name) {
  var variables = [];
  var start = type;
  while (variables.length === 0 || ParserContext.current(context).kind !== 82 && ParserContext.current(context).kind !== 46) {
    if (variables.length > 0 && !ParserContext.eat(context, 21)) {
      ParserContext.expect(context, 82);
      break;
    }
    if (name === null) {
      name = start = parseName(context);
    }
    if (name === null) {
      break;
    }
    var value = ParserContext.eat(context, 2) ? Pratt.parseIgnoringParselet(pratt, context, 1, null) : null;
    variables.push(Node.withRange(Node.withChildren(new Node(16), [name, null, value]), ParserContext.spanSince(context, start.range)));
    name = null;
  }
  return Node.withRange(Node.createVariableCluster(type, variables), ParserContext.spanSince(context, type.range));
}
function parseFor(context) {
  var token = ParserContext.next(context);
  if (!ParserContext.expect(context, 58)) {
    return null;
  }
  var setup = null;
  var test = null;
  var update = null;
  do {
    if (ParserContext.current(context).kind !== 82 && ParserContext.current(context).kind !== 81) {
      setup = Pratt.parseIgnoringParselet(pratt, context, 14, null);
      if (ParserContext.current(context).kind === 43) {
        var name = parseName(context);
        setup = name !== null ? parseVariableCluster(context, setup, name) : null;
        if (setup !== null && ParserContext.eat(context, 46)) {
          var values = Pratt.parseIgnoringParselet(pratt, context, 0, null);
          scanForToken(context, 81, 0);
          var body = parseBlockOrStatement(context, 0);
          if (body === null) {
            return null;
          }
          var variables = Node.clusterVariables(setup);
          if (variables.length > 1) {
            Log.error(context.log, setup.range, "More than one variable inside a for-each loop");
          }
          var value = Node.withChildren(new Node(16), [Node.remove(variables[0].children[0]), Node.remove(setup.children[0]), null]);
          return Node.withRange(Node.withChildren(new Node(21), [value, values, body]), ParserContext.spanSince(context, token.range));
        }
      } else if (ParserContext.current(context).kind !== 82) {
        setup = Pratt.resumeIgnoringParselet(pratt, context, 0, setup, null);
      }
    }
    if (!ParserContext.expect(context, 82)) {
      break;
    }
    if (ParserContext.current(context).kind !== 82 && ParserContext.current(context).kind !== 81) {
      test = Pratt.parseIgnoringParselet(pratt, context, 0, null);
    }
    if (!ParserContext.expect(context, 82)) {
      break;
    }
    if (ParserContext.current(context).kind !== 81) {
      update = Pratt.parseIgnoringParselet(pratt, context, 0, null);
    }
  } while (false);
  scanForToken(context, 81, 0);
  var block = parseBlockOrStatement(context, 0);
  if (block === null) {
    return null;
  }
  return Node.withRange(Node.withChildren(new Node(20), [setup, test, update, block]), ParserContext.spanSince(context, token.range));
}
function parseSuperCall(context) {
  var token = ParserContext.next(context);
  var values = parseArgumentList(context, 58, 81, 0);
  return Node.withRange(Node.withChildren(new Node(48), values), ParserContext.spanSince(context, token.range));
}
function parsePossibleTypedDeclaration(context, hint) {
  var type = Pratt.parseIgnoringParselet(pratt, context, 14, null);
  if (ParserContext.current(context).kind !== 43) {
    var value = Pratt.resumeIgnoringParselet(pratt, context, 0, type, null);
    scanForToken(context, 82, 1);
    return Node.withRange(Node.withChildren(new Node(30), [value]), ParserContext.spanSince(context, type.range));
  }
  var name = parseName(context);
  if (name === null) {
    return null;
  }
  if (ParserContext.current(context).kind === 58) {
    var $arguments = parseArgumentVariables(context);
    if ($arguments === null) {
      return null;
    }
    var block = null;
    if (!ParserContext.eat(context, 82)) {
      block = parseBlock(context, 0);
      if (block === null) {
        return null;
      }
    }
    return Node.withRange(Node.withChildren(new Node(15), [name, $arguments, block, type]), ParserContext.spanSince(context, type.range));
  }
  var cluster = parseVariableCluster(context, type, name);
  scanForToken(context, 82, 1);
  var last = cluster.children[cluster.children.length - 1 | 0];
  Node.withRange(last, ParserContext.spanSince(context, last.range));
  return cluster;
}
function parseUsing(context) {
  var token = ParserContext.next(context);
  var value = Pratt.parseIgnoringParselet(pratt, context, 0, null);
  scanForToken(context, 82, 1);
  return Node.withRange(Node.withChildren(new Node(33), [value]), ParserContext.spanSince(context, token.range));
}
function parseAlias(context) {
  var token = ParserContext.next(context);
  var name = parseName(context);
  if (name === null || !ParserContext.expect(context, 2)) {
    scanForToken(context, 82, 1);
    var range = ParserContext.spanSince(context, token.range);
    return Node.withRange(Node.withChildren(new Node(30), [Node.withRange(new Node(49), range)]), range);
  }
  var value = Pratt.parseIgnoringParselet(pratt, context, 0, null);
  scanForToken(context, 82, 1);
  return Node.withRange(Node.withChildren(new Node(18), [name, value]), ParserContext.spanSince(context, token.range));
}
function looksLikeLambdaArguments(node) {
  if (node.kind === 50) {
    for (var i = 0; i < node.children.length; i = i + 1 | 0) {
      if (node.children[i].kind !== 34) {
        return false;
      }
    }
    return true;
  }
  return false;
}
function createLambdaFromNames(names, block) {
  for (var i = 0; i < names.length; i = i + 1 | 0) {
    var name = names[i];
    names[i] = Node.withRange(Node.withChildren(new Node(16), [name, null, null]), name.range);
  }
  return Node.createLambda(names, block);
}
function looksLikeType(node) {
  switch (node.kind) {
  case 45:
    var target = node.children[0];
    return target !== null && looksLikeType(target);
  case 34:
  case 51:
  case 57:
    return true;
  default:
    return false;
  }
}
function parseStatement(context, hint) {
  switch (ParserContext.current(context).kind) {
  case 0:
    return parseAlias(context);
  case 1:
    return parseAssert(context);
  case 16:
    return parseBreak(context);
  case 19:
    return parseObject(context, 10);
  case 22:
    return parseModifier(context, hint, 1024);
  case 23:
    return parseContinue(context);
  case 27:
    return parseDoWhile(context);
  case 32:
    return parseEnum(context);
  case 35:
    return parseModifier(context, hint, 4096);
  case 37:
    return parseModifier(context, hint, 256);
  case 40:
    return parseFor(context);
  case 43:
  case 95:
    return parsePossibleTypedDeclaration(context, hint);
  case 44:
    return parseIf(context);
  case 45:
    return parseModifier(context, hint, 8192);
  case 46:
    return parseExtension(context);
  case 48:
    return parseModifier(context, hint, 512);
  case 49:
    return parseObject(context, 12);
  case 66:
    return parseNamespace(context);
  case 67:
    return parseConstructor(context, hint);
  case 71:
    return parseModifier(context, hint, 32);
  case 73:
    return parseModifier(context, hint, 2);
  case 74:
    return parseModifier(context, hint, 4);
  case 75:
    return parseModifier(context, hint, 1);
  case 78:
    return parseReturn(context);
  case 85:
    return parseModifier(context, hint, 64);
  case 87:
    return parseObject(context, 11);
  case 89:
    return parseSwitch(context);
  case 94:
    return parseUsing(context);
  case 96:
    return parseModifier(context, hint, 128);
  case 97:
    return parseWhile(context);
  default:
    return parseExpression(context);
  }
}
function parseFile(log, tokens) {
  var context = new ParserContext(log, tokens);
  var token = ParserContext.current(context);
  var statements = parseStatements(context, 0);
  if (statements === null) {
    return null;
  }
  if (!ParserContext.expect(context, 31)) {
    return null;
  }
  var range = ParserContext.spanSince(context, token.range);
  return Node.withRange(Node.withChildren(new Node(1), [Node.withRange(Node.withChildren(new Node(2), statements), range)]), range);
}
function tokenLiteral(kind) {
  return function(context, token) {
    return Node.withRange(new Node(kind), token.range);
  };
}
function intLiteral(base) {
  return function(context, token) {
    var value = parseIntLiteral(token.text, base);
    if (value !== value) {
      Log.error(context.log, token.range, "Invalid integer literal " + token.text);
    } else if (base === 10 && value !== 0 && token.text.charCodeAt(0) === 48) {
      Log.warning(context.log, token.range, "Use the prefix \"0o\" for octal numbers");
    }
    return Node.withRange(Node.withContent(new Node(40), new IntContent(value | 0)), token.range);
  };
}
function unaryPostfix(kind) {
  return function(context, value, token) {
    return Node.withRange(Node.withChildren(new Node(kind), [value]), Range.span(value.range, token.range));
  };
}
function unaryPrefix(kind) {
  return function(context, token, value) {
    return Node.withRange(Node.withChildren(new Node(kind), [value]), Range.span(token.range, value.range));
  };
}
function binaryInfix(kind) {
  return function(context, left, token, right) {
    return Node.withRange(Node.createBinary(kind, left, right), Range.span(left.range, right.range));
  };
}
function createParser() {
  if (pratt !== null) {
    return;
  }
  pratt = new Pratt();
  Pratt.literal(pratt, 70, tokenLiteral(38));
  Pratt.literal(pratt, 90, tokenLiteral(36));
  Pratt.literal(pratt, 92, function(context, token) {
    return Node.withRange(Node.withContent(new Node(39), new BoolContent(true)), token.range);
  });
  Pratt.literal(pratt, 36, function(context, token) {
    return Node.withRange(Node.withContent(new Node(39), new BoolContent(false)), token.range);
  });
  Pratt.literal(pratt, 51, intLiteral(10));
  Pratt.literal(pratt, 50, intLiteral(2));
  Pratt.literal(pratt, 53, intLiteral(8));
  Pratt.literal(pratt, 52, intLiteral(16));
  Pratt.literal(pratt, 38, function(context, token) {
    return Node.withRange(Node.withContent(new Node(41), new DoubleContent(parseDoubleLiteral(token.text.slice(0, token.text.length - 1 | 0)))), token.range);
  });
  Pratt.literal(pratt, 29, function(context, token) {
    return Node.withRange(Node.withContent(new Node(42), new DoubleContent(parseDoubleLiteral(token.text))), token.range);
  });
  Pratt.literal(pratt, 95, function(context, token) {
    return Node.withRange(new Node(56), token.range);
  });
  Pratt.literal(pratt, 86, function(context, token) {
    var result = parseStringLiteral(context.log, token.range, token.text);
    return Node.withRange(Node.withContent(new Node(43), new StringContent(result !== null ? result.value : "")), token.range);
  });
  Pratt.literal(pratt, 18, function(context, token) {
    var result = parseStringLiteral(context.log, token.range, token.text);
    if (result !== null && result.value.length !== 1) {
      Log.error(context.log, token.range, "Invalid character literal " + firstLineOf(token.text));
      result = null;
    }
    return Node.withRange(Node.withContent(new Node(40), new IntContent(result !== null ? result.value.charCodeAt(0) : 0)), token.range);
  });
  Pratt.postfix(pratt, 47, 14, unaryPostfix(64));
  Pratt.postfix(pratt, 24, 14, unaryPostfix(65));
  Pratt.prefix(pratt, 47, 13, unaryPrefix(62));
  Pratt.prefix(pratt, 24, 13, unaryPrefix(63));
  Pratt.prefix(pratt, 72, 13, unaryPrefix(59));
  Pratt.prefix(pratt, 64, 13, unaryPrefix(60));
  Pratt.prefix(pratt, 68, 13, unaryPrefix(58));
  Pratt.prefix(pratt, 91, 13, unaryPrefix(61));
  Pratt.infix(pratt, 13, 7, binaryInfix(67));
  Pratt.infix(pratt, 14, 5, binaryInfix(68));
  Pratt.infix(pratt, 15, 6, binaryInfix(69));
  Pratt.infix(pratt, 26, 12, binaryInfix(70));
  Pratt.infix(pratt, 33, 8, binaryInfix(71));
  Pratt.infix(pratt, 41, 9, binaryInfix(72));
  Pratt.infix(pratt, 42, 9, binaryInfix(73));
  Pratt.infix(pratt, 46, 9, binaryInfix(74));
  Pratt.infix(pratt, 59, 9, binaryInfix(76));
  Pratt.infix(pratt, 60, 9, binaryInfix(77));
  Pratt.infix(pratt, 62, 4, binaryInfix(78));
  Pratt.infix(pratt, 63, 3, binaryInfix(79));
  Pratt.infix(pratt, 64, 11, binaryInfix(85));
  Pratt.infix(pratt, 65, 12, binaryInfix(80));
  Pratt.infix(pratt, 69, 8, binaryInfix(81));
  Pratt.infix(pratt, 72, 11, binaryInfix(66));
  Pratt.infix(pratt, 77, 12, binaryInfix(82));
  Pratt.infix(pratt, 83, 10, binaryInfix(83));
  Pratt.infix(pratt, 84, 10, binaryInfix(84));
  Pratt.infixRight(pratt, 2, 2, binaryInfix(86));
  Pratt.infixRight(pratt, 9, 2, binaryInfix(87));
  Pratt.infixRight(pratt, 3, 2, binaryInfix(88));
  Pratt.infixRight(pratt, 4, 2, binaryInfix(89));
  Pratt.infixRight(pratt, 5, 2, binaryInfix(90));
  Pratt.infixRight(pratt, 6, 2, binaryInfix(91));
  Pratt.infixRight(pratt, 8, 2, binaryInfix(92));
  Pratt.infixRight(pratt, 10, 2, binaryInfix(93));
  Pratt.infixRight(pratt, 11, 2, binaryInfix(94));
  Pratt.infixRight(pratt, 12, 2, binaryInfix(95));
  Pratt.infixRight(pratt, 7, 2, binaryInfix(96));
  Pratt.parselet(pratt, 57, 0).prefix = function(context) {
    var token = ParserContext.current(context);
    var $arguments = parseArgumentList(context, 57, 80, 1);
    return Node.withRange(Node.withChildren(new Node(44), $arguments), ParserContext.spanSince(context, token.range));
  };
  Pratt.parselet(pratt, 58, 0).prefix = function(context) {
    var token = ParserContext.current(context);
    var type = parseGroup(context, 1);
    if (type.kind === 34 && ParserContext.eat(context, 55)) {
      var block = parseLambdaBlock(context);
      return Node.withRange(createLambdaFromNames([type], block), ParserContext.spanSince(context, token.range));
    }
    if (looksLikeLambdaArguments(type) && ParserContext.eat(context, 55)) {
      var block = parseLambdaBlock(context);
      return Node.withRange(createLambdaFromNames(Node.removeChildren(type), block), ParserContext.spanSince(context, token.range));
    }
    if (looksLikeType(type)) {
      var value = Pratt.parseIgnoringParselet(pratt, context, 13, null);
      return Node.withRange(Node.withChildren(new Node(52), [type, value]), ParserContext.spanSince(context, token.range));
    }
    return type;
  };
  Pratt.parselet(pratt, 76, 2).infix = function(context, left) {
    ParserContext.next(context);
    var middle = Pratt.parseIgnoringParselet(pratt, context, 1, null);
    var right = ParserContext.expect(context, 20) ? Pratt.parseIgnoringParselet(pratt, context, 1, null) : Node.withRange(new Node(49), ParserContext.spanSince(context, ParserContext.current(context).range));
    return Node.withRange(Node.withChildren(new Node(37), [left, middle, right]), ParserContext.spanSince(context, left.range));
  };
  Pratt.parselet(pratt, 21, 1).infix = function(context, left) {
    var values = [left];
    while (ParserContext.eat(context, 21)) {
      values.push(Pratt.parseIgnoringParselet(pratt, context, 1, null));
    }
    return Node.withRange(Node.withChildren(new Node(50), values), ParserContext.spanSince(context, left.range));
  };
  Pratt.parselet(pratt, 28, 15).infix = function(context, left) {
    ParserContext.next(context);
    var name = parseName(context);
    return Node.withRange(Node.withChildren(new Node(45), [left, name]), ParserContext.spanSince(context, left.range));
  };
  Pratt.parselet(pratt, 28, 0).prefix = function(context) {
    var token = ParserContext.next(context);
    var name = parseName(context);
    return Node.withRange(Node.withChildren(new Node(45), [null, name]), ParserContext.spanSince(context, token.range));
  };
  Pratt.parselet(pratt, 39, 15).infix = function(context, left) {
    if (!looksLikeType(left)) {
      ParserContext.unexpectedToken(context);
      ParserContext.next(context);
      return Node.withRange(new Node(49), ParserContext.spanSince(context, left.range));
    }
    ParserContext.next(context);
    var $arguments = parseArgumentList(context, 58, 81, 1);
    return Node.withRange(Node.createFunctionType(left, $arguments), ParserContext.spanSince(context, left.range));
  };
  Pratt.parselet(pratt, 58, 14).infix = function(context, left) {
    var $arguments = parseArgumentList(context, 58, 81, 0);
    return Node.withRange(Node.createCall(left, $arguments), ParserContext.spanSince(context, left.range));
  };
  Pratt.parselet(pratt, 57, 14).infix = function(context, left) {
    ParserContext.next(context);
    var index = Pratt.parseIgnoringParselet(pratt, context, 0, null);
    scanForToken(context, 80, 1);
    return Node.withRange(Node.createBinary(75, left, index), ParserContext.spanSince(context, left.range));
  };
  Pratt.parselet(pratt, 100, 15).infix = function(context, left) {
    var token = ParserContext.next(context);
    var substitutions = parseTypeList(context, 101);
    if (!ParserContext.expect(context, 101)) {
      scanForToken(context, 101, 1);
      return Node.withRange(new Node(49), ParserContext.spanSince(context, token.range));
    }
    return Node.withRange(Node.createParameterize(left, substitutions), ParserContext.spanSince(context, left.range));
  };
  Pratt.parselet(pratt, 93, 13).prefix = function(context) {
    var token = ParserContext.next(context);
    var value = parseGroup(context, 0);
    return Node.withRange(value === null ? new Node(49) : Node.withChildren(new Node(55), [value]), ParserContext.spanSince(context, token.range));
  };
  Pratt.parselet(pratt, 43, 0).prefix = function(context) {
    var token = ParserContext.next(context);
    var name = Node.withRange(Node.withContent(new Node(34), new StringContent(token.text)), token.range);
    if (ParserContext.eat(context, 55)) {
      var block = parseLambdaBlock(context);
      return Node.withRange(createLambdaFromNames([name], block), ParserContext.spanSince(context, token.range));
    }
    return name;
  };
  Pratt.parselet(pratt, 55, 0).prefix = function(context) {
    var token = ParserContext.next(context);
    var block = parseLambdaBlock(context);
    return Node.withRange(Node.createLambda([], block), ParserContext.spanSince(context, token.range));
  };
  Pratt.parselet(pratt, 67, 0).prefix = function(context) {
    ParserContext.unexpectedToken(context);
    ParserContext.next(context);
    return Pratt.parseIgnoringParselet(pratt, context, 14, null);
  };
  var inParselet = Pratt.parselet(pratt, 46, 0);
  Pratt.parselet(pratt, 61, 0).prefix = function(context) {
    var token = ParserContext.next(context);
    var name = parseName(context);
    if (name === null || !ParserContext.expect(context, 2)) {
      return Node.withRange(new Node(49), ParserContext.spanSince(context, token.range));
    }
    var initial = Pratt.parseIgnoringParselet(pratt, context, 0, inParselet);
    var variable = Node.withRange(Node.withChildren(new Node(16), [name, new Node(56), initial]), ParserContext.spanSince(context, token.range));
    if (initial.kind === 49 || !ParserContext.expect(context, 46)) {
      return Node.withRange(new Node(49), ParserContext.spanSince(context, token.range));
    }
    var value = Pratt.parseIgnoringParselet(pratt, context, 1, null);
    return Node.withRange(Node.withChildren(new Node(46), [variable, value]), ParserContext.spanSince(context, token.range));
  };
  Pratt.parselet(pratt, 88, 0).prefix = function(context) {
    return parseSuperCall(context);
  };
}
function semanticErrorDuplicateSymbol(log, range, name, previous) {
  Log.error(log, range, "\"" + name + "\" is already declared");
  if (previous.source !== null) {
    Log.note(log, previous, "The previous declaration is here");
  }
}
function semanticErrorDifferentModifiers(log, range, name, previous) {
  Log.error(log, range, "Cannot merge multiple declarations for \"" + name + "\" with different modifiers");
  if (previous.source !== null) {
    Log.note(log, previous, "The conflicting declaration is here");
  }
}
function semanticErrorParameterCount(log, range, expected, found) {
  Log.error(log, range, "Expected " + expected + (expected === 1 ? " type parameter" : " type parameters") + " but found " + found + (found === 1 ? " type parameter" : " type parameters"));
}
function semanticErrorArgumentCount(log, range, expected, found) {
  Log.error(log, range, "Expected " + expected + (expected === 1 ? " argument" : " arguments") + " but found " + found + (found === 1 ? " argument" : " arguments"));
}
function semanticErrorDuplicateCase(log, range, previous) {
  Log.error(log, range, "Duplicate case value");
  if (previous.source !== null) {
    Log.note(log, previous, "The first occurrence is here");
  }
}
function semanticErrorAmbiguousSymbol(log, range, name, names) {
  for (var i = 0; i < names.length; i = i + 1 | 0) {
    names[i] = "\"" + names[i] + "\"";
  }
  Log.error(log, range, "Reference to \"" + name + "\" is ambiguous, could be " + names.join(" or "));
}
function semanticErrorUnmergedSymbol(log, range, name, types) {
  var names = [];
  for (var i = 0; i < types.length; i = i + 1 | 0) {
    names.push("type \"" + Type.toString(types[i]) + "\"");
  }
  Log.error(log, range, "Member \"" + name + "\" has an ambiguous inherited type, could be " + names.join(" or "));
}
function semanticErrorBadOverride(log, range, name, base, overridden) {
  Log.error(log, range, "\"" + name + "\" overrides another declaration with the same name in base type \"" + Type.toString(base) + "\"");
  if (overridden.source !== null) {
    Log.note(log, overridden, "The overridden declaration is here");
  }
}
function semanticErrorOverrideDifferentTypes(log, range, name, base, derived, overridden) {
  Log.error(log, range, "\"" + name + "\" must have the same signature as the method it overrides (expected type \"" + Type.toString(base) + "\" but found type \"" + Type.toString(derived) + "\")");
  if (overridden.source !== null) {
    Log.note(log, overridden, "The overridden declaration is here");
  }
}
function semanticErrorModifierMissingOverride(log, range, name, overridden) {
  Log.error(log, range, "\"" + name + "\" overrides another symbol with the same name but is missing the \"override\" modifier");
  if (overridden.source !== null) {
    Log.note(log, overridden, "The overridden declaration is here");
  }
}
function semanticErrorCannotOverrideNonVirtual(log, range, name, overridden) {
  Log.error(log, range, "\"" + name + "\" cannot override a non-virtual method");
  if (overridden.source !== null) {
    Log.note(log, overridden, "The overridden declaration is here");
  }
}
function semanticErrorCannotParameterize(log, range, type) {
  Log.error(log, range, "Cannot parameterize type \"" + Type.toString(type) + "\"" + (Type.hasParameters(type) ? " because it is already parameterized" : " because it has no type parameters"));
}
function semanticErrorAlreadyInitialized(log, range, name, previous) {
  Log.error(log, range, "\"" + name + "\" is already initialized");
  if (previous.source !== null) {
    Log.note(log, previous, "The previous initialization is here");
  }
}
function createNameToSymbolFlag() {
  if (nameToSymbolFlag !== null) {
    return;
  }
  nameToSymbolFlag = new StringMap();
  nameToSymbolFlag.set("const", 1024);
  nameToSymbolFlag.set("export", 4096);
  nameToSymbolFlag.set("final", 256);
  nameToSymbolFlag.set("import", 8192);
  nameToSymbolFlag.set("inline", 512);
  nameToSymbolFlag.set("override", 32);
  nameToSymbolFlag.set("private", 2);
  nameToSymbolFlag.set("protected", 4);
  nameToSymbolFlag.set("public", 1);
  nameToSymbolFlag.set("static", 64);
  nameToSymbolFlag.set("virtual", 128);
}
function createSymbolFlagToName() {
  if (symbolFlagToName !== null) {
    return;
  }
  symbolFlagToName = new IntMap();
  symbolFlagToName.set(1024, "const");
  symbolFlagToName.set(4096, "export");
  symbolFlagToName.set(256, "final");
  symbolFlagToName.set(8192, "import");
  symbolFlagToName.set(512, "inline");
  symbolFlagToName.set(32, "override");
  symbolFlagToName.set(2, "private");
  symbolFlagToName.set(4, "protected");
  symbolFlagToName.set(1, "public");
  symbolFlagToName.set(64, "static");
  symbolFlagToName.set(128, "virtual");
}
service.nodeFromPosition = function(node, source, index) {
  while (Node.hasChildren(node)) {
    var i = 0;
    for (i = node.children.length - 1 | 0; i >= 0; i = i - 1 | 0) {
      var child = node.children[i];
      if (child !== null && child.range.source === source && Range.touches(child.range, index)) {
        node = child;
        break;
      }
    }
    if (i < 0) {
      break;
    }
  }
  return node;
};
service.typeFromPosition = function(node, source, index) {
  node = service.nodeFromPosition(node, source, index);
  var symbol = node.symbol;
  var type = node.type;
  if (type !== null && symbol !== null) {
    var start = Source.indexToLineColumn(source, node.range.start);
    var result = new LanguageServiceTypeResult(start.line, start.column, node.range.start, Range.singleLineLength(node.range), Type.toString(type));
    switch (symbol.kind) {
    case 4:
      var bound = Type.bound(symbol.type);
      var text = "type " + symbol.name;
      if (bound !== null) {
        text += " is " + Type.toString(bound);
      }
      result.declaration = text;
      break;
    case 8:
      result.declaration = "namespace " + Symbol.fullName(symbol);
      break;
    case 11:
    case 12:
    case 13:
      var text = $in.SymbolKind.toString(symbol.kind).toLowerCase() + " " + Type.toString(type);
      if (Type.hasRelevantTypes(type)) {
        for (var i = 0; i < type.relevantTypes.length; i = i + 1 | 0) {
          text += (i === 0 ? " : " : ", ") + Type.toString(type.relevantTypes[i]);
        }
      }
      result.declaration = text;
      break;
    case 9:
      result.declaration = "enum " + Symbol.fullName(symbol);
      break;
    case 10:
      result.declaration = "enum flags " + Symbol.fullName(symbol);
      break;
    case 14:
    case 15:
    case 16:
      var text = Type.toString(type.relevantTypes[0]) + " " + symbol.name + "(";
      var $arguments = symbol.node.children[1].children;
      var argumentTypes = Type.argumentTypes(type);
      for (var i = 0; i < $arguments.length; i = i + 1 | 0) {
        if (i > 0) {
          text += ", ";
        }
        text += Type.toString(argumentTypes[i]) + " " + $arguments[i].symbol.name;
      }
      result.declaration = text + ")";
      break;
    case 17:
    case 18:
    case 19:
      var text = Type.toString(type) + " " + symbol.name;
      if (Symbol.isEnumValue(symbol)) {
        text += " = " + symbol.constant.value;
      }
      result.declaration = text;
      break;
    default:
      return null;
    }
    return result;
  }
  return null;
};
service.completionsFromPosition = function(node, resolver, source, index) {
  var completions = [];
  node = service.nodeFromPosition(node, source, index);
  if (node.kind === 45) {
    var target = node.children[0];
    if (target.type !== null) {
      var isInstance = target.kind !== 35;
      var members = target.type.members.values();
      for (var i = 0; i < members.length; i = i + 1 | 0) {
        var member = members[i];
        Resolver.initializeMember(resolver, member);
        if ($in.SymbolKind.isInstance(member.symbol.kind) === isInstance) {
          service.addCompletion(completions, member);
        }
      }
      return completions;
    }
  }
  while (node !== null) {
    if (node.scope === null) {
      node = node.parent;
      continue;
    }
    var allMembers = new StringMap();
    service.collectAllMembers(node.scope, allMembers);
    var members = allMembers.values();
    for (var i = 0; i < members.length; i = i + 1 | 0) {
      var member = members[i];
      Resolver.initializeMember(resolver, member);
      service.addCompletion(completions, member);
    }
    break;
  }
  return completions;
};
service.addCompletion = function(completions, member) {
  var name = member.symbol.name;
  var type = member.type;
  if (name !== "new" && type !== null) {
    var text = name;
    if (type.symbol === null) {
      var semicolon = Type.toString(type.relevantTypes[0]) === "void";
      text += Type.argumentTypes(type).length === 0 ? semicolon ? "();$" : "()$" : semicolon ? "($);" : "($)";
    } else {
      text += "$";
    }
    completions.push(new LanguageServiceCompletion(name, Type.toString(type), text));
  }
};
service.addAllMembers = function(allMembers, membersToAdd) {
  var members = membersToAdd.values();
  for (var i = 0; i < members.length; i = i + 1 | 0) {
    var member = members[i];
    if (!allMembers.has(member.symbol.name)) {
      allMembers.set(member.symbol.name, member);
    }
  }
};
service.collectAllMembers = function(scope, allMembers) {
  if (scope.locals !== null) {
    service.addAllMembers(allMembers, scope.locals);
  }
  if (scope.type !== null) {
    service.addAllMembers(allMembers, scope.type.members);
  }
  if (scope.lexicalParent !== null) {
    service.collectAllMembers(scope.lexicalParent, allMembers);
  }
};
var operatorInfo = null;
Compiler.nativeLibrarySource = null;
Compiler.nativeLibraryFile = null;
var NATIVE_LIBRARY = "\nimport struct int { import string toString(); }\nimport struct bool { import string toString(); }\nimport struct float { import string toString(); }\nimport struct double { import string toString(); }\n\nimport struct String {\n  import static string fromCharCode(int value);\n}\n\nimport struct string {\n  import final int length;\n  import string slice(int start, int end);\n  import int indexOf(string value);\n  import int lastIndexOf(string value);\n  import string toLowerCase();\n  import string toUpperCase();\n  inline static string fromCodeUnit(int value) { return String.fromCharCode(value); }\n  inline string get(int index) { return untyped(this)[index]; }\n  inline string join(List<string> values) { return untyped(values).join(this); }\n  inline int codeUnitAt(int index) { return untyped(this).charCodeAt(index); }\n  bool startsWith(string prefix) { return length >= prefix.length && slice(0, prefix.length) == prefix; }\n  bool endsWith(string suffix) { return length >= suffix.length && slice(length - suffix.length, length) == suffix; }\n  string repeat(int count) { var result = \"\"; for (var i = 0; i < count; i++) result += this; return result; }\n}\n\nimport class List<T> {\n  import new();\n  import final int length;\n  import void push(T value);\n  import void unshift(T value);\n  import List<T> slice(int start, int end);\n  import int indexOf(T value);\n  import int lastIndexOf(T value);\n  import T shift();\n  import T pop();\n  import void reverse();\n  import void sort(int fn(T, T) callback);\n  inline List<T> clone() { return untyped(this).slice(); }\n  inline T remove(int index) { return untyped(this).splice(index, 1)[0]; }\n  inline void insert(int index, T value) { untyped(this).splice(index, 0, value); }\n  inline T get(int index) { return untyped(this)[index]; }\n  inline void set(int index, T value) { untyped(this)[index] = value; }\n  void swap(int a, int b) {\n    var temp = get(a);\n    set(a, get(b));\n    set(b, temp);\n  }\n}\n\nimport class StringMap<T> {\n  import new();\n  import T get(string key);\n  import T getOrDefault(string key, T defaultValue);\n  import void set(string key, T value);\n  import bool has(string key);\n  import void remove(string key);\n  import List<string> keys();\n  import List<T> values();\n  import StringMap<T> clone();\n}\n\nimport class IntMap<T> {\n  import new();\n  import T get(int key);\n  import T getOrDefault(int key, T defaultValue);\n  import void set(int key, T value);\n  import bool has(int key);\n  import void remove(int key);\n  import List<int> keys();\n  import List<T> values();\n  import IntMap<T> clone();\n}\n\n// TODO: Rename this to \"math\" since namespaces should be lower case\nimport namespace Math {\n  import final double E;\n  import final double PI;\n  import final double NAN;\n  import final double INFINITY;\n  import double random();\n  import double abs(double n);\n  import double sin(double n);\n  import double cos(double n);\n  import double tan(double n);\n  import double asin(double n);\n  import double acos(double n);\n  import double atan(double n);\n  import double round(double n);\n  import double floor(double n);\n  import double ceil(double n);\n  import double exp(double n);\n  import double log(double n);\n  import double sqrt(double n);\n  import bool isNaN(double n);\n  import bool isFinite(double n);\n  import double atan2(double y, double x);\n  import double pow(double base, double exponent);\n  import double min(double a, double b);\n  import double max(double a, double b);\n  inline int imin(int a, int b) { return untyped(min)(a, b); }\n  inline int imax(int a, int b) { return untyped(max)(a, b); }\n}\n";
Range.EMPTY = new Range(null, 0, 0);
var BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var HEX = "0123456789ABCDEF";
js.Emitter.isKeyword = null;
var yy_accept = [99, 99, 99, 31, 34, 98, 68, 34, 77, 13, 34, 58, 81, 65, 72, 21, 64, 28, 26, 51, 51, 20, 82, 59, 2, 41, 76, 43, 57, 80, 15, 43, 43, 43, 43, 43, 43, 43, 43, 43, 43, 43, 43, 43, 43, 43, 43, 43, 56, 14, 79, 91, 98, 69, 99, 86, 99, 10, 62, 3, 99, 18, 99, 8, 47, 9, 24, 7, 98, 6, 99, 51, 99, 38, 99, 99, 83, 60, 33, 55, 42, 84, 43, 5, 43, 43, 43, 43, 43, 43, 43, 27, 43, 43, 43, 43, 43, 39, 43, 44, 43, 46, 54, 43, 43, 43, 43, 43, 43, 43, 43, 43, 43, 43, 43, 43, 43, 43, 43, 43, 43, 4, 63, 98, 29, 50, 53, 52, 11, 12, 43, 43, 43, 43, 43, 43, 43, 43, 43, 43, 43, 43, 40, 43, 43, 43, 61, 43, 67, 43, 43, 43, 43, 43, 43, 43, 43, 43, 43, 43, 43, 43, 43, 95, 43, 43, 38, 43, 43, 43, 17, 43, 43, 43, 43, 30, 32, 43, 43, 43, 43, 43, 43, 43, 70, 43, 43, 43, 43, 43, 43, 43, 43, 43, 90, 92, 43, 43, 43, 43, 0, 43, 16, 19, 22, 43, 43, 43, 36, 37, 43, 43, 43, 43, 43, 43, 43, 43, 43, 43, 43, 88, 43, 43, 94, 43, 97, 1, 43, 43, 35, 45, 48, 43, 43, 43, 43, 43, 75, 78, 85, 87, 89, 43, 43, 43, 25, 43, 43, 43, 73, 43, 93, 96, 23, 43, 43, 71, 43, 49, 66, 74, 99];
var yy_ec = [0, 1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 4, 5, 1, 1, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 19, 19, 19, 19, 19, 20, 20, 21, 22, 23, 24, 25, 26, 1, 27, 27, 27, 27, 27, 27, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 29, 30, 31, 32, 28, 1, 33, 34, 35, 36, 37, 38, 39, 40, 41, 28, 42, 43, 44, 45, 46, 47, 28, 48, 49, 50, 51, 52, 53, 54, 55, 28, 56, 57, 58, 59, 1];
var yy_meta = [0, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 3, 3, 1, 1, 1, 1, 1, 1, 3, 4, 1, 1, 1, 1, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 1, 1, 1, 1];
var yy_base = [0, 0, 0, 318, 319, 58, 293, 57, 292, 56, 56, 319, 319, 291, 53, 319, 52, 319, 51, 73, 64, 319, 319, 45, 46, 48, 319, 0, 319, 319, 290, 46, 265, 63, 48, 54, 71, 76, 275, 85, 259, 50, 273, 73, 65, 29, 96, 269, 319, 76, 319, 319, 128, 319, 98, 319, 305, 319, 319, 319, 102, 319, 304, 319, 319, 319, 319, 319, 0, 319, 121, 127, 117, 319, 131, 0, 282, 319, 319, 319, 319, 281, 0, 319, 263, 254, 265, 252, 267, 254, 260, 0, 248, 245, 248, 251, 248, 0, 244, 0, 244, 108, 0, 240, 245, 235, 244, 249, 111, 251, 234, 120, 236, 241, 240, 229, 229, 237, 229, 228, 234, 319, 319, 0, 142, 137, 152, 0, 319, 319, 241, 236, 239, 234, 221, 114, 236, 231, 223, 220, 216, 231, 0, 217, 221, 224, 0, 223, 0, 216, 210, 205, 206, 212, 203, 203, 201, 214, 200, 200, 211, 192, 201, 0, 195, 201, 319, 194, 194, 199, 0, 191, 189, 197, 186, 0, 0, 188, 198, 191, 185, 187, 183, 181, 0, 181, 195, 190, 185, 177, 183, 188, 174, 186, 0, 0, 173, 180, 167, 180, 0, 166, 0, 0, 0, 170, 171, 163, 0, 0, 162, 174, 172, 162, 167, 157, 171, 170, 159, 168, 152, 0, 161, 163, 0, 166, 0, 0, 147, 147, 0, 0, 0, 163, 162, 156, 142, 128, 0, 0, 0, 0, 0, 141, 133, 138, 0, 139, 138, 135, 0, 130, 0, 0, 0, 129, 119, 0, 107, 0, 0, 0, 319, 180, 184, 186, 190, 112];
var yy_def = [0, 262, 1, 262, 262, 262, 262, 263, 262, 262, 264, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 265, 262, 262, 262, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 262, 262, 262, 262, 262, 262, 263, 262, 263, 262, 262, 262, 264, 262, 264, 262, 262, 262, 262, 262, 266, 262, 262, 262, 262, 262, 262, 267, 262, 262, 262, 262, 262, 262, 265, 262, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 262, 262, 266, 262, 262, 262, 267, 262, 262, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 262, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 265, 0, 262, 262, 262, 262, 262];
var yy_nxt = [0, 4, 5, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 20, 20, 21, 22, 23, 24, 25, 26, 27, 27, 28, 4, 29, 30, 31, 32, 33, 34, 35, 36, 27, 27, 37, 27, 38, 27, 39, 40, 41, 42, 43, 44, 45, 46, 47, 27, 27, 48, 49, 50, 51, 52, 52, 55, 58, 61, 64, 66, 68, 76, 77, 78, 79, 80, 81, 116, 69, 67, 65, 117, 70, 59, 71, 71, 71, 71, 90, 62, 56, 70, 84, 71, 71, 71, 71, 91, 85, 87, 92, 108, 93, 121, 109, 73, 55, 95, 114, 88, 72, 94, 89, 61, 73, 96, 115, 99, 127, 97, 98, 104, 74, 100, 101, 105, 111, 112, 102, 113, 75, 56, 118, 52, 52, 62, 122, 125, 125, 106, 119, 124, 124, 124, 124, 70, 261, 71, 71, 71, 71, 126, 126, 126, 144, 151, 155, 125, 125, 260, 152, 145, 124, 124, 124, 124, 172, 173, 73, 259, 258, 156, 126, 126, 126, 257, 256, 255, 254, 253, 252, 251, 250, 166, 54, 54, 54, 54, 60, 60, 60, 60, 82, 82, 123, 249, 123, 123, 248, 247, 246, 245, 244, 243, 242, 241, 240, 239, 238, 237, 236, 235, 234, 233, 232, 231, 230, 229, 228, 227, 226, 225, 224, 223, 222, 221, 220, 219, 218, 217, 216, 215, 214, 213, 212, 211, 210, 209, 208, 207, 206, 205, 204, 203, 202, 201, 200, 199, 198, 197, 196, 195, 194, 193, 192, 191, 190, 189, 188, 187, 186, 185, 184, 183, 182, 181, 180, 179, 178, 177, 176, 175, 174, 171, 170, 169, 168, 167, 165, 164, 163, 162, 161, 160, 159, 158, 157, 154, 153, 150, 149, 148, 147, 146, 143, 142, 141, 140, 139, 138, 137, 136, 135, 134, 133, 132, 131, 130, 129, 128, 262, 262, 120, 110, 107, 103, 86, 83, 63, 57, 53, 262, 3, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262];
var yy_chk = [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 5, 5, 7, 9, 10, 14, 16, 18, 23, 23, 24, 24, 25, 25, 45, 18, 16, 14, 45, 20, 9, 20, 20, 20, 20, 34, 10, 7, 19, 31, 19, 19, 19, 19, 34, 31, 33, 35, 41, 35, 49, 41, 20, 54, 36, 44, 33, 19, 35, 33, 60, 19, 36, 44, 37, 267, 36, 36, 39, 19, 37, 37, 39, 43, 43, 37, 43, 19, 54, 46, 52, 52, 60, 49, 72, 72, 39, 46, 70, 70, 70, 70, 71, 258, 71, 71, 71, 71, 74, 74, 74, 101, 108, 111, 125, 125, 256, 108, 101, 124, 124, 124, 124, 135, 135, 71, 255, 251, 111, 126, 126, 126, 249, 248, 247, 245, 244, 243, 237, 236, 124, 263, 263, 263, 263, 264, 264, 264, 264, 265, 265, 266, 235, 266, 266, 234, 233, 229, 228, 225, 223, 222, 220, 219, 218, 217, 216, 215, 214, 213, 212, 211, 210, 207, 206, 205, 201, 199, 198, 197, 196, 193, 192, 191, 190, 189, 188, 187, 186, 185, 183, 182, 181, 180, 179, 178, 177, 174, 173, 172, 171, 169, 168, 167, 165, 164, 162, 161, 160, 159, 158, 157, 156, 155, 154, 153, 152, 151, 150, 149, 147, 145, 144, 143, 141, 140, 139, 138, 137, 136, 134, 133, 132, 131, 130, 120, 119, 118, 117, 116, 115, 114, 113, 112, 110, 109, 107, 106, 105, 104, 103, 100, 98, 96, 95, 94, 93, 92, 90, 89, 88, 87, 86, 85, 84, 81, 76, 62, 56, 47, 42, 40, 38, 32, 30, 13, 8, 6, 3, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262, 262];
var pratt = null;
var nameToSymbolFlag = null;
var symbolFlagToName = null;
Symbol.nextUniqueID = 0;
Type.nextUniqueID = 0;
function parseIntLiteral(value, base) {
  if (base !== 10) value = value.slice(2);
  var result = parseInt(value, base);
  return result === (result | 0) || result === 0x80000000 ? result | 0 : NaN;
}

function parseDoubleLiteral(value) {
  return +value;
}

var encodeBase64 =
  typeof btoa !== 'undefined' ? btoa :
  typeof Buffer != 'undefined' ? function(data) { return new Buffer(data).toString('base64') } :
  null;

var now = typeof performance !== 'undefined' && performance['now']
  ? function() { return performance['now'](); }
  : function() { return +new Date; };
// Run this when run with node but not when run with mocha
if (typeof process !== 'undefined' && typeof it === 'undefined') {
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
      return new Source(path, fs.readFileSync(path, 'utf8'));
    } catch (e) {
      return null;
    }
  };

  io.writeFile = function(path, contents) {
    try {
      fs.writeFileSync(path, contents);
      return true;
    } catch (e) {
      return false;
    }
  };

  process.exit(frontend.main(process.argv.slice(2)));
}
