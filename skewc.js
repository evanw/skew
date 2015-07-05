(function() {
  function __extends(derived, base) {
    derived.prototype = Object.create(base.prototype);
    derived.prototype.constructor = derived;
  }

  var __imul = Math.imul ? Math.imul : function(a, b) {
    var ah = a >> 16 & 65535;
    var bh = b >> 16 & 65535;
    var al = a & 65535;
    var bl = b & 65535;
    return al * bl + (ah * bl + al * bh << 16) | 0;
  };

  function assert(truth) {
    if (!truth) {
      throw Error("Assertion failed");
    }
  }

  function StringBuilder() {
    this.buffer = "";
  }

  StringBuilder.prototype.append = function(x) {
    this.buffer += x;
  };

  StringBuilder.prototype.toString = function() {
    return this.buffer;
  };

  function Box(value) {
    this.value = value;
  }

  var Skew = {};

  Skew.quoteString = function(text, quote) {
    var builder = new StringBuilder();
    var quoteString = String.fromCharCode(quote);
    var escaped = "";

    // Append long runs of unescaped characters using a single slice for speed
    var start = 0;
    builder.append(quoteString);

    for (var i = 0, count = text.length; i < count; ++i) {
      var c = text.charCodeAt(i);

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
        escaped = "\\x" + Skew.HEX[c >> 4] + Skew.HEX[c & 15];
      }

      else {
        continue;
      }

      builder.append(text.slice(start, i));
      builder.append(escaped);
      start = i + 1 | 0;
    }

    builder.append(text.slice(start, text.length));
    builder.append(quoteString);
    return builder.toString();
  };

  Skew.argumentCountForOperator = function(text) {
    if (Skew.argumentCounts === null) {
      Skew.argumentCounts = Object.create(null);

      for (var i = 0, list = in_IntMap.values(Skew.operatorInfo), count = list.length; i < count; ++i) {
        var value = list[i];
        Skew.argumentCounts[value.text] = value.count;
      }

      Skew.argumentCounts["[...]"] = Skew.ArgumentCount.ONE;
      Skew.argumentCounts["[new]"] = Skew.ArgumentCount.ZERO_OR_ONE;
      Skew.argumentCounts["{...}"] = Skew.ArgumentCount.ONE_OR_TWO;
      Skew.argumentCounts["{new}"] = Skew.ArgumentCount.TWO_OR_FEWER;
    }

    return in_StringMap.get(Skew.argumentCounts, text, Skew.ArgumentCount.ZERO_OR_MORE);
  };

  Skew.hashCombine = function(left, right) {
    return left ^ ((right - 1640531527 | 0) + (left << 6) | 0) + (left >> 2);
  };

  // This is the inner loop from "flex", an ancient lexer generator. The output
  // of flex is pretty bad (obfuscated variable names and the opposite of modular
  // code) but it's fast and somewhat standard for compiler design. The code below
  // replaces a simple hand-coded lexer and offers much better performance.
  Skew.tokenize = function(log, source) {
    var tokens = [];
    var text = source.contents;
    var text_length = text.length;

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

        var c = text.charCodeAt(yy_cp);
        var index = c < 127 ? c : 127;
        var yy_c = Skew.yy_ec[index];

        if (Skew.yy_accept[yy_current_state] !== Skew.TokenKind.YY_INVALID_ACTION) {
          yy_last_accepting_state = yy_current_state;
          yy_last_accepting_cpos = yy_cp;
        }

        while (Skew.yy_chk[Skew.yy_base[yy_current_state] + yy_c | 0] !== yy_current_state) {
          yy_current_state = Skew.yy_def[yy_current_state];

          if (yy_current_state >= 226) {
            yy_c = Skew.yy_meta[yy_c];
          }
        }

        yy_current_state = Skew.yy_nxt[Skew.yy_base[yy_current_state] + yy_c | 0];
        ++yy_cp;
      }

      // Find the action
      var yy_act = Skew.yy_accept[yy_current_state];

      while (yy_act === Skew.TokenKind.YY_INVALID_ACTION) {
        // Have to back up
        yy_cp = yy_last_accepting_cpos;
        yy_current_state = yy_last_accepting_state;
        yy_act = Skew.yy_accept[yy_current_state];
      }

      // Ignore whitespace
      if (yy_act === Skew.TokenKind.WHITESPACE) {
        continue;
      }

      // This is the default action in flex, which is usually called ECHO
      else if (yy_act === Skew.TokenKind.ERROR) {
        var iterator = Unicode.StringIterator.INSTANCE.reset(text, yy_bp);
        iterator.nextCodePoint();
        var range = new Skew.Range(source, yy_bp, iterator.index);
        log.syntaxErrorExtraData(range, range.toString());
        break;
      }

      // Ignore END_OF_FILE since this loop must still perform the last action
      else if (yy_act !== Skew.TokenKind.END_OF_FILE) {
        tokens.push(new Skew.Token(new Skew.Range(source, yy_bp, yy_cp), yy_act));

        // These tokens start with a ">" and may need to be split if we discover
        // that they should really be END_PARAMETER_LIST tokens. Save enough room
        // for these tokens to be split into pieces, that way all of the tokens
        // don't have to be shifted over repeatedly inside prepareTokens(). The
        // ">>" token may become ">" + ">", the ">=" token may become ">" + "=",
        // and the ">>=" token may become ">" + ">=" and so ">" + ">" + "=".
        if (yy_act === Skew.TokenKind.ASSIGN_SHIFT_RIGHT || yy_act === Skew.TokenKind.SHIFT_RIGHT || yy_act === Skew.TokenKind.GREATER_THAN_OR_EQUAL) {
          tokens.push(null);

          if (yy_act === Skew.TokenKind.ASSIGN_SHIFT_RIGHT) {
            tokens.push(null);
          }
        }
      }
    }

    // Every token stream ends in END_OF_FILE
    tokens.push(new Skew.Token(new Skew.Range(source, text_length, text_length), Skew.TokenKind.END_OF_FILE));

    // Also return preprocessor token presence so the preprocessor can be avoided
    return tokens;
  };

  Skew.parseFile = function(log, tokens, global) {
    var context = new Skew.ParserContext(log, tokens);
    Skew.Parsing.parseSymbols(context, global, null);
    context.expect(Skew.TokenKind.END_OF_FILE);
  };

  Skew.prepareTokens = function(tokens) {
    var previousKind = Skew.TokenKind.NULL;
    var stack = [];
    var count = 0;

    for (var i = 0, count1 = tokens.length; i < count1; ++i) {
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
      while (!(stack.length === 0)) {
        var top = in_List.last(stack);
        var topKind = top.kind;

        // Stop parsing a type if we find a token that no type expression uses
        if (topKind === Skew.TokenKind.LESS_THAN && tokenKind !== Skew.TokenKind.LESS_THAN && tokenKind !== Skew.TokenKind.IDENTIFIER && tokenKind !== Skew.TokenKind.COMMA && tokenKind !== Skew.TokenKind.DOT && tokenKind !== Skew.TokenKind.LEFT_PARENTHESIS && tokenKind !== Skew.TokenKind.RIGHT_PARENTHESIS && !tokenStartsWithGreaterThan) {
          stack.pop();
        }

        else {
          break;
        }
      }

      // Group open
      if (tokenKind === Skew.TokenKind.LEFT_PARENTHESIS || tokenKind === Skew.TokenKind.LEFT_BRACE || tokenKind === Skew.TokenKind.LEFT_BRACKET || tokenKind === Skew.TokenKind.LESS_THAN) {
        stack.push(token);
      }

      // Group close
      else if (tokenKind === Skew.TokenKind.RIGHT_PARENTHESIS || tokenKind === Skew.TokenKind.RIGHT_BRACE || tokenKind === Skew.TokenKind.RIGHT_BRACKET || tokenStartsWithGreaterThan) {
        // Search for a matching opposite token
        while (!(stack.length === 0)) {
          var top1 = in_List.last(stack);
          var topKind1 = top1.kind;

          // Don't match closing angle brackets that don't work since they are just operators
          if (tokenStartsWithGreaterThan && topKind1 !== Skew.TokenKind.LESS_THAN) {
            break;
          }

          // Consume the current token
          stack.pop();

          // Special-case angle brackets matches
          if (topKind1 === Skew.TokenKind.LESS_THAN) {
            // Remove tentative matches that didn't work out
            if (!tokenStartsWithGreaterThan) {
              continue;
            }

            // Break apart operators that start with a closing angle bracket
            if (tokenKind !== Skew.TokenKind.GREATER_THAN) {
              var range = token.range;
              var start = range.start;
              assert((i + 1 | 0) < tokens.length);
              assert(tokens[i + 1 | 0] === null);
              assert(tokenKind === Skew.TokenKind.SHIFT_RIGHT || tokenKind === Skew.TokenKind.GREATER_THAN_OR_EQUAL || tokenKind === Skew.TokenKind.ASSIGN_SHIFT_RIGHT);
              tokens[i + 1 | 0] = new Skew.Token(new Skew.Range(range.source, start + 1 | 0, range.end), tokenKind === Skew.TokenKind.SHIFT_RIGHT ? Skew.TokenKind.GREATER_THAN : tokenKind === Skew.TokenKind.GREATER_THAN_OR_EQUAL ? Skew.TokenKind.ASSIGN : Skew.TokenKind.GREATER_THAN_OR_EQUAL);
              token.range = new Skew.Range(range.source, start, start + 1 | 0);
            }

            // Convert < and > into bounds for type parameter lists
            top1.kind = Skew.TokenKind.START_PARAMETER_LIST;
            token.kind = Skew.TokenKind.END_PARAMETER_LIST;
            tokenKind = Skew.TokenKind.END_PARAMETER_LIST;
          }

          // Stop the search since we found a match
          break;
        }
      }

      // Remove newlines based on the previous token or the next token to enable
      // line continuations. Make sure to be conservative. We want to be like
      // Python, not like JavaScript ASI! Anything that is at all ambiguous
      // should be disallowed.
      if (tokenKind === Skew.TokenKind.NEWLINE && previousKind in Skew.REMOVE_NEWLINE_AFTER && !(tokens[i + 1 | 0].kind in Skew.KEEP_NEWLINE_BEFORE)) {
        --count;
        continue;
      }

      else if (previousKind === Skew.TokenKind.NEWLINE && tokenKind in Skew.REMOVE_NEWLINE_BEFORE) {
        tokens[count - 2 | 0] = token;
        --count;
      }

      previousKind = tokenKind;
    }

    // Trim off the remaining tokens due to null gap removal
    while (tokens.length > count) {
      tokens.pop();
    }
  };

  Skew.compile = function(log, options, sources) {
    var start = (typeof(performance) !== "undefined" && performance.now ? performance.now() : Date.now()) / 1000;
    var debug = !RELEASE;
    var result = new Skew.CompilerResult();

    switch (options.target) {
      case Skew.CompilerTarget.CSHARP: {
        sources.unshift(new Skew.Source("<native-cs>", Skew.NATIVE_LIBRARY_CS));
        options.define("TARGET", "CSHARP");
        break;
      }

      case Skew.CompilerTarget.JAVASCRIPT: {
        sources.unshift(new Skew.Source("<native-js>", Skew.NATIVE_LIBRARY_JS));
        options.define("TARGET", "JAVASCRIPT");
        break;
      }
    }

    sources.unshift(new Skew.Source("<native>", Skew.NATIVE_LIBRARY));

    for (var i = 0, list = sources, count = list.length; i < count; ++i) {
      var source = list[i];
      var tokens = Skew.tokenize(log, source);
      Skew.prepareTokens(tokens);
      Skew.parseFile(log, tokens, result.global);
    }

    // Merging pass, errors stop compilation
    if (!log.hasErrors()) {
      Skew.mergingPass(log, result.global);

      // Resolving pass, errors stop compilation
      if (!log.hasErrors()) {
        Skew.resolvingPass(log, result.global, result.cache, options);

        if (debug) {
          Skew.verifyHierarchy1(result.global);
        }

        // Prepare for emission, code is error-free at this point
        if (!log.hasErrors() && options.target !== Skew.CompilerTarget.NONE) {
          if (!(options.target === Skew.CompilerTarget.LISP_TREE)) {
            var graph = new Skew.CallGraph(result.global);

            // Make certain functions global
            Skew.globalizingPass(result.global, graph, options);

            if (debug) {
              Skew.verifyHierarchy1(result.global);
            }

            // Move symbols around
            Skew.motionPass(result.global, options);

            if (debug) {
              Skew.verifyHierarchy1(result.global);
            }

            // Give overloaded functions unique names, rename operator overloads
            Skew.renamingPass(result.global);

            if (debug) {
              Skew.verifyHierarchy1(result.global);
            }

            // Partial evaluation before inlining to make more functions inlineable by removing dead code
            if (options.foldAllConstants) {
              new Skew.Folding.ConstantFolder(result.cache, new Skew.Folding.ConstantCache()).visitObject(result.global);

              if (debug) {
                Skew.verifyHierarchy1(result.global);
              }
            }

            // Function inlining
            if (options.inlineAllFunctions) {
              Skew.inliningPass(graph);

              if (debug) {
                Skew.verifyHierarchy1(result.global);
              }

              // Partial evaluation after inlining will simplify inlined expressions
              if (options.foldAllConstants) {
                new Skew.Folding.ConstantFolder(result.cache, new Skew.Folding.ConstantCache()).visitObject(result.global);

                if (debug) {
                  Skew.verifyHierarchy1(result.global);
                }
              }
            }
          }

          // Emit in the target language
          var emitter = null;

          switch (options.target) {
            case Skew.CompilerTarget.CSHARP: {
              emitter = new Skew.CSharpEmitter(options, result.cache);
              break;
            }

            case Skew.CompilerTarget.JAVASCRIPT: {
              emitter = new Skew.JsEmitter(options, result.cache);
              break;
            }

            case Skew.CompilerTarget.LISP_TREE: {
              emitter = new Skew.LispTreeEmitter(options);
              break;
            }
          }

          if (emitter !== null) {
            emitter.visit(result.global);
            result.outputs = emitter.sources();
          }
        }
      }
    }

    result.totalTime = (typeof(performance) !== "undefined" && performance.now ? performance.now() : Date.now()) / 1000 - start;
    return result;
  };

  Skew.verifyHierarchy1 = function(symbol) {
    for (var i = 0, list = symbol.objects, count = list.length; i < count; ++i) {
      var object = list[i];
      Skew.verifyHierarchy1(object);
    }

    for (var i1 = 0, list1 = symbol.functions, count1 = list1.length; i1 < count1; ++i1) {
      var $function = list1[i1];
      Skew.verifyHierarchy2($function.block, null);
    }

    for (var i2 = 0, list2 = symbol.variables, count2 = list2.length; i2 < count2; ++i2) {
      var variable = list2[i2];
      Skew.verifyHierarchy2(variable.value, null);
    }
  };

  Skew.verifyHierarchy2 = function(node, parent) {
    if (node !== null) {
      assert(node.parent === parent);

      if (node.children !== null) {
        for (var i = 0, list = node.children, count = list.length; i < count; ++i) {
          var child = list[i];
          Skew.verifyHierarchy2(child, node);
        }
      }
    }
  };

  Skew.globalizingPass = function(global, graph, options) {
    var virtualLookup = options.globalizeAllFunctions ? new Skew.VirtualLookup(global) : null;

    for (var i1 = 0, list1 = graph.callInfo, count1 = list1.length; i1 < count1; ++i1) {
      var info = list1[i1];
      var symbol = info.symbol;

      // Turn certain instance functions into global functions
      if (symbol.kind === Skew.SymbolKind.FUNCTION_INSTANCE && (symbol.parent.kind === Skew.SymbolKind.OBJECT_ENUM || symbol.parent.isImported() && !symbol.isImported() || !symbol.isImportedOrExported() && virtualLookup !== null && !virtualLookup.isVirtual(symbol))) {
        var $function = symbol.asFunctionSymbol();
        $function.kind = Skew.SymbolKind.FUNCTION_GLOBAL;
        $function.$arguments.unshift($function.self);
        $function.self = null;

        // Update all call sites
        for (var i = 0, list = info.callSites, count = list.length; i < count; ++i) {
          var callSite = list[i];
          var value = callSite.callNode.callValue();

          // Rewrite "super(foo)" to "bar(self, foo)"
          if (value.kind === Skew.NodeKind.SUPER) {
            var self = callSite.enclosingFunction.self;
            value.replaceWith(new Skew.Node(Skew.NodeKind.NAME).withContent(new Skew.StringContent(self.name)).withSymbol(self));
          }

          // Rewrite "self.foo(bar)" to "foo(self, bar)"
          else {
            value.dotTarget().swapWith(value);
          }

          callSite.callNode.insertChild(0, new Skew.Node(Skew.NodeKind.NAME).withContent(new Skew.StringContent($function.name)).withSymbol($function));
        }
      }
    }
  };

  Skew.inliningPass = function(callGraph) {
    var graph = new Skew.Inlining.InliningGraph(callGraph);

    for (var i = 0, list = graph.inliningInfo, count = list.length; i < count; ++i) {
      var info = list[i];
      Skew.Inlining.inlineSymbol(graph, info);
    }
  };

  Skew.mergingPass = function(log, global) {
    Skew.Merging.mergeObject(log, null, global, global);
  };

  Skew.motionPass = function(global, options) {
    var namespaces = Object.create(null);
    Skew.Motion.functionMotion(global, options, namespaces);

    // Avoid mutation during the iteration above
    for (var i = 0, list = in_IntMap.values(namespaces), count = list.length; i < count; ++i) {
      var pair = list[i];
      pair.parent.objects.push(pair.child);
    }
  };

  Skew.renamingPass = function(global) {
    Skew.Renaming.renameObject(global);

    // Use a second pass to avoid ordering issues
    Skew.Renaming.useOverriddenNames(global);
  };

  Skew.resolvingPass = function(log, global, cache, options) {
    cache.loadGlobals(log, global);

    if (!log.hasErrors()) {
      var resolver = new Skew.Resolving.Resolver(global, options, in_StringMap.clone(options.defines), cache, log);
      resolver.constantFolder = new Skew.Folding.ConstantFolder(cache, new Skew.Resolving.ConstantResolver(resolver));
      resolver.initializeGlobals();
      resolver.iterativelyMergeGuards();
      resolver.resolveGlobal();
      resolver.removeObsoleteFunctions(global);
    }
  };

  // Remove all code that isn't reachable from the entry point or from an
  // imported or exported symbol. This is called tree shaking here but is also
  // known as dead code elimination. Tree shaking is perhaps a better name
  // because this pass doesn't remove dead code inside functions.
  Skew.shakingPass = function(global, entryPoint, mode) {
    var graph = new Skew.UsageGraph(global, mode);
    var symbols = [];
    Skew.Shaking.collectImportedOrExportedSymbols(global, symbols, entryPoint);
    var usages = graph.usagesForSymbols(symbols);

    if (usages !== null) {
      Skew.Shaking.removeUnusedSymbols(global, usages);
    }
  };

  Skew.main = function($arguments) {
    // Translate frontend flags to compiler options
    var log = new Skew.Log();
    var parser = new Skew.Options.Parser();
    var options = Skew.parseOptions(log, parser, $arguments);
    var inputs = Skew.readSources(log, parser.normalArguments);

    // Run the compilation
    if (!log.hasErrors() && options !== null) {
      options.target = Skew.CompilerTarget.JAVASCRIPT;
      var result = Skew.compile(log, options, inputs);

      // Write all outputs
      if (!log.hasErrors()) {
        for (var i = 0, list = result.outputs, count = list.length; i < count; ++i) {
          var output = list[i];

          if (!IO.writeFile(output.name, output.contents)) {
            var outputFile = parser.rangeForOption(Skew.Option.OUTPUT_FILE);
            var outputDirectory = parser.rangeForOption(Skew.Option.OUTPUT_DIRECTORY);
            log.commandLineErrorUnwritableFile(outputFile !== null ? outputFile : outputDirectory, output.name);
            break;
          }
        }
      }
    }

    // Print any errors and warnings
    Skew.printLogWithColor(log, parser.intForOption(Skew.Option.MESSAGE_LIMIT, Skew.DEFAULT_MESSAGE_LIMIT));
    return log.hasErrors() ? 1 : 0;
  };

  Skew.printWithColor = function(color, text) {
    Terminal.setColor(color);
    process.stdout.write(text);
    Terminal.setColor(Terminal.Color.DEFAULT);
  };

  Skew.printError = function(text) {
    Skew.printWithColor(Terminal.Color.RED, "error: ");
    Skew.printWithColor(Terminal.Color.BOLD, text + "\n");
  };

  Skew.printNote = function(text) {
    Skew.printWithColor(Terminal.Color.GRAY, "note: ");
    Skew.printWithColor(Terminal.Color.BOLD, text + "\n");
  };

  Skew.printWarning = function(text) {
    Skew.printWithColor(Terminal.Color.MAGENTA, "warning: ");
    Skew.printWithColor(Terminal.Color.BOLD, text + "\n");
  };

  Skew.printUsage = function(parser) {
    Skew.printWithColor(Terminal.Color.GREEN, "\nusage: ");
    Skew.printWithColor(Terminal.Color.BOLD, "skewc [flags] [inputs]\n");
    process.stdout.write(parser.usageText(Math.min(process.stdout.columns, 80)));
  };

  Skew.printLogWithColor = function(log, diagnosticLimit) {
    var terminalWidth = process.stdout.columns;
    var diagnosticCount = 0;

    for (var i = 0, list = log.diagnostics, count = list.length; i < count; ++i) {
      var diagnostic = list[i];

      if (diagnosticLimit > 0 && diagnosticCount === diagnosticLimit) {
        break;
      }

      if (diagnostic.range !== null) {
        Skew.printWithColor(Terminal.Color.BOLD, diagnostic.range.locationString() + ": ");
      }

      switch (diagnostic.kind) {
        case Skew.DiagnosticKind.WARNING: {
          Skew.printWarning(diagnostic.text);
          break;
        }

        case Skew.DiagnosticKind.ERROR: {
          Skew.printError(diagnostic.text);
          break;
        }
      }

      if (diagnostic.range !== null) {
        var formatted = diagnostic.range.format(terminalWidth);
        process.stdout.write(formatted.line + "\n");
        Skew.printWithColor(Terminal.Color.GREEN, formatted.range + "\n");
      }

      if (diagnostic.noteRange !== null) {
        Skew.printWithColor(Terminal.Color.BOLD, diagnostic.noteRange.locationString() + ": ");
        Skew.printNote(diagnostic.noteText);
        var formatted1 = diagnostic.noteRange.format(terminalWidth);
        process.stdout.write(formatted1.line + "\n");
        Skew.printWithColor(Terminal.Color.GREEN, formatted1.range + "\n");
      }

      ++diagnosticCount;
    }

    // Print the summary
    var hasErrors = log.hasErrors();
    var hasWarnings = log.hasWarnings();
    var summary = "";

    if (hasWarnings) {
      summary += log.warningCount.toString() + " warning" + (log.warningCount === 1 ? "" : "s");

      if (hasErrors) {
        summary += " and ";
      }
    }

    if (hasErrors) {
      summary += log.errorCount.toString() + " error" + (log.errorCount === 1 ? "" : "s");
    }

    if (hasWarnings || hasErrors) {
      process.stdout.write(summary + " generated");
      Skew.printWithColor(Terminal.Color.GRAY, diagnosticCount < log.diagnostics.length ? " (only showing " + diagnosticLimit.toString() + " message" + (diagnosticLimit === 1 ? "" : "s") + ", use \"--message-limit=0\" to see all)\n" : "\n");
    }
  };

  Skew.readSources = function(log, files) {
    var result = [];

    for (var i = 0, list = files, count = list.length; i < count; ++i) {
      var file = list[i];
      var path = file.toString();
      var contents = IO.readFile(path);

      if (contents === null) {
        log.commandLineErrorUnreadableFile(file, path);
      }

      else {
        result.push(new Skew.Source(path, contents.value));
      }
    }

    return result;
  };

  Skew.parseOptions = function(log, parser, $arguments) {
    // Configure the parser
    parser.define(Skew.Options.Type.BOOL, Skew.Option.HELP, "--help", "Prints this message.").aliases(["-help", "?", "-?", "-h", "-H", "/?", "/h", "/H"]);
    parser.define(Skew.Options.Type.STRING, Skew.Option.OUTPUT_FILE, "--output-file", "Combines all output into a single file. Mutually exclusive with --output-dir.");
    parser.define(Skew.Options.Type.STRING, Skew.Option.OUTPUT_DIRECTORY, "--output-dir", "Places all output files in the specified directory. Mutually exclusive with --output-file.");
    parser.define(Skew.Options.Type.BOOL, Skew.Option.RELEASE, "--release", "Implies --js-mangle, --js-minify, --fold-constants, --inline-functions, --globalize-functions, and --define:RELEASE=true.");
    parser.define(Skew.Options.Type.INT, Skew.Option.MESSAGE_LIMIT, "--message-limit", "Sets the maximum number of messages to report. Pass 0 to disable the message limit. The default is " + Skew.DEFAULT_MESSAGE_LIMIT.toString() + ".");
    parser.define(Skew.Options.Type.STRING_LIST, Skew.Option.DEFINE, "--define", "Override variable values at compile time.");
    parser.define(Skew.Options.Type.BOOL, Skew.Option.JS_MANGLE, "--js-mangle", "Transforms emitted JavaScript to be as small as possible. The \"@export\" annotation prevents renaming a symbol.");
    parser.define(Skew.Options.Type.BOOL, Skew.Option.JS_MINIFY, "--js-minify", "Remove whitespace when compiling to JavaScript.");
    parser.define(Skew.Options.Type.BOOL, Skew.Option.FOLD_CONSTANTS, "--fold-constants", "Evaluates constants at compile time and removes dead code inside functions.");
    parser.define(Skew.Options.Type.BOOL, Skew.Option.INLINE_FUNCTIONS, "--inline-functions", "Uses heuristics to automatically inline simple global functions.");
    parser.define(Skew.Options.Type.BOOL, Skew.Option.GLOBALIZE_FUNCTIONS, "--globalize-functions", "Convert instance functions to global functions for better inlining.");

    // Parse the command line arguments
    parser.parse(log, $arguments);

    if (log.hasErrors()) {
      return null;
    }

    // Early-out when printing the usage text
    if (parser.boolForOption(Skew.Option.HELP, $arguments.length === 0)) {
      Skew.printUsage(parser);
      return null;
    }

    // Set up the options for the compiler
    var options = new Skew.CompilerOptions();
    var releaseFlag = parser.boolForOption(Skew.Option.RELEASE, false);
    options.foldAllConstants = parser.boolForOption(Skew.Option.FOLD_CONSTANTS, releaseFlag);
    options.globalizeAllFunctions = parser.boolForOption(Skew.Option.GLOBALIZE_FUNCTIONS, releaseFlag);
    options.inlineAllFunctions = parser.boolForOption(Skew.Option.INLINE_FUNCTIONS, releaseFlag);
    options.jsMangle = parser.boolForOption(Skew.Option.JS_MANGLE, releaseFlag);
    options.jsMinify = parser.boolForOption(Skew.Option.JS_MINIFY, releaseFlag);

    // Prepare the defines
    if (releaseFlag) {
      options.define("RELEASE", "true");
    }

    for (var i = 0, list = parser.rangeListForOption(Skew.Option.DEFINE), count = list.length; i < count; ++i) {
      var range = list[i];
      var name = range.toString();
      var equals = name.indexOf("=");

      if (equals < 0) {
        log.commandLineErrorExpectedDefineValue(range, name);
        continue;
      }

      options.defines[name.slice(0, equals)] = new Skew.Define(range.fromStart(equals), range.fromEnd((name.length - equals | 0) - 1 | 0));
    }

    // There must be at least one source file
    var end = parser.source.contents.length;
    var trailingSpace = new Skew.Range(parser.source, end - 1 | 0, end);

    if (parser.normalArguments.length === 0) {
      log.commandLineErrorNoInputFiles(trailingSpace);
    }

    // Parse the output location
    var outputFile = parser.rangeForOption(Skew.Option.OUTPUT_FILE);
    var outputDirectory = parser.rangeForOption(Skew.Option.OUTPUT_DIRECTORY);

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

  Skew.Emitter = function() {
    this.indentAmount = "  ";
    this.indent = "";
    this._sources = [];
    this._code = "";
  };

  Skew.Emitter.prototype.sources = function() {
    return this._sources;
  };

  Skew.Emitter.prototype.increaseIndent = function() {
    this.indent += this.indentAmount;
  };

  Skew.Emitter.prototype.decreaseIndent = function() {
    this.indent = this.indent.slice(this.indentAmount.length);
  };

  Skew.Emitter.prototype.emit = function(text) {
    this._code += text;
  };

  Skew.Emitter.prototype.createSource = function(name) {
    this._sources.push(new Skew.Source(name, this._code));
    this._code = "";
  };

  Skew.Emitter.prototype.sortedObjects = function(global) {
    var objects = [];
    this.findObjects(objects, global);

    // Sort by inheritance and containment
    for (var i = 0, count = objects.length; i < count; ++i) {
      var j = i;

      // Select an object that comes before all other types
      while (j < objects.length) {
        var object = objects[j];
        var k = i;

        // Check to see if this comes before all other types
        while (k < objects.length) {
          if (j !== k && Skew.Emitter.objectComesBefore(objects[k], object)) {
            break;
          }

          ++k;
        }

        if (k === objects.length) {
          break;
        }

        ++j;
      }

      // Swap the object into the correct order
      if (j < objects.length) {
        in_List.swap(objects, i, j);
      }
    }

    return objects;
  };

  Skew.Emitter.prototype.findObjects = function(objects, object) {
    objects.push(object);

    for (var i = 0, list = object.objects, count = list.length; i < count; ++i) {
      var o = list[i];
      this.findObjects(objects, o);
    }
  };

  Skew.Emitter.isContainedBy = function(inner, outer) {
    if (inner.parent === null) {
      return false;
    }

    if (inner.parent === outer) {
      return true;
    }

    return Skew.Emitter.isContainedBy(inner.parent.asObjectSymbol(), outer);
  };

  Skew.Emitter.objectComesBefore = function(before, after) {
    if (after.hasBaseClass(before)) {
      return true;
    }

    if (Skew.Emitter.isContainedBy(after, before)) {
      return true;
    }

    return false;
  };

  Skew.CSharpEmitter = function(options, cache) {
    Skew.Emitter.call(this);
    this.options = options;
    this.cache = cache;
    this.previousNode = null;
    this.previousSymbol = null;
    this.isKeyword = in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(Object.create(null), "abstract", 0), "as", 0), "base", 0), "bool", 0), "break", 0), "byte", 0), "case", 0), "catch", 0), "char", 0), "checked", 0), "class", 0), "const", 0), "continue", 0), "decimal", 0), "default", 0), "delegate", 0), "do", 0), "double", 0), "else", 0), "enum", 0), "event", 0), "explicit", 0), "extern", 0), "false", 0), "finally", 0), "fixed", 0), "float", 0), "for", 0), "foreach", 0), "goto", 0), "if", 0), "implicit", 0), "in", 0), "in", 0), "int", 0), "interface", 0), "internal", 0), "is", 0), "lock", 0), "long", 0), "namespace", 0), "new", 0), "null", 0), "object", 0), "operator", 0), "out", 0), "out", 0), "override", 0), "params", 0), "private", 0), "protected", 0), "public", 0), "readonly", 0), "ref", 0), "return", 0), "sbyte", 0), "sealed", 0), "short", 0), "sizeof", 0), "stackalloc", 0), "static", 0), "string", 0), "struct", 0), "switch", 0), "this", 0), "throw", 0), "true", 0), "try", 0), "typeof", 0), "uint", 0), "ulong", 0), "unchecked", 0), "unsafe", 0), "ushort", 0), "using", 0), "virtual", 0), "void", 0), "volatile", 0), "while", 0);
  };

  __extends(Skew.CSharpEmitter, Skew.Emitter);

  Skew.CSharpEmitter.prototype.visit = function(global) {
    this.indentAmount = "    ";
    var globals = new Skew.ObjectSymbol(Skew.SymbolKind.OBJECT_NAMESPACE, global.scope.generateName("Globals"));
    globals.parent = global;
    global.objects.push(globals);

    // Move global functions and variables into their own namespace
    for (var i = 0, list = global.functions, count = list.length; i < count; ++i) {
      var $function = list[i];

      if ($function.kind !== Skew.SymbolKind.FUNCTION_ANNOTATION) {
        $function.parent = globals;
        globals.functions.push($function);
      }
    }

    for (var i1 = 0, list1 = global.variables, count1 = list1.length; i1 < count1; ++i1) {
      var variable = list1[i1];
      variable.parent = globals;
      globals.variables.push(variable);
    }

    // Avoid emitting unnecessary stuff
    Skew.shakingPass(global, this.cache.entryPointSymbol, Skew.ShakingMode.USE_TYPES);

    // TODO: Do this better
    // List, Dictionary
    this.emit("using System.Collections.Generic;\n");

    // Debug.Assert
    this.emit("using System.Diagnostics;\n");

    // StringBuilder
    this.emit("using System.Text;\n");
    this.emit("using System;\n");

    // All code in C# is inside objects, so just emit objects recursively
    for (var i2 = 0, list2 = global.objects, count2 = list2.length; i2 < count2; ++i2) {
      var object = list2[i2];
      this.emitObject(object);
    }

    // Emit a single file if requested
    if (this.options.outputDirectory === "") {
      this.createSource(this.options.outputFile);
    }
  };

  Skew.CSharpEmitter.prototype.emitNewlineBeforeSymbol = function(symbol) {
    if (this.previousSymbol !== null && (!Skew.SymbolKind.isVariable(this.previousSymbol.kind) || !Skew.SymbolKind.isVariable(symbol.kind) || symbol.comments !== null)) {
      this.emit("\n");
    }

    this.previousSymbol = null;
  };

  Skew.CSharpEmitter.prototype.emitNewlineAfterSymbol = function(symbol) {
    this.previousSymbol = symbol;
  };

  Skew.CSharpEmitter.prototype.isCompactNodeKind = function(kind) {
    return kind === Skew.NodeKind.EXPRESSION || kind === Skew.NodeKind.VAR || Skew.NodeKind.isJump(kind);
  };

  Skew.CSharpEmitter.prototype.emitNewlineBeforeStatement = function(node) {
    if (this.previousNode !== null && (node.comments !== null || !this.isCompactNodeKind(this.previousNode.kind) || !this.isCompactNodeKind(node.kind))) {
      this.emit("\n");
    }

    this.previousNode = null;
  };

  Skew.CSharpEmitter.prototype.emitNewlineAfterStatement = function(node) {
    this.previousNode = node;
  };

  Skew.CSharpEmitter.prototype.emitComments = function(comments) {
    if (comments !== null) {
      for (var i = 0, list = comments, count = list.length; i < count; ++i) {
        var comment = list[i];
        this.emit(this.indent + "//" + comment);
      }
    }
  };

  Skew.CSharpEmitter.prototype.emitObject = function(symbol) {
    if (symbol.isImported()) {
      return;
    }

    // Global functions and variables have to be in classes, not namespaces
    if (symbol.kind === Skew.SymbolKind.OBJECT_NAMESPACE && (!(symbol.functions.length === 0) || !(symbol.variables.length === 0) || symbol.parent.kind === Skew.SymbolKind.OBJECT_CLASS)) {
      symbol.kind = Skew.SymbolKind.OBJECT_CLASS;
    }

    this.emitNewlineBeforeSymbol(symbol);
    this.emitComments(symbol.comments);

    if (symbol.kind !== Skew.SymbolKind.OBJECT_NAMESPACE) {
      this.emit(this.indent + "public ");
    }

    switch (symbol.kind) {
      case Skew.SymbolKind.OBJECT_CLASS: {
        this.emit("class ");
        break;
      }

      case Skew.SymbolKind.OBJECT_ENUM: {
        this.emit("enum ");
        break;
      }

      case Skew.SymbolKind.OBJECT_INTERFACE: {
        this.emit("interface ");
        break;
      }

      case Skew.SymbolKind.OBJECT_NAMESPACE: {
        this.emit("namespace ");
        break;
      }

      default: {
        assert(false);
        break;
      }
    }

    this.emit(this.mangleName(symbol));
    this.emitTypeParameters(symbol.parameters);

    if (symbol.baseClass !== null) {
      this.emit(" : " + this.fullName(symbol.baseClass));
    }

    this.emit("\n" + this.indent + "{\n");
    this.increaseIndent();

    for (var i = 0, list = symbol.objects, count = list.length; i < count; ++i) {
      var object = list[i];
      this.emitObject(object);
    }

    for (var i1 = 0, list1 = symbol.variables, count1 = list1.length; i1 < count1; ++i1) {
      var variable = list1[i1];
      this.emitVariable(variable);
    }

    for (var i2 = 0, list2 = symbol.functions, count2 = list2.length; i2 < count2; ++i2) {
      var $function = list2[i2];
      this.emitFunction($function);
    }

    this.decreaseIndent();
    this.emit(this.indent + "}\n");
    this.emitNewlineAfterSymbol(symbol);

    // Emit each object into its own file if requested
    if (this.options.outputDirectory !== "") {
      this.createSource(this.options.outputDirectory + "/" + this.fullName(symbol) + ".cs");
    }
  };

  Skew.CSharpEmitter.prototype.emitTypeParameters = function(parameters) {
    if (parameters !== null) {
      this.emit("<");

      for (var i = 0, list = parameters, count = list.length; i < count; ++i) {
        var parameter = list[i];

        if (parameter !== parameters[0]) {
          this.emit(", ");
        }

        this.emitType(parameter.resolvedType);
      }

      this.emit(">");
    }
  };

  Skew.CSharpEmitter.prototype.emitArgumentList = function(symbol) {
    this.emit("(");

    for (var i = 0, list = symbol.$arguments, count = list.length; i < count; ++i) {
      var argument = list[i];

      if (argument !== symbol.$arguments[0]) {
        this.emit(", ");
      }

      this.emitType(argument.resolvedType);
      this.emit(" " + this.mangleName(argument));
    }

    this.emit(")");
  };

  Skew.CSharpEmitter.prototype.emitVariable = function(symbol) {
    if (symbol.isImported()) {
      return;
    }

    this.emitNewlineBeforeSymbol(symbol);
    this.emitComments(symbol.comments);

    if (symbol.kind === Skew.SymbolKind.VARIABLE_ENUM) {
      this.emit(this.indent + this.mangleName(symbol));

      if (symbol.value !== null) {
        this.emit(" = ");
        this.emitExpression(symbol.value, Skew.Precedence.COMMA);
      }

      this.emit(",\n");
    }

    else {
      this.emit(this.indent + "public ");

      if (symbol.kind === Skew.SymbolKind.VARIABLE_GLOBAL) {
        this.emit("static ");
      }

      this.emitType(symbol.resolvedType);
      this.emit(" " + this.mangleName(symbol));

      if (symbol.value !== null) {
        this.emit(" = ");
        this.emitExpression(symbol.value, Skew.Precedence.COMMA);
      }

      this.emit(";\n");
    }

    this.emitNewlineAfterSymbol(symbol);
  };

  Skew.CSharpEmitter.prototype.emitFunction = function(symbol) {
    if (symbol.isImported()) {
      return;
    }

    // C# has sane capture rules for "this" so no variable insertion is needed
    if (symbol.self !== null) {
      symbol.self.name = "this";
      symbol.self.flags |= Skew.Symbol.IS_EXPORTED;
    }

    this.emitNewlineBeforeSymbol(symbol);
    this.emitComments(symbol.comments);
    this.emit(this.indent + "public ");

    if (symbol.kind === Skew.SymbolKind.FUNCTION_GLOBAL) {
      this.emit("static ");
    }

    if (symbol.kind !== Skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
      if (symbol.block === null) {
        this.emit("abstract ");
      }

      else if (symbol.overridden !== null) {
        this.emit("override ");
      }

      this.emitType(symbol.resolvedType.returnType);
      this.emit(" ");
    }

    this.emit(this.mangleName(symbol));
    this.emitTypeParameters(symbol.parameters);
    this.emitArgumentList(symbol);

    if (symbol.block === null) {
      this.emit(";\n");
    }

    else {
      this.emit("\n");
      this.emitBlock(symbol.block);
      this.emit("\n");
    }

    this.emitNewlineAfterSymbol(symbol);
  };

  Skew.CSharpEmitter.prototype.emitType = function(type) {
    if (type === null) {
      this.emit("void");
    }

    else if (type === Skew.Type.DYNAMIC) {
      this.emit("dynamic");
    }

    else if (type.kind === Skew.TypeKind.LAMBDA) {
      var returnType = type.returnType;
      this.emit(returnType !== null ? "Func<" : "Action<");

      for (var i1 = 0, list = type.argumentTypes, count = list.length; i1 < count; ++i1) {
        var argumentType = list[i1];

        if (argumentType !== type.argumentTypes[0]) {
          this.emit(", ");
        }

        this.emitType(argumentType);
      }

      if (returnType !== null) {
        if (!(type.argumentTypes.length === 0)) {
          this.emit(", ");
        }

        this.emitType(returnType);
      }

      this.emit(">");
    }

    else {
      assert(type.kind === Skew.TypeKind.SYMBOL);

      if (this.cache.isIntMap(type) || this.cache.isStringMap(type)) {
        this.emit("Dictionary");

        if (type.isParameterized()) {
          this.emit("<" + (this.cache.isIntMap(type) ? "int" : "string"));
          this.emit(", ");
          this.emitType(type.substitutions[0]);
          this.emit(">");
        }
      }

      else {
        this.emit(this.fullName(type.symbol));

        if (type.isParameterized()) {
          this.emit("<");

          for (var i = 0, count1 = type.substitutions.length; i < count1; ++i) {
            if (i !== 0) {
              this.emit(", ");
            }

            this.emitType(type.substitutions[i]);
          }

          this.emit(">");
        }
      }
    }
  };

  Skew.CSharpEmitter.prototype.emitStatements = function(statements) {
    this.previousNode = null;

    for (var i = 0, list = statements, count = list.length; i < count; ++i) {
      var statement = list[i];
      this.emitNewlineBeforeStatement(statement);
      this.emitComments(statement.comments);
      this.emitStatement(statement);
      this.emitNewlineAfterStatement(statement);
    }

    this.previousNode = null;
  };

  Skew.CSharpEmitter.prototype.emitBlock = function(node) {
    assert(node.kind === Skew.NodeKind.BLOCK);
    this.emit(this.indent + "{\n");
    this.increaseIndent();
    this.emitStatements(node.children);
    this.decreaseIndent();
    this.emit(this.indent + "}");
  };

  Skew.CSharpEmitter.prototype.emitIf = function(node) {
    this.emit("if (");
    this.emitExpression(node.ifTest(), Skew.Precedence.LOWEST);
    this.emit(")\n");
    this.emitBlock(node.ifTrue());
    this.emit("\n");
    var block = node.ifFalse();

    if (block !== null) {
      var singleIf = block.children.length === 1 && block.children[0].kind === Skew.NodeKind.IF ? block.children[0] : null;

      if (block.comments !== null || singleIf !== null && singleIf.comments !== null) {
        this.emit("\n");
        this.emitComments(block.comments);

        if (singleIf !== null) {
          this.emitComments(singleIf.comments);
        }
      }

      this.emit(this.indent + "else");

      if (singleIf !== null) {
        this.emit(" ");
        this.emitIf(singleIf);
      }

      else {
        this.emit("\n");
        this.emitBlock(block);
        this.emit("\n");
      }
    }
  };

  Skew.CSharpEmitter.prototype.emitStatement = function(node) {
    switch (node.kind) {
      case Skew.NodeKind.VAR: {
        var symbol = node.symbol.asVariableSymbol();
        this.emit(this.indent);
        this.emitType(symbol.resolvedType);
        this.emit(" " + this.mangleName(symbol));

        if (symbol.value !== null) {
          this.emit(" = ");
          this.emitExpression(symbol.value, Skew.Precedence.ASSIGN);
        }

        this.emit(";\n");
        break;
      }

      case Skew.NodeKind.EXPRESSION: {
        this.emit(this.indent);
        this.emitExpression(node.expressionValue(), Skew.Precedence.LOWEST);
        this.emit(";\n");
        break;
      }

      case Skew.NodeKind.BREAK: {
        this.emit(this.indent + "break;\n");
        break;
      }

      case Skew.NodeKind.CONTINUE: {
        this.emit(this.indent + "continue;\n");
        break;
      }

      case Skew.NodeKind.IF: {
        this.emit(this.indent);
        this.emitIf(node);
        break;
      }

      case Skew.NodeKind.SWITCH: {
        var cases = node.children;
        this.emit(this.indent + "switch (");
        this.emitExpression(node.switchValue(), Skew.Precedence.LOWEST);
        this.emit(")\n" + this.indent + "{\n");
        this.increaseIndent();

        for (var i = 1, count2 = cases.length; i < count2; ++i) {
          var child = cases[i];
          var values = child.children;
          var block = child.caseBlock();

          if (i !== 1) {
            this.emit("\n");
          }

          if (values.length === 1) {
            this.emit(this.indent + "default:");
          }

          else {
            for (var j = 1, count1 = values.length; j < count1; ++j) {
              if (j !== 1) {
                this.emit("\n");
              }

              this.emit(this.indent + "case ");
              this.emitExpression(values[j], Skew.Precedence.LOWEST);
              this.emit(":");
            }
          }

          this.emit("\n" + this.indent + "{\n");
          this.increaseIndent();
          this.emitStatements(block.children);

          if (!block.blockAlwaysEndsWithReturn()) {
            this.emit(this.indent + "break;\n");
          }

          this.decreaseIndent();
          this.emit(this.indent + "}\n");
        }

        this.decreaseIndent();
        this.emit(this.indent + "}\n");
        break;
      }

      case Skew.NodeKind.RETURN: {
        this.emit(this.indent + "return");
        var value = node.returnValue();

        if (value !== null) {
          this.emit(" ");
          this.emitExpression(value, Skew.Precedence.LOWEST);
        }

        this.emit(";\n");
        break;
      }

      case Skew.NodeKind.THROW: {
        this.emit(this.indent + "throw ");
        this.emitExpression(node.throwValue(), Skew.Precedence.LOWEST);
        this.emit(";\n");
        break;
      }

      case Skew.NodeKind.FOREACH: {
        this.emit(this.indent + "foreach (var " + this.mangleName(node.symbol) + " in ");
        this.emitExpression(node.foreachValue(), Skew.Precedence.LOWEST);
        this.emit(")\n");
        this.emitBlock(node.foreachBlock());
        this.emit("\n");
        break;
      }

      case Skew.NodeKind.FOR: {
        var test = node.forTest();
        var update = node.forUpdate();
        var children = node.children;
        var count = children.length;
        this.emit(this.indent + "for (");

        if (count > 3) {
          for (var i1 = 3, count3 = count; i1 < count3; ++i1) {
            var child1 = children[i1];

            if (i1 !== 3) {
              this.emit(", ");
            }

            if (child1.kind === Skew.NodeKind.VAR) {
              var symbol1 = child1.symbol.asVariableSymbol();

              if (i1 === 3) {
                this.emitType(symbol1.resolvedType);
                this.emit(" ");
              }

              this.emit(this.mangleName(symbol1) + " = ");
              this.emitExpression(symbol1.value, Skew.Precedence.LOWEST);
            }

            else {
              this.emitExpression(child1, Skew.Precedence.LOWEST);
            }
          }
        }

        this.emit("; ");

        if (test !== null) {
          this.emitExpression(test, Skew.Precedence.LOWEST);
        }

        this.emit("; ");

        if (update !== null) {
          this.emitExpression(update, Skew.Precedence.LOWEST);
        }

        this.emit(")\n");
        this.emitBlock(node.forBlock());
        this.emit("\n");
        break;
      }

      case Skew.NodeKind.TRY: {
        var children1 = node.children;
        var finallyBlock = node.finallyBlock();
        this.emit(this.indent + "try\n");
        this.emitBlock(node.tryBlock());
        this.emit("\n");

        for (var i2 = 1, count4 = children1.length - 1 | 0; i2 < count4; ++i2) {
          var child2 = children1[i2];
          this.emit("\n");
          this.emitComments(child2.comments);
          this.emit(this.indent + "catch");

          if (child2.symbol !== null) {
            this.emit(" (");
            this.emitType(child2.symbol.resolvedType);
            this.emit(" " + this.mangleName(child2.symbol) + ")");
          }

          this.emit("\n");
          this.emitBlock(child2.catchBlock());
          this.emit("\n");
        }

        if (finallyBlock !== null) {
          this.emit("\n");
          this.emitComments(finallyBlock.comments);
          this.emit(this.indent + "finally\n");
          this.emitBlock(finallyBlock);
          this.emit("\n");
        }
        break;
      }

      case Skew.NodeKind.WHILE: {
        this.emit(this.indent + "while (");
        this.emitExpression(node.whileTest(), Skew.Precedence.LOWEST);
        this.emit(")\n");
        this.emitBlock(node.whileBlock());
        this.emit("\n");
        break;
      }

      default: {
        assert(false);
        break;
      }
    }
  };

  Skew.CSharpEmitter.prototype.emitContent = function(content) {
    switch (content.kind()) {
      case Skew.ContentKind.BOOL: {
        this.emit(content.asBool().toString());
        break;
      }

      case Skew.ContentKind.INT: {
        this.emit(content.asInt().toString());
        break;
      }

      case Skew.ContentKind.DOUBLE: {
        this.emit(content.asDouble().toString());
        break;
      }

      case Skew.ContentKind.STRING: {
        this.emit(Skew.quoteString(content.asString(), 34));
        break;
      }
    }
  };

  Skew.CSharpEmitter.prototype.emitExpression = function(node, precedence) {
    var kind = node.kind;

    switch (kind) {
      case Skew.NodeKind.TYPE: {
        this.emitType(node.resolvedType);
        break;
      }

      case Skew.NodeKind.NULL: {
        this.emit("null");
        break;
      }

      case Skew.NodeKind.NAME: {
        var symbol = node.symbol;
        this.emit(symbol !== null ? this.fullName(symbol) : node.asString());
        break;
      }

      case Skew.NodeKind.DOT: {
        this.emitExpression(node.dotTarget(), Skew.Precedence.MEMBER);
        this.emit("." + (node.symbol !== null ? this.mangleName(node.symbol) : node.asString()));
        break;
      }

      case Skew.NodeKind.CONSTANT: {
        this.emitContent(node.content);
        break;
      }

      case Skew.NodeKind.CALL: {
        var value = node.callValue();

        if (node.symbol !== null && node.symbol.kind === Skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
          this.emit("new ");
          this.emitType(node.resolvedType);
        }

        else if (value.kind === Skew.NodeKind.DOT && value.asString() === "new") {
          this.emit("new ");
          this.emitExpression(value.dotTarget(), Skew.Precedence.MEMBER);
        }

        else {
          this.emitExpression(value, Skew.Precedence.UNARY_POSTFIX);
        }

        this.emit("(");

        for (var i = 1, count = node.children.length; i < count; ++i) {
          if (i > 1) {
            this.emit(", ");
          }

          this.emitExpression(node.children[i], Skew.Precedence.COMMA);
        }

        this.emit(")");
        break;
      }

      case Skew.NodeKind.CAST: {
        if (node.resolvedType === Skew.Type.DYNAMIC) {
          this.emitExpression(node.castValue(), precedence);
        }

        else {
          if (Skew.Precedence.UNARY_POSTFIX < precedence) {
            this.emit("(");
          }

          this.emit("(");
          this.emitType(node.resolvedType);
          this.emit(")");
          this.emitExpression(node.castValue(), Skew.Precedence.UNARY_POSTFIX);

          if (Skew.Precedence.UNARY_POSTFIX < precedence) {
            this.emit(")");
          }
        }
        break;
      }

      case Skew.NodeKind.INITIALIZER_LIST: {
        this.emit("new ");
        this.emitType(node.resolvedType);

        if (node.hasChildren()) {
          this.emit(" { ");

          for (var i1 = 0, list = node.children, count1 = list.length; i1 < count1; ++i1) {
            var child = list[i1];

            if (child !== node.children[0]) {
              this.emit(", ");
            }

            this.emitExpression(child, Skew.Precedence.COMMA);
          }

          this.emit(" }");
        }

        else {
          this.emit("()");
        }
        break;
      }

      case Skew.NodeKind.INDEX: {
        assert(node.children.length === 2);
        this.emitExpression(node.children[0], Skew.Precedence.UNARY_POSTFIX);
        this.emit("[");
        this.emitExpression(node.children[1], Skew.Precedence.LOWEST);
        this.emit("]");
        break;
      }

      case Skew.NodeKind.ASSIGN_INDEX: {
        if (Skew.Precedence.ASSIGN < precedence) {
          this.emit("(");
        }

        assert(node.children.length === 3);
        this.emitExpression(node.children[0], Skew.Precedence.UNARY_POSTFIX);
        this.emit("[");
        this.emitExpression(node.children[1], Skew.Precedence.LOWEST);
        this.emit("] = ");
        this.emitExpression(node.children[2], Skew.Precedence.ASSIGN);

        if (Skew.Precedence.ASSIGN < precedence) {
          this.emit(")");
        }
        break;
      }

      case Skew.NodeKind.PARAMETERIZE: {
        this.emitExpression(node.parameterizeValue(), precedence);
        break;
      }

      case Skew.NodeKind.HOOK: {
        if (Skew.Precedence.ASSIGN < precedence) {
          this.emit("(");
        }

        this.emitExpression(node.hookTest(), Skew.Precedence.LOGICAL_OR);
        this.emit(" ? ");
        this.emitExpression(node.hookTrue(), Skew.Precedence.ASSIGN);
        this.emit(" : ");
        this.emitExpression(node.hookFalse(), Skew.Precedence.ASSIGN);

        if (Skew.Precedence.ASSIGN < precedence) {
          this.emit(")");
        }
        break;
      }

      case Skew.NodeKind.LAMBDA: {
        var $function = node.symbol.asFunctionSymbol();
        this.emitArgumentList($function);
        this.emit(" =>\n");
        this.emitBlock($function.block);
        break;
      }

      default: {
        if (Skew.NodeKind.isUnary(kind)) {
          var value1 = node.unaryValue();
          var info = Skew.operatorInfo[kind];

          if (info.precedence < precedence) {
            this.emit("(");
          }

          this.emit(info.text);
          this.emitExpression(value1, info.precedence);

          if (info.precedence < precedence) {
            this.emit(")");
          }
        }

        else if (Skew.NodeKind.isBinary(kind)) {
          var info1 = Skew.operatorInfo[kind];

          if (info1.precedence < precedence) {
            this.emit("(");
          }

          this.emitExpression(node.binaryLeft(), info1.precedence + (info1.associativity === Skew.Associativity.RIGHT | 0) | 0);
          this.emit(" " + info1.text + " ");
          this.emitExpression(node.binaryRight(), info1.precedence + (info1.associativity === Skew.Associativity.LEFT | 0) | 0);

          if (info1.precedence < precedence) {
            this.emit(")");
          }
        }

        else {
          assert(false);
        }
        break;
      }
    }
  };

  Skew.CSharpEmitter.prototype.fullName = function(symbol) {
    var parent = symbol.parent;

    if (parent !== null && parent.kind !== Skew.SymbolKind.OBJECT_GLOBAL && !Skew.SymbolKind.isParameter(symbol.kind)) {
      var enclosingName = this.fullName(parent);

      if (symbol.kind === Skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
        return enclosingName;
      }

      return enclosingName + "." + this.mangleName(symbol);
    }

    return this.mangleName(symbol);
  };

  Skew.CSharpEmitter.prototype.mangleName = function(symbol) {
    if (symbol.kind === Skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
      symbol = symbol.parent;
    }

    if (!symbol.isImportedOrExported() && symbol.name in this.isKeyword) {
      symbol.name = symbol.scope.generateName(symbol.name);
      return symbol.name;
    }

    return symbol.nameWithRenaming();
  };

  Skew.Associativity = {
    NONE: 0,
    LEFT: 1,
    RIGHT: 2
  };

  // The same operator precedence as C for the most part
  Skew.Precedence = {
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

  Skew.BooleanSwap = {
    SWAP: 0,
    NO_SWAP: 1
  };

  Skew.ExtractGroupsMode = {
    ALL_SYMBOLS: 0,
    ONLY_LOCAL_VARIABLES: 1,
    ONLY_INSTANCE_VARIABLES: 2
  };

  Skew.SymbolGroup = function(symbols, count) {
    this.symbols = symbols;
    this.count = count;
  };

  Skew.JsEmitter = function(options, cache) {
    Skew.Emitter.call(this);
    this.options = options;
    this.cache = cache;
    this.needsMultiply = false;
    this.prefix = "";
    this.previousNode = null;
    this.previousSymbol = null;
    this.enclosingFunction = null;
    this.$extends = null;
    this.multiply = null;
    this.allSymbols = [];
    this.localVariableUnionFind = new Skew.UnionFind();
    this.namingGroupIndexForSymbol = Object.create(null);
    this.nextSymbolName = 0;
    this.symbolCounts = Object.create(null);
    this.mangle = false;
    this.minify = false;
    this.needsSemicolon = false;
    this.newline = "\n";
    this.space = " ";
    this.currentSelf = null;
    this.needsSelf = false;
  };

  __extends(Skew.JsEmitter, Skew.Emitter);

  Skew.JsEmitter.prototype.visit = function(global) {
    this.mangle = this.options.jsMangle;
    this.minify = this.options.jsMinify;

    if (this.minify) {
      this.indentAmount = "";
      this.newline = "";
      this.space = "";
    }

    // Preprocess the code
    this.prepareGlobal(global);
    Skew.shakingPass(global, this.cache.entryPointSymbol, Skew.ShakingMode.IGNORE_TYPES);
    this.convertLambdasToFunctions(global);
    var objects = this.sortedObjects(global);

    // The entire body of code is wrapped in a closure for safety
    this.emit(this.indent + "(function()" + this.space + "{" + this.newline);
    this.increaseIndent();

    // Emit special-cased variables that must come first
    if (Skew.JsEmitter.needsExtends(objects)) {
      this.emitFunction(this.convertLambdaToFunction(this.$extends));
    }

    if (this.needsMultiply) {
      this.emitVariable(this.multiply);
    }

    // Emit objects and functions
    for (var i = 0, list = objects, count = list.length; i < count; ++i) {
      var object = list[i];
      this.emitObject(object);
    }

    // Emit variables
    for (var i2 = 0, list2 = objects, count2 = list2.length; i2 < count2; ++i2) {
      var object1 = list2[i2];
      var o = object1;
      this.prefix = "";

      while (o.kind !== Skew.SymbolKind.OBJECT_GLOBAL) {
        this.prefix = Skew.JsEmitter.mangleName(o) + "." + this.prefix;
        o = o.parent.asObjectSymbol();
      }

      for (var i1 = 0, list1 = object1.variables, count1 = list1.length; i1 < count1; ++i1) {
        var variable = list1[i1];

        if (variable !== this.$extends && variable !== this.multiply) {
          this.emitVariable(variable);
        }
      }
    }

    // Emit entry point
    var entryPointSymbol = this.cache.entryPointSymbol;

    if (entryPointSymbol !== null) {
      var type = entryPointSymbol.resolvedType;
      var callText = Skew.JsEmitter.fullName(entryPointSymbol) + (type.argumentTypes.length === 0 ? "()" : "(process.argv.slice(2))");
      this.emitSemicolonIfNeeded();
      this.emit(this.newline + this.indent + (type.returnType === this.cache.intType ? "process.exit(" + callText + ")" : callText));
      this.emitSemicolonAfterStatement();
    }

    // End the closure wrapping everything
    this.decreaseIndent();
    this.emit(this.indent + "})();\n");
    this.createSource(this.options.outputDirectory !== "" ? this.options.outputDirectory + "/compiled.js" : this.options.outputFile);
  };

  Skew.JsEmitter.prototype.prepareGlobal = function(global) {
    var globalObjects = [];
    var globalFunctions = [];
    var globalVariables = [];

    // Load special-cased variables
    for (var i = 0, list = global.variables, count = list.length; i < count; ++i) {
      var variable = list[i];

      if (variable.name === "__extends") {
        this.$extends = variable;

        if (this.multiply !== null) {
          break;
        }
      }

      else if (variable.name === "__imul") {
        this.multiply = variable;

        if (this.$extends !== null) {
          break;
        }
      }
    }

    assert(this.$extends !== null);
    assert(this.multiply !== null);

    // Lower certain stuff into JavaScript (for example, "x as bool" becomes "!!x")
    this.patchObject(global, globalObjects, globalFunctions, globalVariables);

    // Skip everything below if we aren't mangling
    if (!this.mangle) {
      return;
    }

    // Move internal global symbols up to the global namespace
    for (var i1 = 0, list1 = globalObjects, count1 = list1.length; i1 < count1; ++i1) {
      var object = list1[i1];
      object.parent = global;
    }

    for (var i2 = 0, list2 = globalFunctions, count2 = list2.length; i2 < count2; ++i2) {
      var $function = list2[i2];
      $function.parent = global;
    }

    for (var i3 = 0, list3 = globalVariables, count3 = list3.length; i3 < count3; ++i3) {
      var variable1 = list3[i3];
      variable1.parent = global;
    }

    in_List.append1(global.objects, globalObjects);
    in_List.append1(global.functions, globalFunctions);
    in_List.append1(global.variables, globalVariables);

    // Rename symbols based on frequency for better compression
    this.renameSymbols();
  };

  Skew.JsEmitter.prototype.convertLambdaToFunction = function(variable) {
    var $function = variable.value.symbol.asFunctionSymbol();
    $function.kind = Skew.SymbolKind.FUNCTION_GLOBAL;
    $function.parent = variable.parent;
    $function.name = variable.name;
    return $function;
  };

  Skew.JsEmitter.prototype.convertLambdasToFunctions = function(symbol) {
    var self = this;

    for (var i = 0, list = symbol.objects, count = list.length; i < count; ++i) {
      var object = list[i];
      self.convertLambdasToFunctions(object);
    }

    in_List.removeIf(symbol.variables, function(variable) {
      if (variable.kind === Skew.SymbolKind.VARIABLE_GLOBAL && variable.isConst() && !variable.isExported() && variable.value !== null && variable.value.kind === Skew.NodeKind.LAMBDA) {
        symbol.functions.push(self.convertLambdaToFunction(variable));
        return true;
      }

      return false;
    });
  };

  Skew.JsEmitter.prototype.allocateNamingGroupIndex = function(symbol) {
    if (this.mangle && !(symbol.id in this.namingGroupIndexForSymbol)) {
      var index = this.localVariableUnionFind.allocate1();
      this.namingGroupIndexForSymbol[symbol.id] = index;
      this.allSymbols.push(symbol);

      // Explicitly add function arguments since they won't be reached by
      // normal tree traversal
      if (Skew.SymbolKind.isFunction(symbol.kind)) {
        var context = symbol.asFunctionSymbol().self;

        if (context !== null) {
          this.allocateNamingGroupIndex(context);
        }

        for (var i = 0, list = symbol.asFunctionSymbol().$arguments, count = list.length; i < count; ++i) {
          var argument = list[i];
          this.allocateNamingGroupIndex(argument);
        }
      }
    }
  };

  Skew.JsEmitter.prototype.renameSymbols = function() {
    // This holds the groups used for naming. Unioning two labels using
    // this object will cause both groups of symbols to have the same name.
    var namingGroupsUnionFind = new Skew.UnionFind().allocate2(this.allSymbols.length);

    // These are optional and only reduce the number of generated names
    var order = [];
    this.aliasLocalVariables(namingGroupsUnionFind, order);
    this.aliasUnrelatedProperties(namingGroupsUnionFind, order);

    // Ensure all overridden symbols have the same generated name. This is
    // manditory for correctness, otherwise virtual functions break.
    for (var i = 0, list = this.allSymbols, count1 = list.length; i < count1; ++i) {
      var symbol = list[i];

      if (Skew.SymbolKind.isFunction(symbol.kind) && symbol.asFunctionSymbol().overridden !== null) {
        assert(symbol.id in this.namingGroupIndexForSymbol);
        assert(symbol.asFunctionSymbol().overridden.id in this.namingGroupIndexForSymbol);
        namingGroupsUnionFind.union(this.namingGroupIndexForSymbol[symbol.id], this.namingGroupIndexForSymbol[symbol.asFunctionSymbol().overridden.id]);
      }
    }

    // Collect all reserved names together into one big set for querying
    var reservedNames = Object.create(null);

    for (var i1 = 0, list1 = this.allSymbols, count2 = list1.length; i1 < count2; ++i1) {
      var symbol1 = list1[i1];

      if (symbol1.isImportedOrExported()) {
        reservedNames[symbol1.name] = 0;
      }
    }

    // Everything that should have the same name is now grouped together.
    // Generate and assign names to all internal symbols, but use shorter
    // names for more frequently used symbols.
    var sortedGroups = [];

    for (var i3 = 0, list3 = this.extractGroups(namingGroupsUnionFind, Skew.ExtractGroupsMode.ALL_SYMBOLS), count4 = list3.length; i3 < count4; ++i3) {
      var group = list3[i3];
      var count = 0;

      for (var i2 = 0, list2 = group, count3 = list2.length; i2 < count3; ++i2) {
        var symbol2 = list2[i2];

        if (!symbol2.isImportedOrExported()) {
          count += in_IntMap.get(this.symbolCounts, symbol2.id, 0);
        }
      }

      sortedGroups.push(new Skew.SymbolGroup(group, count));
    }

    sortedGroups.sort(function(a, b) {
      return b.count - a.count | 0;
    });

    for (var i5 = 0, list5 = sortedGroups, count6 = list5.length; i5 < count6; ++i5) {
      var group1 = list5[i5];
      var name = "";

      for (var i4 = 0, list4 = group1.symbols, count5 = list4.length; i4 < count5; ++i4) {
        var symbol3 = list4[i4];

        if (!symbol3.isImportedOrExported()) {
          if (name === "") {
            name = this.generateSymbolName(reservedNames);
          }

          symbol3.name = name;
        }
      }
    }
  };

  // Merge local variables from different functions together in the order
  // they were declared. This will cause every argument list to use the same
  // variables in the same order, which should offer better gzip:
  //
  //   function d(a, b) {}
  //   function e(a, b, c) {}
  //
  Skew.JsEmitter.prototype.aliasLocalVariables = function(unionFind, order) {
    this.zipTogetherInOrder(unionFind, order, this.extractGroups(this.localVariableUnionFind, Skew.ExtractGroupsMode.ONLY_LOCAL_VARIABLES));
  };

  // Merge all related types together into naming groups. This ensures names
  // will be unique within a subclass hierarchy allowing names to be
  // duplicated in separate subclass hierarchies.
  Skew.JsEmitter.prototype.aliasUnrelatedProperties = function(unionFind, order) {
    var relatedTypesUnionFind = new Skew.UnionFind().allocate2(this.allSymbols.length);

    for (var i = 0, count1 = this.allSymbols.length; i < count1; ++i) {
      var symbol = this.allSymbols[i];

      if (symbol.kind === Skew.SymbolKind.OBJECT_CLASS) {
        var baseClass = symbol.asObjectSymbol().baseClass;

        if (baseClass !== null) {
          relatedTypesUnionFind.union(i, this.namingGroupIndexForSymbol[baseClass.id]);
        }

        for (var i1 = 0, list = symbol.asObjectSymbol().variables, count = list.length; i1 < count; ++i1) {
          var variable = list[i1];
          relatedTypesUnionFind.union(i, this.namingGroupIndexForSymbol[variable.id]);
        }
      }
    }

    this.zipTogetherInOrder(unionFind, order, this.extractGroups(relatedTypesUnionFind, Skew.ExtractGroupsMode.ONLY_INSTANCE_VARIABLES));
  };

  Skew.JsEmitter.prototype.zipTogetherInOrder = function(unionFind, order, groups) {
    for (var i1 = 0, list = groups, count1 = list.length; i1 < count1; ++i1) {
      var group = list[i1];

      for (var i = 0, count = group.length; i < count; ++i) {
        var symbol = group[i];
        var index = this.namingGroupIndexForSymbol[symbol.id];

        if (i >= order.length) {
          order.push(index);
        }

        else {
          unionFind.union(index, order[i]);
        }
      }
    }
  };

  Skew.JsEmitter.prototype.numberToName = function(number) {
    var WRAP = __imul(26, 2);
    var name = "";

    if (number >= WRAP) {
      name = this.numberToName((number / WRAP | 0) - 1 | 0);
      number = number % WRAP | 0;
    }

    name += String.fromCharCode(number + (number < 26 ? 97 : 65 - 26 | 0) | 0);
    return name;
  };

  Skew.JsEmitter.prototype.generateSymbolName = function(reservedNames) {
    while (true) {
      var name = this.numberToName(this.nextSymbolName);
      ++this.nextSymbolName;

      if (!(name in reservedNames)) {
        return name;
      }
    }
  };

  Skew.JsEmitter.prototype.extractGroups = function(unionFind, mode) {
    var labelToGroup = Object.create(null);

    for (var i = 0, list = this.allSymbols, count = list.length; i < count; ++i) {
      var symbol = list[i];

      if (mode === Skew.ExtractGroupsMode.ONLY_LOCAL_VARIABLES && symbol.kind !== Skew.SymbolKind.VARIABLE_LOCAL || mode === Skew.ExtractGroupsMode.ONLY_INSTANCE_VARIABLES && symbol.kind !== Skew.SymbolKind.VARIABLE_INSTANCE) {
        continue;
      }

      assert(symbol.id in this.namingGroupIndexForSymbol);
      var label = unionFind.find(this.namingGroupIndexForSymbol[symbol.id]);
      var group = in_IntMap.get(labelToGroup, label, null);

      if (group === null) {
        group = [];
        labelToGroup[label] = group;
      }

      group.push(symbol);
    }

    return in_IntMap.values(labelToGroup);
  };

  Skew.JsEmitter.prototype.emitSemicolonAfterStatement = function() {
    if (!this.minify) {
      this.emit(";\n");
    }

    else {
      this.needsSemicolon = true;
    }
  };

  Skew.JsEmitter.prototype.emitSemicolonIfNeeded = function() {
    if (this.needsSemicolon) {
      this.emit(";");
      this.needsSemicolon = false;
    }
  };

  Skew.JsEmitter.prototype.emitNewlineBeforeSymbol = function(symbol) {
    this.emitSemicolonIfNeeded();

    if (!this.minify && this.previousSymbol !== null && (!Skew.SymbolKind.isObject(this.previousSymbol.kind) || !Skew.SymbolKind.isObject(symbol.kind) || symbol.comments !== null || this.previousSymbol.kind === Skew.SymbolKind.OBJECT_ENUM || symbol.kind === Skew.SymbolKind.OBJECT_ENUM) && (!Skew.SymbolKind.isVariable(this.previousSymbol.kind) || !Skew.SymbolKind.isVariable(symbol.kind) || symbol.comments !== null)) {
      this.emit("\n");
    }

    this.previousSymbol = null;
  };

  Skew.JsEmitter.prototype.emitNewlineAfterSymbol = function(symbol) {
    this.previousSymbol = symbol;
  };

  Skew.JsEmitter.prototype.emitNewlineBeforeStatement = function(node) {
    if (!this.minify && this.previousNode !== null && (node.comments !== null || !Skew.JsEmitter.isCompactNodeKind(this.previousNode.kind) || !Skew.JsEmitter.isCompactNodeKind(node.kind))) {
      this.emit("\n");
    }

    this.previousNode = null;
  };

  Skew.JsEmitter.prototype.emitNewlineAfterStatement = function(node) {
    this.previousNode = node;
  };

  Skew.JsEmitter.prototype.emitComments = function(comments) {
    if (comments !== null && !this.minify) {
      for (var i = 0, list = comments, count = list.length; i < count; ++i) {
        var comment = list[i];
        this.emit(this.indent + "//" + comment);
      }
    }
  };

  Skew.JsEmitter.prototype.emitObject = function(symbol) {
    if (symbol.isImported()) {
      return;
    }

    this.prefix = symbol.parent !== null ? Skew.JsEmitter.computePrefix(symbol.parent.asObjectSymbol()) : "";

    switch (symbol.kind) {
      case Skew.SymbolKind.OBJECT_NAMESPACE:
      case Skew.SymbolKind.OBJECT_INTERFACE: {
        this.emitNewlineBeforeSymbol(symbol);
        this.emitComments(symbol.comments);
        this.emit(this.indent + (this.prefix === "" && !symbol.isExported() ? "var " : this.prefix) + Skew.JsEmitter.mangleName(symbol) + this.space + "=" + this.space + "{}");
        this.emitSemicolonAfterStatement();
        this.emitNewlineAfterSymbol(symbol);
        break;
      }

      case Skew.SymbolKind.OBJECT_ENUM: {
        this.emitNewlineBeforeSymbol(symbol);
        this.emitComments(symbol.comments);
        this.emit(this.indent + (this.prefix === "" && !symbol.isExported() ? "var " : this.prefix) + Skew.JsEmitter.mangleName(symbol) + this.space + "=" + this.space + "{");
        this.increaseIndent();
        var isFirst = true;

        for (var i = 0, list = symbol.variables, count = list.length; i < count; ++i) {
          var variable = list[i];

          if (variable.kind === Skew.SymbolKind.VARIABLE_ENUM) {
            if (isFirst) {
              isFirst = false;
            }

            else {
              this.emit(",");
            }

            this.emit(this.newline);
            this.emitNewlineBeforeSymbol(variable);
            this.emitComments(variable.comments);
            this.emit(this.indent + Skew.JsEmitter.mangleName(variable) + ":" + this.space);
            this.emitContent(variable.value.content);
            this.emitNewlineAfterSymbol(variable);
          }
        }

        this.decreaseIndent();

        if (!isFirst && !this.minify) {
          this.emit("\n" + this.indent);
        }

        this.emit("}");
        this.emitSemicolonAfterStatement();
        this.emitNewlineAfterSymbol(symbol);
        break;
      }

      case Skew.SymbolKind.OBJECT_CLASS: {
        for (var i1 = 0, list1 = symbol.functions, count1 = list1.length; i1 < count1; ++i1) {
          var $function = list1[i1];

          if ($function.isPrimaryConstructor()) {
            if ($function.comments === null && symbol.comments !== null) {
              $function.comments = symbol.comments;
            }

            this.emitFunction($function);

            if (symbol.baseClass !== null) {
              if (!this.minify) {
                this.emit("\n" + this.indent);
              }

              this.emitSemicolonIfNeeded();
              this.emit(Skew.JsEmitter.mangleName(this.$extends) + "(" + Skew.JsEmitter.fullName(symbol) + "," + this.space + Skew.JsEmitter.fullName(symbol.baseClass) + ")");
              this.emitSemicolonAfterStatement();
            }
          }
        }
        break;
      }
    }

    if (symbol.kind !== Skew.SymbolKind.OBJECT_GLOBAL) {
      this.prefix += Skew.JsEmitter.mangleName(symbol) + ".";
    }

    for (var i2 = 0, list2 = symbol.functions, count2 = list2.length; i2 < count2; ++i2) {
      var function1 = list2[i2];

      if (!function1.isPrimaryConstructor()) {
        this.emitFunction(function1);
      }
    }
  };

  Skew.JsEmitter.prototype.emitArgumentList = function($arguments) {
    for (var i = 0, count = $arguments.length; i < count; ++i) {
      if (i > 0) {
        this.emit("," + this.space);
      }

      this.emit(Skew.JsEmitter.mangleName($arguments[i]));
    }
  };

  Skew.JsEmitter.prototype.emitFunction = function(symbol) {
    if (symbol.block === null) {
      return;
    }

    this.emitNewlineBeforeSymbol(symbol);
    this.emitComments(symbol.comments);
    var isExpression = this.prefix !== "" || symbol.isExported();
    var name = Skew.JsEmitter.mangleName(symbol.isPrimaryConstructor() ? symbol.parent : symbol);

    if (isExpression) {
      this.emit(this.indent + this.prefix + (symbol.kind === Skew.SymbolKind.FUNCTION_INSTANCE ? "prototype." : "") + name + this.space + "=" + this.space + "function(");
    }

    else {
      this.emit(this.indent + "function " + name + "(");
    }

    this.emitArgumentList(symbol.$arguments);
    this.emit(")" + this.space + "{" + this.newline);
    this.increaseIndent();
    this.enclosingFunction = symbol;
    this.emitStatements(symbol.block.children);
    this.enclosingFunction = null;
    this.decreaseIndent();
    this.emit(this.indent + "}");

    if (isExpression) {
      this.emitSemicolonAfterStatement();
    }

    else {
      this.needsSemicolon = false;
      this.emit(this.newline);
    }

    this.emitNewlineAfterSymbol(symbol);

    if (symbol.kind === Skew.SymbolKind.FUNCTION_CONSTRUCTOR && !symbol.isPrimaryConstructor()) {
      this.emitSemicolonIfNeeded();
      this.emit(this.newline + this.indent + Skew.JsEmitter.fullName(symbol) + ".prototype" + this.space + "=" + this.space + Skew.JsEmitter.fullName(symbol.parent) + ".prototype");
      this.emitSemicolonAfterStatement();
    }
  };

  Skew.JsEmitter.prototype.emitVariable = function(symbol) {
    if (symbol.isImported()) {
      return;
    }

    if (symbol.kind !== Skew.SymbolKind.VARIABLE_INSTANCE && symbol.kind !== Skew.SymbolKind.VARIABLE_ENUM && (symbol.value !== null || this.prefix === "" || symbol.kind === Skew.SymbolKind.VARIABLE_LOCAL)) {
      this.emitNewlineBeforeSymbol(symbol);
      this.emitComments(symbol.comments);
      this.emit(this.indent + (this.prefix === "" && !symbol.isExported() || symbol.kind === Skew.SymbolKind.VARIABLE_LOCAL ? "var " : this.prefix) + Skew.JsEmitter.mangleName(symbol));

      if (symbol.value !== null) {
        this.emit(this.space + "=" + this.space);
        this.emitExpression(symbol.value, Skew.Precedence.COMMA);
      }

      this.emitSemicolonAfterStatement();
      this.emitNewlineAfterSymbol(symbol);
    }
  };

  Skew.JsEmitter.prototype.emitStatements = function(statements) {
    this.previousNode = null;

    for (var i = 0, list = statements, count = list.length; i < count; ++i) {
      var statement = list[i];
      this.emitSemicolonIfNeeded();
      this.emitNewlineBeforeStatement(statement);
      this.emitComments(statement.comments);
      this.emitStatement(statement);
      this.emitNewlineAfterStatement(statement);
    }

    this.previousNode = null;
  };

  Skew.JsEmitter.prototype.emitBlock = function(node, after, mode) {
    var shouldMinify = mode === Skew.JsEmitter.BracesMode.CAN_OMIT_BRACES && this.minify;

    if (shouldMinify && !node.hasChildren()) {
      this.emit(";");
    }

    else if (shouldMinify && node.children.length === 1) {
      if (after === Skew.JsEmitter.AfterToken.AFTER_KEYWORD) {
        this.emit(" ");
      }

      this.emitStatement(node.children[0]);
    }

    else {
      this.emit(this.space + "{" + this.newline);

      if (node.hasChildren()) {
        this.increaseIndent();
        this.emitStatements(node.children);
        this.decreaseIndent();
      }

      this.emit(this.indent + "}");
      this.needsSemicolon = false;
    }
  };

  Skew.JsEmitter.prototype.emitStatement = function(node) {
    switch (node.kind) {
      case Skew.NodeKind.VAR: {
        this.emitVariable(node.symbol.asVariableSymbol());
        break;
      }

      case Skew.NodeKind.EXPRESSION: {
        this.emit(this.indent);
        this.emitExpression(node.expressionValue(), Skew.Precedence.LOWEST);
        this.emitSemicolonAfterStatement();
        break;
      }

      case Skew.NodeKind.BREAK: {
        this.emit(this.indent + "break");
        this.emitSemicolonAfterStatement();
        break;
      }

      case Skew.NodeKind.CONTINUE: {
        this.emit(this.indent + "continue");
        this.emitSemicolonAfterStatement();
        break;
      }

      case Skew.NodeKind.RETURN: {
        this.emit(this.indent + "return");
        var value = node.returnValue();

        if (value !== null) {
          this.emit(" ");
          this.emitExpression(value, Skew.Precedence.LOWEST);
        }

        this.emitSemicolonAfterStatement();
        break;
      }

      case Skew.NodeKind.THROW: {
        this.emit(this.indent + "throw ");
        this.emitExpression(node.throwValue(), Skew.Precedence.LOWEST);
        this.emitSemicolonAfterStatement();
        break;
      }

      case Skew.NodeKind.FOR: {
        var test = node.forTest();
        var update = node.forUpdate();
        var children = node.children;
        var count = children.length;
        this.emit(this.indent + "for" + this.space + "(");

        if (count > 3) {
          for (var i = 3, count1 = count; i < count1; ++i) {
            var child = children[i];
            assert(child.kind === Skew.NodeKind.VAR);

            if (i !== 3) {
              this.emit("," + this.space);
            }

            var symbol = child.symbol.asVariableSymbol();

            if (i === 3) {
              this.emit("var ");
            }

            this.emit(Skew.JsEmitter.mangleName(symbol) + this.space + "=" + this.space);
            this.emitExpression(symbol.value, Skew.Precedence.COMMA);
          }
        }

        this.emit(";" + this.space);

        if (test !== null) {
          this.emitExpression(test, Skew.Precedence.LOWEST);
        }

        this.emit(";" + this.space);

        if (update !== null) {
          this.emitExpression(update, Skew.Precedence.LOWEST);
        }

        this.emit(")");
        this.emitBlock(node.forBlock(), Skew.JsEmitter.AfterToken.AFTER_PARENTHESIS, Skew.JsEmitter.BracesMode.MUST_KEEP_BRACES);
        this.emit(this.newline);
        break;
      }

      case Skew.NodeKind.FOREACH: {
        this.emit(this.indent + "for" + this.space + "(var " + Skew.JsEmitter.mangleName(node.symbol) + " in ");
        this.emitExpression(node.foreachValue(), Skew.Precedence.LOWEST);
        this.emit(")");
        this.emitBlock(node.foreachBlock(), Skew.JsEmitter.AfterToken.AFTER_PARENTHESIS, Skew.JsEmitter.BracesMode.MUST_KEEP_BRACES);
        this.emit(this.newline);
        break;
      }

      case Skew.NodeKind.IF: {
        this.emit(this.indent);
        this.emitIf(node);
        this.emit(this.newline);
        break;
      }

      case Skew.NodeKind.SWITCH: {
        var cases = node.children;
        this.emit(this.indent + "switch" + this.space + "(");
        this.emitExpression(node.switchValue(), Skew.Precedence.LOWEST);
        this.emit(")" + this.space + "{" + this.newline);
        this.increaseIndent();

        for (var i1 = 1, count3 = cases.length; i1 < count3; ++i1) {
          var child1 = cases[i1];
          var values = child1.children;
          var block = child1.caseBlock();
          this.emitSemicolonIfNeeded();

          if (i1 !== 1) {
            this.emit(this.newline);
          }

          if (values.length === 1) {
            this.emit(this.indent + "default:");
          }

          else {
            for (var j = 1, count2 = values.length; j < count2; ++j) {
              if (j !== 1) {
                this.emit(this.newline);
              }

              this.emit(this.indent + "case ");
              this.emitExpression(values[j], Skew.Precedence.LOWEST);
              this.emit(":");
            }
          }

          if (!this.minify) {
            this.emit(" {\n");
            this.increaseIndent();
          }

          this.emitStatements(block.children);

          if (!block.blockAlwaysEndsWithReturn()) {
            this.emitSemicolonIfNeeded();
            this.emit(this.indent + "break");
            this.emitSemicolonAfterStatement();
          }

          if (!this.minify) {
            this.decreaseIndent();
            this.emit(this.indent + "}\n");
          }
        }

        this.decreaseIndent();
        this.emit(this.indent + "}" + this.newline);
        this.needsSemicolon = false;
        break;
      }

      case Skew.NodeKind.TRY: {
        var children1 = node.children;
        var finallyBlock = node.finallyBlock();
        this.emit(this.indent + "try");
        this.emitBlock(node.tryBlock(), Skew.JsEmitter.AfterToken.AFTER_KEYWORD, Skew.JsEmitter.BracesMode.MUST_KEEP_BRACES);
        this.emit(this.newline);

        for (var i2 = 1, count4 = children1.length - 1 | 0; i2 < count4; ++i2) {
          var child2 = children1[i2];
          this.emit(this.newline);
          this.emitComments(child2.comments);
          this.emit(this.indent + "catch" + this.space + "(" + Skew.JsEmitter.mangleName(child2.symbol) + ")");
          this.emitBlock(child2.catchBlock(), Skew.JsEmitter.AfterToken.AFTER_KEYWORD, Skew.JsEmitter.BracesMode.MUST_KEEP_BRACES);
          this.emit(this.newline);
        }

        if (finallyBlock !== null) {
          this.emit(this.newline);
          this.emitComments(finallyBlock.comments);
          this.emit(this.indent + "finally");
          this.emitBlock(finallyBlock, Skew.JsEmitter.AfterToken.AFTER_KEYWORD, Skew.JsEmitter.BracesMode.MUST_KEEP_BRACES);
          this.emit(this.newline);
        }
        break;
      }

      case Skew.NodeKind.WHILE: {
        this.emit(this.indent + "while" + this.space + "(");
        this.emitExpression(node.whileTest(), Skew.Precedence.LOWEST);
        this.emit(")");
        this.emitBlock(node.whileBlock(), Skew.JsEmitter.AfterToken.AFTER_PARENTHESIS, Skew.JsEmitter.BracesMode.CAN_OMIT_BRACES);
        this.emit(this.newline);
        break;
      }

      default: {
        assert(false);
        break;
      }
    }
  };

  Skew.JsEmitter.prototype.emitIf = function(node) {
    var trueBlock = node.ifTrue();
    var falseBlock = node.ifFalse();
    this.emit("if" + this.space + "(");
    this.emitExpression(node.ifTest(), Skew.Precedence.LOWEST);
    this.emit(")");

    // Make sure to always keep braces to avoid the dangling "else" case
    var trueStatement = trueBlock.blockStatement();
    this.emitBlock(node.ifTrue(), Skew.JsEmitter.AfterToken.AFTER_PARENTHESIS, falseBlock !== null && trueStatement !== null && trueStatement.kind === Skew.NodeKind.IF ? Skew.JsEmitter.BracesMode.MUST_KEEP_BRACES : Skew.JsEmitter.BracesMode.CAN_OMIT_BRACES);

    if (falseBlock !== null) {
      var falseStatement = falseBlock.blockStatement();
      var singleIf = falseStatement !== null && falseStatement.kind === Skew.NodeKind.IF ? falseStatement : null;
      this.emitSemicolonIfNeeded();
      this.emit(this.newline + this.newline);
      this.emitComments(falseBlock.comments);

      if (singleIf !== null) {
        this.emitComments(singleIf.comments);
      }

      this.emit(this.indent + "else");

      if (singleIf !== null) {
        this.emit(" ");
        this.emitIf(singleIf);
      }

      else {
        this.emitBlock(falseBlock, Skew.JsEmitter.AfterToken.AFTER_KEYWORD, Skew.JsEmitter.BracesMode.CAN_OMIT_BRACES);
      }
    }
  };

  Skew.JsEmitter.prototype.emitContent = function(content) {
    switch (content.kind()) {
      case Skew.ContentKind.BOOL: {
        this.emit(content.asBool().toString());
        break;
      }

      case Skew.ContentKind.INT: {
        this.emit(content.asInt().toString());
        break;
      }

      case Skew.ContentKind.DOUBLE: {
        this.emit(content.asDouble().toString());
        break;
      }

      case Skew.ContentKind.STRING: {
        this.emit(Skew.quoteString(content.asString(), 34));
        break;
      }
    }
  };

  Skew.JsEmitter.prototype.emitExpression = function(node, precedence) {
    var kind = node.kind;

    switch (kind) {
      case Skew.NodeKind.TYPE: {
        this.emit(Skew.JsEmitter.fullName(node.resolvedType.symbol));
        break;
      }

      case Skew.NodeKind.NULL: {
        this.emit("null");
        break;
      }

      case Skew.NodeKind.NAME: {
        var symbol = node.symbol;
        this.emit(symbol !== null ? Skew.JsEmitter.fullName(symbol) : node.asString());
        break;
      }

      case Skew.NodeKind.DOT: {
        this.emitExpression(node.dotTarget(), Skew.Precedence.MEMBER);
        this.emit("." + (node.symbol !== null ? Skew.JsEmitter.mangleName(node.symbol) : node.asString()));
        break;
      }

      case Skew.NodeKind.CONSTANT: {
        this.emitContent(node.content);
        break;
      }

      case Skew.NodeKind.CALL: {
        var value = node.callValue();
        var call = value.kind === Skew.NodeKind.SUPER;
        var wrap = value.kind === Skew.NodeKind.LAMBDA && node.parent !== null && node.parent.kind === Skew.NodeKind.EXPRESSION;

        if (wrap) {
          this.emit("(");
        }

        if (!call && node.symbol !== null && node.symbol.kind === Skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
          this.emit("new " + Skew.JsEmitter.fullName(node.symbol));
        }

        else if (!call && value.kind === Skew.NodeKind.DOT && value.asString() === "new") {
          this.emit("new ");
          this.emitExpression(value.dotTarget(), Skew.Precedence.MEMBER);
        }

        else {
          this.emitExpression(value, Skew.Precedence.UNARY_POSTFIX);

          if (call) {
            this.emit(".call");
          }
        }

        if (wrap) {
          this.emit(")");
        }

        this.emit("(");

        if (call) {
          this.emit(Skew.JsEmitter.mangleName(this.enclosingFunction.self));
        }

        for (var i = 1, count = node.children.length; i < count; ++i) {
          if (call || i > 1) {
            this.emit("," + this.space);
          }

          this.emitExpression(node.children[i], Skew.Precedence.COMMA);
        }

        this.emit(")");
        break;
      }

      case Skew.NodeKind.INITIALIZER_LIST:
      case Skew.NodeKind.INITIALIZER_MAP:
      case Skew.NodeKind.INITIALIZER_SET: {
        var children = node.children;
        var useBraces = kind === Skew.NodeKind.INITIALIZER_MAP || kind === Skew.NodeKind.INITIALIZER_SET && children.length === 0;
        var isIndented = !this.minify && !children.every(function(child) {
          return child.comments === null;
        });
        this.emit(useBraces ? "{" : "[");

        if (isIndented) {
          this.increaseIndent();
        }

        for (var i1 = 0, list = children, count1 = list.length; i1 < count1; ++i1) {
          var child = list[i1];

          if (child !== children[0]) {
            this.emit("," + (isIndented ? "" : this.space));
          }

          if (isIndented) {
            this.emit("\n");
            this.emitComments(child.comments);
            this.emit(this.indent);
          }

          this.emitExpression(child, Skew.Precedence.COMMA);
        }

        if (isIndented) {
          this.decreaseIndent();
          this.emit("\n" + this.indent);
        }

        this.emit(useBraces ? "}" : "]");
        break;
      }

      case Skew.NodeKind.PAIR: {
        this.emitExpression(node.firstValue(), Skew.Precedence.LOWEST);
        this.emit(":" + this.space);
        this.emitExpression(node.secondValue(), Skew.Precedence.LOWEST);
        break;
      }

      case Skew.NodeKind.INDEX: {
        assert(node.children.length === 2);
        this.emitExpression(node.children[0], Skew.Precedence.UNARY_POSTFIX);
        this.emit("[");
        this.emitExpression(node.children[1], Skew.Precedence.LOWEST);
        this.emit("]");
        break;
      }

      case Skew.NodeKind.ASSIGN_INDEX: {
        if (Skew.Precedence.ASSIGN < precedence) {
          this.emit("(");
        }

        assert(node.children.length === 3);
        this.emitExpression(node.children[0], Skew.Precedence.UNARY_POSTFIX);
        this.emit("[");
        this.emitExpression(node.children[1], Skew.Precedence.LOWEST);
        this.emit("]" + this.space + "=" + this.space + "");
        this.emitExpression(node.children[2], Skew.Precedence.ASSIGN);

        if (Skew.Precedence.ASSIGN < precedence) {
          this.emit(")");
        }
        break;
      }

      case Skew.NodeKind.CAST: {
        this.emitExpression(node.castValue(), precedence);
        break;
      }

      case Skew.NodeKind.PARAMETERIZE: {
        this.emitExpression(node.parameterizeValue(), precedence);
        break;
      }

      case Skew.NodeKind.SEQUENCE: {
        if (Skew.Precedence.COMMA <= precedence) {
          this.emit("(");
        }

        for (var i2 = 0, count2 = node.children.length; i2 < count2; ++i2) {
          if (i2 !== 0) {
            this.emit("," + this.space);
          }

          this.emitExpression(node.children[i2], Skew.Precedence.COMMA);
        }

        if (Skew.Precedence.COMMA <= precedence) {
          this.emit(")");
        }
        break;
      }

      case Skew.NodeKind.SUPER: {
        this.emit(Skew.JsEmitter.fullName(node.symbol));
        break;
      }

      case Skew.NodeKind.HOOK: {
        if (Skew.Precedence.ASSIGN < precedence) {
          this.emit("(");
        }

        this.emitExpression(node.hookTest(), Skew.Precedence.LOGICAL_OR);
        this.emit(this.space + "?" + this.space);
        this.emitExpression(node.hookTrue(), Skew.Precedence.ASSIGN);
        this.emit(this.space + ":" + this.space);
        this.emitExpression(node.hookFalse(), Skew.Precedence.ASSIGN);

        if (Skew.Precedence.ASSIGN < precedence) {
          this.emit(")");
        }
        break;
      }

      case Skew.NodeKind.LAMBDA: {
        var symbol1 = node.symbol.asFunctionSymbol();
        this.emit("function(");
        this.emitArgumentList(symbol1.$arguments);
        this.emit(")");
        this.emitBlock(symbol1.block, Skew.JsEmitter.AfterToken.AFTER_PARENTHESIS, Skew.JsEmitter.BracesMode.MUST_KEEP_BRACES);
        break;
      }

      default: {
        if (Skew.NodeKind.isUnary(kind)) {
          var value1 = node.unaryValue();
          var info = Skew.operatorInfo[kind];

          if (info.precedence < precedence) {
            this.emit("(");
          }

          this.emit(info.text);
          this.emitExpression(value1, info.precedence);

          if (info.precedence < precedence) {
            this.emit(")");
          }
        }

        else if (Skew.NodeKind.isBinary(kind)) {
          var info1 = Skew.operatorInfo[kind];
          var right = node.binaryRight();

          if (info1.precedence < precedence) {
            this.emit("(");
          }

          this.emitExpression(node.binaryLeft(), info1.precedence + (info1.associativity === Skew.Associativity.RIGHT | 0) | 0);

          // Always emit spaces around keyword operators, even when minifying
          this.emit(kind === Skew.NodeKind.IN ? " in " : kind === Skew.NodeKind.IS ? " instanceof " : this.space + (kind === Skew.NodeKind.EQUAL ? "===" : kind === Skew.NodeKind.NOT_EQUAL ? "!==" : info1.text) + this.space);

          // Prevent "x - -1" from becoming "x--1"
          if (this.minify && (kind === Skew.NodeKind.ADD && (right.kind === Skew.NodeKind.POSITIVE || right.kind === Skew.NodeKind.INCREMENT) || kind === Skew.NodeKind.SUBTRACT && (right.kind === Skew.NodeKind.NEGATIVE || right.kind === Skew.NodeKind.DECREMENT || right.isNumberLessThanZero()))) {
            this.emit(" ");
          }

          this.emitExpression(right, info1.precedence + (info1.associativity === Skew.Associativity.LEFT | 0) | 0);

          if (info1.precedence < precedence) {
            this.emit(")");
          }
        }

        else {
          assert(false);
        }
        break;
      }
    }
  };

  Skew.JsEmitter.prototype.patchObject = function(symbol, globalObjects, globalFunctions, globalVariables) {
    var self = this;
    var shouldLiftGlobals = self.mangle && symbol.parent !== null;
    self.allocateNamingGroupIndex(symbol);

    // Scan over child objects
    in_List.removeIf(symbol.objects, function(object) {
      self.patchObject(object, globalObjects, globalFunctions, globalVariables);

      // When mangling, filter out all internal objects and move them to the global namespace
      if (shouldLiftGlobals && !object.isImportedOrExported()) {
        globalObjects.push(object);
        return true;
      }

      return false;
    });

    // Scan over child functions
    var isPrimaryConstructor = true;
    in_List.removeIf(symbol.functions, function($function) {
      self.allocateNamingGroupIndex($function);

      // Check to see if we need an explicit "self" parameter while patching the block
      self.needsSelf = false;
      self.currentSelf = $function.self;
      self.enclosingFunction = $function;
      self.patchNode($function.block);
      self.enclosingFunction = null;

      // Only insert the "self" variable if required to handle capture inside lambdas
      if (self.needsSelf) {
        self.unionVariableWithFunction($function.self, $function);

        if ($function.block !== null) {
          $function.self.value = new Skew.Node(Skew.NodeKind.NAME).withContent(new Skew.StringContent("this"));
          $function.block.children.unshift(Skew.Node.createVar($function.self));
        }
      }

      else if ($function.self !== null) {
        $function.self.name = "this";
        $function.self.flags |= Skew.Symbol.IS_EXPORTED;
      }

      for (var i = 0, list = $function.$arguments, count = list.length; i < count; ++i) {
        var argument = list[i];
        self.allocateNamingGroupIndex(argument);
        self.unionVariableWithFunction(argument, $function);
      }

      // When mangling, filter out all internal global functions and move them to the global namespace
      if (shouldLiftGlobals && $function.kind === Skew.SymbolKind.FUNCTION_GLOBAL && !$function.isImportedOrExported()) {
        globalFunctions.push($function);
        return true;
      }

      // Rename extra constructors overloads so they don't conflict
      if ($function.kind === Skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
        if (isPrimaryConstructor) {
          $function.flags |= Skew.Symbol.IS_PRIMARY_CONSTRUCTOR;
          isPrimaryConstructor = false;
        }
      }

      return false;
    });

    // Scan over child variables
    in_List.removeIf(symbol.variables, function(variable) {
      self.allocateNamingGroupIndex(variable);
      self.patchNode(variable.value);

      // When mangling, filter out all internal global variables and move them to the global namespace
      if (shouldLiftGlobals && variable.kind === Skew.SymbolKind.VARIABLE_GLOBAL && !variable.isImportedOrExported()) {
        globalVariables.push(variable);
        return true;
      }

      return false;
    });
  };

  Skew.JsEmitter.prototype.createIntBinary = function(kind, left, right) {
    if (kind === Skew.NodeKind.MULTIPLY) {
      this.needsMultiply = true;
      return Skew.Node.createCall(new Skew.Node(Skew.NodeKind.NAME).withContent(new Skew.StringContent(this.multiply.name)).withSymbol(this.multiply), [left, right]).withType(this.cache.intType);
    }

    return this.wrapWithIntCast(Skew.Node.createBinary(kind, left, right).withType(this.cache.intType));
  };

  Skew.JsEmitter.prototype.wrapWithNot = function(node) {
    return Skew.Node.createUnary(Skew.NodeKind.NOT, node).withType(this.cache.boolType).withRange(node.range);
  };

  Skew.JsEmitter.prototype.wrapWithIntCast = function(node) {
    return Skew.Node.createBinary(Skew.NodeKind.BITWISE_OR, node, new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.IntContent(0)).withType(this.cache.intType)).withType(this.cache.intType).withRange(node.range);
  };

  Skew.JsEmitter.prototype.patchBinaryArithmetic = function(node) {
    // Make sure arithmetic integer operators don't emit doubles outside the
    // integer range. Allowing this causes JIT slowdowns due to extra checks
    // during compilation and potential deoptimizations during execution.
    if (node.resolvedType === this.cache.intType && !Skew.JsEmitter.alwaysConvertsOperandsToInt(node.parent)) {
      var left = node.binaryLeft();
      var right = node.binaryRight();

      if (left.resolvedType === this.cache.intType && right.resolvedType === this.cache.intType) {
        node.become(this.createIntBinary(node.kind, left.replaceWithNull(), right.replaceWithNull()).withRange(node.range));
      }
    }
  };

  // Group each variable inside the function with the function itself so that
  // they can be renamed together and won't cause any collisions inside the
  // function
  Skew.JsEmitter.prototype.unionVariableWithFunction = function(symbol, $function) {
    if (this.mangle && $function !== null) {
      assert(symbol.id in this.namingGroupIndexForSymbol);
      assert($function.id in this.namingGroupIndexForSymbol);
      this.localVariableUnionFind.union(this.namingGroupIndexForSymbol[symbol.id], this.namingGroupIndexForSymbol[$function.id]);
    }
  };

  Skew.JsEmitter.prototype.patchNode = function(node) {
    if (node === null) {
      return;
    }

    var oldEnclosingFunction = this.enclosingFunction;
    var children = node.children;
    var symbol = node.symbol;
    var kind = node.kind;

    if (this.mangle && symbol !== null) {
      this.allocateNamingGroupIndex(symbol);

      if (node.kind !== Skew.NodeKind.TYPE) {
        this.symbolCounts[symbol.id] = in_IntMap.get(this.symbolCounts, symbol.id, 0) + 1 | 0;
      }
    }

    if (children !== null) {
      if (kind === Skew.NodeKind.LAMBDA) {
        this.enclosingFunction = symbol.asFunctionSymbol();
      }

      for (var i = 0, list = children, count = list.length; i < count; ++i) {
        var child = list[i];
        this.patchNode(child);
      }

      if (kind === Skew.NodeKind.LAMBDA) {
        this.enclosingFunction = oldEnclosingFunction;
      }
    }

    switch (kind) {
      case Skew.NodeKind.ADD:
      case Skew.NodeKind.SUBTRACT:
      case Skew.NodeKind.MULTIPLY:
      case Skew.NodeKind.DIVIDE:
      case Skew.NodeKind.REMAINDER: {
        this.patchBinaryArithmetic(node);
        break;
      }

      case Skew.NodeKind.BLOCK: {
        if (this.mangle) {
          this.peepholeMangleBlock(node);
        }
        break;
      }

      case Skew.NodeKind.CAST: {
        this.patchCast(node);
        break;
      }

      case Skew.NodeKind.FOREACH: {
        this.unionVariableWithFunction(symbol, this.enclosingFunction);
        break;
      }

      case Skew.NodeKind.IF: {
        if (this.mangle) {
          this.peepholeMangleIf(node);
        }
        break;
      }

      case Skew.NodeKind.HOOK: {
        if (this.mangle) {
          this.peepholeMangleHook(node);
        }
        break;
      }

      case Skew.NodeKind.LAMBDA: {
        var $function = symbol.asFunctionSymbol();

        for (var i1 = 0, list1 = $function.$arguments, count1 = list1.length; i1 < count1; ++i1) {
          var argument = list1[i1];
          this.allocateNamingGroupIndex(argument);
          this.unionVariableWithFunction(argument, $function);
        }

        this.unionVariableWithFunction($function, this.enclosingFunction);
        break;
      }

      case Skew.NodeKind.NAME: {
        if (symbol !== null && symbol === this.currentSelf && this.enclosingFunction !== null && this.enclosingFunction.kind === Skew.SymbolKind.FUNCTION_LOCAL) {
          this.needsSelf = true;
        }
        break;
      }

      case Skew.NodeKind.TRY: {
        this.patchTry(node);
        break;
      }

      case Skew.NodeKind.VAR: {
        this.unionVariableWithFunction(symbol, this.enclosingFunction);
        break;
      }
    }
  };

  Skew.JsEmitter.prototype.patchTry = function(node) {
    if (node.children.length > 2) {
      var children = node.removeChildren();
      var tryNode = children[0];
      var finallyNode = in_List.last(children);
      var variable = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_LOCAL, children.length === 3 && children[1].symbol !== null ? children[1].symbol.name : this.enclosingFunction.scope.generateName("e"));
      var block = new Skew.Node(Skew.NodeKind.BLOCK).withChildren([Skew.Node.createThrow(Skew.Node.createSymbolReference(variable))]);

      for (var i = 1, count = children.length - 1 | 0; i < count; ++i) {
        var child = children[(children.length - i | 0) - 1 | 0];
        var catchBlock = child.catchBlock().replaceWithNull();

        // Just rename all catch symbols to the same name instead of substituting the variable
        if (child.symbol !== null) {
          child.symbol.name = variable.name;
        }

        // Build up the chain of tests in reverse
        if (child.symbol !== null && child.symbol.resolvedType !== Skew.Type.DYNAMIC) {
          var test = Skew.Node.createBinary(Skew.NodeKind.IS, Skew.Node.createSymbolReference(variable), new Skew.Node(Skew.NodeKind.TYPE).withType(child.symbol.resolvedType));
          block = new Skew.Node(Skew.NodeKind.BLOCK).withChildren([catchBlock.children.length === 0 ? Skew.Node.createIf(Skew.Node.createUnary(Skew.NodeKind.NOT, test), block, null) : Skew.Node.createIf(test, catchBlock, block)]);
        }

        else {
          block = catchBlock;
        }
      }

      node.withChildren([tryNode, Skew.Node.createCatch(variable, block), finallyNode]);
    }
  };

  Skew.JsEmitter.prototype.assignSourceIfNoSideEffects = function(node) {
    if (node.kind === Skew.NodeKind.ASSIGN) {
      var right = node.binaryRight();
      return node.binaryLeft().hasNoSideEffects() && right.hasNoSideEffects() ? right : null;
    }

    if (node.kind === Skew.NodeKind.ASSIGN_INDEX) {
      var children = node.children;
      return children.length === 3 && children[0].hasNoSideEffects() && children[1].hasNoSideEffects() && children[2].hasNoSideEffects() ? children[2] : null;
    }

    return null;
  };

  Skew.JsEmitter.prototype.peepholeMangleSequence = function(node) {
    assert(node.kind === Skew.NodeKind.SEQUENCE);

    // "a = 0, b[c] = 0, d = 0;" => "a = b[c] = d = 0;"
    var i = node.children.length - 1 | 0;

    while (i > 0) {
      var current = node.children[i];
      var currentRight = this.assignSourceIfNoSideEffects(current);

      if (currentRight !== null) {
        while (i !== 0) {
          var previous = node.children[i - 1 | 0];
          var previousRight = this.assignSourceIfNoSideEffects(previous);

          if (previousRight === null || !this.looksTheSame(previousRight, currentRight)) {
            break;
          }

          previousRight.replaceWith(current.remove());
          current = previous;
          --i;
        }
      }

      --i;
    }
  };

  Skew.JsEmitter.prototype.joinExpressions = function(left, right) {
    var sequence = new Skew.Node(Skew.NodeKind.SEQUENCE).withChildren(left.kind === Skew.NodeKind.SEQUENCE ? left.removeChildren() : [left]);
    sequence.appendChildren(right.kind === Skew.NodeKind.SEQUENCE ? right.removeChildren() : [right]);
    return sequence;
  };

  Skew.JsEmitter.prototype.looksTheSame = function(left, right) {
    if (left.kind === right.kind) {
      switch (left.kind) {
        case Skew.NodeKind.NULL: {
          return true;
        }

        case Skew.NodeKind.CONSTANT: {
          switch (left.content.kind()) {
            case Skew.ContentKind.INT: {
              return right.isInt() && left.asInt() === right.asInt();
            }

            case Skew.ContentKind.BOOL: {
              return right.isBool() && left.asBool() === right.asBool();
            }

            case Skew.ContentKind.DOUBLE: {
              return right.isDouble() && left.asDouble() === right.asDouble();
            }

            case Skew.ContentKind.STRING: {
              return right.isString() && left.asString() === right.asString();
            }
          }
          break;
        }

        case Skew.NodeKind.NAME: {
          return left.symbol !== null && left.symbol === right.symbol || left.symbol === null && right.symbol === null && left.asString() === right.asString();
        }

        case Skew.NodeKind.DOT: {
          return left.symbol === right.symbol && this.looksTheSame(left.dotTarget(), right.dotTarget());
        }
      }
    }

    // Null literals are always implicitly casted, so unwrap implicit casts
    if (left.kind === Skew.NodeKind.CAST) {
      return this.looksTheSame(left.castValue(), right);
    }

    if (right.kind === Skew.NodeKind.CAST) {
      return this.looksTheSame(left, right.castValue());
    }

    return false;
  };

  // Simplifies the node assuming it's used in a boolean context
  Skew.JsEmitter.prototype.peepholeMangleBoolean = function(node, canSwap) {
    var kind = node.kind;

    if (kind === Skew.NodeKind.EQUAL || kind === Skew.NodeKind.NOT_EQUAL) {
      var left = node.binaryLeft();
      var right = node.binaryRight();
      var replacement = Skew.JsEmitter.isFalsy(right) ? left : Skew.JsEmitter.isFalsy(left) ? right : null;

      // "if (a != 0) b;" => "if (a) b;"
      if (replacement !== null) {
        // This minification is not valid for floating-point values because
        // of NaN, since NaN != 0 but NaN is falsy in JavaScript
        if (left.resolvedType !== null && left.resolvedType !== this.cache.doubleType && right.resolvedType !== null && right.resolvedType !== this.cache.doubleType) {
          replacement.replaceWithNull();
          node.become(kind === Skew.NodeKind.EQUAL ? Skew.Node.createUnary(Skew.NodeKind.NOT, replacement) : replacement);
        }
      }

      else if (left.resolvedType === this.cache.intType && right.resolvedType === this.cache.intType && (kind === Skew.NodeKind.NOT_EQUAL || kind === Skew.NodeKind.EQUAL && canSwap === Skew.BooleanSwap.SWAP)) {
        // "if (a != -1) c;" => "if (~a) c;"
        // "if (a == -1) c; else d;" => "if (~a) d; else c;"
        if (right.isInt() && right.asInt() === -1) {
          node.become(Skew.Node.createUnary(Skew.NodeKind.COMPLEMENT, left.replaceWithNull()));
        }

        // "if (-1 != b) c;" => "if (~b) c;"
        // "if (-1 == b) c; else d;" => "if (~b) d; else c;"
        else if (left.isInt() && left.asInt() === -1) {
          node.become(Skew.Node.createUnary(Skew.NodeKind.COMPLEMENT, right.replaceWithNull()));
        }

        // "if (a != b) c;" => "if (a ^ b) c;"
        // "if (a == b) c; else d;" => "if (a ^ b) d; else c;"
        else {
          node.kind = Skew.NodeKind.BITWISE_XOR;
        }

        return kind === Skew.NodeKind.EQUAL ? Skew.BooleanSwap.SWAP : Skew.BooleanSwap.NO_SWAP;
      }
    }

    // "if (a != 0 || b != 0) c;" => "if (a || b) c;"
    else if (kind === Skew.NodeKind.LOGICAL_AND || kind === Skew.NodeKind.LOGICAL_OR) {
      this.peepholeMangleBoolean(node.binaryLeft(), Skew.BooleanSwap.NO_SWAP);
      this.peepholeMangleBoolean(node.binaryRight(), Skew.BooleanSwap.NO_SWAP);
    }

    // "if (!a) b; else c;" => "if (a) c; else b;"
    // "a == 0 ? b : c;" => "a ? c : b;"
    // This is not an "else if" check since EQUAL may be turned into NOT above
    if (node.kind === Skew.NodeKind.NOT && canSwap === Skew.BooleanSwap.SWAP) {
      node.become(node.unaryValue().replaceWithNull());
      return Skew.BooleanSwap.SWAP;
    }

    return Skew.BooleanSwap.NO_SWAP;
  };

  Skew.JsEmitter.prototype.peepholeMangleIf = function(node) {
    var test = node.ifTest();
    var trueBlock = node.ifTrue();
    var falseBlock = node.ifFalse();
    var trueStatement = trueBlock.blockStatement();
    var swapped = this.peepholeMangleBoolean(test, falseBlock !== null || trueStatement !== null && trueStatement.kind === Skew.NodeKind.EXPRESSION ? Skew.BooleanSwap.SWAP : Skew.BooleanSwap.NO_SWAP);

    if (falseBlock !== null) {
      var falseStatement = falseBlock.blockStatement();

      // "if (!a) b; else c;" => "if (a) c; else b;"
      if (swapped === Skew.BooleanSwap.SWAP) {
        var block = trueBlock;
        trueBlock = falseBlock;
        falseBlock = block;
        var statement = trueStatement;
        trueStatement = falseStatement;
        falseStatement = statement;
        trueBlock.swapWith(falseBlock);
      }

      if (trueStatement !== null && falseStatement !== null) {
        // "if (a) b; else c;" => "a ? b : c;"
        if (trueStatement.kind === Skew.NodeKind.EXPRESSION && falseStatement.kind === Skew.NodeKind.EXPRESSION) {
          var hook = Skew.Node.createHook(test.replaceWithNull(), trueStatement.expressionValue().replaceWithNull(), falseStatement.expressionValue().replaceWithNull());
          this.peepholeMangleHook(hook);
          node.become(Skew.Node.createExpression(hook));
        }

        // "if (a) return b; else return c;" => "return a ? b : c;"
        else if (trueStatement.kind === Skew.NodeKind.RETURN && falseStatement.kind === Skew.NodeKind.RETURN) {
          var trueValue = trueStatement.returnValue();
          var falseValue = falseStatement.returnValue();

          if (trueValue !== null && falseValue !== null) {
            var hook1 = Skew.Node.createHook(test.replaceWithNull(), trueValue.replaceWithNull(), falseValue.replaceWithNull());
            this.peepholeMangleHook(hook1);
            node.become(Skew.Node.createReturn(hook1));
          }
        }
      }
    }

    // "if (a) b;" => "a && b;"
    // "if (!a) b;" => "a || b;"
    else if (trueStatement !== null && trueStatement.kind === Skew.NodeKind.EXPRESSION) {
      var value = trueStatement.expressionValue().replaceWithNull();
      node.become(Skew.Node.createExpression(Skew.Node.createBinary(swapped === Skew.BooleanSwap.SWAP ? Skew.NodeKind.LOGICAL_OR : Skew.NodeKind.LOGICAL_AND, test.replaceWithNull(), value)));
    }
  };

  Skew.JsEmitter.prototype.peepholeMangleHook = function(node) {
    var test = node.hookTest();
    var trueValue = node.hookTrue();
    var falseValue = node.hookFalse();
    var swapped = this.peepholeMangleBoolean(test, Skew.BooleanSwap.SWAP);

    // "!a ? b : c;" => "a ? c : b;"
    if (swapped === Skew.BooleanSwap.SWAP) {
      var temp = trueValue;
      trueValue = falseValue;
      falseValue = temp;
      trueValue.swapWith(falseValue);
    }

    // "a ? a : b" => "a || b"
    if (this.looksTheSame(test, trueValue) && test.hasNoSideEffects()) {
      node.become(Skew.Node.createBinary(Skew.NodeKind.LOGICAL_OR, test.replaceWithNull(), falseValue.replaceWithNull()));
      return;
    }

    // "a ? b : a" => "a && b"
    if (this.looksTheSame(test, falseValue) && test.hasNoSideEffects()) {
      node.become(Skew.Node.createBinary(Skew.NodeKind.LOGICAL_AND, test.replaceWithNull(), trueValue.replaceWithNull()));
      return;
    }

    // "a ? b : b" => "a, b"
    if (this.looksTheSame(trueValue, falseValue)) {
      node.become(test.hasNoSideEffects() ? trueValue.replaceWithNull() : new Skew.Node(Skew.NodeKind.SEQUENCE).withChildren([test.replaceWithNull(), trueValue.replaceWithNull()]));
      return;
    }

    // Collapse partially-identical hook expressions
    if (falseValue.kind === Skew.NodeKind.HOOK) {
      var falseTest = falseValue.hookTest();
      var falseTrueValue = falseValue.hookTrue();
      var falseFalseValue = falseValue.hookFalse();

      // "a ? b : c ? b : d" => "a || c ? b : d"
      if (this.looksTheSame(trueValue, falseTrueValue)) {
        var or = Skew.Node.createBinary(Skew.NodeKind.LOGICAL_OR, new Skew.Node(Skew.NodeKind.NULL), falseTest.replaceWithNull());
        or.binaryLeft().replaceWith(test.replaceWith(or));
        falseValue.replaceWith(falseFalseValue.replaceWithNull());
        this.peepholeMangleHook(node);
        return;
      }
    }

    // Collapse partially-identical binary expressions
    if (trueValue.kind === falseValue.kind && Skew.NodeKind.isBinary(trueValue.kind)) {
      var trueLeft = trueValue.binaryLeft();
      var trueRight = trueValue.binaryRight();
      var falseLeft = falseValue.binaryLeft();
      var falseRight = falseValue.binaryRight();

      // "a ? b = c : b = d;" => "b = a ? c : d;"
      if (this.looksTheSame(trueLeft, falseLeft)) {
        var hook = Skew.Node.createHook(test.replaceWithNull(), trueRight.replaceWithNull(), falseRight.replaceWithNull());
        this.peepholeMangleHook(hook);
        node.become(Skew.Node.createBinary(trueValue.kind, trueLeft.replaceWithNull(), hook));
      }

      // "a ? b + 100 : c + 100;" => "(a ? b + c) + 100;"
      else if (this.looksTheSame(trueRight, falseRight) && !Skew.NodeKind.isBinaryAssign(trueValue.kind)) {
        var hook1 = Skew.Node.createHook(test.replaceWithNull(), trueLeft.replaceWithNull(), falseLeft.replaceWithNull());
        this.peepholeMangleHook(hook1);
        node.become(Skew.Node.createBinary(trueValue.kind, hook1, trueRight.replaceWithNull()));
      }
    }
  };

  Skew.JsEmitter.prototype.peepholeMangleBlock = function(node) {
    var children = node.children;
    var i = 0;

    while (i < children.length) {
      var child = children[i];
      var kind = child.kind;

      // "a; b; c;" => "a, b, c;"
      if (kind === Skew.NodeKind.EXPRESSION) {
        while ((i + 1 | 0) < children.length) {
          var next = children[i + 1 | 0];

          if (next.kind !== Skew.NodeKind.EXPRESSION) {
            break;
          }

          var combined = Skew.Node.createExpression(this.joinExpressions(child.expressionValue().replaceWithNull(), next.remove().expressionValue().replaceWithNull()));
          child.replaceWith(combined);
          child = combined;
        }

        var value = child.expressionValue();

        if (value.kind === Skew.NodeKind.SEQUENCE) {
          this.peepholeMangleSequence(value);
        }
      }

      else if (kind === Skew.NodeKind.RETURN && child.returnValue() !== null) {
        while (i !== 0) {
          var previous = children[i - 1 | 0];

          // "if (a) return b; if (c) return d; return e;" => "return a ? b : c ? d : e;"
          if (previous.kind === Skew.NodeKind.IF && previous.ifFalse() === null) {
            var statement = previous.ifTrue().blockStatement();

            if (statement !== null && statement.kind === Skew.NodeKind.RETURN && statement.returnValue() !== null) {
              var hook = Skew.Node.createHook(previous.ifTest().replaceWithNull(), statement.returnValue().replaceWithNull(), child.returnValue().replaceWithNull());
              this.peepholeMangleHook(hook);
              child.remove();
              child = Skew.Node.createReturn(hook);
              previous.replaceWith(child);
            }

            else {
              break;
            }
          }

          else {
            break;
          }

          --i;
        }
      }

      ++i;
    }
  };

  Skew.JsEmitter.prototype.patchCast = function(node) {
    var value = node.castValue();
    var type = node.resolvedType;
    var valueType = value.resolvedType;

    // Cast to bool
    if (type === this.cache.boolType) {
      if (valueType !== this.cache.boolType) {
        node.become(this.wrapWithNot(this.wrapWithNot(value.replaceWithNull())));
      }
    }

    // Cast to int
    else if (this.cache.isInteger(type)) {
      if (!this.cache.isInteger(valueType) && !Skew.JsEmitter.alwaysConvertsOperandsToInt(node.parent)) {
        node.become(this.wrapWithIntCast(value.replaceWithNull()));
      }
    }

    // Cast to double
    else if (type === this.cache.doubleType) {
      if (!this.cache.isNumeric(valueType)) {
        node.become(Skew.Node.createUnary(Skew.NodeKind.POSITIVE, value.replaceWithNull()).withRange(node.range).withType(this.cache.doubleType));
      }
    }

    // Cast to string
    else if (type === this.cache.stringType) {
      if (valueType !== this.cache.stringType) {
        node.become(Skew.Node.createBinary(Skew.NodeKind.ADD, value.replaceWithNull(), new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.StringContent("")).withType(this.cache.stringType)).withType(this.cache.stringType).withRange(node.range));
      }
    }
  };

  Skew.JsEmitter.isCompactNodeKind = function(kind) {
    return kind === Skew.NodeKind.EXPRESSION || kind === Skew.NodeKind.VAR || Skew.NodeKind.isJump(kind);
  };

  Skew.JsEmitter.isFalsy = function(node) {
    switch (node.kind) {
      case Skew.NodeKind.NULL: {
        return true;
      }

      case Skew.NodeKind.CAST: {
        return Skew.JsEmitter.isFalsy(node.castValue());
      }

      case Skew.NodeKind.CONSTANT: {
        var content = node.content;

        switch (content.kind()) {
          case Skew.ContentKind.INT: {
            return content.asInt() === 0;
          }

          case Skew.ContentKind.DOUBLE: {
            return content.asDouble() === 0 || isNaN(content.asDouble());
          }

          case Skew.ContentKind.STRING: {
            return content.asString() === "";
          }
        }
        break;
      }
    }

    return false;
  };

  Skew.JsEmitter.fullName = function(symbol) {
    var parent = symbol.parent;

    if (parent !== null && parent.kind !== Skew.SymbolKind.OBJECT_GLOBAL) {
      var enclosingName = Skew.JsEmitter.fullName(parent);

      if (symbol.isPrimaryConstructor()) {
        return enclosingName;
      }

      if (symbol.kind === Skew.SymbolKind.FUNCTION_INSTANCE) {
        enclosingName += ".prototype";
      }

      return enclosingName + "." + Skew.JsEmitter.mangleName(symbol);
    }

    return Skew.JsEmitter.mangleName(symbol);
  };

  Skew.JsEmitter.mangleName = function(symbol) {
    if (symbol.isPrimaryConstructor()) {
      symbol = symbol.parent;
    }

    if (!symbol.isImportedOrExported() && (symbol.name in Skew.JsEmitter.isKeyword || symbol.parent !== null && symbol.parent.kind === Skew.SymbolKind.OBJECT_CLASS && !Skew.SymbolKind.isOnInstances(symbol.kind) && symbol.name in Skew.JsEmitter.isFunctionProperty)) {
      return "$" + symbol.name;
    }

    return symbol.nameWithRenaming();
  };

  Skew.JsEmitter.needsExtends = function(objects) {
    for (var i = 0, list = objects, count = list.length; i < count; ++i) {
      var object = list[i];

      if (!object.isImported() && object.baseClass !== null) {
        return true;
      }
    }

    return false;
  };

  Skew.JsEmitter.computePrefix = function(symbol) {
    assert(Skew.SymbolKind.isObject(symbol.kind));
    return symbol.kind === Skew.SymbolKind.OBJECT_GLOBAL ? "" : Skew.JsEmitter.computePrefix(symbol.parent.asObjectSymbol()) + Skew.JsEmitter.mangleName(symbol) + ".";
  };

  Skew.JsEmitter.alwaysConvertsOperandsToInt = function(node) {
    if (node !== null) {
      switch (node.kind) {
        case Skew.NodeKind.ASSIGN_BITWISE_AND:
        case Skew.NodeKind.ASSIGN_BITWISE_OR:
        case Skew.NodeKind.ASSIGN_BITWISE_XOR:
        case Skew.NodeKind.ASSIGN_SHIFT_LEFT:
        case Skew.NodeKind.ASSIGN_SHIFT_RIGHT:
        case Skew.NodeKind.BITWISE_AND:
        case Skew.NodeKind.BITWISE_OR:
        case Skew.NodeKind.BITWISE_XOR:
        case Skew.NodeKind.COMPLEMENT:
        case Skew.NodeKind.SHIFT_LEFT:
        case Skew.NodeKind.SHIFT_RIGHT: {
          return true;
        }
      }
    }

    return false;
  };

  Skew.JsEmitter.AfterToken = {
    AFTER_KEYWORD: 0,
    AFTER_PARENTHESIS: 1
  };

  Skew.JsEmitter.BracesMode = {
    MUST_KEEP_BRACES: 0,
    CAN_OMIT_BRACES: 1
  };

  // These dump() functions are helpful for debugging syntax trees
  Skew.LispTreeEmitter = function(options) {
    Skew.Emitter.call(this);
    this.options = options;
  };

  __extends(Skew.LispTreeEmitter, Skew.Emitter);

  Skew.LispTreeEmitter.prototype.visit = function(global) {
    this.visitObject(global);
    this.emit("\n");
    this.createSource(this.options.outputDirectory !== "" ? this.options.outputDirectory + "/compiled.lisp" : this.options.outputFile);
  };

  Skew.LispTreeEmitter.prototype.visitObject = function(symbol) {
    this.emit("(" + this.mangleKind(Skew.SymbolKind.strings[symbol.kind]) + " " + Skew.quoteString(symbol.name, 34));
    this.increaseIndent();

    for (var i = 0, list = symbol.objects, count = list.length; i < count; ++i) {
      var object = list[i];
      this.emit("\n" + this.indent);
      this.visitObject(object);
    }

    for (var i1 = 0, list1 = symbol.functions, count1 = list1.length; i1 < count1; ++i1) {
      var $function = list1[i1];
      this.emit("\n" + this.indent);
      this.visitFunction($function);
    }

    for (var i2 = 0, list2 = symbol.variables, count2 = list2.length; i2 < count2; ++i2) {
      var variable = list2[i2];
      this.emit("\n" + this.indent);
      this.visitVariable(variable);
    }

    this.decreaseIndent();
    this.emit(")");
  };

  Skew.LispTreeEmitter.prototype.visitFunction = function(symbol) {
    this.emit("(" + this.mangleKind(Skew.SymbolKind.strings[symbol.kind]) + " " + Skew.quoteString(symbol.name, 34));
    this.increaseIndent();

    for (var i = 0, list = symbol.$arguments, count = list.length; i < count; ++i) {
      var argument = list[i];
      this.emit("\n" + this.indent);
      this.visitVariable(argument);
    }

    this.emit("\n" + this.indent);
    this.visitNode(symbol.returnType);
    this.emit("\n" + this.indent);
    this.visitNode(symbol.block);
    this.decreaseIndent();
    this.emit(")");
  };

  Skew.LispTreeEmitter.prototype.visitVariable = function(symbol) {
    this.emit("(" + this.mangleKind(Skew.SymbolKind.strings[symbol.kind]) + " " + Skew.quoteString(symbol.name, 34) + " ");
    this.visitNode(symbol.type);
    this.emit(" ");
    this.visitNode(symbol.value);
    this.emit(")");
  };

  Skew.LispTreeEmitter.prototype.visitNode = function(node) {
    if (node === null) {
      this.emit("nil");
      return;
    }

    this.emit("(" + this.mangleKind(Skew.NodeKind.strings[node.kind]));
    var content = node.content;

    if (content !== null) {
      switch (content.kind()) {
        case Skew.ContentKind.INT: {
          this.emit(" " + content.asInt().toString());
          break;
        }

        case Skew.ContentKind.BOOL: {
          this.emit(" " + content.asBool().toString());
          break;
        }

        case Skew.ContentKind.DOUBLE: {
          this.emit(" " + content.asDouble().toString());
          break;
        }

        case Skew.ContentKind.STRING: {
          this.emit(" " + Skew.quoteString(content.asString(), 34));
          break;
        }
      }
    }

    if (node.kind === Skew.NodeKind.VAR) {
      this.emit(" ");
      this.visitVariable(node.symbol.asVariableSymbol());
    }

    else if (node.kind === Skew.NodeKind.LAMBDA) {
      this.emit(" ");
      this.visitFunction(node.symbol.asFunctionSymbol());
    }

    else if (node.children !== null) {
      this.increaseIndent();

      for (var i = 0, list = node.children, count = list.length; i < count; ++i) {
        var child = list[i];
        this.emit("\n" + this.indent);
        this.visitNode(child);
      }

      this.decreaseIndent();
    }

    this.emit(")");
  };

  Skew.LispTreeEmitter.prototype.mangleKind = function(kind) {
    return kind.toLowerCase().split("_").join("-");
  };

  Skew.ContentKind = {
    BOOL: 0,
    INT: 1,
    DOUBLE: 2,
    STRING: 3
  };

  Skew.Content = function() {
  };

  Skew.Content.prototype.asBool = function() {
    assert(this.kind() === Skew.ContentKind.BOOL);
    return this.value;
  };

  Skew.Content.prototype.asInt = function() {
    assert(this.kind() === Skew.ContentKind.INT);
    return this.value;
  };

  Skew.Content.prototype.asDouble = function() {
    assert(this.kind() === Skew.ContentKind.DOUBLE);
    return this.value;
  };

  Skew.Content.prototype.asString = function() {
    assert(this.kind() === Skew.ContentKind.STRING);
    return this.value;
  };

  Skew.BoolContent = function(value) {
    Skew.Content.call(this);
    this.value = value;
  };

  __extends(Skew.BoolContent, Skew.Content);

  Skew.BoolContent.prototype.kind = function() {
    return Skew.ContentKind.BOOL;
  };

  Skew.IntContent = function(value) {
    Skew.Content.call(this);
    this.value = value;
  };

  __extends(Skew.IntContent, Skew.Content);

  Skew.IntContent.prototype.kind = function() {
    return Skew.ContentKind.INT;
  };

  Skew.DoubleContent = function(value) {
    Skew.Content.call(this);
    this.value = value;
  };

  __extends(Skew.DoubleContent, Skew.Content);

  Skew.DoubleContent.prototype.kind = function() {
    return Skew.ContentKind.DOUBLE;
  };

  Skew.StringContent = function(value) {
    Skew.Content.call(this);
    this.value = value;
  };

  __extends(Skew.StringContent, Skew.Content);

  Skew.StringContent.prototype.kind = function() {
    return Skew.ContentKind.STRING;
  };

  Skew.NodeKind = {
    // Other
    ANNOTATION: 0,
    BLOCK: 1,
    CASE: 2,
    CATCH: 3,

    // Statements
    BREAK: 4,
    CONTINUE: 5,
    EXPRESSION: 6,
    FOR: 7,
    FOREACH: 8,
    IF: 9,
    RETURN: 10,
    SWITCH: 11,
    THROW: 12,
    TRY: 13,
    VAR: 14,
    WHILE: 15,

    // Expressions
    ASSIGN_INDEX: 16,
    CALL: 17,
    CAST: 18,
    CONSTANT: 19,
    DOT: 20,
    DYNAMIC: 21,
    HOOK: 22,
    INDEX: 23,
    INITIALIZER_LIST: 24,
    INITIALIZER_MAP: 25,
    INITIALIZER_SET: 26,
    LAMBDA: 27,
    LAMBDA_TYPE: 28,
    NAME: 29,
    NULL: 30,
    PAIR: 31,
    PARAMETERIZE: 32,
    SEQUENCE: 33,
    SUPER: 34,
    TYPE: 35,

    // Unary operators
    COMPLEMENT: 36,
    DECREMENT: 37,
    INCREMENT: 38,
    NEGATIVE: 39,
    NOT: 40,
    POSITIVE: 41,

    // Binary operators
    ADD: 42,
    BITWISE_AND: 43,
    BITWISE_OR: 44,
    BITWISE_XOR: 45,
    COMPARE: 46,
    DIVIDE: 47,
    EQUAL: 48,
    IN: 49,
    IS: 50,
    LOGICAL_AND: 51,
    LOGICAL_OR: 52,
    MULTIPLY: 53,
    NOT_EQUAL: 54,
    POWER: 55,
    REMAINDER: 56,
    SHIFT_LEFT: 57,
    SHIFT_RIGHT: 58,
    SUBTRACT: 59,

    // Binary comparison operators
    GREATER_THAN: 60,
    GREATER_THAN_OR_EQUAL: 61,
    LESS_THAN: 62,
    LESS_THAN_OR_EQUAL: 63,

    // Binary assigment operators
    ASSIGN: 64,
    ASSIGN_ADD: 65,
    ASSIGN_BITWISE_AND: 66,
    ASSIGN_BITWISE_OR: 67,
    ASSIGN_BITWISE_XOR: 68,
    ASSIGN_DIVIDE: 69,
    ASSIGN_MULTIPLY: 70,
    ASSIGN_POWER: 71,
    ASSIGN_REMAINDER: 72,
    ASSIGN_SHIFT_LEFT: 73,
    ASSIGN_SHIFT_RIGHT: 74,
    ASSIGN_SUBTRACT: 75
  };

  Skew.NodeKind.isExpression = function(self) {
    return self >= Skew.NodeKind.ASSIGN_INDEX && self <= Skew.NodeKind.ASSIGN_SUBTRACT;
  };

  Skew.NodeKind.isInitializer = function(self) {
    return self >= Skew.NodeKind.INITIALIZER_LIST && self <= Skew.NodeKind.INITIALIZER_SET;
  };

  Skew.NodeKind.isUnary = function(self) {
    return self >= Skew.NodeKind.COMPLEMENT && self <= Skew.NodeKind.POSITIVE;
  };

  Skew.NodeKind.isUnaryAssign = function(self) {
    return self >= Skew.NodeKind.DECREMENT && self <= Skew.NodeKind.INCREMENT;
  };

  Skew.NodeKind.isBinary = function(self) {
    return self >= Skew.NodeKind.ADD && self <= Skew.NodeKind.ASSIGN_SUBTRACT;
  };

  Skew.NodeKind.isBinaryAssign = function(self) {
    return self >= Skew.NodeKind.ASSIGN && self <= Skew.NodeKind.ASSIGN_SUBTRACT;
  };

  Skew.NodeKind.isBinaryComparison = function(self) {
    return self >= Skew.NodeKind.GREATER_THAN && self <= Skew.NodeKind.LESS_THAN_OR_EQUAL;
  };

  Skew.NodeKind.isJump = function(self) {
    return self === Skew.NodeKind.BREAK || self === Skew.NodeKind.CONTINUE || self === Skew.NodeKind.RETURN;
  };

  Skew.NodeKind.isAssign = function(self) {
    return Skew.NodeKind.isUnaryAssign(self) || Skew.NodeKind.isBinaryAssign(self);
  };

  // Flags
  // Nodes represent executable code (variable initializers and function bodies)
  // Node-specific queries
  // Factory functions
  // Getters
  Skew.Node = function(kind) {
    this.kind = kind;
    this.flags = 0;
    this.range = null;
    this.internalRange = null;
    this.symbol = null;
    this.parent = null;
    this.content = null;
    this.resolvedType = null;
    this.comments = null;
    this.children = null;
  };

  // Change self node in place to become the provided node. The parent node is
  // not changed, so become() can be called within a nested method and does not
  // need to report the updated node reference to the caller since the reference
  // does not change.
  Skew.Node.prototype.become = function(node) {
    this.kind = node.kind;
    this.flags = node.flags;
    this.range = node.range;
    this.internalRange = node.internalRange;
    this.symbol = node.symbol;
    this.content = node.content;
    this.resolvedType = node.resolvedType;
    this.comments = node.comments;
    this.removeChildren();
    this.withChildren(node.removeChildren());
  };

  Skew.Node.prototype.clone = function() {
    // Lambda symbols reference their block, which will not get cloned
    assert(this.kind !== Skew.NodeKind.LAMBDA);
    var clone = new Skew.Node(this.kind);
    clone.flags = this.flags;
    clone.range = this.range;
    clone.internalRange = this.internalRange;
    clone.symbol = this.symbol;
    clone.content = this.content;
    clone.resolvedType = this.resolvedType;
    clone.comments = this.comments !== null ? this.comments.slice() : null;

    if (this.children !== null) {
      var clones = [];

      for (var i = 0, list = this.children, count = list.length; i < count; ++i) {
        var child = list[i];
        clones.push(child.clone());
      }

      clone.withChildren(clones);
    }

    return clone;
  };

  Skew.Node.prototype.isImplicitReturn = function() {
    return (this.flags & Skew.Node.IS_IMPLICIT_RETURN) !== 0;
  };

  Skew.Node.prototype.isInsideParentheses = function() {
    return (this.flags & Skew.Node.IS_INSIDE_PARENTHESES) !== 0;
  };

  Skew.Node.prototype.hasChildren = function() {
    return this.children !== null && !(this.children.length === 0);
  };

  Skew.Node.prototype.withFlags = function(value) {
    this.flags = value;
    return this;
  };

  Skew.Node.prototype.withType = function(value) {
    this.resolvedType = value;
    return this;
  };

  Skew.Node.prototype.withSymbol = function(value) {
    this.symbol = value;
    return this;
  };

  Skew.Node.prototype.withContent = function(value) {
    this.content = value;
    return this;
  };

  Skew.Node.prototype.withRange = function(value) {
    this.range = value;
    return this;
  };

  Skew.Node.prototype.withInternalRange = function(value) {
    this.internalRange = value;
    return this;
  };

  Skew.Node.prototype.withChildren = function(nodes) {
    assert(this.children === null);

    if (nodes !== null) {
      for (var i = 0, list = nodes, count = list.length; i < count; ++i) {
        var node = list[i];
        Skew.Node.updateParent(node, this);
      }
    }

    this.children = nodes;
    return this;
  };

  Skew.Node.prototype.withComments = function(value) {
    assert(this.comments === null);
    this.comments = value;
    return this;
  };

  Skew.Node.prototype.internalRangeOrRange = function() {
    return this.internalRange !== null ? this.internalRange : this.range;
  };

  Skew.Node.prototype.indexInParent = function() {
    assert(this.parent !== null);
    return this.parent.children.indexOf(this);
  };

  Skew.Node.prototype.insertChild = function(index, node) {
    if (this.children === null) {
      this.children = [];
    }

    assert(index >= 0 && index <= this.children.length);
    Skew.Node.updateParent(node, this);
    this.children.splice(index, 0, node);
  };

  Skew.Node.prototype.insertChildren = function(index, nodes) {
    if (this.children === null) {
      this.children = [];
    }

    assert(index >= 0 && index <= this.children.length);

    for (var i = 0, list = nodes, count = list.length; i < count; ++i) {
      var node = list[i];
      Skew.Node.updateParent(node, this);
      this.children.splice(index, 0, node);
      ++index;
    }
  };

  Skew.Node.prototype.appendChild = function(node) {
    this.insertChild(this.children === null ? 0 : this.children.length, node);
  };

  Skew.Node.prototype.appendChildren = function(nodes) {
    this.insertChildren(this.children === null ? 0 : this.children.length, nodes);
  };

  Skew.Node.prototype.removeChildAtIndex = function(index) {
    assert(index >= 0 && index < this.children.length);
    var child = this.children[index];
    Skew.Node.updateParent(child, null);
    this.children.splice(index, 1);
    return child;
  };

  Skew.Node.prototype.remove = function() {
    this.parent.removeChildAtIndex(this.indexInParent());
    return this;
  };

  Skew.Node.prototype.removeChildren = function() {
    var result = this.children;

    if (result !== null) {
      for (var i = 0, list = result, count = list.length; i < count; ++i) {
        var child = list[i];
        Skew.Node.updateParent(child, null);
      }

      this.children = null;
    }

    return result;
  };

  Skew.Node.prototype.replaceWithNodes = function(nodes) {
    var index = this.indexInParent();

    for (var i = 0, count = nodes.length; i < count; ++i) {
      this.parent.insertChild((index + i | 0) + 1 | 0, nodes[i]);
    }

    this.parent.removeChildAtIndex(index);
    return this;
  };

  Skew.Node.prototype.replaceChild = function(index, node) {
    assert(index >= 0 && index < this.children.length);
    Skew.Node.updateParent(node, this);
    var child = this.children[index];
    Skew.Node.updateParent(child, null);
    this.children[index] = node;
    return child;
  };

  Skew.Node.prototype.replaceWith = function(node) {
    this.parent.replaceChild(this.indexInParent(), node);
    return this;
  };

  Skew.Node.prototype.replaceWithNull = function() {
    this.parent.replaceChild(this.indexInParent(), null);
    return this;
  };

  Skew.Node.prototype.swapWith = function(node) {
    var parentA = this.parent;
    var parentB = node.parent;
    var indexA = this.indexInParent();
    var indexB = node.indexInParent();
    parentA.children[indexA] = node;
    parentB.children[indexB] = this;
    this.parent = parentB;
    node.parent = parentA;
  };

  Skew.Node.updateParent = function(node, parent) {
    if (node !== null) {
      assert(node.parent === null !== (parent === null));
      node.parent = parent;
    }
  };

  Skew.Node.prototype.isTrue = function() {
    return this.kind === Skew.NodeKind.CONSTANT && this.content.kind() === Skew.ContentKind.BOOL && this.content.asBool();
  };

  Skew.Node.prototype.isFalse = function() {
    return this.kind === Skew.NodeKind.CONSTANT && this.content.kind() === Skew.ContentKind.BOOL && !this.content.asBool();
  };

  Skew.Node.prototype.isType = function() {
    return this.kind === Skew.NodeKind.TYPE || this.kind === Skew.NodeKind.LAMBDA_TYPE || (this.kind === Skew.NodeKind.NAME || this.kind === Skew.NodeKind.DOT || this.kind === Skew.NodeKind.PARAMETERIZE) && this.symbol !== null && Skew.SymbolKind.isType(this.symbol.kind);
  };

  Skew.Node.prototype.isAssignTarget = function() {
    return this.parent !== null && (Skew.NodeKind.isUnaryAssign(this.parent.kind) || Skew.NodeKind.isBinaryAssign(this.parent.kind) && this === this.parent.binaryLeft());
  };

  Skew.Node.prototype.isNumberLessThanZero = function() {
    return this.isInt() && this.asInt() < 0 || this.isDouble() && this.asDouble() < 0;
  };

  Skew.Node.prototype.blockAlwaysEndsWithReturn = function() {
    assert(this.kind === Skew.NodeKind.BLOCK);

    // This checks children in reverse since return statements are almost always last
    for (var i = 0, count = this.children.length; i < count; ++i) {
      var child = this.children[(this.children.length - i | 0) - 1 | 0];

      switch (child.kind) {
        case Skew.NodeKind.RETURN: {
          return true;
        }

        case Skew.NodeKind.IF: {
          var test = child.ifTest();
          var trueBlock = child.ifTrue();
          var falseBlock = child.ifFalse();

          if ((test.isTrue() || falseBlock !== null && falseBlock.blockAlwaysEndsWithReturn()) && (test.isFalse() || trueBlock.blockAlwaysEndsWithReturn())) {
            return true;
          }
          break;
        }

        case Skew.NodeKind.WHILE: {
          if (child.whileTest().isTrue()) {
            return true;
          }
          break;
        }
      }
    }

    return false;
  };

  Skew.Node.prototype.hasNoSideEffects = function() {
    assert(Skew.NodeKind.isExpression(this.kind));

    switch (this.kind) {
      case Skew.NodeKind.NAME:
      case Skew.NodeKind.CONSTANT:
      case Skew.NodeKind.NULL: {
        return true;
      }

      case Skew.NodeKind.CAST: {
        return this.castValue().hasNoSideEffects();
      }

      case Skew.NodeKind.HOOK: {
        return this.hookTest().hasNoSideEffects() && this.hookTrue().hasNoSideEffects() && this.hookFalse().hasNoSideEffects();
      }

      case Skew.NodeKind.DOT: {
        return this.dotTarget().hasNoSideEffects();
      }

      default: {
        if (Skew.NodeKind.isBinary(this.kind)) {
          return !Skew.NodeKind.isBinaryAssign(this.kind) && this.binaryLeft().hasNoSideEffects() && this.binaryRight().hasNoSideEffects();
        }

        if (Skew.NodeKind.isUnary(this.kind)) {
          return !Skew.NodeKind.isUnaryAssign(this.kind) && this.unaryValue().hasNoSideEffects();
        }
        break;
      }
    }

    return false;
  };

  Skew.Node.prototype.invertBooleanCondition = function(cache) {
    assert(Skew.NodeKind.isExpression(this.kind));

    switch (this.kind) {
      case Skew.NodeKind.CONSTANT: {
        if (this.content.kind() === Skew.ContentKind.BOOL) {
          this.content = new Skew.BoolContent(!this.content.asBool());
        }

        return;
      }

      case Skew.NodeKind.NOT: {
        this.become(this.unaryValue().remove());
        return;
      }

      case Skew.NodeKind.EQUAL: {
        this.kind = Skew.NodeKind.NOT_EQUAL;
        return;
      }

      case Skew.NodeKind.NOT_EQUAL: {
        this.kind = Skew.NodeKind.EQUAL;
        return;
      }

      case Skew.NodeKind.LOGICAL_OR: {
        this.kind = Skew.NodeKind.LOGICAL_AND;
        this.binaryLeft().invertBooleanCondition(cache);
        this.binaryRight().invertBooleanCondition(cache);
        return;
      }

      case Skew.NodeKind.LOGICAL_AND: {
        this.kind = Skew.NodeKind.LOGICAL_OR;
        this.binaryLeft().invertBooleanCondition(cache);
        this.binaryRight().invertBooleanCondition(cache);
        return;
      }

      case Skew.NodeKind.LESS_THAN:
      case Skew.NodeKind.GREATER_THAN:
      case Skew.NodeKind.LESS_THAN_OR_EQUAL:
      case Skew.NodeKind.GREATER_THAN_OR_EQUAL: {
        var commonType = cache.commonImplicitType(this.binaryLeft().resolvedType, this.binaryRight().resolvedType);

        if (commonType !== null && commonType !== cache.doubleType) {
          switch (this.kind) {
            case Skew.NodeKind.LESS_THAN: {
              this.kind = Skew.NodeKind.GREATER_THAN_OR_EQUAL;
              break;
            }

            case Skew.NodeKind.GREATER_THAN: {
              this.kind = Skew.NodeKind.LESS_THAN_OR_EQUAL;
              break;
            }

            case Skew.NodeKind.LESS_THAN_OR_EQUAL: {
              this.kind = Skew.NodeKind.GREATER_THAN;
              break;
            }

            case Skew.NodeKind.GREATER_THAN_OR_EQUAL: {
              this.kind = Skew.NodeKind.LESS_THAN;
              break;
            }
          }

          return;
        }
        break;
      }
    }

    // Remove children before clone() so they are moved instead of copied
    var children = this.removeChildren();
    this.become(Skew.Node.createUnary(Skew.NodeKind.NOT, this.clone().withChildren(children)).withType(cache.boolType));
  };

  Skew.Node.createAnnotation = function(value, test) {
    assert(Skew.NodeKind.isExpression(value.kind));
    assert(test === null || Skew.NodeKind.isExpression(test.kind));
    return new Skew.Node(Skew.NodeKind.ANNOTATION).withChildren([value, test]);
  };

  Skew.Node.createCase = function(values, block) {
    assert(block.kind === Skew.NodeKind.BLOCK);
    values.unshift(block);
    return new Skew.Node(Skew.NodeKind.CASE).withChildren(values);
  };

  Skew.Node.createCatch = function(symbol, block) {
    assert(block.kind === Skew.NodeKind.BLOCK);
    return new Skew.Node(Skew.NodeKind.CATCH).withChildren([block]).withSymbol(symbol);
  };

  Skew.Node.createExpression = function(value) {
    assert(Skew.NodeKind.isExpression(value.kind));
    return new Skew.Node(Skew.NodeKind.EXPRESSION).withChildren([value]);
  };

  Skew.Node.createFor = function(setup, test, update, block) {
    assert(test === null || Skew.NodeKind.isExpression(test.kind));
    assert(update === null || Skew.NodeKind.isExpression(update.kind));
    assert(block.kind === Skew.NodeKind.BLOCK);
    in_List.prepend1(setup, [test, update, block]);
    return new Skew.Node(Skew.NodeKind.FOR).withChildren(setup);
  };

  Skew.Node.createForeach = function(symbol, value, block) {
    assert(Skew.NodeKind.isExpression(value.kind));
    assert(block.kind === Skew.NodeKind.BLOCK);
    return new Skew.Node(Skew.NodeKind.FOREACH).withSymbol(symbol).withChildren([value, block]);
  };

  Skew.Node.createIf = function(test, trueBlock, falseBlock) {
    assert(Skew.NodeKind.isExpression(test.kind));
    assert(trueBlock.kind === Skew.NodeKind.BLOCK);
    assert(falseBlock === null || falseBlock.kind === Skew.NodeKind.BLOCK);
    return new Skew.Node(Skew.NodeKind.IF).withChildren([test, trueBlock, falseBlock]);
  };

  Skew.Node.createReturn = function(value) {
    assert(value === null || Skew.NodeKind.isExpression(value.kind));
    return new Skew.Node(Skew.NodeKind.RETURN).withChildren([value]);
  };

  Skew.Node.createSwitch = function(value, cases) {
    assert(Skew.NodeKind.isExpression(value.kind));
    cases.unshift(value);
    return new Skew.Node(Skew.NodeKind.SWITCH).withChildren(cases);
  };

  Skew.Node.createThrow = function(value) {
    assert(Skew.NodeKind.isExpression(value.kind));
    return new Skew.Node(Skew.NodeKind.THROW).withChildren([value]);
  };

  Skew.Node.createTry = function(tryBlock, catches, finallyBlock) {
    assert(tryBlock.kind === Skew.NodeKind.BLOCK);
    assert(finallyBlock === null || finallyBlock.kind === Skew.NodeKind.BLOCK);
    catches.unshift(tryBlock);
    catches.push(finallyBlock);
    return new Skew.Node(Skew.NodeKind.TRY).withChildren(catches);
  };

  // This adds the initializer expression to the tree for ease of traversal
  Skew.Node.createVar = function(symbol) {
    return new Skew.Node(Skew.NodeKind.VAR).withChildren([symbol.value]).withSymbol(symbol);
  };

  Skew.Node.createIndex = function(target, $arguments) {
    assert(Skew.NodeKind.isExpression(target.kind));
    $arguments.unshift(target);
    return new Skew.Node(Skew.NodeKind.INDEX).withChildren($arguments);
  };

  Skew.Node.createCall = function(target, $arguments) {
    assert(Skew.NodeKind.isExpression(target.kind));
    $arguments.unshift(target);
    return new Skew.Node(Skew.NodeKind.CALL).withChildren($arguments);
  };

  Skew.Node.createCast = function(value, type) {
    assert(Skew.NodeKind.isExpression(value.kind));
    assert(Skew.NodeKind.isExpression(type.kind));
    return new Skew.Node(Skew.NodeKind.CAST).withChildren([value, type]);
  };

  Skew.Node.createHook = function(test, trueValue, falseValue) {
    assert(Skew.NodeKind.isExpression(test.kind));
    assert(Skew.NodeKind.isExpression(trueValue.kind));
    assert(Skew.NodeKind.isExpression(falseValue.kind));
    return new Skew.Node(Skew.NodeKind.HOOK).withChildren([test, trueValue, falseValue]);
  };

  Skew.Node.createInitializer = function(kind, values) {
    assert(Skew.NodeKind.isInitializer(kind));
    return new Skew.Node(kind).withChildren(values);
  };

  // This adds the block to the tree for ease of traversal
  Skew.Node.createLambda = function(symbol) {
    return new Skew.Node(Skew.NodeKind.LAMBDA).withChildren([symbol.block]).withSymbol(symbol);
  };

  Skew.Node.createPair = function(first, second) {
    assert(Skew.NodeKind.isExpression(first.kind));
    assert(Skew.NodeKind.isExpression(second.kind));
    return new Skew.Node(Skew.NodeKind.PAIR).withChildren([first, second]);
  };

  Skew.Node.createParameterize = function(type, parameters) {
    assert(Skew.NodeKind.isExpression(type.kind));
    parameters.unshift(type);
    return new Skew.Node(Skew.NodeKind.PARAMETERIZE).withChildren(parameters);
  };

  Skew.Node.createUnary = function(kind, value) {
    assert(Skew.NodeKind.isUnary(kind));
    assert(Skew.NodeKind.isExpression(value.kind));
    return new Skew.Node(kind).withChildren([value]);
  };

  Skew.Node.createBinary = function(kind, left, right) {
    assert(Skew.NodeKind.isBinary(kind));
    assert(Skew.NodeKind.isExpression(left.kind));
    assert(Skew.NodeKind.isExpression(right.kind));
    return new Skew.Node(kind).withChildren([left, right]);
  };

  Skew.Node.createLambdaType = function(argTypes, returnType) {
    argTypes.push(returnType);
    return new Skew.Node(Skew.NodeKind.LAMBDA_TYPE).withChildren(argTypes);
  };

  Skew.Node.createSymbolReference = function(symbol) {
    return new Skew.Node(Skew.NodeKind.NAME).withContent(new Skew.StringContent(symbol.name)).withSymbol(symbol).withType(symbol.resolvedType);
  };

  Skew.Node.createMemberReference = function(target, member) {
    return new Skew.Node(Skew.NodeKind.DOT).withContent(new Skew.StringContent(member.name)).withChildren([target]).withSymbol(member).withType(member.resolvedType);
  };

  Skew.Node.prototype.isInt = function() {
    return this.kind === Skew.NodeKind.CONSTANT && this.content.kind() === Skew.ContentKind.INT;
  };

  Skew.Node.prototype.isBool = function() {
    return this.kind === Skew.NodeKind.CONSTANT && this.content.kind() === Skew.ContentKind.BOOL;
  };

  Skew.Node.prototype.isDouble = function() {
    return this.kind === Skew.NodeKind.CONSTANT && this.content.kind() === Skew.ContentKind.DOUBLE;
  };

  Skew.Node.prototype.isString = function() {
    return this.kind === Skew.NodeKind.CONSTANT && this.content.kind() === Skew.ContentKind.STRING;
  };

  Skew.Node.prototype.asInt = function() {
    assert(this.kind === Skew.NodeKind.CONSTANT);
    return this.content.asInt();
  };

  Skew.Node.prototype.asBool = function() {
    assert(this.kind === Skew.NodeKind.CONSTANT);
    return this.content.asBool();
  };

  Skew.Node.prototype.asDouble = function() {
    assert(this.kind === Skew.NodeKind.CONSTANT);
    return this.content.asDouble();
  };

  Skew.Node.prototype.asString = function() {
    assert(this.kind === Skew.NodeKind.NAME || this.kind === Skew.NodeKind.DOT || this.kind === Skew.NodeKind.CONSTANT);
    return this.content.asString();
  };

  Skew.Node.prototype.blockStatement = function() {
    assert(this.kind === Skew.NodeKind.BLOCK);
    return this.children.length === 1 ? this.children[0] : null;
  };

  Skew.Node.prototype.firstValue = function() {
    assert(this.kind === Skew.NodeKind.PAIR);
    assert(this.children.length === 2);
    assert(Skew.NodeKind.isExpression(this.children[0].kind));
    return this.children[0];
  };

  Skew.Node.prototype.secondValue = function() {
    assert(this.kind === Skew.NodeKind.PAIR);
    assert(this.children.length === 2);
    assert(Skew.NodeKind.isExpression(this.children[1].kind));
    return this.children[1];
  };

  Skew.Node.prototype.dotTarget = function() {
    assert(this.kind === Skew.NodeKind.DOT);
    assert(this.children.length === 1);
    assert(this.children[0] === null || Skew.NodeKind.isExpression(this.children[0].kind));
    return this.children[0];
  };

  Skew.Node.prototype.annotationValue = function() {
    assert(this.kind === Skew.NodeKind.ANNOTATION);
    assert(this.children.length === 2);
    assert(Skew.NodeKind.isExpression(this.children[0].kind));
    return this.children[0];
  };

  Skew.Node.prototype.annotationTest = function() {
    assert(this.kind === Skew.NodeKind.ANNOTATION);
    assert(this.children.length === 2);
    assert(this.children[1] === null || Skew.NodeKind.isExpression(this.children[1].kind));
    return this.children[1];
  };

  Skew.Node.prototype.caseBlock = function() {
    assert(this.kind === Skew.NodeKind.CASE);
    assert(this.children.length >= 1);
    assert(this.children[0].kind === Skew.NodeKind.BLOCK);
    return this.children[0];
  };

  Skew.Node.prototype.catchBlock = function() {
    assert(this.kind === Skew.NodeKind.CATCH);
    assert(this.children.length === 1);
    assert(this.children[0].kind === Skew.NodeKind.BLOCK);
    return this.children[0];
  };

  Skew.Node.prototype.expressionValue = function() {
    assert(this.kind === Skew.NodeKind.EXPRESSION);
    assert(this.children.length === 1);
    assert(Skew.NodeKind.isExpression(this.children[0].kind));
    return this.children[0];
  };

  Skew.Node.prototype.returnValue = function() {
    assert(this.kind === Skew.NodeKind.RETURN);
    assert(this.children.length === 1);
    assert(this.children[0] === null || Skew.NodeKind.isExpression(this.children[0].kind));
    return this.children[0];
  };

  Skew.Node.prototype.switchValue = function() {
    assert(this.kind === Skew.NodeKind.SWITCH);
    assert(this.children.length >= 1);
    assert(Skew.NodeKind.isExpression(this.children[0].kind));
    return this.children[0];
  };

  Skew.Node.prototype.parameterizeValue = function() {
    assert(this.kind === Skew.NodeKind.PARAMETERIZE);
    assert(this.children.length >= 1);
    assert(Skew.NodeKind.isExpression(this.children[0].kind));
    return this.children[0];
  };

  Skew.Node.prototype.callValue = function() {
    assert(this.kind === Skew.NodeKind.CALL);
    assert(this.children.length >= 1);
    assert(Skew.NodeKind.isExpression(this.children[0].kind));
    return this.children[0];
  };

  Skew.Node.prototype.castValue = function() {
    assert(this.kind === Skew.NodeKind.CAST);
    assert(this.children.length === 2);
    assert(Skew.NodeKind.isExpression(this.children[0].kind));
    return this.children[0];
  };

  Skew.Node.prototype.castType = function() {
    assert(this.kind === Skew.NodeKind.CAST);
    assert(this.children.length === 2);
    assert(Skew.NodeKind.isExpression(this.children[1].kind));
    return this.children[1];
  };

  Skew.Node.prototype.unaryValue = function() {
    assert(Skew.NodeKind.isUnary(this.kind));
    assert(this.children.length === 1);
    assert(Skew.NodeKind.isExpression(this.children[0].kind));
    return this.children[0];
  };

  Skew.Node.prototype.binaryLeft = function() {
    assert(Skew.NodeKind.isBinary(this.kind));
    assert(this.children.length === 2);
    assert(Skew.NodeKind.isExpression(this.children[0].kind));
    return this.children[0];
  };

  Skew.Node.prototype.binaryRight = function() {
    assert(Skew.NodeKind.isBinary(this.kind));
    assert(this.children.length === 2);
    assert(Skew.NodeKind.isExpression(this.children[1].kind));
    return this.children[1];
  };

  Skew.Node.prototype.throwValue = function() {
    assert(this.children.length === 1);
    assert(Skew.NodeKind.isExpression(this.children[0].kind));
    return this.children[0];
  };

  Skew.Node.prototype.tryBlock = function() {
    assert(this.kind === Skew.NodeKind.TRY);
    assert(this.children.length >= 2);
    assert(this.children[0].kind === Skew.NodeKind.BLOCK);
    return this.children[0];
  };

  Skew.Node.prototype.finallyBlock = function() {
    assert(this.kind === Skew.NodeKind.TRY);
    assert(this.children.length >= 2);
    assert(in_List.last(this.children) === null || in_List.last(this.children).kind === Skew.NodeKind.BLOCK);
    return in_List.last(this.children);
  };

  Skew.Node.prototype.whileTest = function() {
    assert(this.kind === Skew.NodeKind.WHILE);
    assert(this.children.length === 2);
    assert(Skew.NodeKind.isExpression(this.children[0].kind));
    return this.children[0];
  };

  Skew.Node.prototype.whileBlock = function() {
    assert(this.kind === Skew.NodeKind.WHILE);
    assert(this.children.length === 2);
    assert(this.children[1].kind === Skew.NodeKind.BLOCK);
    return this.children[1];
  };

  Skew.Node.prototype.forTest = function() {
    assert(this.kind === Skew.NodeKind.FOR);
    assert(this.children.length >= 3);
    assert(this.children[0] === null || Skew.NodeKind.isExpression(this.children[0].kind));
    return this.children[0];
  };

  Skew.Node.prototype.forUpdate = function() {
    assert(this.kind === Skew.NodeKind.FOR);
    assert(this.children.length >= 3);
    assert(this.children[1] === null || Skew.NodeKind.isExpression(this.children[1].kind));
    return this.children[1];
  };

  Skew.Node.prototype.forBlock = function() {
    assert(this.kind === Skew.NodeKind.FOR);
    assert(this.children.length >= 3);
    assert(this.children[2].kind === Skew.NodeKind.BLOCK);
    return this.children[2];
  };

  Skew.Node.prototype.foreachValue = function() {
    assert(this.kind === Skew.NodeKind.FOREACH);
    assert(this.children.length === 2);
    assert(Skew.NodeKind.isExpression(this.children[0].kind));
    return this.children[0];
  };

  Skew.Node.prototype.foreachBlock = function() {
    assert(this.kind === Skew.NodeKind.FOREACH);
    assert(this.children.length === 2);
    assert(this.children[1].kind === Skew.NodeKind.BLOCK);
    return this.children[1];
  };

  Skew.Node.prototype.ifTest = function() {
    assert(this.kind === Skew.NodeKind.IF);
    assert(this.children.length === 3);
    assert(Skew.NodeKind.isExpression(this.children[0].kind));
    return this.children[0];
  };

  Skew.Node.prototype.ifTrue = function() {
    assert(this.kind === Skew.NodeKind.IF);
    assert(this.children.length === 3);
    assert(this.children[1].kind === Skew.NodeKind.BLOCK);
    return this.children[1];
  };

  Skew.Node.prototype.ifFalse = function() {
    assert(this.kind === Skew.NodeKind.IF);
    assert(this.children.length === 3);
    assert(this.children[2] === null || this.children[2].kind === Skew.NodeKind.BLOCK);
    return this.children[2];
  };

  Skew.Node.prototype.hookTest = function() {
    assert(this.kind === Skew.NodeKind.HOOK);
    assert(this.children.length === 3);
    assert(Skew.NodeKind.isExpression(this.children[0].kind));
    return this.children[0];
  };

  Skew.Node.prototype.hookTrue = function() {
    assert(this.kind === Skew.NodeKind.HOOK);
    assert(this.children.length === 3);
    assert(Skew.NodeKind.isExpression(this.children[1].kind));
    return this.children[1];
  };

  Skew.Node.prototype.hookFalse = function() {
    assert(this.kind === Skew.NodeKind.HOOK);
    assert(this.children.length === 3);
    assert(Skew.NodeKind.isExpression(this.children[2].kind));
    return this.children[2];
  };

  Skew.OperatorInfo = function(text, precedence, associativity, kind, count) {
    this.text = text;
    this.precedence = precedence;
    this.associativity = associativity;
    this.kind = kind;
    this.count = count;
  };

  Skew.ArgumentCount = {
    ONE: 0,
    ONE_OR_MORE: 1,
    ONE_OR_TWO: 2,
    TWO_OR_FEWER: 3,
    TWO_OR_MORE: 4,
    ZERO: 5,
    ZERO_OR_MORE: 6,
    ZERO_OR_ONE: 7
  };

  Skew.OperatorKind = {
    FIXED: 0,
    OVERRIDABLE: 1
  };

  Skew.UnionFind = function() {
    this.parents = [];
  };

  Skew.UnionFind.prototype.allocate1 = function() {
    var index = this.parents.length;
    this.parents.push(index);
    return index;
  };

  Skew.UnionFind.prototype.allocate2 = function(count) {
    for (var i = 0, count1 = count; i < count1; ++i) {
      this.parents.push(this.parents.length);
    }

    return this;
  };

  Skew.UnionFind.prototype.union = function(left, right) {
    this.parents[this.find(left)] = this.find(right);
  };

  Skew.UnionFind.prototype.find = function(index) {
    assert(index >= 0 && index < this.parents.length);
    var parent = this.parents[index];

    if (parent !== index) {
      parent = this.find(parent);
      this.parents[index] = parent;
    }

    return parent;
  };

  Skew.PrettyPrint = {};

  Skew.PrettyPrint.join = function(parts, trailing) {
    if (parts.length < 3) {
      return parts.join(" " + trailing + " ");
    }

    var text = "";

    for (var i = 0, count = parts.length; i < count; ++i) {
      if (i !== 0) {
        text += ", ";

        if ((i + 1 | 0) === parts.length) {
          text += trailing + " ";
        }
      }

      text += parts[i];
    }

    return text;
  };

  Skew.PrettyPrint.wrapWords = function(text, width) {
    // An invalid length means wrapping is disabled
    if (width < 1) {
      return [text];
    }

    var words = text.split(" ");
    var lines = [];
    var line = "";

    // Run the word wrapping algorithm
    var i = 0;

    while (i < words.length) {
      var word = words[i];
      var lineLength = line.length;
      var wordLength = word.length;
      var estimatedLength = (lineLength + 1 | 0) + wordLength | 0;
      ++i;

      // Collapse adjacent spaces
      if (word === "") {
        continue;
      }

      // Start the line
      if (line === "") {
        while (word.length > width) {
          lines.push(word.slice(0, width));
          word = word.slice(width, word.length);
        }

        line = word;
      }

      // Continue line
      else if (estimatedLength < width) {
        line += " " + word;
      }

      // Continue and wrap
      else if (estimatedLength === width) {
        lines.push(line + " " + word);
        line = "";
      }

      // Wrap and try again
      else {
        lines.push(line);
        line = "";
        --i;
      }
    }

    // Don't add an empty trailing line unless there are no other lines
    if (line !== "" || lines.length === 0) {
      lines.push(line);
    }

    return lines;
  };

  Skew.SymbolKind = {
    PARAMETER_FUNCTION: 0,
    PARAMETER_OBJECT: 1,
    OBJECT_CLASS: 2,
    OBJECT_ENUM: 3,
    OBJECT_GLOBAL: 4,
    OBJECT_INTERFACE: 5,
    OBJECT_NAMESPACE: 6,
    FUNCTION_ANNOTATION: 7,
    FUNCTION_CONSTRUCTOR: 8,
    FUNCTION_GLOBAL: 9,
    FUNCTION_INSTANCE: 10,
    FUNCTION_LOCAL: 11,
    OVERLOADED_ANNOTATION: 12,
    OVERLOADED_GLOBAL: 13,
    OVERLOADED_INSTANCE: 14,
    VARIABLE_ENUM: 15,
    VARIABLE_GLOBAL: 16,
    VARIABLE_INSTANCE: 17,
    VARIABLE_LOCAL: 18
  };

  Skew.SymbolKind.isType = function(self) {
    return self >= Skew.SymbolKind.PARAMETER_FUNCTION && self <= Skew.SymbolKind.OBJECT_NAMESPACE;
  };

  Skew.SymbolKind.isParameter = function(self) {
    return self >= Skew.SymbolKind.PARAMETER_FUNCTION && self <= Skew.SymbolKind.PARAMETER_OBJECT;
  };

  Skew.SymbolKind.isObject = function(self) {
    return self >= Skew.SymbolKind.OBJECT_CLASS && self <= Skew.SymbolKind.OBJECT_NAMESPACE;
  };

  Skew.SymbolKind.isFunction = function(self) {
    return self >= Skew.SymbolKind.FUNCTION_ANNOTATION && self <= Skew.SymbolKind.FUNCTION_LOCAL;
  };

  Skew.SymbolKind.isOverloadedFunction = function(self) {
    return self >= Skew.SymbolKind.OVERLOADED_ANNOTATION && self <= Skew.SymbolKind.OVERLOADED_INSTANCE;
  };

  Skew.SymbolKind.isFunctionOrOverloadedFunction = function(self) {
    return self >= Skew.SymbolKind.FUNCTION_ANNOTATION && self <= Skew.SymbolKind.OVERLOADED_INSTANCE;
  };

  Skew.SymbolKind.isVariable = function(self) {
    return self >= Skew.SymbolKind.VARIABLE_ENUM && self <= Skew.SymbolKind.VARIABLE_LOCAL;
  };

  Skew.SymbolKind.isGlobalReference = function(self) {
    return self === Skew.SymbolKind.VARIABLE_ENUM || self === Skew.SymbolKind.VARIABLE_GLOBAL || self === Skew.SymbolKind.FUNCTION_GLOBAL || self === Skew.SymbolKind.FUNCTION_CONSTRUCTOR || self === Skew.SymbolKind.OVERLOADED_GLOBAL || Skew.SymbolKind.isType(self);
  };

  Skew.SymbolKind.hasInstances = function(self) {
    return self === Skew.SymbolKind.OBJECT_CLASS || self === Skew.SymbolKind.OBJECT_ENUM || self === Skew.SymbolKind.OBJECT_INTERFACE;
  };

  Skew.SymbolKind.isOnInstances = function(self) {
    return self === Skew.SymbolKind.FUNCTION_INSTANCE || self === Skew.SymbolKind.VARIABLE_INSTANCE || self === Skew.SymbolKind.OVERLOADED_INSTANCE;
  };

  Skew.SymbolKind.isLocal = function(self) {
    return self === Skew.SymbolKind.FUNCTION_LOCAL || self === Skew.SymbolKind.VARIABLE_LOCAL;
  };

  Skew.SymbolState = {
    UNINITIALIZED: 0,
    INITIALIZING: 1,
    INITIALIZED: 2
  };

  Skew.Symbol = function(kind, name) {
    this.id = Skew.Symbol.createID();
    this.kind = kind;
    this.name = name;
    this.range = null;
    this.parent = null;
    this.resolvedType = null;
    this.scope = null;
    this.state = Skew.SymbolState.UNINITIALIZED;
    this.annotations = null;
    this.comments = null;
    this.flags = 0;
  };

  // Flags
  Skew.Symbol.prototype.isAutomaticallyGenerated = function() {
    return (this.flags & Skew.Symbol.IS_AUTOMATICALLY_GENERATED) !== 0;
  };

  Skew.Symbol.prototype.isConst = function() {
    return (this.flags & Skew.Symbol.IS_CONST) !== 0;
  };

  Skew.Symbol.prototype.isGetter = function() {
    return (this.flags & Skew.Symbol.IS_GETTER) !== 0;
  };

  Skew.Symbol.prototype.isLoopVariable = function() {
    return (this.flags & Skew.Symbol.IS_LOOP_VARIABLE) !== 0;
  };

  Skew.Symbol.prototype.isOver = function() {
    return (this.flags & Skew.Symbol.IS_OVER) !== 0;
  };

  Skew.Symbol.prototype.isSetter = function() {
    return (this.flags & Skew.Symbol.IS_SETTER) !== 0;
  };

  Skew.Symbol.prototype.isValueType = function() {
    return (this.flags & Skew.Symbol.IS_VALUE_TYPE) !== 0;
  };

  Skew.Symbol.prototype.shouldInferReturnType = function() {
    return (this.flags & Skew.Symbol.SHOULD_INFER_RETURN_TYPE) !== 0;
  };

  // Modifiers
  Skew.Symbol.prototype.isDeprecated = function() {
    return (this.flags & Skew.Symbol.IS_DEPRECATED) !== 0;
  };

  Skew.Symbol.prototype.isEntryPoint = function() {
    return (this.flags & Skew.Symbol.IS_ENTRY_POINT) !== 0;
  };

  Skew.Symbol.prototype.isExported = function() {
    return (this.flags & Skew.Symbol.IS_EXPORTED) !== 0;
  };

  Skew.Symbol.prototype.isImported = function() {
    return (this.flags & Skew.Symbol.IS_IMPORTED) !== 0;
  };

  Skew.Symbol.prototype.isPreferred = function() {
    return (this.flags & Skew.Symbol.IS_PREFERRED) !== 0;
  };

  Skew.Symbol.prototype.isPrivate = function() {
    return (this.flags & Skew.Symbol.IS_PRIVATE) !== 0;
  };

  Skew.Symbol.prototype.isProtected = function() {
    return (this.flags & Skew.Symbol.IS_PROTECTED) !== 0;
  };

  Skew.Symbol.prototype.isRenamed = function() {
    return (this.flags & Skew.Symbol.IS_RENAMED) !== 0;
  };

  Skew.Symbol.prototype.isSkipped = function() {
    return (this.flags & Skew.Symbol.IS_SKIPPED) !== 0;
  };

  // Pass-specific flags
  Skew.Symbol.prototype.isMerged = function() {
    return (this.flags & Skew.Symbol.IS_MERGED) !== 0;
  };

  Skew.Symbol.prototype.isObsolete = function() {
    return (this.flags & Skew.Symbol.IS_OBSOLETE) !== 0;
  };

  Skew.Symbol.prototype.isPrimaryConstructor = function() {
    return (this.flags & Skew.Symbol.IS_PRIMARY_CONSTRUCTOR) !== 0;
  };

  // Combinations
  Skew.Symbol.prototype.isPrivateOrProtected = function() {
    return (this.flags & (Skew.Symbol.IS_PRIVATE | Skew.Symbol.IS_PROTECTED)) !== 0;
  };

  Skew.Symbol.prototype.isImportedOrExported = function() {
    return (this.flags & (Skew.Symbol.IS_IMPORTED | Skew.Symbol.IS_EXPORTED)) !== 0;
  };

  Skew.Symbol.prototype.asParameterSymbol = function() {
    assert(Skew.SymbolKind.isParameter(this.kind));
    return this;
  };

  Skew.Symbol.prototype.asObjectSymbol = function() {
    assert(Skew.SymbolKind.isObject(this.kind));
    return this;
  };

  Skew.Symbol.prototype.asFunctionSymbol = function() {
    assert(Skew.SymbolKind.isFunction(this.kind));
    return this;
  };

  Skew.Symbol.prototype.asOverloadedFunctionSymbol = function() {
    assert(Skew.SymbolKind.isOverloadedFunction(this.kind));
    return this;
  };

  Skew.Symbol.prototype.asVariableSymbol = function() {
    assert(Skew.SymbolKind.isVariable(this.kind));
    return this;
  };

  Skew.Symbol.prototype.fullName = function() {
    if (this.parent !== null && this.parent.kind !== Skew.SymbolKind.OBJECT_GLOBAL && !Skew.SymbolKind.isParameter(this.kind)) {
      return this.parent.fullName() + "." + this.name;
    }

    return this.name;
  };

  Skew.Symbol.prototype.mergeAnnotationsAndCommentsFrom = function(symbol) {
    if (this.annotations === null) {
      this.annotations = symbol.annotations;
    }

    else if (symbol.annotations !== null) {
      in_List.append1(this.annotations, symbol.annotations);
    }

    if (this.comments === null) {
      this.comments = symbol.comments;
    }

    else if (symbol.comments !== null) {
      in_List.append1(this.comments, symbol.comments);
    }
  };

  Skew.Symbol.prototype.nameWithRenaming = function() {
    if (this.isRenamed()) {
      for (var i = 0, list = this.annotations, count = list.length; i < count; ++i) {
        var annotation = list[i];

        if (annotation.symbol !== null && annotation.symbol.fullName() === "rename") {
          var children = annotation.annotationValue().children;

          if (children.length === 2) {
            return in_List.last(children).content.asString();
          }
        }
      }
    }

    return this.name;
  };

  Skew.Symbol.createID = function() {
    ++Skew.Symbol.nextID;
    return Skew.Symbol.nextID;
  };

  Skew.ParameterSymbol = function(kind, name) {
    Skew.Symbol.call(this, kind, name);
  };

  __extends(Skew.ParameterSymbol, Skew.Symbol);

  Skew.Guard = function(parent, test, contents, elseGuard) {
    this.parent = parent;
    this.test = test;
    this.contents = contents;
    this.elseGuard = elseGuard;
  };

  Skew.ObjectSymbol = function(kind, name) {
    Skew.Symbol.call(this, kind, name);
    this.base = null;
    this.baseClass = null;
    this.members = Object.create(null);
    this.objects = [];
    this.functions = [];
    this.variables = [];
    this.parameters = null;
    this.guards = [];
  };

  __extends(Skew.ObjectSymbol, Skew.Symbol);

  Skew.ObjectSymbol.prototype.hasBaseClass = function(symbol) {
    return this.baseClass !== null && (this.baseClass === symbol || this.baseClass.hasBaseClass(symbol));
  };

  Skew.FunctionSymbol = function(kind, name) {
    Skew.Symbol.call(this, kind, name);
    this.overridden = null;
    this.overloaded = null;
    this.parameters = null;
    this.$arguments = [];
    this.self = null;
    this.argumentOnlyType = null;
    this.returnType = null;
    this.block = null;
  };

  __extends(Skew.FunctionSymbol, Skew.Symbol);

  Skew.VariableSymbol = function(kind, name) {
    Skew.Symbol.call(this, kind, name);
    this.type = null;
    this.value = null;
  };

  __extends(Skew.VariableSymbol, Skew.Symbol);

  Skew.OverloadedFunctionSymbol = function(kind, name, symbols) {
    Skew.Symbol.call(this, kind, name);
    this.overridden = null;
    this.symbols = symbols;
  };

  __extends(Skew.OverloadedFunctionSymbol, Skew.Symbol);

  Skew.TokenKind = {
    ANNOTATION: 0,
    ARROW: 1,
    AS: 2,
    ASSIGN: 3,
    ASSIGN_BITWISE_AND: 4,
    ASSIGN_BITWISE_OR: 5,
    ASSIGN_BITWISE_XOR: 6,
    ASSIGN_DIVIDE: 7,
    ASSIGN_INDEX: 8,
    ASSIGN_MINUS: 9,
    ASSIGN_MULTIPLY: 10,
    ASSIGN_PLUS: 11,
    ASSIGN_POWER: 12,
    ASSIGN_REMAINDER: 13,
    ASSIGN_SHIFT_LEFT: 14,
    ASSIGN_SHIFT_RIGHT: 15,
    BITWISE_AND: 16,
    BITWISE_OR: 17,
    BITWISE_XOR: 18,
    BREAK: 19,
    CASE: 20,
    CATCH: 21,
    CHARACTER: 22,
    CLASS: 23,
    COLON: 24,
    COMMA: 25,
    COMMENT: 26,
    COMPARE: 27,
    CONST: 28,
    CONTINUE: 29,
    DECREMENT: 30,
    DEF: 31,
    DEFAULT: 32,
    DIVIDE: 33,
    DOT: 34,
    DOT_DOT: 35,
    DOUBLE: 36,
    DYNAMIC: 37,
    ELSE: 38,
    END_OF_FILE: 39,
    ENUM: 40,
    EQUAL: 41,
    ERROR: 42,
    FALSE: 43,
    FINALLY: 44,
    FOR: 45,
    GREATER_THAN: 46,
    GREATER_THAN_OR_EQUAL: 47,
    IDENTIFIER: 48,
    IF: 49,
    IN: 50,
    INCREMENT: 51,
    INDEX: 52,
    INT: 53,
    INTERFACE: 54,
    INT_BINARY: 55,
    INT_HEX: 56,
    INT_OCTAL: 57,
    IS: 58,
    LEFT_BRACE: 59,
    LEFT_BRACKET: 60,
    LEFT_PARENTHESIS: 61,
    LESS_THAN: 62,
    LESS_THAN_OR_EQUAL: 63,
    LIST: 64,
    LIST_NEW: 65,
    LOGICAL_AND: 66,
    LOGICAL_OR: 67,
    MINUS: 68,
    MULTIPLY: 69,
    NAMESPACE: 70,
    NEWLINE: 71,
    NOT: 72,
    NOT_EQUAL: 73,
    NULL: 74,
    OVER: 75,
    PLUS: 76,
    POWER: 77,
    QUESTION_MARK: 78,
    REMAINDER: 79,
    RETURN: 80,
    RIGHT_BRACE: 81,
    RIGHT_BRACKET: 82,
    RIGHT_PARENTHESIS: 83,
    SET: 84,
    SET_NEW: 85,
    SHIFT_LEFT: 86,
    SHIFT_RIGHT: 87,
    STRING: 88,
    SUPER: 89,
    SWITCH: 90,
    THROW: 91,
    TILDE: 92,
    TRUE: 93,
    TRY: 94,
    VAR: 95,
    WHILE: 96,
    WHITESPACE: 97,
    YY_INVALID_ACTION: 98,

    // Token kinds not used by flex
    START_PARAMETER_LIST: 99,
    END_PARAMETER_LIST: 100
  };

  Skew.DiagnosticKind = {
    ERROR: 0,
    WARNING: 1
  };

  Skew.Diagnostic = function(kind, range, text) {
    this.kind = kind;
    this.range = range;
    this.text = text;
    this.noteRange = null;
    this.noteText = "";
  };

  Skew.Log = function() {
    this.diagnostics = [];
    this.warningCount = 0;
    this.errorCount = 0;
  };

  Skew.Log.prototype.hasErrors = function() {
    return this.errorCount !== 0;
  };

  Skew.Log.prototype.hasWarnings = function() {
    return this.warningCount !== 0;
  };

  Skew.Log.prototype.error = function(range, text) {
    this.diagnostics.push(new Skew.Diagnostic(Skew.DiagnosticKind.ERROR, range, text));
    ++this.errorCount;
  };

  Skew.Log.prototype.warning = function(range, text) {
    this.diagnostics.push(new Skew.Diagnostic(Skew.DiagnosticKind.WARNING, range, text));
    ++this.warningCount;
  };

  Skew.Log.prototype.note = function(range, text) {
    var last = in_List.last(this.diagnostics);
    last.noteRange = range;
    last.noteText = text;
  };

  Skew.Log.prototype.syntaxErrorInvalidEscapeSequence = function(range) {
    this.error(range, "Invalid escape sequence");
  };

  Skew.Log.prototype.syntaxErrorInvalidCharacter = function(range) {
    this.error(range, "Invalid character literal");
  };

  Skew.Log.prototype.syntaxErrorExtraData = function(range, text) {
    this.error(range, "Syntax error \"" + text + "\"");
  };

  Skew.Log.prototype.syntaxErrorUnexpectedToken = function(token) {
    this.error(token.range, "Unexpected " + Skew.TokenKind.strings[token.kind]);
  };

  Skew.Log.prototype.syntaxErrorExpectedToken = function(range, found, expected) {
    this.error(range, "Expected " + Skew.TokenKind.strings[expected] + " but found " + Skew.TokenKind.strings[found]);
  };

  Skew.Log.prototype.syntaxErrorEmptyFunctionParentheses = function(range) {
    this.error(range, "Functions without arguments do not use parentheses");
  };

  Skew.Log.prototype.semanticErrorComparisonOperatorNotNumeric = function(range) {
    this.error(range, "The comparison operator must have a numeric return type");
  };

  Skew.Log.prototype.syntaxErrorBadDeclarationInsideEnum = function(range) {
    this.error(range, "Cannot use this declaration inside an enum");
  };

  Skew.Log.expectedCountText = function(singular, expected, found) {
    return "Expected " + expected.toString() + " " + singular + (expected === 1 ? "" : "s") + " but found " + found.toString() + " " + singular + (found === 1 ? "" : "s");
  };

  Skew.Log.formatArgumentTypes = function(types) {
    if (types === null) {
      return "";
    }

    var names = [];

    for (var i = 0, list = types, count = list.length; i < count; ++i) {
      var type = list[i];
      names.push(type.toString());
    }

    return " of type" + (types.length === 1 ? "" : "s") + " " + Skew.PrettyPrint.join(names, "and");
  };

  Skew.Log.prototype.semanticWarningExtraParentheses = function(range) {
    this.warning(range, "Unnecessary parentheses");
  };

  Skew.Log.prototype.semanticWarningUnusedExpression = function(range) {
    this.warning(range, "Unused expression");
  };

  Skew.Log.prototype.semanticErrorDuplicateSymbol = function(range, name, previous) {
    this.error(range, "\"" + name + "\" is already declared");

    if (previous !== null) {
      this.note(previous, "The previous declaration is here");
    }
  };

  Skew.Log.prototype.semanticErrorShadowedSymbol = function(range, name, previous) {
    this.error(range, "\"" + name + "\" shadows a previous declaration");

    if (previous !== null) {
      this.note(previous, "The previous declaration is here");
    }
  };

  Skew.Log.prototype.semanticErrorDuplicateTypeParameters = function(range, name, previous) {
    this.error(range, "\"" + name + "\" already has type parameters");

    if (previous !== null) {
      this.note(previous, "Type parameters were previously declared here");
    }
  };

  Skew.Log.prototype.semanticErrorDuplicateBaseType = function(range, name, previous) {
    this.error(range, "\"" + name + "\" already has a base type");

    if (previous !== null) {
      this.note(previous, "The previous base type is here");
    }
  };

  Skew.Log.prototype.semanticErrorCyclicDeclaration = function(range, name) {
    this.error(range, "Cyclic declaration of \"" + name + "\"");
  };

  Skew.Log.prototype.semanticErrorUndeclaredSymbol = function(range, name) {
    this.error(range, "\"" + name + "\" is not declared");
  };

  Skew.Log.prototype.semanticErrorUnknownMemberSymbol = function(range, name, type) {
    this.error(range, "\"" + name + "\" is not declared on type \"" + type.toString() + "\"");
  };

  Skew.Log.prototype.semanticErrorVarMissingType = function(range, name) {
    this.error(range, "Unable to determine the type of \"" + name + "\"");
  };

  Skew.Log.prototype.semanticErrorVarMissingValue = function(range, name) {
    this.error(range, "The implicitly typed variable \"" + name + "\" must be initialized");
  };

  Skew.Log.prototype.semanticErrorConstMissingValue = function(range, name) {
    this.error(range, "The constant \"" + name + "\" must be initialized");
  };

  Skew.Log.prototype.semanticErrorInvalidCall = function(range, type) {
    this.error(range, "Cannot call value of type \"" + type.toString() + "\"");
  };

  Skew.Log.prototype.semanticErrorCannotParameterize = function(range, type) {
    this.error(range, "Cannot parameterize \"" + type.toString() + (type.isParameterized() ? "\" because it is already parameterized" : "\" because it has no type parameters"));
  };

  Skew.Log.prototype.semanticErrorParameterCount = function(range, expected, found) {
    this.error(range, Skew.Log.expectedCountText("type parameter", expected, found));
  };

  Skew.Log.prototype.semanticErrorArgumentCount = function(range, expected, found, name, $function) {
    this.error(range, Skew.Log.expectedCountText("argument", expected, found) + (name !== "" ? " when calling \"" + name + "\"" : ""));

    if ($function !== null) {
      this.note($function, "The function declaration is here");
    }
  };

  Skew.Log.prototype.semanticErrorGetterCalledTwice = function(range, name, $function) {
    this.error(range, "The function \"" + name + "\" takes no arguments and is already called implicitly");

    if ($function !== null) {
      this.note($function, "The function declaration is here");
    }
  };

  Skew.Log.prototype.semanticErrorUseOfVoidFunction = function(range, name, $function) {
    this.error(range, "The function \"" + name + "\" does not return a value");

    if ($function !== null) {
      this.note($function, "The function declaration is here");
    }
  };

  Skew.Log.prototype.semanticErrorUseOfVoidLambda = function(range) {
    this.error(range, "This call does not return a value");
  };

  Skew.Log.prototype.semanticErrorBadVariableType = function(range, type) {
    this.error(range, "Implicitly typed variables cannot be of type \"" + type.toString() + "\"");
  };

  Skew.Log.prototype.semanticErrorMemberUnexpectedGlobal = function(range, name) {
    this.error(range, "Cannot access global member \"" + name + "\" from an instance context");
  };

  Skew.Log.prototype.semanticErrorMemberUnexpectedInstance = function(range, name) {
    this.error(range, "Cannot access instance member \"" + name + "\" from a global context");
  };

  Skew.Log.prototype.semanticErrorMemberUnexpectedTypeParameter = function(range, name) {
    this.error(range, "Cannot access type parameter \"" + name + "\" here");
  };

  Skew.Log.prototype.semanticErrorConstructorReturnType = function(range) {
    this.error(range, "Constructors cannot have a return type");
  };

  Skew.Log.prototype.semanticErrorNoMatchingOverload = function(range, name, count, types) {
    this.error(range, "No overload of \"" + name + "\" was found that takes " + count.toString() + " argument" + (count === 1 ? "" : "s") + Skew.Log.formatArgumentTypes(types));
  };

  Skew.Log.prototype.semanticErrorAmbiguousOverload = function(range, name, count, types) {
    this.error(range, "Multiple matching overloads of \"" + name + "\" were found that can take " + count.toString() + " argument" + (count === 1 ? "" : "s") + Skew.Log.formatArgumentTypes(types));
  };

  Skew.Log.prototype.semanticErrorUnexpectedExpression = function(range, type) {
    this.error(range, "Unexpected expression of type \"" + type.toString() + "\"");
  };

  Skew.Log.prototype.semanticErrorUnexpectedType = function(range, type) {
    this.error(range, "Unexpected type \"" + type.toString() + "\"");
  };

  Skew.Log.prototype.semanticErrorIncompatibleTypes = function(range, from, to, isCastAllowed) {
    this.error(range, "Cannot convert from type \"" + from.toString() + "\" to type \"" + to.toString() + "\"" + (isCastAllowed ? " without a cast" : ""));
  };

  Skew.Log.prototype.semanticErrorInvalidDefine1 = function(range, value, type, name) {
    this.error(range, "Cannot convert \"" + value + "\" to type \"" + type.toString() + "\" for variable \"" + name + "\"");
  };

  Skew.Log.prototype.semanticWarningExtraCast = function(range, from, to) {
    this.warning(range, "Unnecessary cast from type \"" + from.toString() + "\" to type \"" + to.toString() + "\"");
  };

  Skew.Log.prototype.semanticErrorWrongArgumentCount = function(range, name, count) {
    this.error(range, "Expected \"" + name + "\" to take " + count.toString() + " argument" + (count === 1 ? "" : "s"));
  };

  Skew.Log.prototype.semanticErrorWrongArgumentCountRange = function(range, name, lower, upper) {
    if (lower === 0) {
      this.error(range, "Expected \"" + name + "\" to take at most " + upper.toString() + " argument" + (upper === 1 ? "" : "s"));
    }

    else if (upper === -1) {
      this.error(range, "Expected \"" + name + "\" to take at least " + lower.toString() + " argument" + (lower === 1 ? "" : "s"));
    }

    else {
      this.error(range, "Expected \"" + name + "\" to take between " + lower.toString() + " and " + upper.toString() + " arguments");
    }
  };

  Skew.Log.prototype.semanticErrorExpectedList = function(range, name, type) {
    this.error(range, "Expected argument \"" + name + "\" to be of type \"List<T>\" instead of type \"" + type.toString() + "\"");
  };

  Skew.Log.prototype.semanticErrorUnexpectedReturnValue = function(range) {
    this.error(range, "Cannot return a value inside a function without a return type");
  };

  Skew.Log.prototype.semanticErrorBadReturnType = function(range, type) {
    this.error(range, "Cannot create a function with a return type of \"" + type.toString() + "\"");
  };

  Skew.Log.prototype.semanticErrorExpectedReturnValue = function(range, type) {
    this.error(range, "Must return a value of type \"" + type.toString() + "\"");
  };

  Skew.Log.prototype.semanticErrorMissingReturn = function(range, name, type) {
    this.error(range, "All control paths for \"" + name + "\" must return a value of type \"" + type.toString() + "\"");
  };

  Skew.Log.prototype.semanticErrorBadStorage = function(range) {
    this.error(range, "Cannot store to this location");
  };

  Skew.Log.prototype.semanticErrorStorageToConstSymbol = function(range, name) {
    this.error(range, "Cannot store to constant symbol \"" + name + "\"");
  };

  Skew.Log.prototype.semanticErrorAccessViolation = function(range, level, name) {
    this.error(range, "Cannot access \"" + level + "\" symbol \"" + name + "\" here");
  };

  Skew.Log.prototype.semanticWarningDeprecatedUsage = function(range, name) {
    this.warning(range, "Use of deprecated symbol \"" + name + "\"");
  };

  Skew.Log.prototype.semanticErrorUnparameterizedType = function(range, type) {
    this.error(range, "Cannot use unparameterized type \"" + type.toString() + "\" here");
  };

  Skew.Log.prototype.semanticErrorParameterizedType = function(range, type) {
    this.error(range, "Cannot use parameterized type \"" + type.toString() + "\" here");
  };

  Skew.Log.prototype.semanticErrorNoCommonType = function(range, left, right) {
    this.error(range, "No common type for \"" + left.toString() + "\" and \"" + right.toString() + "\"");
  };

  Skew.Log.prototype.semanticErrorInvalidAnnotation = function(range, annotation, name) {
    this.error(range, "Cannot use the annotation \"" + annotation + "\" on \"" + name + "\"");
  };

  Skew.Log.prototype.semanticErrorDuplicateAnnotation = function(range, annotation, name) {
    this.error(range, "Duplicate annotation \"" + annotation + "\" on \"" + name + "\"");
  };

  Skew.Log.prototype.semanticErrorBadForValue = function(range, type) {
    this.error(range, "Cannot iterate over type \"" + type.toString() + "\"");
  };

  Skew.Log.prototype.semanticWarningEmptyRange = function(range) {
    this.warning(range, "This range is empty");
  };

  Skew.Log.prototype.semanticErrorMissingDotContext = function(range, name) {
    this.error(range, "Cannot access \"" + name + "\" without type context");
  };

  Skew.Log.prototype.semanticErrorInitializerTypeInferenceFailed = function(range) {
    this.error(range, "Cannot infer a type for this literal");
  };

  Skew.Log.prototype.semanticErrorDuplicateOverload = function(range, name, previous) {
    this.error(range, "Duplicate overloaded function \"" + name + "\"");

    if (previous !== null) {
      this.note(previous, "The previous declaration is here");
    }
  };

  Skew.Log.prototype.semanticErrorInvalidBaseType = function(range, type) {
    this.error(range, "Cannot derive from type \"" + type.toString() + "\"");
  };

  Skew.Log.prototype.semanticErrorBadOverride = function(range, name, base, overridden) {
    this.error(range, "\"" + name + "\" overrides another declaration with the same name in base type \"" + base.toString() + "\"");

    if (overridden !== null) {
      this.note(overridden, "The overridden declaration is here");
    }
  };

  Skew.Log.prototype.semanticErrorBadOverrideReturnType = function(range, name, base, overridden) {
    this.error(range, "\"" + name + "\" overrides another function with the same name and argument types but a different return type in base type \"" + base.toString() + "\"");

    if (overridden !== null) {
      this.note(overridden, "The overridden function is here");
    }
  };

  Skew.Log.prototype.semanticErrorModifierMissingOverride = function(range, name, overridden) {
    this.error(range, "\"" + name + "\" overrides another symbol with the same name but is declared using \"def\" instead of \"over\"");

    if (overridden !== null) {
      this.note(overridden, "The overridden declaration is here");
    }
  };

  Skew.Log.prototype.semanticErrorModifierUnusedOverride = function(range, name) {
    this.error(range, "\"" + name + "\" is declared using \"over\" instead of \"def\" but does not override anything");
  };

  Skew.Log.prototype.semanticErrorBadSuper = function(range) {
    this.error(range, "Cannot use \"super\" here");
  };

  Skew.Log.prototype.semanticErrorBadJump = function(range, name) {
    this.error(range, "Cannot use \"" + name + "\" outside a loop");
  };

  Skew.Log.prototype.semanticErrorMustCallFunction = function(range, name) {
    this.error(range, "The function \"" + name + "\" must be called");
  };

  Skew.Log.prototype.semanticErrorDuplicateEntryPoint = function(range, previous) {
    this.error(range, "Multiple entry points are declared");
    this.note(previous, "The first entry point is here");
  };

  Skew.Log.prototype.semanticErrorInvalidEntryPointArguments = function(range, name) {
    this.error(range, "Entry point \"" + name + "\" must take either no arguments or one argument of type \"List<string>\"");
  };

  Skew.Log.prototype.semanticErrorInvalidEntryPointReturnType = function(range, name) {
    this.error(range, "Entry point \"" + name + "\" must return either nothing or a value of type \"int\"");
  };

  Skew.Log.prototype.semanticErrorInvalidDefine2 = function(range, name) {
    this.error(range, "Could not find a variable named \"" + name + "\" to override");
  };

  Skew.Log.prototype.semanticErrorExpectedConstant = function(range) {
    this.error(range, "This value must be a compile-time constant");
  };

  Skew.Log.prototype.semanticWarningUnreadLocalVariable = function(range, name) {
    this.warning(range, "Local variable \"" + name + "\" is never read");
  };

  Skew.Log.prototype.commandLineErrorExpectedDefineValue = function(range, name) {
    this.error(range, "Use \"--define:" + name + "=___\" to provide a value");
  };

  Skew.Log.prototype.commandLineErrorMissingOutput = function(range, first, second) {
    this.error(range, "Specify the output location using either \"" + first + "\" or \"" + second + "\"");
  };

  Skew.Log.prototype.commandLineErrorDuplicateOutput = function(range, first, second) {
    this.error(range, "Cannot specify both \"" + first + "\" and \"" + second + "\"");
  };

  Skew.Log.prototype.commandLineErrorUnreadableFile = function(range, name) {
    this.error(range, "Could not read from \"" + name + "\"");
  };

  Skew.Log.prototype.commandLineErrorUnwritableFile = function(range, name) {
    this.error(range, "Could not write to \"" + name + "\"");
  };

  Skew.Log.prototype.commandLineErrorNoInputFiles = function(range) {
    this.error(range, "Missing input files");
  };

  Skew.Log.prototype.commandLineWarningDuplicateFlagValue = function(range, name, previous) {
    this.warning(range, "Multiple values are specified for \"" + name + "\", using the later value");

    if (previous !== null) {
      this.note(previous, "Ignoring the previous value");
    }
  };

  Skew.Log.prototype.commandLineErrorBadFlag = function(range, name) {
    this.error(range, "Unknown command line flag \"" + name + "\"");
  };

  Skew.Log.prototype.commandLineErrorMissingValue = function(range, text) {
    this.error(range, "Use \"" + text + "\" to provide a value");
  };

  Skew.Log.prototype.commandLineErrorExpectedToken = function(range, expected, found, text) {
    this.error(range, "Expected \"" + expected + "\" but found \"" + found + "\" in \"" + text + "\"");
  };

  Skew.Log.prototype.commandLineErrorNonBooleanValue = function(range, value, text) {
    this.error(range, "Expected \"true\" or \"false\" but found \"" + value + "\" in \"" + text + "\"");
  };

  Skew.Log.prototype.commandLineErrorNonIntegerValue = function(range, value, text) {
    this.error(range, "Expected integer constant but found \"" + value + "\" in \"" + text + "\"");
  };

  Skew.Parsing = {};

  Skew.Parsing.parseIntLiteral = function(text) {
    // Parse negative signs for use with the "--define" flag
    var isNegative = in_string.startsWith(text, "-");
    var start = isNegative | 0;
    var count = text.length;
    var value = 0;
    var base = 10;

    // Parse the base
    if ((start + 2 | 0) < count && text.charCodeAt(start) === 48) {
      var c = text.charCodeAt(start + 1 | 0);

      if (c === 98) {
        base = 2;
        start += 2;
      }

      else if (c === 111) {
        base = 8;
        start += 2;
      }

      else if (c === 120) {
        base = 16;
        start += 2;
      }
    }

    // There must be numbers after the base
    if (start === count) {
      return null;
    }

    // Special-case hexadecimal since it's more complex
    if (base === 16) {
      for (var i = start, count1 = text.length; i < count1; ++i) {
        var c1 = text.charCodeAt(i);

        if ((c1 < 48 || c1 > 57) && (c1 < 65 || c1 > 70) && (c1 < 97 || c1 > 102)) {
          return null;
        }

        value = (__imul(value, 16) + c1 | 0) - (c1 <= 57 ? 48 : c1 <= 70 ? 65 - 10 | 0 : 97 - 10 | 0) | 0;
      }
    }

    // All other bases are zero-relative
    else {
      for (var i1 = start, count2 = text.length; i1 < count2; ++i1) {
        var c2 = text.charCodeAt(i1);

        if (c2 < 48 || c2 >= (48 + base | 0)) {
          return null;
        }

        value = (__imul(value, base) + c2 | 0) - 48 | 0;
      }
    }

    return new Box(isNegative ? -value : value);
  };

  Skew.Parsing.checkExtraParentheses = function(context, node) {
    if (node.isInsideParentheses()) {
      context.log.semanticWarningExtraParentheses(node.range);
    }
  };

  Skew.Parsing.parseLeadingComments = function(context) {
    var comments = null;

    while (context.peek(Skew.TokenKind.COMMENT)) {
      var range = context.next().range;

      if (comments === null) {
        comments = [];
      }

      comments.push(range.source.contents.slice(range.start + 1 | 0, range.end));

      // Ignore blocks of comments with extra lines afterward
      if (context.eat(Skew.TokenKind.NEWLINE)) {
        comments = null;
      }
    }

    return comments;
  };

  Skew.Parsing.parseTrailingComment = function(context, comments) {
    if (context.peek(Skew.TokenKind.COMMENT)) {
      var range = context.next().range;

      if (comments === null) {
        comments = [];
      }

      var text = range.source.contents.slice(range.start + 1 | 0, range.end);

      if (text.charCodeAt(text.length - 1 | 0) !== 10) {
        text += "\n";
      }

      comments.push(text);
      return comments;
    }

    return null;
  };

  Skew.Parsing.parseAnnotations = function(context, annotations) {
    annotations = annotations !== null ? annotations.slice() : [];

    while (context.peek(Skew.TokenKind.ANNOTATION)) {
      var range = context.next().range;
      var value = new Skew.Node(Skew.NodeKind.NAME).withContent(new Skew.StringContent(range.toString())).withRange(range);

      // Change "@foo.bar.baz" into "foo.bar.@baz"
      if (context.peek(Skew.TokenKind.DOT)) {
        var root = value.asString();
        value.content = new Skew.StringContent(root.slice(1));

        while (context.eat(Skew.TokenKind.DOT)) {
          var name = context.current().range;

          if (!context.expect(Skew.TokenKind.IDENTIFIER)) {
            return null;
          }

          value = new Skew.Node(Skew.NodeKind.DOT).withContent(new Skew.StringContent(name.toString())).withChildren([value]).withRange(context.spanSince(range)).withInternalRange(name);
        }

        value.content = new Skew.StringContent("@" + value.asString());
      }

      // Parse parentheses if present
      var token = context.current();

      if (context.eat(Skew.TokenKind.LEFT_PARENTHESIS)) {
        var $arguments = Skew.Parsing.parseCommaSeparatedList(context, Skew.TokenKind.RIGHT_PARENTHESIS);

        if ($arguments === null) {
          return null;
        }

        value = Skew.Node.createCall(value, $arguments).withRange(context.spanSince(range)).withInternalRange(context.spanSince(token.range));
      }

      // Parse a trailing if condition
      var test = null;

      if (context.eat(Skew.TokenKind.IF)) {
        test = Skew.Parsing.pratt.parse(context, Skew.Precedence.LOWEST);

        if (test === null) {
          return null;
        }
      }

      // All annotations must end in a newline to avoid confusion with the trailing if
      if (!context.peek(Skew.TokenKind.LEFT_BRACE) && !context.expect(Skew.TokenKind.NEWLINE)) {
        return null;
      }

      annotations.push(Skew.Node.createAnnotation(value, test).withRange(context.spanSince(range)));
    }

    return annotations;
  };

  Skew.Parsing.parseVarOrConst = function(context) {
    var token = context.next();
    var range = context.current().range;

    if (!context.expect(Skew.TokenKind.IDENTIFIER)) {
      return null;
    }

    var symbol = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_LOCAL, range.toString());
    symbol.range = range;

    if (token.kind === Skew.TokenKind.CONST) {
      symbol.flags |= Skew.Symbol.IS_CONST;
    }

    if (Skew.Parsing.peekType(context)) {
      symbol.type = Skew.Parsing.typePratt.parse(context, Skew.Precedence.LOWEST);

      if (symbol.type === null) {
        return null;
      }
    }

    if (context.eat(Skew.TokenKind.ASSIGN)) {
      symbol.value = Skew.Parsing.pratt.parse(context, Skew.Precedence.LOWEST);

      if (symbol.value === null) {
        return null;
      }
    }

    return Skew.Node.createVar(symbol).withRange(context.spanSince(token.range));
  };

  Skew.Parsing.parseJump = function(context) {
    var token = context.next();
    return (token.kind === Skew.TokenKind.BREAK ? new Skew.Node(Skew.NodeKind.BREAK) : new Skew.Node(Skew.NodeKind.CONTINUE)).withRange(token.range);
  };

  Skew.Parsing.parseReturn = function(context) {
    var token = context.next();
    var value = null;

    if (!context.peek(Skew.TokenKind.NEWLINE) && !context.peek(Skew.TokenKind.COMMENT) && !context.peek(Skew.TokenKind.RIGHT_BRACE)) {
      value = Skew.Parsing.pratt.parse(context, Skew.Precedence.LOWEST);

      if (value === null) {
        return null;
      }

      Skew.Parsing.checkExtraParentheses(context, value);
    }

    return Skew.Node.createReturn(value).withRange(context.spanSince(token.range));
  };

  Skew.Parsing.parseSwitch = function(context) {
    var token = context.next();
    var value = Skew.Parsing.pratt.parse(context, Skew.Precedence.LOWEST);

    if (value === null) {
      return null;
    }

    Skew.Parsing.checkExtraParentheses(context, value);

    if (!context.expect(Skew.TokenKind.LEFT_BRACE)) {
      return null;
    }

    var cases = [];
    context.eat(Skew.TokenKind.NEWLINE);

    while (!context.peek(Skew.TokenKind.RIGHT_BRACE)) {
      var comments = Skew.Parsing.parseLeadingComments(context);

      // Ignore trailing comments
      if (context.peek(Skew.TokenKind.RIGHT_BRACE) || context.peek(Skew.TokenKind.END_OF_FILE)) {
        break;
      }

      // Parse a new case
      var values = [];
      var start = context.current();

      if (context.eat(Skew.TokenKind.CASE)) {
        context.eat(Skew.TokenKind.NEWLINE);

        while (true) {
          var constant = Skew.Parsing.pratt.parse(context, Skew.Precedence.LOWEST);

          if (constant === null) {
            return null;
          }

          Skew.Parsing.checkExtraParentheses(context, constant);
          values.push(constant);

          if (!context.eat(Skew.TokenKind.COMMA)) {
            break;
          }
        }
      }

      // Default cases have no values
      else if (!context.eat(Skew.TokenKind.DEFAULT)) {
        context.expect(Skew.TokenKind.CASE);
        return null;
      }

      // Use a block instead of requiring "break" at the end
      var block = Skew.Parsing.parseBlock(context);

      if (block === null) {
        return null;
      }

      // Create the case
      var node = Skew.Node.createCase(values, block).withRange(context.spanSince(start.range));
      node.comments = comments;
      cases.push(node);

      // Parse trailing comments and/or newline
      comments = Skew.Parsing.parseTrailingComment(context, comments);

      if (comments !== null) {
        node.comments = comments;
        context.eat(Skew.TokenKind.NEWLINE);
      }

      else if (context.peek(Skew.TokenKind.RIGHT_BRACE) || !context.peek(Skew.TokenKind.ELSE) && !context.expect(Skew.TokenKind.NEWLINE)) {
        break;
      }
    }

    if (!context.expect(Skew.TokenKind.RIGHT_BRACE)) {
      return null;
    }

    return Skew.Node.createSwitch(value, cases).withRange(context.spanSince(token.range));
  };

  Skew.Parsing.parseFor = function(context) {
    var token = context.next();
    var range = context.current().range;

    if (!context.expect(Skew.TokenKind.IDENTIFIER) || !context.expect(Skew.TokenKind.IN)) {
      return null;
    }

    var symbol = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_LOCAL, range.toString());
    symbol.range = range;
    var value = Skew.Parsing.pratt.parse(context, Skew.Precedence.LOWEST);

    if (value === null) {
      return null;
    }

    if (context.eat(Skew.TokenKind.DOT_DOT)) {
      var second = Skew.Parsing.pratt.parse(context, Skew.Precedence.LOWEST);

      if (second === null) {
        return null;
      }

      value = Skew.Node.createPair(value, second).withRange(Skew.Range.span(value.range, second.range));
    }

    Skew.Parsing.checkExtraParentheses(context, value);
    var block = Skew.Parsing.parseBlock(context);

    if (block === null) {
      return null;
    }

    return Skew.Node.createForeach(symbol, value, block).withRange(context.spanSince(token.range));
  };

  Skew.Parsing.parseIf = function(context) {
    var token = context.next();
    var test = Skew.Parsing.pratt.parse(context, Skew.Precedence.LOWEST);

    if (test === null) {
      return null;
    }

    Skew.Parsing.checkExtraParentheses(context, test);
    var trueBlock = Skew.Parsing.parseBlock(context);

    if (trueBlock === null) {
      return null;
    }

    return Skew.Node.createIf(test, trueBlock, null).withRange(context.spanSince(token.range));
  };

  Skew.Parsing.parseThrow = function(context) {
    var token = context.next();
    var value = Skew.Parsing.pratt.parse(context, Skew.Precedence.LOWEST);

    if (value === null) {
      return null;
    }

    Skew.Parsing.checkExtraParentheses(context, value);
    return Skew.Node.createThrow(value).withRange(context.spanSince(token.range));
  };

  Skew.Parsing.parseTry = function(context) {
    var token = context.next();
    var tryBlock = Skew.Parsing.parseBlock(context);

    if (tryBlock === null) {
      return null;
    }

    return Skew.Node.createTry(tryBlock, [], null).withRange(context.spanSince(token.range));
  };

  Skew.Parsing.parseWhile = function(context) {
    var token = context.next();
    var test = Skew.Parsing.pratt.parse(context, Skew.Precedence.LOWEST);

    if (test === null) {
      return null;
    }

    Skew.Parsing.checkExtraParentheses(context, test);
    var block = Skew.Parsing.parseBlock(context);

    if (block === null) {
      return null;
    }

    return new Skew.Node(Skew.NodeKind.WHILE).withChildren([test, block]).withRange(context.spanSince(token.range));
  };

  Skew.Parsing.parseStatement = function(context) {
    var token = context.current();

    switch (token.kind) {
      case Skew.TokenKind.BREAK:
      case Skew.TokenKind.CONTINUE: {
        return Skew.Parsing.parseJump(context);
      }

      case Skew.TokenKind.CONST:
      case Skew.TokenKind.VAR: {
        return Skew.Parsing.parseVarOrConst(context);
      }

      case Skew.TokenKind.FOR: {
        return Skew.Parsing.parseFor(context);
      }

      case Skew.TokenKind.IF: {
        return Skew.Parsing.parseIf(context);
      }

      case Skew.TokenKind.RETURN: {
        return Skew.Parsing.parseReturn(context);
      }

      case Skew.TokenKind.SWITCH: {
        return Skew.Parsing.parseSwitch(context);
      }

      case Skew.TokenKind.THROW: {
        return Skew.Parsing.parseThrow(context);
      }

      case Skew.TokenKind.TRY: {
        return Skew.Parsing.parseTry(context);
      }

      case Skew.TokenKind.WHILE: {
        return Skew.Parsing.parseWhile(context);
      }
    }

    var value = Skew.Parsing.pratt.parse(context, Skew.Precedence.LOWEST);

    if (value === null) {
      return null;
    }

    Skew.Parsing.checkExtraParentheses(context, value);
    return Skew.Node.createExpression(value).withRange(value.range);
  };

  Skew.Parsing.parseStatements = function(context) {
    var statements = [];
    var previous = null;
    context.eat(Skew.TokenKind.NEWLINE);

    while (!context.peek(Skew.TokenKind.RIGHT_BRACE)) {
      var comments = Skew.Parsing.parseLeadingComments(context);

      // Ignore trailing comments
      if (context.peek(Skew.TokenKind.RIGHT_BRACE) || context.peek(Skew.TokenKind.END_OF_FILE)) {
        break;
      }

      // Merge "else" statements with the previous "if"
      if (context.peek(Skew.TokenKind.ELSE) && previous !== null && previous.kind === Skew.NodeKind.IF && previous.ifFalse() === null) {
        context.next();

        // Match "else if"
        if (context.peek(Skew.TokenKind.IF)) {
          var statement = Skew.Parsing.parseIf(context);

          if (statement === null) {
            return null;
          }

          var falseBlock = new Skew.Node(Skew.NodeKind.BLOCK).withChildren([statement]).withRange(statement.range);
          falseBlock.comments = comments;
          previous.replaceChild(2, falseBlock);
          previous = statement;
        }

        // Match "else"
        else {
          var falseBlock1 = Skew.Parsing.parseBlock(context);

          if (falseBlock1 === null) {
            return null;
          }

          falseBlock1.comments = comments;
          previous.replaceChild(2, falseBlock1);
          previous = falseBlock1;
        }
      }

      // Merge "catch" statements with the previous "try"
      else if (context.peek(Skew.TokenKind.CATCH) && previous !== null && previous.kind === Skew.NodeKind.TRY && previous.finallyBlock() === null) {
        var catchToken = context.next();
        var symbol = null;
        var nameRange = context.current().range;

        // Optional typed variable
        if (context.eat(Skew.TokenKind.IDENTIFIER)) {
          symbol = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_LOCAL, nameRange.toString());
          symbol.range = nameRange;
          symbol.type = Skew.Parsing.typePratt.parse(context, Skew.Precedence.LOWEST);

          if (symbol.type === null) {
            return null;
          }
        }

        // Manditory catch block
        var catchBlock = Skew.Parsing.parseBlock(context);

        if (catchBlock === null) {
          return null;
        }

        var child = Skew.Node.createCatch(symbol, catchBlock).withRange(context.spanSince(catchToken.range));
        child.comments = comments;
        previous.insertChild(previous.children.length - 1 | 0, child);
      }

      // Merge "finally" statements with the previous "try"
      else if (context.peek(Skew.TokenKind.FINALLY) && previous !== null && previous.kind === Skew.NodeKind.TRY && previous.finallyBlock() === null) {
        context.next();
        var finallyBlock = Skew.Parsing.parseBlock(context);

        if (finallyBlock === null) {
          return null;
        }

        finallyBlock.comments = comments;
        previous.replaceChild(previous.children.length - 1 | 0, finallyBlock);
      }

      // Parse a new statement
      else {
        var statement1 = Skew.Parsing.parseStatement(context);

        if (statement1 === null) {
          break;
        }

        previous = statement1;
        statement1.comments = comments;
        statements.push(statement1);
      }

      // Parse trailing comments and/or newline
      comments = Skew.Parsing.parseTrailingComment(context, comments);

      if (comments !== null) {
        if (previous !== null) {
          previous.comments = comments;
        }

        context.eat(Skew.TokenKind.NEWLINE);
      }

      else if (context.peek(Skew.TokenKind.RIGHT_BRACE) || !context.peek(Skew.TokenKind.ELSE) && !context.peek(Skew.TokenKind.CATCH) && !context.peek(Skew.TokenKind.FINALLY) && !context.expect(Skew.TokenKind.NEWLINE)) {
        break;
      }
    }

    return statements;
  };

  Skew.Parsing.parseBlock = function(context) {
    var token = context.current();

    if (!context.expect(Skew.TokenKind.LEFT_BRACE)) {
      return null;
    }

    var statements = Skew.Parsing.parseStatements(context);

    if (!context.expect(Skew.TokenKind.RIGHT_BRACE)) {
      return null;
    }

    return new Skew.Node(Skew.NodeKind.BLOCK).withChildren(statements).withRange(context.spanSince(token.range));
  };

  Skew.Parsing.peekType = function(context) {
    return context.peek(Skew.TokenKind.IDENTIFIER) || context.peek(Skew.TokenKind.DYNAMIC);
  };

  Skew.Parsing.parseFunctionBlock = function(context, symbol) {
    // "=> x" is the same as "{ return x }"
    if (symbol.kind === Skew.SymbolKind.FUNCTION_LOCAL) {
      if (!context.expect(Skew.TokenKind.ARROW)) {
        return false;
      }

      if (context.peek(Skew.TokenKind.LEFT_BRACE)) {
        symbol.block = Skew.Parsing.parseBlock(context);

        if (symbol.block === null) {
          return false;
        }
      }

      else {
        var value = Skew.Parsing.pratt.parse(context, Skew.Precedence.LOWEST);

        if (value === null) {
          return false;
        }

        symbol.block = new Skew.Node(Skew.NodeKind.BLOCK).withChildren([Skew.Node.createReturn(value).withRange(value.range).withFlags(Skew.Node.IS_IMPLICIT_RETURN)]).withRange(value.range);
      }
    }

    // Parse function body if present
    else if (context.peek(Skew.TokenKind.LEFT_BRACE)) {
      symbol.block = Skew.Parsing.parseBlock(context);

      if (symbol.block === null) {
        return false;
      }
    }

    return true;
  };

  Skew.Parsing.parseFunctionArguments = function(context, symbol) {
    var usingTypes = false;

    while (!context.eat(Skew.TokenKind.RIGHT_PARENTHESIS)) {
      if (!(symbol.$arguments.length === 0) && !context.expect(Skew.TokenKind.COMMA)) {
        return false;
      }

      var range = context.current().range;

      if (!context.expect(Skew.TokenKind.IDENTIFIER)) {
        return false;
      }

      var arg = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_LOCAL, range.toString());
      arg.range = range;

      // Parse argument type
      if (symbol.kind !== Skew.SymbolKind.FUNCTION_LOCAL || (symbol.$arguments.length === 0 ? Skew.Parsing.peekType(context) : usingTypes)) {
        arg.type = Skew.Parsing.typePratt.parse(context, Skew.Precedence.LOWEST);

        if (arg.type === null) {
          return false;
        }

        usingTypes = true;
      }

      // Parse default value
      if (context.eat(Skew.TokenKind.ASSIGN)) {
        arg.value = Skew.Parsing.pratt.parse(context, Skew.Precedence.LOWEST);

        if (arg.value === null) {
          return false;
        }
      }

      symbol.$arguments.push(arg);
    }

    return true;
  };

  Skew.Parsing.parseFunctionReturnTypeAndBlock = function(context, symbol) {
    if (Skew.Parsing.peekType(context)) {
      symbol.returnType = Skew.Parsing.typePratt.parse(context, Skew.Precedence.LOWEST);
    }

    return Skew.Parsing.parseFunctionBlock(context, symbol);
  };

  Skew.Parsing.parseTypeParameters = function(context, kind) {
    var parameters = [];

    while (true) {
      var range = context.current().range;
      var name = range.toString();

      if (!context.expect(Skew.TokenKind.IDENTIFIER)) {
        return null;
      }

      var symbol = new Skew.ParameterSymbol(kind, name);
      symbol.range = range;
      parameters.push(symbol);

      if (!context.eat(Skew.TokenKind.COMMA)) {
        break;
      }
    }

    if (!context.expect(Skew.TokenKind.END_PARAMETER_LIST)) {
      return null;
    }

    return parameters;
  };

  Skew.Parsing.parseAfterBlock = function(context) {
    return context.peek(Skew.TokenKind.END_OF_FILE) || context.peek(Skew.TokenKind.RIGHT_BRACE) || context.expect(Skew.TokenKind.NEWLINE);
  };

  Skew.Parsing.recursiveParseGuard = function(context, parent, annotations) {
    var test = null;

    if (context.eat(Skew.TokenKind.IF)) {
      test = Skew.Parsing.pratt.parse(context, Skew.Precedence.LOWEST);

      if (test === null) {
        return null;
      }
    }

    if (!context.expect(Skew.TokenKind.LEFT_BRACE)) {
      return null;
    }

    var contents = new Skew.ObjectSymbol(parent.kind, "<conditional>");
    Skew.Parsing.parseSymbols(context, contents, annotations);

    if (!context.expect(Skew.TokenKind.RIGHT_BRACE) || !context.peek(Skew.TokenKind.ELSE) && !Skew.Parsing.parseAfterBlock(context)) {
      return null;
    }

    var elseGuard = null;

    if (context.eat(Skew.TokenKind.ELSE)) {
      elseGuard = Skew.Parsing.recursiveParseGuard(context, parent, annotations);

      if (elseGuard === null) {
        return null;
      }
    }

    return new Skew.Guard(parent, test, contents, elseGuard);
  };

  Skew.Parsing.parseSymbol = function(context, parent, annotations) {
    // Parse comments before the symbol declaration
    var comments = Skew.Parsing.parseLeadingComments(context);

    // Ignore trailing comments
    if (context.peek(Skew.TokenKind.RIGHT_BRACE) || context.peek(Skew.TokenKind.END_OF_FILE)) {
      return false;
    }

    // Parse a compile-time if statement
    if (context.peek(Skew.TokenKind.IF)) {
      var guard = Skew.Parsing.recursiveParseGuard(context, parent, annotations);

      if (guard === null) {
        return false;
      }

      parent.guards.push(guard);
      return true;
    }

    // Parse annotations before the symbol declaration
    if (context.peek(Skew.TokenKind.ANNOTATION)) {
      annotations = Skew.Parsing.parseAnnotations(context, annotations);

      if (annotations === null) {
        return false;
      }

      // Parse an annotation block
      if (context.eat(Skew.TokenKind.LEFT_BRACE)) {
        Skew.Parsing.parseSymbols(context, parent, annotations);
        return context.expect(Skew.TokenKind.RIGHT_BRACE) && Skew.Parsing.parseAfterBlock(context);
      }
    }

    var token = context.current();
    var symbol;

    // Special-case enum symbols
    if (parent.kind === Skew.SymbolKind.OBJECT_ENUM && token.kind === Skew.TokenKind.IDENTIFIER) {
      var variable = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_ENUM, token.range.toString());
      variable.range = token.range;
      variable.flags |= Skew.Symbol.IS_CONST;
      parent.variables.push(variable);
      symbol = variable;
      context.next();
    }

    else {
      // Parse the symbol kind
      var kind;

      switch (token.kind) {
        case Skew.TokenKind.CLASS: {
          kind = Skew.SymbolKind.OBJECT_CLASS;
          break;
        }

        case Skew.TokenKind.CONST:
        case Skew.TokenKind.VAR: {
          kind = Skew.SymbolKind.hasInstances(parent.kind) ? Skew.SymbolKind.VARIABLE_INSTANCE : Skew.SymbolKind.VARIABLE_GLOBAL;
          break;
        }

        case Skew.TokenKind.DEF:
        case Skew.TokenKind.OVER: {
          kind = Skew.SymbolKind.hasInstances(parent.kind) ? Skew.SymbolKind.FUNCTION_INSTANCE : Skew.SymbolKind.FUNCTION_GLOBAL;
          break;
        }

        case Skew.TokenKind.ENUM: {
          kind = Skew.SymbolKind.OBJECT_ENUM;
          break;
        }

        case Skew.TokenKind.INTERFACE: {
          kind = Skew.SymbolKind.OBJECT_INTERFACE;
          break;
        }

        case Skew.TokenKind.NAMESPACE: {
          kind = Skew.SymbolKind.OBJECT_NAMESPACE;
          break;
        }

        default: {
          context.unexpectedToken();
          return false;
        }
      }

      context.next();

      // Parse the symbol name
      var nameToken = context.current();
      var range = nameToken.range;
      var name = range.toString();
      var isOperator = kind === Skew.SymbolKind.FUNCTION_INSTANCE && nameToken.kind in Skew.Parsing.operatorOverloadTokenKinds;

      if (isOperator) {
        context.next();
      }

      else if (kind === Skew.SymbolKind.FUNCTION_GLOBAL && context.eat(Skew.TokenKind.ANNOTATION)) {
        kind = Skew.SymbolKind.FUNCTION_ANNOTATION;
      }

      else if (context.eat(Skew.TokenKind.LIST_NEW) || context.eat(Skew.TokenKind.SET_NEW)) {
        if (kind === Skew.SymbolKind.FUNCTION_INSTANCE) {
          kind = Skew.SymbolKind.FUNCTION_CONSTRUCTOR;
        }
      }

      else {
        if (!context.expect(Skew.TokenKind.IDENTIFIER)) {
          return false;
        }

        if (kind === Skew.SymbolKind.FUNCTION_INSTANCE && name === "new") {
          kind = Skew.SymbolKind.FUNCTION_CONSTRUCTOR;
        }
      }

      // Parse shorthand nested namespace declarations
      if (Skew.SymbolKind.isObject(kind)) {
        while (context.eat(Skew.TokenKind.DOT)) {
          var nextToken = context.current();

          if (!context.expect(Skew.TokenKind.IDENTIFIER)) {
            return false;
          }

          // Wrap this declaration in a namespace
          var nextParent = new Skew.ObjectSymbol(Skew.SymbolKind.OBJECT_NAMESPACE, name);
          nextParent.range = range;
          parent.objects.push(nextParent);
          parent = nextParent;

          // Update the declaration token
          nameToken = nextToken;
          range = nextToken.range;
          name = range.toString();
        }
      }

      // Parse the symbol body
      switch (kind) {
        case Skew.SymbolKind.VARIABLE_GLOBAL:
        case Skew.SymbolKind.VARIABLE_INSTANCE: {
          var variable1 = new Skew.VariableSymbol(kind, name);
          variable1.range = range;

          if (token.kind === Skew.TokenKind.CONST) {
            variable1.flags |= Skew.Symbol.IS_CONST;
          }

          if (Skew.Parsing.peekType(context)) {
            variable1.type = Skew.Parsing.typePratt.parse(context, Skew.Precedence.LOWEST);
          }

          if (context.eat(Skew.TokenKind.ASSIGN)) {
            variable1.value = Skew.Parsing.pratt.parse(context, Skew.Precedence.LOWEST);

            if (variable1.value === null) {
              return false;
            }

            Skew.Parsing.checkExtraParentheses(context, variable1.value);
          }

          parent.variables.push(variable1);
          symbol = variable1;
          break;
        }

        case Skew.SymbolKind.FUNCTION_ANNOTATION:
        case Skew.SymbolKind.FUNCTION_CONSTRUCTOR:
        case Skew.SymbolKind.FUNCTION_GLOBAL:
        case Skew.SymbolKind.FUNCTION_INSTANCE: {
          var $function = new Skew.FunctionSymbol(kind, name);
          $function.range = range;

          if (token.kind === Skew.TokenKind.OVER) {
            $function.flags |= Skew.Symbol.IS_OVER;
          }

          // Check for setters like "def foo=(x int) {}" but don't allow a space
          // between the name and the assignment operator
          if (kind !== Skew.SymbolKind.FUNCTION_ANNOTATION && nameToken.kind === Skew.TokenKind.IDENTIFIER && context.peek(Skew.TokenKind.ASSIGN) && context.current().range.start === nameToken.range.end) {
            $function.range = Skew.Range.span($function.range, context.next().range);
            $function.flags |= Skew.Symbol.IS_SETTER;
            $function.name += "=";
          }

          // Parse type parameters
          if (context.eat(Skew.TokenKind.START_PARAMETER_LIST)) {
            $function.parameters = Skew.Parsing.parseTypeParameters(context, Skew.SymbolKind.PARAMETER_FUNCTION);

            if ($function.parameters === null) {
              return false;
            }
          }

          // Parse function arguments
          var before = context.current();

          if (context.eat(Skew.TokenKind.LEFT_PARENTHESIS)) {
            if (!Skew.Parsing.parseFunctionArguments(context, $function)) {
              return false;
            }

            // Functions without arguments are "getters" and don't use parentheses
            if ($function.$arguments.length === 0) {
              context.log.syntaxErrorEmptyFunctionParentheses(context.spanSince(before.range));
            }
          }

          if (kind !== Skew.SymbolKind.FUNCTION_ANNOTATION && !Skew.Parsing.parseFunctionReturnTypeAndBlock(context, $function)) {
            return false;
          }

          // Don't mark operators as getters to avoid confusion with unary operators and compiler-generated call expressions
          if (!isOperator && $function.$arguments.length === 0) {
            $function.flags |= Skew.Symbol.IS_GETTER;
          }

          parent.functions.push($function);
          symbol = $function;
          break;
        }

        case Skew.SymbolKind.OBJECT_CLASS:
        case Skew.SymbolKind.OBJECT_ENUM:
        case Skew.SymbolKind.OBJECT_INTERFACE:
        case Skew.SymbolKind.OBJECT_NAMESPACE: {
          var object = new Skew.ObjectSymbol(kind, name);
          object.range = range;

          if (kind !== Skew.SymbolKind.OBJECT_NAMESPACE && context.eat(Skew.TokenKind.START_PARAMETER_LIST)) {
            object.parameters = Skew.Parsing.parseTypeParameters(context, Skew.SymbolKind.PARAMETER_OBJECT);

            if (object.parameters === null) {
              return false;
            }
          }

          if (context.eat(Skew.TokenKind.COLON)) {
            object.base = Skew.Parsing.typePratt.parse(context, Skew.Precedence.LOWEST);

            if (object.base === null) {
              return false;
            }
          }

          if (!context.expect(Skew.TokenKind.LEFT_BRACE)) {
            return false;
          }

          Skew.Parsing.parseSymbols(context, object, null);

          if (!context.expect(Skew.TokenKind.RIGHT_BRACE)) {
            return false;
          }

          parent.objects.push(object);
          symbol = object;
          break;
        }

        default: {
          assert(false);
          break;
        }
      }

      // Forbid certain kinds of symbols inside enums
      if (parent.kind === Skew.SymbolKind.OBJECT_ENUM && (kind === Skew.SymbolKind.FUNCTION_CONSTRUCTOR || kind === Skew.SymbolKind.VARIABLE_INSTANCE)) {
        context.log.syntaxErrorBadDeclarationInsideEnum(context.spanSince(token.range));
      }
    }

    symbol.annotations = annotations;
    symbol.comments = comments;
    comments = Skew.Parsing.parseTrailingComment(context, comments);

    if (comments !== null) {
      symbol.comments = comments;
      context.eat(Skew.TokenKind.NEWLINE);
    }

    else if (!Skew.Parsing.parseAfterBlock(context)) {
      return false;
    }

    return true;
  };

  Skew.Parsing.parseSymbols = function(context, parent, annotations) {
    context.eat(Skew.TokenKind.NEWLINE);

    while (!context.peek(Skew.TokenKind.END_OF_FILE) && !context.peek(Skew.TokenKind.RIGHT_BRACE)) {
      if (!Skew.Parsing.parseSymbol(context, parent, annotations)) {
        break;
      }
    }
  };

  Skew.Parsing.parseCommaSeparatedList = function(context, stop) {
    var values = [];

    while (!context.peek(stop)) {
      if (!(values.length === 0)) {
        if (!context.expect(Skew.TokenKind.COMMA)) {
          return null;
        }

        context.eat(Skew.TokenKind.NEWLINE);
      }

      var value = Skew.Parsing.pratt.parse(context, Skew.Precedence.LOWEST);
      values.push(value);

      if (value === null) {
        break;
      }
    }

    if (!context.expect(stop)) {
      return null;
    }

    return values;
  };

  Skew.Parsing.parseHexCharacter = function(c) {
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
  };

  Skew.Parsing.parseStringLiteral = function(log, range) {
    var text = range.toString();
    assert(text.length >= 2);
    assert(text.charCodeAt(0) === 34 || text.charCodeAt(0) === 39);
    assert(text.charCodeAt(text.length - 1 | 0) === text.charCodeAt(0));
    var builder = new StringBuilder();

    // Append long runs of unescaped characters using a single slice for speed
    var start = 1;
    var i = 1;

    while ((i + 1 | 0) < text.length) {
      var c = text.charCodeAt(i);
      ++i;

      if (c === 92) {
        var escape = i - 1 | 0;
        builder.append(text.slice(start, escape));

        if ((i + 1 | 0) < text.length) {
          c = text.charCodeAt(i);
          ++i;

          if (c === 110) {
            builder.append("\n");
            start = i;
          }

          else if (c === 114) {
            builder.append("\r");
            start = i;
          }

          else if (c === 116) {
            builder.append("\t");
            start = i;
          }

          else if (c === 101) {
            builder.append("\x1B");
            start = i;
          }

          else if (c === 48) {
            builder.append("\0");
            start = i;
          }

          else if (c === 92 || c === 34 || c === 39) {
            builder.append(String.fromCharCode(c));
            start = i;
          }

          else if (c === 120) {
            if ((i + 1 | 0) < text.length) {
              var c0 = Skew.Parsing.parseHexCharacter(text.charCodeAt(i));
              ++i;

              if ((i + 1 | 0) < text.length) {
                var c1 = Skew.Parsing.parseHexCharacter(text.charCodeAt(i));
                ++i;

                if (c0 !== -1 && c1 !== -1) {
                  builder.append(String.fromCharCode(c0 << 4 | c1));
                  start = i;
                }
              }
            }
          }
        }

        if (start < i) {
          log.syntaxErrorInvalidEscapeSequence(new Skew.Range(range.source, range.start + escape | 0, range.start + i | 0));
        }
      }
    }

    builder.append(text.slice(start, i));
    return builder.toString();
  };

  Skew.Parsing.boolLiteral = function(value) {
    return function(context, token) {
      return new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.BoolContent(value)).withRange(token.range);
    };
  };

  Skew.Parsing.tokenLiteral = function(kind) {
    return function(context, token) {
      return new Skew.Node(kind).withRange(token.range);
    };
  };

  Skew.Parsing.unaryPrefix = function(kind) {
    return function(context, token, value) {
      return Skew.Node.createUnary(kind, value).withRange(Skew.Range.span(token.range, value.range)).withInternalRange(token.range);
    };
  };

  Skew.Parsing.unaryPostfix = function(kind) {
    return function(context, value, token) {
      return Skew.Node.createUnary(kind, value).withRange(Skew.Range.span(value.range, token.range)).withInternalRange(token.range);
    };
  };

  Skew.Parsing.binaryInfix = function(kind) {
    return function(context, left, token, right) {
      if (kind === Skew.NodeKind.ASSIGN && left.kind === Skew.NodeKind.INDEX) {
        left.appendChild(right);
        left.kind = Skew.NodeKind.ASSIGN_INDEX;
        return left.withRange(Skew.Range.span(left.range, right.range)).withInternalRange(Skew.Range.span(left.internalRange, right.range));
      }

      return Skew.Node.createBinary(kind, left, right).withRange(Skew.Range.span(left.range, right.range)).withInternalRange(token.range);
    };
  };

  Skew.Parsing.createExpressionParser = function() {
    var pratt = new Skew.Pratt();
    pratt.literal(Skew.TokenKind.DOUBLE, function(context, token) {
      return new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.DoubleContent(+token.range.toString())).withRange(token.range);
    });
    pratt.literal(Skew.TokenKind.FALSE, Skew.Parsing.boolLiteral(false));
    pratt.literal(Skew.TokenKind.INT, Skew.Parsing.intLiteral);
    pratt.literal(Skew.TokenKind.INT_BINARY, Skew.Parsing.intLiteral);
    pratt.literal(Skew.TokenKind.INT_HEX, Skew.Parsing.intLiteral);
    pratt.literal(Skew.TokenKind.INT_OCTAL, Skew.Parsing.intLiteral);
    pratt.literal(Skew.TokenKind.NULL, Skew.Parsing.tokenLiteral(Skew.NodeKind.NULL));
    pratt.literal(Skew.TokenKind.STRING, Skew.Parsing.stringLiteral);
    pratt.literal(Skew.TokenKind.SUPER, Skew.Parsing.tokenLiteral(Skew.NodeKind.SUPER));
    pratt.literal(Skew.TokenKind.TRUE, Skew.Parsing.boolLiteral(true));
    pratt.literal(Skew.TokenKind.CHARACTER, function(context, token) {
      var result = Skew.Parsing.parseStringLiteral(context.log, token.range);
      var codePoint = 0;

      // There must be exactly one unicode code point
      var iterator = Unicode.StringIterator.INSTANCE.reset(result, 0);
      codePoint = iterator.nextCodePoint();

      if (codePoint === -1 || iterator.nextCodePoint() !== -1) {
        context.log.syntaxErrorInvalidCharacter(token.range);
      }

      // Don't return null when there's an error because that
      // error won't affect the rest of the compilation
      return new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.IntContent(codePoint)).withRange(token.range);
    });
    pratt.prefix(Skew.TokenKind.MINUS, Skew.Precedence.UNARY_PREFIX, Skew.Parsing.unaryPrefix(Skew.NodeKind.NEGATIVE));
    pratt.prefix(Skew.TokenKind.NOT, Skew.Precedence.UNARY_PREFIX, Skew.Parsing.unaryPrefix(Skew.NodeKind.NOT));
    pratt.prefix(Skew.TokenKind.PLUS, Skew.Precedence.UNARY_PREFIX, Skew.Parsing.unaryPrefix(Skew.NodeKind.POSITIVE));
    pratt.prefix(Skew.TokenKind.TILDE, Skew.Precedence.UNARY_PREFIX, Skew.Parsing.unaryPrefix(Skew.NodeKind.COMPLEMENT));
    pratt.prefix(Skew.TokenKind.INCREMENT, Skew.Precedence.UNARY_PREFIX, Skew.Parsing.unaryPrefix(Skew.NodeKind.INCREMENT));
    pratt.prefix(Skew.TokenKind.DECREMENT, Skew.Precedence.UNARY_PREFIX, Skew.Parsing.unaryPrefix(Skew.NodeKind.DECREMENT));
    pratt.postfix(Skew.TokenKind.INCREMENT, Skew.Precedence.UNARY_PREFIX, Skew.Parsing.unaryPostfix(Skew.NodeKind.INCREMENT));
    pratt.postfix(Skew.TokenKind.DECREMENT, Skew.Precedence.UNARY_PREFIX, Skew.Parsing.unaryPostfix(Skew.NodeKind.DECREMENT));
    pratt.infix(Skew.TokenKind.BITWISE_AND, Skew.Precedence.BITWISE_AND, Skew.Parsing.binaryInfix(Skew.NodeKind.BITWISE_AND));
    pratt.infix(Skew.TokenKind.BITWISE_OR, Skew.Precedence.BITWISE_OR, Skew.Parsing.binaryInfix(Skew.NodeKind.BITWISE_OR));
    pratt.infix(Skew.TokenKind.BITWISE_XOR, Skew.Precedence.BITWISE_XOR, Skew.Parsing.binaryInfix(Skew.NodeKind.BITWISE_XOR));
    pratt.infix(Skew.TokenKind.COMPARE, Skew.Precedence.COMPARE, Skew.Parsing.binaryInfix(Skew.NodeKind.COMPARE));
    pratt.infix(Skew.TokenKind.DIVIDE, Skew.Precedence.MULTIPLY, Skew.Parsing.binaryInfix(Skew.NodeKind.DIVIDE));
    pratt.infix(Skew.TokenKind.EQUAL, Skew.Precedence.EQUAL, Skew.Parsing.binaryInfix(Skew.NodeKind.EQUAL));
    pratt.infix(Skew.TokenKind.GREATER_THAN, Skew.Precedence.COMPARE, Skew.Parsing.binaryInfix(Skew.NodeKind.GREATER_THAN));
    pratt.infix(Skew.TokenKind.GREATER_THAN_OR_EQUAL, Skew.Precedence.COMPARE, Skew.Parsing.binaryInfix(Skew.NodeKind.GREATER_THAN_OR_EQUAL));
    pratt.infix(Skew.TokenKind.IN, Skew.Precedence.COMPARE, Skew.Parsing.binaryInfix(Skew.NodeKind.IN));
    pratt.infix(Skew.TokenKind.IS, Skew.Precedence.COMPARE, Skew.Parsing.binaryInfix(Skew.NodeKind.IS));
    pratt.infix(Skew.TokenKind.LESS_THAN, Skew.Precedence.COMPARE, Skew.Parsing.binaryInfix(Skew.NodeKind.LESS_THAN));
    pratt.infix(Skew.TokenKind.LESS_THAN_OR_EQUAL, Skew.Precedence.COMPARE, Skew.Parsing.binaryInfix(Skew.NodeKind.LESS_THAN_OR_EQUAL));
    pratt.infix(Skew.TokenKind.LOGICAL_AND, Skew.Precedence.LOGICAL_AND, Skew.Parsing.binaryInfix(Skew.NodeKind.LOGICAL_AND));
    pratt.infix(Skew.TokenKind.LOGICAL_OR, Skew.Precedence.LOGICAL_OR, Skew.Parsing.binaryInfix(Skew.NodeKind.LOGICAL_OR));
    pratt.infix(Skew.TokenKind.MINUS, Skew.Precedence.ADD, Skew.Parsing.binaryInfix(Skew.NodeKind.SUBTRACT));
    pratt.infix(Skew.TokenKind.MULTIPLY, Skew.Precedence.MULTIPLY, Skew.Parsing.binaryInfix(Skew.NodeKind.MULTIPLY));
    pratt.infix(Skew.TokenKind.NOT_EQUAL, Skew.Precedence.EQUAL, Skew.Parsing.binaryInfix(Skew.NodeKind.NOT_EQUAL));
    pratt.infix(Skew.TokenKind.PLUS, Skew.Precedence.ADD, Skew.Parsing.binaryInfix(Skew.NodeKind.ADD));
    pratt.infix(Skew.TokenKind.POWER, Skew.Precedence.UNARY_PREFIX, Skew.Parsing.binaryInfix(Skew.NodeKind.POWER));
    pratt.infix(Skew.TokenKind.REMAINDER, Skew.Precedence.MULTIPLY, Skew.Parsing.binaryInfix(Skew.NodeKind.REMAINDER));
    pratt.infix(Skew.TokenKind.SHIFT_LEFT, Skew.Precedence.SHIFT, Skew.Parsing.binaryInfix(Skew.NodeKind.SHIFT_LEFT));
    pratt.infix(Skew.TokenKind.SHIFT_RIGHT, Skew.Precedence.SHIFT, Skew.Parsing.binaryInfix(Skew.NodeKind.SHIFT_RIGHT));
    pratt.infixRight(Skew.TokenKind.ASSIGN, Skew.Precedence.ASSIGN, Skew.Parsing.binaryInfix(Skew.NodeKind.ASSIGN));
    pratt.infixRight(Skew.TokenKind.ASSIGN_BITWISE_AND, Skew.Precedence.ASSIGN, Skew.Parsing.binaryInfix(Skew.NodeKind.ASSIGN_BITWISE_AND));
    pratt.infixRight(Skew.TokenKind.ASSIGN_BITWISE_OR, Skew.Precedence.ASSIGN, Skew.Parsing.binaryInfix(Skew.NodeKind.ASSIGN_BITWISE_OR));
    pratt.infixRight(Skew.TokenKind.ASSIGN_BITWISE_XOR, Skew.Precedence.ASSIGN, Skew.Parsing.binaryInfix(Skew.NodeKind.ASSIGN_BITWISE_XOR));
    pratt.infixRight(Skew.TokenKind.ASSIGN_DIVIDE, Skew.Precedence.ASSIGN, Skew.Parsing.binaryInfix(Skew.NodeKind.ASSIGN_DIVIDE));
    pratt.infixRight(Skew.TokenKind.ASSIGN_MINUS, Skew.Precedence.ASSIGN, Skew.Parsing.binaryInfix(Skew.NodeKind.ASSIGN_SUBTRACT));
    pratt.infixRight(Skew.TokenKind.ASSIGN_MULTIPLY, Skew.Precedence.ASSIGN, Skew.Parsing.binaryInfix(Skew.NodeKind.ASSIGN_MULTIPLY));
    pratt.infixRight(Skew.TokenKind.ASSIGN_PLUS, Skew.Precedence.ASSIGN, Skew.Parsing.binaryInfix(Skew.NodeKind.ASSIGN_ADD));
    pratt.infixRight(Skew.TokenKind.ASSIGN_POWER, Skew.Precedence.ASSIGN, Skew.Parsing.binaryInfix(Skew.NodeKind.ASSIGN_POWER));
    pratt.infixRight(Skew.TokenKind.ASSIGN_REMAINDER, Skew.Precedence.ASSIGN, Skew.Parsing.binaryInfix(Skew.NodeKind.ASSIGN_REMAINDER));
    pratt.infixRight(Skew.TokenKind.ASSIGN_SHIFT_LEFT, Skew.Precedence.ASSIGN, Skew.Parsing.binaryInfix(Skew.NodeKind.ASSIGN_SHIFT_LEFT));
    pratt.infixRight(Skew.TokenKind.ASSIGN_SHIFT_RIGHT, Skew.Precedence.ASSIGN, Skew.Parsing.binaryInfix(Skew.NodeKind.ASSIGN_SHIFT_RIGHT));
    pratt.parselet(Skew.TokenKind.DOT, Skew.Precedence.MEMBER).infix = Skew.Parsing.dotInfixParselet;
    pratt.parselet(Skew.TokenKind.INDEX, Skew.Precedence.LOWEST).prefix = Skew.Parsing.initializerParselet;
    pratt.parselet(Skew.TokenKind.LEFT_BRACE, Skew.Precedence.LOWEST).prefix = Skew.Parsing.initializerParselet;
    pratt.parselet(Skew.TokenKind.LEFT_BRACKET, Skew.Precedence.LOWEST).prefix = Skew.Parsing.initializerParselet;
    pratt.parselet(Skew.TokenKind.LIST_NEW, Skew.Precedence.LOWEST).prefix = Skew.Parsing.initializerParselet;
    pratt.parselet(Skew.TokenKind.SET_NEW, Skew.Precedence.LOWEST).prefix = Skew.Parsing.initializerParselet;
    pratt.parselet(Skew.TokenKind.START_PARAMETER_LIST, Skew.Precedence.MEMBER).infix = Skew.Parsing.parameterizedParselet;

    // Lambda expressions like "=> x"
    pratt.parselet(Skew.TokenKind.ARROW, Skew.Precedence.LOWEST).prefix = function(context) {
      var token = context.current();
      var symbol = new Skew.FunctionSymbol(Skew.SymbolKind.FUNCTION_LOCAL, "<lambda>");

      if (!Skew.Parsing.parseFunctionBlock(context, symbol)) {
        return null;
      }

      symbol.range = context.spanSince(token.range);
      return Skew.Node.createLambda(symbol).withRange(symbol.range);
    };

    // Cast expressions
    pratt.parselet(Skew.TokenKind.AS, Skew.Precedence.UNARY_PREFIX).infix = function(context, left) {
      var token = context.next();
      var type = Skew.Parsing.typePratt.parse(context, Skew.Precedence.LOWEST);

      if (type === null) {
        return null;
      }

      return Skew.Node.createCast(left, type).withRange(context.spanSince(left.range)).withInternalRange(token.range);
    };

    // Using "." as a unary prefix operator accesses members off the inferred type
    pratt.parselet(Skew.TokenKind.DOT, Skew.Precedence.MEMBER).prefix = function(context) {
      var token = context.next();
      var range = context.current().range;

      if (!context.expect(Skew.TokenKind.IDENTIFIER)) {
        return null;
      }

      return new Skew.Node(Skew.NodeKind.DOT).withContent(new Skew.StringContent(range.toString())).withChildren([null]).withRange(context.spanSince(token.range)).withInternalRange(range);
    };

    // Access members off of "dynamic" for untyped globals
    pratt.parselet(Skew.TokenKind.DYNAMIC, Skew.Precedence.LOWEST).prefix = function(context) {
      var token = context.next();

      if (!context.expect(Skew.TokenKind.DOT)) {
        return null;
      }

      var range = context.current().range;

      if (!context.expect(Skew.TokenKind.IDENTIFIER)) {
        return null;
      }

      return new Skew.Node(Skew.NodeKind.DOT).withContent(new Skew.StringContent(range.toString())).withChildren([new Skew.Node(Skew.NodeKind.DYNAMIC)]).withRange(context.spanSince(token.range)).withInternalRange(range);
    };

    // Name expressions and lambda expressions like "x => x * x"
    pratt.parselet(Skew.TokenKind.IDENTIFIER, Skew.Precedence.LOWEST).prefix = function(context) {
      var range = context.next().range;
      var name = range.toString();

      if (context.peek(Skew.TokenKind.ARROW)) {
        var symbol = new Skew.FunctionSymbol(Skew.SymbolKind.FUNCTION_LOCAL, "<lambda>");
        var argument = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_LOCAL, name);
        argument.range = range;
        symbol.$arguments.push(argument);

        if (!Skew.Parsing.parseFunctionBlock(context, symbol)) {
          return null;
        }

        symbol.range = context.spanSince(range);
        return Skew.Node.createLambda(symbol).withRange(symbol.range);
      }

      return new Skew.Node(Skew.NodeKind.NAME).withContent(new Skew.StringContent(name)).withRange(range);
    };

    // Index expressions
    pratt.parselet(Skew.TokenKind.LEFT_BRACKET, Skew.Precedence.MEMBER).infix = function(context, left) {
      var token = context.next();
      var $arguments = Skew.Parsing.parseCommaSeparatedList(context, Skew.TokenKind.RIGHT_BRACKET);

      if ($arguments === null) {
        return null;
      }

      return Skew.Node.createIndex(left, $arguments).withRange(context.spanSince(left.range)).withInternalRange(context.spanSince(token.range));
    };

    // Parenthetic groups and lambda expressions like "() => x"
    pratt.parselet(Skew.TokenKind.LEFT_PARENTHESIS, Skew.Precedence.LOWEST).prefix = function(context) {
      var token = context.next();

      // Try to parse a group
      if (!context.peek(Skew.TokenKind.RIGHT_PARENTHESIS)) {
        var value = pratt.parse(context, Skew.Precedence.LOWEST);

        if (value === null) {
          return null;
        }

        if ((value.kind !== Skew.NodeKind.NAME || !Skew.Parsing.peekType(context)) && context.eat(Skew.TokenKind.RIGHT_PARENTHESIS)) {
          if (value.kind !== Skew.NodeKind.NAME || !context.peek(Skew.TokenKind.ARROW)) {
            return value.withRange(context.spanSince(token.range)).withFlags(Skew.Node.IS_INSIDE_PARENTHESES);
          }

          context.undo();
        }

        context.undo();
      }

      // Parse a lambda instead
      var symbol = new Skew.FunctionSymbol(Skew.SymbolKind.FUNCTION_LOCAL, "<lambda>");

      if (!Skew.Parsing.parseFunctionArguments(context, symbol) || !Skew.Parsing.parseFunctionReturnTypeAndBlock(context, symbol)) {
        return null;
      }

      symbol.range = context.spanSince(token.range);
      return Skew.Node.createLambda(symbol).withRange(symbol.range);
    };

    // Call expressions
    pratt.parselet(Skew.TokenKind.LEFT_PARENTHESIS, Skew.Precedence.UNARY_POSTFIX).infix = function(context, left) {
      var token = context.next();
      var $arguments = Skew.Parsing.parseCommaSeparatedList(context, Skew.TokenKind.RIGHT_PARENTHESIS);

      if ($arguments === null) {
        return null;
      }

      return Skew.Node.createCall(left, $arguments).withRange(context.spanSince(left.range)).withInternalRange(context.spanSince(token.range));
    };

    // Hook expressions
    pratt.parselet(Skew.TokenKind.QUESTION_MARK, Skew.Precedence.ASSIGN).infix = function(context, left) {
      context.next();
      var middle = pratt.parse(context, Skew.Precedence.ASSIGN - 1 | 0);

      if (middle === null || !context.expect(Skew.TokenKind.COLON)) {
        return null;
      }

      var right = pratt.parse(context, Skew.Precedence.ASSIGN - 1 | 0);

      if (right === null) {
        return null;
      }

      return Skew.Node.createHook(left, middle, right).withRange(context.spanSince(left.range));
    };
    return pratt;
  };

  Skew.Parsing.createTypeParser = function() {
    var pratt = new Skew.Pratt();
    pratt.literal(Skew.TokenKind.DYNAMIC, Skew.Parsing.tokenLiteral(Skew.NodeKind.DYNAMIC));
    pratt.parselet(Skew.TokenKind.DOT, Skew.Precedence.MEMBER).infix = Skew.Parsing.dotInfixParselet;
    pratt.parselet(Skew.TokenKind.START_PARAMETER_LIST, Skew.Precedence.MEMBER).infix = Skew.Parsing.parameterizedParselet;

    // Name expressions or lambda type expressions like "fn(int) int"
    pratt.parselet(Skew.TokenKind.IDENTIFIER, Skew.Precedence.LOWEST).prefix = function(context) {
      var token = context.next();
      var name = token.range.toString();

      if (name !== "fn" || !context.eat(Skew.TokenKind.LEFT_PARENTHESIS)) {
        return new Skew.Node(Skew.NodeKind.NAME).withContent(new Skew.StringContent(name)).withRange(token.range);
      }

      // Parse argument types
      var argTypes = [];

      while (!context.eat(Skew.TokenKind.RIGHT_PARENTHESIS)) {
        if (!(argTypes.length === 0) && !context.expect(Skew.TokenKind.COMMA)) {
          return null;
        }

        var type = Skew.Parsing.typePratt.parse(context, Skew.Precedence.LOWEST);

        if (type === null) {
          return null;
        }

        argTypes.push(type);
      }

      var returnType = null;

      // Parse return type if present
      if (Skew.Parsing.peekType(context)) {
        returnType = Skew.Parsing.typePratt.parse(context, Skew.Precedence.LOWEST);

        if (returnType === null) {
          return null;
        }
      }

      return Skew.Node.createLambdaType(argTypes, returnType).withRange(context.spanSince(token.range));
    };
    return pratt;
  };

  Skew.Parsing.intLiteral = function(context, token) {
    return new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.IntContent(Skew.Parsing.parseIntLiteral(token.range.toString()).value)).withRange(token.range);
  };

  Skew.Parsing.stringLiteral = function(context, token) {
    return new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.StringContent(Skew.Parsing.parseStringLiteral(context.log, token.range))).withRange(token.range);
  };

  Skew.ParserContext = function(log, tokens) {
    this.log = log;
    this.inNonVoidFunction = false;
    this.needsPreprocessor = false;
    this.tokens = tokens;
    this.index = 0;
    this.previousSyntaxError = null;
  };

  Skew.ParserContext.prototype.current = function() {
    return this.tokens[this.index];
  };

  Skew.ParserContext.prototype.next = function() {
    var token = this.current();

    if ((this.index + 1 | 0) < this.tokens.length) {
      ++this.index;
    }

    return token;
  };

  Skew.ParserContext.prototype.spanSince = function(range) {
    var previous = this.tokens[this.index > 0 ? this.index - 1 | 0 : 0];
    return previous.range.end < range.start ? range : Skew.Range.span(range, previous.range);
  };

  Skew.ParserContext.prototype.peek = function(kind) {
    return this.current().kind === kind;
  };

  Skew.ParserContext.prototype.eat = function(kind) {
    if (this.peek(kind)) {
      this.next();
      return true;
    }

    return false;
  };

  Skew.ParserContext.prototype.undo = function() {
    assert(this.index > 0);
    --this.index;
  };

  Skew.ParserContext.prototype.expect = function(kind) {
    if (!this.eat(kind)) {
      var token = this.current();

      if (this.previousSyntaxError !== token) {
        var range = token.range;
        this.log.syntaxErrorExpectedToken(range, token.kind, kind);
        this.previousSyntaxError = token;
      }

      return false;
    }

    return true;
  };

  Skew.ParserContext.prototype.unexpectedToken = function() {
    var token = this.current();

    if (this.previousSyntaxError !== token) {
      this.log.syntaxErrorUnexpectedToken(token);
      this.previousSyntaxError = token;
    }
  };

  Skew.Parselet = function(precedence) {
    this.precedence = precedence;
    this.prefix = null;
    this.infix = null;
  };

  // A Pratt parser is a parser that associates up to two operations per token,
  // each with its own precedence. Pratt parsers excel at parsing expression
  // trees with deeply nested precedence levels. For an excellent writeup, see:
  //
  //   http://journal.stuffwithstuff.com/2011/03/19/pratt-parsers-expression-parsing-made-easy/
  //
  Skew.Pratt = function() {
    this.table = Object.create(null);
  };

  Skew.Pratt.prototype.parselet = function(kind, precedence) {
    var parselet = in_IntMap.get(this.table, kind, null);

    if (parselet === null) {
      var created = new Skew.Parselet(precedence);
      parselet = created;
      this.table[kind] = created;
    }

    else if (precedence > parselet.precedence) {
      parselet.precedence = precedence;
    }

    return parselet;
  };

  Skew.Pratt.prototype.parse = function(context, precedence) {
    var token = context.current();
    var parselet = in_IntMap.get(this.table, token.kind, null);

    if (parselet === null || parselet.prefix === null) {
      context.unexpectedToken();
      return null;
    }

    var node = this.resume(context, precedence, parselet.prefix(context));

    // Parselets must set the range of every node
    assert(node === null || node.range !== null);
    return node;
  };

  Skew.Pratt.prototype.resume = function(context, precedence, left) {
    while (left !== null) {
      var kind = context.current().kind;
      var parselet = in_IntMap.get(this.table, kind, null);

      if (parselet === null || parselet.infix === null || parselet.precedence <= precedence) {
        break;
      }

      left = parselet.infix(context, left);

      // Parselets must set the range of every node
      assert(left === null || left.range !== null);
    }

    return left;
  };

  Skew.Pratt.prototype.literal = function(kind, callback) {
    this.parselet(kind, Skew.Precedence.LOWEST).prefix = function(context) {
      return callback(context, context.next());
    };
  };

  Skew.Pratt.prototype.prefix = function(kind, precedence, callback) {
    var self = this;
    self.parselet(kind, Skew.Precedence.LOWEST).prefix = function(context) {
      var token = context.next();
      var value = self.parse(context, precedence);
      return value !== null ? callback(context, token, value) : null;
    };
  };

  Skew.Pratt.prototype.postfix = function(kind, precedence, callback) {
    this.parselet(kind, precedence).infix = function(context, left) {
      return callback(context, left, context.next());
    };
  };

  Skew.Pratt.prototype.infix = function(kind, precedence, callback) {
    var self = this;
    self.parselet(kind, precedence).infix = function(context, left) {
      var token = context.next();
      var right = self.parse(context, precedence);
      return right !== null ? callback(context, left, token, right) : null;
    };
  };

  Skew.Pratt.prototype.infixRight = function(kind, precedence, callback) {
    var self = this;
    self.parselet(kind, precedence).infix = function(context, left) {
      var token = context.next();

      // Subtract 1 for right-associativity
      var right = self.parse(context, precedence - 1 | 0);
      return right !== null ? callback(context, left, token, right) : null;
    };
  };

  Skew.FormattedRange = function(line, range) {
    this.line = line;
    this.range = range;
  };

  Skew.Range = function(source, start, end) {
    this.source = source;
    this.start = start;
    this.end = end;
  };

  Skew.Range.prototype.toString = function() {
    return this.source.contents.slice(this.start, this.end);
  };

  Skew.Range.prototype.locationString = function() {
    var location = this.source.indexToLineColumn(this.start);
    return this.source.name + ":" + (location.line + 1 | 0).toString() + ":" + (location.column + 1 | 0).toString();
  };

  Skew.Range.prototype.format = function(maxLength) {
    assert(this.source !== null);
    var start = this.source.indexToLineColumn(this.start);
    var end = this.source.indexToLineColumn(this.end);
    var line = this.source.contentsOfLine(start.line);
    var length = line.length;

    // Use a unicode iterator to count the actual code points so they don't get sliced through the middle
    var iterator = Unicode.StringIterator.INSTANCE.reset(line, 0);
    var a = iterator.countCodePointsUntil(start.column);
    var b = a + iterator.countCodePointsUntil(end.line === start.line ? end.column : length) | 0;
    var count = b + iterator.countCodePointsUntil(length) | 0;

    // Ensure the line length doesn't exceed maxLength
    if (maxLength > 0 && count > maxLength) {
      var centeredWidth = Math.min(b - a | 0, maxLength / 2 | 0);
      var centeredStart = Math.max((maxLength - centeredWidth | 0) / 2 | 0, 3);
      var codePoints = in_string.codePoints(line);

      // Left aligned
      if (a < centeredStart) {
        line = in_string.fromCodePoints(codePoints.slice(0, maxLength - 3 | 0)) + "...";

        if (b > (maxLength - 3 | 0)) {
          b = maxLength - 3 | 0;
        }
      }

      // Right aligned
      else if ((count - a | 0) < (maxLength - centeredStart | 0)) {
        var offset = count - maxLength | 0;
        line = "..." + in_string.fromCodePoints(codePoints.slice(offset + 3 | 0, count));
        a -= offset;
        b -= offset;
      }

      // Center aligned
      else {
        var offset1 = a - centeredStart | 0;
        line = "..." + in_string.fromCodePoints(codePoints.slice(offset1 + 3 | 0, (offset1 + maxLength | 0) - 3 | 0)) + "...";
        a -= offset1;
        b -= offset1;

        if (b > (maxLength - 3 | 0)) {
          b = maxLength - 3 | 0;
        }
      }
    }

    return new Skew.FormattedRange(line, in_string.repeat(" ", a) + ((b - a | 0) < 2 ? "^" : in_string.repeat("~", b - a | 0)));
  };

  Skew.Range.prototype.fromStart = function(count) {
    assert(count >= 0 && count <= (this.end - this.start | 0));
    return new Skew.Range(this.source, this.start, this.start + count | 0);
  };

  Skew.Range.prototype.fromEnd = function(count) {
    assert(count >= 0 && count <= (this.end - this.start | 0));
    return new Skew.Range(this.source, this.end - count | 0, this.end);
  };

  Skew.Range.prototype.slice = function(offsetStart, offsetEnd) {
    assert(offsetStart >= 0 && offsetStart <= offsetEnd && offsetEnd <= (this.end - this.start | 0));
    return new Skew.Range(this.source, this.start + offsetStart | 0, this.start + offsetEnd | 0);
  };

  Skew.Range.span = function(start, end) {
    assert(start.source === end.source);
    assert(start.start <= end.end);
    return new Skew.Range(start.source, start.start, end.end);
  };

  Skew.LineColumn = function(line, column) {
    this.line = line;
    this.column = column;
  };

  Skew.Source = function(name, contents) {
    this.name = name;
    this.contents = contents;
    this.lineOffsets = null;
  };

  Skew.Source.prototype.entireRange = function() {
    return new Skew.Range(this, 0, this.contents.length);
  };

  Skew.Source.prototype.contentsOfLine = function(line) {
    this.computeLineOffsets();

    if (line < 0 || line >= this.lineOffsets.length) {
      return "";
    }

    var start = this.lineOffsets[line];
    var end = (line + 1 | 0) < this.lineOffsets.length ? this.lineOffsets[line + 1 | 0] - 1 | 0 : this.contents.length;
    return this.contents.slice(start, end);
  };

  Skew.Source.prototype.indexToLineColumn = function(index) {
    this.computeLineOffsets();

    // Binary search to find the line
    var count = this.lineOffsets.length;
    var line = 0;

    while (count > 0) {
      var step = count / 2 | 0;
      var i = line + step | 0;

      if (this.lineOffsets[i] <= index) {
        line = i + 1 | 0;
        count = (count - step | 0) - 1 | 0;
      }

      else {
        count = step;
      }
    }

    // Use the line to compute the column
    var column = line > 0 ? index - this.lineOffsets[line - 1 | 0] | 0 : index;
    return new Skew.LineColumn(line - 1 | 0, column);
  };

  Skew.Source.prototype.computeLineOffsets = function() {
    if (this.lineOffsets === null) {
      this.lineOffsets = [0];

      for (var i = 0, count = this.contents.length; i < count; ++i) {
        if (this.contents.charCodeAt(i) === 10) {
          this.lineOffsets.push(i + 1 | 0);
        }
      }
    }
  };

  Skew.Token = function(range, kind) {
    this.range = range;
    this.kind = kind;
  };

  Skew.Token.prototype.firstCodeUnit = function() {
    if (this.kind === Skew.TokenKind.END_OF_FILE) {
      return 0;
    }

    assert(this.range.start < this.range.source.contents.length);
    return this.range.source.contents.charCodeAt(this.range.start);
  };

  Skew.CallSite = function(callNode, enclosingFunction) {
    this.callNode = callNode;
    this.enclosingFunction = enclosingFunction;
  };

  Skew.CallInfo = function(symbol) {
    this.symbol = symbol;
    this.callSites = [];
  };

  Skew.CallGraph = function(global) {
    this.callInfo = [];
    this.symbolToInfoIndex = Object.create(null);
    this.visitObject(global);
  };

  Skew.CallGraph.prototype.visitObject = function(symbol) {
    for (var i = 0, list = symbol.objects, count = list.length; i < count; ++i) {
      var object = list[i];
      this.visitObject(object);
    }

    for (var i1 = 0, list1 = symbol.functions, count1 = list1.length; i1 < count1; ++i1) {
      var $function = list1[i1];
      this.recordCallSite($function, null, null);
      this.visitNode($function.block, $function);
    }

    for (var i2 = 0, list2 = symbol.variables, count2 = list2.length; i2 < count2; ++i2) {
      var variable = list2[i2];
      this.visitNode(variable.value, null);
    }
  };

  Skew.CallGraph.prototype.visitNode = function(node, context) {
    if (node !== null) {
      if (node.children !== null) {
        for (var i = 0, list = node.children, count = list.length; i < count; ++i) {
          var child = list[i];
          this.visitNode(child, context);
        }
      }

      if (node.kind === Skew.NodeKind.CALL && node.symbol !== null) {
        assert(Skew.SymbolKind.isFunction(node.symbol.kind));
        this.recordCallSite(node.symbol.asFunctionSymbol(), node, context);
      }
    }
  };

  Skew.CallGraph.prototype.recordCallSite = function(symbol, node, context) {
    var index = in_IntMap.get(this.symbolToInfoIndex, symbol.id, -1);
    var info = index < 0 ? new Skew.CallInfo(symbol) : this.callInfo[index];

    if (index < 0) {
      this.symbolToInfoIndex[symbol.id] = this.callInfo.length;
      this.callInfo.push(info);
    }

    if (node !== null) {
      info.callSites.push(new Skew.CallSite(node, context));
    }
  };

  Skew.CompilerTarget = {
    NONE: 0,
    CSHARP: 1,
    JAVASCRIPT: 2,
    LISP_TREE: 3
  };

  Skew.Define = function(name, value) {
    this.name = name;
    this.value = value;
  };

  Skew.CompilerOptions = function() {
    this.defines = Object.create(null);
    this.foldAllConstants = false;
    this.globalizeAllFunctions = false;
    this.inlineAllFunctions = false;
    this.jsMangle = false;
    this.jsMinify = false;
    this.outputDirectory = "";
    this.outputFile = "";
    this.target = Skew.CompilerTarget.NONE;
  };

  Skew.CompilerOptions.prototype.define = function(name, value) {
    var range = new Skew.Source("<internal>", "--define:" + name + "=" + value).entireRange();
    this.defines[name] = new Skew.Define(range.slice(9, 9 + name.length | 0), range.fromEnd(value.length));
  };

  Skew.CompilerResult = function() {
    this.cache = new Skew.TypeCache();
    this.global = new Skew.ObjectSymbol(Skew.SymbolKind.OBJECT_GLOBAL, "<global>");
    this.outputs = null;
    this.totalTime = 0;
  };

  Skew.Folding = {};

  Skew.Folding.ConstantLookup = function() {
  };

  Skew.Folding.ConstantFolder = function(cache, constantLookup) {
    this.cache = cache;
    this.constantLookup = constantLookup;
  };

  Skew.Folding.ConstantFolder.prototype.visitObject = function(symbol) {
    for (var i = 0, list = symbol.objects, count = list.length; i < count; ++i) {
      var object = list[i];
      this.visitObject(object);
    }

    for (var i1 = 0, list1 = symbol.functions, count1 = list1.length; i1 < count1; ++i1) {
      var $function = list1[i1];

      if ($function.block !== null) {
        this.foldConstants($function.block);
      }
    }

    for (var i2 = 0, list2 = symbol.variables, count2 = list2.length; i2 < count2; ++i2) {
      var variable = list2[i2];

      if (variable.value !== null) {
        this.foldConstants(variable.value);
      }
    }
  };

  // Use this instead of node.become(Node.createConstant(content)) to avoid more GC
  Skew.Folding.ConstantFolder.prototype.flatten = function(node, content) {
    node.removeChildren();
    node.kind = Skew.NodeKind.CONSTANT;
    node.content = content;
    node.symbol = null;
  };

  // Use this instead of node.become(Node.createBool(value)) to avoid more GC
  Skew.Folding.ConstantFolder.prototype.flattenBool = function(node, value) {
    assert(node.resolvedType === this.cache.boolType || node.resolvedType === Skew.Type.DYNAMIC);
    this.flatten(node, new Skew.BoolContent(value));
  };

  // Use this instead of node.become(Node.createInt(value)) to avoid more GC
  Skew.Folding.ConstantFolder.prototype.flattenInt = function(node, value) {
    assert(node.resolvedType === this.cache.intType || node.resolvedType === Skew.Type.DYNAMIC);
    this.flatten(node, new Skew.IntContent(value));
  };

  // Use this instead of node.become(Node.createDouble(value)) to avoid more GC
  Skew.Folding.ConstantFolder.prototype.flattenDouble = function(node, value) {
    assert(node.resolvedType === this.cache.doubleType || node.resolvedType === Skew.Type.DYNAMIC);
    this.flatten(node, new Skew.DoubleContent(value));
  };

  // Use this instead of node.become(Node.createString(value)) to avoid more GC
  Skew.Folding.ConstantFolder.prototype.flattenString = function(node, value) {
    assert(node.resolvedType === this.cache.stringType || node.resolvedType === Skew.Type.DYNAMIC);
    this.flatten(node, new Skew.StringContent(value));
  };

  Skew.Folding.ConstantFolder.prototype.foldConstants = function(node) {
    var kind = node.kind;

    // Transform "a + (b + c)" => "(a + b) + c" before operands are folded
    if (kind === Skew.NodeKind.ADD && node.resolvedType === this.cache.stringType && node.binaryLeft().resolvedType === this.cache.stringType && node.binaryRight().resolvedType === this.cache.stringType) {
      this.rotateStringConcatenation(node);
    }

    // Fold operands before folding this node
    var children = node.children;

    if (children !== null) {
      var n = children.length;

      for (var i = 0, count = n; i < count; ++i) {
        var child = children[(n - i | 0) - 1 | 0];

        if (child !== null) {
          this.foldConstants(child);
        }
      }
    }

    // Separating the case bodies into separate functions makes the JavaScript JIT go faster
    switch (kind) {
      case Skew.NodeKind.BLOCK: {
        this.foldBlock(node);
        break;
      }

      case Skew.NodeKind.CALL: {
        this.foldCall(node);
        break;
      }

      case Skew.NodeKind.CAST: {
        this.foldCast(node);
        break;
      }

      case Skew.NodeKind.DOT: {
        this.foldDot(node);
        break;
      }

      case Skew.NodeKind.HOOK: {
        this.foldHook(node);
        break;
      }

      case Skew.NodeKind.NAME: {
        this.foldName(node);
        break;
      }

      default: {
        if (Skew.NodeKind.isUnary(kind)) {
          this.foldUnary(node);
        }

        else if (Skew.NodeKind.isBinary(kind)) {
          this.foldBinary(node);
        }
        break;
      }
    }
  };

  Skew.Folding.ConstantFolder.prototype.rotateStringConcatenation = function(node) {
    var left = node.binaryLeft();
    var right = node.binaryRight();
    assert(node.kind === Skew.NodeKind.ADD);
    assert(left.resolvedType === this.cache.stringType || left.resolvedType === Skew.Type.DYNAMIC);
    assert(right.resolvedType === this.cache.stringType || right.resolvedType === Skew.Type.DYNAMIC);

    if (right.kind === Skew.NodeKind.ADD) {
      var rightLeft = right.binaryLeft();
      var rightRight = right.binaryRight();
      assert(rightLeft.resolvedType === this.cache.stringType || rightLeft.resolvedType === Skew.Type.DYNAMIC);
      assert(rightRight.resolvedType === this.cache.stringType || rightRight.resolvedType === Skew.Type.DYNAMIC);
      left.swapWith(right);
      left.swapWith(rightRight);
      left.swapWith(rightLeft);
    }
  };

  Skew.Folding.ConstantFolder.prototype.foldStringConcatenation = function(node) {
    var left = node.binaryLeft();
    var right = node.binaryRight();
    assert(left.resolvedType === this.cache.stringType || left.resolvedType === Skew.Type.DYNAMIC);
    assert(right.resolvedType === this.cache.stringType || right.resolvedType === Skew.Type.DYNAMIC);

    if (right.isString()) {
      // "a" + "b" => "ab"
      if (left.isString()) {
        this.flattenString(node, left.asString() + right.asString());
      }

      else if (left.kind === Skew.NodeKind.ADD) {
        var leftLeft = left.binaryLeft();
        var leftRight = left.binaryRight();
        assert(leftLeft.resolvedType === this.cache.stringType || leftLeft.resolvedType === Skew.Type.DYNAMIC);
        assert(leftRight.resolvedType === this.cache.stringType || leftRight.resolvedType === Skew.Type.DYNAMIC);

        // (a + "b") + "c" => a + "bc"
        if (leftRight.isString()) {
          this.flattenString(leftRight, leftRight.asString() + right.asString());
          node.become(left.remove());
        }
      }
    }
  };

  Skew.Folding.ConstantFolder.prototype.foldTry = function(node) {
    var tryBlock = node.tryBlock();
    var finallyBlock = node.finallyBlock();

    // A try block without any statements cannot possibly throw
    if (!tryBlock.hasChildren()) {
      node.remove();
      return -1;
    }

    // No need to keep an empty finally block around
    if (finallyBlock !== null && !finallyBlock.hasChildren()) {
      finallyBlock.replaceWithNull();
      finallyBlock = null;
    }

    // Inline the contents of the try block into the parent if possible
    if (node.children.length === 2 && finallyBlock === null) {
      var replacements = tryBlock.removeChildren();
      node.replaceWithNodes(replacements);
      return replacements.length - 1 | 0;
    }

    return 0;
  };

  Skew.Folding.ConstantFolder.prototype.foldIf = function(node) {
    var test = node.ifTest();
    var trueBlock = node.ifTrue();
    var falseBlock = node.ifFalse();

    // No reason to keep an empty "else" block
    if (falseBlock !== null && !falseBlock.hasChildren()) {
      falseBlock.replaceWithNull();
      falseBlock = null;
    }

    // Always true if statement
    if (test.isTrue()) {
      // Inline the contents of the true block
      var replacements = trueBlock.removeChildren();
      node.replaceWithNodes(replacements);
      return replacements.length - 1 | 0;
    }

    // Always false if statement
    else if (test.isFalse()) {
      // Remove entirely
      if (falseBlock === null) {
        node.remove();
        return -1;
      }

      // Inline the contents of the false block
      var replacements1 = falseBlock.removeChildren();
      node.replaceWithNodes(replacements1);
      return replacements1.length - 1 | 0;
    }

    // Remove if statements with empty true blocks
    else if (!trueBlock.hasChildren()) {
      // "if (a) {} else b;" => "if (!a) b;"
      if (falseBlock !== null && falseBlock.hasChildren()) {
        test.invertBooleanCondition(this.cache);
        trueBlock.swapWith(falseBlock);
        trueBlock.replaceWithNull();
      }

      // "if (a) {}" => ""
      else if (test.hasNoSideEffects()) {
        node.remove();
        return -1;
      }

      // "if (a) {}" => "a;"
      else {
        node.become(Skew.Node.createExpression(test.remove()));
      }
    }

    return 0;
  };

  Skew.Folding.ConstantFolder.prototype.foldSwitch = function(node) {
    var children = node.children;
    var defaultCase = null;

    // Check for a default case
    for (var i = 1, count = children.length; i < count; ++i) {
      var child = children[i];

      if (child.children.length === 1) {
        defaultCase = child;
        break;
      }
    }

    // Remove the default case if it's empty
    if (defaultCase !== null && !defaultCase.caseBlock().hasChildren()) {
      defaultCase.remove();
      defaultCase = null;
    }

    // If the default case is missing, all other empty cases can be removed too
    if (defaultCase === null) {
      var n = children.length;

      for (var i1 = 1, count1 = n; i1 < count1; ++i1) {
        var child1 = children[n - i1 | 0];

        if (!child1.caseBlock().hasChildren()) {
          child1.remove();
        }
      }
    }

    // Replace "switch (foo) {}" with "foo;"
    if (node.children.length === 1) {
      var value = node.switchValue();
      node.replaceWith(Skew.Node.createExpression(value.remove()).withRange(node.range));
      return -1;
    }

    return 0;
  };

  Skew.Folding.ConstantFolder.prototype.foldVar = function(node) {
    var symbol = node.symbol.asVariableSymbol();

    // Remove this symbol entirely if it's being inlined everywhere
    if (symbol.isConst() && this.constantLookup.constantForSymbol(symbol) !== null) {
      node.remove();
      return -1;
    }

    return 0;
  };

  Skew.Folding.ConstantFolder.prototype.foldBlock = function(node) {
    var children = node.children;
    var i = 0;

    while (i < children.length) {
      var child = children[i];
      var kind = child.kind;

      // Remove everything after a jump
      if (Skew.NodeKind.isJump(kind)) {
        var j = children.length - 1 | 0;

        while (j > i) {
          node.removeChildAtIndex(j);
          --j;
        }

        break;
      }

      // Remove constants and "while false { ... }" entirely
      if (kind === Skew.NodeKind.EXPRESSION && child.expressionValue().hasNoSideEffects() || kind === Skew.NodeKind.WHILE && child.whileTest().isFalse()) {
        node.removeChildAtIndex(i);
        --i;
      }

      else if (kind === Skew.NodeKind.VAR) {
        i += this.foldVar(child);
      }

      // Remove unused try statements since they can cause deoptimizations
      else if (kind === Skew.NodeKind.TRY) {
        i += this.foldTry(child);
      }

      // Statically evaluate if statements where possible
      else if (kind === Skew.NodeKind.IF) {
        i += this.foldIf(child);
      }

      // Fold switch statements
      else if (kind === Skew.NodeKind.SWITCH) {
        i += this.foldSwitch(child);
      }

      ++i;
    }
  };

  Skew.Folding.ConstantFolder.prototype.foldDot = function(node) {
    var symbol = node.symbol;

    // Only replace this with a constant if the target has no side effects.
    // This catches constants declared on imported types.
    if (symbol !== null && symbol.isConst() && (node.dotTarget() === null || node.dotTarget().hasNoSideEffects())) {
      var content = this.constantLookup.constantForSymbol(symbol.asVariableSymbol());

      if (content !== null) {
        this.flatten(node, content);
      }
    }
  };

  Skew.Folding.ConstantFolder.prototype.foldName = function(node) {
    var symbol = node.symbol;

    // Don't fold loop variables since they aren't actually constant across loop iterations
    if (symbol !== null && symbol.isConst() && !symbol.isLoopVariable()) {
      var content = this.constantLookup.constantForSymbol(symbol.asVariableSymbol());

      if (content !== null) {
        this.flatten(node, content);
      }
    }
  };

  Skew.Folding.ConstantFolder.prototype.foldCall = function(node) {
    if (node.kind === Skew.NodeKind.CALL) {
      var value = node.callValue();

      if (value.kind === Skew.NodeKind.DOT) {
        var target = value.dotTarget();

        if (target !== null && target.kind === Skew.NodeKind.CONSTANT && value.asString() === "toString") {
          var content = target.content;

          switch (content.kind()) {
            case Skew.ContentKind.BOOL: {
              this.flattenString(node, content.asBool().toString());
              break;
            }

            case Skew.ContentKind.INT: {
              this.flattenString(node, content.asInt().toString());
              break;
            }

            case Skew.ContentKind.STRING: {
              this.flattenString(node, content.asString());
              break;
            }
          }
        }
      }
    }
  };

  Skew.Folding.ConstantFolder.prototype.foldCast = function(node) {
    var type = node.castType().resolvedType;
    var value = node.castValue();

    if (value.kind === Skew.NodeKind.CONSTANT) {
      var content = value.content;
      var kind = content.kind();

      // Cast "bool" values
      if (kind === Skew.ContentKind.BOOL) {
        if (type === this.cache.intType) {
          this.flattenInt(node, value.asBool() | 0);
        }

        else if (type === this.cache.doubleType) {
          this.flattenDouble(node, +value.asBool());
        }
      }

      // Cast "int" values
      else if (kind === Skew.ContentKind.INT) {
        if (type === this.cache.boolType) {
          this.flattenBool(node, !!value.asInt());
        }

        else if (type === this.cache.doubleType) {
          this.flattenDouble(node, value.asInt());
        }
      }

      // Cast "double" values
      else if (kind === Skew.ContentKind.DOUBLE) {
        if (type === this.cache.boolType) {
          this.flattenBool(node, !!value.asDouble());
        }

        else if (type === this.cache.intType) {
          this.flattenInt(node, value.asDouble() | 0);
        }
      }
    }
  };

  Skew.Folding.ConstantFolder.prototype.foldUnary = function(node) {
    var value = node.unaryValue();
    var kind = node.kind;

    if (value.kind === Skew.NodeKind.CONSTANT) {
      var content = value.content;
      var contentKind = content.kind();

      // Fold "bool" values
      if (contentKind === Skew.ContentKind.BOOL) {
        if (kind === Skew.NodeKind.NOT) {
          this.flattenBool(node, !value.asBool());
        }
      }

      // Fold "int" values
      else if (contentKind === Skew.ContentKind.INT) {
        if (kind === Skew.NodeKind.POSITIVE) {
          this.flattenInt(node, +value.asInt());
        }

        else if (kind === Skew.NodeKind.NEGATIVE) {
          this.flattenInt(node, -value.asInt());
        }

        else if (kind === Skew.NodeKind.COMPLEMENT) {
          this.flattenInt(node, ~value.asInt());
        }
      }

      // Fold "float" or "double" values
      else if (contentKind === Skew.ContentKind.DOUBLE) {
        if (kind === Skew.NodeKind.POSITIVE) {
          this.flattenDouble(node, +value.asDouble());
        }

        else if (kind === Skew.NodeKind.NEGATIVE) {
          this.flattenDouble(node, -value.asDouble());
        }
      }
    }

    // Partial evaluation ("!!x" isn't necessarily "x" if we don't know the type)
    else if (kind === Skew.NodeKind.NOT && value.resolvedType !== Skew.Type.DYNAMIC) {
      switch (value.kind) {
        case Skew.NodeKind.NOT:
        case Skew.NodeKind.EQUAL:
        case Skew.NodeKind.NOT_EQUAL:
        case Skew.NodeKind.LOGICAL_OR:
        case Skew.NodeKind.LOGICAL_AND:
        case Skew.NodeKind.LESS_THAN:
        case Skew.NodeKind.GREATER_THAN:
        case Skew.NodeKind.LESS_THAN_OR_EQUAL:
        case Skew.NodeKind.GREATER_THAN_OR_EQUAL: {
          value.invertBooleanCondition(this.cache);
          node.become(value);
          break;
        }
      }
    }
  };

  Skew.Folding.ConstantFolder.prototype.foldConstantAddOrSubtract = function(node, variable, constant, delta) {
    var isAdd = node.kind === Skew.NodeKind.ADD;
    var needsContentUpdate = delta !== 0;
    var isRightConstant = constant === node.binaryRight();
    var shouldNegateConstant = !isAdd && isRightConstant;
    var value = constant.asInt();

    // Make this an add for simplicity
    if (shouldNegateConstant) {
      value = -value;
    }

    // Include the delta from the parent node if present
    value += delta;

    // Apply addition identities
    if (value === 0) {
      node.become(variable.remove());
      return;
    }

    // Check for nested addition or subtraction
    if (variable.kind === Skew.NodeKind.ADD || variable.kind === Skew.NodeKind.SUBTRACT) {
      var left = variable.binaryLeft();
      var right = variable.binaryRight();
      assert(left.resolvedType === this.cache.intType || left.resolvedType === Skew.Type.DYNAMIC);
      assert(right.resolvedType === this.cache.intType || right.resolvedType === Skew.Type.DYNAMIC);

      // (a + 1) + 2 => a + 3
      var isLeftConstant = left.isInt();

      if (isLeftConstant || right.isInt()) {
        this.foldConstantAddOrSubtract(variable, isLeftConstant ? right : left, isLeftConstant ? left : right, value);
        node.become(variable);
        return;
      }
    }

    // Adjust the value so it has the correct sign
    if (shouldNegateConstant) {
      value = -value;
    }

    // The negative sign can often be removed by code transformation
    if (value < 0) {
      // a + -1 => a - 1
      // a - -1 => a + 1
      if (isRightConstant) {
        node.kind = isAdd ? Skew.NodeKind.SUBTRACT : Skew.NodeKind.ADD;
        value = -value;
        needsContentUpdate = true;
      }

      // -1 + a => a - 1
      else if (isAdd) {
        node.kind = Skew.NodeKind.SUBTRACT;
        value = -value;
        variable.swapWith(constant);
        needsContentUpdate = true;
      }
    }

    // Avoid extra allocations
    if (needsContentUpdate) {
      constant.content = new Skew.IntContent(value);
    }

    // Also handle unary negation on "variable"
    this.foldAddOrSubtract(node);
  };

  Skew.Folding.ConstantFolder.prototype.foldAddOrSubtract = function(node) {
    var isAdd = node.kind === Skew.NodeKind.ADD;
    var left = node.binaryLeft();
    var right = node.binaryRight();

    // -a + b => b - a
    if (left.kind === Skew.NodeKind.NEGATIVE && isAdd) {
      left.become(left.unaryValue().replaceWithNull());
      left.swapWith(right);
      node.kind = Skew.NodeKind.SUBTRACT;
    }

    // a + -b => a - b
    // a - -b => a + b
    else if (right.kind === Skew.NodeKind.NEGATIVE) {
      right.become(right.unaryValue().replaceWithNull());
      node.kind = isAdd ? Skew.NodeKind.SUBTRACT : Skew.NodeKind.ADD;
    }
  };

  Skew.Folding.ConstantFolder.prototype.foldConstantMultiply = function(node, variable, constant) {
    assert(constant.isInt());

    // Canonicalize multiplication order
    if (node.binaryLeft() === constant) {
      variable.swapWith(constant);
    }

    // Apply identities
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

    // Multiply by a power of 2 should be a left-shift operation, which is
    // more concise and always faster (or at least never slower) than the
    // alternative. Division can't be replaced by a right-shift operation
    // because that would lead to incorrect results for negative numbers.
    var shift = this.logBase2(value);

    if (shift !== -1) {
      constant.content = new Skew.IntContent(shift);
      node.kind = Skew.NodeKind.SHIFT_LEFT;
    }
  };

  Skew.Folding.ConstantFolder.prototype.foldBinaryWithConstant = function(node, left, right) {
    // There are lots of other folding opportunities for most binary operators
    // here but those usually have a negligible performance and/or size impact
    // on the generated code and instead slow the compiler down. Only certain
    // ones are implemented below.
    switch (node.kind) {
      case Skew.NodeKind.LOGICAL_AND: {
        if (left.isFalse() || right.isTrue()) {
          node.become(left.remove());
        }

        else if (left.isTrue()) {
          node.become(right.remove());
        }
        break;
      }

      case Skew.NodeKind.LOGICAL_OR: {
        if (left.isTrue() || right.isFalse()) {
          node.become(left.remove());
        }

        else if (left.isFalse()) {
          node.become(right.remove());
        }
        break;
      }

      case Skew.NodeKind.ADD:
      case Skew.NodeKind.SUBTRACT: {
        if (left.isInt()) {
          this.foldConstantAddOrSubtract(node, right, left, 0);
        }

        else if (right.isInt()) {
          this.foldConstantAddOrSubtract(node, left, right, 0);
        }

        else {
          this.foldAddOrSubtract(node);
        }
        break;
      }

      case Skew.NodeKind.MULTIPLY: {
        if (left.isInt()) {
          this.foldConstantMultiply(node, right, left);
        }

        else if (right.isInt()) {
          this.foldConstantMultiply(node, left, right);
        }
        break;
      }
    }
  };

  Skew.Folding.ConstantFolder.prototype.foldBinary = function(node) {
    var kind = node.kind;

    if (kind === Skew.NodeKind.ADD && node.resolvedType === this.cache.stringType) {
      this.foldStringConcatenation(node);
      return;
    }

    var left = node.binaryLeft();
    var right = node.binaryRight();

    if (left.kind === Skew.NodeKind.CONSTANT && right.kind === Skew.NodeKind.CONSTANT) {
      var leftContent = left.content;
      var rightContent = right.content;
      var leftKind = leftContent.kind();
      var rightKind = rightContent.kind();

      // Fold equality operators
      if (leftKind === Skew.ContentKind.STRING && rightKind === Skew.ContentKind.STRING) {
        switch (kind) {
          case Skew.NodeKind.EQUAL: {
            this.flattenBool(node, leftContent.asString() === rightContent.asString());
            break;
          }

          case Skew.NodeKind.NOT_EQUAL: {
            this.flattenBool(node, leftContent.asString() !== rightContent.asString());
            break;
          }

          case Skew.NodeKind.LESS_THAN: {
            this.flattenBool(node, leftContent.asString() < rightContent.asString());
            break;
          }

          case Skew.NodeKind.GREATER_THAN: {
            this.flattenBool(node, leftContent.asString() > rightContent.asString());
            break;
          }

          case Skew.NodeKind.LESS_THAN_OR_EQUAL: {
            this.flattenBool(node, leftContent.asString() <= rightContent.asString());
            break;
          }

          case Skew.NodeKind.GREATER_THAN_OR_EQUAL: {
            this.flattenBool(node, leftContent.asString() >= rightContent.asString());
            break;
          }
        }

        return;
      }

      // Fold "bool" values
      else if (leftKind === Skew.ContentKind.BOOL && rightKind === Skew.ContentKind.BOOL) {
        switch (kind) {
          case Skew.NodeKind.LOGICAL_AND: {
            this.flattenBool(node, leftContent.asBool() && rightContent.asBool());
            break;
          }

          case Skew.NodeKind.LOGICAL_OR: {
            this.flattenBool(node, leftContent.asBool() || rightContent.asBool());
            break;
          }

          case Skew.NodeKind.EQUAL: {
            this.flattenBool(node, leftContent.asBool() === rightContent.asBool());
            break;
          }

          case Skew.NodeKind.NOT_EQUAL: {
            this.flattenBool(node, leftContent.asBool() !== rightContent.asBool());
            break;
          }
        }

        return;
      }

      // Fold "int" values
      else if (leftKind === Skew.ContentKind.INT && rightKind === Skew.ContentKind.INT) {
        switch (kind) {
          case Skew.NodeKind.ADD: {
            this.flattenInt(node, leftContent.asInt() + rightContent.asInt() | 0);
            break;
          }

          case Skew.NodeKind.SUBTRACT: {
            this.flattenInt(node, leftContent.asInt() - rightContent.asInt() | 0);
            break;
          }

          case Skew.NodeKind.MULTIPLY: {
            this.flattenInt(node, __imul(leftContent.asInt(), rightContent.asInt()));
            break;
          }

          case Skew.NodeKind.DIVIDE: {
            this.flattenInt(node, leftContent.asInt() / rightContent.asInt() | 0);
            break;
          }

          case Skew.NodeKind.REMAINDER: {
            this.flattenInt(node, leftContent.asInt() % rightContent.asInt() | 0);
            break;
          }

          case Skew.NodeKind.SHIFT_LEFT: {
            this.flattenInt(node, leftContent.asInt() << rightContent.asInt());
            break;
          }

          case Skew.NodeKind.SHIFT_RIGHT: {
            this.flattenInt(node, leftContent.asInt() >> rightContent.asInt());
            break;
          }

          case Skew.NodeKind.BITWISE_AND: {
            this.flattenInt(node, leftContent.asInt() & rightContent.asInt());
            break;
          }

          case Skew.NodeKind.BITWISE_OR: {
            this.flattenInt(node, leftContent.asInt() | rightContent.asInt());
            break;
          }

          case Skew.NodeKind.BITWISE_XOR: {
            this.flattenInt(node, leftContent.asInt() ^ rightContent.asInt());
            break;
          }

          case Skew.NodeKind.EQUAL: {
            this.flattenBool(node, leftContent.asInt() === rightContent.asInt());
            break;
          }

          case Skew.NodeKind.NOT_EQUAL: {
            this.flattenBool(node, leftContent.asInt() !== rightContent.asInt());
            break;
          }

          case Skew.NodeKind.LESS_THAN: {
            this.flattenBool(node, leftContent.asInt() < rightContent.asInt());
            break;
          }

          case Skew.NodeKind.GREATER_THAN: {
            this.flattenBool(node, leftContent.asInt() > rightContent.asInt());
            break;
          }

          case Skew.NodeKind.LESS_THAN_OR_EQUAL: {
            this.flattenBool(node, leftContent.asInt() <= rightContent.asInt());
            break;
          }

          case Skew.NodeKind.GREATER_THAN_OR_EQUAL: {
            this.flattenBool(node, leftContent.asInt() >= rightContent.asInt());
            break;
          }
        }

        return;
      }

      // Fold "double" values
      else if (leftKind === Skew.ContentKind.DOUBLE && rightKind === Skew.ContentKind.DOUBLE) {
        switch (kind) {
          case Skew.NodeKind.ADD: {
            this.flattenDouble(node, leftContent.asDouble() + rightContent.asDouble());
            break;
          }

          case Skew.NodeKind.SUBTRACT: {
            this.flattenDouble(node, leftContent.asDouble() - rightContent.asDouble());
            break;
          }

          case Skew.NodeKind.MULTIPLY: {
            this.flattenDouble(node, leftContent.asDouble() * rightContent.asDouble());
            break;
          }

          case Skew.NodeKind.DIVIDE: {
            this.flattenDouble(node, leftContent.asDouble() / rightContent.asDouble());
            break;
          }

          case Skew.NodeKind.EQUAL: {
            this.flattenBool(node, leftContent.asDouble() === rightContent.asDouble());
            break;
          }

          case Skew.NodeKind.NOT_EQUAL: {
            this.flattenBool(node, leftContent.asDouble() !== rightContent.asDouble());
            break;
          }

          case Skew.NodeKind.LESS_THAN: {
            this.flattenBool(node, leftContent.asDouble() < rightContent.asDouble());
            break;
          }

          case Skew.NodeKind.GREATER_THAN: {
            this.flattenBool(node, leftContent.asDouble() > rightContent.asDouble());
            break;
          }

          case Skew.NodeKind.LESS_THAN_OR_EQUAL: {
            this.flattenBool(node, leftContent.asDouble() <= rightContent.asDouble());
            break;
          }

          case Skew.NodeKind.GREATER_THAN_OR_EQUAL: {
            this.flattenBool(node, leftContent.asDouble() >= rightContent.asDouble());
            break;
          }
        }

        return;
      }
    }

    this.foldBinaryWithConstant(node, left, right);
  };

  Skew.Folding.ConstantFolder.prototype.foldHook = function(node) {
    var test = node.hookTest();

    if (test.isTrue()) {
      node.become(node.hookTrue().remove());
    }

    else if (test.isFalse()) {
      node.become(node.hookFalse().remove());
    }
  };

  // Returns the log2(value) or -1 if log2(value) is not an integer
  Skew.Folding.ConstantFolder.prototype.logBase2 = function(value) {
    if (value < 1 || (value & value - 1) !== 0) {
      return -1;
    }

    var result = 0;

    while (value > 1) {
      value >>= 1;
      ++result;
    }

    return result;
  };

  Skew.Folding.ConstantCache = function() {
    Skew.Folding.ConstantLookup.call(this);
    this.map = Object.create(null);
  };

  __extends(Skew.Folding.ConstantCache, Skew.Folding.ConstantLookup);

  Skew.Folding.ConstantCache.prototype.constantForSymbol = function(symbol) {
    if (symbol.id in this.map) {
      return this.map[symbol.id];
    }

    var constant = null;
    var value = symbol.value;

    if (symbol.isConst() && value !== null) {
      switch (value.kind) {
        case Skew.NodeKind.CONSTANT: {
          constant = value.content;
          break;
        }

        case Skew.NodeKind.NAME:
        case Skew.NodeKind.DOT: {
          var target = value.symbol;

          if (target !== null && Skew.SymbolKind.isVariable(target.kind)) {
            constant = this.constantForSymbol(target.asVariableSymbol());
          }
          break;
        }
      }
    }

    this.map[symbol.id] = constant;
    return constant;
  };

  Skew.VirtualLookup = function(global) {
    this.map = Object.create(null);
    this.visitObject(global);
  };

  Skew.VirtualLookup.prototype.isVirtual = function(symbol) {
    return in_IntMap.get(this.map, symbol.id, false);
  };

  Skew.VirtualLookup.prototype.visitObject = function(symbol) {
    for (var i = 0, list = symbol.objects, count = list.length; i < count; ++i) {
      var object = list[i];
      this.visitObject(object);
    }

    for (var i1 = 0, list1 = symbol.functions, count1 = list1.length; i1 < count1; ++i1) {
      var $function = list1[i1];
      this.visitFunction($function);
    }
  };

  Skew.VirtualLookup.prototype.visitFunction = function(symbol) {
    if (symbol.overridden !== null) {
      this.map[symbol.overridden.id] = true;
      this.map[symbol.id] = true;
    }
  };

  Skew.Inlining = {};

  Skew.Inlining.inlineSymbol = function(graph, info) {
    if (!info.shouldInline) {
      return;
    }

    // Inlining nested functions first is more efficient because it results in
    // fewer inlining operations. This won't enter an infinite loop because
    // inlining for all such functions has already been disabled.
    for (var i1 = 0, list = info.bodyCalls, count = list.length; i1 < count; ++i1) {
      var bodyCall = list[i1];
      Skew.Inlining.inlineSymbol(graph, bodyCall);
    }

    for (var i = 0, count2 = info.callSites.length; i < count2; ++i) {
      var callSite = info.callSites[i];

      if (callSite !== null) {
        var node = callSite.callNode;
        assert(node.children.length === (info.symbol.$arguments.length + 1 | 0));

        // Make sure each call site is inlined once by setting the call site to
        // null. The call site isn't removed from the list since we don't want
        // to mess up the indices of another call to inlineSymbol further up
        // the call stack.
        info.callSites[i] = null;

        // If there are unused arguments, drop those expressions entirely if
        // they don't have side effects:
        //
        //   def bar(a int, b int) int {
        //     return a
        //   }
        //
        //   def test int {
        //     return bar(0, foo(0)) + bar(1, 2)
        //   }
        //
        // This should compile to:
        //
        //   def test int {
        //     return bar(0, foo(0)) + 2
        //   }
        //
        if (!(info.unusedArguments.length === 0)) {
          var hasSideEffects = false;

          for (var i2 = 0, list1 = info.unusedArguments, count1 = list1.length; i2 < count1; ++i2) {
            var index = list1[i2];

            if (!node.children[index + 1 | 0].hasNoSideEffects()) {
              hasSideEffects = true;
              break;
            }
          }

          if (hasSideEffects) {
            continue;
          }
        }

        var clone = info.inlineValue.clone().withType(node.resolvedType);
        var values = node.removeChildren();
        var value = values.shift();
        assert(value.kind === Skew.NodeKind.NAME && value.symbol === info.symbol);
        node.become(clone);
        Skew.Inlining.recursivelySubstituteArguments(node, info.symbol.$arguments, values);

        // Remove the inlined result entirely if appropriate
        var parent = node.parent;

        if (parent !== null && parent.kind === Skew.NodeKind.EXPRESSION && node.hasNoSideEffects()) {
          parent.remove();
        }
      }
    }
  };

  Skew.Inlining.recursivelySubstituteArguments = function(node, $arguments, values) {
    // Substitute the argument if this is an argument name
    var symbol = node.symbol;

    if (symbol !== null && Skew.SymbolKind.isVariable(symbol.kind)) {
      var index = $arguments.indexOf(symbol.asVariableSymbol());

      if (index !== -1) {
        node.replaceWith(values[index]);
        return;
      }
    }

    // Otherwise, recursively search for substitutions in all child nodes
    var children = node.children;

    if (children !== null) {
      for (var i = 0, list = children, count = list.length; i < count; ++i) {
        var child = list[i];

        if (child !== null) {
          Skew.Inlining.recursivelySubstituteArguments(child, $arguments, values);
        }
      }
    }
  };

  Skew.Inlining.InliningInfo = function(symbol, inlineValue, callSites, unusedArguments) {
    this.symbol = symbol;
    this.inlineValue = inlineValue;
    this.callSites = callSites;
    this.unusedArguments = unusedArguments;
    this.shouldInline = true;
    this.bodyCalls = [];
  };

  // Each node in the inlining graph is a symbol of an inlineable function and
  // each directional edge is from a first function to a second function that is
  // called directly within the body of the first function. Indirect function
  // calls that may become direct calls through inlining can be discovered by
  // traversing edges of this graph.
  Skew.Inlining.InliningGraph = function(graph) {
    this.inliningInfo = [];
    this.symbolToInfoIndex = Object.create(null);

    // Create the nodes in the graph
    for (var i = 0, list = graph.callInfo, count = list.length; i < count; ++i) {
      var callInfo = list[i];
      var info = Skew.Inlining.InliningGraph.createInliningInfo(callInfo);

      if (info !== null) {
        this.symbolToInfoIndex[info.symbol.id] = this.inliningInfo.length;
        this.inliningInfo.push(info);
      }
    }

    // Create the edges in the graph
    for (var i2 = 0, list2 = this.inliningInfo, count2 = list2.length; i2 < count2; ++i2) {
      var info1 = list2[i2];

      for (var i1 = 0, list1 = graph.callInfo[graph.symbolToInfoIndex[info1.symbol.id]].callSites, count1 = list1.length; i1 < count1; ++i1) {
        var callSite = list1[i1];
        var $function = callSite.enclosingFunction;

        if ($function !== null && $function.kind === Skew.SymbolKind.FUNCTION_GLOBAL) {
          var index = in_IntMap.get(this.symbolToInfoIndex, $function.id, -1);

          if (index !== -1) {
            this.inliningInfo[index].bodyCalls.push(info1);
          }
        }
      }
    }

    // Detect and disable infinitely expanding inline operations
    for (var i3 = 0, list3 = this.inliningInfo, count3 = list3.length; i3 < count3; ++i3) {
      var info2 = list3[i3];
      info2.shouldInline = !Skew.Inlining.InliningGraph.containsInfiniteExpansion(info2, []);
    }
  };

  Skew.Inlining.InliningGraph.containsInfiniteExpansion = function(info, symbols) {
    // This shouldn't get very long in normal programs so O(n) here is fine
    if (symbols.indexOf(info.symbol) !== -1) {
      return true;
    }

    // Do a depth-first search on the graph and check for cycles
    symbols.push(info.symbol);

    for (var i = 0, list = info.bodyCalls, count = list.length; i < count; ++i) {
      var bodyCall = list[i];

      if (Skew.Inlining.InliningGraph.containsInfiniteExpansion(bodyCall, symbols)) {
        return true;
      }
    }

    symbols.pop();
    return false;
  };

  Skew.Inlining.InliningGraph.createInliningInfo = function(info) {
    var symbol = info.symbol;

    // Inline functions consisting of a single return statement
    if (symbol.kind === Skew.SymbolKind.FUNCTION_GLOBAL) {
      var block = symbol.block;

      if (block === null) {
        return null;
      }

      // Replace functions with empty bodies with null
      if (!block.hasChildren()) {
        var unusedArguments = [];

        for (var i = 0, count1 = symbol.$arguments.length; i < count1; ++i) {
          unusedArguments.push(i);
        }

        return new Skew.Inlining.InliningInfo(symbol, new Skew.Node(Skew.NodeKind.NULL), info.callSites, unusedArguments);
      }

      var first = block.children[0];
      var inlineValue = null;

      // If the first value in the function is a return statement, then the
      // function body doesn't need to only have one statement. Subsequent
      // statements are just dead code and will never be executed anyway.
      if (first.kind === Skew.NodeKind.RETURN) {
        inlineValue = first.returnValue();
      }

      // Otherwise, this statement must be a lone expression statement
      else if (first.kind === Skew.NodeKind.EXPRESSION && block.children.length === 1) {
        inlineValue = first.expressionValue();
      }

      if (inlineValue !== null) {
        // Count the number of times each symbol is observed. Argument
        // variables that are used more than once may need a let statement
        // to avoid changing the semantics of the call site. For now, just
        // only inline functions where each argument is used exactly once.
        var argumentCounts = Object.create(null);

        for (var i1 = 0, list = symbol.$arguments, count2 = list.length; i1 < count2; ++i1) {
          var argument = list[i1];
          argumentCounts[argument.id] = 0;
        }

        if (Skew.Inlining.InliningGraph.recursivelyCountArgumentUses(inlineValue, argumentCounts)) {
          var unusedArguments1 = [];
          var isSimpleSubstitution = true;

          for (var i2 = 0, count3 = symbol.$arguments.length; i2 < count3; ++i2) {
            var count = argumentCounts[symbol.$arguments[i2].id];

            if (count === 0) {
              unusedArguments1.push(i2);
            }

            else if (count !== 1) {
              isSimpleSubstitution = false;
              break;
            }
          }

          if (isSimpleSubstitution) {
            return new Skew.Inlining.InliningInfo(symbol, inlineValue, info.callSites, unusedArguments1);
          }
        }
      }
    }

    return null;
  };

  // This returns false if inlining is impossible
  Skew.Inlining.InliningGraph.recursivelyCountArgumentUses = function(node, argumentCounts) {
    // Prevent inlining of lambda expressions. They have their own function
    // symbols that reference the original block and won't work with cloning.
    // Plus inlining lambdas leads to code bloat.
    if (node.kind === Skew.NodeKind.LAMBDA) {
      return false;
    }

    // Inlining is impossible at this node if it's impossible for any child node
    var children = node.children;

    if (children !== null) {
      for (var i = 0, list = children, count1 = list.length; i < count1; ++i) {
        var child = list[i];

        if (child !== null && !Skew.Inlining.InliningGraph.recursivelyCountArgumentUses(child, argumentCounts)) {
          return false;
        }
      }
    }

    var symbol = node.symbol;

    if (symbol !== null) {
      var count = in_IntMap.get(argumentCounts, symbol.id, -1);

      if (count !== -1) {
        argumentCounts[symbol.id] = count + 1 | 0;

        // Prevent inlining of functions that modify their arguments locally. For
        // example, inlining this would lead to incorrect code:
        //
        //   def foo(x int, y int) {
        //     x += y
        //   }
        //
        //   def test {
        //     foo(1, 2)
        //   }
        //
        if (node.isAssignTarget()) {
          return false;
        }
      }
    }

    return true;
  };

  Skew.Merging = {};

  Skew.Merging.mergeObject = function(log, parent, target, symbol) {
    target.scope = new Skew.ObjectScope(parent !== null ? parent.scope : null, target);
    symbol.scope = target.scope;
    symbol.parent = parent;

    if (symbol.parameters !== null) {
      for (var i = 0, list = symbol.parameters, count = list.length; i < count; ++i) {
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

    Skew.Merging.mergeObjects(log, target, symbol.objects);
    Skew.Merging.mergeFunctions(log, target, symbol.functions);
    Skew.Merging.mergeVariables(log, target, symbol.variables);
  };

  Skew.Merging.mergeObjects = function(log, parent, children) {
    var members = parent.members;
    in_List.removeIf(children, function(child) {
      var other = in_StringMap.get(members, child.name, null);

      // Simple case: no merging
      if (other === null) {
        members[child.name] = child;
        Skew.Merging.mergeObject(log, parent, child, child);
        return false;
      }

      // Can only merge with another of the same kind or with a namespace
      if (other.kind === Skew.SymbolKind.OBJECT_NAMESPACE) {
        other.kind = child.kind;
      }

      else if (child.kind !== Skew.SymbolKind.OBJECT_NAMESPACE && child.kind !== other.kind) {
        log.semanticErrorDuplicateSymbol(child.range, child.name, other.range);
        return true;
      }

      // Classes can only have one base type
      var object = other.asObjectSymbol();

      if (child.base !== null && object.base !== null) {
        log.semanticErrorDuplicateBaseType(child.base.range, child.name, object.base.range);
        return true;
      }

      if (child.base !== null) {
        object.base = child.base;
      }

      // Cannot merge two objects that both have type parameters
      if (child.parameters !== null && object.parameters !== null) {
        log.semanticErrorDuplicateTypeParameters(Skew.Merging.rangeOfParameters(child.parameters), child.name, Skew.Merging.rangeOfParameters(object.parameters));
        return true;
      }

      // Merge "child" into "other"
      Skew.Merging.mergeObject(log, parent, object, child);
      object.mergeAnnotationsAndCommentsFrom(child);
      in_List.append1(object.objects, child.objects);
      in_List.append1(object.functions, child.functions);
      in_List.append1(object.variables, child.variables);

      if (child.parameters !== null) {
        object.parameters = child.parameters;
      }

      for (var i = 0, list = child.guards, count = list.length; i < count; ++i) {
        var guard = list[i];
        guard.parent = object;
        object.guards.push(guard);
      }

      return true;
    });
  };

  Skew.Merging.mergeFunctions = function(log, parent, children) {
    var members = parent.members;

    for (var i1 = 0, list1 = children, count1 = list1.length; i1 < count1; ++i1) {
      var child = list1[i1];
      var other = in_StringMap.get(members, child.name, null);
      var scope = new Skew.FunctionScope(parent.scope, child);
      child.scope = scope;
      child.parent = parent;

      if (child.parameters !== null) {
        for (var i = 0, list = child.parameters, count = list.length; i < count; ++i) {
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

      var childKind = Skew.Merging.overloadedKind(child.kind);
      var otherKind = Skew.Merging.overloadedKind(other.kind);

      // Merge with another symbol of the same overloaded group type
      if (childKind !== otherKind || !Skew.SymbolKind.isOverloadedFunction(childKind)) {
        log.semanticErrorDuplicateSymbol(child.range, child.name, other.range);
        continue;
      }

      // Merge with a group of overloaded functions
      if (Skew.SymbolKind.isOverloadedFunction(other.kind)) {
        other.asOverloadedFunctionSymbol().symbols.push(child);
        child.overloaded = other.asOverloadedFunctionSymbol();
        continue;
      }

      // Create an overload group
      var overloaded = new Skew.OverloadedFunctionSymbol(childKind, child.name, [other.asFunctionSymbol(), child]);
      members[child.name] = overloaded;
      other.asFunctionSymbol().overloaded = overloaded;
      child.overloaded = overloaded;
      overloaded.scope = parent.scope;
      overloaded.parent = parent;
    }
  };

  Skew.Merging.overloadedKind = function(kind) {
    return kind === Skew.SymbolKind.FUNCTION_CONSTRUCTOR || kind === Skew.SymbolKind.FUNCTION_GLOBAL ? Skew.SymbolKind.OVERLOADED_GLOBAL : kind === Skew.SymbolKind.FUNCTION_ANNOTATION ? Skew.SymbolKind.OVERLOADED_ANNOTATION : kind === Skew.SymbolKind.FUNCTION_INSTANCE ? Skew.SymbolKind.OVERLOADED_INSTANCE : kind;
  };

  Skew.Merging.mergeVariables = function(log, parent, children) {
    var members = parent.members;

    for (var i = 0, list = children, count = list.length; i < count; ++i) {
      var child = list[i];
      var other = in_StringMap.get(members, child.name, null);
      child.scope = new Skew.VariableScope(parent.scope, child);
      child.parent = parent;

      // Variables never merge
      if (other !== null) {
        log.semanticErrorDuplicateSymbol(child.range, child.name, other.range);
        continue;
      }

      members[child.name] = child;
    }
  };

  Skew.Merging.rangeOfParameters = function(parameters) {
    return Skew.Range.span(parameters[0].range, in_List.last(parameters).range);
  };

  Skew.Motion = {};

  Skew.Motion.functionMotion = function(symbol, options, namespaces) {
    for (var i = 0, list = symbol.objects, count = list.length; i < count; ++i) {
      var object = list[i];
      Skew.Motion.functionMotion(object, options, namespaces);
    }

    // Move global functions with implementations off imported objects
    in_List.removeIf(symbol.functions, function($function) {
      if ($function.kind === Skew.SymbolKind.FUNCTION_GLOBAL && symbol.isImported() && !$function.isImported()) {
        Skew.Motion.moveSymbolIntoNewNamespace($function, namespaces).functions.push($function);
        return true;
      }

      return false;
    });

    // Move stuff off of enums for C#
    if (options.target === Skew.CompilerTarget.CSHARP && symbol.kind === Skew.SymbolKind.OBJECT_ENUM) {
      symbol.objects.forEach(function(object) {
        Skew.Motion.moveSymbolIntoNewNamespace(object, namespaces).objects.push(object);
      });
      symbol.functions.forEach(function($function) {
        Skew.Motion.moveSymbolIntoNewNamespace($function, namespaces).functions.push($function);
      });
      in_List.removeIf(symbol.variables, function(variable) {
        if (variable.kind !== Skew.SymbolKind.VARIABLE_ENUM) {
          Skew.Motion.moveSymbolIntoNewNamespace(variable, namespaces).variables.push(variable);
          return true;
        }

        return false;
      });
      symbol.objects = [];
      symbol.functions = [];
    }
  };

  Skew.Motion.moveSymbolIntoNewNamespace = function(symbol, namespaces) {
    var parent = symbol.parent;
    var target = in_IntMap.get(namespaces, parent.id, null);
    var object = target !== null ? target.child.asObjectSymbol() : null;

    // Create a parallel namespace next to the parent
    if (target === null) {
      var common = parent.parent.asObjectSymbol();
      object = new Skew.ObjectSymbol(Skew.SymbolKind.OBJECT_NAMESPACE, "in_" + parent.name);
      object.scope = new Skew.ObjectScope(common.scope, object);
      object.parent = common;
      target = new Skew.Motion.Namespace(common, object);
      namespaces[parent.id] = target;
    }

    // Inflate functions with type parameters from the parent (TODO: Need to inflate call sites too)
    if (Skew.SymbolKind.isFunction(symbol.kind) && parent.asObjectSymbol().parameters !== null) {
      var $function = symbol.asFunctionSymbol();

      if ($function.parameters === null) {
        $function.parameters = [];
      }

      in_List.prepend1($function.parameters, parent.asObjectSymbol().parameters);
    }

    // Move this function into that parallel namespace
    symbol.parent = object;
    return object;
  };

  Skew.Motion.Namespace = function(parent, child) {
    this.parent = parent;
    this.child = child;
  };

  Skew.Renaming = {};

  Skew.Renaming.renameObject = function(symbol) {
    for (var i = 0, list = symbol.objects, count1 = list.length; i < count1; ++i) {
      var object = list[i];
      Skew.Renaming.renameObject(object);
    }

    for (var i1 = 0, list1 = symbol.functions, count2 = list1.length; i1 < count2; ++i1) {
      var $function = list1[i1];

      if (!$function.isImportedOrExported() && $function.overridden === null) {
        var scope = $function.scope.parent;
        var count = $function.$arguments.length;

        if ((count === 0 || count === 1 && $function.kind === Skew.SymbolKind.FUNCTION_GLOBAL) && $function.name in Skew.Renaming.unaryPrefixes) {
          $function.name = scope.generateName(Skew.Renaming.unaryPrefixes[$function.name]);
        }

        else if ($function.name in Skew.Renaming.prefixes) {
          $function.name = scope.generateName(Skew.Renaming.prefixes[$function.name]);
        }

        else if ($function.name !== "" && $function.name.charCodeAt(0) === 64) {
          $function.name = scope.generateName($function.name.slice(1));
        }

        else if (Skew.Renaming.isInvalidIdentifier($function.name)) {
          $function.name = scope.generateName("_");
        }

        else if ($function.overloaded !== null && $function.overloaded.symbols.length > 1) {
          $function.name = scope.generateName($function.name);
        }
      }
    }
  };

  Skew.Renaming.useOverriddenNames = function(symbol) {
    for (var i = 0, list = symbol.objects, count = list.length; i < count; ++i) {
      var object = list[i];
      Skew.Renaming.useOverriddenNames(object);
    }

    for (var i1 = 0, list1 = symbol.functions, count1 = list1.length; i1 < count1; ++i1) {
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

  Skew.Renaming.isAlpha = function(c) {
    return c >= 97 && c <= 122 || c >= 65 && c <= 90 || c === 95;
  };

  Skew.Renaming.isNumber = function(c) {
    return c >= 48 && c <= 57;
  };

  Skew.Renaming.isInvalidIdentifier = function(name) {
    for (var i = 0, count = name.length; i < count; ++i) {
      var c = name.charCodeAt(i);

      if (!Skew.Renaming.isAlpha(c) && (i === 0 || !Skew.Renaming.isNumber(c))) {
        return true;
      }
    }

    return false;
  };

  Skew.Resolving = {};

  Skew.Resolving.ConversionKind = {
    IMPLICIT: 0,
    EXPLICIT: 1
  };

  Skew.Resolving.SymbolStatistic = {
    READ: 0,
    WRITE: 1
  };

  Skew.Resolving.LocalVariableStatistics = function(symbol) {
    this.symbol = symbol;
    this.readCount = 0;
    this.writeCount = 0;
  };

  Skew.Resolving.Resolver = function(global, options, defines, cache, log) {
    this.global = global;
    this.options = options;
    this.defines = defines;
    this.cache = cache;
    this.log = log;
    this.foreachLoops = [];
    this.localVariableStatistics = Object.create(null);
    this.constantFolder = null;
    this.isMergingGuards = true;
  };

  Skew.Resolving.Resolver.prototype.initializeSymbol = function(symbol) {
    // The scope should have been set by the merging pass (or by this pass for local variables)
    assert(symbol.scope !== null);

    // Only initialize the symbol once
    if (symbol.state === Skew.SymbolState.UNINITIALIZED) {
      symbol.state = Skew.SymbolState.INITIALIZING;

      switch (symbol.kind) {
        case Skew.SymbolKind.OBJECT_CLASS:
        case Skew.SymbolKind.OBJECT_ENUM:
        case Skew.SymbolKind.OBJECT_GLOBAL:
        case Skew.SymbolKind.OBJECT_INTERFACE:
        case Skew.SymbolKind.OBJECT_NAMESPACE: {
          this.initializeObject(symbol.asObjectSymbol());
          break;
        }

        case Skew.SymbolKind.FUNCTION_ANNOTATION:
        case Skew.SymbolKind.FUNCTION_CONSTRUCTOR:
        case Skew.SymbolKind.FUNCTION_GLOBAL:
        case Skew.SymbolKind.FUNCTION_INSTANCE:
        case Skew.SymbolKind.FUNCTION_LOCAL: {
          this.initializeFunction(symbol.asFunctionSymbol());
          break;
        }

        case Skew.SymbolKind.VARIABLE_ENUM:
        case Skew.SymbolKind.VARIABLE_GLOBAL:
        case Skew.SymbolKind.VARIABLE_INSTANCE:
        case Skew.SymbolKind.VARIABLE_LOCAL: {
          this.initializeVariable(symbol.asVariableSymbol());
          break;
        }

        case Skew.SymbolKind.PARAMETER_FUNCTION:
        case Skew.SymbolKind.PARAMETER_OBJECT: {
          this.initializeParameter(symbol.asParameterSymbol());
          break;
        }

        case Skew.SymbolKind.OVERLOADED_ANNOTATION:
        case Skew.SymbolKind.OVERLOADED_GLOBAL:
        case Skew.SymbolKind.OVERLOADED_INSTANCE: {
          this.initializeOverloadedFunction(symbol.asOverloadedFunctionSymbol());
          break;
        }

        default: {
          assert(false);
          break;
        }
      }

      assert(symbol.resolvedType !== null);
      symbol.state = Skew.SymbolState.INITIALIZED;

      if (Skew.SymbolKind.isFunction(symbol.kind)) {
        var $function = symbol.asFunctionSymbol();
        var overloaded = $function.overloaded;

        // After initializing a function symbol, ensure the entire overload set is initialized
        if (overloaded !== null && overloaded.state === Skew.SymbolState.UNINITIALIZED) {
          this.initializeSymbol(overloaded);
        }

        if (symbol.isEntryPoint()) {
          this.validateEntryPoint($function);
        }
      }
    }

    // Detect cyclic symbol references such as "foo foo;"
    else if (symbol.state === Skew.SymbolState.INITIALIZING) {
      this.log.semanticErrorCyclicDeclaration(symbol.range, symbol.name);
      symbol.resolvedType = Skew.Type.DYNAMIC;
    }
  };

  Skew.Resolving.Resolver.prototype.validateEntryPoint = function(symbol) {
    // Detect duplicate entry points
    if (this.cache.entryPointSymbol !== null) {
      this.log.semanticErrorDuplicateEntryPoint(symbol.range, this.cache.entryPointSymbol.range);
      return;
    }

    this.cache.entryPointSymbol = symbol;

    // Only recognize a few entry point types
    var type = symbol.resolvedType;

    if (type !== Skew.Type.DYNAMIC) {
      var argumentTypes = type.argumentTypes;

      // The argument list must be empty or one argument of type "List<string>"
      if (argumentTypes.length > 1 || argumentTypes.length === 1 && argumentTypes[0] !== this.cache.createListType(this.cache.stringType)) {
        this.log.semanticErrorInvalidEntryPointArguments(Skew.Range.span(symbol.$arguments[0].range, in_List.last(symbol.$arguments).type.range), symbol.name);
      }

      // The return type must be nothing or "int"
      else if (type.returnType !== null && type.returnType !== this.cache.intType) {
        this.log.semanticErrorInvalidEntryPointReturnType(symbol.returnType.range, symbol.name);
      }
    }
  };

  Skew.Resolving.Resolver.prototype.resolveDefines = function(symbol) {
    var key = symbol.fullName();
    var define = in_StringMap.get(this.defines, key, null);

    if (define === null) {
      return;
    }

    // Remove the define so we can tell what defines weren't used later on
    delete(this.defines[key]);
    var type = symbol.resolvedType;
    var range = define.value;
    var value = range.toString();
    var node = null;

    // Special-case booleans
    if (type === this.cache.boolType) {
      if (value === "true" || value === "false") {
        node = new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.BoolContent(value === "true"));
      }
    }

    // Special-case doubles
    else if (type === this.cache.doubleType) {
      var number = +value;

      if (!isNaN(number)) {
        node = new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.DoubleContent(number));
      }
    }

    // Special-case strings
    else if (type === this.cache.stringType) {
      node = new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.StringContent(value));
    }

    // Special-case enums
    else if (type.isEnum()) {
      node = new Skew.Node(Skew.NodeKind.DOT).withContent(new Skew.StringContent(value)).withChildren([null]);
    }

    // Integers can also apply to doubles
    if (node === null && this.cache.isNumeric(type)) {
      var box = Skew.Parsing.parseIntLiteral(value);

      if (box !== null) {
        node = new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.IntContent(box.value));
      }
    }

    // Stop if anything failed above
    if (node === null) {
      this.log.semanticErrorInvalidDefine1(range, value, type, key);
      return;
    }

    this.resolveAsParameterizedExpressionWithConversion(node.withRange(range), this.global.scope, type);
    symbol.value = node;
  };

  Skew.Resolving.Resolver.prototype.resolveAnnotations = function(symbol) {
    var self = this;
    var parent = symbol.parent;
    var annotations = symbol.annotations;

    // The import/export annotations are inherited, except import isn't inherited for implemented functions
    if (parent !== null && (Skew.SymbolKind.isVariable(symbol.kind) || Skew.SymbolKind.isFunction(symbol.kind))) {
      symbol.flags |= parent.flags & (Skew.SymbolKind.isFunction(symbol.kind) && symbol.asFunctionSymbol().block !== null ? Skew.Symbol.IS_EXPORTED : Skew.Symbol.IS_IMPORTED | Skew.Symbol.IS_EXPORTED);
    }

    // Resolve annotations on this symbol after annotation inheritance
    if (annotations !== null) {
      in_List.removeIf(annotations, function(annotation) {
        return !self.resolveAnnotation(annotation, symbol);
      });
    }
  };

  Skew.Resolving.Resolver.prototype.resolveParameters = function(parameters) {
    if (parameters !== null) {
      for (var i = 0, list = parameters, count = list.length; i < count; ++i) {
        var parameter = list[i];
        this.resolveParameter(parameter);
      }
    }
  };

  Skew.Resolving.Resolver.prototype.initializeParameter = function(symbol) {
    if (symbol.resolvedType === null) {
      symbol.resolvedType = new Skew.Type(Skew.TypeKind.SYMBOL, symbol);
    }

    this.resolveAnnotations(symbol);
  };

  Skew.Resolving.Resolver.prototype.resolveParameter = function(symbol) {
    this.initializeSymbol(symbol);
  };

  Skew.Resolving.Resolver.prototype.initializeObject = function(symbol) {
    if (symbol.resolvedType === null) {
      symbol.resolvedType = new Skew.Type(Skew.TypeKind.SYMBOL, symbol);
    }

    this.resolveParameters(symbol.parameters);
    this.forbidOverriddenSymbol(symbol);

    // Resolve the base type (only for classes)
    if (symbol.base !== null) {
      this.resolveAsParameterizedType(symbol.base, symbol.scope);
      var baseType = symbol.base.resolvedType;

      if (baseType.kind === Skew.TypeKind.SYMBOL && baseType.symbol.kind === Skew.SymbolKind.OBJECT_CLASS && !baseType.symbol.isValueType()) {
        symbol.baseClass = baseType.symbol.asObjectSymbol();

        // Don't lose the type parameters from the base type
        symbol.resolvedType.environment = baseType.environment;
      }

      else if (baseType !== Skew.Type.DYNAMIC) {
        this.log.semanticErrorInvalidBaseType(symbol.base.range, baseType);
      }
    }

    // Assign values for all enums before they are initialized
    if (symbol.kind === Skew.SymbolKind.OBJECT_ENUM) {
      var nextEnumValue = 0;

      for (var i = 0, list = symbol.variables, count = list.length; i < count; ++i) {
        var variable = list[i];

        if (variable.kind === Skew.SymbolKind.VARIABLE_ENUM) {
          variable.value = new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.IntContent(nextEnumValue)).withType(symbol.resolvedType).withRange(variable.range);
          ++nextEnumValue;
        }
      }
    }

    this.resolveAnnotations(symbol);

    // Create a default constructor if one doesn't exist
    var $constructor = in_StringMap.get(symbol.members, "new", null);

    if (symbol.kind === Skew.SymbolKind.OBJECT_CLASS && !symbol.isImported() && $constructor === null) {
      var baseConstructor = symbol.baseClass !== null ? in_StringMap.get(symbol.baseClass.members, "new", null) : null;

      // Unwrap the overload group if present
      if (baseConstructor !== null && baseConstructor.kind === Skew.SymbolKind.OVERLOADED_GLOBAL) {
        var overloaded = baseConstructor.asOverloadedFunctionSymbol();

        for (var i1 = 0, list1 = overloaded.symbols, count1 = list1.length; i1 < count1; ++i1) {
          var overload = list1[i1];

          if (overload.kind === Skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
            if (baseConstructor.kind === Skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
              // Signal that there isn't a single base constructor
              baseConstructor = null;
              break;
            }

            baseConstructor = overload;
          }
        }
      }

      // A default constructor can only be created if the base class has a single constructor
      if (symbol.baseClass === null || baseConstructor !== null && baseConstructor.kind === Skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
        var generated = new Skew.FunctionSymbol(Skew.SymbolKind.FUNCTION_CONSTRUCTOR, "new");
        generated.scope = new Skew.FunctionScope(symbol.scope, generated);
        generated.flags |= Skew.Symbol.IS_AUTOMATICALLY_GENERATED;
        generated.parent = symbol;
        generated.range = symbol.range;
        generated.overridden = baseConstructor !== null ? baseConstructor.asFunctionSymbol() : null;
        symbol.functions.push(generated);
        symbol.members[generated.name] = generated;
      }
    }

    // Create a default toString if one doesn't exist
    if (symbol.kind === Skew.SymbolKind.OBJECT_ENUM && !symbol.isImported() && !("toString" in symbol.members)) {
      var generated1 = new Skew.FunctionSymbol(Skew.SymbolKind.FUNCTION_INSTANCE, "toString");
      generated1.scope = new Skew.FunctionScope(symbol.scope, generated1);
      generated1.flags |= Skew.Symbol.IS_AUTOMATICALLY_GENERATED;
      generated1.parent = symbol;
      generated1.range = symbol.range;
      symbol.functions.push(generated1);
      symbol.members[generated1.name] = generated1;
    }
  };

  Skew.Resolving.Resolver.prototype.initializeGlobals = function() {
    this.initializeSymbol(this.cache.boolType.symbol);
    this.initializeSymbol(this.cache.doubleType.symbol);
    this.initializeSymbol(this.cache.intMapType.symbol);
    this.initializeSymbol(this.cache.intType.symbol);
    this.initializeSymbol(this.cache.listType.symbol);
    this.initializeSymbol(this.cache.stringMapType.symbol);
    this.initializeSymbol(this.cache.stringType.symbol);
  };

  Skew.Resolving.Resolver.prototype.resolveGlobal = function() {
    this.resolveObject(this.global);
    this.convertForeachLoops();
    this.scanLocalVariables();
    this.discardUnusedDefines();
  };

  Skew.Resolving.Resolver.prototype.removeObsoleteFunctions = function(symbol) {
    for (var i = 0, list = symbol.objects, count = list.length; i < count; ++i) {
      var object = list[i];
      this.removeObsoleteFunctions(object);
    }

    in_List.removeIf(symbol.functions, function($function) {
      return $function.isObsolete();
    });
  };

  Skew.Resolving.Resolver.prototype.iterativelyMergeGuards = function() {
    var guards;

    // Iterate until a fixed point is reached
    while (true) {
      guards = [];
      this.scanForGuards(this.global, guards);

      if (guards.length === 0) {
        break;
      }

      // Each iteration must remove at least one guard to continue
      if (!this.processGuards(guards)) {
        break;
      }
    }

    this.isMergingGuards = false;

    // All remaining guards are errors
    for (var i = 0, list = guards, count1 = list.length; i < count1; ++i) {
      var guard = list[i];
      var count = this.log.errorCount;
      this.resolveAsParameterizedExpressionWithConversion(guard.test, guard.parent.scope, this.cache.boolType);

      if (this.log.errorCount === count) {
        this.log.semanticErrorExpectedConstant(guard.test.range);
      }
    }
  };

  Skew.Resolving.Resolver.prototype.scanForGuards = function(symbol, guards) {
    in_List.append1(guards, symbol.guards);

    for (var i = 0, list = symbol.objects, count = list.length; i < count; ++i) {
      var object = list[i];
      this.scanForGuards(object, guards);
    }
  };

  Skew.Resolving.Resolver.prototype.reportGuardMergingFailure = function(node) {
    if (this.isMergingGuards) {
      while (node !== null) {
        node.resolvedType = null;
        node = node.parent;
      }

      throw new Skew.Resolving.Resolver.GuardMergingFailure();
    }
  };

  Skew.Resolving.Resolver.prototype.attemptToResolveGuardConstant = function(node, scope) {
    assert(scope !== null);

    try {
      this.resolveAsParameterizedExpressionWithConversion(node, scope, this.cache.boolType);
      this.constantFolder.foldConstants(node);
      return true;
    }

    catch (failure) {
      if (!(failure instanceof Skew.Resolving.Resolver.GuardMergingFailure)) {
        throw failure;
      }
    }

    return false;
  };

  Skew.Resolving.Resolver.prototype.processGuards = function(guards) {
    var wasGuardRemoved = false;

    for (var i = 0, list = guards, count = list.length; i < count; ++i) {
      var guard = list[i];
      var test = guard.test;
      var parent = guard.parent;

      // If it's not a constant, we'll just try again in the next iteration
      if (!this.attemptToResolveGuardConstant(test, parent.scope)) {
        continue;
      }

      if (test.isBool()) {
        in_List.removeOne(parent.guards, guard);
        wasGuardRemoved = true;

        if (test.isTrue()) {
          this.mergeGuardIntoObject(guard, parent);
        }

        else {
          var elseGuard = guard.elseGuard;

          if (elseGuard !== null) {
            if (elseGuard.test !== null) {
              elseGuard.parent = parent;
              parent.guards.push(elseGuard);
            }

            else {
              this.mergeGuardIntoObject(elseGuard, parent);
            }
          }
        }
      }
    }

    return wasGuardRemoved;
  };

  Skew.Resolving.Resolver.prototype.mergeGuardIntoObject = function(guard, object) {
    var symbol = guard.contents;
    Skew.Merging.mergeObjects(this.log, object, symbol.objects);
    Skew.Merging.mergeFunctions(this.log, object, symbol.functions);
    Skew.Merging.mergeVariables(this.log, object, symbol.variables);
    in_List.append1(object.objects, symbol.objects);
    in_List.append1(object.functions, symbol.functions);
    in_List.append1(object.variables, symbol.variables);

    // Handle nested guard clauses like this:
    //
    //   if true {
    //     if true {
    //       var foo = 0
    //     }
    //   }
    //
    for (var i = 0, list = symbol.guards, count = list.length; i < count; ++i) {
      var nested = list[i];
      nested.parent = object;
      object.guards.push(nested);
    }
  };

  // Foreach loops are converted to for loops after everything is resolved
  // because that process needs to generate symbol names and it's much easier
  // to generate non-conflicting symbol names after all local variables have
  // been defined.
  Skew.Resolving.Resolver.prototype.convertForeachLoops = function() {
    for (var i = 0, list1 = this.foreachLoops, count1 = list1.length; i < count1; ++i) {
      var node = list1[i];
      var symbol = node.symbol.asVariableSymbol();

      // Generate names at the function level to avoid conflicts with local scopes
      var scope = symbol.scope.findEnclosingFunctionOrLambda();
      var value = node.foreachValue();
      var block = node.foreachBlock();

      // Handle "for i in 0..10"
      if (value.kind === Skew.NodeKind.PAIR) {
        var first = value.firstValue().replaceWithNull();
        var second = value.secondValue().replaceWithNull();
        var setup = [Skew.Node.createVar(symbol)];
        var symbolName = new Skew.Node(Skew.NodeKind.NAME).withContent(new Skew.StringContent(symbol.name)).withSymbol(symbol).withType(this.cache.intType);
        var update = Skew.Node.createUnary(Skew.NodeKind.INCREMENT, symbolName);
        var test;

        // Special-case constant iteration limits to generate simpler code
        if (second.kind === Skew.NodeKind.CONSTANT || second.kind === Skew.NodeKind.NAME && second.symbol !== null && second.symbol.isConst()) {
          test = Skew.Node.createBinary(Skew.NodeKind.LESS_THAN, symbolName.clone(), second);
        }

        // Otherwise, save the iteration limit in case it changes during iteration
        else {
          var count = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_LOCAL, scope.generateName("count"));
          count.resolvedType = this.cache.intType;
          count.value = second;
          count.state = Skew.SymbolState.INITIALIZED;
          setup.push(Skew.Node.createVar(count));
          test = Skew.Node.createBinary(Skew.NodeKind.LESS_THAN, symbolName.clone(), new Skew.Node(Skew.NodeKind.NAME).withContent(new Skew.StringContent(count.name)).withSymbol(count).withType(this.cache.intType));
        }

        // Use a C-style for loop to implement this foreach loop
        symbol.flags &= ~Skew.Symbol.IS_CONST;
        symbol.value = first;
        node.become(Skew.Node.createFor(setup, test, update, block.replaceWithNull()).withComments(node.comments));

        // Make sure the new expressions are resolved
        this.resolveNode(test, symbol.scope, null);
        this.resolveNode(update, symbol.scope, null);
      }

      else if (this.cache.isList(value.resolvedType) && this.options.target !== Skew.CompilerTarget.CSHARP) {
        // Create the index variable
        var index = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_LOCAL, scope.generateName("i"));
        index.resolvedType = this.cache.intType;
        index.value = new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.IntContent(0)).withType(this.cache.intType);
        index.state = Skew.SymbolState.INITIALIZED;
        var indexName = new Skew.Node(Skew.NodeKind.NAME).withContent(new Skew.StringContent(index.name)).withSymbol(index).withType(index.resolvedType);

        // Create the list variable
        var list = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_LOCAL, scope.generateName("list"));
        list.resolvedType = value.resolvedType;
        list.value = value.replaceWithNull();
        list.state = Skew.SymbolState.INITIALIZED;
        var listName = new Skew.Node(Skew.NodeKind.NAME).withContent(new Skew.StringContent(list.name)).withSymbol(list).withType(list.resolvedType);

        // Create the count variable
        var count2 = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_LOCAL, scope.generateName("count"));
        count2.resolvedType = this.cache.intType;
        count2.value = new Skew.Node(Skew.NodeKind.DOT).withContent(new Skew.StringContent("count")).withChildren([listName]);
        count2.state = Skew.SymbolState.INITIALIZED;
        var countName = new Skew.Node(Skew.NodeKind.NAME).withContent(new Skew.StringContent(count2.name)).withSymbol(count2).withType(count2.resolvedType);

        // Move the loop variable into the loop body
        symbol.value = Skew.Node.createIndex(listName.clone(), [indexName]);
        block.insertChild(0, Skew.Node.createVar(symbol));

        // Use a C-style for loop to implement this foreach loop
        var setup1 = [Skew.Node.createVar(index), Skew.Node.createVar(list), Skew.Node.createVar(count2)];
        var test1 = Skew.Node.createBinary(Skew.NodeKind.LESS_THAN, indexName.clone(), countName);
        var update1 = Skew.Node.createUnary(Skew.NodeKind.INCREMENT, indexName.clone());
        node.become(Skew.Node.createFor(setup1, test1, update1, block.replaceWithNull()).withComments(node.comments));

        // Make sure the new expressions are resolved
        this.resolveNode(symbol.value, symbol.scope, null);
        this.resolveNode(count2.value, symbol.scope, null);
        this.resolveNode(test1, symbol.scope, null);
        this.resolveNode(update1, symbol.scope, null);
      }
    }
  };

  Skew.Resolving.Resolver.prototype.scanLocalVariables = function() {
    for (var i = 0, list = in_IntMap.values(this.localVariableStatistics), count = list.length; i < count; ++i) {
      var info = list[i];
      var symbol = info.symbol;

      // Variables that are never re-assigned can safely be considered constants for constant folding
      if (symbol.value !== null && info.writeCount === 0) {
        symbol.flags |= Skew.Symbol.IS_CONST;
      }

      // Unused local variables can safely be removed, but don't warn about "for i in 0..10 {}"
      if (info.readCount === 0 && !symbol.isLoopVariable()) {
        this.log.semanticWarningUnreadLocalVariable(symbol.range, symbol.name);
      }

      // Rename local variables that conflict
      var scope = symbol.scope;

      while (scope.kind() === Skew.ScopeKind.LOCAL) {
        scope = scope.parent;
      }

      if (scope.used !== null && in_StringMap.get(scope.used, symbol.name, null) !== symbol) {
        symbol.name = scope.generateName(symbol.name);
      }
    }
  };

  Skew.Resolving.Resolver.prototype.discardUnusedDefines = function() {
    for (var i = 0, list = Object.keys(this.defines), count = list.length; i < count; ++i) {
      var key = list[i];
      this.log.semanticErrorInvalidDefine2(this.defines[key].name, key);
    }
  };

  Skew.Resolving.Resolver.prototype.resolveObject = function(symbol) {
    this.initializeSymbol(symbol);

    for (var i = 0, list = symbol.objects, count = list.length; i < count; ++i) {
      var object = list[i];
      this.resolveObject(object);
    }

    for (var i1 = 0, list1 = symbol.functions, count1 = list1.length; i1 < count1; ++i1) {
      var $function = list1[i1];
      this.resolveFunction($function);
    }

    for (var i2 = 0, list2 = symbol.variables, count2 = list2.length; i2 < count2; ++i2) {
      var variable = list2[i2];
      this.resolveVariable(variable);
    }
  };

  Skew.Resolving.Resolver.prototype.initializeFunction = function(symbol) {
    if (symbol.resolvedType === null) {
      symbol.resolvedType = new Skew.Type(Skew.TypeKind.SYMBOL, symbol);
    }

    // Referencing a normal variable instead of a special node kind for "this"
    // makes many things much easier including lambda capture and devirtualization
    if (symbol.kind === Skew.SymbolKind.FUNCTION_INSTANCE || symbol.kind === Skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
      symbol.self = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_LOCAL, "self");
      symbol.self.flags |= Skew.Symbol.IS_CONST;
      symbol.self.resolvedType = this.cache.parameterize(symbol.parent.resolvedType);
      symbol.self.state = Skew.SymbolState.INITIALIZED;
    }

    // Lazily-initialize automatically generated functions
    if (symbol.isAutomaticallyGenerated()) {
      if (symbol.kind === Skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
        assert(symbol.name === "new");
        this.automaticallyGenerateClassConstructor(symbol);
      }

      else if (symbol.kind === Skew.SymbolKind.FUNCTION_INSTANCE) {
        assert(symbol.name === "toString");
        this.automaticallyGenerateEnumToString(symbol);
      }
    }

    // Find the overridden function or overloaded function in the base class
    var overridden = this.findOverriddenMember(symbol);

    if (overridden !== null) {
      var symbolKind = Skew.Merging.overloadedKind(symbol.kind);
      var overriddenKind = Skew.Merging.overloadedKind(overridden.kind);

      // Make sure the overridden symbol can be merged with this symbol
      if (symbolKind !== overriddenKind) {
        this.log.semanticErrorBadOverride(symbol.range, symbol.name, symbol.parent.asObjectSymbol().base.resolvedType, overridden.range);
        overridden = null;
      }

      // Overriding something makes both symbols overloaded for simplicity
      else {
        Skew.Resolving.Resolver.ensureFunctionIsOverloaded(symbol);

        if (Skew.SymbolKind.isFunction(overridden.kind)) {
          var $function = overridden.asFunctionSymbol();
          Skew.Resolving.Resolver.ensureFunctionIsOverloaded($function);
          overridden = $function.overloaded;
        }
      }
    }

    this.resolveParameters(symbol.parameters);

    // Resolve the argument variables
    symbol.resolvedType.argumentTypes = [];

    for (var i = 0, list = symbol.$arguments, count1 = list.length; i < count1; ++i) {
      var argument = list[i];
      argument.scope = symbol.scope;
      this.resolveVariable(argument);
      symbol.resolvedType.argumentTypes.push(argument.resolvedType);
    }

    symbol.argumentOnlyType = this.cache.createLambdaType(symbol.resolvedType.argumentTypes, null);

    // Resolve the return type if present (no return type means "void")
    var returnType = null;

    if (symbol.returnType !== null) {
      if (symbol.kind === Skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
        this.log.semanticErrorConstructorReturnType(symbol.returnType.range);
      }

      else {
        this.resolveAsParameterizedType(symbol.returnType, symbol.scope);
        returnType = symbol.returnType.resolvedType;
      }
    }

    // Constructors always return the type they construct
    if (symbol.kind === Skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
      returnType = this.cache.parameterize(symbol.parent.resolvedType);
    }

    // The "<=>" operator must return a numeric value for comparison with zero
    var count = symbol.$arguments.length;

    if (symbol.name === "<=>") {
      if (returnType === null || !this.cache.isNumeric(returnType)) {
        this.log.semanticErrorComparisonOperatorNotNumeric(symbol.returnType !== null ? symbol.returnType.range : symbol.range);
        returnType = Skew.Type.DYNAMIC;
      }

      else if (count !== 1) {
        this.log.semanticErrorWrongArgumentCount(symbol.range, symbol.name, 1);
      }
    }

    // Setters must have one argument
    else if (symbol.isSetter() && count !== 1) {
      this.log.semanticErrorWrongArgumentCount(symbol.range, symbol.name, 1);
      symbol.flags &= ~Skew.Symbol.IS_SETTER;
    }

    // Validate argument count
    else {
      var argumentCount = Skew.argumentCountForOperator(symbol.name);
      var hasArgumentCountError = false;

      switch (argumentCount) {
        case Skew.ArgumentCount.ZERO:
        case Skew.ArgumentCount.ONE: {
          var expected = argumentCount === Skew.ArgumentCount.ZERO ? 0 : 1;

          if (count !== expected) {
            this.log.semanticErrorWrongArgumentCount(symbol.range, symbol.name, expected);
            hasArgumentCountError = true;
          }
          break;
        }

        case Skew.ArgumentCount.ZERO_OR_ONE:
        case Skew.ArgumentCount.ONE_OR_TWO:
        case Skew.ArgumentCount.TWO_OR_FEWER: {
          var lower = argumentCount === Skew.ArgumentCount.ONE_OR_TWO ? 1 : 0;
          var upper = argumentCount === Skew.ArgumentCount.ZERO_OR_ONE ? 1 : 2;

          if (count < lower || count > upper) {
            this.log.semanticErrorWrongArgumentCountRange(symbol.range, symbol.name, lower, upper);
            hasArgumentCountError = true;
          }
          break;
        }

        case Skew.ArgumentCount.ONE_OR_MORE:
        case Skew.ArgumentCount.TWO_OR_MORE: {
          var expected1 = argumentCount === Skew.ArgumentCount.ONE_OR_MORE ? 1 : 2;

          if (count < expected1) {
            this.log.semanticErrorWrongArgumentCountRange(symbol.range, symbol.name, expected1, -1);
            hasArgumentCountError = true;
          }
          break;
        }
      }

      // Enforce that the initializer constructor operators take lists of
      // values to avoid confusing error messages inside the code generated
      // for initializer expressions
      if (!hasArgumentCountError && (symbol.name === "{new}" || symbol.name === "[new]")) {
        for (var i1 = 0, list1 = symbol.$arguments, count2 = list1.length; i1 < count2; ++i1) {
          var argument1 = list1[i1];

          if (argument1.resolvedType !== Skew.Type.DYNAMIC && !this.cache.isList(argument1.resolvedType)) {
            this.log.semanticErrorExpectedList(argument1.range, argument1.name, argument1.resolvedType);
          }
        }
      }
    }

    // Link this symbol with the overridden symbol if there is one
    var hasOverrideError = false;

    if (overridden !== null) {
      var overloaded = overridden.asOverloadedFunctionSymbol();
      this.initializeSymbol(overloaded);

      for (var i2 = 0, list2 = overloaded.symbols, count3 = list2.length; i2 < count3; ++i2) {
        var overload = list2[i2];

        if (overload.argumentOnlyType === symbol.argumentOnlyType) {
          symbol.overridden = overload.asFunctionSymbol();

          if (symbol.kind !== Skew.SymbolKind.FUNCTION_CONSTRUCTOR && overload.kind !== Skew.SymbolKind.FUNCTION_CONSTRUCTOR && symbol.overridden.resolvedType.returnType !== returnType) {
            this.log.semanticErrorBadOverrideReturnType(symbol.range, symbol.name, symbol.parent.asObjectSymbol().base.resolvedType, overload.range);
            hasOverrideError = true;
          }

          break;
        }
      }
    }

    symbol.resolvedType.returnType = returnType;
    this.resolveAnnotations(symbol);

    // Validate use of "def" vs "over"
    if (!hasOverrideError) {
      if (symbol.overridden !== null && symbol.kind === Skew.SymbolKind.FUNCTION_INSTANCE) {
        if (!symbol.isOver()) {
          this.log.semanticErrorModifierMissingOverride(symbol.range, symbol.name, symbol.overridden.range);
        }
      }

      else if (symbol.isOver()) {
        this.log.semanticErrorModifierUnusedOverride(symbol.range, symbol.name);
      }
    }
  };

  Skew.Resolving.Resolver.prototype.automaticallyGenerateClassConstructor = function(symbol) {
    var statements = [];

    // Mirror the base constructor's arguments
    if (symbol.overridden !== null) {
      this.initializeSymbol(symbol.overridden);
      var $arguments = symbol.overridden.$arguments;
      var values = [];

      for (var i = 0, list = $arguments, count = list.length; i < count; ++i) {
        var variable = list[i];
        var argument = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_LOCAL, variable.name);
        argument.resolvedType = variable.resolvedType;
        argument.state = Skew.SymbolState.INITIALIZED;
        symbol.$arguments.push(argument);
        values.push(Skew.Node.createSymbolReference(argument));
      }

      statements.push(Skew.Node.createExpression(values.length === 0 ? new Skew.Node(Skew.NodeKind.SUPER) : Skew.Node.createCall(new Skew.Node(Skew.NodeKind.SUPER), values)));
    }

    // Add an argument for every uninitialized variable
    var parent = symbol.parent.asObjectSymbol();
    this.initializeSymbol(parent);

    for (var i1 = 0, list1 = parent.variables, count1 = list1.length; i1 < count1; ++i1) {
      var variable1 = list1[i1];

      if (variable1.kind === Skew.SymbolKind.VARIABLE_INSTANCE) {
        this.initializeSymbol(variable1);

        if (variable1.value === null) {
          var argument1 = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_LOCAL, variable1.name);
          argument1.resolvedType = variable1.resolvedType;
          argument1.state = Skew.SymbolState.INITIALIZED;
          symbol.$arguments.push(argument1);
          statements.push(Skew.Node.createExpression(Skew.Node.createBinary(Skew.NodeKind.ASSIGN, Skew.Node.createMemberReference(Skew.Node.createSymbolReference(symbol.self), variable1), Skew.Node.createSymbolReference(argument1))));
        }

        else {
          statements.push(Skew.Node.createExpression(Skew.Node.createBinary(Skew.NodeKind.ASSIGN, Skew.Node.createMemberReference(Skew.Node.createSymbolReference(symbol.self), variable1), variable1.value)));
          variable1.value = null;
        }
      }
    }

    // Create the function body
    symbol.block = new Skew.Node(Skew.NodeKind.BLOCK).withChildren(statements);

    // Make constructors without arguments into getters
    if (symbol.$arguments.length === 0) {
      symbol.flags |= Skew.Symbol.IS_GETTER;
    }
  };

  Skew.Resolving.Resolver.prototype.automaticallyGenerateEnumToString = function(symbol) {
    var parent = symbol.parent.asObjectSymbol();
    var names = [];
    this.initializeSymbol(parent);

    for (var i = 0, list = parent.variables, count = list.length; i < count; ++i) {
      var variable = list[i];

      if (variable.kind === Skew.SymbolKind.VARIABLE_ENUM) {
        assert(variable.value.content.asInt() === names.length);
        names.push(new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.StringContent(variable.name)));
      }
    }

    var strings = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_GLOBAL, parent.scope.generateName("strings"));
    strings.value = Skew.Node.createInitializer(Skew.NodeKind.INITIALIZER_LIST, names);
    strings.flags |= Skew.Symbol.IS_PRIVATE | Skew.Symbol.IS_CONST;
    strings.state = Skew.SymbolState.INITIALIZED;
    strings.parent = parent;
    strings.scope = parent.scope;
    strings.resolvedType = this.cache.createListType(this.cache.stringType);
    parent.variables.push(strings);
    this.resolveAsParameterizedExpressionWithConversion(strings.value, strings.scope, strings.resolvedType);
    symbol.returnType = new Skew.Node(Skew.NodeKind.TYPE).withType(this.cache.stringType);
    symbol.block = new Skew.Node(Skew.NodeKind.BLOCK).withChildren([Skew.Node.createReturn(Skew.Node.createIndex(Skew.Node.createSymbolReference(strings), [new Skew.Node(Skew.NodeKind.NAME).withContent(new Skew.StringContent("self"))]))]);
    symbol.flags |= Skew.Symbol.IS_GETTER;
  };

  Skew.Resolving.Resolver.prototype.resolveFunction = function(symbol) {
    this.initializeSymbol(symbol);
    var scope = new Skew.LocalScope(symbol.scope, Skew.LocalType.NORMAL);

    if (symbol.self !== null) {
      scope.define(symbol.self, this.log);
    }

    // Default values for argument variables aren't resolved with this local
    // scope since they are evaluated at the call site, not inside the
    // function body, and shouldn't have access to other arguments
    for (var i = 0, list = symbol.$arguments, count = list.length; i < count; ++i) {
      var argument = list[i];
      scope.define(argument, this.log);
    }

    // The function is considered abstract if the body is missing
    var block = symbol.block;

    if (block !== null) {
      // User-specified constructors have variable initializers automatically inserted
      if (symbol.kind === Skew.SymbolKind.FUNCTION_CONSTRUCTOR && !symbol.isAutomaticallyGenerated()) {
        var index = 0;

        for (var i1 = 0, list1 = symbol.parent.asObjectSymbol().variables, count1 = list1.length; i1 < count1; ++i1) {
          var variable = list1[i1];

          if (variable.kind === Skew.SymbolKind.VARIABLE_INSTANCE) {
            this.initializeSymbol(variable);

            if (variable.value !== null) {
              block.insertChild(index, Skew.Node.createExpression(Skew.Node.createBinary(Skew.NodeKind.ASSIGN, Skew.Node.createMemberReference(Skew.Node.createSymbolReference(symbol.self), variable), variable.value)));
              ++index;
              variable.value = null;
            }
          }
        }
      }

      this.resolveNode(block, scope, null);

      // Missing a return statement is an error
      if (symbol.kind !== Skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
        var returnType = symbol.resolvedType.returnType;

        if (returnType !== null && returnType !== Skew.Type.DYNAMIC && !block.blockAlwaysEndsWithReturn()) {
          this.log.semanticErrorMissingReturn(symbol.range, symbol.name, returnType);
        }
      }
    }
  };

  Skew.Resolving.Resolver.prototype.recordStatistic = function(symbol, statistic) {
    if (symbol !== null && symbol.kind === Skew.SymbolKind.VARIABLE_LOCAL) {
      var info = in_IntMap.get(this.localVariableStatistics, symbol.id, null);

      if (info !== null) {
        switch (statistic) {
          case Skew.Resolving.SymbolStatistic.READ: {
            ++info.readCount;
            break;
          }

          case Skew.Resolving.SymbolStatistic.WRITE: {
            ++info.writeCount;
            break;
          }
        }
      }
    }
  };

  Skew.Resolving.Resolver.prototype.initializeVariable = function(symbol) {
    this.forbidOverriddenSymbol(symbol);

    // Normal variables may omit the initializer if the type is present
    if (symbol.type !== null) {
      this.resolveAsParameterizedType(symbol.type, symbol.scope);
      symbol.resolvedType = symbol.type.resolvedType;

      // Resolve the constant now so initialized constants always have a value
      if (symbol.isConst() && symbol.value !== null) {
        this.resolveAsParameterizedExpressionWithConversion(symbol.value, symbol.scope, symbol.resolvedType);
      }
    }

    // Enums take their type from their parent
    else if (symbol.kind === Skew.SymbolKind.VARIABLE_ENUM) {
      symbol.resolvedType = symbol.parent.resolvedType;
    }

    // Implicitly-typed variables take their type from their initializer
    else if (symbol.value !== null) {
      this.resolveAsParameterizedExpression(symbol.value, symbol.scope);
      var type = symbol.value.resolvedType;
      symbol.resolvedType = type;

      // Forbid certain types
      if (!Skew.Resolving.Resolver.isValidVariableType(type)) {
        this.log.semanticErrorBadVariableType(symbol.range, type);
        symbol.resolvedType = Skew.Type.DYNAMIC;
      }
    }

    // Use a different error for constants which must have a type and lambda arguments which cannot have an initializer
    else if (symbol.isConst() || symbol.scope.kind() === Skew.ScopeKind.FUNCTION && symbol.scope.asFunctionScope().symbol.kind === Skew.SymbolKind.FUNCTION_LOCAL) {
      this.log.semanticErrorVarMissingType(symbol.range, symbol.name);
      symbol.resolvedType = Skew.Type.DYNAMIC;
    }

    // Variables without a type are an error
    else {
      this.log.semanticErrorVarMissingValue(symbol.range, symbol.name);
      symbol.resolvedType = Skew.Type.DYNAMIC;
    }

    this.resolveDefines(symbol);
    this.resolveAnnotations(symbol);

    // Run post-annotation checks
    if (symbol.resolvedType !== Skew.Type.DYNAMIC && symbol.isConst() && !symbol.isImported() && symbol.value === null && symbol.kind !== Skew.SymbolKind.VARIABLE_ENUM && symbol.kind !== Skew.SymbolKind.VARIABLE_INSTANCE) {
      this.log.semanticErrorConstMissingValue(symbol.range, symbol.name);
    }
  };

  Skew.Resolving.Resolver.prototype.resolveVariable = function(symbol) {
    this.initializeSymbol(symbol);

    if (symbol.value !== null) {
      this.resolveAsParameterizedExpressionWithConversion(symbol.value, symbol.scope, symbol.resolvedType);
    }
  };

  Skew.Resolving.Resolver.prototype.initializeOverloadedFunction = function(symbol) {
    var symbols = symbol.symbols;

    if (symbol.resolvedType === null) {
      symbol.resolvedType = new Skew.Type(Skew.TypeKind.SYMBOL, symbol);
    }

    // Ensure no two overloads have the same argument types
    var types = [];
    var i = 0;

    while (i < symbols.length) {
      var $function = symbols[i];
      this.initializeSymbol($function);
      var index = types.indexOf($function.argumentOnlyType);

      if (index !== -1) {
        var other = symbols[index];

        // Allow duplicate function declarations with the same type to merge
        // as long as there is one declaration that provides an implementation.
        // Mark the obsolete function as obsolete instead of removing it so it
        // doesn't potentially mess up iteration in a parent call stack.
        if ($function.isMerged() || other.isMerged() || $function.block !== null === (other.block !== null) || $function.resolvedType.returnType !== other.resolvedType.returnType) {
          this.log.semanticErrorDuplicateOverload($function.range, symbol.name, other.range);
        }

        else if ($function.block !== null) {
          $function.flags |= other.flags & ~Skew.Symbol.IS_IMPORTED | Skew.Symbol.IS_MERGED;
          $function.mergeAnnotationsAndCommentsFrom(other);
          other.flags |= Skew.Symbol.IS_OBSOLETE;
          symbols[index] = $function;
        }

        else {
          other.flags |= $function.flags & ~Skew.Symbol.IS_IMPORTED | Skew.Symbol.IS_MERGED;
          other.mergeAnnotationsAndCommentsFrom($function);
          $function.flags |= Skew.Symbol.IS_OBSOLETE;
        }

        // Remove the symbol after the merge so "types" still matches "symbols"
        symbols.splice(i, 1);
        continue;
      }

      types.push($function.argumentOnlyType);
      ++i;
    }

    // Include non-overridden overloads from the base class
    var overridden = this.findOverriddenMember(symbol);

    if (overridden !== null && Skew.SymbolKind.isOverloadedFunction(overridden.kind)) {
      symbol.overridden = overridden.asOverloadedFunctionSymbol();

      for (var i1 = 0, list = symbol.overridden.symbols, count = list.length; i1 < count; ++i1) {
        var function1 = list[i1];

        // Constructors are not inherited
        if (function1.kind !== Skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
          this.initializeSymbol(function1);
          var index1 = types.indexOf(function1.argumentOnlyType);

          if (index1 === -1) {
            symbols.push(function1);
            types.push(function1.argumentOnlyType);
          }
        }
      }
    }
  };

  Skew.Resolving.Resolver.prototype.resolveNode = function(node, scope, context) {
    if (node.resolvedType !== null) {
      // Only resolve once
      return;
    }

    node.resolvedType = Skew.Type.DYNAMIC;

    switch (node.kind) {
      case Skew.NodeKind.BLOCK: {
        this.resolveBlock(node, scope);
        break;
      }

      case Skew.NodeKind.PAIR: {
        this.resolvePair(node, scope);
        break;
      }

      case Skew.NodeKind.BREAK:
      case Skew.NodeKind.CONTINUE: {
        this.resolveJump(node, scope);
        break;
      }

      case Skew.NodeKind.EXPRESSION: {
        this.resolveExpression(node, scope);
        break;
      }

      case Skew.NodeKind.FOREACH: {
        this.resolveForeach(node, scope);
        break;
      }

      case Skew.NodeKind.IF: {
        this.resolveIf(node, scope);
        break;
      }

      case Skew.NodeKind.RETURN: {
        this.resolveReturn(node, scope);
        break;
      }

      case Skew.NodeKind.SWITCH: {
        this.resolveSwitch(node, scope);
        break;
      }

      case Skew.NodeKind.THROW: {
        this.resolveThrow(node, scope);
        break;
      }

      case Skew.NodeKind.TRY: {
        this.resolveTry(node, scope);
        break;
      }

      case Skew.NodeKind.VAR: {
        this.resolveVar(node, scope);
        break;
      }

      case Skew.NodeKind.WHILE: {
        this.resolveWhile(node, scope);
        break;
      }

      case Skew.NodeKind.ASSIGN_INDEX: {
        this.resolveIndex(node, scope);
        break;
      }

      case Skew.NodeKind.CALL: {
        this.resolveCall(node, scope);
        break;
      }

      case Skew.NodeKind.CAST: {
        this.resolveCast(node, scope, context);
        break;
      }

      case Skew.NodeKind.CONSTANT: {
        this.resolveConstant(node, scope);
        break;
      }

      case Skew.NodeKind.DOT: {
        this.resolveDot(node, scope, context);
        break;
      }

      case Skew.NodeKind.DYNAMIC: {
        break;
      }

      case Skew.NodeKind.HOOK: {
        this.resolveHook(node, scope, context);
        break;
      }

      case Skew.NodeKind.INDEX: {
        this.resolveIndex(node, scope);
        break;
      }

      case Skew.NodeKind.INITIALIZER_LIST:
      case Skew.NodeKind.INITIALIZER_MAP:
      case Skew.NodeKind.INITIALIZER_SET: {
        this.resolveInitializer(node, scope, context);
        break;
      }

      case Skew.NodeKind.LAMBDA: {
        this.resolveLambda(node, scope, context);
        break;
      }

      case Skew.NodeKind.LAMBDA_TYPE: {
        this.resolveLambdaType(node, scope);
        break;
      }

      case Skew.NodeKind.NAME: {
        this.resolveName(node, scope);
        break;
      }

      case Skew.NodeKind.NULL: {
        node.resolvedType = Skew.Type.NULL;
        break;
      }

      case Skew.NodeKind.PARAMETERIZE: {
        this.resolveParameterize(node, scope);
        break;
      }

      case Skew.NodeKind.SUPER: {
        this.resolveSuper(node, scope);
        break;
      }

      default: {
        if (Skew.NodeKind.isUnary(node.kind)) {
          this.resolveUnary(node, scope);
        }

        else if (Skew.NodeKind.isBinary(node.kind)) {
          this.resolveBinary(node, scope);
        }

        else {
          assert(false);
        }
        break;
      }
    }

    assert(node.resolvedType !== null);
  };

  Skew.Resolving.Resolver.prototype.resolveAsParameterizedType = function(node, scope) {
    assert(Skew.NodeKind.isExpression(node.kind));
    this.resolveNode(node, scope, null);
    this.checkIsType(node);
    this.checkIsParameterized(node);
  };

  Skew.Resolving.Resolver.prototype.resolveAsParameterizedExpression = function(node, scope) {
    assert(Skew.NodeKind.isExpression(node.kind));
    this.resolveNode(node, scope, null);
    this.checkIsInstance(node);
    this.checkIsParameterized(node);
  };

  Skew.Resolving.Resolver.prototype.resolveAsParameterizedExpressionWithTypeContext = function(node, scope, type) {
    assert(Skew.NodeKind.isExpression(node.kind));
    this.resolveNode(node, scope, type);
    this.checkIsInstance(node);
    this.checkIsParameterized(node);
  };

  Skew.Resolving.Resolver.prototype.resolveAsParameterizedExpressionWithConversion = function(node, scope, type) {
    this.resolveAsParameterizedExpressionWithTypeContext(node, scope, type);
    this.checkConversion(node, type, Skew.Resolving.ConversionKind.IMPLICIT);
  };

  Skew.Resolving.Resolver.prototype.resolveChildrenAsParameterizedExpressions = function(node, scope) {
    for (var i = 0, list = node.children, count = list.length; i < count; ++i) {
      var child = list[i];
      this.resolveAsParameterizedExpression(child, scope);
    }
  };

  Skew.Resolving.Resolver.prototype.checkUnusedExpression = function(node) {
    var kind = node.kind;

    if (kind === Skew.NodeKind.HOOK) {
      this.checkUnusedExpression(node.hookTrue());
      this.checkUnusedExpression(node.hookFalse());
    }

    else if (node.range !== null && node.resolvedType !== Skew.Type.DYNAMIC && kind !== Skew.NodeKind.CALL && !Skew.NodeKind.isBinaryAssign(kind)) {
      this.log.semanticWarningUnusedExpression(node.range);
    }
  };

  Skew.Resolving.Resolver.prototype.checkIsInstance = function(node) {
    if (node.resolvedType !== Skew.Type.DYNAMIC && node.isType()) {
      this.log.semanticErrorUnexpectedType(node.range, node.resolvedType);
      node.resolvedType = Skew.Type.DYNAMIC;
    }
  };

  Skew.Resolving.Resolver.prototype.checkIsType = function(node) {
    if (node.resolvedType !== Skew.Type.DYNAMIC && !node.isType()) {
      this.log.semanticErrorUnexpectedExpression(node.range, node.resolvedType);
      node.resolvedType = Skew.Type.DYNAMIC;
    }
  };

  Skew.Resolving.Resolver.prototype.checkIsParameterized = function(node) {
    if (node.resolvedType.parameters() !== null && !node.resolvedType.isParameterized()) {
      this.log.semanticErrorUnparameterizedType(node.range, node.resolvedType);
      node.resolvedType = Skew.Type.DYNAMIC;
    }
  };

  Skew.Resolving.Resolver.prototype.checkStorage = function(node, scope) {
    var symbol = node.symbol;

    // Only allow storage to variables
    if (node.kind !== Skew.NodeKind.NAME && node.kind !== Skew.NodeKind.DOT || symbol !== null && !Skew.SymbolKind.isVariable(symbol.kind)) {
      this.log.semanticErrorBadStorage(node.range);
    }

    // Forbid storage to constants
    else if (symbol !== null && symbol.isConst()) {
      var $function = scope.findEnclosingFunction();

      // Allow assignments to constants inside constructors
      if ($function === null || $function.symbol.kind !== Skew.SymbolKind.FUNCTION_CONSTRUCTOR || $function.symbol.parent !== symbol.parent || symbol.kind !== Skew.SymbolKind.VARIABLE_INSTANCE) {
        this.log.semanticErrorStorageToConstSymbol(node.internalRangeOrRange(), symbol.name);
      }
    }
  };

  Skew.Resolving.Resolver.prototype.checkAccess = function(node, range, scope) {
    var symbol = node.symbol;

    if (symbol === null) {
      return;
    }

    // Check access control
    if (symbol.isPrivateOrProtected()) {
      var isPrivate = symbol.isPrivate();

      while (scope !== null) {
        if (scope.kind() === Skew.ScopeKind.OBJECT) {
          var object = scope.asObjectScope().symbol;

          if (object === symbol.parent || !isPrivate && object.hasBaseClass(symbol.parent)) {
            return;
          }
        }

        scope = scope.parent;
      }

      this.log.semanticErrorAccessViolation(range, isPrivate ? "@private" : "@protected", symbol.name);
    }

    // Deprecation annotations optionally provide a warning message
    if (symbol.isDeprecated()) {
      for (var i = 0, list = symbol.annotations, count = list.length; i < count; ++i) {
        var annotation = list[i];

        if (annotation.symbol !== null && annotation.symbol.fullName() === "@deprecated") {
          var value = annotation.annotationValue();

          if (value.kind === Skew.NodeKind.CALL) {
            var last = in_List.last(value.children);

            if (last.kind === Skew.NodeKind.CONSTANT && last.content.kind() === Skew.ContentKind.STRING) {
              this.log.warning(range, last.content.asString());
              return;
            }
          }
        }
      }

      this.log.semanticWarningDeprecatedUsage(range, symbol.name);
    }
  };

  Skew.Resolving.Resolver.prototype.checkConversion = function(node, to, kind) {
    var from = node.resolvedType;
    assert(from !== null);
    assert(to !== null);

    // The "dynamic" type is a hole in the type system
    if (from === Skew.Type.DYNAMIC || to === Skew.Type.DYNAMIC) {
      return;
    }

    // No conversion is needed for identical types
    if (from === to) {
      return;
    }

    // The implicit conversion must be valid
    if (kind === Skew.Resolving.ConversionKind.IMPLICIT && !this.cache.canImplicitlyConvert(from, to) || kind === Skew.Resolving.ConversionKind.EXPLICIT && !this.cache.canExplicitlyConvert(from, to)) {
      this.log.semanticErrorIncompatibleTypes(node.range, from, to, this.cache.canExplicitlyConvert(from, to));
      node.resolvedType = Skew.Type.DYNAMIC;
      return;
    }

    // Make the implicit conversion explicit for convenience later on
    if (kind === Skew.Resolving.ConversionKind.IMPLICIT) {
      var value = new Skew.Node(Skew.NodeKind.NULL);
      value.become(node);
      node.become(Skew.Node.createCast(value, new Skew.Node(Skew.NodeKind.TYPE).withType(to)).withType(to).withRange(node.range));
    }
  };

  Skew.Resolving.Resolver.prototype.resolveAnnotation = function(node, symbol) {
    var value = node.annotationValue();
    var test = node.annotationTest();
    this.resolveNode(value, symbol.scope, null);

    if (test !== null) {
      this.resolveAsParameterizedExpressionWithConversion(test, symbol.scope, this.cache.boolType);
    }

    // Terminate early when there were errors
    if (value.symbol === null) {
      return false;
    }

    // Make sure annotations have the arguments they need
    if (value.kind !== Skew.NodeKind.CALL) {
      this.log.semanticErrorArgumentCount(value.range, value.symbol.resolvedType.argumentTypes.length, 0, value.symbol.name, value.symbol.range);
      return false;
    }

    // Ensure all arguments are constants
    var children = value.children;
    var isValid = true;

    for (var i = 1, count = children.length; i < count; ++i) {
      isValid = isValid && this.recursivelyResolveAsConstant(children[i]);
    }

    if (!isValid) {
      return false;
    }

    // Only store symbols for annotations with the correct arguments for ease of use
    node.symbol = value.symbol;

    // Apply built-in annotation logic
    var flag = in_StringMap.get(Skew.Resolving.Resolver.annotationSymbolFlags, value.symbol.fullName(), 0);

    if (flag !== 0) {
      switch (flag) {
        case Skew.Symbol.IS_DEPRECATED: {
          break;
        }

        case Skew.Symbol.IS_ENTRY_POINT: {
          isValid = symbol.kind === Skew.SymbolKind.FUNCTION_GLOBAL;
          break;
        }

        case Skew.Symbol.IS_EXPORTED: {
          isValid = !symbol.isImported();
          break;
        }

        case Skew.Symbol.IS_IMPORTED: {
          isValid = !symbol.isExported() && (!Skew.SymbolKind.isFunction(symbol.kind) || symbol.asFunctionSymbol().block === null);
          break;
        }

        case Skew.Symbol.IS_PREFERRED: {
          isValid = Skew.SymbolKind.isFunction(symbol.kind);
          break;
        }

        case Skew.Symbol.IS_PRIVATE: {
          isValid = !symbol.isProtected() && symbol.parent !== null && symbol.parent.kind !== Skew.SymbolKind.OBJECT_GLOBAL;
          break;
        }

        case Skew.Symbol.IS_PROTECTED: {
          isValid = !symbol.isPrivate() && symbol.parent !== null && symbol.parent.kind !== Skew.SymbolKind.OBJECT_GLOBAL;
          break;
        }

        case Skew.Symbol.IS_RENAMED: {
          break;
        }

        case Skew.Symbol.IS_SKIPPED: {
          isValid = Skew.SymbolKind.isFunction(symbol.kind) && symbol.resolvedType.returnType === null;
          break;
        }
      }

      if (!isValid) {
        this.log.semanticErrorInvalidAnnotation(value.range, value.symbol.name, symbol.name);
        return false;
      }

      // Don't add an annotation when the test expression is false
      if (test !== null && this.recursivelyResolveAsConstant(test) && test.isFalse()) {
        return false;
      }

      // Only warn about duplicate annotations after checking the test expression
      if ((symbol.flags & flag) !== 0) {
        this.log.semanticErrorDuplicateAnnotation(value.range, value.symbol.name, symbol.name);
      }

      symbol.flags |= flag;
    }

    return true;
  };

  Skew.Resolving.Resolver.prototype.recursivelyResolveAsConstant = function(node) {
    this.constantFolder.foldConstants(node);

    if (node.kind !== Skew.NodeKind.CONSTANT) {
      this.log.semanticErrorExpectedConstant(node.range);
      return false;
    }

    return true;
  };

  Skew.Resolving.Resolver.prototype.resolveBlock = function(node, scope) {
    assert(node.kind === Skew.NodeKind.BLOCK);
    var children = node.children;
    var i = 0;

    while (i < children.length) {
      var child = children[i];

      // There is a well-known ambiguity in languages like JavaScript where
      // a return statement followed by a newline and a value can either be
      // parsed as a single return statement with a value or as two
      // statements, a return statement without a value and an expression
      // statement. Luckily, we're better off than JavaScript since we know
      // the type of the function. Parse a single statement in a non-void
      // function but two statements in a void function.
      if (child.kind === Skew.NodeKind.RETURN && (i + 1 | 0) < children.length && child.returnValue() === null && children[i + 1 | 0].kind === Skew.NodeKind.EXPRESSION) {
        var $function = scope.findEnclosingFunctionOrLambda().symbol;

        if ($function.kind !== Skew.SymbolKind.FUNCTION_CONSTRUCTOR && $function.resolvedType.returnType !== null) {
          child.replaceChild(0, node.removeChildAtIndex(i + 1 | 0).expressionValue().replaceWithNull());
        }
      }

      this.resolveNode(child, scope, null);

      // The "@skip" annotation removes function calls after type checking
      if (child.kind === Skew.NodeKind.EXPRESSION) {
        var value = child.expressionValue();

        if (value.kind === Skew.NodeKind.CALL && value.symbol !== null && value.symbol.isSkipped()) {
          node.removeChildAtIndex(i);
          continue;
        }
      }

      ++i;
    }
  };

  Skew.Resolving.Resolver.prototype.resolvePair = function(node, scope) {
    this.resolveAsParameterizedExpression(node.firstValue(), scope);
    this.resolveAsParameterizedExpression(node.secondValue(), scope);
  };

  Skew.Resolving.Resolver.prototype.resolveJump = function(node, scope) {
    if (scope.findEnclosingLoop() === null) {
      this.log.semanticErrorBadJump(node.range, node.kind === Skew.NodeKind.BREAK ? "break" : "continue");
    }
  };

  Skew.Resolving.Resolver.prototype.resolveExpression = function(node, scope) {
    var value = node.expressionValue();
    this.resolveAsParameterizedExpression(value, scope);
    this.checkUnusedExpression(value);
  };

  Skew.Resolving.Resolver.prototype.resolveForeach = function(node, scope) {
    var type = Skew.Type.DYNAMIC;
    scope = new Skew.LocalScope(scope, Skew.LocalType.LOOP);
    var value = node.foreachValue();
    this.resolveAsParameterizedExpression(value, scope);

    // Support "for i in 0..10"
    if (value.kind === Skew.NodeKind.PAIR) {
      var first = value.firstValue();
      var second = value.secondValue();
      type = this.cache.intType;
      this.checkConversion(first, this.cache.intType, Skew.Resolving.ConversionKind.IMPLICIT);
      this.checkConversion(second, this.cache.intType, Skew.Resolving.ConversionKind.IMPLICIT);

      // The ".." syntax only counts up, unlike CoffeeScript
      if (first.isInt() && second.isInt() && first.asInt() >= second.asInt()) {
        this.log.semanticWarningEmptyRange(value.range);
      }
    }

    // Support "for i in [1, 2, 3]"
    else if (this.cache.isList(value.resolvedType)) {
      type = value.resolvedType.substitutions[0];
    }

    // Anything else is an error
    else if (value.resolvedType !== Skew.Type.DYNAMIC) {
      this.log.semanticErrorBadForValue(value.range, value.resolvedType);
    }

    // Special-case symbol initialization with the type
    var symbol = node.symbol.asVariableSymbol();
    scope.asLocalScope().define(symbol, this.log);
    this.localVariableStatistics[symbol.id] = new Skew.Resolving.LocalVariableStatistics(symbol);
    symbol.resolvedType = type;
    symbol.flags |= Skew.Symbol.IS_CONST | Skew.Symbol.IS_LOOP_VARIABLE;
    symbol.state = Skew.SymbolState.INITIALIZED;
    this.resolveBlock(node.foreachBlock(), scope);

    // Collect foreach loops and convert them in another pass
    this.foreachLoops.push(node);
  };

  Skew.Resolving.Resolver.prototype.resolveIf = function(node, scope) {
    var test = node.ifTest();
    var ifFalse = node.ifFalse();
    this.resolveAsParameterizedExpressionWithConversion(test, scope, this.cache.boolType);
    this.resolveBlock(node.ifTrue(), new Skew.LocalScope(scope, Skew.LocalType.NORMAL));

    if (ifFalse !== null) {
      this.resolveBlock(ifFalse, new Skew.LocalScope(scope, Skew.LocalType.NORMAL));
    }
  };

  Skew.Resolving.Resolver.prototype.resolveReturn = function(node, scope) {
    var value = node.returnValue();
    var $function = scope.findEnclosingFunctionOrLambda().symbol;
    var returnType = $function.kind !== Skew.SymbolKind.FUNCTION_CONSTRUCTOR ? $function.resolvedType.returnType : null;

    // Check for a returned value
    if (value === null) {
      if (returnType !== null) {
        this.log.semanticErrorExpectedReturnValue(node.range, returnType);
      }

      return;
    }

    // Check the type of the returned value
    if (returnType !== null) {
      this.resolveAsParameterizedExpressionWithConversion(value, scope, returnType);
      return;
    }

    // If there's no return type, still check for other errors
    this.resolveAsParameterizedExpression(value, scope);

    // Lambdas without a return type or an explicit "return" statement get special treatment
    if (!node.isImplicitReturn()) {
      this.log.semanticErrorUnexpectedReturnValue(value.range);
      return;
    }

    // Check for a return value of type "void"
    if (!$function.shouldInferReturnType() || value.kind === Skew.NodeKind.CALL && value.symbol !== null && value.symbol.resolvedType.returnType === null) {
      this.checkUnusedExpression(value);
      node.kind = Skew.NodeKind.EXPRESSION;
      return;
    }

    // Check for an invalid return type
    var type = value.resolvedType;

    if (!Skew.Resolving.Resolver.isValidVariableType(type)) {
      this.log.semanticErrorBadReturnType(value.range, type);
      node.kind = Skew.NodeKind.EXPRESSION;
      return;
    }

    // Mutate the return type to the type from the returned value
    $function.returnType = new Skew.Node(Skew.NodeKind.TYPE).withType(type);
  };

  Skew.Resolving.Resolver.prototype.resolveSwitch = function(node, scope) {
    var value = node.switchValue();
    var cases = node.children;
    this.resolveAsParameterizedExpression(value, scope);

    for (var i = 1, count1 = cases.length; i < count1; ++i) {
      var child = cases[i];
      var values = child.children;

      for (var j = 1, count = values.length; j < count; ++j) {
        var caseValue = values[j];
        this.resolveAsParameterizedExpressionWithConversion(caseValue, scope, value.resolvedType);
      }

      this.resolveBlock(child.caseBlock(), new Skew.LocalScope(scope, Skew.LocalType.NORMAL));
    }
  };

  Skew.Resolving.Resolver.prototype.resolveThrow = function(node, scope) {
    var value = node.throwValue();
    this.resolveAsParameterizedExpression(value, scope);
  };

  Skew.Resolving.Resolver.prototype.resolveVar = function(node, scope) {
    var symbol = node.symbol.asVariableSymbol();
    scope.asLocalScope().define(symbol, this.log);
    this.localVariableStatistics[symbol.id] = new Skew.Resolving.LocalVariableStatistics(symbol);
    this.resolveVariable(symbol);
  };

  Skew.Resolving.Resolver.prototype.resolveTry = function(node, scope) {
    var children = node.children;
    var finallyBlock = node.finallyBlock();
    this.resolveBlock(node.tryBlock(), new Skew.LocalScope(scope, Skew.LocalType.NORMAL));

    // Bare try statements catch all thrown values
    if (children.length === 2 && finallyBlock === null) {
      node.insertChild(1, Skew.Node.createCatch(null, new Skew.Node(Skew.NodeKind.BLOCK).withChildren([])));
    }

    for (var i = 1, count = children.length - 1 | 0; i < count; ++i) {
      var child = children[i];
      var childScope = new Skew.LocalScope(scope, Skew.LocalType.NORMAL);

      if (child.symbol !== null) {
        var symbol = child.symbol.asVariableSymbol();
        childScope.define(symbol, this.log);
        this.resolveVariable(symbol);
      }

      this.resolveBlock(child.catchBlock(), childScope);
    }

    if (finallyBlock !== null) {
      this.resolveBlock(finallyBlock, new Skew.LocalScope(scope, Skew.LocalType.NORMAL));
    }
  };

  Skew.Resolving.Resolver.prototype.resolveWhile = function(node, scope) {
    var test = node.whileTest();
    this.resolveAsParameterizedExpressionWithConversion(test, scope, this.cache.boolType);
    this.resolveBlock(node.whileBlock(), new Skew.LocalScope(scope, Skew.LocalType.LOOP));
  };

  Skew.Resolving.Resolver.prototype.resolveCall = function(node, scope) {
    var value = node.callValue();
    this.resolveAsParameterizedExpression(value, scope);
    var type = value.resolvedType;

    switch (type.kind) {
      case Skew.TypeKind.SYMBOL: {
        if (this.resolveSymbolCall(node, scope, type)) {
          return;
        }
        break;
      }

      case Skew.TypeKind.LAMBDA: {
        if (this.resolveFunctionCall(node, scope, type)) {
          return;
        }
        break;
      }

      default: {
        if (type !== Skew.Type.DYNAMIC) {
          this.log.semanticErrorInvalidCall(node.internalRangeOrRange(), value.resolvedType);
        }
        break;
      }
    }

    // If there was an error, resolve the arguments to check for further
    // errors but use a dynamic type context to avoid introducing errors
    for (var i = 1, count = node.children.length; i < count; ++i) {
      this.resolveAsParameterizedExpressionWithConversion(node.children[i], scope, Skew.Type.DYNAMIC);
    }
  };

  Skew.Resolving.Resolver.prototype.resolveSymbolCall = function(node, scope, type) {
    var symbol = type.symbol;

    // Getters are called implicitly, so explicitly calling one is an error.
    // This error prevents a getter returning a lambda which is then called,
    // but that's really strange and I think this error is more useful.
    if (symbol.isGetter() && Skew.Resolving.Resolver.isCallValue(node)) {
      this.log.semanticErrorGetterCalledTwice(node.parent.internalRangeOrRange(), symbol.name, symbol.range);
      return false;
    }

    // Check for calling a function directly
    if (Skew.SymbolKind.isFunction(symbol.kind)) {
      return this.resolveFunctionCall(node, scope, type);
    }

    // Check for calling a set of functions, must not be ambiguous
    if (Skew.SymbolKind.isOverloadedFunction(symbol.kind)) {
      return this.resolveOverloadedFunctionCall(node, scope, type);
    }

    // Can't call other symbols
    this.log.semanticErrorInvalidCall(node.internalRangeOrRange(), node.callValue().resolvedType);
    return false;
  };

  Skew.Resolving.Resolver.prototype.resolveFunctionCall = function(node, scope, type) {
    var $function = type.symbol !== null ? type.symbol.asFunctionSymbol() : null;
    var expected = type.argumentTypes.length;
    var count = node.children.length - 1 | 0;
    node.symbol = $function;

    // Use the return type even if there were errors
    if (type.returnType !== null) {
      node.resolvedType = type.returnType;
    }

    // There is no "void" type, so make sure this return value isn't used
    else if (Skew.Resolving.Resolver.isVoidExpressionUsed(node)) {
      if ($function !== null) {
        this.log.semanticErrorUseOfVoidFunction(node.range, $function.name, $function.range);
      }

      else {
        this.log.semanticErrorUseOfVoidLambda(node.range);
      }
    }

    // Check argument count
    if (expected !== count) {
      this.log.semanticErrorArgumentCount(node.internalRangeOrRange(), expected, count, $function !== null ? $function.name : "", $function !== null ? $function.range : null);
      return false;
    }

    // Check argument types
    for (var i = 0, count1 = count; i < count1; ++i) {
      this.resolveAsParameterizedExpressionWithConversion(node.children[i + 1 | 0], scope, type.argumentTypes[i]);
    }

    // Replace overloaded symbols with the chosen overload
    var callValue = node.children[0];

    if ($function !== null && $function.overloaded !== null && callValue.symbol === $function.overloaded) {
      callValue.symbol = $function;
    }

    return true;
  };

  Skew.Resolving.Resolver.prototype.resolveOverloadedFunction = function(range, children, scope, symbolType) {
    var overloaded = symbolType.symbol.asOverloadedFunctionSymbol();
    var count = children.length - 1 | 0;
    var candidates = [];

    // Filter by argument length and substitute using the current type environment
    for (var i1 = 0, list = overloaded.symbols, count1 = list.length; i1 < count1; ++i1) {
      var symbol = list[i1];

      if (symbol.$arguments.length === count || overloaded.symbols.length === 1) {
        candidates.push(this.cache.substitute(symbol.resolvedType, symbolType.environment));
      }
    }

    // Check for matches
    if (candidates.length === 0) {
      this.log.semanticErrorNoMatchingOverload(range, overloaded.name, count, null);
      return null;
    }

    // Check for an unambiguous match
    if (candidates.length === 1) {
      return candidates[0];
    }

    // First filter by syntactic structure impossibilities. This helps break
    // the chicken-and-egg problem of needing to resolve argument types to
    // get a match and needing a match to resolve argument types. For example,
    // a list literal needs type context to resolve correctly.
    var index = 0;

    while (index < candidates.length) {
      var argumentTypes = candidates[index].argumentTypes;

      for (var i = 0, count2 = count; i < count2; ++i) {
        var kind = children[i + 1 | 0].kind;
        var type = argumentTypes[i];

        if (kind === Skew.NodeKind.NULL && !type.isReference() || kind === Skew.NodeKind.INITIALIZER_LIST && this.findMember(type, "[new]") === null && this.findMember(type, "[...]") === null || (kind === Skew.NodeKind.INITIALIZER_SET || kind === Skew.NodeKind.INITIALIZER_MAP) && this.findMember(type, "{new}") === null && this.findMember(type, "{...}") === null) {
          candidates.splice(index, 1);
          --index;
          break;
        }
      }

      ++index;
    }

    // Check for an unambiguous match
    if (candidates.length === 1) {
      return candidates[0];
    }

    // If that still didn't work, resolve the arguments without type context
    for (var i4 = 0, count3 = count; i4 < count3; ++i4) {
      this.resolveAsParameterizedExpression(children[i4 + 1 | 0], scope);
    }

    // Try again, this time discarding all implicit conversion failures
    index = 0;

    while (index < candidates.length) {
      var argumentTypes1 = candidates[index].argumentTypes;

      for (var i5 = 0, count4 = count; i5 < count4; ++i5) {
        if (!this.cache.canImplicitlyConvert(children[i5 + 1 | 0].resolvedType, argumentTypes1[i5])) {
          candidates.splice(index, 1);
          --index;
          break;
        }
      }

      ++index;
    }

    // Check for an unambiguous match
    if (candidates.length === 1) {
      return candidates[0];
    }

    // Extract argument types for an error if there is one
    var childTypes = [];

    for (var i6 = 0, count5 = count; i6 < count5; ++i6) {
      childTypes.push(children[i6 + 1 | 0].resolvedType);
    }

    // Give up without a match
    if (candidates.length === 0) {
      this.log.semanticErrorNoMatchingOverload(range, overloaded.name, count, childTypes);
      return null;
    }

    // If that still didn't work, try type equality
    for (var i2 = 0, list1 = candidates, count7 = list1.length; i2 < count7; ++i2) {
      var type1 = list1[i2];
      var isMatch = true;

      for (var i7 = 0, count6 = count; i7 < count6; ++i7) {
        if (children[i7 + 1 | 0].resolvedType !== type1.argumentTypes[i7]) {
          isMatch = false;
          break;
        }
      }

      if (isMatch) {
        return type1;
      }
    }

    // If that still didn't work, try picking the preferred overload
    var firstPreferred = null;
    var secondPreferred = null;

    for (var i3 = 0, list2 = candidates, count8 = list2.length; i3 < count8; ++i3) {
      var type2 = list2[i3];

      if (type2.symbol.isPreferred()) {
        secondPreferred = firstPreferred;
        firstPreferred = type2;
      }
    }

    // Check for a single preferred overload
    if (firstPreferred !== null && secondPreferred === null) {
      return firstPreferred;
    }

    // Give up since the overload is ambiguous
    this.log.semanticErrorAmbiguousOverload(range, overloaded.name, count, childTypes);
    return null;
  };

  Skew.Resolving.Resolver.prototype.resolveOverloadedFunctionCall = function(node, scope, type) {
    var match = this.resolveOverloadedFunction(node.callValue().range, node.children, scope, type);

    if (match !== null && this.resolveFunctionCall(node, scope, match)) {
      this.checkAccess(node, node.callValue().internalRangeOrRange(), scope);
      return true;
    }

    return false;
  };

  Skew.Resolving.Resolver.prototype.resolveCast = function(node, scope, context) {
    var value = node.castValue();
    var type = node.castType();
    this.resolveAsParameterizedType(type, scope);
    this.resolveAsParameterizedExpressionWithTypeContext(value, scope, type.resolvedType);
    this.checkConversion(value, type.resolvedType, Skew.Resolving.ConversionKind.EXPLICIT);
    node.resolvedType = type.resolvedType;

    // Warn about unnecessary casts
    if (type.resolvedType !== Skew.Type.DYNAMIC && (value.resolvedType === type.resolvedType || context === type.resolvedType && this.cache.canImplicitlyConvert(value.resolvedType, type.resolvedType))) {
      this.log.semanticWarningExtraCast(Skew.Range.span(node.internalRangeOrRange(), type.range), value.resolvedType, type.resolvedType);
    }
  };

  Skew.Resolving.Resolver.prototype.resolveConstant = function(node, scope) {
    switch (node.content.kind()) {
      case Skew.ContentKind.BOOL: {
        node.resolvedType = this.cache.boolType;
        break;
      }

      case Skew.ContentKind.DOUBLE: {
        node.resolvedType = this.cache.doubleType;
        break;
      }

      case Skew.ContentKind.INT: {
        node.resolvedType = this.cache.intType;
        break;
      }

      case Skew.ContentKind.STRING: {
        node.resolvedType = this.cache.stringType;
        break;
      }

      default: {
        assert(false);
        break;
      }
    }
  };

  Skew.Resolving.Resolver.prototype.findOverriddenMember = function(symbol) {
    if (symbol.parent !== null && symbol.parent.kind === Skew.SymbolKind.OBJECT_CLASS) {
      var object = symbol.parent.asObjectSymbol();

      if (object.baseClass !== null) {
        return this.findMember(object.baseClass.resolvedType, symbol.name);
      }
    }

    return null;
  };

  Skew.Resolving.Resolver.prototype.forbidOverriddenSymbol = function(symbol) {
    var overridden = this.findOverriddenMember(symbol);

    if (overridden !== null) {
      this.log.semanticErrorBadOverride(symbol.range, symbol.name, symbol.parent.asObjectSymbol().base.resolvedType, overridden.range);
    }
  };

  Skew.Resolving.Resolver.prototype.findMember = function(type, name) {
    var check = type;

    while (check !== null) {
      if (check.kind === Skew.TypeKind.SYMBOL) {
        var symbol = check.symbol;

        if (Skew.SymbolKind.isObject(symbol.kind)) {
          var member = in_StringMap.get(symbol.asObjectSymbol().members, name, null);

          if (member !== null) {
            this.initializeSymbol(member);
            return member;
          }
        }
      }

      check = check.baseClass();
    }

    return null;
  };

  Skew.Resolving.Resolver.prototype.resolveDot = function(node, scope, context) {
    var target = node.dotTarget();
    var name = node.asString();

    // Infer the target from the type context if it's omitted
    if (target === null) {
      if (context === null) {
        this.log.semanticErrorMissingDotContext(node.range, name);
        return;
      }

      target = new Skew.Node(Skew.NodeKind.TYPE).withType(context);
      node.replaceChild(0, target);
    }

    else {
      this.resolveNode(target, scope, null);
    }

    // Search for a setter first, then search for a normal member
    var symbol = null;

    if (Skew.Resolving.Resolver.shouldCheckForSetter(node)) {
      symbol = this.findMember(target.resolvedType, name + "=");
    }

    if (symbol === null) {
      symbol = this.findMember(target.resolvedType, name);

      if (symbol === null) {
        if (target.resolvedType !== Skew.Type.DYNAMIC) {
          this.reportGuardMergingFailure(node);
          this.log.semanticErrorUnknownMemberSymbol(node.internalRangeOrRange(), name, target.resolvedType);
        }

        if (target.kind === Skew.NodeKind.DYNAMIC) {
          node.kind = Skew.NodeKind.NAME;
          node.removeChildren();
        }

        return;
      }
    }

    // Forbid referencing a base class global or constructor function from a derived class
    if (Skew.Resolving.Resolver.isBaseGlobalReference(target.resolvedType.symbol, symbol)) {
      this.log.semanticErrorUnknownMemberSymbol(node.internalRangeOrRange(), name, target.resolvedType);
      return;
    }

    var isType = target.isType();
    var needsType = !Skew.SymbolKind.isOnInstances(symbol.kind);

    // Make sure the global/instance context matches the intended usage
    if (isType) {
      if (!needsType) {
        this.log.semanticErrorMemberUnexpectedInstance(node.internalRangeOrRange(), symbol.name);
      }

      else if (Skew.SymbolKind.isFunctionOrOverloadedFunction(symbol.kind)) {
        this.checkIsParameterized(target);
      }

      else if (target.resolvedType.isParameterized()) {
        this.log.semanticErrorParameterizedType(target.range, target.resolvedType);
      }
    }

    else if (needsType) {
      this.log.semanticErrorMemberUnexpectedGlobal(node.internalRangeOrRange(), symbol.name);
    }

    // Always access referenced globals directly
    if (Skew.SymbolKind.isGlobalReference(symbol.kind)) {
      node.kind = Skew.NodeKind.NAME;
      node.removeChildren();
    }

    node.symbol = symbol;
    node.resolvedType = this.cache.substitute(symbol.resolvedType, target.resolvedType.environment);
    this.automaticallyCallGetter(node, scope);
  };

  Skew.Resolving.Resolver.prototype.resolveHook = function(node, scope, context) {
    this.resolveAsParameterizedExpressionWithConversion(node.hookTest(), scope, this.cache.boolType);
    var trueValue = node.hookTrue();
    var falseValue = node.hookFalse();

    // Use the type context from the parent
    if (context !== null) {
      this.resolveAsParameterizedExpressionWithConversion(trueValue, scope, context);
      this.resolveAsParameterizedExpressionWithConversion(falseValue, scope, context);
      node.resolvedType = context;
    }

    // Find the common type from both branches
    else {
      this.resolveAsParameterizedExpression(trueValue, scope);
      this.resolveAsParameterizedExpression(falseValue, scope);
      var common = this.cache.commonImplicitType(trueValue.resolvedType, falseValue.resolvedType);

      if (common !== null) {
        node.resolvedType = common;
      }

      else {
        this.log.semanticErrorNoCommonType(Skew.Range.span(trueValue.range, falseValue.range), trueValue.resolvedType, falseValue.resolvedType);
      }
    }
  };

  Skew.Resolving.Resolver.prototype.resolveInitializer = function(node, scope, context) {
    // Make sure to resolve the children even if the initializer is invalid
    if (context !== null) {
      if (context === Skew.Type.DYNAMIC || !this.resolveInitializerWithContext(node, scope, context)) {
        this.resolveChildrenAsParameterizedExpressions(node, scope);
      }

      return;
    }

    // First pass: only children with type context, second pass: all children
    for (var pass = 0; pass < 2; ++pass) {
      switch (node.kind) {
        case Skew.NodeKind.INITIALIZER_LIST: {
          var type = null;

          // Resolve all children for this pass
          for (var i = 0, list = node.children, count = list.length; i < count; ++i) {
            var child = list[i];

            if (pass !== 0 || !Skew.Resolving.Resolver.needsTypeContext(child)) {
              this.resolveAsParameterizedExpression(child, scope);
              type = this.mergeCommonType(type, child);
            }
          }

          // Resolve remaining children using the type context if valid
          if (type !== null && Skew.Resolving.Resolver.isValidVariableType(type)) {
            this.resolveInitializerWithContext(node, scope, this.cache.createListType(type));
            return;
          }
          break;
        }

        case Skew.NodeKind.INITIALIZER_MAP: {
          var keyType = null;
          var valueType = null;

          // Resolve all children for this pass
          for (var i1 = 0, list1 = node.children, count1 = list1.length; i1 < count1; ++i1) {
            var child1 = list1[i1];
            var key = child1.firstValue();
            var value = child1.secondValue();

            if (pass !== 0 || !Skew.Resolving.Resolver.needsTypeContext(key)) {
              this.resolveAsParameterizedExpression(key, scope);
              keyType = this.mergeCommonType(keyType, key);
            }

            if (pass !== 0 || !Skew.Resolving.Resolver.needsTypeContext(value)) {
              this.resolveAsParameterizedExpression(value, scope);
              valueType = this.mergeCommonType(valueType, value);
            }
          }

          // Resolve remaining children using the type context if valid
          if (keyType !== null && valueType !== null && Skew.Resolving.Resolver.isValidVariableType(keyType) && Skew.Resolving.Resolver.isValidVariableType(valueType)) {
            if (keyType === this.cache.intType) {
              this.resolveInitializerWithContext(node, scope, this.cache.createIntMapType(valueType));
              return;
            }

            if (keyType === this.cache.stringType) {
              this.resolveInitializerWithContext(node, scope, this.cache.createStringMapType(valueType));
              return;
            }
          }
          break;
        }
      }
    }

    this.log.semanticErrorInitializerTypeInferenceFailed(node.range);
  };

  Skew.Resolving.Resolver.prototype.shouldUseMapConstructor = function(symbol) {
    if (Skew.SymbolKind.isFunction(symbol.kind)) {
      return symbol.asFunctionSymbol().$arguments.length === 2;
    }

    for (var i = 0, list = symbol.asOverloadedFunctionSymbol().symbols, count = list.length; i < count; ++i) {
      var overload = list[i];

      if (overload.$arguments.length === 2) {
        return true;
      }
    }

    return false;
  };

  Skew.Resolving.Resolver.prototype.resolveInitializerWithContext = function(node, scope, context) {
    var isList = node.kind === Skew.NodeKind.INITIALIZER_LIST;
    var create = this.findMember(context, isList ? "[new]" : "{new}");
    var add = this.findMember(context, isList ? "[...]" : "{...}");

    // Special-case imported literals to prevent an infinite loop for list literals
    if (add !== null && add.isImported()) {
      var $function = add.asFunctionSymbol();

      if ($function.$arguments.length === (isList ? 1 : 2)) {
        var functionType = this.cache.substitute($function.resolvedType, context.environment);

        for (var i = 0, list = node.children, count = list.length; i < count; ++i) {
          var child = list[i];

          if (child.kind === Skew.NodeKind.PAIR) {
            this.resolveAsParameterizedExpressionWithConversion(child.firstValue(), scope, functionType.argumentTypes[0]);
            this.resolveAsParameterizedExpressionWithConversion(child.secondValue(), scope, functionType.argumentTypes[1]);
          }

          else {
            this.resolveAsParameterizedExpressionWithConversion(child, scope, functionType.argumentTypes[0]);
          }
        }

        node.resolvedType = context;
        return true;
      }
    }

    // Use simple call chaining when there's an add operator present
    if (add !== null) {
      var chain = new Skew.Node(Skew.NodeKind.DOT).withContent(new Skew.StringContent(create !== null ? create.name : "new")).withChildren([new Skew.Node(Skew.NodeKind.TYPE).withType(context).withRange(node.range)]).withRange(node.range);

      for (var i1 = 0, list1 = node.children, count1 = list1.length; i1 < count1; ++i1) {
        var child1 = list1[i1];
        var dot = new Skew.Node(Skew.NodeKind.DOT).withContent(new Skew.StringContent(add.name)).withChildren([chain]).withRange(child1.range);
        var $arguments = child1.kind === Skew.NodeKind.PAIR ? [child1.firstValue().replaceWithNull(), child1.secondValue().replaceWithNull()] : [child1.replaceWithNull()];
        chain = Skew.Node.createCall(dot, $arguments).withRange(child1.range);
      }

      node.become(chain);
      this.resolveAsParameterizedExpressionWithConversion(node, scope, context);
      return true;
    }

    // Make sure there's a constructor to call
    if (create === null) {
      this.log.semanticErrorInitializerTypeInferenceFailed(node.range);
      return false;
    }

    var dot1 = new Skew.Node(Skew.NodeKind.DOT).withContent(new Skew.StringContent(create.name)).withChildren([new Skew.Node(Skew.NodeKind.TYPE).withType(context).withRange(node.range)]).withRange(node.range);

    // The literal "{}" is ambiguous and may be a map or a set
    if (node.children.length === 0 && !isList && this.shouldUseMapConstructor(create)) {
      node.become(Skew.Node.createCall(dot1, [new Skew.Node(Skew.NodeKind.INITIALIZER_LIST).withChildren([]).withRange(node.range), new Skew.Node(Skew.NodeKind.INITIALIZER_LIST).withChildren([]).withRange(node.range)]).withRange(node.range));
      this.resolveAsParameterizedExpressionWithConversion(node, scope, context);
      return true;
    }

    // Call the initializer constructor
    if (node.kind === Skew.NodeKind.INITIALIZER_MAP) {
      var firstValues = [];
      var secondValues = [];

      for (var i2 = 0, list2 = node.children, count2 = list2.length; i2 < count2; ++i2) {
        var child2 = list2[i2];
        firstValues.push(child2.firstValue().replaceWithNull());
        secondValues.push(child2.secondValue().replaceWithNull());
      }

      node.become(Skew.Node.createCall(dot1, [new Skew.Node(Skew.NodeKind.INITIALIZER_LIST).withChildren(firstValues).withRange(node.range), new Skew.Node(Skew.NodeKind.INITIALIZER_LIST).withChildren(secondValues).withRange(node.range)]).withRange(node.range));
    }

    else {
      node.become(Skew.Node.createCall(dot1, [new Skew.Node(Skew.NodeKind.INITIALIZER_LIST).withChildren(node.removeChildren()).withRange(node.range)]).withRange(node.range));
    }

    this.resolveAsParameterizedExpressionWithConversion(node, scope, context);
    return true;
  };

  Skew.Resolving.Resolver.prototype.mergeCommonType = function(commonType, child) {
    if (commonType === null || child.resolvedType === Skew.Type.DYNAMIC) {
      return child.resolvedType;
    }

    var result = this.cache.commonImplicitType(commonType, child.resolvedType);

    if (result !== null) {
      return result;
    }

    this.log.semanticErrorNoCommonType(child.range, commonType, child.resolvedType);
    return Skew.Type.DYNAMIC;
  };

  Skew.Resolving.Resolver.prototype.resolveLambda = function(node, scope, context) {
    var symbol = node.symbol.asFunctionSymbol();
    symbol.scope = new Skew.FunctionScope(scope, symbol);

    // Use type context to implicitly set missing types
    if (context !== null && context.kind === Skew.TypeKind.LAMBDA) {
      // Copy over the argument types if they line up
      if (context.argumentTypes.length === symbol.$arguments.length) {
        for (var i = 0, count = symbol.$arguments.length; i < count; ++i) {
          var argument = symbol.$arguments[i];

          if (argument.type === null) {
            argument.type = new Skew.Node(Skew.NodeKind.TYPE).withType(context.argumentTypes[i]);
          }
        }
      }

      // Copy over the return type
      if (symbol.returnType === null && context.returnType !== null) {
        symbol.returnType = new Skew.Node(Skew.NodeKind.TYPE).withType(context.returnType);
      }
    }

    // Only infer non-void return types if there's no type context
    else if (symbol.returnType === null) {
      symbol.flags |= Skew.Symbol.SHOULD_INFER_RETURN_TYPE;
    }

    this.resolveFunction(symbol);

    // Use a LambdaType instead of a SymbolType for the node
    var argumentTypes = [];
    var returnType = symbol.returnType;

    for (var i1 = 0, list = symbol.$arguments, count1 = list.length; i1 < count1; ++i1) {
      var argument1 = list[i1];
      argumentTypes.push(argument1.resolvedType);
    }

    node.resolvedType = this.cache.createLambdaType(argumentTypes, returnType !== null ? returnType.resolvedType : null);
  };

  Skew.Resolving.Resolver.prototype.resolveLambdaType = function(node, scope) {
    var types = [];

    for (var i = 0, list = node.children, count = list.length; i < count; ++i) {
      var child = list[i];

      if (child !== null) {
        this.resolveAsParameterizedType(child, scope);
        types.push(child.resolvedType);
      }

      else {
        types.push(null);
      }
    }

    var returnType = types.pop();
    node.resolvedType = this.cache.createLambdaType(types, returnType);
  };

  Skew.Resolving.Resolver.prototype.resolveName = function(node, scope) {
    var enclosingFunction = scope.findEnclosingFunction();
    var name = node.asString();
    var symbol = null;

    // Search for a setter first, then search for a normal symbol
    if (Skew.Resolving.Resolver.shouldCheckForSetter(node)) {
      symbol = scope.find(name + "=");
    }

    // If a setter wasn't found, search for a normal symbol
    if (symbol === null) {
      symbol = scope.find(name);

      if (symbol === null) {
        this.reportGuardMergingFailure(node);
        this.log.semanticErrorUndeclaredSymbol(node.range, name);
        return;
      }
    }

    this.initializeSymbol(symbol);

    // Track reads and writes of local variables for later use
    this.recordStatistic(symbol, node.isAssignTarget() ? Skew.Resolving.SymbolStatistic.WRITE : Skew.Resolving.SymbolStatistic.READ);

    // Forbid referencing a base class global or constructor function from a derived class
    if (enclosingFunction !== null && Skew.Resolving.Resolver.isBaseGlobalReference(enclosingFunction.symbol.parent, symbol)) {
      this.log.semanticErrorUndeclaredSymbol(node.range, name);
      return;
    }

    // Automatically insert "self." before instance symbols
    if (Skew.SymbolKind.isOnInstances(symbol.kind)) {
      var variable = enclosingFunction !== null ? enclosingFunction.symbol.self : null;

      if (variable !== null) {
        node.withChildren([Skew.Node.createSymbolReference(variable)]).kind = Skew.NodeKind.DOT;
      }

      else {
        this.log.semanticErrorMemberUnexpectedInstance(node.range, symbol.name);
      }
    }

    // Type parameters for objects may only be used in certain circumstances
    else if (symbol.kind === Skew.SymbolKind.PARAMETER_OBJECT) {
      var parent = scope;
      var isValid = false;
      var stop = false;

      while (parent !== null) {
        switch (parent.kind()) {
          case Skew.ScopeKind.OBJECT: {
            isValid = parent.asObjectScope().symbol === symbol.parent;
            stop = true;
            break;
          }

          case Skew.ScopeKind.FUNCTION: {
            var $function = parent.asFunctionScope().symbol;

            if ($function.kind !== Skew.SymbolKind.FUNCTION_LOCAL) {
              isValid = $function.parent === symbol.parent;
              stop = true;
            }
            break;
          }

          case Skew.ScopeKind.VARIABLE: {
            var variable1 = parent.asVariableScope().symbol;
            isValid = variable1.kind === Skew.SymbolKind.VARIABLE_INSTANCE && variable1.parent === symbol.parent;
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
        this.log.semanticErrorMemberUnexpectedTypeParameter(node.range, symbol.name);
      }
    }

    node.symbol = symbol;
    node.resolvedType = symbol.resolvedType;
    this.automaticallyCallGetter(node, scope);
  };

  Skew.Resolving.Resolver.prototype.resolveParameterize = function(node, scope) {
    var value = node.parameterizeValue();
    this.resolveNode(value, scope, null);

    // Resolve parameter types
    var substitutions = [];
    var count = node.children.length - 1 | 0;

    for (var i = 0, count1 = count; i < count1; ++i) {
      var child = node.children[i + 1 | 0];
      this.resolveAsParameterizedType(child, scope);
      substitutions.push(child.resolvedType);
    }

    // Check for type parameters
    var type = value.resolvedType;
    var parameters = type.parameters();

    if (parameters === null || type.isParameterized()) {
      if (type !== Skew.Type.DYNAMIC) {
        this.log.semanticErrorCannotParameterize(node.range, type);
      }

      value.resolvedType = Skew.Type.DYNAMIC;
      return;
    }

    // Check parameter count
    var expected = parameters.length;

    if (count !== expected) {
      this.log.semanticErrorParameterCount(node.internalRangeOrRange(), expected, count);
      value.resolvedType = Skew.Type.DYNAMIC;
      return;
    }

    // Make sure all parameters have types
    for (var i1 = 0, list = parameters, count2 = list.length; i1 < count2; ++i1) {
      var parameter = list[i1];
      this.initializeSymbol(parameter);
    }

    // Include the symbol for use with Node.isType
    node.resolvedType = this.cache.substitute(type, this.cache.mergeEnvironments(type.environment, this.cache.createEnvironment(parameters, substitutions), null));
    node.symbol = value.symbol;
  };

  Skew.Resolving.Resolver.prototype.resolveSuper = function(node, scope) {
    var $function = scope.findEnclosingFunction();
    var symbol = $function === null ? null : $function.symbol;
    var overridden = symbol === null ? null : symbol.overloaded !== null ? symbol.overloaded.overridden : symbol.overridden;

    if (overridden === null) {
      this.log.semanticErrorBadSuper(node.range);
      return;
    }

    // Calling a static method doesn't need special handling
    if (overridden.kind === Skew.SymbolKind.FUNCTION_GLOBAL) {
      node.kind = Skew.NodeKind.NAME;
    }

    node.resolvedType = overridden.resolvedType;
    node.symbol = overridden;
    this.automaticallyCallGetter(node, scope);
  };

  Skew.Resolving.Resolver.prototype.resolveUnary = function(node, scope) {
    this.resolveOperatorOverload(node, scope);
  };

  Skew.Resolving.Resolver.prototype.resolveBinary = function(node, scope) {
    var kind = node.kind;
    var left = node.binaryLeft();
    var right = node.binaryRight();

    // Special-case the equality operators
    if (kind === Skew.NodeKind.EQUAL || kind === Skew.NodeKind.NOT_EQUAL) {
      if (Skew.Resolving.Resolver.needsTypeContext(left)) {
        this.resolveAsParameterizedExpression(right, scope);
        this.resolveAsParameterizedExpressionWithTypeContext(left, scope, right.resolvedType);
      }

      else if (Skew.Resolving.Resolver.needsTypeContext(right)) {
        this.resolveAsParameterizedExpression(left, scope);
        this.resolveAsParameterizedExpressionWithTypeContext(right, scope, left.resolvedType);
      }

      else {
        this.resolveAsParameterizedExpression(left, scope);
        this.resolveAsParameterizedExpression(right, scope);
      }

      // The two types must be compatible
      var commonType = this.cache.commonImplicitType(left.resolvedType, right.resolvedType);

      if (commonType !== null) {
        node.resolvedType = this.cache.boolType;
      }

      else {
        this.log.semanticErrorNoCommonType(node.range, left.resolvedType, right.resolvedType);
      }

      return;
    }

    // Special-case assignment since it's not overridable
    if (kind === Skew.NodeKind.ASSIGN) {
      this.resolveAsParameterizedExpression(left, scope);

      // Automatically call setters
      if (left.symbol !== null && left.symbol.isSetter()) {
        node.become(Skew.Node.createCall(left.replaceWithNull(), [right.replaceWithNull()]).withRange(node.range).withInternalRange(right.range));
        this.resolveAsParameterizedExpression(node, scope);
      }

      // Resolve the right side using type context from the left side
      else {
        this.resolveAsParameterizedExpressionWithConversion(right, scope, left.resolvedType);
        node.resolvedType = left.resolvedType;
        this.checkStorage(left, scope);
      }

      return;
    }

    // Special-case short-circuit logical operators since they aren't overridable
    if (kind === Skew.NodeKind.LOGICAL_AND || kind === Skew.NodeKind.LOGICAL_OR) {
      this.resolveAsParameterizedExpressionWithConversion(left, scope, this.cache.boolType);
      this.resolveAsParameterizedExpressionWithConversion(right, scope, this.cache.boolType);
      node.resolvedType = this.cache.boolType;
      return;
    }

    this.resolveOperatorOverload(node, scope);
  };

  Skew.Resolving.Resolver.prototype.resolveIndex = function(node, scope) {
    this.resolveOperatorOverload(node, scope);
  };

  Skew.Resolving.Resolver.prototype.resolveOperatorOverload = function(node, scope) {
    // The order of operands are reversed for the "in" operator
    var kind = node.kind;
    var reverseBinaryOrder = kind === Skew.NodeKind.IN;
    var target = node.children[reverseBinaryOrder | 0];
    var other = Skew.NodeKind.isBinary(kind) ? node.children[1 - (reverseBinaryOrder | 0) | 0] : null;

    // Allow "foo in [.FOO, .BAR]"
    if (kind === Skew.NodeKind.IN && target.kind === Skew.NodeKind.INITIALIZER_LIST && !Skew.Resolving.Resolver.needsTypeContext(other)) {
      this.resolveAsParameterizedExpression(other, scope);
      this.resolveAsParameterizedExpressionWithTypeContext(target, scope, other.resolvedType !== Skew.Type.DYNAMIC ? this.cache.createListType(other.resolvedType) : null);
    }

    // Resolve just the target since the other arguments may need type context from overload resolution
    else {
      this.resolveAsParameterizedExpression(target, scope);
    }

    // Check for a valid storage location even for overloadable operators
    if (Skew.NodeKind.isAssign(kind)) {
      this.checkStorage(target, scope);
    }

    // Can't do overload resolution on the dynamic type
    var type = target.resolvedType;

    if (type === Skew.Type.DYNAMIC) {
      this.resolveChildrenAsParameterizedExpressions(node, scope);
      return;
    }

    // Check if the operator can be overridden at all
    var info = Skew.operatorInfo[kind];

    if (info.kind !== Skew.OperatorKind.OVERRIDABLE) {
      this.log.semanticErrorUnknownMemberSymbol(node.internalRangeOrRange(), info.text, type);
      this.resolveChildrenAsParameterizedExpressions(node, scope);
      return;
    }

    // Avoid infinite expansion
    var isComparison = Skew.NodeKind.isBinaryComparison(kind);
    var isString = type === this.cache.stringType;

    if (isComparison && (isString || this.cache.isNumeric(type))) {
      this.resolveAsParameterizedExpression(other, scope);

      if (isString ? other.resolvedType === this.cache.stringType : this.cache.isNumeric(other.resolvedType)) {
        this.resolveChildrenAsParameterizedExpressions(node, scope);
        node.resolvedType = this.cache.boolType;
        return;
      }
    }

    // Auto-convert int to double when it appears as the target
    if (other !== null && type === this.cache.intType) {
      this.resolveAsParameterizedExpression(other, scope);

      if (other.resolvedType === this.cache.doubleType) {
        this.checkConversion(target, this.cache.doubleType, Skew.Resolving.ConversionKind.IMPLICIT);
        type = this.cache.doubleType;
      }
    }

    // Find the operator method
    var name = isComparison ? "<=>" : info.text;
    var symbol = this.findMember(type, name);

    if (symbol === null) {
      this.log.semanticErrorUnknownMemberSymbol(node.internalRangeOrRange(), name, type);
      this.resolveChildrenAsParameterizedExpressions(node, scope);
      return;
    }

    var symbolType = this.cache.substitute(symbol.resolvedType, type.environment);

    // Resolve the overload now so the symbol's properties can be inspected
    if (Skew.SymbolKind.isOverloadedFunction(symbol.kind)) {
      if (reverseBinaryOrder) {
        node.children.reverse();
      }

      symbolType = this.resolveOverloadedFunction(node.internalRangeOrRange(), node.children, scope, symbolType);

      if (reverseBinaryOrder) {
        node.children.reverse();
      }

      if (symbolType === null) {
        this.resolveChildrenAsParameterizedExpressions(node, scope);
        return;
      }

      symbol = symbolType.symbol;
    }

    node.symbol = symbol;
    this.checkAccess(node, node.internalRangeOrRange(), scope);

    // Don't replace the operator with a call if it's just used for type checking
    if (symbol.isImported() && !symbol.isRenamed()) {
      if (reverseBinaryOrder) {
        node.children.reverse();
      }

      if (!this.resolveFunctionCall(node, scope, symbolType)) {
        this.resolveChildrenAsParameterizedExpressions(node, scope);
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

    children[0] = new Skew.Node(Skew.NodeKind.DOT).withContent(new Skew.StringContent(name)).withChildren([children[0]]).withSymbol(symbol).withRange(node.internalRangeOrRange());

    // Implement the logic for the "<=>" operator
    if (isComparison) {
      var call = new Skew.Node(Skew.NodeKind.CALL).withChildren(children).withRange(node.range);
      node.appendChild(call);
      node.appendChild(new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.IntContent(0)));
      node.resolvedType = this.cache.boolType;
      this.resolveFunctionCall(call, scope, symbolType);
      return;
    }

    // All other operators are just normal method calls
    node.kind = Skew.NodeKind.CALL;
    node.withChildren(children);
    this.resolveFunctionCall(node, scope, symbolType);
  };

  Skew.Resolving.Resolver.prototype.automaticallyCallGetter = function(node, scope) {
    var symbol = node.symbol;

    if (symbol === null) {
      return;
    }

    var kind = symbol.kind;
    var parent = node.parent;

    // The check for getters is complicated by overloaded functions
    if (!symbol.isGetter() && Skew.SymbolKind.isOverloadedFunction(kind) && (!Skew.Resolving.Resolver.isCallValue(node) || parent.children.length === 1)) {
      var overloaded = symbol.asOverloadedFunctionSymbol();

      for (var i = 0, list = overloaded.symbols, count = list.length; i < count; ++i) {
        var getter = list[i];

        // Just return the first getter assuming errors for duplicate getters
        // were already logged when the overloaded symbol was initialized
        if (getter.isGetter()) {
          node.resolvedType = this.cache.substitute(getter.resolvedType, node.resolvedType.environment);
          node.symbol = getter;
          symbol = getter;
          break;
        }
      }
    }

    this.checkAccess(node, node.internalRangeOrRange(), scope);

    // Automatically wrap the getter in a call expression
    if (symbol.isGetter()) {
      var value = new Skew.Node(Skew.NodeKind.NULL);
      value.become(node);
      node.become(Skew.Node.createCall(value, []).withRange(node.range));
      this.resolveAsParameterizedExpression(node, scope);
    }

    // Forbid bare function references
    else if (node.resolvedType !== Skew.Type.DYNAMIC && Skew.SymbolKind.isFunctionOrOverloadedFunction(kind) && kind !== Skew.SymbolKind.FUNCTION_ANNOTATION && !Skew.Resolving.Resolver.isCallValue(node) && (parent === null || parent.kind !== Skew.NodeKind.PARAMETERIZE || !Skew.Resolving.Resolver.isCallValue(parent))) {
      this.log.semanticErrorMustCallFunction(node.internalRangeOrRange(), symbol.name);
      node.resolvedType = Skew.Type.DYNAMIC;
    }
  };

  Skew.Resolving.Resolver.shouldCheckForSetter = function(node) {
    return node.parent !== null && node.parent.kind === Skew.NodeKind.ASSIGN && node === node.parent.binaryLeft();
  };

  Skew.Resolving.Resolver.isVoidExpressionUsed = function(node) {
    // Check for a null parent to handle variable initializers
    var parent = node.parent;
    return parent === null || parent.kind !== Skew.NodeKind.EXPRESSION && !parent.isImplicitReturn() && (parent.kind !== Skew.NodeKind.ANNOTATION || node !== parent.annotationValue()) && (parent.kind !== Skew.NodeKind.FOR || node !== parent.forUpdate());
  };

  Skew.Resolving.Resolver.isValidVariableType = function(type) {
    return type !== Skew.Type.NULL && (type.kind !== Skew.TypeKind.SYMBOL || !Skew.SymbolKind.isFunctionOrOverloadedFunction(type.symbol.kind));
  };

  Skew.Resolving.Resolver.isBaseGlobalReference = function(parent, member) {
    return parent !== null && parent.kind === Skew.SymbolKind.OBJECT_CLASS && Skew.SymbolKind.isGlobalReference(member.kind) && member.parent !== parent && member.parent.kind === Skew.SymbolKind.OBJECT_CLASS && parent.asObjectSymbol().hasBaseClass(member.parent);
  };

  Skew.Resolving.Resolver.isCallValue = function(node) {
    var parent = node.parent;
    return parent !== null && parent.kind === Skew.NodeKind.CALL && node === parent.callValue();
  };

  Skew.Resolving.Resolver.needsTypeContext = function(node) {
    return node.kind === Skew.NodeKind.DOT && node.dotTarget() === null || node.kind === Skew.NodeKind.HOOK && Skew.Resolving.Resolver.needsTypeContext(node.hookTrue()) && Skew.Resolving.Resolver.needsTypeContext(node.hookFalse()) || Skew.NodeKind.isInitializer(node.kind);
  };

  Skew.Resolving.Resolver.ensureFunctionIsOverloaded = function(symbol) {
    if (symbol.overloaded === null) {
      var overloaded = new Skew.OverloadedFunctionSymbol(Skew.Merging.overloadedKind(symbol.kind), symbol.name, [symbol]);
      overloaded.parent = symbol.parent;
      overloaded.scope = overloaded.parent.scope;
      symbol.overloaded = overloaded;
      overloaded.scope.asObjectScope().symbol.members[symbol.name] = overloaded;
    }
  };

  Skew.Resolving.Resolver.GuardMergingFailure = function() {
  };

  Skew.Resolving.ConstantResolver = function(resolver) {
    Skew.Folding.ConstantLookup.call(this);
    this.map = Object.create(null);
    this.resolver = resolver;
  };

  __extends(Skew.Resolving.ConstantResolver, Skew.Folding.ConstantLookup);

  Skew.Resolving.ConstantResolver.prototype.constantForSymbol = function(symbol) {
    if (symbol.id in this.map) {
      return this.map[symbol.id];
    }

    this.resolver.initializeSymbol(symbol);
    var constant = null;
    var value = symbol.value;

    if (symbol.isConst() && value !== null) {
      this.resolver.constantFolder.foldConstants(value);

      if (value.kind === Skew.NodeKind.CONSTANT) {
        constant = value.content;
      }
    }

    this.map[symbol.id] = constant;
    return constant;
  };

  Skew.ScopeKind = {
    FUNCTION: 0,
    LOCAL: 1,
    OBJECT: 2,
    VARIABLE: 3
  };

  Skew.Scope = function(parent) {
    this.parent = parent;
    this.used = null;
  };

  Skew.Scope.prototype.asObjectScope = function() {
    assert(this.kind() === Skew.ScopeKind.OBJECT);
    return this;
  };

  Skew.Scope.prototype.asFunctionScope = function() {
    assert(this.kind() === Skew.ScopeKind.FUNCTION);
    return this;
  };

  Skew.Scope.prototype.asVariableScope = function() {
    assert(this.kind() === Skew.ScopeKind.VARIABLE);
    return this;
  };

  Skew.Scope.prototype.asLocalScope = function() {
    assert(this.kind() === Skew.ScopeKind.LOCAL);
    return this;
  };

  Skew.Scope.prototype.findEnclosingFunctionOrLambda = function() {
    var scope = this;

    while (scope !== null) {
      if (scope.kind() === Skew.ScopeKind.FUNCTION) {
        return scope.asFunctionScope();
      }

      scope = scope.parent;
    }

    return null;
  };

  Skew.Scope.prototype.findEnclosingFunction = function() {
    var scope = this;

    while (scope !== null) {
      if (scope.kind() === Skew.ScopeKind.FUNCTION && scope.asFunctionScope().symbol.kind !== Skew.SymbolKind.FUNCTION_LOCAL) {
        return scope.asFunctionScope();
      }

      scope = scope.parent;
    }

    return null;
  };

  Skew.Scope.prototype.findEnclosingLoop = function() {
    var scope = this;

    while (scope !== null && scope.kind() === Skew.ScopeKind.LOCAL) {
      if (scope.asLocalScope().type === Skew.LocalType.LOOP) {
        return scope.asLocalScope();
      }

      scope = scope.parent;
    }

    return null;
  };

  Skew.Scope.prototype.generateName = function(prefix) {
    var count = 0;
    var name = prefix;

    while (true) {
      if (this.find(name) === null && (this.used === null || !(name in this.used))) {
        this.reserveName(name, null);
        return name;
      }

      ++count;
      name = prefix + count.toString();
    }

    return prefix;
  };

  Skew.Scope.prototype.reserveName = function(name, symbol) {
    if (this.used === null) {
      this.used = Object.create(null);
    }

    if (!(name in this.used)) {
      this.used[name] = symbol;
    }
  };

  Skew.ObjectScope = function(parent, symbol) {
    Skew.Scope.call(this, parent);
    this.symbol = symbol;
  };

  __extends(Skew.ObjectScope, Skew.Scope);

  Skew.ObjectScope.prototype.kind = function() {
    return Skew.ScopeKind.OBJECT;
  };

  Skew.ObjectScope.prototype.find = function(name) {
    var check = this.symbol;

    while (check !== null) {
      var result = in_StringMap.get(check.members, name, null);

      if (result !== null) {
        return result;
      }

      check = check.baseClass;
    }

    return this.parent !== null ? this.parent.find(name) : null;
  };

  Skew.FunctionScope = function(parent, symbol) {
    Skew.Scope.call(this, parent);
    this.symbol = symbol;
    this.parameters = Object.create(null);
  };

  __extends(Skew.FunctionScope, Skew.Scope);

  Skew.FunctionScope.prototype.kind = function() {
    return Skew.ScopeKind.FUNCTION;
  };

  Skew.FunctionScope.prototype.find = function(name) {
    var result = in_StringMap.get(this.parameters, name, null);
    return result !== null ? result : this.parent !== null ? this.parent.find(name) : null;
  };

  Skew.VariableScope = function(parent, symbol) {
    Skew.Scope.call(this, parent);
    this.symbol = symbol;
  };

  __extends(Skew.VariableScope, Skew.Scope);

  Skew.VariableScope.prototype.kind = function() {
    return Skew.ScopeKind.VARIABLE;
  };

  Skew.VariableScope.prototype.find = function(name) {
    return this.parent !== null ? this.parent.find(name) : null;
  };

  Skew.LocalType = {
    LOOP: 0,
    NORMAL: 1
  };

  Skew.LocalScope = function(parent, type) {
    Skew.Scope.call(this, parent);
    this.locals = Object.create(null);
    this.type = type;
  };

  __extends(Skew.LocalScope, Skew.Scope);

  Skew.LocalScope.prototype.kind = function() {
    return Skew.ScopeKind.LOCAL;
  };

  Skew.LocalScope.prototype.find = function(name) {
    var result = in_StringMap.get(this.locals, name, null);
    return result !== null ? result : this.parent !== null ? this.parent.find(name) : null;
  };

  Skew.LocalScope.prototype.define = function(symbol, log) {
    symbol.scope = this;

    // Check for duplicates
    var other = in_StringMap.get(this.locals, symbol.name, null);

    if (other !== null) {
      log.semanticErrorDuplicateSymbol(symbol.range, symbol.name, other.range);
      return;
    }

    // Check for shadowing
    var scope = this.parent;

    while (scope.kind() === Skew.ScopeKind.LOCAL) {
      var local = in_StringMap.get(scope.asLocalScope().locals, symbol.name, null);

      if (local !== null) {
        log.semanticErrorShadowedSymbol(symbol.range, symbol.name, local.range);
        return;
      }

      scope = scope.parent;
    }

    scope.reserveName(symbol.name, symbol);
    this.locals[symbol.name] = symbol;
  };

  Skew.ShakingMode = {
    USE_TYPES: 0,
    IGNORE_TYPES: 1
  };

  // This stores a mapping from every symbol to its immediate dependencies and
  // uses that to provide a mapping from a subset of symbols to their complete
  // dependencies. This is useful for dead code elimination.
  Skew.UsageGraph = function(global, mode) {
    this.context = null;
    this.currentUsages = null;
    this.overridesForSymbol = Object.create(null);
    this.usages = Object.create(null);
    this.mode = mode;
    this.visitObject(global);
    this.changeContext(null);
  };

  Skew.UsageGraph.prototype.usagesForSymbols = function(symbols) {
    var combinedUsages = Object.create(null);
    var stack = [];
    in_List.append1(stack, symbols);

    // Iterate until a fixed point is reached
    while (!(stack.length === 0)) {
      var overridesToCheck = [];

      // Follow immediate dependency links
      while (!(stack.length === 0)) {
        var symbol = stack.pop();

        if (!(symbol.id in combinedUsages)) {
          combinedUsages[symbol.id] = symbol;
          var symbolUsages = in_IntMap.get(this.usages, symbol.id, null);

          if (symbolUsages !== null) {
            in_List.append1(stack, symbolUsages);
          }

          if (Skew.SymbolKind.isFunction(symbol.kind)) {
            var overridden = symbol.asFunctionSymbol().overridden;
            var overrides = in_IntMap.get(this.overridesForSymbol, symbol.id, null);

            // Automatically include all overridden functions in case the use
            // of this type is polymorphic, which is a conservative estimate
            if (overridden !== null) {
              stack.push(overridden);
            }

            // Check function overrides after everything settles
            if (overrides !== null) {
              in_List.append1(overridesToCheck, overrides);
            }
          }
        }
      }

      // Add overrides for all types that are currently included. Types that
      // aren't included shouldn't ever be constructed and so encountering one
      // should be impossible.
      for (var i = 0, list = overridesToCheck, count = list.length; i < count; ++i) {
        var override = list[i];

        if (override.parent.id in combinedUsages) {
          stack.push(override);
        }
      }
    }

    return combinedUsages;
  };

  Skew.UsageGraph.prototype.changeContext = function(symbol) {
    if (this.context !== null) {
      this.usages[this.context.id] = in_IntMap.values(this.currentUsages);
    }

    this.currentUsages = Object.create(null);

    if (symbol !== null) {
      this.currentUsages[symbol.id] = symbol;
    }

    this.context = symbol;
  };

  Skew.UsageGraph.prototype.recordUsage = function(symbol) {
    if (!Skew.SymbolKind.isLocal(symbol.kind)) {
      this.currentUsages[symbol.id] = symbol;
    }
  };

  Skew.UsageGraph.prototype.visitObject = function(symbol) {
    for (var i = 0, list = symbol.objects, count = list.length; i < count; ++i) {
      var object = list[i];
      this.changeContext(object);
      this.recordUsage(symbol);

      if (object.baseClass !== null) {
        this.recordUsage(object.baseClass);
      }

      this.visitObject(object);
    }

    for (var i1 = 0, list1 = symbol.functions, count1 = list1.length; i1 < count1; ++i1) {
      var $function = list1[i1];
      this.changeContext($function);
      this.recordUsage(symbol);
      this.visitFunction($function);

      // Remember which functions are overridden for later
      if ($function.overridden !== null) {
        var overrides = in_IntMap.get(this.overridesForSymbol, $function.overridden.id, null);

        if (overrides === null) {
          overrides = [];
          this.overridesForSymbol[$function.overridden.id] = overrides;
        }

        overrides.push($function);
      }
    }

    for (var i2 = 0, list2 = symbol.variables, count2 = list2.length; i2 < count2; ++i2) {
      var variable = list2[i2];
      this.changeContext(variable);
      this.recordUsage(symbol);
      this.visitVariable(variable);
    }
  };

  Skew.UsageGraph.prototype.visitFunction = function(symbol) {
    for (var i = 0, list = symbol.$arguments, count = list.length; i < count; ++i) {
      var argument = list[i];
      this.visitVariable(argument);
    }

    this.visitType(symbol.resolvedType.returnType);
    this.visitNode(symbol.block);
  };

  Skew.UsageGraph.prototype.visitVariable = function(symbol) {
    this.visitType(symbol.resolvedType);
    this.visitNode(symbol.value);
  };

  Skew.UsageGraph.prototype.visitNode = function(node) {
    if (node === null) {
      return;
    }

    var children = node.children;

    if (children !== null) {
      for (var i = 0, list = children, count = list.length; i < count; ++i) {
        var child = list[i];
        this.visitNode(child);
      }
    }

    if (node.symbol !== null) {
      this.recordUsage(node.symbol);
    }

    switch (node.kind) {
      case Skew.NodeKind.LAMBDA: {
        var $function = node.symbol.asFunctionSymbol();

        for (var i1 = 0, list1 = $function.$arguments, count1 = list1.length; i1 < count1; ++i1) {
          var argument = list1[i1];
          this.visitVariable(argument);
        }

        this.visitType($function.resolvedType.returnType);
        break;
      }

      case Skew.NodeKind.VAR: {
        this.visitType(node.symbol.asVariableSymbol().resolvedType);
        break;
      }
    }
  };

  Skew.UsageGraph.prototype.visitType = function(type) {
    if (this.mode === Skew.ShakingMode.USE_TYPES && type !== null && type.symbol !== null) {
      this.recordUsage(type.symbol);

      // This should be a tree too, so infinite loops should not happen
      if (type.isParameterized()) {
        for (var i = 0, list = type.substitutions, count = list.length; i < count; ++i) {
          var substitution = list[i];
          this.visitType(substitution);
        }
      }
    }
  };

  Skew.Shaking = {};

  Skew.Shaking.collectImportedOrExportedSymbols = function(symbol, symbols, entryPoint) {
    for (var i = 0, list = symbol.objects, count = list.length; i < count; ++i) {
      var object = list[i];
      Skew.Shaking.collectImportedOrExportedSymbols(object, symbols, entryPoint);

      if (object.isImportedOrExported()) {
        symbols.push(object);
      }
    }

    for (var i1 = 0, list1 = symbol.functions, count1 = list1.length; i1 < count1; ++i1) {
      var $function = list1[i1];

      if ($function.isImportedOrExported() || $function === entryPoint) {
        symbols.push($function);
      }
    }

    for (var i2 = 0, list2 = symbol.variables, count2 = list2.length; i2 < count2; ++i2) {
      var variable = list2[i2];

      if (variable.isImportedOrExported()) {
        symbols.push(variable);
      }
    }
  };

  Skew.Shaking.removeUnusedSymbols = function(symbol, usages) {
    in_List.removeIf(symbol.objects, function(object) {
      return !(object.id in usages);
    });
    in_List.removeIf(symbol.functions, function($function) {
      return !($function.id in usages);
    });
    in_List.removeIf(symbol.variables, function(variable) {
      return !(variable.id in usages);
    });

    for (var i = 0, list = symbol.objects, count = list.length; i < count; ++i) {
      var object = list[i];
      Skew.Shaking.removeUnusedSymbols(object, usages);
    }
  };

  Skew.TypeKind = {
    LAMBDA: 0,
    SPECIAL: 1,
    SYMBOL: 2
  };

  Skew.Type = function(kind, symbol) {
    this.id = Skew.Type.createID();
    this.kind = kind;
    this.symbol = symbol;
    this.environment = null;
    this.substitutions = null;
    this.argumentTypes = null;
    this.returnType = null;
    this.substitutionCache = null;
  };

  Skew.Type.prototype.parameters = function() {
    return this.symbol === null ? null : Skew.SymbolKind.isObject(this.symbol.kind) ? this.symbol.asObjectSymbol().parameters : Skew.SymbolKind.isFunction(this.symbol.kind) ? this.symbol.asFunctionSymbol().parameters : null;
  };

  Skew.Type.prototype.isParameterized = function() {
    return this.substitutions !== null;
  };

  Skew.Type.prototype.isClass = function() {
    return this.symbol !== null && this.symbol.kind === Skew.SymbolKind.OBJECT_CLASS;
  };

  Skew.Type.prototype.isEnum = function() {
    return this.symbol !== null && this.symbol.kind === Skew.SymbolKind.OBJECT_ENUM;
  };

  // Type parameters are not guaranteed to be nullable since generics are
  // implemented through type erasure and the substituted type may be "int"
  Skew.Type.prototype.isReference = function() {
    return this.symbol === null || !this.symbol.isValueType() && !Skew.SymbolKind.isParameter(this.symbol.kind);
  };

  Skew.Type.prototype.toString = function() {
    if (this.kind === Skew.TypeKind.SYMBOL) {
      if (this.isParameterized()) {
        var name = this.symbol.name + "<";

        for (var i = 0, count = this.substitutions.length; i < count; ++i) {
          if (i !== 0) {
            name += ", ";
          }

          name += this.substitutions[i].toString();
        }

        return name + ">";
      }

      return this.symbol.name;
    }

    if (this.kind === Skew.TypeKind.LAMBDA) {
      var result = "fn(";

      for (var i1 = 0, count1 = this.argumentTypes.length; i1 < count1; ++i1) {
        if (i1 !== 0) {
          result += ", ";
        }

        result += this.argumentTypes[i1].toString();
      }

      return result + (this.returnType !== null ? ") " + this.returnType.toString() : ")");
    }

    return this === Skew.Type.DYNAMIC ? "dynamic" : "null";
  };

  Skew.Type.prototype.baseClass = function() {
    if (this.isClass()) {
      var base = this.symbol.asObjectSymbol().base;

      if (base !== null) {
        return base.resolvedType;
      }
    }

    return null;
  };

  Skew.Type.prototype.hasBaseType = function(type) {
    var base = this.baseClass();
    return base !== null && (base === type || base.hasBaseType(type));
  };

  Skew.Type.initialize = function() {
    if (Skew.Type.DYNAMIC === null) {
      Skew.Type.DYNAMIC = new Skew.Type(Skew.TypeKind.SPECIAL, null);
    }

    if (Skew.Type.NULL === null) {
      Skew.Type.NULL = new Skew.Type(Skew.TypeKind.SPECIAL, null);
    }
  };

  Skew.Type.createID = function() {
    ++Skew.Type.nextID;
    return Skew.Type.nextID;
  };

  Skew.Environment = function(parameters, substitutions) {
    this.id = Skew.Environment.createID();
    this.parameters = parameters;
    this.substitutions = substitutions;
    this.mergeCache = null;
  };

  Skew.Environment.createID = function() {
    ++Skew.Environment.nextID;
    return Skew.Environment.nextID;
  };

  Skew.TypeCache = function() {
    this.boolType = null;
    this.doubleType = null;
    this.intMapType = null;
    this.intType = null;
    this.listType = null;
    this.stringMapType = null;
    this.stringType = null;
    this.entryPointSymbol = null;
    this.environments = Object.create(null);
    this.lambdaTypes = Object.create(null);
  };

  Skew.TypeCache.prototype.loadGlobals = function(log, global) {
    Skew.Type.initialize();
    this.boolType = Skew.TypeCache.loadGlobalClass(log, global, "bool", Skew.Symbol.IS_VALUE_TYPE);
    this.doubleType = Skew.TypeCache.loadGlobalClass(log, global, "double", Skew.Symbol.IS_VALUE_TYPE);
    this.intMapType = Skew.TypeCache.loadGlobalClass(log, global, "IntMap", 0);
    this.intType = Skew.TypeCache.loadGlobalClass(log, global, "int", Skew.Symbol.IS_VALUE_TYPE);
    this.listType = Skew.TypeCache.loadGlobalClass(log, global, "List", 0);
    this.stringMapType = Skew.TypeCache.loadGlobalClass(log, global, "StringMap", 0);
    this.stringType = Skew.TypeCache.loadGlobalClass(log, global, "string", Skew.Symbol.IS_VALUE_TYPE);
  };

  Skew.TypeCache.prototype.isInteger = function(type) {
    return type === this.intType || type.isEnum();
  };

  Skew.TypeCache.prototype.isNumeric = function(type) {
    return this.isInteger(type) || type === this.doubleType;
  };

  Skew.TypeCache.prototype.isList = function(type) {
    return type.symbol === this.listType.symbol;
  };

  Skew.TypeCache.prototype.isIntMap = function(type) {
    return type.symbol === this.intMapType.symbol;
  };

  Skew.TypeCache.prototype.isStringMap = function(type) {
    return type.symbol === this.stringMapType.symbol;
  };

  Skew.TypeCache.prototype.canImplicitlyConvert = function(from, to) {
    if (from === to) {
      return true;
    }

    if (from === Skew.Type.DYNAMIC || to === Skew.Type.DYNAMIC) {
      return true;
    }

    if (from === Skew.Type.NULL && to.isReference()) {
      return true;
    }

    if (from === this.intType && to === this.doubleType) {
      return true;
    }

    if (from.hasBaseType(to)) {
      return true;
    }

    if (from.isEnum() && !to.isEnum() && this.isNumeric(to)) {
      return true;
    }

    return false;
  };

  Skew.TypeCache.prototype.canExplicitlyConvert = function(from, to) {
    if (this.canImplicitlyConvert(from, to)) {
      return true;
    }

    if (this.canCastToNumeric(from) && this.canCastToNumeric(to)) {
      return true;
    }

    if (to.hasBaseType(from)) {
      return true;
    }

    if (to.isEnum() && this.isNumeric(from)) {
      return true;
    }

    return false;
  };

  Skew.TypeCache.prototype.commonImplicitType = function(left, right) {
    // Short-circuit early for identical types
    if (left === right) {
      return left;
    }

    // Dynamic is a hole in the type system
    if (left === Skew.Type.DYNAMIC || right === Skew.Type.DYNAMIC) {
      return Skew.Type.DYNAMIC;
    }

    // Check implicit conversions
    if (this.canImplicitlyConvert(left, right)) {
      return right;
    }

    if (this.canImplicitlyConvert(right, left)) {
      return left;
    }

    // Implement common implicit types for numeric types
    if (this.isNumeric(left) && this.isNumeric(right)) {
      return this.isInteger(left) && this.isInteger(right) ? this.intType : this.doubleType;
    }

    // Check for a common base class
    if (left.isClass() && right.isClass()) {
      return Skew.TypeCache.commonBaseClass(left, right);
    }

    return null;
  };

  Skew.TypeCache.prototype.createListType = function(itemType) {
    return this.substitute(this.listType, this.createEnvironment(this.listType.parameters(), [itemType]));
  };

  Skew.TypeCache.prototype.createIntMapType = function(valueType) {
    return this.substitute(this.intMapType, this.createEnvironment(this.intMapType.parameters(), [valueType]));
  };

  Skew.TypeCache.prototype.createStringMapType = function(valueType) {
    return this.substitute(this.stringMapType, this.createEnvironment(this.stringMapType.parameters(), [valueType]));
  };

  Skew.TypeCache.prototype.createEnvironment = function(parameters, substitutions) {
    assert(parameters.length === substitutions.length);

    // Hash the inputs
    var hash = Skew.TypeCache.hashTypes(Skew.TypeCache.hashParameters(parameters), substitutions);
    var bucket = in_IntMap.get(this.environments, hash, null);

    // Check existing environments in the bucket for a match
    if (bucket !== null) {
      for (var i = 0, list = bucket, count = list.length; i < count; ++i) {
        var existing = list[i];

        if (in_List.isEqualTo(parameters, existing.parameters) && in_List.isEqualTo(substitutions, existing.substitutions)) {
          return existing;
        }
      }
    }

    // Make a new bucket
    else {
      bucket = [];
      this.environments[hash] = bucket;
    }

    // Make a new environment
    var environment = new Skew.Environment(parameters, substitutions);
    bucket.push(environment);
    return environment;
  };

  Skew.TypeCache.prototype.createLambdaType = function(argumentTypes, returnType) {
    var hash = Skew.TypeCache.hashTypes(returnType !== null ? returnType.id : -1, argumentTypes);
    var bucket = in_IntMap.get(this.lambdaTypes, hash, null);

    // Check existing types in the bucket for a match
    if (bucket !== null) {
      for (var i = 0, list = bucket, count = list.length; i < count; ++i) {
        var existing = list[i];

        if (in_List.isEqualTo(argumentTypes, existing.argumentTypes) && returnType === existing.returnType) {
          return existing;
        }
      }
    }

    // Make a new bucket
    else {
      bucket = [];
      this.lambdaTypes[hash] = bucket;
    }

    // Make a new lambda type
    var type = new Skew.Type(Skew.TypeKind.LAMBDA, null);
    type.argumentTypes = argumentTypes;
    type.returnType = returnType;
    bucket.push(type);
    return type;
  };

  Skew.TypeCache.prototype.mergeEnvironments = function(a, b, restrictions) {
    if (a === null) {
      return b;
    }

    if (b === null) {
      return a;
    }

    var parameters = a.parameters.slice();
    var substitutions = this.substituteAll(a.substitutions, b);

    for (var i = 0, count = b.parameters.length; i < count; ++i) {
      var parameter = b.parameters[i];
      var substitution = b.substitutions[i];

      if (!(parameters.indexOf(parameter) !== -1) && (restrictions === null || restrictions.indexOf(parameter) !== -1)) {
        parameters.push(parameter);
        substitutions.push(substitution);
      }
    }

    return this.createEnvironment(parameters, substitutions);
  };

  Skew.TypeCache.prototype.parameterize = function(type) {
    var parameters = type.parameters();

    if (parameters === null) {
      return type;
    }

    assert(!type.isParameterized());
    var substitutions = [];

    for (var i = 0, list = parameters, count = list.length; i < count; ++i) {
      var parameter = list[i];
      substitutions.push(parameter.resolvedType);
    }

    return this.substitute(type, this.createEnvironment(parameters, substitutions));
  };

  Skew.TypeCache.prototype.substituteAll = function(types, environment) {
    var substitutions = [];

    for (var i = 0, list = types, count = list.length; i < count; ++i) {
      var type = list[i];
      substitutions.push(this.substitute(type, environment));
    }

    return substitutions;
  };

  Skew.TypeCache.prototype.substitute = function(type, environment) {
    var existing = type.environment;

    if (environment === null || environment === existing) {
      return type;
    }

    // Merge the type environments (this matters for nested generics). For
    // object types, limit the parameters in the environment to just those
    // on this type and the base type.
    var parameters = type.parameters();

    if (existing !== null) {
      environment = this.mergeEnvironments(existing, environment, type.kind === Skew.TypeKind.SYMBOL && Skew.SymbolKind.isFunctionOrOverloadedFunction(type.symbol.kind) ? null : parameters);
    }

    // Check to see if this has been computed before
    var rootType = type.kind === Skew.TypeKind.SYMBOL ? type.symbol.resolvedType : type;

    if (rootType.substitutionCache === null) {
      rootType.substitutionCache = Object.create(null);
    }

    var substituted = in_IntMap.get(rootType.substitutionCache, environment.id, null);

    if (substituted !== null) {
      return substituted;
    }

    substituted = type;

    if (type.kind === Skew.TypeKind.LAMBDA) {
      var argumentTypes = [];
      var returnType = null;

      // Substitute function arguments
      for (var i = 0, list = type.argumentTypes, count = list.length; i < count; ++i) {
        var argumentType = list[i];
        argumentTypes.push(this.substitute(argumentType, environment));
      }

      // Substitute return type
      if (type.returnType !== null) {
        returnType = this.substitute(type.returnType, environment);
      }

      substituted = this.createLambdaType(argumentTypes, returnType);
    }

    else if (type.kind === Skew.TypeKind.SYMBOL) {
      var symbol = type.symbol;

      // Parameters just need simple substitution
      if (Skew.SymbolKind.isParameter(symbol.kind)) {
        var index = environment.parameters.indexOf(symbol.asParameterSymbol());

        if (index !== -1) {
          substituted = environment.substitutions[index];
        }
      }

      // Symbols with type parameters are more complicated
      // Overloaded functions are also included even though they don't have
      // type parameters because the type environment needs to be bundled
      // for later substitution into individual matched overloads
      else if (parameters !== null || Skew.SymbolKind.isFunctionOrOverloadedFunction(symbol.kind)) {
        substituted = new Skew.Type(Skew.TypeKind.SYMBOL, symbol);
        substituted.environment = environment;

        // Generate type substitutions
        if (parameters !== null) {
          var found = true;

          for (var i1 = 0, list1 = parameters, count1 = list1.length; i1 < count1; ++i1) {
            var parameter = list1[i1];
            found = environment.parameters.indexOf(parameter) !== -1;

            if (!found) {
              break;
            }
          }

          if (found) {
            substituted.substitutions = [];

            for (var i2 = 0, list2 = parameters, count2 = list2.length; i2 < count2; ++i2) {
              var parameter1 = list2[i2];
              substituted.substitutions.push(this.substitute(parameter1.resolvedType, environment));
            }
          }
        }

        // Substitute function arguments
        if (type.argumentTypes !== null) {
          substituted.argumentTypes = [];

          for (var i3 = 0, list3 = type.argumentTypes, count3 = list3.length; i3 < count3; ++i3) {
            var argumentType1 = list3[i3];
            substituted.argumentTypes.push(this.substitute(argumentType1, environment));
          }
        }

        // Substitute return type
        if (type.returnType !== null) {
          substituted.returnType = this.substitute(type.returnType, environment);
        }
      }
    }

    rootType.substitutionCache[environment.id] = substituted;
    return substituted;
  };

  Skew.TypeCache.prototype.canCastToNumeric = function(type) {
    return type === this.intType || type === this.doubleType || type === this.boolType;
  };

  Skew.TypeCache.loadGlobalClass = function(log, global, name, flags) {
    var symbol = in_StringMap.get(global.members, name, null);
    assert(symbol !== null);
    assert(symbol.kind === Skew.SymbolKind.OBJECT_CLASS);
    var type = new Skew.Type(Skew.TypeKind.SYMBOL, symbol.asObjectSymbol());
    symbol.resolvedType = type;
    symbol.flags |= flags;
    return type;
  };

  Skew.TypeCache.hashParameters = function(parameters) {
    var hash = 0;

    for (var i = 0, list = parameters, count = list.length; i < count; ++i) {
      var parameter = list[i];
      hash = Skew.hashCombine(hash, parameter.id);
    }

    return hash;
  };

  Skew.TypeCache.hashTypes = function(hash, types) {
    for (var i = 0, list = types, count = list.length; i < count; ++i) {
      var type = list[i];
      hash = Skew.hashCombine(hash, type.id);
    }

    return hash;
  };

  Skew.TypeCache.commonBaseClass = function(left, right) {
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

  Skew.Option = {
    DEFINE: 0,
    FOLD_CONSTANTS: 1,
    GLOBALIZE_FUNCTIONS: 2,
    HELP: 3,
    INLINE_FUNCTIONS: 4,
    JS_MANGLE: 5,
    JS_MINIFY: 6,
    MESSAGE_LIMIT: 7,
    OUTPUT_DIRECTORY: 8,
    OUTPUT_FILE: 9,
    RELEASE: 10
  };

  Skew.Options = {};

  Skew.Options.Type = {
    BOOL: 0,
    INT: 1,
    STRING: 2,
    STRING_LIST: 3
  };

  Skew.Options.Data = function(parser, type, option, name, description) {
    this.parser = parser;
    this.type = type;
    this.option = option;
    this.name = name;
    this.description = description;
  };

  Skew.Options.Data.prototype.nameText = function() {
    return this.name + (this.type === Skew.Options.Type.BOOL ? "" : this.type === Skew.Options.Type.STRING_LIST ? ":___" : "=___");
  };

  Skew.Options.Data.prototype.aliases = function(names) {
    for (var i = 0, list = names, count = list.length; i < count; ++i) {
      var name = list[i];
      this.parser.map[name] = this;
    }

    return this;
  };

  Skew.Options.Parser = function() {
    this.options = [];
    this.map = Object.create(null);
    this.optionalArguments = Object.create(null);
    this.normalArguments = [];
    this.source = null;
  };

  Skew.Options.Parser.prototype.define = function(type, option, name, description) {
    var data = new Skew.Options.Data(this, type, option, name, description);
    this.map[name] = data;
    this.options.push(data);
    return data;
  };

  Skew.Options.Parser.prototype.nodeForOption = function(option) {
    return in_IntMap.get(this.optionalArguments, option, null);
  };

  Skew.Options.Parser.prototype.boolForOption = function(option, defaultValue) {
    var node = this.nodeForOption(option);
    return node !== null ? node.content.asBool() : defaultValue;
  };

  Skew.Options.Parser.prototype.intForOption = function(option, defaultValue) {
    var node = this.nodeForOption(option);
    return node !== null ? node.content.asInt() : defaultValue;
  };

  Skew.Options.Parser.prototype.rangeForOption = function(option) {
    var node = this.nodeForOption(option);
    return node !== null ? node.range : null;
  };

  Skew.Options.Parser.prototype.rangeListForOption = function(option) {
    var node = this.nodeForOption(option);
    var ranges = [];

    if (node !== null) {
      for (var i = 0, list = node.children, count = list.length; i < count; ++i) {
        var child = list[i];
        ranges.push(child.range);
      }
    }

    return ranges;
  };

  Skew.Options.Parser.prototype.parse = function(log, $arguments) {
    this.source = new Skew.Source("<arguments>", "");
    var ranges = [];

    // Create a source for the arguments to work with the log system. The
    // trailing space is needed to be able to point to the character after
    // the last argument without wrapping onto the next line.
    for (var i1 = 0, list = $arguments, count = list.length; i1 < count; ++i1) {
      var argument = list[i1];
      var needsQuotes = argument.indexOf(" ") !== -1;
      var start = this.source.contents.length + (needsQuotes | 0) | 0;
      ranges.push(new Skew.Range(this.source, start, start + argument.length | 0));
      this.source.contents += needsQuotes ? "'" + argument + "' " : argument + " ";
    }

    // Parse each argument
    for (var i = 0, count1 = $arguments.length; i < count1; ++i) {
      var argument1 = $arguments[i];
      var range = ranges[i];

      // Track all normal arguments separately
      if (argument1 === "" || argument1.charCodeAt(0) !== 45 && !(argument1 in this.map)) {
        this.normalArguments.push(range);
        continue;
      }

      // Parse a flag
      var equals = argument1.indexOf("=");
      var colon = argument1.indexOf(":");
      var separator = equals >= 0 && (colon < 0 || equals < colon) ? equals : colon;
      var name = separator >= 0 ? argument1.slice(0, separator) : argument1;
      var data = in_StringMap.get(this.map, name, null);

      // Check that the flag exists
      if (data === null) {
        log.commandLineErrorBadFlag(range.fromStart(name.length), name);
        continue;
      }

      // Validate the flag data
      var text = argument1.slice(separator + 1 | 0);
      var separatorRange = separator < 0 ? null : range.slice(separator, separator + 1 | 0);
      var textRange = range.fromEnd(text.length);

      switch (data.type) {
        case Skew.Options.Type.BOOL: {
          if (separator < 0) {
            text = "true";
          }

          else if (argument1.charCodeAt(separator) !== 61) {
            log.commandLineErrorExpectedToken(separatorRange, "=", argument1[separator], argument1);
            continue;
          }

          else if (text !== "true" && text !== "false") {
            log.commandLineErrorNonBooleanValue(textRange, text, argument1);
            continue;
          }

          if (data.option in this.optionalArguments) {
            log.commandLineWarningDuplicateFlagValue(textRange, name, this.optionalArguments[data.option].range);
          }

          this.optionalArguments[data.option] = new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.BoolContent(text === "true")).withRange(textRange);
          break;
        }

        case Skew.Options.Type.INT: {
          if (separator < 0) {
            log.commandLineErrorMissingValue(textRange, data.nameText());
          }

          else if (argument1.charCodeAt(separator) !== 61) {
            log.commandLineErrorExpectedToken(separatorRange, "=", argument1[separator], argument1);
          }

          else {
            var box = Skew.Parsing.parseIntLiteral(text);

            if (box === null) {
              log.commandLineErrorNonIntegerValue(textRange, text, argument1);
            }

            else {
              if (data.option in this.optionalArguments) {
                log.commandLineWarningDuplicateFlagValue(textRange, name, this.optionalArguments[data.option].range);
              }

              this.optionalArguments[data.option] = new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.IntContent(box.value)).withRange(textRange);
            }
          }
          break;
        }

        case Skew.Options.Type.STRING: {
          if (separator < 0) {
            log.commandLineErrorMissingValue(textRange, data.nameText());
          }

          else if (argument1.charCodeAt(separator) !== 61) {
            log.commandLineErrorExpectedToken(separatorRange, "=", argument1[separator], argument1);
          }

          else {
            if (data.option in this.optionalArguments) {
              log.commandLineWarningDuplicateFlagValue(textRange, name, this.optionalArguments[data.option].range);
            }

            this.optionalArguments[data.option] = new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.StringContent(text)).withRange(textRange);
          }
          break;
        }

        case Skew.Options.Type.STRING_LIST: {
          if (separator < 0) {
            log.commandLineErrorMissingValue(textRange, data.nameText());
          }

          else if (argument1.charCodeAt(separator) !== 58) {
            log.commandLineErrorExpectedToken(separatorRange, ":", argument1[separator], argument1);
          }

          else {
            var node;

            if (data.option in this.optionalArguments) {
              node = this.optionalArguments[data.option];
            }

            else {
              node = Skew.Node.createInitializer(Skew.NodeKind.INITIALIZER_LIST, []);
              this.optionalArguments[data.option] = node;
            }

            node.appendChild(new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.StringContent(text)).withRange(textRange));
          }
          break;
        }
      }
    }
  };

  Skew.Options.Parser.prototype.usageText = function(wrapWidth) {
    var text = "";
    var columnWidth = 0;

    // Figure out the column width
    for (var i = 0, list = this.options, count = list.length; i < count; ++i) {
      var option = list[i];
      var width = option.nameText().length + 4 | 0;

      if (columnWidth < width) {
        columnWidth = width;
      }
    }

    // Format the options
    var columnText = in_string.repeat(" ", columnWidth);

    for (var i2 = 0, list2 = this.options, count2 = list2.length; i2 < count2; ++i2) {
      var option1 = list2[i2];
      var nameText = option1.nameText();
      var isFirst = true;
      text += "\n  " + nameText + in_string.repeat(" ", (columnWidth - nameText.length | 0) - 2 | 0);

      for (var i1 = 0, list1 = Skew.PrettyPrint.wrapWords(option1.description, wrapWidth - columnWidth | 0), count1 = list1.length; i1 < count1; ++i1) {
        var line = list1[i1];
        text += (isFirst ? "" : columnText) + line + "\n";
        isFirst = false;
      }
    }

    return text + "\n";
  };

  var Unicode = {};

  Unicode.StringIterator = function() {
    this.value = "";
    this.index = 0;
    this.stop = 0;
  };

  Unicode.StringIterator.prototype.reset = function(text, start) {
    this.value = text;
    this.index = start;
    this.stop = text.length;
    return this;
  };

  Unicode.StringIterator.prototype.countCodePointsUntil = function(stop) {
    var count = 0;

    while (this.index < stop && this.nextCodePoint() >= 0) {
      ++count;
    }

    return count;
  };

  Unicode.StringIterator.prototype.nextCodePoint = function() {
    if (this.index >= this.stop) {
      return -1;
    }

    var a = this.value.charCodeAt(this.index);
    ++this.index;

    if (a < 55296) {
      return a;
    }

    if (this.index >= this.stop) {
      return -1;
    }

    var b = this.value.charCodeAt(this.index);
    ++this.index;
    return ((a << 10) + b | 0) + ((65536 - (55296 << 10) | 0) - 56320 | 0) | 0;
  };

  var IO = {};

  IO.readFile = function(path) {
    try {
      var contents = require("fs").readFileSync(path, "utf8");
      return new Box(contents.split("\r\n").join("\n"));
    }

    catch (e) {
    }

    return null;
  };

  IO.writeFile = function(path, contents) {
    try {
      require("fs").writeFileSync(path, contents);
      return true;
    }

    catch (e) {
    }

    return false;
  };

  var Terminal = {};

  Terminal.setColor = function(color) {
    if (process.stdout.isTTY) {
      process.stdout.write("\x1B[0;" + Terminal.colorToEscapeCode[color].toString() + "m");
    }
  };

  Terminal.Color = {
    DEFAULT: 0,
    BOLD: 1,
    GRAY: 2,
    RED: 3,
    GREEN: 4,
    YELLOW: 5,
    BLUE: 6,
    MAGENTA: 7,
    CYAN: 8
  };

  var in_string = {};

  in_string.startsWith = function(self, text) {
    return self.length >= text.length && self.slice(0, text.length) === text;
  };

  in_string.repeat = function(self, times) {
    var result = "";

    for (var i = 0, count1 = times; i < count1; ++i) {
      result += self;
    }

    return result;
  };

  in_string.codePoints = function(self) {
    var codePoints = [];
    var instance = Unicode.StringIterator.INSTANCE;
    instance.reset(self, 0);

    while (true) {
      var codePoint = instance.nextCodePoint();

      if (codePoint < 0) {
        return codePoints;
      }

      codePoints.push(codePoint);
    }
  };

  in_string.fromCodePoints = function(codePoints) {
    var builder = new StringBuilder();

    for (var i = 0, list = codePoints, count1 = list.length; i < count1; ++i) {
      var codePoint = list[i];

      if (codePoint < 65536) {
        builder.append(String.fromCharCode(codePoint));
      }

      else {
        var adjusted = codePoint - 65536 | 0;
        builder.append(String.fromCharCode((adjusted >> 10) + 55296 | 0));
        builder.append(String.fromCharCode((adjusted & (1 << 10) - 1) + 56320 | 0));
      }
    }

    return builder.toString();
  };

  var in_List = {};

  in_List.isEqualTo = function(self, other) {
    if (self.length !== other.length) {
      return false;
    }

    for (var i = 0, count1 = self.length; i < count1; ++i) {
      if (self[i] !== other[i]) {
        return false;
      }
    }

    return true;
  };

  in_List.last = function(self) {
    return self[self.length - 1 | 0];
  };

  in_List.prepend1 = function(self, values) {
    var count = values.length;

    for (var i = 0, count1 = count; i < count1; ++i) {
      self.unshift(values[(count - i | 0) - 1 | 0]);
    }
  };

  in_List.append1 = function(self, values) {
    for (var i = 0, list = values, count1 = list.length; i < count1; ++i) {
      var value = list[i];
      self.push(value);
    }
  };

  in_List.swap = function(self, i, j) {
    var temp = self[i];
    self[i] = self[j];
    self[j] = temp;
  };

  in_List.removeOne = function(self, value) {
    var index = self.indexOf(value);

    if (index >= 0) {
      self.splice(index, 1);
    }
  };

  in_List.removeIf = function(self, callback) {
    var index = 0;

    // Remove elements in place
    for (var i = 0, count1 = self.length; i < count1; ++i) {
      if (!callback(self[i])) {
        if (index < i) {
          self[index] = self[i];
        }

        ++index;
      }
    }

    // Shrink the array to the correct size
    while (index < self.length) {
      self.pop();
    }
  };

  var in_StringMap = {};

  in_StringMap.insert = function(self, key, value) {
    self[key] = value;
    return self;
  };

  in_StringMap.get = function(self, key, value) {
    return key in self ? self[key] : value;
  };

  in_StringMap.clone = function(self) {
    var clone = Object.create(null);

    for (var i = 0, list = Object.keys(self), count1 = list.length; i < count1; ++i) {
      var key = list[i];
      clone[key] = self[key];
    }

    return clone;
  };

  var in_IntMap = {};

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
      values.push(self[key]);
    }

    return values;
  };

  var RELEASE = false;
  Skew.HEX = "0123456789ABCDEF";
  Skew.operatorInfo = in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(Object.create(null), Skew.NodeKind.COMPLEMENT, new Skew.OperatorInfo("~", Skew.Precedence.UNARY_PREFIX, Skew.Associativity.NONE, Skew.OperatorKind.OVERRIDABLE, Skew.ArgumentCount.ZERO)), Skew.NodeKind.DECREMENT, new Skew.OperatorInfo("--", Skew.Precedence.UNARY_PREFIX, Skew.Associativity.NONE, Skew.OperatorKind.OVERRIDABLE, Skew.ArgumentCount.ZERO)), Skew.NodeKind.INCREMENT, new Skew.OperatorInfo("++", Skew.Precedence.UNARY_PREFIX, Skew.Associativity.NONE, Skew.OperatorKind.OVERRIDABLE, Skew.ArgumentCount.ZERO)), Skew.NodeKind.NEGATIVE, new Skew.OperatorInfo("-", Skew.Precedence.UNARY_PREFIX, Skew.Associativity.NONE, Skew.OperatorKind.OVERRIDABLE, Skew.ArgumentCount.ZERO_OR_ONE)), Skew.NodeKind.NOT, new Skew.OperatorInfo("!", Skew.Precedence.UNARY_PREFIX, Skew.Associativity.NONE, Skew.OperatorKind.OVERRIDABLE, Skew.ArgumentCount.ZERO)), Skew.NodeKind.POSITIVE, new Skew.OperatorInfo("+", Skew.Precedence.UNARY_PREFIX, Skew.Associativity.NONE, Skew.OperatorKind.OVERRIDABLE, Skew.ArgumentCount.ZERO_OR_ONE)), Skew.NodeKind.ADD, new Skew.OperatorInfo("+", Skew.Precedence.ADD, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, Skew.ArgumentCount.ZERO_OR_ONE)), Skew.NodeKind.BITWISE_AND, new Skew.OperatorInfo("&", Skew.Precedence.BITWISE_AND, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, Skew.ArgumentCount.ONE)), Skew.NodeKind.BITWISE_OR, new Skew.OperatorInfo("|", Skew.Precedence.BITWISE_OR, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, Skew.ArgumentCount.ONE)), Skew.NodeKind.BITWISE_XOR, new Skew.OperatorInfo("^", Skew.Precedence.BITWISE_XOR, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, Skew.ArgumentCount.ONE)), Skew.NodeKind.COMPARE, new Skew.OperatorInfo("<=>", Skew.Precedence.COMPARE, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, Skew.ArgumentCount.ONE)), Skew.NodeKind.DIVIDE, new Skew.OperatorInfo("/", Skew.Precedence.MULTIPLY, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, Skew.ArgumentCount.ONE)), Skew.NodeKind.EQUAL, new Skew.OperatorInfo("==", Skew.Precedence.EQUAL, Skew.Associativity.LEFT, Skew.OperatorKind.FIXED, Skew.ArgumentCount.ONE)), Skew.NodeKind.GREATER_THAN, new Skew.OperatorInfo(">", Skew.Precedence.COMPARE, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, Skew.ArgumentCount.ONE)), Skew.NodeKind.GREATER_THAN_OR_EQUAL, new Skew.OperatorInfo(">=", Skew.Precedence.COMPARE, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, Skew.ArgumentCount.ONE)), Skew.NodeKind.IN, new Skew.OperatorInfo("in", Skew.Precedence.COMPARE, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, Skew.ArgumentCount.ONE)), Skew.NodeKind.IS, new Skew.OperatorInfo("is", Skew.Precedence.COMPARE, Skew.Associativity.LEFT, Skew.OperatorKind.FIXED, Skew.ArgumentCount.ONE)), Skew.NodeKind.LESS_THAN, new Skew.OperatorInfo("<", Skew.Precedence.COMPARE, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, Skew.ArgumentCount.ONE)), Skew.NodeKind.LESS_THAN_OR_EQUAL, new Skew.OperatorInfo("<=", Skew.Precedence.COMPARE, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, Skew.ArgumentCount.ONE)), Skew.NodeKind.LOGICAL_AND, new Skew.OperatorInfo("&&", Skew.Precedence.LOGICAL_AND, Skew.Associativity.LEFT, Skew.OperatorKind.FIXED, Skew.ArgumentCount.ONE)), Skew.NodeKind.LOGICAL_OR, new Skew.OperatorInfo("||", Skew.Precedence.LOGICAL_OR, Skew.Associativity.LEFT, Skew.OperatorKind.FIXED, Skew.ArgumentCount.ONE)), Skew.NodeKind.MULTIPLY, new Skew.OperatorInfo("*", Skew.Precedence.MULTIPLY, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, Skew.ArgumentCount.ONE)), Skew.NodeKind.NOT_EQUAL, new Skew.OperatorInfo("!=", Skew.Precedence.EQUAL, Skew.Associativity.LEFT, Skew.OperatorKind.FIXED, Skew.ArgumentCount.ONE)), Skew.NodeKind.POWER, new Skew.OperatorInfo("**", Skew.Precedence.UNARY_PREFIX, Skew.Associativity.RIGHT, Skew.OperatorKind.OVERRIDABLE, Skew.ArgumentCount.ONE)), Skew.NodeKind.REMAINDER, new Skew.OperatorInfo("%", Skew.Precedence.MULTIPLY, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, Skew.ArgumentCount.ONE)), Skew.NodeKind.SHIFT_LEFT, new Skew.OperatorInfo("<<", Skew.Precedence.SHIFT, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, Skew.ArgumentCount.ONE)), Skew.NodeKind.SHIFT_RIGHT, new Skew.OperatorInfo(">>", Skew.Precedence.SHIFT, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, Skew.ArgumentCount.ONE)), Skew.NodeKind.SUBTRACT, new Skew.OperatorInfo("-", Skew.Precedence.ADD, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, Skew.ArgumentCount.ZERO_OR_ONE)), Skew.NodeKind.ASSIGN, new Skew.OperatorInfo("=", Skew.Precedence.ASSIGN, Skew.Associativity.RIGHT, Skew.OperatorKind.FIXED, Skew.ArgumentCount.ONE)), Skew.NodeKind.ASSIGN_ADD, new Skew.OperatorInfo("+=", Skew.Precedence.ASSIGN, Skew.Associativity.RIGHT, Skew.OperatorKind.OVERRIDABLE, Skew.ArgumentCount.ONE)), Skew.NodeKind.ASSIGN_BITWISE_AND, new Skew.OperatorInfo("&=", Skew.Precedence.ASSIGN, Skew.Associativity.RIGHT, Skew.OperatorKind.OVERRIDABLE, Skew.ArgumentCount.ONE)), Skew.NodeKind.ASSIGN_BITWISE_OR, new Skew.OperatorInfo("|=", Skew.Precedence.ASSIGN, Skew.Associativity.RIGHT, Skew.OperatorKind.OVERRIDABLE, Skew.ArgumentCount.ONE)), Skew.NodeKind.ASSIGN_BITWISE_XOR, new Skew.OperatorInfo("^=", Skew.Precedence.ASSIGN, Skew.Associativity.RIGHT, Skew.OperatorKind.OVERRIDABLE, Skew.ArgumentCount.ONE)), Skew.NodeKind.ASSIGN_DIVIDE, new Skew.OperatorInfo("/=", Skew.Precedence.ASSIGN, Skew.Associativity.RIGHT, Skew.OperatorKind.OVERRIDABLE, Skew.ArgumentCount.ONE)), Skew.NodeKind.ASSIGN_MULTIPLY, new Skew.OperatorInfo("*=", Skew.Precedence.ASSIGN, Skew.Associativity.RIGHT, Skew.OperatorKind.OVERRIDABLE, Skew.ArgumentCount.ONE)), Skew.NodeKind.ASSIGN_POWER, new Skew.OperatorInfo("**=", Skew.Precedence.ASSIGN, Skew.Associativity.RIGHT, Skew.OperatorKind.OVERRIDABLE, Skew.ArgumentCount.ONE)), Skew.NodeKind.ASSIGN_REMAINDER, new Skew.OperatorInfo("%=", Skew.Precedence.ASSIGN, Skew.Associativity.RIGHT, Skew.OperatorKind.OVERRIDABLE, Skew.ArgumentCount.ONE)), Skew.NodeKind.ASSIGN_SHIFT_LEFT, new Skew.OperatorInfo("<<=", Skew.Precedence.ASSIGN, Skew.Associativity.RIGHT, Skew.OperatorKind.OVERRIDABLE, Skew.ArgumentCount.ONE)), Skew.NodeKind.ASSIGN_SHIFT_RIGHT, new Skew.OperatorInfo(">>=", Skew.Precedence.ASSIGN, Skew.Associativity.RIGHT, Skew.OperatorKind.OVERRIDABLE, Skew.ArgumentCount.ONE)), Skew.NodeKind.ASSIGN_SUBTRACT, new Skew.OperatorInfo("-=", Skew.Precedence.ASSIGN, Skew.Associativity.RIGHT, Skew.OperatorKind.OVERRIDABLE, Skew.ArgumentCount.ONE)), Skew.NodeKind.ASSIGN_INDEX, new Skew.OperatorInfo("[]=", Skew.Precedence.MEMBER, Skew.Associativity.NONE, Skew.OperatorKind.OVERRIDABLE, Skew.ArgumentCount.TWO_OR_MORE)), Skew.NodeKind.INDEX, new Skew.OperatorInfo("[]", Skew.Precedence.MEMBER, Skew.Associativity.NONE, Skew.OperatorKind.OVERRIDABLE, Skew.ArgumentCount.ONE_OR_MORE));
  Skew.argumentCounts = null;
  Skew.yy_accept = [Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.END_OF_FILE, Skew.TokenKind.ERROR, Skew.TokenKind.WHITESPACE, Skew.TokenKind.NEWLINE, Skew.TokenKind.NOT, Skew.TokenKind.ERROR, Skew.TokenKind.COMMENT, Skew.TokenKind.REMAINDER, Skew.TokenKind.BITWISE_AND, Skew.TokenKind.ERROR, Skew.TokenKind.LEFT_PARENTHESIS, Skew.TokenKind.RIGHT_PARENTHESIS, Skew.TokenKind.MULTIPLY, Skew.TokenKind.PLUS, Skew.TokenKind.COMMA, Skew.TokenKind.MINUS, Skew.TokenKind.DOT, Skew.TokenKind.DIVIDE, Skew.TokenKind.INT, Skew.TokenKind.INT, Skew.TokenKind.COLON, Skew.TokenKind.LESS_THAN, Skew.TokenKind.ASSIGN, Skew.TokenKind.GREATER_THAN, Skew.TokenKind.QUESTION_MARK, Skew.TokenKind.ERROR, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.LEFT_BRACKET, Skew.TokenKind.RIGHT_BRACKET, Skew.TokenKind.BITWISE_XOR, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.LEFT_BRACE, Skew.TokenKind.BITWISE_OR, Skew.TokenKind.RIGHT_BRACE, Skew.TokenKind.TILDE, Skew.TokenKind.WHITESPACE, Skew.TokenKind.NEWLINE, Skew.TokenKind.NOT_EQUAL, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.STRING, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.COMMENT, Skew.TokenKind.COMMENT, Skew.TokenKind.ASSIGN_REMAINDER, Skew.TokenKind.LOGICAL_AND, Skew.TokenKind.ASSIGN_BITWISE_AND, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.CHARACTER, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.POWER, Skew.TokenKind.ASSIGN_MULTIPLY, Skew.TokenKind.INCREMENT, Skew.TokenKind.ASSIGN_PLUS, Skew.TokenKind.DECREMENT, Skew.TokenKind.ASSIGN_MINUS, Skew.TokenKind.DOT_DOT, Skew.TokenKind.ASSIGN_DIVIDE, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.INT, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.SHIFT_LEFT, Skew.TokenKind.LESS_THAN_OR_EQUAL, Skew.TokenKind.EQUAL, Skew.TokenKind.ARROW, Skew.TokenKind.GREATER_THAN_OR_EQUAL, Skew.TokenKind.SHIFT_RIGHT, Skew.TokenKind.ANNOTATION, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.INDEX, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.ASSIGN_BITWISE_XOR, Skew.TokenKind.AS, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IF, Skew.TokenKind.IN, Skew.TokenKind.IS, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.ASSIGN_BITWISE_OR, Skew.TokenKind.LOGICAL_OR, Skew.TokenKind.ASSIGN_POWER, Skew.TokenKind.DOUBLE, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.DOUBLE, Skew.TokenKind.INT_BINARY, Skew.TokenKind.INT_OCTAL, Skew.TokenKind.INT_HEX, Skew.TokenKind.ASSIGN_SHIFT_LEFT, Skew.TokenKind.COMPARE, Skew.TokenKind.ASSIGN_SHIFT_RIGHT, Skew.TokenKind.ANNOTATION, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.ASSIGN_INDEX, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.DEF, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.FOR, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.TRY, Skew.TokenKind.VAR, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.CASE, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.ELSE, Skew.TokenKind.ENUM, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.NULL, Skew.TokenKind.OVER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.TRUE, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.LIST, Skew.TokenKind.LIST_NEW, Skew.TokenKind.BREAK, Skew.TokenKind.CATCH, Skew.TokenKind.CLASS, Skew.TokenKind.CONST, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.FALSE, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.SUPER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.THROW, Skew.TokenKind.WHILE, Skew.TokenKind.SET, Skew.TokenKind.SET_NEW, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.RETURN, Skew.TokenKind.SWITCH, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.DEFAULT, Skew.TokenKind.DYNAMIC, Skew.TokenKind.FINALLY, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.CONTINUE, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.INTERFACE, Skew.TokenKind.NAMESPACE, Skew.TokenKind.YY_INVALID_ACTION];
  Skew.yy_ec = [0, 1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 4, 5, 6, 1, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 20, 20, 20, 20, 20, 21, 21, 22, 1, 23, 24, 25, 26, 27, 28, 28, 28, 28, 29, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 31, 32, 33, 34, 30, 1, 35, 36, 37, 38, 39, 40, 30, 41, 42, 30, 43, 44, 45, 46, 47, 48, 30, 49, 50, 51, 52, 53, 54, 55, 56, 30, 57, 58, 59, 60, 1];
  Skew.yy_meta = [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 3, 3, 4, 1, 1, 1, 1, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 1, 1, 1, 1];
  Skew.yy_base = [0, 0, 0, 306, 307, 303, 59, 280, 58, 300, 278, 56, 56, 307, 307, 54, 55, 307, 52, 285, 276, 75, 53, 307, 60, 61, 73, 307, 0, 0, 54, 307, 275, 248, 248, 66, 50, 31, 70, 69, 64, 243, 256, 66, 80, 259, 252, 86, 79, 307, 307, 290, 105, 307, 118, 307, 288, 287, 307, 307, 307, 307, 115, 307, 286, 264, 307, 307, 307, 307, 307, 307, 307, 107, 115, 138, 120, 122, 0, 263, 261, 307, 307, 307, 261, 0, 0, 268, 259, 243, 307, 0, 242, 95, 245, 233, 238, 231, 226, 223, 230, 227, 223, 0, 220, 0, 225, 225, 229, 216, 218, 223, 215, 96, 214, 220, 245, 221, 307, 307, 307, 142, 146, 150, 154, 156, 0, 307, 307, 307, 0, 243, 307, 204, 222, 217, 218, 204, 127, 218, 217, 212, 205, 199, 213, 0, 208, 207, 201, 195, 191, 203, 190, 193, 200, 0, 0, 194, 221, 182, 202, 201, 190, 0, 191, 181, 179, 187, 176, 182, 0, 0, 187, 181, 175, 173, 0, 0, 173, 172, 183, 165, 0, 179, 158, 157, 307, 307, 0, 0, 0, 0, 169, 170, 171, 0, 168, 171, 162, 163, 0, 167, 0, 0, 307, 307, 155, 155, 168, 148, 168, 167, 0, 0, 162, 0, 0, 0, 118, 112, 0, 104, 42, 0, 0, 307, 178, 182, 186, 188, 191, 194, 196];
  Skew.yy_def = [0, 225, 1, 225, 225, 225, 225, 225, 226, 227, 225, 225, 228, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 229, 230, 225, 225, 225, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 225, 225, 225, 225, 225, 225, 225, 226, 225, 226, 227, 225, 225, 225, 225, 228, 225, 228, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 231, 225, 225, 225, 225, 225, 225, 232, 230, 225, 225, 225, 225, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 231, 225, 225, 225, 232, 225, 225, 225, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 225, 225, 225, 225, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 225, 225, 225, 225, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 225, 225, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 0, 225, 225, 225, 225, 225, 225, 225];
  Skew.yy_nxt = [0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 22, 22, 23, 24, 25, 26, 27, 28, 29, 29, 29, 30, 4, 31, 32, 33, 34, 35, 36, 37, 38, 29, 39, 29, 29, 29, 40, 41, 29, 42, 43, 44, 29, 45, 46, 29, 29, 47, 48, 49, 50, 52, 52, 55, 60, 63, 65, 69, 67, 73, 87, 74, 74, 74, 74, 98, 70, 99, 66, 68, 61, 224, 75, 79, 80, 81, 82, 88, 64, 96, 56, 73, 75, 74, 74, 74, 74, 83, 84, 106, 89, 93, 116, 118, 75, 100, 97, 52, 52, 103, 94, 76, 101, 95, 75, 104, 107, 102, 110, 105, 111, 112, 77, 55, 63, 121, 121, 121, 121, 113, 78, 73, 117, 74, 74, 74, 74, 119, 124, 124, 125, 125, 125, 223, 75, 135, 136, 64, 154, 222, 56, 122, 155, 122, 75, 221, 123, 123, 123, 123, 121, 121, 121, 121, 123, 123, 123, 123, 123, 123, 123, 123, 124, 124, 125, 125, 125, 166, 167, 54, 54, 54, 54, 57, 57, 57, 57, 62, 62, 62, 62, 85, 85, 86, 86, 86, 126, 126, 130, 130, 130, 220, 219, 218, 217, 216, 215, 214, 213, 212, 211, 210, 209, 208, 207, 206, 205, 204, 203, 202, 201, 200, 199, 198, 197, 196, 195, 194, 193, 192, 191, 190, 189, 188, 187, 186, 185, 184, 183, 182, 181, 180, 179, 178, 177, 176, 175, 174, 173, 172, 171, 170, 169, 168, 165, 164, 163, 162, 161, 160, 159, 158, 157, 156, 153, 152, 151, 150, 149, 148, 147, 146, 145, 144, 143, 142, 141, 140, 139, 138, 137, 134, 133, 132, 131, 129, 128, 127, 120, 225, 58, 225, 51, 115, 114, 109, 108, 92, 91, 90, 72, 71, 59, 58, 53, 51, 225, 3, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225];
  Skew.yy_chk = [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 6, 6, 8, 11, 12, 15, 18, 16, 22, 30, 22, 22, 22, 22, 37, 18, 37, 15, 16, 11, 222, 22, 24, 24, 25, 25, 30, 12, 36, 8, 21, 22, 21, 21, 21, 21, 26, 26, 40, 30, 35, 47, 48, 21, 38, 36, 52, 52, 39, 35, 21, 38, 35, 21, 39, 40, 38, 43, 39, 43, 44, 21, 54, 62, 73, 73, 73, 73, 44, 21, 74, 47, 74, 74, 74, 74, 48, 76, 76, 77, 77, 77, 221, 74, 93, 93, 62, 113, 219, 54, 75, 113, 75, 74, 218, 75, 75, 75, 75, 121, 121, 121, 121, 122, 122, 122, 122, 123, 123, 123, 123, 124, 124, 125, 125, 125, 138, 138, 226, 226, 226, 226, 227, 227, 227, 227, 228, 228, 228, 228, 229, 229, 230, 230, 230, 231, 231, 232, 232, 232, 214, 211, 210, 209, 208, 207, 206, 201, 199, 198, 197, 196, 194, 193, 192, 185, 184, 183, 181, 180, 179, 178, 175, 174, 173, 172, 169, 168, 167, 166, 165, 164, 162, 161, 160, 159, 158, 157, 154, 153, 152, 151, 150, 149, 148, 147, 146, 144, 143, 142, 141, 140, 139, 137, 136, 135, 134, 133, 131, 117, 116, 115, 114, 112, 111, 110, 109, 108, 107, 106, 104, 102, 101, 100, 99, 98, 97, 96, 95, 94, 92, 89, 88, 87, 84, 80, 79, 65, 64, 57, 56, 51, 46, 45, 42, 41, 34, 33, 32, 20, 19, 10, 9, 7, 5, 3, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225, 225];
  Skew.REMOVE_NEWLINE_BEFORE = in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(Object.create(null), Skew.TokenKind.COLON, 0), Skew.TokenKind.COMMA, 0), Skew.TokenKind.QUESTION_MARK, 0), Skew.TokenKind.RIGHT_BRACKET, 0), Skew.TokenKind.RIGHT_PARENTHESIS, 0);
  Skew.KEEP_NEWLINE_BEFORE = in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(Object.create(null), Skew.TokenKind.ANNOTATION, 0), Skew.TokenKind.CLASS, 0), Skew.TokenKind.COMMENT, 0), Skew.TokenKind.DEF, 0), Skew.TokenKind.INTERFACE, 0), Skew.TokenKind.NAMESPACE, 0), Skew.TokenKind.VAR, 0);
  Skew.REMOVE_NEWLINE_AFTER = in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(Object.create(null), Skew.TokenKind.ARROW, 0), Skew.TokenKind.COLON, 0), Skew.TokenKind.COMMA, 0), Skew.TokenKind.NEWLINE, 0), Skew.TokenKind.QUESTION_MARK, 0), Skew.TokenKind.LEFT_BRACE, 0), Skew.TokenKind.LEFT_BRACKET, 0), Skew.TokenKind.LEFT_PARENTHESIS, 0), Skew.TokenKind.BITWISE_AND, 0), Skew.TokenKind.BITWISE_OR, 0), Skew.TokenKind.BITWISE_XOR, 0), Skew.TokenKind.DIVIDE, 0), Skew.TokenKind.EQUAL, 0), Skew.TokenKind.GREATER_THAN, 0), Skew.TokenKind.GREATER_THAN_OR_EQUAL, 0), Skew.TokenKind.LESS_THAN, 0), Skew.TokenKind.LESS_THAN_OR_EQUAL, 0), Skew.TokenKind.LOGICAL_AND, 0), Skew.TokenKind.LOGICAL_OR, 0), Skew.TokenKind.MINUS, 0), Skew.TokenKind.MULTIPLY, 0), Skew.TokenKind.NOT_EQUAL, 0), Skew.TokenKind.PLUS, 0), Skew.TokenKind.REMAINDER, 0), Skew.TokenKind.SHIFT_LEFT, 0), Skew.TokenKind.SHIFT_RIGHT, 0), Skew.TokenKind.ASSIGN, 0), Skew.TokenKind.ASSIGN_PLUS, 0), Skew.TokenKind.ASSIGN_BITWISE_AND, 0), Skew.TokenKind.ASSIGN_BITWISE_OR, 0), Skew.TokenKind.ASSIGN_BITWISE_XOR, 0), Skew.TokenKind.ASSIGN_DIVIDE, 0), Skew.TokenKind.ASSIGN_MULTIPLY, 0), Skew.TokenKind.ASSIGN_REMAINDER, 0), Skew.TokenKind.ASSIGN_SHIFT_LEFT, 0), Skew.TokenKind.ASSIGN_SHIFT_RIGHT, 0), Skew.TokenKind.ASSIGN_MINUS, 0);
  Skew.NATIVE_LIBRARY = "\nconst RELEASE = false\n\nenum Target {\n  NONE\n  CSHARP\n  JAVASCRIPT\n}\n\nconst TARGET Target = .NONE\n\ndef @deprecated\ndef @deprecated(message string)\ndef @entry\ndef @export\ndef @import\ndef @prefer\ndef @private\ndef @protected\ndef @rename(name string)\ndef @skip\n\n@skip if RELEASE\ndef assert(truth bool)\n\n@import\nnamespace Math {\n  def abs(x double) double\n  def abs(x int) int\n  def acos(x double) double\n  def asin(x double) double\n  def atan(x double) double\n  def atan2(x double, y double) double\n  def ceil(x double) double\n  def cos(x double) double\n  def exp(x double) double\n  def floor(x double) double\n  def log(x double) double\n  def pow(x double, y double) double\n  def random double\n  def round(x double) double\n  def sin(x double) double\n  def sqrt(x double) double\n  def tan(x double) double\n\n  @prefer\n  def max(x double, y double) double\n  def max(x int, y int) int\n\n  @prefer\n  def min(x double, y double) double\n  def min(x int, y int) int\n\n  const E = 2.718281828459045\n  const INFINITY = 1 / 0.0\n  const NAN = 0 / 0.0\n  const PI = 3.141592653589793\n}\n\n@import\nclass bool {\n  def ! bool\n  def toString string\n}\n\n@import\nclass int {\n  def + int\n  def ++\n  def - int\n  def --\n  def toString string\n  def ~ int\n\n  def %(x int) int\n  def &(x int) int\n  def *(x int) int\n  def +(x int) int\n  def -(x int) int\n  def /(x int) int\n  def <<(x int) int\n  def <=>(x int) int\n  def >>(x int) int\n  def ^(x int) int\n  def |(x int) int\n\n  def %=(x int)\n  def &=(x int)\n  def *=(x int)\n  def +=(x int)\n  def -=(x int)\n  def /=(x int)\n  def <<=(x int)\n  def >>=(x int)\n  def ^=(x int)\n  def |=(x int)\n}\n\n@import\nclass double {\n  def + double\n  def ++\n  def - double\n  def --\n  def toString string\n\n  def *(x double) double\n  def **(x double) double\n  def +(x double) double\n  def -(x double) double\n  def /(x double) double\n  def <=>(x double) double\n\n  def **=(x double)\n  def *=(x double)\n  def +=(x double)\n  def -=(x double)\n  def /=(x double)\n\n  def isFinite bool\n  def isNAN bool\n}\n\n@import\nclass string {\n  def +(x string) string\n  def +=(x string)\n  def <=>(x string) int\n  def [](x int) int\n  def codePoints List<int>\n  def codeUnits List<int>\n  def count int\n  @rename(\"EndsWith\") if TARGET == .CSHARP\n  def endsWith(x string) bool\n  def get(x int) string\n  @rename(\"Contains\") if TARGET == .CSHARP\n  def in(x string) bool\n  @rename(\"IndexOf\") if TARGET == .CSHARP\n  def indexOf(x string) int\n  def join(x List<string>) string\n  def lastIndexOf(x string) int\n  def repeat(x int) string\n  @rename(\"Replace\") if TARGET == .CSHARP\n  def replaceAll(before string, after string) string\n  @rename(\"Substring\") if TARGET == .CSHARP\n  def slice(start int) string\n  def slice(start int, end int) string\n  def split(x string) List<string>\n  @rename(\"StartsWith\") if TARGET == .CSHARP\n  def startsWith(x string) bool\n  @rename(\"ToLower\") if TARGET == .CSHARP\n  def toLowerCase string\n  @rename(\"ToUpper\") if TARGET == .CSHARP\n  def toUpperCase string\n}\n\nnamespace string {\n  def fromCodePoint(x int) string\n  def fromCodePoints(x List<int>) string\n  def fromCodeUnit(x int) string\n  def fromCodeUnits(x List<int>) string\n}\n\n@import if TARGET == .CSHARP\nclass StringBuilder {\n  @rename(\"Append\") if TARGET == .CSHARP\n  def append(x string)\n  def new\n  @rename(\"ToString\") if TARGET == .CSHARP\n  def toString string\n}\n\n@import\nclass List<T> {\n  def [...](x T) List<T>\n  def [](x int) T\n  def []=(x int, y T)\n  @rename(\"TrueForAll\") if TARGET == .CSHARP\n  @rename(\"every\") if TARGET == .JAVASCRIPT\n  def all(x fn(T) bool) bool\n  def appendOne(x T)\n  @rename(\"MemberwiseClone\") if TARGET == .CSHARP\n  @rename(\"slice\") if TARGET == .JAVASCRIPT\n  def clone List<T>\n  def count int\n  @rename(\"forEach\") if TARGET == .JAVASCRIPT\n  def each(x fn(T))\n  def filter(x fn(T) bool) List<T>\n  @rename(\"First\") if TARGET == .CSHARP\n  def first T\n  @rename(\"Contains\") if TARGET == .CSHARP\n  def in(x T) bool\n  @rename(\"IndexOf\") if TARGET == .CSHARP\n  def indexOf(x T) int\n  @rename(\"Insert\") if TARGET == .CSHARP\n  def insert(x int, value T)\n  def insert(x int, values List<T>)\n  def isEmpty bool\n  def isEqualTo(other List<T>) bool\n  @rename(\"Last\") if TARGET == .CSHARP\n  def last T\n  @rename(\"LastIndexOf\") if TARGET == .CSHARP\n  def lastIndexOf(x T) int\n  @rename(\"ConvertAll\") if TARGET == .CSHARP\n  def map<R>(x fn(T) R) List<R>\n  def new\n  def removeAll(x T)\n  @rename(\"RemoveAt\") if TARGET == .CSHARP\n  def removeAt(x int)\n  def removeDuplicates\n  @rename(\"shift\") if TARGET == .JAVASCRIPT\n  def removeFirst\n  @rename(\"RemoveAll\") if TARGET == .CSHARP\n  def removeIf(x fn(T) bool)\n  @rename(\"pop\") if TARGET == .JAVASCRIPT\n  def removeLast\n  @rename(\"Remove\") if TARGET == .CSHARP\n  def removeOne(x T)\n  def removeRange(start int, end int)\n  def resize(size int, defaultValue T)\n  @rename(\"Reverse\") if TARGET == .CSHARP\n  def reverse\n  def shuffle\n  def slice(start int) List<T>\n  def slice(start int, end int) List<T>\n  def sort(x fn(T, T) int)\n  def swap(x int, y int)\n  @rename(\"shift\") if TARGET == .JAVASCRIPT\n  def takeFirst T\n  @rename(\"pop\") if TARGET == .JAVASCRIPT\n  def takeLast T\n  def takeRange(start int, end int) List<T>\n\n  @prefer\n  @rename(\"Add\") if TARGET == .CSHARP\n  @rename(\"push\") if TARGET == .JAVASCRIPT\n  def append(x T)\n  @rename(\"AddRange\") if TARGET == .CSHARP\n  def append(x List<T>)\n\n  @prefer\n  @rename(\"unshift\") if TARGET == .JAVASCRIPT\n  def prepend(x T)\n  def prepend(x List<T>)\n\n  # @prefer\n  # def +(x T) List<T>\n  # def +(x List<T>) List<T>\n\n  # @prefer\n  # def +=(x T)\n  # def +=(x List<T>)\n}\n\n@import\nclass StringMap<T> {\n  def [](key string) T\n  def []=(key string, value T)\n  @rename(\"MemberwiseClone\") if TARGET == .CSHARP\n  def clone StringMap<T>\n  @rename(\"Count\") if TARGET == .CSHARP\n  def count int\n  def each(x fn(string, T))\n  def get(key string, defaultValue T) T\n  @rename(\"ContainsKey\") if TARGET == .CSHARP\n  def in(key string) bool\n  def isEmpty bool\n  def keys List<string>\n  def new\n  @rename(\"Remove\") if TARGET == .CSHARP\n  def remove(key string)\n  def values List<T>\n  def {...}(key string, value T) StringMap<T>\n}\n\n@import\nclass IntMap<T> {\n  def [](key int) T\n  def []=(key int, value T)\n  @rename(\"MemberwiseClone\") if TARGET == .CSHARP\n  def clone IntMap<T>\n  @rename(\"Count\") if TARGET == .CSHARP\n  def count int\n  def each(x fn(int, T))\n  def get(key int, defaultValue T) T\n  @rename(\"ContainsKey\") if TARGET == .CSHARP\n  def in(key int) bool\n  def isEmpty bool\n  def keys List<int>\n  def new\n  @rename(\"Remove\") if TARGET == .CSHARP\n  def remove(key int)\n  def values List<T>\n  def {...}(key int, value T) IntMap<T>\n}\n\n@rename(\"Nullable\") if TARGET == .CSHARP\n@import if TARGET == .CSHARP\nclass Box<T> {\n  @rename(\"Value\") if TARGET == .CSHARP\n  var value T\n\n  if TARGET == .CSHARP {\n    def new(value T)\n  }\n}\n";
  Skew.NATIVE_LIBRARY_CS = "\ndef assert(truth bool) {\n  dynamic.Debug.Assert(truth)\n}\n\nclass double {\n  def isFinite bool {\n    return !isNAN && dynamic.double.IsInfinity(self)\n  }\n\n  def isNAN bool {\n    return dynamic.double.IsNaN(self)\n  }\n}\n\nclass string {\n  def count int {\n    return (self as dynamic).Length\n  }\n\n  def get(index int) string {\n    return fromCodeUnit(self[index])\n  }\n\n  def repeat(times int) string {\n    var result = \"\"\n    for i in 0..times {\n      result += self\n    }\n    return result\n  }\n\n  def join(parts List<string>) string {\n    return dynamic.string.Join(self, parts)\n  }\n\n  def slice(start int, end int) string {\n    return (self as dynamic).Substring(start, end - start)\n  }\n}\n\nnamespace string {\n  def fromCodeUnit(x int) string {\n    return dynamic.string.new(x, 1)\n  }\n}\n\nclass List {\n  def isEqualTo(other List<T>) bool {\n    if count != other.count {\n      return false\n    }\n    for i in 0..count {\n      if self[i] != other[i] {\n        return false\n      }\n    }\n    return true\n  }\n\n  def isEmpty bool {\n    return count == 0\n  }\n\n  def count int {\n    return (self as dynamic).Count\n  }\n\n  def prepend(value T) {\n    insert(0, value)\n  }\n\n  def prepend(values List<T>) {\n    var count = values.count\n    for i in 0..count {\n      prepend(values[count - i - 1])\n    }\n  }\n\n  def removeFirst {\n    removeAt(0)\n  }\n\n  def removeLast {\n    removeAt(count - 1)\n  }\n\n  def takeFirst T {\n    var value = first\n    removeFirst\n    return value\n  }\n\n  def takeLast T {\n    var value = last\n    removeLast\n    return value\n  }\n\n  def swap(i int, j int) {\n    var temp = self[i]\n    self[i] = self[j]\n    self[j] = temp\n  }\n}\n\nclass StringMap {\n  def {...}(key string, value T) StringMap<T> {\n    (self as dynamic).Add(key, value)\n    return self\n  }\n\n  def get(key string, value T) T {\n    return key in self ? self[key] : value\n  }\n\n  def keys List<string> {\n    return (self as dynamic).Keys.ToList()\n  }\n\n  def values List<T> {\n    return (self as dynamic).Values.ToList()\n  }\n}\n\nclass IntMap {\n  def {...}(key int, value T) IntMap<T> {\n    (self as dynamic).Add(key, value)\n    return self\n  }\n\n  def get(key int, value T) T {\n    return key in self ? self[key] : value\n  }\n\n  def keys List<int> {\n    return (self as dynamic).Keys.ToList()\n  }\n\n  def values List<T> {\n    return (self as dynamic).Values.ToList()\n  }\n}\n";
  Skew.NATIVE_LIBRARY_JS = "\nconst __extends = (derived dynamic, base dynamic) => {\n  derived.prototype = dynamic.Object.create(base.prototype)\n  derived.prototype.constructor = derived\n}\n\nconst __imul = dynamic.Math.imul ? dynamic.Math.imul : (a int, b int) int => {\n  const ah dynamic = (a >> 16) & 65535\n  const bh dynamic = (b >> 16) & 65535\n  const al dynamic = a & 65535\n  const bl dynamic = b & 65535\n  return al * bl + ((ah * bl + al * bh) << 16) | 0\n}\n\ndef assert(truth bool) {\n  if !truth {\n    throw dynamic.Error(\"Assertion failed\")\n  }\n}\n\nclass double {\n  def isFinite bool {\n    return dynamic.isFinite(self)\n  }\n\n  def isNAN bool {\n    return dynamic.isNaN(self)\n  }\n}\n\nclass string {\n  def startsWith(text string) bool {\n    return count >= text.count && slice(0, text.count) == text\n  }\n\n  def replaceAll(before string, after string) string {\n    return after.join(self.split(before))\n  }\n\n  def in(value string) bool {\n    return indexOf(value) != -1\n  }\n\n  def count int {\n    return (self as dynamic).length\n  }\n\n  def [](index int) int {\n    return (self as dynamic).charCodeAt(index)\n  }\n\n  def get(index int) string {\n    return (self as dynamic)[index]\n  }\n\n  def repeat(times int) string {\n    var result = \"\"\n    for i in 0..times {\n      result += self\n    }\n    return result\n  }\n\n  def join(parts List<string>) string {\n    return (parts as dynamic).join(self)\n  }\n}\n\nnamespace string {\n  def fromCodeUnit(x int) string {\n    return dynamic.String.fromCharCode(x)\n  }\n}\n\nclass StringBuilder {\n  var buffer = \"\"\n\n  def new {\n  }\n\n  def append(x string) {\n    buffer += x\n  }\n\n  def toString string {\n    return buffer\n  }\n}\n\nclass List {\n  def isEqualTo(other List<T>) bool {\n    if count != other.count {\n      return false\n    }\n    for i in 0..count {\n      if self[i] != other[i] {\n        return false\n      }\n    }\n    return true\n  }\n\n  def in(value T) bool {\n    return indexOf(value) != -1\n  }\n\n  def isEmpty bool {\n    return count == 0\n  }\n\n  def count int {\n    return (self as dynamic).length\n  }\n\n  def first T {\n    return self[0]\n  }\n\n  def last T {\n    return self[count - 1]\n  }\n\n  def prepend(values List<T>) {\n    var count = values.count\n    for i in 0..count {\n      prepend(values[count - i - 1])\n    }\n  }\n\n  def append(values List<T>) {\n    for value in values {\n      append(value)\n    }\n  }\n\n  def swap(i int, j int) {\n    var temp = self[i]\n    self[i] = self[j]\n    self[j] = temp\n  }\n\n  def insert(index int, value T) {\n    (self as dynamic).splice(index, 0, value)\n  }\n\n  def removeAt(index int) {\n    (self as dynamic).splice(index, 1)\n  }\n\n  def removeOne(value T) {\n    var index = indexOf(value)\n    if index >= 0 {\n      removeAt(index)\n    }\n  }\n\n  def removeIf(callback fn(T) bool) {\n    var index = 0\n\n    # Remove elements in place\n    for i in 0..count {\n      if !callback(self[i]) {\n        if index < i {\n          self[index] = self[i]\n        }\n        index++\n      }\n    }\n\n    # Shrink the array to the correct size\n    while index < count {\n      removeLast\n    }\n  }\n}\n\nnamespace StringMap {\n  def new StringMap<T> {\n    return dynamic.Object.create(null)\n  }\n}\n\nclass StringMap {\n  def {...}(key string, value T) StringMap<T> {\n    self[key] = value\n    return self\n  }\n\n  def get(key string, value T) T {\n    return key in self ? self[key] : value\n  }\n\n  def keys List<string> {\n    return dynamic.Object.keys(self)\n  }\n\n  def values List<T> {\n    var values List<T> = []\n    for key in self as dynamic {\n      values.append(self[key])\n    }\n    return values\n  }\n\n  def clone StringMap<T> {\n    var clone = new\n    for key in keys {\n      clone[key] = self[key]\n    }\n    return clone\n  }\n\n  def remove(key string) {\n    dynamic.delete(self[key])\n  }\n}\n\nnamespace IntMap {\n  def new IntMap<T> {\n    return dynamic.Object.create(null)\n  }\n}\n\nclass IntMap {\n  def {...}(key int, value T) IntMap<T> {\n    self[key] = value\n    return self\n  }\n\n  def get(key int, value T) T {\n    return key in self ? self[key] : value\n  }\n\n  def keys List<int> {\n    var keys List<int> = []\n    for key in dynamic.Object.keys(self) as List<string> {\n      keys.append(key as dynamic as int)\n    }\n    return keys\n  }\n\n  def values List<T> {\n    var values List<T> = []\n    for key in self as dynamic {\n      values.append(self[key])\n    }\n    return values\n  }\n\n  def clone IntMap<T> {\n    var clone = new\n    for key in keys {\n      clone[key] = self[key]\n    }\n    return clone\n  }\n\n  def remove(key int) {\n    dynamic.delete(self[key])\n  }\n}\n";
  Skew.DEFAULT_MESSAGE_LIMIT = 10;
  Skew.JsEmitter.isFunctionProperty = in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(Object.create(null), "apply", 0), "call", 0), "length", 0), "name", 0);
  Skew.JsEmitter.isKeyword = in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(Object.create(null), "arguments", 0), "Boolean", 0), "break", 0), "case", 0), "catch", 0), "class", 0), "const", 0), "constructor", 0), "continue", 0), "Date", 0), "debugger", 0), "default", 0), "delete", 0), "do", 0), "double", 0), "else", 0), "export", 0), "extends", 0), "false", 0), "finally", 0), "float", 0), "for", 0), "Function", 0), "function", 0), "if", 0), "import", 0), "in", 0), "instanceof", 0), "int", 0), "let", 0), "new", 0), "null", 0), "Number", 0), "Object", 0), "return", 0), "String", 0), "super", 0), "this", 0), "throw", 0), "true", 0), "try", 0), "var", 0);
  Skew.NodeKind.strings = ["ANNOTATION", "BLOCK", "CASE", "CATCH", "BREAK", "CONTINUE", "EXPRESSION", "FOR", "FOREACH", "IF", "RETURN", "SWITCH", "THROW", "TRY", "VAR", "WHILE", "ASSIGN_INDEX", "CALL", "CAST", "CONSTANT", "DOT", "DYNAMIC", "HOOK", "INDEX", "INITIALIZER_LIST", "INITIALIZER_MAP", "INITIALIZER_SET", "LAMBDA", "LAMBDA_TYPE", "NAME", "NULL", "PAIR", "PARAMETERIZE", "SEQUENCE", "SUPER", "TYPE", "COMPLEMENT", "DECREMENT", "INCREMENT", "NEGATIVE", "NOT", "POSITIVE", "ADD", "BITWISE_AND", "BITWISE_OR", "BITWISE_XOR", "COMPARE", "DIVIDE", "EQUAL", "IN", "IS", "LOGICAL_AND", "LOGICAL_OR", "MULTIPLY", "NOT_EQUAL", "POWER", "REMAINDER", "SHIFT_LEFT", "SHIFT_RIGHT", "SUBTRACT", "GREATER_THAN", "GREATER_THAN_OR_EQUAL", "LESS_THAN", "LESS_THAN_OR_EQUAL", "ASSIGN", "ASSIGN_ADD", "ASSIGN_BITWISE_AND", "ASSIGN_BITWISE_OR", "ASSIGN_BITWISE_XOR", "ASSIGN_DIVIDE", "ASSIGN_MULTIPLY", "ASSIGN_POWER", "ASSIGN_REMAINDER", "ASSIGN_SHIFT_LEFT", "ASSIGN_SHIFT_RIGHT", "ASSIGN_SUBTRACT"];
  Skew.Node.IS_IMPLICIT_RETURN = 1 << 0;
  Skew.Node.IS_INSIDE_PARENTHESES = 1 << 1;
  Skew.SymbolKind.strings = ["PARAMETER_FUNCTION", "PARAMETER_OBJECT", "OBJECT_CLASS", "OBJECT_ENUM", "OBJECT_GLOBAL", "OBJECT_INTERFACE", "OBJECT_NAMESPACE", "FUNCTION_ANNOTATION", "FUNCTION_CONSTRUCTOR", "FUNCTION_GLOBAL", "FUNCTION_INSTANCE", "FUNCTION_LOCAL", "OVERLOADED_ANNOTATION", "OVERLOADED_GLOBAL", "OVERLOADED_INSTANCE", "VARIABLE_ENUM", "VARIABLE_GLOBAL", "VARIABLE_INSTANCE", "VARIABLE_LOCAL"];

  // Flags
  Skew.Symbol.IS_AUTOMATICALLY_GENERATED = 1 << 0;
  Skew.Symbol.IS_CONST = 1 << 1;
  Skew.Symbol.IS_GETTER = 1 << 2;
  Skew.Symbol.IS_LOOP_VARIABLE = 1 << 3;
  Skew.Symbol.IS_OVER = 1 << 4;
  Skew.Symbol.IS_SETTER = 1 << 5;
  Skew.Symbol.IS_VALUE_TYPE = 1 << 6;
  Skew.Symbol.SHOULD_INFER_RETURN_TYPE = 1 << 7;

  // Modifiers
  Skew.Symbol.IS_DEPRECATED = 1 << 8;
  Skew.Symbol.IS_ENTRY_POINT = 1 << 9;
  Skew.Symbol.IS_EXPORTED = 1 << 10;
  Skew.Symbol.IS_IMPORTED = 1 << 11;
  Skew.Symbol.IS_PREFERRED = 1 << 12;
  Skew.Symbol.IS_PRIVATE = 1 << 13;
  Skew.Symbol.IS_PROTECTED = 1 << 14;
  Skew.Symbol.IS_RENAMED = 1 << 15;
  Skew.Symbol.IS_SKIPPED = 1 << 16;

  // Pass-specific flags
  Skew.Symbol.IS_MERGED = 1 << 17;
  Skew.Symbol.IS_OBSOLETE = 1 << 18;
  Skew.Symbol.IS_PRIMARY_CONSTRUCTOR = 1 << 19;
  Skew.Symbol.nextID = 0;
  Skew.TokenKind.strings = ["ANNOTATION", "ARROW", "AS", "ASSIGN", "ASSIGN_BITWISE_AND", "ASSIGN_BITWISE_OR", "ASSIGN_BITWISE_XOR", "ASSIGN_DIVIDE", "ASSIGN_INDEX", "ASSIGN_MINUS", "ASSIGN_MULTIPLY", "ASSIGN_PLUS", "ASSIGN_POWER", "ASSIGN_REMAINDER", "ASSIGN_SHIFT_LEFT", "ASSIGN_SHIFT_RIGHT", "BITWISE_AND", "BITWISE_OR", "BITWISE_XOR", "BREAK", "CASE", "CATCH", "CHARACTER", "CLASS", "COLON", "COMMA", "COMMENT", "COMPARE", "CONST", "CONTINUE", "DECREMENT", "DEF", "DEFAULT", "DIVIDE", "DOT", "DOT_DOT", "DOUBLE", "DYNAMIC", "ELSE", "END_OF_FILE", "ENUM", "EQUAL", "ERROR", "FALSE", "FINALLY", "FOR", "GREATER_THAN", "GREATER_THAN_OR_EQUAL", "IDENTIFIER", "IF", "IN", "INCREMENT", "INDEX", "INT", "INTERFACE", "INT_BINARY", "INT_HEX", "INT_OCTAL", "IS", "LEFT_BRACE", "LEFT_BRACKET", "LEFT_PARENTHESIS", "LESS_THAN", "LESS_THAN_OR_EQUAL", "LIST", "LIST_NEW", "LOGICAL_AND", "LOGICAL_OR", "MINUS", "MULTIPLY", "NAMESPACE", "NEWLINE", "NOT", "NOT_EQUAL", "NULL", "OVER", "PLUS", "POWER", "QUESTION_MARK", "REMAINDER", "RETURN", "RIGHT_BRACE", "RIGHT_BRACKET", "RIGHT_PARENTHESIS", "SET", "SET_NEW", "SHIFT_LEFT", "SHIFT_RIGHT", "STRING", "SUPER", "SWITCH", "THROW", "TILDE", "TRUE", "TRY", "VAR", "WHILE", "WHITESPACE", "YY_INVALID_ACTION", "START_PARAMETER_LIST", "END_PARAMETER_LIST"];
  Skew.Parsing.operatorOverloadTokenKinds = in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(Object.create(null), Skew.TokenKind.ASSIGN_BITWISE_AND, 0), Skew.TokenKind.ASSIGN_BITWISE_OR, 0), Skew.TokenKind.ASSIGN_BITWISE_XOR, 0), Skew.TokenKind.ASSIGN_DIVIDE, 0), Skew.TokenKind.ASSIGN_INDEX, 0), Skew.TokenKind.ASSIGN_MINUS, 0), Skew.TokenKind.ASSIGN_MULTIPLY, 0), Skew.TokenKind.ASSIGN_PLUS, 0), Skew.TokenKind.ASSIGN_POWER, 0), Skew.TokenKind.ASSIGN_REMAINDER, 0), Skew.TokenKind.ASSIGN_SHIFT_LEFT, 0), Skew.TokenKind.ASSIGN_SHIFT_RIGHT, 0), Skew.TokenKind.BITWISE_AND, 0), Skew.TokenKind.BITWISE_OR, 0), Skew.TokenKind.BITWISE_XOR, 0), Skew.TokenKind.COMPARE, 0), Skew.TokenKind.DECREMENT, 0), Skew.TokenKind.DIVIDE, 0), Skew.TokenKind.IN, 0), Skew.TokenKind.INCREMENT, 0), Skew.TokenKind.INDEX, 0), Skew.TokenKind.LIST, 0), Skew.TokenKind.MINUS, 0), Skew.TokenKind.MULTIPLY, 0), Skew.TokenKind.NOT, 0), Skew.TokenKind.PLUS, 0), Skew.TokenKind.POWER, 0), Skew.TokenKind.REMAINDER, 0), Skew.TokenKind.SET, 0), Skew.TokenKind.SHIFT_LEFT, 0), Skew.TokenKind.SHIFT_RIGHT, 0), Skew.TokenKind.TILDE, 0);
  Skew.Parsing.dotInfixParselet = function(context, left) {
    context.next();
    var range = context.current().range;

    if (!context.expect(Skew.TokenKind.IDENTIFIER)) {
      return null;
    }

    return new Skew.Node(Skew.NodeKind.DOT).withContent(new Skew.StringContent(range.toString())).withChildren([left]).withRange(context.spanSince(left.range)).withInternalRange(range);
  };
  Skew.Parsing.initializerParselet = function(context) {
    var token = context.next();
    var values = [];
    var kind = token.kind === Skew.TokenKind.LEFT_BRACE || token.kind === Skew.TokenKind.SET_NEW ? Skew.NodeKind.INITIALIZER_SET : Skew.NodeKind.INITIALIZER_LIST;

    if (token.kind === Skew.TokenKind.LEFT_BRACE || token.kind === Skew.TokenKind.LEFT_BRACKET) {
      var checkForColon = kind !== Skew.NodeKind.INITIALIZER_LIST;
      var end = checkForColon ? Skew.TokenKind.RIGHT_BRACE : Skew.TokenKind.RIGHT_BRACKET;

      while (true) {
        context.eat(Skew.TokenKind.NEWLINE);
        var comments = Skew.Parsing.parseLeadingComments(context);

        if (context.peek(end)) {
          break;
        }

        var first = Skew.Parsing.pratt.parse(context, Skew.Precedence.LOWEST);

        if (first === null) {
          return null;
        }

        var colon = context.current();

        if (!checkForColon || values.length === 0 && !context.peek(Skew.TokenKind.COLON)) {
          values.push(first);
          checkForColon = false;
        }

        else {
          if (!context.expect(Skew.TokenKind.COLON)) {
            return null;
          }

          var second = Skew.Parsing.pratt.parse(context, Skew.Precedence.LOWEST);

          if (second === null) {
            return null;
          }

          first = Skew.Node.createPair(first, second).withRange(Skew.Range.span(first.range, second.range)).withInternalRange(colon.range);
          values.push(first);
          kind = Skew.NodeKind.INITIALIZER_MAP;
        }

        first.comments = comments;

        if (!context.eat(Skew.TokenKind.COMMA)) {
          break;
        }
      }

      while (context.eat(Skew.TokenKind.COMMENT) || context.eat(Skew.TokenKind.NEWLINE)) {
      }

      if (!context.expect(end)) {
        return null;
      }
    }

    else if (token.kind === Skew.TokenKind.LIST_NEW || token.kind === Skew.TokenKind.SET_NEW) {
      values.push(new Skew.Node(Skew.NodeKind.NAME).withContent(new Skew.StringContent("new")).withRange(new Skew.Range(token.range.source, token.range.start + 1 | 0, token.range.end - 1 | 0)));
    }

    return Skew.Node.createInitializer(kind, values).withRange(context.spanSince(token.range));
  };
  Skew.Parsing.parameterizedParselet = function(context, left) {
    var token = context.next();
    var parameters = [];

    while (true) {
      var type = Skew.Parsing.typePratt.parse(context, Skew.Precedence.LOWEST);

      if (type === null) {
        return null;
      }

      parameters.push(type);

      if (!context.eat(Skew.TokenKind.COMMA)) {
        break;
      }
    }

    if (!context.expect(Skew.TokenKind.END_PARAMETER_LIST)) {
      return null;
    }

    return Skew.Node.createParameterize(left, parameters).withRange(context.spanSince(left.range)).withInternalRange(context.spanSince(token.range));
  };
  Skew.Parsing.pratt = Skew.Parsing.createExpressionParser();
  Skew.Parsing.typePratt = Skew.Parsing.createTypeParser();
  Skew.Renaming.unaryPrefixes = in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(Object.create(null), "!", "not"), "+", "positive"), "++", "increment"), "-", "negative"), "--", "decrement"), "~", "complement");
  Skew.Renaming.prefixes = in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(Object.create(null), "%", "remainder"), "&", "and"), "*", "multiply"), "**", "power"), "+", "add"), "-", "subtract"), "/", "divide"), "<<", "leftShift"), "<=>", "compare"), ">>", "rightShift"), "^", "xor"), "|", "or"), "in", "contains"), "%=", "remainderUpdate"), "&=", "andUpdate"), "**=", "powerUpdate"), "*=", "multiplyUpdate"), "+=", "addUpdate"), "-=", "subtractUpdate"), "/=", "divideUpdate"), "<<=", "leftShiftUpdate"), ">>=", "rightShiftUpdate"), "^=", "xorUpdate"), "|=", "orUpdate"), "[]", "get"), "[]=", "set"), "[...]", "append"), "[new]", "new"), "{...}", "insert"), "{new}", "new");
  Skew.Resolving.Resolver.annotationSymbolFlags = in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(Object.create(null), "@deprecated", Skew.Symbol.IS_DEPRECATED), "@entry", Skew.Symbol.IS_ENTRY_POINT), "@export", Skew.Symbol.IS_EXPORTED), "@import", Skew.Symbol.IS_IMPORTED), "@prefer", Skew.Symbol.IS_PREFERRED), "@private", Skew.Symbol.IS_PRIVATE), "@protected", Skew.Symbol.IS_PROTECTED), "@rename", Skew.Symbol.IS_RENAMED), "@skip", Skew.Symbol.IS_SKIPPED);
  Skew.Type.DYNAMIC = null;
  Skew.Type.NULL = null;
  Skew.Type.nextID = 0;
  Skew.Environment.nextID = 0;
  Unicode.StringIterator.INSTANCE = new Unicode.StringIterator();
  Terminal.colorToEscapeCode = in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(Object.create(null), Terminal.Color.DEFAULT, 0), Terminal.Color.BOLD, 1), Terminal.Color.GRAY, 90), Terminal.Color.RED, 91), Terminal.Color.GREEN, 92), Terminal.Color.YELLOW, 93), Terminal.Color.BLUE, 94), Terminal.Color.MAGENTA, 95), Terminal.Color.CYAN, 96);

  process.exit(Skew.main(process.argv.slice(2)));
})();
