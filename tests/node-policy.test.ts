import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { assertSupportedNode, nodeEngineRange } from "../scripts/node-policy.mjs";

const require = createRequire(import.meta.url);
const root = new URL("../", import.meta.url);

test("runtime policy rejects vulnerable, EOL, unknown and prerelease Node versions", () => {
  for (const version of ["20.20.0", "22.13.0", "22.23.3", "23.10.0", "24.22.0", "25.9.0", "26.12.0", "27.0.0", "22.23.4-rc.1", "garbage"]) {
    assert.throws(() => assertSupportedNode(version), /Unsupported Node.js/, version);
  }
  for (const version of ["22.23.4", "22.23.5", "22.24.0", "24.22.1", "24.23.0", "26.12.1", "26.13.0"]) {
    assert.doesNotThrow(() => assertSupportedNode(version), version);
  }
});

test("npm engines, lockfile and CI selection enforce the same patched runtime", () => {
  const pkg = JSON.parse(readFileSync(new URL("package.json", root), "utf8"));
  const lock = JSON.parse(readFileSync(new URL("package-lock.json", root), "utf8"));
  assert.equal(pkg.engines.node, nodeEngineRange);
  assert.equal(lock.packages[""].engines.node, nodeEngineRange);
  assert.match(readFileSync(new URL(".npmrc", root), "utf8"), /^engine-strict=true$/m);
  const selected = readFileSync(new URL(".nvmrc", root), "utf8").trim();
  assert.doesNotThrow(() => assertSupportedNode(selected));
  assert.match(readFileSync(new URL(".github/workflows/check.yml", root), "utf8"), /node-version-file: \.nvmrc/);
});

test("actual install, framework and Worker preview entrypoints preload the runtime gate", () => {
  const pkg = JSON.parse(readFileSync(new URL("package.json", root), "utf8"));
  assert.equal(pkg.scripts.preinstall, "node scripts/check-node.mjs");
  assert.match(pkg.scripts.check, /^npm run check:runtime &&/);
  for (const file of ["scripts/install-ci.mjs", "scripts/run-framework.mjs", "scripts/sites-env.mjs"]) {
    assert.match(readFileSync(new URL(file, root), "utf8"), /^import "\.\/check-node\.mjs";/, file);
  }
  const checked = spawnSync(process.execPath, ["scripts/check-node.mjs"], { cwd: root, encoding: "utf8" });
  assert.equal(checked.status, 0, checked.stderr);
});

test("Vite consumers resolve the security release", () => {
  const declared = JSON.parse(readFileSync(new URL("package.json", root), "utf8")).devDependencies.vite;
  assert.match(declared, /^\d+\.\d+\.\d+$/, "vite must stay pinned to an exact release");
  assert.equal(require("vite/package.json").version, declared);
  for (const consumer of ["vinext", "@cloudflare/vite-plugin", "@vitejs/plugin-rsc"]) {
    const consumerRequire = createRequire(import.meta.resolve(consumer));
    assert.equal(consumerRequire("vite/package.json").version, declared, consumer);
  }
});
