(function() {
  function $extends(derived, base) {
    derived.prototype = Object.create(base.prototype);
    derived.prototype.constructor = derived;
  }

  function assert(truth) {
    if (!truth) {
      throw "Assertion failed";
    }
  }

  function hashCombine(left, right) {
    return left ^ right - 1640531527 + (left << 6) + (left >> 2);
  }

  function Box(value) {
    var self = this;
    self.value = value;
  }

  var skew = {};

  skew.quoteString = function(text, quote) {
    var builder = in_StringBuilder.$new();
    var quoteString = in_string.fromCodeUnit(quote);
    var escaped = "";

    // Append long runs of unescaped characters using a single slice for speed
    var start = 0;
    in_StringBuilder.append(builder, quoteString);

    for (var i = 0, count = in_string.count(text); i < count; i += 1) {
      var c = in_string.get1(text, i);

      if (c === quote) {
        escaped = "\\" + quoteString;
      }

      else if (c === 10) {
        escaped = "\\n";
      }

      else if (c === 13) {
        escaped = "\\r";
      }

      else if (c === 9) {
        escaped = "\\t";
      }

      else if (c === 0) {
        escaped = "\\0";
      }

      else if (c === 92) {
        escaped = "\\\\";
      }

      else if (c < 32) {
        escaped = "\\x" + in_string.get(skew.HEX, c >> 4) + in_string.get(skew.HEX, c & 15);
      }

      else {
        continue;
      }

      in_StringBuilder.append(builder, text.slice(start, i));
      in_StringBuilder.append(builder, escaped);
      start = i + 1;
    }

    in_StringBuilder.append(builder, text.slice(start, in_string.count(text)));
    in_StringBuilder.append(builder, quoteString);
    return in_StringBuilder.toString(builder);
  };

  skew.argumentCountForOperator = function(text) {
    if (skew.argumentCounts === null) {
      skew.argumentCounts = in_StringMap.$new();

      for (var i = 0, list = in_IntMap.values(skew.operatorInfo), count = in_List.count(list); i < count; ++i) {
        var value = list[i];
        skew.argumentCounts[value.text] = value.count;
      }

      skew.argumentCounts["[...]"] = skew.ArgumentCount.ONE;
      skew.argumentCounts["[new]"] = skew.ArgumentCount.ZERO_OR_ONE;
      skew.argumentCounts["{...}"] = skew.ArgumentCount.ONE_OR_TWO;
      skew.argumentCounts["{new}"] = skew.ArgumentCount.TWO_OR_FEWER;
    }

    return in_StringMap.get(skew.argumentCounts, text, skew.ArgumentCount.ZERO_OR_MORE);
  };

  // This is the inner loop from "flex", an ancient lexer generator. The output
  // of flex is pretty bad (obfuscated variable names and the opposite of modular
  // code) but it's fast and somewhat standard for compiler design. The code below
  // replaces a simple hand-coded lexer and offers much better performance.
  skew.tokenize = function(log, source) {
    var tokens = [];
    var text = source.contents;
    var text_length = in_string.count(text);

    // For backing up
    var yy_last_accepting_state = 0;
    var yy_last_accepting_cpos = 0;

    // The current character pointer
    var yy_cp = 0;

    while (yy_cp < text_length) {
      // Reset the NFA
      var yy_current_state = 1;

      // The pointer to the beginning of the token
      var yy_bp = yy_cp;

      // Search for a match
      while (yy_current_state !== 225) {
        if (yy_cp >= text_length) {
          // This prevents syntax errors from causing infinite loops
          break;
        }

        var c = in_string.get1(text, yy_cp);
        var index = c < 127 ? c : 127;
        var yy_c = skew.yy_ec[index];

        if (skew.yy_accept[yy_current_state] !== skew.TokenKind.YY_INVALID_ACTION) {
          yy_last_accepting_state = yy_current_state;
          yy_last_accepting_cpos = yy_cp;
        }

        while (skew.yy_chk[skew.yy_base[yy_current_state] + yy_c] !== yy_current_state) {
          yy_current_state = skew.yy_def[yy_current_state];

          if (yy_current_state >= 226) {
            yy_c = skew.yy_meta[yy_c];
          }
        }

        yy_current_state = skew.yy_nxt[skew.yy_base[yy_current_state] + yy_c];
        ++yy_cp;
      }

      // Find the action
      var yy_act = skew.yy_accept[yy_current_state];

      while (yy_act === skew.TokenKind.YY_INVALID_ACTION) {
        // Have to back up
        yy_cp = yy_last_accepting_cpos;
        yy_current_state = yy_last_accepting_state;
        yy_act = skew.yy_accept[yy_current_state];
      }

      // Ignore whitespace
      if (yy_act === skew.TokenKind.WHITESPACE) {
        continue;
      }

      // This is the default action in flex, which is usually called ECHO
      else if (yy_act === skew.TokenKind.ERROR) {
        var iterator = unicode.StringIterator.INSTANCE.reset(text, yy_bp);
        iterator.nextCodePoint();
        var range = new skew.Range(source, yy_bp, iterator.index);
        log.syntaxErrorExtraData(range, range.toString());
        break;
      }

      // Ignore END_OF_FILE since this loop must still perform the last action
      else if (yy_act !== skew.TokenKind.END_OF_FILE) {
        in_List.append1(tokens, new skew.Token(new skew.Range(source, yy_bp, yy_cp), yy_act));

        // These tokens start with a ">" and may need to be split if we discover
        // that they should really be END_PARAMETER_LIST tokens. Save enough room
        // for these tokens to be split into pieces, that way all of the tokens
        // don't have to be shifted over repeatedly inside prepareTokens(). The
        // ">>" token may become ">" + ">", the ">=" token may become ">" + "=",
        // and the ">>=" token may become ">" + ">=" and so ">" + ">" + "=".
        if (yy_act === skew.TokenKind.ASSIGN_SHIFT_RIGHT || yy_act === skew.TokenKind.SHIFT_RIGHT || yy_act === skew.TokenKind.GREATER_THAN_OR_EQUAL) {
          in_List.append1(tokens, null);

          if (yy_act === skew.TokenKind.ASSIGN_SHIFT_RIGHT) {
            in_List.append1(tokens, null);
          }
        }
      }
    }

    // Every token stream ends in END_OF_FILE
    in_List.append1(tokens, new skew.Token(new skew.Range(source, text_length, text_length), skew.TokenKind.END_OF_FILE));

    // Also return preprocessor token presence so the preprocessor can be avoided
    return tokens;
  };

  skew.prepareTokens = function(tokens) {
    var previousKind = skew.TokenKind.NULL;
    var stack = [];
    var count = 0;

    for (var i = 0, count1 = in_List.count(tokens); i < count1; i += 1) {
      var token = tokens[i];

      // Skip null placeholders after tokens that start with a greater than. Each
      // token that may need to split has enough nulls after it for all the pieces.
      // It's a lot faster to remove null gaps during token preparation than to
      // insert pieces in the middle of the token stream (O(n) vs O(n^2)).
      if (token === null) {
        continue;
      }

      // Compress tokens to eliminate unused null gaps
      tokens[count] = token;
      ++count;

      // Tokens that start with a greater than may need to be split
      var tokenKind = token.kind;
      var tokenStartsWithGreaterThan = token.firstCodeUnit() === 62;

      // Remove tokens from the stack if they aren't working out
      while (!in_List.isEmpty(stack)) {
        var top = in_List.last(stack);
        var topKind = top.kind;

        // Stop parsing a type if we find a token that no type expression uses
        if (topKind === skew.TokenKind.LESS_THAN && tokenKind !== skew.TokenKind.LESS_THAN && tokenKind !== skew.TokenKind.IDENTIFIER && tokenKind !== skew.TokenKind.COMMA && tokenKind !== skew.TokenKind.DOT && tokenKind !== skew.TokenKind.LEFT_PARENTHESIS && tokenKind !== skew.TokenKind.RIGHT_PARENTHESIS && !tokenStartsWithGreaterThan) {
          in_List.removeLast(stack);
        }

        else {
          break;
        }
      }

      // Group open
      if (tokenKind === skew.TokenKind.LEFT_PARENTHESIS || tokenKind === skew.TokenKind.LEFT_BRACE || tokenKind === skew.TokenKind.LEFT_BRACKET || tokenKind === skew.TokenKind.LESS_THAN) {
        in_List.append1(stack, token);
      }

      // Group close
      else if (tokenKind === skew.TokenKind.RIGHT_PARENTHESIS || tokenKind === skew.TokenKind.RIGHT_BRACE || tokenKind === skew.TokenKind.RIGHT_BRACKET || tokenStartsWithGreaterThan) {
        // Search for a matching opposite token
        while (!in_List.isEmpty(stack)) {
          var top = in_List.last(stack);
          var topKind = top.kind;

          // Don't match closing angle brackets that don't work since they are just operators
          if (tokenStartsWithGreaterThan && topKind !== skew.TokenKind.LESS_THAN) {
            break;
          }

          // Consume the current token
          in_List.removeLast(stack);

          // Special-case angle brackets matches
          if (topKind === skew.TokenKind.LESS_THAN) {
            // Remove tentative matches that didn't work out
            if (!tokenStartsWithGreaterThan) {
              continue;
            }

            // Break apart operators that start with a closing angle bracket
            if (tokenKind !== skew.TokenKind.GREATER_THAN) {
              var range = token.range;
              var start = range.start;
              assert(i + 1 < in_List.count(tokens));
              assert(tokens[i + 1] === null);
              assert(tokenKind === skew.TokenKind.SHIFT_RIGHT || tokenKind === skew.TokenKind.GREATER_THAN_OR_EQUAL || tokenKind === skew.TokenKind.ASSIGN_SHIFT_RIGHT);
              tokens[i + 1] = new skew.Token(new skew.Range(range.source, start + 1, range.end), tokenKind === skew.TokenKind.SHIFT_RIGHT ? skew.TokenKind.GREATER_THAN : tokenKind === skew.TokenKind.GREATER_THAN_OR_EQUAL ? skew.TokenKind.ASSIGN : skew.TokenKind.GREATER_THAN_OR_EQUAL);
              token.range = new skew.Range(range.source, start, start + 1);
            }

            // Convert < and > into bounds for type parameter lists
            top.kind = skew.TokenKind.START_PARAMETER_LIST;
            token.kind = skew.TokenKind.END_PARAMETER_LIST;
            tokenKind = skew.TokenKind.END_PARAMETER_LIST;
          }

          // Stop the search since we found a match
          break;
        }
      }

      // Remove newlines based on the previous token or the next token to enable
      // line continuations. Make sure to be conservative. We want to be like
      // Python, not like JavaScript ASI! Anything that is at all ambiguous
      // should be disallowed.
      if (tokenKind === skew.TokenKind.NEWLINE && ((previousKind) | 0) in skew.REMOVE_NEWLINE_AFTER && !(((tokens[i + 1].kind) | 0) in skew.KEEP_NEWLINE_BEFORE)) {
        --count;
        continue;
      }

      else if (previousKind === skew.TokenKind.NEWLINE && ((tokenKind) | 0) in skew.REMOVE_NEWLINE_BEFORE) {
        tokens[count - 2] = token;
        --count;
      }

      previousKind = tokenKind;
    }

    // Trim off the remaining tokens due to null gap removal
    while (in_List.count(tokens) > count) {
      in_List.removeLast(tokens);
    }
  };

  skew.compile = function(log, options, sources) {
    var result = new skew.CompilerResult();
    in_List.prepend1(sources, new skew.Source("<native>", NATIVE_LIBRARY));

    for (var i = 0, list = sources, count = in_List.count(list); i < count; ++i) {
      var source = list[i];
      var tokens = skew.tokenize(log, source);
      skew.prepareTokens(tokens);
      skew.parsing.parseFile(log, tokens, result.global);
    }

    // Merging pass, errors stop compilation
    if (!log.hasErrors()) {
      skew.mergingPass(log, result.global);

      // Resolving pass, errors stop compilation
      if (!log.hasErrors()) {
        skew.resolvingPass(log, result.global, result.cache);

        // Prepare for emission, code is error-free at this point
        if (!log.hasErrors()) {
          var graph = new skew.CallGraph(result.global);
          skew.globalizingPass(result.global, graph);
          skew.motionPass(result.global, graph);
          skew.renamingPass(result.global);

          // Emit in the target language
          var emitter = new skew.JsEmitter(result.cache, options);
          emitter.visit(result.global);
          result.outputs = emitter.sources();
        }
      }
    }

    return result;
  };

  skew.globalizingPass = function(global, graph) {
    for (var i1 = 0, list = graph.callInfo, count1 = in_List.count(list); i1 < count1; ++i1) {
      var info = list[i1];
      var symbol = info.symbol;

      // Turn certain instance functions into global functions
      if (symbol.kind === skew.SymbolKind.FUNCTION_INSTANCE && (symbol.parent.kind === skew.SymbolKind.OBJECT_ENUM || symbol.parent.isImported() && !symbol.isImported())) {
        var $function = symbol.asFunctionSymbol();
        $function.kind = skew.SymbolKind.FUNCTION_GLOBAL;
        in_List.prepend1($function.$arguments, $function.self);
        $function.self = null;

        // Update all call sites
        for (var i = 0, count = in_List.count(info.callSites); i < count; i += 1) {
          var callSite = info.callSites[i];
          var value = callSite.callValue();

          // Rewrite "super(foo)" to "bar(self, foo)"
          if (value.kind === skew.NodeKind.SUPER) {
            var self = info.callContexts[i];
            value.replaceWith(skew.Node.createName(self.name).withSymbol(self));
          }

          // Rewrite "self.foo(bar)" to "foo(self, bar)"
          else {
            value.dotTarget().swapWith(value);
          }

          in_List.prepend1(callSite.children, skew.Node.createName($function.name).withSymbol($function));
        }
      }
    }
  };

  skew.mergingPass = function(log, global) {
    skew.merging.mergeObject(log, null, global, global);
  };

  skew.motionPass = function(global, graph) {
    var parents = in_IntMap.$new();

    for (var i = 0, list = graph.callInfo, count = in_List.count(list); i < count; ++i) {
      var info = list[i];
      var symbol = info.symbol;

      // Move global functions with implementations off imported objects
      if (symbol.kind === skew.SymbolKind.FUNCTION_GLOBAL && symbol.parent.isImported() && !symbol.isImported()) {
        var $function = symbol.asFunctionSymbol();
        var parent = in_IntMap.get(parents, $function.parent.id, null);

        // Create a parallel namespace next to the parent
        if (parent === null) {
          var common = $function.parent.parent.asObjectSymbol();
          parent = new skew.ObjectSymbol(skew.SymbolKind.OBJECT_NAMESPACE, "in_" + $function.parent.name);
          parent.scope = new skew.ObjectScope(common.scope, parent);
          parent.parent = common;
          in_List.append1(common.objects, parent);
          parents[$function.parent.id] = parent;
        }

        // Move this function into that parallel namespace
        in_List.removeOne($function.parent.asObjectSymbol().functions, $function);
        in_List.append1(parent.functions, $function);
        $function.parent = parent;
      }
    }
  };

  skew.renamingPass = function(global) {
    skew.renaming.renameObject(global);

    // Use a second pass to avoid ordering issues
    skew.renaming.useOverriddenNames(global);
  };

  skew.resolvingPass = function(log, global, cache) {
    cache.loadGlobals(log, global);

    if (!log.hasErrors()) {
      new skew.resolving.Resolver(cache, log).resolveGlobal(global);
    }
  };

  skew.main = function($arguments) {
    // Translate frontend flags to compiler options
    var log = new skew.Log();
    var parser = new skew.options.Parser();
    var options = skew.parseOptions(log, parser, $arguments);
    var inputs = skew.readSources(log, parser.normalArguments);

    // Run the compilation
    if (!log.hasErrors() && options !== null) {
      var result = skew.compile(log, options, inputs);

      // Write all outputs
      if (!log.hasErrors()) {
        for (var i = 0, list = result.outputs, count = in_List.count(list); i < count; ++i) {
          var output = list[i];

          if (!io.writeFile(output.name, output.contents)) {
            var outputFile = parser.stringRangeForOption(skew.Option.OUTPUT_FILE);
            var outputDirectory = parser.stringRangeForOption(skew.Option.OUTPUT_DIRECTORY);
            log.commandLineErrorUnwritableFile(outputFile !== null ? outputFile : outputDirectory, output.name);
            break;
          }
        }
      }
    }

    // Print any errors and warnings
    skew.printLogWithColor(log, parser.intForOption(skew.Option.ERROR_LIMIT, skew.DEFAULT_ERROR_LIMIT));
    return log.hasErrors() ? 1 : 0;
  };

  skew.printWithColor = function(color, text) {
    terminal.setColor(color);
    terminal.write(text);
    terminal.setColor(terminal.Color.DEFAULT);
  };

  skew.printError = function(text) {
    skew.printWithColor(terminal.Color.RED, "error: ");
    skew.printWithColor(terminal.Color.BOLD, text + "\n");
  };

  skew.printNote = function(text) {
    skew.printWithColor(terminal.Color.GRAY, "note: ");
    skew.printWithColor(terminal.Color.BOLD, text + "\n");
  };

  skew.printWarning = function(text) {
    skew.printWithColor(terminal.Color.MAGENTA, "warning: ");
    skew.printWithColor(terminal.Color.BOLD, text + "\n");
  };

  skew.printUsage = function(parser) {
    skew.printWithColor(terminal.Color.GREEN, "\nusage: ");
    skew.printWithColor(terminal.Color.BOLD, "skewc [flags] [inputs]\n");
    terminal.write(parser.usageText(Math.min(terminal.width(), 80)));
  };

  skew.printLogWithColor = function(log, errorLimit) {
    var terminalWidth = terminal.width();
    var errorCount = 0;

    for (var i = 0, list = log.diagnostics, count = in_List.count(list); i < count; ++i) {
      var diagnostic = list[i];

      if (diagnostic.kind === skew.DiagnosticKind.ERROR && errorLimit > 0 && errorCount === errorLimit) {
        break;
      }

      if (diagnostic.range !== null) {
        skew.printWithColor(terminal.Color.BOLD, diagnostic.range.locationString() + ": ");
      }

      switch (diagnostic.kind) {
        case skew.DiagnosticKind.WARNING: {
          skew.printWarning(diagnostic.text);
          break;
        }

        case skew.DiagnosticKind.ERROR: {
          skew.printError(diagnostic.text);
          ++errorCount;
          break;
        }
      }

      if (diagnostic.range !== null) {
        var formatted = diagnostic.range.format(terminalWidth);
        terminal.print(formatted.line);
        skew.printWithColor(terminal.Color.GREEN, formatted.range + "\n");
      }

      if (diagnostic.noteRange !== null) {
        skew.printWithColor(terminal.Color.BOLD, diagnostic.noteRange.locationString() + ": ");
        skew.printNote(diagnostic.noteText);
        var formatted = diagnostic.noteRange.format(terminalWidth);
        terminal.print(formatted.line);
        skew.printWithColor(terminal.Color.GREEN, formatted.range + "\n");
      }
    }

    // Print the summary
    var hasErrors = log.hasErrors();
    var hasWarnings = log.hasWarnings();
    var summary = "";

    if (hasWarnings) {
      summary += log.warningCount.toString() + " warning" + prettyPrint.plural(log.warningCount);

      if (hasErrors) {
        summary += " and ";
      }
    }

    if (hasErrors) {
      summary += log.errorCount.toString() + " error" + prettyPrint.plural(log.errorCount);
    }

    if (hasWarnings || hasErrors) {
      terminal.write(summary + " generated");
      skew.printWithColor(terminal.Color.GRAY, errorCount < log.errorCount ? " (only showing " + errorLimit.toString() + " error" + prettyPrint.plural(errorLimit) + ", use \"--error-limit=0\" to see all)\n" : "\n");
    }
  };

  skew.readSources = function(log, files) {
    var result = [];

    for (var i = 0, list = files, count = in_List.count(list); i < count; ++i) {
      var file = list[i];
      var path = file.toString();
      var contents = io.readFile(path);

      if (contents === null) {
        log.commandLineErrorUnreadableFile(file, path);
      }

      else {
        in_List.append1(result, new skew.Source(path, contents.value));
      }
    }

    return result;
  };

  skew.parseOptions = function(log, parser, $arguments) {
    // Configure the parser
    parser.define(skew.options.Type.BOOL, skew.Option.HELP, "--help", "Prints this message.").aliases(["-help", "?", "-?", "-h", "-H", "/?", "/h", "/H"]);
    parser.define(skew.options.Type.STRING, skew.Option.OUTPUT_FILE, "--output-file", "Combines all output into a single file. Mutually exclusive with --output-dir.");
    parser.define(skew.options.Type.STRING, skew.Option.OUTPUT_DIRECTORY, "--output-dir", "Places all output files in the specified directory. Mutually exclusive with --output-file.");
    parser.define(skew.options.Type.INT, skew.Option.ERROR_LIMIT, "--error-limit", "Sets the maximum number of errors to report. Pass 0 to disable the error limit. The default is 20.");

    // Parse the command line arguments
    parser.parse(log, $arguments);

    if (log.hasErrors()) {
      return null;
    }

    // Early-out when printing the usage text
    if (parser.boolForOption(skew.Option.HELP, in_List.isEmpty($arguments))) {
      skew.printUsage(parser);
      return null;
    }

    // Set up the options for the compiler
    var options = new skew.CompilerOptions();

    // There must be at least one source file
    var end = in_string.count(parser.source.contents);
    var trailingSpace = new skew.Range(parser.source, end - 1, end);

    if (in_List.isEmpty(parser.normalArguments)) {
      log.commandLineErrorNoInputFiles(trailingSpace);
    }

    // Parse the output location
    var outputFile = parser.stringRangeForOption(skew.Option.OUTPUT_FILE);
    var outputDirectory = parser.stringRangeForOption(skew.Option.OUTPUT_DIRECTORY);

    if (outputFile === null && outputDirectory === null) {
      log.commandLineErrorMissingOutput(trailingSpace, "--output-file", "--output-dir");
    }

    else if (outputFile !== null && outputDirectory !== null) {
      log.commandLineErrorDuplicateOutput(outputFile.start > outputDirectory.start ? outputFile : outputDirectory, "--output-file", "--output-dir");
    }

    else if (outputFile !== null) {
      options.outputFile = outputFile.toString();
    }

    else {
      options.outputDirectory = outputDirectory.toString();
    }

    return options;
  };

  skew.Emitter = function(cache) {
    var self = this;
    self.cache = cache;
    self.indent = "";
    self._sources = [];
    self._code = "";
  };

  skew.Emitter.prototype.sources = function() {
    var self = this;
    return self._sources;
  };

  skew.Emitter.prototype.increaseIndent = function() {
    var self = this;
    self.indent += "  ";
  };

  skew.Emitter.prototype.decreaseIndent = function() {
    var self = this;
    self.indent = self.indent.slice(2, in_string.count(self.indent));
  };

  skew.Emitter.prototype.emit = function(text) {
    var self = this;
    self._code += text;
  };

  skew.Emitter.prototype.createSource = function(name) {
    var self = this;
    in_List.append1(self._sources, new skew.Source(name, self._code));
    self._code = "";
  };

  skew.Emitter.prototype.sortedObjects = function(global) {
    var self = this;
    var objects = [];
    self.findObjects(objects, global);

    // Sort by inheritance and containment
    for (var i = 0, count = in_List.count(objects); i < count; i += 1) {
      var j = i;

      // Select an object that comes before all other types
      while (j < in_List.count(objects)) {
        var object = objects[j];
        var k = i;

        // Check to see if this comes before all other types
        while (k < in_List.count(objects)) {
          if (j !== k && skew.Emitter.objectComesBefore(objects[k], object)) {
            break;
          }

          ++k;
        }

        if (k === in_List.count(objects)) {
          break;
        }

        ++j;
      }

      // Swap the object into the correct order
      if (j < in_List.count(objects)) {
        in_List.swap(objects, i, j);
      }
    }

    return objects;
  };

  skew.Emitter.prototype.findObjects = function(objects, object) {
    var self = this;
    in_List.append1(objects, object);

    for (var i = 0, list = object.objects, count = in_List.count(list); i < count; ++i) {
      var o = list[i];
      self.findObjects(objects, o);
    }
  };

  skew.Emitter.isContainedBy = function(inner, outer) {
    if (inner.parent === null) {
      return false;
    }

    if (inner.parent === outer) {
      return true;
    }

    return skew.Emitter.isContainedBy(inner.parent.asObjectSymbol(), outer);
  };

  skew.Emitter.objectComesBefore = function(before, after) {
    if (after.hasBaseClass(before)) {
      return true;
    }

    if (skew.Emitter.isContainedBy(after, before)) {
      return true;
    }

    return false;
  };

  skew.Associativity = {
    NONE: 0, 0: "NONE",
    LEFT: 1, 1: "LEFT",
    RIGHT: 2, 2: "RIGHT"
  };

  // The same operator precedence as C for the most part
  skew.Precedence = {
    LOWEST: 0, 0: "LOWEST",
    ASSIGN: 1, 1: "ASSIGN",
    LOGICAL_OR: 2, 2: "LOGICAL_OR",
    LOGICAL_AND: 3, 3: "LOGICAL_AND",
    BITWISE_OR: 4, 4: "BITWISE_OR",
    BITWISE_XOR: 5, 5: "BITWISE_XOR",
    BITWISE_AND: 6, 6: "BITWISE_AND",
    EQUAL: 7, 7: "EQUAL",
    COMPARE: 8, 8: "COMPARE",
    SHIFT: 9, 9: "SHIFT",
    ADD: 10, 10: "ADD",
    MULTIPLY: 11, 11: "MULTIPLY",
    UNARY_PREFIX: 12, 12: "UNARY_PREFIX",
    UNARY_POSTFIX: 13, 13: "UNARY_POSTFIX",
    MEMBER: 14, 14: "MEMBER"
  };

  skew.Precedence.incrementIfLeftAssociative = function(self, associativity) {
    return ((self) | 0) + (((associativity === skew.Associativity.LEFT)) | 0);
  };

  skew.Precedence.incrementIfRightAssociative = function(self, associativity) {
    return ((self) | 0) + (((associativity === skew.Associativity.RIGHT)) | 0);
  };

  skew.JsEmitter = function(cache, options) {
    var self = this;
    skew.Emitter.call(self, cache);
    self.options = options;
    self.previousSymbol = null;
    self.previousNode = null;
    self.prefix = "";
  };

  $extends(skew.JsEmitter, skew.Emitter);

  skew.JsEmitter.prototype.visit = function(global) {
    var self = this;
    var objects = self.sortedObjects(global);

    // The entire body of code is wrapped in a closure for safety
    self.emit(self.indent + "(function() {\n");
    self.increaseIndent();

    if (skew.JsEmitter.needsExtends(objects)) {
      self.emit(self.indent + "function $extends(derived, base) {\n");
      self.emit(self.indent + "  derived.prototype = Object.create(base.prototype);\n");
      self.emit(self.indent + "  derived.prototype.constructor = derived;\n");
      self.emit(self.indent + "}\n\n");
    }

    // Emit objects and functions
    for (var i = 0, list = objects, count = in_List.count(list); i < count; ++i) {
      var object = list[i];
      self.emitObject(object);
    }

    // Emit variables
    for (var i2 = 0, list2 = objects, count2 = in_List.count(list2); i2 < count2; ++i2) {
      var object = list2[i2];
      var o = object;
      self.prefix = "";

      while (o.kind !== skew.SymbolKind.OBJECT_GLOBAL) {
        self.prefix = skew.JsEmitter.mangleName(o) + "." + self.prefix;
        o = o.parent.asObjectSymbol();
      }

      for (var i1 = 0, list1 = object.variables, count1 = in_List.count(list1); i1 < count1; ++i1) {
        var variable = list1[i1];
        self.emitVariable(variable);
      }
    }

    // Emit entry point
    var entryPointSymbol = self.cache.entryPointSymbol;

    if (entryPointSymbol !== null) {
      var type = entryPointSymbol.resolvedType;
      var callText = skew.JsEmitter.fullName(entryPointSymbol) + (in_List.isEmpty(type.argumentTypes) ? "()" : "(process.argv.slice(2))");
      self.emit("\n" + self.indent + (type.returnType === self.cache.intType ? "process.exit(" + callText + ")" : callText) + ";\n");
    }

    // End the closure wrapping everything
    self.decreaseIndent();
    self.emit(self.indent + "}());\n");
    self.createSource(self.options.outputDirectory !== "" ? self.options.outputDirectory + "/compiled.js" : self.options.outputFile);
  };

  skew.JsEmitter.prototype.emitNewlineBeforeSymbol = function(symbol) {
    var self = this;
    if (self.previousSymbol !== null && (!skew.SymbolKind.isObject(self.previousSymbol.kind) || !skew.SymbolKind.isObject(symbol.kind) || symbol.comments !== null || self.previousSymbol.kind === skew.SymbolKind.OBJECT_ENUM || symbol.kind === skew.SymbolKind.OBJECT_ENUM) && (!skew.SymbolKind.isVariable(self.previousSymbol.kind) || !skew.SymbolKind.isVariable(symbol.kind) || symbol.comments !== null)) {
      self.emit("\n");
    }

    self.previousSymbol = null;
  };

  skew.JsEmitter.prototype.emitNewlineAfterSymbol = function(symbol) {
    var self = this;
    self.previousSymbol = symbol;
  };

  skew.JsEmitter.prototype.isCompactNodeKind = function(kind) {
    var self = this;
    return kind === skew.NodeKind.EXPRESSION || kind === skew.NodeKind.VAR || skew.NodeKind.isJump(kind);
  };

  skew.JsEmitter.prototype.emitNewlineBeforeStatement = function(node) {
    var self = this;
    if (self.previousNode !== null && (node.comments !== null || !self.isCompactNodeKind(self.previousNode.kind) || !self.isCompactNodeKind(node.kind))) {
      self.emit("\n");
    }

    self.previousNode = null;
  };

  skew.JsEmitter.prototype.emitNewlineAfterStatement = function(node) {
    var self = this;
    self.previousNode = node;
  };

  skew.JsEmitter.prototype.emitComments = function(comments) {
    var self = this;
    if (comments !== null) {
      for (var i = 0, list = comments, count = in_List.count(list); i < count; ++i) {
        var comment = list[i];
        self.emit(self.indent + "//" + comment);
      }
    }
  };

  skew.JsEmitter.prototype.emitObject = function(symbol) {
    var self = this;
    if (symbol.isImported()) {
      return;
    }

    self.prefix = symbol.parent !== null ? skew.JsEmitter.computePrefix(symbol.parent.asObjectSymbol()) : "";

    switch (symbol.kind) {
      case skew.SymbolKind.OBJECT_NAMESPACE:
      case skew.SymbolKind.OBJECT_INTERFACE: {
        self.emitNewlineBeforeSymbol(symbol);
        self.emitComments(symbol.comments);
        self.emit(self.indent + (self.prefix === "" && !symbol.isExported() ? "var " : self.prefix) + skew.JsEmitter.mangleName(symbol) + " = {};\n");
        self.emitNewlineAfterSymbol(symbol);
        break;
      }

      case skew.SymbolKind.OBJECT_ENUM: {
        self.emitNewlineBeforeSymbol(symbol);
        self.emitComments(symbol.comments);
        self.emit(self.indent + (self.prefix === "" && !symbol.isExported() ? "var " : self.prefix) + skew.JsEmitter.mangleName(symbol) + " = {");
        self.increaseIndent();
        var isFirst = true;

        for (var i = 0, list = symbol.variables, count = in_List.count(list); i < count; ++i) {
          var variable = list[i];

          if (variable.kind === skew.SymbolKind.VARIABLE_ENUM) {
            if (isFirst) {
              isFirst = false;
            }

            else {
              self.emit(",");
            }

            self.emit("\n");
            self.emitNewlineBeforeSymbol(variable);
            self.emitComments(variable.comments);
            self.emit(self.indent + (skew.JsEmitter.mangleName(variable) + ": " + variable.enumValue.toString() + ", " + variable.enumValue.toString() + ": " + skew.quoteString(variable.name, 34)));
            self.emitNewlineAfterSymbol(variable);
          }
        }

        self.decreaseIndent();

        if (!isFirst) {
          self.emit("\n");
        }

        self.emit(self.indent + "};\n");
        self.emitNewlineAfterSymbol(symbol);
        break;
      }

      case skew.SymbolKind.OBJECT_CLASS: {
        for (var i1 = 0, list1 = symbol.functions, count1 = in_List.count(list1); i1 < count1; ++i1) {
          var $function = list1[i1];

          if ($function.kind === skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
            if ($function.comments === null && symbol.comments !== null) {
              $function.comments = symbol.comments;
            }

            self.emitFunction($function);

            if (symbol.baseClass !== null) {
              self.emit("\n" + self.indent + "$extends(" + skew.JsEmitter.fullName(symbol) + ", " + skew.JsEmitter.fullName(symbol.baseClass) + ");\n");
            }
          }
        }
        break;
      }
    }

    if (symbol.kind !== skew.SymbolKind.OBJECT_GLOBAL) {
      self.prefix += skew.JsEmitter.mangleName(symbol) + ".";
    }

    for (var i2 = 0, list2 = symbol.functions, count2 = in_List.count(list2); i2 < count2; ++i2) {
      var $function = list2[i2];

      if ($function.kind !== skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
        self.emitFunction($function);
      }
    }
  };

  skew.JsEmitter.prototype.emitArgumentList = function($arguments) {
    var self = this;
    for (var i = 0, count = in_List.count($arguments); i < count; i += 1) {
      if (i > 0) {
        self.emit(", ");
      }

      self.emit(skew.JsEmitter.mangleName($arguments[i]));
    }
  };

  skew.JsEmitter.prototype.emitFunction = function(symbol) {
    var self = this;
    if (symbol.block === null) {
      return;
    }

    self.emitNewlineBeforeSymbol(symbol);
    self.emitComments(symbol.comments);
    var isExpression = self.prefix !== "" || symbol.isExported();
    var name = skew.JsEmitter.mangleName(symbol.kind === skew.SymbolKind.FUNCTION_CONSTRUCTOR ? symbol.parent : symbol);

    if (isExpression) {
      self.emit(self.indent + self.prefix + (symbol.kind === skew.SymbolKind.FUNCTION_INSTANCE ? "prototype." : "") + name + " = function(");
    }

    else {
      self.emit(self.indent + "function " + name + "(");
    }

    self.emitArgumentList(symbol.$arguments);
    self.emit(") {\n");
    self.increaseIndent();

    if (symbol.self !== null) {
      self.emit(self.indent + "var " + skew.JsEmitter.mangleName(symbol.self) + " = this;\n");
    }

    self.emitStatements(symbol.block.children);
    self.decreaseIndent();
    self.emit(self.indent + "}" + (isExpression ? ";\n" : "\n"));
    self.emitNewlineAfterSymbol(symbol);
  };

  skew.JsEmitter.prototype.emitVariable = function(symbol) {
    var self = this;
    if (symbol.isImported()) {
      return;
    }

    if (symbol.kind !== skew.SymbolKind.VARIABLE_INSTANCE && (symbol.value !== null || self.prefix === "")) {
      self.emitNewlineBeforeSymbol(symbol);
      self.emitComments(symbol.comments);
      self.emit(self.indent + (self.prefix === "" && !symbol.isExported() || symbol.kind === skew.SymbolKind.VARIABLE_LOCAL ? "var " : self.prefix) + skew.JsEmitter.mangleName(symbol));

      if (symbol.value !== null) {
        self.emit(" = ");
        self.emitExpression(symbol.value, skew.Precedence.LOWEST);
      }

      self.emit(";\n");
      self.emitNewlineAfterSymbol(symbol);
    }
  };

  skew.JsEmitter.prototype.emitStatements = function(statements) {
    var self = this;
    self.previousNode = null;

    for (var i = 0, list = statements, count = in_List.count(list); i < count; ++i) {
      var statement = list[i];
      self.emitNewlineBeforeStatement(statement);
      self.emitComments(statement.comments);
      self.emitStatement(statement);
      self.emitNewlineAfterStatement(statement);
    }

    self.previousNode = null;
  };

  skew.JsEmitter.prototype.emitBlock = function(node) {
    var self = this;
    self.emit(" {\n");
    self.increaseIndent();
    self.emitStatements(node.children);
    self.decreaseIndent();
    self.emit(self.indent + "}");
  };

  skew.JsEmitter.prototype.emitStatement = function(node) {
    var self = this;
    switch (node.kind) {
      case skew.NodeKind.VAR: {
        self.emitVariable(node.symbol.asVariableSymbol());
        break;
      }

      case skew.NodeKind.EXPRESSION: {
        self.emit(self.indent);
        self.emitExpression(node.expressionValue(), skew.Precedence.LOWEST);
        self.emit(";\n");
        break;
      }

      case skew.NodeKind.BREAK: {
        self.emit(self.indent + "break;\n");
        break;
      }

      case skew.NodeKind.CONTINUE: {
        self.emit(self.indent + "continue;\n");
        break;
      }

      case skew.NodeKind.RETURN: {
        self.emit(self.indent + "return");
        var value = node.returnValue();

        if (value !== null) {
          self.emit(" ");
          self.emitExpression(value, skew.Precedence.LOWEST);
        }

        self.emit(";\n");
        break;
      }

      case skew.NodeKind.THROW: {
        self.emit(self.indent + "throw ");
        self.emitExpression(node.throwValue(), skew.Precedence.LOWEST);
        self.emit(";\n");
        break;
      }

      case skew.NodeKind.FOR: {
        var test = node.forTest();
        var update = node.forUpdate();
        var children = node.children;
        var count = in_List.count(children);
        self.emit(self.indent + "for (");

        if (count > 3) {
          for (var i = 3, count1 = count; i < count1; i += 1) {
            var child = children[i];

            if (i !== 3) {
              self.emit(", ");
            }

            if (child.kind === skew.NodeKind.VAR) {
              var symbol = child.symbol.asVariableSymbol();

              if (i === 3) {
                self.emit("var ");
              }

              self.emit(skew.JsEmitter.mangleName(symbol) + " = ");
              self.emitExpression(symbol.value, skew.Precedence.LOWEST);
            }

            else {
              self.emitExpression(child, skew.Precedence.LOWEST);
            }
          }
        }

        self.emit("; ");

        if (test !== null) {
          self.emitExpression(test, skew.Precedence.LOWEST);
        }

        self.emit("; ");

        if (update !== null) {
          self.emitExpression(update, skew.Precedence.LOWEST);
        }

        self.emit(")");
        self.emitBlock(node.forBlock());
        self.emit("\n");
        break;
      }

      case skew.NodeKind.FOREACH: {
        self.emit(self.indent + "for (var " + skew.JsEmitter.mangleName(node.symbol) + " in ");
        self.emitExpression(node.foreachValue(), skew.Precedence.LOWEST);
        self.emit(")");
        self.emitBlock(node.foreachBlock());
        self.emit("\n");
        break;
      }

      case skew.NodeKind.IF: {
        self.emit(self.indent);
        self.emitIf(node);
        self.emit("\n");
        break;
      }

      case skew.NodeKind.SWITCH: {
        var cases = node.children;
        self.emit(self.indent + "switch (");
        self.emitExpression(node.switchValue(), skew.Precedence.LOWEST);
        self.emit(") {\n");
        self.increaseIndent();

        for (var i = 1, count3 = in_List.count(cases); i < count3; i += 1) {
          var child = cases[i];
          var values = child.children;

          if (i !== 1) {
            self.emit("\n");
          }

          if (in_List.count(values) === 1) {
            self.emit(self.indent + "default:");
          }

          else {
            for (var j = 1, count2 = in_List.count(values); j < count2; j += 1) {
              if (j !== 1) {
                self.emit("\n");
              }

              self.emit(self.indent + "case ");
              self.emitExpression(values[j], skew.Precedence.LOWEST);
              self.emit(":");
            }
          }

          self.emit(" {\n");
          self.increaseIndent();
          self.emitStatements(child.caseBlock().children);
          self.emit(self.indent + "break;\n");
          self.decreaseIndent();
          self.emit(self.indent + "}\n");
        }

        self.decreaseIndent();
        self.emit(self.indent + "}\n");
        break;
      }

      case skew.NodeKind.TRY: {
        var children = node.children;
        var finallyBlock = node.finallyBlock();
        self.emit(self.indent + "try");
        self.emitBlock(node.tryBlock());
        self.emit("\n");

        for (var i = 1, count4 = in_List.count(children) - 1; i < count4; i += 1) {
          var child = children[i];
          self.emit("\n");
          self.emitComments(child.comments);
          self.emit(self.indent + "catch (" + (child.symbol !== null ? skew.JsEmitter.mangleName(child.symbol) : "$e") + ")");
          self.emitBlock(child.catchBlock());
          self.emit("\n");
        }

        if (finallyBlock !== null) {
          self.emit("\n");
          self.emitComments(finallyBlock.comments);
          self.emit(self.indent + "finally");
          self.emitBlock(finallyBlock);
          self.emit("\n");
        }
        break;
      }

      case skew.NodeKind.WHILE: {
        self.emit(self.indent + "while (");
        self.emitExpression(node.whileTest(), skew.Precedence.LOWEST);
        self.emit(")");
        self.emitBlock(node.whileBlock());
        self.emit("\n");
        break;
      }

      default: {
        assert(false);
        break;
      }
    }
  };

  skew.JsEmitter.prototype.emitIf = function(node) {
    var self = this;
    self.emit("if (");
    self.emitExpression(node.ifTest(), skew.Precedence.LOWEST);
    self.emit(")");
    self.emitBlock(node.ifTrue());
    var block = node.ifFalse();

    if (block !== null) {
      var singleIf = in_List.count(block.children) === 1 && block.children[0].kind === skew.NodeKind.IF ? block.children[0] : null;
      self.emit("\n\n");
      self.emitComments(block.comments);

      if (singleIf !== null) {
        self.emitComments(singleIf.comments);
      }

      self.emit(self.indent + "else");

      if (singleIf !== null) {
        self.emit(" ");
        self.emitIf(singleIf);
      }

      else {
        self.emitBlock(block);
      }
    }
  };

  skew.JsEmitter.prototype.emitExpression = function(node, precedence) {
    var self = this;
    switch (node.kind) {
      case skew.NodeKind.TYPE: {
        self.emit(skew.JsEmitter.fullName(node.resolvedType.symbol));
        break;
      }

      case skew.NodeKind.NULL: {
        self.emit("null");
        break;
      }

      case skew.NodeKind.NAME: {
        self.emit(node.symbol !== null ? skew.JsEmitter.fullName(node.symbol) : node.asString());
        break;
      }

      case skew.NodeKind.DOT: {
        self.emitExpression(node.dotTarget(), skew.Precedence.MEMBER);
        self.emit("." + (node.symbol !== null ? skew.JsEmitter.mangleName(node.symbol) : node.asString()));
        break;
      }

      case skew.NodeKind.CONSTANT: {
        var value = node.content;

        switch (value.kind()) {
          case skew.ContentKind.BOOL: {
            self.emit(value.asBool().toString());
            break;
          }

          case skew.ContentKind.INT: {
            self.emit(value.asInt().toString());
            break;
          }

          case skew.ContentKind.DOUBLE: {
            self.emit(value.asDouble().toString());
            break;
          }

          case skew.ContentKind.STRING: {
            self.emit(skew.quoteString(value.asString(), 34));
            break;
          }
        }
        break;
      }

      case skew.NodeKind.CALL: {
        var value = node.callValue();
        var $call = value.kind === skew.NodeKind.SUPER;
        var wrap = value.kind === skew.NodeKind.LAMBDA && node.parent !== null && node.parent.kind === skew.NodeKind.EXPRESSION;

        if (wrap) {
          self.emit("(");
        }

        if (!$call && node.symbol !== null && node.symbol.kind === skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
          self.emit("new " + skew.JsEmitter.fullName(node.symbol));
        }

        else {
          self.emitExpression(value, skew.Precedence.UNARY_POSTFIX);

          if ($call) {
            self.emit(".call");
          }
        }

        if (wrap) {
          self.emit(")");
        }

        self.emit("(");

        if ($call) {
          self.emit(skew.JsEmitter.mangleName(node.symbol.asFunctionSymbol().self));
        }

        for (var i = 1, count = in_List.count(node.children); i < count; i += 1) {
          if ($call || i > 1) {
            self.emit(", ");
          }

          self.emitExpression(node.children[i], skew.Precedence.LOWEST);
        }

        self.emit(")");
        break;
      }

      case skew.NodeKind.INITIALIZER_LIST:
      case skew.NodeKind.INITIALIZER_MAP:
      case skew.NodeKind.INITIALIZER_SET: {
        var useBraces = node.kind === skew.NodeKind.INITIALIZER_MAP || node.kind === skew.NodeKind.INITIALIZER_SET && in_List.isEmpty(node.children);
        self.emit(useBraces ? "{" : "[");

        for (var i = 0, count1 = in_List.count(node.children); i < count1; i += 1) {
          if (i !== 0) {
            self.emit(", ");
          }

          self.emitExpression(node.children[i], skew.Precedence.LOWEST);
        }

        self.emit(useBraces ? "}" : "]");
        break;
      }

      case skew.NodeKind.PAIR: {
        self.emitExpression(node.firstValue(), skew.Precedence.LOWEST);
        self.emit(": ");
        self.emitExpression(node.secondValue(), skew.Precedence.LOWEST);
        break;
      }

      case skew.NodeKind.INDEX: {
        self.emitExpression(node.children[0], skew.Precedence.UNARY_POSTFIX);
        self.emit("[");

        for (var i = 1, count2 = in_List.count(node.children); i < count2; i += 1) {
          if (i > 1) {
            self.emit(", ");
          }

          self.emitExpression(node.children[i], skew.Precedence.LOWEST);
        }

        self.emit("]");
        break;
      }

      case skew.NodeKind.ASSIGN_INDEX: {
        if (((skew.Precedence.ASSIGN) | 0) < ((precedence) | 0)) {
          self.emit("(");
        }

        self.emitExpression(in_List.first(node.children), skew.Precedence.UNARY_POSTFIX);
        self.emit("[");

        for (var i = 1, count3 = in_List.count(node.children) - 1; i < count3; i += 1) {
          if (i > 1) {
            self.emit(", ");
          }

          self.emitExpression(node.children[i], skew.Precedence.LOWEST);
        }

        self.emit("] = ");
        self.emitExpression(in_List.last(node.children), skew.Precedence.LOWEST);

        if (((skew.Precedence.ASSIGN) | 0) < ((precedence) | 0)) {
          self.emit(")");
        }
        break;
      }

      case skew.NodeKind.CAST: {
        var value = node.castValue();
        var from = value.resolvedType;
        var to = node.resolvedType;

        if (from.isEnum() && to === self.cache.stringType) {
          self.emit(skew.JsEmitter.fullName(from.symbol) + "[");
          self.emitExpression(value, precedence);
          self.emit("]");
        }

        else if (from === self.cache.stringType && to.isEnum()) {
          self.emit(skew.JsEmitter.fullName(to.symbol) + "[");
          self.emitExpression(value, precedence);
          self.emit("]");
        }

        // TODO: Do this better
        else if (to === self.cache.intType) {
          self.emit("((");
          self.emitExpression(value, precedence);
          self.emit(") | 0)");
        }

        else {
          self.emitExpression(value, precedence);
        }
        break;
      }

      case skew.NodeKind.PARAMETERIZE: {
        self.emitExpression(node.parameterizeValue(), precedence);
        break;
      }

      case skew.NodeKind.SUPER: {
        self.emit(skew.JsEmitter.fullName(node.symbol));
        break;
      }

      case skew.NodeKind.HOOK: {
        if (((skew.Precedence.ASSIGN) | 0) < ((precedence) | 0)) {
          self.emit("(");
        }

        self.emitExpression(node.hookTest(), skew.Precedence.LOGICAL_OR);
        self.emit(" ? ");
        self.emitExpression(node.hookTrue(), skew.Precedence.ASSIGN);
        self.emit(" : ");
        self.emitExpression(node.hookFalse(), skew.Precedence.ASSIGN);

        if (((skew.Precedence.ASSIGN) | 0) < ((precedence) | 0)) {
          self.emit(")");
        }
        break;
      }

      case skew.NodeKind.LAMBDA: {
        var symbol = node.symbol.asFunctionSymbol();
        self.emit("function(");
        self.emitArgumentList(symbol.$arguments);
        self.emit(")");
        self.emitBlock(symbol.block);
        break;
      }

      default: {
        if (skew.NodeKind.isUnary(node.kind)) {
          var value = node.unaryValue();
          var info = skew.operatorInfo[((node.kind) | 0)];

          if (((info.precedence) | 0) < ((precedence) | 0)) {
            self.emit("(");
          }

          self.emit(info.text);
          self.emitExpression(value, info.precedence);

          if (((info.precedence) | 0) < ((precedence) | 0)) {
            self.emit(")");
          }
        }

        // TODO: Remove hack
        else if (node.kind === skew.NodeKind.DIVIDE && node.resolvedType === self.cache.intType) {
          self.emit("((");
          self.emitExpression(node.binaryLeft(), skew.Precedence.LOWEST);
          self.emit(") / (");
          self.emitExpression(node.binaryRight(), skew.Precedence.LOWEST);
          self.emit(") | 0)");
        }

        else if (skew.NodeKind.isBinary(node.kind)) {
          var info = skew.operatorInfo[((node.kind) | 0)];

          if (((info.precedence) | 0) < ((precedence) | 0)) {
            self.emit("(");
          }

          self.emitExpression(node.binaryLeft(), skew.Precedence.incrementIfRightAssociative(info.precedence, info.associativity));
          self.emit(node.kind === skew.NodeKind.EQUAL ? " === " : node.kind === skew.NodeKind.NOT_EQUAL ? " !== " : " " + info.text + " ");
          self.emitExpression(node.binaryRight(), skew.Precedence.incrementIfLeftAssociative(info.precedence, info.associativity));

          if (((info.precedence) | 0) < ((precedence) | 0)) {
            self.emit(")");
          }
        }

        else {
          assert(false);
        }
        break;
      }
    }
  };

  skew.JsEmitter.fullName = function(symbol) {
    var parent = symbol.parent;

    if (parent !== null && parent.kind !== skew.SymbolKind.OBJECT_GLOBAL) {
      var enclosingName = skew.JsEmitter.fullName(parent);

      if (symbol.kind === skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
        return enclosingName;
      }

      if (symbol.kind === skew.SymbolKind.FUNCTION_INSTANCE) {
        enclosingName += ".prototype";
      }

      return enclosingName + "." + skew.JsEmitter.mangleName(symbol);
    }

    return skew.JsEmitter.mangleName(symbol);
  };

  skew.JsEmitter.mangleName = function(symbol) {
    if (symbol.kind === skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
      symbol = symbol.parent;
    }

    if (!symbol.isImportedOrExported() && symbol.name in skew.JsEmitter.isKeyword) {
      return "$" + symbol.name;
    }

    return symbol.name;
  };

  skew.JsEmitter.needsExtends = function(objects) {
    for (var i = 0, list = objects, count = in_List.count(list); i < count; ++i) {
      var object = list[i];

      if (!object.isImported() && object.baseClass !== null) {
        return true;
      }
    }

    return false;
  };

  skew.JsEmitter.computePrefix = function(symbol) {
    assert(skew.SymbolKind.isObject(symbol.kind));
    return symbol.kind === skew.SymbolKind.OBJECT_GLOBAL ? "" : skew.JsEmitter.computePrefix(symbol.parent.asObjectSymbol()) + skew.JsEmitter.mangleName(symbol) + ".";
  };

  skew.ContentKind = {
    BOOL: 0, 0: "BOOL",
    INT: 1, 1: "INT",
    DOUBLE: 2, 2: "DOUBLE",
    STRING: 3, 3: "STRING"
  };

  skew.Content = function() {
    var self = this;
  };

  skew.Content.prototype.asBool = function() {
    var self = this;
    assert(self.kind() === skew.ContentKind.BOOL);
    return self.value;
  };

  skew.Content.prototype.asInt = function() {
    var self = this;
    assert(self.kind() === skew.ContentKind.INT);
    return self.value;
  };

  skew.Content.prototype.asDouble = function() {
    var self = this;
    assert(self.kind() === skew.ContentKind.DOUBLE);
    return self.value;
  };

  skew.Content.prototype.asString = function() {
    var self = this;
    assert(self.kind() === skew.ContentKind.STRING);
    return self.value;
  };

  skew.BoolContent = function(value) {
    var self = this;
    skew.Content.call(self);
    self.value = value;
  };

  $extends(skew.BoolContent, skew.Content);

  skew.BoolContent.prototype.kind = function() {
    var self = this;
    return skew.ContentKind.BOOL;
  };

  skew.IntContent = function(value) {
    var self = this;
    skew.Content.call(self);
    self.value = value;
  };

  $extends(skew.IntContent, skew.Content);

  skew.IntContent.prototype.kind = function() {
    var self = this;
    return skew.ContentKind.INT;
  };

  skew.DoubleContent = function(value) {
    var self = this;
    skew.Content.call(self);
    self.value = value;
  };

  $extends(skew.DoubleContent, skew.Content);

  skew.DoubleContent.prototype.kind = function() {
    var self = this;
    return skew.ContentKind.DOUBLE;
  };

  skew.StringContent = function(value) {
    var self = this;
    skew.Content.call(self);
    self.value = value;
  };

  $extends(skew.StringContent, skew.Content);

  skew.StringContent.prototype.kind = function() {
    var self = this;
    return skew.ContentKind.STRING;
  };

  skew.NodeKind = {
    // Other
    ANNOTATION: 0, 0: "ANNOTATION",
    BLOCK: 1, 1: "BLOCK",
    CASE: 2, 2: "CASE",
    CATCH: 3, 3: "CATCH",

    // Statements
    BREAK: 4, 4: "BREAK",
    CONTINUE: 5, 5: "CONTINUE",
    EXPRESSION: 6, 6: "EXPRESSION",
    FOR: 7, 7: "FOR",
    FOREACH: 8, 8: "FOREACH",
    IF: 9, 9: "IF",
    RETURN: 10, 10: "RETURN",
    SWITCH: 11, 11: "SWITCH",
    THROW: 12, 12: "THROW",
    TRY: 13, 13: "TRY",
    VAR: 14, 14: "VAR",
    WHILE: 15, 15: "WHILE",

    // Expressions
    ASSIGN_INDEX: 16, 16: "ASSIGN_INDEX",
    CALL: 17, 17: "CALL",
    CAST: 18, 18: "CAST",
    CONSTANT: 19, 19: "CONSTANT",
    DOT: 20, 20: "DOT",
    DYNAMIC: 21, 21: "DYNAMIC",
    HOOK: 22, 22: "HOOK",
    INDEX: 23, 23: "INDEX",
    INITIALIZER_LIST: 24, 24: "INITIALIZER_LIST",
    INITIALIZER_MAP: 25, 25: "INITIALIZER_MAP",
    INITIALIZER_SET: 26, 26: "INITIALIZER_SET",
    INTERPOLATE: 27, 27: "INTERPOLATE",
    LAMBDA: 28, 28: "LAMBDA",
    LAMBDA_TYPE: 29, 29: "LAMBDA_TYPE",
    NAME: 30, 30: "NAME",
    NULL: 31, 31: "NULL",
    PAIR: 32, 32: "PAIR",
    PARAMETERIZE: 33, 33: "PARAMETERIZE",
    SEQUENCE: 34, 34: "SEQUENCE",
    SUPER: 35, 35: "SUPER",
    TYPE: 36, 36: "TYPE",

    // Unary operators
    COMPLEMENT: 37, 37: "COMPLEMENT",
    DECREMENT: 38, 38: "DECREMENT",
    INCREMENT: 39, 39: "INCREMENT",
    NEGATIVE: 40, 40: "NEGATIVE",
    NOT: 41, 41: "NOT",
    POSITIVE: 42, 42: "POSITIVE",

    // Binary operators
    ADD: 43, 43: "ADD",
    BITWISE_AND: 44, 44: "BITWISE_AND",
    BITWISE_OR: 45, 45: "BITWISE_OR",
    BITWISE_XOR: 46, 46: "BITWISE_XOR",
    COMPARE: 47, 47: "COMPARE",
    DIVIDE: 48, 48: "DIVIDE",
    EQUAL: 49, 49: "EQUAL",
    IN: 50, 50: "IN",
    LOGICAL_AND: 51, 51: "LOGICAL_AND",
    LOGICAL_OR: 52, 52: "LOGICAL_OR",
    MULTIPLY: 53, 53: "MULTIPLY",
    NOT_EQUAL: 54, 54: "NOT_EQUAL",
    POWER: 55, 55: "POWER",
    REMAINDER: 56, 56: "REMAINDER",
    SHIFT_LEFT: 57, 57: "SHIFT_LEFT",
    SHIFT_RIGHT: 58, 58: "SHIFT_RIGHT",
    SUBTRACT: 59, 59: "SUBTRACT",

    // Binary comparison operators
    GREATER_THAN: 60, 60: "GREATER_THAN",
    GREATER_THAN_OR_EQUAL: 61, 61: "GREATER_THAN_OR_EQUAL",
    LESS_THAN: 62, 62: "LESS_THAN",
    LESS_THAN_OR_EQUAL: 63, 63: "LESS_THAN_OR_EQUAL",

    // Binary assigment operators
    ASSIGN: 64, 64: "ASSIGN",
    ASSIGN_ADD: 65, 65: "ASSIGN_ADD",
    ASSIGN_BITWISE_AND: 66, 66: "ASSIGN_BITWISE_AND",
    ASSIGN_BITWISE_OR: 67, 67: "ASSIGN_BITWISE_OR",
    ASSIGN_BITWISE_XOR: 68, 68: "ASSIGN_BITWISE_XOR",
    ASSIGN_DIVIDE: 69, 69: "ASSIGN_DIVIDE",
    ASSIGN_MULTIPLY: 70, 70: "ASSIGN_MULTIPLY",
    ASSIGN_POWER: 71, 71: "ASSIGN_POWER",
    ASSIGN_REMAINDER: 72, 72: "ASSIGN_REMAINDER",
    ASSIGN_SHIFT_LEFT: 73, 73: "ASSIGN_SHIFT_LEFT",
    ASSIGN_SHIFT_RIGHT: 74, 74: "ASSIGN_SHIFT_RIGHT",
    ASSIGN_SUBTRACT: 75, 75: "ASSIGN_SUBTRACT"
  };

  skew.NodeKind.isStatement = function(self) {
    return ((self) | 0) >= ((skew.NodeKind.ASSIGN) | 0) && ((self) | 0) <= ((skew.NodeKind.WHILE) | 0);
  };

  skew.NodeKind.isExpression = function(self) {
    return ((self) | 0) >= ((skew.NodeKind.ASSIGN_INDEX) | 0) && ((self) | 0) <= ((skew.NodeKind.ASSIGN_SUBTRACT) | 0);
  };

  skew.NodeKind.isInitializer = function(self) {
    return ((self) | 0) >= ((skew.NodeKind.INITIALIZER_LIST) | 0) && ((self) | 0) <= ((skew.NodeKind.INITIALIZER_SET) | 0);
  };

  skew.NodeKind.isUnary = function(self) {
    return ((self) | 0) >= ((skew.NodeKind.COMPLEMENT) | 0) && ((self) | 0) <= ((skew.NodeKind.POSITIVE) | 0);
  };

  skew.NodeKind.isUnaryAssign = function(self) {
    return ((self) | 0) >= ((skew.NodeKind.DECREMENT) | 0) && ((self) | 0) <= ((skew.NodeKind.INCREMENT) | 0);
  };

  skew.NodeKind.isBinary = function(self) {
    return ((self) | 0) >= ((skew.NodeKind.ADD) | 0) && ((self) | 0) <= ((skew.NodeKind.ASSIGN_SUBTRACT) | 0);
  };

  skew.NodeKind.isBinaryAssign = function(self) {
    return ((self) | 0) >= ((skew.NodeKind.ASSIGN) | 0) && ((self) | 0) <= ((skew.NodeKind.ASSIGN_SUBTRACT) | 0);
  };

  skew.NodeKind.isBinaryComparison = function(self) {
    return ((self) | 0) >= ((skew.NodeKind.GREATER_THAN) | 0) && ((self) | 0) <= ((skew.NodeKind.LESS_THAN_OR_EQUAL) | 0);
  };

  skew.NodeKind.isJump = function(self) {
    return self === skew.NodeKind.BREAK || self === skew.NodeKind.CONTINUE || self === skew.NodeKind.RETURN;
  };

  skew.NodeKind.isAssign = function(self) {
    return skew.NodeKind.isUnaryAssign(self) || skew.NodeKind.isBinaryAssign(self);
  };

  // Flags
  // Nodes represent executable code (variable initializers and function bodies)
  // Node-specific queries
  // Factory functions
  // Getters
  skew.Node = function(kind) {
    var self = this;
    self.kind = kind;
    self.flags = 0;
    self.range = null;
    self.internalRange = null;
    self.symbol = null;
    self.parent = null;
    self.content = null;
    self.resolvedType = null;
    self.comments = null;
    self.children = [];
  };

  // Change self node in place to become the provided node. The parent node is
  // not changed, so become() can be called within a nested method and does not
  // need to report the updated node reference to the caller since the reference
  // does not change.
  skew.Node.prototype.become = function(node) {
    var self = this;
    self.kind = node.kind;
    self.flags = node.flags;
    self.range = node.range;
    self.internalRange = node.internalRange;
    self.symbol = node.symbol;
    self.content = node.content;
    self.resolvedType = node.resolvedType;
    self.comments = node.comments;
    self.removeChildren();
    self.withChildren(node.removeChildren());
  };

  skew.Node.prototype.clone = function() {
    var self = this;
    var clone = new skew.Node(self.kind);
    clone.flags = self.flags;
    clone.range = self.range;
    clone.internalRange = self.internalRange;
    clone.symbol = self.symbol;
    clone.content = self.content;
    clone.resolvedType = self.resolvedType;
    clone.comments = self.comments !== null ? in_List.clone(self.comments) : null;
    clone.children = self.children !== null ? self.children.map(function(child) {
      return child.clone();
    }) : null;
    return clone;
  };

  skew.Node.prototype.isImplicitReturn = function() {
    var self = this;
    return (self.flags & skew.Node.IS_IMPLICIT_RETURN) !== 0;
  };

  skew.Node.prototype.isInsideParentheses = function() {
    var self = this;
    return (self.flags & skew.Node.IS_INSIDE_PARENTHESES) !== 0;
  };

  skew.Node.prototype.withFlags = function(value) {
    var self = this;
    self.flags = value;
    return self;
  };

  skew.Node.prototype.withType = function(value) {
    var self = this;
    self.resolvedType = value;
    return self;
  };

  skew.Node.prototype.withSymbol = function(value) {
    var self = this;
    self.symbol = value;
    return self;
  };

  skew.Node.prototype.withContent = function(value) {
    var self = this;
    self.content = value;
    return self;
  };

  skew.Node.prototype.withRange = function(value) {
    var self = this;
    self.range = value;
    return self;
  };

  skew.Node.prototype.withInternalRange = function(value) {
    var self = this;
    self.internalRange = value;
    return self;
  };

  skew.Node.prototype.withChildren = function(nodes) {
    var self = this;
    assert(in_List.isEmpty(self.children));

    for (var i = 0, list = nodes, count = in_List.count(list); i < count; ++i) {
      var node = list[i];
      skew.Node.updateParent(node, self);
    }

    self.children = nodes;
    return self;
  };

  skew.Node.prototype.withComments = function(value) {
    var self = this;
    assert(self.comments === null);
    self.comments = value;
    return self;
  };

  skew.Node.prototype.internalRangeOrRange = function() {
    var self = this;
    return self.internalRange !== null ? self.internalRange : self.range;
  };

  skew.Node.prototype.indexInParent = function() {
    var self = this;
    assert(self.parent !== null);
    return self.parent.children.indexOf(self);
  };

  skew.Node.prototype.insertChild = function(index, node) {
    var self = this;
    assert(index >= 0 && index <= in_List.count(self.children));
    skew.Node.updateParent(node, self);
    in_List.insert(self.children, index, node);
  };

  skew.Node.prototype.appendChild = function(node) {
    var self = this;
    self.insertChild(in_List.count(self.children), node);
  };

  skew.Node.prototype.removeChildAtIndex = function(index) {
    var self = this;
    assert(index >= 0 && index < in_List.count(self.children));
    var child = self.children[index];
    skew.Node.updateParent(child, null);
    in_List.removeAt(self.children, index);
    return child;
  };

  skew.Node.prototype.remove = function() {
    var self = this;
    self.parent.removeChildAtIndex(self.indexInParent());
    return self;
  };

  skew.Node.prototype.removeChildren = function() {
    var self = this;
    var result = self.children;

    for (var i = 0, list = self.children, count = in_List.count(list); i < count; ++i) {
      var child = list[i];
      skew.Node.updateParent(child, null);
    }

    self.children = [];
    return result;
  };

  skew.Node.prototype.replaceChild = function(index, node) {
    var self = this;
    assert(index >= 0 && index < in_List.count(self.children));
    skew.Node.updateParent(node, self);
    var child = self.children[index];
    skew.Node.updateParent(child, null);
    self.children[index] = node;
    return child;
  };

  skew.Node.prototype.replaceWith = function(node) {
    var self = this;
    self.parent.replaceChild(self.indexInParent(), node);
    return self;
  };

  skew.Node.prototype.replaceWithNull = function() {
    var self = this;
    self.parent.replaceChild(self.indexInParent(), null);
    return self;
  };

  skew.Node.prototype.swapWith = function(node) {
    var self = this;
    var parentA = self.parent;
    var parentB = node.parent;
    var indexA = self.indexInParent();
    var indexB = node.indexInParent();
    parentA.children[indexA] = node;
    parentB.children[indexB] = self;
    self.parent = parentB;
    node.parent = parentA;
  };

  skew.Node.updateParent = function(node, parent) {
    if (node !== null) {
      assert(node.parent === null !== (parent === null));
      node.parent = parent;
    }
  };

  skew.Node.prototype.isTrue = function() {
    var self = this;
    return self.kind === skew.NodeKind.CONSTANT && self.content.kind() === skew.ContentKind.BOOL && self.content.asBool();
  };

  skew.Node.prototype.isFalse = function() {
    var self = this;
    return self.kind === skew.NodeKind.CONSTANT && self.content.kind() === skew.ContentKind.BOOL && !self.content.asBool();
  };

  skew.Node.prototype.isType = function() {
    var self = this;
    return self.kind === skew.NodeKind.TYPE || self.kind === skew.NodeKind.LAMBDA_TYPE || (self.kind === skew.NodeKind.NAME || self.kind === skew.NodeKind.DOT || self.kind === skew.NodeKind.PARAMETERIZE) && self.symbol !== null && skew.SymbolKind.isType(self.symbol.kind);
  };

  skew.Node.prototype.blockAlwaysEndsWithReturn = function() {
    var self = this;
    assert(self.kind === skew.NodeKind.BLOCK);

    // This checks children in reverse since return statements are almost always last
    for (var i = 0, count = in_List.count(self.children); i < count; i += 1) {
      var child = self.children[in_List.count(self.children) - i - 1];

      switch (child.kind) {
        case skew.NodeKind.RETURN: {
          return true;
          break;
        }

        case skew.NodeKind.IF: {
          var test = child.ifTest();
          var trueBlock = child.ifTrue();
          var falseBlock = child.ifFalse();

          if ((test.isTrue() || falseBlock !== null && falseBlock.blockAlwaysEndsWithReturn()) && (test.isFalse() || trueBlock.blockAlwaysEndsWithReturn())) {
            return true;
          }
          break;
        }

        case skew.NodeKind.WHILE: {
          if (child.whileTest().isTrue()) {
            return true;
          }
          break;
        }
      }
    }

    return false;
  };

  skew.Node.createAnnotation = function(value, test) {
    assert(skew.NodeKind.isExpression(value.kind));
    assert(test === null || skew.NodeKind.isExpression(test.kind));
    return new skew.Node(skew.NodeKind.ANNOTATION).withChildren([value, test]);
  };

  skew.Node.createBlock = function(statements) {
    return new skew.Node(skew.NodeKind.BLOCK).withChildren(statements);
  };

  skew.Node.createCase = function(values, block) {
    assert(block.kind === skew.NodeKind.BLOCK);
    in_List.prepend1(values, block);
    return new skew.Node(skew.NodeKind.CASE).withChildren(values);
  };

  skew.Node.createCatch = function(symbol, block) {
    assert(block.kind === skew.NodeKind.BLOCK);
    return new skew.Node(skew.NodeKind.CATCH).withChildren([block]).withSymbol(symbol);
  };

  skew.Node.createBreak = function() {
    return new skew.Node(skew.NodeKind.BREAK);
  };

  skew.Node.createContinue = function() {
    return new skew.Node(skew.NodeKind.CONTINUE);
  };

  skew.Node.createExpression = function(value) {
    assert(skew.NodeKind.isExpression(value.kind));
    return new skew.Node(skew.NodeKind.EXPRESSION).withChildren([value]);
  };

  skew.Node.createFor = function(setup, test, update, block) {
    assert(test === null || skew.NodeKind.isExpression(test.kind));
    assert(update === null || skew.NodeKind.isExpression(update.kind));
    assert(block.kind === skew.NodeKind.BLOCK);
    in_List.prepend2(setup, [test, update, block]);
    return new skew.Node(skew.NodeKind.FOR).withChildren(setup);
  };

  skew.Node.createForeach = function(symbol, value, block) {
    assert(skew.NodeKind.isExpression(value.kind));
    assert(block.kind === skew.NodeKind.BLOCK);
    return new skew.Node(skew.NodeKind.FOREACH).withSymbol(symbol).withChildren([value, block]);
  };

  skew.Node.createIf = function(test, trueBlock, falseBlock) {
    assert(skew.NodeKind.isExpression(test.kind));
    assert(trueBlock.kind === skew.NodeKind.BLOCK);
    assert(falseBlock === null || falseBlock.kind === skew.NodeKind.BLOCK);
    return new skew.Node(skew.NodeKind.IF).withChildren([test, trueBlock, falseBlock]);
  };

  skew.Node.createReturn = function(value) {
    assert(value === null || skew.NodeKind.isExpression(value.kind));
    return new skew.Node(skew.NodeKind.RETURN).withChildren([value]);
  };

  skew.Node.createSwitch = function(value, cases) {
    assert(skew.NodeKind.isExpression(value.kind));
    in_List.prepend1(cases, value);
    return new skew.Node(skew.NodeKind.SWITCH).withChildren(cases);
  };

  skew.Node.createThrow = function(value) {
    assert(skew.NodeKind.isExpression(value.kind));
    return new skew.Node(skew.NodeKind.THROW).withChildren([value]);
  };

  skew.Node.createTry = function(tryBlock, catches, finallyBlock) {
    assert(tryBlock.kind === skew.NodeKind.BLOCK);
    assert(finallyBlock === null || finallyBlock.kind === skew.NodeKind.BLOCK);
    in_List.prepend1(catches, tryBlock);
    in_List.append1(catches, finallyBlock);
    return new skew.Node(skew.NodeKind.TRY).withChildren(catches);
  };

  skew.Node.createVar = function(symbol) {
    return new skew.Node(skew.NodeKind.VAR).withSymbol(symbol);
  };

  skew.Node.createWhile = function(test, block) {
    return new skew.Node(skew.NodeKind.WHILE).withChildren([test, block]);
  };

  skew.Node.createAssignIndex = function(target, $arguments, value) {
    assert(skew.NodeKind.isExpression(target.kind));
    assert(skew.NodeKind.isExpression(value.kind));
    in_List.prepend1($arguments, target);
    in_List.append1($arguments, value);
    return new skew.Node(skew.NodeKind.ASSIGN_INDEX).withChildren($arguments);
  };

  skew.Node.createIndex = function(target, $arguments) {
    assert(skew.NodeKind.isExpression(target.kind));
    in_List.prepend1($arguments, target);
    return new skew.Node(skew.NodeKind.INDEX).withChildren($arguments);
  };

  skew.Node.createCall = function(target, $arguments) {
    assert(skew.NodeKind.isExpression(target.kind));
    in_List.prepend1($arguments, target);
    return new skew.Node(skew.NodeKind.CALL).withChildren($arguments);
  };

  skew.Node.createCast = function(value, type) {
    assert(skew.NodeKind.isExpression(value.kind));
    assert(skew.NodeKind.isExpression(type.kind));
    return new skew.Node(skew.NodeKind.CAST).withChildren([value, type]);
  };

  skew.Node.createBool = function(value) {
    return skew.Node.createConstant(new skew.BoolContent(value));
  };

  skew.Node.createInt = function(value) {
    return skew.Node.createConstant(new skew.IntContent(value));
  };

  skew.Node.createDouble = function(value) {
    return skew.Node.createConstant(new skew.DoubleContent(value));
  };

  skew.Node.createString = function(value) {
    return skew.Node.createConstant(new skew.StringContent(value));
  };

  skew.Node.createConstant = function(value) {
    return new skew.Node(skew.NodeKind.CONSTANT).withContent(value);
  };

  skew.Node.createDot = function(target, name) {
    return new skew.Node(skew.NodeKind.DOT).withContent(new skew.StringContent(name)).withChildren([target]);
  };

  skew.Node.createHook = function(test, trueValue, falseValue) {
    assert(skew.NodeKind.isExpression(test.kind));
    assert(skew.NodeKind.isExpression(trueValue.kind));
    assert(skew.NodeKind.isExpression(falseValue.kind));
    return new skew.Node(skew.NodeKind.HOOK).withChildren([test, trueValue, falseValue]);
  };

  skew.Node.createList = function(values) {
    return new skew.Node(skew.NodeKind.INITIALIZER_LIST).withChildren(values);
  };

  skew.Node.createInitializer = function(kind, values) {
    assert(skew.NodeKind.isInitializer(kind));
    return new skew.Node(kind).withChildren(values);
  };

  skew.Node.createInterpolate = function(left, right) {
    return new skew.Node(skew.NodeKind.INTERPOLATE).withChildren([left, right]);
  };

  skew.Node.createLambda = function(symbol) {
    return new skew.Node(skew.NodeKind.LAMBDA).withSymbol(symbol);
  };

  skew.Node.createName = function(text) {
    return new skew.Node(skew.NodeKind.NAME).withContent(new skew.StringContent(text));
  };

  skew.Node.createDynamic = function() {
    return new skew.Node(skew.NodeKind.DYNAMIC);
  };

  skew.Node.createNull = function() {
    return new skew.Node(skew.NodeKind.NULL);
  };

  skew.Node.createPair = function(first, second) {
    assert(skew.NodeKind.isExpression(first.kind));
    assert(skew.NodeKind.isExpression(second.kind));
    return new skew.Node(skew.NodeKind.PAIR).withChildren([first, second]);
  };

  skew.Node.createParameterize = function(type, parameters) {
    assert(skew.NodeKind.isExpression(type.kind));
    in_List.prepend1(parameters, type);
    return new skew.Node(skew.NodeKind.PARAMETERIZE).withChildren(parameters);
  };

  skew.Node.createSequence = function(nodes) {
    return new skew.Node(skew.NodeKind.SEQUENCE).withChildren(nodes);
  };

  skew.Node.createSuper = function() {
    return new skew.Node(skew.NodeKind.SUPER);
  };

  skew.Node.createType = function(type) {
    return new skew.Node(skew.NodeKind.TYPE).withType(type);
  };

  skew.Node.createUnary = function(kind, value) {
    assert(skew.NodeKind.isUnary(kind));
    assert(skew.NodeKind.isExpression(value.kind));
    return new skew.Node(kind).withChildren([value]);
  };

  skew.Node.createBinary = function(kind, left, right) {
    assert(skew.NodeKind.isBinary(kind));
    assert(skew.NodeKind.isExpression(left.kind));
    assert(skew.NodeKind.isExpression(right.kind));
    return new skew.Node(kind).withChildren([left, right]);
  };

  skew.Node.createLambdaType = function(argTypes, returnType) {
    in_List.append1(argTypes, returnType);
    return new skew.Node(skew.NodeKind.LAMBDA_TYPE).withChildren(argTypes);
  };

  skew.Node.prototype.asString = function() {
    var self = this;
    assert(self.kind === skew.NodeKind.NAME || self.kind === skew.NodeKind.DOT);
    return self.content.asString();
  };

  skew.Node.prototype.firstValue = function() {
    var self = this;
    assert(self.kind === skew.NodeKind.PAIR);
    assert(in_List.count(self.children) === 2);
    assert(skew.NodeKind.isExpression(self.children[0].kind));
    return self.children[0];
  };

  skew.Node.prototype.secondValue = function() {
    var self = this;
    assert(self.kind === skew.NodeKind.PAIR);
    assert(in_List.count(self.children) === 2);
    assert(skew.NodeKind.isExpression(self.children[1].kind));
    return self.children[1];
  };

  skew.Node.prototype.dotTarget = function() {
    var self = this;
    assert(self.kind === skew.NodeKind.DOT);
    assert(in_List.count(self.children) === 1);
    assert(self.children[0] === null || skew.NodeKind.isExpression(self.children[0].kind));
    return self.children[0];
  };

  skew.Node.prototype.annotationValue = function() {
    var self = this;
    assert(self.kind === skew.NodeKind.ANNOTATION);
    assert(in_List.count(self.children) === 2);
    assert(skew.NodeKind.isExpression(self.children[0].kind));
    return self.children[0];
  };

  skew.Node.prototype.annotationTest = function() {
    var self = this;
    assert(self.kind === skew.NodeKind.ANNOTATION);
    assert(in_List.count(self.children) === 2);
    assert(self.children[1] === null || skew.NodeKind.isExpression(self.children[1].kind));
    return self.children[1];
  };

  skew.Node.prototype.caseBlock = function() {
    var self = this;
    assert(self.kind === skew.NodeKind.CASE);
    assert(in_List.count(self.children) >= 1);
    assert(self.children[0].kind === skew.NodeKind.BLOCK);
    return self.children[0];
  };

  skew.Node.prototype.catchBlock = function() {
    var self = this;
    assert(self.kind === skew.NodeKind.CATCH);
    assert(in_List.count(self.children) === 1);
    assert(self.children[0].kind === skew.NodeKind.BLOCK);
    return self.children[0];
  };

  skew.Node.prototype.expressionValue = function() {
    var self = this;
    assert(self.kind === skew.NodeKind.EXPRESSION);
    assert(in_List.count(self.children) === 1);
    assert(skew.NodeKind.isExpression(self.children[0].kind));
    return self.children[0];
  };

  skew.Node.prototype.returnValue = function() {
    var self = this;
    assert(self.kind === skew.NodeKind.RETURN);
    assert(in_List.count(self.children) === 1);
    assert(self.children[0] === null || skew.NodeKind.isExpression(self.children[0].kind));
    return self.children[0];
  };

  skew.Node.prototype.switchValue = function() {
    var self = this;
    assert(self.kind === skew.NodeKind.SWITCH);
    assert(in_List.count(self.children) >= 1);
    assert(skew.NodeKind.isExpression(self.children[0].kind));
    return self.children[0];
  };

  skew.Node.prototype.parameterizeValue = function() {
    var self = this;
    assert(self.kind === skew.NodeKind.PARAMETERIZE);
    assert(in_List.count(self.children) >= 1);
    assert(skew.NodeKind.isExpression(self.children[0].kind));
    return self.children[0];
  };

  skew.Node.prototype.callValue = function() {
    var self = this;
    assert(self.kind === skew.NodeKind.CALL);
    assert(in_List.count(self.children) >= 1);
    assert(skew.NodeKind.isExpression(self.children[0].kind));
    return self.children[0];
  };

  skew.Node.prototype.indexValue = function() {
    var self = this;
    assert(self.kind === skew.NodeKind.INDEX);
    assert(in_List.count(self.children) >= 1);
    assert(skew.NodeKind.isExpression(self.children[0].kind));
    return self.children[0];
  };

  skew.Node.prototype.castValue = function() {
    var self = this;
    assert(self.kind === skew.NodeKind.CAST);
    assert(in_List.count(self.children) === 2);
    assert(skew.NodeKind.isExpression(self.children[0].kind));
    return self.children[0];
  };

  skew.Node.prototype.castType = function() {
    var self = this;
    assert(self.kind === skew.NodeKind.CAST);
    assert(in_List.count(self.children) === 2);
    assert(skew.NodeKind.isExpression(self.children[1].kind));
    return self.children[1];
  };

  skew.Node.prototype.unaryValue = function() {
    var self = this;
    assert(skew.NodeKind.isUnary(self.kind));
    assert(in_List.count(self.children) === 1);
    assert(skew.NodeKind.isExpression(self.children[0].kind));
    return self.children[0];
  };

  skew.Node.prototype.binaryLeft = function() {
    var self = this;
    assert(skew.NodeKind.isBinary(self.kind));
    assert(in_List.count(self.children) === 2);
    assert(skew.NodeKind.isExpression(self.children[0].kind));
    return self.children[0];
  };

  skew.Node.prototype.binaryRight = function() {
    var self = this;
    assert(skew.NodeKind.isBinary(self.kind));
    assert(in_List.count(self.children) === 2);
    assert(skew.NodeKind.isExpression(self.children[1].kind));
    return self.children[1];
  };

  skew.Node.prototype.interpolateLeft = function() {
    var self = this;
    assert(self.kind === skew.NodeKind.INTERPOLATE);
    assert(in_List.count(self.children) === 2);
    assert(skew.NodeKind.isExpression(self.children[0].kind));
    return self.children[0];
  };

  skew.Node.prototype.interpolateRight = function() {
    var self = this;
    assert(self.kind === skew.NodeKind.INTERPOLATE);
    assert(in_List.count(self.children) === 2);
    assert(skew.NodeKind.isExpression(self.children[1].kind));
    return self.children[1];
  };

  skew.Node.prototype.throwValue = function() {
    var self = this;
    assert(in_List.count(self.children) === 1);
    assert(skew.NodeKind.isExpression(self.children[0].kind));
    return self.children[0];
  };

  skew.Node.prototype.tryBlock = function() {
    var self = this;
    assert(self.kind === skew.NodeKind.TRY);
    assert(in_List.count(self.children) >= 2);
    assert(self.children[0].kind === skew.NodeKind.BLOCK);
    return self.children[0];
  };

  skew.Node.prototype.finallyBlock = function() {
    var self = this;
    assert(self.kind === skew.NodeKind.TRY);
    assert(in_List.count(self.children) >= 2);
    assert(in_List.last(self.children) === null || in_List.last(self.children).kind === skew.NodeKind.BLOCK);
    return in_List.last(self.children);
  };

  skew.Node.prototype.whileTest = function() {
    var self = this;
    assert(self.kind === skew.NodeKind.WHILE);
    assert(in_List.count(self.children) === 2);
    assert(skew.NodeKind.isExpression(self.children[0].kind));
    return self.children[0];
  };

  skew.Node.prototype.whileBlock = function() {
    var self = this;
    assert(self.kind === skew.NodeKind.WHILE);
    assert(in_List.count(self.children) === 2);
    assert(self.children[1].kind === skew.NodeKind.BLOCK);
    return self.children[1];
  };

  skew.Node.prototype.forTest = function() {
    var self = this;
    assert(self.kind === skew.NodeKind.FOR);
    assert(in_List.count(self.children) >= 3);
    assert(self.children[0] === null || skew.NodeKind.isExpression(self.children[0].kind));
    return self.children[0];
  };

  skew.Node.prototype.forUpdate = function() {
    var self = this;
    assert(self.kind === skew.NodeKind.FOR);
    assert(in_List.count(self.children) >= 3);
    assert(self.children[1] === null || skew.NodeKind.isExpression(self.children[1].kind));
    return self.children[1];
  };

  skew.Node.prototype.forBlock = function() {
    var self = this;
    assert(self.kind === skew.NodeKind.FOR);
    assert(in_List.count(self.children) >= 3);
    assert(self.children[2].kind === skew.NodeKind.BLOCK);
    return self.children[2];
  };

  skew.Node.prototype.foreachValue = function() {
    var self = this;
    assert(self.kind === skew.NodeKind.FOREACH);
    assert(in_List.count(self.children) === 2);
    assert(skew.NodeKind.isExpression(self.children[0].kind));
    return self.children[0];
  };

  skew.Node.prototype.foreachBlock = function() {
    var self = this;
    assert(self.kind === skew.NodeKind.FOREACH);
    assert(in_List.count(self.children) === 2);
    assert(self.children[1].kind === skew.NodeKind.BLOCK);
    return self.children[1];
  };

  skew.Node.prototype.ifTest = function() {
    var self = this;
    assert(self.kind === skew.NodeKind.IF);
    assert(in_List.count(self.children) === 3);
    assert(skew.NodeKind.isExpression(self.children[0].kind));
    return self.children[0];
  };

  skew.Node.prototype.ifTrue = function() {
    var self = this;
    assert(self.kind === skew.NodeKind.IF);
    assert(in_List.count(self.children) === 3);
    assert(self.children[1].kind === skew.NodeKind.BLOCK);
    return self.children[1];
  };

  skew.Node.prototype.ifFalse = function() {
    var self = this;
    assert(self.kind === skew.NodeKind.IF);
    assert(in_List.count(self.children) === 3);
    assert(self.children[2] === null || self.children[2].kind === skew.NodeKind.BLOCK);
    return self.children[2];
  };

  skew.Node.prototype.hookTest = function() {
    var self = this;
    assert(self.kind === skew.NodeKind.HOOK);
    assert(in_List.count(self.children) === 3);
    assert(skew.NodeKind.isExpression(self.children[0].kind));
    return self.children[0];
  };

  skew.Node.prototype.hookTrue = function() {
    var self = this;
    assert(self.kind === skew.NodeKind.HOOK);
    assert(in_List.count(self.children) === 3);
    assert(skew.NodeKind.isExpression(self.children[1].kind));
    return self.children[1];
  };

  skew.Node.prototype.hookFalse = function() {
    var self = this;
    assert(self.kind === skew.NodeKind.HOOK);
    assert(in_List.count(self.children) === 3);
    assert(skew.NodeKind.isExpression(self.children[2].kind));
    return self.children[2];
  };

  skew.OperatorInfo = function(text, precedence, associativity, kind, count) {
    var self = this;
    self.text = text;
    self.precedence = precedence;
    self.associativity = associativity;
    self.kind = kind;
    self.count = count;
  };

  skew.ArgumentCount = {
    ONE: 0, 0: "ONE",
    ONE_OR_MORE: 1, 1: "ONE_OR_MORE",
    ONE_OR_TWO: 2, 2: "ONE_OR_TWO",
    TWO_OR_FEWER: 3, 3: "TWO_OR_FEWER",
    TWO_OR_MORE: 4, 4: "TWO_OR_MORE",
    ZERO: 5, 5: "ZERO",
    ZERO_OR_MORE: 6, 6: "ZERO_OR_MORE",
    ZERO_OR_ONE: 7, 7: "ZERO_OR_ONE"
  };

  skew.OperatorKind = {
    FIXED: 0, 0: "FIXED",
    OVERRIDABLE: 1, 1: "OVERRIDABLE"
  };

  skew.SymbolKind = {
    NONE: 0, 0: "NONE",
    PARAMETER_FUNCTION: 1, 1: "PARAMETER_FUNCTION",
    PARAMETER_OBJECT: 2, 2: "PARAMETER_OBJECT",
    OBJECT_CLASS: 3, 3: "OBJECT_CLASS",
    OBJECT_ENUM: 4, 4: "OBJECT_ENUM",
    OBJECT_GLOBAL: 5, 5: "OBJECT_GLOBAL",
    OBJECT_INTERFACE: 6, 6: "OBJECT_INTERFACE",
    OBJECT_NAMESPACE: 7, 7: "OBJECT_NAMESPACE",
    FUNCTION_ANNOTATION: 8, 8: "FUNCTION_ANNOTATION",
    FUNCTION_CONSTRUCTOR: 9, 9: "FUNCTION_CONSTRUCTOR",
    FUNCTION_GLOBAL: 10, 10: "FUNCTION_GLOBAL",
    FUNCTION_INSTANCE: 11, 11: "FUNCTION_INSTANCE",
    FUNCTION_LOCAL: 12, 12: "FUNCTION_LOCAL",
    OVERLOADED_ANNOTATION: 13, 13: "OVERLOADED_ANNOTATION",
    OVERLOADED_GLOBAL: 14, 14: "OVERLOADED_GLOBAL",
    OVERLOADED_INSTANCE: 15, 15: "OVERLOADED_INSTANCE",
    VARIABLE_ENUM: 16, 16: "VARIABLE_ENUM",
    VARIABLE_GLOBAL: 17, 17: "VARIABLE_GLOBAL",
    VARIABLE_INSTANCE: 18, 18: "VARIABLE_INSTANCE",
    VARIABLE_LOCAL: 19, 19: "VARIABLE_LOCAL"
  };

  skew.SymbolKind.isType = function(self) {
    return ((self) | 0) >= ((skew.SymbolKind.PARAMETER_FUNCTION) | 0) && ((self) | 0) <= ((skew.SymbolKind.OBJECT_NAMESPACE) | 0);
  };

  skew.SymbolKind.isParameter = function(self) {
    return ((self) | 0) >= ((skew.SymbolKind.PARAMETER_FUNCTION) | 0) && ((self) | 0) <= ((skew.SymbolKind.PARAMETER_OBJECT) | 0);
  };

  skew.SymbolKind.isObject = function(self) {
    return ((self) | 0) >= ((skew.SymbolKind.OBJECT_CLASS) | 0) && ((self) | 0) <= ((skew.SymbolKind.OBJECT_NAMESPACE) | 0);
  };

  skew.SymbolKind.isFunction = function(self) {
    return ((self) | 0) >= ((skew.SymbolKind.FUNCTION_ANNOTATION) | 0) && ((self) | 0) <= ((skew.SymbolKind.FUNCTION_LOCAL) | 0);
  };

  skew.SymbolKind.isOverloadedFunction = function(self) {
    return ((self) | 0) >= ((skew.SymbolKind.OVERLOADED_ANNOTATION) | 0) && ((self) | 0) <= ((skew.SymbolKind.OVERLOADED_INSTANCE) | 0);
  };

  skew.SymbolKind.isFunctionOrOverloadedFunction = function(self) {
    return ((self) | 0) >= ((skew.SymbolKind.FUNCTION_ANNOTATION) | 0) && ((self) | 0) <= ((skew.SymbolKind.OVERLOADED_INSTANCE) | 0);
  };

  skew.SymbolKind.isVariable = function(self) {
    return ((self) | 0) >= ((skew.SymbolKind.VARIABLE_ENUM) | 0) && ((self) | 0) <= ((skew.SymbolKind.VARIABLE_LOCAL) | 0);
  };

  skew.SymbolKind.isOverloadableFunction = function(self) {
    return ((self) | 0) >= ((skew.SymbolKind.FUNCTION_CONSTRUCTOR) | 0) && ((self) | 0) <= ((skew.SymbolKind.FUNCTION_INSTANCE) | 0);
  };

  skew.SymbolKind.isGlobalReference = function(self) {
    return self === skew.SymbolKind.VARIABLE_ENUM || self === skew.SymbolKind.VARIABLE_GLOBAL || self === skew.SymbolKind.FUNCTION_GLOBAL || self === skew.SymbolKind.FUNCTION_CONSTRUCTOR || self === skew.SymbolKind.OVERLOADED_GLOBAL || skew.SymbolKind.isType(self);
  };

  skew.SymbolKind.hasInstances = function(self) {
    return self === skew.SymbolKind.OBJECT_CLASS || self === skew.SymbolKind.OBJECT_ENUM || self === skew.SymbolKind.OBJECT_INTERFACE;
  };

  skew.SymbolKind.isOnInstances = function(self) {
    return self === skew.SymbolKind.FUNCTION_INSTANCE || self === skew.SymbolKind.VARIABLE_INSTANCE || self === skew.SymbolKind.OVERLOADED_INSTANCE;
  };

  skew.SymbolState = {
    UNINITIALIZED: 0, 0: "UNINITIALIZED",
    INITIALIZING: 1, 1: "INITIALIZING",
    INITIALIZED: 2, 2: "INITIALIZED"
  };

  skew.Symbol = function(kind, name) {
    var self = this;
    self.id = skew.Symbol.createID();
    self.kind = kind;
    self.name = name;
    self.range = null;
    self.parent = null;
    self.resolvedType = null;
    self.scope = null;
    self.state = skew.SymbolState.UNINITIALIZED;
    self.annotations = null;
    self.comments = null;
    self.flags = 0;
  };

  // Flags
  skew.Symbol.prototype.isAutomaticallyGenerated = function() {
    var self = this;
    return (self.flags & skew.Symbol.IS_AUTOMATICALLY_GENERATED) !== 0;
  };

  skew.Symbol.prototype.isConst = function() {
    var self = this;
    return (self.flags & skew.Symbol.IS_CONST) !== 0;
  };

  skew.Symbol.prototype.isGetter = function() {
    var self = this;
    return (self.flags & skew.Symbol.IS_GETTER) !== 0;
  };

  skew.Symbol.prototype.shouldInferReturnType = function() {
    var self = this;
    return (self.flags & skew.Symbol.SHOULD_INFER_RETURN_TYPE) !== 0;
  };

  skew.Symbol.prototype.isOver = function() {
    var self = this;
    return (self.flags & skew.Symbol.IS_OVER) !== 0;
  };

  skew.Symbol.prototype.isSetter = function() {
    var self = this;
    return (self.flags & skew.Symbol.IS_SETTER) !== 0;
  };

  skew.Symbol.prototype.isValueType = function() {
    var self = this;
    return (self.flags & skew.Symbol.IS_VALUE_TYPE) !== 0;
  };

  // Modifiers
  skew.Symbol.prototype.isExported = function() {
    var self = this;
    return (self.flags & skew.Symbol.IS_EXPORTED) !== 0;
  };

  skew.Symbol.prototype.isImported = function() {
    var self = this;
    return (self.flags & skew.Symbol.IS_IMPORTED) !== 0;
  };

  skew.Symbol.prototype.isPreferred = function() {
    var self = this;
    return (self.flags & skew.Symbol.IS_PREFERRED) !== 0;
  };

  skew.Symbol.prototype.isPrivate = function() {
    var self = this;
    return (self.flags & skew.Symbol.IS_PRIVATE) !== 0;
  };

  skew.Symbol.prototype.isProtected = function() {
    var self = this;
    return (self.flags & skew.Symbol.IS_PROTECTED) !== 0;
  };

  skew.Symbol.prototype.isRenamed = function() {
    var self = this;
    return (self.flags & skew.Symbol.IS_RENAMED) !== 0;
  };

  skew.Symbol.prototype.isSkipped = function() {
    var self = this;
    return (self.flags & skew.Symbol.IS_SKIPPED) !== 0;
  };

  skew.Symbol.prototype.isEntryPoint = function() {
    var self = this;
    return (self.flags & skew.Symbol.IS_ENTRY_POINT) !== 0;
  };

  skew.Symbol.prototype.isDeprecated = function() {
    var self = this;
    return (self.flags & skew.Symbol.IS_DEPRECATED) !== 0;
  };

  // Combinations
  skew.Symbol.prototype.isPrivateOrProtected = function() {
    var self = this;
    return (self.flags & (skew.Symbol.IS_PRIVATE | skew.Symbol.IS_PROTECTED)) !== 0;
  };

  skew.Symbol.prototype.isImportedOrExported = function() {
    var self = this;
    return (self.flags & (skew.Symbol.IS_IMPORTED | skew.Symbol.IS_EXPORTED)) !== 0;
  };

  skew.Symbol.prototype.asParameterSymbol = function() {
    var self = this;
    assert(skew.SymbolKind.isParameter(self.kind));
    return self;
  };

  skew.Symbol.prototype.asObjectSymbol = function() {
    var self = this;
    assert(skew.SymbolKind.isObject(self.kind));
    return self;
  };

  skew.Symbol.prototype.asFunctionSymbol = function() {
    var self = this;
    assert(skew.SymbolKind.isFunction(self.kind));
    return self;
  };

  skew.Symbol.prototype.asOverloadedFunctionSymbol = function() {
    var self = this;
    assert(skew.SymbolKind.isOverloadedFunction(self.kind));
    return self;
  };

  skew.Symbol.prototype.asVariableSymbol = function() {
    var self = this;
    assert(skew.SymbolKind.isVariable(self.kind));
    return self;
  };

  skew.Symbol.prototype.fullName = function() {
    var self = this;
    if (self.parent !== null && self.parent.kind !== skew.SymbolKind.OBJECT_GLOBAL && !skew.SymbolKind.isParameter(self.kind)) {
      return self.parent.fullName() + "." + self.name;
    }

    return self.name;
  };

  skew.Symbol.prototype.mergeAnnotationsAndCommentsFrom = function(symbol) {
    var self = this;
    if (self.annotations === null) {
      self.annotations = symbol.annotations;
    }

    else if (symbol.annotations !== null) {
      in_List.append2(self.annotations, symbol.annotations);
    }

    if (self.comments === null) {
      self.comments = symbol.comments;
    }

    else if (symbol.comments !== null) {
      in_List.append2(self.comments, symbol.comments);
    }
  };

  skew.Symbol.createID = function() {
    ++skew.Symbol.nextID;
    return skew.Symbol.nextID;
  };

  skew.ParameterSymbol = function(kind, name) {
    var self = this;
    skew.Symbol.call(self, kind, name);
  };

  $extends(skew.ParameterSymbol, skew.Symbol);

  skew.ObjectSymbol = function(kind, name) {
    var self = this;
    skew.Symbol.call(self, kind, name);
    self.base = null;
    self.baseClass = null;
    self.members = in_StringMap.$new();
    self.objects = [];
    self.functions = [];
    self.variables = [];
    self.parameters = null;
  };

  $extends(skew.ObjectSymbol, skew.Symbol);

  skew.ObjectSymbol.prototype.hasBaseClass = function(symbol) {
    var self = this;
    return self.baseClass !== null && (self.baseClass === symbol || self.baseClass.hasBaseClass(symbol));
  };

  skew.FunctionSymbol = function(kind, name) {
    var self = this;
    skew.Symbol.call(self, kind, name);
    self.overridden = null;
    self.overloaded = null;
    self.parameters = null;
    self.$arguments = [];
    self.self = null;
    self.argumentOnlyType = null;
    self.returnType = null;
    self.block = null;
  };

  $extends(skew.FunctionSymbol, skew.Symbol);

  skew.VariableSymbol = function(kind, name) {
    var self = this;
    skew.Symbol.call(self, kind, name);
    self.type = null;
    self.value = null;
    self.enumValue = 0;
  };

  $extends(skew.VariableSymbol, skew.Symbol);

  skew.OverloadedFunctionSymbol = function(kind, name, symbols) {
    var self = this;
    skew.Symbol.call(self, kind, name);
    self.overridden = null;
    self.symbols = symbols;
  };

  $extends(skew.OverloadedFunctionSymbol, skew.Symbol);

  skew.TokenKind = {
    ANNOTATION: 0, 0: "ANNOTATION",
    ARROW: 1, 1: "ARROW",
    AS: 2, 2: "AS",
    ASSIGN: 3, 3: "ASSIGN",
    ASSIGN_BITWISE_AND: 4, 4: "ASSIGN_BITWISE_AND",
    ASSIGN_BITWISE_OR: 5, 5: "ASSIGN_BITWISE_OR",
    ASSIGN_BITWISE_XOR: 6, 6: "ASSIGN_BITWISE_XOR",
    ASSIGN_DIVIDE: 7, 7: "ASSIGN_DIVIDE",
    ASSIGN_INDEX: 8, 8: "ASSIGN_INDEX",
    ASSIGN_MINUS: 9, 9: "ASSIGN_MINUS",
    ASSIGN_MULTIPLY: 10, 10: "ASSIGN_MULTIPLY",
    ASSIGN_PLUS: 11, 11: "ASSIGN_PLUS",
    ASSIGN_POWER: 12, 12: "ASSIGN_POWER",
    ASSIGN_REMAINDER: 13, 13: "ASSIGN_REMAINDER",
    ASSIGN_SHIFT_LEFT: 14, 14: "ASSIGN_SHIFT_LEFT",
    ASSIGN_SHIFT_RIGHT: 15, 15: "ASSIGN_SHIFT_RIGHT",
    BITWISE_AND: 16, 16: "BITWISE_AND",
    BITWISE_OR: 17, 17: "BITWISE_OR",
    BITWISE_XOR: 18, 18: "BITWISE_XOR",
    BREAK: 19, 19: "BREAK",
    CASE: 20, 20: "CASE",
    CATCH: 21, 21: "CATCH",
    CHARACTER: 22, 22: "CHARACTER",
    CLASS: 23, 23: "CLASS",
    COLON: 24, 24: "COLON",
    COMMA: 25, 25: "COMMA",
    COMMENT: 26, 26: "COMMENT",
    COMPARE: 27, 27: "COMPARE",
    CONST: 28, 28: "CONST",
    CONTINUE: 29, 29: "CONTINUE",
    DECREMENT: 30, 30: "DECREMENT",
    DEF: 31, 31: "DEF",
    DEFAULT: 32, 32: "DEFAULT",
    DIVIDE: 33, 33: "DIVIDE",
    DOT: 34, 34: "DOT",
    DOT_DOT: 35, 35: "DOT_DOT",
    DOUBLE: 36, 36: "DOUBLE",
    DYNAMIC: 37, 37: "DYNAMIC",
    ELSE: 38, 38: "ELSE",
    END_OF_FILE: 39, 39: "END_OF_FILE",
    ENUM: 40, 40: "ENUM",
    EQUAL: 41, 41: "EQUAL",
    ERROR: 42, 42: "ERROR",
    FALSE: 43, 43: "FALSE",
    FINALLY: 44, 44: "FINALLY",
    FOR: 45, 45: "FOR",
    GREATER_THAN: 46, 46: "GREATER_THAN",
    GREATER_THAN_OR_EQUAL: 47, 47: "GREATER_THAN_OR_EQUAL",
    IDENTIFIER: 48, 48: "IDENTIFIER",
    IF: 49, 49: "IF",
    IN: 50, 50: "IN",
    INCREMENT: 51, 51: "INCREMENT",
    INDEX: 52, 52: "INDEX",
    INT: 53, 53: "INT",
    INTERFACE: 54, 54: "INTERFACE",
    INT_BINARY: 55, 55: "INT_BINARY",
    INT_HEX: 56, 56: "INT_HEX",
    INT_OCTAL: 57, 57: "INT_OCTAL",
    IS: 58, 58: "IS",
    LEFT_BRACE: 59, 59: "LEFT_BRACE",
    LEFT_BRACKET: 60, 60: "LEFT_BRACKET",
    LEFT_PARENTHESIS: 61, 61: "LEFT_PARENTHESIS",
    LESS_THAN: 62, 62: "LESS_THAN",
    LESS_THAN_OR_EQUAL: 63, 63: "LESS_THAN_OR_EQUAL",
    LIST: 64, 64: "LIST",
    LIST_NEW: 65, 65: "LIST_NEW",
    LOGICAL_AND: 66, 66: "LOGICAL_AND",
    LOGICAL_OR: 67, 67: "LOGICAL_OR",
    MINUS: 68, 68: "MINUS",
    MULTIPLY: 69, 69: "MULTIPLY",
    NAMESPACE: 70, 70: "NAMESPACE",
    NEWLINE: 71, 71: "NEWLINE",
    NOT: 72, 72: "NOT",
    NOT_EQUAL: 73, 73: "NOT_EQUAL",
    NULL: 74, 74: "NULL",
    OVER: 75, 75: "OVER",
    PLUS: 76, 76: "PLUS",
    POWER: 77, 77: "POWER",
    QUESTION_MARK: 78, 78: "QUESTION_MARK",
    REMAINDER: 79, 79: "REMAINDER",
    RETURN: 80, 80: "RETURN",
    RIGHT_BRACE: 81, 81: "RIGHT_BRACE",
    RIGHT_BRACKET: 82, 82: "RIGHT_BRACKET",
    RIGHT_PARENTHESIS: 83, 83: "RIGHT_PARENTHESIS",
    SET: 84, 84: "SET",
    SET_NEW: 85, 85: "SET_NEW",
    SHIFT_LEFT: 86, 86: "SHIFT_LEFT",
    SHIFT_RIGHT: 87, 87: "SHIFT_RIGHT",
    STRING: 88, 88: "STRING",
    SUPER: 89, 89: "SUPER",
    SWITCH: 90, 90: "SWITCH",
    THROW: 91, 91: "THROW",
    TILDE: 92, 92: "TILDE",
    TRUE: 93, 93: "TRUE",
    TRY: 94, 94: "TRY",
    VAR: 95, 95: "VAR",
    WHILE: 96, 96: "WHILE",
    WHITESPACE: 97, 97: "WHITESPACE",
    YY_INVALID_ACTION: 98, 98: "YY_INVALID_ACTION",

    // Token kinds not used by flex
    START_PARAMETER_LIST: 99, 99: "START_PARAMETER_LIST",
    END_PARAMETER_LIST: 100, 100: "END_PARAMETER_LIST"
  };

  skew.DiagnosticKind = {
    ERROR: 0, 0: "ERROR",
    WARNING: 1, 1: "WARNING"
  };

  skew.Diagnostic = function(kind, range, text) {
    var self = this;
    self.kind = kind;
    self.range = range;
    self.text = text;
    self.noteRange = null;
    self.noteText = "";
  };

  skew.Diagnostic.format = function(kind, range, text) {
    if (range === null) {
      return kind + ": " + text + "\n";
    }

    var formatted = range.format(0);
    return range.locationString() + ": " + kind + ": " + text + "\n" + formatted.line + "\n" + formatted.range + "\n";
  };

  skew.Log = function() {
    var self = this;
    self.diagnostics = [];
    self.warningCount = 0;
    self.errorCount = 0;
  };

  skew.Log.prototype.toString = function() {
    var self = this;
    var builder = in_StringBuilder.$new();

    // Emit the log assuming an infinite terminal width
    for (var i = 0, list = self.diagnostics, count = in_List.count(list); i < count; ++i) {
      var diagnostic = list[i];
      in_StringBuilder.append(builder, skew.Diagnostic.format(diagnostic.kind === skew.DiagnosticKind.ERROR ? "error" : "warning", diagnostic.range, diagnostic.text));

      // Append notes after the diagnostic they apply to
      if (diagnostic.noteRange !== null) {
        in_StringBuilder.append(builder, skew.Diagnostic.format("note", diagnostic.noteRange, diagnostic.noteText));
      }
    }

    return in_StringBuilder.toString(builder);
  };

  skew.Log.prototype.isEmpty = function() {
    var self = this;
    return in_List.isEmpty(self.diagnostics);
  };

  skew.Log.prototype.hasErrors = function() {
    var self = this;
    return self.errorCount !== 0;
  };

  skew.Log.prototype.hasWarnings = function() {
    var self = this;
    return self.warningCount !== 0;
  };

  skew.Log.prototype.error = function(range, text) {
    var self = this;
    in_List.append1(self.diagnostics, new skew.Diagnostic(skew.DiagnosticKind.ERROR, range, text));
    ++self.errorCount;
  };

  skew.Log.prototype.warning = function(range, text) {
    var self = this;
    in_List.append1(self.diagnostics, new skew.Diagnostic(skew.DiagnosticKind.WARNING, range, text));
    ++self.warningCount;
  };

  skew.Log.prototype.note = function(range, text) {
    var self = this;
    var last = in_List.last(self.diagnostics);
    last.noteRange = range;
    last.noteText = text;
  };

  skew.Log.prototype.syntaxErrorInvalidEscapeSequence = function(range) {
    var self = this;
    self.error(range, "Invalid escape sequence");
  };

  skew.Log.prototype.syntaxErrorInvalidCharacter = function(range) {
    var self = this;
    self.error(range, "Invalid character literal");
  };

  skew.Log.prototype.syntaxErrorExtraData = function(range, text) {
    var self = this;
    self.error(range, "Syntax error \"" + text + "\"");
  };

  skew.Log.prototype.syntaxErrorUnexpectedToken = function(token) {
    var self = this;
    self.error(token.range, "Unexpected " + skew.TokenKind[token.kind]);
  };

  skew.Log.prototype.syntaxErrorExpectedToken = function(range, found, expected) {
    var self = this;
    self.error(range, "Expected " + skew.TokenKind[expected] + " but found " + skew.TokenKind[found]);
  };

  skew.Log.prototype.syntaxErrorEmptyFunctionParentheses = function(range) {
    var self = this;
    self.error(range, "Functions without arguments do not use parentheses");
  };

  skew.Log.prototype.semanticErrorComparisonOperatorNotNumeric = function(range) {
    var self = this;
    self.error(range, "The comparison operator must have a numeric return type");
  };

  skew.Log.prototype.syntaxErrorBadDeclarationInsideEnum = function(range) {
    var self = this;
    self.error(range, "Cannot use this declaration inside an enum");
  };

  skew.Log.expectedCountText = function(singular, expected, found) {
    return "Expected " + expected.toString() + " " + singular + (prettyPrint.plural(expected) + " but found " + found.toString() + " " + singular) + prettyPrint.plural(found);
  };

  skew.Log.formatArgumentTypes = function(types) {
    if (types === null) {
      return "";
    }

    var names = [];

    for (var i = 0, list = types, count = in_List.count(list); i < count; ++i) {
      var type = list[i];
      in_List.append1(names, type.toString());
    }

    return " of type" + prettyPrint.plural(in_List.count(types)) + " " + prettyPrint.join(names, "and");
  };

  skew.Log.prototype.semanticWarningExtraParentheses = function(range) {
    var self = this;
    self.warning(range, "Unnecessary parentheses");
  };

  skew.Log.prototype.semanticWarningUnusedExpression = function(range) {
    var self = this;
    self.warning(range, "Unused expression");
  };

  skew.Log.prototype.semanticErrorDuplicateSymbol = function(range, name, previous) {
    var self = this;
    self.error(range, "\"" + name + "\" is already declared");

    if (previous !== null) {
      self.note(previous, "The previous declaration is here");
    }
  };

  skew.Log.prototype.semanticErrorShadowedSymbol = function(range, name, previous) {
    var self = this;
    self.error(range, "\"" + name + "\" shadows a previous declaration");

    if (previous !== null) {
      self.note(previous, "The previous declaration is here");
    }
  };

  skew.Log.prototype.semanticErrorDuplicateTypeParameters = function(range, name, previous) {
    var self = this;
    self.error(range, "\"" + name + "\" already has type parameters");

    if (previous !== null) {
      self.note(previous, "Type parameters were previously declared here");
    }
  };

  skew.Log.prototype.semanticErrorDuplicateBaseType = function(range, name, previous) {
    var self = this;
    self.error(range, "\"" + name + "\" already has a base type");

    if (previous !== null) {
      self.note(previous, "The previous base type is here");
    }
  };

  skew.Log.prototype.semanticErrorCyclicDeclaration = function(range, name) {
    var self = this;
    self.error(range, "Cyclic declaration of \"" + name + "\"");
  };

  skew.Log.prototype.semanticErrorUndeclaredSymbol = function(range, name) {
    var self = this;
    self.error(range, "\"" + name + "\" is not declared");
  };

  skew.Log.prototype.semanticErrorUnknownMemberSymbol = function(range, name, type) {
    var self = this;
    self.error(range, "\"" + name + "\" is not declared on type \"" + type.toString() + "\"");
  };

  skew.Log.prototype.semanticErrorVarMissingType = function(range, name) {
    var self = this;
    self.error(range, "Unable to determine the type of \"" + name + "\"");
  };

  skew.Log.prototype.semanticErrorVarMissingValue = function(range, name) {
    var self = this;
    self.error(range, "The implicitly typed variable \"" + name + "\" must be initialized");
  };

  skew.Log.prototype.semanticErrorConstMissingValue = function(range, name) {
    var self = this;
    self.error(range, "The constant \"" + name + "\" must be initialized");
  };

  skew.Log.prototype.semanticErrorInvalidCall = function(range, type) {
    var self = this;
    self.error(range, "Cannot call value of type \"" + type.toString() + "\"");
  };

  skew.Log.prototype.semanticErrorCannotParameterize = function(range, type) {
    var self = this;
    self.error(range, "Cannot parameterize \"" + type.toString() + (type.isParameterized() ? "\" because it is already parameterized" : "\" because it has no type parameters"));
  };

  skew.Log.prototype.semanticErrorParameterCount = function(range, expected, found) {
    var self = this;
    self.error(range, skew.Log.expectedCountText("type parameter", expected, found));
  };

  skew.Log.prototype.semanticErrorArgumentCount = function(range, expected, found, name, $function) {
    var self = this;
    self.error(range, skew.Log.expectedCountText("argument", expected, found) + (name !== "" ? " when calling \"" + name + "\"" : ""));

    if ($function !== null) {
      self.note($function, "The function declaration is here");
    }
  };

  skew.Log.prototype.semanticErrorGetterCalledTwice = function(range, name, $function) {
    var self = this;
    self.error(range, "The function \"" + name + "\" takes no arguments and is already called implicitly");

    if ($function !== null) {
      self.note($function, "The function declaration is here");
    }
  };

  skew.Log.prototype.semanticErrorUseOfVoidFunction = function(range, name, $function) {
    var self = this;
    self.error(range, "The function \"" + name + "\" does not return a value");

    if ($function !== null) {
      self.note($function, "The function declaration is here");
    }
  };

  skew.Log.prototype.semanticErrorUseOfVoidLambda = function(range) {
    var self = this;
    self.error(range, "This call does not return a value");
  };

  skew.Log.prototype.semanticErrorBadVariableType = function(range, type) {
    var self = this;
    self.error(range, "Implicitly typed variables cannot be of type \"" + type.toString() + "\"");
  };

  skew.Log.prototype.semanticErrorMemberUnexpectedGlobal = function(range, name) {
    var self = this;
    self.error(range, "Cannot access global member \"" + name + "\" from an instance context");
  };

  skew.Log.prototype.semanticErrorMemberUnexpectedInstance = function(range, name) {
    var self = this;
    self.error(range, "Cannot access instance member \"" + name + "\" from a global context");
  };

  skew.Log.prototype.semanticErrorMemberUnexpectedTypeParameter = function(range, name) {
    var self = this;
    self.error(range, "Cannot access type parameter \"" + name + "\" here");
  };

  skew.Log.prototype.semanticErrorConstructorReturnType = function(range) {
    var self = this;
    self.error(range, "Constructors cannot have a return type");
  };

  skew.Log.prototype.semanticErrorNoMatchingOverload = function(range, name, count, types) {
    var self = this;
    self.error(range, "No overload of \"" + name + "\" was found that takes " + count.toString() + " argument" + prettyPrint.plural(count) + skew.Log.formatArgumentTypes(types));
  };

  skew.Log.prototype.semanticErrorAmbiguousOverload = function(range, name, count, types) {
    var self = this;
    self.error(range, "Multiple matching overloads of \"" + name + "\" were found that can take " + count.toString() + " argument" + prettyPrint.plural(count) + skew.Log.formatArgumentTypes(types));
  };

  skew.Log.prototype.semanticErrorUnexpectedExpression = function(range, type) {
    var self = this;
    self.error(range, "Unexpected expression of type \"" + type.toString() + "\"");
  };

  skew.Log.prototype.semanticErrorUnexpectedType = function(range, type) {
    var self = this;
    self.error(range, "Unexpected type \"" + type.toString() + "\"");
  };

  skew.Log.prototype.semanticErrorIncompatibleTypes = function(range, from, to, isCastAllowed) {
    var self = this;
    self.error(range, "Cannot convert from type \"" + from.toString() + "\" to type \"" + to.toString() + "\"" + (isCastAllowed ? " without a cast" : ""));
  };

  skew.Log.prototype.semanticWarningExtraCast = function(range, from, to) {
    var self = this;
    self.warning(range, "Unnecessary cast from type \"" + from.toString() + "\" to type \"" + to.toString() + "\"");
  };

  skew.Log.prototype.semanticErrorWrongArgumentCount = function(range, name, count) {
    var self = this;
    self.error(range, "Expected \"" + name + "\" to take " + count.toString() + " argument" + prettyPrint.plural(count));
  };

  skew.Log.prototype.semanticErrorWrongArgumentCountRange = function(range, name, lower, upper) {
    var self = this;
    if (lower === 0) {
      self.error(range, "Expected \"" + name + "\" to take at most " + upper.toString() + " argument" + prettyPrint.plural(upper));
    }

    else if (upper === -1) {
      self.error(range, "Expected \"" + name + "\" to take at least " + lower.toString() + " argument" + prettyPrint.plural(lower));
    }

    else {
      self.error(range, "Expected \"" + name + "\" to take between " + lower.toString() + " and " + upper.toString() + " arguments");
    }
  };

  skew.Log.prototype.semanticErrorExpectedList = function(range, name, type) {
    var self = this;
    self.error(range, "Expected argument \"" + name + "\" to be of type \"List<T>\" instead of type \"" + type.toString() + "\"");
  };

  skew.Log.prototype.semanticErrorUnexpectedReturnValue = function(range) {
    var self = this;
    self.error(range, "Cannot return a value inside a function without a return type");
  };

  skew.Log.prototype.semanticErrorBadReturnType = function(range, type) {
    var self = this;
    self.error(range, "Cannot create a function with a return type of \"" + type.toString() + "\"");
  };

  skew.Log.prototype.semanticErrorExpectedReturnValue = function(range, type) {
    var self = this;
    self.error(range, "Must return a value of type \"" + type.toString() + "\"");
  };

  skew.Log.prototype.semanticErrorMissingReturn = function(range, name, type) {
    var self = this;
    self.error(range, "All control paths for \"" + name + "\" must return a value of type \"" + type.toString() + "\"");
  };

  skew.Log.prototype.semanticErrorBadStorage = function(range) {
    var self = this;
    self.error(range, "Cannot store to this location");
  };

  skew.Log.prototype.semanticErrorStorageToConstSymbol = function(range, name) {
    var self = this;
    self.error(range, "Cannot store to constant symbol \"" + name + "\"");
  };

  skew.Log.prototype.semanticErrorAccessViolation = function(range, level, name) {
    var self = this;
    self.error(range, "Cannot access \"" + level + "\" symbol \"" + name + "\" here");
  };

  skew.Log.prototype.semanticWarningDeprecatedUsage = function(range, name) {
    var self = this;
    self.warning(range, "Use of deprecated symbol \"" + name + "\"");
  };

  skew.Log.prototype.semanticErrorUnparameterizedType = function(range, type) {
    var self = this;
    self.error(range, "Cannot use unparameterized type \"" + type.toString() + "\" here");
  };

  skew.Log.prototype.semanticErrorParameterizedType = function(range, type) {
    var self = this;
    self.error(range, "Cannot use parameterized type \"" + type.toString() + "\" here");
  };

  skew.Log.prototype.semanticErrorNoCommonType = function(range, left, right) {
    var self = this;
    self.error(range, "No common type for \"" + left.toString() + "\" and \"" + right.toString() + "\"");
  };

  skew.Log.prototype.semanticErrorInvalidAnnotation = function(range, annotation, name) {
    var self = this;
    self.error(range, "Cannot use the annotation \"" + annotation + "\" on \"" + name + "\"");
  };

  skew.Log.prototype.semanticErrorDuplicateAnnotation = function(range, annotation, name) {
    var self = this;
    self.error(range, "Duplicate annotation \"" + annotation + "\" on \"" + name + "\"");
  };

  skew.Log.prototype.semanticErrorBadForValue = function(range, type) {
    var self = this;
    self.error(range, "Cannot iterate over type \"" + type.toString() + "\"");
  };

  skew.Log.prototype.semanticWarningEmptyRange = function(range) {
    var self = this;
    self.warning(range, "This range is empty");
  };

  skew.Log.prototype.semanticErrorMissingDotContext = function(range, name) {
    var self = this;
    self.error(range, "Cannot access \"" + name + "\" without type context");
  };

  skew.Log.prototype.semanticErrorInitializerTypeInferenceFailed = function(range) {
    var self = this;
    self.error(range, "Cannot infer a type for this literal");
  };

  skew.Log.prototype.semanticErrorDuplicateOverload = function(range, name, previous) {
    var self = this;
    self.error(range, "Duplicate overloaded function \"" + name + "\"");

    if (previous !== null) {
      self.note(previous, "The previous declaration is here");
    }
  };

  skew.Log.prototype.semanticErrorInvalidBaseType = function(range, type) {
    var self = this;
    self.error(range, "Cannot derive from type \"" + type.toString() + "\"");
  };

  skew.Log.prototype.semanticErrorBadOverride = function(range, name, base, overridden) {
    var self = this;
    self.error(range, "\"" + name + "\" overrides another declaration with the same name in base type \"" + base.toString() + "\"");

    if (overridden !== null) {
      self.note(overridden, "The overridden declaration is here");
    }
  };

  skew.Log.prototype.semanticErrorBadOverrideReturnType = function(range, name, base, overridden) {
    var self = this;
    self.error(range, "\"" + name + "\" overrides another function with the same name and argument types but a different return type in base type \"" + base.toString() + "\"");

    if (overridden !== null) {
      self.note(overridden, "The overridden function is here");
    }
  };

  skew.Log.prototype.semanticErrorModifierMissingOverride = function(range, name, overridden) {
    var self = this;
    self.error(range, "\"" + name + "\" overrides another symbol with the same name but is declared using \"def\" instead of \"over\"");

    if (overridden !== null) {
      self.note(overridden, "The overridden declaration is here");
    }
  };

  skew.Log.prototype.semanticErrorModifierUnusedOverride = function(range, name) {
    var self = this;
    self.error(range, "\"" + name + "\" is declared using \"over\" instead of \"def\" but does not override anything");
  };

  skew.Log.prototype.semanticErrorBadSuper = function(range) {
    var self = this;
    self.error(range, "Cannot use \"super\" here");
  };

  skew.Log.prototype.semanticErrorBadJump = function(range, name) {
    var self = this;
    self.error(range, "Cannot use \"" + name + "\" outside a loop");
  };

  skew.Log.prototype.semanticErrorMustCallFunction = function(range, name) {
    var self = this;
    self.error(range, "The function \"" + name + "\" must be called");
  };

  skew.Log.prototype.semanticErrorDuplicateEntryPoint = function(range, previous) {
    var self = this;
    self.error(range, "Multiple entry points are declared");
    self.note(previous, "The first entry point is here");
  };

  skew.Log.prototype.semanticErrorInvalidEntryPointArguments = function(range, name) {
    var self = this;
    self.error(range, "Entry point \"" + name + "\" must take either no arguments or one argument of type \"List<string>\"");
  };

  skew.Log.prototype.semanticErrorInvalidEntryPointReturnType = function(range, name) {
    var self = this;
    self.error(range, "Entry point \"" + name + "\" must return either nothing or a value of type \"int\"");
  };

  skew.Log.prototype.commandLineErrorMissingOutput = function(range, first, second) {
    var self = this;
    self.error(range, "Specify the output location using either \"" + first + "\" or \"" + second + "\"");
  };

  skew.Log.prototype.commandLineErrorDuplicateOutput = function(range, first, second) {
    var self = this;
    self.error(range, "Cannot specify both \"" + first + "\" and \"" + second + "\"");
  };

  skew.Log.prototype.commandLineErrorUnreadableFile = function(range, name) {
    var self = this;
    self.error(range, "Could not read from \"" + name + "\"");
  };

  skew.Log.prototype.commandLineErrorUnwritableFile = function(range, name) {
    var self = this;
    self.error(range, "Could not write to \"" + name + "\"");
  };

  skew.Log.prototype.commandLineErrorNoInputFiles = function(range) {
    var self = this;
    self.error(range, "Missing input files");
  };

  skew.Log.prototype.commandLineWarningDuplicateFlagValue = function(range, name, previous) {
    var self = this;
    self.warning(range, "Multiple values are specified for \"" + name + "\", using the later value");

    if (previous !== null) {
      self.note(previous, "Ignoring the value from the previous use");
    }
  };

  skew.Log.prototype.commandLineErrorBadFlag = function(range, name) {
    var self = this;
    self.error(range, "Unknown command line flag \"" + name + "\"");
  };

  skew.Log.prototype.commandLineErrorMissingValue = function(range, text) {
    var self = this;
    self.error(range, "Use \"" + text + "\" to provide a value");
  };

  skew.Log.prototype.commandLineErrorExpectedToken = function(range, expected, found, text) {
    var self = this;
    self.error(range, "Expected \"" + expected + "\" but found \"" + found + "\" in \"" + text + "\"");
  };

  skew.Log.prototype.commandLineErrorNonBooleanValue = function(range, value, text) {
    var self = this;
    self.error(range, "Expected \"true\" or \"false\" but found \"" + value + "\" in \"" + text + "\"");
  };

  skew.Log.prototype.commandLineErrorNonIntegerValue = function(range, value, text) {
    var self = this;
    self.error(range, "Expected integer constant but found \"" + value + "\" in \"" + text + "\"");
  };

  skew.parsing = {};

  skew.parsing.parseIntLiteral = function(text, base) {
    var value = 0;

    switch (base) {
      case 2:
      case 8:
      case 10: {
        for (var i = base === 10 ? 0 : 2, count = in_string.count(text); i < count; i += 1) {
          value = value * base + in_string.get1(text, i) - 48;
        }
        break;
      }

      case 16: {
        for (var i = 2, count1 = in_string.count(text); i < count1; i += 1) {
          var c = in_string.get1(text, i);
          value = value * 16 + c - (c <= 57 ? 48 : c <= 70 ? 65 - 10 : 97 - 10);
        }
        break;
      }
    }

    return value;
  };

  skew.parsing.parseDoubleLiteral = function(text) {
    return +text;
  };

  skew.parsing.parseLeadingComments = function(context) {
    var comments = null;

    while (context.peek(skew.TokenKind.COMMENT)) {
      var range = context.next().range;

      if (comments === null) {
        comments = [];
      }

      in_List.append1(comments, range.source.contents.slice(range.start + 1, range.end));

      // Ignore blocks of comments with extra lines afterward
      if (context.eat(skew.TokenKind.NEWLINE)) {
        comments = null;
      }
    }

    return comments;
  };

  skew.parsing.parseTrailingComment = function(context, comments) {
    if (context.peek(skew.TokenKind.COMMENT)) {
      var range = context.next().range;

      if (comments === null) {
        comments = [];
      }

      var text = range.source.contents.slice(range.start + 1, range.end);

      if (in_string.get1(text, in_string.count(text) - 1) !== 10) {
        text += "\n";
      }

      in_List.append1(comments, text);
      return comments;
    }

    return null;
  };

  skew.parsing.parseAnnotations = function(context, annotations) {
    annotations = annotations !== null ? in_List.clone(annotations) : [];

    while (context.peek(skew.TokenKind.ANNOTATION)) {
      var range = context.next().range;
      var value = skew.Node.createName(range.toString()).withRange(range);

      // Change "@foo.bar.baz" into "foo.bar.@baz"
      if (context.peek(skew.TokenKind.DOT)) {
        var root = value.asString();
        value.content = new skew.StringContent(root.slice(1, in_string.count(root)));

        while (context.eat(skew.TokenKind.DOT)) {
          var name = context.current().range;

          if (!context.expect(skew.TokenKind.IDENTIFIER)) {
            return null;
          }

          value = skew.Node.createDot(value, name.toString()).withRange(context.spanSince(range)).withInternalRange(name);
        }

        value.content = new skew.StringContent("@" + value.asString());
      }

      // Parse parentheses if present
      var token = context.current();

      if (context.eat(skew.TokenKind.LEFT_PARENTHESIS)) {
        var $arguments = skew.parsing.parseCommaSeparatedList(context, skew.TokenKind.RIGHT_PARENTHESIS);

        if ($arguments === null) {
          return null;
        }

        value = skew.Node.createCall(value, $arguments).withRange(context.spanSince(range)).withInternalRange(context.spanSince(token.range));
      }

      // Parse a trailing if condition
      var test = null;

      if (context.eat(skew.TokenKind.IF)) {
        test = skew.parsing.pratt.parse(context, skew.Precedence.LOWEST);

        if (test === null) {
          return null;
        }
      }

      // All annotations must end in a newline to avoid confusion with the trailing if
      if (!context.peek(skew.TokenKind.LEFT_BRACE) && !context.expect(skew.TokenKind.NEWLINE)) {
        return null;
      }

      in_List.append1(annotations, skew.Node.createAnnotation(value, test).withRange(context.spanSince(range)));
    }

    return annotations;
  };

  skew.parsing.parseVarOrConst = function(context) {
    var token = context.next();
    var range = context.current().range;

    if (!context.expect(skew.TokenKind.IDENTIFIER)) {
      return null;
    }

    var symbol = new skew.VariableSymbol(skew.SymbolKind.VARIABLE_LOCAL, range.toString());
    symbol.range = range;

    if (token.kind === skew.TokenKind.CONST) {
      symbol.flags |= skew.Symbol.IS_CONST;
    }

    if (skew.parsing.peekType(context)) {
      symbol.type = skew.parsing.parseType(context);

      if (symbol.type === null) {
        return null;
      }
    }

    if (context.eat(skew.TokenKind.ASSIGN)) {
      symbol.value = skew.parsing.pratt.parse(context, skew.Precedence.LOWEST);

      if (symbol.value === null) {
        return null;
      }
    }

    return skew.Node.createVar(symbol).withRange(context.spanSince(token.range));
  };

  skew.parsing.parseJump = function(context) {
    var token = context.next();
    return (token.kind === skew.TokenKind.BREAK ? skew.Node.createBreak() : skew.Node.createContinue()).withRange(token.range);
  };

  skew.parsing.parseReturn = function(context) {
    var token = context.next();
    var value = null;

    if (!context.peek(skew.TokenKind.NEWLINE) && !context.peek(skew.TokenKind.COMMENT) && !context.peek(skew.TokenKind.RIGHT_BRACE)) {
      value = skew.parsing.pratt.parse(context, skew.Precedence.LOWEST);

      if (value === null) {
        return null;
      }
    }

    return skew.Node.createReturn(value).withRange(context.spanSince(token.range));
  };

  skew.parsing.parseSwitch = function(context) {
    var token = context.next();
    var value = skew.parsing.pratt.parse(context, skew.Precedence.LOWEST);

    if (value === null) {
      return null;
    }

    if (!context.expect(skew.TokenKind.LEFT_BRACE)) {
      return null;
    }

    var cases = [];
    context.eat(skew.TokenKind.NEWLINE);

    while (!context.peek(skew.TokenKind.RIGHT_BRACE)) {
      var comments = skew.parsing.parseLeadingComments(context);

      // Ignore trailing comments
      if (context.peek(skew.TokenKind.RIGHT_BRACE) || context.peek(skew.TokenKind.END_OF_FILE)) {
        break;
      }

      // Parse a new case
      var values = [];
      var start = context.current();

      if (context.eat(skew.TokenKind.CASE)) {
        while (true) {
          var constant = skew.parsing.pratt.parse(context, skew.Precedence.LOWEST);

          if (constant === null) {
            return null;
          }

          in_List.append1(values, constant);

          if (!context.eat(skew.TokenKind.COMMA)) {
            break;
          }
        }
      }

      // Default cases have no values
      else if (!context.eat(skew.TokenKind.DEFAULT)) {
        context.expect(skew.TokenKind.CASE);
        return null;
      }

      // Use a block instead of requiring "break" at the end
      var block = skew.parsing.parseBlock(context);

      if (block === null) {
        return null;
      }

      // Create the case
      var node = skew.Node.createCase(values, block).withRange(context.spanSince(start.range));
      node.comments = comments;
      in_List.append1(cases, node);

      // Parse trailing comments and/or newline
      comments = skew.parsing.parseTrailingComment(context, comments);

      if (comments !== null) {
        node.comments = comments;
        context.eat(skew.TokenKind.NEWLINE);
      }

      else if (context.peek(skew.TokenKind.RIGHT_BRACE) || !context.peek(skew.TokenKind.ELSE) && !context.expect(skew.TokenKind.NEWLINE)) {
        break;
      }
    }

    if (!context.expect(skew.TokenKind.RIGHT_BRACE)) {
      return null;
    }

    return skew.Node.createSwitch(value, cases).withRange(context.spanSince(token.range));
  };

  skew.parsing.parseFor = function(context) {
    var token = context.next();
    var range = context.current().range;

    if (!context.expect(skew.TokenKind.IDENTIFIER) || !context.expect(skew.TokenKind.IN)) {
      return null;
    }

    var symbol = new skew.VariableSymbol(skew.SymbolKind.VARIABLE_LOCAL, range.toString());
    symbol.range = range;
    var value = skew.parsing.pratt.parse(context, skew.Precedence.LOWEST);

    if (value === null) {
      return null;
    }

    if (context.eat(skew.TokenKind.DOT_DOT)) {
      var second = skew.parsing.pratt.parse(context, skew.Precedence.LOWEST);

      if (second === null) {
        return null;
      }

      value = skew.Node.createPair(value, second).withRange(skew.Range.span(value.range, second.range));
    }

    var block = skew.parsing.parseBlock(context);

    if (block === null) {
      return null;
    }

    return skew.Node.createForeach(symbol, value, block).withRange(context.spanSince(token.range));
  };

  skew.parsing.parseIf = function(context) {
    var token = context.next();
    var test = skew.parsing.pratt.parse(context, skew.Precedence.LOWEST);

    if (test === null) {
      return null;
    }

    var trueBlock = skew.parsing.parseBlock(context);

    if (trueBlock === null) {
      return null;
    }

    return skew.Node.createIf(test, trueBlock, null).withRange(context.spanSince(token.range));
  };

  skew.parsing.parseThrow = function(context) {
    var token = context.next();
    var value = skew.parsing.pratt.parse(context, skew.Precedence.LOWEST);

    if (value === null) {
      return null;
    }

    return skew.Node.createThrow(value);
  };

  skew.parsing.parseTry = function(context) {
    var token = context.next();
    var tryBlock = skew.parsing.parseBlock(context);

    if (tryBlock === null) {
      return null;
    }

    return skew.Node.createTry(tryBlock, [], null).withRange(context.spanSince(token.range));
  };

  skew.parsing.parseWhile = function(context) {
    var token = context.next();
    var test = skew.parsing.pratt.parse(context, skew.Precedence.LOWEST);

    if (test === null) {
      return null;
    }

    var block = skew.parsing.parseBlock(context);

    if (block === null) {
      return null;
    }

    return skew.Node.createWhile(test, block).withRange(context.spanSince(token.range));
  };

  skew.parsing.parseStatement = function(context) {
    var token = context.current();

    switch (token.kind) {
      case skew.TokenKind.BREAK:
      case skew.TokenKind.CONTINUE: {
        return skew.parsing.parseJump(context);
        break;
      }

      case skew.TokenKind.CONST:
      case skew.TokenKind.VAR: {
        return skew.parsing.parseVarOrConst(context);
        break;
      }

      case skew.TokenKind.FOR: {
        return skew.parsing.parseFor(context);
        break;
      }

      case skew.TokenKind.IF: {
        return skew.parsing.parseIf(context);
        break;
      }

      case skew.TokenKind.RETURN: {
        return skew.parsing.parseReturn(context);
        break;
      }

      case skew.TokenKind.SWITCH: {
        return skew.parsing.parseSwitch(context);
        break;
      }

      case skew.TokenKind.THROW: {
        return skew.parsing.parseThrow(context);
        break;
      }

      case skew.TokenKind.TRY: {
        return skew.parsing.parseTry(context);
        break;
      }

      case skew.TokenKind.WHILE: {
        return skew.parsing.parseWhile(context);
        break;
      }
    }

    var value = skew.parsing.pratt.parse(context, skew.Precedence.LOWEST);

    if (value === null) {
      return null;
    }

    return skew.Node.createExpression(value).withRange(value.range);
  };

  skew.parsing.parseStatements = function(context) {
    var statements = [];
    var previous = null;
    context.eat(skew.TokenKind.NEWLINE);

    while (!context.peek(skew.TokenKind.RIGHT_BRACE)) {
      var comments = skew.parsing.parseLeadingComments(context);

      // Ignore trailing comments
      if (context.peek(skew.TokenKind.RIGHT_BRACE) || context.peek(skew.TokenKind.END_OF_FILE)) {
        break;
      }

      // Merge "else" statements with the previous "if"
      if (context.peek(skew.TokenKind.ELSE) && previous !== null && previous.kind === skew.NodeKind.IF && previous.ifFalse() === null) {
        context.next();

        // Match "else if"
        if (context.peek(skew.TokenKind.IF)) {
          var statement = skew.parsing.parseIf(context);

          if (statement === null) {
            return null;
          }

          var falseBlock = skew.Node.createBlock([statement]).withRange(statement.range);
          falseBlock.comments = comments;
          previous.replaceChild(2, falseBlock);
          previous = statement;
        }

        // Match "else"
        else {
          var falseBlock = skew.parsing.parseBlock(context);

          if (falseBlock === null) {
            return null;
          }

          falseBlock.comments = comments;
          previous.replaceChild(2, falseBlock);
          previous = falseBlock;
        }
      }

      // Merge "catch" statements with the previous "try"
      else if (context.peek(skew.TokenKind.CATCH) && previous !== null && previous.kind === skew.NodeKind.TRY && previous.finallyBlock() === null) {
        var catchToken = context.next();
        var symbol = null;
        var nameRange = context.current().range;

        // Optional typed variable
        if (context.eat(skew.TokenKind.IDENTIFIER)) {
          symbol = new skew.VariableSymbol(skew.SymbolKind.VARIABLE_LOCAL, nameRange.toString());
          symbol.range = nameRange;
          symbol.type = skew.parsing.parseType(context);

          if (symbol.type === null) {
            return null;
          }
        }

        // Manditory catch block
        var catchBlock = skew.parsing.parseBlock(context);

        if (catchBlock === null) {
          return null;
        }

        var child = skew.Node.createCatch(symbol, catchBlock).withRange(context.spanSince(catchToken.range));
        child.comments = comments;
        previous.insertChild(in_List.count(previous.children) - 1, child);
      }

      // Merge "finally" statements with the previous "try"
      else if (context.peek(skew.TokenKind.FINALLY) && previous !== null && previous.kind === skew.NodeKind.TRY && previous.finallyBlock() === null) {
        context.next();
        var finallyBlock = skew.parsing.parseBlock(context);

        if (finallyBlock === null) {
          return null;
        }

        finallyBlock.comments = comments;
        previous.replaceChild(in_List.count(previous.children) - 1, finallyBlock);
      }

      // Parse a new statement
      else {
        var statement = skew.parsing.parseStatement(context);

        if (statement === null) {
          break;
        }

        previous = statement;
        statement.comments = comments;
        in_List.append1(statements, statement);
      }

      // Parse trailing comments and/or newline
      comments = skew.parsing.parseTrailingComment(context, comments);

      if (comments !== null) {
        if (previous !== null) {
          previous.comments = comments;
        }

        context.eat(skew.TokenKind.NEWLINE);
      }

      else if (context.peek(skew.TokenKind.RIGHT_BRACE) || !context.peek(skew.TokenKind.ELSE) && !context.peek(skew.TokenKind.CATCH) && !context.peek(skew.TokenKind.FINALLY) && !context.expect(skew.TokenKind.NEWLINE)) {
        break;
      }
    }

    return statements;
  };

  skew.parsing.parseBlock = function(context) {
    var token = context.current();

    if (!context.expect(skew.TokenKind.LEFT_BRACE)) {
      return null;
    }

    var statements = skew.parsing.parseStatements(context);

    if (!context.expect(skew.TokenKind.RIGHT_BRACE)) {
      return null;
    }

    return skew.Node.createBlock(statements).withRange(context.spanSince(token.range));
  };

  skew.parsing.parseType = function(context) {
    return skew.parsing.typePratt.parse(context, skew.Precedence.LOWEST);
  };

  skew.parsing.peekType = function(context) {
    return context.peek(skew.TokenKind.IDENTIFIER) || context.peek(skew.TokenKind.DYNAMIC);
  };

  skew.parsing.parseFunctionBlock = function(context, symbol) {
    // "=> x" is the same as "{ return x }"
    if (symbol.kind === skew.SymbolKind.FUNCTION_LOCAL) {
      if (!context.expect(skew.TokenKind.ARROW)) {
        return false;
      }

      if (context.peek(skew.TokenKind.LEFT_BRACE)) {
        symbol.block = skew.parsing.parseBlock(context);

        if (symbol.block === null) {
          return false;
        }
      }

      else {
        var value = skew.parsing.pratt.parse(context, skew.Precedence.LOWEST);

        if (value === null) {
          return false;
        }

        symbol.block = skew.Node.createBlock([skew.Node.createReturn(value).withRange(value.range).withFlags(skew.Node.IS_IMPLICIT_RETURN)]).withRange(value.range);
      }
    }

    // Parse function body if present
    else if (context.peek(skew.TokenKind.LEFT_BRACE)) {
      symbol.block = skew.parsing.parseBlock(context);

      if (symbol.block === null) {
        return false;
      }
    }

    return true;
  };

  skew.parsing.parseFunctionArguments = function(context, symbol) {
    var usingTypes = false;

    while (!context.eat(skew.TokenKind.RIGHT_PARENTHESIS)) {
      if (!in_List.isEmpty(symbol.$arguments) && !context.expect(skew.TokenKind.COMMA)) {
        return false;
      }

      var range = context.current().range;

      if (!context.expect(skew.TokenKind.IDENTIFIER)) {
        return false;
      }

      var arg = new skew.VariableSymbol(skew.SymbolKind.VARIABLE_LOCAL, range.toString());
      arg.range = range;

      // Parse argument type
      if (symbol.kind !== skew.SymbolKind.FUNCTION_LOCAL || (in_List.isEmpty(symbol.$arguments) ? skew.parsing.peekType(context) : usingTypes)) {
        arg.type = skew.parsing.parseType(context);

        if (arg.type === null) {
          return false;
        }

        usingTypes = true;
      }

      // Parse default value
      if (context.eat(skew.TokenKind.ASSIGN)) {
        arg.value = skew.parsing.pratt.parse(context, skew.Precedence.LOWEST);

        if (arg.value === null) {
          return false;
        }
      }

      in_List.append1(symbol.$arguments, arg);
    }

    return true;
  };

  skew.parsing.parseFunctionReturnTypeAndBlock = function(context, symbol) {
    if (skew.parsing.peekType(context)) {
      symbol.returnType = skew.parsing.parseType(context);
    }

    return skew.parsing.parseFunctionBlock(context, symbol);
  };

  skew.parsing.parseTypeParameters = function(context, kind) {
    var parameters = [];

    while (true) {
      var range = context.current().range;
      var name = range.toString();

      if (!context.expect(skew.TokenKind.IDENTIFIER)) {
        return null;
      }

      var symbol = new skew.ParameterSymbol(kind, name);
      symbol.range = range;
      in_List.append1(parameters, symbol);

      if (!context.eat(skew.TokenKind.COMMA)) {
        break;
      }
    }

    if (!context.expect(skew.TokenKind.END_PARAMETER_LIST)) {
      return null;
    }

    return parameters;
  };

  skew.parsing.parseSymbol = function(context, parent, annotations) {
    // Parse comments before the symbol declaration
    var comments = skew.parsing.parseLeadingComments(context);

    // Ignore trailing comments
    if (context.peek(skew.TokenKind.RIGHT_BRACE) || context.peek(skew.TokenKind.END_OF_FILE)) {
      return false;
    }

    // Parse annotations before the symbol declaration
    if (context.peek(skew.TokenKind.ANNOTATION)) {
      annotations = skew.parsing.parseAnnotations(context, annotations);

      if (annotations === null) {
        return false;
      }

      // Parse an annotation block
      if (context.eat(skew.TokenKind.LEFT_BRACE)) {
        skew.parsing.parseSymbols(context, parent, annotations);
        return context.expect(skew.TokenKind.RIGHT_BRACE) && (context.peek(skew.TokenKind.END_OF_FILE) || context.peek(skew.TokenKind.RIGHT_BRACE) || context.expect(skew.TokenKind.NEWLINE));
      }
    }

    var token = context.current();

    // Special-case enum symbols
    if (parent.kind === skew.SymbolKind.OBJECT_ENUM && token.kind === skew.TokenKind.IDENTIFIER) {
      var variable = new skew.VariableSymbol(skew.SymbolKind.VARIABLE_ENUM, token.range.toString());
      variable.range = token.range;
      variable.flags |= skew.Symbol.IS_CONST;
      in_List.append1(parent.variables, variable);
      symbol = variable;
      context.next();
    }

    else {
      // Parse the symbol kind

      switch (token.kind) {
        case skew.TokenKind.CLASS: {
          kind = skew.SymbolKind.OBJECT_CLASS;
          break;
        }

        case skew.TokenKind.CONST:
        case skew.TokenKind.VAR: {
          kind = skew.SymbolKind.hasInstances(parent.kind) ? skew.SymbolKind.VARIABLE_INSTANCE : skew.SymbolKind.VARIABLE_GLOBAL;
          break;
        }

        case skew.TokenKind.DEF:
        case skew.TokenKind.OVER: {
          kind = skew.SymbolKind.hasInstances(parent.kind) ? skew.SymbolKind.FUNCTION_INSTANCE : skew.SymbolKind.FUNCTION_GLOBAL;
          break;
        }

        case skew.TokenKind.ENUM: {
          kind = skew.SymbolKind.OBJECT_ENUM;
          break;
        }

        case skew.TokenKind.INTERFACE: {
          kind = skew.SymbolKind.OBJECT_INTERFACE;
          break;
        }

        case skew.TokenKind.NAMESPACE: {
          kind = skew.SymbolKind.OBJECT_NAMESPACE;
          break;
        }

        default: {
          context.unexpectedToken();
          return false;
          break;
        }
      }

      context.next();

      // Parse the symbol name
      var nameToken = context.current();
      var range = nameToken.range;
      var name = range.toString();
      var isOperator = kind === skew.SymbolKind.FUNCTION_INSTANCE && ((nameToken.kind) | 0) in skew.parsing.operatorOverloadTokenKinds;

      if (isOperator) {
        context.next();
      }

      else if (kind === skew.SymbolKind.FUNCTION_GLOBAL && context.eat(skew.TokenKind.ANNOTATION)) {
        kind = skew.SymbolKind.FUNCTION_ANNOTATION;
      }

      else if (context.eat(skew.TokenKind.LIST_NEW) || context.eat(skew.TokenKind.SET_NEW)) {
        if (kind === skew.SymbolKind.FUNCTION_INSTANCE) {
          kind = skew.SymbolKind.FUNCTION_CONSTRUCTOR;
        }
      }

      else {
        if (!context.expect(skew.TokenKind.IDENTIFIER)) {
          return false;
        }

        if (kind === skew.SymbolKind.FUNCTION_INSTANCE && name === "new") {
          kind = skew.SymbolKind.FUNCTION_CONSTRUCTOR;
        }
      }

      // Parse shorthand nested namespace declarations
      if (skew.SymbolKind.isObject(kind)) {
        while (context.eat(skew.TokenKind.DOT)) {
          var nextToken = context.current();

          if (!context.expect(skew.TokenKind.IDENTIFIER)) {
            return false;
          }

          // Wrap this declaration in a namespace
          var nextParent = new skew.ObjectSymbol(skew.SymbolKind.OBJECT_NAMESPACE, name);
          nextParent.range = range;
          in_List.append1(parent.objects, nextParent);
          parent = nextParent;

          // Update the declaration token
          nameToken = nextToken;
          range = nextToken.range;
          name = range.toString();
        }
      }

      // Parse the symbol body
      switch (kind) {
        case skew.SymbolKind.VARIABLE_GLOBAL:
        case skew.SymbolKind.VARIABLE_INSTANCE: {
          var variable = new skew.VariableSymbol(kind, name);
          variable.range = range;

          if (token.kind === skew.TokenKind.CONST) {
            variable.flags |= skew.Symbol.IS_CONST;
          }

          if (skew.parsing.peekType(context)) {
            variable.type = skew.parsing.parseType(context);
          }

          if (context.eat(skew.TokenKind.ASSIGN)) {
            variable.value = skew.parsing.pratt.parse(context, skew.Precedence.LOWEST);
          }

          in_List.append1(parent.variables, variable);
          symbol = variable;
          break;
        }

        case skew.SymbolKind.FUNCTION_ANNOTATION:
        case skew.SymbolKind.FUNCTION_CONSTRUCTOR:
        case skew.SymbolKind.FUNCTION_GLOBAL:
        case skew.SymbolKind.FUNCTION_INSTANCE: {
          var $function = new skew.FunctionSymbol(kind, name);
          $function.range = range;

          if (token.kind === skew.TokenKind.OVER) {
            $function.flags |= skew.Symbol.IS_OVER;
          }

          // Check for setters like "def foo=(x int) {}" but don't allow a space
          // between the name and the assignment operator
          if (kind !== skew.SymbolKind.FUNCTION_ANNOTATION && nameToken.kind === skew.TokenKind.IDENTIFIER && context.peek(skew.TokenKind.ASSIGN) && context.current().range.start === nameToken.range.end) {
            $function.range = skew.Range.span($function.range, context.next().range);
            $function.flags |= skew.Symbol.IS_SETTER;
            $function.name += "=";
          }

          // Parse type parameters
          if (context.eat(skew.TokenKind.START_PARAMETER_LIST)) {
            $function.parameters = skew.parsing.parseTypeParameters(context, skew.SymbolKind.PARAMETER_FUNCTION);

            if ($function.parameters === null) {
              return false;
            }
          }

          // Parse function arguments
          var before = context.current();

          if (context.eat(skew.TokenKind.LEFT_PARENTHESIS)) {
            if (!skew.parsing.parseFunctionArguments(context, $function)) {
              return false;
            }

            // Functions without arguments are "getters" and don't use parentheses
            if (in_List.isEmpty($function.$arguments)) {
              context.log.syntaxErrorEmptyFunctionParentheses(context.spanSince(before.range));
            }
          }

          if (kind !== skew.SymbolKind.FUNCTION_ANNOTATION && !skew.parsing.parseFunctionReturnTypeAndBlock(context, $function)) {
            return false;
          }

          // Don't mark operators as getters to avoid confusion with unary operators and compiler-generated call expressions
          if (!isOperator && in_List.isEmpty($function.$arguments)) {
            $function.flags |= skew.Symbol.IS_GETTER;
          }

          in_List.append1(parent.functions, $function);
          symbol = $function;
          break;
        }

        case skew.SymbolKind.OBJECT_CLASS:
        case skew.SymbolKind.OBJECT_ENUM:
        case skew.SymbolKind.OBJECT_INTERFACE:
        case skew.SymbolKind.OBJECT_NAMESPACE: {
          var object = new skew.ObjectSymbol(kind, name);
          object.range = range;

          if (kind !== skew.SymbolKind.OBJECT_NAMESPACE && context.eat(skew.TokenKind.START_PARAMETER_LIST)) {
            object.parameters = skew.parsing.parseTypeParameters(context, skew.SymbolKind.PARAMETER_OBJECT);

            if (object.parameters === null) {
              return false;
            }
          }

          if (context.eat(skew.TokenKind.COLON)) {
            object.base = skew.parsing.parseType(context);

            if (object.base === null) {
              return false;
            }
          }

          if (!context.expect(skew.TokenKind.LEFT_BRACE)) {
            return false;
          }

          skew.parsing.parseSymbols(context, object, null);

          if (!context.expect(skew.TokenKind.RIGHT_BRACE)) {
            return false;
          }

          in_List.append1(parent.objects, object);
          symbol = object;
          break;
        }

        default: {
          assert(false);
          break;
        }
      }

      // Forbid certain kinds of symbols inside enums
      if (parent.kind === skew.SymbolKind.OBJECT_ENUM && (kind === skew.SymbolKind.FUNCTION_CONSTRUCTOR || kind === skew.SymbolKind.VARIABLE_INSTANCE)) {
        context.log.syntaxErrorBadDeclarationInsideEnum(context.spanSince(token.range));
      }
    }

    symbol.annotations = annotations;
    symbol.comments = comments;
    comments = skew.parsing.parseTrailingComment(context, comments);

    if (comments !== null) {
      symbol.comments = comments;
      context.eat(skew.TokenKind.NEWLINE);
    }

    else if (!context.peek(skew.TokenKind.END_OF_FILE) && !context.peek(skew.TokenKind.RIGHT_BRACE) && !context.expect(skew.TokenKind.NEWLINE)) {
      return false;
    }

    return true;
  };

  skew.parsing.parseSymbols = function(context, parent, annotations) {
    context.eat(skew.TokenKind.NEWLINE);

    while (!context.peek(skew.TokenKind.END_OF_FILE) && !context.peek(skew.TokenKind.RIGHT_BRACE)) {
      if (!skew.parsing.parseSymbol(context, parent, annotations)) {
        break;
      }
    }
  };

  skew.parsing.parseFile = function(log, tokens, global) {
    var context = new skew.ParserContext(log, tokens);
    skew.parsing.parseSymbols(context, global, null);
    context.expect(skew.TokenKind.END_OF_FILE);
  };

  skew.parsing.parseCommaSeparatedList = function(context, stop) {
    var values = [];

    while (!context.peek(stop)) {
      if (!in_List.isEmpty(values)) {
        if (!context.expect(skew.TokenKind.COMMA)) {
          return null;
        }

        context.eat(skew.TokenKind.NEWLINE);
      }

      var value = skew.parsing.pratt.parse(context, skew.Precedence.LOWEST);
      in_List.append1(values, value);

      if (value === null) {
        break;
      }
    }

    if (!context.expect(stop)) {
      return null;
    }

    return values;
  };

  skew.parsing.parseHexCharacter = function(c) {
    if (c >= 48 && c <= 57) {
      return c - 48;
    }

    if (c >= 65 && c <= 70) {
      return c - 65 + 10;
    }

    if (c >= 97 && c <= 102) {
      return c - 97 + 10;
    }

    return -1;
  };

  skew.parsing.parseStringLiteral = function(log, range) {
    var text = range.toString();
    assert(in_string.count(text) >= 2);
    assert(in_string.get1(text, 0) === 34 || in_string.get1(text, 0) === 39);
    assert(in_string.get1(text, in_string.count(text) - 1) === in_string.get1(text, 0));
    var isValidString = true;
    var builder = in_StringBuilder.$new();

    // Append long runs of unescaped characters using a single slice for speed
    var start = 1;
    var i = 1;

    while (i + 1 < in_string.count(text)) {
      var c = in_string.get1(text, i);
      ++i;

      if (c === 92) {
        var escape = i - 1;
        in_StringBuilder.append(builder, text.slice(start, escape));

        if (i + 1 < in_string.count(text)) {
          c = in_string.get1(text, i);
          ++i;

          if (c === 110) {
            in_StringBuilder.append(builder, "\n");
            start = i;
          }

          else if (c === 114) {
            in_StringBuilder.append(builder, "\r");
            start = i;
          }

          else if (c === 116) {
            in_StringBuilder.append(builder, "\t");
            start = i;
          }

          else if (c === 101) {
            in_StringBuilder.append(builder, "\x1B");
            start = i;
          }

          else if (c === 48) {
            in_StringBuilder.append(builder, "\0");
            start = i;
          }

          else if (c === 92 || c === 34 || c === 39) {
            in_StringBuilder.append(builder, in_string.fromCodeUnit(c));
            start = i;
          }

          else if (c === 120) {
            if (i + 1 < in_string.count(text)) {
              var c0 = skew.parsing.parseHexCharacter(in_string.get1(text, i));
              ++i;

              if (i + 1 < in_string.count(text)) {
                var c1 = skew.parsing.parseHexCharacter(in_string.get1(text, i));
                ++i;

                if (c0 !== -1 && c1 !== -1) {
                  in_StringBuilder.append(builder, in_string.fromCodeUnit(c0 << 4 | c1));
                  start = i;
                }
              }
            }
          }
        }

        if (start < i) {
          log.syntaxErrorInvalidEscapeSequence(new skew.Range(range.source, range.start + escape, range.start + i));
          isValidString = false;
        }
      }
    }

    in_StringBuilder.append(builder, text.slice(start, i));
    return isValidString ? new skew.StringContent(in_StringBuilder.toString(builder)) : null;
  };

  skew.parsing.parseInterpolate = function(context, left) {
    var token = context.next();
    var result = skew.parsing.parseStringLiteral(context.log, token.range);

    if (result === null) {
      return null;
    }

    // Concatentate the previous value with the string
    var middle = skew.Node.createString(result.value).withRange(token.range);

    if (left !== null) {
      middle = skew.Node.createInterpolate(left, middle).withRange(context.spanSince(left.range));
    }

    // Concatentate further values with the result
    if (context.peek(skew.TokenKind.IDENTIFIER) || context.peek(skew.TokenKind.LEFT_PARENTHESIS)) {
      var right = skew.parsing.pratt.parse(context, skew.Precedence.UNARY_PREFIX);

      if (right === null) {
        return null;
      }

      return skew.Node.createInterpolate(middle, right).withRange(context.spanSince(middle.range));
    }

    return middle;
  };

  skew.parsing.unaryPrefix = function(kind) {
    return function(context, token, value) {
      return skew.Node.createUnary(kind, value).withRange(skew.Range.span(token.range, value.range)).withInternalRange(token.range);
    };
  };

  skew.parsing.unaryPostfix = function(kind) {
    return function(context, value, token) {
      return skew.Node.createUnary(kind, value).withRange(skew.Range.span(value.range, token.range)).withInternalRange(token.range);
    };
  };

  skew.parsing.binaryInfix = function(kind) {
    return function(context, left, token, right) {
      if (kind === skew.NodeKind.ASSIGN && left.kind === skew.NodeKind.INDEX) {
        left.appendChild(right);
        left.kind = skew.NodeKind.ASSIGN_INDEX;
        return left.withRange(skew.Range.span(left.range, right.range)).withInternalRange(skew.Range.span(left.internalRange, right.range));
      }

      return skew.Node.createBinary(kind, left, right).withRange(skew.Range.span(left.range, right.range)).withInternalRange(token.range);
    };
  };

  skew.parsing.createExpressionParser = function() {
    var pratt = new skew.Pratt();
    pratt.literal(skew.TokenKind.DOUBLE, function(context, token) {
      return skew.Node.createDouble(skew.parsing.parseDoubleLiteral(token.range.toString())).withRange(token.range);
    });
    pratt.literal(skew.TokenKind.FALSE, skew.parsing.boolLiteral(false));
    pratt.literal(skew.TokenKind.INT, skew.parsing.intLiteral(10));
    pratt.literal(skew.TokenKind.INT_BINARY, skew.parsing.intLiteral(2));
    pratt.literal(skew.TokenKind.INT_HEX, skew.parsing.intLiteral(16));
    pratt.literal(skew.TokenKind.INT_OCTAL, skew.parsing.intLiteral(8));
    pratt.literal(skew.TokenKind.NULL, skew.parsing.tokenLiteral(skew.NodeKind.NULL));
    pratt.literal(skew.TokenKind.SUPER, skew.parsing.tokenLiteral(skew.NodeKind.SUPER));
    pratt.literal(skew.TokenKind.TRUE, skew.parsing.boolLiteral(true));
    pratt.literal(skew.TokenKind.CHARACTER, function(context, token) {
      var result = skew.parsing.parseStringLiteral(context.log, token.range);
      var codePoint = 0;

      // There must be exactly one unicode code point
      if (result !== null) {
        var iterator = unicode.StringIterator.INSTANCE.reset(result.value, 0);
        codePoint = iterator.nextCodePoint();

        if (codePoint === -1 || iterator.nextCodePoint() !== -1) {
          context.log.syntaxErrorInvalidCharacter(token.range);
        }
      }

      // Don't return null when there's an error because that
      // error won't affect the rest of the compilation
      return skew.Node.createInt(codePoint).withRange(token.range);
    });
    pratt.prefix(skew.TokenKind.MINUS, skew.Precedence.UNARY_PREFIX, skew.parsing.unaryPrefix(skew.NodeKind.NEGATIVE));
    pratt.prefix(skew.TokenKind.NOT, skew.Precedence.UNARY_PREFIX, skew.parsing.unaryPrefix(skew.NodeKind.NOT));
    pratt.prefix(skew.TokenKind.PLUS, skew.Precedence.UNARY_PREFIX, skew.parsing.unaryPrefix(skew.NodeKind.POSITIVE));
    pratt.prefix(skew.TokenKind.TILDE, skew.Precedence.UNARY_PREFIX, skew.parsing.unaryPrefix(skew.NodeKind.COMPLEMENT));
    pratt.prefix(skew.TokenKind.INCREMENT, skew.Precedence.UNARY_PREFIX, skew.parsing.unaryPrefix(skew.NodeKind.INCREMENT));
    pratt.prefix(skew.TokenKind.DECREMENT, skew.Precedence.UNARY_PREFIX, skew.parsing.unaryPrefix(skew.NodeKind.DECREMENT));
    pratt.postfix(skew.TokenKind.INCREMENT, skew.Precedence.UNARY_PREFIX, skew.parsing.unaryPostfix(skew.NodeKind.INCREMENT));
    pratt.postfix(skew.TokenKind.DECREMENT, skew.Precedence.UNARY_PREFIX, skew.parsing.unaryPostfix(skew.NodeKind.DECREMENT));
    pratt.infix(skew.TokenKind.BITWISE_AND, skew.Precedence.BITWISE_AND, skew.parsing.binaryInfix(skew.NodeKind.BITWISE_AND));
    pratt.infix(skew.TokenKind.BITWISE_OR, skew.Precedence.BITWISE_OR, skew.parsing.binaryInfix(skew.NodeKind.BITWISE_OR));
    pratt.infix(skew.TokenKind.BITWISE_XOR, skew.Precedence.BITWISE_XOR, skew.parsing.binaryInfix(skew.NodeKind.BITWISE_XOR));
    pratt.infix(skew.TokenKind.COMPARE, skew.Precedence.COMPARE, skew.parsing.binaryInfix(skew.NodeKind.COMPARE));
    pratt.infix(skew.TokenKind.DIVIDE, skew.Precedence.MULTIPLY, skew.parsing.binaryInfix(skew.NodeKind.DIVIDE));
    pratt.infix(skew.TokenKind.EQUAL, skew.Precedence.EQUAL, skew.parsing.binaryInfix(skew.NodeKind.EQUAL));
    pratt.infix(skew.TokenKind.GREATER_THAN, skew.Precedence.COMPARE, skew.parsing.binaryInfix(skew.NodeKind.GREATER_THAN));
    pratt.infix(skew.TokenKind.GREATER_THAN_OR_EQUAL, skew.Precedence.COMPARE, skew.parsing.binaryInfix(skew.NodeKind.GREATER_THAN_OR_EQUAL));
    pratt.infix(skew.TokenKind.IN, skew.Precedence.COMPARE, skew.parsing.binaryInfix(skew.NodeKind.IN));
    pratt.infix(skew.TokenKind.LESS_THAN, skew.Precedence.COMPARE, skew.parsing.binaryInfix(skew.NodeKind.LESS_THAN));
    pratt.infix(skew.TokenKind.LESS_THAN_OR_EQUAL, skew.Precedence.COMPARE, skew.parsing.binaryInfix(skew.NodeKind.LESS_THAN_OR_EQUAL));
    pratt.infix(skew.TokenKind.LOGICAL_AND, skew.Precedence.LOGICAL_AND, skew.parsing.binaryInfix(skew.NodeKind.LOGICAL_AND));
    pratt.infix(skew.TokenKind.LOGICAL_OR, skew.Precedence.LOGICAL_OR, skew.parsing.binaryInfix(skew.NodeKind.LOGICAL_OR));
    pratt.infix(skew.TokenKind.MINUS, skew.Precedence.ADD, skew.parsing.binaryInfix(skew.NodeKind.SUBTRACT));
    pratt.infix(skew.TokenKind.MULTIPLY, skew.Precedence.MULTIPLY, skew.parsing.binaryInfix(skew.NodeKind.MULTIPLY));
    pratt.infix(skew.TokenKind.NOT_EQUAL, skew.Precedence.EQUAL, skew.parsing.binaryInfix(skew.NodeKind.NOT_EQUAL));
    pratt.infix(skew.TokenKind.PLUS, skew.Precedence.ADD, skew.parsing.binaryInfix(skew.NodeKind.ADD));
    pratt.infix(skew.TokenKind.POWER, skew.Precedence.UNARY_PREFIX, skew.parsing.binaryInfix(skew.NodeKind.POWER));
    pratt.infix(skew.TokenKind.REMAINDER, skew.Precedence.MULTIPLY, skew.parsing.binaryInfix(skew.NodeKind.REMAINDER));
    pratt.infix(skew.TokenKind.SHIFT_LEFT, skew.Precedence.SHIFT, skew.parsing.binaryInfix(skew.NodeKind.SHIFT_LEFT));
    pratt.infix(skew.TokenKind.SHIFT_RIGHT, skew.Precedence.SHIFT, skew.parsing.binaryInfix(skew.NodeKind.SHIFT_RIGHT));
    pratt.infixRight(skew.TokenKind.ASSIGN, skew.Precedence.ASSIGN, skew.parsing.binaryInfix(skew.NodeKind.ASSIGN));
    pratt.infixRight(skew.TokenKind.ASSIGN_BITWISE_AND, skew.Precedence.ASSIGN, skew.parsing.binaryInfix(skew.NodeKind.ASSIGN_BITWISE_AND));
    pratt.infixRight(skew.TokenKind.ASSIGN_BITWISE_OR, skew.Precedence.ASSIGN, skew.parsing.binaryInfix(skew.NodeKind.ASSIGN_BITWISE_OR));
    pratt.infixRight(skew.TokenKind.ASSIGN_BITWISE_XOR, skew.Precedence.ASSIGN, skew.parsing.binaryInfix(skew.NodeKind.ASSIGN_BITWISE_XOR));
    pratt.infixRight(skew.TokenKind.ASSIGN_DIVIDE, skew.Precedence.ASSIGN, skew.parsing.binaryInfix(skew.NodeKind.ASSIGN_DIVIDE));
    pratt.infixRight(skew.TokenKind.ASSIGN_MINUS, skew.Precedence.ASSIGN, skew.parsing.binaryInfix(skew.NodeKind.ASSIGN_SUBTRACT));
    pratt.infixRight(skew.TokenKind.ASSIGN_MULTIPLY, skew.Precedence.ASSIGN, skew.parsing.binaryInfix(skew.NodeKind.ASSIGN_MULTIPLY));
    pratt.infixRight(skew.TokenKind.ASSIGN_PLUS, skew.Precedence.ASSIGN, skew.parsing.binaryInfix(skew.NodeKind.ASSIGN_ADD));
    pratt.infixRight(skew.TokenKind.ASSIGN_POWER, skew.Precedence.ASSIGN, skew.parsing.binaryInfix(skew.NodeKind.ASSIGN_POWER));
    pratt.infixRight(skew.TokenKind.ASSIGN_REMAINDER, skew.Precedence.ASSIGN, skew.parsing.binaryInfix(skew.NodeKind.ASSIGN_REMAINDER));
    pratt.infixRight(skew.TokenKind.ASSIGN_SHIFT_LEFT, skew.Precedence.ASSIGN, skew.parsing.binaryInfix(skew.NodeKind.ASSIGN_SHIFT_LEFT));
    pratt.infixRight(skew.TokenKind.ASSIGN_SHIFT_RIGHT, skew.Precedence.ASSIGN, skew.parsing.binaryInfix(skew.NodeKind.ASSIGN_SHIFT_RIGHT));
    pratt.parselet(skew.TokenKind.DOT, skew.Precedence.MEMBER).infix = skew.parsing.dotInfixParselet;
    pratt.parselet(skew.TokenKind.INDEX, skew.Precedence.LOWEST).prefix = skew.parsing.initializerParselet;
    pratt.parselet(skew.TokenKind.LEFT_BRACE, skew.Precedence.LOWEST).prefix = skew.parsing.initializerParselet;
    pratt.parselet(skew.TokenKind.LEFT_BRACKET, skew.Precedence.LOWEST).prefix = skew.parsing.initializerParselet;
    pratt.parselet(skew.TokenKind.LIST_NEW, skew.Precedence.LOWEST).prefix = skew.parsing.initializerParselet;
    pratt.parselet(skew.TokenKind.SET_NEW, skew.Precedence.LOWEST).prefix = skew.parsing.initializerParselet;
    pratt.parselet(skew.TokenKind.START_PARAMETER_LIST, skew.Precedence.MEMBER).infix = skew.parsing.parameterizedParselet;
    pratt.parselet(skew.TokenKind.STRING, skew.Precedence.UNARY_PREFIX).infix = function(context, left) {
      return skew.parsing.parseInterpolate(context, left);
    };
    pratt.parselet(skew.TokenKind.STRING, skew.Precedence.LOWEST).prefix = function(context) {
      return skew.parsing.parseInterpolate(context, null);
    };

    // Lambda expressions like "=> x"
    pratt.parselet(skew.TokenKind.ARROW, skew.Precedence.LOWEST).prefix = function(context) {
      var token = context.current();
      var symbol = new skew.FunctionSymbol(skew.SymbolKind.FUNCTION_LOCAL, "<lambda>");

      if (!skew.parsing.parseFunctionBlock(context, symbol)) {
        return null;
      }

      symbol.range = context.spanSince(token.range);
      return skew.Node.createLambda(symbol).withRange(symbol.range);
    };

    // Cast expressions
    pratt.parselet(skew.TokenKind.AS, skew.Precedence.UNARY_PREFIX).infix = function(context, left) {
      var token = context.next();
      var type = skew.parsing.parseType(context);

      if (type === null) {
        return null;
      }

      return skew.Node.createCast(left, type).withRange(context.spanSince(left.range)).withInternalRange(token.range);
    };

    // Using "." as a unary prefix operator accesses members off the inferred type
    pratt.parselet(skew.TokenKind.DOT, skew.Precedence.MEMBER).prefix = function(context) {
      var token = context.next();
      var range = context.current().range;

      if (!context.expect(skew.TokenKind.IDENTIFIER)) {
        return null;
      }

      return skew.Node.createDot(null, range.toString()).withRange(context.spanSince(token.range)).withInternalRange(range);
    };

    // Access members off of "dynamic" for untyped globals
    pratt.parselet(skew.TokenKind.DYNAMIC, skew.Precedence.LOWEST).prefix = function(context) {
      var token = context.next();

      if (!context.expect(skew.TokenKind.DOT)) {
        return null;
      }

      var range = context.current().range;

      if (!context.expect(skew.TokenKind.IDENTIFIER)) {
        return null;
      }

      return skew.Node.createDot(skew.Node.createDynamic(), range.toString()).withRange(context.spanSince(token.range)).withInternalRange(range);
    };

    // Name expressions and lambda| expressions like "x => x * x"
    pratt.parselet(skew.TokenKind.IDENTIFIER, skew.Precedence.LOWEST).prefix = function(context) {
      var range = context.next().range;
      var name = range.toString();

      if (context.peek(skew.TokenKind.ARROW)) {
        var symbol = new skew.FunctionSymbol(skew.SymbolKind.FUNCTION_LOCAL, "<lambda>");
        var argument = new skew.VariableSymbol(skew.SymbolKind.VARIABLE_LOCAL, name);
        argument.range = range;
        in_List.append1(symbol.$arguments, argument);

        if (!skew.parsing.parseFunctionBlock(context, symbol)) {
          return null;
        }

        symbol.range = context.spanSince(range);
        return skew.Node.createLambda(symbol).withRange(symbol.range);
      }

      return skew.Node.createName(name).withRange(range);
    };

    // Index expressions
    pratt.parselet(skew.TokenKind.LEFT_BRACKET, skew.Precedence.MEMBER).infix = function(context, left) {
      var token = context.next();
      var $arguments = skew.parsing.parseCommaSeparatedList(context, skew.TokenKind.RIGHT_BRACKET);

      if ($arguments === null) {
        return null;
      }

      return skew.Node.createIndex(left, $arguments).withRange(context.spanSince(left.range)).withInternalRange(context.spanSince(token.range));
    };

    // Parenthetic groups and lambda expressions like "() => x"
    pratt.parselet(skew.TokenKind.LEFT_PARENTHESIS, skew.Precedence.LOWEST).prefix = function(context) {
      var token = context.next();

      // Try to parse a group
      if (!context.peek(skew.TokenKind.RIGHT_PARENTHESIS)) {
        var value = pratt.parse(context, skew.Precedence.LOWEST);

        if (value === null) {
          return null;
        }

        if ((value.kind !== skew.NodeKind.NAME || !skew.parsing.peekType(context)) && context.eat(skew.TokenKind.RIGHT_PARENTHESIS)) {
          if (value.kind !== skew.NodeKind.NAME || !context.peek(skew.TokenKind.ARROW)) {
            return value.withRange(context.spanSince(token.range)).withFlags(skew.Node.IS_INSIDE_PARENTHESES);
          }

          context.undo();
        }

        context.undo();
      }

      // Parse a lambda instead
      var symbol = new skew.FunctionSymbol(skew.SymbolKind.FUNCTION_LOCAL, "<lambda>");

      if (!skew.parsing.parseFunctionArguments(context, symbol) || !skew.parsing.parseFunctionReturnTypeAndBlock(context, symbol)) {
        return null;
      }

      symbol.range = context.spanSince(token.range);
      return skew.Node.createLambda(symbol).withRange(symbol.range);
    };

    // Call expressions
    pratt.parselet(skew.TokenKind.LEFT_PARENTHESIS, skew.Precedence.UNARY_POSTFIX).infix = function(context, left) {
      var token = context.next();
      var $arguments = skew.parsing.parseCommaSeparatedList(context, skew.TokenKind.RIGHT_PARENTHESIS);

      if ($arguments === null) {
        return null;
      }

      return skew.Node.createCall(left, $arguments).withRange(context.spanSince(left.range)).withInternalRange(context.spanSince(token.range));
    };

    // Hook expressions
    pratt.parselet(skew.TokenKind.QUESTION_MARK, skew.Precedence.ASSIGN).infix = function(context, left) {
      context.next();
      var middle = pratt.parse(context, ((skew.Precedence.ASSIGN) | 0) - 1);

      if (middle === null || !context.expect(skew.TokenKind.COLON)) {
        return null;
      }

      var right = pratt.parse(context, ((skew.Precedence.ASSIGN) | 0) - 1);

      if (right === null) {
        return null;
      }

      return skew.Node.createHook(left, middle, right).withRange(context.spanSince(left.range));
    };
    return pratt;
  };

  skew.parsing.createTypeParser = function() {
    var pratt = new skew.Pratt();
    pratt.literal(skew.TokenKind.DYNAMIC, skew.parsing.tokenLiteral(skew.NodeKind.DYNAMIC));
    pratt.parselet(skew.TokenKind.DOT, skew.Precedence.MEMBER).infix = skew.parsing.dotInfixParselet;
    pratt.parselet(skew.TokenKind.START_PARAMETER_LIST, skew.Precedence.MEMBER).infix = skew.parsing.parameterizedParselet;

    // Name expressions or lambda type expressions like "fn(int) int"
    pratt.parselet(skew.TokenKind.IDENTIFIER, skew.Precedence.LOWEST).prefix = function(context) {
      var token = context.next();
      var name = token.range.toString();

      if (name !== "fn" || !context.eat(skew.TokenKind.LEFT_PARENTHESIS)) {
        return skew.Node.createName(name).withRange(token.range);
      }

      // Parse argument types
      var argTypes = [];

      while (!context.eat(skew.TokenKind.RIGHT_PARENTHESIS)) {
        if (!in_List.isEmpty(argTypes) && !context.expect(skew.TokenKind.COMMA)) {
          return null;
        }

        var type = skew.parsing.parseType(context);

        if (type === null) {
          return null;
        }

        in_List.append1(argTypes, type);
      }

      var returnType = null;

      // Parse return type if present
      if (skew.parsing.peekType(context)) {
        returnType = skew.parsing.parseType(context);

        if (returnType === null) {
          return null;
        }
      }

      return skew.Node.createLambdaType(argTypes, returnType).withRange(context.spanSince(token.range));
    };
    return pratt;
  };

  skew.ParserContext = function(log, tokens) {
    var self = this;
    self.log = log;
    self.inNonVoidFunction = false;
    self.needsPreprocessor = false;
    self.tokens = tokens;
    self.index = 0;
    self.previousSyntaxError = null;
  };

  skew.ParserContext.prototype.current = function() {
    var self = this;
    return self.tokens[self.index];
  };

  skew.ParserContext.prototype.next = function() {
    var self = this;
    var token = self.current();

    if (self.index + 1 < in_List.count(self.tokens)) {
      ++self.index;
    }

    return token;
  };

  skew.ParserContext.prototype.spanSince = function(range) {
    var self = this;
    var previous = self.tokens[self.index > 0 ? self.index - 1 : 0];
    return previous.range.end < range.start ? range : skew.Range.span(range, previous.range);
  };

  skew.ParserContext.prototype.peek = function(kind) {
    var self = this;
    return self.current().kind === kind;
  };

  skew.ParserContext.prototype.eat = function(kind) {
    var self = this;
    if (self.peek(kind)) {
      self.next();
      return true;
    }

    return false;
  };

  skew.ParserContext.prototype.undo = function() {
    var self = this;
    assert(self.index > 0);
    --self.index;
  };

  skew.ParserContext.prototype.expect = function(kind) {
    var self = this;
    if (!self.eat(kind)) {
      var token = self.current();

      if (self.previousSyntaxError !== token) {
        var range = token.range;
        self.log.syntaxErrorExpectedToken(range, token.kind, kind);
        self.previousSyntaxError = token;
      }

      return false;
    }

    return true;
  };

  skew.ParserContext.prototype.unexpectedToken = function() {
    var self = this;
    var token = self.current();

    if (self.previousSyntaxError !== token) {
      self.log.syntaxErrorUnexpectedToken(token);
      self.previousSyntaxError = token;
    }
  };

  skew.Parselet = function(precedence) {
    var self = this;
    self.precedence = precedence;
    self.prefix = null;
    self.infix = null;
  };

  // A Pratt parser is a parser that associates up to two operations per token,
  // each with its own precedence. Pratt parsers excel at parsing expression
  // trees with deeply nested precedence levels. For an excellent writeup, see:
  //
  //   http:#journal.stuffwithstuff.com/2011/03/19/pratt-parsers-expression-parsing-made-easy/
  //
  skew.Pratt = function() {
    var self = this;
    self.table = in_IntMap.$new();
  };

  skew.Pratt.prototype.parselet = function(kind, precedence) {
    var self = this;
    var parselet = in_IntMap.get(self.table, ((kind) | 0), null);

    if (parselet === null) {
      var created = new skew.Parselet(precedence);
      parselet = created;
      self.table[((kind) | 0)] = created;
    }

    else if (((precedence) | 0) > ((parselet.precedence) | 0)) {
      parselet.precedence = precedence;
    }

    return parselet;
  };

  skew.Pratt.prototype.parse = function(context, precedence) {
    var self = this;
    var token = context.current();
    var parselet = in_IntMap.get(self.table, ((token.kind) | 0), null);

    if (parselet === null || parselet.prefix === null) {
      context.unexpectedToken();
      return null;
    }

    var node = self.resume(context, precedence, parselet.prefix(context));

    // Parselets must set the range of every node
    assert(node === null || node.range !== null);
    return node;
  };

  skew.Pratt.prototype.resume = function(context, precedence, left) {
    var self = this;
    while (left !== null) {
      var kind = context.current().kind;
      var parselet = in_IntMap.get(self.table, ((kind) | 0), null);

      if (parselet === null || parselet.infix === null || ((parselet.precedence) | 0) <= ((precedence) | 0)) {
        break;
      }

      left = parselet.infix(context, left);

      // Parselets must set the range of every node
      assert(left === null || left.range !== null);
    }

    return left;
  };

  skew.Pratt.prototype.hasPrefixParselet = function(context) {
    var self = this;
    var parselet = in_IntMap.get(self.table, ((context.current().kind) | 0), null);
    return parselet !== null && parselet.prefix !== null;
  };

  skew.Pratt.prototype.literal = function(kind, callback) {
    var self = this;
    self.parselet(kind, skew.Precedence.LOWEST).prefix = function(context) {
      return callback(context, context.next());
    };
  };

  skew.Pratt.prototype.prefix = function(kind, precedence, callback) {
    var self = this;
    self.parselet(kind, skew.Precedence.LOWEST).prefix = function(context) {
      var token = context.next();
      var value = self.parse(context, precedence);
      return value !== null ? callback(context, token, value) : null;
    };
  };

  skew.Pratt.prototype.postfix = function(kind, precedence, callback) {
    var self = this;
    self.parselet(kind, precedence).infix = function(context, left) {
      return callback(context, left, context.next());
    };
  };

  skew.Pratt.prototype.infix = function(kind, precedence, callback) {
    var self = this;
    self.parselet(kind, precedence).infix = function(context, left) {
      var token = context.next();
      var right = self.parse(context, precedence);
      return right !== null ? callback(context, left, token, right) : null;
    };
  };

  skew.Pratt.prototype.infixRight = function(kind, precedence, callback) {
    var self = this;
    self.parselet(kind, precedence).infix = function(context, left) {
      var token = context.next();

      // Subtract 1 for right-associativity
      var right = self.parse(context, ((precedence) | 0) - 1);
      return right !== null ? callback(context, left, token, right) : null;
    };
  };

  skew.FormattedRange = function(line, range) {
    var self = this;
    self.line = line;
    self.range = range;
  };

  skew.Range = function(source, start, end) {
    var self = this;
    self.source = source;
    self.start = start;
    self.end = end;
  };

  skew.Range.prototype.toString = function() {
    var self = this;
    return self.source.contents.slice(self.start, self.end);
  };

  skew.Range.prototype.locationString = function() {
    var self = this;
    var location = self.source.indexToLineColumn(self.start);
    return self.source.name + ":" + (location.line + 1).toString() + ":" + (location.column + 1).toString();
  };

  skew.Range.prototype.format = function(maxLength) {
    var self = this;
    assert(self.source !== null);
    var start = self.source.indexToLineColumn(self.start);
    var end = self.source.indexToLineColumn(self.end);
    var line = self.source.contentsOfLine(start.line);
    var length = in_string.count(line);

    // Use a unicode iterator to count the actual code points so they don't get sliced through the middle
    var iterator = unicode.StringIterator.INSTANCE.reset(line, 0);
    var a = iterator.countCodePointsUntil(start.column);
    var b = a + iterator.countCodePointsUntil(end.line === start.line ? end.column : length);
    var count = b + iterator.countCodePointsUntil(length);

    // Ensure the line length doesn't exceed maxLength
    if (maxLength > 0 && count > maxLength) {
      var centeredWidth = Math.min(b - a, ((maxLength) / (2) | 0));
      var centeredStart = Math.max(((maxLength - centeredWidth) / (2) | 0), 3);
      var codePoints = in_string.codePoints(line);

      // Left aligned
      if (a < centeredStart) {
        line = in_string.fromCodePoints(codePoints.slice(0, maxLength - 3)) + "...";

        if (b > maxLength - 3) {
          b = maxLength - 3;
        }
      }

      // Right aligned
      else if (count - a < maxLength - centeredStart) {
        var offset = count - maxLength;
        line = "..." + in_string.fromCodePoints(codePoints.slice(offset + 3, count));
        a -= offset;
        b -= offset;
      }

      // Center aligned
      else {
        var offset = a - centeredStart;
        line = "..." + in_string.fromCodePoints(codePoints.slice(offset + 3, offset + maxLength - 3)) + "...";
        a -= offset;
        b -= offset;

        if (b > maxLength - 3) {
          b = maxLength - 3;
        }
      }
    }

    return new skew.FormattedRange(line, in_string.repeat(" ", a) + (b - a < 2 ? "^" : in_string.repeat("~", b - a)));
  };

  skew.Range.prototype.fromStart = function(count) {
    var self = this;
    assert(count >= 0 && count <= self.end - self.start);
    return new skew.Range(self.source, self.start, self.start + count);
  };

  skew.Range.prototype.fromEnd = function(count) {
    var self = this;
    assert(count >= 0 && count <= self.end - self.start);
    return new skew.Range(self.source, self.end - count, self.end);
  };

  skew.Range.prototype.slice = function(offsetStart, offsetEnd) {
    var self = this;
    assert(offsetStart >= 0 && offsetStart <= offsetEnd && offsetEnd <= self.end - self.start);
    return new skew.Range(self.source, self.start + offsetStart, self.start + offsetEnd);
  };

  skew.Range.span = function(start, end) {
    assert(start.source === end.source);
    assert(start.start <= end.end);
    return new skew.Range(start.source, start.start, end.end);
  };

  skew.Range.inner = function(start, end) {
    assert(start.source === end.source);
    assert(start.end <= end.start);
    return new skew.Range(start.source, start.end, end.start);
  };

  skew.Range.before = function(outer, inner) {
    assert(outer.source === inner.source);
    assert(outer.start <= inner.start);
    assert(outer.end >= inner.end);
    return new skew.Range(outer.source, outer.start, inner.start);
  };

  skew.Range.after = function(outer, inner) {
    assert(outer.source === inner.source);
    assert(outer.start <= inner.start);
    assert(outer.end >= inner.end);
    return new skew.Range(outer.source, inner.end, outer.end);
  };

  skew.Range.equal = function(left, right) {
    return left.source === right.source && left.start === right.start && left.end === right.end;
  };

  skew.LineColumn = function(line, column) {
    var self = this;
    self.line = line;
    self.column = column;
  };

  skew.Source = function(name, contents) {
    var self = this;
    self.name = name;
    self.contents = contents;
    self.lineOffsets = null;
  };

  skew.Source.prototype.lineCount = function() {
    var self = this;
    self.computeLineOffsets();

    // Ignore the line offset at 0
    return in_List.count(self.lineOffsets) - 1;
  };

  skew.Source.prototype.contentsOfLine = function(line) {
    var self = this;
    self.computeLineOffsets();

    if (line < 0 || line >= in_List.count(self.lineOffsets)) {
      return "";
    }

    var start = self.lineOffsets[line];
    var end = line + 1 < in_List.count(self.lineOffsets) ? self.lineOffsets[line + 1] - 1 : in_string.count(self.contents);
    return self.contents.slice(start, end);
  };

  skew.Source.prototype.indexToLineColumn = function(index) {
    var self = this;
    self.computeLineOffsets();

    // Binary search to find the line
    var count = in_List.count(self.lineOffsets);
    var line = 0;

    while (count > 0) {
      var step = ((count) / (2) | 0);
      var i = line + step;

      if (self.lineOffsets[i] <= index) {
        line = i + 1;
        count = count - step - 1;
      }

      else {
        count = step;
      }
    }

    // Use the line to compute the column
    var column = line > 0 ? index - self.lineOffsets[line - 1] : index;
    return new skew.LineColumn(line - 1, column);
  };

  skew.Source.prototype.computeLineOffsets = function() {
    var self = this;
    if (self.lineOffsets === null) {
      self.lineOffsets = [0];

      for (var i = 0, count = in_string.count(self.contents); i < count; i += 1) {
        if (in_string.get1(self.contents, i) === 10) {
          in_List.append1(self.lineOffsets, i + 1);
        }
      }
    }
  };

  skew.Token = function(range, kind) {
    var self = this;
    self.range = range;
    self.kind = kind;
  };

  skew.Token.prototype.firstCodeUnit = function() {
    var self = this;
    if (self.kind === skew.TokenKind.END_OF_FILE) {
      return 0;
    }

    assert(self.range.start < in_string.count(self.range.source.contents));
    return in_string.get1(self.range.source.contents, self.range.start);
  };

  skew.CallInfo = function(symbol) {
    var self = this;
    self.symbol = symbol;
    self.callSites = [];
    self.callContexts = null;
  };

  skew.CallGraph = function(global) {
    var self = this;
    self.callInfo = [];
    self.symbolToInfoIndex = in_IntMap.$new();
    self.visitObject(global);
  };

  skew.CallGraph.prototype.visitObject = function(symbol) {
    var self = this;
    for (var i = 0, list = symbol.objects, count = in_List.count(list); i < count; ++i) {
      var object = list[i];
      self.visitObject(object);
    }

    for (var i1 = 0, list1 = symbol.functions, count1 = in_List.count(list1); i1 < count1; ++i1) {
      var $function = list1[i1];
      self.recordCallSite($function, null, null);

      if ($function.block !== null) {
        self.visitNode($function.block, $function.self);
      }
    }

    for (var i2 = 0, list2 = symbol.variables, count2 = in_List.count(list2); i2 < count2; ++i2) {
      var variable = list2[i2];

      if (variable.value !== null) {
        self.visitNode(variable.value, null);
      }
    }
  };

  skew.CallGraph.prototype.visitNode = function(node, context) {
    var self = this;
    if (node.children !== null) {
      for (var i = 0, list = node.children, count = in_List.count(list); i < count; ++i) {
        var child = list[i];

        if (child !== null) {
          self.visitNode(child, context);
        }
      }
    }

    if (node.kind === skew.NodeKind.CALL && node.symbol !== null) {
      assert(skew.SymbolKind.isFunction(node.symbol.kind));
      self.recordCallSite(node.symbol, node, context);
    }

    else if (node.kind === skew.NodeKind.VAR) {
      var variable = node.symbol.asVariableSymbol();

      if (variable.value !== null) {
        self.visitNode(variable.value, context);
      }
    }

    else if (node.kind === skew.NodeKind.LAMBDA) {
      var $function = node.symbol.asFunctionSymbol();

      if ($function.block !== null) {
        self.visitNode($function.block, context);
      }
    }
  };

  skew.CallGraph.prototype.recordCallSite = function(symbol, node, context) {
    var self = this;
    var index = in_IntMap.get(self.symbolToInfoIndex, symbol.id, -1);
    var info = index < 0 ? new skew.CallInfo(symbol) : self.callInfo[index];

    if (index < 0) {
      self.symbolToInfoIndex[symbol.id] = in_List.count(self.callInfo);
      in_List.append1(self.callInfo, info);
    }

    if (node !== null) {
      if (context !== null) {
        if (info.callContexts === null) {
          // Lazily allocate info.callContexts to avoid unnecessary allocations
          info.callContexts = [];
        }

        while (in_List.count(info.callContexts) < in_List.count(info.callSites)) {
          in_List.append1(info.callContexts, null);
        }

        in_List.append1(info.callContexts, context);
      }

      in_List.append1(info.callSites, node);
    }
  };

  skew.CompilerOptions = function() {
    var self = this;
    self.outputFile = "";
    self.outputDirectory = "";
  };

  skew.CompilerResult = function() {
    var self = this;
    self.cache = new skew.TypeCache();
    self.global = new skew.ObjectSymbol(skew.SymbolKind.OBJECT_GLOBAL, "<global>");
    self.outputs = null;
  };

  skew.merging = {};

  skew.merging.mergeObject = function(log, parent, target, symbol) {
    target.scope = new skew.ObjectScope(parent !== null ? parent.scope : null, target);
    symbol.parent = parent;

    if (symbol.parameters !== null) {
      for (var i = 0, list = symbol.parameters, count = in_List.count(list); i < count; ++i) {
        var parameter = list[i];
        parameter.scope = parent.scope;
        parameter.parent = target;

        // Type parameters cannot merge with any members
        var other = in_StringMap.get(target.members, parameter.name, null);

        if (other !== null) {
          log.semanticErrorDuplicateSymbol(parameter.range, parameter.name, other.range);
          continue;
        }

        target.members[parameter.name] = parameter;
      }
    }

    skew.merging.mergeObjects(log, target, symbol.objects);
    skew.merging.mergeFunctions(log, target, symbol.functions);
    skew.merging.mergeVariables(log, target, symbol.variables);
  };

  skew.merging.mergeObjects = function(log, parent, children) {
    var members = parent.members;
    var n = in_List.count(children);
    var count = 0;

    for (var i = 0, count1 = n; i < count1; i += 1) {
      var child = children[i];
      var other = in_StringMap.get(members, child.name, null);

      // Simple case: no merging
      if (other === null) {
        members[child.name] = child;
        children[count] = child;
        ++count;
        skew.merging.mergeObject(log, parent, child, child);
        continue;
      }

      // Can only merge with another of the same kind or with a namespace
      if (other.kind === skew.SymbolKind.OBJECT_NAMESPACE) {
        other.kind = child.kind;
      }

      else if (child.kind !== skew.SymbolKind.OBJECT_NAMESPACE && child.kind !== other.kind) {
        log.semanticErrorDuplicateSymbol(child.range, child.name, other.range);
        continue;
      }

      // Classes can only have one base type
      var object = other.asObjectSymbol();

      if (child.base !== null && object.base !== null) {
        log.semanticErrorDuplicateBaseType(child.base.range, child.name, object.base.range);
        continue;
      }

      if (child.base !== null) {
        object.base = child.base;
      }

      // Cannot merge two objects that both have type parameters
      if (child.parameters !== null && object.parameters !== null) {
        log.semanticErrorDuplicateTypeParameters(skew.merging.rangeOfParameters(child.parameters), child.name, skew.merging.rangeOfParameters(object.parameters));
        continue;
      }

      // Merge "child" into "other"
      skew.merging.mergeObject(log, parent, object, child);
      object.mergeAnnotationsAndCommentsFrom(child);
      in_List.append2(object.objects, child.objects);
      in_List.append2(object.functions, child.functions);
      in_List.append2(object.variables, child.variables);

      if (child.parameters !== null) {
        object.parameters = child.parameters;
      }
    }

    // Remove merged declarations using O(n), would be O(n^2) if removeAt was used
    while (n > count) {
      in_List.removeLast(children);
      --n;
    }
  };

  skew.merging.mergeFunctions = function(log, parent, children) {
    var members = parent.members;

    for (var i1 = 0, list1 = children, count1 = in_List.count(list1); i1 < count1; ++i1) {
      var child = list1[i1];
      var other = in_StringMap.get(members, child.name, null);
      var scope = new skew.FunctionScope(parent.scope, child);
      child.scope = scope;
      child.parent = parent;

      if (child.parameters !== null) {
        for (var i = 0, list = child.parameters, count = in_List.count(list); i < count; ++i) {
          var parameter = list[i];
          parameter.scope = scope;
          parameter.parent = child;

          // Type parameters cannot merge with other parameters on this function
          var previous = in_StringMap.get(scope.parameters, parameter.name, null);

          if (previous !== null) {
            log.semanticErrorDuplicateSymbol(parameter.range, parameter.name, previous.range);
            continue;
          }

          scope.parameters[parameter.name] = parameter;
        }
      }

      // Simple case: no merging
      if (other === null) {
        members[child.name] = child;
        continue;
      }

      var childKind = skew.merging.overloadedKind(child.kind);
      var otherKind = skew.merging.overloadedKind(other.kind);

      // Merge with another symbol of the same overloaded group type
      if (childKind !== otherKind || !skew.SymbolKind.isOverloadedFunction(childKind)) {
        log.semanticErrorDuplicateSymbol(child.range, child.name, other.range);
        continue;
      }

      // Merge with a group of overloaded functions
      if (skew.SymbolKind.isOverloadedFunction(other.kind)) {
        in_List.append1(other.asOverloadedFunctionSymbol().symbols, child);
        child.overloaded = other.asOverloadedFunctionSymbol();
        continue;
      }

      // Create an overload group
      var overloaded = new skew.OverloadedFunctionSymbol(childKind, child.name, [other.asFunctionSymbol(), child]);
      members[child.name] = overloaded;
      other.asFunctionSymbol().overloaded = overloaded;
      child.overloaded = overloaded;
      overloaded.scope = parent.scope;
      overloaded.parent = parent;
    }
  };

  skew.merging.overloadedKind = function(kind) {
    return kind === skew.SymbolKind.FUNCTION_CONSTRUCTOR || kind === skew.SymbolKind.FUNCTION_GLOBAL ? skew.SymbolKind.OVERLOADED_GLOBAL : kind === skew.SymbolKind.FUNCTION_ANNOTATION ? skew.SymbolKind.OVERLOADED_ANNOTATION : kind === skew.SymbolKind.FUNCTION_INSTANCE ? skew.SymbolKind.OVERLOADED_INSTANCE : kind;
  };

  skew.merging.mergeVariables = function(log, parent, children) {
    var members = parent.members;

    for (var i = 0, list = children, count = in_List.count(list); i < count; ++i) {
      var child = list[i];
      var other = in_StringMap.get(members, child.name, null);
      child.scope = new skew.VariableScope(parent.scope, child);
      child.parent = parent;

      // Variables never merge
      if (other !== null) {
        log.semanticErrorDuplicateSymbol(child.range, child.name, other.range);
        continue;
      }

      members[child.name] = child;
    }
  };

  skew.merging.rangeOfParameters = function(parameters) {
    return skew.Range.span(in_List.first(parameters).range, in_List.last(parameters).range);
  };

  skew.renaming = {};

  skew.renaming.renameObject = function(symbol) {
    for (var i = 0, list = symbol.objects, count1 = in_List.count(list); i < count1; ++i) {
      var object = list[i];
      skew.renaming.renameObject(object);
    }

    for (var i1 = 0, list1 = symbol.functions, count2 = in_List.count(list1); i1 < count2; ++i1) {
      var $function = list1[i1];

      if (!$function.isImportedOrExported() && $function.overridden === null) {
        var scope = $function.scope.parent;
        var count = in_List.count($function.$arguments);

        if ((count === 0 || count === 1 && $function.kind === skew.SymbolKind.FUNCTION_GLOBAL) && $function.name in skew.renaming.unaryPrefixes) {
          $function.name = scope.generateSymbolName(skew.renaming.unaryPrefixes[$function.name]);
        }

        else if ($function.name in skew.renaming.prefixes) {
          $function.name = scope.generateSymbolName(skew.renaming.prefixes[$function.name]);
        }

        else if (skew.renaming.isInvalidIdentifier($function)) {
          $function.name = scope.generateSymbolName("_");
        }

        else if ($function.overloaded !== null && in_List.count($function.overloaded.symbols) > 1) {
          $function.name = scope.generateSymbolName($function.name);
        }
      }
    }
  };

  skew.renaming.useOverriddenNames = function(symbol) {
    for (var i = 0, list = symbol.objects, count = in_List.count(list); i < count; ++i) {
      var object = list[i];
      skew.renaming.useOverriddenNames(object);
    }

    for (var i1 = 0, list1 = symbol.functions, count1 = in_List.count(list1); i1 < count1; ++i1) {
      var $function = list1[i1];

      if ($function.overridden !== null) {
        var overridden = $function.overridden;

        while (overridden.overridden !== null) {
          overridden = overridden.overridden;
        }

        $function.name = overridden.name;
      }
    }
  };

  skew.renaming.isAlpha = function(c) {
    return c >= 97 && c <= 122 || c >= 65 && c <= 90 || c === 95;
  };

  skew.renaming.isNumber = function(c) {
    return c >= 48 && c <= 57;
  };

  skew.renaming.isInvalidIdentifier = function(symbol) {
    for (var i = 0, count = in_string.count(symbol.name); i < count; i += 1) {
      var c = in_string.get1(symbol.name, i);

      if (!skew.renaming.isAlpha(c) && (i === 0 || !skew.renaming.isNumber(c))) {
        return true;
      }
    }

    return false;
  };

  skew.resolving = {};

  skew.resolving.ConversionKind = {
    IMPLICIT: 0, 0: "IMPLICIT",
    EXPLICIT: 1, 1: "EXPLICIT"
  };

  skew.resolving.Resolver = function(cache, log) {
    var self = this;
    self.cache = cache;
    self.log = log;
    self.foreachLoops = [];
  };

  skew.resolving.Resolver.prototype.initializeSymbol = function(symbol) {
    var self = this;
    // The scope should have been set by the merging pass (or by this pass for local variables)
    assert(symbol.scope !== null);

    // Only initialize the symbol once
    if (symbol.state === skew.SymbolState.UNINITIALIZED) {
      symbol.state = skew.SymbolState.INITIALIZING;

      switch (symbol.kind) {
        case skew.SymbolKind.OBJECT_CLASS:
        case skew.SymbolKind.OBJECT_ENUM:
        case skew.SymbolKind.OBJECT_GLOBAL:
        case skew.SymbolKind.OBJECT_INTERFACE:
        case skew.SymbolKind.OBJECT_NAMESPACE: {
          self.initializeObject(symbol.asObjectSymbol());
          break;
        }

        case skew.SymbolKind.FUNCTION_ANNOTATION:
        case skew.SymbolKind.FUNCTION_CONSTRUCTOR:
        case skew.SymbolKind.FUNCTION_GLOBAL:
        case skew.SymbolKind.FUNCTION_INSTANCE:
        case skew.SymbolKind.FUNCTION_LOCAL: {
          self.initializeFunction(symbol.asFunctionSymbol());
          break;
        }

        case skew.SymbolKind.VARIABLE_ENUM:
        case skew.SymbolKind.VARIABLE_GLOBAL:
        case skew.SymbolKind.VARIABLE_INSTANCE:
        case skew.SymbolKind.VARIABLE_LOCAL: {
          self.initializeVariable(symbol.asVariableSymbol());
          break;
        }

        case skew.SymbolKind.PARAMETER_FUNCTION:
        case skew.SymbolKind.PARAMETER_OBJECT: {
          self.initializeParameter(symbol.asParameterSymbol());
          break;
        }

        case skew.SymbolKind.OVERLOADED_ANNOTATION:
        case skew.SymbolKind.OVERLOADED_GLOBAL:
        case skew.SymbolKind.OVERLOADED_INSTANCE: {
          self.initializeOverloadedFunction(symbol.asOverloadedFunctionSymbol());
          break;
        }

        default: {
          assert(false);
          break;
        }
      }

      assert(symbol.resolvedType !== null);
      symbol.state = skew.SymbolState.INITIALIZED;

      if (skew.SymbolKind.isFunction(symbol.kind)) {
        var $function = symbol.asFunctionSymbol();
        var overloaded = $function.overloaded;

        // After initializing a function symbol, ensure the entire overload set is initialized
        if (overloaded !== null && overloaded.state === skew.SymbolState.UNINITIALIZED) {
          self.initializeSymbol(overloaded);
        }

        if (symbol.isEntryPoint()) {
          self.validateEntryPoint($function);
        }
      }
    }

    // Detect cyclic symbol references such as "foo foo;"
    else if (symbol.state === skew.SymbolState.INITIALIZING) {
      self.log.semanticErrorCyclicDeclaration(symbol.range, symbol.name);
      symbol.resolvedType = skew.Type.DYNAMIC;
    }
  };

  skew.resolving.Resolver.prototype.validateEntryPoint = function(symbol) {
    var self = this;
    // Detect duplicate entry points
    if (self.cache.entryPointSymbol !== null) {
      self.log.semanticErrorDuplicateEntryPoint(symbol.range, self.cache.entryPointSymbol.range);
      return;
    }

    self.cache.entryPointSymbol = symbol;

    // Only recognize a few entry point types
    var type = symbol.resolvedType;

    if (type !== skew.Type.DYNAMIC) {
      var argumentTypes = type.argumentTypes;

      // The argument list must be empty or one argument of type "List<string>"
      if (in_List.count(argumentTypes) > 1 || in_List.count(argumentTypes) === 1 && in_List.first(argumentTypes) !== self.cache.createListType(self.cache.stringType)) {
        self.log.semanticErrorInvalidEntryPointArguments(skew.Range.span(in_List.first(symbol.$arguments).range, in_List.last(symbol.$arguments).type.range), symbol.name);
      }

      // The return type must be nothing or "int"
      else if (type.returnType !== null && type.returnType !== self.cache.intType) {
        self.log.semanticErrorInvalidEntryPointReturnType(symbol.returnType.range, symbol.name);
      }
    }
  };

  skew.resolving.Resolver.prototype.resolveAnnotations = function(symbol) {
    var self = this;
    var parent = symbol.parent;
    var annotations = symbol.annotations;

    // The import/export annotations are inherited, except import isn't inherited for implemented functions
    if (parent !== null && (skew.SymbolKind.isVariable(symbol.kind) || skew.SymbolKind.isFunction(symbol.kind))) {
      symbol.flags |= parent.flags & (skew.SymbolKind.isFunction(symbol.kind) && symbol.asFunctionSymbol().block !== null ? skew.Symbol.IS_EXPORTED : skew.Symbol.IS_IMPORTED | skew.Symbol.IS_EXPORTED);
    }

    // Resolve annotations on this symbol after annotation inheritance
    if (annotations !== null) {
      for (var i = 0, list = annotations, count = in_List.count(list); i < count; ++i) {
        var annotation = list[i];
        self.resolveAnnotation(annotation, symbol);
      }
    }
  };

  skew.resolving.Resolver.prototype.resolveParameters = function(parameters) {
    var self = this;
    if (parameters !== null) {
      for (var i = 0, list = parameters, count = in_List.count(list); i < count; ++i) {
        var parameter = list[i];
        self.resolveParameter(parameter);
      }
    }
  };

  skew.resolving.Resolver.prototype.initializeParameter = function(symbol) {
    var self = this;
    if (symbol.resolvedType === null) {
      symbol.resolvedType = new skew.Type(skew.TypeKind.SYMBOL, symbol);
    }

    self.resolveAnnotations(symbol);
  };

  skew.resolving.Resolver.prototype.resolveParameter = function(symbol) {
    var self = this;
    self.initializeSymbol(symbol);
  };

  skew.resolving.Resolver.prototype.initializeObject = function(symbol) {
    var self = this;
    if (symbol.resolvedType === null) {
      symbol.resolvedType = new skew.Type(skew.TypeKind.SYMBOL, symbol);
    }

    self.forbidOverriddenSymbol(symbol);

    // Resolve the base type (only for classes)
    if (symbol.base !== null) {
      self.resolveAsParameterizedType(symbol.base, symbol.scope);
      var baseType = symbol.base.resolvedType;

      if (baseType.kind === skew.TypeKind.SYMBOL && baseType.symbol.kind === skew.SymbolKind.OBJECT_CLASS && !baseType.symbol.isValueType()) {
        symbol.baseClass = baseType.symbol.asObjectSymbol();

        // Don't lose the type parameters from the base type
        symbol.resolvedType.environment = baseType.environment;
      }

      else if (baseType !== skew.Type.DYNAMIC) {
        self.log.semanticErrorInvalidBaseType(symbol.base.range, baseType);
      }
    }

    // Assign values for all enums before they are initialized
    if (symbol.kind === skew.SymbolKind.OBJECT_ENUM) {
      var nextEnumValue = 0;

      for (var i = 0, list = symbol.variables, count = in_List.count(list); i < count; ++i) {
        var variable = list[i];

        if (variable.kind === skew.SymbolKind.VARIABLE_ENUM) {
          variable.enumValue = nextEnumValue;
          ++nextEnumValue;
        }
      }
    }

    self.resolveAnnotations(symbol);

    // Create a default constructor if one doesn't exist
    var $constructor = in_StringMap.get(symbol.members, "new", null);

    if (symbol.kind === skew.SymbolKind.OBJECT_CLASS && !symbol.isImported() && $constructor === null) {
      var baseConstructor = symbol.baseClass !== null ? in_StringMap.get(symbol.baseClass.members, "new", null) : null;

      // Unwrap the overload group if present
      if (baseConstructor !== null && baseConstructor.kind === skew.SymbolKind.OVERLOADED_GLOBAL) {
        var overloaded = baseConstructor.asOverloadedFunctionSymbol();

        for (var i1 = 0, list1 = overloaded.symbols, count1 = in_List.count(list1); i1 < count1; ++i1) {
          var overload = list1[i1];

          if (overload.kind === skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
            if (baseConstructor.kind === skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
              // Signal that there isn't a single base constructor
              baseConstructor = null;
              break;
            }

            baseConstructor = overload;
          }
        }
      }

      // A default constructor can only be created if the base class has a single constructor
      if (symbol.baseClass === null || baseConstructor !== null && baseConstructor.kind === skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
        var generated = new skew.FunctionSymbol(skew.SymbolKind.FUNCTION_CONSTRUCTOR, "new");
        generated.scope = new skew.FunctionScope(symbol.scope, generated);
        generated.flags |= skew.Symbol.IS_AUTOMATICALLY_GENERATED;
        generated.parent = symbol;
        generated.range = symbol.range;
        generated.overridden = baseConstructor !== null ? baseConstructor.asFunctionSymbol() : null;
        in_List.append1(symbol.functions, generated);
        symbol.members[generated.name] = generated;
      }
    }
  };

  skew.resolving.Resolver.prototype.resolveGlobal = function(global) {
    var self = this;
    self.resolveObject(global);
    self.convertForeachLoops();
  };

  // Foreach loops are converted to for loops after everything is resolved
  // because that process needs to generate symbol names and it's much easier
  // to generate non-conflicting symbol names after all local variables have
  // been defined.
  skew.resolving.Resolver.prototype.convertForeachLoops = function() {
    var self = this;
    for (var i = 0, list1 = self.foreachLoops, count1 = in_List.count(list1); i < count1; ++i) {
      var node = list1[i];
      var symbol = node.symbol.asVariableSymbol();

      // Generate names at the function level to avoid conflicts with local scopes
      var scope = symbol.scope.findEnclosingFunctionOrLambda();
      var value = node.foreachValue();
      var block = node.foreachBlock();

      // Handle "for i in 0..10"
      if (value.kind === skew.NodeKind.PAIR) {
        var first = value.firstValue().replaceWithNull();
        var second = value.secondValue().replaceWithNull();
        var setup = [skew.Node.createVar(symbol)];
        var symbolName = skew.Node.createName(symbol.name).withSymbol(symbol).withType(self.cache.intType);
        var update = skew.Node.createBinary(skew.NodeKind.ASSIGN_ADD, symbolName, skew.Node.createInt(1).withType(self.cache.intType));

        // Special-case constant iteration limits to generate simpler code
        if (second.kind === skew.NodeKind.CONSTANT || second.kind === skew.NodeKind.NAME && second.symbol !== null && second.symbol.isConst()) {
          test = skew.Node.createBinary(skew.NodeKind.LESS_THAN, symbolName.clone(), second);
        }

        // Otherwise, save the iteration limit in case it changes during iteration
        else {
          var count = new skew.VariableSymbol(skew.SymbolKind.VARIABLE_LOCAL, scope.generateSymbolName("count"));
          count.resolvedType = self.cache.intType;
          count.value = second;
          count.state = skew.SymbolState.INITIALIZED;
          in_List.append1(setup, skew.Node.createVar(count));
          test = skew.Node.createBinary(skew.NodeKind.LESS_THAN, symbolName.clone(), skew.Node.createName(count.name).withSymbol(count).withType(self.cache.intType));
        }

        // Use a C-style for loop to implement this foreach loop
        symbol.flags &= ~skew.Symbol.IS_CONST;
        symbol.value = first;
        node.replaceWith(skew.Node.createFor(setup, test, update, block.replaceWithNull()).withComments(node.comments));

        // Make sure the new expressions are resolved
        self.resolveNode(test, symbol.scope, null);
        self.resolveNode(update, symbol.scope, null);
      }

      else if (self.cache.isList(value.resolvedType)) {
        // Create the index variable
        var index = new skew.VariableSymbol(skew.SymbolKind.VARIABLE_LOCAL, scope.generateSymbolName("i"));
        index.resolvedType = self.cache.intType;
        index.value = skew.Node.createInt(0).withType(self.cache.intType);
        index.state = skew.SymbolState.INITIALIZED;
        var indexName = skew.Node.createName(index.name).withSymbol(index).withType(index.resolvedType);

        // Create the list variable
        var list = new skew.VariableSymbol(skew.SymbolKind.VARIABLE_LOCAL, scope.generateSymbolName("list"));
        list.resolvedType = value.resolvedType;
        list.value = value.replaceWithNull();
        list.state = skew.SymbolState.INITIALIZED;
        var listName = skew.Node.createName(list.name).withSymbol(list).withType(list.resolvedType);

        // Create the count variable
        var count = new skew.VariableSymbol(skew.SymbolKind.VARIABLE_LOCAL, scope.generateSymbolName("count"));
        count.resolvedType = self.cache.intType;
        count.value = skew.Node.createDot(listName, "count");
        count.state = skew.SymbolState.INITIALIZED;
        var countName = skew.Node.createName(count.name).withSymbol(count).withType(count.resolvedType);

        // Move the loop variable into the loop body
        symbol.value = skew.Node.createIndex(listName.clone(), [indexName]);
        in_List.prepend1(block.children, skew.Node.createVar(symbol));

        // Use a C-style for loop to implement this foreach loop
        var setup = [skew.Node.createVar(index), skew.Node.createVar(list), skew.Node.createVar(count)];
        var test = skew.Node.createBinary(skew.NodeKind.LESS_THAN, indexName.clone(), countName);
        var update = skew.Node.createUnary(skew.NodeKind.INCREMENT, indexName.clone());
        node.replaceWith(skew.Node.createFor(setup, test, update, block.replaceWithNull()).withComments(node.comments));

        // Make sure the new expressions are resolved
        self.resolveNode(symbol.value, symbol.scope, null);
        self.resolveNode(count.value, symbol.scope, null);
        self.resolveNode(test, symbol.scope, null);
        self.resolveNode(update, symbol.scope, null);
      }
    }
  };

  skew.resolving.Resolver.prototype.resolveObject = function(symbol) {
    var self = this;
    self.initializeSymbol(symbol);
    self.resolveParameters(symbol.parameters);

    for (var i = 0, list = symbol.objects, count = in_List.count(list); i < count; ++i) {
      var object = list[i];
      self.resolveObject(object);
    }

    for (var i1 = 0, list1 = symbol.functions, count1 = in_List.count(list1); i1 < count1; ++i1) {
      var $function = list1[i1];
      self.resolveFunction($function);
    }

    for (var i2 = 0, list2 = symbol.variables, count2 = in_List.count(list2); i2 < count2; ++i2) {
      var variable = list2[i2];
      self.resolveVariable(variable);
    }
  };

  skew.resolving.Resolver.prototype.initializeFunction = function(symbol) {
    var self = this;
    if (symbol.resolvedType === null) {
      symbol.resolvedType = new skew.Type(skew.TypeKind.SYMBOL, symbol);
    }

    // Referencing a normal variable instead of a special node kind for "this"
    // makes many things much easier including lambda capture and devirtualization
    if (symbol.kind === skew.SymbolKind.FUNCTION_INSTANCE || symbol.kind === skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
      symbol.self = new skew.VariableSymbol(skew.SymbolKind.VARIABLE_LOCAL, "self");
      symbol.self.flags |= skew.Symbol.IS_CONST;
      symbol.self.resolvedType = self.cache.parameterize(symbol.parent.resolvedType);
      symbol.self.state = skew.SymbolState.INITIALIZED;
    }

    // Lazily-initialize automatically generated functions
    if (symbol.isAutomaticallyGenerated()) {
      assert(symbol.kind === skew.SymbolKind.FUNCTION_CONSTRUCTOR);
      self.automaticallyGenerateConstructor(symbol);
    }

    // Find the overridden function or overloaded function in the base class
    var overridden = self.findOverriddenMember(symbol);

    if (overridden !== null) {
      var symbolKind = skew.merging.overloadedKind(symbol.kind);
      var overriddenKind = skew.merging.overloadedKind(overridden.kind);

      // Make sure the overridden symbol can be merged with this symbol
      if (symbolKind !== overriddenKind) {
        self.log.semanticErrorBadOverride(symbol.range, symbol.name, symbol.parent.asObjectSymbol().base.resolvedType, overridden.range);
        overridden = null;
      }

      // Overriding something makes both symbols overloaded for simplicity
      else {
        skew.resolving.Resolver.ensureFunctionIsOverloaded(symbol);

        if (skew.SymbolKind.isFunction(overridden.kind)) {
          var $function = overridden.asFunctionSymbol();
          skew.resolving.Resolver.ensureFunctionIsOverloaded($function);
          overridden = $function.overloaded;
        }
      }
    }

    self.resolveParameters(symbol.parameters);

    // Resolve the argument variables
    symbol.resolvedType.argumentTypes = [];

    for (var i = 0, list = symbol.$arguments, count1 = in_List.count(list); i < count1; ++i) {
      var argument = list[i];
      argument.scope = symbol.scope;
      self.resolveVariable(argument);
      in_List.append1(symbol.resolvedType.argumentTypes, argument.resolvedType);
    }

    symbol.argumentOnlyType = self.cache.createLambdaType(symbol.resolvedType.argumentTypes, null);

    // Resolve the return type if present (no return type means "void")
    var returnType = null;

    if (symbol.returnType !== null) {
      if (symbol.kind === skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
        self.log.semanticErrorConstructorReturnType(symbol.returnType.range);
      }

      else {
        self.resolveAsParameterizedType(symbol.returnType, symbol.scope);
        returnType = symbol.returnType.resolvedType;
      }
    }

    // Constructors always return the type they construct
    if (symbol.kind === skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
      returnType = self.cache.parameterize(symbol.parent.resolvedType);
    }

    // The "<=>" operator must return a numeric value for comparison with zero
    var count = in_List.count(symbol.$arguments);

    if (symbol.name === "<=>") {
      if (returnType === null || !self.cache.isNumeric(returnType)) {
        self.log.semanticErrorComparisonOperatorNotNumeric(symbol.returnType !== null ? symbol.returnType.range : symbol.range);
        returnType = skew.Type.DYNAMIC;
      }

      else if (count !== 1) {
        self.log.semanticErrorWrongArgumentCount(symbol.range, symbol.name, 1);
      }
    }

    // Setters must have one argument
    else if (symbol.isSetter() && count !== 1) {
      self.log.semanticErrorWrongArgumentCount(symbol.range, symbol.name, 1);
      symbol.flags &= ~skew.Symbol.IS_SETTER;
    }

    // Validate argument count
    else {
      var argumentCount = skew.argumentCountForOperator(symbol.name);
      var hasArgumentCountError = false;

      switch (argumentCount) {
        case skew.ArgumentCount.ZERO:
        case skew.ArgumentCount.ONE: {
          var expected = argumentCount === skew.ArgumentCount.ZERO ? 0 : 1;

          if (count !== expected) {
            self.log.semanticErrorWrongArgumentCount(symbol.range, symbol.name, expected);
            hasArgumentCountError = true;
          }
          break;
        }

        case skew.ArgumentCount.ZERO_OR_ONE:
        case skew.ArgumentCount.ONE_OR_TWO:
        case skew.ArgumentCount.TWO_OR_FEWER: {
          var lower = argumentCount === skew.ArgumentCount.ONE_OR_TWO ? 1 : 0;
          var upper = argumentCount === skew.ArgumentCount.ZERO_OR_ONE ? 1 : 2;

          if (count < lower || count > upper) {
            self.log.semanticErrorWrongArgumentCountRange(symbol.range, symbol.name, lower, upper);
            hasArgumentCountError = true;
          }
          break;
        }

        case skew.ArgumentCount.ONE_OR_MORE:
        case skew.ArgumentCount.TWO_OR_MORE: {
          var expected = argumentCount === skew.ArgumentCount.ONE_OR_MORE ? 1 : 2;

          if (count < expected) {
            self.log.semanticErrorWrongArgumentCountRange(symbol.range, symbol.name, expected, -1);
            hasArgumentCountError = true;
          }
          break;
        }
      }

      // Enforce that the initializer constructor operators take lists of
      // values to avoid confusing error messages inside the code generated
      // for initializer expressions
      if (!hasArgumentCountError && (symbol.name === "{new}" || symbol.name === "[new]")) {
        for (var i1 = 0, list1 = symbol.$arguments, count2 = in_List.count(list1); i1 < count2; ++i1) {
          var argument = list1[i1];

          if (argument.resolvedType !== skew.Type.DYNAMIC && !self.cache.isList(argument.resolvedType)) {
            self.log.semanticErrorExpectedList(argument.range, argument.name, argument.resolvedType);
          }
        }
      }
    }

    // Link this symbol with the overridden symbol if there is one
    var hasOverrideError = false;

    if (overridden !== null) {
      var overloaded = overridden.asOverloadedFunctionSymbol();
      self.initializeSymbol(overloaded);

      for (var i2 = 0, list2 = overloaded.symbols, count3 = in_List.count(list2); i2 < count3; ++i2) {
        var overload = list2[i2];

        if (overload.argumentOnlyType === symbol.argumentOnlyType) {
          symbol.overridden = overload.asFunctionSymbol();

          if (symbol.kind !== skew.SymbolKind.FUNCTION_CONSTRUCTOR && overload.kind !== skew.SymbolKind.FUNCTION_CONSTRUCTOR && symbol.overridden.resolvedType.returnType !== returnType) {
            self.log.semanticErrorBadOverrideReturnType(symbol.range, symbol.name, symbol.parent.asObjectSymbol().base.resolvedType, overload.range);
            hasOverrideError = true;
          }

          break;
        }
      }
    }

    symbol.resolvedType.returnType = returnType;
    self.resolveAnnotations(symbol);

    // Validate use of "def" vs "over"
    if (!hasOverrideError) {
      if (symbol.overridden !== null && symbol.kind === skew.SymbolKind.FUNCTION_INSTANCE) {
        if (!symbol.isOver()) {
          self.log.semanticErrorModifierMissingOverride(symbol.range, symbol.name, symbol.overridden.range);
        }
      }

      else if (symbol.isOver()) {
        self.log.semanticErrorModifierUnusedOverride(symbol.range, symbol.name);
      }
    }
  };

  skew.resolving.Resolver.prototype.automaticallyGenerateConstructor = function(symbol) {
    var self = this;
    var statements = [];

    // Mirror the base constructor's arguments
    if (symbol.overridden !== null) {
      self.initializeSymbol(symbol.overridden);
      var $arguments = symbol.overridden.$arguments;
      var values = [];

      for (var i = 0, list = $arguments, count = in_List.count(list); i < count; ++i) {
        var variable = list[i];
        var argument = new skew.VariableSymbol(skew.SymbolKind.VARIABLE_LOCAL, variable.name);
        argument.resolvedType = variable.resolvedType;
        argument.state = skew.SymbolState.INITIALIZED;
        in_List.append1(symbol.$arguments, argument);
        in_List.append1(values, skew.resolving.Resolver.createSymbolReference(argument));
      }

      in_List.append1(statements, skew.Node.createExpression(in_List.isEmpty(values) ? skew.Node.createSuper() : skew.Node.createCall(skew.Node.createSuper(), values)));
    }

    // Add an argument for every uninitialized variable
    var parent = symbol.parent.asObjectSymbol();
    self.initializeSymbol(parent);

    for (var i1 = 0, list1 = parent.variables, count1 = in_List.count(list1); i1 < count1; ++i1) {
      var variable = list1[i1];

      if (variable.kind === skew.SymbolKind.VARIABLE_INSTANCE) {
        self.initializeSymbol(variable);

        if (variable.value === null) {
          var argument = new skew.VariableSymbol(skew.SymbolKind.VARIABLE_LOCAL, variable.name);
          argument.resolvedType = variable.resolvedType;
          argument.state = skew.SymbolState.INITIALIZED;
          in_List.append1(symbol.$arguments, argument);
          in_List.append1(statements, skew.Node.createExpression(skew.Node.createBinary(skew.NodeKind.ASSIGN, skew.resolving.Resolver.createMemberReference(skew.resolving.Resolver.createSymbolReference(symbol.self), variable), skew.resolving.Resolver.createSymbolReference(argument))));
        }

        else {
          in_List.append1(statements, skew.Node.createExpression(skew.Node.createBinary(skew.NodeKind.ASSIGN, skew.resolving.Resolver.createMemberReference(skew.resolving.Resolver.createSymbolReference(symbol.self), variable), variable.value)));
          variable.value = null;
        }
      }
    }

    // Create the function body
    symbol.block = skew.Node.createBlock(statements);

    // Make constructors without arguments into getters
    if (in_List.isEmpty(symbol.$arguments)) {
      symbol.flags |= skew.Symbol.IS_GETTER;
    }
  };

  skew.resolving.Resolver.prototype.resolveFunction = function(symbol) {
    var self = this;
    self.initializeSymbol(symbol);
    var scope = new skew.LocalScope(symbol.scope, skew.LocalType.NORMAL);

    if (symbol.self !== null) {
      scope.define(symbol.self, self.log);
    }

    // Default values for argument variables aren't resolved with this local
    // scope since they are evaluated at the call site, not inside the
    // function body, and shouldn't have access to other arguments
    for (var i = 0, list = symbol.$arguments, count = in_List.count(list); i < count; ++i) {
      var argument = list[i];
      scope.define(argument, self.log);
    }

    // The function is considered abstract if the body is missing
    var block = symbol.block;

    if (block !== null) {
      // User-specified constructors have variable initializers automatically inserted
      if (symbol.kind === skew.SymbolKind.FUNCTION_CONSTRUCTOR && !symbol.isAutomaticallyGenerated()) {
        var index = 0;

        for (var i1 = 0, list1 = symbol.parent.asObjectSymbol().variables, count1 = in_List.count(list1); i1 < count1; ++i1) {
          var variable = list1[i1];

          if (variable.kind === skew.SymbolKind.VARIABLE_INSTANCE) {
            self.initializeSymbol(variable);

            if (variable.value !== null) {
              block.insertChild(index, skew.Node.createExpression(skew.Node.createBinary(skew.NodeKind.ASSIGN, skew.resolving.Resolver.createMemberReference(skew.resolving.Resolver.createSymbolReference(symbol.self), variable), variable.value)));
              ++index;
              variable.value = null;
            }
          }
        }
      }

      self.resolveNode(block, scope, null);

      // Missing a return statement is an error
      if (symbol.kind !== skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
        var returnType = symbol.resolvedType.returnType;

        if (returnType !== null && returnType !== skew.Type.DYNAMIC && !block.blockAlwaysEndsWithReturn()) {
          self.log.semanticErrorMissingReturn(symbol.range, symbol.name, returnType);
        }
      }
    }
  };

  skew.resolving.Resolver.prototype.initializeVariable = function(symbol) {
    var self = this;
    self.forbidOverriddenSymbol(symbol);

    // Normal variables may omit the initializer if the type is present
    if (symbol.type !== null) {
      self.resolveAsParameterizedType(symbol.type, symbol.scope);
      symbol.resolvedType = symbol.type.resolvedType;

      // Resolve the constant now so initialized constants always have a value
      if (symbol.isConst() && symbol.value !== null) {
        self.resolveAsParameterizedExpressionWithConversion(symbol.value, symbol.scope, symbol.resolvedType);
      }
    }

    // Enums take their type from their parent
    else if (symbol.kind === skew.SymbolKind.VARIABLE_ENUM) {
      symbol.resolvedType = symbol.parent.resolvedType;
    }

    // Implicitly-typed variables take their type from their initializer
    else if (symbol.value !== null) {
      self.resolveAsParameterizedExpression(symbol.value, symbol.scope);
      var type = symbol.value.resolvedType;
      symbol.resolvedType = type;

      // Forbid certain types
      if (!skew.resolving.Resolver.isValidVariableType(type)) {
        self.log.semanticErrorBadVariableType(symbol.range, type);
        symbol.resolvedType = skew.Type.DYNAMIC;
      }
    }

    // Use a different error for constants which must have a type and lambda arguments which cannot have an initializer
    else if (symbol.isConst() || symbol.scope.kind() === skew.ScopeKind.FUNCTION && symbol.scope.asFunctionScope().symbol.kind === skew.SymbolKind.FUNCTION_LOCAL) {
      self.log.semanticErrorVarMissingType(symbol.range, symbol.name);
      symbol.resolvedType = skew.Type.DYNAMIC;
    }

    // Variables without a type are an error
    else {
      self.log.semanticErrorVarMissingValue(symbol.range, symbol.name);
      symbol.resolvedType = skew.Type.DYNAMIC;
    }

    self.resolveAnnotations(symbol);

    // Run post-annotation checks
    if (symbol.resolvedType !== skew.Type.DYNAMIC && symbol.isConst() && !symbol.isImported() && symbol.value === null && symbol.kind !== skew.SymbolKind.VARIABLE_ENUM && symbol.kind !== skew.SymbolKind.VARIABLE_INSTANCE) {
      self.log.semanticErrorConstMissingValue(symbol.range, symbol.name);
    }
  };

  skew.resolving.Resolver.prototype.resolveVariable = function(symbol) {
    var self = this;
    self.initializeSymbol(symbol);

    if (symbol.value !== null) {
      self.resolveAsParameterizedExpressionWithConversion(symbol.value, symbol.scope, symbol.resolvedType);
      self.checkExtraParentheses(symbol.value);
    }
  };

  skew.resolving.Resolver.prototype.initializeOverloadedFunction = function(symbol) {
    var self = this;
    var symbols = symbol.symbols;

    if (symbol.resolvedType === null) {
      symbol.resolvedType = new skew.Type(skew.TypeKind.SYMBOL, symbol);
    }

    // Ensure no two overloads have the same argument types
    var types = [];
    var i = 0;

    while (i < in_List.count(symbols)) {
      var $function = symbols[i];
      self.initializeSymbol($function);
      var index = types.indexOf($function.argumentOnlyType);

      if (index !== -1) {
        var other = symbols[index];

        // Allow duplicate function declarations with the same type to merge
        // as long as there is one declaration that provides an implementation
        if ($function.block !== null === (other.block !== null) || $function.resolvedType.returnType !== other.resolvedType.returnType) {
          self.log.semanticErrorDuplicateOverload($function.range, symbol.name, other.range);
        }

        else if ($function.block !== null) {
          $function.flags |= other.flags & ~skew.Symbol.IS_IMPORTED;
          $function.mergeAnnotationsAndCommentsFrom(other);
          symbols[index] = $function;
        }

        else {
          other.flags |= $function.flags & ~skew.Symbol.IS_IMPORTED;
          other.mergeAnnotationsAndCommentsFrom($function);
        }

        // Remove the symbol after the merge so "types" still matches "symbols"
        in_List.removeAt(symbols, i);
        continue;
      }

      in_List.append1(types, $function.argumentOnlyType);
      ++i;
    }

    // Include non-overridden overloads from the base class
    var overridden = self.findOverriddenMember(symbol);

    if (overridden !== null && skew.SymbolKind.isOverloadedFunction(overridden.kind)) {
      symbol.overridden = overridden.asOverloadedFunctionSymbol();

      for (var i1 = 0, list = symbol.overridden.symbols, count = in_List.count(list); i1 < count; ++i1) {
        var $function = list[i1];

        // Constructors are not inherited
        if ($function.kind !== skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
          self.initializeSymbol($function);
          var index = types.indexOf($function.argumentOnlyType);

          if (index === -1) {
            in_List.append1(symbols, $function);
            in_List.append1(types, $function.argumentOnlyType);
          }
        }
      }
    }
  };

  skew.resolving.Resolver.prototype.resolveNode = function(node, scope, context) {
    var self = this;
    if (node.resolvedType !== null) {
      // Only resolve once
      return;
    }

    node.resolvedType = skew.Type.DYNAMIC;

    switch (node.kind) {
      case skew.NodeKind.BLOCK: {
        self.resolveBlock(node, scope);
        break;
      }

      case skew.NodeKind.PAIR: {
        self.resolvePair(node, scope);
        break;
      }

      case skew.NodeKind.BREAK:
      case skew.NodeKind.CONTINUE: {
        self.resolveJump(node, scope);
        break;
      }

      case skew.NodeKind.EXPRESSION: {
        self.resolveExpression(node, scope);
        break;
      }

      case skew.NodeKind.FOREACH: {
        self.resolveForeach(node, scope);
        break;
      }

      case skew.NodeKind.IF: {
        self.resolveIf(node, scope);
        break;
      }

      case skew.NodeKind.RETURN: {
        self.resolveReturn(node, scope);
        break;
      }

      case skew.NodeKind.SWITCH: {
        self.resolveSwitch(node, scope);
        break;
      }

      case skew.NodeKind.THROW: {
        self.resolveThrow(node, scope);
        break;
      }

      case skew.NodeKind.TRY: {
        self.resolveTry(node, scope);
        break;
      }

      case skew.NodeKind.VAR: {
        self.resolveVar(node, scope);
        break;
      }

      case skew.NodeKind.WHILE: {
        self.resolveWhile(node, scope);
        break;
      }

      case skew.NodeKind.ASSIGN_INDEX: {
        self.resolveIndex(node, scope);
        break;
      }

      case skew.NodeKind.CALL: {
        self.resolveCall(node, scope);
        break;
      }

      case skew.NodeKind.CAST: {
        self.resolveCast(node, scope, context);
        break;
      }

      case skew.NodeKind.CONSTANT: {
        self.resolveConstant(node, scope);
        break;
      }

      case skew.NodeKind.DOT: {
        self.resolveDot(node, scope, context);
        break;
      }

      case skew.NodeKind.DYNAMIC: {
        break;
      }

      case skew.NodeKind.HOOK: {
        self.resolveHook(node, scope, context);
        break;
      }

      case skew.NodeKind.INDEX: {
        self.resolveIndex(node, scope);
        break;
      }

      case skew.NodeKind.INITIALIZER_LIST:
      case skew.NodeKind.INITIALIZER_MAP:
      case skew.NodeKind.INITIALIZER_SET: {
        self.resolveInitializer(node, scope, context);
        break;
      }

      case skew.NodeKind.INTERPOLATE: {
        self.resolveInterpolate(node, scope);
        break;
      }

      case skew.NodeKind.LAMBDA: {
        self.resolveLambda(node, scope, context);
        break;
      }

      case skew.NodeKind.LAMBDA_TYPE: {
        self.resolveLambdaType(node, scope);
        break;
      }

      case skew.NodeKind.NAME: {
        self.resolveName(node, scope);
        break;
      }

      case skew.NodeKind.NULL: {
        node.resolvedType = skew.Type.NULL;
        break;
      }

      case skew.NodeKind.PARAMETERIZE: {
        self.resolveParameterize(node, scope);
        break;
      }

      case skew.NodeKind.SUPER: {
        self.resolveSuper(node, scope);
        break;
      }

      default: {
        if (skew.NodeKind.isUnary(node.kind)) {
          self.resolveUnary(node, scope);
        }

        else if (skew.NodeKind.isBinary(node.kind)) {
          self.resolveBinary(node, scope);
        }

        else {
          assert(false);
        }
        break;
      }
    }

    assert(node.resolvedType !== null);
  };

  skew.resolving.Resolver.prototype.resolveAsParameterizedType = function(node, scope) {
    var self = this;
    assert(skew.NodeKind.isExpression(node.kind));
    self.resolveNode(node, scope, null);
    self.checkIsType(node);
    self.checkIsParameterized(node);
  };

  skew.resolving.Resolver.prototype.resolveAsParameterizedExpression = function(node, scope) {
    var self = this;
    assert(skew.NodeKind.isExpression(node.kind));
    self.resolveNode(node, scope, null);
    self.checkIsInstance(node);
    self.checkIsParameterized(node);
  };

  skew.resolving.Resolver.prototype.resolveAsParameterizedExpressionWithTypeContext = function(node, scope, type) {
    var self = this;
    assert(skew.NodeKind.isExpression(node.kind));
    self.resolveNode(node, scope, type);
    self.checkIsInstance(node);
    self.checkIsParameterized(node);
  };

  skew.resolving.Resolver.prototype.resolveAsParameterizedExpressionWithConversion = function(node, scope, type) {
    var self = this;
    self.resolveAsParameterizedExpressionWithTypeContext(node, scope, type);
    self.checkConversion(node, type, skew.resolving.ConversionKind.IMPLICIT);
  };

  skew.resolving.Resolver.prototype.resolveChildrenAsParameterizedExpressions = function(node, scope) {
    var self = this;
    for (var i = 0, list = node.children, count = in_List.count(list); i < count; ++i) {
      var child = list[i];
      self.resolveAsParameterizedExpression(child, scope);
    }
  };

  skew.resolving.Resolver.prototype.checkExtraParentheses = function(node) {
    var self = this;
    if (node.isInsideParentheses()) {
      self.log.semanticWarningExtraParentheses(node.range);
    }
  };

  skew.resolving.Resolver.prototype.checkUnusedExpression = function(node) {
    var self = this;
    var kind = node.kind;

    if (kind === skew.NodeKind.HOOK) {
      self.checkUnusedExpression(node.hookTrue());
      self.checkUnusedExpression(node.hookFalse());
    }

    else if (node.range !== null && node.resolvedType !== skew.Type.DYNAMIC && kind !== skew.NodeKind.CALL && !skew.NodeKind.isBinaryAssign(kind)) {
      self.log.semanticWarningUnusedExpression(node.range);
    }
  };

  skew.resolving.Resolver.prototype.checkIsInstance = function(node) {
    var self = this;
    if (node.resolvedType !== skew.Type.DYNAMIC && node.isType()) {
      self.log.semanticErrorUnexpectedType(node.range, node.resolvedType);
      node.resolvedType = skew.Type.DYNAMIC;
    }
  };

  skew.resolving.Resolver.prototype.checkIsType = function(node) {
    var self = this;
    if (node.resolvedType !== skew.Type.DYNAMIC && !node.isType()) {
      self.log.semanticErrorUnexpectedExpression(node.range, node.resolvedType);
      node.resolvedType = skew.Type.DYNAMIC;
    }
  };

  skew.resolving.Resolver.prototype.checkIsParameterized = function(node) {
    var self = this;
    if (node.resolvedType.parameters() !== null && !node.resolvedType.isParameterized()) {
      self.log.semanticErrorUnparameterizedType(node.range, node.resolvedType);
      node.resolvedType = skew.Type.DYNAMIC;
    }
  };

  skew.resolving.Resolver.prototype.checkStorage = function(node, scope) {
    var self = this;
    var symbol = node.symbol;

    // Only allow storage to variables
    if (node.kind !== skew.NodeKind.NAME && node.kind !== skew.NodeKind.DOT || symbol !== null && !skew.SymbolKind.isVariable(symbol.kind)) {
      self.log.semanticErrorBadStorage(node.range);
    }

    // Forbid storage to constants
    else if (symbol !== null && symbol.isConst()) {
      var $function = scope.findEnclosingFunction();

      // Allow assignments to constants inside constructors
      if ($function === null || $function.symbol.kind !== skew.SymbolKind.FUNCTION_CONSTRUCTOR || $function.symbol.parent !== symbol.parent || symbol.kind !== skew.SymbolKind.VARIABLE_INSTANCE) {
        self.log.semanticErrorStorageToConstSymbol(node.internalRangeOrRange(), symbol.name);
      }
    }
  };

  skew.resolving.Resolver.prototype.checkAccess = function(node, range, scope) {
    var self = this;
    var symbol = node.symbol;

    if (symbol === null) {
      return;
    }

    // Check access control
    if (symbol.isPrivateOrProtected()) {
      var isPrivate = symbol.isPrivate();

      while (scope !== null) {
        if (scope.kind() === skew.ScopeKind.OBJECT) {
          var object = scope.asObjectScope().symbol;

          if (object === symbol.parent || !isPrivate && object.hasBaseClass(symbol.parent)) {
            return;
          }
        }

        scope = scope.parent;
      }

      self.log.semanticErrorAccessViolation(range, isPrivate ? "@private" : "@protected", symbol.name);
    }

    // Deprecation annotations optionally provide a warning message
    if (symbol.isDeprecated()) {
      for (var i = 0, list = symbol.annotations, count = in_List.count(list); i < count; ++i) {
        var annotation = list[i];

        if (annotation.symbol !== null && annotation.symbol.fullName() === "@deprecated") {
          var value = annotation.annotationValue();

          if (value.kind === skew.NodeKind.CALL) {
            var last = in_List.last(value.children);

            if (last.kind === skew.NodeKind.CONSTANT && last.content.kind() === skew.ContentKind.STRING) {
              self.log.warning(range, last.content.asString());
              return;
            }
          }
        }
      }

      self.log.semanticWarningDeprecatedUsage(range, symbol.name);
    }
  };

  skew.resolving.Resolver.prototype.checkConversion = function(node, to, kind) {
    var self = this;
    var from = node.resolvedType;
    assert(from !== null);
    assert(to !== null);

    // The "dynamic" type is a hole in the type system
    if (from === skew.Type.DYNAMIC || to === skew.Type.DYNAMIC) {
      return;
    }

    // No conversion is needed for identical types
    if (from === to) {
      return;
    }

    // The implicit conversion must be valid
    if (kind === skew.resolving.ConversionKind.IMPLICIT && !self.cache.canImplicitlyConvert(from, to) || kind === skew.resolving.ConversionKind.EXPLICIT && !self.cache.canExplicitlyConvert(from, to)) {
      self.log.semanticErrorIncompatibleTypes(node.range, from, to, self.cache.canExplicitlyConvert(from, to));
      node.resolvedType = skew.Type.DYNAMIC;
      return;
    }

    // Make the implicit conversion explicit for convenience later on
    if (kind === skew.resolving.ConversionKind.IMPLICIT) {
      var value = skew.Node.createNull();
      value.become(node);
      node.become(skew.Node.createCast(value, skew.Node.createType(to)).withType(to).withRange(node.range));
    }
  };

  skew.resolving.Resolver.prototype.resolveAnnotation = function(node, symbol) {
    var self = this;
    var value = node.annotationValue();
    var test = node.annotationTest();
    self.resolveNode(value, symbol.scope, null);

    if (test !== null) {
      self.resolveAsParameterizedExpressionWithConversion(test, symbol.scope, self.cache.boolType);
    }

    // Terminate early when there were errors
    if (value.symbol === null) {
      return;
    }

    // Make sure annotations have the arguments they need
    if (value.kind !== skew.NodeKind.CALL) {
      self.log.semanticErrorArgumentCount(value.range, in_List.count(value.symbol.resolvedType.argumentTypes), 0, value.symbol.name, value.symbol.range);
      return;
    }

    // Apply built-in annotation logic
    var flag = in_StringMap.get(skew.resolving.Resolver.annotationSymbolFlags, value.symbol.fullName(), 0);

    if (flag !== 0) {
      var isValid = true;

      switch (flag) {
        case skew.Symbol.IS_DEPRECATED: {
          break;
        }

        case skew.Symbol.IS_ENTRY_POINT: {
          isValid = symbol.kind === skew.SymbolKind.FUNCTION_GLOBAL;
          break;
        }

        case skew.Symbol.IS_EXPORTED: {
          isValid = !symbol.isImported();
          break;
        }

        case skew.Symbol.IS_IMPORTED: {
          isValid = !symbol.isExported();
          break;
        }

        case skew.Symbol.IS_PREFERRED: {
          isValid = skew.SymbolKind.isFunction(symbol.kind);
          break;
        }

        case skew.Symbol.IS_PRIVATE: {
          isValid = !symbol.isProtected() && symbol.parent !== null && symbol.parent.kind !== skew.SymbolKind.OBJECT_GLOBAL;
          break;
        }

        case skew.Symbol.IS_PROTECTED: {
          isValid = !symbol.isPrivate() && symbol.parent !== null && symbol.parent.kind !== skew.SymbolKind.OBJECT_GLOBAL;
          break;
        }

        case skew.Symbol.IS_RENAMED: {
          break;
        }

        case skew.Symbol.IS_SKIPPED: {
          isValid = skew.SymbolKind.isFunction(symbol.kind) && symbol.resolvedType.returnType === null;
          break;
        }
      }

      if (!isValid) {
        self.log.semanticErrorInvalidAnnotation(value.range, value.symbol.name, symbol.name);
      }

      else if ((symbol.flags & flag) !== 0) {
        self.log.semanticErrorDuplicateAnnotation(value.range, value.symbol.name, symbol.name);
      }

      else {
        symbol.flags |= flag;
      }
    }

    node.symbol = value.symbol;
  };

  skew.resolving.Resolver.prototype.resolveBlock = function(node, scope) {
    var self = this;
    assert(node.kind === skew.NodeKind.BLOCK);
    var children = node.children;
    var n = in_List.count(children);
    var i = 0;

    while (i < n) {
      var child = children[i];

      // There is a well-known ambiguity in languages like JavaScript where
      // a return statement followed by a newline and a value can either be
      // parsed as a single return statement with a value or as two
      // statements, a return statement without a value and an expression
      // statement. Luckily, we're better off than JavaScript since we know
      // the type of the function. Parse a single statement in a non-void
      // function but two statements in a void function.
      if (child.kind === skew.NodeKind.RETURN && i + 1 < n && child.returnValue() === null && children[i + 1].kind === skew.NodeKind.EXPRESSION) {
        var $function = scope.findEnclosingFunctionOrLambda().symbol;

        if ($function.kind !== skew.SymbolKind.FUNCTION_CONSTRUCTOR && $function.resolvedType.returnType !== null) {
          child.replaceChild(0, node.removeChildAtIndex(i + 1).expressionValue().replaceWithNull());
          --n;
        }
      }

      self.resolveNode(child, scope, null);
      ++i;
    }
  };

  skew.resolving.Resolver.prototype.resolvePair = function(node, scope) {
    var self = this;
    self.resolveAsParameterizedExpression(node.firstValue(), scope);
    self.resolveAsParameterizedExpression(node.secondValue(), scope);
  };

  skew.resolving.Resolver.prototype.resolveJump = function(node, scope) {
    var self = this;
    if (scope.findEnclosingLoop() === null) {
      self.log.semanticErrorBadJump(node.range, node.kind === skew.NodeKind.BREAK ? "break" : "continue");
    }
  };

  skew.resolving.Resolver.prototype.resolveExpression = function(node, scope) {
    var self = this;
    var value = node.expressionValue();
    self.resolveAsParameterizedExpression(value, scope);
    self.checkExtraParentheses(value);
    self.checkUnusedExpression(value);
  };

  skew.resolving.Resolver.prototype.resolveForeach = function(node, scope) {
    var self = this;
    var type = skew.Type.DYNAMIC;
    scope = new skew.LocalScope(scope, skew.LocalType.LOOP);
    var value = node.foreachValue();
    self.resolveAsParameterizedExpression(value, scope);
    self.checkExtraParentheses(value);

    // Support "for i in 0..10"
    if (value.kind === skew.NodeKind.PAIR) {
      var first = value.firstValue();
      var second = value.secondValue();
      type = self.cache.intType;
      self.checkConversion(first, self.cache.intType, skew.resolving.ConversionKind.IMPLICIT);
      self.checkConversion(second, self.cache.intType, skew.resolving.ConversionKind.IMPLICIT);

      // The ".." syntax only counts up, unlike CoffeeScript
      if (first.kind === skew.NodeKind.CONSTANT && first.content.kind() === skew.ContentKind.INT && second.kind === skew.NodeKind.CONSTANT && second.content.kind() === skew.ContentKind.INT && first.content.asInt() >= second.content.asInt()) {
        self.log.semanticWarningEmptyRange(value.range);
      }
    }

    // Support "for i in [1, 2, 3]"
    else if (self.cache.isList(value.resolvedType)) {
      type = value.resolvedType.substitutions[0];
    }

    // Anything else is an error
    else if (value.resolvedType !== skew.Type.DYNAMIC) {
      self.log.semanticErrorBadForValue(value.range, value.resolvedType);
    }

    // Special-case symbol initialization with the type
    var symbol = node.symbol.asVariableSymbol();
    scope.asLocalScope().define(symbol, self.log);
    symbol.resolvedType = type;
    symbol.flags |= skew.Symbol.IS_CONST;
    symbol.state = skew.SymbolState.INITIALIZED;
    self.resolveBlock(node.foreachBlock(), scope);

    // Collect foreach loops and convert them in another pass
    in_List.append1(self.foreachLoops, node);
  };

  skew.resolving.Resolver.prototype.resolveIf = function(node, scope) {
    var self = this;
    var test = node.ifTest();
    var ifFalse = node.ifFalse();
    self.resolveAsParameterizedExpressionWithConversion(test, scope, self.cache.boolType);
    self.checkExtraParentheses(test);
    self.resolveBlock(node.ifTrue(), new skew.LocalScope(scope, skew.LocalType.NORMAL));

    if (ifFalse !== null) {
      self.resolveBlock(ifFalse, new skew.LocalScope(scope, skew.LocalType.NORMAL));
    }
  };

  skew.resolving.Resolver.prototype.resolveReturn = function(node, scope) {
    var self = this;
    var value = node.returnValue();
    var $function = scope.findEnclosingFunctionOrLambda().symbol;
    var returnType = $function.kind !== skew.SymbolKind.FUNCTION_CONSTRUCTOR ? $function.resolvedType.returnType : null;

    // Check for a returned value
    if (value === null) {
      if (returnType !== null) {
        self.log.semanticErrorExpectedReturnValue(node.range, returnType);
      }

      return;
    }

    // Check the type of the returned value
    if (returnType !== null) {
      self.resolveAsParameterizedExpressionWithConversion(value, scope, returnType);
      return;
    }

    // If there's no return type, still check for other errors
    self.resolveAsParameterizedExpression(value, scope);
    self.checkExtraParentheses(value);

    // Lambdas without a return type or an explicit "return" statement get special treatment
    if (!node.isImplicitReturn()) {
      self.log.semanticErrorUnexpectedReturnValue(value.range);
      return;
    }

    // Check for a return value of type "void"
    if (!$function.shouldInferReturnType() || value.kind === skew.NodeKind.CALL && value.symbol !== null && value.symbol.resolvedType.returnType === null) {
      self.checkUnusedExpression(value);
      node.kind = skew.NodeKind.EXPRESSION;
      return;
    }

    // Check for an invalid return type
    var type = value.resolvedType;

    if (!skew.resolving.Resolver.isValidVariableType(type)) {
      self.log.semanticErrorBadReturnType(value.range, type);
      node.kind = skew.NodeKind.EXPRESSION;
      return;
    }

    // Mutate the return type to the type from the returned value
    $function.returnType = skew.Node.createType(type);
  };

  skew.resolving.Resolver.prototype.resolveSwitch = function(node, scope) {
    var self = this;
    var value = node.switchValue();
    var cases = node.children;
    self.resolveAsParameterizedExpression(value, scope);
    self.checkExtraParentheses(value);

    for (var i = 1, count1 = in_List.count(cases); i < count1; i += 1) {
      var child = cases[i];
      var values = child.children;

      for (var j = 1, count = in_List.count(values); j < count; j += 1) {
        var caseValue = values[j];
        self.resolveAsParameterizedExpressionWithConversion(caseValue, scope, value.resolvedType);
        self.checkExtraParentheses(caseValue);
      }

      self.resolveBlock(child.caseBlock(), new skew.LocalScope(scope, skew.LocalType.NORMAL));
    }
  };

  skew.resolving.Resolver.prototype.resolveThrow = function(node, scope) {
    var self = this;
    var value = node.throwValue();
    self.resolveAsParameterizedExpression(value, scope);
    self.checkExtraParentheses(value);
  };

  skew.resolving.Resolver.prototype.resolveVar = function(node, scope) {
    var self = this;
    var symbol = node.symbol.asVariableSymbol();
    scope.asLocalScope().define(symbol, self.log);
    self.resolveVariable(symbol);
  };

  skew.resolving.Resolver.prototype.resolveTry = function(node, scope) {
    var self = this;
    var children = node.children;
    var finallyBlock = node.finallyBlock();
    self.resolveBlock(node.tryBlock(), new skew.LocalScope(scope, skew.LocalType.NORMAL));

    // Bare try statements catch all thrown values
    if (in_List.count(children) === 2 && finallyBlock === null) {
      node.insertChild(1, skew.Node.createCatch(null, skew.Node.createBlock([])));
    }

    for (var i = 1, count = in_List.count(children) - 1; i < count; i += 1) {
      var child = children[i];
      var childScope = new skew.LocalScope(scope, skew.LocalType.NORMAL);

      if (child.symbol !== null) {
        var symbol = child.symbol.asVariableSymbol();
        scope.asLocalScope().define(symbol, self.log);
        self.resolveVariable(symbol);
      }

      self.resolveBlock(child.catchBlock(), childScope);
    }

    if (finallyBlock !== null) {
      self.resolveBlock(finallyBlock, new skew.LocalScope(scope, skew.LocalType.NORMAL));
    }
  };

  skew.resolving.Resolver.prototype.resolveWhile = function(node, scope) {
    var self = this;
    var test = node.whileTest();
    self.resolveAsParameterizedExpressionWithConversion(test, scope, self.cache.boolType);
    self.checkExtraParentheses(test);
    self.resolveBlock(node.whileBlock(), new skew.LocalScope(scope, skew.LocalType.LOOP));
  };

  skew.resolving.Resolver.prototype.resolveCall = function(node, scope) {
    var self = this;
    var value = node.callValue();
    self.resolveAsParameterizedExpression(value, scope);
    var type = value.resolvedType;

    switch (type.kind) {
      case skew.TypeKind.SYMBOL: {
        if (self.resolveSymbolCall(node, scope, type)) {
          return;
        }
        break;
      }

      case skew.TypeKind.LAMBDA: {
        if (self.resolveFunctionCall(node, scope, type)) {
          return;
        }
        break;
      }

      default: {
        if (type !== skew.Type.DYNAMIC) {
          self.log.semanticErrorInvalidCall(node.internalRangeOrRange(), value.resolvedType);
        }
        break;
      }
    }

    // If there was an error, resolve the arguments to check for further
    // errors but use a dynamic type context to avoid introducing errors
    for (var i = 1, count = in_List.count(node.children); i < count; i += 1) {
      self.resolveAsParameterizedExpressionWithConversion(node.children[i], scope, skew.Type.DYNAMIC);
    }
  };

  skew.resolving.Resolver.prototype.resolveSymbolCall = function(node, scope, type) {
    var self = this;
    var symbol = type.symbol;

    // Getters are called implicitly, so explicitly calling one is an error.
    // This error prevents a getter returning a lambda which is then called,
    // but that's really strange and I think this error is more useful.
    if (symbol.isGetter() && skew.resolving.Resolver.isCallValue(node)) {
      self.log.semanticErrorGetterCalledTwice(node.parent.internalRangeOrRange(), symbol.name, symbol.range);
      return false;
    }

    // Check for calling a function directly
    if (skew.SymbolKind.isFunction(symbol.kind)) {
      return self.resolveFunctionCall(node, scope, type);
    }

    // Check for calling a set of functions, must not be ambiguous
    if (skew.SymbolKind.isOverloadedFunction(symbol.kind)) {
      return self.resolveOverloadedFunctionCall(node, scope, type);
    }

    // Can't call other symbols
    self.log.semanticErrorInvalidCall(node.internalRangeOrRange(), node.callValue().resolvedType);
    return false;
  };

  skew.resolving.Resolver.prototype.resolveFunctionCall = function(node, scope, type) {
    var self = this;
    var $function = type.symbol !== null ? type.symbol.asFunctionSymbol() : null;
    var expected = in_List.count(type.argumentTypes);
    var count = in_List.count(node.children) - 1;
    node.symbol = $function;

    // Use the return type even if there were errors
    if (type.returnType !== null) {
      node.resolvedType = type.returnType;
    }

    // There is no "void" type, so make sure this return value isn't used
    else if (skew.resolving.Resolver.isVoidExpressionUsed(node)) {
      if ($function !== null) {
        self.log.semanticErrorUseOfVoidFunction(node.range, $function.name, $function.range);
      }

      else {
        self.log.semanticErrorUseOfVoidLambda(node.range);
      }
    }

    // Check argument count
    if (expected !== count) {
      self.log.semanticErrorArgumentCount(node.internalRangeOrRange(), expected, count, $function !== null ? $function.name : "", $function !== null ? $function.range : null);
      return false;
    }

    // Check argument types
    for (var i = 0, count1 = count; i < count1; i += 1) {
      self.resolveAsParameterizedExpressionWithConversion(node.children[i + 1], scope, type.argumentTypes[i]);
    }

    // Replace overloaded symbols with the chosen overload
    var callValue = node.children[0];

    if ($function !== null && $function.overloaded !== null && callValue.symbol === $function.overloaded) {
      callValue.symbol = $function;
    }

    return true;
  };

  skew.resolving.Resolver.prototype.resolveOverloadedFunction = function(range, children, scope, symbolType) {
    var self = this;
    var overloaded = symbolType.symbol.asOverloadedFunctionSymbol();
    var count = in_List.count(children) - 1;
    var candidates = [];

    // Filter by argument length and substitute using the current type environment
    for (var i1 = 0, list = overloaded.symbols, count1 = in_List.count(list); i1 < count1; ++i1) {
      var symbol = list[i1];

      if (in_List.count(symbol.$arguments) === count || in_List.count(overloaded.symbols) === 1) {
        in_List.append1(candidates, self.cache.substitute(symbol.resolvedType, symbolType.environment));
      }
    }

    // Check for matches
    if (in_List.isEmpty(candidates)) {
      self.log.semanticErrorNoMatchingOverload(range, overloaded.name, count, null);
      return null;
    }

    // Check for an unambiguous match
    if (in_List.count(candidates) === 1) {
      return candidates[0];
    }

    // First filter by syntactic structure impossibilities. This helps break
    // the chicken-and-egg problem of needing to resolve argument types to
    // get a match and needing a match to resolve argument types. For example,
    // a list literal needs type context to resolve correctly.
    var index = 0;

    while (index < in_List.count(candidates)) {
      var argumentTypes = candidates[index].argumentTypes;

      for (var i = 0, count2 = count; i < count2; i += 1) {
        var kind = children[i + 1].kind;
        var type = argumentTypes[i];

        if (kind === skew.NodeKind.NULL && !type.isReference() || kind === skew.NodeKind.INITIALIZER_LIST && self.findMember(type, "[new]") === null && self.findMember(type, "[...]") === null || (kind === skew.NodeKind.INITIALIZER_SET || kind === skew.NodeKind.INITIALIZER_MAP) && self.findMember(type, "{new}") === null && self.findMember(type, "{...}") === null) {
          in_List.removeAt(candidates, index);
          --index;
          break;
        }
      }

      ++index;
    }

    // Check for an unambiguous match
    if (in_List.count(candidates) === 1) {
      return candidates[0];
    }

    // If that still didn't work, resolve the arguments without type context
    for (var i = 0, count3 = count; i < count3; i += 1) {
      self.resolveAsParameterizedExpression(children[i + 1], scope);
    }

    // Try again, this time discarding all implicit conversion failures
    index = 0;

    while (index < in_List.count(candidates)) {
      var argumentTypes = candidates[index].argumentTypes;

      for (var i = 0, count4 = count; i < count4; i += 1) {
        if (!self.cache.canImplicitlyConvert(children[i + 1].resolvedType, argumentTypes[i])) {
          in_List.removeAt(candidates, index);
          --index;
          break;
        }
      }

      ++index;
    }

    // Check for an unambiguous match
    if (in_List.count(candidates) === 1) {
      return candidates[0];
    }

    // Extract argument types for an error if there is one
    var childTypes = [];

    for (var i = 0, count5 = count; i < count5; i += 1) {
      in_List.append1(childTypes, children[i + 1].resolvedType);
    }

    // Give up without a match
    if (in_List.isEmpty(candidates)) {
      self.log.semanticErrorNoMatchingOverload(range, overloaded.name, count, childTypes);
      return null;
    }

    // If that still didn't work, try type equality
    for (var i2 = 0, list1 = candidates, count7 = in_List.count(list1); i2 < count7; ++i2) {
      var type = list1[i2];
      var isMatch = true;

      for (var i = 0, count6 = count; i < count6; i += 1) {
        if (children[i + 1].resolvedType !== type.argumentTypes[i]) {
          isMatch = false;
          break;
        }
      }

      if (isMatch) {
        return type;
      }
    }

    // If that still didn't work, try picking the preferred overload
    var firstPreferred = null;
    var secondPreferred = null;

    for (var i3 = 0, list2 = candidates, count8 = in_List.count(list2); i3 < count8; ++i3) {
      var type = list2[i3];

      if (type.symbol.isPreferred()) {
        secondPreferred = firstPreferred;
        firstPreferred = type;
      }
    }

    // Check for a single preferred overload
    if (firstPreferred !== null && secondPreferred === null) {
      return firstPreferred;
    }

    // Give up since the overload is ambiguous
    self.log.semanticErrorAmbiguousOverload(range, overloaded.name, count, childTypes);
    return null;
  };

  skew.resolving.Resolver.prototype.resolveOverloadedFunctionCall = function(node, scope, type) {
    var self = this;
    var match = self.resolveOverloadedFunction(node.callValue().range, node.children, scope, type);

    if (match !== null && self.resolveFunctionCall(node, scope, match)) {
      self.checkAccess(node, node.callValue().internalRangeOrRange(), scope);
      return true;
    }

    return false;
  };

  skew.resolving.Resolver.prototype.resolveCast = function(node, scope, context) {
    var self = this;
    var value = node.castValue();
    var type = node.castType();
    self.resolveAsParameterizedType(type, scope);
    self.resolveAsParameterizedExpressionWithTypeContext(value, scope, type.resolvedType);
    self.checkConversion(value, type.resolvedType, skew.resolving.ConversionKind.EXPLICIT);
    node.resolvedType = type.resolvedType;

    // Warn about unnecessary casts
    if (type.resolvedType !== skew.Type.DYNAMIC && (value.resolvedType === type.resolvedType || context === type.resolvedType && self.cache.canImplicitlyConvert(value.resolvedType, type.resolvedType))) {
      self.log.semanticWarningExtraCast(skew.Range.span(node.internalRangeOrRange(), type.range), value.resolvedType, type.resolvedType);
    }
  };

  skew.resolving.Resolver.prototype.resolveConstant = function(node, scope) {
    var self = this;
    switch (node.content.kind()) {
      case skew.ContentKind.BOOL: {
        node.resolvedType = self.cache.boolType;
        break;
      }

      case skew.ContentKind.DOUBLE: {
        node.resolvedType = self.cache.doubleType;
        break;
      }

      case skew.ContentKind.INT: {
        node.resolvedType = self.cache.intType;
        break;
      }

      case skew.ContentKind.STRING: {
        node.resolvedType = self.cache.stringType;
        break;
      }

      default: {
        assert(false);
        break;
      }
    }
  };

  skew.resolving.Resolver.prototype.findOverriddenMember = function(symbol) {
    var self = this;
    if (symbol.parent !== null && symbol.parent.kind === skew.SymbolKind.OBJECT_CLASS) {
      var object = symbol.parent.asObjectSymbol();

      if (object.baseClass !== null) {
        return self.findMember(object.baseClass.resolvedType, symbol.name);
      }
    }

    return null;
  };

  skew.resolving.Resolver.prototype.forbidOverriddenSymbol = function(symbol) {
    var self = this;
    var overridden = self.findOverriddenMember(symbol);

    if (overridden !== null) {
      self.log.semanticErrorBadOverride(symbol.range, symbol.name, symbol.parent.asObjectSymbol().base.resolvedType, overridden.range);
    }
  };

  skew.resolving.Resolver.prototype.findMember = function(type, name) {
    var self = this;
    var check = type;

    while (check !== null) {
      if (check.kind === skew.TypeKind.SYMBOL) {
        var symbol = check.symbol;

        if (skew.SymbolKind.isObject(symbol.kind)) {
          var member = in_StringMap.get(symbol.asObjectSymbol().members, name, null);

          if (member !== null) {
            self.initializeSymbol(member);
            return member;
          }
        }
      }

      check = check.baseClass();
    }

    return null;
  };

  skew.resolving.Resolver.prototype.resolveDot = function(node, scope, context) {
    var self = this;
    var target = node.dotTarget();
    var name = node.asString();

    // Infer the target from the type context if it's omitted
    if (target === null) {
      if (context === null) {
        self.log.semanticErrorMissingDotContext(node.range, name);
        return;
      }

      target = skew.Node.createType(context);
      node.replaceChild(0, target);
    }

    else {
      self.resolveNode(target, scope, null);
    }

    // Search for a setter first, then search for a normal member
    var symbol = null;

    if (skew.resolving.Resolver.shouldCheckForSetter(node)) {
      symbol = self.findMember(target.resolvedType, name + "=");
    }

    if (symbol === null) {
      symbol = self.findMember(target.resolvedType, name);

      if (symbol === null) {
        if (target.resolvedType !== skew.Type.DYNAMIC) {
          self.log.semanticErrorUnknownMemberSymbol(node.internalRangeOrRange(), name, target.resolvedType);
        }

        if (target.kind === skew.NodeKind.DYNAMIC) {
          node.kind = skew.NodeKind.NAME;
          node.removeChildren();
        }

        return;
      }
    }

    // Forbid referencing a base class global or constructor function from a derived class
    if (skew.resolving.Resolver.isBaseGlobalReference(target.resolvedType.symbol, symbol)) {
      self.log.semanticErrorUnknownMemberSymbol(node.internalRangeOrRange(), name, target.resolvedType);
      return;
    }

    var isType = target.isType();
    var needsType = !skew.SymbolKind.isOnInstances(symbol.kind);

    // Make sure the global/instance context matches the intended usage
    if (isType) {
      if (!needsType) {
        self.log.semanticErrorMemberUnexpectedInstance(node.internalRangeOrRange(), symbol.name);
      }

      else if (skew.SymbolKind.isFunctionOrOverloadedFunction(symbol.kind)) {
        self.checkIsParameterized(target);
      }

      else if (target.resolvedType.isParameterized()) {
        self.log.semanticErrorParameterizedType(target.range, target.resolvedType);
      }
    }

    else if (needsType) {
      self.log.semanticErrorMemberUnexpectedGlobal(node.internalRangeOrRange(), symbol.name);
    }

    // Always access referenced globals directly
    if (skew.SymbolKind.isGlobalReference(symbol.kind)) {
      node.kind = skew.NodeKind.NAME;
      node.removeChildren();
    }

    node.symbol = symbol;
    node.resolvedType = self.cache.substitute(symbol.resolvedType, target.resolvedType.environment);
    self.automaticallyCallGetter(node, scope);
  };

  skew.resolving.Resolver.prototype.resolveHook = function(node, scope, context) {
    var self = this;
    self.resolveAsParameterizedExpressionWithConversion(node.hookTest(), scope, self.cache.boolType);
    var trueValue = node.hookTrue();
    var falseValue = node.hookFalse();

    // Use the type context from the parent
    if (context !== null) {
      self.resolveAsParameterizedExpressionWithConversion(trueValue, scope, context);
      self.resolveAsParameterizedExpressionWithConversion(falseValue, scope, context);
      node.resolvedType = context;
    }

    // Find the common type from both branches
    else {
      self.resolveAsParameterizedExpression(trueValue, scope);
      self.resolveAsParameterizedExpression(falseValue, scope);
      var common = self.cache.commonImplicitType(trueValue.resolvedType, falseValue.resolvedType);

      if (common !== null) {
        node.resolvedType = common;
      }

      else {
        self.log.semanticErrorNoCommonType(skew.Range.span(trueValue.range, falseValue.range), trueValue.resolvedType, falseValue.resolvedType);
      }
    }
  };

  skew.resolving.Resolver.prototype.resolveInitializer = function(node, scope, context) {
    var self = this;
    var count = in_List.count(node.children);

    // Make sure to resolve the children even if the initializer is invalid
    if (context !== null) {
      if (context === skew.Type.DYNAMIC || !self.resolveInitializerWithContext(node, scope, context)) {
        self.resolveChildrenAsParameterizedExpressions(node, scope);
      }

      return;
    }

    // First pass: only children with type context, second pass: all children
    for (var pass = 0; pass < 2; pass += 1) {
      switch (node.kind) {
        case skew.NodeKind.INITIALIZER_LIST: {
          var type = null;

          // Resolve all children for this pass
          for (var i = 0, list = node.children, count1 = in_List.count(list); i < count1; ++i) {
            var child = list[i];

            if (pass !== 0 || !skew.resolving.Resolver.needsTypeContext(child)) {
              self.resolveAsParameterizedExpression(child, scope);
              type = self.mergeCommonType(type, child);
            }
          }

          // Resolve remaining children using the type context if valid
          if (type !== null && skew.resolving.Resolver.isValidVariableType(type)) {
            self.resolveInitializerWithContext(node, scope, self.cache.createListType(type));
            return;
          }
          break;
        }

        case skew.NodeKind.INITIALIZER_MAP: {
          var keyType = null;
          var valueType = null;

          // Resolve all children for this pass
          for (var i1 = 0, list1 = node.children, count2 = in_List.count(list1); i1 < count2; ++i1) {
            var child = list1[i1];
            var key = child.firstValue();
            var value = child.secondValue();

            if (pass !== 0 || !skew.resolving.Resolver.needsTypeContext(key)) {
              self.resolveAsParameterizedExpression(key, scope);
              keyType = self.mergeCommonType(keyType, key);
            }

            if (pass !== 0 || !skew.resolving.Resolver.needsTypeContext(value)) {
              self.resolveAsParameterizedExpression(value, scope);
              valueType = self.mergeCommonType(valueType, value);
            }
          }

          // Resolve remaining children using the type context if valid
          if (keyType !== null && valueType !== null && skew.resolving.Resolver.isValidVariableType(keyType) && skew.resolving.Resolver.isValidVariableType(valueType)) {
            if (keyType === self.cache.intType) {
              self.resolveInitializerWithContext(node, scope, self.cache.createIntMapType(valueType));
              return;
            }

            if (keyType === self.cache.stringType) {
              self.resolveInitializerWithContext(node, scope, self.cache.createStringMapType(valueType));
              return;
            }
          }
          break;
        }
      }
    }

    self.log.semanticErrorInitializerTypeInferenceFailed(node.range);
  };

  skew.resolving.Resolver.prototype.isToStringMember = function(symbol) {
    var self = this;
    return symbol.kind === skew.SymbolKind.FUNCTION_INSTANCE && in_List.isEmpty(symbol.resolvedType.argumentTypes) && symbol.resolvedType.returnType === self.cache.stringType;
  };

  skew.resolving.Resolver.prototype.hasToStringMember = function(type) {
    var self = this;
    var member = self.findMember(type, "toString");

    if (member !== null) {
      if (self.isToStringMember(member)) {
        return true;
      }

      if (member.kind === skew.SymbolKind.OVERLOADED_INSTANCE) {
        for (var i = 0, list = member.asOverloadedFunctionSymbol().symbols, count = in_List.count(list); i < count; ++i) {
          var symbol = list[i];

          if (self.isToStringMember(symbol)) {
            return true;
          }
        }
      }
    }

    return false;
  };

  skew.resolving.Resolver.prototype.wrapWithToString = function(node, scope) {
    var self = this;
    self.resolveAsParameterizedExpression(node, scope);

    if (node.resolvedType !== skew.Type.DYNAMIC && self.hasToStringMember(node.resolvedType)) {
      var parent = node.parent;
      var index = node.indexInParent();
      node = skew.Node.createDot(node.replaceWithNull(), "toString").withRange(node.range);
      parent.replaceChild(index, node);
    }

    self.resolveAsParameterizedExpressionWithConversion(node, scope, self.cache.stringType);
  };

  skew.resolving.Resolver.prototype.resolveInterpolate = function(node, scope) {
    var self = this;
    self.wrapWithToString(node.interpolateLeft(), scope);
    self.wrapWithToString(node.interpolateRight(), scope);
    node.resolvedType = self.cache.stringType;
    node.kind = skew.NodeKind.ADD;
  };

  skew.resolving.Resolver.prototype.shouldUseMapConstructor = function(symbol) {
    var self = this;
    if (skew.SymbolKind.isFunction(symbol.kind)) {
      return in_List.count(symbol.asFunctionSymbol().$arguments) === 2;
    }

    for (var i = 0, list = symbol.asOverloadedFunctionSymbol().symbols, count = in_List.count(list); i < count; ++i) {
      var overload = list[i];

      if (in_List.count(overload.$arguments) === 2) {
        return true;
      }
    }

    return false;
  };

  skew.resolving.Resolver.prototype.resolveInitializerWithContext = function(node, scope, context) {
    var self = this;
    var isList = node.kind === skew.NodeKind.INITIALIZER_LIST;
    var create = self.findMember(context, isList ? "[new]" : "{new}");
    var add = self.findMember(context, isList ? "[...]" : "{...}");

    // Special-case imported literals to prevent an infinite loop for list literals
    if (add !== null && add.isImported()) {
      var $function = add.asFunctionSymbol();

      if (in_List.count($function.$arguments) === (isList ? 1 : 2)) {
        var functionType = self.cache.substitute($function.resolvedType, context.environment);

        for (var i = 0, list = node.children, count = in_List.count(list); i < count; ++i) {
          var child = list[i];

          if (child.kind === skew.NodeKind.PAIR) {
            self.resolveAsParameterizedExpressionWithConversion(child.firstValue(), scope, functionType.argumentTypes[0]);
            self.resolveAsParameterizedExpressionWithConversion(child.secondValue(), scope, functionType.argumentTypes[1]);
          }

          else {
            self.resolveAsParameterizedExpressionWithConversion(child, scope, functionType.argumentTypes[0]);
          }
        }

        node.resolvedType = context;
        return true;
      }
    }

    // Use simple call chaining when there's an add operator present
    if (add !== null) {
      var chain = skew.Node.createDot(skew.Node.createType(context).withRange(node.range), create !== null ? create.name : "new").withRange(node.range);

      for (var i1 = 0, list1 = node.children, count1 = in_List.count(list1); i1 < count1; ++i1) {
        var child = list1[i1];
        var dot = skew.Node.createDot(chain, add.name).withRange(child.range);
        var $arguments = child.kind === skew.NodeKind.PAIR ? [child.firstValue().replaceWithNull(), child.secondValue().replaceWithNull()] : [child.replaceWithNull()];
        chain = skew.Node.createCall(dot, $arguments).withRange(child.range);
      }

      node.become(chain);
      self.resolveAsParameterizedExpressionWithConversion(node, scope, context);
      return true;
    }

    // Make sure there's a constructor to call
    if (create === null) {
      self.log.semanticErrorInitializerTypeInferenceFailed(node.range);
      return false;
    }

    var dot = skew.Node.createDot(skew.Node.createType(context).withRange(node.range), create.name).withRange(node.range);

    // The literal "{}" is ambiguous and may be a map or a set
    if (in_List.isEmpty(node.children) && !isList && self.shouldUseMapConstructor(create)) {
      node.become(skew.Node.createCall(dot, [skew.Node.createList([]).withRange(node.range), skew.Node.createList([]).withRange(node.range)]).withRange(node.range));
      self.resolveAsParameterizedExpressionWithConversion(node, scope, context);
      return true;
    }

    // Call the initializer constructor
    if (node.kind === skew.NodeKind.INITIALIZER_MAP) {
      var firstValues = [];
      var secondValues = [];

      for (var i2 = 0, list2 = node.children, count2 = in_List.count(list2); i2 < count2; ++i2) {
        var child = list2[i2];
        in_List.append1(firstValues, child.firstValue().replaceWithNull());
        in_List.append1(secondValues, child.secondValue().replaceWithNull());
      }

      node.become(skew.Node.createCall(dot, [skew.Node.createList(firstValues).withRange(node.range), skew.Node.createList(secondValues).withRange(node.range)]).withRange(node.range));
    }

    else {
      node.become(skew.Node.createCall(dot, [skew.Node.createList(node.removeChildren()).withRange(node.range)]).withRange(node.range));
    }

    self.resolveAsParameterizedExpressionWithConversion(node, scope, context);
    return true;
  };

  skew.resolving.Resolver.prototype.mergeCommonType = function(commonType, child) {
    var self = this;
    if (commonType === null || child.resolvedType === skew.Type.DYNAMIC) {
      return child.resolvedType;
    }

    var result = self.cache.commonImplicitType(commonType, child.resolvedType);

    if (result !== null) {
      return result;
    }

    self.log.semanticErrorNoCommonType(child.range, commonType, child.resolvedType);
    return skew.Type.DYNAMIC;
  };

  skew.resolving.Resolver.prototype.resolveLambda = function(node, scope, context) {
    var self = this;
    var symbol = node.symbol.asFunctionSymbol();
    symbol.scope = new skew.FunctionScope(scope, symbol);

    // Use type context to implicitly set missing types
    if (context !== null && context.kind === skew.TypeKind.LAMBDA) {
      // Copy over the argument types if they line up
      if (in_List.count(context.argumentTypes) === in_List.count(symbol.$arguments)) {
        for (var i = 0, count = in_List.count(symbol.$arguments); i < count; i += 1) {
          var argument = symbol.$arguments[i];

          if (argument.type === null) {
            argument.type = skew.Node.createType(context.argumentTypes[i]);
          }
        }
      }

      // Copy over the return type
      if (symbol.returnType === null && context.returnType !== null) {
        symbol.returnType = skew.Node.createType(context.returnType);
      }
    }

    // Only infer non-void return types if there's no type context
    else if (symbol.returnType === null) {
      symbol.flags |= skew.Symbol.SHOULD_INFER_RETURN_TYPE;
    }

    self.resolveFunction(symbol);

    // Use a LambdaType instead of a SymbolType for the node
    var argumentTypes = [];
    var returnType = symbol.returnType;

    for (var i1 = 0, list = symbol.$arguments, count1 = in_List.count(list); i1 < count1; ++i1) {
      var argument = list[i1];
      in_List.append1(argumentTypes, argument.resolvedType);
    }

    node.resolvedType = self.cache.createLambdaType(argumentTypes, returnType !== null ? returnType.resolvedType : null);
  };

  skew.resolving.Resolver.prototype.resolveLambdaType = function(node, scope) {
    var self = this;
    var types = [];

    for (var i = 0, list = node.children, count = in_List.count(list); i < count; ++i) {
      var child = list[i];

      if (child !== null) {
        self.resolveAsParameterizedType(child, scope);
        in_List.append1(types, child.resolvedType);
      }

      else {
        in_List.append1(types, null);
      }
    }

    var returnType = in_List.takeLast(types);
    node.resolvedType = self.cache.createLambdaType(types, returnType);
  };

  skew.resolving.Resolver.prototype.resolveName = function(node, scope) {
    var self = this;
    var enclosingFunction = scope.findEnclosingFunction();
    var name = node.asString();
    var symbol = null;

    // Search for a setter first, then search for a normal symbol
    if (skew.resolving.Resolver.shouldCheckForSetter(node)) {
      symbol = scope.find(name + "=");
    }

    // If a setter wasn't found, search for a normal symbol
    if (symbol === null) {
      symbol = scope.find(name);

      if (symbol === null) {
        self.log.semanticErrorUndeclaredSymbol(node.range, name);
        return;
      }
    }

    self.initializeSymbol(symbol);

    // Forbid referencing a base class global or constructor function from a derived class
    if (enclosingFunction !== null && skew.resolving.Resolver.isBaseGlobalReference(enclosingFunction.symbol.parent, symbol)) {
      self.log.semanticErrorUndeclaredSymbol(node.range, name);
      return;
    }

    // Automatically insert "self." before instance symbols
    if (skew.SymbolKind.isOnInstances(symbol.kind)) {
      var variable = enclosingFunction !== null ? enclosingFunction.symbol.self : null;

      if (variable !== null) {
        node.withChildren([skew.Node.createName(variable.name).withSymbol(variable).withType(variable.resolvedType)]).kind = skew.NodeKind.DOT;
      }

      else {
        self.log.semanticErrorMemberUnexpectedInstance(node.range, symbol.name);
      }
    }

    // Type parameters for objects may only be used in certain circumstances
    else if (symbol.kind === skew.SymbolKind.PARAMETER_OBJECT) {
      var parent = scope;
      var isValid = false;
      var stop = false;

      while (parent !== null) {
        switch (parent.kind()) {
          case skew.ScopeKind.OBJECT: {
            isValid = parent.asObjectScope().symbol === symbol.parent;
            stop = true;
            break;
          }

          case skew.ScopeKind.FUNCTION: {
            var $function = parent.asFunctionScope().symbol;

            if ($function.kind !== skew.SymbolKind.FUNCTION_LOCAL) {
              isValid = $function.parent === symbol.parent;
              stop = true;
            }
            break;
          }

          case skew.ScopeKind.VARIABLE: {
            var variable = parent.asVariableScope().symbol;
            isValid = variable.kind === skew.SymbolKind.VARIABLE_INSTANCE && variable.parent === symbol.parent;
            stop = true;
            break;
          }
        }

        // TODO: Should be able to use "break" above
        if (stop) {
          break;
        }

        parent = parent.parent;
      }

      if (!isValid) {
        self.log.semanticErrorMemberUnexpectedTypeParameter(node.range, symbol.name);
      }
    }

    node.symbol = symbol;
    node.resolvedType = symbol.resolvedType;
    self.automaticallyCallGetter(node, scope);
  };

  skew.resolving.Resolver.prototype.resolveParameterize = function(node, scope) {
    var self = this;
    var value = node.parameterizeValue();
    self.resolveNode(value, scope, null);

    // Resolve parameter types
    var substitutions = [];
    var count = in_List.count(node.children) - 1;

    for (var i = 0, count1 = count; i < count1; i += 1) {
      var child = node.children[i + 1];
      self.resolveAsParameterizedType(child, scope);
      in_List.append1(substitutions, child.resolvedType);
    }

    // Check for type parameters
    var type = value.resolvedType;
    var parameters = type.parameters();

    if (parameters === null || type.isParameterized()) {
      if (type !== skew.Type.DYNAMIC) {
        self.log.semanticErrorCannotParameterize(node.range, type);
      }

      value.resolvedType = skew.Type.DYNAMIC;
      return;
    }

    // Check parameter count
    var expected = in_List.count(parameters);

    if (count !== expected) {
      self.log.semanticErrorParameterCount(node.internalRangeOrRange(), expected, count);
      value.resolvedType = skew.Type.DYNAMIC;
      return;
    }

    // Make sure all parameters have types
    for (var i1 = 0, list = parameters, count2 = in_List.count(list); i1 < count2; ++i1) {
      var parameter = list[i1];
      self.initializeSymbol(parameter);
    }

    // Include the symbol for use with Node.isType
    node.resolvedType = self.cache.substitute(type, self.cache.mergeEnvironments(type.environment, self.cache.createEnvironment(parameters, substitutions), null));
    node.symbol = value.symbol;
  };

  skew.resolving.Resolver.prototype.resolveSuper = function(node, scope) {
    var self = this;
    var $function = scope.findEnclosingFunction();
    var symbol = $function === null ? null : $function.symbol;
    var overridden = symbol === null ? null : symbol.overloaded !== null ? symbol.overloaded.overridden : symbol.overridden;

    if (overridden === null) {
      self.log.semanticErrorBadSuper(node.range);
      return;
    }

    // Calling a static method doesn't need special handling
    if (overridden.kind === skew.SymbolKind.FUNCTION_GLOBAL) {
      node.kind = skew.NodeKind.NAME;
    }

    node.resolvedType = overridden.resolvedType;
    node.symbol = overridden;
    self.automaticallyCallGetter(node, scope);
  };

  skew.resolving.Resolver.prototype.resolveUnary = function(node, scope) {
    var self = this;
    self.resolveOperatorOverload(node, scope);
  };

  skew.resolving.Resolver.prototype.resolveBinary = function(node, scope) {
    var self = this;
    var kind = node.kind;
    var left = node.binaryLeft();
    var right = node.binaryRight();

    // Special-case the equality operators
    if (kind === skew.NodeKind.EQUAL || kind === skew.NodeKind.NOT_EQUAL) {
      if (skew.resolving.Resolver.needsTypeContext(left)) {
        self.resolveAsParameterizedExpression(right, scope);
        self.resolveAsParameterizedExpressionWithTypeContext(left, scope, right.resolvedType);
      }

      else if (skew.resolving.Resolver.needsTypeContext(right)) {
        self.resolveAsParameterizedExpression(left, scope);
        self.resolveAsParameterizedExpressionWithTypeContext(right, scope, left.resolvedType);
      }

      else {
        self.resolveAsParameterizedExpression(left, scope);
        self.resolveAsParameterizedExpression(right, scope);
      }

      // The two types must be compatible
      var commonType = self.cache.commonImplicitType(left.resolvedType, right.resolvedType);

      if (commonType !== null) {
        node.resolvedType = self.cache.boolType;
      }

      else {
        self.log.semanticErrorNoCommonType(node.range, left.resolvedType, right.resolvedType);
      }

      return;
    }

    // Special-case assignment since it's not overridable
    if (kind === skew.NodeKind.ASSIGN) {
      self.resolveAsParameterizedExpression(left, scope);

      // Automatically call setters
      if (left.symbol !== null && left.symbol.isSetter()) {
        node.become(skew.Node.createCall(left.replaceWithNull(), [right.replaceWithNull()]).withRange(node.range).withInternalRange(right.range));
        self.resolveAsParameterizedExpression(node, scope);
      }

      // Resolve the right side using type context from the left side
      else {
        self.resolveAsParameterizedExpressionWithConversion(right, scope, left.resolvedType);
        node.resolvedType = left.resolvedType;
        self.checkStorage(left, scope);
      }

      return;
    }

    // Special-case short-circuit logical operators since they aren't overridable
    if (kind === skew.NodeKind.LOGICAL_AND || kind === skew.NodeKind.LOGICAL_OR) {
      self.resolveAsParameterizedExpressionWithConversion(left, scope, self.cache.boolType);
      self.resolveAsParameterizedExpressionWithConversion(right, scope, self.cache.boolType);
      node.resolvedType = self.cache.boolType;
      return;
    }

    self.resolveOperatorOverload(node, scope);
  };

  skew.resolving.Resolver.prototype.resolveIndex = function(node, scope) {
    var self = this;
    self.resolveOperatorOverload(node, scope);
  };

  skew.resolving.Resolver.prototype.resolveOperatorOverload = function(node, scope) {
    var self = this;
    // The order of operands are reversed for the "in" operator
    var kind = node.kind;
    var reverseBinaryOrder = kind === skew.NodeKind.IN;
    var target = node.children[((reverseBinaryOrder) | 0)];
    var other = skew.NodeKind.isBinary(kind) ? node.children[1 - ((reverseBinaryOrder) | 0)] : null;

    // Allow "foo in [.FOO, .BAR]"
    if (kind === skew.NodeKind.IN && target.kind === skew.NodeKind.INITIALIZER_LIST && !skew.resolving.Resolver.needsTypeContext(other)) {
      self.resolveAsParameterizedExpression(other, scope);
      self.resolveAsParameterizedExpressionWithTypeContext(target, scope, other.resolvedType !== skew.Type.DYNAMIC ? self.cache.createListType(other.resolvedType) : null);
    }

    // Resolve just the target since the other arguments may need type context from overload resolution
    else {
      self.resolveAsParameterizedExpression(target, scope);
    }

    // Check for a valid storage location even for overloadable operators
    if (skew.NodeKind.isAssign(kind)) {
      self.checkStorage(target, scope);
    }

    // Can't do overload resolution on the dynamic type
    var type = target.resolvedType;

    if (type === skew.Type.DYNAMIC) {
      self.resolveChildrenAsParameterizedExpressions(node, scope);
      return;
    }

    // Check if the operator can be overridden at all
    var info = skew.operatorInfo[((kind) | 0)];

    if (info.kind !== skew.OperatorKind.OVERRIDABLE) {
      self.log.semanticErrorUnknownMemberSymbol(node.internalRangeOrRange(), info.text, type);
      self.resolveChildrenAsParameterizedExpressions(node, scope);
      return;
    }

    // Avoid infinite expansion
    var isComparison = skew.NodeKind.isBinaryComparison(kind);

    if (isComparison && self.cache.isNumeric(type)) {
      self.resolveAsParameterizedExpression(other, scope);

      if (self.cache.isNumeric(other.resolvedType)) {
        self.resolveChildrenAsParameterizedExpressions(node, scope);
        node.resolvedType = self.cache.boolType;
        return;
      }
    }

    // Auto-convert int to double when it appears as the target
    if (other !== null && type === self.cache.intType) {
      self.resolveAsParameterizedExpression(other, scope);

      if (other.resolvedType === self.cache.doubleType) {
        self.checkConversion(target, self.cache.doubleType, skew.resolving.ConversionKind.IMPLICIT);
        type = self.cache.doubleType;
      }
    }

    // Find the operator method
    var name = isComparison ? "<=>" : info.text;
    var symbol = self.findMember(type, name);

    if (symbol === null) {
      self.log.semanticErrorUnknownMemberSymbol(node.internalRangeOrRange(), name, type);
      self.resolveChildrenAsParameterizedExpressions(node, scope);
      return;
    }

    var symbolType = self.cache.substitute(symbol.resolvedType, type.environment);

    // Resolve the overload now so the symbol's properties can be inspected
    if (skew.SymbolKind.isOverloadedFunction(symbol.kind)) {
      if (reverseBinaryOrder) {
        node.children.reverse();
      }

      symbolType = self.resolveOverloadedFunction(node.internalRangeOrRange(), node.children, scope, symbolType);

      if (reverseBinaryOrder) {
        node.children.reverse();
      }

      if (symbolType === null) {
        self.resolveChildrenAsParameterizedExpressions(node, scope);
        return;
      }

      symbol = symbolType.symbol;
    }

    node.symbol = symbol;
    self.checkAccess(node, node.internalRangeOrRange(), scope);

    // Don't replace the operator with a call if it's just used for type checking
    if (symbol.isImported() && !symbol.isRenamed()) {
      if (reverseBinaryOrder) {
        node.children.reverse();
      }

      if (!self.resolveFunctionCall(node, scope, symbolType)) {
        self.resolveChildrenAsParameterizedExpressions(node, scope);
      }

      if (reverseBinaryOrder) {
        node.children.reverse();
      }

      return;
    }

    // Resolve the method call
    var children = node.removeChildren();

    if (reverseBinaryOrder) {
      children.reverse();
    }

    children[0] = skew.Node.createDot(children[0], name).withSymbol(symbol).withRange(node.internalRangeOrRange());

    // Implement the logic for the "<=>" operator
    if (isComparison) {
      var $call = new skew.Node(skew.NodeKind.CALL).withChildren(children).withRange(node.range);
      node.appendChild($call);
      node.appendChild(skew.Node.createInt(0));
      node.resolvedType = self.cache.boolType;
      self.resolveFunctionCall($call, scope, symbolType);
      return;
    }

    // All other operators are just normal method calls
    node.kind = skew.NodeKind.CALL;
    node.withChildren(children);
    self.resolveFunctionCall(node, scope, symbolType);
  };

  skew.resolving.Resolver.prototype.automaticallyCallGetter = function(node, scope) {
    var self = this;
    var symbol = node.symbol;

    if (symbol === null) {
      return;
    }

    var kind = symbol.kind;
    var parent = node.parent;

    // The check for getters is complicated by overloaded functions
    if (!symbol.isGetter() && skew.SymbolKind.isOverloadedFunction(kind) && (!skew.resolving.Resolver.isCallValue(node) || in_List.count(parent.children) === 1)) {
      var overloaded = symbol.asOverloadedFunctionSymbol();

      for (var i = 0, list = overloaded.symbols, count = in_List.count(list); i < count; ++i) {
        var getter = list[i];

        // Just return the first getter assuming errors for duplicate getters
        // were already logged when the overloaded symbol was initialized
        if (getter.isGetter()) {
          node.resolvedType = self.cache.substitute(getter.resolvedType, node.resolvedType.environment);
          node.symbol = getter;
          symbol = getter;
          break;
        }
      }
    }

    self.checkAccess(node, node.internalRangeOrRange(), scope);

    // Automatically wrap the getter in a call expression
    if (symbol.isGetter()) {
      var value = skew.Node.createNull();
      value.become(node);
      node.become(skew.Node.createCall(value, []).withRange(node.range));
      self.resolveAsParameterizedExpression(node, scope);
    }

    // Forbid bare function references
    else if (node.resolvedType !== skew.Type.DYNAMIC && skew.SymbolKind.isFunctionOrOverloadedFunction(kind) && kind !== skew.SymbolKind.FUNCTION_ANNOTATION && !skew.resolving.Resolver.isCallValue(node) && (parent === null || parent.kind !== skew.NodeKind.PARAMETERIZE || !skew.resolving.Resolver.isCallValue(parent))) {
      self.log.semanticErrorMustCallFunction(node.internalRangeOrRange(), symbol.name);
      node.resolvedType = skew.Type.DYNAMIC;
    }
  };

  skew.resolving.Resolver.shouldCheckForSetter = function(node) {
    return node.parent !== null && node.parent.kind === skew.NodeKind.ASSIGN && node === node.parent.binaryLeft();
  };

  skew.resolving.Resolver.isVoidExpressionUsed = function(node) {
    // Check for a null parent to handle variable initializers
    var parent = node.parent;
    return parent === null || parent.kind !== skew.NodeKind.EXPRESSION && !parent.isImplicitReturn() && (parent.kind !== skew.NodeKind.ANNOTATION || node !== parent.annotationValue()) && (parent.kind !== skew.NodeKind.FOR || node !== parent.forUpdate());
  };

  skew.resolving.Resolver.isValidVariableType = function(type) {
    return type !== skew.Type.NULL && (type.kind !== skew.TypeKind.SYMBOL || !skew.SymbolKind.isFunctionOrOverloadedFunction(type.symbol.kind));
  };

  skew.resolving.Resolver.createSymbolReference = function(symbol) {
    return skew.Node.createName(symbol.name).withSymbol(symbol).withType(symbol.resolvedType);
  };

  skew.resolving.Resolver.createMemberReference = function(target, member) {
    return skew.Node.createDot(target, member.name).withSymbol(member).withType(member.resolvedType);
  };

  skew.resolving.Resolver.isBaseGlobalReference = function(parent, member) {
    return parent !== null && parent.kind === skew.SymbolKind.OBJECT_CLASS && skew.SymbolKind.isGlobalReference(member.kind) && member.parent !== parent && member.parent.kind === skew.SymbolKind.OBJECT_CLASS && parent.asObjectSymbol().hasBaseClass(member.parent);
  };

  skew.resolving.Resolver.isCallValue = function(node) {
    var parent = node.parent;
    return parent !== null && parent.kind === skew.NodeKind.CALL && node === parent.callValue();
  };

  skew.resolving.Resolver.needsTypeContext = function(node) {
    return node.kind === skew.NodeKind.DOT && node.dotTarget() === null || node.kind === skew.NodeKind.HOOK && skew.resolving.Resolver.needsTypeContext(node.hookTrue()) && skew.resolving.Resolver.needsTypeContext(node.hookFalse()) || skew.NodeKind.isInitializer(node.kind);
  };

  skew.resolving.Resolver.ensureFunctionIsOverloaded = function(symbol) {
    if (symbol.overloaded === null) {
      var overloaded = new skew.OverloadedFunctionSymbol(skew.merging.overloadedKind(symbol.kind), symbol.name, [symbol]);
      overloaded.parent = symbol.parent;
      overloaded.scope = overloaded.parent.scope;
      symbol.overloaded = overloaded;
      overloaded.scope.asObjectScope().symbol.members[symbol.name] = overloaded;
    }
  };

  skew.ScopeKind = {
    FUNCTION: 0, 0: "FUNCTION",
    LOCAL: 1, 1: "LOCAL",
    OBJECT: 2, 2: "OBJECT",
    VARIABLE: 3, 3: "VARIABLE"
  };

  skew.Scope = function(parent) {
    var self = this;
    self.parent = parent;
    self.used = null;
  };

  skew.Scope.prototype.asObjectScope = function() {
    var self = this;
    assert(self.kind() === skew.ScopeKind.OBJECT);
    return self;
  };

  skew.Scope.prototype.asFunctionScope = function() {
    var self = this;
    assert(self.kind() === skew.ScopeKind.FUNCTION);
    return self;
  };

  skew.Scope.prototype.asVariableScope = function() {
    var self = this;
    assert(self.kind() === skew.ScopeKind.VARIABLE);
    return self;
  };

  skew.Scope.prototype.asLocalScope = function() {
    var self = this;
    assert(self.kind() === skew.ScopeKind.LOCAL);
    return self;
  };

  skew.Scope.prototype.findEnclosingFunctionOrLambda = function() {
    var self = this;
    var scope = self;

    while (scope !== null) {
      if (scope.kind() === skew.ScopeKind.FUNCTION) {
        return scope.asFunctionScope();
      }

      scope = scope.parent;
    }

    return null;
  };

  skew.Scope.prototype.findEnclosingFunction = function() {
    var self = this;
    var scope = self;

    while (scope !== null) {
      if (scope.kind() === skew.ScopeKind.FUNCTION && scope.asFunctionScope().symbol.kind !== skew.SymbolKind.FUNCTION_LOCAL) {
        return scope.asFunctionScope();
      }

      scope = scope.parent;
    }

    return null;
  };

  skew.Scope.prototype.findEnclosingLoop = function() {
    var self = this;
    var scope = self;

    while (scope !== null && scope.kind() === skew.ScopeKind.LOCAL) {
      if (scope.asLocalScope().type === skew.LocalType.LOOP) {
        return scope.asLocalScope();
      }

      scope = scope.parent;
    }

    return null;
  };

  skew.Scope.prototype.generateSymbolName = function(prefix) {
    var self = this;
    var count = 0;
    var name = prefix;

    while (true) {
      if (self.find(name) === null && (self.used === null || !(name in self.used))) {
        self.reserveSymbolName(name);
        return name;
      }

      ++count;
      name = prefix + count.toString();
    }

    return prefix;
  };

  skew.Scope.prototype.reserveSymbolName = function(name) {
    var self = this;
    if (self.used === null) {
      self.used = in_StringMap.$new();
    }

    self.used[name] = 0;
  };

  skew.ObjectScope = function(parent, symbol) {
    var self = this;
    skew.Scope.call(self, parent);
    self.symbol = symbol;
  };

  $extends(skew.ObjectScope, skew.Scope);

  skew.ObjectScope.prototype.kind = function() {
    var self = this;
    return skew.ScopeKind.OBJECT;
  };

  skew.ObjectScope.prototype.find = function(name) {
    var self = this;
    var check = self.symbol;

    while (check !== null) {
      var result = in_StringMap.get(check.members, name, null);

      if (result !== null) {
        return result;
      }

      check = check.baseClass;
    }

    return self.parent !== null ? self.parent.find(name) : null;
  };

  skew.FunctionScope = function(parent, symbol) {
    var self = this;
    skew.Scope.call(self, parent);
    self.symbol = symbol;
    self.parameters = in_StringMap.$new();
  };

  $extends(skew.FunctionScope, skew.Scope);

  skew.FunctionScope.prototype.kind = function() {
    var self = this;
    return skew.ScopeKind.FUNCTION;
  };

  skew.FunctionScope.prototype.find = function(name) {
    var self = this;
    var result = in_StringMap.get(self.parameters, name, null);
    return result !== null ? result : self.parent !== null ? self.parent.find(name) : null;
  };

  skew.VariableScope = function(parent, symbol) {
    var self = this;
    skew.Scope.call(self, parent);
    self.symbol = symbol;
  };

  $extends(skew.VariableScope, skew.Scope);

  skew.VariableScope.prototype.kind = function() {
    var self = this;
    return skew.ScopeKind.VARIABLE;
  };

  skew.VariableScope.prototype.find = function(name) {
    var self = this;
    return self.parent !== null ? self.parent.find(name) : null;
  };

  skew.LocalType = {
    LOOP: 0, 0: "LOOP",
    NORMAL: 1, 1: "NORMAL"
  };

  skew.LocalScope = function(parent, type) {
    var self = this;
    skew.Scope.call(self, parent);
    self.locals = in_StringMap.$new();
    self.type = type;
  };

  $extends(skew.LocalScope, skew.Scope);

  skew.LocalScope.prototype.kind = function() {
    var self = this;
    return skew.ScopeKind.LOCAL;
  };

  skew.LocalScope.prototype.find = function(name) {
    var self = this;
    var result = in_StringMap.get(self.locals, name, null);
    return result !== null ? result : self.parent !== null ? self.parent.find(name) : null;
  };

  skew.LocalScope.prototype.define = function(symbol, log) {
    var self = this;
    symbol.scope = self;

    // Check for duplicates
    var other = in_StringMap.get(self.locals, symbol.name, null);

    if (other !== null) {
      log.semanticErrorDuplicateSymbol(symbol.range, symbol.name, other.range);
      return;
    }

    // Check for shadowing
    var scope = self.parent;

    while (scope.kind() === skew.ScopeKind.LOCAL) {
      var local = in_StringMap.get(scope.asLocalScope().locals, symbol.name, null);

      if (local !== null) {
        log.semanticErrorShadowedSymbol(symbol.range, symbol.name, local.range);
        return;
      }

      scope = scope.parent;
    }

    // Make sure no duplicate names are accidentally generated in other local scopes
    scope.reserveSymbolName(symbol.name);
    self.locals[symbol.name] = symbol;
  };

  skew.TypeKind = {
    LAMBDA: 0, 0: "LAMBDA",
    SPECIAL: 1, 1: "SPECIAL",
    SYMBOL: 2, 2: "SYMBOL"
  };

  skew.Type = function(kind, symbol) {
    var self = this;
    self.id = skew.Type.createID();
    self.kind = kind;
    self.symbol = symbol;
    self.environment = null;
    self.substitutions = null;
    self.argumentTypes = null;
    self.returnType = null;
    self.substitutionCache = null;
  };

  skew.Type.prototype.parameters = function() {
    var self = this;
    return self.symbol === null ? null : skew.SymbolKind.isObject(self.symbol.kind) ? self.symbol.asObjectSymbol().parameters : skew.SymbolKind.isFunction(self.symbol.kind) ? self.symbol.asFunctionSymbol().parameters : null;
  };

  skew.Type.prototype.isParameterized = function() {
    var self = this;
    return self.substitutions !== null;
  };

  skew.Type.prototype.isClass = function() {
    var self = this;
    return self.symbol !== null && self.symbol.kind === skew.SymbolKind.OBJECT_CLASS;
  };

  skew.Type.prototype.isEnum = function() {
    var self = this;
    return self.symbol !== null && self.symbol.kind === skew.SymbolKind.OBJECT_ENUM;
  };

  // Type parameters are not guaranteed to be nullable since generics are
  // implemented through type erasure and the substituted type may be "int"
  skew.Type.prototype.isReference = function() {
    var self = this;
    return self.symbol === null || !self.symbol.isValueType() && !skew.SymbolKind.isParameter(self.symbol.kind);
  };

  skew.Type.prototype.toString = function() {
    var self = this;
    if (self.kind === skew.TypeKind.SYMBOL) {
      if (self.substitutions !== null) {
        var name = self.symbol.name + "<";

        for (var i = 0, count = in_List.count(self.substitutions); i < count; i += 1) {
          if (i !== 0) {
            name += ", ";
          }

          name += self.substitutions[i].toString();
        }

        return name + ">";
      }

      return self.symbol.name;
    }

    if (self.kind === skew.TypeKind.LAMBDA) {
      var result = "fn(";

      for (var i = 0, count1 = in_List.count(self.argumentTypes); i < count1; i += 1) {
        if (i !== 0) {
          result += ", ";
        }

        result += self.argumentTypes[i].toString();
      }

      return result + (self.returnType !== null ? ") " + self.returnType.toString() : ")");
    }

    return self === skew.Type.DYNAMIC ? "dynamic" : "null";
  };

  skew.Type.prototype.baseClass = function() {
    var self = this;
    if (self.isClass()) {
      var base = self.symbol.asObjectSymbol().base;

      if (base !== null) {
        return base.resolvedType;
      }
    }

    return null;
  };

  skew.Type.prototype.hasBaseType = function(type) {
    var self = this;
    var base = self.baseClass();
    return base !== null && (base === type || base.hasBaseType(type));
  };

  skew.Type.initialize = function() {
    if (skew.Type.DYNAMIC === null) {
      skew.Type.DYNAMIC = new skew.Type(skew.TypeKind.SPECIAL, null);
    }

    if (skew.Type.NULL === null) {
      skew.Type.NULL = new skew.Type(skew.TypeKind.SPECIAL, null);
    }
  };

  skew.Type.createID = function() {
    ++skew.Type.nextID;
    return skew.Type.nextID;
  };

  skew.Environment = function(parameters, substitutions) {
    var self = this;
    self.id = skew.Environment.createID();
    self.parameters = parameters;
    self.substitutions = substitutions;
    self.mergeCache = null;
  };

  // This is just for debugging
  skew.Environment.prototype.toString = function() {
    var self = this;
    var text = "(";

    for (var i = 0, count = in_List.count(self.parameters); i < count; i += 1) {
      if (i !== 0) {
        text += ", ";
      }

      text += self.parameters[i].name + " => " + self.substitutions[i].toString();
    }

    return text + ")";
  };

  skew.Environment.createID = function() {
    ++skew.Environment.nextID;
    return skew.Environment.nextID;
  };

  skew.TypeCache = function() {
    var self = this;
    self.boolType = null;
    self.doubleType = null;
    self.intMapType = null;
    self.intType = null;
    self.listType = null;
    self.stringMapType = null;
    self.stringType = null;
    self.entryPointSymbol = null;
    self.environments = in_IntMap.$new();
    self.lambdaTypes = in_IntMap.$new();
  };

  skew.TypeCache.prototype.loadGlobals = function(log, global) {
    var self = this;
    skew.Type.initialize();
    self.boolType = skew.TypeCache.loadGlobalClass(log, global, "bool", skew.Symbol.IS_VALUE_TYPE);
    self.doubleType = skew.TypeCache.loadGlobalClass(log, global, "double", skew.Symbol.IS_VALUE_TYPE);
    self.intMapType = skew.TypeCache.loadGlobalClass(log, global, "IntMap", 0);
    self.intType = skew.TypeCache.loadGlobalClass(log, global, "int", skew.Symbol.IS_VALUE_TYPE);
    self.listType = skew.TypeCache.loadGlobalClass(log, global, "List", 0);
    self.stringMapType = skew.TypeCache.loadGlobalClass(log, global, "StringMap", 0);
    self.stringType = skew.TypeCache.loadGlobalClass(log, global, "string", skew.Symbol.IS_VALUE_TYPE);
  };

  skew.TypeCache.prototype.isNumeric = function(type) {
    var self = this;
    return type === self.intType || type === self.doubleType;
  };

  skew.TypeCache.prototype.isList = function(type) {
    var self = this;
    return type.symbol === self.listType.symbol;
  };

  skew.TypeCache.prototype.canImplicitlyConvert = function(from, to) {
    var self = this;
    if (from === to) {
      return true;
    }

    if (from === skew.Type.DYNAMIC || to === skew.Type.DYNAMIC) {
      return true;
    }

    if (from === skew.Type.NULL && to.isReference()) {
      return true;
    }

    if (from === self.intType && to === self.doubleType) {
      return true;
    }

    if (from.hasBaseType(to)) {
      return true;
    }

    if (from.isEnum() && (to === self.intType || to === self.stringType)) {
      return true;
    }

    return false;
  };

  skew.TypeCache.prototype.canExplicitlyConvert = function(from, to) {
    var self = this;
    if (self.canImplicitlyConvert(from, to)) {
      return true;
    }

    if (self.canCastToNumeric(from) && self.canCastToNumeric(to)) {
      return true;
    }

    if (to.hasBaseType(from)) {
      return true;
    }

    if (to.isEnum() && (from === self.intType || from === self.stringType)) {
      return true;
    }

    return false;
  };

  skew.TypeCache.prototype.commonImplicitType = function(left, right) {
    var self = this;
    // Short-circuit early for identical types
    if (left === right) {
      return left;
    }

    // Dynamic is a hole in the type system
    if (left === skew.Type.DYNAMIC || right === skew.Type.DYNAMIC) {
      return skew.Type.DYNAMIC;
    }

    // Check implicit conversions
    if (self.canImplicitlyConvert(left, right)) {
      return right;
    }

    if (self.canImplicitlyConvert(right, left)) {
      return left;
    }

    // Implement common implicit types for numeric types
    if (self.isNumeric(left) && self.isNumeric(right)) {
      return left === self.intType && right === self.intType ? self.intType : self.doubleType;
    }

    // Check for a common base class
    if (left.isClass() && right.isClass()) {
      return skew.TypeCache.commonBaseClass(left, right);
    }

    return null;
  };

  skew.TypeCache.prototype.createListType = function(itemType) {
    var self = this;
    return self.substitute(self.listType, self.createEnvironment(self.listType.parameters(), [itemType]));
  };

  skew.TypeCache.prototype.createIntMapType = function(valueType) {
    var self = this;
    return self.substitute(self.intMapType, self.createEnvironment(self.intMapType.parameters(), [valueType]));
  };

  skew.TypeCache.prototype.createStringMapType = function(valueType) {
    var self = this;
    return self.substitute(self.stringMapType, self.createEnvironment(self.stringMapType.parameters(), [valueType]));
  };

  skew.TypeCache.prototype.createEnvironment = function(parameters, substitutions) {
    var self = this;
    assert(in_List.count(parameters) === in_List.count(substitutions));

    // Hash the inputs
    var hash = skew.TypeCache.hashTypes(skew.TypeCache.hashParameters(parameters), substitutions);
    var bucket = in_IntMap.get(self.environments, hash, null);

    // Check existing environments in the bucket for a match
    if (bucket !== null) {
      for (var i = 0, list = bucket, count = in_List.count(list); i < count; ++i) {
        var existing = list[i];

        if (in_List.isEqualTo(parameters, existing.parameters) && in_List.isEqualTo(substitutions, existing.substitutions)) {
          return existing;
        }
      }
    }

    // Make a new bucket
    else {
      bucket = [];
      self.environments[hash] = bucket;
    }

    // Make a new environment
    var environment = new skew.Environment(parameters, substitutions);
    in_List.append1(bucket, environment);
    return environment;
  };

  skew.TypeCache.prototype.createLambdaType = function(argumentTypes, returnType) {
    var self = this;
    var hash = skew.TypeCache.hashTypes(returnType !== null ? returnType.id : -1, argumentTypes);
    var bucket = in_IntMap.get(self.lambdaTypes, hash, null);

    // Check existing types in the bucket for a match
    if (bucket !== null) {
      for (var i = 0, list = bucket, count = in_List.count(list); i < count; ++i) {
        var existing = list[i];

        if (in_List.isEqualTo(argumentTypes, existing.argumentTypes) && returnType === existing.returnType) {
          return existing;
        }
      }
    }

    // Make a new bucket
    else {
      bucket = [];
      self.lambdaTypes[hash] = bucket;
    }

    // Make a new lambda type
    var type = new skew.Type(skew.TypeKind.LAMBDA, null);
    type.argumentTypes = argumentTypes;
    type.returnType = returnType;
    in_List.append1(bucket, type);
    return type;
  };

  skew.TypeCache.prototype.mergeEnvironments = function(a, b, restrictions) {
    var self = this;
    if (a === null) {
      return b;
    }

    if (b === null) {
      return a;
    }

    var parameters = in_List.clone(a.parameters);
    var substitutions = self.substituteAll(a.substitutions, b);

    for (var i = 0, count = in_List.count(b.parameters); i < count; i += 1) {
      var parameter = b.parameters[i];
      var substitution = b.substitutions[i];

      if (!in_List.contains(parameters, parameter) && (restrictions === null || in_List.contains(restrictions, parameter))) {
        in_List.append1(parameters, parameter);
        in_List.append1(substitutions, substitution);
      }
    }

    return self.createEnvironment(parameters, substitutions);
  };

  skew.TypeCache.prototype.parameterize = function(type) {
    var self = this;
    var parameters = type.parameters();

    if (parameters === null) {
      return type;
    }

    assert(!type.isParameterized());
    var substitutions = [];

    for (var i = 0, list = parameters, count = in_List.count(list); i < count; ++i) {
      var parameter = list[i];
      in_List.append1(substitutions, parameter.resolvedType);
    }

    return self.substitute(type, self.createEnvironment(parameters, substitutions));
  };

  skew.TypeCache.prototype.substituteAll = function(types, environment) {
    var self = this;
    var substitutions = [];

    for (var i = 0, list = types, count = in_List.count(list); i < count; ++i) {
      var type = list[i];
      in_List.append1(substitutions, self.substitute(type, environment));
    }

    return substitutions;
  };

  skew.TypeCache.prototype.substitute = function(type, environment) {
    var self = this;
    var existing = type.environment;

    if (environment === null || environment === existing) {
      return type;
    }

    // Merge the type environments (this matters for nested generics). For
    // object types, limit the parameters in the environment to just those
    // on this type and the base type.
    var parameters = type.parameters();

    if (existing !== null) {
      environment = self.mergeEnvironments(existing, environment, type.kind === skew.TypeKind.SYMBOL && skew.SymbolKind.isFunctionOrOverloadedFunction(type.symbol.kind) ? null : parameters);
    }

    // Check to see if this has been computed before
    var rootType = type.kind === skew.TypeKind.SYMBOL ? type.symbol.resolvedType : type;

    if (rootType.substitutionCache === null) {
      rootType.substitutionCache = in_IntMap.$new();
    }

    var substituted = in_IntMap.get(rootType.substitutionCache, environment.id, null);

    if (substituted !== null) {
      return substituted;
    }

    substituted = type;

    if (type.kind === skew.TypeKind.LAMBDA) {
      var argumentTypes = [];
      var returnType = null;

      // Substitute function arguments
      for (var i = 0, list = type.argumentTypes, count = in_List.count(list); i < count; ++i) {
        var argumentType = list[i];
        in_List.append1(argumentTypes, self.substitute(argumentType, environment));
      }

      // Substitute return type
      if (type.returnType !== null) {
        returnType = self.substitute(type.returnType, environment);
      }

      substituted = self.createLambdaType(argumentTypes, returnType);
    }

    else if (type.kind === skew.TypeKind.SYMBOL) {
      var symbol = type.symbol;

      // Parameters just need simple substitution
      if (skew.SymbolKind.isParameter(symbol.kind)) {
        var index = environment.parameters.indexOf(symbol.asParameterSymbol());

        if (index !== -1) {
          substituted = environment.substitutions[index];
        }
      }

      // Symbols with type parameters are more complicated
      // Overloaded functions are also included even though they don't have
      // type parameters because the type environment needs to be bundled
      // for later substitution into individual matched overloads
      else if (parameters !== null || skew.SymbolKind.isFunctionOrOverloadedFunction(symbol.kind)) {
        substituted = new skew.Type(skew.TypeKind.SYMBOL, symbol);
        substituted.environment = environment;

        // Generate type substitutions
        if (parameters !== null) {
          var found = true;

          for (var i1 = 0, list1 = parameters, count1 = in_List.count(list1); i1 < count1; ++i1) {
            var parameter = list1[i1];
            found = in_List.contains(environment.parameters, parameter);

            if (!found) {
              break;
            }
          }

          if (found) {
            substituted.substitutions = [];

            for (var i2 = 0, list2 = parameters, count2 = in_List.count(list2); i2 < count2; ++i2) {
              var parameter = list2[i2];
              in_List.append1(substituted.substitutions, self.substitute(parameter.resolvedType, environment));
            }
          }
        }

        // Substitute function arguments
        if (type.argumentTypes !== null) {
          substituted.argumentTypes = [];

          for (var i3 = 0, list3 = type.argumentTypes, count3 = in_List.count(list3); i3 < count3; ++i3) {
            var argumentType = list3[i3];
            in_List.append1(substituted.argumentTypes, self.substitute(argumentType, environment));
          }
        }

        // Substitute return type
        if (type.returnType !== null) {
          substituted.returnType = self.substitute(type.returnType, environment);
        }
      }
    }

    rootType.substitutionCache[environment.id] = substituted;
    return substituted;
  };

  skew.TypeCache.prototype.canCastToNumeric = function(type) {
    var self = this;
    return type === self.intType || type === self.doubleType || type === self.boolType;
  };

  skew.TypeCache.loadGlobalClass = function(log, global, name, flags) {
    var symbol = in_StringMap.get(global.members, name, null);
    assert(symbol !== null);
    assert(symbol.kind === skew.SymbolKind.OBJECT_CLASS);
    var type = new skew.Type(skew.TypeKind.SYMBOL, symbol.asObjectSymbol());
    symbol.resolvedType = type;
    symbol.flags |= flags;
    return type;
  };

  skew.TypeCache.hashParameters = function(parameters) {
    var hash = 0;

    for (var i = 0, list = parameters, count = in_List.count(list); i < count; ++i) {
      var parameter = list[i];
      hash = hashCombine(hash, parameter.id);
    }

    return hash;
  };

  skew.TypeCache.hashTypes = function(hash, types) {
    for (var i = 0, list = types, count = in_List.count(list); i < count; ++i) {
      var type = list[i];
      hash = hashCombine(hash, type.id);
    }

    return hash;
  };

  skew.TypeCache.commonBaseClass = function(left, right) {
    var a = left;

    while (a !== null) {
      var b = right;

      while (b !== null) {
        if (a === b) {
          return a;
        }

        b = b.baseClass();
      }

      a = a.baseClass();
    }

    return null;
  };

  skew.Option = {
    HELP: 0, 0: "HELP",
    OUTPUT_FILE: 1, 1: "OUTPUT_FILE",
    OUTPUT_DIRECTORY: 2, 2: "OUTPUT_DIRECTORY",
    ERROR_LIMIT: 3, 3: "ERROR_LIMIT"
  };

  skew.options = {};

  skew.options.Type = {
    BOOL: 0, 0: "BOOL",
    INT: 1, 1: "INT",
    STRING: 2, 2: "STRING",
    STRING_LIST: 3, 3: "STRING_LIST"
  };

  skew.options.Data = function(parser, type, option, name, description) {
    var self = this;
    self.parser = parser;
    self.type = type;
    self.option = option;
    self.name = name;
    self.description = description;
  };

  skew.options.Data.prototype.nameText = function() {
    var self = this;
    return self.name + (self.type === skew.options.Type.BOOL ? "" : self.type === skew.options.Type.STRING_LIST ? ":___" : "=___");
  };

  skew.options.Data.prototype.aliases = function(names) {
    var self = this;
    for (var i = 0, list = names, count = in_List.count(list); i < count; ++i) {
      var name = list[i];
      self.parser.map[name] = self;
    }

    return self;
  };

  skew.options.Parser = function() {
    var self = this;
    self.options = [];
    self.map = in_StringMap.$new();
    self.optionalArguments = in_IntMap.$new();
    self.normalArguments = [];
    self.source = null;
  };

  skew.options.Parser.prototype.define = function(type, option, name, description) {
    var self = this;
    var data = new skew.options.Data(self, type, option, name, description);
    self.map[name] = data;
    in_List.append1(self.options, data);
    return data;
  };

  skew.options.Parser.prototype.nodeForOption = function(option) {
    var self = this;
    return in_IntMap.get(self.optionalArguments, ((option) | 0), null);
  };

  skew.options.Parser.prototype.boolForOption = function(option, defaultValue) {
    var self = this;
    var node = self.nodeForOption(option);
    return node !== null ? node.content.asBool() : defaultValue;
  };

  skew.options.Parser.prototype.intForOption = function(option, defaultValue) {
    var self = this;
    var node = self.nodeForOption(option);
    return node !== null ? node.content.asInt() : defaultValue;
  };

  skew.options.Parser.prototype.stringRangeForOption = function(option) {
    var self = this;
    var node = self.nodeForOption(option);
    return node !== null ? node.range : null;
  };

  skew.options.Parser.prototype.stringRangeListForOption = function(option) {
    var self = this;
    var node = self.nodeForOption(option);
    var ranges = [];

    if (node !== null) {
      for (var i = 0, list = node.children, count = in_List.count(list); i < count; ++i) {
        var child = list[i];
        in_List.append1(ranges, child.range);
      }
    }

    return ranges;
  };

  skew.options.Parser.prototype.parse = function(log, $arguments) {
    var self = this;
    self.source = new skew.Source("<arguments>", "");
    var ranges = [];

    // Create a source for the arguments to work with the log system. The
    // trailing space is needed to be able to point to the character after
    // the last argument without wrapping onto the next line.
    for (var i1 = 0, list = $arguments, count = in_List.count(list); i1 < count; ++i1) {
      var argument = list[i1];
      var needsQuotes = in_string.contains(argument, " ");
      var start = in_string.count(self.source.contents) + ((needsQuotes) | 0);
      in_List.append1(ranges, new skew.Range(self.source, start, start + in_string.count(argument)));
      self.source.contents += needsQuotes ? "'" + argument + "' " : argument + " ";
    }

    // Parse each argument
    for (var i = 0, count1 = in_List.count($arguments); i < count1; i += 1) {
      var argument = $arguments[i];
      var range = ranges[i];

      // Track all normal arguments separately
      if (argument === "" || in_string.get1(argument, 0) !== 45 && !(argument in self.map)) {
        in_List.append1(self.normalArguments, range);
        continue;
      }

      // Parse a flag
      var equals = argument.indexOf("=");
      var colon = argument.indexOf(":");
      var separator = equals >= 0 && (colon < 0 || equals < colon) ? equals : colon;
      var name = separator >= 0 ? argument.slice(0, separator) : argument;
      var data = in_StringMap.get(self.map, name, null);

      // Check that the flag exists
      if (data === null) {
        log.commandLineErrorBadFlag(range.fromStart(in_string.count(name)), name);
        continue;
      }

      // Validate the flag data
      var text = argument.slice(separator + 1, in_string.count(argument));
      var separatorRange = separator < 0 ? null : range.slice(separator, separator + 1);
      var textRange = range.fromEnd(in_string.count(text));

      switch (data.type) {
        case skew.options.Type.BOOL: {
          if (separator < 0) {
            text = "true";
          }

          else if (in_string.get1(argument, separator) !== 61) {
            log.commandLineErrorExpectedToken(separatorRange, "=", in_string.get(argument, separator), argument);
            continue;
          }

          else if (text !== "true" && text !== "false") {
            log.commandLineErrorNonBooleanValue(textRange, text, argument);
            continue;
          }

          if (((data.option) | 0) in self.optionalArguments) {
            log.commandLineWarningDuplicateFlagValue(textRange, name, self.optionalArguments[((data.option) | 0)].range);
          }

          self.optionalArguments[((data.option) | 0)] = skew.Node.createBool(text === "true").withRange(textRange);
          break;
        }

        case skew.options.Type.INT: {
          if (separator < 0) {
            log.commandLineErrorMissingValue(textRange, data.nameText());
          }

          else if (in_string.get1(argument, separator) !== 61) {
            log.commandLineErrorExpectedToken(separatorRange, "=", in_string.get(argument, separator), argument);
          }

          else if (!skew.options.Parser.isInteger(text)) {
            log.commandLineErrorNonIntegerValue(textRange, text, argument);
          }

          else {
            if (((data.option) | 0) in self.optionalArguments) {
              log.commandLineWarningDuplicateFlagValue(textRange, name, self.optionalArguments[((data.option) | 0)].range);
            }

            self.optionalArguments[((data.option) | 0)] = skew.Node.createInt(skew.parsing.parseIntLiteral(text, 10)).withRange(textRange);
          }
          break;
        }

        case skew.options.Type.STRING: {
          if (separator < 0) {
            log.commandLineErrorMissingValue(textRange, data.nameText());
          }

          else if (in_string.get1(argument, separator) !== 61) {
            log.commandLineErrorExpectedToken(separatorRange, "=", in_string.get(argument, separator), argument);
          }

          else {
            if (((data.option) | 0) in self.optionalArguments) {
              log.commandLineWarningDuplicateFlagValue(textRange, name, self.optionalArguments[((data.option) | 0)].range);
            }

            self.optionalArguments[((data.option) | 0)] = skew.Node.createString(text).withRange(textRange);
          }
          break;
        }

        case skew.options.Type.STRING_LIST: {
          if (separator < 0) {
            log.commandLineErrorMissingValue(textRange, data.nameText());
          }

          else if (in_string.get1(argument, separator) !== 58) {
            log.commandLineErrorExpectedToken(separatorRange, ":", in_string.get(argument, separator), argument);
          }

          else {

            if (((data.option) | 0) in self.optionalArguments) {
              node = self.optionalArguments[((data.option) | 0)];
            }

            else {
              node = skew.Node.createInitializer(skew.NodeKind.INITIALIZER_LIST, []);
              self.optionalArguments[((data.option) | 0)] = node;
            }

            node.appendChild(skew.Node.createString(text).withRange(textRange));
          }
          break;
        }
      }
    }
  };

  skew.options.Parser.prototype.usageText = function(wrapWidth) {
    var self = this;
    var text = "";
    var columnWidth = 0;

    // Figure out the column width
    for (var i = 0, list = self.options, count = in_List.count(list); i < count; ++i) {
      var option = list[i];
      var width = in_string.count(option.nameText()) + 4;

      if (columnWidth < width) {
        columnWidth = width;
      }
    }

    // Format the options
    var columnText = in_string.repeat(" ", columnWidth);

    for (var i2 = 0, list2 = self.options, count2 = in_List.count(list2); i2 < count2; ++i2) {
      var option = list2[i2];
      var nameText = option.nameText();
      var isFirst = true;
      text += "\n  " + nameText + in_string.repeat(" ", columnWidth - in_string.count(nameText) - 2);

      for (var i1 = 0, list1 = prettyPrint.wrapWords(option.description, wrapWidth - columnWidth), count1 = in_List.count(list1); i1 < count1; ++i1) {
        var line = list1[i1];
        text += (isFirst ? "" : columnText) + line + "\n";
        isFirst = false;
      }
    }

    return text + "\n";
  };

  skew.options.Parser.isInteger = function(text) {
    var found = false;

    for (var i = text.startsWith("-") ? 1 : 0, count = in_string.count(text); i < count; i += 1) {
      var c = in_string.get1(text, i);

      if (c < 48 || c > 57) {
        return false;
      }

      found = true;
    }

    return found;
  };

  var prettyPrint = {};

  prettyPrint.plural = function(value) {
    return value === 1 ? "" : "s";
  };

  prettyPrint.join = function(parts, trailing) {
    if (in_List.count(parts) < 3) {
      return in_string.join(" " + trailing + " ", parts);
    }

    var text = "";

    for (var i = 0, count = in_List.count(parts); i < count; i += 1) {
      if (i !== 0) {
        text += ", ";

        if (i + 1 === in_List.count(parts)) {
          text += trailing + " ";
        }
      }

      text += parts[i];
    }

    return text;
  };

  prettyPrint.wrapWords = function(text, width) {
    // An invalid length means wrapping is disabled
    if (width < 1) {
      return [text];
    }

    var words = text.split(" ");
    var lines = [];
    var line = "";

    // Run the word wrapping algorithm
    var i = 0;

    while (i < in_List.count(words)) {
      var word = words[i];
      var lineLength = in_string.count(line);
      var wordLength = in_string.count(word);
      var estimatedLength = lineLength + 1 + wordLength;
      ++i;

      // Collapse adjacent spaces
      if (word === "") {
        continue;
      }

      // Start the line
      if (line === "") {
        while (in_string.count(word) > width) {
          in_List.append1(lines, word.slice(0, width));
          word = word.slice(width, in_string.count(word));
        }

        line = word;
      }

      // Continue line
      else if (estimatedLength < width) {
        line += " " + word;
      }

      // Continue and wrap
      else if (estimatedLength === width) {
        in_List.append1(lines, line + " " + word);
        line = "";
      }

      // Wrap and try again
      else {
        in_List.append1(lines, line);
        line = "";
        --i;
      }
    }

    // Don't add an empty trailing line unless there are no other lines
    if (line !== "" || in_List.isEmpty(lines)) {
      in_List.append1(lines, line);
    }

    return lines;
  };

  var unicode = {};

  unicode.Encoding = {
    UTF8: 0, 0: "UTF8",
    UTF16: 1, 1: "UTF16",
    UTF32: 2, 2: "UTF32"
  };

  unicode.StringIterator = function() {
    var self = this;
    self.value = "";
    self.index = 0;
    self.stop = 0;
  };

  unicode.StringIterator.prototype.reset = function(text, start) {
    var self = this;
    self.value = text;
    self.index = start;
    self.stop = in_string.count(text);
    return self;
  };

  unicode.StringIterator.prototype.countCodePointsUntil = function(stop) {
    var self = this;
    var count = 0;

    while (self.index < stop && self.nextCodePoint() >= 0) {
      ++count;
    }

    return count;
  };

  unicode.StringIterator.prototype.nextCodePoint = function() {
    var self = this;
    if (unicode.STRING_ENCODING === unicode.Encoding.UTF8) {
      if (self.index >= self.stop) {
        return -1;
      }

      var a = in_string.get1(self.value, self.index);
      ++self.index;

      if (a < 192) {
        return a;
      }

      if (self.index >= self.stop) {
        return -1;
      }

      var b = in_string.get1(self.value, self.index);
      ++self.index;

      if (a < 224) {
        return (a & 31) << 6 | b & 63;
      }

      if (self.index >= self.stop) {
        return -1;
      }

      var c = in_string.get1(self.value, self.index);
      ++self.index;

      if (a < 240) {
        return (a & 15) << 12 | (b & 63) << 6 | c & 63;
      }

      if (self.index >= self.stop) {
        return -1;
      }

      var d = in_string.get1(self.value, self.index);
      ++self.index;
      return (a & 7) << 18 | (b & 63) << 12 | (c & 63) << 6 | d & 63;
    }

    else if (unicode.STRING_ENCODING === unicode.Encoding.UTF16) {
      if (self.index >= self.stop) {
        return -1;
      }

      var a = in_string.get1(self.value, self.index);
      ++self.index;

      if (a < 55296) {
        return a;
      }

      if (self.index >= self.stop) {
        return -1;
      }

      var b = in_string.get1(self.value, self.index);
      ++self.index;
      return (a << 10) + b + (65536 - (55296 << 10) - 56320);
    }

    else {
      if (self.index >= self.stop) {
        return -1;
      }

      var c = in_string.get1(self.value, self.index);
      ++self.index;
      return c;
    }
  };

  var io = {};

  io.readFile = function(path) {
    try {
      var contents = require("fs").readFileSync(path, "utf8");
      return new Box(in_string.replaceAll(contents, "\r\n", "\n"));
    }

    catch ($e) {
    }

    return null;
  };

  io.writeFile = function(path, contents) {
    try {
      require("fs").writeFileSync(path, contents);
      return true;
    }

    catch ($e) {
    }

    return false;
  };

  var terminal = {};

  terminal.setColor = function(color) {
    if (process.stdout.isTTY) {
      terminal.write("\x1B[0;" + terminal.Color.toEscapeCode(color).toString() + "m");
    }
  };

  terminal.width = function() {
    return process.stdout.columns;
  };

  terminal.height = function() {
    return process.stdout.rows;
  };

  terminal.print = function(text) {
    terminal.write(text + "\n");
  };

  terminal.flush = function() {
  };

  terminal.write = function(text) {
    process.stdout.write(text);
  };

  terminal.Color = {
    DEFAULT: 0, 0: "DEFAULT",
    BOLD: 1, 1: "BOLD",
    GRAY: 2, 2: "GRAY",
    RED: 3, 3: "RED",
    GREEN: 4, 4: "GREEN",
    YELLOW: 5, 5: "YELLOW",
    BLUE: 6, 6: "BLUE",
    MAGENTA: 7, 7: "MAGENTA",
    CYAN: 8, 8: "CYAN"
  };

  terminal.Color.toEscapeCode = function(self) {
    return terminal.colorToEscapeCode[((self) | 0)];
  };

  var in_string = {};

  in_string.replaceAll = function(self, before, after) {
    return in_string.join(after, self.split(before));
  };

  in_string.join = function(self, parts) {
    return parts.join(self);
  };

  in_string.contains = function(self, value) {
    return self.indexOf(value) >= 0;
  };

  in_string.count = function(self) {
    return self.length;
  };

  in_string.get1 = function(self, index) {
    return self.charCodeAt(index);
  };

  in_string.get = function(self, index) {
    return self[index];
  };

  in_string.repeat = function(self, times) {
    var result = "";

    for (var i = 0, count1 = times; i < count1; i += 1) {
      result += self;
    }

    return result;
  };

  in_string.fromCodeUnit = function(x) {
    return String.fromCharCode(x);
  };

  in_string.codePoints = function(self) {
    if (unicode.STRING_ENCODING === unicode.Encoding.UTF32) {
      return self.codeUnits();
    }

    else {
      var codePoints = [];
      var instance = unicode.StringIterator.INSTANCE;
      instance.reset(self, 0);

      while (true) {
        var codePoint = instance.nextCodePoint();

        if (codePoint < 0) {
          return codePoints;
        }

        in_List.append1(codePoints, codePoint);
      }
    }
  };

  in_string.fromCodePoints = function(codePoints) {
    if (unicode.STRING_ENCODING === unicode.Encoding.UTF8) {
      var builder = in_StringBuilder.$new();

      for (var i = 0, list = codePoints, count1 = in_List.count(list); i < count1; ++i) {
        var codePoint = list[i];

        if (codePoint < 128) {
          in_StringBuilder.append(builder, in_string.fromCodeUnit(codePoint));
        }

        else {
          if (codePoint < 2048) {
            in_StringBuilder.append(builder, in_string.fromCodeUnit(codePoint >> 6 & 31 | 192));
          }

          else {
            if (codePoint < 65536) {
              in_StringBuilder.append(builder, in_string.fromCodeUnit(codePoint >> 12 & 15 | 224));
            }

            else {
              in_StringBuilder.append(builder, in_string.fromCodeUnit(codePoint >> 18 & 7 | 240));
              in_StringBuilder.append(builder, in_string.fromCodeUnit(codePoint >> 12 & 63 | 128));
            }

            in_StringBuilder.append(builder, in_string.fromCodeUnit(codePoint >> 6 & 63 | 128));
          }

          in_StringBuilder.append(builder, in_string.fromCodeUnit(codePoint & 63 | 128));
        }
      }

      return in_StringBuilder.toString(builder);
    }

    else if (unicode.STRING_ENCODING === unicode.Encoding.UTF16) {
      var builder = in_StringBuilder.$new();

      for (var i1 = 0, list1 = codePoints, count2 = in_List.count(list1); i1 < count2; ++i1) {
        var codePoint = list1[i1];

        if (codePoint < 65536) {
          in_StringBuilder.append(builder, in_string.fromCodeUnit(codePoint));
        }

        else {
          var adjusted = codePoint - 65536;
          in_StringBuilder.append(builder, in_string.fromCodeUnit((adjusted >> 10) + 55296));
          in_StringBuilder.append(builder, in_string.fromCodeUnit((adjusted & (1 << 10) - 1) + 56320));
        }
      }

      return in_StringBuilder.toString(builder);
    }

    else {
      return string.fromCodeUnits(codePoints);
    }
  };

  var in_List = {};

  in_List.append1 = function(self, value) {
    self.push(value);
  };

  in_List.count = function(self) {
    return self.length;
  };

  in_List.isEqualTo = function(self, other) {
    if (in_List.count(self) !== in_List.count(other)) {
      return false;
    }

    for (var i = 0, count1 = in_List.count(self); i < count1; i += 1) {
      if (self[i] !== other[i]) {
        return false;
      }
    }

    return true;
  };

  in_List.contains = function(self, value) {
    return self.indexOf(value) >= 0;
  };

  in_List.isEmpty = function(self) {
    return in_List.count(self) === 0;
  };

  in_List.first = function(self) {
    return self[0];
  };

  in_List.last = function(self) {
    return self[in_List.count(self) - 1];
  };

  in_List.prepend1 = function(self, value) {
    self.unshift(value);
  };

  in_List.prepend2 = function(self, values) {
    var count = in_List.count(values);

    for (var i = 0, count1 = count; i < count1; i += 1) {
      in_List.prepend1(self, values[count - i - 1]);
    }
  };

  in_List.append2 = function(self, values) {
    for (var i = 0, list = values, count1 = in_List.count(list); i < count1; ++i) {
      var value = list[i];
      in_List.append1(self, value);
    }
  };

  in_List.removeLast = function(self) {
    self.pop();
  };

  in_List.takeLast = function(self) {
    return self.pop();
  };

  in_List.swap = function(self, i, j) {
    var temp = self[i];
    self[i] = self[j];
    self[j] = temp;
  };

  in_List.insert = function(self, index, value) {
    self.splice(index, 0, value);
  };

  in_List.removeAt = function(self, index) {
    self.splice(index, 1);
  };

  in_List.removeOne = function(self, value) {
    var index = self.indexOf(value);

    if (index >= 0) {
      in_List.removeAt(self, index);
    }
  };

  in_List.clone = function(self) {
    return self.slice();
  };

  var in_StringBuilder = {};

  in_StringBuilder.$new = function() {
    return {"buffer": ""};
  };

  in_StringBuilder.append = function(self, x) {
    self.buffer += x;
  };

  in_StringBuilder.toString = function(self) {
    return self.buffer;
  };

  var in_StringMap = {};

  in_StringMap.$new = function() {
    return Object.create(null);
  };

  in_StringMap.insert = function(self, key, value) {
    self[key] = value;
    return self;
  };

  in_StringMap.get = function(self, key, value) {
    return key in self ? self[key] : value;
  };

  in_StringMap.values = function(self) {
    var values = [];

    for (var key in self) {
      in_List.append1(values, self[key]);
    }

    return values;
  };

  var in_IntMap = {};

  in_IntMap.$new = function() {
    return Object.create(null);
  };

  in_IntMap.insert = function(self, key, value) {
    self[key] = value;
    return self;
  };

  in_IntMap.get = function(self, key, value) {
    return key in self ? self[key] : value;
  };

  in_IntMap.values = function(self) {
    var values = [];

    for (var key in self) {
      in_List.append1(values, self[key]);
    }

    return values;
  };

  var NATIVE_LIBRARY = "\ndef @deprecated\ndef @deprecated(message string)\ndef @entry\ndef @export\ndef @import\ndef @prefer\ndef @private\ndef @protected\ndef @rename(name string)\ndef @skip\n\n@import\nnamespace Math {\n  def abs(x double) double\n  def abs(x int) int\n  def acos(x double) double\n  def asin(x double) double\n  def atan(x double) double\n  def atan2(x double, y double) double\n  def ceil(x double) double\n  def cos(x double) double\n  def exp(x double) double\n  def floor(x double) double\n  def log(x double) double\n  def pow(x double, y double) double\n  def random double\n  def round(x double) double\n  def sin(x double) double\n  def sqrt(x double) double\n  def tan(x double) double\n\n  @prefer\n  def max(x double, y double) double\n  def max(x int, y int) int\n\n  @prefer\n  def min(x double, y double) double\n  def min(x int, y int) int\n\n  const E = 2.718281828459045\n  const PI = 3.141592653589793\n}\n\n@import\nclass bool {\n  def ! bool\n  def toString string\n}\n\n@import\nclass int {\n  def + int\n  def ++\n  def - int\n  def --\n  def toString string\n  def ~ int\n\n  def %(x int) int\n  def &(x int) int\n  def *(x int) int\n  def +(x int) int\n  def -(x int) int\n  def /(x int) int\n  def <<(x int) int\n  def <=>(x int) int\n  def >>(x int) int\n  def ^(x int) int\n  def |(x int) int\n\n  def %=(x int)\n  def &=(x int)\n  def *=(x int)\n  def +=(x int)\n  def -=(x int)\n  def /=(x int)\n  def <<=(x int)\n  def >>=(x int)\n  def ^=(x int)\n  def |=(x int)\n}\n\n@import\nclass double {\n  def + double\n  def ++\n  def - double\n  def --\n  def toString string\n\n  def *(x double) double\n  def **(x double) double\n  def +(x double) double\n  def -(x double) double\n  def /(x double) double\n  def <=>(x double) double\n\n  def **=(x double)\n  def *=(x double)\n  def +=(x double)\n  def -=(x double)\n  def /=(x double)\n}\n\n@import\nclass string {\n  def +(x string) string\n  def +=(x string)\n  def <=>(x string) int\n  def [](x int) int\n  def get(x int) string\n  def codePoints List<int>\n  def codeUnits List<int>\n  def count int\n  def endsWith(x string) bool\n  def in(x string) bool\n  def indexOf(x string) int\n  def join(x List<string>) string\n  def lastIndexOf(x string) int\n  def repeat(x int) string\n  def replaceAll(before string, after string) string\n  def slice(start int, end int) string\n  def split(x string) List<string>\n  def startsWith(x string) bool\n}\n\nnamespace string {\n  def fromCodePoint(x int) string\n  def fromCodePoints(x List<int>) string\n  def fromCodeUnit(x int) string\n  def fromCodeUnits(x List<int>) string\n}\n\n@import\nclass StringBuilder {\n  def append(x string)\n  def new\n  def toString string\n}\n\n@import\nclass List<T> {\n  def [...](x T) List<T>\n  def [](x int) T\n  def []=(x int, y T)\n  def all(x fn(T) bool) bool\n  def any(x fn(T) bool) bool\n  def appendOne(x T)\n  def clone List<T>\n  def count int\n  def each(x fn(T))\n  def filter(x fn(T) bool) List<T>\n  def first T\n  def in(x T) bool\n  def indexOf(x T) int\n  def insert(x int, value T)\n  def isEmpty bool\n  def isEqualTo(other List<T>) bool\n  def last T\n  def lastIndexOf(x T) int\n  def map<R>(x fn(T) R) List<R>\n  def new\n  def removeAll(x T)\n  def removeAt(x int)\n  def removeDuplicates\n  def removeFirst\n  def removeLast\n  def removeOne(x T)\n  def removeRange(start int, end int)\n  def resize(size int, defaultValue T)\n  def reverse\n  def shuffle\n  def slice(start int, end int) List<T>\n  def sort(x fn(T, T) int)\n  def swap(x int, y int)\n  def takeFirst T\n  def takeLast T\n  def takeRange(start int, end int) List<T>\n\n  @prefer\n  def append(x T)\n  def append(x List<T>)\n\n  @prefer\n  def prepend(x T)\n  def prepend(x List<T>)\n\n  @prefer\n  def +(x T) List<T>\n  def +(x List<T>) List<T>\n\n  @prefer\n  def +=(x T)\n  def +=(x List<T>)\n}\n\n@import\nclass StringMap<T> {\n  def [](key string) T\n  def []=(key string, value T)\n  def count int\n  def each(x fn(string, T))\n  def get(key string, defaultValue T) T\n  def in(key string) bool\n  def isEmpty bool\n  def keys List<string>\n  def new\n  def remove(key string)\n  def values List<T>\n  def {...}(key string, value T) StringMap<T>\n}\n\n@import\nclass IntMap<T> {\n  def [](key int) T\n  def []=(key int, value T)\n  def count int\n  def each(x fn(int, T))\n  def get(key int, defaultValue T) T\n  def in(key int) bool\n  def isEmpty bool\n  def keys List<int>\n  def new\n  def remove(key int)\n  def values List<T>\n  def {...}(key int, value T) IntMap<T>\n}\n\nclass Box<T> {\n  var value T\n}\n";
  skew.HEX = "0123456789ABCDEF";
  skew.operatorInfo = in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.$new(), ((skew.NodeKind.COMPLEMENT) | 0), new skew.OperatorInfo("~", skew.Precedence.UNARY_PREFIX, skew.Associativity.NONE, skew.OperatorKind.OVERRIDABLE, skew.ArgumentCount.ZERO)), ((skew.NodeKind.DECREMENT) | 0), new skew.OperatorInfo("--", skew.Precedence.UNARY_PREFIX, skew.Associativity.NONE, skew.OperatorKind.OVERRIDABLE, skew.ArgumentCount.ZERO)), ((skew.NodeKind.INCREMENT) | 0), new skew.OperatorInfo("++", skew.Precedence.UNARY_PREFIX, skew.Associativity.NONE, skew.OperatorKind.OVERRIDABLE, skew.ArgumentCount.ZERO)), ((skew.NodeKind.NEGATIVE) | 0), new skew.OperatorInfo("-", skew.Precedence.UNARY_PREFIX, skew.Associativity.NONE, skew.OperatorKind.OVERRIDABLE, skew.ArgumentCount.ZERO_OR_ONE)), ((skew.NodeKind.NOT) | 0), new skew.OperatorInfo("!", skew.Precedence.UNARY_PREFIX, skew.Associativity.NONE, skew.OperatorKind.OVERRIDABLE, skew.ArgumentCount.ZERO)), ((skew.NodeKind.POSITIVE) | 0), new skew.OperatorInfo("+", skew.Precedence.UNARY_PREFIX, skew.Associativity.NONE, skew.OperatorKind.OVERRIDABLE, skew.ArgumentCount.ZERO_OR_ONE)), ((skew.NodeKind.ADD) | 0), new skew.OperatorInfo("+", skew.Precedence.ADD, skew.Associativity.LEFT, skew.OperatorKind.OVERRIDABLE, skew.ArgumentCount.ZERO_OR_ONE)), ((skew.NodeKind.BITWISE_AND) | 0), new skew.OperatorInfo("&", skew.Precedence.BITWISE_AND, skew.Associativity.LEFT, skew.OperatorKind.OVERRIDABLE, skew.ArgumentCount.ONE)), ((skew.NodeKind.BITWISE_OR) | 0), new skew.OperatorInfo("|", skew.Precedence.BITWISE_OR, skew.Associativity.LEFT, skew.OperatorKind.OVERRIDABLE, skew.ArgumentCount.ONE)), ((skew.NodeKind.BITWISE_XOR) | 0), new skew.OperatorInfo("^", skew.Precedence.BITWISE_XOR, skew.Associativity.LEFT, skew.OperatorKind.OVERRIDABLE, skew.ArgumentCount.ONE)), ((skew.NodeKind.COMPARE) | 0), new skew.OperatorInfo("<=>", skew.Precedence.COMPARE, skew.Associativity.LEFT, skew.OperatorKind.OVERRIDABLE, skew.ArgumentCount.ONE)), ((skew.NodeKind.DIVIDE) | 0), new skew.OperatorInfo("/", skew.Precedence.MULTIPLY, skew.Associativity.LEFT, skew.OperatorKind.OVERRIDABLE, skew.ArgumentCount.ONE)), ((skew.NodeKind.EQUAL) | 0), new skew.OperatorInfo("==", skew.Precedence.EQUAL, skew.Associativity.LEFT, skew.OperatorKind.FIXED, skew.ArgumentCount.ONE)), ((skew.NodeKind.GREATER_THAN) | 0), new skew.OperatorInfo(">", skew.Precedence.COMPARE, skew.Associativity.LEFT, skew.OperatorKind.OVERRIDABLE, skew.ArgumentCount.ONE)), ((skew.NodeKind.GREATER_THAN_OR_EQUAL) | 0), new skew.OperatorInfo(">=", skew.Precedence.COMPARE, skew.Associativity.LEFT, skew.OperatorKind.OVERRIDABLE, skew.ArgumentCount.ONE)), ((skew.NodeKind.IN) | 0), new skew.OperatorInfo("in", skew.Precedence.COMPARE, skew.Associativity.LEFT, skew.OperatorKind.OVERRIDABLE, skew.ArgumentCount.ONE)), ((skew.NodeKind.LESS_THAN) | 0), new skew.OperatorInfo("<", skew.Precedence.COMPARE, skew.Associativity.LEFT, skew.OperatorKind.OVERRIDABLE, skew.ArgumentCount.ONE)), ((skew.NodeKind.LESS_THAN_OR_EQUAL) | 0), new skew.OperatorInfo("<=", skew.Precedence.COMPARE, skew.Associativity.LEFT, skew.OperatorKind.OVERRIDABLE, skew.ArgumentCount.ONE)), ((skew.NodeKind.LOGICAL_AND) | 0), new skew.OperatorInfo("&&", skew.Precedence.LOGICAL_AND, skew.Associativity.LEFT, skew.OperatorKind.FIXED, skew.ArgumentCount.ONE)), ((skew.NodeKind.LOGICAL_OR) | 0), new skew.OperatorInfo("||", skew.Precedence.LOGICAL_OR, skew.Associativity.LEFT, skew.OperatorKind.FIXED, skew.ArgumentCount.ONE)), ((skew.NodeKind.MULTIPLY) | 0), new skew.OperatorInfo("*", skew.Precedence.MULTIPLY, skew.Associativity.LEFT, skew.OperatorKind.OVERRIDABLE, skew.ArgumentCount.ONE)), ((skew.NodeKind.NOT_EQUAL) | 0), new skew.OperatorInfo("!=", skew.Precedence.EQUAL, skew.Associativity.LEFT, skew.OperatorKind.FIXED, skew.ArgumentCount.ONE)), ((skew.NodeKind.POWER) | 0), new skew.OperatorInfo("**", skew.Precedence.UNARY_PREFIX, skew.Associativity.RIGHT, skew.OperatorKind.OVERRIDABLE, skew.ArgumentCount.ONE)), ((skew.NodeKind.REMAINDER) | 0), new skew.OperatorInfo("%", skew.Precedence.MULTIPLY, skew.Associativity.LEFT, skew.OperatorKind.OVERRIDABLE, skew.ArgumentCount.ONE)), ((skew.NodeKind.SHIFT_LEFT) | 0), new skew.OperatorInfo("<<", skew.Precedence.SHIFT, skew.Associativity.LEFT, skew.OperatorKind.OVERRIDABLE, skew.ArgumentCount.ONE)), ((skew.NodeKind.SHIFT_RIGHT) | 0), new skew.OperatorInfo(">>", skew.Precedence.SHIFT, skew.Associativity.LEFT, skew.OperatorKind.OVERRIDABLE, skew.ArgumentCount.ONE)), ((skew.NodeKind.SUBTRACT) | 0), new skew.OperatorInfo("-", skew.Precedence.ADD, skew.Associativity.LEFT, skew.OperatorKind.OVERRIDABLE, skew.ArgumentCount.ZERO_OR_ONE)), ((skew.NodeKind.ASSIGN) | 0), new skew.OperatorInfo("=", skew.Precedence.ASSIGN, skew.Associativity.RIGHT, skew.OperatorKind.FIXED, skew.ArgumentCount.ONE)), ((skew.NodeKind.ASSIGN_ADD) | 0), new skew.OperatorInfo("+=", skew.Precedence.ASSIGN, skew.Associativity.RIGHT, skew.OperatorKind.OVERRIDABLE, skew.ArgumentCount.ONE)), ((skew.NodeKind.ASSIGN_BITWISE_AND) | 0), new skew.OperatorInfo("&=", skew.Precedence.ASSIGN, skew.Associativity.RIGHT, skew.OperatorKind.OVERRIDABLE, skew.ArgumentCount.ONE)), ((skew.NodeKind.ASSIGN_BITWISE_OR) | 0), new skew.OperatorInfo("|=", skew.Precedence.ASSIGN, skew.Associativity.RIGHT, skew.OperatorKind.OVERRIDABLE, skew.ArgumentCount.ONE)), ((skew.NodeKind.ASSIGN_BITWISE_XOR) | 0), new skew.OperatorInfo("^=", skew.Precedence.ASSIGN, skew.Associativity.RIGHT, skew.OperatorKind.OVERRIDABLE, skew.ArgumentCount.ONE)), ((skew.NodeKind.ASSIGN_DIVIDE) | 0), new skew.OperatorInfo("/=", skew.Precedence.ASSIGN, skew.Associativity.RIGHT, skew.OperatorKind.OVERRIDABLE, skew.ArgumentCount.ONE)), ((skew.NodeKind.ASSIGN_MULTIPLY) | 0), new skew.OperatorInfo("*=", skew.Precedence.ASSIGN, skew.Associativity.RIGHT, skew.OperatorKind.OVERRIDABLE, skew.ArgumentCount.ONE)), ((skew.NodeKind.ASSIGN_POWER) | 0), new skew.OperatorInfo("**=", skew.Precedence.ASSIGN, skew.Associativity.RIGHT, skew.OperatorKind.OVERRIDABLE, skew.ArgumentCount.ONE)), ((skew.NodeKind.ASSIGN_REMAINDER) | 0), new skew.OperatorInfo("%=", skew.Precedence.ASSIGN, skew.Associativity.RIGHT, skew.OperatorKind.OVERRIDABLE, skew.ArgumentCount.ONE)), ((skew.NodeKind.ASSIGN_SHIFT_LEFT) | 0), new skew.OperatorInfo("<<=", skew.Precedence.ASSIGN, skew.Associativity.RIGHT, skew.OperatorKind.OVERRIDABLE, skew.ArgumentCount.ONE)), ((skew.NodeKind.ASSIGN_SHIFT_RIGHT) | 0), new skew.OperatorInfo(">>=", skew.Precedence.ASSIGN, skew.Associativity.RIGHT, skew.OperatorKind.OVERRIDABLE, skew.ArgumentCount.ONE)), ((skew.NodeKind.ASSIGN_SUBTRACT) | 0), new skew.OperatorInfo("-=", skew.Precedence.ASSIGN, skew.Associativity.RIGHT, skew.OperatorKind.OVERRIDABLE, skew.ArgumentCount.ONE)), ((skew.NodeKind.ASSIGN_INDEX) | 0), new skew.OperatorInfo("[]=", skew.Precedence.MEMBER, skew.Associativity.NONE, skew.OperatorKind.OVERRIDABLE, skew.ArgumentCount.TWO_OR_MORE)), ((skew.NodeKind.INDEX) | 0), new skew.OperatorInfo("[]", skew.Precedence.MEMBER, skew.Associativity.NONE, skew.OperatorKind.OVERRIDABLE, skew.ArgumentCount.ONE_OR_MORE));
  skew.argumentCounts = null;
  skew.yy_accept = [skew.TokenKind.YY_INVALID_ACTION, skew.TokenKind.YY_INVALID_ACTION, skew.TokenKind.YY_INVALID_ACTION, skew.TokenKind.END_OF_FILE, skew.TokenKind.ERROR, skew.TokenKind.WHITESPACE, skew.TokenKind.NEWLINE, skew.TokenKind.NOT, skew.TokenKind.ERROR, skew.TokenKind.COMMENT, skew.TokenKind.REMAINDER, skew.TokenKind.BITWISE_AND, skew.TokenKind.ERROR, skew.TokenKind.LEFT_PARENTHESIS, skew.TokenKind.RIGHT_PARENTHESIS, skew.TokenKind.MULTIPLY, skew.TokenKind.PLUS, skew.TokenKind.COMMA, skew.TokenKind.MINUS, skew.TokenKind.DOT, skew.TokenKind.DIVIDE, skew.TokenKind.INT, skew.TokenKind.INT, skew.TokenKind.COLON, skew.TokenKind.LESS_THAN, skew.TokenKind.ASSIGN, skew.TokenKind.GREATER_THAN, skew.TokenKind.QUESTION_MARK, skew.TokenKind.ERROR, skew.TokenKind.IDENTIFIER, skew.TokenKind.LEFT_BRACKET, skew.TokenKind.RIGHT_BRACKET, skew.TokenKind.BITWISE_XOR, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.LEFT_BRACE, skew.TokenKind.BITWISE_OR, skew.TokenKind.RIGHT_BRACE, skew.TokenKind.TILDE, skew.TokenKind.WHITESPACE, skew.TokenKind.NEWLINE, skew.TokenKind.NOT_EQUAL, skew.TokenKind.YY_INVALID_ACTION, skew.TokenKind.STRING, skew.TokenKind.YY_INVALID_ACTION, skew.TokenKind.COMMENT, skew.TokenKind.COMMENT, skew.TokenKind.ASSIGN_REMAINDER, skew.TokenKind.LOGICAL_AND, skew.TokenKind.ASSIGN_BITWISE_AND, skew.TokenKind.YY_INVALID_ACTION, skew.TokenKind.CHARACTER, skew.TokenKind.YY_INVALID_ACTION, skew.TokenKind.POWER, skew.TokenKind.ASSIGN_MULTIPLY, skew.TokenKind.INCREMENT, skew.TokenKind.ASSIGN_PLUS, skew.TokenKind.DECREMENT, skew.TokenKind.ASSIGN_MINUS, skew.TokenKind.DOT_DOT, skew.TokenKind.ASSIGN_DIVIDE, skew.TokenKind.YY_INVALID_ACTION, skew.TokenKind.INT, skew.TokenKind.YY_INVALID_ACTION, skew.TokenKind.YY_INVALID_ACTION, skew.TokenKind.YY_INVALID_ACTION, skew.TokenKind.YY_INVALID_ACTION, skew.TokenKind.SHIFT_LEFT, skew.TokenKind.LESS_THAN_OR_EQUAL, skew.TokenKind.EQUAL, skew.TokenKind.ARROW, skew.TokenKind.GREATER_THAN_OR_EQUAL, skew.TokenKind.SHIFT_RIGHT, skew.TokenKind.ANNOTATION, skew.TokenKind.IDENTIFIER, skew.TokenKind.YY_INVALID_ACTION, skew.TokenKind.INDEX, skew.TokenKind.YY_INVALID_ACTION, skew.TokenKind.ASSIGN_BITWISE_XOR, skew.TokenKind.AS, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IF, skew.TokenKind.IN, skew.TokenKind.IS, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.YY_INVALID_ACTION, skew.TokenKind.YY_INVALID_ACTION, skew.TokenKind.ASSIGN_BITWISE_OR, skew.TokenKind.LOGICAL_OR, skew.TokenKind.ASSIGN_POWER, skew.TokenKind.DOUBLE, skew.TokenKind.YY_INVALID_ACTION, skew.TokenKind.DOUBLE, skew.TokenKind.INT_BINARY, skew.TokenKind.INT_OCTAL, skew.TokenKind.INT_HEX, skew.TokenKind.ASSIGN_SHIFT_LEFT, skew.TokenKind.COMPARE, skew.TokenKind.ASSIGN_SHIFT_RIGHT, skew.TokenKind.ANNOTATION, skew.TokenKind.YY_INVALID_ACTION, skew.TokenKind.ASSIGN_INDEX, skew.TokenKind.YY_INVALID_ACTION, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.DEF, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.FOR, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.TRY, skew.TokenKind.VAR, skew.TokenKind.IDENTIFIER, skew.TokenKind.YY_INVALID_ACTION, skew.TokenKind.YY_INVALID_ACTION, skew.TokenKind.YY_INVALID_ACTION, skew.TokenKind.YY_INVALID_ACTION, skew.TokenKind.IDENTIFIER, skew.TokenKind.CASE, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.ELSE, skew.TokenKind.ENUM, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.NULL, skew.TokenKind.OVER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.TRUE, skew.TokenKind.IDENTIFIER, skew.TokenKind.YY_INVALID_ACTION, skew.TokenKind.YY_INVALID_ACTION, skew.TokenKind.LIST, skew.TokenKind.LIST_NEW, skew.TokenKind.BREAK, skew.TokenKind.CATCH, skew.TokenKind.CLASS, skew.TokenKind.CONST, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.FALSE, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.SUPER, skew.TokenKind.IDENTIFIER, skew.TokenKind.THROW, skew.TokenKind.WHILE, skew.TokenKind.SET, skew.TokenKind.SET_NEW, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.RETURN, skew.TokenKind.SWITCH, skew.TokenKind.IDENTIFIER, skew.TokenKind.DEFAULT, skew.TokenKind.DYNAMIC, skew.TokenKind.FINALLY, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.CONTINUE, skew.TokenKind.IDENTIFIER, skew.TokenKind.IDENTIFIER, skew.TokenKind.INTERFACE, skew.TokenKind.NAMESPACE, skew.TokenKind.YY_INVALID_ACTION];
  skew.yy_ec = [0, 1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 4, 5, 6, 1, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 20, 20, 20, 20, 20, 21, 21, 22, 1, 23, 24, 25, 26, 27, 28, 28, 28, 28, 29, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 31, 32, 33, 34, 30, 1, 35, 36, 37, 38, 39, 40, 30, 41, 42, 30, 43, 44, 45, 46, 47, 48, 30, 49, 50, 51, 52, 53, 54, 55, 56, 30, 57, 58, 59, 60, 1];
  skew.yy_meta = [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 3, 3, 4, 1, 1, 1, 1, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 1, 1, 1, 1];
  skew.yy_base = [0, 0, 0, 306, 307, 303, 59, 280, 58, 300, 278, 56, 56, 307, 307, 54, 55, 307, 52, 285, 276, 75, 53, 307, 60, 61, 73, 307, 0, 0, 54, 307, 275, 248, 248, 66, 50, 31, 70, 69, 64, 243, 256, 66, 80, 259, 252, 86, 79, 307, 307, 290, 105, 307, 118, 307, 288, 287, 307, 307, 307, 307, 115, 307, 286, 264, 307, 307, 307, 307, 307, 307, 307, 107, 115, 138, 120, 122, 0, 263, 261, 307, 307, 307, 261, 0, 0, 268, 259, 243, 307, 0, 242, 95, 245, 233, 238, 231, 226, 223, 230, 227, 223, 0, 220, 0, 225, 225, 229, 216, 218, 223, 215, 96, 214, 220, 245, 221, 307, 307, 307, 142, 146, 150, 154, 156, 0, 307, 307, 307, 0, 243, 307, 204, 222, 217, 218, 204, 127, 218, 217, 212, 205, 199, 213, 0, 208, 207, 201, 195, 191, 203, 190, 193, 200, 0, 0, 194, 221, 182, 202, 201, 190, 0, 191, 181, 179, 187, 176, 182, 0, 0, 187, 181, 175, 173, 0, 0, 173, 172, 183, 165, 0, 179, 158, 157, 307, 307, 0, 0, 0, 0, 169, 170, 171, 0, 168, 171, 162, 163, 0, 167, 0, 0, 307, 307, 155, 155, 168, 148, 168, 167, 0, 0, 162, 0, 0, 0, 118, 112, 0, 104, 42, 0, 0, 307, 178, 182, 186, 188, 191, 194, 196];
  skew.yy_def = [0, 225, 1, 225, 225, 225, 225, 225, 226, 227, 225, 225, 228, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 229, 230, 225, 225, 225, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 225, 225, 225, 225, 225, 225, 225, 226, 225, 226, 227, 225, 225, 225, 225, 228, 225, 228, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 231, 225, 225, 225, 225, 225, 225, 232, 230, 225, 225, 225, 225, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 231, 225, 225, 225, 232, 225, 225, 225, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 225, 225, 225, 225, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 225, 225, 225, 225, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 225, 225, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 0, 225, 225, 225, 225, 225, 225, 225];
  skew.yy_nxt = [0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 22, 22, 23, 24, 25, 26, 27, 28, 29, 29, 29, 30, 4, 31, 32, 33, 34, 35, 36, 37, 38, 29, 39, 29, 29, 29, 40, 41, 29, 42, 43, 44, 29, 45, 46, 29, 29, 47, 48, 49, 50, 52, 52, 55, 60, 63, 65, 69, 67, 73, 87, 74, 74, 74, 74, 98, 70, 99, 66, 68, 61, 224, 75, 79, 80, 81, 82, 88, 64, 96, 56, 73, 75, 74, 74, 74, 74, 83, 84, 106, 89, 93, 116, 118, 75, 100, 97, 52, 52, 103, 94, 76, 101, 95, 75, 104, 107, 102, 110, 105, 111, 112, 77, 55, 63, 121, 121, 121, 121, 113, 78, 73, 117, 74, 74, 74, 74, 119, 124, 124, 125, 125, 125, 223, 75, 135, 136, 64, 154, 222, 56, 122, 155, 122, 75, 221, 123, 123, 123, 123, 121, 121, 121, 121, 123, 123, 123, 123, 123, 123, 123, 123, 124, 124, 125, 125, 125, 166, 167, 54, 54, 54, 54, 57, 57, 57, 57, 62, 62, 62, 62, 85, 85, 86, 86, 86, 126, 126, 130, 130, 130, 220, 219, 218, 217, 216, 215, 214, 213, 212, 211, 210, 209, 208, 207, 206, 205, 204, 203, 202, 201, 200, 199, 198, 197, 196, 195, 194, 193, 192, 191, 190, 189, 188, 187, 186, 185, 184, 183, 182, 181, 180, 179, 178, 177, 176, 175, 174, 173, 172, 171, 170, 169, 168, 165, 164, 163, 162, 161, 160, 159, 158, 157, 156, 153, 152, 151, 150, 149, 148, 147, 146, 145, 144, 143, 142, 141, 140, 139, 138, 137, 134, 133, 132, 131, 129, 128, 127, 120, 225, 58, 225, 51, 115, 114, 109, 108, 92, 91, 90, 72, 71, 59, 58, 53, 51, 225, 3, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225];
  skew.yy_chk = [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 6, 6, 8, 11, 12, 15, 18, 16, 22, 30, 22, 22, 22, 22, 37, 18, 37, 15, 16, 11, 222, 22, 24, 24, 25, 25, 30, 12, 36, 8, 21, 22, 21, 21, 21, 21, 26, 26, 40, 30, 35, 47, 48, 21, 38, 36, 52, 52, 39, 35, 21, 38, 35, 21, 39, 40, 38, 43, 39, 43, 44, 21, 54, 62, 73, 73, 73, 73, 44, 21, 74, 47, 74, 74, 74, 74, 48, 76, 76, 77, 77, 77, 221, 74, 93, 93, 62, 113, 219, 54, 75, 113, 75, 74, 218, 75, 75, 75, 75, 121, 121, 121, 121, 122, 122, 122, 122, 123, 123, 123, 123, 124, 124, 125, 125, 125, 138, 138, 226, 226, 226, 226, 227, 227, 227, 227, 228, 228, 228, 228, 229, 229, 230, 230, 230, 231, 231, 232, 232, 232, 214, 211, 210, 209, 208, 207, 206, 201, 199, 198, 197, 196, 194, 193, 192, 185, 184, 183, 181, 180, 179, 178, 175, 174, 173, 172, 169, 168, 167, 166, 165, 164, 162, 161, 160, 159, 158, 157, 154, 153, 152, 151, 150, 149, 148, 147, 146, 144, 143, 142, 141, 140, 139, 137, 136, 135, 134, 133, 131, 117, 116, 115, 114, 112, 111, 110, 109, 108, 107, 106, 104, 102, 101, 100, 99, 98, 97, 96, 95, 94, 92, 89, 88, 87, 84, 80, 79, 65, 64, 57, 56, 51, 46, 45, 42, 41, 34, 33, 32, 20, 19, 10, 9, 7, 5, 3, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225];
  skew.REMOVE_NEWLINE_BEFORE = in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.$new(), ((skew.TokenKind.COLON) | 0), 0), ((skew.TokenKind.COMMA) | 0), 0), ((skew.TokenKind.QUESTION_MARK) | 0), 0), ((skew.TokenKind.RIGHT_BRACKET) | 0), 0), ((skew.TokenKind.RIGHT_PARENTHESIS) | 0), 0);
  skew.KEEP_NEWLINE_BEFORE = in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.$new(), ((skew.TokenKind.ANNOTATION) | 0), 0), ((skew.TokenKind.CLASS) | 0), 0), ((skew.TokenKind.COMMENT) | 0), 0), ((skew.TokenKind.DEF) | 0), 0), ((skew.TokenKind.INTERFACE) | 0), 0), ((skew.TokenKind.NAMESPACE) | 0), 0), ((skew.TokenKind.VAR) | 0), 0);
  skew.REMOVE_NEWLINE_AFTER = in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.$new(), ((skew.TokenKind.COLON) | 0), 0), ((skew.TokenKind.COMMA) | 0), 0), ((skew.TokenKind.NEWLINE) | 0), 0), ((skew.TokenKind.QUESTION_MARK) | 0), 0), ((skew.TokenKind.LEFT_BRACE) | 0), 0), ((skew.TokenKind.LEFT_BRACKET) | 0), 0), ((skew.TokenKind.LEFT_PARENTHESIS) | 0), 0), ((skew.TokenKind.BITWISE_AND) | 0), 0), ((skew.TokenKind.BITWISE_OR) | 0), 0), ((skew.TokenKind.BITWISE_XOR) | 0), 0), ((skew.TokenKind.DIVIDE) | 0), 0), ((skew.TokenKind.EQUAL) | 0), 0), ((skew.TokenKind.GREATER_THAN) | 0), 0), ((skew.TokenKind.GREATER_THAN_OR_EQUAL) | 0), 0), ((skew.TokenKind.LESS_THAN) | 0), 0), ((skew.TokenKind.LESS_THAN_OR_EQUAL) | 0), 0), ((skew.TokenKind.LOGICAL_AND) | 0), 0), ((skew.TokenKind.LOGICAL_OR) | 0), 0), ((skew.TokenKind.MINUS) | 0), 0), ((skew.TokenKind.MULTIPLY) | 0), 0), ((skew.TokenKind.NOT_EQUAL) | 0), 0), ((skew.TokenKind.PLUS) | 0), 0), ((skew.TokenKind.REMAINDER) | 0), 0), ((skew.TokenKind.SHIFT_LEFT) | 0), 0), ((skew.TokenKind.SHIFT_RIGHT) | 0), 0), ((skew.TokenKind.ASSIGN) | 0), 0), ((skew.TokenKind.ASSIGN_PLUS) | 0), 0), ((skew.TokenKind.ASSIGN_BITWISE_AND) | 0), 0), ((skew.TokenKind.ASSIGN_BITWISE_OR) | 0), 0), ((skew.TokenKind.ASSIGN_BITWISE_XOR) | 0), 0), ((skew.TokenKind.ASSIGN_DIVIDE) | 0), 0), ((skew.TokenKind.ASSIGN_MULTIPLY) | 0), 0), ((skew.TokenKind.ASSIGN_REMAINDER) | 0), 0), ((skew.TokenKind.ASSIGN_SHIFT_LEFT) | 0), 0), ((skew.TokenKind.ASSIGN_SHIFT_RIGHT) | 0), 0), ((skew.TokenKind.ASSIGN_MINUS) | 0), 0);
  skew.DEFAULT_ERROR_LIMIT = 10;
  skew.JsEmitter.isKeyword = in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.$new(), "apply", 0), "arguments", 0), "Boolean", 0), "break", 0), "call", 0), "case", 0), "catch", 0), "class", 0), "const", 0), "constructor", 0), "continue", 0), "Date", 0), "debugger", 0), "default", 0), "delete", 0), "do", 0), "double", 0), "else", 0), "export", 0), "extends", 0), "false", 0), "finally", 0), "float", 0), "for", 0), "Function", 0), "function", 0), "if", 0), "import", 0), "in", 0), "instanceof", 0), "int", 0), "let", 0), "new", 0), "null", 0), "Number", 0), "Object", 0), "return", 0), "String", 0), "super", 0), "this", 0), "throw", 0), "true", 0), "try", 0), "var", 0);
  skew.Node.IS_IMPLICIT_RETURN = 1 << 0;
  skew.Node.IS_INSIDE_PARENTHESES = 1 << 1;

  // Flags
  skew.Symbol.IS_AUTOMATICALLY_GENERATED = 1 << 0;
  skew.Symbol.IS_CONST = 1 << 1;
  skew.Symbol.IS_GETTER = 1 << 2;
  skew.Symbol.SHOULD_INFER_RETURN_TYPE = 1 << 3;
  skew.Symbol.IS_OVER = 1 << 4;
  skew.Symbol.IS_SETTER = 1 << 5;
  skew.Symbol.IS_VALUE_TYPE = 1 << 6;

  // Modifiers
  skew.Symbol.IS_EXPORTED = 1 << 7;
  skew.Symbol.IS_IMPORTED = 1 << 8;
  skew.Symbol.IS_PREFERRED = 1 << 9;
  skew.Symbol.IS_PRIVATE = 1 << 10;
  skew.Symbol.IS_PROTECTED = 1 << 11;
  skew.Symbol.IS_RENAMED = 1 << 12;
  skew.Symbol.IS_SKIPPED = 1 << 13;
  skew.Symbol.IS_ENTRY_POINT = 1 << 14;
  skew.Symbol.IS_DEPRECATED = 1 << 15;
  skew.Symbol.nextID = 0;
  skew.parsing.operatorOverloadTokenKinds = in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.$new(), ((skew.TokenKind.ASSIGN_BITWISE_AND) | 0), 0), ((skew.TokenKind.ASSIGN_BITWISE_OR) | 0), 0), ((skew.TokenKind.ASSIGN_BITWISE_XOR) | 0), 0), ((skew.TokenKind.ASSIGN_DIVIDE) | 0), 0), ((skew.TokenKind.ASSIGN_INDEX) | 0), 0), ((skew.TokenKind.ASSIGN_MINUS) | 0), 0), ((skew.TokenKind.ASSIGN_MULTIPLY) | 0), 0), ((skew.TokenKind.ASSIGN_PLUS) | 0), 0), ((skew.TokenKind.ASSIGN_POWER) | 0), 0), ((skew.TokenKind.ASSIGN_REMAINDER) | 0), 0), ((skew.TokenKind.ASSIGN_SHIFT_LEFT) | 0), 0), ((skew.TokenKind.ASSIGN_SHIFT_RIGHT) | 0), 0), ((skew.TokenKind.BITWISE_AND) | 0), 0), ((skew.TokenKind.BITWISE_OR) | 0), 0), ((skew.TokenKind.BITWISE_XOR) | 0), 0), ((skew.TokenKind.COMPARE) | 0), 0), ((skew.TokenKind.DECREMENT) | 0), 0), ((skew.TokenKind.DIVIDE) | 0), 0), ((skew.TokenKind.IN) | 0), 0), ((skew.TokenKind.INCREMENT) | 0), 0), ((skew.TokenKind.INDEX) | 0), 0), ((skew.TokenKind.LIST) | 0), 0), ((skew.TokenKind.MINUS) | 0), 0), ((skew.TokenKind.MULTIPLY) | 0), 0), ((skew.TokenKind.NOT) | 0), 0), ((skew.TokenKind.PLUS) | 0), 0), ((skew.TokenKind.POWER) | 0), 0), ((skew.TokenKind.REMAINDER) | 0), 0), ((skew.TokenKind.SET) | 0), 0), ((skew.TokenKind.SHIFT_LEFT) | 0), 0), ((skew.TokenKind.SHIFT_RIGHT) | 0), 0), ((skew.TokenKind.TILDE) | 0), 0);
  skew.parsing.tokenLiteral = function(kind) {
    return function(context, token) {
      return new skew.Node(kind).withRange(token.range);
    };
  };
  skew.parsing.boolLiteral = function(value) {
    return function(context, token) {
      return skew.Node.createBool(value).withRange(token.range);
    };
  };
  skew.parsing.intLiteral = function(base) {
    return function(context, token) {
      return skew.Node.createInt(skew.parsing.parseIntLiteral(token.range.toString(), base)).withRange(token.range);
    };
  };
  skew.parsing.dotInfixParselet = function(context, left) {
    context.next();
    var range = context.current().range;

    if (!context.expect(skew.TokenKind.IDENTIFIER)) {
      return null;
    }

    return skew.Node.createDot(left, range.toString()).withRange(context.spanSince(left.range)).withInternalRange(range);
  };
  skew.parsing.initializerParselet = function(context) {
    var token = context.next();
    var values = [];
    var kind = token.kind === skew.TokenKind.LEFT_BRACE || token.kind === skew.TokenKind.SET_NEW ? skew.NodeKind.INITIALIZER_SET : skew.NodeKind.INITIALIZER_LIST;

    if (token.kind === skew.TokenKind.LEFT_BRACE || token.kind === skew.TokenKind.LEFT_BRACKET) {
      var checkForColon = kind !== skew.NodeKind.INITIALIZER_LIST;
      var end = checkForColon ? skew.TokenKind.RIGHT_BRACE : skew.TokenKind.RIGHT_BRACKET;

      while (!context.peek(end)) {
        var first = skew.parsing.pratt.parse(context, skew.Precedence.LOWEST);

        if (first === null) {
          return null;
        }

        var colon = context.current();

        if (!checkForColon || in_List.isEmpty(values) && !context.peek(skew.TokenKind.COLON)) {
          in_List.append1(values, first);
          checkForColon = false;
        }

        else {
          if (!context.expect(skew.TokenKind.COLON)) {
            return null;
          }

          var second = skew.parsing.pratt.parse(context, skew.Precedence.LOWEST);

          if (second === null) {
            return null;
          }

          in_List.append1(values, skew.Node.createPair(first, second).withRange(skew.Range.span(first.range, second.range)).withInternalRange(colon.range));
          kind = skew.NodeKind.INITIALIZER_MAP;
        }

        if (!context.eat(skew.TokenKind.COMMA)) {
          break;
        }
      }

      context.eat(skew.TokenKind.NEWLINE);

      if (!context.expect(end)) {
        return null;
      }
    }

    else if (token.kind === skew.TokenKind.LIST_NEW || token.kind === skew.TokenKind.SET_NEW) {
      in_List.append1(values, skew.Node.createName("new").withRange(new skew.Range(token.range.source, token.range.start + 1, token.range.end - 1)));
    }

    return skew.Node.createInitializer(kind, values).withRange(context.spanSince(token.range));
  };
  skew.parsing.parameterizedParselet = function(context, left) {
    var token = context.next();
    var parameters = [];

    while (true) {
      var type = skew.parsing.parseType(context);

      if (type === null) {
        return null;
      }

      in_List.append1(parameters, type);

      if (!context.eat(skew.TokenKind.COMMA)) {
        break;
      }
    }

    if (!context.expect(skew.TokenKind.END_PARAMETER_LIST)) {
      return null;
    }

    return skew.Node.createParameterize(left, parameters).withRange(context.spanSince(left.range)).withInternalRange(context.spanSince(token.range));
  };
  skew.parsing.pratt = skew.parsing.createExpressionParser();
  skew.parsing.typePratt = skew.parsing.createTypeParser();
  skew.renaming.unaryPrefixes = in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.$new(), "!", "not"), "+", "positive"), "++", "increment"), "-", "negative"), "--", "decrement"), "~", "complement");
  skew.renaming.prefixes = in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.$new(), "%", "remainder"), "&", "and"), "*", "multiply"), "**", "power"), "+", "add"), "-", "subtract"), "/", "divide"), "<<", "leftShift"), "<=>", "compare"), ">>", "rightShift"), "^", "xor"), "|", "or"), "in", "contains"), "%=", "remainderUpdate"), "&=", "andUpdate"), "**=", "powerUpdate"), "*=", "multiplyUpdate"), "+=", "addUpdate"), "-=", "subtractUpdate"), "/=", "divideUpdate"), "<<=", "leftShiftUpdate"), ">>=", "rightShiftUpdate"), "^=", "xorUpdate"), "|=", "orUpdate"), "[]", "get"), "[]=", "set"), "[...]", "append"), "[new]", "new"), "{...}", "insert"), "{new}", "new");
  skew.resolving.Resolver.annotationSymbolFlags = in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.$new(), "@deprecated", skew.Symbol.IS_DEPRECATED), "@entry", skew.Symbol.IS_ENTRY_POINT), "@export", skew.Symbol.IS_EXPORTED), "@import", skew.Symbol.IS_IMPORTED), "@prefer", skew.Symbol.IS_PREFERRED), "@private", skew.Symbol.IS_PRIVATE), "@protected", skew.Symbol.IS_PROTECTED), "@rename", skew.Symbol.IS_RENAMED), "@skip", skew.Symbol.IS_SKIPPED);
  skew.Type.DYNAMIC = null;
  skew.Type.NULL = null;
  skew.Type.nextID = 0;
  skew.Environment.nextID = 0;
  unicode.STRING_ENCODING = unicode.Encoding.UTF16;
  unicode.StringIterator.INSTANCE = new unicode.StringIterator();
  terminal.colorToEscapeCode = in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.$new(), ((terminal.Color.DEFAULT) | 0), 0), ((terminal.Color.BOLD) | 0), 1), ((terminal.Color.GRAY) | 0), 90), ((terminal.Color.RED) | 0), 91), ((terminal.Color.GREEN) | 0), 92), ((terminal.Color.YELLOW) | 0), 93), ((terminal.Color.BLUE) | 0), 94), ((terminal.Color.MAGENTA) | 0), 95), ((terminal.Color.CYAN) | 0), 96);

  process.exit(skew.main(process.argv.slice(2)));
}());
