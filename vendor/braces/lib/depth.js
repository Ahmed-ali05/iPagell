'use strict';

// Fixed bound: callers cannot disable the safeguard through options.
const MAX_DEPTH = 128;
const checkDepth = depth => {
  if (depth > MAX_DEPTH) throw new SyntaxError('Brace AST exceeds maximum nesting depth (128)');
};
module.exports = { MAX_DEPTH, checkDepth };
