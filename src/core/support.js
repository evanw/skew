function parseIntLiteral(value, base) {
  if (base !== 10) value = value.slice(2);
  var result = parseInt(value, base);
  return result === (result | 0) || result === 0x80000000 ? result | 0 : NaN;
}

function parseDoubleLiteral(value) {
  return +value;
}

var now = typeof performance !== 'undefined' && performance['now']
  ? function() { return performance['now'](); }
  : function() { return +new Date; };
