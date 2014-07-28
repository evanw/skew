// This file is just to bootstrap the compiler so it compiles itself. The need
// for this file will disappear entirely when the compiler is finished.

function StringBuilder() {
  this.data = '';
}

StringBuilder.prototype.append = function(text) {
  this.data += text;
  return this;
};

StringBuilder.prototype.toString = function() {
  return this.data;
};

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

Array.prototype.get = function(i) {
  return this[i];
};

Array.prototype.set = function(i, value) {
  this[i] = value;
};

Array.prototype.insert = function(i, value) {
  this.splice(i, 0, value);
};

Array.prototype.remove = function(i) {
  this.splice(i, 1);
};

Array.prototype.clone = function() {
  return this.slice();
};

String.prototype.codeUnitAt = function(i) {
  return this.charCodeAt(i);
};

String.prototype.append = function(text) {
  return this + text;
};

String.prototype.get = function(i) {
  return this[i];
};

String.prototype.join = function(values) {
  return values.join(this);
};

var string = {};

string.fromCodeUnit = function(value) {
  return String.fromCharCode(value);
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
Node.createProgram = function(files) {
  return new Node(0).withChildren(files);
};
Node.createFile = function(block) {
  return new Node(1).withChildren([block]);
};
Node.createBlock = function(statements) {
  return new Node(2).withChildren(statements);
};
Node.createNodeList = function(nodes) {
  return new Node(3).withChildren(nodes);
};
Node.createCase = function(values, block) {
  values.push(block);
  return new Node(4).withChildren(values);
};
Node.createVariableCluster = function(type, variables) {
  variables.unshift(type);
  return new Node(6).withChildren(variables);
};
Node.createMemberInitializer = function(name, value) {
  return new Node(5).withChildren([name, value]);
};
Node.createNamespace = function(name, block) {
  return new Node(7).withChildren([name, block]);
};
Node.createEnum = function(name, block) {
  return new Node(8).withChildren([name, block]);
};
Node.createEnumFlags = function(name, block) {
  return new Node(9).withChildren([name, block]);
};
Node.createObject = function(kind, name, parameters, bases, block) {
  return new Node(kind).withChildren([name, block, bases, parameters]);
};
Node.createClass = function(name, parameters, bases, block) {
  return Node.createObject(10, name, parameters, bases, block);
};
Node.createStruct = function(name, parameters, bases, block) {
  return Node.createObject(11, name, parameters, bases, block);
};
Node.createInterface = function(name, parameters, bases, block) {
  return Node.createObject(12, name, parameters, bases, block);
};
Node.createExtension = function(name, bases, block) {
  return new Node(13).withChildren([name, block, bases]);
};
Node.createConstructor = function(name, $arguments, block, superInitializer, memberInitializers) {
  return new Node(14).withChildren([name, $arguments, block, superInitializer, memberInitializers]);
};
Node.createFunction = function(name, $arguments, block, result) {
  return new Node(15).withChildren([name, $arguments, block, result]);
};
Node.createVariable = function(name, type, value) {
  return new Node(16).withChildren([name, type, value]);
};
Node.createParameter = function(name, bound) {
  return new Node(17).withChildren([name, bound]);
};
Node.createAlias = function(name, value) {
  return new Node(18).withChildren([name, value]);
};
Node.createUsingAlias = function(name, value) {
  return new Node(19).withChildren([name, value]);
};
Node.createUsingNamespace = function(value) {
  return new Node(33).withChildren([value]);
};
Node.createIf = function(test, trueNode, falseNode) {
  return new Node(20).withChildren([test, trueNode, falseNode]);
};
Node.createFor = function(setup, test, update, block) {
  return new Node(21).withChildren([setup, test, update, block]);
};
Node.createForEach = function(variable, value, block) {
  return new Node(22).withChildren([variable, value, block]);
};
Node.createWhile = function(test, block) {
  return new Node(23).withChildren([test, block]);
};
Node.createDoWhile = function(block, test) {
  return new Node(24).withChildren([test, block]);
};
Node.createReturn = function(value) {
  return new Node(25).withChildren([value]);
};
Node.createImplicitReturn = function(value) {
  return new Node(26).withChildren([value]);
};
Node.createBreak = function() {
  return new Node(27);
};
Node.createContinue = function() {
  return new Node(28);
};
Node.createAssert = function(value) {
  return new Node(29).withChildren([value]);
};
Node.createExpression = function(value) {
  return new Node(30).withChildren([value]);
};
Node.createModifier = function(name, statements) {
  statements.unshift(name);
  return new Node(32).withChildren(statements);
};
Node.createSwitch = function(value, cases) {
  cases.unshift(value);
  return new Node(31).withChildren(cases);
};
Node.createName = function(name) {
  return new Node(34).withContent(new StringContent(name));
};
Node.createType = function(type) {
  return new Node(35).withType(type);
};
Node.createNull = function() {
  return new Node(38);
};
Node.createThis = function() {
  return new Node(36);
};
Node.createTrue = function() {
  return new Node(39);
};
Node.createFalse = function() {
  return new Node(40);
};
Node.createHook = function(test, trueNode, falseNode) {
  return new Node(37).withChildren([test, trueNode, falseNode]);
};
Node.createInt = function(value) {
  return new Node(41).withContent(new IntContent(value));
};
Node.createFloat = function(value) {
  return new Node(42).withContent(new DoubleContent(value));
};
Node.createDouble = function(value) {
  return new Node(43).withContent(new DoubleContent(value));
};
Node.createString = function(value) {
  return new Node(44).withContent(new StringContent(value));
};
Node.createInitializer = function(values) {
  return new Node(45).withChildren(values);
};
Node.createDot = function(value, name) {
  return new Node(46).withChildren([value, name]);
};
Node.createLet = function(variable, value) {
  return new Node(47).withChildren([variable, value]);
};
Node.createCall = function(value, $arguments) {
  $arguments.unshift(value);
  return new Node(48).withChildren($arguments);
};
Node.createSuperCall = function($arguments) {
  return new Node(49).withChildren($arguments);
};
Node.createError = function() {
  return new Node(50);
};
Node.createBind = function(value) {
  return new Node(51).withChildren([value]);
};
Node.createSequence = function(values) {
  return new Node(52).withChildren(values);
};
Node.createParameterize = function(type, types) {
  types.unshift(type);
  return new Node(53).withChildren(types);
};
Node.createCast = function(type, value) {
  return new Node(54).withChildren([type, value]);
};
Node.createImplicitCast = function(type, value) {
  return new Node(55).withChildren([type, value]);
};
Node.createLambda = function($arguments, block) {
  $arguments.push(block);
  return new Node(56).withChildren($arguments);
};
Node.createDefault = function(type) {
  return new Node(57).withChildren([type]);
};
Node.createVar = function() {
  return new Node(58);
};
Node.createFunctionType = function(result, $arguments) {
  $arguments.unshift(result);
  return new Node(59).withChildren($arguments);
};
Node.createUnary = function(kind, value) {
  return new Node(kind).withChildren([value]);
};
Node.createAssign = function(left, right) {
  return Node.createBinary(88, left, right);
};
Node.createBinary = function(kind, left, right) {
  if (kind === 88 && left.kind === 77) {
    var target = left.binaryLeft();
    var index = left.binaryRight();
    return Node.createTertiary(99, target.remove(), index.remove(), right);
  }
  return new Node(kind).withChildren([left, right]);
};
Node.createTertiary = function(kind, left, middle, right) {
  return new Node(kind).withChildren([left, middle, right]);
};
Node.prototype.fileBlock = function() {
  return this.children.get(0);
};
Node.prototype.dotTarget = function() {
  return this.children.get(0);
};
Node.prototype.dotName = function() {
  return this.children.get(1);
};
Node.prototype.letVariable = function() {
  return this.children.get(0);
};
Node.prototype.letValue = function() {
  return this.children.get(1);
};
Node.prototype.unaryValue = function() {
  return this.children.get(0);
};
Node.prototype.binaryLeft = function() {
  return this.children.get(0);
};
Node.prototype.binaryRight = function() {
  return this.children.get(1);
};
Node.prototype.tertiaryLeft = function() {
  return this.children.get(0);
};
Node.prototype.tertiaryMiddle = function() {
  return this.children.get(1);
};
Node.prototype.tertiaryRight = function() {
  return this.children.get(2);
};
Node.prototype.hookTest = function() {
  return this.children.get(0);
};
Node.prototype.hookTrue = function() {
  return this.children.get(1);
};
Node.prototype.hookFalse = function() {
  return this.children.get(2);
};
Node.prototype.declarationName = function() {
  return this.children.get(0);
};
Node.prototype.declarationBlock = function() {
  return this.children.get(1);
};
Node.prototype.clusterType = function() {
  return this.children.get(0);
};
Node.prototype.clusterVariables = function() {
  return this.children.slice(1, this.children.length);
};
Node.prototype.variableType = function() {
  return this.children.get(1);
};
Node.prototype.variableValue = function() {
  return this.children.get(2);
};
Node.prototype.aliasValue = function() {
  return this.children.get(1);
};
Node.prototype.usingNamespaceValue = function() {
  return this.children.get(0);
};
Node.prototype.modifierName = function() {
  return this.children.get(0);
};
Node.prototype.modifierStatements = function() {
  return this.children.slice(1, this.children.length);
};
Node.prototype.castType = function() {
  return this.children.get(0);
};
Node.prototype.castValue = function() {
  return this.children.get(1);
};
Node.prototype.expressionValue = function() {
  return this.children.get(0);
};
Node.prototype.ifTest = function() {
  return this.children.get(0);
};
Node.prototype.ifTrue = function() {
  return this.children.get(1);
};
Node.prototype.ifFalse = function() {
  return this.children.get(2);
};
Node.prototype.forSetup = function() {
  return this.children.get(0);
};
Node.prototype.forTest = function() {
  return this.children.get(1);
};
Node.prototype.forUpdate = function() {
  return this.children.get(2);
};
Node.prototype.forBlock = function() {
  return this.children.get(3);
};
Node.prototype.forEachVariable = function() {
  return this.children.get(0);
};
Node.prototype.forEachValue = function() {
  return this.children.get(1);
};
Node.prototype.forEachBlock = function() {
  return this.children.get(2);
};
Node.prototype.whileTest = function() {
  return this.children.get(0);
};
Node.prototype.whileBlock = function() {
  return this.children.get(1);
};
Node.prototype.defaultType = function() {
  return this.children.get(0);
};
Node.prototype.baseTypes = function() {
  return this.children.get(2);
};
Node.prototype.objectParameters = function() {
  return this.children.get(3);
};
Node.prototype.functionArguments = function() {
  return this.children.get(1);
};
Node.prototype.functionBlock = function() {
  return this.children.get(2);
};
Node.prototype.functionResult = function() {
  return this.children.get(3);
};
Node.prototype.superInitializer = function() {
  return this.children.get(3);
};
Node.prototype.memberInitializers = function() {
  return this.children.get(4);
};
Node.prototype.memberInitializerName = function() {
  return this.children.get(0);
};
Node.prototype.memberInitializerValue = function() {
  return this.children.get(1);
};
Node.prototype.lambdaArguments = function() {
  return this.children.slice(0, this.children.length - 1 | 0);
};
Node.prototype.lambdaBlock = function() {
  return this.children.get(this.children.length - 1 | 0);
};
Node.prototype.assertValue = function() {
  return this.children.get(0);
};
Node.prototype.bindValue = function() {
  return this.children.get(0);
};
Node.prototype.parameterizeType = function() {
  return this.children.get(0);
};
Node.prototype.parameterizeTypes = function() {
  return this.children.slice(1, this.children.length);
};
Node.prototype.functionTypeResult = function() {
  return this.children.get(0);
};
Node.prototype.functionTypeArguments = function() {
  return this.children.slice(1, this.children.length);
};
Node.prototype.callValue = function() {
  return this.children.get(0);
};
Node.prototype.callArguments = function() {
  return this.children.slice(1, this.children.length);
};
Node.prototype.superCallArguments = function() {
  return this.children;
};
Node.prototype.initializerValues = function() {
  return this.children;
};
Node.prototype.parameterBound = function() {
  return this.children.get(1);
};
Node.prototype.returnValue = function() {
  return this.children.get(0);
};
Node.prototype.switchValue = function() {
  return this.children.get(0);
};
Node.prototype.switchCases = function() {
  return this.children.slice(1, this.children.length);
};
Node.prototype.caseValues = function() {
  return this.children.slice(0, this.children.length - 1 | 0);
};
Node.prototype.caseBlock = function() {
  return this.children.get(this.children.length - 1 | 0);
};
Node.prototype.invertBooleanCondition = function(cache) {
  switch (this.kind) {
  case 39:
    this.kind = 40;
    return;
  case 40:
    this.kind = 39;
    return;
  case 60:
    this.become(this.unaryValue().remove());
    return;
  case 73:
    this.kind = 83;
    return;
  case 83:
    this.kind = 73;
    return;
  case 81:
    this.kind = 80;
    this.binaryLeft().invertBooleanCondition(cache);
    this.binaryRight().invertBooleanCondition(cache);
    return;
  case 80:
    this.kind = 81;
    this.binaryLeft().invertBooleanCondition(cache);
    this.binaryRight().invertBooleanCondition(cache);
    return;
  case 78:
  case 74:
  case 79:
  case 75:
    if (!cache.commonImplicitType(this.binaryLeft().type, this.binaryRight().type).isReal(cache)) {
      switch (this.kind) {
      case 78:
        this.kind = 75;
        break;
      case 74:
        this.kind = 79;
        break;
      case 79:
        this.kind = 74;
        break;
      case 75:
        this.kind = 78;
        break;
      }
      return;
    }
    break;
  }
  var children = this.removeChildren();
  this.become(Node.createUnary(60, this.clone().withChildren(children)).withType(cache.boolType));
};
Node.prototype.blockAlwaysEndsWithReturn = function() {
  if (!this.hasChildren()) {
    return false;
  }
  for (var i = this.children.length - 1 | 0; i >= 0; i = i - 1 | 0) {
    var child = this.children.get(i);
    switch (child.kind) {
    case 25:
    case 26:
      return true;
    case 20:
      var trueBlock = child.ifTrue();
      var falseBlock = child.ifFalse();
      if (falseBlock !== null && trueBlock.blockAlwaysEndsWithReturn() && falseBlock.blockAlwaysEndsWithReturn()) {
        return true;
      }
      break;
    case 31:
      var value = child.switchValue();
      var cases = child.switchCases();
      var foundDefault = false;
      for (var j = 0; j < cases.length; j = j + 1 | 0) {
        var node = cases.get(j);
        if (!node.caseBlock().blockAlwaysEndsWithReturn()) {
          return false;
        }
        if (node.caseValues().length === 0) {
          foundDefault = true;
        }
      }
      return foundDefault;
    }
  }
  return false;
};
Node.prototype.asBool = function() {
  return this.kind === 39;
};
Node.prototype.asInt = function() {
  return this.content.value;
};
Node.prototype.asDouble = function() {
  return this.content.value;
};
Node.prototype.asString = function() {
  return this.content.value;
};
Node.prototype.hasChildren = function() {
  return this.children !== null && this.children.length > 0;
};
Node.prototype.indexInParent = function() {
  return this.parent.children.indexOf(this);
};
Node.prototype.prependChild = function(node) {
  this.insertChild(0, node);
};
Node.prototype.prependChildren = function(nodes) {
  this.insertChildren(0, nodes);
};
Node.prototype.appendChild = function(node) {
  this.insertChild(this.children === null ? 0 : this.children.length, node);
};
Node.prototype.appendChildren = function(nodes) {
  this.insertChildren(this.children === null ? 0 : this.children.length, nodes);
};
Node.prototype.insertSiblingBefore = function(node) {
  this.parent.insertChild(this.indexInParent(), node);
};
Node.prototype.insertSiblingAfter = function(node) {
  this.parent.insertChild(this.indexInParent() + 1 | 0, node);
};
Node.prototype.remove = function() {
  if (this.parent !== null) {
    var index = this.indexInParent();
    this.parent.children.set(index, null);
    this.parent = null;
  }
  return this;
};
Node.prototype.removeChildren = function() {
  if (this.children === null) {
    return [];
  }
  var result = this.children;
  for (var i = 0; i < this.children.length; i = i + 1 | 0) {
    var child = this.children.get(i);
    if (child !== null) {
      child.parent = null;
    }
  }
  this.children = null;
  return result;
};
Node.prototype.become = function(node) {
  this.kind = node.kind;
  this.range = node.range;
  this.sibling = node.sibling;
  this.removeChildren();
  this.withChildren(node.removeChildren());
  this.type = node.type;
  this.scope = node.scope;
  this.symbol = node.symbol;
  this.content = node.content;
};
Node.prototype.replaceWith = function(node) {
  this.parent.replaceChild(this.indexInParent(), node);
};
Node.prototype.replaceChild = function(index, node) {
  Node.updateParent(node, this);
  var old = this.children.get(index);
  if (old !== null) {
    old.parent = null;
  }
  this.children.set(index, node);
};
Node.prototype.insertChild = function(index, node) {
  if (this.children === null) {
    this.children = [];
  }
  Node.updateParent(node, this);
  this.children.insert(index, node);
};
Node.prototype.insertChildren = function(index, nodes) {
  if (this.children === null) {
    this.children = [];
  }
  for (var i = 0; i < nodes.length; i = i + 1 | 0) {
    var node = nodes.get(i);
    Node.updateParent(node, this);
    this.children.insert((index = index + 1 | 0) - 1 | 0, node);
  }
};
Node.prototype.clone = function() {
  var node = new Node(this.kind);
  node.range = this.range;
  node.type = this.type;
  node.symbol = this.symbol;
  node.content = this.content;
  if (this.children !== null) {
    node.children = [];
    for (var i = 0; i < this.children.length; i = i + 1 | 0) {
      var child = this.children.get(i);
      node.appendChild(child !== null ? child.clone() : null);
    }
  }
  return node;
};
Node.prototype.withRange = function(value) {
  this.range = value;
  return this;
};
Node.prototype.withType = function(value) {
  this.type = value;
  return this;
};
Node.prototype.withSymbol = function(value) {
  this.symbol = value;
  return this;
};
Node.prototype.withContent = function(value) {
  this.content = value;
  return this;
};
Node.prototype.withChildren = function(nodes) {
  for (var i = 0; i < nodes.length; i = i + 1 | 0) {
    Node.updateParent(nodes.get(i), this);
  }
  this.children = nodes;
  return this;
};
Node.prototype.firstNonExtensionSibling = function() {
  var node = this;
  while (node !== null && node.kind === 13) {
    node = node.sibling;
  }
  return node;
};
Node.prototype.appendToSiblingChain = function(node) {
  var last = this;
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
  return $this >= 34 && $this <= 99;
};
NodeKind.isConstant = function($this) {
  return $this >= 38 && $this <= 44;
};
NodeKind.isCall = function($this) {
  return $this >= 48 && $this <= 49;
};
NodeKind.isUnaryOperator = function($this) {
  return $this >= 60 && $this <= 67;
};
NodeKind.isUnaryStorageOperator = function($this) {
  return $this >= 64 && $this <= 67;
};
NodeKind.isBinaryOperator = function($this) {
  return $this >= 68 && $this <= 98;
};
NodeKind.isBinaryStorageOperator = function($this) {
  return $this >= 88 && $this <= 98;
};
NodeKind.isTertiaryOperator = function($this) {
  return $this === 99;
};
NodeKind.isCast = function($this) {
  return $this >= 54 && $this <= 55;
};
NodeKind.isType = function($this) {
  return $this === 35;
};
NodeKind.isReal = function($this) {
  return $this >= 42 && $this <= 43;
};
NodeKind.isBool = function($this) {
  return $this >= 39 && $this <= 40;
};
NodeKind.isError = function($this) {
  return $this === 50;
};
NodeKind.isLoop = function($this) {
  return $this >= 21 && $this <= 24;
};
NodeKind.isStorage = function($this) {
  return $this === 34 || $this === 46;
};
NodeKind.prettyPrint = function($this) {
  return replace(NodeKind.toString($this).toLowerCase(), "_", "-");
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
    return "VAR";
  case 59:
    return "FUNCTION_TYPE";
  case 60:
    return "NOT";
  case 61:
    return "POSITIVE";
  case 62:
    return "NEGATIVE";
  case 63:
    return "COMPLEMENT";
  case 64:
    return "PREFIX_INCREMENT";
  case 65:
    return "PREFIX_DECREMENT";
  case 66:
    return "POSTFIX_INCREMENT";
  case 67:
    return "POSTFIX_DECREMENT";
  case 68:
    return "ADD";
  case 69:
    return "BITWISE_AND";
  case 70:
    return "BITWISE_OR";
  case 71:
    return "BITWISE_XOR";
  case 72:
    return "DIVIDE";
  case 73:
    return "EQUAL";
  case 74:
    return "GREATER_THAN";
  case 75:
    return "GREATER_THAN_OR_EQUAL";
  case 76:
    return "IN";
  case 77:
    return "INDEX";
  case 78:
    return "LESS_THAN";
  case 79:
    return "LESS_THAN_OR_EQUAL";
  case 80:
    return "LOGICAL_AND";
  case 81:
    return "LOGICAL_OR";
  case 82:
    return "MULTIPLY";
  case 83:
    return "NOT_EQUAL";
  case 84:
    return "REMAINDER";
  case 85:
    return "SHIFT_LEFT";
  case 86:
    return "SHIFT_RIGHT";
  case 87:
    return "SUBTRACT";
  case 88:
    return "ASSIGN";
  case 89:
    return "ASSIGN_ADD";
  case 90:
    return "ASSIGN_BITWISE_AND";
  case 91:
    return "ASSIGN_BITWISE_OR";
  case 92:
    return "ASSIGN_BITWISE_XOR";
  case 93:
    return "ASSIGN_DIVIDE";
  case 94:
    return "ASSIGN_MULTIPLY";
  case 95:
    return "ASSIGN_REMAINDER";
  case 96:
    return "ASSIGN_SHIFT_LEFT";
  case 97:
    return "ASSIGN_SHIFT_RIGHT";
  case 98:
    return "ASSIGN_SUBTRACT";
  case 99:
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
  this.collectStatements(program);
  this.sortTypeSymbols();
}
Collector.prototype.collectStatements = function(node) {
  switch (node.kind) {
  case 0:
  case 1:
  case 32:
  case 2:
    this.collectChildStatements(node);
    break;
  case 7:
  case 10:
  case 11:
  case 12:
  case 13:
  case 8:
  case 9:
    if (node === node.symbol.node) {
      this.typeSymbols.push(node.symbol);
    }
    this.collectChildStatements(node);
    break;
  case 14:
  case 15:
    if (!SymbolKind.isTypeWithInstances(node.symbol.enclosingSymbol.kind)) {
      this.freeFunctionSymbols.push(node.symbol);
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
    this.topLevelStatements.push(node);
    break;
  }
};
Collector.prototype.sortTypeSymbols = function() {
  if (this.sort === 0) {
    return;
  }
  for (var i = 1; i < this.typeSymbols.length; i = i + 1 | 0) {
    var symbol = this.typeSymbols.get(i);
    for (var j = 0; j < i; j = j + 1 | 0) {
      if (this.typeComesBefore(symbol.type, this.typeSymbols.get(j).type)) {
        var k = i;
        for (; k > j; k = k - 1 | 0) {
          this.typeSymbols.set(k, this.typeSymbols.get(k - 1 | 0));
        }
        this.typeSymbols.set(j, symbol);
        break;
      }
    }
  }
};
Collector.prototype.typeComesBefore = function(left, right) {
  if (right.hasBaseType(left)) {
    return true;
  }
  if (this.sort === 2 && left.isStruct()) {
    var members = right.members.values();
    if (members !== null) {
      for (var i = 0; i < members.length; i = i + 1 | 0) {
        if (members.get(i).type === left) {
          return true;
        }
      }
    }
  }
  if (this.sort === 3 && right.symbol.isContainedBy(left.symbol)) {
    return true;
  }
  return false;
};
Collector.prototype.collectChildStatements = function(node) {
  if (node.hasChildren()) {
    for (var i = 0; i < node.children.length; i = i + 1 | 0) {
      var child = node.children.get(i);
      if (child !== null) {
        this.collectStatements(child);
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
CompilerOptions.prototype.isSingleFileMode = function() {
  return this.outputFile.length > 0;
};
function CompilerResult(_0, _1, _2, _3) {
  this.options = _0;
  this.outputs = _1;
  this.program = _2;
  this.resolver = _3;
}
function Compiler() {
  this.tokenizeTime = 0;
  this.parseTime = 0;
  this.resolveTime = 0;
  this.emitTime = 0;
  this.totalTime = 0;
  this.log = new Log();
}
Compiler.prototype.statistics = function(result) {
  var lineCount = 0;
  for (var i = 0; i < result.options.inputs.length; i = i + 1 | 0) {
    lineCount = lineCount + result.options.inputs.get(i).lineCount() | 0;
  }
  var text = "Lines: ".append(lineCount.toString());
  text = text.append("\nTime: ").append(formatNumber(this.totalTime)).append("ms");
  if (this.tokenizeTime > 0) {
    text = text.append("\n  Tokenize: ").append(formatNumber(this.tokenizeTime).append("ms"));
  }
  if (this.parseTime > 0) {
    text = text.append("\n  Parse: ").append(formatNumber(this.parseTime).append("ms"));
  }
  if (this.resolveTime > 0) {
    text = text.append("\n  Resolve: ").append(formatNumber(this.resolveTime).append("ms"));
  }
  if (this.emitTime > 0) {
    text = text.append("\n  Emit: ").append(formatNumber(this.emitTime).append("ms"));
  }
  text = text.append("\nInputs: ").append(result.options.inputs.length.toString());
  for (var i = 0; i < result.options.inputs.length; i = i + 1 | 0) {
    var source = result.options.inputs.get(i);
    text = text.append("\n  ").append(source.name).append(": ").append(bytesToString(source.contents.length));
  }
  if (result.outputs !== null) {
    text = text.append("\nOutputs: ").append(result.outputs.length.toString());
    for (var i = 0; i < result.outputs.length; i = i + 1 | 0) {
      var source = result.outputs.get(i);
      text = text.append("\n  ").append(source.name).append(": ").append(bytesToString(source.contents.length));
    }
  }
  return text;
};
Compiler.prototype.compile = function(options) {
  var totalStart = now();
  var program = Node.createProgram([]);
  var outputs = null;
  if (Compiler.nativeLibrarySource !== null) {
    program.appendChild(Compiler.nativeLibraryFile.clone());
  } else {
    Compiler.nativeLibrarySource = new Source("<native>", NATIVE_LIBRARY);
    this.processInput(program, Compiler.nativeLibrarySource);
    Compiler.nativeLibraryFile = program.children.get(0).clone();
  }
  options.inputs.unshift(Compiler.nativeLibrarySource);
  for (var i = 1; i < options.inputs.length; i = i + 1 | 0) {
    this.processInput(program, options.inputs.get(i));
  }
  var resolver;
  if (TargetFormat.shouldRunResolver(options.targetFormat)) {
    var resolveStart = now();
    resolver = new Resolver(this.log);
    resolver.run(program);
    this.resolveTime = this.resolveTime + now() - resolveStart;
  }
  if (this.log.errorCount === 0) {
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
        InstanceToStaticPass.run(program);
        if (options.optimize) {
          resolver.constantFolder.foldConstants(program);
        }
      }
      var emitStart = now();
      outputs = emitter.emitProgram(program);
      this.emitTime = this.emitTime + now() - emitStart;
    }
  }
  this.totalTime = this.totalTime + now() - totalStart;
  return new CompilerResult(options, outputs, program, resolver);
};
Compiler.prototype.processInput = function(program, source) {
  var errorCount = this.log.errorCount;
  var tokenizeStart = now();
  var sourceTokens = tokenize(this.log, source);
  this.tokenizeTime = this.tokenizeTime + now() - tokenizeStart;
  if (this.log.errorCount === errorCount) {
    var parseStart = now();
    var file = parseFile(this.log, sourceTokens);
    this.parseTime = this.parseTime + now() - parseStart;
    if (file !== null) {
      program.appendChild(file);
    }
  }
};
var json = {};
json.Emitter = function(_0) {
  this.options = _0;
};
json.Emitter.prototype.emitProgram = function(program) {
  var outputs = [];
  if (this.options.isSingleFileMode()) {
    outputs.push(new Source(this.options.outputFile, json.dump(program).append("\n")));
  } else {
    for (var i = 0; i < program.children.length; i = i + 1 | 0) {
      var file = program.children.get(i);
      outputs.push(new Source(joinPath(this.options.outputDirectory, file.range.source.name.append(".json")), json.dump(file).append("\n")));
    }
  }
  return outputs;
};
json.DumpVisitor = function() {
  this.builder = new StringBuilder();
  this.indent = "";
};
json.DumpVisitor.prototype.visit = function(node) {
  if (node === null) {
    this.builder.append("null");
    return;
  }
  var outer = this.indent;
  this.indent = this.indent.append("  ");
  this.builder.append("{\n").append(this.indent).append("\"kind\": ").append(simpleQuote(NodeKind.prettyPrint(node.kind)));
  if (node.content !== null) {
    this.builder.append(",\n").append(this.indent).append("\"content\": ");
    switch (node.content.type()) {
    case 0:
      this.builder.append(node.asInt().toString());
      break;
    case 1:
      this.builder.append(node.asDouble().toString());
      break;
    case 2:
      this.builder.append(quoteString(node.asString(), 34));
      break;
    }
  }
  if (node.hasChildren()) {
    this.builder.append(",\n").append(this.indent).append("\"children\": [");
    var inner = this.indent;
    this.indent = this.indent.append("  ");
    for (var i = 0; i < node.children.length; i = i + 1 | 0) {
      if (i > 0) {
        this.builder.append(",");
      }
      this.builder.append("\n").append(this.indent);
      this.visit(node.children.get(i));
    }
    this.indent = inner;
    this.builder.append("\n").append(this.indent).append("]");
  }
  this.indent = outer;
  this.builder.append("\n").append(this.indent).append("}");
};
var lisp = {};
lisp.Emitter = function(_0) {
  this.options = _0;
};
lisp.Emitter.prototype.emitProgram = function(program) {
  var outputs = [];
  if (this.options.isSingleFileMode()) {
    outputs.push(new Source(this.options.outputFile, lisp.dump(program).append("\n")));
  } else {
    for (var i = 0; i < program.children.length; i = i + 1 | 0) {
      var file = program.children.get(i);
      outputs.push(new Source(joinPath(this.options.outputDirectory, file.range.source.name.append(".lisp")), lisp.dump(file).append("\n")));
    }
  }
  return outputs;
};
lisp.DumpVisitor = function() {
  this.builder = new StringBuilder();
  this.indent = "";
};
lisp.DumpVisitor.prototype.visit = function(node) {
  if (node === null) {
    this.builder.append("nil");
    return;
  }
  this.builder.append("(").append(NodeKind.prettyPrint(node.kind));
  if (node.content !== null) {
    switch (node.content.type()) {
    case 0:
      this.builder.append(" ").append(node.asInt().toString());
      break;
    case 1:
      this.builder.append(" ").append(node.asDouble().toString());
      break;
    case 2:
      this.builder.append(" ").append(quoteString(node.asString(), 34));
      break;
    }
  }
  if (node.hasChildren()) {
    var old = this.indent;
    this.indent = this.indent.append("  ");
    for (var i = 0; i < node.children.length; i = i + 1 | 0) {
      this.builder.append("\n").append(this.indent);
      this.visit(node.children.get(i));
    }
    this.indent = old;
  }
  this.builder.append(")");
};
var xml = {};
xml.Emitter = function(_0) {
  this.options = _0;
};
xml.Emitter.prototype.emitProgram = function(program) {
  var outputs = [];
  if (this.options.isSingleFileMode()) {
    outputs.push(new Source(this.options.outputFile, xml.dump(program).append("\n")));
  } else {
    for (var i = 0; i < program.children.length; i = i + 1 | 0) {
      var file = program.children.get(i);
      outputs.push(new Source(joinPath(this.options.outputDirectory, file.range.source.name.append(".xml")), xml.dump(file).append("\n")));
    }
  }
  return outputs;
};
xml.DumpVisitor = function() {
  this.builder = new StringBuilder();
  this.indent = "";
};
xml.DumpVisitor.prototype.visit = function(node) {
  if (node === null) {
    this.builder.append("<null/>");
    return;
  }
  this.builder.append("<").append(NodeKind.prettyPrint(node.kind));
  if (node.content !== null) {
    this.builder.append(" content=");
    switch (node.content.type()) {
    case 0:
      this.builder.append(simpleQuote(node.asInt().toString()));
      break;
    case 1:
      this.builder.append(simpleQuote(node.asDouble().toString()));
      break;
    case 2:
      this.builder.append(quoteString(node.asString(), 34));
      break;
    }
  }
  if (node.hasChildren()) {
    this.builder.append(">");
    var inner = this.indent;
    this.indent = this.indent.append("  ");
    for (var i = 0; i < node.children.length; i = i + 1 | 0) {
      this.builder.append("\n").append(this.indent);
      this.visit(node.children.get(i));
    }
    this.indent = inner;
    this.builder.append("\n").append(this.indent).append("</").append(NodeKind.prettyPrint(node.kind)).append(">");
  } else {
    this.builder.append("/>");
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
Log.prototype.error = function(range, text) {
  this.diagnostics.push(new Diagnostic(0, range, text));
  this.errorCount = this.errorCount + 1 | 0;
};
Log.prototype.warning = function(range, text) {
  this.diagnostics.push(new Diagnostic(1, range, text));
  this.warningCount = this.warningCount + 1 | 0;
};
Log.prototype.note = function(range, text) {
  var last = this.diagnostics.get(this.diagnostics.length - 1 | 0);
  last.noteRange = range;
  last.noteText = text;
};
Log.prototype.toString = function() {
  var builder = new StringBuilder();
  for (var i = 0; i < this.diagnostics.length; i = i + 1 | 0) {
    var diagnostic = this.diagnostics.get(i);
    var formatted = diagnostic.range.format(0);
    builder.append(diagnostic.range.locationString()).append(diagnostic.kind === 0 ? ": error: " : ": warning: ").append(diagnostic.text).append("\n").append(formatted.line).append("\n").append(formatted.range).append("\n");
    if (!diagnostic.noteRange.isEmpty()) {
      formatted = diagnostic.noteRange.format(0);
      builder.append(diagnostic.noteRange.locationString()).append(": note: ").append(diagnostic.noteText).append("\n").append(formatted.line).append("\n").append(formatted.range).append("\n");
    }
  }
  return builder.toString();
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
Range.prototype.isEmpty = function() {
  return this.source === null;
};
Range.prototype.toString = function() {
  return this.source === null ? "" : this.source.contents.slice(this.start, this.end);
};
Range.prototype.locationString = function() {
  if (this.isEmpty()) {
    return "";
  }
  var location = this.source.indexToLineColumn(this.start);
  return this.source.name.append(":").append((location.line + 1 | 0).toString()).append(":").append((location.column + 1 | 0).toString());
};
Range.prototype.touches = function(index) {
  return this.start <= index && index <= this.end;
};
Range.prototype.singleLineLength = function() {
  var start = this.source.indexToLineColumn(this.start);
  var end = this.source.indexToLineColumn(this.end);
  return (start.line === end.line ? end.column : this.source.contentsOfLine(start.line).length) - start.column | 0;
};
Range.prototype.format = function(maxLength) {
  var start = this.source.indexToLineColumn(this.start);
  var end = this.source.indexToLineColumn(this.end);
  var line = this.source.contentsOfLine(start.line);
  var length = line.length;
  var a = start.column;
  var b = end.line === start.line ? end.column : length;
  if (maxLength > 0 && length > maxLength) {
    var centeredWidth = (b - a | 0) < (maxLength / 2 | 0) ? b - a | 0 : maxLength / 2 | 0;
    var centeredStart = (maxLength - centeredWidth | 0) / 2 | 0;
    if (a < centeredStart) {
      line = line.slice(0, maxLength - 3 | 0).append("...");
      if (b > (maxLength - 3 | 0)) {
        b = maxLength - 3 | 0;
      }
    } else if ((length - a | 0) < (maxLength - centeredStart | 0)) {
      var offset = length - maxLength | 0;
      line = "...".append(line.slice(offset + 3 | 0, length));
      a = a - offset | 0;
      b = b - offset | 0;
    } else {
      var offset = a - centeredStart | 0;
      line = "...".append(line.slice(offset + 3 | 0, (offset + maxLength | 0) - 3 | 0)).append("...");
      a = a - offset | 0;
      b = b - offset | 0;
      if (b > (maxLength - 3 | 0)) {
        b = maxLength - 3 | 0;
      }
    }
  }
  return new FormattedRange(line, repeat(" ", a).append((b - a | 0) < 2 ? "^" : repeat("~", b - a | 0)));
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
Source.prototype.computeLineOffsets = function() {
  if (this.lineOffsets !== null) {
    return;
  }
  this.lineOffsets = [0];
  for (var i = 0; i < this.contents.length; i = i + 1 | 0) {
    if (this.contents.codeUnitAt(i) === 10) {
      this.lineOffsets.push(i + 1 | 0);
    }
  }
};
Source.prototype.lineCount = function() {
  this.computeLineOffsets();
  return this.lineOffsets.length - 1 | 0;
};
Source.prototype.contentsOfLine = function(line) {
  this.computeLineOffsets();
  if (line < 0 || line >= this.lineOffsets.length) {
    return "";
  }
  var start = this.lineOffsets.get(line);
  var end = (line + 1 | 0) < this.lineOffsets.length ? this.lineOffsets.get(line + 1 | 0) - 1 | 0 : this.contents.length;
  return this.contents.slice(start, end);
};
Source.prototype.indexToLineColumn = function(index) {
  this.computeLineOffsets();
  var count = this.lineOffsets.length;
  var line = 0;
  while (count > 0) {
    var step = count / 2 | 0;
    var i = line + step | 0;
    if (this.lineOffsets.get(i) <= index) {
      line = i + 1 | 0;
      count = (count - step | 0) - 1 | 0;
    } else {
      count = step;
    }
  }
  var column = line > 0 ? index - this.lineOffsets.get(line - 1 | 0) | 0 : index;
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
frontend.Flags.prototype.shouldWriteToStdout = function() {
  return this.outputFile === "";
};
var js = {};
js.PatchContext = function() {
  this.lambdaCount = 0;
  this.createdThisAlias = false;
  this.$function = null;
};
js.PatchContext.prototype.setFunction = function(node) {
  this.$function = node;
  this.createdThisAlias = false;
};
js.PatchContext.prototype.thisAlias = function() {
  if (!this.createdThisAlias) {
    this.createdThisAlias = true;
    this.$function.functionBlock().insertChild(0, Node.createVariableCluster(Node.createError(), [Node.createVariable(Node.createName("$this"), null, Node.createThis())]));
  }
  return Node.createName("$this");
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
  this.options = _0;
  this.cache = _1;
};
js.Emitter.prototype.emitProgram = function(program) {
  this.patchNode(program, new js.PatchContext());
  this.currentSource = new Source(this.options.outputFile, "");
  var collector = new Collector(program, 3);
  if (this.needMathImul) {
    this.emit("var $imul = Math.imul || function(a, b) {\n  var ah = a >>> 16, al = a & 0xFFFF;\n  var bh = b >>> 16, bl = b & 0xFFFF;\n  return al * bl + (ah * bl + al * bh << 16) | 0;\n};\n");
  }
  if (this.needExtends) {
    this.emit("function $extends(derived, base) {\n  derived.prototype = Object.create(base.prototype);\n  derived.prototype.constructor = derived;\n}\n");
  }
  for (var i = 0; i < collector.typeSymbols.length; i = i + 1 | 0) {
    var type = collector.typeSymbols.get(i).type;
    if (type.isNamespace()) {
      if (!type.symbol.isImport()) {
        this.emitNode(type.symbol.node.firstNonExtensionSibling());
      }
      continue;
    }
    if (!type.symbol.isImport()) {
      if (type.isEnum()) {
        this.emitNode(type.symbol.node.firstNonExtensionSibling());
      } else {
        var $constructor = type.$constructor();
        if ($constructor !== null) {
          this.emitNode($constructor.symbol.node);
        }
      }
    }
    var members = type.members.values();
    for (var j = 0; j < members.length; j = j + 1 | 0) {
      var symbol = members.get(j).symbol;
      if (symbol.enclosingSymbol === type.symbol && symbol.node !== null && SymbolKind.isFunction(symbol.kind) && !SymbolKind.isConstructor(symbol.kind)) {
        this.emitNode(symbol.node);
      }
    }
  }
  for (var i = 0; i < collector.freeFunctionSymbols.length; i = i + 1 | 0) {
    this.emitNode(collector.freeFunctionSymbols.get(i).node);
  }
  for (var i = 0; i < collector.topLevelStatements.length; i = i + 1 | 0) {
    this.emitNode(collector.topLevelStatements.get(i));
  }
  if (this.options.jsSourceMap) {
    this.currentSource.contents = this.currentSource.contents.append("/").append("/# sourceMappingURL=data:application/json;base64,").append(encodeBase64(this.generator.toString()));
  }
  return [this.currentSource];
};
js.Emitter.prototype.addMapping = function(node) {
  if (this.options.jsSourceMap) {
    var range = node.range;
    if (range.source !== null) {
      var location = range.source.indexToLineColumn(range.start);
      this.generator.addMapping(range.source, location.line, location.column, this.currentLine, this.currentColumn);
    }
  }
};
js.Emitter.prototype.increaseIndent = function() {
  this.indent = this.indent.append("  ");
};
js.Emitter.prototype.decreaseIndent = function() {
  this.indent = this.indent.slice(2, this.indent.length);
};
js.Emitter.prototype.emit = function(text) {
  if (this.options.jsSourceMap) {
    for (var i = 0; i < text.length; i = i + 1 | 0) {
      var c = text.codeUnitAt(i);
      if (c === 10) {
        this.currentColumn = 0;
        this.currentLine = this.currentLine + 1 | 0;
      } else {
        this.currentColumn = this.currentColumn + 1 | 0;
      }
    }
  }
  this.currentSource.contents = this.currentSource.contents.append(text);
};
js.Emitter.prototype.emitNodes = function(nodes) {
  for (var i = 0; i < nodes.length; i = i + 1 | 0) {
    this.emitNode(nodes.get(i));
  }
};
js.Emitter.prototype.emitCommaSeparatedNodes = function(nodes) {
  for (var i = 0; i < nodes.length; i = i + 1 | 0) {
    if (i > 0) {
      this.emit(", ");
    }
    this.emitNode(nodes.get(i));
  }
};
js.Emitter.prototype.emitCommaSeparatedExpressions = function(nodes) {
  for (var i = 0; i < nodes.length; i = i + 1 | 0) {
    if (i > 0) {
      this.emit(", ");
    }
    this.emitExpression(nodes.get(i), 1);
  }
};
js.Emitter.prototype.emitArgumentVariables = function(nodes) {
  this.emit("(");
  this.emitCommaSeparatedNodes(nodes);
  this.emit(")");
};
js.Emitter.prototype.emitChildren = function(node) {
  if (node.hasChildren()) {
    this.emitNodes(node.children);
  }
};
js.Emitter.prototype.recursiveEmitIfStatement = function(node) {
  this.emit("if (");
  this.emitExpression(node.ifTest(), 0);
  this.emit(") ");
  this.emitNode(node.ifTrue());
  var block = node.ifFalse();
  if (block !== null) {
    this.emit(" else ");
    var statement = block.hasChildren() && block.children.length === 1 ? block.children.get(0) : null;
    if (statement !== null && statement.kind === 20) {
      this.addMapping(statement);
      this.recursiveEmitIfStatement(statement);
    } else {
      this.emitNode(block);
    }
  }
};
js.Emitter.prototype.emitNode = function(node) {
  this.isStartOfExpression = false;
  this.addMapping(node);
  switch (node.kind) {
  case 0:
    this.emitChildren(node);
    break;
  case 1:
    this.emitChildren(node.fileBlock());
    break;
  case 2:
    this.emit("{\n");
    this.increaseIndent();
    this.emitChildren(node);
    this.decreaseIndent();
    this.emit(this.indent.append("}"));
    break;
  case 4:
    var values = node.caseValues();
    var block = node.caseBlock();
    for (var i = 0; i < values.length; i = i + 1 | 0) {
      this.emit(this.indent.append("case "));
      this.emitExpression(values.get(i), 0);
      this.emit(":\n");
    }
    if (values.length === 0) {
      this.emit(this.indent.append("default:\n"));
    }
    this.increaseIndent();
    this.emitChildren(block);
    if (!block.blockAlwaysEndsWithReturn()) {
      this.emit(this.indent.append("break;\n"));
    }
    this.decreaseIndent();
    break;
  case 6:
    var variables = node.clusterVariables();
    for (var i = 0; i < variables.length; i = i + 1 | 0) {
      var variable = variables.get(i);
      var isCompoundName = variable.symbol !== null && this.hasCompoundName(variable.symbol);
      if ((variable.symbol === null || !SymbolKind.isInstance(variable.symbol.kind)) && (!isCompoundName || variable.variableValue() !== null)) {
        this.emit(this.indent);
        if (!isCompoundName) {
          this.emit("var ");
        }
        this.emitNode(variable);
        this.emit(";\n");
      }
    }
    break;
  case 7:
    if (!this.hasCompoundName(node.symbol)) {
      this.emit("var ");
    }
    this.emit(this.indent.append(this.fullName(node.symbol)).append(" = {};\n"));
    break;
  case 8:
  case 9:
    var block = node.declarationBlock();
    if (!this.hasCompoundName(node.symbol)) {
      this.emit("var ");
    }
    if (this.options.optimize && !node.symbol.isImportOrExport()) {
      this.emit(this.indent.append(this.fullName(node.symbol)).append(" = {};\n"));
    } else {
      this.emit(this.indent.append(this.fullName(node.symbol)).append(" = {\n"));
      this.increaseIndent();
      for (var i = 0; i < block.children.length; i = i + 1 | 0) {
        var symbol = block.children.get(i).symbol;
        this.emit(this.indent.append(this.mangleName(symbol)).append(": ").append(symbol.enumValue.toString()).append(i === (block.children.length - 1 | 0) ? "\n" : ",\n"));
      }
      this.decreaseIndent();
      this.emit(this.indent.append("};\n"));
    }
    break;
  case 14:
  case 15:
    var block = node.functionBlock();
    if (block === null) {
      return;
    }
    var isCompoundName = this.hasCompoundName(node.symbol);
    if (!isCompoundName) {
      this.emit(this.indent.append("function ").append(this.fullName(node.symbol)));
    } else {
      this.emit(this.indent.append(this.fullName(node.symbol)).append(" = function"));
    }
    this.emitArgumentVariables(node.functionArguments().children);
    this.emit(" ");
    this.emit("{\n");
    this.increaseIndent();
    this.emitChildren(block);
    this.decreaseIndent();
    this.emit(this.indent.append(isCompoundName ? "};\n" : "}\n"));
    if (node.kind === 14) {
      var type = node.symbol.enclosingSymbol.type;
      if (type.isClass() && type.baseClass() !== null) {
        this.emit(this.indent.append("$extends(").append(this.fullName(type.symbol)).append(", ").append(this.fullName(type.baseClass().symbol)).append(");\n"));
      }
    }
    break;
  case 16:
    var value = node.variableValue();
    this.emit(node.symbol === null ? node.declarationName().asString() : this.fullName(node.symbol));
    if (value !== null) {
      this.emit(" = ");
      this.emitExpression(value, 1);
    }
    break;
  case 20:
    this.emit(this.indent);
    this.recursiveEmitIfStatement(node);
    this.emit("\n");
    break;
  case 21:
    var setup = node.forSetup();
    var test = node.forTest();
    var update = node.forUpdate();
    this.emit(this.indent.append("for ("));
    if (setup !== null) {
      if (setup.kind === 6) {
        this.emit("var ");
        this.emitCommaSeparatedNodes(setup.clusterVariables());
      } else {
        this.emitExpression(setup, 0);
      }
    }
    if (test !== null) {
      this.emit("; ");
      this.emitExpression(test, 0);
    } else {
      this.emit(";");
    }
    if (update !== null) {
      this.emit("; ");
      this.emitExpression(update, 0);
    } else {
      this.emit(";");
    }
    this.emit(") ");
    this.emitNode(node.forBlock());
    this.emit("\n");
    break;
  case 22:
    break;
  case 23:
    this.emit(this.indent.append("while ("));
    this.emitExpression(node.whileTest(), 0);
    this.emit(") ");
    this.emitNode(node.whileBlock());
    this.emit("\n");
    break;
  case 24:
    this.emit(this.indent.append("do "));
    this.emitNode(node.whileBlock());
    this.emit(" while (");
    this.emitExpression(node.whileTest(), 0);
    this.emit(");\n");
    break;
  case 25:
  case 26:
    var value = node.returnValue();
    this.emit(this.indent);
    if (value !== null) {
      this.emit("return ");
      this.emitExpression(value, 0);
      this.emit(";\n");
    } else {
      this.emit("return;\n");
    }
    break;
  case 27:
    this.emit(this.indent.append("break;\n"));
    break;
  case 28:
    this.emit(this.indent.append("continue;\n"));
    break;
  case 29:
    var value = node.assertValue();
    value.invertBooleanCondition(this.cache);
    if (value.kind !== 40 && !this.options.optimize) {
      var couldBeFalse = value.kind !== 39;
      if (couldBeFalse) {
        this.emit(this.indent.append("if ("));
        this.emitExpression(value, 0);
        this.emit(") {\n");
        this.increaseIndent();
      }
      var text = node.range.toString().append(" (").append(node.range.locationString()).append(")");
      this.emit(this.indent.append("throw new Error(").append(quoteString(text, 34)).append(");\n"));
      if (couldBeFalse) {
        this.decreaseIndent();
        this.emit(this.indent.append("}\n"));
      }
    }
    break;
  case 30:
    this.emit(this.indent);
    this.isStartOfExpression = true;
    this.emitExpression(node.expressionValue(), 0);
    this.emit(";\n");
    break;
  case 31:
    this.emit(this.indent.append("switch ("));
    this.emitExpression(node.switchValue(), 0);
    this.emit(") {\n");
    this.emitNodes(node.switchCases());
    this.emit(this.indent.append("}\n"));
    break;
  case 32:
    this.emitNodes(node.modifierStatements());
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
js.Emitter.prototype.emitExpression = function(node, precedence) {
  var wasStartOfExpression = this.isStartOfExpression;
  this.isStartOfExpression = false;
  this.addMapping(node);
  switch (node.kind) {
  case 34:
    this.emit(node.symbol === null ? node.asString() : this.fullName(node.symbol));
    break;
  case 35:
    this.emit(this.fullName(node.type.symbol));
    break;
  case 36:
    this.emit("this");
    break;
  case 37:
    if (2 < precedence) {
      this.emit("(");
    }
    this.emitExpression(node.hookTest(), 3);
    this.emit(" ? ");
    this.emitExpression(node.hookTrue(), 2);
    this.emit(" : ");
    this.emitExpression(node.hookFalse(), 2);
    if (2 < precedence) {
      this.emit(")");
    }
    break;
  case 38:
    this.emit("null");
    break;
  case 39:
    this.emit("true");
    break;
  case 40:
    this.emit("false");
    break;
  case 41:
    this.emit(node.asInt().toString());
    if (node.parent.kind === 46) {
      this.emit(".");
    }
    break;
  case 42:
  case 43:
    var text = node.asDouble().toString();
    this.emit(text);
    if (node.parent.kind === 46 && text.indexOf(".") < 0) {
      this.emit(".");
    }
    break;
  case 44:
    this.emit(quoteString(node.asString(), 34));
    break;
  case 45:
    this.emit("[");
    this.emitCommaSeparatedExpressions(node.initializerValues());
    this.emit("]");
    break;
  case 46:
    this.emitExpression(node.dotTarget(), 15);
    this.emit(".");
    var name = node.dotName();
    this.emit(name.symbol === null ? name.asString() : SymbolKind.isInstance(name.symbol.kind) ? this.mangleName(name.symbol) : this.fullName(name.symbol));
    break;
  case 48:
    var value = node.callValue();
    if (NodeKind.isType(value.kind)) {
      this.emit("new ");
    }
    this.isStartOfExpression = wasStartOfExpression;
    this.emitExpression(value, 14);
    this.emit("(");
    this.emitCommaSeparatedExpressions(node.callArguments());
    this.emit(")");
    break;
  case 49:
    var $arguments = node.superCallArguments();
    this.emit(this.fullName(node.symbol));
    this.emit(".call(this");
    for (var i = 0; i < $arguments.length; i = i + 1 | 0) {
      this.emit(", ");
      this.emitExpression($arguments.get(i), 1);
    }
    this.emit(")");
    break;
  case 51:
    this.emitExpression(node.bindValue(), precedence);
    break;
  case 52:
    if (1 <= precedence) {
      this.emit("(");
    }
    this.isStartOfExpression = wasStartOfExpression;
    this.emitCommaSeparatedExpressions(node.children);
    if (1 <= precedence) {
      this.emit(")");
    }
    break;
  case 54:
  case 55:
    this.isStartOfExpression = wasStartOfExpression;
    this.emitExpression(node.castValue(), precedence);
    break;
  case 56:
    if (wasStartOfExpression) {
      this.emit("(");
    }
    this.emit("function");
    this.emitArgumentVariables(node.lambdaArguments());
    this.emit(" ");
    this.emitNode(node.lambdaBlock());
    if (wasStartOfExpression) {
      this.emit(")");
    }
    break;
  case 57:
    if (node.type.isNumeric(this.cache)) {
      this.emit("0");
    } else if (node.type.isBool(this.cache)) {
      this.emit("false");
    } else if (node.type.isReference()) {
      this.emit("null");
    } else {
    }
    break;
  case 60:
  case 61:
  case 62:
  case 63:
  case 64:
  case 65:
  case 66:
  case 67:
    var value = node.unaryValue();
    var info = operatorInfo.get(node.kind);
    if (info.precedence < precedence) {
      this.emit("(");
    }
    var isPostfix = info.precedence === 14;
    if (!isPostfix) {
      this.emit(info.text);
      if (node.kind === 61 && (value.kind === 61 || value.kind === 64) || node.kind === 62 && (value.kind === 62 || value.kind === 65 || value.kind === 41 && value.asInt() < 0)) {
        this.emit(" ");
      }
    }
    this.emitExpression(value, info.precedence);
    if (isPostfix) {
      this.emit(info.text);
    }
    if (info.precedence < precedence) {
      this.emit(")");
    }
    break;
  case 68:
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
  case 69:
  case 70:
  case 71:
  case 72:
  case 73:
  case 74:
  case 75:
  case 76:
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
    var info = operatorInfo.get(node.kind);
    if (info.precedence < precedence) {
      this.emit("(");
    }
    this.emitExpression(node.binaryLeft(), info.precedence + (info.associativity === 2 | 0) | 0);
    this.emit(node.kind === 73 ? " === " : node.kind === 83 ? " !== " : " ".append(info.text).append(" "));
    this.emitExpression(node.binaryRight(), info.precedence + (info.associativity === 1 | 0) | 0);
    if (info.precedence < precedence) {
      this.emit(")");
    }
    break;
  case 77:
    this.emitExpression(node.binaryLeft(), 15);
    this.emit("[");
    this.emitExpression(node.binaryRight(), 0);
    this.emit("]");
    break;
  case 99:
    break;
  default:
    break;
  }
};
js.Emitter.alwaysConvertsOperandsToInt = function(kind) {
  switch (kind) {
  case 70:
  case 69:
  case 71:
  case 85:
  case 86:
  case 91:
  case 90:
  case 92:
  case 96:
  case 97:
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
js.Emitter.prototype.patchNode = function(node, context) {
  switch (node.kind) {
  case 10:
    if (!node.symbol.isImport() && node.symbol.type.baseClass() !== null) {
      this.needExtends = true;
    }
    break;
  case 14:
    var superInitializer = node.superInitializer();
    var memberInitializers = node.memberInitializers();
    var block = node.functionBlock();
    var index = 0;
    if (superInitializer !== null) {
      block.insertChild((index = index + 1 | 0) - 1 | 0, Node.createExpression(superInitializer.remove()));
    }
    if (memberInitializers !== null) {
      for (var i = 0; i < memberInitializers.children.length; i = i + 1 | 0) {
        var child = memberInitializers.children.get(i);
        block.insertChild((index = index + 1 | 0) - 1 | 0, Node.createExpression(Node.createBinary(88, child.memberInitializerName().remove(), child.memberInitializerValue().remove())));
      }
    }
    context.setFunction(node);
    break;
  case 15:
    context.setFunction(node);
    break;
  case 51:
    if (node.symbol.kind === 16) {
      var $function = node.bindValue();
      var target;
      var name;
      if ($function.kind === 46) {
        target = $function.dotTarget().remove();
        name = $function.dotName().remove();
      } else {
        target = Node.createThis();
        name = $function.remove();
      }
      if (js.Emitter.isSimpleNameAccess(target)) {
        node.become(Node.createCall(Node.createDot(Node.createDot(target.clone(), name), Node.createName("bind")), [target]).withRange(node.range));
      } else {
        var temporaryName = Node.createName("$temp");
        node.become(Node.createLet(Node.createVariable(temporaryName.clone(), null, target), Node.createCall(Node.createDot(Node.createDot(temporaryName.clone(), name), Node.createName("bind")), [temporaryName])).withRange(node.range));
      }
    }
    break;
  case 36:
    if (context.lambdaCount > 0) {
      node.become(context.thisAlias());
    }
    break;
  case 34:
    if (node.symbol !== null && SymbolKind.isInstance(node.symbol.kind) && (node.parent.kind !== 46 || node !== node.parent.dotName())) {
      node.become(Node.createDot(Node.createThis(), node.clone()));
    }
    break;
  case 54:
    var value = node.castValue();
    if (node.type.isBool(this.cache) && !value.type.isBool(this.cache)) {
      node.become(Node.createUnary(60, value.remove()).withRange(node.range).withType(node.type));
    } else if (node.type.isInt(this.cache) && !value.type.isInteger(this.cache) && !js.Emitter.alwaysConvertsOperandsToInt(node.parent.kind)) {
      node.become(Node.createBinary(70, value.remove(), Node.createInt(0)).withRange(node.range).withType(node.type));
    } else if (node.type.isReal(this.cache) && !value.type.isNumeric(this.cache)) {
      node.become(Node.createUnary(61, value.remove()).withRange(node.range).withType(node.type));
    }
    break;
  case 64:
  case 65:
  case 67:
  case 66:
    if (node.type.isInt(this.cache)) {
      var isPostfix = node.kind === 66 || node.kind === 67;
      var isIncrement = node.kind === 64 || node.kind === 66;
      var result = this.createBinaryIntAssignment(context, isIncrement ? 68 : 87, node.unaryValue().remove(), Node.createInt(1));
      if (isPostfix && js.Emitter.isExpressionUsed(node)) {
        result = this.createBinaryInt(isIncrement ? 87 : 68, result, Node.createInt(1));
      }
      node.become(result.withRange(node.range).withType(node.type));
    }
    break;
  case 68:
  case 87:
  case 82:
  case 72:
  case 84:
    if (node.type.isInt(this.cache) && (node.kind === 82 || !js.Emitter.alwaysConvertsOperandsToInt(node.parent.kind))) {
      node.become(this.createBinaryInt(node.kind, node.binaryLeft().remove(), node.binaryRight().remove()).withRange(node.range));
    }
    break;
  case 89:
  case 98:
  case 94:
  case 93:
  case 95:
    if (node.type.isInt(this.cache)) {
      var isPostfix = node.kind === 66 || node.kind === 67;
      var isIncrement = node.kind === 64 || node.kind === 66;
      var left = node.binaryLeft();
      var right = node.binaryRight();
      var kind = node.kind === 89 ? 68 : node.kind === 98 ? 87 : node.kind === 94 ? 82 : node.kind === 93 ? 72 : 84;
      node.become(this.createBinaryIntAssignment(context, kind, left.remove(), right.remove()).withRange(node.range));
    }
    break;
  case 56:
    context.lambdaCount = context.lambdaCount + 1 | 0;
    break;
  }
  if (node.kind === 47) {
    var value = node.letValue();
    var variable = node.letVariable();
    node.become(Node.createCall(Node.createLambda([variable.remove()], Node.createBlock([Node.createReturn(value.remove())])), [variable.variableValue().remove()]));
  }
  if (node.hasChildren()) {
    for (var i = 0; i < node.children.length; i = i + 1 | 0) {
      var child = node.children.get(i);
      if (child !== null) {
        this.patchNode(child, context);
      }
    }
  }
  switch (node.kind) {
  case 56:
    context.lambdaCount = context.lambdaCount - 1 | 0;
    break;
  case 14:
  case 15:
    context.setFunction(null);
    break;
  }
};
js.Emitter.prototype.createBinaryInt = function(kind, left, right) {
  if (kind === 82) {
    this.needMathImul = true;
    return Node.createCall(Node.createName("$imul"), [left, right]).withType(this.cache.intType);
  }
  return Node.createBinary(70, Node.createBinary(kind, left, right).withType(this.cache.intType), Node.createInt(0).withType(this.cache.intType)).withType(this.cache.intType);
};
js.Emitter.isSimpleNameAccess = function(node) {
  return node.kind === 34 || node.kind === 36 || node.kind === 46 && js.Emitter.isSimpleNameAccess(node.dotTarget());
};
js.Emitter.prototype.createBinaryIntAssignment = function(context, kind, left, right) {
  if (js.Emitter.isSimpleNameAccess(left)) {
    return Node.createBinary(88, left.clone(), this.createBinaryInt(kind, left, right));
  }
  var target = left.dotTarget().remove();
  var temporaryName = Node.createName("$temp");
  var dot = Node.createDot(temporaryName, left.dotName().remove());
  return Node.createLet(Node.createVariable(temporaryName.clone(), null, target), Node.createBinary(88, dot, this.createBinaryInt(kind, dot.clone(), right)).withType(this.cache.intType)).withType(this.cache.intType);
};
js.Emitter.prototype.hasCompoundName = function(symbol) {
  var enclosingSymbol = symbol.enclosingSymbol;
  return enclosingSymbol !== null && !SymbolKind.isGlobalNamespace(enclosingSymbol.kind) && (!SymbolKind.isConstructor(symbol.kind) || this.hasCompoundName(enclosingSymbol));
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
js.Emitter.prototype.mangleName = function(symbol) {
  if (symbol.isImportOrExport()) {
    return symbol.name;
  }
  if (SymbolKind.isConstructor(symbol.kind)) {
    return this.mangleName(symbol.enclosingSymbol);
  }
  if (js.Emitter.isKeyword.has(symbol.name)) {
    return "$".append(symbol.name);
  }
  return symbol.name;
};
js.Emitter.prototype.fullName = function(symbol) {
  var enclosingSymbol = symbol.enclosingSymbol;
  if (enclosingSymbol !== null && !SymbolKind.isGlobalNamespace(enclosingSymbol.kind)) {
    var enclosingName = this.fullName(enclosingSymbol);
    if (SymbolKind.isConstructor(symbol.kind)) {
      return enclosingName;
    }
    if (SymbolKind.isInstance(symbol.kind)) {
      enclosingName = enclosingName.append(".prototype");
    }
    return enclosingName.append(".").append(this.mangleName(symbol));
  }
  return this.mangleName(symbol);
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
SourceMapGenerator.prototype.addMapping = function(source, originalLine, originalColumn, generatedLine, generatedColumn) {
  var sourceIndex = this.sources.indexOf(source);
  if (sourceIndex === -1) {
    sourceIndex = this.sources.length;
    this.sources.push(source);
  }
  this.mappings.push(new SourceMapping(sourceIndex, originalLine, originalColumn, generatedLine, generatedColumn));
};
SourceMapGenerator.prototype.toString = function() {
  var sourceNames = [];
  var sourceContents = [];
  for (var i = 0; i < this.sources.length; i = i + 1 | 0) {
    var source = this.sources.get(i);
    sourceNames.push(quoteString(source.name, 34));
    sourceContents.push(quoteString(source.contents, 34));
  }
  var result = new StringBuilder();
  result.append("{\"version\":3,\"sources\":[").append(",".join(sourceNames)).append("],\"sourcesContent\":[").append(",".join(sourceContents)).append("],\"names\":[],\"mappings\":\"");
  this.compile(result);
  return result.append("\"}\n").toString();
};
SourceMapGenerator.prototype.compile = function(result) {
  this.mappings.sort(function(left, right) {
    var result = left.generatedLine - right.generatedLine | 0;
    return result !== 0 ? result : left.generatedColumn - right.generatedColumn | 0;
  });
  var previousGeneratedColumn = 0;
  var previousGeneratedLine = 0;
  var previousOriginalColumn = 0;
  var previousOriginalLine = 0;
  var previousSourceIndex = 0;
  for (var i = 0; i < this.mappings.length; i = i + 1 | 0) {
    var mapping = this.mappings.get(i);
    var generatedLine = mapping.generatedLine;
    if (previousGeneratedLine === generatedLine) {
      if (previousGeneratedColumn === mapping.generatedColumn && (previousGeneratedLine > 0 || previousGeneratedColumn > 0)) {
        continue;
      }
      result.append(",");
    } else {
      previousGeneratedColumn = 0;
      while (previousGeneratedLine < generatedLine) {
        result.append(";");
        previousGeneratedLine = previousGeneratedLine + 1 | 0;
      }
    }
    result.append(SourceMapGenerator.encodeVLQ(mapping.generatedColumn - previousGeneratedColumn | 0));
    previousGeneratedColumn = mapping.generatedColumn;
    result.append(SourceMapGenerator.encodeVLQ(mapping.sourceIndex - previousSourceIndex | 0));
    previousSourceIndex = mapping.sourceIndex;
    result.append(SourceMapGenerator.encodeVLQ(mapping.originalLine - previousOriginalLine | 0));
    previousOriginalLine = mapping.originalLine;
    result.append(SourceMapGenerator.encodeVLQ(mapping.originalColumn - previousOriginalColumn | 0));
    previousOriginalColumn = mapping.originalColumn;
  }
};
SourceMapGenerator.encodeVLQ = function(value) {
  var vlq = value < 0 ? -value << 1 | 1 : value << 1;
  var encoded = "";
  do {
    var digit = vlq & 31;
    vlq = vlq >> 5;
    if (vlq > 0) {
      digit = digit | 32;
    }
    encoded = encoded.append(BASE64.get(digit));
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
    return "USING";
  case 93:
    return "VAR";
  case 94:
    return "VIRTUAL";
  case 95:
    return "WHILE";
  case 96:
    return "WHITESPACE";
  case 97:
    return "YY_INVALID_ACTION";
  case 98:
    return "START_PARAMETER_LIST";
  case 99:
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
ParserContext.prototype.current = function() {
  return this.tokens.get(this.index);
};
ParserContext.prototype.next = function() {
  var token = this.current();
  if ((this.index + 1 | 0) < this.tokens.length) {
    this.index = this.index + 1 | 0;
  }
  return token;
};
ParserContext.prototype.spanSince = function(range) {
  var previous = this.tokens.get(this.index > 0 ? this.index - 1 | 0 : 0);
  return previous.range.end < range.start ? range : Range.span(range, previous.range);
};
ParserContext.prototype.peek = function(kind) {
  return this.current().kind === kind;
};
ParserContext.prototype.eat = function(kind) {
  if (this.peek(kind)) {
    this.next();
    return true;
  }
  return false;
};
ParserContext.prototype.expect = function(kind) {
  if (!this.eat(kind)) {
    var token = this.current();
    if (this.previousSyntaxError !== token) {
      syntaxErrorExpectedToken(this.log, token, kind);
      this.previousSyntaxError = token;
    }
    return false;
  }
  return true;
};
ParserContext.prototype.unexpectedToken = function() {
  var token = this.current();
  if (this.previousSyntaxError !== token) {
    syntaxErrorUnexpectedToken(this.log, token);
    this.previousSyntaxError = token;
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
Pratt.prototype.parselet = function(kind, precedence) {
  var parselet = this.table.getOrDefault(kind, null);
  if (parselet === null) {
    var created = new Parselet(precedence);
    parselet = created;
    this.table.set(kind, created);
  } else if (precedence > parselet.precedence) {
    parselet.precedence = precedence;
  }
  return parselet;
};
Pratt.prototype.parse = function(context, precedence) {
  return this.parseIgnoringParselet(context, precedence, null);
};
Pratt.prototype.resume = function(context, precedence, left) {
  return this.resumeIgnoringParselet(context, precedence, left, null);
};
Pratt.prototype.parseIgnoringParselet = function(context, precedence, parseletToIgnore) {
  var token = context.current();
  var parselet = this.table.getOrDefault(token.kind, null);
  if (parselet === null || parselet === parseletToIgnore || parselet.prefix === null) {
    context.unexpectedToken();
    return Node.createError().withRange(context.spanSince(token.range));
  }
  var node = this.resumeIgnoringParselet(context, precedence, parselet.prefix(context), parseletToIgnore);
  return node;
};
Pratt.prototype.resumeIgnoringParselet = function(context, precedence, left, parseletToIgnore) {
  while (!NodeKind.isError(left.kind)) {
    var kind = context.current().kind;
    var parselet = this.table.getOrDefault(kind, null);
    if (parselet === null || parselet === parseletToIgnore || parselet.infix === null || parselet.precedence <= precedence) {
      break;
    }
    left = parselet.infix(context, left);
  }
  return left;
};
Pratt.prototype.literal = function(kind, callback) {
  this.parselet(kind, 0).prefix = function(context) {
    return callback(context, context.next());
  };
};
Pratt.prototype.prefix = function(kind, precedence, callback) {
  this.parselet(kind, 0).prefix = function(context) {
    var token = context.next();
    var value = pratt.parse(context, precedence);
    return value !== null ? callback(context, token, value) : null;
  };
};
Pratt.prototype.postfix = function(kind, precedence, callback) {
  this.parselet(kind, precedence).infix = function(context, left) {
    return callback(context, left, context.next());
  };
};
Pratt.prototype.infix = function(kind, precedence, callback) {
  this.parselet(kind, precedence).infix = function(context, left) {
    var token = context.next();
    var right = pratt.parse(context, precedence);
    return right !== null ? callback(context, left, token, right) : null;
  };
};
Pratt.prototype.infixRight = function(kind, precedence, callback) {
  this.parselet(kind, precedence).infix = function(context, left) {
    var token = context.next();
    var right = pratt.parse(context, precedence - 1 | 0);
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
  this.visit(program);
}
CallGraph.prototype.visit = function(node) {
  if (node.kind === 48) {
    var value = node.callValue();
    if (value.symbol !== null && SymbolKind.isFunction(value.symbol.kind)) {
      this.recordCallSite(value.symbol, node);
    }
  } else if (node.kind === 51) {
    this.recordCallSite(node.symbol, node);
  } else if (node.kind === 15) {
    this.recordCallSite(node.symbol, null);
  }
  if (node.hasChildren()) {
    for (var i = 0; i < node.children.length; i = i + 1 | 0) {
      var child = node.children.get(i);
      if (child !== null) {
        this.visit(child);
      }
    }
  }
};
CallGraph.prototype.recordCallSite = function(symbol, node) {
  var index = this.symbolToInfoIndex.getOrDefault(symbol.uniqueID, -1);
  var info = index < 0 ? new CallInfo(symbol) : this.callInfo.get(index);
  if (index < 0) {
    this.symbolToInfoIndex.set(symbol.uniqueID, this.callInfo.length);
    this.callInfo.push(info);
  }
  if (node !== null) {
    info.callSites.push(node);
  }
};
function ConstantFolder(_0) {
  this.cache = _0;
}
ConstantFolder.prototype.flattenBool = function(node, value) {
  node.removeChildren();
  node.kind = value ? 39 : 40;
  node.content = null;
};
ConstantFolder.prototype.flattenInt = function(node, value) {
  node.removeChildren();
  node.kind = 41;
  node.content = new IntContent(value);
};
ConstantFolder.prototype.flattenReal = function(node, value) {
  node.removeChildren();
  node.kind = node.type === this.cache.floatType ? 42 : 43;
  node.content = new DoubleContent(value);
};
ConstantFolder.prototype.foldConstants = function(node) {
  var kind = node.kind;
  if (node.hasChildren()) {
    for (var i = 0; i < node.children.length; i = i + 1 | 0) {
      var child = node.children.get(i);
      if (child !== null) {
        this.foldConstants(child);
      }
    }
  }
  if (kind === 34) {
    if (node.symbol !== null && node.symbol.isEnumValue()) {
      this.flattenInt(node, node.symbol.enumValue);
    }
  } else if (NodeKind.isCast(kind)) {
    var type = node.castType().type;
    var value = node.castValue();
    var valueKind = value.kind;
    if (NodeKind.isBool(valueKind)) {
      if (type.isBool(this.cache)) {
        this.flattenBool(node, value.asBool());
      } else if (type.isInteger(this.cache)) {
        this.flattenInt(node, value.asBool() | 0);
      } else if (type.isReal(this.cache)) {
        this.flattenReal(node, +value.asBool());
      }
    } else if (valueKind === 41) {
      if (type.isBool(this.cache)) {
        this.flattenBool(node, !value.asInt());
      } else if (type.isInteger(this.cache)) {
        this.flattenInt(node, value.asInt());
      } else if (type.isReal(this.cache)) {
        this.flattenReal(node, value.asInt());
      }
    } else if (NodeKind.isReal(valueKind)) {
      if (type.isBool(this.cache)) {
        this.flattenBool(node, !value.asDouble());
      } else if (type.isInteger(this.cache)) {
        this.flattenInt(node, value.asDouble() | 0);
      } else if (type.isReal(this.cache)) {
        this.flattenReal(node, value.asDouble());
      }
    }
  } else if (NodeKind.isUnaryOperator(kind)) {
    var value = node.unaryValue();
    var valueKind = value.kind;
    if (NodeKind.isBool(valueKind)) {
      if (kind === 60) {
        this.flattenBool(node, !value.asBool());
      }
    } else if (valueKind === 41) {
      if (kind === 61) {
        this.flattenInt(node, +value.asInt());
      } else if (kind === 62) {
        this.flattenInt(node, -value.asInt());
      } else if (kind === 63) {
        this.flattenInt(node, ~value.asInt());
      }
    } else if (NodeKind.isReal(valueKind)) {
      if (kind === 61) {
        this.flattenReal(node, +value.asDouble());
      } else if (kind === 62) {
        this.flattenReal(node, -value.asDouble());
      }
    }
  } else if (NodeKind.isBinaryOperator(kind)) {
    var left = node.binaryLeft();
    var right = node.binaryRight();
    var valueKind = left.kind;
    if (valueKind !== right.kind && (!NodeKind.isBool(left.kind) || !NodeKind.isBool(right.kind))) {
      return;
    }
    if (NodeKind.isBool(valueKind)) {
      switch (kind) {
      case 80:
        this.flattenBool(node, left.asBool() && right.asBool());
        break;
      case 81:
        this.flattenBool(node, left.asBool() || right.asBool());
        break;
      case 73:
        this.flattenBool(node, left.asBool() === right.asBool());
        break;
      case 83:
        this.flattenBool(node, left.asBool() !== right.asBool());
        break;
      }
    } else if (valueKind === 41) {
      switch (kind) {
      case 68:
        this.flattenInt(node, left.asInt() + right.asInt() | 0);
        break;
      case 87:
        this.flattenInt(node, left.asInt() - right.asInt() | 0);
        break;
      case 82:
        this.flattenInt(node, $imul(left.asInt(), right.asInt()));
        break;
      case 72:
        this.flattenInt(node, left.asInt() / right.asInt() | 0);
        break;
      case 84:
        this.flattenInt(node, left.asInt() % right.asInt() | 0);
        break;
      case 85:
        this.flattenInt(node, left.asInt() << right.asInt());
        break;
      case 86:
        this.flattenInt(node, left.asInt() >> right.asInt());
        break;
      case 69:
        this.flattenInt(node, left.asInt() & right.asInt());
        break;
      case 70:
        this.flattenInt(node, left.asInt() | right.asInt());
        break;
      case 71:
        this.flattenInt(node, left.asInt() ^ right.asInt());
        break;
      case 73:
        this.flattenBool(node, left.asInt() === right.asInt());
        break;
      case 83:
        this.flattenBool(node, left.asInt() !== right.asInt());
        break;
      case 78:
        this.flattenBool(node, left.asInt() < right.asInt());
        break;
      case 74:
        this.flattenBool(node, left.asInt() > right.asInt());
        break;
      case 79:
        this.flattenBool(node, left.asInt() <= right.asInt());
        break;
      case 75:
        this.flattenBool(node, left.asInt() >= right.asInt());
        break;
      }
    } else if (NodeKind.isReal(valueKind)) {
      switch (kind) {
      case 68:
        this.flattenReal(node, left.asDouble() + right.asDouble());
        break;
      case 87:
        this.flattenReal(node, left.asDouble() - right.asDouble());
        break;
      case 82:
        this.flattenReal(node, left.asDouble() * right.asDouble());
        break;
      case 72:
        this.flattenReal(node, left.asDouble() / right.asDouble());
        break;
      case 73:
        this.flattenBool(node, left.asDouble() === right.asDouble());
        break;
      case 83:
        this.flattenBool(node, left.asDouble() !== right.asDouble());
        break;
      case 78:
        this.flattenBool(node, left.asDouble() < right.asDouble());
        break;
      case 74:
        this.flattenBool(node, left.asDouble() > right.asDouble());
        break;
      case 79:
        this.flattenBool(node, left.asDouble() <= right.asDouble());
        break;
      case 75:
        this.flattenBool(node, left.asDouble() >= right.asDouble());
        break;
      }
    }
  }
};
function InstanceToStaticPass() {
}
InstanceToStaticPass.run = function(program) {
  var graph = new CallGraph(program);
  for (var i = 0; i < graph.callInfo.length; i = i + 1 | 0) {
    var info = graph.callInfo.get(i);
    var symbol = info.symbol;
    var enclosingSymbol = symbol.enclosingSymbol;
    if (symbol.kind === 16 && !symbol.isImportOrExport() && symbol.node.functionBlock() !== null && (enclosingSymbol.isImport() || SymbolKind.isEnum(enclosingSymbol.kind))) {
      symbol.kind = 15;
      symbol.flags = symbol.flags | 64;
      var thisSymbol = new Symbol("this", 18);
      thisSymbol.type = enclosingSymbol.type;
      symbol.node.functionArguments().insertChild(0, Node.createVariable(Node.createName("this").withSymbol(thisSymbol), Node.createType(thisSymbol.type), null).withSymbol(thisSymbol));
      InstanceToStaticPass.recursivelyReplaceThis(symbol.node.functionBlock(), thisSymbol);
      for (var j = 0; j < info.callSites.length; j = j + 1 | 0) {
        var callSite = info.callSites.get(j);
        switch (callSite.kind) {
        case 48:
          var value = callSite.callValue();
          var target;
          var name;
          if (value.kind === 46) {
            target = value.dotTarget().remove();
            name = value.dotName().remove();
          } else {
            target = Node.createThis();
            name = value.remove();
          }
          callSite.replaceChild(0, name);
          callSite.insertChild(1, target);
          break;
        case 51:
          break;
        default:
          break;
        }
      }
    }
  }
};
InstanceToStaticPass.recursivelyReplaceThis = function(node, symbol) {
  if (node.kind === 36) {
    node.become(Node.createName(symbol.name).withSymbol(symbol).withType(symbol.type));
  } else if (node.hasChildren()) {
    for (var i = 0; i < node.children.length; i = i + 1 | 0) {
      var child = node.children.get(i);
      if (child !== null) {
        InstanceToStaticPass.recursivelyReplaceThis(child, symbol);
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
      context.switchValue = node.switchValue();
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
Resolver.prototype.run = function(program) {
  var globalScope = new Scope(null);
  globalScope.insertGlobals(this.cache);
  this.constantFolder = new ConstantFolder(this.cache);
  this.prepareNode(program, globalScope);
  globalScope.linkGlobals(this.cache);
  this.resolve(program, null);
};
Resolver.prototype.prepareNode = function(node, scope) {
  this.parsedDeclarations = [];
  this.parsedBlocks = [];
  this.setupScopesAndSymbols(node, scope);
  this.accumulateSymbolFlags();
  this.setSymbolKindsAndMergeSiblings();
  this.processUsingStatements();
};
Resolver.prototype.setupScopesAndSymbols = function(node, scope) {
  if (node.kind === 0) {
    node.scope = scope;
  } else if (node.kind === 2) {
    if (!NodeKind.isNamedBlockDeclaration(node.parent.kind) && !NodeKind.isLoop(node.parent.kind)) {
      scope = new Scope(scope);
    }
    node.scope = scope;
    this.parsedBlocks.push(node);
    if (node.parent.kind === 1) {
      scope.type = this.cache.globalType;
    } else {
      var parentSymbol = node.parent.symbol;
      if (parentSymbol !== null && parentSymbol.type !== null) {
        scope.type = parentSymbol.type;
      }
    }
  }
  if (NodeKind.isNamedDeclaration(node.kind) && node.kind !== 19) {
    var declarationName = node.declarationName();
    if (declarationName !== null && node.symbol === null) {
      var name = declarationName.asString();
      var member = scope.findLocal(name);
      var symbol;
      if (member !== null) {
        symbol = member.symbol;
        symbol.node.appendToSiblingChain(node);
      } else {
        symbol = new Symbol(name, 0);
        symbol.node = node;
        if (scope.type !== null) {
          symbol.enclosingSymbol = scope.type.symbol;
        }
        if (node.kind === 17) {
          scope.insertLocal(symbol);
        } else {
          scope.insert(symbol);
        }
      }
      this.parsedDeclarations.push(node);
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
  if (node.hasChildren()) {
    for (var i = 0; i < node.children.length; i = i + 1 | 0) {
      var child = node.children.get(i);
      if (child !== null) {
        this.setupScopesAndSymbols(child, scope);
      }
    }
  }
};
Resolver.prototype.symbolFlagsForNode = function(node) {
  var flags = 0;
  var parent = node.parent;
  if (parent.kind === 6) {
    parent = parent.parent;
  }
  while (parent !== null && parent.kind === 32) {
    var modifierName = parent.modifierName();
    var name = modifierName.asString();
    var flag = nameToSymbolFlag.get(name);
    if ((flags & flag) !== 0) {
      semanticWarningDuplicateModifier(this.log, modifierName.range, name);
    }
    flags = flags | flag;
    parent = parent.parent;
  }
  if (parent !== null && parent.kind === 2 && parent.parent.kind === 13) {
    flags = flags | 16;
  }
  return flags;
};
Resolver.prototype.accumulateSymbolFlags = function() {
  for (var i = 0; i < this.parsedDeclarations.length; i = i + 1 | 0) {
    var node = this.parsedDeclarations.get(i);
    if (node.symbol.node !== node) {
      continue;
    }
    var declarationName = node.declarationName();
    var flags = this.symbolFlagsForNode(node);
    for (var sibling = node.sibling; sibling !== null; sibling = sibling.sibling) {
      var siblingFlags = this.symbolFlagsForNode(sibling);
      if ((flags & 4071) !== (siblingFlags & 4071)) {
        semanticErrorDifferentModifiers(this.log, sibling.declarationName().range, declarationName.asString(), declarationName.range);
        siblingFlags = siblingFlags | 32768;
      }
      flags = flags | siblingFlags;
    }
    node.symbol.flags = node.symbol.flags | flags;
  }
};
Resolver.checkParentsForLocalVariable = function(node) {
  for (node = node.parent; node !== null; node = node.parent) {
    if (node.kind !== 0 && node.kind !== 1 && node.kind !== 2 && node.kind !== 7 && node.kind !== 32 && node.kind !== 13 && !NodeKind.isEnum(node.kind)) {
      return true;
    }
  }
  return false;
};
Resolver.prototype.setSymbolKindsAndMergeSiblings = function() {
  for (var i = 0; i < this.parsedDeclarations.length; i = i + 1 | 0) {
    var node = this.parsedDeclarations.get(i);
    var symbol = node.symbol;
    if (symbol.node !== node) {
      continue;
    }
    var declarationName = node.declarationName();
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
      var siblingName = sibling.declarationName();
      semanticErrorDuplicateSymbol(this.log, siblingName.range, siblingName.asString(), declarationName.range);
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
      semanticErrorExtensionMissingTarget(this.log, declarationName.range, declarationName.asString());
      break;
    default:
      break;
    }
  }
  for (var i = 0; i < this.parsedDeclarations.length; i = i + 1 | 0) {
    var node = this.parsedDeclarations.get(i);
    var symbol = node.symbol;
    if (!symbol.isStatic() && (symbol.isObjectMember() || symbol.isEnumMember() && symbol.isFromExtension())) {
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
Resolver.prototype.processUsingStatements = function() {
  for (var i = 0; i < this.parsedBlocks.length; i = i + 1 | 0) {
    var block = this.parsedBlocks.get(i);
    if (!block.hasChildren()) {
      continue;
    }
    for (var j = 0; j < block.children.length; j = j + 1 | 0) {
      var statement = block.children.get(j);
      if (statement.kind !== 19) {
        continue;
      }
      var declarationName = statement.declarationName();
      var name = declarationName.asString();
      var member = block.scope.findLocal(name);
      if (member !== null) {
        var otherName = member.symbol.node.declarationName();
        if (otherName !== null) {
          semanticErrorDuplicateSymbol(this.log, declarationName.range, name, otherName.range);
        }
        continue;
      }
      var symbol = new Symbol(name, 7);
      symbol.node = statement;
      statement.symbol = symbol;
      block.scope.insertLocal(symbol);
    }
    var insertedSymbols = null;
    for (var j = 0; j < block.children.length; j = j + 1 | 0) {
      var statement = block.children.get(j);
      if (statement.kind !== 33) {
        continue;
      }
      var value = statement.usingNamespaceValue();
      this.resolveGlobalUsingNamespaceValue(value);
      if (value.type.isError(this.cache)) {
        continue;
      }
      var symbol = value.type.symbol;
      if (symbol === null) {
        continue;
      }
      if (!SymbolKind.isNamespace(symbol.kind)) {
        semanticErrorBadUsingNamespace(this.log, value.range);
        continue;
      }
      if (insertedSymbols === null) {
        insertedSymbols = [];
      }
      var members = symbol.type.members.values();
      for (var k = 0; k < members.length; k = k + 1 | 0) {
        var member = members.get(k);
        var memberSymbol = member.symbol;
        if (memberSymbol.kind === 9) {
          continue;
        }
        var current = block.scope.findLocal(memberSymbol.name);
        if (current === null) {
          insertedSymbols.push(memberSymbol);
          block.scope.insertLocal(memberSymbol);
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
Resolver.prototype.resolveGlobalUsingNamespaceValue = function(node) {
  node.type = this.cache.errorType;
  var member;
  if (node.kind === 34) {
    var name = node.asString();
    member = this.cache.globalType.findMember(name);
    if (member === null) {
      semanticErrorUndeclaredSymbol(this.log, node.range, name);
      return;
    }
  } else if (node.kind === 46) {
    var target = node.dotTarget();
    this.resolveGlobalUsingNamespaceValue(target);
    var targetType = target.type;
    var dotName = node.dotName();
    if (targetType === null || dotName === null) {
      return;
    }
    var name = dotName.asString();
    member = targetType.findMember(name);
    if (member === null) {
      semanticErrorUnknownMemberSymbol(this.log, dotName.range, name, targetType);
      return;
    }
  } else {
    semanticErrorUnexpectedNode(this.log, node.range, node.kind);
    return;
  }
  if (!SymbolKind.isType(member.symbol.kind)) {
    semanticErrorBadUsingValue(this.log, node.range);
    return;
  }
  node.become(Node.createType(member.symbol.type).withRange(node.range).withSymbol(member.symbol));
};
Resolver.prototype.resolve = function(node, expectedType) {
  if (node.type !== null) {
    return;
  }
  node.type = this.cache.errorType;
  var oldScope = this.context.scope;
  if (node.scope !== null) {
    this.context.scope = node.scope;
  }
  var oldType = this.typeContext;
  this.typeContext = expectedType;
  switch (node.kind) {
  case 0:
    this.resolveProgram(node);
    break;
  case 1:
    this.resolveFile(node);
    break;
  case 2:
    this.resolveBlock(node);
    break;
  case 3:
    this.resolveChildren(node);
    break;
  case 4:
    this.resolveCase(node);
    break;
  case 33:
    this.resolveUsingNamespace(node);
    break;
  case 7:
    this.resolveNamespace(node);
    break;
  case 8:
  case 9:
    this.resolveEnum(node);
    break;
  case 10:
  case 11:
  case 12:
    this.resolveObject(node);
    break;
  case 13:
    this.resolveExtension(node);
    break;
  case 14:
  case 15:
    this.resolveFunction(node);
    break;
  case 16:
    this.resolveVariable(node);
    break;
  case 6:
    this.resolveVariableCluster(node);
    break;
  case 17:
    this.resolveParameter(node);
    break;
  case 18:
  case 19:
    this.resolveAlias(node);
    break;
  case 20:
    this.resolveIf(node);
    break;
  case 21:
    this.resolveFor(node);
    break;
  case 22:
    this.resolveForEach(node);
    break;
  case 23:
    this.resolveWhile(node);
    break;
  case 24:
    this.resolveWhile(node);
    break;
  case 25:
  case 26:
    this.resolveReturn(node);
    break;
  case 27:
    this.resolveBreak(node);
    break;
  case 28:
    this.resolveContinue(node);
    break;
  case 29:
    this.resolveAssert(node);
    break;
  case 30:
    this.resolveExpression(node);
    break;
  case 31:
    this.resolveSwitch(node);
    break;
  case 32:
    this.resolveModifier(node);
    break;
  case 34:
    this.resolveName(node);
    break;
  case 38:
    node.type = this.cache.nullType;
    break;
  case 36:
    this.resolveThis(node);
    break;
  case 39:
    node.type = this.cache.boolType;
    break;
  case 40:
    node.type = this.cache.boolType;
    break;
  case 37:
    this.resolveHook(node);
    break;
  case 41:
    this.resolveInt(node);
    break;
  case 42:
    node.type = this.cache.floatType;
    break;
  case 43:
    node.type = this.cache.doubleType;
    break;
  case 44:
    node.type = this.cache.stringType;
    break;
  case 45:
    this.resolveInitializer(node);
    break;
  case 46:
    this.resolveDot(node);
    break;
  case 47:
    this.resolveLet(node);
    break;
  case 48:
    this.resolveCall(node);
    break;
  case 49:
    this.resolveSuperCall(node);
    break;
  case 50:
    break;
  case 52:
    this.resolveSequence(node);
    break;
  case 53:
    this.resolveParameterize(node);
    break;
  case 54:
    this.resolveCast(node);
    break;
  case 56:
    this.resolveLambda(node);
    break;
  case 57:
    this.resolveDefault(node);
    break;
  case 58:
    this.resolveVar(node);
    break;
  case 59:
    this.resolveFunctionType(node);
    break;
  case 60:
  case 61:
  case 62:
  case 63:
  case 64:
  case 65:
  case 66:
  case 67:
    this.resolveUnaryOperator(node);
    break;
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
  case 97:
  case 98:
    this.resolveBinaryOperator(node);
    break;
  case 99:
    this.resolveTertiaryOperator(node);
    break;
  default:
    break;
  }
  this.context.scope = oldScope;
  this.typeContext = oldType;
};
Resolver.prototype.checkIsParameterized = function(node) {
  if (!node.type.isError(this.cache) && node.type.hasParameters() && !node.type.isParameterized()) {
    semanticErrorUnparameterizedType(this.log, node.range, node.type);
    node.type = this.cache.errorType;
  }
};
Resolver.prototype.checkIsType = function(node) {
  if (!node.type.isError(this.cache) && !NodeKind.isType(node.kind)) {
    semanticErrorUnexpectedExpression(this.log, node.range, node.type);
    node.type = this.cache.errorType;
  }
};
Resolver.prototype.checkIsInstance = function(node) {
  if (!node.type.isError(this.cache) && NodeKind.isType(node.kind)) {
    semanticErrorUnexpectedType(this.log, node.range, node.type);
    node.type = this.cache.errorType;
  }
};
Resolver.prototype.checkIsValidFunctionReturnType = function(node) {
  if (!node.type.isVoid(this.cache)) {
    this.checkIsValidVariableType(node);
  }
};
Resolver.prototype.checkIsValidVariableType = function(node) {
  if (node.type.isVoid(this.cache) || node.type.isNamespace()) {
    semanticErrorBadType(this.log, node.range, node.type);
    node.type = this.cache.errorType;
  }
};
Resolver.prototype.checkUnusedExpression = function(node) {
  var kind = node.kind;
  if (kind === 37) {
    this.checkUnusedExpression(node.hookTrue());
    this.checkUnusedExpression(node.hookFalse());
  } else if (kind === 52) {
    if (node.hasChildren()) {
      this.checkUnusedExpression(node.children.get(node.children.length - 1 | 0));
    }
  } else if (kind === 47) {
    this.checkUnusedExpression(node.letValue());
  } else if (!node.type.isError(this.cache) && !NodeKind.isCall(kind) && !NodeKind.isUnaryStorageOperator(kind) && !NodeKind.isBinaryStorageOperator(kind)) {
    semanticWarningUnusedExpression(this.log, node.range);
  }
};
Resolver.prototype.checkStorage = function(node) {
  if (node.type.isError(this.cache)) {
    return;
  }
  if (!NodeKind.isStorage(node.kind)) {
    semanticErrorBadStorage(this.log, node.range);
    return;
  }
  if (node.symbol.isFinal()) {
    semanticErrorStorageToFinal(this.log, node.range);
    return;
  }
};
Resolver.prototype.checkConversion = function(to, node, kind) {
  var from = node.type;
  if (from.isError(this.cache) || to.isError(this.cache)) {
    return;
  }
  if (from.isVoid(this.cache) && to.isVoid(this.cache)) {
    semanticErrorUnexpectedExpression(this.log, node.range, to);
    return;
  }
  if (from === to) {
    if ((node.kind === 34 || node.kind === 46) && node.symbol !== null && SymbolKind.isFunction(node.symbol.kind)) {
      var children = node.removeChildren();
      node.become(Node.createBind(node.clone().withChildren(children)).withRange(node.range).withType(to).withSymbol(node.symbol));
    }
    return;
  }
  if (to.isEnumFlags() && node.kind === 41 && node.asInt() === 0) {
    from = to;
  }
  if (kind === 0 && !this.cache.canImplicitlyConvert(from, to) || kind === 1 && !this.cache.canExplicitlyConvert(from, to)) {
    semanticErrorIncompatibleTypes(this.log, node.range, from, to, this.cache.canExplicitlyConvert(from, to));
    node.type = this.cache.errorType;
    return;
  }
  if (kind === 0) {
    if (NodeKind.isType(node.kind)) {
      return;
    }
    var value = new Node(38);
    value.become(node);
    node.become(Node.createImplicitCast(Node.createType(to), value).withType(to).withRange(node.range));
  }
};
Resolver.prototype.unexpectedStatement = function(node) {
  if (!node.range.isEmpty()) {
    semanticErrorUnexpectedStatement(this.log, node.range);
  }
};
Resolver.prototype.checkInsideBlock = function(node) {
  if (node.parent.kind !== 2) {
    this.unexpectedStatement(node);
  }
};
Resolver.prototype.checkDeclarationLocation = function(node, allowDeclaration) {
  var parent;
  for (parent = node.parent; parent !== null; parent = parent.parent) {
    if (parent.symbol !== null && parent.symbol.hasLocationError()) {
      break;
    }
    var kind = parent.kind;
    if (kind !== 0 && kind !== 1 && kind !== 32 && kind !== 2 && kind !== 7 && kind !== 13 && (allowDeclaration !== 1 || !NodeKind.isObject(kind))) {
      this.unexpectedStatement(node);
      break;
    }
  }
  if (parent !== null) {
    node.symbol.flags = node.symbol.flags | 16384;
  }
};
Resolver.prototype.checkStatementLocation = function(node) {
  if (node.parent.kind !== 2 || NodeKind.isNamedBlockDeclaration(node.parent.parent.kind) && node.parent.parent.kind !== 7) {
    this.unexpectedStatement(node);
  }
};
Resolver.prototype.checkAccessToThis = function(range) {
  if (this.context.functionSymbol !== null && SymbolKind.isInstance(this.context.functionSymbol.kind)) {
    return true;
  }
  if (this.context.symbolForThis !== null) {
    semanticErrorStaticThis(this.log, range, "this");
  } else {
    semanticErrorUnexpectedThis(this.log, range, "this");
  }
  return false;
};
Resolver.prototype.checkAccessToInstanceSymbol = function(node) {
  var symbol = node.symbol;
  if (!SymbolKind.isInstance(symbol.kind) && symbol.kind !== 4) {
    return true;
  }
  if (this.context.functionSymbol !== null && SymbolKind.isInstance(this.context.functionSymbol.kind) && this.context.functionSymbol.enclosingSymbol === symbol.enclosingSymbol) {
    return true;
  }
  if (this.context.symbolForThis === null) {
    semanticErrorUnexpectedThis(this.log, node.range, symbol.name);
    return false;
  }
  if (symbol.kind === 4 && this.context.symbolForThis === symbol.enclosingSymbol) {
    var enclosingNode = symbol.enclosingSymbol.node;
    for (var parent = node.parent; parent !== enclosingNode; parent = parent.parent) {
      if (parent.kind === 3 && parent.parent === enclosingNode && (parent === parent.parent.objectParameters() || parent === parent.parent.baseTypes())) {
        return true;
      }
      if ((parent.kind === 16 || NodeKind.isFunction(parent.kind)) && SymbolKind.isInstance(parent.symbol.kind)) {
        return true;
      }
    }
  }
  semanticErrorStaticThis(this.log, node.range, symbol.name);
  return false;
};
Resolver.prototype.collectAndResolveBaseTypes = function(symbol) {
  var baseTypes = [];
  for (var node = symbol.node; node !== null; node = node.sibling) {
    var isObject = NodeKind.isObject(node.kind);
    if (isObject || node.kind === 13) {
      var types = node.baseTypes();
      if (types !== null && types.hasChildren()) {
        var index = 0;
        for (var i = 0; i < types.children.length; i = i + 1 | 0) {
          var baseType = types.children.get(i);
          this.resolveAsParameterizedType(baseType);
          if (isObject) {
            baseTypes.insert((index = index + 1 | 0) - 1 | 0, baseType);
          } else if (baseType.type.isClass()) {
            semanticErrorBaseClassInExtension(this.log, baseType.range);
          } else {
            baseTypes.push(baseType);
          }
        }
      }
    }
  }
  return baseTypes;
};
Resolver.prototype.checkNoBaseTypes = function(symbol, what) {
  var baseTypes = this.collectAndResolveBaseTypes(symbol);
  for (var i = 0; i < baseTypes.length; i = i + 1 | 0) {
    semanticErrorUnexpectedBaseType(this.log, baseTypes.get(i).range, what);
  }
};
Resolver.prototype.needsTypeContext = function(node) {
  return node.kind === 45 || node.kind === 46 && node.dotTarget() === null || node.kind === 37 && this.needsTypeContext(node.hookTrue()) && this.needsTypeContext(node.hookFalse());
};
Resolver.prototype.addAutoGeneratedMember = function(type, name) {
  var symbol = new Symbol(name, 1);
  symbol.enclosingSymbol = type.symbol;
  type.addMember(new Member(symbol));
};
Resolver.prototype.initializeNamespace = function(symbol) {
  this.unexpectedModifierIfPresent(symbol, 256, "on a namespace declaration");
  this.unexpectedModifierIfPresent(symbol, 64, "on a namespace declaration");
  this.unexpectedModifierIfPresent(symbol, 128, "on a namespace declaration");
  this.unexpectedModifierIfPresent(symbol, 32, "on a namespace declaration");
  this.checkNoBaseTypes(symbol, "A namespace");
};
Resolver.prototype.initializeEnum = function(symbol) {
  this.unexpectedModifierIfPresent(symbol, 256, "on an enum declaration");
  this.unexpectedModifierIfPresent(symbol, 64, "on an enum declaration");
  this.unexpectedModifierIfPresent(symbol, 128, "on an enum declaration");
  this.unexpectedModifierIfPresent(symbol, 32, "on an enum declaration");
  this.checkNoBaseTypes(symbol, "An enum");
  if (symbol.type.findMember("toString") === null && !symbol.isImport()) {
    this.addAutoGeneratedMember(symbol.type, "toString");
  }
};
Resolver.prototype.resolveBaseTypes = function(symbol) {
  var node = symbol.node;
  var type = symbol.type;
  var baseTypes = this.collectAndResolveBaseTypes(symbol);
  var unmergedMembers = new StringMap();
  type.relevantTypes = [];
  if (symbol.kind === 13) {
    this.checkNoBaseTypes(symbol, "A struct");
    return;
  }
  for (var i = 0; i < baseTypes.length; i = i + 1 | 0) {
    var base = baseTypes.get(i);
    var baseType = base.type;
    if (baseType.isError(this.cache)) {
      continue;
    }
    if (symbol.kind === 12 && baseType.isClass()) {
      if (baseTypes.indexOf(base) !== 0) {
        semanticErrorClassBaseNotFirst(this.log, base.range, baseType);
        continue;
      }
    } else if (!baseType.isInterface()) {
      semanticErrorBaseTypeNotInterface(this.log, base.range, baseType);
      continue;
    }
    if (type.relevantTypes.indexOf(baseType) >= 0) {
      semanticErrorDuplicateBaseType(this.log, base.range, baseType);
      continue;
    }
    type.relevantTypes.push(baseType);
    var members = baseType.members.values();
    for (var j = 0; j < members.length; j = j + 1 | 0) {
      var member = members.get(j);
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
    var member = baseMembers.get(i);
    var existing = type.findMember(member.symbol.name);
    if (existing !== null) {
      existing.symbol.overriddenMember = member;
    } else if (member.symbol.name !== "new") {
      type.addMember(member);
    }
  }
};
Resolver.prototype.initializeObject = function(symbol) {
  this.unexpectedModifierIfPresent(symbol, 256, "on an object declaration");
  this.unexpectedModifierIfPresent(symbol, 64, "on an object declaration");
  var node = symbol.node.firstNonExtensionSibling();
  var parameters = node.objectParameters();
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
  this.unexpectedModifierIfPresent(symbol, 128, where);
  this.unexpectedModifierIfPresent(symbol, 32, where);
  if (parameters !== null && parameters.hasChildren()) {
    symbol.parameters = [];
    this.resolveNodes(parameters.children);
    for (var i = 0; i < parameters.children.length; i = i + 1 | 0) {
      symbol.parameters.push(parameters.children.get(i).symbol);
    }
    symbol.sortParametersByDependencies();
  }
  if (!type.isInterface() && type.$constructor() === null && !symbol.isImport()) {
    this.addAutoGeneratedMember(type, "new");
  }
  this.resolveBaseTypes(symbol);
};
Resolver.prototype.initializeFunction = function(symbol) {
  var enclosingSymbol = symbol.enclosingSymbol;
  this.unexpectedModifierIfPresent(symbol, 256, "on a function declaration");
  if (enclosingSymbol === null || !SymbolKind.isTypeWithInstances(enclosingSymbol.kind)) {
    this.unexpectedModifierIfPresent(symbol, 64, "outside an object declaration");
  }
  var node = symbol.node;
  var resultType;
  if (node.kind === 15) {
    var result = node.functionResult();
    this.resolveAsParameterizedType(result);
    this.checkIsValidFunctionReturnType(result);
    resultType = result.type;
  } else {
    resultType = enclosingSymbol.type;
    if (resultType.hasParameters()) {
      var substitutions = [];
      for (var i = 0; i < enclosingSymbol.parameters.length; i = i + 1 | 0) {
        substitutions.push(enclosingSymbol.parameters.get(i).type);
      }
      resultType = this.cache.parameterize(resultType, substitutions);
    }
  }
  var $arguments = node.functionArguments();
  this.resolve($arguments, null);
  symbol.type = this.cache.errorType;
  if (!resultType.isError(this.cache)) {
    var argumentTypes = [];
    for (var i = 0; i < $arguments.children.length; i = i + 1 | 0) {
      var type = $arguments.children.get(i).symbol.type;
      if (type.isError(this.cache)) {
        return;
      }
      argumentTypes.push(type);
    }
    symbol.type = this.cache.functionType(resultType, argumentTypes);
  }
  var overriddenMember = symbol.overriddenMember;
  if (overriddenMember !== null && !SymbolKind.isConstructor(symbol.kind)) {
    this.initializeMember(overriddenMember);
    var base = overriddenMember.type;
    var derived = symbol.type;
    if (!base.isError(this.cache) && !derived.isError(this.cache)) {
      var overriddenSymbol = overriddenMember.symbol;
      if (!base.isFunction() || !SymbolKind.isInstance(overriddenSymbol.kind) || !SymbolKind.isInstance(symbol.kind)) {
        semanticErrorBadOverride(this.log, node.declarationName().range, symbol.name, overriddenSymbol.enclosingSymbol.type, overriddenSymbol.node.declarationName().range);
      } else if (base !== derived) {
        semanticErrorOverrideDifferentTypes(this.log, node.declarationName().range, symbol.name, base, derived, overriddenSymbol.node.declarationName().range);
      } else if (!symbol.isOverride()) {
        semanticErrorModifierMissingOverride(this.log, node.declarationName().range, symbol.name, overriddenSymbol.node.declarationName().range);
      } else if (!overriddenSymbol.isVirtual()) {
        semanticErrorCannotOverrideNonVirtual(this.log, node.declarationName().range, symbol.name, overriddenSymbol.node.declarationName().range);
      } else {
        this.redundantModifierIfPresent(symbol, 128, "on an overriding function");
      }
    }
    symbol.flags = symbol.flags | 128;
  } else if (!symbol.isObjectMember()) {
    this.unexpectedModifierIfPresent(symbol, 128, "outside an object declaration");
    this.unexpectedModifierIfPresent(symbol, 32, "outside an object declaration");
  } else {
    if (!SymbolKind.isInstance(symbol.kind)) {
      this.unexpectedModifierIfPresent(symbol, 128, "on a non-instance function");
    }
    this.unexpectedModifierIfPresent(symbol, 32, "on a function that doesn't override anything");
    if (symbol.isOverride()) {
      symbol.flags = symbol.flags | 128;
    }
  }
};
Resolver.findModifierName = function(symbol, flag) {
  for (var node = symbol.node; node !== null; node = node.parent) {
    if (node.kind === 32) {
      var modifierName = node.modifierName();
      if (nameToSymbolFlag.get(modifierName.asString()) === flag) {
        return modifierName;
      }
    }
  }
  return null;
};
Resolver.prototype.redundantModifierIfPresent = function(symbol, flag, where) {
  if ((symbol.flags & flag) !== 0 && !symbol.hasModifierErrors()) {
    var modifierName = Resolver.findModifierName(symbol, flag);
    if (modifierName !== null) {
      semanticErrorRedundantModifier(this.log, modifierName.range, modifierName.asString(), where);
    }
  }
};
Resolver.prototype.unexpectedModifierIfPresent = function(symbol, flag, where) {
  if ((symbol.flags & flag) !== 0 && !symbol.hasModifierErrors()) {
    var modifierName = Resolver.findModifierName(symbol, flag);
    if (modifierName !== null) {
      semanticErrorUnexpectedModifier(this.log, modifierName.range, modifierName.asString(), where);
    }
  }
};
Resolver.prototype.expectedModifierIfAbsent = function(symbol, flag, where) {
  if ((symbol.flags & flag) === 0 && !symbol.hasModifierErrors() && Resolver.findModifierName(symbol, flag) === null) {
    semanticErrorExpectedModifier(this.log, symbol.node.declarationName().range, symbolFlagToName.get(flag), where);
  }
};
Resolver.prototype.initializeVariable = function(symbol) {
  this.unexpectedModifierIfPresent(symbol, 128, "on a variable declaration");
  this.unexpectedModifierIfPresent(symbol, 32, "on a variable declaration");
  if (symbol.enclosingSymbol === null || !SymbolKind.isTypeWithInstances(symbol.enclosingSymbol.kind)) {
    this.unexpectedModifierIfPresent(symbol, 64, "outside an object declaration");
  }
  if (symbol.enclosingSymbol !== null && symbol.enclosingSymbol.kind === 13 && !symbol.isStatic()) {
    this.expectedModifierIfAbsent(symbol, 256, "on a variable declaration inside a struct");
  }
  var node = symbol.node;
  var variableType = node.variableType();
  if (variableType === null) {
    if (node.parent.kind === 6) {
      variableType = node.parent.clusterType().clone();
    } else if (symbol.enclosingSymbol !== null) {
      var type = symbol.enclosingSymbol.type;
      variableType = Node.createType(type).withSymbol(symbol.enclosingSymbol);
      symbol.flags = symbol.flags | 256;
      var variableValue = node.variableValue();
      if (variableValue !== null) {
        this.resolveAsExpressionWithConversion(variableValue, this.cache.intType, 0);
        this.constantFolder.foldConstants(variableValue);
        if (variableValue.kind === 41) {
          symbol.enumValue = variableValue.asInt();
        } else {
          variableType = Node.createType(this.cache.errorType);
          if (!variableValue.type.isError(this.cache)) {
            semanticErrorBadIntegerConstant(this.log, variableValue.range, variableValue.type);
          }
        }
      } else {
        var index = node.parent.children.indexOf(node);
        if (index > 0) {
          var previous = node.parent.children.get(index - 1 | 0).symbol;
          this.initializeSymbol(previous);
          if (!previous.type.isError(this.cache)) {
            symbol.enumValue = type.isEnumFlags() ? $imul(previous.enumValue, 2) : previous.enumValue + 1 | 0;
          } else {
            variableType = Node.createType(this.cache.errorType);
          }
        } else {
          symbol.enumValue = type.isEnumFlags() ? 1 : 0;
        }
      }
    } else {
      variableType = Node.createType(this.cache.errorType);
    }
    node.replaceChild(1, variableType);
  }
  if (variableType.kind === 58) {
    var value = node.variableValue();
    if (value === null) {
      semanticErrorVarMissingValue(this.log, node.declarationName().range);
      symbol.type = this.cache.errorType;
    } else {
      if (node.parent.kind === 47) {
        var oldScope = this.context.scope;
        this.context.scope = oldScope.lexicalParent;
        this.resolveAsExpression(value);
        this.context.scope = oldScope;
      } else {
        this.resolveAsExpression(value);
      }
      var type = value.type;
      if (type.isNull(this.cache) || type.isVoid(this.cache)) {
        semanticErrorVarBadType(this.log, node.declarationName().range, type);
        symbol.type = this.cache.errorType;
      } else {
        symbol.type = type;
      }
    }
  } else {
    this.resolveAsParameterizedType(variableType);
    this.checkIsValidVariableType(variableType);
    symbol.type = variableType.type;
    if (node.parent.kind === 6 && node.parent.clusterType().type === null) {
      node.parent.replaceChild(0, variableType.clone());
    }
  }
  var overriddenMember = symbol.overriddenMember;
  if (overriddenMember !== null) {
    this.initializeMember(overriddenMember);
    var base = overriddenMember.type;
    var derived = symbol.type;
    if (!base.isError(this.cache) && !derived.isError(this.cache)) {
      semanticErrorBadOverride(this.log, node.declarationName().range, symbol.name, overriddenMember.symbol.enclosingSymbol.type, overriddenMember.symbol.node.declarationName().range);
    }
  }
};
Resolver.prototype.initializeParameter = function(symbol) {
  var type = symbol.type = new Type(symbol);
  var bound = symbol.node.parameterBound();
  if (bound !== null) {
    this.resolveAsParameterizedType(bound);
    var boundType = bound.type;
    if (boundType.isError(this.cache)) {
      symbol.type = this.cache.errorType;
    } else if (!boundType.isInterface()) {
      semanticErrorBadTypeParameterBound(this.log, bound.range, boundType);
    } else {
      type.relevantTypes = [boundType];
      type.copyMembersFrom(boundType);
    }
  }
};
Resolver.prototype.initializeAlias = function(symbol) {
  var value = symbol.node.aliasValue();
  this.resolveAsParameterizedType(value);
  symbol.type = value.type;
};
Resolver.prototype.initializeDeclaration = function(node) {
  var symbol = node.symbol;
  if (symbol.isUninitialized()) {
    symbol.flags = symbol.flags | 4096;
    var oldContext = this.context;
    var oldTypeContext = this.typeContext;
    var oldResultType = this.resultType;
    this.context = ResolveContext.fromNode(node);
    this.typeContext = null;
    this.resultType = null;
    switch (symbol.kind) {
    case 9:
      this.initializeNamespace(symbol);
      break;
    case 10:
    case 11:
      this.initializeEnum(symbol);
      break;
    case 12:
    case 13:
    case 14:
      this.initializeObject(symbol);
      break;
    case 15:
    case 16:
    case 17:
      this.initializeFunction(symbol);
      break;
    case 18:
    case 19:
    case 20:
      this.initializeVariable(symbol);
      break;
    case 4:
      this.initializeParameter(symbol);
      break;
    case 6:
    case 7:
      this.initializeAlias(symbol);
      break;
    case 0:
      break;
    default:
      break;
    }
    this.context = oldContext;
    this.typeContext = oldTypeContext;
    this.resultType = oldResultType;
    symbol.flags = symbol.flags & -4097 | 8192;
    while (node !== null) {
      var name = node.declarationName();
      name.symbol = symbol;
      name.type = symbol.type;
      node = node.sibling;
    }
  }
};
Resolver.prototype.initializePotentiallyDuplicatedMember = function(member, range) {
  var symbol = member.symbol;
  if (symbol.kind === 2) {
    var names = [];
    for (var i = 0; i < symbol.identicalMembers.length; i = i + 1 | 0) {
      names.push(symbol.identicalMembers.get(i).symbol.fullName());
    }
    semanticErrorAmbiguousSymbol(this.log, range, symbol.name, names);
    member.type = symbol.type = this.cache.errorType;
    return;
  }
  this.initializeMember(member);
};
Resolver.prototype.initializeMember = function(member) {
  if (member.type !== null) {
    return;
  }
  trace.log("initializeMember ".append(member.symbol.fullName()).append(member.parameterizedType !== null ? " on ".append(member.parameterizedType.toString()) : ""));
  trace.indent();
  if (member.dependency !== null) {
    this.initializeMember(member.dependency);
    member.type = member.dependency.type;
  } else {
    this.initializeSymbol(member.symbol);
    member.type = member.symbol.type;
  }
  var parameterizedType = member.parameterizedType;
  if (parameterizedType !== null && parameterizedType.isParameterized()) {
    member.type = this.cache.substitute(member.type, parameterizedType.symbol.parameters, parameterizedType.substitutions);
  }
  trace.dedent();
};
Resolver.prototype.generateDefaultConstructor = function(symbol) {
  var enclosingSymbol = symbol.enclosingSymbol;
  var members = enclosingSymbol.type.members.values();
  var $arguments = [];
  var superArguments = null;
  var memberInitializers = [];
  var baseClass = enclosingSymbol.type.isClass() ? enclosingSymbol.type.baseClass() : null;
  if (baseClass !== null) {
    var $constructor = baseClass.$constructor();
    if ($constructor !== null) {
      this.initializeMember($constructor);
      if ($constructor.type.isFunction()) {
        var argumentTypes = $constructor.type.argumentTypes();
        superArguments = [];
        for (var j = 0; j < argumentTypes.length; j = j + 1 | 0) {
          var name = "_".append($arguments.length.toString());
          var argument = Node.createVariable(Node.createName(name), Node.createType(argumentTypes.get(j)), null);
          argument.symbol = new Symbol(name, 18);
          argument.symbol.node = argument;
          $arguments.push(argument);
          superArguments.push(Node.createName(name));
        }
      } else {
        symbol.flags = symbol.flags | 8192;
        symbol.type = this.cache.errorType;
        return;
      }
    }
  }
  var uninitializedMembers = [];
  for (var i = 0; i < members.length; i = i + 1 | 0) {
    var member = members.get(i);
    var memberSymbol = member.symbol;
    if (memberSymbol.kind === 20 && memberSymbol.enclosingSymbol === enclosingSymbol && memberSymbol.node.variableValue() === null) {
      this.initializeMember(member);
      if (member.type.isError(this.cache)) {
        symbol.flags = symbol.flags | 8192;
        symbol.type = this.cache.errorType;
        return;
      }
      uninitializedMembers.push(member);
    }
  }
  for (var i = 1; i < uninitializedMembers.length; i = i + 1 | 0) {
    var j = i;
    var member = uninitializedMembers.get(i);
    for (; j > 0 && uninitializedMembers.get(j - 1 | 0).symbol.node.range.start > member.symbol.node.range.start; j = j - 1 | 0) {
      uninitializedMembers.set(j, uninitializedMembers.get(j - 1 | 0));
    }
    uninitializedMembers.set(j, member);
  }
  for (var i = 0; i < uninitializedMembers.length; i = i + 1 | 0) {
    var member = uninitializedMembers.get(i);
    var name = "_".append($arguments.length.toString());
    var argument = Node.createVariable(Node.createName(name), Node.createType(member.type), null);
    argument.symbol = new Symbol(name, 18);
    argument.symbol.node = argument;
    $arguments.push(argument);
    memberInitializers.push(Node.createMemberInitializer(Node.createName(member.symbol.name), Node.createName(name)));
  }
  symbol.kind = 17;
  symbol.node = Node.createConstructor(Node.createName(symbol.name), Node.createNodeList($arguments), Node.createBlock([]), superArguments !== null ? Node.createSuperCall(superArguments) : null, memberInitializers !== null ? Node.createNodeList(memberInitializers) : null);
  enclosingSymbol.node.declarationBlock().appendChild(symbol.node);
  var scope = new Scope(enclosingSymbol.node.scope);
  symbol.node.symbol = symbol;
  symbol.node.scope = scope;
  for (var i = 0; i < $arguments.length; i = i + 1 | 0) {
    scope.insert($arguments.get(i).symbol);
  }
};
Resolver.prototype.generateDefaultToString = function(symbol) {
  var enclosingSymbol = symbol.enclosingSymbol;
  var enclosingNode = enclosingSymbol.node;
  var members = enclosingSymbol.type.members.values();
  var fields = [];
  var i;
  for (i = 0; i < members.length; i = i + 1 | 0) {
    var field = members.get(i).symbol;
    if (field.kind === 19 && !field.isFromExtension()) {
      fields.push(field);
    }
  }
  for (i = 0; i < fields.length; i = i + 1 | 0) {
    var field = fields.get(i);
    this.initializeSymbol(field);
    if (field.type.isError(this.cache)) {
      break;
    }
    var value = field.enumValue;
    var j;
    for (j = 0; j < i; j = j + 1 | 0) {
      var other = fields.get(j);
      if (value === other.enumValue) {
        semanticErrorBadEnumToString(this.log, enclosingNode.declarationName().range, enclosingSymbol.name, field.name, other.name, value);
        break;
      }
    }
    if (j < i) {
      break;
    }
  }
  var block = Node.createBlock([]);
  var extension = Node.createExtension(Node.createName(enclosingSymbol.name), null, block).withSymbol(enclosingSymbol);
  enclosingNode.insertSiblingAfter(extension);
  enclosingNode.appendToSiblingChain(extension);
  var statement;
  if (fields.length === 0 || i < fields.length) {
    statement = Node.createReturn(Node.createString(""));
  } else {
    var cases = [];
    for (i = 0; i < fields.length; i = i + 1 | 0) {
      var field = fields.get(i);
      cases.push(Node.createCase([Node.createDot(null, Node.createName(field.name))], Node.createBlock([Node.createReturn(Node.createString(field.name))])));
    }
    cases.push(Node.createCase([], Node.createBlock([Node.createReturn(Node.createString(""))])));
    statement = Node.createSwitch(Node.createThis(), cases);
  }
  symbol.kind = 16;
  symbol.flags = 16;
  symbol.node = Node.createFunction(Node.createName(symbol.name), Node.createNodeList([]), Node.createBlock([statement]), Node.createType(this.cache.stringType)).withSymbol(symbol);
  block.appendChild(symbol.node);
  this.prepareNode(extension, enclosingNode.parent.scope);
  this.resolve(extension, null);
};
Resolver.prototype.initializeSymbol = function(symbol) {
  if (symbol.kind === 1) {
    switch (symbol.name) {
    case "new":
      this.generateDefaultConstructor(symbol);
      break;
    case "toString":
      this.generateDefaultToString(symbol);
      break;
    default:
      break;
    }
    if (symbol.node !== null) {
      var oldContext = this.context;
      this.context = ResolveContext.fromNode(symbol.node);
      this.resolve(symbol.node, null);
      this.context = oldContext;
    }
  }
  if (symbol.kind === 3) {
    if (symbol.type !== null) {
      return;
    }
    var types = [];
    for (var i = 0; i < symbol.identicalMembers.length; i = i + 1 | 0) {
      var identical = symbol.identicalMembers.get(i);
      this.initializeMember(identical);
      var type = identical.type;
      var index = types.indexOf(type);
      if (index < 0) {
        types.push(type);
      }
    }
    if (types.length !== 1) {
      semanticErrorUnmergedSymbol(this.log, symbol.enclosingSymbol.node.declarationName().range, symbol.fullName(), types);
      symbol.type = this.cache.errorType;
    } else {
      symbol.type = types.get(0);
    }
    return;
  }
  if (symbol.isUninitialized()) {
    this.initializeDeclaration(symbol.node);
  } else if (symbol.isInitializing()) {
    semanticErrorCyclicDeclaration(this.log, symbol.node.firstNonExtensionSibling().declarationName().range, symbol.name);
    symbol.type = this.cache.errorType;
  }
};
Resolver.prototype.unsupportedNodeKind = function(node) {
};
Resolver.prototype.resolveArguments = function($arguments, argumentTypes, outer, inner) {
  if (argumentTypes.length !== $arguments.length) {
    var range = Range.equal(outer, inner) ? outer : Range.after(outer, inner);
    semanticErrorArgumentCount(this.log, range, argumentTypes.length, $arguments.length);
    this.resolveNodesAsExpressions($arguments);
    return;
  }
  for (var i = 0; i < $arguments.length; i = i + 1 | 0) {
    this.resolveAsExpressionWithConversion($arguments.get(i), argumentTypes.get(i), 0);
  }
};
Resolver.prototype.resolveAsType = function(node) {
  this.resolve(node, null);
  this.checkIsType(node);
};
Resolver.prototype.resolveAsParameterizedType = function(node) {
  this.resolveAsType(node);
  this.checkIsParameterized(node);
};
Resolver.prototype.resolveAsExpression = function(node) {
  this.resolve(node, null);
  this.checkIsInstance(node);
};
Resolver.prototype.resolveAsExpressionWithTypeContext = function(node, type) {
  this.resolve(node, type);
  this.checkIsInstance(node);
};
Resolver.prototype.resolveAsExpressionWithConversion = function(node, type, kind) {
  this.resolve(node, type);
  this.checkIsInstance(node);
  if (type !== null) {
    this.checkConversion(type, node, kind);
  }
};
Resolver.prototype.resolveNodes = function(nodes) {
  for (var i = 0; i < nodes.length; i = i + 1 | 0) {
    this.resolve(nodes.get(i), null);
  }
};
Resolver.prototype.resolveNodesAsExpressions = function(nodes) {
  for (var i = 0; i < nodes.length; i = i + 1 | 0) {
    this.resolveAsExpression(nodes.get(i));
  }
};
Resolver.prototype.resolveNodesAsVariableTypes = function(nodes) {
  for (var i = 0; i < nodes.length; i = i + 1 | 0) {
    var node = nodes.get(i);
    this.resolveAsParameterizedType(node);
    this.checkIsValidVariableType(node);
  }
};
Resolver.prototype.resolveChildren = function(node) {
  if (node.hasChildren()) {
    this.resolveNodes(node.children);
  }
};
Resolver.prototype.resolveProgram = function(node) {
  this.resolveChildren(node);
};
Resolver.prototype.resolveFile = function(node) {
  this.resolve(node.fileBlock(), null);
};
Resolver.prototype.resolveBlock = function(node) {
  this.resolveChildren(node);
};
Resolver.prototype.resolveCase = function(node) {
  var values = node.caseValues();
  var block = node.caseBlock();
  for (var i = 0; i < values.length; i = i + 1 | 0) {
    var value = values.get(i);
    this.resolveAsExpressionWithConversion(value, this.context.switchValue.type, 0);
    this.constantFolder.foldConstants(value);
    if (!value.type.isError(this.cache) && !NodeKind.isConstant(value.kind)) {
      semanticErrorNonConstantCaseValue(this.log, value.range);
      value.type = this.cache.errorType;
    }
  }
  this.resolve(block, null);
};
Resolver.prototype.resolveUsingNamespace = function(node) {
  this.checkInsideBlock(node);
};
Resolver.prototype.resolveNamespace = function(node) {
  this.checkDeclarationLocation(node, 0);
  this.initializeSymbol(node.symbol);
  this.resolve(node.declarationBlock(), null);
};
Resolver.prototype.resolveEnum = function(node) {
  this.checkDeclarationLocation(node, 0);
  this.initializeSymbol(node.symbol);
  this.resolve(node.declarationBlock(), null);
};
Resolver.prototype.resolveObject = function(node) {
  this.checkDeclarationLocation(node, 0);
  this.initializeSymbol(node.symbol);
  var members = node.symbol.type.members.values();
  for (var i = 0; i < members.length; i = i + 1 | 0) {
    var member = members.get(i);
    if (member.symbol.kind === 3) {
      this.initializeMember(member);
    }
  }
  var oldSymbolForThis = this.context.symbolForThis;
  this.context.symbolForThis = node.symbol;
  var $constructor = node.symbol.type.$constructor();
  if ($constructor !== null) {
    this.initializeMember($constructor);
  }
  this.resolve(node.declarationBlock(), null);
  this.context.symbolForThis = oldSymbolForThis;
};
Resolver.prototype.resolveExtension = function(node) {
  this.checkDeclarationLocation(node, 0);
  this.initializeSymbol(node.symbol);
  var oldSymbolForThis = this.context.symbolForThis;
  if (SymbolKind.isTypeWithInstances(node.symbol.kind)) {
    this.context.symbolForThis = node.symbol;
  }
  this.resolve(node.declarationBlock(), null);
  this.context.symbolForThis = oldSymbolForThis;
};
Resolver.prototype.resolveFunction = function(node) {
  this.checkDeclarationLocation(node, 1);
  this.initializeSymbol(node.symbol);
  var oldFunctionSymbol = this.context.functionSymbol;
  this.context.functionSymbol = node.symbol;
  var block = node.functionBlock();
  if (block !== null) {
    var oldResultType = this.resultType;
    var symbol = node.symbol;
    if (symbol.type.isError(this.cache)) {
      this.resultType = this.cache.errorType;
    } else if (SymbolKind.isConstructor(symbol.kind)) {
      this.resultType = this.cache.voidType;
    } else {
      this.resultType = symbol.type.resultType();
    }
    this.resolve(block, null);
    if (!this.resultType.isError(this.cache) && !this.resultType.isVoid(this.cache) && !block.blockAlwaysEndsWithReturn()) {
      semanticErrorMissingReturn(this.log, node.declarationName().range, node.symbol.name, this.resultType);
    }
    this.resultType = oldResultType;
  }
  if (node.kind === 14) {
    var overriddenMember = node.symbol.overriddenMember;
    var overriddenType = this.cache.errorType;
    if (overriddenMember !== null) {
      this.initializeMember(overriddenMember);
      overriddenType = overriddenMember.type;
    }
    var superInitializer = node.superInitializer();
    if (superInitializer !== null) {
      if (overriddenMember !== null) {
        superInitializer.symbol = overriddenMember.symbol;
      } else {
        semanticErrorBadSuperInitializer(this.log, superInitializer.range);
      }
      var $arguments = superInitializer.superCallArguments();
      if (overriddenType.isError(this.cache)) {
        this.resolveNodesAsExpressions($arguments);
      } else {
        this.resolveArguments($arguments, overriddenType.argumentTypes(), superInitializer.range, superInitializer.range);
      }
    } else if (overriddenType.isFunction()) {
      if (overriddenType.argumentTypes().length > 0) {
        semanticErrorMissingSuperInitializer(this.log, node.declarationName().range);
      } else {
        node.replaceChild(3, Node.createSuperCall([]).withSymbol(overriddenMember.symbol));
      }
    }
    var memberInitializers = node.memberInitializers();
    if (memberInitializers === null) {
      memberInitializers = Node.createNodeList([]);
      node.replaceChild(4, memberInitializers);
    }
    if ((superInitializer !== null || memberInitializers.children.length > 0) && block === null) {
      semanticErrorAbstractConstructorInitializer(this.log, Range.span((superInitializer !== null ? superInitializer : memberInitializers.children.get(0)).range, (memberInitializers.children.length < 1 ? superInitializer : memberInitializers.children.get(memberInitializers.children.length - 1 | 0)).range));
    }
    var enclosingSymbol = node.symbol.enclosingSymbol;
    if (!enclosingSymbol.isImport()) {
      var members = enclosingSymbol.type.members.values();
      var index = 0;
      for (var i = 0; i < members.length; i = i + 1 | 0) {
        var member = members.get(i);
        var memberSymbol = member.symbol;
        if (memberSymbol.kind === 20 && memberSymbol.enclosingSymbol === enclosingSymbol) {
          var value = memberSymbol.node.variableValue();
          if (value !== null) {
            this.initializeMember(member);
            var oldScope = this.context.scope;
            this.context.scope = node.scope.lexicalParent;
            this.context.functionSymbol = null;
            this.resolve(memberSymbol.node, null);
            this.context.functionSymbol = node.symbol;
            this.context.scope = oldScope;
            value.replaceWith(Node.createError());
            memberInitializers.insertChild((index = index + 1 | 0) - 1 | 0, Node.createMemberInitializer(Node.createName(memberSymbol.name).withSymbol(memberSymbol).withType(member.type), value));
          } else {
            var j;
            for (j = 0; j < memberInitializers.children.length; j = j + 1 | 0) {
              if (memberInitializers.children.get(j).memberInitializerName().asString() === memberSymbol.name) {
                break;
              }
            }
            if (j === memberInitializers.children.length) {
              this.initializeMember(member);
              memberInitializers.insertChild((index = index + 1 | 0) - 1 | 0, Node.createMemberInitializer(Node.createName(memberSymbol.name).withSymbol(memberSymbol).withType(member.type), Node.createDefault(Node.createType(member.type))));
            }
          }
        }
      }
    }
    for (var i = 0; i < memberInitializers.children.length; i = i + 1 | 0) {
      var memberInitializer = memberInitializers.children.get(i);
      var name = memberInitializer.memberInitializerName();
      var value = memberInitializer.memberInitializerValue();
      var oldScope = this.context.scope;
      this.context.scope = node.scope.lexicalParent;
      this.resolve(name, null);
      this.context.scope = oldScope;
      if (name.symbol !== null) {
        this.resolveAsExpressionWithConversion(value, name.symbol.type, 0);
        for (var j = 0; j < i; j = j + 1 | 0) {
          var other = memberInitializers.children.get(j);
          if (other.memberInitializerName().symbol === name.symbol) {
            semanticErrorAlreadyInitialized(this.log, value.range, name.symbol.name, other.memberInitializerValue().range);
            break;
          }
        }
      } else {
        this.resolveAsExpression(value);
      }
    }
  }
  this.context.functionSymbol = oldFunctionSymbol;
};
Resolver.prototype.resolveVariable = function(node) {
  var symbol = node.symbol;
  this.initializeSymbol(symbol);
  var value = node.variableValue();
  var enclosingSymbol = symbol.enclosingSymbol;
  if (!symbol.isStatic() && enclosingSymbol !== null) {
    var enclosingSymbolType = enclosingSymbol.type;
    if (enclosingSymbolType.isInterface() || symbol.isFromExtension() && enclosingSymbolType.isEnum()) {
      this.unexpectedStatement(node);
    } else if (symbol.isFromExtension() && SymbolKind.isTypeWithInstances(enclosingSymbol.kind) && value === null) {
      semanticErrorUninitializedExtensionVariable(this.log, node.declarationName().range);
    }
  }
  if (value !== null) {
    this.resolveAsExpressionWithConversion(value, symbol.isEnumValue() ? this.cache.intType : symbol.type, 0);
  }
};
Resolver.prototype.resolveVariableCluster = function(node) {
  this.resolveNodes(node.clusterVariables());
};
Resolver.prototype.resolveParameter = function(node) {
  this.initializeSymbol(node.symbol);
};
Resolver.prototype.resolveAlias = function(node) {
  this.checkInsideBlock(node);
  if (node.symbol !== null) {
    this.initializeSymbol(node.symbol);
  }
};
Resolver.prototype.resolveIf = function(node) {
  this.checkStatementLocation(node);
  this.resolveAsExpressionWithConversion(node.ifTest(), this.cache.boolType, 0);
  this.resolve(node.ifTrue(), null);
  if (node.ifFalse() !== null) {
    this.resolve(node.ifFalse(), null);
  }
};
Resolver.prototype.resolveFor = function(node) {
  this.checkStatementLocation(node);
  var setup = node.forSetup();
  var test = node.forTest();
  var update = node.forUpdate();
  if (setup !== null) {
    if (setup.kind === 6) {
      this.resolve(setup, null);
    } else {
      this.resolveAsExpression(setup);
    }
  }
  if (test !== null) {
    this.resolveAsExpressionWithConversion(test, this.cache.boolType, 0);
  }
  if (update !== null) {
    this.resolveAsExpression(update);
  }
  var oldLoop = this.context.loop;
  this.context.loop = node;
  this.resolve(node.forBlock(), null);
  this.context.loop = oldLoop;
};
Resolver.prototype.resolveForEach = function(node) {
  this.unsupportedNodeKind(node);
  this.checkStatementLocation(node);
  this.resolve(node.forEachVariable(), null);
  this.resolve(node.forEachValue(), null);
  var oldLoop = this.context.loop;
  this.context.loop = node;
  this.resolve(node.forEachBlock(), null);
  this.context.loop = oldLoop;
};
Resolver.prototype.resolveWhile = function(node) {
  this.checkStatementLocation(node);
  var test = node.whileTest();
  if (test !== null) {
    this.resolveAsExpressionWithConversion(test, this.cache.boolType, 0);
  }
  var oldLoop = this.context.loop;
  this.context.loop = node;
  this.resolve(node.whileBlock(), null);
  this.context.loop = oldLoop;
};
Resolver.prototype.resolveReturn = function(node) {
  var value = node.returnValue();
  if (this.resultType === null) {
    this.unexpectedStatement(node);
    if (value !== null) {
      this.resolveAsExpression(value);
    }
    return;
  }
  if (value !== null) {
    if (node.kind === 26 && this.resultType.isVoid(this.cache)) {
      node.become(Node.createExpression(value.remove()));
      this.resolve(node, null);
    } else {
      this.resolveAsExpressionWithConversion(value, this.resultType, 0);
    }
  } else if (!this.resultType.isError(this.cache) && !this.resultType.isVoid(this.cache)) {
    semanticErrorExpectedReturnValue(this.log, node.range, this.resultType);
  }
};
Resolver.prototype.resolveBreak = function(node) {
  if (this.context.loop === null) {
    this.unexpectedStatement(node);
  }
};
Resolver.prototype.resolveContinue = function(node) {
  if (this.context.loop === null) {
    this.unexpectedStatement(node);
  }
};
Resolver.prototype.resolveAssert = function(node) {
  this.checkStatementLocation(node);
  this.resolveAsExpressionWithConversion(node.assertValue(), this.cache.boolType, 0);
};
Resolver.prototype.resolveExpression = function(node) {
  this.checkStatementLocation(node);
  var value = node.expressionValue();
  this.resolveAsExpression(value);
  this.checkUnusedExpression(value);
};
Resolver.prototype.resolveSwitch = function(node) {
  this.checkStatementLocation(node);
  var value = node.switchValue();
  var cases = node.switchCases();
  this.resolveAsExpression(value);
  var oldSwitchValue = this.context.switchValue;
  this.context.switchValue = value;
  this.resolveNodes(cases);
  this.context.switchValue = oldSwitchValue;
  var uniqueValues = [];
  for (var i = 0; i < cases.length; i = i + 1 | 0) {
    var child = cases.get(i);
    if (child.children.length === 1 && i < (cases.length - 1 | 0)) {
      semanticErrorBadDefaultCase(this.log, child.range);
    }
    var caseValues = child.caseValues();
    for (var j = 0; j < caseValues.length; j = j + 1 | 0) {
      var caseValue = caseValues.get(j);
      if (caseValue.type.isError(this.cache)) {
        continue;
      }
      var k;
      for (k = 0; k < uniqueValues.length; k = k + 1 | 0) {
        var original = uniqueValues.get(k);
        if (original.kind === caseValue.kind && Content.equal(original.content, caseValue.content)) {
          semanticErrorDuplicateCase(this.log, caseValue.range, original.range);
          break;
        }
      }
      if (k === uniqueValues.length) {
        uniqueValues.push(caseValue);
      }
    }
  }
};
Resolver.prototype.resolveModifier = function(node) {
  this.resolveNodes(node.modifierStatements());
};
Resolver.prototype.resolveName = function(node) {
  var name = node.asString();
  var member = this.context.scope.find(name);
  if (member === null) {
    semanticErrorUndeclaredSymbol(this.log, node.range, name);
    return;
  }
  this.initializePotentiallyDuplicatedMember(member, node.range);
  node.symbol = member.symbol;
  if (!this.checkAccessToInstanceSymbol(node)) {
    node.type = this.cache.errorType;
    return;
  }
  if (SymbolKind.isType(member.symbol.kind)) {
    node.become(Node.createType(member.type).withRange(node.range).withSymbol(member.symbol));
    return;
  }
  node.type = member.type;
};
Resolver.prototype.resolveThis = function(node) {
  if (this.checkAccessToThis(node.range)) {
    var symbol = this.context.symbolForThis;
    this.initializeSymbol(symbol);
    node.type = symbol.type;
    node.symbol = symbol;
  }
};
Resolver.prototype.resolveHook = function(node) {
  var trueNode = node.hookTrue();
  var falseNode = node.hookFalse();
  this.resolveAsExpressionWithConversion(node.hookTest(), this.cache.boolType, 0);
  this.resolveAsExpressionWithTypeContext(trueNode, this.typeContext);
  this.resolveAsExpressionWithTypeContext(falseNode, this.typeContext);
  var trueType = trueNode.type;
  var falseType = falseNode.type;
  if (trueType.isError(this.cache) || falseType.isError(this.cache)) {
    return;
  }
  var commonType = this.cache.commonImplicitType(trueType, falseType);
  if (commonType === null) {
    commonType = this.typeContext;
    if (commonType === null || !this.cache.canImplicitlyConvert(trueType, commonType) || !this.cache.canImplicitlyConvert(falseType, commonType)) {
      semanticErrorNoCommonType(this.log, Range.span(trueNode.range, falseNode.range), trueType, falseType);
      return;
    }
  }
  this.checkConversion(commonType, trueNode, 0);
  this.checkConversion(commonType, falseNode, 0);
  node.type = commonType;
};
Resolver.prototype.resolveInt = function(node) {
  if (node.asInt() === -2147483648) {
    syntaxErrorInvalidInteger(this.log, node.range, node.range.toString());
  }
  node.type = this.cache.intType;
};
Resolver.prototype.resolveInitializer = function(node) {
  var values = node.initializerValues();
  if (this.typeContext === null) {
    semanticErrorMissingTypeContext(this.log, node.range);
    this.resolveNodesAsExpressions(values);
    return;
  }
  if (this.typeContext.isError(this.cache)) {
    this.resolveNodesAsExpressions(values);
    return;
  }
  if (this.typeContext.isList(this.cache)) {
    var itemType = this.typeContext.substitutions.get(0);
    for (var i = 0; i < values.length; i = i + 1 | 0) {
      this.resolveAsExpressionWithConversion(values.get(i), itemType, 0);
    }
    node.type = this.typeContext;
    return;
  }
  node.become(Node.createCall(Node.createType(this.typeContext).withRange(node.range), node.removeChildren()).withRange(node.range));
  this.resolveAsExpression(node);
};
Resolver.prototype.resolveDot = function(node) {
  var target = node.dotTarget();
  if (target !== null) {
    this.resolve(target, null);
  }
  var type = target !== null ? target.type : this.typeContext;
  if (type === null) {
    semanticErrorMissingTypeContext(this.log, node.range);
    return;
  }
  if (type.isError(this.cache)) {
    return;
  }
  var dotName = node.dotName();
  if (dotName === null) {
    return;
  }
  var name = dotName.asString();
  var member = type.findMember(name);
  if (member === null) {
    semanticErrorUnknownMemberSymbol(this.log, dotName.range, name, type);
    return;
  }
  node.symbol = dotName.symbol = member.symbol;
  this.initializePotentiallyDuplicatedMember(member, dotName.range);
  var symbolIsType = SymbolKind.isType(member.symbol.kind);
  var targetIsType = target === null || NodeKind.isType(target.kind);
  if (!type.isNamespace() && (!type.isEnum() || member.symbol.isFromExtension())) {
    var isStatic = symbolIsType || member.symbol.isStatic();
    if (isStatic && !targetIsType) {
      semanticErrorMemberUnexpectedStatic(this.log, dotName.range, name);
    } else if (!isStatic && targetIsType) {
      semanticErrorMemberUnexpectedInstance(this.log, dotName.range, name);
    }
  }
  if (symbolIsType) {
    node.become(Node.createType(member.type).withRange(node.range).withSymbol(member.symbol));
  } else if (targetIsType) {
    node.become(Node.createName(member.symbol.name).withRange(node.range).withSymbol(member.symbol).withType(member.type));
  } else {
    node.type = dotName.type = member.type;
  }
};
Resolver.prototype.resolveLet = function(node) {
  var value = node.letValue();
  this.resolve(node.letVariable(), null);
  this.resolveAsExpressionWithTypeContext(value, this.typeContext);
  node.type = value.type;
};
Resolver.prototype.resolveCall = function(node) {
  var value = node.callValue();
  var $arguments = node.callArguments();
  if (value.kind === 56 && this.typeContext !== null) {
    this.resolveNodesAsExpressions($arguments);
    if (this.typeContext.isError(this.cache)) {
      this.resolveAsExpression(value);
      return;
    }
    var argumentTypes = [];
    for (var i = 0; i < $arguments.length; i = i + 1 | 0) {
      var type = $arguments.get(i).type;
      if (type.isError(this.cache)) {
        this.resolveAsExpression(value);
        return;
      }
      argumentTypes.push(type);
    }
    this.resolveAsExpressionWithConversion(value, this.cache.functionType(this.typeContext, argumentTypes), 0);
  } else {
    this.resolve(value, null);
    if (NodeKind.isType(value.kind)) {
      this.checkIsParameterized(value);
    }
    var valueType = value.type;
    if (valueType.isError(this.cache)) {
      this.resolveNodesAsExpressions($arguments);
      return;
    }
    if (NodeKind.isType(value.kind)) {
      var member = valueType.$constructor();
      if (member === null) {
        semanticErrorUnconstructableType(this.log, value.range, valueType);
        this.resolveNodesAsExpressions($arguments);
        return;
      }
      this.initializeMember(member);
      node.symbol = member.symbol;
      valueType = member.type;
      if (valueType.isError(this.cache)) {
        this.resolveNodesAsExpressions($arguments);
        return;
      }
    }
    if (!valueType.isFunction()) {
      semanticErrorInvalidCall(this.log, value.range, valueType);
      this.resolveNodesAsExpressions($arguments);
      return;
    }
    node.type = valueType.resultType();
    this.resolveArguments($arguments, valueType.argumentTypes(), node.range, value.range);
  }
};
Resolver.prototype.resolveSuperCall = function(node) {
  this.unsupportedNodeKind(node);
};
Resolver.prototype.resolveSequence = function(node) {
  for (var i = 0, n = node.children.length; i < n; i = i + 1 | 0) {
    var child = node.children.get(i);
    if (i < (n - 1 | 0)) {
      this.resolveAsExpression(child);
      this.checkUnusedExpression(child);
    } else {
      this.resolveAsExpressionWithConversion(child, this.typeContext, node.parent.kind === 54 ? 1 : 0);
    }
  }
};
Resolver.prototype.resolveParameterize = function(node) {
  var parameterizeType = node.parameterizeType();
  var substitutions = node.parameterizeTypes();
  this.resolveAsType(parameterizeType);
  this.resolveNodesAsVariableTypes(substitutions);
  var unparameterized = parameterizeType.type;
  if (unparameterized.isError(this.cache)) {
    return;
  }
  if (!unparameterized.hasParameters() || unparameterized.isParameterized()) {
    semanticErrorCannotParameterize(this.log, parameterizeType.range, unparameterized);
    return;
  }
  var parameters = unparameterized.symbol.parameters;
  var sortedParameters = unparameterized.symbol.sortedParameters;
  if (parameters.length !== substitutions.length) {
    semanticErrorParameterCount(this.log, Range.after(node.range, parameterizeType.range), parameters.length, substitutions.length);
    return;
  }
  var sortedTypes = [];
  for (var i = 0; i < sortedParameters.length; i = i + 1 | 0) {
    var parameter = sortedParameters.get(i);
    var index = parameters.indexOf(parameter);
    var substitution = substitutions.get(index);
    if (parameter.type.isError(this.cache)) {
      return;
    }
    var bound = parameter.type.bound();
    if (bound !== null) {
      if (i > 0) {
        bound = this.cache.substitute(bound, sortedParameters.slice(0, i), sortedTypes.slice(0, i));
      }
      this.checkConversion(bound, substitution, 0);
    }
    if (substitution.type.isError(this.cache)) {
      return;
    }
    sortedTypes.push(substitution.type);
  }
  var types = [];
  for (var i = 0; i < substitutions.length; i = i + 1 | 0) {
    types.push(substitutions.get(i).type);
  }
  node.become(Node.createType(this.cache.parameterize(unparameterized, types)).withRange(node.range).withSymbol(parameterizeType.symbol));
};
Resolver.prototype.resolveCast = function(node) {
  var type = node.castType();
  this.resolveAsParameterizedType(type);
  this.checkIsValidVariableType(type);
  this.resolveAsExpressionWithConversion(node.castValue(), type.type, 1);
  node.type = type.type;
};
Resolver.prototype.resolveLambda = function(node) {
  var oldResultType = this.resultType;
  var oldLoop = this.context.loop;
  this.resultType = this.cache.errorType;
  this.context.loop = null;
  var $arguments = node.lambdaArguments();
  var block = node.lambdaBlock();
  if (this.typeContext === null) {
    semanticErrorMissingTypeContext(this.log, node.range);
  } else if (!this.typeContext.isError(this.cache)) {
    if (!this.typeContext.isFunction()) {
      semanticErrorBadLambdaTypeContext(this.log, node.range, this.typeContext);
    } else if (!this.typeContext.isError(this.cache)) {
      var argumentTypes = this.typeContext.argumentTypes();
      this.resultType = this.typeContext.resultType();
      node.type = this.typeContext;
      if (argumentTypes.length !== $arguments.length) {
        semanticErrorArgumentCount(this.log, node.range, argumentTypes.length, $arguments.length);
      } else {
        for (var i = 0; i < $arguments.length; i = i + 1 | 0) {
          $arguments.get(i).replaceChild(1, Node.createType(argumentTypes.get(i)));
        }
      }
      if (!this.resultType.isError(this.cache) && !this.resultType.isVoid(this.cache) && !block.blockAlwaysEndsWithReturn()) {
        semanticErrorLambdaMissingReturn(this.log, node.range, this.resultType);
      }
    }
  }
  this.resolveNodes($arguments);
  this.resolve(block, null);
  this.resultType = oldResultType;
  this.context.loop = oldLoop;
};
Resolver.prototype.resolveDefault = function(node) {
  var type = node.defaultType();
  this.resolveAsParameterizedType(type);
  this.checkIsValidVariableType(type);
  node.type = type.type;
};
Resolver.prototype.resolveVar = function(node) {
  semanticErrorUnexpectedNode(this.log, node.range, node.kind);
};
Resolver.prototype.resolveFunctionType = function(node) {
  var result = node.functionTypeResult();
  var $arguments = node.functionTypeArguments();
  this.resolveAsParameterizedType(result);
  this.resolveNodesAsVariableTypes($arguments);
  if (!result.type.isError(this.cache)) {
    var argumentTypes = [];
    for (var i = 0; i < $arguments.length; i = i + 1 | 0) {
      var argumentType = $arguments.get(i).type;
      if (argumentType.isError(this.cache)) {
        return;
      }
      argumentTypes.push(argumentType);
    }
    node.become(Node.createType(this.cache.functionType(result.type, argumentTypes)).withRange(node.range));
  }
};
Resolver.prototype.resolveUnaryOperator = function(node) {
  var kind = node.kind;
  var value = node.unaryValue();
  if (kind === 62 && value.kind === 41 && value.asInt() === -2147483648) {
    node.become(value.withRange(node.range).withType(this.cache.intType));
    return;
  }
  this.resolveAsExpression(value);
  var type = value.type;
  if (type.isError(this.cache)) {
    return;
  }
  if (kind === 61 || kind === 62) {
    if (type.isEnum()) {
      node.type = this.cache.intType;
    } else if (type.isNumeric(this.cache)) {
      node.type = type;
    }
  } else if (NodeKind.isUnaryStorageOperator(kind)) {
    if (!type.isEnum() && type.isNumeric(this.cache)) {
      this.checkStorage(value);
      node.type = type;
    }
  } else if (kind === 60) {
    if (type.isBool(this.cache)) {
      node.type = type;
    }
  } else if (kind === 63) {
    if (type.isEnumFlags()) {
      node.type = type;
    } else if (type.isInteger(this.cache)) {
      node.type = this.cache.intType;
    }
  }
  if (node.type.isError(this.cache)) {
    semanticErrorNoUnaryOperator(this.log, node.range, kind, type);
    return;
  }
  this.checkConversion(node.type, value, 0);
};
Resolver.prototype.resolveBinaryOperator = function(node) {
  var kind = node.kind;
  var left = node.binaryLeft();
  var right = node.binaryRight();
  if (NodeKind.isBinaryStorageOperator(kind)) {
    this.resolveAsExpression(left);
    if (kind === 88 || left.type.isNumeric(this.cache)) {
      this.resolveAsExpressionWithConversion(right, left.type, 0);
      this.checkStorage(left);
      node.type = left.type;
      return;
    }
  }
  if (kind === 73 || kind === 83) {
    var leftNeedsContext = this.needsTypeContext(left);
    var rightNeedsContext = this.needsTypeContext(right);
    if (leftNeedsContext && !rightNeedsContext) {
      this.resolveAsExpression(right);
      this.resolveAsExpressionWithTypeContext(left, right.type);
    } else if (!leftNeedsContext && rightNeedsContext) {
      this.resolveAsExpression(left);
      this.resolveAsExpressionWithTypeContext(right, left.type);
    }
  }
  this.resolveAsExpression(left);
  this.resolveAsExpression(right);
  var leftType = left.type;
  var rightType = right.type;
  var commonType = null;
  if (leftType.isError(this.cache) || rightType.isError(this.cache)) {
    return;
  }
  if (kind === 73 || kind === 83) {
    commonType = this.cache.commonImplicitType(leftType, rightType);
    if (commonType !== null) {
      node.type = this.cache.boolType;
    }
  } else if (kind === 68 || kind === 87 || kind === 82 || kind === 72) {
    if (leftType.isNumeric(this.cache) && rightType.isNumeric(this.cache)) {
      node.type = commonType = this.cache.commonImplicitType(leftType, rightType);
    }
  } else if (kind === 84 || kind === 85 || kind === 86) {
    if (leftType.isInteger(this.cache) && rightType.isInteger(this.cache)) {
      node.type = commonType = this.cache.intType;
    }
  } else if (kind === 69 || kind === 70 || kind === 71) {
    if (leftType === rightType && leftType.isEnumFlags()) {
      node.type = commonType = leftType;
    } else if (leftType.isInteger(this.cache) && rightType.isInteger(this.cache)) {
      node.type = commonType = this.cache.intType;
    }
  } else if (kind === 80 || kind === 81) {
    if (leftType.isBool(this.cache) && rightType.isBool(this.cache)) {
      node.type = commonType = this.cache.boolType;
    }
  } else if (kind === 78 || kind === 74 || kind === 79 || kind === 75) {
    if (leftType.isNumeric(this.cache) && rightType.isNumeric(this.cache) || leftType.isString(this.cache) && rightType.isString(this.cache)) {
      commonType = this.cache.commonImplicitType(leftType, rightType);
      node.type = this.cache.boolType;
      node.type = this.cache.boolType;
    }
  }
  if (node.type.isError(this.cache)) {
    semanticErrorNoBinaryOperator(this.log, node.range, kind, leftType, rightType);
    return;
  }
  if (commonType !== null) {
    this.checkConversion(commonType, left, 0);
    this.checkConversion(commonType, right, 0);
  }
};
Resolver.prototype.resolveTertiaryOperator = function(node) {
  var left = node.tertiaryLeft();
  var middle = node.tertiaryMiddle();
  var right = node.tertiaryRight();
  this.resolveAsExpression(left);
  this.resolveAsExpression(middle);
  this.resolveAsExpression(right);
  this.unsupportedNodeKind(node);
};
function Scope(_0) {
  this.type = null;
  this.locals = null;
  this.lexicalParent = _0;
}
Scope.prototype.insertGlobals = function(cache) {
  this.type = cache.globalType;
  this.insert(cache.voidType.symbol);
};
Scope.prototype.linkGlobals = function(cache) {
  cache.intType = this.findType("int");
  cache.boolType = this.findType("bool");
  cache.floatType = this.findType("float");
  cache.doubleType = this.findType("double");
  cache.stringType = this.findType("string");
  cache.listType = this.findType("List");
};
Scope.prototype.findType = function(name) {
  return this.findLocal(name).symbol.type;
};
Scope.prototype.insert = function(symbol) {
  if (this.type !== null) {
    this.type.addMember(new Member(symbol));
    return;
  }
  this.insertLocal(symbol);
};
Scope.prototype.insertLocal = function(symbol) {
  if (this.locals === null) {
    this.locals = new StringMap();
  }
  this.locals.set(symbol.name, new Member(symbol));
};
Scope.prototype.find = function(name) {
  var member = this.findLocal(name);
  return member !== null ? member : this.lexicalParent !== null ? this.lexicalParent.find(name) : null;
};
Scope.prototype.findLocal = function(name) {
  if (this.locals !== null) {
    var member = this.locals.getOrDefault(name, null);
    if (member !== null) {
      return member;
    }
  }
  if (this.type !== null) {
    var member = this.type.findMember(name);
    if (member !== null) {
      return member;
    }
  }
  return null;
};
var SymbolKind = {};
SymbolKind.isGlobalNamespace = function($this) {
  return $this === 8;
};
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
SymbolKind.isConstructor = function($this) {
  return $this === 17;
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
Symbol.prototype.sortParametersByDependencies = function() {
  this.sortedParameters = this.parameters.clone();
  for (var i = 0; i < this.sortedParameters.length; i = i + 1 | 0) {
    var j = i;
    for (; j < this.sortedParameters.length; j = j + 1 | 0) {
      var k = i;
      var parameter = this.sortedParameters.get(j);
      if (!parameter.type.isParameter()) {
        continue;
      }
      var parameterBound = parameter.type.bound();
      if (parameterBound === null) {
        break;
      }
      for (; k < this.sortedParameters.length; k = k + 1 | 0) {
        var other = this.sortedParameters.get(k);
        if (parameter === other || !other.type.isParameter()) {
          continue;
        }
        if (parameterBound !== null && parameterBound.dependsOnParameter(other)) {
          break;
        }
      }
      if (k === this.sortedParameters.length) {
        break;
      }
    }
    if (j < this.sortedParameters.length) {
      var temp = this.sortedParameters.get(i);
      this.sortedParameters.set(i, this.sortedParameters.get(j));
      this.sortedParameters.set(j, temp);
    }
  }
};
Symbol.prototype.isContainedBy = function(symbol) {
  return this.enclosingSymbol === null ? false : this.enclosingSymbol === symbol || this.enclosingSymbol.isContainedBy(symbol);
};
Symbol.prototype.fullName = function() {
  return this.enclosingSymbol !== null && this.kind !== 4 && !SymbolKind.isGlobalNamespace(this.enclosingSymbol.kind) ? this.enclosingSymbol.fullName().append(".").append(this.name) : this.name;
};
Symbol.prototype.hasParameters = function() {
  return this.parameters !== null && this.parameters.length > 0;
};
Symbol.prototype.isEnumValue = function() {
  return SymbolKind.isVariable(this.kind) && this.enclosingSymbol !== null && SymbolKind.isEnum(this.enclosingSymbol.kind) && !this.isFromExtension();
};
Symbol.prototype.isObjectMember = function() {
  return this.enclosingSymbol !== null && SymbolKind.isObject(this.enclosingSymbol.kind);
};
Symbol.prototype.isEnumMember = function() {
  return this.enclosingSymbol !== null && SymbolKind.isEnum(this.enclosingSymbol.kind);
};
Symbol.prototype.isPublic = function() {
  return (this.flags & 1) !== 0;
};
Symbol.prototype.isPrivate = function() {
  return (this.flags & 2) !== 0;
};
Symbol.prototype.isProtected = function() {
  return (this.flags & 4) !== 0;
};
Symbol.prototype.isAbstract = function() {
  return (this.flags & 8) !== 0;
};
Symbol.prototype.isFromExtension = function() {
  return (this.flags & 16) !== 0;
};
Symbol.prototype.isOverride = function() {
  return (this.flags & 32) !== 0;
};
Symbol.prototype.isStatic = function() {
  return (this.flags & 64) !== 0;
};
Symbol.prototype.isVirtual = function() {
  return (this.flags & 128) !== 0;
};
Symbol.prototype.isFinal = function() {
  return (this.flags & 256) !== 0;
};
Symbol.prototype.isInline = function() {
  return (this.flags & 512) !== 0;
};
Symbol.prototype.isImport = function() {
  return (this.flags & 2048) !== 0;
};
Symbol.prototype.isExport = function() {
  return (this.flags & 1024) !== 0;
};
Symbol.prototype.isImportOrExport = function() {
  return this.isImport() || this.isExport();
};
Symbol.prototype.isUninitialized = function() {
  return (this.flags & 12288) === 0;
};
Symbol.prototype.isInitializing = function() {
  return (this.flags & 4096) !== 0;
};
Symbol.prototype.isInitialized = function() {
  return (this.flags & 8192) !== 0;
};
Symbol.prototype.hasLocationError = function() {
  return (this.flags & 16384) !== 0;
};
Symbol.prototype.hasModifierErrors = function() {
  return (this.flags & 32768) !== 0;
};
function Type(_0) {
  this.members = new StringMap();
  this.relevantTypes = null;
  this.substitutions = null;
  this.uniqueID = (Type.nextUniqueID = Type.nextUniqueID + 1 | 0) - 1 | 0;
  this.symbol = _0;
}
Type.prototype.$constructor = function() {
  if (this.symbol === null) {
    return null;
  }
  return this.members.getOrDefault("new", null);
};
Type.prototype.hasBaseType = function(type) {
  if (this.isParameter()) {
    var upper = this.bound();
    return upper !== null && upper.hasBaseType(type);
  }
  if (!this.isClass() && !this.isInterface()) {
    return false;
  }
  if (this === type) {
    return true;
  }
  if (this.relevantTypes !== null) {
    for (var i = 0; i < this.relevantTypes.length; i = i + 1 | 0) {
      if (this.relevantTypes.get(i).hasBaseType(type)) {
        return true;
      }
    }
  }
  return false;
};
Type.prototype.addMember = function(member) {
  this.members.set(member.symbol.name, member);
};
Type.prototype.copyMembersFrom = function(other) {
  var otherMembers = other.members.values();
  for (var i = 0; i < otherMembers.length; i = i + 1 | 0) {
    var member = otherMembers.get(i);
    if (!this.members.has(member.symbol.name)) {
      this.members.set(member.symbol.name, member);
    }
  }
};
Type.prototype.findMember = function(name) {
  return this.members.getOrDefault(name, null);
};
Type.environmentToString = function(parameters, substitutions) {
  var text = "[";
  for (var i = 0; i < parameters.length; i = i + 1 | 0) {
    if (i > 0) {
      text = text.append(", ");
    }
    text = text.append(parameters.get(i).name).append(" => ").append(substitutions.get(i).toString());
  }
  return text.append("]");
};
Type.prototype.toString = function() {
  if (this.isFunction()) {
    var text = this.resultType().toString().append(" fn(");
    var $arguments = this.argumentTypes();
    for (var i = 0; i < $arguments.length; i = i + 1 | 0) {
      if (i > 0) {
        text = text.append(", ");
      }
      text = text.append($arguments.get(i).toString());
    }
    return text.append(")");
  }
  if (this.hasParameters()) {
    var text = "";
    for (var i = 0; i < this.symbol.parameters.length; i = i + 1 | 0) {
      if (i > 0) {
        text = text.append(", ");
      }
      text = text.append(this.isParameterized() ? this.substitutions.get(i).toString() : this.symbol.parameters.get(i).name);
    }
    return this.symbol.fullName().append("<").append(text).append(">");
  }
  return this.symbol.fullName();
};
Type.prototype.hasParameters = function() {
  return this.symbol !== null && this.symbol.hasParameters();
};
Type.prototype.isParameterized = function() {
  return this.substitutions !== null;
};
Type.prototype.hasRelevantTypes = function() {
  return this.relevantTypes !== null && this.relevantTypes.length > 0;
};
Type.prototype.baseClass = function() {
  if (!this.hasRelevantTypes()) {
    return null;
  }
  var first = this.relevantTypes.get(0);
  return first.isClass() ? first : null;
};
Type.prototype.bound = function() {
  return this.hasRelevantTypes() ? this.relevantTypes.get(0) : null;
};
Type.prototype.dependsOnParameter = function(parameter) {
  if (this.symbol === parameter || this.hasParameters() && this.symbol.parameters.indexOf(parameter) >= 0 || this.isParameterized() && this.substitutions.indexOf(parameter.type) >= 0) {
    return true;
  }
  if (this.hasRelevantTypes()) {
    for (var i = 0; i < this.relevantTypes.length; i = i + 1 | 0) {
      var type = this.relevantTypes.get(i);
      if (type.dependsOnParameter(parameter)) {
        return true;
      }
    }
  }
  return false;
};
Type.prototype.resultType = function() {
  return this.relevantTypes.get(0);
};
Type.prototype.argumentTypes = function() {
  return this.relevantTypes.slice(1, this.relevantTypes.length);
};
Type.prototype.isVoid = function(cache) {
  return this === cache.voidType;
};
Type.prototype.isInt = function(cache) {
  return this === cache.intType;
};
Type.prototype.isNull = function(cache) {
  return this === cache.nullType;
};
Type.prototype.isBool = function(cache) {
  return this === cache.boolType;
};
Type.prototype.isFloat = function(cache) {
  return this === cache.floatType;
};
Type.prototype.isDouble = function(cache) {
  return this === cache.doubleType;
};
Type.prototype.isString = function(cache) {
  return this === cache.stringType;
};
Type.prototype.isList = function(cache) {
  return this.symbol === cache.listType.symbol;
};
Type.prototype.isError = function(cache) {
  return this === cache.errorType;
};
Type.prototype.isFunction = function() {
  return this.symbol === null;
};
Type.prototype.isNamespace = function() {
  return this.symbol !== null && SymbolKind.isNamespace(this.symbol.kind);
};
Type.prototype.isEnum = function() {
  return this.symbol !== null && SymbolKind.isEnum(this.symbol.kind);
};
Type.prototype.isEnumFlags = function() {
  return this.symbol !== null && this.symbol.kind === 11;
};
Type.prototype.isParameter = function() {
  return this.symbol !== null && this.symbol.kind === 4;
};
Type.prototype.isObject = function() {
  return this.symbol !== null && SymbolKind.isObject(this.symbol.kind);
};
Type.prototype.isClass = function() {
  return this.symbol !== null && this.symbol.kind === 12;
};
Type.prototype.isStruct = function() {
  return this.symbol !== null && this.symbol.kind === 13;
};
Type.prototype.isInterface = function() {
  return this.symbol !== null && this.symbol.kind === 14;
};
Type.prototype.isReference = function() {
  return this.isClass() || this.isInterface() || this.isFunction();
};
Type.prototype.isInteger = function(cache) {
  return this.isInt(cache) || this.isEnum();
};
Type.prototype.isReal = function(cache) {
  return this.isFloat(cache) || this.isDouble(cache);
};
Type.prototype.isNumeric = function(cache) {
  return this.isInteger(cache) || this.isReal(cache);
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
  symbol.flags = symbol.flags | 8192;
  return type;
};
TypeCache.commonBaseClass = function(left, right) {
  for (var a = left; a !== null; a = a.baseClass()) {
    for (var b = right; b !== null; b = b.baseClass()) {
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
    seed = hashCombine(seed, relevantTypes.get(i).uniqueID);
  }
  return seed;
};
TypeCache.areTypeListsEqual = function(left, right) {
  var n = left.length;
  if (n !== right.length) {
    return false;
  }
  for (var i = 0; i < n; i = i + 1 | 0) {
    if (left.get(i) !== right.get(i)) {
      return false;
    }
  }
  return true;
};
TypeCache.prototype.substitute = function(type, parameters, substitutions) {
  trace.log("substitute ".append(type.toString()).append(" with ").append(Type.environmentToString(parameters, substitutions)));
  trace.indent();
  var result;
  if (type.isFunction()) {
    result = this.parameterize(null, this.substituteAll(type.relevantTypes, parameters, substitutions));
  } else if (!type.hasParameters()) {
    var index = parameters.indexOf(type.symbol);
    result = index >= 0 ? substitutions.get(index) : type;
  } else {
    result = this.parameterize(type, this.substituteAll(type.substitutions, parameters, substitutions));
  }
  trace.log("substitution gave ".append(result.toString()));
  trace.dedent();
  return result;
};
TypeCache.prototype.substituteAll = function(types, parameters, substitutions) {
  var results = [];
  for (var i = 0; i < types.length; i = i + 1 | 0) {
    results.push(this.substitute(types.get(i), parameters, substitutions));
  }
  return results;
};
TypeCache.prototype.parameterize = function(unparameterized, substitutions) {
  var symbol = unparameterized !== null ? unparameterized.symbol : null;
  if (symbol !== null) {
  }
  var hash = TypeCache.computeHashCode(symbol, substitutions);
  var existingTypes = this.hashTable.getOrDefault(hash, null);
  if (existingTypes !== null) {
    for (var i = 0; i < existingTypes.length; i = i + 1 | 0) {
      var existing = existingTypes.get(i);
      if (symbol === existing.symbol && (symbol === null && TypeCache.areTypeListsEqual(substitutions, existing.relevantTypes) || symbol !== null && TypeCache.areTypeListsEqual(substitutions, existing.substitutions))) {
        return existing;
      }
    }
  } else {
    existingTypes = [];
    this.hashTable.set(hash, existingTypes);
  }
  if (symbol !== null && substitutions !== null) {
    trace.log("parameterize ".append(unparameterized !== null ? unparameterized.toString() : "null").append(" with ").append(Type.environmentToString(symbol.parameters, substitutions)));
    trace.indent();
  }
  var type = new Type(symbol);
  if (symbol !== null) {
    type.substitutions = substitutions;
    type.relevantTypes = this.substituteAll(unparameterized.relevantTypes, symbol.parameters, substitutions);
    var members = unparameterized.members.values();
    for (var i = 0; i < members.length; i = i + 1 | 0) {
      var member = members.get(i);
      var clone = new Member(member.symbol);
      clone.dependency = member.dependency !== null ? member.dependency : member;
      clone.parameterizedType = type;
      var parameterizedType = member.parameterizedType;
      if (parameterizedType !== null) {
        var merged = [];
        for (var j = 0; j < parameterizedType.substitutions.length; j = j + 1 | 0) {
          var parameter = parameterizedType.symbol.parameters.get(j);
          var index = symbol.parameters.indexOf(parameter);
          merged.push(index >= 0 ? substitutions.get(index) : this.substitute(parameterizedType.substitutions.get(j), symbol.parameters, substitutions));
        }
        clone.parameterizedType = this.parameterize(parameterizedType.symbol.type, merged);
      }
      type.addMember(clone);
    }
    if (substitutions !== null) {
      trace.log("parameterize gave ".append(type.toString()));
      trace.dedent();
    }
  } else {
    type.relevantTypes = substitutions;
  }
  existingTypes.push(type);
  return type;
};
TypeCache.prototype.functionType = function(result, $arguments) {
  $arguments.unshift(result);
  return this.parameterize(null, $arguments);
};
TypeCache.prototype.canCastToNumeric = function(type) {
  return type.isNumeric(this) || type.isBool(this);
};
TypeCache.prototype.commonImplicitType = function(left, right) {
  if (left === right) {
    return left;
  }
  if (this.canImplicitlyConvert(left, right)) {
    return right;
  }
  if (this.canImplicitlyConvert(right, left)) {
    return left;
  }
  if (left.isNumeric(this) && right.isNumeric(this)) {
    return left.isInteger(this) && right.isInteger(this) ? this.intType : left.isFloat(this) && right.isFloat(this) ? this.floatType : this.doubleType;
  }
  if (left.isClass() && right.isClass()) {
    return TypeCache.commonBaseClass(left, right);
  }
  return null;
};
TypeCache.prototype.canImplicitlyConvert = function(from, to) {
  if (from === to) {
    return true;
  }
  if (from.isNull(this) && to.isReference()) {
    return true;
  }
  if ((from.isInteger(this) || from.isFloat(this)) && to.isDouble(this)) {
    return true;
  }
  if (from.isEnum() && (to.isInt(this) || to.isDouble(this))) {
    return true;
  }
  if (from.hasBaseType(to)) {
    return true;
  }
  return false;
};
TypeCache.prototype.canExplicitlyConvert = function(from, to) {
  if (this.canImplicitlyConvert(from, to)) {
    return true;
  }
  if (this.canCastToNumeric(from) && this.canCastToNumeric(to)) {
    return true;
  }
  if (to.hasBaseType(from)) {
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
  if (this.previousResult !== null && this.previousResult.program !== null && this.previousSource !== null && column >= 0 && column < this.previousSource.contentsOfLine(line).length && this.previousResult.program.children.length === 2) {
    var index = this.previousSource.lineOffsets.get(line) + column | 0;
    var previousFile = this.previousResult.program.children.get(1);
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
  var i;
  for (i = 0; i < compiler.log.diagnostics.length; i = i + 1 | 0) {
    var diagnostic = compiler.log.diagnostics.get(i);
    var range = diagnostic.range;
    if (range.source === this.previousSource) {
      var start = range.source.indexToLineColumn(range.start);
      var type;
      switch (diagnostic.kind) {
      case 0:
        type = "error";
        break;
      case 1:
        type = "warning";
        break;
      }
      diagnostics.push(new LanguageServiceDiagnostic(type, diagnostic.text, start.line, start.column, range.start, range.singleLineLength()));
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
  if (this.previousResult.program !== null && column >= 0 && column <= this.previousSource.contentsOfLine(line).length && this.previousResult.program.children.length === 2) {
    var index = this.previousSource.lineOffsets.get(line) + column | 0;
    var previousFile = this.previousResult.program.children.get(1);
    return service.completionsFromPosition(previousFile, this.previousResult.resolver, this.previousSource, index);
  }
  return null;
};
var service = {};
function nodeKindCheck(kind) {
  return function(node) {
    return node.kind === kind;
  };
}
function checkAllNodeListKinds(node, check) {
  return checkAllNodeKinds(node.children, check);
}
function checkAllNodeKinds(nodes, check) {
  for (var i = 0; i < nodes.length; i = i + 1 | 0) {
    if (!check(nodes.get(i))) {
      return false;
    }
  }
  return true;
}
function createOperatorMap() {
  var result = new IntMap();
  result.set(60, new OperatorInfo("!", 13, 0));
  result.set(61, new OperatorInfo("+", 13, 0));
  result.set(62, new OperatorInfo("-", 13, 0));
  result.set(63, new OperatorInfo("~", 13, 0));
  result.set(64, new OperatorInfo("++", 13, 0));
  result.set(65, new OperatorInfo("--", 13, 0));
  result.set(66, new OperatorInfo("++", 14, 0));
  result.set(67, new OperatorInfo("--", 14, 0));
  result.set(68, new OperatorInfo("+", 11, 1));
  result.set(69, new OperatorInfo("&", 7, 1));
  result.set(70, new OperatorInfo("|", 5, 1));
  result.set(71, new OperatorInfo("^", 6, 1));
  result.set(72, new OperatorInfo("/", 12, 1));
  result.set(73, new OperatorInfo("==", 8, 1));
  result.set(74, new OperatorInfo(">", 9, 1));
  result.set(75, new OperatorInfo(">=", 9, 1));
  result.set(76, new OperatorInfo("in", 9, 1));
  result.set(77, new OperatorInfo("[]", 15, 1));
  result.set(78, new OperatorInfo("<", 9, 1));
  result.set(79, new OperatorInfo("<=", 9, 1));
  result.set(80, new OperatorInfo("&&", 4, 1));
  result.set(81, new OperatorInfo("||", 3, 1));
  result.set(82, new OperatorInfo("*", 12, 1));
  result.set(83, new OperatorInfo("!=", 8, 1));
  result.set(84, new OperatorInfo("%", 12, 1));
  result.set(85, new OperatorInfo("<<", 10, 1));
  result.set(86, new OperatorInfo(">>", 10, 1));
  result.set(87, new OperatorInfo("-", 11, 1));
  result.set(88, new OperatorInfo("=", 2, 2));
  result.set(89, new OperatorInfo("+=", 2, 2));
  result.set(90, new OperatorInfo("&=", 2, 2));
  result.set(91, new OperatorInfo("|=", 2, 2));
  result.set(92, new OperatorInfo("^=", 2, 2));
  result.set(93, new OperatorInfo("/=", 2, 2));
  result.set(94, new OperatorInfo("*=", 2, 2));
  result.set(95, new OperatorInfo("%=", 2, 2));
  result.set(96, new OperatorInfo("<<=", 2, 2));
  result.set(97, new OperatorInfo(">>=", 2, 2));
  result.set(98, new OperatorInfo("-=", 2, 2));
  return result;
}
json.dump = function(node) {
  var visitor = new json.DumpVisitor();
  visitor.visit(node);
  return visitor.builder.toString();
};
lisp.dump = function(node) {
  var visitor = new lisp.DumpVisitor();
  visitor.visit(node);
  return visitor.builder.toString();
};
xml.dump = function(node) {
  var visitor = new xml.DumpVisitor();
  visitor.visit(node);
  return visitor.builder.toString();
};
function encodeBase64(data) {
  var result = new StringBuilder();
  var n = data.length;
  var i;
  for (i = 0; (i + 2 | 0) < n; i = i + 3 | 0) {
    var c = data.codeUnitAt(i) << 16 | data.codeUnitAt(i + 1 | 0) << 8 | data.codeUnitAt(i + 2 | 0);
    result.append(BASE64.get(c >> 18)).append(BASE64.get(c >> 12 & 63)).append(BASE64.get(c >> 6 & 63)).append(BASE64.get(c & 63));
  }
  if (i < n) {
    var a = data.codeUnitAt(i);
    result.append(BASE64.get(a >> 2));
    if ((i + 1 | 0) < n) {
      var b = data.codeUnitAt(i + 1 | 0);
      result.append(BASE64.get(a << 4 & 48 | b >> 4)).append(BASE64.get(b << 2 & 60)).append("=");
    } else {
      result.append(BASE64.get(a << 4 & 48)).append("==");
    }
  }
  return result.toString();
}
function hashCombine(left, right) {
  return left ^ ((right - 1640531527 | 0) + (left << 6) | 0) + (left >> 2);
}
function doubleToString(value) {
  var result = value.toString();
  if (result.indexOf(".") < 0) {
    result = result.append(".0");
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
  var result = new StringBuilder();
  var start = 1;
  var i = 1;
  while ((i + 1 | 0) < text.length) {
    var c = text.codeUnitAt(i);
    if (c === 92) {
      result.append(text.slice(start, i));
      var escape = i = i + 1 | 0;
      if ((i + 1 | 0) < text.length) {
        c = text.codeUnitAt((i = i + 1 | 0) - 1 | 0);
        if (c === 110) {
          result.append("\n");
          start = i;
          continue;
        } else if (c === 114) {
          result.append("\r");
          start = i;
          continue;
        } else if (c === 116) {
          result.append("\t");
          start = i;
          continue;
        } else if (c === 101) {
          result.append("\x1B");
          start = i;
          continue;
        } else if (c === 48) {
          result.append("\0");
          start = i;
          continue;
        } else if (c === 92 || c === 34 || c === 39) {
          result.append(string.fromCodeUnit(c));
          start = i;
          continue;
        } else if (c === 120) {
          var c0 = (i + 1 | 0) < text.length ? parseHexCharacter(text.codeUnitAt((i = i + 1 | 0) - 1 | 0)) : -1;
          var c1 = (i + 1 | 0) < text.length ? parseHexCharacter(text.codeUnitAt((i = i + 1 | 0) - 1 | 0)) : -1;
          if (c0 !== -1 && c1 !== -1) {
            result.append(string.fromCodeUnit(c0 << 4 | c1));
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
  result.append(text.slice(start, i));
  return isValidString ? new StringContent(result.toString()) : null;
}
function quoteString(text, quote) {
  var result = new StringBuilder();
  var quoteString = string.fromCodeUnit(quote);
  result.append(quoteString);
  var start = 0;
  var i;
  for (i = 0; i < text.length; i = i + 1 | 0) {
    var c = text.codeUnitAt(i);
    if (c === quote) {
      result.append(text.slice(start, i)).append("\\").append(quoteString);
      start = i + 1 | 0;
    } else if (c === 10) {
      result.append(text.slice(start, i)).append("\\n");
      start = i + 1 | 0;
    } else if (c === 13) {
      result.append(text.slice(start, i)).append("\\r");
      start = i + 1 | 0;
    } else if (c === 9) {
      result.append(text.slice(start, i)).append("\\t");
      start = i + 1 | 0;
    } else if (c === 0) {
      result.append(text.slice(start, i)).append("\\0");
      start = i + 1 | 0;
    } else if (c === 92) {
      result.append(text.slice(start, i)).append("\\\\");
      start = i + 1 | 0;
    } else if (c < 32 || c >= 127 && c <= 255) {
      result.append(text.slice(start, i)).append("\\x").append(HEX.get(c >> 4)).append(HEX.get(c & 15));
      start = i + 1 | 0;
    }
  }
  result.append(text.slice(start, i)).append(quoteString);
  return result.toString();
}
function replace(text, before, after) {
  var result = "";
  var index;
  while ((index = text.indexOf(before)) !== -1) {
    result = result.append(text.slice(0, index)).append(after);
    text = text.slice(index + before.length | 0, text.length);
  }
  return result.append(text);
}
function repeat(text, count) {
  var result = "";
  for (var i = 0; i < count; i = i + 1 | 0) {
    result = result.append(text);
  }
  return result;
}
function plural(value, singular, plural) {
  return value === 1 ? singular : plural;
}
function splitPath(path) {
  var slashIndex = Math.imax(path.lastIndexOf("/"), path.lastIndexOf("\\"));
  return slashIndex === -1 ? new SplitPath(".", path) : new SplitPath(path.slice(0, slashIndex), path.slice(slashIndex + 1 | 0, path.length));
}
function joinPath(directory, entry) {
  return directory.append("/").append(entry);
}
function formatNumber(number) {
  return (Math.round(number * 10) / 10).toString();
}
function bytesToString(bytes) {
  if (bytes === 1) {
    return "1 byte";
  }
  if (bytes < 1024) {
    return bytes.toString().append(" bytes");
  }
  if (bytes < 1048576) {
    return formatNumber(bytes / 1024).append("kb");
  }
  if (bytes < 1073741824) {
    return formatNumber(bytes / 1048576).append("mb");
  }
  return formatNumber(bytes / 1073741824).append("gb");
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
  io.printWithColor(1, text.append("\n"));
};
frontend.printNote = function(text) {
  io.printWithColor(90, "note: ");
  io.printWithColor(1, text.append("\n"));
};
frontend.printWarning = function(text) {
  io.printWithColor(95, "warning: ");
  io.printWithColor(1, text.append("\n"));
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
    var arg = args.get(i);
    if (arg.length === 0) {
      continue;
    }
    if (arg.codeUnitAt(0) !== 45) {
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
    frontend.printError("Unknown flag ".append(quoteString(arg, 34)));
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
    frontend.printError("Unknown target language ".append(quoteString(flags.target, 34)));
    return 1;
  }
  var options = new CompilerOptions();
  options.targetFormat = target;
  options.optimize = flags.optimize;
  options.outputFile = flags.shouldWriteToStdout() ? "<stdout>" : flags.outputFile;
  options.jsSourceMap = flags.jsSourceMap && flags.outputFile !== "" && target === 1;
  for (var i = 0; i < inputs.length; i = i + 1 | 0) {
    var input = inputs.get(i);
    var source = io.readFile(input);
    if (source === null) {
      frontend.printError("Could not read from ".append(quoteString(input, 34)));
      return 1;
    }
    options.inputs.push(source);
  }
  var compiler = new Compiler();
  var result = compiler.compile(options);
  var log = compiler.log;
  for (var i = 0; i < log.diagnostics.length; i = i + 1 | 0) {
    var diagnostic = log.diagnostics.get(i);
    if (!diagnostic.range.isEmpty()) {
      io.printWithColor(1, diagnostic.range.locationString().append(": "));
    }
    switch (diagnostic.kind) {
    case 1:
      frontend.printWarning(diagnostic.text);
      break;
    case 0:
      frontend.printError(diagnostic.text);
      break;
    }
    if (!diagnostic.range.isEmpty()) {
      var formatted = diagnostic.range.format(io.terminalWidth);
      io.print(formatted.line.append("\n"));
      io.printWithColor(92, formatted.range.append("\n"));
    }
    if (!diagnostic.noteRange.isEmpty()) {
      io.printWithColor(1, diagnostic.noteRange.locationString().append(": "));
      frontend.printNote(diagnostic.noteText);
      var formatted = diagnostic.noteRange.format(io.terminalWidth);
      io.print(formatted.line.append("\n"));
      io.printWithColor(92, formatted.range.append("\n"));
    }
  }
  var hasErrors = log.errorCount > 0;
  var hasWarnings = log.warningCount > 0;
  var summary = "";
  if (hasWarnings) {
    summary = summary.append(log.warningCount.toString().append(plural(log.warningCount, " warning", " warnings")));
    if (hasErrors) {
      summary = summary.append(" and ");
    }
  }
  if (hasErrors) {
    summary = summary.append(log.errorCount.toString().append(plural(log.errorCount, " error", " errors")));
  }
  if (hasWarnings || hasErrors) {
    io.print(summary.append(" generated\n"));
  }
  if (flags.verbose) {
    io.print(compiler.statistics(result).append("\n"));
  }
  if (hasErrors) {
    return 1;
  }
  if (result.outputs !== null) {
    for (var i = 0; i < result.outputs.length; i = i + 1 | 0) {
      var output = result.outputs.get(i);
      if (flags.shouldWriteToStdout()) {
        io.print(output.contents);
        continue;
      }
      if (!io.writeFile(output.name, output.contents)) {
        frontend.printError("Could not write to ".append(quoteString(output.name, 34)));
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
    while (yy_current_state !== 254) {
      var index = 0;
      if (yy_cp < text_length) {
        var c = text.codeUnitAt(yy_cp);
        if (c < 127) {
          index = c;
        }
      } else {
        break;
      }
      var yy_c = yy_ec.get(index);
      if (yy_accept.get(yy_current_state) !== 97) {
        yy_last_accepting_state = yy_current_state;
        yy_last_accepting_cpos = yy_cp;
      }
      while (yy_chk.get(yy_base.get(yy_current_state) + yy_c | 0) !== yy_current_state) {
        yy_current_state = yy_def.get(yy_current_state);
        if (yy_current_state >= 255) {
          yy_c = yy_meta.get(yy_c);
        }
      }
      yy_current_state = yy_nxt.get(yy_base.get(yy_current_state) + yy_c | 0);
      yy_cp = yy_cp + 1 | 0;
    }
    var yy_act = yy_accept.get(yy_current_state);
    while (yy_act === 97) {
      yy_cp = yy_last_accepting_cpos;
      yy_current_state = yy_last_accepting_state;
      yy_act = yy_accept.get(yy_current_state);
    }
    if (yy_act === 96) {
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
    var token = tokens.get(i);
    var tokenKind = token.kind;
    var tokenStartsWithGreaterThan = token.text.length > 0 && token.text.codeUnitAt(0) === 62;
    while (stack.length > 0) {
      var top = tokens.get(stack.get(stack.length - 1 | 0));
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
        var top = tokens.get(stack.get(stack.length - 1 | 0));
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
            tokens.insert(i + 1 | 0, new Token(new Range(range.source, start + 1 | 0, range.end), kind, text));
            token.range = new Range(range.source, start, start + 1 | 0);
            token.text = ">";
          }
          top.kind = 98;
          token.kind = 99;
        }
        break;
      }
    }
  }
}
function simpleQuote(name) {
  return "\"".append(name).append("\"");
}
function firstLineOf(text) {
  var index = text.indexOf("\n");
  return index < 0 ? text : text.slice(0, index);
}
function syntaxErrorInvalidEscapeSequence(log, range, text) {
  log.error(range, "Invalid escape sequence ".append(firstLineOf(simpleQuote(text))));
}
function syntaxErrorInvalidCharacter(log, range, text) {
  log.error(range, "Invalid character literal ".append(firstLineOf(text)));
}
function syntaxErrorInvalidInteger(log, range, text) {
  log.error(range, "Invalid integer literal ".append(text));
}
function syntaxErrorExtraData(log, range, text) {
  log.error(range, "Syntax error ".append(simpleQuote(text)));
}
function syntaxErrorUnexpectedToken(log, token) {
  log.error(token.range, "Unexpected ".append(TokenKind.toString(token.kind)));
}
function syntaxErrorExpectedToken(log, found, expected) {
  log.error(found.range, "Expected ".append(TokenKind.toString(expected)).append(" but found ").append(TokenKind.toString(found.kind)));
}
function syntaxErrorUnterminatedToken(log, range, what) {
  log.error(range, "Unterminated ".append(what));
}
function syntaxErrorBadForEach(log, range) {
  log.error(range, "More than one variable inside a for-each loop");
}
function syntaxWarningOctal(log, range) {
  log.warning(range, "Use the prefix \"0o\" for octal numbers");
}
function scanForToken(context, kind, tokenScan) {
  if (context.expect(kind)) {
    return true;
  }
  while (!context.peek(30)) {
    var currentKind = context.current().kind;
    if (currentKind === 80 || currentKind === 79 || currentKind === 78 || currentKind === 81 && tokenScan === 1) {
      return context.eat(kind);
    }
    if (tokenScan === 1 && (currentKind === 1 || currentKind === 16 || currentKind === 19 || currentKind === 22 || currentKind === 26 || currentKind === 31 || currentKind === 34 || currentKind === 36 || currentKind === 39 || currentKind === 43 || currentKind === 44 || currentKind === 47 || currentKind === 48 || currentKind === 65 || currentKind === 70 || currentKind === 72 || currentKind === 73 || currentKind === 74 || currentKind === 77 || currentKind === 84 || currentKind === 86 || currentKind === 88 || currentKind === 92 || currentKind === 0 || currentKind === 94 || currentKind === 95)) {
      return true;
    }
    context.next();
  }
  return false;
}
function parseGroup(context, allowLambda) {
  var token = context.current();
  if (!context.expect(57)) {
    return null;
  }
  if (allowLambda === 0 || !context.eat(80)) {
    var value = pratt.parse(context, 0);
    scanForToken(context, 80, 1);
    return value;
  }
  if (!context.peek(54)) {
    context.expect(54);
    return Node.createError().withRange(context.spanSince(token.range));
  }
  return Node.createSequence([]).withRange(context.spanSince(token.range));
}
function parseName(context) {
  var token = context.current();
  if (!context.expect(42)) {
    return null;
  }
  return Node.createName(token.text).withRange(token.range);
}
function parseBlock(context, hint) {
  var token = context.current();
  if (!context.expect(55)) {
    return null;
  }
  var statements = parseStatements(context, hint);
  scanForToken(context, 78, 0);
  return Node.createBlock(statements).withRange(context.spanSince(token.range));
}
function parseBlockOrStatement(context, hint) {
  if (context.peek(55)) {
    return parseBlock(context, hint);
  }
  var statement = parseStatement(context, hint);
  if (statement === null) {
    return null;
  }
  return Node.createBlock([statement]).withRange(statement.range);
}
function parseLambdaBlock(context) {
  if (context.peek(55)) {
    return parseBlock(context, 0);
  }
  if (context.peek(80) || context.peek(21) || context.peek(81)) {
    return Node.createBlock([]);
  }
  var value = pratt.parse(context, 1);
  return Node.createBlock([Node.createImplicitReturn(value).withRange(value.range)]).withRange(value.range);
}
function parseCaseStatement(context) {
  var token = context.current();
  var values = [];
  if (!context.eat(24)) {
    if (!context.expect(17)) {
      return null;
    }
    do {
      if (context.peek(55)) {
        context.unexpectedToken();
        values.push(Node.createError());
        break;
      }
      values.push(pratt.parse(context, 1));
    } while (context.eat(21));
  }
  var block = parseBlock(context, 0);
  if (block === null) {
    return null;
  }
  return Node.createCase(values, block).withRange(context.spanSince(token.range));
}
function parseStatements(context, hint) {
  var statements = [];
  while (!context.peek(78) && !context.peek(30)) {
    if (hint === 1) {
      var declaration = parseEnumValueDeclaration(context);
      if (declaration === null) {
        break;
      }
      statements.push(declaration);
      if (!context.eat(21)) {
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
  var token = context.current();
  var $arguments = [];
  if (!context.expect(57)) {
    return null;
  }
  while (!context.peek(80)) {
    if ($arguments.length > 0 && !context.expect(21)) {
      break;
    }
    var type = parseType(context);
    var name = parseName(context);
    if (name === null) {
      break;
    }
    $arguments.push(Node.createVariable(name, type, null).withRange(Range.span(type.range, name.range)));
  }
  scanForToken(context, 80, 0);
  return Node.createNodeList($arguments).withRange(context.spanSince(token.range));
}
function parseType(context) {
  return pratt.parse(context, 14);
}
function parseEnumValueDeclaration(context) {
  var name = parseName(context);
  if (name === null) {
    return null;
  }
  var value = context.eat(2) ? pratt.parse(context, 1) : null;
  return Node.createVariable(name, null, value).withRange(context.spanSince(name.range));
}
function parseParameter(context) {
  var token = context.current();
  var name = parseName(context);
  if (name === null) {
    return null;
  }
  var bound = context.eat(53) ? pratt.parse(context, 1) : null;
  return Node.createParameter(name, bound).withRange(context.spanSince(token.range));
}
function parseParameters(context) {
  var token = context.current();
  var parameters = [];
  if (!context.eat(98)) {
    return null;
  }
  while (parameters.length === 0 || !context.peek(99)) {
    if (parameters.length > 0 && !context.expect(21)) {
      break;
    }
    var parameter = parseParameter(context);
    if (parameter === null) {
      break;
    }
    parameters.push(parameter);
  }
  scanForToken(context, 99, 1);
  return Node.createNodeList(parameters).withRange(context.spanSince(token.range));
}
function parseArgumentList(context, left, right, comma) {
  var values = [];
  if (!context.expect(left)) {
    return values;
  }
  while (!context.peek(right)) {
    if (comma === 0 && values.length > 0 && !context.expect(21)) {
      break;
    }
    var value = pratt.parse(context, 1);
    values.push(value);
    if (NodeKind.isError(value.kind) || comma === 1 && !context.peek(right) && !context.expect(21)) {
      break;
    }
  }
  scanForToken(context, right, 1);
  return values;
}
function parseTypeList(context, end) {
  var token = context.current();
  var types = [];
  while (types.length === 0 || !context.peek(end)) {
    if (context.peek(55)) {
      context.unexpectedToken();
      break;
    }
    if (types.length > 0 && !context.eat(21)) {
      context.expect(end);
      break;
    }
    if (context.peek(55)) {
      context.unexpectedToken();
      break;
    }
    types.push(parseType(context));
  }
  return types;
}
function parseObject(context, kind) {
  var token = context.next();
  var name = parseName(context);
  if (name === null) {
    return null;
  }
  var parameters = parseParameters(context);
  var bases = context.eat(20) ? Node.createNodeList(parseTypeList(context, 55)) : null;
  var block = parseBlock(context, 2);
  if (block === null) {
    return null;
  }
  return Node.createObject(kind, name, parameters, bases, block).withRange(context.spanSince(token.range));
}
function parseNestedNamespaceBlock(context) {
  if (!context.eat(27)) {
    return parseBlock(context, 0);
  }
  var name = parseName(context);
  var block = parseNestedNamespaceBlock(context);
  if (block === null) {
    return null;
  }
  var range = context.spanSince((name !== null ? name : block).range);
  return Node.createBlock([Node.createNamespace(name, block).withRange(range)]).withRange(range);
}
function parseNamespace(context) {
  var token = context.next();
  var name = parseName(context);
  if (name === null) {
    return null;
  }
  var block = parseNestedNamespaceBlock(context);
  if (block === null) {
    return null;
  }
  return Node.createNamespace(name, block).withRange(context.spanSince(token.range));
}
function parseConstructor(context, hint) {
  if (hint !== 2) {
    context.unexpectedToken();
    return null;
  }
  var token = context.next();
  var name = Node.createName(token.text).withRange(token.range);
  var $arguments = parseArgumentVariables(context);
  if ($arguments === null) {
    return null;
  }
  var superInitializer = null;
  var memberInitializers = null;
  if (context.eat(20)) {
    if (context.peek(87)) {
      superInitializer = parseSuperCall(context);
    }
    if (superInitializer === null || context.eat(21)) {
      var values = [];
      var first = context.current();
      do {
        var member = parseName(context);
        if (member === null) {
          break;
        }
        if (!context.expect(2)) {
          break;
        }
        var value = pratt.parse(context, 1);
        values.push(Node.createMemberInitializer(member, value).withRange(context.spanSince(member.range)));
      } while (context.eat(21));
      memberInitializers = Node.createNodeList(values).withRange(context.spanSince(first.range));
    }
  }
  var block = null;
  if (!context.eat(81)) {
    block = parseBlock(context, 0);
    if (block === null) {
      return null;
    }
  }
  return Node.createConstructor(name, $arguments, block, superInitializer, memberInitializers).withRange(context.spanSince(token.range));
}
function parseExpression(context) {
  if (context.peek(55)) {
    context.unexpectedToken();
    return null;
  }
  var token = context.current();
  var value = pratt.parse(context, 0);
  if (!scanForToken(context, 81, 1) && context.current().range.start === token.range.start) {
    context.next();
  }
  return Node.createExpression(value).withRange(context.spanSince(token.range));
}
function parseModifier(context, hint, flag) {
  var token = context.next();
  var name = Node.createName(token.text).withRange(token.range);
  var block = parseBlockOrStatement(context, hint);
  if (block === null) {
    return null;
  }
  return Node.createModifier(name, block.removeChildren()).withRange(context.spanSince(token.range));
}
function parseReturn(context) {
  var token = context.next();
  var value = null;
  if (!context.eat(81)) {
    value = pratt.parse(context, 0);
    scanForToken(context, 81, 1);
  }
  return Node.createReturn(value).withRange(context.spanSince(token.range));
}
function parseBreak(context) {
  var token = context.next();
  context.expect(81);
  return Node.createBreak().withRange(context.spanSince(token.range));
}
function parseContinue(context) {
  var token = context.next();
  context.expect(81);
  return Node.createContinue().withRange(context.spanSince(token.range));
}
function parseAssert(context) {
  var token = context.next();
  var value = pratt.parse(context, 0);
  scanForToken(context, 81, 1);
  return Node.createAssert(value).withRange(context.spanSince(token.range));
}
function parseSwitch(context) {
  var token = context.next();
  var value = parseGroup(context, 0);
  if (value === null) {
    return null;
  }
  var block = parseBlock(context, 3);
  if (block === null) {
    return null;
  }
  return Node.createSwitch(value, block.removeChildren()).withRange(context.spanSince(token.range));
}
function parseWhile(context) {
  var token = context.next();
  var value = parseGroup(context, 0);
  if (value === null) {
    return null;
  }
  var block = parseBlockOrStatement(context, 0);
  if (block === null) {
    return null;
  }
  return Node.createWhile(value, block).withRange(context.spanSince(token.range));
}
function parseDoWhile(context) {
  var token = context.next();
  var block = parseBlockOrStatement(context, 0);
  if (block === null) {
    return null;
  }
  if (!context.expect(95)) {
    return null;
  }
  var value = parseGroup(context, 0);
  scanForToken(context, 81, 1);
  return Node.createDoWhile(block, value).withRange(context.spanSince(token.range));
}
function parseIf(context) {
  var token = context.next();
  var value = parseGroup(context, 0);
  if (value === null) {
    return null;
  }
  var trueBlock = parseBlockOrStatement(context, 0);
  if (trueBlock === null) {
    return null;
  }
  var falseBlock = null;
  if (context.eat(29)) {
    falseBlock = parseBlockOrStatement(context, 0);
    if (falseBlock === null) {
      return null;
    }
  }
  return Node.createIf(value, trueBlock, falseBlock).withRange(context.spanSince(token.range));
}
function parseExtension(context) {
  var token = context.next();
  var name = parseName(context);
  if (name === null) {
    return null;
  }
  var bases = context.eat(20) ? Node.createNodeList(parseTypeList(context, 55)) : null;
  var block = parseBlock(context, 2);
  if (block === null) {
    return null;
  }
  return Node.createExtension(name, bases, block).withRange(context.spanSince(token.range));
}
function parseEnum(context) {
  var token = context.next();
  var isFlags = false;
  if (context.peek(42) && context.current().text === "flags") {
    isFlags = true;
    context.next();
  }
  var name = parseName(context);
  if (name === null) {
    return null;
  }
  var block = parseBlock(context, 1);
  if (block === null) {
    return null;
  }
  return (isFlags ? Node.createEnumFlags(name, block) : Node.createEnum(name, block)).withRange(context.spanSince(token.range));
}
function parseVariableCluster(context, type, name) {
  var variables = [];
  var start = type;
  while (variables.length === 0 || !context.peek(81) && !context.peek(45)) {
    if (variables.length > 0 && !context.eat(21)) {
      context.expect(81);
      break;
    }
    if (name === null) {
      name = start = parseName(context);
    }
    if (name === null) {
      break;
    }
    var value = context.eat(2) ? pratt.parse(context, 1) : null;
    variables.push(Node.createVariable(name, null, value).withRange(context.spanSince(start.range)));
    name = null;
  }
  return Node.createVariableCluster(type, variables).withRange(context.spanSince(type.range));
}
function parseFor(context) {
  var token = context.next();
  if (!context.expect(57)) {
    return null;
  }
  var setup = null;
  var test = null;
  var update = null;
  do {
    if (!context.peek(81) && !context.peek(80)) {
      setup = parseType(context);
      if (context.peek(42)) {
        var name = parseName(context);
        setup = name !== null ? parseVariableCluster(context, setup, name) : null;
        if (setup !== null && context.eat(45)) {
          var values = pratt.parse(context, 0);
          scanForToken(context, 80, 0);
          var body = parseBlockOrStatement(context, 0);
          if (body === null) {
            return null;
          }
          var variables = setup.clusterVariables();
          if (variables.length > 1) {
            syntaxErrorBadForEach(context.log, setup.range);
          }
          var value = Node.createVariable(variables.get(0).declarationName().remove(), setup.clusterType().remove(), null);
          return Node.createForEach(value, values, body).withRange(context.spanSince(token.range));
        }
      } else if (!context.peek(81)) {
        setup = pratt.resume(context, 0, setup);
      }
    }
    if (!context.expect(81)) {
      break;
    }
    if (!context.peek(81) && !context.peek(80)) {
      test = pratt.parse(context, 0);
    }
    if (!context.expect(81)) {
      break;
    }
    if (!context.peek(80)) {
      update = pratt.parse(context, 0);
    }
  } while (false);
  scanForToken(context, 80, 0);
  var block = parseBlockOrStatement(context, 0);
  if (block === null) {
    return null;
  }
  return Node.createFor(setup, test, update, block).withRange(context.spanSince(token.range));
}
function parseSuperCall(context) {
  var token = context.next();
  var values = parseArgumentList(context, 57, 80, 0);
  return Node.createSuperCall(values).withRange(context.spanSince(token.range));
}
function parsePossibleTypedDeclaration(context, hint) {
  var type = parseType(context);
  if (!context.peek(42)) {
    var value = pratt.resume(context, 0, type);
    scanForToken(context, 81, 1);
    return Node.createExpression(value).withRange(context.spanSince(type.range));
  }
  var name = parseName(context);
  if (name === null) {
    return null;
  }
  if (context.peek(57)) {
    var $arguments = parseArgumentVariables(context);
    if ($arguments === null) {
      return null;
    }
    var block = null;
    if (!context.eat(81)) {
      block = parseBlock(context, 0);
      if (block === null) {
        return null;
      }
    }
    return Node.createFunction(name, $arguments, block, type).withRange(context.spanSince(type.range));
  }
  var cluster = parseVariableCluster(context, type, name);
  scanForToken(context, 81, 1);
  var last = cluster.children.get(cluster.children.length - 1 | 0);
  last.withRange(context.spanSince(last.range));
  return cluster;
}
function parseUsing(context) {
  var token = context.next();
  var name = parseName(context);
  if (name === null) {
    scanForToken(context, 81, 1);
    var range = context.spanSince(token.range);
    return Node.createExpression(Node.createError().withRange(range)).withRange(range);
  }
  if (!context.eat(2)) {
    var value = pratt.resume(context, 0, name);
    scanForToken(context, 81, 1);
    return Node.createUsingNamespace(value).withRange(context.spanSince(token.range));
  } else {
    var value = pratt.parse(context, 0);
    scanForToken(context, 81, 1);
    return Node.createUsingAlias(name, value).withRange(context.spanSince(token.range));
  }
}
function parseAlias(context) {
  var token = context.next();
  var name = parseName(context);
  if (name === null || !context.expect(2)) {
    scanForToken(context, 81, 1);
    var range = context.spanSince(token.range);
    return Node.createExpression(Node.createError().withRange(range)).withRange(range);
  }
  var value = pratt.parse(context, 0);
  scanForToken(context, 81, 1);
  return Node.createAlias(name, value).withRange(context.spanSince(token.range));
}
function looksLikeLambdaArguments(node) {
  if (node.kind === 52) {
    for (var i = 0; i < node.children.length; i = i + 1 | 0) {
      if (node.children.get(i).kind !== 34) {
        return false;
      }
    }
    return true;
  }
  return false;
}
function createLambdaFromNames(names, block) {
  for (var i = 0; i < names.length; i = i + 1 | 0) {
    var name = names.get(i);
    names.set(i, Node.createVariable(name, null, null).withRange(name.range));
  }
  return Node.createLambda(names, block);
}
function looksLikeType(node) {
  switch (node.kind) {
  case 46:
    var target = node.dotTarget();
    return target !== null && looksLikeType(target);
  case 34:
  case 53:
  case 59:
    return true;
  default:
    return false;
  }
}
function parseStatement(context, hint) {
  switch (context.current().kind) {
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
  case 93:
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
  case 92:
    return parseUsing(context);
  case 0:
    return parseAlias(context);
  case 94:
    return parseModifier(context, hint, 128);
  case 95:
    return parseWhile(context);
  default:
    return parseExpression(context);
  }
}
function parseFile(log, tokens) {
  var context = new ParserContext(log, tokens);
  var token = context.current();
  var statements = parseStatements(context, 0);
  if (statements === null) {
    return null;
  }
  if (!context.expect(30)) {
    return null;
  }
  var range = context.spanSince(token.range);
  return Node.createFile(Node.createBlock(statements).withRange(range)).withRange(range);
}
function tokenLiteral(kind) {
  return function(context, token) {
    return new Node(kind).withRange(token.range);
  };
}
function intLiteral(base) {
  return function(context, token) {
    var value = parseIntLiteral(token.text, base);
    if (value !== value) {
      syntaxErrorInvalidInteger(context.log, token.range, token.text);
    } else if (base === 10 && value !== 0 && token.text.codeUnitAt(0) === 48) {
      syntaxWarningOctal(context.log, token.range);
    }
    return Node.createInt(value | 0).withRange(token.range);
  };
}
function unaryPostfix(kind) {
  return function(context, value, token) {
    return Node.createUnary(kind, value).withRange(Range.span(value.range, token.range));
  };
}
function unaryPrefix(kind) {
  return function(context, token, value) {
    return Node.createUnary(kind, value).withRange(Range.span(token.range, value.range));
  };
}
function binaryInfix(kind) {
  return function(context, left, token, right) {
    return Node.createBinary(kind, left, right).withRange(Range.span(left.range, right.range));
  };
}
function createParser() {
  var pratt = new Pratt();
  pratt.literal(69, tokenLiteral(38));
  pratt.literal(89, tokenLiteral(36));
  pratt.literal(91, tokenLiteral(39));
  pratt.literal(35, tokenLiteral(40));
  pratt.literal(50, intLiteral(10));
  pratt.literal(49, intLiteral(2));
  pratt.literal(52, intLiteral(8));
  pratt.literal(51, intLiteral(16));
  pratt.literal(37, function(context, token) {
    return Node.createFloat(parseDoubleLiteral(token.text.slice(0, token.text.length - 1 | 0))).withRange(token.range);
  });
  pratt.literal(28, function(context, token) {
    return Node.createDouble(parseDoubleLiteral(token.text)).withRange(token.range);
  });
  pratt.literal(93, function(context, token) {
    return Node.createVar().withRange(token.range);
  });
  pratt.literal(85, function(context, token) {
    var result = parseStringLiteral(context.log, token.range, token.text);
    return Node.createString(result !== null ? result.value : "").withRange(token.range);
  });
  pratt.literal(18, function(context, token) {
    var result = parseStringLiteral(context.log, token.range, token.text);
    if (result !== null && result.value.length !== 1) {
      syntaxErrorInvalidCharacter(context.log, token.range, token.text);
      result = null;
    }
    return Node.createInt(result !== null ? result.value.codeUnitAt(0) : 0).withRange(token.range);
  });
  pratt.postfix(46, 14, unaryPostfix(66));
  pratt.postfix(23, 14, unaryPostfix(67));
  pratt.prefix(46, 13, unaryPrefix(64));
  pratt.prefix(23, 13, unaryPrefix(65));
  pratt.prefix(71, 13, unaryPrefix(61));
  pratt.prefix(63, 13, unaryPrefix(62));
  pratt.prefix(67, 13, unaryPrefix(60));
  pratt.prefix(90, 13, unaryPrefix(63));
  pratt.infix(13, 7, binaryInfix(69));
  pratt.infix(14, 5, binaryInfix(70));
  pratt.infix(15, 6, binaryInfix(71));
  pratt.infix(25, 12, binaryInfix(72));
  pratt.infix(32, 8, binaryInfix(73));
  pratt.infix(40, 9, binaryInfix(74));
  pratt.infix(41, 9, binaryInfix(75));
  pratt.infix(45, 9, binaryInfix(76));
  pratt.infix(58, 9, binaryInfix(78));
  pratt.infix(59, 9, binaryInfix(79));
  pratt.infix(61, 4, binaryInfix(80));
  pratt.infix(62, 3, binaryInfix(81));
  pratt.infix(63, 11, binaryInfix(87));
  pratt.infix(64, 12, binaryInfix(82));
  pratt.infix(68, 8, binaryInfix(83));
  pratt.infix(71, 11, binaryInfix(68));
  pratt.infix(76, 12, binaryInfix(84));
  pratt.infix(82, 10, binaryInfix(85));
  pratt.infix(83, 10, binaryInfix(86));
  pratt.infixRight(2, 2, binaryInfix(88));
  pratt.infixRight(9, 2, binaryInfix(89));
  pratt.infixRight(3, 2, binaryInfix(90));
  pratt.infixRight(4, 2, binaryInfix(91));
  pratt.infixRight(5, 2, binaryInfix(92));
  pratt.infixRight(6, 2, binaryInfix(93));
  pratt.infixRight(8, 2, binaryInfix(94));
  pratt.infixRight(10, 2, binaryInfix(95));
  pratt.infixRight(11, 2, binaryInfix(96));
  pratt.infixRight(12, 2, binaryInfix(97));
  pratt.infixRight(7, 2, binaryInfix(98));
  pratt.parselet(55, 0).prefix = function(context) {
    var token = context.current();
    var $arguments = parseArgumentList(context, 55, 78, 1);
    return Node.createInitializer($arguments).withRange(context.spanSince(token.range));
  };
  pratt.parselet(57, 0).prefix = function(context) {
    var token = context.current();
    var type = parseGroup(context, 1);
    if (type.kind === 34 && context.eat(54)) {
      var block = parseLambdaBlock(context);
      return createLambdaFromNames([type], block).withRange(context.spanSince(token.range));
    }
    if (looksLikeLambdaArguments(type) && context.eat(54)) {
      var block = parseLambdaBlock(context);
      return createLambdaFromNames(type.removeChildren(), block).withRange(context.spanSince(token.range));
    }
    if (looksLikeType(type)) {
      var value = pratt.parse(context, 13);
      return Node.createCast(type, value).withRange(context.spanSince(token.range));
    }
    return type;
  };
  pratt.parselet(75, 2).infix = function(context, left) {
    context.next();
    var middle = pratt.parse(context, 1);
    var right = context.expect(20) ? pratt.parse(context, 1) : Node.createError().withRange(context.spanSince(context.current().range));
    return Node.createHook(left, middle, right).withRange(context.spanSince(left.range));
  };
  pratt.parselet(21, 1).infix = function(context, left) {
    var values = [left];
    while (context.eat(21)) {
      values.push(pratt.parse(context, 1));
    }
    return Node.createSequence(values).withRange(context.spanSince(left.range));
  };
  pratt.parselet(27, 15).infix = function(context, left) {
    context.next();
    var name = parseName(context);
    return Node.createDot(left, name).withRange(context.spanSince(left.range));
  };
  pratt.parselet(27, 0).prefix = function(context) {
    var token = context.next();
    var name = parseName(context);
    return Node.createDot(null, name).withRange(context.spanSince(token.range));
  };
  pratt.parselet(38, 15).infix = function(context, left) {
    if (!looksLikeType(left)) {
      context.unexpectedToken();
      context.next();
      return Node.createError().withRange(context.spanSince(left.range));
    }
    context.next();
    var $arguments = parseArgumentList(context, 57, 80, 1);
    return Node.createFunctionType(left, $arguments).withRange(context.spanSince(left.range));
  };
  pratt.parselet(57, 14).infix = function(context, left) {
    var $arguments = parseArgumentList(context, 57, 80, 0);
    return Node.createCall(left, $arguments).withRange(context.spanSince(left.range));
  };
  pratt.parselet(56, 14).infix = function(context, left) {
    context.next();
    var index = pratt.parse(context, 0);
    scanForToken(context, 79, 1);
    return Node.createBinary(77, left, index).withRange(context.spanSince(left.range));
  };
  pratt.parselet(98, 15).infix = function(context, left) {
    var token = context.next();
    var substitutions = parseTypeList(context, 99);
    if (!context.expect(99)) {
      scanForToken(context, 99, 1);
      return Node.createError().withRange(context.spanSince(token.range));
    }
    return Node.createParameterize(left, substitutions).withRange(context.spanSince(left.range));
  };
  pratt.parselet(24, 13).prefix = function(context) {
    var token = context.next();
    var type = parseGroup(context, 0);
    return (type === null ? Node.createError() : Node.createDefault(type)).withRange(context.spanSince(token.range));
  };
  pratt.parselet(42, 0).prefix = function(context) {
    var token = context.next();
    var name = Node.createName(token.text).withRange(token.range);
    if (context.eat(54)) {
      var block = parseLambdaBlock(context);
      return createLambdaFromNames([name], block).withRange(context.spanSince(token.range));
    }
    return name;
  };
  pratt.parselet(54, 0).prefix = function(context) {
    var token = context.next();
    var block = parseLambdaBlock(context);
    return Node.createLambda([], block).withRange(context.spanSince(token.range));
  };
  pratt.parselet(66, 0).prefix = function(context) {
    context.unexpectedToken();
    context.next();
    return parseType(context);
  };
  var inParselet = pratt.parselet(45, 0);
  pratt.parselet(60, 0).prefix = function(context) {
    var token = context.next();
    var name = parseName(context);
    if (name === null || !context.expect(2)) {
      return Node.createError().withRange(context.spanSince(token.range));
    }
    var initial = pratt.parseIgnoringParselet(context, 0, inParselet);
    var variable = Node.createVariable(name, Node.createVar(), initial).withRange(context.spanSince(token.range));
    if (NodeKind.isError(initial.kind) || !context.expect(45)) {
      return Node.createError().withRange(context.spanSince(token.range));
    }
    var value = pratt.parse(context, 1);
    return Node.createLet(variable, value).withRange(context.spanSince(token.range));
  };
  pratt.parselet(87, 0).prefix = function(context) {
    return parseSuperCall(context);
  };
  return pratt;
}
function typeToText(type) {
  return "type \"".append(type.toString()).append("\"");
}
function semanticWarningUnusedExpression(log, range) {
  log.warning(range, "Unused expression");
}
function semanticWarningDuplicateModifier(log, range, modifier) {
  log.warning(range, "Duplicate modifier ".append(simpleQuote(modifier)));
}
function semanticWarningShadowedSymbol(log, range, name, shadowed) {
  log.warning(range, simpleQuote(name).append(" shadows another declaration with the same name"));
  if (!shadowed.isEmpty()) {
    log.note(shadowed, "The shadowed declaration is here");
  }
}
function semanticErrorRedundantModifier(log, range, modifier, where) {
  log.error(range, "Redundant modifier ".append(simpleQuote(modifier)).append(" ").append(where));
}
function semanticErrorUnexpectedModifier(log, range, modifier, where) {
  log.error(range, "Cannot use the ".append(simpleQuote(modifier)).append(" modifier ").append(where));
}
function semanticErrorExpectedModifier(log, range, modifier, where) {
  log.error(range, "Expected the ".append(simpleQuote(modifier)).append(" modifier ").append(where));
}
function semanticErrorDuplicateSymbol(log, range, name, previous) {
  log.error(range, simpleQuote(name).append(" is already declared"));
  if (!previous.isEmpty()) {
    log.note(previous, "The previous declaration is here");
  }
}
function semanticErrorUnexpectedNode(log, range, kind) {
  log.error(range, "Unexpected ".append(NodeKind.toString(kind)));
}
function semanticErrorUnexpectedExpression(log, range, type) {
  log.error(range, "Unexpected expression of ".append(typeToText(type)));
}
function semanticErrorUnexpectedType(log, range, type) {
  log.error(range, "Unexpected ".append(typeToText(type)));
}
function semanticErrorUndeclaredSymbol(log, range, name) {
  log.error(range, simpleQuote(name).append(" is not declared"));
}
function semanticErrorUndeclaredGlobalSymbol(log, range, name) {
  log.error(range, simpleQuote(name).append(" is not declared at the global scope"));
}
function semanticErrorUnknownMemberSymbol(log, range, name, type) {
  log.error(range, simpleQuote(name).append(" is not declared on ").append(typeToText(type)));
}
function semanticErrorExtensionMissingTarget(log, range, name) {
  log.error(range, "No type named ".append(simpleQuote(name)).append(" to extend"));
}
function semanticErrorDifferentModifiers(log, range, name, previous) {
  log.error(range, "Cannot merge multiple declarations for ".append(simpleQuote(name)).append(" with different modifiers"));
  if (!previous.isEmpty()) {
    log.note(previous, "The conflicting declaration is here");
  }
}
function semanticErrorBadUsingValue(log, range) {
  log.error(range, "Expected a type here");
}
function semanticErrorBadUsingNamespace(log, range) {
  log.error(range, "Expected a namespace here");
}
function semanticErrorUnexpectedStatement(log, range) {
  log.error(range, "Cannot use this statement here");
}
function semanticErrorCyclicDeclaration(log, range, name) {
  log.error(range, "Cyclic declaration of ".append(simpleQuote(name)));
}
function semanticErrorUnexpectedThis(log, range, name) {
  log.error(range, "Cannot use ".append(simpleQuote(name)).append(" outside a class or struct"));
}
function semanticErrorStaticThis(log, range, name) {
  log.error(range, "Cannot access ".append(simpleQuote(name)).append(" from a static context"));
}
function semanticErrorIncompatibleTypes(log, range, from, to, isCastAllowed) {
  log.error(range, "Cannot convert from ".append(typeToText(from)).append(" to ").append(typeToText(to)).append(isCastAllowed ? " without a cast" : ""));
}
function semanticErrorNoCommonType(log, range, left, right) {
  log.error(range, "No common type for ".append(typeToText(left)).append(" and ").append(typeToText(right)));
}
function semanticErrorBadType(log, range, type) {
  log.error(range, "Cannot use ".append(typeToText(type)).append(" here"));
}
function semanticErrorMemberUnexpectedStatic(log, range, name) {
  log.error(range, "Cannot access static member ".append(simpleQuote(name)).append(" from an instance context"));
}
function semanticErrorMemberUnexpectedInstance(log, range, name) {
  log.error(range, "Cannot access instance member ".append(simpleQuote(name)).append(" from a static context"));
}
function semanticErrorMissingTypeContext(log, range) {
  log.error(range, "Expression has no type context here");
}
function semanticErrorBadTypeParameterBound(log, range, type) {
  log.error(range, "Cannot use ".append(typeToText(type)).append(" as a type parameter bound"));
}
function semanticErrorUninitializedExtensionVariable(log, range) {
  log.error(range, "Instance variables in extension blocks must be initialized");
}
function semanticErrorVarMissingValue(log, range) {
  log.error(range, "Implicitly typed variables must be initialized");
}
function semanticErrorVarBadType(log, range, type) {
  log.error(range, "Implicitly typed variables cannot be of ".append(typeToText(type)));
}
function semanticErrorInvalidCall(log, range, type) {
  log.error(range, "Cannot call ".append(typeToText(type)));
}
function semanticErrorParameterCount(log, range, expected, found) {
  log.error(range, "Expected ".append(expected.toString()).append(plural(expected, " type parameter", " type parameters")).append(" but found ").append(found.toString()).append(plural(found, " type parameter", " type parameters")));
}
function semanticErrorArgumentCount(log, range, expected, found) {
  log.error(range, "Expected ".append(expected.toString()).append(plural(expected, " argument", " arguments")).append(" but found ").append(found.toString()).append(plural(found, " argument", " arguments")));
}
function semanticErrorExpectedReturnValue(log, range, type) {
  log.error(range, "Return statement must return ".append(typeToText(type)));
}
function semanticErrorBadLambdaTypeContext(log, range, type) {
  log.error(range, "Cannot use a lambda expression with ".append(typeToText(type)));
}
function semanticErrorNonConstantCaseValue(log, range) {
  log.error(range, "Non-constant case value");
}
function semanticErrorBadDefaultCase(log, range) {
  log.error(range, "Only the last case can be a default case");
}
function semanticErrorDuplicateCase(log, range, previous) {
  log.error(range, "Duplicate case value");
  if (!previous.isEmpty()) {
    log.note(previous, "The first occurrence is here");
  }
}
function semanticErrorUnconstructableType(log, range, type) {
  log.error(range, "Cannot construct ".append(typeToText(type)));
}
function semanticErrorAbstractConstructorInitializer(log, range) {
  log.error(range, "An abstract constructor must not have initializer list");
}
function semanticErrorUnexpectedBaseType(log, range, what) {
  log.error(range, what.append(" cannot inherit from another type"));
}
function semanticErrorClassBaseNotFirst(log, range, type) {
  log.error(range, "Base ".append(typeToText(type)).append(" must come first in a class declaration"));
}
function semanticErrorBaseTypeNotInterface(log, range, type) {
  log.error(range, "Base ".append(typeToText(type)).append(" must be an interface"));
}
function semanticErrorDuplicateBaseType(log, range, type) {
  log.error(range, "Duplicate base ".append(typeToText(type)));
}
function semanticErrorAmbiguousSymbol(log, range, name, names) {
  for (var i = 0; i < names.length; i = i + 1 | 0) {
    names.set(i, simpleQuote(names.get(i)));
  }
  log.error(range, "Reference to ".append(simpleQuote(name)).append(" is ambiguous, could be ").append(" or ".join(names)));
}
function semanticErrorUnmergedSymbol(log, range, name, types) {
  var names = [];
  for (var i = 0; i < types.length; i = i + 1 | 0) {
    names.push(typeToText(types.get(i)));
  }
  log.error(range, "Member ".append(simpleQuote(name)).append(" has an ambiguous inherited type, could be ").append(" or ".join(names)));
}
function semanticErrorBadOverride(log, range, name, base, overridden) {
  log.error(range, simpleQuote(name).append(" overrides another declaration with the same name in base ").append(typeToText(base)));
  if (!overridden.isEmpty()) {
    log.note(overridden, "The overridden declaration is here");
  }
}
function semanticErrorOverrideDifferentTypes(log, range, name, base, derived, overridden) {
  log.error(range, simpleQuote(name).append(" must have the same signature as the method it overrides (").append("expected ").append(typeToText(base)).append(" but found ").append(typeToText(derived)).append(")"));
  if (!overridden.isEmpty()) {
    log.note(overridden, "The overridden declaration is here");
  }
}
function semanticErrorModifierMissingOverride(log, range, name, overridden) {
  log.error(range, simpleQuote(name).append(" overrides another symbol with the same name but is missing the \"override\" modifier"));
  if (!overridden.isEmpty()) {
    log.note(overridden, "The overridden declaration is here");
  }
}
function semanticErrorCannotOverrideNonVirtual(log, range, name, overridden) {
  log.error(range, simpleQuote(name).append(" cannot override a non-virtual method"));
  if (!overridden.isEmpty()) {
    log.note(overridden, "The overridden declaration is here");
  }
}
function semanticErrorBadIntegerConstant(log, range, type) {
  log.error(range, "Expected integer constant but found expression of ".append(typeToText(type)));
}
function semanticErrorNoUnaryOperator(log, range, kind, type) {
  log.error(range, "No unary operator ".append(operatorInfo.get(kind).text).append(" for ").append(typeToText(type)));
}
function semanticErrorNoBinaryOperator(log, range, kind, left, right) {
  log.error(range, "No binary operator ".append(operatorInfo.get(kind).text).append(" for ").append(typeToText(left)).append(" and ").append(typeToText(right)));
}
function semanticErrorBadStorage(log, range) {
  log.error(range, "Cannot store to this location");
}
function semanticErrorStorageToFinal(log, range) {
  log.error(range, "Cannot store to a symbol marked as \"final\"");
}
function semanticErrorUnparameterizedType(log, range, type) {
  log.error(range, "Cannot use unparameterized ".append(typeToText(type)));
}
function semanticErrorCannotParameterize(log, range, type) {
  log.error(range, "Cannot parameterize ".append(typeToText(type)).append(type.hasParameters() ? " because it is already parameterized" : " because it has no type parameters"));
}
function semanticErrorBadSuperInitializer(log, range) {
  log.error(range, "No base constructor to call");
}
function semanticErrorMissingSuperInitializer(log, range) {
  log.error(range, "Missing call to \"super\" in initializer list");
}
function semanticErrorAlreadyInitialized(log, range, name, previous) {
  log.error(range, simpleQuote(name).append(" is already initialized"));
  if (!previous.isEmpty()) {
    log.note(previous, "The previous initialization is here");
  }
}
function semanticErrorBadEnumToString(log, range, name, first, second, value) {
  log.error(range, "Cannot automatically generate \"toString\" for ".append(simpleQuote(name)).append(" because ").append(simpleQuote(first)).append(" and ").append(simpleQuote(second)).append(" both have the same value ").append(value.toString()));
}
function semanticErrorMissingReturn(log, range, name, type) {
  log.error(range, "All control paths for ".append(simpleQuote(name)).append(" must return a value of ").append(typeToText(type)));
}
function semanticErrorLambdaMissingReturn(log, range, type) {
  log.error(range, "All control paths for lambda expression must return a value of ".append(typeToText(type)));
}
function semanticErrorBaseClassInExtension(log, range) {
  log.error(range, "The base class must be set from the class declaration, not from an extension block");
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
  while (node.hasChildren()) {
    var i;
    for (i = node.children.length - 1 | 0; i >= 0; i = i - 1 | 0) {
      var child = node.children.get(i);
      if (child !== null && child.range.source === source && child.range.touches(index)) {
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
    var start = source.indexToLineColumn(node.range.start);
    var result = new LanguageServiceTypeResult(start.line, start.column, node.range.start, node.range.singleLineLength(), type.toString());
    switch (symbol.kind) {
    case 4:
      var bound = symbol.type.bound();
      var text = "type ".append(symbol.name);
      if (bound !== null) {
        text = text.append(" is ").append(bound.toString());
      }
      result.declaration = text;
      break;
    case 9:
      result.declaration = "namespace ".append(symbol.fullName());
      break;
    case 12:
    case 13:
    case 14:
      var text = SymbolKind.toString(symbol.kind).toLowerCase().append(" ").append(type.toString());
      if (type.hasRelevantTypes()) {
        var i;
        for (i = 0; i < type.relevantTypes.length; i = i + 1 | 0) {
          text = text.append(i === 0 ? " : " : ", ").append(type.relevantTypes.get(i).toString());
        }
      }
      result.declaration = text;
      break;
    case 10:
      result.declaration = "enum ".append(symbol.fullName());
      break;
    case 11:
      result.declaration = "enum flags ".append(symbol.fullName());
      break;
    case 15:
    case 16:
    case 17:
      var text = type.resultType().toString().append(" ").append(symbol.name).append("(");
      var $arguments = symbol.node.functionArguments().children;
      var argumentTypes = type.argumentTypes();
      var i;
      for (i = 0; i < $arguments.length; i = i + 1 | 0) {
        if (i > 0) {
          text = text.append(", ");
        }
        text = text.append(argumentTypes.get(i).toString()).append(" ").append($arguments.get(i).symbol.name);
      }
      result.declaration = text.append(")");
      break;
    case 18:
    case 19:
    case 20:
      var text = type.toString().append(" ").append(symbol.name);
      if (symbol.isEnumValue()) {
        text = text.append(" = ").append(symbol.enumValue.toString());
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
    var target = node.dotTarget();
    if (target.type !== null) {
      var isInstance = !NodeKind.isType(target.kind);
      var members = target.type.members.values();
      var i;
      for (i = 0; i < members.length; i = i + 1 | 0) {
        var member = members.get(i);
        resolver.initializeMember(member);
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
    var i;
    for (i = 0; i < members.length; i = i + 1 | 0) {
      var member = members.get(i);
      resolver.initializeMember(member);
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
    if (type.isFunction()) {
      var semicolon = type.resultType().toString() === "void";
      text = text.append(type.argumentTypes().length === 0 ? semicolon ? "();$" : "()$" : semicolon ? "($);" : "($)");
    } else {
      text = text.append("$");
    }
    completions.push(new LanguageServiceCompletion(name, type.toString(), text));
  }
};
service.addAllMembers = function(allMembers, membersToAdd) {
  var members = membersToAdd.values();
  var i;
  for (i = 0; i < members.length; i = i + 1 | 0) {
    var member = members.get(i);
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
var NATIVE_LIBRARY = "\nimport struct int { string toString(); }\nimport struct bool { string toString(); }\nimport struct float { string toString(); }\nimport struct double { string toString(); }\n\nimport struct string {\n  final int length;\n  string get(int index);\n  int codeUnitAt(int index);\n  string slice(int start, int end);\n  string append(string value);\n  int indexOf(string value);\n  int lastIndexOf(string value);\n  string join(List<string> values);\n  string toLowerCase();\n  string toUpperCase();\n  static string fromCodeUnit(int value);\n}\n\nimport class List<T> {\n  new();\n  final int length;\n  T get(int index);\n  void set(int index, T value);\n  void push(T value);\n  void unshift(T value);\n  void insert(int index, T value);\n  List<T> slice(int start, int end);\n  List<T> clone();\n  int indexOf(T value);\n  int lastIndexOf(T value);\n  T remove(int index);\n  T shift();\n  T pop();\n  void reverse();\n  void sort(int fn(T, T) callback);\n}\n\nimport class StringMap<T> {\n  new();\n  T get(string key);\n  T getOrDefault(string key, T defaultValue);\n  void set(string key, T value);\n  bool has(string key);\n  List<string> keys();\n  List<T> values();\n  StringMap<T> clone();\n}\n\nimport class IntMap<T> {\n  new();\n  T get(int key);\n  T getOrDefault(int key, T defaultValue);\n  void set(int key, T value);\n  bool has(int key);\n  List<int> keys();\n  List<T> values();\n  IntMap<T> clone();\n}\n\n// TODO: Rename this to \"math\" since namespaces should be lower case\nimport namespace Math {\n  final double E;\n  final double PI;\n  final double NAN;\n  final double INFINITY;\n  double random();\n  double abs(double n);\n  double sin(double n);\n  double cos(double n);\n  double tan(double n);\n  double asin(double n);\n  double acos(double n);\n  double atan(double n);\n  double round(double n);\n  double floor(double n);\n  double ceil(double n);\n  double exp(double n);\n  double log(double n);\n  double sqrt(double n);\n  bool isNaN(double n);\n  bool isFinite(double n);\n  double atan2(double y, double x);\n  double pow(double base, double exponent);\n  double min(double a, double b);\n  double max(double a, double b);\n  int imin(int a, int b);\n  int imax(int a, int b);\n}\n\n// TODO: Remove this\nimport class StringBuilder {\n  new();\n  StringBuilder append(string text);\n  string toString();\n}\n";
Range.EMPTY = new Range(null, 0, 0);
var BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var HEX = "0123456789ABCDEF";
js.Emitter.isKeyword = js.Emitter.createIsKeyword();
var yy_accept = [97, 97, 97, 30, 33, 96, 67, 33, 76, 13, 33, 57, 80, 64, 71, 21, 63, 27, 25, 50, 50, 20, 81, 58, 2, 40, 75, 42, 56, 79, 15, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 55, 14, 78, 90, 96, 68, 97, 85, 97, 10, 61, 3, 97, 18, 97, 8, 46, 9, 23, 7, 96, 6, 97, 50, 97, 37, 97, 97, 82, 59, 32, 54, 41, 83, 42, 5, 42, 42, 42, 42, 42, 42, 42, 26, 42, 42, 42, 42, 42, 38, 42, 43, 42, 45, 53, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 4, 62, 96, 28, 49, 52, 51, 11, 12, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 39, 42, 42, 42, 60, 42, 66, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 93, 42, 42, 37, 42, 42, 42, 17, 42, 42, 42, 29, 31, 42, 42, 42, 42, 42, 42, 42, 69, 42, 42, 42, 42, 42, 42, 42, 42, 42, 89, 91, 42, 42, 42, 0, 42, 16, 19, 42, 42, 42, 35, 36, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 87, 42, 92, 42, 95, 1, 42, 42, 34, 44, 47, 42, 42, 42, 42, 42, 74, 77, 84, 86, 88, 42, 42, 24, 42, 42, 42, 72, 42, 94, 22, 42, 42, 70, 42, 48, 65, 73, 97];
var yy_ec = [0, 1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 4, 5, 1, 1, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 19, 19, 19, 19, 19, 20, 20, 21, 22, 23, 24, 25, 26, 1, 27, 27, 27, 27, 27, 27, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 29, 30, 31, 32, 28, 1, 33, 34, 35, 36, 37, 38, 39, 40, 41, 28, 42, 43, 44, 45, 46, 47, 28, 48, 49, 50, 51, 52, 53, 54, 28, 28, 55, 56, 57, 58, 1];
var yy_meta = [0, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 3, 3, 1, 1, 1, 1, 1, 1, 3, 4, 1, 1, 1, 1, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 1, 1, 1, 1];
var yy_base = [0, 0, 0, 309, 310, 57, 284, 56, 283, 55, 55, 310, 310, 282, 52, 310, 51, 310, 50, 72, 63, 310, 310, 44, 45, 47, 310, 0, 310, 310, 281, 45, 256, 62, 47, 53, 70, 75, 266, 84, 250, 49, 264, 72, 64, 251, 95, 259, 310, 53, 310, 310, 127, 310, 97, 310, 295, 310, 310, 310, 123, 310, 294, 310, 310, 310, 310, 310, 0, 310, 120, 126, 115, 310, 130, 0, 272, 310, 310, 310, 310, 271, 0, 310, 253, 244, 255, 242, 257, 244, 250, 0, 238, 235, 238, 241, 238, 0, 234, 0, 234, 107, 0, 230, 235, 225, 234, 239, 110, 241, 224, 66, 226, 231, 230, 219, 228, 220, 219, 225, 310, 310, 0, 141, 137, 148, 0, 310, 310, 232, 227, 230, 225, 212, 210, 226, 221, 213, 210, 206, 221, 0, 207, 211, 214, 0, 213, 0, 206, 200, 195, 196, 202, 193, 193, 191, 204, 190, 190, 201, 192, 0, 186, 192, 310, 185, 185, 190, 0, 182, 189, 178, 0, 0, 180, 190, 183, 177, 179, 175, 173, 0, 173, 187, 182, 177, 169, 175, 180, 166, 178, 0, 0, 173, 160, 173, 0, 159, 0, 0, 163, 164, 156, 0, 0, 155, 167, 165, 155, 160, 150, 164, 163, 152, 161, 145, 0, 154, 0, 158, 0, 0, 127, 127, 0, 0, 0, 143, 142, 138, 136, 122, 0, 0, 0, 0, 0, 128, 133, 0, 134, 133, 126, 0, 125, 0, 0, 115, 105, 0, 98, 0, 0, 0, 310, 179, 183, 185, 189, 70];
var yy_def = [0, 254, 1, 254, 254, 254, 254, 255, 254, 254, 256, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 257, 254, 254, 254, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 254, 254, 254, 254, 254, 254, 255, 254, 255, 254, 254, 254, 256, 254, 256, 254, 254, 254, 254, 254, 258, 254, 254, 254, 254, 254, 254, 259, 254, 254, 254, 254, 254, 254, 257, 254, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 254, 254, 258, 254, 254, 254, 259, 254, 254, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 254, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 257, 0, 254, 254, 254, 254, 254];
var yy_nxt = [0, 4, 5, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 20, 20, 21, 22, 23, 24, 25, 26, 27, 27, 28, 4, 29, 30, 31, 32, 33, 34, 35, 36, 27, 27, 37, 27, 38, 27, 39, 40, 41, 42, 43, 44, 45, 46, 47, 27, 48, 49, 50, 51, 52, 52, 55, 58, 61, 64, 66, 68, 76, 77, 78, 79, 80, 81, 126, 69, 67, 65, 120, 70, 59, 71, 71, 71, 71, 90, 62, 56, 70, 84, 71, 71, 71, 71, 91, 85, 87, 92, 108, 93, 154, 109, 73, 55, 95, 114, 88, 72, 94, 89, 121, 73, 96, 115, 99, 155, 97, 98, 104, 74, 100, 101, 105, 111, 112, 102, 113, 75, 56, 117, 52, 52, 61, 124, 124, 253, 106, 118, 123, 123, 123, 123, 70, 252, 71, 71, 71, 71, 125, 125, 125, 143, 150, 251, 62, 124, 124, 151, 144, 123, 123, 123, 123, 250, 249, 73, 125, 125, 125, 248, 247, 246, 245, 244, 243, 242, 241, 240, 239, 238, 164, 54, 54, 54, 54, 60, 60, 60, 60, 82, 82, 122, 237, 122, 122, 236, 235, 234, 233, 232, 231, 230, 229, 228, 227, 226, 225, 224, 223, 222, 221, 220, 219, 218, 217, 216, 215, 214, 213, 212, 211, 210, 209, 208, 207, 206, 205, 204, 203, 202, 201, 200, 199, 198, 197, 196, 195, 194, 193, 192, 191, 190, 189, 188, 187, 186, 185, 184, 183, 182, 181, 180, 179, 178, 177, 176, 175, 174, 173, 172, 171, 170, 169, 168, 167, 166, 165, 163, 162, 161, 160, 159, 158, 157, 156, 153, 152, 149, 148, 147, 146, 145, 142, 141, 140, 139, 138, 137, 136, 135, 134, 133, 132, 131, 130, 129, 128, 127, 254, 254, 119, 116, 110, 107, 103, 86, 83, 63, 57, 53, 254, 3, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254];
var yy_chk = [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 5, 5, 7, 9, 10, 14, 16, 18, 23, 23, 24, 24, 25, 25, 259, 18, 16, 14, 49, 20, 9, 20, 20, 20, 20, 34, 10, 7, 19, 31, 19, 19, 19, 19, 34, 31, 33, 35, 41, 35, 111, 41, 20, 54, 36, 44, 33, 19, 35, 33, 49, 19, 36, 44, 37, 111, 36, 36, 39, 19, 37, 37, 39, 43, 43, 37, 43, 19, 54, 46, 52, 52, 60, 72, 72, 250, 39, 46, 70, 70, 70, 70, 71, 248, 71, 71, 71, 71, 74, 74, 74, 101, 108, 247, 60, 124, 124, 108, 101, 123, 123, 123, 123, 244, 242, 71, 125, 125, 125, 241, 240, 238, 237, 231, 230, 229, 228, 227, 223, 222, 123, 255, 255, 255, 255, 256, 256, 256, 256, 257, 257, 258, 219, 258, 258, 217, 215, 214, 213, 212, 211, 210, 209, 208, 207, 206, 205, 202, 201, 200, 197, 195, 194, 193, 190, 189, 188, 187, 186, 185, 184, 183, 182, 180, 179, 178, 177, 176, 175, 174, 171, 170, 169, 167, 166, 165, 163, 162, 160, 159, 158, 157, 156, 155, 154, 153, 152, 151, 150, 149, 148, 146, 144, 143, 142, 140, 139, 138, 137, 136, 135, 134, 133, 132, 131, 130, 129, 119, 118, 117, 116, 115, 114, 113, 112, 110, 109, 107, 106, 105, 104, 103, 100, 98, 96, 95, 94, 93, 92, 90, 89, 88, 87, 86, 85, 84, 81, 76, 62, 56, 47, 45, 42, 40, 38, 32, 30, 13, 8, 6, 3, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254, 254];
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
