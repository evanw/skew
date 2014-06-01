function parseIntLiteral(value, base) {
  if (base !== 10) value = value.slice(2);
  return parseInt(value, base);
}

function parseDoubleLiteral(value) {
  return +value;
}

var now = typeof performance !== 'undefined' && performance['now']
  ? function() { return performance['now'](); }
  : function() { return +new Date; };
