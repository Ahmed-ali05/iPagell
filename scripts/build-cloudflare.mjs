import { spawnSync } from "node:child_process";

const result = spawnSync(process.execPath, ["scripts/run-framework.mjs", "build"], {
  stdio: "inherit",
  env: { ...process.env, IPAGELL_DEPLOY_TARGET: "cloudflare" },
});

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

const precache = spawnSync(process.execPath, ["scripts/generate-precache.mjs"], {
  stdio: "inherit",
  env: process.env,
});

if (precache.error) throw precache.error;
process.exit(precache.status ?? 1);
