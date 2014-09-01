import os
import re
import sys
import tempfile
import subprocess

def _run_flex(source):
  fd, path = tempfile.mkstemp()
  os.close(fd)
  flex = subprocess.Popen(['flex', '-B', '-7', '-o', path], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
  stdout, stderr = flex.communicate(input=source)
  sys.stdout.write(stdout)
  sys.stderr.write(stderr)
  if flex.returncode:
    raise Exception('flex failed to run')
  output = open(path).read()
  os.remove(path)
  return output

def _find_array(source, name):
  match = re.search(name + r'\[\d+\]\s*=[^{]*\{([^}]*)\}', source)
  return map(int, match.groups(1)[0].split(','))

def _find_magic_number(source, pattern):
  match = re.search(pattern, source)
  return int(match.groups(1)[0])

def _find_actions(source):
  matches = re.findall(r'case\s+(\d+)\s*:\s*(?:/\*[^*]*\*/)?\s*YY_RULE_SETUP[^\0]*?\n(.*);\s*YY_BREAK', source)
  return [(int(m[0]), m[1]) for m in matches]

def compile(source):
  output = _run_flex(source)
  result = {}

  # Comments from https://github.com/gobo-eiffel/gobo/blob/master/library/lexical/scanner/lx_compressed_tables.e
  result['yy_accept'] = _find_array(output, 'yy_accept') # Accepting id list
  result['yy_ec']     = _find_array(output, 'yy_ec') # ASCII to equivalence class
  result['yy_meta']   = _find_array(output, 'yy_meta') # Meta equivalence classes which are sets of classes with identical transitions out of templates
  result['yy_base']   = _find_array(output, 'yy_base') # Offsets into 'yy_nxt' for given states
  result['yy_def']    = _find_array(output, 'yy_def') # Where to go if 'yy_chk' disallows 'yy_nxt' entry
  result['yy_nxt']    = _find_array(output, 'yy_nxt') # States to enter upon reading symbol
  result['yy_chk']    = _find_array(output, 'yy_chk') # Check value to see if 'yy_nxt' applies

  result['yy_end_of_buffer'] = _find_magic_number(output, r'#define\s+YY_END_OF_BUFFER\s+(\d+)')
  result['jamstate'] = _find_magic_number(output, r'while\s*\(\s*yy_current_state\s*!=\s*(\d+)')
  result['actions'] = _find_actions(output)

  return result
