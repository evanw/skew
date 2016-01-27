(function() {
  function __extends(derived, base) {
    derived.prototype = Object.create(base.prototype);
    derived.prototype.constructor = derived;
  }

  var __imul = Math.imul ? Math.imul : function(a, b) {
    return (a * (b >>> 16) << 16) + a * (b & 65535) | 0;
  };

  function assert(truth) {
    if (!truth) {
      throw Error('Assertion failed');
    }
  }

  var Target = {
    CSHARP: 2,
    JAVASCRIPT: 3
  };

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
        for (var i = 0, list = codePoints, count1 = list.length; i < count1; i = i + 1 | 0) {
          var codePoint = in_List.get(list, i);

          if (codePoint < 128) {
            count = count + 1 | 0;
          }

          else if (codePoint < 2048) {
            count = count + 2 | 0;
          }

          else if (codePoint < 65536) {
            count = count + 3 | 0;
          }

          else {
            count = count + 4 | 0;
          }
        }
        break;
      }

      case Unicode.Encoding.UTF16: {
        for (var i1 = 0, list1 = codePoints, count2 = list1.length; i1 < count2; i1 = i1 + 1 | 0) {
          var codePoint1 = in_List.get(list1, i1);

          if (codePoint1 < 65536) {
            count = count + 1 | 0;
          }

          else {
            count = count + 2 | 0;
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

    var a = in_string.get1(this.value, (this.index = this.index + 1 | 0) + -1 | 0);

    if (a < 55296 || a >= 56320) {
      return a;
    }

    if (this.index >= this.stop) {
      return -1;
    }

    var b = in_string.get1(this.value, (this.index = this.index + 1 | 0) + -1 | 0);
    return ((a << 10) + b | 0) + ((65536 - (55296 << 10) | 0) - 56320 | 0) | 0;
  };

  var Skew = {};

  Skew.quoteString = function(text, style, octal) {
    var count = text.length;

    // Use whichever quote character is less frequent
    if (style == Skew.QuoteStyle.SHORTEST) {
      var singleQuotes = 0;
      var doubleQuotes = 0;

      for (var i = 0, count1 = count; i < count1; i = i + 1 | 0) {
        var c = in_string.get1(text, i);

        if (c == 34) {
          doubleQuotes = doubleQuotes + 1 | 0;
        }

        else if (c == 39) {
          singleQuotes = singleQuotes + 1 | 0;
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

    for (var i1 = 0, count2 = count; i1 < count2; i1 = i1 + 1 | 0) {
      var c1 = in_string.get1(text, i1);

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
        // Avoid issues around accidental octal encoding
        var next = (i1 + 1 | 0) < count ? in_string.get1(text, i1 + 1 | 0) : 0;
        escaped = octal == Skew.QuoteOctal.OCTAL_WORKAROUND && next >= 48 && next <= 57 ? '\\000' : '\\0';
      }

      else if (c1 == 92) {
        escaped = '\\\\';
      }

      else if (c1 < 32) {
        escaped = '\\x' + in_string.get(Skew.HEX, c1 >> 4) + in_string.get(Skew.HEX, c1 & 15);
      }

      else {
        continue;
      }

      builder.append(in_string.slice2(text, start, i1));
      builder.append(escaped);
      start = i1 + 1 | 0;
    }

    builder.append(in_string.slice2(text, start, count));
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

      encoded += in_string.get(Skew.BASE64, digit);

      if (vlq == 0) {
        break;
      }
    }

    return encoded;
  };

  Skew.argumentCountForOperator = function(text) {
    if (Skew.validArgumentCounts == null) {
      Skew.validArgumentCounts = Object.create(null);

      for (var i = 0, list = in_IntMap.values(Skew.operatorInfo), count = list.length; i < count; i = i + 1 | 0) {
        var value = in_List.get(list, i);
        Skew.validArgumentCounts[value.text] = value.validArgumentCounts;
      }

      Skew.validArgumentCounts['<>...</>'] = [1];
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
    return slashIndex == -1 ? new Skew.SplitPath('.', path) : new Skew.SplitPath(in_string.slice2(path, 0, slashIndex), in_string.slice1(path, slashIndex + 1 | 0));
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

  Skew.doubleToStringWithDot = function(value) {
    // These cases are different for each language target and must be handled before this
    assert(isFinite(value));
    var text = value.toString();

    // The C# implementation of double.ToString() uses an uppercase "E"
    if (TARGET == Target.CSHARP) {
      text = text.toLowerCase();
    }

    // "1" => "1.0"
    // "1.5" => "1.5"
    // "1e+100" => "1.0e+100"
    // "1.5e+100" => "1.5e+100"
    if (!(text.indexOf('.') != -1)) {
      var e = text.indexOf('e');

      if (e != -1) {
        text = in_string.slice2(text, 0, e) + '.0' + in_string.slice1(text, e);
      }

      else {
        text += '.0';
      }
    }

    return text;
  };

  // The cost of changing the case of a letter is 0.5 instead of 1
  Skew.caseAwareLevenshteinEditDistance = function(a, b) {
    var an = a.length;
    var bn = b.length;
    var v0 = [];
    var v1 = [];

    for (var i = 0, count = bn + 1 | 0; i < count; i = i + 1 | 0) {
      v0.push(i);
      v1.push(i);
    }

    for (var i1 = 0, count3 = an; i1 < count3; i1 = i1 + 1 | 0) {
      var ca = in_string.get1(a, i1);
      in_List.set(v1, 0, i1 + 1 | 0);

      for (var j = 0, count1 = bn; j < count1; j = j + 1 | 0) {
        var cb = in_string.get1(b, j);
        in_List.set(v1, j + 1 | 0, Math.min(in_List.get(v0, j) + (ca == cb ? 0 : Skew.toLowerCase(ca) == Skew.toLowerCase(cb) ? 0.5 : 1), Math.min(in_List.get(v1, j), in_List.get(v0, j + 1 | 0)) + 1));
      }

      for (var j1 = 0, count2 = bn + 1 | 0; j1 < count2; j1 = j1 + 1 | 0) {
        in_List.set(v0, j1, in_List.get(v1, j1));
      }
    }

    return in_List.get(v1, bn);
  };

  Skew.toLowerCase = function(c) {
    return c >= 65 && c <= 90 ? (97 - 65 | 0) + c | 0 : c;
  };

  Skew.replaceSingleQuotesWithDoubleQuotes = function(text) {
    assert(in_string.startsWith(text, "'"));
    assert(in_string.endsWith(text, "'"));
    var builder = new StringBuilder();
    var start = 1;
    var limit = text.length - 1 | 0;
    builder.append('"');

    for (var i = start; i < limit; i = i + 1 | 0) {
      var c = in_string.get1(text, i);

      if (c == 34) {
        builder.append(in_string.slice2(text, start, i));
        builder.append('\\"');
        start = i + 1 | 0;
      }

      else if (c == 92) {
        if (in_string.get1(text, i + 1 | 0) == 39) {
          builder.append(in_string.slice2(text, start, i));
          builder.append("'");
          start = i + 2 | 0;
        }

        i = i + 1 | 0;
      }
    }

    builder.append(in_string.slice2(text, start, limit));
    builder.append('"');
    return builder.toString();
  };

  // This is the inner loop from "flex", an ancient lexer generator. The output
  // of flex is pretty bad (obfuscated variable names and the opposite of modular
  // code) but it's fast and somewhat standard for compiler design. The code below
  // replaces a simple hand-coded lexer and offers much better performance.
  Skew.tokenize = function(log, source) {
    var tokens = [];
    var text = source.contents;
    var count = text.length;
    var previousKind = Skew.TokenKind.NULL;
    var stack = [];

    // For backing up
    var yy_last_accepting_state = 0;
    var yy_last_accepting_cpos = 0;

    // The current character pointer
    var yy_cp = 0;

    while (yy_cp < count) {
      // Reset the NFA
      var yy_current_state = 1;

      // The pointer to the beginning of the token
      var yy_bp = yy_cp;
      var yy_act = Skew.TokenKind.ERROR;

      // Special-case string interpolation
      var c = in_string.get1(text, yy_cp);
      var isStringInterpolation = c == 34;

      if (c == 41) {
        for (var i = stack.length - 1 | 0; i >= 0; i = i - 1 | 0) {
          var kind = in_List.get(stack, i).kind;

          if (kind == Skew.TokenKind.STRING_INTERPOLATION_START) {
            isStringInterpolation = true;
          }

          else if (kind != Skew.TokenKind.LESS_THAN) {
            break;
          }
        }
      }

      if (isStringInterpolation) {
        var isExit = c == 41;
        yy_cp = yy_cp + 1 | 0;

        while (yy_cp < count) {
          c = in_string.get1(text, (yy_cp = yy_cp + 1 | 0) + -1 | 0);

          if (c == 34) {
            yy_act = isExit ? Skew.TokenKind.STRING_INTERPOLATION_END : Skew.TokenKind.STRING;
            break;
          }

          if (c == 92) {
            if (yy_cp == count) {
              break;
            }

            c = in_string.get1(text, (yy_cp = yy_cp + 1 | 0) + -1 | 0);

            if (c == 40) {
              yy_act = isExit ? Skew.TokenKind.STRING_INTERPOLATION_CONTINUE : Skew.TokenKind.STRING_INTERPOLATION_START;
              break;
            }
          }
        }
      }

      // Special-case XML literals
      else if (c == 62 && !(stack.length == 0) && in_List.last(stack).kind == Skew.TokenKind.XML_START) {
        yy_cp = yy_cp + 1 | 0;
        yy_act = Skew.TokenKind.XML_END;
      }

      // Search for a match
      else {
        while (yy_current_state != Skew.YY_JAM_STATE) {
          if (yy_cp >= count) {
            // This prevents syntax errors from causing infinite loops
            break;
          }

          c = in_string.get1(text, yy_cp);

          // All of the interesting characters are ASCII
          var index = c < 127 ? c : 127;
          var yy_c = in_List.get(Skew.yy_ec, index);

          if (in_List.get(Skew.yy_accept, yy_current_state) != Skew.TokenKind.YY_INVALID_ACTION) {
            yy_last_accepting_state = yy_current_state;
            yy_last_accepting_cpos = yy_cp;
          }

          while (in_List.get(Skew.yy_chk, in_List.get(Skew.yy_base, yy_current_state) + yy_c | 0) != yy_current_state) {
            yy_current_state = in_List.get(Skew.yy_def, yy_current_state);

            if (yy_current_state >= Skew.YY_ACCEPT_LENGTH) {
              yy_c = in_List.get(Skew.yy_meta, yy_c);
            }
          }

          yy_current_state = in_List.get(Skew.yy_nxt, in_List.get(Skew.yy_base, yy_current_state) + yy_c | 0);
          yy_cp = yy_cp + 1 | 0;
        }

        // Find the action
        yy_act = in_List.get(Skew.yy_accept, yy_current_state);

        while (yy_act == Skew.TokenKind.YY_INVALID_ACTION) {
          // Have to back up
          yy_cp = yy_last_accepting_cpos;
          yy_current_state = yy_last_accepting_state;
          yy_act = in_List.get(Skew.yy_accept, yy_current_state);
        }

        // Ignore whitespace
        if (yy_act == Skew.TokenKind.WHITESPACE) {
          continue;
        }

        // Stop at the end of the file
        if (yy_act == Skew.TokenKind.END_OF_FILE) {
          break;
        }
      }

      // Special-case XML literals
      if (yy_act == Skew.TokenKind.LESS_THAN && !(previousKind in Skew.FORBID_XML_AFTER)) {
        yy_act = Skew.TokenKind.XML_START;
      }

      // This is the default action in flex, which is usually called ECHO
      else if (yy_act == Skew.TokenKind.ERROR) {
        var iterator = Unicode.StringIterator.INSTANCE.reset(text, yy_bp);
        iterator.nextCodePoint();
        var range = new Skew.Range(source, yy_bp, iterator.index);
        log.syntaxErrorExtraData(range, range.toString());
        break;
      }

      var token = new Skew.Token(new Skew.Range(source, yy_bp, yy_cp), yy_act);

      // Have a nice error message for "//" comments
      if (token.kind == Skew.TokenKind.COMMENT_ERROR) {
        log.syntaxErrorSlashComment(token.range);
        token.kind = Skew.TokenKind.COMMENT;
      }

      // Tokens that start with a greater than may need to be split, potentially multiple times
      var loop = true;

      while (loop) {
        var tokenStartsWithGreaterThan = in_string.get1(text, token.range.start) == 62;
        var tokenKind = token.kind;
        loop = false;

        // Remove tokens from the stack if they aren't working out
        while (!(stack.length == 0)) {
          var top = in_List.last(stack);
          var topKind = top.kind;

          // Stop parsing a type if we find a token that no type expression uses
          if (topKind == Skew.TokenKind.LESS_THAN && tokenKind != Skew.TokenKind.LESS_THAN && tokenKind != Skew.TokenKind.IDENTIFIER && tokenKind != Skew.TokenKind.COMMA && tokenKind != Skew.TokenKind.DYNAMIC && tokenKind != Skew.TokenKind.DOT && tokenKind != Skew.TokenKind.LEFT_PARENTHESIS && tokenKind != Skew.TokenKind.RIGHT_PARENTHESIS && !tokenStartsWithGreaterThan) {
            in_List.removeLast(stack);
          }

          else {
            break;
          }
        }

        // Group open
        if (tokenKind == Skew.TokenKind.LEFT_PARENTHESIS || tokenKind == Skew.TokenKind.LEFT_BRACE || tokenKind == Skew.TokenKind.LEFT_BRACKET || tokenKind == Skew.TokenKind.LESS_THAN || tokenKind == Skew.TokenKind.STRING_INTERPOLATION_START || tokenKind == Skew.TokenKind.XML_START) {
          stack.push(token);
        }

        // Group close
        else if (tokenKind == Skew.TokenKind.RIGHT_PARENTHESIS || tokenKind == Skew.TokenKind.RIGHT_BRACE || tokenKind == Skew.TokenKind.RIGHT_BRACKET || tokenKind == Skew.TokenKind.STRING_INTERPOLATION_END || tokenKind == Skew.TokenKind.XML_END || tokenStartsWithGreaterThan) {
          // Search for a matching opposite token
          while (!(stack.length == 0)) {
            var top1 = in_List.last(stack);
            var topKind1 = top1.kind;

            // Don't match ">" that don't work since they are just operators
            if (tokenStartsWithGreaterThan && topKind1 != Skew.TokenKind.LESS_THAN) {
              break;
            }

            // Consume the current token
            in_List.removeLast(stack);

            // Stop if it's a match
            if (tokenKind == Skew.TokenKind.RIGHT_PARENTHESIS && topKind1 == Skew.TokenKind.LEFT_PARENTHESIS || tokenKind == Skew.TokenKind.RIGHT_BRACKET && topKind1 == Skew.TokenKind.LEFT_BRACKET || tokenKind == Skew.TokenKind.RIGHT_BRACE && topKind1 == Skew.TokenKind.LEFT_BRACE || tokenKind == Skew.TokenKind.STRING_INTERPOLATION_END && topKind1 == Skew.TokenKind.STRING_INTERPOLATION_START) {
              break;
            }

            // Special-case angle brackets matches and ignore tentative matches that didn't work out
            if (topKind1 == Skew.TokenKind.LESS_THAN && tokenStartsWithGreaterThan) {
              // Break apart operators that start with a closing angle bracket
              if (tokenKind != Skew.TokenKind.GREATER_THAN) {
                var start = token.range.start;
                tokens.push(new Skew.Token(new Skew.Range(source, start, start + 1 | 0), Skew.TokenKind.PARAMETER_LIST_END));
                token.range = new Skew.Range(source, start + 1 | 0, token.range.end);
                token.kind = tokenKind == Skew.TokenKind.SHIFT_RIGHT ? Skew.TokenKind.GREATER_THAN : tokenKind == Skew.TokenKind.UNSIGNED_SHIFT_RIGHT ? Skew.TokenKind.SHIFT_RIGHT : tokenKind == Skew.TokenKind.GREATER_THAN_OR_EQUAL ? Skew.TokenKind.ASSIGN : tokenKind == Skew.TokenKind.ASSIGN_SHIFT_RIGHT ? Skew.TokenKind.GREATER_THAN_OR_EQUAL : tokenKind == Skew.TokenKind.ASSIGN_UNSIGNED_SHIFT_RIGHT ? Skew.TokenKind.ASSIGN_SHIFT_RIGHT : Skew.TokenKind.NULL;
                assert(token.kind != Skew.TokenKind.NULL);

                // Split this token again
                loop = tokenKind != Skew.TokenKind.GREATER_THAN_OR_EQUAL;
              }

              else {
                token.kind = Skew.TokenKind.PARAMETER_LIST_END;
              }

              // Convert the "<" into a bound for type parameter lists
              top1.kind = Skew.TokenKind.PARAMETER_LIST_START;

              // Stop the search since we found a match
              break;
            }
          }
        }
      }

      // Remove newlines based on the previous token to enable line continuations.
      // Make sure to be conservative. We want to be like Python, not like
      // JavaScript ASI! Anything that is at all ambiguous should be disallowed.
      if (previousKind == Skew.TokenKind.NEWLINE && token.kind in Skew.REMOVE_NEWLINE_BEFORE) {
        in_List.removeLast(tokens);
      }

      previousKind = token.kind;

      // Accumulate the token for this iteration
      tokens.push(token);
    }

    // Every token stream ends in END_OF_FILE
    tokens.push(new Skew.Token(new Skew.Range(source, yy_cp, yy_cp), Skew.TokenKind.END_OF_FILE));

    // Also return preprocessor token presence so the preprocessor can be avoided
    return tokens;
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

    // Run all passes, stop compilation if there are errors after resolving (wait until then to make IDE mode better)
    for (var i = 0, list = options.passes, count = list.length; i < count; i = i + 1 | 0) {
      var pass = in_List.get(list, i);

      if (context.isResolvePassComplete && log.hasErrors()) {
        break;
      }

      if (pass.shouldRun()) {
        var passTimer = new Skew.PassTimer(pass.kind());
        passTimers.push(passTimer);
        passTimer.timer.start();
        pass.run(context);
        passTimer.timer.stop();
        context.verify();
      }
    }

    totalTimer.stop();
    return new Skew.CompilerResult(context.cache, context.global, context.outputs, passTimers, totalTimer);
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
        for (var i = 0, list = result.outputs, count = list.length; i < count; i = i + 1 | 0) {
          var output = in_List.get(list, i);

          if (output.name != null && !IO.writeFile(output.name, output.contents)) {
            var outputFile = parser.rangeForOption(Skew.Option.OUTPUT_FILE);
            var outputDirectory = parser.rangeForOption(Skew.Option.OUTPUT_DIRECTORY);
            log.commandLineErrorUnwritableFile(outputFile != null ? outputFile : outputDirectory, output.name);
            break;
          }
        }

        // Print compilation statistics
        if (!log.hasErrors()) {
          Skew.printWithColor(Terminal.Color.GRAY, result.statistics(inputs, options.verbose ? Skew.StatisticsKind.LONG : Skew.StatisticsKind.SHORT) + '\n');
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

    for (var i = 0, list = log.diagnostics, count = list.length; i < count; i = i + 1 | 0) {
      var diagnostic = in_List.get(list, i);

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

      diagnosticCount = diagnosticCount + 1 | 0;
    }

    // Print the summary
    var hasErrors = log.hasErrors();
    var hasWarnings = log.hasWarnings();
    var summary = '';

    if (hasWarnings) {
      summary += Skew.PrettyPrint.plural1(log.warningCount, 'warning');

      if (hasErrors) {
        summary += ' and ';
      }
    }

    if (hasErrors) {
      summary += Skew.PrettyPrint.plural1(log.errorCount, 'error');
    }

    if (hasWarnings || hasErrors) {
      process.stdout.write(summary + ' generated');
      Skew.printWithColor(Terminal.Color.GRAY, diagnosticCount >= log.diagnostics.length ? '\n' : ' (only showing ' + Skew.PrettyPrint.plural1(diagnosticLimit, 'message') + ', use "--message-limit=0" to see all)\n');
    }
  };

  Skew.readSources = function(log, inputs) {
    var result = [];
    var visit = null;
    visit = function(range, path) {
      if (in_string.startsWith(path, '.')) {
        return;
      }

      // Directories
      if (IO.isDirectory(path)) {
        var entries = IO.readDirectory(path);

        if (entries == null) {
          log.commandLineErrorUnreadableFile(range, path);
        }

        for (var i = 0, list = entries, count = list.length; i < count; i = i + 1 | 0) {
          var entry = in_List.get(list, i);

          if (!in_string.startsWith(entry, '.')) {
            visit(null, path + '/' + entry);
          }
        }
      }

      // Files (ignore non-skew files that aren't explicitly specified)
      else if (range != null || in_string.endsWith(path, '.sk')) {
        var contents = IO.readFile(path);

        if (contents == null) {
          log.commandLineErrorUnreadableFile(range, path);
        }

        else {
          result.push(new Skew.Source(path, contents));
        }
      }
    };

    // Recursively visit input directories
    for (var i = 0, list = inputs, count = list.length; i < count; i = i + 1 | 0) {
      var range = in_List.get(list, i);
      visit(range, range.toString());
    }

    return result;
  };

  Skew.parseOptions = function(log, parser, $arguments) {
    // Configure the parser
    parser.define(Skew.Options.Type.BOOL, Skew.Option.HELP, '--help', 'Prints this message.').aliases(['-help', '?', '-?', '-h', '-H', '/?', '/h', '/H']);
    parser.define(Skew.Options.Type.STRING, Skew.Option.TARGET, '--target', 'Sets the target format. Valid targets are ' + Skew.joinKeys(Object.keys(Skew.VALID_TARGETS)) + '.');
    parser.define(Skew.Options.Type.STRING, Skew.Option.OUTPUT_FILE, '--output-file', 'Combines all output into a single file. Mutually exclusive with --output-dir.');
    parser.define(Skew.Options.Type.STRING, Skew.Option.OUTPUT_DIRECTORY, '--output-dir', 'Places all output files in the specified directory. Mutually exclusive with --output-file.');
    parser.define(Skew.Options.Type.BOOL, Skew.Option.NO_OUTPUT, '--no-output', 'Stops after the type checking pass and does not generate any output.');
    parser.define(Skew.Options.Type.BOOL, Skew.Option.RELEASE, '--release', 'Implies --js-mangle, --js-minify, --fold-constants, --inline-functions, --globalize-functions, and --define:RELEASE=true.');
    parser.define(Skew.Options.Type.BOOL, Skew.Option.VERBOSE, '--verbose', 'Prints out information about the compilation.');
    parser.define(Skew.Options.Type.BOOL, Skew.Option.VERSION, '--version', 'Prints the current compiler version (' + Skew.VERSION + ') and exits.');
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

    // Early-out when printing the version
    if (parser.boolForOption(Skew.Option.VERSION, false)) {
      process.stdout.write(Skew.VERSION + '\n');
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
    options.jsSourceMap = parser.boolForOption(Skew.Option.JS_SOURCE_MAP, false);
    options.stopAfterResolve = parser.boolForOption(Skew.Option.NO_OUTPUT, false);
    options.verbose = parser.boolForOption(Skew.Option.VERBOSE, false);

    // Prepare the defines
    if (releaseFlag) {
      options.define('RELEASE', 'true');
    }

    for (var i = 0, list = parser.rangeListForOption(Skew.Option.DEFINE), count = list.length; i < count; i = i + 1 | 0) {
      var range = in_List.get(list, i);
      var name = range.toString();
      var equals = name.indexOf('=');

      if (equals < 0) {
        log.commandLineErrorExpectedDefineValue(range, name);
        continue;
      }

      options.defines[in_string.slice2(name, 0, equals)] = new Skew.Define(range.fromStart(equals), range.fromEnd((name.length - equals | 0) - 1 | 0));
    }

    // There must be at least one source file
    var end = parser.source.contents.length;
    var trailingSpace = new Skew.Range(parser.source, end - 1 | 0, end);

    if (parser.normalArguments.length == 0 && !options.stopAfterResolve) {
      log.commandLineErrorNoInputFiles(trailingSpace);
    }

    // Parse the output location
    if (!options.stopAfterResolve) {
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

    // Check the target format
    var target = parser.rangeForOption(Skew.Option.TARGET);

    if (target != null) {
      options.target = Skew.parseEnum(log, 'target', Skew.VALID_TARGETS, target, null);
    }

    else if (!options.createTargetFromExtension()) {
      log.commandLineErrorMissingTarget(trailingSpace);
    }

    return options;
  };

  Skew.joinKeys = function(keys) {
    keys.sort(Skew.SORT_STRINGS);
    return Skew.PrettyPrint.joinQuoted(keys, 'and');
  };

  Skew.parseEnum = function(log, name, map, range, defaultValue) {
    var key = range.toString();

    if (key in map) {
      return in_StringMap.get1(map, key);
    }

    var keys = Object.keys(map);

    // Sort so the order is deterministic
    keys.sort(Skew.SORT_STRINGS);
    log.commandLineErrorInvalidEnum(range, name, key, keys);
    return defaultValue;
  };

  Skew.SORT_STRINGS = function(a, b) {
    return in_string.compare(a, b);
  };

  Skew.PassKind = {
    EMITTING: 0,
    PARSING: 1,
    LEXING: 2,
    CALL_GRAPH: 3,
    FOLDING: 4,
    GLOBALIZING: 5,
    INLINING: 6,
    INTERFACE_REMOVAL: 7,
    LAMBDA_CONVERSION: 8,
    MERGING: 9,
    MOTION: 10,
    RENAMING: 11,
    RESOLVING: 12
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
    this._indent = in_string.slice1(this._indent, this._indentAmount.length);
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
    for (var i = 0, count = objects.length; i < count; i = i + 1 | 0) {
      var j = i;

      // Select an object that comes before all other types
      while (j < objects.length) {
        var object = in_List.get(objects, j);
        var k = i;

        // Check to see if this comes before all other types
        while (k < objects.length) {
          if (j != k && Skew.Emitter._objectComesBefore(in_List.get(objects, k), object)) {
            break;
          }

          k = k + 1 | 0;
        }

        if (k == objects.length) {
          break;
        }

        j = j + 1 | 0;
      }

      // Swap the object into the correct order
      if (j < objects.length) {
        in_List.swap(objects, i, j);
      }
    }

    return objects;
  };

  Skew.Emitter.prototype._markVirtualFunctions = function(symbol) {
    for (var i = 0, list = symbol.objects, count = list.length; i < count; i = i + 1 | 0) {
      var object = in_List.get(list, i);
      this._markVirtualFunctions(object);
    }

    for (var i2 = 0, list2 = symbol.functions, count2 = list2.length; i2 < count2; i2 = i2 + 1 | 0) {
      var $function = in_List.get(list2, i2);

      if ($function.overridden != null) {
        $function.overridden.flags |= Skew.SymbolFlags.IS_VIRTUAL;
        $function.flags |= Skew.SymbolFlags.IS_VIRTUAL;
      }

      if ($function.implementations != null) {
        for (var i1 = 0, list1 = $function.implementations, count1 = list1.length; i1 < count1; i1 = i1 + 1 | 0) {
          var other = in_List.get(list1, i1);
          other.flags |= Skew.SymbolFlags.IS_VIRTUAL;
          $function.flags |= Skew.SymbolFlags.IS_VIRTUAL;
        }
      }
    }
  };

  Skew.Emitter.prototype._findObjects = function(objects, object) {
    objects.push(object);

    for (var i = 0, list = object.objects, count = list.length; i < count; i = i + 1 | 0) {
      var o = in_List.get(list, i);
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
    return after.hasBaseClass(before) || after.hasInterface(before) || Skew.Emitter._isContainedBy(after, before) || after.forwardTo == before;
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
        var argument = in_List.first(entryPoint.$arguments);
        var array = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_ARGUMENT, argument.name);
        array.type = new Skew.Node(Skew.NodeKind.NAME).withContent(new Skew.StringContent('string[]')).withType(Skew.Type.DYNAMIC);
        array.resolvedType = Skew.Type.DYNAMIC;
        entryPoint.$arguments = [array];
        entryPoint.resolvedType.argumentTypes = [array.resolvedType];

        // Create the list from the array
        if (entryPoint.block != null) {
          array.name = entryPoint.scope.generateName(array.name);
          argument.kind = Skew.SymbolKind.VARIABLE_LOCAL;
          argument.value = Skew.Node.createCall(new Skew.Node(Skew.NodeKind.DOT).withContent(new Skew.StringContent('new')).appendChild(new Skew.Node(Skew.NodeKind.TYPE).withType(argument.resolvedType)).withType(Skew.Type.DYNAMIC)).withType(Skew.Type.DYNAMIC).appendChild(Skew.Node.createSymbolReference(array));
          entryPoint.block.prependChild(new Skew.Node(Skew.NodeKind.VARIABLES).appendChild(Skew.Node.createVariable(argument)));
        }
      }
    }

    // Avoid emitting unnecessary stuff
    Skew.shakingPass(global, entryPoint, Skew.ShakingMode.USE_TYPES);
    this._markVirtualFunctions(global);
    var emitIndividualFiles = this._options.outputDirectory != null;
    var objects = this._collectObjects(global);

    // Convert "flags" types to wrapped types
    for (var i1 = 0, list1 = objects, count1 = list1.length; i1 < count1; i1 = i1 + 1 | 0) {
      var object = in_List.get(list1, i1);

      if (object.kind == Skew.SymbolKind.OBJECT_FLAGS) {
        object.kind = Skew.SymbolKind.OBJECT_WRAPPED;
        object.wrappedType = this._cache.intType;

        // Enum values become normal global variables
        for (var i = 0, list = object.variables, count = list.length; i < count; i = i + 1 | 0) {
          var variable = in_List.get(list, i);

          if (variable.kind == Skew.SymbolKind.VARIABLE_ENUM_OR_FLAGS) {
            variable.kind = Skew.SymbolKind.VARIABLE_GLOBAL;
            variable.flags |= Skew.SymbolFlags.IS_CSHARP_CONST;
          }
        }
      }
    }

    // All code in C# is inside objects, so just emit objects recursively
    for (var i2 = 0, list2 = objects, count2 = list2.length; i2 < count2; i2 = i2 + 1 | 0) {
      var object1 = in_List.get(list2, i2);

      // Nested objects will be emitted by their parent
      if (object1.parent != null && object1.parent.kind == Skew.SymbolKind.OBJECT_CLASS) {
        continue;
      }

      this._emitObject(object1);

      // Emit each object into its own file if requested
      if (emitIndividualFiles) {
        this._finalizeEmittedFile();
        this._createSource(this._options.outputDirectory + '/' + Skew.CSharpEmitter._fullName(object1) + '.cs', Skew.EmitMode.SKIP_IF_EMPTY);
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
        globals.resolvedType = new Skew.Type(Skew.TypeKind.SYMBOL, globals);
        globals.state = Skew.SymbolState.INITIALIZED;
        globals.parent = symbol;
        symbol.objects.push(globals);
      }
    };

    for (var i = 0, list = symbol.objects, count = list.length; i < count; i = i + 1 | 0) {
      var object = in_List.get(list, i);
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
      if (in_List.get(this._namespaceStack, i) != in_List.get(symbols, i)) {
        break;
      }

      i = i + 1 | 0;
    }

    // Leave the old namespace
    while (this._namespaceStack.length > i) {
      var object = in_List.takeLast(this._namespaceStack);
      this._decreaseIndent();
      this._emit(this._indent + '}\n');
      this._emitNewlineAfterSymbol(object);
    }

    // Enter the new namespace
    while (this._namespaceStack.length < symbols.length) {
      var object1 = in_List.get(symbols, this._namespaceStack.length);
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
      // Sort so the order is deterministic
      usings.sort(Skew.SORT_STRINGS);

      for (var i = 0, list = usings, count = list.length; i < count; i = i + 1 | 0) {
        var using = in_List.get(list, i);
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
        for (var i = 0, list = symbol.annotations, count = list.length; i < count; i = i + 1 | 0) {
          var annotation = in_List.get(list, i);

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
      for (var i = 0, list = comments, count = list.length; i < count; i = i + 1 | 0) {
        var comment = in_List.get(list, i);
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

      case Skew.SymbolKind.OBJECT_ENUM:
      case Skew.SymbolKind.OBJECT_FLAGS: {
        this._emit('enum ');
        break;
      }

      case Skew.SymbolKind.OBJECT_INTERFACE: {
        this._emit('interface ');
        break;
      }

      case Skew.SymbolKind.OBJECT_WRAPPED: {
        this._emit('static class ');
        break;
      }

      default: {
        assert(false);
        break;
      }
    }

    this._emit(Skew.CSharpEmitter._mangleName(symbol));
    this._emitTypeParameters(symbol.parameters);

    if ((symbol.$extends != null || symbol.$implements != null) && symbol.kind != Skew.SymbolKind.OBJECT_WRAPPED) {
      this._emit(' : ');

      if (symbol.$extends != null) {
        this._emitExpressionOrType(symbol.$extends, symbol.baseType);
      }

      if (symbol.$implements != null) {
        for (var i = 0, list = symbol.$implements, count = list.length; i < count; i = i + 1 | 0) {
          var node = in_List.get(list, i);

          if (node != in_List.first(symbol.$implements) || symbol.$extends != null) {
            this._emit(', ');
          }

          this._emitExpressionOrType(node, node.resolvedType);
        }
      }
    }

    this._emit('\n' + this._indent + '{\n');
    this._increaseIndent();

    for (var i1 = 0, list1 = symbol.objects, count1 = list1.length; i1 < count1; i1 = i1 + 1 | 0) {
      var object = in_List.get(list1, i1);
      this._emitObject(object);
    }

    for (var i2 = 0, list2 = symbol.variables, count2 = list2.length; i2 < count2; i2 = i2 + 1 | 0) {
      var variable = in_List.get(list2, i2);
      this._emitVariable(variable);
    }

    for (var i3 = 0, list3 = symbol.functions, count3 = list3.length; i3 < count3; i3 = i3 + 1 | 0) {
      var $function = in_List.get(list3, i3);
      this._emitFunction($function);
    }

    this._decreaseIndent();
    this._emit(this._indent + '}\n');
    this._emitNewlineAfterSymbol(symbol);
  };

  Skew.CSharpEmitter.prototype._emitTypeParameters = function(parameters) {
    if (parameters != null) {
      this._emit('<');

      for (var i = 0, list = parameters, count = list.length; i < count; i = i + 1 | 0) {
        var parameter = in_List.get(list, i);

        if (parameter != in_List.first(parameters)) {
          this._emit(', ');
        }

        this._emit(Skew.CSharpEmitter._mangleName(parameter));
      }

      this._emit('>');
    }
  };

  Skew.CSharpEmitter.prototype._emitArgumentList = function(symbol) {
    this._emit('(');

    for (var i = 0, list = symbol.$arguments, count = list.length; i < count; i = i + 1 | 0) {
      var argument = in_List.get(list, i);

      if (argument != in_List.first(symbol.$arguments)) {
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

    if (symbol.kind == Skew.SymbolKind.VARIABLE_ENUM_OR_FLAGS) {
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
        this._emit(symbol.isCSharpConst() ? 'const ' : 'static ');
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
      symbol.$this.flags |= Skew.SymbolFlags.IS_EXPORTED;
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
      return;
    }

    type = this._cache.unwrappedType(type);

    if (type == Skew.Type.DYNAMIC) {
      this._emit('dynamic');
    }

    else if (type.kind == Skew.TypeKind.LAMBDA) {
      var argumentTypes = type.argumentTypes;
      var returnType = type.returnType;
      this._emit(returnType != null ? 'System.Func' : 'System.Action');

      if (!(argumentTypes.length == 0) || returnType != null) {
        this._emit('<');

        for (var i = 0, count = argumentTypes.length; i < count; i = i + 1 | 0) {
          if (i != 0) {
            this._emit(', ');
          }

          this._emitType(in_List.get(argumentTypes, i));
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
          this._emitType(in_List.first(type.substitutions));
        }

        else {
          for (var i1 = 0, count1 = type.substitutions.length; i1 < count1; i1 = i1 + 1 | 0) {
            if (i1 != 0) {
              this._emit(', ');
            }

            this._emitType(in_List.get(type.substitutions, i1));
          }
        }

        this._emit('>');
      }
    }
  };

  Skew.CSharpEmitter.prototype._emitExpressionOrType = function(node, type) {
    if (node != null && (type == null || type == Skew.Type.DYNAMIC)) {
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
        var value = Skew.in_Content.asDouble(content);

        if (!isFinite(value)) {
          this._usingNames['System'] = 0;
        }

        this._emit(isNaN(value) ? 'Double.NaN' : value == 1 / 0 ? 'Double.PositiveInfinity' : value == -(1 / 0) ? 'Double.NegativeInfinity' : Skew.doubleToStringWithDot(value));
        break;
      }

      case Skew.ContentKind.STRING: {
        this._emit(Skew.quoteString(Skew.in_Content.asString(content), Skew.QuoteStyle.DOUBLE, Skew.QuoteOctal.NORMAL));
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
        var wrap = precedence == Skew.Precedence.MEMBER && node.isNumberLessThanZero() && (!node.isDouble() || isFinite(node.asDouble()));

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
        var wrap1 = value.kind == Skew.NodeKind.LAMBDA;

        if (wrap1) {
          this._emit('new ');
          this._emitType(value.resolvedType);
          this._emit('(');
        }

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

        if (wrap1) {
          this._emit(')');
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

        // Automatically promote integer literals to doubles instead of using a cast
        else if (this._cache.isEquivalentToDouble(resolvedType) && value1.isInt()) {
          this._emitExpression(this._cache.createDouble(value1.asInt()), precedence);
        }

        // C# doesn't have a cast from bool to int
        else if (this._cache.isNumeric(resolvedType) && value1.resolvedType == this._cache.boolType) {
          this._emitExpression(Skew.Node.createHook(value1.remove(), this._cache.createInt(1), this._cache.createInt(0)).withType(this._cache.intType), precedence);
        }

        // C# doesn't have a cast from int to bool
        else if (resolvedType == this._cache.boolType && this._cache.isNumeric(value1.resolvedType)) {
          this._emitExpression(Skew.Node.createBinary(Skew.NodeKind.NOT_EQUAL, value1.remove(), this._cache.createInt(0)).withType(this._cache.boolType), precedence);
        }

        // Only emit a cast if the underlying types are different
        else if (this._cache.unwrappedType(value1.resolvedType) != this._cache.unwrappedType(type.resolvedType) || type.resolvedType == Skew.Type.DYNAMIC) {
          if (Skew.Precedence.UNARY_POSTFIX < precedence) {
            this._emit('(');
          }

          this._emit('(');
          this._emitExpressionOrType(type, type.resolvedType);
          this._emit(')');
          this._emitExpression(value1, Skew.Precedence.UNARY_POSTFIX);

          if (Skew.Precedence.UNARY_POSTFIX < precedence) {
            this._emit(')');
          }
        }

        // Otherwise, pretend the cast isn't there
        else {
          this._emitExpression(value1, precedence);
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
      case Skew.NodeKind.NEGATIVE:
      case Skew.NodeKind.NOT:
      case Skew.NodeKind.POSITIVE:
      case Skew.NodeKind.POSTFIX_DECREMENT:
      case Skew.NodeKind.POSTFIX_INCREMENT:
      case Skew.NodeKind.PREFIX_DECREMENT:
      case Skew.NodeKind.PREFIX_INCREMENT: {
        var value3 = node.unaryValue();
        var info = in_IntMap.get1(Skew.operatorInfo, kind);
        var sign = Skew.CSharpEmitter._sign(node);

        if (info.precedence < precedence) {
          this._emit('(');
        }

        if (!Skew.in_NodeKind.isUnaryPostfix(kind)) {
          this._emit(info.text);

          // Prevent "x - -1" from becoming "x--1"
          if (sign != Skew.NodeKind.NULL && sign == Skew.CSharpEmitter._sign(value3)) {
            this._emit(' ');
          }
        }

        this._emitExpression(value3, info.precedence);

        if (Skew.in_NodeKind.isUnaryPostfix(kind)) {
          this._emit(info.text);
        }

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

          else {
            var info1 = in_IntMap.get1(Skew.operatorInfo, kind);

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

  Skew.CSharpEmitter._sign = function(node) {
    var kind = node.kind;

    if (kind == Skew.NodeKind.NEGATIVE || kind == Skew.NodeKind.PREFIX_DECREMENT || node.isNumberLessThanZero()) {
      return Skew.NodeKind.NEGATIVE;
    }

    if (kind == Skew.NodeKind.POSITIVE || kind == Skew.NodeKind.PREFIX_INCREMENT) {
      return Skew.NodeKind.POSITIVE;
    }

    return Skew.NodeKind.NULL;
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
    symbol = symbol.forwarded();

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
    this._loopLabels = {};
    this._enclosingFunction = null;
  };

  __extends(Skew.CPlusPlusEmitter, Skew.Emitter);

  Skew.CPlusPlusEmitter.prototype.visit = function(global) {
    // Generate the entry point
    var entryPoint = this._cache.entryPointSymbol;

    if (entryPoint != null) {
      entryPoint.name = 'main';

      // The entry point must not be in a namespace
      if (entryPoint.parent != global) {
        in_List.removeOne(entryPoint.parent.asObjectSymbol().functions, entryPoint);
        entryPoint.parent = global;
        global.functions.push(entryPoint);
      }

      // The entry point in C++ takes an array, not a list
      if (entryPoint.$arguments.length == 1) {
        var argument = in_List.first(entryPoint.$arguments);
        var argc = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_ARGUMENT, entryPoint.scope.generateName('argc'));
        var argv = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_ARGUMENT, entryPoint.scope.generateName('argv'));
        argc.initializeWithType(this._cache.intType);
        argv.type = new Skew.Node(Skew.NodeKind.NAME).withContent(new Skew.StringContent('char**')).withType(Skew.Type.DYNAMIC);
        argv.resolvedType = Skew.Type.DYNAMIC;
        argv.state = Skew.SymbolState.INITIALIZED;
        entryPoint.$arguments = [argc, argv];
        entryPoint.resolvedType.argumentTypes = [argc.resolvedType, argv.resolvedType];

        // Create the list from the array
        if (entryPoint.block != null) {
          var advance = new Skew.Node(Skew.NodeKind.NAME).withContent(new Skew.StringContent('*' + argv.name + '++')).withType(Skew.Type.DYNAMIC);
          var block = new Skew.Node(Skew.NodeKind.BLOCK).appendChild(Skew.Node.createExpression(Skew.Node.createCall(new Skew.Node(Skew.NodeKind.DOT).withContent(new Skew.StringContent('append')).appendChild(Skew.Node.createSymbolReference(argument)).withType(Skew.Type.DYNAMIC)).withType(Skew.Type.DYNAMIC).appendChild(advance)));
          var check = Skew.Node.createIf(advance.clone(), new Skew.Node(Skew.NodeKind.BLOCK).appendChild(new Skew.Node(Skew.NodeKind.WHILE).appendChild(new Skew.Node(Skew.NodeKind.NAME).withContent(new Skew.StringContent('*' + argv.name)).withType(Skew.Type.DYNAMIC)).appendChild(block)), null);
          argument.kind = Skew.SymbolKind.VARIABLE_LOCAL;
          argument.value = Skew.Node.createCall(new Skew.Node(Skew.NodeKind.DOT).withContent(new Skew.StringContent('new')).appendChild(new Skew.Node(Skew.NodeKind.TYPE).withType(argument.resolvedType)).withType(Skew.Type.DYNAMIC)).withType(Skew.Type.DYNAMIC);
          entryPoint.block.prependChild(check);
          entryPoint.block.prependChild(new Skew.Node(Skew.NodeKind.VARIABLES).appendChild(Skew.Node.createVariable(argument)));
        }
      }
    }

    // Avoid emitting unnecessary stuff
    Skew.shakingPass(global, this._cache.entryPointSymbol, Skew.ShakingMode.USE_TYPES);
    this._markVirtualFunctions(global);

    // Nested types in C++ can't be forward declared
    var sorted = this._sortedObjects(global);

    for (var i = 0, list = sorted, count = list.length; i < count; i = i + 1 | 0) {
      var symbol = in_List.get(list, i);
      this._moveNestedObjectToEnclosingNamespace(symbol);
    }

    // Emit code in passes to deal with C++'s forward declarations
    for (var i1 = 0, list1 = sorted, count1 = list1.length; i1 < count1; i1 = i1 + 1 | 0) {
      var symbol1 = in_List.get(list1, i1);
      this._declareObject(symbol1);
    }

    for (var i2 = 0, list2 = sorted, count2 = list2.length; i2 < count2; i2 = i2 + 1 | 0) {
      var symbol2 = in_List.get(list2, i2);
      this._defineObject(symbol2);
    }

    this._adjustNamespace(null);

    for (var i4 = 0, list4 = sorted, count4 = list4.length; i4 < count4; i4 = i4 + 1 | 0) {
      var symbol3 = in_List.get(list4, i4);

      if (!symbol3.isImported()) {
        for (var i3 = 0, list3 = symbol3.variables, count3 = list3.length; i3 < count3; i3 = i3 + 1 | 0) {
          var variable = in_List.get(list3, i3);

          if (variable.kind == Skew.SymbolKind.VARIABLE_GLOBAL) {
            this._emitVariable(variable, Skew.CPlusPlusEmitter.CodeMode.IMPLEMENT);
          }
        }
      }
    }

    this._adjustNamespace(null);

    for (var i6 = 0, list6 = sorted, count6 = list6.length; i6 < count6; i6 = i6 + 1 | 0) {
      var symbol4 = in_List.get(list6, i6);

      if (!symbol4.isImported()) {
        for (var i5 = 0, list5 = symbol4.functions, count5 = list5.length; i5 < count5; i5 = i5 + 1 | 0) {
          var $function = in_List.get(list5, i5);
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
      if (symbol.kind == Skew.SymbolKind.OBJECT_NAMESPACE || symbol.kind == Skew.SymbolKind.OBJECT_WRAPPED) {
        symbols.unshift(symbol);
      }

      symbol = symbol.parent;
    }

    // Find the intersection
    var limit = Math.min(this._namespaceStack.length, symbols.length);
    var i = 0;

    while (i < limit) {
      if (in_List.get(this._namespaceStack, i) != in_List.get(symbols, i)) {
        break;
      }

      i = i + 1 | 0;
    }

    // Leave the old namespace
    while (this._namespaceStack.length > i) {
      var object = in_List.takeLast(this._namespaceStack);
      this._decreaseIndent();
      this._emit(this._indent + '}\n');
      this._emitNewlineAfterSymbol(object);
    }

    // Enter the new namespace
    while (this._namespaceStack.length < symbols.length) {
      var object1 = in_List.get(symbols, this._namespaceStack.length);
      this._emitNewlineBeforeSymbol(object1, Skew.CPlusPlusEmitter.CodeMode.DEFINE);
      this._emit(this._indent + 'namespace ' + Skew.CPlusPlusEmitter._mangleName(object1) + ' {\n');
      this._increaseIndent();
      this._namespaceStack.push(object1);
    }
  };

  Skew.CPlusPlusEmitter.prototype._emitComments = function(comments) {
    if (comments != null) {
      for (var i = 0, list = comments, count = list.length; i < count; i = i + 1 | 0) {
        var comment = in_List.get(list, i);
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
      case Skew.SymbolKind.OBJECT_ENUM:
      case Skew.SymbolKind.OBJECT_FLAGS: {
        this._adjustNamespace(symbol);
        this._emitNewlineBeforeSymbol(symbol, Skew.CPlusPlusEmitter.CodeMode.DECLARE);

        if (symbol.kind == Skew.SymbolKind.OBJECT_FLAGS) {
          this._emit(this._indent + 'struct ' + Skew.CPlusPlusEmitter._mangleName(symbol) + ' {\n');
          this._increaseIndent();

          if (!(symbol.variables.length == 0)) {
            this._emit(this._indent + 'enum {\n');
          }
        }

        else {
          this._emit(this._indent + 'enum struct ' + Skew.CPlusPlusEmitter._mangleName(symbol) + ' {\n');
        }

        this._increaseIndent();

        for (var i = 0, list = symbol.variables, count = list.length; i < count; i = i + 1 | 0) {
          var variable = in_List.get(list, i);
          this._emitVariable(variable, Skew.CPlusPlusEmitter.CodeMode.DECLARE);
        }

        this._decreaseIndent();

        if (symbol.kind == Skew.SymbolKind.OBJECT_FLAGS) {
          if (!(symbol.variables.length == 0)) {
            this._emit(this._indent + '};\n');
          }

          this._decreaseIndent();
        }

        this._emit(this._indent + '};\n');
        this._emitNewlineAfterSymbol(symbol);
        break;
      }

      case Skew.SymbolKind.OBJECT_CLASS:
      case Skew.SymbolKind.OBJECT_INTERFACE: {
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
      case Skew.SymbolKind.OBJECT_CLASS:
      case Skew.SymbolKind.OBJECT_INTERFACE: {
        this._adjustNamespace(symbol);
        this._emitNewlineBeforeSymbol(symbol, Skew.CPlusPlusEmitter.CodeMode.DEFINE);
        this._emitComments(symbol.comments);
        this._emitTypeParameters(symbol.parameters);
        this._emit(this._indent + 'struct ' + Skew.CPlusPlusEmitter._mangleName(symbol));

        if (symbol.$extends != null || symbol.$implements != null) {
          this._emit(' : ');

          if (symbol.$extends != null) {
            this._emitExpressionOrType(symbol.$extends, symbol.baseType, Skew.CPlusPlusEmitter.CppEmitMode.BARE);
          }

          if (symbol.$implements != null) {
            for (var i = 0, list = symbol.$implements, count = list.length; i < count; i = i + 1 | 0) {
              var node = in_List.get(list, i);

              if (node != in_List.first(symbol.$implements) || symbol.$extends != null) {
                this._emit(', ');
              }

              this._emitExpressionOrType(node, node.resolvedType, Skew.CPlusPlusEmitter.CppEmitMode.BARE);
            }
          }
        }

        this._emit(' {\n');
        this._increaseIndent();

        for (var i1 = 0, list1 = symbol.functions, count1 = list1.length; i1 < count1; i1 = i1 + 1 | 0) {
          var $function = in_List.get(list1, i1);
          this._emitFunction($function, Skew.CPlusPlusEmitter.CodeMode.DEFINE);
        }

        for (var i2 = 0, list2 = symbol.variables, count2 = list2.length; i2 < count2; i2 = i2 + 1 | 0) {
          var variable = in_List.get(list2, i2);
          this._emitVariable(variable, Skew.CPlusPlusEmitter.CodeMode.DEFINE);
        }

        this._decreaseIndent();
        this._emit(this._indent + '};\n');
        this._emitNewlineAfterSymbol(symbol);
        break;
      }

      case Skew.SymbolKind.OBJECT_NAMESPACE:
      case Skew.SymbolKind.OBJECT_WRAPPED: {
        this._adjustNamespace(symbol);

        for (var i3 = 0, list3 = symbol.functions, count3 = list3.length; i3 < count3; i3 = i3 + 1 | 0) {
          var function1 = in_List.get(list3, i3);
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
      symbol.$this.flags |= Skew.SymbolFlags.IS_EXPORTED;
    }

    this._enclosingFunction = symbol;
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
      if (mode == Skew.CPlusPlusEmitter.CodeMode.DEFINE && (symbol.isVirtual() || block == null)) {
        this._emit('virtual ');
      }

      this._emitExpressionOrType(symbol.returnType, symbol.resolvedType.returnType, Skew.CPlusPlusEmitter.CppEmitMode.DECLARATION);
    }

    if (mode == Skew.CPlusPlusEmitter.CodeMode.IMPLEMENT && parent.kind != Skew.SymbolKind.OBJECT_GLOBAL) {
      this._emit(Skew.CPlusPlusEmitter._fullName(parent));

      if (parent.parameters != null) {
        this._emit('<');

        for (var i = 0, list = parent.parameters, count = list.length; i < count; i = i + 1 | 0) {
          var parameter = in_List.get(list, i);

          if (parameter != in_List.first(parent.parameters)) {
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

      if (block == null) {
        this._emit(' = 0');
      }

      this._emit(';\n');
    }

    this._emitNewlineAfterSymbol(symbol);
    this._enclosingFunction = null;
  };

  Skew.CPlusPlusEmitter.prototype._emitTypeParameters = function(parameters) {
    if (parameters != null) {
      this._emit(this._indent + 'template <');

      for (var i = 0, list = parameters, count = list.length; i < count; i = i + 1 | 0) {
        var parameter = in_List.get(list, i);

        if (parameter != in_List.first(parameters)) {
          this._emit(', ');
        }

        this._emit('typename ' + Skew.CPlusPlusEmitter._mangleName(parameter));
      }

      this._emit('>\n');
    }
  };

  Skew.CPlusPlusEmitter.prototype._emitArgumentList = function(symbol) {
    this._emit('(');

    for (var i = 0, list = symbol.$arguments, count = list.length; i < count; i = i + 1 | 0) {
      var argument = in_List.get(list, i);

      if (argument != in_List.first(symbol.$arguments)) {
        this._emit(', ');
      }

      this._emitExpressionOrType(argument.type, argument.resolvedType, Skew.CPlusPlusEmitter.CppEmitMode.DECLARATION);
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

    if (symbol.kind == Skew.SymbolKind.VARIABLE_ENUM_OR_FLAGS) {
      this._emit(this._indent + Skew.CPlusPlusEmitter._mangleName(symbol) + (' = ' + symbol.value.asInt().toString() + ',\n'));
    }

    else {
      this._emit(this._indent);

      if (mode == Skew.CPlusPlusEmitter.CodeMode.DEFINE && symbol.kind == Skew.SymbolKind.VARIABLE_GLOBAL && symbol.parent.kind == Skew.SymbolKind.OBJECT_CLASS) {
        this._emit('static ');
      }

      this._emitType(symbol.resolvedType, Skew.CPlusPlusEmitter.CppEmitMode.DECLARATION);

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

  Skew.CPlusPlusEmitter.prototype._scanForSwitchBreak = function(node, loop) {
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

  Skew.CPlusPlusEmitter.prototype._emitStatement = function(node) {
    if (Skew.in_NodeKind.isLoop(node.kind)) {
      this._scanForSwitchBreak(node, node);
    }

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
        var label = in_IntMap.get(this._loopLabels, node.id, null);

        if (label != null) {
          this._emit(this._indent + 'goto ' + Skew.CPlusPlusEmitter._mangleName(label) + ';\n');
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
            this._emitType(setup.firstChild().symbol.asVariableSymbol().resolvedType, Skew.CPlusPlusEmitter.CppEmitMode.DECLARATION);

            for (var child2 = setup.firstChild(); child2 != null; child2 = child2.nextSibling()) {
              var symbol = child2.symbol.asVariableSymbol();
              assert(child2.kind == Skew.NodeKind.VARIABLE);

              if (child2.previousSibling() != null) {
                this._emit(', ');

                if (this._isReferenceType(symbol.resolvedType)) {
                  this._emit('*');
                }
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
            this._emitType(child3.symbol.resolvedType, Skew.CPlusPlusEmitter.CppEmitMode.DECLARATION);
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
        this._emitType(symbol1.resolvedType, Skew.CPlusPlusEmitter.CppEmitMode.DECLARATION);
        this._emit(Skew.CPlusPlusEmitter._mangleName(symbol1) + ' : ');

        if (this._isReferenceType(value2.resolvedType)) {
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

    if (Skew.in_NodeKind.isLoop(node.kind)) {
      var label1 = in_IntMap.get(this._loopLabels, node.id, null);

      if (label1 != null) {
        this._emit(this._indent + Skew.CPlusPlusEmitter._mangleName(label1) + (node.nextSibling() != null ? ':\n' : ':;\n'));
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
        var value = Skew.in_Content.asDouble(content);

        if (!isFinite(value)) {
          this._includeNames['<math.h>'] = 0;
        }

        this._emit(isNaN(value) ? 'NAN' : value == 1 / 0 ? 'INFINITY' : value == -(1 / 0) ? '-INFINITY' : Skew.doubleToStringWithDot(value));
        break;
      }

      case Skew.ContentKind.STRING: {
        this._emit(Skew.quoteString(Skew.in_Content.asString(content), Skew.QuoteStyle.DOUBLE, Skew.QuoteOctal.OCTAL_WORKAROUND) + '_s');
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
        this._emitType(node.resolvedType, Skew.CPlusPlusEmitter.CppEmitMode.BARE);
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
        this._emit((type != null && this._isReferenceType(type) ? '->' : '.') + (symbol != null ? Skew.CPlusPlusEmitter._mangleName(symbol) : node.asString()));
        break;
      }

      case Skew.NodeKind.CONSTANT: {
        if (node.resolvedType.isEnumOrFlags()) {
          this._emit('(');
          this._emitType(node.resolvedType, Skew.CPlusPlusEmitter.CppEmitMode.NORMAL);
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
          this._emitType(node.resolvedType, Skew.CPlusPlusEmitter.CppEmitMode.BARE);
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
        var resolvedType = node.resolvedType;
        var type1 = node.castType();
        var value1 = node.castValue();

        if (value1.kind == Skew.NodeKind.NULL && node.resolvedType == this._cache.stringType) {
          this._emit('string()');
        }

        else if (type1.kind == Skew.NodeKind.TYPE && type1.resolvedType == Skew.Type.DYNAMIC) {
          this._emitExpression(value1, precedence);
        }

        // Automatically promote integer literals to doubles instead of using a cast
        else if (this._cache.isEquivalentToDouble(resolvedType) && value1.isInt()) {
          this._emitExpression(this._cache.createDouble(value1.asInt()), precedence);
        }

        // Only emit a cast if the underlying types are different
        else if (this._unwrappedType(value1.resolvedType) != this._unwrappedType(type1.resolvedType) || type1.resolvedType == Skew.Type.DYNAMIC) {
          if (Skew.Precedence.UNARY_POSTFIX < precedence) {
            this._emit('(');
          }

          this._emit('(');
          this._emitExpressionOrType(type1, resolvedType, Skew.CPlusPlusEmitter.CppEmitMode.NORMAL);
          this._emit(')');
          this._emitExpression(value1, Skew.Precedence.UNARY_POSTFIX);

          if (Skew.Precedence.UNARY_POSTFIX < precedence) {
            this._emit(')');
          }
        }

        // Otherwise, pretend the cast isn't there
        else {
          this._emitExpression(value1, precedence);
        }
        break;
      }

      case Skew.NodeKind.INDEX: {
        var left = node.indexLeft();

        if (this._isReferenceType(left.resolvedType)) {
          this._emit('(*');
          this._emitExpression(left, Skew.Precedence.UNARY_PREFIX);
          this._emit(')');
        }

        else {
          this._emitExpression(left, Skew.Precedence.UNARY_POSTFIX);
        }

        this._emit('[');
        this._emitExpression(node.indexRight(), Skew.Precedence.LOWEST);
        this._emit(']');
        break;
      }

      case Skew.NodeKind.ASSIGN_INDEX: {
        var left1 = node.assignIndexLeft();

        if (Skew.Precedence.ASSIGN < precedence) {
          this._emit('(');
        }

        if (this._isReferenceType(left1.resolvedType)) {
          this._emit('(*');
          this._emitExpression(left1, Skew.Precedence.UNARY_PREFIX);
          this._emit(')');
        }

        else {
          this._emitExpression(left1, Skew.Precedence.UNARY_POSTFIX);
        }

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
          this._emitType(node.resolvedType, Skew.CPlusPlusEmitter.CppEmitMode.NORMAL);
        }

        else {
          this._emitExpression(value2, precedence);
          this._emit('<');

          for (var child = value2.nextSibling(); child != null; child = child.nextSibling()) {
            if (child.previousSibling() != value2) {
              this._emit(', ');
            }

            this._emitExpressionOrType(child, child.resolvedType, Skew.CPlusPlusEmitter.CppEmitMode.NORMAL);
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

      case Skew.NodeKind.INITIALIZER_LIST:
      case Skew.NodeKind.INITIALIZER_MAP: {
        this._emit('new ');
        this._emitType(node.resolvedType, Skew.CPlusPlusEmitter.CppEmitMode.BARE);

        if (node.hasChildren()) {
          this._emit('({');
          this._emitCommaSeparatedExpressions(node.firstChild(), null);
          this._emit('})');
        }

        else {
          this._emit('()');
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
      case Skew.NodeKind.NEGATIVE:
      case Skew.NodeKind.NOT:
      case Skew.NodeKind.POSITIVE:
      case Skew.NodeKind.POSTFIX_DECREMENT:
      case Skew.NodeKind.POSTFIX_INCREMENT:
      case Skew.NodeKind.PREFIX_DECREMENT:
      case Skew.NodeKind.PREFIX_INCREMENT: {
        var value3 = node.unaryValue();
        var info = in_IntMap.get1(Skew.operatorInfo, kind);

        if (info.precedence < precedence) {
          this._emit('(');
        }

        if (!Skew.in_NodeKind.isUnaryPostfix(kind)) {
          this._emit(info.text);
        }

        this._emitExpression(value3, info.precedence);

        if (Skew.in_NodeKind.isUnaryPostfix(kind)) {
          this._emit(info.text);
        }

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

          var info1 = in_IntMap.get1(Skew.operatorInfo, kind);

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

  Skew.CPlusPlusEmitter.prototype._emitExpressionOrType = function(node, type, mode) {
    if (node != null && (type == null || type == Skew.Type.DYNAMIC)) {
      this._emitExpression(node, Skew.Precedence.LOWEST);

      if (mode == Skew.CPlusPlusEmitter.CppEmitMode.DECLARATION) {
        this._emit(' ');
      }
    }

    else {
      this._emitType(type, mode);
    }
  };

  Skew.CPlusPlusEmitter.prototype._emitType = function(type, mode) {
    if (type == null) {
      this._emit('void');
    }

    else {
      type = this._unwrappedType(type);

      if (type == Skew.Type.DYNAMIC) {
        this._emit('void');
      }

      else if (type.kind == Skew.TypeKind.LAMBDA) {
        var hasReturnType = type.returnType != null;
        var argumentCount = type.argumentTypes.length;
        this._emit((hasReturnType ? 'Fn' : 'FnVoid') + argumentCount.toString());

        if (hasReturnType || argumentCount != 0) {
          this._emit('<');

          if (hasReturnType) {
            this._emitType(type.returnType, Skew.CPlusPlusEmitter.CppEmitMode.NORMAL);
          }

          for (var i = 0, count = argumentCount; i < count; i = i + 1 | 0) {
            if (i != 0 || hasReturnType) {
              this._emit(', ');
            }

            this._emitType(in_List.get(type.argumentTypes, i), Skew.CPlusPlusEmitter.CppEmitMode.NORMAL);
          }

          this._emit('>');
        }
      }

      else {
        assert(type.kind == Skew.TypeKind.SYMBOL);
        this._handleSymbol(type.symbol);
        this._emit(Skew.CPlusPlusEmitter._fullName(type.symbol));

        if (type.isParameterized()) {
          this._emit('<');

          for (var i1 = 0, count1 = type.substitutions.length; i1 < count1; i1 = i1 + 1 | 0) {
            if (i1 != 0) {
              this._emit(', ');
            }

            this._emitType(in_List.get(type.substitutions, i1), Skew.CPlusPlusEmitter.CppEmitMode.NORMAL);
          }

          this._emit('>');
        }
      }
    }

    if (type != null && this._isReferenceType(type) && mode != Skew.CPlusPlusEmitter.CppEmitMode.BARE) {
      this._emit(' *');
    }

    else if (mode == Skew.CPlusPlusEmitter.CppEmitMode.DECLARATION) {
      this._emit(' ');
    }
  };

  Skew.CPlusPlusEmitter.prototype._unwrappedType = function(type) {
    return type.isFlags() ? this._cache.intType : this._cache.unwrappedType(type);
  };

  Skew.CPlusPlusEmitter.prototype._isReferenceType = function(type) {
    return type.isReference() && type != this._cache.stringType;
  };

  Skew.CPlusPlusEmitter.prototype._finalizeEmittedFile = function() {
    var includes = Object.keys(this._includeNames);

    if (!(includes.length == 0)) {
      // Sort so the order is deterministic
      includes.sort(Skew.SORT_STRINGS);

      for (var i = 0, list = includes, count = list.length; i < count; i = i + 1 | 0) {
        var include = in_List.get(list, i);
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
        for (var i = 0, list = symbol.annotations, count = list.length; i < count; i = i + 1 | 0) {
          var annotation = in_List.get(list, i);

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
    symbol = symbol.forwarded();

    if (symbol.kind == Skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
      return Skew.CPlusPlusEmitter._mangleName(symbol.parent);
    }

    if (!symbol.isImportedOrExported() && symbol.name in Skew.CPlusPlusEmitter._isKeyword) {
      return '_' + symbol.name;
    }

    return symbol.name;
  };

  Skew.CPlusPlusEmitter.CppEmitMode = {
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

  Skew.QuoteOctal = {
    NORMAL: 0,
    OCTAL_WORKAROUND: 1
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
    NULL_JOIN: 3,
    LOGICAL_OR: 4,
    LOGICAL_AND: 5,
    BITWISE_OR: 6,
    BITWISE_XOR: 7,
    BITWISE_AND: 8,
    EQUAL: 9,
    COMPARE: 10,
    SHIFT: 11,
    ADD: 12,
    MULTIPLY: 13,
    UNARY_PREFIX: 14,
    UNARY_POSTFIX: 15,
    MEMBER: 16
  };

  Skew.JavaScriptEmitter = function(_context, _options, _cache) {
    Skew.Emitter.call(this);
    this._context = _context;
    this._options = _options;
    this._cache = _cache;
    this._isSpecialVariableNeeded = {};
    this._loopLabels = {};
    this._specialVariables = {};
    this._allSpecialVariables = null;
    this._enclosingFunction = null;
    this._enclosingLoop = null;
    this._namespacePrefix = '';
    this._previousNode = null;
    this._previousSymbol = null;
    this._parenthesizeInExpressions = 0;
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
    this._previousCodeUnit = 0;
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
    for (var i = 0, list = global.variables, count = list.length; i < count; i = i + 1 | 0) {
      var variable = in_List.get(list, i);
      var special = in_StringMap.get(Skew.JavaScriptEmitter._specialVariableMap, variable.name, Skew.JavaScriptEmitter.SpecialVariable.NONE);

      if (special != Skew.JavaScriptEmitter.SpecialVariable.NONE) {
        this._specialVariables[special] = variable;
      }
    }

    assert(Skew.JavaScriptEmitter.SpecialVariable.AS_STRING in this._specialVariables);
    assert(Skew.JavaScriptEmitter.SpecialVariable.EXTENDS in this._specialVariables);
    assert(Skew.JavaScriptEmitter.SpecialVariable.IS_BOOL in this._specialVariables);
    assert(Skew.JavaScriptEmitter.SpecialVariable.IS_DOUBLE in this._specialVariables);
    assert(Skew.JavaScriptEmitter.SpecialVariable.IS_INT in this._specialVariables);
    assert(Skew.JavaScriptEmitter.SpecialVariable.IS_STRING in this._specialVariables);
    assert(Skew.JavaScriptEmitter.SpecialVariable.MULTIPLY in this._specialVariables);
    assert(Skew.JavaScriptEmitter.SpecialVariable.PROTOTYPE in this._specialVariables);

    // The prototype cache doesn't need to be initialized
    in_IntMap.get1(this._specialVariables, Skew.JavaScriptEmitter.SpecialVariable.PROTOTYPE).value = null;

    // Sort these so their order is deterministic
    this._allSpecialVariables = in_IntMap.values(this._specialVariables);
    this._allSpecialVariables.sort(Skew.Symbol.SORT_VARIABLES_BY_ID);

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
    for (var i1 = 0, list1 = this._allSpecialVariables, count1 = list1.length; i1 < count1; i1 = i1 + 1 | 0) {
      var variable1 = in_List.get(list1, i1);

      if (variable1.id in this._isSpecialVariableNeeded) {
        if (variable1.value != null && variable1.value.kind == Skew.NodeKind.LAMBDA) {
          this._emitFunction(this._convertLambdaToFunction(variable1));
        }

        else {
          this._emitVariable(variable1);
        }
      }
    }

    // Emit objects and functions
    for (var i2 = 0, list2 = objects, count2 = list2.length; i2 < count2; i2 = i2 + 1 | 0) {
      var object = in_List.get(list2, i2);
      this._emitObject(object);
    }

    // Emit variables
    var statement = new Skew.Node(Skew.NodeKind.VARIABLES);

    for (var i4 = 0, list4 = objects, count4 = list4.length; i4 < count4; i4 = i4 + 1 | 0) {
      var object1 = in_List.get(list4, i4);
      this._namespacePrefix = '';

      for (var o = object1; o.kind != Skew.SymbolKind.OBJECT_GLOBAL; o = o.parent.asObjectSymbol()) {
        this._namespacePrefix = Skew.JavaScriptEmitter._mangleName(o) + '.' + this._namespacePrefix;
      }

      for (var i3 = 0, list3 = object1.variables, count3 = list3.length; i3 < count3; i3 = i3 + 1 | 0) {
        var variable2 = in_List.get(list3, i3);

        if (!(this._allSpecialVariables.indexOf(variable2) != -1)) {
          if (this._mangle && this._namespacePrefix == '' && !variable2.isImportedOrExported()) {
            statement.appendChild(Skew.Node.createVariable(variable2));
          }

          else {
            this._emitVariable(variable2);
          }
        }
      }
    }

    this._namespacePrefix = '';

    // Group adjacent variables into a single statement during mangling
    if (statement.hasChildren()) {
      this._emitNewlineBeforeSymbol(statement.firstChild().symbol);
      this._emitStatement(statement);
      this._emitNewlineAfterSymbol(statement.firstChild().symbol);

      for (var child = statement.firstChild(); child != null; child = child.nextSibling()) {
        child.removeChildren();
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
      var n = text.length;

      for (var i = 0, count = n; i < count; i = i + 1 | 0) {
        if (in_string.get1(text, i) == 10) {
          this._currentColumn = 0;
          this._currentLine = this._currentLine + 1 | 0;
        }

        else {
          this._currentColumn = this._currentColumn + 1 | 0;
        }
      }

      if (n != 0) {
        this._previousCodeUnit = in_string.get1(text, n - 1 | 0);
      }
    }

    this._code.append(text);
  };

  Skew.JavaScriptEmitter.prototype._liftGlobals1 = function(global) {
    var globalObjects = [];
    var globalFunctions = [];
    var globalVariables = [];
    this._liftGlobals2(global, globalObjects, globalFunctions, globalVariables);

    for (var i = 0, list = globalObjects, count = list.length; i < count; i = i + 1 | 0) {
      var object = in_List.get(list, i);
      object.parent = global;
    }

    for (var i1 = 0, list1 = globalFunctions, count1 = list1.length; i1 < count1; i1 = i1 + 1 | 0) {
      var $function = in_List.get(list1, i1);
      $function.parent = global;
    }

    for (var i2 = 0, list2 = globalVariables, count2 = list2.length; i2 < count2; i2 = i2 + 1 | 0) {
      var variable = in_List.get(list2, i2);
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
    for (var i = 0, list = symbol.objects, count = list.length; i < count; i = i + 1 | 0) {
      var object = in_List.get(list, i);
      this._collectInlineableFunctions(object, listAppends, mapInserts);
    }

    for (var i3 = 0, list3 = symbol.functions, count3 = list3.length; i3 < count3; i3 = i3 + 1 | 0) {
      var $function = in_List.get(list3, i3);

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

          if (call.hasTwoChildren() && callValue.kind == Skew.NodeKind.DOT && callValue.asString() == 'push' && Skew.JavaScriptEmitter._isReferenceTo(callValue.dotTarget(), in_List.get($arguments, 0)) && Skew.JavaScriptEmitter._isReferenceTo(call.lastChild(), in_List.get($arguments, 1)) && Skew.JavaScriptEmitter._isReferenceTo(second.returnValue(), in_List.get($arguments, 0))) {
            for (var i1 = 0, list1 = this._context.callGraph.callInfoForSymbol($function).callSites, count1 = list1.length; i1 < count1; i1 = i1 + 1 | 0) {
              var callSite = in_List.get(list1, i1);

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
        var keyType = in_List.get($arguments, 1).resolvedType;
        var first1 = $function.block.firstChild();
        var second1 = $function.block.lastChild();

        if ((keyType == Skew.Type.DYNAMIC || this._cache.isEquivalentToInt(keyType) || this._cache.isEquivalentToString(keyType)) && first1.kind == Skew.NodeKind.EXPRESSION && first1.expressionValue().kind == Skew.NodeKind.ASSIGN_INDEX && second1.kind == Skew.NodeKind.RETURN && second1.returnValue() != null) {
          var assign = first1.expressionValue();

          if (Skew.JavaScriptEmitter._isReferenceTo(assign.assignIndexLeft(), in_List.get($arguments, 0)) && Skew.JavaScriptEmitter._isReferenceTo(assign.assignIndexCenter(), in_List.get($arguments, 1)) && Skew.JavaScriptEmitter._isReferenceTo(assign.assignIndexRight(), in_List.get($arguments, 2)) && Skew.JavaScriptEmitter._isReferenceTo(second1.returnValue(), in_List.get($arguments, 0))) {
            for (var i2 = 0, list2 = this._context.callGraph.callInfoForSymbol($function).callSites, count2 = list2.length; i2 < count2; i2 = i2 + 1 | 0) {
              var callSite1 = in_List.get(list2, i2);

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

      for (var i = 0, count = listAppends.length; i < count; i = i + 1 | 0) {
        var node = in_List.get(listAppends, i);

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
          in_List.set(listAppends, i, null);
          changed = true;
        }
      }
    }

    // Map insert fixed point
    changed = true;

    while (changed) {
      changed = false;

      for (var i1 = 0, count1 = mapInserts.length; i1 < count1; i1 = i1 + 1 | 0) {
        var node1 = in_List.get(mapInserts, i1);

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
          node1.become(firstArgument1.remove().appendChild(Skew.Node.createPair(secondArgument1.remove(), thirdArgument.remove()).withType(Skew.Type.DYNAMIC)));
          in_List.set(mapInserts, i1, null);
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
    for (var i = 0, list = this._allSpecialVariables, count = list.length; i < count; i = i + 1 | 0) {
      var variable = in_List.get(list, i);

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

    for (var i = 0, list = symbol.objects, count = list.length; i < count; i = i + 1 | 0) {
      var object = in_List.get(list, i);
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

        for (var i = 0, list = symbol.asFunctionSymbol().$arguments, count = list.length; i < count; i = i + 1 | 0) {
          var argument = in_List.get(list, i);
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

    for (var i = 0, list = this._allSymbols, count1 = list.length; i < count1; i = i + 1 | 0) {
      var symbol = in_List.get(list, i);

      if (Skew.in_SymbolKind.isFunction(symbol.kind)) {
        var $function = symbol.asFunctionSymbol();
        assert($function.id in this._namingGroupIndexForSymbol);
        var id = in_IntMap.get(namingGroupMap, $function.namingGroup, -1);

        if (id == -1) {
          namingGroupMap[$function.namingGroup] = in_IntMap.get1(this._namingGroupIndexForSymbol, $function.id);
        }

        else {
          namingGroupsUnionFind.union(id, in_IntMap.get1(this._namingGroupIndexForSymbol, $function.id));
        }
      }
    }

    // Collect all reserved names together into one big set for querying
    var reservedNames = in_StringMap.clone(Skew.JavaScriptEmitter._isKeyword);

    for (var i1 = 0, list1 = this._allSymbols, count2 = list1.length; i1 < count2; i1 = i1 + 1 | 0) {
      var symbol1 = in_List.get(list1, i1);

      if (!Skew.JavaScriptEmitter._shouldRenameSymbol(symbol1)) {
        reservedNames[symbol1.name] = 0;
      }
    }

    // Everything that should have the same name is now grouped together.
    // Generate and assign names to all internal symbols, but use shorter
    // names for more frequently used symbols.
    var sortedGroups = [];

    for (var i3 = 0, list2 = this._extractGroups(namingGroupsUnionFind, Skew.JavaScriptEmitter.ExtractGroupsMode.ALL_SYMBOLS), count4 = list2.length; i3 < count4; i3 = i3 + 1 | 0) {
      var group = in_List.get(list2, i3);
      var count = 0;

      for (var i2 = 0, count3 = group.length; i2 < count3; i2 = i2 + 1 | 0) {
        var symbol2 = in_List.get(group, i2);

        if (Skew.JavaScriptEmitter._shouldRenameSymbol(symbol2)) {
          count = count + in_IntMap.get(this._symbolCounts, symbol2.id, 0) | 0;
        }
      }

      sortedGroups.push(new Skew.JavaScriptEmitter.SymbolGroup(group, count));
    }

    // Create a total order to make builds deterministic when maps use hashing
    sortedGroups.sort(function(a, b) {
      var difference = in_int.compare(b.count, a.count);

      if (difference == 0) {
        difference = in_int.compare(b.symbols.length, a.symbols.length);

        for (var i = 0; difference == 0 && i < a.symbols.length; i = i + 1 | 0) {
          difference = in_int.compare(in_List.get(a.symbols, i).id, in_List.get(b.symbols, i).id);
        }
      }

      return difference;
    });

    for (var i5 = 0, list4 = sortedGroups, count6 = list4.length; i5 < count6; i5 = i5 + 1 | 0) {
      var group1 = in_List.get(list4, i5);
      var name = '';

      for (var i4 = 0, list3 = group1.symbols, count5 = list3.length; i4 < count5; i4 = i4 + 1 | 0) {
        var symbol3 = in_List.get(list3, i4);

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

    for (var i = 0, count1 = this._allSymbols.length; i < count1; i = i + 1 | 0) {
      var symbol = in_List.get(this._allSymbols, i);

      if (symbol.kind == Skew.SymbolKind.OBJECT_CLASS) {
        var baseClass = symbol.asObjectSymbol().baseClass;

        if (baseClass != null) {
          relatedTypesUnionFind.union(i, in_IntMap.get1(this._namingGroupIndexForSymbol, baseClass.id));
        }

        for (var i1 = 0, list = symbol.asObjectSymbol().variables, count = list.length; i1 < count; i1 = i1 + 1 | 0) {
          var variable = in_List.get(list, i1);
          relatedTypesUnionFind.union(i, in_IntMap.get1(this._namingGroupIndexForSymbol, variable.id));
        }
      }
    }

    this._zipTogetherInOrder(unionFind, order, this._extractGroups(relatedTypesUnionFind, Skew.JavaScriptEmitter.ExtractGroupsMode.ONLY_INSTANCE_VARIABLES));
  };

  Skew.JavaScriptEmitter.prototype._zipTogetherInOrder = function(unionFind, order, groups) {
    for (var i1 = 0, list = groups, count1 = list.length; i1 < count1; i1 = i1 + 1 | 0) {
      var group = in_List.get(list, i1);

      for (var i = 0, count = group.length; i < count; i = i + 1 | 0) {
        var symbol = in_List.get(group, i);
        var index = in_IntMap.get1(this._namingGroupIndexForSymbol, symbol.id);

        if (i >= order.length) {
          order.push(index);
        }

        else {
          unionFind.union(index, in_List.get(order, i));
        }
      }
    }
  };

  Skew.JavaScriptEmitter.prototype._generateSymbolName = function(reservedNames) {
    while (true) {
      var name = Skew.JavaScriptEmitter._numberToName(this._nextSymbolName);
      this._nextSymbolName = this._nextSymbolName + 1 | 0;

      if (!(name in reservedNames)) {
        return name;
      }
    }
  };

  Skew.JavaScriptEmitter.prototype._extractGroups = function(unionFind, mode) {
    var labelToGroup = {};

    for (var i = 0, list = this._allSymbols, count = list.length; i < count; i = i + 1 | 0) {
      var symbol = in_List.get(list, i);

      if (mode == Skew.JavaScriptEmitter.ExtractGroupsMode.ONLY_LOCAL_VARIABLES && !Skew.in_SymbolKind.isLocalOrArgumentVariable(symbol.kind) || mode == Skew.JavaScriptEmitter.ExtractGroupsMode.ONLY_INSTANCE_VARIABLES && symbol.kind != Skew.SymbolKind.VARIABLE_INSTANCE) {
        continue;
      }

      assert(symbol.id in this._namingGroupIndexForSymbol);
      var label = unionFind.find(in_IntMap.get1(this._namingGroupIndexForSymbol, symbol.id));
      var group = in_IntMap.get(labelToGroup, label, null);

      if (group == null) {
        group = [];
        labelToGroup[label] = group;
      }

      group.push(symbol);
    }

    // Sort each resulting group to make builds deterministic when maps use hashing
    var groups = in_IntMap.values(labelToGroup);

    for (var i1 = 0, list1 = groups, count1 = list1.length; i1 < count1; i1 = i1 + 1 | 0) {
      var group1 = in_List.get(list1, i1);
      group1.sort(Skew.Symbol.SORT_BY_ID);
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

    if (!this._minify && this._previousSymbol != null && (!Skew.in_SymbolKind.isObject(this._previousSymbol.kind) || !Skew.in_SymbolKind.isObject(symbol.kind) || symbol.comments != null || Skew.in_SymbolKind.isEnumOrFlags(this._previousSymbol.kind) || Skew.in_SymbolKind.isEnumOrFlags(symbol.kind)) && (!Skew.in_SymbolKind.isVariable(this._previousSymbol.kind) || !Skew.in_SymbolKind.isVariable(symbol.kind) || symbol.comments != null)) {
      this._emit('\n');
    }

    this._previousSymbol = null;
    this._addMapping(symbol.range);
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
      for (var i = 0, list = comments, count = list.length; i < count; i = i + 1 | 0) {
        var comment = in_List.get(list, i);
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
          this._emitNewlineBeforeSymbol(symbol);
          this._emitComments(symbol.comments);
          this._emit(this._indent + (this._namespacePrefix == '' && !symbol.isExported() ? 'var ' : this._namespacePrefix) + Skew.JavaScriptEmitter._mangleName(symbol) + this._space + '=' + this._space + '{}');
          this._emitSemicolonAfterStatement();
          this._emitNewlineAfterSymbol(symbol);
        }
        break;
      }

      case Skew.SymbolKind.OBJECT_ENUM:
      case Skew.SymbolKind.OBJECT_FLAGS: {
        this._emitNewlineBeforeSymbol(symbol);
        this._emitComments(symbol.comments);
        this._emit(this._indent + (this._namespacePrefix == '' && !symbol.isExported() ? 'var ' : this._namespacePrefix) + Skew.JavaScriptEmitter._mangleName(symbol) + this._space + '=' + this._space + '{');
        this._increaseIndent();
        var isFirst = true;

        for (var i = 0, list = symbol.variables, count = list.length; i < count; i = i + 1 | 0) {
          var variable = in_List.get(list, i);

          if (variable.kind == Skew.SymbolKind.VARIABLE_ENUM_OR_FLAGS) {
            if (isFirst) {
              isFirst = false;
            }

            else {
              this._emit(',');
            }

            this._emit(this._newline);
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
        var variable1 = in_IntMap.get1(this._specialVariables, Skew.JavaScriptEmitter.SpecialVariable.EXTENDS);

        for (var i1 = 0, list1 = symbol.functions, count1 = list1.length; i1 < count1; i1 = i1 + 1 | 0) {
          var $function = in_List.get(list1, i1);

          if ($function.isPrimaryConstructor()) {
            if ($function.comments == null && symbol.comments != null) {
              $function.comments = symbol.comments;
            }

            this._emitFunction($function);

            if (symbol.baseClass != null || symbol.kind == Skew.SymbolKind.OBJECT_CLASS && symbol.$extends != null) {
              if (!this._minify) {
                this._emit('\n' + this._indent);
              }

              this._emitSemicolonIfNeeded();
              this._addMapping(variable1.range);
              this._emit(Skew.JavaScriptEmitter._mangleName(variable1) + '(' + Skew.JavaScriptEmitter._fullName(symbol) + ',' + this._space);

              if (symbol.baseClass != null) {
                this._emit(Skew.JavaScriptEmitter._fullName(symbol.baseClass));
              }

              else {
                assert(symbol.kind == Skew.SymbolKind.OBJECT_CLASS && symbol.$extends != null);
                this._emitExpression(symbol.$extends, Skew.Precedence.LOWEST);
              }

              this._emit(')');
              this._emitSemicolonAfterStatement();
            }

            foundPrimaryConstructor = true;
            break;
          }
        }

        // Emit a namespace if the class is never constructed
        if (!foundPrimaryConstructor) {
          this._emitNewlineBeforeSymbol(symbol);
          this._emit(this._indent + (this._namespacePrefix == '' && !symbol.isExported() ? 'var ' : this._namespacePrefix) + Skew.JavaScriptEmitter._mangleName(symbol) + this._space + '=' + this._space + '{}');
          this._emitSemicolonAfterStatement();
        }
        break;
      }
    }

    if (symbol.kind != Skew.SymbolKind.OBJECT_GLOBAL) {
      this._namespacePrefix += Skew.JavaScriptEmitter._mangleName(symbol) + '.';
    }

    if (symbol.usePrototypeCache()) {
      this._emitSemicolonIfNeeded();
      this._emit(this._newline + this._indent + Skew.JavaScriptEmitter._mangleName(in_IntMap.get1(this._specialVariables, Skew.JavaScriptEmitter.SpecialVariable.PROTOTYPE)) + this._space + '=' + this._space + Skew.JavaScriptEmitter._fullName(symbol) + '.prototype');
      this._emitSemicolonAfterStatement();
    }

    // Ignore instance functions if the class is never constructed
    for (var i2 = 0, list2 = symbol.functions, count2 = list2.length; i2 < count2; i2 = i2 + 1 | 0) {
      var function1 = in_List.get(list2, i2);

      if (foundPrimaryConstructor ? !function1.isPrimaryConstructor() : function1.kind == Skew.SymbolKind.FUNCTION_GLOBAL) {
        this._emitFunction(function1);
      }
    }
  };

  Skew.JavaScriptEmitter.prototype._emitArgumentList = function($arguments) {
    for (var i = 0, list = $arguments, count = list.length; i < count; i = i + 1 | 0) {
      var argument = in_List.get(list, i);

      if (argument != in_List.first($arguments)) {
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

    this._emitNewlineBeforeSymbol(symbol);
    this._emitComments(symbol.comments);
    var isExpression = this._namespacePrefix != '' || symbol.isExported();
    var name = Skew.JavaScriptEmitter._mangleName(symbol.isPrimaryConstructor() ? symbol.parent : symbol);

    if (isExpression) {
      this._emit(this._indent + (symbol.kind != Skew.SymbolKind.FUNCTION_INSTANCE ? this._namespacePrefix : symbol.parent.usePrototypeCache() ? Skew.JavaScriptEmitter._mangleName(in_IntMap.get1(this._specialVariables, Skew.JavaScriptEmitter.SpecialVariable.PROTOTYPE)) + '.' : this._namespacePrefix + 'prototype.') + name + this._space + '=' + this._space + 'function(');
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

    // Secondary constructors need the same prototype as the primary constructor
    if (symbol.kind == Skew.SymbolKind.FUNCTION_CONSTRUCTOR && !symbol.isPrimaryConstructor()) {
      this._emitSemicolonIfNeeded();
      this._emit(this._newline + this._indent + Skew.JavaScriptEmitter._fullName(symbol) + '.prototype' + this._space + '=' + this._space + (symbol.parent.usePrototypeCache() ? Skew.JavaScriptEmitter._mangleName(in_IntMap.get1(this._specialVariables, Skew.JavaScriptEmitter.SpecialVariable.PROTOTYPE)) : Skew.JavaScriptEmitter._fullName(symbol.parent) + '.prototype'));
      this._emitSemicolonAfterStatement();
    }
  };

  Skew.JavaScriptEmitter.prototype._emitVariable = function(symbol) {
    if (symbol.isImported()) {
      return;
    }

    if (symbol.kind != Skew.SymbolKind.VARIABLE_INSTANCE && symbol.kind != Skew.SymbolKind.VARIABLE_ENUM_OR_FLAGS && (symbol.value != null || this._namespacePrefix == '' || Skew.in_SymbolKind.isLocalOrArgumentVariable(symbol.kind))) {
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
    return Skew.in_NodeKind.isUnary(kind) && !Skew.in_NodeKind.isUnaryPostfix(kind) || node.isString() || node.isNumberLessThanZero() || Skew.in_NodeKind.isInitializer(kind) || (kind == Skew.NodeKind.HOOK || kind == Skew.NodeKind.SEQUENCE) && this._canRemoveSpaceBeforeKeyword(node.firstChild());
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
          this._parenthesizeInExpressions = this._parenthesizeInExpressions + 1 | 0;

          if (setup.kind == Skew.NodeKind.VARIABLES) {
            this._emitVariables(setup);
          }

          else {
            this._emitExpression(setup, Skew.Precedence.LOWEST);
          }

          this._parenthesizeInExpressions = this._parenthesizeInExpressions - 1 | 0;
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
        var value = Skew.in_Content.asDouble(content);
        var text = isNaN(value) ? 'NaN' : value == 1 / 0 ? 'Infinity' : value == -(1 / 0) ? '-Infinity' : TARGET == Target.CSHARP ? value.toString().toLowerCase() : value.toString();

        // "0.123" => ".123"
        // "-0.123" => "-.123"
        if (this._minify) {
          if (in_string.startsWith(text, '0.') && text != '0.') {
            text = in_string.slice1(text, 1);
          }

          else if (in_string.startsWith(text, '-0.') && text != '-0.') {
            text = '-' + in_string.slice1(text, 2);
          }
        }

        this._emit(text);
        break;
      }

      case Skew.ContentKind.STRING: {
        this._emit(Skew.quoteString(Skew.in_Content.asString(content), Skew.QuoteStyle.SHORTEST, Skew.QuoteOctal.OCTAL_WORKAROUND));
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
        var wrap = precedence == Skew.Precedence.MEMBER && (node.isInt() || node.isDouble() && (isFinite(node.asDouble()) || node.asDouble() < 0));

        if (wrap) {
          this._emit('(');
        }

        // Prevent "x - -1" from becoming "x--1"
        if (this._minify && node.isNumberLessThanZero() && this._previousCodeUnit == 45) {
          this._emit(' ');
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
        var isKeyword = value.kind == Skew.NodeKind.NAME && value.symbol == null && value.asString() in Skew.JavaScriptEmitter._keywordCallMap;
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
      case Skew.NodeKind.NEGATIVE:
      case Skew.NodeKind.NOT:
      case Skew.NodeKind.POSITIVE:
      case Skew.NodeKind.POSTFIX_DECREMENT:
      case Skew.NodeKind.POSTFIX_INCREMENT:
      case Skew.NodeKind.PREFIX_DECREMENT:
      case Skew.NodeKind.PREFIX_INCREMENT: {
        var value1 = node.unaryValue();
        var info = in_IntMap.get1(Skew.operatorInfo, kind);

        if (info.precedence < precedence) {
          this._emit('(');
        }

        if (Skew.in_NodeKind.isUnaryPostfix(kind)) {
          this._emitExpression(value1, info.precedence);
          this._emit(info.text);
        }

        else {
          // Prevent "x - -1" from becoming "x--1"
          if (this._minify && (kind == Skew.NodeKind.POSITIVE || kind == Skew.NodeKind.NEGATIVE || kind == Skew.NodeKind.PREFIX_INCREMENT || kind == Skew.NodeKind.PREFIX_DECREMENT) && in_string.get1(info.text, 0) == this._previousCodeUnit) {
            this._emit(' ');
          }

          this._emit(info.text);
          this._emitExpression(value1, info.precedence);
        }

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
          var info1 = in_IntMap.get1(Skew.operatorInfo, kind);
          var left = node.binaryLeft();
          var right = node.binaryRight();
          var extraEquals = left.resolvedType == Skew.Type.DYNAMIC || right.resolvedType == Skew.Type.DYNAMIC ? '=' : '';
          var needsParentheses = info1.precedence < precedence || kind == Skew.NodeKind.IN && this._parenthesizeInExpressions != 0;

          if (needsParentheses) {
            this._emit('(');
          }

          this._emitExpression(node.binaryLeft(), info1.precedence + (info1.associativity == Skew.Associativity.RIGHT | 0) | 0);

          // Always emit spaces around keyword operators, even when minifying
          this._emit(kind == Skew.NodeKind.IN ? (left.isString() ? this._space : ' ') + 'in ' : this._space + (kind == Skew.NodeKind.EQUAL ? '==' + extraEquals : kind == Skew.NodeKind.NOT_EQUAL ? '!=' + extraEquals : info1.text) + this._space);
          this._emitExpression(right, info1.precedence + (info1.associativity == Skew.Associativity.LEFT | 0) | 0);

          if (needsParentheses) {
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
    if (!symbol.isImported() && (symbol.baseClass != null || symbol.kind == Skew.SymbolKind.OBJECT_CLASS && symbol.$extends != null)) {
      this._specialVariable(Skew.JavaScriptEmitter.SpecialVariable.EXTENDS);
    }

    // Scan over child objects
    for (var i = 0, list = symbol.objects, count = list.length; i < count; i = i + 1 | 0) {
      var object = in_List.get(list, i);
      this._patchObject(object);
    }

    // Scan over child functions
    var isPrimaryConstructor = true;
    var prototypeCount = 0;

    for (var i2 = 0, list2 = symbol.functions, count2 = list2.length; i2 < count2; i2 = i2 + 1 | 0) {
      var $function = in_List.get(list2, i2);
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
          $this.kind = Skew.SymbolKind.VARIABLE_LOCAL;
          $this.value = new Skew.Node(Skew.NodeKind.NAME).withContent(new Skew.StringContent('this')).withType(Skew.Type.DYNAMIC);
          var variable = Skew.Node.createVariable($this);
          var merged = false;

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
        $this.flags |= Skew.SymbolFlags.IS_EXPORTED;
      }

      for (var i1 = 0, list1 = $function.$arguments, count1 = list1.length; i1 < count1; i1 = i1 + 1 | 0) {
        var argument = in_List.get(list1, i1);
        this._allocateNamingGroupIndex(argument);
        this._unionVariableWithFunction(argument, $function);
      }

      // Rename extra constructors overloads so they don't conflict
      if ($function.kind == Skew.SymbolKind.FUNCTION_CONSTRUCTOR && isPrimaryConstructor) {
        $function.flags |= Skew.SymbolFlags.IS_PRIMARY_CONSTRUCTOR;
        isPrimaryConstructor = false;
      }

      // Mark the prototype variable as needed when the prototype is used
      else if (this._mangle && ($function.kind == Skew.SymbolKind.FUNCTION_INSTANCE || $function.kind == Skew.SymbolKind.FUNCTION_CONSTRUCTOR && !isPrimaryConstructor)) {
        if ((prototypeCount = prototypeCount + 1 | 0) == 2) {
          var variable1 = this._specialVariable(Skew.JavaScriptEmitter.SpecialVariable.PROTOTYPE);
          this._symbolCounts[variable1.id] = in_IntMap.get(this._symbolCounts, variable1.id, 0) + 1 | 0;
          symbol.flags |= Skew.SymbolFlags.USE_PROTOTYPE_CACHE;
        }
      }
    }

    // Scan over child variables
    for (var i3 = 0, list3 = symbol.variables, count3 = list3.length; i3 < count3; i3 = i3 + 1 | 0) {
      var variable2 = in_List.get(list3, i3);
      this._allocateNamingGroupIndex(variable2);
      this._patchNode(variable2.value);
    }
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
    return Skew.Node.createBinary(Skew.NodeKind.BITWISE_OR, node, this._cache.createInt(0)).withType(this._cache.intType).withRange(node.range);
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

    else if (this._cache.isInteger(type)) {
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
      this._localVariableUnionFind.union(in_IntMap.get1(this._namingGroupIndexForSymbol, symbol.id), in_IntMap.get1(this._namingGroupIndexForSymbol, $function.id));
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
        node.become(this._wrapWithNot(this._cache.createInt(node.asBool() ? 0 : 1).withRange(node.range)));
        break;
      }

      case Skew.ContentKind.INT: {
        var value = node.asInt();

        // "-2147483648" => "1 << 31"
        if (value != 0) {
          var count = value.toString().length;
          var shift = 0;

          // Count zero bits
          while ((value & 1) == 0) {
            value >>>= 1;
            shift = shift + 1 | 0;
          }

          // Do the substitution if it makes sense
          if (shift != 0 && ((value.toString().length + 2 | 0) + shift.toString().length | 0) < count) {
            node.become(Skew.Node.createBinary(Skew.NodeKind.SHIFT_LEFT, this._cache.createInt(value), this._cache.createInt(shift)).withType(this._cache.intType).withRange(node.range));
          }
        }
        break;
      }

      case Skew.ContentKind.DOUBLE: {
        var value1 = node.asDouble();
        var reciprocal = 1 / value1;

        // Shorten long reciprocals (don't replace multiplication with division
        // because that's not numerically identical). These should be constant-
        // folded by the JIT at compile-time.
        //
        //   "x * 0.3333333333333333" => "x * (1 / 3)"
        //
        for (var i = 1; i < 10; i = i + 1 | 0) {
          if (reciprocal * i == (reciprocal * i | 0) && value1.toString().length >= 10) {
            node.become(Skew.Node.createBinary(Skew.NodeKind.DIVIDE, this._cache.createDouble(i), this._cache.createDouble(reciprocal * i)).withType(this._cache.doubleType).withRange(node.range));
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

    for (var i = 0, list = $function.$arguments, count = list.length; i < count; i = i + 1 | 0) {
      var argument = in_List.get(list, i);
      this._allocateNamingGroupIndex(argument);
      this._unionVariableWithFunction(argument, $function);
    }

    this._unionVariableWithFunction($function, this._enclosingFunction);
  };

  Skew.JavaScriptEmitter.prototype._recursiveSubstituteSymbol = function(node, old, $new) {
    if (node.symbol == old) {
      node.symbol = $new;
    }

    for (var child = node.firstChild(); child != null; child = child.nextSibling()) {
      this._recursiveSubstituteSymbol(child, old, $new);
    }
  };

  Skew.JavaScriptEmitter.prototype._patchTry = function(node) {
    if (node.hasChildren() && !node.hasOneChild()) {
      var tryBlock = node.tryBlock();
      var finallyBlock = node.finallyBlock();
      var firstCatch = finallyBlock != null ? finallyBlock.previousSibling() : node.lastChild();
      var variable = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_LOCAL, firstCatch.kind == Skew.NodeKind.CATCH && firstCatch.symbol != null ? firstCatch.symbol.name : this._enclosingFunction.scope.generateName('e'));
      variable.resolvedType = Skew.Type.DYNAMIC;
      var block = new Skew.Node(Skew.NodeKind.BLOCK).appendChild(Skew.Node.createThrow(Skew.Node.createSymbolReference(variable)));

      // Iterate backwards over the catch blocks
      for (var child = firstCatch, previous = child.previousSibling(); child != tryBlock; child = previous, previous = child.previousSibling()) {
        var catchBlock = child.remove().catchBlock().remove();

        // Substitute the variable into the contents of the block
        if (child.symbol != null) {
          this._recursiveSubstituteSymbol(catchBlock, child.symbol, variable);
        }

        // Build up the chain of tests in reverse
        if (child.symbol != null && child.symbol.resolvedType != Skew.Type.DYNAMIC) {
          var test = Skew.Node.createTypeCheck(Skew.Node.createSymbolReference(variable), new Skew.Node(Skew.NodeKind.TYPE).withType(child.symbol.resolvedType)).withType(this._cache.boolType);
          block = new Skew.Node(Skew.NodeKind.BLOCK).appendChild(catchBlock.hasChildren() ? Skew.Node.createIf(test, catchBlock, block) : Skew.Node.createIf(this._wrapWithNot(test), block, null));
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

          if (previousRight == null || !previousRight.looksTheSameAs(childRight)) {
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
      var binary = Skew.Node.createBinary(kind, left.lastChild().cloneAndStealChildren(), right.remove()).withType(Skew.Type.DYNAMIC);
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
          node.become(kind == Skew.NodeKind.EQUAL ? this._wrapWithNot(replacement) : replacement);
        }
      }

      else if (this._cache.isInteger(left.resolvedType) && this._cache.isInteger(right.resolvedType) && (kind == Skew.NodeKind.NOT_EQUAL || kind == Skew.NodeKind.EQUAL && canSwap == Skew.JavaScriptEmitter.BooleanSwap.SWAP)) {
        // "if (a != -1) c;" => "if (~a) c;"
        // "if (a == -1) c; else d;" => "if (~a) d; else c;"
        if (right.isInt() && right.asInt() == -1) {
          node.become(Skew.Node.createUnary(Skew.NodeKind.COMPLEMENT, left.remove()).withType(this._cache.intType));
        }

        // "if (-1 != b) c;" => "if (~b) c;"
        // "if (-1 == b) c; else d;" => "if (~b) d; else c;"
        else if (left.isInt() && left.asInt() == -1) {
          node.become(Skew.Node.createUnary(Skew.NodeKind.COMPLEMENT, right.remove()).withType(this._cache.intType));
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
          var hook = Skew.Node.createHook(test.remove(), trueStatement.expressionValue().remove(), falseStatement.expressionValue().remove()).withType(Skew.Type.DYNAMIC);
          this._peepholeMangleHook(hook);
          node.become(Skew.Node.createExpression(hook));
        }

        // "if (a) return b; else return c;" => "return a ? b : c;"
        else if (trueStatement.kind == Skew.NodeKind.RETURN && falseStatement.kind == Skew.NodeKind.RETURN) {
          var trueValue = trueStatement.returnValue();
          var falseValue = falseStatement.returnValue();

          if (trueValue != null && falseValue != null) {
            var hook1 = Skew.Node.createHook(test.remove(), trueValue.remove(), falseValue.remove()).withType(Skew.Type.DYNAMIC);
            this._peepholeMangleHook(hook1);
            node.become(Skew.Node.createReturn(hook1));
          }
        }
      }
    }

    // "if (a) b;" => "a && b;"
    // "if (!a) b;" => "a || b;"
    else if (trueStatement != null && trueStatement.kind == Skew.NodeKind.EXPRESSION) {
      var binary = Skew.Node.createBinary(swapped == Skew.JavaScriptEmitter.BooleanSwap.SWAP ? Skew.NodeKind.LOGICAL_OR : Skew.NodeKind.LOGICAL_AND, test.remove(), trueStatement.expressionValue().remove()).withType(Skew.Type.DYNAMIC);
      this._peepholeMangleBinary(binary);
      node.become(Skew.Node.createExpression(binary));
    }

    // "if (a) if (b) c;" => "if (a && b) c;"
    else {
      var singleIf = Skew.JavaScriptEmitter._singleIf(trueBlock);

      if (singleIf != null && singleIf.ifFalse() == null) {
        var block1 = singleIf.ifTrue();
        test.replaceWith(Skew.Node.createBinary(Skew.NodeKind.LOGICAL_AND, test.cloneAndStealChildren(), singleIf.ifTest().remove()).withType(Skew.Type.DYNAMIC));
        trueBlock.replaceWith(block1.remove());
      }
    }
  };

  Skew.JavaScriptEmitter.prototype._peepholeMangleWhile = function(node) {
    var test = node.whileTest();
    var block = node.whileBlock();
    this._peepholeMangleBoolean(test.remove(), Skew.JavaScriptEmitter.BooleanSwap.NO_SWAP);

    // "while (a) {}" => "for (; a;) {}"
    var loop = Skew.Node.createFor(new Skew.Node(Skew.NodeKind.SEQUENCE).withType(Skew.Type.DYNAMIC), test, new Skew.Node(Skew.NodeKind.SEQUENCE).withType(Skew.Type.DYNAMIC), block.remove()).withRange(node.range);
    this._peepholeMangleFor(loop);
    node.become(loop);
  };

  Skew.JavaScriptEmitter.prototype._peepholeMangleFor = function(node) {
    var test = node.forTest();
    this._peepholeMangleBoolean(test, Skew.JavaScriptEmitter.BooleanSwap.NO_SWAP);

    // "for (; true;) {}" => "for (;;) {}"
    if (test.kind == Skew.NodeKind.NOT && test.unaryValue().isInt() && test.unaryValue().asInt() == 0) {
      var empty = new Skew.Node(Skew.NodeKind.SEQUENCE).withType(Skew.Type.DYNAMIC);
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
            condition = Skew.Node.createBinary(Skew.NodeKind.LOGICAL_AND, test.cloneAndStealChildren(), condition).withType(Skew.Type.DYNAMIC);
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
      node.become(Skew.Node.createBinary(Skew.NodeKind.LOGICAL_AND, test.remove(), trueValue.remove()).withType(node.resolvedType));
      return;
    }

    // "a ? a : b" => "a || b"
    // "a = b ? a : c" => "(a = b) || c"
    if (test.looksTheSameAs(trueValue) && test.hasNoSideEffects() || Skew.in_NodeKind.isBinaryAssign(test.kind) && test.binaryLeft().looksTheSameAs(trueValue) && test.binaryLeft().hasNoSideEffects()) {
      node.become(Skew.Node.createBinary(Skew.NodeKind.LOGICAL_OR, test.remove(), falseValue.remove()).withType(node.resolvedType));
      return;
    }

    // "a ? b : a" => "a && b"
    if (test.looksTheSameAs(falseValue) && test.hasNoSideEffects()) {
      node.become(Skew.Node.createBinary(Skew.NodeKind.LOGICAL_AND, test.remove(), trueValue.remove()).withType(node.resolvedType));
      return;
    }

    // "a ? b : b" => "a, b"
    if (trueValue.looksTheSameAs(falseValue)) {
      node.become(test.hasNoSideEffects() ? trueValue.remove() : Skew.Node.createSequence2(test.remove(), trueValue.remove()));
      return;
    }

    // Collapse partially-identical hook expressions
    if (falseValue.kind == Skew.NodeKind.HOOK) {
      var falseTest = falseValue.hookTest();
      var falseTrueValue = falseValue.hookTrue();
      var falseFalseValue = falseValue.hookFalse();

      // "a ? b : c ? b : d" => "a || c ? b : d"
      // "a ? b : c || d ? b : e" => "a || c || d ? b : e"
      if (trueValue.looksTheSameAs(falseTrueValue)) {
        var both = Skew.Node.createBinary(Skew.NodeKind.LOGICAL_OR, test.cloneAndStealChildren(), falseTest.remove()).withType(Skew.Type.DYNAMIC);
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
      if (trueLeft.looksTheSameAs(falseLeft)) {
        var hook = Skew.Node.createHook(test.remove(), trueRight.remove(), falseRight.remove()).withType(Skew.Type.DYNAMIC);
        this._peepholeMangleHook(hook);
        node.become(Skew.Node.createBinary(trueValue.kind, trueLeft.remove(), hook).withType(node.resolvedType));
      }

      // "a ? b + 100 : c + 100;" => "(a ? b + c) + 100;"
      else if (trueRight.looksTheSameAs(falseRight) && !Skew.in_NodeKind.isBinaryAssign(trueValue.kind)) {
        var hook1 = Skew.Node.createHook(test.remove(), trueLeft.remove(), falseLeft.remove()).withType(Skew.Type.DYNAMIC);
        this._peepholeMangleHook(hook1);
        node.become(Skew.Node.createBinary(trueValue.kind, hook1, trueRight.remove()).withType(node.resolvedType));
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
      node.become(Skew.Node.createBinary(Skew.NodeKind.ASSIGN, new Skew.Node(Skew.NodeKind.DOT).withContent(new Skew.StringContent(center.asString())).appendChild(left.remove()).withRange(Skew.Range.span(left.range, center.range)).withType(Skew.Type.DYNAMIC), right.remove()).withRange(node.range).withType(node.resolvedType));
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
                var hook = Skew.Node.createHook(previous.remove().ifTest().remove(), statement.returnValue().remove(), child.returnValue().remove()).withType(Skew.Type.DYNAMIC);
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
            if (child.ifFalse() == null && previous.kind == Skew.NodeKind.IF && previous.ifFalse() == null && previous.ifTrue().looksTheSameAs(child.ifTrue())) {
              child.ifTest().replaceWith(Skew.Node.createBinary(Skew.NodeKind.LOGICAL_OR, previous.remove().ifTest().remove(), child.ifTest().cloneAndStealChildren()).withType(Skew.Type.DYNAMIC));
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
              next = Skew.Node.createIf(Skew.Node.createBinary(Skew.NodeKind.EQUAL, switchValue.remove(), value.remove()).withType(this._cache.boolType), singleCase.caseBlock().remove(), null);
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
              next = Skew.Node.createIf(Skew.Node.createBinary(Skew.NodeKind.EQUAL, switchValue.remove(), value1.remove()).withType(this._cache.boolType), firstCase.caseBlock().remove(), secondCase.caseBlock().remove());
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

      count = count + 1 | 0;
    }

    // Make sure the pattern is matched
    if (count == 0) {
      return;
    }

    var block = new Skew.Node(Skew.NodeKind.BLOCK).appendChild(Skew.Node.createReturn(sharedDelta > 0 ? this._createIntBinary(Skew.NodeKind.ADD, switchValue.remove(), this._cache.createInt(sharedDelta)) : sharedDelta < 0 ? this._createIntBinary(Skew.NodeKind.SUBTRACT, switchValue.remove(), this._cache.createInt(-sharedDelta | 0)) : switchValue.remove()));

    // Replace the large "switch" statement with a smaller "if" statement if the entire range is covered
    if ((max - min | 0) == (count - 1 | 0)) {
      var lower = Skew.Node.createBinary(Skew.NodeKind.GREATER_THAN_OR_EQUAL, switchValue.clone(), this._cache.createInt(min)).withType(this._cache.boolType);
      var upper = Skew.Node.createBinary(Skew.NodeKind.LESS_THAN_OR_EQUAL, switchValue.clone(), this._cache.createInt(max)).withType(this._cache.boolType);

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
        node.become(Skew.Node.createSymbolCall(this._specialVariable(Skew.JavaScriptEmitter.SpecialVariable.AS_STRING)).appendChild(value.remove()));
      }
    }
  };

  Skew.JavaScriptEmitter.prototype._specialVariable = function(name) {
    assert(name in this._specialVariables);
    var variable = in_IntMap.get1(this._specialVariables, name);
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

      for (var i = 0, count = value.length; i < count; i = i + 1 | 0) {
        var c = in_string.get1(value, i);

        if ((c < 65 || c > 90) && (c < 97 || c > 122) && c != 95 && c != 36 && (i == 0 || c < 48 || c > 57)) {
          return false;
        }
      }

      return value != '' && !(value in Skew.JavaScriptEmitter._isKeyword);
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

  Skew.JavaScriptEmitter._numberToName = function(number) {
    var name = in_string.get(Skew.JavaScriptEmitter._first, number % Skew.JavaScriptEmitter._first.length | 0);
    number = number / Skew.JavaScriptEmitter._first.length | 0;

    while (number > 0) {
      number = number - 1 | 0;
      name += in_string.get(Skew.JavaScriptEmitter._rest, number % Skew.JavaScriptEmitter._rest.length | 0);
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

      assert(symbol.kind != Skew.SymbolKind.OVERLOADED_INSTANCE);

      if (symbol.kind == Skew.SymbolKind.FUNCTION_INSTANCE) {
        enclosingName += '.prototype';
      }

      return enclosingName + '.' + Skew.JavaScriptEmitter._mangleName(symbol);
    }

    return Skew.JavaScriptEmitter._mangleName(symbol);
  };

  Skew.JavaScriptEmitter._shouldRenameSymbol = function(symbol) {
    // Don't rename annotations since "@rename" is used for renaming and is identified by name
    return !symbol.isImportedOrExported() && !symbol.isRenamed() && !symbol.isPrimaryConstructor() && symbol.kind != Skew.SymbolKind.FUNCTION_ANNOTATION && symbol.kind != Skew.SymbolKind.OBJECT_GLOBAL && symbol.kind != Skew.SymbolKind.FUNCTION_LOCAL;
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
    AS_STRING: 1,
    EXTENDS: 2,
    IS_BOOL: 3,
    IS_DOUBLE: 4,
    IS_INT: 5,
    IS_STRING: 6,
    MULTIPLY: 7,
    PROTOTYPE: 8
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
    this._emit('(' + this._mangleKind(in_List.get(Skew.in_SymbolKind._strings, symbol.kind)) + ' ' + Skew.quoteString(symbol.name, Skew.QuoteStyle.DOUBLE, Skew.QuoteOctal.OCTAL_WORKAROUND));
    this._increaseIndent();

    for (var i = 0, list = symbol.objects, count = list.length; i < count; i = i + 1 | 0) {
      var object = in_List.get(list, i);
      this._emit('\n' + this._indent);
      this._visitObject(object);
    }

    for (var i1 = 0, list1 = symbol.functions, count1 = list1.length; i1 < count1; i1 = i1 + 1 | 0) {
      var $function = in_List.get(list1, i1);
      this._emit('\n' + this._indent);
      this._visitFunction($function);
    }

    for (var i2 = 0, list2 = symbol.variables, count2 = list2.length; i2 < count2; i2 = i2 + 1 | 0) {
      var variable = in_List.get(list2, i2);
      this._emit('\n' + this._indent);
      this._visitVariable(variable);
    }

    this._decreaseIndent();
    this._emit(')');
  };

  Skew.LispTreeEmitter.prototype._visitFunction = function(symbol) {
    this._emit('(' + this._mangleKind(in_List.get(Skew.in_SymbolKind._strings, symbol.kind)) + ' ' + Skew.quoteString(symbol.name, Skew.QuoteStyle.DOUBLE, Skew.QuoteOctal.OCTAL_WORKAROUND));
    this._increaseIndent();

    for (var i = 0, list = symbol.$arguments, count = list.length; i < count; i = i + 1 | 0) {
      var argument = in_List.get(list, i);
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
    this._emit('(' + this._mangleKind(in_List.get(Skew.in_SymbolKind._strings, symbol.kind)) + ' ' + Skew.quoteString(symbol.name, Skew.QuoteStyle.DOUBLE, Skew.QuoteOctal.OCTAL_WORKAROUND) + ' ');
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

    this._emit('(' + this._mangleKind(in_List.get(Skew.in_NodeKind._strings, node.kind)));
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
          this._emit(' ' + Skew.quoteString(Skew.in_Content.asString(content), Skew.QuoteStyle.DOUBLE, Skew.QuoteOctal.OCTAL_WORKAROUND));
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

    for (var i = 0, list = this._sources, count = list.length; i < count; i = i + 1 | 0) {
      var source = in_List.get(list, i);
      sourceNames.push(Skew.quoteString(source.name, Skew.QuoteStyle.DOUBLE, Skew.QuoteOctal.OCTAL_WORKAROUND));
      sourceContents.push(Skew.quoteString(source.contents, Skew.QuoteStyle.DOUBLE, Skew.QuoteOctal.OCTAL_WORKAROUND));
    }

    var builder = new StringBuilder();
    builder.append('{"version":3,"sources":[');
    builder.append(sourceNames.join(','));
    builder.append('],"sourcesContent":[');
    builder.append(sourceContents.join(','));
    builder.append('],"names":[],"mappings":"');

    // Sort the mappings in increasing order by generated location
    this._mappings.sort(function(a, b) {
      var delta = in_int.compare(a.generatedLine, b.generatedLine);
      return delta != 0 ? delta : in_int.compare(a.generatedColumn, b.generatedColumn);
    });
    var previousGeneratedColumn = 0;
    var previousGeneratedLine = 0;
    var previousOriginalColumn = 0;
    var previousOriginalLine = 0;
    var previousSourceIndex = 0;

    // Generate the base64 VLQ encoded mappings
    for (var i1 = 0, list1 = this._mappings, count1 = list1.length; i1 < count1; i1 = i1 + 1 | 0) {
      var mapping = in_List.get(list1, i1);
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
          previousGeneratedLine = previousGeneratedLine + 1 | 0;
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
    NULL_DOT: 30,
    PAIR: 31,
    PARAMETERIZE: 32,
    PARSE_ERROR: 33,
    SEQUENCE: 34,
    STRING_INTERPOLATION: 35,
    SUPER: 36,
    TYPE: 37,
    TYPE_CHECK: 38,
    XML: 39,

    // Unary operators
    COMPLEMENT: 40,
    NEGATIVE: 41,
    NOT: 42,
    POSITIVE: 43,
    POSTFIX_DECREMENT: 44,
    POSTFIX_INCREMENT: 45,
    PREFIX_DECREMENT: 46,
    PREFIX_INCREMENT: 47,

    // Binary operators
    ADD: 48,
    BITWISE_AND: 49,
    BITWISE_OR: 50,
    BITWISE_XOR: 51,
    COMPARE: 52,
    DIVIDE: 53,
    EQUAL: 54,
    IN: 55,
    LOGICAL_AND: 56,
    LOGICAL_OR: 57,
    MULTIPLY: 58,
    NOT_EQUAL: 59,
    NULL_JOIN: 60,
    POWER: 61,
    REMAINDER: 62,
    SHIFT_LEFT: 63,
    SHIFT_RIGHT: 64,
    SUBTRACT: 65,
    UNSIGNED_SHIFT_RIGHT: 66,

    // Binary comparison operators
    GREATER_THAN: 67,
    GREATER_THAN_OR_EQUAL: 68,
    LESS_THAN: 69,
    LESS_THAN_OR_EQUAL: 70,

    // Binary assigment operators
    ASSIGN: 71,
    ASSIGN_ADD: 72,
    ASSIGN_BITWISE_AND: 73,
    ASSIGN_BITWISE_OR: 74,
    ASSIGN_BITWISE_XOR: 75,
    ASSIGN_DIVIDE: 76,
    ASSIGN_MULTIPLY: 77,
    ASSIGN_NULL: 78,
    ASSIGN_POWER: 79,
    ASSIGN_REMAINDER: 80,
    ASSIGN_SHIFT_LEFT: 81,
    ASSIGN_SHIFT_RIGHT: 82,
    ASSIGN_SUBTRACT: 83,
    ASSIGN_UNSIGNED_SHIFT_RIGHT: 84
  };

  Skew.NodeFlags = {
    // This flag is only for blocks. A simple control flow analysis is run
    // during code resolution and blocks where control flow reaches the end of
    // the block have this flag set.
    HAS_CONTROL_FLOW_AT_END: 1,

    // Use this flag to tell the IDE support code to ignore this node. This is
    // useful for compiler-generated nodes that are used for lowering and that
    // need marked ranges for error reporting but that should not show up in
    // tooltips.
    IS_IGNORED_BY_IDE: 2,

    // An implicit return is a return statement inside an expression lambda. For
    // example, the lambda "x => x" is compiled into "x => { return x }" where
    // the return statement has this flag set.
    IS_IMPLICIT_RETURN: 4,

    // This flag marks list nodes that help implement initializer expressions.
    IS_INITIALIZER_EXPANSION: 8,

    // This flag marks nodes that were wrapped in parentheses in the original
    // source code. It's used for warnings about C-style syntax in conditional
    // statements and to call a lambda returned from a getter.
    IS_INSIDE_PARENTHESES: 16,

    // This flag is set on nodes that are expected to be types.
    SHOULD_EXPECT_TYPE: 32,

    // This flag marks nodes that were converted from ASSIGN_NULL to ASSIGN nodes.
    WAS_ASSIGN_NULL: 64,

    // This flag marks nodes that were converted from NULL_JOIN to HOOK nodes.
    WAS_NULL_JOIN: 128
  };

  // Nodes represent executable code (variable initializers and function bodies)
  // Node-specific queries
  // Factory functions
  // Getters, most of which should be inlineable when asserts are skipped in release
  Skew.Node = function(kind) {
    this.id = Skew.Node._nextID = Skew.Node._nextID + 1 | 0;
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
    var ref;
    var clone = new Skew.Node(this.kind);
    clone.flags = this.flags;
    clone.range = this.range;
    clone.internalRange = this.internalRange;
    clone.symbol = this.symbol;
    clone.content = this.content;
    clone.resolvedType = this.resolvedType;
    clone.comments = (ref = this.comments) != null ? ref.slice() : null;
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

    if (this.kind == Skew.NodeKind.LAMBDA) {
      clone.symbol = this.symbol.asFunctionSymbol().clone();
      clone.appendChild(clone.symbol.asFunctionSymbol().block);
    }

    else if (this.kind == Skew.NodeKind.VARIABLE) {
      clone.symbol = this.symbol.asVariableSymbol().clone();
      clone.appendChild(clone.symbol.asVariableSymbol().value);
    }

    else {
      for (var child = this._firstChild; child != null; child = child._nextSibling) {
        clone.appendChild(child.clone());
      }
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

  Skew.Node.prototype.hasControlFlowAtEnd = function() {
    return (Skew.NodeFlags.HAS_CONTROL_FLOW_AT_END & this.flags) != 0;
  };

  Skew.Node.prototype.isImplicitReturn = function() {
    return (Skew.NodeFlags.IS_IMPLICIT_RETURN & this.flags) != 0;
  };

  Skew.Node.prototype.isInitializerExpansion = function() {
    return (Skew.NodeFlags.IS_INITIALIZER_EXPANSION & this.flags) != 0;
  };

  Skew.Node.prototype.isInsideParentheses = function() {
    return (Skew.NodeFlags.IS_INSIDE_PARENTHESES & this.flags) != 0;
  };

  Skew.Node.prototype.wasAssignNull = function() {
    return (Skew.NodeFlags.WAS_ASSIGN_NULL & this.flags) != 0;
  };

  Skew.Node.prototype.wasNullJoin = function() {
    return (Skew.NodeFlags.WAS_NULL_JOIN & this.flags) != 0;
  };

  Skew.Node.prototype.shouldExpectType = function() {
    for (var node = this; node != null; node = node.parent()) {
      if ((Skew.NodeFlags.SHOULD_EXPECT_TYPE & node.flags) != 0) {
        return true;
      }
    }

    return false;
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
      count = count + 1 | 0;
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
    if (after == null) {
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

    if (this._parent.kind == Skew.NodeKind.LAMBDA) {
      assert(this == this._parent.symbol.asFunctionSymbol().block);
      this._parent.symbol.asFunctionSymbol().block = node;
    }

    else if (this._parent.kind == Skew.NodeKind.VARIABLE) {
      assert(this == this._parent.symbol.asVariableSymbol().value);
      this._parent.symbol.asVariableSymbol().value = node;
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

  Skew.Node._symbolsOrStringsLookTheSame = function(left, right) {
    return left.symbol != null && left.symbol == right.symbol || left.symbol == null && right.symbol == null && left.asString() == right.asString();
  };

  Skew.Node._childrenLookTheSame = function(left, right) {
    var leftChild = left.firstChild();
    var rightChild = right.firstChild();

    while (leftChild != null && rightChild != null) {
      if (!Skew.Node._looksTheSame(leftChild, rightChild)) {
        return false;
      }

      leftChild = leftChild.nextSibling();
      rightChild = rightChild.nextSibling();
    }

    return leftChild == null && rightChild == null;
  };

  Skew.Node._looksTheSame = function(left, right) {
    if (left.kind == right.kind) {
      switch (left.kind) {
        case Skew.NodeKind.NULL: {
          return true;
        }

        case Skew.NodeKind.NAME: {
          return Skew.Node._symbolsOrStringsLookTheSame(left, right);
        }

        case Skew.NodeKind.DOT: {
          return Skew.Node._symbolsOrStringsLookTheSame(left, right) && Skew.Node._looksTheSame(left.dotTarget(), right.dotTarget());
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
        case Skew.NodeKind.NEGATIVE:
        case Skew.NodeKind.NOT:
        case Skew.NodeKind.POSITIVE:
        case Skew.NodeKind.POSTFIX_DECREMENT:
        case Skew.NodeKind.POSTFIX_INCREMENT:
        case Skew.NodeKind.PREFIX_DECREMENT:
        case Skew.NodeKind.PREFIX_INCREMENT: {
          return Skew.Node._childrenLookTheSame(left, right);
        }

        default: {
          if (Skew.in_NodeKind.isBinary(left.kind)) {
            return Skew.Node._childrenLookTheSame(left, right);
          }
          break;
        }
      }
    }

    // Null literals are always implicitly casted, so unwrap implicit casts
    if (left.kind == Skew.NodeKind.CAST) {
      return Skew.Node._looksTheSame(left.castValue(), right);
    }

    if (right.kind == Skew.NodeKind.CAST) {
      return Skew.Node._looksTheSame(left, right.castValue());
    }

    return false;
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

  Skew.Node.prototype.isZero = function() {
    return this.isInt() && this.asInt() == 0 || this.isDouble() && this.asDouble() == 0;
  };

  Skew.Node.prototype.isNumberLessThanZero = function() {
    return this.isInt() && this.asInt() < 0 || this.isDouble() && this.asDouble() < 0;
  };

  Skew.Node.prototype.hasNoSideEffects = function() {
    assert(Skew.in_NodeKind.isExpression(this.kind));

    switch (this.kind) {
      case Skew.NodeKind.CONSTANT:
      case Skew.NodeKind.NAME:
      case Skew.NodeKind.NULL:
      case Skew.NodeKind.TYPE: {
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
      case Skew.NodeKind.NEGATIVE:
      case Skew.NodeKind.NOT:
      case Skew.NodeKind.POSITIVE:
      case Skew.NodeKind.POSTFIX_DECREMENT:
      case Skew.NodeKind.POSTFIX_INCREMENT:
      case Skew.NodeKind.PREFIX_DECREMENT:
      case Skew.NodeKind.PREFIX_INCREMENT: {
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

  Skew.Node.prototype.looksTheSameAs = function(node) {
    return Skew.Node._looksTheSame(this, node);
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

  // If a variable is inside a variable cluster, break up the variable cluster
  // into separate clusters so that variable is in a cluster all by itself. That
  // way the variable can easily be replaced by something else (an assigment,
  // for example. This does not handle variables inside loop headers.
  //
  // "var a, b, c, d, e" => c.extractVariableFromVariables => "var a, b; var c; var d, e"
  //
  Skew.Node.prototype.extractVariableFromVariables = function() {
    assert(this.kind == Skew.NodeKind.VARIABLE);
    assert(this.parent() != null && this.parent().kind == Skew.NodeKind.VARIABLES);
    assert(this.parent().parent() != null && this.parent().parent().kind == Skew.NodeKind.BLOCK);

    // Split off variables before this one
    if (this.previousSibling() != null) {
      var variables = new Skew.Node(Skew.NodeKind.VARIABLES);

      while (this.previousSibling() != null) {
        variables.prependChild(this.previousSibling().remove());
      }

      this.parent().parent().insertChildBefore(this.parent(), variables);
    }

    // Split off variables after this one
    if (this.nextSibling() != null) {
      var variables1 = new Skew.Node(Skew.NodeKind.VARIABLES);

      while (this.nextSibling() != null) {
        variables1.appendChild(this.nextSibling().remove());
      }

      this.parent().parent().insertChildAfter(this.parent(), variables1);
    }
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

  // This adds the initializer expression to the tree for ease of traversal
  Skew.Node.createVariable = function(symbol) {
    return new Skew.Node(Skew.NodeKind.VARIABLE).appendChild(symbol.value).withSymbol(symbol);
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
    assert(before.parent() == null);
    assert(after.parent() == null);

    if (before.kind == Skew.NodeKind.SEQUENCE) {
      if (after.kind == Skew.NodeKind.SEQUENCE) {
        return before.withType(after.resolvedType).appendChildrenFrom(after);
      }

      return before.withType(after.resolvedType).appendChild(after);
    }

    if (after.kind == Skew.NodeKind.SEQUENCE) {
      return after.prependChild(before);
    }

    return new Skew.Node(Skew.NodeKind.SEQUENCE).withType(after.resolvedType).appendChild(before).appendChild(after);
  };

  Skew.Node.createTypeCheck = function(value, type) {
    assert(Skew.in_NodeKind.isExpression(value.kind));
    assert(Skew.in_NodeKind.isExpression(type.kind));
    return new Skew.Node(Skew.NodeKind.TYPE_CHECK).appendChild(value).appendChild(type);
  };

  Skew.Node.createXML = function(tag, attributes, children, closingTag) {
    assert(Skew.in_NodeKind.isExpression(tag.kind));
    assert(attributes.kind == Skew.NodeKind.SEQUENCE);
    assert(children.kind == Skew.NodeKind.BLOCK);
    assert(closingTag == null || Skew.in_NodeKind.isExpression(closingTag.kind));
    return new Skew.Node(Skew.NodeKind.XML).appendChild(tag).appendChild(attributes).appendChild(children).appendChild(closingTag);
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
    assert(this.kind == Skew.NodeKind.NAME || this.kind == Skew.NodeKind.DOT || this.kind == Skew.NodeKind.CONSTANT || this.kind == Skew.NodeKind.NULL_DOT);
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
    assert(this.kind == Skew.NodeKind.DOT || this.kind == Skew.NodeKind.NULL_DOT);
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

  Skew.Node.prototype.variableValue = function() {
    assert(this.kind == Skew.NodeKind.VARIABLE);
    assert(this.childCount() <= 1);
    assert(this._firstChild == null || Skew.in_NodeKind.isExpression(this._firstChild.kind));
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

  Skew.Node.prototype.xmlTag = function() {
    assert(this.kind == Skew.NodeKind.XML);
    assert(this.childCount() == 3 || this.childCount() == 4);
    assert(Skew.in_NodeKind.isExpression(this._firstChild.kind));
    return this._firstChild;
  };

  Skew.Node.prototype.xmlAttributes = function() {
    assert(this.kind == Skew.NodeKind.XML);
    assert(this.childCount() == 3 || this.childCount() == 4);
    assert(this._firstChild._nextSibling.kind == Skew.NodeKind.SEQUENCE);
    return this._firstChild._nextSibling;
  };

  Skew.Node.prototype.xmlChildren = function() {
    assert(this.kind == Skew.NodeKind.XML);
    assert(this.childCount() == 3 || this.childCount() == 4);
    assert(this._firstChild._nextSibling._nextSibling.kind == Skew.NodeKind.BLOCK);
    return this._firstChild._nextSibling._nextSibling;
  };

  Skew.Node.prototype.xmlClosingTag = function() {
    assert(this.kind == Skew.NodeKind.XML);
    assert(this.childCount() == 3 || this.childCount() == 4);
    assert(this._firstChild._nextSibling._nextSibling._nextSibling == null || Skew.in_NodeKind.isExpression(this._firstChild._nextSibling._nextSibling._nextSibling.kind));
    return this._firstChild._nextSibling._nextSibling._nextSibling;
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

  Skew.OperatorInfo = function(text, precedence, associativity, kind, validArgumentCounts, assignKind) {
    this.text = text;
    this.precedence = precedence;
    this.associativity = associativity;
    this.kind = kind;
    this.validArgumentCounts = validArgumentCounts;
    this.assignKind = assignKind;
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
    for (var i = 0, count1 = count; i < count1; i = i + 1 | 0) {
      this.parents.push(this.parents.length);
    }

    return this;
  };

  Skew.UnionFind.prototype.union = function(left, right) {
    in_List.set(this.parents, this.find(left), this.find(right));
  };

  Skew.UnionFind.prototype.find = function(index) {
    assert(index >= 0 && index < this.parents.length);
    var parent = in_List.get(this.parents, index);

    if (parent != index) {
      parent = this.find(parent);
      in_List.set(this.parents, index, parent);
    }

    return parent;
  };

  Skew.SplitPath = function(directory, entry) {
    this.directory = directory;
    this.entry = entry;
  };

  Skew.PrettyPrint = {};

  Skew.PrettyPrint.plural1 = function(value, word) {
    return value.toString() + ' ' + word + (value == 1 ? '' : 's');
  };

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

    for (var i = 0, count = parts.length; i < count; i = i + 1 | 0) {
      if (i != 0) {
        text += ', ';

        if ((i + 1 | 0) == parts.length) {
          text += trailing + ' ';
        }
      }

      text += in_List.get(parts, i);
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
      var word = in_List.get(words, i);
      var lineLength = line.length;
      var wordLength = word.length;
      var estimatedLength = (lineLength + 1 | 0) + wordLength | 0;
      i = i + 1 | 0;

      // Collapse adjacent spaces
      if (word == '') {
        continue;
      }

      // Start the line
      if (line == '') {
        while (word.length > width) {
          lines.push(in_string.slice2(word, 0, width));
          word = in_string.slice2(word, width, word.length);
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
        i = i - 1 | 0;
      }
    }

    // Don't add an empty trailing line unless there are no other lines
    if (line != '' || lines.length == 0) {
      lines.push(line);
    }

    return lines;
  };

  Skew.SymbolKind = {
    PARAMETER_FUNCTION: 0,
    PARAMETER_OBJECT: 1,
    OBJECT_CLASS: 2,
    OBJECT_ENUM: 3,
    OBJECT_FLAGS: 4,
    OBJECT_GLOBAL: 5,
    OBJECT_INTERFACE: 6,
    OBJECT_NAMESPACE: 7,
    OBJECT_WRAPPED: 8,
    FUNCTION_ANNOTATION: 9,
    FUNCTION_CONSTRUCTOR: 10,
    FUNCTION_GLOBAL: 11,
    FUNCTION_INSTANCE: 12,
    FUNCTION_LOCAL: 13,
    OVERLOADED_ANNOTATION: 14,
    OVERLOADED_GLOBAL: 15,
    OVERLOADED_INSTANCE: 16,
    VARIABLE_ARGUMENT: 17,
    VARIABLE_ENUM_OR_FLAGS: 18,
    VARIABLE_GLOBAL: 19,
    VARIABLE_INSTANCE: 20,
    VARIABLE_LOCAL: 21
  };

  Skew.SymbolState = {
    UNINITIALIZED: 0,
    INITIALIZING: 1,
    INITIALIZED: 2
  };

  Skew.SymbolFlags = {
    // Internal
    IS_AUTOMATICALLY_GENERATED: 1,
    IS_CONST: 2,
    IS_GETTER: 4,
    IS_LOOP_VARIABLE: 8,
    IS_OVER: 16,
    IS_SETTER: 32,
    IS_VALUE_TYPE: 64,
    SHOULD_INFER_RETURN_TYPE: 128,

    // Modifiers
    IS_DEPRECATED: 256,
    IS_ENTRY_POINT: 512,
    IS_EXPORTED: 1024,
    IS_IMPORTED: 2048,
    IS_INLINING_FORCED: 4096,
    IS_INLINING_PREVENTED: 8192,
    IS_PREFERRED: 16384,
    IS_PROTECTED: 32768,
    IS_RENAMED: 65536,
    IS_SKIPPED: 131072,
    SHOULD_SPREAD: 262144,

    // Pass-specific
    IS_CSHARP_CONST: 524288,
    IS_DYNAMIC_LAMBDA: 1048576,
    IS_GUARD_CONDITIONAL: 2097152,
    IS_OBSOLETE: 4194304,
    IS_PRIMARY_CONSTRUCTOR: 8388608,
    IS_VIRTUAL: 16777216,
    USE_PROTOTYPE_CACHE: 33554432
  };

  Skew.Symbol = function(kind, name) {
    this.id = Skew.Symbol._nextID = Skew.Symbol._nextID + 1 | 0;
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
    this.nextMergedSymbol = null;
  };

  Skew.Symbol.prototype._cloneFrom = function(symbol) {
    this.rename = symbol.rename;
    this.range = symbol.range;
    this.scope = symbol.scope;
    this.state = symbol.state;
    this.flags = symbol.flags;
  };

  // Flags
  Skew.Symbol.prototype.isAutomaticallyGenerated = function() {
    return (Skew.SymbolFlags.IS_AUTOMATICALLY_GENERATED & this.flags) != 0;
  };

  Skew.Symbol.prototype.isConst = function() {
    return (Skew.SymbolFlags.IS_CONST & this.flags) != 0;
  };

  Skew.Symbol.prototype.isGetter = function() {
    return (Skew.SymbolFlags.IS_GETTER & this.flags) != 0;
  };

  Skew.Symbol.prototype.isLoopVariable = function() {
    return (Skew.SymbolFlags.IS_LOOP_VARIABLE & this.flags) != 0;
  };

  Skew.Symbol.prototype.isOver = function() {
    return (Skew.SymbolFlags.IS_OVER & this.flags) != 0;
  };

  Skew.Symbol.prototype.isSetter = function() {
    return (Skew.SymbolFlags.IS_SETTER & this.flags) != 0;
  };

  Skew.Symbol.prototype.isValueType = function() {
    return (Skew.SymbolFlags.IS_VALUE_TYPE & this.flags) != 0;
  };

  Skew.Symbol.prototype.shouldInferReturnType = function() {
    return (Skew.SymbolFlags.SHOULD_INFER_RETURN_TYPE & this.flags) != 0;
  };

  // Modifiers
  Skew.Symbol.prototype.isDeprecated = function() {
    return (Skew.SymbolFlags.IS_DEPRECATED & this.flags) != 0;
  };

  Skew.Symbol.prototype.isEntryPoint = function() {
    return (Skew.SymbolFlags.IS_ENTRY_POINT & this.flags) != 0;
  };

  Skew.Symbol.prototype.isExported = function() {
    return (Skew.SymbolFlags.IS_EXPORTED & this.flags) != 0;
  };

  Skew.Symbol.prototype.isImported = function() {
    return (Skew.SymbolFlags.IS_IMPORTED & this.flags) != 0;
  };

  Skew.Symbol.prototype.isInliningForced = function() {
    return (Skew.SymbolFlags.IS_INLINING_FORCED & this.flags) != 0;
  };

  Skew.Symbol.prototype.isInliningPrevented = function() {
    return (Skew.SymbolFlags.IS_INLINING_PREVENTED & this.flags) != 0;
  };

  Skew.Symbol.prototype.isPreferred = function() {
    return (Skew.SymbolFlags.IS_PREFERRED & this.flags) != 0;
  };

  Skew.Symbol.prototype.isProtected = function() {
    return (Skew.SymbolFlags.IS_PROTECTED & this.flags) != 0;
  };

  Skew.Symbol.prototype.isRenamed = function() {
    return (Skew.SymbolFlags.IS_RENAMED & this.flags) != 0;
  };

  Skew.Symbol.prototype.isSkipped = function() {
    return (Skew.SymbolFlags.IS_SKIPPED & this.flags) != 0;
  };

  Skew.Symbol.prototype.shouldSpread = function() {
    return (Skew.SymbolFlags.SHOULD_SPREAD & this.flags) != 0;
  };

  // Pass-specific flags
  Skew.Symbol.prototype.isCSharpConst = function() {
    return (Skew.SymbolFlags.IS_CSHARP_CONST & this.flags) != 0;
  };

  Skew.Symbol.prototype.isDynamicLambda = function() {
    return (Skew.SymbolFlags.IS_DYNAMIC_LAMBDA & this.flags) != 0;
  };

  Skew.Symbol.prototype.isGuardConditional = function() {
    return (Skew.SymbolFlags.IS_GUARD_CONDITIONAL & this.flags) != 0;
  };

  Skew.Symbol.prototype.isObsolete = function() {
    return (Skew.SymbolFlags.IS_OBSOLETE & this.flags) != 0;
  };

  Skew.Symbol.prototype.isPrimaryConstructor = function() {
    return (Skew.SymbolFlags.IS_PRIMARY_CONSTRUCTOR & this.flags) != 0;
  };

  Skew.Symbol.prototype.isVirtual = function() {
    return (Skew.SymbolFlags.IS_VIRTUAL & this.flags) != 0;
  };

  Skew.Symbol.prototype.usePrototypeCache = function() {
    return (Skew.SymbolFlags.USE_PROTOTYPE_CACHE & this.flags) != 0;
  };

  // Combinations
  Skew.Symbol.prototype.isImportedOrExported = function() {
    return ((Skew.SymbolFlags.IS_IMPORTED | Skew.SymbolFlags.IS_EXPORTED) & this.flags) != 0;
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
      for (var i = 0, list = this.annotations, count = list.length; i < count; i = i + 1 | 0) {
        var annotation = in_List.get(list, i);

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

  Skew.Symbol.prototype.mergeInformationFrom = function(symbol) {
    // Link merged symbols together
    var link = this;

    while (link.nextMergedSymbol != null) {
      link = link.nextMergedSymbol;
    }

    link.nextMergedSymbol = symbol;

    // Combine annotations
    if (this.annotations == null) {
      this.annotations = symbol.annotations;
    }

    else if (symbol.annotations != null) {
      in_List.append1(this.annotations, symbol.annotations);
    }

    // Combine comments
    if (this.comments == null) {
      this.comments = symbol.comments;
    }

    else if (symbol.comments != null) {
      in_List.append1(this.comments, symbol.comments);
    }

    if (this.rename == null) {
      this.rename = symbol.rename;
    }
  };

  Skew.Symbol._substituteSymbols = function(node, symbols) {
    if (node.symbol != null) {
      node.symbol = in_IntMap.get(symbols, node.symbol.id, node.symbol);
    }

    for (var child = node.firstChild(); child != null; child = child.nextSibling()) {
      Skew.Symbol._substituteSymbols(child, symbols);
    }
  };

  Skew.Symbol.SORT_BY_ID = function(a, b) {
    return in_int.compare(a.id, b.id);
  };

  Skew.Symbol.SORT_OBJECTS_BY_ID = function(a, b) {
    return in_int.compare(a.id, b.id);
  };

  Skew.Symbol.SORT_VARIABLES_BY_ID = function(a, b) {
    return in_int.compare(a.id, b.id);
  };

  Skew.ParameterSymbol = function(kind, name) {
    Skew.Symbol.call(this, kind, name);
  };

  __extends(Skew.ParameterSymbol, Skew.Symbol);

  Skew.ParameterSymbol.prototype.clone = function() {
    var clone = new Skew.ParameterSymbol(this.kind, this.name);
    clone._cloneFrom(this);
    clone.resolvedType = new Skew.Type(Skew.TypeKind.SYMBOL, clone);
    return clone;
  };

  Skew.Guard = function(parent, test, contents, elseGuard) {
    this.parent = parent;
    this.test = test;
    this.contents = contents;
    this.elseGuard = elseGuard;
  };

  Skew.ObjectSymbol = function(kind, name) {
    Skew.Symbol.call(this, kind, name);
    this.$extends = null;
    this.$implements = null;
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

  Skew.ObjectSymbol.prototype.hasInterface = function(symbol) {
    return this.interfaceTypes != null && this.interfaceTypes.some(function(type) {
      return type.symbol == symbol;
    });
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

  Skew.FunctionSymbol.prototype.clone = function() {
    var clone = new Skew.FunctionSymbol(this.kind, this.name);
    var symbols = {};
    clone._cloneFrom(this);

    if (this.state == Skew.SymbolState.INITIALIZED) {
      clone.resolvedType = new Skew.Type(Skew.TypeKind.SYMBOL, clone);
      clone.resolvedType.returnType = this.resolvedType.returnType;
      clone.resolvedType.argumentTypes = this.resolvedType.argumentTypes.slice();
      clone.argumentOnlyType = this.argumentOnlyType;
    }

    if (this.parameters != null) {
      clone.parameters = [];

      for (var i = 0, list = this.parameters, count = list.length; i < count; i = i + 1 | 0) {
        var parameter = in_List.get(list, i);
        var cloned = parameter.clone();
        symbols[parameter.id] = cloned;
        clone.parameters.push(cloned);
      }
    }

    for (var i1 = 0, list1 = this.$arguments, count1 = list1.length; i1 < count1; i1 = i1 + 1 | 0) {
      var argument = in_List.get(list1, i1);
      var cloned1 = argument.clone();
      symbols[argument.id] = cloned1;
      clone.$arguments.push(cloned1);
    }

    if (this.returnType != null) {
      clone.returnType = this.returnType.clone();
    }

    if (this.block != null) {
      clone.block = this.block.clone();
      Skew.Symbol._substituteSymbols(clone.block, symbols);
    }

    return clone;
  };

  Skew.VariableSymbol = function(kind, name) {
    Skew.Symbol.call(this, kind, name);
    this.type = null;
    this.value = null;
  };

  __extends(Skew.VariableSymbol, Skew.Symbol);

  Skew.VariableSymbol.prototype.clone = function() {
    var clone = new Skew.VariableSymbol(this.kind, this.name);
    clone._cloneFrom(this);
    clone.resolvedType = this.resolvedType;

    if (this.type != null) {
      clone.type = this.type.clone();
    }

    if (this.value != null) {
      clone.value = this.value.clone();
      Skew.Symbol._substituteSymbols(clone.value, in_IntMap.insert({}, this.id, clone));
    }

    return clone;
  };

  Skew.VariableSymbol.prototype.initializeWithType = function(target) {
    assert(this.state == Skew.SymbolState.UNINITIALIZED);
    assert(this.type == null);
    assert(this.resolvedType == null);
    this.state = Skew.SymbolState.INITIALIZED;
    this.resolvedType = target;
    this.type = new Skew.Node(Skew.NodeKind.TYPE).withType(target);
  };

  Skew.OverloadedFunctionSymbol = function(kind, name, symbols) {
    Skew.Symbol.call(this, kind, name);
    this.symbols = symbols;
  };

  __extends(Skew.OverloadedFunctionSymbol, Skew.Symbol);

  Skew.FuzzySymbolKind = {
    EVERYTHING: 0,
    TYPE_ONLY: 1,
    GLOBAL_ONLY: 2,
    INSTANCE_ONLY: 3
  };

  Skew.FuzzySymbolMatcher = function(name, kind) {
    this._name = null;
    this._kind = 0;
    this._bestScore = 0;
    this._bestMatch = null;
    this._name = name;
    this._kind = kind;
    this._bestScore = name.length * 0.5;
    this._bestMatch = null;
  };

  Skew.FuzzySymbolMatcher.prototype.include = function(match) {
    if (this._kind == Skew.FuzzySymbolKind.INSTANCE_ONLY && !Skew.in_SymbolKind.isOnInstances(match.kind) || this._kind == Skew.FuzzySymbolKind.GLOBAL_ONLY && Skew.in_SymbolKind.isOnInstances(match.kind) || this._kind == Skew.FuzzySymbolKind.TYPE_ONLY && !Skew.in_SymbolKind.isType(match.kind) || match.state == Skew.SymbolState.INITIALIZING) {
      return;
    }

    var score = Skew.caseAwareLevenshteinEditDistance(this._name, match.name);

    if (score <= this._bestScore && score <= match.name.length * 0.5) {
      this._bestScore = score;
      this._bestMatch = match;
    }
  };

  Skew.FuzzySymbolMatcher.prototype.bestSoFar = function() {
    return this._bestMatch;
  };

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
    ASSIGN_NULL: 11,
    ASSIGN_PLUS: 12,
    ASSIGN_POWER: 13,
    ASSIGN_REMAINDER: 14,
    ASSIGN_SHIFT_LEFT: 15,
    ASSIGN_SHIFT_RIGHT: 16,
    ASSIGN_UNSIGNED_SHIFT_RIGHT: 17,
    BITWISE_AND: 18,
    BITWISE_OR: 19,
    BITWISE_XOR: 20,
    BREAK: 21,
    CASE: 22,
    CATCH: 23,
    CHARACTER: 24,
    COLON: 25,
    COMMA: 26,
    COMMENT: 27,
    COMMENT_ERROR: 28,
    COMPARE: 29,
    CONST: 30,
    CONTINUE: 31,
    DECREMENT: 32,
    DEFAULT: 33,
    DIVIDE: 34,
    DOT: 35,
    DOT_DOT: 36,
    DOUBLE: 37,
    DOUBLE_COLON: 38,
    DYNAMIC: 39,
    ELSE: 40,
    END_OF_FILE: 41,
    EQUAL: 42,
    ERROR: 43,
    FALSE: 44,
    FINALLY: 45,
    FOR: 46,
    GREATER_THAN: 47,
    GREATER_THAN_OR_EQUAL: 48,
    IDENTIFIER: 49,
    IF: 50,
    IN: 51,
    INCREMENT: 52,
    INDEX: 53,
    INT: 54,
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
    NEWLINE: 70,
    NOT: 71,
    NOT_EQUAL: 72,
    NULL: 73,
    NULL_DOT: 74,
    NULL_JOIN: 75,
    PLUS: 76,
    POWER: 77,
    QUESTION_MARK: 78,
    REMAINDER: 79,
    RETURN: 80,
    RIGHT_BRACE: 81,
    RIGHT_BRACKET: 82,
    RIGHT_PARENTHESIS: 83,
    SEMICOLON: 84,
    SET: 85,
    SET_NEW: 86,
    SHIFT_LEFT: 87,
    SHIFT_RIGHT: 88,
    STRING: 89,
    SUPER: 90,
    SWITCH: 91,
    THROW: 92,
    TILDE: 93,
    TRUE: 94,
    TRY: 95,
    UNSIGNED_SHIFT_RIGHT: 96,
    VAR: 97,
    WHILE: 98,
    WHITESPACE: 99,
    XML_CHILD: 100,
    XML_END_EMPTY: 101,
    XML_START_CLOSE: 102,
    YY_INVALID_ACTION: 103,

    // Type parameters are surrounded by "<" and ">"
    PARAMETER_LIST_END: 104,
    PARAMETER_LIST_START: 105,

    // XML entities are surrounded by "<" and ">" (or "</" and "/>" but those are defined by flex)
    XML_END: 106,
    XML_START: 107,

    // String interpolation looks like "start\( 1 )continue( 2 )end"
    STRING_INTERPOLATION_CONTINUE: 108,
    STRING_INTERPOLATION_END: 109,
    STRING_INTERPOLATION_START: 110
  };

  Skew.DiagnosticKind = {
    ERROR: 0,
    WARNING: 1
  };

  Skew.Fix = function(range, description, replacement) {
    this.range = range;
    this.description = description;
    this.replacement = replacement;
  };

  Skew.Diagnostic = function(kind, range, text) {
    this.kind = kind;
    this.range = range;
    this.text = text;
    this.noteRange = null;
    this.noteText = '';
    this.fixes = null;
  };

  // Syntax warnings can be thought of as linting
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
    this.errorCount = this.errorCount + 1 | 0;
  };

  Skew.Log.prototype.warning = function(range, text) {
    this.diagnostics.push(new Skew.Diagnostic(Skew.DiagnosticKind.WARNING, range, text));
    this.warningCount = this.warningCount + 1 | 0;
  };

  Skew.Log.prototype.fix = function(range, description, replacement) {
    var ref;

    if (range != null) {
      ((ref = in_List.last(this.diagnostics)).fixes != null ? ref.fixes : ref.fixes = []).push(new Skew.Fix(range, description, replacement));
    }
  };

  Skew.Log.prototype.note = function(range, text) {
    var last = in_List.last(this.diagnostics);
    last.noteRange = range;
    last.noteText = text;
  };

  Skew.Log.prototype.syntaxWarningOctal = function(range) {
    var text = range.toString();
    this.warning(range, 'Number interpreted as decimal (use the prefix "0o" for octal numbers)');

    while (in_string.startsWith(text, '0')) {
      text = in_string.slice1(text, 1);
    }

    this.fix(range, 'Remove the leading zeros to avoid confusion', text);
    this.fix(range, 'Add the prefix "0o" to interpret the number as octal', '0o' + text);
  };

  Skew.Log.prototype.syntaxWarningExtraParentheses = function(range) {
    var text = range.toString();
    this.warning(range, 'Unnecessary parentheses');
    this.fix(range, 'Remove parentheses', in_string.slice2(text, 1, text.length - 1 | 0));
  };

  Skew.Log.prototype.syntaxWarningExtraComma = function(range) {
    this.warning(range, 'Unnecessary comma');
    this.fix(range, 'Remove comma', '');
  };

  Skew.Log.prototype.syntaxErrorInvalidEscapeSequence = function(range) {
    this.error(range, 'Invalid escape sequence');
  };

  Skew.Log.prototype.syntaxErrorInvalidCharacter = function(range) {
    this.error(range, 'Use double quotes for strings (single quotes are for character literals)');
    this.fix(range, 'Replace single quotes with double quotes', Skew.replaceSingleQuotesWithDoubleQuotes(range.toString()));
  };

  Skew.Log.prototype.syntaxErrorExtraData = function(range, text) {
    this.error(range, 'Syntax error "' + (text == '"' ? '\\"' : text) + '"');
  };

  Skew.Log.prototype.syntaxErrorSlashComment = function(range) {
    var text = range.toString();
    var last = text.length - 1 | 0;
    assert(in_string.startsWith(text, '//'));

    if (in_string.get1(text, last) == 10) {
      text = in_string.slice2(text, 0, last);
      range = range.fromStart(last);
    }

    this.error(range, 'Comments start with "#" instead of "//"');
    this.fix(range, 'Replace "//" with "#"', '#' + in_string.slice1(text, 2));
  };

  Skew.Log.prototype.syntaxErrorUnexpectedToken = function(token) {
    this.error(token.range, 'Unexpected ' + Skew.in_TokenKind.toString(token.kind));
  };

  Skew.Log.prototype.syntaxErrorExpectedToken = function(range, found, expected) {
    this.error(range, 'Expected ' + Skew.in_TokenKind.toString(expected) + ' but found ' + Skew.in_TokenKind.toString(found));
  };

  Skew.Log.prototype.syntaxErrorEmptyFunctionParentheses = function(range) {
    this.error(range, 'Functions without arguments do not use parentheses');
    this.fix(range, 'Remove parentheses', '');
  };

  Skew.Log.prototype.syntaxErrorBadDeclarationInsideType = function(range) {
    this.error(range, 'Cannot use this declaration here');
  };

  Skew.Log.prototype.syntaxErrorBadOperatorCustomization = function(range, kind, why) {
    this.error(range, 'The ' + Skew.in_TokenKind.toString(kind) + ' operator is not customizable because ' + why);
  };

  Skew.Log.prototype.syntaxErrorVariableDeclarationNeedsVar = function(range, name) {
    this.error(range, 'Declare variables using "var" and put the type after the variable name');
    this.fix(Skew.Range.span(range, name), 'Declare "' + name.toString() + '" correctly', 'var ' + name.toString() + ' ' + range.toString());
  };

  Skew.Log.prototype.syntaxErrorXMLClosingTagMismatch = function(range, found, expected, openingRange) {
    this.error(range, 'Expected "' + expected + '" but found "' + found + '" in XML literal');

    if (openingRange != null) {
      this.note(openingRange, 'Attempted to match opening tag here');
    }
  };

  Skew.Log.prototype.syntaxErrorOptionalArgument = function(range) {
    this.error(range, "Optional arguments aren't supported yet");
  };

  Skew.Log._expectedCountText = function(singular, expected, found) {
    return 'Expected ' + Skew.PrettyPrint.plural1(expected, singular) + ' but found ' + Skew.PrettyPrint.plural1(found, singular);
  };

  Skew.Log._formatArgumentTypes = function(types) {
    if (types == null) {
      return '';
    }

    var names = [];

    for (var i = 0, list = types, count = list.length; i < count; i = i + 1 | 0) {
      var type = in_List.get(list, i);
      names.push(type.toString());
    }

    return ' of type' + (types.length == 1 ? '' : 's') + ' ' + Skew.PrettyPrint.join(names, 'and');
  };

  Skew.Log.prototype.semanticWarningInliningFailed = function(range, name) {
    this.warning(range, 'Cannot inline function "' + name + '"');
  };

  Skew.Log.prototype.semanticWarningIdenticalOperands = function(range, operator) {
    this.warning(range, 'Both sides of "' + operator + '" are identical, is this a bug?');
  };

  Skew.Log.prototype.semanticWarningShiftByZero = function(range) {
    this.warning(range, "Shifting an integer by zero doesn't do anything, is this a bug?");
  };

  Skew.Log.prototype.semanticWarningUnusedExpression = function(range) {
    this.warning(range, 'Unused expression');
  };

  Skew.Log.prototype.semanticErrorXMLMissingAppend = function(range, type) {
    this.error(range, 'Implement a function called "<>...</>" on type "' + type.toString() + '" to add support for child elements');
  };

  Skew.Log.prototype.semanticErrorComparisonOperatorNotInt = function(range) {
    this.error(range, 'The comparison operator must have a return type of "int"');
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

  Skew.Log.prototype.semanticErrorUndeclaredSymbol = function(range, name, correction, correctionRange) {
    this.error(range, '"' + name + '" is not declared' + (correction != null ? ', did you mean "' + correction + '"?' : ''));

    if (correction != null && correctionRange != null) {
      this.fix(range, 'Replace with "' + correction + '"', correction);
      this.note(correctionRange, '"' + correction + '" is defined here');
    }
  };

  Skew.Log.prototype.semanticErrorUndeclaredSelfSymbol = function(range, name) {
    this.error(range, '"' + name + '" is not declared (use "self" to refer to the object instance)');
  };

  Skew.Log.prototype.semanticErrorUnknownMemberSymbol = function(range, name, type, correction, correctionRange) {
    this.error(range, '"' + name + '" is not declared on type "' + type.toString() + '"' + (correction != null ? ', did you mean "' + correction + '"?' : ''));

    if (correction != null && correctionRange != null) {
      this.fix(range, 'Replace with "' + correction + '"', correction);
      this.note(correctionRange, '"' + correction + '" is defined here');
    }
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
    this.error(range, 'Cannot parameterize "' + type.toString() + '"' + (type.isParameterized() ? ' because it is already parameterized' : ' because it has no type parameters'));
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
    this.fix(range != null ? range.rangeIncludingLeftWhitespace() : null, 'Remove the return type', '');
  };

  Skew.Log.prototype.semanticErrorNoMatchingOverload = function(range, name, count, types) {
    this.error(range, 'No overload of "' + name + '" was found that takes ' + Skew.PrettyPrint.plural1(count, 'argument') + Skew.Log._formatArgumentTypes(types));
  };

  Skew.Log.prototype.semanticErrorAmbiguousOverload = function(range, name, count, types) {
    this.error(range, 'Multiple matching overloads of "' + name + '" were found that can take ' + Skew.PrettyPrint.plural1(count, 'argument') + Skew.Log._formatArgumentTypes(types));
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
    this.fix(range != null ? range.rangeIncludingLeftWhitespace() : null, 'Remove the cast', '');
  };

  Skew.Log.prototype.semanticWarningExtraTypeCheck = function(range, from, to) {
    this.warning(range, 'Unnecessary type check, type "' + from.toString() + '" is always type "' + to.toString() + '"');
  };

  Skew.Log.prototype.semanticWarningBadTypeCheck = function(range, type) {
    this.error(range, 'Cannot check against interface type "' + type.toString() + '"');
  };

  Skew.Log.prototype.semanticErrorWrongArgumentCount = function(range, name, count) {
    this.error(range, 'Expected "' + name + '" to take ' + Skew.PrettyPrint.plural1(count, 'argument'));
  };

  Skew.Log.prototype.semanticErrorWrongArgumentCountRange = function(range, name, values) {
    assert(!(values.length == 0));
    var first = in_List.first(values);
    var count = values.length;

    if (count == 1) {
      this.semanticErrorWrongArgumentCount(range, name, first);
    }

    else {
      var counts = [];
      var min = first;
      var max = first;

      for (var i = 0, list = values, count1 = list.length; i < count1; i = i + 1 | 0) {
        var value = in_List.get(list, i);
        min = Math.min(min, value);
        max = Math.max(max, value);
        counts.push(value.toString());
      }

      // Assuming values are unique, this means all values form a continuous range
      if (((max - min | 0) + 1 | 0) == count) {
        if (min == 0) {
          this.error(range, 'Expected "' + name + '" to take at most ' + Skew.PrettyPrint.plural1(max, 'argument'));
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

  Skew.Log.prototype.semanticWarningDuplicateAnnotation = function(range, annotation, name) {
    this.warning(range, 'Duplicate annotation "' + annotation + '" on "' + name + '"');
  };

  Skew.Log.prototype.semanticWarningRedundantAnnotation = function(range, annotation, name, parent) {
    this.warning(range, 'Redundant annotation "' + annotation + '" on "' + name + '" is already inherited from type "' + parent + '"');
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

  Skew.Log.prototype.semanticErrorInitializerRecursiveExpansion = function(range, newRange) {
    this.error(range, 'Attempting to resolve this literal led to recursive expansion');

    if (newRange != null) {
      this.note(newRange, 'The constructor that was called recursively is here');
    }
  };

  Skew.Log.prototype.semanticErrorXMLCannotConstruct = function(range, type) {
    this.error(range, 'Cannot construct type "' + type.toString() + '"');
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

  Skew.Log.prototype.semanticErrorBadInterfaceImplementationReturnType = function(range, name, found, expected, interfaceType, reason) {
    if (found != null && expected != null) {
      this.error(range, 'Function "' + name + '" has unexpected return type "' + found.toString() + '", expected return type "' + expected.toString() + '" ' + ('to match the function with the same name and argument types from interface "' + interfaceType.toString() + '"'));
    }

    else {
      this.error(range, 'Expected the return type of function "' + name + '" to match the function with the same name and argument types from interface "' + interfaceType.toString() + '"');
    }

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

  Skew.Log.prototype.semanticErrorMustCallFunction = function(range, name, lower, upper) {
    if (lower == upper) {
      this.error(range, 'The function "' + name + '" takes ' + Skew.PrettyPrint.plural1(lower, 'argument') + ' and must be called');
    }

    else {
      this.error(range, 'The function "' + name + '" takes between ' + lower.toString() + ' and ' + upper.toString() + ' arguments and must be called');
    }
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

  Skew.Log.prototype.semanticErrorUnimplementedFunction = function(range, name) {
    this.error(range, 'Non-imported function "' + name + '" is missing an implementation (use the "@import" annotation if it\'s implemented externally)');
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

  Skew.Log.prototype.semanticErrorTooManyFlags = function(range, name) {
    this.error(range, 'The type "' + name + '" cannot have more than 32 flags');
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

  Skew.Parsing = {};

  // Parser recovery is done by skipping to the next closing token after an error
  Skew.Parsing.scanForToken = function(context, kind) {
    if (context.expect(kind)) {
      return;
    }

    // Scan forward for the token
    while (!context.peek(Skew.TokenKind.END_OF_FILE)) {
      if (context.eat(kind)) {
        return;
      }

      switch (context.current().kind) {
        case Skew.TokenKind.RIGHT_PARENTHESIS:
        case Skew.TokenKind.RIGHT_BRACKET:
        case Skew.TokenKind.RIGHT_BRACE: {
          return;
        }

        case Skew.TokenKind.BREAK:
        case Skew.TokenKind.CATCH:
        case Skew.TokenKind.CONST:
        case Skew.TokenKind.CONTINUE:
        case Skew.TokenKind.ELSE:
        case Skew.TokenKind.FINALLY:
        case Skew.TokenKind.FOR:
        case Skew.TokenKind.IF:
        case Skew.TokenKind.RETURN:
        case Skew.TokenKind.TRY:
        case Skew.TokenKind.VAR:
        case Skew.TokenKind.WHILE: {
          return;
        }
      }

      context.next();
    }
  };

  Skew.Parsing.parseIntLiteral = function(log, range) {
    var text = range.toString();

    // Parse negative signs for use with the "--define" flag
    var isNegative = in_string.startsWith(text, '-');
    var start = isNegative | 0;
    var count = text.length;
    var value = 0;
    var base = 10;

    // Parse the base
    if ((start + 2 | 0) < count && in_string.get1(text, start) == 48) {
      var c = in_string.get1(text, start + 1 | 0);

      if (c == 98) {
        base = 2;
        start = start + 2 | 0;
      }

      else if (c == 111) {
        base = 8;
        start = start + 2 | 0;
      }

      else if (c == 120) {
        base = 16;
        start = start + 2 | 0;
      }
    }

    // There must be numbers after the base
    if (start == count) {
      return null;
    }

    // Special-case hexadecimal since it's more complex
    if (base == 16) {
      for (var i = start, count1 = text.length; i < count1; i = i + 1 | 0) {
        var c1 = in_string.get1(text, i);

        if ((c1 < 48 || c1 > 57) && (c1 < 65 || c1 > 70) && (c1 < 97 || c1 > 102)) {
          return null;
        }

        value = (__imul(value, 16) + c1 | 0) - (c1 <= 57 ? 48 : c1 <= 70 ? 65 - 10 | 0 : 97 - 10 | 0) | 0;
      }
    }

    // All other bases are zero-relative
    else {
      for (var i1 = start, count2 = text.length; i1 < count2; i1 = i1 + 1 | 0) {
        var c2 = in_string.get1(text, i1);

        if (c2 < 48 || c2 >= (48 + base | 0)) {
          return null;
        }

        value = (__imul(value, base) + c2 | 0) - 48 | 0;
      }
    }

    // Warn about decimal integers that start with "0" because other languages
    // strangely treat these numbers as octal instead of decimal
    if (base == 10 && value != 0 && in_string.get1(text, 0) == 48) {
      log.syntaxWarningOctal(range);
    }

    return new Box(isNegative ? -value | 0 : value);
  };

  Skew.Parsing.checkExtraParentheses = function(context, node) {
    if (node.isInsideParentheses()) {
      context.log.syntaxWarningExtraParentheses(node.range);
    }
  };

  Skew.Parsing.parseLeadingComments = function(context) {
    var comments = null;

    while (context.peek(Skew.TokenKind.COMMENT)) {
      var range = context.next().range;

      if (comments == null) {
        comments = [];
      }

      comments.push(in_string.slice2(range.source.contents, range.start + 1 | 0, range.end));

      // Ignore blocks of comments with extra lines afterward
      if (context.eat(Skew.TokenKind.NEWLINE)) {
        comments = null;
      }
    }

    return comments;
  };

  Skew.Parsing.parseTrailingComment = function(context, comments) {
    if (!context.peek(Skew.TokenKind.COMMENT)) {
      return null;
    }

    var range = context.next().range;

    if (comments == null) {
      comments = [];
    }

    var text = in_string.slice2(range.source.contents, range.start + 1 | 0, range.end);

    if (!in_string.endsWith(text, '\n')) {
      text += '\n';
    }

    comments.push(text);
    return comments;
  };

  Skew.Parsing.parseAnnotations = function(context, annotations) {
    while (context.peek(Skew.TokenKind.ANNOTATION)) {
      var range = context.next().range;
      var value = new Skew.Node(Skew.NodeKind.NAME).withContent(new Skew.StringContent(range.toString())).withRange(range);

      // Change "@foo.bar.baz" into "foo.bar.@baz"
      if (context.peek(Skew.TokenKind.DOT)) {
        var root = value.asString();
        value.content = new Skew.StringContent(in_string.slice1(root, 1));

        while (context.eat(Skew.TokenKind.DOT)) {
          var name = context.current().range;

          if (!context.expect(Skew.TokenKind.IDENTIFIER)) {
            break;
          }

          value = new Skew.Node(Skew.NodeKind.DOT).withContent(new Skew.StringContent(name.toString())).appendChild(value).withRange(context.spanSince(range)).withInternalRange(name);
        }

        value.content = new Skew.StringContent('@' + value.asString());
      }

      // Parse parentheses if present
      var token = context.current();

      if (context.eat(Skew.TokenKind.LEFT_PARENTHESIS)) {
        var call = Skew.Node.createCall(value);
        Skew.Parsing.parseCommaSeparatedList(context, call, Skew.TokenKind.RIGHT_PARENTHESIS);
        value = call.withRange(context.spanSince(range)).withInternalRange(context.spanSince(token.range));
      }

      // Parse a trailing if condition
      var test = null;

      if (context.eat(Skew.TokenKind.IF)) {
        test = Skew.Parsing.expressionParser.parse(context, Skew.Precedence.LOWEST);
      }

      // All annotations must end in a newline to avoid confusion with the trailing if
      if (!context.peek(Skew.TokenKind.LEFT_BRACE) && !context.expect(Skew.TokenKind.NEWLINE)) {
        Skew.Parsing.scanForToken(context, Skew.TokenKind.NEWLINE);
      }

      annotations.push(Skew.Node.createAnnotation(value, test).withRange(context.spanSince(range)));
    }

    return annotations;
  };

  // When the type is present, this parses something like "int x = 0"
  Skew.Parsing.parseVariables = function(context, type) {
    var variables = new Skew.Node(Skew.NodeKind.VARIABLES);
    var token = context.current();

    // Skip "var" or "const" if present
    if (type == null) {
      context.next();
    }

    while (true) {
      var range = context.current().range;

      if (!context.expect(Skew.TokenKind.IDENTIFIER)) {
        return null;
      }

      var symbol = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_LOCAL, range.toString());
      symbol.range = range;

      if (token.kind == Skew.TokenKind.CONST) {
        symbol.flags |= Skew.SymbolFlags.IS_CONST;
      }

      if (type != null) {
        symbol.type = type.clone();
      }

      else if (Skew.Parsing.peekType(context)) {
        symbol.type = Skew.Parsing.typeParser.parse(context, Skew.Precedence.LOWEST);
      }

      if (context.eat(Skew.TokenKind.ASSIGN)) {
        symbol.value = Skew.Parsing.expressionParser.parse(context, Skew.Precedence.LOWEST);
      }

      variables.appendChild(Skew.Node.createVariable(symbol).withRange(context.spanSince(range)));

      if (!context.eat(Skew.TokenKind.COMMA)) {
        break;
      }
    }

    return variables.withRange(context.spanSince(type != null ? type.range : token.range));
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
      Skew.Parsing.checkExtraParentheses(context, value);
    }

    return Skew.Node.createReturn(value).withRange(context.spanSince(token.range));
  };

  Skew.Parsing.parseSwitch = function(context) {
    var token = context.next();
    var value = Skew.Parsing.expressionParser.parse(context, Skew.Precedence.LOWEST);
    Skew.Parsing.checkExtraParentheses(context, value);
    var node = Skew.Node.createSwitch(value);
    context.skipWhitespace();

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

      if (context.eat(Skew.TokenKind.DOT_DOT)) {
        var second = Skew.Parsing.expressionParser.parse(context, Skew.Precedence.LOWEST);
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
      }

      if (context.eat(Skew.TokenKind.ASSIGN)) {
        symbol1.value = Skew.Parsing.expressionParser.parse(context, Skew.Precedence.LOWEST);
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

    if (!context.expect(Skew.TokenKind.SEMICOLON)) {
      return null;
    }

    var update = Skew.Parsing.expressionParser.parse(context, Skew.Precedence.LOWEST);

    // This is the one place in the grammar that sequence expressions are allowed
    if (context.eat(Skew.TokenKind.COMMA)) {
      update = new Skew.Node(Skew.NodeKind.SEQUENCE).appendChild(update);

      while (true) {
        var value1 = Skew.Parsing.expressionParser.parse(context, Skew.Precedence.LOWEST);
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
        return Skew.Parsing.parseVariables(context, null);
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
    Skew.Parsing.checkExtraParentheses(context, value);

    // A special case for better errors when users try to use C-style variable declarations
    if (!value.isInsideParentheses() && Skew.Parsing.looksLikeType(value) && context.peek(Skew.TokenKind.IDENTIFIER) && context.canReportSyntaxError()) {
      context.log.syntaxErrorVariableDeclarationNeedsVar(value.range, context.current().range);
      return Skew.Parsing.parseVariables(context, value);
    }

    var node = Skew.Node.createExpression(value).withRange(value.range);
    return node;
  };

  Skew.Parsing.looksLikeType = function(node) {
    var kind = node.kind;
    return kind == Skew.NodeKind.NAME || kind == Skew.NodeKind.TYPE || kind == Skew.NodeKind.LAMBDA_TYPE || kind == Skew.NodeKind.DOT && node.dotTarget() != null && Skew.Parsing.looksLikeType(node.dotTarget()) || kind == Skew.NodeKind.PARAMETERIZE && Skew.Parsing.looksLikeType(node.parameterizeValue());
  };

  Skew.Parsing.parseStatements = function(context, parent) {
    var previous = null;
    context.eat(Skew.TokenKind.NEWLINE);

    while (!context.peek(Skew.TokenKind.RIGHT_BRACE) && !context.peek(Skew.TokenKind.XML_START_CLOSE)) {
      var comments = Skew.Parsing.parseLeadingComments(context);

      // Ignore trailing comments
      if (context.peek(Skew.TokenKind.RIGHT_BRACE) || context.peek(Skew.TokenKind.XML_START_CLOSE) || context.peek(Skew.TokenKind.END_OF_FILE)) {
        break;
      }

      // Merge "else" statements with the previous "if"
      if (context.peek(Skew.TokenKind.ELSE)) {
        var isValid = previous != null && previous.kind == Skew.NodeKind.IF && previous.ifFalse() == null;

        if (!isValid) {
          context.unexpectedToken();
        }

        context.next();

        // Match "else if"
        if (context.peek(Skew.TokenKind.IF)) {
          var statement = Skew.Parsing.parseIf(context);

          if (statement == null) {
            return false;
          }

          // Append to the if statement
          var falseBlock = new Skew.Node(Skew.NodeKind.BLOCK).withRange(statement.range).appendChild(statement);
          falseBlock.comments = comments;

          if (isValid) {
            previous.appendChild(falseBlock);
            previous = statement;
          }

          else {
            previous = null;
          }
        }

        // Match "else"
        else {
          var falseBlock1 = Skew.Parsing.parseBlock(context);

          if (falseBlock1 == null) {
            return false;
          }

          // Append to the if statement
          falseBlock1.comments = comments;

          if (isValid) {
            previous.appendChild(falseBlock1);
            previous = falseBlock1;
          }

          else {
            previous = null;
          }
        }
      }

      // Merge "catch" statements with the previous "try"
      else if (context.peek(Skew.TokenKind.CATCH)) {
        var isValid1 = previous != null && previous.kind == Skew.NodeKind.TRY && previous.finallyBlock() == null;

        if (!isValid1) {
          context.unexpectedToken();
        }

        var catchToken = context.next();
        var symbol = null;
        var nameRange = context.current().range;

        // Optional typed variable
        if (context.eat(Skew.TokenKind.IDENTIFIER)) {
          symbol = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_LOCAL, nameRange.toString());
          symbol.range = nameRange;
          symbol.type = Skew.Parsing.typeParser.parse(context, Skew.Precedence.LOWEST);
        }

        // Parse the block
        var catchBlock = Skew.Parsing.parseBlock(context);

        if (catchBlock == null) {
          return false;
        }

        // Append to the try statement
        var child = Skew.Node.createCatch(symbol, catchBlock).withRange(context.spanSince(catchToken.range));
        child.comments = comments;

        if (isValid1) {
          previous.appendChild(child);
        }

        else {
          previous = null;
        }
      }

      // Merge "finally" statements with the previous "try"
      else if (context.peek(Skew.TokenKind.FINALLY)) {
        var isValid2 = previous != null && previous.kind == Skew.NodeKind.TRY && previous.finallyBlock() == null;

        if (!isValid2) {
          context.unexpectedToken();
        }

        context.next();

        // Parse the block
        var finallyBlock = Skew.Parsing.parseBlock(context);

        if (finallyBlock == null) {
          return false;
        }

        // Append to the try statement
        finallyBlock.comments = comments;

        if (isValid2) {
          previous.appendChild(finallyBlock);
        }

        else {
          previous = null;
        }
      }

      // Parse a new statement
      else {
        var current = context.current();
        var statement1 = Skew.Parsing.parseStatement(context);

        if (statement1 == null) {
          Skew.Parsing.scanForToken(context, Skew.TokenKind.NEWLINE);
          continue;
        }

        // Prevent an infinite loop due to a syntax error at the start of an expression
        if (context.current() == current) {
          context.next();
        }

        // There is a well-known bug in JavaScript where a return statement
        // followed by a newline and a value is parsed as two statements,
        // a return statement without a value and an expression statement.
        // This is dumb so don't do this. Parse this as a single return
        // statement with a value instead.
        if (previous != null && previous.kind == Skew.NodeKind.RETURN && previous.returnValue() == null && statement1.kind == Skew.NodeKind.EXPRESSION) {
          previous.appendChild(statement1.expressionValue().remove());
        }

        else {
          previous = statement1;
          statement1.comments = comments;
          parent.appendChild(statement1);
        }
      }

      // Parse trailing comments and/or newline
      comments = Skew.Parsing.parseTrailingComment(context, comments);

      if (comments != null) {
        if (previous != null) {
          previous.comments = comments;
        }

        context.eat(Skew.TokenKind.NEWLINE);
      }

      else if (context.peek(Skew.TokenKind.RIGHT_BRACE) || context.peek(Skew.TokenKind.XML_START_CLOSE)) {
        break;
      }

      else if (!context.peek(Skew.TokenKind.ELSE) && !context.peek(Skew.TokenKind.CATCH) && !context.peek(Skew.TokenKind.FINALLY)) {
        context.expect(Skew.TokenKind.NEWLINE);
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
        symbol.block = new Skew.Node(Skew.NodeKind.BLOCK).withRange(value.range).appendChild(Skew.Node.createReturn(value).withRange(value.range).withFlags(Skew.NodeFlags.IS_IMPLICIT_RETURN));
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
        usingTypes = true;
      }

      // Optional arguments aren't supported yet
      var assign = context.current().range;

      if (context.eat(Skew.TokenKind.ASSIGN)) {
        Skew.Parsing.expressionParser.parse(context, Skew.Precedence.LOWEST);
        context.log.syntaxErrorOptionalArgument(context.spanSince(assign));
      }

      symbol.$arguments.push(arg);
    }

    return true;
  };

  Skew.Parsing.parseFunctionReturnTypeAndBlock = function(context, symbol) {
    if (Skew.Parsing.peekType(context)) {
      symbol.returnType = Skew.Parsing.typeParser.parse(context, Skew.Precedence.LOWEST);
    }

    if (context.eat(Skew.TokenKind.NEWLINE) && !context.peek(Skew.TokenKind.LEFT_BRACE)) {
      context.undo();
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

    if (!context.expect(Skew.TokenKind.PARAMETER_LIST_END)) {
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
    }

    if (!context.expect(Skew.TokenKind.LEFT_BRACE)) {
      return null;
    }

    var contents = new Skew.ObjectSymbol(parent.kind, '<conditional>');
    contents.flags |= Skew.SymbolFlags.IS_GUARD_CONDITIONAL;
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
    var text = token.range.toString();
    var symbol = null;

    // Special-case enum and flags symbols
    if (Skew.in_SymbolKind.isEnumOrFlags(parent.kind) && token.kind == Skew.TokenKind.IDENTIFIER && !(text in Skew.Parsing.identifierToSymbolKind)) {
      while (true) {
        if (text in Skew.Parsing.identifierToSymbolKind || !context.expect(Skew.TokenKind.IDENTIFIER)) {
          break;
        }

        var variable = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_ENUM_OR_FLAGS, text);
        variable.range = token.range;
        variable.parent = parent;
        variable.flags |= Skew.SymbolFlags.IS_CONST;
        parent.variables.push(variable);
        symbol = variable;
        var comma = context.current();

        if (!context.eat(Skew.TokenKind.COMMA)) {
          break;
        }

        variable.annotations = annotations != null ? annotations.slice() : null;
        variable.comments = comments;
        token = context.current();
        text = token.range.toString();

        if (context.peek(Skew.TokenKind.NEWLINE) || context.peek(Skew.TokenKind.RIGHT_BRACE)) {
          context.log.syntaxWarningExtraComma(comma.range);
          break;
        }
      }
    }

    else {
      // Parse the symbol kind
      var kind = 0;

      switch (token.kind) {
        case Skew.TokenKind.CONST:
        case Skew.TokenKind.VAR: {
          kind = Skew.in_SymbolKind.hasInstances(parent.kind) ? Skew.SymbolKind.VARIABLE_INSTANCE : Skew.SymbolKind.VARIABLE_GLOBAL;
          break;
        }

        case Skew.TokenKind.IDENTIFIER: {
          kind = in_StringMap.get(Skew.Parsing.identifierToSymbolKind, text, Skew.SymbolKind.OBJECT_GLOBAL);

          if (kind == Skew.SymbolKind.OBJECT_GLOBAL) {
            context.unexpectedToken();
            return false;
          }

          if (kind == Skew.SymbolKind.FUNCTION_GLOBAL && Skew.in_SymbolKind.hasInstances(parent.kind)) {
            kind = Skew.SymbolKind.FUNCTION_INSTANCE;
          }
          break;
        }

        default: {
          context.unexpectedToken();
          return false;
        }
      }

      context.next();
      var nameToken = context.current();
      var range = nameToken.range;
      var name = range.toString();
      var isOperator = false;

      // Only check for custom operators for instance functions
      if (kind == Skew.SymbolKind.FUNCTION_INSTANCE) {
        if (nameToken.kind in Skew.Parsing.customOperators) {
          isOperator = true;
        }

        else if (nameToken.kind in Skew.Parsing.forbiddenCustomOperators) {
          context.log.syntaxErrorBadOperatorCustomization(range, nameToken.kind, in_IntMap.get1(Skew.Parsing.forbiddenGroupDescription, in_IntMap.get1(Skew.Parsing.forbiddenCustomOperators, nameToken.kind)));
          isOperator = true;
        }
      }

      // Parse the symbol name
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
          while (true) {
            var variable1 = new Skew.VariableSymbol(kind, name);
            variable1.range = range;
            variable1.parent = parent;

            if (token.kind == Skew.TokenKind.CONST) {
              variable1.flags |= Skew.SymbolFlags.IS_CONST;
            }

            if (Skew.Parsing.peekType(context)) {
              variable1.type = Skew.Parsing.typeParser.parse(context, Skew.Precedence.LOWEST);
            }

            if (context.eat(Skew.TokenKind.ASSIGN)) {
              variable1.value = Skew.Parsing.expressionParser.parse(context, Skew.Precedence.LOWEST);
              Skew.Parsing.checkExtraParentheses(context, variable1.value);
            }

            parent.variables.push(variable1);

            if (!context.eat(Skew.TokenKind.COMMA)) {
              symbol = variable1;
              break;
            }

            variable1.annotations = annotations != null ? annotations.slice() : null;
            variable1.comments = comments;
            nameToken = context.current();
            range = nameToken.range;
            name = range.toString();

            if (!context.expect(Skew.TokenKind.IDENTIFIER)) {
              return false;
            }
          }
          break;
        }

        case Skew.SymbolKind.FUNCTION_ANNOTATION:
        case Skew.SymbolKind.FUNCTION_CONSTRUCTOR:
        case Skew.SymbolKind.FUNCTION_GLOBAL:
        case Skew.SymbolKind.FUNCTION_INSTANCE: {
          var $function = new Skew.FunctionSymbol(kind, name);
          $function.range = range;
          $function.parent = parent;

          if (text == 'over') {
            $function.flags |= Skew.SymbolFlags.IS_OVER;
          }

          // Check for setters like "def foo=(x int) {}" but don't allow a space
          // between the name and the assignment operator
          if (kind != Skew.SymbolKind.FUNCTION_ANNOTATION && nameToken.kind == Skew.TokenKind.IDENTIFIER && context.peek(Skew.TokenKind.ASSIGN) && context.current().range.start == nameToken.range.end) {
            $function.range = Skew.Range.span($function.range, context.next().range);
            $function.flags |= Skew.SymbolFlags.IS_SETTER;
            $function.name += '=';
          }

          // Parse type parameters
          if (context.eat(Skew.TokenKind.PARAMETER_LIST_START)) {
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
            $function.flags |= Skew.SymbolFlags.IS_GETTER;
          }

          parent.functions.push($function);
          symbol = $function;
          break;
        }

        case Skew.SymbolKind.OBJECT_CLASS:
        case Skew.SymbolKind.OBJECT_ENUM:
        case Skew.SymbolKind.OBJECT_FLAGS:
        case Skew.SymbolKind.OBJECT_INTERFACE:
        case Skew.SymbolKind.OBJECT_NAMESPACE:
        case Skew.SymbolKind.OBJECT_WRAPPED: {
          var object = new Skew.ObjectSymbol(kind, name);
          object.range = range;
          object.parent = parent;

          if (kind != Skew.SymbolKind.OBJECT_NAMESPACE && context.eat(Skew.TokenKind.PARAMETER_LIST_START)) {
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
              object.$implements = [];

              while (true) {
                var type = Skew.Parsing.typeParser.parse(context, Skew.Precedence.LOWEST);
                object.$implements.push(type);

                if (!context.eat(Skew.TokenKind.COMMA)) {
                  break;
                }
              }
            }

            context.skipWhitespace();

            if (!context.expect(Skew.TokenKind.LEFT_BRACE)) {
              Skew.Parsing.scanForToken(context, Skew.TokenKind.LEFT_BRACE);
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

      // Forbid certain kinds of symbols inside certain object types
      if ((Skew.in_SymbolKind.isEnumOrFlags(parent.kind) || parent.kind == Skew.SymbolKind.OBJECT_WRAPPED || parent.kind == Skew.SymbolKind.OBJECT_INTERFACE) && (kind == Skew.SymbolKind.FUNCTION_CONSTRUCTOR || kind == Skew.SymbolKind.VARIABLE_INSTANCE)) {
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
        Skew.Parsing.scanForToken(context, stop);
        break;
      }

      var value = Skew.Parsing.expressionParser.parse(context, Skew.Precedence.LOWEST);
      parent.appendChild(value);
      context.skipWhitespace();
      isFirst = false;
    }
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

  Skew.Parsing.createStringNode = function(log, range) {
    return new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.StringContent(Skew.Parsing.parseStringLiteral(log, range))).withRange(range);
  };

  Skew.Parsing.parseStringLiteral = function(log, range) {
    var text = range.toString();
    var count = text.length;
    assert(count >= 2);
    assert(in_string.get1(text, 0) == 34 || in_string.get1(text, 0) == 39 || in_string.get1(text, 0) == 41);
    assert(in_string.get1(text, count - 1 | 0) == 34 || in_string.get1(text, count - 1 | 0) == 39 || in_string.get1(text, count - 1 | 0) == 40);
    var builder = new StringBuilder();
    var start = 1;
    var stop = count - (in_string.get1(text, count - 1 | 0) == 40 ? 2 : 1) | 0;
    var i = start;

    while (i < stop) {
      var c = in_string.get1(text, (i = i + 1 | 0) + -1 | 0);

      if (c == 92) {
        var escape = i - 1 | 0;
        builder.append(in_string.slice2(text, start, escape));

        if (i < stop) {
          c = in_string.get1(text, (i = i + 1 | 0) + -1 | 0);

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

          else if (c == 48) {
            builder.append('\0');
            start = i;
          }

          else if (c == 92 || c == 34 || c == 39) {
            builder.append(String.fromCharCode(c));
            start = i;
          }

          else if (c == 120) {
            if (i < stop) {
              var c0 = Skew.Parsing.parseHexCharacter(in_string.get1(text, (i = i + 1 | 0) + -1 | 0));

              if (i < stop) {
                var c1 = Skew.Parsing.parseHexCharacter(in_string.get1(text, (i = i + 1 | 0) + -1 | 0));

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

    builder.append(in_string.slice2(text, start, i));
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
    pratt.prefix(Skew.TokenKind.INCREMENT, Skew.Precedence.UNARY_PREFIX, Skew.Parsing.unaryPrefix(Skew.NodeKind.PREFIX_INCREMENT));
    pratt.prefix(Skew.TokenKind.DECREMENT, Skew.Precedence.UNARY_PREFIX, Skew.Parsing.unaryPrefix(Skew.NodeKind.PREFIX_DECREMENT));
    pratt.postfix(Skew.TokenKind.INCREMENT, Skew.Precedence.UNARY_PREFIX, Skew.Parsing.unaryPostfix(Skew.NodeKind.POSTFIX_INCREMENT));
    pratt.postfix(Skew.TokenKind.DECREMENT, Skew.Precedence.UNARY_PREFIX, Skew.Parsing.unaryPostfix(Skew.NodeKind.POSTFIX_DECREMENT));
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
    pratt.infixRight(Skew.TokenKind.ASSIGN_NULL, Skew.Precedence.ASSIGN, Skew.Parsing.binaryInfix(Skew.NodeKind.ASSIGN_NULL));
    pratt.infixRight(Skew.TokenKind.ASSIGN_PLUS, Skew.Precedence.ASSIGN, Skew.Parsing.binaryInfix(Skew.NodeKind.ASSIGN_ADD));
    pratt.infixRight(Skew.TokenKind.ASSIGN_POWER, Skew.Precedence.ASSIGN, Skew.Parsing.binaryInfix(Skew.NodeKind.ASSIGN_POWER));
    pratt.infixRight(Skew.TokenKind.ASSIGN_REMAINDER, Skew.Precedence.ASSIGN, Skew.Parsing.binaryInfix(Skew.NodeKind.ASSIGN_REMAINDER));
    pratt.infixRight(Skew.TokenKind.ASSIGN_SHIFT_LEFT, Skew.Precedence.ASSIGN, Skew.Parsing.binaryInfix(Skew.NodeKind.ASSIGN_SHIFT_LEFT));
    pratt.infixRight(Skew.TokenKind.ASSIGN_SHIFT_RIGHT, Skew.Precedence.ASSIGN, Skew.Parsing.binaryInfix(Skew.NodeKind.ASSIGN_SHIFT_RIGHT));
    pratt.infixRight(Skew.TokenKind.ASSIGN_UNSIGNED_SHIFT_RIGHT, Skew.Precedence.ASSIGN, Skew.Parsing.binaryInfix(Skew.NodeKind.ASSIGN_UNSIGNED_SHIFT_RIGHT));
    pratt.infixRight(Skew.TokenKind.NULL_JOIN, Skew.Precedence.NULL_JOIN, Skew.Parsing.binaryInfix(Skew.NodeKind.NULL_JOIN));
    pratt.parselet(Skew.TokenKind.DOT, Skew.Precedence.MEMBER).infix = Skew.Parsing.dotInfixParselet;
    pratt.parselet(Skew.TokenKind.INDEX, Skew.Precedence.LOWEST).prefix = Skew.Parsing.initializerParselet;
    pratt.parselet(Skew.TokenKind.LEFT_BRACE, Skew.Precedence.LOWEST).prefix = Skew.Parsing.initializerParselet;
    pratt.parselet(Skew.TokenKind.LEFT_BRACKET, Skew.Precedence.LOWEST).prefix = Skew.Parsing.initializerParselet;
    pratt.parselet(Skew.TokenKind.LIST_NEW, Skew.Precedence.LOWEST).prefix = Skew.Parsing.initializerParselet;
    pratt.parselet(Skew.TokenKind.SET_NEW, Skew.Precedence.LOWEST).prefix = Skew.Parsing.initializerParselet;
    pratt.parselet(Skew.TokenKind.PARAMETER_LIST_START, Skew.Precedence.MEMBER).infix = Skew.Parsing.parameterizedParselet;

    // String interpolation
    pratt.parselet(Skew.TokenKind.STRING_INTERPOLATION_START, Skew.Precedence.LOWEST).prefix = function(context) {
      var token = context.next();
      var node = new Skew.Node(Skew.NodeKind.STRING_INTERPOLATION).appendChild(Skew.Parsing.createStringNode(context.log, token.range));

      while (true) {
        var value = Skew.Parsing.expressionParser.parse(context, Skew.Precedence.LOWEST);
        node.appendChild(value);
        context.skipWhitespace();
        token = context.current();

        if (!context.eat(Skew.TokenKind.STRING_INTERPOLATION_CONTINUE) && !context.expect(Skew.TokenKind.STRING_INTERPOLATION_END)) {
          return context.createParseError();
        }

        node.appendChild(Skew.Parsing.createStringNode(context.log, token.range));

        if (token.kind == Skew.TokenKind.STRING_INTERPOLATION_END) {
          break;
        }
      }

      return node.withRange(context.spanSince(node.firstChild().range));
    };

    // "x?.y"
    pratt.parselet(Skew.TokenKind.NULL_DOT, Skew.Precedence.MEMBER).infix = function(context, left) {
      context.next();
      var range = context.current().range;

      if (!context.expect(Skew.TokenKind.IDENTIFIER)) {
        return context.createParseError();
      }

      return new Skew.Node(Skew.NodeKind.NULL_DOT).withContent(new Skew.StringContent(range.toString())).appendChild(left).withRange(context.spanSince(left.range)).withInternalRange(range);
    };

    // Lambda expressions like "=> x"
    pratt.parselet(Skew.TokenKind.ARROW, Skew.Precedence.LOWEST).prefix = function(context) {
      var token = context.current();
      var symbol = new Skew.FunctionSymbol(Skew.SymbolKind.FUNCTION_LOCAL, '<lambda>');

      if (!Skew.Parsing.parseFunctionBlock(context, symbol)) {
        return context.createParseError();
      }

      symbol.range = context.spanSince(token.range);
      return Skew.Node.createLambda(symbol).withRange(symbol.range);
    };

    // Cast expressions
    pratt.parselet(Skew.TokenKind.AS, Skew.Precedence.UNARY_PREFIX).infix = function(context, left) {
      var token = context.next();
      var type = Skew.Parsing.typeParser.parse(context, Skew.Precedence.LOWEST);
      return Skew.Node.createCast(left, type).withRange(context.spanSince(left.range)).withInternalRange(token.range);
    };

    // Using "." as a unary prefix operator accesses members off the inferred type
    pratt.parselet(Skew.TokenKind.DOT, Skew.Precedence.MEMBER).prefix = function(context) {
      var token = context.next();
      var range = context.current().range;

      if (!context.expect(Skew.TokenKind.IDENTIFIER)) {
        return context.createParseError();
      }

      return new Skew.Node(Skew.NodeKind.DOT).withContent(new Skew.StringContent(range.toString())).appendChild(null).withRange(context.spanSince(token.range)).withInternalRange(range);
    };

    // Access members off of "dynamic" for untyped globals
    pratt.parselet(Skew.TokenKind.DYNAMIC, Skew.Precedence.LOWEST).prefix = function(context) {
      var token = context.next();

      if (!context.expect(Skew.TokenKind.DOT)) {
        return context.createParseError();
      }

      var range = context.current().range;

      if (!context.expect(Skew.TokenKind.IDENTIFIER)) {
        return context.createParseError();
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
          return context.createParseError();
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
      return Skew.Node.createTypeCheck(left, type).withRange(context.spanSince(left.range)).withInternalRange(token.range);
    };

    // Index expressions
    pratt.parselet(Skew.TokenKind.LEFT_BRACKET, Skew.Precedence.MEMBER).infix = function(context, left) {
      var token = context.next();
      var right = Skew.Parsing.expressionParser.parse(context, Skew.Precedence.LOWEST);
      Skew.Parsing.scanForToken(context, Skew.TokenKind.RIGHT_BRACKET);
      return Skew.Node.createIndex(left, right).withRange(context.spanSince(left.range)).withInternalRange(context.spanSince(token.range));
    };

    // Parenthetic groups and lambda expressions like "() => x"
    pratt.parselet(Skew.TokenKind.LEFT_PARENTHESIS, Skew.Precedence.LOWEST).prefix = function(context) {
      var token = context.next();

      // Try to parse a group
      if (!context.peek(Skew.TokenKind.RIGHT_PARENTHESIS)) {
        var value = pratt.parse(context, Skew.Precedence.LOWEST);

        if ((value.kind != Skew.NodeKind.NAME || !Skew.Parsing.peekType(context)) && context.eat(Skew.TokenKind.RIGHT_PARENTHESIS)) {
          if (value.kind != Skew.NodeKind.NAME || !context.peek(Skew.TokenKind.ARROW)) {
            return value.withRange(context.spanSince(token.range)).withFlags(Skew.NodeFlags.IS_INSIDE_PARENTHESES);
          }

          context.undo();
        }

        context.undo();
      }

      // Parse a lambda instead
      var symbol = new Skew.FunctionSymbol(Skew.SymbolKind.FUNCTION_LOCAL, '<lambda>');

      if (!Skew.Parsing.parseFunctionArguments(context, symbol) || !Skew.Parsing.parseFunctionReturnTypeAndBlock(context, symbol)) {
        return context.createParseError();
      }

      symbol.range = context.spanSince(token.range);
      return Skew.Node.createLambda(symbol).withRange(symbol.range);
    };

    // Call expressions
    pratt.parselet(Skew.TokenKind.LEFT_PARENTHESIS, Skew.Precedence.UNARY_POSTFIX).infix = function(context, left) {
      var node = Skew.Node.createCall(left);
      var token = context.next();
      Skew.Parsing.parseCommaSeparatedList(context, node, Skew.TokenKind.RIGHT_PARENTHESIS);
      return node.withRange(context.spanSince(left.range)).withInternalRange(context.spanSince(token.range));
    };

    // Hook expressions
    pratt.parselet(Skew.TokenKind.QUESTION_MARK, Skew.Precedence.ASSIGN).infix = function(context, left) {
      context.next();
      var middle = pratt.parse(context, Skew.Precedence.ASSIGN - 1 | 0);

      if (!context.expect(Skew.TokenKind.COLON)) {
        return context.createParseError();
      }

      var right = pratt.parse(context, Skew.Precedence.ASSIGN - 1 | 0);
      return Skew.Node.createHook(left, middle, right).withRange(context.spanSince(left.range));
    };

    // XML literals
    pratt.parselet(Skew.TokenKind.XML_START, Skew.Precedence.LOWEST).prefix = function(context) {
      var token = context.next();
      var tag = Skew.Parsing.parseDotChain(context);

      if (tag == null) {
        Skew.Parsing.scanForToken(context, Skew.TokenKind.XML_END);
        return context.createParseError();
      }

      var attributes = new Skew.Node(Skew.NodeKind.SEQUENCE);

      // Parse attributes
      context.skipWhitespace();

      while (context.peek(Skew.TokenKind.IDENTIFIER)) {
        var name = Skew.Parsing.parseDotChain(context);
        var assignment = context.current();
        var kind = in_IntMap.get(Skew.Parsing.assignmentOperators, assignment.kind, Skew.NodeKind.NULL);

        if (kind == Skew.NodeKind.NULL) {
          context.expect(Skew.TokenKind.ASSIGN);
          Skew.Parsing.scanForToken(context, Skew.TokenKind.XML_END);
          return context.createParseError();
        }

        context.next();
        var value = Skew.Parsing.expressionParser.parse(context, Skew.Precedence.UNARY_PREFIX - 1 | 0);
        attributes.appendChild(Skew.Node.createBinary(kind, name, value).withRange(context.spanSince(name.range)).withInternalRange(assignment.range));
        context.skipWhitespace();
      }

      // Parse end of tag
      var block = new Skew.Node(Skew.NodeKind.BLOCK);
      var closingTag = null;
      context.skipWhitespace();

      // Check for children
      if (!context.eat(Skew.TokenKind.XML_END_EMPTY)) {
        if (!context.expect(Skew.TokenKind.XML_END)) {
          Skew.Parsing.scanForToken(context, Skew.TokenKind.XML_END);
          return context.createParseError();
        }

        // Parse children
        context.skipWhitespace();

        if (!Skew.Parsing.parseStatements(context, block) || !context.expect(Skew.TokenKind.XML_START_CLOSE)) {
          return context.createParseError();
        }

        block.withRange(context.spanSince(token.range));

        // Parse closing tag
        closingTag = Skew.Parsing.parseDotChain(context);

        if (closingTag == null) {
          Skew.Parsing.scanForToken(context, Skew.TokenKind.XML_END);
          return context.createParseError();
        }

        context.skipWhitespace();

        if (!context.expect(Skew.TokenKind.XML_END)) {
          Skew.Parsing.scanForToken(context, Skew.TokenKind.XML_END);
          return context.createParseError();
        }

        // Validate closing tag (not a fatal error)
        if (!tag.looksTheSameAs(closingTag)) {
          context.log.syntaxErrorXMLClosingTagMismatch(closingTag.range, Skew.Parsing.dotChainToString(closingTag), Skew.Parsing.dotChainToString(tag), tag.range);
        }
      }

      return Skew.Node.createXML(tag, attributes, block, closingTag).withRange(context.spanSince(token.range));
    };
    return pratt;
  };

  Skew.Parsing.dotChainToString = function(node) {
    assert(node.kind == Skew.NodeKind.NAME || node.kind == Skew.NodeKind.DOT);

    if (node.kind == Skew.NodeKind.NAME) {
      return node.asString();
    }

    return Skew.Parsing.dotChainToString(node.dotTarget()) + '.' + node.asString();
  };

  Skew.Parsing.parseDotChain = function(context) {
    var current = context.current();

    if (!context.expect(Skew.TokenKind.IDENTIFIER)) {
      return null;
    }

    var chain = new Skew.Node(Skew.NodeKind.NAME).withContent(new Skew.StringContent(current.range.toString())).withRange(current.range);

    while (context.eat(Skew.TokenKind.DOT)) {
      current = context.current();

      if (!context.expect(Skew.TokenKind.IDENTIFIER)) {
        return null;
      }

      chain = new Skew.Node(Skew.NodeKind.DOT).withContent(new Skew.StringContent(current.range.toString())).appendChild(chain).withRange(context.spanSince(chain.range)).withInternalRange(current.range);
    }

    return chain;
  };

  Skew.Parsing.createTypeParser = function() {
    var pratt = new Skew.Pratt();
    pratt.literal(Skew.TokenKind.DYNAMIC, function(context, token) {
      return new Skew.Node(Skew.NodeKind.TYPE).withType(Skew.Type.DYNAMIC).withRange(token.range);
    });
    pratt.parselet(Skew.TokenKind.DOT, Skew.Precedence.MEMBER).infix = Skew.Parsing.dotInfixParselet;
    pratt.parselet(Skew.TokenKind.PARAMETER_LIST_START, Skew.Precedence.MEMBER).infix = Skew.Parsing.parameterizedParselet;

    // Name expressions or lambda type expressions like "fn(int) int"
    pratt.parselet(Skew.TokenKind.IDENTIFIER, Skew.Precedence.LOWEST).prefix = function(context) {
      var node = new Skew.Node(Skew.NodeKind.LAMBDA_TYPE).appendChild(new Skew.Node(Skew.NodeKind.TYPE).withType(Skew.Type.NULL));
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
          Skew.Parsing.scanForToken(context, Skew.TokenKind.RIGHT_PARENTHESIS);
          return context.createParseError();
        }

        node.insertChildBefore(returnType, Skew.Parsing.typeParser.parse(context, Skew.Precedence.LOWEST));
        isFirst = false;
      }

      // Parse return type if present
      if (Skew.Parsing.peekType(context)) {
        returnType.replaceWith(Skew.Parsing.typeParser.parse(context, Skew.Precedence.LOWEST));
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
    return new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.IntContent(Skew.Parsing.parseIntLiteral(context.log, token.range).value)).withRange(token.range);
  };

  Skew.Parsing.stringLiteral = function(context, token) {
    return Skew.Parsing.createStringNode(context.log, token.range);
  };

  Skew.Parsing.ForbiddenGroup = {
    ASSIGN: 0,
    COMPARE: 1,
    EQUAL: 2,
    LOGICAL: 3
  };

  Skew.ParserContext = function(log, _tokens) {
    this.log = log;
    this.inNonVoidFunction = false;
    this._tokens = _tokens;
    this._index = 0;
    this._previousSyntaxError = -1;
  };

  Skew.ParserContext.prototype.current = function() {
    return in_List.get(this._tokens, this._index);
  };

  Skew.ParserContext.prototype.next = function() {
    var token = this.current();

    if ((this._index + 1 | 0) < this._tokens.length) {
      this._index = this._index + 1 | 0;
    }

    return token;
  };

  Skew.ParserContext.prototype.spanSince = function(range) {
    var previous = in_List.get(this._tokens, this._index > 0 ? this._index - 1 | 0 : 0);
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
    this._index = this._index - 1 | 0;
  };

  Skew.ParserContext.prototype.expect = function(kind) {
    if (!this.eat(kind)) {
      if (this.canReportSyntaxError()) {
        this.log.syntaxErrorExpectedToken(this.current().range, this.current().kind, kind);
      }

      return false;
    }

    return true;
  };

  Skew.ParserContext.prototype.unexpectedToken = function() {
    if (this.canReportSyntaxError()) {
      this.log.syntaxErrorUnexpectedToken(this.current());
    }
  };

  Skew.ParserContext.prototype.createParseError = function() {
    return new Skew.Node(Skew.NodeKind.PARSE_ERROR).withRange(this.current().range);
  };

  Skew.ParserContext.prototype.canReportSyntaxError = function() {
    if (this._previousSyntaxError != this._index) {
      this._previousSyntaxError = this._index;
      return true;
    }

    return false;
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
      return context.createParseError();
    }

    var node = this.resume(context, precedence, parselet.prefix(context));

    // Parselets must set the range of every node
    assert(node != null && node.range != null);
    return node;
  };

  Skew.Pratt.prototype.resume = function(context, precedence, left) {
    while (true) {
      var kind = context.current().kind;
      var parselet = in_IntMap.get(this._table, kind, null);

      if (parselet == null || parselet.infix == null || parselet.precedence <= precedence) {
        break;
      }

      left = parselet.infix(context, left);

      // Parselets must set the range of every node
      assert(left != null && left.range != null);
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
      return callback(context, token, self.parse(context, precedence));
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
      return callback(context, left, token, self.parse(context, precedence));
    };
  };

  Skew.Pratt.prototype.infixRight = function(kind, precedence, callback) {
    var self = this;
    self.parselet(kind, precedence).infix = function(context, left) {
      var token = context.next();

      // Subtract 1 for right-associativity
      return callback(context, left, token, self.parse(context, precedence - 1 | 0));
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
    return in_string.slice2(this.source.contents, this.start, this.end);
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
        for (var space = 0, count1 = 8 - codePoints.length % 8 | 0; space < count1; space = space + 1 | 0) {
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
        line = in_string.fromCodePoints(in_List.slice2(codePoints, 0, maxLength - 3 | 0)) + '...';

        if (b > (maxLength - 3 | 0)) {
          b = maxLength - 3 | 0;
        }
      }

      // Right aligned
      else if ((count - a | 0) < (maxLength - centeredStart | 0)) {
        var offset = count - maxLength | 0;
        line = '...' + in_string.fromCodePoints(in_List.slice2(codePoints, offset + 3 | 0, count));
        a = a - offset | 0;
        b = b - offset | 0;
      }

      // Center aligned
      else {
        var offset1 = a - centeredStart | 0;
        line = '...' + in_string.fromCodePoints(in_List.slice2(codePoints, offset1 + 3 | 0, (offset1 + maxLength | 0) - 3 | 0)) + '...';
        a = a - offset1 | 0;
        b = b - offset1 | 0;

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

  Skew.Range.prototype.rangeIncludingLeftWhitespace = function() {
    var index = this.start;
    var contents = this.source.contents;

    while (index > 0) {
      var c = in_string.get1(contents, index - 1 | 0);

      if (c != 32 && c != 9) {
        break;
      }

      index = index - 1 | 0;
    }

    return new Skew.Range(this.source, index, this.end);
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

    var start = in_List.get(this._lineOffsets, line);
    var end = (line + 1 | 0) < this._lineOffsets.length ? in_List.get(this._lineOffsets, line + 1 | 0) - 1 | 0 : this.contents.length;
    return in_string.slice2(this.contents, start, end);
  };

  Skew.Source.prototype.indexToLineColumn = function(index) {
    this._computeLineOffsets();

    // Binary search to find the line
    var count = this._lineOffsets.length;
    var line = 0;

    while (count > 0) {
      var step = count / 2 | 0;
      var i = line + step | 0;

      if (in_List.get(this._lineOffsets, i) <= index) {
        line = i + 1 | 0;
        count = (count - step | 0) - 1 | 0;
      }

      else {
        count = step;
      }
    }

    // Use the line to compute the column
    var column = line > 0 ? index - in_List.get(this._lineOffsets, line - 1 | 0) | 0 : index;
    return new Skew.LineColumn(line - 1 | 0, column);
  };

  Skew.Source.prototype._computeLineOffsets = function() {
    if (this._lineOffsets == null) {
      this._lineOffsets = [0];

      for (var i = 0, count = this.contents.length; i < count; i = i + 1 | 0) {
        if (in_string.get1(this.contents, i) == 10) {
          this._lineOffsets.push(i + 1 | 0);
        }
      }
    }
  };

  Skew.Token = function(range, kind) {
    this.range = range;
    this.kind = kind;
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
    return in_List.get(this.callInfo, in_IntMap.get1(this.symbolToInfoIndex, symbol.id));
  };

  Skew.CallGraph.prototype._visitObject = function(symbol) {
    for (var i = 0, list = symbol.objects, count = list.length; i < count; i = i + 1 | 0) {
      var object = in_List.get(list, i);
      this._visitObject(object);
    }

    for (var i1 = 0, list1 = symbol.functions, count1 = list1.length; i1 < count1; i1 = i1 + 1 | 0) {
      var $function = in_List.get(list1, i1);
      this._recordCallSite($function, null, null);
      this._visitNode($function.block, $function);
    }

    for (var i2 = 0, list2 = symbol.variables, count2 = list2.length; i2 < count2; i2 = i2 + 1 | 0) {
      var variable = in_List.get(list2, i2);
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
    var info = index < 0 ? new Skew.CallInfo(symbol) : in_List.get(this.callInfo, index);

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

  Skew.CompilerTarget.prototype.stopAfterResolve = function() {
    return true;
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

  Skew.JavaScriptTarget = function() {
    Skew.CompilerTarget.call(this);
  };

  __extends(Skew.JavaScriptTarget, Skew.CompilerTarget);

  Skew.JavaScriptTarget.prototype.stopAfterResolve = function() {
    return false;
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

  Skew.CSharpTarget.prototype.stopAfterResolve = function() {
    return false;
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

  Skew.CPlusPlusTarget.prototype.stopAfterResolve = function() {
    return false;
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

  Skew.LispTreeTarget = function() {
    Skew.CompilerTarget.call(this);
  };

  __extends(Skew.LispTreeTarget, Skew.CompilerTarget);

  Skew.LispTreeTarget.prototype.createEmitter = function(context) {
    return new Skew.LispTreeEmitter(context.options);
  };

  Skew.Define = function(name, value) {
    this.name = name;
    this.value = value;
  };

  Skew.CompilerOptions = function() {
    var self = this;
    self.defines = Object.create(null);
    self.foldAllConstants = false;
    self.globalizeAllFunctions = false;
    self.inlineAllFunctions = false;
    self.isAlwaysInlinePresent = false;
    self.jsMangle = false;
    self.jsMinify = false;
    self.jsSourceMap = false;
    self.stopAfterResolve = false;
    self.verbose = false;
    self.outputDirectory = null;
    self.outputFile = null;
    self.target = new Skew.CompilerTarget();
    self.passes = null;
    self.passes = [
      new Skew.LexingPass(),
      new Skew.ParsingPass(),
      new Skew.MergingPass(),
      new Skew.ResolvingPass(),
      new Skew.LambdaConversionPass().onlyRunWhen(function() {
        return self._continueAfterResolve() && self.target.needsLambdaLifting();
      }),
      new Skew.InterfaceRemovalPass().onlyRunWhen(function() {
        return self._continueAfterResolve() && self.target.removeSingletonInterfaces() && self.globalizeAllFunctions;
      }),
      // The call graph is used as a shortcut so the tree only needs to be scanned once for all call-based optimizations
      new Skew.CallGraphPass().onlyRunWhen(function() {
        return self._continueAfterResolve();
      }),
      new Skew.GlobalizingPass().onlyRunWhen(function() {
        return self._continueAfterResolve();
      }),
      new Skew.MotionPass().onlyRunWhen(function() {
        return self._continueAfterResolve();
      }),
      new Skew.RenamingPass().onlyRunWhen(function() {
        return self._continueAfterResolve();
      }),
      new Skew.FoldingPass().onlyRunWhen(function() {
        return self._continueAfterResolve() && self.foldAllConstants;
      }),
      new Skew.InliningPass().onlyRunWhen(function() {
        return self._continueAfterResolve() && (self.inlineAllFunctions || self.isAlwaysInlinePresent);
      }),
      new Skew.FoldingPass().onlyRunWhen(function() {
        return self._continueAfterResolve() && (self.inlineAllFunctions || self.isAlwaysInlinePresent) && self.foldAllConstants;
      }),
      new Skew.EmittingPass().onlyRunWhen(function() {
        return !self.stopAfterResolve;
      })
    ];
  };

  Skew.CompilerOptions.prototype.define = function(name, value) {
    var range = new Skew.Source('<internal>', '--define:' + name + '=' + value).entireRange();
    this.defines[name] = new Skew.Define(range.slice(9, 9 + name.length | 0), range.fromEnd(value.length));
  };

  Skew.CompilerOptions.prototype._continueAfterResolve = function() {
    return !this.stopAfterResolve && !this.target.stopAfterResolve();
  };

  Skew.CompilerOptions.prototype.createTargetFromExtension = function() {
    if (this.outputFile != null) {
      var dot = this.outputFile.lastIndexOf('.');

      if (dot != -1) {
        switch (in_string.slice1(this.outputFile, dot + 1 | 0)) {
          case 'cpp':
          case 'cxx':
          case 'cc': {
            this.target = new Skew.CPlusPlusTarget();
            break;
          }

          case 'cs': {
            this.target = new Skew.CSharpTarget();
            break;
          }

          case 'js': {
            this.target = new Skew.JavaScriptTarget();
            break;
          }

          default: {
            return false;
          }
        }

        return true;
      }
    }

    return false;
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

  Skew.Timer.prototype.elapsedSeconds = function() {
    return this._totalSeconds;
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
    this.isResolvePassComplete = false;
  };

  Skew.PassContext.prototype.verify = function() {
    this._verifyHierarchy1(this.global);
  };

  Skew.PassContext.prototype._verifySymbol = function(symbol) {
    var ref;

    if (!this.isResolvePassComplete) {
      return;
    }

    // Special-case nested guards that aren't initialized when the outer guard has errors
    if (symbol.state != Skew.SymbolState.INITIALIZED) {
      assert(Skew.in_SymbolKind.isObject(symbol.kind));
      assert(symbol.isGuardConditional());
      assert(this.log.errorCount > 0);
      return;
    }

    assert(symbol.state == Skew.SymbolState.INITIALIZED);
    assert(symbol.resolvedType != null);

    if (Skew.in_SymbolKind.isObject(symbol.kind) || Skew.in_SymbolKind.isFunction(symbol.kind) || Skew.in_SymbolKind.isParameter(symbol.kind)) {
      if (symbol.resolvedType == Skew.Type.DYNAMIC) {
        // Ignore errors due to cyclic declarations
        assert(this.log.errorCount > 0);
      }

      else {
        assert(symbol.resolvedType.kind == Skew.TypeKind.SYMBOL);
        assert(symbol.resolvedType.symbol == symbol);
      }
    }

    if (Skew.in_SymbolKind.isFunction(symbol.kind) && symbol.resolvedType.kind == Skew.TypeKind.SYMBOL) {
      var $function = symbol.asFunctionSymbol();
      assert(symbol.resolvedType.returnType == ((ref = $function.returnType) != null ? ref.resolvedType : null));
      assert(symbol.resolvedType.argumentTypes.length == $function.$arguments.length);

      for (var i = 0, count = $function.$arguments.length; i < count; i = i + 1 | 0) {
        assert(in_List.get(symbol.resolvedType.argumentTypes, i) == in_List.get($function.$arguments, i).resolvedType);
      }
    }

    if (Skew.in_SymbolKind.isVariable(symbol.kind)) {
      assert(symbol.resolvedType == symbol.asVariableSymbol().type.resolvedType);
    }
  };

  Skew.PassContext.prototype._verifyHierarchy1 = function(symbol) {
    this._verifySymbol(symbol);

    for (var i1 = 0, list1 = symbol.objects, count1 = list1.length; i1 < count1; i1 = i1 + 1 | 0) {
      var object = in_List.get(list1, i1);
      assert(object.parent == symbol);
      this._verifyHierarchy1(object);

      if (object.$extends != null) {
        this._verifyHierarchy2(object.$extends, null);
      }

      if (object.$implements != null) {
        for (var i = 0, list = object.$implements, count = list.length; i < count; i = i + 1 | 0) {
          var node = in_List.get(list, i);
          this._verifyHierarchy2(node, null);
        }
      }
    }

    for (var i2 = 0, list2 = symbol.functions, count2 = list2.length; i2 < count2; i2 = i2 + 1 | 0) {
      var $function = in_List.get(list2, i2);
      assert($function.parent == symbol);
      this._verifySymbol($function);

      if ($function.block != null) {
        this._verifyHierarchy2($function.block, null);
      }
    }

    for (var i3 = 0, list3 = symbol.variables, count3 = list3.length; i3 < count3; i3 = i3 + 1 | 0) {
      var variable = in_List.get(list3, i3);
      assert(variable.parent == symbol);
      this._verifySymbol(variable);
      assert(variable.state != Skew.SymbolState.INITIALIZED || variable.type != null);

      if (variable.type != null) {
        this._verifyHierarchy2(variable.type, null);
      }

      if (variable.value != null) {
        this._verifyHierarchy2(variable.value, null);
      }
    }

    if (symbol.guards != null) {
      for (var i4 = 0, list4 = symbol.guards, count4 = list4.length; i4 < count4; i4 = i4 + 1 | 0) {
        var guard = in_List.get(list4, i4);
        this._verifyHierarchy3(guard, symbol);
      }
    }
  };

  Skew.PassContext.prototype._verifyHierarchy2 = function(node, parent) {
    assert(node.parent() == parent);

    // All expressions must have a type after the type resolution pass
    if (this.isResolvePassComplete && Skew.in_NodeKind.isExpression(node.kind)) {
      assert(node.resolvedType != null);
    }

    if (node.kind == Skew.NodeKind.VARIABLE) {
      assert(node.symbol != null);
      assert(node.symbol.kind == Skew.SymbolKind.VARIABLE_LOCAL);
      var variable = node.symbol.asVariableSymbol();
      assert(variable.value == node.variableValue());
      this._verifySymbol(variable);
      assert(variable.state != Skew.SymbolState.INITIALIZED || variable.type != null);

      if (variable.type != null) {
        this._verifyHierarchy2(variable.type, null);
      }
    }

    else if (node.kind == Skew.NodeKind.LAMBDA) {
      assert(node.symbol != null);
      assert(node.symbol.kind == Skew.SymbolKind.FUNCTION_LOCAL);
      assert(node.symbol.asFunctionSymbol().block == node.lambdaBlock());
      this._verifySymbol(node.symbol);
    }

    for (var child = node.firstChild(); child != null; child = child.nextSibling()) {
      this._verifyHierarchy2(child, node);
    }
  };

  Skew.PassContext.prototype._verifyHierarchy3 = function(guard, parent) {
    assert(guard.parent == parent);
    assert(guard.contents.parent == parent);

    if (guard.test != null) {
      this._verifyHierarchy2(guard.test, null);
    }

    this._verifyHierarchy1(guard.contents);

    if (guard.elseGuard != null) {
      this._verifyHierarchy3(guard.elseGuard, parent);
    }
  };

  Skew.Pass = function() {
    this._shouldRun = null;
  };

  Skew.Pass.prototype.shouldRun = function() {
    return this._shouldRun != null ? this._shouldRun() : true;
  };

  Skew.Pass.prototype.onlyRunWhen = function(callback) {
    this._shouldRun = callback;
    return this;
  };

  Skew.ParsingPass = function() {
    Skew.Pass.call(this);
  };

  __extends(Skew.ParsingPass, Skew.Pass);

  Skew.ParsingPass.prototype.kind = function() {
    return Skew.PassKind.PARSING;
  };

  Skew.ParsingPass.prototype.run = function(context) {
    for (var i = 0, list = context.tokens, count = list.length; i < count; i = i + 1 | 0) {
      var tokens = in_List.get(list, i);
      Skew.Parsing.parseFile(context.log, tokens, context.global);
    }
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

  Skew.LexingPass = function() {
    Skew.Pass.call(this);
  };

  __extends(Skew.LexingPass, Skew.Pass);

  Skew.LexingPass.prototype.kind = function() {
    return Skew.PassKind.LEXING;
  };

  Skew.LexingPass.prototype.run = function(context) {
    for (var i = 0, list = context.inputs, count = list.length; i < count; i = i + 1 | 0) {
      var source = in_List.get(list, i);
      context.tokens.push(Skew.tokenize(context.log, source));
    }
  };

  Skew.PassTimer = function(kind) {
    this.kind = kind;
    this.timer = new Skew.Timer();
  };

  Skew.StatisticsKind = {
    SHORT: 0,
    LONG: 1
  };

  Skew.CompilerResult = function(cache, global, outputs, passTimers, totalTimer) {
    this.cache = cache;
    this.global = global;
    this.outputs = outputs;
    this.passTimers = passTimers;
    this.totalTimer = totalTimer;
  };

  Skew.CompilerResult.prototype.statistics = function(inputs, kind) {
    var builder = new StringBuilder();
    var totalTime = this.totalTimer.elapsedSeconds();
    var sourceStatistics = function(name, sources) {
      var totalBytes = 0;
      var totalLines = 0;

      for (var i = 0, list = sources, count = list.length; i < count; i = i + 1 | 0) {
        var source = in_List.get(list, i);
        totalBytes = totalBytes + source.contents.length | 0;

        if (kind == Skew.StatisticsKind.LONG) {
          totalLines = totalLines + source.lineCount() | 0;
        }
      }

      builder.append(name + (sources.length == 1 ? '' : 's') + ': ');
      builder.append(sources.length == 1 ? in_List.first(sources).name : sources.length.toString() + ' files');
      builder.append(' (' + Skew.bytesToString(totalBytes));
      builder.append(', ' + Skew.bytesToString(Math.round(totalBytes / totalTime) | 0) + '/s');

      if (kind == Skew.StatisticsKind.LONG) {
        builder.append(', ' + Skew.PrettyPrint.plural1(totalLines, 'line'));
        builder.append(', ' + Skew.PrettyPrint.plural1(Math.round(totalLines / totalTime) | 0, 'line') + '/s');
      }

      builder.append(')\n');
    };

    // Sources
    sourceStatistics('input', inputs);
    sourceStatistics('output', this.outputs);

    // Compilation time
    builder.append('time: ' + this.totalTimer.elapsedMilliseconds());

    if (kind == Skew.StatisticsKind.LONG) {
      for (var i = 0, list = this.passTimers, count = list.length; i < count; i = i + 1 | 0) {
        var passTimer = in_List.get(list, i);
        builder.append('\n  ' + in_List.get(Skew.in_PassKind._strings, passTimer.kind) + ': ' + passTimer.timer.elapsedMilliseconds());
      }
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
    var isLive = in_List.takeLast(this._isControlFlowLive);

    if (isLive) {
      node.flags |= Skew.NodeFlags.HAS_CONTROL_FLOW_AT_END;
    }

    // Pop loop info
    if (parent != null && Skew.in_NodeKind.isLoop(parent.kind) && !in_List.takeLast(this._isLoopBreakTarget) && (parent.kind == Skew.NodeKind.WHILE && parent.whileTest().isTrue() || parent.kind == Skew.NodeKind.FOR && parent.forTest().isTrue())) {
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

  Skew.Folding.ConstantFolder = function(_cache, _options, _prepareSymbol) {
    this._cache = _cache;
    this._options = _options;
    this._prepareSymbol = _prepareSymbol;
    this._constantCache = {};
  };

  Skew.Folding.ConstantFolder.prototype.visitObject = function(symbol) {
    for (var i = 0, list = symbol.objects, count = list.length; i < count; i = i + 1 | 0) {
      var object = in_List.get(list, i);
      this.visitObject(object);
    }

    for (var i1 = 0, list1 = symbol.functions, count1 = list1.length; i1 < count1; i1 = i1 + 1 | 0) {
      var $function = in_List.get(list1, i1);

      if ($function.block != null) {
        this.foldConstants($function.block);
      }
    }

    for (var i2 = 0, list2 = symbol.variables, count2 = list2.length; i2 < count2; i2 = i2 + 1 | 0) {
      var variable = in_List.get(list2, i2);

      if (variable.value != null) {
        this.foldConstants(variable.value);
      }
    }
  };

  // Use this instead of node.become(Node.createConstant(content)) to avoid more GC
  Skew.Folding.ConstantFolder.prototype._flatten = function(node, content) {
    node.removeChildren();
    node.kind = Skew.NodeKind.CONSTANT;
    node.content = content;
    node.symbol = null;
  };

  // Use this instead of node.become(Node.createBool(value)) to avoid more GC
  Skew.Folding.ConstantFolder.prototype._flattenBool = function(node, value) {
    assert(this._cache.isEquivalentToBool(node.resolvedType) || node.resolvedType == Skew.Type.DYNAMIC);
    this._flatten(node, new Skew.BoolContent(value));
  };

  // Use this instead of node.become(Node.createInt(value)) to avoid more GC
  Skew.Folding.ConstantFolder.prototype._flattenInt = function(node, value) {
    assert(this._cache.isEquivalentToInt(node.resolvedType) || node.resolvedType == Skew.Type.DYNAMIC);
    this._flatten(node, new Skew.IntContent(value));
  };

  // Use this instead of node.become(Node.createDouble(value)) to avoid more GC
  Skew.Folding.ConstantFolder.prototype._flattenDouble = function(node, value) {
    assert(this._cache.isEquivalentToDouble(node.resolvedType) || node.resolvedType == Skew.Type.DYNAMIC);
    this._flatten(node, new Skew.DoubleContent(value));
  };

  // Use this instead of node.become(Node.createString(value)) to avoid more GC
  Skew.Folding.ConstantFolder.prototype._flattenString = function(node, value) {
    assert(this._cache.isEquivalentToString(node.resolvedType) || node.resolvedType == Skew.Type.DYNAMIC);
    this._flatten(node, new Skew.StringContent(value));
  };

  Skew.Folding.ConstantFolder.prototype.foldConstants = function(node) {
    var kind = node.kind;

    // Transform "a + (b + c)" => "(a + b) + c" before operands are folded
    if (kind == Skew.NodeKind.ADD && node.resolvedType == this._cache.stringType && node.binaryLeft().resolvedType == this._cache.stringType && node.binaryRight().resolvedType == this._cache.stringType) {
      this._rotateStringConcatenation(node);
    }

    // Fold operands before folding this node
    for (var child = node.firstChild(); child != null; child = child.nextSibling()) {
      this.foldConstants(child);
    }

    // Separating the case bodies into separate functions makes the JavaScript JIT go faster
    switch (kind) {
      case Skew.NodeKind.BLOCK: {
        this._foldBlock(node);
        break;
      }

      case Skew.NodeKind.CALL: {
        this._foldCall(node);
        break;
      }

      case Skew.NodeKind.CAST: {
        this._foldCast(node);
        break;
      }

      case Skew.NodeKind.DOT: {
        this._foldDot(node);
        break;
      }

      case Skew.NodeKind.HOOK: {
        this._foldHook(node);
        break;
      }

      case Skew.NodeKind.NAME: {
        this._foldName(node);
        break;
      }

      case Skew.NodeKind.COMPLEMENT:
      case Skew.NodeKind.NEGATIVE:
      case Skew.NodeKind.NOT:
      case Skew.NodeKind.POSITIVE: {
        this._foldUnary(node);
        break;
      }

      default: {
        if (Skew.in_NodeKind.isBinary(kind)) {
          this._foldBinary(node);
        }
        break;
      }
    }
  };

  Skew.Folding.ConstantFolder.prototype._rotateStringConcatenation = function(node) {
    var left = node.binaryLeft();
    var right = node.binaryRight();
    assert(node.kind == Skew.NodeKind.ADD);
    assert(left.resolvedType == this._cache.stringType || left.resolvedType == Skew.Type.DYNAMIC);
    assert(right.resolvedType == this._cache.stringType || right.resolvedType == Skew.Type.DYNAMIC);

    // "a + (b + c)" => "(a + b) + c"
    if (right.kind == Skew.NodeKind.ADD) {
      assert(right.binaryLeft().resolvedType == this._cache.stringType || right.binaryLeft().resolvedType == Skew.Type.DYNAMIC);
      assert(right.binaryRight().resolvedType == this._cache.stringType || right.binaryRight().resolvedType == Skew.Type.DYNAMIC);
      node.rotateBinaryRightToLeft();
    }
  };

  Skew.Folding.ConstantFolder.prototype._foldStringConcatenation = function(node) {
    var left = node.binaryLeft();
    var right = node.binaryRight();
    assert(left.resolvedType == this._cache.stringType || left.resolvedType == Skew.Type.DYNAMIC);
    assert(right.resolvedType == this._cache.stringType || right.resolvedType == Skew.Type.DYNAMIC);

    if (right.isString()) {
      // "a" + "b" => "ab"
      if (left.isString()) {
        this._flattenString(node, left.asString() + right.asString());
      }

      else if (left.kind == Skew.NodeKind.ADD) {
        var leftLeft = left.binaryLeft();
        var leftRight = left.binaryRight();
        assert(leftLeft.resolvedType == this._cache.stringType || leftLeft.resolvedType == Skew.Type.DYNAMIC);
        assert(leftRight.resolvedType == this._cache.stringType || leftRight.resolvedType == Skew.Type.DYNAMIC);

        // (a + "b") + "c" => a + "bc"
        if (leftRight.isString()) {
          this._flattenString(leftRight, leftRight.asString() + right.asString());
          node.become(left.remove());
        }
      }
    }
  };

  Skew.Folding.ConstantFolder.prototype._foldTry = function(node) {
    var tryBlock = node.tryBlock();

    // A try block without any statements cannot possibly throw
    if (!tryBlock.hasChildren()) {
      node.remove();
      return -1;
    }

    return 0;
  };

  Skew.Folding.ConstantFolder.prototype._foldIf = function(node) {
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
        test.invertBooleanCondition(this._cache);
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

  Skew.Folding.ConstantFolder.prototype._foldSwitch = function(node) {
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

  Skew.Folding.ConstantFolder.prototype._foldVariables = function(node) {
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

  Skew.Folding.ConstantFolder.prototype._foldBlock = function(node) {
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
        this._foldAssignment(child);
      }

      else if (kind == Skew.NodeKind.VARIABLES) {
        this._foldVariables(child);
      }

      // Remove unused try statements since they can cause deoptimizations
      else if (kind == Skew.NodeKind.TRY) {
        this._foldTry(child);
      }

      // Statically evaluate if statements where possible
      else if (kind == Skew.NodeKind.IF) {
        this._foldIf(child);
      }

      // Fold switch statements
      else if (kind == Skew.NodeKind.SWITCH) {
        this._foldSwitch(child);
      }
    }
  };

  // "a = 0; b = 0; a = 1;" => "b = 0; a = 1;"
  Skew.Folding.ConstantFolder.prototype._foldAssignment = function(node) {
    assert(node.kind == Skew.NodeKind.EXPRESSION && node.expressionValue().kind == Skew.NodeKind.ASSIGN);
    var value = node.expressionValue();
    var left = value.binaryLeft();
    var right = value.binaryRight();

    // Only do this for simple variable assignments
    var dotVariable = left.kind == Skew.NodeKind.DOT && Skew.Folding.ConstantFolder._isVariableReference(left.dotTarget()) ? left.dotTarget().symbol : null;
    var variable = Skew.Folding.ConstantFolder._isVariableReference(left) || dotVariable != null ? left.symbol : null;

    if (variable == null) {
      return;
    }

    // Make sure the assigned value doesn't need the previous value. We bail
    // on expressions with side effects like function calls and on expressions
    // that reference the variable.
    if (!right.hasNoSideEffects() || Skew.Folding.ConstantFolder._hasNestedReference(right, variable)) {
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
          var previousDotVariable = previousLeft.kind == Skew.NodeKind.DOT && Skew.Folding.ConstantFolder._isVariableReference(previousLeft.dotTarget()) ? previousLeft.dotTarget().symbol : null;
          var previousVariable = Skew.Folding.ConstantFolder._isVariableReference(previousLeft) || previousDotVariable != null && previousDotVariable == dotVariable ? previousLeft.symbol : null;

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
          if (!previousRight.hasNoSideEffects() || Skew.Folding.ConstantFolder._hasNestedReference(previousRight, variable)) {
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

  Skew.Folding.ConstantFolder.prototype._foldDot = function(node) {
    var symbol = node.symbol;

    // Only replace this with a constant if the target has no side effects.
    // This catches constants declared on imported types.
    if (Skew.Folding.ConstantFolder._shouldFoldSymbol(symbol) && !node.isAssignTarget() && (node.dotTarget() == null || node.dotTarget().hasNoSideEffects())) {
      var content = this.constantForSymbol(symbol.asVariableSymbol());

      if (content != null) {
        this._flatten(node, content);
      }
    }
  };

  Skew.Folding.ConstantFolder.prototype._foldName = function(node) {
    var symbol = node.symbol;

    // Don't fold loop variables since they aren't actually constant across loop iterations
    if (Skew.Folding.ConstantFolder._shouldFoldSymbol(symbol) && !node.isAssignTarget() && !symbol.isLoopVariable()) {
      var content = this.constantForSymbol(symbol.asVariableSymbol());

      if (content != null) {
        this._flatten(node, content);
      }
    }
  };

  Skew.Folding.ConstantFolder.prototype._foldCall = function(node) {
    var value = node.callValue();
    var symbol = value.symbol;

    // Fold instance function calls
    if (value.kind == Skew.NodeKind.DOT) {
      var target = value.dotTarget();

      // Folding of double.toString can't be done in a platform-independent
      // manner. The obvious cases are NaN and infinity, but even fractions
      // are emitted differently on different platforms. Instead of having
      // constant folding change how the code behaves, just don't fold double
      // toString calls.
      //
      // "bool.toString"
      // "int.toString"
      //
      if (target != null && target.kind == Skew.NodeKind.CONSTANT) {
        if (Skew.Folding.ConstantFolder._isKnownCall(symbol, this._cache.boolToStringSymbol)) {
          this._flattenString(node, target.asBool().toString());
        }

        else if (Skew.Folding.ConstantFolder._isKnownCall(symbol, this._cache.intToStringSymbol)) {
          this._flattenString(node, target.asInt().toString());
        }
      }
    }

    // Fold global function calls
    else if (value.kind == Skew.NodeKind.NAME) {
      // "\"abc\".count" => "3"
      if (Skew.Folding.ConstantFolder._isKnownCall(symbol, this._cache.stringCountSymbol) && node.lastChild().isString()) {
        this._flattenInt(node, Unicode.codeUnitCountForCodePoints(in_string.codePoints(node.lastChild().asString()), this._options.target.stringEncoding()));
      }

      // "3 ** 2" => "9"
      else if (Skew.Folding.ConstantFolder._isKnownCall(symbol, this._cache.intPowerSymbol) && node.lastChild().isInt() && value.nextSibling().isInt()) {
        this._flattenInt(node, in_int.power(value.nextSibling().asInt(), node.lastChild().asInt()));
      }

      // "0.0625 ** 0.25" => "0.5"
      // "Math.pow(0.0625, 0.25)" => "0.5"
      else if ((Skew.Folding.ConstantFolder._isKnownCall(symbol, this._cache.doublePowerSymbol) || Skew.Folding.ConstantFolder._isKnownCall(symbol, this._cache.mathPowSymbol)) && node.lastChild().isDouble() && value.nextSibling().isDouble()) {
        this._flattenDouble(node, Math.pow(value.nextSibling().asDouble(), node.lastChild().asDouble()));
      }

      // "string.fromCodePoint(100)" => "\"d\""
      // "string.fromCodeUnit(100)" => "\"d\""
      else if ((Skew.Folding.ConstantFolder._isKnownCall(symbol, this._cache.stringFromCodePointSymbol) || Skew.Folding.ConstantFolder._isKnownCall(symbol, this._cache.stringFromCodeUnitSymbol)) && node.lastChild().isInt()) {
        // "fromCodePoint" is a superset of "fromCodeUnit"
        this._flattenString(node, in_string.fromCodePoint(node.lastChild().asInt()));
      }

      // "string.fromCodePoints([97, 98, 99])" => "\"abc\""
      // "string.fromCodeUnits([97, 98, 99])" => "\"abc\""
      else if ((Skew.Folding.ConstantFolder._isKnownCall(symbol, this._cache.stringFromCodePointsSymbol) || Skew.Folding.ConstantFolder._isKnownCall(symbol, this._cache.stringFromCodeUnitsSymbol)) && node.lastChild().kind == Skew.NodeKind.INITIALIZER_LIST) {
        var codePoints = [];

        for (var child = node.lastChild().firstChild(); child != null; child = child.nextSibling()) {
          if (!child.isInt()) {
            return;
          }

          codePoints.push(child.asInt());
        }

        // "fromCodePoints" is a superset of "fromCodeUnits"
        this._flattenString(node, in_string.fromCodePoints(codePoints));
      }
    }
  };

  Skew.Folding.ConstantFolder.prototype._foldCast = function(node) {
    var type = node.castType().resolvedType;
    var value = node.castValue();

    if (value.kind == Skew.NodeKind.CONSTANT) {
      var content = value.content;
      var kind = content.kind();

      // Cast "bool" values
      if (kind == Skew.ContentKind.BOOL) {
        if (this._cache.isEquivalentToBool(type)) {
          this._flattenBool(node, value.asBool());
        }

        else if (this._cache.isEquivalentToInt(type)) {
          this._flattenInt(node, value.asBool() | 0);
        }

        else if (this._cache.isEquivalentToDouble(type)) {
          this._flattenDouble(node, +value.asBool());
        }
      }

      // Cast "int" values
      else if (kind == Skew.ContentKind.INT) {
        if (this._cache.isEquivalentToBool(type)) {
          this._flattenBool(node, !!value.asInt());
        }

        else if (this._cache.isEquivalentToInt(type)) {
          this._flattenInt(node, value.asInt());
        }

        else if (this._cache.isEquivalentToDouble(type)) {
          this._flattenDouble(node, value.asInt());
        }
      }

      // Cast "double" values
      else if (kind == Skew.ContentKind.DOUBLE) {
        if (this._cache.isEquivalentToBool(type)) {
          this._flattenBool(node, !!value.asDouble());
        }

        else if (this._cache.isEquivalentToInt(type)) {
          this._flattenInt(node, value.asDouble() | 0);
        }

        else if (this._cache.isEquivalentToDouble(type)) {
          this._flattenDouble(node, value.asDouble());
        }
      }
    }
  };

  Skew.Folding.ConstantFolder.prototype._foldUnary = function(node) {
    var value = node.unaryValue();
    var kind = node.kind;

    if (value.kind == Skew.NodeKind.CONSTANT) {
      var content = value.content;
      var contentKind = content.kind();

      // Fold "bool" values
      if (contentKind == Skew.ContentKind.BOOL) {
        if (kind == Skew.NodeKind.NOT) {
          this._flattenBool(node, !value.asBool());
        }
      }

      // Fold "int" values
      else if (contentKind == Skew.ContentKind.INT) {
        if (kind == Skew.NodeKind.POSITIVE) {
          this._flattenInt(node, +value.asInt());
        }

        else if (kind == Skew.NodeKind.NEGATIVE) {
          this._flattenInt(node, -value.asInt() | 0);
        }

        else if (kind == Skew.NodeKind.COMPLEMENT) {
          this._flattenInt(node, ~value.asInt());
        }
      }

      // Fold "float" or "double" values
      else if (contentKind == Skew.ContentKind.DOUBLE) {
        if (kind == Skew.NodeKind.POSITIVE) {
          this._flattenDouble(node, +value.asDouble());
        }

        else if (kind == Skew.NodeKind.NEGATIVE) {
          this._flattenDouble(node, -value.asDouble());
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
          value.invertBooleanCondition(this._cache);
          node.become(value.remove());
          break;
        }
      }
    }
  };

  Skew.Folding.ConstantFolder.prototype._foldConstantIntegerAddOrSubtract = function(node, variable, constant, delta) {
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
    value = value + delta | 0;

    // 0 + a => a
    // 0 - a => -a
    // a + 0 => a
    // a - 0 => a
    if (value == 0) {
      node.become(isAdd || isRightConstant ? variable.remove() : Skew.Node.createUnary(Skew.NodeKind.NEGATIVE, variable.remove()).withType(node.resolvedType));
      return;
    }

    // Check for nested addition or subtraction
    if (variable.kind == Skew.NodeKind.ADD || variable.kind == Skew.NodeKind.SUBTRACT) {
      var left = variable.binaryLeft();
      var right = variable.binaryRight();
      assert(left.resolvedType == this._cache.intType || left.resolvedType == Skew.Type.DYNAMIC);
      assert(right.resolvedType == this._cache.intType || right.resolvedType == Skew.Type.DYNAMIC);

      // (a + 1) + 2 => a + 3
      var isLeftConstant = left.isInt();

      if (isLeftConstant || right.isInt()) {
        this._foldConstantIntegerAddOrSubtract(variable, isLeftConstant ? right : left, isLeftConstant ? left : right, value);
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
    this._foldAddOrSubtract(node);
  };

  Skew.Folding.ConstantFolder.prototype._foldAddOrSubtract = function(node) {
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

    // 0 + a => a
    // 0 - a => -a
    else if (left.isZero()) {
      node.become(isAdd ? right.remove() : Skew.Node.createUnary(Skew.NodeKind.NEGATIVE, right.remove()).withType(node.resolvedType));
    }

    // a + 0 => a
    // a - 0 => a
    else if (right.isZero()) {
      node.become(left.remove());
    }
  };

  Skew.Folding.ConstantFolder.prototype._foldConstantIntegerMultiply = function(node, variable, constant) {
    assert(constant.isInt());

    // Apply identities
    var variableIsInt = variable.resolvedType == this._cache.intType;
    var value = constant.asInt();

    // Replacing values with 0 only works for integers. Doubles can be NaN and
    // NaN times anything is NaN, zero included.
    if (value == 0 && variableIsInt) {
      if (variable.hasNoSideEffects()) {
        node.become(constant.remove());
      }

      return;
    }

    // This identity works even with NaN
    if (value == 1) {
      node.become(variable.remove());
      return;
    }

    // Multiply by a power of 2 should be a left-shift operation, which is
    // more concise and always faster (or at least never slower) than the
    // alternative. Division can't be replaced by a right-shift operation
    // because that would lead to incorrect results for negative numbers.
    if (variableIsInt) {
      var shift = Skew.Folding.ConstantFolder._logBase2(value);

      if (shift != -1) {
        // "x * 2 * 4" => "x << 3"
        if (variable.kind == Skew.NodeKind.SHIFT_LEFT && variable.binaryRight().isInt()) {
          shift = shift + variable.binaryRight().asInt() | 0;
          variable.replaceWith(variable.binaryLeft().remove());
        }

        constant.content = new Skew.IntContent(shift);
        node.kind = Skew.NodeKind.SHIFT_LEFT;
      }
    }
  };

  // "((a >> 8) & 255) << 8" => "a & (255 << 8)"
  // "((a >>> 8) & 255) << 8" => "a & (255 << 8)"
  // "((a >> 7) & 255) << 8" => "(a << 1) & (255 << 8)"
  // "((a >>> 7) & 255) << 8" => "(a << 1) & (255 << 8)"
  // "((a >> 8) & 255) << 7" => "(a >> 1) & (255 << 7)"
  // "((a >>> 8) & 255) << 7" => "(a >>> 1) & (255 << 7)"
  Skew.Folding.ConstantFolder.prototype._foldConstantBitwiseAndInsideShift = function(node, andLeft, andRight) {
    assert(node.kind == Skew.NodeKind.SHIFT_LEFT && node.binaryRight().isInt());

    if (andRight.isInt() && (andLeft.kind == Skew.NodeKind.SHIFT_RIGHT || andLeft.kind == Skew.NodeKind.UNSIGNED_SHIFT_RIGHT) && andLeft.binaryRight().isInt()) {
      var mask = andRight.asInt();
      var leftShift = node.binaryRight().asInt();
      var rightShift = andLeft.binaryRight().asInt();
      var value = andLeft.binaryLeft().remove();

      if (leftShift < rightShift) {
        value = Skew.Node.createBinary(andLeft.kind, value, this._cache.createInt(rightShift - leftShift | 0)).withType(this._cache.intType);
      }

      else if (leftShift > rightShift) {
        value = Skew.Node.createBinary(Skew.NodeKind.SHIFT_LEFT, value, this._cache.createInt(leftShift - rightShift | 0)).withType(this._cache.intType);
      }

      node.become(Skew.Node.createBinary(Skew.NodeKind.BITWISE_AND, value, this._cache.createInt(mask << leftShift)).withType(node.resolvedType));
    }
  };

  Skew.Folding.ConstantFolder.prototype._foldConstantBitwiseAndInsideBitwiseOr = function(node) {
    assert(node.kind == Skew.NodeKind.BITWISE_OR && node.binaryLeft().kind == Skew.NodeKind.BITWISE_AND);
    var left = node.binaryLeft();
    var right = node.binaryRight();
    var leftLeft = left.binaryLeft();
    var leftRight = left.binaryRight();

    // "(a & b) | (a & c)" => "a & (b | c)"
    if (right.kind == Skew.NodeKind.BITWISE_AND) {
      var rightLeft = right.binaryLeft();
      var rightRight = right.binaryRight();

      if (leftRight.isInt() && rightRight.isInt() && Skew.Folding.ConstantFolder._isSameVariableReference(leftLeft, rightLeft)) {
        var mask = leftRight.asInt() | rightRight.asInt();
        node.become(Skew.Node.createBinary(Skew.NodeKind.BITWISE_AND, leftLeft.remove(), this._cache.createInt(mask)).withType(node.resolvedType));
      }
    }

    // "(a & b) | c" => "a | c" when "(a | b) == ~0"
    else if (right.isInt() && leftRight.isInt() && (leftRight.asInt() | right.asInt()) == ~0) {
      left.become(leftLeft.remove());
    }
  };

  Skew.Folding.ConstantFolder.prototype._foldBinaryWithConstant = function(node, left, right) {
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
          this._foldConstantIntegerAddOrSubtract(node, right, left, 0);
        }

        else if (right.isInt()) {
          this._foldConstantIntegerAddOrSubtract(node, left, right, 0);
        }

        else {
          this._foldAddOrSubtract(node);
        }
        break;
      }

      case Skew.NodeKind.MULTIPLY: {
        if (right.isInt()) {
          this._foldConstantIntegerMultiply(node, left, right);
        }
        break;
      }

      case Skew.NodeKind.SHIFT_LEFT:
      case Skew.NodeKind.SHIFT_RIGHT:
      case Skew.NodeKind.UNSIGNED_SHIFT_RIGHT: {
        // "x << 0" => "x"
        // "x >> 0" => "x"
        // "x >>> 0" => "x"
        if (this._cache.isEquivalentToInt(left.resolvedType) && right.isInt() && right.asInt() == 0) {
          node.become(left.remove());
        }

        // Handle special cases of "&" nested inside "<<"
        else if (node.kind == Skew.NodeKind.SHIFT_LEFT && left.kind == Skew.NodeKind.BITWISE_AND && right.isInt()) {
          this._foldConstantBitwiseAndInsideShift(node, left.binaryLeft(), left.binaryRight());
        }

        // "x << 1 << 2" => "x << 3"
        // "x >> 1 >> 2" => "x >> 3"
        // "x >>> 1 >>> 2" => "x >>> 3"
        else if (node.kind == left.kind && left.binaryRight().isInt() && right.isInt()) {
          this._flattenInt(right, left.binaryRight().asInt() + right.asInt() | 0);
          left.replaceWith(left.binaryLeft().remove());
        }
        break;
      }

      case Skew.NodeKind.BITWISE_AND: {
        if (right.isInt() && this._cache.isEquivalentToInt(left.resolvedType)) {
          var value = right.asInt();

          // "x & ~0" => "x"
          if (value == ~0) {
            node.become(left.remove());
          }

          // "x & 0" => "0"
          else if (value == 0 && left.hasNoSideEffects()) {
            node.become(right.remove());
          }
        }
        break;
      }

      case Skew.NodeKind.BITWISE_OR: {
        if (right.isInt() && this._cache.isEquivalentToInt(left.resolvedType)) {
          var value1 = right.asInt();

          // "x | 0" => "x"
          if (value1 == 0) {
            node.become(left.remove());
            return;
          }

          // "x | ~0" => "~0"
          else if (value1 == ~0 && left.hasNoSideEffects()) {
            node.become(right.remove());
            return;
          }
        }

        if (left.kind == Skew.NodeKind.BITWISE_AND) {
          this._foldConstantBitwiseAndInsideBitwiseOr(node);
        }
        break;
      }
    }
  };

  Skew.Folding.ConstantFolder.prototype._foldBinary = function(node) {
    var kind = node.kind;

    if (kind == Skew.NodeKind.ADD && node.resolvedType == this._cache.stringType) {
      this._foldStringConcatenation(node);
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
            this._flattenBool(node, Skew.in_Content.asString(leftContent) == Skew.in_Content.asString(rightContent));
            break;
          }

          case Skew.NodeKind.NOT_EQUAL: {
            this._flattenBool(node, Skew.in_Content.asString(leftContent) != Skew.in_Content.asString(rightContent));
            break;
          }

          case Skew.NodeKind.LESS_THAN: {
            this._flattenBool(node, in_string.compare(Skew.in_Content.asString(leftContent), Skew.in_Content.asString(rightContent)) < 0);
            break;
          }

          case Skew.NodeKind.GREATER_THAN: {
            this._flattenBool(node, in_string.compare(Skew.in_Content.asString(leftContent), Skew.in_Content.asString(rightContent)) > 0);
            break;
          }

          case Skew.NodeKind.LESS_THAN_OR_EQUAL: {
            this._flattenBool(node, in_string.compare(Skew.in_Content.asString(leftContent), Skew.in_Content.asString(rightContent)) <= 0);
            break;
          }

          case Skew.NodeKind.GREATER_THAN_OR_EQUAL: {
            this._flattenBool(node, in_string.compare(Skew.in_Content.asString(leftContent), Skew.in_Content.asString(rightContent)) >= 0);
            break;
          }
        }

        return;
      }

      // Fold "bool" values
      else if (leftKind == Skew.ContentKind.BOOL && rightKind == Skew.ContentKind.BOOL) {
        switch (kind) {
          case Skew.NodeKind.LOGICAL_AND: {
            this._flattenBool(node, Skew.in_Content.asBool(leftContent) && Skew.in_Content.asBool(rightContent));
            break;
          }

          case Skew.NodeKind.LOGICAL_OR: {
            this._flattenBool(node, Skew.in_Content.asBool(leftContent) || Skew.in_Content.asBool(rightContent));
            break;
          }

          case Skew.NodeKind.EQUAL: {
            this._flattenBool(node, Skew.in_Content.asBool(leftContent) == Skew.in_Content.asBool(rightContent));
            break;
          }

          case Skew.NodeKind.NOT_EQUAL: {
            this._flattenBool(node, Skew.in_Content.asBool(leftContent) != Skew.in_Content.asBool(rightContent));
            break;
          }
        }

        return;
      }

      // Fold "int" values
      else if (leftKind == Skew.ContentKind.INT && rightKind == Skew.ContentKind.INT) {
        switch (kind) {
          case Skew.NodeKind.ADD: {
            this._flattenInt(node, Skew.in_Content.asInt(leftContent) + Skew.in_Content.asInt(rightContent) | 0);
            break;
          }

          case Skew.NodeKind.BITWISE_AND: {
            this._flattenInt(node, Skew.in_Content.asInt(leftContent) & Skew.in_Content.asInt(rightContent));
            break;
          }

          case Skew.NodeKind.BITWISE_OR: {
            this._flattenInt(node, Skew.in_Content.asInt(leftContent) | Skew.in_Content.asInt(rightContent));
            break;
          }

          case Skew.NodeKind.BITWISE_XOR: {
            this._flattenInt(node, Skew.in_Content.asInt(leftContent) ^ Skew.in_Content.asInt(rightContent));
            break;
          }

          case Skew.NodeKind.DIVIDE: {
            this._flattenInt(node, Skew.in_Content.asInt(leftContent) / Skew.in_Content.asInt(rightContent) | 0);
            break;
          }

          case Skew.NodeKind.EQUAL: {
            this._flattenBool(node, Skew.in_Content.asInt(leftContent) == Skew.in_Content.asInt(rightContent));
            break;
          }

          case Skew.NodeKind.GREATER_THAN: {
            this._flattenBool(node, Skew.in_Content.asInt(leftContent) > Skew.in_Content.asInt(rightContent));
            break;
          }

          case Skew.NodeKind.GREATER_THAN_OR_EQUAL: {
            this._flattenBool(node, Skew.in_Content.asInt(leftContent) >= Skew.in_Content.asInt(rightContent));
            break;
          }

          case Skew.NodeKind.LESS_THAN: {
            this._flattenBool(node, Skew.in_Content.asInt(leftContent) < Skew.in_Content.asInt(rightContent));
            break;
          }

          case Skew.NodeKind.LESS_THAN_OR_EQUAL: {
            this._flattenBool(node, Skew.in_Content.asInt(leftContent) <= Skew.in_Content.asInt(rightContent));
            break;
          }

          case Skew.NodeKind.MULTIPLY: {
            this._flattenInt(node, __imul(Skew.in_Content.asInt(leftContent), Skew.in_Content.asInt(rightContent)));
            break;
          }

          case Skew.NodeKind.NOT_EQUAL: {
            this._flattenBool(node, Skew.in_Content.asInt(leftContent) != Skew.in_Content.asInt(rightContent));
            break;
          }

          case Skew.NodeKind.REMAINDER: {
            this._flattenInt(node, Skew.in_Content.asInt(leftContent) % Skew.in_Content.asInt(rightContent) | 0);
            break;
          }

          case Skew.NodeKind.SHIFT_LEFT: {
            this._flattenInt(node, Skew.in_Content.asInt(leftContent) << Skew.in_Content.asInt(rightContent));
            break;
          }

          case Skew.NodeKind.SHIFT_RIGHT: {
            this._flattenInt(node, Skew.in_Content.asInt(leftContent) >> Skew.in_Content.asInt(rightContent));
            break;
          }

          case Skew.NodeKind.SUBTRACT: {
            this._flattenInt(node, Skew.in_Content.asInt(leftContent) - Skew.in_Content.asInt(rightContent) | 0);
            break;
          }

          case Skew.NodeKind.UNSIGNED_SHIFT_RIGHT: {
            this._flattenInt(node, Skew.in_Content.asInt(leftContent) >>> Skew.in_Content.asInt(rightContent) | 0);
            break;
          }
        }

        return;
      }

      // Fold "double" values
      else if (leftKind == Skew.ContentKind.DOUBLE && rightKind == Skew.ContentKind.DOUBLE) {
        switch (kind) {
          case Skew.NodeKind.ADD: {
            this._flattenDouble(node, Skew.in_Content.asDouble(leftContent) + Skew.in_Content.asDouble(rightContent));
            break;
          }

          case Skew.NodeKind.SUBTRACT: {
            this._flattenDouble(node, Skew.in_Content.asDouble(leftContent) - Skew.in_Content.asDouble(rightContent));
            break;
          }

          case Skew.NodeKind.MULTIPLY: {
            this._flattenDouble(node, Skew.in_Content.asDouble(leftContent) * Skew.in_Content.asDouble(rightContent));
            break;
          }

          case Skew.NodeKind.DIVIDE: {
            this._flattenDouble(node, Skew.in_Content.asDouble(leftContent) / Skew.in_Content.asDouble(rightContent));
            break;
          }

          case Skew.NodeKind.EQUAL: {
            this._flattenBool(node, Skew.in_Content.asDouble(leftContent) == Skew.in_Content.asDouble(rightContent));
            break;
          }

          case Skew.NodeKind.NOT_EQUAL: {
            this._flattenBool(node, Skew.in_Content.asDouble(leftContent) != Skew.in_Content.asDouble(rightContent));
            break;
          }

          case Skew.NodeKind.LESS_THAN: {
            this._flattenBool(node, Skew.in_Content.asDouble(leftContent) < Skew.in_Content.asDouble(rightContent));
            break;
          }

          case Skew.NodeKind.GREATER_THAN: {
            this._flattenBool(node, Skew.in_Content.asDouble(leftContent) > Skew.in_Content.asDouble(rightContent));
            break;
          }

          case Skew.NodeKind.LESS_THAN_OR_EQUAL: {
            this._flattenBool(node, Skew.in_Content.asDouble(leftContent) <= Skew.in_Content.asDouble(rightContent));
            break;
          }

          case Skew.NodeKind.GREATER_THAN_OR_EQUAL: {
            this._flattenBool(node, Skew.in_Content.asDouble(leftContent) >= Skew.in_Content.asDouble(rightContent));
            break;
          }
        }

        return;
      }
    }

    this._foldBinaryWithConstant(node, left, right);
  };

  Skew.Folding.ConstantFolder.prototype._foldHook = function(node) {
    var test = node.hookTest();

    if (test.isTrue()) {
      node.become(node.hookTrue().remove());
    }

    else if (test.isFalse()) {
      node.become(node.hookFalse().remove());
    }
  };

  Skew.Folding.ConstantFolder.prototype.constantForSymbol = function(symbol) {
    if (symbol.id in this._constantCache) {
      return in_IntMap.get1(this._constantCache, symbol.id);
    }

    if (this._prepareSymbol != null) {
      this._prepareSymbol(symbol);
    }

    var constant = null;
    var value = symbol.value;

    if (symbol.isConst() && value != null) {
      this._constantCache[symbol.id] = null;
      value = value.clone();
      this.foldConstants(value);

      if (value.kind == Skew.NodeKind.CONSTANT) {
        constant = value.content;
      }
    }

    this._constantCache[symbol.id] = constant;
    return constant;
  };

  Skew.Folding.ConstantFolder._isVariableReference = function(node) {
    return node.kind == Skew.NodeKind.NAME && node.symbol != null && Skew.in_SymbolKind.isVariable(node.symbol.kind);
  };

  Skew.Folding.ConstantFolder._isSameVariableReference = function(a, b) {
    return Skew.Folding.ConstantFolder._isVariableReference(a) && Skew.Folding.ConstantFolder._isVariableReference(b) && a.symbol == b.symbol || a.kind == Skew.NodeKind.CAST && b.kind == Skew.NodeKind.CAST && Skew.Folding.ConstantFolder._isSameVariableReference(a.castValue(), b.castValue());
  };

  Skew.Folding.ConstantFolder._hasNestedReference = function(node, symbol) {
    assert(symbol != null);

    if (node.symbol == symbol) {
      return true;
    }

    for (var child = node.firstChild(); child != null; child = child.nextSibling()) {
      if (Skew.Folding.ConstantFolder._hasNestedReference(child, symbol)) {
        return true;
      }
    }

    return false;
  };

  Skew.Folding.ConstantFolder._shouldFoldSymbol = function(symbol) {
    return symbol != null && symbol.isConst() && (symbol.kind != Skew.SymbolKind.VARIABLE_INSTANCE || symbol.isImported());
  };

  Skew.Folding.ConstantFolder._isKnownCall = function(symbol, knownSymbol) {
    return symbol == knownSymbol || symbol != null && Skew.in_SymbolKind.isFunction(symbol.kind) && (symbol.asFunctionSymbol().overloaded == knownSymbol || Skew.in_SymbolKind.isFunction(knownSymbol.kind) && symbol.asFunctionSymbol().overloaded != null && symbol.asFunctionSymbol().overloaded == knownSymbol.asFunctionSymbol().overloaded && symbol.asFunctionSymbol().argumentOnlyType == knownSymbol.asFunctionSymbol().argumentOnlyType);
  };

  // Returns the log2(value) or -1 if log2(value) is not an integer
  Skew.Folding.ConstantFolder._logBase2 = function(value) {
    if (value < 1 || (value & value - 1) != 0) {
      return -1;
    }

    var result = 0;

    while (value > 1) {
      value >>= 1;
      result = result + 1 | 0;
    }

    return result;
  };

  Skew.GlobalizingPass = function() {
    Skew.Pass.call(this);
  };

  __extends(Skew.GlobalizingPass, Skew.Pass);

  Skew.GlobalizingPass.prototype.kind = function() {
    return Skew.PassKind.GLOBALIZING;
  };

  Skew.GlobalizingPass.prototype.run = function(context) {
    var globalizeAllFunctions = context.options.globalizeAllFunctions;
    var virtualLookup = globalizeAllFunctions || context.options.isAlwaysInlinePresent ? new Skew.VirtualLookup(context.global) : null;

    for (var i1 = 0, list1 = context.callGraph.callInfo, count1 = list1.length; i1 < count1; i1 = i1 + 1 | 0) {
      var info = in_List.get(list1, i1);
      var symbol = info.symbol;

      // Turn certain instance functions into global functions
      if (symbol.kind == Skew.SymbolKind.FUNCTION_INSTANCE && (Skew.in_SymbolKind.isEnumOrFlags(symbol.parent.kind) || symbol.parent.kind == Skew.SymbolKind.OBJECT_WRAPPED || symbol.parent.kind == Skew.SymbolKind.OBJECT_INTERFACE && symbol.block != null || symbol.parent.isImported() && !symbol.isImported() || (globalizeAllFunctions || symbol.isInliningForced()) && !symbol.isImportedOrExported() && !virtualLookup.isVirtual(symbol))) {
        var $function = symbol.asFunctionSymbol();
        $function.kind = Skew.SymbolKind.FUNCTION_GLOBAL;
        $function.$arguments.unshift($function.$this);
        $function.resolvedType.argumentTypes.unshift($function.$this.resolvedType);
        $function.$this = null;

        // Update all call sites
        for (var i = 0, list = info.callSites, count = list.length; i < count; i = i + 1 | 0) {
          var callSite = in_List.get(list, i);
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
    for (var i = 0, list = symbol.objects, count = list.length; i < count; i = i + 1 | 0) {
      var object = in_List.get(list, i);
      this._visitObject(object);
    }

    for (var i2 = 0, list2 = symbol.functions, count2 = list2.length; i2 < count2; i2 = i2 + 1 | 0) {
      var $function = in_List.get(list2, i2);

      if ($function.overridden != null) {
        this._map[$function.overridden.id] = 0;
        this._map[$function.id] = 0;
      }

      if (symbol.kind == Skew.SymbolKind.OBJECT_INTERFACE && $function.kind == Skew.SymbolKind.FUNCTION_INSTANCE && $function.forwardTo == null) {
        if ($function.implementations != null) {
          for (var i1 = 0, list1 = $function.implementations, count1 = list1.length; i1 < count1; i1 = i1 + 1 | 0) {
            var implementation = in_List.get(list1, i1);
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
    var graph = new Skew.Inlining.InliningGraph(context.callGraph, context.log, context.options.inlineAllFunctions);

    for (var i = 0, list = graph.inliningInfo, count = list.length; i < count; i = i + 1 | 0) {
      var info = in_List.get(list, i);
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
    for (var i1 = 0, list = info.bodyCalls, count = list.length; i1 < count; i1 = i1 + 1 | 0) {
      var bodyCall = in_List.get(list, i1);
      Skew.Inlining.inlineSymbol(graph, bodyCall);
    }

    var spreadingAnnotations = info.symbol.spreadingAnnotations();

    for (var i = 0, count2 = info.callSites.length; i < count2; i = i + 1 | 0) {
      var callSite = in_List.get(info.callSites, i);

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

        for (var i2 = 0, list1 = spreadingAnnotations, count1 = list1.length; i2 < count1; i2 = i2 + 1 | 0) {
          var annotation = in_List.get(list1, i2);
          in_List.appendOne(annotations, annotation);
        }
      }

      // Make sure each call site is inlined once by setting the call site to
      // null. The call site isn't removed from the list since we don't want
      // to mess up the indices of another call to inlineSymbol further up
      // the call stack.
      in_List.set(info.callSites, i, null);

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
        assert(node.firstChild().resolvedType != null);
        values.push(node.firstChild().remove());
      }

      // Make sure not to update the type if the function dynamic because the
      // expression inside the function may have a more specific type that is
      // necessary during code generation
      if (node.resolvedType != Skew.Type.DYNAMIC) {
        clone.resolvedType = node.resolvedType;
      }

      assert((value.kind == Skew.NodeKind.PARAMETERIZE ? value.parameterizeValue() : value).kind == Skew.NodeKind.NAME && value.symbol == info.symbol);
      assert(clone.resolvedType != null);
      node.become(clone);
      Skew.Inlining.recursivelySubstituteArguments(node, node, info.symbol.$arguments, values);

      // Remove the inlined result entirely if appropriate
      var parent = node.parent();

      if (parent != null && parent.kind == Skew.NodeKind.EXPRESSION && node.hasNoSideEffects()) {
        parent.remove();
      }
    }
  };

  Skew.Inlining.recursivelySubstituteArguments = function(root, node, $arguments, values) {
    // Substitute the argument if this is an argument name
    var symbol = node.symbol;

    if (symbol != null && Skew.in_SymbolKind.isVariable(symbol.kind)) {
      var index = $arguments.indexOf(symbol.asVariableSymbol());

      if (index != -1) {
        if (node == root) {
          node.become(in_List.get(values, index));
        }

        else {
          node.replaceWith(in_List.get(values, index));
        }

        return;
      }
    }

    // Otherwise, recursively search for substitutions in all child nodes
    for (var child = node.firstChild(), next = null; child != null; child = next) {
      next = child.nextSibling();
      Skew.Inlining.recursivelySubstituteArguments(root, child, $arguments, values);
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
  Skew.Inlining.InliningGraph = function(graph, log, inlineAllFunctions) {
    this.inliningInfo = [];
    this.symbolToInfoIndex = {};

    // Create the nodes in the graph
    for (var i = 0, list = graph.callInfo, count = list.length; i < count; i = i + 1 | 0) {
      var callInfo = in_List.get(list, i);
      var symbol = callInfo.symbol;

      if (symbol.isInliningPrevented()) {
        continue;
      }

      var info = Skew.Inlining.InliningGraph._createInliningInfo(callInfo);

      if (info != null) {
        if (inlineAllFunctions || symbol.isInliningForced()) {
          this.symbolToInfoIndex[symbol.id] = this.inliningInfo.length;
          this.inliningInfo.push(info);
        }
      }

      else if (symbol.isInliningForced()) {
        log.semanticWarningInliningFailed(symbol.range, symbol.name);
      }
    }

    // Create the edges in the graph
    for (var i2 = 0, list2 = this.inliningInfo, count2 = list2.length; i2 < count2; i2 = i2 + 1 | 0) {
      var info1 = in_List.get(list2, i2);

      for (var i1 = 0, list1 = graph.callInfoForSymbol(info1.symbol).callSites, count1 = list1.length; i1 < count1; i1 = i1 + 1 | 0) {
        var callSite = in_List.get(list1, i1);

        if (callSite.enclosingSymbol.kind == Skew.SymbolKind.FUNCTION_GLOBAL) {
          var index = in_IntMap.get(this.symbolToInfoIndex, callSite.enclosingSymbol.id, -1);

          if (index != -1) {
            in_List.get(this.inliningInfo, index).bodyCalls.push(info1);
          }
        }
      }
    }

    // Detect and disable infinitely expanding inline operations
    for (var i3 = 0, list3 = this.inliningInfo, count3 = list3.length; i3 < count3; i3 = i3 + 1 | 0) {
      var info2 = in_List.get(list3, i3);
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

    for (var i = 0, list = info.bodyCalls, count = list.length; i < count; i = i + 1 | 0) {
      var bodyCall = in_List.get(list, i);

      if (Skew.Inlining.InliningGraph._containsInfiniteExpansion(bodyCall, symbols)) {
        return true;
      }
    }

    in_List.removeLast(symbols);
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

        for (var i = 0, count1 = symbol.$arguments.length; i < count1; i = i + 1 | 0) {
          unusedArguments.push(i);
        }

        return new Skew.Inlining.InliningInfo(symbol, new Skew.Node(Skew.NodeKind.NULL).withType(Skew.Type.NULL), info.callSites, unusedArguments);
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

        for (var i2 = 0, list = symbol.$arguments, count2 = list.length; i2 < count2; i2 = i2 + 1 | 0) {
          var argument = in_List.get(list, i2);
          argumentCounts[argument.id] = 0;
        }

        if (Skew.Inlining.InliningGraph._recursivelyCountArgumentUses(inlineValue, argumentCounts)) {
          var unusedArguments1 = [];
          var isSimpleSubstitution = true;

          for (var i1 = 0, count3 = symbol.$arguments.length; i1 < count3; i1 = i1 + 1 | 0) {
            var count = in_IntMap.get1(argumentCounts, in_List.get(symbol.$arguments, i1).id);

            if (count == 0) {
              unusedArguments1.push(i1);
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

    for (var i2 = 0, list2 = this._interfaces, count2 = list2.length; i2 < count2; i2 = i2 + 1 | 0) {
      var symbol = in_List.get(list2, i2);

      if (symbol.isImportedOrExported()) {
        continue;
      }

      var implementations = in_IntMap.get(this._interfaceImplementations, symbol.id, null);

      if (implementations == null || implementations.length == 1) {
        symbol.kind = Skew.SymbolKind.OBJECT_NAMESPACE;

        // Remove this interface from its implementation
        if (implementations != null) {
          var object = in_List.first(implementations);

          for (var i = 0, list = object.interfaceTypes, count = list.length; i < count; i = i + 1 | 0) {
            var type = in_List.get(list, i);

            if (type.symbol == symbol) {
              in_List.removeOne(object.interfaceTypes, type);
              break;
            }
          }

          // Mark these symbols as forwarded, which is used by the globalization
          // pass and the JavaScript emitter to ignore this interface
          for (var i1 = 0, list1 = symbol.functions, count1 = list1.length; i1 < count1; i1 = i1 + 1 | 0) {
            var $function = in_List.get(list1, i1);

            if ($function.implementations != null) {
              $function.forwardTo = in_List.first($function.implementations);
            }
          }

          symbol.forwardTo = object;
        }
      }
    }
  };

  Skew.InterfaceRemovalPass.prototype._scanForInterfaces = function(symbol) {
    for (var i = 0, list = symbol.objects, count = list.length; i < count; i = i + 1 | 0) {
      var object = in_List.get(list, i);
      this._scanForInterfaces(object);
    }

    if (symbol.kind == Skew.SymbolKind.OBJECT_INTERFACE) {
      this._interfaces.push(symbol);
    }

    if (symbol.interfaceTypes != null) {
      for (var i1 = 0, list1 = symbol.interfaceTypes, count1 = list1.length; i1 < count1; i1 = i1 + 1 | 0) {
        var type = in_List.get(list1, i1);
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

  Skew.LambdaConversionPass = function() {
    Skew.Pass.call(this);
  };

  __extends(Skew.LambdaConversionPass, Skew.Pass);

  Skew.LambdaConversionPass.prototype.kind = function() {
    return Skew.PassKind.LAMBDA_CONVERSION;
  };

  Skew.LambdaConversionPass.prototype.run = function(context) {
    new Skew.LambdaConversion.Converter(context.global, context.cache).run();
  };

  Skew.LambdaConversion = {};

  Skew.LambdaConversion.CaptureKind = {
    FUNCTION: 0,
    LAMBDA: 1,
    LOOP: 2
  };

  Skew.LambdaConversion.Definition = function(symbol, node, scope) {
    this.symbol = symbol;
    this.node = node;
    this.scope = scope;
    this.isCaptured = false;
    this.member = null;
  };

  Skew.LambdaConversion.Use = function(definition, node) {
    this.definition = definition;
    this.node = node;
  };

  Skew.LambdaConversion.Copy = function(scope) {
    this.scope = scope;
    this.member = null;
  };

  Skew.LambdaConversion.Scope = function(kind, node, enclosingFunction, parent) {
    this.id = Skew.LambdaConversion.Scope._nextID = Skew.LambdaConversion.Scope._nextID + 1 | 0;
    this.kind = kind;
    this.node = node;
    this.enclosingFunction = enclosingFunction;
    this.parent = parent;
    this.hasCapturedDefinitions = false;
    this.hasCapturingUses = false;
    this.environmentObject = null;
    this.environmentVariable = null;
    this.environmentConstructor = null;
    this.environmentConstructorCall = null;
    this.definitions = [];
    this.uses = [];
    this.copies = [];
    this.definitionLookup = {};
    this.copyLookup = {};
  };

  Skew.LambdaConversion.Scope.prototype.recordDefinition = function(symbol, node) {
    assert(!(symbol.id in this.definitionLookup));
    var definition = new Skew.LambdaConversion.Definition(symbol, node, this);
    this.definitions.push(definition);
    this.definitionLookup[symbol.id] = definition;
  };

  Skew.LambdaConversion.Scope.prototype.recordUse = function(symbol, node) {
    var isCaptured = false;

    // Walk up the scope chain
    for (var scope = this; scope != null; scope = scope.parent) {
      var definition = in_IntMap.get(scope.definitionLookup, symbol.id, null);

      // Stop once the definition is found
      if (definition != null) {
        this.uses.push(new Skew.LambdaConversion.Use(definition, node));

        if (isCaptured) {
          definition.isCaptured = true;
          scope.hasCapturedDefinitions = true;
          this.hasCapturingUses = true;
        }

        break;
      }

      // Variables are captured if a lambda is in the scope chain
      if (scope.kind == Skew.LambdaConversion.CaptureKind.LAMBDA) {
        isCaptured = true;
      }
    }
  };

  Skew.LambdaConversion.Scope.prototype.createReferenceToScope = function(scope) {
    // Skip to the enclosing scope with an environment
    var target = this;

    while (target.environmentObject == null) {
      assert(!target.hasCapturedDefinitions && target.kind != Skew.LambdaConversion.CaptureKind.LAMBDA);
      target = target.parent;
    }

    // Reference this scope
    if (scope == target) {
      return Skew.Node.createSymbolReference(target.environmentVariable);
    }

    // Reference a parent scope
    var copy = in_IntMap.get1(target.copyLookup, scope.id);

    if (copy.scope == target.parent) {
      return Skew.Node.createMemberReference(Skew.Node.createSymbolReference(target.environmentVariable), copy.member);
    }

    // Reference a grandparent scope
    return Skew.Node.createMemberReference(Skew.Node.createSymbolReference(target.parent.environmentVariable), in_IntMap.get1(target.parent.copyLookup, copy.scope.id).member);
  };

  Skew.LambdaConversion.Converter = function(_global, _cache) {
    this._global = _global;
    this._cache = _cache;
    this._scopes = [];
    this._stack = [];
    this._interfaces = {};
    this._calls = [];
    this._enclosingFunction = null;
  };

  Skew.LambdaConversion.Converter.prototype.run = function() {
    this._visitObject(this._global);
    this._convertCalls();
    this._convertLambdas();
  };

  Skew.LambdaConversion.Converter.prototype._convertCalls = function() {
    var swap = new Skew.Node(Skew.NodeKind.NULL);

    for (var i = 0, list = this._calls, count = list.length; i < count; i = i + 1 | 0) {
      var node = in_List.get(list, i);
      var value = node.callValue();
      var resolvedType = value.resolvedType;

      if (resolvedType.kind == Skew.TypeKind.LAMBDA) {
        var interfaceType = this._interfaceTypeForLambdaType(resolvedType);
        var interfaceRun = in_List.first(interfaceType.symbol.asObjectSymbol().functions);
        assert(interfaceRun.name == 'run');
        value.replaceWith(swap);
        swap.replaceWith(Skew.Node.createMemberReference(value, interfaceRun));
      }
    }
  };

  Skew.LambdaConversion.Converter.prototype._convertLambdas = function() {
    // Propagate required environment copies up the scope chain
    for (var i1 = 0, list1 = this._scopes, count1 = list1.length; i1 < count1; i1 = i1 + 1 | 0) {
      var scope = in_List.get(list1, i1);

      if (scope.hasCapturingUses) {
        for (var i = 0, list = scope.uses, count = list.length; i < count; i = i + 1 | 0) {
          var use = in_List.get(list, i);

          if (use.definition.isCaptured) {
            var definingScope = use.definition.scope;

            for (var s = scope; s != definingScope; s = s.parent) {
              if (!(definingScope.id in s.copyLookup)) {
                var copy = new Skew.LambdaConversion.Copy(definingScope);
                s.copies.push(copy);
                s.copyLookup[definingScope.id] = copy;
              }
            }
          }
        }
      }
    }

    for (var i5 = 0, list5 = this._scopes, count5 = list5.length; i5 < count5; i5 = i5 + 1 | 0) {
      var scope1 = in_List.get(list5, i5);

      if (scope1.hasCapturedDefinitions || scope1.kind == Skew.LambdaConversion.CaptureKind.LAMBDA) {
        // Create an object to store the environment
        var object = this._createObject(Skew.SymbolKind.OBJECT_CLASS, this._global.scope.generateName(scope1.kind == Skew.LambdaConversion.CaptureKind.LAMBDA ? 'Lambda' : 'Env'));
        var $constructor = Skew.LambdaConversion.Converter._createConstructor(object);
        var constructorCall = Skew.Node.createCall(Skew.Node.createMemberReference(Skew.Node.createSymbolReference(object), $constructor)).withType(object.resolvedType);

        // The environment must store all captured variables
        for (var i2 = 0, list2 = scope1.definitions, count2 = list2.length; i2 < count2; i2 = i2 + 1 | 0) {
          var definition = in_List.get(list2, i2);

          if (definition.isCaptured) {
            definition.member = Skew.LambdaConversion.Converter._createInstanceVariable(object.scope.generateName(definition.symbol.name), definition.symbol.resolvedType, object);
          }
        }

        // Insert the constructor call declaration
        switch (scope1.kind) {
          case Skew.LambdaConversion.CaptureKind.FUNCTION: {
            // Store the environment instance in a variable
            var variable = Skew.LambdaConversion.Converter._createVariable(Skew.SymbolKind.VARIABLE_LOCAL, scope1.enclosingFunction.scope.generateName('env'), object.resolvedType);
            variable.value = constructorCall;
            scope1.environmentVariable = variable;

            // Define the variable at the top of the function body
            var variables = new Skew.Node(Skew.NodeKind.VARIABLES).appendChild(Skew.Node.createVariable(variable));

            // TODO: Insert this after the call to "super"
            scope1.node.prependChild(variables);

            // Assign captured arguments and "self" to the environment
            // TODO: Remove the extra indirection to "self", copy it directly into environments instead
            var previous = variables;

            for (var i3 = 0, list3 = scope1.definitions, count3 = list3.length; i3 < count3; i3 = i3 + 1 | 0) {
              var definition1 = in_List.get(list3, i3);

              if (definition1.isCaptured && (definition1.symbol.kind == Skew.SymbolKind.VARIABLE_ARGUMENT || definition1.symbol == scope1.enclosingFunction.$this)) {
                var assignment = Skew.LambdaConversion.Converter._createAssignment(variable, definition1.member, definition1.symbol);
                scope1.node.insertChildAfter(previous, assignment);
                previous = assignment;
              }
            }
            break;
          }

          case Skew.LambdaConversion.CaptureKind.LAMBDA: {
            var $function = scope1.node.symbol.asFunctionSymbol();
            var block = scope1.node.lambdaBlock().remove();
            $function.kind = Skew.SymbolKind.FUNCTION_INSTANCE;
            $function.name = 'run';
            $function.$this = Skew.LambdaConversion.Converter._createVariable(Skew.SymbolKind.VARIABLE_LOCAL, 'self', object.resolvedType);
            $function.parent = object;
            object.functions.push($function);
            scope1.node.become(constructorCall);
            scope1.environmentVariable = $function.$this;
            constructorCall = scope1.node;

            // Assign captured arguments to the environment
            var first = block.firstChild();

            for (var i4 = 0, list4 = scope1.definitions, count4 = list4.length; i4 < count4; i4 = i4 + 1 | 0) {
              var definition2 = in_List.get(list4, i4);

              if (definition2.isCaptured && definition2.symbol.kind == Skew.SymbolKind.VARIABLE_ARGUMENT) {
                var assignment1 = Skew.LambdaConversion.Converter._createAssignment($function.$this, definition2.member, definition2.symbol);
                block.insertChildBefore(first, assignment1);
              }
            }

            // Implement the lambda interface with the right type parameters
            var interfaceType = this._interfaceTypeForLambdaType($function.resolvedType);
            var interfaceFunction = in_List.first(interfaceType.symbol.asObjectSymbol().functions);
            assert(interfaceFunction.name == 'run');
            object.$implements = [new Skew.Node(Skew.NodeKind.TYPE).withType(interfaceType)];
            object.interfaceTypes = [interfaceType];

            if (interfaceFunction.implementations == null) {
              interfaceFunction.implementations = [];
            }

            interfaceFunction.implementations.push($function);
            break;
          }

          case Skew.LambdaConversion.CaptureKind.LOOP: {
            // Store the environment instance in a variable
            var variable1 = Skew.LambdaConversion.Converter._createVariable(Skew.SymbolKind.VARIABLE_LOCAL, scope1.enclosingFunction.scope.generateName('env'), object.resolvedType);
            variable1.value = constructorCall;
            scope1.environmentVariable = variable1;

            // Define the variable at the top of the function body
            var variables1 = new Skew.Node(Skew.NodeKind.VARIABLES).appendChild(Skew.Node.createVariable(variable1));
            var node = scope1.node;
            var block1 = node.kind == Skew.NodeKind.FOR ? node.forBlock() : node.kind == Skew.NodeKind.FOREACH ? node.foreachBlock() : node.kind == Skew.NodeKind.WHILE ? node.whileBlock() : null;
            block1.prependChild(variables1);
            break;
          }

          default: {
            assert(false);
            break;
          }
        }

        // These will be referenced later
        scope1.environmentObject = object;
        scope1.environmentConstructor = $constructor;
        scope1.environmentConstructorCall = constructorCall;
      }

      // Mutate the parent scope pointer to skip past irrelevant scopes
      // (those without environments). This means everything necessary to
      // access captured symbols can be found on the environment associated
      // with the parent scope without needing to look at grandparent scopes.
      //
      // All parent scopes that need environments should already have them
      // because scopes are iterated over using a pre-order traversal.
      while (scope1.parent != null && scope1.parent.environmentObject == null) {
        assert(!scope1.parent.hasCapturedDefinitions && scope1.parent.kind != Skew.LambdaConversion.CaptureKind.LAMBDA);
        scope1.parent = scope1.parent.parent;
      }
    }

    // Make sure each environment has a copy of each parent environment that it or its children needs
    for (var i7 = 0, list7 = this._scopes, count7 = list7.length; i7 < count7; i7 = i7 + 1 | 0) {
      var scope2 = in_List.get(list7, i7);
      var object1 = scope2.environmentObject;
      var constructor1 = scope2.environmentConstructor;
      var constructorCall1 = scope2.environmentConstructorCall;

      if (object1 != null) {
        for (var i6 = 0, list6 = scope2.copies, count6 = list6.length; i6 < count6; i6 = i6 + 1 | 0) {
          var copy1 = in_List.get(list6, i6);
          var name = object1.scope.generateName('copy');
          var member = Skew.LambdaConversion.Converter._createInstanceVariable(name, copy1.scope.environmentObject.resolvedType, object1);
          var argument = Skew.LambdaConversion.Converter._createVariable(Skew.SymbolKind.VARIABLE_ARGUMENT, name, member.resolvedType);
          copy1.member = member;
          constructor1.$arguments.push(argument);
          constructor1.resolvedType.argumentTypes.push(argument.resolvedType);
          constructor1.block.appendChild(Skew.LambdaConversion.Converter._createAssignment(constructor1.$this, member, argument));
          constructorCall1.appendChild(scope2.parent.createReferenceToScope(copy1.scope));
        }
      }
    }

    for (var i10 = 0, list10 = this._scopes, count10 = list10.length; i10 < count10; i10 = i10 + 1 | 0) {
      var scope3 = in_List.get(list10, i10);

      // Replace variable definitions of captured symbols with assignments to their environment
      if (scope3.hasCapturedDefinitions) {
        for (var i8 = 0, list8 = scope3.definitions, count8 = list8.length; i8 < count8; i8 = i8 + 1 | 0) {
          var definition3 = in_List.get(list8, i8);

          if (definition3.isCaptured && definition3.node != null) {
            assert(definition3.node.kind == Skew.NodeKind.VARIABLE);
            assert(definition3.node.parent().kind == Skew.NodeKind.VARIABLES);
            definition3.node.extractVariableFromVariables();
            definition3.node.parent().replaceWith(Skew.Node.createExpression(Skew.Node.createBinary(Skew.NodeKind.ASSIGN, Skew.Node.createMemberReference(Skew.Node.createSymbolReference(scope3.environmentVariable), definition3.member), definition3.symbol.value.remove()).withType(definition3.member.resolvedType)));
          }
        }
      }

      // Replace all references to captured variables with a member access from the appropriate environment
      for (var i9 = 0, list9 = scope3.uses, count9 = list9.length; i9 < count9; i9 = i9 + 1 | 0) {
        var use1 = in_List.get(list9, i9);

        if (use1.definition.isCaptured) {
          use1.node.become(Skew.Node.createMemberReference(scope3.createReferenceToScope(use1.definition.scope), use1.definition.member));
        }
      }
    }
  };

  Skew.LambdaConversion.Converter.prototype._visitObject = function(symbol) {
    for (var i = 0, list = symbol.objects, count = list.length; i < count; i = i + 1 | 0) {
      var object = in_List.get(list, i);
      this._visitObject(object);
    }

    for (var i1 = 0, list1 = symbol.functions, count1 = list1.length; i1 < count1; i1 = i1 + 1 | 0) {
      var $function = in_List.get(list1, i1);
      this._visitFunction($function);
    }

    for (var i2 = 0, list2 = symbol.variables, count2 = list2.length; i2 < count2; i2 = i2 + 1 | 0) {
      var variable = in_List.get(list2, i2);
      this._visitVariable(variable);
    }
  };

  Skew.LambdaConversion.Converter.prototype._visitFunction = function(symbol) {
    if (symbol.block != null) {
      this._enclosingFunction = symbol;
      var scope = this._pushScope(Skew.LambdaConversion.CaptureKind.FUNCTION, symbol.block, null);

      if (symbol.$this != null) {
        scope.recordDefinition(symbol.$this, null);
      }

      for (var i = 0, list = symbol.$arguments, count = list.length; i < count; i = i + 1 | 0) {
        var argument = in_List.get(list, i);
        scope.recordDefinition(argument, null);
      }

      this._visit(symbol.block);
      in_List.removeLast(this._stack);
      this._enclosingFunction = null;
    }
  };

  Skew.LambdaConversion.Converter.prototype._visitVariable = function(symbol) {
    if (symbol.value != null) {
      this._visit(symbol.value);
    }
  };

  Skew.LambdaConversion.Converter.prototype._visit = function(node) {
    var kind = node.kind;
    var symbol = node.symbol;
    var oldEnclosingFunction = this._enclosingFunction;

    if (kind == Skew.NodeKind.LAMBDA) {
      this._enclosingFunction = symbol.asFunctionSymbol();
      var scope = this._pushScope(Skew.LambdaConversion.CaptureKind.LAMBDA, node, this._stack.length == 0 ? null : in_List.last(this._stack));

      for (var i = 0, list = symbol.asFunctionSymbol().$arguments, count = list.length; i < count; i = i + 1 | 0) {
        var argument = in_List.get(list, i);
        scope.recordDefinition(argument, null);
      }
    }

    else if (kind == Skew.NodeKind.FOREACH) {
      var scope1 = this._pushScope(Skew.LambdaConversion.CaptureKind.LOOP, node, in_List.last(this._stack));
      scope1.recordDefinition(symbol.asVariableSymbol(), null);
    }

    else if (kind == Skew.NodeKind.FOR || kind == Skew.NodeKind.WHILE) {
      this._pushScope(Skew.LambdaConversion.CaptureKind.LOOP, node, in_List.last(this._stack));
    }

    else if (kind == Skew.NodeKind.VARIABLE) {
      in_List.last(this._stack).recordDefinition(symbol.asVariableSymbol(), node);
    }

    else if (kind == Skew.NodeKind.CATCH) {
    }

    else if (kind == Skew.NodeKind.CALL) {
      this._calls.push(node);
    }

    else if (kind == Skew.NodeKind.NAME && symbol != null && (symbol.kind == Skew.SymbolKind.VARIABLE_ARGUMENT || symbol.kind == Skew.SymbolKind.VARIABLE_LOCAL)) {
      in_List.last(this._stack).recordUse(symbol.asVariableSymbol(), node);
    }

    for (var child = node.firstChild(); child != null; child = child.nextSibling()) {
      this._visit(child);
    }

    if (kind == Skew.NodeKind.LAMBDA) {
      in_List.removeLast(this._stack);
      this._enclosingFunction = oldEnclosingFunction;
    }

    else if (Skew.in_NodeKind.isLoop(kind)) {
      in_List.removeLast(this._stack);
    }
  };

  Skew.LambdaConversion.Converter.prototype._pushScope = function(kind, node, parent) {
    var scope = new Skew.LambdaConversion.Scope(kind, node, this._enclosingFunction, parent);
    this._scopes.push(scope);
    this._stack.push(scope);
    return scope;
  };

  Skew.LambdaConversion.Converter.prototype._createObject = function(kind, name) {
    var object = new Skew.ObjectSymbol(kind, this._global.scope.generateName(name));
    object.scope = new Skew.ObjectScope(this._global.scope, object);
    object.resolvedType = new Skew.Type(Skew.TypeKind.SYMBOL, object);
    object.state = Skew.SymbolState.INITIALIZED;
    object.parent = this._global;
    this._global.objects.push(object);
    return object;
  };

  Skew.LambdaConversion.Converter.prototype._createInterface = function(count, hasReturnType) {
    var key = count | (hasReturnType ? 1 << 31 : 0);
    var object = in_IntMap.get(this._interfaces, key, null);

    if (object == null) {
      object = this._createObject(Skew.SymbolKind.OBJECT_INTERFACE, (hasReturnType ? 'Fn' : 'FnVoid') + count.toString());
      object.flags |= Skew.SymbolFlags.IS_IMPORTED;
      this._interfaces[key] = object;
      var $function = Skew.LambdaConversion.Converter._createFunction(object, Skew.SymbolKind.FUNCTION_INSTANCE, 'run', Skew.LambdaConversion.Converter.Body.ABSTRACT);
      $function.flags |= Skew.SymbolFlags.IS_IMPORTED;
      $function.resolvedType.argumentTypes = [];

      if (hasReturnType) {
        var returnType = Skew.LambdaConversion.Converter._createParameter(object, 'R').resolvedType;
        $function.resolvedType.returnType = returnType;
        $function.returnType = new Skew.Node(Skew.NodeKind.TYPE).withType(returnType);
      }

      for (var i = 0, count1 = count; i < count1; i = i + 1 | 0) {
        var parameter = Skew.LambdaConversion.Converter._createParameter(object, 'A' + (i + 1 | 0).toString());
        $function.$arguments.push(Skew.LambdaConversion.Converter._createVariable(Skew.SymbolKind.VARIABLE_ARGUMENT, 'a' + (i + 1 | 0).toString(), parameter.resolvedType));
        $function.resolvedType.argumentTypes.push(parameter.resolvedType);
      }
    }

    return object;
  };

  Skew.LambdaConversion.Converter.prototype._interfaceTypeForLambdaType = function(lambdaType) {
    var $interface = this._createInterface(lambdaType.argumentTypes.length, lambdaType.returnType != null);
    var interfaceType = $interface.resolvedType;
    var substitutions = [];

    if (lambdaType.returnType != null) {
      substitutions.push(lambdaType.returnType);
    }

    in_List.append1(substitutions, lambdaType.argumentTypes);

    if (!(substitutions.length == 0)) {
      interfaceType = this._cache.substitute(interfaceType, this._cache.createEnvironment($interface.parameters, substitutions));
    }

    return interfaceType;
  };

  Skew.LambdaConversion.Converter._createConstructor = function(object) {
    var $function = Skew.LambdaConversion.Converter._createFunction(object, Skew.SymbolKind.FUNCTION_CONSTRUCTOR, 'new', Skew.LambdaConversion.Converter.Body.IMPLEMENTED);
    $function.resolvedType.returnType = object.resolvedType;
    $function.returnType = new Skew.Node(Skew.NodeKind.TYPE).withType(object.resolvedType);
    return $function;
  };

  Skew.LambdaConversion.Converter._createFunction = function(object, kind, name, body) {
    var $function = new Skew.FunctionSymbol(kind, name);
    $function.scope = new Skew.FunctionScope(object.scope, $function);
    $function.resolvedType = new Skew.Type(Skew.TypeKind.SYMBOL, $function);
    $function.resolvedType.argumentTypes = [];
    $function.state = Skew.SymbolState.INITIALIZED;
    $function.parent = object;

    if (body == Skew.LambdaConversion.Converter.Body.IMPLEMENTED) {
      $function.block = new Skew.Node(Skew.NodeKind.BLOCK);
      $function.$this = Skew.LambdaConversion.Converter._createVariable(Skew.SymbolKind.VARIABLE_LOCAL, 'self', object.resolvedType);
    }

    object.functions.push($function);
    return $function;
  };

  Skew.LambdaConversion.Converter._createInstanceVariable = function(name, type, object) {
    var variable = Skew.LambdaConversion.Converter._createVariable(Skew.SymbolKind.VARIABLE_INSTANCE, name, type);
    variable.parent = object;
    object.variables.push(variable);
    return variable;
  };

  Skew.LambdaConversion.Converter._createVariable = function(kind, name, type) {
    var variable = new Skew.VariableSymbol(kind, name);
    variable.initializeWithType(type);
    return variable;
  };

  Skew.LambdaConversion.Converter._createParameter = function(parent, name) {
    var parameter = new Skew.ParameterSymbol(Skew.SymbolKind.PARAMETER_OBJECT, name);
    parameter.resolvedType = new Skew.Type(Skew.TypeKind.SYMBOL, parameter);
    parameter.state = Skew.SymbolState.INITIALIZED;

    if (parent.parameters == null) {
      parent.parameters = [];
    }

    parent.parameters.push(parameter);
    return parameter;
  };

  Skew.LambdaConversion.Converter._createAssignment = function(object, member, variable) {
    return Skew.Node.createExpression(Skew.Node.createBinary(Skew.NodeKind.ASSIGN, Skew.Node.createMemberReference(Skew.Node.createSymbolReference(object), member), Skew.Node.createSymbolReference(variable)).withType(member.resolvedType));
  };

  Skew.LambdaConversion.Converter.Body = {
    ABSTRACT: 0,
    IMPLEMENTED: 1
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
      for (var i = 0, list = symbol.parameters, count = list.length; i < count; i = i + 1 | 0) {
        var parameter = in_List.get(list, i);
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
        var swap = other.range;
        other.range = child.range;
        child.range = swap;
        other.kind = child.kind;
      }

      else if (child.kind == Skew.SymbolKind.OBJECT_NAMESPACE) {
        child.kind = other.kind;
      }

      else if (child.kind != other.kind) {
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
      if (child.$implements != null) {
        if (object.$implements != null) {
          in_List.append1(object.$implements, child.$implements);
        }

        else {
          object.$implements = child.$implements;
        }
      }

      // Cannot merge two objects that both have type parameters
      if (child.parameters != null && object.parameters != null) {
        log.semanticErrorDuplicateTypeParameters(Skew.Merging.rangeOfParameters(child.parameters), child.name, Skew.Merging.rangeOfParameters(object.parameters));
        return true;
      }

      // Merge "child" into "other"
      Skew.Merging.mergeObject(log, parent, object, child);
      object.mergeInformationFrom(child);
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

        for (var i = 0, list = child.guards, count = list.length; i < count; i = i + 1 | 0) {
          var guard = in_List.get(list, i);

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

    for (var i1 = 0, list1 = children, count1 = list1.length; i1 < count1; i1 = i1 + 1 | 0) {
      var child = in_List.get(list1, i1);
      var other = in_StringMap.get(members, child.name, null);

      // Create a scope for this function's type parameters
      if (behavior == Skew.Merging.MergeBehavior.NORMAL) {
        var scope = new Skew.FunctionScope(parent.scope, child);
        child.scope = scope;
        child.parent = parent;

        if (child.parameters != null) {
          for (var i = 0, list = child.parameters, count = list.length; i < count; i = i + 1 | 0) {
            var parameter = in_List.get(list, i);
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

    for (var i = 0, list = children, count = list.length; i < count; i = i + 1 | 0) {
      var child = in_List.get(list, i);
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
    return Skew.Range.span(in_List.first(parameters).range, in_List.last(parameters).range);
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
    var values = in_IntMap.values(namespaces);

    // Sort so the order is deterministic
    values.sort(Skew.Symbol.SORT_OBJECTS_BY_ID);

    for (var i = 0, list = values, count = list.length; i < count; i = i + 1 | 0) {
      var object = in_List.get(list, i);
      object.parent.asObjectSymbol().objects.push(object);
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

    // Move stuff off of enums and flags
    if (Skew.in_SymbolKind.isEnumOrFlags(symbol.kind)) {
      symbol.objects.forEach(function(object) {
        Skew.Motion.moveSymbolIntoNewNamespace(object, namespaces).objects.push(object);
      });
      symbol.functions.forEach(function($function) {
        Skew.Motion.moveSymbolIntoNewNamespace($function, namespaces).functions.push($function);
      });
      in_List.removeIf(symbol.variables, function(variable) {
        if (variable.kind != Skew.SymbolKind.VARIABLE_ENUM_OR_FLAGS) {
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
    var namespace = in_IntMap.get(namespaces, parent.id, null);
    var object = namespace != null ? namespace.asObjectSymbol() : null;

    // Create a parallel namespace next to the parent
    if (namespace == null) {
      var common = parent.parent.asObjectSymbol();
      object = new Skew.ObjectSymbol(Skew.SymbolKind.OBJECT_NAMESPACE, 'in_' + parent.name);
      object.resolvedType = new Skew.Type(Skew.TypeKind.SYMBOL, object);
      object.state = Skew.SymbolState.INITIALIZED;
      object.scope = new Skew.ObjectScope(common.scope, object);
      object.parent = common;
      namespaces[parent.id] = object;
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

    for (var i = 0, count1 = functions.length; i < count1; i = i + 1 | 0) {
      in_List.get(functions, i).namingGroup = i;
      groups.push(null);
    }

    for (var i2 = 0, list1 = functions, count3 = list1.length; i2 < count3; i2 = i2 + 1 | 0) {
      var $function = in_List.get(list1, i2);

      if ($function.overridden != null) {
        labels.union($function.namingGroup, $function.overridden.namingGroup);
      }

      if ($function.implementations != null) {
        for (var i1 = 0, list = $function.implementations, count2 = list.length; i1 < count2; i1 = i1 + 1 | 0) {
          var implementation = in_List.get(list, i1);
          labels.union($function.namingGroup, implementation.namingGroup);
        }
      }
    }

    for (var i3 = 0, list2 = functions, count4 = list2.length; i3 < count4; i3 = i3 + 1 | 0) {
      var function1 = in_List.get(list2, i3);
      var label = labels.find(function1.namingGroup);
      var group = in_List.get(groups, label);
      function1.namingGroup = label;

      if (group == null) {
        group = [];
        in_List.set(groups, label, group);
      }

      else {
        assert(function1.name == in_List.first(group).name);
      }

      group.push(function1);
    }

    // Rename stuff
    for (var i7 = 0, list3 = groups, count8 = list3.length; i7 < count8; i7 = i7 + 1 | 0) {
      var group1 = in_List.get(list3, i7);

      if (group1 == null) {
        continue;
      }

      var isImportedOrExported = false;
      var shouldRename = false;
      var isInvalid = false;
      var rename = null;

      for (var i4 = 0, count5 = group1.length; i4 < count5; i4 = i4 + 1 | 0) {
        var function2 = in_List.get(group1, i4);

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
        if (!shouldRename) {
          if (Skew.Renaming.isInvalidIdentifier(function2.name)) {
            isInvalid = true;
            shouldRename = true;
          }

          else if (function2.overloaded != null && function2.overloaded.symbols.length > 1) {
            shouldRename = true;
          }
        }
      }

      // Bake in the rename annotation now
      if (rename != null) {
        for (var i5 = 0, count6 = group1.length; i5 < count6; i5 = i5 + 1 | 0) {
          var function3 = in_List.get(group1, i5);
          function3.flags |= Skew.SymbolFlags.IS_RENAMED;
          function3.name = rename;
          function3.rename = null;
        }

        continue;
      }

      // One function with a pinned name causes the whole group to avoid renaming
      if (!shouldRename || isImportedOrExported && !isInvalid) {
        continue;
      }

      var first = in_List.first(group1);
      var $arguments = first.$arguments.length;
      var count = 0;
      var start = first.name;

      if (($arguments == 0 || $arguments == 1 && first.kind == Skew.SymbolKind.FUNCTION_GLOBAL) && start in Skew.Renaming.unaryPrefixes) {
        start = in_StringMap.get1(Skew.Renaming.unaryPrefixes, start);
      }

      else if (start in Skew.Renaming.prefixes) {
        start = in_StringMap.get1(Skew.Renaming.prefixes, start);
      }

      else {
        if (in_string.startsWith(start, '@')) {
          start = in_string.slice1(start, 1);
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
        count = count + 1 | 0;
        name = start + count.toString();
      }

      for (var i6 = 0, count7 = group1.length; i6 < count7; i6 = i6 + 1 | 0) {
        var function4 = in_List.get(group1, i6);
        function4.scope.parent.reserveName(name, null);
        function4.name = name;
      }
    }
  };

  Skew.Renaming.collectFunctionAndRenameObjectsAndVariables = function(symbol, functions) {
    for (var i = 0, list = symbol.objects, count = list.length; i < count; i = i + 1 | 0) {
      var object = in_List.get(list, i);

      if (object.rename != null) {
        object.name = object.rename;
        object.rename = null;
      }

      Skew.Renaming.collectFunctionAndRenameObjectsAndVariables(object, functions);
    }

    for (var i1 = 0, list1 = symbol.functions, count1 = list1.length; i1 < count1; i1 = i1 + 1 | 0) {
      var $function = in_List.get(list1, i1);
      functions.push($function);
    }

    for (var i2 = 0, list2 = symbol.variables, count2 = list2.length; i2 < count2; i2 = i2 + 1 | 0) {
      var variable = in_List.get(list2, i2);

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
    for (var i = 0, count = name.length; i < count; i = i + 1 | 0) {
      var c = in_string.get1(name, i);

      if (!Skew.Renaming.isAlpha(c) && (i == 0 || !Skew.Renaming.isNumber(c))) {
        return true;
      }
    }

    return false;
  };

  Skew.Renaming.generateValidIdentifier = function(name) {
    var text = '';

    for (var i = 0, count = name.length; i < count; i = i + 1 | 0) {
      var c = in_string.get1(name, i);

      if (Skew.Renaming.isAlpha(c) || Skew.Renaming.isNumber(c)) {
        text += in_string.get(name, i);
      }
    }

    if (text != '' && in_string.endsWith(name, '=')) {
      return 'set' + in_string.slice2(text, 0, 1).toUpperCase() + in_string.slice1(text, 1);
    }

    return text == '' || !Skew.Renaming.isAlpha(in_string.get1(text, 0)) ? '_' + text : text;
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
    new Skew.Resolving.Resolver(context.global, context.options, in_StringMap.clone(context.options.defines), context.cache, context.log).resolve();
    context.isResolvePassComplete = true;
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

  Skew.Resolving.LocalVariableStatistics.SORT_BY_ID = function(a, b) {
    return in_int.compare(a.symbol.id, b.symbol.id);
  };

  Skew.Resolving.Resolver = function(_global, _options, _defines, _cache, _log) {
    this._global = _global;
    this._options = _options;
    this._defines = _defines;
    this._cache = _cache;
    this._log = _log;
    this._foreachLoops = [];
    this._localVariableStatistics = {};
    this._controlFlow = new Skew.ControlFlowAnalyzer();
    this._generatedGlobalVariables = [];
    this._constantFolder = null;
    this._isMergingGuards = true;
  };

  Skew.Resolving.Resolver.prototype.resolve = function() {
    var self = this;
    self._constantFolder = new Skew.Folding.ConstantFolder(self._cache, self._options, function(symbol) {
      self._initializeSymbol(symbol);
    });
    self._initializeGlobals();
    self._iterativelyMergeGuards();
    self._resolveGlobal();
    self._removeObsoleteFunctions(self._global);
    in_List.insert1(self._global.variables, 0, self._generatedGlobalVariables);
  };

  // Put the guts of the function inside another function because V8 doesn't
  // optimize functions with try-catch statements
  Skew.Resolving.Resolver.prototype._initializeSymbolSwitch = function(symbol) {
    switch (symbol.kind) {
      case Skew.SymbolKind.OBJECT_CLASS:
      case Skew.SymbolKind.OBJECT_ENUM:
      case Skew.SymbolKind.OBJECT_FLAGS:
      case Skew.SymbolKind.OBJECT_GLOBAL:
      case Skew.SymbolKind.OBJECT_INTERFACE:
      case Skew.SymbolKind.OBJECT_NAMESPACE:
      case Skew.SymbolKind.OBJECT_WRAPPED: {
        this._initializeObject(symbol.asObjectSymbol());
        break;
      }

      case Skew.SymbolKind.FUNCTION_ANNOTATION:
      case Skew.SymbolKind.FUNCTION_CONSTRUCTOR:
      case Skew.SymbolKind.FUNCTION_GLOBAL:
      case Skew.SymbolKind.FUNCTION_INSTANCE:
      case Skew.SymbolKind.FUNCTION_LOCAL: {
        this._initializeFunction(symbol.asFunctionSymbol());
        break;
      }

      case Skew.SymbolKind.VARIABLE_ARGUMENT:
      case Skew.SymbolKind.VARIABLE_ENUM_OR_FLAGS:
      case Skew.SymbolKind.VARIABLE_GLOBAL:
      case Skew.SymbolKind.VARIABLE_INSTANCE:
      case Skew.SymbolKind.VARIABLE_LOCAL: {
        this._initializeVariable(symbol.asVariableSymbol());
        break;
      }

      case Skew.SymbolKind.PARAMETER_FUNCTION:
      case Skew.SymbolKind.PARAMETER_OBJECT: {
        this._initializeParameter(symbol.asParameterSymbol());
        break;
      }

      case Skew.SymbolKind.OVERLOADED_ANNOTATION:
      case Skew.SymbolKind.OVERLOADED_GLOBAL:
      case Skew.SymbolKind.OVERLOADED_INSTANCE: {
        this._initializeOverloadedFunction(symbol.asOverloadedFunctionSymbol());
        break;
      }

      default: {
        assert(false);
        break;
      }
    }
  };

  Skew.Resolving.Resolver.prototype._initializeSymbol = function(symbol) {
    // The scope should have been set by the merging pass (or by this pass for local variables)
    assert(symbol.scope != null);

    // Only initialize the symbol once
    if (symbol.state == Skew.SymbolState.UNINITIALIZED) {
      symbol.state = Skew.SymbolState.INITIALIZING;

      try {
        this._initializeSymbolSwitch(symbol);
      }

      catch (failure) {
        if (failure instanceof Skew.Resolving.Resolver.GuardMergingFailure) {
          symbol.state = Skew.SymbolState.UNINITIALIZED;

          throw failure;
        }

        else {
          throw failure;
        }
      }

      assert(symbol.resolvedType != null);
      symbol.state = Skew.SymbolState.INITIALIZED;

      if (Skew.in_SymbolKind.isFunction(symbol.kind)) {
        var $function = symbol.asFunctionSymbol();
        var overloaded = $function.overloaded;

        // After initializing a function symbol, ensure the entire overload set is initialized
        if (overloaded != null && overloaded.state == Skew.SymbolState.UNINITIALIZED) {
          this._initializeSymbol(overloaded);
        }
      }
    }

    // Detect cyclic symbol references such as "foo foo;"
    else if (symbol.state == Skew.SymbolState.INITIALIZING) {
      this._log.semanticErrorCyclicDeclaration(symbol.range, symbol.name);
      symbol.resolvedType = Skew.Type.DYNAMIC;
    }
  };

  Skew.Resolving.Resolver.prototype._validateEntryPoint = function(symbol) {
    // Detect duplicate entry points
    if (this._cache.entryPointSymbol != null) {
      this._log.semanticErrorDuplicateEntryPoint(symbol.range, this._cache.entryPointSymbol.range);
      return;
    }

    this._cache.entryPointSymbol = symbol;

    // Only recognize a few entry point types
    var type = symbol.resolvedType;

    if (type != Skew.Type.DYNAMIC) {
      var argumentTypes = type.argumentTypes;

      // The argument list must be empty or one argument of type "List<string>"
      if (argumentTypes.length > 1 || argumentTypes.length == 1 && in_List.first(argumentTypes) != this._cache.createListType(this._cache.stringType)) {
        this._log.semanticErrorInvalidEntryPointArguments(Skew.Range.span(in_List.first(symbol.$arguments).range, in_List.last(symbol.$arguments).type.range), symbol.name);
      }

      // The return type must be nothing or "int"
      else if (type.returnType != null && type.returnType != this._cache.intType) {
        this._log.semanticErrorInvalidEntryPointReturnType(symbol.returnType.range, symbol.name);
      }
    }
  };

  Skew.Resolving.Resolver.prototype._resolveDefines = function(symbol) {
    var key = symbol.fullName();
    var define = in_StringMap.get(this._defines, key, null);

    if (define == null) {
      return;
    }

    // Remove the define so we can tell what defines weren't used later on
    delete this._defines[key];
    var type = symbol.resolvedType;
    var range = define.value;
    var value = range.toString();
    var node = null;

    // Special-case booleans
    if (type == this._cache.boolType) {
      if (value == 'true' || value == 'false') {
        node = new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.BoolContent(value == 'true'));
      }
    }

    // Special-case doubles
    else if (type == this._cache.doubleType) {
      var number = +value;

      if (!isNaN(number)) {
        node = new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.DoubleContent(number));
      }
    }

    // Special-case strings
    else if (type == this._cache.stringType) {
      node = new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.StringContent(value));
    }

    // Special-case enums
    else if (type.isEnumOrFlags()) {
      node = new Skew.Node(Skew.NodeKind.DOT).withContent(new Skew.StringContent(value)).appendChild(null);
    }

    // Integers can also apply to doubles
    if (node == null && this._cache.isNumeric(type)) {
      var box = Skew.Parsing.parseIntLiteral(this._log, range);

      if (box != null) {
        node = new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.IntContent(box.value));
      }
    }

    // Stop if anything failed above
    if (node == null) {
      this._log.semanticErrorInvalidDefine1(range, value, type, key);
      return;
    }

    this._resolveAsParameterizedExpressionWithConversion(node.withRange(range), this._global.scope, type);
    symbol.value = node;
  };

  Skew.Resolving.Resolver.prototype._resolveAnnotations = function(symbol) {
    var self = this;
    var parent = symbol.parent;
    var annotations = symbol.annotations;

    // The import/export annotations are inherited, except import isn't inherited for implemented functions
    if (parent != null) {
      symbol.flags |= parent.flags & (Skew.in_SymbolKind.isFunction(symbol.kind) && symbol.asFunctionSymbol().block != null ? Skew.SymbolFlags.IS_EXPORTED : Skew.SymbolFlags.IS_IMPORTED | Skew.SymbolFlags.IS_EXPORTED);
    }

    // Resolve annotations on this symbol after annotation inheritance. Don't
    // use removeIf() since this annotation list may be shared elsewhere.
    if (annotations != null) {
      symbol.annotations = annotations.filter(function(annotation) {
        return self._resolveAnnotation(annotation, symbol);
      });
    }

    // Protected access used to be an annotation. It's now indicated with just
    // a leading underscore.
    if (in_string.startsWith(symbol.name, '_') && !Skew.in_SymbolKind.isLocal(symbol.kind)) {
      symbol.flags |= Skew.SymbolFlags.IS_PROTECTED;
    }
  };

  Skew.Resolving.Resolver.prototype._resolveParameters = function(parameters) {
    if (parameters != null) {
      for (var i = 0, list = parameters, count = list.length; i < count; i = i + 1 | 0) {
        var parameter = in_List.get(list, i);
        this._resolveParameter(parameter);
      }
    }
  };

  Skew.Resolving.Resolver.prototype._initializeParameter = function(symbol) {
    if (symbol.resolvedType == null) {
      symbol.resolvedType = new Skew.Type(Skew.TypeKind.SYMBOL, symbol);
    }

    this._resolveAnnotations(symbol);
  };

  Skew.Resolving.Resolver.prototype._resolveParameter = function(symbol) {
    this._initializeSymbol(symbol);
  };

  Skew.Resolving.Resolver.prototype._initializeObject = function(symbol) {
    var ref;
    var kind = symbol.kind;
    var $extends = symbol.$extends;
    var $implements = symbol.$implements;

    if (symbol.resolvedType == null) {
      symbol.resolvedType = new Skew.Type(Skew.TypeKind.SYMBOL, symbol);
    }

    this._resolveParameters(symbol.parameters);

    // Resolve the base type (only for classes and wrapped types)
    if ($extends != null) {
      this._resolveAsParameterizedType($extends, symbol.scope);
      var baseType = $extends.resolvedType;

      if (kind == Skew.SymbolKind.OBJECT_WRAPPED) {
        symbol.wrappedType = baseType;

        // Don't lose the type parameters from the base type
        symbol.resolvedType.environment = baseType.environment;
      }

      else if (kind != Skew.SymbolKind.OBJECT_CLASS || baseType != Skew.Type.DYNAMIC && (!baseType.isClass() || baseType.symbol.isValueType())) {
        this._log.semanticErrorInvalidExtends($extends.range, baseType);
      }

      else if (baseType != Skew.Type.DYNAMIC) {
        symbol.baseType = baseType;
        symbol.baseClass = baseType.symbol.asObjectSymbol();

        // Don't lose the type parameters from the base type
        symbol.resolvedType.environment = baseType.environment;

        // Copy members from the base type
        var functions = [];
        var members = in_StringMap.values(symbol.baseClass.members);

        // Sort so the order is deterministic
        members.sort(Skew.Symbol.SORT_BY_ID);

        for (var i2 = 0, list1 = members, count1 = list1.length; i2 < count1; i2 = i2 + 1 | 0) {
          var member = in_List.get(list1, i2);
          var memberKind = member.kind;

          // Separate out functions
          if (Skew.in_SymbolKind.isFunction(memberKind)) {
            if (memberKind != Skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
              functions.push(member.asFunctionSymbol());
            }
          }

          // Include overloaded functions individually
          else if (Skew.in_SymbolKind.isOverloadedFunction(memberKind)) {
            for (var i1 = 0, list = member.asOverloadedFunctionSymbol().symbols, count = list.length; i1 < count; i1 = i1 + 1 | 0) {
              var $function = in_List.get(list, i1);

              if ($function.kind != Skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
                functions.push($function);
              }
            }
          }

          // Other kinds
          else if (!Skew.in_SymbolKind.isParameter(memberKind)) {
            var other = in_StringMap.get(symbol.members, member.name, null);

            if (other != null) {
              this._log.semanticErrorBadOverride(other.range, other.name, baseType, member.range);
            }

            else {
              symbol.members[member.name] = member;
            }
          }
        }

        Skew.Merging.mergeFunctions(this._log, symbol, functions, Skew.Merging.MergeBehavior.INTO_DERIVED_CLASS);
      }
    }

    // Wrapped types without something to wrap don't make sense
    else if (kind == Skew.SymbolKind.OBJECT_WRAPPED) {
      this._log.semanticErrorMissingWrappedType(symbol.range, symbol.fullName());
    }

    // Resolve the base interface types
    if ($implements != null) {
      symbol.interfaceTypes = [];

      for (var i = 0, count2 = $implements.length; i < count2; i = i + 1 | 0) {
        var type = in_List.get($implements, i);
        this._resolveAsParameterizedType(type, symbol.scope);

        // Ignore the dynamic type, which will be from errors and dynamic expressions used for exports
        var interfaceType = type.resolvedType;

        if (interfaceType == Skew.Type.DYNAMIC) {
          continue;
        }

        // Only classes can derive from interfaces
        if (kind != Skew.SymbolKind.OBJECT_CLASS || !interfaceType.isInterface()) {
          this._log.semanticErrorInvalidImplements(type.range, interfaceType);
          continue;
        }

        // An interface can only be implemented once
        for (var j = 0; j < i; j = j + 1 | 0) {
          var other1 = in_List.get($implements, j);

          if (other1.resolvedType == interfaceType) {
            this._log.semanticErrorDuplicateImplements(type.range, interfaceType, other1.range);
            break;
          }
        }

        symbol.interfaceTypes.push(interfaceType);
      }
    }

    // Assign values for all enums and flags before they are initialized
    if (Skew.in_SymbolKind.isEnumOrFlags(kind)) {
      var nextValue = 0;

      for (var i3 = 0, list2 = symbol.variables, count3 = list2.length; i3 < count3; i3 = i3 + 1 | 0) {
        var variable = in_List.get(list2, i3);

        if (variable.kind == Skew.SymbolKind.VARIABLE_ENUM_OR_FLAGS) {
          if (nextValue >= 32 && kind == Skew.SymbolKind.OBJECT_FLAGS) {
            this._log.semanticErrorTooManyFlags(variable.range, symbol.name);
          }

          variable.value = new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.IntContent(kind == Skew.SymbolKind.OBJECT_FLAGS ? 1 << nextValue : nextValue)).withType(symbol.resolvedType).withRange(variable.range);
          nextValue = nextValue + 1 | 0;
        }
      }

      symbol.flags |= Skew.SymbolFlags.IS_VALUE_TYPE;
    }

    this._resolveAnnotations(symbol);

    // Create a default constructor if one doesn't exist
    var $constructor = in_StringMap.get(symbol.members, 'new', null);

    if (kind == Skew.SymbolKind.OBJECT_CLASS && !symbol.isImported() && $constructor == null) {
      var baseConstructor = (ref = symbol.baseClass) != null ? in_StringMap.get(ref.members, 'new', null) : null;

      // Unwrap the overload group if present
      if (baseConstructor != null && baseConstructor.kind == Skew.SymbolKind.OVERLOADED_GLOBAL) {
        var overloaded = baseConstructor.asOverloadedFunctionSymbol();

        for (var i4 = 0, list3 = overloaded.symbols, count4 = list3.length; i4 < count4; i4 = i4 + 1 | 0) {
          var overload = in_List.get(list3, i4);

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
        generated.flags |= Skew.SymbolFlags.IS_AUTOMATICALLY_GENERATED;
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
      generated1.flags |= Skew.SymbolFlags.IS_AUTOMATICALLY_GENERATED;
      generated1.parent = symbol;
      generated1.range = symbol.range;
      symbol.functions.push(generated1);
      symbol.members[generated1.name] = generated1;
    }
  };

  Skew.Resolving.Resolver.prototype._checkInterfacesAndAbstractStatus1 = function(object, $function) {
    assert($function.kind == Skew.SymbolKind.FUNCTION_INSTANCE);
    assert($function.state == Skew.SymbolState.INITIALIZED);

    if (!object.isAbstract() && !$function.isImported() && !$function.isObsolete() && $function.block == null) {
      object.isAbstractBecauseOf = $function;
    }
  };

  Skew.Resolving.Resolver.prototype._checkInterfacesAndAbstractStatus2 = function(symbol) {
    assert(symbol.state == Skew.SymbolState.INITIALIZED);

    if (symbol.hasCheckedInterfacesAndAbstractStatus || symbol.kind != Skew.SymbolKind.OBJECT_CLASS) {
      return;
    }

    symbol.hasCheckedInterfacesAndAbstractStatus = true;

    // Check to see if this class is abstract (has unimplemented members)
    var members = in_StringMap.values(symbol.members);

    // Sort so the order is deterministic
    members.sort(Skew.Symbol.SORT_BY_ID);

    for (var i1 = 0, list1 = members, count1 = list1.length; i1 < count1; i1 = i1 + 1 | 0) {
      var member = in_List.get(list1, i1);

      if (member.kind == Skew.SymbolKind.OVERLOADED_INSTANCE) {
        this._initializeSymbol(member);

        for (var i = 0, list = member.asOverloadedFunctionSymbol().symbols, count = list.length; i < count; i = i + 1 | 0) {
          var $function = in_List.get(list, i);
          this._checkInterfacesAndAbstractStatus1(symbol, $function);
        }
      }

      else if (member.kind == Skew.SymbolKind.FUNCTION_INSTANCE) {
        this._initializeSymbol(member);
        this._checkInterfacesAndAbstractStatus1(symbol, member.asFunctionSymbol());
      }

      if (symbol.isAbstract()) {
        break;
      }
    }

    // Check interfaces for missing implementations
    if (symbol.interfaceTypes != null) {
      for (var i4 = 0, list4 = symbol.interfaceTypes, count4 = list4.length; i4 < count4; i4 = i4 + 1 | 0) {
        var interfaceType = in_List.get(list4, i4);

        for (var i3 = 0, list3 = interfaceType.symbol.asObjectSymbol().functions, count3 = list3.length; i3 < count3; i3 = i3 + 1 | 0) {
          var function1 = in_List.get(list3, i3);

          if (function1.kind != Skew.SymbolKind.FUNCTION_INSTANCE || function1.block != null) {
            continue;
          }

          this._initializeSymbol(function1);
          var member1 = in_StringMap.get(symbol.members, function1.name, null);
          var match = null;
          var equivalence = Skew.TypeCache.Equivalence.NOT_EQUIVALENT;

          // Search for a matching function
          if (member1 != null) {
            this._initializeSymbol(member1);

            if (member1.kind == Skew.SymbolKind.OVERLOADED_INSTANCE) {
              for (var i2 = 0, list2 = member1.asOverloadedFunctionSymbol().symbols, count2 = list2.length; i2 < count2; i2 = i2 + 1 | 0) {
                var other = in_List.get(list2, i2);
                equivalence = this._cache.areFunctionSymbolsEquivalent(function1, interfaceType.environment, other, null);

                if (equivalence != Skew.TypeCache.Equivalence.NOT_EQUIVALENT) {
                  match = other;
                  break;
                }
              }
            }

            else if (member1.kind == Skew.SymbolKind.FUNCTION_INSTANCE) {
              equivalence = this._cache.areFunctionSymbolsEquivalent(function1, interfaceType.environment, member1.asFunctionSymbol(), null);

              if (equivalence != Skew.TypeCache.Equivalence.NOT_EQUIVALENT) {
                match = member1.asFunctionSymbol();
              }
            }
          }

          // Validate use of the interface
          if (match == null) {
            this._log.semanticErrorBadInterfaceImplementation(symbol.range, symbol.resolvedType, interfaceType, function1.name, function1.range);
          }

          else if (equivalence == Skew.TypeCache.Equivalence.EQUIVALENT_EXCEPT_RETURN_TYPE) {
            var returnType = function1.resolvedType.returnType;

            if (returnType != null) {
              returnType = this._cache.substitute(returnType, interfaceType.environment);
            }

            this._log.semanticErrorBadInterfaceImplementationReturnType(match.range, match.name, match.resolvedType.returnType, this._cache.substituteFunctionParameters(returnType, match, function1), interfaceType, function1.range);
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

  Skew.Resolving.Resolver.prototype._initializeGlobals = function() {
    this._initializeSymbol(this._cache.boolType.symbol);
    this._initializeSymbol(this._cache.doubleType.symbol);
    this._initializeSymbol(this._cache.intMapType.symbol);
    this._initializeSymbol(this._cache.intType.symbol);
    this._initializeSymbol(this._cache.listType.symbol);
    this._initializeSymbol(this._cache.stringMapType.symbol);
    this._initializeSymbol(this._cache.stringType.symbol);
  };

  Skew.Resolving.Resolver.prototype._resolveGlobal = function() {
    this._resolveObject(this._global);
    this._scanLocalVariables();
    this._convertForeachLoops();
    this._discardUnusedDefines();
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
  Skew.Resolving.Resolver.prototype._removeObsoleteFunctions = function(symbol) {
    for (var i = 0, list = symbol.objects, count = list.length; i < count; i = i + 1 | 0) {
      var object = in_List.get(list, i);
      this._removeObsoleteFunctions(object);
    }

    in_List.removeIf(symbol.functions, function($function) {
      return $function.isObsolete();
    });
  };

  Skew.Resolving.Resolver.prototype._iterativelyMergeGuards = function() {
    var guards = null;

    // Iterate until a fixed point is reached
    while (true) {
      guards = [];
      this._scanForGuards(this._global, guards);

      if (guards.length == 0) {
        break;
      }

      // Each iteration must remove at least one guard to continue
      if (!this._processGuards(guards)) {
        break;
      }
    }

    this._isMergingGuards = false;

    // All remaining guards are errors
    for (var i = 0, list = guards, count1 = list.length; i < count1; i = i + 1 | 0) {
      var guard = in_List.get(list, i);
      var count = this._log.errorCount;
      this._resolveAsParameterizedExpressionWithConversion(guard.test, guard.parent.scope, this._cache.boolType);

      if (this._log.errorCount == count) {
        this._log.semanticErrorExpectedConstant(guard.test.range);
      }
    }
  };

  Skew.Resolving.Resolver.prototype._scanForGuards = function(symbol, guards) {
    if (symbol.guards != null) {
      in_List.append1(guards, symbol.guards);
    }

    for (var i = 0, list = symbol.objects, count = list.length; i < count; i = i + 1 | 0) {
      var object = in_List.get(list, i);
      this._scanForGuards(object, guards);
    }
  };

  Skew.Resolving.Resolver.prototype._reportGuardMergingFailure = function(node) {
    if (this._isMergingGuards) {
      throw new Skew.Resolving.Resolver.GuardMergingFailure();
    }
  };

  Skew.Resolving.Resolver.prototype._attemptToResolveGuardConstant = function(node, scope) {
    assert(scope != null);

    try {
      this._resolveAsParameterizedExpressionWithConversion(node, scope, this._cache.boolType);
      this._constantFolder.foldConstants(node);
      return true;
    }

    catch (failure) {
      if (!(failure instanceof Skew.Resolving.Resolver.GuardMergingFailure)) {
        throw failure;
      }
    }

    return false;
  };

  Skew.Resolving.Resolver.prototype._processGuards = function(guards) {
    var wasGuardRemoved = false;

    for (var i = 0, list = guards, count = list.length; i < count; i = i + 1 | 0) {
      var guard = in_List.get(list, i);
      var test = guard.test;
      var parent = guard.parent;

      // If it's not a constant, we'll just try again in the next iteration
      if (!this._attemptToResolveGuardConstant(test, parent.scope)) {
        continue;
      }

      if (test.isBool()) {
        in_List.removeOne(parent.guards, guard);
        wasGuardRemoved = true;

        if (test.isTrue()) {
          this._mergeGuardIntoObject(guard, parent);
        }

        else {
          var elseGuard = guard.elseGuard;

          if (elseGuard != null) {
            if (elseGuard.test != null) {
              elseGuard.parent = parent;
              parent.guards.push(elseGuard);
            }

            else {
              this._mergeGuardIntoObject(elseGuard, parent);
            }
          }
        }
      }
    }

    return wasGuardRemoved;
  };

  Skew.Resolving.Resolver.prototype._mergeGuardIntoObject = function(guard, object) {
    var symbol = guard.contents;
    Skew.Merging.mergeObjects(this._log, object, symbol.objects);
    Skew.Merging.mergeFunctions(this._log, object, symbol.functions, Skew.Merging.MergeBehavior.NORMAL);
    Skew.Merging.mergeVariables(this._log, object, symbol.variables);
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
      for (var i = 0, list = symbol.guards, count = list.length; i < count; i = i + 1 | 0) {
        var nested = in_List.get(list, i);
        object.guards.push(nested);

        for (var g = nested; g != null; g = g.elseGuard) {
          g.parent = object;
          g.contents.parent = object;
        }
      }
    }
  };

  // Foreach loops are converted to for loops after everything is resolved
  // because that process needs to generate symbol names and it's much easier
  // to generate non-conflicting symbol names after all local variables have
  // been defined.
  Skew.Resolving.Resolver.prototype._convertForeachLoops = function() {
    for (var i = 0, list1 = this._foreachLoops, count2 = list1.length; i < count2; i = i + 1 | 0) {
      var node = in_List.get(list1, i);
      var symbol = node.symbol.asVariableSymbol();

      // Generate names at the function level to avoid conflicts with local scopes
      var scope = symbol.scope.findEnclosingFunctionOrLambda();
      var value = node.foreachValue();
      var block = node.foreachBlock();

      // Handle "for i in 0..10"
      if (value.kind == Skew.NodeKind.PAIR) {
        var first = value.firstValue();
        var second = value.secondValue();
        symbol.flags &= ~Skew.SymbolFlags.IS_CONST;
        symbol.value = first.remove();
        var setup = new Skew.Node(Skew.NodeKind.VARIABLES).appendChild(Skew.Node.createVariable(symbol));
        var symbolName = Skew.Node.createSymbolReference(symbol);
        var update = Skew.Node.createUnary(Skew.NodeKind.PREFIX_INCREMENT, symbolName);
        var test = null;

        // Special-case constant iteration limits to generate simpler code
        if (second.kind == Skew.NodeKind.CONSTANT || second.kind == Skew.NodeKind.NAME && second.symbol != null && second.symbol.isConst()) {
          test = Skew.Node.createBinary(Skew.NodeKind.LESS_THAN, symbolName.clone(), second.remove());
        }

        // Otherwise, save the iteration limit in case it changes during iteration
        else {
          var count = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_LOCAL, scope.generateName('count'));
          count.initializeWithType(this._cache.intType);
          count.value = second.remove();
          setup.appendChild(Skew.Node.createVariable(count));
          test = Skew.Node.createBinary(Skew.NodeKind.LESS_THAN, symbolName.clone(), Skew.Node.createSymbolReference(count));
        }

        // Use a C-style for loop to implement this foreach loop
        node.become(Skew.Node.createFor(setup, test, update, block.remove()).withComments(node.comments).withRange(node.range));

        // Make sure the new expressions are resolved
        this._resolveNode(test, symbol.scope, null);
        this._resolveNode(update, symbol.scope, null);
      }

      else if (this._cache.isList(value.resolvedType) && !this._options.target.supportsListForeach()) {
        // Create the index variable
        var index = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_LOCAL, scope.generateName('i'));
        index.initializeWithType(this._cache.intType);
        index.value = this._cache.createInt(0);
        var setup1 = new Skew.Node(Skew.NodeKind.VARIABLES).appendChild(Skew.Node.createVariable(index));
        var indexName = Skew.Node.createSymbolReference(index);

        // Create the list variable
        var list = null;

        if (value.kind == Skew.NodeKind.NAME && value.symbol != null && Skew.in_SymbolKind.isVariable(value.symbol.kind) && value.symbol.isConst()) {
          list = value.symbol.asVariableSymbol();
        }

        else {
          list = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_LOCAL, scope.generateName('list'));
          list.initializeWithType(value.resolvedType);
          list.value = value.remove();
          setup1.appendChild(Skew.Node.createVariable(list));
        }

        var listName = Skew.Node.createSymbolReference(list);

        // Create the count variable
        var count1 = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_LOCAL, scope.generateName('count'));
        count1.initializeWithType(this._cache.intType);
        count1.value = new Skew.Node(Skew.NodeKind.DOT).withContent(new Skew.StringContent('count')).appendChild(listName);
        setup1.appendChild(Skew.Node.createVariable(count1));
        var countName = Skew.Node.createSymbolReference(count1);

        // Move the loop variable into the loop body
        symbol.value = Skew.Node.createIndex(listName.clone(), indexName);
        block.prependChild(new Skew.Node(Skew.NodeKind.VARIABLES).appendChild(Skew.Node.createVariable(symbol)));

        // Use a C-style for loop to implement this foreach loop
        var test1 = Skew.Node.createBinary(Skew.NodeKind.LESS_THAN, indexName.clone(), countName);
        var update1 = Skew.Node.createUnary(Skew.NodeKind.PREFIX_INCREMENT, indexName.clone());
        node.become(Skew.Node.createFor(setup1, test1, update1, block.remove()).withComments(node.comments).withRange(node.range));

        // Make sure the new expressions are resolved
        this._resolveNode(symbol.value, symbol.scope, null);
        this._resolveNode(count1.value, symbol.scope, null);
        this._resolveNode(test1, symbol.scope, null);
        this._resolveNode(update1, symbol.scope, null);
      }
    }
  };

  Skew.Resolving.Resolver.prototype._scanLocalVariables = function() {
    var values = in_IntMap.values(this._localVariableStatistics);

    // Sort so the order is deterministic
    values.sort(Skew.Resolving.LocalVariableStatistics.SORT_BY_ID);

    for (var i = 0, list = values, count = list.length; i < count; i = i + 1 | 0) {
      var info = in_List.get(list, i);
      var symbol = info.symbol;

      // Variables that are never re-assigned can safely be considered constants for constant folding
      if (info.writeCount == 0 && this._options.foldAllConstants) {
        symbol.flags |= Skew.SymbolFlags.IS_CONST;
      }

      // Unused local variables can safely be removed, but don't warn about "for i in 0..10 {}"
      if (info.readCount == 0 && !symbol.isLoopVariable() && symbol.kind == Skew.SymbolKind.VARIABLE_LOCAL) {
        this._log.semanticWarningUnreadLocalVariable(symbol.range, symbol.name);
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

  Skew.Resolving.Resolver.prototype._discardUnusedDefines = function() {
    var keys = Object.keys(this._defines);

    // Sort so the order is deterministic
    keys.sort(function(a, b) {
      return in_string.compare(a, b);
    });

    for (var i = 0, list = keys, count = list.length; i < count; i = i + 1 | 0) {
      var key = in_List.get(list, i);
      this._log.semanticErrorInvalidDefine2(in_StringMap.get1(this._defines, key).name, key);
    }
  };

  Skew.Resolving.Resolver.prototype._resolveObject = function(symbol) {
    this._initializeSymbol(symbol);

    for (var i = 0, list = symbol.objects, count = list.length; i < count; i = i + 1 | 0) {
      var object = in_List.get(list, i);
      this._resolveObject(object);
    }

    for (var i1 = 0, list1 = symbol.functions, count1 = list1.length; i1 < count1; i1 = i1 + 1 | 0) {
      var $function = in_List.get(list1, i1);
      this._resolveFunction($function);
    }

    for (var i2 = 0, list2 = symbol.variables, count2 = list2.length; i2 < count2; i2 = i2 + 1 | 0) {
      var variable = in_List.get(list2, i2);
      this._resolveVariable1(variable);
    }

    this._checkInterfacesAndAbstractStatus2(symbol);
  };

  Skew.Resolving.Resolver.prototype._initializeFunction = function(symbol) {
    if (symbol.resolvedType == null) {
      symbol.resolvedType = new Skew.Type(Skew.TypeKind.SYMBOL, symbol);
    }

    // Referencing a normal variable instead of a special node kind for "this"
    // makes many things much easier including lambda capture and devirtualization
    if (symbol.kind == Skew.SymbolKind.FUNCTION_INSTANCE || symbol.kind == Skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
      var $this = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_ARGUMENT, 'self');
      $this.initializeWithType(this._cache.parameterize(symbol.parent.resolvedType));
      $this.flags |= Skew.SymbolFlags.IS_CONST;
      symbol.$this = $this;
    }

    // Lazily-initialize automatically generated functions
    if (symbol.isAutomaticallyGenerated()) {
      if (symbol.kind == Skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
        assert(symbol.name == 'new');
        this._automaticallyGenerateClassConstructor(symbol);
      }

      else if (symbol.kind == Skew.SymbolKind.FUNCTION_INSTANCE) {
        assert(symbol.name == 'toString');
        this._automaticallyGenerateEnumToString(symbol);
      }
    }

    this._resolveParameters(symbol.parameters);

    // Resolve the argument variables
    symbol.resolvedType.argumentTypes = [];

    for (var i = 0, list = symbol.$arguments, count1 = list.length; i < count1; i = i + 1 | 0) {
      var argument = in_List.get(list, i);
      argument.scope = symbol.scope;
      this._resolveVariable1(argument);
      symbol.resolvedType.argumentTypes.push(argument.resolvedType);
    }

    symbol.argumentOnlyType = this._cache.createLambdaType(symbol.resolvedType.argumentTypes, null);

    // Resolve the return type if present (no return type means "void")
    var returnType = null;

    if (symbol.returnType != null) {
      if (symbol.kind == Skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
        this._log.semanticErrorConstructorReturnType(symbol.returnType.range);
      }

      else {
        this._resolveAsParameterizedType(symbol.returnType, symbol.scope);
        returnType = symbol.returnType.resolvedType;
      }
    }

    // Constructors always return the type they construct
    if (symbol.kind == Skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
      returnType = this._cache.parameterize(symbol.parent.resolvedType);
      symbol.returnType = new Skew.Node(Skew.NodeKind.TYPE).withType(returnType);
    }

    // The "<=>" operator must return a numeric value for comparison with zero
    var count = symbol.$arguments.length;

    if (symbol.name == '<=>') {
      if (returnType == null || returnType != this._cache.intType) {
        this._log.semanticErrorComparisonOperatorNotInt(symbol.returnType != null ? symbol.returnType.range : symbol.range);
        returnType = Skew.Type.DYNAMIC;
      }

      else if (count != 1) {
        this._log.semanticErrorWrongArgumentCount(symbol.range, symbol.name, 1);
      }
    }

    // Setters must have one argument
    else if (symbol.isSetter() && count != 1) {
      this._log.semanticErrorWrongArgumentCount(symbol.range, symbol.name, 1);
      symbol.flags &= ~Skew.SymbolFlags.IS_SETTER;
    }

    // Validate argument count
    else {
      var argumentCount = Skew.argumentCountForOperator(symbol.name);

      if (argumentCount != null && !(argumentCount.indexOf(count) != -1)) {
        this._log.semanticErrorWrongArgumentCountRange(symbol.range, symbol.name, argumentCount);
      }

      // Enforce that the initializer constructor operators take lists of
      // values to avoid confusing error messages inside the code generated
      // for initializer expressions
      else if (symbol.name == '{new}' || symbol.name == '[new]') {
        for (var i1 = 0, list1 = symbol.$arguments, count2 = list1.length; i1 < count2; i1 = i1 + 1 | 0) {
          var argument1 = in_List.get(list1, i1);

          if (argument1.resolvedType != Skew.Type.DYNAMIC && !this._cache.isList(argument1.resolvedType)) {
            this._log.semanticErrorExpectedList(argument1.range, argument1.name, argument1.resolvedType);
          }
        }
      }
    }

    symbol.resolvedType.returnType = returnType;
    this._resolveAnnotations(symbol);

    // Validate the entry point after this symbol has a type
    if (symbol.isEntryPoint()) {
      this._validateEntryPoint(symbol);
    }
  };

  Skew.Resolving.Resolver.prototype._automaticallyGenerateClassConstructor = function(symbol) {
    // Create the function body
    var block = new Skew.Node(Skew.NodeKind.BLOCK);
    symbol.block = block;

    // Mirror the base constructor's arguments
    if (symbol.overridden != null) {
      this._initializeSymbol(symbol.overridden);
      var $arguments = symbol.overridden.$arguments;
      var base = new Skew.Node(Skew.NodeKind.SUPER).withRange(symbol.overridden.range);

      if ($arguments.length == 0) {
        block.appendChild(Skew.Node.createExpression(base));
      }

      else {
        var call = Skew.Node.createCall(base);

        for (var i = 0, list = $arguments, count = list.length; i < count; i = i + 1 | 0) {
          var variable = in_List.get(list, i);
          var argument = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_ARGUMENT, variable.name);
          argument.initializeWithType(variable.resolvedType);
          symbol.$arguments.push(argument);
          call.appendChild(Skew.Node.createSymbolReference(argument));
        }

        block.prependChild(Skew.Node.createExpression(call));
      }
    }

    // Add an argument for every uninitialized variable
    var parent = symbol.parent.asObjectSymbol();
    this._initializeSymbol(parent);

    for (var i1 = 0, list1 = parent.variables, count1 = list1.length; i1 < count1; i1 = i1 + 1 | 0) {
      var variable1 = in_List.get(list1, i1);

      if (variable1.kind == Skew.SymbolKind.VARIABLE_INSTANCE) {
        this._initializeSymbol(variable1);

        if (variable1.value == null) {
          var argument1 = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_ARGUMENT, variable1.name);
          argument1.initializeWithType(variable1.resolvedType);
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
      symbol.flags |= Skew.SymbolFlags.IS_GETTER;
    }
  };

  Skew.Resolving.Resolver.prototype._automaticallyGenerateEnumToString = function(symbol) {
    var parent = symbol.parent.asObjectSymbol();
    var names = new Skew.Node(Skew.NodeKind.INITIALIZER_LIST);
    this._initializeSymbol(parent);

    for (var i = 0, list = parent.variables, count = list.length; i < count; i = i + 1 | 0) {
      var variable = in_List.get(list, i);

      if (variable.kind == Skew.SymbolKind.VARIABLE_ENUM_OR_FLAGS) {
        assert(variable.value.asInt() == names.childCount());
        names.appendChild(new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.StringContent(variable.name)));
      }
    }

    var strings = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_GLOBAL, parent.scope.generateName('_strings'));
    strings.initializeWithType(this._cache.createListType(this._cache.stringType));
    strings.value = names;
    strings.flags |= Skew.SymbolFlags.IS_PROTECTED | Skew.SymbolFlags.IS_CONST;
    strings.parent = parent;
    strings.scope = parent.scope;
    parent.variables.push(strings);
    this._resolveAsParameterizedExpressionWithConversion(strings.value, strings.scope, strings.resolvedType);
    symbol.returnType = new Skew.Node(Skew.NodeKind.TYPE).withType(this._cache.stringType);
    symbol.block = new Skew.Node(Skew.NodeKind.BLOCK).appendChild(Skew.Node.createReturn(Skew.Node.createIndex(Skew.Node.createSymbolReference(strings), new Skew.Node(Skew.NodeKind.NAME).withContent(new Skew.StringContent('self')))));
    symbol.flags |= Skew.SymbolFlags.IS_GETTER;
  };

  Skew.Resolving.Resolver.prototype._resolveFunction = function(symbol) {
    this._initializeSymbol(symbol);

    // Validate use of "def" vs "over"
    if (!symbol.isObsolete()) {
      if (symbol.overridden != null && symbol.kind == Skew.SymbolKind.FUNCTION_INSTANCE) {
        if (!symbol.isOver()) {
          this._log.semanticErrorModifierMissingOverride(symbol.range, symbol.name, symbol.overridden.range);
        }
      }

      else if (symbol.isOver()) {
        this._log.semanticErrorModifierUnusedOverride(symbol.range, symbol.name);
      }
    }

    var scope = new Skew.LocalScope(symbol.scope, Skew.LocalType.NORMAL);

    if (symbol.$this != null) {
      scope.define(symbol.$this, this._log);
    }

    // Default values for argument variables aren't resolved with this local
    // scope since they are evaluated at the call site, not inside the
    // function body, and shouldn't have access to other arguments
    for (var i = 0, list = symbol.$arguments, count = list.length; i < count; i = i + 1 | 0) {
      var argument = in_List.get(list, i);
      scope.define(argument, this._log);
      this._localVariableStatistics[argument.id] = new Skew.Resolving.LocalVariableStatistics(argument);
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
        for (var i1 = 0, list1 = symbol.parent.asObjectSymbol().variables, count1 = list1.length; i1 < count1; i1 = i1 + 1 | 0) {
          var variable = in_List.get(list1, i1);

          if (variable.kind == Skew.SymbolKind.VARIABLE_INSTANCE) {
            this._resolveVariable1(variable);

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
              variable.value = this._createDefaultValueForType(variable.resolvedType, variable.range);
            }

            if (variable.value != null) {
              block.insertChildBefore(firstStatement, Skew.Node.createExpression(Skew.Node.createBinary(Skew.NodeKind.ASSIGN, Skew.Node.createMemberReference(Skew.Node.createSymbolReference(symbol.$this), variable), variable.value.clone())));
            }
          }
        }
      }

      this._resolveNode(block, scope, null);

      // Missing a return statement is an error
      if (symbol.kind != Skew.SymbolKind.FUNCTION_CONSTRUCTOR) {
        var returnType = symbol.resolvedType.returnType;

        if (returnType != null && !symbol.isDynamicLambda() && block.hasControlFlowAtEnd()) {
          this._log.semanticErrorMissingReturn(symbol.range, symbol.name, returnType);
        }
      }

      // Derived class constructors must start with a call to "super"
      else if (symbol.parent.asObjectSymbol().baseClass != null) {
        var first = block.firstChild();

        if (first == null || !first.isSuperCallStatement()) {
          this._log.semanticErrorMissingSuper(firstStatement == null ? symbol.range : firstStatement.range);
        }
      }
    }

    // Global functions can't be abstract
    else if (!symbol.isImported() && !symbol.isObsolete() && (symbol.kind == Skew.SymbolKind.FUNCTION_GLOBAL || symbol.kind == Skew.SymbolKind.FUNCTION_CONSTRUCTOR)) {
      this._log.semanticErrorUnimplementedFunction(symbol.range, symbol.name);
    }
  };

  Skew.Resolving.Resolver.prototype._recordStatistic = function(symbol, statistic) {
    if (symbol != null && (symbol.kind == Skew.SymbolKind.VARIABLE_LOCAL || symbol.kind == Skew.SymbolKind.VARIABLE_ARGUMENT)) {
      var info = in_IntMap.get(this._localVariableStatistics, symbol.id, null);

      if (info != null) {
        switch (statistic) {
          case Skew.Resolving.SymbolStatistic.READ: {
            info.readCount = info.readCount + 1 | 0;
            break;
          }

          case Skew.Resolving.SymbolStatistic.WRITE: {
            info.writeCount = info.writeCount + 1 | 0;
            break;
          }
        }
      }
    }
  };

  Skew.Resolving.Resolver.prototype._initializeVariable = function(symbol) {
    var value = symbol.value;

    // Normal variables may omit the initializer if the type is present
    if (symbol.type != null) {
      this._resolveAsParameterizedType(symbol.type, symbol.scope);
      symbol.resolvedType = symbol.type.resolvedType;
      symbol.state = Skew.SymbolState.INITIALIZED;

      // Resolve the constant now so initialized constants always have a value
      if (symbol.isConst() && value != null) {
        this._resolveAsParameterizedExpressionWithConversion(value, symbol.scope, symbol.resolvedType);
      }
    }

    // Enums take their type from their parent
    else if (symbol.kind == Skew.SymbolKind.VARIABLE_ENUM_OR_FLAGS) {
      symbol.resolvedType = symbol.parent.resolvedType;
    }

    // Implicitly-typed variables take their type from their initializer
    else if (value != null) {
      this._resolveAsParameterizedExpression(value, symbol.scope);
      var type = value.resolvedType;
      symbol.resolvedType = type;

      // Forbid certain types
      if (!Skew.Resolving.Resolver._isValidVariableType(type)) {
        this._log.semanticErrorBadImplicitVariableType(symbol.range, type);
        symbol.resolvedType = Skew.Type.DYNAMIC;
      }
    }

    // Use a different error for constants which must have a type and lambda arguments which cannot have an initializer
    else if (symbol.isConst() || symbol.scope.kind() == Skew.ScopeKind.FUNCTION && symbol.scope.asFunctionScope().symbol.kind == Skew.SymbolKind.FUNCTION_LOCAL) {
      this._log.semanticErrorVarMissingType(symbol.range, symbol.name);
      symbol.resolvedType = Skew.Type.DYNAMIC;
    }

    // Variables without a type are an error
    else {
      this._log.semanticErrorVarMissingValue(symbol.range, symbol.name);
      symbol.resolvedType = Skew.Type.DYNAMIC;
    }

    // Make sure the symbol has a type node
    if (symbol.type == null) {
      symbol.type = new Skew.Node(Skew.NodeKind.TYPE).withType(symbol.resolvedType);
    }

    this._resolveDefines(symbol);
    this._resolveAnnotations(symbol);

    // Run post-annotation checks
    if (symbol.resolvedType != Skew.Type.DYNAMIC && symbol.isConst() && !symbol.isImported() && value == null && symbol.kind != Skew.SymbolKind.VARIABLE_ENUM_OR_FLAGS && symbol.kind != Skew.SymbolKind.VARIABLE_INSTANCE) {
      this._log.semanticErrorConstMissingValue(symbol.range, symbol.name);
    }
  };

  Skew.Resolving.Resolver.prototype._resolveVariable1 = function(symbol) {
    this._initializeSymbol(symbol);

    if (symbol.value != null) {
      this._resolveAsParameterizedExpressionWithConversion(symbol.value, symbol.scope, symbol.resolvedType);
    }

    // Default-initialize variables
    else if (symbol.kind != Skew.SymbolKind.VARIABLE_ARGUMENT && symbol.kind != Skew.SymbolKind.VARIABLE_INSTANCE && symbol.kind != Skew.SymbolKind.VARIABLE_ENUM_OR_FLAGS) {
      symbol.value = this._createDefaultValueForType(symbol.resolvedType, symbol.range);
    }
  };

  Skew.Resolving.Resolver.prototype._createDefaultValueForType = function(type, range) {
    var unwrapped = this._cache.unwrappedType(type);

    if (unwrapped == this._cache.intType) {
      return new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.IntContent(0)).withType(type);
    }

    if (unwrapped == this._cache.doubleType) {
      return new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.DoubleContent(0)).withType(type);
    }

    if (unwrapped == this._cache.boolType) {
      return new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.BoolContent(false)).withType(type);
    }

    if (unwrapped.isEnumOrFlags()) {
      return Skew.Node.createCast(this._cache.createInt(0), new Skew.Node(Skew.NodeKind.TYPE).withType(type)).withType(type);
    }

    if (unwrapped.isParameter()) {
      this._log.semanticErrorNoDefaultValue(range, type);
      return null;
    }

    assert(unwrapped.isReference());
    return new Skew.Node(Skew.NodeKind.NULL).withType(type);
  };

  Skew.Resolving.Resolver.prototype._initializeOverloadedFunction = function(symbol) {
    var symbols = symbol.symbols;

    if (symbol.resolvedType == null) {
      symbol.resolvedType = new Skew.Type(Skew.TypeKind.SYMBOL, symbol);
    }

    // Ensure no two overloads have the same argument types
    var i = 0;

    while (i < symbols.length) {
      var $function = in_List.get(symbols, i);
      this._initializeSymbol($function);
      symbol.flags |= $function.flags & Skew.SymbolFlags.IS_SETTER;
      var equivalence = Skew.TypeCache.Equivalence.NOT_EQUIVALENT;
      var index = -1;

      for (var j = 0, count = i; j < count; j = j + 1 | 0) {
        equivalence = this._cache.areFunctionSymbolsEquivalent($function, null, in_List.get(symbols, j), null);

        if (equivalence != Skew.TypeCache.Equivalence.NOT_EQUIVALENT) {
          index = j;
          break;
        }
      }

      if (index == -1) {
        i = i + 1 | 0;
        continue;
      }

      var other = in_List.get(symbols, index);
      var parent = symbol.parent.asObjectSymbol();
      var isFromSameObject = $function.parent == other.parent;
      var areReturnTypesDifferent = equivalence == Skew.TypeCache.Equivalence.EQUIVALENT_EXCEPT_RETURN_TYPE && (isFromSameObject || symbol.kind == Skew.SymbolKind.OVERLOADED_INSTANCE);

      // Symbols should be in the base type chain
      assert(parent.isSameOrHasBaseClass($function.parent));
      assert(parent.isSameOrHasBaseClass(other.parent));

      // Forbid overloading by return type
      if (!isFromSameObject && areReturnTypesDifferent) {
        var derived = $function.parent == parent ? $function : other;
        var base = derived == $function ? other : $function;
        this._log.semanticErrorBadOverrideReturnType(derived.range, derived.name, parent.baseType, base.range);

        if (isFromSameObject) {
          $function.flags |= Skew.SymbolFlags.IS_OBSOLETE;
        }
      }

      // Allow duplicate function declarations with the same type to merge
      // as long as there are not two declarations that provide implementations.
      // Mark the obsolete function as obsolete instead of removing it so it
      // doesn't potentially mess up iteration in a parent call stack.
      else if (areReturnTypesDifferent || isFromSameObject && $function.block != null && other.block != null) {
        this._log.semanticErrorDuplicateOverload($function.range, symbol.name, other.range);

        if (isFromSameObject) {
          $function.flags |= Skew.SymbolFlags.IS_OBSOLETE;
        }
      }

      // Keep "function"
      else if (isFromSameObject ? $function.block != null : $function.parent.asObjectSymbol().hasBaseClass(other.parent)) {
        if ($function.parent == parent && other.parent == parent) {
          $function.mergeInformationFrom(other);
          $function.flags |= $function.block != null ? other.flags & ~Skew.SymbolFlags.IS_IMPORTED : other.flags;
          other.flags |= Skew.SymbolFlags.IS_OBSOLETE;
        }

        else if (!isFromSameObject) {
          $function.overridden = other;
        }

        in_List.set(symbols, index, $function);
      }

      // Keep "other"
      else if ($function.parent == parent && other.parent == parent) {
        other.flags |= other.block != null ? $function.flags & ~Skew.SymbolFlags.IS_IMPORTED : $function.flags;
        other.mergeInformationFrom($function);
        $function.flags |= Skew.SymbolFlags.IS_OBSOLETE;
      }

      else if (!isFromSameObject) {
        other.overridden = $function;
      }

      // Remove the symbol after the merge
      in_List.removeAt(symbols, i);
    }
  };

  // Put the guts of the function inside another function because V8 doesn't
  // optimize functions with try-catch statements
  Skew.Resolving.Resolver.prototype._resolveNodeSwitch = function(node, scope, context) {
    switch (node.kind) {
      case Skew.NodeKind.BLOCK: {
        this._resolveBlock(node, scope);
        break;
      }

      case Skew.NodeKind.PAIR: {
        this._resolvePair(node, scope, context);
        break;
      }

      case Skew.NodeKind.BREAK:
      case Skew.NodeKind.CONTINUE: {
        this._resolveJump(node, scope);
        break;
      }

      case Skew.NodeKind.EXPRESSION: {
        this._resolveExpression(node, scope);
        break;
      }

      case Skew.NodeKind.FOR: {
        this._resolveFor(node, scope);
        break;
      }

      case Skew.NodeKind.FOREACH: {
        this._resolveForeach(node, scope);
        break;
      }

      case Skew.NodeKind.IF: {
        this._resolveIf(node, scope);
        break;
      }

      case Skew.NodeKind.RETURN: {
        this._resolveReturn(node, scope);
        break;
      }

      case Skew.NodeKind.SWITCH: {
        this._resolveSwitch(node, scope);
        break;
      }

      case Skew.NodeKind.THROW: {
        this._resolveThrow(node, scope);
        break;
      }

      case Skew.NodeKind.TRY: {
        this._resolveTry(node, scope);
        break;
      }

      case Skew.NodeKind.VARIABLE: {
        this._resolveVariable2(node, scope);
        break;
      }

      case Skew.NodeKind.VARIABLES: {
        this._resolveVariables(node, scope);
        break;
      }

      case Skew.NodeKind.WHILE: {
        this._resolveWhile(node, scope);
        break;
      }

      case Skew.NodeKind.ASSIGN_INDEX: {
        this._resolveOperatorOverload(node, scope, context);
        break;
      }

      case Skew.NodeKind.CALL: {
        this._resolveCall(node, scope, context);
        break;
      }

      case Skew.NodeKind.CAST: {
        this._resolveCast(node, scope, context);
        break;
      }

      case Skew.NodeKind.COMPLEMENT:
      case Skew.NodeKind.NEGATIVE:
      case Skew.NodeKind.NOT:
      case Skew.NodeKind.POSITIVE:
      case Skew.NodeKind.POSTFIX_DECREMENT:
      case Skew.NodeKind.POSTFIX_INCREMENT:
      case Skew.NodeKind.PREFIX_DECREMENT:
      case Skew.NodeKind.PREFIX_INCREMENT: {
        this._resolveOperatorOverload(node, scope, context);
        break;
      }

      case Skew.NodeKind.CONSTANT: {
        this._resolveConstant(node, scope, context);
        break;
      }

      case Skew.NodeKind.DOT: {
        this._resolveDot(node, scope, context);
        break;
      }

      case Skew.NodeKind.HOOK: {
        this._resolveHook(node, scope, context);
        break;
      }

      case Skew.NodeKind.INDEX: {
        this._resolveOperatorOverload(node, scope, context);
        break;
      }

      case Skew.NodeKind.INITIALIZER_LIST:
      case Skew.NodeKind.INITIALIZER_MAP: {
        this._resolveInitializer(node, scope, context);
        break;
      }

      case Skew.NodeKind.LAMBDA: {
        this._resolveLambda(node, scope, context);
        break;
      }

      case Skew.NodeKind.LAMBDA_TYPE: {
        this._resolveLambdaType(node, scope);
        break;
      }

      case Skew.NodeKind.NAME: {
        this._resolveName(node, scope);
        break;
      }

      case Skew.NodeKind.NULL: {
        node.resolvedType = Skew.Type.NULL;
        break;
      }

      case Skew.NodeKind.NULL_DOT: {
        this._resolveNullDot(node, scope);
        break;
      }

      case Skew.NodeKind.PARAMETERIZE: {
        this._resolveParameterize(node, scope);
        break;
      }

      case Skew.NodeKind.PARSE_ERROR: {
        node.resolvedType = Skew.Type.DYNAMIC;
        break;
      }

      case Skew.NodeKind.SEQUENCE: {
        this._resolveSequence(node, scope, context);
        break;
      }

      case Skew.NodeKind.STRING_INTERPOLATION: {
        this._resolveStringInterpolation(node, scope);
        break;
      }

      case Skew.NodeKind.SUPER: {
        this._resolveSuper(node, scope);
        break;
      }

      case Skew.NodeKind.TYPE: {
        break;
      }

      case Skew.NodeKind.TYPE_CHECK: {
        this._resolveTypeCheck(node, scope);
        break;
      }

      case Skew.NodeKind.XML: {
        this._resolveXML(node, scope);
        break;
      }

      default: {
        if (Skew.in_NodeKind.isBinary(node.kind)) {
          this._resolveBinary(node, scope, context);
        }

        else {
          assert(false);
        }
        break;
      }
    }
  };

  Skew.Resolving.Resolver.prototype._resolveNode = function(node, scope, context) {
    if (node.resolvedType != null) {
      // Only resolve once
      return;
    }

    node.resolvedType = Skew.Type.DYNAMIC;

    try {
      this._resolveNodeSwitch(node, scope, context);
    }

    catch (failure) {
      if (failure instanceof Skew.Resolving.Resolver.GuardMergingFailure) {
        node.resolvedType = null;

        throw failure;
      }

      else {
        throw failure;
      }
    }

    assert(node.resolvedType != null);
  };

  Skew.Resolving.Resolver.prototype._resolveAsParameterizedType = function(node, scope) {
    assert(Skew.in_NodeKind.isExpression(node.kind));
    node.flags |= Skew.NodeFlags.SHOULD_EXPECT_TYPE;
    this._resolveNode(node, scope, null);
    this._checkIsType(node);
    this._checkIsParameterized(node);
  };

  Skew.Resolving.Resolver.prototype._resolveAsParameterizedExpression = function(node, scope) {
    assert(Skew.in_NodeKind.isExpression(node.kind));
    this._resolveNode(node, scope, null);
    this._checkIsInstance(node);
    this._checkIsParameterized(node);
  };

  Skew.Resolving.Resolver.prototype._resolveAsParameterizedExpressionWithTypeContext = function(node, scope, type) {
    assert(Skew.in_NodeKind.isExpression(node.kind));
    this._resolveNode(node, scope, type);
    this._checkIsInstance(node);
    this._checkIsParameterized(node);
  };

  Skew.Resolving.Resolver.prototype._resolveAsParameterizedExpressionWithConversion = function(node, scope, type) {
    this._resolveAsParameterizedExpressionWithTypeContext(node, scope, type);
    this._checkConversion(node, type, Skew.Resolving.ConversionKind.IMPLICIT);
  };

  Skew.Resolving.Resolver.prototype._resolveChildrenAsParameterizedExpressions = function(node, scope) {
    for (var child = node.firstChild(); child != null; child = child.nextSibling()) {
      this._resolveAsParameterizedExpression(child, scope);
    }
  };

  Skew.Resolving.Resolver.prototype._resolveChildrenAsParameterizedExpressionsWithDynamicTypeContext = function(node, scope) {
    for (var child = node.firstChild(); child != null; child = child.nextSibling()) {
      this._resolveAsParameterizedExpressionWithTypeContext(child, scope, Skew.Type.DYNAMIC);
    }
  };

  Skew.Resolving.Resolver.prototype._checkUnusedExpression = function(node) {
    var kind = node.kind;

    if (kind == Skew.NodeKind.HOOK) {
      this._checkUnusedExpression(node.hookTrue());
      this._checkUnusedExpression(node.hookFalse());
    }

    else if (node.range != null && node.resolvedType != Skew.Type.DYNAMIC && kind != Skew.NodeKind.CALL && !Skew.in_NodeKind.isAssign(kind)) {
      this._log.semanticWarningUnusedExpression(node.range);
    }
  };

  Skew.Resolving.Resolver.prototype._checkIsInstance = function(node) {
    if (node.resolvedType != Skew.Type.DYNAMIC && node.isType()) {
      this._log.semanticErrorUnexpectedType(node.range, node.resolvedType);
      node.resolvedType = Skew.Type.DYNAMIC;
    }
  };

  Skew.Resolving.Resolver.prototype._checkIsType = function(node) {
    if (node.resolvedType != Skew.Type.DYNAMIC && !node.isType()) {
      this._log.semanticErrorUnexpectedExpression(node.range, node.resolvedType);
      node.resolvedType = Skew.Type.DYNAMIC;
    }
  };

  Skew.Resolving.Resolver.prototype._checkIsParameterized = function(node) {
    if (node.resolvedType.parameters() != null && !node.resolvedType.isParameterized()) {
      this._log.semanticErrorUnparameterizedType(node.range, node.resolvedType);
      node.resolvedType = Skew.Type.DYNAMIC;
    }
  };

  Skew.Resolving.Resolver.prototype._checkStorage = function(node, scope) {
    var symbol = node.symbol;

    // Only allow storage to variables
    if (node.kind != Skew.NodeKind.NAME && node.kind != Skew.NodeKind.DOT && (node.kind != Skew.NodeKind.INDEX || node.resolvedType != Skew.Type.DYNAMIC) || symbol != null && !Skew.in_SymbolKind.isVariable(symbol.kind)) {
      this._log.semanticErrorBadStorage(node.range);
    }

    // Forbid storage to constants
    else if (symbol != null && symbol.isConst()) {
      var $function = scope.findEnclosingFunction();

      // Allow assignments to constants inside constructors
      if ($function == null || $function.symbol.kind != Skew.SymbolKind.FUNCTION_CONSTRUCTOR || $function.symbol.parent != symbol.parent || symbol.kind != Skew.SymbolKind.VARIABLE_INSTANCE) {
        this._log.semanticErrorStorageToConstSymbol(node.internalRangeOrRange(), symbol.name);
      }
    }
  };

  Skew.Resolving.Resolver.prototype._checkAccess = function(node, range, scope) {
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

      this._log.semanticErrorAccessViolation(range, symbol.name);
    }

    // Deprecation annotations optionally provide a warning message
    if (symbol.isDeprecated()) {
      for (var i = 0, list = symbol.annotations, count = list.length; i < count; i = i + 1 | 0) {
        var annotation = in_List.get(list, i);

        if (annotation.symbol != null && annotation.symbol.fullName() == '@deprecated') {
          var value = annotation.annotationValue();

          if (value.kind == Skew.NodeKind.CALL && value.hasTwoChildren()) {
            var last = value.lastChild();

            if (last.kind == Skew.NodeKind.CONSTANT && last.content.kind() == Skew.ContentKind.STRING) {
              this._log.warning(range, Skew.in_Content.asString(last.content));
              return;
            }
          }
        }
      }

      this._log.semanticWarningDeprecatedUsage(range, symbol.name);
    }
  };

  Skew.Resolving.Resolver.prototype._checkConversion = function(node, to, kind) {
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
    if (kind == Skew.Resolving.ConversionKind.IMPLICIT && !this._cache.canImplicitlyConvert(from, to) || kind == Skew.Resolving.ConversionKind.EXPLICIT && !this._cache.canExplicitlyConvert(from, to)) {
      this._log.semanticErrorIncompatibleTypes(node.range, from, to, this._cache.canExplicitlyConvert(from, to));
      node.resolvedType = Skew.Type.DYNAMIC;
      return;
    }

    // Make the implicit conversion explicit for convenience later on
    if (kind == Skew.Resolving.ConversionKind.IMPLICIT) {
      node.become(Skew.Node.createCast(node.cloneAndStealChildren(), new Skew.Node(Skew.NodeKind.TYPE).withType(to)).withType(to).withRange(node.range));
    }
  };

  Skew.Resolving.Resolver.prototype._resolveAnnotation = function(node, symbol) {
    var value = node.annotationValue();
    var test = node.annotationTest();
    this._resolveNode(value, symbol.scope, null);

    if (test != null) {
      this._resolveAsParameterizedExpressionWithConversion(test, symbol.scope, this._cache.boolType);
    }

    // Terminate early when there were errors
    if (value.symbol == null) {
      return false;
    }

    // Make sure annotations have the arguments they need
    if (value.kind != Skew.NodeKind.CALL) {
      this._log.semanticErrorArgumentCount(value.range, value.symbol.resolvedType.argumentTypes.length, 0, value.symbol.name, value.symbol.range);
      return false;
    }

    // Ensure all arguments are constants
    var isValid = true;

    for (var child = value.callValue().nextSibling(); child != null; child = child.nextSibling()) {
      isValid = isValid && this._recursivelyResolveAsConstant(child);
    }

    if (!isValid) {
      return false;
    }

    // Only store symbols for annotations with the correct arguments for ease of use
    node.symbol = value.symbol;

    // Apply built-in annotation logic
    var flag = in_StringMap.get(Skew.Resolving.Resolver._annotationSymbolFlags, value.symbol.fullName(), 0);

    if (flag != 0) {
      switch (flag) {
        case Skew.SymbolFlags.IS_DEPRECATED: {
          break;
        }

        case Skew.SymbolFlags.IS_ENTRY_POINT: {
          isValid = symbol.kind == Skew.SymbolKind.FUNCTION_GLOBAL;
          break;
        }

        case Skew.SymbolFlags.IS_EXPORTED: {
          isValid = !symbol.isImported();
          break;
        }

        case Skew.SymbolFlags.IS_IMPORTED: {
          isValid = !symbol.isExported() && (!Skew.in_SymbolKind.isFunction(symbol.kind) || symbol.asFunctionSymbol().block == null);
          break;
        }

        case Skew.SymbolFlags.IS_INLINING_FORCED:
        case Skew.SymbolFlags.IS_INLINING_PREVENTED:
        case Skew.SymbolFlags.IS_PREFERRED: {
          isValid = Skew.in_SymbolKind.isFunction(symbol.kind);
          break;
        }

        case Skew.SymbolFlags.IS_RENAMED: {
          break;
        }

        case Skew.SymbolFlags.IS_SKIPPED: {
          isValid = Skew.in_SymbolKind.isFunction(symbol.kind) && symbol.resolvedType.returnType == null;
          break;
        }

        case Skew.SymbolFlags.SHOULD_SPREAD: {
          isValid = symbol.kind == Skew.SymbolKind.FUNCTION_ANNOTATION;
          break;
        }
      }

      if (flag == Skew.SymbolFlags.IS_INLINING_FORCED) {
        this._options.isAlwaysInlinePresent = true;
      }

      if (!isValid) {
        this._log.semanticErrorInvalidAnnotation(value.range, value.symbol.name, symbol.name);
        return false;
      }

      // Don't add an annotation when the test expression is false
      if (test != null && this._recursivelyResolveAsConstant(test) && test.isFalse()) {
        return false;
      }

      // Only warn about duplicate annotations after checking the test expression
      if ((symbol.flags & flag) != 0) {
        if ((symbol.parent.flags & flag & (Skew.SymbolFlags.IS_IMPORTED | Skew.SymbolFlags.IS_EXPORTED)) != 0) {
          this._log.semanticWarningRedundantAnnotation(value.range, value.symbol.name, symbol.name, symbol.parent.name);
        }

        else {
          this._log.semanticWarningDuplicateAnnotation(value.range, value.symbol.name, symbol.name);
        }
      }

      symbol.flags |= flag;

      // Store the new name for later
      if (flag == Skew.SymbolFlags.IS_RENAMED && value.hasTwoChildren()) {
        symbol.rename = value.lastChild().asString();
      }
    }

    return true;
  };

  Skew.Resolving.Resolver.prototype._recursivelyResolveAsConstant = function(node) {
    this._constantFolder.foldConstants(node);

    if (node.kind != Skew.NodeKind.CONSTANT) {
      this._log.semanticErrorExpectedConstant(node.range);
      return false;
    }

    return true;
  };

  Skew.Resolving.Resolver.prototype._resolveBlock = function(node, scope) {
    assert(node.kind == Skew.NodeKind.BLOCK);
    this._controlFlow.pushBlock(node);

    for (var child = node.firstChild(), next = null; child != null; child = next) {
      next = child.nextSibling();
      this._resolveNode(child, scope, null);

      // Stop now if the child was removed
      if (child.parent() == null) {
        continue;
      }

      this._controlFlow.visitStatementInPostOrder(child);

      // The "@skip" annotation removes function calls after type checking
      if (child.kind == Skew.NodeKind.EXPRESSION) {
        var value = child.expressionValue();

        if (value.kind == Skew.NodeKind.CALL && value.symbol != null && value.symbol.isSkipped()) {
          child.remove();
        }
      }
    }

    this._controlFlow.popBlock(node);
  };

  Skew.Resolving.Resolver.prototype._resolvePair = function(node, scope, context) {
    // Allow resolving a pair with a type context of "dynamic" to
    // deliberately silence errors around needing type context
    if (context == Skew.Type.DYNAMIC) {
      this._resolveAsParameterizedExpressionWithConversion(node.firstValue(), scope, context);
      this._resolveAsParameterizedExpressionWithConversion(node.secondValue(), scope, context);
      return;
    }

    this._resolveAsParameterizedExpression(node.firstValue(), scope);
    this._resolveAsParameterizedExpression(node.secondValue(), scope);
  };

  Skew.Resolving.Resolver.prototype._resolveJump = function(node, scope) {
    if (scope.findEnclosingLoop() == null) {
      this._log.semanticErrorBadJump(node.range, node.kind == Skew.NodeKind.BREAK ? 'break' : 'continue');
    }
  };

  Skew.Resolving.Resolver.prototype._resolveExpressionOrImplicitReturn = function(node, value, scope) {
    var hook = this._sinkNullDotIntoHook(value, scope, null);

    // Turn top-level "?." expressions into if statements
    if (hook != null) {
      var test = hook.hookTest();
      var yes = hook.hookTrue();
      var block = new Skew.Node(Skew.NodeKind.BLOCK).appendChild(Skew.Node.createExpression(yes.remove()).withRange(yes.range)).withRange(yes.range);
      node.become(Skew.Node.createIf(test.remove(), block, null).withRange(node.range).withComments(node.comments));
      this._resolveNode(node, scope, null);
    }

    // Turn top-level "?=" expressions into if statements
    else if (value.kind == Skew.NodeKind.ASSIGN_NULL) {
      var left = value.binaryLeft();
      var right = value.binaryRight();
      this._resolveAsParameterizedExpressionWithTypeContext(left, scope, null);
      this._checkStorage(left, scope);
      var test1 = Skew.Node.createBinary(Skew.NodeKind.EQUAL, this._extractExpressionForAssignment(left, scope), new Skew.Node(Skew.NodeKind.NULL)).withRange(left.range);
      var assign = Skew.Node.createBinary(Skew.NodeKind.ASSIGN, left.remove(), right.remove()).withRange(node.range).withFlags(Skew.NodeFlags.WAS_ASSIGN_NULL);
      var block1 = new Skew.Node(Skew.NodeKind.BLOCK).appendChild(Skew.Node.createExpression(assign).withRange(node.range)).withRange(node.range);
      node.become(Skew.Node.createIf(test1, block1, null).withRange(node.range).withComments(node.comments));
      this._resolveNode(node, scope, null);
    }

    // Normal expression statement
    else {
      this._resolveAsParameterizedExpression(value, scope);
    }
  };

  Skew.Resolving.Resolver.prototype._resolveExpression = function(node, scope) {
    var value = node.expressionValue();
    this._resolveExpressionOrImplicitReturn(node, value, scope);

    // Only continue this didn't get turned into an if statement due to a top-level "?." or "?=" expression
    if (node.kind == Skew.NodeKind.EXPRESSION) {
      this._checkUnusedExpression(value);
    }
  };

  Skew.Resolving.Resolver.prototype._resolveFor = function(node, scope) {
    var setup = node.forSetup();
    var update = node.forUpdate();
    scope = new Skew.LocalScope(scope, Skew.LocalType.LOOP);

    if (setup.kind == Skew.NodeKind.VARIABLES) {
      this._resolveNode(setup, scope, null);

      // All for loop variables must have the same type. This is a requirement
      // for one-to-one code emission in the languages we want to target.
      var type = setup.firstChild().symbol.resolvedType;

      for (var child = setup.firstChild().nextSibling(); child != null; child = child.nextSibling()) {
        var symbol = child.symbol;

        if (symbol.resolvedType != type) {
          this._log.semanticErrorForLoopDifferentType(symbol.range, symbol.name, symbol.resolvedType, type);
          break;
        }
      }
    }

    else {
      this._resolveAsParameterizedExpression(setup, scope);
    }

    this._resolveAsParameterizedExpressionWithConversion(node.forTest(), scope, this._cache.boolType);
    this._resolveAsParameterizedExpression(update, scope);

    if (update.kind == Skew.NodeKind.SEQUENCE) {
      for (var child1 = update.firstChild(); child1 != null; child1 = child1.nextSibling()) {
        this._checkUnusedExpression(child1);
      }
    }

    this._resolveBlock(node.forBlock(), scope);
  };

  Skew.Resolving.Resolver.prototype._resolveForeach = function(node, scope) {
    var type = Skew.Type.DYNAMIC;
    scope = new Skew.LocalScope(scope, Skew.LocalType.LOOP);
    var value = node.foreachValue();
    this._resolveAsParameterizedExpression(value, scope);

    // Support "for i in 0..10"
    if (value.kind == Skew.NodeKind.PAIR) {
      var first = value.firstValue();
      var second = value.secondValue();
      type = this._cache.intType;
      this._checkConversion(first, this._cache.intType, Skew.Resolving.ConversionKind.IMPLICIT);
      this._checkConversion(second, this._cache.intType, Skew.Resolving.ConversionKind.IMPLICIT);

      // The ".." syntax only counts up, unlike CoffeeScript
      if (first.isInt() && second.isInt() && first.asInt() >= second.asInt()) {
        this._log.semanticWarningEmptyRange(value.range);
      }
    }

    // Support "for i in [1, 2, 3]"
    else if (this._cache.isList(value.resolvedType)) {
      type = in_List.get(value.resolvedType.substitutions, 0);
    }

    // Anything else is an error
    else if (value.resolvedType != Skew.Type.DYNAMIC) {
      this._log.semanticErrorBadForValue(value.range, value.resolvedType);
    }

    // Special-case symbol initialization with the type
    var symbol = node.symbol.asVariableSymbol();
    scope.asLocalScope().define(symbol, this._log);
    this._localVariableStatistics[symbol.id] = new Skew.Resolving.LocalVariableStatistics(symbol);
    symbol.initializeWithType(type);
    symbol.flags |= Skew.SymbolFlags.IS_CONST | Skew.SymbolFlags.IS_LOOP_VARIABLE;
    this._resolveBlock(node.foreachBlock(), scope);

    // Collect foreach loops and convert them in another pass
    this._foreachLoops.push(node);
  };

  Skew.Resolving.Resolver.prototype._resolveIf = function(node, scope) {
    var test = node.ifTest();
    var ifFalse = node.ifFalse();
    this._resolveAsParameterizedExpressionWithConversion(test, scope, this._cache.boolType);
    this._resolveBlock(node.ifTrue(), new Skew.LocalScope(scope, Skew.LocalType.NORMAL));

    if (ifFalse != null) {
      this._resolveBlock(ifFalse, new Skew.LocalScope(scope, Skew.LocalType.NORMAL));
    }
  };

  Skew.Resolving.Resolver.prototype._resolveReturn = function(node, scope) {
    var value = node.returnValue();
    var $function = scope.findEnclosingFunctionOrLambda().symbol;
    var returnType = $function.kind != Skew.SymbolKind.FUNCTION_CONSTRUCTOR ? $function.resolvedType.returnType : null;

    // Check for a returned value
    if (value == null) {
      if (returnType != null && !$function.isDynamicLambda()) {
        this._log.semanticErrorExpectedReturnValue(node.range, returnType);
      }

      return;
    }

    // Check the type of the returned value
    if (returnType != null) {
      this._resolveAsParameterizedExpressionWithConversion(value, scope, returnType);

      if ($function.shouldInferReturnType() && Skew.Resolving.Resolver._isCallReturningVoid(value)) {
        node.kind = Skew.NodeKind.EXPRESSION;
      }

      return;
    }

    // If there's no return type, still check for other errors
    if (node.isImplicitReturn()) {
      this._resolveExpressionOrImplicitReturn(node, value, scope);

      // Stop now if this got turned into an if statement due to a top-level "?." or "?=" expression
      if (node.kind != Skew.NodeKind.RETURN) {
        return;
      }
    }

    else {
      this._resolveAsParameterizedExpression(value, scope);
    }

    // Lambdas without a return type or an explicit "return" statement get special treatment
    if (!node.isImplicitReturn()) {
      this._log.semanticErrorUnexpectedReturnValue(value.range);
      return;
    }

    // Check for a return value of type "void"
    if (!$function.shouldInferReturnType() || Skew.Resolving.Resolver._isCallReturningVoid(value)) {
      this._checkUnusedExpression(value);
      node.kind = Skew.NodeKind.EXPRESSION;
      return;
    }

    // Check for an invalid return type
    var type = value.resolvedType;

    if (!Skew.Resolving.Resolver._isValidVariableType(type)) {
      this._log.semanticErrorBadReturnType(value.range, type);
      node.kind = Skew.NodeKind.EXPRESSION;
      return;
    }

    // Mutate the return type to the type from the returned value
    $function.returnType = new Skew.Node(Skew.NodeKind.TYPE).withType(type);
    $function.resolvedType.returnType = type;
  };

  Skew.Resolving.Resolver.prototype._resolveSwitch = function(node, scope) {
    var duplicateCases = {};
    var mustEnsureConstantIntegers = this._options.target.requiresIntegerSwitchStatements();
    var allValuesAreIntegers = true;
    var value = node.switchValue();
    this._resolveAsParameterizedExpression(value, scope);

    for (var child = value.nextSibling(); child != null; child = child.nextSibling()) {
      var block = child.caseBlock();

      // Resolve all case values
      for (var caseValue = child.firstChild(); caseValue != block; caseValue = caseValue.nextSibling()) {
        this._resolveAsParameterizedExpressionWithConversion(caseValue, scope, value.resolvedType);
        var symbol = caseValue.symbol;
        var integer = 0;

        // Check for a constant variable, which may just be read-only with a
        // value determined at runtime
        if (symbol != null && (mustEnsureConstantIntegers ? symbol.kind == Skew.SymbolKind.VARIABLE_ENUM_OR_FLAGS : Skew.in_SymbolKind.isVariable(symbol.kind) && symbol.isConst())) {
          var constant = this._constantFolder.constantForSymbol(symbol.asVariableSymbol());

          if (constant == null || constant.kind() != Skew.ContentKind.INT) {
            allValuesAreIntegers = false;
            continue;
          }

          integer = Skew.in_Content.asInt(constant);
        }

        // Fall back to the constant folder only as a last resort because it
        // mutates the syntax tree and harms readability
        else {
          this._constantFolder.foldConstants(caseValue);

          if (!caseValue.isInt()) {
            allValuesAreIntegers = false;
            continue;
          }

          integer = caseValue.asInt();
        }

        // Duplicate case detection
        var previous = in_IntMap.get(duplicateCases, integer, null);

        if (previous != null) {
          this._log.semanticErrorDuplicateCase(caseValue.range, previous);
        }

        else {
          duplicateCases[integer] = caseValue.range;
        }
      }

      // The default case must be last, makes changing into an if chain easier later
      if (child.hasOneChild() && child.nextSibling() != null) {
        this._log.semanticErrorDefaultCaseNotLast(child.range);
      }

      this._resolveBlock(block, new Skew.LocalScope(scope, Skew.LocalType.NORMAL));
    }

    // Fall back to an if statement if the case values aren't compile-time
    // integer constants, which is requried by many language targets
    if (!allValuesAreIntegers && mustEnsureConstantIntegers) {
      this._convertSwitchToIfChain(node, scope);
    }
  };

  Skew.Resolving.Resolver.prototype._resolveThrow = function(node, scope) {
    var value = node.throwValue();
    this._resolveAsParameterizedExpression(value, scope);
  };

  Skew.Resolving.Resolver.prototype._resolveVariable2 = function(node, scope) {
    var symbol = node.symbol.asVariableSymbol();
    scope.asLocalScope().define(symbol, this._log);
    this._localVariableStatistics[symbol.id] = new Skew.Resolving.LocalVariableStatistics(symbol);
    this._resolveVariable1(symbol);

    // Make sure to parent any created values under the variable node
    if (!node.hasChildren() && symbol.value != null) {
      node.appendChild(symbol.value);
    }
  };

  Skew.Resolving.Resolver.prototype._resolveVariables = function(node, scope) {
    for (var child = node.firstChild(); child != null; child = child.nextSibling()) {
      this._resolveVariable2(child, scope);
    }
  };

  Skew.Resolving.Resolver.prototype._resolveTry = function(node, scope) {
    var tryBlock = node.tryBlock();
    var finallyBlock = node.finallyBlock();
    this._resolveBlock(tryBlock, new Skew.LocalScope(scope, Skew.LocalType.NORMAL));

    // Bare try statements catch all thrown values
    if (node.hasOneChild()) {
      node.appendChild(Skew.Node.createCatch(null, new Skew.Node(Skew.NodeKind.BLOCK)));
    }

    // Check catch statements
    for (var child = tryBlock.nextSibling(); child != finallyBlock; child = child.nextSibling()) {
      var childScope = new Skew.LocalScope(scope, Skew.LocalType.NORMAL);

      if (child.symbol != null) {
        var symbol = child.symbol.asVariableSymbol();
        childScope.define(symbol, this._log);
        this._resolveVariable1(symbol);
      }

      this._resolveBlock(child.catchBlock(), childScope);
    }

    // Check finally block
    if (finallyBlock != null) {
      this._resolveBlock(finallyBlock, new Skew.LocalScope(scope, Skew.LocalType.NORMAL));
    }
  };

  Skew.Resolving.Resolver.prototype._resolveWhile = function(node, scope) {
    this._resolveAsParameterizedExpressionWithConversion(node.whileTest(), scope, this._cache.boolType);
    this._resolveBlock(node.whileBlock(), new Skew.LocalScope(scope, Skew.LocalType.LOOP));
  };

  Skew.Resolving.Resolver.prototype._resolveCall = function(node, scope, context) {
    var hook = this._sinkNullDotIntoHook(node, scope, context);

    if (hook != null) {
      node.become(hook);
      this._resolveAsParameterizedExpressionWithTypeContext(node, scope, context);
      return;
    }

    var value = node.callValue();

    // Take argument types from call argument values for immediately-invoked
    // function expressions:
    //
    //   var foo = ((a, b) => a + b)(1, 2)
    //   var bar int = ((a, b) => { return a + b })(1, 2)
    //
    if (value.kind == Skew.NodeKind.LAMBDA) {
      var symbol = value.symbol.asFunctionSymbol();
      var $arguments = symbol.$arguments;

      if (node.childCount() == ($arguments.length + 1 | 0)) {
        var child = value.nextSibling();

        for (var i = 0, count = $arguments.length; i < count; i = i + 1 | 0) {
          var argument = in_List.get($arguments, i);

          if (argument.type == null) {
            this._resolveAsParameterizedExpression(child, scope);
            argument.type = new Skew.Node(Skew.NodeKind.TYPE).withType(child.resolvedType);
          }

          child = child.nextSibling();
        }

        if (context != null && symbol.returnType == null) {
          symbol.returnType = new Skew.Node(Skew.NodeKind.TYPE).withType(context);
        }
      }
    }

    this._resolveAsParameterizedExpression(value, scope);
    var type = value.resolvedType;

    switch (type.kind) {
      case Skew.TypeKind.SYMBOL: {
        if (this._resolveSymbolCall(node, scope, type)) {
          return;
        }
        break;
      }

      case Skew.TypeKind.LAMBDA: {
        if (this._resolveFunctionCall(node, scope, type)) {
          return;
        }
        break;
      }

      default: {
        if (type != Skew.Type.DYNAMIC) {
          this._log.semanticErrorInvalidCall(node.internalRangeOrRange(), value.resolvedType);
        }
        break;
      }
    }

    // If there was an error, resolve the arguments to check for further
    // errors but use a dynamic type context to avoid introducing errors
    for (var child1 = value.nextSibling(); child1 != null; child1 = child1.nextSibling()) {
      this._resolveAsParameterizedExpressionWithConversion(child1, scope, Skew.Type.DYNAMIC);
    }
  };

  Skew.Resolving.Resolver.prototype._resolveSymbolCall = function(node, scope, type) {
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
    if (symbol.isGetter() && Skew.Resolving.Resolver._isCallValue(node) && !node.callValue().isInsideParentheses()) {
      if (symbol.resolvedType.returnType != null && symbol.resolvedType.returnType.kind == Skew.TypeKind.LAMBDA) {
        this._log.semanticErrorGetterRequiresWrap(node.range, symbol.name, symbol.range);
      }

      else {
        this._log.semanticErrorGetterCalledTwice(node.parent().internalRangeOrRange(), symbol.name, symbol.range);
      }

      this._resolveChildrenAsParameterizedExpressionsWithDynamicTypeContext(node, scope);
      return false;
    }

    // Check for calling a function directly
    if (Skew.in_SymbolKind.isFunction(symbol.kind)) {
      return this._resolveFunctionCall(node, scope, type);
    }

    // Check for calling a set of functions, must not be ambiguous
    if (Skew.in_SymbolKind.isOverloadedFunction(symbol.kind)) {
      return this._resolveOverloadedFunctionCall(node, scope, type);
    }

    // Can't call other symbols
    this._log.semanticErrorInvalidCall(node.internalRangeOrRange(), node.callValue().resolvedType);
    return false;
  };

  Skew.Resolving.Resolver.prototype._resolveFunctionCall = function(node, scope, type) {
    var ref;
    var $function = (ref = type.symbol) != null ? ref.asFunctionSymbol() : null;
    var expected = type.argumentTypes.length;
    var count = node.childCount() - 1 | 0;
    node.symbol = $function;

    // Use the return type even if there were errors
    if (type.returnType != null) {
      node.resolvedType = type.returnType;
    }

    // There is no "void" type, so make sure this return value isn't used
    else if (Skew.Resolving.Resolver._isExpressionUsed(node)) {
      if ($function != null) {
        this._log.semanticErrorUseOfVoidFunction(node.range, $function.name, $function.range);
      }

      else {
        this._log.semanticErrorUseOfVoidLambda(node.range);
      }
    }

    // Check argument count
    if (expected != count) {
      this._log.semanticErrorArgumentCount(node.internalRangeOrRange(), expected, count, $function != null ? $function.name : null, $function != null ? $function.range : null);
      this._resolveChildrenAsParameterizedExpressionsWithDynamicTypeContext(node, scope);
      return false;
    }

    // Check argument types
    var value = node.firstChild();
    var child = value.nextSibling();

    for (var i = 0, list = type.argumentTypes, count1 = list.length; i < count1; i = i + 1 | 0) {
      var argumentType = in_List.get(list, i);
      this._resolveAsParameterizedExpressionWithConversion(child, scope, argumentType);
      child = child.nextSibling();
    }

    // Forbid constructing an abstract type
    if ($function != null && $function.kind == Skew.SymbolKind.FUNCTION_CONSTRUCTOR && value.kind != Skew.NodeKind.SUPER) {
      this._checkInterfacesAndAbstractStatus2($function.parent.asObjectSymbol());
      var reason = $function.parent.asObjectSymbol().isAbstractBecauseOf;

      if (reason != null) {
        this._log.semanticErrorAbstractNew(node.internalRangeOrRange(), $function.parent.resolvedType, reason.range, reason.name);
      }
    }

    // Replace overloaded symbols with the chosen overload
    if (value.kind == Skew.NodeKind.PARAMETERIZE) {
      value = value.parameterizeValue();
    }

    if ($function != null && value.symbol != null && Skew.in_SymbolKind.isOverloadedFunction(value.symbol.kind) && value.symbol.asOverloadedFunctionSymbol().symbols.indexOf($function) != -1) {
      value.symbol = $function;
      value.resolvedType = type;
    }

    return true;
  };

  Skew.Resolving.Resolver.prototype._resolveOverloadedFunction = function(range, node, scope, symbolType) {
    var overloaded = symbolType.symbol.asOverloadedFunctionSymbol();
    var firstArgument = node.firstChild().nextSibling();
    var count = node.childCount() - 1 | 0;
    var candidates = [];

    // Filter by argument length and substitute using the current type environment
    for (var i1 = 0, list = overloaded.symbols, count1 = list.length; i1 < count1; i1 = i1 + 1 | 0) {
      var symbol = in_List.get(list, i1);

      if (symbol.$arguments.length == count || overloaded.symbols.length == 1) {
        candidates.push(this._cache.substitute(symbol.resolvedType, symbolType.environment));
      }
    }

    // Check for matches
    if (candidates.length == 0) {
      this._log.semanticErrorNoMatchingOverload(range, overloaded.name, count, null);
      return null;
    }

    // Check for an unambiguous match
    if (candidates.length == 1) {
      return in_List.get(candidates, 0);
    }

    // First filter by syntactic structure impossibilities. This helps break
    // the chicken-and-egg problem of needing to resolve argument types to
    // get a match and needing a match to resolve argument types. For example,
    // a list literal needs type context to resolve correctly.
    var index = 0;

    while (index < candidates.length) {
      var child = firstArgument;

      for (var i2 = 0, list1 = in_List.get(candidates, index).argumentTypes, count2 = list1.length; i2 < count2; i2 = i2 + 1 | 0) {
        var type = in_List.get(list1, i2);
        var kind = child.kind;

        if (kind == Skew.NodeKind.NULL && !type.isReference() || kind == Skew.NodeKind.INITIALIZER_LIST && this._findMember(type, '[new]') == null && this._findMember(type, '[...]') == null || kind == Skew.NodeKind.INITIALIZER_MAP && this._findMember(type, '{new}') == null && this._findMember(type, '{...}') == null || kind == Skew.NodeKind.LAMBDA && (type.kind != Skew.TypeKind.LAMBDA || type.argumentTypes.length != child.symbol.asFunctionSymbol().$arguments.length)) {
          in_List.removeAt(candidates, index);
          index = index - 1 | 0;
          break;
        }

        child = child.nextSibling();
      }

      index = index + 1 | 0;
    }

    // Check for an unambiguous match
    if (candidates.length == 1) {
      return in_List.get(candidates, 0);
    }

    // If that still didn't work, resolve the arguments without type context
    for (var child1 = firstArgument; child1 != null; child1 = child1.nextSibling()) {
      this._resolveAsParameterizedExpression(child1, scope);
    }

    // Try again, this time discarding all implicit conversion failures
    index = 0;

    while (index < candidates.length) {
      var child2 = firstArgument;

      for (var i3 = 0, list2 = in_List.get(candidates, index).argumentTypes, count3 = list2.length; i3 < count3; i3 = i3 + 1 | 0) {
        var type1 = in_List.get(list2, i3);

        if (!this._cache.canImplicitlyConvert(child2.resolvedType, type1)) {
          in_List.removeAt(candidates, index);
          index = index - 1 | 0;
          break;
        }

        child2 = child2.nextSibling();
      }

      index = index + 1 | 0;
    }

    // Check for an unambiguous match
    if (candidates.length == 1) {
      return in_List.get(candidates, 0);
    }

    // Extract argument types for an error if there is one
    var childTypes = [];

    for (var child3 = firstArgument; child3 != null; child3 = child3.nextSibling()) {
      childTypes.push(child3.resolvedType);
    }

    // Give up without a match
    if (candidates.length == 0) {
      this._log.semanticErrorNoMatchingOverload(range, overloaded.name, count, childTypes);
      return null;
    }

    // If that still didn't work, try type equality
    for (var i4 = 0, list3 = candidates, count5 = list3.length; i4 < count5; i4 = i4 + 1 | 0) {
      var type2 = in_List.get(list3, i4);
      var isMatch = true;

      for (var i = 0, count4 = count; i < count4; i = i + 1 | 0) {
        if (in_List.get(childTypes, i) != in_List.get(type2.argumentTypes, i)) {
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

    for (var i5 = 0, list4 = candidates, count6 = list4.length; i5 < count6; i5 = i5 + 1 | 0) {
      var type3 = in_List.get(list4, i5);

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
    this._log.semanticErrorAmbiguousOverload(range, overloaded.name, count, childTypes);
    return null;
  };

  Skew.Resolving.Resolver.prototype._resolveOverloadedFunctionCall = function(node, scope, type) {
    var match = this._resolveOverloadedFunction(node.callValue().range, node, scope, type);

    if (match != null && this._resolveFunctionCall(node, scope, match)) {
      this._checkAccess(node, node.callValue().internalRangeOrRange(), scope);
      return true;
    }

    return false;
  };

  Skew.Resolving.Resolver.prototype._resolveCast = function(node, scope, context) {
    var value = node.castValue();
    var type = node.castType();
    var neededTypeContext = Skew.Resolving.Resolver._needsTypeContext(value);
    this._resolveAsParameterizedType(type, scope);
    this._resolveAsParameterizedExpressionWithTypeContext(value, scope, type.resolvedType);
    this._checkConversion(value, type.resolvedType, Skew.Resolving.ConversionKind.EXPLICIT);
    node.resolvedType = type.resolvedType;

    // Warn about unnecessary casts
    var range = node.internalRangeOrRange();

    if (range != null && type.resolvedType != Skew.Type.DYNAMIC && value.resolvedType != Skew.Type.DYNAMIC && !neededTypeContext && (value.resolvedType == type.resolvedType || context == type.resolvedType && this._cache.canImplicitlyConvert(value.resolvedType, type.resolvedType))) {
      this._log.semanticWarningExtraCast(Skew.Range.span(range, type.range), value.resolvedType, type.resolvedType);
    }
  };

  Skew.Resolving.Resolver.prototype._resolveConstant = function(node, scope, context) {
    switch (node.content.kind()) {
      case Skew.ContentKind.BOOL: {
        node.resolvedType = this._cache.boolType;
        break;
      }

      case Skew.ContentKind.DOUBLE: {
        node.resolvedType = this._cache.doubleType;
        break;
      }

      case Skew.ContentKind.STRING: {
        node.resolvedType = this._cache.stringType;
        break;
      }

      case Skew.ContentKind.INT: {
        node.resolvedType = context != null && context.isFlags() && node.asInt() == 0 ? context : this._cache.intType;
        break;
      }

      default: {
        assert(false);
        break;
      }
    }
  };

  Skew.Resolving.Resolver.prototype._findMember = function(type, name) {
    if (type.kind == Skew.TypeKind.SYMBOL) {
      var symbol = type.symbol;

      if (Skew.in_SymbolKind.isObject(symbol.kind)) {
        var member = in_StringMap.get(symbol.asObjectSymbol().members, name, null);

        if (member != null) {
          this._initializeSymbol(member);
          return member;
        }
      }
    }

    return null;
  };

  Skew.Resolving.Resolver.prototype._sinkNullDotIntoHook = function(node, scope, context) {
    var nullDot = node;

    // Search down the chain of dot accesses and calls for "?." expression
    while (true) {
      if (nullDot.kind == Skew.NodeKind.DOT && nullDot.dotTarget() != null) {
        nullDot = nullDot.dotTarget();
      }

      else if (nullDot.kind == Skew.NodeKind.CALL) {
        nullDot = nullDot.callValue();
      }

      else {
        break;
      }
    }

    // Stop if this isn't a "?." expression after all
    if (nullDot.kind != Skew.NodeKind.NULL_DOT) {
      return null;
    }

    // Wrap everything in a null check
    var target = nullDot.dotTarget().remove();
    this._resolveAsParameterizedExpression(target, scope);
    var test = Skew.Node.createBinary(Skew.NodeKind.NOT_EQUAL, this._extractExpression(target, scope), new Skew.Node(Skew.NodeKind.NULL).withRange(nullDot.internalRange)).withRange(target.range);
    var dot = new Skew.Node(Skew.NodeKind.DOT).withContent(new Skew.StringContent(nullDot.asString())).appendChild(target).withRange(nullDot.range).withInternalRange(nullDot.internalRange);
    var hook = Skew.Node.createHook(test, dot, new Skew.Node(Skew.NodeKind.NULL).withRange(nullDot.internalRangeOrRange())).withRange(nullDot.range);
    nullDot.become(hook.hookTrue().clone());

    // This is necessary to trigger the resolve below
    node.resolvedType = null;
    hook.hookTrue().become(node.cloneAndStealChildren());
    return hook;
  };

  Skew.Resolving.Resolver.prototype._resolveDot = function(node, scope, context) {
    var hook = this._sinkNullDotIntoHook(node, scope, context);

    if (hook != null) {
      node.become(hook);
      this._resolveAsParameterizedExpressionWithTypeContext(node, scope, context);
      return;
    }

    var target = node.dotTarget();
    var name = node.asString();

    // Infer the target from the type context if it's omitted
    if (target == null) {
      if (context == null) {
        this._log.semanticErrorMissingDotContext(node.range, name);
        return;
      }

      target = new Skew.Node(Skew.NodeKind.TYPE).withType(context);
      node.appendChild(target);
      assert(node.dotTarget() == target);
    }

    else {
      this._resolveNode(target, scope, null);
    }

    // Search for a setter first, then search for a normal member
    var symbol = null;

    if (Skew.Resolving.Resolver._shouldCheckForSetter(node)) {
      symbol = this._findMember(target.resolvedType, name + '=');
    }

    if (symbol == null) {
      symbol = this._findMember(target.resolvedType, name);

      if (symbol == null) {
        // Symbol lookup failure
        if (target.resolvedType != Skew.Type.DYNAMIC) {
          var type = target.resolvedType;
          var correction = type.kind != Skew.TypeKind.SYMBOL || !Skew.in_SymbolKind.isObject(type.symbol.kind) ? null : type.symbol.asObjectSymbol().scope.findWithFuzzyMatching(name, target.isType() ? Skew.FuzzySymbolKind.GLOBAL_ONLY : Skew.FuzzySymbolKind.INSTANCE_ONLY, Skew.FuzzyScopeSearch.SELF_ONLY);
          this._reportGuardMergingFailure(node);
          this._log.semanticErrorUnknownMemberSymbol(node.internalRangeOrRange(), name, target.resolvedType, correction != null ? correction.name : null, correction != null ? correction.range : null);
        }

        // "dynamic.foo" => "foo"
        else if (target.kind == Skew.NodeKind.TYPE) {
          node.kind = Skew.NodeKind.NAME;
          node.removeChildren();
        }

        // "Foo.new" => "Foo.new()"
        // "Foo.new()" => "Foo.new()"
        else if (name == 'new' && !Skew.Resolving.Resolver._isCallValue(node)) {
          node.become(Skew.Node.createCall(node.cloneAndStealChildren()).withType(Skew.Type.DYNAMIC).withRange(node.range));
        }

        return;
      }
    }

    // Forbid referencing a base class global or constructor function from a derived class
    if (Skew.Resolving.Resolver._isBaseGlobalReference(target.resolvedType.symbol, symbol)) {
      this._log.semanticErrorUnknownMemberSymbol(node.range, name, target.resolvedType, symbol.fullName(), symbol.range);
      return;
    }

    var isType = target.isType();
    var needsType = !Skew.in_SymbolKind.isOnInstances(symbol.kind);

    // Make sure the global/instance context matches the intended usage
    if (isType) {
      if (!needsType) {
        this._log.semanticErrorMemberUnexpectedInstance(node.internalRangeOrRange(), symbol.name);
      }

      else if (Skew.in_SymbolKind.isFunctionOrOverloadedFunction(symbol.kind)) {
        this._checkIsParameterized(target);
      }

      else if (target.resolvedType.isParameterized()) {
        this._log.semanticErrorParameterizedType(target.range, target.resolvedType);
      }
    }

    else if (needsType) {
      this._log.semanticErrorMemberUnexpectedGlobal(node.internalRangeOrRange(), symbol.name);
    }

    // Always access referenced globals directly
    if (!this._options.stopAfterResolve && Skew.in_SymbolKind.isGlobalReference(symbol.kind)) {
      node.kind = Skew.NodeKind.NAME;
      node.removeChildren();
    }

    node.symbol = symbol;
    node.resolvedType = this._cache.substitute(symbol.resolvedType, target.resolvedType.environment);
    this._automaticallyCallGetter(node, scope);
  };

  Skew.Resolving.Resolver.prototype._resolveHook = function(node, scope, context) {
    this._resolveAsParameterizedExpressionWithConversion(node.hookTest(), scope, this._cache.boolType);
    var trueValue = node.hookTrue();
    var falseValue = node.hookFalse();

    // Use the type context from the parent
    if (context != null) {
      this._resolveAsParameterizedExpressionWithConversion(trueValue, scope, context);
      this._resolveAsParameterizedExpressionWithConversion(falseValue, scope, context);
      node.resolvedType = context;
    }

    // Find the common type from both branches
    else {
      this._resolveAsParameterizedExpression(trueValue, scope);
      this._resolveAsParameterizedExpression(falseValue, scope);
      var commonType = this._cache.commonImplicitType(trueValue.resolvedType, falseValue.resolvedType);

      // Insert casts if needed since some targets can't perform this type inference
      if (commonType != null) {
        this._checkConversion(trueValue, commonType, Skew.Resolving.ConversionKind.IMPLICIT);
        this._checkConversion(falseValue, commonType, Skew.Resolving.ConversionKind.IMPLICIT);
        node.resolvedType = commonType;
      }

      else {
        this._log.semanticErrorNoCommonType(Skew.Range.span(trueValue.range, falseValue.range), trueValue.resolvedType, falseValue.resolvedType);
      }
    }

    // Check for likely bugs where both branches look the same
    if (trueValue.looksTheSameAs(falseValue)) {
      this._log.semanticWarningIdenticalOperands(Skew.Range.span(trueValue.range, falseValue.range), node.wasNullJoin() ? '??' : ':');
    }
  };

  Skew.Resolving.Resolver.prototype._resolveInitializer = function(node, scope, context) {
    // Make sure to resolve the children even if the initializer is invalid
    if (context != null) {
      if (context == Skew.Type.DYNAMIC || !this._resolveInitializerWithContext(node, scope, context)) {
        this._resolveChildrenAsParameterizedExpressionsWithDynamicTypeContext(node, scope);
      }

      return;
    }

    // First pass: only children with type context, second pass: all children
    for (var pass = 0; pass < 2; pass = pass + 1 | 0) {
      switch (node.kind) {
        case Skew.NodeKind.INITIALIZER_LIST: {
          var type = null;

          // Resolve all children for this pass
          for (var child = node.firstChild(); child != null; child = child.nextSibling()) {
            if (pass != 0 || !Skew.Resolving.Resolver._needsTypeContext(child)) {
              this._resolveAsParameterizedExpression(child, scope);
              type = this._mergeCommonType(type, child);
            }
          }

          // Resolve remaining children using the type context if valid
          if (type != null && Skew.Resolving.Resolver._isValidVariableType(type)) {
            this._resolveInitializerWithContext(node, scope, this._cache.createListType(type));
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

            if (pass != 0 || !Skew.Resolving.Resolver._needsTypeContext(key)) {
              this._resolveAsParameterizedExpression(key, scope);
              keyType = this._mergeCommonType(keyType, key);
            }

            if (pass != 0 || !Skew.Resolving.Resolver._needsTypeContext(value)) {
              this._resolveAsParameterizedExpression(value, scope);
              valueType = this._mergeCommonType(valueType, value);
            }
          }

          // Resolve remaining children using the type context if valid
          if (keyType != null && valueType != null && Skew.Resolving.Resolver._isValidVariableType(valueType)) {
            assert(!this._cache.isEquivalentToInt(keyType) || !this._cache.isEquivalentToString(keyType));

            if (this._cache.isEquivalentToInt(keyType)) {
              this._resolveInitializerWithContext(node, scope, this._cache.createIntMapType(valueType));
              return;
            }

            if (this._cache.isEquivalentToString(keyType)) {
              this._resolveInitializerWithContext(node, scope, this._cache.createStringMapType(valueType));
              return;
            }
          }
          break;
        }
      }
    }

    this._log.semanticErrorInitializerTypeInferenceFailed(node.range);
    this._resolveChildrenAsParameterizedExpressionsWithDynamicTypeContext(node, scope);
  };

  Skew.Resolving.Resolver.prototype._resolveInitializerWithContext = function(node, scope, context) {
    var isList = node.kind == Skew.NodeKind.INITIALIZER_LIST;
    var $new = this._findMember(context, isList ? '[new]' : '{new}');
    var add = this._findMember(context, isList ? '[...]' : '{...}');

    // Special-case imported literals to prevent an infinite loop for list literals
    if (add != null && add.isImported()) {
      var $function = add.asFunctionSymbol();

      if ($function.$arguments.length == (isList ? 1 : 2)) {
        var functionType = this._cache.substitute($function.resolvedType, context.environment);

        for (var child = node.firstChild(); child != null; child = child.nextSibling()) {
          if (child.kind == Skew.NodeKind.PAIR) {
            this._resolveAsParameterizedExpressionWithConversion(child.firstValue(), scope, in_List.get(functionType.argumentTypes, 0));
            this._resolveAsParameterizedExpressionWithConversion(child.secondValue(), scope, in_List.get(functionType.argumentTypes, 1));
            child.resolvedType = Skew.Type.DYNAMIC;
          }

          else {
            this._resolveAsParameterizedExpressionWithConversion(child, scope, in_List.get(functionType.argumentTypes, 0));
          }
        }

        node.resolvedType = context;
        return true;
      }
    }

    // Use simple call chaining when there's an add operator present
    if (add != null) {
      var chain = new Skew.Node(Skew.NodeKind.DOT).withContent(new Skew.StringContent($new != null ? $new.name : 'new')).appendChild(new Skew.Node(Skew.NodeKind.TYPE).withType(context).withRange(node.range)).withRange(node.range);

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
      this._resolveAsParameterizedExpressionWithConversion(node, scope, context);
      return true;
    }

    // Make sure there's a constructor to call
    if ($new == null) {
      // Avoid emitting an extra error when the constructor doesn't have the right type:
      //
      //   def main Foo {
      //     return []
      //   }
      //
      //   class Foo {
      //     def [new](x int) {}
      //   }
      //
      if (!node.isInitializerExpansion()) {
        this._log.semanticErrorInitializerTypeInferenceFailed(node.range);
      }

      return false;
    }

    // Avoid infinite expansion
    if (node.isInitializerExpansion()) {
      this._log.semanticErrorInitializerRecursiveExpansion(node.range, $new.range);
      return false;
    }

    var dot1 = new Skew.Node(Skew.NodeKind.DOT).withContent(new Skew.StringContent($new.name)).appendChild(new Skew.Node(Skew.NodeKind.TYPE).withType(context).withRange(node.range)).withRange(node.range);

    // Call the initializer constructor
    if (node.kind == Skew.NodeKind.INITIALIZER_MAP) {
      var firstValues = new Skew.Node(Skew.NodeKind.INITIALIZER_LIST).withFlags(Skew.NodeFlags.IS_INITIALIZER_EXPANSION).withRange(node.range);
      var secondValues = new Skew.Node(Skew.NodeKind.INITIALIZER_LIST).withFlags(Skew.NodeFlags.IS_INITIALIZER_EXPANSION).withRange(node.range);

      for (var child2 = node.firstChild(); child2 != null; child2 = child2.nextSibling()) {
        var first = child2.firstValue();
        var second = child2.secondValue();
        firstValues.appendChild(first.remove());
        secondValues.appendChild(second.remove());
      }

      node.become(Skew.Node.createCall(dot1).withRange(node.range).appendChild(firstValues).appendChild(secondValues));
    }

    else {
      var values = new Skew.Node(Skew.NodeKind.INITIALIZER_LIST).withFlags(Skew.NodeFlags.IS_INITIALIZER_EXPANSION).withRange(node.range);
      node.become(Skew.Node.createCall(dot1).withRange(node.range).appendChild(values.appendChildrenFrom(node)));
    }

    this._resolveAsParameterizedExpressionWithConversion(node, scope, context);
    return true;
  };

  Skew.Resolving.Resolver.prototype._mergeCommonType = function(commonType, child) {
    if (commonType == null || child.resolvedType == Skew.Type.DYNAMIC) {
      return child.resolvedType;
    }

    var result = this._cache.commonImplicitType(commonType, child.resolvedType);

    if (result != null) {
      return result;
    }

    this._log.semanticErrorNoCommonType(child.range, commonType, child.resolvedType);
    return Skew.Type.DYNAMIC;
  };

  Skew.Resolving.Resolver.prototype._resolveLambda = function(node, scope, context) {
    var ref;
    var symbol = node.symbol.asFunctionSymbol();
    symbol.scope = new Skew.FunctionScope(scope, symbol);

    // Use type context to implicitly set missing types
    if (context != null && context.kind == Skew.TypeKind.LAMBDA) {
      // Copy over the argument types if they line up
      if (context.argumentTypes.length == symbol.$arguments.length) {
        for (var i = 0, count = symbol.$arguments.length; i < count; i = i + 1 | 0) {
          if ((ref = in_List.get(symbol.$arguments, i)).type == null) {
            ref.type = new Skew.Node(Skew.NodeKind.TYPE).withType(in_List.get(context.argumentTypes, i));
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
        symbol.flags |= Skew.SymbolFlags.SHOULD_INFER_RETURN_TYPE;
      }

      // If there's dynamic type context, treat all arguments as dynamic
      if (context == Skew.Type.DYNAMIC) {
        for (var i1 = 0, list = symbol.$arguments, count1 = list.length; i1 < count1; i1 = i1 + 1 | 0) {
          var argument = in_List.get(list, i1);

          if (argument.type == null) {
            argument.type = new Skew.Node(Skew.NodeKind.TYPE).withType(Skew.Type.DYNAMIC);
          }
        }

        if (symbol.returnType == null) {
          symbol.returnType = new Skew.Node(Skew.NodeKind.TYPE).withType(Skew.Type.DYNAMIC);
        }

        symbol.flags |= Skew.SymbolFlags.IS_DYNAMIC_LAMBDA;
      }
    }

    this._resolveFunction(symbol);

    // Use a LambdaType instead of a SymbolType for the node
    var argumentTypes = [];
    var returnType = symbol.returnType;

    for (var i2 = 0, list1 = symbol.$arguments, count2 = list1.length; i2 < count2; i2 = i2 + 1 | 0) {
      var argument1 = in_List.get(list1, i2);
      argumentTypes.push(argument1.resolvedType);
    }

    node.resolvedType = this._cache.createLambdaType(argumentTypes, returnType != null ? returnType.resolvedType : null);
  };

  Skew.Resolving.Resolver.prototype._resolveLambdaType = function(node, scope) {
    var lambdaReturnType = node.lambdaReturnType();
    var argumentTypes = [];
    var returnType = null;

    for (var child = node.firstChild(); child != lambdaReturnType; child = child.nextSibling()) {
      this._resolveAsParameterizedType(child, scope);
      argumentTypes.push(child.resolvedType);
    }

    // An empty return type is signaled by the type "null"
    if (lambdaReturnType.kind != Skew.NodeKind.TYPE || lambdaReturnType.resolvedType != Skew.Type.NULL) {
      this._resolveAsParameterizedType(lambdaReturnType, scope);
      returnType = lambdaReturnType.resolvedType;
    }

    node.resolvedType = this._cache.createLambdaType(argumentTypes, returnType);
  };

  Skew.Resolving.Resolver.prototype._resolveName = function(node, scope) {
    var enclosingFunction = scope.findEnclosingFunction();
    var name = node.asString();
    var symbol = scope.find(name, Skew.Resolving.Resolver._shouldCheckForSetter(node) ? Skew.ScopeSearch.ALSO_CHECK_FOR_SETTER : Skew.ScopeSearch.NORMAL);

    if (symbol == null) {
      var canAccessSelf = enclosingFunction != null && enclosingFunction.symbol.$this != null;
      this._reportGuardMergingFailure(node);

      if (name == 'this' && canAccessSelf) {
        this._log.semanticErrorUndeclaredSelfSymbol(node.range, name);
      }

      else {
        var correction = scope.findWithFuzzyMatching(name, node.shouldExpectType() ? Skew.FuzzySymbolKind.TYPE_ONLY : canAccessSelf ? Skew.FuzzySymbolKind.EVERYTHING : Skew.FuzzySymbolKind.GLOBAL_ONLY, Skew.FuzzyScopeSearch.SELF_AND_PARENTS);
        this._log.semanticErrorUndeclaredSymbol(node.range, name, correction == null ? null : enclosingFunction != null && Skew.Resolving.Resolver._isBaseGlobalReference(enclosingFunction.symbol.parent, correction) ? correction.fullName() : correction.name, correction != null ? correction.range : null);
      }

      return;
    }

    this._initializeSymbol(symbol);

    // Track reads and writes of local variables for later use
    if (node.isAssignTarget()) {
      this._recordStatistic(symbol, Skew.Resolving.SymbolStatistic.WRITE);

      // Also track reads for assignments
      if (Skew.Resolving.Resolver._isExpressionUsed(node.parent())) {
        this._recordStatistic(symbol, Skew.Resolving.SymbolStatistic.READ);
      }
    }

    else {
      this._recordStatistic(symbol, Skew.Resolving.SymbolStatistic.READ);
    }

    // Forbid referencing a base class global or constructor function from a derived class
    if (enclosingFunction != null && Skew.Resolving.Resolver._isBaseGlobalReference(enclosingFunction.symbol.parent, symbol)) {
      this._log.semanticErrorUndeclaredSymbol(node.range, name, symbol.fullName(), symbol.range);
      return;
    }

    // Automatically insert "self." before instance symbols
    var resolvedType = symbol.resolvedType;

    if (Skew.in_SymbolKind.isOnInstances(symbol.kind)) {
      var variable = enclosingFunction != null ? enclosingFunction.symbol.$this : null;

      if (variable != null && enclosingFunction.symbol.parent.asObjectSymbol().isSameOrHasBaseClass(symbol.parent)) {
        node.become(new Skew.Node(Skew.NodeKind.DOT).withContent(new Skew.StringContent(name)).appendChild(Skew.Node.createSymbolReference(variable)).withRange(node.range).withInternalRange(node.range));
        resolvedType = this._cache.substitute(resolvedType, variable.resolvedType.environment);
      }

      else {
        this._log.semanticErrorMemberUnexpectedInstance(node.range, symbol.name);
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
        this._log.semanticErrorMemberUnexpectedTypeParameter(node.range, symbol.name);
      }
    }

    node.symbol = symbol;
    node.resolvedType = resolvedType;
    this._automaticallyCallGetter(node, scope);
  };

  Skew.Resolving.Resolver.prototype._resolveNullDot = function(node, scope) {
    node.become(this._sinkNullDotIntoHook(node, scope, null));
    this._resolveAsParameterizedExpression(node, scope);
  };

  Skew.Resolving.Resolver.prototype._resolveParameterize = function(node, scope) {
    var value = node.parameterizeValue();
    this._resolveNode(value, scope, null);

    // Resolve parameter types
    var substitutions = [];
    var count = 0;

    for (var child = value.nextSibling(); child != null; child = child.nextSibling()) {
      this._resolveAsParameterizedType(child, scope);
      substitutions.push(child.resolvedType);
      count = count + 1 | 0;
    }

    var type = value.resolvedType;
    var parameters = type.parameters();

    // If this is an overloaded symbol, try to pick an overload just using the parameter count
    if (parameters == null && type.kind == Skew.TypeKind.SYMBOL && Skew.in_SymbolKind.isOverloadedFunction(type.symbol.kind)) {
      var match = null;

      for (var i = 0, list = type.symbol.asOverloadedFunctionSymbol().symbols, count1 = list.length; i < count1; i = i + 1 | 0) {
        var candidate = in_List.get(list, i);

        if (candidate.parameters != null && candidate.parameters.length == count) {
          if (match != null) {
            match = null;
            break;
          }

          match = candidate;
        }
      }

      if (match != null) {
        type = this._cache.substitute(match.resolvedType, type.environment);
        parameters = type.parameters();
      }
    }

    // Check for type parameters
    if (parameters == null || type.isParameterized()) {
      if (type != Skew.Type.DYNAMIC) {
        this._log.semanticErrorCannotParameterize(node.range, type);
      }

      value.resolvedType = Skew.Type.DYNAMIC;
      return;
    }

    // Check parameter count
    var expected = parameters.length;

    if (count != expected) {
      this._log.semanticErrorParameterCount(node.internalRangeOrRange(), expected, count);
      value.resolvedType = Skew.Type.DYNAMIC;
      return;
    }

    // Make sure all parameters have types
    for (var i1 = 0, list1 = parameters, count2 = list1.length; i1 < count2; i1 = i1 + 1 | 0) {
      var parameter = in_List.get(list1, i1);
      this._initializeSymbol(parameter);
    }

    // Include the symbol for use with Node.isType
    node.resolvedType = this._cache.substitute(type, this._cache.mergeEnvironments(type.environment, this._cache.createEnvironment(parameters, substitutions), null));
    node.symbol = value.symbol;
  };

  Skew.Resolving.Resolver.prototype._resolveSequence = function(node, scope, context) {
    for (var child = node.firstChild(); child != null; child = child.nextSibling()) {
      this._resolveAsParameterizedExpressionWithTypeContext(child, scope, child.nextSibling() == null ? context : null);
    }

    if (node.hasChildren()) {
      node.resolvedType = node.lastChild().resolvedType;
    }
  };

  Skew.Resolving.Resolver.prototype._resolveStringInterpolation = function(node, scope) {
    assert(node.childCount() % 2 == 1);
    this._resolveChildrenAsParameterizedExpressions(node, scope);

    // Convert the string interpolation into a series of string concatenations
    var joined = null;

    while (node.hasChildren()) {
      var child = node.firstChild().remove();

      if (child.isString() && child.asString() == '') {
        continue;
      }

      else if (child.resolvedType != Skew.Type.DYNAMIC && child.resolvedType != this._cache.stringType) {
        child = new Skew.Node(Skew.NodeKind.DOT).withContent(new Skew.StringContent('toString')).appendChild(child).withRange(child.range).withFlags(Skew.NodeFlags.IS_IGNORED_BY_IDE);
        this._resolveAsParameterizedExpressionWithConversion(child, scope, this._cache.stringType);
      }

      joined = joined != null ? Skew.Node.createBinary(Skew.NodeKind.ADD, joined, child).withRange(Skew.Range.span(joined.range, child.range)).withFlags(Skew.NodeFlags.IS_IGNORED_BY_IDE) : child;
      this._resolveAsParameterizedExpressionWithConversion(joined, scope, this._cache.stringType);
    }

    node.become(joined != null ? joined : new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.StringContent('')));
    this._resolveAsParameterizedExpressionWithConversion(node, scope, this._cache.stringType);
  };

  Skew.Resolving.Resolver.prototype._resolveSuper = function(node, scope) {
    var $function = scope.findEnclosingFunction();
    var symbol = $function != null ? $function.symbol : null;
    var baseType = symbol != null ? symbol.parent.asObjectSymbol().baseType : null;
    var overridden = baseType == null ? null : this._findMember(baseType, symbol.name);

    if (overridden == null) {
      this._log.semanticErrorBadSuper(node.range);
      return;
    }

    // Calling a static method doesn't need special handling
    if (overridden.kind == Skew.SymbolKind.FUNCTION_GLOBAL) {
      node.kind = Skew.NodeKind.NAME;
    }

    node.resolvedType = overridden.resolvedType;
    node.symbol = overridden;
    this._automaticallyCallGetter(node, scope);
  };

  Skew.Resolving.Resolver.prototype._resolveTypeCheck = function(node, scope) {
    var value = node.typeCheckValue();
    var type = node.typeCheckType();
    this._resolveAsParameterizedExpression(value, scope);
    this._resolveAsParameterizedType(type, scope);
    this._checkConversion(value, type.resolvedType, Skew.Resolving.ConversionKind.EXPLICIT);
    node.resolvedType = this._cache.boolType;

    // Type checks don't work against interfaces
    if (type.resolvedType.isInterface()) {
      this._log.semanticWarningBadTypeCheck(type.range, type.resolvedType);
    }

    // Warn about unnecessary type checks
    else if (value.resolvedType != Skew.Type.DYNAMIC && this._cache.canImplicitlyConvert(value.resolvedType, type.resolvedType) && (type.resolvedType != Skew.Type.DYNAMIC || type.kind == Skew.NodeKind.TYPE)) {
      this._log.semanticWarningExtraTypeCheck(node.range, value.resolvedType, type.resolvedType);
    }
  };

  Skew.Resolving.Resolver.prototype._resolveXML = function(node, scope) {
    var ref;
    var tag = node.xmlTag();
    var attributes = node.xmlAttributes();
    var children = node.xmlChildren();
    var closingTag = (ref = node.xmlClosingTag()) != null ? ref.remove() : null;
    var initialErrorCount = this._log.errorCount;
    this._resolveAsParameterizedType(tag, scope);

    // Make sure there's a constructor to call
    if (this._findMember(tag.resolvedType, 'new') == null) {
      attributes.removeChildren();
      children.removeChildren();
      attributes.resolvedType = Skew.Type.DYNAMIC;

      // Only report an error if there isn't one already
      if (this._log.errorCount == initialErrorCount) {
        this._log.semanticErrorXMLCannotConstruct(node.range, tag.resolvedType);
      }

      return;
    }

    // Call the constructor
    var value = new Skew.Node(Skew.NodeKind.DOT).withContent(new Skew.StringContent('new')).appendChild(tag.clone()).withRange(node.range).withFlags(Skew.NodeFlags.IS_IGNORED_BY_IDE);
    var needsSequence = attributes.hasChildren() || children.hasChildren();
    var result = value;
    this._resolveAsParameterizedExpression(value, scope);

    if (needsSequence) {
      result = new Skew.Node(Skew.NodeKind.SEQUENCE).withRange(node.range).appendChild(this._extractExpression(value, scope).withFlags(Skew.NodeFlags.IS_IGNORED_BY_IDE));
    }

    // Assign to attributes if necessary
    while (attributes.hasChildren()) {
      var child = attributes.firstChild().remove();
      var name = child.binaryLeft();

      while (name.kind == Skew.NodeKind.DOT) {
        name = name.dotTarget();
      }

      assert(name.kind == Skew.NodeKind.NAME);
      name.replaceWith(new Skew.Node(Skew.NodeKind.DOT).withContent(new Skew.StringContent(name.asString())).appendChild(value.clone()).withRange(name.range));
      result.appendChild(child);
    }

    // Make sure there's an append function to call if needed
    if (children.hasChildren() && this._findMember(tag.resolvedType, '<>...</>') == null) {
      this._log.semanticErrorXMLMissingAppend(children.firstChild().range, tag.resolvedType);
      children.removeChildren();
    }

    // Append children
    else {
      // Don't need a closure if all children are expressions
      var isJustExpressions = true;

      for (var child1 = children.firstChild(); child1 != null; child1 = child1.nextSibling()) {
        if (child1.kind != Skew.NodeKind.EXPRESSION) {
          isJustExpressions = false;
          break;
        }
      }

      // All expression statements get passed as arguments to "<>...</>"
      this._recursivelyReplaceExpressionsInXML(children, value);

      // Add to the sequence
      if (isJustExpressions) {
        for (var child2 = children.firstChild(); child2 != null; child2 = child2.nextSibling()) {
          result.appendChild(child2.expressionValue().remove());
        }
      }

      // Wrap in a closure
      else {
        var symbol = new Skew.FunctionSymbol(Skew.SymbolKind.FUNCTION_LOCAL, '<lambda>');
        symbol.range = children.range;
        symbol.block = children.remove();
        result.appendChild(Skew.Node.createCall(Skew.Node.createLambda(symbol).withRange(symbol.range)).withRange(symbol.range));
      }
    }

    // Resolve the closing tag for IDE tooltips
    if (closingTag != null) {
      this._resolveAsParameterizedType(closingTag, scope);
      value = Skew.Node.createCast(value, closingTag);
    }

    // Resolve the value
    node.become(needsSequence ? result.appendChild(value) : value);
    this._resolveAsParameterizedExpression(node, scope);
  };

  Skew.Resolving.Resolver.prototype._recursivelyReplaceExpressionsInXML = function(node, reference) {
    assert(node.kind == Skew.NodeKind.BLOCK);

    for (var child = node.firstChild(); child != null; child = child.nextSibling()) {
      switch (child.kind) {
        case Skew.NodeKind.EXPRESSION: {
          child.appendChild(Skew.Node.createCall(new Skew.Node(Skew.NodeKind.DOT).withContent(new Skew.StringContent('<>...</>')).appendChild(reference.clone()).withRange(child.range).withFlags(Skew.NodeFlags.IS_IGNORED_BY_IDE)).appendChild(child.expressionValue().remove()).withRange(child.range));
          break;
        }

        case Skew.NodeKind.FOR: {
          this._recursivelyReplaceExpressionsInXML(child.forBlock(), reference);
          break;
        }

        case Skew.NodeKind.FOREACH: {
          this._recursivelyReplaceExpressionsInXML(child.foreachBlock(), reference);
          break;
        }

        case Skew.NodeKind.IF: {
          this._recursivelyReplaceExpressionsInXML(child.ifTrue(), reference);

          if (child.ifFalse() != null) {
            this._recursivelyReplaceExpressionsInXML(child.ifFalse(), reference);
          }
          break;
        }

        case Skew.NodeKind.SWITCH: {
          for (var nested = child.switchValue().nextSibling(); nested != null; nested = nested.nextSibling()) {
            this._recursivelyReplaceExpressionsInXML(nested.caseBlock(), reference);
          }
          break;
        }

        case Skew.NodeKind.TRY: {
          var tryBlock = child.tryBlock();
          var finallyBlock = child.finallyBlock();
          this._recursivelyReplaceExpressionsInXML(tryBlock, reference);

          for (var nested1 = tryBlock.nextSibling(); nested1 != finallyBlock; nested1 = nested1.nextSibling()) {
            this._recursivelyReplaceExpressionsInXML(nested1.catchBlock(), reference);
          }

          if (finallyBlock != null) {
            this._recursivelyReplaceExpressionsInXML(finallyBlock, reference);
          }
          break;
        }

        case Skew.NodeKind.WHILE: {
          this._recursivelyReplaceExpressionsInXML(child.whileBlock(), reference);
          break;
        }
      }
    }
  };

  Skew.Resolving.Resolver.prototype._resolveBinary = function(node, scope, context) {
    var kind = node.kind;
    var left = node.binaryLeft();
    var right = node.binaryRight();

    // Special-case the "??" operator
    if (kind == Skew.NodeKind.NULL_JOIN) {
      this._resolveAsParameterizedExpressionWithTypeContext(left, scope, context);
      var test = Skew.Node.createBinary(Skew.NodeKind.NOT_EQUAL, this._extractExpressionForAssignment(left, scope), new Skew.Node(Skew.NodeKind.NULL)).withRange(left.range);
      node.become(Skew.Node.createHook(test, left.remove(), right.remove()).withRange(node.range).withFlags(Skew.NodeFlags.WAS_NULL_JOIN));
      this._resolveAsParameterizedExpressionWithTypeContext(node, scope, context);
      return;
    }

    // Special-case the "?=" operator
    if (kind == Skew.NodeKind.ASSIGN_NULL) {
      this._resolveAsParameterizedExpressionWithTypeContext(left, scope, context);
      this._checkStorage(left, scope);
      var test1 = Skew.Node.createBinary(Skew.NodeKind.NOT_EQUAL, this._extractExpressionForAssignment(left, scope), new Skew.Node(Skew.NodeKind.NULL)).withRange(left.range);
      var assign = Skew.Node.createBinary(Skew.NodeKind.ASSIGN, left.remove(), right.remove()).withRange(node.range).withFlags(Skew.NodeFlags.WAS_ASSIGN_NULL);
      node.become(Skew.Node.createHook(test1, left.clone(), assign).withRange(node.range));
      this._resolveAsParameterizedExpressionWithTypeContext(node, scope, context);
      return;
    }

    // Special-case the equality operators
    if (kind == Skew.NodeKind.EQUAL || kind == Skew.NodeKind.NOT_EQUAL) {
      if (Skew.Resolving.Resolver._needsTypeContext(left)) {
        this._resolveAsParameterizedExpression(right, scope);
        this._resolveAsParameterizedExpressionWithTypeContext(left, scope, right.resolvedType);
      }

      else if (Skew.Resolving.Resolver._needsTypeContext(right)) {
        this._resolveAsParameterizedExpression(left, scope);
        this._resolveAsParameterizedExpressionWithTypeContext(right, scope, left.resolvedType);
      }

      else {
        this._resolveAsParameterizedExpression(left, scope);
        this._resolveAsParameterizedExpression(right, scope);
      }

      // Check for likely bugs "x == x" or "x != x", except when this is used to test for NaN
      if (left.looksTheSameAs(right) && left.hasNoSideEffects() && right.hasNoSideEffects() && !this._cache.isEquivalentToDouble(left.resolvedType) && left.resolvedType != Skew.Type.DYNAMIC) {
        this._log.semanticWarningIdenticalOperands(node.range, kind == Skew.NodeKind.EQUAL ? '==' : '!=');
      }

      // The two types must be compatible
      var commonType = this._cache.commonImplicitType(left.resolvedType, right.resolvedType);

      if (commonType == null) {
        this._log.semanticErrorNoCommonType(node.range, left.resolvedType, right.resolvedType);
      }

      else {
        node.resolvedType = this._cache.boolType;

        // Make sure type casts are inserted
        this._checkConversion(left, commonType, Skew.Resolving.ConversionKind.IMPLICIT);
        this._checkConversion(right, commonType, Skew.Resolving.ConversionKind.IMPLICIT);
      }

      return;
    }

    // Special-case assignment since it's not overridable
    if (kind == Skew.NodeKind.ASSIGN) {
      this._resolveAsParameterizedExpression(left, scope);

      // Automatically call setters
      if (left.symbol != null && left.symbol.isSetter()) {
        node.become(Skew.Node.createCall(left.remove()).withRange(node.range).withInternalRange(right.range).appendChild(right.remove()));
        this._resolveAsParameterizedExpression(node, scope);
      }

      // Resolve the right side using type context from the left side
      else {
        this._resolveAsParameterizedExpressionWithConversion(right, scope, left.resolvedType);
        node.resolvedType = left.resolvedType;
        this._checkStorage(left, scope);

        // Check for likely bugs "x = x"
        if (left.looksTheSameAs(right) && left.hasNoSideEffects() && right.hasNoSideEffects()) {
          this._log.semanticWarningIdenticalOperands(node.range, node.wasAssignNull() ? '?=' : '=');
        }
      }

      return;
    }

    // Special-case short-circuit logical operators since they aren't overridable
    if (kind == Skew.NodeKind.LOGICAL_AND || kind == Skew.NodeKind.LOGICAL_OR) {
      this._resolveAsParameterizedExpressionWithConversion(left, scope, this._cache.boolType);
      this._resolveAsParameterizedExpressionWithConversion(right, scope, this._cache.boolType);
      node.resolvedType = this._cache.boolType;

      // Check for likely bugs "x && x" or "x || x"
      if (left.looksTheSameAs(right) && left.hasNoSideEffects() && right.hasNoSideEffects() && (!left.isBool() || !right.isBool())) {
        this._log.semanticWarningIdenticalOperands(node.range, kind == Skew.NodeKind.LOGICAL_AND ? '&&' : '||');
      }

      return;
    }

    this._resolveOperatorOverload(node, scope, context);
  };

  Skew.Resolving.Resolver.prototype._generateReference = function(scope, type) {
    var enclosingFunction = scope.findEnclosingFunctionOrLambda();
    var symbol = null;

    // Add a local variable
    if (enclosingFunction != null) {
      var block = enclosingFunction.symbol.block;

      // Make sure the call to "super" is still the first statement
      var after = block.firstChild();

      if (after.isSuperCallStatement()) {
        after = after.nextSibling();
      }

      // Add the new variable to the top of the function
      symbol = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_LOCAL, enclosingFunction.generateName('ref'));
      block.insertChildBefore(after, new Skew.Node(Skew.NodeKind.VARIABLES).appendChild(Skew.Node.createVariable(symbol)));
    }

    // Otherwise, add a global variable
    else {
      symbol = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_GLOBAL, this._global.scope.generateName('ref'));
      symbol.parent = this._global;
      this._generatedGlobalVariables.push(symbol);
    }

    // Force-initialize the symbol
    symbol.initializeWithType(type);
    return Skew.Node.createSymbolReference(symbol);
  };

  Skew.Resolving.Resolver.prototype._extractExpression = function(node, scope) {
    assert(node.resolvedType != null);

    if (node.kind == Skew.NodeKind.NAME || node.kind == Skew.NodeKind.CONSTANT) {
      return node.clone();
    }

    // Replace the original expression with a reference
    var reference = this._generateReference(scope, node.resolvedType).withRange(node.range).withFlags(Skew.NodeFlags.IS_IGNORED_BY_IDE);
    var setup = node.cloneAndStealChildren();
    node.become(reference);
    return Skew.Node.createBinary(Skew.NodeKind.ASSIGN, reference, setup).withType(node.resolvedType).withRange(node.range);
  };

  // Expressions with side effects must be stored to temporary variables
  // if they need to be duplicated in an expression. This does the variable
  // allocation and storage and returns a partial assigment.
  //
  // Examples:
  //
  //    "a" stays "a" and returns "a"
  //    "a.b" stays "a.b" and returns "a.b"
  //    "a[0]" stays "a[0]" and returns "a[0]"
  //    "a().b" becomes "ref.b" and returns "(ref = a()).b"
  //    "a()[0]" becomes "ref[0]" and returns "(ref = a())[0]"
  //    "a()[b()]" becomes "ref[ref2]" and returns "(ref = a())[ref2 = b()]"
  //
  Skew.Resolving.Resolver.prototype._extractExpressionForAssignment = function(node, scope) {
    assert(node.resolvedType != null);

    // Handle dot expressions
    if (node.kind == Skew.NodeKind.DOT && node.symbol != null) {
      return new Skew.Node(Skew.NodeKind.DOT).withContent(new Skew.StringContent(node.asString())).appendChild(this._extractExpression(node.dotTarget(), scope)).withSymbol(node.symbol).withType(node.resolvedType).withRange(node.range).withInternalRange(node.internalRange);
    }

    // Handle index expressions
    if (node.kind == Skew.NodeKind.INDEX) {
      return Skew.Node.createIndex(this._extractExpression(node.indexLeft(), scope), this._extractExpression(node.indexRight(), scope)).withRange(node.range);
    }

    // Handle name expressions
    if (node.kind == Skew.NodeKind.NAME) {
      return node.clone();
    }

    // Handle everything else
    return this._extractExpression(node, scope);
  };

  Skew.Resolving.Resolver.prototype._resolveOperatorOverload = function(node, scope, context) {
    // The order of operands are reversed for the "in" operator
    var kind = node.kind;
    var reverseBinaryOrder = kind == Skew.NodeKind.IN;
    var first = node.firstChild();
    var second = first.nextSibling();
    var target = reverseBinaryOrder ? second : first;
    var other = Skew.in_NodeKind.isBinary(kind) ? reverseBinaryOrder ? first : second : null;
    var isBitOperation = Skew.in_NodeKind.isBitOperation(kind);
    var bitContext = isBitOperation && context != null && context.isFlags() ? context : null;

    // Allow "foo in [.FOO, .BAR]"
    if (kind == Skew.NodeKind.IN && target.kind == Skew.NodeKind.INITIALIZER_LIST && !Skew.Resolving.Resolver._needsTypeContext(other)) {
      this._resolveAsParameterizedExpression(other, scope);
      this._resolveAsParameterizedExpressionWithTypeContext(target, scope, other.resolvedType != Skew.Type.DYNAMIC ? this._cache.createListType(other.resolvedType) : null);
    }

    // Resolve just the target since the other arguments may need type context from overload resolution
    else {
      this._resolveAsParameterizedExpressionWithTypeContext(target, scope, bitContext);
    }

    // Warn about shifting by 0 in the original source code, since that doesn't
    // do anything when the arguments are integers and so is likely a mistake
    if (Skew.in_NodeKind.isShift(kind) && this._cache.isEquivalentToInt(target.resolvedType) && other.isInt() && other.asInt() == 0) {
      this._log.semanticWarningShiftByZero(node.range);
    }

    // Can't do overload resolution on the dynamic type
    var type = target.resolvedType;

    if (type == Skew.Type.DYNAMIC) {
      if (Skew.in_NodeKind.isAssign(kind) && kind != Skew.NodeKind.ASSIGN_INDEX) {
        this._checkStorage(target, scope);
      }

      this._resolveChildrenAsParameterizedExpressions(node, scope);
      return;
    }

    // Check if the operator can be overridden at all
    var info = in_IntMap.get1(Skew.operatorInfo, kind);

    if (info.kind != Skew.OperatorKind.OVERRIDABLE) {
      this._log.semanticErrorUnknownMemberSymbol(node.internalRangeOrRange(), info.text, type, null, null);
      this._resolveChildrenAsParameterizedExpressions(node, scope);
      return;
    }

    // Numeric conversions
    var enumFlagsType = null;

    // Binary operations
    if (other != null) {
      // Assignment operations aren't symmetric
      if (!Skew.in_NodeKind.isBinaryAssign(kind)) {
        if (type == this._cache.intType) {
          this._resolveAsParameterizedExpression(other, scope);

          // Auto-convert doubles to ints
          if (other.resolvedType == this._cache.doubleType) {
            this._checkConversion(target, this._cache.doubleType, Skew.Resolving.ConversionKind.IMPLICIT);
            type = this._cache.doubleType;
          }
        }

        // Check if the target is an enum
        else if (type.isEnumOrFlags()) {
          this._resolveAsParameterizedExpressionWithTypeContext(other, scope, bitContext != null ? bitContext : (isBitOperation || kind == Skew.NodeKind.IN) && type.isFlags() ? type : null);

          // Auto-convert enums to ints when both operands can be converted
          if (this._cache.isNumeric(other.resolvedType)) {
            type = this._cache.commonImplicitType(type, other.resolvedType);
            assert(type != null);

            if (type.isEnumOrFlags()) {
              if (type.isFlags()) {
                enumFlagsType = type;
              }

              type = this._cache.intType;
            }

            this._checkConversion(target, type, Skew.Resolving.ConversionKind.IMPLICIT);
            this._checkConversion(other, type, Skew.Resolving.ConversionKind.IMPLICIT);
          }
        }
      }

      // Allow certain operations on "flags" types
      else if (isBitOperation && type.isFlags()) {
        this._resolveAsParameterizedExpressionWithTypeContext(other, scope, type);
        enumFlagsType = type;
        type = this._cache.intType;
        this._checkConversion(other, type, Skew.Resolving.ConversionKind.IMPLICIT);
      }
    }

    // Allow "~x" on "flags" types
    else if (kind == Skew.NodeKind.COMPLEMENT && type.isEnumOrFlags()) {
      if (type.isFlags()) {
        enumFlagsType = type;
      }

      type = this._cache.intType;
      this._checkConversion(target, type, Skew.Resolving.ConversionKind.IMPLICIT);
    }

    // Find the operator method
    var isComparison = Skew.in_NodeKind.isBinaryComparison(kind);
    var name = isComparison ? '<=>' : info.text;
    var symbol = this._findMember(type, name);
    var extracted = null;
    var wasUnaryPostfix = false;

    // Convert operators like "+=" to a "+" inside a "="
    if (symbol == null && info.assignKind != Skew.NodeKind.NULL) {
      symbol = this._findMember(type, in_IntMap.get1(Skew.operatorInfo, info.assignKind).text);

      if (symbol != null) {
        extracted = this._extractExpressionForAssignment(target, scope);

        if (kind == Skew.NodeKind.PREFIX_INCREMENT || kind == Skew.NodeKind.PREFIX_DECREMENT || kind == Skew.NodeKind.POSTFIX_INCREMENT || kind == Skew.NodeKind.POSTFIX_DECREMENT) {
          node.appendChild(this._cache.createInt(1).withRange(node.internalRangeOrRange()));
        }

        wasUnaryPostfix = Skew.in_NodeKind.isUnaryPostfix(kind) && Skew.Resolving.Resolver._isExpressionUsed(node);
        kind = info.assignKind;
        node.kind = kind;
      }
    }

    // Special-case the "in" operator on "flags" types
    if (symbol == null && kind == Skew.NodeKind.IN && enumFlagsType != null) {
      node.become(Skew.Node.createBinary(Skew.NodeKind.NOT_EQUAL, Skew.Node.createBinary(Skew.NodeKind.BITWISE_AND, other.remove(), target.remove()).withRange(node.range), this._cache.createInt(0)).withRange(node.range));
      this._resolveAsParameterizedExpression(node, scope);
      return;
    }

    // Fail if the operator wasn't found
    if (symbol == null) {
      this._log.semanticErrorUnknownMemberSymbol(node.internalRangeOrRange(), name, type, null, null);
      this._resolveChildrenAsParameterizedExpressions(node, scope);
      return;
    }

    var symbolType = this._cache.substitute(symbol.resolvedType, type.environment);

    // Resolve the overload now so the symbol's properties can be inspected
    if (Skew.in_SymbolKind.isOverloadedFunction(symbol.kind)) {
      if (reverseBinaryOrder) {
        first.swapWith(second);
      }

      symbolType = this._resolveOverloadedFunction(node.internalRangeOrRange(), node, scope, symbolType);

      if (reverseBinaryOrder) {
        first.swapWith(second);
      }

      if (symbolType == null) {
        this._resolveChildrenAsParameterizedExpressions(node, scope);
        return;
      }

      symbol = symbolType.symbol;
    }

    var isRawImport = symbol.isImported() && !symbol.isRenamed();
    node.symbol = symbol;
    this._checkAccess(node, node.internalRangeOrRange(), scope);

    // Check for a valid storage location for imported operators
    if (Skew.in_NodeKind.isAssign(kind) && kind != Skew.NodeKind.ASSIGN_INDEX && symbol.isImported() && extracted == null) {
      this._checkStorage(target, scope);
    }

    // "<", ">", "<=", or ">="
    if (isComparison && (isRawImport || type == this._cache.intType || type == this._cache.doubleType)) {
      this._resolveChildrenAsParameterizedExpressions(node, scope);
      node.resolvedType = this._cache.boolType;
      node.symbol = null;
    }

    // Don't replace the operator with a call if it's just used for type checking
    else if (isRawImport) {
      if (reverseBinaryOrder) {
        first.swapWith(second);
      }

      if (!this._resolveFunctionCall(node, scope, symbolType)) {
        this._resolveChildrenAsParameterizedExpressions(node, scope);
      }

      if (reverseBinaryOrder) {
        first.swapWith(second);
      }

      // Handle "flags" types
      if (isBitOperation && enumFlagsType != null) {
        node.resolvedType = enumFlagsType;
      }
    }

    else {
      // Resolve the method call
      if (reverseBinaryOrder) {
        first.swapWith(second);
      }

      node.prependChild(Skew.Node.createMemberReference(target.remove(), symbol).withRange(node.internalRangeOrRange()));

      // Implement the logic for the "<=>" operator
      if (isComparison) {
        var call = new Skew.Node(Skew.NodeKind.CALL).appendChildrenFrom(node).withRange(node.range);
        node.appendChild(call);
        node.appendChild(this._cache.createInt(0));
        node.resolvedType = this._cache.boolType;
        this._resolveFunctionCall(call, scope, symbolType);
      }

      // All other operators are just normal method calls
      else {
        node.kind = Skew.NodeKind.CALL;
        this._resolveFunctionCall(node, scope, symbolType);
      }
    }

    if (extracted != null) {
      // The expression used to initialize the assignment must return a value
      if (symbolType.returnType == null) {
        this._log.semanticErrorUseOfVoidFunction(node.range, symbol.name, symbol.range);
      }

      // Wrap everything in an assignment if the assignment target was extracted
      this._promoteToAssignment(node, extracted);
      this._resolveAsParameterizedExpression(node, scope);

      // Handle custom unary postfix operators
      if (wasUnaryPostfix) {
        node.become(Skew.Node.createBinary(kind, node.cloneAndStealChildren(), this._cache.createInt(-1).withRange(node.internalRangeOrRange())).withRange(node.range));
        this._resolveAsParameterizedExpression(node, scope);
      }
    }

    // Handle custom unary assignment operators
    else if (Skew.in_NodeKind.isUnaryAssign(kind) && !isRawImport) {
      // "foo(x++)" => "foo((ref = x, x = ref.increment(), ref))"
      if (Skew.in_NodeKind.isUnaryPostfix(kind) && Skew.Resolving.Resolver._isExpressionUsed(node)) {
        var reference = this._generateReference(scope, target.resolvedType).withRange(target.range);
        var original = this._extractExpressionForAssignment(target, scope);
        target.replaceWith(reference);
        this._promoteToAssignment(node, target);
        node.become(new Skew.Node(Skew.NodeKind.SEQUENCE).appendChild(Skew.Node.createBinary(Skew.NodeKind.ASSIGN, reference.clone(), original).withRange(node.range)).appendChild(node.cloneAndStealChildren()).appendChild(reference.clone()).withRange(node.range));
        this._resolveAsParameterizedExpression(node, scope);
      }

      // "foo(++x)" => "foo(x = x.increment())"
      else {
        this._promoteToAssignment(node, this._extractExpressionForAssignment(target, scope));
        this._resolveAsParameterizedExpression(node, scope);
      }
    }
  };

  Skew.Resolving.Resolver.prototype._promoteToAssignment = function(node, extracted) {
    assert(extracted.parent() == null);

    if (extracted.kind == Skew.NodeKind.INDEX) {
      extracted.kind = Skew.NodeKind.ASSIGN_INDEX;
      extracted.appendChild(node.cloneAndStealChildren());
      node.become(extracted);
    }

    else {
      node.become(Skew.Node.createBinary(Skew.NodeKind.ASSIGN, extracted, node.cloneAndStealChildren()).withRange(node.range));
    }
  };

  Skew.Resolving.Resolver.prototype._automaticallyCallGetter = function(node, scope) {
    var symbol = node.symbol;

    if (symbol == null) {
      return false;
    }

    var kind = symbol.kind;
    var parent = node.parent();

    // Never call a getter if type parameters are present
    if (parent != null && parent.kind == Skew.NodeKind.PARAMETERIZE && Skew.Resolving.Resolver._isCallValue(parent)) {
      return false;
    }

    // The check for getters is complicated by overloaded functions
    if (!symbol.isGetter() && Skew.in_SymbolKind.isOverloadedFunction(kind) && (!Skew.Resolving.Resolver._isCallValue(node) || parent.hasOneChild())) {
      var overloaded = symbol.asOverloadedFunctionSymbol();

      for (var i = 0, list = overloaded.symbols, count1 = list.length; i < count1; i = i + 1 | 0) {
        var getter = in_List.get(list, i);

        // Just return the first getter assuming errors for duplicate getters
        // were already logged when the overloaded symbol was initialized
        if (getter.isGetter()) {
          node.resolvedType = this._cache.substitute(getter.resolvedType, node.resolvedType.environment);
          node.symbol = getter;
          symbol = getter;
          break;
        }
      }
    }

    this._checkAccess(node, node.internalRangeOrRange(), scope);

    // Automatically wrap the getter in a call expression
    if (symbol.isGetter()) {
      node.become(Skew.Node.createCall(node.cloneAndStealChildren()).withRange(node.range));
      this._resolveAsParameterizedExpression(node, scope);
      return true;
    }

    // Forbid bare function references
    if (!symbol.isSetter() && node.resolvedType != Skew.Type.DYNAMIC && Skew.in_SymbolKind.isFunctionOrOverloadedFunction(kind) && kind != Skew.SymbolKind.FUNCTION_ANNOTATION && !Skew.Resolving.Resolver._isCallValue(node) && (parent == null || parent.kind != Skew.NodeKind.PARAMETERIZE || !Skew.Resolving.Resolver._isCallValue(parent))) {
      var lower = 2147483647;
      var upper = -1;

      if (Skew.in_SymbolKind.isFunction(kind)) {
        lower = upper = symbol.asFunctionSymbol().$arguments.length;
      }

      else {
        for (var i1 = 0, list1 = symbol.asOverloadedFunctionSymbol().symbols, count2 = list1.length; i1 < count2; i1 = i1 + 1 | 0) {
          var $function = in_List.get(list1, i1);
          var count = $function.$arguments.length;

          if (count < lower) {
            lower = count;
          }

          if (count > upper) {
            upper = count;
          }
        }
      }

      this._log.semanticErrorMustCallFunction(node.internalRangeOrRange(), symbol.name, lower, upper);
      node.resolvedType = Skew.Type.DYNAMIC;
    }

    return false;
  };

  Skew.Resolving.Resolver.prototype._convertSwitchToIfChain = function(node, scope) {
    var variable = new Skew.VariableSymbol(Skew.SymbolKind.VARIABLE_LOCAL, scope.generateName('value'));
    var value = node.switchValue().remove();
    var block = null;

    // Stash the variable being switched over so it's only evaluated once
    variable.initializeWithType(value.resolvedType);
    variable.value = value;
    node.parent().insertChildBefore(node, new Skew.Node(Skew.NodeKind.VARIABLES).appendChild(Skew.Node.createVariable(variable)));

    // Build the chain in reverse starting with the last case
    for (var child = node.lastChild(); child != null; child = child.previousSibling()) {
      var caseBlock = child.caseBlock().remove();
      var test = null;

      // Combine adjacent cases in a "||" chain
      while (child.hasChildren()) {
        var caseValue = Skew.Node.createBinary(Skew.NodeKind.EQUAL, Skew.Node.createSymbolReference(variable), child.firstChild().remove()).withType(this._cache.boolType);
        test = test != null ? Skew.Node.createBinary(Skew.NodeKind.LOGICAL_OR, test, caseValue).withType(this._cache.boolType) : caseValue;
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

  Skew.Resolving.Resolver._shouldCheckForSetter = function(node) {
    return node.parent() != null && node.parent().kind == Skew.NodeKind.ASSIGN && node == node.parent().binaryLeft();
  };

  Skew.Resolving.Resolver._isExpressionUsed = function(node) {
    // Check for a null parent to handle variable initializers
    var parent = node.parent();
    return parent == null || parent.kind != Skew.NodeKind.EXPRESSION && !parent.isImplicitReturn() && (parent.kind != Skew.NodeKind.ANNOTATION || node != parent.annotationValue()) && (parent.kind != Skew.NodeKind.FOR || node != parent.forUpdate()) && parent.kind != Skew.NodeKind.SEQUENCE;
  };

  Skew.Resolving.Resolver._isValidVariableType = function(type) {
    return type != Skew.Type.NULL && (type.kind != Skew.TypeKind.SYMBOL || !Skew.in_SymbolKind.isFunctionOrOverloadedFunction(type.symbol.kind));
  };

  Skew.Resolving.Resolver._isBaseGlobalReference = function(parent, member) {
    return parent != null && parent.kind == Skew.SymbolKind.OBJECT_CLASS && Skew.in_SymbolKind.isGlobalReference(member.kind) && member.parent != parent && member.parent.kind == Skew.SymbolKind.OBJECT_CLASS && parent.asObjectSymbol().hasBaseClass(member.parent);
  };

  Skew.Resolving.Resolver._isCallValue = function(node) {
    var parent = node.parent();
    return parent != null && parent.kind == Skew.NodeKind.CALL && node == parent.callValue();
  };

  Skew.Resolving.Resolver._isCallReturningVoid = function(node) {
    return node.kind == Skew.NodeKind.CALL && (node.symbol != null && node.symbol.resolvedType.returnType == null || node.callValue().resolvedType.kind == Skew.TypeKind.LAMBDA && node.callValue().resolvedType.returnType == null);
  };

  Skew.Resolving.Resolver._needsTypeContext = function(node) {
    return node.kind == Skew.NodeKind.DOT && node.dotTarget() == null || node.kind == Skew.NodeKind.HOOK && Skew.Resolving.Resolver._needsTypeContext(node.hookTrue()) && Skew.Resolving.Resolver._needsTypeContext(node.hookFalse()) || Skew.in_NodeKind.isInitializer(node.kind);
  };

  Skew.Resolving.Resolver.GuardMergingFailure = function() {
  };

  Skew.ScopeKind = {
    FUNCTION: 0,
    LOCAL: 1,
    OBJECT: 2,
    VARIABLE: 3
  };

  Skew.ScopeSearch = {
    NORMAL: 0,
    ALSO_CHECK_FOR_SETTER: 1
  };

  Skew.FuzzyScopeSearch = {
    SELF_ONLY: 0,
    SELF_AND_PARENTS: 1
  };

  Skew.Scope = function(parent) {
    this.parent = parent;
    this.used = null;
    this._enclosingFunctionOrLambda = null;
    this._enclosingFunction = null;
    this._enclosingLoop = null;
  };

  Skew.Scope.prototype._find = function(name) {
    return null;
  };

  Skew.Scope.prototype._findWithFuzzyMatching = function(matcher) {
  };

  // Need to check for a setter at the same time as for a normal symbol
  // because the one in the closer scope must be picked. If both are in
  // the same scope, pick the setter.
  Skew.Scope.prototype.find = function(name, search) {
    var symbol = null;
    var setterName = search == Skew.ScopeSearch.ALSO_CHECK_FOR_SETTER ? name + '=' : null;

    for (var scope = this; scope != null && symbol == null; scope = scope.parent) {
      if (setterName != null) {
        symbol = scope._find(setterName);
      }

      if (symbol == null) {
        symbol = scope._find(name);
      }
    }

    return symbol;
  };

  Skew.Scope.prototype.findWithFuzzyMatching = function(name, kind, search) {
    var matcher = new Skew.FuzzySymbolMatcher(name, kind);

    for (var scope = this; scope != null; scope = scope.parent) {
      scope._findWithFuzzyMatching(matcher);

      if (search == Skew.FuzzyScopeSearch.SELF_ONLY) {
        break;
      }
    }

    return matcher.bestSoFar();
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
    if (this._enclosingFunctionOrLambda != null) {
      return this._enclosingFunctionOrLambda;
    }

    var scope = this;

    while (scope != null) {
      if (scope.kind() == Skew.ScopeKind.FUNCTION) {
        this._enclosingFunctionOrLambda = scope.asFunctionScope();
        return this._enclosingFunctionOrLambda;
      }

      scope = scope.parent;
    }

    return null;
  };

  Skew.Scope.prototype.findEnclosingFunction = function() {
    if (this._enclosingFunction != null) {
      return this._enclosingFunction;
    }

    var scope = this.findEnclosingFunctionOrLambda();

    while (scope != null) {
      if (scope.kind() == Skew.ScopeKind.FUNCTION && scope.asFunctionScope().symbol.kind != Skew.SymbolKind.FUNCTION_LOCAL) {
        this._enclosingFunction = scope.asFunctionScope();
        return this._enclosingFunction;
      }

      scope = scope.parent;
    }

    return null;
  };

  Skew.Scope.prototype.findEnclosingLoop = function() {
    if (this._enclosingLoop != null) {
      return this._enclosingLoop;
    }

    var scope = this;

    while (scope != null && scope.kind() == Skew.ScopeKind.LOCAL) {
      if (scope.asLocalScope().type == Skew.LocalType.LOOP) {
        this._enclosingLoop = scope.asLocalScope();
        return this._enclosingLoop;
      }

      scope = scope.parent;
    }

    return null;
  };

  Skew.Scope.prototype.generateName = function(prefix) {
    var count = 0;
    var name = prefix;

    while (this.isNameUsed(name)) {
      name = prefix + (count = count + 1 | 0).toString();
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
    if (this.find(name, Skew.ScopeSearch.NORMAL) != null) {
      return true;
    }

    for (var scope = this; scope != null; scope = scope.parent) {
      if (scope.used != null && name in scope.used) {
        return true;
      }
    }

    return false;
  };

  Skew.ObjectScope = function(parent, symbol) {
    Skew.Scope.call(this, parent);
    this.symbol = symbol;
  };

  __extends(Skew.ObjectScope, Skew.Scope);

  Skew.ObjectScope.prototype.kind = function() {
    return Skew.ScopeKind.OBJECT;
  };

  Skew.ObjectScope.prototype._find = function(name) {
    return in_StringMap.get(this.symbol.members, name, null);
  };

  Skew.ObjectScope.prototype._findWithFuzzyMatching = function(matcher) {
    in_StringMap.each(this.symbol.members, function(name, member) {
      matcher.include(member);
    });
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

  Skew.FunctionScope.prototype._find = function(name) {
    return in_StringMap.get(this.parameters, name, null);
  };

  Skew.FunctionScope.prototype._findWithFuzzyMatching = function(matcher) {
    in_StringMap.each(this.parameters, function(name, parameter) {
      matcher.include(parameter);
    });
  };

  Skew.VariableScope = function(parent, symbol) {
    Skew.Scope.call(this, parent);
    this.symbol = symbol;
  };

  __extends(Skew.VariableScope, Skew.Scope);

  Skew.VariableScope.prototype.kind = function() {
    return Skew.ScopeKind.VARIABLE;
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

  Skew.LocalScope.prototype._find = function(name) {
    return in_StringMap.get(this.locals, name, null);
  };

  Skew.LocalScope.prototype._findWithFuzzyMatching = function(matcher) {
    in_StringMap.each(this.locals, function(name, local) {
      matcher.include(local);
    });
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
    this._allSymbols = {};
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
      var symbol = in_List.takeLast(stack);

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
            for (var i = 0, list = symbolOverrides, count = list.length; i < count; i = i + 1 | 0) {
              var override = in_List.get(list, i);
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
      var values = in_IntMap.values(this._currentUsages);

      // Sort so the order is deterministic
      values.sort(Skew.Symbol.SORT_BY_ID);
      this._usages[this.context.id] = values;
    }

    this._currentUsages = {};

    if (symbol != null) {
      this._includeSymbol(symbol);
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
    this._includeSymbol(symbol);

    if (!Skew.in_SymbolKind.isLocal(symbol.kind)) {
      this._currentUsages[symbol.id] = symbol;
    }
  };

  Skew.UsageGraph.prototype._visitObject = function(symbol) {
    for (var i3 = 0, list3 = symbol.objects, count3 = list3.length; i3 < count3; i3 = i3 + 1 | 0) {
      var object = in_List.get(list3, i3);
      this._changeContext(object);
      this._recordUsage(symbol);

      // Always pull the base class in
      if (object.baseClass != null) {
        this._recordUsage(object.baseClass);
      }

      // Only pull interfaces in for typed targets (interfaces disappear entirely for untyped targets)
      if (this._mode != Skew.ShakingMode.IGNORE_TYPES && object.interfaceTypes != null) {
        for (var i = 0, list = object.interfaceTypes, count = list.length; i < count; i = i + 1 | 0) {
          var type = in_List.get(list, i);

          if (type.symbol != null) {
            this._recordUsage(type.symbol);
          }
        }
      }

      // If an imported type is used, automatically assume all functions and
      // variables for that type are used too
      if (object.isImported()) {
        for (var i1 = 0, list1 = object.functions, count1 = list1.length; i1 < count1; i1 = i1 + 1 | 0) {
          var $function = in_List.get(list1, i1);
          this._recordUsage($function);
        }

        for (var i2 = 0, list2 = object.functions, count2 = list2.length; i2 < count2; i2 = i2 + 1 | 0) {
          var variable = in_List.get(list2, i2);
          this._recordUsage(variable);
        }
      }

      this._visitObject(object);
    }

    for (var i4 = 0, list4 = symbol.functions, count4 = list4.length; i4 < count4; i4 = i4 + 1 | 0) {
      var function1 = in_List.get(list4, i4);
      this._changeContext(function1);

      // Instance functions shouldn't cause their instance type to be emitted for dynamically-typed targets
      if (this._mode != Skew.ShakingMode.IGNORE_TYPES || function1.kind != Skew.SymbolKind.FUNCTION_INSTANCE) {
        this._recordUsage(symbol);
      }

      this._visitFunction(function1);
    }

    for (var i5 = 0, list5 = symbol.variables, count5 = list5.length; i5 < count5; i5 = i5 + 1 | 0) {
      var variable1 = in_List.get(list5, i5);
      this._changeContext(variable1);

      // Instance variables shouldn't require the class to be present because
      // accessing an instance variable already requires a constructed instance
      if (variable1.kind != Skew.SymbolKind.VARIABLE_INSTANCE) {
        this._recordUsage(symbol);
      }

      this._visitVariable(variable1);
    }
  };

  Skew.UsageGraph.prototype._visitFunction = function(symbol) {
    for (var i = 0, list = symbol.$arguments, count = list.length; i < count; i = i + 1 | 0) {
      var argument = in_List.get(list, i);
      this._visitVariable(argument);
    }

    this._visitType(symbol.resolvedType.returnType);
    this._visitNode(symbol.block);

    // Remember which functions are overridden for later
    if (symbol.overridden != null) {
      this._recordOverride(symbol.overridden, symbol);
    }

    // Remember which functions are overridden for later
    if (symbol.implementations != null) {
      for (var i1 = 0, list1 = symbol.implementations, count1 = list1.length; i1 < count1; i1 = i1 + 1 | 0) {
        var $function = in_List.get(list1, i1);
        this._recordOverride(symbol, $function);
        this._recordOverride($function, symbol);
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

        for (var i = 0, list = $function.$arguments, count = list.length; i < count; i = i + 1 | 0) {
          var argument = in_List.get(list, i);
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
        for (var i = 0, list = type.substitutions, count = list.length; i < count; i = i + 1 | 0) {
          var substitution = in_List.get(list, i);
          this._visitType(substitution);
        }
      }
    }
  };

  Skew.UsageGraph.prototype._includeSymbol = function(symbol) {
    this._allSymbols[symbol.id] = symbol;
  };

  Skew.Shaking = {};

  Skew.Shaking.collectExportedSymbols = function(symbol, symbols, entryPoint) {
    for (var i = 0, list = symbol.objects, count = list.length; i < count; i = i + 1 | 0) {
      var object = in_List.get(list, i);
      Skew.Shaking.collectExportedSymbols(object, symbols, entryPoint);

      if (object.isExported()) {
        symbols.push(object);
      }
    }

    for (var i1 = 0, list1 = symbol.functions, count1 = list1.length; i1 < count1; i1 = i1 + 1 | 0) {
      var $function = in_List.get(list1, i1);

      if ($function.isExported() || $function == entryPoint) {
        symbols.push($function);
      }
    }

    for (var i2 = 0, list2 = symbol.variables, count2 = list2.length; i2 < count2; i2 = i2 + 1 | 0) {
      var variable = in_List.get(list2, i2);

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

    for (var i = 0, list = symbol.objects, count = list.length; i < count; i = i + 1 | 0) {
      var object = in_List.get(list, i);
      Skew.Shaking.removeUnusedSymbols(object, usages);
    }
  };

  Skew.TypeKind = {
    LAMBDA: 0,
    SPECIAL: 1,
    SYMBOL: 2
  };

  Skew.Type = function(kind, symbol) {
    this.id = Skew.Type._nextID = Skew.Type._nextID + 1 | 0;
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

  Skew.Type.prototype.isEnumOrFlags = function() {
    return this.symbol != null && Skew.in_SymbolKind.isEnumOrFlags(this.symbol.kind);
  };

  Skew.Type.prototype.isFlags = function() {
    return this.symbol != null && this.symbol.kind == Skew.SymbolKind.OBJECT_FLAGS;
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

        for (var i = 0, count = this.substitutions.length; i < count; i = i + 1 | 0) {
          if (i != 0) {
            name += ', ';
          }

          name += in_List.get(this.substitutions, i).toString();
        }

        return name + '>';
      }

      return this.symbol.fullName();
    }

    if (this.kind == Skew.TypeKind.LAMBDA) {
      var result = 'fn(';

      for (var i1 = 0, count1 = this.argumentTypes.length; i1 < count1; i1 = i1 + 1 | 0) {
        if (i1 != 0) {
          result += ', ';
        }

        result += in_List.get(this.argumentTypes, i1).toString();
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

  Skew.Environment = function(parameters, substitutions) {
    this.id = Skew.Environment._nextID = Skew.Environment._nextID + 1 | 0;
    this.parameters = parameters;
    this.substitutions = substitutions;
    this.mergeCache = null;
  };

  Skew.TypeCache = function() {
    this.boolType = null;
    this.boxType = null;
    this.doubleType = null;
    this.intMapType = null;
    this.intType = null;
    this.listType = null;
    this.mathType = null;
    this.stringMapType = null;
    this.stringType = null;
    this.boolToStringSymbol = null;
    this.doublePowerSymbol = null;
    this.doubleToStringSymbol = null;
    this.intPowerSymbol = null;
    this.intToStringSymbol = null;
    this.mathPowSymbol = null;
    this.stringCountSymbol = null;
    this.stringFromCodePointsSymbol = null;
    this.stringFromCodePointSymbol = null;
    this.stringFromCodeUnitsSymbol = null;
    this.stringFromCodeUnitSymbol = null;
    this.entryPointSymbol = null;
    this._environments = {};
    this._lambdaTypes = {};
    this._parameters = [];
  };

  Skew.TypeCache.prototype.loadGlobals = function(log, global) {
    this.boolType = Skew.TypeCache._loadGlobalObject(global, 'bool', Skew.SymbolKind.OBJECT_CLASS, Skew.SymbolFlags.IS_VALUE_TYPE);
    this.boxType = Skew.TypeCache._loadGlobalObject(global, 'Box', Skew.SymbolKind.OBJECT_CLASS, 0);
    this.doubleType = Skew.TypeCache._loadGlobalObject(global, 'double', Skew.SymbolKind.OBJECT_CLASS, Skew.SymbolFlags.IS_VALUE_TYPE);
    this.intMapType = Skew.TypeCache._loadGlobalObject(global, 'IntMap', Skew.SymbolKind.OBJECT_CLASS, 0);
    this.intType = Skew.TypeCache._loadGlobalObject(global, 'int', Skew.SymbolKind.OBJECT_CLASS, Skew.SymbolFlags.IS_VALUE_TYPE);
    this.listType = Skew.TypeCache._loadGlobalObject(global, 'List', Skew.SymbolKind.OBJECT_CLASS, 0);
    this.mathType = Skew.TypeCache._loadGlobalObject(global, 'Math', Skew.SymbolKind.OBJECT_NAMESPACE, 0);
    this.stringMapType = Skew.TypeCache._loadGlobalObject(global, 'StringMap', Skew.SymbolKind.OBJECT_CLASS, 0);
    this.stringType = Skew.TypeCache._loadGlobalObject(global, 'string', Skew.SymbolKind.OBJECT_CLASS, 0);
    this.boolToStringSymbol = Skew.TypeCache._loadInstanceFunction(this.boolType, 'toString');
    this.doublePowerSymbol = Skew.TypeCache._loadInstanceFunction(this.doubleType, '**');
    this.doubleToStringSymbol = Skew.TypeCache._loadInstanceFunction(this.doubleType, 'toString');
    this.intPowerSymbol = Skew.TypeCache._loadInstanceFunction(this.intType, '**');
    this.intToStringSymbol = Skew.TypeCache._loadInstanceFunction(this.intType, 'toString');
    this.mathPowSymbol = Skew.TypeCache._loadGlobalFunction(this.mathType, 'pow');
    this.stringCountSymbol = Skew.TypeCache._loadInstanceFunction(this.stringType, 'count');
    this.stringFromCodePointsSymbol = Skew.TypeCache._loadGlobalFunction(this.stringType, 'fromCodePoints');
    this.stringFromCodePointSymbol = Skew.TypeCache._loadGlobalFunction(this.stringType, 'fromCodePoint');
    this.stringFromCodeUnitsSymbol = Skew.TypeCache._loadGlobalFunction(this.stringType, 'fromCodeUnits');
    this.stringFromCodeUnitSymbol = Skew.TypeCache._loadGlobalFunction(this.stringType, 'fromCodeUnit');
  };

  Skew.TypeCache.prototype.isEquivalentToBool = function(type) {
    return this.unwrappedType(type) == this.boolType;
  };

  Skew.TypeCache.prototype.isEquivalentToInt = function(type) {
    return this.isInteger(this.unwrappedType(type));
  };

  Skew.TypeCache.prototype.isEquivalentToDouble = function(type) {
    return this.unwrappedType(type) == this.doubleType;
  };

  Skew.TypeCache.prototype.isEquivalentToString = function(type) {
    return this.unwrappedType(type) == this.stringType;
  };

  Skew.TypeCache.prototype.isInteger = function(type) {
    return type == this.intType || type.isEnumOrFlags();
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
          for (var i = 0, list = interfaceTypes, count = list.length; i < count; i = i + 1 | 0) {
            var type = in_List.get(list, i);

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

    if (from.isEnumOrFlags() && !to.isEnumOrFlags() && this.isNumeric(to)) {
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

    if (to.isEnumOrFlags() && this.isNumeric(from)) {
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

  Skew.TypeCache.prototype.createInt = function(value) {
    return new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.IntContent(value)).withType(this.intType);
  };

  Skew.TypeCache.prototype.createDouble = function(value) {
    return new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.DoubleContent(value)).withType(this.doubleType);
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
      for (var i = 0, list = bucket, count = list.length; i < count; i = i + 1 | 0) {
        var existing = in_List.get(list, i);

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
    // This is used as a sentinel on LAMBDA_TYPE nodes
    assert(returnType != Skew.Type.NULL);
    var hash = Skew.TypeCache._hashTypes(returnType != null ? returnType.id : -1, argumentTypes);
    var bucket = in_IntMap.get(this._lambdaTypes, hash, null);

    // Check existing types in the bucket for a match
    if (bucket != null) {
      for (var i = 0, list = bucket, count = list.length; i < count; i = i + 1 | 0) {
        var existing = in_List.get(list, i);

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

    // Make a copy in case the caller mutates this later
    type.argumentTypes = argumentTypes.slice();
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

    for (var i = 0, count = b.parameters.length; i < count; i = i + 1 | 0) {
      var parameter = in_List.get(b.parameters, i);
      var substitution = in_List.get(b.substitutions, i);

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

    for (var i = 0, list = parameters, count = list.length; i < count; i = i + 1 | 0) {
      var parameter = in_List.get(list, i);
      substitutions.push(parameter.resolvedType);
    }

    return this.substitute(type, this.createEnvironment(parameters, substitutions));
  };

  Skew.TypeCache.prototype.substituteAll = function(types, environment) {
    var substitutions = [];

    for (var i = 0, list = types, count = list.length; i < count; i = i + 1 | 0) {
      var type = in_List.get(list, i);
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
      for (var i = 0, list = type.argumentTypes, count = list.length; i < count; i = i + 1 | 0) {
        var argumentType = in_List.get(list, i);
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
          substituted = in_List.get(environment.substitutions, index);
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

          for (var i1 = 0, list1 = parameters, count1 = list1.length; i1 < count1; i1 = i1 + 1 | 0) {
            var parameter = in_List.get(list1, i1);
            found = environment.parameters.indexOf(parameter) != -1;

            if (!found) {
              break;
            }
          }

          if (found) {
            substituted.substitutions = [];

            for (var i2 = 0, list2 = parameters, count2 = list2.length; i2 < count2; i2 = i2 + 1 | 0) {
              var parameter1 = in_List.get(list2, i2);
              substituted.substitutions.push(this.substitute(parameter1.resolvedType, environment));
            }
          }
        }

        // Substitute function arguments
        if (type.argumentTypes != null) {
          substituted.argumentTypes = [];

          for (var i3 = 0, list3 = type.argumentTypes, count3 = list3.length; i3 < count3; i3 = i3 + 1 | 0) {
            var argumentType1 = in_List.get(list3, i3);
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

  // Substitute the type parameters from one function into the other
  Skew.TypeCache.prototype.substituteFunctionParameters = function(type, from, to) {
    if (from.parameters != null && to.parameters != null && from.parameters.length == to.parameters.length) {
      var substitutions = [];

      for (var i = 0, list = from.parameters, count = list.length; i < count; i = i + 1 | 0) {
        var parameter = in_List.get(list, i);
        substitutions.push(parameter.resolvedType);
      }

      type = this.substitute(type, this.createEnvironment(to.parameters, substitutions));
    }

    return type;
  };

  Skew.TypeCache.prototype.areFunctionSymbolsEquivalent = function(left, leftEnvironment, right, rightEnvironment) {
    var leftType = left.resolvedType;
    var rightType = right.resolvedType;
    var leftReturn = leftType.returnType;
    var rightReturn = rightType.returnType;

    // Account for return types of functions from generic base types
    if (leftReturn != null) {
      leftReturn = this.substitute(leftReturn, leftEnvironment);
    }

    if (rightReturn != null) {
      rightReturn = this.substitute(rightReturn, rightEnvironment);
    }

    // Overloading by return type is not allowed, so only compare argument types
    if (this.substitute(left.argumentOnlyType, leftEnvironment) == this.substitute(right.argumentOnlyType, rightEnvironment)) {
      return leftReturn == rightReturn ? Skew.TypeCache.Equivalence.EQUIVALENT : Skew.TypeCache.Equivalence.EQUIVALENT_EXCEPT_RETURN_TYPE;
    }

    // For generic functions, substitute dummy type parameters into both
    // functions and then compare. For example, these are equivalent:
    //
    //   def foo<X>(bar X)
    //   def foo<Y>(baz Y)
    //
    if (left.parameters != null && right.parameters != null) {
      var leftArguments = leftType.argumentTypes;
      var rightArguments = rightType.argumentTypes;
      var argumentCount = leftArguments.length;
      var parameterCount = left.parameters.length;

      if (argumentCount == rightArguments.length && parameterCount == right.parameters.length) {
        // Generate enough dummy type parameters
        for (var i = this._parameters.length, count = parameterCount; i < count; i = i + 1 | 0) {
          var symbol = new Skew.ParameterSymbol(Skew.SymbolKind.PARAMETER_FUNCTION, 'T' + i.toString());
          symbol.resolvedType = new Skew.Type(Skew.TypeKind.SYMBOL, symbol);
          symbol.state = Skew.SymbolState.INITIALIZED;
          this._parameters.push(symbol.resolvedType);
        }

        // Substitute the same type parameters into both functions
        var parameters = this._parameters.length == parameterCount ? this._parameters : in_List.slice2(this._parameters, 0, parameterCount);
        var leftParametersEnvironment = this.createEnvironment(left.parameters, parameters);
        var rightParametersEnvironment = this.createEnvironment(right.parameters, parameters);

        // Compare each argument
        for (var i1 = 0, count1 = argumentCount; i1 < count1; i1 = i1 + 1 | 0) {
          if (this.substitute(this.substitute(in_List.get(leftArguments, i1), leftEnvironment), leftParametersEnvironment) != this.substitute(this.substitute(in_List.get(rightArguments, i1), rightEnvironment), rightParametersEnvironment)) {
            return Skew.TypeCache.Equivalence.NOT_EQUIVALENT;
          }
        }

        return leftReturn == null && rightReturn == null || leftReturn != null && rightReturn != null && this.substitute(leftReturn, leftParametersEnvironment) == this.substitute(rightReturn, rightParametersEnvironment) ? Skew.TypeCache.Equivalence.EQUIVALENT : Skew.TypeCache.Equivalence.EQUIVALENT_EXCEPT_RETURN_TYPE;
      }
    }

    return Skew.TypeCache.Equivalence.NOT_EQUIVALENT;
  };

  Skew.TypeCache.prototype._canCastToNumeric = function(type) {
    return type == this.intType || type == this.doubleType || type == this.boolType;
  };

  Skew.TypeCache._loadGlobalObject = function(global, name, kind, flags) {
    assert(Skew.in_SymbolKind.isObject(kind));
    var symbol = in_StringMap.get(global.members, name, null);
    assert(symbol != null);
    assert(symbol.kind == kind);
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

  Skew.TypeCache._loadGlobalFunction = function(type, name) {
    var symbol = in_StringMap.get(type.symbol.asObjectSymbol().members, name, null);
    assert(symbol != null);
    assert(symbol.kind == Skew.SymbolKind.FUNCTION_GLOBAL || symbol.kind == Skew.SymbolKind.OVERLOADED_GLOBAL);
    return symbol;
  };

  Skew.TypeCache._hashParameters = function(parameters) {
    var hash = 0;

    for (var i = 0, list = parameters, count = list.length; i < count; i = i + 1 | 0) {
      var parameter = in_List.get(list, i);
      hash = Skew.hashCombine(hash, parameter.id);
    }

    return hash;
  };

  Skew.TypeCache._hashTypes = function(hash, types) {
    for (var i = 0, list = types, count = list.length; i < count; i = i + 1 | 0) {
      var type = in_List.get(list, i);
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

  Skew.TypeCache.Equivalence = {
    EQUIVALENT: 0,
    EQUIVALENT_EXCEPT_RETURN_TYPE: 1,
    NOT_EQUIVALENT: 2
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
    NO_OUTPUT: 9,
    OUTPUT_DIRECTORY: 10,
    OUTPUT_FILE: 11,
    RELEASE: 12,
    TARGET: 13,
    VERBOSE: 14,
    VERSION: 15
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
    for (var i = 0, list = names, count = list.length; i < count; i = i + 1 | 0) {
      var name = in_List.get(list, i);
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
    for (var i1 = 0, list = $arguments, count = list.length; i1 < count; i1 = i1 + 1 | 0) {
      var argument = in_List.get(list, i1);
      var needsQuotes = argument.indexOf(' ') != -1;
      var start = this.source.contents.length + (needsQuotes | 0) | 0;
      ranges.push(new Skew.Range(this.source, start, start + argument.length | 0));
      this.source.contents += needsQuotes ? "'" + argument + "' " : argument + ' ';
    }

    // Parse each argument
    for (var i = 0, count1 = $arguments.length; i < count1; i = i + 1 | 0) {
      var argument1 = in_List.get($arguments, i);
      var range = in_List.get(ranges, i);

      // Track all normal arguments separately
      if (argument1 == '' || in_string.get1(argument1, 0) != 45 && !(argument1 in this.map)) {
        this.normalArguments.push(range);
        continue;
      }

      // Parse a flag
      var equals = argument1.indexOf('=');
      var colon = argument1.indexOf(':');
      var separator = equals >= 0 && (colon < 0 || equals < colon) ? equals : colon;
      var name = separator >= 0 ? in_string.slice2(argument1, 0, separator) : argument1;
      var data = in_StringMap.get(this.map, name, null);

      // Check that the flag exists
      if (data == null) {
        log.commandLineErrorBadFlag(range.fromStart(name.length), name);
        continue;
      }

      // Validate the flag data
      var text = in_string.slice1(argument1, separator + 1 | 0);
      var separatorRange = separator < 0 ? null : range.slice(separator, separator + 1 | 0);
      var textRange = range.fromEnd(text.length);

      switch (data.type) {
        case Skew.Options.Type.BOOL: {
          if (separator < 0) {
            text = 'true';
          }

          else if (in_string.get1(argument1, separator) != 61) {
            log.commandLineErrorExpectedToken(separatorRange, '=', in_string.get(argument1, separator), argument1);
            continue;
          }

          else if (text != 'true' && text != 'false') {
            log.commandLineErrorNonBooleanValue(textRange, text, argument1);
            continue;
          }

          if (data.option in this.optionalArguments) {
            log.commandLineWarningDuplicateFlagValue(textRange, name, in_IntMap.get1(this.optionalArguments, data.option).range);
          }

          this.optionalArguments[data.option] = new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.BoolContent(text == 'true')).withRange(textRange);
          break;
        }

        case Skew.Options.Type.INT: {
          if (separator < 0) {
            log.commandLineErrorMissingValue(textRange, data.nameText());
          }

          else if (in_string.get1(argument1, separator) != 61) {
            log.commandLineErrorExpectedToken(separatorRange, '=', in_string.get(argument1, separator), argument1);
          }

          else {
            var box = Skew.Parsing.parseIntLiteral(log, textRange);

            if (box == null) {
              log.commandLineErrorNonIntegerValue(textRange, text, argument1);
            }

            else {
              if (data.option in this.optionalArguments) {
                log.commandLineWarningDuplicateFlagValue(textRange, name, in_IntMap.get1(this.optionalArguments, data.option).range);
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

          else if (in_string.get1(argument1, separator) != 61) {
            log.commandLineErrorExpectedToken(separatorRange, '=', in_string.get(argument1, separator), argument1);
          }

          else {
            if (data.option in this.optionalArguments) {
              log.commandLineWarningDuplicateFlagValue(textRange, name, in_IntMap.get1(this.optionalArguments, data.option).range);
            }

            this.optionalArguments[data.option] = new Skew.Node(Skew.NodeKind.CONSTANT).withContent(new Skew.StringContent(text)).withRange(textRange);
          }
          break;
        }

        case Skew.Options.Type.STRING_LIST: {
          if (separator < 0) {
            log.commandLineErrorMissingValue(textRange, data.nameText());
          }

          else if (in_string.get1(argument1, separator) != 58) {
            log.commandLineErrorExpectedToken(separatorRange, ':', in_string.get(argument1, separator), argument1);
          }

          else {
            var node = null;

            if (data.option in this.optionalArguments) {
              node = in_IntMap.get1(this.optionalArguments, data.option);
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
    for (var i = 0, list = this.options, count = list.length; i < count; i = i + 1 | 0) {
      var option = in_List.get(list, i);
      var width = option.nameText().length + 4 | 0;

      if (columnWidth < width) {
        columnWidth = width;
      }
    }

    // Format the options
    var columnText = in_string.repeat(' ', columnWidth);

    for (var i2 = 0, list2 = this.options, count2 = list2.length; i2 < count2; i2 = i2 + 1 | 0) {
      var option1 = in_List.get(list2, i2);
      var nameText = option1.nameText();
      var isFirst = true;
      text += '\n  ' + nameText + in_string.repeat(' ', (columnWidth - nameText.length | 0) - 2 | 0);

      for (var i1 = 0, list1 = Skew.PrettyPrint.wrapWords(option1.description, wrapWidth - columnWidth | 0), count1 = list1.length; i1 < count1; i1 = i1 + 1 | 0) {
        var line = in_List.get(list1, i1);
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

  Skew.in_NodeKind.isBitOperation = function(self) {
    return self == Skew.NodeKind.COMPLEMENT || self >= Skew.NodeKind.BITWISE_AND && self <= Skew.NodeKind.BITWISE_XOR || self >= Skew.NodeKind.ASSIGN_BITWISE_AND && self <= Skew.NodeKind.ASSIGN_BITWISE_XOR;
  };

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
    return self >= Skew.NodeKind.COMPLEMENT && self <= Skew.NodeKind.PREFIX_INCREMENT;
  };

  Skew.in_NodeKind.isUnaryAssign = function(self) {
    return self >= Skew.NodeKind.POSTFIX_DECREMENT && self <= Skew.NodeKind.PREFIX_INCREMENT;
  };

  Skew.in_NodeKind.isUnaryPostfix = function(self) {
    return self == Skew.NodeKind.POSTFIX_DECREMENT || self == Skew.NodeKind.POSTFIX_INCREMENT;
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

  Skew.in_NodeKind.isShift = function(self) {
    return self == Skew.NodeKind.SHIFT_LEFT || self == Skew.NodeKind.SHIFT_RIGHT || self == Skew.NodeKind.UNSIGNED_SHIFT_RIGHT;
  };

  Skew.in_NodeKind.isJump = function(self) {
    return self == Skew.NodeKind.BREAK || self == Skew.NodeKind.CONTINUE || self == Skew.NodeKind.RETURN;
  };

  Skew.in_NodeKind.isAssign = function(self) {
    return Skew.in_NodeKind.isUnaryAssign(self) || Skew.in_NodeKind.isBinaryAssign(self) || self == Skew.NodeKind.ASSIGN_INDEX;
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

  Skew.in_SymbolKind.isEnumOrFlags = function(self) {
    return self == Skew.SymbolKind.OBJECT_ENUM || self == Skew.SymbolKind.OBJECT_FLAGS;
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
    return self == Skew.SymbolKind.VARIABLE_ENUM_OR_FLAGS || self == Skew.SymbolKind.VARIABLE_GLOBAL || self == Skew.SymbolKind.FUNCTION_GLOBAL || self == Skew.SymbolKind.FUNCTION_CONSTRUCTOR || self == Skew.SymbolKind.OVERLOADED_GLOBAL || Skew.in_SymbolKind.isType(self);
  };

  Skew.in_SymbolKind.hasInstances = function(self) {
    return self == Skew.SymbolKind.OBJECT_CLASS || self == Skew.SymbolKind.OBJECT_ENUM || self == Skew.SymbolKind.OBJECT_FLAGS || self == Skew.SymbolKind.OBJECT_INTERFACE || self == Skew.SymbolKind.OBJECT_WRAPPED;
  };

  Skew.in_SymbolKind.isOnInstances = function(self) {
    return self == Skew.SymbolKind.FUNCTION_INSTANCE || self == Skew.SymbolKind.VARIABLE_INSTANCE || self == Skew.SymbolKind.OVERLOADED_INSTANCE;
  };

  Skew.in_SymbolKind.isLocal = function(self) {
    return self == Skew.SymbolKind.FUNCTION_LOCAL || self == Skew.SymbolKind.VARIABLE_LOCAL || self == Skew.SymbolKind.VARIABLE_ARGUMENT;
  };

  Skew.in_TokenKind = {};

  Skew.in_TokenKind.toString = function(self) {
    assert(self in Skew.in_TokenKind._toString);
    return in_IntMap.get1(Skew.in_TokenKind._toString, self);
  };

  var Terminal = {};

  Terminal.setColor = function(color) {
    if (process.stdout.isTTY) {
      process.stdout.write('\x1B[0;' + in_IntMap.get1(Terminal.colorToEscapeCode, color).toString() + 'm');
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

  var IO = {};

  IO.isDirectory = function(path) {
    try {
      return require('fs').statSync(path).isDirectory();
    }

    catch (e) {
    }

    return false;
  };

  IO.readDirectory = function(path) {
    try {
      var entries = require('fs').readdirSync(path);
      entries.sort(function(a, b) {
        return in_string.compare(a, b);
      });
      return entries;
    }

    catch (e) {
    }

    return null;
  };

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

  var in_int = {};

  in_int.power = function(self, x) {
    var y = self;
    var z = x < 0 ? 0 : 1;

    while (x > 0) {
      if ((x & 1) != 0) {
        z = __imul(z, y);
      }

      x >>= 1;
      y = __imul(y, y);
    }

    return z;
  };

  in_int.compare = function(self, x) {
    return (x < self | 0) - (x > self | 0) | 0;
  };

  var in_string = {};

  in_string.fromCodePoints = function(codePoints) {
    var builder = new StringBuilder();

    for (var i = 0, list = codePoints, count1 = list.length; i < count1; i = i + 1 | 0) {
      var codePoint = in_List.get(list, i);
      builder.append(in_string.fromCodePoint(codePoint));
    }

    return builder.toString();
  };

  in_string.compare = function(self, x) {
    return (x < self | 0) - (x > self | 0) | 0;
  };

  in_string.slice1 = function(self, start) {
    assert(0 <= start && start <= self.length);
    return self.slice(start);
  };

  in_string.slice2 = function(self, start, end) {
    assert(0 <= start && start <= end && end <= self.length);
    return self.slice(start, end);
  };

  in_string.startsWith = function(self, text) {
    return self.length >= text.length && in_string.slice2(self, 0, text.length) == text;
  };

  in_string.endsWith = function(self, text) {
    return self.length >= text.length && in_string.slice1(self, self.length - text.length | 0) == text;
  };

  in_string.get1 = function(self, index) {
    assert(0 <= index && index < self.length);
    return self.charCodeAt(index);
  };

  in_string.get = function(self, index) {
    assert(0 <= index && index < self.length);
    return self[index];
  };

  in_string.repeat = function(self, times) {
    var result = '';

    for (var i = 0, count1 = times; i < count1; i = i + 1 | 0) {
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
    return in_List.set(self, self.length - 1 | 0, x);
  };

  in_List.swap = function(self, i, j) {
    assert(0 <= i && i < self.length);
    assert(0 <= j && j < self.length);
    var temp = in_List.get(self, i);
    in_List.set(self, i, in_List.get(self, j));
    in_List.set(self, j, temp);
  };

  in_List.slice2 = function(self, start, end) {
    assert(0 <= start && start <= end && end <= self.length);
    return self.slice(start, end);
  };

  in_List.get = function(self, index) {
    assert(0 <= index && index < self.length);
    return self[index];
  };

  in_List.set = function(self, index, value) {
    assert(0 <= index && index < self.length);
    return self[index] = value;
  };

  in_List.first = function(self) {
    assert(!(self.length == 0));
    return in_List.get(self, 0);
  };

  in_List.last = function(self) {
    assert(!(self.length == 0));
    return in_List.get(self, self.length - 1 | 0);
  };

  in_List.prepend1 = function(self, values) {
    assert(values != self);
    var count = values.length;

    for (var i = 0, count1 = count; i < count1; i = i + 1 | 0) {
      self.unshift(in_List.get(values, (count - i | 0) - 1 | 0));
    }
  };

  in_List.append1 = function(self, values) {
    assert(values != self);

    for (var i = 0, list = values, count1 = list.length; i < count1; i = i + 1 | 0) {
      var value = in_List.get(list, i);
      self.push(value);
    }
  };

  in_List.insert1 = function(self, index, values) {
    assert(values != self);

    for (var i = 0, list = values, count1 = list.length; i < count1; i = i + 1 | 0) {
      var value = in_List.get(list, i);
      in_List.insert2(self, index, value);
      index = index + 1 | 0;
    }
  };

  in_List.insert2 = function(self, index, value) {
    assert(0 <= index && index <= self.length);
    self.splice(index, 0, value);
  };

  in_List.removeLast = function(self) {
    assert(!(self.length == 0));
    self.pop();
  };

  in_List.takeLast = function(self) {
    assert(!(self.length == 0));
    return self.pop();
  };

  in_List.removeAt = function(self, index) {
    assert(0 <= index && index < self.length);
    self.splice(index, 1);
  };

  in_List.appendOne = function(self, value) {
    if (!(self.indexOf(value) != -1)) {
      self.push(value);
    }
  };

  in_List.removeOne = function(self, value) {
    var index = self.indexOf(value);

    if (index >= 0) {
      in_List.removeAt(self, index);
    }
  };

  in_List.removeIf = function(self, callback) {
    var index = 0;

    // Remove elements in place
    for (var i = 0, count1 = self.length; i < count1; i = i + 1 | 0) {
      if (!callback(in_List.get(self, i))) {
        if (index < i) {
          in_List.set(self, index, in_List.get(self, i));
        }

        index = index + 1 | 0;
      }
    }

    // Shrink the array to the correct size
    while (index < self.length) {
      in_List.removeLast(self);
    }
  };

  in_List.equals = function(self, other) {
    if (self.length != other.length) {
      return false;
    }

    for (var i = 0, count1 = self.length; i < count1; i = i + 1 | 0) {
      if (in_List.get(self, i) != in_List.get(other, i)) {
        return false;
      }
    }

    return true;
  };

  var in_StringMap = {};

  in_StringMap.get1 = function(self, key) {
    assert(key in self);
    return self[key];
  };

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
      values.push(in_StringMap.get1(self, key));
    }

    return values;
  };

  in_StringMap.clone = function(self) {
    var clone = Object.create(null);

    for (var i = 0, list = Object.keys(self), count1 = list.length; i < count1; i = i + 1 | 0) {
      var key = in_List.get(list, i);
      clone[key] = in_StringMap.get1(self, key);
    }

    return clone;
  };

  in_StringMap.each = function(self, x) {
    for (var key in self) {
      x(key, in_StringMap.get1(self, key));
    }
  };

  var in_IntMap = {};

  in_IntMap.get1 = function(self, key) {
    assert(key in self);
    return self[key];
  };

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
      values.push(in_IntMap.get1(self, key));
    }

    return values;
  };

  var TARGET = Target.JAVASCRIPT;
  Unicode.StringIterator.INSTANCE = new Unicode.StringIterator();
  Skew.HEX = '0123456789ABCDEF';
  Skew.BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  Skew.operatorInfo = in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert({}, Skew.NodeKind.COMPLEMENT, new Skew.OperatorInfo('~', Skew.Precedence.UNARY_PREFIX, Skew.Associativity.NONE, Skew.OperatorKind.OVERRIDABLE, [0], Skew.NodeKind.NULL)), Skew.NodeKind.NEGATIVE, new Skew.OperatorInfo('-', Skew.Precedence.UNARY_PREFIX, Skew.Associativity.NONE, Skew.OperatorKind.OVERRIDABLE, [0, 1], Skew.NodeKind.NULL)), Skew.NodeKind.NOT, new Skew.OperatorInfo('!', Skew.Precedence.UNARY_PREFIX, Skew.Associativity.NONE, Skew.OperatorKind.OVERRIDABLE, [0], Skew.NodeKind.NULL)), Skew.NodeKind.POSITIVE, new Skew.OperatorInfo('+', Skew.Precedence.UNARY_PREFIX, Skew.Associativity.NONE, Skew.OperatorKind.OVERRIDABLE, [0, 1], Skew.NodeKind.NULL)), Skew.NodeKind.POSTFIX_DECREMENT, new Skew.OperatorInfo('--', Skew.Precedence.UNARY_POSTFIX, Skew.Associativity.NONE, Skew.OperatorKind.OVERRIDABLE, [0], Skew.NodeKind.SUBTRACT)), Skew.NodeKind.POSTFIX_INCREMENT, new Skew.OperatorInfo('++', Skew.Precedence.UNARY_POSTFIX, Skew.Associativity.NONE, Skew.OperatorKind.OVERRIDABLE, [0], Skew.NodeKind.ADD)), Skew.NodeKind.PREFIX_DECREMENT, new Skew.OperatorInfo('--', Skew.Precedence.UNARY_PREFIX, Skew.Associativity.NONE, Skew.OperatorKind.OVERRIDABLE, [0], Skew.NodeKind.SUBTRACT)), Skew.NodeKind.PREFIX_INCREMENT, new Skew.OperatorInfo('++', Skew.Precedence.UNARY_PREFIX, Skew.Associativity.NONE, Skew.OperatorKind.OVERRIDABLE, [0], Skew.NodeKind.ADD)), Skew.NodeKind.ADD, new Skew.OperatorInfo('+', Skew.Precedence.ADD, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, [0, 1], Skew.NodeKind.NULL)), Skew.NodeKind.BITWISE_AND, new Skew.OperatorInfo('&', Skew.Precedence.BITWISE_AND, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, [1], Skew.NodeKind.NULL)), Skew.NodeKind.BITWISE_OR, new Skew.OperatorInfo('|', Skew.Precedence.BITWISE_OR, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, [1], Skew.NodeKind.NULL)), Skew.NodeKind.BITWISE_XOR, new Skew.OperatorInfo('^', Skew.Precedence.BITWISE_XOR, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, [1], Skew.NodeKind.NULL)), Skew.NodeKind.COMPARE, new Skew.OperatorInfo('<=>', Skew.Precedence.COMPARE, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, [1], Skew.NodeKind.NULL)), Skew.NodeKind.DIVIDE, new Skew.OperatorInfo('/', Skew.Precedence.MULTIPLY, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, [1], Skew.NodeKind.NULL)), Skew.NodeKind.EQUAL, new Skew.OperatorInfo('==', Skew.Precedence.EQUAL, Skew.Associativity.LEFT, Skew.OperatorKind.FIXED, [1], Skew.NodeKind.NULL)), Skew.NodeKind.GREATER_THAN, new Skew.OperatorInfo('>', Skew.Precedence.COMPARE, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, [1], Skew.NodeKind.NULL)), Skew.NodeKind.GREATER_THAN_OR_EQUAL, new Skew.OperatorInfo('>=', Skew.Precedence.COMPARE, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, [1], Skew.NodeKind.NULL)), Skew.NodeKind.IN, new Skew.OperatorInfo('in', Skew.Precedence.COMPARE, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, [1], Skew.NodeKind.NULL)), Skew.NodeKind.LESS_THAN, new Skew.OperatorInfo('<', Skew.Precedence.COMPARE, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, [1], Skew.NodeKind.NULL)), Skew.NodeKind.LESS_THAN_OR_EQUAL, new Skew.OperatorInfo('<=', Skew.Precedence.COMPARE, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, [1], Skew.NodeKind.NULL)), Skew.NodeKind.LOGICAL_AND, new Skew.OperatorInfo('&&', Skew.Precedence.LOGICAL_AND, Skew.Associativity.LEFT, Skew.OperatorKind.FIXED, [1], Skew.NodeKind.NULL)), Skew.NodeKind.LOGICAL_OR, new Skew.OperatorInfo('||', Skew.Precedence.LOGICAL_OR, Skew.Associativity.LEFT, Skew.OperatorKind.FIXED, [1], Skew.NodeKind.NULL)), Skew.NodeKind.MULTIPLY, new Skew.OperatorInfo('*', Skew.Precedence.MULTIPLY, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, [1], Skew.NodeKind.NULL)), Skew.NodeKind.NOT_EQUAL, new Skew.OperatorInfo('!=', Skew.Precedence.EQUAL, Skew.Associativity.LEFT, Skew.OperatorKind.FIXED, [1], Skew.NodeKind.NULL)), Skew.NodeKind.POWER, new Skew.OperatorInfo('**', Skew.Precedence.UNARY_PREFIX, Skew.Associativity.RIGHT, Skew.OperatorKind.OVERRIDABLE, [1], Skew.NodeKind.NULL)), Skew.NodeKind.REMAINDER, new Skew.OperatorInfo('%', Skew.Precedence.MULTIPLY, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, [1], Skew.NodeKind.NULL)), Skew.NodeKind.SHIFT_LEFT, new Skew.OperatorInfo('<<', Skew.Precedence.SHIFT, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, [1], Skew.NodeKind.NULL)), Skew.NodeKind.SHIFT_RIGHT, new Skew.OperatorInfo('>>', Skew.Precedence.SHIFT, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, [1], Skew.NodeKind.NULL)), Skew.NodeKind.SUBTRACT, new Skew.OperatorInfo('-', Skew.Precedence.ADD, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, [0, 1], Skew.NodeKind.NULL)), Skew.NodeKind.UNSIGNED_SHIFT_RIGHT, new Skew.OperatorInfo('>>>', Skew.Precedence.SHIFT, Skew.Associativity.LEFT, Skew.OperatorKind.OVERRIDABLE, [1], Skew.NodeKind.NULL)), Skew.NodeKind.ASSIGN, new Skew.OperatorInfo('=', Skew.Precedence.ASSIGN, Skew.Associativity.RIGHT, Skew.OperatorKind.FIXED, [1], Skew.NodeKind.NULL)), Skew.NodeKind.ASSIGN_ADD, new Skew.OperatorInfo('+=', Skew.Precedence.ASSIGN, Skew.Associativity.RIGHT, Skew.OperatorKind.OVERRIDABLE, [1], Skew.NodeKind.ADD)), Skew.NodeKind.ASSIGN_BITWISE_AND, new Skew.OperatorInfo('&=', Skew.Precedence.ASSIGN, Skew.Associativity.RIGHT, Skew.OperatorKind.OVERRIDABLE, [1], Skew.NodeKind.BITWISE_AND)), Skew.NodeKind.ASSIGN_BITWISE_OR, new Skew.OperatorInfo('|=', Skew.Precedence.ASSIGN, Skew.Associativity.RIGHT, Skew.OperatorKind.OVERRIDABLE, [1], Skew.NodeKind.BITWISE_OR)), Skew.NodeKind.ASSIGN_BITWISE_XOR, new Skew.OperatorInfo('^=', Skew.Precedence.ASSIGN, Skew.Associativity.RIGHT, Skew.OperatorKind.OVERRIDABLE, [1], Skew.NodeKind.BITWISE_XOR)), Skew.NodeKind.ASSIGN_DIVIDE, new Skew.OperatorInfo('/=', Skew.Precedence.ASSIGN, Skew.Associativity.RIGHT, Skew.OperatorKind.OVERRIDABLE, [1], Skew.NodeKind.DIVIDE)), Skew.NodeKind.ASSIGN_MULTIPLY, new Skew.OperatorInfo('*=', Skew.Precedence.ASSIGN, Skew.Associativity.RIGHT, Skew.OperatorKind.OVERRIDABLE, [1], Skew.NodeKind.MULTIPLY)), Skew.NodeKind.ASSIGN_POWER, new Skew.OperatorInfo('**=', Skew.Precedence.ASSIGN, Skew.Associativity.RIGHT, Skew.OperatorKind.OVERRIDABLE, [1], Skew.NodeKind.POWER)), Skew.NodeKind.ASSIGN_REMAINDER, new Skew.OperatorInfo('%=', Skew.Precedence.ASSIGN, Skew.Associativity.RIGHT, Skew.OperatorKind.OVERRIDABLE, [1], Skew.NodeKind.REMAINDER)), Skew.NodeKind.ASSIGN_SHIFT_LEFT, new Skew.OperatorInfo('<<=', Skew.Precedence.ASSIGN, Skew.Associativity.RIGHT, Skew.OperatorKind.OVERRIDABLE, [1], Skew.NodeKind.SHIFT_LEFT)), Skew.NodeKind.ASSIGN_SHIFT_RIGHT, new Skew.OperatorInfo('>>=', Skew.Precedence.ASSIGN, Skew.Associativity.RIGHT, Skew.OperatorKind.OVERRIDABLE, [1], Skew.NodeKind.SHIFT_RIGHT)), Skew.NodeKind.ASSIGN_SUBTRACT, new Skew.OperatorInfo('-=', Skew.Precedence.ASSIGN, Skew.Associativity.RIGHT, Skew.OperatorKind.OVERRIDABLE, [1], Skew.NodeKind.SUBTRACT)), Skew.NodeKind.ASSIGN_UNSIGNED_SHIFT_RIGHT, new Skew.OperatorInfo('>>>=', Skew.Precedence.ASSIGN, Skew.Associativity.RIGHT, Skew.OperatorKind.OVERRIDABLE, [1], Skew.NodeKind.UNSIGNED_SHIFT_RIGHT)), Skew.NodeKind.ASSIGN_INDEX, new Skew.OperatorInfo('[]=', Skew.Precedence.MEMBER, Skew.Associativity.NONE, Skew.OperatorKind.OVERRIDABLE, [2], Skew.NodeKind.NULL)), Skew.NodeKind.INDEX, new Skew.OperatorInfo('[]', Skew.Precedence.MEMBER, Skew.Associativity.NONE, Skew.OperatorKind.OVERRIDABLE, [1], Skew.NodeKind.NULL));
  Skew.validArgumentCounts = null;
  Skew.yy_accept = [Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.END_OF_FILE, Skew.TokenKind.ERROR, Skew.TokenKind.WHITESPACE, Skew.TokenKind.NEWLINE, Skew.TokenKind.NOT, Skew.TokenKind.ERROR, Skew.TokenKind.COMMENT, Skew.TokenKind.REMAINDER, Skew.TokenKind.BITWISE_AND, Skew.TokenKind.ERROR, Skew.TokenKind.LEFT_PARENTHESIS, Skew.TokenKind.RIGHT_PARENTHESIS, Skew.TokenKind.MULTIPLY, Skew.TokenKind.PLUS, Skew.TokenKind.COMMA, Skew.TokenKind.MINUS, Skew.TokenKind.DOT, Skew.TokenKind.DIVIDE, Skew.TokenKind.INT, Skew.TokenKind.INT, Skew.TokenKind.COLON, Skew.TokenKind.SEMICOLON, Skew.TokenKind.LESS_THAN, Skew.TokenKind.ASSIGN, Skew.TokenKind.GREATER_THAN, Skew.TokenKind.QUESTION_MARK, Skew.TokenKind.ERROR, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.LEFT_BRACKET, Skew.TokenKind.RIGHT_BRACKET, Skew.TokenKind.BITWISE_XOR, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.LEFT_BRACE, Skew.TokenKind.BITWISE_OR, Skew.TokenKind.RIGHT_BRACE, Skew.TokenKind.TILDE, Skew.TokenKind.WHITESPACE, Skew.TokenKind.NEWLINE, Skew.TokenKind.NOT_EQUAL, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.STRING, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.COMMENT, Skew.TokenKind.COMMENT, Skew.TokenKind.ASSIGN_REMAINDER, Skew.TokenKind.LOGICAL_AND, Skew.TokenKind.ASSIGN_BITWISE_AND, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.CHARACTER, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.POWER, Skew.TokenKind.ASSIGN_MULTIPLY, Skew.TokenKind.INCREMENT, Skew.TokenKind.ASSIGN_PLUS, Skew.TokenKind.DECREMENT, Skew.TokenKind.ASSIGN_MINUS, Skew.TokenKind.DOT_DOT, Skew.TokenKind.COMMENT_ERROR, Skew.TokenKind.ASSIGN_DIVIDE, Skew.TokenKind.XML_END_EMPTY, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.INT, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.DOUBLE_COLON, Skew.TokenKind.XML_START_CLOSE, Skew.TokenKind.SHIFT_LEFT, Skew.TokenKind.LESS_THAN_OR_EQUAL, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.EQUAL, Skew.TokenKind.ARROW, Skew.TokenKind.GREATER_THAN_OR_EQUAL, Skew.TokenKind.SHIFT_RIGHT, Skew.TokenKind.NULL_DOT, Skew.TokenKind.ASSIGN_NULL, Skew.TokenKind.NULL_JOIN, Skew.TokenKind.ANNOTATION, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.INDEX, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.ASSIGN_BITWISE_XOR, Skew.TokenKind.AS, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IF, Skew.TokenKind.IN, Skew.TokenKind.IS, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.ASSIGN_BITWISE_OR, Skew.TokenKind.LOGICAL_OR, Skew.TokenKind.ASSIGN_POWER, Skew.TokenKind.COMMENT_ERROR, Skew.TokenKind.COMMENT_ERROR, Skew.TokenKind.DOUBLE, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.DOUBLE, Skew.TokenKind.INT_BINARY, Skew.TokenKind.INT_OCTAL, Skew.TokenKind.INT_HEX, Skew.TokenKind.ASSIGN_SHIFT_LEFT, Skew.TokenKind.COMPARE, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.ASSIGN_SHIFT_RIGHT, Skew.TokenKind.UNSIGNED_SHIFT_RIGHT, Skew.TokenKind.ANNOTATION, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.ASSIGN_INDEX, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.FOR, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.TRY, Skew.TokenKind.VAR, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.ASSIGN_UNSIGNED_SHIFT_RIGHT, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.CASE, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.ELSE, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.NULL, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.TRUE, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.DOUBLE, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.LIST, Skew.TokenKind.LIST_NEW, Skew.TokenKind.BREAK, Skew.TokenKind.CATCH, Skew.TokenKind.CONST, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.FALSE, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.SUPER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.THROW, Skew.TokenKind.WHILE, Skew.TokenKind.SET, Skew.TokenKind.SET_NEW, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.RETURN, Skew.TokenKind.SWITCH, Skew.TokenKind.YY_INVALID_ACTION, Skew.TokenKind.IDENTIFIER, Skew.TokenKind.DEFAULT, Skew.TokenKind.DYNAMIC, Skew.TokenKind.FINALLY, Skew.TokenKind.XML_CHILD, Skew.TokenKind.CONTINUE, Skew.TokenKind.YY_INVALID_ACTION];
  Skew.yy_ec = [0, 1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 4, 5, 6, 1, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 20, 20, 20, 20, 20, 21, 21, 22, 23, 24, 25, 26, 27, 28, 29, 29, 29, 29, 30, 29, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 32, 33, 34, 35, 31, 1, 36, 37, 38, 39, 40, 41, 31, 42, 43, 31, 44, 45, 46, 47, 48, 49, 31, 50, 51, 52, 53, 54, 55, 56, 57, 31, 58, 59, 60, 61, 1];
  Skew.yy_meta = [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 3, 3, 4, 1, 1, 1, 1, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 1, 1, 1, 1];
  Skew.yy_base = [0, 0, 0, 320, 321, 317, 60, 293, 59, 314, 291, 57, 57, 321, 321, 55, 56, 321, 53, 299, 58, 77, 83, 292, 321, 62, 45, 47, 84, 0, 0, 90, 321, 288, 261, 261, 41, 34, 265, 72, 71, 256, 268, 66, 84, 271, 264, 69, 51, 321, 321, 303, 125, 321, 124, 321, 301, 300, 321, 321, 321, 321, 121, 321, 299, 276, 321, 321, 321, 321, 321, 321, 297, 321, 321, 120, 126, 140, 113, 130, 0, 321, 321, 274, 272, 281, 321, 321, 321, 110, 321, 321, 321, 0, 0, 280, 270, 254, 321, 0, 253, 100, 245, 250, 243, 238, 243, 240, 236, 0, 0, 0, 240, 232, 234, 239, 231, 110, 230, 236, 262, 237, 321, 321, 321, 273, 321, 150, 154, 158, 146, 163, 0, 321, 321, 259, 321, 249, 0, 257, 321, 217, 235, 230, 231, 133, 232, 231, 226, 214, 228, 0, 218, 209, 221, 208, 211, 218, 0, 0, 212, 240, 200, 173, 238, 321, 219, 218, 207, 0, 208, 197, 205, 194, 200, 0, 205, 199, 0, 193, 192, 203, 185, 0, 199, 178, 177, 177, 181, 212, 321, 321, 0, 0, 0, 188, 189, 190, 0, 187, 184, 0, 188, 0, 0, 321, 321, 212, 136, 135, 124, 86, 0, 0, 79, 54, 0, 0, 0, 321, 0, 321, 202, 206, 210, 212, 215, 219, 222, 224];
  Skew.yy_def = [0, 221, 1, 221, 221, 221, 221, 221, 222, 223, 221, 221, 224, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 225, 226, 221, 221, 221, 226, 226, 226, 226, 226, 226, 226, 226, 226, 226, 226, 226, 226, 221, 221, 221, 221, 221, 221, 221, 222, 221, 222, 223, 221, 221, 221, 221, 224, 221, 224, 221, 221, 221, 221, 221, 221, 221, 227, 221, 221, 221, 221, 221, 221, 221, 228, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 229, 226, 221, 221, 221, 221, 226, 226, 226, 226, 226, 226, 226, 226, 226, 226, 226, 226, 226, 226, 226, 226, 226, 226, 226, 226, 226, 221, 221, 221, 221, 221, 227, 221, 221, 221, 221, 221, 221, 228, 221, 221, 221, 221, 221, 229, 221, 221, 221, 226, 226, 226, 226, 226, 226, 226, 226, 226, 226, 226, 226, 226, 226, 226, 226, 226, 226, 226, 221, 221, 221, 221, 221, 221, 221, 226, 226, 226, 226, 226, 226, 226, 226, 226, 226, 226, 226, 226, 226, 226, 226, 226, 221, 221, 221, 221, 221, 221, 221, 226, 226, 226, 226, 226, 226, 226, 226, 226, 226, 226, 226, 226, 221, 221, 221, 226, 226, 226, 226, 226, 226, 221, 226, 226, 226, 226, 221, 226, 0, 221, 221, 221, 221, 221, 221, 221, 221];
  Skew.yy_nxt = [0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 22, 22, 23, 24, 25, 26, 27, 28, 29, 30, 30, 30, 31, 4, 32, 33, 34, 35, 36, 37, 38, 39, 30, 40, 30, 30, 30, 41, 30, 30, 42, 43, 44, 30, 45, 46, 30, 30, 47, 48, 49, 50, 52, 52, 55, 60, 63, 65, 69, 67, 86, 87, 88, 89, 103, 72, 122, 101, 70, 82, 66, 68, 61, 73, 74, 120, 83, 84, 85, 102, 64, 104, 56, 75, 220, 76, 76, 76, 76, 75, 90, 76, 76, 76, 76, 219, 95, 77, 106, 91, 123, 92, 109, 77, 78, 107, 121, 77, 110, 114, 108, 115, 111, 77, 96, 79, 116, 52, 52, 55, 63, 130, 130, 80, 117, 136, 137, 97, 127, 127, 127, 127, 75, 218, 76, 76, 76, 76, 131, 131, 131, 143, 144, 128, 64, 128, 77, 56, 129, 129, 129, 129, 217, 157, 130, 130, 77, 158, 127, 127, 127, 127, 129, 129, 129, 129, 129, 129, 129, 129, 163, 131, 131, 131, 171, 172, 187, 216, 187, 215, 163, 188, 188, 188, 188, 188, 188, 188, 188, 188, 188, 188, 188, 54, 54, 54, 54, 57, 57, 57, 57, 62, 62, 62, 62, 93, 93, 94, 94, 94, 125, 125, 125, 125, 132, 132, 138, 138, 138, 214, 213, 212, 211, 210, 209, 208, 207, 206, 205, 204, 203, 202, 201, 200, 199, 198, 197, 196, 195, 194, 193, 192, 191, 190, 189, 186, 185, 184, 183, 182, 181, 180, 179, 178, 177, 176, 175, 174, 173, 170, 169, 168, 167, 166, 165, 164, 126, 162, 161, 160, 159, 156, 155, 154, 153, 152, 151, 150, 149, 148, 147, 146, 145, 142, 141, 140, 139, 135, 134, 133, 126, 124, 221, 58, 221, 51, 119, 118, 113, 112, 105, 100, 99, 98, 81, 71, 59, 58, 53, 51, 221, 3, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221];
  Skew.yy_chk = [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 6, 6, 8, 11, 12, 15, 18, 16, 26, 26, 27, 27, 37, 20, 48, 36, 18, 25, 15, 16, 11, 20, 20, 47, 25, 25, 25, 36, 12, 37, 8, 21, 215, 21, 21, 21, 21, 22, 28, 22, 22, 22, 22, 214, 31, 21, 39, 28, 48, 28, 40, 22, 21, 39, 47, 21, 40, 43, 39, 43, 40, 22, 31, 21, 44, 52, 52, 54, 62, 78, 78, 21, 44, 89, 89, 31, 75, 75, 75, 75, 76, 211, 76, 76, 76, 76, 79, 79, 79, 101, 101, 77, 62, 77, 76, 54, 77, 77, 77, 77, 210, 117, 130, 130, 76, 117, 127, 127, 127, 127, 128, 128, 128, 128, 129, 129, 129, 129, 127, 131, 131, 131, 145, 145, 163, 209, 163, 208, 127, 163, 163, 163, 163, 187, 187, 187, 187, 188, 188, 188, 188, 222, 222, 222, 222, 223, 223, 223, 223, 224, 224, 224, 224, 225, 225, 226, 226, 226, 227, 227, 227, 227, 228, 228, 229, 229, 229, 207, 202, 200, 199, 197, 196, 195, 189, 186, 185, 184, 182, 181, 180, 179, 177, 176, 174, 173, 172, 171, 170, 168, 167, 166, 164, 162, 161, 160, 157, 156, 155, 154, 153, 152, 150, 149, 148, 147, 146, 144, 143, 142, 141, 139, 137, 135, 125, 121, 120, 119, 118, 116, 115, 114, 113, 112, 108, 107, 106, 105, 104, 103, 102, 100, 97, 96, 95, 85, 84, 83, 72, 65, 64, 57, 56, 51, 46, 45, 42, 41, 38, 35, 34, 33, 23, 19, 10, 9, 7, 5, 3, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221, 221];
  Skew.YY_JAM_STATE = 221;
  Skew.YY_ACCEPT_LENGTH = 222;
  Skew.REMOVE_NEWLINE_BEFORE = in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert({}, Skew.TokenKind.COLON, 0), Skew.TokenKind.COMMA, 0), Skew.TokenKind.DOT, 0), Skew.TokenKind.NEWLINE, 0), Skew.TokenKind.QUESTION_MARK, 0), Skew.TokenKind.RIGHT_BRACKET, 0), Skew.TokenKind.RIGHT_PARENTHESIS, 0);
  Skew.FORBID_XML_AFTER = in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert({}, Skew.TokenKind.CHARACTER, 0), Skew.TokenKind.DECREMENT, 0), Skew.TokenKind.DOUBLE, 0), Skew.TokenKind.DYNAMIC, 0), Skew.TokenKind.STRING_INTERPOLATION_END, 0), Skew.TokenKind.FALSE, 0), Skew.TokenKind.IDENTIFIER, 0), Skew.TokenKind.INCREMENT, 0), Skew.TokenKind.INT, 0), Skew.TokenKind.INT_BINARY, 0), Skew.TokenKind.INT_HEX, 0), Skew.TokenKind.INT_OCTAL, 0), Skew.TokenKind.NULL, 0), Skew.TokenKind.RIGHT_BRACE, 0), Skew.TokenKind.RIGHT_BRACKET, 0), Skew.TokenKind.RIGHT_PARENTHESIS, 0), Skew.TokenKind.STRING, 0), Skew.TokenKind.SUPER, 0), Skew.TokenKind.TRUE, 0);
  Skew.VERSION = '0.7.14';
  Skew.NATIVE_LIBRARY = '\nconst RELEASE = false\nconst ASSERTS = !RELEASE\n\nenum Target {\n  NONE\n  CPLUSPLUS\n  CSHARP\n  JAVASCRIPT\n}\n\nconst TARGET Target = .NONE\n\ndef @alwaysinline\ndef @deprecated\ndef @deprecated(message string)\ndef @entry\ndef @export\ndef @import\ndef @neverinline\ndef @prefer\ndef @rename(name string)\ndef @skip\ndef @spreads\n\n@spreads {\n  def @using(name string) # For use with C#\n  def @include(name string) # For use with C++\n}\n\n@import if TARGET == .NONE\n@skip if !ASSERTS\ndef assert(truth bool)\n\n@import if TARGET == .NONE\nnamespace Math {\n  @prefer\n  def abs(x double) double\n  def abs(x int) int\n\n  def acos(x double) double\n  def asin(x double) double\n  def atan(x double) double\n  def atan2(x double, y double) double\n\n  def sin(x double) double\n  def cos(x double) double\n  def tan(x double) double\n\n  def floor(x double) double\n  def ceil(x double) double\n  def round(x double) double\n\n  def exp(x double) double\n  def log(x double) double\n  def pow(x double, y double) double\n  def random double\n  def sqrt(x double) double\n\n  @prefer\n  def max(x double, y double) double\n  def max(x int, y int) int\n\n  @prefer\n  def min(x double, y double) double\n  def min(x int, y int) int\n\n  @prefer\n  def clamp(x double, min double, max double) double\n  def clamp(x int, min int, max int) int\n\n  def E double        { return 2.718281828459045 }\n  def INFINITY double { return 1 / 0.0 }\n  def NAN double      { return 0 / 0.0 }\n  def PI double       { return 3.141592653589793 }\n  def SQRT_2 double   { return 2 ** 0.5 }\n}\n\n@import\nclass bool {\n  def ! bool\n  def toString string\n}\n\n@import\nclass int {\n  def + int\n  def - int\n  def ~ int\n\n  def +(x int) int\n  def -(x int) int\n  def *(x int) int\n  def /(x int) int\n  def %(x int) int\n  def **(x int) int\n  def <=>(x int) int\n  def <<(x int) int\n  def >>(x int) int\n  def >>>(x int) int\n  def &(x int) int\n  def |(x int) int\n  def ^(x int) int\n\n  def <<=(x int) int\n  def >>=(x int) int\n  def &=(x int) int\n  def |=(x int) int\n  def ^=(x int) int\n\n  if TARGET != .CSHARP && TARGET != .CPLUSPLUS {\n    def >>>=(x int)\n  }\n\n  if TARGET != .JAVASCRIPT {\n    def ++ int\n    def -- int\n\n    def %=(x int) int\n    def +=(x int) int\n    def -=(x int) int\n    def *=(x int) int\n    def /=(x int) int\n  }\n\n  def toString string\n}\n\nnamespace int {\n  def MIN int { return -0x7FFFFFFF - 1 }\n  def MAX int { return 0x7FFFFFFF }\n}\n\n@import\nclass double {\n  def + double\n  def ++ double\n  def - double\n  def -- double\n\n  def *(x double) double\n  def +(x double) double\n  def -(x double) double\n  def /(x double) double\n  def **(x double) double\n  def <=>(x double) int\n\n  def *=(x double) double\n  def +=(x double) double\n  def -=(x double) double\n  def /=(x double) double\n\n  def isFinite bool\n  def isNaN bool\n\n  def toString string\n}\n\n@import\nclass string {\n  def +(x string) string\n  def +=(x string) string\n  def <=>(x string) int\n\n  def count int\n  def in(x string) bool\n  def indexOf(x string) int\n  def lastIndexOf(x string) int\n  def startsWith(x string) bool\n  def endsWith(x string) bool\n\n  def [](x int) int\n  def get(x int) string\n  def slice(start int) string\n  def slice(start int, end int) string\n  def codePoints List<int>\n  def codeUnits List<int>\n\n  def split(x string) List<string>\n  def join(x List<string>) string\n  def repeat(x int) string\n  def replaceAll(before string, after string) string\n\n  def toLowerCase string\n  def toUpperCase string\n  def toString string { return self }\n}\n\nnamespace string {\n  def fromCodePoint(x int) string\n  def fromCodePoints(x List<int>) string\n  def fromCodeUnit(x int) string\n  def fromCodeUnits(x List<int>) string\n}\n\n@import if TARGET == .NONE\nclass StringBuilder {\n  def new\n  def append(x string)\n  def toString string\n}\n\n@import\nclass List<T> {\n  def new\n  def [...](x T) List<T>\n\n  def [](x int) T\n  def []=(x int, y T) T\n\n  def count int\n  def isEmpty bool\n  def resize(count int, defaultValue T)\n\n  @prefer\n  def append(x T)\n  def append(x List<T>)\n  def appendOne(x T)\n\n  @prefer\n  def prepend(x T)\n  def prepend(x List<T>)\n\n  @prefer\n  def insert(x int, value T)\n  def insert(x int, values List<T>)\n\n  def removeAll(x T)\n  def removeAt(x int)\n  def removeDuplicates\n  def removeFirst\n  def removeIf(x fn(T) bool)\n  def removeLast\n  def removeOne(x T)\n  def removeRange(start int, end int)\n\n  def takeFirst T\n  def takeLast T\n  def takeAt(x int) T\n  def takeRange(start int, end int) List<T>\n\n  def first T\n  def first=(x T) T { return self[0] = x }\n  def last T\n  def last=(x T) T { return self[count - 1] = x }\n\n  def in(x T) bool\n  def indexOf(x T) int\n  def lastIndexOf(x T) int\n\n  def all(x fn(T) bool) bool\n  def any(x fn(T) bool) bool\n  def clone List<T>\n  def each(x fn(T))\n  def equals(x List<T>) bool\n  def filter(x fn(T) bool) List<T>\n  def map<R>(x fn(T) R) List<R>\n  def reverse\n  def shuffle\n  def slice(start int) List<T>\n  def slice(start int, end int) List<T>\n  def sort(x fn(T, T) int)\n  def swap(x int, y int)\n}\n\n@import\nclass StringMap<T> {\n  def new\n  def {...}(key string, value T) StringMap<T>\n\n  def [](key string) T\n  def []=(key string, value T) T\n\n  def count int\n  def isEmpty bool\n  def keys List<string>\n  def values List<T>\n\n  def clone StringMap<T>\n  def each(x fn(string, T))\n  def get(key string, defaultValue T) T\n  def in(key string) bool\n  def remove(key string)\n}\n\n@import\nclass IntMap<T> {\n  def new\n  def {...}(key int, value T) IntMap<T>\n\n  def [](key int) T\n  def []=(key int, value T) T\n\n  def count int\n  def isEmpty bool\n  def keys List<int>\n  def values List<T>\n\n  def clone IntMap<T>\n  def each(x fn(int, T))\n  def get(key int, defaultValue T) T\n  def in(key int) bool\n  def remove(key int)\n}\n\nclass Box<T> {\n  var value T\n}\n\n################################################################################\n# Implementations\n\nclass int {\n  def **(x int) int {\n    var y = self\n    var z = x < 0 ? 0 : 1\n    while x > 0 {\n      if (x & 1) != 0 { z *= y }\n      x >>= 1\n      y *= y\n    }\n    return z\n  }\n\n  def <=>(x int) int {\n    return ((x < self) as int) - ((x > self) as int)\n  }\n}\n\nclass double {\n  def **(x double) double {\n    return Math.pow(self, x)\n  }\n\n  def <=>(x double) int {\n    return ((x < self) as int) - ((x > self) as int)\n  }\n}\n\nclass List {\n  def resize(count int, defaultValue T) {\n    assert(count >= 0)\n    while self.count < count { append(defaultValue) }\n    while self.count > count { removeLast }\n  }\n\n  def removeAll(value T) {\n    var index = 0\n\n    # Remove elements in place\n    for i in 0..count {\n      if self[i] != value {\n        if index < i {\n          self[index] = self[i]\n        }\n        index++\n      }\n    }\n\n    # Shrink the array to the correct size\n    while index < count {\n      removeLast\n    }\n  }\n\n  def removeDuplicates {\n    var index = 0\n\n    # Remove elements in place\n    for i in 0..count {\n      var found = false\n      var value = self[i]\n      for j in 0..i {\n        if value == self[j] {\n          found = true\n          break\n        }\n      }\n      if !found {\n        if index < i {\n          self[index] = self[i]\n        }\n        index++\n      }\n    }\n\n    # Shrink the array to the correct size\n    while index < count {\n      removeLast\n    }\n  }\n\n  def shuffle {\n    var n = count\n    for i in 0..n - 1 {\n      swap(i, i + ((Math.random * (n - i)) as int))\n    }\n  }\n\n  def swap(i int, j int) {\n    assert(0 <= i && i < count)\n    assert(0 <= j && j < count)\n    var temp = self[i]\n    self[i] = self[j]\n    self[j] = temp\n  }\n}\n\nnamespace Math {\n  def clamp(x double, min double, max double) double {\n    return x < min ? min : x > max ? max : x\n  }\n\n  def clamp(x int, min int, max int) int {\n    return x < min ? min : x > max ? max : x\n  }\n}\n';
  Skew.NATIVE_LIBRARY_CPP = '\nnamespace Math {\n  @import {\n    def abs(x double) double\n    def abs(x int) int\n\n    def acos(x double) double\n    def asin(x double) double\n    def atan(x double) double\n    def atan2(x double, y double) double\n\n    def sin(x double) double\n    def cos(x double) double\n    def tan(x double) double\n\n    def floor(x double) double\n    def ceil(x double) double\n    def round(x double) double\n\n    def exp(x double) double\n    def log(x double) double\n    def pow(x double, y double) double\n    def sqrt(x double) double\n\n    def max(x double, y double) double\n    def max(x int, y int) int\n\n    def min(x double, y double) double\n    def min(x int, y int) int\n\n    def random double\n  }\n}\n\nclass bool {\n  def toString string {\n    return self ? "true" : "false"\n  }\n}\n\nclass int {\n  def toString string {\n    return dynamic.intToString(self)\n  }\n\n  def >>>(x int) int {\n    return (self as dynamic.unsigned >> x) as int\n  }\n}\n\nclass double {\n  def toString string {\n    return dynamic.doubleToString(self)\n  }\n\n  @include("<math.h>") {\n    def isNaN bool {\n      return dynamic.isnan(self)\n    }\n\n    def isFinite bool {\n      return dynamic.isfinite(self)\n    }\n  }\n}\n\nclass string {\n  @rename("compare")\n  def <=>(x string) int\n\n  @rename("contains")\n  def in(x string) bool\n}\n\nclass List {\n  @rename("contains")\n  def in(x T) bool\n}\n\nclass StringMap {\n  @rename("contains")\n  def in(x string) bool\n}\n\nclass IntMap {\n  @rename("contains")\n  def in(x int) bool\n}\n\n@import {\n  class StringBuilder {}\n  def assert(truth bool)\n}\n';
  Skew.NATIVE_LIBRARY_CS = '\n@using("System.Diagnostics")\ndef assert(truth bool) {\n  dynamic.Debug.Assert(truth)\n}\n\n@using("System")\nvar __random dynamic.Random = null\n\n@using("System")\n@import\nnamespace Math {\n  @rename("Abs") if TARGET == .CSHARP\n  def abs(x double) double\n  @rename("Abs") if TARGET == .CSHARP\n  def abs(x int) int\n\n  @rename("Acos") if TARGET == .CSHARP\n  def acos(x double) double\n  @rename("Asin") if TARGET == .CSHARP\n  def asin(x double) double\n  @rename("Atan") if TARGET == .CSHARP\n  def atan(x double) double\n  @rename("Atan2") if TARGET == .CSHARP\n  def atan2(x double, y double) double\n\n  @rename("Sin") if TARGET == .CSHARP\n  def sin(x double) double\n  @rename("Cos") if TARGET == .CSHARP\n  def cos(x double) double\n  @rename("Tan") if TARGET == .CSHARP\n  def tan(x double) double\n\n  @rename("Floor") if TARGET == .CSHARP\n  def floor(x double) double\n  @rename("Ceiling") if TARGET == .CSHARP\n  def ceil(x double) double\n  @rename("Round") if TARGET == .CSHARP\n  def round(x double) double\n\n  @rename("Exp") if TARGET == .CSHARP\n  def exp(x double) double\n  @rename("Log") if TARGET == .CSHARP\n  def log(x double) double\n  @rename("Pow") if TARGET == .CSHARP\n  def pow(x double, y double) double\n  @rename("Sqrt") if TARGET == .CSHARP\n  def sqrt(x double) double\n\n  @rename("Max") if TARGET == .CSHARP\n  def max(x double, y double) double\n  @rename("Max") if TARGET == .CSHARP\n  def max(x int, y int) int\n\n  @rename("Min") if TARGET == .CSHARP\n  def min(x double, y double) double\n  @rename("Min") if TARGET == .CSHARP\n  def min(x int, y int) int\n\n  def random double {\n    __random ?= dynamic.Random.new()\n    return __random.NextDouble()\n  }\n}\n\nclass double {\n  def isFinite bool {\n    return !isNaN && !dynamic.double.IsInfinity(self)\n  }\n\n  def isNaN bool {\n    return dynamic.double.IsNaN(self)\n  }\n}\n\n@using("System.Text")\n@import\nclass StringBuilder {\n  @rename("Append")\n  def append(x string)\n\n  @rename("ToString")\n  def toString string\n}\n\nclass bool {\n  @rename("ToString")\n  def toString string {\n    return self ? "true" : "false"\n  }\n}\n\nclass int {\n  @rename("ToString")\n  def toString string\n\n  def >>>(x int) int {\n    return dynamic.unchecked(self as dynamic.uint >> x) as int\n  }\n}\n\nclass double {\n  @rename("ToString")\n  def toString string\n}\n\nclass string {\n  @rename("CompareTo")\n  def <=>(x string) int\n\n  @rename("StartsWith")\n  def startsWith(x string) bool\n\n  @rename("EndsWith")\n  def endsWith(x string) bool\n\n  @rename("Contains")\n  def in(x string) bool\n\n  @rename("IndexOf")\n  def indexOf(x string) int\n\n  @rename("LastIndexOf")\n  def lastIndexOf(x string) int\n\n  @rename("Replace")\n  def replaceAll(before string, after string) string\n\n  @rename("Substring") {\n    def slice(start int) string\n    def slice(start int, end int) string\n  }\n\n  @rename("ToLower")\n  def toLowerCase string\n\n  @rename("ToUpper")\n  def toUpperCase string\n\n  def count int {\n    return (self as dynamic).Length\n  }\n\n  def get(index int) string {\n    return fromCodeUnit(self[index])\n  }\n\n  def repeat(times int) string {\n    var result = ""\n    for i in 0..times {\n      result += self\n    }\n    return result\n  }\n\n  @using("System.Linq")\n  @using("System")\n  def split(separator string) List<string> {\n    var separators = [separator]\n    return dynamic.Enumerable.ToList((self as dynamic).Split(dynamic.Enumerable.ToArray(separators as dynamic), dynamic.StringSplitOptions.None))\n  }\n\n  def join(parts List<string>) string {\n    return dynamic.string.Join(self, parts)\n  }\n\n  def slice(start int, end int) string {\n    return (self as dynamic).Substring(start, end - start)\n  }\n\n  def codeUnits List<int> {\n    var result List<int> = []\n    for i in 0..count {\n      result.append(self[i])\n    }\n    return result\n  }\n}\n\nnamespace string {\n  def fromCodeUnit(codeUnit int) string {\n    return dynamic.string.new(codeUnit as dynamic.char, 1)\n  }\n\n  def fromCodeUnits(codeUnits List<int>) string {\n    var builder = StringBuilder.new\n    for codeUnit in codeUnits {\n      builder.append(codeUnit as dynamic.char)\n    }\n    return builder.toString\n  }\n}\n\n@using("System.Collections.Generic")\nclass List {\n  @rename("Contains")\n  def in(x T) bool\n\n  @rename("Add")\n  def append(value T)\n\n  @rename("AddRange")\n  def append(value List<T>)\n\n  def sort(x fn(T, T) int) {\n    # C# doesn\'t allow an anonymous function to be passed directly\n    (self as dynamic).Sort((a T, b T) => x(a, b))\n  }\n\n  @rename("Reverse")\n  def reverse\n\n  @rename("RemoveAll")\n  def removeIf(x fn(T) bool)\n\n  @rename("RemoveAt")\n  def removeAt(x int)\n\n  @rename("Remove")\n  def removeOne(x T)\n\n  @rename("TrueForAll")\n  def all(x fn(T) bool) bool\n\n  @rename("ForEach")\n  def each(x fn(T))\n\n  @rename("FindAll")\n  def filter(x fn(T) bool) List<T>\n\n  @rename("ConvertAll")\n  def map<R>(x fn(T) R) List<R>\n\n  @rename("IndexOf")\n  def indexOf(x T) int\n\n  @rename("LastIndexOf")\n  def lastIndexOf(x T) int\n\n  @rename("Insert")\n  def insert(x int, value T)\n\n  @rename("InsertRange")\n  def insert(x int, value List<T>)\n\n  def appendOne(x T) {\n    if !(x in self) {\n      append(x)\n    }\n  }\n\n  def removeRange(start int, end int) {\n    (self as dynamic).RemoveRange(start, end - start)\n  }\n\n  @using("System.Linq") {\n    @rename("SequenceEqual")\n    def equals(x List<T>) bool\n\n    @rename("First")\n    def first T\n\n    @rename("Last")\n    def last T\n  }\n\n  def any(callback fn(T) bool) bool {\n    return !all(x => !callback(x))\n  }\n\n  def isEmpty bool {\n    return count == 0\n  }\n\n  def count int {\n    return (self as dynamic).Count\n  }\n\n  def prepend(value T) {\n    insert(0, value)\n  }\n\n  def prepend(values List<T>) {\n    var count = values.count\n    for i in 0..count {\n      prepend(values[count - i - 1])\n    }\n  }\n\n  def removeFirst {\n    removeAt(0)\n  }\n\n  def removeLast {\n    removeAt(count - 1)\n  }\n\n  def takeFirst T {\n    var value = first\n    removeFirst\n    return value\n  }\n\n  def takeLast T {\n    var value = last\n    removeLast\n    return value\n  }\n\n  def takeAt(x int) T {\n    var value = self[x]\n    removeAt(x)\n    return value\n  }\n\n  def takeRange(start int, end int) List<T> {\n    var value = slice(start, end)\n    removeRange(start, end)\n    return value\n  }\n\n  def slice(start int) List<T> {\n    return slice(start, count)\n  }\n\n  def slice(start int, end int) List<T> {\n    return (self as dynamic).GetRange(start, end - start)\n  }\n\n  def clone List<T> {\n    var clone = new\n    clone.append(self)\n    return clone\n  }\n}\n\n@using("System.Collections.Generic")\n@rename("Dictionary")\nclass StringMap {\n  @rename("Count")\n  def count int\n\n  @rename("ContainsKey")\n  def in(key string) bool\n\n  @rename("Remove")\n  def remove(key string)\n\n  def isEmpty bool {\n    return count == 0\n  }\n\n  def {...}(key string, value T) StringMap<T> {\n    (self as dynamic).Add(key, value)\n    return self\n  }\n\n  def get(key string, value T) T {\n    return key in self ? self[key] : value\n  }\n\n  def keys List<string> {\n    return dynamic.System.Linq.Enumerable.ToList((self as dynamic).Keys)\n  }\n\n  def values List<T> {\n    return dynamic.System.Linq.Enumerable.ToList((self as dynamic).Values)\n  }\n\n  def clone StringMap<T> {\n    var clone = new\n    for key in keys {\n      clone[key] = self[key]\n    }\n    return clone\n  }\n\n  def each(x fn(string, T)) {\n    for pair in self as dynamic {\n      x(pair.Key, pair.Value)\n    }\n  }\n}\n\n@using("System.Collections.Generic")\n@rename("Dictionary")\nclass IntMap {\n  @rename("Count")\n  def count int\n\n  @rename("ContainsKey")\n  def in(key int) bool\n\n  @rename("Remove")\n  def remove(key int)\n\n  def isEmpty bool {\n    return count == 0\n  }\n\n  def {...}(key int, value T) IntMap<T> {\n    (self as dynamic).Add(key, value)\n    return self\n  }\n\n  def get(key int, value T) T {\n    return key in self ? self[key] : value\n  }\n\n  def keys List<int> {\n    return dynamic.System.Linq.Enumerable.ToList((self as dynamic).Keys)\n  }\n\n  def values List<T> {\n    return dynamic.System.Linq.Enumerable.ToList((self as dynamic).Values)\n  }\n\n  def clone IntMap<T> {\n    var clone = new\n    for key in keys {\n      clone[key] = self[key]\n    }\n    return clone\n  }\n\n  def each(x fn(int, T)) {\n    for pair in self as dynamic {\n      x(pair.Key, pair.Value)\n    }\n  }\n}\n';
  Skew.NATIVE_LIBRARY_JS = '\nconst __extends = (derived dynamic, base dynamic) => {\n  derived.prototype = dynamic.Object.create(base.prototype)\n  derived.prototype.constructor = derived\n}\n\nconst __imul fn(int, int) int = dynamic.Math.imul ? dynamic.Math.imul : (a, b) => {\n  return ((a as dynamic) * (b >>> 16) << 16) + (a as dynamic) * (b & 65535) | 0\n}\n\nconst __prototype dynamic\nconst __isInt = (value dynamic) => value == (value | 0)\nconst __isBool = (value dynamic) => value == !!value\nconst __isDouble = (value dynamic) => value == +value || dynamic.isNaN(value)\nconst __isString = (value dynamic) => dynamic.typeof(value) == "string"\nconst __asString = (value dynamic) => value == null ? value : value + ""\n\ndef assert(truth bool) {\n  if !truth {\n    throw dynamic.Error("Assertion failed")\n  }\n}\n\n@import\nnamespace Math {}\n\nclass double {\n  def isFinite bool {\n    return dynamic.isFinite(self)\n  }\n\n  def isNaN bool {\n    return dynamic.isNaN(self)\n  }\n}\n\nclass string {\n  def <=>(x string) int {\n    return ((x as dynamic < self) as int) - ((x as dynamic > self) as int)\n  }\n\n  def slice(start int) string {\n    assert(0 <= start && start <= count)\n    return (self as dynamic).slice(start)\n  }\n\n  def slice(start int, end int) string {\n    assert(0 <= start && start <= end && end <= count)\n    return (self as dynamic).slice(start, end)\n  }\n\n  def startsWith(text string) bool {\n    return count >= text.count && slice(0, text.count) == text\n  }\n\n  def endsWith(text string) bool {\n    return count >= text.count && slice(count - text.count) == text\n  }\n\n  def replaceAll(before string, after string) string {\n    return after.join(self.split(before))\n  }\n\n  def in(value string) bool {\n    return indexOf(value) != -1\n  }\n\n  def count int {\n    return (self as dynamic).length\n  }\n\n  def [](index int) int {\n    assert(0 <= index && index < count)\n    return (self as dynamic).charCodeAt(index)\n  }\n\n  def get(index int) string {\n    assert(0 <= index && index < count)\n    return (self as dynamic)[index]\n  }\n\n  def repeat(times int) string {\n    var result = ""\n    for i in 0..times {\n      result += self\n    }\n    return result\n  }\n\n  def join(parts List<string>) string {\n    return (parts as dynamic).join(self)\n  }\n\n  def codeUnits List<int> {\n    var result List<int> = []\n    for i in 0..count {\n      result.append(self[i])\n    }\n    return result\n  }\n}\n\nnamespace string {\n  def fromCodeUnit(codeUnit int) string {\n    return dynamic.String.fromCharCode(codeUnit)\n  }\n\n  def fromCodeUnits(codeUnits List<int>) string {\n    var result = ""\n    for codeUnit in codeUnits {\n      result += string.fromCodeUnit(codeUnit)\n    }\n    return result\n  }\n}\n\nclass StringBuilder {\n  var buffer = ""\n\n  def new {\n  }\n\n  def append(x string) {\n    buffer += x\n  }\n\n  def toString string {\n    return buffer\n  }\n}\n\n@rename("Array")\nclass List {\n  @rename("unshift")\n  def prepend(x T)\n\n  @rename("push")\n  def append(x T)\n\n  @rename("every") if TARGET == .JAVASCRIPT\n  def all(x fn(T) bool) bool\n\n  @rename("some") if TARGET == .JAVASCRIPT\n  def any(x fn(T) bool) bool\n\n  @rename("slice") if TARGET == .JAVASCRIPT\n  def clone List<T>\n\n  @rename("forEach") if TARGET == .JAVASCRIPT\n  def each(x fn(T))\n\n  def slice(start int) List<T> {\n    assert(0 <= start && start <= count)\n    return (self as dynamic).slice(start)\n  }\n\n  def slice(start int, end int) List<T> {\n    assert(0 <= start && start <= end && end <= count)\n    return (self as dynamic).slice(start, end)\n  }\n\n  def [](index int) T {\n    assert(0 <= index && index < count)\n    return (self as dynamic)[index]\n  }\n\n  def []=(index int, value T) T {\n    assert(0 <= index && index < count)\n    return (self as dynamic)[index] = value\n  }\n\n  def in(value T) bool {\n    return indexOf(value) != -1\n  }\n\n  def isEmpty bool {\n    return count == 0\n  }\n\n  def count int {\n    return (self as dynamic).length\n  }\n\n  def first T {\n    assert(!isEmpty)\n    return self[0]\n  }\n\n  def last T {\n    assert(!isEmpty)\n    return self[count - 1]\n  }\n\n  def prepend(values List<T>) {\n    assert(values != self)\n    var count = values.count\n    for i in 0..count {\n      prepend(values[count - i - 1])\n    }\n  }\n\n  def append(values List<T>) {\n    assert(values != self)\n    for value in values {\n      append(value)\n    }\n  }\n\n  def insert(index int, values List<T>) {\n    assert(values != self)\n    for value in values {\n      insert(index, value)\n      index++\n    }\n  }\n\n  def insert(index int, value T) {\n    assert(0 <= index && index <= count)\n    (self as dynamic).splice(index, 0, value)\n  }\n\n  def removeFirst {\n    assert(!isEmpty)\n    (self as dynamic).shift()\n  }\n\n  def takeFirst T {\n    assert(!isEmpty)\n    return (self as dynamic).shift()\n  }\n\n  def removeLast {\n    assert(!isEmpty)\n    (self as dynamic).pop()\n  }\n\n  def takeLast T {\n    assert(!isEmpty)\n    return (self as dynamic).pop()\n  }\n\n  def removeAt(index int) {\n    assert(0 <= index && index < count)\n    (self as dynamic).splice(index, 1)\n  }\n\n  def takeAt(index int) T {\n    assert(0 <= index && index < count)\n    return (self as dynamic).splice(index, 1)[0]\n  }\n\n  def takeRange(start int, end int) List<T> {\n    assert(0 <= start && start <= end && end <= count)\n    return (self as dynamic).splice(start, end - start)\n  }\n\n  def appendOne(value T) {\n    if !(value in self) {\n      append(value)\n    }\n  }\n\n  def removeOne(value T) {\n    var index = indexOf(value)\n    if index >= 0 {\n      removeAt(index)\n    }\n  }\n\n  def removeRange(start int, end int) {\n    assert(0 <= start && start <= end && end <= count)\n    (self as dynamic).splice(start, end - start)\n  }\n\n  def removeIf(callback fn(T) bool) {\n    var index = 0\n\n    # Remove elements in place\n    for i in 0..count {\n      if !callback(self[i]) {\n        if index < i {\n          self[index] = self[i]\n        }\n        index++\n      }\n    }\n\n    # Shrink the array to the correct size\n    while index < count {\n      removeLast\n    }\n  }\n\n  def equals(other List<T>) bool {\n    if count != other.count {\n      return false\n    }\n    for i in 0..count {\n      if self[i] != other[i] {\n        return false\n      }\n    }\n    return true\n  }\n}\n\nnamespace List {\n  def new List<T> {\n    return [] as dynamic\n  }\n}\n\nnamespace StringMap {\n  def new StringMap<T> {\n    return dynamic.Object.create(null)\n  }\n}\n\nclass StringMap {\n  def [](key string) T {\n    assert(key in self)\n    return (self as dynamic)[key]\n  }\n\n  def {...}(key string, value T) StringMap<T> {\n    self[key] = value\n    return self\n  }\n\n  def count int {\n    return keys.count\n  }\n\n  def isEmpty bool {\n    for key in self as dynamic {\n      return false\n    }\n    return true\n  }\n\n  def get(key string, defaultValue T) T {\n    var value = (self as dynamic)[key]\n    return value != dynamic.void(0) ? value : defaultValue # Compare against undefined so the key is only hashed once for speed\n  }\n\n  def keys List<string> {\n    return dynamic.Object.keys(self)\n  }\n\n  def values List<T> {\n    var values List<T> = []\n    for key in self as dynamic {\n      values.append(self[key])\n    }\n    return values\n  }\n\n  def clone StringMap<T> {\n    var clone = new\n    for key in keys {\n      clone[key] = self[key]\n    }\n    return clone\n  }\n\n  def remove(key string) {\n    dynamic.delete((self as dynamic)[key])\n  }\n\n  def each(x fn(string, T)) {\n    for key in self as dynamic {\n      x(key, self[key])\n    }\n  }\n}\n\nnamespace IntMap {\n  def new IntMap<T> {\n    return {} as dynamic\n  }\n}\n\nclass IntMap {\n  def [](key int) T {\n    assert(key in self)\n    return (self as dynamic)[key]\n  }\n\n  def {...}(key int, value T) IntMap<T> {\n    self[key] = value\n    return self\n  }\n\n  def count int {\n    return values.count\n  }\n\n  def isEmpty bool {\n    for key in self as dynamic {\n      return false\n    }\n    return true\n  }\n\n  def get(key int, defaultValue T) T {\n    var value = (self as dynamic)[key]\n    return value != dynamic.void(0) ? value : defaultValue # Compare against undefined so the key is only hashed once for speed\n  }\n\n  def keys List<int> {\n    var keys List<int> = []\n    for key in self as dynamic {\n      keys.append(key as int)\n    }\n    return keys\n  }\n\n  def values List<T> {\n    var values List<T> = []\n    for key in self as dynamic {\n      values.append(self[key])\n    }\n    return values\n  }\n\n  def clone IntMap<T> {\n    var clone = new\n    for key in keys {\n      clone[key] = self[key]\n    }\n    return clone\n  }\n\n  def remove(key int) {\n    dynamic.delete((self as dynamic)[key])\n  }\n\n  def each(x fn(int, T)) {\n    for key in self as dynamic {\n      x(key as int, self[key])\n    }\n  }\n}\n';
  Skew.UNICODE_LIBRARY = '\nnamespace Unicode {\n  enum Encoding {\n    UTF8\n    UTF16\n    UTF32\n  }\n\n  const STRING_ENCODING Encoding =\n    TARGET == .CPLUSPLUS ? .UTF8 :\n    TARGET == .CSHARP || TARGET == .JAVASCRIPT ? .UTF16 :\n    .UTF32\n\n  class StringIterator {\n    var value = ""\n    var index = 0\n    var stop = 0\n\n    def reset(text string, start int) StringIterator {\n      value = text\n      index = start\n      stop = text.count\n      return self\n    }\n\n    def countCodePointsUntil(stop int) int {\n      var count = 0\n      while index < stop && nextCodePoint >= 0 {\n        count++\n      }\n      return count\n    }\n\n    if STRING_ENCODING == .UTF8 {\n      def nextCodePoint int {\n        if index >= stop { return -1 }\n        var a = value[index++]\n        if a < 0xC0 { return a }\n        if index >= stop { return -1 }\n        var b = value[index++]\n        if a < 0xE0 { return ((a & 0x1F) << 6) | (b & 0x3F) }\n        if index >= stop { return -1 }\n        var c = value[index++]\n        if a < 0xF0 { return ((a & 0x0F) << 12) | ((b & 0x3F) << 6) | (c & 0x3F) }\n        if index >= stop { return -1 }\n        var d = value[index++]\n        return ((a & 0x07) << 18) | ((b & 0x3F) << 12) | ((c & 0x3F) << 6) | (d & 0x3F)\n      }\n    }\n\n    else if STRING_ENCODING == .UTF16 {\n      def nextCodePoint int {\n        if index >= stop { return -1 }\n        var a = value[index++]\n        if a < 0xD800 || a >= 0xDC00 { return a }\n        if index >= stop { return -1 }\n        var b = value[index++]\n        return (a << 10) + b + (0x10000 - (0xD800 << 10) - 0xDC00)\n      }\n    }\n\n    else {\n      def nextCodePoint int {\n        if index >= stop { return -1 }\n        return value[index++]\n      }\n    }\n  }\n\n  namespace StringIterator {\n    const INSTANCE = StringIterator.new\n  }\n\n  def codeUnitCountForCodePoints(codePoints List<int>, encoding Encoding) int {\n    var count = 0\n\n    switch encoding {\n      case .UTF8 {\n        for codePoint in codePoints {\n          if codePoint < 0x80 { count++ }\n          else if codePoint < 0x800 { count += 2 }\n          else if codePoint < 0x10000 { count += 3 }\n          else { count += 4 }\n        }\n      }\n\n      case .UTF16 {\n        for codePoint in codePoints {\n          if codePoint < 0x10000 { count++ }\n          else { count += 2 }\n        }\n      }\n\n      case .UTF32 {\n        count = codePoints.count\n      }\n    }\n\n    return count\n  }\n}\n\nclass string {\n  if Unicode.STRING_ENCODING == .UTF32 {\n    def codePoints List<int> {\n      return codeUnits\n    }\n  }\n\n  else {\n    def codePoints List<int> {\n      var codePoints List<int> = []\n      var instance = Unicode.StringIterator.INSTANCE\n      instance.reset(self, 0)\n\n      while true {\n        var codePoint = instance.nextCodePoint\n        if codePoint < 0 {\n          return codePoints\n        }\n        codePoints.append(codePoint)\n      }\n    }\n  }\n}\n\nnamespace string {\n  def fromCodePoints(codePoints List<int>) string {\n    var builder = StringBuilder.new\n    for codePoint in codePoints {\n      builder.append(fromCodePoint(codePoint))\n    }\n    return builder.toString\n  }\n\n  if Unicode.STRING_ENCODING == .UTF8 {\n    def fromCodePoint(codePoint int) string {\n      return\n        codePoint < 0x80 ? fromCodeUnit(codePoint) : (\n          codePoint < 0x800 ? fromCodeUnit(((codePoint >> 6) & 0x1F) | 0xC0) : (\n            codePoint < 0x10000 ? fromCodeUnit(((codePoint >> 12) & 0x0F) | 0xE0) : (\n              fromCodeUnit(((codePoint >> 18) & 0x07) | 0xF0)\n            ) + fromCodeUnit(((codePoint >> 12) & 0x3F) | 0x80)\n          ) + fromCodeUnit(((codePoint >> 6) & 0x3F) | 0x80)\n        ) + fromCodeUnit((codePoint & 0x3F) | 0x80)\n    }\n  }\n\n  else if Unicode.STRING_ENCODING == .UTF16 {\n    def fromCodePoint(codePoint int) string {\n      return codePoint < 0x10000 ? fromCodeUnit(codePoint) :\n        fromCodeUnit(((codePoint - 0x10000) >> 10) + 0xD800) +\n        fromCodeUnit(((codePoint - 0x10000) & ((1 << 10) - 1)) + 0xDC00)\n    }\n  }\n\n  else {\n    def fromCodePoint(codePoint int) string {\n      return fromCodeUnit(codePoint)\n    }\n  }\n}\n';
  Skew.DEFAULT_MESSAGE_LIMIT = 10;
  Skew.VALID_TARGETS = in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(Object.create(null), 'cpp', new Skew.CPlusPlusTarget()), 'cs', new Skew.CSharpTarget()), 'js', new Skew.JavaScriptTarget()), 'lisp-tree', new Skew.LispTreeTarget());
  Skew.CSharpEmitter._isKeyword = in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(Object.create(null), 'abstract', 0), 'as', 0), 'base', 0), 'bool', 0), 'break', 0), 'byte', 0), 'case', 0), 'catch', 0), 'char', 0), 'checked', 0), 'class', 0), 'const', 0), 'continue', 0), 'decimal', 0), 'default', 0), 'delegate', 0), 'do', 0), 'double', 0), 'else', 0), 'enum', 0), 'event', 0), 'explicit', 0), 'extern', 0), 'false', 0), 'finally', 0), 'fixed', 0), 'float', 0), 'for', 0), 'foreach', 0), 'goto', 0), 'if', 0), 'implicit', 0), 'in', 0), 'int', 0), 'interface', 0), 'internal', 0), 'is', 0), 'lock', 0), 'long', 0), 'namespace', 0), 'new', 0), 'null', 0), 'object', 0), 'operator', 0), 'out', 0), 'override', 0), 'params', 0), 'private', 0), 'protected', 0), 'public', 0), 'readonly', 0), 'ref', 0), 'return', 0), 'sbyte', 0), 'sealed', 0), 'short', 0), 'sizeof', 0), 'stackalloc', 0), 'static', 0), 'string', 0), 'struct', 0), 'switch', 0), 'this', 0), 'throw', 0), 'true', 0), 'try', 0), 'typeof', 0), 'uint', 0), 'ulong', 0), 'unchecked', 0), 'unsafe', 0), 'ushort', 0), 'using', 0), 'virtual', 0), 'void', 0), 'volatile', 0), 'while', 0);
  Skew.CPlusPlusEmitter._isKeyword = in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(Object.create(null), 'alignas', 0), 'alignof', 0), 'and', 0), 'and_eq', 0), 'asm', 0), 'auto', 0), 'bitand', 0), 'bitor', 0), 'bool', 0), 'break', 0), 'case', 0), 'catch', 0), 'char', 0), 'char16_t', 0), 'char32_t', 0), 'class', 0), 'compl', 0), 'const', 0), 'const_cast', 0), 'constexpr', 0), 'continue', 0), 'decltype', 0), 'default', 0), 'delete', 0), 'do', 0), 'double', 0), 'dynamic_cast', 0), 'else', 0), 'enum', 0), 'explicit', 0), 'export', 0), 'extern', 0), 'false', 0), 'float', 0), 'for', 0), 'friend', 0), 'goto', 0), 'if', 0), 'INFINITY', 0), 'inline', 0), 'int', 0), 'long', 0), 'mutable', 0), 'namespace', 0), 'NAN', 0), 'new', 0), 'noexcept', 0), 'not', 0), 'not_eq', 0), 'NULL', 0), 'nullptr', 0), 'operator', 0), 'or', 0), 'or_eq', 0), 'private', 0), 'protected', 0), 'public', 0), 'register', 0), 'reinterpret_cast', 0), 'return', 0), 'short', 0), 'signed', 0), 'sizeof', 0), 'static', 0), 'static_assert', 0), 'static_cast', 0), 'struct', 0), 'switch', 0), 'template', 0), 'this', 0), 'thread_local', 0), 'throw', 0), 'true', 0), 'try', 0), 'typedef', 0), 'typeid', 0), 'typename', 0), 'union', 0), 'unsigned', 0), 'using', 0), 'virtual', 0), 'void', 0), 'volatile', 0), 'wchar_t', 0), 'while', 0), 'xor', 0), 'xor_eq', 0);
  Skew.JavaScriptEmitter._first = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$';
  Skew.JavaScriptEmitter._rest = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$0123456789';
  Skew.JavaScriptEmitter._isFunctionProperty = in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(Object.create(null), 'apply', 0), 'call', 0), 'length', 0), 'name', 0);
  Skew.JavaScriptEmitter._isKeyword = in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(Object.create(null), 'arguments', 0), 'await', 0), 'Boolean', 0), 'break', 0), 'case', 0), 'catch', 0), 'class', 0), 'const', 0), 'constructor', 0), 'continue', 0), 'Date', 0), 'debugger', 0), 'default', 0), 'delete', 0), 'do', 0), 'double', 0), 'else', 0), 'enum', 0), 'eval', 0), 'export', 0), 'extends', 0), 'false', 0), 'finally', 0), 'float', 0), 'for', 0), 'function', 0), 'Function', 0), 'if', 0), 'implements', 0), 'import', 0), 'in', 0), 'instanceof', 0), 'int', 0), 'interface', 0), 'let', 0), 'new', 0), 'null', 0), 'Number', 0), 'Object', 0), 'package', 0), 'private', 0), 'protected', 0), 'public', 0), 'return', 0), 'static', 0), 'String', 0), 'super', 0), 'switch', 0), 'this', 0), 'throw', 0), 'true', 0), 'try', 0), 'typeof', 0), 'var', 0), 'void', 0), 'while', 0), 'with', 0), 'yield', 0);
  Skew.JavaScriptEmitter._keywordCallMap = in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(Object.create(null), 'delete', 0), 'typeof', 0), 'void', 0);
  Skew.JavaScriptEmitter._specialVariableMap = in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(Object.create(null), '__asString', Skew.JavaScriptEmitter.SpecialVariable.AS_STRING), '__extends', Skew.JavaScriptEmitter.SpecialVariable.EXTENDS), '__imul', Skew.JavaScriptEmitter.SpecialVariable.MULTIPLY), '__isBool', Skew.JavaScriptEmitter.SpecialVariable.IS_BOOL), '__isDouble', Skew.JavaScriptEmitter.SpecialVariable.IS_DOUBLE), '__isInt', Skew.JavaScriptEmitter.SpecialVariable.IS_INT), '__isString', Skew.JavaScriptEmitter.SpecialVariable.IS_STRING), '__prototype', Skew.JavaScriptEmitter.SpecialVariable.PROTOTYPE);
  Skew.Node._nextID = 0;
  Skew.Symbol._nextID = 0;
  Skew.Parsing.expressionParser = null;
  Skew.Parsing.typeParser = null;
  Skew.Parsing.identifierToSymbolKind = in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(Object.create(null), 'class', Skew.SymbolKind.OBJECT_CLASS), 'def', Skew.SymbolKind.FUNCTION_GLOBAL), 'enum', Skew.SymbolKind.OBJECT_ENUM), 'flags', Skew.SymbolKind.OBJECT_FLAGS), 'interface', Skew.SymbolKind.OBJECT_INTERFACE), 'namespace', Skew.SymbolKind.OBJECT_NAMESPACE), 'over', Skew.SymbolKind.FUNCTION_GLOBAL), 'type', Skew.SymbolKind.OBJECT_WRAPPED);
  Skew.Parsing.customOperators = in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert({}, Skew.TokenKind.ASSIGN_BITWISE_AND, 0), Skew.TokenKind.ASSIGN_BITWISE_OR, 0), Skew.TokenKind.ASSIGN_BITWISE_XOR, 0), Skew.TokenKind.ASSIGN_DIVIDE, 0), Skew.TokenKind.ASSIGN_INDEX, 0), Skew.TokenKind.ASSIGN_MINUS, 0), Skew.TokenKind.ASSIGN_MULTIPLY, 0), Skew.TokenKind.ASSIGN_PLUS, 0), Skew.TokenKind.ASSIGN_POWER, 0), Skew.TokenKind.ASSIGN_REMAINDER, 0), Skew.TokenKind.ASSIGN_SHIFT_LEFT, 0), Skew.TokenKind.ASSIGN_SHIFT_RIGHT, 0), Skew.TokenKind.ASSIGN_UNSIGNED_SHIFT_RIGHT, 0), Skew.TokenKind.BITWISE_AND, 0), Skew.TokenKind.BITWISE_OR, 0), Skew.TokenKind.BITWISE_XOR, 0), Skew.TokenKind.COMPARE, 0), Skew.TokenKind.DECREMENT, 0), Skew.TokenKind.DIVIDE, 0), Skew.TokenKind.IN, 0), Skew.TokenKind.INCREMENT, 0), Skew.TokenKind.INDEX, 0), Skew.TokenKind.LIST, 0), Skew.TokenKind.MINUS, 0), Skew.TokenKind.MULTIPLY, 0), Skew.TokenKind.NOT, 0), Skew.TokenKind.PLUS, 0), Skew.TokenKind.POWER, 0), Skew.TokenKind.REMAINDER, 0), Skew.TokenKind.SET, 0), Skew.TokenKind.SHIFT_LEFT, 0), Skew.TokenKind.SHIFT_RIGHT, 0), Skew.TokenKind.TILDE, 0), Skew.TokenKind.UNSIGNED_SHIFT_RIGHT, 0), Skew.TokenKind.XML_CHILD, 0);
  Skew.Parsing.forbiddenCustomOperators = in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert({}, Skew.TokenKind.ASSIGN, Skew.Parsing.ForbiddenGroup.ASSIGN), Skew.TokenKind.EQUAL, Skew.Parsing.ForbiddenGroup.EQUAL), Skew.TokenKind.GREATER_THAN, Skew.Parsing.ForbiddenGroup.COMPARE), Skew.TokenKind.GREATER_THAN_OR_EQUAL, Skew.Parsing.ForbiddenGroup.COMPARE), Skew.TokenKind.LESS_THAN, Skew.Parsing.ForbiddenGroup.COMPARE), Skew.TokenKind.LESS_THAN_OR_EQUAL, Skew.Parsing.ForbiddenGroup.COMPARE), Skew.TokenKind.LOGICAL_AND, Skew.Parsing.ForbiddenGroup.LOGICAL), Skew.TokenKind.LOGICAL_OR, Skew.Parsing.ForbiddenGroup.LOGICAL), Skew.TokenKind.NOT_EQUAL, Skew.Parsing.ForbiddenGroup.EQUAL);

  // These are prefixed with "the operator \"...\" is not customizable because "
  Skew.Parsing.forbiddenGroupDescription = in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert({}, Skew.Parsing.ForbiddenGroup.ASSIGN, 'value types are not supported by the language'), Skew.Parsing.ForbiddenGroup.COMPARE, 'it\'s automatically implemented using the "<=>" operator (customize the "<=>" operator instead)'), Skew.Parsing.ForbiddenGroup.EQUAL, "that wouldn't work with generics, which are implemented with type erasure"), Skew.Parsing.ForbiddenGroup.LOGICAL, 'of its special short-circuit evaluation behavior');
  Skew.Parsing.assignmentOperators = in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert({}, Skew.TokenKind.ASSIGN, Skew.NodeKind.ASSIGN), Skew.TokenKind.ASSIGN_BITWISE_AND, Skew.NodeKind.ASSIGN_BITWISE_AND), Skew.TokenKind.ASSIGN_BITWISE_OR, Skew.NodeKind.ASSIGN_BITWISE_OR), Skew.TokenKind.ASSIGN_BITWISE_XOR, Skew.NodeKind.ASSIGN_BITWISE_XOR), Skew.TokenKind.ASSIGN_DIVIDE, Skew.NodeKind.ASSIGN_DIVIDE), Skew.TokenKind.ASSIGN_MINUS, Skew.NodeKind.ASSIGN_SUBTRACT), Skew.TokenKind.ASSIGN_MULTIPLY, Skew.NodeKind.ASSIGN_MULTIPLY), Skew.TokenKind.ASSIGN_PLUS, Skew.NodeKind.ASSIGN_ADD), Skew.TokenKind.ASSIGN_POWER, Skew.NodeKind.ASSIGN_POWER), Skew.TokenKind.ASSIGN_REMAINDER, Skew.NodeKind.ASSIGN_REMAINDER), Skew.TokenKind.ASSIGN_SHIFT_LEFT, Skew.NodeKind.ASSIGN_SHIFT_LEFT), Skew.TokenKind.ASSIGN_SHIFT_RIGHT, Skew.NodeKind.ASSIGN_SHIFT_RIGHT), Skew.TokenKind.ASSIGN_UNSIGNED_SHIFT_RIGHT, Skew.NodeKind.ASSIGN_UNSIGNED_SHIFT_RIGHT);
  Skew.Parsing.dotInfixParselet = function(context, left) {
    context.next();
    var range = context.current().range;

    if (!context.expect(Skew.TokenKind.IDENTIFIER)) {
      return context.createParseError();
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
        var colon = context.current();

        if (!expectColon) {
          node.appendChild(first);
        }

        else {
          if (!context.expect(Skew.TokenKind.COLON)) {
            break;
          }

          var second = Skew.Parsing.expressionParser.parse(context, Skew.Precedence.LOWEST);
          first = Skew.Node.createPair(first, second).withRange(Skew.Range.span(first.range, second.range)).withInternalRange(colon.range);
          node.appendChild(first);
        }

        first.comments = comments;

        if (!context.eat(Skew.TokenKind.COMMA)) {
          break;
        }
      }

      context.skipWhitespace();
      Skew.Parsing.scanForToken(context, end);
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
      value.appendChild(type);

      if (!context.eat(Skew.TokenKind.COMMA)) {
        break;
      }
    }

    Skew.Parsing.scanForToken(context, Skew.TokenKind.PARAMETER_LIST_END);
    return value.withRange(context.spanSince(left.range)).withInternalRange(context.spanSince(token.range));
  };
  Skew.LambdaConversion.Scope._nextID = 0;
  Skew.Renaming.unaryPrefixes = in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(Object.create(null), '!', 'not'), '+', 'positive'), '++', 'increment'), '-', 'negative'), '--', 'decrement'), '~', 'complement');
  Skew.Renaming.prefixes = in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(Object.create(null), '%', 'remainder'), '&', 'and'), '*', 'multiply'), '**', 'power'), '+', 'add'), '-', 'subtract'), '/', 'divide'), '<<', 'leftShift'), '<=>', 'compare'), '>>', 'rightShift'), '>>>', 'unsignedRightShift'), '^', 'xor'), '|', 'or'), 'in', 'contains'), '%=', 'remainderUpdate'), '&=', 'andUpdate'), '**=', 'powerUpdate'), '*=', 'multiplyUpdate'), '+=', 'addUpdate'), '-=', 'subtractUpdate'), '/=', 'divideUpdate'), '<<=', 'leftShiftUpdate'), '>>=', 'rightShiftUpdate'), '^=', 'xorUpdate'), '|=', 'orUpdate'), '[]', 'get'), '[]=', 'set'), '<>...</>', 'append'), '[...]', 'append'), '[new]', 'new'), '{...}', 'insert'), '{new}', 'new');
  Skew.Resolving.Resolver._annotationSymbolFlags = in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(in_StringMap.insert(Object.create(null), '@alwaysinline', Skew.SymbolFlags.IS_INLINING_FORCED), '@deprecated', Skew.SymbolFlags.IS_DEPRECATED), '@entry', Skew.SymbolFlags.IS_ENTRY_POINT), '@export', Skew.SymbolFlags.IS_EXPORTED), '@import', Skew.SymbolFlags.IS_IMPORTED), '@neverinline', Skew.SymbolFlags.IS_INLINING_PREVENTED), '@prefer', Skew.SymbolFlags.IS_PREFERRED), '@rename', Skew.SymbolFlags.IS_RENAMED), '@skip', Skew.SymbolFlags.IS_SKIPPED), '@spreads', Skew.SymbolFlags.SHOULD_SPREAD);
  Skew.Type.DYNAMIC = new Skew.Type(Skew.TypeKind.SPECIAL, null);
  Skew.Type.NULL = new Skew.Type(Skew.TypeKind.SPECIAL, null);
  Skew.Type._nextID = 0;
  Skew.Environment._nextID = 0;
  Skew.in_PassKind._strings = ['EMITTING', 'PARSING', 'LEXING', 'CALL_GRAPH', 'FOLDING', 'GLOBALIZING', 'INLINING', 'INTERFACE_REMOVAL', 'LAMBDA_CONVERSION', 'MERGING', 'MOTION', 'RENAMING', 'RESOLVING'];
  Skew.in_NodeKind._strings = ['ANNOTATION', 'BLOCK', 'CASE', 'CATCH', 'VARIABLE', 'BREAK', 'CONTINUE', 'EXPRESSION', 'FOR', 'FOREACH', 'IF', 'RETURN', 'SWITCH', 'THROW', 'TRY', 'VARIABLES', 'WHILE', 'ASSIGN_INDEX', 'CALL', 'CAST', 'CONSTANT', 'DOT', 'HOOK', 'INDEX', 'INITIALIZER_LIST', 'INITIALIZER_MAP', 'LAMBDA', 'LAMBDA_TYPE', 'NAME', 'NULL', 'NULL_DOT', 'PAIR', 'PARAMETERIZE', 'PARSE_ERROR', 'SEQUENCE', 'STRING_INTERPOLATION', 'SUPER', 'TYPE', 'TYPE_CHECK', 'XML', 'COMPLEMENT', 'NEGATIVE', 'NOT', 'POSITIVE', 'POSTFIX_DECREMENT', 'POSTFIX_INCREMENT', 'PREFIX_DECREMENT', 'PREFIX_INCREMENT', 'ADD', 'BITWISE_AND', 'BITWISE_OR', 'BITWISE_XOR', 'COMPARE', 'DIVIDE', 'EQUAL', 'IN', 'LOGICAL_AND', 'LOGICAL_OR', 'MULTIPLY', 'NOT_EQUAL', 'NULL_JOIN', 'POWER', 'REMAINDER', 'SHIFT_LEFT', 'SHIFT_RIGHT', 'SUBTRACT', 'UNSIGNED_SHIFT_RIGHT', 'GREATER_THAN', 'GREATER_THAN_OR_EQUAL', 'LESS_THAN', 'LESS_THAN_OR_EQUAL', 'ASSIGN', 'ASSIGN_ADD', 'ASSIGN_BITWISE_AND', 'ASSIGN_BITWISE_OR', 'ASSIGN_BITWISE_XOR', 'ASSIGN_DIVIDE', 'ASSIGN_MULTIPLY', 'ASSIGN_NULL', 'ASSIGN_POWER', 'ASSIGN_REMAINDER', 'ASSIGN_SHIFT_LEFT', 'ASSIGN_SHIFT_RIGHT', 'ASSIGN_SUBTRACT', 'ASSIGN_UNSIGNED_SHIFT_RIGHT'];
  Skew.in_SymbolKind._strings = ['PARAMETER_FUNCTION', 'PARAMETER_OBJECT', 'OBJECT_CLASS', 'OBJECT_ENUM', 'OBJECT_FLAGS', 'OBJECT_GLOBAL', 'OBJECT_INTERFACE', 'OBJECT_NAMESPACE', 'OBJECT_WRAPPED', 'FUNCTION_ANNOTATION', 'FUNCTION_CONSTRUCTOR', 'FUNCTION_GLOBAL', 'FUNCTION_INSTANCE', 'FUNCTION_LOCAL', 'OVERLOADED_ANNOTATION', 'OVERLOADED_GLOBAL', 'OVERLOADED_INSTANCE', 'VARIABLE_ARGUMENT', 'VARIABLE_ENUM_OR_FLAGS', 'VARIABLE_GLOBAL', 'VARIABLE_INSTANCE', 'VARIABLE_LOCAL'];
  Skew.in_TokenKind._toString = in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert({}, Skew.TokenKind.COMMENT, 'comment'), Skew.TokenKind.NEWLINE, 'newline'), Skew.TokenKind.WHITESPACE, 'whitespace'), Skew.TokenKind.AS, '"as"'), Skew.TokenKind.BREAK, '"break"'), Skew.TokenKind.CASE, '"case"'), Skew.TokenKind.CATCH, '"catch"'), Skew.TokenKind.CONST, '"const"'), Skew.TokenKind.CONTINUE, '"continue"'), Skew.TokenKind.DEFAULT, '"default"'), Skew.TokenKind.DYNAMIC, '"dynamic"'), Skew.TokenKind.ELSE, '"else"'), Skew.TokenKind.FALSE, '"false"'), Skew.TokenKind.FINALLY, '"finally"'), Skew.TokenKind.FOR, '"for"'), Skew.TokenKind.IF, '"if"'), Skew.TokenKind.IN, '"in"'), Skew.TokenKind.IS, '"is"'), Skew.TokenKind.NULL, '"null"'), Skew.TokenKind.RETURN, '"return"'), Skew.TokenKind.SUPER, '"super"'), Skew.TokenKind.SWITCH, '"switch"'), Skew.TokenKind.THROW, '"throw"'), Skew.TokenKind.TRUE, '"true"'), Skew.TokenKind.TRY, '"try"'), Skew.TokenKind.VAR, '"var"'), Skew.TokenKind.WHILE, '"while"'), Skew.TokenKind.ARROW, '"=>"'), Skew.TokenKind.ASSIGN, '"="'), Skew.TokenKind.ASSIGN_BITWISE_AND, '"&="'), Skew.TokenKind.ASSIGN_BITWISE_OR, '"|="'), Skew.TokenKind.ASSIGN_BITWISE_XOR, '"^="'), Skew.TokenKind.ASSIGN_DIVIDE, '"/="'), Skew.TokenKind.ASSIGN_INDEX, '"[]="'), Skew.TokenKind.ASSIGN_MINUS, '"-="'), Skew.TokenKind.ASSIGN_MULTIPLY, '"*="'), Skew.TokenKind.ASSIGN_PLUS, '"+="'), Skew.TokenKind.ASSIGN_POWER, '"**="'), Skew.TokenKind.ASSIGN_REMAINDER, '"%="'), Skew.TokenKind.ASSIGN_SHIFT_LEFT, '"<<="'), Skew.TokenKind.ASSIGN_SHIFT_RIGHT, '">>="'), Skew.TokenKind.ASSIGN_UNSIGNED_SHIFT_RIGHT, '">>>="'), Skew.TokenKind.BITWISE_AND, '"&"'), Skew.TokenKind.BITWISE_OR, '"|"'), Skew.TokenKind.BITWISE_XOR, '"^"'), Skew.TokenKind.COLON, '":"'), Skew.TokenKind.COMMA, '","'), Skew.TokenKind.COMPARE, '"<=>"'), Skew.TokenKind.DECREMENT, '"--"'), Skew.TokenKind.DIVIDE, '"/"'), Skew.TokenKind.DOT, '"."'), Skew.TokenKind.DOT_DOT, '".."'), Skew.TokenKind.DOUBLE_COLON, '"::"'), Skew.TokenKind.EQUAL, '"=="'), Skew.TokenKind.GREATER_THAN, '">"'), Skew.TokenKind.GREATER_THAN_OR_EQUAL, '">="'), Skew.TokenKind.INCREMENT, '"++"'), Skew.TokenKind.INDEX, '"[]"'), Skew.TokenKind.LEFT_BRACE, '"{"'), Skew.TokenKind.LEFT_BRACKET, '"["'), Skew.TokenKind.LEFT_PARENTHESIS, '"("'), Skew.TokenKind.LESS_THAN, '"<"'), Skew.TokenKind.LESS_THAN_OR_EQUAL, '"<="'), Skew.TokenKind.LIST, '"[...]"'), Skew.TokenKind.LIST_NEW, '"[new]"'), Skew.TokenKind.LOGICAL_AND, '"&&"'), Skew.TokenKind.LOGICAL_OR, '"||"'), Skew.TokenKind.MINUS, '"-"'), Skew.TokenKind.MULTIPLY, '"*"'), Skew.TokenKind.NOT, '"!"'), Skew.TokenKind.NOT_EQUAL, '"!="'), Skew.TokenKind.NULL_DOT, '"?."'), Skew.TokenKind.NULL_JOIN, '"??"'), Skew.TokenKind.PLUS, '"+"'), Skew.TokenKind.POWER, '"**"'), Skew.TokenKind.QUESTION_MARK, '"?"'), Skew.TokenKind.REMAINDER, '"%"'), Skew.TokenKind.RIGHT_BRACE, '"}"'), Skew.TokenKind.RIGHT_BRACKET, '"]"'), Skew.TokenKind.RIGHT_PARENTHESIS, '")"'), Skew.TokenKind.SEMICOLON, '";"'), Skew.TokenKind.SET, '"{...}"'), Skew.TokenKind.SET_NEW, '"{new}"'), Skew.TokenKind.SHIFT_LEFT, '"<<"'), Skew.TokenKind.SHIFT_RIGHT, '">>"'), Skew.TokenKind.TILDE, '"~"'), Skew.TokenKind.UNSIGNED_SHIFT_RIGHT, '">>>"'), Skew.TokenKind.ANNOTATION, 'annotation'), Skew.TokenKind.CHARACTER, 'character'), Skew.TokenKind.DOUBLE, 'double'), Skew.TokenKind.END_OF_FILE, 'end of input'), Skew.TokenKind.IDENTIFIER, 'identifier'), Skew.TokenKind.INT, 'integer'), Skew.TokenKind.INT_BINARY, 'integer'), Skew.TokenKind.INT_HEX, 'integer'), Skew.TokenKind.INT_OCTAL, 'integer'), Skew.TokenKind.STRING, 'string'), Skew.TokenKind.PARAMETER_LIST_END, '">"'), Skew.TokenKind.PARAMETER_LIST_START, '"<"'), Skew.TokenKind.XML_CHILD, '"<>...</>"'), Skew.TokenKind.XML_END, '">"'), Skew.TokenKind.XML_END_EMPTY, '"/>"'), Skew.TokenKind.XML_START, '"<"'), Skew.TokenKind.XML_START_CLOSE, '"</"'), Skew.TokenKind.STRING_INTERPOLATION_CONTINUE, 'string interpolation'), Skew.TokenKind.STRING_INTERPOLATION_END, 'string interpolation'), Skew.TokenKind.STRING_INTERPOLATION_START, 'string interpolation');
  Terminal.colorToEscapeCode = in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert(in_IntMap.insert({}, Terminal.Color.DEFAULT, 0), Terminal.Color.BOLD, 1), Terminal.Color.GRAY, 90), Terminal.Color.RED, 91), Terminal.Color.GREEN, 92), Terminal.Color.YELLOW, 93), Terminal.Color.BLUE, 94), Terminal.Color.MAGENTA, 95), Terminal.Color.CYAN, 96);

  process.exit(Skew.main(process.argv.slice(2)));
})();
