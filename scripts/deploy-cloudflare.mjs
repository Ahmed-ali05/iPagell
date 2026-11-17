import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Produzione: Worker "ipagell" e D1 "ipagell-live" (binding DB) sull'account
// Cloudflare del proprietario. Vedi docs/DEPLOYMENT.md.
//
// Il deploy usa la config generata dal build Cloudflare (dist/server/wrangler.json),
// perché la `main` di wrangler.jsonc punta all'entry del binding locale.
const PRODUCTION_WORKER = "ipagell";
const PRODUCTION_D1_ID = "588e7605-60a5-4bdf-8b1f-b1f8ce2df28b";

const root = process.cwd();
const wrangler = resolve(root, "node_modules/wrangler/bin/wrangler.js");
const generatedConfig = "dist/server/wrangler.json";

// Un CLOUDFLARE_ENV ereditato dalla shell selezionerebbe un ambiente diverso.
const { CLOUDFLARE_ENV: _ignored, ...inheritedEnv } = process.env;
const env = {
  ...inheritedEnv,
  IPAGELL_DEPLOY_TARGET: "cloudflare",
  WRANGLER_LOG_PATH: resolve(root, ".wrangler/logs"),
};

function run(command, args, extraEnv = env) {
  const result = spawnSync(command, args, { cwd: root, env: extraEnv, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// Blocca il deploy se la config generata non è quella di produzione.
function assertProductionConfig() {
  const config = JSON.parse(readFileSync(resolve(root, generatedConfig), "utf8"));
  const databases = config.d1_databases ?? [];
  const ok = config.name === PRODUCTION_WORKER
    && databases.length === 1
    && databases[0].binding === "DB"
    && databases[0].database_id === PRODUCTION_D1_ID;
  if (!ok) {
    console.error(`Config generata non di produzione (name=${config.name}): deploy interrotto.`);
    process.exit(1);
  }
}

run(process.execPath, ["scripts/build-cloudflare.mjs"], env);
assertProductionConfig();
run(process.execPath, [wrangler, "deploy", "-c", generatedConfig, "--dry-run"], env);
run(process.execPath, [
  wrangler,
  "d1",
  "migrations",
  "apply",
  "DB",
  "--remote",
  "--config",
  "wrangler.jsonc",
], env);
run(process.execPath, [wrangler, "deploy", "-c", generatedConfig], env);
