import os
import flex

template = '''
////////////////////////////////////////////////////////////////////////////////
//
// This is a generated file, all edits will be lost!
//
////////////////////////////////////////////////////////////////////////////////

enum TokenKind {
%(actions)s

  // Token kinds not used by flex
  START_PARAMETER_LIST,
  END_PARAMETER_LIST,
}
%(yy_accept)s
%(yy_ec)s
%(yy_meta)s
%(yy_base)s
%(yy_def)s
%(yy_nxt)s
%(yy_chk)s

// This is the inner loop from "flex", an ancient lexer generator. The output
// of flex is pretty bad (obfuscated variable names and the opposite of modular
// code) but it's fast and somewhat standard for compiler design. The code below
// replaces a simple hand-coded lexer and offers much better performance.
List<Token> tokenize(Log log, Source source) {
  List<Token> tokens = {};
  var text = source.contents;
  var text_length = text.length;

  // For backing up
  var yy_last_accepting_state = 0;
  var yy_last_accepting_cpos = 0;

  // The current character pointer
  var yy_cp = 0;

  while (yy_cp < text_length) {
    var yy_current_state = 1; // Reset the NFA
    var yy_bp = yy_cp; // The pointer to the beginning of the token

    // Search for a match
    while (yy_current_state != %(jamstate)s) {
      var index = 0;
      if (yy_cp < text_length) {
        var c = text.codeUnitAt(yy_cp);
        if (c < 0x7F) index = c;
      } else {
        break; // This prevents syntax errors from causing infinite loops
      }
      var yy_c = yy_ec.get(index);
      if (yy_accept.get(yy_current_state) != .YY_INVALID_ACTION) {
        yy_last_accepting_state = yy_current_state;
        yy_last_accepting_cpos = yy_cp;
      }
      while (yy_chk.get(yy_base.get(yy_current_state) + yy_c) != yy_current_state) {
        yy_current_state = yy_def.get(yy_current_state);
        if (yy_current_state >= %(yy_accept_length)s) {
          yy_c = yy_meta.get(yy_c);
        }
      }
      yy_current_state = yy_nxt.get(yy_base.get(yy_current_state) + yy_c);
      yy_cp++;
    }

    // Find the action
    TokenKind yy_act = yy_accept.get(yy_current_state);
    while (yy_act == .YY_INVALID_ACTION) {
      // Have to back up
      yy_cp = yy_last_accepting_cpos;
      yy_current_state = yy_last_accepting_state;
      yy_act = yy_accept.get(yy_current_state);
    }

    // Ignore whitespace
    if (yy_act == .WHITESPACE) {
      continue;
    }

    // This is the default action in flex, which is usually called ECHO
    else if (yy_act == .ERROR) {
      syntaxErrorExtraData(log, Range(source, yy_bp, yy_cp), text.slice(yy_bp, yy_cp));
      break;
    }

    // Ignore END_OF_FILE since this loop must still perform the last action
    else if (yy_act != .END_OF_FILE) {
      tokens.push(Token(Range(source, yy_bp, yy_cp), yy_act, text.slice(yy_bp, yy_cp)));
    }
  }

  // Every token stream ends in END_OF_FILE
  tokens.push(Token(Range(source, text_length, text_length), .END_OF_FILE, ""));

  // Do a single post-processing pass on the token list
  prepareTokens(tokens);
  return tokens;
}
'''

def create_table(result, name, type='int'):
  return 'final List<%(type)s> %(name)s = { %(entries)s };' % {
    'type': type,
    'name': name,
    'entries': ', '.join('%s' % x for x in result[name]),
  }

# Read and compile the input
path = os.path.dirname(__file__)
source = open(os.path.join(path, 'flex.l')).read()
result = flex.compile(source)

# Assume all actions are sequential and start at 1
if [k for k, v in result['actions']] != range(1, len(result['actions']) + 1):
  raise Exception('all actions are not sequential')

# Assume ECHO is the last action
if result['actions'][-1][1] != 'ECHO':
  raise Exception('ECHO is not after the last action')

# Assume yy_end_of_buffer is after the last action
if result['yy_end_of_buffer'] != len(result['actions']) + 1:
  raise Exception('yy_end_of_buffer is not after the last action')

# Patch the results
result['actions'] = dict((k, v if v != 'ECHO' else 'ERROR') for k, v in result['actions'] + [(0, 'YY_INVALID_ACTION'), (result['yy_end_of_buffer'], 'END_OF_FILE')])
result['yy_accept'] = ['.%s' % result['actions'][x] for x in result['yy_accept']]
result['actions'] = '\n'.join('  %s,' % x for x in sorted(set(result['actions'].values())))
result['yy_accept_length'] = len(result['yy_accept'])
result['yy_accept'] = create_table(result, 'yy_accept', type='TokenKind')
result['yy_ec'] = create_table(result, 'yy_ec')
result['yy_meta'] = create_table(result, 'yy_meta')
result['yy_base'] = create_table(result, 'yy_base')
result['yy_def'] = create_table(result, 'yy_def')
result['yy_nxt'] = create_table(result, 'yy_nxt')
result['yy_chk'] = create_table(result, 'yy_chk')

# Write the output
open(os.path.join(path, 'lexer.sk'), 'w').write(template.strip() % result + '\n')
