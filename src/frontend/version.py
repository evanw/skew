import json

open('version.sk', 'w').write('''namespace Skew {
  const VERSION = %s
}
''' % json.dumps(json.load(open('../../npm/package.json'))['version']))
