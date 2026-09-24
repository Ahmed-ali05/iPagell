import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import ts from "typescript";

const locales = ["it", "de", "fr", "en"];
const catalog = Object.fromEntries(await Promise.all(locales.map(async locale => [locale, JSON.parse(await readFile(`lib/i18n/messages/${locale}.json`, "utf8"))])));
const reference = Object.keys(catalog.it).sort();
const errors = [];
const placeholders = text => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort().join(",");
for (const locale of locales) {
  const keys = Object.keys(catalog[locale]).sort();
  const missing = reference.filter(key => !keys.includes(key));
  const extra = keys.filter(key => !reference.includes(key));
  if (missing.length || extra.length) errors.push(`${locale}: missing ${missing.join(", ") || "none"}; extra ${extra.join(", ") || "none"}`);
  for (const key of reference) {
    if (!catalog[locale][key]?.trim()) errors.push(`${locale}: empty ${key}`);
    if (placeholders(catalog[locale][key] ?? "") !== placeholders(catalog.it[key])) errors.push(`${locale}: placeholders differ in ${key}`);
  }
}
async function sources(dir) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await sources(path));
    else if (/\.[cm]?[jt]sx?$/.test(path) && (!path.includes("/ui/") || path === "components/ui/dialog.tsx")) result.push(await readFile(path, "utf8"));
  }
  return result;
}
const source = (await Promise.all([sources("app"), sources("components"), sources("lib"), readFile("scripts/generate-precache.mjs", "utf8"), readFile("scripts/localized-manifest.mjs", "utf8")])).flat().join("\n");
const unused = reference.filter(key => !source.includes(`"${key}"`));
if (unused.length) errors.push(`Unused keys: ${unused.join(", ")}`);

// Migrated JSX is checked for new literal UI copy. Unmigrated modules remain outside this gate.
const allowLiteral = new Set(["iP", "iPagell", "AA"]);
for (const [path, ranges] of [
  ["components/landing-content.tsx", []],
  ["components/account-gate.tsx", []],
  ["components/entry-dialog.tsx", []],
  ["components/ipagell-app.tsx", []],
  ["components/absences-view.tsx", []],
  ["components/stats-view.tsx", []],
  ["components/classes-view.tsx", []],
  ["components/class-events-panel.tsx", []],
  ["components/account-security.tsx", []],
  ["components/install-app.tsx", []],
]) {
  const code = await readFile(path, "utf8");
  const positions = ranges.length ? ranges.map(([start, end]) => [code.indexOf(start), code.indexOf(end)]) : [[0, code.length]];
  const file = ts.createSourceFile(path, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  function visit(node) {
    if (positions.some(([start, end]) => node.pos >= start && node.end <= end)) {
      let literal = null;
      if (ts.isJsxText(node)) literal = node.text.trim();
      if (ts.isJsxAttribute(node) && ["aria-label", "title", "text", "placeholder"].includes(node.name.text) && node.initializer && ts.isStringLiteral(node.initializer)) literal = node.initializer.text.trim();
      if (literal && /\p{L}/u.test(literal) && !allowLiteral.has(literal)) {
        const line = file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1;
        errors.push(`${path}:${line}: hardcoded migrated UI text: ${literal}`);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
}

if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
else console.log(`i18n: ${reference.length} complete, referenced keys across ${locales.join("/")}`);
