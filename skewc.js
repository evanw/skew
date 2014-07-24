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
  if (!checkAllNodeKinds(files, new NodeKindCheck(NodeKind.FILE))) {
    throw new Error("assert checkAllNodeKinds(files, NodeKindCheck(NodeKind.FILE)); (src/ast/create.sk:3:5)");
  }
  return new Node(NodeKind.PROGRAM).withChildren(files);
};
Node.createFile = function(block) {
  if (block.kind !== NodeKind.BLOCK) {
    throw new Error("assert block.kind == NodeKind.BLOCK; (src/ast/create.sk:8:5)");
  }
  return new Node(NodeKind.FILE).withChildren([block]);
};
Node.createBlock = function(statements) {
  return new Node(NodeKind.BLOCK).withChildren(statements);
};
Node.createNodeList = function(nodes) {
  return new Node(NodeKind.NODE_LIST).withChildren(nodes);
};
Node.createCase = function(values, block) {
  if (!checkAllNodeKinds(values, new NodeKindIsExpression())) {
    throw new Error("assert checkAllNodeKinds(values, NodeKindIsExpression()); (src/ast/create.sk:21:5)");
  }
  if (block.kind !== NodeKind.BLOCK) {
    throw new Error("assert block.kind == NodeKind.BLOCK; (src/ast/create.sk:22:5)");
  }
  values.push(block);
  return new Node(NodeKind.CASE).withChildren(values);
};
Node.createVariableCluster = function(type, variables) {
  if (!NodeKind.isExpression(type.kind)) {
    throw new Error("assert type.kind.isExpression(); (src/ast/create.sk:28:5)");
  }
  if (!checkAllNodeKinds(variables, new NodeKindCheck(NodeKind.VARIABLE))) {
    throw new Error("assert checkAllNodeKinds(variables, NodeKindCheck(NodeKind.VARIABLE)); (src/ast/create.sk:29:5)");
  }
  variables.unshift(type);
  return new Node(NodeKind.VARIABLE_CLUSTER).withChildren(variables);
};
Node.createMemberInitializer = function(name, value) {
  if (name.kind !== NodeKind.NAME) {
    throw new Error("assert name.kind == NodeKind.NAME; (src/ast/create.sk:35:5)");
  }
  if (!NodeKind.isExpression(value.kind)) {
    throw new Error("assert value.kind.isExpression(); (src/ast/create.sk:36:5)");
  }
  return new Node(NodeKind.MEMBER_INITIALIZER).withChildren([name, value]);
};
Node.createNamespace = function(name, block) {
  if (name !== null && name.kind !== NodeKind.NAME) {
    throw new Error("assert name == null || name.kind == NodeKind.NAME; (src/ast/create.sk:41:5)");
  }
  if (block.kind !== NodeKind.BLOCK) {
    throw new Error("assert block.kind == NodeKind.BLOCK; (src/ast/create.sk:42:5)");
  }
  return new Node(NodeKind.NAMESPACE).withChildren([name, block]);
};
Node.createEnum = function(name, block) {
  if (name.kind !== NodeKind.NAME) {
    throw new Error("assert name.kind == NodeKind.NAME; (src/ast/create.sk:47:5)");
  }
  if (block.kind !== NodeKind.BLOCK) {
    throw new Error("assert block.kind == NodeKind.BLOCK; (src/ast/create.sk:48:5)");
  }
  return new Node(NodeKind.ENUM).withChildren([name, block]);
};
Node.createEnumFlags = function(name, block) {
  if (name.kind !== NodeKind.NAME) {
    throw new Error("assert name.kind == NodeKind.NAME; (src/ast/create.sk:53:5)");
  }
  if (block.kind !== NodeKind.BLOCK) {
    throw new Error("assert block.kind == NodeKind.BLOCK; (src/ast/create.sk:54:5)");
  }
  return new Node(NodeKind.ENUM_FLAGS).withChildren([name, block]);
};
Node.createObject = function(kind, name, parameters, bases, block) {
  if (!NodeKind.isObject(kind)) {
    throw new Error("assert kind.isObject(); (src/ast/create.sk:59:5)");
  }
  if (name.kind !== NodeKind.NAME) {
    throw new Error("assert name.kind == NodeKind.NAME; (src/ast/create.sk:60:5)");
  }
  if (parameters !== null && !checkAllNodeListKinds(parameters, new NodeKindCheck(NodeKind.PARAMETER))) {
    throw new Error("assert parameters == null || checkAllNodeListKinds(parameters, NodeKindCheck(NodeKind.PARAMETER)); (src/ast/create.sk:61:5)");
  }
  if (bases !== null && !checkAllNodeListKinds(bases, new NodeKindIsExpression())) {
    throw new Error("assert bases == null || checkAllNodeListKinds(bases, NodeKindIsExpression()); (src/ast/create.sk:62:5)");
  }
  if (block.kind !== NodeKind.BLOCK) {
    throw new Error("assert block.kind == NodeKind.BLOCK; (src/ast/create.sk:63:5)");
  }
  return new Node(kind).withChildren([name, block, bases, parameters]);
};
Node.createClass = function(name, parameters, bases, block) {
  return Node.createObject(NodeKind.CLASS, name, parameters, bases, block);
};
Node.createStruct = function(name, parameters, bases, block) {
  return Node.createObject(NodeKind.STRUCT, name, parameters, bases, block);
};
Node.createInterface = function(name, parameters, bases, block) {
  return Node.createObject(NodeKind.INTERFACE, name, parameters, bases, block);
};
Node.createExtension = function(name, bases, block) {
  if (name.kind !== NodeKind.NAME) {
    throw new Error("assert name.kind == NodeKind.NAME; (src/ast/create.sk:80:5)");
  }
  if (bases !== null && !checkAllNodeListKinds(bases, new NodeKindIsExpression())) {
    throw new Error("assert bases == null || checkAllNodeListKinds(bases, NodeKindIsExpression()); (src/ast/create.sk:81:5)");
  }
  if (block.kind !== NodeKind.BLOCK) {
    throw new Error("assert block.kind == NodeKind.BLOCK; (src/ast/create.sk:82:5)");
  }
  return new Node(NodeKind.EXTENSION).withChildren([name, block, bases]);
};
Node.createConstructor = function(name, $arguments, block, superInitializer, memberInitializers) {
  if (name.kind !== NodeKind.NAME) {
    throw new Error("assert name.kind == NodeKind.NAME; (src/ast/create.sk:87:5)");
  }
  if (!checkAllNodeListKinds($arguments, new NodeKindCheck(NodeKind.VARIABLE))) {
    throw new Error("assert checkAllNodeListKinds(arguments, NodeKindCheck(NodeKind.VARIABLE)); (src/ast/create.sk:88:5)");
  }
  if (block !== null && block.kind !== NodeKind.BLOCK) {
    throw new Error("assert block == null || block.kind == NodeKind.BLOCK; (src/ast/create.sk:89:5)");
  }
  if (superInitializer !== null && superInitializer.kind !== NodeKind.SUPER_CALL) {
    throw new Error("assert superInitializer == null || superInitializer.kind == NodeKind.SUPER_CALL; (src/ast/create.sk:90:5)");
  }
  if (memberInitializers !== null && !checkAllNodeListKinds(memberInitializers, new NodeKindCheck(NodeKind.MEMBER_INITIALIZER))) {
    throw new Error("assert memberInitializers == null || checkAllNodeListKinds(memberInitializers, NodeKindCheck(NodeKind.MEMBER_INITIALIZER)); (src/ast/create.sk:91:5)");
  }
  return new Node(NodeKind.CONSTRUCTOR).withChildren([name, $arguments, block, superInitializer, memberInitializers]);
};
Node.createFunction = function(name, $arguments, block, result) {
  if (name.kind !== NodeKind.NAME) {
    throw new Error("assert name.kind == NodeKind.NAME; (src/ast/create.sk:96:5)");
  }
  if (!checkAllNodeListKinds($arguments, new NodeKindCheck(NodeKind.VARIABLE))) {
    throw new Error("assert checkAllNodeListKinds(arguments, NodeKindCheck(NodeKind.VARIABLE)); (src/ast/create.sk:97:5)");
  }
  if (block !== null && block.kind !== NodeKind.BLOCK) {
    throw new Error("assert block == null || block.kind == NodeKind.BLOCK; (src/ast/create.sk:98:5)");
  }
  if (!NodeKind.isExpression(result.kind)) {
    throw new Error("assert result.kind.isExpression(); (src/ast/create.sk:99:5)");
  }
  return new Node(NodeKind.FUNCTION).withChildren([name, $arguments, block, result]);
};
Node.createVariable = function(name, type, value) {
  if (name.kind !== NodeKind.NAME) {
    throw new Error("assert name.kind == NodeKind.NAME; (src/ast/create.sk:104:5)");
  }
  if (type !== null && !NodeKind.isExpression(type.kind)) {
    throw new Error("assert type == null || type.kind.isExpression(); (src/ast/create.sk:105:5)");
  }
  if (value !== null && !NodeKind.isExpression(value.kind)) {
    throw new Error("assert value == null || value.kind.isExpression(); (src/ast/create.sk:106:5)");
  }
  return new Node(NodeKind.VARIABLE).withChildren([name, type, value]);
};
Node.createParameter = function(name, bound) {
  if (name.kind !== NodeKind.NAME) {
    throw new Error("assert name.kind == NodeKind.NAME; (src/ast/create.sk:111:5)");
  }
  if (bound !== null && !NodeKind.isExpression(bound.kind)) {
    throw new Error("assert bound == null || bound.kind.isExpression(); (src/ast/create.sk:112:5)");
  }
  return new Node(NodeKind.PARAMETER).withChildren([name, bound]);
};
Node.createAlias = function(name, value) {
  if (name.kind !== NodeKind.NAME) {
    throw new Error("assert name.kind == NodeKind.NAME; (src/ast/create.sk:117:5)");
  }
  if (!NodeKind.isExpression(value.kind)) {
    throw new Error("assert value.kind.isExpression(); (src/ast/create.sk:118:5)");
  }
  return new Node(NodeKind.ALIAS).withChildren([name, value]);
};
Node.createUsingAlias = function(name, value) {
  if (name.kind !== NodeKind.NAME) {
    throw new Error("assert name.kind == NodeKind.NAME; (src/ast/create.sk:123:5)");
  }
  if (!NodeKind.isExpression(value.kind)) {
    throw new Error("assert value.kind.isExpression(); (src/ast/create.sk:124:5)");
  }
  return new Node(NodeKind.USING_ALIAS).withChildren([name, value]);
};
Node.createUsingNamespace = function(value) {
  if (!NodeKind.isExpression(value.kind)) {
    throw new Error("assert value.kind.isExpression(); (src/ast/create.sk:129:5)");
  }
  return new Node(NodeKind.USING_NAMESPACE).withChildren([value]);
};
Node.createIf = function(test, trueNode, falseNode) {
  if (!NodeKind.isExpression(test.kind)) {
    throw new Error("assert test.kind.isExpression(); (src/ast/create.sk:134:5)");
  }
  if (trueNode.kind !== NodeKind.BLOCK) {
    throw new Error("assert trueNode.kind == NodeKind.BLOCK; (src/ast/create.sk:135:5)");
  }
  if (falseNode !== null && falseNode.kind !== NodeKind.BLOCK) {
    throw new Error("assert falseNode == null || falseNode.kind == NodeKind.BLOCK; (src/ast/create.sk:136:5)");
  }
  return new Node(NodeKind.IF).withChildren([test, trueNode, falseNode]);
};
Node.createFor = function(setup, test, update, block) {
  if (setup !== null && !NodeKind.isExpression(setup.kind) && setup.kind !== NodeKind.VARIABLE_CLUSTER) {
    throw new Error("assert setup == null || setup.kind.isExpression() || setup.kind == NodeKind.VARIABLE_CLUSTER; (src/ast/create.sk:141:5)");
  }
  if (test !== null && !NodeKind.isExpression(test.kind)) {
    throw new Error("assert test == null || test.kind.isExpression(); (src/ast/create.sk:142:5)");
  }
  if (update !== null && !NodeKind.isExpression(update.kind)) {
    throw new Error("assert update == null || update.kind.isExpression(); (src/ast/create.sk:143:5)");
  }
  if (block.kind !== NodeKind.BLOCK) {
    throw new Error("assert block.kind == NodeKind.BLOCK; (src/ast/create.sk:144:5)");
  }
  return new Node(NodeKind.FOR).withChildren([setup, test, update, block]);
};
Node.createForEach = function(variable, value, block) {
  if (variable.kind !== NodeKind.VARIABLE) {
    throw new Error("assert variable.kind == NodeKind.VARIABLE; (src/ast/create.sk:149:5)");
  }
  if (!NodeKind.isExpression(value.kind)) {
    throw new Error("assert value.kind.isExpression(); (src/ast/create.sk:150:5)");
  }
  if (block.kind !== NodeKind.BLOCK) {
    throw new Error("assert block.kind == NodeKind.BLOCK; (src/ast/create.sk:151:5)");
  }
  return new Node(NodeKind.FOR_EACH).withChildren([variable, value, block]);
};
Node.createWhile = function(test, block) {
  if (!NodeKind.isExpression(test.kind)) {
    throw new Error("assert test.kind.isExpression(); (src/ast/create.sk:156:5)");
  }
  if (block.kind !== NodeKind.BLOCK) {
    throw new Error("assert block.kind == NodeKind.BLOCK; (src/ast/create.sk:157:5)");
  }
  return new Node(NodeKind.WHILE).withChildren([test, block]);
};
Node.createDoWhile = function(block, test) {
  if (test !== null && !NodeKind.isExpression(test.kind)) {
    throw new Error("assert test == null || test.kind.isExpression(); (src/ast/create.sk:162:5)");
  }
  if (block.kind !== NodeKind.BLOCK) {
    throw new Error("assert block.kind == NodeKind.BLOCK; (src/ast/create.sk:163:5)");
  }
  return new Node(NodeKind.DO_WHILE).withChildren([test, block]);
};
Node.createReturn = function(value) {
  if (value !== null && !NodeKind.isExpression(value.kind)) {
    throw new Error("assert value == null || value.kind.isExpression(); (src/ast/create.sk:168:5)");
  }
  return new Node(NodeKind.RETURN).withChildren([value]);
};
Node.createImplicitReturn = function(value) {
  if (value !== null && !NodeKind.isExpression(value.kind)) {
    throw new Error("assert value == null || value.kind.isExpression(); (src/ast/create.sk:173:5)");
  }
  return new Node(NodeKind.IMPLICIT_RETURN).withChildren([value]);
};
Node.createBreak = function() {
  return new Node(NodeKind.BREAK);
};
Node.createContinue = function() {
  return new Node(NodeKind.CONTINUE);
};
Node.createAssert = function(value) {
  if (!NodeKind.isExpression(value.kind)) {
    throw new Error("assert value.kind.isExpression(); (src/ast/create.sk:186:5)");
  }
  return new Node(NodeKind.ASSERT).withChildren([value]);
};
Node.createExpression = function(value) {
  if (!NodeKind.isExpression(value.kind)) {
    throw new Error("assert value.kind.isExpression(); (src/ast/create.sk:191:5)");
  }
  return new Node(NodeKind.EXPRESSION).withChildren([value]);
};
Node.createModifier = function(name, statements) {
  if (name.kind !== NodeKind.NAME) {
    throw new Error("assert name.kind == NodeKind.NAME; (src/ast/create.sk:196:5)");
  }
  if (!checkAllNodeKinds(statements, new NodeKindIsStatement())) {
    throw new Error("assert checkAllNodeKinds(statements, NodeKindIsStatement()); (src/ast/create.sk:197:5)");
  }
  statements.unshift(name);
  return new Node(NodeKind.MODIFIER).withChildren(statements);
};
Node.createSwitch = function(value, cases) {
  if (!NodeKind.isExpression(value.kind)) {
    throw new Error("assert value.kind.isExpression(); (src/ast/create.sk:203:5)");
  }
  if (!checkAllNodeKinds(cases, new NodeKindIsCaseOrDefault())) {
    throw new Error("assert checkAllNodeKinds(cases, NodeKindIsCaseOrDefault()); (src/ast/create.sk:204:5)");
  }
  cases.unshift(value);
  return new Node(NodeKind.SWITCH).withChildren(cases);
};
Node.createName = function(name) {
  return new Node(NodeKind.NAME).withContent(new StringContent(name));
};
Node.createType = function(type) {
  if (type === null) {
    throw new Error("assert type != null; (src/ast/create.sk:214:5)");
  }
  return new Node(NodeKind.TYPE).withType(type);
};
Node.createNull = function() {
  return new Node(NodeKind.NULL);
};
Node.createThis = function() {
  return new Node(NodeKind.THIS);
};
Node.createTrue = function() {
  return new Node(NodeKind.TRUE);
};
Node.createFalse = function() {
  return new Node(NodeKind.FALSE);
};
Node.createHook = function(test, trueNode, falseNode) {
  if (!NodeKind.isExpression(test.kind)) {
    throw new Error("assert test.kind.isExpression(); (src/ast/create.sk:235:5)");
  }
  if (!NodeKind.isExpression(trueNode.kind)) {
    throw new Error("assert trueNode.kind.isExpression(); (src/ast/create.sk:236:5)");
  }
  if (!NodeKind.isExpression(falseNode.kind)) {
    throw new Error("assert falseNode.kind.isExpression(); (src/ast/create.sk:237:5)");
  }
  return new Node(NodeKind.HOOK).withChildren([test, trueNode, falseNode]);
};
Node.createInt = function(value) {
  return new Node(NodeKind.INT).withContent(new IntContent(value));
};
Node.createFloat = function(value) {
  return new Node(NodeKind.FLOAT).withContent(new DoubleContent(value));
};
Node.createDouble = function(value) {
  return new Node(NodeKind.DOUBLE).withContent(new DoubleContent(value));
};
Node.createString = function(value) {
  return new Node(NodeKind.STRING).withContent(new StringContent(value));
};
Node.createInitializer = function(values) {
  if (!checkAllNodeKinds(values, new NodeKindIsExpression())) {
    throw new Error("assert checkAllNodeKinds(values, NodeKindIsExpression()); (src/ast/create.sk:258:5)");
  }
  return new Node(NodeKind.INITIALIZER).withChildren(values);
};
Node.createDot = function(value, name) {
  if (value !== null && !NodeKind.isExpression(value.kind)) {
    throw new Error("assert value == null || value.kind.isExpression(); (src/ast/create.sk:263:5)");
  }
  if (name !== null && name.kind !== NodeKind.NAME) {
    throw new Error("assert name == null || name.kind == NodeKind.NAME; (src/ast/create.sk:264:5)");
  }
  return new Node(NodeKind.DOT).withChildren([value, name]);
};
Node.createLet = function(variable, value) {
  if (variable.kind !== NodeKind.VARIABLE) {
    throw new Error("assert variable.kind == NodeKind.VARIABLE; (src/ast/create.sk:269:5)");
  }
  if (!NodeKind.isExpression(value.kind)) {
    throw new Error("assert value.kind.isExpression(); (src/ast/create.sk:270:5)");
  }
  return new Node(NodeKind.LET).withChildren([variable, value]);
};
Node.createCall = function(value, $arguments) {
  if (!NodeKind.isExpression(value.kind)) {
    throw new Error("assert value.kind.isExpression(); (src/ast/create.sk:275:5)");
  }
  if (!checkAllNodeKinds($arguments, new NodeKindIsExpression())) {
    throw new Error("assert checkAllNodeKinds(arguments, NodeKindIsExpression()); (src/ast/create.sk:276:5)");
  }
  $arguments.unshift(value);
  return new Node(NodeKind.CALL).withChildren($arguments);
};
Node.createSuperCall = function($arguments) {
  if (!checkAllNodeKinds($arguments, new NodeKindIsExpression())) {
    throw new Error("assert checkAllNodeKinds(arguments, NodeKindIsExpression()); (src/ast/create.sk:282:5)");
  }
  return new Node(NodeKind.SUPER_CALL).withChildren($arguments);
};
Node.createError = function() {
  return new Node(NodeKind.ERROR);
};
Node.createBind = function(value) {
  if (!NodeKind.isExpression(value.kind)) {
    throw new Error("assert value.kind.isExpression(); (src/ast/create.sk:294:5)");
  }
  return new Node(NodeKind.BIND).withChildren([value]);
};
Node.createSequence = function(values) {
  if (!checkAllNodeKinds(values, new NodeKindIsExpression())) {
    throw new Error("assert checkAllNodeKinds(values, NodeKindIsExpression()); (src/ast/create.sk:299:5)");
  }
  return new Node(NodeKind.SEQUENCE).withChildren(values);
};
Node.createParameterize = function(type, types) {
  if (!NodeKind.isExpression(type.kind)) {
    throw new Error("assert type.kind.isExpression(); (src/ast/create.sk:304:5)");
  }
  if (!checkAllNodeKinds(types, new NodeKindIsExpression())) {
    throw new Error("assert checkAllNodeKinds(types, NodeKindIsExpression()); (src/ast/create.sk:305:5)");
  }
  types.unshift(type);
  return new Node(NodeKind.PARAMETERIZE).withChildren(types);
};
Node.createCast = function(type, value) {
  if (!NodeKind.isExpression(type.kind)) {
    throw new Error("assert type.kind.isExpression(); (src/ast/create.sk:311:5)");
  }
  if (!NodeKind.isExpression(value.kind)) {
    throw new Error("assert value.kind.isExpression(); (src/ast/create.sk:312:5)");
  }
  return new Node(NodeKind.CAST).withChildren([type, value]);
};
Node.createImplicitCast = function(type, value) {
  if (!NodeKind.isExpression(type.kind)) {
    throw new Error("assert type.kind.isExpression(); (src/ast/create.sk:317:5)");
  }
  if (!NodeKind.isExpression(value.kind)) {
    throw new Error("assert value.kind.isExpression(); (src/ast/create.sk:318:5)");
  }
  return new Node(NodeKind.IMPLICIT_CAST).withChildren([type, value]);
};
Node.createLambda = function($arguments, block) {
  if (!checkAllNodeKinds($arguments, new NodeKindCheck(NodeKind.VARIABLE))) {
    throw new Error("assert checkAllNodeKinds(arguments, NodeKindCheck(NodeKind.VARIABLE)); (src/ast/create.sk:323:5)");
  }
  if (block.kind !== NodeKind.BLOCK) {
    throw new Error("assert block.kind == NodeKind.BLOCK; (src/ast/create.sk:324:5)");
  }
  $arguments.push(block);
  return new Node(NodeKind.LAMBDA).withChildren($arguments);
};
Node.createDefault = function(type) {
  if (!NodeKind.isExpression(type.kind)) {
    throw new Error("assert type.kind.isExpression(); (src/ast/create.sk:330:5)");
  }
  return new Node(NodeKind.DEFAULT).withChildren([type]);
};
Node.createVar = function() {
  return new Node(NodeKind.VAR);
};
Node.createFunctionType = function(result, $arguments) {
  if (!NodeKind.isExpression(result.kind)) {
    throw new Error("assert result.kind.isExpression(); (src/ast/create.sk:339:5)");
  }
  if (!checkAllNodeKinds($arguments, new NodeKindIsExpression())) {
    throw new Error("assert checkAllNodeKinds(arguments, NodeKindIsExpression()); (src/ast/create.sk:340:5)");
  }
  $arguments.unshift(result);
  return new Node(NodeKind.FUNCTION_TYPE).withChildren($arguments);
};
Node.createUnary = function(kind, value) {
  if (!NodeKind.isUnaryOperator(kind)) {
    throw new Error("assert kind.isUnaryOperator(); (src/ast/create.sk:346:5)");
  }
  if (!NodeKind.isExpression(value.kind)) {
    throw new Error("assert value.kind.isExpression(); (src/ast/create.sk:347:5)");
  }
  return new Node(kind).withChildren([value]);
};
Node.createAssign = function(left, right) {
  return Node.createBinary(NodeKind.ASSIGN, left, right);
};
Node.createBinary = function(kind, left, right) {
  if (!NodeKind.isBinaryOperator(kind)) {
    throw new Error("assert kind.isBinaryOperator(); (src/ast/create.sk:356:5)");
  }
  if (!NodeKind.isExpression(left.kind)) {
    throw new Error("assert left.kind.isExpression(); (src/ast/create.sk:357:5)");
  }
  if (!NodeKind.isExpression(right.kind)) {
    throw new Error("assert right.kind.isExpression(); (src/ast/create.sk:358:5)");
  }
  if (kind === NodeKind.ASSIGN && left.kind === NodeKind.INDEX) {
    var target = left.binaryLeft();
    var index = left.binaryRight();
    return Node.createTertiary(NodeKind.ASSIGN_INDEX, target.remove(), index.remove(), right);
  }
  return new Node(kind).withChildren([left, right]);
};
Node.createTertiary = function(kind, left, middle, right) {
  if (!NodeKind.isTertiaryOperator(kind)) {
    throw new Error("assert kind.isTertiaryOperator(); (src/ast/create.sk:371:5)");
  }
  if (!NodeKind.isExpression(left.kind)) {
    throw new Error("assert left.kind.isExpression(); (src/ast/create.sk:372:5)");
  }
  if (!NodeKind.isExpression(middle.kind)) {
    throw new Error("assert middle.kind.isExpression(); (src/ast/create.sk:373:5)");
  }
  if (!NodeKind.isExpression(right.kind)) {
    throw new Error("assert right.kind.isExpression(); (src/ast/create.sk:374:5)");
  }
  return new Node(kind).withChildren([left, middle, right]);
};
Node.prototype.fileBlock = function() {
  if (this.kind !== NodeKind.FILE) {
    throw new Error("assert kind == .FILE; (src/ast/get.sk:3:5)");
  }
  if (this.children.length !== 1) {
    throw new Error("assert children.length == 1; (src/ast/get.sk:4:5)");
  }
  return this.children.get(0);
};
Node.prototype.dotTarget = function() {
  if (this.kind !== NodeKind.DOT) {
    throw new Error("assert kind == .DOT; (src/ast/get.sk:9:5)");
  }
  if (this.children.length !== 2) {
    throw new Error("assert children.length == 2; (src/ast/get.sk:10:5)");
  }
  return this.children.get(0);
};
Node.prototype.dotName = function() {
  if (this.kind !== NodeKind.DOT) {
    throw new Error("assert kind == .DOT; (src/ast/get.sk:15:5)");
  }
  if (this.children.length !== 2) {
    throw new Error("assert children.length == 2; (src/ast/get.sk:16:5)");
  }
  if (this.children.get(1) !== null && this.children.get(1).kind !== NodeKind.NAME) {
    throw new Error("assert children.get(1) == null || children.get(1).kind == .NAME; (src/ast/get.sk:17:5)");
  }
  return this.children.get(1);
};
Node.prototype.letVariable = function() {
  if (this.kind !== NodeKind.LET) {
    throw new Error("assert kind == .LET; (src/ast/get.sk:22:5)");
  }
  if (this.children.length !== 2) {
    throw new Error("assert children.length == 2; (src/ast/get.sk:23:5)");
  }
  return this.children.get(0);
};
Node.prototype.letValue = function() {
  if (this.kind !== NodeKind.LET) {
    throw new Error("assert kind == .LET; (src/ast/get.sk:28:5)");
  }
  if (this.children.length !== 2) {
    throw new Error("assert children.length == 2; (src/ast/get.sk:29:5)");
  }
  return this.children.get(1);
};
Node.prototype.unaryValue = function() {
  if (!NodeKind.isUnaryOperator(this.kind)) {
    throw new Error("assert kind.isUnaryOperator(); (src/ast/get.sk:34:5)");
  }
  if (this.children.length !== 1) {
    throw new Error("assert children.length == 1; (src/ast/get.sk:35:5)");
  }
  return this.children.get(0);
};
Node.prototype.binaryLeft = function() {
  if (!NodeKind.isBinaryOperator(this.kind)) {
    throw new Error("assert kind.isBinaryOperator(); (src/ast/get.sk:40:5)");
  }
  if (this.children.length !== 2) {
    throw new Error("assert children.length == 2; (src/ast/get.sk:41:5)");
  }
  return this.children.get(0);
};
Node.prototype.binaryRight = function() {
  if (!NodeKind.isBinaryOperator(this.kind)) {
    throw new Error("assert kind.isBinaryOperator(); (src/ast/get.sk:46:5)");
  }
  if (this.children.length !== 2) {
    throw new Error("assert children.length == 2; (src/ast/get.sk:47:5)");
  }
  return this.children.get(1);
};
Node.prototype.tertiaryLeft = function() {
  if (!NodeKind.isTertiaryOperator(this.kind)) {
    throw new Error("assert kind.isTertiaryOperator(); (src/ast/get.sk:52:5)");
  }
  if (this.children.length !== 3) {
    throw new Error("assert children.length == 3; (src/ast/get.sk:53:5)");
  }
  return this.children.get(0);
};
Node.prototype.tertiaryMiddle = function() {
  if (!NodeKind.isTertiaryOperator(this.kind)) {
    throw new Error("assert kind.isTertiaryOperator(); (src/ast/get.sk:58:5)");
  }
  if (this.children.length !== 3) {
    throw new Error("assert children.length == 3; (src/ast/get.sk:59:5)");
  }
  return this.children.get(1);
};
Node.prototype.tertiaryRight = function() {
  if (!NodeKind.isTertiaryOperator(this.kind)) {
    throw new Error("assert kind.isTertiaryOperator(); (src/ast/get.sk:64:5)");
  }
  if (this.children.length !== 3) {
    throw new Error("assert children.length == 3; (src/ast/get.sk:65:5)");
  }
  return this.children.get(2);
};
Node.prototype.hookTest = function() {
  if (this.kind !== NodeKind.HOOK) {
    throw new Error("assert kind == .HOOK; (src/ast/get.sk:70:5)");
  }
  if (this.children.length !== 3) {
    throw new Error("assert children.length == 3; (src/ast/get.sk:71:5)");
  }
  return this.children.get(0);
};
Node.prototype.hookTrue = function() {
  if (this.kind !== NodeKind.HOOK) {
    throw new Error("assert kind == .HOOK; (src/ast/get.sk:76:5)");
  }
  if (this.children.length !== 3) {
    throw new Error("assert children.length == 3; (src/ast/get.sk:77:5)");
  }
  return this.children.get(1);
};
Node.prototype.hookFalse = function() {
  if (this.kind !== NodeKind.HOOK) {
    throw new Error("assert kind == .HOOK; (src/ast/get.sk:82:5)");
  }
  if (this.children.length !== 3) {
    throw new Error("assert children.length == 3; (src/ast/get.sk:83:5)");
  }
  return this.children.get(2);
};
Node.prototype.declarationName = function() {
  if (!NodeKind.isNamedDeclaration(this.kind)) {
    throw new Error("assert kind.isNamedDeclaration(); (src/ast/get.sk:88:5)");
  }
  if (this.children.length < 1) {
    throw new Error("assert children.length >= 1; (src/ast/get.sk:89:5)");
  }
  if (this.children.get(0) !== null && this.children.get(0).kind !== NodeKind.NAME) {
    throw new Error("assert children.get(0) == null || children.get(0).kind == .NAME; (src/ast/get.sk:90:5)");
  }
  return this.children.get(0);
};
Node.prototype.declarationBlock = function() {
  if (!NodeKind.isNamedBlockDeclaration(this.kind)) {
    throw new Error("assert kind.isNamedBlockDeclaration(); (src/ast/get.sk:95:5)");
  }
  if (this.children.length < 2) {
    throw new Error("assert children.length >= 2; (src/ast/get.sk:96:5)");
  }
  if (this.children.get(1).kind !== NodeKind.BLOCK) {
    throw new Error("assert children.get(1).kind == .BLOCK; (src/ast/get.sk:97:5)");
  }
  return this.children.get(1);
};
Node.prototype.clusterType = function() {
  if (this.kind !== NodeKind.VARIABLE_CLUSTER) {
    throw new Error("assert kind == .VARIABLE_CLUSTER; (src/ast/get.sk:102:5)");
  }
  if (this.children.length < 1) {
    throw new Error("assert children.length >= 1; (src/ast/get.sk:103:5)");
  }
  return this.children.get(0);
};
Node.prototype.clusterVariables = function() {
  if (this.kind !== NodeKind.VARIABLE_CLUSTER) {
    throw new Error("assert kind == .VARIABLE_CLUSTER; (src/ast/get.sk:108:5)");
  }
  if (this.children.length < 1) {
    throw new Error("assert children.length >= 1; (src/ast/get.sk:109:5)");
  }
  return this.children.slice(1, this.children.length);
};
Node.prototype.variableType = function() {
  if (this.kind !== NodeKind.VARIABLE) {
    throw new Error("assert kind == .VARIABLE; (src/ast/get.sk:114:5)");
  }
  if (this.children.length !== 3) {
    throw new Error("assert children.length == 3; (src/ast/get.sk:115:5)");
  }
  return this.children.get(1);
};
Node.prototype.variableValue = function() {
  if (this.kind !== NodeKind.VARIABLE) {
    throw new Error("assert kind == .VARIABLE; (src/ast/get.sk:120:5)");
  }
  if (this.children.length !== 3) {
    throw new Error("assert children.length == 3; (src/ast/get.sk:121:5)");
  }
  return this.children.get(2);
};
Node.prototype.aliasValue = function() {
  if (this.kind !== NodeKind.ALIAS && this.kind !== NodeKind.USING_ALIAS) {
    throw new Error("assert kind == .ALIAS || kind == .USING_ALIAS; (src/ast/get.sk:126:5)");
  }
  if (this.children.length !== 2) {
    throw new Error("assert children.length == 2; (src/ast/get.sk:127:5)");
  }
  return this.children.get(1);
};
Node.prototype.usingNamespaceValue = function() {
  if (this.kind !== NodeKind.USING_NAMESPACE) {
    throw new Error("assert kind == .USING_NAMESPACE; (src/ast/get.sk:132:5)");
  }
  if (this.children.length !== 1) {
    throw new Error("assert children.length == 1; (src/ast/get.sk:133:5)");
  }
  return this.children.get(0);
};
Node.prototype.modifierName = function() {
  if (this.kind !== NodeKind.MODIFIER) {
    throw new Error("assert kind == .MODIFIER; (src/ast/get.sk:138:5)");
  }
  if (this.children.length !== 2) {
    throw new Error("assert children.length == 2; (src/ast/get.sk:139:5)");
  }
  if (this.children.get(0).kind !== NodeKind.NAME) {
    throw new Error("assert children.get(0).kind == .NAME; (src/ast/get.sk:140:5)");
  }
  return this.children.get(0);
};
Node.prototype.modifierStatements = function() {
  if (this.kind !== NodeKind.MODIFIER) {
    throw new Error("assert kind == .MODIFIER; (src/ast/get.sk:145:5)");
  }
  if (this.children.length < 1) {
    throw new Error("assert children.length >= 1; (src/ast/get.sk:146:5)");
  }
  return this.children.slice(1, this.children.length);
};
Node.prototype.castType = function() {
  if (!NodeKind.isCast(this.kind)) {
    throw new Error("assert kind.isCast(); (src/ast/get.sk:151:5)");
  }
  if (this.children.length !== 2) {
    throw new Error("assert children.length == 2; (src/ast/get.sk:152:5)");
  }
  return this.children.get(0);
};
Node.prototype.castValue = function() {
  if (!NodeKind.isCast(this.kind)) {
    throw new Error("assert kind.isCast(); (src/ast/get.sk:157:5)");
  }
  if (this.children.length !== 2) {
    throw new Error("assert children.length == 2; (src/ast/get.sk:158:5)");
  }
  return this.children.get(1);
};
Node.prototype.expressionValue = function() {
  if (this.kind !== NodeKind.EXPRESSION) {
    throw new Error("assert kind == .EXPRESSION; (src/ast/get.sk:163:5)");
  }
  if (this.children.length !== 1) {
    throw new Error("assert children.length == 1; (src/ast/get.sk:164:5)");
  }
  return this.children.get(0);
};
Node.prototype.ifTest = function() {
  if (this.kind !== NodeKind.IF) {
    throw new Error("assert kind == .IF; (src/ast/get.sk:169:5)");
  }
  if (this.children.length !== 3) {
    throw new Error("assert children.length == 3; (src/ast/get.sk:170:5)");
  }
  return this.children.get(0);
};
Node.prototype.ifTrue = function() {
  if (this.kind !== NodeKind.IF) {
    throw new Error("assert kind == .IF; (src/ast/get.sk:175:5)");
  }
  if (this.children.length !== 3) {
    throw new Error("assert children.length == 3; (src/ast/get.sk:176:5)");
  }
  if (this.children.get(1) !== null && this.children.get(1).kind !== NodeKind.BLOCK) {
    throw new Error("assert children.get(1) == null || children.get(1).kind == .BLOCK; (src/ast/get.sk:177:5)");
  }
  return this.children.get(1);
};
Node.prototype.ifFalse = function() {
  if (this.kind !== NodeKind.IF) {
    throw new Error("assert kind == .IF; (src/ast/get.sk:182:5)");
  }
  if (this.children.length !== 3) {
    throw new Error("assert children.length == 3; (src/ast/get.sk:183:5)");
  }
  if (this.children.get(2) !== null && this.children.get(2).kind !== NodeKind.BLOCK) {
    throw new Error("assert children.get(2) == null || children.get(2).kind == .BLOCK; (src/ast/get.sk:184:5)");
  }
  return this.children.get(2);
};
Node.prototype.forSetup = function() {
  if (this.kind !== NodeKind.FOR) {
    throw new Error("assert kind == .FOR; (src/ast/get.sk:189:5)");
  }
  if (this.children.length !== 4) {
    throw new Error("assert children.length == 4; (src/ast/get.sk:190:5)");
  }
  return this.children.get(0);
};
Node.prototype.forTest = function() {
  if (this.kind !== NodeKind.FOR) {
    throw new Error("assert kind == .FOR; (src/ast/get.sk:195:5)");
  }
  if (this.children.length !== 4) {
    throw new Error("assert children.length == 4; (src/ast/get.sk:196:5)");
  }
  return this.children.get(1);
};
Node.prototype.forUpdate = function() {
  if (this.kind !== NodeKind.FOR) {
    throw new Error("assert kind == .FOR; (src/ast/get.sk:201:5)");
  }
  if (this.children.length !== 4) {
    throw new Error("assert children.length == 4; (src/ast/get.sk:202:5)");
  }
  return this.children.get(2);
};
Node.prototype.forBlock = function() {
  if (this.kind !== NodeKind.FOR) {
    throw new Error("assert kind == .FOR; (src/ast/get.sk:207:5)");
  }
  if (this.children.length !== 4) {
    throw new Error("assert children.length == 4; (src/ast/get.sk:208:5)");
  }
  if (this.children.get(3).kind !== NodeKind.BLOCK) {
    throw new Error("assert children.get(3).kind == .BLOCK; (src/ast/get.sk:209:5)");
  }
  return this.children.get(3);
};
Node.prototype.forEachVariable = function() {
  if (this.kind !== NodeKind.FOR_EACH) {
    throw new Error("assert kind == .FOR_EACH; (src/ast/get.sk:214:5)");
  }
  if (this.children.length !== 3) {
    throw new Error("assert children.length == 3; (src/ast/get.sk:215:5)");
  }
  if (this.children.get(0).kind !== NodeKind.VARIABLE) {
    throw new Error("assert children.get(0).kind == .VARIABLE; (src/ast/get.sk:216:5)");
  }
  return this.children.get(0);
};
Node.prototype.forEachValue = function() {
  if (this.kind !== NodeKind.FOR_EACH) {
    throw new Error("assert kind == .FOR_EACH; (src/ast/get.sk:221:5)");
  }
  if (this.children.length !== 3) {
    throw new Error("assert children.length == 3; (src/ast/get.sk:222:5)");
  }
  return this.children.get(1);
};
Node.prototype.forEachBlock = function() {
  if (this.kind !== NodeKind.FOR_EACH) {
    throw new Error("assert kind == .FOR_EACH; (src/ast/get.sk:227:5)");
  }
  if (this.children.length !== 3) {
    throw new Error("assert children.length == 3; (src/ast/get.sk:228:5)");
  }
  if (this.children.get(2).kind !== NodeKind.BLOCK) {
    throw new Error("assert children.get(2).kind == .BLOCK; (src/ast/get.sk:229:5)");
  }
  return this.children.get(2);
};
Node.prototype.whileTest = function() {
  if (this.kind !== NodeKind.WHILE && this.kind !== NodeKind.DO_WHILE) {
    throw new Error("assert kind == .WHILE || kind == .DO_WHILE; (src/ast/get.sk:234:5)");
  }
  if (this.children.length !== 2) {
    throw new Error("assert children.length == 2; (src/ast/get.sk:235:5)");
  }
  return this.children.get(0);
};
Node.prototype.whileBlock = function() {
  if (this.kind !== NodeKind.WHILE && this.kind !== NodeKind.DO_WHILE) {
    throw new Error("assert kind == .WHILE || kind == .DO_WHILE; (src/ast/get.sk:240:5)");
  }
  if (this.children.length !== 2) {
    throw new Error("assert children.length == 2; (src/ast/get.sk:241:5)");
  }
  if (this.children.get(1).kind !== NodeKind.BLOCK) {
    throw new Error("assert children.get(1).kind == .BLOCK; (src/ast/get.sk:242:5)");
  }
  return this.children.get(1);
};
Node.prototype.defaultType = function() {
  if (this.kind !== NodeKind.DEFAULT) {
    throw new Error("assert kind == .DEFAULT; (src/ast/get.sk:247:5)");
  }
  if (this.children.length !== 1) {
    throw new Error("assert children.length == 1; (src/ast/get.sk:248:5)");
  }
  return this.children.get(0);
};
Node.prototype.baseTypes = function() {
  if (!NodeKind.isObject(this.kind) && this.kind !== NodeKind.EXTENSION) {
    throw new Error("assert kind.isObject() || kind == .EXTENSION; (src/ast/get.sk:253:5)");
  }
  if (this.children.length < 3) {
    throw new Error("assert children.length >= 3; (src/ast/get.sk:254:5)");
  }
  if (this.children.get(2) !== null && this.children.get(2).kind !== NodeKind.NODE_LIST) {
    throw new Error("assert children.get(2) == null || children.get(2).kind == .NODE_LIST; (src/ast/get.sk:255:5)");
  }
  return this.children.get(2);
};
Node.prototype.objectParameters = function() {
  if (!NodeKind.isObject(this.kind)) {
    throw new Error("assert kind.isObject(); (src/ast/get.sk:260:5)");
  }
  if (this.children.length !== 4) {
    throw new Error("assert children.length == 4; (src/ast/get.sk:261:5)");
  }
  if (this.children.get(3) !== null && this.children.get(3).kind !== NodeKind.NODE_LIST) {
    throw new Error("assert children.get(3) == null || children.get(3).kind == .NODE_LIST; (src/ast/get.sk:262:5)");
  }
  return this.children.get(3);
};
Node.prototype.functionArguments = function() {
  if (!NodeKind.isFunction(this.kind)) {
    throw new Error("assert kind.isFunction(); (src/ast/get.sk:267:5)");
  }
  if (this.children.length < 4) {
    throw new Error("assert children.length >= 4; (src/ast/get.sk:268:5)");
  }
  if (this.children.get(1).kind !== NodeKind.NODE_LIST) {
    throw new Error("assert children.get(1).kind == .NODE_LIST; (src/ast/get.sk:269:5)");
  }
  return this.children.get(1);
};
Node.prototype.functionBlock = function() {
  if (!NodeKind.isFunction(this.kind)) {
    throw new Error("assert kind.isFunction(); (src/ast/get.sk:274:5)");
  }
  if (this.children.length < 4) {
    throw new Error("assert children.length >= 4; (src/ast/get.sk:275:5)");
  }
  if (this.children.get(2) !== null && this.children.get(2).kind !== NodeKind.BLOCK) {
    throw new Error("assert children.get(2) == null || children.get(2).kind == .BLOCK; (src/ast/get.sk:276:5)");
  }
  return this.children.get(2);
};
Node.prototype.functionResult = function() {
  if (this.kind !== NodeKind.FUNCTION) {
    throw new Error("assert kind == .FUNCTION; (src/ast/get.sk:281:5)");
  }
  if (this.children.length !== 4) {
    throw new Error("assert children.length == 4; (src/ast/get.sk:282:5)");
  }
  return this.children.get(3);
};
Node.prototype.superInitializer = function() {
  if (this.kind !== NodeKind.CONSTRUCTOR) {
    throw new Error("assert kind == .CONSTRUCTOR; (src/ast/get.sk:287:5)");
  }
  if (this.children.length !== 5) {
    throw new Error("assert children.length == 5; (src/ast/get.sk:288:5)");
  }
  return this.children.get(3);
};
Node.prototype.memberInitializers = function() {
  if (this.kind !== NodeKind.CONSTRUCTOR) {
    throw new Error("assert kind == .CONSTRUCTOR; (src/ast/get.sk:293:5)");
  }
  if (this.children.length !== 5) {
    throw new Error("assert children.length == 5; (src/ast/get.sk:294:5)");
  }
  return this.children.get(4);
};
Node.prototype.memberInitializerName = function() {
  if (this.kind !== NodeKind.MEMBER_INITIALIZER) {
    throw new Error("assert kind == .MEMBER_INITIALIZER; (src/ast/get.sk:299:5)");
  }
  if (this.children.length !== 2) {
    throw new Error("assert children.length == 2; (src/ast/get.sk:300:5)");
  }
  return this.children.get(0);
};
Node.prototype.memberInitializerValue = function() {
  if (this.kind !== NodeKind.MEMBER_INITIALIZER) {
    throw new Error("assert kind == .MEMBER_INITIALIZER; (src/ast/get.sk:305:5)");
  }
  if (this.children.length !== 2) {
    throw new Error("assert children.length == 2; (src/ast/get.sk:306:5)");
  }
  return this.children.get(1);
};
Node.prototype.lambdaArguments = function() {
  if (this.kind !== NodeKind.LAMBDA) {
    throw new Error("assert kind == .LAMBDA; (src/ast/get.sk:311:5)");
  }
  if (this.children.length < 1) {
    throw new Error("assert children.length >= 1; (src/ast/get.sk:312:5)");
  }
  return this.children.slice(0, this.children.length - 1 | 0);
};
Node.prototype.lambdaBlock = function() {
  if (this.kind !== NodeKind.LAMBDA) {
    throw new Error("assert kind == .LAMBDA; (src/ast/get.sk:317:5)");
  }
  if (this.children.length < 1) {
    throw new Error("assert children.length >= 1; (src/ast/get.sk:318:5)");
  }
  if (this.children.get(this.children.length - 1 | 0).kind !== NodeKind.BLOCK) {
    throw new Error("assert children.get(children.length - 1).kind == .BLOCK; (src/ast/get.sk:319:5)");
  }
  return this.children.get(this.children.length - 1 | 0);
};
Node.prototype.assertValue = function() {
  if (this.kind !== NodeKind.ASSERT) {
    throw new Error("assert kind == .ASSERT; (src/ast/get.sk:324:5)");
  }
  if (this.children.length !== 1) {
    throw new Error("assert children.length == 1; (src/ast/get.sk:325:5)");
  }
  return this.children.get(0);
};
Node.prototype.bindValue = function() {
  if (this.kind !== NodeKind.BIND) {
    throw new Error("assert kind == .BIND; (src/ast/get.sk:330:5)");
  }
  if (this.children.length !== 1) {
    throw new Error("assert children.length == 1; (src/ast/get.sk:331:5)");
  }
  return this.children.get(0);
};
Node.prototype.parameterizeType = function() {
  if (this.kind !== NodeKind.PARAMETERIZE) {
    throw new Error("assert kind == .PARAMETERIZE; (src/ast/get.sk:336:5)");
  }
  if (this.children.length < 1) {
    throw new Error("assert children.length >= 1; (src/ast/get.sk:337:5)");
  }
  return this.children.get(0);
};
Node.prototype.parameterizeTypes = function() {
  if (this.kind !== NodeKind.PARAMETERIZE) {
    throw new Error("assert kind == .PARAMETERIZE; (src/ast/get.sk:342:5)");
  }
  if (this.children.length < 1) {
    throw new Error("assert children.length >= 1; (src/ast/get.sk:343:5)");
  }
  return this.children.slice(1, this.children.length);
};
Node.prototype.functionTypeResult = function() {
  if (this.kind !== NodeKind.FUNCTION_TYPE) {
    throw new Error("assert kind == .FUNCTION_TYPE; (src/ast/get.sk:348:5)");
  }
  if (this.children.length < 1) {
    throw new Error("assert children.length >= 1; (src/ast/get.sk:349:5)");
  }
  return this.children.get(0);
};
Node.prototype.functionTypeArguments = function() {
  if (this.kind !== NodeKind.FUNCTION_TYPE) {
    throw new Error("assert kind == .FUNCTION_TYPE; (src/ast/get.sk:354:5)");
  }
  if (this.children.length < 1) {
    throw new Error("assert children.length >= 1; (src/ast/get.sk:355:5)");
  }
  return this.children.slice(1, this.children.length);
};
Node.prototype.callValue = function() {
  if (this.kind !== NodeKind.CALL) {
    throw new Error("assert kind == .CALL; (src/ast/get.sk:360:5)");
  }
  if (this.children.length < 1) {
    throw new Error("assert children.length >= 1; (src/ast/get.sk:361:5)");
  }
  return this.children.get(0);
};
Node.prototype.callArguments = function() {
  if (this.kind !== NodeKind.CALL) {
    throw new Error("assert kind == .CALL; (src/ast/get.sk:366:5)");
  }
  if (this.children.length < 1) {
    throw new Error("assert children.length >= 1; (src/ast/get.sk:367:5)");
  }
  return this.children.slice(1, this.children.length);
};
Node.prototype.superCallArguments = function() {
  if (this.kind !== NodeKind.SUPER_CALL) {
    throw new Error("assert kind == .SUPER_CALL; (src/ast/get.sk:372:5)");
  }
  return this.children;
};
Node.prototype.initializerValues = function() {
  if (this.kind !== NodeKind.INITIALIZER) {
    throw new Error("assert kind == .INITIALIZER; (src/ast/get.sk:377:5)");
  }
  return this.children;
};
Node.prototype.parameterBound = function() {
  if (this.kind !== NodeKind.PARAMETER) {
    throw new Error("assert kind == .PARAMETER; (src/ast/get.sk:382:5)");
  }
  if (this.children.length !== 2) {
    throw new Error("assert children.length == 2; (src/ast/get.sk:383:5)");
  }
  return this.children.get(1);
};
Node.prototype.returnValue = function() {
  if (this.kind !== NodeKind.RETURN && this.kind !== NodeKind.IMPLICIT_RETURN) {
    throw new Error("assert kind == .RETURN || kind == .IMPLICIT_RETURN; (src/ast/get.sk:388:5)");
  }
  if (this.children.length !== 1) {
    throw new Error("assert children.length == 1; (src/ast/get.sk:389:5)");
  }
  return this.children.get(0);
};
Node.prototype.switchValue = function() {
  if (this.kind !== NodeKind.SWITCH) {
    throw new Error("assert kind == .SWITCH; (src/ast/get.sk:394:5)");
  }
  if (this.children.length < 1) {
    throw new Error("assert children.length >= 1; (src/ast/get.sk:395:5)");
  }
  return this.children.get(0);
};
Node.prototype.switchCases = function() {
  if (this.kind !== NodeKind.SWITCH) {
    throw new Error("assert kind == .SWITCH; (src/ast/get.sk:400:5)");
  }
  if (this.children.length < 1) {
    throw new Error("assert children.length >= 1; (src/ast/get.sk:401:5)");
  }
  return this.children.slice(1, this.children.length);
};
Node.prototype.caseValues = function() {
  if (this.kind !== NodeKind.CASE) {
    throw new Error("assert kind == .CASE; (src/ast/get.sk:406:5)");
  }
  if (this.children.length < 1) {
    throw new Error("assert children.length >= 1; (src/ast/get.sk:407:5)");
  }
  return this.children.slice(0, this.children.length - 1 | 0);
};
Node.prototype.caseBlock = function() {
  if (this.kind !== NodeKind.CASE) {
    throw new Error("assert kind == .CASE; (src/ast/get.sk:412:5)");
  }
  if (this.children.length < 1) {
    throw new Error("assert children.length >= 1; (src/ast/get.sk:413:5)");
  }
  if (this.children.get(this.children.length - 1 | 0).kind !== NodeKind.BLOCK) {
    throw new Error("assert children.get(children.length - 1).kind == .BLOCK; (src/ast/get.sk:414:5)");
  }
  return this.children.get(this.children.length - 1 | 0);
};
Node.prototype.invertBooleanCondition = function(cache) {
  if (!NodeKind.isExpression(this.kind)) {
    throw new Error("assert kind.isExpression(); (src/ast/logic.sk:3:5)");
  }
  switch (this.kind) {
  case 39:
    this.kind = NodeKind.FALSE;
    return;
  case 40:
    this.kind = NodeKind.TRUE;
    return;
  case 60:
    this.become(this.unaryValue().remove());
    return;
  case 73:
    this.kind = NodeKind.NOT_EQUAL;
    return;
  case 83:
    this.kind = NodeKind.EQUAL;
    return;
  case 81:
    this.kind = NodeKind.LOGICAL_AND;
    this.binaryLeft().invertBooleanCondition(cache);
    this.binaryRight().invertBooleanCondition(cache);
    return;
  case 80:
    this.kind = NodeKind.LOGICAL_OR;
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
        this.kind = NodeKind.GREATER_THAN_OR_EQUAL;
        break;
      case 74:
        this.kind = NodeKind.LESS_THAN_OR_EQUAL;
        break;
      case 79:
        this.kind = NodeKind.GREATER_THAN;
        break;
      case 75:
        this.kind = NodeKind.LESS_THAN;
        break;
      }
      return;
    }
    break;
  }
  var children = this.removeChildren();
  this.become(Node.createUnary(NodeKind.NOT, this.clone().withChildren(children)).withType(cache.boolType));
};
Node.prototype.blockAlwaysEndsWithReturn = function() {
  if (this.kind !== NodeKind.BLOCK) {
    throw new Error("assert kind == .BLOCK; (src/ast/logic.sk:83:5)");
  }
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
  if (!NodeKind.isBool(this.kind)) {
    throw new Error("assert kind.isBool(); (src/ast/node.sk:223:5)");
  }
  return this.kind === NodeKind.TRUE;
};
Node.prototype.asInt = function() {
  if (this.kind !== NodeKind.INT) {
    throw new Error("assert kind == .INT; (src/ast/node.sk:228:5)");
  }
  if (this.content === null) {
    throw new Error("assert content != null; (src/ast/node.sk:229:5)");
  }
  if (this.content.type() !== ContentType.INT) {
    throw new Error("assert content.type() == .INT; (src/ast/node.sk:230:5)");
  }
  return this.content.value;
};
Node.prototype.asDouble = function() {
  if (!NodeKind.isReal(this.kind)) {
    throw new Error("assert kind.isReal(); (src/ast/node.sk:235:5)");
  }
  if (this.content === null) {
    throw new Error("assert content != null; (src/ast/node.sk:236:5)");
  }
  if (this.content.type() !== ContentType.DOUBLE) {
    throw new Error("assert content.type() == .DOUBLE; (src/ast/node.sk:237:5)");
  }
  return this.content.value;
};
Node.prototype.asString = function() {
  if (this.kind !== NodeKind.NAME && this.kind !== NodeKind.STRING) {
    throw new Error("assert kind == .NAME || kind == .STRING; (src/ast/node.sk:242:5)");
  }
  if (this.content === null) {
    throw new Error("assert content != null; (src/ast/node.sk:243:5)");
  }
  if (this.content.type() !== ContentType.STRING) {
    throw new Error("assert content.type() == .STRING; (src/ast/node.sk:244:5)");
  }
  return this.content.value;
};
Node.prototype.hasChildren = function() {
  return this.children !== null && this.children.length > 0;
};
Node.prototype.indexInParent = function() {
  if (this.parent === null) {
    throw new Error("assert parent != null; (src/ast/node.sk:253:5)");
  }
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
    if (index < 0 || index >= this.parent.children.length) {
      throw new Error("assert index >= 0 && index < parent.children.length; (src/ast/node.sk:284:7)");
    }
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
  if (this.children === null) {
    throw new Error("assert children != null; (src/ast/node.sk:325:5)");
  }
  if (index < 0 || index > this.children.length) {
    throw new Error("assert index >= 0 && index <= children.length; (src/ast/node.sk:326:5)");
  }
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
  if (index < 0 || index > this.children.length) {
    throw new Error("assert index >= 0 && index <= children.length; (src/ast/node.sk:335:5)");
  }
  Node.updateParent(node, this);
  this.children.insert(index, node);
};
Node.prototype.insertChildren = function(index, nodes) {
  if (this.children === null) {
    this.children = [];
  }
  if (index < 0 || index > this.children.length) {
    throw new Error("assert index >= 0 && index <= children.length; (src/ast/node.sk:342:5)");
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
  if (this.children !== null) {
    throw new Error("assert children == null; (src/ast/node.sk:387:5)");
  }
  for (var i = 0; i < nodes.length; i = i + 1 | 0) {
    Node.updateParent(nodes.get(i), this);
  }
  this.children = nodes;
  return this;
};
Node.prototype.firstNonExtensionSibling = function() {
  var node = this;
  while (node !== null && node.kind === NodeKind.EXTENSION) {
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
    if (node.parent !== null) {
      throw new Error("assert node.parent == null; (src/ast/node.sk:413:7)");
    }
    node.parent = parent;
  }
};
function NodeKindCheck(_0) {
  this.kind = _0;
}
NodeKindCheck.prototype.$call = function(node) {
  return node.kind === this.kind;
};
function NodeKindIsCaseOrDefault() {
}
NodeKindIsCaseOrDefault.prototype.$call = function(node) {
  return node.kind === NodeKind.CASE || node.kind === NodeKind.DEFAULT;
};
function NodeKindIsStatement() {
}
NodeKindIsStatement.prototype.$call = function(node) {
  return NodeKind.isStatement(node.kind);
};
function NodeKindIsExpression() {
}
NodeKindIsExpression.prototype.$call = function(node) {
  return NodeKind.isExpression(node.kind);
};
var NodeKind = {
  PROGRAM: 0,
  FILE: 1,
  BLOCK: 2,
  NODE_LIST: 3,
  CASE: 4,
  MEMBER_INITIALIZER: 5,
  VARIABLE_CLUSTER: 6,
  NAMESPACE: 7,
  ENUM: 8,
  ENUM_FLAGS: 9,
  CLASS: 10,
  STRUCT: 11,
  INTERFACE: 12,
  EXTENSION: 13,
  CONSTRUCTOR: 14,
  FUNCTION: 15,
  VARIABLE: 16,
  PARAMETER: 17,
  ALIAS: 18,
  USING_ALIAS: 19,
  IF: 20,
  FOR: 21,
  FOR_EACH: 22,
  WHILE: 23,
  DO_WHILE: 24,
  RETURN: 25,
  IMPLICIT_RETURN: 26,
  BREAK: 27,
  CONTINUE: 28,
  ASSERT: 29,
  EXPRESSION: 30,
  SWITCH: 31,
  MODIFIER: 32,
  USING_NAMESPACE: 33,
  NAME: 34,
  TYPE: 35,
  THIS: 36,
  HOOK: 37,
  NULL: 38,
  TRUE: 39,
  FALSE: 40,
  INT: 41,
  FLOAT: 42,
  DOUBLE: 43,
  STRING: 44,
  INITIALIZER: 45,
  DOT: 46,
  LET: 47,
  CALL: 48,
  SUPER_CALL: 49,
  ERROR: 50,
  BIND: 51,
  SEQUENCE: 52,
  PARAMETERIZE: 53,
  CAST: 54,
  IMPLICIT_CAST: 55,
  LAMBDA: 56,
  DEFAULT: 57,
  VAR: 58,
  FUNCTION_TYPE: 59,
  NOT: 60,
  POSITIVE: 61,
  NEGATIVE: 62,
  COMPLEMENT: 63,
  PREFIX_INCREMENT: 64,
  PREFIX_DECREMENT: 65,
  POSTFIX_INCREMENT: 66,
  POSTFIX_DECREMENT: 67,
  ADD: 68,
  BITWISE_AND: 69,
  BITWISE_OR: 70,
  BITWISE_XOR: 71,
  DIVIDE: 72,
  EQUAL: 73,
  GREATER_THAN: 74,
  GREATER_THAN_OR_EQUAL: 75,
  IN: 76,
  INDEX: 77,
  LESS_THAN: 78,
  LESS_THAN_OR_EQUAL: 79,
  LOGICAL_AND: 80,
  LOGICAL_OR: 81,
  MULTIPLY: 82,
  NOT_EQUAL: 83,
  REMAINDER: 84,
  SHIFT_LEFT: 85,
  SHIFT_RIGHT: 86,
  SUBTRACT: 87,
  ASSIGN: 88,
  ASSIGN_ADD: 89,
  ASSIGN_BITWISE_AND: 90,
  ASSIGN_BITWISE_OR: 91,
  ASSIGN_BITWISE_XOR: 92,
  ASSIGN_DIVIDE: 93,
  ASSIGN_MULTIPLY: 94,
  ASSIGN_REMAINDER: 95,
  ASSIGN_SHIFT_LEFT: 96,
  ASSIGN_SHIFT_RIGHT: 97,
  ASSIGN_SUBTRACT: 98,
  ASSIGN_INDEX: 99
};
NodeKind.isStatement = function($this) {
  return $this >= NodeKind.VARIABLE_CLUSTER && $this <= NodeKind.USING_NAMESPACE;
};
NodeKind.isNamedBlockDeclaration = function($this) {
  return $this >= NodeKind.NAMESPACE && $this <= NodeKind.EXTENSION;
};
NodeKind.isNamedDeclaration = function($this) {
  return $this >= NodeKind.NAMESPACE && $this <= NodeKind.USING_ALIAS;
};
NodeKind.isEnum = function($this) {
  return $this >= NodeKind.ENUM && $this <= NodeKind.ENUM_FLAGS;
};
NodeKind.isObject = function($this) {
  return $this >= NodeKind.CLASS && $this <= NodeKind.INTERFACE;
};
NodeKind.isFunction = function($this) {
  return $this >= NodeKind.CONSTRUCTOR && $this <= NodeKind.FUNCTION;
};
NodeKind.isExpression = function($this) {
  return $this >= NodeKind.NAME && $this <= NodeKind.ASSIGN_INDEX;
};
NodeKind.isConstant = function($this) {
  return $this >= NodeKind.NULL && $this <= NodeKind.STRING;
};
NodeKind.isCall = function($this) {
  return $this >= NodeKind.CALL && $this <= NodeKind.SUPER_CALL;
};
NodeKind.isUnaryOperator = function($this) {
  return $this >= NodeKind.NOT && $this <= NodeKind.POSTFIX_DECREMENT;
};
NodeKind.isUnaryStorageOperator = function($this) {
  return $this >= NodeKind.PREFIX_INCREMENT && $this <= NodeKind.POSTFIX_DECREMENT;
};
NodeKind.isBinaryOperator = function($this) {
  return $this >= NodeKind.ADD && $this <= NodeKind.ASSIGN_SUBTRACT;
};
NodeKind.isBinaryStorageOperator = function($this) {
  return $this >= NodeKind.ASSIGN && $this <= NodeKind.ASSIGN_SUBTRACT;
};
NodeKind.isTertiaryOperator = function($this) {
  return $this === NodeKind.ASSIGN_INDEX;
};
NodeKind.isCast = function($this) {
  return $this >= NodeKind.CAST && $this <= NodeKind.IMPLICIT_CAST;
};
NodeKind.isType = function($this) {
  return $this === NodeKind.TYPE;
};
NodeKind.isReal = function($this) {
  return $this >= NodeKind.FLOAT && $this <= NodeKind.DOUBLE;
};
NodeKind.isBool = function($this) {
  return $this >= NodeKind.TRUE && $this <= NodeKind.FALSE;
};
NodeKind.isError = function($this) {
  return $this === NodeKind.ERROR;
};
NodeKind.isLoop = function($this) {
  return $this >= NodeKind.FOR && $this <= NodeKind.DO_WHILE;
};
NodeKind.isStorage = function($this) {
  return $this === NodeKind.NAME || $this === NodeKind.DOT;
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
var ContentType = {
  INT: 0,
  DOUBLE: 1,
  STRING: 2
};
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
  return ContentType.INT;
};
function DoubleContent(_0) {
  Content.call(this);
  this.value = _0;
}
$extends(DoubleContent, Content);
DoubleContent.prototype.type = function() {
  return ContentType.DOUBLE;
};
function StringContent(_0) {
  Content.call(this);
  this.value = _0;
}
$extends(StringContent, Content);
StringContent.prototype.type = function() {
  return ContentType.STRING;
};
var Associativity = {
  NONE: 0,
  LEFT: 1,
  RIGHT: 2
};
function OperatorInfo(_0, _1, _2) {
  this.text = _0;
  this.precedence = _1;
  this.associativity = _2;
}
var SortTypes = {
  DO_NOT_SORT: 0,
  SORT_BY_INHERITANCE: 1,
  SORT_BY_INHERITANCE_AND_VALUE: 2,
  SORT_BY_INHERITANCE_AND_CONTAINMENT: 3
};
function Collector(program, sort) {
  this.typeSymbols = [];
  this.freeFunctionSymbols = [];
  this.topLevelStatements = [];
  this.sort = sort;
  if (program.kind !== NodeKind.PROGRAM) {
    throw new Error("assert program.kind == .PROGRAM; (src/compiler/collector.sk:15:5)");
  }
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
  if (this.sort === SortTypes.DO_NOT_SORT) {
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
  if (this.sort === SortTypes.SORT_BY_INHERITANCE_AND_VALUE && left.isStruct()) {
    var members = right.members.values();
    if (members !== null) {
      for (var i = 0; i < members.length; i = i + 1 | 0) {
        if (members.get(i).type === left) {
          return true;
        }
      }
    }
  }
  if (this.sort === SortTypes.SORT_BY_INHERITANCE_AND_CONTAINMENT && right.symbol.isContainedBy(left.symbol)) {
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
var TargetFormat = {
  NONE: 0,
  JS: 1,
  LISP_AST: 2,
  JSON_AST: 3,
  XML_AST: 4
};
TargetFormat.shouldRunResolver = function($this) {
  return $this >= TargetFormat.NONE && $this <= TargetFormat.JS;
};
function CompilerOptions() {
  this.targetFormat = TargetFormat.NONE;
  this.inputs = [];
  this.outputDirectory = "";
  this.outputFile = "";
  this.jsSourceMap = false;
}
CompilerOptions.prototype.isSingleFileMode = function() {
  if (this.outputFile.length <= 0 && this.outputDirectory.length <= 0) {
    throw new Error("assert outputFile.length > 0 || outputDirectory.length > 0; (src/compiler/compiler.sk:30:5)");
  }
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
      throw new Error("assert false; (src/compiler/compiler.sk:125:19)");
      break;
    }
    if (emitter !== null) {
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
var DiagnosticKind = {
  ERROR: 0,
  WARNING: 1
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
Log.prototype.error = function(range, text) {
  if (range.isEmpty()) {
    throw new Error("assert !range.isEmpty(); (src/core/log.sk:20:5)");
  }
  this.diagnostics.push(new Diagnostic(DiagnosticKind.ERROR, range, text));
  this.errorCount = this.errorCount + 1 | 0;
};
Log.prototype.warning = function(range, text) {
  if (range.isEmpty()) {
    throw new Error("assert !range.isEmpty(); (src/core/log.sk:26:5)");
  }
  this.diagnostics.push(new Diagnostic(DiagnosticKind.WARNING, range, text));
  this.warningCount = this.warningCount + 1 | 0;
};
Log.prototype.note = function(range, text) {
  if (range.isEmpty()) {
    throw new Error("assert !range.isEmpty(); (src/core/log.sk:32:5)");
  }
  var last = this.diagnostics.get(this.diagnostics.length - 1 | 0);
  last.noteRange = range;
  last.noteText = text;
};
Log.prototype.toString = function() {
  var builder = new StringBuilder();
  for (var i = 0; i < this.diagnostics.length; i = i + 1 | 0) {
    var diagnostic = this.diagnostics.get(i);
    var formatted = diagnostic.range.format(0);
    builder.append(diagnostic.range.locationString()).append(diagnostic.kind === DiagnosticKind.ERROR ? ": error: " : ": warning: ").append(diagnostic.text).append("\n").append(formatted.line).append("\n").append(formatted.range).append("\n");
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
  if (this.source === null) {
    throw new Error("assert source != null; (src/core/range.sk:40:5)");
  }
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
  if (start.source !== end.source) {
    throw new Error("assert start.source == end.source; (src/core/range.sk:81:5)");
  }
  if (start.start > end.end) {
    throw new Error("assert start.start <= end.end; (src/core/range.sk:82:5)");
  }
  return new Range(start.source, start.start, end.end);
};
Range.inner = function(start, end) {
  if (start.source !== end.source) {
    throw new Error("assert start.source == end.source; (src/core/range.sk:87:5)");
  }
  if (start.end > end.start) {
    throw new Error("assert start.end <= end.start; (src/core/range.sk:88:5)");
  }
  return new Range(start.source, start.end, end.start);
};
Range.before = function(outer, inner) {
  if (outer.source !== inner.source) {
    throw new Error("assert outer.source == inner.source; (src/core/range.sk:93:5)");
  }
  if (outer.start > inner.start) {
    throw new Error("assert outer.start <= inner.start; (src/core/range.sk:94:5)");
  }
  if (outer.end < inner.end) {
    throw new Error("assert outer.end >= inner.end; (src/core/range.sk:95:5)");
  }
  return new Range(outer.source, outer.start, inner.start);
};
Range.after = function(outer, inner) {
  if (outer.source !== inner.source) {
    throw new Error("assert outer.source == inner.source; (src/core/range.sk:100:5)");
  }
  if (outer.start > inner.start) {
    throw new Error("assert outer.start <= inner.start; (src/core/range.sk:101:5)");
  }
  if (outer.end < inner.end) {
    throw new Error("assert outer.end >= inner.end; (src/core/range.sk:102:5)");
  }
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
var ByteSize = {
  KB: 1024,
  MB: 1048576,
  GB: 1073741824
};
var io = {};
io.Color = {
  DEFAULT: 0,
  BOLD: 1,
  GRAY: 90,
  RED: 91,
  GREEN: 92,
  YELLOW: 93,
  BLUE: 94,
  MAGENTA: 95,
  CYAN: 96
};
var frontend = {};
frontend.Flags = function() {
  this.help = false;
  this.verbose = false;
  this.target = "";
  this.outputFile = "";
  this.jsSourceMap = false;
};
frontend.Flags.prototype.shouldWriteToStdout = function() {
  return this.outputFile === "";
};
var js = {};
js.PatchContext = function() {
  this.lambdaCount = 0;
  this.$function = null;
  this.createdThisAlias = false;
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
  this.currentLine = 0;
  this.currentColumn = 0;
  this.needExtends = false;
  this.needMathImul = false;
  this.currentSource = null;
  this.isStartOfExpression = false;
  this.generator = new SourceMapGenerator();
  this.indent = "";
  this.options = _0;
  this.cache = _1;
};
js.Emitter.prototype.emitProgram = function(program) {
  InstanceToStaticPass.run(program);
  this.patchNode(program, new js.PatchContext());
  this.currentSource = new Source(this.options.outputFile, "");
  var collector = new Collector(program, SortTypes.SORT_BY_INHERITANCE_AND_CONTAINMENT);
  if (this.needMathImul) {
    this.emit("var $imul = Math.imul || function(a, b) {\n  var ah = a >>> 16, al = a & 0xFFFF;\n  var bh = b >>> 16, bl = b & 0xFFFF;\n  return al * bl + (ah * bl + al * bh << 16) | 0;\n};\n");
  }
  if (this.needExtends) {
    this.emit("function $extends(derived, base) {\n  derived.prototype = Object.create(base.prototype);\n  derived.prototype.constructor = derived;\n}\n");
  }
  var i;
  for (i = 0; i < collector.typeSymbols.length; i = i + 1 | 0) {
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
    var j;
    for (j = 0; j < members.length; j = j + 1 | 0) {
      var symbol = members.get(j).symbol;
      if (symbol.enclosingSymbol === type.symbol && symbol.node !== null && SymbolKind.isFunction(symbol.kind) && !SymbolKind.isConstructor(symbol.kind)) {
        this.emitNode(symbol.node);
      }
    }
  }
  for (i = 0; i < collector.freeFunctionSymbols.length; i = i + 1 | 0) {
    this.emitNode(collector.freeFunctionSymbols.get(i).node);
  }
  for (i = 0; i < collector.topLevelStatements.length; i = i + 1 | 0) {
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
    var i;
    for (i = 0; i < text.length; i = i + 1 | 0) {
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
  var i;
  for (i = 0; i < nodes.length; i = i + 1 | 0) {
    this.emitNode(nodes.get(i));
  }
};
js.Emitter.prototype.emitCommaSeparatedNodes = function(nodes) {
  var i;
  for (i = 0; i < nodes.length; i = i + 1 | 0) {
    if (i > 0) {
      this.emit(", ");
    }
    this.emitNode(nodes.get(i));
  }
};
js.Emitter.prototype.emitCommaSeparatedExpressions = function(nodes) {
  var i;
  for (i = 0; i < nodes.length; i = i + 1 | 0) {
    if (i > 0) {
      this.emit(", ");
    }
    this.emitExpression(nodes.get(i), Precedence.COMMA);
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
  this.emitExpression(node.ifTest(), Precedence.LOWEST);
  this.emit(") ");
  this.emitNode(node.ifTrue());
  var block = node.ifFalse();
  if (block !== null) {
    this.emit(" else ");
    var statement = block.hasChildren() && block.children.length === 1 ? block.children.get(0) : null;
    if (statement !== null && statement.kind === NodeKind.IF) {
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
    var i;
    for (i = 0; i < values.length; i = i + 1 | 0) {
      this.emit(this.indent.append("case "));
      this.emitExpression(values.get(i), Precedence.LOWEST);
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
    var i;
    for (i = 0; i < variables.length; i = i + 1 | 0) {
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
    this.emit(this.indent.append(this.fullName(node.symbol)).append(" = {\n"));
    this.increaseIndent();
    var i;
    for (i = 0; i < block.children.length; i = i + 1 | 0) {
      var symbol = block.children.get(i).symbol;
      this.emit(this.indent.append(this.mangleName(symbol)).append(": ").append(symbol.enumValue.toString()).append(i === (block.children.length - 1 | 0) ? "\n" : ",\n"));
    }
    this.decreaseIndent();
    this.emit(this.indent.append("};\n"));
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
    if (node.kind === NodeKind.CONSTRUCTOR) {
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
      this.emitExpression(value, Precedence.COMMA);
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
      if (setup.kind === NodeKind.VARIABLE_CLUSTER) {
        this.emit("var ");
        this.emitCommaSeparatedNodes(setup.clusterVariables());
      } else {
        this.emitExpression(setup, Precedence.LOWEST);
      }
    }
    if (test !== null) {
      this.emit("; ");
      this.emitExpression(test, Precedence.LOWEST);
    } else {
      this.emit(";");
    }
    if (update !== null) {
      this.emit("; ");
      this.emitExpression(update, Precedence.LOWEST);
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
    this.emitExpression(node.whileTest(), Precedence.LOWEST);
    this.emit(") ");
    this.emitNode(node.whileBlock());
    this.emit("\n");
    break;
  case 24:
    this.emit(this.indent.append("do "));
    this.emitNode(node.whileBlock());
    this.emit(" while (");
    this.emitExpression(node.whileTest(), Precedence.LOWEST);
    this.emit(");\n");
    break;
  case 25:
  case 26:
    var value = node.returnValue();
    this.emit(this.indent);
    if (value !== null) {
      this.emit("return ");
      this.emitExpression(value, Precedence.LOWEST);
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
    var couldBeFalse = value.kind !== NodeKind.TRUE;
    if (couldBeFalse) {
      this.emit(this.indent.append("if ("));
      this.emitExpression(value, Precedence.LOWEST);
      this.emit(") {\n");
      this.increaseIndent();
    }
    var text = node.range.toString().append(" (").append(node.range.locationString()).append(")");
    this.emit(this.indent.append("throw new Error(").append(quoteString(text, 34)).append(");\n"));
    if (couldBeFalse) {
      this.decreaseIndent();
      this.emit(this.indent.append("}\n"));
    }
    break;
  case 30:
    this.emit(this.indent);
    this.isStartOfExpression = true;
    this.emitExpression(node.expressionValue(), Precedence.LOWEST);
    this.emit(";\n");
    break;
  case 31:
    this.emit(this.indent.append("switch ("));
    this.emitExpression(node.switchValue(), Precedence.LOWEST);
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
    throw new Error("assert false; (src/js/emitter.sk:428:11)");
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
    if (Precedence.ASSIGN < precedence) {
      this.emit("(");
    }
    this.emitExpression(node.hookTest(), Precedence.LOGICAL_OR);
    this.emit(" ? ");
    this.emitExpression(node.hookTrue(), Precedence.ASSIGN);
    this.emit(" : ");
    this.emitExpression(node.hookFalse(), Precedence.ASSIGN);
    if (Precedence.ASSIGN < precedence) {
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
    if (node.parent.kind === NodeKind.DOT) {
      this.emit(".");
    }
    break;
  case 42:
  case 43:
    var text = node.asDouble().toString();
    this.emit(text);
    if (node.parent.kind === NodeKind.DOT && text.indexOf(".") < 0) {
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
    this.emitExpression(node.dotTarget(), Precedence.MEMBER);
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
    this.emitExpression(value, Precedence.UNARY_POSTFIX);
    this.emit("(");
    this.emitCommaSeparatedExpressions(node.callArguments());
    this.emit(")");
    break;
  case 49:
    var $arguments = node.superCallArguments();
    this.emit(this.fullName(node.symbol));
    this.emit(".call(this");
    var i;
    for (i = 0; i < $arguments.length; i = i + 1 | 0) {
      this.emit(", ");
      this.emitExpression($arguments.get(i), Precedence.COMMA);
    }
    this.emit(")");
    break;
  case 51:
    this.emitExpression(node.bindValue(), precedence);
    break;
  case 52:
    if (Precedence.COMMA <= precedence) {
      this.emit("(");
    }
    this.isStartOfExpression = wasStartOfExpression;
    this.emitCommaSeparatedExpressions(node.children);
    if (Precedence.COMMA <= precedence) {
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
      throw new Error("assert false; (src/js/emitter.sk:559:16)");
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
    var isPostfix = info.precedence === Precedence.UNARY_POSTFIX;
    if (!isPostfix) {
      this.emit(info.text);
      if (node.kind === NodeKind.POSITIVE && (value.kind === NodeKind.POSITIVE || value.kind === NodeKind.PREFIX_INCREMENT) || node.kind === NodeKind.NEGATIVE && (value.kind === NodeKind.NEGATIVE || value.kind === NodeKind.PREFIX_DECREMENT)) {
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
    this.emitExpression(node.binaryLeft(), info.precedence + (info.associativity === Associativity.RIGHT | 0) | 0);
    this.emit(node.kind === NodeKind.EQUAL ? " === " : node.kind === NodeKind.NOT_EQUAL ? " !== " : " ".append(info.text).append(" "));
    this.emitExpression(node.binaryRight(), info.precedence + (info.associativity === Associativity.LEFT | 0) | 0);
    if (info.precedence < precedence) {
      this.emit(")");
    }
    break;
  case 77:
    this.emitExpression(node.binaryLeft(), Precedence.MEMBER);
    this.emit("[");
    this.emitExpression(node.binaryRight(), Precedence.LOWEST);
    this.emit("]");
    break;
  case 99:
    break;
  default:
    throw new Error("assert false; (src/js/emitter.sk:615:11)");
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
  if (!NodeKind.isExpression(node.kind)) {
    throw new Error("assert node.kind.isExpression(); (src/js/emitter.sk:637:7)");
  }
  var parent = node.parent;
  if (!NodeKind.isExpression(parent.kind)) {
    return false;
  }
  if (parent.kind === NodeKind.SEQUENCE && (!js.Emitter.isExpressionUsed(parent) || parent.children.indexOf(node) < (parent.children.length - 1 | 0))) {
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
      var i;
      for (i = 0; i < memberInitializers.children.length; i = i + 1 | 0) {
        var child = memberInitializers.children.get(i);
        block.insertChild((index = index + 1 | 0) - 1 | 0, Node.createExpression(Node.createBinary(NodeKind.ASSIGN, child.memberInitializerName().remove(), child.memberInitializerValue().remove())));
      }
    }
    context.setFunction(node);
    break;
  case 15:
    context.setFunction(node);
    break;
  case 51:
    if (node.symbol.kind === SymbolKind.INSTANCE_FUNCTION) {
      var $function = node.bindValue();
      var target;
      var name;
      if ($function.kind === NodeKind.DOT) {
        target = $function.dotTarget().remove();
        name = $function.dotName().remove();
      } else {
        if ($function.kind !== NodeKind.NAME) {
          throw new Error("assert function.kind == .NAME; (src/js/emitter.sk:687:15)");
        }
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
    if (node.symbol !== null && SymbolKind.isInstance(node.symbol.kind) && (node.parent.kind !== NodeKind.DOT || node !== node.parent.dotName())) {
      node.become(Node.createDot(Node.createThis(), node.clone()));
    }
    break;
  case 54:
    var value = node.castValue();
    if (node.type.isBool(this.cache) && !value.type.isBool(this.cache)) {
      node.become(Node.createUnary(NodeKind.NOT, value.remove()).withRange(node.range).withType(node.type));
    } else if (node.type.isInt(this.cache) && !value.type.isInteger(this.cache) && !js.Emitter.alwaysConvertsOperandsToInt(node.parent.kind)) {
      node.become(Node.createBinary(NodeKind.BITWISE_OR, value.remove(), Node.createInt(0)).withRange(node.range).withType(node.type));
    } else if (node.type.isReal(this.cache) && !value.type.isNumeric(this.cache)) {
      node.become(Node.createUnary(NodeKind.POSITIVE, value.remove()).withRange(node.range).withType(node.type));
    }
    break;
  case 64:
  case 65:
  case 67:
  case 66:
    if (node.type.isInt(this.cache)) {
      var isPostfix = node.kind === NodeKind.POSTFIX_INCREMENT || node.kind === NodeKind.POSTFIX_DECREMENT;
      var isIncrement = node.kind === NodeKind.PREFIX_INCREMENT || node.kind === NodeKind.POSTFIX_INCREMENT;
      var result = this.createBinaryIntAssignment(context, isIncrement ? NodeKind.ADD : NodeKind.SUBTRACT, node.unaryValue().remove(), Node.createInt(1));
      if (isPostfix && js.Emitter.isExpressionUsed(node)) {
        result = this.createBinaryInt(isIncrement ? NodeKind.SUBTRACT : NodeKind.ADD, result, Node.createInt(1));
      }
      node.become(result.withRange(node.range).withType(node.type));
    }
    break;
  case 68:
  case 87:
  case 82:
  case 72:
  case 84:
    if (node.type.isInt(this.cache) && (node.kind === NodeKind.MULTIPLY || !js.Emitter.alwaysConvertsOperandsToInt(node.parent.kind))) {
      node.become(this.createBinaryInt(node.kind, node.binaryLeft().remove(), node.binaryRight().remove()).withRange(node.range));
    }
    break;
  case 89:
  case 98:
  case 94:
  case 93:
  case 95:
    if (node.type.isInt(this.cache)) {
      var isPostfix = node.kind === NodeKind.POSTFIX_INCREMENT || node.kind === NodeKind.POSTFIX_DECREMENT;
      var isIncrement = node.kind === NodeKind.PREFIX_INCREMENT || node.kind === NodeKind.POSTFIX_INCREMENT;
      var left = node.binaryLeft();
      var right = node.binaryRight();
      var kind = node.kind === NodeKind.ASSIGN_ADD ? NodeKind.ADD : node.kind === NodeKind.ASSIGN_SUBTRACT ? NodeKind.SUBTRACT : node.kind === NodeKind.ASSIGN_MULTIPLY ? NodeKind.MULTIPLY : node.kind === NodeKind.ASSIGN_DIVIDE ? NodeKind.DIVIDE : NodeKind.REMAINDER;
      node.become(this.createBinaryIntAssignment(context, kind, left.remove(), right.remove()).withRange(node.range));
    }
    break;
  case 56:
    context.lambdaCount = context.lambdaCount + 1 | 0;
    break;
  }
  if (node.kind === NodeKind.LET) {
    var value = node.letValue();
    var variable = node.letVariable();
    node.become(Node.createCall(Node.createLambda([variable.remove()], Node.createBlock([Node.createReturn(value.remove())])), [variable.variableValue().remove()]));
  }
  if (node.hasChildren()) {
    var i;
    for (i = 0; i < node.children.length; i = i + 1 | 0) {
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
  if (kind === NodeKind.MULTIPLY) {
    this.needMathImul = true;
    return Node.createCall(Node.createName("$imul"), [left, right]).withType(this.cache.intType);
  }
  return Node.createBinary(NodeKind.BITWISE_OR, Node.createBinary(kind, left, right).withType(this.cache.intType), Node.createInt(0).withType(this.cache.intType)).withType(this.cache.intType);
};
js.Emitter.isSimpleNameAccess = function(node) {
  return node.kind === NodeKind.NAME || node.kind === NodeKind.THIS || node.kind === NodeKind.DOT && js.Emitter.isSimpleNameAccess(node.dotTarget());
};
js.Emitter.prototype.createBinaryIntAssignment = function(context, kind, left, right) {
  if (js.Emitter.isSimpleNameAccess(left)) {
    return Node.createBinary(NodeKind.ASSIGN, left.clone(), this.createBinaryInt(kind, left, right));
  }
  if (left.kind !== NodeKind.DOT) {
    throw new Error("assert left.kind == .DOT; (src/js/emitter.sk:815:7)");
  }
  var target = left.dotTarget().remove();
  var temporaryName = Node.createName("$temp");
  var dot = Node.createDot(temporaryName, left.dotName().remove());
  return Node.createLet(Node.createVariable(temporaryName.clone(), null, target), Node.createBinary(NodeKind.ASSIGN, dot, this.createBinaryInt(kind, dot.clone(), right)).withType(this.cache.intType)).withType(this.cache.intType);
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
var TokenKind = {
  ALIAS: 0,
  ASSERT: 1,
  ASSIGN: 2,
  ASSIGN_BITWISE_AND: 3,
  ASSIGN_BITWISE_OR: 4,
  ASSIGN_BITWISE_XOR: 5,
  ASSIGN_DIVIDE: 6,
  ASSIGN_MINUS: 7,
  ASSIGN_MULTIPLY: 8,
  ASSIGN_PLUS: 9,
  ASSIGN_REMAINDER: 10,
  ASSIGN_SHIFT_LEFT: 11,
  ASSIGN_SHIFT_RIGHT: 12,
  BITWISE_AND: 13,
  BITWISE_OR: 14,
  BITWISE_XOR: 15,
  BREAK: 16,
  CASE: 17,
  CHARACTER: 18,
  CLASS: 19,
  COLON: 20,
  COMMA: 21,
  CONTINUE: 22,
  DECREMENT: 23,
  DEFAULT: 24,
  DIVIDE: 25,
  DO: 26,
  DOT: 27,
  DOUBLE: 28,
  ELSE: 29,
  END_OF_FILE: 30,
  ENUM: 31,
  EQUAL: 32,
  ERROR: 33,
  EXPORT: 34,
  FALSE: 35,
  FINAL: 36,
  FLOAT: 37,
  FN: 38,
  FOR: 39,
  GREATER_THAN: 40,
  GREATER_THAN_OR_EQUAL: 41,
  IDENTIFIER: 42,
  IF: 43,
  IMPORT: 44,
  IN: 45,
  INCREMENT: 46,
  INLINE: 47,
  INTERFACE: 48,
  INT_BINARY: 49,
  INT_DECIMAL: 50,
  INT_HEX: 51,
  INT_OCTAL: 52,
  IS: 53,
  LAMBDA: 54,
  LEFT_BRACE: 55,
  LEFT_BRACKET: 56,
  LEFT_PARENTHESIS: 57,
  LESS_THAN: 58,
  LESS_THAN_OR_EQUAL: 59,
  LET: 60,
  LOGICAL_AND: 61,
  LOGICAL_OR: 62,
  MINUS: 63,
  MULTIPLY: 64,
  NAMESPACE: 65,
  NEW: 66,
  NOT: 67,
  NOT_EQUAL: 68,
  NULL: 69,
  OVERRIDE: 70,
  PLUS: 71,
  PRIVATE: 72,
  PROTECTED: 73,
  PUBLIC: 74,
  QUESTION_MARK: 75,
  REMAINDER: 76,
  RETURN: 77,
  RIGHT_BRACE: 78,
  RIGHT_BRACKET: 79,
  RIGHT_PARENTHESIS: 80,
  SEMICOLON: 81,
  SHIFT_LEFT: 82,
  SHIFT_RIGHT: 83,
  STATIC: 84,
  STRING: 85,
  STRUCT: 86,
  SUPER: 87,
  SWITCH: 88,
  THIS: 89,
  TILDE: 90,
  TRUE: 91,
  USING: 92,
  VAR: 93,
  VIRTUAL: 94,
  WHILE: 95,
  WHITESPACE: 96,
  YY_INVALID_ACTION: 97,
  START_PARAMETER_LIST: 98,
  END_PARAMETER_LIST: 99
};
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
var Precedence = {
  LOWEST: 0,
  COMMA: 1,
  ASSIGN: 2,
  LOGICAL_OR: 3,
  LOGICAL_AND: 4,
  BITWISE_OR: 5,
  BITWISE_XOR: 6,
  BITWISE_AND: 7,
  EQUAL: 8,
  COMPARE: 9,
  SHIFT: 10,
  ADD: 11,
  MULTIPLY: 12,
  UNARY_PREFIX: 13,
  UNARY_POSTFIX: 14,
  MEMBER: 15
};
var StatementHint = {
  NORMAL: 0,
  IN_ENUM: 1,
  IN_OBJECT: 2,
  IN_SWITCH: 3
};
var TokenScan = {
  NORMAL: 0,
  STOP_BEFORE_NEXT_STATEMENT: 1
};
var AllowLambda = {
  LAMBDA_NOT_ALLOWED: 0,
  LAMBDA_ALLOWED: 1
};
var AllowTrailingComma = {
  NO_TRAILING_COMMA: 0,
  TRAILING_COMMA: 1
};
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
  if (node === null) {
    throw new Error("assert node != null; (src/parser/pratt.sk:111:5)");
  }
  if (node.range.isEmpty()) {
    throw new Error("assert !node.range.isEmpty(); (src/parser/pratt.sk:112:5)");
  }
  return node;
};
Pratt.prototype.resumeIgnoringParselet = function(context, precedence, left, parseletToIgnore) {
  if (left === null) {
    throw new Error("assert left != null; (src/parser/pratt.sk:117:5)");
  }
  while (!NodeKind.isError(left.kind)) {
    var kind = context.current().kind;
    var parselet = this.table.getOrDefault(kind, null);
    if (parselet === null || parselet === parseletToIgnore || parselet.infix === null || parselet.precedence <= precedence) {
      break;
    }
    left = parselet.infix(context, left);
    if (left === null) {
      throw new Error("assert left != null; (src/parser/pratt.sk:125:7)");
    }
    if (left.range.isEmpty()) {
      throw new Error("assert !left.range.isEmpty(); (src/parser/pratt.sk:126:7)");
    }
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
  if (program.kind !== NodeKind.PROGRAM) {
    throw new Error("assert program.kind == .PROGRAM; (src/resolver/callgraph.sk:11:5)");
  }
  this.visit(program);
}
CallGraph.prototype.visit = function(node) {
  if (node.kind === NodeKind.CALL) {
    var value = node.callValue();
    if (value.symbol !== null && SymbolKind.isFunction(value.symbol.kind)) {
      if (value.kind !== NodeKind.NAME && value.kind !== NodeKind.DOT) {
        throw new Error("assert value.kind == .NAME || value.kind == .DOT; (src/resolver/callgraph.sk:19:9)");
      }
      this.recordCallSite(value.symbol, node);
    }
  } else if (node.kind === NodeKind.BIND) {
    if (node.symbol === null) {
      throw new Error("assert node.symbol != null; (src/resolver/callgraph.sk:25:7)");
    }
    this.recordCallSite(node.symbol, node);
  } else if (node.kind === NodeKind.FUNCTION) {
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
  if (!node.type.isError(this.cache) && !node.type.isBool(this.cache)) {
    throw new Error("assert node.type.isError(cache) || node.type.isBool(cache); (src/resolver/constantfolding.sk:5:5)");
  }
  node.removeChildren();
  node.kind = value ? NodeKind.TRUE : NodeKind.FALSE;
  node.content = null;
};
ConstantFolder.prototype.flattenInt = function(node, value) {
  if (!node.type.isError(this.cache) && !node.type.isInteger(this.cache)) {
    throw new Error("assert node.type.isError(cache) || node.type.isInteger(cache); (src/resolver/constantfolding.sk:12:5)");
  }
  node.removeChildren();
  node.kind = NodeKind.INT;
  node.content = new IntContent(value);
};
ConstantFolder.prototype.flattenReal = function(node, value) {
  if (!node.type.isError(this.cache) && !node.type.isReal(this.cache)) {
    throw new Error("assert node.type.isError(cache) || node.type.isReal(cache); (src/resolver/constantfolding.sk:19:5)");
  }
  node.removeChildren();
  node.kind = node.type === this.cache.floatType ? NodeKind.FLOAT : NodeKind.DOUBLE;
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
  if (kind === NodeKind.NAME) {
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
    } else if (valueKind === NodeKind.INT) {
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
      if (kind === NodeKind.NOT) {
        this.flattenBool(node, !value.asBool());
      }
    } else if (valueKind === NodeKind.INT) {
      if (kind === NodeKind.POSITIVE) {
        this.flattenInt(node, +value.asInt());
      } else if (kind === NodeKind.NEGATIVE) {
        this.flattenInt(node, -value.asInt());
      } else if (kind === NodeKind.COMPLEMENT) {
        this.flattenInt(node, ~value.asInt());
      }
    } else if (NodeKind.isReal(valueKind)) {
      if (kind === NodeKind.POSITIVE) {
        this.flattenReal(node, +value.asDouble());
      } else if (kind === NodeKind.NEGATIVE) {
        this.flattenReal(node, -value.asDouble());
      }
    }
  } else if (NodeKind.isBinaryOperator(kind)) {
    var left = node.binaryLeft();
    var right = node.binaryRight();
    var valueKind = left.kind;
    if (valueKind !== right.kind) {
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
    } else if (valueKind === NodeKind.INT) {
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
    if (symbol.kind === SymbolKind.INSTANCE_FUNCTION && !symbol.isImportOrExport() && symbol.node.functionBlock() !== null && (enclosingSymbol.isImport() || SymbolKind.isEnum(enclosingSymbol.kind))) {
      symbol.kind = SymbolKind.GLOBAL_FUNCTION;
      symbol.flags = symbol.flags | SymbolFlag.STATIC;
      var thisSymbol = new Symbol("this", SymbolKind.LOCAL_VARIABLE);
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
          if (value.kind === NodeKind.DOT) {
            target = value.dotTarget().remove();
            name = value.dotName().remove();
          } else {
            if (value.kind !== NodeKind.NAME) {
              throw new Error("assert value.kind == .NAME; (src/resolver/instancetostatic.sk:29:17)");
            }
            target = Node.createThis();
            name = value.remove();
          }
          callSite.replaceChild(0, name);
          callSite.insertChild(1, target);
          break;
        case 51:
          throw new Error("assert false; (src/resolver/instancetostatic.sk:38:15)");
          break;
        default:
          throw new Error("assert false; (src/resolver/instancetostatic.sk:42:15)");
          break;
        }
      }
    }
  }
};
InstanceToStaticPass.recursivelyReplaceThis = function(node, symbol) {
  if (node.kind === NodeKind.THIS) {
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
  this.enclosingType = null;
  this.type = null;
  this.dependency = null;
  this.parameterizedType = null;
  this.symbol = _0;
}
var CastKind = {
  IMPLICIT_CAST: 0,
  EXPLICIT_CAST: 1
};
var AllowDeclaration = {
  ALLOW_TOP_LEVEL: 0,
  ALLOW_TOP_OR_OBJECT_LEVEL: 1
};
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
    if (!SymbolKind.isTypeWithInstances(node.symbol.enclosingSymbol.kind)) {
      throw new Error("assert node.symbol.enclosingSymbol.kind.isTypeWithInstances(); (src/resolver/resolver.sk:23:7)");
    }
    context.symbolForThis = node.symbol.enclosingSymbol;
    context.scope = context.symbolForThis.node.scope;
    if (context.scope === null) {
      throw new Error("assert context.scope != null; (src/resolver/resolver.sk:26:7)");
    }
  }
  while (node !== null) {
    if (context.scope === null) {
      context.scope = node.scope;
    }
    if (context.loop === null && NodeKind.isLoop(node.kind)) {
      context.loop = node;
    }
    if (context.switchValue === null && node.kind === NodeKind.SWITCH) {
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
  this.parsedDeclarations = [];
  this.parsedBlocks = [];
  this.typeContext = null;
  this.resultType = null;
  this.log = _0;
}
Resolver.prototype.run = function(program) {
  if (program.kind !== NodeKind.PROGRAM) {
    throw new Error("assert program.kind == .PROGRAM; (src/resolver/resolver.sk:51:5)");
  }
  var globalScope = new Scope(null);
  globalScope.insertGlobals(this.cache);
  this.constantFolder = new ConstantFolder(this.cache);
  this.prepareNode(program, globalScope);
  globalScope.linkGlobals(this.cache);
  this.resolve(program, null);
};
Resolver.prototype.prepareNode = function(node, scope) {
  this.setupScopesAndSymbols(node, scope);
  this.accumulateSymbolFlags();
  this.setSymbolKindsAndMergeSiblings();
  this.processUsingStatements();
};
Resolver.prototype.setupScopesAndSymbols = function(node, scope) {
  if (node.kind === NodeKind.PROGRAM) {
    node.scope = scope;
  } else if (node.kind === NodeKind.BLOCK) {
    if (!NodeKind.isNamedBlockDeclaration(node.parent.kind) && !NodeKind.isLoop(node.parent.kind)) {
      scope = new Scope(scope);
    }
    node.scope = scope;
    this.parsedBlocks.push(node);
    if (node.parent.kind === NodeKind.FILE) {
      scope.type = this.cache.globalType;
    } else {
      var parentSymbol = node.parent.symbol;
      if (parentSymbol !== null && parentSymbol.type !== null) {
        scope.type = parentSymbol.type;
      }
    }
  }
  if (NodeKind.isNamedDeclaration(node.kind) && node.kind !== NodeKind.USING_ALIAS) {
    var declarationName = node.declarationName();
    if (declarationName !== null && node.symbol === null) {
      var name = declarationName.asString();
      var member = scope.findLocal(name);
      var symbol;
      if (member !== null) {
        symbol = member.symbol;
        symbol.node.appendToSiblingChain(node);
      } else {
        symbol = new Symbol(name, SymbolKind.OTHER);
        symbol.node = node;
        if (scope.type !== null) {
          symbol.enclosingSymbol = scope.type.symbol;
        }
        if (node.kind === NodeKind.PARAMETER) {
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
  if (NodeKind.isNamedBlockDeclaration(node.kind) || NodeKind.isFunction(node.kind) || node.kind === NodeKind.LAMBDA || NodeKind.isLoop(node.kind) || node.kind === NodeKind.LET) {
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
  if (parent.kind === NodeKind.VARIABLE_CLUSTER) {
    parent = parent.parent;
  }
  while (parent !== null && parent.kind === NodeKind.MODIFIER) {
    var modifierName = parent.modifierName();
    var name = modifierName.asString();
    var flag = nameToSymbolFlag.get(name);
    if ((flags & flag) !== 0) {
      semanticWarningDuplicateModifier(this.log, modifierName.range, name);
    }
    flags = flags | flag;
    parent = parent.parent;
  }
  if (parent !== null && parent.kind === NodeKind.BLOCK && parent.parent.kind === NodeKind.EXTENSION) {
    flags = flags | SymbolFlag.FROM_EXTENSION;
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
      if ((flags & SymbolFlag.KEYWORD_MASK) !== (siblingFlags & SymbolFlag.KEYWORD_MASK)) {
        semanticErrorDifferentModifiers(this.log, sibling.declarationName().range, declarationName.asString(), declarationName.range);
        siblingFlags = siblingFlags | SymbolFlag.HAS_MODIFIER_ERRORS;
      }
      flags = flags | siblingFlags;
    }
    node.symbol.flags = node.symbol.flags | flags;
  }
};
Resolver.checkParentsForLocalVariable = function(node) {
  for (node = node.parent; node !== null; node = node.parent) {
    if (node.kind !== NodeKind.PROGRAM && node.kind !== NodeKind.FILE && node.kind !== NodeKind.BLOCK && node.kind !== NodeKind.NAMESPACE && node.kind !== NodeKind.MODIFIER && node.kind !== NodeKind.EXTENSION && !NodeKind.isEnum(node.kind)) {
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
      if (sibling.kind === NodeKind.EXTENSION && NodeKind.isNamedBlockDeclaration(kind)) {
        continue;
      }
      if (sibling.kind !== NodeKind.EXTENSION && NodeKind.isNamedBlockDeclaration(sibling.kind)) {
        if (kind === NodeKind.EXTENSION || kind === NodeKind.NAMESPACE && sibling.kind === NodeKind.NAMESPACE) {
          kind = sibling.kind;
          continue;
        }
      }
      var siblingName = sibling.declarationName();
      semanticErrorDuplicateSymbol(this.log, siblingName.range, siblingName.asString(), declarationName.range);
    }
    var previous = node;
    for (var sibling = node.sibling; sibling !== null; sibling = sibling.sibling) {
      if (sibling.kind === NodeKind.VARIABLE || NodeKind.isFunction(sibling.kind)) {
        var disconnected = sibling.symbol = new Symbol(symbol.name, SymbolKind.OTHER);
        disconnected.enclosingSymbol = symbol.enclosingSymbol;
        disconnected.node = sibling;
        previous.sibling = sibling.sibling;
      } else {
        previous = sibling;
      }
    }
    switch (kind) {
    case 7:
      symbol.kind = SymbolKind.NAMESPACE;
      break;
    case 8:
      symbol.kind = SymbolKind.ENUM;
      break;
    case 9:
      symbol.kind = SymbolKind.ENUM_FLAGS;
      break;
    case 10:
      symbol.kind = SymbolKind.CLASS;
      break;
    case 11:
      symbol.kind = SymbolKind.STRUCT;
      break;
    case 12:
      symbol.kind = SymbolKind.INTERFACE;
      break;
    case 15:
      symbol.kind = SymbolKind.GLOBAL_FUNCTION;
      break;
    case 14:
      symbol.kind = SymbolKind.CONSTRUCTOR_FUNCTION;
      break;
    case 16:
      symbol.kind = SymbolKind.GLOBAL_VARIABLE;
      break;
    case 17:
      symbol.kind = SymbolKind.PARAMETER;
      break;
    case 18:
      symbol.kind = SymbolKind.ALIAS;
      break;
    case 13:
      semanticErrorExtensionMissingTarget(this.log, declarationName.range, declarationName.asString());
      break;
    default:
      throw new Error("assert false; (src/resolver/resolver.sk:291:19)");
      break;
    }
  }
  for (var i = 0; i < this.parsedDeclarations.length; i = i + 1 | 0) {
    var node = this.parsedDeclarations.get(i);
    var symbol = node.symbol;
    if (!symbol.isStatic() && (symbol.isObjectMember() || symbol.isEnumMember() && symbol.isFromExtension())) {
      if (symbol.kind === SymbolKind.GLOBAL_FUNCTION) {
        symbol.kind = SymbolKind.INSTANCE_FUNCTION;
      } else if (symbol.kind === SymbolKind.GLOBAL_VARIABLE) {
        symbol.kind = SymbolKind.INSTANCE_VARIABLE;
      }
    } else if (symbol.kind === SymbolKind.GLOBAL_VARIABLE && Resolver.checkParentsForLocalVariable(node)) {
      symbol.kind = SymbolKind.LOCAL_VARIABLE;
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
      if (statement.kind !== NodeKind.USING_ALIAS) {
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
      var symbol = new Symbol(name, SymbolKind.USING_ALIAS);
      symbol.node = statement;
      statement.symbol = symbol;
      block.scope.insertLocal(symbol);
    }
    var insertedSymbols = null;
    for (var j = 0; j < block.children.length; j = j + 1 | 0) {
      var statement = block.children.get(j);
      if (statement.kind !== NodeKind.USING_NAMESPACE) {
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
        if (memberSymbol.kind === SymbolKind.NAMESPACE) {
          continue;
        }
        var current = block.scope.findLocal(memberSymbol.name);
        if (current === null) {
          insertedSymbols.push(memberSymbol);
          block.scope.insertLocal(memberSymbol);
        } else {
          var currentSymbol = current.symbol;
          if (insertedSymbols.indexOf(currentSymbol) >= 0) {
            if (currentSymbol.kind !== SymbolKind.AMBIGUOUS) {
              var collision = new Symbol(memberSymbol.name, SymbolKind.AMBIGUOUS);
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
  if (node.kind === NodeKind.NAME) {
    var name = node.asString();
    member = this.cache.globalType.findMember(name);
    if (member === null) {
      semanticErrorUndeclaredSymbol(this.log, node.range, name);
      return;
    }
  } else if (node.kind === NodeKind.DOT) {
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
  if (node.type === null) {
    throw new Error("assert node.type != null; (src/resolver/resolver.sk:470:5)");
  }
};
Resolver.prototype.resolve = function(node, expectedType) {
  if (node.type !== null) {
    return;
  }
  node.type = this.cache.errorType;
  if (this.context.scope === null && node.kind !== NodeKind.PROGRAM) {
    throw new Error("assert context.scope != null || node.kind == .PROGRAM; (src/resolver/resolver.sk:481:5)");
  }
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
    node.type = this.cache.intType;
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
    throw new Error("assert false; (src/resolver/resolver.sk:562:9)");
    break;
  }
  this.context.scope = oldScope;
  this.typeContext = oldType;
  if (node.type === null) {
    throw new Error("assert node.type != null; (src/resolver/resolver.sk:568:5)");
  }
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
  if (kind === NodeKind.HOOK) {
    this.checkUnusedExpression(node.hookTrue());
    this.checkUnusedExpression(node.hookFalse());
  } else if (kind === NodeKind.SEQUENCE) {
    if (node.hasChildren()) {
      this.checkUnusedExpression(node.children.get(node.children.length - 1 | 0));
    }
  } else if (kind === NodeKind.LET) {
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
  if (from === null) {
    throw new Error("assert from != null; (src/resolver/resolver.sk:641:5)");
  }
  if (to === null) {
    throw new Error("assert to != null; (src/resolver/resolver.sk:642:5)");
  }
  if (from.isError(this.cache) || to.isError(this.cache)) {
    return;
  }
  if (from.isVoid(this.cache) && to.isVoid(this.cache)) {
    semanticErrorUnexpectedExpression(this.log, node.range, to);
    return;
  }
  if (from === to) {
    if ((node.kind === NodeKind.NAME || node.kind === NodeKind.DOT) && node.symbol !== null && SymbolKind.isFunction(node.symbol.kind)) {
      var children = node.removeChildren();
      node.become(Node.createBind(node.clone().withChildren(children)).withRange(node.range).withType(to).withSymbol(node.symbol));
    }
    return;
  }
  if (to.isEnumFlags() && node.kind === NodeKind.INT && node.asInt() === 0) {
    from = to;
  }
  if (kind === CastKind.IMPLICIT_CAST && !this.cache.canImplicitlyConvert(from, to) || kind === CastKind.EXPLICIT_CAST && !this.cache.canExplicitlyConvert(from, to)) {
    semanticErrorIncompatibleTypes(this.log, node.range, from, to, this.cache.canExplicitlyConvert(from, to));
    node.type = this.cache.errorType;
    return;
  }
  if (kind === CastKind.IMPLICIT_CAST) {
    if (NodeKind.isType(node.kind)) {
      return;
    }
    var value = new Node(NodeKind.NULL);
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
  if (node.parent === null) {
    throw new Error("assert node.parent != null; (src/resolver/resolver.sk:699:5)");
  }
  if (node.parent.kind !== NodeKind.BLOCK) {
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
    if (kind !== NodeKind.PROGRAM && kind !== NodeKind.FILE && kind !== NodeKind.MODIFIER && kind !== NodeKind.BLOCK && kind !== NodeKind.NAMESPACE && kind !== NodeKind.EXTENSION && (allowDeclaration !== AllowDeclaration.ALLOW_TOP_OR_OBJECT_LEVEL || !NodeKind.isObject(kind))) {
      this.unexpectedStatement(node);
      break;
    }
  }
  if (parent !== null) {
    node.symbol.flags = node.symbol.flags | SymbolFlag.HAS_LOCATION_ERROR;
  }
};
Resolver.prototype.checkStatementLocation = function(node) {
  if (node.parent === null) {
    throw new Error("assert node.parent != null; (src/resolver/resolver.sk:732:5)");
  }
  if (node.parent.kind !== NodeKind.BLOCK || NodeKind.isNamedBlockDeclaration(node.parent.parent.kind) && node.parent.parent.kind !== NodeKind.NAMESPACE) {
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
  if (!SymbolKind.isInstance(symbol.kind) && symbol.kind !== SymbolKind.PARAMETER) {
    return true;
  }
  if (this.context.functionSymbol !== null && SymbolKind.isInstance(this.context.functionSymbol.kind) && this.context.functionSymbol.enclosingSymbol === symbol.enclosingSymbol) {
    return true;
  }
  if (this.context.symbolForThis === null) {
    semanticErrorUnexpectedThis(this.log, node.range, symbol.name);
    return false;
  }
  if (symbol.kind === SymbolKind.PARAMETER && this.context.symbolForThis === symbol.enclosingSymbol) {
    var enclosingNode = symbol.enclosingSymbol.node;
    for (var parent = node.parent; parent !== enclosingNode; parent = parent.parent) {
      if (parent.kind === NodeKind.NODE_LIST && parent.parent === enclosingNode && (parent === parent.parent.objectParameters() || parent === parent.parent.baseTypes())) {
        return true;
      }
      if ((parent.kind === NodeKind.VARIABLE || NodeKind.isFunction(parent.kind)) && SymbolKind.isInstance(parent.symbol.kind)) {
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
    if (isObject || node.kind === NodeKind.EXTENSION) {
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
  return node.kind === NodeKind.INITIALIZER || node.kind === NodeKind.DOT && node.dotTarget() === null || node.kind === NodeKind.HOOK && this.needsTypeContext(node.hookTrue()) && this.needsTypeContext(node.hookFalse());
};
Resolver.prototype.addAutoGeneratedMember = function(type, name) {
  var symbol = new Symbol(name, SymbolKind.AUTOMATIC);
  symbol.enclosingSymbol = type.symbol;
  type.addMember(new Member(symbol));
};
Resolver.prototype.initializeNamespace = function(symbol) {
  if (!symbol.type.isNamespace()) {
    throw new Error("assert symbol.type.isNamespace(); (src/resolver/resolver.sk:836:5)");
  }
  this.unexpectedModifierIfPresent(symbol, SymbolFlag.FINAL, "on a namespace declaration");
  this.unexpectedModifierIfPresent(symbol, SymbolFlag.STATIC, "on a namespace declaration");
  this.unexpectedModifierIfPresent(symbol, SymbolFlag.VIRTUAL, "on a namespace declaration");
  this.unexpectedModifierIfPresent(symbol, SymbolFlag.OVERRIDE, "on a namespace declaration");
  this.checkNoBaseTypes(symbol, "A namespace");
};
Resolver.prototype.initializeEnum = function(symbol) {
  if (!symbol.type.isEnum()) {
    throw new Error("assert symbol.type.isEnum(); (src/resolver/resolver.sk:845:5)");
  }
  this.unexpectedModifierIfPresent(symbol, SymbolFlag.FINAL, "on an enum declaration");
  this.unexpectedModifierIfPresent(symbol, SymbolFlag.STATIC, "on an enum declaration");
  this.unexpectedModifierIfPresent(symbol, SymbolFlag.VIRTUAL, "on an enum declaration");
  this.unexpectedModifierIfPresent(symbol, SymbolFlag.OVERRIDE, "on an enum declaration");
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
  if (type.relevantTypes !== null) {
    throw new Error("assert type.relevantTypes == null; (src/resolver/resolver.sk:863:5)");
  }
  type.relevantTypes = [];
  if (symbol.kind === SymbolKind.STRUCT) {
    this.checkNoBaseTypes(symbol, "A struct");
    return;
  }
  for (var i = 0; i < baseTypes.length; i = i + 1 | 0) {
    var base = baseTypes.get(i);
    var baseType = base.type;
    if (baseType.isError(this.cache)) {
      continue;
    }
    if (symbol.kind === SymbolKind.CLASS && baseType.isClass()) {
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
    if (baseType.hasBaseType(type)) {
      throw new Error("assert !baseType.hasBaseType(type); (src/resolver/resolver.sk:901:7)");
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
        var combined = new Symbol(memberSymbol.name, SymbolKind.UNMERGED);
        combined.enclosingSymbol = symbol;
        combined.identicalMembers = [unmerged, member];
        unmergedMembers.set(memberSymbol.name, new Member(combined));
      } else {
        if (unmerged.symbol.kind !== SymbolKind.UNMERGED) {
          throw new Error("assert unmerged.symbol.kind == .UNMERGED; (src/resolver/resolver.sk:919:11)");
        }
        unmerged.symbol.identicalMembers.push(member);
      }
    }
  }
  var baseMembers = unmergedMembers.values();
  for (var i = 0; i < baseMembers.length; i = i + 1 | 0) {
    var member = baseMembers.get(i);
    var existing = type.findMember(member.symbol.name);
    if (existing !== null) {
      if (existing.symbol.overriddenMember !== null) {
        throw new Error("assert existing.symbol.overriddenMember == null; (src/resolver/resolver.sk:934:9)");
      }
      existing.symbol.overriddenMember = member;
    } else if (member.symbol.name !== "new") {
      type.addMember(member);
    }
  }
};
Resolver.prototype.initializeObject = function(symbol) {
  this.unexpectedModifierIfPresent(symbol, SymbolFlag.FINAL, "on an object declaration");
  this.unexpectedModifierIfPresent(symbol, SymbolFlag.STATIC, "on an object declaration");
  var node = symbol.node.firstNonExtensionSibling();
  var parameters = node.objectParameters();
  var type = symbol.type;
  if (!type.isObject()) {
    throw new Error("assert type.isObject(); (src/resolver/resolver.sk:954:5)");
  }
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
  this.unexpectedModifierIfPresent(symbol, SymbolFlag.VIRTUAL, where);
  this.unexpectedModifierIfPresent(symbol, SymbolFlag.OVERRIDE, where);
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
  if (symbol.enclosingSymbol !== null && SymbolKind.isTypeWithInstances(symbol.enclosingSymbol.kind) && (this.context.symbolForThis === null || this.context.symbolForThis !== symbol.enclosingSymbol)) {
    throw new Error("assert symbol.enclosingSymbol == null || !symbol.enclosingSymbol.kind.isTypeWithInstances() ||\n      context.symbolForThis != null && context.symbolForThis == symbol.enclosingSymbol; (src/resolver/resolver.sk:986:5)");
  }
  this.unexpectedModifierIfPresent(symbol, SymbolFlag.FINAL, "on a function declaration");
  if (symbol.enclosingSymbol === null || !SymbolKind.isTypeWithInstances(symbol.enclosingSymbol.kind)) {
    this.unexpectedModifierIfPresent(symbol, SymbolFlag.STATIC, "outside an object declaration");
  }
  var node = symbol.node;
  var resultType;
  if (node.kind === NodeKind.FUNCTION) {
    var result = node.functionResult();
    this.resolveAsParameterizedType(result);
    this.checkIsValidFunctionReturnType(result);
    resultType = result.type;
  } else {
    if (node.kind !== NodeKind.CONSTRUCTOR) {
      throw new Error("assert node.kind == .CONSTRUCTOR; (src/resolver/resolver.sk:1007:7)");
    }
    resultType = symbol.enclosingSymbol.type;
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
        this.redundantModifierIfPresent(symbol, SymbolFlag.VIRTUAL, "on an overriding function");
      }
    }
    symbol.flags = symbol.flags | SymbolFlag.VIRTUAL;
  } else if (!symbol.isObjectMember()) {
    this.unexpectedModifierIfPresent(symbol, SymbolFlag.VIRTUAL, "outside an object declaration");
    this.unexpectedModifierIfPresent(symbol, SymbolFlag.OVERRIDE, "outside an object declaration");
  } else {
    if (!SymbolKind.isInstance(symbol.kind)) {
      this.unexpectedModifierIfPresent(symbol, SymbolFlag.VIRTUAL, "on a non-instance function");
    }
    this.unexpectedModifierIfPresent(symbol, SymbolFlag.OVERRIDE, "on a function that doesn't override anything");
    if (symbol.isOverride()) {
      symbol.flags = symbol.flags | SymbolFlag.VIRTUAL;
    }
  }
};
Resolver.findModifierName = function(symbol, flag) {
  for (var node = symbol.node; node !== null; node = node.parent) {
    if (node.kind === NodeKind.MODIFIER) {
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
  this.unexpectedModifierIfPresent(symbol, SymbolFlag.VIRTUAL, "on a variable declaration");
  this.unexpectedModifierIfPresent(symbol, SymbolFlag.OVERRIDE, "on a variable declaration");
  if (symbol.enclosingSymbol === null || !SymbolKind.isTypeWithInstances(symbol.enclosingSymbol.kind)) {
    this.unexpectedModifierIfPresent(symbol, SymbolFlag.STATIC, "outside an object declaration");
  }
  if (symbol.enclosingSymbol !== null && symbol.enclosingSymbol.kind === SymbolKind.STRUCT && !symbol.isStatic()) {
    this.expectedModifierIfAbsent(symbol, SymbolFlag.FINAL, "on a variable declaration inside a struct");
  }
  var node = symbol.node;
  var variableType = node.variableType();
  if (variableType === null) {
    if (node.parent.kind === NodeKind.VARIABLE_CLUSTER) {
      variableType = node.parent.clusterType().clone();
    } else if (symbol.enclosingSymbol !== null) {
      if (!symbol.isEnumValue()) {
        throw new Error("assert symbol.isEnumValue(); (src/resolver/resolver.sk:1143:9)");
      }
      var type = symbol.enclosingSymbol.type;
      variableType = Node.createType(type).withSymbol(symbol.enclosingSymbol);
      symbol.flags = symbol.flags | SymbolFlag.FINAL;
      var variableValue = node.variableValue();
      if (variableValue !== null) {
        this.resolveAsExpressionWithConversion(variableValue, this.cache.intType, CastKind.IMPLICIT_CAST);
        this.constantFolder.foldConstants(variableValue);
        if (variableValue.kind === NodeKind.INT) {
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
      if (node.parent.kind !== NodeKind.LAMBDA) {
        throw new Error("assert node.parent.kind == .LAMBDA; (src/resolver/resolver.sk:1189:9)");
      }
      variableType = Node.createType(this.cache.errorType);
    }
    if (variableType === null) {
      throw new Error("assert variableType != null; (src/resolver/resolver.sk:1193:7)");
    }
    node.replaceChild(1, variableType);
  }
  if (variableType.kind === NodeKind.VAR) {
    var value = node.variableValue();
    if (value === null) {
      semanticErrorVarMissingValue(this.log, node.declarationName().range);
      symbol.type = this.cache.errorType;
    } else {
      if (node.parent.kind === NodeKind.LET) {
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
    if (node.parent.kind === NodeKind.VARIABLE_CLUSTER && node.parent.clusterType().type === null) {
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
      if (type.relevantTypes !== null) {
        throw new Error("assert type.relevantTypes == null; (src/resolver/resolver.sk:1273:9)");
      }
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
  if (symbol === null) {
    throw new Error("assert symbol != null; (src/resolver/resolver.sk:1289:5)");
  }
  if (symbol.isUninitialized()) {
    symbol.flags = symbol.flags | SymbolFlag.INITIALIZING;
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
      throw new Error("assert false; (src/resolver/resolver.sk:1316:19)");
      break;
    }
    this.context = oldContext;
    this.typeContext = oldTypeContext;
    this.resultType = oldResultType;
    if (symbol.type === null) {
      throw new Error("assert symbol.type != null; (src/resolver/resolver.sk:1323:7)");
    }
    if (!symbol.isInitializing()) {
      throw new Error("assert symbol.isInitializing(); (src/resolver/resolver.sk:1324:7)");
    }
    if (symbol.isInitialized()) {
      throw new Error("assert !symbol.isInitialized(); (src/resolver/resolver.sk:1325:7)");
    }
    symbol.flags = symbol.flags & ~SymbolFlag.INITIALIZING | SymbolFlag.INITIALIZED;
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
  if (symbol.kind === SymbolKind.AMBIGUOUS) {
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
  if (member.dependency !== null) {
    this.initializeMember(member.dependency);
    member.type = member.dependency.type;
    if (SymbolKind.isConstructor(member.symbol.kind) && member.type.isFunction()) {
      member.type.relevantTypes.set(0, member.enclosingType);
    }
  } else {
    this.initializeSymbol(member.symbol);
    member.type = member.symbol.type;
  }
  var parameterizedType = member.parameterizedType;
  if (parameterizedType !== null && parameterizedType.isParameterized()) {
    member.type = this.cache.substitute(member.type, parameterizedType.symbol.parameters, parameterizedType.substitutions);
  }
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
          argument.symbol = new Symbol(name, SymbolKind.LOCAL_VARIABLE);
          argument.symbol.node = argument;
          $arguments.push(argument);
          superArguments.push(Node.createName(name));
        }
      } else {
        if (!$constructor.type.isError(this.cache)) {
          throw new Error("assert constructor.type.isError(cache); (src/resolver/resolver.sk:1411:11)");
        }
        symbol.flags = symbol.flags | SymbolFlag.INITIALIZED;
        symbol.type = this.cache.errorType;
        return;
      }
    }
  }
  var uninitializedMembers = [];
  for (var i = 0; i < members.length; i = i + 1 | 0) {
    var member = members.get(i);
    var memberSymbol = member.symbol;
    if (memberSymbol.kind === SymbolKind.INSTANCE_VARIABLE && memberSymbol.enclosingSymbol === enclosingSymbol && memberSymbol.node.variableValue() === null) {
      this.initializeMember(member);
      if (member.type.isError(this.cache)) {
        symbol.flags = symbol.flags | SymbolFlag.INITIALIZED;
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
      if (uninitializedMembers.get(j - 1 | 0).symbol.node.range.source !== member.symbol.node.range.source) {
        throw new Error("assert uninitializedMembers.get(j - 1).symbol.node.range.source == member.symbol.node.range.source; (src/resolver/resolver.sk:1440:9)");
      }
      uninitializedMembers.set(j, uninitializedMembers.get(j - 1 | 0));
    }
    uninitializedMembers.set(j, member);
  }
  for (var i = 0; i < uninitializedMembers.length; i = i + 1 | 0) {
    var member = uninitializedMembers.get(i);
    var name = "_".append($arguments.length.toString());
    var argument = Node.createVariable(Node.createName(name), Node.createType(member.type), null);
    argument.symbol = new Symbol(name, SymbolKind.LOCAL_VARIABLE);
    argument.symbol.node = argument;
    $arguments.push(argument);
    memberInitializers.push(Node.createMemberInitializer(Node.createName(member.symbol.name), Node.createName(name)));
  }
  symbol.kind = SymbolKind.CONSTRUCTOR_FUNCTION;
  symbol.node = Node.createConstructor(Node.createName(symbol.name), Node.createNodeList($arguments), Node.createBlock([]), superArguments !== null ? Node.createSuperCall(superArguments) : null, memberInitializers !== null ? Node.createNodeList(memberInitializers) : null);
  enclosingSymbol.node.declarationBlock().appendChild(symbol.node);
  if (enclosingSymbol.node.scope === null) {
    throw new Error("assert enclosingSymbol.node.scope != null; (src/resolver/resolver.sk:1468:5)");
  }
  var scope = new Scope(enclosingSymbol.node.scope);
  symbol.node.symbol = symbol;
  symbol.node.scope = scope;
  for (var i = 0; i < $arguments.length; i = i + 1 | 0) {
    scope.insert($arguments.get(i).symbol);
  }
};
Resolver.prototype.generateDefaultToString = function(symbol) {
  if (!symbol.isEnumMember()) {
    throw new Error("assert symbol.isEnumMember(); (src/resolver/resolver.sk:1478:5)");
  }
  var enclosingSymbol = symbol.enclosingSymbol;
  var enclosingNode = enclosingSymbol.node;
  var members = enclosingSymbol.type.members.values();
  var fields = [];
  var i;
  for (i = 0; i < members.length; i = i + 1 | 0) {
    var field = members.get(i).symbol;
    if (field.kind === SymbolKind.GLOBAL_VARIABLE && !field.isFromExtension()) {
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
  symbol.kind = SymbolKind.INSTANCE_FUNCTION;
  symbol.flags = SymbolFlag.FROM_EXTENSION;
  symbol.node = Node.createFunction(Node.createName(symbol.name), Node.createNodeList([]), Node.createBlock([statement]), Node.createType(this.cache.stringType)).withSymbol(symbol);
  block.appendChild(symbol.node);
  this.prepareNode(extension, enclosingNode.parent.scope);
  this.resolve(extension, null);
};
Resolver.prototype.initializeSymbol = function(symbol) {
  if (symbol.kind === SymbolKind.AUTOMATIC) {
    switch (symbol.name) {
    case "new":
      this.generateDefaultConstructor(symbol);
      break;
    case "toString":
      this.generateDefaultToString(symbol);
      break;
    default:
      throw new Error("assert false; (src/resolver/resolver.sk:1560:19)");
      break;
    }
    if (symbol.node !== null) {
      var oldContext = this.context;
      this.context = ResolveContext.fromNode(symbol.node);
      this.resolve(symbol.node, null);
      this.context = oldContext;
    }
  }
  if (symbol.kind === SymbolKind.UNMERGED) {
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
    if (symbol.node === null) {
      throw new Error("assert symbol.node != null; (src/resolver/resolver.sk:1597:7)");
    }
    this.initializeDeclaration(symbol.node);
    if (symbol.isInitializing()) {
      throw new Error("assert !symbol.isInitializing(); (src/resolver/resolver.sk:1599:7)");
    }
    if (!symbol.isInitialized()) {
      throw new Error("assert symbol.isInitialized(); (src/resolver/resolver.sk:1600:7)");
    }
    if (symbol.type === null) {
      throw new Error("assert symbol.type != null; (src/resolver/resolver.sk:1601:7)");
    }
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
    this.resolveAsExpressionWithConversion($arguments.get(i), argumentTypes.get(i), CastKind.IMPLICIT_CAST);
  }
};
Resolver.prototype.resolveAsType = function(node) {
  if (!NodeKind.isExpression(node.kind)) {
    throw new Error("assert node.kind.isExpression(); (src/resolver/resolver.sk:1631:5)");
  }
  this.resolve(node, null);
  this.checkIsType(node);
};
Resolver.prototype.resolveAsParameterizedType = function(node) {
  this.resolveAsType(node);
  this.checkIsParameterized(node);
};
Resolver.prototype.resolveAsExpression = function(node) {
  if (!NodeKind.isExpression(node.kind)) {
    throw new Error("assert node.kind.isExpression(); (src/resolver/resolver.sk:1642:5)");
  }
  this.resolve(node, null);
  this.checkIsInstance(node);
};
Resolver.prototype.resolveAsExpressionWithTypeContext = function(node, type) {
  if (!NodeKind.isExpression(node.kind)) {
    throw new Error("assert node.kind.isExpression(); (src/resolver/resolver.sk:1648:5)");
  }
  this.resolve(node, type);
  this.checkIsInstance(node);
};
Resolver.prototype.resolveAsExpressionWithConversion = function(node, type, kind) {
  if (!NodeKind.isExpression(node.kind)) {
    throw new Error("assert node.kind.isExpression(); (src/resolver/resolver.sk:1654:5)");
  }
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
  if (node.parent !== null) {
    throw new Error("assert node.parent == null; (src/resolver/resolver.sk:1687:5)");
  }
  this.resolveChildren(node);
};
Resolver.prototype.resolveFile = function(node) {
  if (node.parent === null) {
    throw new Error("assert node.parent != null; (src/resolver/resolver.sk:1692:5)");
  }
  if (node.parent.kind !== NodeKind.PROGRAM) {
    throw new Error("assert node.parent.kind == .PROGRAM; (src/resolver/resolver.sk:1693:5)");
  }
  this.resolve(node.fileBlock(), null);
};
Resolver.prototype.resolveBlock = function(node) {
  this.resolveChildren(node);
};
Resolver.prototype.resolveCase = function(node) {
  if (node.parent === null) {
    throw new Error("assert node.parent != null; (src/resolver/resolver.sk:1702:5)");
  }
  if (node.parent.kind !== NodeKind.SWITCH) {
    throw new Error("assert node.parent.kind == .SWITCH; (src/resolver/resolver.sk:1703:5)");
  }
  if (this.context.switchValue === null) {
    throw new Error("assert context.switchValue != null; (src/resolver/resolver.sk:1704:5)");
  }
  if (this.context.switchValue.type === null) {
    throw new Error("assert context.switchValue.type != null; (src/resolver/resolver.sk:1705:5)");
  }
  var values = node.caseValues();
  var block = node.caseBlock();
  for (var i = 0; i < values.length; i = i + 1 | 0) {
    var value = values.get(i);
    this.resolveAsExpressionWithConversion(value, this.context.switchValue.type, CastKind.IMPLICIT_CAST);
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
  this.checkDeclarationLocation(node, AllowDeclaration.ALLOW_TOP_LEVEL);
  this.initializeSymbol(node.symbol);
  this.resolve(node.declarationBlock(), null);
};
Resolver.prototype.resolveEnum = function(node) {
  this.checkDeclarationLocation(node, AllowDeclaration.ALLOW_TOP_LEVEL);
  this.initializeSymbol(node.symbol);
  this.resolve(node.declarationBlock(), null);
};
Resolver.prototype.resolveObject = function(node) {
  this.checkDeclarationLocation(node, AllowDeclaration.ALLOW_TOP_LEVEL);
  this.initializeSymbol(node.symbol);
  var members = node.symbol.type.members.values();
  for (var i = 0; i < members.length; i = i + 1 | 0) {
    var member = members.get(i);
    if (member.symbol.kind === SymbolKind.UNMERGED) {
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
  this.checkDeclarationLocation(node, AllowDeclaration.ALLOW_TOP_LEVEL);
  this.initializeSymbol(node.symbol);
  var oldSymbolForThis = this.context.symbolForThis;
  if (SymbolKind.isTypeWithInstances(node.symbol.kind)) {
    this.context.symbolForThis = node.symbol;
  }
  this.resolve(node.declarationBlock(), null);
  this.context.symbolForThis = oldSymbolForThis;
};
Resolver.prototype.resolveFunction = function(node) {
  if (node.symbol.enclosingSymbol !== null && SymbolKind.isTypeWithInstances(node.symbol.enclosingSymbol.kind) && (this.context.symbolForThis === null || this.context.symbolForThis !== node.symbol.enclosingSymbol)) {
    throw new Error("assert node.symbol.enclosingSymbol == null || !node.symbol.enclosingSymbol.kind.isTypeWithInstances() ||\n      context.symbolForThis != null && context.symbolForThis == node.symbol.enclosingSymbol; (src/resolver/resolver.sk:1785:5)");
  }
  this.checkDeclarationLocation(node, AllowDeclaration.ALLOW_TOP_OR_OBJECT_LEVEL);
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
  if (node.kind === NodeKind.CONSTRUCTOR) {
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
        if (!overriddenType.isFunction()) {
          throw new Error("assert overriddenType.isFunction(); (src/resolver/resolver.sk:1839:11)");
        }
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
        if (memberSymbol.kind === SymbolKind.INSTANCE_VARIABLE && memberSymbol.enclosingSymbol === enclosingSymbol) {
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
        this.resolveAsExpressionWithConversion(value, name.symbol.type, CastKind.IMPLICIT_CAST);
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
    this.resolveAsExpressionWithConversion(value, symbol.isEnumValue() ? this.cache.intType : symbol.type, CastKind.IMPLICIT_CAST);
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
  this.resolveAsExpressionWithConversion(node.ifTest(), this.cache.boolType, CastKind.IMPLICIT_CAST);
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
    if (setup.kind === NodeKind.VARIABLE_CLUSTER) {
      this.resolve(setup, null);
    } else {
      this.resolveAsExpression(setup);
    }
  }
  if (test !== null) {
    this.resolveAsExpressionWithConversion(test, this.cache.boolType, CastKind.IMPLICIT_CAST);
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
    this.resolveAsExpressionWithConversion(test, this.cache.boolType, CastKind.IMPLICIT_CAST);
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
    if (node.kind === NodeKind.IMPLICIT_RETURN && this.resultType.isVoid(this.cache)) {
      node.become(Node.createExpression(value.remove()));
      this.resolve(node, null);
    } else {
      this.resolveAsExpressionWithConversion(value, this.resultType, CastKind.IMPLICIT_CAST);
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
  this.resolveAsExpressionWithConversion(node.assertValue(), this.cache.boolType, CastKind.IMPLICIT_CAST);
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
      if (!NodeKind.isConstant(caseValue.kind)) {
        throw new Error("assert caseValue.kind.isConstant(); (src/resolver/resolver.sk:2136:9)");
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
    if (this.context.symbolForThis === null) {
      throw new Error("assert context.symbolForThis != null; (src/resolver/resolver.sk:2185:7)");
    }
    var symbol = this.context.symbolForThis;
    this.initializeSymbol(symbol);
    node.type = symbol.type;
    node.symbol = symbol;
  }
};
Resolver.prototype.resolveHook = function(node) {
  var trueNode = node.hookTrue();
  var falseNode = node.hookFalse();
  this.resolveAsExpressionWithConversion(node.hookTest(), this.cache.boolType, CastKind.IMPLICIT_CAST);
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
  this.checkConversion(commonType, trueNode, CastKind.IMPLICIT_CAST);
  this.checkConversion(commonType, falseNode, CastKind.IMPLICIT_CAST);
  node.type = commonType;
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
      this.resolveAsExpressionWithConversion(values.get(i), itemType, CastKind.IMPLICIT_CAST);
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
  if (value.kind === NodeKind.LAMBDA && this.typeContext !== null) {
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
    this.resolveAsExpressionWithConversion(value, this.cache.functionType(this.typeContext, argumentTypes), CastKind.IMPLICIT_CAST);
  } else {
    if (!NodeKind.isExpression(value.kind)) {
      throw new Error("assert value.kind.isExpression(); (src/resolver/resolver.sk:2352:7)");
    }
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
  if (!node.hasChildren()) {
    throw new Error("assert node.hasChildren(); (src/resolver/resolver.sk:2402:5)");
  }
  for (var i = 0, n = node.children.length; i < n; i = i + 1 | 0) {
    var child = node.children.get(i);
    if (i < (n - 1 | 0)) {
      this.resolveAsExpression(child);
      this.checkUnusedExpression(child);
    } else {
      this.resolveAsExpressionWithConversion(child, this.typeContext, node.parent.kind === NodeKind.CAST ? CastKind.EXPLICIT_CAST : CastKind.IMPLICIT_CAST);
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
  if (parameters.length !== sortedParameters.length) {
    throw new Error("assert parameters.length == sortedParameters.length; (src/resolver/resolver.sk:2439:5)");
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
      this.checkConversion(bound, substitution, CastKind.IMPLICIT_CAST);
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
  this.resolveAsExpressionWithConversion(node.castValue(), type.type, CastKind.EXPLICIT_CAST);
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
          if ($arguments.get(i).variableType() !== null) {
            throw new Error("assert arguments.get(i).variableType() == null; (src/resolver/resolver.sk:2508:13)");
          }
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
  this.resolveAsExpression(value);
  var type = value.type;
  if (type.isError(this.cache)) {
    return;
  }
  if (kind === NodeKind.POSITIVE || kind === NodeKind.NEGATIVE) {
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
  } else if (kind === NodeKind.NOT) {
    if (type.isBool(this.cache)) {
      node.type = type;
    }
  } else if (kind === NodeKind.COMPLEMENT) {
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
  this.checkConversion(node.type, value, CastKind.IMPLICIT_CAST);
};
Resolver.prototype.resolveBinaryOperator = function(node) {
  var kind = node.kind;
  var left = node.binaryLeft();
  var right = node.binaryRight();
  if (NodeKind.isBinaryStorageOperator(kind)) {
    this.resolveAsExpression(left);
    if (kind === NodeKind.ASSIGN || left.type.isNumeric(this.cache)) {
      this.resolveAsExpressionWithConversion(right, left.type, CastKind.IMPLICIT_CAST);
      this.checkStorage(left);
      node.type = left.type;
      return;
    }
  }
  if (kind === NodeKind.EQUAL || kind === NodeKind.NOT_EQUAL) {
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
  if (kind === NodeKind.EQUAL || kind === NodeKind.NOT_EQUAL) {
    commonType = this.cache.commonImplicitType(leftType, rightType);
    if (commonType !== null) {
      node.type = this.cache.boolType;
    }
  } else if (kind === NodeKind.ADD || kind === NodeKind.SUBTRACT || kind === NodeKind.MULTIPLY || kind === NodeKind.DIVIDE) {
    if (leftType.isNumeric(this.cache) && rightType.isNumeric(this.cache)) {
      node.type = commonType = this.cache.commonImplicitType(leftType, rightType);
    }
  } else if (kind === NodeKind.REMAINDER || kind === NodeKind.SHIFT_LEFT || kind === NodeKind.SHIFT_RIGHT) {
    if (leftType.isInteger(this.cache) && rightType.isInteger(this.cache)) {
      node.type = commonType = this.cache.intType;
    }
  } else if (kind === NodeKind.BITWISE_AND || kind === NodeKind.BITWISE_OR || kind === NodeKind.BITWISE_XOR) {
    if (leftType === rightType && leftType.isEnumFlags()) {
      node.type = commonType = leftType;
    } else if (leftType.isInteger(this.cache) && rightType.isInteger(this.cache)) {
      node.type = commonType = this.cache.intType;
    }
  } else if (kind === NodeKind.LOGICAL_AND || kind === NodeKind.LOGICAL_OR) {
    if (leftType.isBool(this.cache) && rightType.isBool(this.cache)) {
      node.type = commonType = this.cache.boolType;
    }
  } else if (kind === NodeKind.LESS_THAN || kind === NodeKind.GREATER_THAN || kind === NodeKind.LESS_THAN_OR_EQUAL || kind === NodeKind.GREATER_THAN_OR_EQUAL) {
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
    this.checkConversion(commonType, left, CastKind.IMPLICIT_CAST);
    this.checkConversion(commonType, right, CastKind.IMPLICIT_CAST);
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
  if (this.locals.has(symbol.name)) {
    throw new Error("assert !locals.has(symbol.name); (src/resolver/scope.sk:44:5)");
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
var SymbolKind = {
  OTHER: 0,
  AUTOMATIC: 1,
  AMBIGUOUS: 2,
  UNMERGED: 3,
  PARAMETER: 4,
  OTHER_TYPE: 5,
  ALIAS: 6,
  USING_ALIAS: 7,
  GLOBAL_NAMESPACE: 8,
  NAMESPACE: 9,
  ENUM: 10,
  ENUM_FLAGS: 11,
  CLASS: 12,
  STRUCT: 13,
  INTERFACE: 14,
  GLOBAL_FUNCTION: 15,
  INSTANCE_FUNCTION: 16,
  CONSTRUCTOR_FUNCTION: 17,
  LOCAL_VARIABLE: 18,
  GLOBAL_VARIABLE: 19,
  INSTANCE_VARIABLE: 20
};
SymbolKind.isGlobalNamespace = function($this) {
  return $this === SymbolKind.GLOBAL_NAMESPACE;
};
SymbolKind.isNamespace = function($this) {
  return $this >= SymbolKind.GLOBAL_NAMESPACE && $this <= SymbolKind.NAMESPACE;
};
SymbolKind.isTypeWithInstances = function($this) {
  return $this >= SymbolKind.ENUM && $this <= SymbolKind.INTERFACE;
};
SymbolKind.isEnum = function($this) {
  return $this >= SymbolKind.ENUM && $this <= SymbolKind.ENUM_FLAGS;
};
SymbolKind.isObject = function($this) {
  return $this >= SymbolKind.CLASS && $this <= SymbolKind.INTERFACE;
};
SymbolKind.isType = function($this) {
  return $this >= SymbolKind.PARAMETER && $this <= SymbolKind.INTERFACE;
};
SymbolKind.isConstructor = function($this) {
  return $this === SymbolKind.CONSTRUCTOR_FUNCTION;
};
SymbolKind.isFunction = function($this) {
  return $this >= SymbolKind.GLOBAL_FUNCTION && $this <= SymbolKind.CONSTRUCTOR_FUNCTION;
};
SymbolKind.isVariable = function($this) {
  return $this >= SymbolKind.LOCAL_VARIABLE && $this <= SymbolKind.INSTANCE_VARIABLE;
};
SymbolKind.isInstance = function($this) {
  return $this === SymbolKind.INSTANCE_FUNCTION || $this === SymbolKind.INSTANCE_VARIABLE || $this === SymbolKind.CONSTRUCTOR_FUNCTION;
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
var SymbolFlag = {
  PUBLIC: 1,
  PRIVATE: 2,
  PROTECTED: 4,
  ABSTRACT: 8,
  FROM_EXTENSION: 16,
  OVERRIDE: 32,
  STATIC: 64,
  VIRTUAL: 128,
  FINAL: 256,
  INLINE: 512,
  EXPORT: 1024,
  IMPORT: 2048,
  INITIALIZING: 4096,
  INITIALIZED: 8192,
  HAS_LOCATION_ERROR: 16384,
  HAS_MODIFIER_ERRORS: 32768,
  KEYWORD_MASK: 4071
};
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
  return this.enclosingSymbol !== null && this.kind !== SymbolKind.PARAMETER && !SymbolKind.isGlobalNamespace(this.enclosingSymbol.kind) ? this.enclosingSymbol.fullName().append(".").append(this.name) : this.name;
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
  return (this.flags & SymbolFlag.PUBLIC) !== 0;
};
Symbol.prototype.isPrivate = function() {
  return (this.flags & SymbolFlag.PRIVATE) !== 0;
};
Symbol.prototype.isProtected = function() {
  return (this.flags & SymbolFlag.PROTECTED) !== 0;
};
Symbol.prototype.isAbstract = function() {
  return (this.flags & SymbolFlag.ABSTRACT) !== 0;
};
Symbol.prototype.isFromExtension = function() {
  return (this.flags & SymbolFlag.FROM_EXTENSION) !== 0;
};
Symbol.prototype.isOverride = function() {
  return (this.flags & SymbolFlag.OVERRIDE) !== 0;
};
Symbol.prototype.isStatic = function() {
  return (this.flags & SymbolFlag.STATIC) !== 0;
};
Symbol.prototype.isVirtual = function() {
  return (this.flags & SymbolFlag.VIRTUAL) !== 0;
};
Symbol.prototype.isFinal = function() {
  return (this.flags & SymbolFlag.FINAL) !== 0;
};
Symbol.prototype.isInline = function() {
  return (this.flags & SymbolFlag.INLINE) !== 0;
};
Symbol.prototype.isImport = function() {
  return (this.flags & SymbolFlag.IMPORT) !== 0;
};
Symbol.prototype.isExport = function() {
  return (this.flags & SymbolFlag.EXPORT) !== 0;
};
Symbol.prototype.isImportOrExport = function() {
  return this.isImport() || this.isExport();
};
Symbol.prototype.isUninitialized = function() {
  if ((this.flags & (SymbolFlag.INITIALIZING | SymbolFlag.INITIALIZED)) === (SymbolFlag.INITIALIZING | SymbolFlag.INITIALIZED)) {
    throw new Error("assert (flags & (SymbolFlag.INITIALIZING | SymbolFlag.INITIALIZED)) != (SymbolFlag.INITIALIZING | SymbolFlag.INITIALIZED); (src/resolver/symbol.sk:271:5)");
  }
  return (this.flags & (SymbolFlag.INITIALIZING | SymbolFlag.INITIALIZED)) === 0;
};
Symbol.prototype.isInitializing = function() {
  if ((this.flags & (SymbolFlag.INITIALIZING | SymbolFlag.INITIALIZED)) === (SymbolFlag.INITIALIZING | SymbolFlag.INITIALIZED)) {
    throw new Error("assert (flags & (SymbolFlag.INITIALIZING | SymbolFlag.INITIALIZED)) != (SymbolFlag.INITIALIZING | SymbolFlag.INITIALIZED); (src/resolver/symbol.sk:276:5)");
  }
  return (this.flags & SymbolFlag.INITIALIZING) !== 0;
};
Symbol.prototype.isInitialized = function() {
  if ((this.flags & (SymbolFlag.INITIALIZING | SymbolFlag.INITIALIZED)) === (SymbolFlag.INITIALIZING | SymbolFlag.INITIALIZED)) {
    throw new Error("assert (flags & (SymbolFlag.INITIALIZING | SymbolFlag.INITIALIZED)) != (SymbolFlag.INITIALIZING | SymbolFlag.INITIALIZED); (src/resolver/symbol.sk:281:5)");
  }
  return (this.flags & SymbolFlag.INITIALIZED) !== 0;
};
Symbol.prototype.hasLocationError = function() {
  return (this.flags & SymbolFlag.HAS_LOCATION_ERROR) !== 0;
};
Symbol.prototype.hasModifierErrors = function() {
  return (this.flags & SymbolFlag.HAS_MODIFIER_ERRORS) !== 0;
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
  member.enclosingType = this;
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
    var parts = [];
    for (var i = 0; i < this.symbol.parameters.length; i = i + 1 | 0) {
      parts.push(this.isParameterized() ? this.substitutions.get(i).toString() : this.symbol.parameters.get(i).name);
    }
    return this.symbol.fullName().append("<").append(", ".join(parts)).append(">");
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
  if (!this.isClass()) {
    throw new Error("assert isClass(); (src/resolver/type.sk:107:5)");
  }
  if (!this.hasRelevantTypes()) {
    return null;
  }
  var first = this.relevantTypes.get(0);
  return first.isClass() ? first : null;
};
Type.prototype.bound = function() {
  if (!this.isParameter()) {
    throw new Error("assert isParameter(); (src/resolver/type.sk:114:5)");
  }
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
  if (!this.isFunction()) {
    throw new Error("assert isFunction(); (src/resolver/type.sk:136:5)");
  }
  if (!this.hasRelevantTypes()) {
    throw new Error("assert hasRelevantTypes(); (src/resolver/type.sk:137:5)");
  }
  return this.relevantTypes.get(0);
};
Type.prototype.argumentTypes = function() {
  if (!this.isFunction()) {
    throw new Error("assert isFunction(); (src/resolver/type.sk:142:5)");
  }
  if (!this.hasRelevantTypes()) {
    throw new Error("assert hasRelevantTypes(); (src/resolver/type.sk:143:5)");
  }
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
  return this.symbol !== null && this.symbol.kind === SymbolKind.ENUM_FLAGS;
};
Type.prototype.isParameter = function() {
  return this.symbol !== null && this.symbol.kind === SymbolKind.PARAMETER;
};
Type.prototype.isObject = function() {
  return this.symbol !== null && SymbolKind.isObject(this.symbol.kind);
};
Type.prototype.isClass = function() {
  return this.symbol !== null && this.symbol.kind === SymbolKind.CLASS;
};
Type.prototype.isStruct = function() {
  return this.symbol !== null && this.symbol.kind === SymbolKind.STRUCT;
};
Type.prototype.isInterface = function() {
  return this.symbol !== null && this.symbol.kind === SymbolKind.INTERFACE;
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
  this.globalType = TypeCache.createType(new Symbol("<global>", SymbolKind.GLOBAL_NAMESPACE));
  this.nullType = TypeCache.createType(new Symbol("null", SymbolKind.OTHER));
  this.voidType = TypeCache.createType(new Symbol("void", SymbolKind.OTHER_TYPE));
  this.errorType = TypeCache.createType(new Symbol("<error>", SymbolKind.OTHER));
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
  symbol.flags = symbol.flags | SymbolFlag.INITIALIZED;
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
  if (type.isFunction()) {
    return this.parameterize(type, this.substituteAll(type.relevantTypes, parameters, substitutions));
  }
  if (!type.hasParameters()) {
    var index = parameters.indexOf(type.symbol);
    return index >= 0 ? substitutions.get(index) : type;
  }
  var types = [];
  for (var i = 0; i < type.symbol.parameters.length; i = i + 1 | 0) {
    types.push(type.substitutions.get(i));
  }
  return this.parameterize(type, this.substituteAll(types, parameters, substitutions));
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
    if (!symbol.hasParameters()) {
      throw new Error("assert symbol.hasParameters(); (src/resolver/typecache.sk:89:7)");
    }
    if (symbol.type.isParameterized()) {
      throw new Error("assert !symbol.type.isParameterized(); (src/resolver/typecache.sk:90:7)");
    }
    if (symbol.parameters.length !== substitutions.length) {
      throw new Error("assert symbol.parameters.length == substitutions.length; (src/resolver/typecache.sk:91:7)");
    }
  }
  var hash = TypeCache.computeHashCode(symbol, substitutions);
  var existingTypes = this.hashTable.getOrDefault(hash, null);
  if (existingTypes !== null) {
    for (var i = 0; i < existingTypes.length; i = i + 1 | 0) {
      var existing = existingTypes.get(i);
      if (symbol === existing.symbol && symbol !== null && substitutions.length !== existing.substitutions.length) {
        throw new Error("assert symbol != existing.symbol || symbol == null || substitutions.length == existing.substitutions.length; (src/resolver/typecache.sk:102:9)");
      }
      if (symbol === existing.symbol && (symbol === null && TypeCache.areTypeListsEqual(substitutions, existing.relevantTypes) || symbol !== null && TypeCache.areTypeListsEqual(substitutions, existing.substitutions))) {
        return existing;
      }
    }
  } else {
    existingTypes = [];
    this.hashTable.set(hash, existingTypes);
  }
  var type = new Type(symbol);
  if (symbol !== null) {
    type.substitutions = substitutions;
    type.relevantTypes = this.substituteAll(unparameterized.relevantTypes, symbol.parameters, type.substitutions);
    var members = unparameterized.members.values();
    for (var i = 0; i < members.length; i = i + 1 | 0) {
      var member = members.get(i);
      var clone = new Member(member.symbol);
      clone.dependency = member;
      clone.parameterizedType = type;
      type.addMember(clone);
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
    if (previousFile.range.source !== this.previousSource) {
      throw new Error("assert previousFile.range.source == previousSource; (src/service/service.sk:34:7)");
    }
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
    if (previousFile.range.source !== this.previousSource) {
      throw new Error("assert previousFile.range.source == previousSource; (src/service/service.sk:79:7)");
    }
    return service.completionsFromPosition(previousFile, this.previousResult.resolver, this.previousSource, index);
  }
  return null;
};
var service = {};
function checkAllNodeListKinds(node, check) {
  if (node === null) {
    throw new Error("assert node != null; (src/ast/create.sk:410:3)");
  }
  if (node.kind !== NodeKind.NODE_LIST) {
    throw new Error("assert node.kind == NodeKind.NODE_LIST; (src/ast/create.sk:411:3)");
  }
  if (node.children === null) {
    throw new Error("assert node.children != null; (src/ast/create.sk:412:3)");
  }
  return checkAllNodeKinds(node.children, check);
}
function checkAllNodeKinds(nodes, check) {
  if (nodes === null) {
    throw new Error("assert nodes != null; (src/ast/create.sk:417:3)");
  }
  for (var i = 0; i < nodes.length; i = i + 1 | 0) {
    if (!check.$call(nodes.get(i))) {
      return false;
    }
  }
  return true;
}
function createOperatorMap() {
  var result = new IntMap();
  result.set(NodeKind.NOT, new OperatorInfo("!", Precedence.UNARY_PREFIX, Associativity.NONE));
  result.set(NodeKind.POSITIVE, new OperatorInfo("+", Precedence.UNARY_PREFIX, Associativity.NONE));
  result.set(NodeKind.NEGATIVE, new OperatorInfo("-", Precedence.UNARY_PREFIX, Associativity.NONE));
  result.set(NodeKind.COMPLEMENT, new OperatorInfo("~", Precedence.UNARY_PREFIX, Associativity.NONE));
  result.set(NodeKind.PREFIX_INCREMENT, new OperatorInfo("++", Precedence.UNARY_PREFIX, Associativity.NONE));
  result.set(NodeKind.PREFIX_DECREMENT, new OperatorInfo("--", Precedence.UNARY_PREFIX, Associativity.NONE));
  result.set(NodeKind.POSTFIX_INCREMENT, new OperatorInfo("++", Precedence.UNARY_POSTFIX, Associativity.NONE));
  result.set(NodeKind.POSTFIX_DECREMENT, new OperatorInfo("--", Precedence.UNARY_POSTFIX, Associativity.NONE));
  result.set(NodeKind.ADD, new OperatorInfo("+", Precedence.ADD, Associativity.LEFT));
  result.set(NodeKind.BITWISE_AND, new OperatorInfo("&", Precedence.BITWISE_AND, Associativity.LEFT));
  result.set(NodeKind.BITWISE_OR, new OperatorInfo("|", Precedence.BITWISE_OR, Associativity.LEFT));
  result.set(NodeKind.BITWISE_XOR, new OperatorInfo("^", Precedence.BITWISE_XOR, Associativity.LEFT));
  result.set(NodeKind.DIVIDE, new OperatorInfo("/", Precedence.MULTIPLY, Associativity.LEFT));
  result.set(NodeKind.EQUAL, new OperatorInfo("==", Precedence.EQUAL, Associativity.LEFT));
  result.set(NodeKind.GREATER_THAN, new OperatorInfo(">", Precedence.COMPARE, Associativity.LEFT));
  result.set(NodeKind.GREATER_THAN_OR_EQUAL, new OperatorInfo(">=", Precedence.COMPARE, Associativity.LEFT));
  result.set(NodeKind.IN, new OperatorInfo("in", Precedence.COMPARE, Associativity.LEFT));
  result.set(NodeKind.INDEX, new OperatorInfo("[]", Precedence.MEMBER, Associativity.LEFT));
  result.set(NodeKind.LESS_THAN, new OperatorInfo("<", Precedence.COMPARE, Associativity.LEFT));
  result.set(NodeKind.LESS_THAN_OR_EQUAL, new OperatorInfo("<=", Precedence.COMPARE, Associativity.LEFT));
  result.set(NodeKind.LOGICAL_AND, new OperatorInfo("&&", Precedence.LOGICAL_AND, Associativity.LEFT));
  result.set(NodeKind.LOGICAL_OR, new OperatorInfo("||", Precedence.LOGICAL_OR, Associativity.LEFT));
  result.set(NodeKind.MULTIPLY, new OperatorInfo("*", Precedence.MULTIPLY, Associativity.LEFT));
  result.set(NodeKind.NOT_EQUAL, new OperatorInfo("!=", Precedence.EQUAL, Associativity.LEFT));
  result.set(NodeKind.REMAINDER, new OperatorInfo("%", Precedence.MULTIPLY, Associativity.LEFT));
  result.set(NodeKind.SHIFT_LEFT, new OperatorInfo("<<", Precedence.SHIFT, Associativity.LEFT));
  result.set(NodeKind.SHIFT_RIGHT, new OperatorInfo(">>", Precedence.SHIFT, Associativity.LEFT));
  result.set(NodeKind.SUBTRACT, new OperatorInfo("-", Precedence.ADD, Associativity.LEFT));
  result.set(NodeKind.ASSIGN, new OperatorInfo("=", Precedence.ASSIGN, Associativity.RIGHT));
  result.set(NodeKind.ASSIGN_ADD, new OperatorInfo("+=", Precedence.ASSIGN, Associativity.RIGHT));
  result.set(NodeKind.ASSIGN_BITWISE_AND, new OperatorInfo("&=", Precedence.ASSIGN, Associativity.RIGHT));
  result.set(NodeKind.ASSIGN_BITWISE_OR, new OperatorInfo("|=", Precedence.ASSIGN, Associativity.RIGHT));
  result.set(NodeKind.ASSIGN_BITWISE_XOR, new OperatorInfo("^=", Precedence.ASSIGN, Associativity.RIGHT));
  result.set(NodeKind.ASSIGN_DIVIDE, new OperatorInfo("/=", Precedence.ASSIGN, Associativity.RIGHT));
  result.set(NodeKind.ASSIGN_MULTIPLY, new OperatorInfo("*=", Precedence.ASSIGN, Associativity.RIGHT));
  result.set(NodeKind.ASSIGN_REMAINDER, new OperatorInfo("%=", Precedence.ASSIGN, Associativity.RIGHT));
  result.set(NodeKind.ASSIGN_SHIFT_LEFT, new OperatorInfo("<<=", Precedence.ASSIGN, Associativity.RIGHT));
  result.set(NodeKind.ASSIGN_SHIFT_RIGHT, new OperatorInfo(">>=", Precedence.ASSIGN, Associativity.RIGHT));
  result.set(NodeKind.ASSIGN_SUBTRACT, new OperatorInfo("-=", Precedence.ASSIGN, Associativity.RIGHT));
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
  if (bytes < ByteSize.KB) {
    return bytes.toString().append(" bytes");
  }
  if (bytes < ByteSize.MB) {
    return formatNumber(bytes / ByteSize.KB).append("kb");
  }
  if (bytes < ByteSize.GB) {
    return formatNumber(bytes / ByteSize.MB).append("mb");
  }
  return formatNumber(bytes / ByteSize.GB).append("gb");
}
io.printWithColor = function(color, text) {
  io.setColor(color);
  io.print(text);
  io.setColor(io.Color.DEFAULT);
};
frontend.printError = function(text) {
  io.printWithColor(io.Color.RED, "error: ");
  io.printWithColor(io.Color.BOLD, text.append("\n"));
};
frontend.printNote = function(text) {
  io.printWithColor(io.Color.GRAY, "note: ");
  io.printWithColor(io.Color.BOLD, text.append("\n"));
};
frontend.printWarning = function(text) {
  io.printWithColor(io.Color.MAGENTA, "warning: ");
  io.printWithColor(io.Color.BOLD, text.append("\n"));
};
frontend.printUsage = function() {
  io.printWithColor(io.Color.GREEN, "\nusage: ");
  io.printWithColor(io.Color.BOLD, "skewc [flags] [inputs]\n");
  io.print("\n  --help (-h)       Print this message.\n\n  --verbose         Print out useful information about the compilation.\n\n  --target=___      Set the target language. Valid target languages: none, js,\n                    lisp-ast, json-ast, and xml-ast.\n\n  --output-file=___ Combines all output into a single file.\n\n  --js-source-map   Generate a source map when targeting JavaScript. The source\n                    map will be saved with the \".map\" extension in the same\n                    directory as the main output file.\n\n");
};
frontend.afterEquals = function(text) {
  var equals = text.indexOf("=");
  if (equals < 0) {
    throw new Error("assert equals >= 0; (src/frontend/frontend.sk:77:5)");
  }
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
    target = TargetFormat.NONE;
    break;
  case "js":
    target = TargetFormat.JS;
    break;
  case "lisp-ast":
    target = TargetFormat.LISP_AST;
    break;
  case "json-ast":
    target = TargetFormat.JSON_AST;
    break;
  case "xml-ast":
    target = TargetFormat.XML_AST;
    break;
  default:
    frontend.printError("Unknown target language ".append(quoteString(flags.target, 34)));
    return 1;
  }
  var options = new CompilerOptions();
  options.targetFormat = target;
  options.outputFile = flags.shouldWriteToStdout() ? "<stdout>" : flags.outputFile;
  options.jsSourceMap = flags.jsSourceMap && flags.outputFile !== "" && target === TargetFormat.JS;
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
      io.printWithColor(io.Color.BOLD, diagnostic.range.locationString().append(": "));
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
      io.printWithColor(io.Color.GREEN, formatted.range.append("\n"));
    }
    if (!diagnostic.noteRange.isEmpty()) {
      io.printWithColor(io.Color.BOLD, diagnostic.noteRange.locationString().append(": "));
      frontend.printNote(diagnostic.noteText);
      var formatted = diagnostic.noteRange.format(io.terminalWidth);
      io.print(formatted.line.append("\n"));
      io.printWithColor(io.Color.GREEN, formatted.range.append("\n"));
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
      if (yy_accept.get(yy_current_state) !== TokenKind.YY_INVALID_ACTION) {
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
    while (yy_act === TokenKind.YY_INVALID_ACTION) {
      yy_cp = yy_last_accepting_cpos;
      yy_current_state = yy_last_accepting_state;
      yy_act = yy_accept.get(yy_current_state);
    }
    if (yy_act === TokenKind.WHITESPACE) {
      continue;
    } else if (yy_act === TokenKind.ERROR) {
      syntaxErrorExtraData(log, new Range(source, yy_bp, yy_cp), text.slice(yy_bp, yy_cp));
      break;
    } else if (yy_act !== TokenKind.END_OF_FILE) {
      tokens.push(new Token(new Range(source, yy_bp, yy_cp), yy_act, text.slice(yy_bp, yy_cp)));
    }
  }
  tokens.push(new Token(new Range(source, text_length, text_length), TokenKind.END_OF_FILE, ""));
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
      if (topKind === TokenKind.LESS_THAN && tokenKind !== TokenKind.LESS_THAN && tokenKind !== TokenKind.IDENTIFIER && tokenKind !== TokenKind.IS && tokenKind !== TokenKind.COMMA && tokenKind !== TokenKind.DOT && tokenKind !== TokenKind.FN && tokenKind !== TokenKind.LEFT_PARENTHESIS && tokenKind !== TokenKind.RIGHT_PARENTHESIS && !tokenStartsWithGreaterThan) {
        stack.pop();
      } else {
        break;
      }
    }
    if (tokenKind === TokenKind.LEFT_PARENTHESIS || tokenKind === TokenKind.LEFT_BRACE || tokenKind === TokenKind.LEFT_BRACKET || tokenKind === TokenKind.LESS_THAN) {
      stack.push(i);
      continue;
    }
    if (tokenKind === TokenKind.RIGHT_PARENTHESIS || tokenKind === TokenKind.RIGHT_BRACE || tokenKind === TokenKind.RIGHT_BRACKET || tokenStartsWithGreaterThan) {
      while (stack.length > 0) {
        var top = tokens.get(stack.get(stack.length - 1 | 0));
        var topKind = top.kind;
        if (tokenStartsWithGreaterThan && topKind !== TokenKind.LESS_THAN) {
          break;
        }
        stack.pop();
        if (topKind === TokenKind.LESS_THAN) {
          if (!tokenStartsWithGreaterThan) {
            continue;
          }
          if (tokenKind !== TokenKind.GREATER_THAN) {
            var range = token.range;
            var start = range.start;
            var text = token.text.slice(1, token.text.length);
            var kind = tokenKind === TokenKind.SHIFT_RIGHT ? TokenKind.GREATER_THAN : tokenKind === TokenKind.GREATER_THAN_OR_EQUAL ? TokenKind.ASSIGN : tokenKind === TokenKind.ASSIGN_SHIFT_RIGHT ? TokenKind.GREATER_THAN_OR_EQUAL : TokenKind.ERROR;
            if (kind === TokenKind.ERROR) {
              throw new Error("assert kind != .ERROR; (src/lexer/token.sk:80:13)");
            }
            tokens.insert(i + 1 | 0, new Token(new Range(range.source, start + 1 | 0, range.end), kind, text));
            token.range = new Range(range.source, start, start + 1 | 0);
            token.text = ">";
          }
          top.kind = TokenKind.START_PARAMETER_LIST;
          token.kind = TokenKind.END_PARAMETER_LIST;
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
  while (!context.peek(TokenKind.END_OF_FILE)) {
    var currentKind = context.current().kind;
    if (currentKind === TokenKind.RIGHT_PARENTHESIS || currentKind === TokenKind.RIGHT_BRACKET || currentKind === TokenKind.RIGHT_BRACE || currentKind === TokenKind.SEMICOLON && tokenScan === TokenScan.STOP_BEFORE_NEXT_STATEMENT) {
      return context.eat(kind);
    }
    if (tokenScan === TokenScan.STOP_BEFORE_NEXT_STATEMENT && (currentKind === TokenKind.ASSERT || currentKind === TokenKind.BREAK || currentKind === TokenKind.CLASS || currentKind === TokenKind.CONTINUE || currentKind === TokenKind.DO || currentKind === TokenKind.ENUM || currentKind === TokenKind.EXPORT || currentKind === TokenKind.FINAL || currentKind === TokenKind.FOR || currentKind === TokenKind.IF || currentKind === TokenKind.IMPORT || currentKind === TokenKind.INLINE || currentKind === TokenKind.INTERFACE || currentKind === TokenKind.NAMESPACE || currentKind === TokenKind.OVERRIDE || currentKind === TokenKind.PRIVATE || currentKind === TokenKind.PROTECTED || currentKind === TokenKind.PUBLIC || currentKind === TokenKind.RETURN || currentKind === TokenKind.STATIC || currentKind === TokenKind.STRUCT || currentKind === TokenKind.SWITCH || currentKind === TokenKind.USING || currentKind === TokenKind.ALIAS || currentKind === TokenKind.VIRTUAL || currentKind === TokenKind.WHILE)) {
      return true;
    }
    context.next();
  }
  return false;
}
function parseGroup(context, allowLambda) {
  var token = context.current();
  if (!context.expect(TokenKind.LEFT_PARENTHESIS)) {
    return null;
  }
  if (allowLambda === AllowLambda.LAMBDA_NOT_ALLOWED || !context.eat(TokenKind.RIGHT_PARENTHESIS)) {
    var value = pratt.parse(context, Precedence.LOWEST);
    scanForToken(context, TokenKind.RIGHT_PARENTHESIS, TokenScan.STOP_BEFORE_NEXT_STATEMENT);
    return value;
  }
  if (!context.peek(TokenKind.LAMBDA)) {
    context.expect(TokenKind.LAMBDA);
    return Node.createError().withRange(context.spanSince(token.range));
  }
  return Node.createSequence([]).withRange(context.spanSince(token.range));
}
function parseName(context) {
  var token = context.current();
  if (!context.expect(TokenKind.IDENTIFIER)) {
    return null;
  }
  return Node.createName(token.text).withRange(token.range);
}
function parseBlock(context, hint) {
  var token = context.current();
  if (!context.expect(TokenKind.LEFT_BRACE)) {
    return null;
  }
  var statements = parseStatements(context, hint);
  scanForToken(context, TokenKind.RIGHT_BRACE, TokenScan.NORMAL);
  return Node.createBlock(statements).withRange(context.spanSince(token.range));
}
function parseBlockOrStatement(context, hint) {
  if (context.peek(TokenKind.LEFT_BRACE)) {
    return parseBlock(context, hint);
  }
  var statement = parseStatement(context, hint);
  if (statement === null) {
    return null;
  }
  return Node.createBlock([statement]).withRange(statement.range);
}
function parseLambdaBlock(context) {
  if (context.peek(TokenKind.LEFT_BRACE)) {
    return parseBlock(context, StatementHint.NORMAL);
  }
  if (context.peek(TokenKind.RIGHT_PARENTHESIS) || context.peek(TokenKind.COMMA) || context.peek(TokenKind.SEMICOLON)) {
    return Node.createBlock([]);
  }
  var value = pratt.parse(context, Precedence.COMMA);
  return Node.createBlock([Node.createImplicitReturn(value).withRange(value.range)]).withRange(value.range);
}
function parseCaseStatement(context) {
  var token = context.current();
  var values = [];
  if (!context.eat(TokenKind.DEFAULT)) {
    if (!context.expect(TokenKind.CASE)) {
      return null;
    }
    do {
      if (context.peek(TokenKind.LEFT_BRACE)) {
        context.unexpectedToken();
        values.push(Node.createError());
        break;
      }
      values.push(pratt.parse(context, Precedence.COMMA));
    } while (context.eat(TokenKind.COMMA));
  }
  var block = parseBlock(context, StatementHint.NORMAL);
  if (block === null) {
    return null;
  }
  return Node.createCase(values, block).withRange(context.spanSince(token.range));
}
function parseStatements(context, hint) {
  var statements = [];
  while (!context.peek(TokenKind.RIGHT_BRACE) && !context.peek(TokenKind.END_OF_FILE)) {
    if (hint === StatementHint.IN_ENUM) {
      var declaration = parseEnumValueDeclaration(context);
      if (declaration === null) {
        break;
      }
      statements.push(declaration);
      if (!context.eat(TokenKind.COMMA)) {
        break;
      }
    } else {
      var statement = hint === StatementHint.IN_SWITCH ? parseCaseStatement(context) : parseStatement(context, hint);
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
  if (!context.expect(TokenKind.LEFT_PARENTHESIS)) {
    return null;
  }
  while (!context.peek(TokenKind.RIGHT_PARENTHESIS)) {
    if ($arguments.length > 0 && !context.expect(TokenKind.COMMA)) {
      break;
    }
    var type = parseType(context);
    var name = parseName(context);
    if (name === null) {
      break;
    }
    $arguments.push(Node.createVariable(name, type, null).withRange(Range.span(type.range, name.range)));
  }
  scanForToken(context, TokenKind.RIGHT_PARENTHESIS, TokenScan.NORMAL);
  return Node.createNodeList($arguments).withRange(context.spanSince(token.range));
}
function parseType(context) {
  return pratt.parse(context, Precedence.MEMBER - 1 | 0);
}
function parseEnumValueDeclaration(context) {
  var name = parseName(context);
  if (name === null) {
    return null;
  }
  var value = context.eat(TokenKind.ASSIGN) ? pratt.parse(context, Precedence.COMMA) : null;
  return Node.createVariable(name, null, value).withRange(context.spanSince(name.range));
}
function parseParameter(context) {
  var token = context.current();
  var name = parseName(context);
  if (name === null) {
    return null;
  }
  var bound = context.eat(TokenKind.IS) ? pratt.parse(context, Precedence.COMMA) : null;
  return Node.createParameter(name, bound).withRange(context.spanSince(token.range));
}
function parseParameters(context) {
  var token = context.current();
  var parameters = [];
  if (!context.eat(TokenKind.START_PARAMETER_LIST)) {
    return null;
  }
  while (parameters.length === 0 || !context.peek(TokenKind.END_PARAMETER_LIST)) {
    if (parameters.length > 0 && !context.expect(TokenKind.COMMA)) {
      break;
    }
    var parameter = parseParameter(context);
    if (parameter === null) {
      break;
    }
    parameters.push(parameter);
  }
  scanForToken(context, TokenKind.END_PARAMETER_LIST, TokenScan.STOP_BEFORE_NEXT_STATEMENT);
  return Node.createNodeList(parameters).withRange(context.spanSince(token.range));
}
function parseArgumentList(context, left, right, comma) {
  var values = [];
  if (!context.expect(left)) {
    return values;
  }
  while (!context.peek(right)) {
    if (comma === AllowTrailingComma.NO_TRAILING_COMMA && values.length > 0 && !context.expect(TokenKind.COMMA)) {
      break;
    }
    var value = pratt.parse(context, Precedence.COMMA);
    values.push(value);
    if (NodeKind.isError(value.kind) || comma === AllowTrailingComma.TRAILING_COMMA && !context.peek(right) && !context.expect(TokenKind.COMMA)) {
      break;
    }
  }
  scanForToken(context, right, TokenScan.STOP_BEFORE_NEXT_STATEMENT);
  return values;
}
function parseTypeList(context, end) {
  var token = context.current();
  var types = [];
  while (types.length === 0 || !context.peek(end)) {
    if (context.peek(TokenKind.LEFT_BRACE)) {
      context.unexpectedToken();
      break;
    }
    if (types.length > 0 && !context.eat(TokenKind.COMMA)) {
      context.expect(end);
      break;
    }
    if (context.peek(TokenKind.LEFT_BRACE)) {
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
  var bases = context.eat(TokenKind.COLON) ? Node.createNodeList(parseTypeList(context, TokenKind.LEFT_BRACE)) : null;
  var block = parseBlock(context, StatementHint.IN_OBJECT);
  if (block === null) {
    return null;
  }
  return Node.createObject(kind, name, parameters, bases, block).withRange(context.spanSince(token.range));
}
function parseNestedNamespaceBlock(context) {
  if (!context.eat(TokenKind.DOT)) {
    return parseBlock(context, StatementHint.NORMAL);
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
  if (hint !== StatementHint.IN_OBJECT) {
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
  if (context.eat(TokenKind.COLON)) {
    if (context.peek(TokenKind.SUPER)) {
      superInitializer = parseSuperCall(context);
    }
    if (superInitializer === null || context.eat(TokenKind.COMMA)) {
      var values = [];
      var first = context.current();
      do {
        var member = parseName(context);
        if (member === null) {
          break;
        }
        if (!context.expect(TokenKind.ASSIGN)) {
          break;
        }
        var value = pratt.parse(context, Precedence.COMMA);
        values.push(Node.createMemberInitializer(member, value).withRange(context.spanSince(member.range)));
      } while (context.eat(TokenKind.COMMA));
      memberInitializers = Node.createNodeList(values).withRange(context.spanSince(first.range));
    }
  }
  var block = null;
  if (!context.eat(TokenKind.SEMICOLON)) {
    block = parseBlock(context, StatementHint.NORMAL);
    if (block === null) {
      return null;
    }
  }
  return Node.createConstructor(name, $arguments, block, superInitializer, memberInitializers).withRange(context.spanSince(token.range));
}
function parseExpression(context) {
  if (context.peek(TokenKind.LEFT_BRACE)) {
    context.unexpectedToken();
    return null;
  }
  var token = context.current();
  var value = pratt.parse(context, Precedence.LOWEST);
  if (!scanForToken(context, TokenKind.SEMICOLON, TokenScan.STOP_BEFORE_NEXT_STATEMENT) && context.current().range.start === token.range.start) {
    context.next();
  }
  if (context.current().range.start < token.range.end) {
    throw new Error("assert context.current().range.start >= token.range.end; (src/parser/parser.sk:356:3)");
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
  if (!context.eat(TokenKind.SEMICOLON)) {
    value = pratt.parse(context, Precedence.LOWEST);
    scanForToken(context, TokenKind.SEMICOLON, TokenScan.STOP_BEFORE_NEXT_STATEMENT);
  }
  return Node.createReturn(value).withRange(context.spanSince(token.range));
}
function parseBreak(context) {
  var token = context.next();
  context.expect(TokenKind.SEMICOLON);
  return Node.createBreak().withRange(context.spanSince(token.range));
}
function parseContinue(context) {
  var token = context.next();
  context.expect(TokenKind.SEMICOLON);
  return Node.createContinue().withRange(context.spanSince(token.range));
}
function parseAssert(context) {
  var token = context.next();
  var value = pratt.parse(context, Precedence.LOWEST);
  scanForToken(context, TokenKind.SEMICOLON, TokenScan.STOP_BEFORE_NEXT_STATEMENT);
  return Node.createAssert(value).withRange(context.spanSince(token.range));
}
function parseSwitch(context) {
  var token = context.next();
  var value = parseGroup(context, AllowLambda.LAMBDA_NOT_ALLOWED);
  if (value === null) {
    return null;
  }
  var block = parseBlock(context, StatementHint.IN_SWITCH);
  if (block === null) {
    return null;
  }
  return Node.createSwitch(value, block.removeChildren()).withRange(context.spanSince(token.range));
}
function parseWhile(context) {
  var token = context.next();
  var value = parseGroup(context, AllowLambda.LAMBDA_NOT_ALLOWED);
  if (value === null) {
    return null;
  }
  var block = parseBlockOrStatement(context, StatementHint.NORMAL);
  if (block === null) {
    return null;
  }
  return Node.createWhile(value, block).withRange(context.spanSince(token.range));
}
function parseDoWhile(context) {
  var token = context.next();
  var block = parseBlockOrStatement(context, StatementHint.NORMAL);
  if (block === null) {
    return null;
  }
  if (!context.expect(TokenKind.WHILE)) {
    return null;
  }
  var value = parseGroup(context, AllowLambda.LAMBDA_NOT_ALLOWED);
  scanForToken(context, TokenKind.SEMICOLON, TokenScan.STOP_BEFORE_NEXT_STATEMENT);
  return Node.createDoWhile(block, value).withRange(context.spanSince(token.range));
}
function parseIf(context) {
  var token = context.next();
  var value = parseGroup(context, AllowLambda.LAMBDA_NOT_ALLOWED);
  if (value === null) {
    return null;
  }
  var trueBlock = parseBlockOrStatement(context, StatementHint.NORMAL);
  if (trueBlock === null) {
    return null;
  }
  var falseBlock = null;
  if (context.eat(TokenKind.ELSE)) {
    falseBlock = parseBlockOrStatement(context, StatementHint.NORMAL);
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
  var bases = context.eat(TokenKind.COLON) ? Node.createNodeList(parseTypeList(context, TokenKind.LEFT_BRACE)) : null;
  var block = parseBlock(context, StatementHint.IN_OBJECT);
  if (block === null) {
    return null;
  }
  return Node.createExtension(name, bases, block).withRange(context.spanSince(token.range));
}
function parseEnum(context) {
  var token = context.next();
  var kind = NodeKind.ENUM;
  if (context.peek(TokenKind.IDENTIFIER) && context.current().text === "flags") {
    kind = NodeKind.ENUM_FLAGS;
    context.next();
  }
  var name = parseName(context);
  if (name === null) {
    return null;
  }
  var block = parseBlock(context, StatementHint.IN_ENUM);
  if (block === null) {
    return null;
  }
  return new Node(kind).withChildren([name, block]).withRange(context.spanSince(token.range));
}
function parseVariableCluster(context, type, name) {
  var variables = [];
  var start = type;
  while (variables.length === 0 || !context.peek(TokenKind.SEMICOLON) && !context.peek(TokenKind.IN)) {
    if (variables.length > 0 && !context.eat(TokenKind.COMMA)) {
      context.expect(TokenKind.SEMICOLON);
      break;
    }
    if (name === null) {
      name = start = parseName(context);
    }
    if (name === null) {
      break;
    }
    var value = context.eat(TokenKind.ASSIGN) ? pratt.parse(context, Precedence.COMMA) : null;
    variables.push(Node.createVariable(name, null, value).withRange(context.spanSince(start.range)));
    name = null;
  }
  return Node.createVariableCluster(type, variables).withRange(context.spanSince(type.range));
}
function parseFor(context) {
  var token = context.next();
  if (!context.expect(TokenKind.LEFT_PARENTHESIS)) {
    return null;
  }
  var setup = null;
  var test = null;
  var update = null;
  do {
    if (!context.peek(TokenKind.SEMICOLON) && !context.peek(TokenKind.RIGHT_PARENTHESIS)) {
      setup = parseType(context);
      if (context.peek(TokenKind.IDENTIFIER)) {
        var name = parseName(context);
        setup = name !== null ? parseVariableCluster(context, setup, name) : null;
        if (setup !== null && context.eat(TokenKind.IN)) {
          var values = pratt.parse(context, Precedence.LOWEST);
          scanForToken(context, TokenKind.RIGHT_PARENTHESIS, TokenScan.NORMAL);
          var body = parseBlockOrStatement(context, StatementHint.NORMAL);
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
      } else if (!context.peek(TokenKind.SEMICOLON)) {
        setup = pratt.resume(context, Precedence.LOWEST, setup);
      }
    }
    if (!context.expect(TokenKind.SEMICOLON)) {
      break;
    }
    if (!context.peek(TokenKind.SEMICOLON) && !context.peek(TokenKind.RIGHT_PARENTHESIS)) {
      test = pratt.parse(context, Precedence.LOWEST);
    }
    if (!context.expect(TokenKind.SEMICOLON)) {
      break;
    }
    if (!context.peek(TokenKind.RIGHT_PARENTHESIS)) {
      update = pratt.parse(context, Precedence.LOWEST);
    }
  } while (false);
  scanForToken(context, TokenKind.RIGHT_PARENTHESIS, TokenScan.NORMAL);
  var block = parseBlockOrStatement(context, StatementHint.NORMAL);
  if (block === null) {
    return null;
  }
  return Node.createFor(setup, test, update, block).withRange(context.spanSince(token.range));
}
function parseSuperCall(context) {
  var token = context.next();
  var values = parseArgumentList(context, TokenKind.LEFT_PARENTHESIS, TokenKind.RIGHT_PARENTHESIS, AllowTrailingComma.NO_TRAILING_COMMA);
  return Node.createSuperCall(values).withRange(context.spanSince(token.range));
}
function parsePossibleTypedDeclaration(context, hint) {
  var type = parseType(context);
  if (!context.peek(TokenKind.IDENTIFIER)) {
    var value = pratt.resume(context, Precedence.LOWEST, type);
    scanForToken(context, TokenKind.SEMICOLON, TokenScan.STOP_BEFORE_NEXT_STATEMENT);
    return Node.createExpression(value).withRange(context.spanSince(type.range));
  }
  var name = parseName(context);
  if (name === null) {
    return null;
  }
  if (context.peek(TokenKind.LEFT_PARENTHESIS)) {
    var $arguments = parseArgumentVariables(context);
    if ($arguments === null) {
      return null;
    }
    var block = null;
    if (!context.eat(TokenKind.SEMICOLON)) {
      block = parseBlock(context, StatementHint.NORMAL);
      if (block === null) {
        return null;
      }
    }
    return Node.createFunction(name, $arguments, block, type).withRange(context.spanSince(type.range));
  }
  var cluster = parseVariableCluster(context, type, name);
  scanForToken(context, TokenKind.SEMICOLON, TokenScan.STOP_BEFORE_NEXT_STATEMENT);
  var last = cluster.children.get(cluster.children.length - 1 | 0);
  last.withRange(context.spanSince(last.range));
  return cluster;
}
function parseUsing(context) {
  var token = context.next();
  var name = parseName(context);
  if (name === null) {
    scanForToken(context, TokenKind.SEMICOLON, TokenScan.STOP_BEFORE_NEXT_STATEMENT);
    var range = context.spanSince(token.range);
    return Node.createExpression(Node.createError().withRange(range)).withRange(range);
  }
  if (!context.eat(TokenKind.ASSIGN)) {
    var value = pratt.resume(context, Precedence.LOWEST, name);
    scanForToken(context, TokenKind.SEMICOLON, TokenScan.STOP_BEFORE_NEXT_STATEMENT);
    return Node.createUsingNamespace(value).withRange(context.spanSince(token.range));
  } else {
    var value = pratt.parse(context, Precedence.LOWEST);
    scanForToken(context, TokenKind.SEMICOLON, TokenScan.STOP_BEFORE_NEXT_STATEMENT);
    return Node.createUsingAlias(name, value).withRange(context.spanSince(token.range));
  }
}
function parseAlias(context) {
  var token = context.next();
  var name = parseName(context);
  if (name === null || !context.expect(TokenKind.ASSIGN)) {
    scanForToken(context, TokenKind.SEMICOLON, TokenScan.STOP_BEFORE_NEXT_STATEMENT);
    var range = context.spanSince(token.range);
    return Node.createExpression(Node.createError().withRange(range)).withRange(range);
  }
  var value = pratt.parse(context, Precedence.LOWEST);
  scanForToken(context, TokenKind.SEMICOLON, TokenScan.STOP_BEFORE_NEXT_STATEMENT);
  return Node.createAlias(name, value).withRange(context.spanSince(token.range));
}
function looksLikeLambdaArguments(node) {
  if (node.kind === NodeKind.SEQUENCE) {
    for (var i = 0; i < node.children.length; i = i + 1 | 0) {
      if (node.children.get(i).kind !== NodeKind.NAME) {
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
    if (name.kind !== NodeKind.NAME) {
      throw new Error("assert name.kind == .NAME; (src/parser/parser.sk:585:5)");
    }
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
    return parseObject(context, NodeKind.CLASS);
  case 22:
    return parseContinue(context);
  case 26:
    return parseDoWhile(context);
  case 31:
    return parseEnum(context);
  case 34:
    return parseModifier(context, hint, SymbolFlag.EXPORT);
  case 36:
    return parseModifier(context, hint, SymbolFlag.FINAL);
  case 39:
    return parseFor(context);
  case 42:
  case 93:
    return parsePossibleTypedDeclaration(context, hint);
  case 43:
    return parseIf(context);
  case 44:
    return parseModifier(context, hint, SymbolFlag.IMPORT);
  case 45:
    return parseExtension(context);
  case 47:
    return parseModifier(context, hint, SymbolFlag.INLINE);
  case 48:
    return parseObject(context, NodeKind.INTERFACE);
  case 65:
    return parseNamespace(context);
  case 66:
    return parseConstructor(context, hint);
  case 70:
    return parseModifier(context, hint, SymbolFlag.OVERRIDE);
  case 72:
    return parseModifier(context, hint, SymbolFlag.PRIVATE);
  case 73:
    return parseModifier(context, hint, SymbolFlag.PROTECTED);
  case 74:
    return parseModifier(context, hint, SymbolFlag.PUBLIC);
  case 77:
    return parseReturn(context);
  case 84:
    return parseModifier(context, hint, SymbolFlag.STATIC);
  case 86:
    return parseObject(context, NodeKind.STRUCT);
  case 88:
    return parseSwitch(context);
  case 92:
    return parseUsing(context);
  case 0:
    return parseAlias(context);
  case 94:
    return parseModifier(context, hint, SymbolFlag.VIRTUAL);
  case 95:
    return parseWhile(context);
  default:
    return parseExpression(context);
  }
}
function parseFile(log, tokens) {
  var context = new ParserContext(log, tokens);
  var token = context.current();
  var statements = parseStatements(context, StatementHint.NORMAL);
  if (statements === null) {
    return null;
  }
  if (!context.expect(TokenKind.END_OF_FILE)) {
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
  pratt.literal(TokenKind.NULL, tokenLiteral(NodeKind.NULL));
  pratt.literal(TokenKind.THIS, tokenLiteral(NodeKind.THIS));
  pratt.literal(TokenKind.TRUE, tokenLiteral(NodeKind.TRUE));
  pratt.literal(TokenKind.FALSE, tokenLiteral(NodeKind.FALSE));
  pratt.literal(TokenKind.INT_DECIMAL, intLiteral(10));
  pratt.literal(TokenKind.INT_BINARY, intLiteral(2));
  pratt.literal(TokenKind.INT_OCTAL, intLiteral(8));
  pratt.literal(TokenKind.INT_HEX, intLiteral(16));
  pratt.literal(TokenKind.FLOAT, function(context, token) {
    return Node.createFloat(parseDoubleLiteral(token.text.slice(0, token.text.length - 1 | 0))).withRange(token.range);
  });
  pratt.literal(TokenKind.DOUBLE, function(context, token) {
    return Node.createDouble(parseDoubleLiteral(token.text)).withRange(token.range);
  });
  pratt.literal(TokenKind.VAR, function(context, token) {
    return Node.createVar().withRange(token.range);
  });
  pratt.literal(TokenKind.STRING, function(context, token) {
    var result = parseStringLiteral(context.log, token.range, token.text);
    return Node.createString(result !== null ? result.value : "").withRange(token.range);
  });
  pratt.literal(TokenKind.CHARACTER, function(context, token) {
    var result = parseStringLiteral(context.log, token.range, token.text);
    if (result !== null && result.value.length !== 1) {
      syntaxErrorInvalidCharacter(context.log, token.range, token.text);
      result = null;
    }
    return Node.createInt(result !== null ? result.value.codeUnitAt(0) : 0).withRange(token.range);
  });
  pratt.postfix(TokenKind.INCREMENT, Precedence.UNARY_POSTFIX, unaryPostfix(NodeKind.POSTFIX_INCREMENT));
  pratt.postfix(TokenKind.DECREMENT, Precedence.UNARY_POSTFIX, unaryPostfix(NodeKind.POSTFIX_DECREMENT));
  pratt.prefix(TokenKind.INCREMENT, Precedence.UNARY_PREFIX, unaryPrefix(NodeKind.PREFIX_INCREMENT));
  pratt.prefix(TokenKind.DECREMENT, Precedence.UNARY_PREFIX, unaryPrefix(NodeKind.PREFIX_DECREMENT));
  pratt.prefix(TokenKind.PLUS, Precedence.UNARY_PREFIX, unaryPrefix(NodeKind.POSITIVE));
  pratt.prefix(TokenKind.MINUS, Precedence.UNARY_PREFIX, unaryPrefix(NodeKind.NEGATIVE));
  pratt.prefix(TokenKind.NOT, Precedence.UNARY_PREFIX, unaryPrefix(NodeKind.NOT));
  pratt.prefix(TokenKind.TILDE, Precedence.UNARY_PREFIX, unaryPrefix(NodeKind.COMPLEMENT));
  pratt.infix(TokenKind.BITWISE_AND, Precedence.BITWISE_AND, binaryInfix(NodeKind.BITWISE_AND));
  pratt.infix(TokenKind.BITWISE_OR, Precedence.BITWISE_OR, binaryInfix(NodeKind.BITWISE_OR));
  pratt.infix(TokenKind.BITWISE_XOR, Precedence.BITWISE_XOR, binaryInfix(NodeKind.BITWISE_XOR));
  pratt.infix(TokenKind.DIVIDE, Precedence.MULTIPLY, binaryInfix(NodeKind.DIVIDE));
  pratt.infix(TokenKind.EQUAL, Precedence.EQUAL, binaryInfix(NodeKind.EQUAL));
  pratt.infix(TokenKind.GREATER_THAN, Precedence.COMPARE, binaryInfix(NodeKind.GREATER_THAN));
  pratt.infix(TokenKind.GREATER_THAN_OR_EQUAL, Precedence.COMPARE, binaryInfix(NodeKind.GREATER_THAN_OR_EQUAL));
  pratt.infix(TokenKind.IN, Precedence.COMPARE, binaryInfix(NodeKind.IN));
  pratt.infix(TokenKind.LESS_THAN, Precedence.COMPARE, binaryInfix(NodeKind.LESS_THAN));
  pratt.infix(TokenKind.LESS_THAN_OR_EQUAL, Precedence.COMPARE, binaryInfix(NodeKind.LESS_THAN_OR_EQUAL));
  pratt.infix(TokenKind.LOGICAL_AND, Precedence.LOGICAL_AND, binaryInfix(NodeKind.LOGICAL_AND));
  pratt.infix(TokenKind.LOGICAL_OR, Precedence.LOGICAL_OR, binaryInfix(NodeKind.LOGICAL_OR));
  pratt.infix(TokenKind.MINUS, Precedence.ADD, binaryInfix(NodeKind.SUBTRACT));
  pratt.infix(TokenKind.MULTIPLY, Precedence.MULTIPLY, binaryInfix(NodeKind.MULTIPLY));
  pratt.infix(TokenKind.NOT_EQUAL, Precedence.EQUAL, binaryInfix(NodeKind.NOT_EQUAL));
  pratt.infix(TokenKind.PLUS, Precedence.ADD, binaryInfix(NodeKind.ADD));
  pratt.infix(TokenKind.REMAINDER, Precedence.MULTIPLY, binaryInfix(NodeKind.REMAINDER));
  pratt.infix(TokenKind.SHIFT_LEFT, Precedence.SHIFT, binaryInfix(NodeKind.SHIFT_LEFT));
  pratt.infix(TokenKind.SHIFT_RIGHT, Precedence.SHIFT, binaryInfix(NodeKind.SHIFT_RIGHT));
  pratt.infixRight(TokenKind.ASSIGN, Precedence.ASSIGN, binaryInfix(NodeKind.ASSIGN));
  pratt.infixRight(TokenKind.ASSIGN_PLUS, Precedence.ASSIGN, binaryInfix(NodeKind.ASSIGN_ADD));
  pratt.infixRight(TokenKind.ASSIGN_BITWISE_AND, Precedence.ASSIGN, binaryInfix(NodeKind.ASSIGN_BITWISE_AND));
  pratt.infixRight(TokenKind.ASSIGN_BITWISE_OR, Precedence.ASSIGN, binaryInfix(NodeKind.ASSIGN_BITWISE_OR));
  pratt.infixRight(TokenKind.ASSIGN_BITWISE_XOR, Precedence.ASSIGN, binaryInfix(NodeKind.ASSIGN_BITWISE_XOR));
  pratt.infixRight(TokenKind.ASSIGN_DIVIDE, Precedence.ASSIGN, binaryInfix(NodeKind.ASSIGN_DIVIDE));
  pratt.infixRight(TokenKind.ASSIGN_MULTIPLY, Precedence.ASSIGN, binaryInfix(NodeKind.ASSIGN_MULTIPLY));
  pratt.infixRight(TokenKind.ASSIGN_REMAINDER, Precedence.ASSIGN, binaryInfix(NodeKind.ASSIGN_REMAINDER));
  pratt.infixRight(TokenKind.ASSIGN_SHIFT_LEFT, Precedence.ASSIGN, binaryInfix(NodeKind.ASSIGN_SHIFT_LEFT));
  pratt.infixRight(TokenKind.ASSIGN_SHIFT_RIGHT, Precedence.ASSIGN, binaryInfix(NodeKind.ASSIGN_SHIFT_RIGHT));
  pratt.infixRight(TokenKind.ASSIGN_MINUS, Precedence.ASSIGN, binaryInfix(NodeKind.ASSIGN_SUBTRACT));
  pratt.parselet(TokenKind.LEFT_BRACE, Precedence.LOWEST).prefix = function(context) {
    var token = context.current();
    var $arguments = parseArgumentList(context, TokenKind.LEFT_BRACE, TokenKind.RIGHT_BRACE, AllowTrailingComma.TRAILING_COMMA);
    return Node.createInitializer($arguments).withRange(context.spanSince(token.range));
  };
  pratt.parselet(TokenKind.LEFT_PARENTHESIS, Precedence.LOWEST).prefix = function(context) {
    var token = context.current();
    var type = parseGroup(context, AllowLambda.LAMBDA_ALLOWED);
    if (type.kind === NodeKind.NAME && context.eat(TokenKind.LAMBDA)) {
      var block = parseLambdaBlock(context);
      return createLambdaFromNames([type], block).withRange(context.spanSince(token.range));
    }
    if (looksLikeLambdaArguments(type) && context.eat(TokenKind.LAMBDA)) {
      var block = parseLambdaBlock(context);
      return createLambdaFromNames(type.removeChildren(), block).withRange(context.spanSince(token.range));
    }
    if (looksLikeType(type)) {
      var value = pratt.parse(context, Precedence.UNARY_PREFIX);
      return Node.createCast(type, value).withRange(context.spanSince(token.range));
    }
    return type;
  };
  pratt.parselet(TokenKind.QUESTION_MARK, Precedence.ASSIGN).infix = function(context, left) {
    context.next();
    var middle = pratt.parse(context, Precedence.ASSIGN - 1 | 0);
    var right = context.expect(TokenKind.COLON) ? pratt.parse(context, Precedence.ASSIGN - 1 | 0) : Node.createError().withRange(context.spanSince(context.current().range));
    return Node.createHook(left, middle, right).withRange(context.spanSince(left.range));
  };
  pratt.parselet(TokenKind.COMMA, Precedence.COMMA).infix = function(context, left) {
    var values = [left];
    while (context.eat(TokenKind.COMMA)) {
      values.push(pratt.parse(context, Precedence.COMMA));
    }
    return Node.createSequence(values).withRange(context.spanSince(left.range));
  };
  pratt.parselet(TokenKind.DOT, Precedence.MEMBER).infix = function(context, left) {
    context.next();
    var name = parseName(context);
    return Node.createDot(left, name).withRange(context.spanSince(left.range));
  };
  pratt.parselet(TokenKind.DOT, Precedence.LOWEST).prefix = function(context) {
    var token = context.next();
    var name = parseName(context);
    return Node.createDot(null, name).withRange(context.spanSince(token.range));
  };
  pratt.parselet(TokenKind.FN, Precedence.MEMBER).infix = function(context, left) {
    if (!looksLikeType(left)) {
      context.unexpectedToken();
      context.next();
      return Node.createError().withRange(context.spanSince(left.range));
    }
    context.next();
    var $arguments = parseArgumentList(context, TokenKind.LEFT_PARENTHESIS, TokenKind.RIGHT_PARENTHESIS, AllowTrailingComma.TRAILING_COMMA);
    return Node.createFunctionType(left, $arguments).withRange(context.spanSince(left.range));
  };
  pratt.parselet(TokenKind.LEFT_PARENTHESIS, Precedence.UNARY_POSTFIX).infix = function(context, left) {
    var $arguments = parseArgumentList(context, TokenKind.LEFT_PARENTHESIS, TokenKind.RIGHT_PARENTHESIS, AllowTrailingComma.NO_TRAILING_COMMA);
    return Node.createCall(left, $arguments).withRange(context.spanSince(left.range));
  };
  pratt.parselet(TokenKind.LEFT_BRACKET, Precedence.UNARY_POSTFIX).infix = function(context, left) {
    context.next();
    var index = pratt.parse(context, Precedence.LOWEST);
    scanForToken(context, TokenKind.RIGHT_BRACKET, TokenScan.STOP_BEFORE_NEXT_STATEMENT);
    return Node.createBinary(NodeKind.INDEX, left, index).withRange(context.spanSince(left.range));
  };
  pratt.parselet(TokenKind.START_PARAMETER_LIST, Precedence.MEMBER).infix = function(context, left) {
    var token = context.next();
    var substitutions = parseTypeList(context, TokenKind.END_PARAMETER_LIST);
    if (!context.expect(TokenKind.END_PARAMETER_LIST)) {
      scanForToken(context, TokenKind.END_PARAMETER_LIST, TokenScan.STOP_BEFORE_NEXT_STATEMENT);
      return Node.createError().withRange(context.spanSince(token.range));
    }
    return Node.createParameterize(left, substitutions).withRange(context.spanSince(left.range));
  };
  pratt.parselet(TokenKind.DEFAULT, Precedence.UNARY_PREFIX).prefix = function(context) {
    var token = context.next();
    var type = parseGroup(context, AllowLambda.LAMBDA_NOT_ALLOWED);
    return (type === null ? Node.createError() : Node.createDefault(type)).withRange(context.spanSince(token.range));
  };
  pratt.parselet(TokenKind.IDENTIFIER, Precedence.LOWEST).prefix = function(context) {
    var token = context.next();
    var name = Node.createName(token.text).withRange(token.range);
    if (context.eat(TokenKind.LAMBDA)) {
      var block = parseLambdaBlock(context);
      return createLambdaFromNames([name], block).withRange(context.spanSince(token.range));
    }
    return name;
  };
  pratt.parselet(TokenKind.LAMBDA, Precedence.LOWEST).prefix = function(context) {
    var token = context.next();
    var block = parseLambdaBlock(context);
    return Node.createLambda([], block).withRange(context.spanSince(token.range));
  };
  pratt.parselet(TokenKind.NEW, Precedence.LOWEST).prefix = function(context) {
    context.unexpectedToken();
    context.next();
    return parseType(context);
  };
  var inParselet = pratt.parselet(TokenKind.IN, 0);
  pratt.parselet(TokenKind.LET, Precedence.LOWEST).prefix = function(context) {
    var token = context.next();
    var name = parseName(context);
    if (name === null || !context.expect(TokenKind.ASSIGN)) {
      return Node.createError().withRange(context.spanSince(token.range));
    }
    var initial = pratt.parseIgnoringParselet(context, Precedence.LOWEST, inParselet);
    var variable = Node.createVariable(name, Node.createVar(), initial).withRange(context.spanSince(token.range));
    if (NodeKind.isError(initial.kind) || !context.expect(TokenKind.IN)) {
      return Node.createError().withRange(context.spanSince(token.range));
    }
    var value = pratt.parse(context, Precedence.COMMA);
    return Node.createLet(variable, value).withRange(context.spanSince(token.range));
  };
  pratt.parselet(TokenKind.SUPER, Precedence.LOWEST).prefix = function(context) {
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
  if (!NodeKind.isUnaryOperator(kind)) {
    throw new Error("assert kind.isUnaryOperator(); (src/resolver/diagnostics.sk:230:3)");
  }
  log.error(range, "No unary operator ".append(operatorInfo.get(kind).text).append(" for ").append(typeToText(type)));
}
function semanticErrorNoBinaryOperator(log, range, kind, left, right) {
  if (!NodeKind.isBinaryOperator(kind)) {
    throw new Error("assert kind.isBinaryOperator(); (src/resolver/diagnostics.sk:235:3)");
  }
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
  result.set("export", SymbolFlag.EXPORT);
  result.set("final", SymbolFlag.FINAL);
  result.set("import", SymbolFlag.IMPORT);
  result.set("inline", SymbolFlag.INLINE);
  result.set("override", SymbolFlag.OVERRIDE);
  result.set("private", SymbolFlag.PRIVATE);
  result.set("protected", SymbolFlag.PROTECTED);
  result.set("public", SymbolFlag.PUBLIC);
  result.set("static", SymbolFlag.STATIC);
  result.set("virtual", SymbolFlag.VIRTUAL);
  return result;
}
function createSymbolFlagToName() {
  var result = new IntMap();
  result.set(SymbolFlag.EXPORT, "export");
  result.set(SymbolFlag.FINAL, "final");
  result.set(SymbolFlag.IMPORT, "import");
  result.set(SymbolFlag.INLINE, "inline");
  result.set(SymbolFlag.OVERRIDE, "override");
  result.set(SymbolFlag.PRIVATE, "private");
  result.set(SymbolFlag.PROTECTED, "protected");
  result.set(SymbolFlag.PUBLIC, "public");
  result.set(SymbolFlag.STATIC, "static");
  result.set(SymbolFlag.VIRTUAL, "virtual");
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
  if (node.kind === NodeKind.DOT) {
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
var operatorInfo = createOperatorMap();
Compiler.nativeLibrarySource = null;
Compiler.nativeLibraryFile = null;
var NATIVE_LIBRARY = "\nimport struct int { string toString(); }\nimport struct bool { string toString(); }\nimport struct float { string toString(); }\nimport struct double { string toString(); }\n\nimport struct string {\n  final int length;\n  string get(int index);\n  int codeUnitAt(int index);\n  string slice(int start, int end);\n  string append(string value);\n  int indexOf(string value);\n  int lastIndexOf(string value);\n  string join(List<string> values);\n  string toLowerCase();\n  string toUpperCase();\n  static string fromCodeUnit(int value);\n}\n\nimport class List<T> {\n  new();\n  final int length;\n  T get(int index);\n  void set(int index, T value);\n  void push(T value);\n  void unshift(T value);\n  void insert(int index, T value);\n  List<T> slice(int start, int end);\n  List<T> clone();\n  int indexOf(T value);\n  int lastIndexOf(T value);\n  T remove(int index);\n  T shift();\n  T pop();\n  void reverse();\n  void sort(int fn(T, T) callback);\n}\n\nimport class StringMap<T> {\n  new();\n  T get(string key);\n  T getOrDefault(string key, T defaultValue);\n  void set(string key, T value);\n  bool has(string key);\n  List<string> keys();\n  List<T> values();\n  StringMap<T> clone();\n}\n\nimport class IntMap<T> {\n  new();\n  T get(int key);\n  T getOrDefault(int key, T defaultValue);\n  void set(int key, T value);\n  bool has(int key);\n  List<int> keys();\n  List<T> values();\n  IntMap<T> clone();\n}\n\n// TODO: Rename this to \"math\" since namespaces should be lower case\nimport namespace Math {\n  final double E;\n  final double PI;\n  final double NAN;\n  final double INFINITY;\n  double random();\n  double abs(double n);\n  double sin(double n);\n  double cos(double n);\n  double tan(double n);\n  double asin(double n);\n  double acos(double n);\n  double atan(double n);\n  double round(double n);\n  double floor(double n);\n  double ceil(double n);\n  double exp(double n);\n  double log(double n);\n  double sqrt(double n);\n  bool isNaN(double n);\n  bool isFinite(double n);\n  double atan2(double y, double x);\n  double pow(double base, double exponent);\n  double min(double a, double b);\n  double max(double a, double b);\n  int imin(int a, int b);\n  int imax(int a, int b);\n}\n\n// TODO: Remove this\nimport class StringBuilder {\n  new();\n  StringBuilder append(string text);\n  string toString();\n}\n";
Range.EMPTY = new Range(null, 0, 0);
var BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var HEX = "0123456789ABCDEF";
js.Emitter.isKeyword = js.Emitter.createIsKeyword();
var yy_accept = [TokenKind.YY_INVALID_ACTION, TokenKind.YY_INVALID_ACTION, TokenKind.YY_INVALID_ACTION, TokenKind.END_OF_FILE, TokenKind.ERROR, TokenKind.WHITESPACE, TokenKind.NOT, TokenKind.ERROR, TokenKind.REMAINDER, TokenKind.BITWISE_AND, TokenKind.ERROR, TokenKind.LEFT_PARENTHESIS, TokenKind.RIGHT_PARENTHESIS, TokenKind.MULTIPLY, TokenKind.PLUS, TokenKind.COMMA, TokenKind.MINUS, TokenKind.DOT, TokenKind.DIVIDE, TokenKind.INT_DECIMAL, TokenKind.INT_DECIMAL, TokenKind.COLON, TokenKind.SEMICOLON, TokenKind.LESS_THAN, TokenKind.ASSIGN, TokenKind.GREATER_THAN, TokenKind.QUESTION_MARK, TokenKind.IDENTIFIER, TokenKind.LEFT_BRACKET, TokenKind.RIGHT_BRACKET, TokenKind.BITWISE_XOR, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.LEFT_BRACE, TokenKind.BITWISE_OR, TokenKind.RIGHT_BRACE, TokenKind.TILDE, TokenKind.WHITESPACE, TokenKind.NOT_EQUAL, TokenKind.YY_INVALID_ACTION, TokenKind.STRING, TokenKind.YY_INVALID_ACTION, TokenKind.ASSIGN_REMAINDER, TokenKind.LOGICAL_AND, TokenKind.ASSIGN_BITWISE_AND, TokenKind.YY_INVALID_ACTION, TokenKind.CHARACTER, TokenKind.YY_INVALID_ACTION, TokenKind.ASSIGN_MULTIPLY, TokenKind.INCREMENT, TokenKind.ASSIGN_PLUS, TokenKind.DECREMENT, TokenKind.ASSIGN_MINUS, TokenKind.WHITESPACE, TokenKind.ASSIGN_DIVIDE, TokenKind.YY_INVALID_ACTION, TokenKind.INT_DECIMAL, TokenKind.YY_INVALID_ACTION, TokenKind.FLOAT, TokenKind.YY_INVALID_ACTION, TokenKind.YY_INVALID_ACTION, TokenKind.SHIFT_LEFT, TokenKind.LESS_THAN_OR_EQUAL, TokenKind.EQUAL, TokenKind.LAMBDA, TokenKind.GREATER_THAN_OR_EQUAL, TokenKind.SHIFT_RIGHT, TokenKind.IDENTIFIER, TokenKind.ASSIGN_BITWISE_XOR, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.DO, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.FN, TokenKind.IDENTIFIER, TokenKind.IF, TokenKind.IDENTIFIER, TokenKind.IN, TokenKind.IS, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.ASSIGN_BITWISE_OR, TokenKind.LOGICAL_OR, TokenKind.WHITESPACE, TokenKind.DOUBLE, TokenKind.INT_BINARY, TokenKind.INT_OCTAL, TokenKind.INT_HEX, TokenKind.ASSIGN_SHIFT_LEFT, TokenKind.ASSIGN_SHIFT_RIGHT, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.FOR, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.LET, TokenKind.IDENTIFIER, TokenKind.NEW, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.VAR, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.FLOAT, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.CASE, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.ELSE, TokenKind.ENUM, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.NULL, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.THIS, TokenKind.TRUE, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.ALIAS, TokenKind.IDENTIFIER, TokenKind.BREAK, TokenKind.CLASS, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.FALSE, TokenKind.FINAL, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.SUPER, TokenKind.IDENTIFIER, TokenKind.USING, TokenKind.IDENTIFIER, TokenKind.WHILE, TokenKind.ASSERT, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.EXPORT, TokenKind.IMPORT, TokenKind.INLINE, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.PUBLIC, TokenKind.RETURN, TokenKind.STATIC, TokenKind.STRUCT, TokenKind.SWITCH, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.DEFAULT, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.PRIVATE, TokenKind.IDENTIFIER, TokenKind.VIRTUAL, TokenKind.CONTINUE, TokenKind.IDENTIFIER, TokenKind.IDENTIFIER, TokenKind.OVERRIDE, TokenKind.IDENTIFIER, TokenKind.INTERFACE, TokenKind.NAMESPACE, TokenKind.PROTECTED, TokenKind.YY_INVALID_ACTION];
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
  return result === (result | 0) ? result : NaN;
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
