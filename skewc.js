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

var string = {};
var List = {};
var $imul = Math.imul || function(a, b) {
  var ah = a >>> 16, al = a & 0xFFFF;
  var bh = b >>> 16, bl = b & 0xFFFF;
  return al * bl + (ah * bl + al * bh << 16) | 0;
};
function $extends(derived, base) {
  derived.prototype = Object.create(base.prototype);
  derived.prototype.constructor = derived;
}
string.append = function($this, value) {
  return $this + value;
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
  return Node.withChildren(new Node(48), $arguments);
};
Node.createParameterize = function(type, types) {
  types.unshift(type);
  return Node.withChildren(new Node(53), types);
};
Node.createLambda = function($arguments, block) {
  $arguments.push(block);
  return Node.withChildren(new Node(56), $arguments);
};
Node.createFunctionType = function(result, $arguments) {
  $arguments.unshift(result);
  return Node.withChildren(new Node(60), $arguments);
};
Node.createBinary = function(kind, left, right) {
  if (kind === 89 && left.kind === 78) {
    var target = left.children[0];
    var index = left.children[1];
    return Node.withChildren(new Node(100), [Node.remove(target), Node.remove(index), right]);
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
    $this.kind = 40;
    return;
  case 40:
    $this.kind = 39;
    return;
  case 61:
    Node.become($this, Node.remove($this.children[0]));
    return;
  case 74:
    $this.kind = 84;
    return;
  case 84:
    $this.kind = 74;
    return;
  case 82:
    $this.kind = 81;
    Node.invertBooleanCondition($this.children[0], cache);
    Node.invertBooleanCondition($this.children[1], cache);
    return;
  case 81:
    $this.kind = 82;
    Node.invertBooleanCondition($this.children[0], cache);
    Node.invertBooleanCondition($this.children[1], cache);
    return;
  case 79:
  case 75:
  case 80:
  case 76:
    if (!Type.isReal(TypeCache.commonImplicitType(cache, $this.children[0].type, $this.children[1].type), cache)) {
      switch ($this.kind) {
      case 79:
        $this.kind = 76;
        break;
      case 75:
        $this.kind = 80;
        break;
      case 80:
        $this.kind = 75;
        break;
      case 76:
        $this.kind = 79;
        break;
      }
      return;
    }
    break;
  }
  var children = Node.removeChildren($this);
  Node.become($this, Node.withType(Node.withChildren(new Node(61), [Node.withChildren(Node.clone($this), children)]), cache.boolType));
};
Node.blockAlwaysEndsWithReturn = function($this) {
  if (!Node.hasChildren($this)) {
    return false;
  }
  for (var i = $this.children.length - 1 | 0; i >= 0; i = i - 1 | 0) {
    var child = $this.children[i];
    switch (child.kind) {
    case 25:
    case 26:
      return true;
    case 20:
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
  return $this.kind === 34 && ($this.parent.kind !== 46 || $this !== $this.parent.children[1]) && (!NodeKind.isNamedDeclaration($this.parent.kind) || $this !== $this.parent.children[0]);
};
Node.isStorage = function($this) {
  return NodeKind.isUnaryStorageOperator($this.parent.kind) || NodeKind.isBinaryStorageOperator($this.parent.kind) && $this === $this.parent.children[0];
};
Node.hasChildren = function($this) {
  return $this.children !== null && $this.children.length > 0;
};
Node.indexInParent = function($this) {
  return $this.parent.children.indexOf($this);
};
Node.prependChild = function($this, node) {
  Node.insertChild($this, 0, node);
};
Node.prependChildren = function($this, nodes) {
  Node.insertChildren($this, 0, nodes);
};
Node.appendChild = function($this, node) {
  Node.insertChild($this, $this.children === null ? 0 : $this.children.length, node);
};
Node.appendChildren = function($this, nodes) {
  Node.insertChildren($this, $this.children === null ? 0 : $this.children.length, nodes);
};
Node.insertSiblingBefore = function($this, node) {
  Node.insertChild($this.parent, Node.indexInParent($this), node);
};
Node.insertSiblingAfter = function($this, node) {
  Node.insertChild($this.parent, Node.indexInParent($this) + 1 | 0, node);
};
Node.remove = function($this) {
  if ($this.parent !== null) {
    var index = Node.indexInParent($this);
    $this.parent.children[index] = null;
    $this.parent = null;
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
Node.insertChildren = function($this, index, nodes) {
  if ($this.children === null) {
    $this.children = [];
  }
  for (var i = 0; i < nodes.length; i = i + 1 | 0) {
    var node = nodes[i];
    Node.updateParent(node, $this);
    $this.children.splice((index = index + 1 | 0) - 1 | 0, 0, node);
  }
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
var NodeKind = {};
NodeKind.isStatement = function($this) {
  return $this >= 6 && $this <= 33;
};
NodeKind.isNamedBlockDeclaration = function($this) {
  return $this >= 7 && $this <= 13;
};
NodeKind.isNamedDeclaration = function($this) {
  return $this >= 7 && $this <= 19;
};
NodeKind.isEnum = function($this) {
  return $this >= 8 && $this <= 9;
};
NodeKind.isObject = function($this) {
  return $this >= 10 && $this <= 12;
};
NodeKind.isFunction = function($this) {
  return $this >= 14 && $this <= 15;
};
NodeKind.isExpression = function($this) {
  return $this >= 34 && $this <= 100;
};
NodeKind.isConstant = function($this) {
  return $this >= 38 && $this <= 44;
};
NodeKind.isCall = function($this) {
  return $this >= 48 && $this <= 49;
};
NodeKind.isUnaryOperator = function($this) {
  return $this >= 61 && $this <= 68;
};
NodeKind.isUnaryStorageOperator = function($this) {
  return $this >= 65 && $this <= 68;
};
NodeKind.isBinaryOperator = function($this) {
  return $this >= 69 && $this <= 99;
};
NodeKind.isBinaryStorageOperator = function($this) {
  return $this >= 89 && $this <= 99;
};
NodeKind.isCast = function($this) {
  return $this >= 54 && $this <= 55;
};
NodeKind.isReal = function($this) {
  return $this >= 42 && $this <= 43;
};
NodeKind.isBool = function($this) {
  return $this >= 39 && $this <= 40;
};
NodeKind.isLoop = function($this) {
  return $this >= 21 && $this <= 24;
};
NodeKind.isStorage = function($this) {
  return $this === 34 || $this === 46;
};
NodeKind.toString = function($this) {
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
    return "USING_ALIAS";
  case 20:
    return "IF";
  case 21:
    return "FOR";
  case 22:
    return "FOR_EACH";
  case 23:
    return "WHILE";
  case 24:
    return "DO_WHILE";
  case 25:
    return "RETURN";
  case 26:
    return "IMPLICIT_RETURN";
  case 27:
    return "BREAK";
  case 28:
    return "CONTINUE";
  case 29:
    return "ASSERT";
  case 30:
    return "EXPRESSION";
  case 31:
    return "SWITCH";
  case 32:
    return "MODIFIER";
  case 33:
    return "USING_NAMESPACE";
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
    return "TRUE";
  case 40:
    return "FALSE";
  case 41:
    return "INT";
  case 42:
    return "FLOAT";
  case 43:
    return "DOUBLE";
  case 44:
    return "STRING";
  case 45:
    return "INITIALIZER";
  case 46:
    return "DOT";
  case 47:
    return "LET";
  case 48:
    return "CALL";
  case 49:
    return "SUPER_CALL";
  case 50:
    return "ERROR";
  case 51:
    return "BIND";
  case 52:
    return "SEQUENCE";
  case 53:
    return "PARAMETERIZE";
  case 54:
    return "CAST";
  case 55:
    return "IMPLICIT_CAST";
  case 56:
    return "LAMBDA";
  case 57:
    return "DEFAULT";
  case 58:
    return "UNTYPED";
  case 59:
    return "VAR";
  case 60:
    return "FUNCTION_TYPE";
  case 61:
    return "NOT";
  case 62:
    return "POSITIVE";
  case 63:
    return "NEGATIVE";
  case 64:
    return "COMPLEMENT";
  case 65:
    return "PREFIX_INCREMENT";
  case 66:
    return "PREFIX_DECREMENT";
  case 67:
    return "POSTFIX_INCREMENT";
  case 68:
    return "POSTFIX_DECREMENT";
  case 69:
    return "ADD";
  case 70:
    return "BITWISE_AND";
  case 71:
    return "BITWISE_OR";
  case 72:
    return "BITWISE_XOR";
  case 73:
    return "DIVIDE";
  case 74:
    return "EQUAL";
  case 75:
    return "GREATER_THAN";
  case 76:
    return "GREATER_THAN_OR_EQUAL";
  case 77:
    return "IN";
  case 78:
    return "INDEX";
  case 79:
    return "LESS_THAN";
  case 80:
    return "LESS_THAN_OR_EQUAL";
  case 81:
    return "LOGICAL_AND";
  case 82:
    return "LOGICAL_OR";
  case 83:
    return "MULTIPLY";
  case 84:
    return "NOT_EQUAL";
  case 85:
    return "REMAINDER";
  case 86:
    return "SHIFT_LEFT";
  case 87:
    return "SHIFT_RIGHT";
  case 88:
    return "SUBTRACT";
  case 89:
    return "ASSIGN";
  case 90:
    return "ASSIGN_ADD";
  case 91:
    return "ASSIGN_BITWISE_AND";
  case 92:
    return "ASSIGN_BITWISE_OR";
  case 93:
    return "ASSIGN_BITWISE_XOR";
  case 94:
    return "ASSIGN_DIVIDE";
  case 95:
    return "ASSIGN_MULTIPLY";
  case 96:
    return "ASSIGN_REMAINDER";
  case 97:
    return "ASSIGN_SHIFT_LEFT";
  case 98:
    return "ASSIGN_SHIFT_RIGHT";
  case 99:
    return "ASSIGN_SUBTRACT";
  case 100:
    return "ASSIGN_INDEX";
  default:
    return "";
  }
};
var ContentType = {};
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
      }
    }
  }
  return false;
};
function IntContent(_0) {
  Content.call(this);
  this.value = _0;
}
$extends(IntContent, Content);
IntContent.prototype.type = function() {
  return 0;
};
function DoubleContent(_0) {
  Content.call(this);
  this.value = _0;
}
$extends(DoubleContent, Content);
DoubleContent.prototype.type = function() {
  return 1;
};
function StringContent(_0) {
  Content.call(this);
  this.value = _0;
}
$extends(StringContent, Content);
StringContent.prototype.type = function() {
  return 2;
};
var Associativity = {};
function OperatorInfo(_0, _1, _2) {
  this.text = _0;
  this.precedence = _1;
  this.associativity = _2;
}
var SortTypes = {};
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
    if (!SymbolKind.isTypeWithInstances(node.symbol.enclosingSymbol.kind)) {
      $this.freeFunctionSymbols.push(node.symbol);
    }
    break;
  case 6:
  case 20:
  case 21:
  case 22:
  case 23:
  case 24:
  case 25:
  case 27:
  case 28:
  case 29:
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
var TargetFormat = {};
TargetFormat.shouldRunResolver = function($this) {
  return $this >= 0 && $this <= 1;
};
function CompilerOptions() {
  this.targetFormat = 0;
  this.inputs = [];
  this.outputDirectory = "";
  this.outputFile = "";
  this.jsSourceMap = false;
  this.optimize = false;
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
  this.functionInliningTime = 0;
  this.constantFoldingTime = 0;
  this.emitTime = 0;
  this.lineCountingTime = 0;
  this.totalTime = 0;
  this.log = new Log();
}
Compiler.statistics = function($this, result) {
  var lineCountingStart = now();
  var lineCount = 0;
  for (var i = 0; i < result.options.inputs.length; i = i + 1 | 0) {
    lineCount = lineCount + Source.lineCount(result.options.inputs[i]) | 0;
  }
  var text = "Line count: " + lineCount.toString();
  $this.lineCountingTime += now() - lineCountingStart;
  var optimizingTime = $this.callGraphTime + $this.instanceToStaticTime + $this.functionInliningTime + $this.constantFoldingTime;
  text = text + "\nTotal compile time: " + (Math.round(($this.totalTime + $this.lineCountingTime) * 10) / 10).toString() + "ms";
  if ($this.tokenizingTime > 0) {
    text = text + "\n  Tokenizing: " + (Math.round($this.tokenizingTime * 10) / 10).toString() + "ms";
  }
  if ($this.parsingTime > 0) {
    text = text + "\n  Parsing: " + (Math.round($this.parsingTime * 10) / 10).toString() + "ms";
  }
  if ($this.resolvingTime > 0) {
    text = text + "\n  Resolving: " + (Math.round($this.resolvingTime * 10) / 10).toString() + "ms";
  }
  if (optimizingTime > 0) {
    text = text + "\n  Optimizing: " + (Math.round(optimizingTime * 10) / 10).toString() + "ms";
    text = text + "\n    Building call graph: " + (Math.round($this.callGraphTime * 10) / 10).toString() + "ms";
    text = text + "\n    Instance to static: " + (Math.round($this.instanceToStaticTime * 10) / 10).toString() + "ms";
    text = text + "\n    Function inlining: " + (Math.round($this.functionInliningTime * 10) / 10).toString() + "ms";
    text = text + "\n    Constant folding: " + (Math.round($this.constantFoldingTime * 10) / 10).toString() + "ms";
  }
  if ($this.emitTime > 0) {
    text = text + "\n  Emit: " + (Math.round($this.emitTime * 10) / 10).toString() + "ms";
  }
  if ($this.lineCountingTime > 0) {
    text = text + "\n  Counting lines: " + (Math.round($this.lineCountingTime * 10) / 10).toString() + "ms";
  }
  text = text + "\nInputs: " + result.options.inputs.length.toString();
  for (var i = 0; i < result.options.inputs.length; i = i + 1 | 0) {
    var source = result.options.inputs[i];
    text = text + "\n  " + source.name + ": " + bytesToString(source.contents.length);
  }
  if (result.outputs !== null) {
    text = text + "\nOutputs: " + result.outputs.length.toString();
    for (var i = 0; i < result.outputs.length; i = i + 1 | 0) {
      var source = result.outputs[i];
      text = text + "\n  " + source.name + ": " + bytesToString(source.contents.length);
    }
  }
  return text;
};
Compiler.compile = function($this, options) {
  var totalStart = now();
  var program = Node.withChildren(new Node(0), []);
  var outputs = null;
  if (Compiler.nativeLibrarySource !== null) {
    Node.appendChild(program, Node.clone(Compiler.nativeLibraryFile));
  } else {
    Compiler.nativeLibrarySource = new Source("<native>", NATIVE_LIBRARY);
    Compiler.processInput($this, program, Compiler.nativeLibrarySource);
    Compiler.nativeLibraryFile = Node.clone(program.children[0]);
  }
  options.inputs.unshift(Compiler.nativeLibrarySource);
  for (var i = 1; i < options.inputs.length; i = i + 1 | 0) {
    Compiler.processInput($this, program, options.inputs[i]);
  }
  var resolver;
  if (TargetFormat.shouldRunResolver(options.targetFormat)) {
    var resolveStart = now();
    resolver = new Resolver($this.log);
    Resolver.run(resolver, program);
    $this.resolvingTime += now() - resolveStart;
  }
  if ($this.log.errorCount === 0) {
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
      if (TargetFormat.shouldRunResolver(options.targetFormat)) {
        var callGraphStart = now();
        var graph = new CallGraph(program);
        $this.callGraphTime += now() - callGraphStart;
        var instanceToStaticStart = now();
        InstanceToStaticPass.run(graph, options);
        $this.instanceToStaticTime += now() - instanceToStaticStart;
        var functionInliningStart = now();
        FunctionInliningPass.run(graph, options);
        $this.functionInliningTime += now() - functionInliningStart;
        if (options.optimize) {
          var constantFoldingStart = now();
          ConstantFolder.foldConstants(resolver.constantFolder, program);
          $this.constantFoldingTime += now() - constantFoldingStart;
        }
      }
      var emitStart = now();
      outputs = emitter.emitProgram(program);
      $this.emitTime += now() - emitStart;
    }
  }
  $this.totalTime += now() - totalStart;
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
json.Emitter.prototype.emitProgram = function(program) {
  var outputs = [];
  if (this.options.outputFile.length > 0) {
    outputs.push(new Source(this.options.outputFile, json.dump(program) + "\n"));
  } else {
    for (var i = 0; i < program.children.length; i = i + 1 | 0) {
      var file = program.children[i];
      outputs.push(new Source(this.options.outputDirectory + "/" + (file.range.source.name + ".json"), json.dump(file) + "\n"));
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
    $this.result = $this.result + "null";
    return;
  }
  var outer = $this.indent;
  $this.indent = $this.indent + "  ";
  $this.result = $this.result + "{\n" + $this.indent + "\"kind\": " + string.append(string.append("\"", replace(NodeKind.toString(node.kind).toLowerCase(), "_", "-")), "\"");
  if (node.content !== null) {
    $this.result = $this.result + ",\n" + $this.indent + "\"content\": ";
    switch (node.content.type()) {
    case 0:
      $this.result = $this.result + node.content.value.toString();
      break;
    case 1:
      $this.result = $this.result + node.content.value.toString();
      break;
    case 2:
      $this.result = $this.result + quoteString(node.content.value, 34);
      break;
    }
  }
  if (Node.hasChildren(node)) {
    $this.result = $this.result + ",\n" + $this.indent + "\"children\": [";
    var inner = $this.indent;
    $this.indent = $this.indent + "  ";
    for (var i = 0; i < node.children.length; i = i + 1 | 0) {
      if (i > 0) {
        $this.result = $this.result + ",";
      }
      $this.result = $this.result + "\n" + $this.indent;
      json.DumpVisitor.visit($this, node.children[i]);
    }
    $this.indent = inner;
    $this.result = $this.result + "\n" + $this.indent + "]";
  }
  $this.indent = outer;
  $this.result = $this.result + "\n" + $this.indent + "}";
};
var lisp = {};
lisp.Emitter = function(_0) {
  this.options = _0;
};
lisp.Emitter.prototype.emitProgram = function(program) {
  var outputs = [];
  if (this.options.outputFile.length > 0) {
    outputs.push(new Source(this.options.outputFile, lisp.dump(program) + "\n"));
  } else {
    for (var i = 0; i < program.children.length; i = i + 1 | 0) {
      var file = program.children[i];
      outputs.push(new Source(this.options.outputDirectory + "/" + (file.range.source.name + ".lisp"), lisp.dump(file) + "\n"));
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
    $this.result = $this.result + "nil";
    return;
  }
  $this.result = $this.result + "(" + replace(NodeKind.toString(node.kind).toLowerCase(), "_", "-");
  if (node.content !== null) {
    switch (node.content.type()) {
    case 0:
      $this.result = $this.result + " " + node.content.value.toString();
      break;
    case 1:
      $this.result = $this.result + " " + node.content.value.toString();
      break;
    case 2:
      $this.result = $this.result + " " + quoteString(node.content.value, 34);
      break;
    }
  }
  if (Node.hasChildren(node)) {
    var old = $this.indent;
    $this.indent = $this.indent + "  ";
    for (var i = 0; i < node.children.length; i = i + 1 | 0) {
      $this.result = $this.result + "\n" + $this.indent;
      lisp.DumpVisitor.visit($this, node.children[i]);
    }
    $this.indent = old;
  }
  $this.result = $this.result + ")";
};
var xml = {};
xml.Emitter = function(_0) {
  this.options = _0;
};
xml.Emitter.prototype.emitProgram = function(program) {
  var outputs = [];
  if (this.options.outputFile.length > 0) {
    outputs.push(new Source(this.options.outputFile, xml.dump(program) + "\n"));
  } else {
    for (var i = 0; i < program.children.length; i = i + 1 | 0) {
      var file = program.children[i];
      outputs.push(new Source(this.options.outputDirectory + "/" + (file.range.source.name + ".xml"), xml.dump(file) + "\n"));
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
    $this.result = $this.result + "<null/>";
    return;
  }
  $this.result = $this.result + "<" + replace(NodeKind.toString(node.kind).toLowerCase(), "_", "-");
  if (node.content !== null) {
    $this.result = $this.result + " content=";
    switch (node.content.type()) {
    case 0:
      $this.result = $this.result + string.append(string.append("\"", node.content.value.toString()), "\"");
      break;
    case 1:
      $this.result = $this.result + string.append(string.append("\"", node.content.value.toString()), "\"");
      break;
    case 2:
      $this.result = $this.result + quoteString(node.content.value, 34);
      break;
    }
  }
  if (Node.hasChildren(node)) {
    $this.result = $this.result + ">";
    var inner = $this.indent;
    $this.indent = $this.indent + "  ";
    for (var i = 0; i < node.children.length; i = i + 1 | 0) {
      $this.result = $this.result + "\n" + $this.indent;
      xml.DumpVisitor.visit($this, node.children[i]);
    }
    $this.indent = inner;
    $this.result = $this.result + "\n" + $this.indent + "</" + replace(NodeKind.toString(node.kind).toLowerCase(), "_", "-") + ">";
  } else {
    $this.result = $this.result + "/>";
  }
};
var DiagnosticKind = {};
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
Log.toString = function($this) {
  var result = "";
  for (var i = 0; i < $this.diagnostics.length; i = i + 1 | 0) {
    var diagnostic = $this.diagnostics[i];
    var formatted = Range.format(diagnostic.range, 0);
    result = result + Range.locationString(diagnostic.range) + (diagnostic.kind === 0 ? ": error: " : ": warning: ") + diagnostic.text + "\n" + formatted.line + "\n" + formatted.range + "\n";
    if (!(diagnostic.noteRange.source === null)) {
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
  return $this.source.name + ":" + (location.line + 1 | 0).toString() + ":" + (location.column + 1 | 0).toString();
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
  return new FormattedRange(line, repeat(" ", a) + ((b - a | 0) < 2 ? "^" : repeat("~", b - a | 0)));
};
Range.span = function(start, end) {
  return new Range(start.source, start.start, end.end);
};
Range.inner = function(start, end) {
  return new Range(start.source, start.end, end.start);
};
Range.before = function(outer, inner) {
  return new Range(outer.source, outer.start, inner.start);
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
var ByteSize = {};
var trace = {};
var io = {};
io.Color = {};
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
    Node.insertChild($this.$function.children[2], 0, Node.createVariableCluster(new Node(50), [Node.withChildren(new Node(16), [Node.withContent(new Node(34), new StringContent("$this")), null, new Node(36)])]));
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
  this.liveSymbols = new IntMap();
  this.currentSource = null;
  this.options = _0;
  this.cache = _1;
};
js.Emitter.prototype.emitProgram = function(program) {
  js.Emitter.patchNode(this, program, new js.PatchContext());
  this.currentSource = new Source(this.options.outputFile, "");
  var collector = new Collector(program, 3);
  if (this.needMathImul) {
    js.Emitter.emit(this, "var $imul = Math.imul || function(a, b) {\n  var ah = a >>> 16, al = a & 0xFFFF;\n  var bh = b >>> 16, bl = b & 0xFFFF;\n  return al * bl + (ah * bl + al * bh << 16) | 0;\n};\n");
  }
  if (this.needExtends) {
    js.Emitter.emit(this, "function $extends(derived, base) {\n  derived.prototype = Object.create(base.prototype);\n  derived.prototype.constructor = derived;\n}\n");
  }
  for (var i = 0; i < collector.typeSymbols.length; i = i + 1 | 0) {
    var type = collector.typeSymbols[i].type;
    if (Type.isNamespace(type)) {
      if (!((type.symbol.flags & 2048) !== 0)) {
        js.Emitter.emitNode(this, Node.firstNonExtensionSibling(type.symbol.node));
      }
      continue;
    }
    if (!((type.symbol.flags & 2048) !== 0)) {
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
      if (symbol.enclosingSymbol === type.symbol && symbol.node !== null && SymbolKind.isFunction(symbol.kind) && !(symbol.kind === 17)) {
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
  if (this.options.jsSourceMap) {
    this.currentSource.contents = this.currentSource.contents + "/" + "/# sourceMappingURL=data:application/json;base64," + encodeBase64(SourceMapGenerator.toString(this.generator));
  }
  return [this.currentSource];
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
js.Emitter.increaseIndent = function($this) {
  $this.indent = $this.indent + "  ";
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
  $this.currentSource.contents = $this.currentSource.contents + text;
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
    if (statement !== null && statement.kind === 20) {
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
  case 20:
    js.Emitter.emitIf($this, node);
    break;
  case 21:
    js.Emitter.emitFor($this, node);
    break;
  case 23:
    js.Emitter.emitWhile($this, node);
    break;
  case 24:
    js.Emitter.emitDoWhile($this, node);
    break;
  case 25:
  case 26:
    js.Emitter.emitReturn($this, node);
    break;
  case 27:
    js.Emitter.emitBreak($this, node);
    break;
  case 28:
    js.Emitter.emitContinue($this, node);
    break;
  case 29:
    js.Emitter.emitAssert($this, node);
    break;
  case 30:
    js.Emitter.emitExpressionStatement($this, node);
    break;
  case 31:
    js.Emitter.emitSwitch($this, node);
    break;
  case 32:
    js.Emitter.emitModifier($this, node);
    break;
  case 17:
  case 19:
  case 18:
  case 33:
    break;
  default:
    break;
  }
};
js.Emitter.emitBlock = function($this, node) {
  js.Emitter.emit($this, "{\n");
  js.Emitter.increaseIndent($this);
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
  js.Emitter.increaseIndent($this);
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
    var isCompoundName = variable.symbol !== null && js.Emitter.hasCompoundName($this, variable.symbol);
    if ((variable.symbol === null || !SymbolKind.isInstance(variable.symbol.kind)) && (!isCompoundName || variable.children[2] !== null)) {
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
  if (!js.Emitter.hasCompoundName($this, node.symbol)) {
    js.Emitter.emit($this, "var ");
  }
  js.Emitter.emit($this, $this.indent + js.Emitter.fullName($this, node.symbol) + " = {};\n");
};
js.Emitter.emitEnum = function($this, node) {
  var block = node.children[1];
  if (!js.Emitter.hasCompoundName($this, node.symbol)) {
    js.Emitter.emit($this, "var ");
  }
  if ($this.options.optimize && !Symbol.isImportOrExport(node.symbol)) {
    js.Emitter.emit($this, $this.indent + js.Emitter.fullName($this, node.symbol) + " = {};\n");
  } else {
    js.Emitter.emit($this, $this.indent + js.Emitter.fullName($this, node.symbol) + " = {\n");
    js.Emitter.increaseIndent($this);
    for (var i = 0; i < block.children.length; i = i + 1 | 0) {
      var symbol = block.children[i].symbol;
      js.Emitter.emit($this, $this.indent + js.Emitter.mangleName($this, symbol) + ": " + symbol.enumValue.toString() + (i === (block.children.length - 1 | 0) ? "\n" : ",\n"));
    }
    js.Emitter.decreaseIndent($this);
    js.Emitter.emit($this, $this.indent + "};\n");
  }
};
js.Emitter.emitFunction = function($this, node) {
  var block = node.children[2];
  var symbol = node.symbol;
  if (block === null || !Symbol.isImportOrExport(symbol) && (symbol.flags & 32768) !== 0 && !$this.liveSymbols.has(symbol.uniqueID)) {
    return;
  }
  var isCompoundName = js.Emitter.hasCompoundName($this, symbol);
  if (!isCompoundName) {
    js.Emitter.emit($this, $this.indent + "function " + js.Emitter.fullName($this, symbol));
  } else {
    js.Emitter.emit($this, $this.indent + js.Emitter.fullName($this, symbol) + " = function");
  }
  js.Emitter.emitArgumentVariables($this, node.children[1].children);
  js.Emitter.emit($this, " ");
  js.Emitter.emit($this, "{\n");
  js.Emitter.increaseIndent($this);
  js.Emitter.emitChildren($this, block);
  js.Emitter.decreaseIndent($this);
  js.Emitter.emit($this, $this.indent + (isCompoundName ? "};\n" : "}\n"));
  if (node.kind === 14) {
    var type = symbol.enclosingSymbol.type;
    if (Type.isClass(type) && Type.baseClass(type) !== null) {
      js.Emitter.emit($this, $this.indent + "$extends(" + js.Emitter.fullName($this, type.symbol) + ", " + js.Emitter.fullName($this, Type.baseClass(type).symbol) + ");\n");
    }
  }
};
js.Emitter.emitVariable = function($this, node) {
  var value = node.children[2];
  js.Emitter.emit($this, node.symbol === null ? node.children[0].content.value : js.Emitter.fullName($this, node.symbol));
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
  if (value.kind !== 40 && !$this.options.optimize) {
    var couldBeFalse = value.kind !== 39;
    if (couldBeFalse) {
      js.Emitter.emit($this, $this.indent + "if (");
      js.Emitter.emitExpression($this, value, 0);
      js.Emitter.emit($this, ") {\n");
      js.Emitter.increaseIndent($this);
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
js.Emitter.emitModifier = function($this, node) {
  js.Emitter.emitNodes($this, Node.modifierStatements(node));
};
js.Emitter.emitExpression = function($this, node, precedence) {
  var wasStartOfExpression = $this.isStartOfExpression;
  $this.isStartOfExpression = false;
  js.Emitter.addMapping($this, node);
  switch (node.kind) {
  case 34:
    js.Emitter.emit($this, node.symbol === null ? node.content.value : js.Emitter.fullName($this, node.symbol));
    break;
  case 35:
    js.Emitter.emit($this, js.Emitter.fullName($this, node.type.symbol));
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
    js.Emitter.emit($this, "true");
    break;
  case 40:
    js.Emitter.emit($this, "false");
    break;
  case 41:
    js.Emitter.emitInt($this, node);
    break;
  case 42:
  case 43:
    js.Emitter.emitDouble($this, node);
    break;
  case 44:
    js.Emitter.emit($this, quoteString(node.content.value, 34));
    break;
  case 45:
    js.Emitter.emitInitializer($this, node);
    break;
  case 46:
    js.Emitter.emitDot($this, node);
    break;
  case 48:
    $this.isStartOfExpression = wasStartOfExpression;
    js.Emitter.emitCall($this, node);
    break;
  case 49:
    js.Emitter.emitSuperCall($this, node);
    break;
  case 51:
    js.Emitter.emitExpression($this, node.children[0], precedence);
    break;
  case 52:
    $this.isStartOfExpression = wasStartOfExpression;
    js.Emitter.emitSequence($this, node, precedence);
    break;
  case 56:
    js.Emitter.emitLambda($this, node, wasStartOfExpression);
    break;
  case 57:
    js.Emitter.emitDefault($this, node);
    break;
  case 58:
    js.Emitter.emitExpression($this, node.children[0], precedence);
    break;
  case 78:
    js.Emitter.emitIndex($this, node, precedence);
    break;
  case 100:
    js.Emitter.emitTertiary($this, node, precedence);
    break;
  case 54:
  case 55:
    $this.isStartOfExpression = wasStartOfExpression;
    js.Emitter.emitExpression($this, node.children[1], precedence);
    break;
  case 61:
  case 62:
  case 63:
  case 64:
  case 65:
  case 66:
  case 67:
  case 68:
    js.Emitter.emitUnary($this, node, precedence);
    break;
  case 69:
  case 89:
  case 90:
  case 91:
  case 92:
  case 93:
  case 94:
  case 95:
  case 96:
  case 97:
  case 98:
  case 99:
  case 70:
  case 71:
  case 72:
  case 73:
  case 74:
  case 75:
  case 76:
  case 77:
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
  js.Emitter.emit($this, node.content.value.toString());
  if (node.parent.kind === 46) {
    js.Emitter.emit($this, ".");
  }
};
js.Emitter.emitDouble = function($this, node) {
  var text = node.content.value.toString();
  js.Emitter.emit($this, text);
  if (node.parent.kind === 46 && text.indexOf(".") < 0) {
    js.Emitter.emit($this, ".");
  }
};
js.Emitter.emitInitializer = function($this, node) {
  js.Emitter.emit($this, "[");
  js.Emitter.emitCommaSeparatedExpressions($this, node.children);
  js.Emitter.emit($this, "]");
};
js.Emitter.emitDot = function($this, node) {
  js.Emitter.emitExpression($this, node.children[0], 15);
  js.Emitter.emit($this, ".");
  var name = node.children[1];
  js.Emitter.emit($this, name.symbol === null ? name.content.value : SymbolKind.isInstance(name.symbol.kind) ? js.Emitter.mangleName($this, name.symbol) : js.Emitter.fullName($this, name.symbol));
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
  js.Emitter.emit($this, js.Emitter.fullName($this, node.symbol));
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
js.Emitter.emitDefault = function($this, node) {
  if (Type.isNumeric(node.type, $this.cache)) {
    js.Emitter.emit($this, "0");
  } else if (node.type === $this.cache.boolType) {
    js.Emitter.emit($this, "false");
  } else if (Type.isReference(node.type)) {
    js.Emitter.emit($this, "null");
  } else {
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
    if (node.kind === 62 && (value.kind === 62 || value.kind === 65) || node.kind === 63 && (value.kind === 63 || value.kind === 66 || value.kind === 41 && value.content.value < 0)) {
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
js.Emitter.emitBinary = function($this, node, precedence) {
  var info = operatorInfo.get(node.kind);
  if (info.precedence < precedence) {
    js.Emitter.emit($this, "(");
  }
  js.Emitter.emitExpression($this, node.children[0], info.precedence + (info.associativity === 2 | 0) | 0);
  js.Emitter.emit($this, node.kind === 74 ? " === " : node.kind === 84 ? " !== " : " " + info.text + " ");
  js.Emitter.emitExpression($this, node.children[1], info.precedence + (info.associativity === 1 | 0) | 0);
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
  case 71:
  case 70:
  case 72:
  case 86:
  case 87:
  case 92:
  case 91:
  case 93:
  case 97:
  case 98:
    return true;
  default:
    return false;
  }
};
js.Emitter.isExpressionUsed = function(node) {
  var parent = node.parent;
  if (!NodeKind.isExpression(parent.kind)) {
    return false;
  }
  if (parent.kind === 52 && (!js.Emitter.isExpressionUsed(parent) || parent.children.indexOf(node) < (parent.children.length - 1 | 0))) {
    return false;
  }
  return true;
};
js.Emitter.patchNode = function($this, node, context) {
  switch (node.kind) {
  case 56:
    context.lambdaCount = context.lambdaCount + 1 | 0;
    break;
  case 14:
    js.Emitter.patchConstructor($this, node, context);
    break;
  case 15:
    js.PatchContext.setFunction(context, node);
    break;
  case 51:
    js.Emitter.patchBind($this, node, context);
    break;
  case 54:
    js.Emitter.patchCast($this, node, context);
    break;
  case 10:
    if (!((node.symbol.flags & 2048) !== 0) && Type.baseClass(node.symbol.type) !== null) {
      $this.needExtends = true;
    }
    break;
  case 36:
    if (context.lambdaCount > 0) {
      Node.become(node, js.PatchContext.thisAlias(context));
    }
    break;
  case 34:
    if (node.symbol !== null && SymbolKind.isInstance(node.symbol.kind) && Node.isNameExpression(node)) {
      Node.become(node, Node.withChildren(new Node(46), [new Node(36), Node.clone(node)]));
    }
    break;
  case 69:
  case 88:
  case 83:
  case 73:
  case 85:
    if (node.type === $this.cache.intType && (node.kind === 83 || !js.Emitter.alwaysConvertsOperandsToInt(node.parent.kind))) {
      Node.become(node, Node.withRange(js.Emitter.createBinaryInt($this, node.kind, Node.remove(node.children[0]), Node.remove(node.children[1])), node.range));
    }
    break;
  case 65:
  case 66:
  case 68:
  case 67:
    js.Emitter.patchUnary($this, node, context);
    break;
  case 90:
  case 99:
  case 95:
  case 94:
  case 96:
    js.Emitter.patchAssign($this, node, context);
    break;
  }
  if (node.kind === 47) {
    var value = node.children[1];
    var variable = node.children[0];
    Node.become(node, Node.createCall(Node.createLambda([Node.remove(variable)], Node.withChildren(new Node(2), [Node.withChildren(new Node(25), [Node.remove(value)])])), [Node.remove(variable.children[2])]));
  }
  var symbol = node.symbol;
  if (symbol !== null && SymbolKind.isFunction(symbol.kind) && node !== symbol.node && node !== symbol.node.children[0]) {
    $this.liveSymbols.set(symbol.uniqueID, true);
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
  case 56:
    context.lambdaCount = context.lambdaCount - 1 | 0;
    break;
  case 14:
  case 15:
    js.PatchContext.setFunction(context, null);
    break;
  }
};
js.Emitter.patchAssign = function($this, node, context) {
  if (node.type === $this.cache.intType) {
    var isPostfix = node.kind === 67 || node.kind === 68;
    var isIncrement = node.kind === 65 || node.kind === 67;
    var left = node.children[0];
    var right = node.children[1];
    var kind = node.kind === 90 ? 69 : node.kind === 99 ? 88 : node.kind === 95 ? 83 : node.kind === 94 ? 73 : 85;
    Node.become(node, Node.withRange(js.Emitter.createBinaryIntAssignment($this, context, kind, Node.remove(left), Node.remove(right)), node.range));
  }
};
js.Emitter.patchUnary = function($this, node, context) {
  if (node.type === $this.cache.intType) {
    var isPostfix = node.kind === 67 || node.kind === 68;
    var isIncrement = node.kind === 65 || node.kind === 67;
    var result = js.Emitter.createBinaryIntAssignment($this, context, isIncrement ? 69 : 88, Node.remove(node.children[0]), Node.withContent(new Node(41), new IntContent(1)));
    if (isPostfix && js.Emitter.isExpressionUsed(node)) {
      result = js.Emitter.createBinaryInt($this, isIncrement ? 88 : 69, result, Node.withContent(new Node(41), new IntContent(1)));
    }
    Node.become(node, Node.withType(Node.withRange(result, node.range), node.type));
  }
};
js.Emitter.patchCast = function($this, node, context) {
  var value = node.children[1];
  if (node.type === $this.cache.boolType && !(value.type === $this.cache.boolType)) {
    Node.become(node, Node.withType(Node.withRange(Node.withChildren(new Node(61), [Node.remove(value)]), node.range), node.type));
  } else if (node.type === $this.cache.intType && !Type.isInteger(value.type, $this.cache) && !js.Emitter.alwaysConvertsOperandsToInt(node.parent.kind)) {
    Node.become(node, Node.withType(Node.withRange(Node.createBinary(71, Node.remove(value), Node.withContent(new Node(41), new IntContent(0))), node.range), node.type));
  } else if (Type.isReal(node.type, $this.cache) && !Type.isNumeric(value.type, $this.cache)) {
    Node.become(node, Node.withType(Node.withRange(Node.withChildren(new Node(62), [Node.remove(value)]), node.range), node.type));
  }
};
js.Emitter.patchBind = function($this, node, context) {
  if (node.symbol.kind === 16) {
    var $function = node.children[0];
    var target;
    var name;
    if ($function.kind === 46) {
      target = Node.remove($function.children[0]);
      name = Node.remove($function.children[1]);
    } else {
      target = new Node(36);
      name = Node.remove($function);
    }
    if (js.Emitter.isSimpleNameAccess(target)) {
      Node.become(node, Node.withRange(Node.createCall(Node.withChildren(new Node(46), [Node.withChildren(new Node(46), [Node.clone(target), name]), Node.withContent(new Node(34), new StringContent("bind"))]), [target]), node.range));
    } else {
      var temporaryName = Node.withContent(new Node(34), new StringContent("$temp"));
      Node.become(node, Node.withRange(Node.withChildren(new Node(47), [Node.withChildren(new Node(16), [Node.clone(temporaryName), null, target]), Node.createCall(Node.withChildren(new Node(46), [Node.withChildren(new Node(46), [Node.clone(temporaryName), name]), Node.withContent(new Node(34), new StringContent("bind"))]), [temporaryName])]), node.range));
    }
  }
};
js.Emitter.patchConstructor = function($this, node, context) {
  var superInitializer = node.children[3];
  var memberInitializers = node.children[4];
  var block = node.children[2];
  var index = 0;
  if (superInitializer !== null) {
    Node.insertChild(block, (index = index + 1 | 0) - 1 | 0, Node.withChildren(new Node(30), [Node.remove(superInitializer)]));
  }
  if (memberInitializers !== null) {
    for (var i = 0; i < memberInitializers.children.length; i = i + 1 | 0) {
      var child = memberInitializers.children[i];
      Node.insertChild(block, (index = index + 1 | 0) - 1 | 0, Node.withChildren(new Node(30), [Node.createBinary(89, Node.remove(child.children[0]), Node.remove(child.children[1]))]));
    }
  }
  js.PatchContext.setFunction(context, node);
};
js.Emitter.createBinaryInt = function($this, kind, left, right) {
  if (kind === 83) {
    $this.needMathImul = true;
    return Node.withType(Node.createCall(Node.withContent(new Node(34), new StringContent("$imul")), [left, right]), $this.cache.intType);
  }
  return Node.withType(Node.createBinary(71, Node.withType(Node.createBinary(kind, left, right), $this.cache.intType), Node.withType(Node.withContent(new Node(41), new IntContent(0)), $this.cache.intType)), $this.cache.intType);
};
js.Emitter.isSimpleNameAccess = function(node) {
  return node.kind === 34 || node.kind === 36 || node.kind === 46 && js.Emitter.isSimpleNameAccess(node.children[0]);
};
js.Emitter.createBinaryIntAssignment = function($this, context, kind, left, right) {
  if (js.Emitter.isSimpleNameAccess(left)) {
    return Node.createBinary(89, Node.clone(left), js.Emitter.createBinaryInt($this, kind, left, right));
  }
  var target = Node.remove(left.children[0]);
  var temporaryName = Node.withContent(new Node(34), new StringContent("$temp"));
  var dot = Node.withChildren(new Node(46), [temporaryName, Node.remove(left.children[1])]);
  return Node.withType(Node.withChildren(new Node(47), [Node.withChildren(new Node(16), [Node.clone(temporaryName), null, target]), Node.withType(Node.createBinary(89, dot, js.Emitter.createBinaryInt($this, kind, Node.clone(dot), right)), $this.cache.intType)]), $this.cache.intType);
};
js.Emitter.hasCompoundName = function($this, symbol) {
  var enclosingSymbol = symbol.enclosingSymbol;
  return enclosingSymbol !== null && !(enclosingSymbol.kind === 8) && (!(symbol.kind === 17) || js.Emitter.hasCompoundName($this, enclosingSymbol));
};
js.Emitter.createIsKeyword = function() {
  var result = new StringMap();
  result.set("arguments", true);
  result.set("call", true);
  result.set("apply", true);
  result.set("constructor", true);
  result.set("function", true);
  result.set("throw", true);
  result.set("this", true);
  return result;
};
js.Emitter.mangleName = function($this, symbol) {
  if (Symbol.isImportOrExport(symbol)) {
    return symbol.name;
  }
  if (symbol.kind === 17) {
    return js.Emitter.mangleName($this, symbol.enclosingSymbol);
  }
  if (js.Emitter.isKeyword.has(symbol.name)) {
    return "$" + symbol.name;
  }
  return symbol.name;
};
js.Emitter.fullName = function($this, symbol) {
  var enclosingSymbol = symbol.enclosingSymbol;
  if (enclosingSymbol !== null && !(enclosingSymbol.kind === 8)) {
    var enclosingName = js.Emitter.fullName($this, enclosingSymbol);
    if (symbol.kind === 17) {
      return enclosingName;
    }
    if (SymbolKind.isInstance(symbol.kind)) {
      enclosingName = enclosingName + ".prototype";
    }
    return enclosingName + "." + js.Emitter.mangleName($this, symbol);
  }
  return js.Emitter.mangleName($this, symbol);
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
      result = result + ",";
    } else {
      previousGeneratedColumn = 0;
      while (previousGeneratedLine < generatedLine) {
        result = result + ";";
        previousGeneratedLine = previousGeneratedLine + 1 | 0;
      }
    }
    result = result + SourceMapGenerator.encodeVLQ(mapping.generatedColumn - previousGeneratedColumn | 0);
    previousGeneratedColumn = mapping.generatedColumn;
    result = result + SourceMapGenerator.encodeVLQ(mapping.sourceIndex - previousSourceIndex | 0);
    previousSourceIndex = mapping.sourceIndex;
    result = result + SourceMapGenerator.encodeVLQ(mapping.originalLine - previousOriginalLine | 0);
    previousOriginalLine = mapping.originalLine;
    result = result + SourceMapGenerator.encodeVLQ(mapping.originalColumn - previousOriginalColumn | 0);
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
    encoded = encoded + BASE64[digit];
  } while (vlq > 0);
  return encoded;
};
var TokenKind = {};
TokenKind.toString = function($this) {
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
    return "CONTINUE";
  case 23:
    return "DECREMENT";
  case 24:
    return "DEFAULT";
  case 25:
    return "DIVIDE";
  case 26:
    return "DO";
  case 27:
    return "DOT";
  case 28:
    return "DOUBLE";
  case 29:
    return "ELSE";
  case 30:
    return "END_OF_FILE";
  case 31:
    return "ENUM";
  case 32:
    return "EQUAL";
  case 33:
    return "ERROR";
  case 34:
    return "EXPORT";
  case 35:
    return "FALSE";
  case 36:
    return "FINAL";
  case 37:
    return "FLOAT";
  case 38:
    return "FN";
  case 39:
    return "FOR";
  case 40:
    return "GREATER_THAN";
  case 41:
    return "GREATER_THAN_OR_EQUAL";
  case 42:
    return "IDENTIFIER";
  case 43:
    return "IF";
  case 44:
    return "IMPORT";
  case 45:
    return "IN";
  case 46:
    return "INCREMENT";
  case 47:
    return "INLINE";
  case 48:
    return "INTERFACE";
  case 49:
    return "INT_BINARY";
  case 50:
    return "INT_DECIMAL";
  case 51:
    return "INT_HEX";
  case 52:
    return "INT_OCTAL";
  case 53:
    return "IS";
  case 54:
    return "LAMBDA";
  case 55:
    return "LEFT_BRACE";
  case 56:
    return "LEFT_BRACKET";
  case 57:
    return "LEFT_PARENTHESIS";
  case 58:
    return "LESS_THAN";
  case 59:
    return "LESS_THAN_OR_EQUAL";
  case 60:
    return "LET";
  case 61:
    return "LOGICAL_AND";
  case 62:
    return "LOGICAL_OR";
  case 63:
    return "MINUS";
  case 64:
    return "MULTIPLY";
  case 65:
    return "NAMESPACE";
  case 66:
    return "NEW";
  case 67:
    return "NOT";
  case 68:
    return "NOT_EQUAL";
  case 69:
    return "NULL";
  case 70:
    return "OVERRIDE";
  case 71:
    return "PLUS";
  case 72:
    return "PRIVATE";
  case 73:
    return "PROTECTED";
  case 74:
    return "PUBLIC";
  case 75:
    return "QUESTION_MARK";
  case 76:
    return "REMAINDER";
  case 77:
    return "RETURN";
  case 78:
    return "RIGHT_BRACE";
  case 79:
    return "RIGHT_BRACKET";
  case 80:
    return "RIGHT_PARENTHESIS";
  case 81:
    return "SEMICOLON";
  case 82:
    return "SHIFT_LEFT";
  case 83:
    return "SHIFT_RIGHT";
  case 84:
    return "STATIC";
  case 85:
    return "STRING";
  case 86:
    return "STRUCT";
  case 87:
    return "SUPER";
  case 88:
    return "SWITCH";
  case 89:
    return "THIS";
  case 90:
    return "TILDE";
  case 91:
    return "TRUE";
  case 92:
    return "UNTYPED";
  case 93:
    return "USING";
  case 94:
    return "VAR";
  case 95:
    return "VIRTUAL";
  case 96:
    return "WHILE";
  case 97:
    return "WHITESPACE";
  case 98:
    return "YY_INVALID_ACTION";
  case 99:
    return "START_PARAMETER_LIST";
  case 100:
    return "END_PARAMETER_LIST";
  default:
    return "";
  }
};
function Token(_0, _1, _2) {
  this.range = _0;
  this.kind = _1;
  this.text = _2;
}
var Precedence = {};
var StatementHint = {};
var TokenScan = {};
var AllowLambda = {};
var AllowTrailingComma = {};
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
    return Node.withRange(new Node(50), ParserContext.spanSince(context, token.range));
  }
  var node = Pratt.resumeIgnoringParselet($this, context, precedence, parselet.prefix(context), parseletToIgnore);
  return node;
};
Pratt.resumeIgnoringParselet = function($this, context, precedence, left, parseletToIgnore) {
  while (!(left.kind === 50)) {
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
  if (node.kind === 48) {
    var value = node.children[0];
    if (value.symbol !== null && SymbolKind.isFunction(value.symbol.kind)) {
      CallGraph.recordCallSite($this, value.symbol, node);
    }
  } else if (node.kind === 51) {
    CallGraph.recordCallSite($this, node.symbol, node);
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
ConstantFolder.flattenBool = function($this, node, value) {
  Node.removeChildren(node);
  node.kind = value ? 39 : 40;
  node.content = null;
};
ConstantFolder.flattenInt = function($this, node, value) {
  Node.removeChildren(node);
  node.kind = 41;
  node.content = new IntContent(value);
};
ConstantFolder.flattenReal = function($this, node, value) {
  Node.removeChildren(node);
  node.kind = node.type === $this.cache.floatType ? 42 : 43;
  node.content = new DoubleContent(value);
};
ConstantFolder.foldConstants = function($this, node) {
  var kind = node.kind;
  if (Node.hasChildren(node)) {
    for (var i = 0; i < node.children.length; i = i + 1 | 0) {
      var child = node.children[i];
      if (child !== null) {
        ConstantFolder.foldConstants($this, child);
      }
    }
  }
  if (kind === 34) {
    if (node.symbol !== null && Symbol.isEnumValue(node.symbol)) {
      ConstantFolder.flattenInt($this, node, node.symbol.enumValue);
    }
  } else if (NodeKind.isCast(kind)) {
    var type = node.children[0].type;
    var value = node.children[1];
    var valueKind = value.kind;
    if (NodeKind.isBool(valueKind)) {
      if (type === $this.cache.boolType) {
        ConstantFolder.flattenBool($this, node, value.kind === 39);
      } else if (Type.isInteger(type, $this.cache)) {
        ConstantFolder.flattenInt($this, node, value.kind === 39 | 0);
      } else if (Type.isReal(type, $this.cache)) {
        ConstantFolder.flattenReal($this, node, +(value.kind === 39));
      }
    } else if (valueKind === 41) {
      if (type === $this.cache.boolType) {
        ConstantFolder.flattenBool($this, node, !value.content.value);
      } else if (Type.isInteger(type, $this.cache)) {
        ConstantFolder.flattenInt($this, node, value.content.value);
      } else if (Type.isReal(type, $this.cache)) {
        ConstantFolder.flattenReal($this, node, value.content.value);
      }
    } else if (NodeKind.isReal(valueKind)) {
      if (type === $this.cache.boolType) {
        ConstantFolder.flattenBool($this, node, !value.content.value);
      } else if (Type.isInteger(type, $this.cache)) {
        ConstantFolder.flattenInt($this, node, value.content.value | 0);
      } else if (Type.isReal(type, $this.cache)) {
        ConstantFolder.flattenReal($this, node, value.content.value);
      }
    }
  } else if (NodeKind.isUnaryOperator(kind)) {
    var value = node.children[0];
    var valueKind = value.kind;
    if (NodeKind.isBool(valueKind)) {
      if (kind === 61) {
        ConstantFolder.flattenBool($this, node, !(value.kind === 39));
      }
    } else if (valueKind === 41) {
      if (kind === 62) {
        ConstantFolder.flattenInt($this, node, +value.content.value);
      } else if (kind === 63) {
        ConstantFolder.flattenInt($this, node, -value.content.value);
      } else if (kind === 64) {
        ConstantFolder.flattenInt($this, node, ~value.content.value);
      }
    } else if (NodeKind.isReal(valueKind)) {
      if (kind === 62) {
        ConstantFolder.flattenReal($this, node, +value.content.value);
      } else if (kind === 63) {
        ConstantFolder.flattenReal($this, node, -value.content.value);
      }
    }
  } else if (NodeKind.isBinaryOperator(kind)) {
    var left = node.children[0];
    var right = node.children[1];
    var valueKind = left.kind;
    if (valueKind !== right.kind && (!NodeKind.isBool(left.kind) || !NodeKind.isBool(right.kind))) {
      return;
    }
    if (NodeKind.isBool(valueKind)) {
      switch (kind) {
      case 81:
        ConstantFolder.flattenBool($this, node, left.kind === 39 && right.kind === 39);
        break;
      case 82:
        ConstantFolder.flattenBool($this, node, left.kind === 39 || right.kind === 39);
        break;
      case 74:
        ConstantFolder.flattenBool($this, node, left.kind === 39 === (right.kind === 39));
        break;
      case 84:
        ConstantFolder.flattenBool($this, node, left.kind === 39 !== (right.kind === 39));
        break;
      }
    } else if (valueKind === 41) {
      switch (kind) {
      case 69:
        ConstantFolder.flattenInt($this, node, left.content.value + right.content.value | 0);
        break;
      case 88:
        ConstantFolder.flattenInt($this, node, left.content.value - right.content.value | 0);
        break;
      case 83:
        ConstantFolder.flattenInt($this, node, $imul(left.content.value, right.content.value));
        break;
      case 73:
        ConstantFolder.flattenInt($this, node, left.content.value / right.content.value | 0);
        break;
      case 85:
        ConstantFolder.flattenInt($this, node, left.content.value % right.content.value | 0);
        break;
      case 86:
        ConstantFolder.flattenInt($this, node, left.content.value << right.content.value);
        break;
      case 87:
        ConstantFolder.flattenInt($this, node, left.content.value >> right.content.value);
        break;
      case 70:
        ConstantFolder.flattenInt($this, node, left.content.value & right.content.value);
        break;
      case 71:
        ConstantFolder.flattenInt($this, node, left.content.value | right.content.value);
        break;
      case 72:
        ConstantFolder.flattenInt($this, node, left.content.value ^ right.content.value);
        break;
      case 74:
        ConstantFolder.flattenBool($this, node, left.content.value === right.content.value);
        break;
      case 84:
        ConstantFolder.flattenBool($this, node, left.content.value !== right.content.value);
        break;
      case 79:
        ConstantFolder.flattenBool($this, node, left.content.value < right.content.value);
        break;
      case 75:
        ConstantFolder.flattenBool($this, node, left.content.value > right.content.value);
        break;
      case 80:
        ConstantFolder.flattenBool($this, node, left.content.value <= right.content.value);
        break;
      case 76:
        ConstantFolder.flattenBool($this, node, left.content.value >= right.content.value);
        break;
      }
    } else if (NodeKind.isReal(valueKind)) {
      switch (kind) {
      case 69:
        ConstantFolder.flattenReal($this, node, left.content.value + right.content.value);
        break;
      case 88:
        ConstantFolder.flattenReal($this, node, left.content.value - right.content.value);
        break;
      case 83:
        ConstantFolder.flattenReal($this, node, left.content.value * right.content.value);
        break;
      case 73:
        ConstantFolder.flattenReal($this, node, left.content.value / right.content.value);
        break;
      case 74:
        ConstantFolder.flattenBool($this, node, left.content.value === right.content.value);
        break;
      case 84:
        ConstantFolder.flattenBool($this, node, left.content.value !== right.content.value);
        break;
      case 79:
        ConstantFolder.flattenBool($this, node, left.content.value < right.content.value);
        break;
      case 75:
        ConstantFolder.flattenBool($this, node, left.content.value > right.content.value);
        break;
      case 80:
        ConstantFolder.flattenBool($this, node, left.content.value <= right.content.value);
        break;
      case 76:
        ConstantFolder.flattenBool($this, node, left.content.value >= right.content.value);
        break;
      }
    }
  }
};
function InstanceToStaticPass() {
}
InstanceToStaticPass.run = function(graph, options) {
  for (var i = 0; i < graph.callInfo.length; i = i + 1 | 0) {
    var info = graph.callInfo[i];
    var symbol = info.symbol;
    var enclosingSymbol = symbol.enclosingSymbol;
    if (symbol.kind === 16 && !Symbol.isImportOrExport(symbol) && symbol.node.children[2] !== null && ((enclosingSymbol.flags & 2048) !== 0 || SymbolKind.isEnum(enclosingSymbol.kind) || options.optimize && options.targetFormat === 1 && !((symbol.flags & 128) !== 0))) {
      symbol.kind = 15;
      symbol.flags |= 64;
      var thisSymbol = new Symbol("this", 18);
      thisSymbol.type = enclosingSymbol.type;
      Node.insertChild(symbol.node.children[1], 0, Node.withSymbol(Node.withChildren(new Node(16), [Node.withSymbol(Node.withContent(new Node(34), new StringContent("this")), thisSymbol), Node.withType(new Node(35), thisSymbol.type), null]), thisSymbol));
      for (var j = 0; j < info.callSites.length; j = j + 1 | 0) {
        var callSite = info.callSites[j];
        switch (callSite.kind) {
        case 48:
          var value = callSite.children[0];
          var target;
          var name;
          if (value.kind === 46) {
            target = Node.remove(value.children[0]);
            name = Node.remove(value.children[1]);
          } else {
            target = new Node(36);
            name = Node.remove(value);
          }
          Node.replaceChild(callSite, 0, name);
          Node.insertChild(callSite, 1, target);
          break;
        case 51:
          break;
        default:
          break;
        }
      }
      InstanceToStaticPass.recursivelyReplaceThis(symbol.node.children[2], thisSymbol);
    }
  }
};
InstanceToStaticPass.createThis = function(symbol) {
  return Node.withType(Node.withSymbol(Node.withContent(new Node(34), new StringContent(symbol.name)), symbol), symbol.type);
};
InstanceToStaticPass.recursivelyReplaceThis = function(node, symbol) {
  if (node.kind === 36) {
    Node.become(node, Node.withRange(InstanceToStaticPass.createThis(symbol), node.range));
  } else if (Node.isNameExpression(node) && (node.symbol.kind === 16 || node.symbol.kind === 20)) {
    Node.become(node, Node.withRange(Node.withType(Node.withChildren(new Node(46), [InstanceToStaticPass.createThis(symbol), Node.clone(node)]), node.type), node.range));
  } else if (Node.hasChildren(node)) {
    for (var i = 0; i < node.children.length; i = i + 1 | 0) {
      var child = node.children[i];
      if (child !== null) {
        InstanceToStaticPass.recursivelyReplaceThis(child, symbol);
      }
    }
  }
};
function FunctionInliningPass(_0, _1) {
  this.graph = _0;
  this.options = _1;
}
FunctionInliningPass.run = function(graph, options) {
  var pass = new FunctionInliningPass(graph, options);
  for (var i = 0; i < graph.callInfo.length; i = i + 1 | 0) {
    FunctionInliningPass.tryToInline(pass, graph.callInfo[i].symbol);
  }
};
FunctionInliningPass.tryToInline = function($this, symbol) {
  if (!((symbol.flags & 49152) === 0)) {
    return;
  }
  symbol.flags |= 16384;
  if (symbol.kind === 15 && ((symbol.flags & 512) !== 0 || $this.options.optimize && $this.options.targetFormat === 1)) {
    var block = symbol.node.children[2];
    if (block !== null && Node.hasChildren(block)) {
      var i = 0;
      if ($this.options.optimize) {
        while (i < block.children.length && block.children[i].kind === 29) {
          i = i + 1 | 0;
        }
      }
      if (i < block.children.length) {
        var last = block.children[i];
        if (last.kind === 25) {
          FunctionInliningPass.recursivelyInlineFunctionCalls($this, last);
          var symbolCounts = new IntMap();
          if (FunctionInliningPass.recursivelyCountArgumentUses($this, last, symbolCounts)) {
            var $arguments = symbol.node.children[1].children;
            var isSimpleSubstitution = true;
            for (var j = 0; j < $arguments.length; j = j + 1 | 0) {
              var argument = $arguments[j].symbol;
              if (symbolCounts.getOrDefault(argument.uniqueID, 0) !== 1) {
                isSimpleSubstitution = false;
                break;
              }
            }
            if (isSimpleSubstitution) {
              var callSites = $this.graph.callInfo[$this.graph.symbolToInfoIndex.get(symbol.uniqueID)].callSites;
              for (var j = 0; j < callSites.length; j = j + 1 | 0) {
                var callSite = callSites[j];
                switch (callSite.kind) {
                case 48:
                  var clone = Node.clone(last.children[0]);
                  var values = Node.removeChildren(callSite);
                  var value = values.shift();
                  for (var k = 0; k < values.length; k = k + 1 | 0) {
                    FunctionInliningPass.recursivelyInlineFunctionCalls($this, values[k]);
                  }
                  FunctionInliningPass.recursivelySubstituteArguments($this, clone, $arguments, values);
                  Node.become(callSite, clone);
                  break;
                case 51:
                  break;
                default:
                  break;
                }
              }
              symbol.flags = symbol.flags & -49153 | 32768;
            }
          }
        }
      }
    }
  }
};
FunctionInliningPass.recursivelyInlineFunctionCalls = function($this, node) {
  if (Node.hasChildren(node)) {
    for (var i = 0; i < node.children.length; i = i + 1 | 0) {
      var child = node.children[i];
      if (child !== null) {
        FunctionInliningPass.recursivelyInlineFunctionCalls($this, child);
      }
    }
  }
  var symbol = node.symbol;
  if (symbol !== null) {
    FunctionInliningPass.tryToInline($this, symbol);
  }
};
FunctionInliningPass.recursivelyCountArgumentUses = function($this, node, symbolCounts) {
  if (Node.hasChildren(node)) {
    for (var i = 0; i < node.children.length; i = i + 1 | 0) {
      var child = node.children[i];
      if (child !== null && !FunctionInliningPass.recursivelyCountArgumentUses($this, child, symbolCounts)) {
        return false;
      }
    }
  }
  if (node.kind === 56) {
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
FunctionInliningPass.recursivelySubstituteArguments = function($this, node, $arguments, values) {
  if (node.symbol !== null) {
    for (var i = 0; i < $arguments.length; i = i + 1 | 0) {
      if ($arguments[i].symbol === node.symbol) {
        Node.become(node, values[i]);
        return;
      }
    }
  }
  if (Node.hasChildren(node)) {
    for (var i = 0; i < node.children.length; i = i + 1 | 0) {
      var child = node.children[i];
      if (child !== null) {
        FunctionInliningPass.recursivelySubstituteArguments($this, child, $arguments, values);
      }
    }
  }
};
function Member(_0) {
  this.type = null;
  this.dependency = null;
  this.parameterizedType = null;
  this.symbol = _0;
}
var CastKind = {};
var AllowDeclaration = {};
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
    if (context.loop === null && NodeKind.isLoop(node.kind)) {
      context.loop = node;
    }
    if (context.switchValue === null && node.kind === 31) {
      context.switchValue = node.children[0];
    }
    if (context.symbolForThis === null && node.symbol !== null && SymbolKind.isTypeWithInstances(node.symbol.kind)) {
      context.symbolForThis = node.symbol;
    }
    if (context.functionSymbol === null && NodeKind.isFunction(node.kind)) {
      context.functionSymbol = node.symbol;
    }
    node = node.parent;
  }
  return context;
};
function Resolver(_0) {
  this.cache = new TypeCache();
  this.context = new ResolveContext();
  this.constantFolder = null;
  this.parsedDeclarations = null;
  this.parsedBlocks = null;
  this.typeContext = null;
  this.resultType = null;
  this.log = _0;
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
Resolver.setupScopesAndSymbols = function($this, node, scope) {
  if (node.kind === 0) {
    node.scope = scope;
  } else if (node.kind === 2) {
    if (!NodeKind.isNamedBlockDeclaration(node.parent.kind) && !NodeKind.isLoop(node.parent.kind)) {
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
  }
  if (NodeKind.isNamedDeclaration(node.kind) && node.kind !== 19) {
    var declarationName = node.children[0];
    if (declarationName !== null && node.symbol === null) {
      var name = declarationName.content.value;
      var member = Scope.findLocal(scope, name);
      var symbol;
      if (member !== null) {
        symbol = member.symbol;
        Node.appendToSiblingChain(symbol.node, node);
      } else {
        symbol = new Symbol(name, 0);
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
      if (symbol.type === null && NodeKind.isNamedBlockDeclaration(node.kind)) {
        symbol.type = new Type(symbol);
      }
    }
  }
  if (NodeKind.isNamedBlockDeclaration(node.kind) || NodeKind.isFunction(node.kind) || node.kind === 56 || NodeKind.isLoop(node.kind) || node.kind === 47) {
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
      semanticWarningDuplicateModifier($this.log, modifierName.range, name);
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
      if ((flags & 4071) !== (siblingFlags & 4071)) {
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
    var kind = node.kind;
    if (kind !== 0 && kind !== 1 && kind !== 2 && kind !== 7 && kind !== 32 && kind !== 13 && !NodeKind.isEnum(kind)) {
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
      if (sibling.kind === 13 && NodeKind.isNamedBlockDeclaration(kind)) {
        continue;
      }
      if (sibling.kind !== 13 && NodeKind.isNamedBlockDeclaration(sibling.kind)) {
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
      if (sibling.kind === 16 || NodeKind.isFunction(sibling.kind)) {
        var disconnected = sibling.symbol = new Symbol(symbol.name, 0);
        disconnected.enclosingSymbol = symbol.enclosingSymbol;
        disconnected.node = sibling;
        previous.sibling = sibling.sibling;
      } else {
        previous = sibling;
      }
    }
    switch (kind) {
    case 7:
      symbol.kind = 9;
      break;
    case 8:
      symbol.kind = 10;
      break;
    case 9:
      symbol.kind = 11;
      break;
    case 10:
      symbol.kind = 12;
      break;
    case 11:
      symbol.kind = 13;
      break;
    case 12:
      symbol.kind = 14;
      break;
    case 15:
      symbol.kind = 15;
      break;
    case 14:
      symbol.kind = 17;
      break;
    case 16:
      symbol.kind = 19;
      break;
    case 17:
      symbol.kind = 4;
      break;
    case 18:
      symbol.kind = 6;
      break;
    case 13:
      semanticErrorExtensionMissingTarget($this.log, declarationName.range, declarationName.content.value);
      break;
    default:
      break;
    }
  }
  for (var i = 0; i < $this.parsedDeclarations.length; i = i + 1 | 0) {
    var node = $this.parsedDeclarations[i];
    var symbol = node.symbol;
    if (!((symbol.flags & 64) !== 0) && (Symbol.isObjectMember(symbol) || Symbol.isEnumMember(symbol) && (symbol.flags & 16) !== 0)) {
      if (symbol.kind === 15) {
        symbol.kind = 16;
      } else if (symbol.kind === 19) {
        symbol.kind = 20;
      }
    } else if (symbol.kind === 19 && Resolver.checkParentsForLocalVariable(node)) {
      symbol.kind = 18;
    }
  }
};
Resolver.processUsingStatements = function($this) {
  for (var i = 0; i < $this.parsedBlocks.length; i = i + 1 | 0) {
    var block = $this.parsedBlocks[i];
    if (!Node.hasChildren(block)) {
      continue;
    }
    for (var j = 0; j < block.children.length; j = j + 1 | 0) {
      var statement = block.children[j];
      if (statement.kind !== 19) {
        continue;
      }
      var declarationName = statement.children[0];
      var name = declarationName.content.value;
      var member = Scope.findLocal(block.scope, name);
      if (member !== null) {
        var otherName = member.symbol.node.children[0];
        if (otherName !== null) {
          semanticErrorDuplicateSymbol($this.log, declarationName.range, name, otherName.range);
        }
        continue;
      }
      var symbol = new Symbol(name, 7);
      symbol.node = statement;
      statement.symbol = symbol;
      Scope.insertLocal(block.scope, symbol);
    }
    var insertedSymbols = null;
    for (var j = 0; j < block.children.length; j = j + 1 | 0) {
      var statement = block.children[j];
      if (statement.kind !== 33) {
        continue;
      }
      var value = statement.children[0];
      Resolver.resolveGlobalUsingNamespaceValue($this, value);
      if (value.type === $this.cache.errorType) {
        continue;
      }
      var symbol = value.type.symbol;
      if (symbol === null) {
        continue;
      }
      if (!SymbolKind.isNamespace(symbol.kind)) {
        semanticErrorBadUsingNamespace($this.log, value.range);
        continue;
      }
      if (insertedSymbols === null) {
        insertedSymbols = [];
      }
      var members = symbol.type.members.values();
      for (var k = 0; k < members.length; k = k + 1 | 0) {
        var member = members[k];
        var memberSymbol = member.symbol;
        if (memberSymbol.kind === 9) {
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
              var collision = new Symbol(memberSymbol.name, 2);
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
Resolver.resolveGlobalUsingNamespaceValue = function($this, node) {
  node.type = $this.cache.errorType;
  var member;
  if (node.kind === 34) {
    var name = node.content.value;
    member = $this.cache.globalType.members.getOrDefault(name, null);
    if (member === null) {
      semanticErrorUndeclaredSymbol($this.log, node.range, name);
      return;
    }
  } else if (node.kind === 46) {
    var target = node.children[0];
    Resolver.resolveGlobalUsingNamespaceValue($this, target);
    var targetType = target.type;
    var dotName = node.children[1];
    if (targetType === null || dotName === null) {
      return;
    }
    var name = dotName.content.value;
    member = targetType.members.getOrDefault(name, null);
    if (member === null) {
      semanticErrorUnknownMemberSymbol($this.log, dotName.range, name, targetType);
      return;
    }
  } else {
    semanticErrorUnexpectedNode($this.log, node.range, node.kind);
    return;
  }
  if (!SymbolKind.isType(member.symbol.kind)) {
    semanticErrorBadUsingValue($this.log, node.range);
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
    Resolver.resolveProgram($this, node);
    break;
  case 1:
    Resolver.resolveFile($this, node);
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
    Resolver.resolveUsingNamespace($this, node);
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
    Resolver.resolveVariableCluster($this, node);
    break;
  case 17:
    Resolver.resolveParameter($this, node);
    break;
  case 18:
  case 19:
    Resolver.resolveAlias($this, node);
    break;
  case 20:
    Resolver.resolveIf($this, node);
    break;
  case 21:
    Resolver.resolveFor($this, node);
    break;
  case 22:
    Resolver.resolveForEach($this, node);
    break;
  case 23:
    Resolver.resolveWhile($this, node);
    break;
  case 24:
    Resolver.resolveWhile($this, node);
    break;
  case 25:
  case 26:
    Resolver.resolveReturn($this, node);
    break;
  case 27:
    Resolver.resolveBreak($this, node);
    break;
  case 28:
    Resolver.resolveContinue($this, node);
    break;
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
    Resolver.resolveModifier($this, node);
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
  case 40:
    node.type = $this.cache.boolType;
    break;
  case 37:
    Resolver.resolveHook($this, node);
    break;
  case 41:
    Resolver.resolveInt($this, node);
    break;
  case 42:
    node.type = $this.cache.floatType;
    break;
  case 43:
    node.type = $this.cache.doubleType;
    break;
  case 44:
    node.type = $this.cache.stringType;
    break;
  case 45:
    Resolver.resolveInitializer($this, node);
    break;
  case 46:
    Resolver.resolveDot($this, node);
    break;
  case 47:
    Resolver.resolveLet($this, node);
    break;
  case 48:
    Resolver.resolveCall($this, node);
    break;
  case 49:
    Resolver.resolveSuperCall($this, node);
    break;
  case 50:
    break;
  case 52:
    Resolver.resolveSequence($this, node);
    break;
  case 53:
    Resolver.resolveParameterize($this, node);
    break;
  case 54:
    Resolver.resolveCast($this, node);
    break;
  case 56:
    Resolver.resolveLambda($this, node);
    break;
  case 57:
    Resolver.resolveDefault($this, node);
    break;
  case 58:
    Resolver.resolveUntyped($this, node);
    break;
  case 59:
    Resolver.resolveVar($this, node);
    break;
  case 60:
    Resolver.resolveFunctionType($this, node);
    break;
  case 61:
  case 62:
  case 63:
  case 64:
  case 65:
  case 66:
  case 67:
  case 68:
    Resolver.resolveUnaryOperator($this, node);
    break;
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
  case 97:
  case 98:
  case 99:
    Resolver.resolveBinaryOperator($this, node);
    break;
  case 100:
    Resolver.resolveTertiaryOperator($this, node);
    break;
  default:
    break;
  }
  $this.context.scope = oldScope;
  $this.typeContext = oldType;
};
Resolver.checkIsParameterized = function($this, node) {
  if (!(node.type === $this.cache.errorType) && Type.hasParameters(node.type) && !(node.type.substitutions !== null)) {
    semanticErrorUnparameterizedType($this.log, node.range, node.type);
    node.type = $this.cache.errorType;
  }
};
Resolver.checkIsType = function($this, node) {
  if (!(node.type === $this.cache.errorType) && !(node.kind === 35)) {
    semanticErrorUnexpectedExpression($this.log, node.range, node.type);
    node.type = $this.cache.errorType;
  }
};
Resolver.checkIsInstance = function($this, node) {
  if (!(node.type === $this.cache.errorType) && node.kind === 35) {
    semanticErrorUnexpectedType($this.log, node.range, node.type);
    node.type = $this.cache.errorType;
  }
};
Resolver.checkIsValidFunctionReturnType = function($this, node) {
  if (!(node.type === $this.cache.voidType)) {
    Resolver.checkIsValidVariableType($this, node);
  }
};
Resolver.checkIsValidVariableType = function($this, node) {
  if (node.type === $this.cache.voidType || Type.isNamespace(node.type)) {
    semanticErrorBadType($this.log, node.range, node.type);
    node.type = $this.cache.errorType;
  }
};
Resolver.checkUnusedExpression = function($this, node) {
  var kind = node.kind;
  if (kind === 37) {
    Resolver.checkUnusedExpression($this, node.children[1]);
    Resolver.checkUnusedExpression($this, node.children[2]);
  } else if (kind === 52) {
    if (Node.hasChildren(node)) {
      Resolver.checkUnusedExpression($this, node.children[node.children.length - 1 | 0]);
    }
  } else if (kind === 47) {
    Resolver.checkUnusedExpression($this, node.children[1]);
  } else if (!(node.type === $this.cache.errorType) && !NodeKind.isCall(kind) && !NodeKind.isUnaryStorageOperator(kind) && !NodeKind.isBinaryStorageOperator(kind)) {
    semanticWarningUnusedExpression($this.log, node.range);
  }
};
Resolver.checkStorage = function($this, node) {
  if (node.type === $this.cache.errorType) {
    return;
  }
  if (!NodeKind.isStorage(node.kind)) {
    semanticErrorBadStorage($this.log, node.range);
    return;
  }
  if ((node.symbol.flags & 256) !== 0) {
    semanticErrorStorageToFinal($this.log, node.range);
    return;
  }
};
Resolver.checkConversion = function($this, to, node, kind) {
  var from = node.type;
  if (from === $this.cache.errorType || to === $this.cache.errorType) {
    return;
  }
  if (from === $this.cache.voidType && to === $this.cache.voidType) {
    semanticErrorUnexpectedExpression($this.log, node.range, to);
    return;
  }
  if (from === to) {
    if ((node.kind === 34 || node.kind === 46) && node.symbol !== null && SymbolKind.isFunction(node.symbol.kind)) {
      var children = Node.removeChildren(node);
      Node.become(node, Node.withSymbol(Node.withType(Node.withRange(Node.withChildren(new Node(51), [Node.withChildren(Node.clone(node), children)]), node.range), to), node.symbol));
    }
    return;
  }
  if (Type.isEnumFlags(to) && node.kind === 41 && node.content.value === 0) {
    from = to;
  }
  if (kind === 0 && !TypeCache.canImplicitlyConvert($this.cache, from, to) || kind === 1 && !TypeCache.canExplicitlyConvert($this.cache, from, to)) {
    semanticErrorIncompatibleTypes($this.log, node.range, from, to, TypeCache.canExplicitlyConvert($this.cache, from, to));
    node.type = $this.cache.errorType;
    return;
  }
  if (kind === 0) {
    if (node.kind === 35) {
      return;
    }
    var value = new Node(38);
    Node.become(value, node);
    Node.become(node, Node.withRange(Node.withType(Node.withChildren(new Node(55), [Node.withType(new Node(35), to), value]), to), node.range));
  }
};
Resolver.unexpectedStatement = function($this, node) {
  if (!(node.range.source === null)) {
    semanticErrorUnexpectedStatement($this.log, node.range);
  }
};
Resolver.checkInsideBlock = function($this, node) {
  if (node.parent.kind !== 2) {
    Resolver.unexpectedStatement($this, node);
  }
};
Resolver.checkDeclarationLocation = function($this, node, allowDeclaration) {
  var parent;
  for (parent = node.parent; parent !== null; parent = parent.parent) {
    if (parent.symbol !== null && (parent.symbol.flags & 65536) !== 0) {
      break;
    }
    var kind = parent.kind;
    if (kind !== 0 && kind !== 1 && kind !== 32 && kind !== 2 && kind !== 7 && kind !== 13 && (allowDeclaration !== 1 || !NodeKind.isObject(kind))) {
      Resolver.unexpectedStatement($this, node);
      break;
    }
  }
  if (parent !== null) {
    node.symbol.flags |= 65536;
  }
};
Resolver.checkStatementLocation = function($this, node) {
  if (node.parent.kind !== 2 || NodeKind.isNamedBlockDeclaration(node.parent.parent.kind) && node.parent.parent.kind !== 7) {
    Resolver.unexpectedStatement($this, node);
  }
};
Resolver.checkAccessToThis = function($this, range) {
  if ($this.context.functionSymbol !== null && SymbolKind.isInstance($this.context.functionSymbol.kind)) {
    return true;
  }
  if ($this.context.symbolForThis !== null) {
    semanticErrorStaticThis($this.log, range, "this");
  } else {
    semanticErrorUnexpectedThis($this.log, range, "this");
  }
  return false;
};
Resolver.checkAccessToInstanceSymbol = function($this, node) {
  var symbol = node.symbol;
  if (!SymbolKind.isInstance(symbol.kind) && symbol.kind !== 4) {
    return true;
  }
  if ($this.context.functionSymbol !== null && SymbolKind.isInstance($this.context.functionSymbol.kind) && $this.context.functionSymbol.enclosingSymbol === symbol.enclosingSymbol) {
    return true;
  }
  if ($this.context.symbolForThis === null) {
    semanticErrorUnexpectedThis($this.log, node.range, symbol.name);
    return false;
  }
  if (symbol.kind === 4 && $this.context.symbolForThis === symbol.enclosingSymbol) {
    var enclosingNode = symbol.enclosingSymbol.node;
    for (var parent = node.parent; parent !== enclosingNode; parent = parent.parent) {
      if (parent.kind === 3 && parent.parent === enclosingNode && (parent === parent.parent.children[3] || parent === parent.parent.children[2])) {
        return true;
      }
      if ((parent.kind === 16 || NodeKind.isFunction(parent.kind)) && SymbolKind.isInstance(parent.symbol.kind)) {
        return true;
      }
    }
  }
  semanticErrorStaticThis($this.log, node.range, symbol.name);
  return false;
};
Resolver.collectAndResolveBaseTypes = function($this, symbol) {
  var baseTypes = [];
  for (var node = symbol.node; node !== null; node = node.sibling) {
    var isObject = NodeKind.isObject(node.kind);
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
            semanticErrorBaseClassInExtension($this.log, baseType.range);
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
    semanticErrorUnexpectedBaseType($this.log, baseTypes[i].range, what);
  }
};
Resolver.needsTypeContext = function($this, node) {
  return node.kind === 45 || node.kind === 46 && node.children[0] === null || node.kind === 37 && Resolver.needsTypeContext($this, node.children[1]) && Resolver.needsTypeContext($this, node.children[2]);
};
Resolver.addAutoGeneratedMember = function($this, type, name) {
  var symbol = new Symbol(name, 1);
  symbol.enclosingSymbol = type.symbol;
  Type.addMember(type, new Member(symbol));
};
Resolver.initializeNamespace = function($this, symbol) {
  Resolver.unexpectedModifierIfPresent($this, symbol, 256, "on a namespace declaration");
  Resolver.unexpectedModifierIfPresent($this, symbol, 64, "on a namespace declaration");
  Resolver.unexpectedModifierIfPresent($this, symbol, 128, "on a namespace declaration");
  Resolver.unexpectedModifierIfPresent($this, symbol, 32, "on a namespace declaration");
  Resolver.checkNoBaseTypes($this, symbol, "A namespace");
};
Resolver.initializeEnum = function($this, symbol) {
  Resolver.unexpectedModifierIfPresent($this, symbol, 256, "on an enum declaration");
  Resolver.unexpectedModifierIfPresent($this, symbol, 64, "on an enum declaration");
  Resolver.unexpectedModifierIfPresent($this, symbol, 128, "on an enum declaration");
  Resolver.unexpectedModifierIfPresent($this, symbol, 32, "on an enum declaration");
  Resolver.checkNoBaseTypes($this, symbol, "An enum");
  if (symbol.type.members.getOrDefault("toString", null) === null && !((symbol.flags & 2048) !== 0)) {
    Resolver.addAutoGeneratedMember($this, symbol.type, "toString");
  }
};
Resolver.resolveBaseTypes = function($this, symbol) {
  var node = symbol.node;
  var type = symbol.type;
  var baseTypes = Resolver.collectAndResolveBaseTypes($this, symbol);
  var unmergedMembers = new StringMap();
  type.relevantTypes = [];
  if (symbol.kind === 13) {
    Resolver.checkNoBaseTypes($this, symbol, "A struct");
    return;
  }
  for (var i = 0; i < baseTypes.length; i = i + 1 | 0) {
    var base = baseTypes[i];
    var baseType = base.type;
    if (baseType === $this.cache.errorType) {
      continue;
    }
    if (symbol.kind === 12 && Type.isClass(baseType)) {
      if (baseTypes.indexOf(base) !== 0) {
        semanticErrorClassBaseNotFirst($this.log, base.range, baseType);
        continue;
      }
    } else if (!Type.isInterface(baseType)) {
      semanticErrorBaseTypeNotInterface($this.log, base.range, baseType);
      continue;
    }
    if (type.relevantTypes.indexOf(baseType) >= 0) {
      semanticErrorDuplicateBaseType($this.log, base.range, baseType);
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
        var combined = new Symbol(memberSymbol.name, 3);
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
  Resolver.unexpectedModifierIfPresent($this, symbol, 256, "on an object declaration");
  Resolver.unexpectedModifierIfPresent($this, symbol, 64, "on an object declaration");
  var node = Node.firstNonExtensionSibling(symbol.node);
  var parameters = node.children[3];
  var type = symbol.type;
  var where;
  switch (symbol.kind) {
  case 12:
    where = "on a class declaration";
    break;
  case 13:
    where = "on a struct declaration";
    break;
  case 14:
    where = "on an interface declaration";
    break;
  }
  Resolver.unexpectedModifierIfPresent($this, symbol, 128, where);
  Resolver.unexpectedModifierIfPresent($this, symbol, 32, where);
  if (parameters !== null && Node.hasChildren(parameters)) {
    symbol.parameters = [];
    Resolver.resolveNodes($this, parameters.children);
    for (var i = 0; i < parameters.children.length; i = i + 1 | 0) {
      symbol.parameters.push(parameters.children[i].symbol);
    }
    Symbol.sortParametersByDependencies(symbol);
  }
  if (!Type.isInterface(type) && Type.$constructor(type) === null && !((symbol.flags & 2048) !== 0)) {
    Resolver.addAutoGeneratedMember($this, type, "new");
  }
  Resolver.resolveBaseTypes($this, symbol);
};
Resolver.initializeFunction = function($this, symbol) {
  var enclosingSymbol = symbol.enclosingSymbol;
  Resolver.unexpectedModifierIfPresent($this, symbol, 256, "on a function declaration");
  if (enclosingSymbol === null || !SymbolKind.isTypeWithInstances(enclosingSymbol.kind)) {
    Resolver.unexpectedModifierIfPresent($this, symbol, 64, "outside an object declaration");
  }
  var node = symbol.node;
  var resultType;
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
  if (!(resultType === $this.cache.errorType)) {
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
  if (overriddenMember !== null && !(symbol.kind === 17)) {
    Resolver.initializeMember($this, overriddenMember);
    var base = overriddenMember.type;
    var derived = symbol.type;
    if (!(base === $this.cache.errorType) && !(derived === $this.cache.errorType)) {
      var overriddenSymbol = overriddenMember.symbol;
      if (!(base.symbol === null) || !SymbolKind.isInstance(overriddenSymbol.kind) || !SymbolKind.isInstance(symbol.kind)) {
        semanticErrorBadOverride($this.log, node.children[0].range, symbol.name, overriddenSymbol.enclosingSymbol.type, overriddenSymbol.node.children[0].range);
      } else if (base !== derived) {
        semanticErrorOverrideDifferentTypes($this.log, node.children[0].range, symbol.name, base, derived, overriddenSymbol.node.children[0].range);
      } else if (!((symbol.flags & 32) !== 0)) {
        semanticErrorModifierMissingOverride($this.log, node.children[0].range, symbol.name, overriddenSymbol.node.children[0].range);
      } else if (!((overriddenSymbol.flags & 128) !== 0)) {
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
    if (!SymbolKind.isInstance(symbol.kind)) {
      Resolver.unexpectedModifierIfPresent($this, symbol, 128, "on a non-instance function");
    }
    Resolver.unexpectedModifierIfPresent($this, symbol, 32, "on a function that doesn't override anything");
    if ((symbol.flags & 32) !== 0) {
      symbol.flags |= 128;
    }
  }
};
Resolver.findModifierName = function(symbol, flag) {
  for (var node = symbol.node; node !== null; node = node.parent) {
    if (node.kind === 32) {
      var modifierName = node.children[0];
      if (nameToSymbolFlag.get(modifierName.content.value) === flag) {
        return modifierName;
      }
    }
  }
  return null;
};
Resolver.redundantModifierIfPresent = function($this, symbol, flag, where) {
  if ((symbol.flags & flag) !== 0 && !((symbol.flags & 131072) !== 0)) {
    var modifierName = Resolver.findModifierName(symbol, flag);
    if (modifierName !== null) {
      semanticErrorRedundantModifier($this.log, modifierName.range, modifierName.content.value, where);
    }
  }
};
Resolver.unexpectedModifierIfPresent = function($this, symbol, flag, where) {
  if ((symbol.flags & flag) !== 0 && !((symbol.flags & 131072) !== 0)) {
    var modifierName = Resolver.findModifierName(symbol, flag);
    if (modifierName !== null) {
      semanticErrorUnexpectedModifier($this.log, modifierName.range, modifierName.content.value, where);
    }
  }
};
Resolver.expectedModifierIfAbsent = function($this, symbol, flag, where) {
  if ((symbol.flags & flag) === 0 && !((symbol.flags & 131072) !== 0) && Resolver.findModifierName(symbol, flag) === null) {
    semanticErrorExpectedModifier($this.log, symbol.node.children[0].range, symbolFlagToName.get(flag), where);
  }
};
Resolver.initializeVariable = function($this, symbol) {
  Resolver.unexpectedModifierIfPresent($this, symbol, 128, "on a variable declaration");
  Resolver.unexpectedModifierIfPresent($this, symbol, 32, "on a variable declaration");
  if (symbol.enclosingSymbol === null || !SymbolKind.isTypeWithInstances(symbol.enclosingSymbol.kind)) {
    Resolver.unexpectedModifierIfPresent($this, symbol, 64, "outside an object declaration");
  }
  if (symbol.enclosingSymbol !== null && symbol.enclosingSymbol.kind === 13 && !((symbol.flags & 64) !== 0)) {
    Resolver.expectedModifierIfAbsent($this, symbol, 256, "on a variable declaration inside a struct");
  }
  var node = symbol.node;
  var variableType = node.children[1];
  if (variableType === null) {
    if (node.parent.kind === 6) {
      variableType = Node.clone(node.parent.children[0]);
    } else if (symbol.enclosingSymbol !== null) {
      var type = symbol.enclosingSymbol.type;
      variableType = Node.withSymbol(Node.withType(new Node(35), type), symbol.enclosingSymbol);
      symbol.flags |= 256;
      var variableValue = node.children[2];
      if (variableValue !== null) {
        Resolver.resolveAsExpressionWithConversion($this, variableValue, $this.cache.intType, 0);
        ConstantFolder.foldConstants($this.constantFolder, variableValue);
        if (variableValue.kind === 41) {
          symbol.enumValue = variableValue.content.value;
        } else {
          variableType = Node.withType(new Node(35), $this.cache.errorType);
          if (!(variableValue.type === $this.cache.errorType)) {
            semanticErrorBadIntegerConstant($this.log, variableValue.range, variableValue.type);
          }
        }
      } else {
        var index = node.parent.children.indexOf(node);
        if (index > 0) {
          var previous = node.parent.children[index - 1 | 0].symbol;
          Resolver.initializeSymbol($this, previous);
          if (!(previous.type === $this.cache.errorType)) {
            symbol.enumValue = Type.isEnumFlags(type) ? $imul(previous.enumValue, 2) : previous.enumValue + 1 | 0;
          } else {
            variableType = Node.withType(new Node(35), $this.cache.errorType);
          }
        } else {
          symbol.enumValue = Type.isEnumFlags(type) ? 1 : 0;
        }
      }
    } else {
      variableType = Node.withType(new Node(35), $this.cache.errorType);
    }
    Node.replaceChild(node, 1, variableType);
  }
  if (variableType.kind === 59) {
    var value = node.children[2];
    if (value === null) {
      semanticErrorVarMissingValue($this.log, node.children[0].range);
      symbol.type = $this.cache.errorType;
    } else {
      if (node.parent.kind === 47) {
        var oldScope = $this.context.scope;
        $this.context.scope = oldScope.lexicalParent;
        Resolver.resolveAsExpression($this, value);
        $this.context.scope = oldScope;
      } else {
        Resolver.resolveAsExpression($this, value);
      }
      var type = value.type;
      if (type === $this.cache.nullType || type === $this.cache.voidType) {
        semanticErrorVarBadType($this.log, node.children[0].range, type);
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
    if (!(base === $this.cache.errorType) && !(derived === $this.cache.errorType)) {
      semanticErrorBadOverride($this.log, node.children[0].range, symbol.name, overriddenMember.symbol.enclosingSymbol.type, overriddenMember.symbol.node.children[0].range);
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
      semanticErrorBadTypeParameterBound($this.log, bound.range, boundType);
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
  if ((symbol.flags & 12288) === 0) {
    symbol.flags |= 4096;
    var oldContext = $this.context;
    var oldTypeContext = $this.typeContext;
    var oldResultType = $this.resultType;
    $this.context = ResolveContext.fromNode(node);
    $this.typeContext = null;
    $this.resultType = null;
    switch (symbol.kind) {
    case 9:
      Resolver.initializeNamespace($this, symbol);
      break;
    case 10:
    case 11:
      Resolver.initializeEnum($this, symbol);
      break;
    case 12:
    case 13:
    case 14:
      Resolver.initializeObject($this, symbol);
      break;
    case 15:
    case 16:
    case 17:
      Resolver.initializeFunction($this, symbol);
      break;
    case 18:
    case 19:
    case 20:
      Resolver.initializeVariable($this, symbol);
      break;
    case 4:
      Resolver.initializeParameter($this, symbol);
      break;
    case 6:
    case 7:
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
    symbol.flags = symbol.flags & -4097 | 8192;
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
  trace.log("initializeMember " + Symbol.fullName(member.symbol) + (member.parameterizedType !== null ? " on " + Type.toString(member.parameterizedType) : ""));
  trace.indent();
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
  trace.dedent();
};
Resolver.generateDefaultConstructor = function($this, symbol) {
  var enclosingSymbol = symbol.enclosingSymbol;
  var members = enclosingSymbol.type.members.values();
  var $arguments = [];
  var superArguments = null;
  var memberInitializers = [];
  var baseClass = Type.isClass(enclosingSymbol.type) ? Type.baseClass(enclosingSymbol.type) : null;
  if (baseClass !== null) {
    var $constructor = Type.$constructor(baseClass);
    if ($constructor !== null) {
      Resolver.initializeMember($this, $constructor);
      if ($constructor.type.symbol === null) {
        var argumentTypes = Type.argumentTypes($constructor.type);
        superArguments = [];
        for (var j = 0; j < argumentTypes.length; j = j + 1 | 0) {
          var name = "_" + $arguments.length.toString();
          var argument = Node.withChildren(new Node(16), [Node.withContent(new Node(34), new StringContent(name)), Node.withType(new Node(35), argumentTypes[j]), null]);
          argument.symbol = new Symbol(name, 18);
          argument.symbol.node = argument;
          $arguments.push(argument);
          superArguments.push(Node.withContent(new Node(34), new StringContent(name)));
        }
      } else {
        symbol.flags |= 8192;
        symbol.type = $this.cache.errorType;
        return;
      }
    }
  }
  var uninitializedMembers = [];
  for (var i = 0; i < members.length; i = i + 1 | 0) {
    var member = members[i];
    var memberSymbol = member.symbol;
    if (memberSymbol.kind === 20 && memberSymbol.enclosingSymbol === enclosingSymbol && memberSymbol.node.children[2] === null) {
      Resolver.initializeMember($this, member);
      if (member.type === $this.cache.errorType) {
        symbol.flags |= 8192;
        symbol.type = $this.cache.errorType;
        return;
      }
      uninitializedMembers.push(member);
    }
  }
  for (var i = 1; i < uninitializedMembers.length; i = i + 1 | 0) {
    var j = i;
    var member = uninitializedMembers[i];
    for (; j > 0 && uninitializedMembers[j - 1 | 0].symbol.node.range.start > member.symbol.node.range.start; j = j - 1 | 0) {
      uninitializedMembers[j] = uninitializedMembers[j - 1 | 0];
    }
    uninitializedMembers[j] = member;
  }
  for (var i = 0; i < uninitializedMembers.length; i = i + 1 | 0) {
    var member = uninitializedMembers[i];
    var name = "_" + $arguments.length.toString();
    var argument = Node.withChildren(new Node(16), [Node.withContent(new Node(34), new StringContent(name)), Node.withType(new Node(35), member.type), null]);
    argument.symbol = new Symbol(name, 18);
    argument.symbol.node = argument;
    $arguments.push(argument);
    memberInitializers.push(Node.withChildren(new Node(5), [Node.withContent(new Node(34), new StringContent(member.symbol.name)), Node.withContent(new Node(34), new StringContent(name))]));
  }
  symbol.kind = 17;
  symbol.node = Node.withChildren(new Node(14), [Node.withContent(new Node(34), new StringContent(symbol.name)), Node.withChildren(new Node(3), $arguments), Node.withChildren(new Node(2), []), superArguments !== null ? Node.withChildren(new Node(49), superArguments) : null, memberInitializers !== null ? Node.withChildren(new Node(3), memberInitializers) : null]);
  Node.appendChild(enclosingSymbol.node.children[1], symbol.node);
  var scope = new Scope(enclosingSymbol.node.scope);
  symbol.node.symbol = symbol;
  symbol.node.scope = scope;
  for (var i = 0; i < $arguments.length; i = i + 1 | 0) {
    Scope.insert(scope, $arguments[i].symbol);
  }
};
Resolver.generateDefaultToString = function($this, symbol) {
  var enclosingSymbol = symbol.enclosingSymbol;
  var enclosingNode = enclosingSymbol.node;
  var members = enclosingSymbol.type.members.values();
  var fields = [];
  var i;
  for (i = 0; i < members.length; i = i + 1 | 0) {
    var field = members[i].symbol;
    if (field.kind === 19 && !((field.flags & 16) !== 0)) {
      fields.push(field);
    }
  }
  for (i = 0; i < fields.length; i = i + 1 | 0) {
    var field = fields[i];
    Resolver.initializeSymbol($this, field);
    if (field.type === $this.cache.errorType) {
      break;
    }
    var value = field.enumValue;
    var j;
    for (j = 0; j < i; j = j + 1 | 0) {
      var other = fields[j];
      if (value === other.enumValue) {
        semanticErrorBadEnumToString($this.log, enclosingNode.children[0].range, enclosingSymbol.name, field.name, other.name, value);
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
  var statement;
  if (fields.length === 0 || i < fields.length) {
    statement = Node.withChildren(new Node(25), [Node.withContent(new Node(44), new StringContent(""))]);
  } else {
    var cases = [];
    for (i = 0; i < fields.length; i = i + 1 | 0) {
      var field = fields[i];
      cases.push(Node.createCase([Node.withChildren(new Node(46), [null, Node.withContent(new Node(34), new StringContent(field.name))])], Node.withChildren(new Node(2), [Node.withChildren(new Node(25), [Node.withContent(new Node(44), new StringContent(field.name))])])));
    }
    cases.push(Node.createCase([], Node.withChildren(new Node(2), [Node.withChildren(new Node(25), [Node.withContent(new Node(44), new StringContent(""))])])));
    statement = Node.createSwitch(new Node(36), cases);
  }
  symbol.kind = 16;
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
  if ((symbol.flags & 12288) === 0) {
    Resolver.initializeDeclaration($this, symbol.node);
  } else if ((symbol.flags & 4096) !== 0) {
    semanticErrorCyclicDeclaration($this.log, Node.firstNonExtensionSibling(symbol.node).children[0].range, symbol.name);
    symbol.type = $this.cache.errorType;
  }
};
Resolver.unsupportedNodeKind = function($this, node) {
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
Resolver.resolveProgram = function($this, node) {
  Resolver.resolveChildren($this, node);
};
Resolver.resolveFile = function($this, node) {
  Resolver.resolve($this, node.children[0], null);
};
Resolver.resolveBlock = function($this, node) {
  Resolver.resolveChildren($this, node);
};
Resolver.resolveCase = function($this, node) {
  var values = Node.caseValues(node);
  var block = Node.caseBlock(node);
  for (var i = 0; i < values.length; i = i + 1 | 0) {
    var value = values[i];
    Resolver.resolveAsExpressionWithConversion($this, value, $this.context.switchValue.type, 0);
    ConstantFolder.foldConstants($this.constantFolder, value);
    if (!(value.type === $this.cache.errorType) && !NodeKind.isConstant(value.kind)) {
      semanticErrorNonConstantCaseValue($this.log, value.range);
      value.type = $this.cache.errorType;
    }
  }
  Resolver.resolve($this, block, null);
};
Resolver.resolveUsingNamespace = function($this, node) {
  Resolver.checkInsideBlock($this, node);
};
Resolver.resolveNamespace = function($this, node) {
  Resolver.checkDeclarationLocation($this, node, 0);
  Resolver.initializeSymbol($this, node.symbol);
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
  if (SymbolKind.isTypeWithInstances(node.symbol.kind)) {
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
    var symbol = node.symbol;
    if (symbol.type === $this.cache.errorType) {
      $this.resultType = $this.cache.errorType;
    } else if (symbol.kind === 17) {
      $this.resultType = $this.cache.voidType;
    } else {
      $this.resultType = symbol.type.relevantTypes[0];
    }
    Resolver.resolve($this, block, null);
    if (!($this.resultType === $this.cache.errorType) && !($this.resultType === $this.cache.voidType) && !Node.blockAlwaysEndsWithReturn(block)) {
      semanticErrorMissingReturn($this.log, node.children[0].range, node.symbol.name, $this.resultType);
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
        semanticErrorBadSuperInitializer($this.log, superInitializer.range);
      }
      var $arguments = superInitializer.children;
      if (overriddenType === $this.cache.errorType) {
        Resolver.resolveNodesAsExpressions($this, $arguments);
      } else {
        Resolver.resolveArguments($this, $arguments, Type.argumentTypes(overriddenType), superInitializer.range, superInitializer.range);
      }
    } else if (overriddenType.symbol === null) {
      if (Type.argumentTypes(overriddenType).length > 0) {
        semanticErrorMissingSuperInitializer($this.log, node.children[0].range);
      } else {
        Node.replaceChild(node, 3, Node.withSymbol(Node.withChildren(new Node(49), []), overriddenMember.symbol));
      }
    }
    var memberInitializers = node.children[4];
    if (memberInitializers === null) {
      memberInitializers = Node.withChildren(new Node(3), []);
      Node.replaceChild(node, 4, memberInitializers);
    }
    if ((superInitializer !== null || memberInitializers.children.length > 0) && block === null) {
      semanticErrorAbstractConstructorInitializer($this.log, Range.span((superInitializer !== null ? superInitializer : memberInitializers.children[0]).range, (memberInitializers.children.length < 1 ? superInitializer : memberInitializers.children[memberInitializers.children.length - 1 | 0]).range));
    }
    var enclosingSymbol = node.symbol.enclosingSymbol;
    if (!((enclosingSymbol.flags & 2048) !== 0)) {
      var members = enclosingSymbol.type.members.values();
      var index = 0;
      for (var i = 0; i < members.length; i = i + 1 | 0) {
        var member = members[i];
        var memberSymbol = member.symbol;
        if (memberSymbol.kind === 20 && memberSymbol.enclosingSymbol === enclosingSymbol) {
          var value = memberSymbol.node.children[2];
          if (value !== null) {
            Resolver.initializeMember($this, member);
            var oldScope = $this.context.scope;
            $this.context.scope = node.scope.lexicalParent;
            $this.context.functionSymbol = null;
            Resolver.resolve($this, memberSymbol.node, null);
            $this.context.functionSymbol = node.symbol;
            $this.context.scope = oldScope;
            Node.replaceWith(value, new Node(50));
            Node.insertChild(memberInitializers, (index = index + 1 | 0) - 1 | 0, Node.withChildren(new Node(5), [Node.withType(Node.withSymbol(Node.withContent(new Node(34), new StringContent(memberSymbol.name)), memberSymbol), member.type), value]));
          } else {
            var j;
            for (j = 0; j < memberInitializers.children.length; j = j + 1 | 0) {
              if (memberInitializers.children[j].children[0].content.value === memberSymbol.name) {
                break;
              }
            }
            if (j === memberInitializers.children.length) {
              Resolver.initializeMember($this, member);
              Node.insertChild(memberInitializers, (index = index + 1 | 0) - 1 | 0, Node.withChildren(new Node(5), [Node.withType(Node.withSymbol(Node.withContent(new Node(34), new StringContent(memberSymbol.name)), memberSymbol), member.type), Node.withChildren(new Node(57), [Node.withType(new Node(35), member.type)])]));
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
Resolver.resolveVariable = function($this, node) {
  var symbol = node.symbol;
  Resolver.initializeSymbol($this, symbol);
  var value = node.children[2];
  var enclosingSymbol = symbol.enclosingSymbol;
  if (!((symbol.flags & 64) !== 0) && enclosingSymbol !== null) {
    var enclosingSymbolType = enclosingSymbol.type;
    if (Type.isInterface(enclosingSymbolType) || (symbol.flags & 16) !== 0 && Type.isEnum(enclosingSymbolType)) {
      Resolver.unexpectedStatement($this, node);
    } else if ((symbol.flags & 16) !== 0 && SymbolKind.isTypeWithInstances(enclosingSymbol.kind) && value === null) {
      semanticErrorUninitializedExtensionVariable($this.log, node.children[0].range);
    }
  }
  if (value !== null) {
    Resolver.resolveAsExpressionWithConversion($this, value, Symbol.isEnumValue(symbol) ? $this.cache.intType : symbol.type, 0);
  }
};
Resolver.resolveVariableCluster = function($this, node) {
  Resolver.resolveNodes($this, Node.clusterVariables(node));
};
Resolver.resolveParameter = function($this, node) {
  Resolver.initializeSymbol($this, node.symbol);
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
  Resolver.unsupportedNodeKind($this, node);
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
    if (node.kind === 26 && $this.resultType === $this.cache.voidType) {
      Node.become(node, Node.withChildren(new Node(30), [Node.remove(value)]));
      Resolver.resolve($this, node, null);
    } else {
      Resolver.resolveAsExpressionWithConversion($this, value, $this.resultType, 0);
    }
  } else if (!($this.resultType === $this.cache.errorType) && !($this.resultType === $this.cache.voidType)) {
    semanticErrorExpectedReturnValue($this.log, node.range, $this.resultType);
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
  Resolver.checkStatementLocation($this, node);
  Resolver.resolveAsExpressionWithConversion($this, node.children[0], $this.cache.boolType, 0);
};
Resolver.resolveExpression = function($this, node) {
  Resolver.checkStatementLocation($this, node);
  var value = node.children[0];
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
      semanticErrorBadDefaultCase($this.log, child.range);
    }
    var caseValues = Node.caseValues(child);
    for (var j = 0; j < caseValues.length; j = j + 1 | 0) {
      var caseValue = caseValues[j];
      if (caseValue.type === $this.cache.errorType) {
        continue;
      }
      var k;
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
Resolver.resolveModifier = function($this, node) {
  Resolver.resolveNodes($this, Node.modifierStatements(node));
};
Resolver.resolveName = function($this, node) {
  var name = node.content.value;
  var member = Scope.find($this.context.scope, name);
  if (member === null) {
    semanticErrorUndeclaredSymbol($this.log, node.range, name);
    return;
  }
  Resolver.initializePotentiallyDuplicatedMember($this, member, node.range);
  node.symbol = member.symbol;
  if (!Resolver.checkAccessToInstanceSymbol($this, node)) {
    node.type = $this.cache.errorType;
    return;
  }
  if (SymbolKind.isType(member.symbol.kind)) {
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
      semanticErrorNoCommonType($this.log, Range.span(trueNode.range, falseNode.range), trueType, falseType);
      return;
    }
  }
  Resolver.checkConversion($this, commonType, trueNode, 0);
  Resolver.checkConversion($this, commonType, falseNode, 0);
  node.type = commonType;
};
Resolver.resolveInt = function($this, node) {
  if (node.content.value === -2147483648) {
    syntaxErrorInvalidInteger($this.log, node.range, Range.toString(node.range));
  }
  node.type = $this.cache.intType;
};
Resolver.resolveInitializer = function($this, node) {
  var values = node.children;
  if ($this.typeContext === null) {
    semanticErrorMissingTypeContext($this.log, node.range);
    Resolver.resolveNodesAsExpressions($this, values);
    return;
  }
  if ($this.typeContext === $this.cache.errorType) {
    Resolver.resolveNodesAsExpressions($this, values);
    return;
  }
  if ($this.typeContext.symbol === $this.cache.listType.symbol) {
    var itemType = $this.typeContext.substitutions[0];
    for (var i = 0; i < values.length; i = i + 1 | 0) {
      Resolver.resolveAsExpressionWithConversion($this, values[i], itemType, 0);
    }
    node.type = $this.typeContext;
    return;
  }
  Node.become(node, Node.withRange(Node.createCall(Node.withRange(Node.withType(new Node(35), $this.typeContext), node.range), Node.removeChildren(node)), node.range));
  Resolver.resolveAsExpression($this, node);
};
Resolver.resolveDot = function($this, node) {
  var target = node.children[0];
  if (target !== null) {
    Resolver.resolve($this, target, null);
  }
  var type = target !== null ? target.type : $this.typeContext;
  if (type === null) {
    semanticErrorMissingTypeContext($this.log, node.range);
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
    semanticErrorUnknownMemberSymbol($this.log, dotName.range, name, type);
    return;
  }
  node.symbol = dotName.symbol = member.symbol;
  Resolver.initializePotentiallyDuplicatedMember($this, member, dotName.range);
  var symbolIsType = SymbolKind.isType(member.symbol.kind);
  var targetIsType = target === null || target.kind === 35;
  if (!Type.isNamespace(type) && (!Type.isEnum(type) || (member.symbol.flags & 16) !== 0)) {
    var isStatic = symbolIsType || (member.symbol.flags & 64) !== 0;
    if (isStatic && !targetIsType) {
      semanticErrorMemberUnexpectedStatic($this.log, dotName.range, name);
    } else if (!isStatic && targetIsType) {
      semanticErrorMemberUnexpectedInstance($this.log, dotName.range, name);
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
  if (value.kind === 56 && $this.typeContext !== null) {
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
        semanticErrorUnconstructableType($this.log, value.range, valueType);
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
    if (!(valueType.symbol === null)) {
      semanticErrorInvalidCall($this.log, value.range, valueType);
      Resolver.resolveNodesAsExpressions($this, $arguments);
      return;
    }
    node.type = valueType.relevantTypes[0];
    Resolver.resolveArguments($this, $arguments, Type.argumentTypes(valueType), node.range, value.range);
  }
};
Resolver.resolveSuperCall = function($this, node) {
  Resolver.unsupportedNodeKind($this, node);
};
Resolver.resolveSequence = function($this, node) {
  for (var i = 0, n = node.children.length; i < n; i = i + 1 | 0) {
    var child = node.children[i];
    if (i < (n - 1 | 0)) {
      Resolver.resolveAsExpression($this, child);
      Resolver.checkUnusedExpression($this, child);
    } else {
      Resolver.resolveAsExpressionWithConversion($this, child, $this.typeContext, node.parent.kind === 54 ? 1 : 0);
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
    semanticErrorMissingTypeContext($this.log, node.range);
  } else if (!($this.typeContext === $this.cache.errorType)) {
    if (!($this.typeContext.symbol === null)) {
      semanticErrorBadLambdaTypeContext($this.log, node.range, $this.typeContext);
    } else if (!($this.typeContext === $this.cache.errorType)) {
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
      if (!($this.resultType === $this.cache.errorType) && !($this.resultType === $this.cache.voidType) && !Node.blockAlwaysEndsWithReturn(block)) {
        semanticErrorLambdaMissingReturn($this.log, node.range, $this.resultType);
      }
    }
  }
  Resolver.resolveNodes($this, $arguments);
  Resolver.resolve($this, block, null);
  $this.resultType = oldResultType;
  $this.context.loop = oldLoop;
};
Resolver.resolveDefault = function($this, node) {
  var type = node.children[0];
  Resolver.resolveAsParameterizedType($this, type);
  Resolver.checkIsValidVariableType($this, type);
  node.type = type.type;
};
Resolver.resolveUntyped = function($this, node) {
  Resolver.resolveAsExpression($this, node.children[0]);
};
Resolver.resolveVar = function($this, node) {
  semanticErrorUnexpectedNode($this.log, node.range, node.kind);
};
Resolver.resolveFunctionType = function($this, node) {
  var result = node.children[0];
  var $arguments = Node.functionTypeArguments(node);
  Resolver.resolveAsParameterizedType($this, result);
  Resolver.resolveNodesAsVariableTypes($this, $arguments);
  if (!(result.type === $this.cache.errorType)) {
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
  if (kind === 63 && value.kind === 41 && value.content.value === -2147483648) {
    Node.become(node, Node.withType(Node.withRange(value, node.range), $this.cache.intType));
    return;
  }
  Resolver.resolveAsExpression($this, value);
  var type = value.type;
  if (type === $this.cache.errorType) {
    return;
  }
  if (kind === 62 || kind === 63) {
    if (Type.isEnum(type)) {
      node.type = $this.cache.intType;
    } else if (Type.isNumeric(type, $this.cache)) {
      node.type = type;
    }
  } else if (NodeKind.isUnaryStorageOperator(kind)) {
    if (!Type.isEnum(type) && Type.isNumeric(type, $this.cache)) {
      Resolver.checkStorage($this, value);
      node.type = type;
    }
  } else if (kind === 61) {
    if (type === $this.cache.boolType) {
      node.type = type;
    }
  } else if (kind === 64) {
    if (Type.isEnumFlags(type)) {
      node.type = type;
    } else if (Type.isInteger(type, $this.cache)) {
      node.type = $this.cache.intType;
    }
  }
  if (node.type === $this.cache.errorType) {
    semanticErrorNoUnaryOperator($this.log, node.range, kind, type);
    return;
  }
  Resolver.checkConversion($this, node.type, value, 0);
};
Resolver.resolveBinaryOperator = function($this, node) {
  var kind = node.kind;
  var left = node.children[0];
  var right = node.children[1];
  if (NodeKind.isBinaryStorageOperator(kind)) {
    Resolver.resolveAsExpression($this, left);
    if (kind === 89 || Type.isNumeric(left.type, $this.cache)) {
      Resolver.resolveAsExpressionWithConversion($this, right, left.type, 0);
      Resolver.checkStorage($this, left);
      node.type = left.type;
      return;
    }
  }
  if (kind === 74 || kind === 84) {
    var leftNeedsContext = Resolver.needsTypeContext($this, left);
    var rightNeedsContext = Resolver.needsTypeContext($this, right);
    if (leftNeedsContext && !rightNeedsContext) {
      Resolver.resolveAsExpression($this, right);
      Resolver.resolveAsExpressionWithTypeContext($this, left, right.type);
    } else if (!leftNeedsContext && rightNeedsContext) {
      Resolver.resolveAsExpression($this, left);
      Resolver.resolveAsExpressionWithTypeContext($this, right, left.type);
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
  if (kind === 74 || kind === 84) {
    commonType = TypeCache.commonImplicitType($this.cache, leftType, rightType);
    if (commonType !== null) {
      node.type = $this.cache.boolType;
    }
  } else if (kind === 69 || kind === 88 || kind === 83 || kind === 73) {
    if (Type.isNumeric(leftType, $this.cache) && Type.isNumeric(rightType, $this.cache)) {
      node.type = commonType = TypeCache.commonImplicitType($this.cache, leftType, rightType);
    }
  } else if (kind === 85 || kind === 86 || kind === 87) {
    if (Type.isInteger(leftType, $this.cache) && Type.isInteger(rightType, $this.cache)) {
      node.type = commonType = $this.cache.intType;
    }
  } else if (kind === 70 || kind === 71 || kind === 72) {
    if (leftType === rightType && Type.isEnumFlags(leftType)) {
      node.type = commonType = leftType;
    } else if (Type.isInteger(leftType, $this.cache) && Type.isInteger(rightType, $this.cache)) {
      node.type = commonType = $this.cache.intType;
    }
  } else if (kind === 81 || kind === 82) {
    if (leftType === $this.cache.boolType && rightType === $this.cache.boolType) {
      node.type = commonType = $this.cache.boolType;
    }
  } else if (kind === 79 || kind === 75 || kind === 80 || kind === 76) {
    if (Type.isNumeric(leftType, $this.cache) && Type.isNumeric(rightType, $this.cache) || leftType === $this.cache.stringType && rightType === $this.cache.stringType) {
      commonType = TypeCache.commonImplicitType($this.cache, leftType, rightType);
      node.type = $this.cache.boolType;
    }
  }
  if (node.type === $this.cache.errorType) {
    semanticErrorNoBinaryOperator($this.log, node.range, kind, leftType, rightType);
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
  Resolver.unsupportedNodeKind($this, node);
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
var SymbolKind = {};
SymbolKind.isNamespace = function($this) {
  return $this >= 8 && $this <= 9;
};
SymbolKind.isTypeWithInstances = function($this) {
  return $this >= 10 && $this <= 14;
};
SymbolKind.isEnum = function($this) {
  return $this >= 10 && $this <= 11;
};
SymbolKind.isObject = function($this) {
  return $this >= 12 && $this <= 14;
};
SymbolKind.isType = function($this) {
  return $this >= 4 && $this <= 14;
};
SymbolKind.isFunction = function($this) {
  return $this >= 15 && $this <= 17;
};
SymbolKind.isVariable = function($this) {
  return $this >= 18 && $this <= 20;
};
SymbolKind.isInstance = function($this) {
  return $this === 16 || $this === 20 || $this === 17;
};
SymbolKind.toString = function($this) {
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
    return "USING_ALIAS";
  case 8:
    return "GLOBAL_NAMESPACE";
  case 9:
    return "NAMESPACE";
  case 10:
    return "ENUM";
  case 11:
    return "ENUM_FLAGS";
  case 12:
    return "CLASS";
  case 13:
    return "STRUCT";
  case 14:
    return "INTERFACE";
  case 15:
    return "GLOBAL_FUNCTION";
  case 16:
    return "INSTANCE_FUNCTION";
  case 17:
    return "CONSTRUCTOR_FUNCTION";
  case 18:
    return "LOCAL_VARIABLE";
  case 19:
    return "GLOBAL_VARIABLE";
  case 20:
    return "INSTANCE_VARIABLE";
  default:
    return "";
  }
};
var SymbolFlag = {};
function Symbol(_0, _1) {
  this.flags = 0;
  this.type = null;
  this.node = null;
  this.enclosingSymbol = null;
  this.overriddenMember = null;
  this.enumValue = 0;
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
  return $this.enclosingSymbol !== null && $this.kind !== 4 && !($this.enclosingSymbol.kind === 8) ? Symbol.fullName($this.enclosingSymbol) + "." + $this.name : $this.name;
};
Symbol.hasParameters = function($this) {
  return $this.parameters !== null && $this.parameters.length > 0;
};
Symbol.isEnumValue = function($this) {
  return SymbolKind.isVariable($this.kind) && $this.enclosingSymbol !== null && SymbolKind.isEnum($this.enclosingSymbol.kind) && !(($this.flags & 16) !== 0);
};
Symbol.isObjectMember = function($this) {
  return $this.enclosingSymbol !== null && SymbolKind.isObject($this.enclosingSymbol.kind);
};
Symbol.isEnumMember = function($this) {
  return $this.enclosingSymbol !== null && SymbolKind.isEnum($this.enclosingSymbol.kind);
};
Symbol.isImportOrExport = function($this) {
  return ($this.flags & 2048) !== 0 || ($this.flags & 1024) !== 0;
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
Type.environmentToString = function(parameters, substitutions) {
  var text = "[";
  for (var i = 0; i < parameters.length; i = i + 1 | 0) {
    if (i > 0) {
      text = text + ", ";
    }
    text = text + parameters[i].name + " => " + Type.toString(substitutions[i]);
  }
  return text + "]";
};
Type.toString = function($this) {
  if ($this.symbol === null) {
    var text = Type.toString($this.relevantTypes[0]) + " fn(";
    var $arguments = Type.argumentTypes($this);
    for (var i = 0; i < $arguments.length; i = i + 1 | 0) {
      if (i > 0) {
        text = text + ", ";
      }
      text = text + Type.toString($arguments[i]);
    }
    return text + ")";
  }
  if (Type.hasParameters($this)) {
    var text = "";
    for (var i = 0; i < $this.symbol.parameters.length; i = i + 1 | 0) {
      if (i > 0) {
        text = text + ", ";
      }
      text = text + ($this.substitutions !== null ? Type.toString($this.substitutions[i]) : $this.symbol.parameters[i].name);
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
  return $this.symbol !== null && SymbolKind.isNamespace($this.symbol.kind);
};
Type.isEnum = function($this) {
  return $this.symbol !== null && SymbolKind.isEnum($this.symbol.kind);
};
Type.isEnumFlags = function($this) {
  return $this.symbol !== null && $this.symbol.kind === 11;
};
Type.isParameter = function($this) {
  return $this.symbol !== null && $this.symbol.kind === 4;
};
Type.isObject = function($this) {
  return $this.symbol !== null && SymbolKind.isObject($this.symbol.kind);
};
Type.isClass = function($this) {
  return $this.symbol !== null && $this.symbol.kind === 12;
};
Type.isStruct = function($this) {
  return $this.symbol !== null && $this.symbol.kind === 13;
};
Type.isInterface = function($this) {
  return $this.symbol !== null && $this.symbol.kind === 14;
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
  this.globalType = TypeCache.createType(new Symbol("<global>", 8));
  this.nullType = TypeCache.createType(new Symbol("null", 0));
  this.voidType = TypeCache.createType(new Symbol("void", 5));
  this.errorType = TypeCache.createType(new Symbol("<error>", 0));
  this.intType = null;
  this.boolType = null;
  this.floatType = null;
  this.doubleType = null;
  this.stringType = null;
  this.listType = null;
  this.hashTable = new IntMap();
}
TypeCache.createType = function(symbol) {
  var type = new Type(symbol);
  symbol.type = type;
  symbol.flags |= 8192;
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
  trace.log("substitute " + Type.toString(type) + " with " + Type.environmentToString(parameters, substitutions));
  trace.indent();
  var result;
  if (type.symbol === null) {
    result = TypeCache.parameterize($this, null, TypeCache.substituteAll($this, type.relevantTypes, parameters, substitutions));
  } else if (!Type.hasParameters(type)) {
    var index = parameters.indexOf(type.symbol);
    result = index >= 0 ? substitutions[index] : type;
  } else {
    result = TypeCache.parameterize($this, type, TypeCache.substituteAll($this, type.substitutions, parameters, substitutions));
  }
  trace.log("substitution gave " + Type.toString(result));
  trace.dedent();
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
  if (symbol !== null && substitutions !== null) {
    trace.log("parameterize " + (unparameterized !== null ? Type.toString(unparameterized) : "null") + " with " + Type.environmentToString(symbol.parameters, substitutions));
    trace.indent();
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
    if (substitutions !== null) {
      trace.log("parameterize gave " + Type.toString(type));
      trace.dedent();
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
LanguageService.typeFromPosition = function($this, line, column) {
  if ($this.previousResult !== null && $this.previousResult.program !== null && $this.previousSource !== null && column >= 0 && column < Source.contentsOfLine($this.previousSource, line).length && $this.previousResult.program.children.length === 2) {
    var index = $this.previousSource.lineOffsets[line] + column | 0;
    var previousFile = $this.previousResult.program.children[1];
    return service.typeFromPosition(previousFile, $this.previousSource, index);
  }
  return null;
};
LanguageService.checkForDiagnostics = function($this, input) {
  var options = new CompilerOptions();
  var compiler = new Compiler();
  $this.previousSource = new Source("<input>", input);
  options.inputs = [$this.previousSource];
  $this.previousResult = Compiler.compile(compiler, options);
  var diagnostics = [];
  for (var i = 0; i < compiler.log.diagnostics.length; i = i + 1 | 0) {
    var diagnostic = compiler.log.diagnostics[i];
    var range = diagnostic.range;
    if (range.source === $this.previousSource) {
      var start = Source.indexToLineColumn(range.source, range.start);
      var type;
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
LanguageService.checkForCompletions = function($this, input, line, column) {
  var options = new CompilerOptions();
  var compiler = new Compiler();
  $this.previousSource = new Source("<input>", input);
  options.inputs = [$this.previousSource];
  $this.previousResult = Compiler.compile(compiler, options);
  if ($this.previousResult.program !== null && column >= 0 && column <= Source.contentsOfLine($this.previousSource, line).length && $this.previousResult.program.children.length === 2) {
    var index = $this.previousSource.lineOffsets[line] + column | 0;
    var previousFile = $this.previousResult.program.children[1];
    return service.completionsFromPosition(previousFile, $this.previousResult.resolver, $this.previousSource, index);
  }
  return null;
};
var service = {};
function nodeKindCheck(kind) {
  return function(node) {
    return node.kind === kind;
  };
}
function checkAllNodeKinds(nodes, check) {
  for (var i = 0; i < nodes.length; i = i + 1 | 0) {
    if (!check(nodes[i])) {
      return false;
    }
  }
  return true;
}
function createOperatorMap() {
  var result = new IntMap();
  result.set(61, new OperatorInfo("!", 13, 0));
  result.set(62, new OperatorInfo("+", 13, 0));
  result.set(63, new OperatorInfo("-", 13, 0));
  result.set(64, new OperatorInfo("~", 13, 0));
  result.set(65, new OperatorInfo("++", 13, 0));
  result.set(66, new OperatorInfo("--", 13, 0));
  result.set(67, new OperatorInfo("++", 14, 0));
  result.set(68, new OperatorInfo("--", 14, 0));
  result.set(69, new OperatorInfo("+", 11, 1));
  result.set(70, new OperatorInfo("&", 7, 1));
  result.set(71, new OperatorInfo("|", 5, 1));
  result.set(72, new OperatorInfo("^", 6, 1));
  result.set(73, new OperatorInfo("/", 12, 1));
  result.set(74, new OperatorInfo("==", 8, 1));
  result.set(75, new OperatorInfo(">", 9, 1));
  result.set(76, new OperatorInfo(">=", 9, 1));
  result.set(77, new OperatorInfo("in", 9, 1));
  result.set(78, new OperatorInfo("[]", 15, 1));
  result.set(79, new OperatorInfo("<", 9, 1));
  result.set(80, new OperatorInfo("<=", 9, 1));
  result.set(81, new OperatorInfo("&&", 4, 1));
  result.set(82, new OperatorInfo("||", 3, 1));
  result.set(83, new OperatorInfo("*", 12, 1));
  result.set(84, new OperatorInfo("!=", 8, 1));
  result.set(85, new OperatorInfo("%", 12, 1));
  result.set(86, new OperatorInfo("<<", 10, 1));
  result.set(87, new OperatorInfo(">>", 10, 1));
  result.set(88, new OperatorInfo("-", 11, 1));
  result.set(89, new OperatorInfo("=", 2, 2));
  result.set(90, new OperatorInfo("+=", 2, 2));
  result.set(91, new OperatorInfo("&=", 2, 2));
  result.set(92, new OperatorInfo("|=", 2, 2));
  result.set(93, new OperatorInfo("^=", 2, 2));
  result.set(94, new OperatorInfo("/=", 2, 2));
  result.set(95, new OperatorInfo("*=", 2, 2));
  result.set(96, new OperatorInfo("%=", 2, 2));
  result.set(97, new OperatorInfo("<<=", 2, 2));
  result.set(98, new OperatorInfo(">>=", 2, 2));
  result.set(99, new OperatorInfo("-=", 2, 2));
  return result;
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
function encodeBase64(data) {
  var result = "";
  var n = data.length;
  var i;
  for (i = 0; (i + 2 | 0) < n; i = i + 3 | 0) {
    var c = data.charCodeAt(i) << 16 | data.charCodeAt(i + 1 | 0) << 8 | data.charCodeAt(i + 2 | 0);
    result = result + BASE64[c >> 18] + BASE64[c >> 12 & 63] + BASE64[c >> 6 & 63] + BASE64[c & 63];
  }
  if (i < n) {
    var a = data.charCodeAt(i);
    result = result + BASE64[a >> 2];
    if ((i + 1 | 0) < n) {
      var b = data.charCodeAt(i + 1 | 0);
      result = result + BASE64[a << 4 & 48 | b >> 4] + BASE64[b << 2 & 60] + "=";
    } else {
      result = result + BASE64[a << 4 & 48] + "==";
    }
  }
  return result;
}
function hashCombine(left, right) {
  return left ^ ((right - 1640531527 | 0) + (left << 6) | 0) + (left >> 2);
}
function doubleToString(value) {
  var result = value.toString();
  if (result.indexOf(".") < 0) {
    result = result + ".0";
  }
  return result;
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
      result = result + text.slice(start, i);
      var escape = i = i + 1 | 0;
      if ((i + 1 | 0) < text.length) {
        c = text.charCodeAt((i = i + 1 | 0) - 1 | 0);
        if (c === 110) {
          result = result + "\n";
          start = i;
          continue;
        } else if (c === 114) {
          result = result + "\r";
          start = i;
          continue;
        } else if (c === 116) {
          result = result + "\t";
          start = i;
          continue;
        } else if (c === 101) {
          result = result + "\x1B";
          start = i;
          continue;
        } else if (c === 48) {
          result = result + "\0";
          start = i;
          continue;
        } else if (c === 92 || c === 34 || c === 39) {
          result = result + String.fromCharCode(c);
          start = i;
          continue;
        } else if (c === 120) {
          var c0 = (i + 1 | 0) < text.length ? parseHexCharacter(text.charCodeAt((i = i + 1 | 0) - 1 | 0)) : -1;
          var c1 = (i + 1 | 0) < text.length ? parseHexCharacter(text.charCodeAt((i = i + 1 | 0) - 1 | 0)) : -1;
          if (c0 !== -1 && c1 !== -1) {
            result = result + String.fromCharCode(c0 << 4 | c1);
            start = i;
            continue;
          }
        }
      }
      syntaxErrorInvalidEscapeSequence(log, new Range(range.source, range.start + escape | 0, range.start + i | 0), text.slice(escape, i));
      isValidString = false;
    } else {
      i = i + 1 | 0;
    }
  }
  result = result + text.slice(start, i);
  return isValidString ? new StringContent(result) : null;
}
function quoteString(text, quote) {
  var result = "";
  var quoteString = String.fromCharCode(quote);
  result = result + quoteString;
  var start = 0;
  var i;
  for (i = 0; i < text.length; i = i + 1 | 0) {
    var c = text.charCodeAt(i);
    if (c === quote) {
      result = result + text.slice(start, i) + "\\" + quoteString;
      start = i + 1 | 0;
    } else if (c === 10) {
      result = result + text.slice(start, i) + "\\n";
      start = i + 1 | 0;
    } else if (c === 13) {
      result = result + text.slice(start, i) + "\\r";
      start = i + 1 | 0;
    } else if (c === 9) {
      result = result + text.slice(start, i) + "\\t";
      start = i + 1 | 0;
    } else if (c === 0) {
      result = result + text.slice(start, i) + "\\0";
      start = i + 1 | 0;
    } else if (c === 92) {
      result = result + text.slice(start, i) + "\\\\";
      start = i + 1 | 0;
    } else if (c < 32 || c >= 127 && c <= 255) {
      result = result + text.slice(start, i) + "\\x" + HEX[c >> 4] + HEX[c & 15];
      start = i + 1 | 0;
    }
  }
  result = result + text.slice(start, i) + quoteString;
  return result;
}
function replace(text, before, after) {
  var result = "";
  var index;
  while ((index = text.indexOf(before)) !== -1) {
    result = result + text.slice(0, index) + after;
    text = text.slice(index + before.length | 0, text.length);
  }
  return result + text;
}
function repeat(text, count) {
  var result = "";
  for (var i = 0; i < count; i = i + 1 | 0) {
    result = result + text;
  }
  return result;
}
function splitPath(path) {
  var slashIndex = Math.imax(path.lastIndexOf("/"), path.lastIndexOf("\\"));
  return slashIndex === -1 ? new SplitPath(".", path) : new SplitPath(path.slice(0, slashIndex), path.slice(slashIndex + 1 | 0, path.length));
}
function bytesToString(bytes) {
  if (bytes === 1) {
    return "1 byte";
  }
  if (bytes < 1024) {
    return bytes.toString() + " bytes";
  }
  if (bytes < 1048576) {
    return (Math.round(bytes / 1024 * 10) / 10).toString() + "kb";
  }
  if (bytes < 1073741824) {
    return (Math.round(bytes / 1048576 * 10) / 10).toString() + "mb";
  }
  return (Math.round(bytes / 1073741824 * 10) / 10).toString() + "gb";
}
trace.indent = function() {
};
trace.log = function(text) {
};
trace.dedent = function() {
};
io.printWithColor = function(color, text) {
  io.setColor(color);
  io.print(text);
  io.setColor(0);
};
frontend.printError = function(text) {
  io.printWithColor(91, "error: ");
  io.printWithColor(1, text + "\n");
};
frontend.printNote = function(text) {
  io.printWithColor(90, "note: ");
  io.printWithColor(1, text + "\n");
};
frontend.printWarning = function(text) {
  io.printWithColor(95, "warning: ");
  io.printWithColor(1, text + "\n");
};
frontend.printUsage = function() {
  io.printWithColor(92, "\nusage: ");
  io.printWithColor(1, "skewc [flags] [inputs]\n");
  io.print("\n  --help (-h)       Print this message.\n\n  --verbose         Print out useful information about the compilation.\n\n  --target=___      Set the target language. Valid target languages: none, js,\n                    lisp-ast, json-ast, and xml-ast.\n\n  --output-file=___ Combines all output into a single file.\n\n  --js-source-map   Generate a source map when targeting JavaScript. The source\n                    map will be saved with the \".map\" extension in the same\n                    directory as the main output file.\n\n");
};
frontend.afterEquals = function(text) {
  var equals = text.indexOf("=");
  return text.slice(equals + 1 | 0, text.length);
};
frontend.startsWith = function(text, prefix) {
  return text.length >= prefix.length && text.slice(0, prefix.length) === prefix;
};
frontend.main = function(args) {
  var inputs = [];
  var flags = new frontend.Flags();
  for (var i = 0; i < args.length; i = i + 1 | 0) {
    var arg = args[i];
    if (arg.length === 0) {
      continue;
    }
    if (arg.charCodeAt(0) !== 45) {
      inputs.push(arg);
      continue;
    }
    if (arg === "-help" || arg === "--help" || arg === "-h") {
      frontend.printUsage();
      return 0;
    } else if (arg === "-verbose" || arg === "--verbose") {
      flags.verbose = true;
      continue;
    } else if (arg === "-optimize" || arg === "--optimize") {
      flags.optimize = true;
      continue;
    } else if (arg === "-js-source-map" || arg === "--js-source-map") {
      flags.jsSourceMap = true;
      continue;
    } else if (frontend.startsWith(arg, "-target=") || frontend.startsWith(arg, "--target=")) {
      flags.target = frontend.afterEquals(arg);
      continue;
    } else if (frontend.startsWith(arg, "-output-file=") || frontend.startsWith(arg, "--output-file=")) {
      flags.outputFile = frontend.afterEquals(arg);
      continue;
    }
    frontend.printError("Unknown flag " + quoteString(arg, 34));
    return 1;
  }
  if (inputs.length === 0) {
    frontend.printError("Missing input files");
    return 1;
  }
  var target;
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
  options.targetFormat = target;
  options.optimize = flags.optimize;
  options.outputFile = flags.outputFile === "" ? "<stdout>" : flags.outputFile;
  options.jsSourceMap = flags.jsSourceMap && flags.outputFile !== "" && target === 1;
  for (var i = 0; i < inputs.length; i = i + 1 | 0) {
    var input = inputs[i];
    var source = io.readFile(input);
    if (source === null) {
      frontend.printError("Could not read from " + quoteString(input, 34));
      return 1;
    }
    options.inputs.push(source);
  }
  var compiler = new Compiler();
  var result = Compiler.compile(compiler, options);
  var log = compiler.log;
  for (var i = 0; i < log.diagnostics.length; i = i + 1 | 0) {
    var diagnostic = log.diagnostics[i];
    if (!(diagnostic.range.source === null)) {
      io.printWithColor(1, Range.locationString(diagnostic.range) + ": ");
    }
    switch (diagnostic.kind) {
    case 1:
      frontend.printWarning(diagnostic.text);
      break;
    case 0:
      frontend.printError(diagnostic.text);
      break;
    }
    if (!(diagnostic.range.source === null)) {
      var formatted = Range.format(diagnostic.range, io.terminalWidth);
      io.print(formatted.line + "\n");
      io.printWithColor(92, formatted.range + "\n");
    }
    if (!(diagnostic.noteRange.source === null)) {
      io.printWithColor(1, Range.locationString(diagnostic.noteRange) + ": ");
      frontend.printNote(diagnostic.noteText);
      var formatted = Range.format(diagnostic.noteRange, io.terminalWidth);
      io.print(formatted.line + "\n");
      io.printWithColor(92, formatted.range + "\n");
    }
  }
  var hasErrors = log.errorCount > 0;
  var hasWarnings = log.warningCount > 0;
  var summary = "";
  if (hasWarnings) {
    summary = summary + (log.warningCount.toString() + (log.warningCount === 1 ? " warning" : " warnings"));
    if (hasErrors) {
      summary = summary + " and ";
    }
  }
  if (hasErrors) {
    summary = summary + (log.errorCount.toString() + (log.errorCount === 1 ? " error" : " errors"));
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
  if (result.outputs !== null) {
    for (var i = 0; i < result.outputs.length; i = i + 1 | 0) {
      var output = result.outputs[i];
      if (flags.outputFile === "") {
        io.print(output.contents);
        continue;
      }
      if (!io.writeFile(output.name, output.contents)) {
        frontend.printError("Could not write to " + quoteString(output.name, 34));
        return 1;
      }
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
    while (yy_current_state !== 260) {
      var index = 0;
      if (yy_cp < text_length) {
        var c = text.charCodeAt(yy_cp);
        if (c < 127) {
          index = c;
        }
      } else {
        break;
      }
      var yy_c = yy_ec[index];
      if (yy_accept[yy_current_state] !== 98) {
        yy_last_accepting_state = yy_current_state;
        yy_last_accepting_cpos = yy_cp;
      }
      while (yy_chk[yy_base[yy_current_state] + yy_c | 0] !== yy_current_state) {
        yy_current_state = yy_def[yy_current_state];
        if (yy_current_state >= 261) {
          yy_c = yy_meta[yy_c];
        }
      }
      yy_current_state = yy_nxt[yy_base[yy_current_state] + yy_c | 0];
      yy_cp = yy_cp + 1 | 0;
    }
    var yy_act = yy_accept[yy_current_state];
    while (yy_act === 98) {
      yy_cp = yy_last_accepting_cpos;
      yy_current_state = yy_last_accepting_state;
      yy_act = yy_accept[yy_current_state];
    }
    if (yy_act === 97) {
      continue;
    } else if (yy_act === 33) {
      syntaxErrorExtraData(log, new Range(source, yy_bp, yy_cp), text.slice(yy_bp, yy_cp));
      break;
    } else if (yy_act !== 30) {
      tokens.push(new Token(new Range(source, yy_bp, yy_cp), yy_act, text.slice(yy_bp, yy_cp)));
    }
  }
  tokens.push(new Token(new Range(source, text_length, text_length), 30, ""));
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
      if (topKind === 58 && tokenKind !== 58 && tokenKind !== 42 && tokenKind !== 53 && tokenKind !== 21 && tokenKind !== 27 && tokenKind !== 38 && tokenKind !== 57 && tokenKind !== 80 && !tokenStartsWithGreaterThan) {
        stack.pop();
      } else {
        break;
      }
    }
    if (tokenKind === 57 || tokenKind === 55 || tokenKind === 56 || tokenKind === 58) {
      stack.push(i);
      continue;
    }
    if (tokenKind === 80 || tokenKind === 78 || tokenKind === 79 || tokenStartsWithGreaterThan) {
      while (stack.length > 0) {
        var top = tokens[stack[stack.length - 1 | 0]];
        var topKind = top.kind;
        if (tokenStartsWithGreaterThan && topKind !== 58) {
          break;
        }
        stack.pop();
        if (topKind === 58) {
          if (!tokenStartsWithGreaterThan) {
            continue;
          }
          if (tokenKind !== 40) {
            var range = token.range;
            var start = range.start;
            var text = token.text.slice(1, token.text.length);
            var kind = tokenKind === 83 ? 40 : tokenKind === 41 ? 2 : tokenKind === 12 ? 41 : 33;
            tokens.splice(i + 1 | 0, 0, new Token(new Range(range.source, start + 1 | 0, range.end), kind, text));
            token.range = new Range(range.source, start, start + 1 | 0);
            token.text = ">";
          }
          top.kind = 99;
          token.kind = 100;
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
function syntaxErrorInvalidEscapeSequence(log, range, text) {
  Log.error(log, range, "Invalid escape sequence " + firstLineOf(string.append(string.append("\"", text), "\"")));
}
function syntaxErrorInvalidCharacter(log, range, text) {
  Log.error(log, range, "Invalid character literal " + firstLineOf(text));
}
function syntaxErrorInvalidInteger(log, range, text) {
  Log.error(log, range, "Invalid integer literal " + text);
}
function syntaxErrorExtraData(log, range, text) {
  Log.error(log, range, "Syntax error " + string.append(string.append("\"", text), "\""));
}
function syntaxErrorUnexpectedToken(log, token) {
  Log.error(log, token.range, "Unexpected " + TokenKind.toString(token.kind));
}
function syntaxErrorExpectedToken(log, found, expected) {
  Log.error(log, found.range, "Expected " + TokenKind.toString(expected) + " but found " + TokenKind.toString(found.kind));
}
function syntaxErrorUnterminatedToken(log, range, what) {
  Log.error(log, range, "Unterminated " + what);
}
function syntaxErrorBadForEach(log, range) {
  Log.error(log, range, "More than one variable inside a for-each loop");
}
function syntaxWarningOctal(log, range) {
  Log.warning(log, range, "Use the prefix \"0o\" for octal numbers");
}
function scanForToken(context, kind, tokenScan) {
  if (ParserContext.expect(context, kind)) {
    return true;
  }
  while (!(ParserContext.current(context).kind === 30)) {
    var currentKind = ParserContext.current(context).kind;
    if (currentKind === 80 || currentKind === 79 || currentKind === 78 || currentKind === 81 && tokenScan === 1) {
      return ParserContext.eat(context, kind);
    }
    if (tokenScan === 1 && (currentKind === 1 || currentKind === 16 || currentKind === 19 || currentKind === 22 || currentKind === 26 || currentKind === 31 || currentKind === 34 || currentKind === 36 || currentKind === 39 || currentKind === 43 || currentKind === 44 || currentKind === 47 || currentKind === 48 || currentKind === 65 || currentKind === 70 || currentKind === 72 || currentKind === 73 || currentKind === 74 || currentKind === 77 || currentKind === 84 || currentKind === 86 || currentKind === 88 || currentKind === 93 || currentKind === 0 || currentKind === 95 || currentKind === 96)) {
      return true;
    }
    ParserContext.next(context);
  }
  return false;
}
function parseGroup(context, allowLambda) {
  var token = ParserContext.current(context);
  if (!ParserContext.expect(context, 57)) {
    return null;
  }
  if (allowLambda === 0 || !ParserContext.eat(context, 80)) {
    var value = Pratt.parseIgnoringParselet(pratt, context, 0, null);
    scanForToken(context, 80, 1);
    return value;
  }
  if (!(ParserContext.current(context).kind === 54)) {
    ParserContext.expect(context, 54);
    return Node.withRange(new Node(50), ParserContext.spanSince(context, token.range));
  }
  return Node.withRange(Node.withChildren(new Node(52), []), ParserContext.spanSince(context, token.range));
}
function parseName(context) {
  var token = ParserContext.current(context);
  if (!ParserContext.expect(context, 42)) {
    return null;
  }
  return Node.withRange(Node.withContent(new Node(34), new StringContent(token.text)), token.range);
}
function parseBlock(context, hint) {
  var token = ParserContext.current(context);
  if (!ParserContext.expect(context, 55)) {
    return null;
  }
  var statements = parseStatements(context, hint);
  scanForToken(context, 78, 0);
  return Node.withRange(Node.withChildren(new Node(2), statements), ParserContext.spanSince(context, token.range));
}
function parseBlockOrStatement(context, hint) {
  if (ParserContext.current(context).kind === 55) {
    return parseBlock(context, hint);
  }
  var statement = parseStatement(context, hint);
  if (statement === null) {
    return null;
  }
  return Node.withRange(Node.withChildren(new Node(2), [statement]), statement.range);
}
function parseLambdaBlock(context) {
  if (ParserContext.current(context).kind === 55) {
    return parseBlock(context, 0);
  }
  if (ParserContext.current(context).kind === 80 || ParserContext.current(context).kind === 21 || ParserContext.current(context).kind === 81) {
    return Node.withChildren(new Node(2), []);
  }
  var value = Pratt.parseIgnoringParselet(pratt, context, 1, null);
  return Node.withRange(Node.withChildren(new Node(2), [Node.withRange(Node.withChildren(new Node(26), [value]), value.range)]), value.range);
}
function parseCaseStatement(context) {
  var token = ParserContext.current(context);
  var values = [];
  if (!ParserContext.eat(context, 24)) {
    if (!ParserContext.expect(context, 17)) {
      return null;
    }
    do {
      if (ParserContext.current(context).kind === 55) {
        ParserContext.unexpectedToken(context);
        values.push(new Node(50));
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
  while (!(ParserContext.current(context).kind === 78) && !(ParserContext.current(context).kind === 30)) {
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
  if (!ParserContext.expect(context, 57)) {
    return null;
  }
  while (!(ParserContext.current(context).kind === 80)) {
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
  scanForToken(context, 80, 0);
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
  var bound = ParserContext.eat(context, 53) ? Pratt.parseIgnoringParselet(pratt, context, 1, null) : null;
  return Node.withRange(Node.withChildren(new Node(17), [name, bound]), ParserContext.spanSince(context, token.range));
}
function parseParameters(context) {
  var token = ParserContext.current(context);
  var parameters = [];
  if (!ParserContext.eat(context, 99)) {
    return null;
  }
  while (parameters.length === 0 || !(ParserContext.current(context).kind === 100)) {
    if (parameters.length > 0 && !ParserContext.expect(context, 21)) {
      break;
    }
    var parameter = parseParameter(context);
    if (parameter === null) {
      break;
    }
    parameters.push(parameter);
  }
  scanForToken(context, 100, 1);
  return Node.withRange(Node.withChildren(new Node(3), parameters), ParserContext.spanSince(context, token.range));
}
function parseArgumentList(context, left, right, comma) {
  var values = [];
  if (!ParserContext.expect(context, left)) {
    return values;
  }
  while (!(ParserContext.current(context).kind === right)) {
    if (comma === 0 && values.length > 0 && !ParserContext.expect(context, 21)) {
      break;
    }
    var value = Pratt.parseIgnoringParselet(pratt, context, 1, null);
    values.push(value);
    if (value.kind === 50 || comma === 1 && !(ParserContext.current(context).kind === right) && !ParserContext.expect(context, 21)) {
      break;
    }
  }
  scanForToken(context, right, 1);
  return values;
}
function parseTypeList(context, end) {
  var token = ParserContext.current(context);
  var types = [];
  while (types.length === 0 || !(ParserContext.current(context).kind === end)) {
    if (ParserContext.current(context).kind === 55) {
      ParserContext.unexpectedToken(context);
      break;
    }
    if (types.length > 0 && !ParserContext.eat(context, 21)) {
      ParserContext.expect(context, end);
      break;
    }
    if (ParserContext.current(context).kind === 55) {
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
  var bases = ParserContext.eat(context, 20) ? Node.withChildren(new Node(3), parseTypeList(context, 55)) : null;
  var block = parseBlock(context, 2);
  if (block === null) {
    return null;
  }
  return Node.withRange(Node.withChildren(new Node(kind), [name, block, bases, parameters]), ParserContext.spanSince(context, token.range));
}
function parseNestedNamespaceBlock(context) {
  if (!ParserContext.eat(context, 27)) {
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
    if (ParserContext.current(context).kind === 87) {
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
  if (!ParserContext.eat(context, 81)) {
    block = parseBlock(context, 0);
    if (block === null) {
      return null;
    }
  }
  return Node.withRange(Node.withChildren(new Node(14), [name, $arguments, block, superInitializer, memberInitializers]), ParserContext.spanSince(context, token.range));
}
function parseExpression(context) {
  if (ParserContext.current(context).kind === 55) {
    ParserContext.unexpectedToken(context);
    return null;
  }
  var token = ParserContext.current(context);
  var value = Pratt.parseIgnoringParselet(pratt, context, 0, null);
  if (!scanForToken(context, 81, 1) && ParserContext.current(context).range.start === token.range.start) {
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
  if (!ParserContext.eat(context, 81)) {
    value = Pratt.parseIgnoringParselet(pratt, context, 0, null);
    scanForToken(context, 81, 1);
  }
  return Node.withRange(Node.withChildren(new Node(25), [value]), ParserContext.spanSince(context, token.range));
}
function parseBreak(context) {
  var token = ParserContext.next(context);
  ParserContext.expect(context, 81);
  return Node.withRange(new Node(27), ParserContext.spanSince(context, token.range));
}
function parseContinue(context) {
  var token = ParserContext.next(context);
  ParserContext.expect(context, 81);
  return Node.withRange(new Node(28), ParserContext.spanSince(context, token.range));
}
function parseAssert(context) {
  var token = ParserContext.next(context);
  var value = Pratt.parseIgnoringParselet(pratt, context, 0, null);
  scanForToken(context, 81, 1);
  return Node.withRange(Node.withChildren(new Node(29), [value]), ParserContext.spanSince(context, token.range));
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
  return Node.withRange(Node.withChildren(new Node(23), [value, block]), ParserContext.spanSince(context, token.range));
}
function parseDoWhile(context) {
  var token = ParserContext.next(context);
  var block = parseBlockOrStatement(context, 0);
  if (block === null) {
    return null;
  }
  if (!ParserContext.expect(context, 96)) {
    return null;
  }
  var value = parseGroup(context, 0);
  scanForToken(context, 81, 1);
  return Node.withRange(Node.withChildren(new Node(24), [value, block]), ParserContext.spanSince(context, token.range));
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
  if (ParserContext.eat(context, 29)) {
    falseBlock = parseBlockOrStatement(context, 0);
    if (falseBlock === null) {
      return null;
    }
  }
  return Node.withRange(Node.withChildren(new Node(20), [value, trueBlock, falseBlock]), ParserContext.spanSince(context, token.range));
}
function parseExtension(context) {
  var token = ParserContext.next(context);
  var name = parseName(context);
  if (name === null) {
    return null;
  }
  var bases = ParserContext.eat(context, 20) ? Node.withChildren(new Node(3), parseTypeList(context, 55)) : null;
  var block = parseBlock(context, 2);
  if (block === null) {
    return null;
  }
  return Node.withRange(Node.withChildren(new Node(13), [name, block, bases]), ParserContext.spanSince(context, token.range));
}
function parseEnum(context) {
  var token = ParserContext.next(context);
  var isFlags = false;
  if (ParserContext.current(context).kind === 42 && ParserContext.current(context).text === "flags") {
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
  while (variables.length === 0 || !(ParserContext.current(context).kind === 81) && !(ParserContext.current(context).kind === 45)) {
    if (variables.length > 0 && !ParserContext.eat(context, 21)) {
      ParserContext.expect(context, 81);
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
  if (!ParserContext.expect(context, 57)) {
    return null;
  }
  var setup = null;
  var test = null;
  var update = null;
  do {
    if (!(ParserContext.current(context).kind === 81) && !(ParserContext.current(context).kind === 80)) {
      setup = Pratt.parseIgnoringParselet(pratt, context, 14, null);
      if (ParserContext.current(context).kind === 42) {
        var name = parseName(context);
        setup = name !== null ? parseVariableCluster(context, setup, name) : null;
        if (setup !== null && ParserContext.eat(context, 45)) {
          var values = Pratt.parseIgnoringParselet(pratt, context, 0, null);
          scanForToken(context, 80, 0);
          var body = parseBlockOrStatement(context, 0);
          if (body === null) {
            return null;
          }
          var variables = Node.clusterVariables(setup);
          if (variables.length > 1) {
            syntaxErrorBadForEach(context.log, setup.range);
          }
          var value = Node.withChildren(new Node(16), [Node.remove(variables[0].children[0]), Node.remove(setup.children[0]), null]);
          return Node.withRange(Node.withChildren(new Node(22), [value, values, body]), ParserContext.spanSince(context, token.range));
        }
      } else if (!(ParserContext.current(context).kind === 81)) {
        setup = Pratt.resumeIgnoringParselet(pratt, context, 0, setup, null);
      }
    }
    if (!ParserContext.expect(context, 81)) {
      break;
    }
    if (!(ParserContext.current(context).kind === 81) && !(ParserContext.current(context).kind === 80)) {
      test = Pratt.parseIgnoringParselet(pratt, context, 0, null);
    }
    if (!ParserContext.expect(context, 81)) {
      break;
    }
    if (!(ParserContext.current(context).kind === 80)) {
      update = Pratt.parseIgnoringParselet(pratt, context, 0, null);
    }
  } while (false);
  scanForToken(context, 80, 0);
  var block = parseBlockOrStatement(context, 0);
  if (block === null) {
    return null;
  }
  return Node.withRange(Node.withChildren(new Node(21), [setup, test, update, block]), ParserContext.spanSince(context, token.range));
}
function parseSuperCall(context) {
  var token = ParserContext.next(context);
  var values = parseArgumentList(context, 57, 80, 0);
  return Node.withRange(Node.withChildren(new Node(49), values), ParserContext.spanSince(context, token.range));
}
function parsePossibleTypedDeclaration(context, hint) {
  var type = Pratt.parseIgnoringParselet(pratt, context, 14, null);
  if (!(ParserContext.current(context).kind === 42)) {
    var value = Pratt.resumeIgnoringParselet(pratt, context, 0, type, null);
    scanForToken(context, 81, 1);
    return Node.withRange(Node.withChildren(new Node(30), [value]), ParserContext.spanSince(context, type.range));
  }
  var name = parseName(context);
  if (name === null) {
    return null;
  }
  if (ParserContext.current(context).kind === 57) {
    var $arguments = parseArgumentVariables(context);
    if ($arguments === null) {
      return null;
    }
    var block = null;
    if (!ParserContext.eat(context, 81)) {
      block = parseBlock(context, 0);
      if (block === null) {
        return null;
      }
    }
    return Node.withRange(Node.withChildren(new Node(15), [name, $arguments, block, type]), ParserContext.spanSince(context, type.range));
  }
  var cluster = parseVariableCluster(context, type, name);
  scanForToken(context, 81, 1);
  var last = cluster.children[cluster.children.length - 1 | 0];
  Node.withRange(last, ParserContext.spanSince(context, last.range));
  return cluster;
}
function parseUsing(context) {
  var token = ParserContext.next(context);
  var name = parseName(context);
  if (name === null) {
    scanForToken(context, 81, 1);
    var range = ParserContext.spanSince(context, token.range);
    return Node.withRange(Node.withChildren(new Node(30), [Node.withRange(new Node(50), range)]), range);
  }
  if (!ParserContext.eat(context, 2)) {
    var value = Pratt.resumeIgnoringParselet(pratt, context, 0, name, null);
    scanForToken(context, 81, 1);
    return Node.withRange(Node.withChildren(new Node(33), [value]), ParserContext.spanSince(context, token.range));
  } else {
    var value = Pratt.parseIgnoringParselet(pratt, context, 0, null);
    scanForToken(context, 81, 1);
    return Node.withRange(Node.withChildren(new Node(19), [name, value]), ParserContext.spanSince(context, token.range));
  }
}
function parseAlias(context) {
  var token = ParserContext.next(context);
  var name = parseName(context);
  if (name === null || !ParserContext.expect(context, 2)) {
    scanForToken(context, 81, 1);
    var range = ParserContext.spanSince(context, token.range);
    return Node.withRange(Node.withChildren(new Node(30), [Node.withRange(new Node(50), range)]), range);
  }
  var value = Pratt.parseIgnoringParselet(pratt, context, 0, null);
  scanForToken(context, 81, 1);
  return Node.withRange(Node.withChildren(new Node(18), [name, value]), ParserContext.spanSince(context, token.range));
}
function looksLikeLambdaArguments(node) {
  if (node.kind === 52) {
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
  case 46:
    var target = node.children[0];
    return target !== null && looksLikeType(target);
  case 34:
  case 53:
  case 60:
    return true;
  default:
    return false;
  }
}
function parseStatement(context, hint) {
  switch (ParserContext.current(context).kind) {
  case 1:
    return parseAssert(context);
  case 16:
    return parseBreak(context);
  case 19:
    return parseObject(context, 10);
  case 22:
    return parseContinue(context);
  case 26:
    return parseDoWhile(context);
  case 31:
    return parseEnum(context);
  case 34:
    return parseModifier(context, hint, 1024);
  case 36:
    return parseModifier(context, hint, 256);
  case 39:
    return parseFor(context);
  case 42:
  case 94:
    return parsePossibleTypedDeclaration(context, hint);
  case 43:
    return parseIf(context);
  case 44:
    return parseModifier(context, hint, 2048);
  case 45:
    return parseExtension(context);
  case 47:
    return parseModifier(context, hint, 512);
  case 48:
    return parseObject(context, 12);
  case 65:
    return parseNamespace(context);
  case 66:
    return parseConstructor(context, hint);
  case 70:
    return parseModifier(context, hint, 32);
  case 72:
    return parseModifier(context, hint, 2);
  case 73:
    return parseModifier(context, hint, 4);
  case 74:
    return parseModifier(context, hint, 1);
  case 77:
    return parseReturn(context);
  case 84:
    return parseModifier(context, hint, 64);
  case 86:
    return parseObject(context, 11);
  case 88:
    return parseSwitch(context);
  case 93:
    return parseUsing(context);
  case 0:
    return parseAlias(context);
  case 95:
    return parseModifier(context, hint, 128);
  case 96:
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
  if (!ParserContext.expect(context, 30)) {
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
      syntaxErrorInvalidInteger(context.log, token.range, token.text);
    } else if (base === 10 && value !== 0 && token.text.charCodeAt(0) === 48) {
      syntaxWarningOctal(context.log, token.range);
    }
    return Node.withRange(Node.withContent(new Node(41), new IntContent(value | 0)), token.range);
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
  var pratt = new Pratt();
  Pratt.literal(pratt, 69, tokenLiteral(38));
  Pratt.literal(pratt, 89, tokenLiteral(36));
  Pratt.literal(pratt, 91, tokenLiteral(39));
  Pratt.literal(pratt, 35, tokenLiteral(40));
  Pratt.literal(pratt, 50, intLiteral(10));
  Pratt.literal(pratt, 49, intLiteral(2));
  Pratt.literal(pratt, 52, intLiteral(8));
  Pratt.literal(pratt, 51, intLiteral(16));
  Pratt.literal(pratt, 37, function(context, token) {
    return Node.withRange(Node.withContent(new Node(42), new DoubleContent(parseDoubleLiteral(token.text.slice(0, token.text.length - 1 | 0)))), token.range);
  });
  Pratt.literal(pratt, 28, function(context, token) {
    return Node.withRange(Node.withContent(new Node(43), new DoubleContent(parseDoubleLiteral(token.text))), token.range);
  });
  Pratt.literal(pratt, 94, function(context, token) {
    return Node.withRange(new Node(59), token.range);
  });
  Pratt.literal(pratt, 85, function(context, token) {
    var result = parseStringLiteral(context.log, token.range, token.text);
    return Node.withRange(Node.withContent(new Node(44), new StringContent(result !== null ? result.value : "")), token.range);
  });
  Pratt.literal(pratt, 18, function(context, token) {
    var result = parseStringLiteral(context.log, token.range, token.text);
    if (result !== null && result.value.length !== 1) {
      syntaxErrorInvalidCharacter(context.log, token.range, token.text);
      result = null;
    }
    return Node.withRange(Node.withContent(new Node(41), new IntContent(result !== null ? result.value.charCodeAt(0) : 0)), token.range);
  });
  Pratt.postfix(pratt, 46, 14, unaryPostfix(67));
  Pratt.postfix(pratt, 23, 14, unaryPostfix(68));
  Pratt.prefix(pratt, 46, 13, unaryPrefix(65));
  Pratt.prefix(pratt, 23, 13, unaryPrefix(66));
  Pratt.prefix(pratt, 71, 13, unaryPrefix(62));
  Pratt.prefix(pratt, 63, 13, unaryPrefix(63));
  Pratt.prefix(pratt, 67, 13, unaryPrefix(61));
  Pratt.prefix(pratt, 90, 13, unaryPrefix(64));
  Pratt.infix(pratt, 13, 7, binaryInfix(70));
  Pratt.infix(pratt, 14, 5, binaryInfix(71));
  Pratt.infix(pratt, 15, 6, binaryInfix(72));
  Pratt.infix(pratt, 25, 12, binaryInfix(73));
  Pratt.infix(pratt, 32, 8, binaryInfix(74));
  Pratt.infix(pratt, 40, 9, binaryInfix(75));
  Pratt.infix(pratt, 41, 9, binaryInfix(76));
  Pratt.infix(pratt, 45, 9, binaryInfix(77));
  Pratt.infix(pratt, 58, 9, binaryInfix(79));
  Pratt.infix(pratt, 59, 9, binaryInfix(80));
  Pratt.infix(pratt, 61, 4, binaryInfix(81));
  Pratt.infix(pratt, 62, 3, binaryInfix(82));
  Pratt.infix(pratt, 63, 11, binaryInfix(88));
  Pratt.infix(pratt, 64, 12, binaryInfix(83));
  Pratt.infix(pratt, 68, 8, binaryInfix(84));
  Pratt.infix(pratt, 71, 11, binaryInfix(69));
  Pratt.infix(pratt, 76, 12, binaryInfix(85));
  Pratt.infix(pratt, 82, 10, binaryInfix(86));
  Pratt.infix(pratt, 83, 10, binaryInfix(87));
  Pratt.infixRight(pratt, 2, 2, binaryInfix(89));
  Pratt.infixRight(pratt, 9, 2, binaryInfix(90));
  Pratt.infixRight(pratt, 3, 2, binaryInfix(91));
  Pratt.infixRight(pratt, 4, 2, binaryInfix(92));
  Pratt.infixRight(pratt, 5, 2, binaryInfix(93));
  Pratt.infixRight(pratt, 6, 2, binaryInfix(94));
  Pratt.infixRight(pratt, 8, 2, binaryInfix(95));
  Pratt.infixRight(pratt, 10, 2, binaryInfix(96));
  Pratt.infixRight(pratt, 11, 2, binaryInfix(97));
  Pratt.infixRight(pratt, 12, 2, binaryInfix(98));
  Pratt.infixRight(pratt, 7, 2, binaryInfix(99));
  Pratt.parselet(pratt, 55, 0).prefix = function(context) {
    var token = ParserContext.current(context);
    var $arguments = parseArgumentList(context, 55, 78, 1);
    return Node.withRange(Node.withChildren(new Node(45), $arguments), ParserContext.spanSince(context, token.range));
  };
  Pratt.parselet(pratt, 57, 0).prefix = function(context) {
    var token = ParserContext.current(context);
    var type = parseGroup(context, 1);
    if (type.kind === 34 && ParserContext.eat(context, 54)) {
      var block = parseLambdaBlock(context);
      return Node.withRange(createLambdaFromNames([type], block), ParserContext.spanSince(context, token.range));
    }
    if (looksLikeLambdaArguments(type) && ParserContext.eat(context, 54)) {
      var block = parseLambdaBlock(context);
      return Node.withRange(createLambdaFromNames(Node.removeChildren(type), block), ParserContext.spanSince(context, token.range));
    }
    if (looksLikeType(type)) {
      var value = Pratt.parseIgnoringParselet(pratt, context, 13, null);
      return Node.withRange(Node.withChildren(new Node(54), [type, value]), ParserContext.spanSince(context, token.range));
    }
    return type;
  };
  Pratt.parselet(pratt, 75, 2).infix = function(context, left) {
    ParserContext.next(context);
    var middle = Pratt.parseIgnoringParselet(pratt, context, 1, null);
    var right = ParserContext.expect(context, 20) ? Pratt.parseIgnoringParselet(pratt, context, 1, null) : Node.withRange(new Node(50), ParserContext.spanSince(context, ParserContext.current(context).range));
    return Node.withRange(Node.withChildren(new Node(37), [left, middle, right]), ParserContext.spanSince(context, left.range));
  };
  Pratt.parselet(pratt, 21, 1).infix = function(context, left) {
    var values = [left];
    while (ParserContext.eat(context, 21)) {
      values.push(Pratt.parseIgnoringParselet(pratt, context, 1, null));
    }
    return Node.withRange(Node.withChildren(new Node(52), values), ParserContext.spanSince(context, left.range));
  };
  Pratt.parselet(pratt, 27, 15).infix = function(context, left) {
    ParserContext.next(context);
    var name = parseName(context);
    return Node.withRange(Node.withChildren(new Node(46), [left, name]), ParserContext.spanSince(context, left.range));
  };
  Pratt.parselet(pratt, 27, 0).prefix = function(context) {
    var token = ParserContext.next(context);
    var name = parseName(context);
    return Node.withRange(Node.withChildren(new Node(46), [null, name]), ParserContext.spanSince(context, token.range));
  };
  Pratt.parselet(pratt, 38, 15).infix = function(context, left) {
    if (!looksLikeType(left)) {
      ParserContext.unexpectedToken(context);
      ParserContext.next(context);
      return Node.withRange(new Node(50), ParserContext.spanSince(context, left.range));
    }
    ParserContext.next(context);
    var $arguments = parseArgumentList(context, 57, 80, 1);
    return Node.withRange(Node.createFunctionType(left, $arguments), ParserContext.spanSince(context, left.range));
  };
  Pratt.parselet(pratt, 57, 14).infix = function(context, left) {
    var $arguments = parseArgumentList(context, 57, 80, 0);
    return Node.withRange(Node.createCall(left, $arguments), ParserContext.spanSince(context, left.range));
  };
  Pratt.parselet(pratt, 56, 14).infix = function(context, left) {
    ParserContext.next(context);
    var index = Pratt.parseIgnoringParselet(pratt, context, 0, null);
    scanForToken(context, 79, 1);
    return Node.withRange(Node.createBinary(78, left, index), ParserContext.spanSince(context, left.range));
  };
  Pratt.parselet(pratt, 99, 15).infix = function(context, left) {
    var token = ParserContext.next(context);
    var substitutions = parseTypeList(context, 100);
    if (!ParserContext.expect(context, 100)) {
      scanForToken(context, 100, 1);
      return Node.withRange(new Node(50), ParserContext.spanSince(context, token.range));
    }
    return Node.withRange(Node.createParameterize(left, substitutions), ParserContext.spanSince(context, left.range));
  };
  Pratt.parselet(pratt, 24, 13).prefix = function(context) {
    var token = ParserContext.next(context);
    var type = parseGroup(context, 0);
    return Node.withRange(type === null ? new Node(50) : Node.withChildren(new Node(57), [type]), ParserContext.spanSince(context, token.range));
  };
  Pratt.parselet(pratt, 92, 13).prefix = function(context) {
    var token = ParserContext.next(context);
    var value = parseGroup(context, 0);
    return Node.withRange(value === null ? new Node(50) : Node.withChildren(new Node(58), [value]), ParserContext.spanSince(context, token.range));
  };
  Pratt.parselet(pratt, 42, 0).prefix = function(context) {
    var token = ParserContext.next(context);
    var name = Node.withRange(Node.withContent(new Node(34), new StringContent(token.text)), token.range);
    if (ParserContext.eat(context, 54)) {
      var block = parseLambdaBlock(context);
      return Node.withRange(createLambdaFromNames([name], block), ParserContext.spanSince(context, token.range));
    }
    return name;
  };
  Pratt.parselet(pratt, 54, 0).prefix = function(context) {
    var token = ParserContext.next(context);
    var block = parseLambdaBlock(context);
    return Node.withRange(Node.createLambda([], block), ParserContext.spanSince(context, token.range));
  };
  Pratt.parselet(pratt, 66, 0).prefix = function(context) {
    ParserContext.unexpectedToken(context);
    ParserContext.next(context);
    return Pratt.parseIgnoringParselet(pratt, context, 14, null);
  };
  var inParselet = Pratt.parselet(pratt, 45, 0);
  Pratt.parselet(pratt, 60, 0).prefix = function(context) {
    var token = ParserContext.next(context);
    var name = parseName(context);
    if (name === null || !ParserContext.expect(context, 2)) {
      return Node.withRange(new Node(50), ParserContext.spanSince(context, token.range));
    }
    var initial = Pratt.parseIgnoringParselet(pratt, context, 0, inParselet);
    var variable = Node.withRange(Node.withChildren(new Node(16), [name, new Node(59), initial]), ParserContext.spanSince(context, token.range));
    if (initial.kind === 50 || !ParserContext.expect(context, 45)) {
      return Node.withRange(new Node(50), ParserContext.spanSince(context, token.range));
    }
    var value = Pratt.parseIgnoringParselet(pratt, context, 1, null);
    return Node.withRange(Node.withChildren(new Node(47), [variable, value]), ParserContext.spanSince(context, token.range));
  };
  Pratt.parselet(pratt, 87, 0).prefix = function(context) {
    return parseSuperCall(context);
  };
  return pratt;
}
function semanticWarningUnusedExpression(log, range) {
  Log.warning(log, range, "Unused expression");
}
function semanticWarningDuplicateModifier(log, range, modifier) {
  Log.warning(log, range, "Duplicate modifier " + string.append(string.append("\"", modifier), "\""));
}
function semanticWarningShadowedSymbol(log, range, name, shadowed) {
  Log.warning(log, range, string.append(string.append("\"", name), "\"") + " shadows another declaration with the same name");
  if (!(shadowed.source === null)) {
    Log.note(log, shadowed, "The shadowed declaration is here");
  }
}
function semanticErrorRedundantModifier(log, range, modifier, where) {
  Log.error(log, range, "Redundant modifier " + string.append(string.append("\"", modifier), "\"") + " " + where);
}
function semanticErrorUnexpectedModifier(log, range, modifier, where) {
  Log.error(log, range, "Cannot use the " + string.append(string.append("\"", modifier), "\"") + " modifier " + where);
}
function semanticErrorExpectedModifier(log, range, modifier, where) {
  Log.error(log, range, "Expected the " + string.append(string.append("\"", modifier), "\"") + " modifier " + where);
}
function semanticErrorDuplicateSymbol(log, range, name, previous) {
  Log.error(log, range, string.append(string.append("\"", name), "\"") + " is already declared");
  if (!(previous.source === null)) {
    Log.note(log, previous, "The previous declaration is here");
  }
}
function semanticErrorUnexpectedNode(log, range, kind) {
  Log.error(log, range, "Unexpected " + NodeKind.toString(kind));
}
function semanticErrorUnexpectedExpression(log, range, type) {
  Log.error(log, range, "Unexpected expression of " + ("type \"" + Type.toString(type) + "\""));
}
function semanticErrorUnexpectedType(log, range, type) {
  Log.error(log, range, "Unexpected " + ("type \"" + Type.toString(type) + "\""));
}
function semanticErrorUndeclaredSymbol(log, range, name) {
  Log.error(log, range, string.append(string.append("\"", name), "\"") + " is not declared");
}
function semanticErrorUndeclaredGlobalSymbol(log, range, name) {
  Log.error(log, range, string.append(string.append("\"", name), "\"") + " is not declared at the global scope");
}
function semanticErrorUnknownMemberSymbol(log, range, name, type) {
  Log.error(log, range, string.append(string.append("\"", name), "\"") + " is not declared on " + ("type \"" + Type.toString(type) + "\""));
}
function semanticErrorExtensionMissingTarget(log, range, name) {
  Log.error(log, range, "No type named " + string.append(string.append("\"", name), "\"") + " to extend");
}
function semanticErrorDifferentModifiers(log, range, name, previous) {
  Log.error(log, range, "Cannot merge multiple declarations for " + string.append(string.append("\"", name), "\"") + " with different modifiers");
  if (!(previous.source === null)) {
    Log.note(log, previous, "The conflicting declaration is here");
  }
}
function semanticErrorBadUsingValue(log, range) {
  Log.error(log, range, "Expected a type here");
}
function semanticErrorBadUsingNamespace(log, range) {
  Log.error(log, range, "Expected a namespace here");
}
function semanticErrorUnexpectedStatement(log, range) {
  Log.error(log, range, "Cannot use this statement here");
}
function semanticErrorCyclicDeclaration(log, range, name) {
  Log.error(log, range, "Cyclic declaration of " + string.append(string.append("\"", name), "\""));
}
function semanticErrorUnexpectedThis(log, range, name) {
  Log.error(log, range, "Cannot use " + string.append(string.append("\"", name), "\"") + " outside a class or struct");
}
function semanticErrorStaticThis(log, range, name) {
  Log.error(log, range, "Cannot access " + string.append(string.append("\"", name), "\"") + " from a static context");
}
function semanticErrorIncompatibleTypes(log, range, from, to, isCastAllowed) {
  Log.error(log, range, "Cannot convert from " + ("type \"" + Type.toString(from) + "\"") + " to " + ("type \"" + Type.toString(to) + "\"") + (isCastAllowed ? " without a cast" : ""));
}
function semanticErrorNoCommonType(log, range, left, right) {
  Log.error(log, range, "No common type for " + ("type \"" + Type.toString(left) + "\"") + " and " + ("type \"" + Type.toString(right) + "\""));
}
function semanticErrorBadType(log, range, type) {
  Log.error(log, range, "Cannot use " + ("type \"" + Type.toString(type) + "\"") + " here");
}
function semanticErrorMemberUnexpectedStatic(log, range, name) {
  Log.error(log, range, "Cannot access static member " + string.append(string.append("\"", name), "\"") + " from an instance context");
}
function semanticErrorMemberUnexpectedInstance(log, range, name) {
  Log.error(log, range, "Cannot access instance member " + string.append(string.append("\"", name), "\"") + " from a static context");
}
function semanticErrorMissingTypeContext(log, range) {
  Log.error(log, range, "Expression has no type context here");
}
function semanticErrorBadTypeParameterBound(log, range, type) {
  Log.error(log, range, "Cannot use " + ("type \"" + Type.toString(type) + "\"") + " as a type parameter bound");
}
function semanticErrorUninitializedExtensionVariable(log, range) {
  Log.error(log, range, "Instance variables in extension blocks must be initialized");
}
function semanticErrorVarMissingValue(log, range) {
  Log.error(log, range, "Implicitly typed variables must be initialized");
}
function semanticErrorVarBadType(log, range, type) {
  Log.error(log, range, "Implicitly typed variables cannot be of " + ("type \"" + Type.toString(type) + "\""));
}
function semanticErrorInvalidCall(log, range, type) {
  Log.error(log, range, "Cannot call " + ("type \"" + Type.toString(type) + "\""));
}
function semanticErrorParameterCount(log, range, expected, found) {
  Log.error(log, range, "Expected " + expected.toString() + (expected === 1 ? " type parameter" : " type parameters") + " but found " + found.toString() + (found === 1 ? " type parameter" : " type parameters"));
}
function semanticErrorArgumentCount(log, range, expected, found) {
  Log.error(log, range, "Expected " + expected.toString() + (expected === 1 ? " argument" : " arguments") + " but found " + found.toString() + (found === 1 ? " argument" : " arguments"));
}
function semanticErrorExpectedReturnValue(log, range, type) {
  Log.error(log, range, "Return statement must return " + ("type \"" + Type.toString(type) + "\""));
}
function semanticErrorBadLambdaTypeContext(log, range, type) {
  Log.error(log, range, "Cannot use a lambda expression with " + ("type \"" + Type.toString(type) + "\""));
}
function semanticErrorNonConstantCaseValue(log, range) {
  Log.error(log, range, "Non-constant case value");
}
function semanticErrorBadDefaultCase(log, range) {
  Log.error(log, range, "Only the last case can be a default case");
}
function semanticErrorDuplicateCase(log, range, previous) {
  Log.error(log, range, "Duplicate case value");
  if (!(previous.source === null)) {
    Log.note(log, previous, "The first occurrence is here");
  }
}
function semanticErrorUnconstructableType(log, range, type) {
  Log.error(log, range, "Cannot construct " + ("type \"" + Type.toString(type) + "\""));
}
function semanticErrorAbstractConstructorInitializer(log, range) {
  Log.error(log, range, "An abstract constructor must not have initializer list");
}
function semanticErrorUnexpectedBaseType(log, range, what) {
  Log.error(log, range, what + " cannot inherit from another type");
}
function semanticErrorClassBaseNotFirst(log, range, type) {
  Log.error(log, range, "Base " + ("type \"" + Type.toString(type) + "\"") + " must come first in a class declaration");
}
function semanticErrorBaseTypeNotInterface(log, range, type) {
  Log.error(log, range, "Base " + ("type \"" + Type.toString(type) + "\"") + " must be an interface");
}
function semanticErrorDuplicateBaseType(log, range, type) {
  Log.error(log, range, "Duplicate base " + ("type \"" + Type.toString(type) + "\""));
}
function semanticErrorAmbiguousSymbol(log, range, name, names) {
  for (var i = 0; i < names.length; i = i + 1 | 0) {
    names[i] = string.append(string.append("\"", names[i]), "\"");
  }
  Log.error(log, range, "Reference to " + string.append(string.append("\"", name), "\"") + " is ambiguous, could be " + names.join(" or "));
}
function semanticErrorUnmergedSymbol(log, range, name, types) {
  var names = [];
  for (var i = 0; i < types.length; i = i + 1 | 0) {
    names.push("type \"" + Type.toString(types[i]) + "\"");
  }
  Log.error(log, range, "Member " + string.append(string.append("\"", name), "\"") + " has an ambiguous inherited type, could be " + names.join(" or "));
}
function semanticErrorBadOverride(log, range, name, base, overridden) {
  Log.error(log, range, string.append(string.append("\"", name), "\"") + " overrides another declaration with the same name in base " + ("type \"" + Type.toString(base) + "\""));
  if (!(overridden.source === null)) {
    Log.note(log, overridden, "The overridden declaration is here");
  }
}
function semanticErrorOverrideDifferentTypes(log, range, name, base, derived, overridden) {
  Log.error(log, range, string.append(string.append("\"", name), "\"") + " must have the same signature as the method it overrides (expected " + ("type \"" + Type.toString(base) + "\"") + " but found " + ("type \"" + Type.toString(derived) + "\"") + ")");
  if (!(overridden.source === null)) {
    Log.note(log, overridden, "The overridden declaration is here");
  }
}
function semanticErrorModifierMissingOverride(log, range, name, overridden) {
  Log.error(log, range, string.append(string.append("\"", name), "\"") + " overrides another symbol with the same name but is missing the \"override\" modifier");
  if (!(overridden.source === null)) {
    Log.note(log, overridden, "The overridden declaration is here");
  }
}
function semanticErrorCannotOverrideNonVirtual(log, range, name, overridden) {
  Log.error(log, range, string.append(string.append("\"", name), "\"") + " cannot override a non-virtual method");
  if (!(overridden.source === null)) {
    Log.note(log, overridden, "The overridden declaration is here");
  }
}
function semanticErrorBadIntegerConstant(log, range, type) {
  Log.error(log, range, "Expected integer constant but found expression of " + ("type \"" + Type.toString(type) + "\""));
}
function semanticErrorNoUnaryOperator(log, range, kind, type) {
  Log.error(log, range, "No unary operator " + operatorInfo.get(kind).text + " for " + ("type \"" + Type.toString(type) + "\""));
}
function semanticErrorNoBinaryOperator(log, range, kind, left, right) {
  Log.error(log, range, "No binary operator " + operatorInfo.get(kind).text + " for " + ("type \"" + Type.toString(left) + "\"") + " and " + ("type \"" + Type.toString(right) + "\""));
}
function semanticErrorBadStorage(log, range) {
  Log.error(log, range, "Cannot store to this location");
}
function semanticErrorStorageToFinal(log, range) {
  Log.error(log, range, "Cannot store to a symbol marked as \"final\"");
}
function semanticErrorUnparameterizedType(log, range, type) {
  Log.error(log, range, "Cannot use unparameterized " + ("type \"" + Type.toString(type) + "\""));
}
function semanticErrorCannotParameterize(log, range, type) {
  Log.error(log, range, "Cannot parameterize " + ("type \"" + Type.toString(type) + "\"") + (Type.hasParameters(type) ? " because it is already parameterized" : " because it has no type parameters"));
}
function semanticErrorBadSuperInitializer(log, range) {
  Log.error(log, range, "No base constructor to call");
}
function semanticErrorMissingSuperInitializer(log, range) {
  Log.error(log, range, "Missing call to \"super\" in initializer list");
}
function semanticErrorAlreadyInitialized(log, range, name, previous) {
  Log.error(log, range, string.append(string.append("\"", name), "\"") + " is already initialized");
  if (!(previous.source === null)) {
    Log.note(log, previous, "The previous initialization is here");
  }
}
function semanticErrorBadEnumToString(log, range, name, first, second, value) {
  Log.error(log, range, "Cannot automatically generate \"toString\" for " + string.append(string.append("\"", name), "\"") + " because " + string.append(string.append("\"", first), "\"") + " and " + string.append(string.append("\"", second), "\"") + " both have the same value " + value.toString());
}
function semanticErrorMissingReturn(log, range, name, type) {
  Log.error(log, range, "All control paths for " + string.append(string.append("\"", name), "\"") + " must return a value of " + ("type \"" + Type.toString(type) + "\""));
}
function semanticErrorLambdaMissingReturn(log, range, type) {
  Log.error(log, range, "All control paths for lambda expression must return a value of " + ("type \"" + Type.toString(type) + "\""));
}
function semanticErrorBaseClassInExtension(log, range) {
  Log.error(log, range, "The base class must be set from the class declaration, not from an extension block");
}
function createNameToSymbolFlag() {
  var result = new StringMap();
  result.set("export", 1024);
  result.set("final", 256);
  result.set("import", 2048);
  result.set("inline", 512);
  result.set("override", 32);
  result.set("private", 2);
  result.set("protected", 4);
  result.set("public", 1);
  result.set("static", 64);
  result.set("virtual", 128);
  return result;
}
function createSymbolFlagToName() {
  var result = new IntMap();
  result.set(1024, "export");
  result.set(256, "final");
  result.set(2048, "import");
  result.set(512, "inline");
  result.set(32, "override");
  result.set(2, "private");
  result.set(4, "protected");
  result.set(1, "public");
  result.set(64, "static");
  result.set(128, "virtual");
  return result;
}
service.nodeFromPosition = function(node, source, index) {
  while (Node.hasChildren(node)) {
    var i;
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
        text = text + " is " + Type.toString(bound);
      }
      result.declaration = text;
      break;
    case 9:
      result.declaration = "namespace " + Symbol.fullName(symbol);
      break;
    case 12:
    case 13:
    case 14:
      var text = SymbolKind.toString(symbol.kind).toLowerCase() + " " + Type.toString(type);
      if (Type.hasRelevantTypes(type)) {
        for (var i = 0; i < type.relevantTypes.length; i = i + 1 | 0) {
          text = text + (i === 0 ? " : " : ", ") + Type.toString(type.relevantTypes[i]);
        }
      }
      result.declaration = text;
      break;
    case 10:
      result.declaration = "enum " + Symbol.fullName(symbol);
      break;
    case 11:
      result.declaration = "enum flags " + Symbol.fullName(symbol);
      break;
    case 15:
    case 16:
    case 17:
      var text = Type.toString(type.relevantTypes[0]) + " " + symbol.name + "(";
      var $arguments = symbol.node.children[1].children;
      var argumentTypes = Type.argumentTypes(type);
      for (var i = 0; i < $arguments.length; i = i + 1 | 0) {
        if (i > 0) {
          text = text + ", ";
        }
        text = text + Type.toString(argumentTypes[i]) + " " + $arguments[i].symbol.name;
      }
      result.declaration = text + ")";
      break;
    case 18:
    case 19:
    case 20:
      var text = Type.toString(type) + " " + symbol.name;
      if (Symbol.isEnumValue(symbol)) {
        text = text + " = " + symbol.enumValue.toString();
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
  if (node.kind === 46) {
    var target = node.children[0];
    if (target.type !== null) {
      var isInstance = !(target.kind === 35);
      var members = target.type.members.values();
      for (var i = 0; i < members.length; i = i + 1 | 0) {
        var member = members[i];
        Resolver.initializeMember(resolver, member);
        if (SymbolKind.isInstance(member.symbol.kind) === isInstance) {
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
      text = text + (Type.argumentTypes(type).length === 0 ? semicolon ? "();$" : "()$" : semicolon ? "($);" : "($)");
    } else {
      text = text + "$";
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
var nodeKindIsExpression = function(node) {
  return NodeKind.isExpression(node.kind);
};
var operatorInfo = createOperatorMap();
Compiler.nativeLibrarySource = null;
Compiler.nativeLibraryFile = null;
var NATIVE_LIBRARY = "\nimport struct int { string toString(); }\nimport struct bool { string toString(); }\nimport struct float { string toString(); }\nimport struct double { string toString(); }\n\nimport struct String {\n  static string fromCharCode(int value);\n}\n\nimport struct string {\n  final int length;\n  string slice(int start, int end);\n  int indexOf(string value);\n  int lastIndexOf(string value);\n  string toLowerCase();\n  string toUpperCase();\n  inline static string fromCodeUnit(int value) { return String.fromCharCode(value); }\n  inline string get(int index) { return untyped(this)[index]; }\n  inline string join(List<string> values) { return untyped(values).join(this); }\n  inline int codeUnitAt(int index) { return untyped(this).charCodeAt(index); }\n  inline string append(string value) { return untyped(this) + value; }\n}\n\nimport class List<T> {\n  new();\n  final int length;\n  void push(T value);\n  void unshift(T value);\n  List<T> slice(int start, int end);\n  int indexOf(T value);\n  int lastIndexOf(T value);\n  T shift();\n  T pop();\n  void reverse();\n  void sort(int fn(T, T) callback);\n  inline List<T> clone() { return untyped(this).slice(); }\n  inline T remove(int index) { return untyped(this).splice(index, 1)[0]; }\n  inline void insert(int index, T value) { return untyped(this).splice(index, 0, value); }\n  inline T get(int index) { return untyped(this)[index]; }\n  inline void set(int index, T value) { return untyped(this)[index] = value; }\n}\n\nimport class StringMap<T> {\n  new();\n  T get(string key);\n  T getOrDefault(string key, T defaultValue);\n  void set(string key, T value);\n  bool has(string key);\n  List<string> keys();\n  List<T> values();\n  StringMap<T> clone();\n}\n\nimport class IntMap<T> {\n  new();\n  T get(int key);\n  T getOrDefault(int key, T defaultValue);\n  void set(int key, T value);\n  bool has(int key);\n  List<int> keys();\n  List<T> values();\n  IntMap<T> clone();\n}\n\n// TODO: Rename this to \"math\" since namespaces should be lower case\nimport namespace Math {\n  final double E;\n  final double PI;\n  final double NAN;\n  final double INFINITY;\n  double random();\n  double abs(double n);\n  double sin(double n);\n  double cos(double n);\n  double tan(double n);\n  double asin(double n);\n  double acos(double n);\n  double atan(double n);\n  double round(double n);\n  double floor(double n);\n  double ceil(double n);\n  double exp(double n);\n  double log(double n);\n  double sqrt(double n);\n  bool isNaN(double n);\n  bool isFinite(double n);\n  double atan2(double y, double x);\n  double pow(double base, double exponent);\n  double min(double a, double b);\n  double max(double a, double b);\n  int imin(int a, int b);\n  int imax(int a, int b);\n}\n";
Range.EMPTY = new Range(null, 0, 0);
var BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var HEX = "0123456789ABCDEF";
js.Emitter.isKeyword = js.Emitter.createIsKeyword();
var yy_accept = [98, 98, 98, 30, 33, 97, 67, 33, 76, 13, 33, 57, 80, 64, 71, 21, 63, 27, 25, 50, 50, 20, 81, 58, 2, 40, 75, 42, 56, 79, 15, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 55, 14, 78, 90, 97, 68, 98, 85, 98, 10, 61, 3, 98, 18, 98, 8, 46, 9, 23, 7, 97, 6, 98, 50, 98, 37, 98, 98, 82, 59, 32, 54, 41, 83, 42, 5, 42, 42, 42, 42, 42, 42, 42, 26, 42, 42, 42, 42, 42, 38, 42, 43, 42, 45, 53, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 4, 62, 97, 28, 49, 52, 51, 11, 12, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 39, 42, 42, 42, 60, 42, 66, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 94, 42, 42, 37, 42, 42, 42, 17, 42, 42, 42, 29, 31, 42, 42, 42, 42, 42, 42, 42, 69, 42, 42, 42, 42, 42, 42, 42, 42, 42, 89, 91, 42, 42, 42, 42, 0, 42, 16, 19, 42, 42, 42, 35, 36, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 87, 42, 42, 93, 42, 96, 1, 42, 42, 34, 44, 47, 42, 42, 42, 42, 42, 74, 77, 84, 86, 88, 42, 42, 42, 24, 42, 42, 42, 72, 42, 92, 95, 22, 42, 42, 70, 42, 48, 65, 73, 98];
var yy_ec = [0, 1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 4, 5, 1, 1, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 19, 19, 19, 19, 19, 20, 20, 21, 22, 23, 24, 25, 26, 1, 27, 27, 27, 27, 27, 27, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 29, 30, 31, 32, 28, 1, 33, 34, 35, 36, 37, 38, 39, 40, 41, 28, 42, 43, 44, 45, 46, 47, 28, 48, 49, 50, 51, 52, 53, 54, 55, 28, 56, 57, 58, 59, 1];
var yy_meta = [0, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 3, 3, 1, 1, 1, 1, 1, 1, 3, 4, 1, 1, 1, 1, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 1, 1, 1, 1];
var yy_base = [0, 0, 0, 316, 317, 58, 291, 57, 290, 56, 56, 317, 317, 289, 53, 317, 52, 317, 51, 73, 64, 317, 317, 45, 46, 48, 317, 0, 317, 317, 288, 46, 263, 63, 48, 54, 71, 76, 273, 85, 257, 50, 271, 73, 65, 29, 96, 267, 317, 76, 317, 317, 128, 317, 98, 317, 303, 317, 317, 317, 102, 317, 302, 317, 317, 317, 317, 317, 0, 317, 121, 127, 117, 317, 131, 0, 280, 317, 317, 317, 317, 279, 0, 317, 261, 252, 263, 250, 265, 252, 258, 0, 246, 243, 246, 249, 246, 0, 242, 0, 242, 108, 0, 238, 243, 233, 242, 247, 111, 249, 232, 120, 234, 239, 238, 227, 227, 235, 227, 226, 232, 317, 317, 0, 142, 137, 152, 0, 317, 317, 239, 234, 237, 232, 219, 217, 233, 228, 220, 217, 213, 228, 0, 214, 218, 221, 0, 220, 0, 213, 207, 202, 203, 209, 200, 200, 198, 211, 197, 197, 208, 189, 198, 0, 192, 198, 317, 191, 191, 196, 0, 188, 195, 184, 0, 0, 186, 196, 189, 183, 185, 181, 179, 0, 179, 193, 188, 183, 175, 181, 186, 172, 184, 0, 0, 171, 178, 165, 178, 0, 164, 0, 0, 168, 169, 161, 0, 0, 160, 172, 170, 160, 165, 155, 169, 168, 157, 166, 150, 0, 159, 161, 0, 164, 0, 0, 145, 145, 0, 0, 0, 159, 146, 142, 140, 126, 0, 0, 0, 0, 0, 139, 131, 136, 0, 137, 132, 129, 0, 127, 0, 0, 0, 126, 119, 0, 107, 0, 0, 0, 317, 180, 184, 186, 190, 112];
var yy_def = [0, 260, 1, 260, 260, 260, 260, 261, 260, 260, 262, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 263, 260, 260, 260, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 260, 260, 260, 260, 260, 260, 261, 260, 261, 260, 260, 260, 262, 260, 262, 260, 260, 260, 260, 260, 264, 260, 260, 260, 260, 260, 260, 265, 260, 260, 260, 260, 260, 260, 263, 260, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 260, 260, 264, 260, 260, 260, 265, 260, 260, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 260, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 263, 0, 260, 260, 260, 260, 260];
var yy_nxt = [0, 4, 5, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 20, 20, 21, 22, 23, 24, 25, 26, 27, 27, 28, 4, 29, 30, 31, 32, 33, 34, 35, 36, 27, 27, 37, 27, 38, 27, 39, 40, 41, 42, 43, 44, 45, 46, 47, 27, 27, 48, 49, 50, 51, 52, 52, 55, 58, 61, 64, 66, 68, 76, 77, 78, 79, 80, 81, 116, 69, 67, 65, 117, 70, 59, 71, 71, 71, 71, 90, 62, 56, 70, 84, 71, 71, 71, 71, 91, 85, 87, 92, 108, 93, 121, 109, 73, 55, 95, 114, 88, 72, 94, 89, 61, 73, 96, 115, 99, 127, 97, 98, 104, 74, 100, 101, 105, 111, 112, 102, 113, 75, 56, 118, 52, 52, 62, 122, 125, 125, 106, 119, 124, 124, 124, 124, 70, 259, 71, 71, 71, 71, 126, 126, 126, 144, 151, 155, 125, 125, 258, 152, 145, 124, 124, 124, 124, 257, 256, 73, 255, 254, 156, 126, 126, 126, 253, 252, 251, 250, 249, 248, 247, 246, 166, 54, 54, 54, 54, 60, 60, 60, 60, 82, 82, 123, 245, 123, 123, 244, 243, 242, 241, 240, 239, 238, 237, 236, 235, 234, 233, 232, 231, 230, 229, 228, 227, 226, 225, 224, 223, 222, 221, 220, 219, 218, 217, 216, 215, 214, 213, 212, 211, 210, 209, 208, 207, 206, 205, 204, 203, 202, 201, 200, 199, 198, 197, 196, 195, 194, 193, 192, 191, 190, 189, 188, 187, 186, 185, 184, 183, 182, 181, 180, 179, 178, 177, 176, 175, 174, 173, 172, 171, 170, 169, 168, 167, 165, 164, 163, 162, 161, 160, 159, 158, 157, 154, 153, 150, 149, 148, 147, 146, 143, 142, 141, 140, 139, 138, 137, 136, 135, 134, 133, 132, 131, 130, 129, 128, 260, 260, 120, 110, 107, 103, 86, 83, 63, 57, 53, 260, 3, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260];
var yy_chk = [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 5, 5, 7, 9, 10, 14, 16, 18, 23, 23, 24, 24, 25, 25, 45, 18, 16, 14, 45, 20, 9, 20, 20, 20, 20, 34, 10, 7, 19, 31, 19, 19, 19, 19, 34, 31, 33, 35, 41, 35, 49, 41, 20, 54, 36, 44, 33, 19, 35, 33, 60, 19, 36, 44, 37, 265, 36, 36, 39, 19, 37, 37, 39, 43, 43, 37, 43, 19, 54, 46, 52, 52, 60, 49, 72, 72, 39, 46, 70, 70, 70, 70, 71, 256, 71, 71, 71, 71, 74, 74, 74, 101, 108, 111, 125, 125, 254, 108, 101, 124, 124, 124, 124, 253, 249, 71, 247, 246, 111, 126, 126, 126, 245, 243, 242, 241, 235, 234, 233, 232, 124, 261, 261, 261, 261, 262, 262, 262, 262, 263, 263, 264, 231, 264, 264, 227, 226, 223, 221, 220, 218, 217, 216, 215, 214, 213, 212, 211, 210, 209, 208, 205, 204, 203, 200, 198, 197, 196, 195, 192, 191, 190, 189, 188, 187, 186, 185, 184, 182, 181, 180, 179, 178, 177, 176, 173, 172, 171, 169, 168, 167, 165, 164, 162, 161, 160, 159, 158, 157, 156, 155, 154, 153, 152, 151, 150, 149, 147, 145, 144, 143, 141, 140, 139, 138, 137, 136, 135, 134, 133, 132, 131, 130, 120, 119, 118, 117, 116, 115, 114, 113, 112, 110, 109, 107, 106, 105, 104, 103, 100, 98, 96, 95, 94, 93, 92, 90, 89, 88, 87, 86, 85, 84, 81, 76, 62, 56, 47, 42, 40, 38, 32, 30, 13, 8, 6, 3, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260];
var pratt = createParser();
var nameToSymbolFlag = createNameToSymbolFlag();
var symbolFlagToName = createSymbolFlagToName();
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
