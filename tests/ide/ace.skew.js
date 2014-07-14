define('ace/mode/skew', ['require', 'exports', 'module' , 'ace/lib/oop', 'ace/mode/text', 'ace/range'], function(require, exports, module) {
  var oop = require('../lib/oop');
  var TextMode = require('./text').Mode;
  var TextHighlightRules = require('./text_highlight_rules').TextHighlightRules;

  function HighlightRules() {
    var keywords = [
      'assert',
      'break',
      'case',
      'class',
      'continue',
      'default',
      'do',
      'else',
      'enum',
      'export',
      'final',
      'fn',
      'for',
      'if',
      'import',
      'in',
      'inline',
      'interface',
      'is',
      'namespace',
      'new',
      'override',
      'private',
      'protected',
      'public',
      'return',
      'static',
      'struct',
      'super',
      'switch',
      'using',
      'var',
      'virtual',
      'while',
    ];

    var constants = [
      'true',
      'false',
      'null',
      'this'
    ];

    var types = [
      'void',
      'int',
      'bool',
      'float',
      'double',
      'string'
    ];

    this.$rules = {
      start: [
        {
          token: 'comment',
          regex: '//.*$'
        },
        {
          token: 'comment',
          start: '/\\*',
          end: '\\*/'
        },
        {
          token: 'string',
          start: '\'',
          next: ['characterLiteral']
        },
        {
          token: 'string',
          start: '"',
          next: ['stringLiteral']
        },
        {
          token: 'constant',
          regex: '(?:[A-Z_][A-Z0-9_]*|' + constants.join('|') + ')\\b'
        },
        {
          token: 'type',
          regex: '(?:[A-Z_][a-zA-Z0-9_]*|' + types.join('|') + ')\\b'
        },
        {
          token: 'keyword',
          regex: 'enum\\s+flags\\b'
        },
        {
          token: 'keyword',
          regex: '(?:' + keywords.join('|') + ')\\b'
        },
        {
          token: 'identifier',
          regex: '[a-zA-Z_][a-zA-Z0-9_]*\\b'
        }
      ],
      characterLiteral: [
        {
          token: 'string',
          regex: '\'',
          next: 'start'
        },
        {
          token: 'string',
          regex: '(?:\\\\.|[^\'])+'
        }
      ],
      stringLiteral: [
        {
          token: 'string',
          regex: '"',
          next: 'start'
        },
        {
          token: 'string',
          regex: '(?:\\\\.|[^"])+'
        }
      ]
    };
    this.normalizeRules();
  }

  exports.Mode = function() {
    this.HighlightRules = HighlightRules;
  };

  oop.inherits(HighlightRules, TextHighlightRules);
  oop.inherits(exports.Mode, TextMode);
});
