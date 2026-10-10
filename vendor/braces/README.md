# Local security patch for braces 3.0.3

Original MIT-licensed source: micromatch/braces, published npm tarball recorded with integrity and per-file SHA-256 in UPSTREAM.json. LICENSE and original authorship are retained. This private package is not an upstream release and is not published to npm.

GHSA-vfj7-8cjw-p6xm has no patched upstream release as of 2026-10-10. The patch bounds the parser block stack and all three recursive AST walkers at 128 levels. The guard is fixed and also applies when callers supply an AST directly; both braces and parentheses are covered. Patterns exceeding the bound fail with a deliberate SyntaxError rather than exhausting the call stack. Normal glob patterns and existing expansion/range limits are unchanged.

Changes from the recorded upstream files: lib/depth.js added; parser stack checks in lib/parse.js; depth arguments/checks in lib/compile.js, lib/expand.js and lib/stringify.js. index.js and the other upstream library files remain byte-identical.

The root manifest uses a file dependency and an override so micromatch/fast-glob resolve this patched implementation. Registry audit does not establish the safety of this local source; tests/dependency-security.test.ts verifies the installed implementation, malicious nested patterns/ASTs and compatibility through the actual consumers before CI runs npm audit.

Remove this local package and its override once a reviewed upstream fix is available, after rerunning the targeted security and compatibility checks.
