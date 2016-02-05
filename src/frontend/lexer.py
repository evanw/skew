import os
import flex

template = '''
################################################################################
#
# This is a generated file, all edits will be lost!
#
################################################################################

namespace Skew {
  enum TokenKind {
%(actions)s
  }

  %(yy_accept)s
  %(yy_ec)s
  %(yy_meta)s
  %(yy_base)s
  %(yy_def)s
  %(yy_nxt)s
  %(yy_chk)s
  %(jamstate)s
  %(yy_accept_length)s
}
'''

def create_table(result, name, type=None):
  return 'const %(name)s%(type)s = [%(entries)s]' % {
    'type': ' ' + type if type else '',
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
result['actions'] = '\n'.join('    %s' % x for x in sorted(set(result['actions'].values())))
result['yy_accept_length'] = len(result['yy_accept'])
result['yy_accept'] = create_table(result, 'yy_accept', type='List<TokenKind>')
result['yy_ec'] = create_table(result, 'yy_ec')
result['yy_meta'] = create_table(result, 'yy_meta')
result['yy_base'] = create_table(result, 'yy_base')
result['yy_def'] = create_table(result, 'yy_def')
result['yy_nxt'] = create_table(result, 'yy_nxt')
result['yy_chk'] = create_table(result, 'yy_chk')
result['jamstate'] = 'const YY_JAM_STATE = %s' % result['jamstate']
result['yy_accept_length'] = 'const YY_ACCEPT_LENGTH = %s' % result['yy_accept_length']

# Write the output
open(os.path.join(path, 'lexer.sk'), 'w').write(template.strip() % result + '\n')
