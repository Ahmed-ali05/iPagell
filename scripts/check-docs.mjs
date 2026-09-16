import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Deliberately offline: check repository-local Markdown destinations, not live URLs.
const root = fileURLToPath(new URL("../", import.meta.url));
const files = ["README.md", "CONTRIBUTING.md", "SECURITY.md", "CHANGELOG.md"];
for (const name of await readdir(resolve(root, "docs"))) {
  if (name.endsWith(".md")) files.push(`docs/${name}`);
}
let links = 0;
const failures = [];
for (const file of files) {
  const content = await readFile(resolve(root, file), "utf8");
  const prose = content.replace(/```[\s\S]*?```/g, "");
  for (const match of prose.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const destination = match[1].trim().replace(/^<|>$/g, "");
    if (/^(?:[a-z][a-z0-9+.-]*:|#)/i.test(destination)) continue;
    const path = decodeURIComponent(destination.split("#")[0]);
    if (!path) continue;
    links++;
    try {
      await stat(resolve(root, dirname(file), path));
    } catch {
      failures.push(`${file}: collegamento inesistente → ${destination}`);
    }
  }
}
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`${files.length} documenti, ${links} collegamenti locali verificati.`);
  console.log("Esclusi: URL esterni, ancore, link reference-style e correttezza del contenuto.");
}
