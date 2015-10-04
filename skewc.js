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
      throw Error('Assertion failed');
    }
  }

  function StringBuilder() {
    this.buffer = '';
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

  var Unicode = {};

  Unicode.codeUnitCountForCodePoints = function(codePoints, encoding) {
    var count = 0;

    switch (encoding) {
      case Unicode.Encoding.UTF8: {
        for (var i = 0, list = codePoints, count1 = list.length; i < count1; ++i) {
          var codePoint = list[i];

          if (codePoint < 128) {
            ++count;
          }

          else if (codePoint < 2048) {
            count += 2;
          }

          else if (codePoint < 65536) {
            count += 3;
          }

          else {
            count += 4;
          }
        }
        break;
      }

      case Unicode.Encoding.UTF16: {
        for (var i1 = 0, list1 = codePoints, count2 = list1.length; i1 < count2; ++i1) {
          var codePoint1 = list1[i1];

          if (codePoint1 < 65536) {
            ++count;
          }

          else {
            count += 2;
          }
        }
        break;
      }

      case Unicode.Encoding.UTF32: {
        count = codePoints.length;
        break;
      }
    }

    return count;
  };

  Unicode.Encoding = {
    UTF8: 0,
    UTF16: 1,
    UTF32: 2
  };

  Unicode.StringIterator = function() {
    this.value = '';
    this.index = 0;
    this.stop = 0;
  };

  Unicode.StringIterator.prototype.reset = function(text, start) {
    this.value = text;
    this.index = start;
    this.stop = text.length;
    return this;
  };

  Unicode.StringIterator.prototype.nextCodePoint = function() {
    if (this.index >= this.stop) {
      return -1;
    }

    var a = this.value.charCodeAt(this.index);
    ++this.index;

    if (a < 55296 || a >= 56320) {
      return a;
    }

    if (this.index >= this.stop) {
      return -1;
    }

    var b = this.value.charCodeAt(this.index);
    ++this.index;
    return ((a << 10) + b | 0) + ((65536 - (55296 << 10) | 0) - 56320 | 0) | 0;
  };

  var Skew = {};

  Skew.quoteString = function(text, style) {
    // Use whichever quote character is less frequent
    if (style == Skew.QuoteStyle.SHORTEST) {
      var singleQuotes = 0;
      var doubleQuotes = 0;

      for (var i = 0, count = text.length; i < count; ++i) {
        var c = text.charCodeAt(i);

        if (c == 34) {
          ++doubleQuotes;
        }

        else if (c == 39) {
          ++singleQuotes;
        }
      }

      style = singleQuotes <= doubleQuotes ? Skew.QuoteStyle.SINGLE : Skew.QuoteStyle.DOUBLE;
    }

    var builder = new StringBuilder();
    var quoteString = style == Skew.QuoteStyle.SINGLE ? "'" : '"';
    var quote = style == Skew.QuoteStyle.SINGLE ? 39 : 34;
    var escaped = '';

    // Append long runs of unescaped characters using a single slice for speed
    var start = 0;
    builder.append(quoteString);

    for (var i1 = 0, count1 = text.length; i1 < count1; ++i1) {
      var c1 = text.charCodeAt(i1);

      if (c1 == quote) {
        escaped = '\\' + quoteString;
      }

      else if (c1 == 10) {
        escaped = '\\n';
      }

      else if (c1 == 13) {
        escaped = '\\r';
      }

      else if (c1 == 9) {
        escaped = '\\t';
      }

      else if (c1 == 0) {
        escaped = '\\0';
      }

      else if (c1 == 92) {
        escaped = '\\\\';
      }

      else if (c1 < 32) {
        escaped = '\\x' + Skew.HEX[c1 >> 4] + Skew.HEX[c1 & 15];
      }

      else {
        continue;
      }

      builder.append(text.slice(start, i1));
      builder.append(escaped);
      start = i1 + 1 | 0;
    }

    builder.append(text.slice(start, text.length));
    builder.append(quoteString);
    return builder.toString();
  };

  // A single base 64 digit can contain 6 bits of data. For the base 64 variable
  // length quantities we use in the source map spec, the first bit is the sign,
  // the next four bits are the actual value, and the 6th bit is the continuation
  // bit. The continuation bit tells us whether there are more digits in this
  // value following this digit.
  //
  //   Continuation
  //   |    Sign
  //   |    |
  //   V    V
  //   101011
  //
  Skew.encodeVLQ = function(value) {
    var vlq = value < 0 ? -value << 1 | 1 : value << 1;
    var encoded = '';

    while (true) {
      var digit = vlq & 31;
      vlq >>= 5;

      // If there are still more digits in this value, we must make sure the
      // continuation bit is marked
      if (vlq != 0) {
        digit |= 32;
      }

      encoded += Skew.BASE64[digit];

      if (vlq == 0) {
        break;
      }
    }

    return encoded;
  };

  Skew.argumentCountForOperator = function(text) {
    if (Skew.validArgumentCounts == null) {
      Skew.validArgumentCounts = Object.create(null);

      for (var i = 0, list = in_IntMap.values(Skew.operatorInfo), count = list.length; i < count; ++i) {
        var value = list[i];
        Skew.validArgumentCounts[value.text] = value.validArgumentCounts;
      }

      Skew.validArgumentCounts['[...]'] = [1];
      Skew.validArgumentCounts['[new]'] = [0, 1];
      Skew.validArgumentCounts['{...}'] = [2];
      Skew.validArgumentCounts['{new}'] = [0, 2];
    }

    return in_StringMap.get(Skew.validArgumentCounts, text, null);
  };

  Skew.hashCombine = function(left, right) {
    return left ^ ((right - 1640531527 | 0) + (left << 6) | 0) + (left >> 2);
  };

  Skew.splitPath = function(path) {
    var slashIndex = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
    return slashIndex == -1 ? new Skew.SplitPath('.', path) : new Skew.SplitPath(path.slice(0, slashIndex), path.slice(slashIndex + 1 | 0));
  };

  Skew.bytesToString = function(bytes) {
    var KB = 1 << 10;
    var MB = 1 << 20;
    var GB = 1 << 30;

    if (bytes == 1) {
      return '1 byte';
    }

    if (bytes < KB) {
      return bytes.toString() + ' bytes';
    }

    if (bytes < MB) {
      return (Math.round(bytes / KB * 10) / 10).toString() + 'kb';
    }

    if (bytes < GB) {
      return (Math.round(bytes / MB * 10) / 10).toString() + 'mb';
    }

    return (Math.round(bytes / GB * 10) / 10).toString() + 'gb';
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
      while (yy_current_state != 232) {
        if (yy_cp >= text_length) {
          // This prevents syntax errors from causing infinite loops
          break;
        }

        var c = text.charCodeAt(yy_cp);
        var index = c < 127 ? c : 127;
        var yy_c = Skew.yy_ec[index];

        if (Skew.yy_accept[yy_current_state] != Skew.TokenKind.YY_INVALID_ACTION) {
          yy_last_accepting_state = yy_current_state;
          yy_last_accepting_cpos = yy_cp;
        }

        while (Skew.yy_chk[Skew.yy_base[yy_current_state] + yy_c | 0] != yy_current_state) {
          yy_current_state = Skew.yy_def[yy_current_state];

          if (yy_current_state >= 233) {
            yy_c = Skew.yy_meta[yy_c];
          }
        }

        yy_current_state = Skew.yy_nxt[Skew.yy_base[yy_current_state] + yy_c | 0];
        ++yy_cp;
      }

      // Find the action
      var yy_act = Skew.yy_accept[yy_current_state];

      while (yy_act == Skew.TokenKind.YY_INVALID_ACTION) {
        // Have to back up
        yy_cp = yy_last_accepting_cpos;
        yy_current_state = yy_last_accepting_state;
        yy_act = Skew.yy_accept[yy_current_state];
      }

      // Ignore whitespace
      if (yy_act == Skew.TokenKind.WHITESPACE) {
        continue;
      }

      // This is the default action in flex, which is usually called ECHO
      else if (yy_act == Skew.TokenKind.ERROR) {
        var iterator = Unicode.StringIterator.INSTANCE.reset(text, yy_bp);
        iterator.nextCodePoint();
        var range = new Skew.Range(source, yy_bp, iterator.index);
        log.syntaxErrorExtraData(range, range.toString());
        break;
      }

      // Ignore END_OF_FILE since this loop must still perform the last action
      else if (yy_act != Skew.TokenKind.END_OF_FILE) {
        tokens.push(new Skew.Token(new Skew.Range(source, yy_bp, yy_cp), yy_act));

        // These tokens start with a ">" and may need to be split if we discover
        // that they should really be END_PARAMETER_LIST tokens. Save enough room
        // for these tokens to be split into pieces, that way all of the tokens
        // don't have to be shifted over repeatedly inside prepareTokens(). The
        // ">>" token may become ">" + ">", the ">=" token may become ">" + "=",
        // the ">>>" token may become ">" + ">>" and ultimately ">" + ">" + ">",
        // the ">>=" token may ultimately become ">" + ">" + "=", and the ">>>="
        // token may ultimately become ">" + ">" + ">" + "=".
        if (yy_act == Skew.TokenKind.ASSIGN_SHIFT_RIGHT || yy_act == Skew.TokenKind.ASSIGN_UNSIGNED_SHIFT_RIGHT || yy_act == Skew.TokenKind.GREATER_THAN_OR_EQUAL || yy_act == Skew.TokenKind.SHIFT_RIGHT || yy_act == Skew.TokenKind.UNSIGNED_SHIFT_RIGHT) {
          tokens.push(null);

          if (yy_act == Skew.TokenKind.ASSIGN_SHIFT_RIGHT || yy_act == Skew.TokenKind.ASSIGN_UNSIGNED_SHIFT_RIGHT || yy_act == Skew.TokenKind.UNSIGNED_SHIFT_RIGHT) {
            tokens.push(null);

            if (yy_act == Skew.TokenKind.ASSIGN_UNSIGNED_SHIFT_RIGHT || yy_act == Skew.TokenKind.UNSIGNED_SHIFT_RIGHT) {
              tokens.push(null);
            }
          }
        }
      }
    }

    // Every token stream ends in END_OF_FILE
    tokens.push(new Skew.Token(new Skew.Range(source, text_length, text_length), Skew.TokenKind.END_OF_FILE));

    // Also return preprocessor token presence so the preprocessor can be avoided
    return tokens;
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
      if (token == null) {
        continue;
      }

      // Compress tokens to eliminate unused null gaps
      tokens[count] = token;
      ++count;

      // Tokens that start with a greater than may need to be split
      var tokenKind = token.kind;
      var tokenStartsWithGreaterThan = token.firstCodeUnit() == 62;

      // Remove tokens from the stack if they aren't working out
      while (!(stack.length == 0)) {
        var top = in_List.last(stack);
        var topKind = top.kind;

        // Stop parsing a type if we find a token that no type expression uses
        if (topKind == Skew.TokenKind.LESS_THAN && tokenKind != Skew.TokenKind.LESS_THAN && tokenKind != Skew.TokenKind.IDENTIFIER && tokenKind != Skew.TokenKind.COMMA && tokenKind != Skew.TokenKind.DYNAMIC && tokenKind != Skew.TokenKind.DOT && tokenKind != Skew.TokenKind.LEFT_PARENTHESIS && tokenKind != Skew.TokenKind.RIGHT_PARENTHESIS && !tokenStartsWithGreaterThan) {
          stack.pop();
        }

        else {
          break;
        }
      }

      // Group open
      if (tokenKind == Skew.TokenKind.LEFT_PARENTHESIS || tokenKind == Skew.TokenKind.LEFT_BRACE || tokenKind == Skew.TokenKind.LEFT_BRACKET || tokenKind == Skew.TokenKind.LESS_THAN) {
        stack.push(token);
      }

      // Group close
      else if (tokenKind == Skew.TokenKind.RIGHT_PARENTHESIS || tokenKind == Skew.TokenKind.RIGHT_BRACE || tokenKind == Skew.TokenKind.RIGHT_BRACKET || tokenStartsWithGreaterThan) {
        // Search for a matching opposite token
        while (!(stack.length == 0)) {
          var top1 = in_List.last(stack);
          var topKind1 = top1.kind;

          // Don't match closing angle brackets that don't work since they are just operators
          if (tokenStartsWithGreaterThan && topKind1 != Skew.TokenKind.LESS_THAN) {
            break;
          }

          // Consume the current token
          stack.pop();

          // Special-case angle brackets matches
          if (topKind1 == Skew.TokenKind.LESS_THAN) {
            // Remove tentative matches that didn't work out
            if (!tokenStartsWithGreaterThan) {
              continue;
            }

            // Break apart operators that start with a closing angle bracket
            if (tokenKind != Skew.TokenKind.GREATER_THAN) {
              var range = token.range;
              var start = range.start;
              assert((i + 1 | 0) < tokens.length);
              assert(tokens[i + 1 | 0] == null);
              assert(tokenKind == Skew.TokenKind.ASSIGN_SHIFT_RIGHT || tokenKind == Skew.TokenKind.ASSIGN_UNSIGNED_SHIFT_RIGHT || tokenKind == Skew.TokenKind.GREATER_THAN_OR_EQUAL || tokenKind == Skew.TokenKind.SHIFT_RIGHT || tokenKind == Skew.TokenKind.UNSIGNED_SHIFT_RIGHT);
              tokens[i + 1 | 0] = new Skew.Token(new Skew.Range(range.source, start + 1 | 0, range.end), tokenKind == Skew.TokenKind.SHIFT_RIGHT ? Skew.TokenKind.GREATER_THAN : tokenKind == Skew.TokenKind.UNSIGNED_SHIFT_RIGHT ? Skew.TokenKind.SHIFT_RIGHT : tokenKind == Skew.TokenKind.GREATER_THAN_OR_EQUAL ? Skew.TokenKind.ASSIGN : tokenKind == Skew.TokenKind.ASSIGN_SHIFT_RIGHT ? Skew.TokenKind.GREATER_THAN_OR_EQUAL : tokenKind == Skew.TokenKind.ASSIGN_UNSIGNED_SHIFT_RIGHT ? Skew.TokenKind.SHIFT_RIGHT : Skew.TokenKind.NULL);
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

      // Remove newlines based on the previous token to enable line continuations.
      // Make sure to be conservative. We want to be like Python, not like
      // JavaScript ASI! Anything that is at all ambiguous should be disallowed.
      if (previousKind == Skew.TokenKind.NEWLINE && tokenKind in Skew.REMOVE_NEWLINE_BEFORE) {
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

  Skew.compile = function(log, options, inputs) {
    options.target.includeSources(inputs);
    options.target.editOptions(options);
    inputs.unshift(new Skew.Source('<unicode>', Skew.UNICODE_LIBRARY));
    inputs.unshift(new Skew.Source('<native>', Skew.NATIVE_LIBRARY));
    var context = new Skew.PassContext(log, options, inputs);
    var passTimers = [];
    var totalTimer = new Skew.Timer();
    totalTimer.start();

    // Run all passes, errors stop compilation
    for (var i = 0, list = options.passes, count = list.length; i < count; ++i) {
      var pass = list[i];

      if (log.hasErrors()) {
        break;
      }

      if (pass.shouldRun(options)) {
        var passTimer = new Skew.PassTimer(pass.kind());
        passTimers.push(passTimer);
        passTimer.timer.start();
        pass.run(context);
        passTimer.timer.stop();

        // This is expensive but can be used for debugging
        if (!RELEASE) {
          Skew._verifyHierarchy1(context.global);
        }
      }
    }

    totalTimer.stop();
    return new Skew.CompilerResult(context.cache, context.global, context.outputs, passTimers, totalTimer);
  };

  Skew._verifyHierarchy1 = function(symbol) {
    for (var i1 = 0, list1 = symbol.objects, count1 = list1.length; i1 < count1; ++i1) {
      var object = list1[i1];
      assert(object.parent == symbol);
      Skew._verifyHierarchy1(object);

      if (object.$extends != null) {
        Skew._verifyHierarchy2(object.$extends, null);
      }

      if (object.implements != null) {
        for (var i = 0, list = object.implements, count = list.length; i < count; ++i) {
          var node = list[i];
          Skew._verifyHierarchy2(node, null);
        }
      }
    }

    for (var i2 = 0, list2 = symbol.functions, count2 = list2.length; i2 < count2; ++i2) {
      var $function = list2[i2];
      assert($function.parent == symbol);

      if ($function.block != null) {
        Skew._verifyHierarchy2($function.block, null);
      }
    }

    for (var i3 = 0, list3 = symbol.variables, count3 = list3.length; i3 < count3; ++i3) {
      var variable = list3[i3];
      assert(variable.parent == symbol);

      if (variable.value != null) {
        Skew._verifyHierarchy2(variable.value, null);
      }
    }

    if (symbol.guards != null) {
      for (var i4 = 0, list4 = symbol.guards, count4 = list4.length; i4 < count4; ++i4) {
        var guard = list4[i4];
        Skew._verifyHierarchy3(guard, symbol);
      }
    }
  };

  Skew._verifyHierarchy2 = function(node, parent) {
    assert(node.parent() == parent);

    for (var child = node.firstChild(); child != null; child = child.nextSibling()) {
      Skew._verifyHierarchy2(child, node);
    }
  };

  Skew._verifyHierarchy3 = function(guard, parent) {
    assert(guard.parent == parent);
    assert(guard.contents.parent == parent);

    if (guard.test != null) {
      Skew._verifyHierarchy2(guard.test, null);
    }

    Skew._verifyHierarchy1(guard.contents);

    if (guard.elseGuard != null) {
      Skew._verifyHierarchy3(guard.elseGuard, parent);
    }
  };

  // Remove all code that isn't reachable from the entry point or from an
  // imported or exported symbol. This is called tree shaking here but is also
  // known as dead code elimination. Tree shaking is perhaps a better name
  // because this pass doesn't remove dead code inside functions.
  Skew.shakingPass = function(global, entryPoint, mode) {
    var graph = new Skew.UsageGraph(global, mode);
    var symbols = [];
    Skew.Shaking.collectExportedSymbols(global, symbols, entryPoint);
    var usages = graph.usagesForSymbols(symbols);

    if (usages != null) {
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
    if (!log.hasErrors() && options != null) {
      var result = Skew.compile(log, options, inputs);

      // Write all outputs
      if (!log.hasErrors()) {
        for (var i = 0, list = result.outputs, count = list.length; i < count; ++i) {
          var output = list[i];

          if (!IO.writeFile(output.name, output.contents)) {
            var outputFile = parser.rangeForOption(Skew.Option.OUTPUT_FILE);
            var outputDirectory = parser.rangeForOption(Skew.Option.OUTPUT_DIRECTORY);
            log.commandLineErrorUnwritableFile(outputFile != null ? outputFile : outputDirectory, output.name);
            break;
          }
        }

        // Print compilation statistics
        if (!log.hasErrors() && options.verbose) {
          Skew.printWithColor(Terminal.Color.GRAY, result.statistics() + '\n');
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
    Skew.printWithColor(Terminal.Color.RED, 'error: ');
    Skew.printWithColor(Terminal.Color.BOLD, text + '\n');
  };

  Skew.printNote = function(text) {
    Skew.printWithColor(Terminal.Color.GRAY, 'note: ');
    Skew.printWithColor(Terminal.Color.BOLD, text + '\n');
  };

  Skew.printWarning = function(text) {
    Skew.printWithColor(Terminal.Color.MAGENTA, 'warning: ');
    Skew.printWithColor(Terminal.Color.BOLD, text + '\n');
  };

  Skew.printUsage = function(parser) {
    Skew.printWithColor(Terminal.Color.GREEN, '\nusage: ');
    Skew.printWithColor(Terminal.Color.BOLD, 'skewc [flags] [inputs]\n');
    process.stdout.write(parser.usageText(Math.min(process.stdout.columns, 80)));
  };

  Skew.printLogWithColor = function(log, diagnosticLimit) {
    var terminalWidth = process.stdout.columns;
    var diagnosticCount = 0;

    for (var i = 0, list = log.diagnostics, count = list.length; i < count; ++i) {
      var diagnostic = list[i];

      if (diagnosticLimit > 0 && diagnosticCount == diagnosticLimit) {
        break;
      }

      if (diagnostic.range != null) {
        Skew.printWithColor(Terminal.Color.BOLD, diagnostic.range.locationString() + ': ');
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

      if (diagnostic.range != null) {
        var formatted = diagnostic.range.format(terminalWidth);
        process.stdout.write(formatted.line + '\n');
        Skew.printWithColor(Terminal.Color.GREEN, formatted.range + '\n');
      }

      if (diagnostic.noteRange != null) {
        Skew.printWithColor(Terminal.Color.BOLD, diagnostic.noteRange.locationString() + ': ');
        Skew.printNote(diagnostic.noteText);
        var formatted1 = diagnostic.noteRange.format(terminalWidth);
        process.stdout.write(formatted1.line + '\n');
        Skew.printWithColor(Terminal.Color.GREEN, formatted1.range + '\n');
      }

      ++diagnosticCount;
    }

    // Print the summary
    var hasErrors = log.hasErrors();
    var hasWarnings = log.hasWarnings();
    var summary = '';

    if (hasWarnings) {
      summary += log.warningCount.toString() + ' warning' + (log.warningCount == 1 ? '' : 's');

      if (hasErrors) {
        summary += ' and ';
      }
    }

    if (hasErrors) {
      summary += log.errorCount.toString() + ' error' + (log.errorCount == 1 ? '' : 's');
    }

    if (hasWarnings || hasErrors) {
      process.stdout.write(summary + ' generated');
      Skew.printWithColor(Terminal.Color.GRAY, diagnosticCount < log.diagnostics.length ? ' (only showing ' + diagnosticLimit.toString() + ' message' + (diagnosticLimit == 1 ? '' : 's') + ', use "--message-limit=0" to see all)\n' : '\n');
    }
  };

  Skew.readSources = function(log, files) {
    var result = [];

    for (var i = 0, list = files, count = list.length; i < count; ++i) {
      var file = list[i];
      var path = file.toString();
      var contents = IO.readFile(path);

      if (contents == null) {
        log.commandLineErrorUnreadableFile(file, path);
      }

      else {
        result.push(new Skew.Source(path, contents));
      }
    }

    return result;
  };

  Skew.parseOptions = function(log, parser, $arguments) {
    // Configure the parser
    parser.define(Skew.Options.Type.BOOL, Skew.Option.HELP, '--help', 'Prints this message.').aliases(['-help', '?', '-?', '-h', '-H', '/?', '/h', '/H']);
    parser.define(Skew.Options.Type.STRING, Skew.Option.TARGET, '--target', 'Sets the target format. Valid targets are ' + Skew.joinKeys(Object.keys(Skew.VALID_TARGETS)) + '.');
    parser.define(Skew.Options.Type.STRING, Skew.Option.OUTPUT_FILE, '--output-file', 'Combines all output into a single file. Mutually exclusive with --output-dir.');
    parser.define(Skew.Options.Type.STRING, Skew.Option.OUTPUT_DIRECTORY, '--output-dir', 'Places all output files in the specified directory. Mutually exclusive with --output-file.');
    parser.define(Skew.Options.Type.BOOL, Skew.Option.RELEASE, '--release', 'Implies --js-mangle, --js-minify, --fold-constants, --inline-functions, --globalize-functions, and --define:RELEASE=true.');
    parser.define(Skew.Options.Type.BOOL, Skew.Option.VERBOSE, '--verbose', 'Prints out information about the compilation.');
    parser.define(Skew.Options.Type.INT, Skew.Option.MESSAGE_LIMIT, '--message-limit', 'Sets the maximum number of messages to report. Pass 0 to disable the message limit. The default is ' + Skew.DEFAULT_MESSAGE_LIMIT.toString() + '.');
    parser.define(Skew.Options.Type.STRING_LIST, Skew.Option.DEFINE, '--define', 'Override variable values at compile time.');
    parser.define(Skew.Options.Type.BOOL, Skew.Option.JS_MANGLE, '--js-mangle', 'Transforms emitted JavaScript to be as small as possible. The "@export" annotation prevents renaming a symbol.');
    parser.define(Skew.Options.Type.BOOL, Skew.Option.JS_MINIFY, '--js-minify', 'Remove whitespace when compiling to JavaScript.');
    parser.define(Skew.Options.Type.BOOL, Skew.Option.JS_SOURCE_MAP, '--js-source-map', 'Generates a source map when targeting JavaScript. The source map is saved with the ".map" extension in the same directory as the main output file.');
    parser.define(Skew.Options.Type.BOOL, Skew.Option.FOLD_CONSTANTS, '--fold-constants', 'Evaluates constants at compile time and removes dead code inside functions.');
    parser.define(Skew.Options.Type.BOOL, Skew.Option.INLINE_FUNCTIONS, '--inline-functions', 'Uses heuristics to automatically inline simple global functions.');
    parser.define(Skew.Options.Type.BOOL, Skew.Option.GLOBALIZE_FUNCTIONS, '--globalize-functions', 'Convert instance functions to global functions for better inlining.');

    // Parse the command line arguments
    parser.parse(log, $arguments);

    if (log.hasErrors()) {
      return null;
    }

    // Early-out when printing the usage text
    if (parser.boolForOption(Skew.Option.HELP, $arguments.length == 0)) {
      Skew.printUsage(parser);
      return null;
    }

    // Set up the options for the compiler
    var options = new Skew.CompilerOptions();
    var releaseFlag = parser.boolForOption(Skew.Option.RELEASE, false);
    options.verbose = parser.boolForOption(Skew.Option.VERBOSE, false);
    options.foldAllConstants = parser.boolForOption(Skew.Option.FOLD_CONSTANTS, releaseFlag);
    options.globalizeAllFunctions = parser.boolForOption(Skew.Option.GLOBALIZE_FUNCTIONS, releaseFlag);
    options.inlineAllFunctions = parser.boolForOption(Skew.Option.INLINE_FUNCTIONS, releaseFlag);
    options.jsMangle = parser.boolForOption(Skew.Option.JS_MANGLE, releaseFlag);
    options.jsMinify = parser.boolForOption(Skew.Option.JS_MINIFY, releaseFlag);
    options.jsSourceMap = parser.boolForOption(Skew.Option.JS_SOURCE_MAP, false);

    // Prepare the defines
    if (releaseFlag) {
      options.define('RELEASE', 'true');
    }

    for (var i = 0, list = parser.rangeListForOption(Skew.Option.DEFINE), count = list.length; i < count; ++i) {
      var range = list[i];
      var name = range.toString();
      var equals = name.indexOf('=');

      if (equals < 0) {
        log.commandLineErrorExpectedDefineValue(range, name);
        continue;
      }

      options.defines[name.slice(0, equals)] = new Skew.Define(range.fromStart(equals), range.fromEnd((name.length - equals | 0) - 1 | 0));
    }

    // There must be at least one source file
    var end = parser.source.contents.length;
    var trailingSpace = new Skew.Range(parser.source, end - 1 | 0, end);

    if (parser.normalArguments.length == 0) {
      log.commandLineErrorNoInputFiles(trailingSpace);
    }

    // Check the target format
    var target = parser.rangeForOption(Skew.Option.TARGET);

    if (target != null) {
      options.target = Skew.parseEnum(log, 'target', Skew.VALID_TARGETS, target, null);
    }

    else {
      log.commandLineErrorMissingTarget(trailingSpace);
    }

    // Parse the output location
    if (target != null && target.toString() != 'typecheck') {
      var outputFile = parser.rangeForOption(Skew.Option.OUTPUT_FILE);
      var outputDirectory = parser.rangeForOption(Skew.Option.OUTPUT_DIRECTORY);

      if (outputFile == null && outputDirectory == null) {
        log.commandLineErrorMissingOutput(trailingSpace, '--output-file', '--output-dir');
      }

      else if (outputFile != null && outputDirectory != null) {
        log.commandLineErrorDuplicateOutput(outputFile.start > outputDirectory.start ? outputFile : outputDirectory, '--output-file', '--output-dir');
      }

      else if (outputFile != null) {
        options.outputFile = outputFile.toString();
      }

      else {
        options.outputDirectory = outputDirectory.toString();
      }
    }

    return options;
  };

  Skew.joinKeys = function(keys) {
    keys.sort(function(a, b) {
      return in_string.compare(a, b);
    });
    return Skew.PrettyPrint.joinQuoted(keys, 'and');
  };

  Skew.parseEnum = function(log, name, map, range, defaultValue) {
    var key = range.toString();

    if (key in map) {
      return map[key];
    }

    var keys = Object.keys(map);
    keys.sort(function(a, b) {
      return in_string.compare(a, b);
    });
    log.commandLineErrorInvalidEnum(range, name, key, keys);
    return defaultValue;
  };

  Skew.PassKind = {
    EMITTING: 0,
    PARSING: 1,
    LEXING: 2,
    TOKEN_PROCESSING: 3,
    CALL_GRAPH: 4,
    FOLDING: 5,
    GLOBALIZING: 6,
    INLINING: 7,
    INTERFACE_REMOVAL: 8,
    LAMBDA_LIFTING: 9,
    MERGING: 10,
    MOTION: 11,
    RENAMING: 12,
    RESOLVING: 13
  };

  Skew.EmitMode = {
    ALWAYS_EMIT: 0,
    SKIP_IF_EMPTY: 1
  };

  Skew.Emitter = function() {
    this._sources = [];
    this._prefix = new StringBuilder();
    this._code = new StringBuilder();
    this._indentAmount = '  ';
    this._indent = '';
  };

  Skew.Emitter.prototype.sources = function() {
    return this._sources;
  };

  Skew.Emitter.prototype._increaseIndent = function() {
    this._indent += this._indentAmount;
  };

  Skew.Emitter.prototype._decreaseIndent = function() {
    this._indent = this._indent.slice(this._indentAmount.length);
  };

  Skew.Emitter.prototype._emit = function(text) {
    this._code.append(text);
  };

  Skew.Emitter.prototype._emitPrefix = function(text) {
    this._prefix.append(text);
  };

  Skew.Emitter.prototype._createSource = function(name, mode) {
    var code = this._code.toString();

    if (mode == Skew.EmitMode.ALWAYS_EMIT || code != '') {
      this._prefix.append(code);
      this._sources.push(new Skew.Source(name, this._prefix.toString()));
    }

    this._prefix = new StringBuilder();
    this._code = new StringBuilder();
  };

  Skew.Emitter.prototype._collectObjects = function(global) {
    var objects = [];
    this._findObjects(objects, global);
    return objects;
  };

  Skew.Emitter.prototype._sortedObjects = function(global) {
    var objects = this._collectObjects(global);

    // Sort by inheritance and containment
    for (var i = 0, count = objects.length; i < count; ++i) {
      var j = i;

      // Select an object that comes before all other types
      while (j < objects.length) {
        var object = objects[j];
        var k = i;

        // Check to see if this comes before all other types
        while (k < objects.length) {
          if (j != k && Skew.Emitter._objectComesBefore(objects[k], object)) {
            break;
          }

          ++k;
        }

        if (k == objects.length) {
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

  Skew.Emitter.prototype._markVirtualFunctions = function(symbol) {
    for (var i = 0, list = symbol.objects, count = list.length; i < count; ++i) {
      var object = list[i];
      this._markVirtualFunctions(object);
    }

    for (var i1 = 0, list1 = symbol.functions, count1 = list1.length; i1 < count1; ++i1) {
      var $function = list1[i1];

      if ($function.overridden != null) {
        $function.overridden.flags |= Skew.Symbol.IS_VIRTUAL;
        $function.flags |= Skew.Symbol.IS_VIRTUAL;
      }
    }
  };

  Skew.Emitter.prototype._findObjects = function(objects, object) {
    objects.push(object);

    for (var i = 0, list = object.objects, count = list.length; i < count; ++i) {
      var o = list[i];
      this._findObjects(objects, o);
    }
  };

  Skew.Emitter._isContainedBy = function(inner, outer) {
    if (inner.parent == null) {
      return false;
    }

    if (inner.parent == outer) {
      return true;
    }

    return Skew.Emitter._isContainedBy(inner.parent.asObjectSymbol(), outer);
  };

  Skew.Emitter._objectComesBefore = function(before, after) {
    if (after.hasBaseClass(before)) {
      return true;
    }

    if (Skew.Emitter._isContainedBy(after, before)) {
      return true;
    }

    if (after.forwardTo == before) {
      return true;
    }

    return false;
  };

  Skew.CSharpEmitter = function(_options, _cache) {
    Skew.Emitter.call(this);
    this._options = _options;
    this._cache = _cache;
    this._previousNode = null;
    this._previousSymbol = null;
    this._namespaceStack = [];
    this._symbolsCheckedForUsing = {};
    this._usingNames = Object.create(null);
    this._loopLabels = {};
    this._enclosingFunction = null;
  };

  __extends(Skew.CSharpEmitter, Skew.Emitter);

  Skew.CSharpEmitter.prototype.visit = function(global) {
    this._indentAmount = '    ';
    this._moveGlobalsIntoClasses(global);

    // Generate the entry point
    var entryPoint = this._cache.entryPointSymbol;

    if (entryPoint != null) {
      entryPoint.name = 'Main';

      // The entry point in C# takes an array, not a list
      if (entryPoint.$arguments.length == 1) {
        var argument = entryPoint.$arguments[0];
        var array = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_ARGUMENT, argument.name);
        array.type = new Skew.Node(Skew.NodeKind.NAME).withContent(new Skew.StringContent('string[]'));
        array.resolvedType = Skew.Type.DYNAMIC;
        entryPoint.$arguments = [array];

        // Create the list from the array
        if (entryPoint.block != null) {
          array.name = entryPoint.scope.generateName(array.name);
          argument.kind = Skew.SymbolKind.VARIABLE_LOCAL;
          argument.value = Skew.Node.createCall(new Skew.Node(Skew.NodeKind.DOT).withContent(new Skew.StringContent('new')).appendChild(new Skew.Node(Skew.NodeKind.TYPE).withType(argument.resolvedType))).appendChild(Skew.Node.createSymbolReference(array));
          entryPoint.block.prependChild(new Skew.Node(Skew.NodeKind.VARIABLES).appendChild(Skew.Node.createVariable(argument)));
        }
      }
    }

    // Avoid emitting unnecessary stuff
    Skew.shakingPass(global, entryPoint, Skew.ShakingMode.USE_TYPES);
    this._markVirtualFunctions(global);

    // All code in C# is inside objects, so just emit objects recursively
    var emitIndividualFiles = this._options.outputDirectory != null;

    for (var i = 0, list = this._collectObjects(global), count = list.length; i < count; ++i) {
      var object = list[i];

      // Nested objects will be emitted by their parent
      if (object.parent != null && object.parent.kind == Skew.SymbolKind.OBJECT_CLASS) {
        continue;
      }

      this._emitObject(object);

      // Emit each object into its own file if requested
      if (emitIndividualFiles) {
        this._finalizeEmittedFile();
        this._createSource(this._options.outputDirectory + '/' + Skew.CSharpEmitter._fullName(object) + '.cs', Skew.EmitMode.SKIP_IF_EMPTY);
      }
    }

    // Emit a single file if requested
    if (!emitIndividualFiles) {
      this._finalizeEmittedFile();
      this._createSource(this._options.outputFile, Skew.EmitMode.ALWAYS_EMIT);
    }
  };

  Skew.CSharpEmitter.prototype._moveGlobalsIntoClasses = function(symbol) {
    if (!Skew.in_SymbolKind.isNamespaceOrGlobal(symbol.kind)) {
      return;
    }

    // Just change namespaces into classes if there aren't nested objects
    if (symbol.kind == Skew.SymbolKind.OBJECT_NAMESPACE && symbol.objects.length == 0 && (!(symbol.functions.length == 0) || !(symbol.variables.length == 0))) {
      symbol.kind = Skew.SymbolKind.OBJECT_CLASS;
      return;
    }

    var globals = null;
    var lazilyCreateGlobals = function() {
      if (globals == null) {
        globals = new Skew.ObjectSymbol(Skew.SymbolKind.OBJECT_CLASS, symbol.scope.generateName(symbol.kind == Skew.SymbolKind.OBJECT_NAMESPACE ? symbol.name + 'Globals' : 'Globals'));
        globals.parent = symbol;
        symbol.objects.push(globals);
      }
    };

    for (var i = 0, list = symbol.objects, count = list.length; i < count; ++i) {
      var object = list[i];
      this._moveGlobalsIntoClasses(object);
    }

    in_List.removeIf(symbol.functions, function($function) {
      if ($function.kind != Skew.SymbolKind.FUNCTION_ANNOTATION && !$function.isImported()) {
        lazilyCreateGlobals();
        $function.parent = globals;
        globals.functions.push($function);
        return true;
      }

      return false;
    });
    in_List.removeIf(symbol.variables, function(variable) {
      if (variable.kind == Skew.SymbolKind.VARIABLE_GLOBAL && !variable.isImported()) {
        lazilyCreateGlobals();
        variable.parent = globals;
        globals.variables.push(variable);
        return true;
      }

      return false;
    });
  };

  Skew.CSharpEmitter.prototype._adjustNamespace = function(symbol) {
    // Get the namespace chain for this symbol
    var symbols = [];

    while (symbol != null && symbol.kind != Skew.SymbolKind.OBJECT_GLOBAL) {
      if (symbol.kind == Skew.SymbolKind.OBJECT_NAMESPACE) {
        symbols.unshift(symbol);
      }

      symbol = symbol.parent;
    }

    // Find the intersection
    var limit = Math.min(this._namespaceStack.length, symbols.length);
    var i = 0;

    while (i < limit) {
      if (this._namespaceStack[i] != symbols[i]) {
        break;
      }

      ++i;
    }

    // Leave the old namespace
    while (this._namespaceStack.length > i) {
      var object = this._namespaceStack.pop();
      this._decreaseIndent();
      this._emit(this._indent + '}\n');
      this._emitNewlineAfterSymbol(object);
    }

    // Enter the new namespace
    while (this._namespaceStack.length < symbols.length) {
      var object1 = symbols[this._namespaceStack.length];
      this._emitNewlineBeforeSymbol(object1);
      this._emit(this._indent + 'namespace ' + Skew.CSharpEmitter._mangleName(object1) + '\n');
      this._emit(this._indent + '{\n');
      this._increaseIndent();
      this._namespaceStack.push(object1);
    }
  };

  Skew.CSharpEmitter.prototype._finalizeEmittedFile = function() {
    var usings = Object.keys(this._usingNames);

    if (!(usings.length == 0)) {
      usings.sort(function(a, b) {
        return in_string.compare(a, b);
      });

      for (var i = 0, list = usings, count = list.length; i < count; ++i) {
        var using = list[i];
        this._emitPrefix('using ' + using + ';\n');
      }

      this._emitPrefix('\n');
    }

    this._adjustNamespace(null);
    this._previousSymbol = null;
    this._symbolsCheckedForUsing = {};
    this._usingNames = Object.create(null);
  };

  Skew.CSharpEmitter.prototype._handleSymbol = function(symbol) {
    if (!Skew.in_SymbolKind.isLocal(symbol.kind) && !(symbol.id in this._symbolsCheckedForUsing)) {
      this._symbolsCheckedForUsing[symbol.id] = 0;

      if (symbol.annotations != null) {
        for (var i = 0, list = symbol.annotations, count = list.length; i < count; ++i) {
          var annotation = list[i];

          if (annotation.symbol != null && annotation.symbol.fullName() == 'using') {
            var value = annotation.annotationValue();

            if (value.childCount() == 2) {
              this._usingNames[value.lastChild().asString()] = 0;
            }
          }
        }
      }

      if (symbol.parent != null) {
        this._handleSymbol(symbol.parent);
      }
    }
  };

  Skew.CSharpEmitter.prototype._emitNewlineBeforeSymbol = function(symbol) {
    if (this._previousSymbol != null && (!Skew.in_SymbolKind.isVariable(this._previousSymbol.kind) || !Skew.in_SymbolKind.isVariable(symbol.kind) || symbol.comments != null)) {
      this._emit('\n');
    }

    this._previousSymbol = null;
  };

  Skew.CSharpEmitter.prototype._emitNewlineAfterSymbol = function(symbol) {
    this._previousSymbol = symbol;
  };

  Skew.CSharpEmitter.prototype._emitNewlineBeforeStatement = function(node) {
    if (this._previousNode != null && (node.comments != null || !Skew.CSharpEmitter._isCompactNodeKind(this._previousNode.kind) || !Skew.CSharpEmitter._isCompactNodeKind(node.kind))) {
      this._emit('\n');
    }

    this._previousNode = null;
  };

  Skew.CSharpEmitter.prototype._emitNewlineAfterStatement = function(node) {
    this._previousNode = node;
  };

  Skew.CSharpEmitter.prototype._emitComments = function(comments) {
    if (comments != null) {
      for (var i = 0, list = comments, count = list.length; i < count; ++i) {
        var comment = list[i];
        this._emit(this._indent + '//' + comment);
      }
    }
  };

  Skew.CSharpEmitter.prototype._emitObject = function(symbol) {
    this._handleSymbol(symbol);

    if (symbol.isImported() || Skew.in_SymbolKind.isNamespaceOrGlobal(symbol.kind)) {
      return;
    }

    this._adjustNamespace(symbol);
    this._emitNewlineBeforeSymbol(symbol);
    this._emitComments(symbol.comments);
    this._emit(this._indent + 'public ');

    if (symbol.isAbstract()) {
      this._emit('abstract ');
    }

    switch (symbol.kind) {
      case Skew.SymbolKind.OBJECT_CLASS:
      case Skew.SymbolKind.OBJECT_NAMESPACE: {
        this._emit('class ');
        break;
      }

      case Skew.SymbolKind.OBJECT_ENUM: {
        this._emit('enum ');
        break;
      }

      case Skew.SymbolKind.OBJECT_INTERFACE: {
        this._emit('interface ');
        break;
      }

      default: {
        assert(false);
        break;
      }
    }

    this._emit(Skew.CSharpEmitter._mangleName(symbol));
    this._emitTypeParameters(symbol.parameters);

    if (symbol.$extends != null || symbol.implements != null) {
      this._emit(' : ');

      if (symbol.$extends != null) {
        this._emitExpressionOrType(symbol.$extends, symbol.baseType);
      }

      if (symbol.implements != null) {
        for (var i = 0, list = symbol.implements, count = list.length; i < count; ++i) {
          var node = list[i];

          if (node != symbol.implements[0] || symbol.$extends != null) {
            this._emit(', ');
          }

          this._emitExpressionOrType(node, node.resolvedType);
        }
      }
    }

    this._emit('\n' + this._indent + '{\n');
    this._increaseIndent();

    for (var i1 = 0, list1 = symbol.objects, count1 = list1.length; i1 < count1; ++i1) {
      var object = list1[i1];
      this._emitObject(object);
    }

    for (var i2 = 0, list2 = symbol.variables, count2 = list2.length; i2 < count2; ++i2) {
      var variable = list2[i2];
      this._emitVariable(variable);
    }

    for (var i3 = 0, list3 = symbol.functions, count3 = list3.length; i3 < count3; ++i3) {
      var $function = list3[i3];
      this._emitFunction($function);
    }

    this._decreaseIndent();
    this._emit(this._indent + '}\n');
    this._emitNewlineAfterSymbol(symbol);
  };

  Skew.CSharpEmitter.prototype._emitTypeParameters = function(parameters) {
    if (parameters != null) {
      this._emit('<');

      for (var i = 0, list = parameters, count = list.length; i < count; ++i) {
        var parameter = list[i];

        if (parameter != parameters[0]) {
          this._emit(', ');
        }

        this._emit(Skew.CSharpEmitter._mangleName(parameter));
      }

      this._emit('>');
    }
  };

  Skew.CSharpEmitter.prototype._emitArgumentList = function(symbol) {
    this._emit('(');

    for (var i = 0, list = symbol.$arguments, count = list.length; i < count; ++i) {
      var argument = list[i];

      if (argument != symbol.$arguments[0]) {
        this._emit(', ');
      }

      this._emitExpressionOrType(argument.type, argument.resolvedType);
      this._emit(' ' + Skew.CSharpEmitter._mangleName(argument));
    }

    this._emit(')');
  };

  Skew.CSharpEmitter.prototype._emitVariable = function(symbol) {
    this._handleSymbol(symbol);

    if (symbol.isImported()) {
      return;
    }

    this._emitNewlineBeforeSymbol(symbol);
    this._emitComments(symbol.comments);

    if (symbol.kind == Skew.SymbolKind.VARIABLE_ENUM) {
      this._emit(this._indent + Skew.CSharpEmitter._mangleName(symbol));

      if (symbol.value != null) {
        this._emit(' = ');
        this._emitExpression(symbol.value, Skew.Precedence.COMMA);
      }

      this._emit(',\n');
    }

    else {
      this._emit(this._indent + 'public ');

      if (symbol.kind == Skew.SymbolKind.VARIABLE_GLOBAL) {
        this._emit('static ');
      }

      this._emitExpressionOrType(symbol.type, symbol.resolvedType);
      this._emit(' ' + Skew.CSharpEmitter._mangleName(symbol));

      if (symbol.value != null) {
        this._emit(' = ');
        this._emitExpression(symbol.value, Skew.Precedence.COMMA);
      }

      this._emit(';\n');
    }

    this._emitNewlineAfterSymbol(symbol);
  };

  Skew.CSharpEmitter.prototype._emitFunction = function(symbol) {
    this._handleSymbol(symbol);

    if (symbol.isImported()) {
      return;
    }

    // C# has sane capture rules for "this" so no variable insertion is needed
    if (symbol.$this != null) {
      symbol.$this.name = 'this';
      symbol.$this.flags |= Skew.Symbol.IS_EXPORTED;
    }

    this._enclosingFunction = symbol;
    this._emitNewlineBeforeSymbol(symbol);
    this._emitComments(symbol.comments);
    this._emit(this._indent);

    if (symbol.parent.kind != Skew.SymbolKind.OBJECT_INTERFACE) {
      this._emit('public ');
    }

    if (symbol.kind == Skew.SymbolKind.FUNCTION_GLOBAL) {
      this._emit('static ');
    }

    if (symbol.kind != Skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
      if (symbol.parent.kind != Skew.SymbolKind.OBJECT_INTERFACE) {
        if (symbol.block == null) {
          this._emit('abstract ');
        }

        else if (symbol.overridden != null) {
          this._emit('override ');
        }

        else if (symbol.isVirtual()) {
          this._emit('virtual ');
        }
      }

      this._emitExpressionOrType(symbol.returnType, symbol.resolvedType.returnType);
      this._emit(' ');
    }

    this._emit(Skew.CSharpEmitter._mangleName(symbol));
    this._emitTypeParameters(symbol.parameters);
    this._emitArgumentList(symbol);
    var block = symbol.block;

    if (block == null) {
      this._emit(';\n');
    }

    else {
      // Move the super constructor call out of the function body
      if (symbol.kind == Skew.SymbolKind.FUNCTION_CONSTRUCTOR && block.hasChildren()) {
        var first = block.firstChild();

        if (first.kind == Skew.NodeKind.EXPRESSION) {
          var call = first.expressionValue();

          if (call.kind == Skew.NodeKind.CALL && call.callValue().kind == Skew.NodeKind.SUPER) {
            this._emit(' : ');
            first.remove();
            this._emitExpression(call, Skew.Precedence.LOWEST);
          }
        }
      }

      this._emit('\n');
      this._emitBlock(block);
      this._emit('\n');
    }

    this._emitNewlineAfterSymbol(symbol);
    this._enclosingFunction = null;
  };

  Skew.CSharpEmitter.prototype._emitType = function(type) {
    if (type == null) {
      this._emit('void');
    }

    else if (type == Skew.Type.DYNAMIC) {
      this._emit('dynamic');
    }

    else if (type.kind == Skew.TypeKind.LAMBDA) {
      var argumentTypes = type.argumentTypes;
      var returnType = type.returnType;
      this._emit(returnType != null ? 'System.Func' : 'System.Action');

      if (!(argumentTypes.length == 0) || returnType != null) {
        this._emit('<');

        for (var i = 0, count = argumentTypes.length; i < count; ++i) {
          if (i != 0) {
            this._emit(', ');
          }

          this._emitType(argumentTypes[i]);
        }

        if (returnType != null) {
          if (!(argumentTypes.length == 0)) {
            this._emit(', ');
          }

          this._emitType(returnType);
        }

        this._emit('>');
      }
    }

    else {
      assert(type.kind == Skew.TypeKind.SYMBOL);
      this._handleSymbol(type.symbol);
      this._emit(Skew.CSharpEmitter._fullName(type.symbol));

      if (type.isParameterized()) {
        this._emit('<');

        if (this._cache.isIntMap(type) || this._cache.isStringMap(type)) {
          this._emit(this._cache.isIntMap(type) ? 'int' : 'string');
          this._emit(', ');
          this._emitType(type.substitutions[0]);
        }

        else {
          for (var i1 = 0, count1 = type.substitutions.length; i1 < count1; ++i1) {
            if (i1 != 0) {
              this._emit(', ');
            }

            this._emitType(type.substitutions[i1]);
          }
        }

        this._emit('>');
      }
    }
  };

  Skew.CSharpEmitter.prototype._emitExpressionOrType = function(node, type) {
    if (node != null) {
      this._emitExpression(node, Skew.Precedence.LOWEST);
    }

    else {
      this._emitType(type);
    }
  };

  Skew.CSharpEmitter.prototype._emitStatements = function(node) {
    this._previousNode = null;

    for (var child = node.firstChild(); child != null; child = child.nextSibling()) {
      this._emitNewlineBeforeStatement(child);
      this._emitComments(child.comments);
      this._emitStatement(child);
      this._emitNewlineAfterStatement(child);
    }

    this._previousNode = null;
  };

  Skew.CSharpEmitter.prototype._emitBlock = function(node) {
    assert(node.kind == Skew.NodeKind.BLOCK);
    this._emit(this._indent + '{\n');
    this._increaseIndent();
    this._emitStatements(node);
    this._decreaseIndent();
    this._emit(this._indent + '}');
  };

  Skew.CSharpEmitter.prototype._emitIf = function(node) {
    this._emit('if (');
    this._emitExpression(node.ifTest(), Skew.Precedence.LOWEST);
    this._emit(')\n');
    this._emitBlock(node.ifTrue());
    this._emit('\n');
    var block = node.ifFalse();

    if (block != null) {
      var singleIf = block.hasOneChild() && block.firstChild().kind == Skew.NodeKind.IF ? block.firstChild() : null;

      if (block.comments != null || singleIf != null && singleIf.comments != null) {
        this._emit('\n');
        this._emitComments(block.comments);

        if (singleIf != null) {
          this._emitComments(singleIf.comments);
        }
      }

      this._emit(this._indent + 'else');

      if (singleIf != null) {
        this._emit(' ');
        this._emitIf(singleIf);
      }

      else {
        this._emit('\n');
        this._emitBlock(block);
        this._emit('\n');
      }
    }
  };

  Skew.CSharpEmitter.prototype._scanForSwitchBreak = function(node, loop) {
    if (node.kind == Skew.NodeKind.BREAK) {
      for (var parent = node.parent(); parent != loop; parent = parent.parent()) {
        if (parent.kind == Skew.NodeKind.SWITCH) {
          var label = in_IntMap.get(this._loopLabels, loop.id, null);

          if (label == null) {
            label = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_LOCAL, this._enclosingFunction.scope.generateName('label'));
            this._loopLabels[loop.id] = label;
          }

          this._loopLabels[node.id] = label;
          break;
        }
      }
    }

    // Stop at nested loops since those will be tested later
    else if (node == loop || !Skew.in_NodeKind.isLoop(node.kind)) {
      for (var child = node.firstChild(); child != null; child = child.nextSibling()) {
        this._scanForSwitchBreak(child, loop);
      }
    }
  };

  Skew.CSharpEmitter.prototype._emitStatement = function(node) {
    if (Skew.in_NodeKind.isLoop(node.kind)) {
      this._scanForSwitchBreak(node, node);
    }

    switch (node.kind) {
      case Skew.NodeKind.VARIABLES: {
        for (var child = node.firstChild(); child != null; child = child.nextSibling()) {
          var symbol = child.symbol.asVariableSymbol();
          this._emit(this._indent);
          this._emitExpressionOrType(symbol.type, symbol.resolvedType);
          this._emit(' ' + Skew.CSharpEmitter._mangleName(symbol));

          if (symbol.value != null) {
            this._emit(' = ');
            this._emitExpression(symbol.value, Skew.Precedence.ASSIGN);
          }

          this._emit(';\n');
        }
        break;
      }

      case Skew.NodeKind.EXPRESSION: {
        this._emit(this._indent);
        this._emitExpression(node.expressionValue(), Skew.Precedence.LOWEST);
        this._emit(';\n');
        break;
      }

      case Skew.NodeKind.BREAK: {
        var label = in_IntMap.get(this._loopLabels, node.id, null);

        if (label != null) {
          this._emit(this._indent + 'goto ' + Skew.CSharpEmitter._mangleName(label) + ';\n');
        }

        else {
          this._emit(this._indent + 'break;\n');
        }
        break;
      }

      case Skew.NodeKind.CONTINUE: {
        this._emit(this._indent + 'continue;\n');
        break;
      }

      case Skew.NodeKind.IF: {
        this._emit(this._indent);
        this._emitIf(node);
        break;
      }

      case Skew.NodeKind.SWITCH: {
        var switchValue = node.switchValue();
        this._emit(this._indent + 'switch (');
        this._emitExpression(switchValue, Skew.Precedence.LOWEST);
        this._emit(')\n' + this._indent + '{\n');
        this._increaseIndent();

        for (var child1 = switchValue.nextSibling(); child1 != null; child1 = child1.nextSibling()) {
          var block = child1.caseBlock();

          if (child1.previousSibling() != switchValue) {
            this._emit('\n');
          }

          if (child1.hasOneChild()) {
            this._emit(this._indent + 'default:');
          }

          else {
            for (var value = child1.firstChild(); value != block; value = value.nextSibling()) {
              if (value.previousSibling() != null) {
                this._emit('\n');
              }

              this._emit(this._indent + 'case ');
              this._emitExpression(value, Skew.Precedence.LOWEST);
              this._emit(':');
            }
          }

          this._emit('\n' + this._indent + '{\n');
          this._increaseIndent();
          this._emitStatements(block);

          if (block.hasControlFlowAtEnd()) {
            this._emit(this._indent + 'break;\n');
          }

          this._decreaseIndent();
          this._emit(this._indent + '}\n');
        }

        this._decreaseIndent();
        this._emit(this._indent + '}\n');
        break;
      }

      case Skew.NodeKind.RETURN: {
        this._emit(this._indent + 'return');
        var value1 = node.returnValue();

        if (value1 != null) {
          this._emit(' ');
          this._emitExpression(value1, Skew.Precedence.LOWEST);
        }

        this._emit(';\n');
        break;
      }

      case Skew.NodeKind.THROW: {
        this._emit(this._indent + 'throw ');
        this._emitExpression(node.throwValue(), Skew.Precedence.LOWEST);
        this._emit(';\n');
        break;
      }

      case Skew.NodeKind.FOREACH: {
        this._emit(this._indent + 'foreach (var ' + Skew.CSharpEmitter._mangleName(node.symbol) + ' in ');
        this._emitExpression(node.foreachValue(), Skew.Precedence.LOWEST);
        this._emit(')\n');
        this._emitBlock(node.foreachBlock());
        this._emit('\n');
        break;
      }

      case Skew.NodeKind.FOR: {
        var setup = node.forSetup();
        var test = node.forTest();
        var update = node.forUpdate();
        this._emit(this._indent + 'for (');

        if (!setup.isEmptySequence()) {
          if (setup.kind == Skew.NodeKind.VARIABLES) {
            var symbol1 = setup.firstChild().symbol.asVariableSymbol();
            this._emitExpressionOrType(symbol1.type, symbol1.resolvedType);
            this._emit(' ');

            for (var child2 = setup.firstChild(); child2 != null; child2 = child2.nextSibling()) {
              symbol1 = child2.symbol.asVariableSymbol();
              assert(child2.kind == Skew.NodeKind.VARIABLE);

              if (child2.previousSibling() != null) {
                this._emit(', ');
              }

              this._emit(Skew.CSharpEmitter._mangleName(symbol1) + ' = ');
              this._emitExpression(symbol1.value, Skew.Precedence.COMMA);
            }
          }

          else {
            this._emitExpression(setup, Skew.Precedence.LOWEST);
          }
        }

        this._emit('; ');

        if (!test.isEmptySequence()) {
          this._emitExpression(test, Skew.Precedence.LOWEST);
        }

        this._emit('; ');

        if (!update.isEmptySequence()) {
          this._emitExpression(update, Skew.Precedence.LOWEST);
        }

        this._emit(')\n');
        this._emitBlock(node.forBlock());
        this._emit('\n');
        break;
      }

      case Skew.NodeKind.TRY: {
        var tryBlock = node.tryBlock();
        var finallyBlock = node.finallyBlock();
        this._emit(this._indent + 'try\n');
        this._emitBlock(tryBlock);
        this._emit('\n');

        for (var child3 = tryBlock.nextSibling(); child3 != finallyBlock; child3 = child3.nextSibling()) {
          if (child3.comments != null) {
            this._emit('\n');
            this._emitComments(child3.comments);
          }

          this._emit(this._indent + 'catch');

          if (child3.symbol != null) {
            this._emit(' (');
            this._emitExpressionOrType(child3.symbol.asVariableSymbol().type, child3.symbol.resolvedType);
            this._emit(' ' + Skew.CSharpEmitter._mangleName(child3.symbol) + ')');
          }

          this._emit('\n');
          this._emitBlock(child3.catchBlock());
          this._emit('\n');
        }

        if (finallyBlock != null) {
          if (finallyBlock.comments != null) {
            this._emit('\n');
            this._emitComments(finallyBlock.comments);
          }

          this._emit(this._indent + 'finally\n');
          this._emitBlock(finallyBlock);
          this._emit('\n');
        }
        break;
      }

      case Skew.NodeKind.WHILE: {
        this._emit(this._indent + 'while (');
        this._emitExpression(node.whileTest(), Skew.Precedence.LOWEST);
        this._emit(')\n');
        this._emitBlock(node.whileBlock());
        this._emit('\n');
        break;
      }

      default: {
        assert(false);
        break;
      }
    }

    if (Skew.in_NodeKind.isLoop(node.kind)) {
      var label1 = in_IntMap.get(this._loopLabels, node.id, null);

      if (label1 != null) {
        this._emit(this._indent + Skew.CSharpEmitter._mangleName(label1) + (node.nextSibling() != null ? ':\n' : ':;\n'));
      }
    }
  };

  Skew.CSharpEmitter.prototype._emitContent = function(content) {
    switch (content.kind()) {
      case Skew.ContentKind.BOOL: {
        this._emit(Skew.in_Content.asBool(content).toString());
        break;
      }

      case Skew.ContentKind.INT: {
        this._emit(Skew.in_Content.asInt(content).toString());
        break;
      }

      case Skew.ContentKind.DOUBLE: {
        this._emit(Skew.in_Content.asDouble(content).toString());
        break;
      }

      case Skew.ContentKind.STRING: {
        this._emit(Skew.quoteString(Skew.in_Content.asString(content), Skew.QuoteStyle.DOUBLE));
        break;
      }
    }
  };

  Skew.CSharpEmitter.prototype._emitCommaSeparatedExpressions = function(from, to) {
    while (from != to) {
      this._emitExpression(from, Skew.Precedence.COMMA);
      from = from.nextSibling();

      if (from != to) {
        this._emit(', ');
      }
    }
  };

  Skew.CSharpEmitter.prototype._emitExpression = function(node, precedence) {
    var kind = node.kind;
    var symbol = node.symbol;

    if (symbol != null) {
      this._handleSymbol(symbol);
    }

    switch (kind) {
      case Skew.NodeKind.TYPE:
      case Skew.NodeKind.LAMBDA_TYPE: {
        this._emitType(node.resolvedType);
        break;
      }

      case Skew.NodeKind.NULL: {
        this._emit('null');
        break;
      }

      case Skew.NodeKind.NAME: {
        this._emit(symbol != null ? Skew.CSharpEmitter._fullName(symbol) : node.asString());
        break;
      }

      case Skew.NodeKind.DOT: {
        this._emitExpression(node.dotTarget(), Skew.Precedence.MEMBER);
        this._emit('.' + (symbol != null ? Skew.CSharpEmitter._mangleName(symbol) : node.asString()));
        break;
      }

      case Skew.NodeKind.CONSTANT: {
        this._emitContent(node.content);
        break;
      }

      case Skew.NodeKind.CALL: {
        var value = node.callValue();

        if (value.kind == Skew.NodeKind.SUPER) {
          this._emit('base');

          if (symbol.kind != Skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
            this._emit('.');
            this._emit(Skew.CSharpEmitter._mangleName(symbol));
          }
        }

        else if (symbol != null && symbol.kind == Skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
          this._emit('new ');
          this._emitType(node.resolvedType);
        }

        else if (value.kind == Skew.NodeKind.DOT && value.asString() == 'new') {
          this._emit('new ');
          this._emitExpression(value.dotTarget(), Skew.Precedence.MEMBER);
        }

        else {
          this._emitExpression(value, Skew.Precedence.UNARY_POSTFIX);
        }

        this._emit('(');
        this._emitCommaSeparatedExpressions(value.nextSibling(), null);
        this._emit(')');
        break;
      }

      case Skew.NodeKind.CAST: {
        var resolvedType = node.resolvedType;
        var type = node.castType();
        var value1 = node.castValue();

        if (type.kind == Skew.NodeKind.TYPE && type.resolvedType == Skew.Type.DYNAMIC) {
          this._emitExpression(value1, precedence);
        }

        // C# doesn't have a cast from bool to int
        else if (this._cache.isNumeric(resolvedType) && value1.resolvedType == this._cache.boolType) {
          this._emitExpression(Skew.Node.createHook(value1.remove(), new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.IntContent(1)), new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.IntContent(0))), precedence);
        }

        // C# doesn't have a cast from int to bool
        else if (resolvedType == this._cache.boolType && this._cache.isNumeric(value1.resolvedType)) {
          this._emitExpression(Skew.Node.createBinary(Skew.NodeKind.NOT_EQUAL, value1.remove(), new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.IntContent(0))), precedence);
        }

        else {
          if (Skew.Precedence.UNARY_POSTFIX < precedence) {
            this._emit('(');
          }

          this._emit('(');
          this._emitExpression(type, Skew.Precedence.LOWEST);
          this._emit(')');
          this._emitExpression(value1, Skew.Precedence.UNARY_POSTFIX);

          if (Skew.Precedence.UNARY_POSTFIX < precedence) {
            this._emit(')');
          }
        }
        break;
      }

      case Skew.NodeKind.INITIALIZER_LIST: {
        this._emit('new ');
        this._emitType(node.resolvedType);

        if (node.hasChildren()) {
          this._emit(' { ');
          this._emitCommaSeparatedExpressions(node.firstChild(), null);
          this._emit(' }');
        }

        else {
          this._emit('()');
        }
        break;
      }

      case Skew.NodeKind.INDEX: {
        this._emitExpression(node.indexLeft(), Skew.Precedence.UNARY_POSTFIX);
        this._emit('[');
        this._emitExpression(node.indexRight(), Skew.Precedence.LOWEST);
        this._emit(']');
        break;
      }

      case Skew.NodeKind.ASSIGN_INDEX: {
        if (Skew.Precedence.ASSIGN < precedence) {
          this._emit('(');
        }

        this._emitExpression(node.assignIndexLeft(), Skew.Precedence.UNARY_POSTFIX);
        this._emit('[');
        this._emitExpression(node.assignIndexCenter(), Skew.Precedence.LOWEST);
        this._emit('] = ');
        this._emitExpression(node.assignIndexRight(), Skew.Precedence.ASSIGN);

        if (Skew.Precedence.ASSIGN < precedence) {
          this._emit(')');
        }
        break;
      }

      case Skew.NodeKind.PARAMETERIZE: {
        var value2 = node.parameterizeValue();

        if (value2.isType()) {
          this._emitType(node.resolvedType);
        }

        else {
          this._emitExpression(value2, precedence);
          this._emit('<');
          this._emitCommaSeparatedExpressions(value2.nextSibling(), null);
          this._emit('>');
        }
        break;
      }

      case Skew.NodeKind.SEQUENCE: {
        if (Skew.Precedence.COMMA <= precedence) {
          this._emit('(');
        }

        this._emitCommaSeparatedExpressions(node.firstChild(), null);

        if (Skew.Precedence.COMMA <= precedence) {
          this._emit(')');
        }
        break;
      }

      case Skew.NodeKind.HOOK: {
        if (Skew.Precedence.ASSIGN < precedence) {
          this._emit('(');
        }

        this._emitExpression(node.hookTest(), Skew.Precedence.LOGICAL_OR);
        this._emit(' ? ');
        this._emitExpression(node.hookTrue(), Skew.Precedence.ASSIGN);
        this._emit(' : ');
        this._emitExpression(node.hookFalse(), Skew.Precedence.ASSIGN);

        if (Skew.Precedence.ASSIGN < precedence) {
          this._emit(')');
        }
        break;
      }

      case Skew.NodeKind.LAMBDA: {
        var oldEnclosingFunction = this._enclosingFunction;
        this._enclosingFunction = symbol.asFunctionSymbol();
        this._emitArgumentList(symbol.asFunctionSymbol());
        this._emit(' =>\n');
        this._emitBlock(symbol.asFunctionSymbol().block);
        this._enclosingFunction = oldEnclosingFunction;
        break;
      }

      case Skew.NodeKind.COMPLEMENT:
      case Skew.NodeKind.DECREMENT:
      case Skew.NodeKind.INCREMENT:
      case Skew.NodeKind.NEGATIVE:
      case Skew.NodeKind.NOT:
      case Skew.NodeKind.POSITIVE: {
        var value3 = node.unaryValue();
        var info = Skew.operatorInfo[kind];

        if (info.precedence < precedence) {
          this._emit('(');
        }

        this._emit(info.text);
        this._emitExpression(value3, info.precedence);

        if (info.precedence < precedence) {
          this._emit(')');
        }
        break;
      }

      default: {
        if (Skew.in_NodeKind.isBinary(kind)) {
          var left = node.binaryLeft();
          var right = node.binaryRight();

          // Some types stupidly don't implement operator "=="
          if ((kind == Skew.NodeKind.EQUAL || kind == Skew.NodeKind.NOT_EQUAL) && left.resolvedType.isParameter() && right.resolvedType.isParameter()) {
            if (kind == Skew.NodeKind.NOT_EQUAL) {
              this._emit('!');
            }

            this._emit('EqualityComparer<');
            this._emitType(left.resolvedType);
            this._emit('>.Default.Equals(');
            this._emitExpression(left, Skew.Precedence.COMMA);
            this._emit(', ');
            this._emitExpression(right, Skew.Precedence.COMMA);
            this._emit(')');
            this._usingNames['System.Collections.Generic'] = 0;
          }

          // C# doesn't have the ">>>" operator
          else if (kind == Skew.NodeKind.UNSIGNED_SHIFT_RIGHT && this._cache.isEquivalentToInt(left.resolvedType) && this._cache.isEquivalentToInt(right.resolvedType)) {
            this._emit('(int)((uint)');
            this._emitExpression(left, Skew.Precedence.UNARY_PREFIX);
            this._emit(' >> ');
            this._emitExpression(right, Skew.Precedence.SHIFT + 1 | 0);
            this._emit(')');
          }

          else {
            var info1 = Skew.operatorInfo[kind];

            if (info1.precedence < precedence) {
              this._emit('(');
            }

            this._emitExpression(left, info1.precedence + (info1.associativity == Skew.Associativity.RIGHT | 0) | 0);
            this._emit(' ' + info1.text + ' ');
            this._emitExpression(right, info1.precedence + (info1.associativity == Skew.Associativity.LEFT | 0) | 0);

            if (info1.precedence < precedence) {
              this._emit(')');
            }
          }
        }

        else {
          assert(false);
        }
        break;
      }
    }
  };

  Skew.CSharpEmitter._isCompactNodeKind = function(kind) {
    return kind == Skew.NodeKind.EXPRESSION || kind == Skew.NodeKind.VARIABLES || Skew.in_NodeKind.isJump(kind);
  };

  Skew.CSharpEmitter._fullName = function(symbol) {
    var parent = symbol.parent;

    if (parent != null && parent.kind != Skew.SymbolKind.OBJECT_GLOBAL && !Skew.in_SymbolKind.isParameter(symbol.kind)) {
      var enclosingName = Skew.CSharpEmitter._fullName(parent);

      if (symbol.kind == Skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
        return enclosingName;
      }

      return enclosingName + '.' + Skew.CSharpEmitter._mangleName(symbol);
    }

    return Skew.CSharpEmitter._mangleName(symbol);
  };

  Skew.CSharpEmitter._mangleName = function(symbol) {
    if (symbol.kind == Skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
      symbol = symbol.parent;
    }

    if (!symbol.isImportedOrExported() && symbol.name in Skew.CSharpEmitter._isKeyword) {
      return '_' + symbol.name;
    }

    return symbol.name;
  };

  Skew.CPlusPlusEmitter = function(_options, _cache) {
    Skew.Emitter.call(this);
    this._options = _options;
    this._cache = _cache;
    this._previousNode = null;
    this._previousSymbol = null;
    this._namespaceStack = [];
    this._symbolsCheckedForInclude = {};
    this._includeNames = Object.create(null);
  };

  __extends(Skew.CPlusPlusEmitter, Skew.Emitter);

  Skew.CPlusPlusEmitter.prototype.visit = function(global) {
    // Avoid emitting unnecessary stuff
    Skew.shakingPass(global, this._cache.entryPointSymbol, Skew.ShakingMode.USE_TYPES);
    this._markVirtualFunctions(global);
    var sorted = this._sortedObjects(global);

    // Nested types in C++ can't be forward declared
    for (var i = 0, list = sorted, count = list.length; i < count; ++i) {
      var symbol = list[i];
      this._moveNestedObjectToEnclosingNamespace(symbol);
    }

    // Emit code in passes to deal with C++'s forward declarations
    for (var i1 = 0, list1 = sorted, count1 = list1.length; i1 < count1; ++i1) {
      var symbol1 = list1[i1];
      this._declareObject(symbol1);
    }

    for (var i2 = 0, list2 = sorted, count2 = list2.length; i2 < count2; ++i2) {
      var symbol2 = list2[i2];
      this._defineObject(symbol2);
    }

    this._adjustNamespace(null);

    for (var i4 = 0, list4 = sorted, count4 = list4.length; i4 < count4; ++i4) {
      var symbol3 = list4[i4];

      if (!symbol3.isImported()) {
        for (var i3 = 0, list3 = symbol3.variables, count3 = list3.length; i3 < count3; ++i3) {
          var variable = list3[i3];

          if (variable.kind == Skew.SymbolKind.VARIABLE_GLOBAL) {
            this._emitVariable(variable, Skew.CPlusPlusEmitter.CodeMode.IMPLEMENT);
          }
        }
      }
    }

    this._adjustNamespace(null);

    for (var i6 = 0, list6 = sorted, count6 = list6.length; i6 < count6; ++i6) {
      var symbol4 = list6[i6];

      if (!symbol4.isImported()) {
        for (var i5 = 0, list5 = symbol4.functions, count5 = list5.length; i5 < count5; ++i5) {
          var $function = list5[i5];
          this._emitFunction($function, Skew.CPlusPlusEmitter.CodeMode.IMPLEMENT);
        }
      }
    }

    this._finalizeEmittedFile();
    this._createSource(this._options.outputFile, Skew.EmitMode.ALWAYS_EMIT);
  };

  Skew.CPlusPlusEmitter.prototype._emitNewlineBeforeSymbol = function(symbol, mode) {
    if (this._previousSymbol != null && (!Skew.in_SymbolKind.isVariable(this._previousSymbol.kind) || !Skew.in_SymbolKind.isVariable(symbol.kind) || symbol.comments != null) && (mode != Skew.CPlusPlusEmitter.CodeMode.DEFINE || !Skew.in_SymbolKind.isFunction(this._previousSymbol.kind) || !Skew.in_SymbolKind.isFunction(symbol.kind) || symbol.comments != null) && (mode != Skew.CPlusPlusEmitter.CodeMode.DECLARE || this._previousSymbol.kind != Skew.SymbolKind.OBJECT_CLASS || symbol.kind != Skew.SymbolKind.OBJECT_CLASS)) {
      this._emit('\n');
    }

    this._previousSymbol = null;
  };

  Skew.CPlusPlusEmitter.prototype._emitNewlineAfterSymbol = function(symbol) {
    this._previousSymbol = symbol;
  };

  Skew.CPlusPlusEmitter.prototype._emitNewlineBeforeStatement = function(node) {
    if (this._previousNode != null && (node.comments != null || !Skew.CPlusPlusEmitter._isCompactNodeKind(this._previousNode.kind) || !Skew.CPlusPlusEmitter._isCompactNodeKind(node.kind))) {
      this._emit('\n');
    }

    this._previousNode = null;
  };

  Skew.CPlusPlusEmitter.prototype._emitNewlineAfterStatement = function(node) {
    this._previousNode = node;
  };

  Skew.CPlusPlusEmitter.prototype._adjustNamespace = function(symbol) {
    // Get the namespace chain for this symbol
    var symbols = [];

    while (symbol != null && symbol.kind != Skew.SymbolKind.OBJECT_GLOBAL) {
      if (symbol.kind == Skew.SymbolKind.OBJECT_NAMESPACE) {
        symbols.unshift(symbol);
      }

      symbol = symbol.parent;
    }

    // Find the intersection
    var limit = Math.min(this._namespaceStack.length, symbols.length);
    var i = 0;

    while (i < limit) {
      if (this._namespaceStack[i] != symbols[i]) {
        break;
      }

      ++i;
    }

    // Leave the old namespace
    while (this._namespaceStack.length > i) {
      var object = this._namespaceStack.pop();
      this._decreaseIndent();
      this._emit(this._indent + '}\n');
      this._emitNewlineAfterSymbol(object);
    }

    // Enter the new namespace
    while (this._namespaceStack.length < symbols.length) {
      var object1 = symbols[this._namespaceStack.length];
      this._emitNewlineBeforeSymbol(object1, Skew.CPlusPlusEmitter.CodeMode.DEFINE);
      this._emit(this._indent + 'namespace ' + Skew.CPlusPlusEmitter._mangleName(object1) + ' {\n');
      this._increaseIndent();
      this._namespaceStack.push(object1);
    }
  };

  Skew.CPlusPlusEmitter.prototype._emitComments = function(comments) {
    if (comments != null) {
      for (var i = 0, list = comments, count = list.length; i < count; ++i) {
        var comment = list[i];
        this._emit(this._indent + '//' + comment);
      }
    }
  };

  Skew.CPlusPlusEmitter.prototype._moveNestedObjectToEnclosingNamespace = function(symbol) {
    var parent = symbol.parent;

    while (parent != null && parent.kind == Skew.SymbolKind.OBJECT_CLASS) {
      parent = parent.parent;
    }

    symbol.parent = parent;
  };

  Skew.CPlusPlusEmitter.prototype._declareObject = function(symbol) {
    if (symbol.isImported()) {
      return;
    }

    switch (symbol.kind) {
      case Skew.SymbolKind.OBJECT_ENUM: {
        this._adjustNamespace(symbol);
        this._emitNewlineBeforeSymbol(symbol, Skew.CPlusPlusEmitter.CodeMode.DECLARE);
        this._emit(this._indent + 'enum struct ' + Skew.CPlusPlusEmitter._mangleName(symbol) + ' {\n');
        this._increaseIndent();

        for (var i = 0, list = symbol.variables, count = list.length; i < count; ++i) {
          var variable = list[i];
          this._emitVariable(variable, Skew.CPlusPlusEmitter.CodeMode.DECLARE);
        }

        this._decreaseIndent();
        this._emit(this._indent + '};\n');
        this._emitNewlineAfterSymbol(symbol);
        break;
      }

      case Skew.SymbolKind.OBJECT_CLASS: {
        this._adjustNamespace(symbol);
        this._emitNewlineBeforeSymbol(symbol, Skew.CPlusPlusEmitter.CodeMode.DECLARE);
        this._emitTypeParameters(symbol.parameters);
        this._emit(this._indent + 'struct ' + Skew.CPlusPlusEmitter._mangleName(symbol) + ';\n');
        this._emitNewlineAfterSymbol(symbol);
        break;
      }
    }
  };

  Skew.CPlusPlusEmitter.prototype._defineObject = function(symbol) {
    if (symbol.isImported()) {
      return;
    }

    switch (symbol.kind) {
      case Skew.SymbolKind.OBJECT_CLASS: {
        this._adjustNamespace(symbol);
        this._emitNewlineBeforeSymbol(symbol, Skew.CPlusPlusEmitter.CodeMode.DEFINE);
        this._emitComments(symbol.comments);
        this._emitTypeParameters(symbol.parameters);
        this._emit(this._indent + 'struct ' + Skew.CPlusPlusEmitter._mangleName(symbol));

        if (symbol.baseClass != null) {
          this._emit(' : ');
          this._emitType(symbol.baseClass.resolvedType, Skew.CPlusPlusEmitter.CppEmitType.BARE);
        }

        this._emit(' {\n');
        this._increaseIndent();

        for (var i = 0, list = symbol.functions, count = list.length; i < count; ++i) {
          var $function = list[i];
          this._emitFunction($function, Skew.CPlusPlusEmitter.CodeMode.DEFINE);
        }

        for (var i1 = 0, list1 = symbol.variables, count1 = list1.length; i1 < count1; ++i1) {
          var variable = list1[i1];
          this._emitVariable(variable, Skew.CPlusPlusEmitter.CodeMode.DEFINE);
        }

        this._decreaseIndent();
        this._emit(this._indent + '};\n');
        this._emitNewlineAfterSymbol(symbol);
        break;
      }

      case Skew.SymbolKind.OBJECT_NAMESPACE: {
        this._adjustNamespace(symbol);

        for (var i2 = 0, list2 = symbol.functions, count2 = list2.length; i2 < count2; ++i2) {
          var function1 = list2[i2];
          this._emitFunction(function1, Skew.CPlusPlusEmitter.CodeMode.DEFINE);
        }
        break;
      }
    }
  };

  Skew.CPlusPlusEmitter.prototype._emitFunction = function(symbol, mode) {
    var parent = symbol.parent.asObjectSymbol();
    var block = symbol.block;

    if (symbol.isImported() || mode == Skew.CPlusPlusEmitter.CodeMode.IMPLEMENT && block == null) {
      return;
    }

    // We can't use lambdas in C++ since they don't have the right semantics so no variable insertion is needed
    if (symbol.$this != null) {
      symbol.$this.name = 'this';
      symbol.$this.flags |= Skew.Symbol.IS_EXPORTED;
    }

    this._emitNewlineBeforeSymbol(symbol, mode);
    this._emitComments(symbol.comments);

    if (mode == Skew.CPlusPlusEmitter.CodeMode.IMPLEMENT) {
      // TODO: Merge these with the ones on the symbol when symbols have both
      this._emitTypeParameters(parent.parameters);
    }

    this._emitTypeParameters(symbol.parameters);
    this._emit(this._indent);

    if (mode == Skew.CPlusPlusEmitter.CodeMode.DEFINE && symbol.kind == Skew.SymbolKind.FUNCTION_GLOBAL && symbol.parent.kind == Skew.SymbolKind.OBJECT_CLASS) {
      this._emit('static ');
    }

    if (symbol.kind != Skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
      if (mode == Skew.CPlusPlusEmitter.CodeMode.DEFINE && symbol.isVirtual()) {
        this._emit('virtual ');
      }

      this._emitType(symbol.resolvedType.returnType, Skew.CPlusPlusEmitter.CppEmitType.DECLARATION);
    }

    if (mode == Skew.CPlusPlusEmitter.CodeMode.IMPLEMENT && parent.kind != Skew.SymbolKind.OBJECT_GLOBAL) {
      this._emit(Skew.CPlusPlusEmitter._fullName(parent));

      if (parent.parameters != null) {
        this._emit('<');

        for (var i = 0, list = parent.parameters, count = list.length; i < count; ++i) {
          var parameter = list[i];

          if (parameter != parent.parameters[0]) {
            this._emit(', ');
          }

          this._emit(Skew.CPlusPlusEmitter._mangleName(parameter));
        }

        this._emit('>');
      }

      this._emit('::');
    }

    this._emit(Skew.CPlusPlusEmitter._mangleName(symbol));
    this._emitArgumentList(symbol);

    if (mode == Skew.CPlusPlusEmitter.CodeMode.IMPLEMENT) {
      // Move the super constructor call out of the function body
      if (symbol.kind == Skew.SymbolKind.FUNCTION_CONSTRUCTOR && block.hasChildren()) {
        var first = block.firstChild();

        if (first.kind == Skew.NodeKind.EXPRESSION) {
          var call = first.expressionValue();

          if (call.kind == Skew.NodeKind.CALL && call.callValue().kind == Skew.NodeKind.SUPER) {
            this._emit(' : ');
            first.remove();
            this._emitExpression(call, Skew.Precedence.LOWEST);
          }
        }
      }

      this._emitBlock(block);
      this._emit('\n');
    }

    else {
      if (symbol.overridden != null && symbol.kind != Skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
        this._emit(' override');
      }

      this._emit(';\n');
    }

    this._emitNewlineAfterSymbol(symbol);
  };

  Skew.CPlusPlusEmitter.prototype._emitTypeParameters = function(parameters) {
    if (parameters != null) {
      this._emit(this._indent + 'template <');

      for (var i = 0, list = parameters, count = list.length; i < count; ++i) {
        var parameter = list[i];

        if (parameter != parameters[0]) {
          this._emit(', ');
        }

        this._emit('typename ' + Skew.CPlusPlusEmitter._mangleName(parameter));
      }

      this._emit('>\n');
    }
  };

  Skew.CPlusPlusEmitter.prototype._emitArgumentList = function(symbol) {
    this._emit('(');

    for (var i = 0, list = symbol.$arguments, count = list.length; i < count; ++i) {
      var argument = list[i];

      if (argument != symbol.$arguments[0]) {
        this._emit(', ');
      }

      this._emitType(argument.resolvedType, Skew.CPlusPlusEmitter.CppEmitType.DECLARATION);
      this._emit(Skew.CPlusPlusEmitter._mangleName(argument));
    }

    this._emit(')');
  };

  Skew.CPlusPlusEmitter.prototype._emitVariable = function(symbol, mode) {
    if (symbol.isImported()) {
      return;
    }

    // C++ can't forward-declare variables without also giving them external linkage
    var avoidFullName = symbol.kind == Skew.SymbolKind.VARIABLE_GLOBAL && symbol.parent.kind != Skew.SymbolKind.OBJECT_CLASS;

    if (mode == Skew.CPlusPlusEmitter.CodeMode.IMPLEMENT && symbol.kind != Skew.SymbolKind.VARIABLE_LOCAL) {
      this._adjustNamespace(avoidFullName ? symbol.parent : null);
    }

    this._emitNewlineBeforeSymbol(symbol, mode);

    if (symbol.kind == Skew.SymbolKind.VARIABLE_ENUM) {
      this._emit(this._indent + Skew.CPlusPlusEmitter._mangleName(symbol) + ',\n');
    }

    else {
      this._emit(this._indent);

      if (mode == Skew.CPlusPlusEmitter.CodeMode.DEFINE && symbol.kind == Skew.SymbolKind.VARIABLE_GLOBAL && symbol.parent.kind == Skew.SymbolKind.OBJECT_CLASS) {
        this._emit('static ');
      }

      this._emitType(symbol.resolvedType, Skew.CPlusPlusEmitter.CppEmitType.DECLARATION);

      if (mode == Skew.CPlusPlusEmitter.CodeMode.DEFINE) {
        this._emit(Skew.CPlusPlusEmitter._mangleName(symbol));
      }

      else {
        this._emit(avoidFullName ? Skew.CPlusPlusEmitter._mangleName(symbol) : Skew.CPlusPlusEmitter._fullName(symbol));

        if (symbol.value != null) {
          this._emit(' = ');
          this._emitExpression(symbol.value, Skew.Precedence.ASSIGN);
        }
      }

      this._emit(';\n');
    }

    this._emitNewlineAfterSymbol(symbol);
  };

  Skew.CPlusPlusEmitter.prototype._emitStatements = function(node) {
    this._previousNode = null;

    for (var child = node.firstChild(); child != null; child = child.nextSibling()) {
      this._emitNewlineBeforeStatement(child);
      this._emitComments(child.comments);
      this._emitStatement(child);
      this._emitNewlineAfterStatement(child);
    }

    this._previousNode = null;
  };

  Skew.CPlusPlusEmitter.prototype._emitBlock = function(node) {
    this._emit(' {\n');
    this._increaseIndent();
    this._emitStatements(node);
    this._decreaseIndent();
    this._emit(this._indent + '}');
  };

  Skew.CPlusPlusEmitter.prototype._emitStatement = function(node) {
    switch (node.kind) {
      case Skew.NodeKind.VARIABLES: {
        for (var child = node.firstChild(); child != null; child = child.nextSibling()) {
          this._emitVariable(child.symbol.asVariableSymbol(), Skew.CPlusPlusEmitter.CodeMode.IMPLEMENT);
        }
        break;
      }

      case Skew.NodeKind.EXPRESSION: {
        this._emit(this._indent);
        this._emitExpression(node.expressionValue(), Skew.Precedence.LOWEST);
        this._emit(';\n');
        break;
      }

      case Skew.NodeKind.BREAK: {
        this._emit(this._indent + 'break;\n');
        break;
      }

      case Skew.NodeKind.CONTINUE: {
        this._emit(this._indent + 'continue;\n');
        break;
      }

      case Skew.NodeKind.IF: {
        this._emit(this._indent);
        this._emitIf(node);
        this._emit('\n');
        break;
      }

      case Skew.NodeKind.SWITCH: {
        var switchValue = node.switchValue();
        this._emit(this._indent + 'switch (');
        this._emitExpression(switchValue, Skew.Precedence.LOWEST);
        this._emit(') {\n');
        this._increaseIndent();

        for (var child1 = switchValue.nextSibling(); child1 != null; child1 = child1.nextSibling()) {
          var block = child1.caseBlock();

          if (child1.previousSibling() != switchValue) {
            this._emit('\n');
          }

          if (child1.hasOneChild()) {
            this._emit(this._indent + 'default:');
          }

          else {
            for (var value = child1.firstChild(); value != block; value = value.nextSibling()) {
              if (value.previousSibling() != null) {
                this._emit('\n');
              }

              this._emit(this._indent + 'case ');
              this._emitExpression(value, Skew.Precedence.LOWEST);
              this._emit(':');
            }
          }

          this._emit(' {\n');
          this._increaseIndent();
          this._emitStatements(block);

          if (block.hasControlFlowAtEnd()) {
            this._emit(this._indent + 'break;\n');
          }

          this._decreaseIndent();
          this._emit(this._indent + '}\n');
        }

        this._decreaseIndent();
        this._emit(this._indent + '}\n');
        break;
      }

      case Skew.NodeKind.RETURN: {
        this._emit(this._indent + 'return');
        var value1 = node.returnValue();

        if (value1 != null) {
          this._emit(' ');
          this._emitExpression(value1, Skew.Precedence.LOWEST);
        }

        this._emit(';\n');
        break;
      }

      case Skew.NodeKind.THROW: {
        this._emit(this._indent + 'throw ');
        this._emitExpression(node.throwValue(), Skew.Precedence.LOWEST);
        this._emit(';\n');
        break;
      }

      case Skew.NodeKind.FOR: {
        var setup = node.forSetup();
        var test = node.forTest();
        var update = node.forUpdate();
        this._emit(this._indent + 'for (');

        if (!setup.isEmptySequence()) {
          if (setup.kind == Skew.NodeKind.VARIABLES) {
            this._emitType(setup.firstChild().symbol.asVariableSymbol().resolvedType, Skew.CPlusPlusEmitter.CppEmitType.DECLARATION);
            this._emit(' ');

            for (var child2 = setup.firstChild(); child2 != null; child2 = child2.nextSibling()) {
              var symbol = child2.symbol.asVariableSymbol();
              assert(child2.kind == Skew.NodeKind.VARIABLE);

              if (child2.previousSibling() != null) {
                this._emit(', ');
              }

              this._emit(Skew.CPlusPlusEmitter._mangleName(symbol) + ' = ');
              this._emitExpression(symbol.value, Skew.Precedence.COMMA);
            }
          }

          else {
            this._emitExpression(setup, Skew.Precedence.LOWEST);
          }
        }

        this._emit('; ');

        if (!test.isEmptySequence()) {
          this._emitExpression(test, Skew.Precedence.LOWEST);
        }

        this._emit('; ');

        if (!update.isEmptySequence()) {
          this._emitExpression(update, Skew.Precedence.LOWEST);
        }

        this._emit(')');
        this._emitBlock(node.forBlock());
        this._emit('\n');
        break;
      }

      case Skew.NodeKind.TRY: {
        var tryBlock = node.tryBlock();
        var finallyBlock = node.finallyBlock();
        this._emit(this._indent + 'try');
        this._emitBlock(tryBlock);
        this._emit('\n');

        for (var child3 = tryBlock.nextSibling(); child3 != finallyBlock; child3 = child3.nextSibling()) {
          if (child3.comments != null) {
            this._emit('\n');
            this._emitComments(child3.comments);
          }

          this._emit(this._indent + 'catch');

          if (child3.symbol != null) {
            this._emit(' (');
            this._emitType(child3.symbol.resolvedType, Skew.CPlusPlusEmitter.CppEmitType.DECLARATION);
            this._emit(Skew.CPlusPlusEmitter._mangleName(child3.symbol) + ')');
          }

          else {
            this._emit(' (...)');
          }

          this._emitBlock(child3.catchBlock());
          this._emit('\n');
        }

        if (finallyBlock != null) {
          if (finallyBlock.comments != null) {
            this._emit('\n');
            this._emitComments(finallyBlock.comments);
          }

          this._emit(this._indent + 'finally');
          this._emitBlock(finallyBlock);
          this._emit('\n');
        }
        break;
      }

      case Skew.NodeKind.WHILE: {
        this._emit(this._indent + 'while (');
        this._emitExpression(node.whileTest(), Skew.Precedence.LOWEST);
        this._emit(')');
        this._emitBlock(node.whileBlock());
        this._emit('\n');
        break;
      }

      case Skew.NodeKind.FOREACH: {
        var symbol1 = node.symbol.asVariableSymbol();
        var value2 = node.foreachValue();
        this._emit(this._indent + 'for (');
        this._emitType(symbol1.resolvedType, Skew.CPlusPlusEmitter.CppEmitType.DECLARATION);
        this._emit(Skew.CPlusPlusEmitter._mangleName(symbol1) + ' : ');

        if (value2.resolvedType.isReference()) {
          this._emit('*');
          this._emitExpression(value2, Skew.Precedence.UNARY_PREFIX);
        }

        else {
          this._emitExpression(value2, Skew.Precedence.LOWEST);
        }

        this._emit(')');
        this._emitBlock(node.foreachBlock());
        this._emit('\n');
        break;
      }

      default: {
        assert(false);
        break;
      }
    }
  };

  Skew.CPlusPlusEmitter.prototype._emitIf = function(node) {
    this._emit('if (');
    this._emitExpression(node.ifTest(), Skew.Precedence.LOWEST);
    this._emit(')');
    this._emitBlock(node.ifTrue());
    var block = node.ifFalse();

    if (block != null) {
      var singleIf = block.hasOneChild() && block.firstChild().kind == Skew.NodeKind.IF ? block.firstChild() : null;
      this._emit('\n\n');
      this._emitComments(block.comments);

      if (singleIf != null) {
        this._emitComments(singleIf.comments);
      }

      this._emit(this._indent + 'else');

      if (singleIf != null) {
        this._emit(' ');
        this._emitIf(singleIf);
      }

      else {
        this._emitBlock(block);
      }
    }
  };

  Skew.CPlusPlusEmitter.prototype._emitContent = function(content) {
    switch (content.kind()) {
      case Skew.ContentKind.BOOL: {
        this._emit(Skew.in_Content.asBool(content).toString());
        break;
      }

      case Skew.ContentKind.INT: {
        this._emit(Skew.in_Content.asInt(content).toString());
        break;
      }

      case Skew.ContentKind.DOUBLE: {
        this._emit(Skew.in_Content.asDouble(content).toString());
        break;
      }

      case Skew.ContentKind.STRING: {
        this._emit(Skew.quoteString(Skew.in_Content.asString(content), Skew.QuoteStyle.DOUBLE) + '_s');
        break;
      }
    }
  };

  Skew.CPlusPlusEmitter.prototype._emitCommaSeparatedExpressions = function(from, to) {
    while (from != to) {
      this._emitExpression(from, Skew.Precedence.COMMA);
      from = from.nextSibling();

      if (from != to) {
        this._emit(', ');
      }
    }
  };

  Skew.CPlusPlusEmitter.prototype._emitExpression = function(node, precedence) {
    var kind = node.kind;
    var symbol = node.symbol;

    if (symbol != null) {
      this._handleSymbol(symbol);
    }

    switch (kind) {
      case Skew.NodeKind.TYPE:
      case Skew.NodeKind.LAMBDA_TYPE: {
        this._emitType(node.resolvedType, Skew.CPlusPlusEmitter.CppEmitType.BARE);
        break;
      }

      case Skew.NodeKind.NULL: {
        this._emit('nullptr');
        break;
      }

      case Skew.NodeKind.NAME: {
        this._emit(symbol != null ? Skew.CPlusPlusEmitter._fullName(symbol) : node.asString());
        break;
      }

      case Skew.NodeKind.DOT: {
        var target = node.dotTarget();
        var type = target.resolvedType;
        this._emitExpression(target, Skew.Precedence.MEMBER);
        this._emit((type != null && type.isReference() ? '->' : '.') + (symbol != null ? Skew.CPlusPlusEmitter._mangleName(symbol) : node.asString()));
        break;
      }

      case Skew.NodeKind.CONSTANT: {
        if (node.resolvedType.isEnum()) {
          this._emit('(');
          this._emitType(node.resolvedType, Skew.CPlusPlusEmitter.CppEmitType.NORMAL);
          this._emit(')');
        }

        this._emitContent(node.content);
        break;
      }

      case Skew.NodeKind.CALL: {
        var value = node.callValue();
        var wrap = false;

        if (value.kind == Skew.NodeKind.SUPER) {
          this._emit(Skew.CPlusPlusEmitter._fullName(symbol));
        }

        else if (symbol != null && symbol.kind == Skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
          wrap = precedence == Skew.Precedence.MEMBER;

          if (wrap) {
            this._emit('(');
          }

          this._emit('new ');
          this._emitType(node.resolvedType, Skew.CPlusPlusEmitter.CppEmitType.BARE);
        }

        else if (value.kind == Skew.NodeKind.DOT && value.asString() == 'new') {
          this._emit('new ');
          this._emitExpression(value.dotTarget(), Skew.Precedence.MEMBER);
        }

        else {
          this._emitExpression(value, Skew.Precedence.UNARY_POSTFIX);
        }

        this._emit('(');
        this._emitCommaSeparatedExpressions(node.firstChild().nextSibling(), null);
        this._emit(')');

        if (wrap) {
          this._emit(')');
        }
        break;
      }

      case Skew.NodeKind.CAST: {
        var value1 = node.castValue();

        if (node.castType().resolvedType == Skew.Type.DYNAMIC) {
          this._emitExpression(value1, precedence);
        }

        else {
          if (Skew.Precedence.UNARY_POSTFIX < precedence) {
            this._emit('(');
          }

          this._emit('(');
          this._emitType(node.resolvedType, Skew.CPlusPlusEmitter.CppEmitType.NORMAL);
          this._emit(')');
          this._emitExpression(value1, Skew.Precedence.UNARY_POSTFIX);

          if (Skew.Precedence.UNARY_POSTFIX < precedence) {
            this._emit(')');
          }
        }
        break;
      }

      case Skew.NodeKind.INDEX: {
        this._emitExpression(node.indexLeft(), Skew.Precedence.UNARY_POSTFIX);
        this._emit('[');
        this._emitExpression(node.indexRight(), Skew.Precedence.LOWEST);
        this._emit(']');
        break;
      }

      case Skew.NodeKind.ASSIGN_INDEX: {
        if (Skew.Precedence.ASSIGN < precedence) {
          this._emit('(');
        }

        this._emitExpression(node.assignIndexLeft(), Skew.Precedence.UNARY_POSTFIX);
        this._emit('[');
        this._emitExpression(node.assignIndexCenter(), Skew.Precedence.LOWEST);
        this._emit('] = ');
        this._emitExpression(node.assignIndexRight(), Skew.Precedence.ASSIGN);

        if (Skew.Precedence.ASSIGN < precedence) {
          this._emit(')');
        }
        break;
      }

      case Skew.NodeKind.PARAMETERIZE: {
        var value2 = node.parameterizeValue();

        if (value2.isType()) {
          this._emitType(node.resolvedType, Skew.CPlusPlusEmitter.CppEmitType.NORMAL);
        }

        else {
          this._emitExpression(value2, precedence);
          this._emit('<');

          for (var child = value2.nextSibling(); child != null; child = child.nextSibling()) {
            if (child.previousSibling() != value2) {
              this._emit(', ');
            }

            this._emitType(child.resolvedType, Skew.CPlusPlusEmitter.CppEmitType.NORMAL);
          }

          this._emit('>');
        }
        break;
      }

      case Skew.NodeKind.SEQUENCE: {
        if (Skew.Precedence.COMMA <= precedence) {
          this._emit('(');
        }

        this._emitCommaSeparatedExpressions(node.firstChild(), null);

        if (Skew.Precedence.COMMA <= precedence) {
          this._emit(')');
        }
        break;
      }

      case Skew.NodeKind.HOOK: {
        if (Skew.Precedence.ASSIGN < precedence) {
          this._emit('(');
        }

        this._emitExpression(node.hookTest(), Skew.Precedence.LOGICAL_OR);
        this._emit(' ? ');
        this._emitExpression(node.hookTrue(), Skew.Precedence.ASSIGN);
        this._emit(' : ');
        this._emitExpression(node.hookFalse(), Skew.Precedence.ASSIGN);

        if (Skew.Precedence.ASSIGN < precedence) {
          this._emit(')');
        }
        break;
      }

      case Skew.NodeKind.LAMBDA: {
        var lambda = symbol.asFunctionSymbol();
        this._emit('[=]');
        this._emitArgumentList(lambda);
        this._emit(' -> ');
        this._emitType(lambda.resolvedType.returnType, Skew.CPlusPlusEmitter.CppEmitType.NORMAL);
        this._emitBlock(lambda.block);
        break;
      }

      case Skew.NodeKind.INITIALIZER_LIST:
      case Skew.NodeKind.INITIALIZER_MAP: {
        this._emit('new ');
        this._emitType(node.resolvedType, Skew.CPlusPlusEmitter.CppEmitType.BARE);

        if (node.hasChildren()) {
          this._emit('()');
        }

        else {
          this._emit(' { ');
          this._emitCommaSeparatedExpressions(node.firstChild(), null);
          this._emit(' }');
        }
        break;
      }

      case Skew.NodeKind.PAIR: {
        this._includeNames['<utility>'] = 0;
        this._emit('std::make_pair(');
        this._emitCommaSeparatedExpressions(node.firstChild(), null);
        this._emit(')');
        break;
      }

      case Skew.NodeKind.COMPLEMENT:
      case Skew.NodeKind.DECREMENT:
      case Skew.NodeKind.INCREMENT:
      case Skew.NodeKind.NEGATIVE:
      case Skew.NodeKind.NOT:
      case Skew.NodeKind.POSITIVE: {
        var value3 = node.unaryValue();
        var info = Skew.operatorInfo[kind];

        if (info.precedence < precedence) {
          this._emit('(');
        }

        this._emit(info.text);
        this._emitExpression(value3, info.precedence);

        if (info.precedence < precedence) {
          this._emit(')');
        }
        break;
      }

      default: {
        if (Skew.in_NodeKind.isBinary(kind)) {
          // Clang warns about "&&" inside "||" or "&" inside "|" without parentheses
          var parent = node.parent();

          if (parent != null && (parent.kind == Skew.NodeKind.LOGICAL_OR && kind == Skew.NodeKind.LOGICAL_AND || parent.kind == Skew.NodeKind.BITWISE_OR && kind == Skew.NodeKind.BITWISE_AND)) {
            precedence = Skew.Precedence.MEMBER;
          }

          var info1 = Skew.operatorInfo[kind];

          if (info1.precedence < precedence) {
            this._emit('(');
          }

          this._emitExpression(node.binaryLeft(), info1.precedence + (info1.associativity == Skew.Associativity.RIGHT | 0) | 0);
          this._emit(' ' + info1.text + ' ');
          this._emitExpression(node.binaryRight(), info1.precedence + (info1.associativity == Skew.Associativity.LEFT | 0) | 0);

          if (info1.precedence < precedence) {
            this._emit(')');
          }
        }

        else {
          assert(false);
        }
        break;
      }
    }
  };

  Skew.CPlusPlusEmitter.prototype._emitType = function(type, mode) {
    if (type == null) {
      this._emit(mode == Skew.CPlusPlusEmitter.CppEmitType.DECLARATION ? 'void ' : 'void');
    }

    else if (type == Skew.Type.DYNAMIC) {
      this._emit('void *');
    }

    else if (type.kind == Skew.TypeKind.LAMBDA) {
      this._includeNames['<functional>'] = 0;
      this._emit('std::function<');
      this._emitType(type.returnType, Skew.CPlusPlusEmitter.CppEmitType.DECLARATION);
      this._emit('(');

      for (var i = 0, count = type.argumentTypes.length; i < count; ++i) {
        if (i != 0) {
          this._emit(', ');
        }

        this._emitType(type.argumentTypes[i], Skew.CPlusPlusEmitter.CppEmitType.NORMAL);
      }

      this._emit(mode == Skew.CPlusPlusEmitter.CppEmitType.DECLARATION ? ')> ' : ')>');
    }

    else {
      assert(type.kind == Skew.TypeKind.SYMBOL);
      this._handleSymbol(type.symbol);
      this._emit(Skew.CPlusPlusEmitter._fullName(type.symbol));

      if (type.isParameterized()) {
        this._emit('<');

        for (var i1 = 0, count1 = type.substitutions.length; i1 < count1; ++i1) {
          if (i1 != 0) {
            this._emit(', ');
          }

          this._emitType(type.substitutions[i1], Skew.CPlusPlusEmitter.CppEmitType.NORMAL);
        }

        this._emit('>');
      }

      if (type.isReference() && mode != Skew.CPlusPlusEmitter.CppEmitType.BARE) {
        this._emit(' *');
      }

      else if (mode == Skew.CPlusPlusEmitter.CppEmitType.DECLARATION) {
        this._emit(' ');
      }
    }
  };

  Skew.CPlusPlusEmitter.prototype._finalizeEmittedFile = function() {
    var includes = Object.keys(this._includeNames);

    if (!(includes.length == 0)) {
      includes.sort(function(a, b) {
        return in_string.compare(a, b);
      });

      for (var i = 0, list = includes, count = list.length; i < count; ++i) {
        var include = list[i];
        this._emitPrefix('#include ' + (in_string.startsWith(include, '<') && in_string.endsWith(include, '>') ? include : '"' + include + '"') + '\n');
      }

      this._emitPrefix('\n');
    }

    this._adjustNamespace(null);
    this._previousSymbol = null;
    this._symbolsCheckedForInclude = {};
    this._includeNames = Object.create(null);
  };

  Skew.CPlusPlusEmitter.prototype._handleSymbol = function(symbol) {
    if (!Skew.in_SymbolKind.isLocal(symbol.kind) && !(symbol.id in this._symbolsCheckedForInclude)) {
      this._symbolsCheckedForInclude[symbol.id] = 0;

      if (symbol.annotations != null) {
        for (var i = 0, list = symbol.annotations, count = list.length; i < count; ++i) {
          var annotation = list[i];

          if (annotation.symbol != null && annotation.symbol.fullName() == 'include') {
            var value = annotation.annotationValue();

            if (value.childCount() == 2) {
              this._includeNames[value.lastChild().asString()] = 0;
            }
          }
        }
      }

      if (symbol.parent != null) {
        this._handleSymbol(symbol.parent);
      }
    }
  };

  Skew.CPlusPlusEmitter._isCompactNodeKind = function(kind) {
    return kind == Skew.NodeKind.EXPRESSION || kind == Skew.NodeKind.VARIABLES || Skew.in_NodeKind.isJump(kind);
  };

  Skew.CPlusPlusEmitter._fullName = function(symbol) {
    var parent = symbol.parent;

    if (parent != null && parent.kind != Skew.SymbolKind.OBJECT_GLOBAL && !Skew.in_SymbolKind.isParameter(symbol.kind)) {
      return Skew.CPlusPlusEmitter._fullName(parent) + '::' + Skew.CPlusPlusEmitter._mangleName(symbol);
    }

    return Skew.CPlusPlusEmitter._mangleName(symbol);
  };

  Skew.CPlusPlusEmitter._mangleName = function(symbol) {
    if (symbol.kind == Skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
      return Skew.CPlusPlusEmitter._mangleName(symbol.parent);
    }

    if (!symbol.isImportedOrExported() && symbol.name in Skew.CPlusPlusEmitter._isKeyword) {
      return '_' + symbol.name;
    }

    return symbol.name;
  };

  Skew.CPlusPlusEmitter.CppEmitType = {
    BARE: 0,
    NORMAL: 1,
    DECLARATION: 2
  };

  Skew.CPlusPlusEmitter.CodeMode = {
    DECLARE: 0,
    DEFINE: 1,
    IMPLEMENT: 2
  };

  Skew.QuoteStyle = {
    DOUBLE: 0,
    SINGLE: 1,
    SHORTEST: 2
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

  Skew.JavaScriptEmitter = function(_context, _options, _cache) {
    Skew.Emitter.call(this);
    this._context = _context;
    this._options = _options;
    this._cache = _cache;
    this._isSpecialVariableNeeded = {};
    this._loopLabels = {};
    this._specialVariables = {};
    this._enclosingFunction = null;
    this._enclosingLoop = null;
    this._namespacePrefix = '';
    this._previousNode = null;
    this._previousSymbol = null;
    this._currentColumn = 0;
    this._currentLine = 0;
    this._generator = new Skew.SourceMapGenerator();
    this._previousSource = null;
    this._previousStart = 0;
    this._sourceMap = false;
    this._allSymbols = [];
    this._localVariableUnionFind = new Skew.UnionFind();
    this._namingGroupIndexForSymbol = {};
    this._symbolCounts = {};
    this._nextSymbolName = 0;
    this._mangle = false;
    this._minify = false;
    this._needsSemicolon = false;
    this._newline = '\n';
    this._space = ' ';
    this._currentSelf = null;
    this._needsSelf = false;
  };

  __extends(Skew.JavaScriptEmitter, Skew.Emitter);

  Skew.JavaScriptEmitter.prototype.visit = function(global) {
    this._mangle = this._options.jsMangle;
    this._minify = this._options.jsMinify;
    this._sourceMap = this._options.jsSourceMap;

    if (this._minify) {
      this._indentAmount = '';
      this._newline = '';
      this._space = '';
    }

    // Load special-cased variables
    for (var i = 0, list = global.variables, count = list.length; i < count; ++i) {
      var variable = list[i];
      var special = in_StringMap.get(Skew.JavaScriptEmitter.SPECIAL_VARIABLE_MAP, variable.name, Skew.JavaScriptEmitter.SpecialVariable.NONE);

      if (special != Skew.JavaScriptEmitter.SpecialVariable.NONE) {
        this._specialVariables[special] = variable;
      }
    }

    assert(Skew.JavaScriptEmitter.SpecialVariable.EXTENDS in this._specialVariables);
    assert(Skew.JavaScriptEmitter.SpecialVariable.IS_BOOL in this._specialVariables);
    assert(Skew.JavaScriptEmitter.SpecialVariable.IS_DOUBLE in this._specialVariables);
    assert(Skew.JavaScriptEmitter.SpecialVariable.IS_INT in this._specialVariables);
    assert(Skew.JavaScriptEmitter.SpecialVariable.IS_STRING in this._specialVariables);
    assert(Skew.JavaScriptEmitter.SpecialVariable.MULTIPLY in this._specialVariables);

    // Preprocess the code
    if (this._mangle) {
      this._liftGlobals1(global);
    }

    if (this._options.inlineAllFunctions) {
      this._maybeInlineFunctions(global);
    }

    Skew.shakingPass(global, this._cache.entryPointSymbol, Skew.ShakingMode.IGNORE_TYPES);
    this._prepareGlobal(global);
    this._convertLambdasToFunctions(global);
    var objects = this._sortedObjects(global);

    // The entire body of code is wrapped in a closure for safety
    this._emit(this._indent + '(function()' + this._space + '{' + this._newline);
    this._increaseIndent();

    // Emit special-cased variables that must come first
    var specialVariables = in_IntMap.values(this._specialVariables);
    specialVariables.sort(function(a, b) {
      return a.id - b.id | 0;
    });

    for (var i1 = 0, list1 = specialVariables, count1 = list1.length; i1 < count1; ++i1) {
      var variable1 = list1[i1];

      if (variable1.id in this._isSpecialVariableNeeded) {
        if (variable1.value.kind == Skew.NodeKind.LAMBDA) {
          this._emitFunction(this._convertLambdaToFunction(variable1));
        }

        else {
          this._emitVariable(variable1);
        }
      }
    }

    // Emit objects and functions
    for (var i2 = 0, list2 = objects, count2 = list2.length; i2 < count2; ++i2) {
      var object = list2[i2];
      this._emitObject(object);
    }

    // Emit variables
    for (var i4 = 0, list4 = objects, count4 = list4.length; i4 < count4; ++i4) {
      var object1 = list4[i4];
      var o = object1;
      this._namespacePrefix = '';

      while (o.kind != Skew.SymbolKind.OBJECT_GLOBAL) {
        this._namespacePrefix = Skew.JavaScriptEmitter._mangleName(o) + '.' + this._namespacePrefix;
        o = o.parent.asObjectSymbol();
      }

      for (var i3 = 0, list3 = object1.variables, count3 = list3.length; i3 < count3; ++i3) {
        var variable2 = list3[i3];

        if (!(specialVariables.indexOf(variable2) != -1)) {
          this._emitVariable(variable2);
        }
      }
    }

    // Emit entry point
    var entryPointSymbol = this._cache.entryPointSymbol;

    if (entryPointSymbol != null) {
      var type = entryPointSymbol.resolvedType;
      var callText = Skew.JavaScriptEmitter._fullName(entryPointSymbol) + (type.argumentTypes.length == 0 ? '()' : '(process.argv.slice(2))');
      this._emitSemicolonIfNeeded();
      this._emit(this._newline + this._indent + (type.returnType == this._cache.intType ? 'process.exit(' + callText + ')' : callText));
      this._emitSemicolonAfterStatement();
    }

    // End the closure wrapping everything
    this._decreaseIndent();
    this._emit(this._indent + '})();\n');
    var codeName = this._options.outputDirectory != null ? this._options.outputDirectory + '/compiled.js' : this._options.outputFile;
    var mapName = codeName + '.map';

    // Obfuscate the sourceMappingURL so it's not incorrectly picked up as the
    // sourceMappingURL for the compiled JavaScript compiler file
    if (this._sourceMap) {
      this._emit('/');
      this._emit('/# sourceMappingURL=' + Skew.splitPath(mapName).entry + '\n');
    }

    this._createSource(codeName, Skew.EmitMode.ALWAYS_EMIT);

    // Create the source map
    if (this._sourceMap) {
      this._emit(this._generator.toString());
      this._createSource(mapName, Skew.EmitMode.ALWAYS_EMIT);
    }
  };

  Skew.JavaScriptEmitter.prototype._emit = function(text) {
    if (this._minify || this._sourceMap) {
      for (var i = 0, count = text.length; i < count; ++i) {
        var c = text.charCodeAt(i);

        if (c == 10) {
          this._currentColumn = 0;
          ++this._currentLine;
        }

        else {
          ++this._currentColumn;
        }
      }
    }

    this._code.append(text);
  };

  Skew.JavaScriptEmitter.prototype._liftGlobals1 = function(global) {
    var globalObjects = [];
    var globalFunctions = [];
    var globalVariables = [];
    this._liftGlobals2(global, globalObjects, globalFunctions, globalVariables);

    for (var i = 0, list = globalObjects, count = list.length; i < count; ++i) {
      var object = list[i];
      object.parent = global;
    }

    for (var i1 = 0, list1 = globalFunctions, count1 = list1.length; i1 < count1; ++i1) {
      var $function = list1[i1];
      $function.parent = global;
    }

    for (var i2 = 0, list2 = globalVariables, count2 = list2.length; i2 < count2; ++i2) {
      var variable = list2[i2];
      variable.parent = global;
    }

    in_List.append1(global.objects, globalObjects);
    in_List.append1(global.functions, globalFunctions);
    in_List.append1(global.variables, globalVariables);
  };

  Skew.JavaScriptEmitter.prototype._liftGlobals2 = function(symbol, globalObjects, globalFunctions, globalVariables) {
    var self = this;
    var shouldLiftGlobals = symbol.parent != null;

    // Scan over child objects
    in_List.removeIf(symbol.objects, function(object) {
      self._liftGlobals2(object, globalObjects, globalFunctions, globalVariables);

      if (shouldLiftGlobals && !object.isImportedOrExported()) {
        globalObjects.push(object);
        return true;
      }

      return false;
    });
    in_List.removeIf(symbol.functions, function($function) {
      if (shouldLiftGlobals && $function.kind == Skew.SymbolKind.FUNCTION_GLOBAL && !$function.isImportedOrExported()) {
        globalFunctions.push($function);
        return true;
      }

      return false;
    });

    // Scan over child variables
    in_List.removeIf(symbol.variables, function(variable) {
      if (shouldLiftGlobals && variable.kind == Skew.SymbolKind.VARIABLE_GLOBAL && !variable.isImportedOrExported()) {
        globalVariables.push(variable);
        return true;
      }

      return false;
    });
  };

  Skew.JavaScriptEmitter.prototype._collectInlineableFunctions = function(symbol, listAppends, mapInserts) {
    for (var i = 0, list = symbol.objects, count = list.length; i < count; ++i) {
      var object = list[i];
      this._collectInlineableFunctions(object, listAppends, mapInserts);
    }

    for (var i3 = 0, list3 = symbol.functions, count3 = list3.length; i3 < count3; ++i3) {
      var $function = list3[i3];

      if ($function.block == null || !$function.block.hasTwoChildren()) {
        continue;
      }

      var $arguments = $function.$arguments;

      // "foo([], 0)" => "[0]" where "foo" is "def foo(a, b) { a.push(b); return a }"
      if ($arguments.length == 2) {
        var first = $function.block.firstChild();
        var second = $function.block.lastChild();

        if (first.kind == Skew.NodeKind.EXPRESSION && first.expressionValue().kind == Skew.NodeKind.CALL && second.kind == Skew.NodeKind.RETURN && second.returnValue() != null) {
          var call = first.expressionValue();
          var callValue = call.callValue();

          if (call.hasTwoChildren() && callValue.kind == Skew.NodeKind.DOT && callValue.asString() == 'push' && Skew.JavaScriptEmitter._isReferenceTo(callValue.dotTarget(), $arguments[0]) && Skew.JavaScriptEmitter._isReferenceTo(call.lastChild(), $arguments[1]) && Skew.JavaScriptEmitter._isReferenceTo(second.returnValue(), $arguments[0])) {
            for (var i1 = 0, list1 = this._context.callGraph.callInfoForSymbol($function).callSites, count1 = list1.length; i1 < count1; ++i1) {
              var callSite = list1[i1];

              if (callSite != null && callSite.callNode.kind == Skew.NodeKind.CALL) {
                assert(callSite.callNode.symbol == $function);
                listAppends.push(callSite.callNode);
              }
            }
          }
        }
      }

      // "foo({}, 0, 1)" => "{0: 1}" where "foo" is "def foo(a, b, c) { a[b] = c; return a }"
      else if ($arguments.length == 3) {
        var keyType = $arguments[1].resolvedType;
        var first1 = $function.block.firstChild();
        var second1 = $function.block.lastChild();

        if ((keyType == Skew.Type.DYNAMIC || this._cache.isEquivalentToInt(keyType) || this._cache.isEquivalentToString(keyType)) && first1.kind == Skew.NodeKind.EXPRESSION && first1.expressionValue().kind == Skew.NodeKind.ASSIGN_INDEX && second1.kind == Skew.NodeKind.RETURN && second1.returnValue() != null) {
          var assign = first1.expressionValue();

          if (Skew.JavaScriptEmitter._isReferenceTo(assign.assignIndexLeft(), $arguments[0]) && Skew.JavaScriptEmitter._isReferenceTo(assign.assignIndexCenter(), $arguments[1]) && Skew.JavaScriptEmitter._isReferenceTo(assign.assignIndexRight(), $arguments[2]) && Skew.JavaScriptEmitter._isReferenceTo(second1.returnValue(), $arguments[0])) {
            for (var i2 = 0, list2 = this._context.callGraph.callInfoForSymbol($function).callSites, count2 = list2.length; i2 < count2; ++i2) {
              var callSite1 = list2[i2];

              if (callSite1 != null && callSite1.callNode.kind == Skew.NodeKind.CALL) {
                assert(callSite1.callNode.symbol == $function);
                mapInserts.push(callSite1.callNode);
              }
            }
          }
        }
      }
    }
  };

  // This uses iteration until fixed point to avoid dependence on inlining order
  Skew.JavaScriptEmitter.prototype._maybeInlineFunctions = function(global) {
    var listAppends = [];
    var mapInserts = [];
    this._collectInlineableFunctions(global, listAppends, mapInserts);

    // List append fixed point
    var changed = true;

    while (changed) {
      changed = false;

      for (var i = 0, count = listAppends.length; i < count; ++i) {
        var node = listAppends[i];

        // This will be null if it was already inlined
        if (node == null) {
          continue;
        }

        var firstArgument = node.callValue().nextSibling();
        var secondArgument = firstArgument.nextSibling();

        // List expressions are sometimes casted
        if (firstArgument.kind == Skew.NodeKind.CAST) {
          firstArgument = firstArgument.castValue();
        }

        // Only check when the inputs are constants
        if (firstArgument.kind == Skew.NodeKind.INITIALIZER_LIST) {
          node.become(firstArgument.remove().appendChild(secondArgument.remove()));
          listAppends[i] = null;
          changed = true;
        }
      }
    }

    // Map insert fixed point
    changed = true;

    while (changed) {
      changed = false;

      for (var i1 = 0, count1 = mapInserts.length; i1 < count1; ++i1) {
        var node1 = mapInserts[i1];

        // This will be null if it was already inlined
        if (node1 == null) {
          continue;
        }

        var firstArgument1 = node1.callValue().nextSibling();
        var secondArgument1 = firstArgument1.nextSibling();
        var thirdArgument = secondArgument1.nextSibling();

        // Map expressions are sometimes casted
        if (firstArgument1.kind == Skew.NodeKind.CAST) {
          firstArgument1 = firstArgument1.castValue();
        }

        // Only check when the inputs are constants
        if (firstArgument1.kind == Skew.NodeKind.INITIALIZER_MAP && (secondArgument1.isInt() || secondArgument1.isString())) {
          node1.become(firstArgument1.remove().appendChild(Skew.Node.createPair(secondArgument1.remove(), thirdArgument.remove())));
          mapInserts[i1] = null;
          changed = true;
        }
      }
    }
  };

  Skew.JavaScriptEmitter.prototype._prepareGlobal = function(global) {
    // Lower certain stuff into JavaScript (for example, "x as bool" becomes "!!x")
    this._patchObject(global);

    // Skip everything below if we aren't mangling
    if (!this._mangle) {
      return;
    }

    // These will be culled by tree shaking regardless of whether they are needed
    for (var i = 0, list = in_IntMap.values(this._specialVariables), count = list.length; i < count; ++i) {
      var variable = list[i];

      if (variable.id in this._isSpecialVariableNeeded) {
        this._allocateNamingGroupIndex(variable);
        this._patchNode(variable.value);
      }
    }

    // Rename symbols based on frequency for better compression
    this._renameSymbols();
  };

  Skew.JavaScriptEmitter.prototype._convertLambdaToFunction = function(variable) {
    var $function = variable.value.symbol.asFunctionSymbol();
    $function.kind = Skew.SymbolKind.FUNCTION_GLOBAL;
    $function.parent = variable.parent;
    $function.name = variable.name;

    if ($function.block.parent() != null) {
      $function.block.remove();
    }

    return $function;
  };

  Skew.JavaScriptEmitter.prototype._convertLambdasToFunctions = function(symbol) {
    var self = this;

    for (var i = 0, list = symbol.objects, count = list.length; i < count; ++i) {
      var object = list[i];
      self._convertLambdasToFunctions(object);
    }

    in_List.removeIf(symbol.variables, function(variable) {
      if (variable.kind == Skew.SymbolKind.VARIABLE_GLOBAL && variable.isConst() && !variable.isExported() && variable.value != null && variable.value.kind == Skew.NodeKind.LAMBDA) {
        symbol.functions.push(self._convertLambdaToFunction(variable));
        return true;
      }

      return false;
    });
  };

  Skew.JavaScriptEmitter.prototype._allocateNamingGroupIndex = function(symbol) {
    if (this._mangle && !(symbol.id in this._namingGroupIndexForSymbol)) {
      var index = this._localVariableUnionFind.allocate1();
      this._namingGroupIndexForSymbol[symbol.id] = index;
      this._allSymbols.push(symbol);

      // Explicitly add function arguments since they won't be reached by
      // normal tree traversal
      if (Skew.in_SymbolKind.isFunction(symbol.kind)) {
        var $this = symbol.asFunctionSymbol().$this;

        if ($this != null) {
          this._allocateNamingGroupIndex($this);
        }

        for (var i = 0, list = symbol.asFunctionSymbol().$arguments, count = list.length; i < count; ++i) {
          var argument = list[i];
          this._allocateNamingGroupIndex(argument);
        }
      }
    }
  };

  Skew.JavaScriptEmitter.prototype._renameSymbols = function() {
    // This holds the groups used for naming. Unioning two labels using
    // this object will cause both groups of symbols to have the same name.
    var namingGroupsUnionFind = new Skew.UnionFind().allocate2(this._allSymbols.length);

    // These are optional and only reduce the number of generated names
    var order = [];
    this._aliasLocalVariables(namingGroupsUnionFind, order);
    this._aliasUnrelatedProperties(namingGroupsUnionFind, order);

    // Ensure all overridden symbols have the same generated name. This is
    // manditory for correctness, otherwise virtual functions break.
    var namingGroupMap = {};

    for (var i = 0, list = this._allSymbols, count1 = list.length; i < count1; ++i) {
      var symbol = list[i];

      if (Skew.in_SymbolKind.isFunction(symbol.kind)) {
        var $function = symbol.asFunctionSymbol();
        assert($function.id in this._namingGroupIndexForSymbol);
        var id = in_IntMap.get(namingGroupMap, $function.namingGroup, -1);

        if (id == -1) {
          namingGroupMap[$function.namingGroup] = this._namingGroupIndexForSymbol[$function.id];
        }

        else {
          namingGroupsUnionFind.union(id, this._namingGroupIndexForSymbol[$function.id]);
        }
      }
    }

    // Collect all reserved names together into one big set for querying
    var reservedNames = in_StringMap.clone(Skew.JavaScriptEmitter._isKeyword);

    for (var i1 = 0, list1 = this._allSymbols, count2 = list1.length; i1 < count2; ++i1) {
      var symbol1 = list1[i1];

      if (!Skew.JavaScriptEmitter._shouldRenameSymbol(symbol1)) {
        reservedNames[symbol1.name] = 0;
      }
    }

    // Everything that should have the same name is now grouped together.
    // Generate and assign names to all internal symbols, but use shorter
    // names for more frequently used symbols.
    var sortedGroups = [];

    for (var i3 = 0, list3 = this._extractGroups(namingGroupsUnionFind, Skew.JavaScriptEmitter.ExtractGroupsMode.ALL_SYMBOLS), count4 = list3.length; i3 < count4; ++i3) {
      var group = list3[i3];
      var count = 0;

      for (var i2 = 0, list2 = group, count3 = list2.length; i2 < count3; ++i2) {
        var symbol2 = list2[i2];

        if (Skew.JavaScriptEmitter._shouldRenameSymbol(symbol2)) {
          count += in_IntMap.get(this._symbolCounts, symbol2.id, 0);
        }
      }

      sortedGroups.push(new Skew.JavaScriptEmitter.SymbolGroup(group, count));
    }

    // Create a total order to make builds deterministic when maps use hashing
    sortedGroups.sort(function(a, b) {
      var difference = b.count - a.count | 0;

      if (difference == 0) {
        difference = b.symbols.length - a.symbols.length | 0;

        for (var i = 0; difference == 0 && i < a.symbols.length; ++i) {
          difference = a.symbols[i].id - b.symbols[i].id | 0;
        }
      }

      return difference;
    });

    for (var i5 = 0, list5 = sortedGroups, count6 = list5.length; i5 < count6; ++i5) {
      var group1 = list5[i5];
      var name = '';

      for (var i4 = 0, list4 = group1.symbols, count5 = list4.length; i4 < count5; ++i4) {
        var symbol3 = list4[i4];

        if (Skew.JavaScriptEmitter._shouldRenameSymbol(symbol3)) {
          if (name == '') {
            name = this._generateSymbolName(reservedNames);
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
  Skew.JavaScriptEmitter.prototype._aliasLocalVariables = function(unionFind, order) {
    this._zipTogetherInOrder(unionFind, order, this._extractGroups(this._localVariableUnionFind, Skew.JavaScriptEmitter.ExtractGroupsMode.ONLY_LOCAL_VARIABLES));
  };

  // Merge all related types together into naming groups. This ensures names
  // will be unique within a subclass hierarchy allowing names to be
  // duplicated in separate subclass hierarchies.
  Skew.JavaScriptEmitter.prototype._aliasUnrelatedProperties = function(unionFind, order) {
    var relatedTypesUnionFind = new Skew.UnionFind().allocate2(this._allSymbols.length);

    for (var i = 0, count1 = this._allSymbols.length; i < count1; ++i) {
      var symbol = this._allSymbols[i];

      if (symbol.kind == Skew.SymbolKind.OBJECT_CLASS) {
        var baseClass = symbol.asObjectSymbol().baseClass;

        if (baseClass != null) {
          relatedTypesUnionFind.union(i, this._namingGroupIndexForSymbol[baseClass.id]);
        }

        for (var i1 = 0, list = symbol.asObjectSymbol().variables, count = list.length; i1 < count; ++i1) {
          var variable = list[i1];
          relatedTypesUnionFind.union(i, this._namingGroupIndexForSymbol[variable.id]);
        }
      }
    }

    this._zipTogetherInOrder(unionFind, order, this._extractGroups(relatedTypesUnionFind, Skew.JavaScriptEmitter.ExtractGroupsMode.ONLY_INSTANCE_VARIABLES));
  };

  Skew.JavaScriptEmitter.prototype._zipTogetherInOrder = function(unionFind, order, groups) {
    for (var i1 = 0, list = groups, count1 = list.length; i1 < count1; ++i1) {
      var group = list[i1];

      for (var i = 0, count = group.length; i < count; ++i) {
        var symbol = group[i];
        var index = this._namingGroupIndexForSymbol[symbol.id];

        if (i >= order.length) {
          order.push(index);
        }

        else {
          unionFind.union(index, order[i]);
        }
      }
    }
  };

  Skew.JavaScriptEmitter.prototype._generateSymbolName = function(reservedNames) {
    while (true) {
      var name = Skew.JavaScriptEmitter._numberToName(this._nextSymbolName);
      ++this._nextSymbolName;

      if (!(name in reservedNames)) {
        return name;
      }
    }
  };

  Skew.JavaScriptEmitter.prototype._extractGroups = function(unionFind, mode) {
    var labelToGroup = {};

    for (var i = 0, list = this._allSymbols, count = list.length; i < count; ++i) {
      var symbol = list[i];

      if (mode == Skew.JavaScriptEmitter.ExtractGroupsMode.ONLY_LOCAL_VARIABLES && !Skew.in_SymbolKind.isLocalOrArgumentVariable(symbol.kind) || mode == Skew.JavaScriptEmitter.ExtractGroupsMode.ONLY_INSTANCE_VARIABLES && symbol.kind != Skew.SymbolKind.VARIABLE_INSTANCE) {
        continue;
      }

      assert(symbol.id in this._namingGroupIndexForSymbol);
      var label = unionFind.find(this._namingGroupIndexForSymbol[symbol.id]);
      var group = in_IntMap.get(labelToGroup, label, null);

      if (group == null) {
        group = [];
        labelToGroup[label] = group;
      }

      group.push(symbol);
    }

    // Sort each resulting group to make builds deterministic when maps use hashing
    var groups = in_IntMap.values(labelToGroup);

    for (var i1 = 0, list1 = groups, count1 = list1.length; i1 < count1; ++i1) {
      var group1 = list1[i1];
      group1.sort(function(a, b) {
        return a.id - b.id | 0;
      });
    }

    return groups;
  };

  Skew.JavaScriptEmitter.prototype._addMapping = function(range) {
    if (this._sourceMap && range != null) {
      var source = range.source;
      var start = range.start;

      if (this._previousSource != source || this._previousStart != start) {
        var location = source.indexToLineColumn(start);
        this._generator.addMapping(source, location.line, location.column, this._currentLine, this._currentColumn);
        this._previousStart = start;
        this._previousSource = source;
      }
    }
  };

  Skew.JavaScriptEmitter.prototype._emitSemicolonAfterStatement = function() {
    if (!this._minify) {
      this._emit(';\n');
    }

    else {
      this._needsSemicolon = true;
    }
  };

  Skew.JavaScriptEmitter.prototype._emitSemicolonIfNeeded = function() {
    if (this._needsSemicolon) {
      this._emit(';');
      this._needsSemicolon = false;
    }

    this._maybeEmitMinifedNewline();
  };

  // Lots of text editors choke up on long lines, so add a newline every now
  // and then for usability's sake
  Skew.JavaScriptEmitter.prototype._maybeEmitMinifedNewline = function() {
    if (this._minify && this._currentColumn > 1024) {
      this._emit('\n');
    }
  };

  Skew.JavaScriptEmitter.prototype._emitNewlineBeforeSymbol = function(symbol) {
    this._emitSemicolonIfNeeded();

    if (!this._minify && this._previousSymbol != null && (!Skew.in_SymbolKind.isObject(this._previousSymbol.kind) || !Skew.in_SymbolKind.isObject(symbol.kind) || symbol.comments != null || this._previousSymbol.kind == Skew.SymbolKind.OBJECT_ENUM || symbol.kind == Skew.SymbolKind.OBJECT_ENUM) && (!Skew.in_SymbolKind.isVariable(this._previousSymbol.kind) || !Skew.in_SymbolKind.isVariable(symbol.kind) || symbol.comments != null)) {
      this._emit('\n');
    }

    this._previousSymbol = null;
  };

  Skew.JavaScriptEmitter.prototype._emitNewlineAfterSymbol = function(symbol) {
    this._previousSymbol = symbol;
  };

  Skew.JavaScriptEmitter.prototype._emitNewlineBeforeStatement = function(node) {
    if (!this._minify && this._previousNode != null && (node.comments != null || !Skew.JavaScriptEmitter._isCompactNodeKind(this._previousNode.kind) || !Skew.JavaScriptEmitter._isCompactNodeKind(node.kind))) {
      this._emit('\n');
    }

    else {
      this._maybeEmitMinifedNewline();
    }

    this._previousNode = null;
  };

  Skew.JavaScriptEmitter.prototype._emitNewlineAfterStatement = function(node) {
    this._previousNode = node;
  };

  Skew.JavaScriptEmitter.prototype._emitComments = function(comments) {
    if (comments != null && !this._minify) {
      for (var i = 0, list = comments, count = list.length; i < count; ++i) {
        var comment = list[i];
        this._emit(this._indent + '//' + comment);
      }
    }
  };

  Skew.JavaScriptEmitter.prototype._emitObject = function(symbol) {
    if (symbol.isImported()) {
      return;
    }

    var foundPrimaryConstructor = false;
    this._namespacePrefix = symbol.parent != null ? Skew.JavaScriptEmitter._computeNamespacePrefix(symbol.parent.asObjectSymbol()) : '';

    switch (symbol.kind) {
      case Skew.SymbolKind.OBJECT_NAMESPACE:
      case Skew.SymbolKind.OBJECT_INTERFACE:
      case Skew.SymbolKind.OBJECT_WRAPPED: {
        if (symbol.forwardTo == null) {
          this._addMapping(symbol.range);
          this._emitNewlineBeforeSymbol(symbol);
          this._emitComments(symbol.comments);
          this._emit(this._indent + (this._namespacePrefix == '' && !symbol.isExported() ? 'var ' : this._namespacePrefix) + Skew.JavaScriptEmitter._mangleName(symbol) + this._space + '=' + this._space + '{}');
          this._emitSemicolonAfterStatement();
          this._emitNewlineAfterSymbol(symbol);
        }
        break;
      }

      case Skew.SymbolKind.OBJECT_ENUM: {
        this._addMapping(symbol.range);
        this._emitNewlineBeforeSymbol(symbol);
        this._emitComments(symbol.comments);
        this._emit(this._indent + (this._namespacePrefix == '' && !symbol.isExported() ? 'var ' : this._namespacePrefix) + Skew.JavaScriptEmitter._mangleName(symbol) + this._space + '=' + this._space + '{');
        this._increaseIndent();
        var isFirst = true;

        for (var i = 0, list = symbol.variables, count = list.length; i < count; ++i) {
          var variable = list[i];

          if (variable.kind == Skew.SymbolKind.VARIABLE_ENUM) {
            if (isFirst) {
              isFirst = false;
            }

            else {
              this._emit(',');
            }

            this._emit(this._newline);
            this._addMapping(variable.range);
            this._emitNewlineBeforeSymbol(variable);
            this._emitComments(variable.comments);
            this._emit(this._indent + Skew.JavaScriptEmitter._mangleName(variable) + ':' + this._space);
            this._emitContent(variable.value.content);
            this._emitNewlineAfterSymbol(variable);
          }
        }

        this._decreaseIndent();

        if (!isFirst && !this._minify) {
          this._emit('\n' + this._indent);
        }

        this._emit('}');
        this._emitSemicolonAfterStatement();
        this._emitNewlineAfterSymbol(symbol);
        break;
      }

      case Skew.SymbolKind.OBJECT_CLASS: {
        var variable1 = this._specialVariables[Skew.JavaScriptEmitter.SpecialVariable.EXTENDS];

        for (var i1 = 0, list1 = symbol.functions, count1 = list1.length; i1 < count1; ++i1) {
          var $function = list1[i1];

          if ($function.isPrimaryConstructor()) {
            if ($function.comments == null && symbol.comments != null) {
              $function.comments = symbol.comments;
            }

            this._emitFunction($function);

            if (symbol.baseClass != null) {
              if (!this._minify) {
                this._emit('\n' + this._indent);
              }

              this._emitSemicolonIfNeeded();
              this._addMapping(variable1.range);
              this._emit(Skew.JavaScriptEmitter._mangleName(variable1) + '(' + Skew.JavaScriptEmitter._fullName(symbol) + ',' + this._space + Skew.JavaScriptEmitter._fullName(symbol.baseClass) + ')');
              this._emitSemicolonAfterStatement();
            }

            foundPrimaryConstructor = true;
            break;
          }
        }

        // Emit a namespace if the class is never constructed
        if (!foundPrimaryConstructor) {
          this._emit(this._indent + (this._namespacePrefix == '' && !symbol.isExported() ? 'var ' : this._namespacePrefix) + Skew.JavaScriptEmitter._mangleName(symbol) + this._space + '=' + this._space + '{}');
          this._emitSemicolonAfterStatement();
        }
        break;
      }
    }

    if (symbol.kind != Skew.SymbolKind.OBJECT_GLOBAL) {
      this._namespacePrefix += Skew.JavaScriptEmitter._mangleName(symbol) + '.';
    }

    // Ignore instance functions if the class is never constructed
    for (var i2 = 0, list2 = symbol.functions, count2 = list2.length; i2 < count2; ++i2) {
      var function1 = list2[i2];

      if (foundPrimaryConstructor ? !function1.isPrimaryConstructor() : function1.kind == Skew.SymbolKind.FUNCTION_GLOBAL) {
        this._emitFunction(function1);
      }
    }
  };

  Skew.JavaScriptEmitter.prototype._emitArgumentList = function($arguments) {
    for (var i = 0, list = $arguments, count = list.length; i < count; ++i) {
      var argument = list[i];

      if (argument != $arguments[0]) {
        this._emit(',' + this._space);
      }

      this._addMapping(argument.range);
      this._emit(Skew.JavaScriptEmitter._mangleName(argument));
    }
  };

  Skew.JavaScriptEmitter.prototype._emitFunction = function(symbol) {
    if (symbol.block == null) {
      return;
    }

    this._addMapping(symbol.range);
    this._emitNewlineBeforeSymbol(symbol);
    this._emitComments(symbol.comments);
    var isExpression = this._namespacePrefix != '' || symbol.isExported();
    var name = Skew.JavaScriptEmitter._mangleName(symbol.isPrimaryConstructor() ? symbol.parent : symbol);

    if (isExpression) {
      this._emit(this._indent + this._namespacePrefix + (symbol.kind == Skew.SymbolKind.FUNCTION_INSTANCE ? 'prototype.' : '') + name + this._space + '=' + this._space + 'function(');
    }

    else {
      this._emit(this._indent + 'function ' + name + '(');
    }

    this._emitArgumentList(symbol.$arguments);
    this._emit(')' + this._space + '{' + this._newline);
    this._increaseIndent();
    this._enclosingFunction = symbol;
    this._emitStatements(symbol.block);
    this._enclosingFunction = null;
    this._decreaseIndent();
    this._emit(this._indent + '}');

    if (isExpression) {
      this._emitSemicolonAfterStatement();
    }

    else {
      this._needsSemicolon = false;
      this._emit(this._newline);
    }

    this._emitNewlineAfterSymbol(symbol);

    if (symbol.kind == Skew.SymbolKind.FUNCTION_CONSTRUCTOR && !symbol.isPrimaryConstructor()) {
      this._emitSemicolonIfNeeded();
      this._emit(this._newline + this._indent + Skew.JavaScriptEmitter._fullName(symbol) + '.prototype' + this._space + '=' + this._space + Skew.JavaScriptEmitter._fullName(symbol.parent) + '.prototype');
      this._emitSemicolonAfterStatement();
    }
  };

  Skew.JavaScriptEmitter.prototype._emitVariable = function(symbol) {
    if (symbol.isImported()) {
      return;
    }

    if (symbol.kind != Skew.SymbolKind.VARIABLE_INSTANCE && symbol.kind != Skew.SymbolKind.VARIABLE_ENUM && (symbol.value != null || this._namespacePrefix == '' || Skew.in_SymbolKind.isLocalOrArgumentVariable(symbol.kind))) {
      this._addMapping(symbol.range);
      this._emitNewlineBeforeSymbol(symbol);
      this._emitComments(symbol.comments);
      this._emit(this._indent + (this._namespacePrefix == '' && !symbol.isExported() || Skew.in_SymbolKind.isLocalOrArgumentVariable(symbol.kind) ? 'var ' : this._namespacePrefix) + Skew.JavaScriptEmitter._mangleName(symbol));

      if (symbol.value != null) {
        this._emit(this._space + '=' + this._space);
        this._emitExpression(symbol.value, Skew.Precedence.COMMA);
      }

      this._emitSemicolonAfterStatement();
      this._emitNewlineAfterSymbol(symbol);
    }
  };

  Skew.JavaScriptEmitter.prototype._emitStatements = function(node) {
    this._previousNode = null;

    for (var child = node.firstChild(); child != null; child = child.nextSibling()) {
      this._emitSemicolonIfNeeded();
      this._emitNewlineBeforeStatement(child);
      this._addMapping(child.range);
      this._emitComments(child.comments);
      this._emitStatement(child);
      this._emitNewlineAfterStatement(child);
    }

    this._previousNode = null;
  };

  Skew.JavaScriptEmitter.prototype._emitBlock = function(node, after, mode) {
    var shouldMinify = mode == Skew.JavaScriptEmitter.BracesMode.CAN_OMIT_BRACES && this._minify;
    this._addMapping(node.range);

    if (shouldMinify && !node.hasChildren()) {
      this._emit(';');
    }

    else if (shouldMinify && node.hasOneChild()) {
      if (after == Skew.JavaScriptEmitter.AfterToken.AFTER_KEYWORD) {
        this._emit(' ');
      }

      this._emitStatement(node.firstChild());
    }

    else {
      this._emit(this._space + '{' + this._newline);

      if (node.hasChildren()) {
        this._increaseIndent();
        this._emitStatements(node);
        this._decreaseIndent();
      }

      this._emit(this._indent + '}');
      this._needsSemicolon = false;
    }
  };

  Skew.JavaScriptEmitter.prototype._emitVariables = function(node) {
    this._emit('var ');

    for (var child = node.firstChild(); child != null; child = child.nextSibling()) {
      if (child.previousSibling() != null) {
        this._emit(',' + this._space);
      }

      var symbol = child.symbol.asVariableSymbol();
      this._emit(Skew.JavaScriptEmitter._mangleName(symbol));

      if (symbol.value != null) {
        this._emit(this._space + '=' + this._space);
        this._emitExpression(symbol.value, Skew.Precedence.COMMA);
      }
    }
  };

  Skew.JavaScriptEmitter.prototype._canRemoveSpaceBeforeKeyword = function(node) {
    var kind = node.kind;
    return Skew.in_NodeKind.isUnary(kind) || node.isString() || node.isNumberLessThanZero() || Skew.in_NodeKind.isInitializer(kind) || (kind == Skew.NodeKind.HOOK || kind == Skew.NodeKind.SEQUENCE) && this._canRemoveSpaceBeforeKeyword(node.firstChild());
  };

  Skew.JavaScriptEmitter.prototype._emitSpaceBeforeKeyword = function(node) {
    if (!this._minify || !this._canRemoveSpaceBeforeKeyword(node)) {
      this._emit(' ');
    }
  };

  Skew.JavaScriptEmitter.prototype._emitStatement = function(node) {
    switch (node.kind) {
      case Skew.NodeKind.VARIABLES: {
        this._emit(this._indent);
        this._emitVariables(node);
        this._emitSemicolonAfterStatement();
        break;
      }

      case Skew.NodeKind.EXPRESSION: {
        this._emit(this._indent);
        this._emitExpression(node.expressionValue(), Skew.Precedence.LOWEST);
        this._emitSemicolonAfterStatement();
        break;
      }

      case Skew.NodeKind.BREAK: {
        var label = in_IntMap.get(this._loopLabels, node.id, null);
        this._emit(this._indent + 'break');

        if (label != null) {
          this._emit(' ' + Skew.JavaScriptEmitter._mangleName(label));
        }

        this._emitSemicolonAfterStatement();
        break;
      }

      case Skew.NodeKind.CONTINUE: {
        this._emit(this._indent + 'continue');
        this._emitSemicolonAfterStatement();
        break;
      }

      case Skew.NodeKind.RETURN: {
        this._emit(this._indent + 'return');
        var value = node.returnValue();

        if (value != null) {
          this._emitSpaceBeforeKeyword(value);
          this._emitExpression(value, Skew.Precedence.LOWEST);
        }

        this._emitSemicolonAfterStatement();
        break;
      }

      case Skew.NodeKind.THROW: {
        var value1 = node.throwValue();
        this._emit(this._indent + 'throw');
        this._emitSpaceBeforeKeyword(value1);
        this._emitExpression(value1, Skew.Precedence.LOWEST);
        this._emitSemicolonAfterStatement();
        break;
      }

      case Skew.NodeKind.FOR: {
        var setup = node.forSetup();
        var test = node.forTest();
        var update = node.forUpdate();
        this._emit(this._indent);
        this._emitLoopLabel(node);
        this._emit('for' + this._space + '(');

        if (!setup.isEmptySequence()) {
          if (setup.kind == Skew.NodeKind.VARIABLES) {
            this._emitVariables(setup);
          }

          else {
            this._emitExpression(setup, Skew.Precedence.LOWEST);
          }
        }

        this._emit(';');

        if (!test.isEmptySequence()) {
          this._emit(this._space);
          this._emitExpression(test, Skew.Precedence.LOWEST);
        }

        this._emit(';');

        if (!update.isEmptySequence()) {
          this._emit(this._space);
          this._emitExpression(update, Skew.Precedence.LOWEST);
        }

        this._emit(')');
        this._emitBlock(node.forBlock(), Skew.JavaScriptEmitter.AfterToken.AFTER_PARENTHESIS, Skew.JavaScriptEmitter.BracesMode.CAN_OMIT_BRACES);
        this._emit(this._newline);
        break;
      }

      case Skew.NodeKind.FOREACH: {
        this._emit(this._indent);
        this._emitLoopLabel(node);
        this._emit('for' + this._space + '(var ' + Skew.JavaScriptEmitter._mangleName(node.symbol) + ' in ');
        this._emitExpression(node.foreachValue(), Skew.Precedence.LOWEST);
        this._emit(')');
        this._emitBlock(node.foreachBlock(), Skew.JavaScriptEmitter.AfterToken.AFTER_PARENTHESIS, Skew.JavaScriptEmitter.BracesMode.CAN_OMIT_BRACES);
        this._emit(this._newline);
        break;
      }

      case Skew.NodeKind.IF: {
        this._emit(this._indent);
        this._emitIf(node);
        this._emit(this._newline);
        break;
      }

      case Skew.NodeKind.SWITCH: {
        var switchValue = node.switchValue();
        this._emit(this._indent + 'switch' + this._space + '(');
        this._emitExpression(switchValue, Skew.Precedence.LOWEST);
        this._emit(')' + this._space + '{' + this._newline);
        this._increaseIndent();

        for (var child = switchValue.nextSibling(); child != null; child = child.nextSibling()) {
          var block = child.caseBlock();
          this._emitSemicolonIfNeeded();

          if (child.previousSibling() != switchValue) {
            this._emit(this._newline);
          }

          if (child.hasOneChild()) {
            this._emit(this._indent + 'default:');
          }

          else {
            for (var value2 = child.firstChild(); value2 != block; value2 = value2.nextSibling()) {
              if (value2.previousSibling() != null) {
                this._emit(this._newline);
              }

              this._emit(this._indent + 'case');
              this._emitSpaceBeforeKeyword(value2);
              this._emitExpression(value2, Skew.Precedence.LOWEST);
              this._emit(':');
            }
          }

          if (!this._minify) {
            this._emit(' {\n');
            this._increaseIndent();
          }

          this._emitStatements(block);

          if (block.hasControlFlowAtEnd()) {
            this._emitSemicolonIfNeeded();
            this._emit(this._indent + 'break');
            this._emitSemicolonAfterStatement();
          }

          if (!this._minify) {
            this._decreaseIndent();
            this._emit(this._indent + '}\n');
          }
        }

        this._decreaseIndent();
        this._emit(this._indent + '}' + this._newline);
        this._needsSemicolon = false;
        break;
      }

      case Skew.NodeKind.TRY: {
        var tryBlock = node.tryBlock();
        var finallyBlock = node.finallyBlock();
        this._emit(this._indent + 'try');
        this._emitBlock(tryBlock, Skew.JavaScriptEmitter.AfterToken.AFTER_KEYWORD, Skew.JavaScriptEmitter.BracesMode.MUST_KEEP_BRACES);
        this._emit(this._newline);

        for (var child1 = tryBlock.nextSibling(); child1 != finallyBlock; child1 = child1.nextSibling()) {
          this._emit(this._newline);
          this._emitComments(child1.comments);
          this._emit(this._indent + 'catch' + this._space + '(' + Skew.JavaScriptEmitter._mangleName(child1.symbol) + ')');
          this._emitBlock(child1.catchBlock(), Skew.JavaScriptEmitter.AfterToken.AFTER_KEYWORD, Skew.JavaScriptEmitter.BracesMode.MUST_KEEP_BRACES);
          this._emit(this._newline);
        }

        if (finallyBlock != null) {
          this._emit(this._newline);
          this._emitComments(finallyBlock.comments);
          this._emit(this._indent + 'finally');
          this._emitBlock(finallyBlock, Skew.JavaScriptEmitter.AfterToken.AFTER_KEYWORD, Skew.JavaScriptEmitter.BracesMode.MUST_KEEP_BRACES);
          this._emit(this._newline);
        }
        break;
      }

      case Skew.NodeKind.WHILE: {
        this._emit(this._indent);
        this._emitLoopLabel(node);
        this._emit('while' + this._space + '(');
        this._emitExpression(node.whileTest(), Skew.Precedence.LOWEST);
        this._emit(')');
        this._emitBlock(node.whileBlock(), Skew.JavaScriptEmitter.AfterToken.AFTER_PARENTHESIS, Skew.JavaScriptEmitter.BracesMode.CAN_OMIT_BRACES);
        this._emit(this._newline);
        break;
      }

      default: {
        assert(false);
        break;
      }
    }
  };

  Skew.JavaScriptEmitter.prototype._emitLoopLabel = function(node) {
    var label = in_IntMap.get(this._loopLabels, node.id, null);

    if (label != null) {
      this._emit(Skew.JavaScriptEmitter._mangleName(label) + ':' + this._space);
    }
  };

  Skew.JavaScriptEmitter.prototype._emitIf = function(node) {
    var trueBlock = node.ifTrue();
    var falseBlock = node.ifFalse();
    this._emit('if' + this._space + '(');
    this._emitExpression(node.ifTest(), Skew.Precedence.LOWEST);
    this._emit(')');

    // Make sure to always keep braces to avoid the dangling "else" case
    // "if (a) if (b) c; else d; else e;"
    // "if (a) { if (b) if (c) d; else e; } else f;"
    // "if (a) { if (b) c; else if (d) e; } else f;"
    // "if (a) { while (true) if (b) break; } else c;"
    var braces = Skew.JavaScriptEmitter.BracesMode.CAN_OMIT_BRACES;

    if (falseBlock != null) {
      var statement = trueBlock.blockStatement();

      if (statement != null && (statement.kind == Skew.NodeKind.IF || statement.kind == Skew.NodeKind.FOR && statement.forBlock().blockStatement() != null || statement.kind == Skew.NodeKind.FOREACH && statement.foreachBlock().blockStatement() != null || statement.kind == Skew.NodeKind.WHILE && statement.whileBlock().blockStatement() != null)) {
        braces = Skew.JavaScriptEmitter.BracesMode.MUST_KEEP_BRACES;
      }
    }

    this._emitBlock(node.ifTrue(), Skew.JavaScriptEmitter.AfterToken.AFTER_PARENTHESIS, braces);

    if (falseBlock != null) {
      var singleIf = Skew.JavaScriptEmitter._singleIf(falseBlock);
      this._emitSemicolonIfNeeded();
      this._emit(this._newline + this._newline);
      this._emitComments(falseBlock.comments);

      if (singleIf != null) {
        this._emitComments(singleIf.comments);
      }

      this._emit(this._indent + 'else');

      if (singleIf != null) {
        this._emit(' ');
        this._emitIf(singleIf);
      }

      else {
        this._emitBlock(falseBlock, Skew.JavaScriptEmitter.AfterToken.AFTER_KEYWORD, Skew.JavaScriptEmitter.BracesMode.CAN_OMIT_BRACES);
      }
    }
  };

  Skew.JavaScriptEmitter.prototype._emitContent = function(content) {
    switch (content.kind()) {
      case Skew.ContentKind.BOOL: {
        this._emit(Skew.in_Content.asBool(content).toString());
        break;
      }

      case Skew.ContentKind.INT: {
        this._emit(Skew.in_Content.asInt(content).toString());
        break;
      }

      case Skew.ContentKind.DOUBLE: {
        var value = Skew.in_Content.asDouble(content).toString();

        // "0.123" => ".123"
        // "-0.123" => "-.123"
        if (this._minify) {
          if (in_string.startsWith(value, '0.') && value != '0.') {
            value = value.slice(1);
          }

          else if (in_string.startsWith(value, '-0.') && value != '-0.') {
            value = '-' + value.slice(2);
          }
        }

        this._emit(value);
        break;
      }

      case Skew.ContentKind.STRING: {
        this._emit(Skew.quoteString(Skew.in_Content.asString(content), Skew.QuoteStyle.SHORTEST));
        break;
      }
    }
  };

  Skew.JavaScriptEmitter.prototype._emitCommaSeparatedExpressions = function(from, to) {
    while (from != to) {
      this._emitExpression(from, Skew.Precedence.COMMA);
      from = from.nextSibling();

      if (from != to) {
        this._emit(',' + this._space);
        this._maybeEmitMinifedNewline();
      }
    }
  };

  // Calling a function in an expression that starts with something like "function(){}()"
  // must be wrapped in parentheses to avoid looking like a function statement
  Skew.JavaScriptEmitter.prototype._lambdaMayNeedParentheses = function(node) {
    var parent = node.parent();

    if (parent == null) {
      // Expression statements always have parents
      return false;
    }

    switch (parent.kind) {
      case Skew.NodeKind.CALL: {
        return node == parent.callValue() && this._lambdaMayNeedParentheses(parent);
      }

      case Skew.NodeKind.DOT: {
        return this._lambdaMayNeedParentheses(parent);
      }

      case Skew.NodeKind.INDEX: {
        return node == parent.indexLeft() && this._lambdaMayNeedParentheses(parent);
      }

      case Skew.NodeKind.ASSIGN_INDEX: {
        return node == parent.assignIndexLeft() && this._lambdaMayNeedParentheses(parent);
      }

      default: {
        if (Skew.in_NodeKind.isBinary(parent.kind)) {
          return node == parent.binaryLeft() && this._lambdaMayNeedParentheses(parent);
        }

        // Not sure, wrap to be safe
        return true;
      }
    }
  };

  Skew.JavaScriptEmitter.prototype._emitExpression = function(node, precedence) {
    var kind = node.kind;
    this._addMapping(node.range);

    switch (kind) {
      case Skew.NodeKind.TYPE: {
        this._emit(Skew.JavaScriptEmitter._fullName(node.resolvedType.symbol));
        break;
      }

      case Skew.NodeKind.NULL: {
        this._emit('null');
        break;
      }

      case Skew.NodeKind.NAME: {
        var symbol = node.symbol;
        this._emit(symbol != null ? Skew.JavaScriptEmitter._fullName(symbol) : node.asString());
        break;
      }

      case Skew.NodeKind.DOT: {
        this._emitExpression(node.dotTarget(), Skew.Precedence.MEMBER);
        this._emit('.' + (node.symbol != null ? Skew.JavaScriptEmitter._mangleName(node.symbol) : node.asString()));
        break;
      }

      case Skew.NodeKind.CONSTANT: {
        var wrap = precedence == Skew.Precedence.MEMBER && (node.content.kind() == Skew.ContentKind.INT || node.content.kind() == Skew.ContentKind.DOUBLE);

        if (wrap) {
          this._emit('(');
        }

        this._emitContent(node.content);

        if (wrap) {
          this._emit(')');
        }
        break;
      }

      case Skew.NodeKind.CALL: {
        var value = node.callValue();
        var call = value.kind == Skew.NodeKind.SUPER;
        var isKeyword = value.kind == Skew.NodeKind.NAME && value.symbol == null && value.asString() in Skew.JavaScriptEmitter.KEYWORD_CALL_MAP;
        var parenthesize = isKeyword && Skew.Precedence.UNARY_POSTFIX < precedence;
        var wrap1 = value.kind == Skew.NodeKind.LAMBDA && this._lambdaMayNeedParentheses(node);
        var isNew = false;

        if (parenthesize) {
          this._emit('(');
        }

        if (wrap1) {
          this._emit('(');
        }

        if (!call && node.symbol != null && node.symbol.kind == Skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
          this._emit('new ' + Skew.JavaScriptEmitter._fullName(node.symbol));
          isNew = true;
        }

        else if (!call && value.kind == Skew.NodeKind.DOT && value.asString() == 'new') {
          this._emit('new ');
          this._emitExpression(value.dotTarget(), Skew.Precedence.MEMBER);
          isNew = true;
        }

        else {
          this._emitExpression(value, Skew.Precedence.UNARY_POSTFIX);

          if (call) {
            this._emit('.call');
          }
        }

        if (wrap1) {
          this._emit(')');
        }

        // Omit parentheses during mangling when possible
        if (!isNew || !this._mangle || call || value.nextSibling() != null || node.parent() != null && node.parent().kind == Skew.NodeKind.DOT) {
          this._emit(isKeyword ? ' ' : '(');

          if (call) {
            this._emit(Skew.JavaScriptEmitter._mangleName(this._enclosingFunction.$this));
          }

          for (var child = value.nextSibling(); child != null; child = child.nextSibling()) {
            if (call || child.previousSibling() != value) {
              this._emit(',' + this._space);
              this._maybeEmitMinifedNewline();
            }

            this._emitExpression(child, Skew.Precedence.COMMA);
          }

          if (!isKeyword) {
            this._emit(')');
          }
        }

        if (parenthesize) {
          this._emit(')');
        }
        break;
      }

      case Skew.NodeKind.INITIALIZER_LIST:
      case Skew.NodeKind.INITIALIZER_MAP: {
        var useBraces = kind == Skew.NodeKind.INITIALIZER_MAP;
        var isIndented = false;

        if (!this._minify) {
          for (var child1 = node.firstChild(); child1 != null; child1 = child1.nextSibling()) {
            if (child1.comments != null) {
              isIndented = true;
              break;
            }
          }
        }

        this._emit(useBraces ? '{' : '[');

        if (isIndented) {
          this._increaseIndent();
        }

        for (var child2 = node.firstChild(); child2 != null; child2 = child2.nextSibling()) {
          if (child2.previousSibling() != null) {
            this._emit(',' + (isIndented ? '' : this._space));
            this._maybeEmitMinifedNewline();
          }

          if (isIndented) {
            this._emit('\n');
            this._emitComments(child2.comments);
            this._emit(this._indent);
          }

          this._emitExpression(child2, Skew.Precedence.COMMA);
        }

        if (isIndented) {
          this._decreaseIndent();
          this._emit('\n' + this._indent);
        }

        this._emit(useBraces ? '}' : ']');
        break;
      }

      case Skew.NodeKind.PAIR: {
        this._emitExpression(node.firstValue(), Skew.Precedence.LOWEST);
        this._emit(':' + this._space);
        this._emitExpression(node.secondValue(), Skew.Precedence.LOWEST);
        break;
      }

      case Skew.NodeKind.INDEX: {
        this._emitExpression(node.indexLeft(), Skew.Precedence.UNARY_POSTFIX);
        this._emit('[');
        this._emitExpression(node.indexRight(), Skew.Precedence.LOWEST);
        this._emit(']');
        break;
      }

      case Skew.NodeKind.ASSIGN_INDEX: {
        if (Skew.Precedence.ASSIGN < precedence) {
          this._emit('(');
        }

        this._emitExpression(node.assignIndexLeft(), Skew.Precedence.UNARY_POSTFIX);
        this._emit('[');
        this._emitExpression(node.assignIndexCenter(), Skew.Precedence.LOWEST);
        this._emit(']' + this._space + '=' + this._space + '');
        this._emitExpression(node.assignIndexRight(), Skew.Precedence.ASSIGN);

        if (Skew.Precedence.ASSIGN < precedence) {
          this._emit(')');
        }
        break;
      }

      case Skew.NodeKind.CAST: {
        this._emitExpression(node.castValue(), precedence);
        break;
      }

      case Skew.NodeKind.PARAMETERIZE: {
        this._emitExpression(node.parameterizeValue(), precedence);
        break;
      }

      case Skew.NodeKind.SEQUENCE: {
        if (Skew.Precedence.COMMA <= precedence) {
          this._emit('(');
        }

        this._emitCommaSeparatedExpressions(node.firstChild(), null);

        if (Skew.Precedence.COMMA <= precedence) {
          this._emit(')');
        }
        break;
      }

      case Skew.NodeKind.SUPER: {
        this._emit(Skew.JavaScriptEmitter._fullName(node.symbol));
        break;
      }

      case Skew.NodeKind.HOOK: {
        if (Skew.Precedence.ASSIGN < precedence) {
          this._emit('(');
        }

        this._emitExpression(node.hookTest(), Skew.Precedence.LOGICAL_OR);
        this._emit(this._space + '?' + this._space);
        this._emitExpression(node.hookTrue(), Skew.Precedence.ASSIGN);
        this._emit(this._space + ':' + this._space);
        this._emitExpression(node.hookFalse(), Skew.Precedence.ASSIGN);

        if (Skew.Precedence.ASSIGN < precedence) {
          this._emit(')');
        }
        break;
      }

      case Skew.NodeKind.LAMBDA: {
        var symbol1 = node.symbol.asFunctionSymbol();
        this._emit('function(');
        this._emitArgumentList(symbol1.$arguments);
        this._emit(')');
        this._emitBlock(symbol1.block, Skew.JavaScriptEmitter.AfterToken.AFTER_PARENTHESIS, Skew.JavaScriptEmitter.BracesMode.MUST_KEEP_BRACES);
        break;
      }

      case Skew.NodeKind.COMPLEMENT:
      case Skew.NodeKind.DECREMENT:
      case Skew.NodeKind.INCREMENT:
      case Skew.NodeKind.NEGATIVE:
      case Skew.NodeKind.NOT:
      case Skew.NodeKind.POSITIVE: {
        var value1 = node.unaryValue();
        var info = Skew.operatorInfo[kind];

        if (info.precedence < precedence) {
          this._emit('(');
        }

        this._emit(info.text);
        this._emitExpression(value1, info.precedence);

        if (info.precedence < precedence) {
          this._emit(')');
        }
        break;
      }

      case Skew.NodeKind.TYPE_CHECK: {
        var type = node.typeCheckType();
        var resolvedType = type.resolvedType;

        if (resolvedType.isWrapped()) {
          resolvedType = this._cache.unwrappedType(resolvedType);
        }

        if (resolvedType.kind == Skew.TypeKind.SYMBOL || type.kind != Skew.NodeKind.TYPE) {
          if (Skew.Precedence.COMPARE < precedence) {
            this._emit('(');
          }

          this._emitExpression(node.typeCheckValue(), Skew.Precedence.COMPARE);
          this._emit(' instanceof ');

          if (resolvedType.kind == Skew.TypeKind.SYMBOL) {
            this._emit(Skew.JavaScriptEmitter._fullName(resolvedType.symbol));
          }

          else {
            this._emitExpression(type, Skew.Precedence.COMPARE);
          }

          if (Skew.Precedence.COMPARE < precedence) {
            this._emit(')');
          }
        }

        else {
          this._emitExpression(node.typeCheckValue(), precedence);
        }
        break;
      }

      default: {
        if (Skew.in_NodeKind.isBinary(kind)) {
          var info1 = Skew.operatorInfo[kind];
          var left = node.binaryLeft();
          var right = node.binaryRight();
          var extraEquals = left.resolvedType == Skew.Type.DYNAMIC || right.resolvedType == Skew.Type.DYNAMIC ? '=' : '';

          if (info1.precedence < precedence) {
            this._emit('(');
          }

          this._emitExpression(node.binaryLeft(), info1.precedence + (info1.associativity == Skew.Associativity.RIGHT | 0) | 0);

          // Always emit spaces around keyword operators, even when minifying
          this._emit(kind == Skew.NodeKind.IN ? ' in ' : this._space + (kind == Skew.NodeKind.EQUAL ? '==' + extraEquals : kind == Skew.NodeKind.NOT_EQUAL ? '!=' + extraEquals : info1.text) + this._space);

          // Prevent "x - -1" from becoming "x--1"
          if (this._minify && (kind == Skew.NodeKind.ADD && (right.kind == Skew.NodeKind.POSITIVE || right.kind == Skew.NodeKind.INCREMENT) || kind == Skew.NodeKind.SUBTRACT && (right.kind == Skew.NodeKind.NEGATIVE || right.kind == Skew.NodeKind.DECREMENT || right.isNumberLessThanZero()))) {
            this._emit(' ');
          }

          this._emitExpression(right, info1.precedence + (info1.associativity == Skew.Associativity.LEFT | 0) | 0);

          if (info1.precedence < precedence) {
            this._emit(')');
          }
        }

        else {
          assert(false);
        }
        break;
      }
    }
  };

  Skew.JavaScriptEmitter.prototype._patchObject = function(symbol) {
    this._allocateNamingGroupIndex(symbol);

    // Subclasses need the extension stub
    if (!symbol.isImported() && symbol.baseClass != null) {
      this._specialVariable(Skew.JavaScriptEmitter.SpecialVariable.EXTENDS);
    }

    // Scan over child objects
    for (var i = 0, list = symbol.objects, count = list.length; i < count; ++i) {
      var object = list[i];
      this._patchObject(object);
    }

    // Scan over child functions
    var isPrimaryConstructor = true;

    for (var i2 = 0, list2 = symbol.functions, count2 = list2.length; i2 < count2; ++i2) {
      var $function = list2[i2];
      var block = $function.block;
      var $this = $function.$this;
      this._allocateNamingGroupIndex($function);

      // Check to see if we need an explicit "self" parameter while patching the block
      this._needsSelf = false;
      this._currentSelf = $this;
      this._enclosingFunction = $function;
      this._patchNode(block);
      this._enclosingFunction = null;

      // Only insert the "self" variable if required to handle capture inside lambdas
      if (this._needsSelf) {
        this._unionVariableWithFunction($this, $function);

        if (block != null) {
          var variable = Skew.Node.createVariable($this);
          var merged = false;
          $this.value = new Skew.Node(Skew.NodeKind.NAME).withContent(new Skew.StringContent('this'));

          // When mangling, add the "self" variable to an existing variable statement if present
          if (this._mangle && block.hasChildren()) {
            var firstChild = block.firstChild();

            if (firstChild.kind == Skew.NodeKind.VARIABLES) {
              firstChild.prependChild(variable);
              merged = true;
            }

            else if (firstChild.kind == Skew.NodeKind.FOR) {
              if (firstChild.forSetup().kind == Skew.NodeKind.VARIABLES) {
                firstChild.forSetup().prependChild(variable);
                merged = true;
              }

              else if (firstChild.forSetup().isEmptySequence()) {
                firstChild.forSetup().replaceWith(new Skew.Node(Skew.NodeKind.VARIABLES).appendChild(variable));
                merged = true;
              }
            }
          }

          if (!merged) {
            block.prependChild(new Skew.Node(Skew.NodeKind.VARIABLES).appendChild(variable));
          }
        }
      }

      else if ($this != null) {
        $this.name = 'this';
        $this.flags |= Skew.Symbol.IS_EXPORTED;
      }

      for (var i1 = 0, list1 = $function.$arguments, count1 = list1.length; i1 < count1; ++i1) {
        var argument = list1[i1];
        this._allocateNamingGroupIndex(argument);
        this._unionVariableWithFunction(argument, $function);
      }

      // Rename extra constructors overloads so they don't conflict
      if ($function.kind == Skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
        if (isPrimaryConstructor) {
          $function.flags |= Skew.Symbol.IS_PRIMARY_CONSTRUCTOR;
          isPrimaryConstructor = false;
        }
      }
    }

    // Scan over child variables
    for (var i3 = 0, list3 = symbol.variables, count3 = list3.length; i3 < count3; ++i3) {
      var variable1 = list3[i3];
      this._allocateNamingGroupIndex(variable1);
      this._patchNode(variable1.value);
    }
  };

  Skew.JavaScriptEmitter.prototype._createInt = function(value) {
    return new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.IntContent(value)).withType(this._cache.intType);
  };

  Skew.JavaScriptEmitter.prototype._createDouble = function(value) {
    return new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.DoubleContent(value)).withType(this._cache.doubleType);
  };

  Skew.JavaScriptEmitter.prototype._createIntBinary = function(kind, left, right) {
    if (kind == Skew.NodeKind.MULTIPLY) {
      return Skew.Node.createSymbolCall(this._specialVariable(Skew.JavaScriptEmitter.SpecialVariable.MULTIPLY)).appendChild(left).appendChild(right);
    }

    return this._wrapWithIntCast(Skew.Node.createBinary(kind, left, right).withType(this._cache.intType));
  };

  Skew.JavaScriptEmitter.prototype._wrapWithNot = function(node) {
    return Skew.Node.createUnary(Skew.NodeKind.NOT, node).withType(this._cache.boolType).withRange(node.range);
  };

  Skew.JavaScriptEmitter.prototype._wrapWithIntCast = function(node) {
    return Skew.Node.createBinary(Skew.NodeKind.BITWISE_OR, node, this._createInt(0)).withType(this._cache.intType).withRange(node.range);
  };

  Skew.JavaScriptEmitter.prototype._patchUnaryArithmetic = function(node) {
    if (node.resolvedType == this._cache.intType && !Skew.JavaScriptEmitter._alwaysConvertsOperandsToInt(node.parent())) {
      var value = node.unaryValue();

      if (value.resolvedType == this._cache.intType) {
        if (value.isInt()) {
          value.content = new Skew.IntContent(-value.asInt() | 0);
          node.become(value.remove());
        }

        else {
          node.become(this._wrapWithIntCast(node.cloneAndStealChildren()));
        }
      }
    }
  };

  Skew.JavaScriptEmitter.prototype._patchBinaryArithmetic = function(node) {
    // Make sure arithmetic integer operators don't emit doubles outside the
    // integer range. Allowing this causes JIT slowdowns due to extra checks
    // during compilation and potential deoptimizations during execution.
    // Special-case the integer "%" operator where the right operand may be
    // "0" since that generates "NaN" which is not representable as an int.
    if (node.resolvedType == this._cache.intType && !Skew.JavaScriptEmitter._alwaysConvertsOperandsToInt(node.parent()) && (node.kind != Skew.NodeKind.REMAINDER && node.kind != Skew.NodeKind.UNSIGNED_SHIFT_RIGHT || !node.binaryRight().isInt() || node.binaryRight().asInt() == 0)) {
      var left = node.binaryLeft();
      var right = node.binaryRight();

      if (left.resolvedType == this._cache.intType && right.resolvedType == this._cache.intType) {
        node.become(this._createIntBinary(node.kind, left.remove(), right.remove()).withRange(node.range));
      }
    }
  };

  Skew.JavaScriptEmitter.prototype._patchTypeCheck = function(node) {
    var value = node.typeCheckValue();
    var type = this._cache.unwrappedType(node.typeCheckType().resolvedType);

    if (type == this._cache.boolType) {
      node.become(Skew.Node.createSymbolCall(this._specialVariable(Skew.JavaScriptEmitter.SpecialVariable.IS_BOOL)).appendChild(value.remove()));
    }

    else if (type == this._cache.intType || type.isEnum()) {
      node.become(Skew.Node.createSymbolCall(this._specialVariable(Skew.JavaScriptEmitter.SpecialVariable.IS_INT)).appendChild(value.remove()));
    }

    else if (type == this._cache.doubleType) {
      node.become(Skew.Node.createSymbolCall(this._specialVariable(Skew.JavaScriptEmitter.SpecialVariable.IS_DOUBLE)).appendChild(value.remove()));
    }

    else if (type == this._cache.stringType) {
      node.become(Skew.Node.createSymbolCall(this._specialVariable(Skew.JavaScriptEmitter.SpecialVariable.IS_STRING)).appendChild(value.remove()));
    }

    else if (type.kind == Skew.TypeKind.LAMBDA) {
      node.typeCheckType().replaceWith(new Skew.Node(Skew.NodeKind.NAME).withContent(new Skew.StringContent('Function')).withType(Skew.Type.DYNAMIC));
    }
  };

  // Group each variable inside the function with the function itself so that
  // they can be renamed together and won't cause any collisions inside the
  // function
  Skew.JavaScriptEmitter.prototype._unionVariableWithFunction = function(symbol, $function) {
    if (this._mangle && $function != null) {
      assert(symbol.id in this._namingGroupIndexForSymbol);
      assert($function.id in this._namingGroupIndexForSymbol);
      this._localVariableUnionFind.union(this._namingGroupIndexForSymbol[symbol.id], this._namingGroupIndexForSymbol[$function.id]);
    }
  };

  Skew.JavaScriptEmitter.prototype._patchNode = function(node) {
    if (node == null) {
      return;
    }

    var oldEnclosingFunction = this._enclosingFunction;
    var oldLoop = this._enclosingLoop;
    var symbol = node.symbol;
    var kind = node.kind;

    if (this._mangle && symbol != null) {
      this._allocateNamingGroupIndex(symbol);
      this._symbolCounts[symbol.id] = in_IntMap.get(this._symbolCounts, symbol.id, 0) + 1 | 0;
    }

    if (kind == Skew.NodeKind.LAMBDA) {
      this._enclosingFunction = symbol.asFunctionSymbol();
    }

    else if (Skew.in_NodeKind.isLoop(kind)) {
      this._enclosingLoop = node;
    }

    if (kind == Skew.NodeKind.CAST) {
      this._patchNode(node.castValue());
    }

    else {
      for (var child = node.firstChild(); child != null; child = child.nextSibling()) {
        this._patchNode(child);
      }
    }

    if (kind == Skew.NodeKind.LAMBDA) {
      this._enclosingFunction = oldEnclosingFunction;
    }

    else if (Skew.in_NodeKind.isLoop(kind)) {
      this._enclosingLoop = oldLoop;
    }

    // Split this into a separate function because this function is hot and V8 doesn't
    // optimize it otherwise (it's optimized "too many times" whatever that means)
    this._patchNodeHelper(node);
  };

  Skew.JavaScriptEmitter.prototype._patchNodeHelper = function(node) {
    switch (node.kind) {
      case Skew.NodeKind.ADD:
      case Skew.NodeKind.SUBTRACT:
      case Skew.NodeKind.MULTIPLY:
      case Skew.NodeKind.DIVIDE:
      case Skew.NodeKind.REMAINDER:
      case Skew.NodeKind.UNSIGNED_SHIFT_RIGHT: {
        this._patchBinaryArithmetic(node);
        break;
      }

      case Skew.NodeKind.BREAK: {
        this._patchBreak(node);
        break;
      }

      case Skew.NodeKind.CAST: {
        this._patchCast(node);
        break;
      }

      case Skew.NodeKind.FOREACH: {
        this._unionVariableWithFunction(node.symbol, this._enclosingFunction);
        break;
      }

      case Skew.NodeKind.LAMBDA: {
        this._patchLambda(node);
        break;
      }

      case Skew.NodeKind.NAME: {
        this._patchName(node);
        break;
      }

      case Skew.NodeKind.NEGATIVE: {
        this._patchUnaryArithmetic(node);
        break;
      }

      case Skew.NodeKind.TRY: {
        this._patchTry(node);
        break;
      }

      case Skew.NodeKind.TYPE_CHECK: {
        this._patchTypeCheck(node);
        break;
      }

      case Skew.NodeKind.VARIABLE: {
        this._unionVariableWithFunction(node.symbol, this._enclosingFunction);
        break;
      }
    }

    if (this._mangle) {
      switch (node.kind) {
        case Skew.NodeKind.ASSIGN_INDEX: {
          this._peepholeMangleAssignIndex(node);
          break;
        }

        case Skew.NodeKind.BLOCK: {
          this._peepholeMangleBlock(node);
          break;
        }

        case Skew.NodeKind.CALL: {
          this._peepholeMangleCall(node);
          break;
        }

        case Skew.NodeKind.CONSTANT: {
          this._peepholeMangleConstant(node);
          break;
        }

        case Skew.NodeKind.FOR: {
          this._peepholeMangleFor(node);
          break;
        }

        case Skew.NodeKind.HOOK: {
          this._peepholeMangleHook(node);
          break;
        }

        case Skew.NodeKind.IF: {
          this._peepholeMangleIf(node);
          break;
        }

        case Skew.NodeKind.INDEX: {
          this._peepholeMangleIndex(node);
          break;
        }

        case Skew.NodeKind.PAIR: {
          this._peepholeManglePair(node);
          break;
        }

        case Skew.NodeKind.WHILE: {
          this._peepholeMangleWhile(node);
          break;
        }

        default: {
          if (Skew.in_NodeKind.isBinary(node.kind)) {
            this._peepholeMangleBinary(node);
          }
          break;
        }
      }
    }
  };

  Skew.JavaScriptEmitter.prototype._peepholeManglePair = function(node) {
    if (Skew.JavaScriptEmitter._isIdentifierString(node.firstValue())) {
      node.firstValue().kind = Skew.NodeKind.NAME;
    }
  };

  Skew.JavaScriptEmitter.prototype._peepholeMangleConstant = function(node) {
    switch (node.content.kind()) {
      case Skew.ContentKind.BOOL: {
        node.become(Skew.Node.createUnary(Skew.NodeKind.NOT, this._createInt(node.asBool() ? 0 : 1)));
        break;
      }

      case Skew.ContentKind.DOUBLE: {
        var value = node.asDouble();
        var reciprocal = 1 / value;

        // Shorten long reciprocals (don't replace multiplication with division
        // because that's not numerically identical). These should be constant-
        // folded by the JIT at compile-time.
        //
        //   "x * 0.3333333333333333" => "x * (1 / 3)"
        //
        for (var i = 1; i < 10; ++i) {
          if (reciprocal * i == (reciprocal * i | 0) && value.toString().length >= 10) {
            node.become(Skew.Node.createBinary(Skew.NodeKind.DIVIDE, this._createDouble(i), this._createDouble(reciprocal * i)).withType(this._cache.doubleType));
            break;
          }
        }
        break;
      }
    }
  };

  Skew.JavaScriptEmitter.prototype._patchName = function(node) {
    if (node.symbol != null && node.symbol == this._currentSelf && this._enclosingFunction != null && this._enclosingFunction.kind == Skew.SymbolKind.FUNCTION_LOCAL) {
      this._needsSelf = true;
    }
  };

  Skew.JavaScriptEmitter.prototype._peepholeMangleCall = function(node) {
    var value = node.callValue();
    var parent = node.parent();

    // "x + y.toString()" => "x + y" where "x" is a string
    // "x.toString() + ''" => "x + ''"
    if (value.nextSibling() == null && value.kind == Skew.NodeKind.DOT && value.asString() == 'toString' && value.symbol != null && value.symbol.isImportedOrExported() && parent.kind == Skew.NodeKind.ADD && (node == parent.binaryRight() && this._cache.isEquivalentToString(parent.binaryLeft().resolvedType) || parent.binaryRight().isString())) {
      node.become(value.dotTarget().remove());
    }
  };

  // The "break" statement inside a switch should break out of the enclosing
  // loop:
  //
  //   while true {
  //     switch x {
  //       case 0 {
  //         break
  //       }
  //     }
  //   }
  //
  // becomes:
  //
  //   label: while (true) {
  //     switch (x) {
  //       case 0: {
  //         break label;
  //       }
  //     }
  //   }
  //
  Skew.JavaScriptEmitter.prototype._patchBreak = function(node) {
    var loop = this._enclosingLoop;

    for (var parent = node.parent(); parent != loop; parent = parent.parent()) {
      if (parent.kind == Skew.NodeKind.SWITCH) {
        var label = in_IntMap.get(this._loopLabels, loop.id, null);

        if (label == null) {
          label = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_LOCAL, this._enclosingFunction.scope.generateName('label'));
          this._allocateNamingGroupIndex(label);
          this._unionVariableWithFunction(label, this._enclosingFunction);
          this._loopLabels[loop.id] = label;
        }

        this._loopLabels[node.id] = label;
        break;
      }
    }
  };

  Skew.JavaScriptEmitter.prototype._patchLambda = function(node) {
    var $function = node.symbol.asFunctionSymbol();

    for (var i = 0, list = $function.$arguments, count = list.length; i < count; ++i) {
      var argument = list[i];
      this._allocateNamingGroupIndex(argument);
      this._unionVariableWithFunction(argument, $function);
    }

    this._unionVariableWithFunction($function, this._enclosingFunction);
  };

  Skew.JavaScriptEmitter.prototype._patchTry = function(node) {
    if (node.hasChildren() && !node.hasOneChild()) {
      var tryBlock = node.tryBlock();
      var finallyBlock = node.finallyBlock();
      var firstCatch = finallyBlock != null ? finallyBlock.previousSibling() : node.lastChild();
      var variable = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_LOCAL, firstCatch.kind == Skew.NodeKind.CATCH && firstCatch.symbol != null ? firstCatch.symbol.name : this._enclosingFunction.scope.generateName('e'));
      var block = new Skew.Node(Skew.NodeKind.BLOCK).appendChild(Skew.Node.createThrow(Skew.Node.createSymbolReference(variable)));

      // Iterate backwards over the catch blocks
      for (var child = firstCatch, previous = child.previousSibling(); child != tryBlock; child = previous, previous = child.previousSibling()) {
        var catchBlock = child.remove().catchBlock().remove();

        // Just rename all catch symbols to the same name instead of substituting the variable
        if (child.symbol != null) {
          child.symbol.name = variable.name;
        }

        // Build up the chain of tests in reverse
        if (child.symbol != null && child.symbol.resolvedType != Skew.Type.DYNAMIC) {
          var test = Skew.Node.createTypeCheck(Skew.Node.createSymbolReference(variable), new Skew.Node(Skew.NodeKind.TYPE).withType(child.symbol.resolvedType));
          block = new Skew.Node(Skew.NodeKind.BLOCK).appendChild(catchBlock.hasChildren() ? Skew.Node.createIf(test, catchBlock, block) : Skew.Node.createIf(Skew.Node.createUnary(Skew.NodeKind.NOT, test), block, null));
        }

        else {
          block = catchBlock;
        }
      }

      node.insertChildAfter(tryBlock, Skew.Node.createCatch(variable, block));

      // Make sure the new variable name is mangled
      this._allocateNamingGroupIndex(variable);
      this._unionVariableWithFunction(variable, this._enclosingFunction);
    }
  };

  Skew.JavaScriptEmitter.prototype._assignSourceIfNoSideEffects = function(node) {
    if (node.kind == Skew.NodeKind.ASSIGN) {
      var right = node.binaryRight();
      return node.binaryLeft().hasNoSideEffects() && right.hasNoSideEffects() ? right : null;
    }

    if (node.kind == Skew.NodeKind.ASSIGN_INDEX) {
      var right1 = node.assignIndexRight();
      return node.assignIndexLeft().hasNoSideEffects() && node.assignIndexCenter().hasNoSideEffects() && right1.hasNoSideEffects() ? right1 : null;
    }

    return null;
  };

  Skew.JavaScriptEmitter.prototype._peepholeMangleSequence = function(node) {
    assert(node.kind == Skew.NodeKind.SEQUENCE);

    // "a = 0, b[c] = 0, d = 0;" => "a = b[c] = d = 0;"
    // "a = 0, b = 0, c = 1, d = 1;" => "a = b = 0, c = d = 1;"
    for (var child = node.lastChild(); child != null; child = child.previousSibling()) {
      var childRight = this._assignSourceIfNoSideEffects(child);

      if (childRight != null) {
        while (true) {
          var previous = child.previousSibling();

          if (previous == null) {
            break;
          }

          var previousRight = this._assignSourceIfNoSideEffects(previous);

          if (previousRight == null || !Skew.JavaScriptEmitter._looksTheSame(previousRight, childRight)) {
            break;
          }

          previousRight.become(child.remove());
          child = previous;
        }
      }
    }
  };

  Skew.JavaScriptEmitter.prototype._peepholeMangleBinary = function(node) {
    var kind = node.kind;
    var left = node.binaryLeft();
    var right = node.binaryRight();

    // "(a, b) || c" => "a, b || c"
    // "(a, b) && c" => "a, b && c"
    if ((kind == Skew.NodeKind.LOGICAL_OR || kind == Skew.NodeKind.LOGICAL_AND) && left.kind == Skew.NodeKind.SEQUENCE) {
      var binary = Skew.Node.createBinary(kind, left.lastChild().cloneAndStealChildren(), right.remove());
      this._peepholeMangleBinary(binary);
      left.lastChild().replaceWith(binary);
      node.become(left.remove());
    }

    // "a + (b + c)" => "(a + b) + c"
    else if (Skew.in_NodeKind.isBinaryAssociative(kind) && right.kind == kind) {
      while (true) {
        node.rotateBinaryRightToLeft();
        node = node.binaryLeft();

        if (!Skew.in_NodeKind.isBinaryAssociative(node.kind) || node.binaryRight().kind != node.kind) {
          break;
        }
      }
    }

    else if ((kind == Skew.NodeKind.GREATER_THAN_OR_EQUAL || kind == Skew.NodeKind.LESS_THAN_OR_EQUAL) && this._cache.isEquivalentToInt(left.resolvedType) && this._cache.isEquivalentToInt(right.resolvedType)) {
      if (left.isInt()) {
        var value = left.asInt();

        // "2 >= a" => "3 > a"
        if (node.kind == Skew.NodeKind.GREATER_THAN_OR_EQUAL && value < 2147483647) {
          left.content = new Skew.IntContent(value + 1 | 0);
          node.kind = Skew.NodeKind.GREATER_THAN;
        }

        // "2 <= a" => "1 < a"
        else if (node.kind == Skew.NodeKind.LESS_THAN_OR_EQUAL && value >= -2147483647) {
          left.content = new Skew.IntContent(value - 1 | 0);
          node.kind = Skew.NodeKind.LESS_THAN;
        }
      }

      else if (right.isInt()) {
        var value1 = right.asInt();

        // "a >= 2" => "a > 1"
        if (node.kind == Skew.NodeKind.GREATER_THAN_OR_EQUAL && value1 >= -2147483647) {
          right.content = new Skew.IntContent(value1 - 1 | 0);
          node.kind = Skew.NodeKind.GREATER_THAN;
        }

        // "a <= 2" => "a < 3"
        else if (node.kind == Skew.NodeKind.LESS_THAN_OR_EQUAL && value1 < 2147483647) {
          right.content = new Skew.IntContent(value1 + 1 | 0);
          node.kind = Skew.NodeKind.LESS_THAN;
        }
      }
    }
  };

  // Simplifies the node assuming it's used in a boolean context. Note that
  // this may replace the passed-in node, which will then need to be queried
  // again if it's needed for further stuff.
  Skew.JavaScriptEmitter.prototype._peepholeMangleBoolean = function(node, canSwap) {
    var kind = node.kind;

    if (kind == Skew.NodeKind.EQUAL || kind == Skew.NodeKind.NOT_EQUAL) {
      var left = node.binaryLeft();
      var right = node.binaryRight();
      var replacement = Skew.JavaScriptEmitter._isFalsy(right) ? left : Skew.JavaScriptEmitter._isFalsy(left) ? right : null;

      // "if (a != 0) b;" => "if (a) b;"
      if (replacement != null) {
        // This minification is not valid for strings and doubles because
        // they both have multiple falsy values (NaN and 0, null, and "")
        if (left.resolvedType != null && !this._cache.isEquivalentToDouble(left.resolvedType) && !this._cache.isEquivalentToString(left.resolvedType) && right.resolvedType != null && !this._cache.isEquivalentToDouble(right.resolvedType) && !this._cache.isEquivalentToString(right.resolvedType)) {
          replacement.remove();
          node.become(kind == Skew.NodeKind.EQUAL ? Skew.Node.createUnary(Skew.NodeKind.NOT, replacement) : replacement);
        }
      }

      else if (this._cache.isInteger(left.resolvedType) && this._cache.isInteger(right.resolvedType) && (kind == Skew.NodeKind.NOT_EQUAL || kind == Skew.NodeKind.EQUAL && canSwap == Skew.JavaScriptEmitter.BooleanSwap.SWAP)) {
        // "if (a != -1) c;" => "if (~a) c;"
        // "if (a == -1) c; else d;" => "if (~a) d; else c;"
        if (right.isInt() && right.asInt() == -1) {
          node.become(Skew.Node.createUnary(Skew.NodeKind.COMPLEMENT, left.remove()));
        }

        // "if (-1 != b) c;" => "if (~b) c;"
        // "if (-1 == b) c; else d;" => "if (~b) d; else c;"
        else if (left.isInt() && left.asInt() == -1) {
          node.become(Skew.Node.createUnary(Skew.NodeKind.COMPLEMENT, right.remove()));
        }

        // "if (a != b) c;" => "if (a ^ b) c;"
        // "if (a == b) c; else d;" => "if (a ^ b) d; else c;"
        else {
          node.kind = Skew.NodeKind.BITWISE_XOR;
        }

        return kind == Skew.NodeKind.EQUAL ? Skew.JavaScriptEmitter.BooleanSwap.SWAP : Skew.JavaScriptEmitter.BooleanSwap.NO_SWAP;
      }
    }

    // "if (a != 0 || b != 0) c;" => "if (a || b) c;"
    else if (kind == Skew.NodeKind.LOGICAL_AND || kind == Skew.NodeKind.LOGICAL_OR) {
      this._peepholeMangleBoolean(node.binaryLeft(), Skew.JavaScriptEmitter.BooleanSwap.NO_SWAP);
      this._peepholeMangleBoolean(node.binaryRight(), Skew.JavaScriptEmitter.BooleanSwap.NO_SWAP);
    }

    // "if (!a) b; else c;" => "if (a) c; else b;"
    // "a == 0 ? b : c;" => "a ? c : b;"
    // This is not an "else if" check since EQUAL may be turned into NOT above
    if (node.kind == Skew.NodeKind.NOT && canSwap == Skew.JavaScriptEmitter.BooleanSwap.SWAP) {
      node.become(node.unaryValue().remove());
      return Skew.JavaScriptEmitter.BooleanSwap.SWAP;
    }

    // "if (a, !b) c; else d;" => "if (a, b) d; else c;"
    if (node.kind == Skew.NodeKind.SEQUENCE) {
      return this._peepholeMangleBoolean(node.lastChild(), canSwap);
    }

    return Skew.JavaScriptEmitter.BooleanSwap.NO_SWAP;
  };

  Skew.JavaScriptEmitter.prototype._peepholeMangleIf = function(node) {
    var test = node.ifTest();
    var trueBlock = node.ifTrue();
    var falseBlock = node.ifFalse();
    var trueStatement = trueBlock.blockStatement();
    var swapped = this._peepholeMangleBoolean(test, falseBlock != null || trueStatement != null && trueStatement.kind == Skew.NodeKind.EXPRESSION ? Skew.JavaScriptEmitter.BooleanSwap.SWAP : Skew.JavaScriptEmitter.BooleanSwap.NO_SWAP);

    if (falseBlock != null) {
      var falseStatement = falseBlock.blockStatement();

      // "if (!a) b; else c;" => "if (a) c; else b;"
      if (swapped == Skew.JavaScriptEmitter.BooleanSwap.SWAP) {
        var block = trueBlock;
        trueBlock = falseBlock;
        falseBlock = block;
        var statement = trueStatement;
        trueStatement = falseStatement;
        falseStatement = statement;
        trueBlock.swapWith(falseBlock);
      }

      if (trueStatement != null && falseStatement != null) {
        // "if (a) b; else c;" => "a ? b : c;"
        if (trueStatement.kind == Skew.NodeKind.EXPRESSION && falseStatement.kind == Skew.NodeKind.EXPRESSION) {
          var hook = Skew.Node.createHook(test.remove(), trueStatement.expressionValue().remove(), falseStatement.expressionValue().remove());
          this._peepholeMangleHook(hook);
          node.become(Skew.Node.createExpression(hook));
        }

        // "if (a) return b; else return c;" => "return a ? b : c;"
        else if (trueStatement.kind == Skew.NodeKind.RETURN && falseStatement.kind == Skew.NodeKind.RETURN) {
          var trueValue = trueStatement.returnValue();
          var falseValue = falseStatement.returnValue();

          if (trueValue != null && falseValue != null) {
            var hook1 = Skew.Node.createHook(test.remove(), trueValue.remove(), falseValue.remove());
            this._peepholeMangleHook(hook1);
            node.become(Skew.Node.createReturn(hook1));
          }
        }
      }
    }

    // "if (a) b;" => "a && b;"
    // "if (!a) b;" => "a || b;"
    else if (trueStatement != null && trueStatement.kind == Skew.NodeKind.EXPRESSION) {
      var binary = Skew.Node.createBinary(swapped == Skew.JavaScriptEmitter.BooleanSwap.SWAP ? Skew.NodeKind.LOGICAL_OR : Skew.NodeKind.LOGICAL_AND, test.remove(), trueStatement.expressionValue().remove());
      this._peepholeMangleBinary(binary);
      node.become(Skew.Node.createExpression(binary));
    }

    // "if (a) if (b) c;" => "if (a && b) c;"
    else {
      var singleIf = Skew.JavaScriptEmitter._singleIf(trueBlock);

      if (singleIf != null && singleIf.ifFalse() == null) {
        var block1 = singleIf.ifTrue();
        test.replaceWith(Skew.Node.createBinary(Skew.NodeKind.LOGICAL_AND, test.cloneAndStealChildren(), singleIf.ifTest().remove()));
        trueBlock.replaceWith(block1.remove());
      }
    }
  };

  Skew.JavaScriptEmitter.prototype._peepholeMangleWhile = function(node) {
    var test = node.whileTest();
    var block = node.whileBlock();
    this._peepholeMangleBoolean(test.remove(), Skew.JavaScriptEmitter.BooleanSwap.NO_SWAP);

    // "while (a) {}" => "for (; a;) {}"
    var loop = Skew.Node.createFor(new Skew.Node(Skew.NodeKind.SEQUENCE), test, new Skew.Node(Skew.NodeKind.SEQUENCE), block.remove()).withRange(node.range);
    this._peepholeMangleFor(loop);
    node.become(loop);
  };

  Skew.JavaScriptEmitter.prototype._peepholeMangleFor = function(node) {
    var test = node.forTest();
    this._peepholeMangleBoolean(test, Skew.JavaScriptEmitter.BooleanSwap.NO_SWAP);

    // "for (; true;) {}" => "for (;;) {}"
    if (test.kind == Skew.NodeKind.NOT && test.unaryValue().isInt() && test.unaryValue().asInt() == 0) {
      var empty = new Skew.Node(Skew.NodeKind.SEQUENCE);
      test.replaceWith(empty);
      test = empty;
    }

    // "for (a;;) if (b) break;" => "for (a; b;) {}"
    if (node.forUpdate().isEmptySequence()) {
      var statement = node.forBlock().blockStatement();

      if (statement != null && statement.kind == Skew.NodeKind.IF && statement.ifFalse() == null) {
        var branch = statement.ifTrue().blockStatement();

        if (branch != null && branch.kind == Skew.NodeKind.BREAK) {
          var condition = statement.remove().ifTest().remove();
          condition.invertBooleanCondition(this._cache);

          if (test.isEmptySequence()) {
            test.replaceWith(condition);
          }

          else {
            condition = Skew.Node.createBinary(Skew.NodeKind.LOGICAL_AND, test.cloneAndStealChildren(), condition);
            this._peepholeMangleBinary(condition);
            test.become(condition);
          }
        }
      }
    }
  };

  Skew.JavaScriptEmitter.prototype._peepholeMangleHook = function(node) {
    var test = node.hookTest();
    var trueValue = node.hookTrue();
    var falseValue = node.hookFalse();
    var swapped = this._peepholeMangleBoolean(test, Skew.JavaScriptEmitter.BooleanSwap.SWAP);

    // "!a ? b : c;" => "a ? c : b;"
    if (swapped == Skew.JavaScriptEmitter.BooleanSwap.SWAP) {
      var temp = trueValue;
      trueValue = falseValue;
      falseValue = temp;
      trueValue.swapWith(falseValue);
    }

    // "a.b ? c : null" => "a.b && c"
    if (falseValue.kind == Skew.NodeKind.CAST && falseValue.castValue().kind == Skew.NodeKind.NULL && test.resolvedType != null && test.resolvedType != Skew.Type.DYNAMIC && test.resolvedType.isReference()) {
      node.become(Skew.Node.createBinary(Skew.NodeKind.LOGICAL_AND, test.remove(), trueValue.remove()));
      return;
    }

    // "a ? a : b" => "a || b"
    if (Skew.JavaScriptEmitter._looksTheSame(test, trueValue) && test.hasNoSideEffects()) {
      node.become(Skew.Node.createBinary(Skew.NodeKind.LOGICAL_OR, test.remove(), falseValue.remove()));
      return;
    }

    // "a ? b : a" => "a && b"
    if (Skew.JavaScriptEmitter._looksTheSame(test, falseValue) && test.hasNoSideEffects()) {
      node.become(Skew.Node.createBinary(Skew.NodeKind.LOGICAL_AND, test.remove(), trueValue.remove()));
      return;
    }

    // "a ? b : b" => "a, b"
    if (Skew.JavaScriptEmitter._looksTheSame(trueValue, falseValue)) {
      node.become(test.hasNoSideEffects() ? trueValue.remove() : new Skew.Node(Skew.NodeKind.SEQUENCE).appendChild(test.remove()).appendChild(trueValue.remove()));
      return;
    }

    // Collapse partially-identical hook expressions
    if (falseValue.kind == Skew.NodeKind.HOOK) {
      var falseTest = falseValue.hookTest();
      var falseTrueValue = falseValue.hookTrue();
      var falseFalseValue = falseValue.hookFalse();

      // "a ? b : c ? b : d" => "a || c ? b : d"
      // "a ? b : c || d ? b : e" => "a || c || d ? b : e"
      if (Skew.JavaScriptEmitter._looksTheSame(trueValue, falseTrueValue)) {
        var both = Skew.Node.createBinary(Skew.NodeKind.LOGICAL_OR, test.cloneAndStealChildren(), falseTest.remove());
        this._peepholeMangleBinary(both);
        test.replaceWith(both);
        falseValue.replaceWith(falseFalseValue.remove());
        this._peepholeMangleHook(node);
        return;
      }
    }

    // Collapse partially-identical binary expressions
    if (trueValue.kind == falseValue.kind && Skew.in_NodeKind.isBinary(trueValue.kind)) {
      var trueLeft = trueValue.binaryLeft();
      var trueRight = trueValue.binaryRight();
      var falseLeft = falseValue.binaryLeft();
      var falseRight = falseValue.binaryRight();

      // "a ? b = c : b = d;" => "b = a ? c : d;"
      if (Skew.JavaScriptEmitter._looksTheSame(trueLeft, falseLeft)) {
        var hook = Skew.Node.createHook(test.remove(), trueRight.remove(), falseRight.remove());
        this._peepholeMangleHook(hook);
        node.become(Skew.Node.createBinary(trueValue.kind, trueLeft.remove(), hook));
      }

      // "a ? b + 100 : c + 100;" => "(a ? b + c) + 100;"
      else if (Skew.JavaScriptEmitter._looksTheSame(trueRight, falseRight) && !Skew.in_NodeKind.isBinaryAssign(trueValue.kind)) {
        var hook1 = Skew.Node.createHook(test.remove(), trueLeft.remove(), falseLeft.remove());
        this._peepholeMangleHook(hook1);
        node.become(Skew.Node.createBinary(trueValue.kind, hook1, trueRight.remove()));
      }
    }

    // "(a, b) ? c : d" => "a, b ? c : d"
    if (test.kind == Skew.NodeKind.SEQUENCE) {
      node.prependChild(test.remove().lastChild().remove());
      test.appendChild(node.cloneAndStealChildren());
      node.become(test);
    }
  };

  Skew.JavaScriptEmitter.prototype._peepholeMangleAssignIndex = function(node) {
    var left = node.assignIndexLeft();
    var center = node.assignIndexCenter();
    var right = node.assignIndexRight();

    if (Skew.JavaScriptEmitter._isIdentifierString(center)) {
      node.become(Skew.Node.createBinary(Skew.NodeKind.ASSIGN, new Skew.Node(Skew.NodeKind.DOT).withContent(new Skew.StringContent(center.asString())).appendChild(left.remove()).withRange(Skew.Range.span(left.range, center.range)), right.remove()).withRange(node.range));
    }
  };

  Skew.JavaScriptEmitter.prototype._peepholeMangleIndex = function(node) {
    var left = node.indexLeft();
    var right = node.indexRight();

    if (Skew.JavaScriptEmitter._isIdentifierString(right)) {
      node.become(new Skew.Node(Skew.NodeKind.DOT).withContent(new Skew.StringContent(right.asString())).appendChild(left.remove()).withRange(node.range).withType(node.resolvedType));
    }
  };

  Skew.JavaScriptEmitter.prototype._peepholeMangleBlock = function(node) {
    for (var child = node.firstChild(), next = null; child != null; child = next) {
      var previous = child.previousSibling();
      next = child.nextSibling();

      switch (child.kind) {
        case Skew.NodeKind.VARIABLES: {
          if (previous != null && previous.kind == Skew.NodeKind.VARIABLES) {
            child.replaceWith(previous.remove().appendChildrenFrom(child));
          }
          break;
        }

        case Skew.NodeKind.EXPRESSION: {
          if (child.expressionValue().hasNoSideEffects()) {
            child.remove();
          }

          else if (previous != null && previous.kind == Skew.NodeKind.EXPRESSION) {
            var sequence = Skew.Node.createSequence2(previous.remove().expressionValue().remove(), child.expressionValue().remove());
            this._peepholeMangleSequence(sequence);
            child.become(Skew.Node.createExpression(sequence));
          }
          break;
        }

        case Skew.NodeKind.RETURN: {
          while (previous != null) {
            // "if (a) return b; return c;" => "return a ? b : c;"
            if (child.returnValue() != null && previous.kind == Skew.NodeKind.IF && previous.ifFalse() == null) {
              var statement = previous.ifTrue().blockStatement();

              if (statement != null && statement.kind == Skew.NodeKind.RETURN && statement.returnValue() != null) {
                var hook = Skew.Node.createHook(previous.remove().ifTest().remove(), statement.returnValue().remove(), child.returnValue().remove());
                this._peepholeMangleHook(hook);
                child.become(Skew.Node.createReturn(hook));
              }

              else {
                break;
              }
            }

            // "a; return b;" => "return a, b;"
            else if (child.returnValue() != null && previous.kind == Skew.NodeKind.EXPRESSION) {
              var sequence1 = Skew.Node.createSequence2(previous.remove().expressionValue().remove(), child.returnValue().remove());
              this._peepholeMangleSequence(sequence1);
              child.become(Skew.Node.createReturn(sequence1));
            }

            else {
              break;
            }

            previous = child.previousSibling();
          }
          break;
        }

        case Skew.NodeKind.IF: {
          while (previous != null) {
            // "if (a) b; if (c) b;" => "if (a || c) b;"
            if (child.ifFalse() == null && previous.kind == Skew.NodeKind.IF && previous.ifFalse() == null && Skew.JavaScriptEmitter._looksTheSame(previous.ifTrue(), child.ifTrue())) {
              child.ifTest().replaceWith(Skew.Node.createBinary(Skew.NodeKind.LOGICAL_OR, previous.remove().ifTest().remove(), child.ifTest().cloneAndStealChildren()));
            }

            // "a; if (b) c;" => "if (a, b) c;"
            else if (previous.kind == Skew.NodeKind.EXPRESSION) {
              var sequence2 = Skew.Node.createSequence2(previous.remove().expressionValue().remove(), child.ifTest().cloneAndStealChildren());
              this._peepholeMangleSequence(sequence2);
              child.ifTest().replaceWith(sequence2);
            }

            else {
              break;
            }

            previous = child.previousSibling();
          }

          // "void foo() { if (a) return; b(); c() }" => "void foo() { if (!a) { b(); c() } }"
          // "while (a) { if (b) continue; c(); d() }" => "while (a) { if (!b) { c(); d() } }"
          if (child.ifFalse() == null) {
            var trueBlock = child.ifTrue();

            if (trueBlock.hasChildren()) {
              var statement1 = trueBlock.lastChild();

              if ((statement1.kind == Skew.NodeKind.RETURN && statement1.returnValue() == null || statement1.kind == Skew.NodeKind.CONTINUE) && Skew.JavaScriptEmitter._isJumpImplied(node, statement1.kind)) {
                var block = null;

                // If the if statement block without the jump is empty, then flip
                // the condition of the if statement and reuse the block. Otherwise,
                // create an else branch for the if statement and use that block.
                statement1.remove();

                if (!trueBlock.hasChildren()) {
                  child.ifTest().invertBooleanCondition(this._cache);
                  block = trueBlock;
                }

                else if (next != null) {
                  block = new Skew.Node(Skew.NodeKind.BLOCK);
                  child.appendChild(block);
                  assert(block == child.ifFalse());
                }

                else {
                  // Returning here is fine because this is the last child
                  return;
                }

                // Move the rest of this block into the block for the if statement
                while (child.nextSibling() != null) {
                  block.appendChild(child.nextSibling().remove());
                }

                this._peepholeMangleBlock(block);
                this._peepholeMangleIf(child);

                // "a(); if (b) return; c();" => "a(); if (!b) c();" => "a(); !b && c();" => "a(), !b && c();"
                if (child.kind == Skew.NodeKind.EXPRESSION && previous != null && previous.kind == Skew.NodeKind.EXPRESSION) {
                  var sequence3 = Skew.Node.createSequence2(previous.remove().expressionValue().remove(), child.expressionValue().remove());
                  this._peepholeMangleSequence(sequence3);
                  child.become(Skew.Node.createExpression(sequence3));
                }

                return;
              }
            }
          }
          break;
        }

        case Skew.NodeKind.FOR: {
          var setup = child.forSetup();

          // "var a; for (;;) {}" => "for (var a;;) {}"
          if (previous != null && setup.isEmptySequence() && previous.kind == Skew.NodeKind.VARIABLES) {
            setup.replaceWith(previous.remove().appendChildrenFrom(setup));
          }

          // "var a; for (var b;;) {}" => "for (var a, b;;) {}"
          else if (previous != null && setup.kind == Skew.NodeKind.VARIABLES && previous.kind == Skew.NodeKind.VARIABLES) {
            setup.replaceWith(previous.remove().appendChildrenFrom(setup));
          }

          // "a; for (b;;) {}" => "for (a, b;;) {}"
          else if (previous != null && Skew.in_NodeKind.isExpression(setup.kind) && previous.kind == Skew.NodeKind.EXPRESSION) {
            setup.replaceWith(Skew.Node.createSequence2(previous.remove().expressionValue().remove(), setup.cloneAndStealChildren()));
          }
          break;
        }

        case Skew.NodeKind.SWITCH: {
          var switchValue = child.switchValue();
          var defaultCase = child.defaultCase();

          if (defaultCase != null) {
            var hasFlowAtEnd = false;

            // See if any non-default case will flow past the end of the switch block
            for (var caseChild = switchValue.nextSibling(); caseChild != defaultCase; caseChild = caseChild.nextSibling()) {
              if (caseChild.caseBlock().hasControlFlowAtEnd()) {
                hasFlowAtEnd = true;
              }
            }

            // "switch (a) { case b: return; default: c; break; }" => "switch (a) { case b: return; } c;"
            if (!hasFlowAtEnd) {
              node.insertChildrenAfterFrom(defaultCase.caseBlock(), child);
              next = child.nextSibling();
              defaultCase.remove();
              defaultCase = null;
            }
          }

          // "switch (a) {}" => "a;"
          if (child.hasOneChild()) {
            next = Skew.Node.createExpression(switchValue.remove());
            child.replaceWith(next);
            continue;
          }

          // "switch (a) { case b: c; break; }" => "if (a == b) c;"
          else if (child.hasTwoChildren()) {
            var singleCase = child.lastChild();

            if (singleCase.hasTwoChildren()) {
              var value = singleCase.firstChild();
              next = Skew.Node.createIf(Skew.Node.createBinary(Skew.NodeKind.EQUAL, switchValue.remove(), value.remove()), singleCase.caseBlock().remove(), null);
              this._peepholeMangleIf(next);
              child.replaceWith(next);
              continue;
            }
          }

          // "switch (a) { case b: c; break; default: d; break; }" => "if (a == b) c; else d;"
          else if (child.hasThreeChildren()) {
            var firstCase = switchValue.nextSibling();
            var secondCase = child.lastChild();

            if (firstCase.hasTwoChildren() && secondCase.hasOneChild()) {
              var value1 = firstCase.firstChild();
              next = Skew.Node.createIf(Skew.Node.createBinary(Skew.NodeKind.EQUAL, switchValue.remove(), value1.remove()), firstCase.caseBlock().remove(), secondCase.caseBlock().remove());
              this._peepholeMangleIf(next);
              child.replaceWith(next);
              continue;
            }
          }

          // Optimize specific patterns of switch statements
          if (switchValue.kind == Skew.NodeKind.NAME && defaultCase == null) {
            this._peepholeMangleSwitchCases(child);
          }
          break;
        }
      }
    }
  };

  // "switch (a) { case 0: return 0; case 1: return 1; case 2: return 2; }" => "if (a >= 0 && a <= 2) return a"
  // "switch (a) { case 0: return 1; case 1: return 2; case 2: return 3; }" => "if (a >= 0 && a <= 2) return a + 1"
  Skew.JavaScriptEmitter.prototype._peepholeMangleSwitchCases = function(node) {
    var switchValue = node.switchValue();
    var firstCase = switchValue.nextSibling();

    if (!this._cache.isEquivalentToInt(switchValue.resolvedType)) {
      return;
    }

    var sharedDelta = 0;
    var count = 0;
    var min = 0;
    var max = 0;

    for (var child = firstCase; child != null; child = child.nextSibling()) {
      var singleStatement = child.caseBlock().blockStatement();

      if (!child.hasTwoChildren() || singleStatement == null || singleStatement.kind != Skew.NodeKind.RETURN) {
        return;
      }

      var caseValue = child.firstChild();
      var returnValue = singleStatement.returnValue();

      if (!caseValue.isInt() || returnValue == null || !returnValue.isInt()) {
        return;
      }

      var caseInt = caseValue.asInt();
      var returnInt = returnValue.asInt();
      var delta = returnInt - caseInt | 0;

      if (count == 0) {
        sharedDelta = delta;
        min = caseInt;
        max = caseInt;
      }

      else if (delta != sharedDelta) {
        return;
      }

      else {
        min = Math.min(min, caseInt);
        max = Math.max(max, caseInt);
      }

      ++count;
    }

    // Make sure the pattern is matched
    if (count == 0) {
      return;
    }

    var block = new Skew.Node(Skew.NodeKind.BLOCK).appendChild(Skew.Node.createReturn(sharedDelta > 0 ? this._createIntBinary(Skew.NodeKind.ADD, switchValue.remove(), this._createInt(sharedDelta)) : sharedDelta < 0 ? this._createIntBinary(Skew.NodeKind.SUBTRACT, switchValue.remove(), this._createInt(-sharedDelta | 0)) : switchValue.remove()));

    // Replace the large "switch" statement with a smaller "if" statement if the entire range is covered
    if ((max - min | 0) == (count - 1 | 0)) {
      var lower = Skew.Node.createBinary(Skew.NodeKind.GREATER_THAN_OR_EQUAL, switchValue.clone(), this._createInt(min)).withType(this._cache.boolType);
      var upper = Skew.Node.createBinary(Skew.NodeKind.LESS_THAN_OR_EQUAL, switchValue.clone(), this._createInt(max)).withType(this._cache.boolType);

      // Convert ">=" and "<=" to ">" and "<" where possible
      this._peepholeMangleBinary(lower);
      this._peepholeMangleBinary(upper);
      node.replaceWith(Skew.Node.createIf(Skew.Node.createBinary(Skew.NodeKind.LOGICAL_AND, lower, upper).withType(this._cache.boolType), block, null));
    }

    // Just combine everything into one case
    else {
      var combined = new Skew.Node(Skew.NodeKind.CASE);

      for (var child1 = firstCase; child1 != null; child1 = child1.nextSibling()) {
        combined.appendChild(child1.firstChild().remove());
      }

      node.replaceWith(Skew.Node.createSwitch(switchValue.clone()).appendChild(combined.appendChild(block)));
    }
  };

  Skew.JavaScriptEmitter.prototype._patchCast = function(node) {
    var value = node.castValue();
    var type = node.resolvedType;
    var valueType = value.resolvedType;

    // Wrapping should be transparent in the emitted code
    if (type.isWrapped() || valueType.isWrapped()) {
      return;
    }

    // Cast to bool
    if (type == this._cache.boolType) {
      if (valueType != this._cache.boolType) {
        node.become(this._wrapWithNot(this._wrapWithNot(value.remove())));
      }
    }

    // Cast to int
    else if (this._cache.isInteger(type)) {
      if (!this._cache.isInteger(valueType) && !Skew.JavaScriptEmitter._alwaysConvertsOperandsToInt(node.parent())) {
        node.become(this._wrapWithIntCast(value.remove()));
      }

      else if (value.isInt()) {
        node.become(value.remove().withType(node.resolvedType));
      }
    }

    // Cast to double
    else if (type == this._cache.doubleType) {
      if (!this._cache.isNumeric(valueType)) {
        node.become(Skew.Node.createUnary(Skew.NodeKind.POSITIVE, value.remove()).withRange(node.range).withType(this._cache.doubleType));
      }
    }

    // Cast to string
    else if (type == this._cache.stringType) {
      if (valueType != this._cache.stringType && valueType != Skew.Type.NULL) {
        node.become(Skew.Node.createBinary(Skew.NodeKind.ADD, value.remove(), new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.StringContent('')).withType(this._cache.stringType)).withType(this._cache.stringType).withRange(node.range));
      }
    }
  };

  Skew.JavaScriptEmitter.prototype._specialVariable = function(name) {
    assert(name in this._specialVariables);
    var variable = this._specialVariables[name];
    this._isSpecialVariableNeeded[variable.id] = 0;
    return variable;
  };

  Skew.JavaScriptEmitter._isReferenceTo = function(node, symbol) {
    if (node.kind == Skew.NodeKind.CAST) {
      node = node.castValue();
    }

    return node.kind == Skew.NodeKind.NAME && node.symbol == symbol;
  };

  Skew.JavaScriptEmitter._isJumpImplied = function(node, kind) {
    assert(node.kind == Skew.NodeKind.BLOCK);
    assert(kind == Skew.NodeKind.RETURN || kind == Skew.NodeKind.CONTINUE);
    var parent = node.parent();

    if (kind == Skew.NodeKind.RETURN && (parent == null || parent.kind == Skew.NodeKind.LAMBDA) || kind == Skew.NodeKind.CONTINUE && parent != null && Skew.in_NodeKind.isLoop(parent.kind)) {
      return true;
    }

    if (parent != null && parent.kind == Skew.NodeKind.IF && parent.nextSibling() == null) {
      return Skew.JavaScriptEmitter._isJumpImplied(parent.parent(), kind);
    }

    return false;
  };

  Skew.JavaScriptEmitter._isIdentifierString = function(node) {
    if (node.isString()) {
      var value = node.asString();

      for (var i = 0, count = value.length; i < count; ++i) {
        var c = value.charCodeAt(i);

        if ((c < 65 || c > 90) && (c < 97 || c > 122) && c != 95 && c != 36 && (i == 0 || c < 48 || c > 57)) {
          return false;
        }
      }

      return value != null && !(value in Skew.JavaScriptEmitter._isKeyword);
    }

    return false;
  };

  Skew.JavaScriptEmitter._singleIf = function(block) {
    if (block == null) {
      return null;
    }

    var statement = block.blockStatement();

    if (statement != null && statement.kind == Skew.NodeKind.IF) {
      return statement;
    }

    return null;
  };

  Skew.JavaScriptEmitter._symbolsOrStringsLookTheSame = function(left, right) {
    return left.symbol != null && left.symbol == right.symbol || left.symbol == null && right.symbol == null && left.asString() == right.asString();
  };

  Skew.JavaScriptEmitter._childrenLookTheSame = function(left, right) {
    var leftChild = left.firstChild();
    var rightChild = right.firstChild();

    while (leftChild != null && rightChild != null) {
      if (!Skew.JavaScriptEmitter._looksTheSame(leftChild, rightChild)) {
        return false;
      }

      leftChild = leftChild.nextSibling();
      rightChild = rightChild.nextSibling();
    }

    return leftChild == null && rightChild == null;
  };

  Skew.JavaScriptEmitter._looksTheSame = function(left, right) {
    if (left.kind == right.kind) {
      switch (left.kind) {
        case Skew.NodeKind.NULL: {
          return true;
        }

        case Skew.NodeKind.NAME: {
          return Skew.JavaScriptEmitter._symbolsOrStringsLookTheSame(left, right);
        }

        case Skew.NodeKind.DOT: {
          return Skew.JavaScriptEmitter._symbolsOrStringsLookTheSame(left, right) && Skew.JavaScriptEmitter._looksTheSame(left.dotTarget(), right.dotTarget());
        }

        case Skew.NodeKind.CONSTANT: {
          switch (left.content.kind()) {
            case Skew.ContentKind.INT: {
              return right.isInt() && left.asInt() == right.asInt();
            }

            case Skew.ContentKind.BOOL: {
              return right.isBool() && left.asBool() == right.asBool();
            }

            case Skew.ContentKind.DOUBLE: {
              return right.isDouble() && left.asDouble() == right.asDouble();
            }

            case Skew.ContentKind.STRING: {
              return right.isString() && left.asString() == right.asString();
            }
          }
          break;
        }

        case Skew.NodeKind.BLOCK:
        case Skew.NodeKind.BREAK:
        case Skew.NodeKind.CONTINUE:
        case Skew.NodeKind.EXPRESSION:
        case Skew.NodeKind.IF:
        case Skew.NodeKind.RETURN:
        case Skew.NodeKind.THROW:
        case Skew.NodeKind.WHILE:
        case Skew.NodeKind.ASSIGN_INDEX:
        case Skew.NodeKind.CALL:
        case Skew.NodeKind.HOOK:
        case Skew.NodeKind.INDEX:
        case Skew.NodeKind.INITIALIZER_LIST:
        case Skew.NodeKind.INITIALIZER_MAP:
        case Skew.NodeKind.PAIR:
        case Skew.NodeKind.SEQUENCE:
        case Skew.NodeKind.COMPLEMENT:
        case Skew.NodeKind.DECREMENT:
        case Skew.NodeKind.INCREMENT:
        case Skew.NodeKind.NEGATIVE:
        case Skew.NodeKind.NOT:
        case Skew.NodeKind.POSITIVE: {
          return Skew.JavaScriptEmitter._childrenLookTheSame(left, right);
        }

        default: {
          if (Skew.in_NodeKind.isBinary(left.kind)) {
            return Skew.JavaScriptEmitter._childrenLookTheSame(left, right);
          }
          break;
        }
      }
    }

    // Null literals are always implicitly casted, so unwrap implicit casts
    if (left.kind == Skew.NodeKind.CAST) {
      return Skew.JavaScriptEmitter._looksTheSame(left.castValue(), right);
    }

    if (right.kind == Skew.NodeKind.CAST) {
      return Skew.JavaScriptEmitter._looksTheSame(left, right.castValue());
    }

    return false;
  };

  Skew.JavaScriptEmitter._numberToName = function(number) {
    var name = Skew.JavaScriptEmitter._first[number % Skew.JavaScriptEmitter._first.length | 0];
    number = number / Skew.JavaScriptEmitter._first.length | 0;

    while (number > 0) {
      --number;
      name += Skew.JavaScriptEmitter._rest[number % Skew.JavaScriptEmitter._rest.length | 0];
      number = number / Skew.JavaScriptEmitter._rest.length | 0;
    }

    return name;
  };

  Skew.JavaScriptEmitter._isCompactNodeKind = function(kind) {
    return kind == Skew.NodeKind.EXPRESSION || kind == Skew.NodeKind.VARIABLES || Skew.in_NodeKind.isJump(kind);
  };

  Skew.JavaScriptEmitter._isFalsy = function(node) {
    switch (node.kind) {
      case Skew.NodeKind.NULL: {
        return true;
      }

      case Skew.NodeKind.CAST: {
        return Skew.JavaScriptEmitter._isFalsy(node.castValue());
      }

      case Skew.NodeKind.CONSTANT: {
        var content = node.content;

        switch (content.kind()) {
          case Skew.ContentKind.INT: {
            return Skew.in_Content.asInt(content) == 0;
          }

          case Skew.ContentKind.DOUBLE: {
            return Skew.in_Content.asDouble(content) == 0 || isNaN(Skew.in_Content.asDouble(content));
          }

          case Skew.ContentKind.STRING: {
            return Skew.in_Content.asString(content) == '';
          }
        }
        break;
      }
    }

    return false;
  };

  Skew.JavaScriptEmitter._fullName = function(symbol) {
    var parent = symbol.parent;

    if (parent != null && parent.kind != Skew.SymbolKind.OBJECT_GLOBAL) {
      var enclosingName = Skew.JavaScriptEmitter._fullName(parent);

      if (symbol.isPrimaryConstructor() || symbol.isImported() && symbol.kind == Skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
        return enclosingName;
      }

      if (symbol.kind == Skew.SymbolKind.FUNCTION_INSTANCE) {
        enclosingName += '.prototype';
      }

      return enclosingName + '.' + Skew.JavaScriptEmitter._mangleName(symbol);
    }

    return Skew.JavaScriptEmitter._mangleName(symbol);
  };

  Skew.JavaScriptEmitter._shouldRenameSymbol = function(symbol) {
    // Don't rename annotations since "@rename" is used for renaming and is identified by name
    return !symbol.isImportedOrExported() && !symbol.isRenamed() && symbol.kind != Skew.SymbolKind.FUNCTION_ANNOTATION && symbol.kind != Skew.SymbolKind.OBJECT_GLOBAL && symbol.kind != Skew.SymbolKind.FUNCTION_LOCAL;
  };

  Skew.JavaScriptEmitter._mangleName = function(symbol) {
    symbol = symbol.forwarded();

    if (symbol.isPrimaryConstructor()) {
      symbol = symbol.parent;
    }

    if (!symbol.isImportedOrExported() && (symbol.name in Skew.JavaScriptEmitter._isKeyword || symbol.parent != null && symbol.parent.kind == Skew.SymbolKind.OBJECT_CLASS && !Skew.in_SymbolKind.isOnInstances(symbol.kind) && symbol.name in Skew.JavaScriptEmitter._isFunctionProperty)) {
      return '$' + symbol.name;
    }

    return symbol.name;
  };

  Skew.JavaScriptEmitter._computeNamespacePrefix = function(symbol) {
    assert(Skew.in_SymbolKind.isObject(symbol.kind));
    return symbol.kind == Skew.SymbolKind.OBJECT_GLOBAL ? '' : Skew.JavaScriptEmitter._computeNamespacePrefix(symbol.parent.asObjectSymbol()) + Skew.JavaScriptEmitter._mangleName(symbol) + '.';
  };

  Skew.JavaScriptEmitter._alwaysConvertsOperandsToInt = function(node) {
    if (node != null) {
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

  Skew.JavaScriptEmitter.BooleanSwap = {
    SWAP: 0,
    NO_SWAP: 1
  };

  Skew.JavaScriptEmitter.ExtractGroupsMode = {
    ALL_SYMBOLS: 0,
    ONLY_LOCAL_VARIABLES: 1,
    ONLY_INSTANCE_VARIABLES: 2
  };

  Skew.JavaScriptEmitter.SymbolGroup = function(symbols, count) {
    this.symbols = symbols;
    this.count = count;
  };

  Skew.JavaScriptEmitter.AfterToken = {
    AFTER_KEYWORD: 0,
    AFTER_PARENTHESIS: 1
  };

  Skew.JavaScriptEmitter.BracesMode = {
    MUST_KEEP_BRACES: 0,
    CAN_OMIT_BRACES: 1
  };

  Skew.JavaScriptEmitter.SpecialVariable = {
    NONE: 0,
    EXTENDS: 1,
    IS_BOOL: 2,
    IS_DOUBLE: 3,
    IS_INT: 4,
    IS_STRING: 5,
    MULTIPLY: 6
  };

  // These dump() functions are helpful for debugging syntax trees
  Skew.LispTreeEmitter = function(_options) {
    Skew.Emitter.call(this);
    this._options = _options;
  };

  __extends(Skew.LispTreeEmitter, Skew.Emitter);

  Skew.LispTreeEmitter.prototype.visit = function(global) {
    this._visitObject(global);
    this._emit('\n');
    this._createSource(this._options.outputDirectory != null ? this._options.outputDirectory + '/compiled.lisp' : this._options.outputFile, Skew.EmitMode.ALWAYS_EMIT);
  };

  Skew.LispTreeEmitter.prototype._visitObject = function(symbol) {
    this._emit('(' + this._mangleKind(Skew.in_SymbolKind._strings[symbol.kind]) + ' ' + Skew.quoteString(symbol.name, Skew.QuoteStyle.DOUBLE));
    this._increaseIndent();

    for (var i = 0, list = symbol.objects, count = list.length; i < count; ++i) {
      var object = list[i];
      this._emit('\n' + this._indent);
      this._visitObject(object);
    }

    for (var i1 = 0, list1 = symbol.functions, count1 = list1.length; i1 < count1; ++i1) {
      var $function = list1[i1];
      this._emit('\n' + this._indent);
      this._visitFunction($function);
    }

    for (var i2 = 0, list2 = symbol.variables, count2 = list2.length; i2 < count2; ++i2) {
      var variable = list2[i2];
      this._emit('\n' + this._indent);
      this._visitVariable(variable);
    }

    this._decreaseIndent();
    this._emit(')');
  };

  Skew.LispTreeEmitter.prototype._visitFunction = function(symbol) {
    this._emit('(' + this._mangleKind(Skew.in_SymbolKind._strings[symbol.kind]) + ' ' + Skew.quoteString(symbol.name, Skew.QuoteStyle.DOUBLE));
    this._increaseIndent();

    for (var i = 0, list = symbol.$arguments, count = list.length; i < count; ++i) {
      var argument = list[i];
      this._emit('\n' + this._indent);
      this._visitVariable(argument);
    }

    this._emit('\n' + this._indent);
    this._visitNode(symbol.returnType);
    this._emit('\n' + this._indent);
    this._visitNode(symbol.block);
    this._decreaseIndent();
    this._emit(')');
  };

  Skew.LispTreeEmitter.prototype._visitVariable = function(symbol) {
    this._emit('(' + this._mangleKind(Skew.in_SymbolKind._strings[symbol.kind]) + ' ' + Skew.quoteString(symbol.name, Skew.QuoteStyle.DOUBLE) + ' ');
    this._visitNode(symbol.type);
    this._emit(' ');
    this._visitNode(symbol.value);
    this._emit(')');
  };

  Skew.LispTreeEmitter.prototype._visitNode = function(node) {
    if (node == null) {
      this._emit('nil');
      return;
    }

    this._emit('(' + this._mangleKind(Skew.in_NodeKind._strings[node.kind]));
    var content = node.content;

    if (content != null) {
      switch (content.kind()) {
        case Skew.ContentKind.INT: {
          this._emit(' ' + Skew.in_Content.asInt(content).toString());
          break;
        }

        case Skew.ContentKind.BOOL: {
          this._emit(' ' + Skew.in_Content.asBool(content).toString());
          break;
        }

        case Skew.ContentKind.DOUBLE: {
          this._emit(' ' + Skew.in_Content.asDouble(content).toString());
          break;
        }

        case Skew.ContentKind.STRING: {
          this._emit(' ' + Skew.quoteString(Skew.in_Content.asString(content), Skew.QuoteStyle.DOUBLE));
          break;
        }
      }
    }

    if (node.kind == Skew.NodeKind.VARIABLE) {
      this._emit(' ');
      this._visitVariable(node.symbol.asVariableSymbol());
    }

    else if (node.kind == Skew.NodeKind.LAMBDA) {
      this._emit(' ');
      this._visitFunction(node.symbol.asFunctionSymbol());
    }

    else if (node.hasChildren()) {
      this._increaseIndent();

      for (var child = node.firstChild(); child != null; child = child.nextSibling()) {
        this._emit('\n' + this._indent);
        this._visitNode(child);
      }

      this._decreaseIndent();
    }

    this._emit(')');
  };

  Skew.LispTreeEmitter.prototype._mangleKind = function(kind) {
    return kind.toLowerCase().split('_').join('-');
  };

  Skew.SourceMapping = function(sourceIndex, originalLine, originalColumn, generatedLine, generatedColumn) {
    this.sourceIndex = sourceIndex;
    this.originalLine = originalLine;
    this.originalColumn = originalColumn;
    this.generatedLine = generatedLine;
    this.generatedColumn = generatedColumn;
  };

  // Based on https://github.com/mozilla/source-map
  Skew.SourceMapGenerator = function() {
    this._mappings = [];
    this._sources = [];
  };

  Skew.SourceMapGenerator.prototype.addMapping = function(source, originalLine, originalColumn, generatedLine, generatedColumn) {
    var sourceIndex = this._sources.indexOf(source);

    if (sourceIndex == -1) {
      sourceIndex = this._sources.length;
      this._sources.push(source);
    }

    this._mappings.push(new Skew.SourceMapping(sourceIndex, originalLine, originalColumn, generatedLine, generatedColumn));
  };

  Skew.SourceMapGenerator.prototype.toString = function() {
    var sourceNames = [];
    var sourceContents = [];

    for (var i = 0, list = this._sources, count = list.length; i < count; ++i) {
      var source = list[i];
      sourceNames.push(Skew.quoteString(source.name, Skew.QuoteStyle.DOUBLE));
      sourceContents.push(Skew.quoteString(source.contents, Skew.QuoteStyle.DOUBLE));
    }

    var builder = new StringBuilder();
    builder.append('{"version":3,"sources":[');
    builder.append(sourceNames.join(','));
    builder.append('],"sourcesContent":[');
    builder.append(sourceContents.join(','));
    builder.append('],"names":[],"mappings":"');

    // Sort the mappings in increasing order by generated location
    this._mappings.sort(function(a, b) {
      var delta = a.generatedLine - b.generatedLine | 0;
      return delta != 0 ? delta : a.generatedColumn - b.generatedColumn | 0;
    });
    var previousGeneratedColumn = 0;
    var previousGeneratedLine = 0;
    var previousOriginalColumn = 0;
    var previousOriginalLine = 0;
    var previousSourceIndex = 0;

    // Generate the base64 VLQ encoded mappings
    for (var i1 = 0, list1 = this._mappings, count1 = list1.length; i1 < count1; ++i1) {
      var mapping = list1[i1];
      var generatedLine = mapping.generatedLine;

      // Insert ',' for the same line and ';' for a line
      if (previousGeneratedLine == generatedLine) {
        if (previousGeneratedColumn == mapping.generatedColumn && (previousGeneratedLine != 0 || previousGeneratedColumn != 0)) {
          continue;
        }

        builder.append(',');
      }

      else {
        previousGeneratedColumn = 0;

        while (previousGeneratedLine < generatedLine) {
          builder.append(';');
          ++previousGeneratedLine;
        }
      }

      // Record the generated column (the line is recorded using ';' above)
      builder.append(Skew.encodeVLQ(mapping.generatedColumn - previousGeneratedColumn | 0));
      previousGeneratedColumn = mapping.generatedColumn;

      // Record the generated source
      builder.append(Skew.encodeVLQ(mapping.sourceIndex - previousSourceIndex | 0));
      previousSourceIndex = mapping.sourceIndex;

      // Record the original line
      builder.append(Skew.encodeVLQ(mapping.originalLine - previousOriginalLine | 0));
      previousOriginalLine = mapping.originalLine;

      // Record the original column
      builder.append(Skew.encodeVLQ(mapping.originalColumn - previousOriginalColumn | 0));
      previousOriginalColumn = mapping.originalColumn;
    }

    builder.append('"}\n');
    return builder.toString();
  };

  Skew.ContentKind = {
    BOOL: 0,
    INT: 1,
    DOUBLE: 2,
    STRING: 3
  };

  Skew.BoolContent = function(value) {
    this.value = value;
  };

  Skew.BoolContent.prototype.kind = function() {
    return Skew.ContentKind.BOOL;
  };

  Skew.IntContent = function(value) {
    this.value = value;
  };

  Skew.IntContent.prototype.kind = function() {
    return Skew.ContentKind.INT;
  };

  Skew.DoubleContent = function(value) {
    this.value = value;
  };

  Skew.DoubleContent.prototype.kind = function() {
    return Skew.ContentKind.DOUBLE;
  };

  Skew.StringContent = function(value) {
    this.value = value;
  };

  Skew.StringContent.prototype.kind = function() {
    return Skew.ContentKind.STRING;
  };

  Skew.NodeKind = {
    // Other
    ANNOTATION: 0,
    BLOCK: 1,
    CASE: 2,
    CATCH: 3,
    VARIABLE: 4,

    // Statements
    BREAK: 5,
    CONTINUE: 6,
    EXPRESSION: 7,
    FOR: 8,
    FOREACH: 9,
    IF: 10,
    RETURN: 11,
    SWITCH: 12,
    THROW: 13,
    TRY: 14,
    VARIABLES: 15,
    WHILE: 16,

    // Expressions
    ASSIGN_INDEX: 17,
    CALL: 18,
    CAST: 19,
    CONSTANT: 20,
    DOT: 21,
    HOOK: 22,
    INDEX: 23,
    INITIALIZER_LIST: 24,
    INITIALIZER_MAP: 25,
    LAMBDA: 26,
    LAMBDA_TYPE: 27,
    NAME: 28,
    NULL: 29,
    PAIR: 30,
    PARAMETERIZE: 31,
    SEQUENCE: 32,
    SUPER: 33,
    TYPE: 34,
    TYPE_CHECK: 35,

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
    LOGICAL_AND: 50,
    LOGICAL_OR: 51,
    MULTIPLY: 52,
    NOT_EQUAL: 53,
    POWER: 54,
    REMAINDER: 55,
    SHIFT_LEFT: 56,
    SHIFT_RIGHT: 57,
    SUBTRACT: 58,
    UNSIGNED_SHIFT_RIGHT: 59,

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
    ASSIGN_SUBTRACT: 75,
    ASSIGN_UNSIGNED_SHIFT_RIGHT: 76
  };

  // Flags
  // Nodes represent executable code (variable initializers and function bodies)
  // Node-specific queries
  // Factory functions
  // Getters, most of which should be inlineable when asserts are skipped in release
  Skew.Node = function(kind) {
    this.id = Skew.Node._createID();
    this.kind = kind;
    this.flags = 0;
    this.range = null;
    this.internalRange = null;
    this.symbol = null;
    this.content = null;
    this.resolvedType = null;
    this.comments = null;
    this._parent = null;
    this._firstChild = null;
    this._lastChild = null;
    this._previousSibling = null;
    this._nextSibling = null;
  };

  Skew.Node.prototype._cloneWithoutChildren = function() {
    var clone = new Skew.Node(this.kind);
    clone.flags = this.flags;
    clone.range = this.range;
    clone.internalRange = this.internalRange;
    clone.symbol = this.symbol;
    clone.content = this.content;
    clone.resolvedType = this.resolvedType;
    clone.comments = this.comments != null ? this.comments.slice() : null;
    return clone;
  };

  // When used with become(), this provides a convenient way to wrap a node in
  // an operation without the caller needing to be aware of replaceWith():
  //
  //  node.become(Node.createUnary(.NOT, node.cloneAndStealChildren))
  //
  Skew.Node.prototype.cloneAndStealChildren = function() {
    var clone = this._cloneWithoutChildren();

    while (this.hasChildren()) {
      clone.appendChild(this._firstChild.remove());
    }

    return clone;
  };

  Skew.Node.prototype.clone = function() {
    var clone = this._cloneWithoutChildren();

    for (var child = this._firstChild; child != null; child = child._nextSibling) {
      clone.appendChild(child.clone());
    }

    return clone;
  };

  // Change self node in place to become the provided node. The parent node is
  // not changed, so become() can be called within a nested method and does not
  // need to report the updated node reference to the caller since the reference
  // does not change.
  Skew.Node.prototype.become = function(node) {
    if (node == this) {
      return;
    }

    assert(node._parent == null);
    this.kind = node.kind;
    this.flags = node.flags;
    this.range = node.range;
    this.internalRange = node.internalRange;
    this.symbol = node.symbol;
    this.content = node.content;
    this.resolvedType = node.resolvedType;
    this.comments = node.comments;
    this.removeChildren();
    this.appendChildrenFrom(node);
  };

  Skew.Node.prototype.parent = function() {
    return this._parent;
  };

  Skew.Node.prototype.firstChild = function() {
    return this._firstChild;
  };

  Skew.Node.prototype.lastChild = function() {
    return this._lastChild;
  };

  Skew.Node.prototype.previousSibling = function() {
    return this._previousSibling;
  };

  Skew.Node.prototype.nextSibling = function() {
    return this._nextSibling;
  };

  Skew.Node.prototype.isImplicitReturn = function() {
    return (this.flags & Skew.Node.IS_IMPLICIT_RETURN) != 0;
  };

  Skew.Node.prototype.isInsideParentheses = function() {
    return (this.flags & Skew.Node.IS_INSIDE_PARENTHESES) != 0;
  };

  Skew.Node.prototype.hasControlFlowAtEnd = function() {
    return (this.flags & Skew.Node.HAS_CONTROL_FLOW_AT_END) != 0;
  };

  // This is cheaper than childCount == 0
  Skew.Node.prototype.hasChildren = function() {
    return this._firstChild != null;
  };

  // This is cheaper than childCount == 1
  Skew.Node.prototype.hasOneChild = function() {
    return this.hasChildren() && this._firstChild == this._lastChild;
  };

  // This is cheaper than childCount == 2
  Skew.Node.prototype.hasTwoChildren = function() {
    return this.hasChildren() && this._firstChild.nextSibling() == this._lastChild;
  };

  // This is cheaper than childCount == 3
  Skew.Node.prototype.hasThreeChildren = function() {
    return this.hasChildren() && this._firstChild.nextSibling() == this._lastChild.previousSibling();
  };

  Skew.Node.prototype.childCount = function() {
    var count = 0;

    for (var child = this._firstChild; child != null; child = child._nextSibling) {
      ++count;
    }

    return count;
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

  Skew.Node.prototype.withComments = function(value) {
    assert(this.comments == null);
    this.comments = value;
    return this;
  };

  Skew.Node.prototype.internalRangeOrRange = function() {
    return this.internalRange != null ? this.internalRange : this.range;
  };

  Skew.Node.prototype.prependChild = function(node) {
    if (node == null) {
      return this;
    }

    assert(node != this);
    assert(node._parent == null);
    assert(node._previousSibling == null);
    assert(node._nextSibling == null);
    node._parent = this;

    if (this.hasChildren()) {
      node._nextSibling = this._firstChild;
      this._firstChild._previousSibling = node;
      this._firstChild = node;
    }

    else {
      this._lastChild = this._firstChild = node;
    }

    return this;
  };

  Skew.Node.prototype.appendChild = function(node) {
    if (node == null) {
      return this;
    }

    assert(node != this);
    assert(node._parent == null);
    assert(node._previousSibling == null);
    assert(node._nextSibling == null);
    node._parent = this;

    if (this.hasChildren()) {
      node._previousSibling = this._lastChild;
      this._lastChild._nextSibling = node;
      this._lastChild = node;
    }

    else {
      this._lastChild = this._firstChild = node;
    }

    return this;
  };

  Skew.Node.prototype.appendChildrenFrom = function(node) {
    assert(node != this);

    while (node.hasChildren()) {
      this.appendChild(node._firstChild.remove());
    }

    return this;
  };

  Skew.Node.prototype.insertChildBefore = function(after, before) {
    if (before == null) {
      return this;
    }

    assert(before != after);
    assert(before._parent == null);
    assert(before._previousSibling == null);
    assert(before._nextSibling == null);
    assert(after == null || after._parent == this);

    if (after == null) {
      return this.appendChild(before);
    }

    before._parent = this;
    before._previousSibling = after._previousSibling;
    before._nextSibling = after;

    if (after._previousSibling != null) {
      assert(after == after._previousSibling._nextSibling);
      after._previousSibling._nextSibling = before;
    }

    else {
      assert(after == this._firstChild);
      this._firstChild = before;
    }

    after._previousSibling = before;
    return this;
  };

  Skew.Node.prototype.insertChildAfter = function(before, after) {
    if (before == null) {
      return this;
    }

    assert(before != after);
    assert(after._parent == null);
    assert(after._previousSibling == null);
    assert(after._nextSibling == null);
    assert(before == null || before._parent == this);

    if (before == null) {
      return this.prependChild(after);
    }

    after._parent = this;
    after._previousSibling = before;
    after._nextSibling = before._nextSibling;

    if (before._nextSibling != null) {
      assert(before == before._nextSibling._previousSibling);
      before._nextSibling._previousSibling = after;
    }

    else {
      assert(before == this._lastChild);
      this._lastChild = after;
    }

    before._nextSibling = after;
    return this;
  };

  Skew.Node.prototype.insertChildrenAfterFrom = function(from, after) {
    while (from.hasChildren()) {
      this.insertChildAfter(after, from.lastChild().remove());
    }
  };

  Skew.Node.prototype.remove = function() {
    assert(this._parent != null);

    if (this._previousSibling != null) {
      assert(this._previousSibling._nextSibling == this);
      this._previousSibling._nextSibling = this._nextSibling;
    }

    else {
      assert(this._parent._firstChild == this);
      this._parent._firstChild = this._nextSibling;
    }

    if (this._nextSibling != null) {
      assert(this._nextSibling._previousSibling == this);
      this._nextSibling._previousSibling = this._previousSibling;
    }

    else {
      assert(this._parent._lastChild == this);
      this._parent._lastChild = this._previousSibling;
    }

    this._parent = null;
    this._previousSibling = null;
    this._nextSibling = null;
    return this;
  };

  Skew.Node.prototype.removeChildren = function() {
    while (this.hasChildren()) {
      this._firstChild.remove();
    }
  };

  Skew.Node.prototype.replaceWith = function(node) {
    assert(node != this);
    assert(this._parent != null);
    assert(node._parent == null);
    assert(node._previousSibling == null);
    assert(node._nextSibling == null);
    node._parent = this._parent;
    node._previousSibling = this._previousSibling;
    node._nextSibling = this._nextSibling;

    if (this._previousSibling != null) {
      assert(this._previousSibling._nextSibling == this);
      this._previousSibling._nextSibling = node;
    }

    else {
      assert(this._parent._firstChild == this);
      this._parent._firstChild = node;
    }

    if (this._nextSibling != null) {
      assert(this._nextSibling._previousSibling == this);
      this._nextSibling._previousSibling = node;
    }

    else {
      assert(this._parent._lastChild == this);
      this._parent._lastChild = node;
    }

    this._parent = null;
    this._previousSibling = null;
    this._nextSibling = null;
    return this;
  };

  Skew.Node.prototype.replaceWithChildrenFrom = function(node) {
    assert(node != this);
    var parent = this._parent;

    while (node.hasChildren()) {
      parent.insertChildBefore(this, node._firstChild.remove());
    }

    return this.remove();
  };

  Skew.Node.prototype.swapWith = function(node) {
    assert(node != this);
    assert(this._parent != null && this._parent == node._parent);
    var parent = this._parent;
    var nextSibling = this._nextSibling;

    if (node == this._previousSibling) {
      parent.insertChildBefore(node, this.remove());
    }

    else if (node == nextSibling) {
      parent.insertChildAfter(node, this.remove());
    }

    else {
      parent.insertChildBefore(node, this.remove());
      parent.insertChildBefore(nextSibling, node.remove());
    }
  };

  Skew.Node._createID = function() {
    ++Skew.Node._nextID;
    return Skew.Node._nextID;
  };

  Skew.Node.prototype.isSuperCallStatement = function() {
    return this.kind == Skew.NodeKind.EXPRESSION && (this.expressionValue().kind == Skew.NodeKind.SUPER || this.expressionValue().kind == Skew.NodeKind.CALL && this.expressionValue().callValue().kind == Skew.NodeKind.SUPER);
  };

  Skew.Node.prototype.isEmptySequence = function() {
    return this.kind == Skew.NodeKind.SEQUENCE && !this.hasChildren();
  };

  Skew.Node.prototype.isTrue = function() {
    return this.kind == Skew.NodeKind.CONSTANT && this.content.kind() == Skew.ContentKind.BOOL && Skew.in_Content.asBool(this.content);
  };

  Skew.Node.prototype.isFalse = function() {
    return this.kind == Skew.NodeKind.CONSTANT && this.content.kind() == Skew.ContentKind.BOOL && !Skew.in_Content.asBool(this.content);
  };

  Skew.Node.prototype.isType = function() {
    return this.kind == Skew.NodeKind.TYPE || this.kind == Skew.NodeKind.LAMBDA_TYPE || (this.kind == Skew.NodeKind.NAME || this.kind == Skew.NodeKind.DOT || this.kind == Skew.NodeKind.PARAMETERIZE) && this.symbol != null && Skew.in_SymbolKind.isType(this.symbol.kind);
  };

  Skew.Node.prototype.isAssignTarget = function() {
    return this._parent != null && (Skew.in_NodeKind.isUnaryAssign(this._parent.kind) || Skew.in_NodeKind.isBinaryAssign(this._parent.kind) && this == this._parent.binaryLeft());
  };

  Skew.Node.prototype.isNumberLessThanZero = function() {
    return this.isInt() && this.asInt() < 0 || this.isDouble() && this.asDouble() < 0;
  };

  Skew.Node.prototype.hasNoSideEffects = function() {
    assert(Skew.in_NodeKind.isExpression(this.kind));

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

      case Skew.NodeKind.COMPLEMENT:
      case Skew.NodeKind.DECREMENT:
      case Skew.NodeKind.INCREMENT:
      case Skew.NodeKind.NEGATIVE:
      case Skew.NodeKind.NOT:
      case Skew.NodeKind.POSITIVE: {
        return !Skew.in_NodeKind.isUnaryAssign(this.kind) && this.unaryValue().hasNoSideEffects();
      }

      default: {
        if (Skew.in_NodeKind.isBinary(this.kind)) {
          return !Skew.in_NodeKind.isBinaryAssign(this.kind) && this.binaryLeft().hasNoSideEffects() && this.binaryRight().hasNoSideEffects();
        }
        break;
      }
    }

    return false;
  };

  Skew.Node.prototype.invertBooleanCondition = function(cache) {
    assert(Skew.in_NodeKind.isExpression(this.kind));

    switch (this.kind) {
      case Skew.NodeKind.CONSTANT: {
        if (this.content.kind() == Skew.ContentKind.BOOL) {
          this.content = new Skew.BoolContent(!Skew.in_Content.asBool(this.content));
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

        if (commonType != null && commonType != cache.doubleType) {
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

      case Skew.NodeKind.SEQUENCE: {
        this._lastChild.invertBooleanCondition(cache);
        return;
      }
    }

    this.become(Skew.Node.createUnary(Skew.NodeKind.NOT, this.cloneAndStealChildren()).withType(cache.boolType));
  };

  Skew.Node.prototype.replaceVariableWith = function(node) {
    assert(this.kind == Skew.NodeKind.VARIABLE);
    assert(this.parent() != null);
    assert(this.parent().kind == Skew.NodeKind.VARIABLES);

    // "var x = 0" becomes "node"
    if (this._previousSibling == null && this._nextSibling == null) {
      this.parent().replaceWith(node);
    }

    // "var x = 0, y = 0" becomes "node; var y = 0"
    else if (this._previousSibling == null) {
      this.parent()._parent.insertChildBefore(this.parent(), node);
    }

    // "var x = 0, y = 0" becomes "var x = 0; node"
    else if (this._nextSibling == null) {
      this.parent()._parent.insertChildAfter(this.parent(), node);
    }

    // "var x = 0, y = 0, z = 0" becomes "var x = 0; node; var z = 0"
    else {
      var variables = new Skew.Node(Skew.NodeKind.VARIABLES);
      this.parent()._parent.insertChildAfter(this.parent(), node);
      this.parent()._parent.insertChildAfter(node, variables);

      while (this._nextSibling != null) {
        variables.appendChild(this._nextSibling.remove());
      }
    }

    return this.remove();
  };

  // "a + (b + c)" => "(a + b) + c"
  Skew.Node.prototype.rotateBinaryRightToLeft = function() {
    assert(this.kind == this.binaryRight().kind);
    var left = this.binaryLeft();
    var right = this.binaryRight();
    var rightLeft = right.binaryLeft();
    var rightRight = right.binaryRight();

    // "a + (b + c)" => "(b + c) + a"
    left.swapWith(right);

    // "a + (b + c)" => "(c + b) + a"
    rightLeft.swapWith(rightRight);

    // "a + (b + c)" => "(a + c + b)"
    right.prependChild(left.remove());

    // "a + (b + c)" => "(a + b) + c"
    this.appendChild(rightRight.remove());
  };

  Skew.Node.createAnnotation = function(value, test) {
    assert(Skew.in_NodeKind.isExpression(value.kind));
    assert(test == null || Skew.in_NodeKind.isExpression(test.kind));
    return new Skew.Node(Skew.NodeKind.ANNOTATION).appendChild(value).appendChild(test);
  };

  Skew.Node.createCatch = function(symbol, block) {
    assert(block.kind == Skew.NodeKind.BLOCK);
    return new Skew.Node(Skew.NodeKind.CATCH).appendChild(block).withSymbol(symbol);
  };

  Skew.Node.createExpression = function(value) {
    assert(Skew.in_NodeKind.isExpression(value.kind));
    return new Skew.Node(Skew.NodeKind.EXPRESSION).appendChild(value);
  };

  Skew.Node.createFor = function(setup, test, update, block) {
    assert(Skew.in_NodeKind.isExpression(setup.kind) || setup.kind == Skew.NodeKind.VARIABLES);
    assert(Skew.in_NodeKind.isExpression(test.kind));
    assert(Skew.in_NodeKind.isExpression(update.kind));
    assert(block.kind == Skew.NodeKind.BLOCK);
    return new Skew.Node(Skew.NodeKind.FOR).appendChild(setup).appendChild(test).appendChild(update).appendChild(block);
  };

  Skew.Node.createForeach = function(symbol, value, block) {
    assert(Skew.in_NodeKind.isExpression(value.kind));
    assert(block.kind == Skew.NodeKind.BLOCK);
    return new Skew.Node(Skew.NodeKind.FOREACH).withSymbol(symbol).appendChild(value).appendChild(block);
  };

  Skew.Node.createIf = function(test, trueBlock, falseBlock) {
    assert(Skew.in_NodeKind.isExpression(test.kind));
    assert(trueBlock.kind == Skew.NodeKind.BLOCK);
    assert(falseBlock == null || falseBlock.kind == Skew.NodeKind.BLOCK);
    return new Skew.Node(Skew.NodeKind.IF).appendChild(test).appendChild(trueBlock).appendChild(falseBlock);
  };

  Skew.Node.createReturn = function(value) {
    assert(value == null || Skew.in_NodeKind.isExpression(value.kind));
    return new Skew.Node(Skew.NodeKind.RETURN).appendChild(value);
  };

  Skew.Node.createSwitch = function(value) {
    assert(Skew.in_NodeKind.isExpression(value.kind));
    return new Skew.Node(Skew.NodeKind.SWITCH).appendChild(value);
  };

  Skew.Node.createThrow = function(value) {
    assert(Skew.in_NodeKind.isExpression(value.kind));
    return new Skew.Node(Skew.NodeKind.THROW).appendChild(value);
  };

  Skew.Node.createTry = function(tryBlock) {
    assert(tryBlock.kind == Skew.NodeKind.BLOCK);
    return new Skew.Node(Skew.NodeKind.TRY).appendChild(tryBlock);
  };

  // This adds the initializer expression to the tree for ease of traversal
  Skew.Node.createVariable = function(symbol) {
    return new Skew.Node(Skew.NodeKind.VARIABLE).appendChild(symbol.value).withSymbol(symbol);
  };

  Skew.Node.createIndex = function(left, right) {
    assert(Skew.in_NodeKind.isExpression(left.kind));
    assert(Skew.in_NodeKind.isExpression(right.kind));
    return new Skew.Node(Skew.NodeKind.INDEX).appendChild(left).appendChild(right);
  };

  Skew.Node.createCall = function(target) {
    assert(Skew.in_NodeKind.isExpression(target.kind));
    return new Skew.Node(Skew.NodeKind.CALL).appendChild(target);
  };

  Skew.Node.createCast = function(value, type) {
    assert(Skew.in_NodeKind.isExpression(value.kind));
    assert(Skew.in_NodeKind.isExpression(type.kind));
    return new Skew.Node(Skew.NodeKind.CAST).appendChild(value).appendChild(type);
  };

  Skew.Node.createHook = function(test, trueValue, falseValue) {
    assert(Skew.in_NodeKind.isExpression(test.kind));
    assert(Skew.in_NodeKind.isExpression(trueValue.kind));
    assert(Skew.in_NodeKind.isExpression(falseValue.kind));
    return new Skew.Node(Skew.NodeKind.HOOK).appendChild(test).appendChild(trueValue).appendChild(falseValue);
  };

  Skew.Node.createInitializer = function(kind) {
    assert(Skew.in_NodeKind.isInitializer(kind));
    return new Skew.Node(kind);
  };

  // This adds the block to the tree for ease of traversal
  Skew.Node.createLambda = function(symbol) {
    return new Skew.Node(Skew.NodeKind.LAMBDA).appendChild(symbol.block).withSymbol(symbol);
  };

  Skew.Node.createPair = function(first, second) {
    assert(Skew.in_NodeKind.isExpression(first.kind));
    assert(Skew.in_NodeKind.isExpression(second.kind));
    return new Skew.Node(Skew.NodeKind.PAIR).appendChild(first).appendChild(second);
  };

  Skew.Node.createParameterize = function(value) {
    assert(Skew.in_NodeKind.isExpression(value.kind));
    return new Skew.Node(Skew.NodeKind.PARAMETERIZE).appendChild(value);
  };

  Skew.Node.createSequence2 = function(before, after) {
    assert(Skew.in_NodeKind.isExpression(before.kind));
    assert(Skew.in_NodeKind.isExpression(after.kind));

    if (before.kind == Skew.NodeKind.SEQUENCE) {
      if (after.kind == Skew.NodeKind.SEQUENCE) {
        return before.appendChildrenFrom(after);
      }

      return before.appendChild(after);
    }

    if (after.kind == Skew.NodeKind.SEQUENCE) {
      return after.prependChild(before);
    }

    return new Skew.Node(Skew.NodeKind.SEQUENCE).appendChild(before).appendChild(after);
  };

  Skew.Node.createTypeCheck = function(value, type) {
    assert(Skew.in_NodeKind.isExpression(value.kind));
    assert(Skew.in_NodeKind.isExpression(type.kind));
    return new Skew.Node(Skew.NodeKind.TYPE_CHECK).appendChild(value).appendChild(type);
  };

  Skew.Node.createUnary = function(kind, value) {
    assert(Skew.in_NodeKind.isUnary(kind));
    assert(Skew.in_NodeKind.isExpression(value.kind));
    return new Skew.Node(kind).appendChild(value);
  };

  Skew.Node.createBinary = function(kind, left, right) {
    assert(Skew.in_NodeKind.isBinary(kind));
    assert(Skew.in_NodeKind.isExpression(left.kind));
    assert(Skew.in_NodeKind.isExpression(right.kind));
    return new Skew.Node(kind).appendChild(left).appendChild(right);
  };

  Skew.Node.createSymbolReference = function(symbol) {
    return new Skew.Node(Skew.NodeKind.NAME).withContent(new Skew.StringContent(symbol.name)).withSymbol(symbol).withType(symbol.resolvedType);
  };

  Skew.Node.createMemberReference = function(target, member) {
    return new Skew.Node(Skew.NodeKind.DOT).withContent(new Skew.StringContent(member.name)).appendChild(target).withSymbol(member).withType(member.resolvedType);
  };

  Skew.Node.createSymbolCall = function(symbol) {
    return Skew.Node.createCall(Skew.Node.createSymbolReference(symbol)).withSymbol(symbol).withType(symbol.resolvedType.returnType);
  };

  Skew.Node.prototype.isInt = function() {
    return this.kind == Skew.NodeKind.CONSTANT && this.content.kind() == Skew.ContentKind.INT;
  };

  Skew.Node.prototype.isBool = function() {
    return this.kind == Skew.NodeKind.CONSTANT && this.content.kind() == Skew.ContentKind.BOOL;
  };

  Skew.Node.prototype.isDouble = function() {
    return this.kind == Skew.NodeKind.CONSTANT && this.content.kind() == Skew.ContentKind.DOUBLE;
  };

  Skew.Node.prototype.isString = function() {
    return this.kind == Skew.NodeKind.CONSTANT && this.content.kind() == Skew.ContentKind.STRING;
  };

  Skew.Node.prototype.asInt = function() {
    assert(this.kind == Skew.NodeKind.CONSTANT);
    return Skew.in_Content.asInt(this.content);
  };

  Skew.Node.prototype.asBool = function() {
    assert(this.kind == Skew.NodeKind.CONSTANT);
    return Skew.in_Content.asBool(this.content);
  };

  Skew.Node.prototype.asDouble = function() {
    assert(this.kind == Skew.NodeKind.CONSTANT);
    return Skew.in_Content.asDouble(this.content);
  };

  Skew.Node.prototype.asString = function() {
    assert(this.kind == Skew.NodeKind.NAME || this.kind == Skew.NodeKind.DOT || this.kind == Skew.NodeKind.CONSTANT);
    return Skew.in_Content.asString(this.content);
  };

  Skew.Node.prototype.blockStatement = function() {
    assert(this.kind == Skew.NodeKind.BLOCK);
    return this.hasOneChild() ? this._firstChild : null;
  };

  Skew.Node.prototype.firstValue = function() {
    assert(this.kind == Skew.NodeKind.PAIR);
    assert(this.childCount() == 2);
    assert(Skew.in_NodeKind.isExpression(this._firstChild.kind));
    return this._firstChild;
  };

  Skew.Node.prototype.secondValue = function() {
    assert(this.kind == Skew.NodeKind.PAIR);
    assert(this.childCount() == 2);
    assert(Skew.in_NodeKind.isExpression(this._lastChild.kind));
    return this._lastChild;
  };

  Skew.Node.prototype.dotTarget = function() {
    assert(this.kind == Skew.NodeKind.DOT);
    assert(this.childCount() <= 1);
    assert(this._firstChild == null || Skew.in_NodeKind.isExpression(this._firstChild.kind));
    return this._firstChild;
  };

  Skew.Node.prototype.annotationValue = function() {
    assert(this.kind == Skew.NodeKind.ANNOTATION);
    assert(this.childCount() == 1 || this.childCount() == 2);
    assert(Skew.in_NodeKind.isExpression(this._firstChild.kind));
    return this._firstChild;
  };

  Skew.Node.prototype.annotationTest = function() {
    assert(this.kind == Skew.NodeKind.ANNOTATION);
    assert(this.childCount() == 1 || this.childCount() == 2);
    assert(this._firstChild._nextSibling == null || Skew.in_NodeKind.isExpression(this._firstChild._nextSibling.kind));
    return this._firstChild._nextSibling;
  };

  Skew.Node.prototype.caseBlock = function() {
    assert(this.kind == Skew.NodeKind.CASE);
    assert(this.childCount() >= 1);
    assert(this._lastChild.kind == Skew.NodeKind.BLOCK);
    return this._lastChild;
  };

  Skew.Node.prototype.catchBlock = function() {
    assert(this.kind == Skew.NodeKind.CATCH);
    assert(this.childCount() == 1);
    assert(this._firstChild.kind == Skew.NodeKind.BLOCK);
    return this._firstChild;
  };

  Skew.Node.prototype.expressionValue = function() {
    assert(this.kind == Skew.NodeKind.EXPRESSION);
    assert(this.childCount() == 1);
    assert(Skew.in_NodeKind.isExpression(this._firstChild.kind));
    return this._firstChild;
  };

  Skew.Node.prototype.returnValue = function() {
    assert(this.kind == Skew.NodeKind.RETURN);
    assert(this.childCount() <= 1);
    assert(this._firstChild == null || Skew.in_NodeKind.isExpression(this._firstChild.kind));
    return this._firstChild;
  };

  Skew.Node.prototype.switchValue = function() {
    assert(this.kind == Skew.NodeKind.SWITCH);
    assert(this.childCount() >= 1);
    assert(Skew.in_NodeKind.isExpression(this._firstChild.kind));
    return this._firstChild;
  };

  Skew.Node.prototype.defaultCase = function() {
    assert(this.kind == Skew.NodeKind.SWITCH);
    assert(this.childCount() >= 1);

    // The default case is always the last one
    return !this.hasOneChild() && this._lastChild.hasOneChild() ? this._lastChild : null;
  };

  Skew.Node.prototype.parameterizeValue = function() {
    assert(this.kind == Skew.NodeKind.PARAMETERIZE);
    assert(this.childCount() >= 1);
    assert(Skew.in_NodeKind.isExpression(this._firstChild.kind));
    return this._firstChild;
  };

  Skew.Node.prototype.callValue = function() {
    assert(this.kind == Skew.NodeKind.CALL);
    assert(this.childCount() >= 1);
    assert(Skew.in_NodeKind.isExpression(this._firstChild.kind));
    return this._firstChild;
  };

  Skew.Node.prototype.castValue = function() {
    assert(this.kind == Skew.NodeKind.CAST);
    assert(this.childCount() == 2);
    assert(Skew.in_NodeKind.isExpression(this._firstChild.kind));
    return this._firstChild;
  };

  Skew.Node.prototype.castType = function() {
    assert(this.kind == Skew.NodeKind.CAST);
    assert(this.childCount() == 2);
    assert(Skew.in_NodeKind.isExpression(this._lastChild.kind));
    return this._lastChild;
  };

  Skew.Node.prototype.typeCheckValue = function() {
    assert(this.kind == Skew.NodeKind.TYPE_CHECK);
    assert(this.childCount() == 2);
    assert(Skew.in_NodeKind.isExpression(this._firstChild.kind));
    return this._firstChild;
  };

  Skew.Node.prototype.typeCheckType = function() {
    assert(this.kind == Skew.NodeKind.TYPE_CHECK);
    assert(this.childCount() == 2);
    assert(Skew.in_NodeKind.isExpression(this._lastChild.kind));
    return this._lastChild;
  };

  Skew.Node.prototype.unaryValue = function() {
    assert(Skew.in_NodeKind.isUnary(this.kind));
    assert(this.childCount() == 1);
    assert(Skew.in_NodeKind.isExpression(this._firstChild.kind));
    return this._firstChild;
  };

  Skew.Node.prototype.binaryLeft = function() {
    assert(Skew.in_NodeKind.isBinary(this.kind));
    assert(this.childCount() == 2);
    assert(Skew.in_NodeKind.isExpression(this._firstChild.kind));
    return this._firstChild;
  };

  Skew.Node.prototype.binaryRight = function() {
    assert(Skew.in_NodeKind.isBinary(this.kind));
    assert(this.childCount() == 2);
    assert(Skew.in_NodeKind.isExpression(this._lastChild.kind));
    return this._lastChild;
  };

  Skew.Node.prototype.throwValue = function() {
    assert(this.childCount() == 1);
    assert(Skew.in_NodeKind.isExpression(this._firstChild.kind));
    return this._firstChild;
  };

  Skew.Node.prototype.tryBlock = function() {
    assert(this.kind == Skew.NodeKind.TRY);
    assert(this.childCount() >= 1);
    assert(this._firstChild.kind == Skew.NodeKind.BLOCK);
    return this._firstChild;
  };

  Skew.Node.prototype.finallyBlock = function() {
    assert(this.kind == Skew.NodeKind.TRY);
    assert(this.childCount() >= 1);
    var finallyBlock = this._lastChild;
    return finallyBlock != this.tryBlock() && finallyBlock.kind == Skew.NodeKind.BLOCK ? finallyBlock : null;
  };

  Skew.Node.prototype.whileTest = function() {
    assert(this.kind == Skew.NodeKind.WHILE);
    assert(this.childCount() == 2);
    assert(Skew.in_NodeKind.isExpression(this._firstChild.kind));
    return this._firstChild;
  };

  Skew.Node.prototype.whileBlock = function() {
    assert(this.kind == Skew.NodeKind.WHILE);
    assert(this.childCount() == 2);
    assert(this._lastChild.kind == Skew.NodeKind.BLOCK);
    return this._lastChild;
  };

  Skew.Node.prototype.forSetup = function() {
    assert(this.kind == Skew.NodeKind.FOR);
    assert(this.childCount() == 4);
    assert(Skew.in_NodeKind.isExpression(this._firstChild.kind) || this._firstChild.kind == Skew.NodeKind.VARIABLES);
    return this._firstChild;
  };

  Skew.Node.prototype.forTest = function() {
    assert(this.kind == Skew.NodeKind.FOR);
    assert(this.childCount() == 4);
    assert(Skew.in_NodeKind.isExpression(this._firstChild._nextSibling.kind));
    return this._firstChild._nextSibling;
  };

  Skew.Node.prototype.forUpdate = function() {
    assert(this.kind == Skew.NodeKind.FOR);
    assert(this.childCount() == 4);
    assert(Skew.in_NodeKind.isExpression(this._lastChild._previousSibling.kind));
    return this._lastChild._previousSibling;
  };

  Skew.Node.prototype.forBlock = function() {
    assert(this.kind == Skew.NodeKind.FOR);
    assert(this.childCount() == 4);
    assert(this._lastChild.kind == Skew.NodeKind.BLOCK);
    return this._lastChild;
  };

  Skew.Node.prototype.foreachValue = function() {
    assert(this.kind == Skew.NodeKind.FOREACH);
    assert(this.childCount() == 2);
    assert(Skew.in_NodeKind.isExpression(this._firstChild.kind));
    return this._firstChild;
  };

  Skew.Node.prototype.foreachBlock = function() {
    assert(this.kind == Skew.NodeKind.FOREACH);
    assert(this.childCount() == 2);
    assert(this._lastChild.kind == Skew.NodeKind.BLOCK);
    return this._lastChild;
  };

  Skew.Node.prototype.ifTest = function() {
    assert(this.kind == Skew.NodeKind.IF);
    assert(this.childCount() == 2 || this.childCount() == 3);
    assert(Skew.in_NodeKind.isExpression(this._firstChild.kind));
    return this._firstChild;
  };

  Skew.Node.prototype.ifTrue = function() {
    assert(this.kind == Skew.NodeKind.IF);
    assert(this.childCount() == 2 || this.childCount() == 3);
    assert(this._firstChild._nextSibling.kind == Skew.NodeKind.BLOCK);
    return this._firstChild._nextSibling;
  };

  Skew.Node.prototype.ifFalse = function() {
    assert(this.kind == Skew.NodeKind.IF);
    assert(this.childCount() == 2 || this.childCount() == 3);
    assert(this._firstChild._nextSibling._nextSibling == null || this._firstChild._nextSibling._nextSibling.kind == Skew.NodeKind.BLOCK);
    return this._firstChild._nextSibling._nextSibling;
  };

  Skew.Node.prototype.hookTest = function() {
    assert(this.kind == Skew.NodeKind.HOOK);
    assert(this.childCount() == 3);
    assert(Skew.in_NodeKind.isExpression(this._firstChild.kind));
    return this._firstChild;
  };

  Skew.Node.prototype.hookTrue = function() {
    assert(this.kind == Skew.NodeKind.HOOK);
    assert(this.childCount() == 3);
    assert(Skew.in_NodeKind.isExpression(this._firstChild._nextSibling.kind));
    return this._firstChild._nextSibling;
  };

  Skew.Node.prototype.hookFalse = function() {
    assert(this.kind == Skew.NodeKind.HOOK);
    assert(this.childCount() == 3);
    assert(Skew.in_NodeKind.isExpression(this._lastChild.kind));
    return this._lastChild;
  };

  Skew.Node.prototype.indexLeft = function() {
    assert(this.kind == Skew.NodeKind.INDEX);
    assert(this.childCount() == 2);
    assert(Skew.in_NodeKind.isExpression(this._firstChild.kind));
    return this._firstChild;
  };

  Skew.Node.prototype.indexRight = function() {
    assert(this.kind == Skew.NodeKind.INDEX);
    assert(this.childCount() == 2);
    assert(Skew.in_NodeKind.isExpression(this._firstChild._nextSibling.kind));
    return this._firstChild._nextSibling;
  };

  Skew.Node.prototype.assignIndexLeft = function() {
    assert(this.kind == Skew.NodeKind.ASSIGN_INDEX);
    assert(this.childCount() == 3);
    assert(Skew.in_NodeKind.isExpression(this._firstChild.kind));
    return this._firstChild;
  };

  Skew.Node.prototype.assignIndexCenter = function() {
    assert(this.kind == Skew.NodeKind.ASSIGN_INDEX);
    assert(this.childCount() == 3);
    assert(Skew.in_NodeKind.isExpression(this._firstChild._nextSibling.kind));
    return this._firstChild._nextSibling;
  };

  Skew.Node.prototype.assignIndexRight = function() {
    assert(this.kind == Skew.NodeKind.ASSIGN_INDEX);
    assert(this.childCount() == 3);
    assert(Skew.in_NodeKind.isExpression(this._lastChild.kind));
    return this._lastChild;
  };

  Skew.Node.prototype.lambdaBlock = function() {
    assert(this.kind == Skew.NodeKind.LAMBDA);
    assert(this.childCount() == 1);
    assert(this._firstChild.kind == Skew.NodeKind.BLOCK);
    return this._firstChild;
  };

  Skew.Node.prototype.lambdaReturnType = function() {
    assert(this.kind == Skew.NodeKind.LAMBDA_TYPE);
    assert(this.childCount() >= 1);
    assert(Skew.in_NodeKind.isExpression(this._lastChild.kind));
    return this._lastChild;
  };

  Skew.OperatorInfo = function(text, precedence, associativity, kind, validArgumentCounts) {
    this.text = text;
    this.precedence = precedence;
    this.associativity = associativity;
    this.kind = kind;
    this.validArgumentCounts = validArgumentCounts;
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

    if (parent != index) {
      parent = this.find(parent);
      this.parents[index] = parent;
    }

    return parent;
  };

  Skew.SplitPath = function(directory, entry) {
    this.directory = directory;
    this.entry = entry;
  };

  Skew.PrettyPrint = {};

  Skew.PrettyPrint.joinQuoted = function(parts, trailing) {
    return Skew.PrettyPrint.join(parts.map(function(part) {
      return '"' + part + '"';
    }), trailing);
  };

  Skew.PrettyPrint.join = function(parts, trailing) {
    if (parts.length < 3) {
      return parts.join(' ' + trailing + ' ');
    }

    var text = '';

    for (var i = 0, count = parts.length; i < count; ++i) {
      if (i != 0) {
        text += ', ';

        if ((i + 1 | 0) == parts.length) {
          text += trailing + ' ';
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

    var words = text.split(' ');
    var lines = [];
    var line = '';

    // Run the word wrapping algorithm
    var i = 0;

    while (i < words.length) {
      var word = words[i];
      var lineLength = line.length;
      var wordLength = word.length;
      var estimatedLength = (lineLength + 1 | 0) + wordLength | 0;
      ++i;

      // Collapse adjacent spaces
      if (word == '') {
        continue;
      }

      // Start the line
      if (line == '') {
        while (word.length > width) {
          lines.push(word.slice(0, width));
          word = word.slice(width, word.length);
        }

        line = word;
      }

      // Continue line
      else if (estimatedLength < width) {
        line += ' ' + word;
      }

      // Continue and wrap
      else if (estimatedLength == width) {
        lines.push(line + ' ' + word);
        line = '';
      }

      // Wrap and try again
      else {
        lines.push(line);
        line = '';
        --i;
      }
    }

    // Don't add an empty trailing line unless there are no other lines
    if (line != '' || lines.length == 0) {
      lines.push(line);
    }

    return lines;
  };

  Skew.Parsing = {};

  Skew.Parsing.parseIntLiteral = function(text) {
    // Parse negative signs for use with the "--define" flag
    var isNegative = in_string.startsWith(text, '-');
    var start = isNegative | 0;
    var count = text.length;
    var value = 0;
    var base = 10;

    // Parse the base
    if ((start + 2 | 0) < count && text.charCodeAt(start) == 48) {
      var c = text.charCodeAt(start + 1 | 0);

      if (c == 98) {
        base = 2;
        start += 2;
      }

      else if (c == 111) {
        base = 8;
        start += 2;
      }

      else if (c == 120) {
        base = 16;
        start += 2;
      }
    }

    // There must be numbers after the base
    if (start == count) {
      return null;
    }

    // Special-case hexadecimal since it's more complex
    if (base == 16) {
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

    return new Box(isNegative ? -value | 0 : value);
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

      if (comments == null) {
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

      if (comments == null) {
        comments = [];
      }

      var text = range.source.contents.slice(range.start + 1 | 0, range.end);

      if (text.charCodeAt(text.length - 1 | 0) != 10) {
        text += '\n';
      }

      comments.push(text);
      return comments;
    }

    return null;
  };

  Skew.Parsing.parseAnnotations = function(context, annotations) {
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

          value = new Skew.Node(Skew.NodeKind.DOT).withContent(new Skew.StringContent(name.toString())).appendChild(value).withRange(context.spanSince(range)).withInternalRange(name);
        }

        value.content = new Skew.StringContent('@' + value.asString());
      }

      // Parse parentheses if present
      var token = context.current();

      if (context.eat(Skew.TokenKind.LEFT_PARENTHESIS)) {
        var call = Skew.Node.createCall(value);

        if (!Skew.Parsing.parseCommaSeparatedList(context, call, Skew.TokenKind.RIGHT_PARENTHESIS)) {
          return null;
        }

        value = call.withRange(context.spanSince(range)).withInternalRange(context.spanSince(token.range));
      }

      // Parse a trailing if condition
      var test = null;

      if (context.eat(Skew.TokenKind.IF)) {
        test = Skew.Parsing.expressionParser.parse(context, Skew.Precedence.LOWEST);

        if (test == null) {
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
    var variables = new Skew.Node(Skew.NodeKind.VARIABLES);
    var token = context.next();

    while (true) {
      var range = context.current().range;

      if (!context.expect(Skew.TokenKind.IDENTIFIER)) {
        return null;
      }

      var symbol = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_LOCAL, range.toString());
      symbol.range = range;

      if (token.kind == Skew.TokenKind.CONST) {
        symbol.flags |= Skew.Symbol.IS_CONST;
      }

      if (Skew.Parsing.peekType(context)) {
        symbol.type = Skew.Parsing.typeParser.parse(context, Skew.Precedence.LOWEST);

        if (symbol.type == null) {
          return null;
        }
      }

      if (context.eat(Skew.TokenKind.ASSIGN)) {
        symbol.value = Skew.Parsing.expressionParser.parse(context, Skew.Precedence.LOWEST);

        if (symbol.value == null) {
          return null;
        }
      }

      variables.appendChild(Skew.Node.createVariable(symbol).withRange(context.spanSince(range)));

      if (!context.eat(Skew.TokenKind.COMMA)) {
        break;
      }
    }

    return variables.withRange(context.spanSince(token.range));
  };

  Skew.Parsing.parseJump = function(context) {
    var token = context.next();
    return (token.kind == Skew.TokenKind.BREAK ? new Skew.Node(Skew.NodeKind.BREAK) : new Skew.Node(Skew.NodeKind.CONTINUE)).withRange(token.range);
  };

  Skew.Parsing.parseReturn = function(context) {
    var token = context.next();
    var value = null;

    if (!context.peek(Skew.TokenKind.NEWLINE) && !context.peek(Skew.TokenKind.COMMENT) && !context.peek(Skew.TokenKind.RIGHT_BRACE)) {
      value = Skew.Parsing.expressionParser.parse(context, Skew.Precedence.LOWEST);

      if (value == null) {
        return null;
      }

      Skew.Parsing.checkExtraParentheses(context, value);
    }

    return Skew.Node.createReturn(value).withRange(context.spanSince(token.range));
  };

  Skew.Parsing.parseSwitch = function(context) {
    var token = context.next();
    var value = Skew.Parsing.expressionParser.parse(context, Skew.Precedence.LOWEST);

    if (value == null) {
      return null;
    }

    Skew.Parsing.checkExtraParentheses(context, value);
    var node = Skew.Node.createSwitch(value);

    if (!context.expect(Skew.TokenKind.LEFT_BRACE)) {
      return null;
    }

    context.eat(Skew.TokenKind.NEWLINE);

    while (!context.peek(Skew.TokenKind.RIGHT_BRACE)) {
      var comments = Skew.Parsing.parseLeadingComments(context);

      // Ignore trailing comments
      if (context.peek(Skew.TokenKind.RIGHT_BRACE) || context.peek(Skew.TokenKind.END_OF_FILE)) {
        break;
      }

      // Parse a new case
      var child = new Skew.Node(Skew.NodeKind.CASE);
      var start = context.current();

      if (context.eat(Skew.TokenKind.CASE)) {
        while (true) {
          var constant = Skew.Parsing.expressionParser.parse(context, Skew.Precedence.LOWEST);

          if (constant == null) {
            return null;
          }

          Skew.Parsing.checkExtraParentheses(context, constant);
          child.appendChild(constant);

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

      if (block == null) {
        return null;
      }

      // Create the case
      child.comments = comments;
      node.appendChild(child.appendChild(block).withRange(context.spanSince(start.range)));

      // Parse trailing comments and/or newline
      comments = Skew.Parsing.parseTrailingComment(context, comments);

      if (comments != null) {
        child.comments = comments;
        context.eat(Skew.TokenKind.NEWLINE);
      }

      else if (context.peek(Skew.TokenKind.RIGHT_BRACE) || !context.expect(Skew.TokenKind.NEWLINE)) {
        break;
      }
    }

    if (!context.expect(Skew.TokenKind.RIGHT_BRACE)) {
      return null;
    }

    return node.withRange(context.spanSince(token.range));
  };

  Skew.Parsing.parseFor = function(context) {
    var token = context.next();
    var range = context.current().range;

    if (!context.expect(Skew.TokenKind.IDENTIFIER)) {
      return null;
    }

    // for a in b {}
    if (context.eat(Skew.TokenKind.IN)) {
      var symbol = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_LOCAL, range.toString());
      symbol.range = range;
      var value = Skew.Parsing.expressionParser.parse(context, Skew.Precedence.LOWEST);

      if (value == null) {
        return null;
      }

      if (context.eat(Skew.TokenKind.DOT_DOT)) {
        var second = Skew.Parsing.expressionParser.parse(context, Skew.Precedence.LOWEST);

        if (second == null) {
          return null;
        }

        value = Skew.Node.createPair(value, second).withRange(Skew.Range.span(value.range, second.range));
      }

      Skew.Parsing.checkExtraParentheses(context, value);
      var block = Skew.Parsing.parseBlock(context);

      if (block == null) {
        return null;
      }

      return Skew.Node.createForeach(symbol, value, block).withRange(context.spanSince(token.range));
    }

    // for a = 0; a < 10; a++ {}
    var setup = new Skew.Node(Skew.NodeKind.VARIABLES);
    context.undo();

    while (true) {
      var nameRange = context.current().range;

      if (!context.expect(Skew.TokenKind.IDENTIFIER)) {
        return null;
      }

      var symbol1 = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_LOCAL, nameRange.toString());
      symbol1.range = nameRange;

      if (Skew.Parsing.peekType(context)) {
        symbol1.type = Skew.Parsing.typeParser.parse(context, Skew.Precedence.LOWEST);

        if (symbol1.type == null) {
          return null;
        }
      }

      if (context.eat(Skew.TokenKind.ASSIGN)) {
        symbol1.value = Skew.Parsing.expressionParser.parse(context, Skew.Precedence.LOWEST);

        if (symbol1.value == null) {
          return null;
        }

        Skew.Parsing.checkExtraParentheses(context, symbol1.value);
      }

      setup.appendChild(Skew.Node.createVariable(symbol1).withRange(context.spanSince(nameRange)));

      if (!context.eat(Skew.TokenKind.COMMA)) {
        break;
      }
    }

    setup.range = context.spanSince(range);

    if (!context.expect(Skew.TokenKind.SEMICOLON)) {
      return null;
    }

    var test = Skew.Parsing.expressionParser.parse(context, Skew.Precedence.LOWEST);

    if (test == null) {
      return null;
    }

    if (!context.expect(Skew.TokenKind.SEMICOLON)) {
      return null;
    }

    var update = Skew.Parsing.expressionParser.parse(context, Skew.Precedence.LOWEST);

    if (update == null) {
      return null;
    }

    // This is the one place in the grammar that sequence expressions are allowed
    if (context.eat(Skew.TokenKind.COMMA)) {
      update = new Skew.Node(Skew.NodeKind.SEQUENCE).appendChild(update);

      while (true) {
        var value1 = Skew.Parsing.expressionParser.parse(context, Skew.Precedence.LOWEST);

        if (value1 == null) {
          return null;
        }

        update.appendChild(value1);

        if (!context.eat(Skew.TokenKind.COMMA)) {
          break;
        }
      }
    }

    var block1 = Skew.Parsing.parseBlock(context);

    if (block1 == null) {
      return null;
    }

    return Skew.Node.createFor(setup, test, update, block1).withRange(context.spanSince(token.range));
  };

  Skew.Parsing.parseIf = function(context) {
    var token = context.next();
    var test = Skew.Parsing.expressionParser.parse(context, Skew.Precedence.LOWEST);

    if (test == null) {
      return null;
    }

    Skew.Parsing.checkExtraParentheses(context, test);
    var trueBlock = Skew.Parsing.parseBlock(context);

    if (trueBlock == null) {
      return null;
    }

    return Skew.Node.createIf(test, trueBlock, null).withRange(context.spanSince(token.range));
  };

  Skew.Parsing.parseThrow = function(context) {
    var token = context.next();
    var value = Skew.Parsing.expressionParser.parse(context, Skew.Precedence.LOWEST);

    if (value == null) {
      return null;
    }

    Skew.Parsing.checkExtraParentheses(context, value);
    return Skew.Node.createThrow(value).withRange(context.spanSince(token.range));
  };

  Skew.Parsing.parseTry = function(context) {
    var token = context.next();
    var tryBlock = Skew.Parsing.parseBlock(context);

    if (tryBlock == null) {
      return null;
    }

    return Skew.Node.createTry(tryBlock).withRange(context.spanSince(token.range));
  };

  Skew.Parsing.parseWhile = function(context) {
    var token = context.next();
    var test = Skew.Parsing.expressionParser.parse(context, Skew.Precedence.LOWEST);

    if (test == null) {
      return null;
    }

    Skew.Parsing.checkExtraParentheses(context, test);
    var block = Skew.Parsing.parseBlock(context);

    if (block == null) {
      return null;
    }

    return new Skew.Node(Skew.NodeKind.WHILE).appendChild(test).appendChild(block).withRange(context.spanSince(token.range));
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

    var value = Skew.Parsing.expressionParser.parse(context, Skew.Precedence.LOWEST);

    if (value == null) {
      return null;
    }

    Skew.Parsing.checkExtraParentheses(context, value);
    return Skew.Node.createExpression(value).withRange(value.range);
  };

  Skew.Parsing.parseStatements = function(context, parent) {
    var previous = null;
    context.eat(Skew.TokenKind.NEWLINE);

    while (!context.peek(Skew.TokenKind.RIGHT_BRACE)) {
      var comments = Skew.Parsing.parseLeadingComments(context);

      // Ignore trailing comments
      if (context.peek(Skew.TokenKind.RIGHT_BRACE) || context.peek(Skew.TokenKind.END_OF_FILE)) {
        break;
      }

      // Merge "else" statements with the previous "if"
      if (context.peek(Skew.TokenKind.ELSE) && previous != null && previous.kind == Skew.NodeKind.IF && previous.ifFalse() == null) {
        context.next();

        // Match "else if"
        if (context.peek(Skew.TokenKind.IF)) {
          var statement = Skew.Parsing.parseIf(context);

          if (statement == null) {
            return false;
          }

          var falseBlock = new Skew.Node(Skew.NodeKind.BLOCK).withRange(statement.range).appendChild(statement);
          falseBlock.comments = comments;
          previous.appendChild(falseBlock);
          previous = statement;
        }

        // Match "else"
        else {
          var falseBlock1 = Skew.Parsing.parseBlock(context);

          if (falseBlock1 == null) {
            return false;
          }

          falseBlock1.comments = comments;
          previous.appendChild(falseBlock1);
          previous = falseBlock1;
        }
      }

      // Merge "catch" statements with the previous "try"
      else if (context.peek(Skew.TokenKind.CATCH) && previous != null && previous.kind == Skew.NodeKind.TRY && previous.finallyBlock() == null) {
        var catchToken = context.next();
        var symbol = null;
        var nameRange = context.current().range;

        // Optional typed variable
        if (context.eat(Skew.TokenKind.IDENTIFIER)) {
          symbol = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_LOCAL, nameRange.toString());
          symbol.range = nameRange;
          symbol.type = Skew.Parsing.typeParser.parse(context, Skew.Precedence.LOWEST);

          if (symbol.type == null) {
            return false;
          }
        }

        // Manditory catch block
        var catchBlock = Skew.Parsing.parseBlock(context);

        if (catchBlock == null) {
          return false;
        }

        var child = Skew.Node.createCatch(symbol, catchBlock).withRange(context.spanSince(catchToken.range));
        child.comments = comments;
        previous.appendChild(child);
      }

      // Merge "finally" statements with the previous "try"
      else if (context.peek(Skew.TokenKind.FINALLY) && previous != null && previous.kind == Skew.NodeKind.TRY && previous.finallyBlock() == null) {
        context.next();
        var finallyBlock = Skew.Parsing.parseBlock(context);

        if (finallyBlock == null) {
          return false;
        }

        finallyBlock.comments = comments;
        previous.appendChild(finallyBlock);
      }

      // Parse a new statement
      else {
        var statement1 = Skew.Parsing.parseStatement(context);

        if (statement1 == null) {
          break;
        }

        previous = statement1;
        statement1.comments = comments;
        parent.appendChild(statement1);
      }

      // Parse trailing comments and/or newline
      comments = Skew.Parsing.parseTrailingComment(context, comments);

      if (comments != null) {
        if (previous != null) {
          previous.comments = comments;
        }

        context.eat(Skew.TokenKind.NEWLINE);
      }

      else if (context.peek(Skew.TokenKind.RIGHT_BRACE) || !context.peek(Skew.TokenKind.ELSE) && !context.peek(Skew.TokenKind.CATCH) && !context.peek(Skew.TokenKind.FINALLY) && !context.expect(Skew.TokenKind.NEWLINE)) {
        break;
      }
    }

    return true;
  };

  Skew.Parsing.parseBlock = function(context) {
    context.skipWhitespace();
    var token = context.current();

    if (!context.expect(Skew.TokenKind.LEFT_BRACE)) {
      return null;
    }

    var block = new Skew.Node(Skew.NodeKind.BLOCK);

    if (!Skew.Parsing.parseStatements(context, block) || !context.expect(Skew.TokenKind.RIGHT_BRACE)) {
      return null;
    }

    return block.withRange(context.spanSince(token.range));
  };

  Skew.Parsing.peekType = function(context) {
    return context.peek(Skew.TokenKind.IDENTIFIER) || context.peek(Skew.TokenKind.DYNAMIC);
  };

  Skew.Parsing.parseFunctionBlock = function(context, symbol) {
    // "=> x" is the same as "{ return x }"
    if (symbol.kind == Skew.SymbolKind.FUNCTION_LOCAL) {
      if (!context.expect(Skew.TokenKind.ARROW)) {
        return false;
      }

      if (context.peek(Skew.TokenKind.LEFT_BRACE)) {
        symbol.block = Skew.Parsing.parseBlock(context);

        if (symbol.block == null) {
          return false;
        }
      }

      else {
        var value = Skew.Parsing.expressionParser.parse(context, Skew.Precedence.LOWEST);

        if (value == null) {
          return false;
        }

        symbol.block = new Skew.Node(Skew.NodeKind.BLOCK).withRange(value.range).appendChild(Skew.Node.createReturn(value).withRange(value.range).withFlags(Skew.Node.IS_IMPLICIT_RETURN));
      }
    }

    // Parse function body if present
    else if (context.peek(Skew.TokenKind.LEFT_BRACE)) {
      symbol.block = Skew.Parsing.parseBlock(context);

      if (symbol.block == null) {
        return false;
      }
    }

    return true;
  };

  Skew.Parsing.parseFunctionArguments = function(context, symbol) {
    var usingTypes = false;

    while (!context.eat(Skew.TokenKind.RIGHT_PARENTHESIS)) {
      if (!(symbol.$arguments.length == 0) && !context.expect(Skew.TokenKind.COMMA)) {
        return false;
      }

      context.skipWhitespace();
      var range = context.current().range;

      if (!context.expect(Skew.TokenKind.IDENTIFIER)) {
        return false;
      }

      var arg = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_ARGUMENT, range.toString());
      arg.range = range;

      // Parse argument type
      if (symbol.kind != Skew.SymbolKind.FUNCTION_LOCAL || (symbol.$arguments.length == 0 ? Skew.Parsing.peekType(context) : usingTypes)) {
        arg.type = Skew.Parsing.typeParser.parse(context, Skew.Precedence.LOWEST);

        if (arg.type == null) {
          return false;
        }

        usingTypes = true;
      }

      // Parse default value
      if (context.eat(Skew.TokenKind.ASSIGN)) {
        arg.value = Skew.Parsing.expressionParser.parse(context, Skew.Precedence.LOWEST);

        if (arg.value == null) {
          return false;
        }
      }

      symbol.$arguments.push(arg);
    }

    return true;
  };

  Skew.Parsing.parseFunctionReturnTypeAndBlock = function(context, symbol) {
    if (Skew.Parsing.peekType(context)) {
      symbol.returnType = Skew.Parsing.typeParser.parse(context, Skew.Precedence.LOWEST);
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
      test = Skew.Parsing.expressionParser.parse(context, Skew.Precedence.LOWEST);

      if (test == null) {
        return null;
      }
    }

    if (!context.expect(Skew.TokenKind.LEFT_BRACE)) {
      return null;
    }

    var contents = new Skew.ObjectSymbol(parent.kind, '<conditional>');
    contents.parent = parent;
    Skew.Parsing.parseSymbols(context, contents, annotations);

    if (!context.expect(Skew.TokenKind.RIGHT_BRACE) || !context.peek(Skew.TokenKind.ELSE) && !Skew.Parsing.parseAfterBlock(context)) {
      return null;
    }

    var elseGuard = null;

    if (context.eat(Skew.TokenKind.ELSE)) {
      elseGuard = Skew.Parsing.recursiveParseGuard(context, parent, annotations);

      if (elseGuard == null) {
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

      if (guard == null) {
        return false;
      }

      if (parent.guards == null) {
        parent.guards = [];
      }

      parent.guards.push(guard);
      return true;
    }

    // Parse annotations before the symbol declaration
    if (context.peek(Skew.TokenKind.ANNOTATION)) {
      annotations = Skew.Parsing.parseAnnotations(context, annotations != null ? annotations.slice() : []);

      if (annotations == null) {
        return false;
      }

      // Parse an annotation block
      if (context.eat(Skew.TokenKind.LEFT_BRACE)) {
        Skew.Parsing.parseSymbols(context, parent, annotations);
        return context.expect(Skew.TokenKind.RIGHT_BRACE) && Skew.Parsing.parseAfterBlock(context);
      }
    }

    var token = context.current();
    var symbol = null;

    // Special-case enum symbols
    if (parent.kind == Skew.SymbolKind.OBJECT_ENUM && token.kind == Skew.TokenKind.IDENTIFIER) {
      var variable = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_ENUM, token.range.toString());
      variable.range = token.range;
      variable.parent = parent;
      variable.flags |= Skew.Symbol.IS_CONST;
      parent.variables.push(variable);
      symbol = variable;
      context.next();
    }

    else {
      // Parse the symbol kind
      var kind = 0;

      switch (token.kind) {
        case Skew.TokenKind.CLASS: {
          kind = Skew.SymbolKind.OBJECT_CLASS;
          break;
        }

        case Skew.TokenKind.CONST:
        case Skew.TokenKind.VAR: {
          kind = Skew.in_SymbolKind.hasInstances(parent.kind) ? Skew.SymbolKind.VARIABLE_INSTANCE : Skew.SymbolKind.VARIABLE_GLOBAL;
          break;
        }

        case Skew.TokenKind.DEF:
        case Skew.TokenKind.OVER: {
          kind = Skew.in_SymbolKind.hasInstances(parent.kind) ? Skew.SymbolKind.FUNCTION_INSTANCE : Skew.SymbolKind.FUNCTION_GLOBAL;
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

        case Skew.TokenKind.IDENTIFIER: {
          if (token.range.toString() == 'type') {
            kind = Skew.SymbolKind.OBJECT_WRAPPED;
          }

          else {
            context.unexpectedToken();
            return false;
          }
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
      var isOperator = kind == Skew.SymbolKind.FUNCTION_INSTANCE && nameToken.kind in Skew.Parsing.operatorOverloadTokenKinds;

      if (isOperator) {
        context.next();
      }

      else if (kind == Skew.SymbolKind.FUNCTION_GLOBAL && context.eat(Skew.TokenKind.ANNOTATION)) {
        kind = Skew.SymbolKind.FUNCTION_ANNOTATION;
      }

      else if (context.eat(Skew.TokenKind.LIST_NEW) || context.eat(Skew.TokenKind.SET_NEW)) {
        if (kind == Skew.SymbolKind.FUNCTION_INSTANCE) {
          kind = Skew.SymbolKind.FUNCTION_CONSTRUCTOR;
        }
      }

      else {
        if (!context.expect(Skew.TokenKind.IDENTIFIER)) {
          return false;
        }

        if (kind == Skew.SymbolKind.FUNCTION_INSTANCE && name == 'new') {
          kind = Skew.SymbolKind.FUNCTION_CONSTRUCTOR;
        }
      }

      // Parse shorthand nested namespace declarations
      if (Skew.in_SymbolKind.isObject(kind)) {
        while (context.eat(Skew.TokenKind.DOT)) {
          var nextToken = context.current();

          if (!context.expect(Skew.TokenKind.IDENTIFIER)) {
            return false;
          }

          // Wrap this declaration in a namespace
          var nextParent = new Skew.ObjectSymbol(Skew.SymbolKind.OBJECT_NAMESPACE, name);
          nextParent.range = range;
          nextParent.parent = parent;
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
          variable1.parent = parent;

          if (token.kind == Skew.TokenKind.CONST) {
            variable1.flags |= Skew.Symbol.IS_CONST;
          }

          if (Skew.Parsing.peekType(context)) {
            variable1.type = Skew.Parsing.typeParser.parse(context, Skew.Precedence.LOWEST);

            if (variable1.type == null) {
              return false;
            }
          }

          if (context.eat(Skew.TokenKind.ASSIGN)) {
            variable1.value = Skew.Parsing.expressionParser.parse(context, Skew.Precedence.LOWEST);

            if (variable1.value == null) {
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
          $function.parent = parent;

          if (token.kind == Skew.TokenKind.OVER) {
            $function.flags |= Skew.Symbol.IS_OVER;
          }

          // Check for setters like "def foo=(x int) {}" but don't allow a space
          // between the name and the assignment operator
          if (kind != Skew.SymbolKind.FUNCTION_ANNOTATION && nameToken.kind == Skew.TokenKind.IDENTIFIER && context.peek(Skew.TokenKind.ASSIGN) && context.current().range.start == nameToken.range.end) {
            $function.range = Skew.Range.span($function.range, context.next().range);
            $function.flags |= Skew.Symbol.IS_SETTER;
            $function.name += '=';
          }

          // Parse type parameters
          if (context.eat(Skew.TokenKind.START_PARAMETER_LIST)) {
            $function.parameters = Skew.Parsing.parseTypeParameters(context, Skew.SymbolKind.PARAMETER_FUNCTION);

            if ($function.parameters == null) {
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
            if ($function.$arguments.length == 0) {
              context.log.syntaxErrorEmptyFunctionParentheses(context.spanSince(before.range));
            }
          }

          if (kind != Skew.SymbolKind.FUNCTION_ANNOTATION && !Skew.Parsing.parseFunctionReturnTypeAndBlock(context, $function)) {
            return false;
          }

          // Don't mark operators as getters to avoid confusion with unary operators and compiler-generated call expressions
          if (!isOperator && $function.$arguments.length == 0) {
            $function.flags |= Skew.Symbol.IS_GETTER;
          }

          parent.functions.push($function);
          symbol = $function;
          break;
        }

        case Skew.SymbolKind.OBJECT_CLASS:
        case Skew.SymbolKind.OBJECT_ENUM:
        case Skew.SymbolKind.OBJECT_INTERFACE:
        case Skew.SymbolKind.OBJECT_NAMESPACE:
        case Skew.SymbolKind.OBJECT_WRAPPED: {
          var object = new Skew.ObjectSymbol(kind, name);
          object.range = range;
          object.parent = parent;

          if (kind != Skew.SymbolKind.OBJECT_NAMESPACE && context.eat(Skew.TokenKind.START_PARAMETER_LIST)) {
            object.parameters = Skew.Parsing.parseTypeParameters(context, Skew.SymbolKind.PARAMETER_OBJECT);

            if (object.parameters == null) {
              return false;
            }
          }

          // Allow "type Foo = int"
          if (kind == Skew.SymbolKind.OBJECT_WRAPPED && context.eat(Skew.TokenKind.ASSIGN)) {
            object.$extends = Skew.Parsing.typeParser.parse(context, Skew.Precedence.LOWEST);

            if (object.$extends == null) {
              return false;
            }
          }

          // Regular block structure "type Foo : int {}"
          else {
            // Base class
            if (context.eat(Skew.TokenKind.COLON)) {
              object.$extends = Skew.Parsing.typeParser.parse(context, Skew.Precedence.LOWEST);

              if (object.$extends == null) {
                return false;
              }
            }

            // Interfaces
            if (context.eat(Skew.TokenKind.DOUBLE_COLON)) {
              object.implements = [];

              while (true) {
                var type = Skew.Parsing.typeParser.parse(context, Skew.Precedence.LOWEST);

                if (type == null) {
                  return false;
                }

                object.implements.push(type);

                if (!context.eat(Skew.TokenKind.COMMA)) {
                  break;
                }
              }
            }

            if (!context.expect(Skew.TokenKind.LEFT_BRACE)) {
              return false;
            }

            Skew.Parsing.parseSymbols(context, object, null);

            if (!context.expect(Skew.TokenKind.RIGHT_BRACE)) {
              return false;
            }
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

      // Forbid certain kinds of symbols inside enums and wrapped types
      if ((parent.kind == Skew.SymbolKind.OBJECT_ENUM || parent.kind == Skew.SymbolKind.OBJECT_WRAPPED || parent.kind == Skew.SymbolKind.OBJECT_INTERFACE) && (kind == Skew.SymbolKind.FUNCTION_CONSTRUCTOR || kind == Skew.SymbolKind.VARIABLE_INSTANCE)) {
        context.log.syntaxErrorBadDeclarationInsideType(context.spanSince(token.range));
      }
    }

    symbol.annotations = annotations != null ? annotations.slice() : null;
    symbol.comments = comments;
    comments = Skew.Parsing.parseTrailingComment(context, comments);

    if (comments != null) {
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

  Skew.Parsing.parseCommaSeparatedList = function(context, parent, stop) {
    var isFirst = true;
    context.skipWhitespace();

    while (!context.eat(stop)) {
      if (!isFirst && !context.expect(Skew.TokenKind.COMMA)) {
        return false;
      }

      var value = Skew.Parsing.expressionParser.parse(context, Skew.Precedence.LOWEST);

      if (value == null) {
        return false;
      }

      parent.appendChild(value);
      isFirst = false;
    }

    return true;
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
    assert(text.charCodeAt(0) == 34 || text.charCodeAt(0) == 39);
    assert(text.charCodeAt(text.length - 1 | 0) == text.charCodeAt(0));
    var builder = new StringBuilder();

    // Append long runs of unescaped characters using a single slice for speed
    var start = 1;
    var i = 1;

    while ((i + 1 | 0) < text.length) {
      var c = text.charCodeAt(i);
      ++i;

      if (c == 92) {
        var escape = i - 1 | 0;
        builder.append(text.slice(start, escape));

        if ((i + 1 | 0) < text.length) {
          c = text.charCodeAt(i);
          ++i;

          if (c == 110) {
            builder.append('\n');
            start = i;
          }

          else if (c == 114) {
            builder.append('\r');
            start = i;
          }

          else if (c == 116) {
            builder.append('\t');
            start = i;
          }

          else if (c == 101) {
            builder.append('\x1B');
            start = i;
          }

          else if (c == 48) {
            builder.append('\0');
            start = i;
          }

          else if (c == 92 || c == 34 || c == 39) {
            builder.append(String.fromCharCode(c));
            start = i;
          }

          else if (c == 120) {
            if ((i + 1 | 0) < text.length) {
              var c0 = Skew.Parsing.parseHexCharacter(text.charCodeAt(i));
              ++i;

              if ((i + 1 | 0) < text.length) {
                var c1 = Skew.Parsing.parseHexCharacter(text.charCodeAt(i));
                ++i;

                if (c0 != -1 && c1 != -1) {
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
      if (kind == Skew.NodeKind.ASSIGN && left.kind == Skew.NodeKind.INDEX) {
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

      if (codePoint == -1 || iterator.nextCodePoint() != -1) {
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
    pratt.infix(Skew.TokenKind.UNSIGNED_SHIFT_RIGHT, Skew.Precedence.SHIFT, Skew.Parsing.binaryInfix(Skew.NodeKind.UNSIGNED_SHIFT_RIGHT));
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
    pratt.infixRight(Skew.TokenKind.ASSIGN_UNSIGNED_SHIFT_RIGHT, Skew.Precedence.ASSIGN, Skew.Parsing.binaryInfix(Skew.NodeKind.ASSIGN_UNSIGNED_SHIFT_RIGHT));
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
      var symbol = new Skew.FunctionSymbol(Skew.SymbolKind.FUNCTION_LOCAL, '<lambda>');

      if (!Skew.Parsing.parseFunctionBlock(context, symbol)) {
        return null;
      }

      symbol.range = context.spanSince(token.range);
      return Skew.Node.createLambda(symbol).withRange(symbol.range);
    };

    // Cast expressions
    pratt.parselet(Skew.TokenKind.AS, Skew.Precedence.UNARY_PREFIX).infix = function(context, left) {
      var token = context.next();
      var type = Skew.Parsing.typeParser.parse(context, Skew.Precedence.LOWEST);

      if (type == null) {
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

      return new Skew.Node(Skew.NodeKind.DOT).withContent(new Skew.StringContent(range.toString())).appendChild(null).withRange(context.spanSince(token.range)).withInternalRange(range);
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

      return new Skew.Node(Skew.NodeKind.DOT).withContent(new Skew.StringContent(range.toString())).appendChild(new Skew.Node(Skew.NodeKind.TYPE).withType(Skew.Type.DYNAMIC)).withRange(context.spanSince(token.range)).withInternalRange(range);
    };

    // Name expressions and lambda expressions like "x => x * x"
    pratt.parselet(Skew.TokenKind.IDENTIFIER, Skew.Precedence.LOWEST).prefix = function(context) {
      var range = context.next().range;
      var name = range.toString();

      if (context.peek(Skew.TokenKind.ARROW)) {
        var symbol = new Skew.FunctionSymbol(Skew.SymbolKind.FUNCTION_LOCAL, '<lambda>');
        var argument = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_ARGUMENT, name);
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

    // Type check expressions
    pratt.parselet(Skew.TokenKind.IS, Skew.Precedence.COMPARE).infix = function(context, left) {
      var token = context.next();
      var type = Skew.Parsing.typeParser.parse(context, Skew.Precedence.LOWEST);

      if (type == null) {
        return null;
      }

      return Skew.Node.createTypeCheck(left, type).withRange(context.spanSince(left.range)).withInternalRange(token.range);
    };

    // Index expressions
    pratt.parselet(Skew.TokenKind.LEFT_BRACKET, Skew.Precedence.MEMBER).infix = function(context, left) {
      var token = context.next();
      var right = Skew.Parsing.expressionParser.parse(context, Skew.Precedence.LOWEST);

      if (right == null || !context.expect(Skew.TokenKind.RIGHT_BRACKET)) {
        return null;
      }

      return Skew.Node.createIndex(left, right).withRange(context.spanSince(left.range)).withInternalRange(context.spanSince(token.range));
    };

    // Parenthetic groups and lambda expressions like "() => x"
    pratt.parselet(Skew.TokenKind.LEFT_PARENTHESIS, Skew.Precedence.LOWEST).prefix = function(context) {
      var token = context.next();

      // Try to parse a group
      if (!context.peek(Skew.TokenKind.RIGHT_PARENTHESIS)) {
        var value = pratt.parse(context, Skew.Precedence.LOWEST);

        if (value == null) {
          return null;
        }

        if ((value.kind != Skew.NodeKind.NAME || !Skew.Parsing.peekType(context)) && context.eat(Skew.TokenKind.RIGHT_PARENTHESIS)) {
          if (value.kind != Skew.NodeKind.NAME || !context.peek(Skew.TokenKind.ARROW)) {
            return value.withRange(context.spanSince(token.range)).withFlags(Skew.Node.IS_INSIDE_PARENTHESES);
          }

          context.undo();
        }

        context.undo();
      }

      // Parse a lambda instead
      var symbol = new Skew.FunctionSymbol(Skew.SymbolKind.FUNCTION_LOCAL, '<lambda>');

      if (!Skew.Parsing.parseFunctionArguments(context, symbol) || !Skew.Parsing.parseFunctionReturnTypeAndBlock(context, symbol)) {
        return null;
      }

      symbol.range = context.spanSince(token.range);
      return Skew.Node.createLambda(symbol).withRange(symbol.range);
    };

    // Call expressions
    pratt.parselet(Skew.TokenKind.LEFT_PARENTHESIS, Skew.Precedence.UNARY_POSTFIX).infix = function(context, left) {
      var node = Skew.Node.createCall(left);
      var token = context.next();

      if (!Skew.Parsing.parseCommaSeparatedList(context, node, Skew.TokenKind.RIGHT_PARENTHESIS)) {
        return null;
      }

      return node.withRange(context.spanSince(left.range)).withInternalRange(context.spanSince(token.range));
    };

    // Hook expressions
    pratt.parselet(Skew.TokenKind.QUESTION_MARK, Skew.Precedence.ASSIGN).infix = function(context, left) {
      context.next();
      var middle = pratt.parse(context, Skew.Precedence.ASSIGN - 1 | 0);

      if (middle == null || !context.expect(Skew.TokenKind.COLON)) {
        return null;
      }

      var right = pratt.parse(context, Skew.Precedence.ASSIGN - 1 | 0);

      if (right == null) {
        return null;
      }

      return Skew.Node.createHook(left, middle, right).withRange(context.spanSince(left.range));
    };
    return pratt;
  };

  Skew.Parsing.createTypeParser = function() {
    var pratt = new Skew.Pratt();
    pratt.literal(Skew.TokenKind.DYNAMIC, function(context, token) {
      return new Skew.Node(Skew.NodeKind.TYPE).withType(Skew.Type.DYNAMIC).withRange(token.range);
    });
    pratt.parselet(Skew.TokenKind.DOT, Skew.Precedence.MEMBER).infix = Skew.Parsing.dotInfixParselet;
    pratt.parselet(Skew.TokenKind.START_PARAMETER_LIST, Skew.Precedence.MEMBER).infix = Skew.Parsing.parameterizedParselet;

    // Name expressions or lambda type expressions like "fn(int) int"
    pratt.parselet(Skew.TokenKind.IDENTIFIER, Skew.Precedence.LOWEST).prefix = function(context) {
      var node = new Skew.Node(Skew.NodeKind.LAMBDA_TYPE).appendChild(new Skew.Node(Skew.NodeKind.TYPE).withType(null));
      var returnType = node.lambdaReturnType();
      var token = context.next();
      var name = token.range.toString();
      var isFirst = true;

      if (name != 'fn' || !context.eat(Skew.TokenKind.LEFT_PARENTHESIS)) {
        return new Skew.Node(Skew.NodeKind.NAME).withContent(new Skew.StringContent(name)).withRange(token.range);
      }

      // Parse argument types
      while (!context.eat(Skew.TokenKind.RIGHT_PARENTHESIS)) {
        if (!isFirst && !context.expect(Skew.TokenKind.COMMA)) {
          return null;
        }

        var type = Skew.Parsing.typeParser.parse(context, Skew.Precedence.LOWEST);

        if (type == null) {
          return null;
        }

        node.insertChildBefore(returnType, type);
        isFirst = false;
      }

      // Parse return type if present
      if (Skew.Parsing.peekType(context)) {
        var type1 = Skew.Parsing.typeParser.parse(context, Skew.Precedence.LOWEST);

        if (type1 == null) {
          return null;
        }

        returnType.replaceWith(type1);
      }

      return node.withRange(context.spanSince(token.range));
    };
    return pratt;
  };

  Skew.Parsing.parseFile = function(log, tokens, global) {
    if (Skew.Parsing.expressionParser == null) {
      Skew.Parsing.expressionParser = Skew.Parsing.createExpressionParser();
    }

    if (Skew.Parsing.typeParser == null) {
      Skew.Parsing.typeParser = Skew.Parsing.createTypeParser();
    }

    var context = new Skew.ParserContext(log, tokens);
    Skew.Parsing.parseSymbols(context, global, null);
    context.expect(Skew.TokenKind.END_OF_FILE);
  };

  Skew.Parsing.intLiteral = function(context, token) {
    return new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.IntContent(Skew.Parsing.parseIntLiteral(token.range.toString()).value)).withRange(token.range);
  };

  Skew.Parsing.stringLiteral = function(context, token) {
    return new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.StringContent(Skew.Parsing.parseStringLiteral(context.log, token.range))).withRange(token.range);
  };

  Skew.SymbolKind = {
    PARAMETER_FUNCTION: 0,
    PARAMETER_OBJECT: 1,
    OBJECT_CLASS: 2,
    OBJECT_ENUM: 3,
    OBJECT_GLOBAL: 4,
    OBJECT_INTERFACE: 5,
    OBJECT_NAMESPACE: 6,
    OBJECT_WRAPPED: 7,
    FUNCTION_ANNOTATION: 8,
    FUNCTION_CONSTRUCTOR: 9,
    FUNCTION_GLOBAL: 10,
    FUNCTION_INSTANCE: 11,
    FUNCTION_LOCAL: 12,
    OVERLOADED_ANNOTATION: 13,
    OVERLOADED_GLOBAL: 14,
    OVERLOADED_INSTANCE: 15,
    VARIABLE_ARGUMENT: 16,
    VARIABLE_ENUM: 17,
    VARIABLE_GLOBAL: 18,
    VARIABLE_INSTANCE: 19,
    VARIABLE_LOCAL: 20
  };

  Skew.SymbolState = {
    UNINITIALIZED: 0,
    INITIALIZING: 1,
    INITIALIZED: 2
  };

  Skew.Symbol = function(kind, name) {
    this.id = Skew.Symbol._createID();
    this.kind = kind;
    this.name = name;
    this.rename = null;
    this.range = null;
    this.parent = null;
    this.resolvedType = null;
    this.scope = null;
    this.state = Skew.SymbolState.UNINITIALIZED;
    this.annotations = null;
    this.comments = null;
    this.forwardTo = null;
    this.flags = 0;
  };

  // Flags
  Skew.Symbol.prototype.isAutomaticallyGenerated = function() {
    return (this.flags & Skew.Symbol.IS_AUTOMATICALLY_GENERATED) != 0;
  };

  Skew.Symbol.prototype.isConst = function() {
    return (this.flags & Skew.Symbol.IS_CONST) != 0;
  };

  Skew.Symbol.prototype.isGetter = function() {
    return (this.flags & Skew.Symbol.IS_GETTER) != 0;
  };

  Skew.Symbol.prototype.isLoopVariable = function() {
    return (this.flags & Skew.Symbol.IS_LOOP_VARIABLE) != 0;
  };

  Skew.Symbol.prototype.isOver = function() {
    return (this.flags & Skew.Symbol.IS_OVER) != 0;
  };

  Skew.Symbol.prototype.isSetter = function() {
    return (this.flags & Skew.Symbol.IS_SETTER) != 0;
  };

  Skew.Symbol.prototype.isValueType = function() {
    return (this.flags & Skew.Symbol.IS_VALUE_TYPE) != 0;
  };

  Skew.Symbol.prototype.shouldInferReturnType = function() {
    return (this.flags & Skew.Symbol.SHOULD_INFER_RETURN_TYPE) != 0;
  };

  // Modifiers
  Skew.Symbol.prototype.isDeprecated = function() {
    return (this.flags & Skew.Symbol.IS_DEPRECATED) != 0;
  };

  Skew.Symbol.prototype.isEntryPoint = function() {
    return (this.flags & Skew.Symbol.IS_ENTRY_POINT) != 0;
  };

  Skew.Symbol.prototype.isExported = function() {
    return (this.flags & Skew.Symbol.IS_EXPORTED) != 0;
  };

  Skew.Symbol.prototype.isImported = function() {
    return (this.flags & Skew.Symbol.IS_IMPORTED) != 0;
  };

  Skew.Symbol.prototype.isInliningDisabled = function() {
    return (this.flags & Skew.Symbol.IS_INLINING_DISABLED) != 0;
  };

  Skew.Symbol.prototype.isPreferred = function() {
    return (this.flags & Skew.Symbol.IS_PREFERRED) != 0;
  };

  Skew.Symbol.prototype.isProtected = function() {
    return (this.flags & Skew.Symbol.IS_PROTECTED) != 0;
  };

  Skew.Symbol.prototype.isRenamed = function() {
    return (this.flags & Skew.Symbol.IS_RENAMED) != 0;
  };

  Skew.Symbol.prototype.isSkipped = function() {
    return (this.flags & Skew.Symbol.IS_SKIPPED) != 0;
  };

  Skew.Symbol.prototype.shouldSpread = function() {
    return (this.flags & Skew.Symbol.SHOULD_SPREAD) != 0;
  };

  // Pass-specific flags
  Skew.Symbol.prototype.isObsolete = function() {
    return (this.flags & Skew.Symbol.IS_OBSOLETE) != 0;
  };

  Skew.Symbol.prototype.isPrimaryConstructor = function() {
    return (this.flags & Skew.Symbol.IS_PRIMARY_CONSTRUCTOR) != 0;
  };

  Skew.Symbol.prototype.isVirtual = function() {
    return (this.flags & Skew.Symbol.IS_VIRTUAL) != 0;
  };

  // Combinations
  Skew.Symbol.prototype.isImportedOrExported = function() {
    return (this.flags & (Skew.Symbol.IS_IMPORTED | Skew.Symbol.IS_EXPORTED)) != 0;
  };

  Skew.Symbol.prototype.asParameterSymbol = function() {
    assert(Skew.in_SymbolKind.isParameter(this.kind));
    return this;
  };

  Skew.Symbol.prototype.asObjectSymbol = function() {
    assert(Skew.in_SymbolKind.isObject(this.kind));
    return this;
  };

  Skew.Symbol.prototype.asFunctionSymbol = function() {
    assert(Skew.in_SymbolKind.isFunction(this.kind));
    return this;
  };

  Skew.Symbol.prototype.asOverloadedFunctionSymbol = function() {
    assert(Skew.in_SymbolKind.isOverloadedFunction(this.kind));
    return this;
  };

  Skew.Symbol.prototype.asVariableSymbol = function() {
    assert(Skew.in_SymbolKind.isVariable(this.kind));
    return this;
  };

  Skew.Symbol.prototype.fullName = function() {
    if (this.parent != null && this.parent.kind != Skew.SymbolKind.OBJECT_GLOBAL && !Skew.in_SymbolKind.isParameter(this.kind)) {
      return this.parent.fullName() + '.' + this.name;
    }

    return this.name;
  };

  Skew.Symbol.prototype.forwarded = function() {
    var symbol = this;

    while (symbol.forwardTo != null) {
      symbol = symbol.forwardTo;
    }

    return symbol;
  };

  Skew.Symbol.prototype.spreadingAnnotations = function() {
    var result = null;

    if (this.annotations != null) {
      for (var i = 0, list = this.annotations, count = list.length; i < count; ++i) {
        var annotation = list[i];

        if (annotation.symbol != null && annotation.symbol.shouldSpread()) {
          if (result == null) {
            result = [];
          }

          result.push(annotation);
        }
      }
    }

    return result;
  };

  Skew.Symbol.prototype.mergeAnnotationsAndCommentsFrom = function(symbol) {
    if (this.annotations == null) {
      this.annotations = symbol.annotations;
    }

    else if (symbol.annotations != null) {
      in_List.append1(this.annotations, symbol.annotations);
    }

    if (this.comments == null) {
      this.comments = symbol.comments;
    }

    else if (symbol.comments != null) {
      in_List.append1(this.comments, symbol.comments);
    }
  };

  Skew.Symbol._createID = function() {
    ++Skew.Symbol._nextID;
    return Skew.Symbol._nextID;
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
    this.$extends = null;
    this.implements = null;
    this.baseType = null;
    this.baseClass = null;
    this.interfaceTypes = null;
    this.wrappedType = null;
    this.members = Object.create(null);
    this.objects = [];
    this.functions = [];
    this.variables = [];
    this.parameters = null;
    this.guards = null;
    this.hasCheckedInterfacesAndAbstractStatus = false;
    this.isAbstractBecauseOf = null;
  };

  __extends(Skew.ObjectSymbol, Skew.Symbol);

  Skew.ObjectSymbol.prototype.isAbstract = function() {
    return this.isAbstractBecauseOf != null;
  };

  Skew.ObjectSymbol.prototype.hasBaseClass = function(symbol) {
    return this.baseClass != null && (this.baseClass == symbol || this.baseClass.hasBaseClass(symbol));
  };

  Skew.ObjectSymbol.prototype.isSameOrHasBaseClass = function(symbol) {
    return this == symbol || this.hasBaseClass(symbol);
  };

  Skew.FunctionSymbol = function(kind, name) {
    Skew.Symbol.call(this, kind, name);
    this.overridden = null;
    this.overloaded = null;
    this.implementations = null;
    this.parameters = null;
    this.$arguments = [];
    this.$this = null;
    this.argumentOnlyType = null;
    this.returnType = null;
    this.block = null;
    this.namingGroup = -1;
  };

  __extends(Skew.FunctionSymbol, Skew.Symbol);

  Skew.VariableSymbol = function(kind, name) {
    Skew.Symbol.call(this, kind, name);
    this.type = null;
    this.value = null;
  };

  __extends(Skew.VariableSymbol, Skew.Symbol);

  Skew.VariableSymbol.prototype.enumValue = function() {
    assert(this.kind == Skew.SymbolKind.VARIABLE_ENUM);
    return this.value.asInt();
  };

  Skew.OverloadedFunctionSymbol = function(kind, name, symbols) {
    Skew.Symbol.call(this, kind, name);
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
    ASSIGN_UNSIGNED_SHIFT_RIGHT: 16,
    BITWISE_AND: 17,
    BITWISE_OR: 18,
    BITWISE_XOR: 19,
    BREAK: 20,
    CASE: 21,
    CATCH: 22,
    CHARACTER: 23,
    CLASS: 24,
    COLON: 25,
    COMMA: 26,
    COMMENT: 27,
    COMPARE: 28,
    CONST: 29,
    CONTINUE: 30,
    DECREMENT: 31,
    DEF: 32,
    DEFAULT: 33,
    DIVIDE: 34,
    DOT: 35,
    DOT_DOT: 36,
    DOUBLE: 37,
    DOUBLE_COLON: 38,
    DYNAMIC: 39,
    ELSE: 40,
    END_OF_FILE: 41,
    ENUM: 42,
    EQUAL: 43,
    ERROR: 44,
    FALSE: 45,
    FINALLY: 46,
    FOR: 47,
    GREATER_THAN: 48,
    GREATER_THAN_OR_EQUAL: 49,
    IDENTIFIER: 50,
    IF: 51,
    IN: 52,
    INCREMENT: 53,
    INDEX: 54,
    INT: 55,
    INTERFACE: 56,
    INT_BINARY: 57,
    INT_HEX: 58,
    INT_OCTAL: 59,
    IS: 60,
    LEFT_BRACE: 61,
    LEFT_BRACKET: 62,
    LEFT_PARENTHESIS: 63,
    LESS_THAN: 64,
    LESS_THAN_OR_EQUAL: 65,
    LIST: 66,
    LIST_NEW: 67,
    LOGICAL_AND: 68,
    LOGICAL_OR: 69,
    MINUS: 70,
    MULTIPLY: 71,
    NAMESPACE: 72,
    NEWLINE: 73,
    NOT: 74,
    NOT_EQUAL: 75,
    NULL: 76,
    OVER: 77,
    PLUS: 78,
    POWER: 79,
    QUESTION_MARK: 80,
    REMAINDER: 81,
    RETURN: 82,
    RIGHT_BRACE: 83,
    RIGHT_BRACKET: 84,
    RIGHT_PARENTHESIS: 85,
    SEMICOLON: 86,
    SET: 87,
    SET_NEW: 88,
    SHIFT_LEFT: 89,
    SHIFT_RIGHT: 90,
    STRING: 91,
    SUPER: 92,
    SWITCH: 93,
    THROW: 94,
    TILDE: 95,
    TRUE: 96,
    TRY: 97,
    UNSIGNED_SHIFT_RIGHT: 98,
    VAR: 99,
    WHILE: 100,
    WHITESPACE: 101,
    YY_INVALID_ACTION: 102,

    // Token kinds not used by flex
    START_PARAMETER_LIST: 103,
    END_PARAMETER_LIST: 104
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
    this.noteText = '';
  };

  Skew.Log = function() {
    this.diagnostics = [];
    this.warningCount = 0;
    this.errorCount = 0;
  };

  Skew.Log.prototype.hasErrors = function() {
    return this.errorCount != 0;
  };

  Skew.Log.prototype.hasWarnings = function() {
    return this.warningCount != 0;
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
    this.error(range, 'Invalid escape sequence');
  };

  Skew.Log.prototype.syntaxErrorInvalidCharacter = function(range) {
    this.error(range, 'Invalid character literal');
  };

  Skew.Log.prototype.syntaxErrorExtraData = function(range, text) {
    this.error(range, 'Syntax error "' + text + '"');
  };

  Skew.Log.prototype.syntaxErrorUnexpectedToken = function(token) {
    this.error(token.range, 'Unexpected ' + Skew.in_TokenKind._strings[token.kind]);
  };

  Skew.Log.prototype.syntaxErrorExpectedToken = function(range, found, expected) {
    this.error(range, 'Expected ' + Skew.in_TokenKind._strings[expected] + ' but found ' + Skew.in_TokenKind._strings[found]);
  };

  Skew.Log.prototype.syntaxErrorEmptyFunctionParentheses = function(range) {
    this.error(range, 'Functions without arguments do not use parentheses');
  };

  Skew.Log.prototype.semanticErrorComparisonOperatorNotInt = function(range) {
    this.error(range, 'The comparison operator must have a return type of "int"');
  };

  Skew.Log.prototype.syntaxErrorBadDeclarationInsideType = function(range) {
    this.error(range, 'Cannot use this declaration here');
  };

  Skew.Log._expectedCountText = function(singular, expected, found) {
    return 'Expected ' + expected.toString() + ' ' + singular + (expected == 1 ? '' : 's') + ' but found ' + found.toString() + ' ' + singular + (found == 1 ? '' : 's');
  };

  Skew.Log._formatArgumentTypes = function(types) {
    if (types == null) {
      return '';
    }

    var names = [];

    for (var i = 0, list = types, count = list.length; i < count; ++i) {
      var type = list[i];
      names.push(type.toString());
    }

    return ' of type' + (types.length == 1 ? '' : 's') + ' ' + Skew.PrettyPrint.join(names, 'and');
  };

  Skew.Log.prototype.semanticWarningExtraParentheses = function(range) {
    this.warning(range, 'Unnecessary parentheses');
  };

  Skew.Log.prototype.semanticWarningUnusedExpression = function(range) {
    this.warning(range, 'Unused expression');
  };

  Skew.Log.prototype.semanticErrorDuplicateSymbol = function(range, name, previous) {
    this.error(range, '"' + name + '" is already declared');

    if (previous != null) {
      this.note(previous, 'The previous declaration is here');
    }
  };

  Skew.Log.prototype.semanticErrorShadowedSymbol = function(range, name, previous) {
    this.error(range, '"' + name + '" shadows a previous declaration');

    if (previous != null) {
      this.note(previous, 'The previous declaration is here');
    }
  };

  Skew.Log.prototype.semanticErrorDuplicateTypeParameters = function(range, name, previous) {
    this.error(range, '"' + name + '" already has type parameters');

    if (previous != null) {
      this.note(previous, 'Type parameters were previously declared here');
    }
  };

  Skew.Log.prototype.semanticErrorDuplicateBaseType = function(range, name, previous) {
    this.error(range, '"' + name + '" already has a base type');

    if (previous != null) {
      this.note(previous, 'The previous base type is here');
    }
  };

  Skew.Log.prototype.semanticErrorCyclicDeclaration = function(range, name) {
    this.error(range, 'Cyclic declaration of "' + name + '"');
  };

  Skew.Log.prototype.semanticErrorUndeclaredSymbol = function(range, name) {
    this.error(range, '"' + name + '" is not declared');
  };

  Skew.Log.prototype.semanticErrorUnknownMemberSymbol = function(range, name, type) {
    this.error(range, '"' + name + '" is not declared on type "' + type.toString() + '"');
  };

  Skew.Log.prototype.semanticErrorVarMissingType = function(range, name) {
    this.error(range, 'Unable to determine the type of "' + name + '"');
  };

  Skew.Log.prototype.semanticErrorVarMissingValue = function(range, name) {
    this.error(range, 'The implicitly typed variable "' + name + '" must be initialized');
  };

  Skew.Log.prototype.semanticErrorConstMissingValue = function(range, name) {
    this.error(range, 'The constant "' + name + '" must be initialized');
  };

  Skew.Log.prototype.semanticErrorInvalidCall = function(range, type) {
    this.error(range, 'Cannot call value of type "' + type.toString() + '"');
  };

  Skew.Log.prototype.semanticErrorCannotParameterize = function(range, type) {
    this.error(range, 'Cannot parameterize "' + type.toString() + (type.isParameterized() ? '" because it is already parameterized' : '" because it has no type parameters'));
  };

  Skew.Log.prototype.semanticErrorParameterCount = function(range, expected, found) {
    this.error(range, Skew.Log._expectedCountText('type parameter', expected, found));
  };

  Skew.Log.prototype.semanticErrorArgumentCount = function(range, expected, found, name, $function) {
    this.error(range, Skew.Log._expectedCountText('argument', expected, found) + (name != null ? ' when calling "' + name + '"' : ''));

    if ($function != null) {
      this.note($function, 'The function declaration is here');
    }
  };

  Skew.Log.prototype.semanticErrorGetterRequiresWrap = function(range, name, $function) {
    this.error(range, 'Wrap calls to the function "' + name + '" in parentheses to call the returned lambda');

    if ($function != null) {
      this.note($function, 'The function declaration is here');
    }
  };

  Skew.Log.prototype.semanticErrorGetterCalledTwice = function(range, name, $function) {
    this.error(range, 'Cannot call the value returned from the function "' + name + '" (this function was called automatically because it takes no arguments)');

    if ($function != null) {
      this.note($function, 'The function declaration is here');
    }
  };

  Skew.Log.prototype.semanticErrorUseOfVoidFunction = function(range, name, $function) {
    this.error(range, 'The function "' + name + '" does not return a value');

    if ($function != null) {
      this.note($function, 'The function declaration is here');
    }
  };

  Skew.Log.prototype.semanticErrorUseOfVoidLambda = function(range) {
    this.error(range, 'This call does not return a value');
  };

  Skew.Log.prototype.semanticErrorBadImplicitVariableType = function(range, type) {
    this.error(range, 'Implicitly typed variables cannot be of type "' + type.toString() + '"');
  };

  Skew.Log.prototype.semanticErrorNoDefaultValue = function(range, type) {
    this.error(range, 'Cannot construct a default value of type "' + type.toString() + '"');
  };

  Skew.Log.prototype.semanticErrorMemberUnexpectedGlobal = function(range, name) {
    this.error(range, 'Cannot access global member "' + name + '" from an instance context');
  };

  Skew.Log.prototype.semanticErrorMemberUnexpectedInstance = function(range, name) {
    this.error(range, 'Cannot access instance member "' + name + '" from a global context');
  };

  Skew.Log.prototype.semanticErrorMemberUnexpectedTypeParameter = function(range, name) {
    this.error(range, 'Cannot access type parameter "' + name + '" here');
  };

  Skew.Log.prototype.semanticErrorConstructorReturnType = function(range) {
    this.error(range, 'Constructors cannot have a return type');
  };

  Skew.Log.prototype.semanticErrorNoMatchingOverload = function(range, name, count, types) {
    this.error(range, 'No overload of "' + name + '" was found that takes ' + count.toString() + ' argument' + (count == 1 ? '' : 's') + Skew.Log._formatArgumentTypes(types));
  };

  Skew.Log.prototype.semanticErrorAmbiguousOverload = function(range, name, count, types) {
    this.error(range, 'Multiple matching overloads of "' + name + '" were found that can take ' + count.toString() + ' argument' + (count == 1 ? '' : 's') + Skew.Log._formatArgumentTypes(types));
  };

  Skew.Log.prototype.semanticErrorUnexpectedExpression = function(range, type) {
    this.error(range, 'Unexpected expression of type "' + type.toString() + '"');
  };

  Skew.Log.prototype.semanticErrorUnexpectedType = function(range, type) {
    this.error(range, 'Unexpected type "' + type.toString() + '"');
  };

  Skew.Log.prototype.semanticErrorIncompatibleTypes = function(range, from, to, isCastAllowed) {
    this.error(range, 'Cannot convert from type "' + from.toString() + '" to type "' + to.toString() + '"' + (isCastAllowed ? ' without a cast' : ''));
  };

  Skew.Log.prototype.semanticErrorInvalidDefine1 = function(range, value, type, name) {
    this.error(range, 'Cannot convert "' + value + '" to type "' + type.toString() + '" for variable "' + name + '"');
  };

  Skew.Log.prototype.semanticWarningExtraCast = function(range, from, to) {
    this.warning(range, 'Unnecessary cast from type "' + from.toString() + '" to type "' + to.toString() + '"');
  };

  Skew.Log.prototype.semanticWarningExtraTypeCheck = function(range, from, to) {
    this.warning(range, 'Unnecessary type check, type "' + from.toString() + '" is always type "' + to.toString() + '"');
  };

  Skew.Log.prototype.semanticWarningBadTypeCheck = function(range, type) {
    this.error(range, 'Cannot check against interface type "' + type.toString() + '"');
  };

  Skew.Log.prototype.semanticErrorWrongArgumentCount = function(range, name, count) {
    this.error(range, 'Expected "' + name + '" to take ' + count.toString() + ' argument' + (count == 1 ? '' : 's'));
  };

  Skew.Log.prototype.semanticErrorWrongArgumentCountRange = function(range, name, values) {
    assert(!(values.length == 0));
    var first = values[0];
    var count = values.length;

    if (count == 1) {
      this.semanticErrorWrongArgumentCount(range, name, first);
    }

    else {
      var counts = [];
      var min = first;
      var max = first;

      for (var i = 0, list = values, count1 = list.length; i < count1; ++i) {
        var value = list[i];
        min = Math.min(min, value);
        max = Math.max(max, value);
        counts.push(value.toString());
      }

      // Assuming values are unique, this means all values form a continuous range
      if (((max - min | 0) + 1 | 0) == count) {
        if (min == 0) {
          this.error(range, 'Expected "' + name + '" to take at most ' + max.toString() + ' argument' + (max == 1 ? '' : 's'));
        }

        else {
          this.error(range, 'Expected "' + name + '" to take between ' + min.toString() + ' and ' + max.toString() + ' arguments');
        }
      }

      // Otherwise, the values are disjoint
      else {
        this.error(range, 'Expected "' + name + '" to take either ' + Skew.PrettyPrint.join(counts, 'or') + ' arguments');
      }
    }
  };

  Skew.Log.prototype.semanticErrorExpectedList = function(range, name, type) {
    this.error(range, 'Expected argument "' + name + '" to be of type "List<T>" instead of type "' + type.toString() + '"');
  };

  Skew.Log.prototype.semanticErrorUnexpectedReturnValue = function(range) {
    this.error(range, 'Cannot return a value inside a function without a return type');
  };

  Skew.Log.prototype.semanticErrorBadReturnType = function(range, type) {
    this.error(range, 'Cannot create a function with a return type of "' + type.toString() + '"');
  };

  Skew.Log.prototype.semanticErrorExpectedReturnValue = function(range, type) {
    this.error(range, 'Must return a value of type "' + type.toString() + '"');
  };

  Skew.Log.prototype.semanticErrorMissingReturn = function(range, name, type) {
    this.error(range, 'All control paths for "' + name + '" must return a value of type "' + type.toString() + '"');
  };

  Skew.Log.prototype.semanticErrorBadStorage = function(range) {
    this.error(range, 'Cannot store to this location');
  };

  Skew.Log.prototype.semanticErrorStorageToConstSymbol = function(range, name) {
    this.error(range, 'Cannot store to constant symbol "' + name + '"');
  };

  Skew.Log.prototype.semanticErrorAccessViolation = function(range, name) {
    this.error(range, 'Cannot access protected symbol "' + name + '" here');
  };

  Skew.Log.prototype.semanticWarningDeprecatedUsage = function(range, name) {
    this.warning(range, 'Use of deprecated symbol "' + name + '"');
  };

  Skew.Log.prototype.semanticErrorUnparameterizedType = function(range, type) {
    this.error(range, 'Cannot use unparameterized type "' + type.toString() + '" here');
  };

  Skew.Log.prototype.semanticErrorParameterizedType = function(range, type) {
    this.error(range, 'Cannot use parameterized type "' + type.toString() + '" here');
  };

  Skew.Log.prototype.semanticErrorNoCommonType = function(range, left, right) {
    this.error(range, 'No common type for "' + left.toString() + '" and "' + right.toString() + '"');
  };

  Skew.Log.prototype.semanticErrorInvalidAnnotation = function(range, annotation, name) {
    this.error(range, 'Cannot use the annotation "' + annotation + '" on "' + name + '"');
  };

  Skew.Log.prototype.semanticErrorDuplicateAnnotation = function(range, annotation, name) {
    this.error(range, 'Duplicate annotation "' + annotation + '" on "' + name + '"');
  };

  Skew.Log.prototype.semanticErrorBadForValue = function(range, type) {
    this.error(range, 'Cannot iterate over type "' + type.toString() + '"');
  };

  Skew.Log.prototype.semanticWarningEmptyRange = function(range) {
    this.warning(range, 'This range is empty');
  };

  Skew.Log.prototype.semanticErrorMissingDotContext = function(range, name) {
    this.error(range, 'Cannot access "' + name + '" without type context');
  };

  Skew.Log.prototype.semanticErrorInitializerTypeInferenceFailed = function(range) {
    this.error(range, 'Cannot infer a type for this literal');
  };

  Skew.Log.prototype.semanticErrorDuplicateOverload = function(range, name, previous) {
    this.error(range, 'Duplicate overloaded function "' + name + '"');

    if (previous != null) {
      this.note(previous, 'The previous declaration is here');
    }
  };

  Skew.Log.prototype.semanticErrorInvalidExtends = function(range, type) {
    this.error(range, 'Cannot extend type "' + type.toString() + '"');
  };

  Skew.Log.prototype.semanticErrorInvalidImplements = function(range, type) {
    this.error(range, 'Cannot implement type "' + type.toString() + '"');
  };

  Skew.Log.prototype.semanticErrorDuplicateImplements = function(range, type, previous) {
    this.error(range, 'Duplicate implemented type "' + type.toString() + '"');

    if (previous != null) {
      this.note(previous, 'The first occurrence is here');
    }
  };

  Skew.Log.prototype.semanticErrorBadInterfaceImplementation = function(range, classType, interfaceType, name, reason) {
    this.error(range, 'Type "' + classType.toString() + '" is missing an implementation of function "' + name + '" from interface "' + interfaceType.toString() + '"');

    if (reason != null) {
      this.note(reason, 'The function declaration is here');
    }
  };

  Skew.Log.prototype.semanticErrorBadInterfaceImplementationReturnType = function(range, name, interfaceType, reason) {
    this.error(range, 'Function "' + name + '" has a different return type than the function with the same name and argument types from interface "' + interfaceType.toString() + '"');

    if (reason != null) {
      this.note(reason, 'The function declaration is here');
    }
  };

  Skew.Log.prototype.semanticErrorBadOverride = function(range, name, base, overridden) {
    this.error(range, '"' + name + '" overrides another declaration with the same name in base type "' + base.toString() + '"');

    if (overridden != null) {
      this.note(overridden, 'The overridden declaration is here');
    }
  };

  Skew.Log.prototype.semanticErrorBadOverrideReturnType = function(range, name, base, overridden) {
    this.error(range, '"' + name + '" overrides another function with the same name and argument types but a different return type in base type "' + base.toString() + '"');

    if (overridden != null) {
      this.note(overridden, 'The overridden function is here');
    }
  };

  Skew.Log.prototype.semanticErrorModifierMissingOverride = function(range, name, overridden) {
    this.error(range, '"' + name + '" overrides another symbol with the same name but is declared using "def" instead of "over"');

    if (overridden != null) {
      this.note(overridden, 'The overridden declaration is here');
    }
  };

  Skew.Log.prototype.semanticErrorModifierUnusedOverride = function(range, name) {
    this.error(range, '"' + name + '" is declared using "over" instead of "def" but does not override anything');
  };

  Skew.Log.prototype.semanticErrorBadSuper = function(range) {
    this.error(range, 'Cannot use "super" here');
  };

  Skew.Log.prototype.semanticErrorBadJump = function(range, name) {
    this.error(range, 'Cannot use "' + name + '" outside a loop');
  };

  Skew.Log.prototype.semanticErrorMustCallFunction = function(range, name) {
    this.error(range, 'The function "' + name + '" must be called');
  };

  Skew.Log.prototype.semanticErrorDuplicateEntryPoint = function(range, previous) {
    this.error(range, 'Multiple entry points are declared');
    this.note(previous, 'The first entry point is here');
  };

  Skew.Log.prototype.semanticErrorInvalidEntryPointArguments = function(range, name) {
    this.error(range, 'Entry point "' + name + '" must take either no arguments or one argument of type "List<string>"');
  };

  Skew.Log.prototype.semanticErrorInvalidEntryPointReturnType = function(range, name) {
    this.error(range, 'Entry point "' + name + '" must return either nothing or a value of type "int"');
  };

  Skew.Log.prototype.semanticErrorInvalidDefine2 = function(range, name) {
    this.error(range, 'Could not find a variable named "' + name + '" to override');
  };

  Skew.Log.prototype.semanticErrorExpectedConstant = function(range) {
    this.error(range, 'This value must be a compile-time constant');
  };

  Skew.Log.prototype.semanticWarningUnreadLocalVariable = function(range, name) {
    this.warning(range, 'Local variable "' + name + '" is never read');
  };

  Skew.Log.prototype.semanticErrorAbstractNew = function(range, type, reason, name) {
    this.error(range, 'Cannot construct abstract type "' + type.toString() + '"');

    if (reason != null) {
      this.note(reason, 'The type "' + type.toString() + '" is abstract due to member "' + name + '"');
    }
  };

  Skew.Log.prototype.semanticErrorDefaultCaseNotLast = function(range) {
    this.error(range, 'The default case in a switch statement must come last');
  };

  Skew.Log.prototype.semanticErrorForLoopDifferentType = function(range, name, found, expected) {
    this.error(range, 'Expected loop variable "' + name + '" to be of type "' + expected.toString() + '" instead of type "' + found.toString() + '"');
  };

  Skew.Log.prototype.semanticErrorDuplicateCase = function(range, previous) {
    this.error(range, 'Duplicate case value');

    if (previous != null) {
      this.note(previous, 'The first occurrence is here');
    }
  };

  Skew.Log.prototype.semanticErrorMissingWrappedType = function(range, name) {
    this.error(range, 'Missing base type for wrapped type "' + name + '"');
  };

  Skew.Log.prototype.semanticErrorDuplicateRename = function(range, name, optionA, optionB) {
    this.error(range, 'Cannot rename "' + name + '" to both "' + optionA + '" and "' + optionB + '"');
  };

  Skew.Log.prototype.semanticErrorMissingSuper = function(range) {
    this.error(range, 'Constructors for derived types must start with a call to "super"');
  };

  Skew.Log.prototype.commandLineErrorExpectedDefineValue = function(range, name) {
    this.error(range, 'Use "--define:' + name + '=___" to provide a value');
  };

  Skew.Log.prototype.commandLineErrorMissingOutput = function(range, first, second) {
    this.error(range, 'Specify the output location using either "' + first + '" or "' + second + '"');
  };

  Skew.Log.prototype.commandLineErrorDuplicateOutput = function(range, first, second) {
    this.error(range, 'Cannot specify both "' + first + '" and "' + second + '"');
  };

  Skew.Log.prototype.commandLineErrorUnreadableFile = function(range, name) {
    this.error(range, 'Could not read from "' + name + '"');
  };

  Skew.Log.prototype.commandLineErrorUnwritableFile = function(range, name) {
    this.error(range, 'Could not write to "' + name + '"');
  };

  Skew.Log.prototype.commandLineErrorNoInputFiles = function(range) {
    this.error(range, 'Missing input files');
  };

  Skew.Log.prototype.commandLineErrorMissingTarget = function(range) {
    this.error(range, 'Specify the target format using "--target"');
  };

  Skew.Log.prototype.commandLineErrorInvalidEnum = function(range, name, found, expected) {
    this.error(range, 'Invalid ' + name + ' "' + found + '", must be either ' + Skew.PrettyPrint.joinQuoted(expected, 'or'));
  };

  Skew.Log.prototype.commandLineWarningDuplicateFlagValue = function(range, name, previous) {
    this.warning(range, 'Multiple values are specified for "' + name + '", using the later value');

    if (previous != null) {
      this.note(previous, 'Ignoring the previous value');
    }
  };

  Skew.Log.prototype.commandLineErrorBadFlag = function(range, name) {
    this.error(range, 'Unknown command line flag "' + name + '"');
  };

  Skew.Log.prototype.commandLineErrorMissingValue = function(range, text) {
    this.error(range, 'Use "' + text + '" to provide a value');
  };

  Skew.Log.prototype.commandLineErrorExpectedToken = function(range, expected, found, text) {
    this.error(range, 'Expected "' + expected + '" but found "' + found + '" in "' + text + '"');
  };

  Skew.Log.prototype.commandLineErrorNonBooleanValue = function(range, value, text) {
    this.error(range, 'Expected "true" or "false" but found "' + value + '" in "' + text + '"');
  };

  Skew.Log.prototype.commandLineErrorNonIntegerValue = function(range, value, text) {
    this.error(range, 'Expected integer constant but found "' + value + '" in "' + text + '"');
  };

  Skew.ParserContext = function(log, _tokens) {
    this.log = log;
    this.inNonVoidFunction = false;
    this._tokens = _tokens;
    this._index = 0;
    this._previousSyntaxError = null;
  };

  Skew.ParserContext.prototype.current = function() {
    return this._tokens[this._index];
  };

  Skew.ParserContext.prototype.next = function() {
    var token = this.current();

    if ((this._index + 1 | 0) < this._tokens.length) {
      ++this._index;
    }

    return token;
  };

  Skew.ParserContext.prototype.spanSince = function(range) {
    var previous = this._tokens[this._index > 0 ? this._index - 1 | 0 : 0];
    return previous.range.end < range.start ? range : Skew.Range.span(range, previous.range);
  };

  Skew.ParserContext.prototype.peek = function(kind) {
    return this.current().kind == kind;
  };

  Skew.ParserContext.prototype.eat = function(kind) {
    if (this.peek(kind)) {
      this.next();
      return true;
    }

    return false;
  };

  Skew.ParserContext.prototype.skipWhitespace = function() {
    while (this.eat(Skew.TokenKind.COMMENT) || this.eat(Skew.TokenKind.NEWLINE)) {
    }
  };

  Skew.ParserContext.prototype.undo = function() {
    assert(this._index > 0);
    --this._index;
  };

  Skew.ParserContext.prototype.expect = function(kind) {
    if (!this.eat(kind)) {
      var token = this.current();

      if (this._previousSyntaxError != token) {
        var range = token.range;
        this.log.syntaxErrorExpectedToken(range, token.kind, kind);
        this._previousSyntaxError = token;
      }

      return false;
    }

    return true;
  };

  Skew.ParserContext.prototype.unexpectedToken = function() {
    var token = this.current();

    if (this._previousSyntaxError != token) {
      this.log.syntaxErrorUnexpectedToken(token);
      this._previousSyntaxError = token;
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
    this._table = {};
  };

  Skew.Pratt.prototype.parselet = function(kind, precedence) {
    var parselet = in_IntMap.get(this._table, kind, null);

    if (parselet == null) {
      var created = new Skew.Parselet(precedence);
      parselet = created;
      this._table[kind] = created;
    }

    else if (precedence > parselet.precedence) {
      parselet.precedence = precedence;
    }

    return parselet;
  };

  Skew.Pratt.prototype.parse = function(context, precedence) {
    context.skipWhitespace();
    var token = context.current();
    var parselet = in_IntMap.get(this._table, token.kind, null);

    if (parselet == null || parselet.prefix == null) {
      context.unexpectedToken();
      return null;
    }

    var node = this.resume(context, precedence, parselet.prefix(context));

    // Parselets must set the range of every node
    assert(node == null || node.range != null);
    return node;
  };

  Skew.Pratt.prototype.resume = function(context, precedence, left) {
    while (left != null) {
      var kind = context.current().kind;
      var parselet = in_IntMap.get(this._table, kind, null);

      if (parselet == null || parselet.infix == null || parselet.precedence <= precedence) {
        break;
      }

      left = parselet.infix(context, left);

      // Parselets must set the range of every node
      assert(left == null || left.range != null);
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
      return value != null ? callback(context, token, value) : null;
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
      return right != null ? callback(context, left, token, right) : null;
    };
  };

  Skew.Pratt.prototype.infixRight = function(kind, precedence, callback) {
    var self = this;
    self.parselet(kind, precedence).infix = function(context, left) {
      var token = context.next();

      // Subtract 1 for right-associativity
      var right = self.parse(context, precedence - 1 | 0);
      return right != null ? callback(context, left, token, right) : null;
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
    return this.source.name + ':' + (location.line + 1 | 0).toString() + ':' + (location.column + 1 | 0).toString();
  };

  Skew.Range.prototype.format = function(maxLength) {
    assert(this.source != null);
    var start = this.source.indexToLineColumn(this.start);
    var end = this.source.indexToLineColumn(this.end);
    var line = this.source.contentsOfLine(start.line);
    var startColumn = start.column;
    var endColumn = end.line == start.line ? end.column : line.length;

    // Use a unicode iterator to count the actual code points so they don't get sliced through the middle
    var iterator = Unicode.StringIterator.INSTANCE.reset(line, 0);
    var codePoints = [];
    var a = 0;
    var b = 0;

    // Expand tabs into spaces
    while (true) {
      if (iterator.index == startColumn) {
        a = codePoints.length;
      }

      if (iterator.index == endColumn) {
        b = codePoints.length;
      }

      var codePoint = iterator.nextCodePoint();

      if (codePoint < 0) {
        break;
      }

      if (codePoint == 9) {
        for (var space = 0, count1 = 8 - codePoints.length % 8 | 0; space < count1; ++space) {
          codePoints.push(32);
        }
      }

      else {
        codePoints.push(codePoint);
      }
    }

    // Ensure the line length doesn't exceed maxLength
    var count = codePoints.length;

    if (maxLength > 0 && count > maxLength) {
      var centeredWidth = Math.min(b - a | 0, maxLength / 2 | 0);
      var centeredStart = Math.max((maxLength - centeredWidth | 0) / 2 | 0, 3);

      // Left aligned
      if (a < centeredStart) {
        line = in_string.fromCodePoints(codePoints.slice(0, maxLength - 3 | 0)) + '...';

        if (b > (maxLength - 3 | 0)) {
          b = maxLength - 3 | 0;
        }
      }

      // Right aligned
      else if ((count - a | 0) < (maxLength - centeredStart | 0)) {
        var offset = count - maxLength | 0;
        line = '...' + in_string.fromCodePoints(codePoints.slice(offset + 3 | 0, count));
        a -= offset;
        b -= offset;
      }

      // Center aligned
      else {
        var offset1 = a - centeredStart | 0;
        line = '...' + in_string.fromCodePoints(codePoints.slice(offset1 + 3 | 0, (offset1 + maxLength | 0) - 3 | 0)) + '...';
        a -= offset1;
        b -= offset1;

        if (b > (maxLength - 3 | 0)) {
          b = maxLength - 3 | 0;
        }
      }
    }

    else {
      line = in_string.fromCodePoints(codePoints);
    }

    return new Skew.FormattedRange(line, in_string.repeat(' ', a) + ((b - a | 0) < 2 ? '^' : in_string.repeat('~', b - a | 0)));
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
    assert(start.source == end.source);
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
    this._lineOffsets = null;
  };

  Skew.Source.prototype.entireRange = function() {
    return new Skew.Range(this, 0, this.contents.length);
  };

  Skew.Source.prototype.lineCount = function() {
    this._computeLineOffsets();

    // Ignore the line offset at 0
    return this._lineOffsets.length - 1 | 0;
  };

  Skew.Source.prototype.contentsOfLine = function(line) {
    this._computeLineOffsets();

    if (line < 0 || line >= this._lineOffsets.length) {
      return '';
    }

    var start = this._lineOffsets[line];
    var end = (line + 1 | 0) < this._lineOffsets.length ? this._lineOffsets[line + 1 | 0] - 1 | 0 : this.contents.length;
    return this.contents.slice(start, end);
  };

  Skew.Source.prototype.indexToLineColumn = function(index) {
    this._computeLineOffsets();

    // Binary search to find the line
    var count = this._lineOffsets.length;
    var line = 0;

    while (count > 0) {
      var step = count / 2 | 0;
      var i = line + step | 0;

      if (this._lineOffsets[i] <= index) {
        line = i + 1 | 0;
        count = (count - step | 0) - 1 | 0;
      }

      else {
        count = step;
      }
    }

    // Use the line to compute the column
    var column = line > 0 ? index - this._lineOffsets[line - 1 | 0] | 0 : index;
    return new Skew.LineColumn(line - 1 | 0, column);
  };

  Skew.Source.prototype._computeLineOffsets = function() {
    if (this._lineOffsets == null) {
      this._lineOffsets = [0];

      for (var i = 0, count = this.contents.length; i < count; ++i) {
        if (this.contents.charCodeAt(i) == 10) {
          this._lineOffsets.push(i + 1 | 0);
        }
      }
    }
  };

  Skew.Token = function(range, kind) {
    this.range = range;
    this.kind = kind;
  };

  Skew.Token.prototype.firstCodeUnit = function() {
    if (this.kind == Skew.TokenKind.END_OF_FILE) {
      return 0;
    }

    assert(this.range.start < this.range.source.contents.length);
    return this.range.source.contents.charCodeAt(this.range.start);
  };

  Skew.CallSite = function(callNode, enclosingSymbol) {
    this.callNode = callNode;
    this.enclosingSymbol = enclosingSymbol;
  };

  Skew.CallInfo = function(symbol) {
    this.symbol = symbol;
    this.callSites = [];
  };

  Skew.CallGraph = function(global) {
    this.callInfo = [];
    this.symbolToInfoIndex = {};
    this._visitObject(global);
  };

  Skew.CallGraph.prototype.callInfoForSymbol = function(symbol) {
    assert(symbol.id in this.symbolToInfoIndex);
    return this.callInfo[this.symbolToInfoIndex[symbol.id]];
  };

  Skew.CallGraph.prototype._visitObject = function(symbol) {
    for (var i = 0, list = symbol.objects, count = list.length; i < count; ++i) {
      var object = list[i];
      this._visitObject(object);
    }

    for (var i1 = 0, list1 = symbol.functions, count1 = list1.length; i1 < count1; ++i1) {
      var $function = list1[i1];
      this._recordCallSite($function, null, null);
      this._visitNode($function.block, $function);
    }

    for (var i2 = 0, list2 = symbol.variables, count2 = list2.length; i2 < count2; ++i2) {
      var variable = list2[i2];
      this._visitNode(variable.value, variable);
    }
  };

  Skew.CallGraph.prototype._visitNode = function(node, context) {
    if (node != null) {
      for (var child = node.firstChild(); child != null; child = child.nextSibling()) {
        this._visitNode(child, context);
      }

      if (node.kind == Skew.NodeKind.CALL && node.symbol != null) {
        assert(Skew.in_SymbolKind.isFunction(node.symbol.kind));
        this._recordCallSite(node.symbol.forwarded().asFunctionSymbol(), node, context);
      }
    }
  };

  Skew.CallGraph.prototype._recordCallSite = function(symbol, node, context) {
    var index = in_IntMap.get(this.symbolToInfoIndex, symbol.id, -1);
    var info = index < 0 ? new Skew.CallInfo(symbol) : this.callInfo[index];

    if (index < 0) {
      this.symbolToInfoIndex[symbol.id] = this.callInfo.length;
      this.callInfo.push(info);
    }

    if (node != null) {
      info.callSites.push(new Skew.CallSite(node, context));
    }
  };

  Skew.CompilerTarget = function() {
  };

  Skew.CompilerTarget.prototype.runPostResolvePasses = function() {
    return false;
  };

  Skew.CompilerTarget.prototype.allowAbstractConstruction = function() {
    return false;
  };

  Skew.CompilerTarget.prototype.requiresIntegerSwitchStatements = function() {
    return false;
  };

  Skew.CompilerTarget.prototype.supportsListForeach = function() {
    return false;
  };

  Skew.CompilerTarget.prototype.supportsNestedTypes = function() {
    return false;
  };

  Skew.CompilerTarget.prototype.needsLambdaLifting = function() {
    return false;
  };

  Skew.CompilerTarget.prototype.removeSingletonInterfaces = function() {
    return false;
  };

  Skew.CompilerTarget.prototype.stringEncoding = function() {
    return Unicode.Encoding.UTF32;
  };

  Skew.CompilerTarget.prototype.editOptions = function(options) {
  };

  Skew.CompilerTarget.prototype.includeSources = function(sources) {
  };

  Skew.CompilerTarget.prototype.createEmitter = function(context) {
    return null;
  };

  Skew.LispTreeTarget = function() {
    Skew.CompilerTarget.call(this);
  };

  __extends(Skew.LispTreeTarget, Skew.CompilerTarget);

  Skew.LispTreeTarget.prototype.runPostResolvePasses = function() {
    return false;
  };

  Skew.LispTreeTarget.prototype.createEmitter = function(context) {
    return new Skew.LispTreeEmitter(context.options);
  };

  Skew.JavaScriptTarget = function() {
    Skew.CompilerTarget.call(this);
  };

  __extends(Skew.JavaScriptTarget, Skew.CompilerTarget);

  Skew.JavaScriptTarget.prototype.runPostResolvePasses = function() {
    return true;
  };

  Skew.JavaScriptTarget.prototype.supportsNestedTypes = function() {
    return true;
  };

  Skew.JavaScriptTarget.prototype.removeSingletonInterfaces = function() {
    return true;
  };

  Skew.JavaScriptTarget.prototype.stringEncoding = function() {
    return Unicode.Encoding.UTF16;
  };

  Skew.JavaScriptTarget.prototype.editOptions = function(options) {
    options.define('TARGET', 'JAVASCRIPT');
  };

  Skew.JavaScriptTarget.prototype.includeSources = function(sources) {
    sources.unshift(new Skew.Source('<native-js>', Skew.NATIVE_LIBRARY_JS));
  };

  Skew.JavaScriptTarget.prototype.createEmitter = function(context) {
    return new Skew.JavaScriptEmitter(context, context.options, context.cache);
  };

  Skew.CSharpTarget = function() {
    Skew.CompilerTarget.call(this);
  };

  __extends(Skew.CSharpTarget, Skew.CompilerTarget);

  Skew.CSharpTarget.prototype.runPostResolvePasses = function() {
    return true;
  };

  Skew.CSharpTarget.prototype.requiresIntegerSwitchStatements = function() {
    return true;
  };

  Skew.CSharpTarget.prototype.supportsListForeach = function() {
    return true;
  };

  Skew.CSharpTarget.prototype.supportsNestedTypes = function() {
    return true;
  };

  Skew.CSharpTarget.prototype.stringEncoding = function() {
    return Unicode.Encoding.UTF16;
  };

  Skew.CSharpTarget.prototype.editOptions = function(options) {
    options.define('TARGET', 'CSHARP');
  };

  Skew.CSharpTarget.prototype.includeSources = function(sources) {
    sources.unshift(new Skew.Source('<native-cs>', Skew.NATIVE_LIBRARY_CS));
  };

  Skew.CSharpTarget.prototype.createEmitter = function(context) {
    return new Skew.CSharpEmitter(context.options, context.cache);
  };

  Skew.CPlusPlusTarget = function() {
    Skew.CompilerTarget.call(this);
  };

  __extends(Skew.CPlusPlusTarget, Skew.CompilerTarget);

  Skew.CPlusPlusTarget.prototype.runPostResolvePasses = function() {
    return true;
  };

  Skew.CPlusPlusTarget.prototype.requiresIntegerSwitchStatements = function() {
    return true;
  };

  Skew.CPlusPlusTarget.prototype.supportsListForeach = function() {
    return true;
  };

  Skew.CPlusPlusTarget.prototype.needsLambdaLifting = function() {
    return true;
  };

  Skew.CPlusPlusTarget.prototype.stringEncoding = function() {
    return Unicode.Encoding.UTF8;
  };

  Skew.CPlusPlusTarget.prototype.editOptions = function(options) {
    options.define('TARGET', 'CPLUSPLUS');
  };

  Skew.CPlusPlusTarget.prototype.includeSources = function(sources) {
    sources.unshift(new Skew.Source('<native-cpp>', Skew.NATIVE_LIBRARY_CPP));
  };

  Skew.CPlusPlusTarget.prototype.createEmitter = function(context) {
    return new Skew.CPlusPlusEmitter(context.options, context.cache);
  };

  Skew.TypeCheckingCompilerTarget = function() {
    Skew.CompilerTarget.call(this);
  };

  __extends(Skew.TypeCheckingCompilerTarget, Skew.CompilerTarget);

  Skew.TypeCheckingCompilerTarget.prototype.allowAbstractConstruction = function() {
    return true;
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
    this.jsSourceMap = false;
    this.verbose = false;
    this.outputDirectory = null;
    this.outputFile = null;
    this.target = new Skew.CompilerTarget();
    this.passes = [
      new Skew.LexingPass(),
      new Skew.TokenProcessingPass(),
      new Skew.ParsingPass(),
      new Skew.MergingPass(),
      new Skew.ResolvingPass(),
      new Skew.LambdaLiftingPass().onlyRunWhen(function(options) {
        return options.target.runPostResolvePasses() && options.target.needsLambdaLifting();
      }),
      new Skew.InterfaceRemovalPass().onlyRunWhen(function(options) {
        return options.target.runPostResolvePasses() && options.target.removeSingletonInterfaces() && options.globalizeAllFunctions;
      }),
      // The call graph is used as a shortcut so the tree only needs to be scanned once for all call-based optimizations
      new Skew.CallGraphPass().onlyRunWhen(function(options) {
        return options.target.runPostResolvePasses();
      }),
      new Skew.GlobalizingPass().onlyRunWhen(function(options) {
        return options.target.runPostResolvePasses();
      }),
      new Skew.MotionPass().onlyRunWhen(function(options) {
        return options.target.runPostResolvePasses();
      }),
      new Skew.RenamingPass().onlyRunWhen(function(options) {
        return options.target.runPostResolvePasses();
      }),
      new Skew.FoldingPass().onlyRunWhen(function(options) {
        return options.target.runPostResolvePasses() && options.foldAllConstants;
      }),
      new Skew.InliningPass().onlyRunWhen(function(options) {
        return options.target.runPostResolvePasses() && options.inlineAllFunctions;
      }),
      new Skew.FoldingPass().onlyRunWhen(function(options) {
        return options.target.runPostResolvePasses() && options.inlineAllFunctions && options.foldAllConstants;
      }),
      new Skew.EmittingPass()
    ];
  };

  Skew.CompilerOptions.prototype.define = function(name, value) {
    var range = new Skew.Source('<internal>', '--define:' + name + '=' + value).entireRange();
    this.defines[name] = new Skew.Define(range.slice(9, 9 + name.length | 0), range.fromEnd(value.length));
  };

  Skew.Timer = function() {
    this._isStarted = false;
    this._startTime = 0;
    this._totalSeconds = 0;
  };

  Skew.Timer.prototype.start = function() {
    assert(!this._isStarted);
    this._isStarted = true;
    this._startTime = (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()) / 1000;
  };

  Skew.Timer.prototype.stop = function() {
    assert(this._isStarted);
    this._isStarted = false;
    this._totalSeconds += (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()) / 1000 - this._startTime;
  };

  Skew.Timer.prototype.elapsedMilliseconds = function() {
    return (Math.round(this._totalSeconds * 1000 * 10) / 10).toString() + 'ms';
  };

  Skew.PassContext = function(log, options, inputs) {
    this.log = log;
    this.options = options;
    this.inputs = inputs;
    this.cache = new Skew.TypeCache();
    this.global = new Skew.ObjectSymbol(Skew.SymbolKind.OBJECT_GLOBAL, '<global>');
    this.callGraph = null;
    this.tokens = [];
    this.outputs = [];
  };

  Skew.Pass = function() {
    this._shouldRun = null;
  };

  Skew.Pass.prototype.shouldRun = function(options) {
    return this._shouldRun != null ? this._shouldRun(options) : true;
  };

  Skew.Pass.prototype.onlyRunWhen = function(callback) {
    this._shouldRun = callback;
    return this;
  };

  Skew.EmittingPass = function() {
    Skew.Pass.call(this);
  };

  __extends(Skew.EmittingPass, Skew.Pass);

  Skew.EmittingPass.prototype.kind = function() {
    return Skew.PassKind.EMITTING;
  };

  Skew.EmittingPass.prototype.run = function(context) {
    var emitter = context.options.target.createEmitter(context);

    if (emitter != null) {
      emitter.visit(context.global);
      context.outputs = emitter.sources();
    }
  };

  Skew.TokenProcessingPass = function() {
    Skew.Pass.call(this);
  };

  __extends(Skew.TokenProcessingPass, Skew.Pass);

  Skew.TokenProcessingPass.prototype.kind = function() {
    return Skew.PassKind.TOKEN_PROCESSING;
  };

  Skew.TokenProcessingPass.prototype.run = function(context) {
    for (var i = 0, list = context.tokens, count = list.length; i < count; ++i) {
      var tokens = list[i];
      Skew.prepareTokens(tokens);
    }
  };

  Skew.LexingPass = function() {
    Skew.Pass.call(this);
  };

  __extends(Skew.LexingPass, Skew.Pass);

  Skew.LexingPass.prototype.kind = function() {
    return Skew.PassKind.LEXING;
  };

  Skew.LexingPass.prototype.run = function(context) {
    for (var i = 0, list = context.inputs, count = list.length; i < count; ++i) {
      var source = list[i];
      context.tokens.push(Skew.tokenize(context.log, source));
    }
  };

  Skew.ParsingPass = function() {
    Skew.Pass.call(this);
  };

  __extends(Skew.ParsingPass, Skew.Pass);

  Skew.ParsingPass.prototype.kind = function() {
    return Skew.PassKind.PARSING;
  };

  Skew.ParsingPass.prototype.run = function(context) {
    for (var i = 0, list = context.tokens, count = list.length; i < count; ++i) {
      var tokens = list[i];
      Skew.Parsing.parseFile(context.log, tokens, context.global);
    }
  };

  Skew.CallGraphPass = function() {
    Skew.Pass.call(this);
  };

  __extends(Skew.CallGraphPass, Skew.Pass);

  Skew.CallGraphPass.prototype.kind = function() {
    return Skew.PassKind.CALL_GRAPH;
  };

  Skew.CallGraphPass.prototype.run = function(context) {
    context.callGraph = new Skew.CallGraph(context.global);
  };

  Skew.PassTimer = function(kind) {
    this.kind = kind;
    this.timer = new Skew.Timer();
  };

  Skew.CompilerResult = function(cache, global, outputs, passTimers, totalTimer) {
    this.cache = cache;
    this.global = global;
    this.outputs = outputs;
    this.passTimers = passTimers;
    this.totalTimer = totalTimer;
  };

  Skew.CompilerResult.prototype.statistics = function() {
    var builder = new StringBuilder();

    // Compilation time
    builder.append('Total time: ' + this.totalTimer.elapsedMilliseconds());

    for (var i = 0, list = this.passTimers, count = list.length; i < count; ++i) {
      var passTimer = list[i];
      builder.append('\n  ' + Skew.in_PassKind._strings[passTimer.kind] + ': ' + passTimer.timer.elapsedMilliseconds());
    }

    // Sources
    var totalBytes = 0;
    var totalLines = 0;

    for (var i1 = 0, list1 = this.outputs, count1 = list1.length; i1 < count1; ++i1) {
      var source = list1[i1];
      totalBytes += source.contents.length;
      totalLines += source.lineCount();
    }

    builder.append('\nOutputs: ' + this.outputs.length.toString() + ' file' + (this.outputs.length == 1 ? '' : 's') + ' (' + Skew.bytesToString(totalBytes) + ', ' + totalLines.toString() + ' line' + (totalLines == 1 ? '' : 's') + ')');

    for (var i2 = 0, list2 = this.outputs, count2 = list2.length; i2 < count2; ++i2) {
      var source1 = list2[i2];
      var lines = source1.lineCount();
      builder.append('\n  ' + source1.name + ' (' + Skew.bytesToString(source1.contents.length) + ', ' + lines.toString() + ' line' + (lines == 1 ? '' : 's') + ')');
    }

    return builder.toString();
  };

  // This does a simple control flow analysis without constructing a full
  // control flow graph. The result of this analysis is setting the flag
  // HAS_CONTROL_FLOW_AT_END on all blocks where control flow reaches the end.
  //
  // It makes a few assumptions around exceptions to make life easier. Normal
  // code without throw statements is assumed not to throw. For example, all
  // property accesses are assumed to succeed and not throw null pointer errors.
  // This is mostly consistent with how C++ operates for better or worse, and
  // is also consistent with how people read code. It also assumes flow always
  // can enter every catch block. Otherwise, why is it there?
  Skew.ControlFlowAnalyzer = function() {
    this._isLoopBreakTarget = [];
    this._isControlFlowLive = [];
  };

  Skew.ControlFlowAnalyzer.prototype.pushBlock = function(node) {
    var parent = node.parent();

    // Push control flow
    this._isControlFlowLive.push(this._isControlFlowLive.length == 0 || in_List.last(this._isControlFlowLive));

    // Push loop info
    if (parent != null && Skew.in_NodeKind.isLoop(parent.kind)) {
      this._isLoopBreakTarget.push(false);
    }
  };

  Skew.ControlFlowAnalyzer.prototype.popBlock = function(node) {
    var parent = node.parent();

    // Pop control flow
    var isLive = this._isControlFlowLive.pop();

    if (isLive) {
      node.flags |= Skew.Node.HAS_CONTROL_FLOW_AT_END;
    }

    // Pop loop info
    if (parent != null && Skew.in_NodeKind.isLoop(parent.kind) && !this._isLoopBreakTarget.pop() && (parent.kind == Skew.NodeKind.WHILE && parent.whileTest().isTrue() || parent.kind == Skew.NodeKind.FOR && parent.forTest().isTrue())) {
      in_List.setLast(this._isControlFlowLive, false);
    }
  };

  Skew.ControlFlowAnalyzer.prototype.visitStatementInPostOrder = function(node) {
    if (!in_List.last(this._isControlFlowLive)) {
      return;
    }

    switch (node.kind) {
      case Skew.NodeKind.BREAK: {
        if (!(this._isLoopBreakTarget.length == 0)) {
          in_List.setLast(this._isLoopBreakTarget, true);
        }

        in_List.setLast(this._isControlFlowLive, false);
        break;
      }

      case Skew.NodeKind.RETURN:
      case Skew.NodeKind.THROW:
      case Skew.NodeKind.CONTINUE: {
        in_List.setLast(this._isControlFlowLive, false);
        break;
      }

      case Skew.NodeKind.IF: {
        var test = node.ifTest();
        var trueBlock = node.ifTrue();
        var falseBlock = node.ifFalse();

        if (test.isTrue()) {
          if (!trueBlock.hasControlFlowAtEnd()) {
            in_List.setLast(this._isControlFlowLive, false);
          }
        }

        else if (test.isFalse() && falseBlock != null) {
          if (!falseBlock.hasControlFlowAtEnd()) {
            in_List.setLast(this._isControlFlowLive, false);
          }
        }

        else if (trueBlock != null && falseBlock != null) {
          if (!trueBlock.hasControlFlowAtEnd() && !falseBlock.hasControlFlowAtEnd()) {
            in_List.setLast(this._isControlFlowLive, false);
          }
        }
        break;
      }

      case Skew.NodeKind.SWITCH: {
        var child = node.switchValue().nextSibling();
        var foundDefaultCase = false;

        while (child != null && !child.caseBlock().hasControlFlowAtEnd()) {
          if (child.hasOneChild()) {
            foundDefaultCase = true;
          }

          child = child.nextSibling();
        }

        if (child == null && foundDefaultCase) {
          in_List.setLast(this._isControlFlowLive, false);
        }
        break;
      }
    }
  };

  Skew.FoldingPass = function() {
    Skew.Pass.call(this);
  };

  __extends(Skew.FoldingPass, Skew.Pass);

  Skew.FoldingPass.prototype.kind = function() {
    return Skew.PassKind.FOLDING;
  };

  Skew.FoldingPass.prototype.run = function(context) {
    new Skew.Folding.ConstantFolder(context.cache, context.options, null).visitObject(context.global);
  };

  Skew.Folding = {};

  Skew.Folding.ConstantFolder = function(cache, options, prepareSymbol) {
    this.cache = cache;
    this.options = options;
    this.prepareSymbol = prepareSymbol;
    this.constantCache = {};
  };

  Skew.Folding.ConstantFolder.prototype.visitObject = function(symbol) {
    for (var i = 0, list = symbol.objects, count = list.length; i < count; ++i) {
      var object = list[i];
      this.visitObject(object);
    }

    for (var i1 = 0, list1 = symbol.functions, count1 = list1.length; i1 < count1; ++i1) {
      var $function = list1[i1];

      if ($function.block != null) {
        this.foldConstants($function.block);
      }
    }

    for (var i2 = 0, list2 = symbol.variables, count2 = list2.length; i2 < count2; ++i2) {
      var variable = list2[i2];

      if (variable.value != null) {
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
    assert(this.cache.isEquivalentToBool(node.resolvedType) || node.resolvedType == Skew.Type.DYNAMIC);
    this.flatten(node, new Skew.BoolContent(value));
  };

  // Use this instead of node.become(Node.createInt(value)) to avoid more GC
  Skew.Folding.ConstantFolder.prototype.flattenInt = function(node, value) {
    assert(this.cache.isEquivalentToInt(node.resolvedType) || node.resolvedType == Skew.Type.DYNAMIC);
    this.flatten(node, new Skew.IntContent(value));
  };

  // Use this instead of node.become(Node.createDouble(value)) to avoid more GC
  Skew.Folding.ConstantFolder.prototype.flattenDouble = function(node, value) {
    assert(this.cache.isEquivalentToDouble(node.resolvedType) || node.resolvedType == Skew.Type.DYNAMIC);
    this.flatten(node, new Skew.DoubleContent(value));
  };

  // Use this instead of node.become(Node.createString(value)) to avoid more GC
  Skew.Folding.ConstantFolder.prototype.flattenString = function(node, value) {
    assert(this.cache.isEquivalentToString(node.resolvedType) || node.resolvedType == Skew.Type.DYNAMIC);
    this.flatten(node, new Skew.StringContent(value));
  };

  Skew.Folding.ConstantFolder.prototype.createInt = function(value) {
    return new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.IntContent(value)).withType(this.cache.intType);
  };

  Skew.Folding.ConstantFolder.prototype.foldConstants = function(node) {
    var kind = node.kind;

    // Transform "a + (b + c)" => "(a + b) + c" before operands are folded
    if (kind == Skew.NodeKind.ADD && node.resolvedType == this.cache.stringType && node.binaryLeft().resolvedType == this.cache.stringType && node.binaryRight().resolvedType == this.cache.stringType) {
      this.rotateStringConcatenation(node);
    }

    // Fold operands before folding this node
    for (var child = node.firstChild(); child != null; child = child.nextSibling()) {
      this.foldConstants(child);
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

      case Skew.NodeKind.COMPLEMENT:
      case Skew.NodeKind.DECREMENT:
      case Skew.NodeKind.INCREMENT:
      case Skew.NodeKind.NEGATIVE:
      case Skew.NodeKind.NOT:
      case Skew.NodeKind.POSITIVE: {
        this.foldUnary(node);
        break;
      }

      default: {
        if (Skew.in_NodeKind.isBinary(kind)) {
          this.foldBinary(node);
        }
        break;
      }
    }
  };

  Skew.Folding.ConstantFolder.prototype.rotateStringConcatenation = function(node) {
    var left = node.binaryLeft();
    var right = node.binaryRight();
    assert(node.kind == Skew.NodeKind.ADD);
    assert(left.resolvedType == this.cache.stringType || left.resolvedType == Skew.Type.DYNAMIC);
    assert(right.resolvedType == this.cache.stringType || right.resolvedType == Skew.Type.DYNAMIC);

    // "a + (b + c)" => "(a + b) + c"
    if (right.kind == Skew.NodeKind.ADD) {
      assert(right.binaryLeft().resolvedType == this.cache.stringType || right.binaryLeft().resolvedType == Skew.Type.DYNAMIC);
      assert(right.binaryRight().resolvedType == this.cache.stringType || right.binaryRight().resolvedType == Skew.Type.DYNAMIC);
      node.rotateBinaryRightToLeft();
    }
  };

  Skew.Folding.ConstantFolder.prototype.foldStringConcatenation = function(node) {
    var left = node.binaryLeft();
    var right = node.binaryRight();
    assert(left.resolvedType == this.cache.stringType || left.resolvedType == Skew.Type.DYNAMIC);
    assert(right.resolvedType == this.cache.stringType || right.resolvedType == Skew.Type.DYNAMIC);

    if (right.isString()) {
      // "a" + "b" => "ab"
      if (left.isString()) {
        this.flattenString(node, left.asString() + right.asString());
      }

      else if (left.kind == Skew.NodeKind.ADD) {
        var leftLeft = left.binaryLeft();
        var leftRight = left.binaryRight();
        assert(leftLeft.resolvedType == this.cache.stringType || leftLeft.resolvedType == Skew.Type.DYNAMIC);
        assert(leftRight.resolvedType == this.cache.stringType || leftRight.resolvedType == Skew.Type.DYNAMIC);

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

    // A try block without any statements cannot possibly throw
    if (!tryBlock.hasChildren()) {
      node.remove();
      return -1;
    }

    return 0;
  };

  Skew.Folding.ConstantFolder.prototype.foldIf = function(node) {
    var test = node.ifTest();
    var trueBlock = node.ifTrue();
    var falseBlock = node.ifFalse();

    // No reason to keep an empty "else" block
    if (falseBlock != null && !falseBlock.hasChildren()) {
      falseBlock.remove();
      falseBlock = null;
    }

    // Always true if statement
    if (test.isTrue()) {
      // Inline the contents of the true block
      node.replaceWithChildrenFrom(trueBlock);
    }

    // Always false if statement
    else if (test.isFalse()) {
      // Remove entirely
      if (falseBlock == null) {
        node.remove();
      }

      // Inline the contents of the false block
      else {
        node.replaceWithChildrenFrom(falseBlock);
      }
    }

    // Remove if statements with empty true blocks
    else if (!trueBlock.hasChildren()) {
      // "if (a) {} else b;" => "if (!a) b;"
      if (falseBlock != null && falseBlock.hasChildren()) {
        test.invertBooleanCondition(this.cache);
        trueBlock.remove();
      }

      // "if (a) {}" => ""
      else if (test.hasNoSideEffects()) {
        node.remove();
      }

      // "if (a) {}" => "a;"
      else {
        node.become(Skew.Node.createExpression(test.remove()));
      }
    }
  };

  Skew.Folding.ConstantFolder.prototype.foldSwitch = function(node) {
    var value = node.switchValue();
    var defaultCase = null;

    // Check for a default case
    for (var child = value.nextSibling(); child != null; child = child.nextSibling()) {
      if (child.hasOneChild()) {
        defaultCase = child;
        break;
      }
    }

    // Remove the default case if it's empty
    if (defaultCase != null && !defaultCase.caseBlock().hasChildren()) {
      defaultCase.remove();
      defaultCase = null;
    }

    // Check for a constant value and inline the corresponding case block
    if (value.kind == Skew.NodeKind.CONSTANT) {
      var hasNonConstant = false;

      // Search all case blocks for a match
      for (var child1 = value.nextSibling(), nextChild = null; child1 != null; child1 = nextChild) {
        nextChild = child1.nextSibling();
        var block = child1.caseBlock();

        for (var caseValue = child1.firstChild(), nextCase = null; caseValue != block; caseValue = nextCase) {
          nextCase = caseValue.nextSibling();

          // If there's a non-constant value, we can't tell if it's taken or not
          if (caseValue.kind != Skew.NodeKind.CONSTANT) {
            hasNonConstant = true;
          }

          // Remove cases that definitely don't apply
          else if (!Skew.in_Content.equals(value.content, caseValue.content)) {
            caseValue.remove();
          }

          // Only inline this case if all previous values have been constants,
          // otherwise we can't be sure that none of those would have matched
          else if (!hasNonConstant) {
            node.replaceWithChildrenFrom(block);
            return;
          }
        }

        // Remove the case entirely if all values were trimmed
        if (child1.hasOneChild() && child1 != defaultCase) {
          child1.remove();
        }
      }

      // Inline the default case if it's present and it can be proven to be taken
      if (!hasNonConstant) {
        if (defaultCase != null) {
          node.replaceWithChildrenFrom(defaultCase.caseBlock());
        }

        else {
          node.remove();
        }

        return;
      }
    }

    // If the default case is missing, all other empty cases can be removed too
    if (defaultCase == null) {
      for (var child2 = node.lastChild(), previous = null; child2 != value; child2 = previous) {
        previous = child2.previousSibling();

        if (!child2.caseBlock().hasChildren()) {
          child2.remove();
        }
      }
    }

    // Replace "switch (foo) {}" with "foo;"
    if (node.hasOneChild()) {
      node.become(Skew.Node.createExpression(value.remove()).withRange(node.range));
    }
  };

  Skew.Folding.ConstantFolder.prototype.foldVariables = function(node) {
    // Remove symbols entirely that are being inlined everywhere
    for (var child = node.firstChild(), next = null; child != null; child = next) {
      assert(child.kind == Skew.NodeKind.VARIABLE);
      next = child.nextSibling();
      var symbol = child.symbol.asVariableSymbol();

      if (symbol.isConst() && this.constantForSymbol(symbol) != null) {
        child.remove();
      }
    }

    // Empty variable statements are not allowed
    if (!node.hasChildren()) {
      node.remove();
    }
  };

  Skew.Folding.ConstantFolder.prototype.foldBlock = function(node) {
    for (var child = node.firstChild(), next = null; child != null; child = next) {
      next = child.nextSibling();
      var kind = child.kind;

      // Remove everything after a jump
      if (Skew.in_NodeKind.isJump(kind)) {
        while (child.nextSibling() != null) {
          child.nextSibling().remove();
        }

        break;
      }

      // Remove constants and "while false { ... }" entirely
      if (kind == Skew.NodeKind.EXPRESSION && child.expressionValue().hasNoSideEffects() || kind == Skew.NodeKind.WHILE && child.whileTest().isFalse()) {
        child.remove();
      }

      // Remove dead assignments
      else if (kind == Skew.NodeKind.EXPRESSION && child.expressionValue().kind == Skew.NodeKind.ASSIGN) {
        this.foldAssignment(child);
      }

      else if (kind == Skew.NodeKind.VARIABLES) {
        this.foldVariables(child);
      }

      // Remove unused try statements since they can cause deoptimizations
      else if (kind == Skew.NodeKind.TRY) {
        this.foldTry(child);
      }

      // Statically evaluate if statements where possible
      else if (kind == Skew.NodeKind.IF) {
        this.foldIf(child);
      }

      // Fold switch statements
      else if (kind == Skew.NodeKind.SWITCH) {
        this.foldSwitch(child);
      }
    }
  };

  Skew.Folding.ConstantFolder.prototype.isVariableReference = function(node) {
    return node.kind == Skew.NodeKind.NAME && node.symbol != null && Skew.in_SymbolKind.isVariable(node.symbol.kind);
  };

  Skew.Folding.ConstantFolder.prototype.isSameVariableReference = function(a, b) {
    return this.isVariableReference(a) && this.isVariableReference(b) && a.symbol == b.symbol || a.kind == Skew.NodeKind.CAST && b.kind == Skew.NodeKind.CAST && this.isSameVariableReference(a.castValue(), b.castValue());
  };

  Skew.Folding.ConstantFolder.prototype.hasNestedReference = function(node, symbol) {
    assert(symbol != null);

    if (node.symbol == symbol) {
      return true;
    }

    for (var child = node.firstChild(); child != null; child = child.nextSibling()) {
      if (this.hasNestedReference(child, symbol)) {
        return true;
      }
    }

    return false;
  };

  // "a = 0; b = 0; a = 1;" => "b = 0; a = 1;"
  Skew.Folding.ConstantFolder.prototype.foldAssignment = function(node) {
    assert(node.kind == Skew.NodeKind.EXPRESSION && node.expressionValue().kind == Skew.NodeKind.ASSIGN);
    var value = node.expressionValue();
    var left = value.binaryLeft();
    var right = value.binaryRight();

    // Only do this for simple variable assignments
    var dotVariable = left.kind == Skew.NodeKind.DOT && this.isVariableReference(left.dotTarget()) ? left.dotTarget().symbol : null;
    var variable = this.isVariableReference(left) || dotVariable != null ? left.symbol : null;

    if (variable == null) {
      return;
    }

    // Make sure the assigned value doesn't need the previous value. We bail
    // on expressions with side effects like function calls and on expressions
    // that reference the variable.
    if (!right.hasNoSideEffects() || this.hasNestedReference(right, variable)) {
      return;
    }

    // Scan backward over previous statements
    var previous = node.previousSibling();

    while (previous != null) {
      // Only pattern-match expressions
      if (previous.kind == Skew.NodeKind.EXPRESSION) {
        var previousValue = previous.expressionValue();

        // Remove duplicate assignments
        if (previousValue.kind == Skew.NodeKind.ASSIGN) {
          var previousLeft = previousValue.binaryLeft();
          var previousRight = previousValue.binaryRight();
          var previousDotVariable = previousLeft.kind == Skew.NodeKind.DOT && this.isVariableReference(previousLeft.dotTarget()) ? previousLeft.dotTarget().symbol : null;
          var previousVariable = this.isVariableReference(previousLeft) || previousDotVariable != null && previousDotVariable == dotVariable ? previousLeft.symbol : null;

          // Check for assignment to the same variable and remove the assignment
          // if it's a match. Make sure to keep the assigned value around if it
          // has side effects.
          if (previousVariable == variable) {
            if (previousRight.hasNoSideEffects()) {
              previous.remove();
            }

            else {
              previousValue.replaceWith(previousRight.remove());
            }

            break;
          }

          // Stop if we can't determine that this statement doesn't involve
          // this variable's value. If it does involve this variable's value,
          // then it isn't safe to remove duplicate assignments past this
          // statement.
          if (!previousRight.hasNoSideEffects() || this.hasNestedReference(previousRight, variable)) {
            break;
          }
        }

        // Also stop here if we can't determine that this statement doesn't
        // involve this variable's value
        else if (!previousValue.hasNoSideEffects()) {
          break;
        }
      }

      // Also stop here if we can't determine that this statement doesn't
      // involve this variable's value
      else {
        break;
      }

      previous = previous.previousSibling();
    }
  };

  Skew.Folding.ConstantFolder.prototype.shouldFoldSymbol = function(symbol) {
    return symbol != null && symbol.isConst() && (symbol.kind != Skew.SymbolKind.VARIABLE_INSTANCE || symbol.isImported());
  };

  Skew.Folding.ConstantFolder.prototype.foldDot = function(node) {
    var symbol = node.symbol;

    // Only replace this with a constant if the target has no side effects.
    // This catches constants declared on imported types.
    if (this.shouldFoldSymbol(symbol) && !node.isAssignTarget() && (node.dotTarget() == null || node.dotTarget().hasNoSideEffects())) {
      var content = this.constantForSymbol(symbol.asVariableSymbol());

      if (content != null) {
        this.flatten(node, content);
      }
    }
  };

  Skew.Folding.ConstantFolder.prototype.foldName = function(node) {
    var symbol = node.symbol;

    // Don't fold loop variables since they aren't actually constant across loop iterations
    if (this.shouldFoldSymbol(symbol) && !node.isAssignTarget() && !symbol.isLoopVariable()) {
      var content = this.constantForSymbol(symbol.asVariableSymbol());

      if (content != null) {
        this.flatten(node, content);
      }
    }
  };

  Skew.Folding.ConstantFolder.prototype.isKnownCall = function(symbol, knownSymbol) {
    return symbol == knownSymbol || symbol != null && Skew.in_SymbolKind.isFunction(symbol.kind) && symbol.asFunctionSymbol().overloaded == knownSymbol;
  };

  Skew.Folding.ConstantFolder.prototype.foldCall = function(node) {
    var value = node.callValue();
    var symbol = value.symbol;

    if (value.kind == Skew.NodeKind.DOT) {
      var target = value.dotTarget();

      if (target != null && target.kind == Skew.NodeKind.CONSTANT) {
        if (this.isKnownCall(symbol, this.cache.boolToStringSymbol)) {
          this.flattenString(node, target.asBool().toString());
        }

        else if (this.isKnownCall(symbol, this.cache.doubleToStringSymbol)) {
          this.flattenString(node, target.asDouble().toString());
        }

        else if (this.isKnownCall(symbol, this.cache.intToStringSymbol)) {
          this.flattenString(node, target.asInt().toString());
        }
      }
    }

    else if (value.kind == Skew.NodeKind.NAME) {
      if (this.isKnownCall(symbol, this.cache.stringCountSymbol) && node.lastChild().isString()) {
        this.flattenInt(node, Unicode.codeUnitCountForCodePoints(in_string.codePoints(node.lastChild().asString()), this.options.target.stringEncoding()));
      }

      else if (this.isKnownCall(symbol, this.cache.intPowerSymbol) && node.lastChild().isInt() && value.nextSibling().isInt()) {
        this.flattenInt(node, in_int.power(value.nextSibling().asInt(), node.lastChild().asInt()));
      }

      else if (this.isKnownCall(symbol, this.cache.doublePowerSymbol) && node.lastChild().isDouble() && value.nextSibling().isDouble()) {
        this.flattenDouble(node, Math.pow(value.nextSibling().asDouble(), node.lastChild().asDouble()));
      }
    }
  };

  Skew.Folding.ConstantFolder.prototype.foldCast = function(node) {
    var type = node.castType().resolvedType;
    var value = node.castValue();

    if (value.kind == Skew.NodeKind.CONSTANT) {
      var content = value.content;
      var kind = content.kind();

      // Cast "bool" values
      if (kind == Skew.ContentKind.BOOL) {
        if (this.cache.isEquivalentToBool(type)) {
          this.flattenBool(node, value.asBool());
        }

        else if (this.cache.isEquivalentToInt(type)) {
          this.flattenInt(node, value.asBool() | 0);
        }

        else if (this.cache.isEquivalentToDouble(type)) {
          this.flattenDouble(node, +value.asBool());
        }
      }

      // Cast "int" values
      else if (kind == Skew.ContentKind.INT) {
        if (this.cache.isEquivalentToBool(type)) {
          this.flattenBool(node, !!value.asInt());
        }

        else if (this.cache.isEquivalentToInt(type)) {
          this.flattenInt(node, value.asInt());
        }

        else if (this.cache.isEquivalentToDouble(type)) {
          this.flattenDouble(node, value.asInt());
        }
      }

      // Cast "double" values
      else if (kind == Skew.ContentKind.DOUBLE) {
        if (this.cache.isEquivalentToBool(type)) {
          this.flattenBool(node, !!value.asDouble());
        }

        else if (this.cache.isEquivalentToInt(type)) {
          this.flattenInt(node, value.asDouble() | 0);
        }

        else if (this.cache.isEquivalentToDouble(type)) {
          this.flattenDouble(node, value.asDouble());
        }
      }
    }
  };

  Skew.Folding.ConstantFolder.prototype.foldUnary = function(node) {
    var value = node.unaryValue();
    var kind = node.kind;

    if (value.kind == Skew.NodeKind.CONSTANT) {
      var content = value.content;
      var contentKind = content.kind();

      // Fold "bool" values
      if (contentKind == Skew.ContentKind.BOOL) {
        if (kind == Skew.NodeKind.NOT) {
          this.flattenBool(node, !value.asBool());
        }
      }

      // Fold "int" values
      else if (contentKind == Skew.ContentKind.INT) {
        if (kind == Skew.NodeKind.POSITIVE) {
          this.flattenInt(node, +value.asInt());
        }

        else if (kind == Skew.NodeKind.NEGATIVE) {
          this.flattenInt(node, -value.asInt() | 0);
        }

        else if (kind == Skew.NodeKind.COMPLEMENT) {
          this.flattenInt(node, ~value.asInt());
        }
      }

      // Fold "float" or "double" values
      else if (contentKind == Skew.ContentKind.DOUBLE) {
        if (kind == Skew.NodeKind.POSITIVE) {
          this.flattenDouble(node, +value.asDouble());
        }

        else if (kind == Skew.NodeKind.NEGATIVE) {
          this.flattenDouble(node, -value.asDouble());
        }
      }
    }

    // Partial evaluation ("!!x" isn't necessarily "x" if we don't know the type)
    else if (kind == Skew.NodeKind.NOT && value.resolvedType != Skew.Type.DYNAMIC) {
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
          node.become(value.remove());
          break;
        }
      }
    }
  };

  Skew.Folding.ConstantFolder.prototype.foldConstantAddOrSubtract = function(node, variable, constant, delta) {
    var isAdd = node.kind == Skew.NodeKind.ADD;
    var needsContentUpdate = delta != 0;
    var isRightConstant = constant == node.binaryRight();
    var shouldNegateConstant = !isAdd && isRightConstant;
    var value = constant.asInt();

    // Make this an add for simplicity
    if (shouldNegateConstant) {
      value = -value | 0;
    }

    // Include the delta from the parent node if present
    value += delta;

    // Apply addition identities
    if (value == 0) {
      node.become(variable.remove());
      return;
    }

    // Check for nested addition or subtraction
    if (variable.kind == Skew.NodeKind.ADD || variable.kind == Skew.NodeKind.SUBTRACT) {
      var left = variable.binaryLeft();
      var right = variable.binaryRight();
      assert(left.resolvedType == this.cache.intType || left.resolvedType == Skew.Type.DYNAMIC);
      assert(right.resolvedType == this.cache.intType || right.resolvedType == Skew.Type.DYNAMIC);

      // (a + 1) + 2 => a + 3
      var isLeftConstant = left.isInt();

      if (isLeftConstant || right.isInt()) {
        this.foldConstantAddOrSubtract(variable, isLeftConstant ? right : left, isLeftConstant ? left : right, value);
        node.become(variable.remove());
        return;
      }
    }

    // Adjust the value so it has the correct sign
    if (shouldNegateConstant) {
      value = -value | 0;
    }

    // The negative sign can often be removed by code transformation
    if (value < 0) {
      // a + -1 => a - 1
      // a - -1 => a + 1
      if (isRightConstant) {
        node.kind = isAdd ? Skew.NodeKind.SUBTRACT : Skew.NodeKind.ADD;
        value = -value | 0;
        needsContentUpdate = true;
      }

      // -1 + a => a - 1
      else if (isAdd) {
        node.kind = Skew.NodeKind.SUBTRACT;
        value = -value | 0;
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
    var isAdd = node.kind == Skew.NodeKind.ADD;
    var left = node.binaryLeft();
    var right = node.binaryRight();

    // -a + b => b - a
    if (left.kind == Skew.NodeKind.NEGATIVE && isAdd) {
      left.become(left.unaryValue().remove());
      left.swapWith(right);
      node.kind = Skew.NodeKind.SUBTRACT;
    }

    // a + -b => a - b
    // a - -b => a + b
    else if (right.kind == Skew.NodeKind.NEGATIVE) {
      right.become(right.unaryValue().remove());
      node.kind = isAdd ? Skew.NodeKind.SUBTRACT : Skew.NodeKind.ADD;
    }
  };

  Skew.Folding.ConstantFolder.prototype.foldConstantIntegerMultiply = function(node, variable, constant) {
    assert(constant.isInt());

    // Apply identities
    var value = constant.asInt();

    if (value == 0) {
      if (variable.hasNoSideEffects()) {
        node.become(constant.remove());
      }

      return;
    }

    if (value == 1) {
      node.become(variable.remove());
      return;
    }

    // Multiply by a power of 2 should be a left-shift operation, which is
    // more concise and always faster (or at least never slower) than the
    // alternative. Division can't be replaced by a right-shift operation
    // because that would lead to incorrect results for negative numbers.
    var shift = this.logBase2(value);

    if (shift != -1) {
      constant.content = new Skew.IntContent(shift);
      node.kind = Skew.NodeKind.SHIFT_LEFT;
    }
  };

  // "((a >> 8) & 255) << 8" => "a & (255 << 8)"
  // "((a >>> 8) & 255) << 8" => "a & (255 << 8)"
  // "((a >> 7) & 255) << 8" => "(a << 1) & (255 << 8)"
  // "((a >>> 7) & 255) << 8" => "(a << 1) & (255 << 8)"
  // "((a >> 8) & 255) << 7" => "(a >> 1) & (255 << 7)"
  // "((a >>> 8) & 255) << 7" => "(a >>> 1) & (255 << 7)"
  Skew.Folding.ConstantFolder.prototype.foldConstantBitwiseAndInsideShift = function(node, andLeft, andRight) {
    assert(node.kind == Skew.NodeKind.SHIFT_LEFT && node.binaryRight().isInt());

    if (andRight.isInt() && (andLeft.kind == Skew.NodeKind.SHIFT_RIGHT || andLeft.kind == Skew.NodeKind.UNSIGNED_SHIFT_RIGHT) && andLeft.binaryRight().isInt()) {
      var mask = andRight.asInt();
      var leftShift = node.binaryRight().asInt();
      var rightShift = andLeft.binaryRight().asInt();
      var value = andLeft.binaryLeft().remove();

      if (leftShift < rightShift) {
        value = Skew.Node.createBinary(andLeft.kind, value, this.createInt(rightShift - leftShift | 0)).withType(this.cache.intType);
      }

      else if (leftShift > rightShift) {
        value = Skew.Node.createBinary(Skew.NodeKind.SHIFT_LEFT, value, this.createInt(leftShift - rightShift | 0)).withType(this.cache.intType);
      }

      node.become(Skew.Node.createBinary(Skew.NodeKind.BITWISE_AND, value, this.createInt(mask << leftShift)).withType(node.resolvedType));
    }
  };

  Skew.Folding.ConstantFolder.prototype.foldConstantBitwiseAndInsideBitwiseOr = function(node) {
    assert(node.kind == Skew.NodeKind.BITWISE_OR && node.binaryLeft().kind == Skew.NodeKind.BITWISE_AND);
    var left = node.binaryLeft();
    var right = node.binaryRight();
    var leftLeft = left.binaryLeft();
    var leftRight = left.binaryRight();

    // "(a & b) | (a & c)" => "a & (b | c)"
    if (right.kind == Skew.NodeKind.BITWISE_AND) {
      var rightLeft = right.binaryLeft();
      var rightRight = right.binaryRight();

      if (leftRight.isInt() && rightRight.isInt() && this.isSameVariableReference(leftLeft, rightLeft)) {
        var mask = leftRight.asInt() | rightRight.asInt();
        node.become(Skew.Node.createBinary(Skew.NodeKind.BITWISE_AND, leftLeft.remove(), this.createInt(mask)).withType(node.resolvedType));
      }
    }

    // "(a & b) | c" => "a | c" when "(a | b) == ~0"
    else if (right.isInt() && leftRight.isInt() && (leftRight.asInt() | right.asInt()) == ~0) {
      left.become(leftLeft.remove());
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
        if (right.isInt()) {
          this.foldConstantIntegerMultiply(node, left, right);
        }
        break;
      }

      case Skew.NodeKind.SHIFT_LEFT: {
        if (left.kind == Skew.NodeKind.BITWISE_AND && right.isInt()) {
          this.foldConstantBitwiseAndInsideShift(node, left.binaryLeft(), left.binaryRight());
        }
        break;
      }

      case Skew.NodeKind.BITWISE_OR: {
        if (left.kind == Skew.NodeKind.BITWISE_AND) {
          this.foldConstantBitwiseAndInsideBitwiseOr(node);
        }
        break;
      }
    }
  };

  Skew.Folding.ConstantFolder.prototype.foldBinary = function(node) {
    var kind = node.kind;

    if (kind == Skew.NodeKind.ADD && node.resolvedType == this.cache.stringType) {
      this.foldStringConcatenation(node);
      return;
    }

    var left = node.binaryLeft();
    var right = node.binaryRight();

    // Canonicalize the order of commutative operators
    if ((kind == Skew.NodeKind.MULTIPLY || kind == Skew.NodeKind.BITWISE_AND || kind == Skew.NodeKind.BITWISE_OR) && left.kind == Skew.NodeKind.CONSTANT && right.kind != Skew.NodeKind.CONSTANT) {
      var temp = left;
      left = right;
      right = temp;
      left.swapWith(right);
    }

    if (left.kind == Skew.NodeKind.CONSTANT && right.kind == Skew.NodeKind.CONSTANT) {
      var leftContent = left.content;
      var rightContent = right.content;
      var leftKind = leftContent.kind();
      var rightKind = rightContent.kind();

      // Fold equality operators
      if (leftKind == Skew.ContentKind.STRING && rightKind == Skew.ContentKind.STRING) {
        switch (kind) {
          case Skew.NodeKind.EQUAL: {
            this.flattenBool(node, Skew.in_Content.asString(leftContent) == Skew.in_Content.asString(rightContent));
            break;
          }

          case Skew.NodeKind.NOT_EQUAL: {
            this.flattenBool(node, Skew.in_Content.asString(leftContent) != Skew.in_Content.asString(rightContent));
            break;
          }

          case Skew.NodeKind.LESS_THAN: {
            this.flattenBool(node, in_string.compare(Skew.in_Content.asString(leftContent), Skew.in_Content.asString(rightContent)) < 0);
            break;
          }

          case Skew.NodeKind.GREATER_THAN: {
            this.flattenBool(node, in_string.compare(Skew.in_Content.asString(leftContent), Skew.in_Content.asString(rightContent)) > 0);
            break;
          }

          case Skew.NodeKind.LESS_THAN_OR_EQUAL: {
            this.flattenBool(node, in_string.compare(Skew.in_Content.asString(leftContent), Skew.in_Content.asString(rightContent)) <= 0);
            break;
          }

          case Skew.NodeKind.GREATER_THAN_OR_EQUAL: {
            this.flattenBool(node, in_string.compare(Skew.in_Content.asString(leftContent), Skew.in_Content.asString(rightContent)) >= 0);
            break;
          }
        }

        return;
      }

      // Fold "bool" values
      else if (leftKind == Skew.ContentKind.BOOL && rightKind == Skew.ContentKind.BOOL) {
        switch (kind) {
          case Skew.NodeKind.LOGICAL_AND: {
            this.flattenBool(node, Skew.in_Content.asBool(leftContent) && Skew.in_Content.asBool(rightContent));
            break;
          }

          case Skew.NodeKind.LOGICAL_OR: {
            this.flattenBool(node, Skew.in_Content.asBool(leftContent) || Skew.in_Content.asBool(rightContent));
            break;
          }

          case Skew.NodeKind.EQUAL: {
            this.flattenBool(node, Skew.in_Content.asBool(leftContent) == Skew.in_Content.asBool(rightContent));
            break;
          }

          case Skew.NodeKind.NOT_EQUAL: {
            this.flattenBool(node, Skew.in_Content.asBool(leftContent) != Skew.in_Content.asBool(rightContent));
            break;
          }
        }

        return;
      }

      // Fold "int" values
      else if (leftKind == Skew.ContentKind.INT && rightKind == Skew.ContentKind.INT) {
        switch (kind) {
          case Skew.NodeKind.ADD: {
            this.flattenInt(node, Skew.in_Content.asInt(leftContent) + Skew.in_Content.asInt(rightContent) | 0);
            break;
          }

          case Skew.NodeKind.BITWISE_AND: {
            this.flattenInt(node, Skew.in_Content.asInt(leftContent) & Skew.in_Content.asInt(rightContent));
            break;
          }

          case Skew.NodeKind.BITWISE_OR: {
            this.flattenInt(node, Skew.in_Content.asInt(leftContent) | Skew.in_Content.asInt(rightContent));
            break;
          }

          case Skew.NodeKind.BITWISE_XOR: {
            this.flattenInt(node, Skew.in_Content.asInt(leftContent) ^ Skew.in_Content.asInt(rightContent));
            break;
          }

          case Skew.NodeKind.DIVIDE: {
            this.flattenInt(node, Skew.in_Content.asInt(leftContent) / Skew.in_Content.asInt(rightContent) | 0);
            break;
          }

          case Skew.NodeKind.EQUAL: {
            this.flattenBool(node, Skew.in_Content.asInt(leftContent) == Skew.in_Content.asInt(rightContent));
            break;
          }

          case Skew.NodeKind.GREATER_THAN: {
            this.flattenBool(node, Skew.in_Content.asInt(leftContent) > Skew.in_Content.asInt(rightContent));
            break;
          }

          case Skew.NodeKind.GREATER_THAN_OR_EQUAL: {
            this.flattenBool(node, Skew.in_Content.asInt(leftContent) >= Skew.in_Content.asInt(rightContent));
            break;
          }

          case Skew.NodeKind.LESS_THAN: {
            this.flattenBool(node, Skew.in_Content.asInt(leftContent) < Skew.in_Content.asInt(rightContent));
            break;
          }

          case Skew.NodeKind.LESS_THAN_OR_EQUAL: {
            this.flattenBool(node, Skew.in_Content.asInt(leftContent) <= Skew.in_Content.asInt(rightContent));
            break;
          }

          case Skew.NodeKind.MULTIPLY: {
            this.flattenInt(node, __imul(Skew.in_Content.asInt(leftContent), Skew.in_Content.asInt(rightContent)));
            break;
          }

          case Skew.NodeKind.NOT_EQUAL: {
            this.flattenBool(node, Skew.in_Content.asInt(leftContent) != Skew.in_Content.asInt(rightContent));
            break;
          }

          case Skew.NodeKind.REMAINDER: {
            this.flattenInt(node, Skew.in_Content.asInt(leftContent) % Skew.in_Content.asInt(rightContent) | 0);
            break;
          }

          case Skew.NodeKind.SHIFT_LEFT: {
            this.flattenInt(node, Skew.in_Content.asInt(leftContent) << Skew.in_Content.asInt(rightContent));
            break;
          }

          case Skew.NodeKind.SHIFT_RIGHT: {
            this.flattenInt(node, Skew.in_Content.asInt(leftContent) >> Skew.in_Content.asInt(rightContent));
            break;
          }

          case Skew.NodeKind.SUBTRACT: {
            this.flattenInt(node, Skew.in_Content.asInt(leftContent) - Skew.in_Content.asInt(rightContent) | 0);
            break;
          }

          case Skew.NodeKind.UNSIGNED_SHIFT_RIGHT: {
            this.flattenInt(node, Skew.in_Content.asInt(leftContent) >>> Skew.in_Content.asInt(rightContent) | 0);
            break;
          }
        }

        return;
      }

      // Fold "double" values
      else if (leftKind == Skew.ContentKind.DOUBLE && rightKind == Skew.ContentKind.DOUBLE) {
        switch (kind) {
          case Skew.NodeKind.ADD: {
            this.flattenDouble(node, Skew.in_Content.asDouble(leftContent) + Skew.in_Content.asDouble(rightContent));
            break;
          }

          case Skew.NodeKind.SUBTRACT: {
            this.flattenDouble(node, Skew.in_Content.asDouble(leftContent) - Skew.in_Content.asDouble(rightContent));
            break;
          }

          case Skew.NodeKind.MULTIPLY: {
            this.flattenDouble(node, Skew.in_Content.asDouble(leftContent) * Skew.in_Content.asDouble(rightContent));
            break;
          }

          case Skew.NodeKind.DIVIDE: {
            this.flattenDouble(node, Skew.in_Content.asDouble(leftContent) / Skew.in_Content.asDouble(rightContent));
            break;
          }

          case Skew.NodeKind.EQUAL: {
            this.flattenBool(node, Skew.in_Content.asDouble(leftContent) == Skew.in_Content.asDouble(rightContent));
            break;
          }

          case Skew.NodeKind.NOT_EQUAL: {
            this.flattenBool(node, Skew.in_Content.asDouble(leftContent) != Skew.in_Content.asDouble(rightContent));
            break;
          }

          case Skew.NodeKind.LESS_THAN: {
            this.flattenBool(node, Skew.in_Content.asDouble(leftContent) < Skew.in_Content.asDouble(rightContent));
            break;
          }

          case Skew.NodeKind.GREATER_THAN: {
            this.flattenBool(node, Skew.in_Content.asDouble(leftContent) > Skew.in_Content.asDouble(rightContent));
            break;
          }

          case Skew.NodeKind.LESS_THAN_OR_EQUAL: {
            this.flattenBool(node, Skew.in_Content.asDouble(leftContent) <= Skew.in_Content.asDouble(rightContent));
            break;
          }

          case Skew.NodeKind.GREATER_THAN_OR_EQUAL: {
            this.flattenBool(node, Skew.in_Content.asDouble(leftContent) >= Skew.in_Content.asDouble(rightContent));
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
    if (value < 1 || (value & value - 1) != 0) {
      return -1;
    }

    var result = 0;

    while (value > 1) {
      value >>= 1;
      ++result;
    }

    return result;
  };

  Skew.Folding.ConstantFolder.prototype.constantForSymbol = function(symbol) {
    if (symbol.id in this.constantCache) {
      return this.constantCache[symbol.id];
    }

    if (this.prepareSymbol != null) {
      this.prepareSymbol(symbol);
    }

    var constant = null;
    var value = symbol.value;

    if (symbol.isConst() && value != null) {
      this.constantCache[symbol.id] = null;
      value = value.clone();
      this.foldConstants(value);

      if (value.kind == Skew.NodeKind.CONSTANT) {
        constant = value.content;
      }
    }

    this.constantCache[symbol.id] = constant;
    return constant;
  };

  Skew.GlobalizingPass = function() {
    Skew.Pass.call(this);
  };

  __extends(Skew.GlobalizingPass, Skew.Pass);

  Skew.GlobalizingPass.prototype.kind = function() {
    return Skew.PassKind.GLOBALIZING;
  };

  Skew.GlobalizingPass.prototype.run = function(context) {
    var virtualLookup = context.options.globalizeAllFunctions ? new Skew.VirtualLookup(context.global) : null;

    for (var i1 = 0, list1 = context.callGraph.callInfo, count1 = list1.length; i1 < count1; ++i1) {
      var info = list1[i1];
      var symbol = info.symbol;

      // Turn certain instance functions into global functions
      if (symbol.kind == Skew.SymbolKind.FUNCTION_INSTANCE && (symbol.parent.kind == Skew.SymbolKind.OBJECT_ENUM || symbol.parent.kind == Skew.SymbolKind.OBJECT_WRAPPED || symbol.parent.kind == Skew.SymbolKind.OBJECT_INTERFACE && symbol.block != null || symbol.parent.isImported() && !symbol.isImported() || !symbol.isImportedOrExported() && virtualLookup != null && !virtualLookup.isVirtual(symbol))) {
        var $function = symbol.asFunctionSymbol();
        $function.kind = Skew.SymbolKind.FUNCTION_GLOBAL;
        $function.$arguments.unshift($function.$this);
        $function.$this = null;

        // Update all call sites
        for (var i = 0, list = info.callSites, count = list.length; i < count; ++i) {
          var callSite = list[i];
          var value = callSite.callNode.callValue();

          // Rewrite "super(foo)" to "bar(self, foo)"
          if (value.kind == Skew.NodeKind.SUPER) {
            var $this = callSite.enclosingSymbol.asFunctionSymbol().$this;
            value.replaceWith(Skew.Node.createSymbolReference($this));
          }

          // Rewrite "self.foo(bar)" to "foo(self, bar)"
          else {
            value.replaceWith((value.kind == Skew.NodeKind.PARAMETERIZE ? value.parameterizeValue() : value).dotTarget().remove());
          }

          callSite.callNode.prependChild(Skew.Node.createSymbolReference($function));
        }
      }
    }
  };

  Skew.VirtualLookup = function(global) {
    this._map = {};
    this._visitObject(global);
  };

  Skew.VirtualLookup.prototype.isVirtual = function(symbol) {
    return symbol.id in this._map;
  };

  Skew.VirtualLookup.prototype._visitObject = function(symbol) {
    for (var i = 0, list = symbol.objects, count = list.length; i < count; ++i) {
      var object = list[i];
      this._visitObject(object);
    }

    for (var i2 = 0, list2 = symbol.functions, count2 = list2.length; i2 < count2; ++i2) {
      var $function = list2[i2];

      if ($function.overridden != null) {
        this._map[$function.overridden.id] = 0;
        this._map[$function.id] = 0;
      }

      if (symbol.kind == Skew.SymbolKind.OBJECT_INTERFACE && $function.kind == Skew.SymbolKind.FUNCTION_INSTANCE && $function.forwardTo == null) {
        if ($function.implementations != null) {
          for (var i1 = 0, list1 = $function.implementations, count1 = list1.length; i1 < count1; ++i1) {
            var implementation = list1[i1];
            this._map[implementation.id] = 0;
          }
        }

        this._map[$function.id] = 0;
      }
    }
  };

  Skew.InliningPass = function() {
    Skew.Pass.call(this);
  };

  __extends(Skew.InliningPass, Skew.Pass);

  Skew.InliningPass.prototype.kind = function() {
    return Skew.PassKind.INLINING;
  };

  Skew.InliningPass.prototype.run = function(context) {
    var graph = new Skew.Inlining.InliningGraph(context.callGraph);

    for (var i = 0, list = graph.inliningInfo, count = list.length; i < count; ++i) {
      var info = list[i];
      Skew.Inlining.inlineSymbol(graph, info);
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

    var spreadingAnnotations = info.symbol.spreadingAnnotations();

    for (var i = 0, count2 = info.callSites.length; i < count2; ++i) {
      var callSite = info.callSites[i];

      // Some calls may be reused for other node types during constant folding
      if (callSite == null || callSite.callNode.kind != Skew.NodeKind.CALL) {
        continue;
      }

      // Make sure the call site hasn't been tampered with. An example of where
      // this can happen is constant folding "false ? 0 : foo.foo" to "foo.foo".
      // The children of "foo.foo" are stolen and parented under the hook
      // expression as part of a become() call. Skipping inlining in this case
      // just means we lose out on those inlining opportunities. This isn't the
      // end of the world and is a pretty rare occurrence.
      var node = callSite.callNode;

      if (node.childCount() != (info.symbol.$arguments.length + 1 | 0)) {
        continue;
      }

      // Propagate spreading annotations that must be preserved through inlining
      if (spreadingAnnotations != null) {
        var annotations = callSite.enclosingSymbol.annotations;

        if (annotations == null) {
          annotations = [];
          callSite.enclosingSymbol.annotations = annotations;
        }

        for (var i2 = 0, list1 = spreadingAnnotations, count1 = list1.length; i2 < count1; ++i2) {
          var annotation = list1[i2];

          if (!(annotations.indexOf(annotation) != -1)) {
            annotations.push(annotation);
          }
        }
      }

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
      if (!(info.unusedArguments.length == 0)) {
        var hasSideEffects = false;

        for (var child = node.callValue().nextSibling(); child != null; child = child.nextSibling()) {
          if (!child.hasNoSideEffects()) {
            hasSideEffects = true;
            break;
          }
        }

        if (hasSideEffects) {
          continue;
        }
      }

      var clone = info.inlineValue.clone();
      var value = node.firstChild().remove();
      var values = [];

      while (node.hasChildren()) {
        values.push(node.firstChild().remove());
      }

      // Make sure not to update the type if the function dynamic because the
      // expression inside the function may have a more specific type that is
      // necessary during code generation
      if (node.resolvedType != Skew.Type.DYNAMIC) {
        clone.resolvedType = node.resolvedType;
      }

      assert((value.kind == Skew.NodeKind.PARAMETERIZE ? value.parameterizeValue() : value).kind == Skew.NodeKind.NAME && value.symbol == info.symbol);
      node.become(clone);
      Skew.Inlining.recursivelySubstituteArguments(node, info.symbol.$arguments, values);

      // Remove the inlined result entirely if appropriate
      var parent = node.parent();

      if (parent != null && parent.kind == Skew.NodeKind.EXPRESSION && node.hasNoSideEffects()) {
        parent.remove();
      }
    }
  };

  Skew.Inlining.recursivelySubstituteArguments = function(node, $arguments, values) {
    // Substitute the argument if this is an argument name
    var symbol = node.symbol;

    if (symbol != null && Skew.in_SymbolKind.isVariable(symbol.kind)) {
      var index = $arguments.indexOf(symbol.asVariableSymbol());

      if (index != -1) {
        node.replaceWith(values[index]);
        return;
      }
    }

    // Otherwise, recursively search for substitutions in all child nodes
    for (var child = node.firstChild(), next = null; child != null; child = next) {
      next = child.nextSibling();
      Skew.Inlining.recursivelySubstituteArguments(child, $arguments, values);
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
    this.symbolToInfoIndex = {};

    // Create the nodes in the graph
    for (var i = 0, list = graph.callInfo, count = list.length; i < count; ++i) {
      var callInfo = list[i];

      if (callInfo.symbol.isInliningDisabled()) {
        continue;
      }

      var info = Skew.Inlining.InliningGraph._createInliningInfo(callInfo);

      if (info != null) {
        this.symbolToInfoIndex[info.symbol.id] = this.inliningInfo.length;
        this.inliningInfo.push(info);
      }
    }

    // Create the edges in the graph
    for (var i2 = 0, list2 = this.inliningInfo, count2 = list2.length; i2 < count2; ++i2) {
      var info1 = list2[i2];

      for (var i1 = 0, list1 = graph.callInfoForSymbol(info1.symbol).callSites, count1 = list1.length; i1 < count1; ++i1) {
        var callSite = list1[i1];

        if (callSite.enclosingSymbol.kind == Skew.SymbolKind.FUNCTION_GLOBAL) {
          var index = in_IntMap.get(this.symbolToInfoIndex, callSite.enclosingSymbol.id, -1);

          if (index != -1) {
            this.inliningInfo[index].bodyCalls.push(info1);
          }
        }
      }
    }

    // Detect and disable infinitely expanding inline operations
    for (var i3 = 0, list3 = this.inliningInfo, count3 = list3.length; i3 < count3; ++i3) {
      var info2 = list3[i3];
      info2.shouldInline = !Skew.Inlining.InliningGraph._containsInfiniteExpansion(info2, []);
    }
  };

  Skew.Inlining.InliningGraph._containsInfiniteExpansion = function(info, symbols) {
    // This shouldn't get very long in normal programs so O(n) here is fine
    if (symbols.indexOf(info.symbol) != -1) {
      return true;
    }

    // Do a depth-first search on the graph and check for cycles
    symbols.push(info.symbol);

    for (var i = 0, list = info.bodyCalls, count = list.length; i < count; ++i) {
      var bodyCall = list[i];

      if (Skew.Inlining.InliningGraph._containsInfiniteExpansion(bodyCall, symbols)) {
        return true;
      }
    }

    symbols.pop();
    return false;
  };

  Skew.Inlining.InliningGraph._createInliningInfo = function(info) {
    var symbol = info.symbol;

    // Inline functions consisting of a single return statement
    if (symbol.kind == Skew.SymbolKind.FUNCTION_GLOBAL) {
      var block = symbol.block;

      if (block == null) {
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

      var first = block.firstChild();
      var inlineValue = null;

      // If the first value in the function is a return statement, then the
      // function body doesn't need to only have one statement. Subsequent
      // statements are just dead code and will never be executed anyway.
      if (first.kind == Skew.NodeKind.RETURN) {
        inlineValue = first.returnValue();
      }

      // Otherwise, this statement must be a lone expression statement
      else if (first.kind == Skew.NodeKind.EXPRESSION && first.nextSibling() == null) {
        inlineValue = first.expressionValue();
      }

      if (inlineValue != null) {
        // Count the number of times each symbol is observed. Argument
        // variables that are used more than once may need a let statement
        // to avoid changing the semantics of the call site. For now, just
        // only inline functions where each argument is used exactly once.
        var argumentCounts = {};

        for (var i1 = 0, list = symbol.$arguments, count2 = list.length; i1 < count2; ++i1) {
          var argument = list[i1];
          argumentCounts[argument.id] = 0;
        }

        if (Skew.Inlining.InliningGraph._recursivelyCountArgumentUses(inlineValue, argumentCounts)) {
          var unusedArguments1 = [];
          var isSimpleSubstitution = true;

          for (var i2 = 0, count3 = symbol.$arguments.length; i2 < count3; ++i2) {
            var count = argumentCounts[symbol.$arguments[i2].id];

            if (count == 0) {
              unusedArguments1.push(i2);
            }

            else if (count != 1) {
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
  Skew.Inlining.InliningGraph._recursivelyCountArgumentUses = function(node, argumentCounts) {
    // Prevent inlining of lambda expressions. They have their own function
    // symbols that reference the original block and won't work with cloning.
    // Plus inlining lambdas leads to code bloat.
    if (node.kind == Skew.NodeKind.LAMBDA) {
      return false;
    }

    // Inlining is impossible at this node if it's impossible for any child node
    for (var child = node.firstChild(); child != null; child = child.nextSibling()) {
      if (!Skew.Inlining.InliningGraph._recursivelyCountArgumentUses(child, argumentCounts)) {
        return false;
      }
    }

    var symbol = node.symbol;

    if (symbol != null) {
      var count = in_IntMap.get(argumentCounts, symbol.id, -1);

      if (count != -1) {
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

  Skew.InterfaceRemovalPass = function() {
    Skew.Pass.call(this);
    this._interfaceImplementations = {};
    this._interfaces = [];
  };

  __extends(Skew.InterfaceRemovalPass, Skew.Pass);

  Skew.InterfaceRemovalPass.prototype.kind = function() {
    return Skew.PassKind.INTERFACE_REMOVAL;
  };

  Skew.InterfaceRemovalPass.prototype.run = function(context) {
    this._scanForInterfaces(context.global);

    for (var i2 = 0, list2 = this._interfaces, count2 = list2.length; i2 < count2; ++i2) {
      var symbol = list2[i2];

      if (symbol.isImportedOrExported()) {
        continue;
      }

      var implementations = in_IntMap.get(this._interfaceImplementations, symbol.id, null);

      if (implementations == null || implementations.length == 1) {
        symbol.kind = Skew.SymbolKind.OBJECT_NAMESPACE;

        // Remove this interface from its implementation
        if (implementations != null) {
          var object = implementations[0];

          for (var i = 0, list = object.interfaceTypes, count = list.length; i < count; ++i) {
            var type = list[i];

            if (type.symbol == symbol) {
              in_List.removeOne(object.interfaceTypes, type);
              break;
            }
          }

          // Mark these symbols as forwarded, which is used by the globalization
          // pass and the JavaScript emitter to ignore this interface
          for (var i1 = 0, list1 = symbol.functions, count1 = list1.length; i1 < count1; ++i1) {
            var $function = list1[i1];

            if ($function.implementations != null) {
              $function.forwardTo = $function.implementations[0];
            }
          }

          symbol.forwardTo = object;
        }
      }
    }
  };

  Skew.InterfaceRemovalPass.prototype._scanForInterfaces = function(symbol) {
    for (var i = 0, list = symbol.objects, count = list.length; i < count; ++i) {
      var object = list[i];
      this._scanForInterfaces(object);
    }

    if (symbol.kind == Skew.SymbolKind.OBJECT_INTERFACE) {
      this._interfaces.push(symbol);
    }

    if (symbol.interfaceTypes != null) {
      for (var i1 = 0, list1 = symbol.interfaceTypes, count1 = list1.length; i1 < count1; ++i1) {
        var type = list1[i1];
        var key = type.symbol.id;
        var implementations = in_IntMap.get(this._interfaceImplementations, key, null);

        if (implementations == null) {
          implementations = [];
          this._interfaceImplementations[key] = implementations;
        }

        implementations.push(symbol);
      }
    }
  };

  Skew.LambdaLiftingPass = function() {
    Skew.Pass.call(this);
  };

  __extends(Skew.LambdaLiftingPass, Skew.Pass);

  Skew.LambdaLiftingPass.prototype.kind = function() {
    return Skew.PassKind.LAMBDA_LIFTING;
  };

  Skew.LambdaLiftingPass.prototype.run = function(context) {
    new Skew.LambdaLifter(context.global).visitObject(context.global);
  };

  Skew.LambdaLifter = function(global) {
    this.global = global;
    this.stack = [];
    this.enclosingFunction = null;
  };

  Skew.LambdaLifter.prototype.visitObject = function(symbol) {
    for (var i = 0, list = symbol.objects, count = list.length; i < count; ++i) {
      var object = list[i];
      this.visitObject(object);
    }

    for (var i1 = 0, list1 = symbol.functions, count1 = list1.length; i1 < count1; ++i1) {
      var $function = list1[i1];
      this.enclosingFunction = $function;
      this.visitFunction($function);
      this.enclosingFunction = null;
    }

    for (var i2 = 0, list2 = symbol.variables, count2 = list2.length; i2 < count2; ++i2) {
      var variable = list2[i2];
      this.visitVariable(variable);
    }
  };

  Skew.LambdaLifter.prototype.visitFunction = function(symbol) {
    if (symbol.block != null) {
      var scope = new Skew.LambdaLifter.CaptureScope(Skew.LambdaLifter.CaptureKind.FUNCTION, symbol.block, null);

      for (var i = 0, list = symbol.$arguments, count = list.length; i < count; ++i) {
        var argument = list[i];
        scope.define(argument, null);
      }

      this.stack.push(scope);
      this.visit(symbol.block);
      this.processCaptureScope();
    }
  };

  Skew.LambdaLifter.prototype.visitVariable = function(symbol) {
    if (symbol.value != null) {
      this.visit(symbol.value);
    }
  };

  Skew.LambdaLifter.prototype.visit = function(node) {
    var kind = node.kind;
    var symbol = node.symbol;
    var oldEnclosingFunction = this.enclosingFunction;

    if (kind == Skew.NodeKind.LAMBDA) {
      this.stack.push(new Skew.LambdaLifter.CaptureScope(Skew.LambdaLifter.CaptureKind.LAMBDA, node, this.stack.length == 0 ? null : in_List.last(this.stack)));
      this.enclosingFunction = node.symbol.asFunctionSymbol();
    }

    else if (Skew.in_NodeKind.isLoop(kind)) {
      this.stack.push(new Skew.LambdaLifter.CaptureScope(Skew.LambdaLifter.CaptureKind.LOOP, node, in_List.last(this.stack)));
    }

    else if (kind == Skew.NodeKind.VARIABLE) {
      in_List.last(this.stack).define(symbol.asVariableSymbol(), node);
    }

    else if (symbol != null && (symbol.kind == Skew.SymbolKind.VARIABLE_ARGUMENT || symbol.kind == Skew.SymbolKind.VARIABLE_LOCAL)) {
      assert(node.kind == Skew.NodeKind.NAME);
      in_List.last(this.stack).recordUse(symbol.asVariableSymbol(), node, this.enclosingFunction);
    }

    for (var child = node.firstChild(); child != null; child = child.nextSibling()) {
      this.visit(child);
    }

    if (kind == Skew.NodeKind.LAMBDA) {
      this.processCaptureScope();
      this.enclosingFunction = oldEnclosingFunction;
    }

    else if (Skew.in_NodeKind.isLoop(kind)) {
      this.processCaptureScope();
    }
  };

  Skew.LambdaLifter.prototype.createClass = function(name) {
    var object = new Skew.ObjectSymbol(Skew.SymbolKind.OBJECT_CLASS, this.global.scope.generateName(name));
    object.scope = new Skew.ObjectScope(this.global.scope, object);
    object.resolvedType = new Skew.Type(Skew.TypeKind.SYMBOL, object);
    object.parent = this.global;
    this.global.objects.push(object);
    return object;
  };

  Skew.LambdaLifter.prototype.createConstructor = function(object) {
    var $function = this.createFunction(object, Skew.SymbolKind.FUNCTION_CONSTRUCTOR, 'new');
    $function.resolvedType.returnType = object.resolvedType;
    return $function;
  };

  Skew.LambdaLifter.prototype.createFunction = function(object, kind, name) {
    var $function = new Skew.FunctionSymbol(kind, name);
    $function.resolvedType = new Skew.Type(Skew.TypeKind.SYMBOL, $function);
    $function.parent = object;
    $function.block = new Skew.Node(Skew.NodeKind.BLOCK);
    $function.scope = new Skew.FunctionScope(object.scope, $function);
    $function.$this = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_LOCAL, 'self');
    $function.$this.resolvedType = object.resolvedType;
    object.functions.push($function);
    return $function;
  };

  Skew.LambdaLifter.prototype.processCaptureScope = function() {
    var scope = this.stack.pop();

    // Convert lambdas to function objects
    if (scope.kind == Skew.LambdaLifter.CaptureKind.LAMBDA) {
      var lambda = this.createClass('Lambda');
      var lambdaConstructor = this.createConstructor(lambda);
      var lambdaRun = this.createFunction(lambda, Skew.SymbolKind.FUNCTION_INSTANCE, 'run');
      var lambdaCall = Skew.Node.createSymbolCall(lambdaConstructor);
      lambdaRun.block = scope.node.symbol.asFunctionSymbol().block.remove();

      // TODO: This needs to be called
      lambdaRun.flags |= Skew.Symbol.IS_EXPORTED;
      scope.node.become(lambdaCall);
    }

    // Scopes only need environments when at least one variable is captured
    if (scope.environment == null) {
      return;
    }

    // Create a new object to hold the memory for the environment
    var environment = this.createClass('Environment');
    var $constructor = this.createConstructor(environment);
    scope.environment.resolvedType = environment.resolvedType;

    // All captured arguments will be appended as arguments to the constructor call
    var constructorCall = Skew.Node.createSymbolCall($constructor);
    scope.environment.value = constructorCall;

    for (var i1 = 0, list1 = in_IntMap.values(scope.variableInfo), count1 = list1.length; i1 < count1; ++i1) {
      var info = list1[i1];

      if (!info.isCaptured) {
        continue;
      }

      var symbol = info.symbol;
      var member = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_INSTANCE, symbol.name);
      member.parent = environment;
      member.resolvedType = symbol.resolvedType;
      environment.variables.push(member);

      // Change the definition into an assignment
      var assignment = Skew.Node.createExpression(Skew.Node.createBinary(Skew.NodeKind.ASSIGN, Skew.Node.createMemberReference(Skew.Node.createSymbolReference(scope.environment), member), symbol.value != null ? symbol.value.remove() : Skew.Node.createSymbolReference(symbol)));

      // Local variables can change into assignments
      var definition = info.definition;

      if (definition != null) {
        definition.replaceVariableWith(assignment);
      }

      // Assignments for argument variables must go inside the environment constructor
      else {
        assert(symbol.kind == Skew.SymbolKind.VARIABLE_ARGUMENT);

        // Add an argument to the constructor
        var argument = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_ARGUMENT, symbol.name);
        argument.resolvedType = symbol.resolvedType;
        $constructor.$arguments.push(argument);

        // Copy the value from the argument to the member
        $constructor.block.appendChild(Skew.Node.createExpression(Skew.Node.createBinary(Skew.NodeKind.ASSIGN, Skew.Node.createMemberReference(Skew.Node.createSymbolReference($constructor.$this), member), Skew.Node.createSymbolReference(argument))));

        // Pass the initial value of the captured variable to the constructor
        constructorCall.appendChild(Skew.Node.createSymbolReference(symbol));
      }

      // Rewrite all references to this variable as members of the environment object
      for (var i = 0, list = info.uses, count = list.length; i < count; ++i) {
        var node = list[i];
        node.replaceWith(Skew.Node.createMemberReference(Skew.Node.createSymbolReference(scope.environment), member));
      }
    }

    // Create the environment object
    var initializer = new Skew.Node(Skew.NodeKind.VARIABLES).appendChild(Skew.Node.createVariable(scope.environment));

    switch (scope.kind) {
      case Skew.LambdaLifter.CaptureKind.FUNCTION: {
        scope.node.prependChild(initializer);
        break;
      }

      case Skew.LambdaLifter.CaptureKind.LAMBDA: {
        scope.node.lambdaBlock().appendChild(initializer);
        break;
      }

      default: {
        scope.node.parent().insertChildBefore(scope.node.parent(), initializer);
        break;
      }
    }
  };

  Skew.LambdaLifter.VariableInfo = function(symbol, definition) {
    this.symbol = symbol;
    this.definition = definition;
    this.uses = [];
    this.isCaptured = false;
  };

  Skew.LambdaLifter.CaptureKind = {
    FUNCTION: 0,
    LAMBDA: 1,
    LOOP: 2
  };

  Skew.LambdaLifter.CaptureScope = function(kind, node, parent) {
    this.kind = kind;
    this.node = node;
    this.parent = parent;
    this.environment = null;
    this.variableInfo = {};
  };

  Skew.LambdaLifter.CaptureScope.prototype.define = function(symbol, node) {
    this.variableInfo[symbol.id] = new Skew.LambdaLifter.VariableInfo(symbol, node);
  };

  Skew.LambdaLifter.CaptureScope.prototype.recordUse = function(symbol, node, enclosingFunction) {
    var isCaptured = false;

    for (var scope = this; scope != null; scope = scope.parent) {
      var info = in_IntMap.get(scope.variableInfo, symbol.id, null);

      if (info != null) {
        if (isCaptured) {
          info.isCaptured = true;

          if (scope.environment == null) {
            scope.environment = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_LOCAL, enclosingFunction.scope.generateName('env'));
          }
        }

        info.uses.push(node);
        return;
      }

      if (scope.kind == Skew.LambdaLifter.CaptureKind.LAMBDA) {
        isCaptured = true;
      }
    }
  };

  Skew.MergingPass = function() {
    Skew.Pass.call(this);
  };

  __extends(Skew.MergingPass, Skew.Pass);

  Skew.MergingPass.prototype.kind = function() {
    return Skew.PassKind.MERGING;
  };

  Skew.MergingPass.prototype.run = function(context) {
    Skew.Merging.mergeObject(context.log, null, context.global, context.global);
  };

  Skew.Merging = {};

  Skew.Merging.mergeObject = function(log, parent, target, symbol) {
    target.scope = new Skew.ObjectScope(parent != null ? parent.scope : null, target);
    symbol.scope = target.scope;
    symbol.parent = parent;

    if (symbol.parameters != null) {
      for (var i = 0, list = symbol.parameters, count = list.length; i < count; ++i) {
        var parameter = list[i];
        parameter.scope = parent.scope;
        parameter.parent = target;

        // Type parameters cannot merge with any members
        var other = in_StringMap.get(target.members, parameter.name, null);

        if (other != null) {
          log.semanticErrorDuplicateSymbol(parameter.range, parameter.name, other.range);
          continue;
        }

        target.members[parameter.name] = parameter;
      }
    }

    Skew.Merging.mergeObjects(log, target, symbol.objects);
    Skew.Merging.mergeFunctions(log, target, symbol.functions, Skew.Merging.MergeBehavior.NORMAL);
    Skew.Merging.mergeVariables(log, target, symbol.variables);
  };

  Skew.Merging.mergeObjects = function(log, parent, children) {
    var members = parent.members;
    in_List.removeIf(children, function(child) {
      var other = in_StringMap.get(members, child.name, null);

      // Simple case: no merging
      if (other == null) {
        members[child.name] = child;
        Skew.Merging.mergeObject(log, parent, child, child);
        return false;
      }

      // Can only merge with another of the same kind or with a namespace
      if (other.kind == Skew.SymbolKind.OBJECT_NAMESPACE) {
        other.kind = child.kind;
      }

      else if (child.kind != Skew.SymbolKind.OBJECT_NAMESPACE && child.kind != other.kind) {
        log.semanticErrorDuplicateSymbol(child.range, child.name, other.range);
        return true;
      }

      // Classes can only have one base type
      var object = other.asObjectSymbol();

      if (child.$extends != null) {
        if (object.$extends != null) {
          log.semanticErrorDuplicateBaseType(child.$extends.range, child.name, object.$extends.range);
          return true;
        }

        object.$extends = child.$extends;
      }

      // Merge base interfaces
      if (child.implements != null) {
        if (object.implements != null) {
          in_List.append1(object.implements, child.implements);
        }

        else {
          object.implements = child.implements;
        }
      }

      // Cannot merge two objects that both have type parameters
      if (child.parameters != null && object.parameters != null) {
        log.semanticErrorDuplicateTypeParameters(Skew.Merging.rangeOfParameters(child.parameters), child.name, Skew.Merging.rangeOfParameters(object.parameters));
        return true;
      }

      // Merge "child" into "other"
      Skew.Merging.mergeObject(log, parent, object, child);
      object.mergeAnnotationsAndCommentsFrom(child);
      in_List.append1(object.objects, child.objects);
      in_List.append1(object.functions, child.functions);
      in_List.append1(object.variables, child.variables);

      if (child.parameters != null) {
        object.parameters = child.parameters;
      }

      if (child.guards != null) {
        if (object.guards == null) {
          object.guards = [];
        }

        for (var i = 0, list = child.guards, count = list.length; i < count; ++i) {
          var guard = list[i];

          for (var g = guard; g != null; g = g.elseGuard) {
            g.parent = object;
            g.contents.parent = object;
          }

          object.guards.push(guard);
        }
      }

      return true;
    });
  };

  Skew.Merging.mergeFunctions = function(log, parent, children, behavior) {
    var members = parent.members;

    for (var i1 = 0, list1 = children, count1 = list1.length; i1 < count1; ++i1) {
      var child = list1[i1];
      var other = in_StringMap.get(members, child.name, null);

      // Create a scope for this function's type parameters
      if (behavior == Skew.Merging.MergeBehavior.NORMAL) {
        var scope = new Skew.FunctionScope(parent.scope, child);
        child.scope = scope;
        child.parent = parent;

        if (child.parameters != null) {
          for (var i = 0, list = child.parameters, count = list.length; i < count; ++i) {
            var parameter = list[i];
            parameter.scope = scope;
            parameter.parent = child;

            // Type parameters cannot merge with other parameters on this function
            var previous = in_StringMap.get(scope.parameters, parameter.name, null);

            if (previous != null) {
              log.semanticErrorDuplicateSymbol(parameter.range, parameter.name, previous.range);
              continue;
            }

            scope.parameters[parameter.name] = parameter;
          }
        }
      }

      // Simple case: no merging
      if (other == null) {
        members[child.name] = child;
        continue;
      }

      var childKind = Skew.Merging.overloadedKind(child.kind);
      var otherKind = Skew.Merging.overloadedKind(other.kind);

      // Merge with another symbol of the same overloaded group type
      if (childKind != otherKind || !Skew.in_SymbolKind.isOverloadedFunction(childKind)) {
        if (behavior == Skew.Merging.MergeBehavior.NORMAL) {
          log.semanticErrorDuplicateSymbol(child.range, child.name, other.range);
        }

        else {
          log.semanticErrorBadOverride(other.range, other.name, parent.baseType, child.range);
        }

        continue;
      }

      // Merge with a group of overloaded functions
      if (Skew.in_SymbolKind.isOverloadedFunction(other.kind)) {
        other.asOverloadedFunctionSymbol().symbols.push(child);

        if (behavior == Skew.Merging.MergeBehavior.NORMAL) {
          child.overloaded = other.asOverloadedFunctionSymbol();
        }

        continue;
      }

      // Create an overload group
      var overloaded = new Skew.OverloadedFunctionSymbol(childKind, child.name, [other.asFunctionSymbol(), child]);
      members[child.name] = overloaded;
      other.asFunctionSymbol().overloaded = overloaded;

      if (behavior == Skew.Merging.MergeBehavior.NORMAL) {
        child.overloaded = overloaded;
      }

      overloaded.scope = parent.scope;
      overloaded.parent = parent;
    }
  };

  Skew.Merging.overloadedKind = function(kind) {
    return kind == Skew.SymbolKind.FUNCTION_CONSTRUCTOR || kind == Skew.SymbolKind.FUNCTION_GLOBAL ? Skew.SymbolKind.OVERLOADED_GLOBAL : kind == Skew.SymbolKind.FUNCTION_ANNOTATION ? Skew.SymbolKind.OVERLOADED_ANNOTATION : kind == Skew.SymbolKind.FUNCTION_INSTANCE ? Skew.SymbolKind.OVERLOADED_INSTANCE : kind;
  };

  Skew.Merging.mergeVariables = function(log, parent, children) {
    var members = parent.members;

    for (var i = 0, list = children, count = list.length; i < count; ++i) {
      var child = list[i];
      var other = in_StringMap.get(members, child.name, null);
      child.scope = new Skew.VariableScope(parent.scope, child);
      child.parent = parent;

      // Variables never merge
      if (other != null) {
        log.semanticErrorDuplicateSymbol(child.range, child.name, other.range);
        continue;
      }

      members[child.name] = child;
    }
  };

  Skew.Merging.rangeOfParameters = function(parameters) {
    return Skew.Range.span(parameters[0].range, in_List.last(parameters).range);
  };

  Skew.Merging.MergeBehavior = {
    NORMAL: 0,
    INTO_DERIVED_CLASS: 1
  };

  Skew.MotionPass = function() {
    Skew.Pass.call(this);
  };

  __extends(Skew.MotionPass, Skew.Pass);

  Skew.MotionPass.prototype.kind = function() {
    return Skew.PassKind.MOTION;
  };

  Skew.MotionPass.prototype.run = function(context) {
    var namespaces = {};
    Skew.Motion.symbolMotion(context.global, context.options, namespaces);

    // Avoid mutation during the iteration above
    for (var i = 0, list = in_IntMap.values(namespaces), count = list.length; i < count; ++i) {
      var pair = list[i];
      pair.parent.objects.push(pair.child);
    }
  };

  Skew.Motion = {};

  Skew.Motion.symbolMotion = function(symbol, options, namespaces) {
    // Move non-imported objects off imported objects
    in_List.removeIf(symbol.objects, function(object) {
      Skew.Motion.symbolMotion(object, options, namespaces);

      if (symbol.isImported() && !object.isImported() || !options.target.supportsNestedTypes() && !Skew.in_SymbolKind.isNamespaceOrGlobal(symbol.kind)) {
        Skew.Motion.moveSymbolIntoNewNamespace(object, namespaces).objects.push(object);
        return true;
      }

      return false;
    });

    // Move global functions with implementations off of imported objects and interfaces
    in_List.removeIf(symbol.functions, function($function) {
      if ($function.kind == Skew.SymbolKind.FUNCTION_GLOBAL && (symbol.isImported() && !$function.isImported() || symbol.kind == Skew.SymbolKind.OBJECT_INTERFACE)) {
        Skew.Motion.moveSymbolIntoNewNamespace($function, namespaces).functions.push($function);
        return true;
      }

      return false;
    });

    // Move stuff off of enums
    if (symbol.kind == Skew.SymbolKind.OBJECT_ENUM) {
      symbol.objects.forEach(function(object) {
        Skew.Motion.moveSymbolIntoNewNamespace(object, namespaces).objects.push(object);
      });
      symbol.functions.forEach(function($function) {
        Skew.Motion.moveSymbolIntoNewNamespace($function, namespaces).functions.push($function);
      });
      in_List.removeIf(symbol.variables, function(variable) {
        if (variable.kind != Skew.SymbolKind.VARIABLE_ENUM) {
          Skew.Motion.moveSymbolIntoNewNamespace(variable, namespaces).variables.push(variable);
          return true;
        }

        return false;
      });
      symbol.objects = [];
      symbol.functions = [];
    }

    // Move variables off of interfaces
    else if (symbol.kind == Skew.SymbolKind.OBJECT_INTERFACE) {
      symbol.variables.forEach(function(variable) {
        Skew.Motion.moveSymbolIntoNewNamespace(variable, namespaces).variables.push(variable);
      });
      symbol.variables = [];
    }
  };

  Skew.Motion.moveSymbolIntoNewNamespace = function(symbol, namespaces) {
    var parent = symbol.parent;
    var target = in_IntMap.get(namespaces, parent.id, null);
    var object = target != null ? target.child.asObjectSymbol() : null;

    // Create a parallel namespace next to the parent
    if (target == null) {
      var common = parent.parent.asObjectSymbol();
      object = new Skew.ObjectSymbol(Skew.SymbolKind.OBJECT_NAMESPACE, 'in_' + parent.name);
      object.scope = new Skew.ObjectScope(common.scope, object);
      object.parent = common;
      target = new Skew.Motion.Namespace(common, object);
      namespaces[parent.id] = target;
    }

    // Inflate functions with type parameters from the parent (TODO: Need to inflate call sites too)
    if (Skew.in_SymbolKind.isFunction(symbol.kind) && parent.asObjectSymbol().parameters != null) {
      var $function = symbol.asFunctionSymbol();

      if ($function.parameters == null) {
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

  Skew.RenamingPass = function() {
    Skew.Pass.call(this);
  };

  __extends(Skew.RenamingPass, Skew.Pass);

  Skew.RenamingPass.prototype.kind = function() {
    return Skew.PassKind.RENAMING;
  };

  Skew.RenamingPass.prototype.run = function(context) {
    Skew.Renaming.renameGlobal(context.log, context.global);
  };

  Skew.Renaming = {};

  Skew.Renaming.renameGlobal = function(log, global) {
    // Collect all functions
    var functions = [];
    Skew.Renaming.collectFunctionAndRenameObjectsAndVariables(global, functions);

    // Compute naming groups
    var labels = new Skew.UnionFind().allocate2(functions.length);
    var groups = [];

    for (var i = 0, count1 = functions.length; i < count1; ++i) {
      functions[i].namingGroup = i;
      groups.push(null);
    }

    for (var i2 = 0, list1 = functions, count3 = list1.length; i2 < count3; ++i2) {
      var $function = list1[i2];

      if ($function.overridden != null) {
        labels.union($function.namingGroup, $function.overridden.namingGroup);
      }

      if ($function.implementations != null) {
        for (var i1 = 0, list = $function.implementations, count2 = list.length; i1 < count2; ++i1) {
          var implementation = list[i1];
          labels.union($function.namingGroup, implementation.namingGroup);
        }
      }
    }

    for (var i3 = 0, list2 = functions, count4 = list2.length; i3 < count4; ++i3) {
      var function1 = list2[i3];
      var label = labels.find(function1.namingGroup);
      var group = groups[label];
      function1.namingGroup = label;

      if (group == null) {
        group = [];
        groups[label] = group;
      }

      else {
        assert(function1.name == group[0].name);
      }

      group.push(function1);
    }

    // Rename stuff
    for (var i7 = 0, list6 = groups, count8 = list6.length; i7 < count8; ++i7) {
      var group1 = list6[i7];

      if (group1 == null) {
        continue;
      }

      var isImportedOrExported = false;
      var shouldRename = false;
      var rename = null;

      for (var i4 = 0, list3 = group1, count5 = list3.length; i4 < count5; ++i4) {
        var function2 = list3[i4];

        if (function2.isImportedOrExported()) {
          isImportedOrExported = true;
        }

        // Make sure there isn't more than one renamed symbol
        if (function2.rename != null) {
          if (rename != null && rename != function2.rename) {
            log.semanticErrorDuplicateRename(function2.range, function2.name, rename, function2.rename);
          }

          rename = function2.rename;
        }

        // Rename functions with unusual names and make sure overloaded functions have unique names
        if (!shouldRename && (Skew.Renaming.isInvalidIdentifier(function2.name) || function2.overloaded != null && function2.overloaded.symbols.length > 1)) {
          shouldRename = true;
        }
      }

      // Bake in the rename annotation now
      if (rename != null) {
        for (var i5 = 0, list4 = group1, count6 = list4.length; i5 < count6; ++i5) {
          var function3 = list4[i5];
          function3.flags |= Skew.Symbol.IS_RENAMED;
          function3.name = rename;
          function3.rename = null;
        }

        continue;
      }

      // One function with a pinned name causes the whole group to avoid renaming
      if (!shouldRename || isImportedOrExported) {
        continue;
      }

      var first = group1[0];
      var $arguments = first.$arguments.length;
      var count = 0;
      var start = first.name;

      if (($arguments == 0 || $arguments == 1 && first.kind == Skew.SymbolKind.FUNCTION_GLOBAL) && start in Skew.Renaming.unaryPrefixes) {
        start = Skew.Renaming.unaryPrefixes[start];
      }

      else if (start in Skew.Renaming.prefixes) {
        start = Skew.Renaming.prefixes[start];
      }

      else {
        if (in_string.startsWith(start, '@')) {
          start = start.slice(1);
        }

        if (Skew.Renaming.isInvalidIdentifier(start)) {
          start = Skew.Renaming.generateValidIdentifier(start);
        }
      }

      // Generate a new name
      var name = start;

      while (group1.some(function($function) {
        return $function.scope.parent.isNameUsed(name);
      })) {
        ++count;
        name = start + count.toString();
      }

      for (var i6 = 0, list5 = group1, count7 = list5.length; i6 < count7; ++i6) {
        var function4 = list5[i6];
        function4.scope.parent.reserveName(name, null);
        function4.name = name;
      }
    }
  };

  Skew.Renaming.collectFunctionAndRenameObjectsAndVariables = function(symbol, functions) {
    for (var i = 0, list = symbol.objects, count = list.length; i < count; ++i) {
      var object = list[i];

      if (object.rename != null) {
        object.name = object.rename;
        object.rename = null;
      }

      Skew.Renaming.collectFunctionAndRenameObjectsAndVariables(object, functions);
    }

    for (var i1 = 0, list1 = symbol.functions, count1 = list1.length; i1 < count1; ++i1) {
      var $function = list1[i1];
      functions.push($function);
    }

    for (var i2 = 0, list2 = symbol.variables, count2 = list2.length; i2 < count2; ++i2) {
      var variable = list2[i2];

      if (variable.rename != null) {
        variable.name = variable.rename;
        variable.rename = null;
      }
    }
  };

  Skew.Renaming.isAlpha = function(c) {
    return c >= 97 && c <= 122 || c >= 65 && c <= 90 || c == 95;
  };

  Skew.Renaming.isNumber = function(c) {
    return c >= 48 && c <= 57;
  };

  Skew.Renaming.isInvalidIdentifier = function(name) {
    for (var i = 0, count = name.length; i < count; ++i) {
      var c = name.charCodeAt(i);

      if (!Skew.Renaming.isAlpha(c) && (i == 0 || !Skew.Renaming.isNumber(c))) {
        return true;
      }
    }

    return false;
  };

  Skew.Renaming.generateValidIdentifier = function(name) {
    var text = '';

    for (var i = 0, count = name.length; i < count; ++i) {
      var c = name.charCodeAt(i);

      if (Skew.Renaming.isAlpha(c) || Skew.Renaming.isNumber(c)) {
        text += name[i];
      }
    }

    if (in_string.endsWith(name, '=')) {
      return 'set' + text.slice(0, 1).toUpperCase() + text.slice(1);
    }

    return text == '' || !Skew.Renaming.isAlpha(text.charCodeAt(0)) ? '_' + text : text;
  };

  Skew.ResolvingPass = function() {
    Skew.Pass.call(this);
  };

  __extends(Skew.ResolvingPass, Skew.Pass);

  Skew.ResolvingPass.prototype.kind = function() {
    return Skew.PassKind.RESOLVING;
  };

  Skew.ResolvingPass.prototype.run = function(context) {
    context.cache.loadGlobals(context.log, context.global);

    if (!context.log.hasErrors()) {
      var resolver = new Skew.Resolving.Resolver(context.global, context.options, in_StringMap.clone(context.options.defines), context.cache, context.log);
      resolver.constantFolder = new Skew.Folding.ConstantFolder(context.cache, context.options, function(symbol) {
        resolver.initializeSymbol(symbol);
      });
      resolver.initializeGlobals();
      resolver.iterativelyMergeGuards();
      resolver.resolveGlobal();
      resolver.removeObsoleteFunctions(context.global);
    }
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
    this.localVariableStatistics = {};
    this.controlFlow = new Skew.ControlFlowAnalyzer();
    this.constantFolder = null;
    this.isMergingGuards = true;
  };

  Skew.Resolving.Resolver.prototype.initializeSymbol = function(symbol) {
    // The scope should have been set by the merging pass (or by this pass for local variables)
    assert(symbol.scope != null);

    // Only initialize the symbol once
    if (symbol.state == Skew.SymbolState.UNINITIALIZED) {
      symbol.state = Skew.SymbolState.INITIALIZING;

      switch (symbol.kind) {
        case Skew.SymbolKind.OBJECT_CLASS:
        case Skew.SymbolKind.OBJECT_ENUM:
        case Skew.SymbolKind.OBJECT_GLOBAL:
        case Skew.SymbolKind.OBJECT_INTERFACE:
        case Skew.SymbolKind.OBJECT_NAMESPACE:
        case Skew.SymbolKind.OBJECT_WRAPPED: {
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

        case Skew.SymbolKind.VARIABLE_ARGUMENT:
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

      assert(symbol.resolvedType != null);
      symbol.state = Skew.SymbolState.INITIALIZED;

      if (Skew.in_SymbolKind.isFunction(symbol.kind)) {
        var $function = symbol.asFunctionSymbol();
        var overloaded = $function.overloaded;

        // After initializing a function symbol, ensure the entire overload set is initialized
        if (overloaded != null && overloaded.state == Skew.SymbolState.UNINITIALIZED) {
          this.initializeSymbol(overloaded);
        }
      }
    }

    // Detect cyclic symbol references such as "foo foo;"
    else if (symbol.state == Skew.SymbolState.INITIALIZING) {
      this.log.semanticErrorCyclicDeclaration(symbol.range, symbol.name);
      symbol.resolvedType = Skew.Type.DYNAMIC;
    }
  };

  Skew.Resolving.Resolver.prototype.validateEntryPoint = function(symbol) {
    // Detect duplicate entry points
    if (this.cache.entryPointSymbol != null) {
      this.log.semanticErrorDuplicateEntryPoint(symbol.range, this.cache.entryPointSymbol.range);
      return;
    }

    this.cache.entryPointSymbol = symbol;

    // Only recognize a few entry point types
    var type = symbol.resolvedType;

    if (type != Skew.Type.DYNAMIC) {
      var argumentTypes = type.argumentTypes;

      // The argument list must be empty or one argument of type "List<string>"
      if (argumentTypes.length > 1 || argumentTypes.length == 1 && argumentTypes[0] != this.cache.createListType(this.cache.stringType)) {
        this.log.semanticErrorInvalidEntryPointArguments(Skew.Range.span(symbol.$arguments[0].range, in_List.last(symbol.$arguments).type.range), symbol.name);
      }

      // The return type must be nothing or "int"
      else if (type.returnType != null && type.returnType != this.cache.intType) {
        this.log.semanticErrorInvalidEntryPointReturnType(symbol.returnType.range, symbol.name);
      }
    }
  };

  Skew.Resolving.Resolver.prototype.resolveDefines = function(symbol) {
    var key = symbol.fullName();
    var define = in_StringMap.get(this.defines, key, null);

    if (define == null) {
      return;
    }

    // Remove the define so we can tell what defines weren't used later on
    delete this.defines[key];
    var type = symbol.resolvedType;
    var range = define.value;
    var value = range.toString();
    var node = null;

    // Special-case booleans
    if (type == this.cache.boolType) {
      if (value == 'true' || value == 'false') {
        node = new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.BoolContent(value == 'true'));
      }
    }

    // Special-case doubles
    else if (type == this.cache.doubleType) {
      var number = +value;

      if (!isNaN(number)) {
        node = new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.DoubleContent(number));
      }
    }

    // Special-case strings
    else if (type == this.cache.stringType) {
      node = new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.StringContent(value));
    }

    // Special-case enums
    else if (type.isEnum()) {
      node = new Skew.Node(Skew.NodeKind.DOT).withContent(new Skew.StringContent(value)).appendChild(null);
    }

    // Integers can also apply to doubles
    if (node == null && this.cache.isNumeric(type)) {
      var box = Skew.Parsing.parseIntLiteral(value);

      if (box != null) {
        node = new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.IntContent(box.value));
      }
    }

    // Stop if anything failed above
    if (node == null) {
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
    if (parent != null) {
      symbol.flags |= parent.flags & (Skew.in_SymbolKind.isFunction(symbol.kind) && symbol.asFunctionSymbol().block != null ? Skew.Symbol.IS_EXPORTED : Skew.Symbol.IS_IMPORTED | Skew.Symbol.IS_EXPORTED);
    }

    // Resolve annotations on this symbol after annotation inheritance. Don't
    // use removeIf() since this annotation list may be shared elsewhere.
    if (annotations != null) {
      symbol.annotations = annotations.filter(function(annotation) {
        return self.resolveAnnotation(annotation, symbol);
      });
    }

    // Protected access used to be an annotation. It's now indicated with just
    // a leading underscore.
    if (in_string.startsWith(symbol.name, '_') && !Skew.in_SymbolKind.isLocal(symbol.kind)) {
      symbol.flags |= Skew.Symbol.IS_PROTECTED;
    }
  };

  Skew.Resolving.Resolver.prototype.resolveParameters = function(parameters) {
    if (parameters != null) {
      for (var i = 0, list = parameters, count = list.length; i < count; ++i) {
        var parameter = list[i];
        this.resolveParameter(parameter);
      }
    }
  };

  Skew.Resolving.Resolver.prototype.initializeParameter = function(symbol) {
    if (symbol.resolvedType == null) {
      symbol.resolvedType = new Skew.Type(Skew.TypeKind.SYMBOL, symbol);
    }

    this.resolveAnnotations(symbol);
  };

  Skew.Resolving.Resolver.prototype.resolveParameter = function(symbol) {
    this.initializeSymbol(symbol);
  };

  Skew.Resolving.Resolver.prototype.initializeObject = function(symbol) {
    var kind = symbol.kind;
    var $extends = symbol.$extends;
    var implements = symbol.implements;

    if (symbol.resolvedType == null) {
      symbol.resolvedType = new Skew.Type(Skew.TypeKind.SYMBOL, symbol);
    }

    this.resolveParameters(symbol.parameters);

    // Resolve the base type (only for classes and wrapped types)
    if ($extends != null) {
      this.resolveAsParameterizedType($extends, symbol.scope);
      var baseType = $extends.resolvedType;

      if (kind == Skew.SymbolKind.OBJECT_WRAPPED) {
        symbol.wrappedType = baseType;

        // Don't lose the type parameters from the base type
        symbol.resolvedType.environment = baseType.environment;
      }

      else if (kind != Skew.SymbolKind.OBJECT_CLASS || baseType != Skew.Type.DYNAMIC && (!baseType.isClass() || baseType.symbol.isValueType())) {
        this.log.semanticErrorInvalidExtends($extends.range, baseType);
      }

      else if (baseType != Skew.Type.DYNAMIC) {
        symbol.baseType = baseType;
        symbol.baseClass = baseType.symbol.asObjectSymbol();

        // Don't lose the type parameters from the base type
        symbol.resolvedType.environment = baseType.environment;

        // Copy members from the base type
        var functions = [];

        for (var i2 = 0, list1 = in_StringMap.values(symbol.baseClass.members), count1 = list1.length; i2 < count1; ++i2) {
          var member = list1[i2];
          var memberKind = member.kind;

          // Separate out functions
          if (Skew.in_SymbolKind.isFunction(memberKind)) {
            if (memberKind != Skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
              functions.push(member.asFunctionSymbol());
            }
          }

          // Include overloaded functions individually
          else if (Skew.in_SymbolKind.isOverloadedFunction(memberKind)) {
            for (var i1 = 0, list = member.asOverloadedFunctionSymbol().symbols, count = list.length; i1 < count; ++i1) {
              var $function = list[i1];

              if ($function.kind != Skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
                functions.push($function);
              }
            }
          }

          // Other kinds
          else if (!Skew.in_SymbolKind.isParameter(memberKind)) {
            var other = in_StringMap.get(symbol.members, member.name, null);

            if (other != null) {
              this.log.semanticErrorBadOverride(other.range, other.name, baseType, member.range);
            }

            else {
              symbol.members[member.name] = member;
            }
          }
        }

        Skew.Merging.mergeFunctions(this.log, symbol, functions, Skew.Merging.MergeBehavior.INTO_DERIVED_CLASS);
      }
    }

    // Wrapped types without something to wrap don't make sense
    else if (kind == Skew.SymbolKind.OBJECT_WRAPPED) {
      this.log.semanticErrorMissingWrappedType(symbol.range, symbol.fullName());
    }

    // Resolve the base interface types
    if (implements != null) {
      symbol.interfaceTypes = [];

      for (var i = 0, count2 = implements.length; i < count2; ++i) {
        var type = implements[i];
        this.resolveAsParameterizedType(type, symbol.scope);

        // Ignore the dynamic type, which will be from errors and dynamic expressions used for exports
        var interfaceType = type.resolvedType;

        if (interfaceType == Skew.Type.DYNAMIC) {
          continue;
        }

        // Only classes can derive from interfaces
        if (kind != Skew.SymbolKind.OBJECT_CLASS || !interfaceType.isInterface()) {
          this.log.semanticErrorInvalidImplements(type.range, interfaceType);
          continue;
        }

        // An interface can only be implemented once
        for (var j = 0; j < i; ++j) {
          var other1 = implements[j];

          if (other1.resolvedType == interfaceType) {
            this.log.semanticErrorDuplicateImplements(type.range, interfaceType, other1.range);
            break;
          }
        }

        symbol.interfaceTypes.push(interfaceType);
      }
    }

    // Assign values for all enums before they are initialized
    if (kind == Skew.SymbolKind.OBJECT_ENUM) {
      var nextEnumValue = 0;

      for (var i3 = 0, list2 = symbol.variables, count3 = list2.length; i3 < count3; ++i3) {
        var variable = list2[i3];

        if (variable.kind == Skew.SymbolKind.VARIABLE_ENUM) {
          variable.value = new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.IntContent(nextEnumValue)).withType(symbol.resolvedType).withRange(variable.range);
          ++nextEnumValue;
        }
      }

      symbol.flags |= Skew.Symbol.IS_VALUE_TYPE;
    }

    this.resolveAnnotations(symbol);

    // Create a default constructor if one doesn't exist
    var $constructor = in_StringMap.get(symbol.members, 'new', null);

    if (kind == Skew.SymbolKind.OBJECT_CLASS && !symbol.isImported() && $constructor == null) {
      var baseConstructor = symbol.baseClass != null ? in_StringMap.get(symbol.baseClass.members, 'new', null) : null;

      // Unwrap the overload group if present
      if (baseConstructor != null && baseConstructor.kind == Skew.SymbolKind.OVERLOADED_GLOBAL) {
        var overloaded = baseConstructor.asOverloadedFunctionSymbol();

        for (var i4 = 0, list3 = overloaded.symbols, count4 = list3.length; i4 < count4; ++i4) {
          var overload = list3[i4];

          if (overload.kind == Skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
            if (baseConstructor.kind == Skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
              // Signal that there isn't a single base constructor
              baseConstructor = null;
              break;
            }

            baseConstructor = overload;
          }
        }
      }

      // A default constructor can only be created if the base class has a single constructor
      if (symbol.baseClass == null || baseConstructor != null && baseConstructor.kind == Skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
        var generated = new Skew.FunctionSymbol(Skew.SymbolKind.FUNCTION_CONSTRUCTOR, 'new');
        generated.scope = new Skew.FunctionScope(symbol.scope, generated);
        generated.flags |= Skew.Symbol.IS_AUTOMATICALLY_GENERATED;
        generated.parent = symbol;
        generated.range = symbol.range;
        generated.overridden = baseConstructor != null ? baseConstructor.asFunctionSymbol() : null;
        symbol.functions.push(generated);
        symbol.members[generated.name] = generated;
      }
    }

    // Create a default toString if one doesn't exist
    if (kind == Skew.SymbolKind.OBJECT_ENUM && !symbol.isImported() && !('toString' in symbol.members)) {
      var generated1 = new Skew.FunctionSymbol(Skew.SymbolKind.FUNCTION_INSTANCE, 'toString');
      generated1.scope = new Skew.FunctionScope(symbol.scope, generated1);
      generated1.flags |= Skew.Symbol.IS_AUTOMATICALLY_GENERATED;
      generated1.parent = symbol;
      generated1.range = symbol.range;
      symbol.functions.push(generated1);
      symbol.members[generated1.name] = generated1;
    }
  };

  Skew.Resolving.Resolver.prototype.checkInterfacesAndAbstractStatus1 = function(object, $function) {
    assert($function.kind == Skew.SymbolKind.FUNCTION_INSTANCE);
    assert($function.state == Skew.SymbolState.INITIALIZED);

    if (!object.isAbstract() && !$function.isImported() && !$function.isObsolete() && $function.block == null) {
      object.isAbstractBecauseOf = $function;
    }
  };

  Skew.Resolving.Resolver.prototype.checkInterfacesAndAbstractStatus2 = function(symbol) {
    assert(symbol.state == Skew.SymbolState.INITIALIZED);

    if (symbol.hasCheckedInterfacesAndAbstractStatus || symbol.kind != Skew.SymbolKind.OBJECT_CLASS) {
      return;
    }

    symbol.hasCheckedInterfacesAndAbstractStatus = true;

    // Check to see if this class is abstract (as unimplemented members)
    for (var i1 = 0, list1 = in_StringMap.values(symbol.members), count1 = list1.length; i1 < count1; ++i1) {
      var member = list1[i1];

      if (member.kind == Skew.SymbolKind.OVERLOADED_INSTANCE) {
        this.initializeSymbol(member);

        for (var i = 0, list = member.asOverloadedFunctionSymbol().symbols, count = list.length; i < count; ++i) {
          var $function = list[i];
          this.checkInterfacesAndAbstractStatus1(symbol, $function);
        }
      }

      else if (member.kind == Skew.SymbolKind.FUNCTION_INSTANCE) {
        this.initializeSymbol(member);
        this.checkInterfacesAndAbstractStatus1(symbol, member.asFunctionSymbol());
      }

      if (symbol.isAbstract()) {
        break;
      }
    }

    // Check interfaces for missing implementations
    if (symbol.interfaceTypes != null) {
      for (var i4 = 0, list4 = symbol.interfaceTypes, count4 = list4.length; i4 < count4; ++i4) {
        var interfaceType = list4[i4];

        for (var i3 = 0, list3 = interfaceType.symbol.asObjectSymbol().functions, count3 = list3.length; i3 < count3; ++i3) {
          var function1 = list3[i3];

          if (function1.kind != Skew.SymbolKind.FUNCTION_INSTANCE || function1.block != null) {
            continue;
          }

          this.initializeSymbol(function1);
          var member1 = in_StringMap.get(symbol.members, function1.name, null);
          var match = null;

          // Search for a matching function
          if (member1 != null) {
            if (member1.kind == Skew.SymbolKind.OVERLOADED_INSTANCE) {
              for (var i2 = 0, list2 = member1.asOverloadedFunctionSymbol().symbols, count2 = list2.length; i2 < count2; ++i2) {
                var other = list2[i2];

                if (other.argumentOnlyType == function1.argumentOnlyType) {
                  match = other;
                  break;
                }
              }
            }

            else if (member1.kind == Skew.SymbolKind.FUNCTION_INSTANCE) {
              if (member1.asFunctionSymbol().argumentOnlyType == function1.argumentOnlyType) {
                match = member1.asFunctionSymbol();
              }
            }
          }

          // Validate use of the interface
          if (match == null) {
            this.log.semanticErrorBadInterfaceImplementation(symbol.range, symbol.resolvedType, interfaceType, function1.name, function1.range);
          }

          else if (function1.resolvedType.returnType != match.resolvedType.returnType) {
            this.log.semanticErrorBadInterfaceImplementationReturnType(match.range, match.name, interfaceType, function1.range);
          }

          else {
            if (function1.implementations == null) {
              function1.implementations = [];
            }

            function1.implementations.push(match);
          }
        }
      }
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

  // An obsolete function is one without an implementation that was dropped in
  // favor of one with an implementation:
  //
  //   namespace Foo {
  //     def foo {}
  //
  //     # This will be marked as obsolete
  //     def foo
  //   }
  //
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
    var guards = null;

    // Iterate until a fixed point is reached
    while (true) {
      guards = [];
      this.scanForGuards(this.global, guards);

      if (guards.length == 0) {
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

      if (this.log.errorCount == count) {
        this.log.semanticErrorExpectedConstant(guard.test.range);
      }
    }
  };

  Skew.Resolving.Resolver.prototype.scanForGuards = function(symbol, guards) {
    if (symbol.guards != null) {
      in_List.append1(guards, symbol.guards);
    }

    for (var i = 0, list = symbol.objects, count = list.length; i < count; ++i) {
      var object = list[i];
      this.scanForGuards(object, guards);
    }
  };

  Skew.Resolving.Resolver.prototype.reportGuardMergingFailure = function(node) {
    if (this.isMergingGuards) {
      while (node != null) {
        node.resolvedType = null;
        node = node.parent();
      }

      throw new Skew.Resolving.Resolver.GuardMergingFailure();
    }
  };

  Skew.Resolving.Resolver.prototype.attemptToResolveGuardConstant = function(node, scope) {
    assert(scope != null);

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

          if (elseGuard != null) {
            if (elseGuard.test != null) {
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
    Skew.Merging.mergeFunctions(this.log, object, symbol.functions, Skew.Merging.MergeBehavior.NORMAL);
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
    if (symbol.guards != null) {
      for (var i = 0, list = symbol.guards, count = list.length; i < count; ++i) {
        var nested = list[i];
        nested.parent = object;
        object.guards.push(nested);
      }
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
      if (value.kind == Skew.NodeKind.PAIR) {
        var first = value.firstValue();
        var second = value.secondValue();
        var setup = new Skew.Node(Skew.NodeKind.VARIABLES).appendChild(Skew.Node.createVariable(symbol));
        var symbolName = Skew.Node.createSymbolReference(symbol);
        var update = Skew.Node.createUnary(Skew.NodeKind.INCREMENT, symbolName);
        var test = null;

        // Special-case constant iteration limits to generate simpler code
        if (second.kind == Skew.NodeKind.CONSTANT || second.kind == Skew.NodeKind.NAME && second.symbol != null && second.symbol.isConst()) {
          test = Skew.Node.createBinary(Skew.NodeKind.LESS_THAN, symbolName.clone(), second.remove());
        }

        // Otherwise, save the iteration limit in case it changes during iteration
        else {
          var count = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_LOCAL, scope.generateName('count'));
          count.resolvedType = this.cache.intType;
          count.value = second.remove();
          count.state = Skew.SymbolState.INITIALIZED;
          setup.appendChild(Skew.Node.createVariable(count));
          test = Skew.Node.createBinary(Skew.NodeKind.LESS_THAN, symbolName.clone(), Skew.Node.createSymbolReference(count));
        }

        // Use a C-style for loop to implement this foreach loop
        symbol.flags &= ~Skew.Symbol.IS_CONST;
        symbol.value = first.remove();
        node.become(Skew.Node.createFor(setup, test, update, block.remove()).withComments(node.comments).withRange(node.range));

        // Make sure the new expressions are resolved
        this.resolveNode(test, symbol.scope, null);
        this.resolveNode(update, symbol.scope, null);
      }

      else if (this.cache.isList(value.resolvedType) && !this.options.target.supportsListForeach()) {
        // Create the index variable
        var index = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_LOCAL, scope.generateName('i'));
        index.resolvedType = this.cache.intType;
        index.value = new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.IntContent(0)).withType(this.cache.intType);
        index.state = Skew.SymbolState.INITIALIZED;
        var indexName = Skew.Node.createSymbolReference(index);

        // Create the list variable
        var list = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_LOCAL, scope.generateName('list'));
        list.resolvedType = value.resolvedType;
        list.value = value.remove();
        list.state = Skew.SymbolState.INITIALIZED;
        var listName = Skew.Node.createSymbolReference(list);

        // Create the count variable
        var count2 = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_LOCAL, scope.generateName('count'));
        count2.resolvedType = this.cache.intType;
        count2.value = new Skew.Node(Skew.NodeKind.DOT).withContent(new Skew.StringContent('count')).appendChild(listName);
        count2.state = Skew.SymbolState.INITIALIZED;
        var countName = Skew.Node.createSymbolReference(count2);

        // Move the loop variable into the loop body
        symbol.value = Skew.Node.createIndex(listName.clone(), indexName);
        block.prependChild(new Skew.Node(Skew.NodeKind.VARIABLES).appendChild(Skew.Node.createVariable(symbol)));

        // Use a C-style for loop to implement this foreach loop
        var setup1 = new Skew.Node(Skew.NodeKind.VARIABLES).appendChild(Skew.Node.createVariable(index)).appendChild(Skew.Node.createVariable(list)).appendChild(Skew.Node.createVariable(count2));
        var test1 = Skew.Node.createBinary(Skew.NodeKind.LESS_THAN, indexName.clone(), countName);
        var update1 = Skew.Node.createUnary(Skew.NodeKind.INCREMENT, indexName.clone());
        node.become(Skew.Node.createFor(setup1, test1, update1, block.remove()).withComments(node.comments).withRange(node.range));

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
      if (symbol.value != null && info.writeCount == 0) {
        symbol.flags |= Skew.Symbol.IS_CONST;
      }

      // Unused local variables can safely be removed, but don't warn about "for i in 0..10 {}"
      if (info.readCount == 0 && !symbol.isLoopVariable()) {
        this.log.semanticWarningUnreadLocalVariable(symbol.range, symbol.name);
      }

      // Rename local variables that conflict
      var scope = symbol.scope;

      while (scope.kind() == Skew.ScopeKind.LOCAL) {
        scope = scope.parent;
      }

      if (scope.used != null && in_StringMap.get(scope.used, symbol.name, null) != symbol) {
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
      this.resolveVariable1(variable);
    }

    this.checkInterfacesAndAbstractStatus2(symbol);
  };

  Skew.Resolving.Resolver.prototype.initializeFunction = function(symbol) {
    if (symbol.resolvedType == null) {
      symbol.resolvedType = new Skew.Type(Skew.TypeKind.SYMBOL, symbol);
    }

    // Referencing a normal variable instead of a special node kind for "this"
    // makes many things much easier including lambda capture and devirtualization
    if (symbol.kind == Skew.SymbolKind.FUNCTION_INSTANCE || symbol.kind == Skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
      symbol.$this = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_ARGUMENT, 'self');
      symbol.$this.flags |= Skew.Symbol.IS_CONST;
      symbol.$this.resolvedType = this.cache.parameterize(symbol.parent.resolvedType);
      symbol.$this.state = Skew.SymbolState.INITIALIZED;
    }

    // Lazily-initialize automatically generated functions
    if (symbol.isAutomaticallyGenerated()) {
      if (symbol.kind == Skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
        assert(symbol.name == 'new');
        this.automaticallyGenerateClassConstructor(symbol);
      }

      else if (symbol.kind == Skew.SymbolKind.FUNCTION_INSTANCE) {
        assert(symbol.name == 'toString');
        this.automaticallyGenerateEnumToString(symbol);
      }
    }

    this.resolveParameters(symbol.parameters);

    // Resolve the argument variables
    symbol.resolvedType.argumentTypes = [];

    for (var i = 0, list = symbol.$arguments, count1 = list.length; i < count1; ++i) {
      var argument = list[i];
      argument.scope = symbol.scope;
      this.resolveVariable1(argument);
      symbol.resolvedType.argumentTypes.push(argument.resolvedType);
    }

    symbol.argumentOnlyType = this.cache.createLambdaType(symbol.resolvedType.argumentTypes, null);

    // Resolve the return type if present (no return type means "void")
    var returnType = null;

    if (symbol.returnType != null) {
      if (symbol.kind == Skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
        this.log.semanticErrorConstructorReturnType(symbol.returnType.range);
      }

      else {
        this.resolveAsParameterizedType(symbol.returnType, symbol.scope);
        returnType = symbol.returnType.resolvedType;
      }
    }

    // Constructors always return the type they construct
    if (symbol.kind == Skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
      returnType = this.cache.parameterize(symbol.parent.resolvedType);
    }

    // The "<=>" operator must return a numeric value for comparison with zero
    var count = symbol.$arguments.length;

    if (symbol.name == '<=>') {
      if (returnType == null || returnType != this.cache.intType) {
        this.log.semanticErrorComparisonOperatorNotInt(symbol.returnType != null ? symbol.returnType.range : symbol.range);
        returnType = Skew.Type.DYNAMIC;
      }

      else if (count != 1) {
        this.log.semanticErrorWrongArgumentCount(symbol.range, symbol.name, 1);
      }
    }

    // Setters must have one argument
    else if (symbol.isSetter() && count != 1) {
      this.log.semanticErrorWrongArgumentCount(symbol.range, symbol.name, 1);
      symbol.flags &= ~Skew.Symbol.IS_SETTER;
    }

    // Validate argument count
    else {
      var argumentCount = Skew.argumentCountForOperator(symbol.name);

      if (argumentCount != null && !(argumentCount.indexOf(count) != -1)) {
        this.log.semanticErrorWrongArgumentCountRange(symbol.range, symbol.name, argumentCount);
      }

      // Enforce that the initializer constructor operators take lists of
      // values to avoid confusing error messages inside the code generated
      // for initializer expressions
      else if (symbol.name == '{new}' || symbol.name == '[new]') {
        for (var i1 = 0, list1 = symbol.$arguments, count2 = list1.length; i1 < count2; ++i1) {
          var argument1 = list1[i1];

          if (argument1.resolvedType != Skew.Type.DYNAMIC && !this.cache.isList(argument1.resolvedType)) {
            this.log.semanticErrorExpectedList(argument1.range, argument1.name, argument1.resolvedType);
          }
        }
      }
    }

    symbol.resolvedType.returnType = returnType;
    this.resolveAnnotations(symbol);

    // Validate the entry point after this symbol has a type
    if (symbol.isEntryPoint()) {
      this.validateEntryPoint(symbol);
    }
  };

  Skew.Resolving.Resolver.prototype.automaticallyGenerateClassConstructor = function(symbol) {
    // Create the function body
    var block = new Skew.Node(Skew.NodeKind.BLOCK);
    symbol.block = block;

    // Mirror the base constructor's arguments
    if (symbol.overridden != null) {
      this.initializeSymbol(symbol.overridden);
      var $arguments = symbol.overridden.$arguments;
      var base = new Skew.Node(Skew.NodeKind.SUPER).withRange(symbol.overridden.range);

      if ($arguments.length == 0) {
        block.appendChild(Skew.Node.createExpression(base));
      }

      else {
        var call = Skew.Node.createCall(base);

        for (var i = 0, list = $arguments, count = list.length; i < count; ++i) {
          var variable = list[i];
          var argument = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_ARGUMENT, variable.name);
          argument.resolvedType = variable.resolvedType;
          argument.state = Skew.SymbolState.INITIALIZED;
          symbol.$arguments.push(argument);
          call.appendChild(Skew.Node.createSymbolReference(argument));
        }

        block.prependChild(Skew.Node.createExpression(call));
      }
    }

    // Add an argument for every uninitialized variable
    var parent = symbol.parent.asObjectSymbol();
    this.initializeSymbol(parent);

    for (var i1 = 0, list1 = parent.variables, count1 = list1.length; i1 < count1; ++i1) {
      var variable1 = list1[i1];

      if (variable1.kind == Skew.SymbolKind.VARIABLE_INSTANCE) {
        this.initializeSymbol(variable1);

        if (variable1.value == null) {
          var argument1 = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_ARGUMENT, variable1.name);
          argument1.resolvedType = variable1.resolvedType;
          argument1.state = Skew.SymbolState.INITIALIZED;
          argument1.range = variable1.range;
          symbol.$arguments.push(argument1);
          block.appendChild(Skew.Node.createExpression(Skew.Node.createBinary(Skew.NodeKind.ASSIGN, Skew.Node.createMemberReference(Skew.Node.createSymbolReference(symbol.$this), variable1), Skew.Node.createSymbolReference(argument1)).withRange(variable1.range)));
        }

        else {
          block.appendChild(Skew.Node.createExpression(Skew.Node.createBinary(Skew.NodeKind.ASSIGN, Skew.Node.createMemberReference(Skew.Node.createSymbolReference(symbol.$this), variable1), variable1.value.clone()).withRange(variable1.range)));
        }
      }
    }

    // Make constructors without arguments into getters
    if (symbol.$arguments.length == 0) {
      symbol.flags |= Skew.Symbol.IS_GETTER;
    }
  };

  Skew.Resolving.Resolver.prototype.automaticallyGenerateEnumToString = function(symbol) {
    var parent = symbol.parent.asObjectSymbol();
    var names = new Skew.Node(Skew.NodeKind.INITIALIZER_LIST);
    this.initializeSymbol(parent);

    for (var i = 0, list = parent.variables, count = list.length; i < count; ++i) {
      var variable = list[i];

      if (variable.kind == Skew.SymbolKind.VARIABLE_ENUM) {
        assert(variable.enumValue() == names.childCount());
        names.appendChild(new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.StringContent(variable.name)));
      }
    }

    var strings = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_GLOBAL, parent.scope.generateName('_strings'));
    strings.value = names;
    strings.flags |= Skew.Symbol.IS_PROTECTED | Skew.Symbol.IS_CONST;
    strings.state = Skew.SymbolState.INITIALIZED;
    strings.parent = parent;
    strings.scope = parent.scope;
    strings.resolvedType = this.cache.createListType(this.cache.stringType);
    parent.variables.push(strings);
    this.resolveAsParameterizedExpressionWithConversion(strings.value, strings.scope, strings.resolvedType);
    symbol.returnType = new Skew.Node(Skew.NodeKind.TYPE).withType(this.cache.stringType);
    symbol.block = new Skew.Node(Skew.NodeKind.BLOCK).appendChild(Skew.Node.createReturn(Skew.Node.createIndex(Skew.Node.createSymbolReference(strings), new Skew.Node(Skew.NodeKind.NAME).withContent(new Skew.StringContent('self')))));
    symbol.flags |= Skew.Symbol.IS_GETTER;
  };

  Skew.Resolving.Resolver.prototype.resolveFunction = function(symbol) {
    this.initializeSymbol(symbol);

    // Validate use of "def" vs "over"
    if (!symbol.isObsolete()) {
      if (symbol.overridden != null && symbol.kind == Skew.SymbolKind.FUNCTION_INSTANCE) {
        if (!symbol.isOver()) {
          this.log.semanticErrorModifierMissingOverride(symbol.range, symbol.name, symbol.overridden.range);
        }
      }

      else if (symbol.isOver()) {
        this.log.semanticErrorModifierUnusedOverride(symbol.range, symbol.name);
      }
    }

    var scope = new Skew.LocalScope(symbol.scope, Skew.LocalType.NORMAL);

    if (symbol.$this != null) {
      scope.define(symbol.$this, this.log);
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

    if (block != null) {
      var firstStatement = block.firstChild();

      if (firstStatement != null && firstStatement.isSuperCallStatement()) {
        firstStatement = firstStatement.nextSibling();
      }

      // User-specified constructors have variable initializers automatically inserted
      if (symbol.kind == Skew.SymbolKind.FUNCTION_CONSTRUCTOR && !symbol.isAutomaticallyGenerated()) {
        for (var i1 = 0, list1 = symbol.parent.asObjectSymbol().variables, count1 = list1.length; i1 < count1; ++i1) {
          var variable = list1[i1];

          if (variable.kind == Skew.SymbolKind.VARIABLE_INSTANCE) {
            this.resolveVariable1(variable);

            // Attempt to create a default value if absent. Right now this
            // avoids the problem of initializing type parameters:
            //
            //   class Foo<T> {
            //     var foo T
            //     def new {}
            //     def use T { return foo }
            //   }
            //
            // This should be fixed at some point.
            if (variable.value == null && !variable.resolvedType.isParameter()) {
              variable.value = this.createDefaultValueForType(variable.resolvedType, variable.range);
            }

            if (variable.value != null) {
              block.insertChildBefore(firstStatement, Skew.Node.createExpression(Skew.Node.createBinary(Skew.NodeKind.ASSIGN, Skew.Node.createMemberReference(Skew.Node.createSymbolReference(symbol.$this), variable), variable.value.clone())));
            }
          }
        }
      }

      this.resolveNode(block, scope, null);

      // Missing a return statement is an error
      if (symbol.kind != Skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
        var returnType = symbol.resolvedType.returnType;

        if (returnType != null && returnType != Skew.Type.DYNAMIC && block.hasControlFlowAtEnd()) {
          this.log.semanticErrorMissingReturn(symbol.range, symbol.name, returnType);
        }
      }

      // Derived class constructors must start with a call to "super"
      else if (symbol.parent.asObjectSymbol().baseClass != null) {
        var first = block.firstChild();

        if (first == null || !first.isSuperCallStatement()) {
          this.log.semanticErrorMissingSuper(firstStatement == null ? symbol.range : firstStatement.range);
        }
      }
    }
  };

  Skew.Resolving.Resolver.prototype.recordStatistic = function(symbol, statistic) {
    if (symbol != null && symbol.kind == Skew.SymbolKind.VARIABLE_LOCAL) {
      var info = in_IntMap.get(this.localVariableStatistics, symbol.id, null);

      if (info != null) {
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
    // Normal variables may omit the initializer if the type is present
    if (symbol.type != null) {
      this.resolveAsParameterizedType(symbol.type, symbol.scope);
      symbol.resolvedType = symbol.type.resolvedType;

      // Resolve the constant now so initialized constants always have a value
      if (symbol.isConst() && symbol.value != null) {
        this.resolveAsParameterizedExpressionWithConversion(symbol.value, symbol.scope, symbol.resolvedType);
      }
    }

    // Enums take their type from their parent
    else if (symbol.kind == Skew.SymbolKind.VARIABLE_ENUM) {
      symbol.resolvedType = symbol.parent.resolvedType;
    }

    // Implicitly-typed variables take their type from their initializer
    else if (symbol.value != null) {
      this.resolveAsParameterizedExpression(symbol.value, symbol.scope);
      var type = symbol.value.resolvedType;
      symbol.resolvedType = type;

      // Forbid certain types
      if (!Skew.Resolving.Resolver.isValidVariableType(type)) {
        this.log.semanticErrorBadImplicitVariableType(symbol.range, type);
        symbol.resolvedType = Skew.Type.DYNAMIC;
      }
    }

    // Use a different error for constants which must have a type and lambda arguments which cannot have an initializer
    else if (symbol.isConst() || symbol.scope.kind() == Skew.ScopeKind.FUNCTION && symbol.scope.asFunctionScope().symbol.kind == Skew.SymbolKind.FUNCTION_LOCAL) {
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
    if (symbol.resolvedType != Skew.Type.DYNAMIC && symbol.isConst() && !symbol.isImported() && symbol.value == null && symbol.kind != Skew.SymbolKind.VARIABLE_ENUM && symbol.kind != Skew.SymbolKind.VARIABLE_INSTANCE) {
      this.log.semanticErrorConstMissingValue(symbol.range, symbol.name);
    }
  };

  Skew.Resolving.Resolver.prototype.resolveVariable1 = function(symbol) {
    this.initializeSymbol(symbol);

    if (symbol.value != null) {
      this.resolveAsParameterizedExpressionWithConversion(symbol.value, symbol.scope, symbol.resolvedType);
    }

    // Default-initialize variables
    else if (symbol.kind != Skew.SymbolKind.VARIABLE_ARGUMENT && symbol.kind != Skew.SymbolKind.VARIABLE_INSTANCE && symbol.kind != Skew.SymbolKind.VARIABLE_ENUM) {
      symbol.value = this.createDefaultValueForType(symbol.resolvedType, symbol.range);
    }
  };

  Skew.Resolving.Resolver.prototype.createDefaultValueForType = function(type, range) {
    var unwrapped = this.cache.unwrappedType(type);

    if (unwrapped == this.cache.intType) {
      return new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.IntContent(0)).withType(type);
    }

    if (unwrapped == this.cache.doubleType) {
      return new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.DoubleContent(0)).withType(type);
    }

    if (unwrapped == this.cache.boolType) {
      return new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.BoolContent(false)).withType(type);
    }

    if (unwrapped.isEnum()) {
      return Skew.Node.createCast(new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.IntContent(0)).withType(this.cache.intType), new Skew.Node(Skew.NodeKind.TYPE).withType(type)).withType(type);
    }

    if (unwrapped.isParameter()) {
      this.log.semanticErrorNoDefaultValue(range, type);
      return null;
    }

    assert(unwrapped.isReference());
    return new Skew.Node(Skew.NodeKind.NULL).withType(type);
  };

  Skew.Resolving.Resolver.prototype.initializeOverloadedFunction = function(symbol) {
    var symbols = symbol.symbols;

    if (symbol.resolvedType == null) {
      symbol.resolvedType = new Skew.Type(Skew.TypeKind.SYMBOL, symbol);
    }

    // Ensure no two overloads have the same argument types
    var types = [];
    var i = 0;

    while (i < symbols.length) {
      var $function = symbols[i];
      this.initializeSymbol($function);
      symbol.flags |= $function.flags & Skew.Symbol.IS_SETTER;
      var index = types.indexOf($function.argumentOnlyType);

      if (index != -1) {
        var other = symbols[index];
        var parent = symbol.parent;
        var isFromSameObject = $function.parent == other.parent;
        var areReturnTypesDifferent = (isFromSameObject || symbol.kind == Skew.SymbolKind.OVERLOADED_INSTANCE) && $function.resolvedType.returnType != other.resolvedType.returnType;

        // Symbols should be either from the same object or from this class and a base class
        assert(isFromSameObject || $function.parent == parent || other.parent == parent);

        // Forbid overloading by return type
        if (!isFromSameObject && areReturnTypesDifferent) {
          var derived = $function.parent == parent ? $function : other;
          var base = derived == $function ? other : $function;
          this.log.semanticErrorBadOverrideReturnType(derived.range, derived.name, parent.asObjectSymbol().baseType, base.range);

          if (isFromSameObject) {
            $function.flags |= Skew.Symbol.IS_OBSOLETE;
          }
        }

        // Allow duplicate function declarations with the same type to merge
        // as long as there is one declaration that provides an implementation.
        // Mark the obsolete function as obsolete instead of removing it so it
        // doesn't potentially mess up iteration in a parent call stack.
        else if (areReturnTypesDifferent || isFromSameObject && $function.block != null == (other.block != null)) {
          this.log.semanticErrorDuplicateOverload($function.range, symbol.name, other.range);

          if (isFromSameObject) {
            $function.flags |= Skew.Symbol.IS_OBSOLETE;
          }
        }

        // Keep "function"
        else if (isFromSameObject ? $function.block != null : $function.parent == parent) {
          if ($function.parent == parent && other.parent == parent) {
            $function.mergeAnnotationsAndCommentsFrom(other);
            $function.flags |= other.flags & ~Skew.Symbol.IS_IMPORTED;
            other.flags |= Skew.Symbol.IS_OBSOLETE;
          }

          else if (!isFromSameObject) {
            $function.overridden = other;
          }

          symbols[index] = $function;
        }

        // Keep "other"
        else if ($function.parent == parent && other.parent == parent) {
          other.flags |= $function.flags & ~Skew.Symbol.IS_IMPORTED;
          other.mergeAnnotationsAndCommentsFrom($function);
          $function.flags |= Skew.Symbol.IS_OBSOLETE;
        }

        else if (!isFromSameObject) {
          other.overridden = $function;
        }

        // Remove the symbol after the merge so "types" still matches "symbols"
        symbols.splice(i, 1);
        continue;
      }

      types.push($function.argumentOnlyType);
      ++i;
    }
  };

  Skew.Resolving.Resolver.prototype.resolveNode = function(node, scope, context) {
    if (node.resolvedType != null) {
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

      case Skew.NodeKind.FOR: {
        this.resolveFor(node, scope);
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

      case Skew.NodeKind.VARIABLE: {
        this.resolveVariable2(node, scope);
        break;
      }

      case Skew.NodeKind.VARIABLES: {
        this.resolveVariables(node, scope);
        break;
      }

      case Skew.NodeKind.WHILE: {
        this.resolveWhile(node, scope);
        break;
      }

      case Skew.NodeKind.ASSIGN_INDEX: {
        this.resolveOperatorOverload(node, scope);
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

      case Skew.NodeKind.COMPLEMENT:
      case Skew.NodeKind.DECREMENT:
      case Skew.NodeKind.INCREMENT:
      case Skew.NodeKind.NEGATIVE:
      case Skew.NodeKind.NOT:
      case Skew.NodeKind.POSITIVE: {
        this.resolveOperatorOverload(node, scope);
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

      case Skew.NodeKind.HOOK: {
        this.resolveHook(node, scope, context);
        break;
      }

      case Skew.NodeKind.INDEX: {
        this.resolveOperatorOverload(node, scope);
        break;
      }

      case Skew.NodeKind.INITIALIZER_LIST:
      case Skew.NodeKind.INITIALIZER_MAP: {
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

      case Skew.NodeKind.SEQUENCE: {
        this.resolveSequence(node, scope, context);
        break;
      }

      case Skew.NodeKind.SUPER: {
        this.resolveSuper(node, scope);
        break;
      }

      case Skew.NodeKind.TYPE: {
        break;
      }

      case Skew.NodeKind.TYPE_CHECK: {
        this.resolveTypeCheck(node, scope);
        break;
      }

      default: {
        if (Skew.in_NodeKind.isBinary(node.kind)) {
          this.resolveBinary(node, scope);
        }

        else {
          assert(false);
        }
        break;
      }
    }

    assert(node.resolvedType != null);
  };

  Skew.Resolving.Resolver.prototype.resolveAsParameterizedType = function(node, scope) {
    assert(Skew.in_NodeKind.isExpression(node.kind));
    this.resolveNode(node, scope, null);
    this.checkIsType(node);
    this.checkIsParameterized(node);
  };

  Skew.Resolving.Resolver.prototype.resolveAsParameterizedExpression = function(node, scope) {
    assert(Skew.in_NodeKind.isExpression(node.kind));
    this.resolveNode(node, scope, null);
    this.checkIsInstance(node);
    this.checkIsParameterized(node);
  };

  Skew.Resolving.Resolver.prototype.resolveAsParameterizedExpressionWithTypeContext = function(node, scope, type) {
    assert(Skew.in_NodeKind.isExpression(node.kind));
    this.resolveNode(node, scope, type);
    this.checkIsInstance(node);
    this.checkIsParameterized(node);
  };

  Skew.Resolving.Resolver.prototype.resolveAsParameterizedExpressionWithConversion = function(node, scope, type) {
    this.resolveAsParameterizedExpressionWithTypeContext(node, scope, type);
    this.checkConversion(node, type, Skew.Resolving.ConversionKind.IMPLICIT);
  };

  Skew.Resolving.Resolver.prototype.resolveChildrenAsParameterizedExpressions = function(node, scope) {
    for (var child = node.firstChild(); child != null; child = child.nextSibling()) {
      this.resolveAsParameterizedExpression(child, scope);
    }
  };

  Skew.Resolving.Resolver.prototype.checkUnusedExpression = function(node) {
    var kind = node.kind;

    if (kind == Skew.NodeKind.HOOK) {
      this.checkUnusedExpression(node.hookTrue());
      this.checkUnusedExpression(node.hookFalse());
    }

    else if (node.range != null && node.resolvedType != Skew.Type.DYNAMIC && kind != Skew.NodeKind.CALL && !Skew.in_NodeKind.isBinaryAssign(kind)) {
      this.log.semanticWarningUnusedExpression(node.range);
    }
  };

  Skew.Resolving.Resolver.prototype.checkIsInstance = function(node) {
    if (node.resolvedType != Skew.Type.DYNAMIC && node.isType()) {
      this.log.semanticErrorUnexpectedType(node.range, node.resolvedType);
      node.resolvedType = Skew.Type.DYNAMIC;
    }
  };

  Skew.Resolving.Resolver.prototype.checkIsType = function(node) {
    if (node.resolvedType != Skew.Type.DYNAMIC && !node.isType()) {
      this.log.semanticErrorUnexpectedExpression(node.range, node.resolvedType);
      node.resolvedType = Skew.Type.DYNAMIC;
    }
  };

  Skew.Resolving.Resolver.prototype.checkIsParameterized = function(node) {
    if (node.resolvedType.parameters() != null && !node.resolvedType.isParameterized()) {
      this.log.semanticErrorUnparameterizedType(node.range, node.resolvedType);
      node.resolvedType = Skew.Type.DYNAMIC;
    }
  };

  Skew.Resolving.Resolver.prototype.checkStorage = function(node, scope) {
    var symbol = node.symbol;

    // Only allow storage to variables
    if (node.kind != Skew.NodeKind.NAME && node.kind != Skew.NodeKind.DOT || symbol != null && !Skew.in_SymbolKind.isVariable(symbol.kind)) {
      this.log.semanticErrorBadStorage(node.range);
    }

    // Forbid storage to constants
    else if (symbol != null && symbol.isConst()) {
      var $function = scope.findEnclosingFunction();

      // Allow assignments to constants inside constructors
      if ($function == null || $function.symbol.kind != Skew.SymbolKind.FUNCTION_CONSTRUCTOR || $function.symbol.parent != symbol.parent || symbol.kind != Skew.SymbolKind.VARIABLE_INSTANCE) {
        this.log.semanticErrorStorageToConstSymbol(node.internalRangeOrRange(), symbol.name);
      }
    }
  };

  Skew.Resolving.Resolver.prototype.checkAccess = function(node, range, scope) {
    var symbol = node.symbol;

    if (symbol == null) {
      return;
    }

    // Check access control
    if (symbol.isProtected()) {
      while (scope != null) {
        if (scope.kind() == Skew.ScopeKind.OBJECT) {
          var object = scope.asObjectScope().symbol;

          if (object.isSameOrHasBaseClass(symbol.parent)) {
            return;
          }
        }

        scope = scope.parent;
      }

      this.log.semanticErrorAccessViolation(range, symbol.name);
    }

    // Deprecation annotations optionally provide a warning message
    if (symbol.isDeprecated()) {
      for (var i = 0, list = symbol.annotations, count = list.length; i < count; ++i) {
        var annotation = list[i];

        if (annotation.symbol != null && annotation.symbol.fullName() == '@deprecated') {
          var value = annotation.annotationValue();

          if (value.kind == Skew.NodeKind.CALL && value.hasTwoChildren()) {
            var last = value.lastChild();

            if (last.kind == Skew.NodeKind.CONSTANT && last.content.kind() == Skew.ContentKind.STRING) {
              this.log.warning(range, Skew.in_Content.asString(last.content));
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
    assert(from != null);
    assert(to != null);

    // The "dynamic" type is a hole in the type system
    if (from == Skew.Type.DYNAMIC || to == Skew.Type.DYNAMIC) {
      return;
    }

    // No conversion is needed for identical types
    if (from == to) {
      return;
    }

    // The implicit conversion must be valid
    if (kind == Skew.Resolving.ConversionKind.IMPLICIT && !this.cache.canImplicitlyConvert(from, to) || kind == Skew.Resolving.ConversionKind.EXPLICIT && !this.cache.canExplicitlyConvert(from, to)) {
      this.log.semanticErrorIncompatibleTypes(node.range, from, to, this.cache.canExplicitlyConvert(from, to));
      node.resolvedType = Skew.Type.DYNAMIC;
      return;
    }

    // Make the implicit conversion explicit for convenience later on
    if (kind == Skew.Resolving.ConversionKind.IMPLICIT) {
      node.become(Skew.Node.createCast(node.cloneAndStealChildren(), new Skew.Node(Skew.NodeKind.TYPE).withType(to)).withType(to).withRange(node.range));
    }
  };

  Skew.Resolving.Resolver.prototype.resolveAnnotation = function(node, symbol) {
    var value = node.annotationValue();
    var test = node.annotationTest();
    this.resolveNode(value, symbol.scope, null);

    if (test != null) {
      this.resolveAsParameterizedExpressionWithConversion(test, symbol.scope, this.cache.boolType);
    }

    // Terminate early when there were errors
    if (value.symbol == null) {
      return false;
    }

    // Make sure annotations have the arguments they need
    if (value.kind != Skew.NodeKind.CALL) {
      this.log.semanticErrorArgumentCount(value.range, value.symbol.resolvedType.argumentTypes.length, 0, value.symbol.name, value.symbol.range);
      return false;
    }

    // Ensure all arguments are constants
    var isValid = true;

    for (var child = value.callValue().nextSibling(); child != null; child = child.nextSibling()) {
      isValid = isValid && this.recursivelyResolveAsConstant(child);
    }

    if (!isValid) {
      return false;
    }

    // Only store symbols for annotations with the correct arguments for ease of use
    node.symbol = value.symbol;

    // Apply built-in annotation logic
    var flag = in_StringMap.get(Skew.Resolving.Resolver.annotationSymbolFlags, value.symbol.fullName(), 0);

    if (flag != 0) {
      switch (flag) {
        case Skew.Symbol.IS_DEPRECATED: {
          break;
        }

        case Skew.Symbol.IS_ENTRY_POINT: {
          isValid = symbol.kind == Skew.SymbolKind.FUNCTION_GLOBAL;
          break;
        }

        case Skew.Symbol.IS_EXPORTED: {
          isValid = !symbol.isImported();
          break;
        }

        case Skew.Symbol.IS_IMPORTED: {
          isValid = !symbol.isExported() && (!Skew.in_SymbolKind.isFunction(symbol.kind) || symbol.asFunctionSymbol().block == null);
          break;
        }

        case Skew.Symbol.IS_INLINING_DISABLED: {
          isValid = Skew.in_SymbolKind.isFunction(symbol.kind);
          break;
        }

        case Skew.Symbol.IS_PREFERRED: {
          isValid = Skew.in_SymbolKind.isFunction(symbol.kind);
          break;
        }

        case Skew.Symbol.IS_RENAMED: {
          break;
        }

        case Skew.Symbol.IS_SKIPPED: {
          isValid = Skew.in_SymbolKind.isFunction(symbol.kind) && symbol.resolvedType.returnType == null;
          break;
        }

        case Skew.Symbol.SHOULD_SPREAD: {
          isValid = symbol.kind == Skew.SymbolKind.FUNCTION_ANNOTATION;
          break;
        }
      }

      if (!isValid) {
        this.log.semanticErrorInvalidAnnotation(value.range, value.symbol.name, symbol.name);
        return false;
      }

      // Don't add an annotation when the test expression is false
      if (test != null && this.recursivelyResolveAsConstant(test) && test.isFalse()) {
        return false;
      }

      // Only warn about duplicate annotations after checking the test expression
      if ((symbol.flags & flag) != 0) {
        this.log.semanticErrorDuplicateAnnotation(value.range, value.symbol.name, symbol.name);
      }

      symbol.flags |= flag;

      // Store the new name for later
      if (flag == Skew.Symbol.IS_RENAMED && value.hasTwoChildren()) {
        symbol.rename = value.lastChild().asString();
      }
    }

    return true;
  };

  Skew.Resolving.Resolver.prototype.recursivelyResolveAsConstant = function(node) {
    this.constantFolder.foldConstants(node);

    if (node.kind != Skew.NodeKind.CONSTANT) {
      this.log.semanticErrorExpectedConstant(node.range);
      return false;
    }

    return true;
  };

  Skew.Resolving.Resolver.prototype.resolveBlock = function(node, scope) {
    assert(node.kind == Skew.NodeKind.BLOCK);
    this.controlFlow.pushBlock(node);

    for (var child = node.firstChild(), next = null; child != null; child = next) {
      next = child.nextSibling();

      // There is a well-known ambiguity in languages like JavaScript where
      // a return statement followed by a newline and a value can either be
      // parsed as a single return statement with a value or as two
      // statements, a return statement without a value and an expression
      // statement. Luckily, we're better off than JavaScript since we know
      // the type of the function. Parse a single statement in a non-void
      // function but two statements in a void function.
      if (child.kind == Skew.NodeKind.RETURN && next != null && child.returnValue() == null && next.kind == Skew.NodeKind.EXPRESSION) {
        var $function = scope.findEnclosingFunctionOrLambda().symbol;

        if ($function.kind != Skew.SymbolKind.FUNCTION_CONSTRUCTOR && $function.resolvedType.returnType != null) {
          child.appendChild(next.remove().expressionValue().remove());
          next = child.nextSibling();
          assert(child.returnValue() != null);
        }
      }

      this.resolveNode(child, scope, null);
      this.controlFlow.visitStatementInPostOrder(child);

      // The "@skip" annotation removes function calls after type checking
      if (child.kind == Skew.NodeKind.EXPRESSION) {
        var value = child.expressionValue();

        if (value.kind == Skew.NodeKind.CALL && value.symbol != null && value.symbol.isSkipped()) {
          child.remove();
        }
      }
    }

    this.controlFlow.popBlock(node);
  };

  Skew.Resolving.Resolver.prototype.resolvePair = function(node, scope) {
    this.resolveAsParameterizedExpression(node.firstValue(), scope);
    this.resolveAsParameterizedExpression(node.secondValue(), scope);
  };

  Skew.Resolving.Resolver.prototype.resolveJump = function(node, scope) {
    if (scope.findEnclosingLoop() == null) {
      this.log.semanticErrorBadJump(node.range, node.kind == Skew.NodeKind.BREAK ? 'break' : 'continue');
    }
  };

  Skew.Resolving.Resolver.prototype.resolveExpression = function(node, scope) {
    var value = node.expressionValue();
    this.resolveAsParameterizedExpression(value, scope);
    this.checkUnusedExpression(value);
  };

  Skew.Resolving.Resolver.prototype.resolveFor = function(node, scope) {
    var setup = node.forSetup();
    var update = node.forUpdate();
    scope = new Skew.LocalScope(scope, Skew.LocalType.LOOP);

    if (setup.kind == Skew.NodeKind.VARIABLES) {
      this.resolveNode(setup, scope, null);

      // All for loop variables must have the same type. This is a requirement
      // for one-to-one code emission in the languages we want to target.
      var type = setup.firstChild().symbol.resolvedType;

      for (var child = setup.firstChild().nextSibling(); child != null; child = child.nextSibling()) {
        var symbol = child.symbol;

        if (symbol.resolvedType != type) {
          this.log.semanticErrorForLoopDifferentType(symbol.range, symbol.name, symbol.resolvedType, type);
          break;
        }
      }
    }

    else {
      this.resolveAsParameterizedExpression(setup, scope);
    }

    this.resolveAsParameterizedExpressionWithConversion(node.forTest(), scope, this.cache.boolType);
    this.resolveAsParameterizedExpression(update, scope);

    if (update.kind == Skew.NodeKind.SEQUENCE) {
      for (var child1 = update.firstChild(); child1 != null; child1 = child1.nextSibling()) {
        this.checkUnusedExpression(child1);
      }
    }

    this.resolveBlock(node.forBlock(), scope);
  };

  Skew.Resolving.Resolver.prototype.resolveForeach = function(node, scope) {
    var type = Skew.Type.DYNAMIC;
    scope = new Skew.LocalScope(scope, Skew.LocalType.LOOP);
    var value = node.foreachValue();
    this.resolveAsParameterizedExpression(value, scope);

    // Support "for i in 0..10"
    if (value.kind == Skew.NodeKind.PAIR) {
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
    else if (value.resolvedType != Skew.Type.DYNAMIC) {
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

    if (ifFalse != null) {
      this.resolveBlock(ifFalse, new Skew.LocalScope(scope, Skew.LocalType.NORMAL));
    }
  };

  Skew.Resolving.Resolver.prototype.resolveReturn = function(node, scope) {
    var value = node.returnValue();
    var $function = scope.findEnclosingFunctionOrLambda().symbol;
    var returnType = $function.kind != Skew.SymbolKind.FUNCTION_CONSTRUCTOR ? $function.resolvedType.returnType : null;

    // Check for a returned value
    if (value == null) {
      if (returnType != null) {
        this.log.semanticErrorExpectedReturnValue(node.range, returnType);
      }

      return;
    }

    // Check the type of the returned value
    if (returnType != null) {
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
    if (!$function.shouldInferReturnType() || value.kind == Skew.NodeKind.CALL && value.symbol != null && value.symbol.resolvedType.returnType == null) {
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
    var duplicateCases = {};
    var mustEnsureConstantIntegers = this.options.target.requiresIntegerSwitchStatements();
    var allValuesAreIntegers = true;
    var value = node.switchValue();
    this.resolveAsParameterizedExpression(value, scope);

    for (var child = value.nextSibling(); child != null; child = child.nextSibling()) {
      var block = child.caseBlock();

      // Resolve all case values
      for (var caseValue = child.firstChild(); caseValue != block; caseValue = caseValue.nextSibling()) {
        this.resolveAsParameterizedExpressionWithConversion(caseValue, scope, value.resolvedType);
        var symbol = caseValue.symbol;
        var integer = 0;

        // Check for a constant variable, which may just be read-only with a
        // value determined at runtime
        if (symbol != null && (mustEnsureConstantIntegers ? symbol.kind == Skew.SymbolKind.VARIABLE_ENUM : Skew.in_SymbolKind.isVariable(symbol.kind) && symbol.isConst())) {
          var constant = this.constantFolder.constantForSymbol(symbol.asVariableSymbol());

          if (constant == null || constant.kind() != Skew.ContentKind.INT) {
            allValuesAreIntegers = false;
            continue;
          }

          integer = Skew.in_Content.asInt(constant);
        }

        // Fall back to the constant folder only as a last resort because it
        // mutates the syntax tree and harms readability
        else {
          this.constantFolder.foldConstants(caseValue);

          if (!caseValue.isInt()) {
            allValuesAreIntegers = false;
            continue;
          }

          integer = caseValue.asInt();
        }

        // Duplicate case detection
        var previous = in_IntMap.get(duplicateCases, integer, null);

        if (previous != null) {
          this.log.semanticErrorDuplicateCase(caseValue.range, previous);
        }

        else {
          duplicateCases[integer] = caseValue.range;
        }
      }

      // The default case must be last, makes changing into an if chain easier later
      if (child.hasOneChild() && child.nextSibling() != null) {
        this.log.semanticErrorDefaultCaseNotLast(child.range);
      }

      this.resolveBlock(block, new Skew.LocalScope(scope, Skew.LocalType.NORMAL));
    }

    // Fall back to an if statement if the case values aren't compile-time
    // integer constants, which is requried by many language targets
    if (!allValuesAreIntegers && mustEnsureConstantIntegers) {
      this.convertSwitchToIfChain(node, scope);
    }
  };

  Skew.Resolving.Resolver.prototype.resolveThrow = function(node, scope) {
    var value = node.throwValue();
    this.resolveAsParameterizedExpression(value, scope);
  };

  Skew.Resolving.Resolver.prototype.resolveVariable2 = function(node, scope) {
    var symbol = node.symbol.asVariableSymbol();
    scope.asLocalScope().define(symbol, this.log);
    this.localVariableStatistics[symbol.id] = new Skew.Resolving.LocalVariableStatistics(symbol);
    this.resolveVariable1(symbol);
  };

  Skew.Resolving.Resolver.prototype.resolveVariables = function(node, scope) {
    for (var child = node.firstChild(); child != null; child = child.nextSibling()) {
      this.resolveVariable2(child, scope);
    }
  };

  Skew.Resolving.Resolver.prototype.resolveTry = function(node, scope) {
    var tryBlock = node.tryBlock();
    var finallyBlock = node.finallyBlock();
    this.resolveBlock(tryBlock, new Skew.LocalScope(scope, Skew.LocalType.NORMAL));

    // Bare try statements catch all thrown values
    if (node.hasOneChild()) {
      node.appendChild(Skew.Node.createCatch(null, new Skew.Node(Skew.NodeKind.BLOCK)));
    }

    // Check catch statements
    for (var child = tryBlock.nextSibling(); child != finallyBlock; child = child.nextSibling()) {
      var childScope = new Skew.LocalScope(scope, Skew.LocalType.NORMAL);

      if (child.symbol != null) {
        var symbol = child.symbol.asVariableSymbol();
        childScope.define(symbol, this.log);
        this.resolveVariable1(symbol);
      }

      this.resolveBlock(child.catchBlock(), childScope);
    }

    // Check finally block
    if (finallyBlock != null) {
      this.resolveBlock(finallyBlock, new Skew.LocalScope(scope, Skew.LocalType.NORMAL));
    }
  };

  Skew.Resolving.Resolver.prototype.resolveWhile = function(node, scope) {
    this.resolveAsParameterizedExpressionWithConversion(node.whileTest(), scope, this.cache.boolType);
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
        if (type != Skew.Type.DYNAMIC) {
          this.log.semanticErrorInvalidCall(node.internalRangeOrRange(), value.resolvedType);
        }
        break;
      }
    }

    // If there was an error, resolve the arguments to check for further
    // errors but use a dynamic type context to avoid introducing errors
    for (var child = value.nextSibling(); child != null; child = child.nextSibling()) {
      this.resolveAsParameterizedExpressionWithConversion(child, scope, Skew.Type.DYNAMIC);
    }
  };

  Skew.Resolving.Resolver.prototype.resolveSymbolCall = function(node, scope, type) {
    var symbol = type.symbol;

    // Getters are called implicitly, so explicitly calling one is an error.
    // This error prevents a getter returning a lambda which is then called.
    // To overcome this, wrap the call in parentheses:
    //
    //   def foo fn()
    //
    //   def bar {
    //     foo()   # Error
    //     (foo)() # Correct
    //   }
    //
    if (symbol.isGetter() && Skew.Resolving.Resolver.isCallValue(node) && !node.callValue().isInsideParentheses()) {
      if (symbol.resolvedType.returnType != null && symbol.resolvedType.returnType.kind == Skew.TypeKind.LAMBDA) {
        this.log.semanticErrorGetterRequiresWrap(node.range, symbol.name, symbol.range);
      }

      else {
        this.log.semanticErrorGetterCalledTwice(node.parent().internalRangeOrRange(), symbol.name, symbol.range);
      }

      return false;
    }

    // Check for calling a function directly
    if (Skew.in_SymbolKind.isFunction(symbol.kind)) {
      return this.resolveFunctionCall(node, scope, type);
    }

    // Check for calling a set of functions, must not be ambiguous
    if (Skew.in_SymbolKind.isOverloadedFunction(symbol.kind)) {
      return this.resolveOverloadedFunctionCall(node, scope, type);
    }

    // Can't call other symbols
    this.log.semanticErrorInvalidCall(node.internalRangeOrRange(), node.callValue().resolvedType);
    return false;
  };

  Skew.Resolving.Resolver.prototype.resolveFunctionCall = function(node, scope, type) {
    var $function = type.symbol != null ? type.symbol.asFunctionSymbol() : null;
    var expected = type.argumentTypes.length;
    var count = node.childCount() - 1 | 0;
    node.symbol = $function;

    // Use the return type even if there were errors
    if (type.returnType != null) {
      node.resolvedType = type.returnType;
    }

    // There is no "void" type, so make sure this return value isn't used
    else if (Skew.Resolving.Resolver.isVoidExpressionUsed(node)) {
      if ($function != null) {
        this.log.semanticErrorUseOfVoidFunction(node.range, $function.name, $function.range);
      }

      else {
        this.log.semanticErrorUseOfVoidLambda(node.range);
      }
    }

    // Check argument count
    if (expected != count) {
      this.log.semanticErrorArgumentCount(node.internalRangeOrRange(), expected, count, $function != null ? $function.name : null, $function != null ? $function.range : null);
      return false;
    }

    // Check argument types
    var value = node.firstChild();
    var child = value.nextSibling();

    for (var i = 0, list = type.argumentTypes, count1 = list.length; i < count1; ++i) {
      var argumentType = list[i];
      this.resolveAsParameterizedExpressionWithConversion(child, scope, argumentType);
      child = child.nextSibling();
    }

    // Forbid constructing an abstract type
    if (!this.options.target.allowAbstractConstruction() && $function != null && $function.kind == Skew.SymbolKind.FUNCTION_CONSTRUCTOR && value.kind != Skew.NodeKind.SUPER) {
      this.checkInterfacesAndAbstractStatus2($function.parent.asObjectSymbol());
      var reason = $function.parent.asObjectSymbol().isAbstractBecauseOf;

      if (reason != null) {
        this.log.semanticErrorAbstractNew(node.internalRangeOrRange(), $function.parent.resolvedType, reason.range, reason.name);
      }
    }

    // Replace overloaded symbols with the chosen overload
    if ($function != null && $function.overloaded != null && value.symbol == $function.overloaded) {
      value.symbol = $function;
    }

    return true;
  };

  Skew.Resolving.Resolver.prototype.resolveOverloadedFunction = function(range, node, scope, symbolType) {
    var overloaded = symbolType.symbol.asOverloadedFunctionSymbol();
    var firstArgument = node.firstChild().nextSibling();
    var count = node.childCount() - 1 | 0;
    var candidates = [];

    // Filter by argument length and substitute using the current type environment
    for (var i1 = 0, list = overloaded.symbols, count1 = list.length; i1 < count1; ++i1) {
      var symbol = list[i1];

      if (symbol.$arguments.length == count || overloaded.symbols.length == 1) {
        candidates.push(this.cache.substitute(symbol.resolvedType, symbolType.environment));
      }
    }

    // Check for matches
    if (candidates.length == 0) {
      this.log.semanticErrorNoMatchingOverload(range, overloaded.name, count, null);
      return null;
    }

    // Check for an unambiguous match
    if (candidates.length == 1) {
      return candidates[0];
    }

    // First filter by syntactic structure impossibilities. This helps break
    // the chicken-and-egg problem of needing to resolve argument types to
    // get a match and needing a match to resolve argument types. For example,
    // a list literal needs type context to resolve correctly.
    var index = 0;

    while (index < candidates.length) {
      var child = firstArgument;

      for (var i2 = 0, list1 = candidates[index].argumentTypes, count2 = list1.length; i2 < count2; ++i2) {
        var type = list1[i2];
        var kind = child.kind;

        if (kind == Skew.NodeKind.NULL && !type.isReference() || kind == Skew.NodeKind.INITIALIZER_LIST && this.findMember(type, '[new]') == null && this.findMember(type, '[...]') == null || kind == Skew.NodeKind.INITIALIZER_MAP && this.findMember(type, '{new}') == null && this.findMember(type, '{...}') == null) {
          candidates.splice(index, 1);
          --index;
          break;
        }

        child = child.nextSibling();
      }

      ++index;
    }

    // Check for an unambiguous match
    if (candidates.length == 1) {
      return candidates[0];
    }

    // If that still didn't work, resolve the arguments without type context
    for (var child1 = firstArgument; child1 != null; child1 = child1.nextSibling()) {
      this.resolveAsParameterizedExpression(child1, scope);
    }

    // Try again, this time discarding all implicit conversion failures
    index = 0;

    while (index < candidates.length) {
      var child2 = firstArgument;

      for (var i3 = 0, list2 = candidates[index].argumentTypes, count3 = list2.length; i3 < count3; ++i3) {
        var type1 = list2[i3];

        if (!this.cache.canImplicitlyConvert(child2.resolvedType, type1)) {
          candidates.splice(index, 1);
          --index;
          break;
        }

        child2 = child2.nextSibling();
      }

      ++index;
    }

    // Check for an unambiguous match
    if (candidates.length == 1) {
      return candidates[0];
    }

    // Extract argument types for an error if there is one
    var childTypes = [];

    for (var child3 = firstArgument; child3 != null; child3 = child3.nextSibling()) {
      childTypes.push(child3.resolvedType);
    }

    // Give up without a match
    if (candidates.length == 0) {
      this.log.semanticErrorNoMatchingOverload(range, overloaded.name, count, childTypes);
      return null;
    }

    // If that still didn't work, try type equality
    for (var i4 = 0, list3 = candidates, count5 = list3.length; i4 < count5; ++i4) {
      var type2 = list3[i4];
      var isMatch = true;

      for (var i = 0, count4 = count; i < count4; ++i) {
        if (childTypes[i] != type2.argumentTypes[i]) {
          isMatch = false;
          break;
        }
      }

      if (isMatch) {
        return type2;
      }
    }

    // If that still didn't work, try picking the preferred overload
    var firstPreferred = null;
    var secondPreferred = null;

    for (var i5 = 0, list4 = candidates, count6 = list4.length; i5 < count6; ++i5) {
      var type3 = list4[i5];

      if (type3.symbol.isPreferred()) {
        secondPreferred = firstPreferred;
        firstPreferred = type3;
      }
    }

    // Check for a single preferred overload
    if (firstPreferred != null && secondPreferred == null) {
      return firstPreferred;
    }

    // Give up since the overload is ambiguous
    this.log.semanticErrorAmbiguousOverload(range, overloaded.name, count, childTypes);
    return null;
  };

  Skew.Resolving.Resolver.prototype.resolveOverloadedFunctionCall = function(node, scope, type) {
    var match = this.resolveOverloadedFunction(node.callValue().range, node, scope, type);

    if (match != null && this.resolveFunctionCall(node, scope, match)) {
      this.checkAccess(node, node.callValue().internalRangeOrRange(), scope);
      return true;
    }

    return false;
  };

  Skew.Resolving.Resolver.prototype.resolveCast = function(node, scope, context) {
    var value = node.castValue();
    var type = node.castType();
    var neededTypeContext = Skew.Resolving.Resolver.needsTypeContext(value);
    this.resolveAsParameterizedType(type, scope);
    this.resolveAsParameterizedExpressionWithTypeContext(value, scope, type.resolvedType);
    this.checkConversion(value, type.resolvedType, Skew.Resolving.ConversionKind.EXPLICIT);
    node.resolvedType = type.resolvedType;

    // Warn about unnecessary casts
    if (type.resolvedType != Skew.Type.DYNAMIC && !neededTypeContext && (value.resolvedType == type.resolvedType || context == type.resolvedType && this.cache.canImplicitlyConvert(value.resolvedType, type.resolvedType))) {
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

  Skew.Resolving.Resolver.prototype.findMember = function(type, name) {
    if (type.kind == Skew.TypeKind.SYMBOL) {
      var symbol = type.symbol;

      if (Skew.in_SymbolKind.isObject(symbol.kind)) {
        var member = in_StringMap.get(symbol.asObjectSymbol().members, name, null);

        if (member != null) {
          this.initializeSymbol(member);
          return member;
        }
      }
    }

    return null;
  };

  Skew.Resolving.Resolver.prototype.resolveDot = function(node, scope, context) {
    var target = node.dotTarget();
    var name = node.asString();

    // Infer the target from the type context if it's omitted
    if (target == null) {
      if (context == null) {
        this.log.semanticErrorMissingDotContext(node.range, name);
        return;
      }

      target = new Skew.Node(Skew.NodeKind.TYPE).withType(context);
      node.appendChild(target);
      assert(node.dotTarget() == target);
    }

    else {
      this.resolveNode(target, scope, null);
    }

    // Search for a setter first, then search for a normal member
    var symbol = null;

    if (Skew.Resolving.Resolver.shouldCheckForSetter(node)) {
      symbol = this.findMember(target.resolvedType, name + '=');
    }

    if (symbol == null) {
      symbol = this.findMember(target.resolvedType, name);

      if (symbol == null) {
        if (target.resolvedType != Skew.Type.DYNAMIC) {
          this.reportGuardMergingFailure(node);
          this.log.semanticErrorUnknownMemberSymbol(node.internalRangeOrRange(), name, target.resolvedType);
        }

        if (target.kind == Skew.NodeKind.TYPE && target.resolvedType == Skew.Type.DYNAMIC) {
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
    var needsType = !Skew.in_SymbolKind.isOnInstances(symbol.kind);

    // Make sure the global/instance context matches the intended usage
    if (isType) {
      if (!needsType) {
        this.log.semanticErrorMemberUnexpectedInstance(node.internalRangeOrRange(), symbol.name);
      }

      else if (Skew.in_SymbolKind.isFunctionOrOverloadedFunction(symbol.kind)) {
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
    if (Skew.in_SymbolKind.isGlobalReference(symbol.kind)) {
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
    if (context != null) {
      this.resolveAsParameterizedExpressionWithConversion(trueValue, scope, context);
      this.resolveAsParameterizedExpressionWithConversion(falseValue, scope, context);
      node.resolvedType = context;
    }

    // Find the common type from both branches
    else {
      this.resolveAsParameterizedExpression(trueValue, scope);
      this.resolveAsParameterizedExpression(falseValue, scope);
      var commonType = this.cache.commonImplicitType(trueValue.resolvedType, falseValue.resolvedType);

      // Insert casts if needed since some targets can't perform this type inference
      if (commonType != null) {
        this.checkConversion(trueValue, commonType, Skew.Resolving.ConversionKind.IMPLICIT);
        this.checkConversion(falseValue, commonType, Skew.Resolving.ConversionKind.IMPLICIT);
        node.resolvedType = commonType;
      }

      else {
        this.log.semanticErrorNoCommonType(Skew.Range.span(trueValue.range, falseValue.range), trueValue.resolvedType, falseValue.resolvedType);
      }
    }
  };

  Skew.Resolving.Resolver.prototype.resolveInitializer = function(node, scope, context) {
    // Make sure to resolve the children even if the initializer is invalid
    if (context != null) {
      if (context == Skew.Type.DYNAMIC || !this.resolveInitializerWithContext(node, scope, context)) {
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
          for (var child = node.firstChild(); child != null; child = child.nextSibling()) {
            if (pass != 0 || !Skew.Resolving.Resolver.needsTypeContext(child)) {
              this.resolveAsParameterizedExpression(child, scope);
              type = this.mergeCommonType(type, child);
            }
          }

          // Resolve remaining children using the type context if valid
          if (type != null && Skew.Resolving.Resolver.isValidVariableType(type)) {
            this.resolveInitializerWithContext(node, scope, this.cache.createListType(type));
            return;
          }
          break;
        }

        case Skew.NodeKind.INITIALIZER_MAP: {
          var keyType = null;
          var valueType = null;

          // Resolve all children for this pass
          for (var child1 = node.firstChild(); child1 != null; child1 = child1.nextSibling()) {
            var key = child1.firstValue();
            var value = child1.secondValue();

            if (pass != 0 || !Skew.Resolving.Resolver.needsTypeContext(key)) {
              this.resolveAsParameterizedExpression(key, scope);
              keyType = this.mergeCommonType(keyType, key);
            }

            if (pass != 0 || !Skew.Resolving.Resolver.needsTypeContext(value)) {
              this.resolveAsParameterizedExpression(value, scope);
              valueType = this.mergeCommonType(valueType, value);
            }
          }

          // Resolve remaining children using the type context if valid
          if (keyType != null && valueType != null && Skew.Resolving.Resolver.isValidVariableType(keyType) && Skew.Resolving.Resolver.isValidVariableType(valueType)) {
            if (keyType == this.cache.intType) {
              this.resolveInitializerWithContext(node, scope, this.cache.createIntMapType(valueType));
              return;
            }

            if (keyType == this.cache.stringType) {
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

  Skew.Resolving.Resolver.prototype.resolveInitializerWithContext = function(node, scope, context) {
    var isList = node.kind == Skew.NodeKind.INITIALIZER_LIST;
    var create = this.findMember(context, isList ? '[new]' : '{new}');
    var add = this.findMember(context, isList ? '[...]' : '{...}');

    // Special-case imported literals to prevent an infinite loop for list literals
    if (add != null && add.isImported()) {
      var $function = add.asFunctionSymbol();

      if ($function.$arguments.length == (isList ? 1 : 2)) {
        var functionType = this.cache.substitute($function.resolvedType, context.environment);

        for (var child = node.firstChild(); child != null; child = child.nextSibling()) {
          if (child.kind == Skew.NodeKind.PAIR) {
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
    if (add != null) {
      var chain = new Skew.Node(Skew.NodeKind.DOT).withContent(new Skew.StringContent(create != null ? create.name : 'new')).appendChild(new Skew.Node(Skew.NodeKind.TYPE).withType(context).withRange(node.range)).withRange(node.range);

      while (node.hasChildren()) {
        var child1 = node.firstChild().remove();
        var dot = new Skew.Node(Skew.NodeKind.DOT).withContent(new Skew.StringContent(add.name)).appendChild(chain).withRange(child1.range);
        chain = Skew.Node.createCall(dot).withRange(child1.range);

        if (child1.kind == Skew.NodeKind.PAIR) {
          chain.appendChildrenFrom(child1);
        }

        else {
          chain.appendChild(child1);
        }
      }

      node.become(chain);
      this.resolveAsParameterizedExpressionWithConversion(node, scope, context);
      return true;
    }

    // Make sure there's a constructor to call
    if (create == null) {
      this.log.semanticErrorInitializerTypeInferenceFailed(node.range);
      return false;
    }

    var dot1 = new Skew.Node(Skew.NodeKind.DOT).withContent(new Skew.StringContent(create.name)).appendChild(new Skew.Node(Skew.NodeKind.TYPE).withType(context).withRange(node.range)).withRange(node.range);

    // Call the initializer constructor
    if (node.kind == Skew.NodeKind.INITIALIZER_MAP) {
      var firstValues = new Skew.Node(Skew.NodeKind.INITIALIZER_LIST);
      var secondValues = new Skew.Node(Skew.NodeKind.INITIALIZER_LIST);

      for (var child2 = node.firstChild(); child2 != null; child2 = child2.nextSibling()) {
        var first = child2.firstValue();
        var second = child2.secondValue();
        firstValues.appendChild(first.remove());
        secondValues.appendChild(second.remove());
      }

      node.become(Skew.Node.createCall(dot1).withRange(node.range).appendChild(firstValues).appendChild(secondValues));
    }

    else {
      node.become(Skew.Node.createCall(dot1).withRange(node.range).appendChild(new Skew.Node(Skew.NodeKind.INITIALIZER_LIST).appendChildrenFrom(node)));
    }

    this.resolveAsParameterizedExpressionWithConversion(node, scope, context);
    return true;
  };

  Skew.Resolving.Resolver.prototype.mergeCommonType = function(commonType, child) {
    if (commonType == null || child.resolvedType == Skew.Type.DYNAMIC) {
      return child.resolvedType;
    }

    var result = this.cache.commonImplicitType(commonType, child.resolvedType);

    if (result != null) {
      return result;
    }

    this.log.semanticErrorNoCommonType(child.range, commonType, child.resolvedType);
    return Skew.Type.DYNAMIC;
  };

  Skew.Resolving.Resolver.prototype.resolveLambda = function(node, scope, context) {
    var symbol = node.symbol.asFunctionSymbol();
    symbol.scope = new Skew.FunctionScope(scope, symbol);

    // Use type context to implicitly set missing types
    if (context != null && context.kind == Skew.TypeKind.LAMBDA) {
      // Copy over the argument types if they line up
      if (context.argumentTypes.length == symbol.$arguments.length) {
        for (var i = 0, count = symbol.$arguments.length; i < count; ++i) {
          var argument = symbol.$arguments[i];

          if (argument.type == null) {
            argument.type = new Skew.Node(Skew.NodeKind.TYPE).withType(context.argumentTypes[i]);
          }
        }
      }

      // Copy over the return type
      if (symbol.returnType == null && context.returnType != null) {
        symbol.returnType = new Skew.Node(Skew.NodeKind.TYPE).withType(context.returnType);
      }
    }

    else {
      // Only infer non-void return types if there's no type context
      if (symbol.returnType == null) {
        symbol.flags |= Skew.Symbol.SHOULD_INFER_RETURN_TYPE;
      }

      // Take argument types from call argument values for immediately-invoked
      // function expressions:
      //
      //   var sum = ((a, b) => a + b)(1, 2)
      //
      if (Skew.Resolving.Resolver.isCallValue(node) && node.parent().childCount() == (symbol.$arguments.length + 1 | 0)) {
        var child = node.nextSibling();

        for (var i2 = 0, count1 = symbol.$arguments.length; i2 < count1; ++i2) {
          var argument1 = symbol.$arguments[i2];

          if (argument1.type == null) {
            this.resolveAsParameterizedExpression(child, scope);
            argument1.type = new Skew.Node(Skew.NodeKind.TYPE).withType(child.resolvedType);
          }

          child = child.nextSibling();
        }
      }
    }

    this.resolveFunction(symbol);

    // Use a LambdaType instead of a SymbolType for the node
    var argumentTypes = [];
    var returnType = symbol.returnType;

    for (var i1 = 0, list = symbol.$arguments, count2 = list.length; i1 < count2; ++i1) {
      var argument2 = list[i1];
      argumentTypes.push(argument2.resolvedType);
    }

    node.resolvedType = this.cache.createLambdaType(argumentTypes, returnType != null ? returnType.resolvedType : null);
  };

  Skew.Resolving.Resolver.prototype.resolveLambdaType = function(node, scope) {
    var lambdaReturnType = node.lambdaReturnType();
    var argumentTypes = [];
    var returnType = null;

    for (var child = node.firstChild(); child != lambdaReturnType; child = child.nextSibling()) {
      this.resolveAsParameterizedType(child, scope);
      argumentTypes.push(child.resolvedType);
    }

    // An empty return type is signaled by the type "null"
    if (lambdaReturnType.kind != Skew.NodeKind.TYPE || lambdaReturnType.resolvedType != null) {
      this.resolveAsParameterizedType(lambdaReturnType, scope);
      returnType = lambdaReturnType.resolvedType;
    }

    node.resolvedType = this.cache.createLambdaType(argumentTypes, returnType);
  };

  Skew.Resolving.Resolver.prototype.resolveName = function(node, scope) {
    var enclosingFunction = scope.findEnclosingFunction();
    var name = node.asString();
    var symbol = null;

    // Search for a setter first, then search for a normal symbol
    if (Skew.Resolving.Resolver.shouldCheckForSetter(node)) {
      symbol = scope.find(name + '=');
    }

    // If a setter wasn't found, search for a normal symbol
    if (symbol == null) {
      symbol = scope.find(name);

      if (symbol == null) {
        this.reportGuardMergingFailure(node);
        this.log.semanticErrorUndeclaredSymbol(node.range, name);
        return;
      }
    }

    this.initializeSymbol(symbol);

    // Track reads and writes of local variables for later use
    this.recordStatistic(symbol, node.isAssignTarget() ? Skew.Resolving.SymbolStatistic.WRITE : Skew.Resolving.SymbolStatistic.READ);

    // Forbid referencing a base class global or constructor function from a derived class
    if (enclosingFunction != null && Skew.Resolving.Resolver.isBaseGlobalReference(enclosingFunction.symbol.parent, symbol)) {
      this.log.semanticErrorUndeclaredSymbol(node.range, name);
      return;
    }

    // Automatically insert "self." before instance symbols
    if (Skew.in_SymbolKind.isOnInstances(symbol.kind)) {
      var variable = enclosingFunction != null ? enclosingFunction.symbol.$this : null;

      if (variable != null && enclosingFunction.symbol.parent.asObjectSymbol().isSameOrHasBaseClass(symbol.parent)) {
        node.become(new Skew.Node(Skew.NodeKind.DOT).withContent(new Skew.StringContent(name)).appendChild(Skew.Node.createSymbolReference(variable)).withRange(node.range));
      }

      else {
        this.log.semanticErrorMemberUnexpectedInstance(node.range, symbol.name);
      }
    }

    // Type parameters for objects may only be used in certain circumstances
    else if (symbol.kind == Skew.SymbolKind.PARAMETER_OBJECT) {
      var parent = scope;
      var isValid = false;

      label: while (parent != null) {
        switch (parent.kind()) {
          case Skew.ScopeKind.OBJECT: {
            isValid = parent.asObjectScope().symbol == symbol.parent;
            break label;
          }

          case Skew.ScopeKind.FUNCTION: {
            var $function = parent.asFunctionScope().symbol;

            if ($function.kind != Skew.SymbolKind.FUNCTION_LOCAL) {
              isValid = $function.parent == symbol.parent;
              break label;
            }
            break;
          }

          case Skew.ScopeKind.VARIABLE: {
            var variable1 = parent.asVariableScope().symbol;
            isValid = variable1.kind == Skew.SymbolKind.VARIABLE_INSTANCE && variable1.parent == symbol.parent;
            break label;
          }
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
    var count = 0;

    for (var child = value.nextSibling(); child != null; child = child.nextSibling()) {
      this.resolveAsParameterizedType(child, scope);
      substitutions.push(child.resolvedType);
      ++count;
    }

    // Check for type parameters
    var type = value.resolvedType;
    var parameters = type.parameters();

    if (parameters == null || type.isParameterized()) {
      if (type != Skew.Type.DYNAMIC) {
        this.log.semanticErrorCannotParameterize(node.range, type);
      }

      value.resolvedType = Skew.Type.DYNAMIC;
      return;
    }

    // Check parameter count
    var expected = parameters.length;

    if (count != expected) {
      this.log.semanticErrorParameterCount(node.internalRangeOrRange(), expected, count);
      value.resolvedType = Skew.Type.DYNAMIC;
      return;
    }

    // Make sure all parameters have types
    for (var i = 0, list = parameters, count1 = list.length; i < count1; ++i) {
      var parameter = list[i];
      this.initializeSymbol(parameter);
    }

    // Include the symbol for use with Node.isType
    node.resolvedType = this.cache.substitute(type, this.cache.mergeEnvironments(type.environment, this.cache.createEnvironment(parameters, substitutions), null));
    node.symbol = value.symbol;
  };

  Skew.Resolving.Resolver.prototype.resolveSequence = function(node, scope, context) {
    for (var child = node.firstChild(); child != null; child = child.nextSibling()) {
      this.resolveAsParameterizedExpressionWithTypeContext(child, scope, child.nextSibling() == null ? context : null);
    }
  };

  Skew.Resolving.Resolver.prototype.resolveSuper = function(node, scope) {
    var $function = scope.findEnclosingFunction();
    var symbol = $function == null ? null : $function.symbol;
    var baseType = symbol == null ? null : symbol.parent.asObjectSymbol().baseType;
    var overridden = baseType == null ? null : this.findMember(baseType, symbol.name);

    if (overridden == null) {
      this.log.semanticErrorBadSuper(node.range);
      return;
    }

    // Calling a static method doesn't need special handling
    if (overridden.kind == Skew.SymbolKind.FUNCTION_GLOBAL) {
      node.kind = Skew.NodeKind.NAME;
    }

    node.resolvedType = overridden.resolvedType;
    node.symbol = overridden;
    this.automaticallyCallGetter(node, scope);
  };

  Skew.Resolving.Resolver.prototype.resolveTypeCheck = function(node, scope) {
    var value = node.typeCheckValue();
    var type = node.typeCheckType();
    this.resolveAsParameterizedExpression(value, scope);
    this.resolveAsParameterizedType(type, scope);
    this.checkConversion(value, type.resolvedType, Skew.Resolving.ConversionKind.EXPLICIT);
    node.resolvedType = this.cache.boolType;

    // Type checks don't work against interfaces
    if (type.resolvedType.isInterface()) {
      this.log.semanticWarningBadTypeCheck(type.range, type.resolvedType);
    }

    // Warn about unnecessary type checks
    else if (value.resolvedType != Skew.Type.DYNAMIC && this.cache.canImplicitlyConvert(value.resolvedType, type.resolvedType) && (type.resolvedType != Skew.Type.DYNAMIC || type.kind == Skew.NodeKind.TYPE)) {
      this.log.semanticWarningExtraTypeCheck(Skew.Range.span(node.internalRangeOrRange(), type.range), value.resolvedType, type.resolvedType);
    }
  };

  Skew.Resolving.Resolver.prototype.resolveBinary = function(node, scope) {
    var kind = node.kind;
    var left = node.binaryLeft();
    var right = node.binaryRight();

    // Special-case the equality operators
    if (kind == Skew.NodeKind.EQUAL || kind == Skew.NodeKind.NOT_EQUAL) {
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

      if (commonType == null) {
        this.log.semanticErrorNoCommonType(node.range, left.resolvedType, right.resolvedType);
      }

      else {
        node.resolvedType = this.cache.boolType;
      }

      return;
    }

    // Special-case assignment since it's not overridable
    if (kind == Skew.NodeKind.ASSIGN) {
      this.resolveAsParameterizedExpression(left, scope);

      // Automatically call setters
      if (left.symbol != null && left.symbol.isSetter()) {
        node.become(Skew.Node.createCall(left.remove()).withRange(node.range).withInternalRange(right.range).appendChild(right.remove()));
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
    if (kind == Skew.NodeKind.LOGICAL_AND || kind == Skew.NodeKind.LOGICAL_OR) {
      this.resolveAsParameterizedExpressionWithConversion(left, scope, this.cache.boolType);
      this.resolveAsParameterizedExpressionWithConversion(right, scope, this.cache.boolType);
      node.resolvedType = this.cache.boolType;
      return;
    }

    this.resolveOperatorOverload(node, scope);
  };

  Skew.Resolving.Resolver.prototype.resolveOperatorOverload = function(node, scope) {
    // The order of operands are reversed for the "in" operator
    var kind = node.kind;
    var reverseBinaryOrder = kind == Skew.NodeKind.IN;
    var first = node.firstChild();
    var second = first.nextSibling();
    var target = reverseBinaryOrder ? second : first;
    var other = Skew.in_NodeKind.isBinary(kind) ? reverseBinaryOrder ? first : second : null;

    // Allow "foo in [.FOO, .BAR]"
    if (kind == Skew.NodeKind.IN && target.kind == Skew.NodeKind.INITIALIZER_LIST && !Skew.Resolving.Resolver.needsTypeContext(other)) {
      this.resolveAsParameterizedExpression(other, scope);
      this.resolveAsParameterizedExpressionWithTypeContext(target, scope, other.resolvedType != Skew.Type.DYNAMIC ? this.cache.createListType(other.resolvedType) : null);
    }

    // Resolve just the target since the other arguments may need type context from overload resolution
    else {
      this.resolveAsParameterizedExpression(target, scope);
    }

    // Can't do overload resolution on the dynamic type
    var type = target.resolvedType;

    if (type == Skew.Type.DYNAMIC) {
      if (Skew.in_NodeKind.isAssign(kind)) {
        this.checkStorage(target, scope);
      }

      this.resolveChildrenAsParameterizedExpressions(node, scope);
      return;
    }

    // Check if the operator can be overridden at all
    var info = Skew.operatorInfo[kind];

    if (info.kind != Skew.OperatorKind.OVERRIDABLE) {
      this.log.semanticErrorUnknownMemberSymbol(node.internalRangeOrRange(), info.text, type);
      this.resolveChildrenAsParameterizedExpressions(node, scope);
      return;
    }

    // Auto-convert int to double and enum to int when it appears as the target
    if (other != null && !Skew.in_NodeKind.isBinaryAssign(kind)) {
      if (type == this.cache.intType) {
        this.resolveAsParameterizedExpression(other, scope);

        if (other.resolvedType == this.cache.doubleType) {
          this.checkConversion(target, this.cache.doubleType, Skew.Resolving.ConversionKind.IMPLICIT);
          type = this.cache.doubleType;
        }
      }

      else if (type.isEnum()) {
        this.resolveAsParameterizedExpression(other, scope);

        if (this.cache.isNumeric(other.resolvedType)) {
          type = this.cache.commonImplicitType(type, other.resolvedType);
          assert(type != null);

          if (type.isEnum()) {
            type = this.cache.intType;
          }

          this.checkConversion(other, type, Skew.Resolving.ConversionKind.IMPLICIT);
          this.checkConversion(target, type, Skew.Resolving.ConversionKind.IMPLICIT);
        }
      }
    }

    // Find the operator method
    var isComparison = Skew.in_NodeKind.isBinaryComparison(kind);
    var name = isComparison ? '<=>' : info.text;
    var symbol = this.findMember(type, name);

    if (symbol == null) {
      this.log.semanticErrorUnknownMemberSymbol(node.internalRangeOrRange(), name, type);
      this.resolveChildrenAsParameterizedExpressions(node, scope);
      return;
    }

    var symbolType = this.cache.substitute(symbol.resolvedType, type.environment);

    // Resolve the overload now so the symbol's properties can be inspected
    if (Skew.in_SymbolKind.isOverloadedFunction(symbol.kind)) {
      if (reverseBinaryOrder) {
        first.swapWith(second);
      }

      symbolType = this.resolveOverloadedFunction(node.internalRangeOrRange(), node, scope, symbolType);

      if (reverseBinaryOrder) {
        first.swapWith(second);
      }

      if (symbolType == null) {
        this.resolveChildrenAsParameterizedExpressions(node, scope);
        return;
      }

      symbol = symbolType.symbol;
    }

    var isRawImport = symbol.isImported() && !symbol.isRenamed();
    node.symbol = symbol;
    this.checkAccess(node, node.internalRangeOrRange(), scope);

    // Check for a valid storage location for imported operators
    if (Skew.in_NodeKind.isAssign(kind) && symbol.isImported()) {
      this.checkStorage(target, scope);
    }

    // "<", ">", "<=", or ">="
    if (isComparison && (isRawImport || type == this.cache.doubleType)) {
      this.resolveChildrenAsParameterizedExpressions(node, scope);
      node.resolvedType = this.cache.boolType;
      node.symbol = null;
      return;
    }

    // "<=>"
    if (kind == Skew.NodeKind.COMPARE && isRawImport) {
      this.resolveChildrenAsParameterizedExpressions(node, scope);
      node.kind = Skew.NodeKind.SUBTRACT;
      node.resolvedType = this.cache.intType;
      node.symbol = null;
      return;
    }

    // Don't replace the operator with a call if it's just used for type checking
    if (isRawImport) {
      if (reverseBinaryOrder) {
        first.swapWith(second);
      }

      if (!this.resolveFunctionCall(node, scope, symbolType)) {
        this.resolveChildrenAsParameterizedExpressions(node, scope);
      }

      if (reverseBinaryOrder) {
        first.swapWith(second);
      }

      return;
    }

    // Resolve the method call
    if (reverseBinaryOrder) {
      first.swapWith(second);
    }

    target = new Skew.Node(Skew.NodeKind.DOT).withContent(new Skew.StringContent(name)).appendChild(target.remove()).withSymbol(symbol).withRange(node.internalRangeOrRange());
    node.prependChild(target);

    // Implement the logic for the "<=>" operator
    if (isComparison) {
      var call = new Skew.Node(Skew.NodeKind.CALL).appendChildrenFrom(node).withRange(node.range);
      node.appendChild(call);
      node.appendChild(new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.IntContent(0)).withType(this.cache.intType));
      node.resolvedType = this.cache.boolType;
      this.resolveFunctionCall(call, scope, symbolType);
      return;
    }

    // All other operators are just normal method calls
    node.kind = Skew.NodeKind.CALL;
    this.resolveFunctionCall(node, scope, symbolType);
  };

  Skew.Resolving.Resolver.prototype.automaticallyCallGetter = function(node, scope) {
    var symbol = node.symbol;

    if (symbol == null) {
      return false;
    }

    var kind = symbol.kind;
    var parent = node.parent();

    // The check for getters is complicated by overloaded functions
    if (!symbol.isGetter() && Skew.in_SymbolKind.isOverloadedFunction(kind) && (!Skew.Resolving.Resolver.isCallValue(node) || parent.hasOneChild())) {
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
      node.become(Skew.Node.createCall(node.cloneAndStealChildren()).withRange(node.range));
      this.resolveAsParameterizedExpression(node, scope);
      return true;
    }

    // Forbid bare function references
    if (!symbol.isSetter() && node.resolvedType != Skew.Type.DYNAMIC && Skew.in_SymbolKind.isFunctionOrOverloadedFunction(kind) && kind != Skew.SymbolKind.FUNCTION_ANNOTATION && !Skew.Resolving.Resolver.isCallValue(node) && (parent == null || parent.kind != Skew.NodeKind.PARAMETERIZE || !Skew.Resolving.Resolver.isCallValue(parent))) {
      this.log.semanticErrorMustCallFunction(node.internalRangeOrRange(), symbol.name);
      node.resolvedType = Skew.Type.DYNAMIC;
    }

    return false;
  };

  Skew.Resolving.Resolver.prototype.convertSwitchToIfChain = function(node, scope) {
    var variable = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_LOCAL, scope.generateName('value'));
    var value = node.switchValue().remove();
    var block = null;

    // Stash the variable being switched over so it's only evaluated once
    variable.resolvedType = value.resolvedType;
    variable.value = value;
    variable.state = Skew.SymbolState.INITIALIZED;
    node.parent().insertChildBefore(node, new Skew.Node(Skew.NodeKind.VARIABLES).appendChild(Skew.Node.createVariable(variable)));

    // Build the chain in reverse starting with the last case
    for (var child = node.lastChild(); child != null; child = child.previousSibling()) {
      var caseBlock = child.caseBlock().remove();
      var test = null;

      // Combine adjacent cases in a "||" chain
      while (child.hasChildren()) {
        var caseValue = Skew.Node.createBinary(Skew.NodeKind.EQUAL, Skew.Node.createSymbolReference(variable), child.firstChild().remove()).withType(this.cache.boolType);
        test = test != null ? Skew.Node.createBinary(Skew.NodeKind.LOGICAL_OR, test, caseValue).withType(this.cache.boolType) : caseValue;
      }

      // Chain if-else statements together
      block = test != null ? new Skew.Node(Skew.NodeKind.BLOCK).appendChild(Skew.Node.createIf(test, caseBlock, block)) : caseBlock;
    }

    // Replace the switch statement with the if chain
    if (block != null) {
      node.replaceWithChildrenFrom(block);
    }

    else {
      node.remove();
    }
  };

  Skew.Resolving.Resolver.shouldCheckForSetter = function(node) {
    return node.parent() != null && node.parent().kind == Skew.NodeKind.ASSIGN && node == node.parent().binaryLeft();
  };

  Skew.Resolving.Resolver.isVoidExpressionUsed = function(node) {
    // Check for a null parent to handle variable initializers
    var parent = node.parent();
    return parent == null || parent.kind != Skew.NodeKind.EXPRESSION && !parent.isImplicitReturn() && (parent.kind != Skew.NodeKind.ANNOTATION || node != parent.annotationValue()) && (parent.kind != Skew.NodeKind.FOR || node != parent.forUpdate()) && parent.kind != Skew.NodeKind.SEQUENCE;
  };

  Skew.Resolving.Resolver.isValidVariableType = function(type) {
    return type != Skew.Type.NULL && (type.kind != Skew.TypeKind.SYMBOL || !Skew.in_SymbolKind.isFunctionOrOverloadedFunction(type.symbol.kind));
  };

  Skew.Resolving.Resolver.isBaseGlobalReference = function(parent, member) {
    return parent != null && parent.kind == Skew.SymbolKind.OBJECT_CLASS && Skew.in_SymbolKind.isGlobalReference(member.kind) && member.parent != parent && member.parent.kind == Skew.SymbolKind.OBJECT_CLASS && parent.asObjectSymbol().hasBaseClass(member.parent);
  };

  Skew.Resolving.Resolver.isCallValue = function(node) {
    var parent = node.parent();
    return parent != null && parent.kind == Skew.NodeKind.CALL && node == parent.callValue();
  };

  Skew.Resolving.Resolver.needsTypeContext = function(node) {
    return node.kind == Skew.NodeKind.DOT && node.dotTarget() == null || node.kind == Skew.NodeKind.HOOK && Skew.Resolving.Resolver.needsTypeContext(node.hookTrue()) && Skew.Resolving.Resolver.needsTypeContext(node.hookFalse()) || Skew.in_NodeKind.isInitializer(node.kind);
  };

  Skew.Resolving.Resolver.GuardMergingFailure = function() {
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
    assert(this.kind() == Skew.ScopeKind.OBJECT);
    return this;
  };

  Skew.Scope.prototype.asFunctionScope = function() {
    assert(this.kind() == Skew.ScopeKind.FUNCTION);
    return this;
  };

  Skew.Scope.prototype.asVariableScope = function() {
    assert(this.kind() == Skew.ScopeKind.VARIABLE);
    return this;
  };

  Skew.Scope.prototype.asLocalScope = function() {
    assert(this.kind() == Skew.ScopeKind.LOCAL);
    return this;
  };

  Skew.Scope.prototype.findEnclosingFunctionOrLambda = function() {
    var scope = this;

    while (scope != null) {
      if (scope.kind() == Skew.ScopeKind.FUNCTION) {
        return scope.asFunctionScope();
      }

      scope = scope.parent;
    }

    return null;
  };

  Skew.Scope.prototype.findEnclosingFunction = function() {
    var scope = this;

    while (scope != null) {
      if (scope.kind() == Skew.ScopeKind.FUNCTION && scope.asFunctionScope().symbol.kind != Skew.SymbolKind.FUNCTION_LOCAL) {
        return scope.asFunctionScope();
      }

      scope = scope.parent;
    }

    return null;
  };

  Skew.Scope.prototype.findEnclosingLoop = function() {
    var scope = this;

    while (scope != null && scope.kind() == Skew.ScopeKind.LOCAL) {
      if (scope.asLocalScope().type == Skew.LocalType.LOOP) {
        return scope.asLocalScope();
      }

      scope = scope.parent;
    }

    return null;
  };

  Skew.Scope.prototype.generateName = function(prefix) {
    var count = 0;
    var name = prefix;

    while (this.isNameUsed(name)) {
      ++count;
      name = prefix + count.toString();
    }

    this.reserveName(name, null);
    return name;
  };

  Skew.Scope.prototype.reserveName = function(name, symbol) {
    if (this.used == null) {
      this.used = Object.create(null);
    }

    if (!(name in this.used)) {
      this.used[name] = symbol;
    }
  };

  Skew.Scope.prototype.isNameUsed = function(name) {
    return this.find(name) != null || this.used != null && name in this.used;
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
    var result = in_StringMap.get(this.symbol.members, name, null);
    return result != null ? result : this.parent != null ? this.parent.find(name) : null;
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
    return result != null ? result : this.parent != null ? this.parent.find(name) : null;
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
    return this.parent != null ? this.parent.find(name) : null;
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
    return result != null ? result : this.parent != null ? this.parent.find(name) : null;
  };

  Skew.LocalScope.prototype.define = function(symbol, log) {
    symbol.scope = this;

    // Check for duplicates
    var other = in_StringMap.get(this.locals, symbol.name, null);

    if (other != null) {
      log.semanticErrorDuplicateSymbol(symbol.range, symbol.name, other.range);
      return;
    }

    // Check for shadowing
    var scope = this.parent;

    while (scope.kind() == Skew.ScopeKind.LOCAL) {
      var local = in_StringMap.get(scope.asLocalScope().locals, symbol.name, null);

      if (local != null) {
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
    this._mode = 0;
    this.context = null;
    this._currentUsages = null;
    this._overridesForSymbol = {};
    this._usages = {};
    this._mode = mode;
    this._visitObject(global);
    this._changeContext(null);
  };

  Skew.UsageGraph.prototype.usagesForSymbols = function(symbols) {
    var overridesToCheck = {};
    var combinedUsages = {};
    var stack = [];
    in_List.append1(stack, symbols);

    // Iterate until a fixed point is reached
    while (!(stack.length == 0)) {
      var symbol = stack.pop();

      if (!(symbol.id in combinedUsages)) {
        combinedUsages[symbol.id] = symbol;
        var symbolUsages = in_IntMap.get(this._usages, symbol.id, null);

        if (symbolUsages != null) {
          in_List.append1(stack, symbolUsages);
        }

        // Handle function overrides
        if (Skew.in_SymbolKind.isFunction(symbol.kind)) {
          var overridden = symbol.asFunctionSymbol().overridden;
          var symbolOverrides = in_IntMap.get(this._overridesForSymbol, symbol.id, null);

          // Automatically include all overridden functions in case the use
          // of this type is polymorphic, which is a conservative estimate
          if (overridden != null) {
            stack.push(overridden);
          }

          // Check function overrides too
          if (symbolOverrides != null) {
            for (var i = 0, list = symbolOverrides, count = list.length; i < count; ++i) {
              var override = list[i];
              var key = override.parent.id;

              // Queue this override immediately if the parent type is used
              if (key in combinedUsages) {
                stack.push(override);
              }

              // Otherwise, remember this override for later if the parent type ends up being used
              else {
                var overrides = in_IntMap.get(overridesToCheck, key, null);

                if (overrides == null) {
                  overrides = [];
                  overridesToCheck[key] = overrides;
                }

                overrides.push(override);
              }
            }
          }
        }

        // Handle overrides dependent on this type
        else if (Skew.in_SymbolKind.isType(symbol.kind)) {
          var overrides1 = in_IntMap.get(overridesToCheck, symbol.id, null);

          if (overrides1 != null) {
            in_List.append1(stack, overrides1);
          }
        }
      }
    }

    return combinedUsages;
  };

  Skew.UsageGraph.prototype._changeContext = function(symbol) {
    if (this.context != null) {
      this._usages[this.context.id] = in_IntMap.values(this._currentUsages);
    }

    this._currentUsages = {};

    if (symbol != null) {
      this._currentUsages[symbol.id] = symbol;
    }

    this.context = symbol;
  };

  Skew.UsageGraph.prototype._recordOverride = function(base, derived) {
    var overrides = in_IntMap.get(this._overridesForSymbol, base.id, null);

    if (overrides == null) {
      overrides = [];
      this._overridesForSymbol[base.id] = overrides;
    }

    overrides.push(derived);
  };

  Skew.UsageGraph.prototype._recordUsage = function(symbol) {
    if (!Skew.in_SymbolKind.isLocal(symbol.kind)) {
      this._currentUsages[symbol.id] = symbol;
    }
  };

  Skew.UsageGraph.prototype._visitObject = function(symbol) {
    for (var i = 0, list = symbol.objects, count = list.length; i < count; ++i) {
      var object = list[i];
      this._changeContext(object);
      this._recordUsage(symbol);

      if (object.baseClass != null) {
        this._recordUsage(object.baseClass);
      }

      this._visitObject(object);
    }

    for (var i1 = 0, list1 = symbol.functions, count1 = list1.length; i1 < count1; ++i1) {
      var $function = list1[i1];
      this._changeContext($function);

      // Interface functions shouldn't cause interfaces to be emitted for dynamically-typed targets
      if (this._mode != Skew.ShakingMode.IGNORE_TYPES || symbol.kind != Skew.SymbolKind.OBJECT_INTERFACE || $function.kind != Skew.SymbolKind.FUNCTION_INSTANCE) {
        this._recordUsage(symbol);
      }

      this._visitFunction($function);

      // Remember which functions are overridden for later
      if ($function.overridden != null) {
        this._recordOverride($function.overridden, $function);
      }
    }

    for (var i2 = 0, list2 = symbol.variables, count2 = list2.length; i2 < count2; ++i2) {
      var variable = list2[i2];
      this._changeContext(variable);
      this._recordUsage(symbol);
      this._visitVariable(variable);
    }
  };

  Skew.UsageGraph.prototype._visitFunction = function(symbol) {
    for (var i = 0, list = symbol.$arguments, count = list.length; i < count; ++i) {
      var argument = list[i];
      this._visitVariable(argument);
    }

    this._visitType(symbol.resolvedType.returnType);
    this._visitNode(symbol.block);

    // Remember which functions are overridden for later
    if (symbol.implementations != null) {
      for (var i1 = 0, list1 = symbol.implementations, count1 = list1.length; i1 < count1; ++i1) {
        var $function = list1[i1];
        this._recordOverride(symbol, $function);
      }
    }
  };

  Skew.UsageGraph.prototype._visitVariable = function(symbol) {
    this._visitType(symbol.resolvedType);
    this._visitNode(symbol.value);
  };

  Skew.UsageGraph.prototype._visitNode = function(node) {
    if (node == null) {
      return;
    }

    if (node.kind == Skew.NodeKind.CAST) {
      this._visitNode(node.castValue());
      this._visitType(node.castType().resolvedType);
    }

    else {
      for (var child = node.firstChild(); child != null; child = child.nextSibling()) {
        this._visitNode(child);
      }
    }

    if (node.symbol != null) {
      this._recordUsage(node.symbol);
    }

    switch (node.kind) {
      case Skew.NodeKind.LAMBDA: {
        var $function = node.symbol.asFunctionSymbol();

        for (var i = 0, list = $function.$arguments, count = list.length; i < count; ++i) {
          var argument = list[i];
          this._visitVariable(argument);
        }

        this._visitType($function.resolvedType.returnType);
        break;
      }

      case Skew.NodeKind.VARIABLE: {
        this._visitType(node.symbol.asVariableSymbol().resolvedType);
        break;
      }
    }
  };

  Skew.UsageGraph.prototype._visitType = function(type) {
    if (this._mode == Skew.ShakingMode.USE_TYPES && type != null && type.symbol != null) {
      this._recordUsage(type.symbol);

      // This should be a tree too, so infinite loops should not happen
      if (type.isParameterized()) {
        for (var i = 0, list = type.substitutions, count = list.length; i < count; ++i) {
          var substitution = list[i];
          this._visitType(substitution);
        }
      }
    }
  };

  Skew.Shaking = {};

  Skew.Shaking.collectExportedSymbols = function(symbol, symbols, entryPoint) {
    for (var i = 0, list = symbol.objects, count = list.length; i < count; ++i) {
      var object = list[i];
      Skew.Shaking.collectExportedSymbols(object, symbols, entryPoint);

      if (object.isExported()) {
        symbols.push(object);
      }
    }

    for (var i1 = 0, list1 = symbol.functions, count1 = list1.length; i1 < count1; ++i1) {
      var $function = list1[i1];

      if ($function.isExported() || $function == entryPoint) {
        symbols.push($function);
      }
    }

    for (var i2 = 0, list2 = symbol.variables, count2 = list2.length; i2 < count2; ++i2) {
      var variable = list2[i2];

      if (variable.isExported()) {
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
    this.id = Skew.Type._createID();
    this.kind = kind;
    this.symbol = symbol;
    this.environment = null;
    this.substitutions = null;
    this.argumentTypes = null;
    this.returnType = null;
    this.substitutionCache = null;
  };

  Skew.Type.prototype.parameters = function() {
    return this.symbol == null ? null : Skew.in_SymbolKind.isObject(this.symbol.kind) ? this.symbol.asObjectSymbol().parameters : Skew.in_SymbolKind.isFunction(this.symbol.kind) ? this.symbol.asFunctionSymbol().parameters : null;
  };

  Skew.Type.prototype.isParameterized = function() {
    return this.substitutions != null;
  };

  Skew.Type.prototype.isWrapped = function() {
    return this.symbol != null && this.symbol.kind == Skew.SymbolKind.OBJECT_WRAPPED;
  };

  Skew.Type.prototype.isClass = function() {
    return this.symbol != null && this.symbol.kind == Skew.SymbolKind.OBJECT_CLASS;
  };

  Skew.Type.prototype.isInterface = function() {
    return this.symbol != null && this.symbol.kind == Skew.SymbolKind.OBJECT_INTERFACE;
  };

  Skew.Type.prototype.isEnum = function() {
    return this.symbol != null && this.symbol.kind == Skew.SymbolKind.OBJECT_ENUM;
  };

  Skew.Type.prototype.isParameter = function() {
    return this.symbol != null && Skew.in_SymbolKind.isParameter(this.symbol.kind);
  };

  // Type parameters are not guaranteed to be nullable since generics are
  // implemented through type erasure and the substituted type may be "int"
  Skew.Type.prototype.isReference = function() {
    return this.symbol == null || !this.symbol.isValueType() && !Skew.in_SymbolKind.isParameter(this.symbol.kind) && (this.symbol.kind != Skew.SymbolKind.OBJECT_WRAPPED || this.symbol.asObjectSymbol().wrappedType.isReference());
  };

  Skew.Type.prototype.toString = function() {
    if (this.kind == Skew.TypeKind.SYMBOL) {
      if (this.isParameterized()) {
        var name = this.symbol.fullName() + '<';

        for (var i = 0, count = this.substitutions.length; i < count; ++i) {
          if (i != 0) {
            name += ', ';
          }

          name += this.substitutions[i].toString();
        }

        return name + '>';
      }

      return this.symbol.fullName();
    }

    if (this.kind == Skew.TypeKind.LAMBDA) {
      var result = 'fn(';

      for (var i1 = 0, count1 = this.argumentTypes.length; i1 < count1; ++i1) {
        if (i1 != 0) {
          result += ', ';
        }

        result += this.argumentTypes[i1].toString();
      }

      return result + (this.returnType != null ? ') ' + this.returnType.toString() : ')');
    }

    return this == Skew.Type.DYNAMIC ? 'dynamic' : 'null';
  };

  Skew.Type.prototype.baseType = function() {
    return this.isClass() ? this.symbol.asObjectSymbol().baseType : null;
  };

  Skew.Type.prototype.interfaceTypes = function() {
    return this.isClass() ? this.symbol.asObjectSymbol().interfaceTypes : null;
  };

  Skew.Type.initialize = function() {
    if (Skew.Type.DYNAMIC == null) {
      Skew.Type.DYNAMIC = new Skew.Type(Skew.TypeKind.SPECIAL, null);
    }

    if (Skew.Type.NULL == null) {
      Skew.Type.NULL = new Skew.Type(Skew.TypeKind.SPECIAL, null);
    }
  };

  Skew.Type._createID = function() {
    ++Skew.Type._nextID;
    return Skew.Type._nextID;
  };

  Skew.Environment = function(parameters, substitutions) {
    this.id = Skew.Environment._createID();
    this.parameters = parameters;
    this.substitutions = substitutions;
    this.mergeCache = null;
  };

  Skew.Environment._createID = function() {
    ++Skew.Environment._nextID;
    return Skew.Environment._nextID;
  };

  Skew.TypeCache = function() {
    this.boolType = null;
    this.boxType = null;
    this.doubleType = null;
    this.intMapType = null;
    this.intType = null;
    this.listType = null;
    this.stringMapType = null;
    this.stringType = null;
    this.intToStringSymbol = null;
    this.boolToStringSymbol = null;
    this.doubleToStringSymbol = null;
    this.intPowerSymbol = null;
    this.doublePowerSymbol = null;
    this.stringCountSymbol = null;
    this.entryPointSymbol = null;
    this._environments = {};
    this._lambdaTypes = {};
  };

  Skew.TypeCache.prototype.loadGlobals = function(log, global) {
    Skew.Type.initialize();
    this.boolType = Skew.TypeCache._loadGlobalClass(global, 'bool', Skew.Symbol.IS_VALUE_TYPE);
    this.boxType = Skew.TypeCache._loadGlobalClass(global, 'Box', 0);
    this.doubleType = Skew.TypeCache._loadGlobalClass(global, 'double', Skew.Symbol.IS_VALUE_TYPE);
    this.intMapType = Skew.TypeCache._loadGlobalClass(global, 'IntMap', 0);
    this.intType = Skew.TypeCache._loadGlobalClass(global, 'int', Skew.Symbol.IS_VALUE_TYPE);
    this.listType = Skew.TypeCache._loadGlobalClass(global, 'List', 0);
    this.stringMapType = Skew.TypeCache._loadGlobalClass(global, 'StringMap', 0);
    this.stringType = Skew.TypeCache._loadGlobalClass(global, 'string', 0);
    this.intToStringSymbol = Skew.TypeCache._loadInstanceFunction(this.intType, 'toString');
    this.boolToStringSymbol = Skew.TypeCache._loadInstanceFunction(this.boolType, 'toString');
    this.doubleToStringSymbol = Skew.TypeCache._loadInstanceFunction(this.doubleType, 'toString');
    this.intPowerSymbol = Skew.TypeCache._loadInstanceFunction(this.intType, '**');
    this.doublePowerSymbol = Skew.TypeCache._loadInstanceFunction(this.doubleType, '**');
    this.stringCountSymbol = Skew.TypeCache._loadInstanceFunction(this.stringType, 'count');
  };

  Skew.TypeCache.prototype.isEquivalentToBool = function(type) {
    return this.unwrappedType(type) == this.boolType;
  };

  Skew.TypeCache.prototype.isEquivalentToInt = function(type) {
    return this.unwrappedType(type) == this.intType || type.isEnum();
  };

  Skew.TypeCache.prototype.isEquivalentToDouble = function(type) {
    return this.unwrappedType(type) == this.doubleType;
  };

  Skew.TypeCache.prototype.isEquivalentToString = function(type) {
    return this.unwrappedType(type) == this.stringType;
  };

  Skew.TypeCache.prototype.isInteger = function(type) {
    return type == this.intType || type.isEnum();
  };

  Skew.TypeCache.prototype.isNumeric = function(type) {
    return this.isInteger(type) || type == this.doubleType;
  };

  Skew.TypeCache.prototype.isList = function(type) {
    return type.symbol == this.listType.symbol;
  };

  Skew.TypeCache.prototype.isIntMap = function(type) {
    return type.symbol == this.intMapType.symbol;
  };

  Skew.TypeCache.prototype.isStringMap = function(type) {
    return type.symbol == this.stringMapType.symbol;
  };

  Skew.TypeCache.prototype.isBaseType = function(derived, base) {
    if (derived.isClass() && base.isClass()) {
      while (true) {
        var baseType = derived.baseType();

        if (baseType == null) {
          break;
        }

        derived = this.substitute(baseType, derived.environment);

        if (derived == base) {
          return true;
        }
      }
    }

    return false;
  };

  Skew.TypeCache.prototype.isImplementedInterface = function(classType, interfaceType) {
    if (classType.isClass() && interfaceType.isInterface()) {
      while (classType != null) {
        var interfaceTypes = classType.interfaceTypes();

        if (interfaceTypes != null) {
          for (var i = 0, list = interfaceTypes, count = list.length; i < count; ++i) {
            var type = list[i];

            if (this.substitute(type, classType.environment) == interfaceType) {
              return true;
            }
          }
        }

        var baseType = classType.baseType();

        if (baseType == null) {
          break;
        }

        classType = this.substitute(baseType, classType.environment);
      }
    }

    return false;
  };

  Skew.TypeCache.prototype.unwrappedType = function(type) {
    if (type.isWrapped()) {
      var inner = type.symbol.asObjectSymbol().wrappedType;

      if (inner != null) {
        return this.unwrappedType(this.substitute(inner, type.environment));
      }
    }

    return type;
  };

  Skew.TypeCache.prototype.canImplicitlyConvert = function(from, to) {
    if (from == to) {
      return true;
    }

    if (from == Skew.Type.DYNAMIC || to == Skew.Type.DYNAMIC) {
      return true;
    }

    if (from == Skew.Type.NULL && to.isReference()) {
      return true;
    }

    if (from == this.intType && to == this.doubleType) {
      return true;
    }

    if (this.isBaseType(from, to)) {
      return true;
    }

    if (this.isImplementedInterface(from, to)) {
      return true;
    }

    if (from.isEnum() && !to.isEnum() && this.isNumeric(to)) {
      return true;
    }

    return false;
  };

  Skew.TypeCache.prototype.canExplicitlyConvert = function(from, to) {
    from = this.unwrappedType(from);
    to = this.unwrappedType(to);

    if (this.canImplicitlyConvert(from, to)) {
      return true;
    }

    if (this._canCastToNumeric(from) && this._canCastToNumeric(to)) {
      return true;
    }

    if (this.isBaseType(to, from)) {
      return true;
    }

    if (this.isImplementedInterface(to, from)) {
      return true;
    }

    if (to.isEnum() && this.isNumeric(from)) {
      return true;
    }

    return false;
  };

  Skew.TypeCache.prototype.commonImplicitType = function(left, right) {
    // Short-circuit early for identical types
    if (left == right) {
      return left;
    }

    // Dynamic is a hole in the type system
    if (left == Skew.Type.DYNAMIC || right == Skew.Type.DYNAMIC) {
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
      return Skew.TypeCache._commonBaseType(left, right);
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
    assert(parameters.length == substitutions.length);

    // Hash the inputs
    var hash = Skew.TypeCache._hashTypes(Skew.TypeCache._hashParameters(parameters), substitutions);
    var bucket = in_IntMap.get(this._environments, hash, null);

    // Check existing environments in the bucket for a match
    if (bucket != null) {
      for (var i = 0, list = bucket, count = list.length; i < count; ++i) {
        var existing = list[i];

        if (in_List.equals(parameters, existing.parameters) && in_List.equals(substitutions, existing.substitutions)) {
          return existing;
        }
      }
    }

    // Make a new bucket
    else {
      bucket = [];
      this._environments[hash] = bucket;
    }

    // Make a new environment
    var environment = new Skew.Environment(parameters, substitutions);
    bucket.push(environment);
    return environment;
  };

  Skew.TypeCache.prototype.createLambdaType = function(argumentTypes, returnType) {
    var hash = Skew.TypeCache._hashTypes(returnType != null ? returnType.id : -1, argumentTypes);
    var bucket = in_IntMap.get(this._lambdaTypes, hash, null);

    // Check existing types in the bucket for a match
    if (bucket != null) {
      for (var i = 0, list = bucket, count = list.length; i < count; ++i) {
        var existing = list[i];

        if (in_List.equals(argumentTypes, existing.argumentTypes) && returnType == existing.returnType) {
          return existing;
        }
      }
    }

    // Make a new bucket
    else {
      bucket = [];
      this._lambdaTypes[hash] = bucket;
    }

    // Make a new lambda type
    var type = new Skew.Type(Skew.TypeKind.LAMBDA, null);
    type.argumentTypes = argumentTypes;
    type.returnType = returnType;
    bucket.push(type);
    return type;
  };

  Skew.TypeCache.prototype.mergeEnvironments = function(a, b, restrictions) {
    if (a == null) {
      return b;
    }

    if (b == null) {
      return a;
    }

    var parameters = a.parameters.slice();
    var substitutions = this.substituteAll(a.substitutions, b);

    for (var i = 0, count = b.parameters.length; i < count; ++i) {
      var parameter = b.parameters[i];
      var substitution = b.substitutions[i];

      if (!(parameters.indexOf(parameter) != -1) && (restrictions == null || restrictions.indexOf(parameter) != -1)) {
        parameters.push(parameter);
        substitutions.push(substitution);
      }
    }

    return this.createEnvironment(parameters, substitutions);
  };

  Skew.TypeCache.prototype.parameterize = function(type) {
    var parameters = type.parameters();

    if (parameters == null) {
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

    if (environment == null || environment == existing) {
      return type;
    }

    // Merge the type environments (this matters for nested generics). For
    // object types, limit the parameters in the environment to just those
    // on this type and the base type.
    var parameters = type.parameters();

    if (existing != null) {
      environment = this.mergeEnvironments(existing, environment, type.kind == Skew.TypeKind.SYMBOL && Skew.in_SymbolKind.isFunctionOrOverloadedFunction(type.symbol.kind) ? null : parameters);
    }

    // Check to see if this has been computed before
    var rootType = type.kind == Skew.TypeKind.SYMBOL ? type.symbol.resolvedType : type;

    if (rootType.substitutionCache == null) {
      rootType.substitutionCache = {};
    }

    var substituted = in_IntMap.get(rootType.substitutionCache, environment.id, null);

    if (substituted != null) {
      return substituted;
    }

    substituted = type;

    if (type.kind == Skew.TypeKind.LAMBDA) {
      var argumentTypes = [];
      var returnType = null;

      // Substitute function arguments
      for (var i = 0, list = type.argumentTypes, count = list.length; i < count; ++i) {
        var argumentType = list[i];
        argumentTypes.push(this.substitute(argumentType, environment));
      }

      // Substitute return type
      if (type.returnType != null) {
        returnType = this.substitute(type.returnType, environment);
      }

      substituted = this.createLambdaType(argumentTypes, returnType);
    }

    else if (type.kind == Skew.TypeKind.SYMBOL) {
      var symbol = type.symbol;

      // Parameters just need simple substitution
      if (Skew.in_SymbolKind.isParameter(symbol.kind)) {
        var index = environment.parameters.indexOf(symbol.asParameterSymbol());

        if (index != -1) {
          substituted = environment.substitutions[index];
        }
      }

      // Symbols with type parameters are more complicated
      // Overloaded functions are also included even though they don't have
      // type parameters because the type environment needs to be bundled
      // for later substitution into individual matched overloads
      else if (parameters != null || Skew.in_SymbolKind.isFunctionOrOverloadedFunction(symbol.kind)) {
        substituted = new Skew.Type(Skew.TypeKind.SYMBOL, symbol);
        substituted.environment = environment;

        // Generate type substitutions
        if (parameters != null) {
          var found = true;

          for (var i1 = 0, list1 = parameters, count1 = list1.length; i1 < count1; ++i1) {
            var parameter = list1[i1];
            found = environment.parameters.indexOf(parameter) != -1;

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
        if (type.argumentTypes != null) {
          substituted.argumentTypes = [];

          for (var i3 = 0, list3 = type.argumentTypes, count3 = list3.length; i3 < count3; ++i3) {
            var argumentType1 = list3[i3];
            substituted.argumentTypes.push(this.substitute(argumentType1, environment));
          }
        }

        // Substitute return type
        if (type.returnType != null) {
          substituted.returnType = this.substitute(type.returnType, environment);
        }
      }
    }

    rootType.substitutionCache[environment.id] = substituted;
    return substituted;
  };

  Skew.TypeCache.prototype._canCastToNumeric = function(type) {
    return type == this.intType || type == this.doubleType || type == this.boolType;
  };

  Skew.TypeCache._loadGlobalClass = function(global, name, flags) {
    var symbol = in_StringMap.get(global.members, name, null);
    assert(symbol != null);
    assert(symbol.kind == Skew.SymbolKind.OBJECT_CLASS);
    var type = new Skew.Type(Skew.TypeKind.SYMBOL, symbol.asObjectSymbol());
    symbol.resolvedType = type;
    symbol.flags |= flags;
    return type;
  };

  Skew.TypeCache._loadInstanceFunction = function(type, name) {
    var symbol = in_StringMap.get(type.symbol.asObjectSymbol().members, name, null);
    assert(symbol != null);
    assert(symbol.kind == Skew.SymbolKind.FUNCTION_INSTANCE || symbol.kind == Skew.SymbolKind.OVERLOADED_INSTANCE);
    return symbol;
  };

  Skew.TypeCache._hashParameters = function(parameters) {
    var hash = 0;

    for (var i = 0, list = parameters, count = list.length; i < count; ++i) {
      var parameter = list[i];
      hash = Skew.hashCombine(hash, parameter.id);
    }

    return hash;
  };

  Skew.TypeCache._hashTypes = function(hash, types) {
    for (var i = 0, list = types, count = list.length; i < count; ++i) {
      var type = list[i];
      hash = Skew.hashCombine(hash, type.id);
    }

    return hash;
  };

  Skew.TypeCache._commonBaseType = function(left, right) {
    var a = left;

    while (a != null) {
      var b = right;

      while (b != null) {
        if (a == b) {
          return a;
        }

        b = b.baseType();
      }

      a = a.baseType();
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
    JS_SOURCE_MAP: 7,
    MESSAGE_LIMIT: 8,
    OUTPUT_DIRECTORY: 9,
    OUTPUT_FILE: 10,
    RELEASE: 11,
    TARGET: 12,
    VERBOSE: 13
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
    return this.name + (this.type == Skew.Options.Type.BOOL ? '' : this.type == Skew.Options.Type.STRING_LIST ? ':___' : '=___');
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
    this.optionalArguments = {};
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
    return node != null ? Skew.in_Content.asBool(node.content) : defaultValue;
  };

  Skew.Options.Parser.prototype.intForOption = function(option, defaultValue) {
    var node = this.nodeForOption(option);
    return node != null ? Skew.in_Content.asInt(node.content) : defaultValue;
  };

  Skew.Options.Parser.prototype.rangeForOption = function(option) {
    var node = this.nodeForOption(option);
    return node != null ? node.range : null;
  };

  Skew.Options.Parser.prototype.rangeListForOption = function(option) {
    var node = this.nodeForOption(option);
    var ranges = [];

    if (node != null) {
      for (var child = node.firstChild(); child != null; child = child.nextSibling()) {
        ranges.push(child.range);
      }
    }

    return ranges;
  };

  Skew.Options.Parser.prototype.parse = function(log, $arguments) {
    this.source = new Skew.Source('<arguments>', '');
    var ranges = [];

    // Create a source for the arguments to work with the log system. The
    // trailing space is needed to be able to point to the character after
    // the last argument without wrapping onto the next line.
    for (var i1 = 0, list = $arguments, count = list.length; i1 < count; ++i1) {
      var argument = list[i1];
      var needsQuotes = argument.indexOf(' ') != -1;
      var start = this.source.contents.length + (needsQuotes | 0) | 0;
      ranges.push(new Skew.Range(this.source, start, start + argument.length | 0));
      this.source.contents += needsQuotes ? "'" + argument + "' " : argument + ' ';
    }

    // Parse each argument
    for (var i = 0, count1 = $arguments.length; i < count1; ++i) {
      var argument1 = $arguments[i];
      var range = ranges[i];

      // Track all normal arguments separately
      if (argument1 == '' || argument1.charCodeAt(0) != 45 && !(argument1 in this.map)) {
        this.normalArguments.push(range);
        continue;
      }

      // Parse a flag
      var equals = argument1.indexOf('=');
      var colon = argument1.indexOf(':');
      var separator = equals >= 0 && (colon < 0 || equals < colon) ? equals : colon;
      var name = separator >= 0 ? argument1.slice(0, separator) : argument1;
      var data = in_StringMap.get(this.map, name, null);

      // Check that the flag exists
      if (data == null) {
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
            text = 'true';
          }

          else if (argument1.charCodeAt(separator) != 61) {
            log.commandLineErrorExpectedToken(separatorRange, '=', argument1[separator], argument1);
            continue;
          }

          else if (text != 'true' && text != 'false') {
            log.commandLineErrorNonBooleanValue(textRange, text, argument1);
            continue;
          }

          if (data.option in this.optionalArguments) {
            log.commandLineWarningDuplicateFlagValue(textRange, name, this.optionalArguments[data.option].range);
          }

          this.optionalArguments[data.option] = new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.BoolContent(text == 'true')).withRange(textRange);
          break;
        }

        case Skew.Options.Type.INT: {
          if (separator < 0) {
            log.commandLineErrorMissingValue(textRange, data.nameText());
          }

          else if (argument1.charCodeAt(separator) != 61) {
            log.commandLineErrorExpectedToken(separatorRange, '=', argument1[separator], argument1);
          }

          else {
            var box = Skew.Parsing.parseIntLiteral(text);

            if (box == null) {
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

          else if (argument1.charCodeAt(separator) != 61) {
            log.commandLineErrorExpectedToken(separatorRange, '=', argument1[separator], argument1);
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

          else if (argument1.charCodeAt(separator) != 58) {
            log.commandLineErrorExpectedToken(separatorRange, ':', argument1[separator], argument1);
          }

          else {
            var node = null;

            if (data.option in this.optionalArguments) {
              node = this.optionalArguments[data.option];
            }

            else {
              node = Skew.Node.createInitializer(Skew.NodeKind.INITIALIZER_LIST);
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
    var text = '';
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
    var columnText = in_string.repeat(' ', columnWidth);

    for (var i2 = 0, list2 = this.options, count2 = list2.length; i2 < count2; ++i2) {
      var option1 = list2[i2];
      var nameText = option1.nameText();
      var isFirst = true;
      text += '\n  ' + nameText + in_string.repeat(' ', (columnWidth - nameText.length | 0) - 2 | 0);

      for (var i1 = 0, list1 = Skew.PrettyPrint.wrapWords(option1.description, wrapWidth - columnWidth | 0), count1 = list1.length; i1 < count1; ++i1) {
        var line = list1[i1];
        text += (isFirst ? '' : columnText) + line + '\n';
        isFirst = false;
      }
    }

    return text + '\n';
  };

  Skew.in_PassKind = {};
  Skew.in_Content = {};

  Skew.in_Content.asBool = function(self) {
    assert(self.kind() == Skew.ContentKind.BOOL);
    return self.value;
  };

  Skew.in_Content.asInt = function(self) {
    assert(self.kind() == Skew.ContentKind.INT);
    return self.value;
  };

  Skew.in_Content.asDouble = function(self) {
    assert(self.kind() == Skew.ContentKind.DOUBLE);
    return self.value;
  };

  Skew.in_Content.asString = function(self) {
    assert(self.kind() == Skew.ContentKind.STRING);
    return self.value;
  };

  Skew.in_Content.equals = function(self, other) {
    if (self.kind() == other.kind()) {
      switch (self.kind()) {
        case Skew.ContentKind.BOOL: {
          return Skew.in_Content.asBool(self) == Skew.in_Content.asBool(other);
        }

        case Skew.ContentKind.INT: {
          return Skew.in_Content.asInt(self) == Skew.in_Content.asInt(other);
        }

        case Skew.ContentKind.DOUBLE: {
          return Skew.in_Content.asDouble(self) == Skew.in_Content.asDouble(other);
        }

        case Skew.ContentKind.STRING: {
          return Skew.in_Content.asString(self) == Skew.in_Content.asString(other);
        }
      }
    }

    return false;
  };

  Skew.in_NodeKind = {};

  Skew.in_NodeKind.isLoop = function(self) {
    return self == Skew.NodeKind.FOR || self == Skew.NodeKind.FOREACH || self == Skew.NodeKind.WHILE;
  };

  Skew.in_NodeKind.isExpression = function(self) {
    return self >= Skew.NodeKind.ASSIGN_INDEX && self <= Skew.NodeKind.ASSIGN_UNSIGNED_SHIFT_RIGHT;
  };

  Skew.in_NodeKind.isInitializer = function(self) {
    return self == Skew.NodeKind.INITIALIZER_LIST || self == Skew.NodeKind.INITIALIZER_MAP;
  };

  Skew.in_NodeKind.isUnary = function(self) {
    return self >= Skew.NodeKind.COMPLEMENT && self <= Skew.NodeKind.POSITIVE;
  };

  Skew.in_NodeKind.isUnaryAssign = function(self) {
    return self >= Skew.NodeKind.DECREMENT && self <= Skew.NodeKind.INCREMENT;
  };

  Skew.in_NodeKind.isBinary = function(self) {
    return self >= Skew.NodeKind.ADD && self <= Skew.NodeKind.ASSIGN_UNSIGNED_SHIFT_RIGHT;
  };

  Skew.in_NodeKind.isBinaryAssign = function(self) {
    return self >= Skew.NodeKind.ASSIGN && self <= Skew.NodeKind.ASSIGN_UNSIGNED_SHIFT_RIGHT;
  };

  // Note that add and multiply are NOT associative in finite-precision arithmetic
  Skew.in_NodeKind.isBinaryAssociative = function(self) {
    switch (self) {
      case Skew.NodeKind.BITWISE_AND:
      case Skew.NodeKind.BITWISE_OR:
      case Skew.NodeKind.BITWISE_XOR:
      case Skew.NodeKind.LOGICAL_AND:
      case Skew.NodeKind.LOGICAL_OR: {
        return true;
      }
    }

    return false;
  };

  Skew.in_NodeKind.isBinaryComparison = function(self) {
    return self >= Skew.NodeKind.GREATER_THAN && self <= Skew.NodeKind.LESS_THAN_OR_EQUAL;
  };

  Skew.in_NodeKind.isJump = function(self) {
    return self == Skew.NodeKind.BREAK || self == Skew.NodeKind.CONTINUE || self == Skew.NodeKind.RETURN;
  };

  Skew.in_NodeKind.isAssign = function(self) {
    return Skew.in_NodeKind.isUnaryAssign(self) || Skew.in_NodeKind.isBinaryAssign(self);
  };

  Skew.in_SymbolKind = {};

  Skew.in_SymbolKind.isType = function(self) {
    return self >= Skew.SymbolKind.PARAMETER_FUNCTION && self <= Skew.SymbolKind.OBJECT_WRAPPED;
  };

  Skew.in_SymbolKind.isParameter = function(self) {
    return self >= Skew.SymbolKind.PARAMETER_FUNCTION && self <= Skew.SymbolKind.PARAMETER_OBJECT;
  };

  Skew.in_SymbolKind.isObject = function(self) {
    return self >= Skew.SymbolKind.OBJECT_CLASS && self <= Skew.SymbolKind.OBJECT_WRAPPED;
  };

  Skew.in_SymbolKind.isFunction = function(self) {
    return self >= Skew.SymbolKind.FUNCTION_ANNOTATION && self <= Skew.SymbolKind.FUNCTION_LOCAL;
  };

  Skew.in_SymbolKind.isOverloadedFunction = function(self) {
    return self >= Skew.SymbolKind.OVERLOADED_ANNOTATION && self <= Skew.SymbolKind.OVERLOADED_INSTANCE;
  };

  Skew.in_SymbolKind.isFunctionOrOverloadedFunction = function(self) {
    return self >= Skew.SymbolKind.FUNCTION_ANNOTATION && self <= Skew.SymbolKind.OVERLOADED_INSTANCE;
  };

  Skew.in_SymbolKind.isVariable = function(self) {
    return self >= Skew.SymbolKind.VARIABLE_ARGUMENT && self <= Skew.SymbolKind.VARIABLE_LOCAL;
  };

  Skew.in_SymbolKind.isLocalOrArgumentVariable = function(self) {
    return self == Skew.SymbolKind.VARIABLE_ARGUMENT || self == Skew.SymbolKind.VARIABLE_LOCAL;
  };

  Skew.in_SymbolKind.isNamespaceOrGlobal = function(self) {
    return self == Skew.SymbolKind.OBJECT_NAMESPACE || self == Skew.SymbolKind.OBJECT_GLOBAL;
  };

  Skew.in_SymbolKind.isGlobalReference = function(self) {
    return self == Skew.SymbolKind.VARIABLE_ENUM || self == Skew.SymbolKind.VARIABLE_GLOBAL || self == Skew.SymbolKind.FUNCTION_GLOBAL || self == Skew.SymbolKind.FUNCTION_CONSTRUCTOR || self == Skew.SymbolKind.OVERLOADED_GLOBAL || Skew.in_SymbolKind.isType(self);
  };

  Skew.in_SymbolKind.hasInstances = function(self) {
    return self == Skew.SymbolKind.OBJECT_CLASS || self == Skew.SymbolKind.OBJECT_ENUM || self == Skew.SymbolKind.OBJECT_INTERFACE || self == Skew.SymbolKind.OBJECT_WRAPPED;
  };

  Skew.in_SymbolKind.isOnInstances = function(self) {
    return self == Skew.SymbolKind.FUNCTION_INSTANCE || self == Skew.SymbolKind.VARIABLE_INSTANCE || self == Skew.SymbolKind.OVERLOADED_INSTANCE;
  };

  Skew.in_SymbolKind.isLocal = function(self) {
    return self == Skew.SymbolKind.FUNCTION_LOCAL || self == Skew.SymbolKind.VARIABLE_LOCAL || self == Skew.SymbolKind.VARIABLE_ARGUMENT;
  };

  Skew.in_TokenKind = {};
  var IO = {};

  IO.readFile = function(path) {
    try {
      var contents = require('fs').readFileSync(path, 'utf8');
      return contents.split('\r\n').join('\n');
    }

    catch (e) {
    }

    return null;
  };

  IO.writeFile = function(path, contents) {
    try {
      require('fs').writeFileSync(path, contents);
      return true;
    }

    catch (e) {
    }

    return false;
  };

  var Terminal = {};

  Terminal.setColor = function(color) {
    if (process.stdout.isTTY) {
      process.stdout.write('\x1B[0;' + Terminal.colorToEscapeCode[color].toString() + 'm');
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

  var in_int = {};

  in_int.power = function(self, x) {
    var y = self;
    var z = x < 0 ? 0 : 1;

    while (x > 0) {
      if ((x & 1) != 0) {
        z *= y;
      }

      x >>= 1;
      y *= y;
    }

    return z;
  };

  var in_string = {};

  in_string.fromCodePoints = function(codePoints) {
    var builder = new StringBuilder();

    for (var i = 0, list = codePoints, count1 = list.length; i < count1; ++i) {
      var codePoint = list[i];
      builder.append(in_string.fromCodePoint(codePoint));
    }

    return builder.toString();
  };

  in_string.compare = function(self, x) {
    return (x < self | 0) - (x > self | 0) | 0;
  };

  in_string.startsWith = function(self, text) {
    return self.length >= text.length && self.slice(0, text.length) == text;
  };

  in_string.endsWith = function(self, text) {
    return self.length >= text.length && self.slice(self.length - text.length | 0) == text;
  };

  in_string.repeat = function(self, times) {
    var result = '';

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

  in_string.fromCodePoint = function(codePoint) {
    return codePoint < 65536 ? String.fromCharCode(codePoint) : String.fromCharCode((codePoint - 65536 >> 10) + 55296 | 0) + String.fromCharCode((codePoint - 65536 & (1 << 10) - 1) + 56320 | 0);
  };

  var in_List = {};

  in_List.setLast = function(self, x) {
    self[self.length - 1 | 0] = x;
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

  in_List.equals = function(self, other) {
    if (self.length != other.length) {
      return false;
    }

    for (var i = 0, count1 = self.length; i < count1; ++i) {
      if (self[i] != other[i]) {
        return false;
      }
    }

    return true;
  };

  var in_StringMap = {};

  in_StringMap.insert = function(self, key, value) {
    self[key] = value;
    return self;
  };

  in_StringMap.get = function(self, key, defaultValue) {
    var value = self[key];

    // Compare against undefined so the key is only hashed once for speed
    return value !== void 0 ? value : defaultValue;
  };

  in_StringMap.values = function(self) {
    var values = [];

    for (var key in self) {
      values.push(self[key]);
    }

    return values;
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

  in_IntMap.get = function(self, key, defaultValue) {
    var value = self[key];

    // Compare against undefined so the key is only hashed once for speed
    return value !== void 0 ? value : defaultValue;
  };

  in_IntMap.values = function(self) {
    var values = [];

    for (var key in self) {
      values.push(self[key]);
    }

    return values;
  };

  var RELEASE = false;
  Unicode.StringIterator.INSTANCE = new Unicode.StringIterator();
  Skew.HEX = '0123456789ABCDEF';
  Skew.BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  Skew.operatorInfo = in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert({}, Skew.NodeKind.COMPLEMENT, new Skew.OperatorInfo('~', Skew.Precedence.UNARY_PREFIX, Skew.Associativity.NONE, Skew.OperatorKind.OVERRIDABLE, [0])), Skew.NodeKind.DECREMENT, new Skew.OperatorInfo('--', Skew.Precedence.UNARY_PREFIX, Skew.Associativity.NONE, Skew.OperatorKind.OVERRIDABLE, [0])), Skew.NodeKind.INCREMENT, new Skew.OperatorInfo('++', Skew.Precedence.UNARY_PREFIX, Skew.Associativity.NONE, Skew.OperatorKind.OVERRIDABLE, [0])), Skew.NodeKind.NEGATIVE, new Skew.OperatorInfo('-', Skew.Precedence.UNARY_PREFIX, Skew.Associativity.NONE, Skew.OperatorKind.OVERRIDABLE, [0, 1])), Skew.NodeKind.NOT, new Skew.OperatorInfo('!', Skew.Precedence.UNARY_PREFIX, Skew.Associativity.NONE, Skew.OperatorKind.OVERRIDABLE, [0])), Skew.NodeKind.POSITIVE, new Skew.OperatorInfo('+', Skew.Precedence.UNARY_PREFIX, Skew.Associativity.NONE, Skew.OperatorKind.OVERRIDABLE, [0, 1])), Skew.NodeKind.ADD, new Skew.OperatorInfo('+', Skew.Precedence.ADD, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, [0, 1])), Skew.NodeKind.BITWISE_AND, new Skew.OperatorInfo('&', Skew.Precedence.BITWISE_AND, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, [1])), Skew.NodeKind.BITWISE_OR, new Skew.OperatorInfo('|', Skew.Precedence.BITWISE_OR, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, [1])), Skew.NodeKind.BITWISE_XOR, new Skew.OperatorInfo('^', Skew.Precedence.BITWISE_XOR, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, [1])), Skew.NodeKind.COMPARE, new Skew.OperatorInfo('<=>', Skew.Precedence.COMPARE, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, [1])), Skew.NodeKind.DIVIDE, new Skew.OperatorInfo('/', Skew.Precedence.MULTIPLY, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, [1])), Skew.NodeKind.EQUAL, new Skew.OperatorInfo('==', Skew.Precedence.EQUAL, Skew.Associativity.LEFT, Skew.OperatorKind.FIXED, [1])), Skew.NodeKind.GREATER_THAN, new Skew.OperatorInfo('>', Skew.Precedence.COMPARE, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, [1])), Skew.NodeKind.GREATER_THAN_OR_EQUAL, new Skew.OperatorInfo('>=', Skew.Precedence.COMPARE, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, [1])), Skew.NodeKind.IN, new Skew.OperatorInfo('in', Skew.Precedence.COMPARE, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, [1])), Skew.NodeKind.LESS_THAN, new Skew.OperatorInfo('<', Skew.Precedence.COMPARE, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, [1])), Skew.NodeKind.LESS_THAN_OR_EQUAL, new Skew.OperatorInfo('<=', Skew.Precedence.COMPARE, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, [1])), Skew.NodeKind.LOGICAL_AND, new Skew.OperatorInfo('&&', Skew.Precedence.LOGICAL_AND, Skew.Associativity.LEFT, Skew.OperatorKind.FIXED, [1])), Skew.NodeKind.LOGICAL_OR, new Skew.OperatorInfo('||', Skew.Precedence.LOGICAL_OR, Skew.Associativity.LEFT, Skew.OperatorKind.FIXED, [1])), Skew.NodeKind.MULTIPLY, new Skew.OperatorInfo('*', Skew.Precedence.MULTIPLY, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, [1])), Skew.NodeKind.NOT_EQUAL, new Skew.OperatorInfo('!=', Skew.Precedence.EQUAL, Skew.Associativity.LEFT, Skew.OperatorKind.FIXED, [1])), Skew.NodeKind.POWER, new Skew.OperatorInfo('**', Skew.Precedence.UNARY_PREFIX, Skew.Associativity.RIGHT, Skew.OperatorKind.OVERRIDABLE, [1])), Skew.NodeKind.REMAINDER, new Skew.OperatorInfo('%', Skew.Precedence.MULTIPLY, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, [1])), Skew.NodeKind.SHIFT_LEFT, new Skew.OperatorInfo('<<', Skew.Precedence.SHIFT, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, [1])), Skew.NodeKind.SHIFT_RIGHT, new Skew.OperatorInfo('>>', Skew.Precedence.SHIFT, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, [1])), Skew.NodeKind.UNSIGNED_SHIFT_RIGHT, new Skew.OperatorInfo('>>>', Skew.Precedence.SHIFT, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, [1])), Skew.NodeKind.SUBTRACT, new Skew.OperatorInfo('-', Skew.Precedence.ADD, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, [0, 1])), Skew.NodeKind.ASSIGN, new Skew.OperatorInfo('=', Skew.Precedence.ASSIGN, Skew.Associativity.RIGHT, Skew.OperatorKind.FIXED, [1])), Skew.NodeKind.ASSIGN_ADD, new Skew.OperatorInfo('+=', Skew.Precedence.ASSIGN, Skew.Associativity.RIGHT, Skew.OperatorKind.OVERRIDABLE, [1])), Skew.NodeKind.ASSIGN_BITWISE_AND, new Skew.OperatorInfo('&=', Skew.Precedence.ASSIGN, Skew.Associativity.RIGHT, Skew.OperatorKind.OVERRIDABLE, [1])), Skew.NodeKind.ASSIGN_BITWISE_OR, new Skew.OperatorInfo('|=', Skew.Precedence.ASSIGN, Skew.Associativity.RIGHT, Skew.OperatorKind.OVERRIDABLE, [1])), Skew.NodeKind.ASSIGN_BITWISE_XOR, new Skew.OperatorInfo('^=', Skew.Precedence.ASSIGN, Skew.Associativity.RIGHT, Skew.OperatorKind.OVERRIDABLE, [1])), Skew.NodeKind.ASSIGN_DIVIDE, new Skew.OperatorInfo('/=', Skew.Precedence.ASSIGN, Skew.Associativity.RIGHT, Skew.OperatorKind.OVERRIDABLE, [1])), Skew.NodeKind.ASSIGN_MULTIPLY, new Skew.OperatorInfo('*=', Skew.Precedence.ASSIGN, Skew.Associativity.RIGHT, Skew.OperatorKind.OVERRIDABLE, [1])), Skew.NodeKind.ASSIGN_POWER, new Skew.OperatorInfo('**=', Skew.Precedence.ASSIGN, Skew.Associativity.RIGHT, Skew.OperatorKind.OVERRIDABLE, [1])), Skew.NodeKind.ASSIGN_REMAINDER, new Skew.OperatorInfo('%=', Skew.Precedence.ASSIGN, Skew.Associativity.RIGHT, Skew.OperatorKind.OVERRIDABLE, [1])), Skew.NodeKind.ASSIGN_SHIFT_LEFT, new Skew.OperatorInfo('<<=', Skew.Precedence.ASSIGN, Skew.Associativity.RIGHT, Skew.OperatorKind.OVERRIDABLE, [1])), Skew.NodeKind.ASSIGN_SHIFT_RIGHT, new Skew.OperatorInfo('>>=', Skew.Precedence.ASSIGN, Skew.Associativity.RIGHT, Skew.OperatorKind.OVERRIDABLE, [1])), Skew.NodeKind.ASSIGN_SUBTRACT, new Skew.OperatorInfo('-=', Skew.Precedence.ASSIGN, Skew.Associativity.RIGHT, Skew.OperatorKind.OVERRIDABLE, [1])), Skew.NodeKind.ASSIGN_UNSIGNED_SHIFT_RIGHT, new Skew.OperatorInfo('>>>=', Skew.Precedence.ASSIGN, Skew.Associativity.RIGHT, Skew.OperatorKind.OVERRIDABLE, [1])), Skew.NodeKind.ASSIGN_INDEX, new Skew.OperatorInfo('[]=', Skew.Precedence.MEMBER, Skew.Associativity.NONE, Skew.OperatorKind.OVERRIDABLE, [2])), Skew.NodeKind.INDEX, new Skew.OperatorInfo('[]', Skew.Precedence.MEMBER, Skew.Associativity.NONE, Skew.OperatorKind.OVERRIDABLE, [1]));
  Skew.validArgumentCounts = null;
  Skew.yy_accept = [Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.END_OF_FILE, Skew.TokenKind.ERROR, Skew.TokenKind.WHITESPACE, Skew.TokenKind.NEWLINE, Skew.TokenKind.NOT, Skew.TokenKind.ERROR, Skew.TokenKind.COMMENT, Skew.TokenKind.REMAINDER, Skew.TokenKind.BITWISE_AND, Skew.TokenKind.ERROR, Skew.TokenKind.LEFT_PARENTHESIS, Skew.TokenKind.RIGHT_PARENTHESIS, Skew.TokenKind.MULTIPLY, Skew.TokenKind.PLUS, Skew.TokenKind.COMMA, Skew.TokenKind.MINUS, Skew.TokenKind.DOT, Skew.TokenKind.DIVIDE, Skew.TokenKind.INT, Skew.TokenKind.INT, Skew.TokenKind.COLON, Skew.TokenKind.SEMICOLON, Skew.TokenKind.LESS_THAN, Skew.TokenKind.ASSIGN, Skew.TokenKind.GREATER_THAN, Skew.TokenKind.QUESTION_MARK, Skew.TokenKind.ERROR, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.LEFT_BRACKET, Skew.TokenKind.RIGHT_BRACKET, Skew.TokenKind.BITWISE_XOR, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.LEFT_BRACE, Skew.TokenKind.BITWISE_OR, Skew.TokenKind.RIGHT_BRACE, Skew.TokenKind.TILDE, Skew.TokenKind.WHITESPACE, Skew.TokenKind.NEWLINE, Skew.TokenKind.NOT_EQUAL, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.STRING, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.COMMENT, Skew.TokenKind.COMMENT, Skew.TokenKind.ASSIGN_REMAINDER, Skew.TokenKind.LOGICAL_AND, Skew.TokenKind.ASSIGN_BITWISE_AND, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.CHARACTER, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.POWER, Skew.TokenKind.ASSIGN_MULTIPLY, Skew.TokenKind.INCREMENT, Skew.TokenKind.ASSIGN_PLUS, Skew.TokenKind.DECREMENT, Skew.TokenKind.ASSIGN_MINUS, Skew.TokenKind.DOT_DOT, Skew.TokenKind.ASSIGN_DIVIDE, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.INT, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.DOUBLE_COLON, Skew.TokenKind.SHIFT_LEFT, Skew.TokenKind.LESS_THAN_OR_EQUAL, Skew.TokenKind.EQUAL, Skew.TokenKind.ARROW, Skew.TokenKind.GREATER_THAN_OR_EQUAL, Skew.TokenKind.SHIFT_RIGHT, Skew.TokenKind.ANNOTATION, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.INDEX, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.ASSIGN_BITWISE_XOR, Skew.TokenKind.AS, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IF, Skew.TokenKind.IN, Skew.TokenKind.IS, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.ASSIGN_BITWISE_OR, Skew.TokenKind.LOGICAL_OR, Skew.TokenKind.ASSIGN_POWER, Skew.TokenKind.DOUBLE, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.DOUBLE, Skew.TokenKind.INT_BINARY, Skew.TokenKind.INT_OCTAL, Skew.TokenKind.INT_HEX, Skew.TokenKind.ASSIGN_SHIFT_LEFT, Skew.TokenKind.COMPARE, Skew.TokenKind.ASSIGN_SHIFT_RIGHT, Skew.TokenKind.UNSIGNED_SHIFT_RIGHT, Skew.TokenKind.ANNOTATION, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.ASSIGN_INDEX, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.DEF, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.FOR, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.TRY, Skew.TokenKind.VAR, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.ASSIGN_UNSIGNED_SHIFT_RIGHT, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.CASE, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.ELSE, Skew.TokenKind.ENUM, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.NULL, Skew.TokenKind.OVER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.TRUE, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.DOUBLE, Skew.TokenKind.LIST, Skew.TokenKind.LIST_NEW, Skew.TokenKind.BREAK, Skew.TokenKind.CATCH, Skew.TokenKind.CLASS, Skew.TokenKind.CONST, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.FALSE, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.SUPER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.THROW, Skew.TokenKind.WHILE, Skew.TokenKind.SET, Skew.TokenKind.SET_NEW, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.RETURN, Skew.TokenKind.SWITCH, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.DEFAULT, Skew.TokenKind.DYNAMIC, Skew.TokenKind.FINALLY, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.CONTINUE, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.INTERFACE, Skew.TokenKind.NAMESPACE, Skew.TokenKind.YY_INVALID_ACTION];
  Skew.yy_ec = [0, 1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 4, 5, 6, 1, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 20, 20, 20, 20, 20, 21, 21, 22, 23, 24, 25, 26, 27, 28, 29, 29, 29, 29, 30, 29, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 32, 33, 34, 35, 31, 1, 36, 37, 38, 39, 40, 41, 31, 42, 43, 31, 44, 45, 46, 47, 48, 49, 31, 50, 51, 52, 53, 54, 55, 56, 57, 31, 58, 59, 60, 61, 1];
  Skew.yy_meta = [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 3, 3, 4, 1, 1, 1, 1, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 1, 1, 1, 1];
  Skew.yy_base = [0, 0, 0, 326, 327, 323, 60, 299, 59, 320, 297, 57, 57, 327, 327, 55, 56, 327, 53, 305, 295, 77, 54, 297, 327, 52, 60, 62, 327, 0, 0, 55, 327, 293, 266, 266, 55, 59, 59, 65, 64, 73, 261, 274, 57, 77, 277, 270, 102, 95, 327, 327, 309, 119, 327, 118, 327, 307, 306, 327, 327, 327, 327, 115, 327, 305, 282, 327, 327, 327, 327, 327, 327, 327, 110, 116, 140, 120, 122, 0, 327, 281, 279, 327, 327, 327, 118, 0, 0, 288, 278, 262, 327, 0, 261, 111, 264, 252, 257, 250, 245, 242, 249, 246, 242, 0, 239, 0, 244, 244, 248, 235, 237, 242, 234, 26, 233, 239, 265, 240, 327, 327, 327, 146, 150, 154, 159, 161, 0, 327, 327, 327, 254, 0, 262, 327, 222, 240, 235, 236, 222, 131, 236, 235, 230, 223, 217, 231, 0, 226, 225, 219, 213, 209, 221, 208, 211, 218, 0, 0, 212, 240, 200, 172, 327, 220, 219, 208, 0, 209, 199, 197, 205, 194, 200, 0, 0, 205, 199, 193, 191, 0, 0, 191, 190, 201, 183, 0, 197, 176, 175, 176, 180, 327, 327, 0, 0, 0, 0, 187, 188, 189, 0, 186, 189, 180, 181, 0, 185, 0, 0, 327, 327, 173, 173, 186, 132, 152, 148, 0, 0, 117, 0, 0, 0, 114, 112, 0, 107, 105, 0, 0, 327, 201, 205, 209, 211, 214, 217, 219];
  Skew.yy_def = [0, 232, 1, 232, 232, 232, 232, 232, 233, 234, 232, 232, 235, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 236, 237, 232, 232, 232, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 232, 232, 232, 232, 232, 232, 232, 233, 232, 233, 234, 232, 232, 232, 232, 235, 232, 235, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 238, 232, 232, 232, 232, 232, 232, 232, 239, 237, 232, 232, 232, 232, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 238, 232, 232, 232, 232, 239, 232, 232, 232, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 232, 232, 232, 232, 232, 232, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 232, 232, 232, 232, 232, 232, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 232, 232, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 237, 0, 232, 232, 232, 232, 232, 232, 232];
  Skew.yy_nxt = [0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 22, 22, 23, 24, 25, 26, 27, 28, 29, 30, 30, 30, 31, 4, 32, 33, 34, 35, 36, 37, 38, 39, 30, 40, 30, 30, 30, 41, 42, 30, 43, 44, 45, 30, 46, 47, 30, 30, 48, 49, 50, 51, 53, 53, 56, 61, 64, 66, 70, 68, 74, 89, 75, 75, 75, 75, 81, 82, 71, 157, 67, 69, 62, 158, 76, 83, 84, 85, 86, 90, 65, 95, 57, 74, 76, 75, 75, 75, 75, 98, 96, 102, 91, 97, 100, 105, 101, 76, 103, 108, 112, 106, 113, 104, 77, 107, 99, 76, 118, 114, 120, 53, 53, 56, 64, 78, 109, 115, 123, 123, 123, 123, 74, 79, 75, 75, 75, 75, 126, 126, 127, 127, 127, 131, 132, 231, 76, 230, 65, 119, 229, 57, 228, 124, 121, 124, 76, 227, 125, 125, 125, 125, 138, 139, 123, 123, 123, 123, 125, 125, 125, 125, 125, 125, 125, 125, 163, 126, 126, 127, 127, 127, 171, 172, 226, 191, 163, 191, 225, 224, 192, 192, 192, 192, 192, 192, 192, 192, 192, 192, 192, 192, 55, 55, 55, 55, 58, 58, 58, 58, 63, 63, 63, 63, 87, 87, 88, 88, 88, 128, 128, 133, 133, 133, 223, 222, 221, 220, 219, 218, 217, 216, 215, 214, 213, 212, 211, 210, 209, 208, 207, 206, 205, 204, 203, 202, 201, 200, 199, 198, 197, 196, 195, 194, 193, 190, 189, 188, 187, 186, 185, 184, 183, 182, 181, 180, 179, 178, 177, 176, 175, 174, 173, 170, 169, 168, 167, 166, 165, 164, 162, 161, 160, 159, 156, 155, 154, 153, 152, 151, 150, 149, 148, 147, 146, 145, 144, 143, 142, 141, 140, 137, 136, 135, 134, 130, 129, 122, 232, 59, 232, 52, 117, 116, 111, 110, 94, 93, 92, 80, 73, 72, 60, 59, 54, 52, 232, 3, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232];
  Skew.yy_chk = [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 6, 6, 8, 11, 12, 15, 18, 16, 22, 31, 22, 22, 22, 22, 25, 25, 18, 115, 15, 16, 11, 115, 22, 26, 26, 27, 27, 31, 12, 36, 8, 21, 22, 21, 21, 21, 21, 37, 36, 39, 31, 36, 38, 40, 38, 21, 39, 41, 44, 40, 44, 39, 21, 40, 37, 21, 48, 45, 49, 53, 53, 55, 63, 21, 41, 45, 74, 74, 74, 74, 75, 21, 75, 75, 75, 75, 77, 77, 78, 78, 78, 86, 86, 229, 75, 228, 63, 48, 226, 55, 225, 76, 49, 76, 75, 221, 76, 76, 76, 76, 95, 95, 123, 123, 123, 123, 124, 124, 124, 124, 125, 125, 125, 125, 123, 126, 126, 127, 127, 127, 141, 141, 218, 163, 123, 163, 217, 216, 163, 163, 163, 163, 191, 191, 191, 191, 192, 192, 192, 192, 233, 233, 233, 233, 234, 234, 234, 234, 235, 235, 235, 235, 236, 236, 237, 237, 237, 238, 238, 239, 239, 239, 215, 214, 213, 208, 206, 205, 204, 203, 201, 200, 199, 190, 189, 188, 186, 185, 184, 183, 180, 179, 178, 177, 174, 173, 172, 171, 170, 169, 167, 166, 165, 162, 161, 160, 157, 156, 155, 154, 153, 152, 151, 150, 149, 147, 146, 145, 144, 143, 142, 140, 139, 138, 137, 136, 134, 132, 119, 118, 117, 116, 114, 113, 112, 111, 110, 109, 108, 106, 104, 103, 102, 101, 100, 99, 98, 97, 96, 94, 91, 90, 89, 82, 81, 66, 65, 58, 57, 52, 47, 46, 43, 42, 35, 34, 33, 23, 20, 19, 10, 9, 7, 5, 3, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232, 232];
  Skew.REMOVE_NEWLINE_BEFORE = in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert({}, Skew.TokenKind.COLON, 0), Skew.TokenKind.COMMA, 0), Skew.TokenKind.DOT, 0), Skew.TokenKind.NEWLINE, 0), Skew.TokenKind.QUESTION_MARK, 0), Skew.TokenKind.RIGHT_BRACKET, 0), Skew.TokenKind.RIGHT_PARENTHESIS, 0);
  Skew.NATIVE_LIBRARY = '\nconst RELEASE = false\n\nenum Target {\n  NONE\n  CPLUSPLUS\n  CSHARP\n  JAVASCRIPT\n}\n\nconst TARGET Target = .NONE\n\ndef @deprecated\ndef @deprecated(message string)\ndef @entry\ndef @export\ndef @import\ndef @noinline\ndef @prefer\ndef @rename(name string)\ndef @skip\ndef @spreads\n\n@spreads {\n  def @using(name string) # For use with C#\n  def @include(name string) # For use with C++\n}\n\n@skip if RELEASE\ndef assert(truth bool)\n\n@import\nnamespace Math {\n  @rename("Abs") if TARGET == .CSHARP\n  def abs(x double) double\n  @rename("Abs") if TARGET == .CSHARP\n  def abs(x int) int\n  @rename("Acos") if TARGET == .CSHARP\n  def acos(x double) double\n  @rename("Asin") if TARGET == .CSHARP\n  def asin(x double) double\n  @rename("Atan") if TARGET == .CSHARP\n  def atan(x double) double\n  @rename("Atan2") if TARGET == .CSHARP\n  def atan2(x double, y double) double\n  @rename("Ceil") if TARGET == .CSHARP\n  def ceil(x double) double\n  @rename("Cos") if TARGET == .CSHARP\n  def cos(x double) double\n  @rename("Exp") if TARGET == .CSHARP\n  def exp(x double) double\n  @rename("Floor") if TARGET == .CSHARP\n  def floor(x double) double\n  @rename("Log") if TARGET == .CSHARP\n  def log(x double) double\n  @rename("Pow") if TARGET == .CSHARP\n  def pow(x double, y double) double\n  @rename("Random") if TARGET == .CSHARP\n  def random double\n  @rename("Round") if TARGET == .CSHARP\n  def round(x double) double\n  @rename("Sin") if TARGET == .CSHARP\n  def sin(x double) double\n  @rename("Sqrt") if TARGET == .CSHARP\n  def sqrt(x double) double\n  @rename("Tan") if TARGET == .CSHARP\n  def tan(x double) double\n\n  @prefer\n  @rename("Max") if TARGET == .CSHARP\n  def max(x double, y double) double\n  @rename("Max") if TARGET == .CSHARP\n  def max(x int, y int) int\n\n  @prefer\n  @rename("Min") if TARGET == .CSHARP\n  def min(x double, y double) double\n  @rename("Min") if TARGET == .CSHARP\n  def min(x int, y int) int\n\n  const E = 2.718281828459045\n  const INFINITY = 1 / 0.0\n  const NAN = 0 / 0.0\n  const PI = 3.141592653589793\n  const SQRT_2 = 2 ** 0.5\n}\n\n@import\nclass bool {\n  def ! bool\n  def toString string\n}\n\n@import\nclass int {\n  def + int\n  def ++\n  def - int\n  def --\n  def ~ int\n\n  def %(x int) int\n  def &(x int) int\n  def *(x int) int\n  def +(x int) int\n  def -(x int) int\n  def /(x int) int\n  def <<(x int) int\n  def <=>(x int) int\n  def >>(x int) int\n  def >>>(x int) int\n  def ^(x int) int\n  def |(x int) int\n\n  def %=(x int)\n  def &=(x int)\n  def *=(x int)\n  def +=(x int)\n  def -=(x int)\n  def /=(x int)\n  def <<=(x int)\n  def >>=(x int)\n  def >>>=(x int)\n  def ^=(x int)\n  def |=(x int)\n\n  @rename("ToString") if TARGET == .CSHARP\n  def toString string\n\n  def **(x int) int {\n    var y = self\n    var z = x < 0 ? 0 : 1\n    while x > 0 {\n      if (x & 1) != 0 { z *= y }\n      x >>= 1\n      y *= y\n    }\n    return z\n  }\n}\n\n@import\nclass double {\n  def + double\n  def ++\n  def - double\n  def --\n\n  def *(x double) double\n  def +(x double) double\n  def -(x double) double\n  def /(x double) double\n\n  def *=(x double)\n  def +=(x double)\n  def -=(x double)\n  def /=(x double)\n\n  def isFinite bool\n  def isNaN bool\n\n  @rename("ToString") if TARGET == .CSHARP\n  def toString string\n\n  def **(x double) double {\n    return Math.pow(self, x)\n  }\n\n  def <=>(x double) int {\n    return ((x as dynamic < self) as int) - ((x as dynamic > self) as int)\n  }\n}\n\n@import\nclass string {\n  def +(x string) string\n  def +=(x string)\n  @rename("CompareTo") if TARGET == .CSHARP\n  @rename("compare") if TARGET == .CPLUSPLUS\n  def <=>(x string) int\n  def [](x int) int\n  def codePoints List<int>\n  def codeUnits List<int>\n  def count int\n  @rename("EndsWith") if TARGET == .CSHARP\n  def endsWith(x string) bool\n  def get(x int) string\n  @rename("Contains") if TARGET == .CSHARP\n  @rename("contains") if TARGET == .CPLUSPLUS\n  def in(x string) bool\n  @rename("IndexOf") if TARGET == .CSHARP\n  def indexOf(x string) int\n  def join(x List<string>) string\n  @rename("LastIndexOf") if TARGET == .CSHARP\n  def lastIndexOf(x string) int\n  def repeat(x int) string\n  @rename("Replace") if TARGET == .CSHARP\n  def replaceAll(before string, after string) string\n  @rename("Substring") if TARGET == .CSHARP\n  def slice(start int) string\n  def slice(start int, end int) string\n  def split(x string) List<string>\n  @rename("StartsWith") if TARGET == .CSHARP\n  def startsWith(x string) bool\n  @rename("ToLower") if TARGET == .CSHARP\n  def toLowerCase string\n  @rename("ToUpper") if TARGET == .CSHARP\n  def toUpperCase string\n}\n\nnamespace string {\n  def fromCodePoint(x int) string\n  def fromCodePoints(x List<int>) string\n  def fromCodeUnit(x int) string\n  def fromCodeUnits(x List<int>) string\n}\n\n@import if TARGET != .JAVASCRIPT\nclass StringBuilder {\n  @rename("Append") if TARGET == .CSHARP\n  def append(x string)\n  def new\n  @rename("ToString") if TARGET == .CSHARP\n  def toString string\n}\n\n@import\nclass List<T> {\n  def [...](x T) List<T>\n  @rename("get") if TARGET == .CPLUSPLUS\n  def [](x int) T\n  @rename("set") if TARGET == .CPLUSPLUS\n  def []=(x int, y T)\n  @rename("TrueForAll") if TARGET == .CSHARP\n  @rename("every") if TARGET == .JAVASCRIPT\n  def all(x fn(T) bool) bool\n  @rename("some") if TARGET == .JAVASCRIPT\n  def any(x fn(T) bool) bool\n  def appendOne(x T)\n  @rename("slice") if TARGET == .JAVASCRIPT\n  def clone List<T>\n  def count int\n  @rename("ForEach") if TARGET == .CSHARP\n  @rename("forEach") if TARGET == .JAVASCRIPT\n  def each(x fn(T))\n  @using("System.Linq") if TARGET == .CSHARP {\n    @rename("SequenceEqual") if TARGET == .CSHARP\n    def equals(x List<T>) bool\n    @rename("First") if TARGET == .CSHARP\n    def first T\n    @rename("Last") if TARGET == .CSHARP\n    def last T\n  }\n  @rename("FindAll") if TARGET == .CSHARP\n  def filter(x fn(T) bool) List<T>\n  @rename("Contains") if TARGET == .CSHARP\n  @rename("contains") if TARGET == .CPLUSPLUS\n  def in(x T) bool\n  @rename("IndexOf") if TARGET == .CSHARP\n  def indexOf(x T) int\n  @rename("Insert") if TARGET == .CSHARP\n  def insert(x int, value T)\n  def insert(x int, values List<T>)\n  def isEmpty bool\n  @rename("LastIndexOf") if TARGET == .CSHARP\n  def lastIndexOf(x T) int\n  @rename("ConvertAll") if TARGET == .CSHARP\n  def map<R>(x fn(T) R) List<R>\n  def new\n  def removeAll(x T)\n  @rename("RemoveAt") if TARGET == .CSHARP\n  def removeAt(x int)\n  def removeDuplicates\n  @rename("shift") if TARGET == .JAVASCRIPT\n  def removeFirst\n  @rename("RemoveAll") if TARGET == .CSHARP\n  def removeIf(x fn(T) bool)\n  @rename("pop") if TARGET == .JAVASCRIPT\n  def removeLast\n  @rename("Remove") if TARGET == .CSHARP\n  def removeOne(x T)\n  def removeRange(start int, end int)\n  def resize(size int, defaultValue T)\n  @rename("Reverse") if TARGET == .CSHARP\n  def reverse\n  def shuffle\n  def slice(start int) List<T>\n  def slice(start int, end int) List<T>\n  @rename("Sort") if TARGET == .CSHARP\n  def sort(x fn(T, T) int)\n  def swap(x int, y int)\n  @rename("shift") if TARGET == .JAVASCRIPT\n  def takeFirst T\n  @rename("pop") if TARGET == .JAVASCRIPT\n  def takeLast T\n  def takeRange(start int, end int) List<T>\n\n  @prefer\n  @rename("Add") if TARGET == .CSHARP\n  @rename("push") if TARGET == .JAVASCRIPT\n  def append(x T)\n  @rename("AddRange") if TARGET == .CSHARP\n  def append(x List<T>)\n\n  @prefer\n  @rename("unshift") if TARGET == .JAVASCRIPT\n  def prepend(x T)\n  def prepend(x List<T>)\n\n  def first=(x T) { self[0] = x }\n  def last=(x T) { self[count - 1] = x }\n}\n\n@import\nclass StringMap<T> {\n  @rename("get") if TARGET == .CPLUSPLUS\n  def [](key string) T\n  @rename("set") if TARGET == .CPLUSPLUS\n  def []=(key string, value T)\n  def clone StringMap<T>\n  @rename("Count") if TARGET == .CSHARP\n  def count int\n  def each(x fn(string, T))\n  def get(key string, defaultValue T) T\n  @rename("ContainsKey") if TARGET == .CSHARP\n  @rename("contains") if TARGET == .CPLUSPLUS\n  def in(key string) bool\n  def isEmpty bool\n  def keys List<string>\n  def new\n  @rename("Remove") if TARGET == .CSHARP\n  def remove(key string)\n  def values List<T>\n  def {...}(key string, value T) StringMap<T>\n}\n\n@import\nclass IntMap<T> {\n  @rename("get") if TARGET == .CPLUSPLUS\n  def [](key int) T\n  @rename("set") if TARGET == .CPLUSPLUS\n  def []=(key int, value T)\n  def clone IntMap<T>\n  @rename("Count") if TARGET == .CSHARP\n  def count int\n  def each(x fn(int, T))\n  def get(key int, defaultValue T) T\n  @rename("ContainsKey") if TARGET == .CSHARP\n  @rename("contains") if TARGET == .CPLUSPLUS\n  def in(key int) bool\n  def isEmpty bool\n  def keys List<int>\n  def new\n  @rename("Remove") if TARGET == .CSHARP\n  def remove(key int)\n  def values List<T>\n  def {...}(key int, value T) IntMap<T>\n}\n\nclass Box<T> {\n  var value T\n}\n';
  Skew.NATIVE_LIBRARY_CPP = '\nclass bool {\n  def toString string {\n    return self ? "true" : "false"\n  }\n}\n\nclass int {\n  def toString string {\n    return dynamic.intToString(self)\n  }\n}\n\nclass double {\n  def toString string {\n    return dynamic.doubleToString(self)\n  }\n\n  def isNaN bool {\n    return self != self\n  }\n}\n';
  Skew.NATIVE_LIBRARY_CS = '\n@using("System.Diagnostics")\ndef assert(truth bool) {\n  dynamic.Debug.Assert(truth)\n}\n\n@using("System")\nnamespace Math {\n}\n\nclass double {\n  def isFinite bool {\n    return !isNaN && !dynamic.double.IsInfinity(self)\n  }\n\n  def isNaN bool {\n    return dynamic.double.IsNaN(self)\n  }\n}\n\n@using("System.Text")\nclass StringBuilder {\n}\n\nclass bool {\n  def toString string {\n    return self ? "true" : "false"\n  }\n}\n\nclass string {\n  def count int {\n    return (self as dynamic).Length\n  }\n\n  def get(index int) string {\n    return fromCodeUnit(self[index])\n  }\n\n  def repeat(times int) string {\n    var result = ""\n    for i in 0..times {\n      result += self\n    }\n    return result\n  }\n\n  @using("System.Linq")\n  @using("System")\n  def split(separator string) List<string> {\n    var separators = [separator]\n    return dynamic.Enumerable.ToList((self as dynamic).Split(dynamic.Enumerable.ToArray(separators as dynamic), dynamic.StringSplitOptions.RemoveEmptyEntries))\n  }\n\n  def join(parts List<string>) string {\n    return dynamic.string.Join(self, parts)\n  }\n\n  def slice(start int, end int) string {\n    return (self as dynamic).Substring(start, end - start)\n  }\n\n  def codeUnits List<int> {\n    var result List<int> = []\n    for i in 0..count {\n      result.append(self[i])\n    }\n    return result\n  }\n}\n\nnamespace string {\n  def fromCodeUnit(codeUnit int) string {\n    return dynamic.string.new(codeUnit as dynamic.char, 1)\n  }\n\n  def fromCodeUnits(codeUnits List<int>) string {\n    var builder = StringBuilder.new\n    for codeUnit in codeUnits {\n      builder.append(codeUnit as dynamic.char)\n    }\n    return builder.toString\n  }\n}\n\n@using("System.Collections.Generic")\nclass List {\n  def any(callback fn(T) bool) bool {\n    return !all(x => !callback(x))\n  }\n\n  def isEmpty bool {\n    return count == 0\n  }\n\n  def count int {\n    return (self as dynamic).Count\n  }\n\n  def prepend(value T) {\n    insert(0, value)\n  }\n\n  def prepend(values List<T>) {\n    var count = values.count\n    for i in 0..count {\n      prepend(values[count - i - 1])\n    }\n  }\n\n  def removeFirst {\n    removeAt(0)\n  }\n\n  def removeLast {\n    removeAt(count - 1)\n  }\n\n  def takeFirst T {\n    var value = first\n    removeFirst\n    return value\n  }\n\n  def takeLast T {\n    var value = last\n    removeLast\n    return value\n  }\n\n  def slice(start int) List<T> {\n    return slice(start, count)\n  }\n\n  def slice(start int, end int) List<T> {\n    return (self as dynamic).GetRange(start, end - start)\n  }\n\n  def swap(i int, j int) {\n    var temp = self[i]\n    self[i] = self[j]\n    self[j] = temp\n  }\n\n  def clone List<T> {\n    var clone = new\n    clone.append(self)\n    return clone\n  }\n}\n\n@using("System.Collections.Generic")\n@rename("Dictionary")\nclass StringMap {\n  def {...}(key string, value T) StringMap<T> {\n    (self as dynamic).Add(key, value)\n    return self\n  }\n\n  def get(key string, value T) T {\n    return key in self ? self[key] : value\n  }\n\n  def keys List<string> {\n    return dynamic.System.Linq.Enumerable.ToList((self as dynamic).Keys)\n  }\n\n  def values List<T> {\n    return dynamic.System.Linq.Enumerable.ToList((self as dynamic).Values)\n  }\n\n  def clone StringMap<T> {\n    var clone = new\n    for key in keys {\n      clone[key] = self[key]\n    }\n    return clone\n  }\n}\n\n@using("System.Collections.Generic")\n@rename("Dictionary")\nclass IntMap {\n  def {...}(key int, value T) IntMap<T> {\n    (self as dynamic).Add(key, value)\n    return self\n  }\n\n  def get(key int, value T) T {\n    return key in self ? self[key] : value\n  }\n\n  def keys List<int> {\n    return dynamic.System.Linq.Enumerable.ToList((self as dynamic).Keys)\n  }\n\n  def values List<T> {\n    return dynamic.System.Linq.Enumerable.ToList((self as dynamic).Values)\n  }\n\n  def clone IntMap<T> {\n    var clone = new\n    for key in keys {\n      clone[key] = self[key]\n    }\n    return clone\n  }\n}\n';
  Skew.NATIVE_LIBRARY_JS = '\nconst __extends = (derived dynamic, base dynamic) => {\n  derived.prototype = dynamic.Object.create(base.prototype)\n  derived.prototype.constructor = derived\n}\n\nconst __imul fn(int, int) int = dynamic.Math.imul ? dynamic.Math.imul : (a, b) => {\n  const ah dynamic = (a >> 16) & 65535\n  const bh dynamic = (b >> 16) & 65535\n  const al dynamic = a & 65535\n  const bl dynamic = b & 65535\n  return al * bl + ((ah * bl + al * bh) << 16) | 0\n}\n\nconst __isInt = (value dynamic) => value == (value | 0)\nconst __isBool = (value dynamic) => value == !!value\nconst __isDouble = (value dynamic) => value == +value || dynamic.isNaN(value)\nconst __isString = (value dynamic) => dynamic.typeof(value) == "string"\n\ndef assert(truth bool) {\n  if !truth {\n    throw dynamic.Error("Assertion failed")\n  }\n}\n\nclass double {\n  def isFinite bool {\n    return dynamic.isFinite(self)\n  }\n\n  def isNaN bool {\n    return dynamic.isNaN(self)\n  }\n}\n\nclass string {\n  def <=>(x string) int {\n    return ((x as dynamic < self) as int) - ((x as dynamic > self) as int)\n  }\n\n  def startsWith(text string) bool {\n    return count >= text.count && slice(0, text.count) == text\n  }\n\n  def endsWith(text string) bool {\n    return count >= text.count && slice(count - text.count) == text\n  }\n\n  def replaceAll(before string, after string) string {\n    return after.join(self.split(before))\n  }\n\n  def in(value string) bool {\n    return indexOf(value) != -1\n  }\n\n  def count int {\n    return (self as dynamic).length\n  }\n\n  def [](index int) int {\n    return (self as dynamic).charCodeAt(index)\n  }\n\n  def get(index int) string {\n    return (self as dynamic)[index]\n  }\n\n  def repeat(times int) string {\n    var result = ""\n    for i in 0..times {\n      result += self\n    }\n    return result\n  }\n\n  def join(parts List<string>) string {\n    return (parts as dynamic).join(self)\n  }\n\n  def codeUnits List<int> {\n    var result List<int> = []\n    for i in 0..count {\n      result.append(self[i])\n    }\n    return result\n  }\n}\n\nnamespace string {\n  def fromCodeUnit(codeUnit int) string {\n    return dynamic.String.fromCharCode(codeUnit)\n  }\n\n  def fromCodeUnits(codeUnits List<int>) string {\n    var result = ""\n    for codeUnit in codeUnits {\n      result += string.fromCodeUnit(codeUnit)\n    }\n    return result\n  }\n}\n\nclass StringBuilder {\n  var buffer = ""\n\n  def new {\n  }\n\n  def append(x string) {\n    buffer += x\n  }\n\n  def toString string {\n    return buffer\n  }\n}\n\n@rename("Array")\nclass List {\n  def in(value T) bool {\n    return indexOf(value) != -1\n  }\n\n  def isEmpty bool {\n    return count == 0\n  }\n\n  def count int {\n    return (self as dynamic).length\n  }\n\n  def first T {\n    return self[0]\n  }\n\n  def last T {\n    return self[count - 1]\n  }\n\n  def prepend(values List<T>) {\n    var count = values.count\n    for i in 0..count {\n      prepend(values[count - i - 1])\n    }\n  }\n\n  def append(values List<T>) {\n    for value in values {\n      append(value)\n    }\n  }\n\n  def swap(i int, j int) {\n    var temp = self[i]\n    self[i] = self[j]\n    self[j] = temp\n  }\n\n  def insert(index int, value T) {\n    (self as dynamic).splice(index, 0, value)\n  }\n\n  def removeAt(index int) {\n    (self as dynamic).splice(index, 1)\n  }\n\n  def appendOne(value T) {\n    if !(value in self) {\n      append(value)\n    }\n  }\n\n  def removeOne(value T) {\n    var index = indexOf(value)\n    if index >= 0 {\n      removeAt(index)\n    }\n  }\n\n  def removeIf(callback fn(T) bool) {\n    var index = 0\n\n    # Remove elements in place\n    for i in 0..count {\n      if !callback(self[i]) {\n        if index < i {\n          self[index] = self[i]\n        }\n        index++\n      }\n    }\n\n    # Shrink the array to the correct size\n    while index < count {\n      removeLast\n    }\n  }\n\n  def equals(other List<T>) bool {\n    if count != other.count {\n      return false\n    }\n    for i in 0..count {\n      if self[i] != other[i] {\n        return false\n      }\n    }\n    return true\n  }\n}\n\nnamespace List {\n  def new List<T> {\n    return [] as dynamic\n  }\n}\n\nnamespace StringMap {\n  def new StringMap<T> {\n    return dynamic.Object.create(null)\n  }\n}\n\nclass StringMap {\n  def {...}(key string, value T) StringMap<T> {\n    self[key] = value\n    return self\n  }\n\n  def get(key string, defaultValue T) T {\n    var value = self[key]\n    return value != dynamic.void(0) ? value : defaultValue # Compare against undefined so the key is only hashed once for speed\n  }\n\n  def keys List<string> {\n    return dynamic.Object.keys(self)\n  }\n\n  def values List<T> {\n    var values List<T> = []\n    for key in self as dynamic {\n      values.append(self[key])\n    }\n    return values\n  }\n\n  def clone StringMap<T> {\n    var clone = new\n    for key in keys {\n      clone[key] = self[key]\n    }\n    return clone\n  }\n\n  def remove(key string) {\n    dynamic.delete(self[key])\n  }\n}\n\nnamespace IntMap {\n  def new IntMap<T> {\n    return {} as dynamic\n  }\n}\n\nclass IntMap {\n  def {...}(key int, value T) IntMap<T> {\n    self[key] = value\n    return self\n  }\n\n  def get(key int, defaultValue T) T {\n    var value = self[key]\n    return value != dynamic.void(0) ? value : defaultValue # Compare against undefined so the key is only hashed once for speed\n  }\n\n  def keys List<int> {\n    var keys List<int> = []\n    for key in dynamic.Object.keys(self) as List<string> {\n      keys.append(key as dynamic as int)\n    }\n    return keys\n  }\n\n  def values List<T> {\n    var values List<T> = []\n    for key in self as dynamic {\n      values.append(self[key])\n    }\n    return values\n  }\n\n  def clone IntMap<T> {\n    var clone = new\n    for key in keys {\n      clone[key] = self[key]\n    }\n    return clone\n  }\n\n  def remove(key int) {\n    dynamic.delete(self[key])\n  }\n}\n';
  Skew.UNICODE_LIBRARY = '\nnamespace Unicode {\n  enum Encoding {\n    UTF8\n    UTF16\n    UTF32\n  }\n\n  const STRING_ENCODING Encoding =\n    TARGET == .CSHARP || TARGET == .JAVASCRIPT ? .UTF16 :\n    .UTF32\n\n  class StringIterator {\n    var value = ""\n    var index = 0\n    var stop = 0\n\n    def reset(text string, start int) StringIterator {\n      value = text\n      index = start\n      stop = text.count\n      return self\n    }\n\n    def countCodePointsUntil(stop int) int {\n      var count = 0\n      while index < stop && nextCodePoint >= 0 {\n        count++\n      }\n      return count\n    }\n\n    if STRING_ENCODING == .UTF8 {\n      def nextCodePoint int {\n        if index >= stop { return -1 }\n        var a = value[index]\n        index++\n        if a < 0xC0 { return a }\n        if index >= stop { return -1 }\n        var b = value[index]\n        index++\n        if a < 0xE0 { return ((a & 0x1F) << 6) | (b & 0x3F) }\n        if index >= stop { return -1 }\n        var c = value[index]\n        index++\n        if a < 0xF0 { return ((a & 0x0F) << 12) | ((b & 0x3F) << 6) | (c & 0x3F) }\n        if index >= stop { return -1 }\n        var d = value[index]\n        index++\n        return ((a & 0x07) << 18) | ((b & 0x3F) << 12) | ((c & 0x3F) << 6) | (d & 0x3F)\n      }\n    }\n\n    else if STRING_ENCODING == .UTF16 {\n      def nextCodePoint int {\n        if index >= stop { return -1 }\n        var a = value[index]\n        index++\n        if a < 0xD800 || a >= 0xDC00 { return a }\n        if index >= stop { return -1 }\n        var b = value[index]\n        index++\n        return (a << 10) + b + (0x10000 - (0xD800 << 10) - 0xDC00)\n      }\n    }\n\n    else {\n      def nextCodePoint int {\n        if index >= stop { return -1 }\n        var c = value[index]\n        index++\n        return c\n      }\n    }\n  }\n\n  namespace StringIterator {\n    const INSTANCE = StringIterator.new\n  }\n\n  def codeUnitCountForCodePoints(codePoints List<int>, encoding Encoding) int {\n    var count = 0\n\n    switch encoding {\n      case .UTF8 {\n        for codePoint in codePoints {\n          if codePoint < 0x80 { count++ }\n          else if codePoint < 0x800 { count += 2 }\n          else if codePoint < 0x10000 { count += 3 }\n          else { count += 4 }\n        }\n      }\n\n      case .UTF16 {\n        for codePoint in codePoints {\n          if codePoint < 0x10000 { count++ }\n          else { count += 2 }\n        }\n      }\n\n      case .UTF32 {\n        count = codePoints.count\n      }\n    }\n\n    return count\n  }\n}\n\nclass string {\n  if Unicode.STRING_ENCODING == .UTF32 {\n    def codePoints List<int> {\n      return codeUnits\n    }\n  }\n\n  else {\n    def codePoints List<int> {\n      var codePoints List<int> = []\n      var instance = Unicode.StringIterator.INSTANCE\n      instance.reset(self, 0)\n\n      while true {\n        var codePoint = instance.nextCodePoint\n        if codePoint < 0 {\n          return codePoints\n        }\n        codePoints.append(codePoint)\n      }\n    }\n  }\n}\n\nnamespace string {\n  def fromCodePoints(codePoints List<int>) string {\n    var builder = StringBuilder.new\n    for codePoint in codePoints {\n      builder.append(fromCodePoint(codePoint))\n    }\n    return builder.toString\n  }\n\n  if Unicode.STRING_ENCODING == .UTF8 {\n    def fromCodePoint(codePoint int) string {\n      return\n        codePoint < 0x80 ? fromCodeUnit(codePoint) : (\n          codePoint < 0x800 ? fromCodeUnit(((codePoint >> 6) & 0x1F) | 0xC0) : (\n            codePoint < 0x10000 ? fromCodeUnit(((codePoint >> 12) & 0x0F) | 0xE0) : (\n              fromCodeUnit(((codePoint >> 18) & 0x07) | 0xF0)\n            ) + fromCodeUnit(((codePoint >> 12) & 0x3F) | 0x80)\n          ) + fromCodeUnit(((codePoint >> 6) & 0x3F) | 0x80)\n        ) + fromCodeUnit((codePoint & 0x3F) | 0x80)\n    }\n  }\n\n  else if Unicode.STRING_ENCODING == .UTF16 {\n    def fromCodePoint(codePoint int) string {\n      return codePoint < 0x10000 ? fromCodeUnit(codePoint) :\n        fromCodeUnit(((codePoint - 0x10000) >> 10) + 0xD800) +\n        fromCodeUnit(((codePoint - 0x10000) & ((1 << 10) - 1)) + 0xDC00)\n    }\n  }\n\n  else {\n    def fromCodePoint(codePoint int) string {\n      return fromCodeUnit(codePoint)\n    }\n  }\n}\n';
  Skew.DEFAULT_MESSAGE_LIMIT = 10;
  Skew.VALID_TARGETS = in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(Object.create(null), 'typecheck', new Skew.TypeCheckingCompilerTarget()), 'cpp', new Skew.CPlusPlusTarget()), 'cs', new Skew.CSharpTarget()), 'js', new Skew.JavaScriptTarget()), 'lisp-tree', new Skew.LispTreeTarget());
  Skew.CSharpEmitter._isKeyword = in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(Object.create(null), 'abstract', 0), 'as', 0), 'base', 0), 'bool', 0), 'break', 0), 'byte', 0), 'case', 0), 'catch', 0), 'char', 0), 'checked', 0), 'class', 0), 'const', 0), 'continue', 0), 'decimal', 0), 'default', 0), 'delegate', 0), 'do', 0), 'double', 0), 'else', 0), 'enum', 0), 'event', 0), 'explicit', 0), 'extern', 0), 'false', 0), 'finally', 0), 'fixed', 0), 'float', 0), 'for', 0), 'foreach', 0), 'goto', 0), 'if', 0), 'implicit', 0), 'in', 0), 'int', 0), 'interface', 0), 'internal', 0), 'is', 0), 'lock', 0), 'long', 0), 'namespace', 0), 'new', 0), 'null', 0), 'object', 0), 'operator', 0), 'out', 0), 'override', 0), 'params', 0), 'private', 0), 'protected', 0), 'public', 0), 'readonly', 0), 'ref', 0), 'return', 0), 'sbyte', 0), 'sealed', 0), 'short', 0), 'sizeof', 0), 'stackalloc', 0), 'static', 0), 'string', 0), 'struct', 0), 'switch', 0), 'this', 0), 'throw', 0), 'true', 0), 'try', 0), 'typeof', 0), 'uint', 0), 'ulong', 0), 'unchecked', 0), 'unsafe', 0), 'ushort', 0), 'using', 0), 'virtual', 0), 'void', 0), 'volatile', 0), 'while', 0);
  Skew.CPlusPlusEmitter._isKeyword = in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(Object.create(null), 'alignas', 0), 'alignof', 0), 'and', 0), 'and_eq', 0), 'asm', 0), 'auto', 0), 'bitand', 0), 'bitor', 0), 'bool', 0), 'break', 0), 'case', 0), 'catch', 0), 'char', 0), 'char16_t', 0), 'char32_t', 0), 'class', 0), 'compl', 0), 'const', 0), 'const_cast', 0), 'constexpr', 0), 'continue', 0), 'decltype', 0), 'default', 0), 'delete', 0), 'do', 0), 'double', 0), 'dynamic_cast', 0), 'else', 0), 'enum', 0), 'explicit', 0), 'export', 0), 'extern', 0), 'false', 0), 'float', 0), 'for', 0), 'friend', 0), 'goto', 0), 'if', 0), 'INFINITY', 0), 'inline', 0), 'int', 0), 'long', 0), 'mutable', 0), 'namespace', 0), 'NAN', 0), 'new', 0), 'noexcept', 0), 'not', 0), 'not_eq', 0), 'NULL', 0), 'nullptr', 0), 'operator', 0), 'or', 0), 'or_eq', 0), 'private', 0), 'protected', 0), 'public', 0), 'register', 0), 'reinterpret_cast', 0), 'return', 0), 'short', 0), 'signed', 0), 'sizeof', 0), 'static', 0), 'static_assert', 0), 'static_cast', 0), 'struct', 0), 'switch', 0), 'template', 0), 'this', 0), 'thread_local', 0), 'throw', 0), 'true', 0), 'try', 0), 'typedef', 0), 'typeid', 0), 'typename', 0), 'union', 0), 'unsigned', 0), 'using', 0), 'virtual', 0), 'void', 0), 'volatile', 0), 'wchar_t', 0), 'while', 0), 'xor', 0), 'xor_eq', 0);
  Skew.JavaScriptEmitter._first = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$';
  Skew.JavaScriptEmitter._rest = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$0123456789';
  Skew.JavaScriptEmitter._isFunctionProperty = in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(Object.create(null), 'apply', 0), 'call', 0), 'length', 0), 'name', 0);
  Skew.JavaScriptEmitter._isKeyword = in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(Object.create(null), 'arguments', 0), 'Boolean', 0), 'break', 0), 'case', 0), 'catch', 0), 'class', 0), 'const', 0), 'constructor', 0), 'continue', 0), 'Date', 0), 'debugger', 0), 'default', 0), 'delete', 0), 'do', 0), 'double', 0), 'else', 0), 'export', 0), 'extends', 0), 'false', 0), 'finally', 0), 'float', 0), 'for', 0), 'Function', 0), 'function', 0), 'if', 0), 'import', 0), 'in', 0), 'instanceof', 0), 'int', 0), 'let', 0), 'new', 0), 'null', 0), 'Number', 0), 'Object', 0), 'return', 0), 'String', 0), 'super', 0), 'this', 0), 'throw', 0), 'true', 0), 'try', 0), 'var', 0);
  Skew.JavaScriptEmitter.KEYWORD_CALL_MAP = in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(Object.create(null), 'delete', 0), 'typeof', 0), 'void', 0);
  Skew.JavaScriptEmitter.SPECIAL_VARIABLE_MAP = in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(Object.create(null), '__extends', Skew.JavaScriptEmitter.SpecialVariable.EXTENDS), '__imul', Skew.JavaScriptEmitter.SpecialVariable.MULTIPLY), '__isBool', Skew.JavaScriptEmitter.SpecialVariable.IS_BOOL), '__isDouble', Skew.JavaScriptEmitter.SpecialVariable.IS_DOUBLE), '__isInt', Skew.JavaScriptEmitter.SpecialVariable.IS_INT), '__isString', Skew.JavaScriptEmitter.SpecialVariable.IS_STRING);

  // An implicit return is a return statement inside an expression lambda. For
  // example, the lambda "x => x" is compiled into "x => { return x }" where
  // the return statement has this flag set.
  Skew.Node.IS_IMPLICIT_RETURN = 1 << 0;

  // This flag marks nodes that were wrapped in parentheses in the original
  // source code. It's used for warnings about C-style syntax in conditional
  // statements and to call a lambda returned from a getter.
  Skew.Node.IS_INSIDE_PARENTHESES = 1 << 1;

  // This flag is only for blocks. A simple control flow analysis is run
  // during code resolution and blocks where control flow reaches the end of
  // the block have this flag set.
  Skew.Node.HAS_CONTROL_FLOW_AT_END = 1 << 2;
  Skew.Node._nextID = 0;
  Skew.Parsing.expressionParser = null;
  Skew.Parsing.typeParser = null;
  Skew.Parsing.operatorOverloadTokenKinds = in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert({}, Skew.TokenKind.ASSIGN_BITWISE_AND, 0), Skew.TokenKind.ASSIGN_BITWISE_OR, 0), Skew.TokenKind.ASSIGN_BITWISE_XOR, 0), Skew.TokenKind.ASSIGN_DIVIDE, 0), Skew.TokenKind.ASSIGN_INDEX, 0), Skew.TokenKind.ASSIGN_MINUS, 0), Skew.TokenKind.ASSIGN_MULTIPLY, 0), Skew.TokenKind.ASSIGN_PLUS, 0), Skew.TokenKind.ASSIGN_POWER, 0), Skew.TokenKind.ASSIGN_REMAINDER, 0), Skew.TokenKind.ASSIGN_SHIFT_LEFT, 0), Skew.TokenKind.ASSIGN_SHIFT_RIGHT, 0), Skew.TokenKind.ASSIGN_UNSIGNED_SHIFT_RIGHT, 0), Skew.TokenKind.BITWISE_AND, 0), Skew.TokenKind.BITWISE_OR, 0), Skew.TokenKind.BITWISE_XOR, 0), Skew.TokenKind.COMPARE, 0), Skew.TokenKind.DECREMENT, 0), Skew.TokenKind.DIVIDE, 0), Skew.TokenKind.IN, 0), Skew.TokenKind.INCREMENT, 0), Skew.TokenKind.INDEX, 0), Skew.TokenKind.LIST, 0), Skew.TokenKind.MINUS, 0), Skew.TokenKind.MULTIPLY, 0), Skew.TokenKind.NOT, 0), Skew.TokenKind.PLUS, 0), Skew.TokenKind.POWER, 0), Skew.TokenKind.REMAINDER, 0), Skew.TokenKind.SET, 0), Skew.TokenKind.SHIFT_LEFT, 0), Skew.TokenKind.SHIFT_RIGHT, 0), Skew.TokenKind.TILDE, 0), Skew.TokenKind.UNSIGNED_SHIFT_RIGHT, 0);
  Skew.Parsing.dotInfixParselet = function(context, left) {
    context.next();
    var range = context.current().range;

    if (!context.expect(Skew.TokenKind.IDENTIFIER)) {
      return null;
    }

    return new Skew.Node(Skew.NodeKind.DOT).withContent(new Skew.StringContent(range.toString())).appendChild(left).withRange(context.spanSince(left.range)).withInternalRange(range);
  };
  Skew.Parsing.initializerParselet = function(context) {
    var token = context.next();
    var kind = token.kind == Skew.TokenKind.LEFT_BRACE ? Skew.NodeKind.INITIALIZER_MAP : Skew.NodeKind.INITIALIZER_LIST;
    var node = Skew.Node.createInitializer(kind);

    if (token.kind == Skew.TokenKind.LEFT_BRACE || token.kind == Skew.TokenKind.LEFT_BRACKET) {
      var expectColon = kind != Skew.NodeKind.INITIALIZER_LIST;
      var end = expectColon ? Skew.TokenKind.RIGHT_BRACE : Skew.TokenKind.RIGHT_BRACKET;

      while (true) {
        context.eat(Skew.TokenKind.NEWLINE);
        var comments = Skew.Parsing.parseLeadingComments(context);

        if (context.peek(end)) {
          break;
        }

        var first = Skew.Parsing.expressionParser.parse(context, Skew.Precedence.LOWEST);

        if (first == null) {
          return null;
        }

        var colon = context.current();

        if (!expectColon) {
          node.appendChild(first);
        }

        else {
          if (!context.expect(Skew.TokenKind.COLON)) {
            return null;
          }

          var second = Skew.Parsing.expressionParser.parse(context, Skew.Precedence.LOWEST);

          if (second == null) {
            return null;
          }

          first = Skew.Node.createPair(first, second).withRange(Skew.Range.span(first.range, second.range)).withInternalRange(colon.range);
          node.appendChild(first);
        }

        first.comments = comments;

        if (!context.eat(Skew.TokenKind.COMMA)) {
          break;
        }
      }

      context.skipWhitespace();

      if (!context.expect(end)) {
        return null;
      }
    }

    else if (token.kind == Skew.TokenKind.LIST_NEW || token.kind == Skew.TokenKind.SET_NEW) {
      node.appendChild(new Skew.Node(Skew.NodeKind.NAME).withContent(new Skew.StringContent('new')).withRange(new Skew.Range(token.range.source, token.range.start + 1 | 0, token.range.end - 1 | 0)));
    }

    return node.withRange(context.spanSince(token.range));
  };
  Skew.Parsing.parameterizedParselet = function(context, left) {
    var value = Skew.Node.createParameterize(left);
    var token = context.next();

    while (true) {
      var type = Skew.Parsing.typeParser.parse(context, Skew.Precedence.LOWEST);

      if (type == null) {
        return null;
      }

      value.appendChild(type);

      if (!context.eat(Skew.TokenKind.COMMA)) {
        break;
      }
    }

    if (!context.expect(Skew.TokenKind.END_PARAMETER_LIST)) {
      return null;
    }

    return value.withRange(context.spanSince(left.range)).withInternalRange(context.spanSince(token.range));
  };

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
  Skew.Symbol.IS_INLINING_DISABLED = 1 << 12;
  Skew.Symbol.IS_PREFERRED = 1 << 13;
  Skew.Symbol.IS_PROTECTED = 1 << 14;
  Skew.Symbol.IS_RENAMED = 1 << 15;
  Skew.Symbol.IS_SKIPPED = 1 << 16;
  Skew.Symbol.SHOULD_SPREAD = 1 << 17;

  // Pass-specific flags
  Skew.Symbol.IS_OBSOLETE = 1 << 18;
  Skew.Symbol.IS_PRIMARY_CONSTRUCTOR = 1 << 19;
  Skew.Symbol.IS_VIRTUAL = 1 << 20;
  Skew.Symbol._nextID = 0;
  Skew.Renaming.unaryPrefixes = in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(Object.create(null), '!', 'not'), '+', 'positive'), '++', 'increment'), '-', 'negative'), '--', 'decrement'), '~', 'complement');
  Skew.Renaming.prefixes = in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(Object.create(null), '%', 'remainder'), '&', 'and'), '*', 'multiply'), '**', 'power'), '+', 'add'), '-', 'subtract'), '/', 'divide'), '<<', 'leftShift'), '<=>', 'compare'), '>>', 'rightShift'), '^', 'xor'), '|', 'or'), 'in', 'contains'), '%=', 'remainderUpdate'), '&=', 'andUpdate'), '**=', 'powerUpdate'), '*=', 'multiplyUpdate'), '+=', 'addUpdate'), '-=', 'subtractUpdate'), '/=', 'divideUpdate'), '<<=', 'leftShiftUpdate'), '>>=', 'rightShiftUpdate'), '^=', 'xorUpdate'), '|=', 'orUpdate'), '[]', 'get'), '[]=', 'set'), '[...]', 'append'), '[new]', 'new'), '{...}', 'insert'), '{new}', 'new');
  Skew.Resolving.Resolver.annotationSymbolFlags = in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(Object.create(null), '@deprecated', Skew.Symbol.IS_DEPRECATED), '@entry', Skew.Symbol.IS_ENTRY_POINT), '@export', Skew.Symbol.IS_EXPORTED), '@import', Skew.Symbol.IS_IMPORTED), '@noinline', Skew.Symbol.IS_INLINING_DISABLED), '@prefer', Skew.Symbol.IS_PREFERRED), '@rename', Skew.Symbol.IS_RENAMED), '@skip', Skew.Symbol.IS_SKIPPED), '@spreads', Skew.Symbol.SHOULD_SPREAD);
  Skew.Type.DYNAMIC = null;
  Skew.Type.NULL = null;
  Skew.Type._nextID = 0;
  Skew.Environment._nextID = 0;
  Skew.in_PassKind._strings = ['EMITTING', 'PARSING', 'LEXING', 'TOKEN_PROCESSING', 'CALL_GRAPH', 'FOLDING', 'GLOBALIZING', 'INLINING', 'INTERFACE_REMOVAL', 'LAMBDA_LIFTING', 'MERGING', 'MOTION', 'RENAMING', 'RESOLVING'];
  Skew.in_NodeKind._strings = ['ANNOTATION', 'BLOCK', 'CASE', 'CATCH', 'VARIABLE', 'BREAK', 'CONTINUE', 'EXPRESSION', 'FOR', 'FOREACH', 'IF', 'RETURN', 'SWITCH', 'THROW', 'TRY', 'VARIABLES', 'WHILE', 'ASSIGN_INDEX', 'CALL', 'CAST', 'CONSTANT', 'DOT', 'HOOK', 'INDEX', 'INITIALIZER_LIST', 'INITIALIZER_MAP', 'LAMBDA', 'LAMBDA_TYPE', 'NAME', 'NULL', 'PAIR', 'PARAMETERIZE', 'SEQUENCE', 'SUPER', 'TYPE', 'TYPE_CHECK', 'COMPLEMENT', 'DECREMENT', 'INCREMENT', 'NEGATIVE', 'NOT', 'POSITIVE', 'ADD', 'BITWISE_AND', 'BITWISE_OR', 'BITWISE_XOR', 'COMPARE', 'DIVIDE', 'EQUAL', 'IN', 'LOGICAL_AND', 'LOGICAL_OR', 'MULTIPLY', 'NOT_EQUAL', 'POWER', 'REMAINDER', 'SHIFT_LEFT', 'SHIFT_RIGHT', 'SUBTRACT', 'UNSIGNED_SHIFT_RIGHT', 'GREATER_THAN', 'GREATER_THAN_OR_EQUAL', 'LESS_THAN', 'LESS_THAN_OR_EQUAL', 'ASSIGN', 'ASSIGN_ADD', 'ASSIGN_BITWISE_AND', 'ASSIGN_BITWISE_OR', 'ASSIGN_BITWISE_XOR', 'ASSIGN_DIVIDE', 'ASSIGN_MULTIPLY', 'ASSIGN_POWER', 'ASSIGN_REMAINDER', 'ASSIGN_SHIFT_LEFT', 'ASSIGN_SHIFT_RIGHT', 'ASSIGN_SUBTRACT', 'ASSIGN_UNSIGNED_SHIFT_RIGHT'];
  Skew.in_SymbolKind._strings = ['PARAMETER_FUNCTION', 'PARAMETER_OBJECT', 'OBJECT_CLASS', 'OBJECT_ENUM', 'OBJECT_GLOBAL', 'OBJECT_INTERFACE', 'OBJECT_NAMESPACE', 'OBJECT_WRAPPED', 'FUNCTION_ANNOTATION', 'FUNCTION_CONSTRUCTOR', 'FUNCTION_GLOBAL', 'FUNCTION_INSTANCE', 'FUNCTION_LOCAL', 'OVERLOADED_ANNOTATION', 'OVERLOADED_GLOBAL', 'OVERLOADED_INSTANCE', 'VARIABLE_ARGUMENT', 'VARIABLE_ENUM', 'VARIABLE_GLOBAL', 'VARIABLE_INSTANCE', 'VARIABLE_LOCAL'];
  Skew.in_TokenKind._strings = ['ANNOTATION', 'ARROW', 'AS', 'ASSIGN', 'ASSIGN_BITWISE_AND', 'ASSIGN_BITWISE_OR', 'ASSIGN_BITWISE_XOR', 'ASSIGN_DIVIDE', 'ASSIGN_INDEX', 'ASSIGN_MINUS', 'ASSIGN_MULTIPLY', 'ASSIGN_PLUS', 'ASSIGN_POWER', 'ASSIGN_REMAINDER', 'ASSIGN_SHIFT_LEFT', 'ASSIGN_SHIFT_RIGHT', 'ASSIGN_UNSIGNED_SHIFT_RIGHT', 'BITWISE_AND', 'BITWISE_OR', 'BITWISE_XOR', 'BREAK', 'CASE', 'CATCH', 'CHARACTER', 'CLASS', 'COLON', 'COMMA', 'COMMENT', 'COMPARE', 'CONST', 'CONTINUE', 'DECREMENT', 'DEF', 'DEFAULT', 'DIVIDE', 'DOT', 'DOT_DOT', 'DOUBLE', 'DOUBLE_COLON', 'DYNAMIC', 'ELSE', 'END_OF_FILE', 'ENUM', 'EQUAL', 'ERROR', 'FALSE', 'FINALLY', 'FOR', 'GREATER_THAN', 'GREATER_THAN_OR_EQUAL', 'IDENTIFIER', 'IF', 'IN', 'INCREMENT', 'INDEX', 'INT', 'INTERFACE', 'INT_BINARY', 'INT_HEX', 'INT_OCTAL', 'IS', 'LEFT_BRACE', 'LEFT_BRACKET', 'LEFT_PARENTHESIS', 'LESS_THAN', 'LESS_THAN_OR_EQUAL', 'LIST', 'LIST_NEW', 'LOGICAL_AND', 'LOGICAL_OR', 'MINUS', 'MULTIPLY', 'NAMESPACE', 'NEWLINE', 'NOT', 'NOT_EQUAL', 'NULL', 'OVER', 'PLUS', 'POWER', 'QUESTION_MARK', 'REMAINDER', 'RETURN', 'RIGHT_BRACE', 'RIGHT_BRACKET', 'RIGHT_PARENTHESIS', 'SEMICOLON', 'SET', 'SET_NEW', 'SHIFT_LEFT', 'SHIFT_RIGHT', 'STRING', 'SUPER', 'SWITCH', 'THROW', 'TILDE', 'TRUE', 'TRY', 'UNSIGNED_SHIFT_RIGHT', 'VAR', 'WHILE', 'WHITESPACE', 'YY_INVALID_ACTION', 'START_PARAMETER_LIST', 'END_PARAMETER_LIST'];
  Terminal.colorToEscapeCode = in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert({}, Terminal.Color.DEFAULT, 0), Terminal.Color.BOLD, 1), Terminal.Color.GRAY, 90), Terminal.Color.RED, 91), Terminal.Color.GREEN, 92), Terminal.Color.YELLOW, 93), Terminal.Color.BLUE, 94), Terminal.Color.MAGENTA, 95), Terminal.Color.CYAN, 96);

  process.exit(Skew.main(process.argv.slice(2)));
})();
