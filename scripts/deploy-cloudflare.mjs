import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = process.cwd();
const wrangler = resolve(root, "node_modules/wrangler/bin/wrangler.js");
const env = {
  ...process.env,
  IPAGELL_DEPLOY_TARGET: "cloudflare",
  WRANGLER_LOG_PATH: resolve(root, ".wrangler/logs"),
};

function run(command, args, extraEnv = env) {
  const result = spawnSync(command, args, { cwd: root, env: extraEnv, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(process.execPath, ["scripts/build-cloudflare.mjs"], env);
run(process.execPath, [wrangler, "deploy", "--dry-run"], env);
run(process.execPath, [
  wrangler,
  "d1",
  "migrations",
  "apply",
  "ipagell-production",
  "--remote",
  "--config",
  "wrangler.jsonc",
], env);
run(process.execPath, [wrangler, "deploy"], env);
