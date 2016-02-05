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
  '-include', 'src/backend/library.h',
  '-include', 'src/backend/library.cpp',
]

CPP_RELEASE_FLAGS = [
  '-O3',
  '-DNDEBUG',
  '-fomit-frame-pointer',
  '-include', 'src/backend/fast.cpp',
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
  authorization = 'Basic ' + ('%s:%s' % (username, password)).encode('base64').strip()
  open(name, 'w').write(authorization)
  return authorization

def create_github_release(version):
  url = 'https://api.github.com/repos/evanw/skew/releases'
  opener = urllib2.build_opener(urllib2.HTTPSHandler)
  request = urllib2.Request(url, data=json.dumps({'tag_name': version}))
  request.get_method = lambda: 'POST'
  request.add_header('Authorization', github_authorization())
  request.add_header('Content-Type', 'application/octet-stream')
  response = json.loads(opener.open(request).read())
  return response["id"]

def upload_github_release(id, name, content):
  gzip.open(content + '.gz', 'wb').write(open(content, 'rb').read())
  url = 'https://uploads.github.com/repos/evanw/skew/releases/%s/assets?name=%s' % (id, name)
  opener = urllib2.build_opener(urllib2.HTTPSHandler)
  request = urllib2.Request(url, data=open(content + '.gz', 'rb').read())
  request.get_method = lambda: 'POST'
  request.add_header('Authorization', github_authorization())
  request.add_header('Content-Type', 'application/octet-stream')
  response = json.loads(opener.open(request).read())
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

def run_js(source, args):
  global node_binary

  if node_binary is None:
    node_binary = 'nodejs' if run(['which', 'nodejs'], exit_on_failure=False) == 0 else 'node'

  run([node_binary, source] + args)

def run_cs(source, args):
  run(['mono', '--debug', source] + args)

def run_cpp(source, args):
  run([source] + args)

def skewc_js(source, target, sources=None, release=False):
  run_js(source, sources + FLAGS + ['--output-file=' + target] + (['--release'] if release else []))

def skewc_cs(source, target, sources=None, release=False):
  run_cs(source, sources + FLAGS + ['--output-file=' + target] + (['--release'] if release else []))

def skewc_cpp(source, target, sources=None, release=False):
  run_cpp(source, sources + FLAGS + ['--output-file=' + target] + (['--release'] if release else []))

def compile_cs(sources, target):
  run(['mcs', '-debug'] + sources + ['-out:' + target])

def compile_cpp(source, target, release=False):
  run(['c++', source, '-o', target] + CPP_FLAGS + (CPP_RELEASE_FLAGS if release else []))

################################################################################

@job
def default():
  mkdir('build')
  skewc_js('skewc.js', 'build/skewc.js', sources=SOURCES_SKEWC)
  skewc_js('skewc.js', 'build/skewc-api.js', sources=SOURCES_API)

@job
def clean():
  rmtree('build')

@job
def replace():
  mkdir('build')
  skewc_js('skewc.js', 'build/skewc.js', sources=SOURCES_SKEWC)
  skewc_js('build/skewc.js', 'build/skewc2.js', sources=SOURCES_SKEWC)
  skewc_js('build/skewc2.js', 'build/skewc3.js', sources=SOURCES_SKEWC)
  check_same('build/skewc2.js', 'build/skewc3.js')
  os.remove('skewc.js')
  os.remove('build/skewc2.js')
  os.rename('build/skewc3.js', 'skewc.js')

@job
def check():
  check_js()
  check_cs()
  check_cpp()

@job
def check_js():
  mkdir('build')
  skewc_js('skewc.js', 'build/skewc.min.js', sources=SOURCES_SKEWC, release=True)
  skewc_js('build/skewc.min.js', 'build/skewc2.min.js', sources=SOURCES_SKEWC, release=True)
  skewc_js('build/skewc2.min.js', 'build/skewc3.min.js', sources=SOURCES_SKEWC, release=True)
  check_same('build/skewc2.min.js', 'build/skewc3.min.js')

@job
def check_cs():
  mkdir('build')
  skewc_js('skewc.js', 'build/skewc.cs', sources=SOURCES_SKEWC)
  compile_cs(['build/skewc.cs'], 'build/skewc.exe')
  skewc_cs('build/skewc.exe', 'build/skewc2.cs', sources=SOURCES_SKEWC)
  compile_cs(['build/skewc2.cs'], 'build/skewc2.exe')
  skewc_cs('build/skewc2.exe', 'build/skewc3.cs', sources=SOURCES_SKEWC)
  check_same('build/skewc2.cs', 'build/skewc3.cs')

@job
def check_cpp():
  mkdir('build')
  skewc_js('skewc.js', 'build/skewc.cpp', sources=SOURCES_SKEWC)
  compile_cpp('build/skewc.cpp', 'build/skewc')
  skewc_cpp('build/skewc', 'build/skewc2.cpp', sources=SOURCES_SKEWC)
  compile_cpp('build/skewc2.cpp', 'build/skewc2')
  skewc_cpp('build/skewc2', 'build/skewc3.cpp', sources=SOURCES_SKEWC)
  check_same('build/skewc2.cpp', 'build/skewc3.cpp')

@job
def check_determinism():
  # Generate JavaScript debug and release builds
  mkdir('build')
  skewc_js('skewc.js', 'build/skewc.js.js', sources=SOURCES_SKEWC)
  skewc_js('skewc.js', 'build/skewc.js.min.js', sources=SOURCES_SKEWC, release=True)

  # Check C#
  skewc_js('skewc.js', 'build/skewc.cs', sources=SOURCES_SKEWC)
  compile_cs(['build/skewc.cs'], 'build/skewc.exe')
  skewc_cs('build/skewc.exe', 'build/skewc.cs.js', sources=SOURCES_SKEWC)
  check_same('build/skewc.js.js', 'build/skewc.cs.js')
  skewc_cs('build/skewc.exe', 'build/skewc.cs.min.js', sources=SOURCES_SKEWC, release=True)
  check_same('build/skewc.js.min.js', 'build/skewc.cs.min.js')

  # Check C++
  skewc_js('skewc.js', 'build/skewc.cpp', sources=SOURCES_SKEWC)
  compile_cpp('build/skewc.cpp', 'build/skewc')
  skewc_cpp('build/skewc', 'build/skewc.cpp.js', sources=SOURCES_SKEWC)
  check_same('build/skewc.js.js', 'build/skewc.cpp.js')
  skewc_cpp('build/skewc', 'build/skewc.cpp.min.js', sources=SOURCES_SKEWC, release=True)
  check_same('build/skewc.js.min.js', 'build/skewc.cpp.min.js')

@job
def test():
  test_js()
  test_cs()
  test_cpp()

@job
def test_js():
  mkdir('build')
  skewc_js('skewc.js', 'build/skewc.js', sources=SOURCES_SKEWC)
  skewc_js('build/skewc.js', 'build/test.js', sources=SOURCES_TEST)
  run_js('build/test.js', [])
  skewc_js('build/skewc.js', 'build/test.min.js', sources=SOURCES_TEST, release=True)
  run_js('build/test.min.js', [])

@job
def test_cs():
  mkdir('build')
  skewc_js('skewc.js', 'build/skewc.js', sources=SOURCES_SKEWC)
  skewc_js('build/skewc.js', 'build/test.cs', sources=SOURCES_TEST)
  compile_cs(['build/test.cs'], 'build/test.exe')
  run_cs('build/test.exe', [])
  rmtree('build/cs')
  mkdir('build/cs')
  run_js('build/skewc.js', SOURCES_TEST + ['--target=cs', '--output-dir=build/cs'])
  compile_cs(glob.glob('build/cs/*.cs'), 'build/test.exe')
  run_cs('build/test.exe', [])

@job
def test_cpp():
  mkdir('build')
  skewc_js('skewc.js', 'build/skewc.js', sources=SOURCES_SKEWC)
  skewc_js('skewc.js', 'build/test.debug.cpp', sources=SOURCES_TEST)
  compile_cpp('build/test.debug.cpp', 'build/test.debug')
  run_cpp('build/test.debug', [])
  skewc_js('skewc.js', 'build/test.release.cpp', sources=SOURCES_TEST, release=True)
  compile_cpp('build/test.release.cpp', 'build/test.release', release=True)
  run_cpp('build/test.release', [])

@job
def benchmark():
  mkdir('build')
  open('build/benchmark.sk', 'w').write('\n'.join(open(f).read() for f in SOURCES_API))
  skewc_js('skewc.js', 'build/benchmark.js', sources=['build/benchmark.sk'], release=True)

@job
def watch():
  mkdir('build')
  watch_folder('src', lambda: skewc_js('skewc.js', 'build/skewc-api.js', sources=SOURCES_API))

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
  run(['git', 'commit', '-am', 'publish'])
  run(['git', 'push'])
  skewc_js('skewc.js', 'build/skewc.min.js', sources=SOURCES_SKEWC, release=True)
  skewc_js('skewc.js', 'npm/skew.js', sources=SOURCES_API, release=True)
  skewc_js('skewc.js', 'build/skewc.release.cpp', sources=SOURCES_SKEWC, release=True)
  compile_cpp('build/skewc.release.cpp', 'build/skewc.osx.64', release=True)
  open('npm/skewc', 'w').write('#!/usr/bin/env node\n' + open('build/skewc.min.js').read())
  run(['chmod', '+x', 'npm/skewc'])
  run(['npm', 'publish'], cwd='npm')
  release = create_github_release(version)
  upload_github_release(release, 'skewc.osx.64.gz', 'build/skewc.osx.64')

################################################################################

def main(args):
  if not args:
    args = ['default']

  for arg in args:
    if arg in jobs:
      jobs[arg]()
    else:
      sys.exit('error: unknown job name "%s"', arg)

main(sys.argv[1:])
