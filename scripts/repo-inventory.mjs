import { readFile, readdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = new URL("../", import.meta.url);
const read = path => readFile(new URL(path, root), "utf8");
const document = new URL("docs/REPO-INVENTORY.md", root);
const checking = process.argv.slice(2).includes("--check");
async function walk(directory) {
  const paths = [];
  for (const entry of await readdir(new URL(directory, root), { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) paths.push(...await walk(path));
    else paths.push(path);
  }
  return paths.sort();
}
const methods = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]);
const api = [];
for (const path of (await walk("app/api")).filter(path => path.endsWith("/route.ts"))) {
  const source = ts.createSourceFile(path, await read(path), ts.ScriptTarget.Latest, true);
  const exported = [];
  for (const node of source.statements) {
    if (!node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) continue;
    if (ts.isFunctionDeclaration(node) && node.name && methods.has(node.name.text)) exported.push(node.name.text);
    if (ts.isVariableStatement(node)) for (const declaration of node.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && methods.has(declaration.name.text)) exported.push(declaration.name.text);
    }
  }
  const route = `/${path.replace(/^app\//, "").replace(/\/route\.ts$/, "").replace(/\[([^\]]+)\]/g, ":$1")}`;
  api.push(`| \`${route}\` | ${exported.join(", ")} | [route](../${path}) |`);
}
const schema = ts.createSourceFile("db/schema.ts", await read("db/schema.ts"), ts.ScriptTarget.Latest, true);
const tables = [];
function visit(node) {
  if (ts.isCallExpression(node) && node.expression.getText(schema) === "sqliteTable" && ts.isStringLiteral(node.arguments[0])) tables.push(node.arguments[0].text);
  ts.forEachChild(node, visit);
}
visit(schema);
const migrations = (await readdir(new URL("drizzle/", root))).filter(name => /^\d{4}_.+\.sql$/.test(name)).sort();
const journal = JSON.parse(await read("drizzle/meta/_journal.json"));
if (JSON.stringify(migrations) !== JSON.stringify(journal.entries.map(entry => `${entry.tag}.sql`).sort())) throw new Error("Migrazioni SQL e journal Drizzle non coincidono.");
const pkg = JSON.parse(await read("package.json"));
const lock = JSON.parse(await read("package-lock.json"));
const it = JSON.parse(await read("lib/i18n/messages/it.json"));
const dependencyRows = [];
for (const group of ["dependencies", "devDependencies"]) for (const [name, version] of Object.entries(pkg[group] ?? {}).sort(([a], [b]) => a.localeCompare(b, "en"))) {
  const entry = lock.packages[`node_modules/${name}`];
  // npm records file dependencies as links to a second lockfile entry.
  const resolved = (entry?.link ? lock.packages[entry.resolved] : entry)?.version;
  if (!resolved) throw new Error(`Dipendenza ${name} assente dal lockfile.`);
  if (lock.packages[""][group]?.[name] !== version) throw new Error(`package.json e lockfile divergono per ${name}.`);
  dependencyRows.push(`| \`${name}\` | ${group === "dependencies" ? "app" : "tooling/test"} | \`${version}\` | \`${resolved}\` |`);
}
const content = `# Inventario verificabile della repository

Generato da \`scripts/repo-inventory.mjs\` leggendo il sorgente, senza rete o dati utente. Non descrive l'infrastruttura di produzione. Per rigenerare: \`npm run docs:generate\`; \`npm run docs:check\` rifiuta un inventario obsoleto. Non modificare questa tabella a mano.

## Metadati

| Campo | Valore |
|---|---|
| Pacchetto | \`${pkg.name}@${pkg.version}\` |
| Node dichiarato | \`${pkg.engines.node}\` |
| Lockfile | ${lock.lockfileVersion} |
| Cataloghi | it, de, fr, en; ${Object.keys(it).length} chiavi nel riferimento italiano |
| Schema D1 versionato | ${tables.length} tabelle |
| Migrazioni | ${migrations.length}, SQL e journal concordanti |
| File route API | ${api.length} |

## API esportate

L'elenco verifica presenza e metodi, non permessi o forma dei payload: vedere [Contratto API](API.md).

| Percorso | Metodi | File |
|---|---|---|
${api.join("\n")}

## Tabelle D1

Da [schema](../db/schema.ts); l'esistenza nel sorgente non prova l'applicazione delle migrazioni remote.

${tables.map(table => `- \`${table}\``).join("\n")}

## Migrazioni

${migrations.map(name => `- [${name}](../drizzle/${name})`).join("\n")}

## Script npm

| Script | Comando |
|---|---|
${Object.entries(pkg.scripts).map(([name, command]) => `| \`${name}\` | \`${command}\` |`).join("\n")}

## Dipendenze dirette

Versioni dichiarate in \`package.json\` e risolte in \`package-lock.json\`. La classificazione segue il manifest; non misura quali pacchetti entrino nel bundle. Per un audit eseguire il comando dedicato.

| Pacchetto | Gruppo | Dichiarata | Risolta |
|---|---|---|---|
${dependencyRows.join("\n")}
`;
if (checking) {
  const saved = await readFile(document, "utf8").catch(() => "");
  if (saved !== content) {
    console.error("Inventario repository obsoleto: eseguire npm run docs:generate e includere docs/REPO-INVENTORY.md.");
    process.exitCode = 1;
  } else console.log(`Inventario allineato: ${api.length} route API, ${tables.length} tabelle, ${migrations.length} migrazioni.`);
} else {
  await writeFile(document, content);
  console.log(`Aggiornato ${fileURLToPath(document)}`);
}
