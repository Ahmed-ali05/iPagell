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
const env = {
  ...process.env,
  IPAGELL_DEPLOY_TARGET: "cloudflare",
  WRANGLER_LOG_PATH: resolve(root, ".wrangler/logs"),
};
delete env.CLOUDFLARE_ENV;

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

function git(args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    console.error(`git ${args.join(" ")} non riuscito:\n${result.stderr}`);
    process.exit(1);
  }
  return result.stdout.trim();
}

// Si pubblica solo `main` pulita e allineata a origin/main: un deploy da un altro
// ramo o worktree può togliere funzioni già in produzione (es. Google, /legale).
// IPAGELL_DEPLOY_ANY_BRANCH=1 salta il controllo solo per emergenze consapevoli.
function assertDeployableCheckout() {
  if (process.env.IPAGELL_DEPLOY_ANY_BRANCH === "1") {
    console.warn("IPAGELL_DEPLOY_ANY_BRANCH=1: controllo del ramo saltato.");
    return;
  }
  const problems = [];
  const branch = git(["rev-parse", "--abbrev-ref", "HEAD"]);
  if (branch !== "main") problems.push(`ramo attuale "${branch}", serve "main"`);
  if (git(["status", "--porcelain", "--untracked-files=no"])) {
    problems.push("ci sono modifiche non committate");
  }
  git(["fetch", "--quiet", "origin", "main"]);
  if (git(["rev-parse", "HEAD"]) !== git(["rev-parse", "origin/main"])) {
    problems.push("HEAD non coincide con origin/main (fai pull o push prima)");
  }
  if (problems.length) {
    console.error(`Deploy interrotto:\n- ${problems.join("\n- ")}`);
    process.exit(1);
  }
}

assertDeployableCheckout();
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
