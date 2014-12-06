(function() {
  var $imul = Math.imul || function(a, b) {
    var ah = a >>> 16, al = a & 65535, bh = b >>> 16, bl = b & 65535;
    return al * bl + (ah * bl + al * bh << 16) | 0;
  };
  function $extends(derived, base) {
    derived.prototype = Object.create(base.prototype);
    derived.prototype.constructor = derived;
  }
  function StringMap() {
    this._table = Object.create(null);
  }
  StringMap.prototype.getOrDefault = function(key, defaultValue) {
    return key in this._table ? this._table[key] : defaultValue;
  };
  StringMap.prototype.values = function() {
    var values = [];
    for (var key in this._table) {
      values.push(this._table[key]);
    }
    return values;
  };
  StringMap.prototype.clone = function() {
    var clone = new StringMap();
    for (var key in this._table) {
      clone._table[key] = this._table[key];
    }
    return clone;
  };
  function IntMap() {
    this._table = Object.create(null);
  }
  IntMap.prototype.getOrDefault = function(key, defaultValue) {
    return key in this._table ? this._table[key] : defaultValue;
  };
  IntMap.prototype.values = function() {
    var values = [];
    for (var key in this._table) {
      values.push(this._table[key]);
    }
    return values;
  };
  var math = {};
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
  Node.createModifier = function(name, $arguments, statements) {
    if (name.kind !== NodeKind.NAME) {
      throw new Error('assert name.kind == .NAME; (src/ast/create.sk:183:5)');
    }
    if ($arguments !== null && !checkAllNodeKinds($arguments, new NodeKindIsExpression())) {
      throw new Error('assert arguments == null || checkAllNodeKinds(arguments, NodeKindIsExpression()); (src/ast/create.sk:184:5)');
    }
    if (!checkAllNodeKinds(statements, new NodeKindIsStatement())) {
      throw new Error('assert checkAllNodeKinds(statements, NodeKindIsStatement()); (src/ast/create.sk:185:5)');
    }
    statements.unshift($arguments !== null ? Node.createNodeList($arguments) : null);
    statements.unshift(name);
    return new Node(NodeKind.MODIFIER).withChildren(statements);
  };
  Node.createSwitch = function(value, cases) {
    if (!in_NodeKind.isExpression(value.kind)) {
      throw new Error('assert value.kind.isExpression(); (src/ast/create.sk:192:5)');
    }
    if (!checkAllNodeKinds(cases, new NodeKindIs(NodeKind.CASE))) {
      throw new Error('assert checkAllNodeKinds(cases, NodeKindIs(.CASE)); (src/ast/create.sk:193:5)');
    }
    cases.unshift(value);
    return new Node(NodeKind.SWITCH).withChildren(cases);
  };
  Node.createName = function(name) {
    return new Node(NodeKind.NAME).withContent(new StringContent(name));
  };
  Node.createType = function(type) {
    if (type === null) {
      throw new Error('assert type != null; (src/ast/create.sk:203:5)');
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
      throw new Error('assert test.kind.isExpression(); (src/ast/create.sk:216:5)');
    }
    if (!in_NodeKind.isExpression(trueNode.kind)) {
      throw new Error('assert trueNode.kind.isExpression(); (src/ast/create.sk:217:5)');
    }
    if (!in_NodeKind.isExpression(falseNode.kind)) {
      throw new Error('assert falseNode.kind.isExpression(); (src/ast/create.sk:218:5)');
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
      throw new Error('assert checkAllNodeKinds(values, NodeKindIsExpression()); (src/ast/create.sk:243:5)');
    }
    return new Node(NodeKind.LIST).withChildren(values);
  };
  Node.createDot = function(value, name) {
    if (value !== null && !in_NodeKind.isExpression(value.kind)) {
      throw new Error('assert value == null || value.kind.isExpression(); (src/ast/create.sk:248:5)');
    }
    if (name !== null && name.kind !== NodeKind.NAME) {
      throw new Error('assert name == null || name.kind == .NAME; (src/ast/create.sk:249:5)');
    }
    return new Node(NodeKind.DOT).withChildren([value, name]);
  };
  Node.createDotWithKind = function(kind, value, name) {
    if (!in_NodeKind.isDot(kind)) {
      throw new Error('assert kind.isDot(); (src/ast/create.sk:254:5)');
    }
    if (value !== null && !in_NodeKind.isExpression(value.kind)) {
      throw new Error('assert value == null || value.kind.isExpression(); (src/ast/create.sk:255:5)');
    }
    if (name !== null && name.kind !== NodeKind.NAME && (name.kind !== NodeKind.QUOTED || name.quotedValue().kind !== NodeKind.NAME)) {
      throw new Error('assert name == null || name.kind == .NAME || name.kind == .QUOTED && name.quotedValue().kind == .NAME; (src/ast/create.sk:256:5)');
    }
    return new Node(kind).withChildren([value, name]);
  };
  Node.createCall = function(value, $arguments) {
    if (!in_NodeKind.isExpression(value.kind)) {
      throw new Error('assert value.kind.isExpression(); (src/ast/create.sk:261:5)');
    }
    if (!checkAllNodeKinds($arguments, new NodeKindIsExpression())) {
      throw new Error('assert checkAllNodeKinds(arguments, NodeKindIsExpression()); (src/ast/create.sk:262:5)');
    }
    $arguments.unshift(value);
    return new Node(NodeKind.CALL).withChildren($arguments);
  };
  Node.createSuperCall = function($arguments) {
    if (!checkAllNodeKinds($arguments, new NodeKindIsExpression())) {
      throw new Error('assert checkAllNodeKinds(arguments, NodeKindIsExpression()); (src/ast/create.sk:268:5)');
    }
    return new Node(NodeKind.SUPER_CALL).withChildren($arguments);
  };
  Node.createError = function() {
    return new Node(NodeKind.ERROR);
  };
  Node.createSequence = function(values) {
    if (!checkAllNodeKinds(values, new NodeKindIsExpression())) {
      throw new Error('assert checkAllNodeKinds(values, NodeKindIsExpression()); (src/ast/create.sk:280:5)');
    }
    return new Node(NodeKind.SEQUENCE).withChildren(values);
  };
  Node.createParameterize = function(type, types) {
    if (!in_NodeKind.isExpression(type.kind)) {
      throw new Error('assert type.kind.isExpression(); (src/ast/create.sk:285:5)');
    }
    if (!checkAllNodeKinds(types, new NodeKindIsExpression())) {
      throw new Error('assert checkAllNodeKinds(types, NodeKindIsExpression()); (src/ast/create.sk:286:5)');
    }
    types.unshift(type);
    return new Node(NodeKind.PARAMETERIZE).withChildren(types);
  };
  Node.createCast = function(type, value) {
    if (!in_NodeKind.isExpression(type.kind)) {
      throw new Error('assert type.kind.isExpression(); (src/ast/create.sk:292:5)');
    }
    if (!in_NodeKind.isExpression(value.kind)) {
      throw new Error('assert value.kind.isExpression(); (src/ast/create.sk:293:5)');
    }
    return new Node(NodeKind.CAST).withChildren([type, value]);
  };
  Node.createImplicitCast = function(type, value) {
    if (!in_NodeKind.isExpression(type.kind)) {
      throw new Error('assert type.kind.isExpression(); (src/ast/create.sk:298:5)');
    }
    if (!in_NodeKind.isExpression(value.kind)) {
      throw new Error('assert value.kind.isExpression(); (src/ast/create.sk:299:5)');
    }
    return new Node(NodeKind.IMPLICIT_CAST).withChildren([type, value]);
  };
  Node.createQuoted = function(value) {
    if (!in_NodeKind.isExpression(value.kind)) {
      throw new Error('assert value.kind.isExpression(); (src/ast/create.sk:304:5)');
    }
    return new Node(NodeKind.QUOTED).withChildren([value]);
  };
  Node.createVar = function() {
    return new Node(NodeKind.VAR);
  };
  Node.createUnary = function(kind, value) {
    if (!in_NodeKind.isUnaryOperator(kind)) {
      throw new Error('assert kind.isUnaryOperator(); (src/ast/create.sk:313:5)');
    }
    if (!in_NodeKind.isExpression(value.kind)) {
      throw new Error('assert value.kind.isExpression(); (src/ast/create.sk:314:5)');
    }
    return new Node(kind).withChildren([value]);
  };
  Node.createBinary = function(kind, left, right) {
    if (!in_NodeKind.isBinaryOperator(kind)) {
      throw new Error('assert kind.isBinaryOperator(); (src/ast/create.sk:323:5)');
    }
    if (!in_NodeKind.isExpression(left.kind)) {
      throw new Error('assert left.kind.isExpression(); (src/ast/create.sk:324:5)');
    }
    if (!in_NodeKind.isExpression(right.kind)) {
      throw new Error('assert right.kind.isExpression(); (src/ast/create.sk:325:5)');
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
      throw new Error('assert kind.isTernaryOperator(); (src/ast/create.sk:338:5)');
    }
    if (!in_NodeKind.isExpression(left.kind)) {
      throw new Error('assert left.kind.isExpression(); (src/ast/create.sk:339:5)');
    }
    if (!in_NodeKind.isExpression(middle.kind)) {
      throw new Error('assert middle.kind.isExpression(); (src/ast/create.sk:340:5)');
    }
    if (!in_NodeKind.isExpression(right.kind)) {
      throw new Error('assert right.kind.isExpression(); (src/ast/create.sk:341:5)');
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
    if (!in_NodeKind.isDot(this.kind)) {
      throw new Error('assert kind.isDot(); (src/ast/get.sk:21:5)');
    }
    if (this.children.length !== 2) {
      throw new Error('assert children.size() == 2; (src/ast/get.sk:22:5)');
    }
    return this.children[0];
  };
  Node.prototype.dotName = function() {
    if (!in_NodeKind.isDot(this.kind)) {
      throw new Error('assert kind.isDot(); (src/ast/get.sk:27:5)');
    }
    if (this.children.length !== 2) {
      throw new Error('assert children.size() == 2; (src/ast/get.sk:28:5)');
    }
    if (this.children[1] !== null && this.children[1].kind !== NodeKind.NAME && (this.children[1].kind !== NodeKind.QUOTED || this.children[1].quotedValue().kind !== NodeKind.NAME)) {
      throw new Error('assert children[1] == null || children[1].kind == .NAME || children[1].kind == .QUOTED && children[1].quotedValue().kind == .NAME; (src/ast/get.sk:29:5)');
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
      throw new Error('assert children[0] == null || children[0].kind == .NAME; (src/ast/get.sk:90:5)');
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
      throw new Error('assert children[1].kind == .BLOCK; (src/ast/get.sk:97:5)');
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
    if (!(this.children.length >= 2)) {
      throw new Error('assert children.size() >= 2; (src/ast/get.sk:139:5)');
    }
    if (this.children[0].kind !== NodeKind.NAME) {
      throw new Error('assert children[0].kind == .NAME; (src/ast/get.sk:140:5)');
    }
    return this.children[0];
  };
  Node.prototype.modifierArguments = function() {
    if (this.kind !== NodeKind.MODIFIER) {
      throw new Error('assert kind == .MODIFIER; (src/ast/get.sk:145:5)');
    }
    if (!(this.children.length >= 2)) {
      throw new Error('assert children.size() >= 2; (src/ast/get.sk:146:5)');
    }
    if (this.children[1] !== null && this.children[1].kind !== NodeKind.NODE_LIST) {
      throw new Error('assert children[1] == null || children[1].kind == .NODE_LIST; (src/ast/get.sk:147:5)');
    }
    return this.children[1];
  };
  Node.prototype.modifierStatements = function() {
    if (this.kind !== NodeKind.MODIFIER) {
      throw new Error('assert kind == .MODIFIER; (src/ast/get.sk:152:5)');
    }
    if (!(this.children.length >= 2)) {
      throw new Error('assert children.size() >= 2; (src/ast/get.sk:153:5)');
    }
    return this.children.slice(2, this.children.length);
  };
  Node.prototype.sequenceValues = function() {
    if (this.kind !== NodeKind.SEQUENCE) {
      throw new Error('assert kind == .SEQUENCE; (src/ast/get.sk:158:5)');
    }
    if (this.children === null) {
      throw new Error('assert children != null; (src/ast/get.sk:159:5)');
    }
    return this.children;
  };
  Node.prototype.castType = function() {
    if (!in_NodeKind.isCast(this.kind)) {
      throw new Error('assert kind.isCast(); (src/ast/get.sk:164:5)');
    }
    if (this.children.length !== 2) {
      throw new Error('assert children.size() == 2; (src/ast/get.sk:165:5)');
    }
    return this.children[0];
  };
  Node.prototype.castValue = function() {
    if (!in_NodeKind.isCast(this.kind)) {
      throw new Error('assert kind.isCast(); (src/ast/get.sk:170:5)');
    }
    if (this.children.length !== 2) {
      throw new Error('assert children.size() == 2; (src/ast/get.sk:171:5)');
    }
    return this.children[1];
  };
  Node.prototype.expressionValue = function() {
    if (this.kind !== NodeKind.EXPRESSION) {
      throw new Error('assert kind == .EXPRESSION; (src/ast/get.sk:176:5)');
    }
    if (this.children.length !== 1) {
      throw new Error('assert children.size() == 1; (src/ast/get.sk:177:5)');
    }
    return this.children[0];
  };
  Node.prototype.ifTest = function() {
    if (this.kind !== NodeKind.IF) {
      throw new Error('assert kind == .IF; (src/ast/get.sk:182:5)');
    }
    if (this.children.length !== 3) {
      throw new Error('assert children.size() == 3; (src/ast/get.sk:183:5)');
    }
    return this.children[0];
  };
  Node.prototype.ifTrue = function() {
    if (this.kind !== NodeKind.IF) {
      throw new Error('assert kind == .IF; (src/ast/get.sk:188:5)');
    }
    if (this.children.length !== 3) {
      throw new Error('assert children.size() == 3; (src/ast/get.sk:189:5)');
    }
    if (this.children[1] !== null && this.children[1].kind !== NodeKind.BLOCK) {
      throw new Error('assert children[1] == null || children[1].kind == .BLOCK; (src/ast/get.sk:190:5)');
    }
    return this.children[1];
  };
  Node.prototype.ifFalse = function() {
    if (this.kind !== NodeKind.IF) {
      throw new Error('assert kind == .IF; (src/ast/get.sk:195:5)');
    }
    if (this.children.length !== 3) {
      throw new Error('assert children.size() == 3; (src/ast/get.sk:196:5)');
    }
    if (this.children[2] !== null && this.children[2].kind !== NodeKind.BLOCK) {
      throw new Error('assert children[2] == null || children[2].kind == .BLOCK; (src/ast/get.sk:197:5)');
    }
    return this.children[2];
  };
  Node.prototype.forSetup = function() {
    if (this.kind !== NodeKind.FOR) {
      throw new Error('assert kind == .FOR; (src/ast/get.sk:202:5)');
    }
    if (this.children.length !== 4) {
      throw new Error('assert children.size() == 4; (src/ast/get.sk:203:5)');
    }
    return this.children[0];
  };
  Node.prototype.forTest = function() {
    if (this.kind !== NodeKind.FOR) {
      throw new Error('assert kind == .FOR; (src/ast/get.sk:208:5)');
    }
    if (this.children.length !== 4) {
      throw new Error('assert children.size() == 4; (src/ast/get.sk:209:5)');
    }
    return this.children[1];
  };
  Node.prototype.forUpdate = function() {
    if (this.kind !== NodeKind.FOR) {
      throw new Error('assert kind == .FOR; (src/ast/get.sk:214:5)');
    }
    if (this.children.length !== 4) {
      throw new Error('assert children.size() == 4; (src/ast/get.sk:215:5)');
    }
    return this.children[2];
  };
  Node.prototype.forBlock = function() {
    if (this.kind !== NodeKind.FOR) {
      throw new Error('assert kind == .FOR; (src/ast/get.sk:220:5)');
    }
    if (this.children.length !== 4) {
      throw new Error('assert children.size() == 4; (src/ast/get.sk:221:5)');
    }
    if (this.children[3].kind !== NodeKind.BLOCK) {
      throw new Error('assert children[3].kind == .BLOCK; (src/ast/get.sk:222:5)');
    }
    return this.children[3];
  };
  Node.prototype.forEachVariable = function() {
    if (this.kind !== NodeKind.FOR_EACH) {
      throw new Error('assert kind == .FOR_EACH; (src/ast/get.sk:227:5)');
    }
    if (this.children.length !== 3) {
      throw new Error('assert children.size() == 3; (src/ast/get.sk:228:5)');
    }
    if (this.children[0].kind !== NodeKind.VARIABLE) {
      throw new Error('assert children[0].kind == .VARIABLE; (src/ast/get.sk:229:5)');
    }
    return this.children[0];
  };
  Node.prototype.forEachValue = function() {
    if (this.kind !== NodeKind.FOR_EACH) {
      throw new Error('assert kind == .FOR_EACH; (src/ast/get.sk:234:5)');
    }
    if (this.children.length !== 3) {
      throw new Error('assert children.size() == 3; (src/ast/get.sk:235:5)');
    }
    return this.children[1];
  };
  Node.prototype.forEachBlock = function() {
    if (this.kind !== NodeKind.FOR_EACH) {
      throw new Error('assert kind == .FOR_EACH; (src/ast/get.sk:240:5)');
    }
    if (this.children.length !== 3) {
      throw new Error('assert children.size() == 3; (src/ast/get.sk:241:5)');
    }
    if (this.children[2].kind !== NodeKind.BLOCK) {
      throw new Error('assert children[2].kind == .BLOCK; (src/ast/get.sk:242:5)');
    }
    return this.children[2];
  };
  Node.prototype.whileTest = function() {
    if (this.kind !== NodeKind.WHILE && this.kind !== NodeKind.DO_WHILE) {
      throw new Error('assert kind == .WHILE || kind == .DO_WHILE; (src/ast/get.sk:247:5)');
    }
    if (this.children.length !== 2) {
      throw new Error('assert children.size() == 2; (src/ast/get.sk:248:5)');
    }
    return this.children[0];
  };
  Node.prototype.whileBlock = function() {
    if (this.kind !== NodeKind.WHILE && this.kind !== NodeKind.DO_WHILE) {
      throw new Error('assert kind == .WHILE || kind == .DO_WHILE; (src/ast/get.sk:253:5)');
    }
    if (this.children.length !== 2) {
      throw new Error('assert children.size() == 2; (src/ast/get.sk:254:5)');
    }
    if (this.children[1].kind !== NodeKind.BLOCK) {
      throw new Error('assert children[1].kind == .BLOCK; (src/ast/get.sk:255:5)');
    }
    return this.children[1];
  };
  Node.prototype.quotedValue = function() {
    if (this.kind !== NodeKind.QUOTED) {
      throw new Error('assert kind == .QUOTED; (src/ast/get.sk:260:5)');
    }
    if (this.children.length !== 1) {
      throw new Error('assert children.size() == 1; (src/ast/get.sk:261:5)');
    }
    return this.children[0];
  };
  Node.prototype.baseTypes = function() {
    if (!in_NodeKind.isObject(this.kind) && this.kind !== NodeKind.EXTENSION) {
      throw new Error('assert kind.isObject() || kind == .EXTENSION; (src/ast/get.sk:266:5)');
    }
    if (!(this.children.length >= 3)) {
      throw new Error('assert children.size() >= 3; (src/ast/get.sk:267:5)');
    }
    if (this.children[2] !== null && this.children[2].kind !== NodeKind.NODE_LIST) {
      throw new Error('assert children[2] == null || children[2].kind == .NODE_LIST; (src/ast/get.sk:268:5)');
    }
    return this.children[2];
  };
  Node.prototype.objectParameters = function() {
    if (!in_NodeKind.isObject(this.kind)) {
      throw new Error('assert kind.isObject(); (src/ast/get.sk:273:5)');
    }
    if (this.children.length !== 4) {
      throw new Error('assert children.size() == 4; (src/ast/get.sk:274:5)');
    }
    if (this.children[3] !== null && this.children[3].kind !== NodeKind.NODE_LIST) {
      throw new Error('assert children[3] == null || children[3].kind == .NODE_LIST; (src/ast/get.sk:275:5)');
    }
    return this.children[3];
  };
  Node.prototype.functionArguments = function() {
    if (!in_NodeKind.isFunction(this.kind)) {
      throw new Error('assert kind.isFunction(); (src/ast/get.sk:280:5)');
    }
    if (this.children.length !== 5) {
      throw new Error('assert children.size() == 5; (src/ast/get.sk:281:5)');
    }
    if (this.children[1].kind !== NodeKind.NODE_LIST) {
      throw new Error('assert children[1].kind == .NODE_LIST; (src/ast/get.sk:282:5)');
    }
    return this.children[1];
  };
  Node.prototype.functionBlock = function() {
    if (!in_NodeKind.isFunction(this.kind)) {
      throw new Error('assert kind.isFunction(); (src/ast/get.sk:287:5)');
    }
    if (this.children.length !== 5) {
      throw new Error('assert children.size() == 5; (src/ast/get.sk:288:5)');
    }
    if (this.children[2] !== null && this.children[2].kind !== NodeKind.BLOCK) {
      throw new Error('assert children[2] == null || children[2].kind == .BLOCK; (src/ast/get.sk:289:5)');
    }
    return this.children[2];
  };
  Node.prototype.functionResult = function() {
    if (this.kind !== NodeKind.FUNCTION) {
      throw new Error('assert kind == .FUNCTION; (src/ast/get.sk:294:5)');
    }
    if (this.children.length !== 5) {
      throw new Error('assert children.size() == 5; (src/ast/get.sk:295:5)');
    }
    return this.children[3];
  };
  Node.prototype.functionParameters = function() {
    if (this.kind !== NodeKind.FUNCTION) {
      throw new Error('assert kind == .FUNCTION; (src/ast/get.sk:300:5)');
    }
    if (this.children.length !== 5) {
      throw new Error('assert children.size() == 5; (src/ast/get.sk:301:5)');
    }
    return this.children[4];
  };
  Node.prototype.superInitializer = function() {
    if (this.kind !== NodeKind.CONSTRUCTOR) {
      throw new Error('assert kind == .CONSTRUCTOR; (src/ast/get.sk:306:5)');
    }
    if (this.children.length !== 5) {
      throw new Error('assert children.size() == 5; (src/ast/get.sk:307:5)');
    }
    return this.children[3];
  };
  Node.prototype.memberInitializers = function() {
    if (this.kind !== NodeKind.CONSTRUCTOR) {
      throw new Error('assert kind == .CONSTRUCTOR; (src/ast/get.sk:312:5)');
    }
    if (this.children.length !== 5) {
      throw new Error('assert children.size() == 5; (src/ast/get.sk:313:5)');
    }
    return this.children[4];
  };
  Node.prototype.memberInitializerName = function() {
    if (this.kind !== NodeKind.MEMBER_INITIALIZER) {
      throw new Error('assert kind == .MEMBER_INITIALIZER; (src/ast/get.sk:318:5)');
    }
    if (this.children.length !== 2) {
      throw new Error('assert children.size() == 2; (src/ast/get.sk:319:5)');
    }
    return this.children[0];
  };
  Node.prototype.memberInitializerValue = function() {
    if (this.kind !== NodeKind.MEMBER_INITIALIZER) {
      throw new Error('assert kind == .MEMBER_INITIALIZER; (src/ast/get.sk:324:5)');
    }
    if (this.children.length !== 2) {
      throw new Error('assert children.size() == 2; (src/ast/get.sk:325:5)');
    }
    return this.children[1];
  };
  Node.prototype.assertValue = function() {
    if (!in_NodeKind.isAssert(this.kind)) {
      throw new Error('assert kind.isAssert(); (src/ast/get.sk:330:5)');
    }
    if (this.children.length !== 1) {
      throw new Error('assert children.size() == 1; (src/ast/get.sk:331:5)');
    }
    return this.children[0];
  };
  Node.prototype.parameterizeValue = function() {
    if (this.kind !== NodeKind.PARAMETERIZE) {
      throw new Error('assert kind == .PARAMETERIZE; (src/ast/get.sk:336:5)');
    }
    if (!(this.children.length >= 1)) {
      throw new Error('assert children.size() >= 1; (src/ast/get.sk:337:5)');
    }
    return this.children[0];
  };
  Node.prototype.parameterizeTypes = function() {
    if (this.kind !== NodeKind.PARAMETERIZE) {
      throw new Error('assert kind == .PARAMETERIZE; (src/ast/get.sk:342:5)');
    }
    if (!(this.children.length >= 1)) {
      throw new Error('assert children.size() >= 1; (src/ast/get.sk:343:5)');
    }
    return this.children.slice(1, this.children.length);
  };
  Node.prototype.callValue = function() {
    if (this.kind !== NodeKind.CALL) {
      throw new Error('assert kind == .CALL; (src/ast/get.sk:348:5)');
    }
    if (!(this.children.length >= 1)) {
      throw new Error('assert children.size() >= 1; (src/ast/get.sk:349:5)');
    }
    return this.children[0];
  };
  Node.prototype.callArguments = function() {
    if (this.kind !== NodeKind.CALL) {
      throw new Error('assert kind == .CALL; (src/ast/get.sk:354:5)');
    }
    if (!(this.children.length >= 1)) {
      throw new Error('assert children.size() >= 1; (src/ast/get.sk:355:5)');
    }
    return this.children.slice(1, this.children.length);
  };
  Node.prototype.superCallArguments = function() {
    if (this.kind !== NodeKind.SUPER_CALL) {
      throw new Error('assert kind == .SUPER_CALL; (src/ast/get.sk:360:5)');
    }
    return this.children;
  };
  Node.prototype.listValues = function() {
    if (this.kind !== NodeKind.LIST) {
      throw new Error('assert kind == .LIST; (src/ast/get.sk:365:5)');
    }
    return this.children;
  };
  Node.prototype.parameterBound = function() {
    if (this.kind !== NodeKind.PARAMETER) {
      throw new Error('assert kind == .PARAMETER; (src/ast/get.sk:370:5)');
    }
    if (this.children.length !== 2) {
      throw new Error('assert children.size() == 2; (src/ast/get.sk:371:5)');
    }
    return this.children[1];
  };
  Node.prototype.returnValue = function() {
    if (this.kind !== NodeKind.RETURN) {
      throw new Error('assert kind == .RETURN; (src/ast/get.sk:376:5)');
    }
    if (this.children.length !== 1) {
      throw new Error('assert children.size() == 1; (src/ast/get.sk:377:5)');
    }
    return this.children[0];
  };
  Node.prototype.switchValue = function() {
    if (this.kind !== NodeKind.SWITCH) {
      throw new Error('assert kind == .SWITCH; (src/ast/get.sk:382:5)');
    }
    if (!(this.children.length >= 1)) {
      throw new Error('assert children.size() >= 1; (src/ast/get.sk:383:5)');
    }
    return this.children[0];
  };
  Node.prototype.switchCases = function() {
    if (this.kind !== NodeKind.SWITCH) {
      throw new Error('assert kind == .SWITCH; (src/ast/get.sk:388:5)');
    }
    if (!(this.children.length >= 1)) {
      throw new Error('assert children.size() >= 1; (src/ast/get.sk:389:5)');
    }
    return this.children.slice(1, this.children.length);
  };
  Node.prototype.caseValues = function() {
    if (this.kind !== NodeKind.CASE) {
      throw new Error('assert kind == .CASE; (src/ast/get.sk:394:5)');
    }
    if (!(this.children.length >= 1)) {
      throw new Error('assert children.size() >= 1; (src/ast/get.sk:395:5)');
    }
    return this.children.slice(0, this.children.length - 1 | 0);
  };
  Node.prototype.caseBlock = function() {
    if (this.kind !== NodeKind.CASE) {
      throw new Error('assert kind == .CASE; (src/ast/get.sk:400:5)');
    }
    if (!(this.children.length >= 1)) {
      throw new Error('assert children.size() >= 1; (src/ast/get.sk:401:5)');
    }
    if (this.lastChild().kind !== NodeKind.BLOCK) {
      throw new Error('assert lastChild().kind == .BLOCK; (src/ast/get.sk:402:5)');
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
    case 55:
      this.become(this.unaryValue().remove());
      return;
    case 75:
      this.kind = NodeKind.NOT_EQUAL;
      return;
    case 85:
      this.kind = NodeKind.EQUAL;
      return;
    case 83:
      this.kind = NodeKind.LOGICAL_AND;
      this.binaryLeft().invertBooleanCondition(cache);
      this.binaryRight().invertBooleanCondition(cache);
      return;
    case 82:
      this.kind = NodeKind.LOGICAL_OR;
      this.binaryLeft().invertBooleanCondition(cache);
      this.binaryRight().invertBooleanCondition(cache);
      return;
    case 80:
    case 76:
    case 81:
    case 77:
      var commonType = cache.commonImplicitType(this.binaryLeft().type, this.binaryRight().type);
      if (commonType !== null && !commonType.isReal(cache)) {
        switch (this.kind) {
        case 80:
          this.kind = NodeKind.GREATER_THAN_OR_EQUAL;
          break;
        case 76:
          this.kind = NodeKind.LESS_THAN_OR_EQUAL;
          break;
        case 81:
          this.kind = NodeKind.GREATER_THAN;
          break;
        case 77:
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
    return this.kind === NodeKind.NAME && (!in_NodeKind.isDot(this.parent.kind) || this !== this.parent.dotName()) && (!in_NodeKind.isNamedDeclaration(this.parent.kind) || this !== this.parent.declarationName());
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
    case 51:
    case 52:
      return this.castValue().hasNoSideEffects();
    case 35:
      return this.hookTest().hasNoSideEffects() && this.hookTrue().hasNoSideEffects() && this.hookFalse().hasNoSideEffects();
    case 43:
      return this.dotTarget().hasNoSideEffects();
    case 53:
      return this.quotedValue().hasNoSideEffects();
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
      throw new Error('assert parent != null; (src/ast/node.sk:249:5)');
    }
    return this.parent.children.indexOf(this);
  };
  Node.prototype.appendChild = function(node) {
    this.insertChild(this.children === null ? 0 : this.children.length, node);
  };
  Node.prototype.appendChildren = function(nodes) {
    this.insertChildren(this.children === null ? 0 : this.children.length, nodes);
  };
  Node.prototype.insertSiblingAfter = function(node) {
    this.parent.insertChild(this.indexInParent() + 1 | 0, node);
  };
  Node.prototype.removeChildAtIndex = function(index) {
    if (index < 0 || !(index < this.children.length)) {
      throw new Error('assert index >= 0 && index < children.size(); (src/ast/node.sk:278:5)');
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
      throw new Error('assert children != null; (src/ast/node.sk:349:5)');
    }
    if (index < 0 || !(index <= this.children.length)) {
      throw new Error('assert index >= 0 && index <= children.size(); (src/ast/node.sk:350:5)');
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
      throw new Error('assert index >= 0 && index <= children.size(); (src/ast/node.sk:359:5)');
    }
    Node.updateParent(node, this);
    this.children.splice(index, 0, node);
  };
  Node.prototype.insertChildren = function(index, nodes) {
    if (this.children === null) {
      this.children = [];
    }
    if (index < 0 || !(index <= this.children.length)) {
      throw new Error('assert index >= 0 && index <= children.size(); (src/ast/node.sk:366:5)');
    }
    for (var i = 0; i < nodes.length; i = i + 1 | 0) {
      var node = nodes[i];
      Node.updateParent(node, this);
      this.children.splice(index, 0, node);
      index = index + 1 | 0;
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
      throw new Error('assert children == null; (src/ast/node.sk:412:5)');
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
        throw new Error('assert node.parent == null; (src/ast/node.sk:438:7)');
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
    DOT_ARROW: 44,
    DOT_COLON: 45,
    CALL: 46,
    SUPER_CALL: 47,
    ERROR: 48,
    SEQUENCE: 49,
    PARAMETERIZE: 50,
    CAST: 51,
    IMPLICIT_CAST: 52,
    QUOTED: 53,
    VAR: 54,
    NOT: 55,
    POSITIVE: 56,
    NEGATIVE: 57,
    COMPLEMENT: 58,
    PREFIX_INCREMENT: 59,
    PREFIX_DECREMENT: 60,
    POSTFIX_INCREMENT: 61,
    POSTFIX_DECREMENT: 62,
    NEW: 63,
    DELETE: 64,
    PREFIX_DEREFERENCE: 65,
    PREFIX_REFERENCE: 66,
    POSTFIX_DEREFERENCE: 67,
    POSTFIX_REFERENCE: 68,
    ADD: 69,
    BITWISE_AND: 70,
    BITWISE_OR: 71,
    BITWISE_XOR: 72,
    COMPARE: 73,
    DIVIDE: 74,
    EQUAL: 75,
    GREATER_THAN: 76,
    GREATER_THAN_OR_EQUAL: 77,
    IN: 78,
    INDEX: 79,
    LESS_THAN: 80,
    LESS_THAN_OR_EQUAL: 81,
    LOGICAL_AND: 82,
    LOGICAL_OR: 83,
    MULTIPLY: 84,
    NOT_EQUAL: 85,
    REMAINDER: 86,
    SHIFT_LEFT: 87,
    SHIFT_RIGHT: 88,
    SUBTRACT: 89,
    ASSIGN: 90,
    ASSIGN_ADD: 91,
    ASSIGN_BITWISE_AND: 92,
    ASSIGN_BITWISE_OR: 93,
    ASSIGN_BITWISE_XOR: 94,
    ASSIGN_DIVIDE: 95,
    ASSIGN_MULTIPLY: 96,
    ASSIGN_REMAINDER: 97,
    ASSIGN_SHIFT_LEFT: 98,
    ASSIGN_SHIFT_RIGHT: 99,
    ASSIGN_SUBTRACT: 100,
    ASSIGN_INDEX: 101
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
    this.typeSymbols.sort(bindCompare(SymbolComparison.INSTANCE));
    this.freeFunctionSymbols.sort(bindCompare(SymbolComparison.INSTANCE));
    this.freeVariableSymbols.sort(bindCompare(SymbolComparison.INSTANCE));
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
  CompilerResult = function(_0, _1, _2, _3, _4) {
    this.options = _0;
    this.outputs = _1;
    this.files = _2;
    this.program = _3;
    this.resolver = _4;
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
        throw new Error('assert program.children.size() > 0; (src/compiler/compiler.sk:57:7)');
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
    text += '\nTotal compile time: ' + formatNumber(this.totalTime + this.lineCountingTime) + 'ms';
    if (this.tokenizingTime > 0) {
      text += '\n  Tokenizing: ' + formatNumber(this.tokenizingTime) + 'ms';
    }
    if (this.parsingTime > 0) {
      text += '\n  Parsing: ' + formatNumber(this.parsingTime) + 'ms';
    }
    if (this.resolvingTime > 0) {
      text += '\n  Resolving: ' + formatNumber(this.resolvingTime) + 'ms';
    }
    if (optimizingTime > 0) {
      text += '\n  Optimizing: ' + formatNumber(optimizingTime) + 'ms';
      text += '\n    Building call graph: ' + formatNumber(this.callGraphTime) + 'ms';
      text += '\n    Instance to static: ' + formatNumber(this.instanceToStaticTime) + 'ms';
      text += '\n    Symbol motion: ' + formatNumber(this.symbolMotionTime) + 'ms';
      text += '\n    Function inlining: ' + formatNumber(this.functionInliningTime) + 'ms';
      text += '\n    Constant folding: ' + formatNumber(this.constantFoldingTime) + 'ms';
      text += '\n    Dead code removal: ' + formatNumber(this.deadCodeRemovalTime) + 'ms';
    }
    if (this.emitTime > 0) {
      text += '\n  Emit: ' + formatNumber(this.emitTime) + 'ms';
    }
    if (this.lineCountingTime > 0) {
      text += '\n  Counting lines: ' + formatNumber(this.lineCountingTime) + 'ms';
    }
    text += Compiler.sourceStatistics('Prepend', result.options.prepend);
    text += Compiler.sourceStatistics('Inputs', result.options.inputs);
    text += Compiler.sourceStatistics('Append', result.options.append);
    text += Compiler.sourceStatistics('Outputs', result.outputs);
    return text;
  };
  Compiler.prototype.compile = function(options) {
    var totalStart = now();
    var program = Node.createProgram([]);
    var outputs = [];
    var files = [];
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
      var file = this.processInput(program, options.inputs[i]);
      if (file !== null) {
        files.push(file);
      }
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
        throw new Error('assert false; (src/compiler/compiler.sk:197:19)');
        break;
      }
      if (emitter !== null) {
        var emitStart = now();
        outputs = emitter.emitProgram(program);
        this.emitTime += now() - emitStart;
      }
    }
    this.totalTime += now() - totalStart;
    return new CompilerResult(options, outputs, files, program, resolver);
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
        return file;
      }
    }
    return null;
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
  Log.prototype.error = function(range, text) {
    if (range.isEmpty()) {
      throw new Error('assert !range.isEmpty(); (src/core/log.sk:43:5)');
    }
    this.diagnostics.push(new Diagnostic(DiagnosticKind.ERROR, range, text));
    this.errorCount = this.errorCount + 1 | 0;
  };
  Log.prototype.warning = function(range, text) {
    if (range.isEmpty()) {
      throw new Error('assert !range.isEmpty(); (src/core/log.sk:49:5)');
    }
    this.diagnostics.push(new Diagnostic(DiagnosticKind.WARNING, range, text));
    this.warningCount = this.warningCount + 1 | 0;
  };
  Log.prototype.note = function(range, text) {
    if (range.isEmpty()) {
      throw new Error('assert !range.isEmpty(); (src/core/log.sk:55:5)');
    }
    var last = this.diagnostics[this.diagnostics.length - 1 | 0];
    last.noteRange = range;
    last.noteText = text;
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
  Range.inner = function(start, end) {
    if (start.source !== end.source) {
      throw new Error('assert start.source == end.source; (src/core/range.sk:87:5)');
    }
    if (start.end > end.start) {
      throw new Error('assert start.end <= end.start; (src/core/range.sk:88:5)');
    }
    return new Range(start.source, start.end, end.start);
  };
  Range.before = function(outer, inner) {
    if (outer.source !== inner.source) {
      throw new Error('assert outer.source == inner.source; (src/core/range.sk:93:5)');
    }
    if (outer.start > inner.start) {
      throw new Error('assert outer.start <= inner.start; (src/core/range.sk:94:5)');
    }
    if (outer.end < inner.end) {
      throw new Error('assert outer.end >= inner.end; (src/core/range.sk:95:5)');
    }
    return new Range(outer.source, outer.start, inner.start);
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
  function UnionFind(count) {
    this.parents = [];
    for (var i = 0; i < count; i = i + 1 | 0) {
      this.parents.push(i);
    }
  }
  UnionFind.prototype.allocate = function() {
    var index = this.parents.length;
    this.parents.push(index);
    return index;
  };
  UnionFind.prototype.union = function(left, right) {
    this.parents[this.find(left)] = this.find(right);
  };
  UnionFind.prototype.find = function(index) {
    if (index < 0 || !(index < this.parents.length)) {
      throw new Error('assert index >= 0 && index < parents.size(); (src/core/support.sk:29:5)');
    }
    var parent = this.parents[index];
    if (parent !== index) {
      parent = this.find(parent);
      this.parents[index] = parent;
    }
    return parent;
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
  var base = {};
  base.Emitter = function(_0) {
    this.options = null;
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
    this.options = this.resolver.options;
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
    var members = symbol.type.sortedMembers();
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
      throw new Error('assert false; (src/emitters/base.sk:185:19)');
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
    case 44:
    case 45:
      this.emitDot(node);
      break;
    case 46:
      this.emitCall(node, precedence);
      break;
    case 49:
      this.emitSequence(node, precedence);
      break;
    case 79:
      this.emitIndex(node, precedence);
      break;
    case 101:
      this.emitTernary(node, precedence);
      break;
    case 50:
      this.emitParameterize(node);
      break;
    case 51:
    case 52:
      this.emitCast(node, precedence);
      break;
    case 42:
      this.emitList(node, precedence);
      break;
    case 47:
      this.emitSuperCall(node);
      break;
    case 53:
      this.emitExpression(node.quotedValue(), precedence);
      break;
    default:
      if (in_NodeKind.isUnaryOperator(kind)) {
        this.emitUnary(node, precedence);
      } else if (in_NodeKind.isBinaryOperator(kind)) {
        this.emitBinary(node, precedence);
      } else {
        throw new Error('assert false; (src/emitters/base.sk:370:16)');
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
      throw new Error('assert values.size() > 1; (src/emitters/base.sk:384:7)');
    }
    if (node.parent.kind !== NodeKind.EXPRESSION && node.parent.kind !== NodeKind.FOR) {
      throw new Error('assert node.parent.kind == .EXPRESSION || node.parent.kind == .FOR; (src/emitters/base.sk:385:7)');
    }
    if (Precedence.COMMA <= precedence) {
      this.emit('(');
    }
    this.emitCommaSeparatedExpressions(values);
    if (Precedence.COMMA <= precedence) {
      this.emit(')');
    }
  };
  base.Emitter.prototype.hasUnaryStorageOperators = function() {
    return true;
  };
  base.Emitter.prototype.shouldEmitSpaceForUnaryOperator = function(node) {
    var value = node.unaryValue();
    var kind = node.kind;
    var valueKind = value.kind;
    if (kind === NodeKind.NEW || kind === NodeKind.DELETE || kind === NodeKind.POSITIVE && (valueKind === NodeKind.POSITIVE || valueKind === NodeKind.PREFIX_INCREMENT) || kind === NodeKind.NEGATIVE && (valueKind === NodeKind.NEGATIVE || valueKind === NodeKind.PREFIX_DECREMENT)) {
      return true;
    }
    return false;
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
    var info = operatorInfo._table[node.kind];
    if (info.precedence < precedence) {
      this.emit('(');
    }
    var isPostfix = info.precedence === Precedence.UNARY_POSTFIX;
    if (!isPostfix) {
      this.emit(info.text);
      if (this.shouldEmitSpaceForUnaryOperator(node)) {
        this.emit(' ');
      }
    }
    this.emitExpression(value, info.precedence);
    if (isPostfix) {
      if (this.shouldEmitSpaceForUnaryOperator(node)) {
        this.emit(' ');
      }
      this.emit(info.text);
    }
    if (info.precedence < precedence) {
      this.emit(')');
    }
  };
  base.Emitter.prototype.emitBinary = function(node, precedence) {
    var info = operatorInfo._table[node.kind];
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
  base.Emitter.prototype.emitParameterize = function(node) {
    this.emitExpression(node.parameterizeValue(), Precedence.MEMBER);
    this.emit('<');
    this.emitCommaSeparatedExpressions(node.parameterizeTypes());
    this.emit('>');
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
  base.Emitter.prototype.emitList = function(node, precedence) {
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
      throw new Error('assert !type.isFunction(); (src/emitters/base.sk:558:7)');
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
    if (symbol.name in this.isKeyword._table && !symbol.isImport()) {
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
  cpp.Emitter = function(_0) {
    base.Emitter.call(this, _0);
    this.namespaceStack = [];
    this.usedAssert = false;
    this.usedMath = false;
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
    if (this.usedMath) {
      headers += '#include <cmath>\n';
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
    var enclosingSymbol = symbol.enclosingSymbol;
    var selfParameters = symbol.hasParameters();
    var enclosingParameters = this.pass === cpp.Pass.IMPLEMENT_CODE && enclosingSymbol.hasParameters();
    if (selfParameters || enclosingParameters) {
      this.emit(this.indent + 'template <');
      if (selfParameters) {
        for (var i = 0; i < symbol.parameters.length; i = i + 1 | 0) {
          if (i > 0) {
            this.emit(', ');
          }
          this.emitTypeParameter(symbol.parameters[i]);
        }
      }
      if (enclosingParameters) {
        for (var i = 0; i < enclosingSymbol.parameters.length; i = i + 1 | 0) {
          if (i > 0 || selfParameters) {
            this.emit(', ');
          }
          this.emitTypeParameter(enclosingSymbol.parameters[i]);
        }
      }
      this.emit('>\n');
    }
  };
  cpp.Emitter.prototype.emitEnumValues = function(symbol) {
    var members = symbol.type.sortedMembers();
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
        if (this.pass === cpp.Pass.IMPLEMENT_CODE) {
          var enclosingSymbol = symbol.enclosingSymbol;
          if (enclosingSymbol !== null && enclosingSymbol.kind !== SymbolKind.GLOBAL_NAMESPACE) {
            this.emit(this.fullName(enclosingSymbol));
            if (enclosingSymbol.hasParameters()) {
              this.emit('<');
              for (var i = 0; i < enclosingSymbol.parameters.length; i = i + 1 | 0) {
                if (i > 0) {
                  this.emit(', ');
                }
                this.emit(this.mangleName(enclosingSymbol.parameters[i]));
              }
              this.emit('>');
            }
            this.emit('::');
          }
        }
        this.emit(this.mangleName(symbol));
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
                this.emit(this.fullName(superInitializer.symbol.enclosingSymbol) + '(');
                this.emitCommaSeparatedExpressions(superInitializer.superCallArguments());
                this.emit(')');
                if (memberInitializers !== null && memberInitializers.hasChildren()) {
                  this.emit(', ');
                }
              }
              if (memberInitializers !== null) {
                for (var i = 0; i < memberInitializers.children.length; i = i + 1 | 0) {
                  var initializer = memberInitializers.children[i];
                  var value = initializer.memberInitializerValue();
                  if (i > 0) {
                    this.emit(', ');
                  }
                  this.emit(this.mangleName(initializer.symbol) + '(');
                  if (value.kind !== NodeKind.ERROR) {
                    this.emitExpression(value, Precedence.LOWEST);
                  }
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
  cpp.Emitter.prototype.shouldEmitSpaceForUnaryOperator = function(node) {
    return in_NodeKind.isUnaryTypeOperator(node.kind) ? true : base.Emitter.prototype.shouldEmitSpaceForUnaryOperator.call(this, node);
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
    var useConstReference = symbol.name === 'this' && symbol.type.isString(this.cache);
    if (useConstReference) {
      this.emit('const ');
    }
    this.emitCppType(symbol.type, cpp.CppEmitType.DECLARATION);
    if (useConstReference) {
      this.emit('&');
    }
    this.emit(this.mangleName(symbol));
    this.emitAfterVariable(symbol.node);
  };
  cpp.Emitter.prototype.emitForEach = function(node) {
    var symbol = node.forEachVariable().symbol;
    this.emit(this.indent + 'for (');
    this.emitTypeBeforeVariable(symbol);
    this.emit(this.mangleName(symbol));
    this.emit(' : ');
    this.emitExpression(node.forEachValue(), Precedence.LOWEST);
    this.emit(')');
    this.emitBlock(node.forEachBlock());
    this.emit('\n');
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
    var value = node.asDouble();
    if (value === math.INFINITY) {
      this.usedMath = true;
      this.emit('INFINITY');
    } else if (value === -math.INFINITY) {
      this.usedMath = true;
      this.emit('-INFINITY');
    } else if (value !== value) {
      this.usedMath = true;
      this.emit('NAN');
    } else {
      base.Emitter.prototype.emitReal.call(this, node);
      if (node.kind === NodeKind.FLOAT) {
        this.emit('f');
      }
    }
  };
  cpp.Emitter.needsWrappedStringConstructor = function(node) {
    var parent = node.parent;
    switch (parent.kind) {
    case 46:
      return node === parent.callValue();
    case 35:
      return parent.hookTrue() === node && parent.hookFalse().kind === NodeKind.STRING;
    case 69:
      return parent.binaryLeft() === node && parent.binaryRight().kind === NodeKind.STRING;
    case 90:
    case 91:
    case 15:
    case 5:
    case 23:
      return false;
    default:
      return true;
    }
  };
  cpp.Emitter.prototype.emitString = function(node) {
    var content = node.asString();
    var needsLength = content.indexOf('\0') >= 0;
    var needsWrap = needsLength || cpp.Emitter.needsWrappedStringConstructor(node);
    if (needsWrap) {
      this.emit('string(');
    }
    base.Emitter.prototype.emitString.call(this, node);
    if (needsWrap) {
      if (needsLength) {
        this.emit(', ' + content.length);
      }
      this.emit(')');
    }
  };
  cpp.Emitter.prototype.emitDot = function(node) {
    var target = node.dotTarget();
    var dotName = node.dotName();
    if (target !== null) {
      this.emitExpression(target, Precedence.MEMBER);
    }
    if (dotName.kind === NodeKind.QUOTED) {
      dotName = dotName.quotedValue();
    }
    this.emit(node.kind === NodeKind.DOT_COLON ? '::' : node.kind === NodeKind.DOT_ARROW || target !== null && target.type.isReference() ? '->' : '.');
    this.emit(node.symbol !== null ? this.mangleName(node.symbol) : dotName.asString());
  };
  cpp.Emitter.prototype.emitCall = function(node, precedence) {
    var value = node.callValue();
    var isNew = value.kind === NodeKind.TYPE;
    var wrap = isNew && precedence === Precedence.MEMBER;
    if (wrap) {
      this.emit('(');
    }
    if (isNew) {
      this.emit('new ');
    }
    this.emitExpression(value, Precedence.UNARY_POSTFIX);
    if (!isNew && value.type !== null && value.type.isParameterized()) {
      var substitutions = value.type.substitutions;
      this.emit('<');
      for (var i = 0; i < substitutions.length; i = i + 1 | 0) {
        if (i > 0) {
          this.emit(', ');
        }
        this.emitCppType(substitutions[i], cpp.CppEmitType.NORMAL);
      }
      this.emit('>');
    }
    this.emit('(');
    this.emitCommaSeparatedExpressions(node.callArguments());
    this.emit(')');
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
  cpp.Emitter.prototype.emitList = function(node, precedence) {
    var values = node.listValues();
    var wrap = precedence === Precedence.MEMBER;
    if (wrap) {
      this.emit('(');
    }
    this.emit('new ');
    this.emitCppType(node.type, cpp.CppEmitType.BARE);
    if (values.length > 0) {
      this.emit(' { ');
      this.emitCommaSeparatedExpressions(values);
      this.emit(' }');
    } else {
      this.emit(' {}');
    }
    if (wrap) {
      this.emit(')');
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
    } else if (type.isQuoted()) {
      this.emitExpression(type.symbol.node, Precedence.LOWEST);
    } else {
      this.emitType(type);
    }
    if (type.isReference() && mode !== cpp.CppEmitType.BARE) {
      this.emit(' *');
    } else if (mode === cpp.CppEmitType.DECLARATION && (!type.isQuoted() || !in_NodeKind.isUnaryTypeOperator(type.symbol.node.kind))) {
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
    result._table['alignas'] = true;
    result._table['alignof'] = true;
    result._table['and'] = true;
    result._table['and_eq'] = true;
    result._table['asm'] = true;
    result._table['auto'] = true;
    result._table['bitand'] = true;
    result._table['bitor'] = true;
    result._table['bool'] = true;
    result._table['break'] = true;
    result._table['case'] = true;
    result._table['catch'] = true;
    result._table['char'] = true;
    result._table['char16_t'] = true;
    result._table['char32_t'] = true;
    result._table['class'] = true;
    result._table['compl'] = true;
    result._table['const'] = true;
    result._table['const_cast'] = true;
    result._table['constexpr'] = true;
    result._table['continue'] = true;
    result._table['decltype'] = true;
    result._table['default'] = true;
    result._table['delete'] = true;
    result._table['do'] = true;
    result._table['double'] = true;
    result._table['dynamic_cast'] = true;
    result._table['else'] = true;
    result._table['enum'] = true;
    result._table['explicit'] = true;
    result._table['export'] = true;
    result._table['extern'] = true;
    result._table['false'] = true;
    result._table['float'] = true;
    result._table['for'] = true;
    result._table['friend'] = true;
    result._table['goto'] = true;
    result._table['if'] = true;
    result._table['INFINITY'] = true;
    result._table['inline'] = true;
    result._table['int'] = true;
    result._table['long'] = true;
    result._table['mutable'] = true;
    result._table['namespace'] = true;
    result._table['NAN'] = true;
    result._table['new'] = true;
    result._table['noexcept'] = true;
    result._table['not'] = true;
    result._table['not_eq'] = true;
    result._table['NULL'] = true;
    result._table['nullptr'] = true;
    result._table['operator'] = true;
    result._table['or'] = true;
    result._table['or_eq'] = true;
    result._table['private'] = true;
    result._table['protected'] = true;
    result._table['public'] = true;
    result._table['register'] = true;
    result._table['reinterpret_cast'] = true;
    result._table['return'] = true;
    result._table['short'] = true;
    result._table['signed'] = true;
    result._table['sizeof'] = true;
    result._table['static'] = true;
    result._table['static_assert'] = true;
    result._table['static_cast'] = true;
    result._table['struct'] = true;
    result._table['switch'] = true;
    result._table['template'] = true;
    result._table['this'] = true;
    result._table['thread_local'] = true;
    result._table['throw'] = true;
    result._table['true'] = true;
    result._table['try'] = true;
    result._table['typedef'] = true;
    result._table['typeid'] = true;
    result._table['typename'] = true;
    result._table['union'] = true;
    result._table['unsigned'] = true;
    result._table['using'] = true;
    result._table['virtual'] = true;
    result._table['void'] = true;
    result._table['volatile'] = true;
    result._table['wchar_t'] = true;
    result._table['while'] = true;
    result._table['xor'] = true;
    result._table['xor_eq'] = true;
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
  frontend = {};
  frontend.Color = {
    DEFAULT: 0,
    BOLD: 1,
    GRAY: 90,
    RED: 91,
    GREEN: 92,
    MAGENTA: 95
  };
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
    this.emit(this.indent + this.minifySpaces('(function() {' + this.newline));
    this.increaseIndent();
    if (this.patcher.needMathImul) {
      this.emit(this.indent + 'var ' + this.patcher.imul + this.minifySpaces(' = Math.imul || function(a, b) {' + this.newline));
      this.increaseIndent();
      this.emit(this.indent + 'var ' + this.minifySpaces('ah = a >>> 16, al = a & 65535, bh = b >>> 16, bl = b & 65535;' + this.newline));
      this.emit(this.indent + 'return ' + this.minifySpaces('al * bl + (ah * bl + al * bh << 16) | 0'));
      this.emitSemicolonAfterStatement();
      this.decreaseIndent();
      this.emit(this.indent + '};' + this.newline);
      this.needsSemicolon = false;
    }
    if (this.patcher.needExtends) {
      var derived = this.options.jsMangle ? 'd' : 'derived';
      var base = this.options.jsMangle ? 'b' : 'base';
      this.emit(this.indent + 'function ' + this.minifySpaces(this.patcher.$extends + '(' + derived + ', ' + base + ') {' + this.newline));
      this.increaseIndent();
      this.emit(this.indent + derived + this.minifySpaces('.prototype = Object.create(' + base + '.prototype);' + this.newline));
      this.emit(this.indent + derived + this.minifySpaces('.prototype.constructor = ' + derived));
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
      var members = type.sortedMembers();
      for (var j = 0; j < members.length; j = j + 1 | 0) {
        var symbol = members[j].symbol;
        if (symbol.enclosingSymbol === type.symbol && symbol.node !== null) {
          if (in_SymbolKind.isFunction(symbol.kind) && symbol.kind !== SymbolKind.CONSTRUCTOR_FUNCTION) {
            this.emitNode(symbol.node);
          } else if (symbol.kind === SymbolKind.GLOBAL_VARIABLE && !symbol.isEnumValue()) {
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
  js.Emitter.prototype.minifySpaces = function(text) {
    return in_string.replace(text, ' ', this.space);
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
      this.maybeEmitMinifedNewline();
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
      throw new Error('assert false; (src/js/emitter.sk:334:19)');
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
    var kind = node.kind;
    switch (kind) {
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
    case 44:
    case 45:
      this.emitDot(node);
      break;
    case 46:
      this.emitCall(node);
      break;
    case 47:
      this.emitSuperCall(node);
      break;
    case 49:
      this.emitSequence(node, precedence);
      break;
    case 53:
      this.emitExpression(node.quotedValue(), precedence);
      break;
    case 79:
      this.emitIndex(node, precedence);
      break;
    case 101:
      this.emitTernary(node, precedence);
      break;
    case 51:
    case 52:
      this.emitExpression(node.castValue(), precedence);
      break;
    default:
      if (in_NodeKind.isUnaryOperator(kind)) {
        this.emitUnary(node, precedence);
      } else if (in_NodeKind.isBinaryOperator(kind)) {
        this.emitBinary(node, precedence);
      } else {
        throw new Error('assert false; (src/js/emitter.sk:654:16)');
      }
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
    var value = node.asDouble();
    if (wrap) {
      this.emit('(');
    }
    if (value === math.INFINITY) {
      this.emit('Infinity');
    } else if (value === -math.INFINITY) {
      this.emit('-Infinity');
    } else if (value !== value) {
      this.emit('NaN');
    } else {
      this.emit(value.toString());
    }
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
    if (name.kind === NodeKind.QUOTED) {
      name = name.quotedValue();
    }
    this.emit(name.symbol === null ? name.asString() : in_SymbolKind.isInstance(name.symbol.kind) ? js.Emitter.mangleName(name.symbol) : js.Emitter.fullName(name.symbol));
  };
  js.Emitter.prototype.emitCall = function(node) {
    var value = node.callValue();
    if (in_NodeKind.isType(value.kind)) {
      this.emit('new ');
    }
    this.emitExpression(value, Precedence.UNARY_POSTFIX);
    this.emit('(');
    this.emitCommaSeparatedExpressions(node.callArguments());
    this.emit(')');
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
  js.Emitter.prototype.isNumberLessThanZero = function(node) {
    return node.kind === NodeKind.INT && node.asInt() < 0 || in_NodeKind.isReal(node.kind) && node.asDouble() < 0;
  };
  js.Emitter.prototype.emitUnary = function(node, precedence) {
    var value = node.unaryValue();
    var info = operatorInfo._table[node.kind];
    if (info.precedence < precedence) {
      this.emit('(');
    }
    var isPostfix = info.precedence === Precedence.UNARY_POSTFIX;
    if (!isPostfix) {
      this.emit(info.text);
      var kind = node.kind;
      var valueKind = value.kind;
      if (kind === NodeKind.NEW || kind === NodeKind.DELETE || kind === NodeKind.POSITIVE && (valueKind === NodeKind.POSITIVE || valueKind === NodeKind.PREFIX_INCREMENT) || kind === NodeKind.NEGATIVE && (valueKind === NodeKind.NEGATIVE || valueKind === NodeKind.PREFIX_DECREMENT || this.isNumberLessThanZero(value))) {
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
    var info = operatorInfo._table[kind];
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
    if (this.space === '' && (kind === NodeKind.ADD && (right.kind === NodeKind.POSITIVE || right.kind === NodeKind.PREFIX_INCREMENT) || kind === NodeKind.SUBTRACT && (right.kind === NodeKind.NEGATIVE || right.kind === NodeKind.PREFIX_DECREMENT || this.isNumberLessThanZero(right)))) {
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
      return value.length > 0 && !(value in js.Emitter.isKeyword._table);
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
    result._table['apply'] = true;
    result._table['arguments'] = true;
    result._table['Boolean'] = true;
    result._table['break'] = true;
    result._table['call'] = true;
    result._table['case'] = true;
    result._table['catch'] = true;
    result._table['class'] = true;
    result._table['const'] = true;
    result._table['constructor'] = true;
    result._table['continue'] = true;
    result._table['Date'] = true;
    result._table['debugger'] = true;
    result._table['default'] = true;
    result._table['delete'] = true;
    result._table['do'] = true;
    result._table['double'] = true;
    result._table['else'] = true;
    result._table['export'] = true;
    result._table['extends'] = true;
    result._table['false'] = true;
    result._table['finally'] = true;
    result._table['float'] = true;
    result._table['for'] = true;
    result._table['Function'] = true;
    result._table['function'] = true;
    result._table['if'] = true;
    result._table['import'] = true;
    result._table['in'] = true;
    result._table['instanceof'] = true;
    result._table['int'] = true;
    result._table['let'] = true;
    result._table['new'] = true;
    result._table['null'] = true;
    result._table['Number'] = true;
    result._table['Object'] = true;
    result._table['return'] = true;
    result._table['String'] = true;
    result._table['super'] = true;
    result._table['this'] = true;
    result._table['throw'] = true;
    result._table['true'] = true;
    result._table['try'] = true;
    result._table['var'] = true;
    return result;
  };
  js.Emitter.mangleName = function(symbol) {
    if (symbol.kind === SymbolKind.CONSTRUCTOR_FUNCTION) {
      return js.Emitter.mangleName(symbol.enclosingSymbol);
    }
    if (symbol.isImportOrExport()) {
      return symbol.name;
    }
    if (symbol.name in js.Emitter.isKeyword._table) {
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
  js.BooleanSwap = {
    SWAP: 0,
    NO_SWAP: 1
  };
  js.ExtractGroupsMode = {
    ALL_SYMBOLS: 0,
    ONLY_LOCAL_VARIABLES: 1,
    ONLY_INSTANCE_VARIABLES: 2
  };
  js.SymbolGroup = function(_0, _1) {
    this.group = _0;
    this.count = _1;
  };
  js.SymbolComparison = function() {
  };
  js.SymbolComparison.prototype.compare = function(left, right) {
    return left.uniqueID - right.uniqueID | 0;
  };
  js.SymbolGroupComparison = function() {
  };
  js.SymbolGroupComparison.prototype.compare = function(left, right) {
    var difference = right.count - left.count | 0;
    if (difference === 0) {
      difference = right.group.length - left.group.length | 0;
      for (var i = 0; difference === 0 && i < left.group.length; i = i + 1 | 0) {
        difference = left.group[i].uniqueID - right.group[i].uniqueID | 0;
      }
    }
    return difference;
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
    this.localVariableUnionFind = null;
    this.cache = null;
    this.reservedNames = js.Emitter.isKeyword.clone();
    this.symbolCounts = new IntMap();
    this.namingGroupIndexForSymbol = new IntMap();
    this.resolver = _0;
  };
  js.Patcher.prototype.run = function(program) {
    if (program.kind !== NodeKind.PROGRAM) {
      throw new Error('assert program.kind == .PROGRAM; (src/js/patcher.sk:62:7)');
    }
    var allSymbols = this.resolver.allSymbols;
    this.options = this.resolver.options;
    this.cache = this.resolver.cache;
    if (this.options.jsMangle) {
      this.localVariableUnionFind = new UnionFind(allSymbols.length);
      for (var i = 0; i < allSymbols.length; i = i + 1 | 0) {
        this.namingGroupIndexForSymbol._table[allSymbols[i].uniqueID] = i;
      }
      this.imul = '$i';
      this.$extends = '$e';
    }
    this.patchNode(program);
    if (this.options.jsMangle) {
      var namingGroupsUnionFind = new UnionFind(allSymbols.length);
      var order = [];
      this.aliasLocalVariables(namingGroupsUnionFind, order);
      this.aliasUnrelatedProperties(namingGroupsUnionFind, order);
      for (var i = 0; i < allSymbols.length; i = i + 1 | 0) {
        var symbol = allSymbols[i];
        if (symbol.overriddenMember !== null) {
          var overridden = symbol.overriddenMember.symbol;
          var index = this.namingGroupIndexForSymbol._table[symbol.uniqueID];
          namingGroupsUnionFind.union(index, this.namingGroupIndexForSymbol._table[overridden.uniqueID]);
          if (overridden.identicalMembers !== null) {
            for (var j = 0; j < overridden.identicalMembers.length; j = j + 1 | 0) {
              namingGroupsUnionFind.union(index, this.namingGroupIndexForSymbol._table[overridden.identicalMembers[j].symbol.uniqueID]);
            }
          }
        }
      }
      var members = this.cache.globalType.members.values();
      for (var i = 0; i < members.length; i = i + 1 | 0) {
        var member = members[i];
        if (!this.canRename(member.symbol)) {
          this.reservedNames._table[member.symbol.name] = true;
        }
      }
      var namingGroups = this.extractGroups(namingGroupsUnionFind, js.ExtractGroupsMode.ALL_SYMBOLS);
      var sortedGroups = [];
      for (var i = 0; i < namingGroups.length; i = i + 1 | 0) {
        var group = namingGroups[i];
        var count = 0;
        for (var j = 0; j < group.length; j = j + 1 | 0) {
          var symbol = group[j];
          if (this.canRename(symbol)) {
            count = count + this.symbolCounts.getOrDefault(symbol.uniqueID, 0) | 0;
          }
        }
        sortedGroups.push(new js.SymbolGroup(group, count));
      }
      sortedGroups.sort(bindCompare(js.SymbolGroupComparison.INSTANCE));
      for (var i = 0; i < sortedGroups.length; i = i + 1 | 0) {
        var group = sortedGroups[i].group;
        var name = '';
        for (var j = 0; j < group.length; j = j + 1 | 0) {
          var symbol = group[j];
          if (this.canRename(symbol)) {
            if (name === '') {
              name = this.generateSymbolName();
            }
            if (symbol.kind !== SymbolKind.INSTANCE_FUNCTION) {
              symbol.enclosingSymbol = this.cache.globalType.symbol;
            }
            symbol.name = name;
          }
        }
      }
    }
  };
  js.Patcher.prototype.aliasLocalVariables = function(unionFind, order) {
    this.zipTogetherInOrder(unionFind, order, this.extractGroups(this.localVariableUnionFind, js.ExtractGroupsMode.ONLY_LOCAL_VARIABLES));
  };
  js.Patcher.prototype.aliasUnrelatedProperties = function(unionFind, order) {
    var allSymbols = this.resolver.allSymbols;
    var relatedTypesUnionFind = new UnionFind(allSymbols.length);
    for (var i = 0; i < allSymbols.length; i = i + 1 | 0) {
      var symbol = allSymbols[i];
      if (in_SymbolKind.isType(symbol.kind)) {
        if (symbol.type.hasRelevantTypes()) {
          var types = symbol.type.relevantTypes;
          for (var j = 0; j < types.length; j = j + 1 | 0) {
            relatedTypesUnionFind.union(i, this.namingGroupIndexForSymbol._table[types[j].symbol.uniqueID]);
          }
        }
        var members = symbol.type.members.values();
        for (var j = 0; j < members.length; j = j + 1 | 0) {
          var index = this.namingGroupIndexForSymbol.getOrDefault(members[j].symbol.uniqueID, -1);
          if (index !== -1) {
            relatedTypesUnionFind.union(i, index);
          }
        }
      }
    }
    this.zipTogetherInOrder(unionFind, order, this.extractGroups(relatedTypesUnionFind, js.ExtractGroupsMode.ONLY_INSTANCE_VARIABLES));
  };
  js.Patcher.prototype.zipTogetherInOrder = function(unionFind, order, groups) {
    for (var i = 0; i < groups.length; i = i + 1 | 0) {
      var group = groups[i];
      for (var j = 0; j < group.length; j = j + 1 | 0) {
        var symbol = group[j];
        var index = this.namingGroupIndexForSymbol._table[symbol.uniqueID];
        if (order.length <= j) {
          order.push(index);
        }
        unionFind.union(index, order[j]);
      }
    }
  };
  js.Patcher.prototype.extractGroups = function(unionFind, mode) {
    var labelToGroup = new IntMap();
    var allSymbols = this.resolver.allSymbols;
    for (var i = 0; i < allSymbols.length; i = i + 1 | 0) {
      var symbol = allSymbols[i];
      if (mode === js.ExtractGroupsMode.ONLY_LOCAL_VARIABLES && symbol.kind !== SymbolKind.LOCAL_VARIABLE || mode === js.ExtractGroupsMode.ONLY_INSTANCE_VARIABLES && symbol.kind !== SymbolKind.INSTANCE_VARIABLE) {
        continue;
      }
      var label = unionFind.find(this.namingGroupIndexForSymbol._table[symbol.uniqueID]);
      var group = labelToGroup.getOrDefault(label, null);
      if (group === null) {
        group = [];
        labelToGroup._table[label] = group;
      }
      group.push(symbol);
    }
    var groups = labelToGroup.values();
    for (var i = 0; i < groups.length; i = i + 1 | 0) {
      var group = groups[i];
      if (group.length > 1) {
        group.sort(bindCompare(js.SymbolComparison.INSTANCE));
      }
    }
    return groups;
  };
  js.Patcher.prototype.canRename = function(symbol) {
    if (!symbol.isImportOrExport() && symbol.kind !== SymbolKind.CONSTRUCTOR_FUNCTION) {
      if (symbol.overriddenMember !== null) {
        return this.canRename(symbol.overriddenMember.symbol);
      }
      return true;
    }
    return false;
  };
  js.Patcher.prototype.trackSymbolCount = function(node) {
    var symbol = node.symbol;
    if (symbol !== null && node.kind !== NodeKind.TYPE && !node.isDeclarationName()) {
      this.symbolCounts._table[symbol.uniqueID] = this.symbolCounts.getOrDefault(symbol.uniqueID, 0) + 1 | 0;
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
    case 51:
      this.patchCast(node);
      break;
    case 10:
      this.patchClass(node);
      break;
    case 32:
      this.patchName(node);
      break;
    case 69:
    case 89:
    case 84:
    case 74:
    case 86:
      this.patchBinary(node);
      break;
    case 56:
    case 57:
    case 59:
    case 60:
    case 62:
    case 61:
      this.patchUnary(node);
      break;
    case 91:
    case 100:
    case 96:
    case 95:
    case 97:
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
    case 15:
      if (this.options.jsMangle) {
        this.unionVariableWithFunction(node);
      }
      break;
    }
    if (this.options.jsMangle) {
      switch (node.kind) {
      case 18:
        this.peepholeMangleIf(node);
        break;
      case 19:
        this.peepholeMangleFor(node);
        break;
      case 77:
      case 81:
        this.peepholeMangleBinaryRelational(node);
        break;
      case 21:
      case 22:
        this.peepholeMangleBoolean(node.whileTest(), js.BooleanSwap.NO_SWAP);
        break;
      case 2:
        this.peepholeMangleBlock(node);
        break;
      case 35:
        this.peepholeMangleHook(node);
        break;
      }
    }
  };
  js.Patcher.prototype.peepholeMangleBinaryRelational = function(node) {
    if (node.kind !== NodeKind.GREATER_THAN_OR_EQUAL && node.kind !== NodeKind.LESS_THAN_OR_EQUAL) {
      throw new Error('assert node.kind == .GREATER_THAN_OR_EQUAL || node.kind == .LESS_THAN_OR_EQUAL; (src/js/patcher.sk:309:7)');
    }
    var left = node.binaryLeft();
    var right = node.binaryRight();
    if (left.type !== null && left.type.isInteger(this.cache) && right.type !== null && right.type.isInteger(this.cache)) {
      if (left.kind === NodeKind.INT) {
        var value = left.asInt();
        if (node.kind === NodeKind.GREATER_THAN_OR_EQUAL && in_int.canIncrement(value)) {
          left.content = new IntContent(value + 1 | 0);
          node.kind = NodeKind.GREATER_THAN;
        } else if (node.kind === NodeKind.LESS_THAN_OR_EQUAL && in_int.canDecrement(value)) {
          left.content = new IntContent(value - 1 | 0);
          node.kind = NodeKind.LESS_THAN;
        }
      } else if (right.kind === NodeKind.INT) {
        var value = right.asInt();
        if (node.kind === NodeKind.GREATER_THAN_OR_EQUAL && in_int.canDecrement(value)) {
          right.content = new IntContent(value - 1 | 0);
          node.kind = NodeKind.GREATER_THAN;
        } else if (node.kind === NodeKind.LESS_THAN_OR_EQUAL && in_int.canIncrement(value)) {
          right.content = new IntContent(value + 1 | 0);
          node.kind = NodeKind.LESS_THAN;
        }
      }
    }
  };
  js.Patcher.prototype.isFalsy = function(node) {
    var kind = node.kind;
    if (kind === NodeKind.NULL) {
      return true;
    } else if (kind === NodeKind.INT) {
      return node.asInt() === 0;
    } else if (in_NodeKind.isReal(kind)) {
      return node.asDouble() === 0;
    } else if (kind === NodeKind.STRING) {
      return node.asString() === '';
    } else if (in_NodeKind.isCast(kind)) {
      return this.isFalsy(node.castValue());
    } else {
      return false;
    }
  };
  js.Patcher.prototype.peepholeMangleBoolean = function(node, canSwap) {
    var kind = node.kind;
    if (kind === NodeKind.EQUAL || kind === NodeKind.NOT_EQUAL) {
      var left = node.binaryLeft();
      var right = node.binaryRight();
      var replacement = this.isFalsy(right) ? left : this.isFalsy(left) ? right : null;
      if (replacement !== null) {
        if (left.type !== null && !left.type.isReal(this.cache) && right.type !== null && !right.type.isReal(this.cache)) {
          replacement.replaceWith(null);
          node.become(kind === NodeKind.EQUAL ? Node.createUnary(NodeKind.NOT, replacement) : replacement);
        }
      } else if (left.type !== null && left.type.isInteger(this.cache) && right.type !== null && right.type.isInteger(this.cache)) {
        if (kind === NodeKind.NOT_EQUAL) {
          node.kind = NodeKind.BITWISE_XOR;
        } else if (kind === NodeKind.EQUAL && canSwap === js.BooleanSwap.SWAP) {
          node.kind = NodeKind.BITWISE_XOR;
          return js.BooleanSwap.SWAP;
        }
      }
    } else if (kind === NodeKind.LOGICAL_AND || kind === NodeKind.LOGICAL_OR) {
      this.peepholeMangleBoolean(node.binaryLeft(), js.BooleanSwap.NO_SWAP);
      this.peepholeMangleBoolean(node.binaryRight(), js.BooleanSwap.NO_SWAP);
    }
    if (node.kind === NodeKind.NOT && canSwap === js.BooleanSwap.SWAP) {
      node.become(node.unaryValue().replaceWith(null));
      return js.BooleanSwap.SWAP;
    }
    return js.BooleanSwap.NO_SWAP;
  };
  js.Patcher.prototype.peepholeMangleIf = function(node) {
    var test = node.ifTest();
    var trueBlock = node.ifTrue();
    var falseBlock = node.ifFalse();
    var swapped = this.peepholeMangleBoolean(test, falseBlock !== null ? js.BooleanSwap.SWAP : js.BooleanSwap.NO_SWAP);
    if (swapped === js.BooleanSwap.SWAP) {
      var temp = trueBlock;
      trueBlock = falseBlock;
      falseBlock = temp;
      trueBlock.swapWith(falseBlock);
    }
    var trueStatement = trueBlock.blockStatement();
    if (falseBlock !== null) {
      var falseStatement = falseBlock.blockStatement();
      if (trueStatement !== null && falseStatement !== null) {
        if (trueStatement.kind === NodeKind.EXPRESSION && falseStatement.kind === NodeKind.EXPRESSION) {
          var hook = Node.createHook(test.replaceWith(null), trueStatement.expressionValue().replaceWith(null), falseStatement.expressionValue().replaceWith(null));
          this.peepholeMangleHook(hook);
          node.become(Node.createExpression(hook));
        } else if (trueStatement.kind === NodeKind.RETURN && falseStatement.kind === NodeKind.RETURN) {
          var trueValue = trueStatement.returnValue();
          var falseValue = falseStatement.returnValue();
          if (trueValue !== null && falseValue !== null) {
            var hook = Node.createHook(test.replaceWith(null), trueValue.replaceWith(null), falseValue.replaceWith(null));
            this.peepholeMangleHook(hook);
            node.become(Node.createReturn(hook));
          }
        }
      }
    } else if (trueStatement !== null && trueStatement.kind === NodeKind.EXPRESSION) {
      var value = trueStatement.expressionValue().replaceWith(null);
      if (test.kind === NodeKind.NOT) {
        node.become(Node.createExpression(Node.createBinary(NodeKind.LOGICAL_OR, test.unaryValue().replaceWith(null), value)));
      } else {
        node.become(Node.createExpression(Node.createBinary(NodeKind.LOGICAL_AND, test.replaceWith(null), value)));
      }
    }
  };
  js.Patcher.prototype.peepholeMangleFor = function(node) {
    var test = node.forTest();
    if (test !== null) {
      this.peepholeMangleBoolean(test, js.BooleanSwap.NO_SWAP);
    }
  };
  js.Patcher.prototype.isJumpImplied = function(node, kind) {
    if (node.kind !== NodeKind.BLOCK) {
      throw new Error('assert node.kind == .BLOCK; (src/js/patcher.sk:463:7)');
    }
    if (kind !== NodeKind.RETURN && kind !== NodeKind.CONTINUE) {
      throw new Error('assert kind == .RETURN || kind == .CONTINUE; (src/js/patcher.sk:464:7)');
    }
    var parent = node.parent;
    var parentKind = parent.kind;
    if (kind === NodeKind.RETURN && parentKind === NodeKind.FUNCTION || kind === NodeKind.CONTINUE && in_NodeKind.isLoop(parentKind)) {
      return true;
    }
    if (parentKind === NodeKind.IF && parent.isLastChild()) {
      return this.isJumpImplied(parent.parent, kind);
    }
    return false;
  };
  js.Patcher.prototype.peepholeMangleBlock = function(node) {
    if (!node.hasChildren()) {
      return;
    }
    for (var i = 0; i < node.children.length; i = i + 1 | 0) {
      var child = node.children[i];
      var kind = child.kind;
      if (kind === NodeKind.VARIABLE_CLUSTER) {
        while ((i + 1 | 0) < node.children.length) {
          var next = node.children[i + 1 | 0];
          if (next.kind !== NodeKind.VARIABLE_CLUSTER) {
            break;
          }
          var variables = next.remove().clusterVariables();
          for (var j = 0; j < variables.length; j = j + 1 | 0) {
            child.appendChild(variables[j].replaceWith(null));
          }
        }
      } else if (kind === NodeKind.FOR && i > 0) {
        var previous = node.children[i - 1 | 0];
        var setup = child.forSetup();
        if (setup !== null && previous.kind === NodeKind.VARIABLE_CLUSTER && setup.kind === NodeKind.VARIABLE_CLUSTER) {
          var variables = previous.clusterVariables();
          for (var j = 0; j < variables.length; j = j + 1 | 0) {
            variables[j].replaceWith(null);
          }
          setup.insertChildren(1, variables);
          previous.remove();
          i = i - 1 | 0;
        }
      } else if (kind === NodeKind.EXPRESSION) {
        while ((i + 1 | 0) < node.children.length) {
          var next = node.children[i + 1 | 0];
          if (next.kind !== NodeKind.EXPRESSION) {
            break;
          }
          var combined = Node.createExpression(this.joinExpressions(child.expressionValue().replaceWith(null), next.remove().expressionValue().replaceWith(null)));
          child.replaceWith(combined);
          child = combined;
        }
        var value = child.expressionValue();
        if (value.kind === NodeKind.SEQUENCE) {
          this.peepholeMangleSequence(value);
        }
      } else if (kind === NodeKind.IF && child.ifFalse() === null) {
        var trueBlock = child.ifTrue();
        if (trueBlock.hasChildren()) {
          var statement = trueBlock.lastChild();
          if ((statement.kind === NodeKind.RETURN && statement.returnValue() === null || statement.kind === NodeKind.CONTINUE) && this.isJumpImplied(node, statement.kind)) {
            var block = null;
            statement.remove();
            if (!trueBlock.hasChildren()) {
              child.ifTest().invertBooleanCondition(this.cache);
              block = trueBlock;
            } else if (!child.isLastChild()) {
              block = Node.createBlock([]);
              child.replaceChild(2, block);
              if (block !== child.ifFalse()) {
                throw new Error('assert block == child.ifFalse(); (src/js/patcher.sk:550:17)');
              }
            } else {
              this.peepholeMangleIf(child);
              return;
            }
            while ((i + 1 | 0) < node.children.length) {
              block.appendChild(node.children[i + 1 | 0].remove());
            }
            this.peepholeMangleBlock(block);
            this.peepholeMangleIf(child);
            if (child.kind === NodeKind.EXPRESSION && i > 0) {
              var previous = node.children[i - 1 | 0];
              if (previous.kind === NodeKind.EXPRESSION) {
                previous.replaceWith(Node.createExpression(this.joinExpressions(previous.expressionValue().replaceWith(null), child.remove().expressionValue().replaceWith(null))));
              }
            }
            return;
          }
        }
      } else if (kind === NodeKind.RETURN && child.returnValue() !== null) {
        while (i > 0) {
          var previous = node.children[i - 1 | 0];
          if (previous.kind === NodeKind.IF && previous.ifFalse() === null) {
            var statement = previous.ifTrue().blockStatement();
            if (statement !== null && statement.kind === NodeKind.RETURN && statement.returnValue() !== null) {
              var hook = Node.createHook(previous.ifTest().replaceWith(null), statement.returnValue().replaceWith(null), child.returnValue().replaceWith(null));
              this.peepholeMangleHook(hook);
              child.remove();
              child = Node.createReturn(hook);
              previous.replaceWith(child);
            } else {
              break;
            }
          } else if (previous.kind === NodeKind.EXPRESSION) {
            var combined = Node.createReturn(this.joinExpressions(previous.remove().expressionValue().replaceWith(null), child.returnValue().replaceWith(null)));
            child.replaceWith(combined);
            child = combined;
          } else {
            break;
          }
          i = i - 1 | 0;
        }
      }
    }
  };
  js.Patcher.prototype.assignSourceIfNoSideEffects = function(node) {
    if (node.kind === NodeKind.ASSIGN && node.binaryLeft().hasNoSideEffects()) {
      var right = node.binaryRight();
      return right.hasNoSideEffects() ? right : null;
    }
    if (node.kind === NodeKind.ASSIGN_INDEX && node.ternaryLeft().hasNoSideEffects() && node.ternaryMiddle().hasNoSideEffects()) {
      var right = node.ternaryRight();
      return right.hasNoSideEffects() ? right : null;
    }
    return null;
  };
  js.Patcher.prototype.peepholeMangleSequence = function(node) {
    if (node.kind !== NodeKind.SEQUENCE) {
      throw new Error('assert node.kind == .SEQUENCE; (src/js/patcher.sk:625:7)');
    }
    for (var i = node.children.length - 1 | 0; i > 0; i = i - 1 | 0) {
      var current = node.children[i];
      var currentRight = this.assignSourceIfNoSideEffects(current);
      if (currentRight !== null) {
        while (i > 0) {
          var previous = node.children[i - 1 | 0];
          var previousRight = this.assignSourceIfNoSideEffects(previous);
          if (previousRight === null || !this.looksTheSame(previousRight, currentRight)) {
            break;
          }
          previousRight.replaceWith(current.remove());
          current = previous;
          i = i - 1 | 0;
        }
      }
    }
  };
  js.Patcher.prototype.joinExpressions = function(left, right) {
    var sequence = Node.createSequence(left.kind === NodeKind.SEQUENCE ? left.removeChildren() : [left]);
    sequence.appendChildren(right.kind === NodeKind.SEQUENCE ? right.removeChildren() : [right]);
    return sequence;
  };
  js.Patcher.prototype.looksTheSame = function(left, right) {
    if (left.kind === right.kind) {
      switch (left.kind) {
      case 36:
      case 34:
        return true;
      case 38:
        return left.asInt() === right.asInt();
      case 37:
        return left.asBool() === right.asBool();
      case 39:
      case 40:
        return left.asDouble() === right.asDouble();
      case 41:
        return left.asString() === right.asString();
      case 32:
        return left.symbol !== null && left.symbol === right.symbol || left.asString() === right.asString();
      case 43:
        return left.symbol === right.symbol && left.dotName().asString() === right.dotName().asString() && this.looksTheSame(left.dotTarget(), right.dotTarget());
      }
    }
    if (left.kind === NodeKind.IMPLICIT_CAST) {
      return this.looksTheSame(left.castValue(), right);
    }
    if (right.kind === NodeKind.IMPLICIT_CAST) {
      return this.looksTheSame(left, right.castValue());
    }
    return false;
  };
  js.Patcher.prototype.peepholeMangleHook = function(node) {
    var test = node.hookTest();
    var trueValue = node.hookTrue();
    var falseValue = node.hookFalse();
    var swapped = this.peepholeMangleBoolean(test, js.BooleanSwap.SWAP);
    if (swapped === js.BooleanSwap.SWAP) {
      var temp = trueValue;
      trueValue = falseValue;
      falseValue = temp;
      trueValue.swapWith(falseValue);
    }
    if (trueValue.kind === falseValue.kind && in_NodeKind.isBinaryOperator(trueValue.kind)) {
      var trueLeft = trueValue.binaryLeft();
      var trueRight = trueValue.binaryRight();
      var falseLeft = falseValue.binaryLeft();
      var falseRight = falseValue.binaryRight();
      if (this.looksTheSame(trueLeft, falseLeft)) {
        var hook = Node.createHook(test.replaceWith(null), trueRight.replaceWith(null), falseRight.replaceWith(null));
        this.peepholeMangleHook(hook);
        node.become(Node.createBinary(trueValue.kind, trueLeft.replaceWith(null), hook));
      } else if (this.looksTheSame(trueRight, falseRight) && !in_NodeKind.isBinaryStorageOperator(trueValue.kind)) {
        var hook = Node.createHook(test.replaceWith(null), trueLeft.replaceWith(null), falseLeft.replaceWith(null));
        this.peepholeMangleHook(hook);
        node.become(Node.createBinary(trueValue.kind, hook, trueRight.replaceWith(null)));
      }
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
  js.Patcher.prototype.unionVariableWithFunction = function(node) {
    if (node.symbol.kind === SymbolKind.LOCAL_VARIABLE !== (this.currentFunction !== null)) {
      throw new Error('assert (node.symbol.kind == .LOCAL_VARIABLE) == (currentFunction != null); (src/js/patcher.sk:721:7)');
    }
    if (this.currentFunction !== null) {
      var left = this.namingGroupIndexForSymbol._table[this.currentFunction.uniqueID];
      var right = this.namingGroupIndexForSymbol._table[node.symbol.uniqueID];
      this.localVariableUnionFind.union(left, right);
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
      var value = node.unaryValue();
      if (in_NodeKind.isUnaryStorageOperator(node.kind)) {
        var isIncrement = node.kind === NodeKind.PREFIX_INCREMENT || node.kind === NodeKind.POSTFIX_INCREMENT;
        this.createBinaryIntAssignment(node, isIncrement ? NodeKind.ADD : NodeKind.SUBTRACT, value.replaceWith(null), Node.createInt(1));
      } else if (!this.alwaysConvertsOperandsToInt(node.parent.kind)) {
        if (node.kind !== NodeKind.POSITIVE && node.kind !== NodeKind.NEGATIVE) {
          throw new Error('assert node.kind == .POSITIVE || node.kind == .NEGATIVE; (src/js/patcher.sk:756:11)');
        }
        if (value.kind === NodeKind.INT) {
          var constant = value.asInt();
          node.become(Node.createInt(node.kind === NodeKind.NEGATIVE ? -constant | 0 : constant).withType(this.cache.intType));
        } else {
          node.become(Node.createBinary(NodeKind.BITWISE_OR, Node.createUnary(node.kind, value.replaceWith(null)).withType(this.cache.intType), Node.createInt(0).withType(this.cache.intType)).withType(this.cache.intType));
        }
      }
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
      throw new Error('assert left.kind == .DOT; (src/js/patcher.sk:843:7)');
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
    if (this.options.jsMangle) {
      this.namingGroupIndexForSymbol._table[symbol.uniqueID] = this.localVariableUnionFind.allocate();
      this.unionVariableWithFunction(reference);
    }
  };
  js.Patcher.prototype.alwaysConvertsOperandsToInt = function(kind) {
    switch (kind) {
    case 71:
    case 70:
    case 72:
    case 87:
    case 88:
    case 93:
    case 92:
    case 94:
    case 98:
    case 99:
      return true;
    default:
      return false;
    }
  };
  js.Patcher.prototype.setCurrentFunction = function(symbol) {
    this.currentFunction = symbol;
    this.createdThisAlias = false;
  };
  js.Patcher.numberToName = function(number) {
    var name = '';
    if (number >= 52) {
      name = js.Patcher.numberToName((number / 52 | 0) - 1 | 0);
      number = number % 52 | 0;
    }
    name += String.fromCharCode(number + (number < 26 ? 97 : 39) | 0);
    return name;
  };
  js.Patcher.prototype.generateSymbolName = function() {
    var name = '';
    do {
      name = js.Patcher.numberToName(this.nextSymbolName);
      this.nextSymbolName = this.nextSymbolName + 1 | 0;
    } while (name in this.reservedNames._table);
    return name;
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
    this.mappings.sort(bindCompare(SourceMapGenerator.comparison));
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
    ANNOTATION: 1,
    ARROW: 2,
    ASSERT: 3,
    ASSIGN: 4,
    ASSIGN_BITWISE_AND: 5,
    ASSIGN_BITWISE_OR: 6,
    ASSIGN_BITWISE_XOR: 7,
    ASSIGN_DIVIDE: 8,
    ASSIGN_MINUS: 9,
    ASSIGN_MULTIPLY: 10,
    ASSIGN_PLUS: 11,
    ASSIGN_REMAINDER: 12,
    ASSIGN_SHIFT_LEFT: 13,
    ASSIGN_SHIFT_RIGHT: 14,
    BITWISE_AND: 15,
    BITWISE_OR: 16,
    BITWISE_XOR: 17,
    BREAK: 18,
    CASE: 19,
    CHARACTER: 20,
    CLASS: 21,
    COLON: 22,
    COMMA: 23,
    CONST: 24,
    CONTINUE: 25,
    DECREMENT: 26,
    DEFAULT: 27,
    DELETE: 28,
    DIVIDE: 29,
    DO: 30,
    DOT: 31,
    DOUBLE: 32,
    DOUBLE_COLON: 33,
    ELSE: 34,
    END_OF_FILE: 35,
    ENUM: 36,
    EQUAL: 37,
    ERROR: 38,
    EXPORT: 39,
    FALSE: 40,
    FINAL: 41,
    FLOAT: 42,
    FOR: 43,
    GREATER_THAN: 44,
    GREATER_THAN_OR_EQUAL: 45,
    IDENTIFIER: 46,
    IF: 47,
    IMPORT: 48,
    IN: 49,
    INCREMENT: 50,
    INLINE: 51,
    INTERFACE: 52,
    INT_BINARY: 53,
    INT_DECIMAL: 54,
    INT_HEX: 55,
    INT_OCTAL: 56,
    IS: 57,
    LEFT_BRACE: 58,
    LEFT_BRACKET: 59,
    LEFT_PARENTHESIS: 60,
    LESS_THAN: 61,
    LESS_THAN_OR_EQUAL: 62,
    LOGICAL_AND: 63,
    LOGICAL_OR: 64,
    MINUS: 65,
    MULTIPLY: 66,
    NAMESPACE: 67,
    NEW: 68,
    NOT: 69,
    NOT_EQUAL: 70,
    NULL: 71,
    OVERRIDE: 72,
    PLUS: 73,
    PRIVATE: 74,
    PROTECTED: 75,
    PUBLIC: 76,
    QUESTION_MARK: 77,
    REMAINDER: 78,
    RETURN: 79,
    RIGHT_BRACE: 80,
    RIGHT_BRACKET: 81,
    RIGHT_PARENTHESIS: 82,
    SEMICOLON: 83,
    SHIFT_LEFT: 84,
    SHIFT_RIGHT: 85,
    STATIC: 86,
    STRING: 87,
    SUPER: 88,
    SWITCH: 89,
    THIS: 90,
    TICK: 91,
    TILDE: 92,
    TRUE: 93,
    USING: 94,
    VAR: 95,
    VIRTUAL: 96,
    WHILE: 97,
    WHITESPACE: 98,
    YY_INVALID_ACTION: 99,
    START_PARAMETER_LIST: 100,
    END_PARAMETER_LIST: 101
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
    if (looksLikeType(type) && pratt.hasPrefixParselet(context)) {
      var value = pratt.parse(context, Precedence.UNARY_PREFIX);
      return Node.createCast(type, value).withRange(context.spanSince(token.range));
    }
    return type;
  };
  function DotPrefixParselet(_0) {
    this.kind = _0;
  }
  DotPrefixParselet.prototype.parse = function(context) {
    var token = context.next();
    var name = parseQuotedName(context);
    return Node.createDotWithKind(this.kind, null, name).withRange(context.spanSince(token.range));
  };
  function QuotedParselet() {
  }
  QuotedParselet.prototype.parse = function(context) {
    var token = context.next();
    var value = pratt.parse(context, Precedence.LOWEST);
    if (value === null || !context.expect(TokenKind.TICK)) {
      return Node.createError().withRange(context.spanSince(token.range));
    }
    return Node.createQuoted(value).withRange(context.spanSince(token.range));
  };
  function SuperParselet() {
  }
  SuperParselet.prototype.parse = function(context) {
    return parseSuperCall(context);
  };
  function BinaryInfixOrUnaryPostfix(_0, _1, _2) {
    this.binary = _0;
    this.unary = _1;
    this.precedence = _2;
  }
  BinaryInfixOrUnaryPostfix.prototype.parse = function(context, left) {
    context.next();
    if (!pratt.hasPrefixParselet(context)) {
      return Node.createUnary(this.unary, left).withRange(context.spanSince(left.range));
    }
    var right = pratt.parse(context, this.precedence);
    return right !== null ? Node.createBinary(this.binary, left, right).withRange(context.spanSince(left.range)) : null;
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
  function DotInfixParselet(_0) {
    this.kind = _0;
  }
  DotInfixParselet.prototype.parse = function(context, left) {
    context.next();
    var name = parseQuotedName(context);
    return Node.createDotWithKind(this.kind, left, name).withRange(context.spanSince(left.range));
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
      this.table._table[kind] = created;
    } else if (precedence > parselet.precedence) {
      parselet.precedence = precedence;
    }
    return parselet;
  };
  Pratt.prototype.parse = function(context, precedence) {
    var token = context.current();
    var parselet = this.table.getOrDefault(token.kind, null);
    if (parselet === null || parselet.prefix === null) {
      context.unexpectedToken();
      return Node.createError().withRange(context.spanSince(token.range));
    }
    var node = this.resume(context, precedence, parselet.prefix.parse(context));
    if (node === null) {
      throw new Error('assert node != null; (src/parser/pratt.sk:108:5)');
    }
    if (node.range.isEmpty()) {
      throw new Error('assert !node.range.isEmpty(); (src/parser/pratt.sk:109:5)');
    }
    return node;
  };
  Pratt.prototype.resume = function(context, precedence, left) {
    if (left === null) {
      throw new Error('assert left != null; (src/parser/pratt.sk:114:5)');
    }
    while (!in_NodeKind.isError(left.kind)) {
      var kind = context.current().kind;
      var parselet = this.table.getOrDefault(kind, null);
      if (parselet === null || parselet.infix === null || parselet.precedence <= precedence) {
        break;
      }
      left = parselet.infix.parse(context, left);
      if (left === null) {
        throw new Error('assert left != null; (src/parser/pratt.sk:122:7)');
      }
      if (left.range.isEmpty()) {
        throw new Error('assert !left.range.isEmpty(); (src/parser/pratt.sk:123:7)');
      }
    }
    return left;
  };
  Pratt.prototype.hasPrefixParselet = function(context) {
    var parselet = this.table.getOrDefault(context.current().kind, null);
    return parselet !== null && parselet.prefix !== null;
  };
  Pratt.prototype.literal = function(kind, callback) {
    this.parselet(kind, Precedence.LOWEST).prefix = new LiteralParselet(callback);
  };
  Pratt.prototype.prefix = function(kind, precedence, callback) {
    this.parselet(kind, Precedence.LOWEST).prefix = new PrefixParselet(callback, precedence);
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
  function VarLiteral() {
  }
  VarLiteral.prototype.parse = function(context, token) {
    return Node.createVar().withRange(token.range);
  };
  function FloatLiteral() {
  }
  FloatLiteral.prototype.parse = function(context, token) {
    return Node.createFloat(parseDoubleLiteral(token.text.slice(0, token.text.length - 1 | 0))).withRange(token.range);
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
    if (this.base === 10 && value !== 0 && token.text.charCodeAt(0) === 48) {
      syntaxWarningOctal(context.log, token.range);
    }
    return Node.createInt(value).withRange(token.range);
  };
  function NameLiteral() {
  }
  NameLiteral.prototype.parse = function(context, token) {
    return Node.createName(token.text).withRange(token.range);
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
      this.symbolToInfoIndex._table[symbol.uniqueID] = this.callInfo.length;
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
    if (!node.type.isIgnored(this.cache) && !node.type.isBool(this.cache)) {
      throw new Error('assert node.type.isIgnored(cache) || node.type.isBool(cache); (src/resolver/constantfolding.sk:17:5)');
    }
    this.flatten(node, new BoolContent(value));
  };
  ConstantFolder.prototype.flattenInt = function(node, value) {
    if (!node.type.isIgnored(this.cache) && !node.type.isInteger(this.cache)) {
      throw new Error('assert node.type.isIgnored(cache) || node.type.isInteger(cache); (src/resolver/constantfolding.sk:23:5)');
    }
    this.flatten(node, new IntContent(value));
  };
  ConstantFolder.prototype.flattenReal = function(node, value) {
    if (!node.type.isIgnored(this.cache) && !node.type.isReal(this.cache)) {
      throw new Error('assert node.type.isIgnored(cache) || node.type.isReal(cache); (src/resolver/constantfolding.sk:29:5)');
    }
    this.flatten(node, new DoubleContent(value));
  };
  ConstantFolder.prototype.flattenString = function(node, value) {
    if (!node.type.isIgnored(this.cache) && !node.type.isString(this.cache)) {
      throw new Error('assert node.type.isIgnored(cache) || node.type.isString(cache); (src/resolver/constantfolding.sk:35:5)');
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
    if (!left.type.isString(this.cache) && !left.type.isIgnored(this.cache)) {
      throw new Error('assert left.type.isString(cache) || left.type.isIgnored(cache); (src/resolver/constantfolding.sk:89:5)');
    }
    if (!right.type.isString(this.cache) && !right.type.isIgnored(this.cache)) {
      throw new Error('assert right.type.isString(cache) || right.type.isIgnored(cache); (src/resolver/constantfolding.sk:90:5)');
    }
    if (right.kind === NodeKind.ADD) {
      var rightLeft = right.binaryLeft();
      var rightRight = right.binaryRight();
      if (!rightLeft.type.isString(this.cache) && !rightLeft.type.isIgnored(this.cache)) {
        throw new Error('assert rightLeft.type.isString(cache) || rightLeft.type.isIgnored(cache); (src/resolver/constantfolding.sk:95:7)');
      }
      if (!rightRight.type.isString(this.cache) && !rightRight.type.isIgnored(this.cache)) {
        throw new Error('assert rightRight.type.isString(cache) || rightRight.type.isIgnored(cache); (src/resolver/constantfolding.sk:96:7)');
      }
      left.swapWith(right);
      left.swapWith(rightRight);
      left.swapWith(rightLeft);
    }
  };
  ConstantFolder.prototype.foldStringConcatenation = function(node) {
    var left = node.binaryLeft();
    var right = node.binaryRight();
    if (!left.type.isString(this.cache) && !left.type.isIgnored(this.cache)) {
      throw new Error('assert left.type.isString(cache) || left.type.isIgnored(cache); (src/resolver/constantfolding.sk:106:5)');
    }
    if (!right.type.isString(this.cache) && !right.type.isIgnored(this.cache)) {
      throw new Error('assert right.type.isString(cache) || right.type.isIgnored(cache); (src/resolver/constantfolding.sk:107:5)');
    }
    if (right.kind === NodeKind.STRING) {
      if (left.kind === NodeKind.STRING) {
        this.flattenString(node, left.asString() + right.asString());
      } else if (left.kind === NodeKind.ADD) {
        var leftLeft = left.binaryLeft();
        var leftRight = left.binaryRight();
        if (!leftLeft.type.isString(this.cache) && !leftLeft.type.isIgnored(this.cache)) {
          throw new Error('assert leftLeft.type.isString(cache) || leftLeft.type.isIgnored(cache); (src/resolver/constantfolding.sk:118:9)');
        }
        if (!leftRight.type.isString(this.cache) && !leftRight.type.isIgnored(this.cache)) {
          throw new Error('assert leftRight.type.isString(cache) || leftRight.type.isIgnored(cache); (src/resolver/constantfolding.sk:119:9)');
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
        this.flattenInt(node, +value.asInt() | 0);
      } else if (kind === NodeKind.NEGATIVE) {
        this.flattenInt(node, -value.asInt() | 0);
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
      case 55:
      case 75:
      case 85:
      case 83:
      case 82:
      case 80:
      case 76:
      case 81:
      case 77:
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
    case 82:
      if (left.isFalse() || right.isTrue()) {
        node.become(left.remove());
      } else if (left.isTrue()) {
        node.become(right.remove());
      }
      break;
    case 83:
      if (left.isTrue() || right.isFalse()) {
        node.become(left.remove());
      } else if (left.isFalse()) {
        node.become(right.remove());
      }
      break;
    case 84:
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
      case 82:
        this.flattenBool(node, left.asBool() && right.asBool());
        break;
      case 83:
        this.flattenBool(node, left.asBool() || right.asBool());
        break;
      case 75:
        this.flattenBool(node, left.asBool() === right.asBool());
        break;
      case 85:
        this.flattenBool(node, left.asBool() !== right.asBool());
        break;
      }
    } else if (left.kind === NodeKind.INT) {
      switch (kind) {
      case 69:
        this.flattenInt(node, left.asInt() + right.asInt() | 0);
        break;
      case 89:
        this.flattenInt(node, left.asInt() - right.asInt() | 0);
        break;
      case 84:
        this.flattenInt(node, $imul(left.asInt(), right.asInt()));
        break;
      case 74:
        this.flattenInt(node, left.asInt() / right.asInt() | 0);
        break;
      case 86:
        this.flattenInt(node, left.asInt() % right.asInt() | 0);
        break;
      case 87:
        this.flattenInt(node, left.asInt() << right.asInt());
        break;
      case 88:
        this.flattenInt(node, left.asInt() >> right.asInt());
        break;
      case 70:
        this.flattenInt(node, left.asInt() & right.asInt());
        break;
      case 71:
        this.flattenInt(node, left.asInt() | right.asInt());
        break;
      case 72:
        this.flattenInt(node, left.asInt() ^ right.asInt());
        break;
      case 75:
        this.flattenBool(node, left.asInt() === right.asInt());
        break;
      case 85:
        this.flattenBool(node, left.asInt() !== right.asInt());
        break;
      case 80:
        this.flattenBool(node, left.asInt() < right.asInt());
        break;
      case 76:
        this.flattenBool(node, left.asInt() > right.asInt());
        break;
      case 81:
        this.flattenBool(node, left.asInt() <= right.asInt());
        break;
      case 77:
        this.flattenBool(node, left.asInt() >= right.asInt());
        break;
      }
    } else if (in_NodeKind.isReal(left.kind)) {
      switch (kind) {
      case 69:
        this.flattenReal(node, left.asDouble() + right.asDouble());
        break;
      case 89:
        this.flattenReal(node, left.asDouble() - right.asDouble());
        break;
      case 84:
        this.flattenReal(node, left.asDouble() * right.asDouble());
        break;
      case 74:
        this.flattenReal(node, left.asDouble() / right.asDouble());
        break;
      case 75:
        this.flattenBool(node, left.asDouble() === right.asDouble());
        break;
      case 85:
        this.flattenBool(node, left.asDouble() !== right.asDouble());
        break;
      case 80:
        this.flattenBool(node, left.asDouble() < right.asDouble());
        break;
      case 76:
        this.flattenBool(node, left.asDouble() > right.asDouble());
        break;
      case 81:
        this.flattenBool(node, left.asDouble() <= right.asDouble());
        break;
      case 77:
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
      if (symbol.isExport()) {
        pass.includeSymbol(symbol);
      }
    }
    var deadSymbolsWithOverrides = [];
    var isFixedPoint = false;
    for (var i = 0; i < allSymbols.length; i = i + 1 | 0) {
      var symbol = allSymbols[i];
      if (!(symbol.uniqueID in pass.includedSymbols._table) && symbol.overriddenMember !== null) {
        deadSymbolsWithOverrides.push(symbol);
      }
    }
    while (!isFixedPoint) {
      isFixedPoint = true;
      for (var i = 0; i < deadSymbolsWithOverrides.length; i = i + 1 | 0) {
        if (pass.includeDueToOverriddenMember(deadSymbolsWithOverrides[i])) {
          isFixedPoint = false;
        }
      }
    }
    for (var i = 0; i < allSymbols.length; i = i + 1 | 0) {
      if (pass.removeSymbolIfDead(allSymbols[i])) {
        allSymbols.splice(i, 1)[0];
        i = i - 1 | 0;
      }
    }
  };
  DeadCodeRemovalPass.prototype.includeSymbol = function(symbol) {
    if (symbol.kind === SymbolKind.GLOBAL_VARIABLE && symbol.isConst() && this.options.foldAllConstants) {
      return;
    }
    if (!(symbol.uniqueID in this.includedSymbols._table)) {
      this.includedSymbols._table[symbol.uniqueID] = true;
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
  DeadCodeRemovalPass.prototype.includeDueToOverriddenMember = function(symbol) {
    if (symbol.overriddenMember === null) {
      throw new Error('assert symbol.overriddenMember != null; (src/resolver/deadcoderemoval.sk:115:5)');
    }
    if (symbol.enclosingSymbol === null) {
      throw new Error('assert symbol.enclosingSymbol != null; (src/resolver/deadcoderemoval.sk:116:5)');
    }
    if (!(symbol.uniqueID in this.includedSymbols._table) && (symbol.overriddenMember.symbol.isImport() || symbol.enclosingSymbol.uniqueID in this.includedSymbols._table && symbol.overriddenMember.symbol.uniqueID in this.includedSymbols._table)) {
      this.includeSymbol(symbol);
      return true;
    }
    return false;
  };
  DeadCodeRemovalPass.prototype.removeSymbolIfDead = function(symbol) {
    if (symbol.kind === SymbolKind.LOCAL_VARIABLE) {
      return false;
    }
    if (!(symbol.uniqueID in this.includedSymbols._table)) {
      if (symbol.enclosingSymbol !== null) {
        delete symbol.enclosingSymbol.type.members._table[symbol.name];
      }
      if (symbol.node !== null && symbol.kind !== SymbolKind.QUOTED_TYPE) {
        symbol.node.remove();
        symbol.node = null;
      }
      return true;
    }
    if (symbol.overriddenMember !== null && !(symbol.overriddenMember.symbol.uniqueID in this.includedSymbols._table)) {
      symbol.overriddenMember = null;
    }
    return false;
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
        this.symbolToInfoIndex._table[info.symbol.uniqueID] = this.inliningInfo.length;
        this.inliningInfo.push(info);
      }
    }
    for (var i = 0; i < this.inliningInfo.length; i = i + 1 | 0) {
      var info = this.inliningInfo[i];
      var callSites = graph.callInfo[graph.symbolToInfoIndex._table[info.symbol.uniqueID]].callSites;
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
        var argumentVariables = symbol.node.functionArguments().children;
        var argumentCounts = new IntMap();
        for (var i = 0; i < argumentVariables.length; i = i + 1 | 0) {
          argumentCounts._table[argumentVariables[i].symbol.uniqueID] = 0;
        }
        if (InliningGraph.recursivelyCountArgumentUses(inlineValue, argumentCounts)) {
          var unusedArguments = [];
          var $arguments = [];
          var isSimpleSubstitution = true;
          for (var i = 0; i < argumentVariables.length; i = i + 1 | 0) {
            var argument = argumentVariables[i].symbol;
            var count = argumentCounts._table[argument.uniqueID];
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
  InliningGraph.recursivelyCountArgumentUses = function(node, argumentCounts) {
    if (node.hasChildren()) {
      for (var i = 0; i < node.children.length; i = i + 1 | 0) {
        var child = node.children[i];
        if (child !== null && !InliningGraph.recursivelyCountArgumentUses(child, argumentCounts)) {
          return false;
        }
      }
    }
    var symbol = node.symbol;
    if (symbol !== null) {
      var count = argumentCounts.getOrDefault(symbol.uniqueID, -1);
      if (count >= 0) {
        argumentCounts._table[symbol.uniqueID] = count + 1 | 0;
        if (node.isStorage()) {
          return false;
        }
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
  function MemberComparison() {
  }
  MemberComparison.prototype.compare = function(left, right) {
    return left.symbol.uniqueID - right.symbol.uniqueID | 0;
  };
  var MatchKind = {
    NONE: 0,
    INEXACT: 1,
    EXACT: 2
  };
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
        throw new Error('assert node.symbol.enclosingSymbol.kind.isTypeWithInstances(); (src/resolver/resolver.sk:29:7)');
      }
      context.symbolForThis = node.symbol.enclosingSymbol;
      context.scope = context.symbolForThis.node.scope;
      if (context.scope === null) {
        throw new Error('assert context.scope != null; (src/resolver/resolver.sk:32:7)');
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
      throw new Error('assert program.kind == .PROGRAM; (src/resolver/resolver.sk:66:5)');
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
        scope.insert(member);
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
      if (node.kind === NodeKind.EXTENSION) {
        semanticErrorUnexpectedModifier(this.log, modifierName.range, name, 'on an extension block');
      } else {
        var flag = nameToSymbolFlag.getOrDefault(name, 0);
        if (flag === 0) {
          flag = SymbolFlag.HAS_ANNOTATIONS;
        } else if ((flags & flag) !== 0) {
          semanticWarningDuplicateModifier(this.log, modifierName.range, name);
        }
        flags |= flag;
      }
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
      node.symbol.flags |= this.symbolFlagsForNode(node);
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
        throw new Error('assert false; (src/resolver/resolver.sk:303:19)');
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
        if (value.type.isIgnored(this.cache)) {
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
        var members = symbol.type.sortedMembers();
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
              block.scope.locals._table[memberSymbol.name] = new Member(collision);
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
      throw new Error('assert node.type != null; (src/resolver/resolver.sk:460:5)');
    }
  };
  Resolver.prototype.resolve = function(node, expectedType) {
    if (node.type !== null) {
      return;
    }
    node.type = this.cache.errorType;
    if (this.context.scope === null && node.kind !== NodeKind.PROGRAM) {
      throw new Error('assert context.scope != null || node.kind == .PROGRAM; (src/resolver/resolver.sk:471:5)');
    }
    var oldScope = this.context.scope;
    var oldType = this.typeContext;
    var kind = node.kind;
    if (node.scope !== null) {
      this.context.scope = node.scope;
    }
    this.typeContext = expectedType;
    switch (kind) {
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
    case 44:
    case 45:
      this.resolveDot(node);
      break;
    case 46:
      this.resolveCall(node);
      break;
    case 47:
      this.resolveSuperCall(node);
      break;
    case 48:
      break;
    case 49:
      this.resolveSequence(node);
      break;
    case 50:
      this.resolveParameterize(node);
      break;
    case 51:
      this.resolveCast(node);
      break;
    case 53:
      this.resolveQuoted(node);
      break;
    case 54:
      this.resolveVar(node);
      break;
    default:
      if (in_NodeKind.isUnaryOperator(kind)) {
        this.resolveUnary(node);
      } else if (in_NodeKind.isBinaryOperator(kind)) {
        this.resolveBinary(node);
      } else if (in_NodeKind.isTernaryOperator(kind)) {
        this.resolveTernary(node);
      } else {
        throw new Error('assert false; (src/resolver/resolver.sk:536:14)');
      }
      break;
    }
    this.context.scope = oldScope;
    this.typeContext = oldType;
    if (node.type === null) {
      throw new Error('assert node.type != null; (src/resolver/resolver.sk:542:5)');
    }
  };
  Resolver.prototype.checkIsParameterized = function(node) {
    if (!node.type.isIgnored(this.cache) && node.type.hasParameters() && !node.type.isParameterized()) {
      semanticErrorUnparameterizedType(this.log, node.range, node.type);
      node.type = this.cache.errorType;
    }
  };
  Resolver.prototype.checkIsType = function(node) {
    if (node.kind === NodeKind.QUOTED) {
      var symbol = this.createSymbol('<quoted>', SymbolKind.QUOTED_TYPE);
      symbol.node = node.quotedValue().remove();
      symbol.type = new Type(symbol);
      node.kind = NodeKind.TYPE;
      node.type = symbol.type;
    } else if (!node.type.isIgnored(this.cache) && !in_NodeKind.isType(node.kind)) {
      semanticErrorUnexpectedExpression(this.log, node.range, node.type);
      node.type = this.cache.errorType;
    }
  };
  Resolver.prototype.checkIsInstance = function(node) {
    if (!node.type.isIgnored(this.cache) && in_NodeKind.isType(node.kind)) {
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
    } else if (!node.type.isIgnored(this.cache) && !in_NodeKind.isCall(kind) && !in_NodeKind.isUnaryStorageOperator(kind) && !in_NodeKind.isBinaryStorageOperator(kind)) {
      semanticWarningUnusedExpression(this.log, node.range);
    }
  };
  Resolver.prototype.checkStorage = function(node) {
    if (node.type.isIgnored(this.cache)) {
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
      throw new Error('assert from != null; (src/resolver/resolver.sk:632:5)');
    }
    if (to === null) {
      throw new Error('assert to != null; (src/resolver/resolver.sk:633:5)');
    }
    if (from.isIgnored(this.cache) || to.isIgnored(this.cache)) {
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
      throw new Error('assert node.parent != null; (src/resolver/resolver.sk:696:5)');
    }
    if (node.parent.kind !== NodeKind.BLOCK) {
      this.unexpectedStatement(node);
    }
  };
  Resolver.prototype.checkDeclarationLocation = function(node, allowDeclaration) {
    if (node.parent === null) {
      throw new Error('assert node.parent != null; (src/resolver/resolver.sk:709:5)');
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
      throw new Error('assert node.parent != null; (src/resolver/resolver.sk:731:5)');
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
    var enclosingSymbol = symbol.enclosingSymbol;
    var functionSymbol = this.context.functionSymbol;
    if (!in_SymbolKind.isInstance(symbol.kind) && symbol.kind !== SymbolKind.OBJECT_PARAMETER) {
      return true;
    }
    if (functionSymbol !== null && in_SymbolKind.isInstance(functionSymbol.kind) && (functionSymbol.enclosingSymbol === enclosingSymbol || functionSymbol.enclosingSymbol.type.hasBaseType(enclosingSymbol.type))) {
      return true;
    }
    if (this.context.symbolForThis === null) {
      semanticErrorUnexpectedThis(this.log, node.range, symbol.name);
      return false;
    }
    if (symbol.kind === SymbolKind.OBJECT_PARAMETER && this.context.symbolForThis === enclosingSymbol) {
      for (var parent = node.parent; !in_NodeKind.isNamedBlockDeclaration(parent.kind); parent = parent.parent) {
        if (parent.kind === NodeKind.NODE_LIST && in_NodeKind.isNamedBlockDeclaration(parent.parent.kind) && parent.parent.symbol === enclosingSymbol && (parent === enclosingSymbol.node.objectParameters() || parent === enclosingSymbol.node.baseTypes())) {
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
            } else if (symbol.type.isClass() && baseType.type.isClass()) {
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
    if (!type.isIgnored(this.cache)) {
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
    this.forbidImportAndExportTogether(symbol);
  };
  Resolver.prototype.initializeNamespace = function(symbol) {
    if (!symbol.type.isNamespace()) {
      throw new Error('assert symbol.type.isNamespace(); (src/resolver/resolver.sk:876:5)');
    }
    this.forbidBlockDeclarationModifiers(symbol, 'on a namespace declaration');
    this.checkNoBaseTypes(symbol, 'A namespace');
  };
  Resolver.prototype.initializeEnum = function(symbol) {
    if (!symbol.type.isEnum()) {
      throw new Error('assert symbol.type.isEnum(); (src/resolver/resolver.sk:882:5)');
    }
    this.forbidBlockDeclarationModifiers(symbol, 'on an enum declaration');
    this.checkNoBaseTypes(symbol, 'An enum');
    if (symbol.type.findMember('toString') === null && !symbol.isImport()) {
      this.addAutoGeneratedMember(symbol.type, 'toString');
    }
  };
  Resolver.prototype.resolveBaseTypes = function(symbol) {
    var type = symbol.type;
    var baseTypes = this.collectAndResolveBaseTypes(symbol);
    var unmergedMembers = new StringMap();
    if (type.relevantTypes !== null) {
      throw new Error('assert type.relevantTypes == null; (src/resolver/resolver.sk:896:5)');
    }
    type.relevantTypes = [];
    for (var i = 0; i < baseTypes.length; i = i + 1 | 0) {
      var base = baseTypes[i];
      var baseType = base.type;
      if (baseType.isIgnored(this.cache)) {
        continue;
      }
      if (symbol.kind === SymbolKind.CLASS && baseType.isClass() && !baseType.isPrimitive()) {
        if (baseTypes.indexOf(base) !== 0) {
          semanticErrorClassBaseNotFirst(this.log, base.range, baseType);
          continue;
        }
      } else if (!baseType.isInterface()) {
        semanticErrorBadBaseType(this.log, base.range, baseType);
        continue;
      }
      if (type.relevantTypes.indexOf(baseType) >= 0) {
        semanticErrorDuplicateBaseType(this.log, base.range, baseType);
        continue;
      }
      if (baseType.hasBaseType(type)) {
        throw new Error('assert !baseType.hasBaseType(type); (src/resolver/resolver.sk:928:7)');
      }
      type.relevantTypes.push(baseType);
      var members = baseType.sortedMembers();
      for (var j = 0; j < members.length; j = j + 1 | 0) {
        var member = members[j];
        var memberSymbol = member.symbol;
        var unmerged = unmergedMembers.getOrDefault(memberSymbol.name, null);
        if (memberSymbol.kind === SymbolKind.OBJECT_PARAMETER) {
          continue;
        }
        if (unmerged === null) {
          unmergedMembers._table[memberSymbol.name] = member;
        } else if (unmerged.symbol.enclosingSymbol !== memberSymbol) {
          var combined = this.createSymbol(memberSymbol.name, SymbolKind.UNMERGED);
          combined.enclosingSymbol = symbol;
          combined.identicalMembers = [unmerged, member];
          unmergedMembers._table[memberSymbol.name] = new Member(combined);
        } else {
          if (unmerged.symbol.kind !== SymbolKind.UNMERGED) {
            throw new Error('assert unmerged.symbol.kind == .UNMERGED; (src/resolver/resolver.sk:960:11)');
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
          throw new Error('assert existing.symbol.overriddenMember == null; (src/resolver/resolver.sk:975:9)');
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
      throw new Error('assert symbol.type.isObject(); (src/resolver/resolver.sk:1001:5)');
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
  Resolver.prototype.createFunctionType = function(symbol, resultType, argumentTypes) {
    if (symbol.hasParameters()) {
      symbol.type = new Type(symbol);
      argumentTypes.unshift(resultType);
      symbol.type.relevantTypes = argumentTypes;
    } else {
      symbol.type = this.cache.functionType(resultType, argumentTypes);
    }
  };
  Resolver.prototype.initializeFunction = function(symbol) {
    var enclosingSymbol = symbol.enclosingSymbol;
    if (enclosingSymbol !== null && in_SymbolKind.isTypeWithInstances(enclosingSymbol.kind) && (this.context.symbolForThis === null || this.context.symbolForThis !== enclosingSymbol)) {
      throw new Error('assert enclosingSymbol == null || !enclosingSymbol.kind.isTypeWithInstances() ||\n      context.symbolForThis != null && context.symbolForThis == enclosingSymbol; (src/resolver/resolver.sk:1032:5)');
    }
    this.unexpectedModifierIfPresent(symbol, SymbolFlag.CONST, 'on a function declaration');
    this.unexpectedModifierIfPresent(symbol, SymbolFlag.FINAL, 'on a function declaration');
    this.checkMemberSymbol(symbol);
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
        throw new Error('assert node.kind == .CONSTRUCTOR; (src/resolver/resolver.sk:1053:7)');
      }
      resultType = this.cache.ensureTypeIsParameterized(enclosingSymbol.type);
      var members = enclosingSymbol.type.sortedMembers();
      for (var i = 0; i < members.length; i = i + 1 | 0) {
        var memberSymbol = members[i].symbol;
        var isImport = memberSymbol.isImport() || enclosingSymbol.isImport() && !memberSymbol.isFromExtension();
        if (!isImport && in_SymbolKind.isFunction(memberSymbol.kind) && memberSymbol.node.functionBlock() === null) {
          enclosingSymbol.reasonForAbstract = memberSymbol;
          enclosingSymbol.flags |= SymbolFlag.ABSTRACT;
          break;
        }
      }
      this.unexpectedModifierIfPresent(symbol, SymbolFlag.STATIC, 'on a constructor');
      this.unexpectedModifierIfPresent(symbol, SymbolFlag.VIRTUAL, 'on a constructor');
      this.unexpectedModifierIfPresent(symbol, SymbolFlag.OVERRIDE, 'on a constructor');
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
      this.createFunctionType(symbol, resultType, argumentTypes);
    }
    var overriddenMember = symbol.overriddenMember;
    if (!symbol.isImport() && enclosingSymbol !== null && enclosingSymbol.isImport()) {
      this.unexpectedModifierIfPresent(symbol, SymbolFlag.VIRTUAL, 'on a non-imported method for an imported type');
      this.unexpectedModifierIfPresent(symbol, SymbolFlag.OVERRIDE, 'on a non-imported method for an imported type');
    } else if (overriddenMember !== null && symbol.kind !== SymbolKind.CONSTRUCTOR_FUNCTION) {
      this.initializeMember(overriddenMember);
      var base = overriddenMember.type;
      var derived = symbol.type;
      if (!base.isIgnored(this.cache) && !derived.isIgnored(this.cache)) {
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
      if (symbol.isOverride()) {
        symbol.flags |= SymbolFlag.VIRTUAL;
      }
      this.unexpectedModifierIfPresent(symbol, SymbolFlag.OVERRIDE, "on a function that doesn't override anything");
    }
  };
  Resolver.prototype.initializeVariable = function(symbol) {
    this.unexpectedModifierIfPresent(symbol, SymbolFlag.INLINE, 'on a variable declaration');
    this.unexpectedModifierIfPresent(symbol, SymbolFlag.VIRTUAL, 'on a variable declaration');
    this.unexpectedModifierIfPresent(symbol, SymbolFlag.OVERRIDE, 'on a variable declaration');
    this.checkMemberSymbol(symbol);
    if (symbol.isConst()) {
      this.redundantModifierIfPresent(symbol, SymbolFlag.FINAL, 'on a const variable declaration');
    }
    var node = symbol.node;
    var variableType = node.variableType();
    if (variableType === null) {
      if (node.parent.kind === NodeKind.VARIABLE_CLUSTER) {
        variableType = node.parent.clusterType().clone();
      } else {
        if (!symbol.isEnumValue()) {
          throw new Error('assert symbol.isEnumValue(); (src/resolver/resolver.sk:1180:9)');
        }
        var enclosingSymbol = symbol.enclosingSymbol;
        var type = enclosingSymbol.type;
        variableType = Node.createType(type).withSymbol(enclosingSymbol);
        symbol.flags |= SymbolFlag.FINAL | SymbolFlag.STATIC | enclosingSymbol.flags & (SymbolFlag.IMPORT | SymbolFlag.EXPORT);
        var variableValue = node.variableValue();
        if (variableValue !== null) {
          this.resolveAsParameterizedExpressionWithTypeContext(variableValue, type);
          this.checkConversion(this.cache.intType, variableValue, CastKind.IMPLICIT_CAST);
          this.constantFolder.foldConstants(variableValue);
          if (variableValue.kind === NodeKind.INT) {
            symbol.constant = variableValue.content;
          } else {
            variableType = Node.createType(this.cache.errorType);
            if (!variableValue.type.isIgnored(this.cache)) {
              semanticErrorBadIntegerConstant(this.log, variableValue.range, variableValue.type);
            }
          }
        } else {
          var index = node.parent.children.indexOf(node);
          if (index > 0) {
            var previous = node.parent.children[index - 1 | 0].symbol;
            this.initializeSymbol(previous);
            if (!previous.type.isIgnored(this.cache)) {
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
        throw new Error('assert variableType != null; (src/resolver/resolver.sk:1231:7)');
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
      if (!base.isIgnored(this.cache) && !derived.isIgnored(this.cache)) {
        semanticErrorBadOverride(this.log, node.declarationName().range, symbol.name, overriddenMember.symbol.enclosingSymbol.type, overriddenMember.symbol.node.declarationName().range);
      }
    }
    if (symbol.isConst()) {
      var value = node.variableValue();
      if (value === null) {
        semanticErrorConstMissingValue(this.log, node.declarationName().range);
      } else {
        this.resolveAsParamterizedExpressionWithConversion(value, symbol.type, CastKind.IMPLICIT_CAST);
        this.constantFolder.foldConstants(value);
        if (in_NodeKind.isConstant(value.kind)) {
          symbol.constant = value.content;
        } else if (!value.type.isIgnored(this.cache) && !symbol.type.isIgnored(this.cache)) {
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
      if (boundType.isIgnored(this.cache)) {
        symbol.type = this.cache.errorType;
      } else if (!boundType.isInterface()) {
        semanticErrorBadTypeParameterBound(this.log, bound.range, boundType);
      } else {
        if (type.relevantTypes !== null) {
          throw new Error('assert type.relevantTypes == null; (src/resolver/resolver.sk:1322:9)');
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
      throw new Error('assert symbol != null; (src/resolver/resolver.sk:1338:5)');
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
      case 10:
        this.initializeNamespace(symbol);
        break;
      case 11:
      case 12:
        this.initializeEnum(symbol);
        break;
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
      case 7:
      case 8:
        this.initializeParameter(symbol);
        break;
      case 6:
        this.initializeAlias(symbol);
        break;
      case 0:
        break;
      default:
        throw new Error('assert false; (src/resolver/resolver.sk:1365:19)');
        break;
      }
      this.context = oldContext;
      this.typeContext = oldTypeContext;
      this.resultType = oldResultType;
      if (symbol.type === null) {
        throw new Error('assert symbol.type != null; (src/resolver/resolver.sk:1372:7)');
      }
      if (!symbol.isInitializing()) {
        throw new Error('assert symbol.isInitializing(); (src/resolver/resolver.sk:1373:7)');
      }
      if (symbol.isInitialized()) {
        throw new Error('assert !symbol.isInitialized(); (src/resolver/resolver.sk:1374:7)');
      }
      symbol.flags = symbol.flags & ~SymbolFlag.INITIALIZING | SymbolFlag.INITIALIZED;
      while (node !== null) {
        var name = node.declarationName();
        name.symbol = symbol;
        name.type = symbol.type;
        node = node.sibling;
      }
      this.checkAnnotations(symbol);
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
        throw new Error('assert member.dependency.symbol == member.symbol; (src/resolver/resolver.sk:1427:7)');
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
  Resolver.prototype.checkAnnotations = function(symbol) {
    if (!symbol.hasAnnotations()) {
      if (in_SymbolKind.isTypeWithInstances(symbol.kind)) {
        var members = symbol.type.sortedMembers();
        for (var i = 0; i < members.length; i = i + 1 | 0) {
          var member = members[i];
          var symbol = member.symbol;
          if (symbol.kind === SymbolKind.INSTANCE_FUNCTION && symbol.hasAnnotations()) {
            this.initializeMember(member);
          }
        }
      }
      return;
    }
    for (var node = symbol.node.parent; node.kind === NodeKind.MODIFIER; node = node.parent) {
      var modifierName = node.modifierName();
      var name = modifierName.asString();
      if (name === '@OperatorAdd') {
        this.registerOperatorOverload(symbol, node, NodeKind.ADD);
      } else if (name === '@OperatorSubtract') {
        this.registerOperatorOverload(symbol, node, NodeKind.SUBTRACT);
      } else if (name === '@OperatorMultiply') {
        this.registerOperatorOverload(symbol, node, NodeKind.MULTIPLY);
      } else if (name === '@OperatorDivide') {
        this.registerOperatorOverload(symbol, node, NodeKind.DIVIDE);
      } else if (name === '@OperatorRemainder') {
        this.registerOperatorOverload(symbol, node, NodeKind.REMAINDER);
      } else if (name === '@OperatorAnd') {
        this.registerOperatorOverload(symbol, node, NodeKind.BITWISE_AND);
      } else if (name === '@OperatorOr') {
        this.registerOperatorOverload(symbol, node, NodeKind.BITWISE_OR);
      } else if (name === '@OperatorXor') {
        this.registerOperatorOverload(symbol, node, NodeKind.BITWISE_XOR);
      } else if (name === '@OperatorGet') {
        this.registerOperatorOverload(symbol, node, NodeKind.INDEX);
      } else if (name === '@OperatorSet') {
        this.registerOperatorOverload(symbol, node, NodeKind.ASSIGN_INDEX);
      } else if (name === '@OperatorComplement') {
        this.registerOperatorOverload(symbol, node, NodeKind.COMPLEMENT);
      } else if (name === '@OperatorNegative') {
        this.registerOperatorOverload(symbol, node, NodeKind.NEGATIVE);
      } else if (name === '@OperatorShiftLeft') {
        this.registerOperatorOverload(symbol, node, NodeKind.SHIFT_LEFT);
      } else if (name === '@OperatorShiftRight') {
        this.registerOperatorOverload(symbol, node, NodeKind.SHIFT_RIGHT);
      } else if (name === '@OperatorCompare') {
        this.registerOperatorOverload(symbol, node, NodeKind.COMPARE);
      } else if (in_string.startsWith(name, '@')) {
        semanticErrorUnknownAnnotation(this.log, modifierName.range, name);
      }
    }
  };
  Resolver.prototype.forbidAnnotationArguments = function(node) {
    var $arguments = node.modifierArguments();
    if ($arguments !== null) {
      var modifierName = node.modifierName();
      semanticErrorUnexpectedAnnotationArguments(this.log, Range.after(node.range, modifierName.range), modifierName.asString());
    }
  };
  Resolver.prototype.registerOperatorOverload = function(symbol, node, kind) {
    if (symbol.kind !== SymbolKind.INSTANCE_FUNCTION) {
      semanticErrorOperatorOnNonInstanceFunction(this.log, node.modifierName().range);
      return;
    }
    var functionArguments = symbol.node.functionArguments();
    var argumentCount = functionArguments.children.length;
    var expectedCount = in_NodeKind.isUnaryOperator(kind) ? 0 : in_NodeKind.isBinaryOperator(kind) ? 1 : 2;
    if (argumentCount !== expectedCount) {
      semanticErrorOperatorArgumentCount(this.log, functionArguments.range, expectedCount, argumentCount, node.modifierName().asString());
      return;
    }
    this.forbidAnnotationArguments(node);
    if (symbol.type.isIgnored(this.cache)) {
      return;
    }
    if (!symbol.type.isFunction()) {
      throw new Error('assert symbol.type.isFunction(); (src/resolver/resolver.sk:1525:5)');
    }
    symbol.enclosingSymbol.operatorOverloadsForKind(kind).push(symbol);
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
      if (nameToSymbolFlag._table[modifierName.asString()] === flag) {
        return modifierName;
      }
      node = node.parent;
    }
    return null;
  };
  Resolver.prototype.checkMemberSymbol = function(symbol) {
    this.forbidImportAndExportTogether(symbol);
    var enclosingSymbol = symbol.enclosingSymbol;
    if (enclosingSymbol !== null) {
      if (!in_SymbolKind.isTypeWithInstances(enclosingSymbol.kind)) {
        this.unexpectedModifierIfPresent(symbol, SymbolFlag.STATIC, 'outside an object declaration');
      }
      if (!symbol.isFromExtension()) {
        if (enclosingSymbol.isImport()) {
          this.redundantModifierIfPresent(symbol, SymbolFlag.IMPORT, 'inside an imported type');
          symbol.flags |= SymbolFlag.IMPORT;
        }
        if (enclosingSymbol.isExport()) {
          this.redundantModifierIfPresent(symbol, SymbolFlag.EXPORT, 'inside an exported type');
          symbol.flags |= SymbolFlag.EXPORT;
        }
      }
      if (enclosingSymbol.kind !== SymbolKind.GLOBAL_NAMESPACE) {
        if (symbol.isImport() && !enclosingSymbol.isImport()) {
          this.unexpectedModifierIfPresent(symbol, SymbolFlag.IMPORT, 'inside a non-imported type');
        }
        if (symbol.isExport() && !enclosingSymbol.isExport()) {
          this.unexpectedModifierIfPresent(symbol, SymbolFlag.EXPORT, 'inside a non-exported type');
        }
      }
    }
  };
  Resolver.prototype.forbidImportAndExportTogether = function(symbol) {
    if (symbol.isImport()) {
      this.unexpectedModifierIfPresent(symbol, SymbolFlag.EXPORT, 'on an imported declaration');
    } else if (symbol.enclosingSymbol !== null && symbol.enclosingSymbol.isImport()) {
      this.unexpectedModifierIfPresent(symbol, SymbolFlag.EXPORT, 'inside an imported type');
    }
  };
  Resolver.prototype.redundantModifierIfPresent = function(symbol, flag, where) {
    if ((symbol.flags & flag) !== 0) {
      var modifierName = this.findModifierName(symbol, flag);
      if (modifierName !== null) {
        semanticErrorRedundantModifier(this.log, modifierName.range, modifierName.asString(), where);
      }
    }
  };
  Resolver.prototype.unexpectedModifierIfPresent = function(symbol, flag, where) {
    if ((symbol.flags & flag) !== 0) {
      var modifierName = this.findModifierName(symbol, flag);
      if (modifierName !== null) {
        semanticErrorUnexpectedModifier(this.log, modifierName.range, modifierName.asString(), where);
      }
    }
    symbol.flags &= ~flag;
  };
  Resolver.prototype.generateDefaultConstructor = function(symbol) {
    var enclosingSymbol = symbol.enclosingSymbol;
    var members = enclosingSymbol.type.sortedMembers();
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
          for (var i = 0; i < argumentTypes.length; i = i + 1 | 0) {
            var name = '_' + $arguments.length;
            var argument = Node.createVariable(Node.createName(name), Node.createType(argumentTypes[i]), null);
            argument.symbol = this.createSymbol(name, SymbolKind.LOCAL_VARIABLE);
            argument.symbol.node = argument;
            $arguments.push(argument);
            superArguments.push(Node.createName(name));
          }
        } else {
          if (!$constructor.type.isIgnored(this.cache)) {
            throw new Error('assert constructor.type.isIgnored(cache); (src/resolver/resolver.sk:1647:11)');
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
          if (member.type.isIgnored(this.cache)) {
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
    uninitializedMembers.sort(bindCompare(Resolver.comparison));
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
      throw new Error('assert enclosingSymbol.node.scope != null; (src/resolver/resolver.sk:1716:5)');
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
      throw new Error('assert symbol.isEnumMember(); (src/resolver/resolver.sk:1731:5)');
    }
    var enclosingSymbol = symbol.enclosingSymbol;
    var enclosingNode = enclosingSymbol.node;
    var members = enclosingSymbol.type.sortedMembers();
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
      if (field.type.isIgnored(this.cache)) {
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
        throw new Error('assert false; (src/resolver/resolver.sk:1813:12)');
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
        throw new Error('assert symbol.node != null; (src/resolver/resolver.sk:1849:7)');
      }
      this.initializeDeclaration(symbol.node);
      if (symbol.isInitializing()) {
        throw new Error('assert !symbol.isInitializing(); (src/resolver/resolver.sk:1851:7)');
      }
      if (!symbol.isInitialized()) {
        throw new Error('assert symbol.isInitialized(); (src/resolver/resolver.sk:1852:7)');
      }
      if (symbol.type === null) {
        throw new Error('assert symbol.type != null; (src/resolver/resolver.sk:1853:7)');
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
      this.resolveAsParamterizedExpressionWithConversion($arguments[i], argumentTypes[i], CastKind.IMPLICIT_CAST);
    }
  };
  Resolver.prototype.resolveAsType = function(node) {
    if (!in_NodeKind.isExpression(node.kind)) {
      throw new Error('assert node.kind.isExpression(); (src/resolver/resolver.sk:1879:5)');
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
      throw new Error('assert node.kind.isExpression(); (src/resolver/resolver.sk:1890:5)');
    }
    this.resolve(node, null);
    this.checkIsInstance(node);
    this.checkIsParameterized(node);
  };
  Resolver.prototype.resolveAsParameterizedExpressionWithTypeContext = function(node, type) {
    if (!in_NodeKind.isExpression(node.kind)) {
      throw new Error('assert node.kind.isExpression(); (src/resolver/resolver.sk:1897:5)');
    }
    this.resolve(node, type);
    this.checkIsInstance(node);
    this.checkIsParameterized(node);
  };
  Resolver.prototype.resolveAsParamterizedExpressionWithConversion = function(node, type, kind) {
    if (!in_NodeKind.isExpression(node.kind)) {
      throw new Error('assert node.kind.isExpression(); (src/resolver/resolver.sk:1904:5)');
    }
    this.resolve(node, type);
    this.checkIsInstance(node);
    this.checkIsParameterized(node);
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
      throw new Error('assert node.parent == null; (src/resolver/resolver.sk:1938:5)');
    }
    this.resolveChildren(node);
  };
  Resolver.prototype.resolveFile = function(node) {
    if (node.parent === null) {
      throw new Error('assert node.parent != null; (src/resolver/resolver.sk:1943:5)');
    }
    if (node.parent.kind !== NodeKind.PROGRAM) {
      throw new Error('assert node.parent.kind == .PROGRAM; (src/resolver/resolver.sk:1944:5)');
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
      throw new Error('assert node.parent != null; (src/resolver/resolver.sk:1965:5)');
    }
    if (node.parent.kind !== NodeKind.SWITCH) {
      throw new Error('assert node.parent.kind == .SWITCH; (src/resolver/resolver.sk:1966:5)');
    }
    if (this.context.switchValue === null) {
      throw new Error('assert context.switchValue != null; (src/resolver/resolver.sk:1967:5)');
    }
    if (this.context.switchValue.type === null) {
      throw new Error('assert context.switchValue.type != null; (src/resolver/resolver.sk:1968:5)');
    }
    var values = node.caseValues();
    var block = node.caseBlock();
    for (var i = 0; i < values.length; i = i + 1 | 0) {
      var value = values[i];
      this.resolveAsParamterizedExpressionWithConversion(value, this.context.switchValue.type, CastKind.IMPLICIT_CAST);
      this.constantFolder.foldConstants(value);
      if (!value.type.isIgnored(this.cache) && !in_NodeKind.isConstant(value.kind)) {
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
    var members = node.symbol.type.sortedMembers();
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
      throw new Error('assert symbol.enclosingSymbol == null || !symbol.enclosingSymbol.kind.isTypeWithInstances() ||\n      context.symbolForThis != null && context.symbolForThis == symbol.enclosingSymbol; (src/resolver/resolver.sk:2052:5)');
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
      if (symbol.type.isIgnored(this.cache)) {
        this.resultType = this.cache.errorType;
      } else if (symbol.kind === SymbolKind.CONSTRUCTOR_FUNCTION) {
        this.resultType = this.cache.voidType;
      } else {
        this.resultType = symbol.type.resultType();
      }
      this.resolve(block, null);
      if (!this.resultType.isIgnored(this.cache) && !this.resultType.isVoid(this.cache) && !block.blockAlwaysEndsWithReturn()) {
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
        if (overriddenType.isIgnored(this.cache)) {
          this.resolveNodesAsExpressions($arguments);
        } else {
          if (!overriddenType.isFunction()) {
            throw new Error('assert overriddenType.isFunction(); (src/resolver/resolver.sk:2121:11)');
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
        var members = enclosingSymbol.type.sortedMembers();
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
          this.resolveAsParamterizedExpressionWithConversion(value, name.symbol.type, CastKind.IMPLICIT_CAST);
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
    if (node.type.isIgnored(this.cache)) {
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
      this.resolveAsParamterizedExpressionWithConversion(value, symbol.isEnumValue() ? this.cache.intType : symbol.type, CastKind.IMPLICIT_CAST);
      if (symbol.kind === SymbolKind.GLOBAL_VARIABLE) {
        this.constantFolder.foldConstants(value);
        if (!this.isPureValue(value) && !symbol.type.isIgnored(this.cache)) {
          semanticErrorNonPureGlobalVariable(this.log, value.range);
          value.type = this.cache.errorType;
        }
      }
    } else if (!symbol.type.isIgnored(this.cache) && node.parent.kind === NodeKind.VARIABLE_CLUSTER && symbol.kind !== SymbolKind.INSTANCE_VARIABLE) {
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
        if (!first.type.isIgnored(this.cache) && !current.type.isIgnored(this.cache) && first.type !== current.type) {
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
    this.resolveAsParamterizedExpressionWithConversion(node.ifTest(), this.cache.boolType, CastKind.IMPLICIT_CAST);
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
      this.resolveAsParamterizedExpressionWithConversion(test, this.cache.boolType, CastKind.IMPLICIT_CAST);
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
    if (!value.type.isIgnored(this.cache)) {
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
      this.resolveAsParamterizedExpressionWithConversion(test, this.cache.boolType, CastKind.IMPLICIT_CAST);
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
      this.resolveAsParamterizedExpressionWithConversion(value, this.resultType, CastKind.IMPLICIT_CAST);
    } else if (!this.resultType.isIgnored(this.cache) && !this.resultType.isVoid(this.cache)) {
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
    this.resolveAsParamterizedExpressionWithConversion(value, this.cache.boolType, CastKind.IMPLICIT_CAST);
    if (node.kind === NodeKind.ASSERT_CONST) {
      this.constantFolder.foldConstants(value);
      if (!value.type.isIgnored(this.cache)) {
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
    if (!value.type.isIgnored(this.cache) && !value.type.isInteger(this.cache)) {
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
        if (caseValue.type.isIgnored(this.cache)) {
          continue;
        }
        if (!in_NodeKind.isConstant(caseValue.kind)) {
          throw new Error('assert caseValue.kind.isConstant(); (src/resolver/resolver.sk:2510:9)');
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
        throw new Error('assert context.symbolForThis != null; (src/resolver/resolver.sk:2559:7)');
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
    this.resolveAsParamterizedExpressionWithConversion(node.hookTest(), this.cache.boolType, CastKind.IMPLICIT_CAST);
    this.resolveAsParameterizedExpressionWithTypeContext(trueNode, this.typeContext);
    this.resolveAsParameterizedExpressionWithTypeContext(falseNode, this.typeContext);
    var trueType = trueNode.type;
    var falseType = falseNode.type;
    if (trueType.isIgnored(this.cache) || falseType.isIgnored(this.cache)) {
      return;
    }
    var commonType = this.cache.commonImplicitType(trueType, falseType);
    if (commonType === null) {
      commonType = this.typeContext;
      if (commonType === null || !this.cache.canImplicitlyConvert(trueType, commonType) || !this.cache.canImplicitlyConvert(falseType, commonType)) {
        semanticErrorNoCommonType(this.log, Range.span(trueNode.range, falseNode.range), trueType, falseType);
        return;
      }
    } else if (commonType === this.cache.intType && this.typeContext !== null && this.typeContext.isEnumFlags()) {
      commonType = this.typeContext;
    }
    this.checkConversion(commonType, trueNode, CastKind.IMPLICIT_CAST);
    this.checkConversion(commonType, falseNode, CastKind.IMPLICIT_CAST);
    node.type = commonType;
  };
  Resolver.prototype.resolveInt = function(node) {
    node.type = this.cache.intType;
  };
  Resolver.prototype.resolveList = function(node) {
    var values = node.listValues();
    if (this.typeContext !== null && this.typeContext.isIgnored(this.cache)) {
      this.resolveNodesAsExpressions(values);
      return;
    }
    if (this.typeContext !== null && this.typeContext.isList(this.cache)) {
      var itemType = this.typeContext.substitutions[0];
      for (var i = 0; i < values.length; i = i + 1 | 0) {
        this.resolveAsParamterizedExpressionWithConversion(values[i], itemType, CastKind.IMPLICIT_CAST);
      }
      node.type = this.typeContext;
      return;
    }
    var commonType = null;
    for (var i = 0; i < values.length; i = i + 1 | 0) {
      var value = values[i];
      this.resolveAsParameterizedExpression(value);
      if (commonType === null || value.type.isIgnored(this.cache)) {
        commonType = value.type;
      } else if (!commonType.isIgnored(this.cache)) {
        commonType = this.cache.commonImplicitType(commonType, value.type);
        if (commonType === null) {
          semanticErrorListTypeInferenceFailed(this.log, node.range);
          commonType = this.cache.errorType;
        }
      }
    }
    if (commonType !== null && commonType.isIgnored(this.cache)) {
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
    var dotName = node.dotName();
    if (target !== null) {
      this.resolve(target, null);
    }
    var type = target !== null ? target.type : this.typeContext;
    if (type === null) {
      semanticErrorMissingTypeContext(this.log, node.range);
      return;
    }
    if (type.isIgnored(this.cache)) {
      return;
    }
    if (node.kind === NodeKind.DOT_ARROW || node.kind === NodeKind.DOT_COLON) {
      semanticErrorBadDotToken(this.log, target !== null ? dotName !== null ? Range.inner(target.range, dotName.range) : Range.after(node.range, target.range) : dotName !== null ? Range.before(node.range, dotName.range) : node.range);
      node.kind = NodeKind.DOT;
    }
    if (dotName === null) {
      return;
    }
    if (dotName.kind === NodeKind.QUOTED) {
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
      throw new Error('assert value.kind.isExpression(); (src/resolver/resolver.sk:2745:5)');
    }
    this.resolve(value, null);
    this.checkIsParameterized(value);
    var valueType = value.type;
    if (valueType.isIgnored(this.cache)) {
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
      if (valueType.isIgnored(this.cache)) {
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
    if (this.context.functionSymbol === null || !this.context.functionSymbol.isObjectMember() || this.context.functionSymbol.overriddenMember === null || this.context.functionSymbol.kind === SymbolKind.CONSTRUCTOR_FUNCTION) {
      semanticErrorBadSuperCall(this.log, node.range);
      this.resolveNodesAsExpressions($arguments);
    } else {
      var member = this.context.functionSymbol.overriddenMember;
      this.initializeMember(member);
      var type = member.type;
      if (type.isIgnored(this.cache) || !type.isFunction()) {
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
        this.resolveAsParamterizedExpressionWithConversion(child, this.typeContext, node.parent.kind === NodeKind.CAST ? CastKind.EXPLICIT_CAST : CastKind.IMPLICIT_CAST);
      }
    }
  };
  Resolver.prototype.resolveParameterize = function(node) {
    var value = node.parameterizeValue();
    var substitutions = node.parameterizeTypes();
    this.resolve(value, null);
    this.resolveNodesAsVariableTypes(substitutions);
    var unparameterized = value.type;
    if (unparameterized.isIgnored(this.cache)) {
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
      throw new Error('assert parameters.size() == sortedParameters.size(); (src/resolver/resolver.sk:2871:5)');
    }
    var sortedTypes = [];
    for (var i = 0; i < sortedParameters.length; i = i + 1 | 0) {
      var parameter = sortedParameters[i];
      var index = parameters.indexOf(parameter);
      var substitution = substitutions[index];
      if (parameter.type.isIgnored(this.cache)) {
        return;
      }
      var bound = parameter.type.bound();
      if (bound !== null) {
        if (i > 0) {
          bound = this.cache.substitute(bound, sortedParameters.slice(0, i), sortedTypes.slice(0, i));
        }
        this.checkConversion(bound, substitution, CastKind.IMPLICIT_CAST);
      }
      if (substitution.type.isIgnored(this.cache)) {
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
    this.resolveAsParamterizedExpressionWithConversion(node.castValue(), type.type, CastKind.EXPLICIT_CAST);
    node.type = type.type;
  };
  Resolver.prototype.traverseQuotedContent = function(node) {
    if (node.kind === NodeKind.QUOTED) {
      var value = node.quotedValue();
      this.resolve(value, null);
      node.become(value);
      return;
    }
    if (node.hasChildren()) {
      for (var i = 0; i < node.children.length; i = i + 1 | 0) {
        var child = node.children[i];
        if (child !== null) {
          this.traverseQuotedContent(child);
        }
      }
    }
    node.type = this.cache.errorType;
  };
  Resolver.prototype.resolveQuoted = function(node) {
    this.traverseQuotedContent(node.quotedValue());
  };
  Resolver.prototype.resolveVar = function(node) {
    semanticErrorUnexpectedNode(this.log, node.range, node.kind);
  };
  Resolver.prototype.resolveUnary = function(node) {
    var kind = node.kind;
    var value = node.unaryValue();
    if (kind === NodeKind.COMPLEMENT && this.typeContext !== null && this.typeContext.isEnumFlags()) {
      this.resolveAsParameterizedExpressionWithTypeContext(value, this.typeContext);
    } else {
      this.resolveAsParameterizedExpression(value);
    }
    var type = value.type;
    if (type.isIgnored(this.cache)) {
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
    if (node.type.isIgnored(this.cache)) {
      this.checkForOperatorOverload(node);
    } else {
      this.checkConversion(node.type, value, CastKind.IMPLICIT_CAST);
    }
  };
  Resolver.prototype.wrapWithToStringCall = function(node) {
    if (node.type.isIgnored(this.cache)) {
      return false;
    }
    var toString = node.type.findMember('toString');
    if (toString === null) {
      semanticErrorMissingToString(this.log, node.range, node.type);
      return false;
    }
    this.initializeMember(toString);
    if (toString.type.isIgnored(this.cache)) {
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
      this.resolveAsParameterizedExpressionWithTypeContext(right, left.type);
    } else if (!this.needsTypeContext(right)) {
      this.resolveAsParameterizedExpression(right);
      this.resolveAsParameterizedExpressionWithTypeContext(left, right.type);
    }
  };
  Resolver.prototype.resolveBinary = function(node) {
    var kind = node.kind;
    var left = node.binaryLeft();
    var right = node.binaryRight();
    if (in_NodeKind.isBinaryStorageOperator(kind)) {
      this.resolveAsParameterizedExpression(left);
      if (!left.type.isIgnored(this.cache)) {
        this.checkStorageOperator(node);
      }
      if (kind === NodeKind.ASSIGN || left.type.isNumeric(this.cache)) {
        this.resolveAsParamterizedExpressionWithConversion(right, left.type, CastKind.IMPLICIT_CAST);
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
        this.resolveAsParameterizedExpressionWithTypeContext(left, this.typeContext);
        this.resolveAsParameterizedExpressionWithTypeContext(right, this.typeContext);
      } else {
        this.resolveWithTypeContextTransfer(left, right);
      }
    }
    this.resolveAsParameterizedExpression(left);
    this.resolveAsParameterizedExpression(right);
    var leftType = left.type;
    var rightType = right.type;
    var commonType = null;
    if (leftType.isIgnored(this.cache) || rightType.isIgnored(this.cache)) {
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
    if (node.type.isIgnored(this.cache)) {
      this.checkForOperatorOverload(node);
    } else if (commonType !== null) {
      this.checkConversion(commonType, left, CastKind.IMPLICIT_CAST);
      this.checkConversion(commonType, right, CastKind.IMPLICIT_CAST);
    }
  };
  Resolver.prototype.resolveTernary = function(node) {
    var left = node.ternaryLeft();
    var middle = node.ternaryMiddle();
    var right = node.ternaryRight();
    this.resolveAsParameterizedExpression(left);
    this.resolveAsParameterizedExpression(middle);
    this.resolveAsParameterizedExpression(right);
    this.checkForOperatorOverload(node);
  };
  Resolver.prototype.assessOperatorOverloadMatch = function(nodeTypes, targetType, argumentTypes) {
    if (nodeTypes.length !== (1 + argumentTypes.length | 0)) {
      throw new Error('assert nodeTypes.size() == 1 + argumentTypes.size(); (src/resolver/resolver.sk:3213:5)');
    }
    var foundImplicitConversion = false;
    for (var i = 0; i < nodeTypes.length; i = i + 1 | 0) {
      var a = nodeTypes[i];
      var b = i === 0 ? targetType : argumentTypes[i - 1 | 0];
      if (a !== b) {
        if (this.cache.canImplicitlyConvert(a, b)) {
          foundImplicitConversion = true;
        } else {
          return MatchKind.NONE;
        }
      }
    }
    return foundImplicitConversion ? MatchKind.INEXACT : MatchKind.EXACT;
  };
  Resolver.prototype.applyOperatorOverload = function(node, member) {
    var symbol = member.symbol;
    var argumentTypes = member.type.argumentTypes();
    var dotTarget = node.children[0].replaceWith(null);
    var dotName = Node.createName(symbol.name).withSymbol(symbol).withType(member.type);
    var value = Node.createDot(dotTarget, dotName).withSymbol(symbol).withType(member.type);
    var $arguments = [];
    for (var i = 0; i < argumentTypes.length; i = i + 1 | 0) {
      var argument = node.children[i + 1 | 0].replaceWith(null);
      this.checkConversion(argumentTypes[i], argument, CastKind.IMPLICIT_CAST);
      $arguments.push(argument);
    }
    node.become(Node.createCall(value, $arguments).withRange(node.range).withType(member.type.resultType()));
  };
  Resolver.prototype.checkForOperatorOverload = function(node) {
    var children = node.children;
    var types = [];
    for (var i = 0; i < children.length; i = i + 1 | 0) {
      var type = children[i].type;
      if (type.isIgnored(this.cache)) {
        return;
      }
      types.push(type);
    }
    var kind = node.kind;
    if (kind === NodeKind.LESS_THAN || kind === NodeKind.LESS_THAN_OR_EQUAL || kind === NodeKind.GREATER_THAN || kind === NodeKind.GREATER_THAN_OR_EQUAL) {
      kind = NodeKind.COMPARE;
    }
    var targetType = types[0];
    var overloads = targetType.symbol.operatorOverloadsForKind(kind);
    var matchKind = MatchKind.INEXACT;
    var matches = [];
    var first = null;
    for (var i = 0; i < overloads.length; i = i + 1 | 0) {
      var overload = overloads[i];
      if (!overload.type.isFunction()) {
        throw new Error('assert overload.type.isFunction(); (src/resolver/resolver.sk:3274:7)');
      }
      if ((overload.type.argumentTypes().length + 1 | 0) !== children.length) {
        throw new Error('assert overload.type.argumentTypes().size() + 1 == children.size(); (src/resolver/resolver.sk:3275:7)');
      }
      var member = targetType.findOperatorOverload(overload);
      this.initializeMember(member);
      if (!member.type.isFunction()) {
        throw new Error('assert member.type.isFunction(); (src/resolver/resolver.sk:3278:7)');
      }
      var matchKind = this.assessOperatorOverloadMatch(types, targetType, member.type.argumentTypes());
      if (matchKind > matchKind) {
        matchKind = matchKind;
        matches = [member];
      } else if (matchKind === matchKind) {
        matches.push(member);
      }
      if (i === 0) {
        first = member;
      }
    }
    if (matches.length === 0 && overloads.length === 1) {
      matches.push(first);
    }
    if (matches.length === 0) {
      semanticErrorNoMatchingOperator(this.log, node.range, node.kind, types);
    } else if (matches.length > 1) {
      var names = [];
      for (var i = 0; i < matches.length; i = i + 1 | 0) {
        names.push(matches[i].symbol.fullName());
      }
      semanticErrorAmbiguousOperator(this.log, node.range, node.kind, names);
    } else {
      var originalKind = node.kind;
      this.applyOperatorOverload(node, matches[0]);
      if (kind === NodeKind.COMPARE) {
        var children = node.removeChildren();
        var clone = node.clone().withChildren(children);
        node.become(Node.createBinary(originalKind, clone, Node.createInt(0).withType(this.cache.intType)).withType(this.cache.boolType));
      }
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
    if (member.symbol.name in this.locals._table) {
      throw new Error('assert !locals.has(member.symbol.name); (src/resolver/scope.sk:26:5)');
    }
    this.locals._table[member.symbol.name] = member;
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
    QUOTED_TYPE: 4,
    OTHER_TYPE: 5,
    ALIAS: 6,
    OBJECT_PARAMETER: 7,
    FUNCTION_PARAMETER: 8,
    GLOBAL_NAMESPACE: 9,
    NAMESPACE: 10,
    ENUM: 11,
    ENUM_FLAGS: 12,
    CLASS: 13,
    INTERFACE: 14,
    GLOBAL_FUNCTION: 15,
    INSTANCE_FUNCTION: 16,
    CONSTRUCTOR_FUNCTION: 17,
    LOCAL_VARIABLE: 18,
    GLOBAL_VARIABLE: 19,
    INSTANCE_VARIABLE: 20
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
    CONST: 1024,
    PURE: 2048,
    EXPORT: 4096,
    IMPORT: 8192,
    INITIALIZING: 16384,
    INITIALIZED: 32768,
    PRIMITIVE: 65536,
    HAS_ANNOTATIONS: 131072,
    HAS_LOCATION_ERROR: 262144,
    INITIALIZE_MASK: 49152
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
    this.operatorOverloads = null;
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
  Symbol.prototype.operatorOverloadsForKind = function(kind) {
    if (this.operatorOverloads === null) {
      this.operatorOverloads = new IntMap();
    }
    var symbols = this.operatorOverloads.getOrDefault(kind, null);
    if (symbols === null) {
      symbols = [];
      this.operatorOverloads._table[kind] = symbols;
    }
    return symbols;
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
      throw new Error('assert (flags & .INITIALIZE_MASK) != .INITIALIZE_MASK; (src/resolver/symbol.sk:313:5)');
    }
    return (this.flags & SymbolFlag.INITIALIZE_MASK) === 0;
  };
  Symbol.prototype.isInitializing = function() {
    if ((this.flags & SymbolFlag.INITIALIZE_MASK) === SymbolFlag.INITIALIZE_MASK) {
      throw new Error('assert (flags & .INITIALIZE_MASK) != .INITIALIZE_MASK; (src/resolver/symbol.sk:318:5)');
    }
    return (this.flags & SymbolFlag.INITIALIZING) !== 0;
  };
  Symbol.prototype.isInitialized = function() {
    if ((this.flags & SymbolFlag.INITIALIZE_MASK) === SymbolFlag.INITIALIZE_MASK) {
      throw new Error('assert (flags & .INITIALIZE_MASK) != .INITIALIZE_MASK; (src/resolver/symbol.sk:323:5)');
    }
    return (this.flags & SymbolFlag.INITIALIZED) !== 0;
  };
  Symbol.prototype.isPrimitive = function() {
    return (this.flags & SymbolFlag.PRIMITIVE) !== 0;
  };
  Symbol.prototype.hasAnnotations = function() {
    return (this.flags & SymbolFlag.HAS_ANNOTATIONS) !== 0;
  };
  Symbol.prototype.hasLocationError = function() {
    return (this.flags & SymbolFlag.HAS_LOCATION_ERROR) !== 0;
  };
  function SymbolComparison() {
  }
  SymbolComparison.prototype.compare = function(left, right) {
    return left.uniqueID - right.uniqueID | 0;
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
      var member = enclosingType.members._table[symbol.name];
      if (member.symbol !== symbol) {
        throw new Error('assert member.symbol == symbol; (src/resolver/symbolmotion.sk:19:7)');
      }
      delete enclosingType.members._table[symbol.name];
      if (shadow.findMember(symbol.name) !== null) {
        throw new Error('assert shadow.findMember(symbol.name) == null; (src/resolver/symbolmotion.sk:21:7)');
      }
      shadow.addMember(member);
      symbol.enclosingSymbol = shadow.symbol;
      symbol.flags &= ~SymbolFlag.STATIC;
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
    this.operatorOverloadCache = null;
    this.uniqueID = Type.generateUniqueID();
    this.symbol = _0;
  }
  Type.generateUniqueID = function() {
    Type.nextUniqueID = Type.nextUniqueID + 1 | 0;
    return Type.nextUniqueID;
  };
  Type.prototype.findOperatorOverload = function(symbol) {
    if (this.operatorOverloadCache === null) {
      this.operatorOverloadCache = new IntMap();
    }
    var member = this.operatorOverloadCache.getOrDefault(symbol.uniqueID, null);
    if (member === null) {
      var list = this.members.values();
      for (var i = 0; i < list.length; i = i + 1 | 0) {
        if (list[i].symbol === symbol) {
          member = list[i];
          break;
        }
      }
    }
    this.operatorOverloadCache._table[symbol.uniqueID] = member;
    return member;
  };
  Type.prototype.sortedMembers = function() {
    var result = this.members.values();
    result.sort(bindCompare(MemberComparison.INSTANCE));
    return result;
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
    this.members._table[member.symbol.name] = member;
  };
  Type.prototype.copyMembersFrom = function(other) {
    var otherMembers = other.members.values();
    for (var i = 0; i < otherMembers.length; i = i + 1 | 0) {
      var member = otherMembers[i];
      if (!(member.symbol.name in this.members._table)) {
        this.members._table[member.symbol.name] = member;
      }
    }
  };
  Type.prototype.findMember = function(name) {
    return this.members.getOrDefault(name, null);
  };
  Type.environmentToString = function(parameters, substitutions) {
    if (parameters.length !== substitutions.length) {
      throw new Error('assert parameters.size() == substitutions.size(); (src/resolver/type.sk:104:5)');
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
      throw new Error('assert substitutions == null || substitutions.size() == symbol.parameters.size(); (src/resolver/type.sk:114:5)');
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
      throw new Error('assert isClass(); (src/resolver/type.sk:154:5)');
    }
    if (!this.hasRelevantTypes()) {
      return null;
    }
    var first = this.relevantTypes[0];
    return first.isClass() ? first : null;
  };
  Type.prototype.bound = function() {
    if (!this.isParameter()) {
      throw new Error('assert isParameter(); (src/resolver/type.sk:161:5)');
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
      throw new Error('assert isFunction(); (src/resolver/type.sk:183:5)');
    }
    if (!this.hasRelevantTypes()) {
      throw new Error('assert hasRelevantTypes(); (src/resolver/type.sk:184:5)');
    }
    return this.relevantTypes[0];
  };
  Type.prototype.argumentTypes = function() {
    if (!this.isFunction()) {
      throw new Error('assert isFunction(); (src/resolver/type.sk:189:5)');
    }
    if (!this.hasRelevantTypes()) {
      throw new Error('assert hasRelevantTypes(); (src/resolver/type.sk:190:5)');
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
  Type.prototype.isIgnored = function(cache) {
    return this.isError(cache) || this.isQuoted();
  };
  Type.prototype.isQuoted = function() {
    return this.symbol !== null && this.symbol.kind === SymbolKind.QUOTED_TYPE;
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
      trace.log('substitute gave ' + result);
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
      this.hashTable._table[hash] = existingTypes;
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
        if (parameterizedType !== null && parameterizedType !== unparameterized) {
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
  var in_string = {};
  var in_List = {};
  var in_NodeKind = {};
  var in_TargetFormat = {};
  var in_int = {};
  var in_Precedence = {};
  var in_SymbolKind = {};
  var in_TokenKind = {};
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
  function bindCompare(comparison) {
    return comparison.compare.bind(comparison);
  }
  in_List.swap = function($this, a, b) {
    var temp = $this[a];
    $this[a] = $this[b];
    $this[b] = temp;
  };
  function checkAllNodeListKinds(node, checker) {
    if (node === null) {
      throw new Error('assert node != null; (src/ast/create.sk:371:3)');
    }
    if (node.kind !== NodeKind.NODE_LIST) {
      throw new Error('assert node.kind == .NODE_LIST; (src/ast/create.sk:372:3)');
    }
    if (node.children === null) {
      throw new Error('assert node.children != null; (src/ast/create.sk:373:3)');
    }
    return checkAllNodeKinds(node.children, checker);
  }
  function checkAllNodeKinds(nodes, checker) {
    if (nodes === null) {
      throw new Error('assert nodes != null; (src/ast/create.sk:378:3)');
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
    return $this >= NodeKind.NOT && $this <= NodeKind.POSTFIX_REFERENCE;
  };
  in_NodeKind.isUnaryTypeOperator = function($this) {
    return $this >= NodeKind.POSTFIX_DEREFERENCE && $this <= NodeKind.POSTFIX_REFERENCE;
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
  in_NodeKind.isDot = function($this) {
    return $this >= NodeKind.DOT && $this <= NodeKind.DOT_COLON;
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
  function createOperatorMap() {
    if (operatorInfo !== null) {
      return;
    }
    operatorInfo = new IntMap();
    operatorInfo._table[NodeKind.NOT] = new OperatorInfo('!', Precedence.UNARY_PREFIX, Associativity.NONE);
    operatorInfo._table[NodeKind.POSITIVE] = new OperatorInfo('+', Precedence.UNARY_PREFIX, Associativity.NONE);
    operatorInfo._table[NodeKind.NEGATIVE] = new OperatorInfo('-', Precedence.UNARY_PREFIX, Associativity.NONE);
    operatorInfo._table[NodeKind.COMPLEMENT] = new OperatorInfo('~', Precedence.UNARY_PREFIX, Associativity.NONE);
    operatorInfo._table[NodeKind.PREFIX_INCREMENT] = new OperatorInfo('++', Precedence.UNARY_PREFIX, Associativity.NONE);
    operatorInfo._table[NodeKind.PREFIX_DECREMENT] = new OperatorInfo('--', Precedence.UNARY_PREFIX, Associativity.NONE);
    operatorInfo._table[NodeKind.POSTFIX_INCREMENT] = new OperatorInfo('++', Precedence.UNARY_POSTFIX, Associativity.NONE);
    operatorInfo._table[NodeKind.POSTFIX_DECREMENT] = new OperatorInfo('--', Precedence.UNARY_POSTFIX, Associativity.NONE);
    operatorInfo._table[NodeKind.PREFIX_DEREFERENCE] = new OperatorInfo('*', Precedence.UNARY_PREFIX, Associativity.NONE);
    operatorInfo._table[NodeKind.PREFIX_REFERENCE] = new OperatorInfo('&', Precedence.UNARY_PREFIX, Associativity.NONE);
    operatorInfo._table[NodeKind.POSTFIX_DEREFERENCE] = new OperatorInfo('*', Precedence.UNARY_POSTFIX, Associativity.NONE);
    operatorInfo._table[NodeKind.POSTFIX_REFERENCE] = new OperatorInfo('&', Precedence.UNARY_POSTFIX, Associativity.NONE);
    operatorInfo._table[NodeKind.NEW] = new OperatorInfo('new', Precedence.UNARY_PREFIX, Associativity.NONE);
    operatorInfo._table[NodeKind.DELETE] = new OperatorInfo('delete', Precedence.UNARY_PREFIX, Associativity.NONE);
    operatorInfo._table[NodeKind.ADD] = new OperatorInfo('+', Precedence.ADD, Associativity.LEFT);
    operatorInfo._table[NodeKind.BITWISE_AND] = new OperatorInfo('&', Precedence.BITWISE_AND, Associativity.LEFT);
    operatorInfo._table[NodeKind.BITWISE_OR] = new OperatorInfo('|', Precedence.BITWISE_OR, Associativity.LEFT);
    operatorInfo._table[NodeKind.BITWISE_XOR] = new OperatorInfo('^', Precedence.BITWISE_XOR, Associativity.LEFT);
    operatorInfo._table[NodeKind.DIVIDE] = new OperatorInfo('/', Precedence.MULTIPLY, Associativity.LEFT);
    operatorInfo._table[NodeKind.EQUAL] = new OperatorInfo('==', Precedence.EQUAL, Associativity.LEFT);
    operatorInfo._table[NodeKind.GREATER_THAN] = new OperatorInfo('>', Precedence.COMPARE, Associativity.LEFT);
    operatorInfo._table[NodeKind.GREATER_THAN_OR_EQUAL] = new OperatorInfo('>=', Precedence.COMPARE, Associativity.LEFT);
    operatorInfo._table[NodeKind.IN] = new OperatorInfo('in', Precedence.COMPARE, Associativity.LEFT);
    operatorInfo._table[NodeKind.INDEX] = new OperatorInfo('[]', Precedence.MEMBER, Associativity.LEFT);
    operatorInfo._table[NodeKind.LESS_THAN] = new OperatorInfo('<', Precedence.COMPARE, Associativity.LEFT);
    operatorInfo._table[NodeKind.LESS_THAN_OR_EQUAL] = new OperatorInfo('<=', Precedence.COMPARE, Associativity.LEFT);
    operatorInfo._table[NodeKind.LOGICAL_AND] = new OperatorInfo('&&', Precedence.LOGICAL_AND, Associativity.LEFT);
    operatorInfo._table[NodeKind.LOGICAL_OR] = new OperatorInfo('||', Precedence.LOGICAL_OR, Associativity.LEFT);
    operatorInfo._table[NodeKind.MULTIPLY] = new OperatorInfo('*', Precedence.MULTIPLY, Associativity.LEFT);
    operatorInfo._table[NodeKind.NOT_EQUAL] = new OperatorInfo('!=', Precedence.EQUAL, Associativity.LEFT);
    operatorInfo._table[NodeKind.REMAINDER] = new OperatorInfo('%', Precedence.MULTIPLY, Associativity.LEFT);
    operatorInfo._table[NodeKind.SHIFT_LEFT] = new OperatorInfo('<<', Precedence.SHIFT, Associativity.LEFT);
    operatorInfo._table[NodeKind.SHIFT_RIGHT] = new OperatorInfo('>>', Precedence.SHIFT, Associativity.LEFT);
    operatorInfo._table[NodeKind.SUBTRACT] = new OperatorInfo('-', Precedence.ADD, Associativity.LEFT);
    operatorInfo._table[NodeKind.ASSIGN] = new OperatorInfo('=', Precedence.ASSIGN, Associativity.RIGHT);
    operatorInfo._table[NodeKind.ASSIGN_ADD] = new OperatorInfo('+=', Precedence.ASSIGN, Associativity.RIGHT);
    operatorInfo._table[NodeKind.ASSIGN_BITWISE_AND] = new OperatorInfo('&=', Precedence.ASSIGN, Associativity.RIGHT);
    operatorInfo._table[NodeKind.ASSIGN_BITWISE_OR] = new OperatorInfo('|=', Precedence.ASSIGN, Associativity.RIGHT);
    operatorInfo._table[NodeKind.ASSIGN_BITWISE_XOR] = new OperatorInfo('^=', Precedence.ASSIGN, Associativity.RIGHT);
    operatorInfo._table[NodeKind.ASSIGN_DIVIDE] = new OperatorInfo('/=', Precedence.ASSIGN, Associativity.RIGHT);
    operatorInfo._table[NodeKind.ASSIGN_MULTIPLY] = new OperatorInfo('*=', Precedence.ASSIGN, Associativity.RIGHT);
    operatorInfo._table[NodeKind.ASSIGN_REMAINDER] = new OperatorInfo('%=', Precedence.ASSIGN, Associativity.RIGHT);
    operatorInfo._table[NodeKind.ASSIGN_SHIFT_LEFT] = new OperatorInfo('<<=', Precedence.ASSIGN, Associativity.RIGHT);
    operatorInfo._table[NodeKind.ASSIGN_SHIFT_RIGHT] = new OperatorInfo('>>=', Precedence.ASSIGN, Associativity.RIGHT);
    operatorInfo._table[NodeKind.ASSIGN_SUBTRACT] = new OperatorInfo('-=', Precedence.ASSIGN, Associativity.RIGHT);
    operatorInfo._table[NodeKind.ASSIGN_INDEX] = new OperatorInfo('[]=', Precedence.ASSIGN, Associativity.RIGHT);
  }
  in_TargetFormat.shouldRunResolver = function($this) {
    return $this >= TargetFormat.NONE && $this <= TargetFormat.JAVASCRIPT;
  };
  in_int.canIncrement = function($this) {
    return ($this + 1 | 0) === $this + 1;
  };
  in_int.canDecrement = function($this) {
    return ($this - 1 | 0) === $this - 1;
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
  function formatNumber(number) {
    return (Math.round(number * 10) / 10).toString();
  }
  function bytesToString(bytes) {
    if (bytes === 1) {
      return '1 byte';
    }
    if (bytes < ByteSize.KB) {
      return bytes + ' bytes';
    }
    if (bytes < ByteSize.MB) {
      return formatNumber(bytes / ByteSize.KB) + 'kb';
    }
    if (bytes < ByteSize.GB) {
      return formatNumber(bytes / ByteSize.MB) + 'mb';
    }
    return formatNumber(bytes / ByteSize.GB) + 'gb';
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
    } else if (flags.target === 'c++') {
      target = TargetFormat.CPP;
    } else if (flags.target === 'lisp') {
      target = TargetFormat.LISP_AST;
    } else if (flags.target === 'json') {
      target = TargetFormat.JSON_AST;
    } else if (flags.target === 'xml') {
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
        frontend.printWithColor(frontend.Color.BOLD, diagnostic.range.locationString() + ': ');
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
        frontend.printWithColor(frontend.Color.GREEN, formatted.range + '\n');
      }
      if (!diagnostic.noteRange.isEmpty()) {
        frontend.printWithColor(frontend.Color.BOLD, diagnostic.noteRange.locationString() + ': ');
        frontend.printNote(diagnostic.noteText);
        var formatted = diagnostic.noteRange.format(io.terminalWidth);
        io.print(formatted.line + '\n');
        frontend.printWithColor(frontend.Color.GREEN, formatted.range + '\n');
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
  frontend.printWithColor = function(color, text) {
    io.setColor(color);
    io.print(text);
    io.setColor(frontend.Color.DEFAULT);
  };
  frontend.printError = function(text) {
    frontend.printWithColor(frontend.Color.RED, 'error: ');
    frontend.printWithColor(frontend.Color.BOLD, text + '\n');
  };
  frontend.printNote = function(text) {
    frontend.printWithColor(frontend.Color.GRAY, 'note: ');
    frontend.printWithColor(frontend.Color.BOLD, text + '\n');
  };
  frontend.printWarning = function(text) {
    frontend.printWithColor(frontend.Color.MAGENTA, 'warning: ');
    frontend.printWithColor(frontend.Color.BOLD, text + '\n');
  };
  frontend.printUsage = function() {
    frontend.printWithColor(frontend.Color.GREEN, '\nusage: ');
    frontend.printWithColor(frontend.Color.BOLD, 'skewc [flags] [inputs]\n');
    io.print('\n  --help (-h)        Print this message.\n\n  --verbose          Print out useful information about the compilation.\n\n  --target=___       Set the target language. Valid target languages: none, js,\n                     c++, lisp, json, and xml.\n\n  --output-file=___  Combines all output into a single file.\n\n  --prepend-file=___ Prepend the contents of this file to the output. Provide\n                     this flag multiple times to prepend multiple files.\n\n  --append-file=___  Append the contents of this file to the output. Provide\n                     this flag multiple times to append multiple files.\n\n  --js-minify        Transform the emitted JavaScript so that it takes up less\n                     space. Make sure to use the "export" modifier on code\n                     that shouldn\'t be minifed.\n\n  --js-source-map    Generate a source map when targeting JavaScript. The source\n                     map will be saved with the ".map" extension in the same\n                     directory as the main output file.\n\n');
  };
  frontend.afterEquals = function(text) {
    var equals = text.indexOf('=');
    if (equals < 0) {
      throw new Error('assert equals >= 0; (src/frontend/frontend.sk:214:5)');
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
      while (yy_current_state !== 268) {
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
          if (yy_current_state >= 269) {
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
      case 82:
      case 81:
      case 80:
        return context.eat(kind);
      case 83:
        if (tokenScan === TokenScan.STOP_BEFORE_NEXT_STATEMENT) {
          return context.eat(kind);
        }
        break;
      case 0:
      case 1:
      case 3:
      case 18:
      case 21:
      case 25:
      case 30:
      case 36:
      case 39:
      case 41:
      case 43:
      case 47:
      case 48:
      case 51:
      case 52:
      case 67:
      case 72:
      case 74:
      case 75:
      case 76:
      case 79:
      case 86:
      case 89:
      case 94:
      case 96:
      case 97:
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
  function parseQuotedName(context) {
    var token = context.current();
    if (context.eat(TokenKind.TICK)) {
      var name = parseName(context);
      if (name === null || !context.expect(TokenKind.TICK)) {
        return null;
      }
      return Node.createQuoted(name).withRange(context.spanSince(token.range));
    }
    return parseName(context);
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
      throw new Error('assert context.current().range.start >= token.range.end; (src/parser/parser.sk:332:3)');
    }
    return Node.createExpression(value).withRange(context.spanSince(token.range));
  }
  function parseModifier(context, hint) {
    var token = context.next();
    var name = Node.createName(token.text).withRange(token.range);
    var block = parseBlockOrStatement(context, hint);
    if (block === null) {
      return null;
    }
    return Node.createModifier(name, null, block.removeChildren()).withRange(context.spanSince(token.range));
  }
  function parseAnnotation(context, hint) {
    var token = context.next();
    var name = Node.createName(token.text).withRange(token.range);
    var $arguments = context.peek(TokenKind.LEFT_PARENTHESIS) ? parseArgumentList(context, TokenKind.LEFT_PARENTHESIS, TokenKind.RIGHT_PARENTHESIS, AllowTrailingComma.NO_TRAILING_COMMA) : null;
    var block = parseBlockOrStatement(context, hint);
    if (block === null) {
      return null;
    }
    return Node.createModifier(name, $arguments, block.removeChildren()).withRange(context.spanSince(token.range));
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
    case 50:
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
      return parseAnnotation(context, hint);
    case 3:
      return parseAssert(context);
    case 18:
      return parseBreak(context);
    case 21:
      return parseObject(context, NodeKind.CLASS);
    case 24:
    case 39:
    case 41:
    case 48:
    case 51:
    case 72:
    case 74:
    case 75:
    case 76:
    case 86:
    case 96:
      return parseModifier(context, hint);
    case 25:
      return parseContinue(context);
    case 30:
      return parseDoWhile(context);
    case 36:
      return parseEnum(context);
    case 43:
      return parseFor(context);
    case 46:
    case 95:
    case 91:
      return parsePossibleTypedDeclaration(context, hint);
    case 47:
      return parseIf(context);
    case 49:
      return parseExtension(context);
    case 52:
      return parseObject(context, NodeKind.INTERFACE);
    case 67:
      return parseNamespace(context);
    case 68:
      if (hint === StatementHint.IN_OBJECT) {
        return parseConstructor(context, hint);
      }
      break;
    case 79:
      return parseReturn(context);
    case 89:
      return parseSwitch(context);
    case 94:
      return parseUsing(context);
    case 97:
      return parseWhile(context);
    }
    return parseExpression(context);
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
    pratt.prefix(TokenKind.MULTIPLY, Precedence.UNARY_PREFIX, new UnaryPrefix(NodeKind.PREFIX_DEREFERENCE));
    pratt.prefix(TokenKind.BITWISE_AND, Precedence.UNARY_PREFIX, new UnaryPrefix(NodeKind.PREFIX_REFERENCE));
    pratt.prefix(TokenKind.NEW, Precedence.UNARY_PREFIX, new UnaryPrefix(NodeKind.NEW));
    pratt.prefix(TokenKind.DELETE, Precedence.UNARY_PREFIX, new UnaryPrefix(NodeKind.DELETE));
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
    pratt.parselet(TokenKind.DOT, Precedence.MEMBER).infix = new DotInfixParselet(NodeKind.DOT);
    pratt.parselet(TokenKind.ARROW, Precedence.MEMBER).infix = new DotInfixParselet(NodeKind.DOT_ARROW);
    pratt.parselet(TokenKind.DOUBLE_COLON, Precedence.MEMBER).infix = new DotInfixParselet(NodeKind.DOT_COLON);
    pratt.parselet(TokenKind.DOT, Precedence.LOWEST).prefix = new DotPrefixParselet(NodeKind.DOT);
    pratt.parselet(TokenKind.DOUBLE_COLON, Precedence.LOWEST).prefix = new DotPrefixParselet(NodeKind.DOT_COLON);
    pratt.parselet(TokenKind.LEFT_PARENTHESIS, Precedence.UNARY_POSTFIX).infix = new CallParselet();
    pratt.parselet(TokenKind.LEFT_BRACKET, Precedence.UNARY_POSTFIX).infix = new IndexParselet();
    pratt.parselet(TokenKind.START_PARAMETER_LIST, Precedence.MEMBER).infix = new ParameterizeParselet();
    pratt.parselet(TokenKind.TICK, Precedence.UNARY_PREFIX).prefix = new QuotedParselet();
    pratt.parselet(TokenKind.SUPER, Precedence.LOWEST).prefix = new SuperParselet();
    pratt.parselet(TokenKind.BITWISE_AND, Precedence.BITWISE_AND).infix = new BinaryInfixOrUnaryPostfix(NodeKind.BITWISE_AND, NodeKind.POSTFIX_REFERENCE, Precedence.BITWISE_AND);
    pratt.parselet(TokenKind.MULTIPLY, Precedence.MULTIPLY).infix = new BinaryInfixOrUnaryPostfix(NodeKind.MULTIPLY, NodeKind.POSTFIX_DEREFERENCE, Precedence.MULTIPLY);
  }
  function typeToText(type) {
    return 'type "' + type + '"';
  }
  function namesToText(names, separator) {
    for (var i = 0; i < names.length; i = i + 1 | 0) {
      names[i] = simpleQuote(names[i]);
    }
    return names.join(separator);
  }
  function typesToText(types, separator) {
    var names = [];
    for (var i = 0; i < types.length; i = i + 1 | 0) {
      names.push(typeToText(types[i]));
    }
    return names.join(separator);
  }
  function expectedCountText(singular, expected, found) {
    return 'Expected ' + expected + ' ' + singular + plural(expected, '', 's') + ' but found ' + found + ' ' + singular + plural(found, '', 's');
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
  function semanticErrorBadDotToken(log, range) {
    log.error(range, 'Use the "." operator for member access');
  }
  function semanticErrorExtensionMissingTarget(log, range, name) {
    log.error(range, 'No type named ' + simpleQuote(name) + ' to extend');
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
    log.error(range, expectedCountText('type parameter', expected, found));
  }
  function semanticErrorArgumentCount(log, range, expected, found) {
    log.error(range, expectedCountText('argument', expected, found));
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
  function semanticErrorBadBaseType(log, range, type) {
    log.error(range, 'Invalid base ' + typeToText(type));
  }
  function semanticErrorDuplicateBaseType(log, range, type) {
    log.error(range, 'Duplicate base ' + typeToText(type));
  }
  function semanticErrorAmbiguousSymbol(log, range, name, names) {
    log.error(range, 'Reference to ' + simpleQuote(name) + ' is ambiguous, could be ' + namesToText(names, ' or '));
  }
  function semanticErrorUnmergedSymbol(log, range, name, types) {
    log.error(range, 'Member ' + simpleQuote(name) + ' has an ambiguous inherited type, could be ' + typesToText(types, ' or '));
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
  function semanticErrorUnknownAnnotation(log, range, name) {
    log.error(range, 'Unknown annotation ' + simpleQuote(name));
  }
  function semanticErrorUnexpectedAnnotationArguments(log, range, name) {
    log.error(range, 'Unexpected arguments for annotation ' + simpleQuote(name));
  }
  function semanticErrorOperatorOnNonInstanceFunction(log, range) {
    log.error(range, 'Operator overloading only applies to instance functions');
  }
  function semanticErrorOperatorArgumentCount(log, range, expected, found, name) {
    log.error(range, expectedCountText('argument', expected, found) + ', required by operator annotation ' + simpleQuote(name));
  }
  function semanticErrorNoMatchingOperator(log, range, kind, types) {
    if (!(kind in operatorInfo._table)) {
      throw new Error('assert operatorInfo.has(kind); (src/resolver/diagnostics.sk:375:3)');
    }
    log.error(range, 'No ' + (types.length === 1 ? 'unary' : types.length === 2 ? 'binary' : 'ternary') + ' operator "' + operatorInfo._table[kind].text + '" for ' + typesToText(types, ' and '));
  }
  function semanticErrorAmbiguousOperator(log, range, kind, names) {
    if (!(kind in operatorInfo._table)) {
      throw new Error('assert operatorInfo.has(kind); (src/resolver/diagnostics.sk:381:3)');
    }
    log.error(range, (names.length === 1 ? 'Unary' : names.length === 2 ? 'Binary' : 'Ternary') + ' operator "' + operatorInfo._table[kind].text + '" is ambiguous, could be ' + namesToText(names, ' or '));
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
      if (symbol.kind === SymbolKind.INSTANCE_FUNCTION && !symbol.isImport() && symbol.node.functionBlock() !== null && (enclosingSymbol.isImport() || in_SymbolKind.isEnum(enclosingSymbol.kind) || (resolver.options.convertAllInstanceToStatic || symbol.isInline()) && !symbol.isExport() && !symbol.isVirtual())) {
        var thisSymbol = resolver.createSymbol('this', SymbolKind.LOCAL_VARIABLE);
        thisSymbol.type = enclosingSymbol.type;
        if (enclosingSymbol.hasParameters()) {
          if (symbol.parameters === null) {
            symbol.parameters = [];
          }
          for (var i = 0; i < enclosingSymbol.parameters.length; i = i + 1 | 0) {
            var parameter = enclosingSymbol.parameters[i];
            var clone = resolver.createSymbol(parameter.name, SymbolKind.FUNCTION_PARAMETER);
            clone.type = new Type(clone);
            symbol.parameters.push(clone);
          }
        }
        thisSymbol.type = resolver.cache.ensureTypeIsParameterized(thisSymbol.type);
        InstanceToStaticPass.recursivelyReplaceThis(symbol.node.functionBlock(), thisSymbol);
        symbol.kind = SymbolKind.GLOBAL_FUNCTION;
        symbol.flags |= SymbolFlag.STATIC;
        var $arguments = symbol.type.argumentTypes();
        $arguments.unshift(thisSymbol.type);
        resolver.createFunctionType(symbol, symbol.type.resultType(), $arguments);
        thisSymbol.node = Node.createVariable(InstanceToStaticPass.createThis(thisSymbol), Node.createType(thisSymbol.type), null).withSymbol(thisSymbol);
        symbol.node.functionArguments().insertChild(0, thisSymbol.node);
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
              throw new Error('assert value.kind == .NAME; (src/resolver/instancetostatic.sk:60:13)');
            }
            target = Node.createThis().withType(thisSymbol.type);
            name = value.replaceWith(null);
          }
          var targetSubstitutions = target.type !== null ? target.type.substitutions : null;
          var nameSubstitutions = name.type !== null ? name.type.substitutions : null;
          if (targetSubstitutions !== null || nameSubstitutions !== null) {
            var types = [];
            if (nameSubstitutions !== null) {
              for (var i = 0; i < nameSubstitutions.length; i = i + 1 | 0) {
                types.push(nameSubstitutions[i]);
              }
            }
            if (targetSubstitutions !== null) {
              for (var i = 0; i < targetSubstitutions.length; i = i + 1 | 0) {
                types.push(targetSubstitutions[i]);
              }
            }
            name.type = resolver.cache.parameterize(symbol.type, types);
          } else {
            name.type = symbol.type;
          }
          callSite.replaceChild(0, name);
          callSite.insertChild(1, target);
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
    } else if (node.isNameExpression() && node.symbol !== null && (node.symbol.kind === SymbolKind.INSTANCE_FUNCTION || node.symbol.kind === SymbolKind.INSTANCE_VARIABLE)) {
      node.become(Node.createDot(InstanceToStaticPass.createThis(symbol), node.clone()).withType(node.type).withRange(node.range).withSymbol(node.symbol));
    } else if (node.hasChildren()) {
      for (var i = 0; i < node.children.length; i = i + 1 | 0) {
        var child = node.children[i];
        if (child !== null) {
          InstanceToStaticPass.recursivelyReplaceThis(child, symbol);
        }
      }
    }
  };
  function createNameToSymbolFlag() {
    if (nameToSymbolFlag !== null) {
      return;
    }
    nameToSymbolFlag = new StringMap();
    nameToSymbolFlag._table['const'] = SymbolFlag.CONST;
    nameToSymbolFlag._table['export'] = SymbolFlag.EXPORT;
    nameToSymbolFlag._table['final'] = SymbolFlag.FINAL;
    nameToSymbolFlag._table['import'] = SymbolFlag.IMPORT;
    nameToSymbolFlag._table['inline'] = SymbolFlag.INLINE;
    nameToSymbolFlag._table['override'] = SymbolFlag.OVERRIDE;
    nameToSymbolFlag._table['private'] = SymbolFlag.PRIVATE;
    nameToSymbolFlag._table['protected'] = SymbolFlag.PROTECTED;
    nameToSymbolFlag._table['public'] = SymbolFlag.PUBLIC;
    nameToSymbolFlag._table['static'] = SymbolFlag.STATIC;
    nameToSymbolFlag._table['virtual'] = SymbolFlag.VIRTUAL;
  }
  function createSymbolFlagToName() {
    if (symbolFlagToName !== null) {
      return;
    }
    symbolFlagToName = new IntMap();
    symbolFlagToName._table[SymbolFlag.CONST] = 'const';
    symbolFlagToName._table[SymbolFlag.EXPORT] = 'export';
    symbolFlagToName._table[SymbolFlag.FINAL] = 'final';
    symbolFlagToName._table[SymbolFlag.IMPORT] = 'import';
    symbolFlagToName._table[SymbolFlag.INLINE] = 'inline';
    symbolFlagToName._table[SymbolFlag.OVERRIDE] = 'override';
    symbolFlagToName._table[SymbolFlag.PRIVATE] = 'private';
    symbolFlagToName._table[SymbolFlag.PROTECTED] = 'protected';
    symbolFlagToName._table[SymbolFlag.PUBLIC] = 'public';
    symbolFlagToName._table[SymbolFlag.STATIC] = 'static';
    symbolFlagToName._table[SymbolFlag.VIRTUAL] = 'virtual';
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
    return $this >= SymbolKind.QUOTED_TYPE && $this <= SymbolKind.INTERFACE;
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
      return 'DOT_ARROW';
    case 45:
      return 'DOT_COLON';
    case 46:
      return 'CALL';
    case 47:
      return 'SUPER_CALL';
    case 48:
      return 'ERROR';
    case 49:
      return 'SEQUENCE';
    case 50:
      return 'PARAMETERIZE';
    case 51:
      return 'CAST';
    case 52:
      return 'IMPLICIT_CAST';
    case 53:
      return 'QUOTED';
    case 54:
      return 'VAR';
    case 55:
      return 'NOT';
    case 56:
      return 'POSITIVE';
    case 57:
      return 'NEGATIVE';
    case 58:
      return 'COMPLEMENT';
    case 59:
      return 'PREFIX_INCREMENT';
    case 60:
      return 'PREFIX_DECREMENT';
    case 61:
      return 'POSTFIX_INCREMENT';
    case 62:
      return 'POSTFIX_DECREMENT';
    case 63:
      return 'NEW';
    case 64:
      return 'DELETE';
    case 65:
      return 'PREFIX_DEREFERENCE';
    case 66:
      return 'PREFIX_REFERENCE';
    case 67:
      return 'POSTFIX_DEREFERENCE';
    case 68:
      return 'POSTFIX_REFERENCE';
    case 69:
      return 'ADD';
    case 70:
      return 'BITWISE_AND';
    case 71:
      return 'BITWISE_OR';
    case 72:
      return 'BITWISE_XOR';
    case 73:
      return 'COMPARE';
    case 74:
      return 'DIVIDE';
    case 75:
      return 'EQUAL';
    case 76:
      return 'GREATER_THAN';
    case 77:
      return 'GREATER_THAN_OR_EQUAL';
    case 78:
      return 'IN';
    case 79:
      return 'INDEX';
    case 80:
      return 'LESS_THAN';
    case 81:
      return 'LESS_THAN_OR_EQUAL';
    case 82:
      return 'LOGICAL_AND';
    case 83:
      return 'LOGICAL_OR';
    case 84:
      return 'MULTIPLY';
    case 85:
      return 'NOT_EQUAL';
    case 86:
      return 'REMAINDER';
    case 87:
      return 'SHIFT_LEFT';
    case 88:
      return 'SHIFT_RIGHT';
    case 89:
      return 'SUBTRACT';
    case 90:
      return 'ASSIGN';
    case 91:
      return 'ASSIGN_ADD';
    case 92:
      return 'ASSIGN_BITWISE_AND';
    case 93:
      return 'ASSIGN_BITWISE_OR';
    case 94:
      return 'ASSIGN_BITWISE_XOR';
    case 95:
      return 'ASSIGN_DIVIDE';
    case 96:
      return 'ASSIGN_MULTIPLY';
    case 97:
      return 'ASSIGN_REMAINDER';
    case 98:
      return 'ASSIGN_SHIFT_LEFT';
    case 99:
      return 'ASSIGN_SHIFT_RIGHT';
    case 100:
      return 'ASSIGN_SUBTRACT';
    case 101:
      return 'ASSIGN_INDEX';
    default:
      return '';
    }
  };
  in_TokenKind.toString = function($this) {
    switch ($this) {
    case 0:
      return 'ALIAS';
    case 1:
      return 'ANNOTATION';
    case 2:
      return 'ARROW';
    case 3:
      return 'ASSERT';
    case 4:
      return 'ASSIGN';
    case 5:
      return 'ASSIGN_BITWISE_AND';
    case 6:
      return 'ASSIGN_BITWISE_OR';
    case 7:
      return 'ASSIGN_BITWISE_XOR';
    case 8:
      return 'ASSIGN_DIVIDE';
    case 9:
      return 'ASSIGN_MINUS';
    case 10:
      return 'ASSIGN_MULTIPLY';
    case 11:
      return 'ASSIGN_PLUS';
    case 12:
      return 'ASSIGN_REMAINDER';
    case 13:
      return 'ASSIGN_SHIFT_LEFT';
    case 14:
      return 'ASSIGN_SHIFT_RIGHT';
    case 15:
      return 'BITWISE_AND';
    case 16:
      return 'BITWISE_OR';
    case 17:
      return 'BITWISE_XOR';
    case 18:
      return 'BREAK';
    case 19:
      return 'CASE';
    case 20:
      return 'CHARACTER';
    case 21:
      return 'CLASS';
    case 22:
      return 'COLON';
    case 23:
      return 'COMMA';
    case 24:
      return 'CONST';
    case 25:
      return 'CONTINUE';
    case 26:
      return 'DECREMENT';
    case 27:
      return 'DEFAULT';
    case 28:
      return 'DELETE';
    case 29:
      return 'DIVIDE';
    case 30:
      return 'DO';
    case 31:
      return 'DOT';
    case 32:
      return 'DOUBLE';
    case 33:
      return 'DOUBLE_COLON';
    case 34:
      return 'ELSE';
    case 35:
      return 'END_OF_FILE';
    case 36:
      return 'ENUM';
    case 37:
      return 'EQUAL';
    case 38:
      return 'ERROR';
    case 39:
      return 'EXPORT';
    case 40:
      return 'FALSE';
    case 41:
      return 'FINAL';
    case 42:
      return 'FLOAT';
    case 43:
      return 'FOR';
    case 44:
      return 'GREATER_THAN';
    case 45:
      return 'GREATER_THAN_OR_EQUAL';
    case 46:
      return 'IDENTIFIER';
    case 47:
      return 'IF';
    case 48:
      return 'IMPORT';
    case 49:
      return 'IN';
    case 50:
      return 'INCREMENT';
    case 51:
      return 'INLINE';
    case 52:
      return 'INTERFACE';
    case 53:
      return 'INT_BINARY';
    case 54:
      return 'INT_DECIMAL';
    case 55:
      return 'INT_HEX';
    case 56:
      return 'INT_OCTAL';
    case 57:
      return 'IS';
    case 58:
      return 'LEFT_BRACE';
    case 59:
      return 'LEFT_BRACKET';
    case 60:
      return 'LEFT_PARENTHESIS';
    case 61:
      return 'LESS_THAN';
    case 62:
      return 'LESS_THAN_OR_EQUAL';
    case 63:
      return 'LOGICAL_AND';
    case 64:
      return 'LOGICAL_OR';
    case 65:
      return 'MINUS';
    case 66:
      return 'MULTIPLY';
    case 67:
      return 'NAMESPACE';
    case 68:
      return 'NEW';
    case 69:
      return 'NOT';
    case 70:
      return 'NOT_EQUAL';
    case 71:
      return 'NULL';
    case 72:
      return 'OVERRIDE';
    case 73:
      return 'PLUS';
    case 74:
      return 'PRIVATE';
    case 75:
      return 'PROTECTED';
    case 76:
      return 'PUBLIC';
    case 77:
      return 'QUESTION_MARK';
    case 78:
      return 'REMAINDER';
    case 79:
      return 'RETURN';
    case 80:
      return 'RIGHT_BRACE';
    case 81:
      return 'RIGHT_BRACKET';
    case 82:
      return 'RIGHT_PARENTHESIS';
    case 83:
      return 'SEMICOLON';
    case 84:
      return 'SHIFT_LEFT';
    case 85:
      return 'SHIFT_RIGHT';
    case 86:
      return 'STATIC';
    case 87:
      return 'STRING';
    case 88:
      return 'SUPER';
    case 89:
      return 'SWITCH';
    case 90:
      return 'THIS';
    case 91:
      return 'TICK';
    case 92:
      return 'TILDE';
    case 93:
      return 'TRUE';
    case 94:
      return 'USING';
    case 95:
      return 'VAR';
    case 96:
      return 'VIRTUAL';
    case 97:
      return 'WHILE';
    case 98:
      return 'WHITESPACE';
    case 99:
      return 'YY_INVALID_ACTION';
    case 100:
      return 'START_PARAMETER_LIST';
    case 101:
      return 'END_PARAMETER_LIST';
    default:
      return '';
    }
  };
  math.INFINITY = Infinity;
  var operatorInfo = null;
  var NATIVE_LIBRARY = '\nimport class int { string toString(); }\nimport class bool { string toString(); }\nimport class float { string toString(); }\nimport class double { string toString(); }\n\nimport class string {\n  int size();\n  string slice(int start, int end);\n  string sliceOne(int index);\n  int indexOf(string value);\n  int lastIndexOf(string value);\n  string toLowerCase();\n  string toUpperCase();\n  static string fromCodeUnit(int value);\n  string join(List<string> values);\n  @OperatorGet int codeUnitAt(int index);\n  bool startsWith(string prefix);\n  bool endsWith(string suffix);\n  string repeat(int count);\n}\n\nimport interface Comparison<T> {\n  virtual int compare(T left, T right);\n}\n\nimport class List<T> {\n  new();\n  int size();\n  void push(T value);\n  void unshift(T value);\n  List<T> slice(int start, int end);\n  int indexOf(T value);\n  int lastIndexOf(T value);\n  T shift();\n  T pop();\n  void reverse();\n  void sort(Comparison<T> comparison);\n  List<T> clone();\n  T remove(int index);\n  void insert(int index, T value);\n  @OperatorGet T get(int index);\n  @OperatorSet void set(int index, T value);\n  void swap(int a, int b);\n}\n\nimport class StringMap<T> {\n  new();\n  @OperatorGet T get(string key);\n  T getOrDefault(string key, T defaultValue);\n  @OperatorSet void set(string key, T value);\n  bool has(string key);\n  void remove(string key);\n  List<string> keys();\n  List<T> values();\n  StringMap<T> clone();\n}\n\nimport class IntMap<T> {\n  new();\n  @OperatorGet T get(int key);\n  T getOrDefault(int key, T defaultValue);\n  @OperatorSet void set(int key, T value);\n  bool has(int key);\n  void remove(int key);\n  List<int> keys();\n  List<T> values();\n  IntMap<T> clone();\n}\n\nimport namespace math {\n  double abs(double x);\n  double sin(double x);\n  double cos(double x);\n  double tan(double x);\n  double asin(double x);\n  double acos(double x);\n  double atan(double x);\n  double atan2(double y, double x);\n  double sqrt(double x);\n  double exp(double x);\n  double log(double x);\n  double pow(double x, double y);\n  double floor(double x);\n  double round(double x);\n  double ceil(double x);\n  double min(double x, double y);\n  double max(double x, double y);\n}\n\nin math {\n  const {\n    double SQRT2 = 1.414213562373095;\n    double PI = 3.141592653589793;\n    double E = 2.718281828459045;\n    double INFINITY = 1 / 0.0;\n    double NAN = 0 / 0.0;\n  }\n}\n';
  var BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  var HEX = '0123456789ABCDEF';
  trace.GENERICS = false;
  cpp.NATIVE_LIBRARY = '\nimport class int {}\nimport class bool {}\nimport class float {}\nimport class double {}\nimport class string {}\n\nin int {\n  string toString() {\n    `std::stringstream` ss;\n    ss << this;\n    return ss.str();\n  }\n}\n\nin bool {\n  inline string toString() { return this ? "true" : "false"; }\n}\n\nin float {\n  inline string toString() {\n    `std::stringstream` ss;\n    ss << this;\n    return ss.str();\n  }\n}\n\nin double {\n  inline string toString() {\n    `std::stringstream` ss;\n    ss << this;\n    return ss.str();\n  }\n}\n\nin string {\n  inline {\n    int size() { return (int)this.`size`(); }\n    string slice(int start, int end) { return this.`substr`(start, end - start); }\n    string sliceOne(int index) { return fromCodeUnit(codeUnitAt(index)); }\n    int indexOf(string value) { return (int)this.`find`(value); }\n    int lastIndexOf(string value) { return (int)this.`rfind`(value); }\n    static string fromCodeUnit(int value) { return `string`(1, value); }\n    @OperatorGet int codeUnitAt(int index) { return `this`[index]; }\n  }\n\n  string toLowerCase() {\n    var clone = this;\n    `std::transform(clone.begin(), clone.end(), clone.begin(), ::tolower)`;\n    return clone;\n  }\n\n  string toUpperCase() {\n    var clone = this;\n    `std::transform(clone.begin(), clone.end(), clone.begin(), ::toupper)`;\n    return clone;\n  }\n\n  string join(List<string> values) {\n    var result = "";\n    for (var i = 0; i < values.size(); i++) {\n      if (i > 0) result += this;\n      result += values[i];\n    }\n    return result;\n  }\n\n  bool startsWith(string prefix) {\n    return size() >= prefix.size() && slice(0, prefix.size()) == prefix;\n  }\n\n  bool endsWith(string suffix) {\n    return size() >= suffix.size() && slice(size() - suffix.size(), size()) == suffix;\n  }\n\n  string repeat(int count) {\n    var result = "";\n    for (var i = 0; i < count; i++) result += this;\n    return result;\n  }\n}\n\ninterface Comparison<T> {\n  virtual int compare(T left, T right);\n}\n\nbool bindCompare<T>(Comparison<T> comparison, T left, T right) {\n  return comparison.compare(left, right) < 0;\n}\n\nclass List<T> {\n  new(`std::initializer_list<T>` list) : _data = list {}\n\n  int size() {\n    return _data.size();\n  }\n\n  void push(T value) {\n    _data.push_back(value);\n  }\n\n  void unshift(T value) {\n    insert(0, value);\n  }\n\n  List<T> slice(int start, int end) {\n    assert start >= 0 && start <= end && end <= size();\n    List<T> slice = [];\n    slice._data.insert(slice._data.begin(), _data.begin() + start, _data.begin() + end);\n    return slice;\n  }\n\n  int indexOf(T value) {\n    int index = `std`::find(_data.begin(), _data.end(), value) - _data.begin();\n    return index == size() ? -1 : index;\n  }\n\n  int lastIndexOf(T value) {\n    int index = `std`::find(_data.rbegin(), _data.rend(), value) - _data.rbegin();\n    return size() - index - 1;\n  }\n\n  T shift() {\n    T value = this[0];\n    remove(0);\n    return value;\n  }\n\n  T pop() {\n    T value = this[size() - 1];\n    _data.pop_back();\n    return value;\n  }\n\n  void reverse() {\n    `std`::reverse(_data.begin(), _data.end());\n  }\n\n  void sort(Comparison<T> comparison) {\n    `std`::sort(_data.begin(), _data.end(), `std`::bind(`&`bindCompare`<T>`, comparison, `std`::placeholders::_1, `std`::placeholders::_2));\n  }\n\n  List<T> clone() {\n    List<T> clone = [];\n    clone._data = _data;\n    return clone;\n  }\n\n  T remove(int index) {\n    T value = this[index];\n    _data.erase(_data.begin() + index);\n    return value;\n  }\n\n  void insert(int index, T value) {\n    assert index >= 0 && index <= size();\n    _data.insert(_data.begin() + index, value);\n  }\n\n  @OperatorGet\n  T get(int index) {\n    assert index >= 0 && index < size();\n    return _data[index];\n  }\n\n  @OperatorSet\n  void set(int index, T value) {\n    assert index >= 0 && index < size();\n    _data[index] = value;\n  }\n\n  void swap(int a, int b) {\n    assert a >= 0 && a < size();\n    assert b >= 0 && b < size();\n    `std`::swap(_data[a], _data[b]);\n  }\n\n  `std::vector<T>` _data;\n}\n\nclass StringMap<T> {\n  new() {}\n  @OperatorGet T get(string key) { return _table[key]; }\n  T getOrDefault(string key, T defaultValue) { `auto` it = _table.find(key); return it != _table.end() ? it->second : defaultValue; }\n  @OperatorSet void set(string key, T value) { _table[key] = value; }\n  bool has(string key) { return _table.count(key); }\n  void remove(string key) { _table.erase(key); }\n  List<string> keys() { List<string> keys = []; for (`(auto &)` it in _table) keys.push(it.first); return keys; }\n  List<T> values() { List<T> values = []; for (`(auto &)` it in _table) values.push(it.second); return values; }\n  StringMap<T> clone() { var clone = StringMap<T>(); clone._table = _table; return clone; }\n\n  `std::unordered_map<string, T>` _table;\n}\n\nclass IntMap<T> {\n  new() {}\n  @OperatorGet T get(int key) { return _table[key]; }\n  T getOrDefault(int key, T defaultValue) { `auto` it = _table.find(key); return it != _table.end() ? it->second : defaultValue; }\n  @OperatorSet void set(int key, T value) { _table[key] = value; }\n  bool has(int key) { return _table.count(key); }\n  void remove(int key) { _table.erase(key); }\n  List<int> keys() { List<int> keys = []; for (`(auto &)` it in _table) keys.push(it.first); return keys; }\n  List<T> values() { List<T> values = []; for (`(auto &)` it in _table) values.push(it.second); return values; }\n  StringMap<T> clone() { var clone = StringMap<T>(); clone._table = _table; return clone; }\n\n  `std::unordered_map<int, T>` _table;\n}\n\nnamespace math {\n  inline {\n    double abs(double x) { return `std`::abs(x); }\n    double sin(double x) { return `std`::sin(x); }\n    double cos(double x) { return `std`::cos(x); }\n    double tan(double x) { return `std`::tan(x); }\n    double asin(double x) { return `std`::asin(x); }\n    double acos(double x) { return `std`::acos(x); }\n    double atan(double x) { return `std`::atan(x); }\n    double atan2(double y, double x) { return `std`::atan2(y, x); }\n    double sqrt(double x) { return `std`::sqrt(x); }\n    double exp(double x) { return `std`::exp(x); }\n    double log(double x) { return `std`::log(x); }\n    double pow(double x, double y) { return `std`::pow(x, y); }\n    double floor(double x) { return `std`::floor(x); }\n    double round(double x) { return `std`::round(x); }\n    double ceil(double x) { return `std`::ceil(x); }\n    double min(double x, double y) { return `std`::fmin(x, y); }\n    double max(double x, double y) { return `std`::fmax(x, y); }\n  }\n\n  const {\n    double SQRT2 = 1.414213562373095;\n    double PI = 3.141592653589793;\n    double E = 2.718281828459045;\n    double INFINITY = 1 / 0.0;\n    double NAN = 0 / 0.0;\n  }\n}\n';
  js.NATIVE_LIBRARY = '\nimport class int { string toString(); }\nimport class bool { string toString(); }\nimport class float { string toString(); }\nimport class double { string toString(); }\n\nimport class string {\n  string slice(int start, int end);\n  int indexOf(string value);\n  int lastIndexOf(string value);\n  string toLowerCase();\n  string toUpperCase();\n}\n\nin string {\n  inline {\n    int size() { return this.`length`; }\n    static string fromCodeUnit(int value) { return `String`.fromCharCode(value); }\n    string sliceOne(int index) { return `this`[index]; }\n    string join(List<string> values) { return values.`join`(this); }\n    @OperatorGet int codeUnitAt(int index) { return this.`charCodeAt`(index); }\n  }\n\n  bool startsWith(string prefix) { return size() >= prefix.size() && slice(0, prefix.size()) == prefix; }\n  bool endsWith(string suffix) { return size() >= suffix.size() && slice(size() - suffix.size(), size()) == suffix; }\n  string repeat(int count) { var result = ""; for (var i = 0; i < count; i++) result += this; return result; }\n}\n\ninterface Comparison<T> {\n  virtual int compare(T left, T right);\n}\n\nvoid bindCompare<T>(Comparison<T> comparison) {\n  return comparison.compare.`bind`(comparison);\n}\n\nimport class List<T> {\n  new();\n  void push(T value);\n  void unshift(T value);\n  List<T> slice(int start, int end);\n  int indexOf(T value);\n  int lastIndexOf(T value);\n  T shift();\n  T pop();\n  void reverse();\n}\n\nin List {\n  inline {\n    int size() { return this.`length`; }\n    void sort(Comparison<T> comparison) { this.`sort`(bindCompare<T>(comparison)); }\n    List<T> clone() { return this.`slice`(); }\n    T remove(int index) { return this.`splice`(index, 1)[0]; }\n    void insert(int index, T value) { this.`splice`(index, 0, value); }\n    @OperatorGet T get(int index) { return `this`[index]; }\n    @OperatorSet void set(int index, T value) { `this`[index] = value; }\n  }\n\n  void swap(int a, int b) { var temp = this[a]; this[a] = this[b]; this[b] = temp; }\n}\n\nclass StringMap<T> {\n  var _table = `Object`.create(null);\n\n  inline {\n    @OperatorGet T get(string key) { return _table[key]; }\n    @OperatorSet void set(string key, T value) { _table[key] = value; }\n    bool has(string key) { return key in _table; }\n    void remove(string key) { delete _table[key]; }\n  }\n\n  T getOrDefault(string key, T defaultValue) {\n    return has(key) ? this[key] : defaultValue;\n  }\n\n  List<string> keys() {\n    List<string> keys = [];\n    for (string key in _table) keys.push(key);\n    return keys;\n  }\n\n  List<T> values() {\n    List<T> values = [];\n    for (string key in _table) values.push(this[key]);\n    return values;\n  }\n\n  StringMap<T> clone() {\n    var clone = StringMap<T>();\n    for (string key in _table) clone[key] = this[key];\n    return clone;\n  }\n}\n\nclass IntMap<T> {\n  var _table = `Object`.create(null);\n\n  inline {\n    @OperatorGet T get(int key) { return _table[key]; }\n    @OperatorSet void set(int key, T value) { _table[key] = value; }\n    bool has(int key) { return key in _table; }\n    void remove(int key) { delete _table[key]; }\n  }\n\n  T getOrDefault(int key, T defaultValue) {\n    return has(key) ? this[key] : defaultValue;\n  }\n\n  List<int> keys() {\n    List<int> keys = [];\n    for (double key in _table) keys.push((int)key);\n    return keys;\n  }\n\n  List<T> values() {\n    List<T> values = [];\n    for (int key in _table) values.push(this[key]);\n    return values;\n  }\n\n  IntMap<T> clone() {\n    var clone = IntMap<T>();\n    for (int key in _table) clone[key] = this[key];\n    return clone;\n  }\n}\n\nnamespace math {\n  inline {\n    double abs(double x) { return `Math`.abs(x); }\n    double sin(double x) { return `Math`.sin(x); }\n    double cos(double x) { return `Math`.cos(x); }\n    double tan(double x) { return `Math`.tan(x); }\n    double asin(double x) { return `Math`.asin(x); }\n    double acos(double x) { return `Math`.acos(x); }\n    double atan(double x) { return `Math`.atan(x); }\n    double atan2(double y, double x) { return `Math`.atan2(y, x); }\n    double sqrt(double x) { return `Math`.sqrt(x); }\n    double exp(double x) { return `Math`.exp(x); }\n    double log(double x) { return `Math`.log(x); }\n    double pow(double x, double y) { return `Math`.pow(x, y); }\n    double floor(double x) { return `Math`.floor(x); }\n    double round(double x) { return `Math`.round(x); }\n    double ceil(double x) { return `Math`.ceil(x); }\n    double min(double x, double y) { return `Math`.min(x, y); }\n    double max(double x, double y) { return `Math`.max(x, y); }\n  }\n\n  const {\n    double SQRT2 = 1.414213562373095;\n    double PI = 3.141592653589793;\n    double E = 2.718281828459045;\n    double INFINITY = 1 / 0.0;\n    double NAN = 0 / 0.0;\n  }\n}\n';
  var yy_accept = [99, 99, 99, 35, 38, 98, 69, 38, 78, 15, 38, 60, 82, 66, 73, 23, 65, 31, 29, 54, 54, 22, 83, 61, 4, 44, 77, 38, 46, 59, 81, 17, 91, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 58, 16, 80, 92, 98, 70, 99, 87, 99, 12, 63, 5, 99, 20, 99, 10, 50, 11, 26, 9, 2, 32, 99, 98, 8, 99, 54, 99, 99, 42, 99, 99, 33, 84, 62, 37, 45, 85, 1, 46, 7, 46, 46, 46, 46, 46, 46, 46, 30, 46, 46, 46, 46, 46, 46, 47, 46, 49, 57, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 6, 64, 99, 42, 99, 99, 99, 98, 99, 53, 56, 55, 13, 14, 1, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 43, 46, 46, 46, 46, 68, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 95, 46, 46, 99, 98, 32, 46, 46, 46, 19, 46, 46, 46, 46, 46, 34, 36, 46, 46, 46, 46, 46, 46, 46, 71, 46, 46, 46, 46, 46, 46, 46, 46, 90, 93, 46, 46, 46, 32, 0, 46, 18, 21, 24, 46, 46, 46, 46, 40, 41, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 88, 46, 94, 46, 97, 3, 46, 46, 28, 39, 48, 51, 46, 46, 46, 46, 46, 76, 79, 86, 89, 46, 46, 27, 46, 46, 46, 74, 46, 96, 25, 46, 46, 72, 46, 52, 67, 75, 99];
  var yy_ec = [0, 1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 4, 5, 1, 1, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 19, 19, 19, 19, 19, 20, 20, 21, 22, 23, 24, 25, 26, 27, 28, 28, 28, 28, 29, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 31, 32, 33, 34, 30, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 30, 45, 46, 47, 48, 49, 50, 30, 51, 52, 53, 54, 55, 56, 57, 30, 30, 58, 59, 60, 61, 1];
  var yy_meta = [0, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 3, 3, 1, 1, 1, 1, 1, 1, 1, 4, 4, 5, 1, 1, 1, 1, 1, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 1, 1, 1, 1];
  var yy_base = [0, 0, 0, 375, 376, 60, 350, 59, 349, 58, 58, 376, 376, 348, 55, 376, 56, 54, 72, 82, 88, 350, 376, 45, 346, 51, 376, 0, 0, 376, 376, 345, 376, 32, 317, 49, 37, 64, 88, 68, 90, 312, 38, 326, 80, 84, 313, 102, 321, 376, 89, 376, 376, 91, 376, 82, 376, 360, 376, 376, 376, 110, 376, 359, 376, 376, 376, 376, 376, 376, 132, 129, 0, 376, 136, 145, 129, 140, 376, 149, 0, 376, 337, 376, 376, 376, 336, 0, 0, 376, 315, 306, 317, 304, 319, 306, 129, 0, 301, 298, 301, 304, 301, 297, 0, 297, 123, 0, 299, 289, 298, 303, 133, 305, 288, 304, 289, 294, 293, 282, 291, 283, 282, 288, 376, 376, 166, 376, 168, 172, 176, 0, 176, 172, 180, 0, 376, 376, 0, 295, 290, 293, 288, 275, 148, 290, 285, 284, 276, 273, 269, 284, 0, 270, 274, 277, 276, 0, 269, 263, 258, 259, 265, 256, 256, 268, 254, 254, 265, 256, 0, 250, 256, 185, 376, 189, 249, 249, 254, 0, 246, 244, 252, 241, 241, 0, 0, 242, 252, 245, 239, 241, 237, 235, 0, 235, 249, 244, 239, 231, 237, 229, 241, 0, 0, 236, 223, 236, 193, 0, 222, 0, 0, 0, 226, 227, 232, 218, 0, 0, 217, 216, 192, 182, 187, 176, 190, 189, 178, 187, 0, 181, 0, 187, 0, 0, 168, 168, 0, 0, 0, 0, 184, 183, 179, 177, 163, 0, 0, 0, 0, 169, 174, 0, 153, 143, 131, 0, 119, 0, 0, 107, 85, 0, 65, 0, 0, 0, 376, 234, 239, 241, 244, 249, 254, 257, 259, 264];
  var yy_def = [0, 268, 1, 268, 268, 268, 268, 269, 268, 268, 270, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 271, 272, 268, 268, 268, 268, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 268, 268, 268, 268, 268, 268, 269, 268, 269, 268, 268, 268, 270, 268, 270, 268, 268, 268, 268, 268, 268, 268, 273, 274, 268, 268, 268, 268, 268, 268, 268, 275, 268, 268, 268, 268, 268, 268, 276, 272, 268, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 268, 268, 268, 268, 273, 277, 273, 274, 268, 268, 268, 275, 268, 268, 276, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 268, 268, 268, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 268, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 0, 268, 268, 268, 268, 268, 268, 268, 268, 268];
  var yy_nxt = [0, 4, 5, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 20, 20, 21, 22, 23, 24, 25, 26, 27, 28, 28, 28, 29, 4, 30, 31, 32, 33, 34, 35, 36, 37, 38, 28, 28, 39, 28, 28, 28, 40, 41, 42, 43, 44, 45, 46, 47, 48, 28, 49, 50, 51, 52, 53, 53, 56, 59, 62, 65, 82, 83, 67, 70, 70, 70, 70, 85, 86, 96, 90, 66, 68, 69, 60, 71, 91, 93, 97, 56, 72, 112, 63, 57, 113, 53, 53, 94, 73, 74, 95, 75, 75, 75, 75, 74, 267, 75, 75, 75, 75, 104, 98, 76, 99, 124, 57, 105, 106, 76, 62, 77, 107, 100, 76, 78, 101, 266, 108, 118, 76, 78, 109, 79, 102, 115, 116, 119, 117, 103, 121, 80, 129, 132, 63, 132, 110, 130, 122, 265, 125, 70, 70, 70, 70, 70, 70, 70, 70, 133, 133, 264, 74, 126, 75, 75, 75, 75, 134, 134, 134, 154, 145, 263, 126, 127, 76, 146, 155, 160, 173, 129, 173, 262, 161, 129, 130, 76, 78, 129, 174, 133, 133, 261, 130, 175, 175, 175, 175, 134, 134, 134, 181, 182, 208, 208, 208, 208, 175, 175, 175, 175, 208, 208, 208, 208, 260, 259, 258, 257, 256, 255, 254, 253, 252, 251, 250, 249, 248, 247, 246, 245, 78, 244, 243, 242, 127, 55, 55, 55, 55, 55, 61, 61, 61, 61, 61, 87, 87, 88, 88, 88, 128, 128, 128, 128, 128, 131, 241, 131, 131, 131, 135, 135, 138, 138, 138, 130, 130, 130, 130, 130, 240, 239, 238, 237, 236, 235, 234, 233, 232, 231, 230, 229, 228, 227, 226, 225, 224, 223, 222, 221, 220, 219, 218, 217, 216, 215, 214, 213, 212, 211, 210, 209, 207, 206, 205, 204, 203, 202, 201, 200, 199, 198, 197, 196, 195, 194, 193, 192, 191, 190, 189, 188, 187, 186, 185, 184, 183, 180, 179, 178, 177, 176, 172, 171, 170, 169, 168, 167, 166, 165, 164, 163, 162, 159, 158, 157, 156, 153, 152, 151, 150, 149, 148, 147, 144, 143, 142, 141, 140, 139, 137, 136, 268, 268, 123, 120, 114, 111, 92, 89, 84, 81, 64, 58, 54, 268, 3, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268];
  var yy_chk = [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 5, 5, 7, 9, 10, 14, 23, 23, 16, 17, 17, 17, 17, 25, 25, 36, 33, 14, 16, 16, 9, 18, 33, 35, 36, 55, 18, 42, 10, 7, 42, 53, 53, 35, 18, 19, 35, 19, 19, 19, 19, 20, 264, 20, 20, 20, 20, 39, 37, 19, 37, 50, 55, 39, 39, 20, 61, 19, 39, 37, 19, 19, 38, 262, 40, 45, 20, 20, 40, 19, 38, 44, 44, 45, 44, 38, 47, 19, 71, 76, 61, 76, 40, 71, 47, 261, 50, 70, 70, 70, 70, 74, 74, 74, 74, 77, 77, 258, 75, 70, 75, 75, 75, 75, 79, 79, 79, 106, 96, 256, 70, 70, 75, 96, 106, 112, 126, 128, 126, 255, 112, 129, 128, 75, 75, 130, 129, 133, 133, 254, 130, 132, 132, 132, 132, 134, 134, 134, 144, 144, 173, 173, 173, 173, 175, 175, 175, 175, 208, 208, 208, 208, 252, 251, 246, 245, 244, 243, 242, 237, 236, 233, 231, 229, 228, 227, 226, 225, 175, 224, 223, 222, 208, 269, 269, 269, 269, 269, 270, 270, 270, 270, 270, 271, 271, 272, 272, 272, 273, 273, 273, 273, 273, 274, 221, 274, 274, 274, 275, 275, 276, 276, 276, 277, 277, 277, 277, 277, 220, 217, 216, 215, 214, 210, 207, 206, 205, 202, 201, 200, 199, 198, 197, 196, 195, 193, 192, 191, 190, 189, 188, 187, 184, 183, 182, 181, 180, 178, 177, 176, 172, 171, 169, 168, 167, 166, 165, 164, 163, 162, 161, 160, 159, 158, 156, 155, 154, 153, 151, 150, 149, 148, 147, 146, 145, 143, 142, 141, 140, 139, 123, 122, 121, 120, 119, 118, 117, 116, 115, 114, 113, 111, 110, 109, 108, 105, 103, 102, 101, 100, 99, 98, 95, 94, 93, 92, 91, 90, 86, 82, 63, 57, 48, 46, 43, 41, 34, 31, 24, 21, 13, 8, 6, 3, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268, 268];
  var pratt = null;
  var nameToSymbolFlag = null;
  var symbolFlagToName = null;
  Compiler.nativeLibrary = new CachedSource('\nimport class int { string toString(); }\nimport class bool { string toString(); }\nimport class float { string toString(); }\nimport class double { string toString(); }\n\nimport class string {\n  int size();\n  string slice(int start, int end);\n  string sliceOne(int index);\n  int indexOf(string value);\n  int lastIndexOf(string value);\n  string toLowerCase();\n  string toUpperCase();\n  static string fromCodeUnit(int value);\n  string join(List<string> values);\n  @OperatorGet int codeUnitAt(int index);\n  bool startsWith(string prefix);\n  bool endsWith(string suffix);\n  string repeat(int count);\n}\n\nimport interface Comparison<T> {\n  virtual int compare(T left, T right);\n}\n\nimport class List<T> {\n  new();\n  int size();\n  void push(T value);\n  void unshift(T value);\n  List<T> slice(int start, int end);\n  int indexOf(T value);\n  int lastIndexOf(T value);\n  T shift();\n  T pop();\n  void reverse();\n  void sort(Comparison<T> comparison);\n  List<T> clone();\n  T remove(int index);\n  void insert(int index, T value);\n  @OperatorGet T get(int index);\n  @OperatorSet void set(int index, T value);\n  void swap(int a, int b);\n}\n\nimport class StringMap<T> {\n  new();\n  @OperatorGet T get(string key);\n  T getOrDefault(string key, T defaultValue);\n  @OperatorSet void set(string key, T value);\n  bool has(string key);\n  void remove(string key);\n  List<string> keys();\n  List<T> values();\n  StringMap<T> clone();\n}\n\nimport class IntMap<T> {\n  new();\n  @OperatorGet T get(int key);\n  T getOrDefault(int key, T defaultValue);\n  @OperatorSet void set(int key, T value);\n  bool has(int key);\n  void remove(int key);\n  List<int> keys();\n  List<T> values();\n  IntMap<T> clone();\n}\n\nimport namespace math {\n  double abs(double x);\n  double sin(double x);\n  double cos(double x);\n  double tan(double x);\n  double asin(double x);\n  double acos(double x);\n  double atan(double x);\n  double atan2(double y, double x);\n  double sqrt(double x);\n  double exp(double x);\n  double log(double x);\n  double pow(double x, double y);\n  double floor(double x);\n  double round(double x);\n  double ceil(double x);\n  double min(double x, double y);\n  double max(double x, double y);\n}\n\nin math {\n  const {\n    double SQRT2 = 1.414213562373095;\n    double PI = 3.141592653589793;\n    double E = 2.718281828459045;\n    double INFINITY = 1 / 0.0;\n    double NAN = 0 / 0.0;\n  }\n}\n');
  Compiler.nativeLibraryJS = new CachedSource('\nimport class int { string toString(); }\nimport class bool { string toString(); }\nimport class float { string toString(); }\nimport class double { string toString(); }\n\nimport class string {\n  string slice(int start, int end);\n  int indexOf(string value);\n  int lastIndexOf(string value);\n  string toLowerCase();\n  string toUpperCase();\n}\n\nin string {\n  inline {\n    int size() { return this.`length`; }\n    static string fromCodeUnit(int value) { return `String`.fromCharCode(value); }\n    string sliceOne(int index) { return `this`[index]; }\n    string join(List<string> values) { return values.`join`(this); }\n    @OperatorGet int codeUnitAt(int index) { return this.`charCodeAt`(index); }\n  }\n\n  bool startsWith(string prefix) { return size() >= prefix.size() && slice(0, prefix.size()) == prefix; }\n  bool endsWith(string suffix) { return size() >= suffix.size() && slice(size() - suffix.size(), size()) == suffix; }\n  string repeat(int count) { var result = ""; for (var i = 0; i < count; i++) result += this; return result; }\n}\n\ninterface Comparison<T> {\n  virtual int compare(T left, T right);\n}\n\nvoid bindCompare<T>(Comparison<T> comparison) {\n  return comparison.compare.`bind`(comparison);\n}\n\nimport class List<T> {\n  new();\n  void push(T value);\n  void unshift(T value);\n  List<T> slice(int start, int end);\n  int indexOf(T value);\n  int lastIndexOf(T value);\n  T shift();\n  T pop();\n  void reverse();\n}\n\nin List {\n  inline {\n    int size() { return this.`length`; }\n    void sort(Comparison<T> comparison) { this.`sort`(bindCompare<T>(comparison)); }\n    List<T> clone() { return this.`slice`(); }\n    T remove(int index) { return this.`splice`(index, 1)[0]; }\n    void insert(int index, T value) { this.`splice`(index, 0, value); }\n    @OperatorGet T get(int index) { return `this`[index]; }\n    @OperatorSet void set(int index, T value) { `this`[index] = value; }\n  }\n\n  void swap(int a, int b) { var temp = this[a]; this[a] = this[b]; this[b] = temp; }\n}\n\nclass StringMap<T> {\n  var _table = `Object`.create(null);\n\n  inline {\n    @OperatorGet T get(string key) { return _table[key]; }\n    @OperatorSet void set(string key, T value) { _table[key] = value; }\n    bool has(string key) { return key in _table; }\n    void remove(string key) { delete _table[key]; }\n  }\n\n  T getOrDefault(string key, T defaultValue) {\n    return has(key) ? this[key] : defaultValue;\n  }\n\n  List<string> keys() {\n    List<string> keys = [];\n    for (string key in _table) keys.push(key);\n    return keys;\n  }\n\n  List<T> values() {\n    List<T> values = [];\n    for (string key in _table) values.push(this[key]);\n    return values;\n  }\n\n  StringMap<T> clone() {\n    var clone = StringMap<T>();\n    for (string key in _table) clone[key] = this[key];\n    return clone;\n  }\n}\n\nclass IntMap<T> {\n  var _table = `Object`.create(null);\n\n  inline {\n    @OperatorGet T get(int key) { return _table[key]; }\n    @OperatorSet void set(int key, T value) { _table[key] = value; }\n    bool has(int key) { return key in _table; }\n    void remove(int key) { delete _table[key]; }\n  }\n\n  T getOrDefault(int key, T defaultValue) {\n    return has(key) ? this[key] : defaultValue;\n  }\n\n  List<int> keys() {\n    List<int> keys = [];\n    for (double key in _table) keys.push((int)key);\n    return keys;\n  }\n\n  List<T> values() {\n    List<T> values = [];\n    for (int key in _table) values.push(this[key]);\n    return values;\n  }\n\n  IntMap<T> clone() {\n    var clone = IntMap<T>();\n    for (int key in _table) clone[key] = this[key];\n    return clone;\n  }\n}\n\nnamespace math {\n  inline {\n    double abs(double x) { return `Math`.abs(x); }\n    double sin(double x) { return `Math`.sin(x); }\n    double cos(double x) { return `Math`.cos(x); }\n    double tan(double x) { return `Math`.tan(x); }\n    double asin(double x) { return `Math`.asin(x); }\n    double acos(double x) { return `Math`.acos(x); }\n    double atan(double x) { return `Math`.atan(x); }\n    double atan2(double y, double x) { return `Math`.atan2(y, x); }\n    double sqrt(double x) { return `Math`.sqrt(x); }\n    double exp(double x) { return `Math`.exp(x); }\n    double log(double x) { return `Math`.log(x); }\n    double pow(double x, double y) { return `Math`.pow(x, y); }\n    double floor(double x) { return `Math`.floor(x); }\n    double round(double x) { return `Math`.round(x); }\n    double ceil(double x) { return `Math`.ceil(x); }\n    double min(double x, double y) { return `Math`.min(x, y); }\n    double max(double x, double y) { return `Math`.max(x, y); }\n  }\n\n  const {\n    double SQRT2 = 1.414213562373095;\n    double PI = 3.141592653589793;\n    double E = 2.718281828459045;\n    double INFINITY = 1 / 0.0;\n    double NAN = 0 / 0.0;\n  }\n}\n');
  Compiler.nativeLibraryCPP = new CachedSource('\nimport class int {}\nimport class bool {}\nimport class float {}\nimport class double {}\nimport class string {}\n\nin int {\n  string toString() {\n    `std::stringstream` ss;\n    ss << this;\n    return ss.str();\n  }\n}\n\nin bool {\n  inline string toString() { return this ? "true" : "false"; }\n}\n\nin float {\n  inline string toString() {\n    `std::stringstream` ss;\n    ss << this;\n    return ss.str();\n  }\n}\n\nin double {\n  inline string toString() {\n    `std::stringstream` ss;\n    ss << this;\n    return ss.str();\n  }\n}\n\nin string {\n  inline {\n    int size() { return (int)this.`size`(); }\n    string slice(int start, int end) { return this.`substr`(start, end - start); }\n    string sliceOne(int index) { return fromCodeUnit(codeUnitAt(index)); }\n    int indexOf(string value) { return (int)this.`find`(value); }\n    int lastIndexOf(string value) { return (int)this.`rfind`(value); }\n    static string fromCodeUnit(int value) { return `string`(1, value); }\n    @OperatorGet int codeUnitAt(int index) { return `this`[index]; }\n  }\n\n  string toLowerCase() {\n    var clone = this;\n    `std::transform(clone.begin(), clone.end(), clone.begin(), ::tolower)`;\n    return clone;\n  }\n\n  string toUpperCase() {\n    var clone = this;\n    `std::transform(clone.begin(), clone.end(), clone.begin(), ::toupper)`;\n    return clone;\n  }\n\n  string join(List<string> values) {\n    var result = "";\n    for (var i = 0; i < values.size(); i++) {\n      if (i > 0) result += this;\n      result += values[i];\n    }\n    return result;\n  }\n\n  bool startsWith(string prefix) {\n    return size() >= prefix.size() && slice(0, prefix.size()) == prefix;\n  }\n\n  bool endsWith(string suffix) {\n    return size() >= suffix.size() && slice(size() - suffix.size(), size()) == suffix;\n  }\n\n  string repeat(int count) {\n    var result = "";\n    for (var i = 0; i < count; i++) result += this;\n    return result;\n  }\n}\n\ninterface Comparison<T> {\n  virtual int compare(T left, T right);\n}\n\nbool bindCompare<T>(Comparison<T> comparison, T left, T right) {\n  return comparison.compare(left, right) < 0;\n}\n\nclass List<T> {\n  new(`std::initializer_list<T>` list) : _data = list {}\n\n  int size() {\n    return _data.size();\n  }\n\n  void push(T value) {\n    _data.push_back(value);\n  }\n\n  void unshift(T value) {\n    insert(0, value);\n  }\n\n  List<T> slice(int start, int end) {\n    assert start >= 0 && start <= end && end <= size();\n    List<T> slice = [];\n    slice._data.insert(slice._data.begin(), _data.begin() + start, _data.begin() + end);\n    return slice;\n  }\n\n  int indexOf(T value) {\n    int index = `std`::find(_data.begin(), _data.end(), value) - _data.begin();\n    return index == size() ? -1 : index;\n  }\n\n  int lastIndexOf(T value) {\n    int index = `std`::find(_data.rbegin(), _data.rend(), value) - _data.rbegin();\n    return size() - index - 1;\n  }\n\n  T shift() {\n    T value = this[0];\n    remove(0);\n    return value;\n  }\n\n  T pop() {\n    T value = this[size() - 1];\n    _data.pop_back();\n    return value;\n  }\n\n  void reverse() {\n    `std`::reverse(_data.begin(), _data.end());\n  }\n\n  void sort(Comparison<T> comparison) {\n    `std`::sort(_data.begin(), _data.end(), `std`::bind(`&`bindCompare`<T>`, comparison, `std`::placeholders::_1, `std`::placeholders::_2));\n  }\n\n  List<T> clone() {\n    List<T> clone = [];\n    clone._data = _data;\n    return clone;\n  }\n\n  T remove(int index) {\n    T value = this[index];\n    _data.erase(_data.begin() + index);\n    return value;\n  }\n\n  void insert(int index, T value) {\n    assert index >= 0 && index <= size();\n    _data.insert(_data.begin() + index, value);\n  }\n\n  @OperatorGet\n  T get(int index) {\n    assert index >= 0 && index < size();\n    return _data[index];\n  }\n\n  @OperatorSet\n  void set(int index, T value) {\n    assert index >= 0 && index < size();\n    _data[index] = value;\n  }\n\n  void swap(int a, int b) {\n    assert a >= 0 && a < size();\n    assert b >= 0 && b < size();\n    `std`::swap(_data[a], _data[b]);\n  }\n\n  `std::vector<T>` _data;\n}\n\nclass StringMap<T> {\n  new() {}\n  @OperatorGet T get(string key) { return _table[key]; }\n  T getOrDefault(string key, T defaultValue) { `auto` it = _table.find(key); return it != _table.end() ? it->second : defaultValue; }\n  @OperatorSet void set(string key, T value) { _table[key] = value; }\n  bool has(string key) { return _table.count(key); }\n  void remove(string key) { _table.erase(key); }\n  List<string> keys() { List<string> keys = []; for (`(auto &)` it in _table) keys.push(it.first); return keys; }\n  List<T> values() { List<T> values = []; for (`(auto &)` it in _table) values.push(it.second); return values; }\n  StringMap<T> clone() { var clone = StringMap<T>(); clone._table = _table; return clone; }\n\n  `std::unordered_map<string, T>` _table;\n}\n\nclass IntMap<T> {\n  new() {}\n  @OperatorGet T get(int key) { return _table[key]; }\n  T getOrDefault(int key, T defaultValue) { `auto` it = _table.find(key); return it != _table.end() ? it->second : defaultValue; }\n  @OperatorSet void set(int key, T value) { _table[key] = value; }\n  bool has(int key) { return _table.count(key); }\n  void remove(int key) { _table.erase(key); }\n  List<int> keys() { List<int> keys = []; for (`(auto &)` it in _table) keys.push(it.first); return keys; }\n  List<T> values() { List<T> values = []; for (`(auto &)` it in _table) values.push(it.second); return values; }\n  StringMap<T> clone() { var clone = StringMap<T>(); clone._table = _table; return clone; }\n\n  `std::unordered_map<int, T>` _table;\n}\n\nnamespace math {\n  inline {\n    double abs(double x) { return `std`::abs(x); }\n    double sin(double x) { return `std`::sin(x); }\n    double cos(double x) { return `std`::cos(x); }\n    double tan(double x) { return `std`::tan(x); }\n    double asin(double x) { return `std`::asin(x); }\n    double acos(double x) { return `std`::acos(x); }\n    double atan(double x) { return `std`::atan(x); }\n    double atan2(double y, double x) { return `std`::atan2(y, x); }\n    double sqrt(double x) { return `std`::sqrt(x); }\n    double exp(double x) { return `std`::exp(x); }\n    double log(double x) { return `std`::log(x); }\n    double pow(double x, double y) { return `std`::pow(x, y); }\n    double floor(double x) { return `std`::floor(x); }\n    double round(double x) { return `std`::round(x); }\n    double ceil(double x) { return `std`::ceil(x); }\n    double min(double x, double y) { return `std`::fmin(x, y); }\n    double max(double x, double y) { return `std`::fmax(x, y); }\n  }\n\n  const {\n    double SQRT2 = 1.414213562373095;\n    double PI = 3.141592653589793;\n    double E = 2.718281828459045;\n    double INFINITY = 1 / 0.0;\n    double NAN = 0 / 0.0;\n  }\n}\n');
  Range.EMPTY = new Range(null, 0, 0);
  js.Emitter.isKeyword = null;
  js.SymbolComparison.INSTANCE = new js.SymbolComparison();
  js.SymbolGroupComparison.INSTANCE = new js.SymbolGroupComparison();
  SourceMapGenerator.comparison = new SourceMappingComparison();
  MemberComparison.INSTANCE = new MemberComparison();
  Resolver.comparison = new MemberRangeComparison();
  Symbol.nextUniqueID = -1;
  SymbolComparison.INSTANCE = new SymbolComparison();
  Type.nextUniqueID = -1;
}());
function parseIntLiteral(value, base) {
  if (base !== 10) value = value.slice(2);
  return parseInt(value, base) | 0;
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

Error.stackTraceLimit = Infinity;
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
