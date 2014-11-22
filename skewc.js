(function() {
  var $imul = Math.imul || function(a, b) {
    var ah = a >>> 16, al = a & 65535, bh = b >>> 16, bl = b & 65535;
    return al * bl + (ah * bl + al * bh << 16) | 0;
  };
  function $extends(derived, base) {
    derived.prototype = Object.create(base.prototype);
    derived.prototype.constructor = derived;
  }
  var in_string = {};
  var in_List = {};
  function StringMap() {
    this.table = Object.create(null);
  }
  StringMap.prototype.get = function(key) {
    return this.table[key];
  };
  StringMap.prototype.getOrDefault = function(key, defaultValue) {
    return this.table[key] || defaultValue;
  };
  StringMap.prototype.set = function(key, value) {
    this.table[key] = value;
  };
  StringMap.prototype.has = function(key) {
    return key in this.table;
  };
  StringMap.prototype.remove = function(key) {
    delete this.table[key];
  };
  StringMap.prototype.values = function() {
    var values = [];
    for (var key in this.table) {
      values.push(this.get(key));
    }
    return values;
  };
  StringMap.prototype.clone = function() {
    var clone = new StringMap();
    for (var key in this.table) {
      clone.set(key, this.get(key));
    }
    return clone;
  };
  function IntMap() {
    this.table = Object.create(null);
  }
  IntMap.prototype.get = function(key) {
    return this.table[key];
  };
  IntMap.prototype.getOrDefault = function(key, defaultValue) {
    return this.table[key] || defaultValue;
  };
  IntMap.prototype.set = function(key, value) {
    this.table[key] = value;
  };
  IntMap.prototype.has = function(key) {
    return key in this.table;
  };
  var ContentType = {
    BOOL: 0,
    INT: 1,
    DOUBLE: 2,
    STRING: 3
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
        case 3:
          return left.value === right.value;
        }
      }
    }
    return false;
  };
  Content.prototype.asBool = function() {
    if (this.type() !== ContentType.BOOL) {
      throw new Error('assert type() == .BOOL; (src/ast/content.sk:28:5)');
    }
    return this.value;
  };
  Content.prototype.asInt = function() {
    if (this.type() !== ContentType.INT) {
      throw new Error('assert type() == .INT; (src/ast/content.sk:33:5)');
    }
    return this.value;
  };
  Content.prototype.asDouble = function() {
    if (this.type() !== ContentType.DOUBLE) {
      throw new Error('assert type() == .DOUBLE; (src/ast/content.sk:38:5)');
    }
    return this.value;
  };
  Content.prototype.asString = function() {
    if (this.type() !== ContentType.STRING) {
      throw new Error('assert type() == .STRING; (src/ast/content.sk:43:5)');
    }
    return this.value;
  };
  function BoolContent(_0) {
    Content.call(this);
    this.value = _0;
  }
  $extends(BoolContent, Content);
  BoolContent.prototype.type = function() {
    return ContentType.BOOL;
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
  Node.prototype.isTrue = function() {
    return this.kind === NodeKind.BOOL && this.asBool();
  };
  Node.prototype.isFalse = function() {
    return this.kind === NodeKind.BOOL && !this.asBool();
  };
  Node.prototype.asBool = function() {
    if (this.kind !== NodeKind.BOOL) {
      throw new Error('assert kind == .BOOL; (src/ast/content.sk:90:5)');
    }
    return this.content.asBool();
  };
  Node.prototype.asInt = function() {
    if (this.kind !== NodeKind.INT) {
      throw new Error('assert kind == .INT; (src/ast/content.sk:95:5)');
    }
    return this.content.asInt();
  };
  Node.prototype.asDouble = function() {
    if (!in_NodeKind.isReal(this.kind)) {
      throw new Error('assert kind.isReal(); (src/ast/content.sk:100:5)');
    }
    return this.content.asDouble();
  };
  Node.prototype.asString = function() {
    if (this.kind !== NodeKind.NAME && this.kind !== NodeKind.STRING) {
      throw new Error('assert kind == .NAME || kind == .STRING; (src/ast/content.sk:105:5)');
    }
    return this.content.asString();
  };
  Node.createProgram = function(files) {
    if (!checkAllNodeKinds(files, new NodeKindIs(NodeKind.FILE))) {
      throw new Error('assert checkAllNodeKinds(files, NodeKindIs(.FILE)); (src/ast/create.sk:3:5)');
    }
    return new Node(NodeKind.PROGRAM).withChildren(files);
  };
  Node.createFile = function(block) {
    if (block.kind !== NodeKind.BLOCK) {
      throw new Error('assert block.kind == .BLOCK; (src/ast/create.sk:8:5)');
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
      throw new Error('assert checkAllNodeKinds(values, NodeKindIsExpression()); (src/ast/create.sk:21:5)');
    }
    if (block.kind !== NodeKind.BLOCK) {
      throw new Error('assert block.kind == .BLOCK; (src/ast/create.sk:22:5)');
    }
    values.push(block);
    return new Node(NodeKind.CASE).withChildren(values);
  };
  Node.createVariableCluster = function(type, variables) {
    if (!in_NodeKind.isExpression(type.kind)) {
      throw new Error('assert type.kind.isExpression(); (src/ast/create.sk:28:5)');
    }
    if (!checkAllNodeKinds(variables, new NodeKindIs(NodeKind.VARIABLE))) {
      throw new Error('assert checkAllNodeKinds(variables, NodeKindIs(.VARIABLE)); (src/ast/create.sk:29:5)');
    }
    variables.unshift(type);
    return new Node(NodeKind.VARIABLE_CLUSTER).withChildren(variables);
  };
  Node.createMemberInitializer = function(name, value) {
    if (name.kind !== NodeKind.NAME) {
      throw new Error('assert name.kind == .NAME; (src/ast/create.sk:35:5)');
    }
    if (!in_NodeKind.isExpression(value.kind)) {
      throw new Error('assert value.kind.isExpression(); (src/ast/create.sk:36:5)');
    }
    return new Node(NodeKind.MEMBER_INITIALIZER).withChildren([name, value]);
  };
  Node.createNamespace = function(name, block) {
    if (name !== null && name.kind !== NodeKind.NAME) {
      throw new Error('assert name == null || name.kind == .NAME; (src/ast/create.sk:41:5)');
    }
    if (block.kind !== NodeKind.BLOCK) {
      throw new Error('assert block.kind == .BLOCK; (src/ast/create.sk:42:5)');
    }
    return new Node(NodeKind.NAMESPACE).withChildren([name, block]);
  };
  Node.createEnum = function(name, block) {
    if (name.kind !== NodeKind.NAME) {
      throw new Error('assert name.kind == .NAME; (src/ast/create.sk:47:5)');
    }
    if (block.kind !== NodeKind.BLOCK) {
      throw new Error('assert block.kind == .BLOCK; (src/ast/create.sk:48:5)');
    }
    return new Node(NodeKind.ENUM).withChildren([name, block]);
  };
  Node.createEnumFlags = function(name, block) {
    if (name.kind !== NodeKind.NAME) {
      throw new Error('assert name.kind == .NAME; (src/ast/create.sk:53:5)');
    }
    if (block.kind !== NodeKind.BLOCK) {
      throw new Error('assert block.kind == .BLOCK; (src/ast/create.sk:54:5)');
    }
    return new Node(NodeKind.ENUM_FLAGS).withChildren([name, block]);
  };
  Node.createObject = function(kind, name, parameters, bases, block) {
    if (!in_NodeKind.isObject(kind)) {
      throw new Error('assert kind.isObject(); (src/ast/create.sk:59:5)');
    }
    if (name.kind !== NodeKind.NAME) {
      throw new Error('assert name.kind == .NAME; (src/ast/create.sk:60:5)');
    }
    if (parameters !== null && !checkAllNodeListKinds(parameters, new NodeKindIs(NodeKind.PARAMETER))) {
      throw new Error('assert parameters == null || checkAllNodeListKinds(parameters, NodeKindIs(.PARAMETER)); (src/ast/create.sk:61:5)');
    }
    if (bases !== null && !checkAllNodeListKinds(bases, new NodeKindIsExpression())) {
      throw new Error('assert bases == null || checkAllNodeListKinds(bases, NodeKindIsExpression()); (src/ast/create.sk:62:5)');
    }
    if (block.kind !== NodeKind.BLOCK) {
      throw new Error('assert block.kind == .BLOCK; (src/ast/create.sk:63:5)');
    }
    return new Node(kind).withChildren([name, block, bases, parameters]);
  };
  Node.createExtension = function(name, bases, block) {
    if (name.kind !== NodeKind.NAME) {
      throw new Error('assert name.kind == .NAME; (src/ast/create.sk:76:5)');
    }
    if (bases !== null && !checkAllNodeListKinds(bases, new NodeKindIsExpression())) {
      throw new Error('assert bases == null || checkAllNodeListKinds(bases, NodeKindIsExpression()); (src/ast/create.sk:77:5)');
    }
    if (block.kind !== NodeKind.BLOCK) {
      throw new Error('assert block.kind == .BLOCK; (src/ast/create.sk:78:5)');
    }
    return new Node(NodeKind.EXTENSION).withChildren([name, block, bases]);
  };
  Node.createConstructor = function(name, $arguments, block, superInitializer, memberInitializers) {
    if (name.kind !== NodeKind.NAME) {
      throw new Error('assert name.kind == .NAME; (src/ast/create.sk:83:5)');
    }
    if (!checkAllNodeListKinds($arguments, new NodeKindIs(NodeKind.VARIABLE))) {
      throw new Error('assert checkAllNodeListKinds(arguments, NodeKindIs(.VARIABLE)); (src/ast/create.sk:84:5)');
    }
    if (block !== null && block.kind !== NodeKind.BLOCK) {
      throw new Error('assert block == null || block.kind == .BLOCK; (src/ast/create.sk:85:5)');
    }
    if (superInitializer !== null && superInitializer.kind !== NodeKind.SUPER_CALL) {
      throw new Error('assert superInitializer == null || superInitializer.kind == .SUPER_CALL; (src/ast/create.sk:86:5)');
    }
    if (memberInitializers !== null && !checkAllNodeListKinds(memberInitializers, new NodeKindIs(NodeKind.MEMBER_INITIALIZER))) {
      throw new Error('assert memberInitializers == null || checkAllNodeListKinds(memberInitializers, NodeKindIs(.MEMBER_INITIALIZER)); (src/ast/create.sk:87:5)');
    }
    return new Node(NodeKind.CONSTRUCTOR).withChildren([name, $arguments, block, superInitializer, memberInitializers]);
  };
  Node.createFunction = function(name, $arguments, block, result, parameters) {
    if (name.kind !== NodeKind.NAME) {
      throw new Error('assert name.kind == .NAME; (src/ast/create.sk:92:5)');
    }
    if (!checkAllNodeListKinds($arguments, new NodeKindIs(NodeKind.VARIABLE))) {
      throw new Error('assert checkAllNodeListKinds(arguments, NodeKindIs(.VARIABLE)); (src/ast/create.sk:93:5)');
    }
    if (block !== null && block.kind !== NodeKind.BLOCK) {
      throw new Error('assert block == null || block.kind == .BLOCK; (src/ast/create.sk:94:5)');
    }
    if (!in_NodeKind.isExpression(result.kind)) {
      throw new Error('assert result.kind.isExpression(); (src/ast/create.sk:95:5)');
    }
    if (parameters !== null && !checkAllNodeListKinds(parameters, new NodeKindIs(NodeKind.PARAMETER))) {
      throw new Error('assert parameters == null || checkAllNodeListKinds(parameters, NodeKindIs(.PARAMETER)); (src/ast/create.sk:96:5)');
    }
    return new Node(NodeKind.FUNCTION).withChildren([name, $arguments, block, result, parameters]);
  };
  Node.createVariable = function(name, type, value) {
    if (name.kind !== NodeKind.NAME) {
      throw new Error('assert name.kind == .NAME; (src/ast/create.sk:101:5)');
    }
    if (type !== null && !in_NodeKind.isExpression(type.kind)) {
      throw new Error('assert type == null || type.kind.isExpression(); (src/ast/create.sk:102:5)');
    }
    if (value !== null && !in_NodeKind.isExpression(value.kind)) {
      throw new Error('assert value == null || value.kind.isExpression(); (src/ast/create.sk:103:5)');
    }
    return new Node(NodeKind.VARIABLE).withChildren([name, type, value]);
  };
  Node.createParameter = function(name, bound) {
    if (name.kind !== NodeKind.NAME) {
      throw new Error('assert name.kind == .NAME; (src/ast/create.sk:108:5)');
    }
    if (bound !== null && !in_NodeKind.isExpression(bound.kind)) {
      throw new Error('assert bound == null || bound.kind.isExpression(); (src/ast/create.sk:109:5)');
    }
    return new Node(NodeKind.PARAMETER).withChildren([name, bound]);
  };
  Node.createAlias = function(name, value) {
    if (name.kind !== NodeKind.NAME) {
      throw new Error('assert name.kind == .NAME; (src/ast/create.sk:114:5)');
    }
    if (!in_NodeKind.isExpression(value.kind)) {
      throw new Error('assert value.kind.isExpression(); (src/ast/create.sk:115:5)');
    }
    return new Node(NodeKind.ALIAS).withChildren([name, value]);
  };
  Node.createUsing = function(value) {
    if (!in_NodeKind.isExpression(value.kind)) {
      throw new Error('assert value.kind.isExpression(); (src/ast/create.sk:120:5)');
    }
    return new Node(NodeKind.USING).withChildren([value]);
  };
  Node.createIf = function(test, trueNode, falseNode) {
    if (!in_NodeKind.isExpression(test.kind)) {
      throw new Error('assert test.kind.isExpression(); (src/ast/create.sk:125:5)');
    }
    if (trueNode.kind !== NodeKind.BLOCK) {
      throw new Error('assert trueNode.kind == .BLOCK; (src/ast/create.sk:126:5)');
    }
    if (falseNode !== null && falseNode.kind !== NodeKind.BLOCK) {
      throw new Error('assert falseNode == null || falseNode.kind == .BLOCK; (src/ast/create.sk:127:5)');
    }
    return new Node(NodeKind.IF).withChildren([test, trueNode, falseNode]);
  };
  Node.createFor = function(setup, test, update, block) {
    if (setup !== null && !in_NodeKind.isExpression(setup.kind) && setup.kind !== NodeKind.VARIABLE_CLUSTER) {
      throw new Error('assert setup == null || setup.kind.isExpression() || setup.kind == .VARIABLE_CLUSTER; (src/ast/create.sk:132:5)');
    }
    if (test !== null && !in_NodeKind.isExpression(test.kind)) {
      throw new Error('assert test == null || test.kind.isExpression(); (src/ast/create.sk:133:5)');
    }
    if (update !== null && !in_NodeKind.isExpression(update.kind)) {
      throw new Error('assert update == null || update.kind.isExpression(); (src/ast/create.sk:134:5)');
    }
    if (block.kind !== NodeKind.BLOCK) {
      throw new Error('assert block.kind == .BLOCK; (src/ast/create.sk:135:5)');
    }
    return new Node(NodeKind.FOR).withChildren([setup, test, update, block]);
  };
  Node.createForEach = function(variable, value, block) {
    if (variable.kind !== NodeKind.VARIABLE) {
      throw new Error('assert variable.kind == .VARIABLE; (src/ast/create.sk:140:5)');
    }
    if (!in_NodeKind.isExpression(value.kind)) {
      throw new Error('assert value.kind.isExpression(); (src/ast/create.sk:141:5)');
    }
    if (block.kind !== NodeKind.BLOCK) {
      throw new Error('assert block.kind == .BLOCK; (src/ast/create.sk:142:5)');
    }
    return new Node(NodeKind.FOR_EACH).withChildren([variable, value, block]);
  };
  Node.createWhile = function(test, block) {
    if (!in_NodeKind.isExpression(test.kind)) {
      throw new Error('assert test.kind.isExpression(); (src/ast/create.sk:147:5)');
    }
    if (block.kind !== NodeKind.BLOCK) {
      throw new Error('assert block.kind == .BLOCK; (src/ast/create.sk:148:5)');
    }
    return new Node(NodeKind.WHILE).withChildren([test, block]);
  };
  Node.createDoWhile = function(block, test) {
    if (test !== null && !in_NodeKind.isExpression(test.kind)) {
      throw new Error('assert test == null || test.kind.isExpression(); (src/ast/create.sk:153:5)');
    }
    if (block.kind !== NodeKind.BLOCK) {
      throw new Error('assert block.kind == .BLOCK; (src/ast/create.sk:154:5)');
    }
    return new Node(NodeKind.DO_WHILE).withChildren([test, block]);
  };
  Node.createReturn = function(value) {
    if (value !== null && !in_NodeKind.isExpression(value.kind)) {
      throw new Error('assert value == null || value.kind.isExpression(); (src/ast/create.sk:159:5)');
    }
    return new Node(NodeKind.RETURN).withChildren([value]);
  };
  Node.createBreak = function() {
    return new Node(NodeKind.BREAK);
  };
  Node.createContinue = function() {
    return new Node(NodeKind.CONTINUE);
  };
  Node.createAssert = function(kind, value) {
    if (kind !== NodeKind.ASSERT && kind !== NodeKind.ASSERT_CONST) {
      throw new Error('assert kind == .ASSERT || kind == .ASSERT_CONST; (src/ast/create.sk:172:5)');
    }
    if (!in_NodeKind.isExpression(value.kind)) {
      throw new Error('assert value.kind.isExpression(); (src/ast/create.sk:173:5)');
    }
    return new Node(kind).withChildren([value]);
  };
  Node.createExpression = function(value) {
    if (!in_NodeKind.isExpression(value.kind)) {
      throw new Error('assert value.kind.isExpression(); (src/ast/create.sk:178:5)');
    }
    return new Node(NodeKind.EXPRESSION).withChildren([value]);
  };
  Node.createModifier = function(name, statements) {
    if (name.kind !== NodeKind.NAME) {
      throw new Error('assert name.kind == .NAME; (src/ast/create.sk:183:5)');
    }
    if (!checkAllNodeKinds(statements, new NodeKindIsStatement())) {
      throw new Error('assert checkAllNodeKinds(statements, NodeKindIsStatement()); (src/ast/create.sk:184:5)');
    }
    statements.unshift(name);
    return new Node(NodeKind.MODIFIER).withChildren(statements);
  };
  Node.createSwitch = function(value, cases) {
    if (!in_NodeKind.isExpression(value.kind)) {
      throw new Error('assert value.kind.isExpression(); (src/ast/create.sk:190:5)');
    }
    if (!checkAllNodeKinds(cases, new NodeKindIs(NodeKind.CASE))) {
      throw new Error('assert checkAllNodeKinds(cases, NodeKindIs(.CASE)); (src/ast/create.sk:191:5)');
    }
    cases.unshift(value);
    return new Node(NodeKind.SWITCH).withChildren(cases);
  };
  Node.createName = function(name) {
    return new Node(NodeKind.NAME).withContent(new StringContent(name));
  };
  Node.createType = function(type) {
    if (type === null) {
      throw new Error('assert type != null; (src/ast/create.sk:201:5)');
    }
    return new Node(NodeKind.TYPE).withType(type);
  };
  Node.createNull = function() {
    return new Node(NodeKind.NULL);
  };
  Node.createThis = function() {
    return new Node(NodeKind.THIS);
  };
  Node.createHook = function(test, trueNode, falseNode) {
    if (!in_NodeKind.isExpression(test.kind)) {
      throw new Error('assert test.kind.isExpression(); (src/ast/create.sk:214:5)');
    }
    if (!in_NodeKind.isExpression(trueNode.kind)) {
      throw new Error('assert trueNode.kind.isExpression(); (src/ast/create.sk:215:5)');
    }
    if (!in_NodeKind.isExpression(falseNode.kind)) {
      throw new Error('assert falseNode.kind.isExpression(); (src/ast/create.sk:216:5)');
    }
    return new Node(NodeKind.HOOK).withChildren([test, trueNode, falseNode]);
  };
  Node.createBool = function(value) {
    return new Node(NodeKind.BOOL).withContent(new BoolContent(value));
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
  Node.createList = function(values) {
    if (!checkAllNodeKinds(values, new NodeKindIsExpression())) {
      throw new Error('assert checkAllNodeKinds(values, NodeKindIsExpression()); (src/ast/create.sk:241:5)');
    }
    return new Node(NodeKind.LIST).withChildren(values);
  };
  Node.createDot = function(value, name) {
    if (value !== null && !in_NodeKind.isExpression(value.kind)) {
      throw new Error('assert value == null || value.kind.isExpression(); (src/ast/create.sk:246:5)');
    }
    if (name !== null && name.kind !== NodeKind.NAME) {
      throw new Error('assert name == null || name.kind == .NAME; (src/ast/create.sk:247:5)');
    }
    return new Node(NodeKind.DOT).withChildren([value, name]);
  };
  Node.createCall = function(value, $arguments) {
    if (!in_NodeKind.isExpression(value.kind)) {
      throw new Error('assert value.kind.isExpression(); (src/ast/create.sk:252:5)');
    }
    if (!checkAllNodeKinds($arguments, new NodeKindIsExpression())) {
      throw new Error('assert checkAllNodeKinds(arguments, NodeKindIsExpression()); (src/ast/create.sk:253:5)');
    }
    $arguments.unshift(value);
    return new Node(NodeKind.CALL).withChildren($arguments);
  };
  Node.createSuperCall = function($arguments) {
    if (!checkAllNodeKinds($arguments, new NodeKindIsExpression())) {
      throw new Error('assert checkAllNodeKinds(arguments, NodeKindIsExpression()); (src/ast/create.sk:259:5)');
    }
    return new Node(NodeKind.SUPER_CALL).withChildren($arguments);
  };
  Node.createError = function() {
    return new Node(NodeKind.ERROR);
  };
  Node.createSequence = function(values) {
    if (!checkAllNodeKinds(values, new NodeKindIsExpression())) {
      throw new Error('assert checkAllNodeKinds(values, NodeKindIsExpression()); (src/ast/create.sk:271:5)');
    }
    return new Node(NodeKind.SEQUENCE).withChildren(values);
  };
  Node.createParameterize = function(type, types) {
    if (!in_NodeKind.isExpression(type.kind)) {
      throw new Error('assert type.kind.isExpression(); (src/ast/create.sk:276:5)');
    }
    if (!checkAllNodeKinds(types, new NodeKindIsExpression())) {
      throw new Error('assert checkAllNodeKinds(types, NodeKindIsExpression()); (src/ast/create.sk:277:5)');
    }
    types.unshift(type);
    return new Node(NodeKind.PARAMETERIZE).withChildren(types);
  };
  Node.createCast = function(type, value) {
    if (!in_NodeKind.isExpression(type.kind)) {
      throw new Error('assert type.kind.isExpression(); (src/ast/create.sk:283:5)');
    }
    if (!in_NodeKind.isExpression(value.kind)) {
      throw new Error('assert value.kind.isExpression(); (src/ast/create.sk:284:5)');
    }
    return new Node(NodeKind.CAST).withChildren([type, value]);
  };
  Node.createImplicitCast = function(type, value) {
    if (!in_NodeKind.isExpression(type.kind)) {
      throw new Error('assert type.kind.isExpression(); (src/ast/create.sk:289:5)');
    }
    if (!in_NodeKind.isExpression(value.kind)) {
      throw new Error('assert value.kind.isExpression(); (src/ast/create.sk:290:5)');
    }
    return new Node(NodeKind.IMPLICIT_CAST).withChildren([type, value]);
  };
  Node.createUntyped = function(type) {
    if (!in_NodeKind.isExpression(type.kind)) {
      throw new Error('assert type.kind.isExpression(); (src/ast/create.sk:298:5)');
    }
    return new Node(NodeKind.UNTYPED).withChildren([type]);
  };
  Node.createVar = function() {
    return new Node(NodeKind.VAR);
  };
  Node.createUnary = function(kind, value) {
    if (!in_NodeKind.isUnaryOperator(kind)) {
      throw new Error('assert kind.isUnaryOperator(); (src/ast/create.sk:307:5)');
    }
    if (!in_NodeKind.isExpression(value.kind)) {
      throw new Error('assert value.kind.isExpression(); (src/ast/create.sk:308:5)');
    }
    return new Node(kind).withChildren([value]);
  };
  Node.createBinary = function(kind, left, right) {
    if (!in_NodeKind.isBinaryOperator(kind)) {
      throw new Error('assert kind.isBinaryOperator(); (src/ast/create.sk:317:5)');
    }
    if (!in_NodeKind.isExpression(left.kind)) {
      throw new Error('assert left.kind.isExpression(); (src/ast/create.sk:318:5)');
    }
    if (!in_NodeKind.isExpression(right.kind)) {
      throw new Error('assert right.kind.isExpression(); (src/ast/create.sk:319:5)');
    }
    if (kind === NodeKind.ASSIGN && left.kind === NodeKind.INDEX) {
      var target = left.binaryLeft();
      var index = left.binaryRight();
      return Node.createTernary(NodeKind.ASSIGN_INDEX, target.remove(), index.remove(), right);
    }
    return new Node(kind).withChildren([left, right]);
  };
  Node.createTernary = function(kind, left, middle, right) {
    if (!in_NodeKind.isTernaryOperator(kind)) {
      throw new Error('assert kind.isTernaryOperator(); (src/ast/create.sk:332:5)');
    }
    if (!in_NodeKind.isExpression(left.kind)) {
      throw new Error('assert left.kind.isExpression(); (src/ast/create.sk:333:5)');
    }
    if (!in_NodeKind.isExpression(middle.kind)) {
      throw new Error('assert middle.kind.isExpression(); (src/ast/create.sk:334:5)');
    }
    if (!in_NodeKind.isExpression(right.kind)) {
      throw new Error('assert right.kind.isExpression(); (src/ast/create.sk:335:5)');
    }
    return new Node(kind).withChildren([left, middle, right]);
  };
  Node.prototype.blockStatements = function() {
    if (this.kind !== NodeKind.BLOCK) {
      throw new Error('assert kind == .BLOCK; (src/ast/get.sk:3:5)');
    }
    if (this.children === null) {
      throw new Error('assert children != null; (src/ast/get.sk:4:5)');
    }
    return this.children;
  };
  Node.prototype.blockStatement = function() {
    if (this.kind !== NodeKind.BLOCK) {
      throw new Error('assert kind == .BLOCK; (src/ast/get.sk:9:5)');
    }
    if (this.children === null) {
      throw new Error('assert children != null; (src/ast/get.sk:10:5)');
    }
    return this.children.length === 1 ? this.children[0] : null;
  };
  Node.prototype.fileBlock = function() {
    if (this.kind !== NodeKind.FILE) {
      throw new Error('assert kind == .FILE; (src/ast/get.sk:15:5)');
    }
    if (this.children.length !== 1) {
      throw new Error('assert children.size() == 1; (src/ast/get.sk:16:5)');
    }
    return this.children[0];
  };
  Node.prototype.dotTarget = function() {
    if (this.kind !== NodeKind.DOT) {
      throw new Error('assert kind == .DOT; (src/ast/get.sk:21:5)');
    }
    if (this.children.length !== 2) {
      throw new Error('assert children.size() == 2; (src/ast/get.sk:22:5)');
    }
    return this.children[0];
  };
  Node.prototype.dotName = function() {
    if (this.kind !== NodeKind.DOT) {
      throw new Error('assert kind == .DOT; (src/ast/get.sk:27:5)');
    }
    if (this.children.length !== 2) {
      throw new Error('assert children.size() == 2; (src/ast/get.sk:28:5)');
    }
    if (this.children[1] !== null && this.children[1].kind !== NodeKind.NAME) {
      throw new Error('assert children.get(1) == null || children.get(1).kind == .NAME; (src/ast/get.sk:29:5)');
    }
    return this.children[1];
  };
  Node.prototype.unaryValue = function() {
    if (!in_NodeKind.isUnaryOperator(this.kind)) {
      throw new Error('assert kind.isUnaryOperator(); (src/ast/get.sk:34:5)');
    }
    if (this.children.length !== 1) {
      throw new Error('assert children.size() == 1; (src/ast/get.sk:35:5)');
    }
    return this.children[0];
  };
  Node.prototype.binaryLeft = function() {
    if (!in_NodeKind.isBinaryOperator(this.kind)) {
      throw new Error('assert kind.isBinaryOperator(); (src/ast/get.sk:40:5)');
    }
    if (this.children.length !== 2) {
      throw new Error('assert children.size() == 2; (src/ast/get.sk:41:5)');
    }
    return this.children[0];
  };
  Node.prototype.binaryRight = function() {
    if (!in_NodeKind.isBinaryOperator(this.kind)) {
      throw new Error('assert kind.isBinaryOperator(); (src/ast/get.sk:46:5)');
    }
    if (this.children.length !== 2) {
      throw new Error('assert children.size() == 2; (src/ast/get.sk:47:5)');
    }
    return this.children[1];
  };
  Node.prototype.ternaryLeft = function() {
    if (!in_NodeKind.isTernaryOperator(this.kind)) {
      throw new Error('assert kind.isTernaryOperator(); (src/ast/get.sk:52:5)');
    }
    if (this.children.length !== 3) {
      throw new Error('assert children.size() == 3; (src/ast/get.sk:53:5)');
    }
    return this.children[0];
  };
  Node.prototype.ternaryMiddle = function() {
    if (!in_NodeKind.isTernaryOperator(this.kind)) {
      throw new Error('assert kind.isTernaryOperator(); (src/ast/get.sk:58:5)');
    }
    if (this.children.length !== 3) {
      throw new Error('assert children.size() == 3; (src/ast/get.sk:59:5)');
    }
    return this.children[1];
  };
  Node.prototype.ternaryRight = function() {
    if (!in_NodeKind.isTernaryOperator(this.kind)) {
      throw new Error('assert kind.isTernaryOperator(); (src/ast/get.sk:64:5)');
    }
    if (this.children.length !== 3) {
      throw new Error('assert children.size() == 3; (src/ast/get.sk:65:5)');
    }
    return this.children[2];
  };
  Node.prototype.hookTest = function() {
    if (this.kind !== NodeKind.HOOK) {
      throw new Error('assert kind == .HOOK; (src/ast/get.sk:70:5)');
    }
    if (this.children.length !== 3) {
      throw new Error('assert children.size() == 3; (src/ast/get.sk:71:5)');
    }
    return this.children[0];
  };
  Node.prototype.hookTrue = function() {
    if (this.kind !== NodeKind.HOOK) {
      throw new Error('assert kind == .HOOK; (src/ast/get.sk:76:5)');
    }
    if (this.children.length !== 3) {
      throw new Error('assert children.size() == 3; (src/ast/get.sk:77:5)');
    }
    return this.children[1];
  };
  Node.prototype.hookFalse = function() {
    if (this.kind !== NodeKind.HOOK) {
      throw new Error('assert kind == .HOOK; (src/ast/get.sk:82:5)');
    }
    if (this.children.length !== 3) {
      throw new Error('assert children.size() == 3; (src/ast/get.sk:83:5)');
    }
    return this.children[2];
  };
  Node.prototype.declarationName = function() {
    if (!in_NodeKind.isNamedDeclaration(this.kind)) {
      throw new Error('assert kind.isNamedDeclaration(); (src/ast/get.sk:88:5)');
    }
    if (!(this.children.length >= 1)) {
      throw new Error('assert children.size() >= 1; (src/ast/get.sk:89:5)');
    }
    if (this.children[0] !== null && this.children[0].kind !== NodeKind.NAME) {
      throw new Error('assert children.get(0) == null || children.get(0).kind == .NAME; (src/ast/get.sk:90:5)');
    }
    return this.children[0];
  };
  Node.prototype.declarationBlock = function() {
    if (!in_NodeKind.isNamedBlockDeclaration(this.kind)) {
      throw new Error('assert kind.isNamedBlockDeclaration(); (src/ast/get.sk:95:5)');
    }
    if (!(this.children.length >= 2)) {
      throw new Error('assert children.size() >= 2; (src/ast/get.sk:96:5)');
    }
    if (this.children[1].kind !== NodeKind.BLOCK) {
      throw new Error('assert children.get(1).kind == .BLOCK; (src/ast/get.sk:97:5)');
    }
    return this.children[1];
  };
  Node.prototype.clusterType = function() {
    if (this.kind !== NodeKind.VARIABLE_CLUSTER) {
      throw new Error('assert kind == .VARIABLE_CLUSTER; (src/ast/get.sk:102:5)');
    }
    if (!(this.children.length >= 1)) {
      throw new Error('assert children.size() >= 1; (src/ast/get.sk:103:5)');
    }
    return this.children[0];
  };
  Node.prototype.clusterVariables = function() {
    if (this.kind !== NodeKind.VARIABLE_CLUSTER) {
      throw new Error('assert kind == .VARIABLE_CLUSTER; (src/ast/get.sk:108:5)');
    }
    if (!(this.children.length >= 1)) {
      throw new Error('assert children.size() >= 1; (src/ast/get.sk:109:5)');
    }
    return this.children.slice(1, this.children.length);
  };
  Node.prototype.variableType = function() {
    if (this.kind !== NodeKind.VARIABLE) {
      throw new Error('assert kind == .VARIABLE; (src/ast/get.sk:114:5)');
    }
    if (this.children.length !== 3) {
      throw new Error('assert children.size() == 3; (src/ast/get.sk:115:5)');
    }
    return this.children[1];
  };
  Node.prototype.variableValue = function() {
    if (this.kind !== NodeKind.VARIABLE) {
      throw new Error('assert kind == .VARIABLE; (src/ast/get.sk:120:5)');
    }
    if (this.children.length !== 3) {
      throw new Error('assert children.size() == 3; (src/ast/get.sk:121:5)');
    }
    return this.children[2];
  };
  Node.prototype.aliasValue = function() {
    if (this.kind !== NodeKind.ALIAS) {
      throw new Error('assert kind == .ALIAS; (src/ast/get.sk:126:5)');
    }
    if (this.children.length !== 2) {
      throw new Error('assert children.size() == 2; (src/ast/get.sk:127:5)');
    }
    return this.children[1];
  };
  Node.prototype.usingValue = function() {
    if (this.kind !== NodeKind.USING) {
      throw new Error('assert kind == .USING; (src/ast/get.sk:132:5)');
    }
    if (this.children.length !== 1) {
      throw new Error('assert children.size() == 1; (src/ast/get.sk:133:5)');
    }
    return this.children[0];
  };
  Node.prototype.modifierName = function() {
    if (this.kind !== NodeKind.MODIFIER) {
      throw new Error('assert kind == .MODIFIER; (src/ast/get.sk:138:5)');
    }
    if (this.children.length !== 2) {
      throw new Error('assert children.size() == 2; (src/ast/get.sk:139:5)');
    }
    if (this.children[0].kind !== NodeKind.NAME) {
      throw new Error('assert children.get(0).kind == .NAME; (src/ast/get.sk:140:5)');
    }
    return this.children[0];
  };
  Node.prototype.modifierStatements = function() {
    if (this.kind !== NodeKind.MODIFIER) {
      throw new Error('assert kind == .MODIFIER; (src/ast/get.sk:145:5)');
    }
    if (!(this.children.length >= 1)) {
      throw new Error('assert children.size() >= 1; (src/ast/get.sk:146:5)');
    }
    return this.children.slice(1, this.children.length);
  };
  Node.prototype.sequenceValues = function() {
    if (this.kind !== NodeKind.SEQUENCE) {
      throw new Error('assert kind == .SEQUENCE; (src/ast/get.sk:151:5)');
    }
    if (this.children === null) {
      throw new Error('assert children != null; (src/ast/get.sk:152:5)');
    }
    return this.children;
  };
  Node.prototype.castType = function() {
    if (!in_NodeKind.isCast(this.kind)) {
      throw new Error('assert kind.isCast(); (src/ast/get.sk:157:5)');
    }
    if (this.children.length !== 2) {
      throw new Error('assert children.size() == 2; (src/ast/get.sk:158:5)');
    }
    return this.children[0];
  };
  Node.prototype.castValue = function() {
    if (!in_NodeKind.isCast(this.kind)) {
      throw new Error('assert kind.isCast(); (src/ast/get.sk:163:5)');
    }
    if (this.children.length !== 2) {
      throw new Error('assert children.size() == 2; (src/ast/get.sk:164:5)');
    }
    return this.children[1];
  };
  Node.prototype.expressionValue = function() {
    if (this.kind !== NodeKind.EXPRESSION) {
      throw new Error('assert kind == .EXPRESSION; (src/ast/get.sk:169:5)');
    }
    if (this.children.length !== 1) {
      throw new Error('assert children.size() == 1; (src/ast/get.sk:170:5)');
    }
    return this.children[0];
  };
  Node.prototype.ifTest = function() {
    if (this.kind !== NodeKind.IF) {
      throw new Error('assert kind == .IF; (src/ast/get.sk:175:5)');
    }
    if (this.children.length !== 3) {
      throw new Error('assert children.size() == 3; (src/ast/get.sk:176:5)');
    }
    return this.children[0];
  };
  Node.prototype.ifTrue = function() {
    if (this.kind !== NodeKind.IF) {
      throw new Error('assert kind == .IF; (src/ast/get.sk:181:5)');
    }
    if (this.children.length !== 3) {
      throw new Error('assert children.size() == 3; (src/ast/get.sk:182:5)');
    }
    if (this.children[1] !== null && this.children[1].kind !== NodeKind.BLOCK) {
      throw new Error('assert children.get(1) == null || children.get(1).kind == .BLOCK; (src/ast/get.sk:183:5)');
    }
    return this.children[1];
  };
  Node.prototype.ifFalse = function() {
    if (this.kind !== NodeKind.IF) {
      throw new Error('assert kind == .IF; (src/ast/get.sk:188:5)');
    }
    if (this.children.length !== 3) {
      throw new Error('assert children.size() == 3; (src/ast/get.sk:189:5)');
    }
    if (this.children[2] !== null && this.children[2].kind !== NodeKind.BLOCK) {
      throw new Error('assert children.get(2) == null || children.get(2).kind == .BLOCK; (src/ast/get.sk:190:5)');
    }
    return this.children[2];
  };
  Node.prototype.forSetup = function() {
    if (this.kind !== NodeKind.FOR) {
      throw new Error('assert kind == .FOR; (src/ast/get.sk:195:5)');
    }
    if (this.children.length !== 4) {
      throw new Error('assert children.size() == 4; (src/ast/get.sk:196:5)');
    }
    return this.children[0];
  };
  Node.prototype.forTest = function() {
    if (this.kind !== NodeKind.FOR) {
      throw new Error('assert kind == .FOR; (src/ast/get.sk:201:5)');
    }
    if (this.children.length !== 4) {
      throw new Error('assert children.size() == 4; (src/ast/get.sk:202:5)');
    }
    return this.children[1];
  };
  Node.prototype.forUpdate = function() {
    if (this.kind !== NodeKind.FOR) {
      throw new Error('assert kind == .FOR; (src/ast/get.sk:207:5)');
    }
    if (this.children.length !== 4) {
      throw new Error('assert children.size() == 4; (src/ast/get.sk:208:5)');
    }
    return this.children[2];
  };
  Node.prototype.forBlock = function() {
    if (this.kind !== NodeKind.FOR) {
      throw new Error('assert kind == .FOR; (src/ast/get.sk:213:5)');
    }
    if (this.children.length !== 4) {
      throw new Error('assert children.size() == 4; (src/ast/get.sk:214:5)');
    }
    if (this.children[3].kind !== NodeKind.BLOCK) {
      throw new Error('assert children.get(3).kind == .BLOCK; (src/ast/get.sk:215:5)');
    }
    return this.children[3];
  };
  Node.prototype.forEachVariable = function() {
    if (this.kind !== NodeKind.FOR_EACH) {
      throw new Error('assert kind == .FOR_EACH; (src/ast/get.sk:220:5)');
    }
    if (this.children.length !== 3) {
      throw new Error('assert children.size() == 3; (src/ast/get.sk:221:5)');
    }
    if (this.children[0].kind !== NodeKind.VARIABLE) {
      throw new Error('assert children.get(0).kind == .VARIABLE; (src/ast/get.sk:222:5)');
    }
    return this.children[0];
  };
  Node.prototype.forEachValue = function() {
    if (this.kind !== NodeKind.FOR_EACH) {
      throw new Error('assert kind == .FOR_EACH; (src/ast/get.sk:227:5)');
    }
    if (this.children.length !== 3) {
      throw new Error('assert children.size() == 3; (src/ast/get.sk:228:5)');
    }
    return this.children[1];
  };
  Node.prototype.forEachBlock = function() {
    if (this.kind !== NodeKind.FOR_EACH) {
      throw new Error('assert kind == .FOR_EACH; (src/ast/get.sk:233:5)');
    }
    if (this.children.length !== 3) {
      throw new Error('assert children.size() == 3; (src/ast/get.sk:234:5)');
    }
    if (this.children[2].kind !== NodeKind.BLOCK) {
      throw new Error('assert children.get(2).kind == .BLOCK; (src/ast/get.sk:235:5)');
    }
    return this.children[2];
  };
  Node.prototype.whileTest = function() {
    if (this.kind !== NodeKind.WHILE && this.kind !== NodeKind.DO_WHILE) {
      throw new Error('assert kind == .WHILE || kind == .DO_WHILE; (src/ast/get.sk:240:5)');
    }
    if (this.children.length !== 2) {
      throw new Error('assert children.size() == 2; (src/ast/get.sk:241:5)');
    }
    return this.children[0];
  };
  Node.prototype.whileBlock = function() {
    if (this.kind !== NodeKind.WHILE && this.kind !== NodeKind.DO_WHILE) {
      throw new Error('assert kind == .WHILE || kind == .DO_WHILE; (src/ast/get.sk:246:5)');
    }
    if (this.children.length !== 2) {
      throw new Error('assert children.size() == 2; (src/ast/get.sk:247:5)');
    }
    if (this.children[1].kind !== NodeKind.BLOCK) {
      throw new Error('assert children.get(1).kind == .BLOCK; (src/ast/get.sk:248:5)');
    }
    return this.children[1];
  };
  Node.prototype.untypedValue = function() {
    if (this.kind !== NodeKind.UNTYPED) {
      throw new Error('assert kind == .UNTYPED; (src/ast/get.sk:253:5)');
    }
    if (this.children.length !== 1) {
      throw new Error('assert children.size() == 1; (src/ast/get.sk:254:5)');
    }
    return this.children[0];
  };
  Node.prototype.baseTypes = function() {
    if (!in_NodeKind.isObject(this.kind) && this.kind !== NodeKind.EXTENSION) {
      throw new Error('assert kind.isObject() || kind == .EXTENSION; (src/ast/get.sk:259:5)');
    }
    if (!(this.children.length >= 3)) {
      throw new Error('assert children.size() >= 3; (src/ast/get.sk:260:5)');
    }
    if (this.children[2] !== null && this.children[2].kind !== NodeKind.NODE_LIST) {
      throw new Error('assert children.get(2) == null || children.get(2).kind == .NODE_LIST; (src/ast/get.sk:261:5)');
    }
    return this.children[2];
  };
  Node.prototype.objectParameters = function() {
    if (!in_NodeKind.isObject(this.kind)) {
      throw new Error('assert kind.isObject(); (src/ast/get.sk:266:5)');
    }
    if (this.children.length !== 4) {
      throw new Error('assert children.size() == 4; (src/ast/get.sk:267:5)');
    }
    if (this.children[3] !== null && this.children[3].kind !== NodeKind.NODE_LIST) {
      throw new Error('assert children.get(3) == null || children.get(3).kind == .NODE_LIST; (src/ast/get.sk:268:5)');
    }
    return this.children[3];
  };
  Node.prototype.functionArguments = function() {
    if (!in_NodeKind.isFunction(this.kind)) {
      throw new Error('assert kind.isFunction(); (src/ast/get.sk:273:5)');
    }
    if (this.children.length !== 5) {
      throw new Error('assert children.size() == 5; (src/ast/get.sk:274:5)');
    }
    if (this.children[1].kind !== NodeKind.NODE_LIST) {
      throw new Error('assert children.get(1).kind == .NODE_LIST; (src/ast/get.sk:275:5)');
    }
    return this.children[1];
  };
  Node.prototype.functionBlock = function() {
    if (!in_NodeKind.isFunction(this.kind)) {
      throw new Error('assert kind.isFunction(); (src/ast/get.sk:280:5)');
    }
    if (this.children.length !== 5) {
      throw new Error('assert children.size() == 5; (src/ast/get.sk:281:5)');
    }
    if (this.children[2] !== null && this.children[2].kind !== NodeKind.BLOCK) {
      throw new Error('assert children.get(2) == null || children.get(2).kind == .BLOCK; (src/ast/get.sk:282:5)');
    }
    return this.children[2];
  };
  Node.prototype.functionResult = function() {
    if (this.kind !== NodeKind.FUNCTION) {
      throw new Error('assert kind == .FUNCTION; (src/ast/get.sk:287:5)');
    }
    if (this.children.length !== 5) {
      throw new Error('assert children.size() == 5; (src/ast/get.sk:288:5)');
    }
    return this.children[3];
  };
  Node.prototype.functionParameters = function() {
    if (this.kind !== NodeKind.FUNCTION) {
      throw new Error('assert kind == .FUNCTION; (src/ast/get.sk:293:5)');
    }
    if (this.children.length !== 5) {
      throw new Error('assert children.size() == 5; (src/ast/get.sk:294:5)');
    }
    return this.children[4];
  };
  Node.prototype.superInitializer = function() {
    if (this.kind !== NodeKind.CONSTRUCTOR) {
      throw new Error('assert kind == .CONSTRUCTOR; (src/ast/get.sk:299:5)');
    }
    if (this.children.length !== 5) {
      throw new Error('assert children.size() == 5; (src/ast/get.sk:300:5)');
    }
    return this.children[3];
  };
  Node.prototype.memberInitializers = function() {
    if (this.kind !== NodeKind.CONSTRUCTOR) {
      throw new Error('assert kind == .CONSTRUCTOR; (src/ast/get.sk:305:5)');
    }
    if (this.children.length !== 5) {
      throw new Error('assert children.size() == 5; (src/ast/get.sk:306:5)');
    }
    return this.children[4];
  };
  Node.prototype.memberInitializerName = function() {
    if (this.kind !== NodeKind.MEMBER_INITIALIZER) {
      throw new Error('assert kind == .MEMBER_INITIALIZER; (src/ast/get.sk:311:5)');
    }
    if (this.children.length !== 2) {
      throw new Error('assert children.size() == 2; (src/ast/get.sk:312:5)');
    }
    return this.children[0];
  };
  Node.prototype.memberInitializerValue = function() {
    if (this.kind !== NodeKind.MEMBER_INITIALIZER) {
      throw new Error('assert kind == .MEMBER_INITIALIZER; (src/ast/get.sk:317:5)');
    }
    if (this.children.length !== 2) {
      throw new Error('assert children.size() == 2; (src/ast/get.sk:318:5)');
    }
    return this.children[1];
  };
  Node.prototype.assertValue = function() {
    if (!in_NodeKind.isAssert(this.kind)) {
      throw new Error('assert kind.isAssert(); (src/ast/get.sk:323:5)');
    }
    if (this.children.length !== 1) {
      throw new Error('assert children.size() == 1; (src/ast/get.sk:324:5)');
    }
    return this.children[0];
  };
  Node.prototype.parameterizeValue = function() {
    if (this.kind !== NodeKind.PARAMETERIZE) {
      throw new Error('assert kind == .PARAMETERIZE; (src/ast/get.sk:329:5)');
    }
    if (!(this.children.length >= 1)) {
      throw new Error('assert children.size() >= 1; (src/ast/get.sk:330:5)');
    }
    return this.children[0];
  };
  Node.prototype.parameterizeTypes = function() {
    if (this.kind !== NodeKind.PARAMETERIZE) {
      throw new Error('assert kind == .PARAMETERIZE; (src/ast/get.sk:335:5)');
    }
    if (!(this.children.length >= 1)) {
      throw new Error('assert children.size() >= 1; (src/ast/get.sk:336:5)');
    }
    return this.children.slice(1, this.children.length);
  };
  Node.prototype.callValue = function() {
    if (this.kind !== NodeKind.CALL) {
      throw new Error('assert kind == .CALL; (src/ast/get.sk:341:5)');
    }
    if (!(this.children.length >= 1)) {
      throw new Error('assert children.size() >= 1; (src/ast/get.sk:342:5)');
    }
    return this.children[0];
  };
  Node.prototype.callArguments = function() {
    if (this.kind !== NodeKind.CALL) {
      throw new Error('assert kind == .CALL; (src/ast/get.sk:347:5)');
    }
    if (!(this.children.length >= 1)) {
      throw new Error('assert children.size() >= 1; (src/ast/get.sk:348:5)');
    }
    return this.children.slice(1, this.children.length);
  };
  Node.prototype.superCallArguments = function() {
    if (this.kind !== NodeKind.SUPER_CALL) {
      throw new Error('assert kind == .SUPER_CALL; (src/ast/get.sk:353:5)');
    }
    return this.children;
  };
  Node.prototype.listValues = function() {
    if (this.kind !== NodeKind.LIST) {
      throw new Error('assert kind == .LIST; (src/ast/get.sk:358:5)');
    }
    return this.children;
  };
  Node.prototype.parameterBound = function() {
    if (this.kind !== NodeKind.PARAMETER) {
      throw new Error('assert kind == .PARAMETER; (src/ast/get.sk:363:5)');
    }
    if (this.children.length !== 2) {
      throw new Error('assert children.size() == 2; (src/ast/get.sk:364:5)');
    }
    return this.children[1];
  };
  Node.prototype.returnValue = function() {
    if (this.kind !== NodeKind.RETURN) {
      throw new Error('assert kind == .RETURN; (src/ast/get.sk:369:5)');
    }
    if (this.children.length !== 1) {
      throw new Error('assert children.size() == 1; (src/ast/get.sk:370:5)');
    }
    return this.children[0];
  };
  Node.prototype.switchValue = function() {
    if (this.kind !== NodeKind.SWITCH) {
      throw new Error('assert kind == .SWITCH; (src/ast/get.sk:375:5)');
    }
    if (!(this.children.length >= 1)) {
      throw new Error('assert children.size() >= 1; (src/ast/get.sk:376:5)');
    }
    return this.children[0];
  };
  Node.prototype.switchCases = function() {
    if (this.kind !== NodeKind.SWITCH) {
      throw new Error('assert kind == .SWITCH; (src/ast/get.sk:381:5)');
    }
    if (!(this.children.length >= 1)) {
      throw new Error('assert children.size() >= 1; (src/ast/get.sk:382:5)');
    }
    return this.children.slice(1, this.children.length);
  };
  Node.prototype.caseValues = function() {
    if (this.kind !== NodeKind.CASE) {
      throw new Error('assert kind == .CASE; (src/ast/get.sk:387:5)');
    }
    if (!(this.children.length >= 1)) {
      throw new Error('assert children.size() >= 1; (src/ast/get.sk:388:5)');
    }
    return this.children.slice(0, this.children.length - 1 | 0);
  };
  Node.prototype.caseBlock = function() {
    if (this.kind !== NodeKind.CASE) {
      throw new Error('assert kind == .CASE; (src/ast/get.sk:393:5)');
    }
    if (!(this.children.length >= 1)) {
      throw new Error('assert children.size() >= 1; (src/ast/get.sk:394:5)');
    }
    if (this.lastChild().kind !== NodeKind.BLOCK) {
      throw new Error('assert lastChild().kind == .BLOCK; (src/ast/get.sk:395:5)');
    }
    return this.lastChild();
  };
  Node.prototype.invertBooleanCondition = function(cache) {
    if (!in_NodeKind.isExpression(this.kind)) {
      throw new Error('assert kind.isExpression(); (src/ast/logic.sk:3:5)');
    }
    switch (this.kind) {
    case 37:
      this.content = new BoolContent(!this.asBool());
      return;
    case 53:
      this.become(this.unaryValue().remove());
      return;
    case 66:
      this.kind = NodeKind.NOT_EQUAL;
      return;
    case 76:
      this.kind = NodeKind.EQUAL;
      return;
    case 74:
      this.kind = NodeKind.LOGICAL_AND;
      this.binaryLeft().invertBooleanCondition(cache);
      this.binaryRight().invertBooleanCondition(cache);
      return;
    case 73:
      this.kind = NodeKind.LOGICAL_OR;
      this.binaryLeft().invertBooleanCondition(cache);
      this.binaryRight().invertBooleanCondition(cache);
      return;
    case 71:
    case 67:
    case 72:
    case 68:
      var commonType = cache.commonImplicitType(this.binaryLeft().type, this.binaryRight().type);
      if (commonType !== null && !commonType.isReal(cache)) {
        switch (this.kind) {
        case 71:
          this.kind = NodeKind.GREATER_THAN_OR_EQUAL;
          break;
        case 67:
          this.kind = NodeKind.LESS_THAN_OR_EQUAL;
          break;
        case 72:
          this.kind = NodeKind.GREATER_THAN;
          break;
        case 68:
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
      throw new Error('assert kind == .BLOCK; (src/ast/logic.sk:79:5)');
    }
    if (!this.hasChildren()) {
      return false;
    }
    for (var i = this.children.length - 1 | 0; i >= 0; i = i - 1 | 0) {
      var child = this.children[i];
      switch (child.kind) {
      case 23:
        return true;
      case 18:
        var trueBlock = child.ifTrue();
        var falseBlock = child.ifFalse();
        if (falseBlock !== null && trueBlock.blockAlwaysEndsWithReturn() && falseBlock.blockAlwaysEndsWithReturn()) {
          return true;
        }
        break;
      case 29:
        var value = child.switchValue();
        var cases = child.switchCases();
        var foundDefault = false;
        for (var j = 0; j < cases.length; j = j + 1 | 0) {
          var node = cases[j];
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
  Node.prototype.isNameExpression = function() {
    return this.kind === NodeKind.NAME && (this.parent.kind !== NodeKind.DOT || this !== this.parent.dotName()) && (!in_NodeKind.isNamedDeclaration(this.parent.kind) || this !== this.parent.declarationName());
  };
  Node.prototype.isDeclarationName = function() {
    return this.kind === NodeKind.NAME && in_NodeKind.isNamedDeclaration(this.parent.kind) && this === this.parent.declarationName();
  };
  Node.prototype.isStorage = function() {
    return in_NodeKind.isUnaryStorageOperator(this.parent.kind) || in_NodeKind.isBinaryStorageOperator(this.parent.kind) && this === this.parent.binaryLeft();
  };
  Node.prototype.hasNoSideEffects = function() {
    switch (this.kind) {
    case 32:
    case 34:
    case 37:
    case 38:
    case 39:
    case 40:
    case 41:
    case 36:
      return true;
    case 49:
    case 50:
      return this.castValue().hasNoSideEffects();
    case 35:
      return this.hookTest().hasNoSideEffects() && this.hookTrue().hasNoSideEffects() && this.hookFalse().hasNoSideEffects();
    case 43:
      return this.dotTarget().hasNoSideEffects();
    case 51:
      return this.untypedValue().hasNoSideEffects();
    default:
      if (in_NodeKind.isBinaryOperator(this.kind) && !in_NodeKind.isBinaryStorageOperator(this.kind)) {
        return this.binaryLeft().hasNoSideEffects() && this.binaryRight().hasNoSideEffects();
      }
      if (in_NodeKind.isUnaryOperator(this.kind) && !in_NodeKind.isUnaryStorageOperator(this.kind)) {
        return this.unaryValue().hasNoSideEffects();
      }
      return false;
    }
  };
  Node.prototype.hasChildren = function() {
    return this.children !== null && this.children.length > 0;
  };
  Node.prototype.isLastChild = function() {
    return this.parent.lastChild() === this;
  };
  Node.prototype.lastChild = function() {
    return this.children[this.children.length - 1 | 0];
  };
  Node.prototype.indexInParent = function() {
    if (this.parent === null) {
      throw new Error('assert parent != null; (src/ast/node.sk:232:5)');
    }
    return this.parent.children.indexOf(this);
  };
  Node.prototype.appendChild = function(node) {
    this.insertChild(this.children === null ? 0 : this.children.length, node);
  };
  Node.prototype.insertSiblingAfter = function(node) {
    this.parent.insertChild(this.indexInParent() + 1 | 0, node);
  };
  Node.prototype.removeChildAtIndex = function(index) {
    if (index < 0 || !(index < this.children.length)) {
      throw new Error('assert index >= 0 && index < children.size(); (src/ast/node.sk:261:5)');
    }
    var child = this.children[index];
    if (child !== null) {
      child.parent = null;
    }
    this.children.splice(index, 1)[0];
    return child;
  };
  Node.prototype.remove = function() {
    if (this.parent !== null) {
      this.parent.removeChildAtIndex(this.indexInParent());
    }
    return this;
  };
  Node.prototype.removeChildren = function() {
    if (this.children === null) {
      return [];
    }
    var result = this.children;
    for (var i = 0; i < this.children.length; i = i + 1 | 0) {
      var child = this.children[i];
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
    return this;
  };
  Node.prototype.swapWith = function(node) {
    var parentA = this.parent;
    var parentB = node.parent;
    var indexA = this.indexInParent();
    var indexB = node.indexInParent();
    parentA.children[indexA] = node;
    parentB.children[indexB] = this;
    this.parent = parentB;
    node.parent = parentA;
  };
  Node.prototype.replaceWithNodes = function(nodes) {
    var index = this.indexInParent();
    for (var i = 0; i < nodes.length; i = i + 1 | 0) {
      this.parent.insertChild((index + i | 0) + 1 | 0, nodes[i]);
    }
    this.parent.removeChildAtIndex(index);
    return this;
  };
  Node.prototype.replaceChild = function(index, node) {
    if (this.children === null) {
      throw new Error('assert children != null; (src/ast/node.sk:332:5)');
    }
    if (index < 0 || !(index <= this.children.length)) {
      throw new Error('assert index >= 0 && index <= children.size(); (src/ast/node.sk:333:5)');
    }
    Node.updateParent(node, this);
    var old = this.children[index];
    if (old !== null) {
      old.parent = null;
    }
    this.children[index] = node;
  };
  Node.prototype.insertChild = function(index, node) {
    if (this.children === null) {
      this.children = [];
    }
    if (index < 0 || !(index <= this.children.length)) {
      throw new Error('assert index >= 0 && index <= children.size(); (src/ast/node.sk:342:5)');
    }
    Node.updateParent(node, this);
    this.children.splice(index, 0, node);
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
        var child = this.children[i];
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
      throw new Error('assert children == null; (src/ast/node.sk:395:5)');
    }
    for (var i = 0; i < nodes.length; i = i + 1 | 0) {
      Node.updateParent(nodes[i], this);
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
        throw new Error('assert node.parent == null; (src/ast/node.sk:421:7)');
      }
      node.parent = parent;
    }
  };
  function NodeKindIs(_0) {
    this.kind = _0;
  }
  NodeKindIs.prototype.check = function(node) {
    return node.kind === this.kind;
  };
  function NodeKindIsExpression() {
  }
  NodeKindIsExpression.prototype.check = function(node) {
    return in_NodeKind.isExpression(node.kind);
  };
  function NodeKindIsStatement() {
  }
  NodeKindIsStatement.prototype.check = function(node) {
    return in_NodeKind.isStatement(node.kind);
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
    INTERFACE: 11,
    EXTENSION: 12,
    CONSTRUCTOR: 13,
    FUNCTION: 14,
    VARIABLE: 15,
    PARAMETER: 16,
    ALIAS: 17,
    IF: 18,
    FOR: 19,
    FOR_EACH: 20,
    WHILE: 21,
    DO_WHILE: 22,
    RETURN: 23,
    BREAK: 24,
    CONTINUE: 25,
    ASSERT: 26,
    ASSERT_CONST: 27,
    EXPRESSION: 28,
    SWITCH: 29,
    MODIFIER: 30,
    USING: 31,
    NAME: 32,
    TYPE: 33,
    THIS: 34,
    HOOK: 35,
    NULL: 36,
    BOOL: 37,
    INT: 38,
    FLOAT: 39,
    DOUBLE: 40,
    STRING: 41,
    LIST: 42,
    DOT: 43,
    CALL: 44,
    SUPER_CALL: 45,
    ERROR: 46,
    SEQUENCE: 47,
    PARAMETERIZE: 48,
    CAST: 49,
    IMPLICIT_CAST: 50,
    UNTYPED: 51,
    VAR: 52,
    NOT: 53,
    POSITIVE: 54,
    NEGATIVE: 55,
    COMPLEMENT: 56,
    PREFIX_INCREMENT: 57,
    PREFIX_DECREMENT: 58,
    POSTFIX_INCREMENT: 59,
    POSTFIX_DECREMENT: 60,
    ADD: 61,
    BITWISE_AND: 62,
    BITWISE_OR: 63,
    BITWISE_XOR: 64,
    DIVIDE: 65,
    EQUAL: 66,
    GREATER_THAN: 67,
    GREATER_THAN_OR_EQUAL: 68,
    IN: 69,
    INDEX: 70,
    LESS_THAN: 71,
    LESS_THAN_OR_EQUAL: 72,
    LOGICAL_AND: 73,
    LOGICAL_OR: 74,
    MULTIPLY: 75,
    NOT_EQUAL: 76,
    REMAINDER: 77,
    SHIFT_LEFT: 78,
    SHIFT_RIGHT: 79,
    SUBTRACT: 80,
    ASSIGN: 81,
    ASSIGN_ADD: 82,
    ASSIGN_BITWISE_AND: 83,
    ASSIGN_BITWISE_OR: 84,
    ASSIGN_BITWISE_XOR: 85,
    ASSIGN_DIVIDE: 86,
    ASSIGN_MULTIPLY: 87,
    ASSIGN_REMAINDER: 88,
    ASSIGN_SHIFT_LEFT: 89,
    ASSIGN_SHIFT_RIGHT: 90,
    ASSIGN_SUBTRACT: 91,
    ASSIGN_INDEX: 92
  };
  var in_NodeKind = {};
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
    SORT_BY_INHERITANCE_AND_CONTAINMENT: 2
  };
  function Collector(program, sort) {
    this.typeSymbols = [];
    this.freeFunctionSymbols = [];
    this.freeVariableSymbols = [];
    this.sort = sort;
    if (program.kind !== NodeKind.PROGRAM) {
      throw new Error('assert program.kind == .PROGRAM; (src/compiler/collector.sk:14:5)');
    }
    this.collectStatements(program);
    this.sortTypeSymbols();
  }
  Collector.prototype.collectStatements = function(node) {
    switch (node.kind) {
    case 0:
    case 1:
    case 30:
    case 2:
      this.collectChildStatements(node);
      break;
    case 7:
    case 10:
    case 11:
    case 12:
    case 8:
    case 9:
      if (node === node.symbol.node) {
        this.typeSymbols.push(node.symbol);
      }
      this.collectChildStatements(node);
      break;
    case 13:
    case 14:
      if (!in_SymbolKind.isTypeWithInstances(node.symbol.enclosingSymbol.kind)) {
        this.freeFunctionSymbols.push(node.symbol);
      }
      break;
    case 6:
      var variables = node.clusterVariables();
      for (var i = 0; i < variables.length; i = i + 1 | 0) {
        var symbol = variables[i].symbol;
        if (symbol.kind === SymbolKind.GLOBAL_VARIABLE && in_SymbolKind.isNamespace(symbol.enclosingSymbol.kind)) {
          this.freeVariableSymbols.push(symbol);
        }
      }
      break;
    }
  };
  Collector.prototype.sortTypeSymbols = function() {
    if (this.sort === SortTypes.DO_NOT_SORT) {
      return;
    }
    for (var i = 0; i < this.typeSymbols.length; i = i + 1 | 0) {
      var j = i;
      for (; j < this.typeSymbols.length; j = j + 1 | 0) {
        var type = this.typeSymbols[j].type;
        var k = i;
        for (; k < this.typeSymbols.length; k = k + 1 | 0) {
          if (j === k) {
            continue;
          }
          var other = this.typeSymbols[k];
          if (this.typeComesBefore(this.typeSymbols[k].type, type)) {
            break;
          }
        }
        if (k === this.typeSymbols.length) {
          break;
        }
      }
      if (j < this.typeSymbols.length) {
        in_List.swap(this.typeSymbols, i, j);
      }
    }
  };
  Collector.prototype.isContainedBy = function(inner, outer) {
    if (inner.enclosingSymbol === null) {
      return false;
    }
    if (inner.enclosingSymbol === outer) {
      return true;
    }
    return this.isContainedBy(inner.enclosingSymbol, outer);
  };
  Collector.prototype.typeComesBefore = function(before, after) {
    if (after.hasBaseType(before)) {
      return true;
    }
    if (this.sort === SortTypes.SORT_BY_INHERITANCE_AND_CONTAINMENT && this.isContainedBy(after.symbol, before.symbol)) {
      return true;
    }
    return false;
  };
  Collector.prototype.collectChildStatements = function(node) {
    if (node.hasChildren()) {
      for (var i = 0; i < node.children.length; i = i + 1 | 0) {
        var child = node.children[i];
        if (child !== null) {
          this.collectStatements(child);
        }
      }
    }
  };
  TargetFormat = {
    NONE: 0,
    CPP: 1,
    JAVASCRIPT: 2,
    LISP_AST: 3,
    JSON_AST: 4,
    XML_AST: 5
  };
  var in_TargetFormat = {};
  CompilerOptions = function() {
    this.targetFormat = TargetFormat.NONE;
    this.inputs = [];
    this.prepend = [];
    this.append = [];
    this.outputDirectory = '';
    this.outputFile = '';
    this.jsMinify = false;
    this.jsMangle = false;
    this.jsSourceMap = false;
    this.removeAsserts = false;
    this.foldAllConstants = false;
    this.inlineAllFunctions = false;
    this.convertAllInstanceToStatic = false;
  };
  CompilerResult = function(_0, _1, _2, _3) {
    this.options = _0;
    this.outputs = _1;
    this.program = _2;
    this.resolver = _3;
  };
  function CachedSource(_0) {
    this.source = null;
    this.file = null;
    this.contents = _0;
  }
  CachedSource.prototype.compile = function(compiler, options) {
    if (this.file === null) {
      var program = Node.createProgram([]);
      this.source = new Source('<native>', this.contents);
      compiler.processInput(program, this.source);
      if (!(program.children.length > 0)) {
        throw new Error('assert program.children.size() > 0; (src/compiler/compiler.sk:56:7)');
      }
      this.file = program.children[0];
    }
    options.inputs.unshift(this.source);
    return this.file.clone();
  };
  Compiler = function() {
    this.tokenizingTime = 0;
    this.parsingTime = 0;
    this.resolvingTime = 0;
    this.callGraphTime = 0;
    this.instanceToStaticTime = 0;
    this.symbolMotionTime = 0;
    this.functionInliningTime = 0;
    this.constantFoldingTime = 0;
    this.deadCodeRemovalTime = 0;
    this.emitTime = 0;
    this.lineCountingTime = 0;
    this.totalTime = 0;
    this.log = new Log();
  };
  Compiler.prototype.statistics = function(result) {
    var lineCountingStart = now();
    var lineCount = 0;
    lineCount = lineCount + Compiler.totalLineCount(result.options.prepend) | 0;
    lineCount = lineCount + Compiler.totalLineCount(result.options.inputs) | 0;
    lineCount = lineCount + Compiler.totalLineCount(result.options.append) | 0;
    var text = 'Input line count: ' + lineCount + '\nOutput line count: ' + Compiler.totalLineCount(result.outputs);
    this.lineCountingTime += now() - lineCountingStart;
    var optimizingTime = this.callGraphTime + this.instanceToStaticTime + this.symbolMotionTime + this.functionInliningTime + this.constantFoldingTime + this.deadCodeRemovalTime;
    text += '\nTotal compile time: ' + formatPositiveNumber(this.totalTime + this.lineCountingTime) + 'ms';
    if (this.tokenizingTime > 0) {
      text += '\n  Tokenizing: ' + formatPositiveNumber(this.tokenizingTime) + 'ms';
    }
    if (this.parsingTime > 0) {
      text += '\n  Parsing: ' + formatPositiveNumber(this.parsingTime) + 'ms';
    }
    if (this.resolvingTime > 0) {
      text += '\n  Resolving: ' + formatPositiveNumber(this.resolvingTime) + 'ms';
    }
    if (optimizingTime > 0) {
      text += '\n  Optimizing: ' + formatPositiveNumber(optimizingTime) + 'ms';
      text += '\n    Building call graph: ' + formatPositiveNumber(this.callGraphTime) + 'ms';
      text += '\n    Instance to static: ' + formatPositiveNumber(this.instanceToStaticTime) + 'ms';
      text += '\n    Symbol motion: ' + formatPositiveNumber(this.symbolMotionTime) + 'ms';
      text += '\n    Function inlining: ' + formatPositiveNumber(this.functionInliningTime) + 'ms';
      text += '\n    Constant folding: ' + formatPositiveNumber(this.constantFoldingTime) + 'ms';
      text += '\n    Dead code removal: ' + formatPositiveNumber(this.deadCodeRemovalTime) + 'ms';
    }
    if (this.emitTime > 0) {
      text += '\n  Emit: ' + formatPositiveNumber(this.emitTime) + 'ms';
    }
    if (this.lineCountingTime > 0) {
      text += '\n  Counting lines: ' + formatPositiveNumber(this.lineCountingTime) + 'ms';
    }
    text += Compiler.sourceStatistics('Prepend', result.options.prepend);
    text += Compiler.sourceStatistics('Inputs', result.options.inputs);
    text += Compiler.sourceStatistics('Append', result.options.append);
    text += Compiler.sourceStatistics('Outputs', result.outputs);
    return text;
  };
  Compiler.totalLineCount = function(sources) {
    var lineCount = 0;
    for (var i = 0; i < sources.length; i = i + 1 | 0) {
      lineCount = lineCount + sources[i].lineCount() | 0;
    }
    return lineCount;
  };
  Compiler.sourceStatistics = function(name, sources) {
    var total = 0;
    for (var i = 0; i < sources.length; i = i + 1 | 0) {
      total = total + sources[i].contents.length | 0;
    }
    var text = '\n' + name + ': ' + sources.length + ' (' + bytesToString(total) + ' total)';
    for (var i = 0; i < sources.length; i = i + 1 | 0) {
      var source = sources[i];
      text += '\n  ' + source.name + ': ' + bytesToString(source.contents.length);
    }
    return text;
  };
  Compiler.prototype.compile = function(options) {
    var totalStart = now();
    var program = Node.createProgram([]);
    var outputs = [];
    createOperatorMap();
    createParser();
    createNameToSymbolFlag();
    createSymbolFlagToName();
    switch (options.targetFormat) {
    case 2:
      program.appendChild(Compiler.nativeLibraryJS.compile(this, options));
      break;
    case 1:
      program.appendChild(Compiler.nativeLibraryCPP.compile(this, options));
      break;
    default:
      program.appendChild(Compiler.nativeLibrary.compile(this, options));
      break;
    }
    for (var i = 1; i < options.inputs.length; i = i + 1 | 0) {
      this.processInput(program, options.inputs[i]);
    }
    var resolver = null;
    if (in_TargetFormat.shouldRunResolver(options.targetFormat)) {
      var resolveStart = now();
      resolver = new Resolver(this.log, options);
      resolver.run(program);
      this.resolvingTime += now() - resolveStart;
    }
    if (this.log.errorCount === 0) {
      if (in_TargetFormat.shouldRunResolver(options.targetFormat)) {
        var callGraphStart = now();
        var graph = new CallGraph(program);
        this.callGraphTime += now() - callGraphStart;
        var instanceToStaticStart = now();
        InstanceToStaticPass.run(graph, resolver);
        this.instanceToStaticTime += now() - instanceToStaticStart;
        var symbolMotionStart = now();
        SymbolMotionPass.run(resolver);
        this.symbolMotionTime += now() - symbolMotionStart;
        var functionInliningStart = now();
        FunctionInliningPass.run(graph, options);
        this.functionInliningTime += now() - functionInliningStart;
        if (options.foldAllConstants) {
          var constantFoldingStart = now();
          resolver.constantFolder.foldConstants(program);
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
        emitter = new cpp.Emitter(resolver);
        break;
      case 2:
        emitter = new js.Emitter(resolver);
        break;
      case 3:
        emitter = new lisp.Emitter(options);
        break;
      case 4:
        emitter = new json.Emitter(options);
        break;
      case 5:
        emitter = new xml.Emitter(options);
        break;
      default:
        throw new Error('assert false; (src/compiler/compiler.sk:218:19)');
        break;
      }
      if (emitter !== null) {
        var emitStart = now();
        outputs = emitter.emitProgram(program);
        this.emitTime += now() - emitStart;
      }
    }
    this.totalTime += now() - totalStart;
    return new CompilerResult(options, outputs, program, resolver);
  };
  Compiler.prototype.processInput = function(program, source) {
    var errorCount = this.log.errorCount;
    var tokenizeStart = now();
    var sourceTokens = tokenize(this.log, source);
    this.tokenizingTime += now() - tokenizeStart;
    if (this.log.errorCount === errorCount) {
      var parseStart = now();
      var file = parseFile(this.log, sourceTokens);
      this.parsingTime += now() - parseStart;
      if (file !== null) {
        program.appendChild(file);
      }
    }
  };
  var DiagnosticKind = {
    ERROR: 0,
    WARNING: 1
  };
  function Diagnostic(_0, _1, _2) {
    this.noteRange = Range.EMPTY;
    this.noteText = '';
    this.kind = _0;
    this.range = _1;
    this.text = _2;
  }
  Log = function() {
    this.diagnostics = [];
    this.warningCount = 0;
    this.errorCount = 0;
  };
  Log.prototype.error = function(range, text) {
    if (range.isEmpty()) {
      throw new Error('assert !range.isEmpty(); (src/core/log.sk:20:5)');
    }
    this.diagnostics.push(new Diagnostic(DiagnosticKind.ERROR, range, text));
    this.errorCount = this.errorCount + 1 | 0;
  };
  Log.prototype.warning = function(range, text) {
    if (range.isEmpty()) {
      throw new Error('assert !range.isEmpty(); (src/core/log.sk:26:5)');
    }
    this.diagnostics.push(new Diagnostic(DiagnosticKind.WARNING, range, text));
    this.warningCount = this.warningCount + 1 | 0;
  };
  Log.prototype.note = function(range, text) {
    if (range.isEmpty()) {
      throw new Error('assert !range.isEmpty(); (src/core/log.sk:32:5)');
    }
    var last = this.diagnostics[this.diagnostics.length - 1 | 0];
    last.noteRange = range;
    last.noteText = text;
  };
  Log.prototype.toString = function() {
    var result = '';
    for (var i = 0; i < this.diagnostics.length; i = i + 1 | 0) {
      var diagnostic = this.diagnostics[i];
      var formatted = diagnostic.range.format(0);
      result = result + diagnostic.range.locationString() + (diagnostic.kind === DiagnosticKind.ERROR ? ': error: ' : ': warning: ') + diagnostic.text + '\n' + formatted.line + '\n' + formatted.range + '\n';
      if (!diagnostic.noteRange.isEmpty()) {
        formatted = diagnostic.noteRange.format(0);
        result = result + diagnostic.noteRange.locationString() + ': note: ' + diagnostic.noteText + '\n' + formatted.line + '\n' + formatted.range + '\n';
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
  Range.prototype.isEmpty = function() {
    return this.source === null;
  };
  Range.prototype.toString = function() {
    return this.source === null ? '' : this.source.contents.slice(this.start, this.end);
  };
  Range.prototype.locationString = function() {
    if (this.isEmpty()) {
      return '';
    }
    var location = this.source.indexToLineColumn(this.start);
    return this.source.name + ':' + (location.line + 1 | 0) + ':' + (location.column + 1 | 0);
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
      throw new Error('assert source != null; (src/core/range.sk:40:5)');
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
        line = line.slice(0, maxLength - 3 | 0) + '...';
        if (b > (maxLength - 3 | 0)) {
          b = maxLength - 3 | 0;
        }
      } else if ((length - a | 0) < (maxLength - centeredStart | 0)) {
        var offset = length - maxLength | 0;
        line = '...' + line.slice(offset + 3 | 0, length);
        a = a - offset | 0;
        b = b - offset | 0;
      } else {
        var offset = a - centeredStart | 0;
        line = '...' + line.slice(offset + 3 | 0, (offset + maxLength | 0) - 3 | 0) + '...';
        a = a - offset | 0;
        b = b - offset | 0;
        if (b > (maxLength - 3 | 0)) {
          b = maxLength - 3 | 0;
        }
      }
    }
    return new FormattedRange(line, in_string.repeat(' ', a) + ((b - a | 0) < 2 ? '^' : in_string.repeat('~', b - a | 0)));
  };
  Range.span = function(start, end) {
    if (start.source !== end.source) {
      throw new Error('assert start.source == end.source; (src/core/range.sk:81:5)');
    }
    if (start.start > end.end) {
      throw new Error('assert start.start <= end.end; (src/core/range.sk:82:5)');
    }
    return new Range(start.source, start.start, end.end);
  };
  Range.after = function(outer, inner) {
    if (outer.source !== inner.source) {
      throw new Error('assert outer.source == inner.source; (src/core/range.sk:100:5)');
    }
    if (outer.start > inner.start) {
      throw new Error('assert outer.start <= inner.start; (src/core/range.sk:101:5)');
    }
    if (outer.end < inner.end) {
      throw new Error('assert outer.end >= inner.end; (src/core/range.sk:102:5)');
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
  Source = function(_0, _1) {
    this.lineOffsets = null;
    this.name = _0;
    this.contents = _1;
  };
  Source.prototype.computeLineOffsets = function() {
    if (this.lineOffsets !== null) {
      return;
    }
    this.lineOffsets = [0];
    for (var i = 0; i < this.contents.length; i = i + 1 | 0) {
      if (this.contents.charCodeAt(i) === 10) {
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
      return '';
    }
    var start = this.lineOffsets[line];
    var end = (line + 1 | 0) < this.lineOffsets.length ? this.lineOffsets[line + 1 | 0] - 1 | 0 : this.contents.length;
    return this.contents.slice(start, end);
  };
  Source.prototype.indexToLineColumn = function(index) {
    this.computeLineOffsets();
    var count = this.lineOffsets.length;
    var line = 0;
    while (count > 0) {
      var step = count / 2 | 0;
      var i = line + step | 0;
      if (this.lineOffsets[i] <= index) {
        line = i + 1 | 0;
        count = (count - step | 0) - 1 | 0;
      } else {
        count = step;
      }
    }
    var column = line > 0 ? index - this.lineOffsets[line - 1 | 0] | 0 : index;
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
  var trace = {};
  var base = {};
  base.Emitter = function(_0) {
    this.previousKind = NodeKind.NULL;
    this.isKeyword = null;
    this.outputs = [];
    this.output = null;
    this.indent = '';
    this.cache = null;
    this.resolver = _0;
  };
  base.Emitter.prototype.emitProgram = function(program) {
    this.cache = this.resolver.cache;
    this.isKeyword = this.createIsKeyword();
    this.output = new Source('output.' + this.extension(), '');
    this.outputs.push(this.output);
    this.visitProgram(program);
    return this.outputs;
  };
  base.Emitter.prototype.visitProgram = function(node) {
    this.visitCollector(new Collector(node, SortTypes.SORT_BY_INHERITANCE_AND_CONTAINMENT));
  };
  base.Emitter.prototype.visitCollector = function(collector) {
    for (var i = 0; i < collector.typeSymbols.length; i = i + 1 | 0) {
      var symbol = collector.typeSymbols[i];
      if (!symbol.isImport()) {
        this.emitTypeDeclaration(symbol);
      }
    }
    for (var i = 0; i < collector.freeFunctionSymbols.length; i = i + 1 | 0) {
      var symbol = collector.freeFunctionSymbols[i];
      if (!symbol.isImport()) {
        this.emitFunction(symbol);
      }
    }
    for (var i = 0; i < collector.freeVariableSymbols.length; i = i + 1 | 0) {
      var symbol = collector.freeVariableSymbols[i];
      if (!symbol.isImport()) {
        this.emitVariable(symbol);
      }
    }
  };
  base.Emitter.prototype.emitTypeMembers = function(symbol) {
    var members = symbol.type.members.values();
    for (var i = 0; i < members.length; i = i + 1 | 0) {
      var member = members[i].symbol;
      if (!member.isImport() && member.enclosingSymbol === symbol) {
        if (in_SymbolKind.isFunction(member.kind)) {
          this.emitFunction(member);
        } else if (in_SymbolKind.isVariable(member.kind)) {
          this.emitVariable(member);
        }
      }
    }
  };
  base.Emitter.prototype.emitTypeBeforeVariable = function(symbol) {
    this.emitType(symbol.type);
    this.emit(' ');
  };
  base.Emitter.prototype.emitTypeParameter = function(symbol) {
    this.emit(this.mangleName(symbol));
  };
  base.Emitter.prototype.emitFunctionArguments = function(symbol) {
    var $arguments = symbol.node.functionArguments();
    this.emit('(');
    if ($arguments.hasChildren()) {
      for (var i = 0; i < $arguments.children.length; i = i + 1 | 0) {
        if (i > 0) {
          this.emit(', ');
        }
        this.emitFunctionArgument($arguments.children[i].symbol);
      }
    }
    this.emit(')');
  };
  base.Emitter.prototype.emitTypeParameters = function(symbol) {
    if (symbol.hasParameters()) {
      this.emit('<');
      for (var i = 0; i < symbol.parameters.length; i = i + 1 | 0) {
        if (i > 0) {
          this.emit(', ');
        }
        this.emitTypeParameter(symbol.parameters[i]);
      }
      this.emit('>');
    }
  };
  base.Emitter.prototype.forceEmitExtraNewline = function() {
    if (this.previousKind !== NodeKind.NULL) {
      this.emit('\n');
    }
    this.previousKind = NodeKind.NULL;
  };
  base.Emitter.prototype.isFlowNodeKind = function(kind) {
    return kind === NodeKind.EXPRESSION || kind === NodeKind.VARIABLE || kind === NodeKind.VARIABLE_CLUSTER || in_NodeKind.isJump(kind) || kind === NodeKind.ASSERT;
  };
  base.Emitter.prototype.shouldEmitExtraNewlineBetween = function(before, after) {
    return !this.isFlowNodeKind(before) || !this.isFlowNodeKind(after) || before !== NodeKind.VARIABLE_CLUSTER && after === NodeKind.VARIABLE_CLUSTER;
  };
  base.Emitter.prototype.emitExtraNewlineBefore = function(kind) {
    if (this.previousKind !== NodeKind.NULL && this.shouldEmitExtraNewlineBetween(this.previousKind, kind)) {
      this.emit('\n');
    }
    this.previousKind = NodeKind.NULL;
  };
  base.Emitter.prototype.emitExtraNewlineAfter = function(kind) {
    this.previousKind = kind;
  };
  base.Emitter.prototype.emitAfterVariable = function(node) {
    var value = node.variableValue();
    if (value !== null) {
      this.emit(' = ');
      this.emitExpression(value, Precedence.COMMA);
    }
  };
  base.Emitter.prototype.increaseIndent = function() {
    this.previousKind = NodeKind.NULL;
    this.indent += '  ';
  };
  base.Emitter.prototype.decreaseIndent = function() {
    this.indent = this.indent.slice(2, this.indent.length);
  };
  base.Emitter.prototype.emit = function(text) {
    this.output.contents += text;
  };
  base.Emitter.prototype.emitBlock = function(node) {
    this.emit(' {\n');
    this.increaseIndent();
    this.previousKind = NodeKind.NULL;
    this.emitStatements(node.blockStatements());
    this.decreaseIndent();
    this.emit(this.indent + '}');
    this.previousKind = NodeKind.NULL;
  };
  base.Emitter.prototype.emitStatements = function(nodes) {
    for (var i = 0; i < nodes.length; i = i + 1 | 0) {
      var child = nodes[i];
      var kind = child.kind;
      if (kind !== NodeKind.MODIFIER) {
        this.emitExtraNewlineBefore(kind);
      }
      this.emitStatement(child);
      if (kind !== NodeKind.MODIFIER) {
        this.emitExtraNewlineAfter(kind);
      }
    }
  };
  base.Emitter.prototype.emitStatement = function(node) {
    switch (node.kind) {
    case 4:
      this.emitCase(node);
      break;
    case 6:
      this.emitStatements(node.clusterVariables());
      break;
    case 18:
      this.emitIf(node);
      break;
    case 19:
      this.emitFor(node);
      break;
    case 20:
      this.emitForEach(node);
      break;
    case 21:
      this.emitWhile(node);
      break;
    case 22:
      this.emitDoWhile(node);
      break;
    case 23:
      this.emitReturn(node);
      break;
    case 24:
      this.emitBreak(node);
      break;
    case 25:
      this.emitContinue(node);
      break;
    case 26:
      this.emitAssert(node);
      break;
    case 28:
      this.emitExpressionStatement(node);
      break;
    case 29:
      this.emitSwitch(node);
      break;
    case 30:
      this.emitStatements(node.modifierStatements());
      break;
    case 15:
      this.emitVariable(node.symbol);
      break;
    default:
      throw new Error('assert false; (src/emitters/base.sk:183:19)');
      break;
    }
  };
  base.Emitter.prototype.endStatement = function() {
    this.emit(';\n');
  };
  base.Emitter.prototype.emitCase = function(node) {
    var values = node.caseValues();
    var block = node.caseBlock();
    if (values.length > 0) {
      for (var i = 0; i < values.length; i = i + 1 | 0) {
        if (i > 0) {
          this.emit('\n');
        }
        this.emit(this.indent + 'case ');
        this.emitExpression(values[i], Precedence.LOWEST);
        this.emit(':');
      }
    } else {
      this.emit(this.indent + 'default:');
    }
    this.emit(' {\n');
    this.increaseIndent();
    this.emitStatements(block.blockStatements());
    if (!block.blockAlwaysEndsWithReturn()) {
      this.emit(this.indent + 'break;\n');
    }
    this.decreaseIndent();
    this.emit(this.indent + '}\n');
  };
  base.Emitter.prototype.emitSwitch = function(node) {
    var cases = node.switchCases();
    this.emit(this.indent + 'switch (');
    this.emitExpression(node.switchValue(), Precedence.LOWEST);
    this.emit(') {\n');
    this.increaseIndent();
    this.previousKind = NodeKind.NULL;
    for (var i = 0; i < cases.length; i = i + 1 | 0) {
      var child = cases[i];
      this.emitExtraNewlineBefore(child.kind);
      this.emitCase(child);
      this.emitExtraNewlineAfter(child.kind);
    }
    this.decreaseIndent();
    this.emit(this.indent + '}\n');
  };
  base.Emitter.prototype.recursiveEmitIfStatement = function(node) {
    var falseBlock = node.ifFalse();
    this.emit('if (');
    this.emitExpression(node.ifTest(), Precedence.LOWEST);
    this.emit(')');
    this.emitBlock(node.ifTrue());
    if (falseBlock !== null) {
      var falseStatement = falseBlock.blockStatement();
      if (falseStatement !== null && falseStatement.kind === NodeKind.IF) {
        this.emit(' else ');
        this.recursiveEmitIfStatement(falseStatement);
      } else {
        this.emit(' else');
        this.emitBlock(falseBlock);
      }
    }
  };
  base.Emitter.prototype.emitIf = function(node) {
    this.emit(this.indent);
    this.recursiveEmitIfStatement(node);
    this.emit('\n');
  };
  base.Emitter.prototype.emitForVariables = function(nodes) {
    this.emitTypeBeforeVariable(nodes[0].symbol);
    for (var i = 0; i < nodes.length; i = i + 1 | 0) {
      if (i > 0) {
        this.emit(', ');
      }
      var node = nodes[i];
      var value = node.variableValue();
      this.emit(this.mangleName(node.symbol));
      this.emitAfterVariable(node);
    }
  };
  base.Emitter.prototype.emitFor = function(node) {
    var setup = node.forSetup();
    var test = node.forTest();
    var update = node.forUpdate();
    this.emit(this.indent + 'for (');
    if (setup !== null) {
      if (setup.kind === NodeKind.VARIABLE_CLUSTER) {
        this.emitForVariables(setup.clusterVariables());
      } else {
        this.emitExpression(setup, Precedence.LOWEST);
      }
    }
    if (test !== null) {
      this.emit('; ');
      this.emitExpression(test, Precedence.LOWEST);
    } else {
      this.emit(';');
    }
    if (update !== null) {
      this.emit('; ');
      this.emitExpression(update, Precedence.LOWEST);
    } else {
      this.emit(';');
    }
    this.emit(')');
    this.emitBlock(node.forBlock());
    this.emit('\n');
  };
  base.Emitter.prototype.emitForEach = function(node) {
  };
  base.Emitter.prototype.emitWhile = function(node) {
    this.emit(this.indent + 'while (');
    this.emitExpression(node.whileTest(), Precedence.LOWEST);
    this.emit(')');
    this.emitBlock(node.whileBlock());
    this.emit('\n');
  };
  base.Emitter.prototype.emitDoWhile = function(node) {
    this.emit(this.indent + 'do');
    this.emitBlock(node.whileBlock());
    this.emit(' while (');
    this.emitExpression(node.whileTest(), Precedence.LOWEST);
    this.emit(')');
    this.endStatement();
  };
  base.Emitter.prototype.emitReturn = function(node) {
    var value = node.returnValue();
    if (value !== null) {
      this.emit(this.indent + 'return ');
      this.emitExpression(value, Precedence.LOWEST);
    } else {
      this.emit(this.indent + 'return');
    }
    this.endStatement();
  };
  base.Emitter.prototype.emitBreak = function(node) {
    this.emit(this.indent + 'break');
    this.endStatement();
  };
  base.Emitter.prototype.emitContinue = function(node) {
    this.emit(this.indent + 'continue');
    this.endStatement();
  };
  base.Emitter.prototype.emitExpressionStatement = function(node) {
    this.emit(this.indent);
    this.emitExpression(node.expressionValue(), Precedence.LOWEST);
    this.endStatement();
  };
  base.Emitter.prototype.emitExpression = function(node, precedence) {
    var kind = node.kind;
    switch (kind) {
    case 32:
      this.emitName(node);
      break;
    case 33:
      this.emitType(node.type);
      break;
    case 34:
      this.emitThis();
      break;
    case 35:
      this.emitHook(node, precedence);
      break;
    case 36:
      this.emitNull();
      break;
    case 37:
      this.emitBool(node);
      break;
    case 38:
      this.emitInt(node, precedence);
      break;
    case 39:
    case 40:
      this.emitReal(node);
      break;
    case 41:
      this.emitString(node);
      break;
    case 43:
      this.emitDot(node);
      break;
    case 44:
      this.emitCall(node, precedence);
      break;
    case 47:
      this.emitSequence(node, precedence);
      break;
    case 70:
      this.emitIndex(node, precedence);
      break;
    case 92:
      this.emitTernary(node, precedence);
      break;
    case 49:
    case 50:
      this.emitCast(node, precedence);
      break;
    case 42:
      this.emitList(node);
      break;
    case 45:
      this.emitSuperCall(node);
      break;
    case 51:
      this.emitExpression(node.untypedValue(), precedence);
      break;
    default:
      if (in_NodeKind.isUnaryOperator(kind)) {
        this.emitUnary(node, precedence);
      } else if (in_NodeKind.isBinaryOperator(kind)) {
        this.emitBinary(node, precedence);
      } else {
        throw new Error('assert false; (src/emitters/base.sk:368:16)');
      }
      break;
    }
  };
  base.Emitter.prototype.emitCommaSeparatedExpressions = function(nodes) {
    for (var i = 0; i < nodes.length; i = i + 1 | 0) {
      if (i > 0) {
        this.emit(', ');
      }
      this.emitExpression(nodes[i], Precedence.COMMA);
    }
  };
  base.Emitter.prototype.emitSequence = function(node, precedence) {
    var values = node.sequenceValues();
    if (!(values.length > 1)) {
      throw new Error('assert values.size() > 1; (src/emitters/base.sk:382:7)');
    }
    if (node.parent.kind !== NodeKind.EXPRESSION && node.parent.kind !== NodeKind.FOR) {
      throw new Error('assert node.parent.kind == .EXPRESSION || node.parent.kind == .FOR; (src/emitters/base.sk:383:7)');
    }
    if (Precedence.COMMA <= precedence) {
      this.emit('(');
    }
    this.emitCommaSeparatedExpressions(node.sequenceValues());
    if (Precedence.COMMA <= precedence) {
      this.emit(')');
    }
  };
  base.Emitter.prototype.hasUnaryStorageOperators = function() {
    return true;
  };
  base.Emitter.prototype.emitUnaryPrefixOperator = function(node) {
    this.emit(operatorInfo.get(node.kind).text);
    var value = node.unaryValue();
    if (node.kind === NodeKind.POSITIVE && (value.kind === NodeKind.POSITIVE || value.kind === NodeKind.PREFIX_INCREMENT) || node.kind === NodeKind.NEGATIVE && (value.kind === NodeKind.NEGATIVE || value.kind === NodeKind.PREFIX_DECREMENT || value.kind === NodeKind.INT && value.asInt() < 0)) {
      this.emit(' ');
    }
  };
  base.Emitter.prototype.emitUnary = function(node, precedence) {
    var value = node.unaryValue();
    if (in_NodeKind.isUnaryStorageOperator(node.kind) && !this.hasUnaryStorageOperators()) {
      if (Precedence.ASSIGN < precedence) {
        this.emit('(');
      }
      this.emitExpression(value, Precedence.ASSIGN);
      this.emit(node.kind === NodeKind.PREFIX_INCREMENT || node.kind === NodeKind.POSTFIX_INCREMENT ? ' += 1' : ' -= 1');
      if (Precedence.ASSIGN < precedence) {
        this.emit(')');
      }
      return;
    }
    var info = operatorInfo.get(node.kind);
    if (info.precedence < precedence) {
      this.emit('(');
    }
    var isPostfix = info.precedence === Precedence.UNARY_POSTFIX;
    if (!isPostfix) {
      this.emitUnaryPrefixOperator(node);
    }
    this.emitExpression(value, info.precedence);
    if (isPostfix) {
      this.emit(info.text);
    }
    if (info.precedence < precedence) {
      this.emit(')');
    }
  };
  base.Emitter.prototype.emitBinary = function(node, precedence) {
    var info = operatorInfo.get(node.kind);
    if (info.precedence < precedence) {
      this.emit('(');
    }
    this.emitExpression(node.binaryLeft(), in_Precedence.incrementIfRightAssociative(info.precedence, info.associativity));
    this.emit(' ' + info.text + ' ');
    this.emitExpression(node.binaryRight(), in_Precedence.incrementIfLeftAssociative(info.precedence, info.associativity));
    if (info.precedence < precedence) {
      this.emit(')');
    }
  };
  base.Emitter.prototype.emitIndex = function(node, precedence) {
    this.emitExpression(node.binaryLeft(), Precedence.MEMBER);
    this.emit('[');
    this.emitExpression(node.binaryRight(), Precedence.LOWEST);
    this.emit(']');
  };
  base.Emitter.prototype.emitTernary = function(node, precedence) {
    if (Precedence.ASSIGN < precedence) {
      this.emit('(');
    }
    this.emitExpression(node.ternaryLeft(), Precedence.MEMBER);
    this.emit('[');
    this.emitExpression(node.ternaryMiddle(), Precedence.LOWEST);
    this.emit('] = ');
    this.emitExpression(node.ternaryRight(), Precedence.ASSIGN);
    if (Precedence.ASSIGN < precedence) {
      this.emit(')');
    }
  };
  base.Emitter.prototype.emitDot = function(node) {
    this.emitExpression(node.dotTarget(), Precedence.MEMBER);
    this.emit('.');
    this.emit(this.mangleName(node.symbol));
  };
  base.Emitter.prototype.emitCall = function(node, precedence) {
    var value = node.callValue();
    if (value.kind === NodeKind.TYPE) {
      this.emit('new ');
    }
    this.emitExpression(value, Precedence.UNARY_POSTFIX);
    this.emit('(');
    this.emitCommaSeparatedExpressions(node.callArguments());
    this.emit(')');
  };
  base.Emitter.prototype.emitParenthesizedCast = function(node, precedence) {
    if (Precedence.UNARY_PREFIX < precedence) {
      this.emit('(');
    }
    this.emit('(');
    this.emitNormalType(node.castType().type);
    this.emit(')');
    this.emitExpression(node.castValue(), Precedence.UNARY_PREFIX);
    if (Precedence.UNARY_PREFIX < precedence) {
      this.emit(')');
    }
  };
  base.Emitter.prototype.emitCast = function(node, precedence) {
    if (node.kind === NodeKind.CAST) {
      this.emitParenthesizedCast(node, precedence);
    } else {
      this.emitExpression(node.castValue(), precedence);
    }
  };
  base.Emitter.prototype.emitList = function(node) {
    this.emit('[');
    this.emitCommaSeparatedExpressions(node.listValues());
    this.emit(']');
  };
  base.Emitter.prototype.emitSuperCall = function(node) {
    this.emit('super(');
    this.emitCommaSeparatedExpressions(node.superCallArguments());
    this.emit(')');
  };
  base.Emitter.prototype.emitName = function(node) {
    var symbol = node.symbol;
    this.emit(symbol !== null ? in_SymbolKind.isInstance(symbol.kind) ? this.mangleName(symbol) : this.fullName(symbol) : node.asString());
  };
  base.Emitter.prototype.emitThis = function() {
    this.emit('this');
  };
  base.Emitter.prototype.emitHook = function(node, precedence) {
    if (Precedence.ASSIGN < precedence) {
      this.emit('(');
    }
    this.emitExpression(node.hookTest(), Precedence.LOGICAL_OR);
    this.emit(' ? ');
    this.emitExpression(node.hookTrue(), Precedence.ASSIGN);
    this.emit(' : ');
    this.emitExpression(node.hookFalse(), Precedence.ASSIGN);
    if (Precedence.ASSIGN < precedence) {
      this.emit(')');
    }
  };
  base.Emitter.prototype.emitNull = function() {
    this.emit('null');
  };
  base.Emitter.prototype.emitBool = function(node) {
    this.emit(node.asBool().toString());
  };
  base.Emitter.prototype.emitInt = function(node, precedence) {
    if (node.type.isEnum() && node.symbol !== null) {
      this.emitName(node);
    } else {
      this.emit(node.asInt().toString());
    }
  };
  base.Emitter.prototype.emitReal = function(node) {
    this.emit(node.asDouble().toString());
  };
  base.Emitter.prototype.emitString = function(node) {
    this.emit(quoteString(node.asString(), 34));
  };
  base.Emitter.prototype.emitNormalType = function(type) {
    this.emitType(type);
  };
  base.Emitter.prototype.emitType = function(type) {
    if (type.isFunction()) {
      throw new Error('assert !type.isFunction(); (src/emitters/base.sk:542:7)');
    }
    this.emit(this.fullName(type.symbol));
    if (type.isParameterized()) {
      this.emit('<');
      for (var i = 0; i < type.substitutions.length; i = i + 1 | 0) {
        if (i > 0) {
          this.emit(', ');
        }
        this.emitNormalType(type.substitutions[i]);
      }
      this.emit('>');
    }
  };
  base.Emitter.prototype.mangleName = function(symbol) {
    if (symbol.kind === SymbolKind.CONSTRUCTOR_FUNCTION) {
      return this.mangleName(symbol.enclosingSymbol);
    }
    if (this.isKeyword.has(symbol.name) && !symbol.isImport()) {
      return '_' + symbol.name + '_';
    }
    return symbol.name;
  };
  base.Emitter.prototype.useDoubleColonForEnclosingSymbols = function() {
    return false;
  };
  base.Emitter.prototype.fullName = function(symbol) {
    var name = this.mangleName(symbol);
    if (symbol.enclosingSymbol !== null && symbol.enclosingSymbol.kind !== SymbolKind.GLOBAL_NAMESPACE && !in_SymbolKind.isParameter(symbol.kind)) {
      return this.fullName(symbol.enclosingSymbol) + (this.useDoubleColonForEnclosingSymbols() ? '::' : '.') + name;
    }
    return name;
  };
  var cpp = {};
  cpp.Pass = {
    NONE: 0,
    FORWARD_DECLARE_TYPES: 1,
    FORWARD_DECLARE_CODE: 2,
    IMPLEMENT_CODE: 3
  };
  cpp.CppEmitType = {
    BARE: 0,
    NORMAL: 1,
    DECLARATION: 2
  };
  cpp.Emitter = function(_0) {
    base.Emitter.call(this, _0);
    this.namespaceStack = [];
    this.usedAssert = false;
    this.pass = cpp.Pass.NONE;
  };
  $extends(cpp.Emitter, base.Emitter);
  cpp.Emitter.prototype.extension = function() {
    return 'cpp';
  };
  cpp.Emitter.prototype.visitProgram = function(node) {
    var collector = new Collector(node, SortTypes.SORT_BY_INHERITANCE_AND_CONTAINMENT);
    this.pass = cpp.Pass.FORWARD_DECLARE_TYPES;
    this.visitCollector(collector);
    this.adjustNamespace(null);
    this.forceEmitExtraNewline();
    this.pass = cpp.Pass.FORWARD_DECLARE_CODE;
    this.visitCollector(collector);
    this.adjustNamespace(null);
    this.forceEmitExtraNewline();
    this.pass = cpp.Pass.IMPLEMENT_CODE;
    this.visitCollector(collector);
    this.adjustNamespace(null);
    var headers = '';
    if (this.usedAssert) {
      headers += '#include <cassert>\n';
    }
    if (headers !== '') {
      this.output.contents = headers + '\n' + this.output.contents;
    }
  };
  cpp.Emitter.prototype.shouldEmitExtraNewlineBetween = function(before, after) {
    if (this.pass === cpp.Pass.FORWARD_DECLARE_TYPES) {
      return before === NodeKind.NAMESPACE || after === NodeKind.NAMESPACE || in_NodeKind.isEnum(before) || in_NodeKind.isEnum(after);
    }
    return base.Emitter.prototype.shouldEmitExtraNewlineBetween.call(this, before, after) && (this.pass !== cpp.Pass.FORWARD_DECLARE_CODE || !in_NodeKind.isFunction(before) || !in_NodeKind.isFunction(after));
  };
  cpp.Emitter.prototype.emitTypeParameter = function(symbol) {
    this.emit('typename ' + this.mangleName(symbol));
  };
  cpp.Emitter.prototype.emitTypeParameters = function(symbol) {
    if (symbol.hasParameters()) {
      this.emit(this.indent + 'template ');
      base.Emitter.prototype.emitTypeParameters.call(this, symbol);
      this.emit('\n');
    }
  };
  cpp.Emitter.prototype.emitEnumValues = function(symbol) {
    var members = symbol.type.members.values();
    var isEnumFlags = symbol.kind === SymbolKind.ENUM_FLAGS;
    var isFirst = true;
    var previous = -1;
    for (var i = 0; i < members.length; i = i + 1 | 0) {
      var member = members[i].symbol;
      if (member.isEnumValue()) {
        if (isFirst) {
          isFirst = false;
        } else {
          this.emit(',\n');
        }
        var value = member.constant.asInt();
        this.emit(this.indent + this.mangleName(member));
        if (isEnumFlags || value !== (previous + 1 | 0)) {
          this.emit(' = ' + value);
        }
        previous = value;
      }
    }
    if (!isFirst) {
      this.emit('\n');
    }
  };
  cpp.Emitter.prototype.emitTypeDeclaration = function(symbol) {
    if (in_SymbolKind.isObject(symbol.kind)) {
      if (this.pass !== cpp.Pass.IMPLEMENT_CODE) {
        this.adjustNamespace(symbol);
        this.emitExtraNewlineBefore(symbol.node.kind);
        this.emitTypeParameters(symbol);
        this.emit(this.indent + 'struct ' + this.mangleName(symbol));
        if (this.pass === cpp.Pass.FORWARD_DECLARE_CODE) {
          if (symbol.type.hasRelevantTypes()) {
            var types = symbol.type.relevantTypes;
            this.emit(' : ');
            for (var i = 0; i < types.length; i = i + 1 | 0) {
              if (i > 0) {
                this.emit(', ');
              }
              this.emitCppType(types[i], cpp.CppEmitType.BARE);
            }
          }
          this.emit(' {\n');
          this.increaseIndent();
          this.emitTypeMembers(symbol);
          this.decreaseIndent();
          this.emit(this.indent + '}');
        }
        this.emit(';\n');
        this.emitExtraNewlineAfter(symbol.node.kind);
      } else {
        this.emitTypeMembers(symbol);
      }
    } else if (symbol.kind === SymbolKind.ENUM) {
      if (this.pass === cpp.Pass.FORWARD_DECLARE_TYPES) {
        this.adjustNamespace(symbol);
        this.emitExtraNewlineBefore(NodeKind.ENUM);
        this.emit(this.indent + 'enum struct ' + this.mangleName(symbol) + ' {\n');
        this.increaseIndent();
        this.emitEnumValues(symbol);
        this.decreaseIndent();
        this.emit(this.indent + '};\n');
        this.emitExtraNewlineAfter(NodeKind.ENUM);
      }
    } else if (symbol.kind === SymbolKind.ENUM_FLAGS) {
      if (this.pass === cpp.Pass.FORWARD_DECLARE_TYPES) {
        this.adjustNamespace(symbol);
        this.emitExtraNewlineBefore(NodeKind.ENUM_FLAGS);
        this.emit(this.indent + 'namespace ' + this.mangleName(symbol) + ' {\n');
        this.increaseIndent();
        this.emit(this.indent + 'enum {\n');
        this.increaseIndent();
        this.emitEnumValues(symbol);
        this.decreaseIndent();
        this.emit(this.indent + '};\n');
        this.decreaseIndent();
        this.emit(this.indent + '}\n');
        this.emitExtraNewlineAfter(NodeKind.ENUM_FLAGS);
      }
    }
  };
  cpp.Emitter.prototype.emitFunction = function(symbol) {
    if (this.pass !== cpp.Pass.FORWARD_DECLARE_TYPES) {
      var node = symbol.node;
      var block = node.functionBlock();
      if (block !== null || this.pass === cpp.Pass.FORWARD_DECLARE_CODE) {
        this.adjustNamespace(this.pass === cpp.Pass.FORWARD_DECLARE_CODE ? symbol : null);
        this.emitExtraNewlineBefore(node.kind);
        this.emitTypeParameters(symbol);
        this.emit(this.indent);
        if (this.pass === cpp.Pass.FORWARD_DECLARE_CODE) {
          if (symbol.isStatic()) {
            this.emit('static ');
          }
          if (symbol.isVirtual()) {
            this.emit('virtual ');
          }
        }
        if (symbol.kind !== SymbolKind.CONSTRUCTOR_FUNCTION) {
          this.emitCppType(symbol.type.resultType(), cpp.CppEmitType.DECLARATION);
        }
        this.emit(this.pass === cpp.Pass.FORWARD_DECLARE_CODE ? this.mangleName(symbol) : this.fullName(symbol));
        this.emitFunctionArguments(symbol);
        if (block === null) {
          this.emit(' = 0;');
        } else if (this.pass === cpp.Pass.FORWARD_DECLARE_CODE) {
          this.emit(';');
        } else {
          if (symbol.kind === SymbolKind.CONSTRUCTOR_FUNCTION) {
            var superInitializer = node.superInitializer();
            var memberInitializers = node.memberInitializers();
            var superCallArguments = superInitializer !== null ? superInitializer.superCallArguments() : null;
            if (superInitializer !== null && superCallArguments.length > 0 || memberInitializers !== null && memberInitializers.hasChildren()) {
              this.emit(' : ');
              if (superInitializer !== null && superCallArguments.length > 0) {
                this.emit(this.fullName(superInitializer.symbol) + '(');
                this.emitCommaSeparatedExpressions(superInitializer.superCallArguments());
                this.emit(')');
                if (memberInitializers !== null && memberInitializers.hasChildren()) {
                  this.emit(', ');
                }
              }
              if (memberInitializers !== null) {
                for (var i = 0; i < memberInitializers.children.length; i = i + 1 | 0) {
                  var initializer = memberInitializers.children[i];
                  if (i > 0) {
                    this.emit(', ');
                  }
                  this.emit(this.mangleName(initializer.symbol) + '(');
                  this.emitExpression(initializer.memberInitializerValue(), Precedence.LOWEST);
                  this.emit(')');
                }
              }
            }
          }
          this.emitBlock(block);
        }
        this.emit('\n');
        this.emitExtraNewlineAfter(node.kind);
      }
    }
  };
  cpp.Emitter.prototype.emitTypeBeforeVariable = function(symbol) {
    this.emitCppType(symbol.type, cpp.CppEmitType.DECLARATION);
  };
  cpp.Emitter.prototype.emitVariable = function(symbol) {
    if (this.pass !== cpp.Pass.FORWARD_DECLARE_TYPES && (this.pass === cpp.Pass.FORWARD_DECLARE_CODE || symbol.kind !== SymbolKind.INSTANCE_VARIABLE)) {
      this.adjustNamespace(this.pass === cpp.Pass.FORWARD_DECLARE_CODE ? symbol : null);
      this.emitExtraNewlineBefore(symbol.node.kind);
      this.emit(this.indent);
      if (this.pass === cpp.Pass.FORWARD_DECLARE_CODE && in_SymbolKind.isGlobal(symbol.kind)) {
        this.emit(symbol.isStatic() ? 'static ' : 'extern ');
      }
      this.emitTypeBeforeVariable(symbol);
      if (this.pass === cpp.Pass.FORWARD_DECLARE_CODE) {
        this.emit(this.mangleName(symbol));
      } else {
        this.emit(this.fullName(symbol));
        this.emitAfterVariable(symbol.node);
      }
      this.emit(';\n');
      this.emitExtraNewlineAfter(symbol.node.kind);
    }
  };
  cpp.Emitter.prototype.emitFunctionArgument = function(symbol) {
    this.emitCppType(symbol.type, cpp.CppEmitType.DECLARATION);
    this.emit(this.mangleName(symbol));
    this.emitAfterVariable(symbol.node);
  };
  cpp.Emitter.prototype.emitAssert = function(node) {
    this.emit(this.indent + 'assert(');
    this.emitExpression(node.assertValue(), Precedence.LOWEST);
    this.emit(');\n');
    this.usedAssert = true;
  };
  cpp.Emitter.prototype.emitBinary = function(node, precedence) {
    if (node.parent.kind === NodeKind.LOGICAL_OR && node.kind === NodeKind.LOGICAL_AND || node.parent.kind === NodeKind.BITWISE_OR && node.kind === NodeKind.BITWISE_AND) {
      precedence = Precedence.MEMBER;
    }
    base.Emitter.prototype.emitBinary.call(this, node, precedence);
  };
  cpp.Emitter.prototype.emitNull = function() {
    this.emit('nullptr');
  };
  cpp.Emitter.prototype.emitReal = function(node) {
    base.Emitter.prototype.emitReal.call(this, node);
    if (node.kind === NodeKind.FLOAT) {
      this.emit('f');
    }
  };
  cpp.Emitter.prototype.emitDot = function(node) {
    var target = node.dotTarget();
    this.emitExpression(target, Precedence.MEMBER);
    this.emit(target.type.isReference() ? '->' : '.');
    this.emit(this.mangleName(node.symbol));
  };
  cpp.Emitter.prototype.emitCall = function(node, precedence) {
    var wrap = node.callValue().kind === NodeKind.TYPE && precedence === Precedence.MEMBER;
    if (wrap) {
      this.emit('(');
    }
    base.Emitter.prototype.emitCall.call(this, node, precedence);
    if (wrap) {
      this.emit(')');
    }
  };
  cpp.Emitter.prototype.emitCast = function(node, precedence) {
    if (node.type.isInt(this.cache) && node.castValue().type.isRegularEnum()) {
      this.emitParenthesizedCast(node, precedence);
    } else {
      base.Emitter.prototype.emitCast.call(this, node, precedence);
    }
  };
  cpp.Emitter.prototype.emitInt = function(node, precedence) {
    if (node.type.isEnum() && node.symbol !== null) {
      this.emitName(node);
    } else if (node.type.isRegularEnum()) {
      if (Precedence.UNARY_PREFIX < precedence) {
        this.emit('(');
      }
      this.emit('(');
      this.emitNormalType(node.type);
      this.emit(')');
      this.emit(node.asInt().toString());
      if (Precedence.UNARY_PREFIX < precedence) {
        this.emit(')');
      }
    } else {
      this.emit(node.asInt().toString());
    }
  };
  cpp.Emitter.prototype.emitList = function(node) {
    var values = node.listValues();
    if (values.length > 0) {
      this.emit('new ');
      this.emitCppType(node.type, cpp.CppEmitType.BARE);
      this.emit(' { ');
      this.emitCommaSeparatedExpressions(values);
      this.emit(' }');
    } else {
      this.emit('new ');
      this.emitCppType(node.type, cpp.CppEmitType.BARE);
      this.emit('()');
    }
  };
  cpp.Emitter.prototype.emitSuperCall = function(node) {
    this.emit(this.fullName(node.symbol));
    this.emit('(');
    this.emitCommaSeparatedExpressions(node.superCallArguments());
    this.emit(')');
  };
  cpp.Emitter.prototype.emitNormalType = function(type) {
    this.emitCppType(type, cpp.CppEmitType.NORMAL);
  };
  cpp.Emitter.prototype.emitCppType = function(type, mode) {
    if (type.isEnumFlags()) {
      this.emit('int');
    } else {
      this.emitType(type);
    }
    if (type.isReference() && mode !== cpp.CppEmitType.BARE) {
      this.emit(' *');
    } else if (mode === cpp.CppEmitType.DECLARATION) {
      this.emit(' ');
    }
  };
  cpp.Emitter.prototype.useDoubleColonForEnclosingSymbols = function() {
    return true;
  };
  cpp.Emitter.prototype.adjustNamespace = function(symbol) {
    var names = [];
    while (symbol !== null && symbol.kind !== SymbolKind.GLOBAL_NAMESPACE) {
      if (symbol.kind === SymbolKind.NAMESPACE) {
        names.unshift(this.mangleName(symbol));
      }
      symbol = symbol.enclosingSymbol;
    }
    var n = this.namespaceStack.length < names.length ? this.namespaceStack.length : names.length;
    var i = 0;
    for (i = 0; i < n; i = i + 1 | 0) {
      if (this.namespaceStack[i] !== names[i]) {
        break;
      }
    }
    while (this.namespaceStack.length > i) {
      this.namespaceStack.pop();
      this.decreaseIndent();
      this.emit(this.indent + '}\n');
      this.emitExtraNewlineAfter(NodeKind.NAMESPACE);
    }
    while (this.namespaceStack.length < names.length) {
      var name = names[this.namespaceStack.length];
      this.emitExtraNewlineBefore(NodeKind.NAMESPACE);
      this.emit(this.indent + 'namespace ' + name + ' {\n');
      this.increaseIndent();
      this.namespaceStack.push(name);
    }
  };
  cpp.Emitter.prototype.createIsKeyword = function() {
    var result = new StringMap();
    result.set('alignas', true);
    result.set('alignof', true);
    result.set('and', true);
    result.set('and_eq', true);
    result.set('asm', true);
    result.set('auto', true);
    result.set('bitand', true);
    result.set('bitor', true);
    result.set('bool', true);
    result.set('break', true);
    result.set('case', true);
    result.set('catch', true);
    result.set('char', true);
    result.set('char16_t', true);
    result.set('char32_t', true);
    result.set('class', true);
    result.set('compl', true);
    result.set('const', true);
    result.set('const_cast', true);
    result.set('constexpr', true);
    result.set('continue', true);
    result.set('decltype', true);
    result.set('default', true);
    result.set('delete', true);
    result.set('do', true);
    result.set('double', true);
    result.set('dynamic_cast', true);
    result.set('else', true);
    result.set('enum', true);
    result.set('explicit', true);
    result.set('export', true);
    result.set('extern', true);
    result.set('false', true);
    result.set('float', true);
    result.set('for', true);
    result.set('friend', true);
    result.set('goto', true);
    result.set('if', true);
    result.set('inline', true);
    result.set('int', true);
    result.set('long', true);
    result.set('mutable', true);
    result.set('namespace', true);
    result.set('new', true);
    result.set('noexcept', true);
    result.set('not', true);
    result.set('not_eq', true);
    result.set('NULL', true);
    result.set('nullptr', true);
    result.set('operator', true);
    result.set('or', true);
    result.set('or_eq', true);
    result.set('private', true);
    result.set('protected', true);
    result.set('public', true);
    result.set('register', true);
    result.set('reinterpret_cast', true);
    result.set('return', true);
    result.set('short', true);
    result.set('signed', true);
    result.set('sizeof', true);
    result.set('static', true);
    result.set('static_assert', true);
    result.set('static_cast', true);
    result.set('struct', true);
    result.set('switch', true);
    result.set('template', true);
    result.set('this', true);
    result.set('thread_local', true);
    result.set('throw', true);
    result.set('true', true);
    result.set('try', true);
    result.set('typedef', true);
    result.set('typeid', true);
    result.set('typename', true);
    result.set('union', true);
    result.set('unsigned', true);
    result.set('using', true);
    result.set('virtual', true);
    result.set('void', true);
    result.set('volatile', true);
    result.set('wchar_t', true);
    result.set('while', true);
    result.set('xor', true);
    result.set('xor_eq', true);
    return result;
  };
  json = {};
  json.Emitter = function(_0) {
    this.options = _0;
  };
  json.Emitter.prototype.emitProgram = function(program) {
    var outputs = [];
    if (this.options.outputDirectory === '') {
      outputs.push(new Source(this.options.outputFile, json.dump(program) + '\n'));
    } else {
      for (var i = 0; i < program.children.length; i = i + 1 | 0) {
        var file = program.children[i];
        outputs.push(new Source(joinPath(this.options.outputDirectory, file.range.source.name + '.json'), json.dump(file) + '\n'));
      }
    }
    return outputs;
  };
  json.DumpVisitor = function() {
    this.result = '';
    this.indent = '';
  };
  json.DumpVisitor.prototype.visit = function(node) {
    if (node === null) {
      this.result += 'null';
      return;
    }
    var outer = this.indent;
    this.indent += '  ';
    this.result += '{\n' + this.indent + '"kind": ' + simpleQuote(in_NodeKind.prettyPrint(node.kind));
    if (node.content !== null) {
      this.result += ',\n' + this.indent + '"content": ';
      switch (node.content.type()) {
      case 1:
        this.result += node.asInt().toString();
        break;
      case 0:
        this.result += node.asBool().toString();
        break;
      case 2:
        this.result += node.asDouble().toString();
        break;
      case 3:
        this.result += quoteString(node.asString(), 34);
        break;
      }
    }
    if (node.hasChildren()) {
      this.result += ',\n' + this.indent + '"children": [';
      var inner = this.indent;
      this.indent += '  ';
      for (var i = 0; i < node.children.length; i = i + 1 | 0) {
        if (i > 0) {
          this.result += ',';
        }
        this.result += '\n' + this.indent;
        this.visit(node.children[i]);
      }
      this.indent = inner;
      this.result += '\n' + this.indent + ']';
    }
    this.indent = outer;
    this.result += '\n' + this.indent + '}';
  };
  lisp = {};
  lisp.Emitter = function(_0) {
    this.options = _0;
  };
  lisp.Emitter.prototype.emitProgram = function(program) {
    var outputs = [];
    if (this.options.outputDirectory === '') {
      outputs.push(new Source(this.options.outputFile, lisp.dump(program) + '\n'));
    } else {
      for (var i = 0; i < program.children.length; i = i + 1 | 0) {
        var file = program.children[i];
        outputs.push(new Source(joinPath(this.options.outputDirectory, file.range.source.name + '.lisp'), lisp.dump(file) + '\n'));
      }
    }
    return outputs;
  };
  lisp.DumpVisitor = function() {
    this.result = '';
    this.indent = '';
  };
  lisp.DumpVisitor.prototype.visit = function(node) {
    if (node === null) {
      this.result += 'nil';
      return;
    }
    this.result += '(' + in_NodeKind.prettyPrint(node.kind);
    if (node.content !== null) {
      switch (node.content.type()) {
      case 1:
        this.result += ' ' + node.asInt();
        break;
      case 0:
        this.result += ' ' + node.asBool();
        break;
      case 2:
        this.result += ' ' + node.asDouble();
        break;
      case 3:
        this.result += ' ' + quoteString(node.asString(), 34);
        break;
      }
    }
    if (node.hasChildren()) {
      var old = this.indent;
      this.indent += '  ';
      for (var i = 0; i < node.children.length; i = i + 1 | 0) {
        this.result += '\n' + this.indent;
        this.visit(node.children[i]);
      }
      this.indent = old;
    }
    this.result += ')';
  };
  xml = {};
  xml.Emitter = function(_0) {
    this.options = _0;
  };
  xml.Emitter.prototype.emitProgram = function(program) {
    var outputs = [];
    if (this.options.outputDirectory === '') {
      outputs.push(new Source(this.options.outputFile, xml.dump(program) + '\n'));
    } else {
      for (var i = 0; i < program.children.length; i = i + 1 | 0) {
        var file = program.children[i];
        outputs.push(new Source(joinPath(this.options.outputDirectory, file.range.source.name + '.xml'), xml.dump(file) + '\n'));
      }
    }
    return outputs;
  };
  xml.DumpVisitor = function() {
    this.result = '';
    this.indent = '';
  };
  xml.DumpVisitor.prototype.visit = function(node) {
    if (node === null) {
      this.result += '<null/>';
      return;
    }
    this.result += '<' + in_NodeKind.prettyPrint(node.kind);
    if (node.content !== null) {
      this.result += ' content=';
      switch (node.content.type()) {
      case 1:
        this.result += simpleQuote(node.asInt().toString());
        break;
      case 0:
        this.result += simpleQuote(node.asBool().toString());
        break;
      case 2:
        this.result += simpleQuote(node.asDouble().toString());
        break;
      case 3:
        this.result += quoteString(node.asString(), 34);
        break;
      }
    }
    if (node.hasChildren()) {
      this.result += '>';
      var inner = this.indent;
      this.indent += '  ';
      for (var i = 0; i < node.children.length; i = i + 1 | 0) {
        this.result += '\n' + this.indent;
        this.visit(node.children[i]);
      }
      this.indent = inner;
      this.result += '\n' + this.indent + '</' + in_NodeKind.prettyPrint(node.kind) + '>';
    } else {
      this.result += '/>';
    }
  };
  var in_io = {};
  in_io.Color = {
    DEFAULT: 0,
    BOLD: 1,
    GRAY: 90,
    RED: 91,
    GREEN: 92,
    MAGENTA: 95
  };
  frontend = {};
  frontend.Flags = function() {
    this.help = false;
    this.verbose = false;
    this.target = '';
    this.outputFile = '';
    this.jsMinify = false;
    this.jsSourceMap = false;
    this.optimize = false;
  };
  var js = {};
  js.ClusterState = {
    NONE: 0,
    VAR_CHAIN: 1,
    COMPOUND_NAME: 2
  };
  js.AfterToken = {
    AFTER_KEYWORD: 0,
    AFTER_PARENTHESIS: 1
  };
  js.BracesMode = {
    MUST_KEEP_BRACES: 0,
    CAN_OMIT_BRACES: 1
  };
  js.Emitter = function(_0) {
    this.newline = '\n';
    this.space = ' ';
    this.indent = '';
    this.currentLine = 0;
    this.currentColumn = 0;
    this.needsSemicolon = false;
    this.currentSource = null;
    this.patcher = null;
    this.options = null;
    this.generator = new SourceMapGenerator();
    this.toStringTarget = null;
    this.resolver = _0;
  };
  js.Emitter.prototype.patchProgram = function(program) {
    if (js.Emitter.isKeyword === null) {
      js.Emitter.isKeyword = js.Emitter.createIsKeyword();
    }
    this.options = this.resolver.options;
    if (this.options.jsMinify) {
      this.newline = '';
      this.space = '';
    }
    this.patcher = new js.Patcher(this.resolver);
    this.patcher.run(program);
  };
  js.Emitter.prototype.emitProgram = function(program) {
    this.patchProgram(program);
    var collector = new Collector(program, SortTypes.SORT_BY_INHERITANCE_AND_CONTAINMENT);
    this.currentSource = new Source(this.options.outputFile, '');
    for (var i = 0; i < this.options.prepend.length; i = i + 1 | 0) {
      this.appendSource(this.options.prepend[i]);
    }
    this.emit(this.indent + '(function()' + this.space + '{' + this.newline);
    this.increaseIndent();
    if (this.patcher.needMathImul) {
      this.emit(this.indent + 'var ' + this.patcher.imul + in_string.replace(' = Math.imul || function(a, b) {', ' ', this.space) + this.newline);
      this.increaseIndent();
      this.emit(this.indent + 'var ' + in_string.replace('ah = a >>> 16, al = a & 65535, bh = b >>> 16, bl = b & 65535;', ' ', this.space) + this.newline);
      this.emit(this.indent + 'return ' + in_string.replace('al * bl + (ah * bl + al * bh << 16) | 0', ' ', this.space));
      this.emitSemicolonAfterStatement();
      this.decreaseIndent();
      this.emit(this.indent + '};' + this.newline);
      this.needsSemicolon = false;
    }
    if (this.patcher.needExtends) {
      var derived = this.options.jsMangle ? 'd' : 'derived';
      var base = this.options.jsMangle ? 'b' : 'base';
      this.emit(this.indent + 'function ' + this.patcher.$extends + '(' + derived + ',' + this.space + base + ')' + this.space + '{' + this.newline);
      this.increaseIndent();
      this.emit(this.indent + derived + '.prototype' + this.space + '=' + this.space + 'Object.create(' + base + '.prototype);' + this.newline);
      this.emit(this.indent + derived + '.prototype.constructor' + this.space + '=' + this.space + derived);
      this.emitSemicolonAfterStatement();
      this.decreaseIndent();
      this.emit(this.indent + '}' + this.newline);
      this.needsSemicolon = false;
    }
    for (var i = 0; i < collector.typeSymbols.length; i = i + 1 | 0) {
      var type = collector.typeSymbols[i].type;
      if (type.isNamespace()) {
        if (!type.symbol.isImport()) {
          this.maybeEmitMinifedNewline();
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
        var symbol = members[j].symbol;
        if (symbol.enclosingSymbol === type.symbol && symbol.node !== null) {
          if (in_SymbolKind.isFunction(symbol.kind) && symbol.kind !== SymbolKind.CONSTRUCTOR_FUNCTION) {
            this.emitNode(symbol.node);
          } else if (symbol.kind === SymbolKind.GLOBAL_VARIABLE) {
            collector.freeVariableSymbols.push(symbol);
          }
        }
      }
    }
    for (var i = 0; i < collector.freeFunctionSymbols.length; i = i + 1 | 0) {
      this.emitNode(collector.freeFunctionSymbols[i].node);
    }
    var variables = [];
    for (var i = 0; i < collector.freeVariableSymbols.length; i = i + 1 | 0) {
      var variable = collector.freeVariableSymbols[i].node;
      if (this.options.jsMinify) {
        variables.push(variable);
      } else {
        this.emitVariables([variable]);
      }
    }
    this.emitVariables(variables);
    this.decreaseIndent();
    this.emit(this.indent + '}());\n');
    for (var i = 0; i < this.options.append.length; i = i + 1 | 0) {
      this.appendSource(this.options.append[i]);
    }
    if (this.options.jsSourceMap) {
      this.currentSource.contents = this.currentSource.contents + '/';
      if (this.options.outputFile === '') {
        this.currentSource.contents = this.currentSource.contents + '/# sourceMappingURL=data:application/json;base64,' + encodeBase64(this.generator.toString()) + '\n';
      } else {
        var name = this.options.outputFile + '.map';
        this.currentSource.contents = this.currentSource.contents + '/# sourceMappingURL=' + splitPath(name).entry + '\n';
        return [this.currentSource, new Source(name, this.generator.toString())];
      }
    }
    return [this.currentSource];
  };
  js.Emitter.prototype.appendSource = function(source) {
    if (this.currentColumn > 0) {
      this.emit('\n');
    }
    this.currentSource.contents += source.contents;
    if (this.options.jsSourceMap) {
      for (var i = 0, n = source.lineCount(); i < n; i = i + 1 | 0) {
        this.generator.addMapping(source, i, 0, this.currentLine, 0);
        this.currentLine = this.currentLine + 1 | 0;
      }
    }
    if (source.contents.charCodeAt(source.contents.length - 1 | 0) !== 10) {
      this.emit('\n');
    }
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
    if (!this.options.jsMinify) {
      this.indent += '  ';
    }
  };
  js.Emitter.prototype.decreaseIndent = function() {
    if (!this.options.jsMinify) {
      this.indent = this.indent.slice(2, this.indent.length);
    }
  };
  js.Emitter.prototype.emit = function(text) {
    if (this.options.jsMinify || this.options.jsSourceMap) {
      for (var i = 0; i < text.length; i = i + 1 | 0) {
        var c = text.charCodeAt(i);
        if (c === 10) {
          this.currentColumn = 0;
          this.currentLine = this.currentLine + 1 | 0;
        } else {
          this.currentColumn = this.currentColumn + 1 | 0;
        }
      }
    }
    this.currentSource.contents += text;
  };
  js.Emitter.prototype.maybeEmitMinifedNewline = function() {
    if (this.newline === '' && this.currentColumn > 1024) {
      this.emit('\n');
    }
  };
  js.Emitter.prototype.emitSemicolonAfterStatement = function() {
    if (!this.options.jsMinify) {
      this.emit(';\n');
    } else {
      this.needsSemicolon = true;
    }
  };
  js.Emitter.prototype.emitSemicolonIfNeeded = function() {
    if (this.needsSemicolon) {
      this.emit(';');
      this.needsSemicolon = false;
    }
  };
  js.Emitter.prototype.emitStatements = function(nodes) {
    for (var i = 0; i < nodes.length; i = i + 1 | 0) {
      this.emitSemicolonIfNeeded();
      this.maybeEmitMinifedNewline();
      this.emitNode(nodes[i]);
    }
  };
  js.Emitter.prototype.emitCommaSeparatedNodes = function(nodes) {
    for (var i = 0; i < nodes.length; i = i + 1 | 0) {
      if (i > 0) {
        this.emit(',' + this.space);
      }
      this.emitNode(nodes[i]);
    }
  };
  js.Emitter.prototype.emitCommaSeparatedExpressions = function(nodes) {
    for (var i = 0; i < nodes.length; i = i + 1 | 0) {
      if (i > 0) {
        this.emit(',' + this.space);
        this.maybeEmitMinifedNewline();
      }
      this.emitExpression(nodes[i], Precedence.COMMA);
    }
  };
  js.Emitter.prototype.emitArgumentVariables = function(nodes) {
    this.emit('(');
    this.emitCommaSeparatedNodes(nodes);
    this.emit(')');
  };
  js.Emitter.prototype.recursiveEmitIfStatement = function(node) {
    var trueBlock = node.ifTrue();
    var falseBlock = node.ifFalse();
    var trueStatement = trueBlock.blockStatement();
    this.emit('if' + this.space + '(');
    this.emitExpression(node.ifTest(), Precedence.LOWEST);
    this.emit(')');
    this.emitBlock(trueBlock, js.AfterToken.AFTER_PARENTHESIS, falseBlock !== null && trueStatement !== null && trueStatement.kind === NodeKind.IF ? js.BracesMode.MUST_KEEP_BRACES : js.BracesMode.CAN_OMIT_BRACES);
    if (falseBlock !== null) {
      this.emitSemicolonIfNeeded();
      this.emit(this.space + 'else');
      var falseStatement = falseBlock.blockStatement();
      if (falseStatement !== null && falseStatement.kind === NodeKind.IF) {
        this.emit(' ');
        this.addMapping(falseStatement);
        this.recursiveEmitIfStatement(falseStatement);
      } else {
        this.emitBlock(falseBlock, js.AfterToken.AFTER_KEYWORD, js.BracesMode.CAN_OMIT_BRACES);
      }
    }
  };
  js.Emitter.prototype.emitNode = function(node) {
    this.addMapping(node);
    switch (node.kind) {
    case 4:
      this.emitCase(node);
      break;
    case 6:
      this.emitVariables(node.clusterVariables());
      break;
    case 7:
      this.emitNamespace(node);
      break;
    case 8:
    case 9:
      this.emitEnum(node);
      break;
    case 13:
    case 14:
      this.emitFunction(node);
      break;
    case 15:
      this.emitVariable(node);
      break;
    case 18:
      this.emitIf(node);
      break;
    case 19:
      this.emitFor(node);
      break;
    case 20:
      this.emitForEach(node);
      break;
    case 21:
      this.emitWhile(node);
      break;
    case 22:
      this.emitDoWhile(node);
      break;
    case 23:
      this.emitReturn(node);
      break;
    case 24:
      this.emitBreak(node);
      break;
    case 25:
      this.emitContinue(node);
      break;
    case 26:
      this.emitAssert(node);
      break;
    case 28:
      this.emitExpressionStatement(node);
      break;
    case 29:
      this.emitSwitch(node);
      break;
    case 30:
      this.emitModifier(node);
      break;
    case 16:
    case 17:
    case 31:
      break;
    default:
      throw new Error('assert false; (src/js/emitter.sk:329:19)');
      break;
    }
  };
  js.Emitter.prototype.emitBlock = function(node, after, mode) {
    var shouldMinify = mode === js.BracesMode.CAN_OMIT_BRACES && this.options.jsMinify;
    this.addMapping(node);
    if (shouldMinify && !node.hasChildren()) {
      this.emit(';');
    } else if (shouldMinify && node.children.length === 1) {
      if (after === js.AfterToken.AFTER_KEYWORD) {
        this.emit(' ');
      }
      this.emitNode(node.children[0]);
    } else {
      this.emit(this.space + '{' + this.newline);
      if (node.hasChildren()) {
        this.increaseIndent();
        this.emitStatements(node.children);
        this.decreaseIndent();
      }
      this.emit(this.indent + '}');
      this.needsSemicolon = false;
    }
  };
  js.Emitter.prototype.emitCase = function(node) {
    var values = node.caseValues();
    var block = node.caseBlock();
    this.emitSemicolonIfNeeded();
    for (var i = 0; i < values.length; i = i + 1 | 0) {
      this.emit(this.indent + 'case ');
      this.emitExpression(values[i], Precedence.LOWEST);
      this.emit(':' + this.newline);
      this.maybeEmitMinifedNewline();
    }
    if (values.length === 0) {
      this.emit(this.indent + 'default:' + this.newline);
    }
    this.increaseIndent();
    if (block.hasChildren()) {
      this.emitStatements(block.children);
    }
    if (!block.blockAlwaysEndsWithReturn() && (!this.options.jsMinify || !node.isLastChild())) {
      this.emitSemicolonIfNeeded();
      this.emit(this.indent + 'break');
      this.emitSemicolonAfterStatement();
    }
    this.decreaseIndent();
  };
  js.Emitter.prototype.emitVariables = function(variables) {
    var state = js.ClusterState.NONE;
    for (var i = 0; i < variables.length; i = i + 1 | 0) {
      var variable = variables[i];
      var symbol = variable.symbol;
      var isCompoundName = symbol !== null && (js.Emitter.hasCompoundName(symbol) || symbol.isExport());
      if (symbol !== null && (in_SymbolKind.isInstance(symbol.kind) || symbol.isImport()) || isCompoundName && variable.variableValue() === null) {
        continue;
      }
      this.emitSemicolonIfNeeded();
      if (isCompoundName) {
        if (state !== js.ClusterState.NONE) {
          this.emit(';' + this.newline);
        }
        state = js.ClusterState.COMPOUND_NAME;
        this.emit(this.indent);
      } else if (state !== js.ClusterState.VAR_CHAIN) {
        if (state === js.ClusterState.COMPOUND_NAME) {
          this.emit(';' + this.newline);
        }
        this.emit(this.indent + 'var ');
        state = js.ClusterState.VAR_CHAIN;
      } else {
        this.emit(',' + this.space);
        this.maybeEmitMinifedNewline();
      }
      this.emitNode(variable);
    }
    if (state !== js.ClusterState.NONE) {
      this.emitSemicolonAfterStatement();
    }
  };
  js.Emitter.prototype.emitNamespace = function(node) {
    var symbol = node.symbol;
    if (this.options.jsMangle && !symbol.isImportOrExport()) {
      return;
    }
    this.emitSemicolonIfNeeded();
    this.emit(this.indent);
    if (!js.Emitter.hasCompoundName(symbol) && !symbol.isExport()) {
      this.emit('var ');
    }
    this.emit(js.Emitter.fullName(symbol) + this.space + '=' + this.space + '{}');
    this.emitSemicolonAfterStatement();
  };
  js.Emitter.prototype.emitEnum = function(node) {
    var symbol = node.symbol;
    var block = node.declarationBlock();
    if (this.options.foldAllConstants && !symbol.isImportOrExport()) {
      return;
    }
    this.emitSemicolonIfNeeded();
    this.emit(this.indent);
    if (!js.Emitter.hasCompoundName(symbol) && !symbol.isExport()) {
      this.emit('var ');
    }
    this.emit(js.Emitter.fullName(symbol) + this.space + '=' + this.space + '{' + this.newline);
    this.increaseIndent();
    for (var i = 0; i < block.children.length; i = i + 1 | 0) {
      var child = block.children[i].symbol;
      this.emit(this.indent + js.Emitter.mangleName(child) + ':' + this.space + child.constant.asInt());
      if (i !== (block.children.length - 1 | 0)) {
        this.emit(',' + this.newline);
        this.maybeEmitMinifedNewline();
      } else {
        this.emit(this.newline);
      }
    }
    this.decreaseIndent();
    this.emit(this.indent + '}');
    this.emitSemicolonAfterStatement();
  };
  js.Emitter.prototype.emitFunction = function(node) {
    var block = node.functionBlock();
    var symbol = node.symbol;
    if (block === null) {
      return;
    }
    var useFunctionStatement = !js.Emitter.hasCompoundName(symbol) && !symbol.isExport();
    this.emitSemicolonIfNeeded();
    this.emit(useFunctionStatement ? this.indent + 'function ' + js.Emitter.fullName(symbol) : this.indent + js.Emitter.fullName(symbol) + this.space + '=' + this.space + 'function');
    this.emitArgumentVariables(node.functionArguments().children);
    this.emitBlock(block, js.AfterToken.AFTER_PARENTHESIS, js.BracesMode.MUST_KEEP_BRACES);
    if (useFunctionStatement) {
      this.emit(this.newline);
    } else {
      this.emitSemicolonAfterStatement();
    }
    if (node.kind === NodeKind.CONSTRUCTOR) {
      var type = symbol.enclosingSymbol.type;
      if (type.isClass() && type.baseClass() !== null) {
        this.emitSemicolonIfNeeded();
        this.emit(this.indent + this.patcher.$extends + '(' + js.Emitter.fullName(type.symbol) + ',' + this.space + js.Emitter.fullName(type.baseClass().symbol) + ')');
        this.emitSemicolonAfterStatement();
      }
    }
  };
  js.Emitter.prototype.emitVariable = function(node) {
    var value = node.variableValue();
    this.emit(node.symbol === null ? node.declarationName().asString() : js.Emitter.fullName(node.symbol));
    if (value !== null) {
      this.emit(this.space + '=' + this.space);
      this.emitExpression(value, Precedence.COMMA);
    }
  };
  js.Emitter.prototype.emitIf = function(node) {
    this.emit(this.indent);
    this.recursiveEmitIfStatement(node);
    this.emit(this.newline);
  };
  js.Emitter.prototype.emitFor = function(node) {
    var setup = node.forSetup();
    var test = node.forTest();
    var update = node.forUpdate();
    this.emit(this.indent + 'for' + this.space + '(');
    if (setup !== null) {
      if (setup.kind === NodeKind.VARIABLE_CLUSTER) {
        this.emit('var ');
        this.emitCommaSeparatedNodes(setup.clusterVariables());
      } else {
        this.emitExpression(setup, Precedence.LOWEST);
      }
    }
    if (test !== null) {
      this.emit(';' + this.space);
      this.emitExpression(test, Precedence.LOWEST);
    } else {
      this.emit(';');
    }
    if (update !== null) {
      this.emit(';' + this.space);
      this.emitExpression(update, Precedence.LOWEST);
    } else {
      this.emit(';');
    }
    this.emit(')');
    this.emitBlock(node.forBlock(), js.AfterToken.AFTER_PARENTHESIS, js.BracesMode.CAN_OMIT_BRACES);
    this.emit(this.newline);
  };
  js.Emitter.prototype.emitForEach = function(node) {
    var variable = node.forEachVariable();
    var value = node.forEachValue();
    this.emit(this.indent + 'for' + this.space + '(var ');
    this.emitNode(variable);
    this.emit(' in ');
    this.emitExpression(value, Precedence.LOWEST);
    this.emit(')');
    this.emitBlock(node.forEachBlock(), js.AfterToken.AFTER_PARENTHESIS, js.BracesMode.CAN_OMIT_BRACES);
    this.emit(this.newline);
  };
  js.Emitter.prototype.emitWhile = function(node) {
    this.emit(this.indent + 'while' + this.space + '(');
    this.emitExpression(node.whileTest(), Precedence.LOWEST);
    this.emit(')');
    this.emitBlock(node.whileBlock(), js.AfterToken.AFTER_PARENTHESIS, js.BracesMode.CAN_OMIT_BRACES);
    this.emit(this.newline);
  };
  js.Emitter.prototype.emitDoWhile = function(node) {
    this.emit(this.indent + 'do');
    this.emitBlock(node.whileBlock(), js.AfterToken.AFTER_KEYWORD, js.BracesMode.CAN_OMIT_BRACES);
    this.emitSemicolonIfNeeded();
    this.emit(this.space + 'while' + this.space + '(');
    this.emitExpression(node.whileTest(), Precedence.LOWEST);
    this.emit(')');
    this.emitSemicolonAfterStatement();
  };
  js.Emitter.prototype.emitReturn = function(node) {
    var value = node.returnValue();
    this.emit(this.indent);
    if (value !== null) {
      this.emit('return ');
      this.emitExpression(value, Precedence.LOWEST);
    } else {
      this.emit('return');
    }
    this.emitSemicolonAfterStatement();
  };
  js.Emitter.prototype.emitBreak = function(node) {
    this.emit(this.indent + 'break');
    this.emitSemicolonAfterStatement();
  };
  js.Emitter.prototype.emitContinue = function(node) {
    this.emit(this.indent + 'continue');
    this.emitSemicolonAfterStatement();
  };
  js.Emitter.prototype.emitAssert = function(node) {
    var value = node.assertValue();
    value.invertBooleanCondition(this.resolver.cache);
    if (!value.isFalse()) {
      var couldBeFalse = !value.isTrue();
      if (couldBeFalse) {
        this.emit(this.indent + 'if' + this.space + '(');
        this.emitExpression(value, Precedence.LOWEST);
        this.emit(')');
        if (!this.options.jsMinify) {
          this.emit(' {\n');
          this.increaseIndent();
        }
      }
      var text = node.range + ' (' + node.range.locationString() + ')';
      this.emit(this.indent + 'throw new Error(' + this.quoteStringJS(text) + ')');
      this.emitSemicolonAfterStatement();
      if (couldBeFalse && !this.options.jsMinify) {
        this.decreaseIndent();
        this.emit(this.indent + '}\n');
      }
    }
  };
  js.Emitter.prototype.emitExpressionStatement = function(node) {
    this.emit(this.indent);
    this.emitExpression(node.expressionValue(), Precedence.LOWEST);
    this.emitSemicolonAfterStatement();
  };
  js.Emitter.prototype.emitSwitch = function(node) {
    this.emit(this.indent + 'switch' + this.space + '(');
    this.emitExpression(node.switchValue(), Precedence.LOWEST);
    this.emit(')' + this.space + '{' + this.newline);
    this.emitStatements(node.switchCases());
    this.emit(this.indent + '}' + this.newline);
    this.needsSemicolon = false;
  };
  js.Emitter.prototype.emitModifier = function(node) {
    this.emitStatements(node.modifierStatements());
  };
  js.Emitter.prototype.emitExpression = function(node, precedence) {
    this.addMapping(node);
    switch (node.kind) {
    case 32:
      this.emit(node.symbol === null ? node.asString() : js.Emitter.fullName(node.symbol));
      break;
    case 33:
      this.emit(js.Emitter.fullName(node.type.symbol));
      break;
    case 34:
      this.emit('this');
      break;
    case 35:
      this.emitHook(node, precedence);
      break;
    case 36:
      this.emit('null');
      break;
    case 37:
      this.emitBool(node);
      break;
    case 38:
      this.emitInt(node);
      break;
    case 39:
    case 40:
      this.emitDouble(node);
      break;
    case 41:
      this.emit(this.quoteStringJS(node.asString()));
      break;
    case 42:
      this.emitList(node);
      break;
    case 43:
      this.emitDot(node);
      break;
    case 44:
      this.emitCall(node);
      break;
    case 45:
      this.emitSuperCall(node);
      break;
    case 47:
      this.emitSequence(node, precedence);
      break;
    case 51:
      this.emitExpression(node.untypedValue(), precedence);
      break;
    case 70:
      this.emitIndex(node, precedence);
      break;
    case 92:
      this.emitTernary(node, precedence);
      break;
    case 49:
    case 50:
      this.emitExpression(node.castValue(), precedence);
      break;
    case 53:
    case 54:
    case 55:
    case 56:
    case 57:
    case 58:
    case 59:
    case 60:
      this.emitUnary(node, precedence);
      break;
    case 61:
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
    case 62:
    case 63:
    case 64:
    case 65:
    case 66:
    case 67:
    case 68:
    case 69:
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
      this.emitBinary(node, precedence);
      break;
    default:
      throw new Error('assert false; (src/js/emitter.sk:666:11)');
      break;
    }
  };
  js.Emitter.prototype.emitHook = function(node, precedence) {
    if (Precedence.ASSIGN < precedence) {
      this.emit('(');
    }
    this.emitExpression(node.hookTest(), Precedence.LOGICAL_OR);
    this.emit(this.space + '?' + this.space);
    this.emitExpression(node.hookTrue(), Precedence.ASSIGN);
    this.emit(this.space + ':' + this.space);
    this.emitExpression(node.hookFalse(), Precedence.ASSIGN);
    if (Precedence.ASSIGN < precedence) {
      this.emit(')');
    }
  };
  js.Emitter.prototype.emitBool = function(node) {
    if (this.options.jsMangle) {
      this.emit(node.asBool() ? '!0' : '!1');
    } else {
      this.emit(node.asBool() ? 'true' : 'false');
    }
  };
  js.Emitter.prototype.emitInt = function(node) {
    var wrap = node.parent.kind === NodeKind.DOT && node !== this.toStringTarget;
    if (wrap) {
      this.emit('(');
    }
    this.emit(node.asInt().toString());
    if (wrap) {
      this.emit(')');
    }
  };
  js.Emitter.prototype.emitDouble = function(node) {
    var wrap = node.parent.kind === NodeKind.DOT && node !== this.toStringTarget;
    if (wrap) {
      this.emit('(');
    }
    this.emit(node.asDouble().toString());
    if (wrap) {
      this.emit(')');
    }
  };
  js.Emitter.prototype.emitList = function(node) {
    this.emit('[');
    this.emitCommaSeparatedExpressions(node.listValues());
    this.emit(']');
  };
  js.Emitter.prototype.emitDot = function(node) {
    this.emitExpression(node.dotTarget(), Precedence.MEMBER);
    this.emit('.');
    var name = node.dotName();
    this.emit(name.symbol === null ? name.asString() : in_SymbolKind.isInstance(name.symbol.kind) ? js.Emitter.mangleName(name.symbol) : js.Emitter.fullName(name.symbol));
  };
  js.Emitter.prototype.emitCall = function(node) {
    var value = node.callValue();
    if (value.kind === NodeKind.NAME && value.symbol !== null && value.symbol.isOperator()) {
      var name = value.asString();
      if (name === 'sort') {
        this.emitExpression(node.callArguments()[0], Precedence.UNARY_POSTFIX);
        this.emit('.sort(function(comparison) { return function(a, b) { return comparison.compare(a, b); }; }(');
        this.emitExpression(node.callArguments()[1], Precedence.UNARY_POSTFIX);
        this.emit('))');
      } else {
        this.emit(name + ' ');
        this.emitExpression(node.callArguments()[0], Precedence.UNARY_POSTFIX);
      }
    } else {
      if (in_NodeKind.isType(value.kind)) {
        this.emit('new ');
      }
      this.emitExpression(value, Precedence.UNARY_POSTFIX);
      this.emit('(');
      this.emitCommaSeparatedExpressions(node.callArguments());
      this.emit(')');
    }
  };
  js.Emitter.prototype.emitSuperCall = function(node) {
    var $arguments = node.superCallArguments();
    this.emit(js.Emitter.fullName(node.symbol));
    this.emit('.call(this');
    for (var i = 0; i < $arguments.length; i = i + 1 | 0) {
      this.emit(',' + this.space);
      this.emitExpression($arguments[i], Precedence.COMMA);
    }
    this.emit(')');
  };
  js.Emitter.prototype.emitSequence = function(node, precedence) {
    if (Precedence.COMMA <= precedence) {
      this.emit('(');
    }
    this.emitCommaSeparatedExpressions(node.sequenceValues());
    if (Precedence.COMMA <= precedence) {
      this.emit(')');
    }
  };
  js.Emitter.prototype.emitUnary = function(node, precedence) {
    var value = node.unaryValue();
    var info = operatorInfo.get(node.kind);
    if (info.precedence < precedence) {
      this.emit('(');
    }
    var isPostfix = info.precedence === Precedence.UNARY_POSTFIX;
    if (!isPostfix) {
      this.emit(info.text);
      if (node.kind === NodeKind.POSITIVE && (value.kind === NodeKind.POSITIVE || value.kind === NodeKind.PREFIX_INCREMENT) || node.kind === NodeKind.NEGATIVE && (value.kind === NodeKind.NEGATIVE || value.kind === NodeKind.PREFIX_DECREMENT || value.kind === NodeKind.INT && value.asInt() < 0)) {
        this.emit(' ');
      }
    }
    this.emitExpression(value, info.precedence);
    if (isPostfix) {
      this.emit(info.text);
    }
    if (info.precedence < precedence) {
      this.emit(')');
    }
  };
  js.Emitter.prototype.isToStringCall = function(node) {
    if (node.kind === NodeKind.CALL) {
      var value = node.callValue();
      return value.kind === NodeKind.DOT && value.symbol !== null && value.symbol.name === 'toString' && node.callArguments().length === 0;
    }
    return false;
  };
  js.Emitter.prototype.emitBinary = function(node, precedence) {
    var kind = node.kind;
    var left = node.binaryLeft();
    var right = node.binaryRight();
    var info = operatorInfo.get(kind);
    if (info.precedence < precedence) {
      this.emit('(');
    }
    if ((kind === NodeKind.ADD || kind === NodeKind.ASSIGN_ADD) && left.type !== null && left.type.isString(this.resolver.cache) && this.isToStringCall(right)) {
      right = right.callValue().dotTarget();
    } else if (kind === NodeKind.ADD && right.type !== null && right.type.isString(this.resolver.cache) && this.isToStringCall(left)) {
      left = left.callValue().dotTarget();
    }
    this.toStringTarget = left;
    this.emitExpression(left, in_Precedence.incrementIfRightAssociative(info.precedence, info.associativity));
    this.emit(kind === NodeKind.IN ? ' in ' : this.space + (kind === NodeKind.EQUAL ? '===' : kind === NodeKind.NOT_EQUAL ? '!==' : info.text) + this.space);
    if (this.space === '' && (kind === NodeKind.ADD && (right.kind === NodeKind.POSITIVE || right.kind === NodeKind.PREFIX_INCREMENT) || kind === NodeKind.SUBTRACT && (right.kind === NodeKind.NEGATIVE || right.kind === NodeKind.PREFIX_DECREMENT || right.kind === NodeKind.INT && right.asInt() < 0))) {
      this.emit(' ');
    }
    this.toStringTarget = right;
    this.emitExpression(right, in_Precedence.incrementIfLeftAssociative(info.precedence, info.associativity));
    if (info.precedence < precedence) {
      this.emit(')');
    }
  };
  js.Emitter.prototype.isIdentifierString = function(node) {
    if (node.kind === NodeKind.STRING) {
      var value = node.asString();
      for (var i = 0; i < value.length; i = i + 1 | 0) {
        var c = value.charCodeAt(i);
        if ((c < 65 || c > 90) && (c < 97 || c > 122) && c !== 95 && c !== 36 && (i === 0 || c < 48 || c > 57)) {
          return false;
        }
      }
      return value.length > 0 && !js.Emitter.isKeyword.has(value);
    }
    return false;
  };
  js.Emitter.prototype.emitIndexProperty = function(node) {
    if (this.options.jsMangle && this.isIdentifierString(node)) {
      this.emit('.' + node.asString());
    } else {
      this.emit('[');
      this.emitExpression(node, Precedence.LOWEST);
      this.emit(']');
    }
  };
  js.Emitter.prototype.emitIndex = function(node, precedence) {
    this.emitExpression(node.binaryLeft(), Precedence.MEMBER);
    this.emitIndexProperty(node.binaryRight());
  };
  js.Emitter.prototype.emitTernary = function(node, precedence) {
    if (Precedence.ASSIGN < precedence) {
      this.emit('(');
    }
    this.emitExpression(node.ternaryLeft(), Precedence.MEMBER);
    this.emitIndexProperty(node.ternaryMiddle());
    this.emit(this.space + '=' + this.space);
    this.emitExpression(node.ternaryRight(), Precedence.ASSIGN);
    if (Precedence.ASSIGN < precedence) {
      this.emit(')');
    }
  };
  js.Emitter.prototype.quoteStringJS = function(text) {
    var doubleCount = 0;
    var singleCount = 0;
    for (var i = 0; i < text.length; i = i + 1 | 0) {
      var c = text.charCodeAt(i);
      if (c === 34) {
        doubleCount = doubleCount + 1 | 0;
      } else if (c === 39) {
        singleCount = singleCount + 1 | 0;
      }
    }
    return quoteString(text, singleCount > doubleCount ? 34 : 39);
  };
  js.Emitter.hasCompoundName = function(symbol) {
    var enclosingSymbol = symbol.enclosingSymbol;
    return enclosingSymbol !== null && enclosingSymbol.kind !== SymbolKind.GLOBAL_NAMESPACE && (symbol.kind !== SymbolKind.CONSTRUCTOR_FUNCTION || js.Emitter.hasCompoundName(enclosingSymbol));
  };
  js.Emitter.createIsKeyword = function() {
    var result = new StringMap();
    result.set('apply', true);
    result.set('arguments', true);
    result.set('break', true);
    result.set('call', true);
    result.set('case', true);
    result.set('catch', true);
    result.set('class', true);
    result.set('const', true);
    result.set('constructor', true);
    result.set('continue', true);
    result.set('debugger', true);
    result.set('default', true);
    result.set('delete', true);
    result.set('do', true);
    result.set('double', true);
    result.set('else', true);
    result.set('export', true);
    result.set('extends', true);
    result.set('false', true);
    result.set('finally', true);
    result.set('float', true);
    result.set('for', true);
    result.set('function', true);
    result.set('if', true);
    result.set('import', true);
    result.set('in', true);
    result.set('instanceof', true);
    result.set('int', true);
    result.set('let', true);
    result.set('new', true);
    result.set('null', true);
    result.set('return', true);
    result.set('super', true);
    result.set('this', true);
    result.set('throw', true);
    result.set('true', true);
    result.set('try', true);
    result.set('var', true);
    return result;
  };
  js.Emitter.mangleName = function(symbol) {
    if (symbol.kind === SymbolKind.CONSTRUCTOR_FUNCTION) {
      return js.Emitter.mangleName(symbol.enclosingSymbol);
    }
    if (symbol.isImportOrExport()) {
      return symbol.name;
    }
    if (js.Emitter.isKeyword.has(symbol.name)) {
      return '$' + symbol.name;
    }
    return symbol.name;
  };
  js.Emitter.fullName = function(symbol) {
    var enclosingSymbol = symbol.enclosingSymbol;
    if (enclosingSymbol !== null && enclosingSymbol.kind !== SymbolKind.GLOBAL_NAMESPACE) {
      var enclosingName = js.Emitter.fullName(enclosingSymbol);
      if (symbol.kind === SymbolKind.CONSTRUCTOR_FUNCTION) {
        return enclosingName;
      }
      if (in_SymbolKind.isInstance(symbol.kind)) {
        enclosingName += '.prototype';
      }
      return enclosingName + '.' + js.Emitter.mangleName(symbol);
    }
    return js.Emitter.mangleName(symbol);
  };
  js.Patcher = function(_0) {
    this.nextTempID = 0;
    this.createdThisAlias = false;
    this.currentFunction = null;
    this.imul = '$imul';
    this.$extends = '$extends';
    this.needExtends = false;
    this.needMathImul = false;
    this.nextSymbolName = 0;
    this.options = null;
    this.cache = null;
    this.reservedNames = js.Emitter.isKeyword.clone();
    this.symbolCounts = new IntMap();
    this.namingGroupIndexForSymbol = new IntMap();
    this.resolver = _0;
  };
  js.Patcher.prototype.run = function(program) {
    if (program.kind !== NodeKind.PROGRAM) {
      throw new Error('assert program.kind == .PROGRAM; (src/js/patcher.sk:29:7)');
    }
    var allSymbols = this.resolver.allSymbols;
    this.options = this.resolver.options;
    this.cache = this.resolver.cache;
    this.patchNode(program);
  };
  js.Patcher.prototype.trackSymbolCount = function(node) {
    var symbol = node.symbol;
    if (symbol !== null && node.kind !== NodeKind.TYPE && !node.isDeclarationName()) {
      this.symbolCounts.set(symbol.uniqueID, this.symbolCounts.getOrDefault(symbol.uniqueID, 0) + 1 | 0);
    }
  };
  js.Patcher.prototype.patchNode = function(node) {
    this.trackSymbolCount(node);
    switch (node.kind) {
    case 13:
      this.patchConstructor(node);
      this.setCurrentFunction(node.symbol);
      break;
    case 14:
      this.setCurrentFunction(node.symbol);
      break;
    case 49:
      this.patchCast(node);
      break;
    case 10:
      this.patchClass(node);
      break;
    case 32:
      this.patchName(node);
      break;
    case 61:
    case 80:
    case 75:
    case 65:
    case 77:
      this.patchBinary(node);
      break;
    case 57:
    case 58:
    case 60:
    case 59:
      this.patchUnary(node);
      break;
    case 82:
    case 91:
    case 87:
    case 86:
    case 88:
      this.patchAssign(node);
      break;
    }
    if (node.hasChildren()) {
      for (var i = 0; i < node.children.length; i = i + 1 | 0) {
        var child = node.children[i];
        if (child !== null) {
          this.patchNode(child);
        }
      }
    }
    switch (node.kind) {
    case 13:
    case 14:
      this.setCurrentFunction(null);
      break;
    }
  };
  js.Patcher.prototype.patchClass = function(node) {
    if (!node.symbol.isImport() && node.symbol.type.baseClass() !== null) {
      this.needExtends = true;
    }
  };
  js.Patcher.prototype.patchName = function(node) {
    if (node.symbol !== null && in_SymbolKind.isInstance(node.symbol.kind) && node.isNameExpression()) {
      node.become(Node.createDot(Node.createThis(), node.clone()));
    }
  };
  js.Patcher.prototype.patchBinary = function(node) {
    if (node.type.isInt(this.cache) && (node.kind === NodeKind.MULTIPLY || !this.alwaysConvertsOperandsToInt(node.parent.kind))) {
      node.become(this.createBinaryInt(node.kind, node.binaryLeft().replaceWith(null), node.binaryRight().replaceWith(null)).withRange(node.range));
    }
  };
  js.Patcher.prototype.patchAssign = function(node) {
    if (node.type.isInt(this.cache)) {
      var left = node.binaryLeft();
      var right = node.binaryRight();
      var kind = node.kind === NodeKind.ASSIGN_ADD ? NodeKind.ADD : node.kind === NodeKind.ASSIGN_SUBTRACT ? NodeKind.SUBTRACT : node.kind === NodeKind.ASSIGN_MULTIPLY ? NodeKind.MULTIPLY : node.kind === NodeKind.ASSIGN_DIVIDE ? NodeKind.DIVIDE : NodeKind.REMAINDER;
      this.createBinaryIntAssignment(node, kind, left.replaceWith(null), right.replaceWith(null));
    }
  };
  js.Patcher.prototype.patchUnary = function(node) {
    if (node.type.isInt(this.cache)) {
      var isIncrement = node.kind === NodeKind.PREFIX_INCREMENT || node.kind === NodeKind.POSTFIX_INCREMENT;
      this.createBinaryIntAssignment(node, isIncrement ? NodeKind.ADD : NodeKind.SUBTRACT, node.unaryValue().replaceWith(null), Node.createInt(1));
    }
  };
  js.Patcher.prototype.patchCast = function(node) {
    var value = node.castValue();
    if (node.type.isBool(this.cache) && !value.type.isBool(this.cache)) {
      value = Node.createUnary(NodeKind.NOT, value.replaceWith(null)).withRange(node.range).withType(node.type);
      node.become(Node.createUnary(NodeKind.NOT, value).withRange(node.range).withType(node.type));
    } else if (node.type.isInt(this.cache) && !value.type.isInteger(this.cache) && !this.alwaysConvertsOperandsToInt(node.parent.kind)) {
      node.become(Node.createBinary(NodeKind.BITWISE_OR, value.replaceWith(null), Node.createInt(0)).withRange(node.range).withType(node.type));
    } else if (node.type.isReal(this.cache) && !value.type.isNumeric(this.cache)) {
      node.become(Node.createUnary(NodeKind.POSITIVE, value.replaceWith(null)).withRange(node.range).withType(node.type));
    }
  };
  js.Patcher.prototype.patchConstructor = function(node) {
    var block = node.functionBlock();
    if (block === null) {
      return;
    }
    var superInitializer = node.superInitializer();
    var memberInitializers = node.memberInitializers();
    var index = 0;
    if (superInitializer !== null) {
      block.insertChild(index, Node.createExpression(superInitializer.replaceWith(null)));
      index = index + 1 | 0;
    }
    if (memberInitializers !== null) {
      for (var i = 0; i < memberInitializers.children.length; i = i + 1 | 0) {
        var child = memberInitializers.children[i];
        var name = child.memberInitializerName();
        var value = child.memberInitializerValue();
        block.insertChild(index, Node.createExpression(Node.createBinary(NodeKind.ASSIGN, name.replaceWith(null), value.replaceWith(null))));
        index = index + 1 | 0;
      }
    }
  };
  js.Patcher.prototype.createBinaryInt = function(kind, left, right) {
    if (kind === NodeKind.MULTIPLY) {
      this.needMathImul = true;
      return Node.createCall(Node.createName(this.imul), [left, right]).withType(this.cache.intType);
    }
    return Node.createBinary(NodeKind.BITWISE_OR, Node.createBinary(kind, left, right).withType(this.cache.intType), Node.createInt(0).withType(this.cache.intType)).withType(this.cache.intType);
  };
  js.Patcher.isSimpleNameAccess = function(node) {
    return node.kind === NodeKind.NAME || node.kind === NodeKind.THIS || node.kind === NodeKind.DOT && js.Patcher.isSimpleNameAccess(node.dotTarget());
  };
  js.Patcher.prototype.createBinaryIntAssignment = function(target, kind, left, right) {
    if (js.Patcher.isSimpleNameAccess(left)) {
      target.become(Node.createBinary(NodeKind.ASSIGN, left.clone(), this.createBinaryInt(kind, left, right)).withRange(target.range));
      return;
    }
    if (left.kind !== NodeKind.DOT) {
      throw new Error('assert left.kind == .DOT; (src/js/patcher.sk:244:7)');
    }
    var current = target;
    var parent = current.parent;
    while (parent.kind !== NodeKind.BLOCK) {
      current = parent;
      parent = parent.parent;
    }
    var name = '$temp' + this.nextTempID;
    this.nextTempID = this.nextTempID + 1 | 0;
    var symbol = this.resolver.createSymbol(name, SymbolKind.LOCAL_VARIABLE);
    var reference = Node.createName(name).withSymbol(symbol);
    var property = Node.createDot(reference, left.dotName().replaceWith(null));
    symbol.node = Node.createVariable(reference.clone(), Node.createType(this.cache.intType), null).withSymbol(symbol);
    parent.insertChild(parent.children.indexOf(current), Node.createVariableCluster(Node.createType(this.cache.intType), [symbol.node]));
    target.become(Node.createSequence([Node.createBinary(NodeKind.ASSIGN, reference.clone(), left.dotTarget().replaceWith(null)), Node.createBinary(NodeKind.ASSIGN, property.clone(), this.createBinaryInt(kind, property, right))]).withRange(target.range));
  };
  js.Patcher.prototype.alwaysConvertsOperandsToInt = function(kind) {
    switch (kind) {
    case 63:
    case 62:
    case 64:
    case 78:
    case 79:
    case 84:
    case 83:
    case 85:
    case 89:
    case 90:
      return true;
    default:
      return false;
    }
  };
  js.Patcher.prototype.setCurrentFunction = function(symbol) {
    this.currentFunction = symbol;
    this.createdThisAlias = false;
  };
  function SourceMapping(_0, _1, _2, _3, _4) {
    this.sourceIndex = _0;
    this.originalLine = _1;
    this.originalColumn = _2;
    this.generatedLine = _3;
    this.generatedColumn = _4;
  }
  function SourceMappingComparison() {
  }
  SourceMappingComparison.prototype.compare = function(left, right) {
    var delta = left.generatedLine - right.generatedLine | 0;
    return delta !== 0 ? delta : left.generatedColumn - right.generatedColumn | 0;
  };
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
      var source = this.sources[i];
      sourceNames.push(quoteString(source.name, 34));
      sourceContents.push(quoteString(source.contents, 34));
    }
    var result = '{"version":3,"sources":[' + sourceNames.join(',') + '],"sourcesContent":[' + sourceContents.join(',') + '],"names":[],"mappings":"';
    this.mappings.sort(function(comparison) { return function(a, b) { return comparison.compare(a, b); }; }(SourceMapGenerator.comparison));
    var previousGeneratedColumn = 0;
    var previousGeneratedLine = 0;
    var previousOriginalColumn = 0;
    var previousOriginalLine = 0;
    var previousSourceIndex = 0;
    for (var i = 0; i < this.mappings.length; i = i + 1 | 0) {
      var mapping = this.mappings[i];
      var generatedLine = mapping.generatedLine;
      if (previousGeneratedLine === generatedLine) {
        if (previousGeneratedColumn === mapping.generatedColumn && (previousGeneratedLine > 0 || previousGeneratedColumn > 0)) {
          continue;
        }
        result += ',';
      } else {
        previousGeneratedColumn = 0;
        while (previousGeneratedLine < generatedLine) {
          result += ';';
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
    return result + '"}\n';
  };
  SourceMapGenerator.encodeVLQ = function(value) {
    var vlq = value < 0 ? -value << 1 | 1 : value << 1;
    var encoded = '';
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
    CONST: 22,
    CONTINUE: 23,
    DECREMENT: 24,
    DEFAULT: 25,
    DIVIDE: 26,
    DO: 27,
    DOT: 28,
    DOUBLE: 29,
    ELSE: 30,
    END_OF_FILE: 31,
    ENUM: 32,
    EQUAL: 33,
    ERROR: 34,
    EXPORT: 35,
    FALSE: 36,
    FINAL: 37,
    FLOAT: 38,
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
    LEFT_BRACE: 54,
    LEFT_BRACKET: 55,
    LEFT_PARENTHESIS: 56,
    LESS_THAN: 57,
    LESS_THAN_OR_EQUAL: 58,
    LOGICAL_AND: 59,
    LOGICAL_OR: 60,
    MINUS: 61,
    MULTIPLY: 62,
    NAMESPACE: 63,
    NEW: 64,
    NOT: 65,
    NOT_EQUAL: 66,
    NULL: 67,
    OVERRIDE: 68,
    PLUS: 69,
    PRIVATE: 70,
    PROTECTED: 71,
    PUBLIC: 72,
    QUESTION_MARK: 73,
    REMAINDER: 74,
    RETURN: 75,
    RIGHT_BRACE: 76,
    RIGHT_BRACKET: 77,
    RIGHT_PARENTHESIS: 78,
    SEMICOLON: 79,
    SHIFT_LEFT: 80,
    SHIFT_RIGHT: 81,
    STATIC: 82,
    STRING: 83,
    SUPER: 84,
    SWITCH: 85,
    THIS: 86,
    TILDE: 87,
    TRUE: 88,
    UNTYPED: 89,
    USING: 90,
    VAR: 91,
    VIRTUAL: 92,
    WHILE: 93,
    WHITESPACE: 94,
    YY_INVALID_ACTION: 95,
    START_PARAMETER_LIST: 96,
    END_PARAMETER_LIST: 97
  };
  var in_TokenKind = {};
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
  var in_Precedence = {};
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
    return this.tokens[this.index];
  };
  ParserContext.prototype.next = function() {
    var token = this.current();
    if ((this.index + 1 | 0) < this.tokens.length) {
      this.index = this.index + 1 | 0;
    }
    return token;
  };
  ParserContext.prototype.spanSince = function(range) {
    var previous = this.tokens[this.index > 0 ? this.index - 1 | 0 : 0];
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
  function ListParselet() {
  }
  ListParselet.prototype.parse = function(context) {
    var token = context.current();
    var $arguments = parseArgumentList(context, TokenKind.LEFT_BRACKET, TokenKind.RIGHT_BRACKET, AllowTrailingComma.TRAILING_COMMA);
    return Node.createList($arguments).withRange(context.spanSince(token.range));
  };
  function ParenthesisParselet() {
  }
  ParenthesisParselet.prototype.parse = function(context) {
    var token = context.current();
    var type = parseGroup(context);
    if (looksLikeType(type)) {
      var value = pratt.parse(context, Precedence.UNARY_PREFIX);
      return Node.createCast(type, value).withRange(context.spanSince(token.range));
    }
    return type;
  };
  function DotPrefixParselet() {
  }
  DotPrefixParselet.prototype.parse = function(context) {
    var token = context.next();
    var name = parseName(context);
    return Node.createDot(null, name).withRange(context.spanSince(token.range));
  };
  function UntypedParselet() {
  }
  UntypedParselet.prototype.parse = function(context) {
    var token = context.next();
    var value = parseGroup(context);
    return (value === null ? Node.createError() : Node.createUntyped(value)).withRange(context.spanSince(token.range));
  };
  function NewParselet() {
  }
  NewParselet.prototype.parse = function(context) {
    context.unexpectedToken();
    context.next();
    return parseType(context);
  };
  function SuperParselet() {
  }
  SuperParselet.prototype.parse = function(context) {
    return parseSuperCall(context);
  };
  function HookParselet() {
  }
  HookParselet.prototype.parse = function(context, left) {
    context.next();
    var middle = pratt.parse(context, Precedence.ASSIGN - 1 | 0);
    var right = context.expect(TokenKind.COLON) ? pratt.parse(context, Precedence.ASSIGN - 1 | 0) : Node.createError().withRange(context.spanSince(context.current().range));
    return Node.createHook(left, middle, right).withRange(context.spanSince(left.range));
  };
  function SequenceParselet() {
  }
  SequenceParselet.prototype.parse = function(context, left) {
    var values = [left];
    while (context.eat(TokenKind.COMMA)) {
      values.push(pratt.parse(context, Precedence.COMMA));
    }
    return Node.createSequence(values).withRange(context.spanSince(left.range));
  };
  function DotInfixParselet() {
  }
  DotInfixParselet.prototype.parse = function(context, left) {
    context.next();
    var name = parseName(context);
    return Node.createDot(left, name).withRange(context.spanSince(left.range));
  };
  function CallParselet() {
  }
  CallParselet.prototype.parse = function(context, left) {
    var $arguments = parseArgumentList(context, TokenKind.LEFT_PARENTHESIS, TokenKind.RIGHT_PARENTHESIS, AllowTrailingComma.NO_TRAILING_COMMA);
    return Node.createCall(left, $arguments).withRange(context.spanSince(left.range));
  };
  function IndexParselet() {
  }
  IndexParselet.prototype.parse = function(context, left) {
    context.next();
    var index = pratt.parse(context, Precedence.LOWEST);
    scanForToken(context, TokenKind.RIGHT_BRACKET, TokenScan.STOP_BEFORE_NEXT_STATEMENT);
    return Node.createBinary(NodeKind.INDEX, left, index).withRange(context.spanSince(left.range));
  };
  function ParameterizeParselet() {
  }
  ParameterizeParselet.prototype.parse = function(context, left) {
    var token = context.next();
    var substitutions = parseTypeList(context, TokenKind.END_PARAMETER_LIST);
    if (!context.expect(TokenKind.END_PARAMETER_LIST)) {
      scanForToken(context, TokenKind.END_PARAMETER_LIST, TokenScan.STOP_BEFORE_NEXT_STATEMENT);
      return Node.createError().withRange(context.spanSince(token.range));
    }
    return Node.createParameterize(left, substitutions).withRange(context.spanSince(left.range));
  };
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
    var node = this.resumeIgnoringParselet(context, precedence, parselet.prefix.parse(context), parseletToIgnore);
    if (node === null) {
      throw new Error('assert node != null; (src/parser/pratt.sk:116:5)');
    }
    if (node.range.isEmpty()) {
      throw new Error('assert !node.range.isEmpty(); (src/parser/pratt.sk:117:5)');
    }
    return node;
  };
  Pratt.prototype.resumeIgnoringParselet = function(context, precedence, left, parseletToIgnore) {
    if (left === null) {
      throw new Error('assert left != null; (src/parser/pratt.sk:122:5)');
    }
    while (!in_NodeKind.isError(left.kind)) {
      var kind = context.current().kind;
      var parselet = this.table.getOrDefault(kind, null);
      if (parselet === null || parselet === parseletToIgnore || parselet.infix === null || parselet.precedence <= precedence) {
        break;
      }
      left = parselet.infix.parse(context, left);
      if (left === null) {
        throw new Error('assert left != null; (src/parser/pratt.sk:130:7)');
      }
      if (left.range.isEmpty()) {
        throw new Error('assert !left.range.isEmpty(); (src/parser/pratt.sk:131:7)');
      }
    }
    return left;
  };
  Pratt.prototype.literal = function(kind, callback) {
    this.parselet(kind, 0).prefix = new LiteralParselet(callback);
  };
  Pratt.prototype.prefix = function(kind, precedence, callback) {
    this.parselet(kind, 0).prefix = new PrefixParselet(callback, precedence);
  };
  Pratt.prototype.postfix = function(kind, precedence, callback) {
    this.parselet(kind, precedence).infix = new PostfixParselet(callback);
  };
  Pratt.prototype.infix = function(kind, precedence, callback) {
    this.parselet(kind, precedence).infix = new InfixParselet(callback, precedence);
  };
  Pratt.prototype.infixRight = function(kind, precedence, callback) {
    this.parselet(kind, precedence).infix = new InfixParselet(callback, precedence - 1 | 0);
  };
  function DoubleLiteral() {
  }
  DoubleLiteral.prototype.parse = function(context, token) {
    return Node.createDouble(parseDoubleLiteral(token.text)).withRange(token.range);
  };
  function StringLiteral() {
  }
  StringLiteral.prototype.parse = function(context, token) {
    var result = parseStringLiteral(context.log, token.range, token.text);
    return Node.createString(result !== null ? result.value : '').withRange(token.range);
  };
  function CharacterLiteral() {
  }
  CharacterLiteral.prototype.parse = function(context, token) {
    var result = parseStringLiteral(context.log, token.range, token.text);
    if (result !== null && result.value.length !== 1) {
      syntaxErrorInvalidCharacter(context.log, token.range, token.text);
      result = null;
    }
    return Node.createInt(result !== null ? result.value.charCodeAt(0) : 0).withRange(token.range);
  };
  function NameLiteral() {
  }
  NameLiteral.prototype.parse = function(context, token) {
    return Node.createName(token.text).withRange(token.range);
  };
  function TokenLiteral(_0) {
    this.kind = _0;
  }
  TokenLiteral.prototype.parse = function(context, token) {
    return new Node(this.kind).withRange(token.range);
  };
  function BoolLiteral(_0) {
    this.value = _0;
  }
  BoolLiteral.prototype.parse = function(context, token) {
    return Node.createBool(this.value).withRange(token.range);
  };
  function IntLiteral(_0) {
    this.base = _0;
  }
  IntLiteral.prototype.parse = function(context, token) {
    var value = parseIntLiteral(token.text, this.base);
    if (value !== value) {
      syntaxErrorInvalidInteger(context.log, token.range, token.text);
    } else if (this.base === 10 && value !== 0 && token.text.charCodeAt(0) === 48) {
      syntaxWarningOctal(context.log, token.range);
    }
    return Node.createInt(value | 0).withRange(token.range);
  };
  function FloatLiteral() {
  }
  FloatLiteral.prototype.parse = function(context, token) {
    return Node.createFloat(parseDoubleLiteral(token.text.slice(0, token.text.length - 1 | 0))).withRange(token.range);
  };
  function VarLiteral() {
  }
  VarLiteral.prototype.parse = function(context, token) {
    return Node.createVar().withRange(token.range);
  };
  function LiteralParselet(_0) {
    this.callback = _0;
  }
  LiteralParselet.prototype.parse = function(context) {
    return this.callback.parse(context, context.next());
  };
  function UnaryPrefix(_0) {
    this.kind = _0;
  }
  UnaryPrefix.prototype.parse = function(context, token, value) {
    return Node.createUnary(this.kind, value).withRange(Range.span(token.range, value.range));
  };
  function PrefixParselet(_0, _1) {
    this.callback = _0;
    this.precedence = _1;
  }
  PrefixParselet.prototype.parse = function(context) {
    var token = context.next();
    var value = pratt.parse(context, this.precedence);
    return value !== null ? this.callback.parse(context, token, value) : null;
  };
  function UnaryPostfix(_0) {
    this.kind = _0;
  }
  UnaryPostfix.prototype.parse = function(context, value, token) {
    return Node.createUnary(this.kind, value).withRange(Range.span(value.range, token.range));
  };
  function PostfixParselet(_0) {
    this.callback = _0;
  }
  PostfixParselet.prototype.parse = function(context, left) {
    return this.callback.parse(context, left, context.next());
  };
  function BinaryInfix(_0) {
    this.kind = _0;
  }
  BinaryInfix.prototype.parse = function(context, left, token, right) {
    return Node.createBinary(this.kind, left, right).withRange(Range.span(left.range, right.range));
  };
  function InfixParselet(_0, _1) {
    this.callback = _0;
    this.precedence = _1;
  }
  InfixParselet.prototype.parse = function(context, left) {
    var token = context.next();
    var right = pratt.parse(context, this.precedence);
    return right !== null ? this.callback.parse(context, left, token, right) : null;
  };
  function CallInfo(_0) {
    this.callSites = [];
    this.symbol = _0;
  }
  function CallGraph(program) {
    this.callInfo = [];
    this.symbolToInfoIndex = new IntMap();
    if (program.kind !== NodeKind.PROGRAM) {
      throw new Error('assert program.kind == .PROGRAM; (src/resolver/callgraph.sk:11:5)');
    }
    this.visit(program);
  }
  CallGraph.prototype.visit = function(node) {
    if (node.hasChildren()) {
      for (var i = 0; i < node.children.length; i = i + 1 | 0) {
        var child = node.children[i];
        if (child !== null) {
          this.visit(child);
        }
      }
    }
    if (node.kind === NodeKind.CALL) {
      var value = node.callValue();
      if (value.symbol !== null && in_SymbolKind.isFunction(value.symbol.kind)) {
        if (value.kind !== NodeKind.NAME && value.kind !== NodeKind.DOT) {
          throw new Error('assert value.kind == .NAME || value.kind == .DOT; (src/resolver/callgraph.sk:28:9)');
        }
        this.recordCallSite(value.symbol, node);
      }
    } else if (node.kind === NodeKind.FUNCTION) {
      this.recordCallSite(node.symbol, null);
    }
  };
  CallGraph.prototype.recordCallSite = function(symbol, node) {
    var index = this.symbolToInfoIndex.getOrDefault(symbol.uniqueID, -1);
    var info = index < 0 ? new CallInfo(symbol) : this.callInfo[index];
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
  ConstantFolder.prototype.flatten = function(node, content) {
    node.removeChildren();
    switch (content.type()) {
    case 0:
      node.kind = NodeKind.BOOL;
      break;
    case 1:
      node.kind = NodeKind.INT;
      break;
    case 2:
      node.kind = node.type === this.cache.floatType ? NodeKind.FLOAT : NodeKind.DOUBLE;
      break;
    case 3:
      node.kind = NodeKind.STRING;
      break;
    }
    node.content = content;
  };
  ConstantFolder.prototype.flattenBool = function(node, value) {
    if (!node.type.isError(this.cache) && !node.type.isBool(this.cache)) {
      throw new Error('assert node.type.isError(cache) || node.type.isBool(cache); (src/resolver/constantfolding.sk:17:5)');
    }
    this.flatten(node, new BoolContent(value));
  };
  ConstantFolder.prototype.flattenInt = function(node, value) {
    if (!node.type.isError(this.cache) && !node.type.isInteger(this.cache)) {
      throw new Error('assert node.type.isError(cache) || node.type.isInteger(cache); (src/resolver/constantfolding.sk:23:5)');
    }
    this.flatten(node, new IntContent(value));
  };
  ConstantFolder.prototype.flattenReal = function(node, value) {
    if (!node.type.isError(this.cache) && !node.type.isReal(this.cache)) {
      throw new Error('assert node.type.isError(cache) || node.type.isReal(cache); (src/resolver/constantfolding.sk:29:5)');
    }
    this.flatten(node, new DoubleContent(value));
  };
  ConstantFolder.prototype.flattenString = function(node, value) {
    if (!node.type.isError(this.cache) && !node.type.isString(this.cache)) {
      throw new Error('assert node.type.isError(cache) || node.type.isString(cache); (src/resolver/constantfolding.sk:35:5)');
    }
    this.flatten(node, new StringContent(value));
  };
  ConstantFolder.blockContainsVariableCluster = function(node) {
    if (node.kind !== NodeKind.BLOCK) {
      throw new Error('assert node.kind == .BLOCK; (src/resolver/constantfolding.sk:40:5)');
    }
    if (node.hasChildren()) {
      for (var i = 0; i < node.children.length; i = i + 1 | 0) {
        if (node.children[i].kind === NodeKind.VARIABLE_CLUSTER) {
          return true;
        }
      }
    }
    return false;
  };
  ConstantFolder.prototype.foldConstants = function(node) {
    var kind = node.kind;
    if (kind === NodeKind.ADD && node.type.isString(this.cache)) {
      this.rotateStringConcatenation(node);
    }
    if (node.hasChildren()) {
      for (var i = 0; i < node.children.length; i = i + 1 | 0) {
        var child = node.children[i];
        if (child !== null) {
          this.foldConstants(child);
        }
      }
      if (kind === NodeKind.BLOCK) {
        this.foldBlock(node);
        return;
      } else if (kind === NodeKind.SEQUENCE) {
        this.foldSequence(node);
        return;
      }
    }
    if (kind === NodeKind.NAME) {
      this.foldName(node);
    } else if (in_NodeKind.isCast(kind)) {
      this.foldCast(node);
    } else if (in_NodeKind.isUnaryOperator(kind)) {
      this.foldUnaryOperator(node, kind);
    } else if (in_NodeKind.isBinaryOperator(kind)) {
      this.foldBinaryOperator(node, kind);
    } else if (kind === NodeKind.HOOK) {
      this.foldHook(node);
    }
  };
  ConstantFolder.prototype.rotateStringConcatenation = function(node) {
    var left = node.binaryLeft();
    var right = node.binaryRight();
    if (!left.type.isString(this.cache) && !left.type.isError(this.cache)) {
      throw new Error('assert left.type.isString(cache) || left.type.isError(cache); (src/resolver/constantfolding.sk:89:5)');
    }
    if (!right.type.isString(this.cache) && !right.type.isError(this.cache)) {
      throw new Error('assert right.type.isString(cache) || right.type.isError(cache); (src/resolver/constantfolding.sk:90:5)');
    }
    if (right.kind === NodeKind.ADD) {
      var rightLeft = right.binaryLeft();
      var rightRight = right.binaryRight();
      if (!rightLeft.type.isString(this.cache) && !rightLeft.type.isError(this.cache)) {
        throw new Error('assert rightLeft.type.isString(cache) || rightLeft.type.isError(cache); (src/resolver/constantfolding.sk:95:7)');
      }
      if (!rightRight.type.isString(this.cache) && !rightRight.type.isError(this.cache)) {
        throw new Error('assert rightRight.type.isString(cache) || rightRight.type.isError(cache); (src/resolver/constantfolding.sk:96:7)');
      }
      left.swapWith(right);
      left.swapWith(rightRight);
      left.swapWith(rightLeft);
    }
  };
  ConstantFolder.prototype.foldStringConcatenation = function(node) {
    var left = node.binaryLeft();
    var right = node.binaryRight();
    if (!left.type.isString(this.cache) && !left.type.isError(this.cache)) {
      throw new Error('assert left.type.isString(cache) || left.type.isError(cache); (src/resolver/constantfolding.sk:106:5)');
    }
    if (!right.type.isString(this.cache) && !right.type.isError(this.cache)) {
      throw new Error('assert right.type.isString(cache) || right.type.isError(cache); (src/resolver/constantfolding.sk:107:5)');
    }
    if (right.kind === NodeKind.STRING) {
      if (left.kind === NodeKind.STRING) {
        this.flattenString(node, left.asString() + right.asString());
      } else if (left.kind === NodeKind.ADD) {
        var leftLeft = left.binaryLeft();
        var leftRight = left.binaryRight();
        if (!leftLeft.type.isString(this.cache) && !leftLeft.type.isError(this.cache)) {
          throw new Error('assert leftLeft.type.isString(cache) || leftLeft.type.isError(cache); (src/resolver/constantfolding.sk:118:9)');
        }
        if (!leftRight.type.isString(this.cache) && !leftRight.type.isError(this.cache)) {
          throw new Error('assert leftRight.type.isString(cache) || leftRight.type.isError(cache); (src/resolver/constantfolding.sk:119:9)');
        }
        if (leftRight.kind === NodeKind.STRING) {
          this.flattenString(leftRight, leftRight.asString() + right.asString());
          node.become(left.remove());
        }
      }
    }
  };
  ConstantFolder.prototype.foldBlock = function(node) {
    for (var i = 0; i < node.children.length; i = i + 1 | 0) {
      var child = node.children[i];
      var kind = child.kind;
      if (in_NodeKind.isJump(kind)) {
        for (var j = node.children.length - 1 | 0; j > i; j = j - 1 | 0) {
          node.removeChildAtIndex(j);
        }
        break;
      }
      if (kind === NodeKind.EXPRESSION && child.expressionValue().hasNoSideEffects() || kind === NodeKind.WHILE && child.whileTest().isFalse()) {
        node.removeChildAtIndex(i);
        i = i - 1 | 0;
      } else if (kind === NodeKind.FOR) {
        var test = child.forTest();
        if (test !== null && test.isFalse()) {
          var setup = child.forSetup();
          if (setup === null || setup.hasNoSideEffects()) {
            node.removeChildAtIndex(i);
            i = i - 1 | 0;
          } else if (setup.kind !== NodeKind.VARIABLE_CLUSTER) {
            child.replaceWith(Node.createExpression(setup.remove()));
          } else {
            var update = child.forUpdate();
            if (update !== null) {
              update.replaceWith(null);
            }
            child.forBlock().removeChildren();
          }
        }
      } else if (kind === NodeKind.IF) {
        var test = child.ifTest();
        var trueBlock = child.ifTrue();
        var falseBlock = child.ifFalse();
        if (falseBlock !== null && !falseBlock.hasChildren()) {
          falseBlock.replaceWith(null);
          falseBlock = null;
        }
        if (test.isTrue()) {
          if (falseBlock !== null) {
            falseBlock.replaceWith(null);
          }
          if (!ConstantFolder.blockContainsVariableCluster(trueBlock)) {
            var replacements = trueBlock.removeChildren();
            child.replaceWithNodes(replacements);
            i = i + (replacements.length - 1 | 0) | 0;
          }
        } else if (test.isFalse()) {
          if (falseBlock === null) {
            node.removeChildAtIndex(i);
            i = i - 1 | 0;
          } else if (!ConstantFolder.blockContainsVariableCluster(falseBlock)) {
            var replacements = falseBlock.removeChildren();
            child.replaceWithNodes(replacements);
            i = i + (replacements.length - 1 | 0) | 0;
          } else {
            test.replaceWith(Node.createBool(true).withType(test.type));
            trueBlock.replaceWith(falseBlock.replaceWith(null));
          }
        } else if (!trueBlock.hasChildren()) {
          if (test.hasNoSideEffects()) {
            node.removeChildAtIndex(i);
            i = i - 1 | 0;
          } else {
            child.become(Node.createExpression(test.remove()));
          }
        }
      }
    }
  };
  ConstantFolder.prototype.foldName = function(node) {
    if (node.symbol !== null && node.symbol.constant !== null) {
      this.flatten(node, node.symbol.constant);
    }
  };
  ConstantFolder.prototype.foldCast = function(node) {
    var type = node.castType().type;
    var value = node.castValue();
    var valueKind = value.kind;
    if (valueKind === NodeKind.BOOL) {
      if (type.isBool(this.cache)) {
        this.flattenBool(node, value.asBool());
      } else if (type.isInteger(this.cache)) {
        this.flattenInt(node, value.asBool() | 0);
      } else if (type.isReal(this.cache)) {
        this.flattenReal(node, +value.asBool());
      }
    } else if (valueKind === NodeKind.INT) {
      if (type.isBool(this.cache)) {
        this.flattenBool(node, !!value.asInt());
      } else if (type.isInteger(this.cache)) {
        this.flattenInt(node, value.asInt());
      } else if (type.isReal(this.cache)) {
        this.flattenReal(node, value.asInt());
      }
    } else if (in_NodeKind.isReal(valueKind)) {
      if (type.isBool(this.cache)) {
        this.flattenBool(node, !!value.asDouble());
      } else if (type.isInteger(this.cache)) {
        this.flattenInt(node, value.asDouble() | 0);
      } else if (type.isReal(this.cache)) {
        this.flattenReal(node, value.asDouble());
      }
    }
  };
  ConstantFolder.prototype.foldUnaryOperator = function(node, kind) {
    var value = node.unaryValue();
    var valueKind = value.kind;
    if (valueKind === NodeKind.BOOL) {
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
    } else if (in_NodeKind.isReal(valueKind)) {
      if (kind === NodeKind.POSITIVE) {
        this.flattenReal(node, +value.asDouble());
      } else if (kind === NodeKind.NEGATIVE) {
        this.flattenReal(node, -value.asDouble());
      }
    } else if (kind === NodeKind.NOT) {
      switch (valueKind) {
      case 53:
      case 66:
      case 76:
      case 74:
      case 73:
      case 71:
      case 67:
      case 72:
      case 68:
        value.invertBooleanCondition(this.cache);
        node.become(value);
        break;
      }
    }
  };
  ConstantFolder.prototype.foldMultiply = function(node, variable, constant) {
    if (node.binaryLeft() === constant) {
      variable.swapWith(constant);
    }
    var value = constant.asInt();
    if (value === 0) {
      if (variable.hasNoSideEffects()) {
        node.become(constant.remove());
      }
      return;
    }
    if (value === 1) {
      node.become(variable.remove());
      return;
    }
    var shift = logBase2(value);
    if (shift !== -1) {
      constant.content = new IntContent(shift);
      node.kind = NodeKind.SHIFT_LEFT;
    }
  };
  ConstantFolder.prototype.foldBinaryOperatorWithConstant = function(node, left, right) {
    switch (node.kind) {
    case 73:
      if (left.isFalse() || right.isTrue()) {
        node.become(left.remove());
      } else if (left.isTrue()) {
        node.become(right.remove());
      }
      break;
    case 74:
      if (left.isTrue() || right.isFalse()) {
        node.become(left.remove());
      } else if (left.isFalse()) {
        node.become(right.remove());
      }
      break;
    case 75:
      if (left.kind === NodeKind.INT) {
        this.foldMultiply(node, right, left);
      } else if (right.kind === NodeKind.INT) {
        this.foldMultiply(node, left, right);
      }
      break;
    }
  };
  ConstantFolder.prototype.foldBinaryOperator = function(node, kind) {
    if (kind === NodeKind.ADD && node.type.isString(this.cache)) {
      this.foldStringConcatenation(node);
      return;
    }
    var left = node.binaryLeft();
    var right = node.binaryRight();
    if (left.kind !== right.kind) {
      this.foldBinaryOperatorWithConstant(node, left, right);
      return;
    }
    if (left.kind === NodeKind.BOOL) {
      switch (kind) {
      case 73:
        this.flattenBool(node, left.asBool() && right.asBool());
        break;
      case 74:
        this.flattenBool(node, left.asBool() || right.asBool());
        break;
      case 66:
        this.flattenBool(node, left.asBool() === right.asBool());
        break;
      case 76:
        this.flattenBool(node, left.asBool() !== right.asBool());
        break;
      }
    } else if (left.kind === NodeKind.INT) {
      switch (kind) {
      case 61:
        this.flattenInt(node, left.asInt() + right.asInt() | 0);
        break;
      case 80:
        this.flattenInt(node, left.asInt() - right.asInt() | 0);
        break;
      case 75:
        this.flattenInt(node, $imul(left.asInt(), right.asInt()));
        break;
      case 65:
        this.flattenInt(node, left.asInt() / right.asInt() | 0);
        break;
      case 77:
        this.flattenInt(node, left.asInt() % right.asInt() | 0);
        break;
      case 78:
        this.flattenInt(node, left.asInt() << right.asInt());
        break;
      case 79:
        this.flattenInt(node, left.asInt() >> right.asInt());
        break;
      case 62:
        this.flattenInt(node, left.asInt() & right.asInt());
        break;
      case 63:
        this.flattenInt(node, left.asInt() | right.asInt());
        break;
      case 64:
        this.flattenInt(node, left.asInt() ^ right.asInt());
        break;
      case 66:
        this.flattenBool(node, left.asInt() === right.asInt());
        break;
      case 76:
        this.flattenBool(node, left.asInt() !== right.asInt());
        break;
      case 71:
        this.flattenBool(node, left.asInt() < right.asInt());
        break;
      case 67:
        this.flattenBool(node, left.asInt() > right.asInt());
        break;
      case 72:
        this.flattenBool(node, left.asInt() <= right.asInt());
        break;
      case 68:
        this.flattenBool(node, left.asInt() >= right.asInt());
        break;
      }
    } else if (in_NodeKind.isReal(left.kind)) {
      switch (kind) {
      case 61:
        this.flattenReal(node, left.asDouble() + right.asDouble());
        break;
      case 80:
        this.flattenReal(node, left.asDouble() - right.asDouble());
        break;
      case 75:
        this.flattenReal(node, left.asDouble() * right.asDouble());
        break;
      case 65:
        this.flattenReal(node, left.asDouble() / right.asDouble());
        break;
      case 66:
        this.flattenBool(node, left.asDouble() === right.asDouble());
        break;
      case 76:
        this.flattenBool(node, left.asDouble() !== right.asDouble());
        break;
      case 71:
        this.flattenBool(node, left.asDouble() < right.asDouble());
        break;
      case 67:
        this.flattenBool(node, left.asDouble() > right.asDouble());
        break;
      case 72:
        this.flattenBool(node, left.asDouble() <= right.asDouble());
        break;
      case 68:
        this.flattenBool(node, left.asDouble() >= right.asDouble());
        break;
      }
    }
  };
  ConstantFolder.prototype.foldHook = function(node) {
    var test = node.hookTest();
    if (test.isTrue()) {
      node.become(node.hookTrue().remove());
    } else if (test.isFalse()) {
      node.become(node.hookFalse().remove());
    }
  };
  ConstantFolder.prototype.foldSequence = function(node) {
    var i = 0;
    while ((i + 1 | 0) < node.children.length) {
      if (node.children[i].hasNoSideEffects()) {
        node.removeChildAtIndex(i);
      } else {
        i = i + 1 | 0;
      }
    }
    if (node.children.length === 1) {
      node.become(node.children[0].remove());
    } else {
      var last = node.children[i];
      if (last.hasNoSideEffects() && node.parent.kind === NodeKind.EXPRESSION) {
        last.remove();
      }
    }
  };
  function DeadCodeRemovalPass(_0) {
    this.includedSymbols = new IntMap();
    this.options = _0;
  }
  DeadCodeRemovalPass.run = function(program, options, resolver) {
    var pass = new DeadCodeRemovalPass(options);
    var allSymbols = resolver.allSymbols;
    for (var i = 0; i < allSymbols.length; i = i + 1 | 0) {
      var symbol = allSymbols[i];
      if (symbol.isExport() || symbol.isVirtual()) {
        pass.includeSymbol(symbol);
      }
    }
    for (var i = 0; i < allSymbols.length; i = i + 1 | 0) {
      var symbol = allSymbols[i];
      var node = symbol.node;
      if (node !== null && !pass.includedSymbols.has(symbol.uniqueID)) {
        if (symbol.enclosingSymbol !== null) {
          symbol.enclosingSymbol.type.members.remove(symbol.name);
        }
        allSymbols.splice(i, 1)[0];
        node.remove();
        i = i - 1 | 0;
      }
    }
  };
  DeadCodeRemovalPass.prototype.includeSymbol = function(symbol) {
    if (symbol.kind === SymbolKind.GLOBAL_VARIABLE && symbol.isConst() && this.options.foldAllConstants) {
      return;
    }
    if (!this.includedSymbols.has(symbol.uniqueID)) {
      this.includedSymbols.set(symbol.uniqueID, true);
      if (symbol.enclosingSymbol !== null && symbol.kind !== SymbolKind.INSTANCE_VARIABLE) {
        this.includeSymbol(symbol.enclosingSymbol);
      }
      if (in_SymbolKind.isObject(symbol.kind)) {
        var $constructor = symbol.type.$constructor();
        if ($constructor !== null) {
          this.includeSymbol($constructor.symbol);
        }
      }
      if (symbol.type.hasRelevantTypes()) {
        var types = symbol.type.relevantTypes;
        for (var i = 0; i < types.length; i = i + 1 | 0) {
          var relevantSymbol = types[i].symbol;
          if (relevantSymbol !== null) {
            this.includeSymbol(relevantSymbol);
          }
        }
      }
      var node = symbol.node;
      if (node !== null && !in_NodeKind.isNamedBlockDeclaration(node.kind)) {
        this.visit(node);
      }
    }
  };
  DeadCodeRemovalPass.prototype.visit = function(node) {
    if (node.symbol !== null) {
      this.includeSymbol(node.symbol);
    }
    if (node.hasChildren()) {
      for (var i = 0; i < node.children.length; i = i + 1 | 0) {
        var child = node.children[i];
        if (child !== null) {
          this.visit(child);
        }
      }
    }
  };
  var FunctionInliningPass = {};
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
          if (node.kind === NodeKind.FUNCTION && node.symbol.kind === SymbolKind.GLOBAL_FUNCTION) {
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
    if (symbol.kind === SymbolKind.GLOBAL_FUNCTION && (symbol.isInline() || options.inlineAllFunctions)) {
      var block = symbol.node.functionBlock();
      if (block === null) {
        return null;
      }
      if (!block.hasChildren()) {
        if (options.foldAllConstants) {
          var $arguments = [];
          var argumentVariables = symbol.node.functionArguments().children;
          for (var i = 0; i < argumentVariables.length; i = i + 1 | 0) {
            $arguments.push(argumentVariables[i].symbol);
          }
          return new InliningInfo(symbol, Node.createNull().withType(symbol.type.resultType()), info.callSites, $arguments, $arguments);
        }
        return null;
      }
      var first = block.children[0];
      var inlineValue = null;
      if (first.kind === NodeKind.RETURN) {
        inlineValue = first.returnValue();
      } else if (first.kind === NodeKind.EXPRESSION && block.children.length === 1) {
        inlineValue = first.expressionValue();
      }
      if (inlineValue !== null) {
        var symbolCounts = new IntMap();
        if (InliningGraph.recursivelyCountArgumentUses(inlineValue, symbolCounts)) {
          var unusedArguments = [];
          var $arguments = [];
          var argumentVariables = symbol.node.functionArguments().children;
          var isSimpleSubstitution = true;
          for (var i = 0; i < argumentVariables.length; i = i + 1 | 0) {
            var argument = argumentVariables[i].symbol;
            if (argument === null) {
              throw new Error('assert argument != null; (src/resolver/functioninlining.sk:242:13)');
            }
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
    if (node.hasChildren()) {
      for (var i = 0; i < node.children.length; i = i + 1 | 0) {
        var child = node.children[i];
        if (child !== null && !InliningGraph.recursivelyCountArgumentUses(child, symbolCounts)) {
          return false;
        }
      }
    }
    var symbol = node.symbol;
    if (symbol !== null) {
      symbolCounts.set(symbol.uniqueID, symbolCounts.getOrDefault(symbol.uniqueID, 0) + 1 | 0);
      if (node.isStorage()) {
        return false;
      }
    }
    return true;
  };
  var InstanceToStaticPass = {};
  function Member(_0) {
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
      if (!in_SymbolKind.isTypeWithInstances(node.symbol.enclosingSymbol.kind)) {
        throw new Error('assert node.symbol.enclosingSymbol.kind.isTypeWithInstances(); (src/resolver/resolver.sk:23:7)');
      }
      context.symbolForThis = node.symbol.enclosingSymbol;
      context.scope = context.symbolForThis.node.scope;
      if (context.scope === null) {
        throw new Error('assert context.scope != null; (src/resolver/resolver.sk:26:7)');
      }
    }
    while (node !== null) {
      if (context.scope === null) {
        context.scope = node.scope;
      }
      if (context.loop === null && in_NodeKind.isLoop(node.kind)) {
        context.loop = node;
      }
      if (context.switchValue === null && node.kind === NodeKind.SWITCH) {
        context.switchValue = node.switchValue();
      }
      if (context.symbolForThis === null && node.symbol !== null && in_SymbolKind.isTypeWithInstances(node.symbol.kind)) {
        context.symbolForThis = node.symbol;
      }
      if (context.functionSymbol === null && in_NodeKind.isFunction(node.kind)) {
        context.functionSymbol = node.symbol;
      }
      node = node.parent;
    }
    return context;
  };
  function MemberRangeComparison() {
  }
  MemberRangeComparison.prototype.compare = function(left, right) {
    return left.symbol.node.range.start - right.symbol.node.range.start | 0;
  };
  function Resolver(_0, _1) {
    this.context = new ResolveContext();
    this.constantFolder = null;
    this.parsedDeclarations = null;
    this.parsedBlocks = null;
    this.typeContext = null;
    this.resultType = null;
    this.allSymbols = [];
    this.cache = new TypeCache();
    this.log = _0;
    this.options = _1;
  }
  Resolver.prototype.run = function(program) {
    if (program.kind !== NodeKind.PROGRAM) {
      throw new Error('assert program.kind == .PROGRAM; (src/resolver/resolver.sk:60:5)');
    }
    var globalScope = new Scope(null);
    this.cache.insertGlobals(globalScope);
    this.constantFolder = new ConstantFolder(this.cache);
    this.prepareNode(program, globalScope);
    this.cache.linkGlobals(globalScope);
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
  Resolver.prototype.setupBlock = function(node, scope) {
    if (!in_NodeKind.isNamedBlockDeclaration(node.parent.kind) && !in_NodeKind.isLoop(node.parent.kind)) {
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
    return scope;
  };
  Resolver.prototype.setupNamedDeclaration = function(node, scope) {
    var declarationName = node.declarationName();
    if (declarationName !== null && node.symbol === null) {
      var name = declarationName.asString();
      var member = scope.findLocal(name);
      var symbol = null;
      if (member !== null) {
        symbol = member.symbol;
        if (symbol.node !== null) {
          symbol.node.appendToSiblingChain(node);
        }
      } else {
        symbol = this.createSymbol(name, SymbolKind.OTHER);
        symbol.node = node;
        if (scope.type !== null) {
          symbol.enclosingSymbol = scope.type.symbol;
        }
        member = new Member(symbol);
        if (node.kind === NodeKind.PARAMETER) {
          scope.insertLocal(member);
        } else {
          scope.insert(member);
        }
      }
      this.parsedDeclarations.push(node);
      declarationName.symbol = symbol;
      node.symbol = symbol;
      if (symbol.type === null && in_NodeKind.isNamedBlockDeclaration(node.kind)) {
        symbol.type = new Type(symbol);
      }
    }
  };
  Resolver.prototype.setupScopesAndSymbols = function(node, scope) {
    if (node.kind === NodeKind.PROGRAM) {
      node.scope = scope;
    } else if (node.kind === NodeKind.BLOCK) {
      scope = this.setupBlock(node, scope);
    }
    if (in_NodeKind.isNamedDeclaration(node.kind)) {
      this.setupNamedDeclaration(node, scope);
    }
    if (in_NodeKind.isNamedBlockDeclaration(node.kind) || in_NodeKind.isFunction(node.kind) || in_NodeKind.isLoop(node.kind)) {
      scope = new Scope(scope);
      node.scope = scope;
    }
    if (node.hasChildren() && !in_NodeKind.isExpression(node.kind)) {
      for (var i = 0; i < node.children.length; i = i + 1 | 0) {
        var child = node.children[i];
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
      flags |= flag;
      parent = parent.parent;
    }
    if (parent !== null && parent.kind === NodeKind.BLOCK && parent.parent.kind === NodeKind.EXTENSION) {
      flags |= SymbolFlag.FROM_EXTENSION;
    }
    return flags;
  };
  Resolver.prototype.accumulateSymbolFlags = function() {
    for (var i = 0; i < this.parsedDeclarations.length; i = i + 1 | 0) {
      var node = this.parsedDeclarations[i];
      if (node.symbol.node !== node) {
        continue;
      }
      var declarationName = node.declarationName();
      var flags = this.symbolFlagsForNode(node);
      for (var sibling = node.sibling; sibling !== null; sibling = sibling.sibling) {
        var siblingFlags = this.symbolFlagsForNode(sibling);
        if ((flags & SymbolFlag.KEYWORD_MASK) !== (siblingFlags & SymbolFlag.KEYWORD_MASK)) {
          semanticErrorDifferentModifiers(this.log, sibling.declarationName().range, declarationName.asString(), declarationName.range);
          siblingFlags |= SymbolFlag.HAS_MODIFIER_ERRORS;
        }
        flags |= siblingFlags;
      }
      node.symbol.flags |= flags;
    }
  };
  Resolver.prototype.checkParentsForLocalVariable = function(node) {
    for (node = node.parent; node !== null; node = node.parent) {
      if (in_NodeKind.isFunction(node.kind)) {
        return true;
      }
    }
    return false;
  };
  Resolver.prototype.setSymbolKindsAndMergeSiblings = function() {
    for (var i = 0; i < this.parsedDeclarations.length; i = i + 1 | 0) {
      var node = this.parsedDeclarations[i];
      var symbol = node.symbol;
      if (symbol.node !== node) {
        continue;
      }
      var declarationName = node.declarationName();
      var kind = node.kind;
      for (var sibling = node.sibling; sibling !== null; sibling = sibling.sibling) {
        if (sibling.kind === NodeKind.EXTENSION && in_NodeKind.isNamedBlockDeclaration(kind)) {
          continue;
        }
        if (sibling.kind !== NodeKind.EXTENSION && in_NodeKind.isNamedBlockDeclaration(sibling.kind)) {
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
        if (sibling.kind === NodeKind.VARIABLE || in_NodeKind.isFunction(sibling.kind)) {
          var disconnected = this.createSymbol(symbol.name, SymbolKind.OTHER);
          sibling.symbol = disconnected;
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
        symbol.kind = SymbolKind.INTERFACE;
        break;
      case 14:
        symbol.kind = SymbolKind.GLOBAL_FUNCTION;
        break;
      case 13:
        symbol.kind = SymbolKind.CONSTRUCTOR_FUNCTION;
        break;
      case 15:
        symbol.kind = SymbolKind.GLOBAL_VARIABLE;
        break;
      case 16:
        symbol.kind = symbol.enclosingSymbol !== null ? SymbolKind.OBJECT_PARAMETER : SymbolKind.FUNCTION_PARAMETER;
        break;
      case 17:
        symbol.kind = SymbolKind.ALIAS;
        break;
      case 12:
        semanticErrorExtensionMissingTarget(this.log, declarationName.range, declarationName.asString());
        break;
      default:
        throw new Error('assert false; (src/resolver/resolver.sk:317:19)');
        break;
      }
    }
    for (var i = 0; i < this.parsedDeclarations.length; i = i + 1 | 0) {
      var node = this.parsedDeclarations[i];
      var symbol = node.symbol;
      if (!symbol.isStatic() && (symbol.isObjectMember() || symbol.isEnumMember() && symbol.isFromExtension())) {
        if (symbol.kind === SymbolKind.GLOBAL_FUNCTION) {
          symbol.kind = SymbolKind.INSTANCE_FUNCTION;
        } else if (symbol.kind === SymbolKind.GLOBAL_VARIABLE) {
          symbol.kind = SymbolKind.INSTANCE_VARIABLE;
        }
      } else if (symbol.kind === SymbolKind.GLOBAL_VARIABLE && this.checkParentsForLocalVariable(node)) {
        symbol.kind = SymbolKind.LOCAL_VARIABLE;
      }
    }
  };
  Resolver.prototype.processUsingStatements = function() {
    for (var i = 0; i < this.parsedBlocks.length; i = i + 1 | 0) {
      var block = this.parsedBlocks[i];
      if (!block.hasChildren()) {
        continue;
      }
      var insertedSymbols = null;
      for (var j = 0; j < block.children.length; j = j + 1 | 0) {
        var statement = block.children[j];
        if (statement.kind !== NodeKind.USING) {
          continue;
        }
        var value = statement.usingValue();
        this.resolveGlobalUsingValue(value);
        if (value.type.isError(this.cache)) {
          continue;
        }
        var symbol = value.type.symbol;
        if (symbol === null) {
          continue;
        }
        if (!in_SymbolKind.isNamespace(symbol.kind)) {
          semanticErrorBadUsing(this.log, value.range);
          continue;
        }
        if (insertedSymbols === null) {
          insertedSymbols = [];
        }
        var members = symbol.type.members.values();
        for (var k = 0; k < members.length; k = k + 1 | 0) {
          var member = members[k];
          var memberSymbol = member.symbol;
          if (memberSymbol.kind === SymbolKind.NAMESPACE) {
            continue;
          }
          var current = block.scope.findLocal(memberSymbol.name);
          if (current === null) {
            insertedSymbols.push(memberSymbol);
            block.scope.insertLocal(member);
            continue;
          }
          var currentSymbol = current.symbol;
          if (insertedSymbols.indexOf(currentSymbol) < 0) {
            continue;
          }
          if (currentSymbol.kind !== SymbolKind.AMBIGUOUS) {
            if (memberSymbol !== currentSymbol) {
              var collision = this.createSymbol(memberSymbol.name, SymbolKind.AMBIGUOUS);
              collision.identicalMembers = [current, member];
              block.scope.locals.set(memberSymbol.name, new Member(collision));
              insertedSymbols.push(collision);
            }
          } else if (currentSymbol.identicalMembers.indexOf(member) < 0) {
            currentSymbol.identicalMembers.push(member);
          }
        }
      }
    }
  };
  Resolver.prototype.resolveGlobalUsingValue = function(node) {
    node.type = this.cache.errorType;
    var member = null;
    if (node.kind === NodeKind.NAME) {
      var name = node.asString();
      member = this.cache.globalType.findMember(name);
      if (member === null) {
        semanticErrorUndeclaredSymbol(this.log, node.range, name);
        return;
      }
    } else if (node.kind === NodeKind.DOT) {
      var target = node.dotTarget();
      this.resolveGlobalUsingValue(target);
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
    if (!in_SymbolKind.isType(member.symbol.kind)) {
      semanticErrorBadUsingValue(this.log, node.range);
      return;
    }
    node.become(Node.createType(member.symbol.type).withRange(node.range).withSymbol(member.symbol));
    if (node.type === null) {
      throw new Error('assert node.type != null; (src/resolver/resolver.sk:474:5)');
    }
  };
  Resolver.prototype.resolve = function(node, expectedType) {
    if (node.type !== null) {
      return;
    }
    node.type = this.cache.errorType;
    if (this.context.scope === null && node.kind !== NodeKind.PROGRAM) {
      throw new Error('assert context.scope != null || node.kind == .PROGRAM; (src/resolver/resolver.sk:485:5)');
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
    case 31:
      this.resolveUsing(node);
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
      this.resolveObject(node);
      break;
    case 12:
      this.resolveExtension(node);
      break;
    case 13:
    case 14:
      this.resolveFunction(node);
      break;
    case 15:
      this.resolveVariable(node);
      break;
    case 6:
      this.resolveVariableCluster(node);
      break;
    case 16:
      this.resolveParameter(node);
      break;
    case 17:
      this.resolveAlias(node);
      break;
    case 18:
      this.resolveIf(node);
      break;
    case 19:
      this.resolveFor(node);
      break;
    case 20:
      this.resolveForEach(node);
      break;
    case 21:
      this.resolveWhile(node);
      break;
    case 22:
      this.resolveWhile(node);
      break;
    case 23:
      this.resolveReturn(node);
      break;
    case 24:
      this.resolveBreak(node);
      break;
    case 25:
      this.resolveContinue(node);
      break;
    case 26:
    case 27:
      this.resolveAssert(node);
      break;
    case 28:
      this.resolveExpression(node);
      break;
    case 29:
      this.resolveSwitch(node);
      break;
    case 30:
      this.resolveModifier(node);
      break;
    case 32:
      this.resolveName(node);
      break;
    case 36:
      node.type = this.cache.nullType;
      break;
    case 34:
      this.resolveThis(node);
      break;
    case 37:
      node.type = this.cache.boolType;
      break;
    case 35:
      this.resolveHook(node);
      break;
    case 38:
      this.resolveInt(node);
      break;
    case 39:
      node.type = this.cache.floatType;
      break;
    case 40:
      node.type = this.cache.doubleType;
      break;
    case 41:
      node.type = this.cache.stringType;
      break;
    case 42:
      this.resolveList(node);
      break;
    case 43:
      this.resolveDot(node);
      break;
    case 44:
      this.resolveCall(node);
      break;
    case 45:
      this.resolveSuperCall(node);
      break;
    case 46:
      break;
    case 47:
      this.resolveSequence(node);
      break;
    case 48:
      this.resolveParameterize(node);
      break;
    case 49:
      this.resolveCast(node);
      break;
    case 51:
      this.resolveUntyped(node);
      break;
    case 52:
      this.resolveVar(node);
      break;
    case 53:
    case 54:
    case 55:
    case 56:
    case 57:
    case 58:
    case 59:
    case 60:
      this.resolveUnaryOperator(node);
      break;
    case 61:
    case 62:
    case 63:
    case 64:
    case 65:
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
      this.resolveBinaryOperator(node);
      break;
    case 92:
      this.resolveTernaryOperator(node);
      break;
    default:
      throw new Error('assert false; (src/resolver/resolver.sk:563:9)');
      break;
    }
    this.context.scope = oldScope;
    this.typeContext = oldType;
    if (node.type === null) {
      throw new Error('assert node.type != null; (src/resolver/resolver.sk:569:5)');
    }
  };
  Resolver.prototype.checkIsParameterized = function(node) {
    if (!node.type.isError(this.cache) && node.type.hasParameters() && !node.type.isParameterized()) {
      semanticErrorUnparameterizedType(this.log, node.range, node.type);
      node.type = this.cache.errorType;
    }
  };
  Resolver.prototype.checkIsType = function(node) {
    if (!node.type.isError(this.cache) && !in_NodeKind.isType(node.kind)) {
      semanticErrorUnexpectedExpression(this.log, node.range, node.type);
      node.type = this.cache.errorType;
    }
  };
  Resolver.prototype.checkIsInstance = function(node) {
    if (!node.type.isError(this.cache) && in_NodeKind.isType(node.kind)) {
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
        this.checkUnusedExpression(node.lastChild());
      }
    } else if (!node.type.isError(this.cache) && !in_NodeKind.isCall(kind) && !in_NodeKind.isUnaryStorageOperator(kind) && !in_NodeKind.isBinaryStorageOperator(kind)) {
      semanticWarningUnusedExpression(this.log, node.range);
    }
  };
  Resolver.prototype.checkStorage = function(node) {
    if (node.type.isError(this.cache)) {
      return;
    }
    if (!in_NodeKind.isStorage(node.kind)) {
      semanticErrorBadStorage(this.log, node.range);
      return;
    }
    if (node.symbol.isConst()) {
      semanticErrorStorageToProtectedSymbol(this.log, node.range, 'const');
    } else if (node.symbol.isFinal()) {
      semanticErrorStorageToProtectedSymbol(this.log, node.range, 'final');
    }
  };
  Resolver.prototype.checkStorageOperator = function(node) {
    var parent = node.parent;
    while (parent.kind === NodeKind.SEQUENCE) {
      parent = parent.parent;
    }
    if (parent.kind !== NodeKind.EXPRESSION && parent.kind !== NodeKind.FOR) {
      semanticErrorNestedStorageOperator(this.log, node.range);
    }
  };
  Resolver.prototype.checkConversion = function(to, node, kind) {
    var from = node.type;
    if (from === null) {
      throw new Error('assert from != null; (src/resolver/resolver.sk:651:5)');
    }
    if (to === null) {
      throw new Error('assert to != null; (src/resolver/resolver.sk:652:5)');
    }
    if (from.isError(this.cache) || to.isError(this.cache)) {
      return;
    }
    if (from.isVoid(this.cache) && to.isVoid(this.cache)) {
      semanticErrorUnexpectedExpression(this.log, node.range, to);
      node.type = this.cache.errorType;
      return;
    }
    if (from === to) {
      if (node.symbol !== null && in_SymbolKind.isFunction(node.symbol.kind) && !in_NodeKind.isCall(node.kind) && node.parent.kind !== NodeKind.CALL) {
        semanticErrorMustCallFunctionReference(this.log, node.range);
        node.type = this.cache.errorType;
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
      if (in_NodeKind.isType(node.kind)) {
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
      throw new Error('assert node.parent != null; (src/resolver/resolver.sk:715:5)');
    }
    if (node.parent.kind !== NodeKind.BLOCK) {
      this.unexpectedStatement(node);
    }
  };
  Resolver.prototype.checkDeclarationLocation = function(node, allowDeclaration) {
    if (node.parent === null) {
      throw new Error('assert node.parent != null; (src/resolver/resolver.sk:728:5)');
    }
    var parent = null;
    for (parent = node.parent; parent !== null; parent = parent.parent) {
      if (parent.symbol !== null && parent.symbol.hasLocationError()) {
        break;
      }
      var kind = parent.kind;
      if (kind !== NodeKind.PROGRAM && kind !== NodeKind.FILE && kind !== NodeKind.MODIFIER && kind !== NodeKind.BLOCK && kind !== NodeKind.NAMESPACE && kind !== NodeKind.EXTENSION && (allowDeclaration !== AllowDeclaration.ALLOW_TOP_OR_OBJECT_LEVEL || !in_NodeKind.isObject(kind))) {
        this.unexpectedStatement(node);
        break;
      }
    }
    if (parent !== null) {
      node.symbol.flags |= SymbolFlag.HAS_LOCATION_ERROR;
    }
  };
  Resolver.prototype.checkStatementLocation = function(node) {
    if (node.parent === null) {
      throw new Error('assert node.parent != null; (src/resolver/resolver.sk:750:5)');
    }
    for (var parent = node.parent; parent !== null; parent = parent.parent) {
      var kind = parent.kind;
      if (kind === NodeKind.FILE) {
        this.unexpectedStatement(node);
        break;
      }
      if (kind === NodeKind.BLOCK) {
        var parentKind = parent.parent.kind;
        if (!in_NodeKind.isNamedBlockDeclaration(parentKind) && parentKind !== NodeKind.FILE) {
          break;
        }
      }
    }
  };
  Resolver.prototype.checkAccessToThis = function(range) {
    if (this.context.functionSymbol !== null && in_SymbolKind.isInstance(this.context.functionSymbol.kind)) {
      return true;
    }
    if (this.context.symbolForThis !== null) {
      semanticErrorStaticThis(this.log, range, 'this');
    } else {
      semanticErrorUnexpectedThis(this.log, range, 'this');
    }
    return false;
  };
  Resolver.prototype.checkAccessToInstanceSymbol = function(node) {
    var symbol = node.symbol;
    if (!in_SymbolKind.isInstance(symbol.kind) && symbol.kind !== SymbolKind.OBJECT_PARAMETER) {
      return true;
    }
    if (this.context.functionSymbol !== null && in_SymbolKind.isInstance(this.context.functionSymbol.kind) && (this.context.functionSymbol.enclosingSymbol === symbol.enclosingSymbol || this.context.functionSymbol.enclosingSymbol.type.hasBaseType(symbol.enclosingSymbol.type))) {
      return true;
    }
    if (this.context.symbolForThis === null) {
      semanticErrorUnexpectedThis(this.log, node.range, symbol.name);
      return false;
    }
    if (symbol.kind === SymbolKind.OBJECT_PARAMETER && this.context.symbolForThis === symbol.enclosingSymbol) {
      var enclosingNode = symbol.enclosingSymbol.node;
      for (var parent = node.parent; parent !== enclosingNode; parent = parent.parent) {
        if (parent.kind === NodeKind.NODE_LIST && parent.parent === enclosingNode && (parent === parent.parent.objectParameters() || parent === parent.parent.baseTypes())) {
          return true;
        }
        if ((parent.kind === NodeKind.VARIABLE || in_NodeKind.isFunction(parent.kind)) && in_SymbolKind.isInstance(parent.symbol.kind)) {
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
      var isObject = in_NodeKind.isObject(node.kind);
      if (isObject || node.kind === NodeKind.EXTENSION) {
        var types = node.baseTypes();
        if (types !== null && types.hasChildren()) {
          var index = 0;
          for (var i = 0; i < types.children.length; i = i + 1 | 0) {
            var baseType = types.children[i];
            this.resolveAsParameterizedType(baseType);
            if (isObject) {
              baseTypes.splice(index, 0, baseType);
              index = index + 1 | 0;
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
      semanticErrorUnexpectedBaseType(this.log, baseTypes[i].range, what);
    }
  };
  Resolver.prototype.createDefaultValue = function(type, range) {
    if (type.isReference()) {
      return Node.createNull().withType(type);
    }
    if (type.isBool(this.cache)) {
      return Node.createBool(false).withType(type);
    }
    if (type.isInt(this.cache)) {
      return Node.createInt(0).withType(type);
    }
    if (type.isFloat(this.cache)) {
      return Node.createFloat(0).withType(type);
    }
    if (type.isDouble(this.cache)) {
      return Node.createDouble(0).withType(type);
    }
    if (type.isString(this.cache)) {
      return Node.createString('').withType(type);
    }
    if (type.isEnum()) {
      return Node.createInt(0).withType(type);
    }
    if (!type.isError(this.cache)) {
      semanticErrorNoDefaultValue(this.log, range, type);
    }
    return Node.createError().withType(this.cache.errorType);
  };
  Resolver.prototype.needsTypeContext = function(node) {
    return node.kind === NodeKind.LIST || node.kind === NodeKind.DOT && node.dotTarget() === null || node.kind === NodeKind.COMPLEMENT && this.needsTypeContext(node.unaryValue()) || node.kind === NodeKind.HOOK && this.needsTypeContext(node.hookTrue()) && this.needsTypeContext(node.hookFalse());
  };
  Resolver.prototype.addAutoGeneratedMember = function(type, name) {
    var symbol = this.createSymbol(name, SymbolKind.AUTOMATIC);
    symbol.enclosingSymbol = type.symbol;
    type.addMember(new Member(symbol));
  };
  Resolver.prototype.forbidBlockDeclarationModifiers = function(symbol, where) {
    this.unexpectedModifierIfPresent(symbol, SymbolFlag.CONST, where);
    this.unexpectedModifierIfPresent(symbol, SymbolFlag.FINAL, where);
    this.unexpectedModifierIfPresent(symbol, SymbolFlag.INLINE, where);
    this.unexpectedModifierIfPresent(symbol, SymbolFlag.STATIC, where);
    this.unexpectedModifierIfPresent(symbol, SymbolFlag.VIRTUAL, where);
    this.unexpectedModifierIfPresent(symbol, SymbolFlag.OVERRIDE, where);
    if (symbol.isImport()) {
      this.unexpectedModifierIfPresent(symbol, SymbolFlag.EXPORT, 'on an imported declaration');
    }
  };
  Resolver.prototype.initializeNamespace = function(symbol) {
    if (!symbol.type.isNamespace()) {
      throw new Error('assert symbol.type.isNamespace(); (src/resolver/resolver.sk:896:5)');
    }
    this.forbidBlockDeclarationModifiers(symbol, 'on a namespace declaration');
    this.checkNoBaseTypes(symbol, 'A namespace');
  };
  Resolver.prototype.initializeEnum = function(symbol) {
    if (!symbol.type.isEnum()) {
      throw new Error('assert symbol.type.isEnum(); (src/resolver/resolver.sk:902:5)');
    }
    this.forbidBlockDeclarationModifiers(symbol, 'on an enum declaration');
    this.checkNoBaseTypes(symbol, 'An enum');
    if (symbol.type.findMember('toString') === null && !symbol.isImport()) {
      this.addAutoGeneratedMember(symbol.type, 'toString');
    }
  };
  Resolver.prototype.resolveBaseTypes = function(symbol) {
    var node = symbol.node;
    var type = symbol.type;
    var baseTypes = this.collectAndResolveBaseTypes(symbol);
    var unmergedMembers = new StringMap();
    if (type.relevantTypes !== null) {
      throw new Error('assert type.relevantTypes == null; (src/resolver/resolver.sk:917:5)');
    }
    type.relevantTypes = [];
    for (var i = 0; i < baseTypes.length; i = i + 1 | 0) {
      var base = baseTypes[i];
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
        throw new Error('assert !baseType.hasBaseType(type); (src/resolver/resolver.sk:949:7)');
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
          var combined = this.createSymbol(memberSymbol.name, SymbolKind.UNMERGED);
          combined.enclosingSymbol = symbol;
          combined.identicalMembers = [unmerged, member];
          unmergedMembers.set(memberSymbol.name, new Member(combined));
        } else {
          if (unmerged.symbol.kind !== SymbolKind.UNMERGED) {
            throw new Error('assert unmerged.symbol.kind == .UNMERGED; (src/resolver/resolver.sk:967:11)');
          }
          unmerged.symbol.identicalMembers.push(member);
        }
      }
    }
    var baseMembers = unmergedMembers.values();
    for (var i = 0; i < baseMembers.length; i = i + 1 | 0) {
      var member = baseMembers[i];
      var existing = type.findMember(member.symbol.name);
      if (existing !== null) {
        if (existing.symbol.overriddenMember !== null) {
          throw new Error('assert existing.symbol.overriddenMember == null; (src/resolver/resolver.sk:982:9)');
        }
        existing.symbol.overriddenMember = member;
      } else if (member.symbol.name !== 'new') {
        type.addMember(member);
      }
    }
  };
  Resolver.prototype.resolveTypeParameters = function(symbol, node) {
    if (node !== null && node.hasChildren()) {
      symbol.parameters = [];
      this.resolveNodes(node.children);
      for (var i = 0; i < node.children.length; i = i + 1 | 0) {
        symbol.parameters.push(node.children[i].symbol);
      }
      symbol.sortParametersByDependencies();
    }
  };
  Resolver.prototype.initializeObject = function(symbol) {
    if (!symbol.type.isObject()) {
      throw new Error('assert symbol.type.isObject(); (src/resolver/resolver.sk:1008:5)');
    }
    this.forbidBlockDeclarationModifiers(symbol, 'on an object declaration');
    var node = symbol.node.firstNonExtensionSibling();
    var type = symbol.type;
    this.resolveTypeParameters(symbol, node.objectParameters());
    if (!type.isInterface() && type.$constructor() === null && !symbol.isImport()) {
      this.addAutoGeneratedMember(type, 'new');
    }
    this.resolveBaseTypes(symbol);
  };
  Resolver.prototype.initializeFunction = function(symbol) {
    var enclosingSymbol = symbol.enclosingSymbol;
    if (enclosingSymbol !== null && in_SymbolKind.isTypeWithInstances(enclosingSymbol.kind) && (this.context.symbolForThis === null || this.context.symbolForThis !== enclosingSymbol)) {
      throw new Error('assert enclosingSymbol == null || !enclosingSymbol.kind.isTypeWithInstances() ||\n      context.symbolForThis != null && context.symbolForThis == enclosingSymbol; (src/resolver/resolver.sk:1027:5)');
    }
    this.unexpectedModifierIfPresent(symbol, SymbolFlag.CONST, 'on a function declaration');
    this.unexpectedModifierIfPresent(symbol, SymbolFlag.FINAL, 'on a function declaration');
    if (enclosingSymbol !== null) {
      if (!in_SymbolKind.isTypeWithInstances(enclosingSymbol.kind)) {
        this.unexpectedModifierIfPresent(symbol, SymbolFlag.STATIC, 'outside an object declaration');
      }
      if (symbol.kind === SymbolKind.CONSTRUCTOR_FUNCTION) {
        if (enclosingSymbol.isExport()) {
          this.unexpectedModifierIfPresent(symbol, SymbolFlag.IMPORT, 'on an exported declaration');
          symbol.flags = symbol.flags & ~SymbolFlag.IMPORT | SymbolFlag.EXPORT;
          this.redundantModifierIfPresent(symbol, SymbolFlag.EXPORT, 'on an constructor for an exported object');
        } else if (enclosingSymbol.isImport()) {
          this.unexpectedModifierIfPresent(symbol, SymbolFlag.EXPORT, 'on an imported declaration');
          symbol.flags = symbol.flags & ~SymbolFlag.EXPORT | SymbolFlag.IMPORT;
          this.redundantModifierIfPresent(symbol, SymbolFlag.IMPORT, 'on an constructor for an imported object');
        }
      } else if (symbol.isExport() && !enclosingSymbol.isExport() && enclosingSymbol.kind !== SymbolKind.GLOBAL_NAMESPACE) {
        this.unexpectedModifierIfPresent(symbol, SymbolFlag.EXPORT, 'on a non-exported type');
      }
    }
    if (symbol.isImport()) {
      this.unexpectedModifierIfPresent(symbol, SymbolFlag.EXPORT, 'on an imported declaration');
    }
    var node = symbol.node;
    var resultType = null;
    if (node.kind === NodeKind.FUNCTION) {
      var result = node.functionResult();
      this.resolveTypeParameters(symbol, node.functionParameters());
      this.resolveAsParameterizedType(result);
      this.checkIsValidFunctionReturnType(result);
      resultType = result.type;
    } else {
      if (node.kind !== NodeKind.CONSTRUCTOR) {
        throw new Error('assert node.kind == .CONSTRUCTOR; (src/resolver/resolver.sk:1076:7)');
      }
      resultType = this.cache.ensureTypeIsParameterized(enclosingSymbol.type);
      var members = enclosingSymbol.type.members.values();
      for (var i = 0; i < members.length; i = i + 1 | 0) {
        var member = members[i].symbol;
        if (!member.isImport() && in_SymbolKind.isFunction(member.kind) && member.node.functionBlock() === null) {
          enclosingSymbol.reasonForAbstract = member;
          enclosingSymbol.flags |= SymbolFlag.ABSTRACT;
          break;
        }
      }
    }
    var $arguments = node.functionArguments();
    this.resolve($arguments, null);
    symbol.type = this.cache.errorType;
    if (!resultType.isError(this.cache)) {
      var argumentTypes = [];
      for (var i = 0; i < $arguments.children.length; i = i + 1 | 0) {
        var type = $arguments.children[i].symbol.type;
        if (type.isError(this.cache)) {
          return;
        }
        argumentTypes.push(type);
      }
      if (symbol.hasParameters()) {
        symbol.type = new Type(symbol);
        argumentTypes.unshift(resultType);
        symbol.type.relevantTypes = argumentTypes;
      } else {
        symbol.type = this.cache.functionType(resultType, argumentTypes);
      }
    }
    var overriddenMember = symbol.overriddenMember;
    if (overriddenMember !== null && symbol.kind !== SymbolKind.CONSTRUCTOR_FUNCTION) {
      this.initializeMember(overriddenMember);
      var base = overriddenMember.type;
      var derived = symbol.type;
      if (!base.isError(this.cache) && !derived.isError(this.cache)) {
        var overriddenSymbol = overriddenMember.symbol;
        if (!base.isFunction() || !in_SymbolKind.isInstance(overriddenSymbol.kind) || !in_SymbolKind.isInstance(symbol.kind)) {
          semanticErrorBadOverride(this.log, node.declarationName().range, symbol.name, overriddenSymbol.enclosingSymbol.type, overriddenSymbol.node.declarationName().range);
        } else if (base !== derived) {
          semanticErrorOverrideDifferentTypes(this.log, node.declarationName().range, symbol.name, base, derived, overriddenSymbol.node.declarationName().range);
        } else if (!symbol.isOverride()) {
          semanticErrorModifierMissingOverride(this.log, node.declarationName().range, symbol.name, overriddenSymbol.node.declarationName().range);
        } else if (!overriddenSymbol.isVirtual()) {
          semanticErrorCannotOverrideNonVirtual(this.log, node.declarationName().range, symbol.name, overriddenSymbol.node.declarationName().range);
        } else {
          this.redundantModifierIfPresent(symbol, SymbolFlag.VIRTUAL, 'on an overriding function');
        }
      }
      symbol.flags |= SymbolFlag.VIRTUAL;
    } else if (!symbol.isObjectMember()) {
      this.unexpectedModifierIfPresent(symbol, SymbolFlag.VIRTUAL, 'outside an object declaration');
      this.unexpectedModifierIfPresent(symbol, SymbolFlag.OVERRIDE, 'outside an object declaration');
    } else {
      if (!in_SymbolKind.isInstance(symbol.kind)) {
        this.unexpectedModifierIfPresent(symbol, SymbolFlag.VIRTUAL, 'on a non-instance function');
      }
      this.unexpectedModifierIfPresent(symbol, SymbolFlag.OVERRIDE, "on a function that doesn't override anything");
      if (symbol.isOverride()) {
        symbol.flags |= SymbolFlag.VIRTUAL;
      }
    }
  };
  Resolver.prototype.initializeVariable = function(symbol) {
    this.unexpectedModifierIfPresent(symbol, SymbolFlag.INLINE, 'on a variable declaration');
    this.unexpectedModifierIfPresent(symbol, SymbolFlag.VIRTUAL, 'on a variable declaration');
    this.unexpectedModifierIfPresent(symbol, SymbolFlag.OVERRIDE, 'on a variable declaration');
    if (symbol.enclosingSymbol === null || !in_SymbolKind.isTypeWithInstances(symbol.enclosingSymbol.kind)) {
      this.unexpectedModifierIfPresent(symbol, SymbolFlag.STATIC, 'outside an object declaration');
    }
    if (symbol.isConst()) {
      this.redundantModifierIfPresent(symbol, SymbolFlag.FINAL, 'on a const variable declaration');
    }
    if (symbol.isImport()) {
      this.unexpectedModifierIfPresent(symbol, SymbolFlag.EXPORT, 'on an imported declaration');
    }
    var node = symbol.node;
    var variableType = node.variableType();
    if (variableType === null) {
      if (node.parent.kind === NodeKind.VARIABLE_CLUSTER) {
        variableType = node.parent.clusterType().clone();
      } else {
        if (!symbol.isEnumValue()) {
          throw new Error('assert symbol.isEnumValue(); (src/resolver/resolver.sk:1201:9)');
        }
        var type = symbol.enclosingSymbol.type;
        variableType = Node.createType(type).withSymbol(symbol.enclosingSymbol);
        symbol.flags |= SymbolFlag.FINAL | SymbolFlag.STATIC | symbol.enclosingSymbol.flags & (SymbolFlag.IMPORT | SymbolFlag.EXPORT);
        var variableValue = node.variableValue();
        if (variableValue !== null) {
          this.resolveAsExpressionWithConversion(variableValue, this.cache.intType, CastKind.IMPLICIT_CAST);
          this.constantFolder.foldConstants(variableValue);
          if (variableValue.kind === NodeKind.INT) {
            symbol.constant = variableValue.content;
          } else {
            variableType = Node.createType(this.cache.errorType);
            if (!variableValue.type.isError(this.cache)) {
              semanticErrorBadIntegerConstant(this.log, variableValue.range, variableValue.type);
            }
          }
        } else {
          var index = node.parent.children.indexOf(node);
          if (index > 0) {
            var previous = node.parent.children[index - 1 | 0].symbol;
            this.initializeSymbol(previous);
            if (!previous.type.isError(this.cache)) {
              var constant = previous.constant.asInt();
              var value = type.isEnumFlags() ? constant * 2 : constant + 1;
              if (value === (value | 0)) {
                symbol.constant = new IntContent(value | 0);
              } else {
                semanticErrorEnumValueOutOfRange(this.log, node.range, symbol.name);
                variableType = Node.createType(this.cache.errorType);
              }
            } else {
              variableType = Node.createType(this.cache.errorType);
            }
          } else {
            symbol.constant = new IntContent(type.isEnumFlags() ? 1 : 0);
          }
        }
      }
      if (variableType === null) {
        throw new Error('assert variableType != null; (src/resolver/resolver.sk:1250:7)');
      }
      node.replaceChild(1, variableType);
    }
    if (variableType.kind === NodeKind.VAR) {
      var value = node.variableValue();
      if (value === null) {
        semanticErrorVarMissingValue(this.log, node.declarationName().range);
        symbol.type = this.cache.errorType;
      } else {
        this.resolveAsParameterizedExpression(value);
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
    if (symbol.isConst()) {
      var value = node.variableValue();
      if (value === null) {
        semanticErrorConstMissingValue(this.log, node.declarationName().range);
      } else {
        this.resolveAsExpressionWithConversion(value, symbol.type, CastKind.IMPLICIT_CAST);
        this.constantFolder.foldConstants(value);
        if (in_NodeKind.isConstant(value.kind)) {
          symbol.constant = value.content;
        } else if (!value.type.isError(this.cache) && !symbol.type.isError(this.cache)) {
          semanticErrorNonConstantConstValue(this.log, value.range);
          value.type = this.cache.errorType;
        }
      }
    }
  };
  Resolver.prototype.initializeParameter = function(symbol) {
    var type = new Type(symbol);
    var bound = symbol.node.parameterBound();
    symbol.type = type;
    if (bound !== null) {
      this.resolveAsParameterizedType(bound);
      var boundType = bound.type;
      if (boundType.isError(this.cache)) {
        symbol.type = this.cache.errorType;
      } else if (!boundType.isInterface()) {
        semanticErrorBadTypeParameterBound(this.log, bound.range, boundType);
      } else {
        if (type.relevantTypes !== null) {
          throw new Error('assert type.relevantTypes == null; (src/resolver/resolver.sk:1341:9)');
        }
        type.relevantTypes = [boundType];
        type.copyMembersFrom(boundType);
      }
    }
  };
  Resolver.prototype.initializeAlias = function(symbol) {
    var value = symbol.node.aliasValue();
    this.resolveAsType(value);
    symbol.type = value.type;
  };
  Resolver.prototype.initializeDeclaration = function(node) {
    var symbol = node.symbol;
    if (symbol === null) {
      throw new Error('assert symbol != null; (src/resolver/resolver.sk:1357:5)');
    }
    if (symbol.isUninitialized()) {
      symbol.flags |= SymbolFlag.INITIALIZING;
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
        this.initializeObject(symbol);
        break;
      case 14:
      case 15:
      case 16:
        this.initializeFunction(symbol);
        break;
      case 17:
      case 18:
      case 19:
        this.initializeVariable(symbol);
        break;
      case 6:
      case 7:
        this.initializeParameter(symbol);
        break;
      case 5:
        this.initializeAlias(symbol);
        break;
      case 0:
        break;
      default:
        throw new Error('assert false; (src/resolver/resolver.sk:1384:19)');
        break;
      }
      this.context = oldContext;
      this.typeContext = oldTypeContext;
      this.resultType = oldResultType;
      if (symbol.type === null) {
        throw new Error('assert symbol.type != null; (src/resolver/resolver.sk:1391:7)');
      }
      if (!symbol.isInitializing()) {
        throw new Error('assert symbol.isInitializing(); (src/resolver/resolver.sk:1392:7)');
      }
      if (symbol.isInitialized()) {
        throw new Error('assert !symbol.isInitialized(); (src/resolver/resolver.sk:1393:7)');
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
        names.push(symbol.identicalMembers[i].symbol.fullName());
      }
      semanticErrorAmbiguousSymbol(this.log, range, symbol.name, names);
      member.type = this.cache.errorType;
      symbol.type = this.cache.errorType;
      return;
    }
    this.initializeMember(member);
  };
  Resolver.prototype.initializeMember = function(member) {
    if (member.type !== null) {
      return;
    }
    if (trace.GENERICS) {
      trace.log('initializeMember ' + member.symbol.fullName() + (member.parameterizedType !== null ? ' on ' + member.parameterizedType : ''));
      trace.indent();
    }
    if (member.dependency !== null) {
      if (member.dependency.symbol !== member.symbol) {
        throw new Error('assert member.dependency.symbol == member.symbol; (src/resolver/resolver.sk:1443:7)');
      }
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
    if (trace.GENERICS) {
      trace.dedent();
    }
  };
  Resolver.prototype.createSymbol = function(name, kind) {
    var symbol = new Symbol(name, kind);
    this.allSymbols.push(symbol);
    return symbol;
  };
  Resolver.prototype.findModifierName = function(symbol, flag) {
    var node = symbol.node.parent;
    if (node.kind === NodeKind.VARIABLE_CLUSTER) {
      node = node.parent;
    }
    while (node !== null && node.kind === NodeKind.MODIFIER) {
      var modifierName = node.modifierName();
      if (nameToSymbolFlag.get(modifierName.asString()) === flag) {
        return modifierName;
      }
      node = node.parent;
    }
    return null;
  };
  Resolver.prototype.redundantModifierIfPresent = function(symbol, flag, where) {
    if ((symbol.flags & flag) !== 0 && !symbol.hasModifierErrors()) {
      var modifierName = this.findModifierName(symbol, flag);
      if (modifierName !== null) {
        semanticErrorRedundantModifier(this.log, modifierName.range, modifierName.asString(), where);
      }
    }
  };
  Resolver.prototype.unexpectedModifierIfPresent = function(symbol, flag, where) {
    if ((symbol.flags & flag) !== 0 && !symbol.hasModifierErrors()) {
      var modifierName = this.findModifierName(symbol, flag);
      if (modifierName !== null) {
        semanticErrorUnexpectedModifier(this.log, modifierName.range, modifierName.asString(), where);
      }
    }
  };
  Resolver.prototype.generateDefaultConstructor = function(symbol) {
    var enclosingSymbol = symbol.enclosingSymbol;
    var members = enclosingSymbol.type.members.values();
    var $arguments = [];
    var superArguments = null;
    var memberInitializers = [];
    var isPure = true;
    var baseClass = enclosingSymbol.type.isClass() ? enclosingSymbol.type.baseClass() : null;
    if (baseClass !== null) {
      isPure = false;
      var $constructor = baseClass.$constructor();
      if ($constructor !== null) {
        this.initializeMember($constructor);
        if ($constructor.type.isFunction()) {
          var argumentTypes = $constructor.type.argumentTypes();
          superArguments = [];
          for (var j = 0; j < argumentTypes.length; j = j + 1 | 0) {
            var name = '_' + $arguments.length;
            var argument = Node.createVariable(Node.createName(name), Node.createType(argumentTypes[j]), null);
            argument.symbol = this.createSymbol(name, SymbolKind.LOCAL_VARIABLE);
            argument.symbol.node = argument;
            $arguments.push(argument);
            superArguments.push(Node.createName(name));
          }
        } else {
          if (!$constructor.type.isError(this.cache)) {
            throw new Error('assert constructor.type.isError(cache); (src/resolver/resolver.sk:1531:11)');
          }
          symbol.flags |= SymbolFlag.INITIALIZED;
          symbol.type = this.cache.errorType;
          return;
        }
      }
    }
    var uninitializedMembers = [];
    for (var i = 0; i < members.length; i = i + 1 | 0) {
      var member = members[i];
      var memberSymbol = member.symbol;
      if (memberSymbol.kind === SymbolKind.INSTANCE_VARIABLE && memberSymbol.enclosingSymbol === enclosingSymbol) {
        var value = memberSymbol.node.variableValue();
        if (value === null) {
          this.initializeMember(member);
          if (member.type.isError(this.cache)) {
            symbol.flags |= SymbolFlag.INITIALIZED;
            symbol.type = this.cache.errorType;
            return;
          }
          uninitializedMembers.push(member);
        } else if (!in_NodeKind.isConstant(value.kind)) {
          isPure = false;
        }
      }
    }
    uninitializedMembers.sort(function(comparison) { return function(a, b) { return comparison.compare(a, b); }; }(Resolver.comparison));
    for (var i = 0; i < uninitializedMembers.length; i = i + 1 | 0) {
      var member = uninitializedMembers[i];
      var name = '_' + $arguments.length;
      var argument = Node.createVariable(Node.createName(name), Node.createType(member.type), null);
      argument.symbol = this.createSymbol(name, SymbolKind.LOCAL_VARIABLE);
      argument.symbol.node = argument;
      $arguments.push(argument);
      memberInitializers.push(Node.createMemberInitializer(Node.createName(member.symbol.name), Node.createName(name)));
    }
    symbol.kind = SymbolKind.CONSTRUCTOR_FUNCTION;
    symbol.node = Node.createConstructor(Node.createName(symbol.name), Node.createNodeList($arguments), Node.createBlock([]), superArguments !== null ? Node.createSuperCall(superArguments) : null, memberInitializers !== null ? Node.createNodeList(memberInitializers) : null);
    enclosingSymbol.node.declarationBlock().appendChild(symbol.node);
    if (enclosingSymbol.node.scope === null) {
      throw new Error('assert enclosingSymbol.node.scope != null; (src/resolver/resolver.sk:1600:5)');
    }
    var scope = new Scope(enclosingSymbol.node.scope);
    symbol.node.symbol = symbol;
    symbol.node.scope = scope;
    for (var i = 0; i < $arguments.length; i = i + 1 | 0) {
      scope.insert(new Member($arguments[i].symbol));
    }
    if (isPure) {
      symbol.flags |= SymbolFlag.PURE;
    }
  };
  Resolver.prototype.generateDefaultToString = function(symbol) {
    if (!symbol.isEnumMember()) {
      throw new Error('assert symbol.isEnumMember(); (src/resolver/resolver.sk:1615:5)');
    }
    var enclosingSymbol = symbol.enclosingSymbol;
    var enclosingNode = enclosingSymbol.node;
    var members = enclosingSymbol.type.members.values();
    var fields = [];
    var i = 0;
    for (i = 0; i < members.length; i = i + 1 | 0) {
      var field = members[i].symbol;
      if (field.kind === SymbolKind.GLOBAL_VARIABLE && !field.isFromExtension()) {
        fields.push(field);
      }
    }
    for (i = 0; i < fields.length; i = i + 1 | 0) {
      var field = fields[i];
      this.initializeSymbol(field);
      if (field.type.isError(this.cache)) {
        break;
      }
      var value = field.constant.asInt();
      var j = 0;
      for (j = 0; j < i; j = j + 1 | 0) {
        var other = fields[j];
        if (value === other.constant.asInt()) {
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
    var statement = null;
    if (fields.length === 0 || i < fields.length) {
      statement = Node.createReturn(Node.createString(''));
    } else {
      var cases = [];
      for (i = 0; i < fields.length; i = i + 1 | 0) {
        var field = fields[i];
        cases.push(Node.createCase([Node.createDot(null, Node.createName(field.name))], Node.createBlock([Node.createReturn(Node.createString(field.name))])));
      }
      cases.push(Node.createCase([], Node.createBlock([Node.createReturn(Node.createString(''))])));
      statement = Node.createSwitch(Node.createThis(), cases);
    }
    symbol.kind = SymbolKind.INSTANCE_FUNCTION;
    symbol.flags = SymbolFlag.FROM_EXTENSION;
    symbol.node = Node.createFunction(Node.createName(symbol.name), Node.createNodeList([]), Node.createBlock([statement]), Node.createType(this.cache.stringType), null).withSymbol(symbol);
    block.appendChild(symbol.node);
    this.prepareNode(extension, enclosingNode.parent.scope);
    this.resolve(extension, null);
  };
  Resolver.prototype.initializeSymbol = function(symbol) {
    if (symbol.kind === SymbolKind.AUTOMATIC) {
      if (symbol.name === 'new') {
        this.generateDefaultConstructor(symbol);
      } else if (symbol.name === 'toString') {
        this.generateDefaultToString(symbol);
      } else {
        throw new Error('assert false; (src/resolver/resolver.sk:1697:12)');
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
        var identical = symbol.identicalMembers[i];
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
        symbol.type = types[0];
      }
      return;
    }
    if (symbol.isUninitialized()) {
      if (symbol.node === null) {
        throw new Error('assert symbol.node != null; (src/resolver/resolver.sk:1733:7)');
      }
      this.initializeDeclaration(symbol.node);
      if (symbol.isInitializing()) {
        throw new Error('assert !symbol.isInitializing(); (src/resolver/resolver.sk:1735:7)');
      }
      if (!symbol.isInitialized()) {
        throw new Error('assert symbol.isInitialized(); (src/resolver/resolver.sk:1736:7)');
      }
      if (symbol.type === null) {
        throw new Error('assert symbol.type != null; (src/resolver/resolver.sk:1737:7)');
      }
    } else if (symbol.isInitializing()) {
      semanticErrorCyclicDeclaration(this.log, symbol.node.firstNonExtensionSibling().declarationName().range, symbol.name);
      symbol.type = this.cache.errorType;
    }
  };
  Resolver.prototype.resolveArguments = function($arguments, argumentTypes, outer, inner) {
    if (argumentTypes.length !== $arguments.length) {
      var range = Range.equal(outer, inner) ? outer : Range.after(outer, inner);
      semanticErrorArgumentCount(this.log, range, argumentTypes.length, $arguments.length);
      this.resolveNodesAsExpressions($arguments);
      return;
    }
    for (var i = 0; i < $arguments.length; i = i + 1 | 0) {
      this.resolveAsExpressionWithConversion($arguments[i], argumentTypes[i], CastKind.IMPLICIT_CAST);
    }
  };
  Resolver.prototype.resolveAsType = function(node) {
    if (!in_NodeKind.isExpression(node.kind)) {
      throw new Error('assert node.kind.isExpression(); (src/resolver/resolver.sk:1763:5)');
    }
    this.resolve(node, null);
    this.checkIsType(node);
  };
  Resolver.prototype.resolveAsParameterizedType = function(node) {
    this.resolveAsType(node);
    this.checkIsParameterized(node);
  };
  Resolver.prototype.resolveAsParameterizedExpression = function(node) {
    if (!in_NodeKind.isExpression(node.kind)) {
      throw new Error('assert node.kind.isExpression(); (src/resolver/resolver.sk:1774:5)');
    }
    this.resolve(node, null);
    this.checkIsInstance(node);
    this.checkIsParameterized(node);
  };
  Resolver.prototype.resolveAsExpressionWithTypeContext = function(node, type) {
    if (!in_NodeKind.isExpression(node.kind)) {
      throw new Error('assert node.kind.isExpression(); (src/resolver/resolver.sk:1781:5)');
    }
    this.resolve(node, type);
    this.checkIsInstance(node);
  };
  Resolver.prototype.resolveAsExpressionWithConversion = function(node, type, kind) {
    if (!in_NodeKind.isExpression(node.kind)) {
      throw new Error('assert node.kind.isExpression(); (src/resolver/resolver.sk:1787:5)');
    }
    this.resolve(node, type);
    this.checkIsInstance(node);
    if (type !== null) {
      this.checkConversion(type, node, kind);
    }
  };
  Resolver.prototype.resolveNodes = function(nodes) {
    for (var i = 0; i < nodes.length; i = i + 1 | 0) {
      this.resolve(nodes[i], null);
    }
  };
  Resolver.prototype.resolveNodesAsExpressions = function(nodes) {
    for (var i = 0; i < nodes.length; i = i + 1 | 0) {
      this.resolveAsParameterizedExpression(nodes[i]);
    }
  };
  Resolver.prototype.resolveNodesAsVariableTypes = function(nodes) {
    for (var i = 0; i < nodes.length; i = i + 1 | 0) {
      var node = nodes[i];
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
      throw new Error('assert node.parent == null; (src/resolver/resolver.sk:1820:5)');
    }
    this.resolveChildren(node);
  };
  Resolver.prototype.resolveFile = function(node) {
    if (node.parent === null) {
      throw new Error('assert node.parent != null; (src/resolver/resolver.sk:1825:5)');
    }
    if (node.parent.kind !== NodeKind.PROGRAM) {
      throw new Error('assert node.parent.kind == .PROGRAM; (src/resolver/resolver.sk:1826:5)');
    }
    this.resolve(node.fileBlock(), null);
  };
  Resolver.prototype.resolveBlock = function(node) {
    this.resolveChildren(node);
    var statements = node.blockStatements();
    for (var i = 0; i < statements.length; i = i + 1 | 0) {
      var child = statements[i];
      var kind = child.kind;
      if (kind === NodeKind.ASSERT_CONST || kind === NodeKind.ASSERT && this.options.removeAsserts) {
        node.removeChildAtIndex(i);
        i = i - 1 | 0;
      }
    }
  };
  Resolver.prototype.resolveCase = function(node) {
    if (node.parent === null) {
      throw new Error('assert node.parent != null; (src/resolver/resolver.sk:1847:5)');
    }
    if (node.parent.kind !== NodeKind.SWITCH) {
      throw new Error('assert node.parent.kind == .SWITCH; (src/resolver/resolver.sk:1848:5)');
    }
    if (this.context.switchValue === null) {
      throw new Error('assert context.switchValue != null; (src/resolver/resolver.sk:1849:5)');
    }
    if (this.context.switchValue.type === null) {
      throw new Error('assert context.switchValue.type != null; (src/resolver/resolver.sk:1850:5)');
    }
    var values = node.caseValues();
    var block = node.caseBlock();
    for (var i = 0; i < values.length; i = i + 1 | 0) {
      var value = values[i];
      this.resolveAsExpressionWithConversion(value, this.context.switchValue.type, CastKind.IMPLICIT_CAST);
      this.constantFolder.foldConstants(value);
      if (!value.type.isError(this.cache) && !in_NodeKind.isConstant(value.kind)) {
        semanticErrorNonConstantCaseValue(this.log, value.range);
        value.type = this.cache.errorType;
      }
    }
    this.resolve(block, null);
  };
  Resolver.prototype.resolveUsing = function(node) {
    this.checkInsideBlock(node);
  };
  Resolver.prototype.resolveNamespace = function(node) {
    this.checkDeclarationLocation(node, AllowDeclaration.ALLOW_TOP_LEVEL);
    if (node.symbol !== null) {
      this.initializeSymbol(node.symbol);
    }
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
      var member = members[i];
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
    if (in_SymbolKind.isTypeWithInstances(node.symbol.kind)) {
      this.context.symbolForThis = node.symbol;
    }
    this.resolve(node.declarationBlock(), null);
    this.context.symbolForThis = oldSymbolForThis;
  };
  Resolver.prototype.resolveFunction = function(node) {
    var symbol = node.symbol;
    if (symbol.enclosingSymbol !== null && in_SymbolKind.isTypeWithInstances(symbol.enclosingSymbol.kind) && (this.context.symbolForThis === null || this.context.symbolForThis !== symbol.enclosingSymbol)) {
      throw new Error('assert symbol.enclosingSymbol == null || !symbol.enclosingSymbol.kind.isTypeWithInstances() ||\n      context.symbolForThis != null && context.symbolForThis == symbol.enclosingSymbol; (src/resolver/resolver.sk:1934:5)');
    }
    this.checkDeclarationLocation(node, AllowDeclaration.ALLOW_TOP_OR_OBJECT_LEVEL);
    this.initializeSymbol(symbol);
    var oldFunctionSymbol = this.context.functionSymbol;
    this.context.functionSymbol = symbol;
    var block = node.functionBlock();
    if (block !== null) {
      var oldResultType = this.resultType;
      if (symbol.isImport()) {
        semanticErrorCannotImplementImportedFunction(this.log, block.range);
      }
      if (symbol.type.isError(this.cache)) {
        this.resultType = this.cache.errorType;
      } else if (symbol.kind === SymbolKind.CONSTRUCTOR_FUNCTION) {
        this.resultType = this.cache.voidType;
      } else {
        this.resultType = symbol.type.resultType();
      }
      this.resolve(block, null);
      if (!this.resultType.isError(this.cache) && !this.resultType.isVoid(this.cache) && !block.blockAlwaysEndsWithReturn()) {
        semanticErrorMissingReturn(this.log, node.declarationName().range, symbol.name, this.resultType);
      }
      this.resultType = oldResultType;
    } else if (!symbol.isImport() && !symbol.isVirtual()) {
      if (symbol.kind === SymbolKind.INSTANCE_FUNCTION) {
        semanticErrorFunctionMustBeAbstract(this.log, node.declarationName().range);
      } else if (symbol.kind === SymbolKind.CONSTRUCTOR_FUNCTION) {
        semanticErrorUnimplementedConstructor(this.log, node.declarationName().range);
      } else {
        semanticErrorUnimplementedFunction(this.log, node.declarationName().range);
      }
    }
    if (node.kind === NodeKind.CONSTRUCTOR) {
      var overriddenMember = symbol.overriddenMember;
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
            throw new Error('assert overriddenType.isFunction(); (src/resolver/resolver.sk:2003:11)');
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
        semanticErrorAbstractConstructorInitializer(this.log, Range.span((superInitializer !== null ? superInitializer : memberInitializers.children[0]).range, (memberInitializers.children.length < 1 ? superInitializer : memberInitializers.lastChild()).range));
      }
      var enclosingSymbol = symbol.enclosingSymbol;
      if (!enclosingSymbol.isImport()) {
        var members = enclosingSymbol.type.members.values();
        var index = 0;
        for (var i = 0; i < members.length; i = i + 1 | 0) {
          var member = members[i];
          var memberSymbol = member.symbol;
          if (memberSymbol.kind === SymbolKind.INSTANCE_VARIABLE && memberSymbol.enclosingSymbol === enclosingSymbol) {
            var value = memberSymbol.node.variableValue();
            if (value !== null) {
              this.initializeMember(member);
              var oldScope = this.context.scope;
              this.context.scope = node.scope.lexicalParent;
              this.context.functionSymbol = null;
              this.resolve(memberSymbol.node, null);
              this.context.functionSymbol = symbol;
              this.context.scope = oldScope;
              memberInitializers.insertChild(index, Node.createMemberInitializer(Node.createName(memberSymbol.name).withSymbol(memberSymbol).withType(member.type), value.replaceWith(null)));
              index = index + 1 | 0;
            } else {
              var j = 0;
              for (j = 0; j < memberInitializers.children.length; j = j + 1 | 0) {
                if (memberInitializers.children[j].memberInitializerName().asString() === memberSymbol.name) {
                  break;
                }
              }
              if (j === memberInitializers.children.length) {
                this.initializeMember(member);
                memberInitializers.insertChild(index, Node.createMemberInitializer(Node.createName(memberSymbol.name).withSymbol(memberSymbol).withType(member.type), this.createDefaultValue(member.type, memberSymbol.node.declarationName().range)));
                index = index + 1 | 0;
              }
            }
          }
        }
      }
      for (var i = 0; i < memberInitializers.children.length; i = i + 1 | 0) {
        var memberInitializer = memberInitializers.children[i];
        var name = memberInitializer.memberInitializerName();
        var value = memberInitializer.memberInitializerValue();
        var oldScope = this.context.scope;
        this.context.scope = node.scope.lexicalParent;
        this.resolve(name, null);
        this.context.scope = oldScope;
        memberInitializer.symbol = name.symbol;
        if (name.symbol !== null) {
          this.resolveAsExpressionWithConversion(value, name.symbol.type, CastKind.IMPLICIT_CAST);
          for (var j = 0; j < i; j = j + 1 | 0) {
            var other = memberInitializers.children[j];
            if (other.memberInitializerName().symbol === name.symbol) {
              semanticErrorAlreadyInitialized(this.log, value.range, name.symbol.name, other.memberInitializerValue().range);
              break;
            }
          }
        } else {
          this.resolveAsParameterizedExpression(value);
        }
      }
    }
    this.context.functionSymbol = oldFunctionSymbol;
  };
  Resolver.prototype.isPureValue = function(node) {
    var kind = node.kind;
    if (node.type.isError(this.cache)) {
      return true;
    }
    if (kind === NodeKind.LIST) {
      if (node.hasChildren()) {
        for (var i = 0; i < node.children.length; i = i + 1 | 0) {
          if (!this.isPureValue(node.children[i])) {
            return false;
          }
        }
      }
      return true;
    }
    if (kind === NodeKind.CALL) {
      var value = node.callValue();
      var $arguments = node.callArguments();
      if (value.kind !== NodeKind.TYPE || !node.symbol.isPure()) {
        return false;
      }
      for (var i = 0; i < $arguments.length; i = i + 1 | 0) {
        if (!this.isPureValue($arguments[i])) {
          return false;
        }
      }
      return true;
    }
    if (in_NodeKind.isCast(kind)) {
      return this.isPureValue(node.castValue());
    }
    return in_NodeKind.isConstant(kind);
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
      } else if (symbol.isFromExtension() && in_SymbolKind.isTypeWithInstances(enclosingSymbol.kind) && value === null) {
        semanticErrorUninitializedExtensionVariable(this.log, node.declarationName().range);
      }
    }
    if (value !== null) {
      this.resolveAsExpressionWithConversion(value, symbol.isEnumValue() ? this.cache.intType : symbol.type, CastKind.IMPLICIT_CAST);
      if (symbol.kind === SymbolKind.GLOBAL_VARIABLE) {
        this.constantFolder.foldConstants(value);
        if (!this.isPureValue(value) && !symbol.type.isError(this.cache)) {
          semanticErrorNonPureGlobalVariable(this.log, value.range);
          value.type = this.cache.errorType;
        }
      }
    } else if (!symbol.type.isError(this.cache) && node.parent.kind === NodeKind.VARIABLE_CLUSTER && symbol.kind !== SymbolKind.INSTANCE_VARIABLE) {
      node.replaceChild(2, this.createDefaultValue(symbol.type, node.declarationName().range).withType(symbol.type));
    }
  };
  Resolver.prototype.resolveVariableCluster = function(node) {
    var variables = node.clusterVariables();
    this.resolveNodes(variables);
    if (node.parent.kind === NodeKind.FOR) {
      var first = variables[0].symbol;
      for (var i = 1; i < variables.length; i = i + 1 | 0) {
        var current = variables[i].symbol;
        if (!first.type.isError(this.cache) && !current.type.isError(this.cache) && first.type !== current.type) {
          semanticErrorForVariablesMustBeSameType(this.log, node.range, first.name, first.type, current.name, current.type);
          break;
        }
      }
    }
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
        this.resolveAsParameterizedExpression(setup);
        this.checkUnusedExpression(setup);
      }
    }
    if (test !== null) {
      this.resolveAsExpressionWithConversion(test, this.cache.boolType, CastKind.IMPLICIT_CAST);
    }
    if (update !== null) {
      this.resolveAsParameterizedExpression(update);
      this.checkUnusedExpression(update);
    }
    var oldLoop = this.context.loop;
    this.context.loop = node;
    this.resolve(node.forBlock(), null);
    this.context.loop = oldLoop;
  };
  Resolver.prototype.resolveForEach = function(node) {
    var value = node.forEachValue();
    this.checkStatementLocation(node);
    this.resolve(node.forEachVariable(), null);
    this.resolve(value, null);
    if (!value.type.isError(this.cache)) {
      this.log.error(node.range, 'TODO: implement for-each statement');
    }
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
        this.resolveAsParameterizedExpression(value);
      }
      return;
    }
    if (value !== null) {
      this.resolveAsExpressionWithConversion(value, this.resultType, CastKind.IMPLICIT_CAST);
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
    if (node.kind === NodeKind.ASSERT) {
      this.checkStatementLocation(node);
    }
    var value = node.assertValue();
    this.resolveAsExpressionWithConversion(value, this.cache.boolType, CastKind.IMPLICIT_CAST);
    if (node.kind === NodeKind.ASSERT_CONST) {
      this.constantFolder.foldConstants(value);
      if (!value.type.isError(this.cache)) {
        if (!in_NodeKind.isConstant(value.kind)) {
          semanticErrorNonConstantAssert(this.log, value.range);
        } else if (!value.isTrue()) {
          semanticErrorFalseAssert(this.log, node.range);
        }
      }
    }
  };
  Resolver.prototype.resolveExpression = function(node) {
    var value = node.expressionValue();
    if (value.kind !== NodeKind.ERROR) {
      this.checkStatementLocation(node);
    }
    this.resolveAsParameterizedExpression(value);
    this.checkUnusedExpression(value);
  };
  Resolver.prototype.resolveSwitch = function(node) {
    this.checkStatementLocation(node);
    var value = node.switchValue();
    var cases = node.switchCases();
    this.resolveAsParameterizedExpression(value);
    if (!value.type.isError(this.cache) && !value.type.isInteger(this.cache)) {
      semanticErrorNonIntegerSwitch(this.log, value.range, value.type);
      value.type = this.cache.errorType;
    }
    var oldSwitchValue = this.context.switchValue;
    this.context.switchValue = value;
    this.resolveNodes(cases);
    this.context.switchValue = oldSwitchValue;
    var uniqueValues = [];
    for (var i = 0; i < cases.length; i = i + 1 | 0) {
      var child = cases[i];
      if (child.children.length === 1 && i < (cases.length - 1 | 0)) {
        semanticErrorBadDefaultCase(this.log, child.range);
      }
      var caseValues = child.caseValues();
      for (var j = 0; j < caseValues.length; j = j + 1 | 0) {
        var caseValue = caseValues[j];
        if (caseValue.type.isError(this.cache)) {
          continue;
        }
        if (!in_NodeKind.isConstant(caseValue.kind)) {
          throw new Error('assert caseValue.kind.isConstant(); (src/resolver/resolver.sk:2392:9)');
        }
        var k = 0;
        for (k = 0; k < uniqueValues.length; k = k + 1 | 0) {
          var original = uniqueValues[k];
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
    if (in_SymbolKind.isType(member.symbol.kind)) {
      node.become(Node.createType(member.type).withRange(node.range).withSymbol(member.symbol));
      return;
    }
    node.type = member.type;
  };
  Resolver.prototype.resolveThis = function(node) {
    if (this.checkAccessToThis(node.range)) {
      if (this.context.symbolForThis === null) {
        throw new Error('assert context.symbolForThis != null; (src/resolver/resolver.sk:2441:7)');
      }
      var symbol = this.context.symbolForThis;
      this.initializeSymbol(symbol);
      node.symbol = symbol;
      node.type = this.cache.ensureTypeIsParameterized(symbol.type);
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
  Resolver.prototype.resolveInt = function(node) {
    if (node.asInt() === -2147483648) {
      syntaxErrorInvalidInteger(this.log, node.range, node.range.toString());
    }
    node.type = this.cache.intType;
  };
  Resolver.prototype.resolveList = function(node) {
    var values = node.listValues();
    if (this.typeContext !== null && this.typeContext.isError(this.cache)) {
      this.resolveNodesAsExpressions(values);
      return;
    }
    if (this.typeContext !== null && this.typeContext.isList(this.cache)) {
      var itemType = this.typeContext.substitutions[0];
      for (var i = 0; i < values.length; i = i + 1 | 0) {
        this.resolveAsExpressionWithConversion(values[i], itemType, CastKind.IMPLICIT_CAST);
      }
      node.type = this.typeContext;
      return;
    }
    var commonType = null;
    for (var i = 0; i < values.length; i = i + 1 | 0) {
      var value = values[i];
      this.resolveAsParameterizedExpression(value);
      if (commonType === null || value.type.isError(this.cache)) {
        commonType = value.type;
      } else if (!commonType.isError(this.cache)) {
        commonType = this.cache.commonImplicitType(commonType, value.type);
        if (commonType === null) {
          semanticErrorListTypeInferenceFailed(this.log, node.range);
          commonType = this.cache.errorType;
        }
      }
    }
    if (commonType !== null && commonType.isError(this.cache)) {
      return;
    }
    if (commonType === null) {
      semanticErrorListTypeInferenceFailed(this.log, node.range);
      return;
    }
    node.type = this.cache.parameterize(this.cache.listType, [commonType]);
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
    node.symbol = member.symbol;
    dotName.symbol = member.symbol;
    this.initializePotentiallyDuplicatedMember(member, dotName.range);
    var symbolIsType = in_SymbolKind.isType(member.symbol.kind);
    var targetIsType = target === null || in_NodeKind.isType(target.kind);
    if (!type.isNamespace()) {
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
      node.type = member.type;
      dotName.type = member.type;
    }
  };
  Resolver.prototype.resolveCall = function(node) {
    var value = node.callValue();
    var $arguments = node.callArguments();
    if (!in_NodeKind.isExpression(value.kind)) {
      throw new Error('assert value.kind.isExpression(); (src/resolver/resolver.sk:2610:5)');
    }
    this.resolve(value, null);
    this.checkIsParameterized(value);
    var valueType = value.type;
    if (valueType.isError(this.cache)) {
      this.resolveNodesAsExpressions($arguments);
      return;
    }
    if (in_NodeKind.isType(value.kind)) {
      var member = valueType.$constructor();
      if (member === null) {
        semanticErrorUnconstructableType(this.log, value.range, valueType);
        this.resolveNodesAsExpressions($arguments);
        return;
      }
      this.initializeMember(member);
      if (valueType.symbol.isAbstract()) {
        var reason = valueType.symbol.reasonForAbstract;
        semanticErrorAbstractNew(this.log, value.range, valueType, reason.node.declarationName().range, reason.fullName());
        this.resolveNodesAsExpressions($arguments);
        return;
      }
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
  };
  Resolver.prototype.resolveSuperCall = function(node) {
    var $arguments = node.superCallArguments();
    if (this.context.functionSymbol === null || !this.context.functionSymbol.isObjectMember() || this.context.functionSymbol.overriddenMember === null) {
      semanticErrorBadSuperCall(this.log, node.range);
      this.resolveNodesAsExpressions($arguments);
    } else {
      var member = this.context.functionSymbol.overriddenMember;
      this.initializeMember(member);
      var type = member.type;
      if (type.isError(this.cache) || !type.isFunction()) {
        this.resolveNodesAsExpressions($arguments);
        return;
      }
      if (member.symbol.node.functionBlock() === null) {
        semanticErrorAbstractSuperCall(this.log, node.range, member.symbol.node.declarationName().range);
        this.resolveNodesAsExpressions($arguments);
        return;
      }
      this.resolveArguments($arguments, type.argumentTypes(), node.range, node.range);
      node.symbol = member.symbol;
      node.type = type.resultType();
    }
  };
  Resolver.prototype.resolveSequence = function(node) {
    var values = node.sequenceValues();
    for (var i = 0, n = values.length; i < n; i = i + 1 | 0) {
      var child = values[i];
      if (i < (n - 1 | 0)) {
        this.resolveAsParameterizedExpression(child);
        this.checkUnusedExpression(child);
      } else {
        this.resolveAsExpressionWithConversion(child, this.typeContext, node.parent.kind === NodeKind.CAST ? CastKind.EXPLICIT_CAST : CastKind.IMPLICIT_CAST);
      }
    }
  };
  Resolver.prototype.resolveParameterize = function(node) {
    var value = node.parameterizeValue();
    var substitutions = node.parameterizeTypes();
    this.resolve(value, null);
    this.resolveNodesAsVariableTypes(substitutions);
    var unparameterized = value.type;
    if (unparameterized.isError(this.cache)) {
      return;
    }
    if (!unparameterized.hasParameters() || unparameterized.isParameterized()) {
      semanticErrorCannotParameterize(this.log, value.range, unparameterized);
      return;
    }
    var parameters = unparameterized.symbol.parameters;
    var sortedParameters = unparameterized.symbol.sortedParameters;
    if (parameters.length !== substitutions.length) {
      semanticErrorParameterCount(this.log, Range.after(node.range, value.range), parameters.length, substitutions.length);
      return;
    }
    if (parameters.length !== sortedParameters.length) {
      throw new Error('assert parameters.size() == sortedParameters.size(); (src/resolver/resolver.sk:2733:5)');
    }
    var sortedTypes = [];
    for (var i = 0; i < sortedParameters.length; i = i + 1 | 0) {
      var parameter = sortedParameters[i];
      var index = parameters.indexOf(parameter);
      var substitution = substitutions[index];
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
      types.push(substitutions[i].type);
    }
    var parameterized = this.cache.parameterize(unparameterized, types);
    node.become(in_NodeKind.isType(value.kind) ? Node.createType(parameterized).withRange(node.range).withSymbol(value.symbol) : value.replaceWith(null).withRange(node.range).withType(parameterized));
  };
  Resolver.prototype.resolveCast = function(node) {
    var type = node.castType();
    this.resolveAsParameterizedType(type);
    this.checkIsValidVariableType(type);
    this.resolveAsExpressionWithConversion(node.castValue(), type.type, CastKind.EXPLICIT_CAST);
    node.type = type.type;
  };
  Resolver.prototype.resolveUntyped = function(node) {
    this.resolveAsParameterizedExpression(node.untypedValue());
  };
  Resolver.prototype.resolveVar = function(node) {
    semanticErrorUnexpectedNode(this.log, node.range, node.kind);
  };
  Resolver.prototype.resolveUnaryOperator = function(node) {
    var kind = node.kind;
    var value = node.unaryValue();
    if (kind === NodeKind.NEGATIVE && value.kind === NodeKind.INT && value.asInt() === -2147483648) {
      node.become(value.withRange(node.range).withType(this.cache.intType));
      return;
    }
    if (kind === NodeKind.COMPLEMENT && this.typeContext !== null && this.typeContext.isEnumFlags()) {
      this.resolveAsExpressionWithTypeContext(value, this.typeContext);
    } else {
      this.resolveAsParameterizedExpression(value);
    }
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
    } else if (in_NodeKind.isUnaryStorageOperator(kind)) {
      this.checkStorageOperator(node);
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
  Resolver.prototype.wrapWithToStringCall = function(node) {
    if (node.type.isError(this.cache)) {
      return false;
    }
    var toString = node.type.findMember('toString');
    if (toString === null) {
      semanticErrorMissingToString(this.log, node.range, node.type);
      return false;
    }
    this.initializeMember(toString);
    if (toString.type.isError(this.cache)) {
      return false;
    }
    if (toString.type !== this.cache.toStringType) {
      semanticErrorToStringWrongType(this.log, node.range, this.cache.toStringType, toString.type, toString.symbol.node.declarationName().range);
      return false;
    }
    var children = node.removeChildren();
    var name = Node.createName('toString');
    var target = Node.createDot(node.clone().withChildren(children), name);
    var $call = Node.createCall(target, []);
    name.symbol = toString.symbol;
    target.symbol = toString.symbol;
    target.type = this.cache.toStringType;
    $call.type = this.cache.stringType;
    node.become($call);
    return true;
  };
  Resolver.prototype.resolveWithTypeContextTransfer = function(left, right) {
    if (!this.needsTypeContext(left)) {
      this.resolveAsParameterizedExpression(left);
      this.resolveAsExpressionWithTypeContext(right, left.type);
    } else if (!this.needsTypeContext(right)) {
      this.resolveAsParameterizedExpression(right);
      this.resolveAsExpressionWithTypeContext(left, right.type);
    }
  };
  Resolver.prototype.resolveBinaryOperator = function(node) {
    var kind = node.kind;
    var left = node.binaryLeft();
    var right = node.binaryRight();
    if (in_NodeKind.isBinaryStorageOperator(kind)) {
      this.resolveAsParameterizedExpression(left);
      if (!left.type.isError(this.cache)) {
        this.checkStorageOperator(node);
      }
      if (kind === NodeKind.ASSIGN || left.type.isNumeric(this.cache)) {
        this.resolveAsExpressionWithConversion(right, left.type, CastKind.IMPLICIT_CAST);
        this.checkStorage(left);
        node.type = left.type;
        return;
      } else if (kind === NodeKind.ASSIGN_ADD && left.type.isString(this.cache)) {
        this.resolveAsParameterizedExpression(right);
        if (!right.type.isString(this.cache)) {
          this.wrapWithToStringCall(right);
        }
        this.checkStorage(left);
        node.type = left.type;
        return;
      }
    } else if (kind === NodeKind.EQUAL || kind === NodeKind.NOT_EQUAL || kind === NodeKind.LESS_THAN || kind === NodeKind.GREATER_THAN || kind === NodeKind.LESS_THAN_OR_EQUAL || kind === NodeKind.GREATER_THAN_OR_EQUAL) {
      this.resolveWithTypeContextTransfer(left, right);
    } else if (kind === NodeKind.BITWISE_AND || kind === NodeKind.BITWISE_OR || kind === NodeKind.BITWISE_XOR) {
      if (this.typeContext !== null && this.typeContext.isEnumFlags()) {
        this.resolveAsExpressionWithTypeContext(left, this.typeContext);
        this.resolveAsExpressionWithTypeContext(right, this.typeContext);
      } else {
        this.resolveWithTypeContextTransfer(left, right);
      }
    }
    this.resolveAsParameterizedExpression(left);
    this.resolveAsParameterizedExpression(right);
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
        commonType = this.cache.commonImplicitType(leftType, rightType);
        if (commonType.isEnum()) {
          commonType = this.cache.intType;
        }
        node.type = commonType;
      } else if (kind === NodeKind.ADD) {
        if (leftType.isString(this.cache) && rightType.isString(this.cache)) {
          commonType = this.cache.stringType;
          node.type = commonType;
        } else if (leftType.isString(this.cache)) {
          if (this.wrapWithToStringCall(right)) {
            commonType = this.cache.stringType;
            node.type = commonType;
          } else {
            return;
          }
        } else if (rightType.isString(this.cache)) {
          if (this.wrapWithToStringCall(left)) {
            commonType = this.cache.stringType;
            node.type = commonType;
          } else {
            return;
          }
        }
      }
    } else if (kind === NodeKind.REMAINDER || kind === NodeKind.SHIFT_LEFT || kind === NodeKind.SHIFT_RIGHT) {
      if (leftType.isInteger(this.cache) && rightType.isInteger(this.cache)) {
        commonType = this.cache.intType;
        node.type = commonType;
      }
    } else if (kind === NodeKind.BITWISE_AND || kind === NodeKind.BITWISE_OR || kind === NodeKind.BITWISE_XOR) {
      if (leftType === rightType && leftType.isEnumFlags()) {
        commonType = leftType;
        node.type = commonType;
      } else if (leftType.isInteger(this.cache) && rightType.isInteger(this.cache)) {
        commonType = this.cache.intType;
        node.type = commonType;
      }
    } else if (kind === NodeKind.LOGICAL_AND || kind === NodeKind.LOGICAL_OR) {
      if (leftType.isBool(this.cache) && rightType.isBool(this.cache)) {
        commonType = this.cache.boolType;
        node.type = commonType;
      }
    } else if (kind === NodeKind.LESS_THAN || kind === NodeKind.GREATER_THAN || kind === NodeKind.LESS_THAN_OR_EQUAL || kind === NodeKind.GREATER_THAN_OR_EQUAL) {
      if (leftType.isNumeric(this.cache) && rightType.isNumeric(this.cache) || leftType.isString(this.cache) && rightType.isString(this.cache)) {
        commonType = this.cache.commonImplicitType(leftType, rightType);
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
  Resolver.prototype.resolveTernaryOperator = function(node) {
    var left = node.ternaryLeft();
    var middle = node.ternaryMiddle();
    var right = node.ternaryRight();
    this.resolveAsParameterizedExpression(left);
    this.resolveAsParameterizedExpression(middle);
    this.resolveAsParameterizedExpression(right);
    if (!left.type.isError(this.cache) && !middle.type.isError(this.cache) && !right.type.isError(this.cache)) {
      semanticErrorNoTernaryOperator(this.log, node.range, node.kind, left.type, middle.type, right.type);
    }
  };
  function Scope(_0) {
    this.type = null;
    this.locals = null;
    this.lexicalParent = _0;
  }
  Scope.prototype.insert = function(member) {
    if (this.type !== null) {
      this.type.addMember(member);
      return;
    }
    this.insertLocal(member);
  };
  Scope.prototype.insertLocal = function(member) {
    if (this.locals === null) {
      this.locals = new StringMap();
    }
    if (this.locals.has(member.symbol.name)) {
      throw new Error('assert !locals.has(member.symbol.name); (src/resolver/scope.sk:26:5)');
    }
    this.locals.set(member.symbol.name, member);
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
    OTHER_TYPE: 4,
    ALIAS: 5,
    OBJECT_PARAMETER: 6,
    FUNCTION_PARAMETER: 7,
    GLOBAL_NAMESPACE: 8,
    NAMESPACE: 9,
    ENUM: 10,
    ENUM_FLAGS: 11,
    CLASS: 12,
    INTERFACE: 13,
    GLOBAL_FUNCTION: 14,
    INSTANCE_FUNCTION: 15,
    CONSTRUCTOR_FUNCTION: 16,
    LOCAL_VARIABLE: 17,
    GLOBAL_VARIABLE: 18,
    INSTANCE_VARIABLE: 19
  };
  var in_SymbolKind = {};
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
    CONST: 1024,
    PURE: 2048,
    EXPORT: 4096,
    IMPORT: 8192,
    INITIALIZING: 16384,
    INITIALIZED: 32768,
    PRIMITIVE: 65536,
    HAS_LOCATION_ERROR: 131072,
    HAS_MODIFIER_ERRORS: 262144,
    INITIALIZE_MASK: 49152,
    KEYWORD_MASK: 14311
  };
  function Symbol(_0, _1) {
    this.flags = 0;
    this.type = null;
    this.node = null;
    this.enclosingSymbol = null;
    this.reasonForAbstract = null;
    this.overriddenMember = null;
    this.constant = null;
    this.identicalMembers = null;
    this.parameters = null;
    this.sortedParameters = null;
    this.uniqueID = Symbol.generateUniqueID();
    this.name = _0;
    this.kind = _1;
  }
  Symbol.generateUniqueID = function() {
    Symbol.nextUniqueID = Symbol.nextUniqueID + 1 | 0;
    return Symbol.nextUniqueID;
  };
  Symbol.prototype.sortParametersByDependencies = function() {
    this.sortedParameters = this.parameters.slice();
    for (var i = 0; i < this.sortedParameters.length; i = i + 1 | 0) {
      var j = i;
      for (; j < this.sortedParameters.length; j = j + 1 | 0) {
        var k = i;
        var parameter = this.sortedParameters[j];
        if (!parameter.type.isParameter()) {
          continue;
        }
        var parameterBound = parameter.type.bound();
        if (parameterBound === null) {
          break;
        }
        for (; k < this.sortedParameters.length; k = k + 1 | 0) {
          var other = this.sortedParameters[k];
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
        in_List.swap(this.sortedParameters, i, j);
      }
    }
  };
  Symbol.prototype.fullName = function() {
    return this.enclosingSymbol !== null && !in_SymbolKind.isParameter(this.kind) && this.enclosingSymbol.kind !== SymbolKind.GLOBAL_NAMESPACE ? this.enclosingSymbol.fullName() + '.' + this.name : this.name;
  };
  Symbol.prototype.hasParameters = function() {
    return this.parameters !== null && this.parameters.length > 0;
  };
  Symbol.prototype.isEnumValue = function() {
    return in_SymbolKind.isVariable(this.kind) && this.enclosingSymbol !== null && in_SymbolKind.isEnum(this.enclosingSymbol.kind) && !this.isFromExtension();
  };
  Symbol.prototype.isObjectMember = function() {
    return this.enclosingSymbol !== null && in_SymbolKind.isObject(this.enclosingSymbol.kind);
  };
  Symbol.prototype.isEnumMember = function() {
    return this.enclosingSymbol !== null && in_SymbolKind.isEnum(this.enclosingSymbol.kind);
  };
  Symbol.prototype.isOperator = function() {
    return this.enclosingSymbol !== null && this.enclosingSymbol.name === 'operators' && this.enclosingSymbol.enclosingSymbol.kind === SymbolKind.GLOBAL_NAMESPACE;
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
  Symbol.prototype.isConst = function() {
    return (this.flags & SymbolFlag.CONST) !== 0;
  };
  Symbol.prototype.isPure = function() {
    return (this.flags & SymbolFlag.PURE) !== 0;
  };
  Symbol.prototype.isImport = function() {
    return (this.flags & SymbolFlag.IMPORT) !== 0;
  };
  Symbol.prototype.isExport = function() {
    return (this.flags & SymbolFlag.EXPORT) !== 0;
  };
  Symbol.prototype.isImportOrExport = function() {
    return (this.flags & (SymbolFlag.IMPORT | SymbolFlag.EXPORT)) !== 0;
  };
  Symbol.prototype.isUninitialized = function() {
    if ((this.flags & SymbolFlag.INITIALIZE_MASK) === SymbolFlag.INITIALIZE_MASK) {
      throw new Error('assert (flags & .INITIALIZE_MASK) != .INITIALIZE_MASK; (src/resolver/symbol.sk:303:5)');
    }
    return (this.flags & SymbolFlag.INITIALIZE_MASK) === 0;
  };
  Symbol.prototype.isInitializing = function() {
    if ((this.flags & SymbolFlag.INITIALIZE_MASK) === SymbolFlag.INITIALIZE_MASK) {
      throw new Error('assert (flags & .INITIALIZE_MASK) != .INITIALIZE_MASK; (src/resolver/symbol.sk:308:5)');
    }
    return (this.flags & SymbolFlag.INITIALIZING) !== 0;
  };
  Symbol.prototype.isInitialized = function() {
    if ((this.flags & SymbolFlag.INITIALIZE_MASK) === SymbolFlag.INITIALIZE_MASK) {
      throw new Error('assert (flags & .INITIALIZE_MASK) != .INITIALIZE_MASK; (src/resolver/symbol.sk:313:5)');
    }
    return (this.flags & SymbolFlag.INITIALIZED) !== 0;
  };
  Symbol.prototype.isPrimitive = function() {
    return (this.flags & SymbolFlag.PRIMITIVE) !== 0;
  };
  Symbol.prototype.hasLocationError = function() {
    return (this.flags & SymbolFlag.HAS_LOCATION_ERROR) !== 0;
  };
  Symbol.prototype.hasModifierErrors = function() {
    return (this.flags & SymbolFlag.HAS_MODIFIER_ERRORS) !== 0;
  };
  function SymbolMotionPass(_0) {
    this.resolver = _0;
  }
  SymbolMotionPass.run = function(resolver) {
    var pass = new SymbolMotionPass(resolver);
    for (var i = 0; i < resolver.allSymbols.length; i = i + 1 | 0) {
      pass.moveSymbol(resolver.allSymbols[i]);
    }
  };
  SymbolMotionPass.prototype.moveSymbol = function(symbol) {
    var enclosingSymbol = symbol.enclosingSymbol;
    if (!symbol.isImport() && enclosingSymbol !== null && !in_SymbolKind.isParameter(symbol.kind) && (enclosingSymbol.isImport() || in_SymbolKind.isFunction(symbol.kind) && in_SymbolKind.isEnum(enclosingSymbol.kind))) {
      var enclosingType = symbol.enclosingSymbol.type;
      var shadow = this.shadowForSymbol(enclosingSymbol);
      var member = enclosingType.members.get(symbol.name);
      if (member.symbol !== symbol) {
        throw new Error('assert member.symbol == symbol; (src/resolver/symbolmotion.sk:18:7)');
      }
      enclosingType.members.remove(symbol.name);
      if (shadow.findMember(symbol.name) !== null) {
        throw new Error('assert shadow.findMember(symbol.name) == null; (src/resolver/symbolmotion.sk:20:7)');
      }
      shadow.addMember(member);
      symbol.enclosingSymbol = shadow.symbol;
      var block = shadow.symbol.node.declarationBlock();
      var parent = symbol.node.parent;
      var node = symbol.node.remove();
      if (parent.kind === NodeKind.VARIABLE_CLUSTER) {
        node = Node.createVariableCluster(Node.createType(symbol.type), [node]);
        if (parent.children.length === 1) {
          parent.remove();
        }
      }
      block.appendChild(node);
    }
  };
  SymbolMotionPass.prototype.shadowForSymbol = function(symbol) {
    var inName = 'in_' + symbol.name;
    var enclosingSymbol = symbol.enclosingSymbol;
    var inMember = enclosingSymbol.type.findMember(inName);
    if (inMember !== null) {
      return inMember.type;
    }
    var inSymbol = this.resolver.createSymbol(inName, SymbolKind.NAMESPACE);
    inSymbol.enclosingSymbol = enclosingSymbol;
    var inType = new Type(inSymbol);
    inSymbol.type = inType;
    inMember = new Member(inSymbol);
    inMember.type = inType;
    enclosingSymbol.type.addMember(inMember);
    inSymbol.node = Node.createNamespace(Node.createName(inName).withSymbol(inSymbol), Node.createBlock([])).withSymbol(inSymbol);
    symbol.node.insertSiblingAfter(inSymbol.node);
    return inType;
  };
  function Type(_0) {
    this.members = new StringMap();
    this.relevantTypes = null;
    this.substitutions = null;
    this.uniqueID = Type.generateUniqueID();
    this.symbol = _0;
  }
  Type.generateUniqueID = function() {
    Type.nextUniqueID = Type.nextUniqueID + 1 | 0;
    return Type.nextUniqueID;
  };
  Type.prototype.$constructor = function() {
    if (this.symbol === null) {
      return null;
    }
    return this.members.getOrDefault('new', null);
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
        if (this.relevantTypes[i].hasBaseType(type)) {
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
      var member = otherMembers[i];
      if (!this.members.has(member.symbol.name)) {
        this.members.set(member.symbol.name, member);
      }
    }
  };
  Type.prototype.findMember = function(name) {
    return this.members.getOrDefault(name, null);
  };
  Type.environmentToString = function(parameters, substitutions) {
    if (parameters.length !== substitutions.length) {
      throw new Error('assert parameters.size() == substitutions.size(); (src/resolver/type.sk:75:5)');
    }
    var text = '[';
    for (var i = 0; i < parameters.length; i = i + 1 | 0) {
      if (i > 0) {
        text += ', ';
      }
      text += parameters[i].name + ' => ' + substitutions[i];
    }
    return text + ']';
  };
  Type.prototype.toString = function() {
    if (this.substitutions !== null && this.substitutions.length !== this.symbol.parameters.length) {
      throw new Error('assert substitutions == null || substitutions.size() == symbol.parameters.size(); (src/resolver/type.sk:85:5)');
    }
    var parameterText = '';
    if (this.hasParameters()) {
      parameterText = '<';
      for (var i = 0; i < this.symbol.parameters.length; i = i + 1 | 0) {
        if (i > 0) {
          parameterText += ', ';
        }
        parameterText += this.isParameterized() ? this.substitutions[i].toString() : this.symbol.parameters[i].name;
      }
      parameterText += '>';
    }
    if (this.isFunction()) {
      var text = this.resultType() + ' fn' + parameterText + '(';
      var $arguments = this.argumentTypes();
      for (var i = 0; i < $arguments.length; i = i + 1 | 0) {
        if (i > 0) {
          text += ', ';
        }
        text += $arguments[i];
      }
      return text + ')';
    }
    return this.symbol.fullName() + parameterText;
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
      throw new Error('assert isClass(); (src/resolver/type.sk:125:5)');
    }
    if (!this.hasRelevantTypes()) {
      return null;
    }
    var first = this.relevantTypes[0];
    return first.isClass() ? first : null;
  };
  Type.prototype.bound = function() {
    if (!this.isParameter()) {
      throw new Error('assert isParameter(); (src/resolver/type.sk:132:5)');
    }
    return this.hasRelevantTypes() ? this.relevantTypes[0] : null;
  };
  Type.prototype.dependsOnParameter = function(parameter) {
    if (this.symbol === parameter || this.hasParameters() && this.symbol.parameters.indexOf(parameter) >= 0 || this.isParameterized() && this.substitutions.indexOf(parameter.type) >= 0) {
      return true;
    }
    if (this.hasRelevantTypes()) {
      for (var i = 0; i < this.relevantTypes.length; i = i + 1 | 0) {
        var type = this.relevantTypes[i];
        if (type.dependsOnParameter(parameter)) {
          return true;
        }
      }
    }
    return false;
  };
  Type.prototype.resultType = function() {
    if (!this.isFunction()) {
      throw new Error('assert isFunction(); (src/resolver/type.sk:154:5)');
    }
    if (!this.hasRelevantTypes()) {
      throw new Error('assert hasRelevantTypes(); (src/resolver/type.sk:155:5)');
    }
    return this.relevantTypes[0];
  };
  Type.prototype.argumentTypes = function() {
    if (!this.isFunction()) {
      throw new Error('assert isFunction(); (src/resolver/type.sk:160:5)');
    }
    if (!this.hasRelevantTypes()) {
      throw new Error('assert hasRelevantTypes(); (src/resolver/type.sk:161:5)');
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
  Type.prototype.isPrimitive = function() {
    return this.symbol !== null && this.symbol.isPrimitive();
  };
  Type.prototype.isList = function(cache) {
    return this.symbol === cache.listType.symbol;
  };
  Type.prototype.isError = function(cache) {
    return this === cache.errorType;
  };
  Type.prototype.isFunction = function() {
    return this.symbol === null || in_SymbolKind.isFunction(this.symbol.kind);
  };
  Type.prototype.isNamespace = function() {
    return this.symbol !== null && in_SymbolKind.isNamespace(this.symbol.kind);
  };
  Type.prototype.isEnum = function() {
    return this.symbol !== null && in_SymbolKind.isEnum(this.symbol.kind);
  };
  Type.prototype.isRegularEnum = function() {
    return this.symbol !== null && this.symbol.kind === SymbolKind.ENUM;
  };
  Type.prototype.isEnumFlags = function() {
    return this.symbol !== null && this.symbol.kind === SymbolKind.ENUM_FLAGS;
  };
  Type.prototype.isParameter = function() {
    return this.symbol !== null && in_SymbolKind.isParameter(this.symbol.kind);
  };
  Type.prototype.isObject = function() {
    return this.symbol !== null && in_SymbolKind.isObject(this.symbol.kind);
  };
  Type.prototype.isClass = function() {
    return this.symbol !== null && this.symbol.kind === SymbolKind.CLASS;
  };
  Type.prototype.isInterface = function() {
    return this.symbol !== null && this.symbol.kind === SymbolKind.INTERFACE;
  };
  Type.prototype.isReference = function() {
    if (this.isClass()) {
      return !this.isPrimitive();
    }
    return this.isInterface() || this.isFunction() || this.isParameter() && this.bound() !== null;
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
    this.globalType = TypeCache.createType(new Symbol('<global>', SymbolKind.GLOBAL_NAMESPACE), 0);
    this.nullType = TypeCache.createType(new Symbol('null', SymbolKind.OTHER), 0);
    this.voidType = TypeCache.createType(new Symbol('void', SymbolKind.OTHER_TYPE), SymbolFlag.IMPORT);
    this.errorType = TypeCache.createType(new Symbol('<error>', SymbolKind.OTHER), 0);
    this.intType = null;
    this.boolType = null;
    this.floatType = null;
    this.doubleType = null;
    this.stringType = null;
    this.listType = null;
    this.toStringType = null;
    this.hashTable = new IntMap();
  }
  TypeCache.prototype.insertGlobals = function(scope) {
    scope.type = this.globalType;
    scope.insert(new Member(this.voidType.symbol));
  };
  TypeCache.prototype.linkGlobals = function(scope) {
    this.intType = TypeCache.findType(scope, 'int', SymbolFlag.PRIMITIVE);
    this.boolType = TypeCache.findType(scope, 'bool', SymbolFlag.PRIMITIVE);
    this.floatType = TypeCache.findType(scope, 'float', SymbolFlag.PRIMITIVE);
    this.doubleType = TypeCache.findType(scope, 'double', SymbolFlag.PRIMITIVE);
    this.stringType = TypeCache.findType(scope, 'string', SymbolFlag.PRIMITIVE);
    this.listType = TypeCache.findType(scope, 'List', 0);
    this.toStringType = this.functionType(this.stringType, []);
  };
  TypeCache.findType = function(scope, name, flags) {
    var symbol = scope.findLocal(name).symbol;
    symbol.flags |= flags;
    return symbol.type;
  };
  TypeCache.createType = function(symbol, flags) {
    var type = new Type(symbol);
    symbol.type = type;
    symbol.flags |= SymbolFlag.INITIALIZED | flags;
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
  TypeCache.prototype.substitute = function(type, parameters, substitutions) {
    if (parameters.length !== substitutions.length) {
      throw new Error('assert parameters.size() == substitutions.size(); (src/resolver/typecache.sk:86:5)');
    }
    if (trace.GENERICS) {
      trace.log('substitute ' + type + ' with ' + Type.environmentToString(parameters, substitutions));
      trace.indent();
    }
    var result = null;
    if (type.isFunction()) {
      result = this.parameterize(null, this.substituteAll(type.relevantTypes, parameters, substitutions));
    } else if (!type.hasParameters()) {
      var index = parameters.indexOf(type.symbol);
      result = index >= 0 ? substitutions[index] : type;
    } else {
      if (type.substitutions === null) {
        throw new Error('assert type.substitutions != null; (src/resolver/typecache.sk:99:7)');
      }
      result = this.parameterize(type, this.substituteAll(type.substitutions, parameters, substitutions));
    }
    if (trace.GENERICS) {
      trace.log('substitution gave ' + result);
      trace.dedent();
    }
    return result;
  };
  TypeCache.prototype.substituteAll = function(types, parameters, substitutions) {
    if (parameters.length !== substitutions.length) {
      throw new Error('assert parameters.size() == substitutions.size(); (src/resolver/typecache.sk:111:5)');
    }
    var results = [];
    for (var i = 0; i < types.length; i = i + 1 | 0) {
      results.push(this.substitute(types[i], parameters, substitutions));
    }
    return results;
  };
  TypeCache.prototype.ensureTypeIsParameterized = function(unparameterized) {
    if (unparameterized.isParameterized()) {
      throw new Error('assert !unparameterized.isParameterized(); (src/resolver/typecache.sk:123:5)');
    }
    if (unparameterized.hasParameters()) {
      var parameters = unparameterized.symbol.parameters;
      var substitutions = [];
      for (var i = 0; i < parameters.length; i = i + 1 | 0) {
        substitutions.push(parameters[i].type);
      }
      return this.parameterize(unparameterized, substitutions);
    }
    return unparameterized;
  };
  TypeCache.prototype.parameterize = function(unparameterized, substitutions) {
    var symbol = unparameterized !== null ? unparameterized.symbol : null;
    if (symbol !== null) {
      if (!symbol.hasParameters()) {
        throw new Error('assert symbol.hasParameters(); (src/resolver/typecache.sk:139:7)');
      }
      if (symbol.type.isParameterized()) {
        throw new Error('assert !symbol.type.isParameterized(); (src/resolver/typecache.sk:140:7)');
      }
      if (symbol.parameters.length !== substitutions.length) {
        throw new Error('assert symbol.parameters.size() == substitutions.size(); (src/resolver/typecache.sk:141:7)');
      }
    }
    var hash = TypeCache.computeHashCode(symbol, substitutions);
    var existingTypes = this.hashTable.getOrDefault(hash, null);
    if (existingTypes !== null) {
      for (var i = 0; i < existingTypes.length; i = i + 1 | 0) {
        var existing = existingTypes[i];
        if (symbol === existing.symbol && symbol !== null && substitutions.length !== existing.substitutions.length) {
          throw new Error('assert symbol != existing.symbol || symbol == null || substitutions.size() == existing.substitutions.size(); (src/resolver/typecache.sk:152:9)');
        }
        if (symbol === existing.symbol && (symbol === null && TypeCache.areTypeListsEqual(substitutions, existing.relevantTypes) || symbol !== null && TypeCache.areTypeListsEqual(substitutions, existing.substitutions))) {
          return existing;
        }
      }
    } else {
      existingTypes = [];
      this.hashTable.set(hash, existingTypes);
    }
    if (trace.GENERICS && symbol !== null && substitutions !== null) {
      trace.log('parameterize ' + (unparameterized !== null ? unparameterized.toString() : 'null') + ' with ' + Type.environmentToString(symbol.parameters, substitutions));
      trace.indent();
    }
    var type = new Type(symbol);
    if (symbol !== null) {
      type.substitutions = substitutions;
      type.relevantTypes = this.substituteAll(unparameterized.relevantTypes, symbol.parameters, substitutions);
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
            merged.push(index >= 0 ? substitutions[index] : this.substitute(parameterizedType.substitutions[j], symbol.parameters, substitutions));
          }
          clone.parameterizedType = this.parameterize(parameterizedType.symbol.type, merged);
        }
        type.addMember(clone);
      }
      if (trace.GENERICS && substitutions !== null) {
        trace.log('parameterize gave ' + type);
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
  LanguageServiceTypeResult = function(_0, _1, _2, _3, _4) {
    this.declaration = '';
    this.line = _0;
    this.column = _1;
    this.index = _2;
    this.length = _3;
    this.type = _4;
  };
  LanguageServiceDiagnostic = function(_0, _1, _2, _3, _4, _5) {
    this.kind = _0;
    this.text = _1;
    this.line = _2;
    this.column = _3;
    this.index = _4;
    this.length = _5;
  };
  LanguageServiceCompletion = function(_0, _1, _2) {
    this.name = _0;
    this.type = _1;
    this.completion = _2;
  };
  LanguageService = function() {
    this.previousResult = null;
    this.previousSource = null;
  };
  LanguageService.prototype.typeFromPosition = function(line, column) {
    if (this.previousResult !== null && this.previousResult.program !== null && this.previousSource !== null && column >= 0 && column < this.previousSource.contentsOfLine(line).length && this.previousResult.program.children.length === 2) {
      var index = this.previousSource.lineOffsets[line] + column | 0;
      var previousFile = this.previousResult.program.children[1];
      if (previousFile.range.source !== this.previousSource) {
        throw new Error('assert previousFile.range.source == previousSource; (src/service/service.sk:34:7)');
      }
      return service.typeFromPosition(previousFile, this.previousSource, index);
    }
    return null;
  };
  LanguageService.prototype.checkForDiagnostics = function(input) {
    var options = new CompilerOptions();
    var compiler = new Compiler();
    this.previousSource = new Source('<input>', input);
    options.inputs = [this.previousSource];
    this.previousResult = compiler.compile(options);
    var diagnostics = [];
    for (var i = 0; i < compiler.log.diagnostics.length; i = i + 1 | 0) {
      var diagnostic = compiler.log.diagnostics[i];
      var range = diagnostic.range;
      if (range.source === this.previousSource) {
        var start = range.source.indexToLineColumn(range.start);
        var type = '';
        switch (diagnostic.kind) {
        case 0:
          type = 'error';
          break;
        case 1:
          type = 'warning';
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
    this.previousSource = new Source('<input>', input);
    options.inputs = [this.previousSource];
    this.previousResult = compiler.compile(options);
    if (this.previousResult.program !== null && column >= 0 && column <= this.previousSource.contentsOfLine(line).length && this.previousResult.program.children.length === 2) {
      var index = this.previousSource.lineOffsets[line] + column | 0;
      var previousFile = this.previousResult.program.children[1];
      if (previousFile.range.source !== this.previousSource) {
        throw new Error('assert previousFile.range.source == previousSource; (src/service/service.sk:78:7)');
      }
      return service.completionsFromPosition(previousFile, this.previousResult.resolver, this.previousSource, index);
    }
    return null;
  };
  var service = {};
  in_string.startsWith = function($this, prefix) {
    return $this.length >= prefix.length && $this.slice(0, prefix.length) === prefix;
  };
  in_string.repeat = function($this, count) {
    var result = '';
    for (var i = 0; i < count; i = i + 1 | 0) {
      result += $this;
    }
    return result;
  };
  in_string.replace = function($this, before, after) {
    var text = $this;
    var result = '';
    var index = text.indexOf(before);
    while (index !== -1) {
      result += text.slice(0, index) + after;
      text = text.slice(index + before.length | 0, text.length);
      index = text.indexOf(before);
    }
    return result + text;
  };
  in_List.swap = function($this, a, b) {
    var temp = $this[a];
    $this[a] = $this[b];
    $this[b] = temp;
  };
  function checkAllNodeListKinds(node, checker) {
    if (node === null) {
      throw new Error('assert node != null; (src/ast/create.sk:365:3)');
    }
    if (node.kind !== NodeKind.NODE_LIST) {
      throw new Error('assert node.kind == .NODE_LIST; (src/ast/create.sk:366:3)');
    }
    if (node.children === null) {
      throw new Error('assert node.children != null; (src/ast/create.sk:367:3)');
    }
    return checkAllNodeKinds(node.children, checker);
  }
  function checkAllNodeKinds(nodes, checker) {
    if (nodes === null) {
      throw new Error('assert nodes != null; (src/ast/create.sk:372:3)');
    }
    for (var i = 0; i < nodes.length; i = i + 1 | 0) {
      if (!checker.check(nodes[i])) {
        return false;
      }
    }
    return true;
  }
  in_NodeKind.isStatement = function($this) {
    return $this >= NodeKind.VARIABLE_CLUSTER && $this <= NodeKind.USING;
  };
  in_NodeKind.isNamedBlockDeclaration = function($this) {
    return $this >= NodeKind.NAMESPACE && $this <= NodeKind.EXTENSION;
  };
  in_NodeKind.isNamedDeclaration = function($this) {
    return $this >= NodeKind.NAMESPACE && $this <= NodeKind.ALIAS;
  };
  in_NodeKind.isEnum = function($this) {
    return $this >= NodeKind.ENUM && $this <= NodeKind.ENUM_FLAGS;
  };
  in_NodeKind.isObject = function($this) {
    return $this >= NodeKind.CLASS && $this <= NodeKind.INTERFACE;
  };
  in_NodeKind.isFunction = function($this) {
    return $this >= NodeKind.CONSTRUCTOR && $this <= NodeKind.FUNCTION;
  };
  in_NodeKind.isAssert = function($this) {
    return $this >= NodeKind.ASSERT && $this <= NodeKind.ASSERT_CONST;
  };
  in_NodeKind.isExpression = function($this) {
    return $this >= NodeKind.NAME && $this <= NodeKind.ASSIGN_INDEX;
  };
  in_NodeKind.isConstant = function($this) {
    return $this >= NodeKind.NULL && $this <= NodeKind.STRING;
  };
  in_NodeKind.isCall = function($this) {
    return $this >= NodeKind.CALL && $this <= NodeKind.SUPER_CALL;
  };
  in_NodeKind.isUnaryOperator = function($this) {
    return $this >= NodeKind.NOT && $this <= NodeKind.POSTFIX_DECREMENT;
  };
  in_NodeKind.isUnaryStorageOperator = function($this) {
    return $this >= NodeKind.PREFIX_INCREMENT && $this <= NodeKind.POSTFIX_DECREMENT;
  };
  in_NodeKind.isBinaryOperator = function($this) {
    return $this >= NodeKind.ADD && $this <= NodeKind.ASSIGN_SUBTRACT;
  };
  in_NodeKind.isBinaryStorageOperator = function($this) {
    return $this >= NodeKind.ASSIGN && $this <= NodeKind.ASSIGN_SUBTRACT;
  };
  in_NodeKind.isTernaryOperator = function($this) {
    return $this === NodeKind.ASSIGN_INDEX;
  };
  in_NodeKind.isCast = function($this) {
    return $this >= NodeKind.CAST && $this <= NodeKind.IMPLICIT_CAST;
  };
  in_NodeKind.isType = function($this) {
    return $this === NodeKind.TYPE;
  };
  in_NodeKind.isReal = function($this) {
    return $this >= NodeKind.FLOAT && $this <= NodeKind.DOUBLE;
  };
  in_NodeKind.isError = function($this) {
    return $this === NodeKind.ERROR;
  };
  in_NodeKind.isJump = function($this) {
    return $this >= NodeKind.RETURN && $this <= NodeKind.CONTINUE;
  };
  in_NodeKind.isLoop = function($this) {
    return $this >= NodeKind.FOR && $this <= NodeKind.DO_WHILE;
  };
  in_NodeKind.isStorage = function($this) {
    return $this === NodeKind.NAME || $this === NodeKind.DOT;
  };
  in_NodeKind.prettyPrint = function($this) {
    return in_string.replace(in_NodeKind.toString($this).toLowerCase(), '_', '-');
  };
  in_NodeKind.toString = function($this) {
    switch ($this) {
    case 0:
      return 'PROGRAM';
    case 1:
      return 'FILE';
    case 2:
      return 'BLOCK';
    case 3:
      return 'NODE_LIST';
    case 4:
      return 'CASE';
    case 5:
      return 'MEMBER_INITIALIZER';
    case 6:
      return 'VARIABLE_CLUSTER';
    case 7:
      return 'NAMESPACE';
    case 8:
      return 'ENUM';
    case 9:
      return 'ENUM_FLAGS';
    case 10:
      return 'CLASS';
    case 11:
      return 'INTERFACE';
    case 12:
      return 'EXTENSION';
    case 13:
      return 'CONSTRUCTOR';
    case 14:
      return 'FUNCTION';
    case 15:
      return 'VARIABLE';
    case 16:
      return 'PARAMETER';
    case 17:
      return 'ALIAS';
    case 18:
      return 'IF';
    case 19:
      return 'FOR';
    case 20:
      return 'FOR_EACH';
    case 21:
      return 'WHILE';
    case 22:
      return 'DO_WHILE';
    case 23:
      return 'RETURN';
    case 24:
      return 'BREAK';
    case 25:
      return 'CONTINUE';
    case 26:
      return 'ASSERT';
    case 27:
      return 'ASSERT_CONST';
    case 28:
      return 'EXPRESSION';
    case 29:
      return 'SWITCH';
    case 30:
      return 'MODIFIER';
    case 31:
      return 'USING';
    case 32:
      return 'NAME';
    case 33:
      return 'TYPE';
    case 34:
      return 'THIS';
    case 35:
      return 'HOOK';
    case 36:
      return 'NULL';
    case 37:
      return 'BOOL';
    case 38:
      return 'INT';
    case 39:
      return 'FLOAT';
    case 40:
      return 'DOUBLE';
    case 41:
      return 'STRING';
    case 42:
      return 'LIST';
    case 43:
      return 'DOT';
    case 44:
      return 'CALL';
    case 45:
      return 'SUPER_CALL';
    case 46:
      return 'ERROR';
    case 47:
      return 'SEQUENCE';
    case 48:
      return 'PARAMETERIZE';
    case 49:
      return 'CAST';
    case 50:
      return 'IMPLICIT_CAST';
    case 51:
      return 'UNTYPED';
    case 52:
      return 'VAR';
    case 53:
      return 'NOT';
    case 54:
      return 'POSITIVE';
    case 55:
      return 'NEGATIVE';
    case 56:
      return 'COMPLEMENT';
    case 57:
      return 'PREFIX_INCREMENT';
    case 58:
      return 'PREFIX_DECREMENT';
    case 59:
      return 'POSTFIX_INCREMENT';
    case 60:
      return 'POSTFIX_DECREMENT';
    case 61:
      return 'ADD';
    case 62:
      return 'BITWISE_AND';
    case 63:
      return 'BITWISE_OR';
    case 64:
      return 'BITWISE_XOR';
    case 65:
      return 'DIVIDE';
    case 66:
      return 'EQUAL';
    case 67:
      return 'GREATER_THAN';
    case 68:
      return 'GREATER_THAN_OR_EQUAL';
    case 69:
      return 'IN';
    case 70:
      return 'INDEX';
    case 71:
      return 'LESS_THAN';
    case 72:
      return 'LESS_THAN_OR_EQUAL';
    case 73:
      return 'LOGICAL_AND';
    case 74:
      return 'LOGICAL_OR';
    case 75:
      return 'MULTIPLY';
    case 76:
      return 'NOT_EQUAL';
    case 77:
      return 'REMAINDER';
    case 78:
      return 'SHIFT_LEFT';
    case 79:
      return 'SHIFT_RIGHT';
    case 80:
      return 'SUBTRACT';
    case 81:
      return 'ASSIGN';
    case 82:
      return 'ASSIGN_ADD';
    case 83:
      return 'ASSIGN_BITWISE_AND';
    case 84:
      return 'ASSIGN_BITWISE_OR';
    case 85:
      return 'ASSIGN_BITWISE_XOR';
    case 86:
      return 'ASSIGN_DIVIDE';
    case 87:
      return 'ASSIGN_MULTIPLY';
    case 88:
      return 'ASSIGN_REMAINDER';
    case 89:
      return 'ASSIGN_SHIFT_LEFT';
    case 90:
      return 'ASSIGN_SHIFT_RIGHT';
    case 91:
      return 'ASSIGN_SUBTRACT';
    case 92:
      return 'ASSIGN_INDEX';
    default:
      return '';
    }
  };
  function createOperatorMap() {
    if (operatorInfo !== null) {
      return;
    }
    operatorInfo = new IntMap();
    operatorInfo.set(NodeKind.NOT, new OperatorInfo('!', Precedence.UNARY_PREFIX, Associativity.NONE));
    operatorInfo.set(NodeKind.POSITIVE, new OperatorInfo('+', Precedence.UNARY_PREFIX, Associativity.NONE));
    operatorInfo.set(NodeKind.NEGATIVE, new OperatorInfo('-', Precedence.UNARY_PREFIX, Associativity.NONE));
    operatorInfo.set(NodeKind.COMPLEMENT, new OperatorInfo('~', Precedence.UNARY_PREFIX, Associativity.NONE));
    operatorInfo.set(NodeKind.PREFIX_INCREMENT, new OperatorInfo('++', Precedence.UNARY_PREFIX, Associativity.NONE));
    operatorInfo.set(NodeKind.PREFIX_DECREMENT, new OperatorInfo('--', Precedence.UNARY_PREFIX, Associativity.NONE));
    operatorInfo.set(NodeKind.POSTFIX_INCREMENT, new OperatorInfo('++', Precedence.UNARY_POSTFIX, Associativity.NONE));
    operatorInfo.set(NodeKind.POSTFIX_DECREMENT, new OperatorInfo('--', Precedence.UNARY_POSTFIX, Associativity.NONE));
    operatorInfo.set(NodeKind.ADD, new OperatorInfo('+', Precedence.ADD, Associativity.LEFT));
    operatorInfo.set(NodeKind.BITWISE_AND, new OperatorInfo('&', Precedence.BITWISE_AND, Associativity.LEFT));
    operatorInfo.set(NodeKind.BITWISE_OR, new OperatorInfo('|', Precedence.BITWISE_OR, Associativity.LEFT));
    operatorInfo.set(NodeKind.BITWISE_XOR, new OperatorInfo('^', Precedence.BITWISE_XOR, Associativity.LEFT));
    operatorInfo.set(NodeKind.DIVIDE, new OperatorInfo('/', Precedence.MULTIPLY, Associativity.LEFT));
    operatorInfo.set(NodeKind.EQUAL, new OperatorInfo('==', Precedence.EQUAL, Associativity.LEFT));
    operatorInfo.set(NodeKind.GREATER_THAN, new OperatorInfo('>', Precedence.COMPARE, Associativity.LEFT));
    operatorInfo.set(NodeKind.GREATER_THAN_OR_EQUAL, new OperatorInfo('>=', Precedence.COMPARE, Associativity.LEFT));
    operatorInfo.set(NodeKind.IN, new OperatorInfo('in', Precedence.COMPARE, Associativity.LEFT));
    operatorInfo.set(NodeKind.INDEX, new OperatorInfo('[]', Precedence.MEMBER, Associativity.LEFT));
    operatorInfo.set(NodeKind.LESS_THAN, new OperatorInfo('<', Precedence.COMPARE, Associativity.LEFT));
    operatorInfo.set(NodeKind.LESS_THAN_OR_EQUAL, new OperatorInfo('<=', Precedence.COMPARE, Associativity.LEFT));
    operatorInfo.set(NodeKind.LOGICAL_AND, new OperatorInfo('&&', Precedence.LOGICAL_AND, Associativity.LEFT));
    operatorInfo.set(NodeKind.LOGICAL_OR, new OperatorInfo('||', Precedence.LOGICAL_OR, Associativity.LEFT));
    operatorInfo.set(NodeKind.MULTIPLY, new OperatorInfo('*', Precedence.MULTIPLY, Associativity.LEFT));
    operatorInfo.set(NodeKind.NOT_EQUAL, new OperatorInfo('!=', Precedence.EQUAL, Associativity.LEFT));
    operatorInfo.set(NodeKind.REMAINDER, new OperatorInfo('%', Precedence.MULTIPLY, Associativity.LEFT));
    operatorInfo.set(NodeKind.SHIFT_LEFT, new OperatorInfo('<<', Precedence.SHIFT, Associativity.LEFT));
    operatorInfo.set(NodeKind.SHIFT_RIGHT, new OperatorInfo('>>', Precedence.SHIFT, Associativity.LEFT));
    operatorInfo.set(NodeKind.SUBTRACT, new OperatorInfo('-', Precedence.ADD, Associativity.LEFT));
    operatorInfo.set(NodeKind.ASSIGN, new OperatorInfo('=', Precedence.ASSIGN, Associativity.RIGHT));
    operatorInfo.set(NodeKind.ASSIGN_ADD, new OperatorInfo('+=', Precedence.ASSIGN, Associativity.RIGHT));
    operatorInfo.set(NodeKind.ASSIGN_BITWISE_AND, new OperatorInfo('&=', Precedence.ASSIGN, Associativity.RIGHT));
    operatorInfo.set(NodeKind.ASSIGN_BITWISE_OR, new OperatorInfo('|=', Precedence.ASSIGN, Associativity.RIGHT));
    operatorInfo.set(NodeKind.ASSIGN_BITWISE_XOR, new OperatorInfo('^=', Precedence.ASSIGN, Associativity.RIGHT));
    operatorInfo.set(NodeKind.ASSIGN_DIVIDE, new OperatorInfo('/=', Precedence.ASSIGN, Associativity.RIGHT));
    operatorInfo.set(NodeKind.ASSIGN_MULTIPLY, new OperatorInfo('*=', Precedence.ASSIGN, Associativity.RIGHT));
    operatorInfo.set(NodeKind.ASSIGN_REMAINDER, new OperatorInfo('%=', Precedence.ASSIGN, Associativity.RIGHT));
    operatorInfo.set(NodeKind.ASSIGN_SHIFT_LEFT, new OperatorInfo('<<=', Precedence.ASSIGN, Associativity.RIGHT));
    operatorInfo.set(NodeKind.ASSIGN_SHIFT_RIGHT, new OperatorInfo('>>=', Precedence.ASSIGN, Associativity.RIGHT));
    operatorInfo.set(NodeKind.ASSIGN_SUBTRACT, new OperatorInfo('-=', Precedence.ASSIGN, Associativity.RIGHT));
    operatorInfo.set(NodeKind.ASSIGN_INDEX, new OperatorInfo('[]=', Precedence.ASSIGN, Associativity.RIGHT));
  }
  in_TargetFormat.shouldRunResolver = function($this) {
    return $this >= TargetFormat.NONE && $this <= TargetFormat.JAVASCRIPT;
  };
  function hashCombine(left, right) {
    return left ^ ((right - 1640531527 | 0) + (left << 6) | 0) + (left >> 2);
  }
  function logBase2(value) {
    if (value < 1 || (value & value - 1) !== 0) {
      return -1;
    }
    var result = 0;
    while (value > 1) {
      value >>= 1;
      result = result + 1 | 0;
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
    var result = '';
    var start = 1;
    var i = 1;
    while ((i + 1 | 0) < text.length) {
      var c = text.charCodeAt(i);
      i = i + 1 | 0;
      if (c === 92) {
        var escape = i - 1 | 0;
        result += text.slice(start, escape);
        if ((i + 1 | 0) < text.length) {
          c = text.charCodeAt(i);
          i = i + 1 | 0;
          if (c === 110) {
            result += '\n';
            start = i;
            continue;
          } else if (c === 114) {
            result += '\r';
            start = i;
            continue;
          } else if (c === 116) {
            result += '\t';
            start = i;
            continue;
          } else if (c === 101) {
            result += '\x1B';
            start = i;
            continue;
          } else if (c === 48) {
            result += '\0';
            start = i;
            continue;
          } else if (c === 92 || c === 34 || c === 39) {
            result += String.fromCharCode(c);
            start = i;
            continue;
          } else if (c === 120) {
            var c0 = (i + 1 | 0) < text.length ? parseHexCharacter(text.charCodeAt(i)) : -1;
            i = i + 1 | 0;
            var c1 = (i + 1 | 0) < text.length ? parseHexCharacter(text.charCodeAt(i)) : -1;
            i = i + 1 | 0;
            if (c0 !== -1 && c1 !== -1) {
              result += String.fromCharCode(c0 << 4 | c1);
              start = i;
              continue;
            }
          }
        }
        syntaxErrorInvalidEscapeSequence(log, new Range(range.source, range.start + escape | 0, range.start + i | 0), text.slice(escape, i));
        isValidString = false;
      }
    }
    result += text.slice(start, i);
    return isValidString ? new StringContent(result) : null;
  }
  function quoteString(text, quote) {
    var result = '';
    var quoteString = String.fromCharCode(quote);
    result += quoteString;
    var start = 0;
    var i = 0;
    for (i = 0; i < text.length; i = i + 1 | 0) {
      var c = text.charCodeAt(i);
      if (c === quote) {
        result += text.slice(start, i) + '\\' + quoteString;
      } else if (c === 10) {
        result += text.slice(start, i) + '\\n';
      } else if (c === 13) {
        result += text.slice(start, i) + '\\r';
      } else if (c === 9) {
        result += text.slice(start, i) + '\\t';
      } else if (c === 0) {
        result += text.slice(start, i) + '\\0';
      } else if (c === 92) {
        result += text.slice(start, i) + '\\\\';
      } else if (c < 32 || c >= 127 && c <= 255) {
        result += text.slice(start, i) + '\\x' + HEX[c >> 4] + HEX[c & 15];
      } else {
        continue;
      }
      start = i + 1 | 0;
    }
    result += text.slice(start, i) + quoteString;
    return result;
  }
  function plural(value, singular, plural) {
    return value === 1 ? singular : plural;
  }
  function splitPath(path) {
    var forwardSlash = path.lastIndexOf('/');
    var backwardSlash = path.lastIndexOf('\\');
    var slashIndex = forwardSlash > backwardSlash ? forwardSlash : backwardSlash;
    return slashIndex === -1 ? new SplitPath('.', path) : new SplitPath(path.slice(0, slashIndex), path.slice(slashIndex + 1 | 0, path.length));
  }
  function joinPath(directory, entry) {
    return directory + '/' + entry;
  }
  function formatPositiveNumber(number) {
    return ((number * 10 + 0.5 | 0) / 10 | 0).toString();
  }
  function bytesToString(bytes) {
    if (bytes === 1) {
      return '1 byte';
    }
    if (bytes < ByteSize.KB) {
      return bytes + ' bytes';
    }
    if (bytes < ByteSize.MB) {
      return formatPositiveNumber(bytes / ByteSize.KB) + 'kb';
    }
    if (bytes < ByteSize.GB) {
      return formatPositiveNumber(bytes / ByteSize.MB) + 'mb';
    }
    return formatPositiveNumber(bytes / ByteSize.GB) + 'gb';
  }
  trace.indent = function() {
  };
  trace.dedent = function() {
  };
  trace.log = function(text) {
  };
  json.dump = function(node) {
    var visitor = new json.DumpVisitor();
    visitor.visit(node);
    return visitor.result;
  };
  lisp.dump = function(node) {
    var visitor = new lisp.DumpVisitor();
    visitor.visit(node);
    return visitor.result;
  };
  xml.dump = function(node) {
    var visitor = new xml.DumpVisitor();
    visitor.visit(node);
    return visitor.result;
  };
  in_io.printWithColor = function(color, text) {
    io.setColor(color);
    io.print(text);
    io.setColor(in_io.Color.DEFAULT);
  };
  frontend.printError = function(text) {
    in_io.printWithColor(in_io.Color.RED, 'error: ');
    in_io.printWithColor(in_io.Color.BOLD, text + '\n');
  };
  frontend.printNote = function(text) {
    in_io.printWithColor(in_io.Color.GRAY, 'note: ');
    in_io.printWithColor(in_io.Color.BOLD, text + '\n');
  };
  frontend.printWarning = function(text) {
    in_io.printWithColor(in_io.Color.MAGENTA, 'warning: ');
    in_io.printWithColor(in_io.Color.BOLD, text + '\n');
  };
  frontend.printUsage = function() {
    in_io.printWithColor(in_io.Color.GREEN, '\nusage: ');
    in_io.printWithColor(in_io.Color.BOLD, 'skewc [flags] [inputs]\n');
    io.print('\n  --help (-h)        Print this message.\n\n  --verbose          Print out useful information about the compilation.\n\n  --target=___       Set the target language. Valid target languages: none, js,\n                     c#, lisp-ast, json-ast, and xml-ast.\n\n  --output-file=___  Combines all output into a single file.\n\n  --prepend-file=___ Prepend the contents of this file to the output. Provide\n                     this flag multiple times to prepend multiple files.\n\n  --append-file=___  Append the contents of this file to the output. Provide\n                     this flag multiple times to append multiple files.\n\n  --js-minify        Transform the emitted JavaScript so that it takes up less\n                     space. Make sure to use the "export" modifier on code\n                     that shouldn\'t be minifed.\n\n  --js-source-map    Generate a source map when targeting JavaScript. The source\n                     map will be saved with the ".map" extension in the same\n                     directory as the main output file.\n\n');
  };
  frontend.afterEquals = function(text) {
    var equals = text.indexOf('=');
    if (equals < 0) {
      throw new Error('assert equals >= 0; (src/frontend/frontend.sk:85:5)');
    }
    return text.slice(equals + 1 | 0, text.length);
  };
  frontend.readSources = function(files) {
    var result = [];
    for (var i = 0; i < files.length; i = i + 1 | 0) {
      var file = files[i];
      var source = io.readFile(file);
      if (source === null) {
        frontend.printError('Could not read from ' + quoteString(file, 34));
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
      } else if (arg === '-help' || arg === '--help' || arg === '-h') {
        frontend.printUsage();
        return 0;
      } else if (arg === '-verbose' || arg === '--verbose') {
        flags.verbose = true;
      } else if (arg === '-optimize' || arg === '--optimize') {
        flags.optimize = true;
      } else if (arg === '-js-minify' || arg === '--js-minify') {
        flags.jsMinify = true;
      } else if (arg === '-js-source-map' || arg === '--js-source-map') {
        flags.jsSourceMap = true;
      } else if (in_string.startsWith(arg, '-target=') || in_string.startsWith(arg, '--target=')) {
        flags.target = frontend.afterEquals(arg);
      } else if (in_string.startsWith(arg, '-output-file=') || in_string.startsWith(arg, '--output-file=')) {
        flags.outputFile = frontend.afterEquals(arg);
      } else if (in_string.startsWith(arg, '-prepend-file=') || in_string.startsWith(arg, '--prepend-file=')) {
        prepend.push(frontend.afterEquals(arg));
      } else if (in_string.startsWith(arg, '-append-file=') || in_string.startsWith(arg, '--append-file=')) {
        append.push(frontend.afterEquals(arg));
      } else {
        frontend.printError('Unknown flag ' + quoteString(arg, 34));
        return 1;
      }
      continue;
    }
    if (inputs.length === 0) {
      frontend.printError('Missing input files');
      return 1;
    }
    var target = 0;
    if (flags.target === '') {
      frontend.printError('Set the target language with "--target=___"');
      return 1;
    } else if (flags.target === 'none') {
      target = TargetFormat.NONE;
    } else if (flags.target === 'js') {
      target = TargetFormat.JAVASCRIPT;
    } else if (flags.target === 'cpp') {
      target = TargetFormat.CPP;
    } else if (flags.target === 'lisp-ast') {
      target = TargetFormat.LISP_AST;
    } else if (flags.target === 'json-ast') {
      target = TargetFormat.JSON_AST;
    } else if (flags.target === 'xml-ast') {
      target = TargetFormat.XML_AST;
    } else {
      frontend.printError('Unknown target language ' + quoteString(flags.target, 34));
      return 1;
    }
    var options = new CompilerOptions();
    var optimizeJS = flags.optimize && target === TargetFormat.JAVASCRIPT;
    var minifyJS = flags.jsMinify && target === TargetFormat.JAVASCRIPT;
    options.targetFormat = target;
    options.removeAsserts = flags.optimize;
    options.outputFile = flags.outputFile;
    options.foldAllConstants = optimizeJS;
    options.inlineAllFunctions = optimizeJS;
    options.convertAllInstanceToStatic = optimizeJS;
    options.jsMinify = minifyJS;
    options.jsMangle = minifyJS;
    options.jsSourceMap = flags.jsSourceMap && target === TargetFormat.JAVASCRIPT;
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
      if (!diagnostic.range.isEmpty()) {
        in_io.printWithColor(in_io.Color.BOLD, diagnostic.range.locationString() + ': ');
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
        io.print(formatted.line + '\n');
        in_io.printWithColor(in_io.Color.GREEN, formatted.range + '\n');
      }
      if (!diagnostic.noteRange.isEmpty()) {
        in_io.printWithColor(in_io.Color.BOLD, diagnostic.noteRange.locationString() + ': ');
        frontend.printNote(diagnostic.noteText);
        var formatted = diagnostic.noteRange.format(io.terminalWidth);
        io.print(formatted.line + '\n');
        in_io.printWithColor(in_io.Color.GREEN, formatted.range + '\n');
      }
    }
    var hasErrors = log.errorCount > 0;
    var hasWarnings = log.warningCount > 0;
    var summary = '';
    if (hasWarnings) {
      summary += log.warningCount + plural(log.warningCount, ' warning', ' warnings');
      if (hasErrors) {
        summary += ' and ';
      }
    }
    if (hasErrors) {
      summary += log.errorCount + plural(log.errorCount, ' error', ' errors');
    }
    if (hasWarnings || hasErrors) {
      io.print(summary + ' generated\n');
    }
    if (flags.verbose) {
      io.print(compiler.statistics(result) + '\n');
    }
    if (hasErrors) {
      return 1;
    }
    for (var i = 0; i < result.outputs.length; i = i + 1 | 0) {
      var output = result.outputs[i];
      if (output.name === '') {
        io.print(output.contents);
        continue;
      }
      if (!io.writeFile(output.name, output.contents)) {
        frontend.printError('Could not write to ' + quoteString(output.name, 34));
        return 1;
      }
    }
    return 0;
  };
  in_TokenKind.toString = function($this) {
    switch ($this) {
    case 0:
      return 'ALIAS';
    case 1:
      return 'ASSERT';
    case 2:
      return 'ASSIGN';
    case 3:
      return 'ASSIGN_BITWISE_AND';
    case 4:
      return 'ASSIGN_BITWISE_OR';
    case 5:
      return 'ASSIGN_BITWISE_XOR';
    case 6:
      return 'ASSIGN_DIVIDE';
    case 7:
      return 'ASSIGN_MINUS';
    case 8:
      return 'ASSIGN_MULTIPLY';
    case 9:
      return 'ASSIGN_PLUS';
    case 10:
      return 'ASSIGN_REMAINDER';
    case 11:
      return 'ASSIGN_SHIFT_LEFT';
    case 12:
      return 'ASSIGN_SHIFT_RIGHT';
    case 13:
      return 'BITWISE_AND';
    case 14:
      return 'BITWISE_OR';
    case 15:
      return 'BITWISE_XOR';
    case 16:
      return 'BREAK';
    case 17:
      return 'CASE';
    case 18:
      return 'CHARACTER';
    case 19:
      return 'CLASS';
    case 20:
      return 'COLON';
    case 21:
      return 'COMMA';
    case 22:
      return 'CONST';
    case 23:
      return 'CONTINUE';
    case 24:
      return 'DECREMENT';
    case 25:
      return 'DEFAULT';
    case 26:
      return 'DIVIDE';
    case 27:
      return 'DO';
    case 28:
      return 'DOT';
    case 29:
      return 'DOUBLE';
    case 30:
      return 'ELSE';
    case 31:
      return 'END_OF_FILE';
    case 32:
      return 'ENUM';
    case 33:
      return 'EQUAL';
    case 34:
      return 'ERROR';
    case 35:
      return 'EXPORT';
    case 36:
      return 'FALSE';
    case 37:
      return 'FINAL';
    case 38:
      return 'FLOAT';
    case 39:
      return 'FOR';
    case 40:
      return 'GREATER_THAN';
    case 41:
      return 'GREATER_THAN_OR_EQUAL';
    case 42:
      return 'IDENTIFIER';
    case 43:
      return 'IF';
    case 44:
      return 'IMPORT';
    case 45:
      return 'IN';
    case 46:
      return 'INCREMENT';
    case 47:
      return 'INLINE';
    case 48:
      return 'INTERFACE';
    case 49:
      return 'INT_BINARY';
    case 50:
      return 'INT_DECIMAL';
    case 51:
      return 'INT_HEX';
    case 52:
      return 'INT_OCTAL';
    case 53:
      return 'IS';
    case 54:
      return 'LEFT_BRACE';
    case 55:
      return 'LEFT_BRACKET';
    case 56:
      return 'LEFT_PARENTHESIS';
    case 57:
      return 'LESS_THAN';
    case 58:
      return 'LESS_THAN_OR_EQUAL';
    case 59:
      return 'LOGICAL_AND';
    case 60:
      return 'LOGICAL_OR';
    case 61:
      return 'MINUS';
    case 62:
      return 'MULTIPLY';
    case 63:
      return 'NAMESPACE';
    case 64:
      return 'NEW';
    case 65:
      return 'NOT';
    case 66:
      return 'NOT_EQUAL';
    case 67:
      return 'NULL';
    case 68:
      return 'OVERRIDE';
    case 69:
      return 'PLUS';
    case 70:
      return 'PRIVATE';
    case 71:
      return 'PROTECTED';
    case 72:
      return 'PUBLIC';
    case 73:
      return 'QUESTION_MARK';
    case 74:
      return 'REMAINDER';
    case 75:
      return 'RETURN';
    case 76:
      return 'RIGHT_BRACE';
    case 77:
      return 'RIGHT_BRACKET';
    case 78:
      return 'RIGHT_PARENTHESIS';
    case 79:
      return 'SEMICOLON';
    case 80:
      return 'SHIFT_LEFT';
    case 81:
      return 'SHIFT_RIGHT';
    case 82:
      return 'STATIC';
    case 83:
      return 'STRING';
    case 84:
      return 'SUPER';
    case 85:
      return 'SWITCH';
    case 86:
      return 'THIS';
    case 87:
      return 'TILDE';
    case 88:
      return 'TRUE';
    case 89:
      return 'UNTYPED';
    case 90:
      return 'USING';
    case 91:
      return 'VAR';
    case 92:
      return 'VIRTUAL';
    case 93:
      return 'WHILE';
    case 94:
      return 'WHITESPACE';
    case 95:
      return 'YY_INVALID_ACTION';
    case 96:
      return 'START_PARAMETER_LIST';
    case 97:
      return 'END_PARAMETER_LIST';
    default:
      return '';
    }
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
      while (yy_current_state !== 253) {
        if (yy_cp >= text_length) {
          break;
        }
        var c = text.charCodeAt(yy_cp);
        var index = c < 127 ? c : 127;
        var yy_c = yy_ec[index];
        if (yy_accept[yy_current_state] !== TokenKind.YY_INVALID_ACTION) {
          yy_last_accepting_state = yy_current_state;
          yy_last_accepting_cpos = yy_cp;
        }
        while (yy_chk[yy_base[yy_current_state] + yy_c | 0] !== yy_current_state) {
          yy_current_state = yy_def[yy_current_state];
          if (yy_current_state >= 254) {
            yy_c = yy_meta[yy_c];
          }
        }
        yy_current_state = yy_nxt[yy_base[yy_current_state] + yy_c | 0];
        yy_cp = yy_cp + 1 | 0;
      }
      var yy_act = yy_accept[yy_current_state];
      while (yy_act === TokenKind.YY_INVALID_ACTION) {
        yy_cp = yy_last_accepting_cpos;
        yy_current_state = yy_last_accepting_state;
        yy_act = yy_accept[yy_current_state];
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
    tokens.push(new Token(new Range(source, text_length, text_length), TokenKind.END_OF_FILE, ''));
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
        if (topKind === TokenKind.LESS_THAN && tokenKind !== TokenKind.LESS_THAN && tokenKind !== TokenKind.IDENTIFIER && tokenKind !== TokenKind.IS && tokenKind !== TokenKind.COMMA && tokenKind !== TokenKind.DOT && !tokenStartsWithGreaterThan) {
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
          var top = tokens[stack[stack.length - 1 | 0]];
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
                throw new Error('assert kind != .ERROR; (src/lexer/token.sk:78:13)');
              }
              tokens.splice(i + 1 | 0, 0, new Token(new Range(range.source, start + 1 | 0, range.end), kind, text));
              token.range = new Range(range.source, start, start + 1 | 0);
              token.text = '>';
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
    return '"' + name + '"';
  }
  function firstLineOf(text) {
    var index = text.indexOf('\n');
    return index < 0 ? text : text.slice(0, index);
  }
  function syntaxErrorInvalidEscapeSequence(log, range, text) {
    log.error(range, 'Invalid escape sequence ' + firstLineOf(simpleQuote(text)));
  }
  function syntaxErrorInvalidCharacter(log, range, text) {
    log.error(range, 'Invalid character literal ' + firstLineOf(text));
  }
  function syntaxErrorInvalidInteger(log, range, text) {
    log.error(range, 'Invalid integer literal ' + text);
  }
  function syntaxErrorExtraData(log, range, text) {
    log.error(range, 'Syntax error ' + quoteString(text, 34));
  }
  function syntaxErrorUnexpectedToken(log, token) {
    log.error(token.range, 'Unexpected ' + in_TokenKind.toString(token.kind));
  }
  function syntaxErrorExpectedToken(log, found, expected) {
    log.error(found.range, 'Expected ' + in_TokenKind.toString(expected) + ' but found ' + in_TokenKind.toString(found.kind));
  }
  function syntaxErrorBadForEach(log, range) {
    log.error(range, 'More than one variable inside a for-each loop');
  }
  function syntaxWarningOctal(log, range) {
    log.warning(range, 'Use the prefix "0o" for octal numbers');
  }
  in_Precedence.incrementIfLeftAssociative = function($this, associativity) {
    return $this + (associativity === Associativity.LEFT | 0) | 0;
  };
  in_Precedence.incrementIfRightAssociative = function($this, associativity) {
    return $this + (associativity === Associativity.RIGHT | 0) | 0;
  };
  function scanForToken(context, kind, tokenScan) {
    if (context.expect(kind)) {
      return true;
    }
    while (!context.peek(TokenKind.END_OF_FILE)) {
      switch (context.current().kind) {
      case 78:
      case 77:
      case 76:
        return context.eat(kind);
      case 79:
        if (tokenScan === TokenScan.STOP_BEFORE_NEXT_STATEMENT) {
          return context.eat(kind);
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
      case 39:
      case 43:
      case 44:
      case 47:
      case 48:
      case 63:
      case 68:
      case 70:
      case 71:
      case 72:
      case 75:
      case 82:
      case 85:
      case 90:
      case 92:
      case 93:
        if (tokenScan === TokenScan.STOP_BEFORE_NEXT_STATEMENT) {
          return true;
        }
        break;
      }
      context.next();
    }
    return false;
  }
  function parseGroup(context) {
    var token = context.current();
    if (!context.expect(TokenKind.LEFT_PARENTHESIS)) {
      return null;
    }
    var value = pratt.parse(context, Precedence.LOWEST);
    scanForToken(context, TokenKind.RIGHT_PARENTHESIS, TokenScan.STOP_BEFORE_NEXT_STATEMENT);
    return value;
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
      if (in_NodeKind.isError(value.kind) || comma === AllowTrailingComma.TRAILING_COMMA && !context.peek(right) && !context.expect(TokenKind.COMMA)) {
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
      throw new Error('assert context.current().range.start >= token.range.end; (src/parser/parser.sk:323:3)');
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
    var isConst = context.eat(TokenKind.CONST);
    var value = pratt.parse(context, Precedence.LOWEST);
    scanForToken(context, TokenKind.SEMICOLON, TokenScan.STOP_BEFORE_NEXT_STATEMENT);
    return Node.createAssert(isConst ? NodeKind.ASSERT_CONST : NodeKind.ASSERT, value).withRange(context.spanSince(token.range));
  }
  function parseSwitch(context) {
    var token = context.next();
    var value = parseGroup(context);
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
    var value = parseGroup(context);
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
    var value = parseGroup(context);
    scanForToken(context, TokenKind.SEMICOLON, TokenScan.STOP_BEFORE_NEXT_STATEMENT);
    return Node.createDoWhile(block, value).withRange(context.spanSince(token.range));
  }
  function parseIf(context) {
    var token = context.next();
    var value = parseGroup(context);
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
    var isFlags = false;
    if (context.peek(TokenKind.IDENTIFIER) && context.current().text === 'flags') {
      isFlags = true;
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
    return (isFlags ? Node.createEnumFlags(name, block) : Node.createEnum(name, block)).withRange(context.spanSince(token.range));
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
        name = parseName(context);
        if (name === null) {
          break;
        }
        start = name;
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
            var name = variables[0].declarationName().remove();
            var value = Node.createVariable(name, setup.clusterType().remove(), null).withRange(name.range);
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
    if (context.peek(TokenKind.LEFT_PARENTHESIS) || context.peek(TokenKind.START_PARAMETER_LIST)) {
      var parameters = parseParameters(context);
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
      return Node.createFunction(name, $arguments, block, type, parameters).withRange(context.spanSince(type.range));
    }
    var cluster = parseVariableCluster(context, type, name);
    scanForToken(context, TokenKind.SEMICOLON, TokenScan.STOP_BEFORE_NEXT_STATEMENT);
    var last = cluster.lastChild();
    last.withRange(context.spanSince(last.range));
    return cluster;
  }
  function parseUsing(context) {
    var token = context.next();
    var value = parseType(context);
    scanForToken(context, TokenKind.SEMICOLON, TokenScan.STOP_BEFORE_NEXT_STATEMENT);
    return Node.createUsing(value).withRange(context.spanSince(token.range));
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
  function looksLikeType(node) {
    switch (node.kind) {
    case 43:
      var target = node.dotTarget();
      return target !== null && looksLikeType(target);
    case 32:
    case 48:
      return true;
    default:
      return false;
    }
  }
  function parseStatement(context, hint) {
    switch (context.current().kind) {
    case 0:
      return parseAlias(context);
    case 1:
      return parseAssert(context);
    case 16:
      return parseBreak(context);
    case 19:
      return parseObject(context, NodeKind.CLASS);
    case 22:
      return parseModifier(context, hint, SymbolFlag.CONST);
    case 23:
      return parseContinue(context);
    case 27:
      return parseDoWhile(context);
    case 32:
      return parseEnum(context);
    case 35:
      return parseModifier(context, hint, SymbolFlag.EXPORT);
    case 37:
      return parseModifier(context, hint, SymbolFlag.FINAL);
    case 39:
      return parseFor(context);
    case 42:
    case 91:
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
    case 63:
      return parseNamespace(context);
    case 64:
      return parseConstructor(context, hint);
    case 68:
      return parseModifier(context, hint, SymbolFlag.OVERRIDE);
    case 70:
      return parseModifier(context, hint, SymbolFlag.PRIVATE);
    case 71:
      return parseModifier(context, hint, SymbolFlag.PROTECTED);
    case 72:
      return parseModifier(context, hint, SymbolFlag.PUBLIC);
    case 75:
      return parseReturn(context);
    case 82:
      return parseModifier(context, hint, SymbolFlag.STATIC);
    case 85:
      return parseSwitch(context);
    case 90:
      return parseUsing(context);
    case 92:
      return parseModifier(context, hint, SymbolFlag.VIRTUAL);
    case 93:
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
  function createParser() {
    if (pratt !== null) {
      return;
    }
    pratt = new Pratt();
    pratt.literal(TokenKind.NULL, new TokenLiteral(NodeKind.NULL));
    pratt.literal(TokenKind.THIS, new TokenLiteral(NodeKind.THIS));
    pratt.literal(TokenKind.TRUE, new BoolLiteral(true));
    pratt.literal(TokenKind.FALSE, new BoolLiteral(false));
    pratt.literal(TokenKind.INT_DECIMAL, new IntLiteral(10));
    pratt.literal(TokenKind.INT_BINARY, new IntLiteral(2));
    pratt.literal(TokenKind.INT_OCTAL, new IntLiteral(8));
    pratt.literal(TokenKind.INT_HEX, new IntLiteral(16));
    pratt.literal(TokenKind.FLOAT, new FloatLiteral());
    pratt.literal(TokenKind.DOUBLE, new DoubleLiteral());
    pratt.literal(TokenKind.VAR, new VarLiteral());
    pratt.literal(TokenKind.STRING, new StringLiteral());
    pratt.literal(TokenKind.CHARACTER, new CharacterLiteral());
    pratt.literal(TokenKind.IDENTIFIER, new NameLiteral());
    pratt.postfix(TokenKind.INCREMENT, Precedence.UNARY_POSTFIX, new UnaryPostfix(NodeKind.POSTFIX_INCREMENT));
    pratt.postfix(TokenKind.DECREMENT, Precedence.UNARY_POSTFIX, new UnaryPostfix(NodeKind.POSTFIX_DECREMENT));
    pratt.prefix(TokenKind.INCREMENT, Precedence.UNARY_PREFIX, new UnaryPrefix(NodeKind.PREFIX_INCREMENT));
    pratt.prefix(TokenKind.DECREMENT, Precedence.UNARY_PREFIX, new UnaryPrefix(NodeKind.PREFIX_DECREMENT));
    pratt.prefix(TokenKind.PLUS, Precedence.UNARY_PREFIX, new UnaryPrefix(NodeKind.POSITIVE));
    pratt.prefix(TokenKind.MINUS, Precedence.UNARY_PREFIX, new UnaryPrefix(NodeKind.NEGATIVE));
    pratt.prefix(TokenKind.NOT, Precedence.UNARY_PREFIX, new UnaryPrefix(NodeKind.NOT));
    pratt.prefix(TokenKind.TILDE, Precedence.UNARY_PREFIX, new UnaryPrefix(NodeKind.COMPLEMENT));
    pratt.infix(TokenKind.BITWISE_AND, Precedence.BITWISE_AND, new BinaryInfix(NodeKind.BITWISE_AND));
    pratt.infix(TokenKind.BITWISE_OR, Precedence.BITWISE_OR, new BinaryInfix(NodeKind.BITWISE_OR));
    pratt.infix(TokenKind.BITWISE_XOR, Precedence.BITWISE_XOR, new BinaryInfix(NodeKind.BITWISE_XOR));
    pratt.infix(TokenKind.DIVIDE, Precedence.MULTIPLY, new BinaryInfix(NodeKind.DIVIDE));
    pratt.infix(TokenKind.EQUAL, Precedence.EQUAL, new BinaryInfix(NodeKind.EQUAL));
    pratt.infix(TokenKind.GREATER_THAN, Precedence.COMPARE, new BinaryInfix(NodeKind.GREATER_THAN));
    pratt.infix(TokenKind.GREATER_THAN_OR_EQUAL, Precedence.COMPARE, new BinaryInfix(NodeKind.GREATER_THAN_OR_EQUAL));
    pratt.infix(TokenKind.IN, Precedence.COMPARE, new BinaryInfix(NodeKind.IN));
    pratt.infix(TokenKind.LESS_THAN, Precedence.COMPARE, new BinaryInfix(NodeKind.LESS_THAN));
    pratt.infix(TokenKind.LESS_THAN_OR_EQUAL, Precedence.COMPARE, new BinaryInfix(NodeKind.LESS_THAN_OR_EQUAL));
    pratt.infix(TokenKind.LOGICAL_AND, Precedence.LOGICAL_AND, new BinaryInfix(NodeKind.LOGICAL_AND));
    pratt.infix(TokenKind.LOGICAL_OR, Precedence.LOGICAL_OR, new BinaryInfix(NodeKind.LOGICAL_OR));
    pratt.infix(TokenKind.MINUS, Precedence.ADD, new BinaryInfix(NodeKind.SUBTRACT));
    pratt.infix(TokenKind.MULTIPLY, Precedence.MULTIPLY, new BinaryInfix(NodeKind.MULTIPLY));
    pratt.infix(TokenKind.NOT_EQUAL, Precedence.EQUAL, new BinaryInfix(NodeKind.NOT_EQUAL));
    pratt.infix(TokenKind.PLUS, Precedence.ADD, new BinaryInfix(NodeKind.ADD));
    pratt.infix(TokenKind.REMAINDER, Precedence.MULTIPLY, new BinaryInfix(NodeKind.REMAINDER));
    pratt.infix(TokenKind.SHIFT_LEFT, Precedence.SHIFT, new BinaryInfix(NodeKind.SHIFT_LEFT));
    pratt.infix(TokenKind.SHIFT_RIGHT, Precedence.SHIFT, new BinaryInfix(NodeKind.SHIFT_RIGHT));
    pratt.infixRight(TokenKind.ASSIGN, Precedence.ASSIGN, new BinaryInfix(NodeKind.ASSIGN));
    pratt.infixRight(TokenKind.ASSIGN_PLUS, Precedence.ASSIGN, new BinaryInfix(NodeKind.ASSIGN_ADD));
    pratt.infixRight(TokenKind.ASSIGN_BITWISE_AND, Precedence.ASSIGN, new BinaryInfix(NodeKind.ASSIGN_BITWISE_AND));
    pratt.infixRight(TokenKind.ASSIGN_BITWISE_OR, Precedence.ASSIGN, new BinaryInfix(NodeKind.ASSIGN_BITWISE_OR));
    pratt.infixRight(TokenKind.ASSIGN_BITWISE_XOR, Precedence.ASSIGN, new BinaryInfix(NodeKind.ASSIGN_BITWISE_XOR));
    pratt.infixRight(TokenKind.ASSIGN_DIVIDE, Precedence.ASSIGN, new BinaryInfix(NodeKind.ASSIGN_DIVIDE));
    pratt.infixRight(TokenKind.ASSIGN_MULTIPLY, Precedence.ASSIGN, new BinaryInfix(NodeKind.ASSIGN_MULTIPLY));
    pratt.infixRight(TokenKind.ASSIGN_REMAINDER, Precedence.ASSIGN, new BinaryInfix(NodeKind.ASSIGN_REMAINDER));
    pratt.infixRight(TokenKind.ASSIGN_SHIFT_LEFT, Precedence.ASSIGN, new BinaryInfix(NodeKind.ASSIGN_SHIFT_LEFT));
    pratt.infixRight(TokenKind.ASSIGN_SHIFT_RIGHT, Precedence.ASSIGN, new BinaryInfix(NodeKind.ASSIGN_SHIFT_RIGHT));
    pratt.infixRight(TokenKind.ASSIGN_MINUS, Precedence.ASSIGN, new BinaryInfix(NodeKind.ASSIGN_SUBTRACT));
    pratt.parselet(TokenKind.LEFT_BRACKET, Precedence.LOWEST).prefix = new ListParselet();
    pratt.parselet(TokenKind.LEFT_PARENTHESIS, Precedence.LOWEST).prefix = new ParenthesisParselet();
    pratt.parselet(TokenKind.QUESTION_MARK, Precedence.ASSIGN).infix = new HookParselet();
    pratt.parselet(TokenKind.COMMA, Precedence.COMMA).infix = new SequenceParselet();
    pratt.parselet(TokenKind.DOT, Precedence.MEMBER).infix = new DotInfixParselet();
    pratt.parselet(TokenKind.DOT, Precedence.LOWEST).prefix = new DotPrefixParselet();
    pratt.parselet(TokenKind.LEFT_PARENTHESIS, Precedence.UNARY_POSTFIX).infix = new CallParselet();
    pratt.parselet(TokenKind.LEFT_BRACKET, Precedence.UNARY_POSTFIX).infix = new IndexParselet();
    pratt.parselet(TokenKind.START_PARAMETER_LIST, Precedence.MEMBER).infix = new ParameterizeParselet();
    pratt.parselet(TokenKind.UNTYPED, Precedence.UNARY_PREFIX).prefix = new UntypedParselet();
    pratt.parselet(TokenKind.NEW, Precedence.LOWEST).prefix = new NewParselet();
    pratt.parselet(TokenKind.SUPER, Precedence.LOWEST).prefix = new SuperParselet();
  }
  function typeToText(type) {
    return 'type "' + type + '"';
  }
  function semanticWarningUnusedExpression(log, range) {
    log.warning(range, 'Unused expression');
  }
  function semanticWarningDuplicateModifier(log, range, modifier) {
    log.warning(range, 'Duplicate modifier ' + simpleQuote(modifier));
  }
  function semanticErrorRedundantModifier(log, range, modifier, where) {
    log.error(range, 'Redundant modifier ' + simpleQuote(modifier) + ' ' + where);
  }
  function semanticErrorUnexpectedModifier(log, range, modifier, where) {
    log.error(range, 'Cannot use the ' + simpleQuote(modifier) + ' modifier ' + where);
  }
  function semanticErrorDuplicateSymbol(log, range, name, previous) {
    log.error(range, simpleQuote(name) + ' is already declared');
    if (!previous.isEmpty()) {
      log.note(previous, 'The previous declaration is here');
    }
  }
  function semanticErrorUnexpectedNode(log, range, kind) {
    log.error(range, 'Unexpected ' + in_NodeKind.toString(kind));
  }
  function semanticErrorUnexpectedExpression(log, range, type) {
    log.error(range, 'Unexpected expression of ' + typeToText(type));
  }
  function semanticErrorUnexpectedType(log, range, type) {
    log.error(range, 'Unexpected ' + typeToText(type));
  }
  function semanticErrorUndeclaredSymbol(log, range, name) {
    log.error(range, simpleQuote(name) + ' is not declared');
  }
  function semanticErrorUnknownMemberSymbol(log, range, name, type) {
    log.error(range, simpleQuote(name) + ' is not declared on ' + typeToText(type));
  }
  function semanticErrorExtensionMissingTarget(log, range, name) {
    log.error(range, 'No type named ' + simpleQuote(name) + ' to extend');
  }
  function semanticErrorDifferentModifiers(log, range, name, previous) {
    log.error(range, 'Cannot merge multiple declarations for ' + simpleQuote(name) + ' with different modifiers');
    if (!previous.isEmpty()) {
      log.note(previous, 'The conflicting declaration is here');
    }
  }
  function semanticErrorBadUsingValue(log, range) {
    log.error(range, 'Expected a type here');
  }
  function semanticErrorBadUsing(log, range) {
    log.error(range, 'Expected a namespace here');
  }
  function semanticErrorUnexpectedStatement(log, range) {
    log.error(range, 'Cannot use this statement here');
  }
  function semanticErrorCyclicDeclaration(log, range, name) {
    log.error(range, 'Cyclic declaration of ' + simpleQuote(name));
  }
  function semanticErrorUnexpectedThis(log, range, name) {
    log.error(range, 'Cannot use ' + simpleQuote(name) + ' outside a class');
  }
  function semanticErrorStaticThis(log, range, name) {
    log.error(range, 'Cannot access ' + simpleQuote(name) + ' from a static context');
  }
  function semanticErrorIncompatibleTypes(log, range, from, to, isCastAllowed) {
    log.error(range, 'Cannot convert from ' + typeToText(from) + ' to ' + typeToText(to) + (isCastAllowed ? ' without a cast' : ''));
  }
  function semanticErrorNoCommonType(log, range, left, right) {
    log.error(range, 'No common type for ' + typeToText(left) + ' and ' + typeToText(right));
  }
  function semanticErrorBadType(log, range, type) {
    log.error(range, 'Cannot use ' + typeToText(type) + ' here');
  }
  function semanticErrorMemberUnexpectedStatic(log, range, name) {
    log.error(range, 'Cannot access static member ' + simpleQuote(name) + ' from an instance context');
  }
  function semanticErrorMemberUnexpectedInstance(log, range, name) {
    log.error(range, 'Cannot access instance member ' + simpleQuote(name) + ' from a static context');
  }
  function semanticErrorMissingTypeContext(log, range) {
    log.error(range, 'Expression has no type context here');
  }
  function semanticErrorBadTypeParameterBound(log, range, type) {
    log.error(range, 'Cannot use ' + typeToText(type) + ' as a type parameter bound');
  }
  function semanticErrorUninitializedExtensionVariable(log, range) {
    log.error(range, 'Instance variables in extension blocks must be initialized');
  }
  function semanticErrorNonPureGlobalVariable(log, range) {
    log.error(range, 'Global variables must be initialized to a pure expression (one without side effects)');
  }
  function semanticErrorNonConstantConstValue(log, range) {
    log.error(range, 'Variables with the "const" modifier must be initialized to a compile-time constant');
  }
  function semanticErrorConstMissingValue(log, range) {
    log.error(range, 'Variables with the "const" modifier must be initialized');
  }
  function semanticErrorVarMissingValue(log, range) {
    log.error(range, 'Implicitly typed variables must be initialized');
  }
  function semanticErrorVarBadType(log, range, type) {
    log.error(range, 'Implicitly typed variables cannot be of ' + typeToText(type));
  }
  function semanticErrorInvalidCall(log, range, type) {
    log.error(range, 'Cannot call ' + typeToText(type));
  }
  function semanticErrorParameterCount(log, range, expected, found) {
    log.error(range, 'Expected ' + expected + plural(expected, ' type parameter', ' type parameters') + ' but found ' + found + plural(found, ' type parameter', ' type parameters'));
  }
  function semanticErrorArgumentCount(log, range, expected, found) {
    log.error(range, 'Expected ' + expected + plural(expected, ' argument', ' arguments') + ' but found ' + found + plural(found, ' argument', ' arguments'));
  }
  function semanticErrorExpectedReturnValue(log, range, type) {
    log.error(range, 'Return statement must return ' + typeToText(type));
  }
  function semanticErrorNonConstantCaseValue(log, range) {
    log.error(range, 'Non-constant case value');
  }
  function semanticErrorBadDefaultCase(log, range) {
    log.error(range, 'Only the last case can be a default case');
  }
  function semanticErrorNonIntegerSwitch(log, range, type) {
    log.error(range, 'Expected an integer type but got ' + typeToText(type));
  }
  function semanticErrorDuplicateCase(log, range, previous) {
    log.error(range, 'Duplicate case value');
    if (!previous.isEmpty()) {
      log.note(previous, 'The first occurrence is here');
    }
  }
  function semanticErrorUnconstructableType(log, range, type) {
    log.error(range, 'Cannot construct ' + typeToText(type));
  }
  function semanticErrorAbstractConstructorInitializer(log, range) {
    log.error(range, 'An abstract constructor must not have initializer list');
  }
  function semanticErrorAbstractNew(log, range, type, reason, name) {
    log.error(range, 'Cannot construct abstract ' + typeToText(type));
    if (!reason.isEmpty()) {
      log.note(reason, 'The ' + typeToText(type) + ' is abstract due to member ' + simpleQuote(name));
    }
  }
  function semanticErrorUnexpectedBaseType(log, range, what) {
    log.error(range, what + ' cannot inherit from another type');
  }
  function semanticErrorClassBaseNotFirst(log, range, type) {
    log.error(range, 'Base ' + typeToText(type) + ' must come first in a class declaration');
  }
  function semanticErrorBaseTypeNotInterface(log, range, type) {
    log.error(range, 'Base ' + typeToText(type) + ' must be an interface');
  }
  function semanticErrorDuplicateBaseType(log, range, type) {
    log.error(range, 'Duplicate base ' + typeToText(type));
  }
  function semanticErrorAmbiguousSymbol(log, range, name, names) {
    for (var i = 0; i < names.length; i = i + 1 | 0) {
      names[i] = simpleQuote(names[i]);
    }
    log.error(range, 'Reference to ' + simpleQuote(name) + ' is ambiguous, could be ' + names.join(' or '));
  }
  function semanticErrorUnmergedSymbol(log, range, name, types) {
    var names = [];
    for (var i = 0; i < types.length; i = i + 1 | 0) {
      names.push(typeToText(types[i]));
    }
    log.error(range, 'Member ' + simpleQuote(name) + ' has an ambiguous inherited type, could be ' + names.join(' or '));
  }
  function semanticErrorBadOverride(log, range, name, base, overridden) {
    log.error(range, simpleQuote(name) + ' overrides another declaration with the same name in base ' + typeToText(base));
    if (!overridden.isEmpty()) {
      log.note(overridden, 'The overridden declaration is here');
    }
  }
  function semanticErrorOverrideDifferentTypes(log, range, name, base, derived, overridden) {
    log.error(range, simpleQuote(name) + ' must have the same signature as the method it overrides (expected ' + typeToText(base) + ' but found ' + typeToText(derived) + ')');
    if (!overridden.isEmpty()) {
      log.note(overridden, 'The overridden declaration is here');
    }
  }
  function semanticErrorModifierMissingOverride(log, range, name, overridden) {
    log.error(range, simpleQuote(name) + ' overrides another symbol with the same name but is missing the "override" modifier');
    if (!overridden.isEmpty()) {
      log.note(overridden, 'The overridden declaration is here');
    }
  }
  function semanticErrorCannotOverrideNonVirtual(log, range, name, overridden) {
    log.error(range, simpleQuote(name) + ' cannot override a non-virtual method');
    if (!overridden.isEmpty()) {
      log.note(overridden, 'The overridden declaration is here');
    }
  }
  function semanticErrorBadIntegerConstant(log, range, type) {
    log.error(range, 'Expected integer constant but found expression of ' + typeToText(type));
  }
  function semanticErrorNoUnaryOperator(log, range, kind, type) {
    if (!in_NodeKind.isUnaryOperator(kind)) {
      throw new Error('assert kind.isUnaryOperator(); (src/resolver/diagnostics.sk:247:3)');
    }
    log.error(range, 'No unary operator ' + operatorInfo.get(kind).text + ' for ' + typeToText(type));
  }
  function semanticErrorNoBinaryOperator(log, range, kind, left, right) {
    if (!in_NodeKind.isBinaryOperator(kind)) {
      throw new Error('assert kind.isBinaryOperator(); (src/resolver/diagnostics.sk:252:3)');
    }
    log.error(range, 'No binary operator ' + operatorInfo.get(kind).text + ' for ' + typeToText(left) + ' and ' + typeToText(right));
  }
  function semanticErrorNoTernaryOperator(log, range, kind, left, middle, right) {
    if (!in_NodeKind.isTernaryOperator(kind)) {
      throw new Error('assert kind.isTernaryOperator(); (src/resolver/diagnostics.sk:257:3)');
    }
    log.error(range, 'No ternary operator ' + operatorInfo.get(kind).text + ' for ' + typeToText(left) + ', ' + typeToText(middle) + ', and ' + typeToText(right));
  }
  function semanticErrorBadStorage(log, range) {
    log.error(range, 'Cannot store to this location');
  }
  function semanticErrorStorageToProtectedSymbol(log, range, modifier) {
    log.error(range, 'Cannot store to a symbol marked as ' + simpleQuote(modifier));
  }
  function semanticErrorUnparameterizedType(log, range, type) {
    log.error(range, 'Cannot use unparameterized ' + typeToText(type));
  }
  function semanticErrorCannotParameterize(log, range, type) {
    log.error(range, 'Cannot parameterize ' + typeToText(type) + (type.hasParameters() ? ' because it is already parameterized' : ' because it has no type parameters'));
  }
  function semanticErrorBadSuperInitializer(log, range) {
    log.error(range, 'No base constructor to call');
  }
  function semanticErrorMissingSuperInitializer(log, range) {
    log.error(range, 'Missing call to "super" in initializer list');
  }
  function semanticErrorAlreadyInitialized(log, range, name, previous) {
    log.error(range, simpleQuote(name) + ' is already initialized');
    if (!previous.isEmpty()) {
      log.note(previous, 'The previous initialization is here');
    }
  }
  function semanticErrorBadEnumToString(log, range, name, first, second, value) {
    log.error(range, 'Cannot automatically generate "toString" for ' + simpleQuote(name) + ' because ' + simpleQuote(first) + ' and ' + simpleQuote(second) + ' both have the same value ' + value);
  }
  function semanticErrorMissingReturn(log, range, name, type) {
    log.error(range, 'All control paths for ' + simpleQuote(name) + ' must return a value of ' + typeToText(type));
  }
  function semanticErrorBaseClassInExtension(log, range) {
    log.error(range, 'The base class must be set from the class declaration, not from an extension block');
  }
  function semanticErrorMustCallFunctionReference(log, range) {
    log.error(range, 'Raw function references are not allowed (call the function instead)');
  }
  function semanticErrorMissingToString(log, range, type) {
    log.error(range, 'Expression of ' + typeToText(type) + ' has no toString() member to call');
  }
  function semanticErrorToStringWrongType(log, range, expected, found, declaration) {
    log.error(range, 'Expected toString() to have ' + typeToText(expected) + ' but found ' + typeToText(found));
    if (!declaration.isEmpty()) {
      log.note(declaration, 'The declaration for toString() is here');
    }
  }
  function semanticErrorCannotImplementImportedFunction(log, range) {
    log.error(range, 'Imported functions cannot have an implementation');
  }
  function semanticErrorFunctionMustBeAbstract(log, range) {
    log.error(range, 'Abstract functions must use the "virtual" modifier');
  }
  function semanticErrorUnimplementedConstructor(log, range) {
    log.error(range, 'Every constructor must have an implementation');
  }
  function semanticErrorUnimplementedFunction(log, range) {
    log.error(range, 'Use the "import" modifier to import functions');
  }
  function semanticErrorNonConstantAssert(log, range) {
    log.error(range, 'The argument to a compile-time assert must be a constant');
  }
  function semanticErrorFalseAssert(log, range) {
    log.error(range, 'Assertion failed');
  }
  function semanticErrorListTypeInferenceFailed(log, range) {
    log.error(range, 'Cannot infer a common element type for this list literal');
  }
  function semanticErrorNoDefaultValue(log, range, type) {
    log.error(range, 'Cannot create a default value for ' + typeToText(type));
  }
  function semanticErrorEnumValueOutOfRange(log, range, name) {
    log.error(range, 'Assigned value for enum ' + simpleQuote(name) + ' cannot fit in an integer');
  }
  function semanticErrorBadSuperCall(log, range) {
    log.error(range, 'Cannot use "super" here');
  }
  function semanticErrorAbstractSuperCall(log, range, overridden) {
    log.error(range, 'Cannot call abstract member in base class');
    if (!overridden.isEmpty()) {
      log.note(overridden, 'The overridden member is here');
    }
  }
  function semanticErrorNestedStorageOperator(log, range) {
    log.error(range, 'Assignment expressions are not allowed inside other expressions');
  }
  function semanticErrorForVariablesMustBeSameType(log, range, firstName, firstType, secondName, secondType) {
    log.error(range, 'All for loop variables must have the same type (' + simpleQuote(firstName) + ' has ' + typeToText(firstType) + ' but ' + simpleQuote(secondName) + ' has ' + typeToText(secondType) + ')');
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
      if (callSite !== null && callSite.kind === NodeKind.CALL) {
        info.callSites[i] = null;
        var clone = info.inlineValue.clone();
        var values = callSite.removeChildren();
        if (values.length !== (info.$arguments.length + 1 | 0)) {
          throw new Error('assert values.size() == info.arguments.size() + 1; (src/resolver/functioninlining.sk:31:9)');
        }
        var value = values.shift();
        if (value.kind !== NodeKind.NAME || value.symbol !== info.symbol) {
          throw new Error('assert value.kind == .NAME && value.symbol == info.symbol; (src/resolver/functioninlining.sk:33:9)');
        }
        if (info.unusedArguments.length > 0) {
          var sequence = null;
          for (var j = 0; j < info.unusedArguments.length; j = j + 1 | 0) {
            var index = info.$arguments.indexOf(info.unusedArguments[j]);
            if (index < 0) {
              throw new Error('assert index >= 0; (src/resolver/functioninlining.sk:51:13)');
            }
            var replacement = values[index];
            if (!replacement.hasNoSideEffects()) {
              if (sequence === null) {
                sequence = [];
              }
              sequence.push(replacement);
            }
          }
          if (sequence !== null) {
            sequence.push(clone);
            callSite.become(Node.createSequence(sequence));
            FunctionInliningPass.recursivelySubstituteArguments(callSite, info.$arguments, values);
            continue;
          }
        }
        callSite.become(clone);
        FunctionInliningPass.recursivelySubstituteArguments(callSite, info.$arguments, values);
      }
    }
  };
  FunctionInliningPass.recursivelySubstituteArguments = function(node, $arguments, values) {
    if (node.symbol !== null) {
      var index = $arguments.indexOf(node.symbol);
      if (index >= 0) {
        node.replaceWith(values[index]);
        return;
      }
    }
    if (node.hasChildren()) {
      for (var i = 0; i < node.children.length; i = i + 1 | 0) {
        var child = node.children[i];
        if (child !== null) {
          FunctionInliningPass.recursivelySubstituteArguments(child, $arguments, values);
        }
      }
    }
  };
  InstanceToStaticPass.run = function(graph, resolver) {
    for (var i = 0; i < graph.callInfo.length; i = i + 1 | 0) {
      var info = graph.callInfo[i];
      var symbol = info.symbol;
      var enclosingSymbol = symbol.enclosingSymbol;
      if (symbol.kind === SymbolKind.INSTANCE_FUNCTION && !symbol.isImport() && symbol.node.functionBlock() !== null && (enclosingSymbol.isImport() || in_SymbolKind.isEnum(enclosingSymbol.kind) || resolver.options.convertAllInstanceToStatic && !symbol.isExport() && !symbol.isVirtual())) {
        var thisSymbol = resolver.createSymbol('this', SymbolKind.LOCAL_VARIABLE);
        thisSymbol.type = enclosingSymbol.type;
        var replacedThis = InstanceToStaticPass.recursivelyReplaceThis(symbol.node.functionBlock(), thisSymbol);
        symbol.kind = SymbolKind.GLOBAL_FUNCTION;
        symbol.flags |= SymbolFlag.STATIC;
        if (replacedThis) {
          var $arguments = symbol.type.argumentTypes();
          $arguments.unshift(enclosingSymbol.type);
          symbol.type = resolver.cache.functionType(symbol.type.resultType(), $arguments);
          thisSymbol.node = Node.createVariable(Node.createName('this').withSymbol(thisSymbol), Node.createType(thisSymbol.type), null).withSymbol(thisSymbol);
          symbol.node.functionArguments().insertChild(0, thisSymbol.node);
        }
        for (var j = 0; j < info.callSites.length; j = j + 1 | 0) {
          var callSite = info.callSites[j];
          var value = callSite.callValue();
          var target = null;
          var name = null;
          if (value.kind === NodeKind.DOT) {
            target = value.dotTarget().replaceWith(null);
            name = value.dotName().replaceWith(null);
          } else {
            if (value.kind !== NodeKind.NAME) {
              throw new Error('assert value.kind == .NAME; (src/resolver/instancetostatic.sk:46:13)');
            }
            target = Node.createThis();
            name = value.replaceWith(null);
          }
          callSite.replaceChild(0, name);
          if (replacedThis) {
            callSite.insertChild(1, target);
          } else if (!target.hasNoSideEffects()) {
            var children = callSite.removeChildren();
            var clone = callSite.clone().withChildren(children);
            callSite.become(Node.createSequence([target, clone]));
          }
        }
      }
    }
  };
  InstanceToStaticPass.createThis = function(symbol) {
    return Node.createName(symbol.name).withSymbol(symbol).withType(symbol.type);
  };
  InstanceToStaticPass.recursivelyReplaceThis = function(node, symbol) {
    if (node.kind === NodeKind.THIS) {
      node.become(InstanceToStaticPass.createThis(symbol).withRange(node.range));
      return true;
    }
    if (node.isNameExpression() && (node.symbol.kind === SymbolKind.INSTANCE_FUNCTION || node.symbol.kind === SymbolKind.INSTANCE_VARIABLE)) {
      node.become(Node.createDot(InstanceToStaticPass.createThis(symbol), node.clone()).withType(node.type).withRange(node.range).withSymbol(node.symbol));
      return true;
    }
    var replacedThis = false;
    if (node.hasChildren()) {
      for (var i = 0; i < node.children.length; i = i + 1 | 0) {
        var child = node.children[i];
        if (child !== null && InstanceToStaticPass.recursivelyReplaceThis(child, symbol)) {
          replacedThis = true;
        }
      }
    }
    return replacedThis;
  };
  function createNameToSymbolFlag() {
    if (nameToSymbolFlag !== null) {
      return;
    }
    nameToSymbolFlag = new StringMap();
    nameToSymbolFlag.set('const', SymbolFlag.CONST);
    nameToSymbolFlag.set('export', SymbolFlag.EXPORT);
    nameToSymbolFlag.set('final', SymbolFlag.FINAL);
    nameToSymbolFlag.set('import', SymbolFlag.IMPORT);
    nameToSymbolFlag.set('inline', SymbolFlag.INLINE);
    nameToSymbolFlag.set('override', SymbolFlag.OVERRIDE);
    nameToSymbolFlag.set('private', SymbolFlag.PRIVATE);
    nameToSymbolFlag.set('protected', SymbolFlag.PROTECTED);
    nameToSymbolFlag.set('public', SymbolFlag.PUBLIC);
    nameToSymbolFlag.set('static', SymbolFlag.STATIC);
    nameToSymbolFlag.set('virtual', SymbolFlag.VIRTUAL);
  }
  function createSymbolFlagToName() {
    if (symbolFlagToName !== null) {
      return;
    }
    symbolFlagToName = new IntMap();
    symbolFlagToName.set(SymbolFlag.CONST, 'const');
    symbolFlagToName.set(SymbolFlag.EXPORT, 'export');
    symbolFlagToName.set(SymbolFlag.FINAL, 'final');
    symbolFlagToName.set(SymbolFlag.IMPORT, 'import');
    symbolFlagToName.set(SymbolFlag.INLINE, 'inline');
    symbolFlagToName.set(SymbolFlag.OVERRIDE, 'override');
    symbolFlagToName.set(SymbolFlag.PRIVATE, 'private');
    symbolFlagToName.set(SymbolFlag.PROTECTED, 'protected');
    symbolFlagToName.set(SymbolFlag.PUBLIC, 'public');
    symbolFlagToName.set(SymbolFlag.STATIC, 'static');
    symbolFlagToName.set(SymbolFlag.VIRTUAL, 'virtual');
  }
  in_SymbolKind.isParameter = function($this) {
    return $this >= SymbolKind.OBJECT_PARAMETER && $this <= SymbolKind.FUNCTION_PARAMETER;
  };
  in_SymbolKind.isNamespace = function($this) {
    return $this >= SymbolKind.GLOBAL_NAMESPACE && $this <= SymbolKind.NAMESPACE;
  };
  in_SymbolKind.isTypeWithInstances = function($this) {
    return $this >= SymbolKind.ENUM && $this <= SymbolKind.INTERFACE;
  };
  in_SymbolKind.isEnum = function($this) {
    return $this >= SymbolKind.ENUM && $this <= SymbolKind.ENUM_FLAGS;
  };
  in_SymbolKind.isObject = function($this) {
    return $this >= SymbolKind.CLASS && $this <= SymbolKind.INTERFACE;
  };
  in_SymbolKind.isType = function($this) {
    return $this >= SymbolKind.OTHER_TYPE && $this <= SymbolKind.INTERFACE;
  };
  in_SymbolKind.isFunction = function($this) {
    return $this >= SymbolKind.GLOBAL_FUNCTION && $this <= SymbolKind.CONSTRUCTOR_FUNCTION;
  };
  in_SymbolKind.isVariable = function($this) {
    return $this >= SymbolKind.LOCAL_VARIABLE && $this <= SymbolKind.INSTANCE_VARIABLE;
  };
  in_SymbolKind.isGlobal = function($this) {
    return $this === SymbolKind.GLOBAL_FUNCTION || $this === SymbolKind.GLOBAL_VARIABLE;
  };
  in_SymbolKind.isInstance = function($this) {
    return $this === SymbolKind.INSTANCE_FUNCTION || $this === SymbolKind.INSTANCE_VARIABLE || $this === SymbolKind.CONSTRUCTOR_FUNCTION;
  };
  in_SymbolKind.toString = function($this) {
    switch ($this) {
    case 0:
      return 'OTHER';
    case 1:
      return 'AUTOMATIC';
    case 2:
      return 'AMBIGUOUS';
    case 3:
      return 'UNMERGED';
    case 4:
      return 'OTHER_TYPE';
    case 5:
      return 'ALIAS';
    case 6:
      return 'OBJECT_PARAMETER';
    case 7:
      return 'FUNCTION_PARAMETER';
    case 8:
      return 'GLOBAL_NAMESPACE';
    case 9:
      return 'NAMESPACE';
    case 10:
      return 'ENUM';
    case 11:
      return 'ENUM_FLAGS';
    case 12:
      return 'CLASS';
    case 13:
      return 'INTERFACE';
    case 14:
      return 'GLOBAL_FUNCTION';
    case 15:
      return 'INSTANCE_FUNCTION';
    case 16:
      return 'CONSTRUCTOR_FUNCTION';
    case 17:
      return 'LOCAL_VARIABLE';
    case 18:
      return 'GLOBAL_VARIABLE';
    case 19:
      return 'INSTANCE_VARIABLE';
    default:
      return '';
    }
  };
  service.nodeFromPosition = function(node, source, index) {
    while (node.hasChildren()) {
      var i = 0;
      for (i = node.children.length - 1 | 0; i >= 0; i = i - 1 | 0) {
        var child = node.children[i];
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
      case 6:
      case 7:
        var bound = symbol.type.bound();
        var text = 'type ' + symbol.name;
        if (bound !== null) {
          text += ' is ' + bound;
        }
        result.declaration = text;
        break;
      case 9:
        result.declaration = 'namespace ' + symbol.fullName();
        break;
      case 12:
      case 13:
        var text = in_SymbolKind.toString(symbol.kind).toLowerCase() + ' ' + type;
        if (type.hasRelevantTypes()) {
          for (var i = 0; i < type.relevantTypes.length; i = i + 1 | 0) {
            text += (i === 0 ? ' : ' : ', ') + type.relevantTypes[i];
          }
        }
        result.declaration = text;
        break;
      case 10:
        result.declaration = 'enum ' + symbol.fullName();
        break;
      case 11:
        result.declaration = 'enum flags ' + symbol.fullName();
        break;
      case 14:
      case 15:
      case 16:
        var text = type.resultType() + ' ' + symbol.name + '(';
        var $arguments = symbol.node.functionArguments().children;
        var argumentTypes = type.argumentTypes();
        for (var i = 0; i < $arguments.length; i = i + 1 | 0) {
          if (i > 0) {
            text += ', ';
          }
          text += argumentTypes[i] + ' ' + $arguments[i].symbol.name;
        }
        result.declaration = text + ')';
        break;
      case 17:
      case 18:
      case 19:
        var text = type + ' ' + symbol.name;
        if (symbol.isEnumValue()) {
          text += ' = ' + symbol.constant.asInt();
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
        var isInstance = !in_NodeKind.isType(target.kind);
        var members = target.type.members.values();
        for (var i = 0; i < members.length; i = i + 1 | 0) {
          var member = members[i];
          resolver.initializeMember(member);
          if (in_SymbolKind.isInstance(member.symbol.kind) === isInstance) {
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
    if (name !== 'new' && type !== null) {
      var text = name;
      if (type.isFunction()) {
        var semicolon = type.resultType().toString() === 'void';
        text += type.argumentTypes().length === 0 ? semicolon ? '();$' : '()$' : semicolon ? '($);' : '($)';
      } else {
        text += '$';
      }
      completions.push(new LanguageServiceCompletion(name, type.toString(), text));
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
  var NATIVE_LIBRARY_CPP = '\nimport void cpp_toString();\n\nimport class int {\n  inline string toString() { return untyped(cpp_toString)(this); }\n}\nimport class bool {\n  inline string toString() { return untyped(cpp_toString)(this); }\n}\nimport class float {\n  inline string toString() { return untyped(cpp_toString)(this); }\n}\nimport class double {\n  inline string toString() { return untyped(cpp_toString)(this); }\n}\n\nimport class string {\n  import int size();\n  import string slice(int start, int end);\n  import int indexOf(string value);\n  import int lastIndexOf(string value);\n  import string toLowerCase();\n  import string toUpperCase();\n  import static string fromCodeUnit(int value);\n  import string get(int index);\n  import int codeUnitAt(int index);\n  string join(List<string> values) { var result = ""; for (var i = 0; i < values.size(); i++) { if (i > 0) result += this; result += values.get(i); } return result; }\n  bool startsWith(string prefix) { return size() >= prefix.size() && slice(0, prefix.size()) == prefix; }\n  bool endsWith(string suffix) { return size() >= suffix.size() && slice(size() - suffix.size(), size()) == suffix; }\n  string repeat(int count) { var result = ""; for (var i = 0; i < count; i++) result += this; return result; }\n}\n\nexport interface IComparison<T> {\n  export virtual int compare(T left, T right);\n}\n\nimport class List<T> {\n  new();\n  import int size();\n  import void push(T value);\n  import void unshift(T value);\n  import List<T> slice(int start, int end);\n  import int indexOf(T value);\n  import int lastIndexOf(T value);\n  import T shift();\n  import T pop();\n  import void reverse();\n  import void sort(IComparison<T> comparison);\n  import List<T> clone();\n  import T remove(int index);\n  import void insert(int index, T value);\n  import T get(int index);\n  import void set(int index, T value);\n  import void swap(int a, int b);\n}\n\nimport class StringMap<T> {\n  new();\n  import T get(string key);\n  import T getOrDefault(string key, T defaultValue);\n  import void set(string key, T value);\n  import bool has(string key);\n  import void remove(string key);\n  import List<string> keys();\n  import List<T> values();\n  import StringMap<T> clone();\n}\n\nimport class IntMap<T> {\n  new();\n  import T get(int key);\n  import T getOrDefault(int key, T defaultValue);\n  import void set(int key, T value);\n  import bool has(int key);\n  import void remove(int key);\n  import List<int> keys();\n  import List<T> values();\n  import IntMap<T> clone();\n}\n';
  var NATIVE_LIBRARY = '\nimport class int { import string toString(); }\nimport class bool { import string toString(); }\nimport class float { import string toString(); }\nimport class double { import string toString(); }\n\nimport class string {\n  import int size();\n  import string slice(int start, int end);\n  import int indexOf(string value);\n  import int lastIndexOf(string value);\n  import string toLowerCase();\n  import string toUpperCase();\n  import static string fromCodeUnit(int value);\n  import string get(int index);\n  import string join(List<string> values);\n  import int codeUnitAt(int index);\n  import bool startsWith(string prefix);\n  import bool endsWith(string suffix);\n  import string repeat(int count);\n}\n\ninterface IComparison<T> {\n  virtual int compare(T left, T right);\n}\n\nimport class List<T> {\n  new();\n  import int size();\n  import void push(T value);\n  import void unshift(T value);\n  import List<T> slice(int start, int end);\n  import int indexOf(T value);\n  import int lastIndexOf(T value);\n  import T shift();\n  import T pop();\n  import void reverse();\n  import void sort(IComparison<T> comparison);\n  import List<T> clone();\n  import T remove(int index);\n  import void insert(int index, T value);\n  import T get(int index);\n  import void set(int index, T value);\n  import void swap(int a, int b);\n}\n\nclass StringMap<T> {\n  import T get(string key);\n  import T getOrDefault(string key, T defaultValue);\n  import void set(string key, T value);\n  import bool has(string key);\n  import void remove(string key);\n  import List<string> keys();\n  import List<T> values();\n  import StringMap<T> clone();\n}\n\nclass IntMap<T> {\n  import T get(int key);\n  import T getOrDefault(int key, T defaultValue);\n  import void set(int key, T value);\n  import bool has(int key);\n  import void remove(int key);\n  import List<int> keys();\n  import List<T> values();\n  import IntMap<T> clone();\n}\n';
  var BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  var HEX = '0123456789ABCDEF';
  trace.GENERICS = false;
  var NATIVE_LIBRARY_JS = '\nimport class int { import string toString(); }\nimport class bool { import string toString(); }\nimport class float { import string toString(); }\nimport class double { import string toString(); }\n\nimport class String {\n  import static string fromCharCode(int value);\n}\n\nimport class Object {\n  import static Object create(Object prototype);\n}\n\nimport namespace operators {\n  import void delete(int value);\n  import void sort<T>(List<T> list, IComparison<T> comparison);\n}\n\nimport class string {\n  inline int size() { return untyped(this).length; }\n  import string slice(int start, int end);\n  import int indexOf(string value);\n  import int lastIndexOf(string value);\n  import string toLowerCase();\n  import string toUpperCase();\n  inline static string fromCodeUnit(int value) { return String.fromCharCode(value); }\n  inline string get(int index) { return untyped(this)[index]; }\n  inline string join(List<string> values) { return untyped(values).join(this); }\n  inline int codeUnitAt(int index) { return untyped(this).charCodeAt(index); }\n  bool startsWith(string prefix) { return size() >= prefix.size() && slice(0, prefix.size()) == prefix; }\n  bool endsWith(string suffix) { return size() >= suffix.size() && slice(size() - suffix.size(), size()) == suffix; }\n  string repeat(int count) { var result = ""; for (var i = 0; i < count; i++) result += this; return result; }\n}\n\nexport interface IComparison<T> {\n  export virtual int compare(T left, T right);\n}\n\nimport class List<T> {\n  new();\n  inline int size() { return untyped(this).length; }\n  import void push(T value);\n  import void unshift(T value);\n  import List<T> slice(int start, int end);\n  import int indexOf(T value);\n  import int lastIndexOf(T value);\n  import T shift();\n  import T pop();\n  import void reverse();\n  inline void sort(IComparison<T> comparison) { operators.sort<T>(this, comparison); }\n  inline List<T> clone() { return untyped(this).slice(); }\n  inline T remove(int index) { return untyped(this).splice(index, 1)[0]; }\n  inline void insert(int index, T value) { untyped(this).splice(index, 0, value); }\n  inline T get(int index) { return untyped(this)[index]; }\n  inline void set(int index, T value) { untyped(this)[index] = value; }\n  inline void swap(int a, int b) { var temp = get(a); set(a, get(b)); set(b, temp); }\n}\n\nclass StringMap<T> {\n  Object table = Object.create(null);\n  inline T get(string key) { return untyped(table)[key]; }\n  inline T getOrDefault(string key, T defaultValue) { return untyped(table)[key] || defaultValue; }\n  inline void set(string key, T value) { untyped(table)[key] = value; }\n  inline bool has(string key) { return key in untyped(table); }\n  inline void remove(string key) { operators.delete(untyped(table)[key]); }\n\n  List<string> keys() {\n    List<string> keys = [];\n    for (string key in untyped(table)) keys.push(key);\n    return keys;\n  }\n\n  List<T> values() {\n    List<T> values = [];\n    for (string key in untyped(table)) values.push(get(key));\n    return values;\n  }\n\n  StringMap<T> clone() {\n    var clone = StringMap<T>();\n    for (string key in untyped(table)) clone.set(key, get(key));\n    return clone;\n  }\n}\n\nclass IntMap<T> {\n  Object table = Object.create(null);\n  inline T get(int key) { return untyped(table)[key]; }\n  inline T getOrDefault(int key, T defaultValue) { return untyped(table)[key] || defaultValue; }\n  inline void set(int key, T value) { untyped(table)[key] = value; }\n  inline bool has(int key) { return key in untyped(table); }\n  inline void remove(int key) { operators.delete(untyped(table)[key]); }\n\n  List<int> keys() {\n    List<int> keys = [];\n    for (double key in untyped(table)) keys.push((int)key);\n    return keys;\n  }\n\n  List<T> values() {\n    List<T> values = [];\n    for (int key in untyped(table)) values.push(get(key));\n    return values;\n  }\n\n  IntMap<T> clone() {\n    var clone = IntMap<T>();\n    for (int key in untyped(table)) clone.set(key, get(key));\n    return clone;\n  }\n}\n';
  var yy_accept = [95, 95, 95, 31, 34, 94, 65, 34, 74, 13, 34, 56, 78, 62, 69, 21, 61, 28, 26, 50, 50, 20, 79, 57, 2, 40, 73, 42, 55, 77, 15, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 54, 14, 76, 87, 94, 66, 95, 83, 95, 10, 59, 3, 95, 18, 95, 8, 46, 9, 24, 7, 94, 6, 95, 50, 95, 38, 95, 95, 80, 58, 33, 41, 81, 42, 5, 42, 42, 42, 42, 42, 42, 42, 27, 42, 42, 42, 42, 42, 42, 43, 42, 45, 53, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 4, 60, 94, 29, 49, 52, 51, 11, 12, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 39, 42, 42, 42, 42, 64, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 91, 42, 42, 38, 42, 42, 42, 17, 42, 42, 42, 42, 30, 32, 42, 42, 42, 42, 42, 42, 42, 67, 42, 42, 42, 42, 42, 42, 42, 42, 86, 88, 42, 42, 42, 42, 0, 42, 16, 19, 22, 42, 42, 42, 36, 37, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 84, 42, 42, 90, 42, 93, 1, 42, 42, 35, 44, 47, 42, 42, 42, 42, 42, 72, 75, 82, 85, 42, 42, 42, 25, 42, 42, 42, 70, 42, 89, 92, 23, 42, 42, 68, 42, 48, 63, 71, 95];
  var yy_ec = [0, 1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 4, 5, 1, 1, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 19, 19, 19, 19, 19, 20, 20, 21, 22, 23, 24, 25, 26, 1, 27, 27, 27, 27, 27, 27, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 29, 30, 31, 32, 28, 1, 33, 34, 35, 36, 37, 38, 39, 40, 41, 28, 42, 43, 44, 45, 46, 47, 28, 48, 49, 50, 51, 52, 53, 54, 55, 28, 56, 57, 58, 59, 1];
  var yy_meta = [0, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 3, 3, 1, 1, 1, 1, 1, 1, 3, 4, 1, 1, 1, 1, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 1, 1, 1, 1];
  var yy_base = [0, 0, 0, 310, 311, 58, 285, 57, 284, 56, 56, 311, 311, 283, 53, 311, 52, 311, 51, 73, 64, 311, 311, 45, 282, 46, 311, 0, 311, 311, 281, 29, 256, 52, 57, 54, 63, 68, 77, 251, 67, 265, 70, 76, 56, 89, 261, 311, 76, 311, 311, 71, 311, 120, 311, 297, 311, 311, 311, 118, 311, 296, 311, 311, 311, 311, 311, 0, 311, 117, 123, 114, 311, 127, 0, 274, 311, 311, 311, 273, 0, 311, 255, 246, 257, 244, 259, 246, 252, 0, 240, 237, 240, 243, 240, 236, 0, 236, 104, 0, 238, 228, 237, 242, 110, 244, 227, 243, 228, 233, 232, 221, 221, 229, 221, 220, 226, 311, 311, 0, 140, 135, 145, 0, 311, 311, 233, 228, 231, 226, 213, 116, 228, 223, 215, 212, 208, 223, 0, 209, 213, 216, 215, 0, 208, 202, 197, 198, 204, 195, 195, 207, 193, 193, 204, 185, 194, 0, 188, 194, 311, 187, 187, 192, 0, 184, 182, 190, 179, 0, 0, 181, 191, 184, 178, 180, 176, 174, 0, 174, 188, 183, 178, 170, 176, 168, 180, 0, 0, 167, 174, 161, 174, 0, 160, 0, 0, 0, 164, 165, 157, 0, 0, 156, 168, 166, 156, 161, 151, 165, 164, 153, 162, 0, 156, 158, 0, 161, 0, 0, 142, 140, 0, 0, 0, 144, 143, 139, 137, 123, 0, 0, 0, 0, 136, 128, 133, 0, 134, 133, 130, 0, 118, 0, 0, 0, 112, 102, 0, 93, 0, 0, 0, 311, 178, 182, 184, 188, 86];
  var yy_def = [0, 253, 1, 253, 253, 253, 253, 254, 253, 253, 255, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 256, 253, 253, 253, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 253, 253, 253, 253, 253, 253, 254, 253, 254, 253, 253, 253, 255, 253, 255, 253, 253, 253, 253, 253, 257, 253, 253, 253, 253, 253, 253, 258, 253, 253, 253, 253, 253, 256, 253, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 253, 253, 257, 253, 253, 253, 258, 253, 253, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 253, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 256, 0, 253, 253, 253, 253, 253];
  var yy_nxt = [0, 4, 5, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 20, 20, 21, 22, 23, 24, 25, 26, 27, 27, 28, 4, 29, 30, 31, 32, 33, 34, 35, 36, 27, 27, 37, 27, 27, 27, 38, 39, 40, 41, 42, 43, 44, 45, 46, 27, 27, 47, 48, 49, 50, 51, 51, 54, 57, 60, 63, 65, 67, 75, 76, 78, 79, 82, 51, 51, 68, 66, 64, 83, 69, 58, 70, 70, 70, 70, 85, 61, 55, 69, 123, 70, 70, 70, 70, 88, 86, 93, 90, 87, 91, 117, 112, 72, 89, 94, 113, 96, 71, 92, 95, 100, 72, 97, 98, 101, 104, 110, 99, 105, 73, 107, 108, 114, 109, 111, 54, 60, 74, 102, 252, 115, 121, 121, 118, 120, 120, 120, 120, 69, 251, 70, 70, 70, 70, 122, 122, 122, 140, 61, 250, 55, 146, 121, 121, 141, 249, 147, 120, 120, 120, 120, 72, 122, 122, 122, 166, 167, 248, 247, 246, 245, 244, 243, 242, 241, 240, 239, 238, 160, 53, 53, 53, 53, 59, 59, 59, 59, 80, 80, 119, 237, 119, 119, 236, 235, 234, 233, 232, 231, 230, 229, 228, 227, 226, 225, 224, 223, 222, 221, 220, 219, 218, 217, 216, 215, 214, 213, 212, 211, 210, 209, 208, 207, 206, 205, 204, 203, 202, 201, 200, 199, 198, 197, 196, 195, 194, 193, 192, 191, 190, 189, 188, 187, 186, 185, 184, 183, 182, 181, 180, 179, 178, 177, 176, 175, 174, 173, 172, 171, 170, 169, 168, 165, 164, 163, 162, 161, 159, 158, 157, 156, 155, 154, 153, 152, 151, 150, 149, 148, 145, 144, 143, 142, 139, 138, 137, 136, 135, 134, 133, 132, 131, 130, 129, 128, 127, 126, 125, 124, 253, 253, 116, 106, 103, 84, 81, 77, 62, 56, 52, 253, 3, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253];
  var yy_chk = [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 5, 5, 7, 9, 10, 14, 16, 18, 23, 23, 25, 25, 31, 51, 51, 18, 16, 14, 31, 20, 9, 20, 20, 20, 20, 33, 10, 7, 19, 258, 19, 19, 19, 19, 34, 33, 36, 35, 33, 35, 48, 44, 20, 34, 36, 44, 37, 19, 35, 36, 38, 19, 37, 37, 38, 40, 43, 37, 40, 19, 42, 42, 45, 42, 43, 53, 59, 19, 38, 249, 45, 71, 71, 48, 69, 69, 69, 69, 70, 247, 70, 70, 70, 70, 73, 73, 73, 98, 59, 246, 53, 104, 121, 121, 98, 242, 104, 120, 120, 120, 120, 70, 122, 122, 122, 131, 131, 240, 239, 238, 236, 235, 234, 229, 228, 227, 226, 225, 120, 254, 254, 254, 254, 255, 255, 255, 255, 256, 256, 257, 221, 257, 257, 220, 217, 215, 214, 212, 211, 210, 209, 208, 207, 206, 205, 204, 203, 200, 199, 198, 194, 192, 191, 190, 189, 186, 185, 184, 183, 182, 181, 180, 179, 177, 176, 175, 174, 173, 172, 171, 168, 167, 166, 165, 163, 162, 161, 159, 158, 156, 155, 154, 153, 152, 151, 150, 149, 148, 147, 146, 145, 144, 142, 141, 140, 139, 137, 136, 135, 134, 133, 132, 130, 129, 128, 127, 126, 116, 115, 114, 113, 112, 111, 110, 109, 108, 107, 106, 105, 103, 102, 101, 100, 97, 95, 94, 93, 92, 91, 90, 88, 87, 86, 85, 84, 83, 82, 79, 75, 61, 55, 46, 41, 39, 32, 30, 24, 13, 8, 6, 3, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253, 253];
  var pratt = null;
  var nameToSymbolFlag = null;
  var symbolFlagToName = null;
  Compiler.nativeLibrary = new CachedSource('\nimport class int { import string toString(); }\nimport class bool { import string toString(); }\nimport class float { import string toString(); }\nimport class double { import string toString(); }\n\nimport class string {\n  import int size();\n  import string slice(int start, int end);\n  import int indexOf(string value);\n  import int lastIndexOf(string value);\n  import string toLowerCase();\n  import string toUpperCase();\n  import static string fromCodeUnit(int value);\n  import string get(int index);\n  import string join(List<string> values);\n  import int codeUnitAt(int index);\n  import bool startsWith(string prefix);\n  import bool endsWith(string suffix);\n  import string repeat(int count);\n}\n\ninterface IComparison<T> {\n  virtual int compare(T left, T right);\n}\n\nimport class List<T> {\n  new();\n  import int size();\n  import void push(T value);\n  import void unshift(T value);\n  import List<T> slice(int start, int end);\n  import int indexOf(T value);\n  import int lastIndexOf(T value);\n  import T shift();\n  import T pop();\n  import void reverse();\n  import void sort(IComparison<T> comparison);\n  import List<T> clone();\n  import T remove(int index);\n  import void insert(int index, T value);\n  import T get(int index);\n  import void set(int index, T value);\n  import void swap(int a, int b);\n}\n\nclass StringMap<T> {\n  import T get(string key);\n  import T getOrDefault(string key, T defaultValue);\n  import void set(string key, T value);\n  import bool has(string key);\n  import void remove(string key);\n  import List<string> keys();\n  import List<T> values();\n  import StringMap<T> clone();\n}\n\nclass IntMap<T> {\n  import T get(int key);\n  import T getOrDefault(int key, T defaultValue);\n  import void set(int key, T value);\n  import bool has(int key);\n  import void remove(int key);\n  import List<int> keys();\n  import List<T> values();\n  import IntMap<T> clone();\n}\n');
  Compiler.nativeLibraryJS = new CachedSource('\nimport class int { import string toString(); }\nimport class bool { import string toString(); }\nimport class float { import string toString(); }\nimport class double { import string toString(); }\n\nimport class String {\n  import static string fromCharCode(int value);\n}\n\nimport class Object {\n  import static Object create(Object prototype);\n}\n\nimport namespace operators {\n  import void delete(int value);\n  import void sort<T>(List<T> list, IComparison<T> comparison);\n}\n\nimport class string {\n  inline int size() { return untyped(this).length; }\n  import string slice(int start, int end);\n  import int indexOf(string value);\n  import int lastIndexOf(string value);\n  import string toLowerCase();\n  import string toUpperCase();\n  inline static string fromCodeUnit(int value) { return String.fromCharCode(value); }\n  inline string get(int index) { return untyped(this)[index]; }\n  inline string join(List<string> values) { return untyped(values).join(this); }\n  inline int codeUnitAt(int index) { return untyped(this).charCodeAt(index); }\n  bool startsWith(string prefix) { return size() >= prefix.size() && slice(0, prefix.size()) == prefix; }\n  bool endsWith(string suffix) { return size() >= suffix.size() && slice(size() - suffix.size(), size()) == suffix; }\n  string repeat(int count) { var result = ""; for (var i = 0; i < count; i++) result += this; return result; }\n}\n\nexport interface IComparison<T> {\n  export virtual int compare(T left, T right);\n}\n\nimport class List<T> {\n  new();\n  inline int size() { return untyped(this).length; }\n  import void push(T value);\n  import void unshift(T value);\n  import List<T> slice(int start, int end);\n  import int indexOf(T value);\n  import int lastIndexOf(T value);\n  import T shift();\n  import T pop();\n  import void reverse();\n  inline void sort(IComparison<T> comparison) { operators.sort<T>(this, comparison); }\n  inline List<T> clone() { return untyped(this).slice(); }\n  inline T remove(int index) { return untyped(this).splice(index, 1)[0]; }\n  inline void insert(int index, T value) { untyped(this).splice(index, 0, value); }\n  inline T get(int index) { return untyped(this)[index]; }\n  inline void set(int index, T value) { untyped(this)[index] = value; }\n  inline void swap(int a, int b) { var temp = get(a); set(a, get(b)); set(b, temp); }\n}\n\nclass StringMap<T> {\n  Object table = Object.create(null);\n  inline T get(string key) { return untyped(table)[key]; }\n  inline T getOrDefault(string key, T defaultValue) { return untyped(table)[key] || defaultValue; }\n  inline void set(string key, T value) { untyped(table)[key] = value; }\n  inline bool has(string key) { return key in untyped(table); }\n  inline void remove(string key) { operators.delete(untyped(table)[key]); }\n\n  List<string> keys() {\n    List<string> keys = [];\n    for (string key in untyped(table)) keys.push(key);\n    return keys;\n  }\n\n  List<T> values() {\n    List<T> values = [];\n    for (string key in untyped(table)) values.push(get(key));\n    return values;\n  }\n\n  StringMap<T> clone() {\n    var clone = StringMap<T>();\n    for (string key in untyped(table)) clone.set(key, get(key));\n    return clone;\n  }\n}\n\nclass IntMap<T> {\n  Object table = Object.create(null);\n  inline T get(int key) { return untyped(table)[key]; }\n  inline T getOrDefault(int key, T defaultValue) { return untyped(table)[key] || defaultValue; }\n  inline void set(int key, T value) { untyped(table)[key] = value; }\n  inline bool has(int key) { return key in untyped(table); }\n  inline void remove(int key) { operators.delete(untyped(table)[key]); }\n\n  List<int> keys() {\n    List<int> keys = [];\n    for (double key in untyped(table)) keys.push((int)key);\n    return keys;\n  }\n\n  List<T> values() {\n    List<T> values = [];\n    for (int key in untyped(table)) values.push(get(key));\n    return values;\n  }\n\n  IntMap<T> clone() {\n    var clone = IntMap<T>();\n    for (int key in untyped(table)) clone.set(key, get(key));\n    return clone;\n  }\n}\n');
  Compiler.nativeLibraryCPP = new CachedSource('\nimport void cpp_toString();\n\nimport class int {\n  inline string toString() { return untyped(cpp_toString)(this); }\n}\nimport class bool {\n  inline string toString() { return untyped(cpp_toString)(this); }\n}\nimport class float {\n  inline string toString() { return untyped(cpp_toString)(this); }\n}\nimport class double {\n  inline string toString() { return untyped(cpp_toString)(this); }\n}\n\nimport class string {\n  import int size();\n  import string slice(int start, int end);\n  import int indexOf(string value);\n  import int lastIndexOf(string value);\n  import string toLowerCase();\n  import string toUpperCase();\n  import static string fromCodeUnit(int value);\n  import string get(int index);\n  import int codeUnitAt(int index);\n  string join(List<string> values) { var result = ""; for (var i = 0; i < values.size(); i++) { if (i > 0) result += this; result += values.get(i); } return result; }\n  bool startsWith(string prefix) { return size() >= prefix.size() && slice(0, prefix.size()) == prefix; }\n  bool endsWith(string suffix) { return size() >= suffix.size() && slice(size() - suffix.size(), size()) == suffix; }\n  string repeat(int count) { var result = ""; for (var i = 0; i < count; i++) result += this; return result; }\n}\n\nexport interface IComparison<T> {\n  export virtual int compare(T left, T right);\n}\n\nimport class List<T> {\n  new();\n  import int size();\n  import void push(T value);\n  import void unshift(T value);\n  import List<T> slice(int start, int end);\n  import int indexOf(T value);\n  import int lastIndexOf(T value);\n  import T shift();\n  import T pop();\n  import void reverse();\n  import void sort(IComparison<T> comparison);\n  import List<T> clone();\n  import T remove(int index);\n  import void insert(int index, T value);\n  import T get(int index);\n  import void set(int index, T value);\n  import void swap(int a, int b);\n}\n\nimport class StringMap<T> {\n  new();\n  import T get(string key);\n  import T getOrDefault(string key, T defaultValue);\n  import void set(string key, T value);\n  import bool has(string key);\n  import void remove(string key);\n  import List<string> keys();\n  import List<T> values();\n  import StringMap<T> clone();\n}\n\nimport class IntMap<T> {\n  new();\n  import T get(int key);\n  import T getOrDefault(int key, T defaultValue);\n  import void set(int key, T value);\n  import bool has(int key);\n  import void remove(int key);\n  import List<int> keys();\n  import List<T> values();\n  import IntMap<T> clone();\n}\n');
  Range.EMPTY = new Range(null, 0, 0);
  ByteSize.KB = 1024;
  ByteSize.MB = 1048576;
  ByteSize.GB = 1073741824;
  in_io.Color.DEFAULT = 0;
  in_io.Color.BOLD = 1;
  in_io.Color.GRAY = 90;
  in_io.Color.RED = 91;
  in_io.Color.GREEN = 92;
  in_io.Color.MAGENTA = 95;
  js.Emitter.isKeyword = null;
  SourceMapGenerator.comparison = new SourceMappingComparison();
  Resolver.comparison = new MemberRangeComparison();
  SymbolFlag.INITIALIZE_MASK = 49152;
  SymbolFlag.KEYWORD_MASK = 14311;
  Symbol.nextUniqueID = -1;
  Type.nextUniqueID = -1;
}());
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
