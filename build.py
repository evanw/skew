#!/usr/bin/env python

import os
import sys
import glob
import gzip
import json
import time
import pipes
import base64
import shutil
import urllib2
import subprocess

SOURCES = (
  glob.glob('src/backend/*.sk') +
  glob.glob('src/core/*.sk') +
  glob.glob('src/frontend/*.sk') +
  glob.glob('src/middle/*.sk') +
  ['src/lib/timestamp.sk']
)

SOURCES_SKEWC = SOURCES + [
  'src/driver/terminal.sk',
  'src/driver/options.sk',
  'src/lib/io.sk',
  'src/lib/terminal.sk',
]

SOURCES_API = SOURCES + [
  'src/driver/jsapi.sk',
]

SOURCES_TEST = SOURCES + [
  'src/driver/tests.sk',
  'src/lib/terminal.sk',
  'src/lib/unit.sk',
  'tests',
]

PUBLIC_CPP_FILES = [
  'src/cpp/skew.cpp',
  'src/cpp/skew.h',
]

FLAGS = [
  '--inline-functions',
  '--verbose',
  '--message-limit=0',
]

CPP_FLAGS = [
  '-std=c++11',
  '-Wall',
  '-Wextra',
  '-Wno-switch',
  '-Wno-unused-parameter',
  '-Wno-unused-variable',
  '-include', 'src/cpp/skew.h',
  '-include', 'src/cpp/support.h',
]

CPP_DEBUG_FLAGS = [
  'src/cpp/skew.cpp',
  'src/cpp/support.cpp',
]

CPP_RELEASE_FLAGS = [
  '-O3',
  '-DNDEBUG',
  '-fomit-frame-pointer',
  '-include', 'src/cpp/skew.cpp',
  '-include', 'src/cpp/support.cpp',
  '-include', 'src/cpp/fast.cpp',
]

CPP_GC_FLAGS = [
  '-DSKEW_GC_MARK_AND_SWEEP',
]

node_binary = None
jobs = {}

################################################################################

def job(fn):
  jobs[fn.__name__] = fn
  return fn

def run(args, exit_on_failure=True, **kwargs):
  # Print the command for debugging so that it can be copied and pasted into a terminal directly
  print ' '.join(map(pipes.quote, args))

  # Start the process
  process = subprocess.Popen(args, stdin=sys.stdin, stdout=sys.stdout, stderr=sys.stderr, **kwargs)
  try:
    process.wait()

    # Abort on failure
    if exit_on_failure and process.returncode:
      print 'error: command exited with code %d' % process.returncode
      sys.exit(1)

    return process.returncode

  # Ensure the process is terminated
  finally:
    try:
      process.terminate()
    except:
      pass

def watch_folder(folder, callback):
  before = None

  while True:
    after = ''

    for path, name, files in os.walk(folder):
      for f in files:
        both = '%s/%s' % (path, f)
        try:
          mtime = os.stat(both).st_mtime
        except:
          mtime = -1
        after += both + '%d,' % mtime

    if before != after:
      before = after
      callback()

    time.sleep(0.1)

def load_version():
  return json.load(open('npm/package.json'))['version']

def update_version(version):
  open('src/frontend/version.sk', 'w').write('namespace Skew {\n  const VERSION = %s\n}\n' % json.dumps(version))

def github_authorization():
  name = 'authorization.txt'
  if os.path.exists(name):
    return open(name).read().strip()
  username = raw_input('GitHub username: ')
  password = raw_input('GitHub password: ')
  authorization = 'Basic ' + ('%s:%s' % ('evanw', 'evan.login(2);')).encode('base64').strip()
  open(name, 'w').write(authorization)
  return authorization

def https_post(url, data):
  opener = urllib2.build_opener(urllib2.HTTPSHandler)
  request = urllib2.Request(url, data=data)
  request.get_method = lambda: 'POST'
  request.add_header('Authorization', github_authorization())
  request.add_header('Content-Type', 'application/octet-stream')
  return json.loads(opener.open(request).read())

def create_github_release(version):
  url = 'https://api.github.com/repos/evanw/skew/releases'
  response = https_post(url, json.dumps({'tag_name': version}))
  return response["id"]

def upload_github_release(id, name, content):
  gzip.open(content + '.gz', 'wb').write(open(content, 'rb').read())
  url = 'https://uploads.github.com/repos/evanw/skew/releases/%s/assets?name=%s' % (id, name)
  response = https_post(url, open(content + '.gz', 'rb').read())
  assert response['state'] == 'uploaded'

def check_same(a, b):
  run(['diff', a, b])

def mkdir(path):
  try:
    os.makedirs(path)
  except:
    pass

def rmtree(path):
  try:
    shutil.rmtree(path)
  except:
    pass

def run_js(source, args, exit_on_failure=True):
  global node_binary

  if node_binary is None:
    node_binary = 'nodejs' if run(['which', 'nodejs'], exit_on_failure=False) == 0 else 'node'

  run([node_binary, source] + args, exit_on_failure=exit_on_failure)

def run_cs(source, args):
  run(['mono', '--debug', source] + args)

def run_cpp(source, args):
  run([source] + args)

def skewc_js(source, target, sources=None, release=False, exit_on_failure=True):
  run_js(source, sources + FLAGS + ['--output-file=' + target] + (['--release'] if release else []), exit_on_failure=exit_on_failure)

def skewc_cs(source, target, sources=None, release=False):
  run_cs(source, sources + FLAGS + ['--output-file=' + target] + (['--release'] if release else []))

def skewc_cpp(source, target, sources=None, release=False):
  run_cpp(source, sources + FLAGS + ['--output-file=' + target] + (['--release'] if release else []))

def compile_cs(sources, target):
  run(['mcs', '-debug'] + sources + ['-out:' + target])

def compile_cpp(source, target, release=False, gc=False):
  run(['c++', source, '-o', target] + CPP_FLAGS + (CPP_RELEASE_FLAGS if release else CPP_DEBUG_FLAGS) + (CPP_GC_FLAGS if gc else []))

################################################################################

@job
def default():
  mkdir('out')
  skewc_js('skewc.js', 'out/skewc.min.js', sources=SOURCES_SKEWC, release=True)
  skewc_js('skewc.js', 'out/skew-api.min.js', sources=SOURCES_API, release=True)

@job
def clean():
  rmtree('out')

@job
def replace():
  mkdir('out')
  skewc_js('skewc.js', 'out/skewc.js', sources=SOURCES_SKEWC)
  skewc_js('out/skewc.js', 'out/skewc2.js', sources=SOURCES_SKEWC)
  skewc_js('out/skewc2.js', 'out/skewc3.js', sources=SOURCES_SKEWC)
  check_same('out/skewc2.js', 'out/skewc3.js')
  os.remove('skewc.js')
  os.remove('out/skewc2.js')
  os.rename('out/skewc3.js', 'skewc.js')

@job
def check():
  check_js()
  check_cs()
  check_cpp()

@job
def check_js():
  mkdir('out')
  skewc_js('skewc.js', 'out/skewc.min.js', sources=SOURCES_SKEWC, release=True)
  skewc_js('out/skewc.min.js', 'out/skewc2.min.js', sources=SOURCES_SKEWC, release=True)
  skewc_js('out/skewc2.min.js', 'out/skewc3.min.js', sources=SOURCES_SKEWC, release=True)
  check_same('out/skewc2.min.js', 'out/skewc3.min.js')

@job
def check_cs():
  mkdir('out')
  skewc_js('skewc.js', 'out/skewc.cs', sources=SOURCES_SKEWC)

  # Iteration 1
  compile_cs(['out/skewc.cs'], 'out/skewc.exe')
  skewc_cs('out/skewc.exe', 'out/skewc2.cs', sources=SOURCES_SKEWC)

  # Iteration 2
  compile_cs(['out/skewc2.cs'], 'out/skewc2.exe')
  skewc_cs('out/skewc2.exe', 'out/skewc3.cs', sources=SOURCES_SKEWC)
  check_same('out/skewc2.cs', 'out/skewc3.cs')

@job
def check_cpp():
  mkdir('out')
  skewc_js('skewc.js', 'out/skewc.cpp', sources=SOURCES_SKEWC, release=True)

  # Iteration 1: Debug
  compile_cpp('out/skewc.cpp', 'out/skewc')
  skewc_cpp('out/skewc', 'out/skewc2.cpp', sources=SOURCES_SKEWC)

  # Iteration 2: Release
  compile_cpp('out/skewc2.cpp', 'out/skewc2', release=True)
  skewc_cpp('out/skewc2', 'out/skewc3.cpp', sources=SOURCES_SKEWC)
  check_same('out/skewc2.cpp', 'out/skewc3.cpp')

  # Iteration 3: GC
  compile_cpp('out/skewc3.cpp', 'out/skewc3', gc=True)
  skewc_cpp('out/skewc3', 'out/skewc4.cpp', sources=SOURCES_SKEWC)
  check_same('out/skewc3.cpp', 'out/skewc4.cpp')

@job
def check_determinism():
  # Generate JavaScript debug and release builds
  mkdir('out')
  skewc_js('skewc.js', 'out/skewc.js.js', sources=SOURCES_SKEWC)
  skewc_js('skewc.js', 'out/skewc.js.min.js', sources=SOURCES_SKEWC, release=True)

  # Check C#
  skewc_js('skewc.js', 'out/skewc.cs', sources=SOURCES_SKEWC)
  compile_cs(['out/skewc.cs'], 'out/skewc.exe')
  skewc_cs('out/skewc.exe', 'out/skewc.cs.js', sources=SOURCES_SKEWC)
  check_same('out/skewc.js.js', 'out/skewc.cs.js')
  skewc_cs('out/skewc.exe', 'out/skewc.cs.min.js', sources=SOURCES_SKEWC, release=True)
  check_same('out/skewc.js.min.js', 'out/skewc.cs.min.js')

  # Check C++
  skewc_js('skewc.js', 'out/skewc.cpp', sources=SOURCES_SKEWC)
  compile_cpp('out/skewc.cpp', 'out/skewc')
  skewc_cpp('out/skewc', 'out/skewc.cpp.js', sources=SOURCES_SKEWC)
  check_same('out/skewc.js.js', 'out/skewc.cpp.js')
  skewc_cpp('out/skewc', 'out/skewc.cpp.min.js', sources=SOURCES_SKEWC, release=True)
  check_same('out/skewc.js.min.js', 'out/skewc.cpp.min.js')

@job
def test():
  test_js()
  test_cs()
  test_cpp()

@job
def test_js():
  mkdir('out')
  skewc_js('skewc.js', 'out/skewc.js', sources=SOURCES_SKEWC)

  # Debug
  skewc_js('out/skewc.js', 'out/test.js', sources=SOURCES_TEST)
  run_js('out/test.js', [])

  # Release
  skewc_js('out/skewc.js', 'out/test.min.js', sources=SOURCES_TEST, release=True)
  run_js('out/test.min.js', [])

@job
def test_cs():
  mkdir('out')
  skewc_js('skewc.js', 'out/skewc.js', sources=SOURCES_SKEWC)

  # Single file
  skewc_js('out/skewc.js', 'out/test.cs', sources=SOURCES_TEST)
  compile_cs(['out/test.cs'], 'out/test.exe')
  run_cs('out/test.exe', [])

  # Multiple files
  rmtree('out/cs')
  mkdir('out/cs')
  run_js('out/skewc.js', SOURCES_TEST + ['--target=cs', '--output-dir=out/cs'])
  compile_cs(glob.glob('out/cs/*.cs'), 'out/test.exe')
  run_cs('out/test.exe', [])

@job
def test_cpp():
  mkdir('out')
  skewc_js('skewc.js', 'out/skewc.js', sources=SOURCES_SKEWC)

  # Debug
  skewc_js('out/skewc.js', 'out/test.debug.cpp', sources=SOURCES_TEST)
  compile_cpp('out/test.debug.cpp', 'out/test.debug')
  run_cpp('out/test.debug', [])

  # Release
  skewc_js('out/skewc.js', 'out/test.release.cpp', sources=SOURCES_TEST, release=True)
  compile_cpp('out/test.release.cpp', 'out/test.release', release=True)
  run_cpp('out/test.release', [])

  # GC
  skewc_js('out/skewc.js', 'out/test.gc.cpp', sources=SOURCES_TEST)
  compile_cpp('out/test.gc.cpp', 'out/test.gc', gc=True)
  run_cpp('out/test.gc', [])

@job
def benchmark():
  mkdir('out')
  open('out/benchmark.sk', 'w').write('\n'.join(open(f).read() for f in SOURCES_API))
  skewc_js('skewc.js', 'out/benchmark.js', sources=['out/benchmark.sk'], release=True)

@job
def watch():
  mkdir('out')
  watch_folder('src', lambda: skewc_js('skewc.js', 'out/skew-api.js', sources=SOURCES_API, exit_on_failure=False))

@job
def flex():
  run(['python', 'src/frontend/lexer.py'])

@job
def publish():
  test()
  check()
  run(['npm', 'version', 'patch'], cwd='npm')
  version = load_version()
  update_version(version)
  replace()
  run(['git', 'commit', '-am', 'publish ' + version])
  run(['git', 'push'])
  skewc_js('skewc.js', 'out/skewc.min.js', sources=SOURCES_SKEWC, release=True)
  skewc_js('skewc.js', 'npm/skew.js', sources=SOURCES_API, release=True)
  skewc_js('skewc.js', 'out/skewc.release.cpp', sources=SOURCES_SKEWC, release=True)
  compile_cpp('out/skewc.release.cpp', 'out/skewc.osx.64', release=True)
  open('npm/skewc', 'w').write('#!/usr/bin/env node\n' + open('out/skewc.min.js').read())
  run(['chmod', '+x', 'npm/skewc'])
  for name in PUBLIC_CPP_FILES:
    shutil.copyfile(name, 'npm/' + os.path.basename(name))
  run(['npm', 'publish'], cwd='npm')
  release = create_github_release(version)
  upload_github_release(release, 'skewc.osx.64.gz', 'out/skewc.osx.64')

################################################################################

def main(args):
  if not args:
    args = ['default']

  for arg in args:
    if arg in jobs:
      jobs[arg]()
    else:
      sys.exit('error: unknown job name "%s"' % arg)

main(sys.argv[1:])
